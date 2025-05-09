import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../config';
import '../styles/Progress.css';
import Loader from './Loader';

const ITEMS_PER_PAGE = 5; // Number of subjects to show per page

const Progress = () => {
  const [quizHistory, setQuizHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const navigate = useNavigate();

  // Cache for quiz history data
  const [cachedData, setCachedData] = useState(new Map());

  useEffect(() => {
    const fetchQuizHistory = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        // Check cache first
        const cacheKey = `page_${currentPage}`;
        if (cachedData.has(cacheKey)) {
          setQuizHistory(cachedData.get(cacheKey));
          setLoading(false);
          return;
        }

        const response = await axios.get(
          `${config.apiBaseUrl}/quiz-history`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            params: {
              page: currentPage,
              limit: ITEMS_PER_PAGE
            }
          }
        );

        if (response.data && response.data.success) {
          const { quizHistory: newHistory, totalPages: pages } = response.data;
          setQuizHistory(newHistory);
          setTotalPages(pages);
          
          // Update cache
          setCachedData(prev => new Map(prev).set(cacheKey, newHistory));
        } else {
          throw new Error(response.data?.message || 'Failed to load quiz history');
        }
      } catch (err) {
        console.error('Error fetching quiz history:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load quiz history. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizHistory();
  }, [currentPage, cachedData]);

  const getDifficultyText = (level) => {
    if (level <= 3) return 'Beginner';
    if (level <= 6) return 'Intermediate';
    if (level <= 8) return 'Advanced';
    return 'Expert';
  };

  const getEmotionEmoji = (emotion) => {
    const emojis = {
      happy: '😊',
      sad: '😢',
      angry: '😠',
      neutral: '😐',
      surprised: '😲'
    };
    return emojis[emotion] || '😐';
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  // Memoize the organized history to prevent unnecessary recalculations
  const organizedHistory = useMemo(() => {
    const organized = {};
    quizHistory.forEach(quiz => {
      if (!organized[quiz.subjectName]) {
        organized[quiz.subjectName] = {};
      }
      if (!organized[quiz.subjectName][quiz.subtopicName]) {
        organized[quiz.subjectName][quiz.subtopicName] = [];
      }
      organized[quiz.subjectName][quiz.subtopicName].push(quiz);
    });
    return organized;
  }, [quizHistory]);

  const calculateAverageScore = (quizzes) => {
    if (quizzes.length === 0) return 0;
    const sum = quizzes.reduce((acc, quiz) => acc + quiz.score, 0);
    return Math.round(sum / quizzes.length);
  };

  const getHighestLevel = (quizzes) => {
    return Math.max(...quizzes.map(quiz => quiz.presentLevel));
  };

  const handleLoadMore = () => {
    if (currentPage < totalPages) {
      setIsLoadingMore(true);
      setCurrentPage(prev => prev + 1);
      setIsLoadingMore(false);
    }
  };

  if (loading && !isLoadingMore) {
    return <Loader text="Loading progress..." />;
  }

  if (error) {
    return (
      <div className="progress-container">
        <div className="error-message">{error}</div>
        <button onClick={handleBack}>Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="progress-container">
      <div className="progress-header">
        <h1>Your Learning Progress</h1>
        <button className="back-button" onClick={handleBack}>
          Back to Dashboard
        </button>
      </div>

      {Object.keys(organizedHistory).length === 0 ? (
        <div className="no-progress">
          <p>No quiz history available yet. Start taking quizzes to track your progress!</p>
        </div>
      ) : (
        <>
          <div className="progress-content">
            {Object.entries(organizedHistory).map(([subjectName, subtopics]) => {
              const isLong = subjectName.length > 18;
              return (
                <div key={subjectName} className="subject-section">
                  <h2
                    className={`subject-title${isLong ? ' long' : ''}`}
                    title={isLong ? subjectName : undefined}
                  >
                    {subjectName}
                  </h2>
                  {Object.entries(subtopics).map(([subtopicName, quizzes]) => {
                    const averageScore = calculateAverageScore(quizzes);
                    const highestLevel = getHighestLevel(quizzes);
                    const latestQuiz = quizzes[0];

                    return (
                      <div key={subtopicName} className="subtopic-card">
                        <div className="subtopic-header">
                          <h3>{subtopicName}</h3>
                          <div className="subtopic-stats">
                            <span className="stat-item">
                              <strong>Average Score:</strong> {averageScore}%
                            </span>
                            <span className="stat-item">
                              <strong>Highest Level:</strong> {highestLevel} ({getDifficultyText(highestLevel)})
                            </span>
                            <span className="stat-item">
                              <strong>Attempts:</strong> {quizzes.length}
                            </span>
                          </div>
                        </div>
                        
                        <div className="quiz-history">
                          <h4>Recent Attempts:</h4>
                          {quizzes.slice(0, 3).map((quiz, index) => (
                            <div key={index} className="quiz-attempt">
                              <div className="attempt-date">
                                {new Date(quiz.createdAt).toLocaleDateString()}
                              </div>
                              <div className="attempt-details">
                                <span className={`score ${quiz.score >= 60 ? 'pass' : 'fail'}`}>
                                  Score: {quiz.score}%
                                </span>
                                <span className="emotion">
                                  {getEmotionEmoji(quiz.emotion)} {quiz.emotion}
                                </span>
                                <span className="level">
                                  Level: {quiz.presentLevel} ({getDifficultyText(quiz.presentLevel)})
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
          
          {currentPage < totalPages && (
            <div className="load-more-container">
              <button 
                className="load-more-button"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Progress; 