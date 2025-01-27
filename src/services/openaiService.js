require('dotenv').config();
const { OpenAI } = require('openai');

// Crée une instance de l'API OpenAI avec la clé API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Charge la clé API depuis le .env
});

/**
 * Fonction générique pour interroger ChatGPT
 * @param {String} prompt - Le prompt envoyé à OpenAI
 * @param {String} agentName - Nom de l'agent pour personnaliser le comportement
 * @returns {Promise<String>} - Réponse de l'IA
 */
async function queryOpenAI(prompt, agentName) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4", // Utilise gpt-4 ou gpt-3.5-turbo selon les besoins
      messages: [
        { role: "system", content: `Tu es un agent ${agentName}.` },
        { role: "user", content: prompt },
      ],
      temperature: 0.7, // Ajuste la température pour varier les réponses
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Erreur OpenAI :", error);
    return "Désolé, une erreur s'est produite côté IA.";
  }
}

module.exports = { queryOpenAI };
