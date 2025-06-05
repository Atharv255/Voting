const express = require('express');
const Candidate = require('../models/Candidate');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Register as candidate
router.post('/register', authenticateToken, async (req, res) => {
  try {
    const { candidateName, party, manifesto } = req.body;

    // Check if user is admin
    if (req.user.isAdmin) {
      return res.status(403).json({ message: 'Admins cannot register as candidates. You manage the election.' });
    }

    // Check if user is already a candidate
    const existingCandidate = await Candidate.findOne({ userId: req.user._id });
    if (existingCandidate) {
      return res.status(400).json({
        message: 'You are already registered as a candidate'
      });
    }

    // Create new candidate
    const candidate = new Candidate({
      userId: req.user._id,
      candidateName,
      party,
      manifesto
    });

    await candidate.save();

    // Emit real-time update to all connected clients
    req.io.emit('candidateUpdate', {
      type: 'NEW_CANDIDATE',
      candidate: {
        id: candidate._id,
        candidateName: candidate.candidateName,
        party: candidate.party,
        manifesto: candidate.manifesto,
        voteCount: candidate.voteCount
      }
    });

    res.status(201).json({
      message: 'Successfully registered as candidate',
      candidate: {
        id: candidate._id,
        candidateName: candidate.candidateName,
        party: candidate.party,
        manifesto: candidate.manifesto,
        voteCount: candidate.voteCount
      }
    });
  } catch (error) {
    console.error('Candidate registration error:', error);
    res.status(500).json({ message: 'Server error during candidate registration' });
  }
});

// Get all approved candidates
router.get('/', async (req, res) => {
  try {
    const candidates = await Candidate.find({ isApproved: true })
      .populate('userId', 'username fullName')
      .sort({ voteCount: -1 });

    const candidateList = candidates.map(candidate => ({
      id: candidate._id,
      candidateName: candidate.candidateName,
      party: candidate.party,
      manifesto: candidate.manifesto,
      voteCount: candidate.voteCount,
      username: candidate.userId.username,
      fullName: candidate.userId.fullName
    }));

    res.json({ candidates: candidateList });
  } catch (error) {
    console.error('Get candidates error:', error);
    res.status(500).json({ message: 'Server error while fetching candidates' });
  }
});

// Get candidate by ID
router.get('/:id', async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id)
      .populate('userId', 'username fullName email');

    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    res.json({
      candidate: {
        id: candidate._id,
        candidateName: candidate.candidateName,
        party: candidate.party,
        manifesto: candidate.manifesto,
        voteCount: candidate.voteCount,
        username: candidate.userId.username,
        fullName: candidate.userId.fullName,
        isApproved: candidate.isApproved
      }
    });
  } catch (error) {
    console.error('Get candidate error:', error);
    res.status(500).json({ message: 'Server error while fetching candidate' });
  }
});

// Check if current user is a candidate
router.get('/check/status', authenticateToken, async (req, res) => {
  try {
    const candidate = await Candidate.findOne({ userId: req.user._id });
    
    res.json({
      isCandidate: !!candidate,
      candidate: candidate ? {
        id: candidate._id,
        candidateName: candidate.candidateName,
        party: candidate.party,
        manifesto: candidate.manifesto,
        voteCount: candidate.voteCount,
        isApproved: candidate.isApproved
      } : null
    });
  } catch (error) {
    console.error('Check candidate status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
