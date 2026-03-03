const express = require('express');
const router = express.Router();
const User = require('../models/User');
const generateTradeID = require('../utils/idGenerator');

const calculateReputation = (user) => {
  if (user.totalTransactions === 0) return 50;
  const rate = (user.totalTransactions - user.disputeCount) / user.totalTransactions;
  const vol = Math.min(user.totalTradeVolume / 5000, 1.0);
  const rep = user.repaymentScore / 100;
  return Math.max(0, Math.min(100, Math.round((40 * rate) + (30 * vol) + (30 * rep))));
};

const checkEligibility = (user) => user.reputationScore >= 70 && user.totalTradeVolume >= 1000 && user.disputeCount < 5;

const isTodayBirthday = (date) => {
  if (!date) return false;
  const d = new Date(date);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
};

router.post('/register', async (req, res) => {
  try {
    const { walletAddress, phoneNumber, ownerName, ownerBirthday, whatsappNumber, password, businessName, businessType, country, region, city, town } = req.body;
    
    if ((!walletAddress && !phoneNumber) || !ownerName || !ownerBirthday || !whatsappNumber || !password || !businessName || !country || !region || !city || !town) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const exists = await User.findOne({ $or: [{ walletAddress }, { phoneNumber }] });
    if (exists) return res.status(400).json({ message: 'Wallet or Phone already registered.' });

    let tradeId = generateTradeID();
    while (await User.findOne({ tradeId })) tradeId = generateTradeID();

    const user = new User({
      walletAddress: walletAddress || undefined,
      phoneNumber: phoneNumber || undefined,
      ownerName, ownerBirthday: new Date(ownerBirthday), whatsappNumber, password,
      businessName, businessType: businessType || 'SME',
      country, region, city, town, tradeId
    });

    await user.save();
    res.status(201).json({ success: true, user: { ...user.toObject(), isBirthday: isTodayBirthday(user.ownerBirthday) } });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const user = await User.findOne({ $or: [{ walletAddress: identifier }, { phoneNumber: identifier }, { tradeId: identifier }] });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.password !== password) return res.status(401).json({ message: 'Wrong password' });
    
    res.json({ ...user.toObject(), isEligible: checkEligibility(user), isBirthday: isTodayBirthday(user.ownerBirthday) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/user/:id', async (req, res) => {
  try {
    const user = await User.findOne({ $or: [{ walletAddress: req.params.id }, { phoneNumber: req.params.id }, { tradeId: req.params.id }] });
    if (!user) return res.status(404).json({ message: 'Not found' });
    res.json({ ...user.toObject(), isEligible: checkEligibility(user), isBirthday: isTodayBirthday(user.ownerBirthday) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const user = await User.findOne({ $or: [{ walletAddress: req.body.identifier }, { phoneNumber: req.body.identifier }, { tradeId: req.body.identifier }] });
    if (!user) return res.status(404).json({ message: 'Not found' });
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetCode = code;
    user.resetCodeExpires = Date.now() + 3600000;
    await user.save();
    console.log("RESET CODE:", code);
    res.json({ success: true, debugCode: code });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/reset-password', async (req, res) => {
  try {
    const user = await User.findOne({ $or: [{ walletAddress: req.body.identifier }, { phoneNumber: req.body.identifier }, { tradeId: req.body.identifier }] });
    if (!user || user.resetCode !== req.body.code || user.resetCodeExpires < Date.now()) 
      return res.status(400).json({ message: 'Invalid code' });
    user.password = req.body.newPassword;
    user.resetCode = null;
    user.resetCodeExpires = null;
    await user.save();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

const findUser = (id) => User.findOne({ $or: [{ walletAddress: id }, { phoneNumber: id }, { tradeId: id }] });

router.post('/simulate-transaction', async (req, res) => {
  try {
    const user = await findUser(req.body.walletAddress || req.body.phoneNumber || req.body.tradeId);
    if (!user) return res.status(404).json({ message: 'Not found' });
    user.totalTransactions++;
    user.totalTradeVolume += (req.body.amount || 100);
    user.reputationScore = calculateReputation(user);
    await user.save();
    res.json({ success: true, user });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/simulate-dispute', async (req, res) => {
  try {
    const user = await findUser(req.body.walletAddress || req.body.phoneNumber || req.body.tradeId);
    if (!user) return res.status(404).json({ message: 'Not found' });
    user.disputeCount++;
    user.reputationScore = calculateReputation(user);
    await user.save();
    res.json({ success: true, user });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/simulate-funding', async (req, res) => {
  try {
    const user = await findUser(req.body.walletAddress || req.body.phoneNumber || req.body.tradeId);
    if (!user) return res.status(404).json({ message: 'Not found' });
    user.fundingReceived += (req.body.amount || 500);
    await user.save();
    res.json({ success: true, user });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/simulate-repayment', async (req, res) => {
  try {
    const user = await findUser(req.body.walletAddress || req.body.phoneNumber || req.body.tradeId);
    if (!user) return res.status(404).json({ message: 'Not found' });
    const val = parseInt(req.body.scoreImpact) || 0;
    user.repaymentScore = Math.max(0, Math.min(100, user.repaymentScore + val));
    user.reputationScore = calculateReputation(user);
    await user.save();
    res.json({ success: true, user });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/admin/all-users', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users.map(u => ({ ...u.toObject(), isBirthday: isTodayBirthday(u.ownerBirthday) })));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/admin/delete-user/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
