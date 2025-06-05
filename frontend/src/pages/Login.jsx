import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      zIndex: 1000,
      paddingTop: '60px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '40px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
        width: '100%',
        maxWidth: '450px',
        textAlign: 'center',
        margin: '20px'
      }}>
        <h1 style={{
          fontSize: '2.2rem',
          fontWeight: '700',
          color: '#2c3e50',
          marginBottom: '30px',
          textAlign: 'center'
        }}>🗳️ Login to Vote</h1>

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <div style={{ textAlign: 'left', marginBottom: '20px' }}>
            <label htmlFor="email" style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#555',
              textAlign: 'left'
            }}>Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '14px',
                border: '2px solid #e1e8ed',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              required
            />
          </div>

          <div style={{ textAlign: 'left', marginBottom: '20px' }}>
            <label htmlFor="password" style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#555',
              textAlign: 'left'
            }}>Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '14px',
                border: '2px solid #e1e8ed',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '16px',
              fontWeight: '600',
              marginTop: '10px'
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <p style={{
            textAlign: 'center',
            marginTop: '25px',
            color: '#666',
            fontSize: '14px'
          }}>
            Don't have an account? <Link to="/register" style={{
              color: '#3498db',
              textDecoration: 'none',
              fontWeight: '600'
            }}>Register here</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
