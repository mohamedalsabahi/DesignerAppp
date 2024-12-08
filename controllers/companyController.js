const CompanyProfile = require('../models/CompanyProfile'); // Company model
const Service = require('../models/Service'); // Service model

// Create a new company profile
exports.createCompanyProfile = async (req, res) => {
    try {
        const { name, image, mobile, email, adminId } = req.body;
        const company = new CompanyProfile({ name, image, mobile, email, admin: adminId });
        await company.save();
        res.status(201).json(company);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Get a company profile by admin user ID
exports.getCompanyProfile = async (req, res) => {
    try {
        const { adminId } = req.params;
        const company = await CompanyProfile.findOne({ admin: adminId });
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }
        res.status(200).json(company);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get all companies with related services
exports.getAllCompaniesWithServices = async (req, res) => {
    try {
        const companies = await CompanyProfile.find().populate('admin', 'username email').lean();

        const companiesWithServices = await Promise.all(
            companies.map(async (company) => {
                const services = await Service.find({ company: company._id }).lean();
                return { ...company, services };
            })
        );

        res.status(200).json(companiesWithServices);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
