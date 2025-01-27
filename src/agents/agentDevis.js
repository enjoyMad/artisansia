const supabase = require("../config/supabase");

/**
 * Agent pour gérer la création de devis.
 * @param {String} userPrompt - Message de l'utilisateur.
 * @param {String} chatId - ID du chat Telegram.
 * @returns {String} - Réponse à envoyer.
 */
async function agentDevis(userPrompt, chatId) {
  try {
    // Extraire les informations du message
    const serviceMatch = userPrompt.match(/service:\s*([\w\s]+)/i);
    const prixMatch = userPrompt.match(/prix:\s*(\d+)/i);
    const quantiteMatch = userPrompt.match(/quantité:\s*(\d+)/i);

    if (!serviceMatch || !prixMatch || !quantiteMatch) {
      return "Je n'ai pas pu trouver toutes les informations nécessaires pour créer le devis. Veuillez préciser :\n`service: peinture, prix: 50, quantité: 2`.";
    }

    const service = serviceMatch[1].trim();
    const prix_unitaire = parseFloat(prixMatch[1]);
    const quantite = parseInt(quantiteMatch[1], 10);

    // Insertion dans Supabase
    const { error } = await supabase.from("devis").insert([
      {
        service,
        prix_unitaire,
        quantite,
        total: prix_unitaire * quantite,
        date_creation: new Date(),
      },
    ]);

    if (error) {
      console.error("Erreur Supabase (création devis) :", error);
      return "Une erreur est survenue lors de la création du devis.";
    }

    return `Le devis a été créé avec succès pour le service **${service}**, au prix unitaire de **${prix_unitaire}€** pour une quantité de **${quantite}**. Total : **${prix_unitaire * quantite}€**.`;
  } catch (error) {
    console.error("Erreur dans l'agent devis :", error);
    return "Une erreur est survenue lors du traitement de la demande.";
  }
}

module.exports = { agentDevis };
