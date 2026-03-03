const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  walletAddress: { type: String, trim: true, unique: true, sparse: true }, 
  phoneNumber: { type: String, trim: true, unique: true, sparse: true },
  
  // New Owner Details
  ownerName: { type: String, required: true, trim: true },
  ownerBirthday: { type: Date, required: true }, // Stores full date
  whatsappNumber: { type: String, required: true, trim: true },
  
  // Security
  password: { type: String, required: true }, // In real prod, hash this!
  resetCode: { type: String, default: null },
  resetCodeExpires: { type: Date, default: null },
  
  // Business Details
  businessName: { type: String, required: true, trim: true },
  businessType: { 
    type: String, 
    required: true, 
    enum: ['SME', 'Entrepreneur', 'Trader', 'Vendor', 'Enterprise', 'Corporation', 'Startup', 'Freelancer', 'Cooperative', 'NGO', 'Individual'] 
  },
  
  // Location Details
  country: { type: String, required: true, trim: true },
  region: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  town: { type: String, required: true, trim: true },
  
  tradeId: { type: String, required: true, unique: true, uppercase: true }, 
  
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

UserSchema.pre('save', function(next) {
  this.lastActive = new Date();
  next();
});

module.exports = mongoose.model('User', UserSchema);
