import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { candidatesAPI, votesAPI } from '../services/api';
import socketService from '../services/socket';

const Dashboard = () => {
  const { user } = useAuth();
  const [candidateStatus, setCandidateStatus] = useState(null);
  const [myVote, setMyVote] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [candidateResponse, voteResponse] = await Promise.all([
        candidatesAPI.checkStatus(),
        votesAPI.getMyVote()
      ]);

      setCandidateStatus(candidateResponse.data);
      setMyVote(voteResponse.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Connect to socket for real-time updates
    socketService.connect();

    // Listen for real-time updates
    socketService.onVoteUpdate((data) => {
      console.log('Real-time vote update on dashboard:', data);
      // Refresh dashboard data immediately
      fetchDashboardData();
    });

    socketService.onCandidateUpdate((data) => {
      console.log('Real-time candidate update on dashboard:', data);
      // Refresh dashboard data immediately
      fetchDashboardData();
    });

    // Cleanup on unmount
    return () => {
      socketService.removeVoteListener();
      socketService.removeCandidateListener();
    };
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  // Admin Dashboard - Simple and focused
  if (user?.isAdmin) {
    return (
      <div className="dashboard-container">
        <h1 className="page-title">👑 Admin Dashboard</h1>

        <div className="dashboard-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="card-header">
            <h3 className="card-title">🎯 Admin Controls</h3>
          </div>

          <div className="alert alert-info" style={{ marginBottom: '20px' }}>
            <strong>📋 Admin Role:</strong> You manage the election. You cannot vote or register as a candidate.
          </div>

          <div className="action-buttons">
            <Link to="/admin" className="btn btn-danger" style={{ fontSize: '18px', padding: '15px 30px' }}>
              👑 View Voting Results
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Regular User Dashboard
  return (
    <div className="dashboard-container">
      <h1 className="page-title">Welcome, {user?.fullName}!</h1>

      <div className="dashboard-grid">
        {/* Voting Status Card */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">🗳️ Voting Status</h3>
          </div>
          {myVote?.hasVoted ? (
            <div>
              <div className="alert alert-success">
                <strong>✅ You have voted!</strong>
              </div>
              <p><strong>Voted for:</strong> {myVote.vote.candidateName}</p>
              <p><strong>Party:</strong> {myVote.vote.party}</p>
              <p><strong>Time:</strong> {new Date(myVote.vote.timestamp).toLocaleString()}</p>
            </div>
          ) : (
            <div>
              <div className="alert alert-info">
                <strong>📋 You haven't voted yet</strong>
              </div>
              <Link to="/vote" className="btn btn-primary">
                Cast Your Vote
              </Link>
            </div>
          )}
        </div>

        {/* Candidate Status Card */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">🏛️ Candidate Status</h3>
          </div>
          {candidateStatus?.isCandidate ? (
            <div>
              <div className="alert alert-success">
                <strong>✅ You are registered as a candidate!</strong>
              </div>
              <p><strong>Name:</strong> {candidateStatus.candidate.candidateName}</p>
              <p><strong>Party:</strong> {candidateStatus.candidate.party}</p>
              <p><strong>Status:</strong> {candidateStatus.candidate.isApproved ? 'Approved' : 'Pending Approval'}</p>
            </div>
          ) : (
            <div>
              <div className="alert alert-info">
                <strong>📝 Not registered as candidate</strong>
              </div>
              <p>Want to run for election?</p>
              <Link to="/candidate-registration" className="btn btn-success">
                Register as Candidate
              </Link>
            </div>
          )}
        </div>


      </div>
    </div>
  );
};

export default Dashboard;
