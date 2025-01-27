require("dotenv").config();
const express = require("express");
const webhook = require("./routes/webhook");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware pour lire les requêtes JSON
app.use(express.json());

// Route Webhook pour Telegram
app.use("/webhook", webhook);

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
