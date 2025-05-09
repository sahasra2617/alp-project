import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function ResetPassword() {
  // State to store the new password, confirm password, error messages, and success messages
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  // Retrieve the token from the URL parameters
  const { token } = useParams();
  const navigate = useNavigate(); // Hook to navigate programmatically after password reset

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent form default submission behavior

    // Check if the passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      // Send a POST request to the backend to reset the password
      const response = await axios.post(`http://localhost:5000/api/auth/reset-password/${token}`, {
        password // New password to be updated
      });
      
      // On successful password reset, set success message and navigate after 3 seconds
      setMessage(response.data.message);
      setTimeout(() => {
        navigate('/'); // Redirect to the login page after successful password reset
      }, 3000);
    } catch (err) {
      // If an error occurs, set error message
      setError(err.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <div className="auth-container">
      <h2>Reset Password</h2>
      <form className="auth-form" onSubmit={handleSubmit}>
        {/* Display error message if any */}
        {error && <div className="error-message">{error}</div>}
        
        {/* Display success message if the password reset was successful */}
        {message && <div className="success-message">{message}</div>}
        
        {/* New password input field */}
        <input
          type="password"
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)} // Update password state
          required
        />
        
        {/* Confirm password input field */}
        <input
          type="password"
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)} // Update confirmPassword state
          required
        />
        
        {/* Submit button */}
        <button type="submit">Update Password</button>
      </form>
    </div>
  );
}

export default ResetPassword;
