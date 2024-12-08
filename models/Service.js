const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const serviceSchema = new mongoose.Schema({
    serviceName: { type: String, required: true },
    price: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
    image: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false } // Reference to User
});

module.exports = mongoose.model('Service', serviceSchema);
