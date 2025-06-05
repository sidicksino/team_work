const mysql = require('mysql');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'shoping_sino_bour'
});

db.connect(err => {
  if (err) {
    console.error('Erreur de connexion à la base:', err);
  } else {
    console.log('✅ Connecté à MySQL');
  }
});

module.exports = db;
