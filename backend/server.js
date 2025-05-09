const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('./config/db');
const User = require('./models/User');
const Subject = require('./models/Subject');
const UserQuiz = require('./models/QuizResult');
const QuizInProgress = require('./models/QuizInProgress');

const app = express();

// Initialize Gemini
let genAI;
let model;

try {
  if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set in environment variables');
  } else {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    console.log('Gemini Flash 2.0 initialized successfully');
  }
} catch (error) {
  console.error('Error initializing Gemini Flash 2.0:', error);
}

// Connect to MongoDB
connectDB()
  .then(() => {
    console.log('MongoDB connection established in server.js');
    
    // Log environment variables (without sensitive data)
    console.log('Environment check:');
    console.log('- MONGO_URI:', process.env.MONGO_URI ? 'Set' : 'Not set');
    console.log('- JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');
    console.log('- PORT:', process.env.PORT || 5000);
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB in server.js:', err);
  });

// Middleware
app.use(cors());
app.use(express.json());

// Emotion detection endpoint
app.post('/api/detect-emotion', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ message: 'Image is required' });
    }

    // For now, return a mock emotion
    // TODO: Replace with actual emotion detection logic
    const emotions = ['happy', 'sad', 'angry', 'neutral', 'surprised'];
    const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
    
    console.log('Detected emotion:', randomEmotion);
    res.json({ emotion: randomEmotion });
  } catch (error) {
    console.error('Error in emotion detection:', error);
    res.status(500).json({ message: 'Error detecting emotion' });
  }
});

// Authentication middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ email: decoded.email });

    if (!user) {
      throw new Error();
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Please authenticate' });
  }
};

// Signup route
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, phoneNumber } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email and password are required' });
    }

    // Validate email format
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() }
      ]
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.email === email.toLowerCase() 
          ? 'Email already registered' 
          : 'Username already taken'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = new User({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName: firstName || '',
      lastName: lastName || '',
      phoneNumber: phoneNumber || ''
    });

    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
});


// Login route
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    user.lastLogin = Date.now();
    await user.save();

    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in' });
  }
});

// Get authenticated user info
app.get('/api/auth/user', auth, async (req, res) => {
  try {
    res.json({
      email: req.user.email,
      username: req.user.username,
      createdAt: req.user.createdAt,
      lastLogin: req.user.lastLogin
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user data' });
  }
});

// Forgot password
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const resetToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000;
    await user.save();

    const resetLink = `http://localhost:3000/reset-password/${resetToken}`;

    /*
    await transporter.sendMail({
      to: email,
      subject: 'Password Reset',
      html: `Click <a href="${resetLink}">here</a> to reset your password.`
    });
    */

    res.json({ message: 'Password reset link sent to email' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending reset email' });
  }
});

// Reset password
app.post('/api/auth/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting password' });
  }
});

// Generate content route
app.post('/api/subjects/:subjectId/subtopics/:subtopicId/generate', auth, async (req, res) => {
  try {
    const { subjectId, subtopicId } = req.params;
    
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    const subtopic = subject.subtopics.id(subtopicId);
    if (!subtopic) {
      return res.status(404).json({ message: 'Subtopic not found' });
    }

    if (!model) {
      return res.status(500).json({ message: 'Gemini Flash 2.0 model not initialized. Please check your API key configuration.' });
    }

    // Enhanced prompt for better content generation
    const prompt = `Generate comprehensive educational content about "${subtopic.name}" in the context of "${subject.name}".
    
    Please structure the content in the following format using proper markdown:

    # ${subtopic.name}

    ## Overview
    [Provide a brief introduction and overview of the topic]

    ## Key Concepts
    [List and explain the main concepts with clear definitions]

    ## Detailed Explanation
    [Provide detailed explanations with examples]

    ## Examples
    [Include practical examples with code snippets if applicable]

    ## Best Practices
    [List important best practices and tips]

    ## Common Mistakes
    [Highlight common mistakes and how to avoid them]

    ## Summary
    [Provide a concise summary of the key points]

    Please ensure:
    1. Use proper markdown formatting for headings, lists, and code blocks
    2. Include relevant examples and code snippets where appropriate
    3. Make the content engaging and easy to understand
    4. Use bullet points and numbered lists for better readability
    5. Include practical applications and real-world examples`;

    console.log('Generating content with enhanced prompt for:', subtopic.name);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let generatedContent = response.text();

    // Replace any occurrences of "Common Pitfalls" with "Common Mistakes"
    generatedContent = generatedContent.replace(/## Common Pitfalls/g, '## Common Mistakes');

    console.log('Content generated successfully for:', subtopic.name);

    subtopic.content = generatedContent;
    subtopic.generated = true;
    await subject.save();

    res.json({ content: generatedContent });
  } catch (error) {
    console.error('Error in content generation:', error);
    res.status(500).json({ 
      message: 'Error generating content',
      error: error.message 
    });
  }
});

// Get subject by ID
app.get('/api/subjects/:subjectId', auth, async (req, res) => {
  try {
    const { subjectId } = req.params;
    
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    
    res.json(subject);
  } catch (error) {
    console.error('Error fetching subject:', error);
    res.status(500).json({ message: 'Error fetching subject data' });
  }
});

// Get all subjects
app.get('/api/subjects', auth, async (req, res) => {
  try {
    const subjects = await Subject.find({});
    res.json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ message: 'Error fetching subjects' });
  }
});

