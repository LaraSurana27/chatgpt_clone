const express = require('express')
const { registerUSer, loginUser } = require('../controllers/auth.controller')
const { authUser } = require('../middleware/auth.middleware')

const router = express.Router()

router.post('/register', registerUSer)
router.post('/login', loginUser)

router.get('/me', authUser, (req, res) => {
  res.json({ user: req.user });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

module.exports = router
