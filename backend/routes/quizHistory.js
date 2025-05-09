// Import required modules
const express = require('express');
const router = express.Router();

// Import the QuizResult model (used to access quiz data from MongoDB)
const QuizResult = require('../models/QuizResult');

// Import the authentication middleware to protect this route
const auth = require('../middleware/auth');

// Route: GET /api/quiz-results/
// Description: Get user's quiz history with pagination
// Access: Private (requires user to be logged in)
router.get('/', auth, async (req, res) => {
  try {
    // Get page number and limit from query parameters, or use default values
    const page = parseInt(req.query.page) || 1;     // Default to page 1
    const limit = parseInt(req.query.limit) || 5;   // Default to 5 results per page
    const skip = (page - 1) * limit;                // Calculate how many results to skip

    // Count total number of quiz results for this user
    const totalQuizzes = await QuizResult.countDocuments({ userId: req.user.id });

    // Calculate total number of pages
    const totalPages = Math.ceil(totalQuizzes / limit);

    // Fetch quiz results for the current page
    const quizHistory = await QuizResult.find({ userId: req.user.id })
      .sort({ createdAt: -1 }) // Show latest results first
      .skip(skip)              // Skip the previous page's results
      .limit(limit)            // Limit to the current page's size
      .select('subjectName subtopicName score emotion presentLevel createdAt') // Return only selected fields
      .lean();                // Convert to plain JavaScript objects (faster & cleaner)

    // Send the result as a JSON response
    res.json({
      success: true,
      quizHistory,
      totalPages,
      currentPage: page,
      totalQuizzes
    });

  } catch (error) {
    // Handle any errors
    console.error('Error fetching quiz history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz history'
    });
  }
});

// Export this router to be used in the main app
module.exports = router;
