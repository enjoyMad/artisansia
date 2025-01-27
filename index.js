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

// Vérification des variables d'environnement
const requiredEnvVars = ['TELEGRAM_BOT_TOKEN', 'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'OPENAI_API_KEY'];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`Erreur : Les variables d'environnement suivantes sont manquantes : ${missingEnvVars.join(', ')}`);
  process.exit(1); // Arrête le serveur si la configuration est incorrecte
}

// Middleware de gestion des CORS (utile si le serveur est appelé depuis des interfaces externes)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Route pour le webhook Telegram
app.use("/webhook", webhookRoutes);

// Route principale de test
app.get("/", (req, res) => {
  res.send("Serveur opérationnel !");
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error("Erreur serveur :", err.stack);
  res.status(500).json({ error: "Erreur interne du serveur" });
});

// Gestion des routes non trouvées
app.use((req, res, next) => {
  res.status(404).json({ error: "Route non trouvée" });
});

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
