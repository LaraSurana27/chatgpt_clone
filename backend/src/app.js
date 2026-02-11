const express = require('express')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const path = require('path')
const buildPath = path.join(__dirname, '../public');

/* Routes*/
const authRoutes = require("./routes/auth.routes")
const chatRoutes = require("./routes/chat.routes")

const app = express()

/* Using middlewares*/
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://your-vercel-app.vercel.app"
  ],
  credentials: true
}))

app.use(express.json())
app.use(cookieParser())
app.use(express.static(buildPath));


/* Using Routes*/
app.use('/api/auth', authRoutes)
app.use('/api/chat', chatRoutes)
app.get("*", (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

console.log("Serving static from:", path.join(__dirname, '../index.html'));



module.exports = app
