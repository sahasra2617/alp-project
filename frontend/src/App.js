import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Auth from './components/Auth';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Dashboard from './components/Dashboard';
import SubjectDetails from './components/SubjectDetails';
import Quiz from './components/Quiz';
import PersonalizedContent from './components/PersonalizedContent';
import Progress from './components/Progress';
import './App.css';
// require('dotenv').config();


function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/signup" element={<Auth />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/subject/:subjectId" element={<SubjectDetails />} />
          <Route path="/quiz/:subjectId/:subtopicId" element={<Quiz />} />
          <Route path="/subjects/:subjectId/subtopics/:subtopicId/review" element={<PersonalizedContent />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 