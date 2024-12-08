// controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Register User
exports.register = async (req, res) => {
    const { username, email, password, role } = req.body;
    try {
        const user = new User({ username, email, password, role });
        await user.save();
        res.redirect('/login'); // Redirect to login page after successful registration
    } catch (err) {
        res.render('register', { error: err.message }); // Render register page with error
    }
};

// Login User
exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || !(await user.matchPassword(password))) {
            return res.render('login', { error: 'Invalid email or password' });
        }
        const token = jwt.sign({ id: user._id }, 'secretkey', { expiresIn: '1h' });
        res.send(`Welcome ${user.username}! Your token: ${token}`);
    } catch (err) {
        res.render('login', { error: err.message });
    }




};

