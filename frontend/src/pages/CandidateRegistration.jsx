import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { candidatesAPI } from '../services/api';

const CandidateRegistration = () => {
  const [formData, setFormData] = useState({
    candidateName: '',
    party: '',
    manifesto: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAlreadyCandidate, setIsAlreadyCandidate] = useState(false);
  const [candidateInfo, setCandidateInfo] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    const checkCandidateStatus = async () => {
      try {
        const response = await candidatesAPI.checkStatus();
        if (response.data.isCandidate) {
          setIsAlreadyCandidate(true);
          setCandidateInfo(response.data.candidate);
        }
      } catch (error) {
        console.error('Error checking candidate status:', error);
      }
    };

    checkCandidateStatus();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await candidatesAPI.register(formData);
      setSuccess('Successfully registered as candidate! You can now participate in the election.');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to register as candidate');
    } finally {
      setLoading(false);
    }
  };

  if (isAlreadyCandidate) {
    return (
      <div className="container">
        <h1 className="page-title">Candidate Registration</h1>
        
        <div className="card">
          <div className="alert alert-success">
            <h3>✅ You are already registered as a candidate!</h3>
          </div>
          
          <div className="card-header">
            <h3 className="card-title">Your Candidate Information</h3>
          </div>
          
          <p><strong>Candidate Name:</strong> {candidateInfo?.candidateName}</p>
          <p><strong>Party:</strong> {candidateInfo?.party}</p>
          <p><strong>Current Votes:</strong> {candidateInfo?.voteCount}</p>
          <p><strong>Status:</strong> {candidateInfo?.isApproved ? 'Approved' : 'Pending Approval'}</p>
          
          <div style={{ marginTop: '20px' }}>
            <h4>Your Manifesto:</h4>
            <p style={{ 
              background: '#f8f9fa', 
              padding: '15px', 
              borderRadius: '6px',
              border: '1px solid #dee2e6'
            }}>
              {candidateInfo?.manifesto}
            </p>
          </div>
          
          <div style={{ marginTop: '20px' }}>
            <button 
              onClick={() => navigate('/dashboard')} 
              className="btn btn-primary"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="page-title">Register as Candidate</h1>
      
      <div className="card">
        <p style={{ textAlign: 'center', marginBottom: '30px', color: '#666' }}>
          Fill out the form below to register yourself as a candidate for the election.
        </p>
        
        <form onSubmit={handleSubmit} className="form-container">
          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}
          
          {success && (
            <div className="alert alert-success">
              {success}
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="candidateName" className="form-label">
              Candidate Name *
            </label>
            <input
              type="text"
              id="candidateName"
              name="candidateName"
              value={formData.candidateName}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter your full name as it should appear on ballot"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="party" className="form-label">
              Party/Organization *
            </label>
            <input
              type="text"
              id="party"
              name="party"
              value={formData.party}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter your party name or 'Independent'"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="manifesto" className="form-label">
              Election Manifesto *
            </label>
            <textarea
              id="manifesto"
              name="manifesto"
              value={formData.manifesto}
              onChange={handleChange}
              className="form-textarea"
              placeholder="Describe your vision, goals, and what you plan to achieve if elected..."
              rows="6"
              maxLength="1000"
              required
            />
            <small style={{ color: '#666', fontSize: '0.875rem' }}>
              {formData.manifesto.length}/1000 characters
            </small>
          </div>
          
          <button 
            type="submit" 
            className="btn btn-success btn-full"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register as Candidate'}
          </button>
          
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button 
              type="button"
              onClick={() => navigate('/dashboard')} 
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CandidateRegistration;
