import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../config';
import '../styles/Auth.css';

function Auth() {
  // State hooks to manage form input values and UI state
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(''); // Error message state
  const [success, setSuccess] = useState(''); // Success message state
  const [isLoading, setIsLoading] = useState(false); // Loading state for the form submission
  const [username, setUsername] = useState(''); // Username state for signup
  const [showPassword, setShowPassword] = useState(false); // Toggle password visibility
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // Toggle confirm password visibility
  const navigate = useNavigate(); // React Router navigate function for page redirection

  // useEffect hook to reset error and success messages after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setError('');
      setSuccess('');
    }, 5000);
    return () => clearTimeout(timer); // Clean up timer on component unmount
  }, [error, success]);

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
    setError(''); // Clear any previous errors
    setSuccess(''); // Clear any previous success messages
    setIsLoading(true); // Set loading state to true

    // Check if mode is 'signup'
    if (mode === 'signup') {
      // Validate input for signup mode
      if (!username.trim()) {
        setError('Username is required');
        setIsLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setIsLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long');
        setIsLoading(false);
        return;
      }

      // Send signup request to backend API
      try {
        const response = await axios.post(`${config.apiBaseUrl}/auth/signup`, { username, email, password });
        setSuccess('Account created successfully!');
        setTimeout(() => {
          setMode('login'); // Switch to login mode after successful signup
          setSuccess(''); // Clear success message
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          setUsername('');
        }, 1500);
      } catch (err) {
        // Handle signup error
        const errorMessage = err.response?.data?.message || 'An error occurred during signup';
        setError(errorMessage);
      } finally {
        setIsLoading(false); // Reset loading state
      }
    } else { // If mode is 'login'
      // Send login request to backend API
      try {
        const response = await axios.post(`${config.apiBaseUrl}/auth/login`, { email, password });
        if (response.data && response.data.token) {
          localStorage.setItem('token', response.data.token); // Store token in localStorage
          setSuccess('Login successful!!!');
          setTimeout(() => {
            navigate('/dashboard'); // Redirect to dashboard after successful login
          }, 1500);
        } else {
          setError('Invalid response from server');
        }
      } catch (err) {
        // Handle login error
        const errorMessage = err.response?.data?.message || 'An error occurred during login';
        setError(errorMessage);
      } finally {
        setIsLoading(false); // Reset loading state
      }
    }
  };

  return (
    <div className="auth-outer-container">
      <div className="auth-container">
        {/* Display form title based on mode (login or signup) */}
        <h2 className="auth-title">{mode === 'login' ? 'Login Form' : 'Signup Form'}</h2>

        {/* Toggle between login and signup modes */}
        <div className="auth-toggle">
          <button
            className={mode === 'login' ? 'active' : ''}
            onClick={() => setMode('login')}
            type="button"
          >
            Login
          </button>
          <button
            className={mode === 'signup' ? 'active' : ''}
            onClick={() => setMode('signup')}
            type="button"
          >
            Signup
          </button>
        </div>

        {/* The form element with sliding animation based on mode */}
        <form
          className={`auth-form ${mode === 'login' ? 'slide-in-left' : 'slide-in-right'}`}
          onSubmit={handleSubmit}
        >
          {/* Display error and success messages */}
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {/* Display username input only in signup mode */}
          {mode === 'signup' && (
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoading}
            />
          )}

          {/* Common input field for email */}
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />

          {/* Password input with show/hide toggle */}
          <div className="password-input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
            <span
              className="eye-icon"
              onClick={() => setShowPassword((prev) => !prev)} // Toggle password visibility
              tabIndex={0}
              role="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <i className={`fa${showPassword ? "s" : "r"} fa-eye${showPassword ? "-slash" : ""}`}></i>
            </span>
          </div>

          {/* Confirm password input only in signup mode */}
          {mode === 'signup' && (
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <span
                className="eye-icon"
                onClick={() => setShowConfirmPassword((prev) => !prev)} // Toggle confirm password visibility
                tabIndex={0}
                role="button"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                <i className={`fa${showConfirmPassword ? "s" : "r"} fa-eye${showConfirmPassword ? "-slash" : ""}`}></i>
              </span>
            </div>
          )}

          {/* Link to forgot password page in login mode */}
          {mode === 'login' && (
            <div className="forgot-link-row">
              <a href="/forgot-password" className="forgot-link">Forgot password?</a>
            </div>
          )}

          {/* Submit button with dynamic text based on loading state */}
          <button type="submit" disabled={isLoading}>
            {isLoading ? (mode === 'login' ? 'Logging in...' : 'Creating Account...') : (mode === 'login' ? 'Login' : 'Signup')}
          </button>
        </form>

        {/* Links to toggle between login and signup */}
        <div className="auth-links">
          {mode === 'login' ? (
            <span>Not a member? <button className="link-btn" onClick={() => setMode('signup')}>Signup now</button></span>
          ) : (
            <span>Already have an account? <button className="link-btn" onClick={() => setMode('login')}>Login</button></span>
          )}
        </div>
      </div>
    </div>
  );
}

export default Auth;
