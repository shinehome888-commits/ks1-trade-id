import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const ADMIN_SECRET = 'admin123'; // 🔐 Secret Password for Admin Access

function App() {
  const [view, setView] = useState('login'); // 'login', 'dashboard', 'admin'
  const [wallet, setWallet] = useState('');
  const [userData, setUserData] = useState(null);
  const [allUsers, setAllUsers] = useState([]); // For Admin View
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    businessName: '',
    country: '',
    businessType: 'SME'
  });

  // --- Handlers ---

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 🔐 ADMIN CHECK
    if (wallet === ADMIN_SECRET) {
      fetchAllUsers();
      setView('admin');
      setLoading(false);
      return;
    }

    // Normal User Login
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

  // --- Admin Functions ---

  const fetchAllUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/admin/all-users`);
      setAllUsers(res.data);
    } catch (err) {
      setError('Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This cannot be undone.')) return;
    
    try {
      await axios.delete(`${API_URL}/admin/delete-user/${userId}`);
      // Refresh list
      fetchAllUsers();
      alert('User deleted successfully.');
    } catch (err) {
      alert('Failed to delete user.');
    }
  };

  // --- Views ---

  // 1. Login / Register View
  if (view === 'login') {
    return (
      <div className="container" style={{ maxWidth: '500px', marginTop: '50px' }}>
        <div className="card">
          <h2 style={{ color: 'var(--gold-primary)', textAlign: 'center' }}>KS1 Trade ID</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Identity & Reputation Backbone</p>
          
          <div style={{ marginTop: '20px' }}>
            <label style={{color:'var(--gold-primary)', fontWeight:'bold'}}>Access Dashboard</label>
            <form onSubmit={handleLogin}>
              <input 
                type="text" 
                placeholder="Enter Wallet Address (or 'admin123')" 
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
                required
              />
              <button type="submit" className="btn-gold" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Loading...' : 'Access'}
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

  // 2. Admin Dashboard View
  if (view === 'admin') {
    return (
      <div className="container">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ color: 'var(--gold-primary)' }}>KS1 Admin Dashboard</h1>
            <p style={{ color: 'var(--text-muted)' }}>Global Ecosystem Overview</p>
          </div>
          <button onClick={() => { setView('login'); setWallet(''); }} className="btn-gold">Logout</button>
        </header>

        <div className="card">
          <h3 style={{color:'var(--gold-primary)', borderBottom:'1px solid rgba(255,255,255,0.1)', paddingBottom:'10px'}}>
            Registered Businesses ({allUsers.length})
          </h3>
          {loading ? <p>Loading data...</p> : (
            <div style={{overflowX:'auto'}}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', color: '#fff', marginTop:'10px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--gold-primary)' }}>
                    <th style={{padding:'12px'}}>Trade ID</th>
                    <th>Business</th>
                    <th>Wallet</th>
                    <th>Score</th>
                    <th>Volume</th>
                    <th>Eligible</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map(user => {
                    const isEligible = user.reputationScore >= 70 && user.totalTradeVolume >= 1000 && user.disputeCount < 5;
                    return (
                      <tr key={user._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{padding:'12px', color:'var(--gold-primary)', fontWeight:'bold'}}>{user.tradeId}</td>
                        <td>{user.businessName}<br/><span style={{fontSize:'0.8em', color:'var(--text-muted)'}}>{user.country}</span></td>
                        <td style={{fontFamily:'monospace', fontSize:'0.9em'}}>{user.walletAddress.substring(0,6)}...{user.walletAddress.substring(38)}</td>
                        <td style={{color: user.reputationScore >= 70 ? 'var(--success)' : 'var(--danger)'}}>{user.reputationScore}</td>
                        <td>${user.totalTradeVolume.toLocaleString()}</td>
                        <td>
                          <span className={`badge ${isEligible ? 'badge-eligible' : 'badge-not-eligible'}`} style={{fontSize:'0.8em'}}>
                            {isEligible ? 'YES' : 'NO'}
                          </span>
                        </td>
                        <td>
                          <button 
                            onClick={() => handleDeleteUser(user._id)} 
                            style={{background:'rgba(255,95,95,0.2)', color:'var(--danger)', border:'1px solid var(--danger)', padding:'6px 12px', cursor:'pointer', borderRadius:'4px', fontWeight:'bold'}}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {allUsers.length === 0 && <p style={{textAlign:'center', padding:'20px', color:'var(--text-muted)'}}>No users registered yet.</p>}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3. User Dashboard View (Existing Code)
  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap:'wrap', gap:'1rem' }}>
        <div>
          <h1 style={{ color: 'var(--gold-primary)', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>KS1 Trade ID</h1>
          <p style={{ color: 'var(--text-muted)', margin:0 }}>Powered by KS1 P2P Gateway</p>
        </div>
        <button onClick={() => { setUserData(null); setView('login'); setWallet(''); }} className="btn-gold" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
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
              Requirements:<br/>• Score ≥ 70<br/>• Vol ≥ $1,000<br/>• Disputes &lt; 5
            </div>
          </div>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-box"><span className="metric-value">{userData?.reputationScore}</span><span className="metric-label">Reputation Score</span></div>
        <div className="metric-box"><span className="metric-value">${userData?.totalTradeVolume.toLocaleString()}</span><span className="metric-label">Trade Volume</span></div>
        <div className="metric-box"><span className="metric-value">{userData?.totalTransactions}</span><span className="metric-label">Transactions</span></div>
        <div className="metric-box"><span className="metric-value" style={{ color: userData?.disputeCount > 0 ? 'var(--danger)' : 'var(--success)' }}>{userData?.disputeCount}</span><span className="metric-label">Disputes</span></div>
        <div className="metric-box"><span className="metric-value">${userData?.fundingReceived.toLocaleString()}</span><span className="metric-label">Funding Received</span></div>
        <div className="metric-box"><span className="metric-value">{userData?.repaymentScore}%</span><span className="metric-label">Repayment Score</span></div>
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <h3 style={{ color: 'var(--gold-primary)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>Simulate Activity</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Test the reputation engine and eligibility logic.</p>
        <div className="btn-group">
          <button onClick={() => simulateAction('simulate-transaction', { amount: 150 })} className="btn-gold" disabled={loading}>+ Transaction ($150)</button>
          <button onClick={() => simulateAction('simulate-dispute', {})} className="btn-gold" disabled={loading} style={{ background: 'linear-gradient(145deg, #ff5f5f, #cc0000)', color: 'white', boxShadow: '0 4px 0 #990000' }}>+ Add Dispute</button>
          <button onClick={() => simulateAction('simulate-funding', { amount: 500 })} className="btn-gold" disabled={loading}>+ Receive Funding ($500)</button>
          <button onClick={() => simulateAction('simulate-repayment', { scoreImpact: 5 })} className="btn-gold" disabled={loading}>+ Repay (+5 Score)</button>
          <button onClick={() => simulateAction('simulate-repayment', { scoreImpact: -10 })} className="btn-gold" disabled={loading} style={{ background: 'linear-gradient(145deg, #8892b0, #5c6b7f)', color: 'white', boxShadow: '0 4px 0 #3e4a59' }}>- Miss Payment (-10)</button>
        </div>
      </div>
    </div>
  );
}

export default App;
