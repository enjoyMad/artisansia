const supabase = require('../config/supabase');

/**
 * Récupérer le contexte d'un utilisateur
 * @param {String} chatId
 * @returns {Object} Contexte ou null si aucun contexte
 */
async function getUserContext(chatId) {
  const { data, error } = await supabase
    .from('context')
    .select('context')
    .eq('chat_id', chatId)
    .single();

  if (error) {
    console.error("Erreur lors de la récupération du contexte :", error);
    return null;
  }
  return data ? data.context : null;
}

/**
 * Mettre à jour le contexte d'un utilisateur
 * @param {String} chatId
 * @param {Object} context
 * @returns {Boolean} Succès ou échec
 */
async function setUserContext(chatId, context) {
  const { data, error } = await supabase
    .from('context')
    .upsert({ chat_id: chatId, context: context });

  if (error) {
    console.error("Erreur lors de la mise à jour du contexte :", error);
    return false;
  }
  return true;
}

/**
 * Supprimer le contexte d'un utilisateur
 * @param {String} chatId
 * @returns {Boolean} Succès ou échec
 */
async function clearUserContext(chatId) {
  const { data, error } = await supabase
    .from('context')
    .delete()
    .eq('chat_id', chatId);

  if (error) {
    console.error("Erreur lors de la suppression du contexte :", error);
    return false;
  }
  return true;
}

/**
 * Mettre à jour le contexte pour une confirmation
 * @param {String} chatId
 * @param {String} action - Action à confirmer (ex. : create_devis)
 * @param {Object} data - Données associées à l'action
 */
async function setConfirmation(chatId, action, data) {
  const context = {
    pendingAction: action,
    confirmationRequired: true,
    data
  };
  await setUserContext(chatId, context);
}


module.exports = { getUserContext, setUserContext, clearUserContext };
