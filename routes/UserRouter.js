const express = require('express');
const router = express.Router();
const db = require('../database/db.js');

const requestIp = require('request-ip');
const bcrypt = require('bcryptjs');

router.use(requestIp.mw());

router.get('/get/users', (req, res) => {
  const query = 'SELECT * FROM users';
  db.query(query, (err, result) => {
    if (err) {
      res.send(err);
    } else {
      res.send(result);
    }
  });
});

router.get('/get/user', (req, res) => {
  const { user_id } = req.body;

    if (!user_id) {
        return res.status(400).json({ message: "Les données de la requête sont invalides" });
    }else{

        const checkUserQuery = 'SELECT * FROM users WHERE id = ?';
        db.query(checkUserQuery, [user_id], (err, result) => {
            if (result.length == 0) {
                return res.status(400).json({ message: "Aucun utilisateur trouvé" });
            }else{
                 const query = 'SELECT * FROM users WHERE id = ' + user_id;
                  db.query(query, (err, result) => {
                    if (err) {
                      res.send(err);
                    } else {
                      res.send(result);
                    }
                  });
            }

        });

    }
});

router.post('/login', (req, res) => {
    const { username, password } = req.body;
  
    const query = 'SELECT * FROM users WHERE username = ?';
    db.query(query, [username], (err, result) => {
      if (err) {
        res.send({ err: err });
      }
  
      if (result.length > 0) {
        bcrypt.compare(password, result[0].password, (error, response) => {
          if (response) {
            res.send(result);
          } else {
            res.send({ message: "Votre mot de passe est incorrect" });
          }
        });
      } else {
        res.send({ message: "Votre pseudonyme est incorrect" });
      }
    });
});

router.post('/register', async (req, res) => {
    const { username, email, password, passwordrepeat } = req.body;

    if (!username || !email || !password || !passwordrepeat) {
        return res.status(400).json({ message: "Les données de la requête sont invalides" });
    }

    const userIp = req.clientIp;
    const addUserQuery = 'INSERT INTO users (username, mail, account_created, password, motto, look, ip_register, gender, credits, pixels, tokens) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const checkUserQuery = 'SELECT * FROM users WHERE username = ? OR mail = ?';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const passwordError = (password.length < 3) ? "Le mot de passe doit contenir au moins 3 caractères" :
        (password.length > 10) ? "Le mot de passe doit contenir au maximum 10 caractères" :
        null;
    const usernameError = (username.length > 10) ? "Le nom d'utilisateur doit contenir au maximum 10 caractères" :
        (username.length < 3) ? "Le nom d'utilisateur doit contenir au minimum 3 caractères" :
        null;
    const requiredFieldsError = (passwordrepeat.length === 0 || username.length === 0 || password.length === 0 || email.length === 0) ? "Tous les champs doivent être remplis" : null;
    const emailError = (!emailRegex.test(email)) ? "L'adresse e-mail n'est pas valide" : null;
    const passwordMatchError = (passwordrepeat !== password) ? "Les mots de passe ne sont pas identiques" : null;
    const errorMessages = [passwordError, usernameError, requiredFieldsError, emailError, passwordMatchError].filter(message => message !== null);

    if (errorMessages.length > 0) {
        return res.status(400).json({ message: errorMessages[0] });
    }else{

    const hashedPassword = await bcrypt.hash(password, 10);
    const currentTimestampInSeconds = Math.floor(new Date().getTime() / 1000);

        db.query(checkUserQuery, [username, email], (err, result) => {
            if (result.length > 0) {
                return res.status(400).json({ message: "Cet utilisateur ou cette adresse e-mail existe déjà" });
            }else{
                const currentTimestampInSeconds = Math.floor(new Date().getTime() / 1000);

                db.query(addUserQuery, [
                    username,
                    email,
                    currentTimestampInSeconds,
                    hashedPassword,
                    "Bienvenue sur Vicehabbo",
                    "lg-44689-63.hd-999999037-97557.cp-9032-95.ch-215-63.sh-800001735-63",
                    userIp,
                    "M",
                    5000,
                    50,
                    0
                ]);

                res.status(200).json({ message: "Utilisateur enregistré avec succès" });
                    }

        });

    }

});

module.exports = router;