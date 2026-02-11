const { Server } = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");
const aiService = require("../services/ai.service");
const messageModel = require("../models/message.model");
const { createMemory, queryMemory } = require("../services/vector.service");

function initSocketServer(httpServer) {
  const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  },
});


  io.use(async (socket, next) => {
    const cookies = cookie.parse(socket.handshake.headers?.cookie || "");

    if (!cookies.token) {
      next(new Error("Authentication error : No token provided"));
    }

    try {
      const decoded = jwt.verify(cookies.token, process.env.JWT_SECRET);

      const user = await userModel.findById(decoded.id);

      socket.user = user;

      next();
    } catch (error) {
      next(new Error("Authentication error : Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    //user message received from socket
    socket.on("ai-message", async (messagePayload) => {
      const [message, vectors] = await Promise.all([
        //save the user msg in db
        messageModel.create({
          chat: messagePayload.chat,
          user: socket.user._id,
          content: messagePayload.content,
          role: "user",
        }),

        //generate vectors of user message for ltm
        aiService.generateVector(messagePayload.content),
      ]);

      //save user message in form of vector in pinecone
      if (vectors?.length > 0) {
        await createMemory({
          vectors,
          messageId: message._id,
          metadata: {
            chat: messagePayload.chat,
            user: socket.user._id,
            text: messagePayload.content,
          },
        });
      }

      const [memory, chatHistory] = await Promise.all([
        //search in poinecone(db) to check if there is any related memory of the above msg
        queryMemory({
          queryVector: vectors,
          limit: 1,
          metadata: {
            user: socket.user._id,
          },
        }),
        //get previous chat history(onlt 20 msg as limit is 20) from db for stm
        messageModel
          .find({ chat: messagePayload.chat })
          .sort({ createdAt: -1 })
          .limit(20)
          .lean()
          .then((messages) => messages.reverse()),
      ]);

      //filter stm memory i.e map items us user msg ans stm
      const stm = chatHistory.map((item) => {
        return {
          role: item.role,
          parts: [{ text: item.content }],
        };
      });

      //filter ltm memory i.e map user msg and ltm memory
      const ltm =
        memory?.length > 0
          ? [
              {
                role: "user",
                parts: [
                  {
                    text: `
              You have access to relevant past memories.
              Use them ONLY if helpful.

              Relevant memories:
              ${memory.map((m) => "- " + m.metadata.text).join("\n")}
              `,
                  },
                ],
              },
            ]
          : [];

      //generate response from ai using ltm ans stm
      const response = await aiService.generateResponse([...ltm, ...stm]);

      //send msg to the user
      socket.emit("ai-response", {
        content: response,
        chat: messagePayload.chat,
      });

      const [responseMessage, responseVectors] = await Promise.all([
        //save generated reply into db
        messageModel.create({
          chat: messagePayload.chat,
          user: socket.user._id,
          content: response,
          role: "model",
        }),
        //create vector of generated message
        aiService.generateVector(response),
      ]);

      //save generated response in form of vectors in pinecone(db)
      await createMemory({
        vectors: responseVectors,
        messageId: responseMessage._id,
        metadata: {
          chat: messagePayload.chat,
          user: socket.user._id,
          text: response,
        },
      });
    });
  });
}

module.exports = initSocketServer;

