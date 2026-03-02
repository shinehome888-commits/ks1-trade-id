import React, { useState } from 'react';
import axios from 'axios';
import './App.css'; // Ensure CSS is imported here if needed, or in main

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function App() {
  const [view, setView] = useState('register'); 
  const [wallet, setWallet] = useState('');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ businessName: '', country: '', businessType: 'SME' });

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await axios.post(`${API_URL}/register`, { walletAddress: wallet, ...formData });
      setUserData(res.data.user); setView('dashboard');
    } catch (err) { setError(err.response?.data?.message || 'Failed'); } 
    finally { setLoading(false); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await axios.get(`${API_URL}/user/${wallet}`);
      setUserData(res.data); setView('dashboard');
    } catch (err) { setError('Wallet not found.'); } 
    finally { setLoading(false); }
  };

  const simulateAction = async (endpoint, payload) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/${endpoint}`, { walletAddress: wallet, ...payload });
      setUserData(res.data.user);
    } catch (err) { alert('Failed'); } 
    finally { setLoading(false); }
  };

  if (view === 'register' && !userData) {
    return (
      <div className="container" style={{ maxWidth: '500px', marginTop: '50px' }}>
        <div className="card">
          <h2 style={{ color: 'var(--gold-primary)', textAlign: 'center' }}>KS1 Trade ID</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Identity & Reputation Backbone</p>
          <div style={{ marginTop: '20px' }}>
            <form onSubmit={handleLogin}>
              <input type="text" placeholder="Wallet Address" value={wallet} onChange={(e) => setWallet(e.target.value)} required />
              <button type="submit" className="btn-gold" style={{ width: '100%' }} disabled={loading}>{loading ? 'Loading...' : 'Access Dashboard'}</button>
            </form>
            <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '20px 0' }} />
            <form onSubmit={handleRegister}>
              <input type="text" placeholder="Wallet Address" value={wallet} onChange={(e) => setWallet(e.target.value)} required />
              <input type="text" placeholder="Business Name" onChange={(e) => setFormData({...formData, businessName: e.target.value})} required />
              <input type="text" placeholder="Country" onChange={(e) => setFormData({...formData, country: e.target.value})} required />
              <select onChange={(e) => setFormData({...formData, businessType: e.target.value})}>
                <option value="SME">SME</option><option value="Enterprise">Enterprise</option><option value="Individual">Individual</option>
              </select>
              {error && <div className="error-msg">{error}</div>}
              <button type="submit" className="btn-gold" style={{ width: '100%' }} disabled={loading}>{loading ? 'Generating...' : 'Register'}</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ color: 'var(--gold-primary)' }}>KS1 Trade ID</h1>
        <button onClick={() => { setUserData(null); setView('register'); }} className="btn-gold">Logout</button>
      </header>
      <div className="card">
        <p>Your Unique Trade ID</p>
        <div className="trade-id-display">{userData?.tradeId}</div>
        <p>Wallet: {userData?.walletAddress}</p>
        <span className={`badge ${userData?.isEligible ? 'badge-eligible' : 'badge-not-eligible'}`}>
          {userData?.isEligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}
        </span>
      </div>
      <div className="metrics-grid">
        <div className="metric-box"><span className="metric-value">{userData?.reputationScore}</span><span className="metric-label">Score</span></div>
        <div className="metric-box"><span className="metric-value">${userData?.totalTradeVolume}</span><span className="metric-label">Volume</span></div>
        <div className="metric-box"><span className="metric-value">{userData?.totalTransactions}</span><span className="metric-label">Txns</span></div>
        <div className="metric-box"><span className="metric-value">{userData?.disputeCount}</span><span className="metric-label">Disputes</span></div>
      </div>
      <div className="card" style={{ marginTop: '2rem' }}>
        <h3>Simulate</h3>
        <div className="btn-group">
          <button onClick={() => simulateAction('simulate-transaction', { amount: 150 })} className="btn-gold">+ Txn</button>
          <button onClick={() => simulateAction('simulate-dispute', {})} className="btn-gold" style={{background:'red'}}>+ Dispute</button>
          <button onClick={() => simulateAction('simulate-funding', { amount: 500 })} className="btn-gold">+ Fund</button>
        </div>
      </div>
    </div>
  );
}

export default App;
