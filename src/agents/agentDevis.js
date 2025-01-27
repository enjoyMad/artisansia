const supabase = require('../config/supabase');
const { setUserContext, clearUserContext, getUserContext } = require('../services/contextService');
const { sendMessageToTelegram } = require('../services/telegramService'); // Correction de l'importation

/**
 * Agent pour gérer la création de devis.
 * @param {String} userPrompt - Message de l'utilisateur.
 * @param {String} chatId - ID du chat Telegram.
 * @returns {String|null} - Réponse à envoyer ou null si la réponse est gérée via des boutons.
 */
async function agentDevis(userPrompt, chatId) {
  try {
    // Étape 1 : Vérification si un contexte existe pour cet utilisateur
    const userContext = await getUserContext(chatId);

    // Si le contexte indique une action en cours
    if (userContext && userContext.pendingAction === "create_devis") {
      const { service, prix_unitaire, quantite, total, nom_client } = userContext;

      // Si l'utilisateur confirme le devis
      if (userPrompt.toLowerCase() === "oui") {
        const { error } = await supabase
          .from('devis')
          .insert([
            {
              nom_client: nom_client || "Client inconnu", // Utilisation du nom du client si présent
              service,
              prix_unitaire,
              quantite,
              date_creation: new Date()
              // 'total' est une colonne générée, donc ne pas l'insérer
            }
          ]);

        if (error) {
          console.error('Erreur Supabase (création devis) :', error);
          return "Une erreur est survenue lors de la création du devis.";
        }

        // Effacer le contexte après la création
        await clearUserContext(chatId);

        return `Le devis a été créé avec succès : Service - ${service}, Prix unitaire - ${prix_unitaire}€, Quantité - ${quantite}, Total - ${total}€.`;
      }

      // Si l'utilisateur annule le devis
      if (userPrompt.toLowerCase() === "non") {
        await clearUserContext(chatId);
        return "Le devis a été annulé. Si vous souhaitez recommencer, fournissez les détails du devis.";
      }

      // Si une réponse autre que Oui/Non est donnée
      return "Veuillez répondre par Oui ou Non pour confirmer ou annuler la création du devis.";
    }

    // Étape 2 : Nouvelle demande sans contexte
    const serviceMatch = userPrompt.match(/service:\s*([\w\s]+)/i);
    const prixMatch = userPrompt.match(/prix:\s*(\d+)/i);
    const quantiteMatch = userPrompt.match(/quantité:\s*(\d+)/i);

    if (!serviceMatch || !prixMatch || !quantiteMatch) {
      // Si les informations sont incomplètes, demander plus de détails
      await setUserContext(chatId, { pendingAction: "create_devis" });
      return "Pour créer un devis, j'ai besoin de plus d'informations. Veuillez préciser le service, le prix unitaire et la quantité, par exemple : 'service: peinture, prix: 50, quantité: 2'.";
    }

    // Étape 3 : Extraction des informations et confirmation
    const service = serviceMatch[1].trim();
    const prix = parseFloat(prixMatch[1]);
    const quantite = parseInt(quantiteMatch[1], 10);
    const total = prix * quantite;

    // Enregistrer le contexte et demander confirmation
    await setUserContext(chatId, {
      pendingAction: "create_devis",
      nom_client: "Client inconnu", // À remplacer si le client est précisé
      service,
      prix_unitaire: prix,
      quantite,
      total
    });

    // Envoyer un message avec des boutons interactifs pour confirmer ou annuler
    await sendMessageToTelegram(chatId, `Je vais créer un devis pour ${service} (Prix : ${prix}€, Quantité : ${quantite}, Total : ${total}€). Voulez-vous confirmer ?`, [
      [
        { text: "Oui", callback_data: "confirm_devis" },
        { text: "Non", callback_data: "cancel_devis" }
      ]
    ]);

    return null; // Pas besoin de renvoyer un texte puisque les boutons prennent le relais
  } catch (error) {
    console.error('Erreur dans l’agent Devis :', error);
    return "Une erreur est survenue lors du traitement de la demande.";
  }
}

module.exports = { agentDevis };
