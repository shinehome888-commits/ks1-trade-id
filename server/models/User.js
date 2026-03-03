const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  // Identifiers (One or the other is used)
  walletAddress: { type: String, trim: true, unique: true, sparse: true }, 
  phoneNumber: { type: String, trim: true, unique: true, sparse: true },
  
  // --- NEW REQUIRED FIELDS ---
  ownerName: { type: String, required: true, trim: true },
  ownerBirthday: { type: Date, required: true }, 
  whatsappNumber: { type: String, required: true, trim: true },
  password: { type: String, required: true }, 
  
  // Business Info
  businessName: { type: String, required: true, trim: true },
  businessType: { 
    type: String, 
    required: true, 
    enum: ['SME', 'Entrepreneur', 'Trader', 'Vendor', 'Enterprise', 'Corporation', 'Startup', 'Freelancer', 'Cooperative', 'NGO', 'Individual'] 
  },
  
  // Location
  country: { type: String, required: true, trim: true },
  region: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  town: { type: String, required: true, trim: true },
  
  // System
  tradeId: { type: String, required: true, unique: true, uppercase: true }, 
  resetCode: { type: String, default: null },
  resetCodeExpires: { type: Date, default: null },
  
  // Metrics
  reputationScore: { type: Number, default: 50, min: 0, max: 100 },
  totalTradeVolume: { type: Number, default: 0 },
  totalTransactions: { type: Number, default: 0 },
  disputeCount: { type: Number, default: 0 },
  fundingReceived: { type: Number, default: 0 },
  repaymentScore: { type: Number, default: 100, min: 0, max: 100 },
  
  createdAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
