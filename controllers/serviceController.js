const Service = require('../models/Service');

// Add a new service
exports.addService = async (req, res) => {
    const { serviceName, price, image, company } = req.body;
    try {
        const service = new Service({ serviceName, price, image, company });
        await service.save();
        res.status(201).json({ message: 'Service added successfully', service });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Get services by company ID
exports.getServices = async (req, res) => {
    const { companyId } = req.params;
    try {
        const services = await Service.find({ company: companyId });
        if (!services.length) {
            return res.status(404).json({ error: 'No services found for this company' });
        }
        res.status(200).json(services);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};
