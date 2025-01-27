const supabase = require("../config/supabase");

/**
 * Agent pour gérer les rendez-vous.
 * @param {String} userPrompt - Message de l'utilisateur.
 * @param {String} chatId - ID du chat Telegram.
 * @returns {String} - Réponse à envoyer.
 */
async function agentPlanning(userPrompt, chatId) {
  try {
    // Extraire les informations du message
    const nomClientMatch = userPrompt.match(/client:\s*([\w\s]+)/i);
    const dateRdvMatch = userPrompt.match(/date:\s*([\w\s:-]+)/i);

    if (!nomClientMatch || !dateRdvMatch) {
      return "Pour créer un rendez-vous, veuillez préciser le nom du client et la date, par exemple :\n`client: Mme Dupont, date: 2025-02-01 14:00`.";
    }

    const nom_client = nomClientMatch[1].trim();
    const date_rdv = new Date(dateRdvMatch[1].trim());
    const description = "Rendez-vous planifié."; // Exemple

    // Insérer le rendez-vous dans Supabase
    const { error } = await supabase
      .from("rendez_vous")
      .insert([{ nom_client, date_rdv, description }]);

    if (error) {
      console.error("Erreur Supabase (création rendez-vous) :", error);
      return "Une erreur est survenue lors de la création du rendez-vous.";
    }

    return `Le rendez-vous a été créé avec succès pour **${nom_client}** le **${date_rdv.toLocaleString()}**.`;
  } catch (error) {
    console.error("Erreur dans l’agent Planning :", error);
    return "Une erreur est survenue lors du traitement de la demande.";
  }
}

module.exports = { agentPlanning };
