const chatModel = require('../models/chat.model');  
const messageModel = require('../models/message.model');



async function createChat(req, res) {
   const { title } = req.body;
   const user = req.user;

const chat = await chatModel.create({
    user: user._id,
    title

})




   res.status(201).json({ message: 'Chat created',
     chat:{
            id: chat._id,
            title: chat.title,
            lastActivity: chat.lastActivity
     }
     
     });
    
};

async function getChats(req, res) {
  try {
    const user = req.user;

    // User ke saare chats nikaal lo, latest activity ke hisaab se sort
    const chats = await chatModel.find({ user: user._id }).sort({ updatedAt: -1 });

    // Har chat ka last message fetch karna
    const chatsWithLastMessage = await Promise.all(
      chats.map(async (chat) => {
        const lastMsg = await messageModel.findOne({ chat: chat._id })
          .sort({ createdAt: -1 })
          .lean();

        // fetch recent messages (last 20) to help client restore chat history
        const recentMsgs = await messageModel.find({ chat: chat._id })
          .sort({ createdAt: 1 })
          .limit(20)
          .lean();

        return {
          id: chat._id,
          title: chat.title,
          lastActivity: chat.lastActivity,
          user: chat.user,
          lastMessage: lastMsg ? lastMsg.content : "",
          messages: recentMsgs.map(m => ({ id: m._id, role: m.role === 'model' ? 'assistant' : m.role, content: m.content, time: m.createdAt }))
        };
      })
    );

    res.status(200).json({
      message: "Chats retrieved successfully",
      chats: chatsWithLastMessage
    });

  } catch (error) {
    console.error("Error in getChats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function deleteChat(req, res) {
  try {
    const user = req.user;
    const chatId = req.params.id;
    const chat = await chatModel.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (String(chat.user) !== String(user._id)) return res.status(403).json({ message: 'Forbidden' });

    // delete messages belonging to this chat
    await messageModel.deleteMany({ chat: chatId });
    // delete the chat
    await chatModel.deleteOne({ _id: chatId });

    res.status(200).json({ message: 'Chat deleted' });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
   createChat,
   getChats
  , deleteChat
}


