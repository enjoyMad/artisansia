const express = require("express");
const axios = require("axios");
const router = express.Router();

const { agentDevis } = require("../agents/agentDevis");
const { agentFacturation } = require("../agents/agentFacturation");
const { agentPlanning } = require("../agents/agentPlanning");
const { getUserContext, setUserContext, clearUserContext } = require("../services/contextService");

// Fonction pour envoyer un message à Telegram
async function sendMessageToTelegram(chatId, text) {
  try {
    const TELEGRAM_API_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await axios.post(TELEGRAM_API_URL, {
      chat_id: chatId,
      text,
    });
    console.log("Message envoyé à Telegram :", response.data);
  } catch (error) {
    console.error(
      "Erreur lors de l'envoi du message à Telegram :",
      error.response?.data || error.message
    );
  }
}

// Fonction pour déterminer l'agent à appeler
async function determineAgentAndRespond(text, chatId, userContext) {
  try {
    let response;

    // Si un contexte existe, continuer l'interaction en fonction du contexte
    if (userContext && userContext.pendingAction) {
      console.log("Contexte détecté :", userContext);

      if (userContext.pendingAction === "create_devis") {
        // Exemple : Compléter un devis
        const [service, prix, quantite] = text.match(/\w+/g); // Simplification : Ajuste les mots-clés extraits
        response = `Le devis pour ${userContext.client} est prêt : ${service}, ${prix}€/h, quantité ${quantite}. Total : ${
          prix * quantite
        }€`;

        // Nettoie le contexte après traitement
        await clearUserContext(chatId);
      } else {
        response = "Je ne suis pas sûr de comprendre votre demande.";
      }
    } else {
      // Analyse du texte pour détecter l'intention s'il n'y a pas de contexte
      const lowerText = text.toLowerCase();
      if (
        lowerText.includes("devis") ||
        lowerText.includes("proposer") ||
        lowerText.includes("offre")
      ) {
        console.log("Appel à l'agent Devis...");
        const client = text.match(/pour (.+)$/)?.[1] || "un client inconnu";
        await setUserContext(chatId, { pendingAction: "create_devis", client: client });
        response = `D'accord, créons un devis pour ${client}. Quel est le service, le prix unitaire et la quantité ?`;
      } else if (
        lowerText.includes("facture") ||
        lowerText.includes("paiement") ||
        lowerText.includes("impayé")
      ) {
        console.log("Appel à l'agent Facturation...");
        response = await agentFacturation(text);
      } else if (
        lowerText.includes("rendez-vous") ||
        lowerText.includes("planning") ||
        lowerText.includes("créneau")
      ) {
        console.log("Appel à l'agent Planning...");
        response = await agentPlanning(text);
      } else {
        response =
          "Je ne suis pas sûr de comprendre votre demande. Parlez-vous d'un devis, d'une facture ou d'un rendez-vous ?";
      }
    }

    // Si la réponse est vide ou non définie
    if (!response) {
      response =
        "Désolé, je n'ai pas pu traiter votre demande. Essayez à nouveau.";
    }

    console.log("Réponse générée :", response);

    // Envoie la réponse à l'utilisateur via Telegram
    await sendMessageToTelegram(chatId, response);
  } catch (error) {
    console.error("Erreur lors de la détermination de l'agent :", error);
    await sendMessageToTelegram(
      chatId,
      "Une erreur interne est survenue. Veuillez réessayer plus tard."
    );
  }
}

// Route pour gérer les messages Telegram
router.post("/telegram", async (req, res) => {
  try {
    // Vérifie que la requête contient bien les données nécessaires
    const { message } = req.body;
    if (!message || !message.text || !message.chat || !message.chat.id) {
      console.error("Requête invalide : données manquantes dans le body.");
      return res.status(400).json({ error: "Requête invalide" });
    }

    const chatId = message.chat.id;
    const text = message.text.trim(); // Supprime les espaces inutiles
    console.log(`Message reçu : "${text}" de l'utilisateur ${chatId}`);

    // Récupérer le contexte utilisateur depuis Supabase
    const userContext = await getUserContext(chatId);

    // Détermine l'agent à appeler et répond
    await determineAgentAndRespond(text, chatId, userContext);

    // Répond au webhook Telegram pour confirmer la réception
    res.sendStatus(200);
  } catch (error) {
    console.error("Erreur dans le webhook Telegram :", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

module.exports = router;
