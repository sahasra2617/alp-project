// Import required modules
const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables from .env file

// Import the MongoDB connection function and Subject model
const connectDB = require('./config/db');
const Subject = require('./models/Subject');

// Define sample data for subjects and their subtopics
const subjects = [
  {
    name: "Java ",
    description: "Learn Java programming from basics to advanced concepts",
    imageUrl: "https://example.com/java.jpg",
    subtopics: [
      { name: "Variables", content: "", generated: false },
      { name: "Loops", content: "", generated: false },
      { name: "Arrays", content: "", generated: false },
      { name: "Methods", content: "", generated: false },
      { name: "Classes", content: "", generated: false }
    ]
  },
  {
    name: "Python",
    description: "Master Python programming language",
    imageUrl: "https://example.com/python.jpg",
    subtopics: [
      { name: "Introduction to Python", content: "", generated: false },
      { name: "Data Types", content: "", generated: false },
      { name: "Strings", content: "", generated: false },
      { name: "Functions", content: "", generated: false },
      { name: "Inheritance", content: "", generated: false }
    ]
  },
  {
    name: "Science",
    description: "Explore the wonders of SCIENCE",
    imageUrl: "https://example.com/plants.jpg",
    subtopics: [
      { name: "Plants", content: "", generated: false },
      { name: "Animals", content: "", generated: false },
      { name: "Digestive System", content: "", generated: false }
    ]
  },
  {
    name: "Computer Organization & Architecture",
    description: "Computer concepts",
    imageUrl: "https://example.com/math.jpg",
    subtopics: [
      { name: "Basic Computer Organization & Design", content: "", generated: false },
      { name: "Microprogrammed Control", content: "", generated: false },
      { name: "Central Processing Unit", content: "", generated: false }, // Note: typo in "Central"
      { name: "I/O organization", content: "", generated: false },
      { name: "Memory Organization", content: "", generated: false },
      { name: "Data Representation", content: "", generated: false },
      { name: "Computer Arithmetic", content: "", generated: false }
    ]
  },
  {
    name: "Mathematics",
    description: "Fundamental mathematics concepts",
    imageUrl: "https://example.com/math.jpg",
    subtopics: [
      { name: "Addition", content: "", generated: false },
      { name: "Subtraction", content: "", generated: false },
      { name: "Multiplication", content: "", generated: false },
      { name: "Division", content: "", generated: false },
      { name: "Fractions", content: "", generated: false }
    ]
  }
];

// Function to seed the database
const seedDatabase = async () => {
  try {
    // Step 1: Connect to the database
    await connectDB();
    console.log('Connected to MongoDB');

    // Step 2: Clear existing subjects to avoid duplication
    await Subject.deleteMany({});
    console.log('Cleared existing subjects');

    // Step 3: Insert the new subject data
    const insertedSubjects = await Subject.insertMany(subjects);
    console.log(`Inserted ${insertedSubjects.length} subjects`);

    // Step 4: Log inserted subject names and their IDs
    insertedSubjects.forEach(subject => {
      console.log(`${subject.name.trim()}: ${subject._id}`);
    });

    console.log('Database seeded successfully');
    process.exit(0); // Exit successfully
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1); // Exit with error
  }
};

// Run the seeding function
seedDatabase();
