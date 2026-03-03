import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const ADMIN_SECRET = 'admin123';
const AUTO_LOGOUT_TIME = 45000; // 45 seconds

function App() {
  const [view, setView] = useState('login'); 
  const [wallet, setWallet] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userData, setUserData] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ledger, setLedger] = useState([]);
  
  // Registration Mode: 'wallet' or 'phone'
  const [regMode, setRegMode] = useState('wallet'); 

  const [formData, setFormData] = useState({
    businessName: '',
    country: '',
    region: '',
    city: '',
    town: '',
    businessType: 'SME'
  });

  // --- Auto Logout Timer Logic ---
  const timerRef = useRef(null);

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (view === 'dashboard' || view === 'admin') {
      timerRef.current = setTimeout(() => {
        handleLogout();
      }, AUTO_LOGOUT_TIME);
    }
  };

  useEffect(() => {
    // Attach event listeners for activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const handleActivity = () => resetTimer();
    
    events.forEach(evt => window.addEventListener(evt, handleActivity));
    
    // Initial start
    resetTimer();

    return () => {
      events.forEach(evt => window.removeEventListener(evt, handleActivity));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [view]);

  const handleLogout = () => {
    setUserData(null);
    setAllUsers([]);
    setWallet('');
    setPhoneNumber('');
    setFormData({ businessName: '', country: '', region: '', city: '', town: '', businessType: 'SME' });
    setLedger([]);
    setView('login');
    alert("Session expired due to inactivity. Please login again.");
  };

  // Refresh Function
  const handleRefresh = async () => {
    setLoading(true);
    resetTimer(); // Reset timer on manual refresh
    if (view === 'admin') {
      await fetchAllUsers();
    } else if (view === 'dashboard' && userData) {
      try {
        const identifier = userData.walletAddress || userData.phoneNumber;
        const res = await axios.get(`${API_URL}/user/${identifier}`);
        setUserData(res.data);
        addMockLedgerEntry("System Refresh", 0, "neutral");
      } catch (err) {
        setError('Session expired. Please login again.');
        handleLogout();
      }
    }
    setLoading(false);
  };

  const addMockLedgerEntry = (desc, amount, type) => {
    const newEntry = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      description: desc,
      amount: amount,
      type: type
    };
    setLedger(prev => [newEntry, ...prev].slice(0, 10));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setLedger([]);
    resetTimer();

    if (wallet === ADMIN_SECRET) {
      await fetchAllUsers();
      setView('admin');
      setLoading(false);
      return;
    }

    try {
      // Try login with wallet first, then phone if needed
      let identifier = wallet || phoneNumber;
      const res = await axios.get(`${API_URL}/user/${identifier}`);
      setUserData(res.data);
      setView('dashboard');
      setLedger([
        { id: 1, date: new Date().toLocaleDateString(), description: "Login Successful", amount: 0, type: "neutral" }
      ]);
    } catch (err) {
      setError('ID not found. Please register first.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setLedger([]);
    resetTimer();

    const identifier = regMode === 'wallet' ? wallet : phoneNumber;
    const identifierLabel = regMode === 'wallet' ? 'walletAddress' : 'phoneNumber';

    if (!identifier) {
      setError(regMode === 'wallet' ? 'Wallet Address required' : 'Phone Number required');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        [identifierLabel]: identifier,
        businessName: formData.businessName,
        country: formData.country,
        region: formData.region,
        city: formData.city,
        town: formData.town,
        businessType: formData.businessType
      };

      const res = await axios.post(`${API_URL}/register`, payload);
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
    resetTimer();
    try {
      const identifier = userData.walletAddress || userData.phoneNumber;
      const res = await axios.post(`${API_URL}/${endpoint}`, {
        [userData.walletAddress ? 'walletAddress' : 'phoneNumber']: identifier,
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
    resetTimer();
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
    if (!window.confirm('Delete this user permanently?')) return;
    resetTimer();
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
        {/* Shooting Stars Container */}
        <div className="shooting-star animate" style={{ top: '10%', left: '80%', animationDelay: '0s' }}></div>
        <div className="shooting-star animate" style={{ top: '30%', left: '60%', animationDelay: '1.5s' }}></div>
        <div className="shooting-star animate" style={{ top: '60%', left: '90%', animationDelay: '3s' }}></div>

        <div className="card">
          <div className="page-header">
            <h1>KS1 Trade ID</h1>
            <p>Powered By KS1EGF</p>
          </div>
          
          <form onSubmit={handleLogin}>
            <label style={{color:'var(--gold-primary)', fontWeight:'800', fontSize:'0.9rem', textTransform:'uppercase'}}>Access Dashboard</label>
            <input 
              type="text" 
              placeholder="Enter Wallet, Phone, or 'admin123'" 
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
          
          {/* Dual Registration Toggle */}
          <div className="reg-toggle">
            <div 
              className={`reg-option ${regMode === 'wallet' ? 'active' : ''}`}
              onClick={() => setRegMode('wallet')}
            >
              💼 Wallet (Recommended)
            </div>
            <div 
              className={`reg-option ${regMode === 'phone' ? 'active' : ''}`}
              onClick={() => setRegMode('phone')}
            >
              📱 Phone Number
            </div>
          </div>

          <form onSubmit={handleRegister}>
            {regMode === 'wallet' ? (
              <input type="text" placeholder="Wallet Address" value={wallet} onChange={(e) => setWallet(e.target.value)} required />
            ) : (
              <input type="tel" placeholder="Phone Number (e.g., +233...)" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
            )}
            
            <input type="text" placeholder="Business Name" onChange={(e) => setFormData({...formData, businessName: e.target.value})} required />
            
            {/* Expanded Location Fields */}
            <input type="text" placeholder="Country" onChange={(e) => setFormData({...formData, country: e.target.value})} required />
            <div className="location-grid">
              <input type="text" placeholder="Region" onChange={(e) => setFormData({...formData, region: e.target.value})} required />
              <input type="text" placeholder="City" onChange={(e) => setFormData({...formData, city: e.target.value})} required />
            </div>
            <input type="text" placeholder="Town" onChange={(e) => setFormData({...formData, town: e.target.value})} required />
            
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
        {/* Shooting Stars */}
        <div className="shooting-star animate" style={{ top: '20%', left: '10%', animationDelay: '0.5s' }}></div>
        <div className="shooting-star animate" style={{ top: '50%', left: '80%', animationDelay: '2s' }}></div>

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
                    <th>Business & Location</th>
                    <th>Contact</th>
                    <th>Score</th>
                    <th>Volume</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map(user => {
                    const isEligible = user.reputationScore >= 70 && user.totalTradeVolume >= 1000 && user.disputeCount < 5;
                    const contact = user.walletAddress || user.phoneNumber;
                    return (
                      <tr key={user._id}>
                        <td><span className="trade-id-cell" style={{color:'var(--gold-primary)'}}>{user.tradeId}</span></td>
                        <td>
                          <div style={{fontWeight:'800', fontSize:'1.1rem'}}>{user.businessName}</div>
                          <div style={{color:'var(--text-muted)', fontSize:'0.85rem'}}>
                            {user.town}, {user.city}, {user.region}<br/>{user.country} • {user.businessType}
                          </div>
                        </td>
                        <td style={{fontFamily:'monospace', color:'var(--text-muted)', fontSize:'0.85rem'}}>
                          {contact.substring(0,10)}...
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
      {/* Shooting Stars */}
      <div className="shooting-star animate" style={{ top: '15%', left: '90%', animationDelay: '1s' }}></div>
      <div className="shooting-star animate" style={{ top: '70%', left: '20%', animationDelay: '3.5s' }}></div>

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
            <div style={{marginTop:'15px', lineHeight:'1.8'}}>
              <p style={{margin:'5px 0', fontSize:'1.1rem'}}><strong style={{color:'var(--gold-primary)'}}>Business:</strong> {userData?.businessName} ({userData?.businessType})</p>
              
              {/* Expanded Location Display */}
              <p style={{margin:'5px 0', fontSize:'1.1rem'}}>
                <strong style={{color:'var(--gold-primary)'}}>Location:</strong> 
                {userData?.town}, {userData?.city}, {userData?.region}, {userData?.country}
              </p>
              
              <p style={{margin:'5px 0', fontSize:'1.1rem'}}>
                <strong style={{color:'var(--gold-primary)'}}>Contact:</strong> 
                <span style={{fontFamily:'monospace', fontSize:'0.9rem'}}>
                  {userData?.walletAddress || userData?.phoneNumber}
                </span>
              </p>
              
              {/* Commission Policy Badge */}
              <div style={{marginTop:'15px'}}>
                <span className="badge badge-commission">
                  ⚖️ 1% Commission Policy Applied
                </span>
              </div>
            </div>
          </div>
          
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
