const supabase = require('../config/supabase');
const { queryOpenAI } = require('../services/openaiService');

async function agentDevis(userPrompt) {
  try {
    // Étape 1 : Vérification des informations dans le message utilisateur
    const keywords = ["service", "prix", "quantité"];
    const hasEnoughInfo = keywords.every((kw) => userPrompt.toLowerCase().includes(kw));

    if (!hasEnoughInfo) {
      return "Pour créer un devis, j'ai besoin de plus d'informations : précisez le service à proposer, le prix unitaire, et la quantité.";
    }

    // Étape 2 : Récupération des données Supabase
    const { data: devis, error } = await supabase
      .from('devis')
      .select('*');

    if (error) {
      console.error('Erreur Supabase :', error);
      return "Une erreur est survenue lors de la récupération des données des devis.";
    }

    // Étape 3 : Préparer les données pour le prompt
    let ragData = "Aucun devis trouvé.";
    if (devis && devis.length > 0) {
      // Formater les données pour le prompt
      const formattedDevis = devis
        .map((d) => `Devis #${d.id}: client=${d.nom_client}, service=${d.service}, prix=${d.prix_unitaire}€, quantité=${d.quantite}`)
        .join("\n");
      ragData = `Liste des devis existants :\n${formattedDevis}`;
    }

    // Étape 4 : Construire le prompt
    const finalPrompt = `
      Tu es un assistant spécialisé dans la création de devis pour artisans.
      Voici les données pertinentes :
      ${ragData}

      Question de l'utilisateur :
      ${userPrompt}
    `;

    // Étape 5 : Appeler OpenAI pour obtenir une réponse
    const response = await queryOpenAI(finalPrompt, 'devis');
    return response;
  } catch (error) {
    console.error('Erreur dans l’agent Devis :', error);
    return "Une erreur est survenue lors du traitement de la demande.";
  }
}

module.exports = { agentDevis };
