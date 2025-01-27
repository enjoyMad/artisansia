const express = require("express");
const axios = require("axios");
const router = express.Router();
const supabase = require("../config/supabase");

const { sendMessageToTelegram } = require("../services/telegramService");
const { agentDevis } = require("../agents/agentDevis");
const { agentFacturation } = require("../agents/agentFacturation");
const { agentPlanning } = require("../agents/agentPlanning");
const { getUserContext, setUserContext, clearUserContext } = require("../services/contextService");


// Fonction pour gérer les intentions et les agents
async function determineAgentAndRespond(text, chatId, userContext) {
  try {
    let response;

    // Vérifier s'il existe un contexte en attente pour cet utilisateur
    if (userContext && userContext.pendingAction) {
      console.log("Contexte détecté :", userContext);

      if (userContext.pendingAction === "create_devis") {
        // Appel à l'agent Devis pour compléter le devis
        response = await agentDevis(text, chatId);
      } else if (userContext.pendingAction === "create_rdv") {
        // Appel à l'agent Planning pour compléter un rendez-vous
        response = await agentPlanning(text, chatId);
      } else {
        response = "Je ne suis pas sûr de comprendre votre demande.";
      }
    } else {
      // Analyser le texte pour détecter l'intention
      const lowerText = text.toLowerCase();
      if (lowerText.includes("devis") || lowerText.includes("offre")) {
        console.log("Appel à l'agent Devis...");
        response = await agentDevis(text, chatId);
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
        response = await agentPlanning(text, chatId);
      } else {
        response =
          "Je ne suis pas sûr de comprendre votre demande. Parlez-vous d'un devis, d'une facture ou d'un rendez-vous ?";
      }
    }

    // Si aucune réponse n'est générée
    if (!response) {
      response =
        "Désolé, je n'ai pas pu traiter votre demande. Essayez à nouveau.";
    }

    console.log("Réponse générée :", response);

    // Envoie la réponse à Telegram
    await sendMessageToTelegram(chatId, response);
  } catch (error) {
    console.error("Erreur lors de la détermination de l'agent :", error);
    await sendMessageToTelegram(
      chatId,
      "Une erreur interne est survenue. Veuillez réessayer plus tard."
    );
  }
}

// Fonction pour traiter les interactions avec les boutons Telegram
async function handleCallbackQuery(callbackQuery) {
  try {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data; // La valeur du bouton cliqué
    console.log(`Callback reçu : ${data}`);

    if (data === "confirm_devis") {
      const userContext = await getUserContext(chatId);

      if (userContext && userContext.pendingAction === "create_devis") {
        const { nom_client, service, prix_unitaire, quantite, total } = userContext.data;

        // Insérer le devis dans la base de données
        const { error } = await supabase
          .from("devis")
          .insert([{ nom_client, service, prix_unitaire, quantite, total, date_creation: new Date() }]);

        if (error) {
          console.error("Erreur lors de la création du devis :", error);
          await sendMessageToTelegram(chatId, "Une erreur est survenue lors de la création du devis.");
        } else {
          await sendMessageToTelegram(chatId, "Le devis a été créé avec succès !");
        }

        await clearUserContext(chatId);
      }
    } else if (data === "cancel_devis") {
      await clearUserContext(chatId);
      await sendMessageToTelegram(chatId, "Action annulée.");
    } else {
      await sendMessageToTelegram(chatId, "Je n'ai pas compris votre demande.");
    }
  } catch (error) {
    console.error("Erreur lors du traitement du callback :", error);
  }
}

// Route pour gérer les messages Telegram
router.post("/telegram", async (req, res) => {
  try {
    const { message, callback_query } = req.body;

    if (callback_query) {
      // Gérer les clics sur les boutons
      await handleCallbackQuery(callback_query);
      return res.sendStatus(200);
    }

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
