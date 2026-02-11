const express = require('express')
const { registerUSer, loginUser } = require('../controllers/auth.controller')
const { authUser } = require('../middleware/auth.middleware')

const router = express.Router()

router.post('/register', registerUSer)
router.post('/login', loginUser)


router.get('/me', authUser, (req, res) => {
  res.json({
    user: {
      _id: req.user._id,
      email: req.user.email,
      fullName: req.user.fullName,
    },
  })
})

router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
  })
  res.status(200).json({ message: 'Logged out' })
})

module.exports = router
