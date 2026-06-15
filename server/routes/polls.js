const express = require('express');
const Poll = require('../models/Poll');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();
const getUserId = (req) => req.user.userId || req.user.id;

// POST /api/polls — admin creates poll
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { question, description, options, deadline, isAnonymous } = req.body;
    if (!question || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ message: 'Question and at least 2 options are required.' });
    }
    const poll = await Poll.create({
      question,
      description: description || '',
      options: options.map((text) => ({ text, votes: [] })),
      createdBy: getUserId(req),
      deadline: new Date(deadline),
      isAnonymous: !!isAnonymous,
    });
    res.status(201).json(poll);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/polls — all authenticated users
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = getUserId(req);
    const polls = await Poll.find()
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    const result = polls.map((poll) => {
      const totalVotes = poll.options.reduce((s, o) => s + o.votes.length, 0);
      const userVotedOptionIndex = poll.options.findIndex((o) =>
        o.votes.some((v) => v.userId.toString() === userId.toString())
      );
      const hasVoted = userVotedOptionIndex !== -1;

      return {
        _id: poll._id,
        question: poll.question,
        description: poll.description,
        deadline: poll.deadline,
        isAnonymous: poll.isAnonymous,
        status: poll.status,
        createdBy: poll.createdBy,
        createdAt: poll.createdAt,
        hasVoted,
        userVotedOptionIndex: hasVoted ? userVotedOptionIndex : null,
        options: poll.options.map((o, i) => ({
          _id: o._id,
          text: o.text,
          voteCount: o.votes.length,
          percentage: totalVotes > 0 ? Math.round((o.votes.length / totalVotes) * 100) : 0,
          votedByMe: hasVoted && userVotedOptionIndex === i,
          voters: poll.isAnonymous ? [] : o.votes.map((v) => v.userId),
        })),
        totalVotes,
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/polls/:id/vote — resident votes
router.post('/:id/vote', authMiddleware, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { optionIndex } = req.body;
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ message: 'Poll not found.' });
    if (poll.status === 'Closed') return res.status(400).json({ message: 'This poll is closed.' });
    if (new Date() > new Date(poll.deadline)) {
      return res.status(400).json({ message: 'Voting deadline has passed.' });
    }
    if (optionIndex == null || optionIndex < 0 || optionIndex >= poll.options.length) {
      return res.status(400).json({ message: 'Invalid option.' });
    }
    const alreadyVoted = poll.options.some((o) =>
      o.votes.some((v) => v.userId.toString() === userId.toString())
    );
    if (alreadyVoted) return res.status(400).json({ message: 'Already voted.' });

    poll.options[optionIndex].votes.push({ userId });
    await poll.save();
    res.json({ message: 'Vote recorded.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/polls/:id/close — admin closes poll
router.put('/:id/close', authMiddleware, adminOnly, async (req, res) => {
  try {
    const poll = await Poll.findByIdAndUpdate(req.params.id, { status: 'Closed' }, { new: true });
    if (!poll) return res.status(404).json({ message: 'Poll not found.' });
    res.json(poll);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/polls/:id — admin deletes poll
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const poll = await Poll.findByIdAndDelete(req.params.id);
    if (!poll) return res.status(404).json({ message: 'Poll not found.' });
    res.json({ message: 'Poll deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
