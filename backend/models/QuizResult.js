// Import mongoose to work with MongoDB
const mongoose = require('mongoose');

// Define a schema for storing each quiz result
const quizResultSchema = new mongoose.Schema({
  // The user's score in the quiz
  score: {
    type: Number,
    required: true
  },

  // Emotion detected or selected after the quiz
  emotion: {
    type: String,
    enum: ['happy', 'sad', 'neutral', 'angry', 'surprised'], // Only these values are allowed
    required: true
  },

  // The level at which the quiz was taken
  presentLevel: {
    type: Number,
    required: true
  },

  // The level the user will move to next
  nextLevel: {
    type: Number,
    required: true
  },

  // When this quiz result was recorded
  createdAt: {
    type: Date,
    default: Date.now // Automatically sets the current date/time
  }
});

// Define a schema for storing all quizzes taken by a user on a subtopic
const userQuizSchema = new mongoose.Schema({
  // Link to the user who took the quiz
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Link to the main subject of the quiz
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },

  // Link to a specific subtopic of the subject
  subtopicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject.subtopics', // Optional: This assumes subtopics are part of Subject schema
    required: true
  },

  // An array of quiz results for that user and subtopic
  results: [quizResultSchema]
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Create a model (collection) called "UserQuiz" using the schema above
const UserQuiz = mongoose.model('UserQuiz', userQuizSchema);

// Export the model so it can be used in other files
module.exports = UserQuiz;
