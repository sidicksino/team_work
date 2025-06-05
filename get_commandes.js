const express = require('express');
const mysql = require('mysql2');
const session = require('express-session');
const cors = require('cors');

const app = express();
const port = 3000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5500',
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: 'sino_bour_secret_key',
  resave: false,
  saveUninitialized: false
}));

// Connexion MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'shoping_sino_bour'
});

// Vérifier connexion
db.connect((err) => {
  if (err) throw err;
  console.log('✅ Connexion MySQL réussie');
});

// Route pour se connecter en tant qu’admin (exemple simple sans mot de passe)
app.post('/admin/login', (req, res) => {
  // En vrai projet, utilise une table d'admins et vérifie les identifiants
  req.session.adminLoggedIn = true;
  res.json({ success: true });
});

// Route pour récupérer les commandes (remplace admin.php)
app.get('/admin/commandes', (req, res) => {
  if (!req.session.adminLoggedIn) {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  const sql = 'SELECT * FROM commandes';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Erreur MySQL' });

    const commandes = results.map(row => {
      const produits = JSON.parse(row.produits || '[]');
      return {
        id: row.id,
        prenom: row.prenom,
        nom: row.nom,
        email: row.email,
        telephone: row.telephone,
        ville: row.ville,
        adresse: row.adresse,
        paiement: row.paiement,
        total: row.total,
        produits: produits.map(p => ({
          nom: p.nom,
          quantite: p.quantite,
          taille: p.taille,
          qualite: p.qualite,
          couleur: p.couleur,
          prix: p.prix,
          image: p.image
        }))
      };
    });

    res.json(commandes);
  });
});

// Lancer le serveur
app.listen(port, () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${port}`);
});
