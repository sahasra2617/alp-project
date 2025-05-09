// Import required modules
const mongoose = require('mongoose'); // Mongoose is used to connect and interact with MongoDB
const dotenv = require('dotenv');     // dotenv loads environment variables from .env file
dotenv.config();                      // Load environment variables like MONGO_URI

// This async function connects to the database and attempts to fix an index issue
async function fixDatabase() {
  try {
    // Step 1: Connect to MongoDB
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,        // Use the updated URL parser
      useUnifiedTopology: true      // Use the updated server engine
    });
    
    console.log('Connected to MongoDB successfully');
    
    // Step 2: Try to remove a possibly problematic index on the 'username' field
    try {
      await mongoose.connection.db.collection('users').dropIndex('username_1'); // Tries to drop the index named 'username_1'
      console.log('Successfully dropped the username_1 index');
    } catch (indexError) {
      // If index doesn't exist, catch the error and print a message
      console.log('Error dropping index (might not exist):', indexError.message);
    }
    
    // Step 3: List all remaining indexes to confirm what still exists
    const indexes = await mongoose.connection.db.collection('users').indexes();
    console.log('Remaining indexes on users collection:');
    indexes.forEach(index => {
      console.log(`- ${JSON.stringify(index.key)}`); // Show the fields that are still indexed
    });
    
    // Step 4: Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
    // Final message
    console.log('Database fixed successfully. You can now restart your server.');
    
  } catch (error) {
    // If something goes wrong during any step, log the error
    console.error('Error fixing database:', error);
  }
}

// Call the function to run it
fixDatabase();
