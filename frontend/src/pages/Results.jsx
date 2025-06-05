import React, { useState, useEffect } from 'react';
import { votesAPI, authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Results = () => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adminAuth, setAdminAuth] = useState(false);
  const [adminCredentials, setAdminCredentials] = useState({
    email: '',
    password: ''
  });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const { user, isAdmin } = useAuth();

  useEffect(() => {
    // Check if user is already logged in as admin
    if (isAdmin) {
      setAdminAuth(true);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (adminAuth) {
      const fetchResults = async () => {
        try {
          const response = await votesAPI.getResults();
          setResults(response.data);
        } catch (error) {
          setError('Failed to load results');
          console.error('Error fetching results:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchResults();
    }
  }, [adminAuth]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const response = await authAPI.login(adminCredentials);
      if (response.data.user.isAdmin) {
        setAdminAuth(true);
        setAuthError('');
      } else {
        setAuthError('Access denied. Admin privileges required.');
      }
    } catch (error) {
      setAuthError(error.response?.data?.message || 'Invalid credentials');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setAdminCredentials({
      ...adminCredentials,
      [e.target.name]: e.target.value
    });
  };

  // Show admin login form if not authenticated as admin
  if (!adminAuth) {
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
            marginBottom: '15px',
            textAlign: 'center'
          }}>🔒 Admin Access Required</h1>
          <p style={{ color: '#666', marginBottom: '30px' }}>
            Enter admin credentials to view election results
          </p>

          <form onSubmit={handleAdminLogin} style={{ width: '100%' }}>
            {authError && (
              <div className="alert alert-error">
                {authError}
              </div>
            )}

            <div style={{ textAlign: 'left', marginBottom: '20px' }}>
              <label htmlFor="email" style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#555',
                textAlign: 'left'
              }}>Admin Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={adminCredentials.email}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '14px',
                  border: '2px solid #e1e8ed',
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
                placeholder="admin@gmail.com"
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
                value={adminCredentials.password}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '14px',
                  border: '2px solid #e1e8ed',
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
                placeholder="admin@123"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={authLoading}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '16px',
                fontWeight: '600',
                marginTop: '10px'
              }}
            >
              {authLoading ? 'Authenticating...' : 'Access Results'}
            </button>
          </form>

          <div className="alert alert-info" style={{ marginTop: '20px' }}>
            <strong>Default Admin Credentials:</strong><br />
            Email: admin@gmail.com<br />
            Password: admin@123
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading election results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="alert alert-error">
          {error}
        </div>
      </div>
    );
  }

  const winner = results?.results?.[0];

  return (
    <div className="container">
      <h1 className="page-title">Election Results</h1>
      
      {/* Summary Card */}
      <div className="card" style={{ marginBottom: '30px' }}>
        <div className="card-header">
          <h3 className="card-title">📊 Election Summary</h3>
        </div>
        
        <div className="grid grid-3">
          <div style={{ textAlign: 'center' }}>
            <h4 style={{ color: '#3498db', fontSize: '2rem', margin: '0' }}>
              {results?.totalVotes || 0}
            </h4>
            <p style={{ margin: '5px 0', color: '#666' }}>Total Votes</p>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <h4 style={{ color: '#27ae60', fontSize: '2rem', margin: '0' }}>
              {results?.totalCandidates || 0}
            </h4>
            <p style={{ margin: '5px 0', color: '#666' }}>Candidates</p>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <h4 style={{ color: '#e74c3c', fontSize: '2rem', margin: '0' }}>
              {winner ? `${winner.percentage}%` : '0%'}
            </h4>
            <p style={{ margin: '5px 0', color: '#666' }}>Leading by</p>
          </div>
        </div>
        
        {winner && (
          <div className="alert alert-success" style={{ marginTop: '20px' }}>
            <strong>🏆 Current Leader: {winner.candidateName}</strong> from {winner.party} 
            with {winner.voteCount} votes ({winner.percentage}%)
          </div>
        )}
      </div>
      
      {/* Results Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">🗳️ Detailed Results</h3>
          <p className="card-subtitle">Results are updated in real-time</p>
        </div>
        
        {results?.results?.length === 0 ? (
          <div className="alert alert-info">
            <p>No votes have been cast yet.</p>
          </div>
        ) : (
          <div className="results-table">
            {results?.results?.map((candidate, index) => (
              <div 
                key={candidate.id} 
                className="result-row"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '15px',
                  marginBottom: '10px',
                  backgroundColor: index === 0 ? '#f8f9ff' : '#f9f9f9',
                  borderRadius: '6px',
                  border: index === 0 ? '2px solid #3498db' : '1px solid #eee'
                }}
              >
                <div style={{ 
                  minWidth: '40px', 
                  textAlign: 'center',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  color: index === 0 ? '#3498db' : '#666'
                }}>
                  {index + 1}
                  {index === 0 && ' 🏆'}
                </div>
                
                <div style={{ flex: 1, marginLeft: '15px' }}>
                  <h4 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>
                    {candidate.candidateName}
                  </h4>
                  <p style={{ margin: '0', color: '#7f8c8d', fontSize: '0.9rem' }}>
                    {candidate.party} • @{candidate.username}
                  </p>
                </div>
                
                <div style={{ textAlign: 'right', minWidth: '120px' }}>
                  <div style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: 'bold',
                    color: '#2c3e50'
                  }}>
                    {candidate.voteCount}
                  </div>
                  <div style={{ 
                    fontSize: '0.9rem', 
                    color: '#666'
                  }}>
                    {candidate.percentage}%
                  </div>
                </div>
                
                <div style={{ marginLeft: '15px', minWidth: '150px' }}>
                  <div 
                    style={{
                      width: '100%',
                      height: '8px',
                      backgroundColor: '#eee',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}
                  >
                    <div 
                      style={{
                        width: `${candidate.percentage}%`,
                        height: '100%',
                        backgroundColor: index === 0 ? '#3498db' : '#95a5a6',
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div style={{
          textAlign: 'center',
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#f8f9fa',
          borderRadius: '6px',
          fontSize: '0.875rem',
          color: '#666'
        }}>
          <p>✨ Results update in real-time instantly</p>
          <p>Last updated: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default Results;
