const axios = require("axios");

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
  
      const response = await axios.post(TELEGRAM_BOT_TOKEN, payload);
      console.log("Message envoyé à Telegram :", response.data);
    } catch (error) {
      console.error(
        "Erreur lors de l'envoi du message à Telegram :",
        error.response?.data || error.message
      );
    }
  }