const cron = require('node-cron');
const supabase = require('../config/supabase');
const { sendMessageToTelegram } = require('../routes/webhook');

// Vérifie les factures impayées toutes les heures
cron.schedule('0 * * * *', async () => {
  console.log("Vérification des factures impayées...");

  // Récupérer les factures impayées
  const { data: factures, error } = await supabase
    .from('factures')
    .select('*')
    .eq('statut', 'impayée');

  if (error) {
    console.error("Erreur lors de la récupération des factures :", error);
    return;
  }

  // Envoyer une notification pour chaque facture impayée
  for (const facture of factures) {
    const message = `Rappel : La facture #${facture.id} pour ${facture.nom_client} (Montant : ${facture.montant}€) est toujours impayée. Voulez-vous envoyer une relance ?`;
    await sendMessageToTelegram(facture.chat_id, message);
  }
});
