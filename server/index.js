const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const apiRoutes = require('./routes/api');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

app.set('trust proxy', true);

app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected: KS1 Trade ID DB'))
    .catch(err => console.error('❌ DB Connection Error:', err.message));
} else {
  console.warn('⚠️ WARNING: MONGO_URI not set.');
}

app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'KS1 Trade ID API' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 KS1 Trade ID Server running on port ${PORT}`);
});
