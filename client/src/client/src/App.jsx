import React, { useState } from 'react';
import axios from 'axios';

// Dynamic API URL: Uses Env Var in Production, Localhost in Dev
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function App() {
  const [view, setView] = useState('register'); 
  const [wallet, setWallet] = useState('');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    businessName: '',
    country: '',
    businessType: 'SME'
  });

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_URL}/register`, {
        walletAddress: wallet,
        ...formData
      });
      setUserData(res.data.user);
      setView('dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_URL}/user/${wallet}`);
      setUserData(res.data);
      setView('dashboard');
    } catch (err) {
      setError('Wallet not found. Please register first.');
    } finally {
      setLoading(false);
    }
  };

  const simulateAction = async (endpoint, payload) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/${endpoint}`, {
        walletAddress: wallet,
        ...payload
      });
      setUserData(res.data.user);
    } catch (err) {
      alert('Simulation failed: ' + (err.response?.data?.message || 'Network error'));
    } finally {
      setLoading(false);
    }
  };

  // --- Views ---

  if (view === 'register' && !userData) {
    return (
      <div className="container" style={{ maxWidth: '500px', marginTop: '50px' }}>
        <div className="card">
          <h2 style={{ color: 'var(--gold-primary)', textAlign: 'center' }}>KS1 Trade ID</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Identity & Reputation Backbone</p>
          
          <div style={{ marginTop: '20px' }}>
            <label style={{color:'var(--gold-primary)', fontWeight:'bold'}}>Login with Wallet</label>
            <form onSubmit={handleLogin}>
              <input 
                type="text" 
                placeholder="Enter Wallet Address" 
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
                required
              />
              <button type="submit" className="btn-gold" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Loading...' : 'Access Dashboard'}
              </button>
            </form>
            
            <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '20px 0' }} />
            
            <h3 style={{color:'var(--gold-primary)'}}>New Registration</h3>
            <form onSubmit={handleRegister}>
              <input 
                type="text" 
                placeholder="Wallet Address" 
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
                required
              />
              <input 
                type="text" 
                placeholder="Business Name" 
                onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                required
              />
              <input 
                type="text" 
                placeholder="Country" 
                onChange={(e) => setFormData({...formData, country: e.target.value})}
                required
              />
              <select onChange={(e) => setFormData({...formData, businessType: e.target.value})}>
                <option value="SME">SME</option>
                <option value="Enterprise">Enterprise</option>
                <option value="Individual">Individual</option>
              </select>
              
              {error && <div className="error-msg">{error}</div>}
              
              <button type="submit" className="btn-gold" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Generating ID...' : 'Register & Get KS1 ID'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard View
  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap:'wrap', gap:'1rem' }}>
        <div>
          <h1 style={{ color: 'var(--gold-primary)', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>KS1 Trade ID</h1>
          <p style={{ color: 'var(--text-muted)', margin:0 }}>Powered by KS1 P2P Gateway</p>
        </div>
        <button onClick={() => { setUserData(null); setView('register'); setWallet(''); }} className="btn-gold" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
          Logout
        </button>
      </header>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap:'20px' }}>
          <div style={{flex:1, minWidth:'250px'}}>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize:'0.9rem' }}>Your Unique Trade ID</p>
            <div className="trade-id-display">{userData?.tradeId}</div>
            <p><strong>Wallet:</strong> <span style={{ fontFamily: 'monospace', color: 'var(--gold-primary)' }}>{userData?.walletAddress}</span></p>
            <p><strong>Business:</strong> {userData?.businessName} ({userData?.country})</p>
          </div>
          <div style={{ textAlign: 'right', minWidth:'200px' }}>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize:'0.9rem' }}>Funding Eligibility</p>
            <span className={`badge ${userData?.isEligible ? 'badge-eligible' : 'badge-not-eligible'}`} style={{fontSize:'1.1rem', padding:'8px 16px'}}>
              {userData?.isEligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}
            </span>
            <div style={{ marginTop: '10px', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight:'1.4' }}>
              Requirements:<br/>
              • Score ≥ 70<br/>
              • Vol ≥ $1,000<br/>
              • Disputes &lt; 5
            </div>
          </div>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-box">
          <span className="metric-value">{userData?.reputationScore}</span>
          <span className="metric-label">Reputation Score</span>
        </div>
        <div className="metric-box">
          <span className="metric-value">${userData?.totalTradeVolume.toLocaleString()}</span>
          <span className="metric-label">Trade Volume</span>
        </div>
        <div className="metric-box">
          <span className="metric-value">{userData?.totalTransactions}</span>
          <span className="metric-label">Transactions</span>
        </div>
        <div className="metric-box">
          <span className="metric-value" style={{ color: userData?.disputeCount > 0 ? 'var(--danger)' : 'var(--success)' }}>
            {userData?.disputeCount}
          </span>
          <span className="metric-label">Disputes</span>
        </div>
        <div className="metric-box">
          <span className="metric-value">${userData?.fundingReceived.toLocaleString()}</span>
          <span className="metric-label">Funding Received</span>
        </div>
        <div className="metric-box">
          <span className="metric-value">{userData?.repaymentScore}%</span>
          <span className="metric-label">Repayment Score</span>
        </div>
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <h3 style={{ color: 'var(--gold-primary)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
          Simulate Activity
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Test the reputation engine and eligibility logic.</p>
        
        <div className="btn-group">
          <button onClick={() => simulateAction('simulate-transaction', { amount: 150 })} className="btn-gold" disabled={loading}>
            + Transaction ($150)
          </button>
          <button onClick={() => simulateAction('simulate-dispute', {})} className="btn-gold" disabled={loading} style={{ background: 'linear-gradient(145deg, #ff5f5f, #cc0000)', color: 'white', boxShadow: '0 4px 0 #990000' }}>
            + Add Dispute
          </button>
          <button onClick={() => simulateAction('simulate-funding', { amount: 500 })} className="btn-gold" disabled={loading}>
            + Receive Funding ($500)
          </button>
          <button onClick={() => simulateAction('simulate-repayment', { scoreImpact: 5 })} className="btn-gold" disabled={loading}>
            + Repay (+5 Score)
          </button>
          <button onClick={() => simulateAction('simulate-repayment', { scoreImpact: -10 })} className="btn-gold" disabled={loading} style={{ background: 'linear-gradient(145deg, #8892b0, #5c6b7f)', color: 'white', boxShadow: '0 4px 0 #3e4a59' }}>
            - Miss Payment (-10)
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
