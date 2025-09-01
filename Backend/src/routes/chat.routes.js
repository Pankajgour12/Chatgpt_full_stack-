const express= require('express');
const authMiddleware = require("../middlewares/auth.middleware")
const router = express.Router();
const chatController = require('../controllers/chat.controller');

/* POST /api/chat */

router.post('/', authMiddleware.authUser, chatController.createChat);

router.get('/', authMiddleware.authUser, chatController.getChats);

// DELETE /api/chat/:id -> delete chat and its messages (owner only)
router.delete('/:id', authMiddleware.authUser, chatController.deleteChat);

module.exports = router;