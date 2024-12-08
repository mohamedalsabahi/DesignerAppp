const express = require('express');
const router = express.Router(); // Define the router
const { createCompanyProfile, getCompanyProfile, getAllCompaniesWithServices } = require('../controllers/companyController');
const { addService, getServices } = require('../controllers/serviceController');
const CompanyProfile = require('../models/CompanyProfile');
const multer = require('multer');
const Service = require('../models/Service');
const upload = multer({ dest: 'uploads/' });

// Company Profile Routes
router.post('/company-profile', createCompanyProfile);
router.get('/company-profile/:adminId', getCompanyProfile);
router.get('/companies-with-services', getAllCompaniesWithServices); // New route

// Service Routes
//outer.post('/services', addService);
router.get('/services/:companyId', getServices);


router.get('/new-service', async (req, res) => {
    try {
        const companies = await CompanyProfile.find(); // Fetch all companies
        res.render('newService', {title:'jjj', companies }); // Pass companies to the view
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading page');
    }
});


router.post('/servicesa', upload.single('serviceImage'), async (req, res) => {
    try {
        const { serviceName, price } = req.body;
        const serviceImage = req.file ? req.file.filename : null;

        // Retrieve the companyId from the logged-in user's session
        const companyId =     req.user?.companyId; // Assumes `companyId` is part of the logged-in user's profile

        // Validate inputs
        if (!serviceName || !price || !companyId) {
            return res.status(400).send('Service name, price, and company are required.');
        }

        // Save the new service to the database
        const service = new Service({
            serviceName: serviceName, // Ensure the field name matches the model
            price: parseFloat(price), // Ensure price is a number
            image: serviceImage,
            companyId, // Dynamically assigned
        });

        await service.save();

        // Redirect or send success response
        res.redirect('/admin/services');
    } catch (err) {
        console.error('Error creating service:', err.message);
        res.status(500).send(`Error creating service: ${err.message}`);
    }
});


module.exports = router;
