// src/agents/agentFacturation.js
const supabase = require('../config/supabase');
const { queryOpenAI } = require('../services/openaiService');

async function agentFacturation(userPrompt) {
  const { data: factures, error } = await supabase
    .from('factures')
    .select('*')
    .eq('statut', 'impayée');

  let ragData = "Aucune facture impayée.";
  if (factures && factures.length > 0) {
    const formatedFactures = factures.map(f => `Facture #${f.id}: client=${f.nom_client}, montant=${f.montant}€`).join("\n");
    ragData = `Factures impayées:\n${formatedFactures}`;
  }

  const finalPrompt = `
  Tu es un assistant spécialisé en facturation.
  Voici les données pertinentes : 
  ${ragData}

  Question de l'utilisateur : 
  ${userPrompt}
  `;

  const response = await queryOpenAI(finalPrompt, 'facturation');
  return response;
}

module.exports = { agentFacturation };
