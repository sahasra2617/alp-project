// Import mongoose to work with MongoDB
const mongoose = require('mongoose');

// Define the structure (schema) for storing quiz progress
const quizInProgressSchema = new mongoose.Schema({
  // Store the ID of the user taking the quiz (must link to a User in the database)
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Store the ID of the subject related to the quiz (linked to a Subject)
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },

  // Store the ID of the specific subtopic being quizzed
  subtopicId: { type: mongoose.Schema.Types.ObjectId, required: true },

  // Level of the quiz (like difficulty level: 1, 2, 3, etc.)
  level: { type: Number, required: true },

  // Indicates whether the quiz has been attempted or not
  attempted: { type: Boolean, default: false },

  // The date and time when this quiz progress was last updated
  lastUpdated: { type: Date, default: Date.now }
});

// Create a model (collection) called "QuizInProgress" using the schema above
const QuizInProgress = mongoose.model('QuizInProgress', quizInProgressSchema);

// Export this model so it can be used in other files
module.exports = QuizInProgress;
