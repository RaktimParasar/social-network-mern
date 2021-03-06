const mongoose = require('mongoose');
const config = require('config');
const db = config.get('mongoURI');

//MongoDB connection
const connectDB = async () => {
    try {
        await mongoose.connect(db, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true,
            useFindAndModify: false
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.log(error.message);
        //Exit process with failure
        process.exit(1);
    }
}

module.exports = connectDB;