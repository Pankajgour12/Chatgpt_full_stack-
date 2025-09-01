const userModel = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function registerUser(req, res) {

    const { fullName: {firstName, lastName}, email, password } = req.body;

// check user existence
    const isUserAlreadyExists = await userModel.findOne({ email });
    if (isUserAlreadyExists) {
        return res.status(400).json({ error: "User already exists" });
    }

const hashPassword = await bcrypt.hash(password, 10);




// create new user
    const newUser = await userModel.create({
        fullName: { firstName, lastName },
        email,
        password: hashPassword
    });

    const token = jwt.sign({ _id: newUser._id }, process.env.JWT_SECRET);



    res.cookie("token", token);

    res.status(201).json({ 
        message: "User registered successfully",
        user:{
            id: newUser._id,
            fullName: newUser.fullName,
            email: newUser.email
        }


     });
}


async function loginUser(req, res) {
const {email,password} = req.body;


const user = await userModel.findOne({
    email
})

if (!user) {
    return res.status(404).json({ error: "Invalid email or password" });
}

const isPasswordValid = await bcrypt.compare(password, user.password);
if (!isPasswordValid) {
    return res.status(401).json({ error: "Invalid password" });
}

const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);

res.cookie("token", token);

res.status(200).json({
    message: "User logged in successfully",
    user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email
    }
});


}





async function getMe(req, res) {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ message: 'Not authenticated' });
        res.status(200).json({ user: { id: user._id, fullName: user.fullName, email: user.email } });
    } catch (e) {
        console.error('getMe error', e);
        res.status(500).json({ message: 'Server error' });
    }
}

module.exports = {
    registerUser,
    loginUser,
    getMe
};

async function logoutUser(req, res) {
    try {
        res.clearCookie('token');
        res.status(200).json({ message: 'Logged out' });
    } catch (e) {
        res.status(500).json({ message: 'Logout failed' });
    }
}

module.exports.logoutUser = logoutUser;
