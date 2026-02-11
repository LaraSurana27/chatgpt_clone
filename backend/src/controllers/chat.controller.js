const chatModel = require('../models/chat.model')
const messageModel = require('../models/message.model')

async function createChat(req, res) {
    const { title } = req.body
    const user = req.user

    const chat = await chatModel.create({
        user : user._id,
        title,
    })

    res.status(201).json({
        message : "Chat created successfully",
        chat : {
            _id : chat._id,
            title : chat.title,
            lastActivity : chat.lastActivity,
            user : chat.user,      
        }
    })
}

async function getMessages(req, res) {
  const { chatId } = req.params

  const messages = await messageModel
    .find({ chat: chatId, user: req.user._id })
    .sort({ createdAt: 1 })
    .lean()

  res.json({ messages })
}

async function getChats(req, res) {
  const chats = await chatModel
    .find({ user: req.user._id })
    .sort({ updatedAt: -1 })
    .lean()

  res.json({ chats })
}

async function updateChatTitle(req, res) {
  const { chatId } = req.params
  const { title } = req.body

  const chat = await chatModel.findOneAndUpdate(
    { _id: chatId, user: req.user._id },
    { title },
    { new: true }
  )

  res.json({ chat })
}

async function deleteChat(req, res) {
  const { chatId } = req.params

  await chatModel.deleteOne({
    _id: chatId,
    user: req.user._id,
  })

  res.json({ success: true })
}

module.exports = {
  createChat,
  getChats,
  updateChatTitle,
  deleteChat,
  getMessages,
}