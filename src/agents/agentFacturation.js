const supabase = require("../config/supabase");

/**
 * Agent pour gérer la facturation.
 * @param {String} userPrompt - Message de l'utilisateur.
 * @param {String} chatId - ID du chat Telegram.
 * @returns {String} - Réponse à envoyer.
 */
async function agentFacturation(userPrompt, chatId) {
  try {
    // Rechercher les factures impayées
    const { data: factures, error } = await supabase
      .from("factures")
      .select("*")
      .eq("statut", "impayée");

    if (error) {
      console.error("Erreur Supabase (récupération factures) :", error);
      return "Une erreur est survenue lors de la récupération des factures.";
    }

    if (factures.length === 0) {
      return "Il n'y a aucune facture impayée pour le moment.";
    }

    // Construire une réponse avec les factures impayées
    let response = "Voici les factures impayées :\n";
    factures.forEach(facture => {
      response += `- Facture #${facture.id} pour **${facture.nom_client}** : **${facture.montant}€**\n`;
    });

    return response;
  } catch (error) {
    console.error("Erreur dans l’agent Facturation :", error);
    return "Une erreur est survenue lors du traitement de votre demande.";
  }
}

module.exports = { agentFacturation };
