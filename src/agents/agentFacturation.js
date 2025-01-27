const supabase = require('../config/supabase');
const { queryOpenAI } = require('../services/openaiService');
const { setUserContext, clearUserContext, getUserContext } = require('../services/contextService');
const { sendMessageToTelegram } = require('../services/telegramService'); // Import correct

/**
 * Agent pour gérer la facturation.
 * @param {String} userPrompt - Message de l'utilisateur.
 * @param {String} chatId - ID du chat Telegram.
 * @returns {String} - Réponse à envoyer.
 */
async function agentFacturation(userPrompt, chatId) {
  try {
    // Exemple de logique pour relancer une facture impayée
    const { data: factures, error } = await supabase
      .from('factures')
      .select('*')
      .eq('statut', 'impayée');

    if (error) {
      console.error('Erreur Supabase (récupération factures) :', error);
      return "Une erreur est survenue lors de la récupération des factures.";
    }

    if (factures.length === 0) {
      return "Il n'y a aucune facture impayée pour le moment.";
    }

    let response = "Factures impayées :\n";
    factures.forEach(facture => {
      response += `- Facture #${facture.id} pour ${facture.nom_client} : ${facture.montant}€\n`;
    });

    return response;
  } catch (error) {
    console.error('Erreur dans l’agent Facturation :', error);
    return "Une erreur est survenue lors du traitement de votre demande.";
  }
}

module.exports = { agentFacturation };
