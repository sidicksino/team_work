require('dotenv').config();  // Charger les variables d'environnement

const mysql = require('mysql');

const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,         // optionnel si le port par défaut (3306)
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

db.connect(err => {
  if (err) {
    console.error('Erreur de connexion à la base:', err);
  } else {
    console.log('✅ Connecté à MySQL (FreeSQLDatabase)');
  }
});

module.exports = db;
