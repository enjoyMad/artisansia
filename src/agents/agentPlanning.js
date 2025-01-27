// src/agents/agentPlanning.js
const supabase = require('../config/supabase');
const { queryOpenAI } = require('../services/openaiService');

async function agentPlanning(userPrompt) {
  const { data: rdvs, error } = await supabase
    .from('planning')
    .select('*')
    .eq('status', 'disponible');

  let ragData = "Aucun créneau disponible.";
  if (rdvs && rdvs.length > 0) {
    const formatedRdvs = rdvs.map(r => `ID:${r.id}, date=${r.date_rdv}, heure=${r.heure_rdv}`).join("\n");
    ragData = `Créneaux disponibles:\n${formatedRdvs}`;
  }

  const finalPrompt = `
  Tu es un assistant spécialisé dans la gestion de planning.
  Voici les créneaux disponibles : 
  ${ragData}

  Question de l'utilisateur : 
  ${userPrompt}
  `;

  const response = await queryOpenAI(finalPrompt, 'planning');
  return response;
}

module.exports = { agentPlanning };
