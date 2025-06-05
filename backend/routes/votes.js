const express = require('express');
const Vote = require('../models/Vote');
const Candidate = require('../models/Candidate');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Cast a vote
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { candidateId } = req.body;

    // Check if user is admin
    if (req.user.isAdmin) {
      return res.status(403).json({ message: 'Admins cannot vote. You manage the election.' });
    }

    // Check if user has already voted (database check)
    const existingVote = await Vote.findOne({ voter: req.user._id });
    if (existingVote) {
      return res.status(400).json({ message: 'You have already voted. Each user can only vote once.' });
    }

    // Check if user has already voted (user model check)
    if (req.user.hasVoted) {
      return res.status(400).json({ message: 'You have already voted. Each user can only vote once.' });
    }

    // Check if candidate exists and is approved
    const candidate = await Candidate.findById(candidateId).populate('userId', 'fullName');
    if (!candidate || !candidate.isApproved) {
      return res.status(404).json({ message: 'Candidate not found or not approved' });
    }

    // Check if user is trying to vote for themselves (candidate cannot vote for themselves)
    if (candidate.userId._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Candidates cannot vote for themselves.' });
    }

    // Create vote record
    const vote = new Vote({
      voter: req.user._id,
      candidate: candidateId,
      voterName: req.user.fullName,
      candidateName: candidate.candidateName
    });

    // Start transaction to ensure data consistency
    const session = await Vote.startSession();
    session.startTransaction();

    try {
      // Save vote
      await vote.save({ session });

      // Update candidate vote count
      await Candidate.findByIdAndUpdate(
        candidateId,
        { $inc: { voteCount: 1 } },
        { session }
      );

      // Update user voting status
      await User.findByIdAndUpdate(
        req.user._id,
        { 
          hasVoted: true,
          votedFor: candidateId
        },
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      // Emit real-time update to all connected clients
      req.io.emit('voteUpdate', {
        type: 'NEW_VOTE',
        vote: {
          voterName: vote.voterName,
          candidateName: vote.candidateName,
          candidateParty: candidate.party,
          timestamp: vote.timestamp
        }
      });

      res.status(201).json({
        message: 'Vote cast successfully',
        vote: {
          candidateName: candidate.candidateName,
          party: candidate.party,
          timestamp: vote.timestamp
        }
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error('Voting error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already voted' });
    }
    res.status(500).json({ message: 'Server error during voting' });
  }
});

// Get vote results
router.get('/results', async (req, res) => {
  try {
    const candidates = await Candidate.find({ isApproved: true })
      .populate('userId', 'username fullName')
      .sort({ voteCount: -1 });

    const totalVotes = await Vote.countDocuments();

    const results = candidates.map(candidate => ({
      id: candidate._id,
      candidateName: candidate.candidateName,
      party: candidate.party,
      voteCount: candidate.voteCount,
      percentage: totalVotes > 0 ? ((candidate.voteCount / totalVotes) * 100).toFixed(2) : 0,
      username: candidate.userId.username,
      fullName: candidate.userId.fullName
    }));

    res.json({
      results,
      totalVotes,
      totalCandidates: candidates.length
    });
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({ message: 'Server error while fetching results' });
  }
});

// Get user's vote (if any)
router.get('/my-vote', authenticateToken, async (req, res) => {
  try {
    const vote = await Vote.findOne({ voter: req.user._id })
      .populate('candidate', 'candidateName party');

    if (!vote) {
      return res.json({ hasVoted: false, vote: null });
    }

    res.json({
      hasVoted: true,
      vote: {
        candidateName: vote.candidate.candidateName,
        party: vote.candidate.party,
        timestamp: vote.timestamp
      }
    });
  } catch (error) {
    console.error('Get my vote error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