// Generate quiz questions
app.get('/api/subjects/:subjectId/subtopics/:subtopicId/quiz', async (req, res) => {
  try {
    const { subjectId, subtopicId } = req.params;
    const { previousScore, previousEmotion, previousLevel, level } = req.query;
    console.log('Quiz generation request:', { subjectId, subtopicId, previousScore, previousEmotion, previousLevel, level });

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(subjectId) || !mongoose.Types.ObjectId.isValid(subtopicId)) {
      return res.status(400).json({ message: 'Invalid subject or subtopic ID' });
    }

    // Find the subject and subtopic
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    const subtopic = subject.subtopics.id(subtopicId);
    if (!subtopic) {
      return res.status(404).json({ message: 'Subtopic not found' });
    }

    // Determine the next level based on previous performance or query param
    let nextLevel = 5; // Default starting level
    if (level) {
      nextLevel = parseInt(level);
    } else if (previousScore && previousEmotion && previousLevel) {
      const score = parseFloat(previousScore);
      const prevLevel = parseInt(previousLevel);
      if (score >= 80) {
        nextLevel = Math.min(prevLevel + 1, 10);
      } else if (score < 50) {
        nextLevel = Math.max(prevLevel - 1, 1);
      } else {
        nextLevel = prevLevel;
      }
      if (previousEmotion === 'confused' || previousEmotion === 'sad') {
        nextLevel = Math.max(nextLevel - 1, 1);
      } else if (previousEmotion === 'excited' || previousEmotion === 'happy') {
        nextLevel = Math.min(nextLevel + 1, 10);
      }
    }
    if (isNaN(nextLevel) || nextLevel < 1 || nextLevel > 10) {
      nextLevel = 5;
    }

    // Generate quiz questions
    const prompt = `Generate 5 multiple choice questions about "${subtopic.name}" in the context of "${subject.name}".
    Each question should have 4 options and one correct answer.
    The questions should be appropriate for level ${nextLevel} out of 10, where:
    - Levels 1-4 focus on basic concepts
    - Levels 5-7 focus on intermediate concepts
    - Levels 8-10 focus on advanced concepts

    Format the response as a JSON array with the following structure:
    [
      {
        "question": "The question text",
        "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
        "correctAnswer": "The correct option",
        "level": ${nextLevel}
      }
    ]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    // Clean and parse the response
    const cleanedResponse = text.replace(/```json\n|\n```/g, '').trim();
    const questions = JSON.parse(cleanedResponse);
    // Add level to each question
    questions.forEach(question => {
      question.level = nextLevel;
    });
    res.json({
      questions,
      level: nextLevel
    });
  } catch (error) {
    console.error('Error generating quiz:', error);
    console.error('Quiz generation error stack:', error.stack);
    res.status(500).json({ 
      message: 'Error generating quiz questions',
      details: error.message
    });
  }
});

// Quiz results endpoint
app.post('/api/subjects/:subjectId/subtopics/:subtopicId/quiz-results', auth, async (req, res) => {
  try {
    const { subjectId, subtopicId } = req.params;
    const { score, emotion, presentLevel, nextLevel } = req.body;
    const userId = req.user._id;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(subjectId) || !mongoose.Types.ObjectId.isValid(subtopicId)) {
      return res.status(400).json({ message: 'Invalid subject or subtopic ID' });
    }

    // Find or create user quiz document
    let userQuiz = await UserQuiz.findOne({
      userId,
      subjectId,
      subtopicId
    });

    if (!userQuiz) {
      userQuiz = new UserQuiz({
        userId,
        subjectId,
        subtopicId,
        results: []
      });
    }

    // Add new quiz result
    userQuiz.results.push({
      score,
      emotion,
      presentLevel,
      nextLevel
    });

    await userQuiz.save();

    res.json({ message: 'Quiz results saved successfully', userQuiz });
  } catch (error) {
    console.error('Error saving quiz results:', error);
    res.status(500).json({ message: 'Failed to save quiz results' });
  }
});

// Get quiz results for a user
app.get('/api/subjects/:subjectId/subtopics/:subtopicId/quiz-results', auth, async (req, res) => {
  try {
    const { subjectId, subtopicId } = req.params;
    const userId = req.user._id;

    const userQuiz = await UserQuiz.findOne({
      userId,
      subjectId,
      subtopicId
    });

    if (!userQuiz) {
      return res.json({ results: [] });
    }

    res.json({ results: userQuiz.results });
  } catch (error) {
    console.error('Error fetching quiz results:', error);
    res.status(500).json({ message: 'Failed to fetch quiz results' });
  }
});

// Generate personalized content
app.post('/api/subjects/:subjectId/subtopics/:subtopicId/personalized-content', auth, async (req, res) => {
  try {
    const { subjectId, subtopicId } = req.params;
    const { quizHistory, currentEmotion, subtopicAttempts } = req.body;
    
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    const subtopic = subject.subtopics.id(subtopicId);
    if (!subtopic) {
      return res.status(404).json({ message: 'Subtopic not found' });
    }

    if (!model) {
      return res.status(500).json({ message: 'Gemini Flash 2.0 model not initialized' });
    }

    // Filter quiz history for this specific subtopic
    const subtopicHistory = quizHistory.filter(q => q.subtopicId === subtopicId);
    const successRate = subtopicHistory.filter(q => q.score >= 60).length / subtopicHistory.length;
    const averageScore = subtopicHistory.reduce((sum, q) => sum + q.score, 0) / subtopicHistory.length;
    const commonEmotions = subtopicHistory.map(q => q.emotion);
    
    // Generate personalized content prompt
    const contentPrompt = `You are an educational AI assistant. Generate simplified learning content for a student who:
- Has attempted this topic ${subtopicAttempts} times
- Success rate: ${(successRate * 100).toFixed(1)}%
- Average score: ${averageScore.toFixed(1)}%
- Current emotional state: ${currentEmotion}
- Common emotions during learning: ${[...new Set(commonEmotions)].join(', ')}

Please generate EASY-TO-UNDERSTAND content about "${subtopic.name}" in the context of "${subject.name}" that:
1. Uses VERY SIMPLE language and LOTS of examples
2. Breaks down EVERY concept into tiny, easy-to-digest parts
3. Uses MANY visual analogies and real-world examples
4. Provides EXTREMELY detailed step-by-step explanations
5. Uses a FRIENDLY, encouraging tone
6. Includes MANY practice questions with detailed solutions
7. Focuses on building confidence through small successes

Format the content using HTML with appropriate tags for:
- Headings (h1, h2, h3)
- Paragraphs
- Lists (ordered and unordered)
- Code blocks (if applicable)
- Examples and analogies
- Practice questions with solutions

Make the content:
- EXTREMELY beginner-friendly
- Focus on ONE concept at a time
- Include MANY examples
- Use SIMPLE language
- Be VERY encouraging
- Include LOTS of practice
- Build confidence through small steps

Remember: This student has struggled with this topic multiple times, so make it as simple and clear as possible.`;

    console.log('Generating simplified content with prompt:', contentPrompt);
    
    const result = await model.generateContent(contentPrompt);
    const response = await result.response;
    const generatedContent = response.text();

    res.json({ content: generatedContent });
  } catch (error) {
    console.error('Error generating personalized content:', error);
    res.status(500).json({ 
      message: 'Error generating personalized content',
      error: error.message
    });
  }
});

// Get quiz history for the logged-in user
app.get('/api/quiz-history', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all quiz results for the user
    const userQuizzes = await UserQuiz.find({ userId })
      .populate({
        path: 'subjectId',
        select: 'name subtopics',
        model: 'Subject'
      })
      .sort({ 'results.createdAt': -1 });

    // Transform the data to include subject and subtopic names
    const quizHistory = userQuizzes.flatMap(userQuiz => {
      const subject = userQuiz.subjectId;
      const subtopic = subject?.subtopics?.find(st => st._id.toString() === userQuiz.subtopicId.toString());
      
      return userQuiz.results.map(result => ({
        subjectName: subject?.name || 'Unknown Subject',
        subtopicName: subtopic?.name || 'Unknown Subtopic',
        score: result.score,
        emotion: result.emotion,
        presentLevel: result.presentLevel,
        nextLevel: result.nextLevel,
        createdAt: result.createdAt
      }));
    });

    res.json({ 
      success: true,
      quizHistory 
    });
  } catch (error) {
    console.error('Error fetching quiz history:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch quiz history',
      error: error.message 
    });
  }
});

// Create or update a quiz in progress
app.post('/api/quiz-in-progress', auth, async (req, res) => {
  try {
    const { subjectId, subtopicId, level } = req.body;
    const userId = req.user._id;
    if (!subjectId || !subtopicId || !level) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    let quiz = await QuizInProgress.findOne({ userId, subjectId, subtopicId, attempted: false });
    if (quiz) {
      quiz.level = level;
      quiz.lastUpdated = Date.now();
      await quiz.save();
    } else {
      quiz = new QuizInProgress({ userId, subjectId, subtopicId, level, attempted: false });
      await quiz.save();
    }
    res.json({ success: true, quiz });
  } catch (error) {
    console.error('Error saving quiz in progress:', error);
    res.status(500).json({ message: 'Failed to save quiz in progress' });
  }
});

// Mark a quiz in progress as attempted (completed)
app.post('/api/quiz-in-progress/complete', auth, async (req, res) => {
  try {
    const { subjectId, subtopicId, level } = req.body;
    const userId = req.user._id;
    let quiz = await QuizInProgress.findOne({ userId, subjectId, subtopicId, attempted: false });
    if (quiz) {
      quiz.attempted = true;
      quiz.lastUpdated = Date.now();
      await quiz.save();
      res.json({ success: true });
    } else {
      // If not found, create as attempted=true (upsert)
      quiz = new QuizInProgress({ userId, subjectId, subtopicId, level: level || 1, attempted: true });
      await quiz.save();
      res.json({ success: true, created: true });
    }
  } catch (error) {
    console.error('Error completing quiz in progress:', error);
    res.status(500).json({ message: 'Failed to complete quiz in progress' });
  }
});

// Get all in-progress quizzes for the user
app.get('/api/quiz-in-progress', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find all in-progress quizzes for the user
    const quizzes = await QuizInProgress.find({ 
      userId, 
      attempted: false 
    })
    .populate({
      path: 'subjectId',
      select: 'name subtopics',
      model: 'Subject'
    })
    .sort({ lastUpdated: -1 });

    // Transform the data to include subject and subtopic names
    const quizzesWithNames = quizzes.map(q => {
      const subject = q.subjectId;
      const subtopic = subject?.subtopics?.find(st => 
        st._id.toString() === q.subtopicId.toString()
      );
      
      return {
        subjectId: subject?._id || q.subjectId,
        subtopicId: q.subtopicId,
        level: q.level || 1,
        subjectName: subject?.name || 'Unknown Subject',
        subtopicName: subtopic?.name || 'Unknown Subtopic',
        lastUpdated: q.lastUpdated
      };
    });

    console.log('Sending quizzes:', quizzesWithNames); // Debug log
    
    res.json({ 
      success: true, 
      quizzes: quizzesWithNames 
    });
  } catch (error) {
    console.error('Error fetching quizzes in progress:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch quizzes in progress',
      error: error.message 
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


console.log('JWT_SECRET:', process.env.JWT_SECRET);
console.log('MONGO_URI:', process.env.MONGO_URI);