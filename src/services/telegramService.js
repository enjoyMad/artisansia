const axios = require("axios");

async function sendMessageToTelegram(chatId, text) {
  try {
    const TELEGRAM_API_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    const payload = { chat_id: chatId, text, parse_mode: "Markdown" };

    const response = await axios.post(TELEGRAM_API_URL, payload);
    console.log("Message envoyé à Telegram :", response.data);
  } catch (error) {
    console.error("Erreur lors de l'envoi du message à Telegram :", error);
  }
}

module.exports = { sendMessageToTelegram };
