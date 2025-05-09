// Import required modules
const mongoose = require('mongoose'); // Mongoose helps us connect and work with MongoDB
const dotenv = require('dotenv');     // dotenv loads environment variables from a .env file
dotenv.config();                      // Load the variables (like MONGO_URI)

// This is an async function to check and log details about the database
async function checkDatabase() {
  try {
    // Start connection process
    console.log('Connecting to MongoDB...');
    console.log('MONGO_URI:', process.env.MONGO_URI); // Log the connection string being used (for debugging)

    // Connect to MongoDB using the URI from .env file
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,        // Uses new URL parser to avoid warnings
      useUnifiedTopology: true      // Uses the new server discovery engine
    });

    console.log('Connected to MongoDB successfully');

    // List all collections (like tables) in the current database
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections in database:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`); // Log each collection name
    });

    // Create a temporary User model that allows all fields (strict: false) to read from the users collection
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

    // Fetch all users from the users collection
    const users = await User.find({});
    console.log(`Found ${users.length} users in the database`);

    // If users are found, print out their email and creation date
    if (users.length > 0) {
      console.log('User details:');
      users.forEach(user => {
        console.log(`- Email: ${user.email}, Created: ${user.createdAt}`);
      });
    }

    // Check all indexes in the users collection (like unique constraints on email)
    const indexes = await mongoose.connection.db.collection('users').indexes();
    console.log('Indexes on users collection:');
    indexes.forEach(index => {
      console.log(`- ${JSON.stringify(index.key)}`); // Log which fields are indexed
    });

    // Disconnect from MongoDB once all checks are done
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');

  } catch (error) {
    // Log any error that occurs during the process
    console.error('Error checking database:', error);
  }
}

// Call the function to run it
checkDatabase();
