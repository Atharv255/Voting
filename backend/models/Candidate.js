const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  candidateName: {
    type: String,
    required: true,
    trim: true
  },
  party: {
    type: String,
    required: true,
    trim: true
  },
  manifesto: {
    type: String,
    required: true,
    maxlength: 1000
  },
  voteCount: {
    type: Number,
    default: 0
  },
  isApproved: {
    type: Boolean,
    default: true // Auto-approve for now, can be changed to false for manual approval
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Candidate', candidateSchema);
