const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const bodyParser = require("body-parser");
const session = require("express-session");
const path = require("path");
require("dotenv").config();
const bcrypt = require("bcrypt");
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(cors({
  credentials: true,
  origin: "https://team-work-30tj.onrender.com"  // Remplacez par votre domaine
}));
app.use(session({
  secret: "sidick_secret_123",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 86400000
  }
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Connexion à la base de données
const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

// Middleware d'authentification
function ensureAuthenticated(req, res, next) {
  if (req.session?.user) return next();
  res.status(401).json({ success: false, message: "Non autorisé" });
}
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
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Tous les champs sont requis." });
  }

  const sql = "SELECT * FROM users WHERE username = ?";
  db.query(sql, [username], async (err, results) => {
    if (err) {
      console.error("Erreur MySQL :", err);
      return res.status(500).json({ success: false, message: "Erreur serveur." });
    }

    if (results.length === 0) {
      return res.status(401).json({ success: false, message: "Identifiants invalides." });
    }

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ success: false, message: "Identifiants invalides." });
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      location: user.location
    };

    req.session.save(err => {
      if (err) {
        return res.status(500).json({ success: false, message: "Échec de la session." });
      }
      res.json({
        success: true,
        message: "Connexion réussie.",
        redirect: "/users_dashboard.html"
      });
    });
  });
});

// Route POST /api/commandes
app.post("/api/commandes", ensureAuthenticated, (req, res) => {
  const {
    prenom, nom, email, telephone,
    adresse, ville, paiement, produits, total
  } = req.body;

  const user_id = req.session.user.id;

  const sql = `
    INSERT INTO commandes 
    (user_id, prenom, nom, email, telephone, adresse, ville, paiement, produits, total) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [user_id, prenom, nom, email, telephone, adresse, ville, paiement, JSON.stringify(produits), total],
    (err, result) => {
      if (err) {
        console.error("❌ Erreur SQL:", err.message);
        return res.status(500).json({ message: "Erreur lors de l'enregistrement." });
      }
      res.status(200).json({ success: true, message: "Commande enregistrée avec succès." });
    }
  );
});

// Route GET /admin/commandes
app.get("/admin/commandes", ensureAuthenticated, (req, res) => {
  const userId = req.session.user.id;
  const sql = "SELECT * FROM commandes WHERE user_id = ? ORDER BY id DESC";

  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: "Erreur serveur." });
    res.json(results);
  });
});

// Route GET /api/user
app.get('/api/user', (req, res) => {
  if (req.session?.user) {
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    res.json({ loggedIn: false });
  }
});

// Lancement du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé : http://localhost:${PORT}`);
});