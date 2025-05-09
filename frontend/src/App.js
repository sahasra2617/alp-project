import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; // Importing necessary components from react-router-dom
import Auth from './components/Auth'; // Auth component (likely handles sign-in/sign-up)
import ForgotPassword from './components/ForgotPassword'; // ForgotPassword component for password recovery
import ResetPassword from './components/ResetPassword'; // ResetPassword component to handle password reset
import Dashboard from './components/Dashboard'; // Dashboard component for the user's main page
import SubjectDetails from './components/SubjectDetails'; // SubjectDetails component for viewing subject content
import Quiz from './components/Quiz'; // Quiz component for taking quizzes
import PersonalizedContent from './components/PersonalizedContent'; // PersonalizedContent component for custom reviews
import Progress from './components/Progress'; // Progress component for tracking the user's progress
import './App.css'; // Importing global CSS for styling

// Main App component with routing setup
function App() {
  return (
    <Router> {/* Router component that enables routing for the application */}
      <div className="App">
        <Routes> {/* Define all the routes here */}
          {/* Route for the homepage and sign-up page, both render the Auth component */}
          <Route path="/" element={<Auth />} />
          <Route path="/signup" element={<Auth />} />
          
          {/* Route for the ForgotPassword page, where users can initiate password recovery */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* Route for resetting the password after receiving a reset token */}
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Dashboard route, for users to access their main dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Progress route, for users to view their learning progress */}
          <Route path="/progress" element={<Progress />} />
          
          {/* Dynamic route for viewing subject details by subject ID */}
          <Route path="/subject/:subjectId" element={<SubjectDetails />} />
          
          {/* Dynamic route for taking quizzes, with both subject ID and subtopic ID */}
          <Route path="/quiz/:subjectId/:subtopicId" element={<Quiz />} />
          
          {/* Personalized review content route, with subject ID and subtopic ID */}
          <Route path="/subjects/:subjectId/subtopics/:subtopicId/review" element={<PersonalizedContent />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App; // Export the App component as the default export
