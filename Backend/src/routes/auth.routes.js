const express = require('express');
const authControllers = require('../controllers/auth.controller')
const router = express.Router();


router.post("/register", authControllers.registerUser);

router.post("/login", authControllers.loginUser);

// GET /api/auth/me -> return current user (requires cookie auth)
router.get('/me', require('../middlewares/auth.middleware').authUser, authControllers.getMe);
router.post('/logout', authControllers.logoutUser);

module.exports = router;