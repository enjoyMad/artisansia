const express = require("express");
const router = express.Router();
const { sendMessageToTelegram } = require("../services/telegramService");
const { agentDevis } = require("../agents/agentDevis");

/**
 * Fonction pour gérer les messages entrants de Telegram.
 */
router.post("/telegram", async (req, res) => {
  try {
    const { message } = req.body;

    // Validation : Vérifie si la requête contient les informations nécessaires
    if (!message || !message.text || !message.chat || !message.chat.id) {
      console.error("Requête invalide : données manquantes dans le body.");
      return res.status(400).json({ error: "Requête invalide : données manquantes" });
    }

    const chatId = message.chat.id;
    const text = message.text.trim();

    console.log(`Message reçu : "${text}" de l'utilisateur ${chatId}`);

    // Appeler l'agent correspondant pour traiter la demande
    let response;

    if (text.toLowerCase().includes("devis")) {
      console.log("Appel à l'agent Devis...");
      response = await agentDevis(text, chatId);
    } else {
      console.log("Aucun agent correspondant trouvé.");
      response =
        "Je ne suis pas sûr de comprendre votre demande. Essayez de mentionner un devis ou une autre tâche que je peux effectuer pour vous.";
    }

    // Envoyer la réponse à Telegram
    if (response) {
      await sendMessageToTelegram(chatId, response);
    } else {
      console.error("Aucune réponse générée par l'agent.");
    }

    // Répond au webhook pour confirmer la réception
    res.sendStatus(200);
  } catch (error) {
    console.error("Erreur dans le webhook :", error.message);
    await sendMessageToTelegram(
      message?.chat?.id || "inconnu",
      "Une erreur interne est survenue. Veuillez réessayer plus tard."
    );
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

module.exports = router;
