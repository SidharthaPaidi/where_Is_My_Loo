const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');

router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    // Successful login
    res.redirect('/toilets');
  }
);
// Register form
router.get('/register', (req, res) => {
  res.render('auth/register');
});

// Create account
router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password } = req.body;  // name attributes in form
    const user = new User({ username, email });
    const registeredUser = await User.register(user, password); // hashes & saves
    req.login(registeredUser, (err) => {               // auto login after register
      if (err) return next(err);
      req.flash('success', `Welcome, ${registeredUser.username}!`);
      res.redirect('/toilets');
    });
  } catch (e) {
    let msg = 'Something went wrong';
    // Mongoose duplicate key error (MongoServerError 11000)
    if (e.name === 'MongoServerError' && e.code === 11000 && e.keyValue) {
      const field = Object.keys(e.keyValue)[0];
      msg = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    } else if (e.message && e.message.includes('A user with the given username is already registered')) {
      // passport-local-mongoose username collision
      msg = 'Username already exists';
    } else if (e.message && /email/i.test(e.message)) {
      msg = 'Accound with this email already exists';
    } else if (e.errors) {
      // Mongoose validation errors
      msg = Object.values(e.errors).map(err => err.message).join(', ');
    } else if (e.message) {
      msg = e.message;
    }
    req.flash('error', msg);
    res.redirect('/register');
  }
});

// Login form
router.get('/login', (req, res) => {
  res.render('auth/login');
});

// Login
router.post(
  '/login',
  passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }),
  (req, res) => {
    req.flash('success', 'Welcome back!');
    const redirectUrl = req.session.returnTo || '/toilets';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
  }
);

// Logout (Passport 0.6+ uses callback)
router.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash('success', 'Logged out successfully');
    res.redirect('/toilets');
  });
});

module.exports = router;
