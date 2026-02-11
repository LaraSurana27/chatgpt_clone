const express = require('express')
const { authUser } = require('../middleware/auth.middleware')
const { createChat, getChats, getMessages,updateChatTitle, deleteChat } = require('../controllers/chat.controller')

const router = express.Router()

router.post('/', authUser, createChat )
router.get('/', authUser, getChats)
router.get('/:chatId/messages', authUser, getMessages)
router.patch('/:chatId/title', authUser, updateChatTitle)
router.delete('/:chatId', authUser, deleteChat)


module.exports = router