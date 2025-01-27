const axios = require("axios");

/**
 * Envoie un message à Telegram via l'API.
 * @param {String} chatId - ID du chat Telegram.
 * @param {String} text - Texte du message à envoyer.
 * @param {Array} buttons - (Optionnel) Boutons interactifs à ajouter au message.
 */
async function sendMessageToTelegram(chatId, text, buttons = null) {
  try {
    const TELEGRAM_API_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    const payload = {
      chat_id: chatId,
      text,
      parse_mode: "Markdown", // Permet de mettre en forme le texte
    };

    // Ajoute les boutons interactifs si fournis
    if (buttons) {
      payload.reply_markup = {
        inline_keyboard: buttons,
      };
    }

    // Log pour débogage
    console.log("Payload envoyé à Telegram :", JSON.stringify(payload, null, 2));
    console.log("URL Telegram :", TELEGRAM_API_URL);

    const response = await axios.post(TELEGRAM_API_URL, payload);
    console.log("Message envoyé à Telegram :", response.data);
  } catch (error) {
    console.error(
      "Erreur lors de l'envoi du message à Telegram :",
      error.response?.data || error.message
    );
  }
}

module.exports = { sendMessageToTelegram };
