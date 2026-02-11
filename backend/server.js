require("dotenv").config();
const app = require("./src/app");
const connectDb = require("./src/db/db");
const httpServer = require("http").createServer(app)
const initSocketServer = require("./src/sockets/socket.server");
const PORT = process.env.PORT || 3000;

connectDb();
initSocketServer(httpServer)

httpServer.listen(PORT, () =>
{
    console.log(`server is running on port ${PORT}`)
})
