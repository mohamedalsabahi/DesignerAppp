
// config/database.js
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb+srv://amadoww12:Mm1234=1234@cluster0.cjdnr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'); // Remove deprecated options
        console.log('MongoDB connected');
    } catch (err) {
        console.log("try to connect database ");

        console.error(err.message);
        process.exit(1); // Exit process with failure
    }
};

module.exports = connectDB;
