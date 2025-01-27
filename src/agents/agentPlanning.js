// src/agents/agentPlanning.js
const supabase = require('../config/supabase');
const { queryOpenAI } = require('../services/openaiService');
const { setUserContext, clearUserContext } = require('../services/contextService');

async function agentPlanning(userPrompt, chatId) {
  try {
    // Étape 1 : Vérifier si l'utilisateur fournit les informations pour créer un rendez-vous
    const dateMatch = userPrompt.match(/date:\s*(\d{4}-\d{2}-\d{2})/i);
    const heureMatch = userPrompt.match(/heure:\s*(\d{2}:\d{2})/i);

    if (dateMatch && heureMatch) {
      // Si les informations nécessaires sont présentes, créer un rendez-vous
      const date = dateMatch[1];
      const heure = heureMatch[1];

      const { data, error } = await supabase
        .from('planning')
        .insert([
          {
            nom_client: "Client inconnu", // Peut être récupéré depuis le contexte ou personnalisé
            date_rdv: date,
            heure_rdv: heure,
            status: "réservé",
            date_creation: new Date()
          }
        ]);

      if (error) {
        console.error("Erreur lors de la création du rendez-vous :", error);
        return "Une erreur est survenue lors de la planification du rendez-vous.";
      }

      await clearUserContext(chatId); // Efface le contexte après la création
      return `Le rendez-vous a été planifié avec succès pour le ${date} à ${heure}.`;
    }

    // Étape 2 : Si les informations sont incomplètes, demander des précisions
    if (!dateMatch || !heureMatch) {
      await setUserContext(chatId, { pendingAction: "create_rdv" });
      return "Pour planifier un rendez-vous, j'ai besoin de connaître la date et l'heure. Pouvez-vous fournir ces informations au format : 'date: 2025-02-01, heure: 10:00' ?";
    }

    // Étape 3 : Liste des créneaux disponibles
    const { data: rdvs, error } = await supabase
      .from('planning')
      .select('*')
      .eq('status', 'disponible');

    let ragData = "Aucun créneau disponible.";
    if (rdvs && rdvs.length > 0) {
      const formattedRdvs = rdvs
        .map(r => `ID:${r.id}, date=${r.date_rdv}, heure=${r.heure_rdv}`)
        .join("\n");
      ragData = `Créneaux disponibles :\n${formattedRdvs}`;
    }

    // Étape 4 : Préparer le prompt pour OpenAI
    const finalPrompt = `
      Tu es un assistant spécialisé dans la gestion de planning.
      Voici les créneaux disponibles : 
      ${ragData}

      Question de l'utilisateur : 
      ${userPrompt}
    `;

    // Étape 5 : Appeler OpenAI pour générer une réponse
    const response = await queryOpenAI(finalPrompt, 'planning');
    return response;

  } catch (error) {
    console.error("Erreur dans l'agent Planning :", error);
    return "Une erreur est survenue lors du traitement de la demande.";
  }
}

module.exports = { agentPlanning };
