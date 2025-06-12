const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
require('dotenv').config();
const session = require('express-session');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname, 'public'))); // en premier
app.use(cors());

// SESSION DOIT ÊTRE PLACÉ AVANT bodyParser
app.use(session({
  secret: 'sidick_secret_123',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 86400000
  }
}));

// Body parser ensuite
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // optionnel mais utile

// Route GET racine
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// Connexion MySQL
const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,  // <-- ce port est 3306 pour MySQL
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});


// Route POST pour enregistrer une commande
app.post("/api/commandes", (req, res) => {
  const {
    prenom, nom, email, telephone,
    adresse, ville, paiement, produits, total
  } = req.body;

  const sql = `
    INSERT INTO commandes 
    (prenom, nom, email, telephone, adresse, ville, paiement, produits, total) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [prenom, nom, email, telephone, adresse, ville, paiement, JSON.stringify(produits), total],
    (err, result) => {
      if (err) {
        console.error("❌ Erreur SQL:", err.message);
        res.status(500).json({ message: "Erreur lors de l'enregistrement." });
      } else {
        console.log("✅ Commande enregistrée !");
        res.status(200).json({ success: true, message: "Commande enregistrée avec succès." });
      }
    }
  );
});

// Route /admin/login
app.post("/admin/login", (req, res) => {
    const { username, password } = req.body;
  
    const sql = "SELECT * FROM admin WHERE username = ? AND password = ?";
    db.query(sql, [username, password], (err, results) => {
      if (err) {
        console.error("❌ Erreur SQL Admin Login:", err.message);
        return res.status(500).json({ success: false, message: "Erreur serveur." });
      }
  
      if (results.length > 0) {
        console.log("🔐 Connexion admin réussie :", username);
        res.status(200).json({ success: true, message: "Connexion réussie." });
      } else {
        res.status(401).json({ success: false, message: "Identifiants incorrects." });
      }
    });
  });
  
  // Route /admin/commandes (pour récupérer toutes les commandes)
  app.get("/admin/commandes", (req, res) => {
    const sql = "SELECT * FROM commandes ORDER BY id DESC";
    db.query(sql, (err, results) => {
      if (err) {
        console.error("❌ Erreur SQL GET Commandes:", err.message);
        return res.status(500).json({ success: false, message: "Erreur serveur." });
      }
      res.status(200).json(results);
    });
  });

  const bcrypt = require("bcrypt");

// Route POST /register
app.post("/register", async (req, res) => {
  const { firstName, lastName, email, password, location } = req.body;

  if (!firstName || !lastName || !email || !password || !location) {
    return res.status(400).json({ success: false, message: "All fields are required." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = "INSERT INTO users (username, password, email, location) VALUES (?, ?, ?, ?)";
    db.query(sql, [`${firstName} ${lastName}`, hashedPassword, email, location], (err) => {
      if (err) return res.status(500).json({ success: false, message: "Error creating user." });
      res.json({ success: true, message: "User registered successfully." });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// Route POST /login
// Route POST /login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Username and password are required." });
  }

  const sql = "SELECT * FROM users WHERE username = ?";
  db.query(sql, [username], async (err, results) => {
    if (err) {
      console.error("Erreur MySQL :", err);
      return res.status(500).json({ success: false, message: "Server error." });
    }

    if (results.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    try {
      const user = results[0];
      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        return res.status(401).json({ success: false, message: "Invalid credentials." });
      }

      // Sauvegarder l'utilisateur dans la session
      req.session.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        location: user.location,
      };

      // Réponse avec redirection
      res.json({
        success: true,
        message: "Login successful.",
        redirect: "/users_dashboard.html"
      });

    } catch (compareError) {
      console.error("Erreur bcrypt :", compareError);
      return res.status(500).json({ success: false, message: "Server error." });
    }
  });
});

// Route GET /api/commandes — Récupérer toutes les commandes
app.get("/api/commandes", (req, res) => {
  const sql = "SELECT * FROM commandes ORDER BY id DESC";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Erreur SQL lors de la récupération des commandes:", err.message);
      return res.status(500).json({ message: "Erreur serveur." });
    }
    res.status(200).json(results);
  });
});

// Lancement serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé : http://localhost:${PORT}`);
});
