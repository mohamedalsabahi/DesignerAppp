// routes/authRoutes.js
const express = require('express');
const { register, login } = require('../controllers/authController');

const multer = require('multer'); // For handling file uploads
const path = require('path');
const router = express.Router();

const User = require('../models/User'); // Import the User model
const CompanyProfile = require('../models/CompanyProfile'); // Import the CompanyProfile model


const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const secretKey = 'yourSecretKey2024'; // Use an environment variable for production



router.get('/register-with-company', (req, res) => {
    res.render('auth/registerWithCompany', { title: 'Register with Company' });
});



// Configure Multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads'); // Save images in the 'public/uploads' folder
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    },
});

const upload = multer({ storage });

router.post('/register-with-company', upload.single('companyImage'), async (req, res) => {
    try {
        const { username, email, password, companyName, mobile, companyEmail } = req.body;

        // Create the admin user
        const user = new User({ username, email, password });
        await user.save();

        // Create the company profile
        const companyProfile = new CompanyProfile({
            name: companyName,
            mobile,
            email: companyEmail,
            image: req.file ? `/uploads/${req.file.filename}` : '', // Save the uploaded image path
            admin: user._id, // Link the admin user
        });
        await companyProfile.save();

        res.redirect('/auth/login'); // Redirect to the login page
    } catch (err) {
        console.error(err);
        res.status(500).send('Error registering user and company');
    }
});




// Register a new user
router.post('/register-user', async (req, res) => {
  
    
    try {
        const { username, email, password, role = 'user' } = req.body;

        // Validate required fields
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Hash the password using bcrypt (ensure using the latest version)
       // const saltRounds = 10; // Cost factor, 10 is considered a good default
      //  const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create a new user
        const newUser = new User({
            username,
            email,
            password: password,  // Store the hashed password
            role,
        });

        await newUser.save();

        // Generate a JWT token
        const token = jwt.sign(
            { userId: newUser._id, role: newUser.role },
            secretKey,
            { expiresIn: '1h' }
        );

        // Send response with user details and JWT token
        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role,
            },
        });
    } catch (err) {
        console.error('Error registering user:', err);
        res.status(500).json({ message: 'Error registering user' });
    }


});




router.post('/register', register);
router.post('/login', login);


// Make sure User model is defined correctly


// Login Route
router.post('/loginn', async (req, res) => {
   
    
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            console.log(`User not found with email: ${email}`);
            return res.status(400).send('Invalid email or password');
        }

        console.log(`User found: ${JSON.stringify(user)}`);




         const plainTextPassword = 'master1';

         const hashedPasswordd = await bcrypt.hash(plainTextPassword, 10);

    // const hashedPasswordFromDB = '$2a$10$q.1fuchfNzH4.xozrMzmQ.z0IX.EIsg8jS6JP5b3Qensm2KPQesQ6';

    // const isMatchh = await bcrypt.hash(plainTextPassword);
     console.log('Passwords match:', hashedPasswordd);

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log(`Password does not match for user: ${user.email}`);
            return res.status(400).send('Invalid email or password');
        }

        console.log('Password verified successfully');

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            secretKey,
            { expiresIn: '1h' }
        );

        console.log(`JWT Token generated: ${token}`);

        // Send token and success message

        res.cookie('authToken', token, {
            httpOnly: true, // Prevents access via JavaScript
            secure: true,   // Ensures it's sent over HTTPS
            sameSite: 'Strict', // Prevents CSRF attacks
            maxAge: 3600000, // 1 hour
        });
        res.redirect("/");
       // res.status(200).json({ token, message: 'Login successful' });

    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).send('Error logging in');
    }



});



module.exports = router;
