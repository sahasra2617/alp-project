import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../config';
import '../styles/PersonalizedContent.css';
import Loader from './Loader';

const PersonalizedContent = () => {
  // Extract the subjectId and subtopicId from the URL parameters
  const { subjectId, subtopicId } = useParams();
  
  // Access the current location state from React Router for quiz history and emotion
  const location = useLocation();
  
  // Use navigate hook to navigate programmatically
  const navigate = useNavigate();
  
  // State to store the fetched content, loading state, and error messages
  const [content, setContent] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch personalized content when the component is mounted or parameters change
  useEffect(() => {
    const fetchContent = async () => {
      try {
        // Get the stored authentication token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication required. Please log in.');
          setLoading(false);
          return;
        }

        // Make an API request to fetch personalized content based on quiz history and emotion
        const response = await axios.post(
          `${config.apiBaseUrl}/subjects/${subjectId}/subtopics/${subtopicId}/personalized-content`,
          {
            quizHistory: location.state?.quizHistory || [], // Optional quiz history passed in state
            currentEmotion: location.state?.currentEmotion || 'neutral', // Current emotional state
            subtopicAttempts: location.state?.subtopicAttempts || 0 // Number of attempts on the subtopic
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        // Check if the response contains valid content
        if (response.data && response.data.content) {
          setContent(response.data.content);
        } else {
          setError('No content available for this topic');
        }
      } catch (err) {
        // If an error occurs, set the error state with a friendly message
        console.error('Error loading content:', err);
        setError('Failed to load personalized content. Please try again later.');
      } finally {
        // Set loading to false once the request is completed
        setLoading(false);
      }
    };

    fetchContent();
  }, [subjectId, subtopicId, location.state]); // Re-run if the subjectId, subtopicId, or location state changes

  // Function to handle navigation back to the quiz page
  const handleBackToQuiz = () => {
    // Use the nextLevel from the location state if available, otherwise default to 5
    const nextLevel = location.state?.nextLevel || 5;
    
    // Navigate to the quiz page with the next level and other relevant state
    navigate(`/quiz/${subjectId}/${subtopicId}`, {
      state: {
        level: nextLevel,
        fromPersonalizedContent: true
      }
    });
  };

  // If content is still loading, display the loader component
  if (loading) {
    return <Loader text="Loading personalized content..." />;
  }

  // If there's an error, display the error message with navigation options
  if (error) {
    return (
      <div className="personalized-content-container">
        <div className="error-message">{error}</div>
        <div className="content-navigation">
          <button onClick={handleBackToQuiz}>
            Back to Quiz
          </button>
          <button onClick={() => navigate(`/subject/${subjectId}`)}>
            Back to Subject
          </button>
        </div>
      </div>
    );
  }

  // Render the personalized content if no errors and content is available
  return (
    <div className="personalized-content-container">
      <div className="content-header">
        <h1>
          {/* Display the subtopic name if available, followed by the topic message */}
          {location.state?.subtopicName ? `Topic: ${location.state.subtopicName}` : ''}
          <br />
          Let's learn the topic with a simpler approach.
        </h1>
      </div>
      
      <div className="content-body">
        <div className="content-main">
          {/* Optionally, you can add an image to illustrate the topic */}
          {/* <div className="content-image">
            <img 
              src={`https://source.unsplash.com/800x400/?${subtopicId},education`} 
              alt="Learning illustration"
            />
          </div> */}
          
          {/* Display the personalized content using dangerouslySetInnerHTML */}
          <div 
            className="content-text"
            dangerouslySetInnerHTML={{ __html: content }} // This allows rendering HTML content
          />

          {/* Back to Quiz button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1em' }}>
            <button className="back-to-quiz-btn" onClick={handleBackToQuiz}>
              Back to Quiz
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalizedContent;
