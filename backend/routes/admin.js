const express = require('express');
const Vote = require('../models/Vote');
const Candidate = require('../models/Candidate');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get detailed voting statistics (Admin only)
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCandidates = await Candidate.countDocuments({ isApproved: true });
    const totalVotes = await Vote.countDocuments();
    const voterTurnout = totalUsers > 0 ? ((totalVotes / totalUsers) * 100).toFixed(2) : 0;

    // Get top candidates
    const topCandidates = await Candidate.find({ isApproved: true })
      .populate('userId', 'username fullName')
      .sort({ voteCount: -1 })
      .limit(5);

    res.json({
      overview: {
        totalUsers,
        totalCandidates,
        totalVotes,
        voterTurnout: `${voterTurnout}%`
      },
      topCandidates: topCandidates.map(candidate => ({
        id: candidate._id,
        candidateName: candidate.candidateName,
        party: candidate.party,
        voteCount: candidate.voteCount,
        percentage: totalVotes > 0 ? ((candidate.voteCount / totalVotes) * 100).toFixed(2) : 0
      }))
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Server error while fetching statistics' });
  }
});

// Get detailed vote records with voter information (Admin only)
router.get('/votes', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const votes = await Vote.find()
      .populate('voter', 'username fullName email')
      .populate('candidate', 'candidateName party')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const totalVotes = await Vote.countDocuments();
    const totalPages = Math.ceil(totalVotes / limit);

    const voteRecords = votes.map(vote => ({
      id: vote._id,
      voterName: vote.voter.fullName,
      voterUsername: vote.voter.username,
      voterEmail: vote.voter.email,
      candidateName: vote.candidate.candidateName,
      candidateParty: vote.candidate.party,
      timestamp: vote.timestamp
    }));

    res.json({
      votes: voteRecords,
      pagination: {
        currentPage: page,
        totalPages,
        totalVotes,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Admin votes error:', error);
    res.status(500).json({ message: 'Server error while fetching vote records' });
  }
});

// Get all users (Admin only)
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .populate('votedFor', 'candidateName party')
      .sort({ createdAt: -1 });

    const userList = users.map(user => ({
      id: user._id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      isAdmin: user.isAdmin,
      hasVoted: user.hasVoted,
      votedFor: user.votedFor ? {
        candidateName: user.votedFor.candidateName,
        party: user.votedFor.party
      } : null,
      createdAt: user.createdAt
    }));

    res.json({ users: userList });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
});

// Get all candidates (Admin only)
router.get('/candidates', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const candidates = await Candidate.find()
      .populate('userId', 'username fullName email')
      .sort({ voteCount: -1 });

    const candidateList = candidates.map(candidate => ({
      id: candidate._id,
      candidateName: candidate.candidateName,
      party: candidate.party,
      manifesto: candidate.manifesto,
      voteCount: candidate.voteCount,
      isApproved: candidate.isApproved,
      userInfo: {
        username: candidate.userId.username,
        fullName: candidate.userId.fullName,
        email: candidate.userId.email
      },
      createdAt: candidate.createdAt
    }));

    res.json({ candidates: candidateList });
  } catch (error) {
    console.error('Admin candidates error:', error);
    res.status(500).json({ message: 'Server error while fetching candidates' });
  }
});

// Create admin user (for initial setup)
router.post('/create-admin', async (req, res) => {
  try {
    const { username, email, password, fullName, adminKey } = req.body;

    // Simple admin key check (in production, use environment variable)
    if (adminKey !== 'admin123') {
      return res.status(403).json({ message: 'Invalid admin key' });
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({ isAdmin: true });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin user already exists' });
    }

    const adminUser = new User({
      username,
      email,
      password,
      fullName,
      isAdmin: true
    });

    await adminUser.save();

    res.status(201).json({
      message: 'Admin user created successfully',
      admin: {
        id: adminUser._id,
        username: adminUser.username,
        email: adminUser.email,
        fullName: adminUser.fullName,
        isAdmin: adminUser.isAdmin
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ message: 'Server error during admin creation' });
  }
});

module.exports = router;
