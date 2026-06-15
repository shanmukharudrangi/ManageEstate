const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// POST /api/auth/signup - Create new user
router.post('/signup', authController.signup);

// POST /api/auth/login - Login user
router.post('/login', authController.login);

module.exports = router;
