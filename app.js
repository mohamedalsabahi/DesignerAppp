// app.js
const express = require('express');
const connectDB = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const engine = require('ejs-mate'); // Import ejs-mate
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

const { protect,authenticateJWT, authorize } = require('./middleware/authMiddleware');
const path = require('path');
const fs = require('fs'); // File System module

const app = express();


app.use(cookieParser()); // Middleware to parse cookies

const User = require('./models/User');
const CompanyProfile = require('../DesignerApp/models/CompanyProfile');

const secretKey = 'yourSecretKey2024';



app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use((req, res, next) => {
    const token = req.cookies.authToken;

    if (token) {
        try {
            // Verify and decode the token
            const decoded = jwt.verify(token, secretKey);
            res.locals.user = {
                userId: decoded.userId,
                role: decoded.role,
            };
          //  console.log("my data 2 " + decoded);
        } catch (err) {
            console.error('Error decoding token:', err);
            res.locals.user = null; // Clear user if token is invalid
        }
    } else {
        res.locals.user = null; // No token, no user
    }

    next();
});
// Use ejs-mate for EJS templates
app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB
connectDB();

const adminRoutes = require('./routes/adminRoutes');
const { title } = require('process');
app.use('/api/admin', adminRoutes);

const multer = require('multer');

// Configure Multer for file uploads
const upload = multer({
    dest: path.join(__dirname, '../Images/'),
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max file size
});



// Ensure the uploads directory exists
const uploadDir = path.join(__dirname, 'Images');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}


// Route to add a new service
app.post('/addservv', authenticateJWT, upload.single('serviceImage'), async (req, res) => {
    try {
        const { serviceName, price } = req.body;
        const serviceImage = req.file ? req.file.filename : null;

        // Validate inputs
        if (!serviceName || !price || !serviceImage) {
            return res.status(400).send('All fields are required.');
        }

        // Ensure user is authenticated and userId is present
        if (!req.user || !req.user.userId) {
            return res.status(401).send('Unauthorized: No user data available');
        }

        // Get the companyId from the route parameter
        const companyId = req.params.companyId;

        // Check if the company exists
        const company = await CompanyProfile.findOne({ _id: companyId, admin: req.user.userId });
        if (!company) {
            return res.status(404).send('Company not found or you are not authorized to add a service to this company.');
        }

        // Create a new service linked to the company
        const newService = new Service({
            serviceName,
            price,
            image: serviceImage,
            company: company._id // Link the service to the company profile
        });

        // Save the new service to the database
        await newService.save();

        // Redirect to the services list or another page
        res.redirect('/admin/services');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error creating service.');
    }
});


// Set upload path to 'public/uploads'
const uploadPath = path.join(__dirname, 'public', 'uploads');  // Ensure this is inside your 'public' folder

// Ensure the directory exists or create it
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true }); // Create 'uploads' folder if it doesn't exist
}

const uploadd = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, uploadPath);  // Save to the 'public/uploads' directory
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now();  // Use timestamp to make filenames unique
            cb(null, uniqueSuffix + '-' + file.originalname);  // Save the file with a unique name
        }
    })
});

app.post('/addserv', authenticateJWT, uploadd.single('serviceImage'), async (req, res) => {
    try {
        const { serviceName, price } = req.body;
        const serviceImage = req.file ? req.file.filename : null;

        // Validate inputs
        if (!serviceName || !price || !serviceImage) {
            return res.status(400).send('All fields, including an image, are required.');
        }

        const userId = req.user.userId; // Get the logged-in user's userId

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('User not found.');
        }

        const imagePath = path.join(__dirname, 'public/uploads', serviceImage);

        if (!fs.existsSync(imagePath)) {
            console.error('Uploaded file not found:', imagePath);
            return res.status(500).send('Error storing the uploaded image.');
        }

        const newService = new Service({
            serviceName,
            price,
            image: serviceImage,
            user: user._id,
        });

        await newService.save();
        res.redirect('/admin/services');
    } catch (err) {
        console.error('Error creating service:', err.message);
        res.status(500).send('Error creating service.');
    }
});



app.get('/allservices', async (req, res) => {
    try {
        // Fetch all services from the database
        const services = await Service.find();

        // Render the EJS page with services
        res.render('allservices', {
            title: 'All Services',
            services, // Pass the services to the EJS template
        });
    } catch (err) {
        console.error('Error fetching services:', err);
        res.status(500).send('Error fetching services.');
    }
});

// Delete service route
app.post('/delete-service/:id', async (req, res) => {
    try {
        const serviceId = req.params.id;

        // Find and delete the service by ID
        await Service.findByIdAndDelete(serviceId);

        res.redirect('/allservices'); // Redirect to the services page
    } catch (err) {
        console.error('Error deleting service:', err);
        res.status(500).send('Error deleting service.');
    }
});


// Serve EJS page for all companies with services
app.get('/companies', (req, res) => {
    res.redirect('/api/admin/companies-with-services');
});

const adminRoutess = require('./routes/adminRoutes');
const Service = require('./models/Service');
// const { decode } = require('punycode');


app.use('/admin', adminRoutess);


// Route to get all company profiles
app.get('/companiess', async (req, res) => {
    try {
        const companies = await CompanyProfile.find(); // Fetch all companies
        res.render('companies', { companies }); // Render the EJS page with companies data
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching company profiles.');
    }
});

