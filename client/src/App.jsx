import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const ADMIN_SECRET = 'admin123';

function App() {
  const [view, setView] = useState('login'); 
  const [wallet, setWallet] = useState('');
  const [userData, setUserData] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    businessName: '',
    country: '',
    businessType: 'SME'
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (wallet === ADMIN_SECRET) {
      fetchAllUsers();
      setView('admin');
      setLoading(false);
      return;
    }

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
    if (!window.confirm('Are you sure you want to delete this user permanently?')) return;
    try {
      await axios.delete(`${API_URL}/admin/delete-user/${userId}`);
      fetchAllUsers();
    } catch (err) {
      alert('Failed to delete user.');
    }
  };

  // --- VIEW: LOGIN / REGISTER ---
  if (view === 'login') {
    return (
      <div className="container" style={{ maxWidth: '500px', marginTop: '60px' }}>
        <div className="card">
          <div style={{textAlign:'center', marginBottom:'2rem'}}>
            <h1>KS1 Trade ID</h1>
            <p style={{ color: 'var(--text-muted)', fontSize:'1.1rem' }}>Alkebulan Pay Ecosystem</p>
          </div>
          
          <form onSubmit={handleLogin}>
            <label style={{color:'var(--gold-primary)', fontWeight:'800', fontSize:'0.9rem', textTransform:'uppercase'}}>Access Dashboard</label>
            <input 
              type="text" 
              placeholder="Enter Wallet or 'admin123'" 
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              required
            />
            <button type="submit" className="btn-gold" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Processing...' : 'Enter System'}
            </button>
          </form>
          
          <hr />
          
          <h3 style={{color:'var(--gold-primary)', fontSize:'1.2rem'}}>New Registration</h3>
          <form onSubmit={handleRegister}>
            <input type="text" placeholder="Wallet Address" value={wallet} onChange={(e) => setWallet(e.target.value)} required />
            <input type="text" placeholder="Business Name" onChange={(e) => setFormData({...formData, businessName: e.target.value})} required />
            <input type="text" placeholder="Country" onChange={(e) => setFormData({...formData, country: e.target.value})} required />
            <select onChange={(e) => setFormData({...formData, businessType: e.target.value})}>
              <option value="SME">SME</option>
              <option value="Enterprise">Enterprise</option>
              <option value="Individual">Individual</option>
            </select>
            
            {error && <div className="error-msg">{error}</div>}
            
            <button type="submit" className="btn-gold" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Generating ID...' : 'Register Business'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- VIEW: ADMIN DASHBOARD (REDESIGNED) ---
  if (view === 'admin') {
    return (
      <div className="container">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <h1>KS1 Admin Command</h1>
            <p style={{ color: 'var(--text-muted)', fontSize:'1.1rem' }}>Global Ecosystem Overview</p>
          </div>
          <button onClick={() => { setView('login'); setWallet(''); }} className="btn-gold">Logout</button>
        </header>

        <div className="card">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem'}}>
            <h3 style={{color:'#fff', fontSize:'1.4rem', margin:0}}>Registered Businesses</h3>
            <span className="badge" style={{background:'var(--gold-primary)', color:'#000'}}>{allUsers.length} Total</span>
          </div>
          
          {loading ? <p style={{textAlign:'center', padding:'2rem'}}>Loading Data...</p> : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Trade ID</th>
                    <th>Business Details</th>
                    <th>Wallet</th>
                    <th>Score</th>
                    <th>Volume</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map(user => {
                    const isEligible = user.reputationScore >= 70 && user.totalTradeVolume >= 1000 && user.disputeCount < 5;
                    return (
                      <tr key={user._id}>
                        <td>
                          <span className="trade-id-cell" style={{color:'var(--gold-primary)'}}>{user.tradeId}</span>
                        </td>
                        <td>
                          <div style={{fontWeight:'800', fontSize:'1.1rem'}}>{user.businessName}</div>
                          <div style={{color:'var(--text-muted)', fontSize:'0.9rem'}}>{user.country} • {user.businessType}</div>
                        </td>
                        <td style={{fontFamily:'monospace', color:'var(--text-muted)'}}>
                          {user.walletAddress.substring(0,6)}...{user.walletAddress.substring(38)}
                        </td>
                        <td>
                          <span style={{
                            fontWeight:'800', 
                            fontSize:'1.2rem',
                            color: user.reputationScore >= 70 ? 'var(--success)' : 'var(--danger)'
                          }}>
                            {user.reputationScore}
                          </span>
                        </td>
                        <td style={{fontWeight:'700'}}>${user.totalTradeVolume.toLocaleString()}</td>
                        <td>
                          <span className={`badge ${isEligible ? 'badge-eligible' : 'badge-not-eligible'}`}>
                            {isEligible ? 'ELIGIBLE' : 'PENDING'}
                          </span>
                        </td>
                        <td>
                          <button 
                            onClick={() => handleDeleteUser(user._id)} 
                            className="btn-gold btn-danger"
                            style={{padding:'8px 16px', fontSize:'0.8rem'}}
                          >
                            DELETE
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {allUsers.length === 0 && <p style={{textAlign:'center', padding:'3rem', color:'var(--text-muted)'}}>No businesses registered yet.</p>}
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- VIEW: USER DASHBOARD (REDESIGNED) ---
  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap:'wrap', gap:'1rem' }}>
        <div>
          <h1>My Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', margin:0 }}>Powered by KS1 P2P Gateway</p>
        </div>
        <button onClick={() => { setUserData(null); setView('login'); setWallet(''); }} className="btn-gold">
          Logout
        </button>
      </header>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap:'20px' }}>
          <div style={{flex:1, minWidth:'250px'}}>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize:'0.9rem', textTransform:'uppercase', letterSpacing:'1px' }}>Your Unique Trade ID</p>
            <div className="trade-id-display" style={{fontSize:'2.5rem', color:'#fff', fontWeight:'800', margin:'10px 0', fontFamily:'monospace'}}>
              {userData?.tradeId}
            </div>
            <div style={{marginTop:'15px'}}>
              <p style={{margin:'5px 0', fontSize:'1.1rem'}}><strong style={{color:'var(--gold-primary)'}}>Wallet:</strong> <span style={{fontFamily:'monospace'}}>{userData?.walletAddress}</span></p>
              <p style={{margin:'5px 0', fontSize:'1.1rem'}}><strong style={{color:'var(--gold-primary)'}}>Business:</strong> {userData?.businessName} ({userData?.country})</p>
            </div>
          </div>
          <div style={{ textAlign: 'right', minWidth:'200px', background:'rgba(0,0,0,0.2)', padding:'20px', borderRadius:'12px' }}>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize:'0.8rem', textTransform:'uppercase' }}>Funding Status</p>
            <div style={{margin:'10px 0'}}>
              <span className={`badge ${userData?.isEligible ? 'badge-eligible' : 'badge-not-eligible'}`} style={{fontSize:'1.2rem', padding:'10px 20px'}}>
                {userData?.isEligible ? 'ELIGIBLE FOR FUNDING' : 'NOT ELIGIBLE'}
              </span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight:'1.6', textAlign:'left' }}>
              <div>• Score ≥ 70</div>
              <div>• Vol ≥ $1,000</div>
              <div>• Disputes &lt; 5</div>
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
        <h3 style={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px', marginBottom:'20px' }}>
          Simulate Activity
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom:'20px' }}>Test the reputation engine and eligibility logic.</p>
        
        <div className="btn-group">
          <button onClick={() => simulateAction('simulate-transaction', { amount: 150 })} className="btn-gold" disabled={loading}>
            + Transaction ($150)
          </button>
          <button onClick={() => simulateAction('simulate-dispute', {})} className="btn-gold btn-danger" disabled={loading}>
            + Add Dispute
          </button>
          <button onClick={() => simulateAction('simulate-funding', { amount: 500 })} className="btn-gold" disabled={loading}>
            + Receive Funding
          </button>
          <button onClick={() => simulateAction('simulate-repayment', { scoreImpact: 5 })} className="btn-gold" disabled={loading}>
            + Repay (+5)
          </button>
          <button onClick={() => simulateAction('simulate-repayment', { scoreImpact: -10 })} className="btn-gold" style={{background:'#fff', color:'#64748b'}} disabled={loading}>
            - Miss Payment
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
