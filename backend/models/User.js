// Import mongoose to work with MongoDB
const mongoose = require('mongoose');

// Define the structure of a user document
const userSchema = new mongoose.Schema({
  // Username for the user (must be 3–30 characters)
  username: { 
    type: String, 
    required: true,       // Must be provided
    trim: true,           // Removes spaces at start/end
    minlength: 3,
    maxlength: 30
  },

  // Email of the user (must be unique and in valid format)
  email: { 
    type: String, 
    required: true, 
    unique: true,         // No two users can have the same email
    trim: true,
    lowercase: true,      // Stores the email in lowercase
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address'] // Regex to validate email format
  },

  // User's password (minimum 6 characters)
  password: { 
    type: String, 
    required: true,
    minlength: 6
  },

  // Optional first name of the user
  firstName: {
    type: String,
    trim: true,
    maxlength: 50
  },

  // Optional last name of the user
  lastName: {
    type: String,
    trim: true,
    maxlength: 50
  },

  // Optional phone number (must be exactly 10 digits)
  phoneNumber: {
    type: String,
    trim: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },

  // Date and time of the last login
  lastLogin: { 
    type: Date,
    default: null // Default is null if the user hasn’t logged in yet
  },

  // Token used for password reset (if any)
  resetToken: { 
    type: String,
    default: null
  },

  // Expiry time for the reset token
  resetTokenExpiry: { 
    type: Date,
    default: null
  }
}, { 
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Export the model to use in other files
module.exports = mongoose.model('User', userSchema);
