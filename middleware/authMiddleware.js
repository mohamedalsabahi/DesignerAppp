// middleware/authMiddleware.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const secretKey = 'yourSecretKey2024';


const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
          //  const decoded = jwt.verify(token, secretKey);
            req.user = await User.findById(decoded.id).select('-password');
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized' });
        }
    }
    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};


// Middleware to authenticate and parse JWT from the HttpOnly cookie
const authenticateJWT = (req, res, next) => {
    const token = req.cookies.authToken; // Retrieve the HttpOnly cookie
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    try {
        // Verify and decode the JWT token
       // const decoded = jwt.verify(token, secretKey);
        consle.log("my data " +decoded);
        req.user = decoded; // Attach the decoded user data to the request
        next();
    } catch (err) {
        console.error('Invalid token:', err);
        res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
};

const authorize = (role) => (req, res, next) => {
    if (req.user && req.user.role === role) {
        next(); // User is authorized
    } else {
        res.status(403).json({ message: 'Access denied' }); // User is not authorized
    }
};

module.exports = { protect,authenticateJWT, authorize };

