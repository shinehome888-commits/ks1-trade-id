const express = require('express');
const router = express.Router();
const User = require('../models/User');
const generateTradeID = require('../utils/idGenerator');

const calculateReputation = (user) => {
  if (user.totalTransactions === 0) return 50;
  const completionRate = (user.totalTransactions - user.disputeCount) / user.totalTransactions;
  const volumeFactor = Math.min(user.totalTradeVolume / 5000, 1.0);
  const repaymentFactor = user.repaymentScore / 100;
  const score = (40 * completionRate) + (30 * volumeFactor) + (30 * repaymentFactor);
  return Math.max(0, Math.min(100, Math.round(score)));
};

const checkEligibility = (user) => {
  return (
    user.reputationScore >= 70 &&
    user.totalTradeVolume >= 1000 &&
    user.disputeCount < 5
  );
};

router.post('/register', async (req, res) => {
  try {
    const { walletAddress, businessName, country, businessType } = req.body;
    if (!walletAddress || !businessName || !country) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const existingUser = await User.findOne({ walletAddress });
    if (existingUser) {
      return res.status(400).json({ message: 'Wallet already registered' });
    }

    let newId = generateTradeID();
    let isUnique = false;
    while (!isUnique) {
      const exists = await User.findOne({ tradeId: newId });
      if (!exists) isUnique = true;
      else newId = generateTradeID();
    }

    const newUser = new User({
      walletAddress,
      businessName,
      country,
      businessType: businessType || 'SME',
      tradeId: newId
    });

    await newUser.save();
    res.status(201).json({ success: true, user: newUser });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
});

router.get('/user/:wallet', async (req, res) => {
  try {
    const user = await User.findOne({ walletAddress: req.params.wallet });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const isEligible = checkEligibility(user);
    res.json({ ...user.toObject(), isEligible });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching user' });
  }
});

router.post('/simulate-transaction', async (req, res) => {
  try {
    const { walletAddress, amount } = req.body;
    const user = await User.findOne({ walletAddress });
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.totalTransactions += 1;
    user.totalTradeVolume += (amount || 100);
    user.reputationScore = calculateReputation(user);
    await user.save();
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating transaction' });
  }
});

router.post('/simulate-dispute', async (req, res) => {
  try {
    const { walletAddress } = req.body;
    const user = await User.findOne({ walletAddress });
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.disputeCount += 1;
    user.reputationScore = calculateReputation(user);
    await user.save();
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: 'Error adding dispute' });
  }
});

router.post('/simulate-funding', async (req, res) => {
  try {
    const { walletAddress, amount } = req.body;
    const user = await User.findOne({ walletAddress });
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.fundingReceived += (amount || 500);
    await user.save();
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating funding' });
  }
});

router.post('/simulate-repayment', async (req, res) => {
  try {
    const { walletAddress, scoreImpact } = req.body; 
    const user = await User.findOne({ walletAddress });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const impact = parseInt(scoreImpact) || 0;
    user.repaymentScore = Math.max(0, Math.min(100, user.repaymentScore + impact));
    user.reputationScore = calculateReputation(user);
    await user.save();
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating repayment' });
  }
});

// Admin Routes
router.get('/admin/all-users', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Admin fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

router.delete('/admin/delete-user/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Admin delete error:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

module.exports = router;
