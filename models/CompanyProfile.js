const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const companyProfileSchema = new mongoose.Schema({
    image: { type: String, required: true },
    name: { type: String, required: true, unique: true }, // Ensure unique company names
    mobile: { type: String },
    email: { type: String, required: true, unique: true }, // Ensure unique emails
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to admin user
}, {
    timestamps: true // Automatically adds createdAt and updatedAt timestamps
});


module.exports = mongoose.model('CompanyProfile', companyProfileSchema);
