const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  walletAddress: { type: String, required: true, unique: true, trim: true },
  businessName: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true },
  businessType: { type: String, required: true, enum: ['SME', 'Entrepreneur', 'Trader', 'Vendor', 'Enterprise', 'Corporation', 'Startup', 'Freelancer', 'Cooperative', 'NGO', 'Individual'] },
  tradeId: { type: String, required: true, unique: true, uppercase: true }, 
  reputationScore: { type: Number, default: 50, min: 0, max: 100 },
  totalTradeVolume: { type: Number, default: 0 },
  totalTransactions: { type: Number, default: 0 },
  disputeCount: { type: Number, default: 0 },
  fundingReceived: { type: Number, default: 0 },
  repaymentScore: { type: Number, default: 100, min: 0, max: 100 },
  createdAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now }
});

UserSchema.pre('save', function(next) {
  this.lastActive = new Date();
  next();
});

module.exports = mongoose.model('User', UserSchema);
