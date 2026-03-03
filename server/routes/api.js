const express = require('express');
const router = express.Router();
const User = require('../models/User');
const generateTradeID = require('../utils/idGenerator');
const crypto = require('crypto'); // For generating reset codes

// Helper: Recalculate Reputation
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

// Check if today is birthday
const isTodayBirthday = (birthdate) => {
  const today = new Date();
  const birth = new Date(birthdate);
  return today.getMonth() === birth.getMonth() && today.getDate() === birth.getDate();
};

// POST /register
router.post('/register', async (req, res) => {
  try {
    const { walletAddress, phoneNumber, ownerName, ownerBirthday, whatsappNumber, password, businessName, businessType, country, region, city, town } = req.body;

    if ((!walletAddress && !phoneNumber) || !ownerName || !ownerBirthday || !whatsappNumber || !password || !businessName || !country || !region || !city || !town) {
      return res.status(400).json({ message: 'Missing required fields. All fields including Owner Details and Password are mandatory.' });
    }

    let query = {};
    if (walletAddress) query.walletAddress = walletAddress;
    if (phoneNumber) query.phoneNumber = phoneNumber;

    const existingUser = await User.findOne(query);
    if (existingUser) {
      return res.status(400).json({ message: 'This Wallet or Phone Number is already registered' });
    }

    let newId = generateTradeID();
    let isUnique = false;
    while (!isUnique) {
      const exists = await User.findOne({ tradeId: newId });
      if (!exists) isUnique = true;
      else newId = generateTradeID();
    }

    const newUser = new User({
      walletAddress: walletAddress || undefined,
      phoneNumber: phoneNumber || undefined,
      ownerName,
      ownerBirthday: new Date(ownerBirthday),
      whatsappNumber,
      password, // In production, use bcrypt.hash(password, 10)
      businessName,
      businessType: businessType || 'SME',
      country,
      region,
      city,
      town,
      tradeId: newId
    });

    await newUser.save();
    res.status(201).json({ success: true, user: newUser });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
});

// POST /login (New Route for Password Auth)
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be wallet, phone, or tradeID
    
    let user = await User.findOne({ walletAddress: identifier });
    if (!user) user = await User.findOne({ phoneNumber: identifier });
    if (!user) user = await User.findOne({ tradeId: identifier });

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Simple password check (In prod, use bcrypt.compare)
    if (user.password !== password) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    const isEligible = checkEligibility(user);
    const isBirthday = isTodayBirthday(user.ownerBirthday);
    
    res.json({ ...user.toObject(), isEligible, isBirthday });
  } catch (error) {
    res.status(500).json({ message: 'Server error logging in' });
  }
});

// GET /user/:identifier (Keep for compatibility, but adds birthday check)
router.get('/user/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    let user = await User.findOne({ walletAddress: identifier });
    if (!user) user = await User.findOne({ phoneNumber: identifier });
    if (!user) user = await User.findOne({ tradeId: identifier });

    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const isEligible = checkEligibility(user);
    const isBirthday = isTodayBirthday(user.ownerBirthday);
    res.json({ ...user.toObject(), isEligible, isBirthday });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching user' });
  }
});

// POST /forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { identifier } = req.body;
    let user = await User.findOne({ $or: [{ walletAddress: identifier }, { phoneNumber: identifier }, { tradeId: identifier }] });
    
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetCode = code;
    user.resetCodeExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // In real app, send SMS/Email here. For MVP, return code in response (or log it)
    console.log(`PASSWORD RESET CODE for ${user.ownerName}: ${code}`);
    
    res.json({ 
      success: true, 
      message: 'Reset code generated. Check console/logs for MVP code.', 
      debugCode: code // Remove in production!
    });
  } catch (error) {
    res.status(500).json({ message: 'Error generating reset code' });
  }
});

// POST /reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { identifier, code, newPassword } = req.body;
    let user = await User.findOne({ $or: [{ walletAddress: identifier }, { phoneNumber: identifier }, { tradeId: identifier }] });

    if (!user || user.resetCode !== code || user.resetCodeExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired reset code' });
    }

    user.password = newPassword;
    user.resetCode = null;
    user.resetCodeExpires = null;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting password' });
  }
});

// Helper for simulations
const findUserByIdentifier = async (identifier) => {
  let user = await User.findOne({ walletAddress: identifier });
  if (!user) user = await User.findOne({ phoneNumber: identifier });
  if (!user) user = await User.findOne({ tradeId: identifier });
  return user;
};

// ... (Simulation routes remain same, just ensure they use findUserByIdentifier) ...
router.post('/simulate-transaction', async (req, res) => {
  try {
    const { walletAddress, phoneNumber, tradeId, amount } = req.body;
    const identifier = walletAddress || phoneNumber || tradeId;
    const user = await findUserByIdentifier(identifier);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.totalTransactions += 1;
    user.totalTradeVolume += (amount || 100);
    user.reputationScore = calculateReputation(user);
    await user.save();
    res.json({ success: true, user });
  } catch (error) { res.status(500).json({ message: 'Error updating transaction' }); }
});

router.post('/simulate-dispute', async (req, res) => {
  try {
    const { walletAddress, phoneNumber, tradeId } = req.body;
    const user = await findUserByIdentifier(walletAddress || phoneNumber || tradeId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.disputeCount += 1;
    user.reputationScore = calculateReputation(user);
    await user.save();
    res.json({ success: true, user });
  } catch (error) { res.status(500).json({ message: 'Error adding dispute' }); }
});

router.post('/simulate-funding', async (req, res) => {
  try {
    const { walletAddress, phoneNumber, tradeId, amount } = req.body;
    const user = await findUserByIdentifier(walletAddress || phoneNumber || tradeId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.fundingReceived += (amount || 500);
    await user.save();
    res.json({ success: true, user });
  } catch (error) { res.status(500).json({ message: 'Error updating funding' }); }
});

router.post('/simulate-repayment', async (req, res) => {
  try {
    const { walletAddress, phoneNumber, tradeId, scoreImpact } = req.body; 
    const user = await findUserByIdentifier(walletAddress || phoneNumber || tradeId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const impact = parseInt(scoreImpact) || 0;
    user.repaymentScore = Math.max(0, Math.min(100, user.repaymentScore + impact));
    user.reputationScore = calculateReputation(user);
    await user.save();
    res.json({ success: true, user });
  } catch (error) { res.status(500).json({ message: 'Error updating repayment' }); }
});

// Admin Routes
router.get('/admin/all-users', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    // Add birthday flag to each user
    const usersWithBirthday = users.map(u => ({
      ...u.toObject(),
      isBirthday: isTodayBirthday(u.ownerBirthday)
    }));
    res.json(usersWithBirthday);
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
