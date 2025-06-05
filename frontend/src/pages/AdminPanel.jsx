import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import socketService from '../services/socket';

const AdminPanel = () => {
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchVotes();

    // Connect to socket for real-time updates
    socketService.connect();

    // Listen for real-time vote updates
    socketService.onVoteUpdate((data) => {
      console.log('Real-time vote update:', data);
      // Refresh votes immediately when new vote comes in
      fetchVotes();
    });

    // Cleanup on unmount
    return () => {
      socketService.removeVoteListener();
    };
  }, []);

  const fetchVotes = async () => {
    setLoading(true);
    setError('');

    try {
      const votesResponse = await adminAPI.getVotes(1, 100);
      setVotes(votesResponse.data.votes);
    } catch (error) {
      setError('Failed to load voting data');
      console.error('Error fetching votes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Simple vote counting
  const voteCount = {};
  votes.forEach(vote => {
    if (voteCount[vote.candidateName]) {
      voteCount[vote.candidateName]++;
    } else {
      voteCount[vote.candidateName] = 1;
    }
  });

  // Sort candidates by vote count
  const sortedCandidates = Object.entries(voteCount)
    .sort(([,a], [,b]) => b - a)
    .map(([name, count]) => ({ name, count }));



  return (
    <div className="container">
      <h1 className="page-title">👑 Simple Admin Dashboard</h1>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      ) : (
        <div>
          {votes.length === 0 ? (
            <div className="alert alert-info">
              <h3>📊 No Votes Yet</h3>
              <p>Results will show here when people start voting.</p>
            </div>
          ) : (
            <div>
              {/* Simple Vote Count */}
              <div className="card" style={{ marginBottom: '30px' }}>
                <h3>📊 Vote Results</h3>
                <p><strong>Total Votes: {votes.length}</strong></p>

                {sortedCandidates.length > 0 && (
                  <div style={{ marginTop: '20px' }}>
                    {sortedCandidates.map((candidate, index) => (
                      <div key={candidate.name} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '10px',
                        margin: '5px 0',
                        backgroundColor: index === 0 ? '#e8f5e8' : '#f9f9f9',
                        borderRadius: '5px',
                        border: index === 0 ? '2px solid #27ae60' : '1px solid #ddd'
                      }}>
                        <span>
                          {index === 0 && '🏆 '}
                          <strong>{candidate.name}</strong>
                        </span>
                        <span><strong>{candidate.count} votes</strong></span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Simple Voter List */}
              <div className="card">
                <h3>👥 Who Voted for Whom</h3>
                <div style={{ overflowX: 'auto', marginTop: '15px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa' }}>
                        <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>
                          Voter Name
                        </th>
                        <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>
                          Voted For
                        </th>
                        <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>
                          When
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {votes.map((vote, index) => (
                        <tr key={index}>
                          <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                            {vote.voterName}
                          </td>
                          <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                            {vote.candidateName}
                          </td>
                          <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                            {new Date(vote.timestamp).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
