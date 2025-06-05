import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { candidatesAPI, votesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import socketService from '../services/socket';

const Vote = () => {
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState('');
  const [hasVoted, setHasVoted] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [candidatesResponse, voteResponse] = await Promise.all([
        candidatesAPI.getAll(),
        votesAPI.getMyVote()
      ]);

      setCandidates(candidatesResponse.data.candidates);
      setHasVoted(voteResponse.data.hasVoted);

      if (voteResponse.data.hasVoted) {
        // User has already voted, show their vote
      }
    } catch (error) {
      setError('Failed to load candidates');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Connect to socket for real-time updates
    socketService.connect();

    // Listen for real-time candidate updates
    socketService.onCandidateUpdate((data) => {
      console.log('Real-time candidate update:', data);
      // Refresh candidates immediately when new candidate registers
      fetchData();
    });

    // Cleanup on unmount
    return () => {
      socketService.removeCandidateListener();
    };
  }, []);

  const handleVote = async () => {
    if (!selectedCandidate) {
      setError('Please select a candidate');
      return;
    }

    // Double check if user has already voted
    if (hasVoted) {
      setError('You have already voted. Each user can only vote once.');
      return;
    }

    setVoting(true);
    setError('');

    try {
      await votesAPI.castVote(selectedCandidate);
      alert('Vote cast successfully! You cannot change your vote.');
      navigate('/dashboard');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to cast vote');
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading candidates...</p>
      </div>
    );
  }

  if (hasVoted) {
    return (
      <div className="container">
        <h1 className="page-title">Voting</h1>
        <div className="card">
          <div className="alert alert-success">
            <h3>✅ You have already voted!</h3>
            <p>Thank you for participating in the election. You can view the results to see how the election is progressing.</p>
          </div>
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button 
              onClick={() => navigate('/results')} 
              className="btn btn-primary"
              style={{ marginRight: '10px' }}
            >
              View Results
            </button>
            <button 
              onClick={() => navigate('/dashboard')} 
              className="btn btn-secondary"
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
      <h1 className="page-title">Cast Your Vote</h1>
      
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}
      
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Select a Candidate</h3>
          <p className="card-subtitle">Choose one candidate to vote for</p>
        </div>
        
        {candidates.length === 0 ? (
          <div className="alert alert-info">
            <p>No candidates are currently registered for this election.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-2" style={{ marginBottom: '30px', margin: '0 auto 30px auto' }}>
              {candidates.map((candidate) => (
                <div 
                  key={candidate.id} 
                  className={`card ${selectedCandidate === candidate.id ? 'selected-candidate' : ''}`}
                  style={{ 
                    cursor: 'pointer',
                    border: selectedCandidate === candidate.id ? '3px solid #3498db' : '1px solid #eee',
                    backgroundColor: selectedCandidate === candidate.id ? '#f8f9ff' : 'white'
                  }}
                  onClick={() => setSelectedCandidate(candidate.id)}
                >
                  <div className="card-header">
                    <h4 className="card-title">{candidate.candidateName}</h4>
                    <p className="card-subtitle">{candidate.party}</p>
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <strong>Manifesto:</strong>
                    <p style={{ 
                      marginTop: '5px', 
                      fontSize: '0.9rem', 
                      lineHeight: '1.4',
                      color: '#666'
                    }}>
                      {candidate.manifesto}
                    </p>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    fontSize: '0.875rem'
                  }}>
                    {selectedCandidate === candidate.id && (
                      <span style={{ color: '#3498db', fontWeight: 'bold' }}>
                        ✓ Selected
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <button 
                onClick={handleVote}
                className="btn btn-success"
                disabled={!selectedCandidate || voting}
                style={{ marginRight: '10px' }}
              >
                {voting ? 'Casting Vote...' : 'Cast Vote'}
              </button>
              
              <button 
                onClick={() => navigate('/dashboard')} 
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
            
            {selectedCandidate && (
              <div className="alert alert-info" style={{ marginTop: '20px' }}>
                <strong>⚠️ Important:</strong>
                <br />• You can only vote ONCE - no changes allowed after voting
                <br />• Candidates cannot vote for themselves
                <br />• Please make sure you have selected the right candidate
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Vote;