// Route to get services for a specific company
app.get('/companies/:id/services', async (req, res) => {
    try {
        const companyId = req.params.id; // Get company ID from route params
        const services = await Service.find({ company: companyId }); // Fetch related services
        res.json(services); // Return services as JSON for frontend to display
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching services.');
    }
});




// Route to render the Add Service page
app.get('/add-servicee', async (req, res) => {
    try {
        // Assume req.user contains the logged-in user details after authentication
        const loggedInUserId = req.user._id;

        console.log(loggedInUserId);
        // Find the company profile associated with the logged-in user
        const company = await CompanyProfile.findOne({ admin: loggedInUserId });

        if (!company) {
            return res.status(404).send('Company profile not found for the logged-in user.');
        }

        // Render the EJS page with the company profile data
        res.render('newService', { title: 'Add Service', company });
    } catch (err) {
        console.error('Error fetching company profile:', err);
        res.status(500).send('Error loading Add Service page.');
    }
});

app.get('/add-serv', authenticateJWT, async (req, res) => {
    try {
        console.log('Decoded user:', req.user); // Debug log
        const loggedInUserId = req.user.userId;

        if (!loggedInUserId) {
            return res.status(401).send('No user found in the request');
        }

        const company = await CompanyProfile.findOne({ admin: loggedInUserId });

        if (!company) {
            return res.status(404).send('Company profile not found for the logged-in user.');
        }

        res.render('newService', { title: 'Add Service', company });
    } catch (err) {
        console.error('Error fetching company profile:', err);
        res.status(500).send('Error loading Add Service page.');
    }
});





app.get('/my-company', authenticateJWT, async (req, res) => {
    try {
        // Retrieve user ID from `req.user` (set in the authentication middleware)
        const userId = req.user.userId;

        // Fetch the company profile for the logged-in user
        const companyProfile = await CompanyProfile.findOne({ admin: userId }).populate('admin');

        if (!companyProfile) {
            return res.status(404).json({ message: 'No company profile found for this user' });
        }

        res.status(200).json(companyProfile);
    } catch (err) {
        console.error('Error fetching company profile:', err);
        res.status(500).json({ message: 'Server error' });
    }
});




app.get('/new-service', async (req, res) => {
    try {
        // Fetch all company profiles from the database
        const companies = await CompanyProfile.find();

        // Check if any companies exist
        if (!companies || companies.length === 0) {
            return res.status(404).send('No companies found.');
        }

        // Render the form with the fetched company data
        res.render('newService', { 
            title: 'Create New Service', 
            companies 
        });
    } catch (err) {
        console.error('Error fetching company profiles:', err.message);

        // Send an error response with a detailed message for the client
        res.status(500).send('An error occurred while loading the form. Please try again later.');
    }
});



// Render EJS pages for Register and Login
app.get('/register', (req, res) => {
    res.render('register'); // Renders register.ejs
});

app.get('/login', (req, res) => {
    res.render('login'); // Renders login.ejs
});

// Logout route
app.get('/logout', (req, res) => {
    // Clear the authToken cookie
    res.clearCookie('authToken', {
        httpOnly: true,
        secure: true, // Ensure this is true in production when using HTTPS
        sameSite: 'Strict', // Prevent CSRF
    });

res.redirect("/");

   // res.status(200).json({ message: 'Logged out successfully' });
});


app.get('/', async (req, res) => {
    try {
        // Fetch all companies from the database
        const companies = await CompanyProfile.find().populate('admin', 'username');

        // Render the EJS page with the companies
        res.render('home', { title: 'Company Profiles', companies });
    } catch (err) {
        console.error('Error fetching company profiles:', err);
        res.status(500).send('Error fetching company profiles.');
    }
});



// Route to fetch company details
app.get('/company/:id', async (req, res) => {
    try {
        const companyId = req.params.id;

        // Fetch the company details from the database
        const company = await CompanyProfile.findById(companyId);

        if (!company) {
            return res.status(404).send('Company not found.');
        }

        const userId = company.admin; // Assuming `admin` field stores user ID

        // Fetch all services related to the extracted userId
        const services = await Service.find({ user: userId });


        // Render the company details page
        res.render('profile', { title: 'Company Details', company ,services });
    } catch (err) {
        console.error('Error fetching company details:', err);
        res.status(500).send('Error fetching company details.');
    }
});




app.get('/profile', (req, res) => {
    res.render('profile', { title: 'Register with profile' }); // Renders login.ejs
});

app.get('/servicess', (req, res) => {
    res.render('service', { title: 'Register with profile' }); // Renders login.ejs
});

// Example protected route
app.get('/api/admin', protect, authorize('admin'), (req, res) => {
    res.send('Admin content');
});

// Register the routes
app.use('/auth', authRoutes);

// Serve the login page
app.get('/loginme',(req, res) => {
    res.render('auth/login',{ title: 'login with Company' });
});

app.get('/registerr',(req, res) => {
    res.render('auth/register',{ title: 'login with Company' });
});

app.use(express.static(path.join(__dirname, 'node_modules')));



app.use(
    "/css",
    express.static(path.join(__dirname, "node_modules/bootstrap/dist/css"))
  )
  app.use(
    "/js",
    express.static(path.join(__dirname, "node_modules/bootstrap/dist/js"))
  )
  app.use("/js", express.static(path.join(__dirname, "node_modules/jquery/dist")))
  

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
