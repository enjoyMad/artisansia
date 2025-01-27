// index.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const webhookRoutes = require('./src/routes/webhook');

const app = express();

// Middleware pour parser les requêtes JSON
app.use(bodyParser.json());

// Log chaque requête reçue (utile pour le débogage)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Vérifie si les variables d'environnement nécessaires sont définies
if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error("Erreur : La variable d'environnement TELEGRAM_BOT_TOKEN est manquante.");
  process.exit(1); // Arrête le serveur si la configuration est incorrecte
}

// Route pour le webhook Telegram
app.use("/webhook", webhookRoutes);

// Route de test
app.get("/", (req, res) => {
  res.send("Serveur opérationnel !");
});

// Gestion globale des erreurs
app.use((err, req, res, next) => {
  console.error("Erreur serveur :", err.stack);
  res.status(500).json({ error: "Erreur interne du serveur" });
});

// Démarre le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
