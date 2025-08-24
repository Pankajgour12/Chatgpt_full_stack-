const { Server } = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");
const {aiService} = require("../services/ai.service");
const messageModel = require("../models/message.model");
const { createMomory, queryMemory } = require("../services/vector.service");


function initSocketServer(httpServer) {
  const io = new Server(httpServer, {});

  io.use(async (socket, next) => {
    const cookies = cookie.parse(socket.handshake.headers?.cookie || "");

    console.log("Socket connection cookies ");

    if (!cookies.token) {
      next(new Error("Authentication error: No token provided"));
    }

    try {
      const decoded = jwt.verify(cookies.token, process.env.JWT_SECRET);
      const user = await userModel.findById(decoded._id);

      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Authenication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log("New Socket connection ");

    socket.on("ai-message", async (messagePayload) => {
      /* messagePayload ={
       chat: "chat_id",
       content: "user_message"
    } */

      try {
        console.log("Message from client:", messagePayload);

        // message save to message model


        // await messageModel.create({
        //   user: socket.user._id,
        //   chat: messagePayload.chat,
        //   content: messagePayload.content,
        //   role: "user",
        // });



        // convert message to vector

        const vector = await aiService.generateVector(messagePayload.content);
        console.log("Message vector:", vector);






        

        const chatHistory = (
          await messageModel
            .find({
              chat: messagePayload.chat,
            })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean()
        ).reverse();

        const response = await aiService.generateResponse(
          chatHistory.map((item) => {
            return {
              role: item.role,
              parts: [{ text: item.content }],
            };
          })
        );
        // await messageModel.create({
        //   user: socket.user._id,
        //   chat: messagePayload.chat,
        //   content: response,
        //   role: "model",
        // });

        socket.emit("ai-response", {
          contents: response,
          chat: messagePayload.chat,
        });
      } catch (error) {
        console.error("AI socket error:", error);
        socket.emit("ai-response", {
          contents: "⚠️ Error generating response",
          chat: messagePayload.chat,
        });
      }
    });
  });
}

module.exports = initSocketServer;
