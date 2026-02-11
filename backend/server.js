require("dotenv").config();
const app = require("./src/app");
const connectDb = require("./src/db/db");
const httpServer = require("http").createServer(app)
const initSocketServer = require("./src/sockets/socket.server");


connectDb();
initSocketServer(httpServer)

httpServer.listen(3000, () =>
{
    console.log("server is running on port 3000")
})
