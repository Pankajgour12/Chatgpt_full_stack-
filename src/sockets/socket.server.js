const { Server } = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");
const aiService = require("../services/ai.service");
const messageModel = require("../models/message.model");
const {  queryMemory, createMemory } = require("../services/vector.service");


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


        await messageModel.create({
          user: socket.user._id,
          chat: messagePayload.chat,
          content: messagePayload.content,
          role: "user",
        });



        // convert message to vector

        const vector = await aiService.generateVector(messagePayload.content);



        // console.log("Message vector:", vector);


 // remember to preview history in the chat window
           const memory = await queryMemory({
           vector: vector,   // ✅ sahi key
               limit: 5,
                metadata: {
                 userId: socket.user._id,
                
                 }
               });






        // vector messages save to vector database
            await createMemory({
              vectors: vector,
              metadata: {
                role: "user",
                userId: socket.user._id,
                chatId: messagePayload.chat,
                text: messagePayload.content
              },
              messageId: new Date().getTime().toString(),
            });


           

            
            
            





        const chatHistory = (
          await messageModel
            .find({
              chat: messagePayload.chat,
            })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean()
        ).reverse();




          // save to short term memory 
// -------- Short Term Memory (per chat) --------
const stm = chatHistory.map((item) => ({
  role: item.role,
  parts: [{ text: item.content }],
}));

// -------- Long Term Memory (cross-chat, user-wise) --------
const ltm = memory.map((item) => ({
  role: item.metadata.role || "user",
  parts: [{ text: item.metadata.text }],
}));

// -------- Current User Input --------
const currentInput = {
  role: "user",
  parts: [{ text: messagePayload.content }],
};

// -------- Merge Final Prompt --------
const finalMessages = [
  ...ltm,          // long-term memory (user ki purani chats ka relevant data)
  ...stm,          // short-term memory (isi chat ke last 20 messages)
  currentInput,    // abhi ka input
];

             








        const response = await aiService.generateResponse(finalMessages);







        await messageModel.create({
          user: socket.user._id,
          chat: messagePayload.chat,
          content: response,
          role: "model",
        });

         
        const responseVector = await aiService.generateVector(response);

        await createMemory({
          vectors: responseVector,
          metadata: {
            role: "model",
            userId: socket.user._id,
            chatId: messagePayload.chat,
            text: response
          },
          messageId: new Date().getTime().toString(),
        });








        socket.emit("ai-response", {
          contents: response,
          chat: messagePayload.chat,
        });



console.log("AI response sent:", response);



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
