// Import the mongoose library to work with MongoDB
const mongoose = require('mongoose'); 

// Import dotenv to access environment variables from a .env file
const dotenv = require('dotenv');
dotenv.config(); // Load environment variables (like database link) into the app

// Create an async function to connect to the database
const connectDB = async () => {
  try {
    // Try to connect to MongoDB using the link stored in .env file
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true, // Helps MongoDB understand the connection string better
      useUnifiedTopology: true // Makes connection handling more stable
    });

    // Show this message if connected successfully
    console.log("MongoDB connected");
  } catch (err) {
    // If something goes wrong, show the error and stop the app
    console.error("MongoDB connection error:", err);
    process.exit(1); // Stop the app with an error code
  }
};

// Allow this function to be used in other files
module.exports = connectDB;
