import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../config';
import '../styles/PersonalizedContent.css';
import Loader from './Loader';

const PersonalizedContent = () => {
  const { subjectId, subtopicId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication required. Please log in.');
          setLoading(false);
          return;
        }

        const response = await axios.post(
          `${config.apiBaseUrl}/subjects/${subjectId}/subtopics/${subtopicId}/personalized-content`,
          {
            quizHistory: location.state?.quizHistory || [],
            currentEmotion: location.state?.currentEmotion || 'neutral',
            subtopicAttempts: location.state?.subtopicAttempts || 0
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data && response.data.content) {
          setContent(response.data.content);
        } else {
          setError('No content available for this topic');
        }
      } catch (err) {
        console.error('Error loading content:', err);
        setError('Failed to load personalized content. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [subjectId, subtopicId, location.state]);

  const handleBackToQuiz = () => {
    // Use nextLevel from navigation state if present, otherwise default to 5
    const nextLevel = location.state?.nextLevel || 5;
    navigate(`/quiz/${subjectId}/${subtopicId}`, {
      state: {
        level: nextLevel,
        fromPersonalizedContent: true
      }
    });
  };

  if (loading) {
    return <Loader text="Loading personalized content..." />;
  }

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

  return (
    <div className="personalized-content-container">
      <div className="content-header">
        <h1>
          {location.state?.subtopicName ? `Topic: ${location.state.subtopicName}` : ''}
          <br />
          Let's learn the topic with a simpler approach.
        </h1>
      </div>
      
      <div className="content-body">
        <div className="content-main">
          {/* <div className="content-image">
            <img 
              src={`https://source.unsplash.com/800x400/?${subtopicId},education`} 
              alt="Learning illustration"
            />
          </div> */}
          
          <div 
            className="content-text"
            dangerouslySetInnerHTML={{ __html: content }}
          />

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