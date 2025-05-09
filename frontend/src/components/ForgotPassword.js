import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function ForgotPassword() {
  // State to manage the email input, message, and error feedback
  const [email, setEmail] = useState(''); // Stores the email input value
  const [message, setMessage] = useState(''); // Stores the success message
  const [error, setError] = useState(''); // Stores any error message

  // Function to handle the form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevents the default form submission behavior
    try {
      // Sends a POST request to the backend to initiate the password reset process
      const response = await axios.post('http://localhost:5000/api/auth/forgot-password', {
        email
      });
      
      // If successful, display the success message
      setMessage(response.data.message);
      setError(''); // Clear any previous error messages
    } catch (err) {
      // If an error occurs, display the error message
      setError(err.response?.data?.message || 'An error occurred');
      setMessage(''); // Clear any success messages
    }
  };

  return (
    <div className="auth-container">
      {/* Page title */}
      <h2>Forgot Password</h2>
      
      {/* Form for entering email to reset the password */}
      <form className="auth-form" onSubmit={handleSubmit}>
        {/* Display error message if there's an error */}
        {error && <div className="error-message">{error}</div>}
        
        {/* Display success message if the request was successful */}
        {message && <div className="success-message">{message}</div>}
        
        {/* Email input field */}
        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)} // Updates the email state on change
          required
        />
        
        {/* Submit button */}
        <button type="submit">Reset Password</button>
      </form>
      
      {/* Link to go back to the login page */}
      <div className="auth-links">
        <Link to="/">Back to Login</Link>
      </div>
    </div>
  );
}

export default ForgotPassword;
