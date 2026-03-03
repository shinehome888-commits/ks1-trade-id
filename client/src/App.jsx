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
  
  // Mock Ledger State (Simulated for MVP)
  const [ledger, setLedger] = useState([]);

  const [formData, setFormData] = useState({
    businessName: '',
    country: '',
    businessType: 'SME'
  });

  // Refresh Function
  const handleRefresh = async () => {
    setLoading(true);
    if (view === 'admin') {
      await fetchAllUsers();
    } else if (view === 'dashboard' && userData) {
      try {
        const res = await axios.get(`${API_URL}/user/${wallet}`);
        setUserData(res.data);
        // Simulate fetching new ledger entries based on recent actions
        addMockLedgerEntry("System Refresh", 0, "neutral");
      } catch (err) {
        setError('Session expired. Please login again.');
        setView('login');
      }
    }
    setLoading(false);
  };

  // Helper to add mock ledger entries
  const addMockLedgerEntry = (desc, amount, type) => {
    const newEntry = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      description: desc,
      amount: amount,
      type: type // 'positive', 'negative', 'neutral'
    };
    setLedger(prev => [newEntry, ...prev].slice(0, 10)); // Keep last 10
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setLedger([]); // Clear ledger on new login

    if (wallet === ADMIN_SECRET) {
      await fetchAllUsers();
      setView('admin');
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get(`${API_URL}/user/${wallet}`);
      setUserData(res.data);
      setView('dashboard');
      // Initial Ledger Population
      setLedger([
        { id: 1, date: new Date().toLocaleDateString(), description: "Account Created", amount: 0, type: "neutral" },
        { id: 2, date: new Date().toLocaleDateString(), description: "Initial Reputation Score", amount: 50, type: "neutral" }
      ]);
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
    setLedger([]);
    try {
      const res = await axios.post(`${API_URL}/register`, {
        walletAddress: wallet,
        ...formData
      });
      setUserData(res.data.user);
      setView('dashboard');
      setLedger([{ id: 1, date: new Date().toLocaleDateString(), description: "Registration Complete", amount: 0, type: "neutral" }]);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const simulateAction = async (endpoint, payload, desc, amount, type) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/${endpoint}`, {
        walletAddress: wallet,
        ...payload
      });
      setUserData(res.data.user);
      addMockLedgerEntry(desc, amount, type);
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
      await fetchAllUsers();
    } catch (err) {
      alert('Failed to delete user.');
    }
  };

  // --- VIEW: LOGIN / REGISTER ---
  if (view === 'login') {
    return (
      <div className="container" style={{ maxWidth: '500px', marginTop: '60px' }}>
        <div className="card">
          <div className="page-header">
            <h1>KS1 Trade ID</h1>
            <p>Powered By KS1EGF</p>
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
          
          <h3 style={{color:'var(--gold-primary)', fontSize:'1.2rem', textAlign:'center'}}>New Registration</h3>
          <form onSubmit={handleRegister}>
            <input type="text" placeholder="Wallet Address" value={wallet} onChange={(e) => setWallet(e.target.value)} required />
            <input type="text" placeholder="Business Name" onChange={(e) => setFormData({...formData, businessName: e.target.value})} required />
            <input type="text" placeholder="Country" onChange={(e) => setFormData({...formData, country: e.target.value})} required />
            
            <select onChange={(e) => setFormData({...formData, businessType: e.target.value})}>
              <option value="SME">SME</option>
              <option value="Entrepreneur">Entrepreneur</option>
              <option value="Trader">Trader</option>
              <option value="Vendor">Vendor</option>
              <option value="Enterprise">Enterprise</option>
              <option value="Corporation">Corporation</option>
              <option value="Startup">Startup</option>
              <option value="Freelancer">Freelancer</option>
              <option value="Cooperative">Cooperative</option>
              <option value="NGO">Non-Profit / NGO</option>
              <option value="Individual">Individual</option>
            </select>
            
            {error && <div className="error-msg">{error}</div>}
            
            <button type="submit" className="btn-gold" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Generating ID...' : 'Register Business'}
            </button>
          </form>
        </div>
        
        {/* Footer on Login Page */}
        <footer className="global-footer">
          <div className="footer-content">
            <span className="footer-brand">© 2026 KS1 Trade ID</span>
            <p className="footer-text">
              A nonprofit project by KS1 Empire Group & Foundation (KS1EGF)<br/>
              Built for Alkebulan (Africa) SMEs, Businesses, Entrepreneurs, Enterprises And Traders
            </p>
          </div>
        </footer>
      </div>
    );
  }

  // --- VIEW: ADMIN DASHBOARD ---
  if (view === 'admin') {
    return (
      <div className="container">
        <div className="page-header">
          <h1>Admin Command</h1>
          <p>Powered By KS1EGF</p>
        </div>

        <div style={{display:'flex', justifyContent:'flex-end', marginBottom:'1rem'}}>
           <button onClick={handleRefresh} className="btn-gold" disabled={loading}>
             🔄 Refresh Data
           </button>
        </div>

        <div className="card">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem'}}>
            <h3 style={{color:'#fff', fontSize:'1.4rem', margin:0}}>Registered Businesses</h3>
            <span className="badge" style={{background:'var(--gold-primary)', color:'#000'}}>{allUsers.length} Total</span>
          </div>
          
          {loading && allUsers.length === 0 ? <p style={{textAlign:'center', padding:'2rem'}}>Loading Data...</p> : (
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
                        <td><span className="trade-id-cell" style={{color:'var(--gold-primary)'}}>{user.tradeId}</span></td>
                        <td>
                          <div style={{fontWeight:'800', fontSize:'1.1rem'}}>{user.businessName}</div>
                          <div style={{color:'var(--text-muted)', fontSize:'0.9rem'}}>{user.country} • {user.businessType}</div>
                        </td>
                        <td style={{fontFamily:'monospace', color:'var(--text-muted)'}}>
                          {user.walletAddress.substring(0,6)}...{user.walletAddress.substring(38)}
                        </td>
                        <td>
                          <span style={{fontWeight:'800', fontSize:'1.2rem', color: user.reputationScore >= 70 ? 'var(--success)' : 'var(--danger)'}}>
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
                          <button onClick={() => handleDeleteUser(user._id)} className="btn-gold btn-danger" style={{padding:'8px 16px', fontSize:'0.8rem'}}>DELETE</button>
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

        {/* Footer on Admin Page */}
        <footer className="global-footer">
          <div className="footer-content">
            <span className="footer-brand">© 2026 KS1 Trade ID</span>
            <p className="footer-text">
              A nonprofit project by KS1 Empire Group & Foundation (KS1EGF)<br/>
              Built for Alkebulan (Africa) SMEs, Businesses, Entrepreneurs, Enterprises And Traders
            </p>
          </div>
        </footer>
      </div>
    );
  }

  // --- VIEW: USER DASHBOARD ---
  return (
    <div className="container">
      <div className="page-header">
        <h1>My Dashboard</h1>
        <p>Powered By KS1EGF</p>
      </div>

      <div style={{display:'flex', justifyContent:'flex-end', marginBottom:'1rem'}}>
         <button onClick={handleRefresh} className="btn-gold" disabled={loading}>
           🔄 Refresh Data
         </button>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap:'30px' }}>
          <div style={{flex:1, minWidth:'300px'}}>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize:'0.9rem', textTransform:'uppercase', letterSpacing:'1px' }}>Your Unique Trade ID</p>
            <div style={{fontSize:'2.5rem', color:'#fff', fontWeight:'900', margin:'10px 0', fontFamily:'monospace', textShadow:'0 0 20px rgba(255,215,0,0.4)'}}>
              {userData?.tradeId}
            </div>
            <div style={{marginTop:'15px'}}>
              <p style={{margin:'8px 0', fontSize:'1.1rem'}}><strong style={{color:'var(--gold-primary)'}}>Business:</strong> {userData?.businessName} ({userData?.businessType})</p>
              <p style={{margin:'8px 0', fontSize:'1.1rem'}}><strong style={{color:'var(--gold-primary)'}}>Location:</strong> {userData?.country}</p>
              <p style={{margin:'8px 0', fontSize:'1.1rem'}}><strong style={{color:'var(--gold-primary)'}}>Wallet:</strong> <span style={{fontFamily:'monospace', fontSize:'0.9rem'}}>{userData?.walletAddress}</span></p>
            </div>
          </div>
          
          {/* Centered Funding Status Box */}
          <div className="funding-status-box">
            <div className="funding-title">Funding Status</div>
            <span className={`badge ${userData?.isEligible ? 'badge-eligible' : 'badge-not-eligible'}`} style={{fontSize:'1.3rem', padding:'12px 24px', boxShadow:'0 0 20px rgba(0,0,0,0.5)'}}>
              {userData?.isEligible ? 'ELIGIBLE FOR FUNDING' : 'NOT ELIGIBLE'}
            </span>
            <div className="funding-requirements">
              <div>• Score ≥ 70</div>
              <div>• Vol ≥ $1,000</div>
              <div>• Disputes &lt; 5</div>
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
        <h3 style={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px', marginBottom:'20px', textAlign:'center' }}>
          Simulate Activity
        </h3>
        <div className="btn-group">
          <button onClick={() => simulateAction('simulate-transaction', { amount: 150 }, "Trade Execution", 150, "positive")} className="btn-gold" disabled={loading}>+ Transaction ($150)</button>
          <button onClick={() => simulateAction('simulate-dispute', {}, "Dispute Opened", 0, "negative")} className="btn-gold btn-danger" disabled={loading}>+ Add Dispute</button>
          <button onClick={() => simulateAction('simulate-funding', { amount: 500 }, "Funding Received", 500, "positive")} className="btn-gold" disabled={loading}>+ Receive Funding</button>
          <button onClick={() => simulateAction('simulate-repayment', { scoreImpact: 5 }, "Repayment Made", 0, "positive")} className="btn-gold" disabled={loading}>+ Repay (+5)</button>
          <button onClick={() => simulateAction('simulate-repayment', { scoreImpact: -10 }, "Payment Missed", 0, "negative")} className="btn-gold" style={{background:'#fff', color:'#64748b'}} disabled={loading}>- Miss Payment</button>
        </div>
      </div>

      {/* Transaction Ledger */}
      <div className="ledger-container">
        <div className="ledger-title">Transaction Ledger</div>
        {ledger.length === 0 ? (
          <p style={{color:'var(--text-muted)', textAlign:'center'}}>No recent transactions.</p>
        ) : (
          <table className="ledger-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Impact</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((item) => (
                <tr key={item.id}>
                  <td>{item.date}</td>
                  <td>{item.description}</td>
                  <td className={item.type === 'positive' ? 'txn-positive' : item.type === 'negative' ? 'txn-negative' : 'txn-neutral'}>
                    {item.type === 'positive' ? '+' : ''}{item.amount !== 0 ? `$${item.amount}` : 'Neutral'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer on User Page */}
      <footer className="global-footer">
        <div className="footer-content">
          <span className="footer-brand">© 2026 KS1 Trade ID</span>
          <p className="footer-text">
            A nonprofit project by KS1 Empire Group & Foundation (KS1EGF)<br/>
            Built for Alkebulan (Africa) SMEs, Businesses, Entrepreneurs, Enterprises And Traders
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
