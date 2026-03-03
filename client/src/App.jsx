import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const ADMIN_SECRET = 'admin123';
const AUTO_LOGOUT_TIME = 45000;

function App() {
  const [view, setView] = useState('login'); 
  const [wallet, setWallet] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [userData, setUserData] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ledger, setLedger] = useState([]);
  const [regMode, setRegMode] = useState('wallet'); 
  const [showReset, setShowReset] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1: Request, 2: Verify & Reset
  const [resetCodeInput, setResetCodeInput] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    ownerBirthday: '',
    whatsappNumber: '',
    country: '',
    region: '',
    city: '',
    town: '',
    businessType: 'SME'
  });

  const timerRef = useRef(null);

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (view === 'dashboard' || view === 'admin') {
      timerRef.current = setTimeout(() => handleLogout(), AUTO_LOGOUT_TIME);
    }
  };

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const handleActivity = () => resetTimer();
    events.forEach(evt => window.addEventListener(evt, handleActivity));
    resetTimer();
    return () => {
      events.forEach(evt => window.removeEventListener(evt, handleActivity));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [view]);

  const handleLogout = () => {
    setUserData(null); setAllUsers([]); setWallet(''); setPhoneNumber(''); setPassword('');
    setFormData({ businessName: '', ownerName: '', ownerBirthday: '', whatsappNumber: '', country: '', region: '', city: '', town: '', businessType: 'SME' });
    setLedger([]); setView('login'); setShowReset(false);
    alert("Session expired due to inactivity.");
  };

  const handleRefresh = async () => {
    setLoading(true); resetTimer();
    if (view === 'admin') { await fetchAllUsers(); } 
    else if (view === 'dashboard' && userData) {
      try {
        const identifier = userData.walletAddress || userData.phoneNumber || userData.tradeId;
        const res = await axios.get(`${API_URL}/user/${identifier}`);
        setUserData(res.data);
        if (res.data.isBirthday) alert(`🎉 Happy Birthday, ${userData.ownerName}! KS1EGF wishes you a prosperous year!`);
        addMockLedgerEntry("System Refresh", 0, "neutral");
      } catch (err) { handleLogout(); }
    }
    setLoading(false);
  };

  const addMockLedgerEntry = (desc, amount, type) => {
    const newEntry = { id: Date.now(), date: new Date().toLocaleDateString(), description: desc, amount, type };
    setLedger(prev => [newEntry, ...prev].slice(0, 10));
  };

  const handleLogin = async (e) => {
    e.preventDefault(); setLoading(true); setError(''); resetTimer();
    if (wallet === ADMIN_SECRET) { await fetchAllUsers(); setView('admin'); setLoading(false); return; }
    
    try {
      const identifier = wallet || phoneNumber;
      // Use new login endpoint for password auth
      const res = await axios.post(`${API_URL}/login`, { identifier, password });
      setUserData(res.data);
      setView('dashboard');
      setLedger([{ id: 1, date: new Date().toLocaleDateString(), description: "Login Successful", amount: 0, type: "neutral" }]);
      if (res.data.isBirthday) alert(`🎉 Happy Birthday, ${res.data.ownerName}! KS1EGF wishes you a prosperous year!`);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    } finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault(); setLoading(true); setError(''); resetTimer();
    const identifier = regMode === 'wallet' ? wallet : phoneNumber;
    const identifierLabel = regMode === 'wallet' ? 'walletAddress' : 'phoneNumber';

    if (!identifier || !formData.ownerName || !formData.ownerBirthday || !formData.whatsappNumber || !password) {
      setError('All fields including Owner Details and Password are required.');
      setLoading(false); return;
    }

    try {
      const payload = {
        [identifierLabel]: identifier,
        password,
        ownerName: formData.ownerName,
        ownerBirthday: formData.ownerBirthday,
        whatsappNumber: formData.whatsappNumber,
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
      if (res.data.user.isBirthday) alert(`🎉 Happy Birthday, ${res.data.user.ownerName}!`);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally { setLoading(false); }
  };

  const handleForgotPassword = async () => {
    setLoading(true); setError('');
    try {
      const identifier = wallet || phoneNumber;
      const res = await axios.post(`${API_URL}/forgot-password`, { identifier });
      alert(`Reset Code Generated!\nFor this MVP demo, the code is: ${res.data.debugCode}\n(Check browser console)`);
      setResetStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset code.');
    } finally { setLoading(false); }
  };

  const handleResetPassword = async () => {
    setLoading(true); setError('');
    try {
      const identifier = wallet || phoneNumber;
      await axios.post(`${API_URL}/reset-password`, { identifier, code: resetCodeInput, newPassword });
      alert('Password reset successful! Please login.');
      setShowReset(false); setResetStep(1); setPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid code.');
    } finally { setLoading(false); }
  };

  const simulateAction = async (endpoint, payload, desc, amount, type) => {
    setLoading(true); resetTimer();
    try {
      const identifier = userData.walletAddress || userData.phoneNumber || userData.tradeId;
      const key = userData.walletAddress ? 'walletAddress' : userData.phoneNumber ? 'phoneNumber' : 'tradeId';
      const res = await axios.post(`${API_URL}/${endpoint}`, { [key]: identifier, ...payload });
      setUserData(res.data.user);
      addMockLedgerEntry(desc, amount, type);
    } catch (err) { alert('Simulation failed'); } finally { setLoading(false); }
  };

  const fetchAllUsers = async () => {
    setLoading(true); resetTimer();
    try {
      const res = await axios.get(`${API_URL}/admin/all-users`);
      setAllUsers(res.data);
    } catch (err) { setError('Failed to load admin data.'); } finally { setLoading(false); }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Delete this user?')) return;
    resetTimer();
    try { await axios.delete(`${API_URL}/admin/delete-user/${userId}`); await fetchAllUsers(); } 
    catch (err) { alert('Failed to delete'); }
  };

  // --- Star Field Component ---
  const StarField = () => {
    const stars = Array.from({ length: 50 }).map((_, i) => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      width: `${Math.random() * 3 + 1}px`,
      height: `${Math.random() * 3 + 1}px`,
      animationDelay: `${Math.random() * 2}s`
    }));
    const shootingStars = Array.from({ length: 5 }).map((_, i) => ({
      top: `${Math.random() * 50}%`,
      left: `${Math.random() * 100 + 50}%`,
      animationDelay: `${i * 1.5}s`
    }));

    return (
      <div className="star-field">
        {stars.map((s, i) => <div key={i} className="star" style={{ top: s.top, left: s.left, width: s.width, height: s.height, animationDelay: s.animationDelay }} />)}
        {shootingStars.map((s, i) => <div key={`shoot-${i}`} className="shooting-star" style={{ top: s.top, left: s.left, animationDelay: s.animationDelay }} />)}
      </div>
    );
  };

  // --- VIEW: LOGIN / REGISTER ---
  if (view === 'login') {
    return (
      <div className="container" style={{ maxWidth: '600px', marginTop: '60px' }}>
        <StarField />
        <div className="card">
          <div className="page-header">
            <h1>KS1 Trade ID</h1>
            <p>Powered By KS1EGF</p>
          </div>
          
          {!showReset ? (
            <>
              <form onSubmit={handleLogin}>
                <label style={{color:'var(--gold-primary)', fontWeight:'800', fontSize:'0.9rem', textTransform:'uppercase'}}>Access Dashboard</label>
                <input type="text" placeholder="Wallet, Phone, or Trade ID" value={wallet} onChange={(e) => setWallet(e.target.value)} required />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="submit" className="btn-gold" style={{ width: '100%' }} disabled={loading}>{loading ? 'Processing...' : 'Enter System'}</button>
              </form>
              <div style={{textAlign:'center', marginTop:'10px'}}>
                <button onClick={() => setShowReset(true)} style={{background:'none', border:'none', color:'var(--gold-primary)', cursor:'pointer', textDecoration:'underline'}}>Forgot Password?</button>
              </div>
              <hr />
              <h3 style={{color:'var(--gold-primary)', fontSize:'1.2rem', textAlign:'center'}}>New Registration</h3>
              <div className="reg-toggle">
                <div className={`reg-option ${regMode === 'wallet' ? 'active' : ''}`} onClick={() => setRegMode('wallet')}>💼 Wallet</div>
                <div className={`reg-option ${regMode === 'phone' ? 'active' : ''}`} onClick={() => setRegMode('phone')}>📱 Phone</div>
              </div>
              <form onSubmit={handleRegister}>
                {regMode === 'wallet' ? <input type="text" placeholder="Wallet Address" value={wallet} onChange={(e) => setWallet(e.target.value)} required /> : <input type="tel" placeholder="Phone Number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />}
                <input type="password" placeholder="Create Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <input type="text" placeholder="Business Owner Full Name" onChange={(e) => setFormData({...formData, ownerName: e.target.value})} required />
                <label style={{color:'var(--text-muted)', fontSize:'0.8rem'}}>Owner/Business Birthday</label>
                <input type="date" onChange={(e) => setFormData({...formData, ownerBirthday: e.target.value})} required style={{colorScheme:'dark'}} />
                <input type="tel" placeholder="WhatsApp Number" onChange={(e) => setFormData({...formData, whatsappNumber: e.target.value})} required />
                <input type="text" placeholder="Business Name" onChange={(e) => setFormData({...formData, businessName: e.target.value})} required />
                <input type="text" placeholder="Country" onChange={(e) => setFormData({...formData, country: e.target.value})} required />
                <div className="location-grid">
                  <input type="text" placeholder="Region" onChange={(e) => setFormData({...formData, region: e.target.value})} required />
                  <input type="text" placeholder="City" onChange={(e) => setFormData({...formData, city: e.target.value})} required />
                </div>
                <input type="text" placeholder="Town" onChange={(e) => setFormData({...formData, town: e.target.value})} required />
                <select onChange={(e) => setFormData({...formData, businessType: e.target.value})}>
                  <option value="SME">SME</option><option value="Entrepreneur">Entrepreneur</option><option value="Trader">Trader</option><option value="Vendor">Vendor</option><option value="Enterprise">Enterprise</option><option value="Corporation">Corporation</option><option value="Startup">Startup</option><option value="Freelancer">Freelancer</option><option value="Cooperative">Cooperative</option><option value="NGO">Non-Profit</option><option value="Individual">Individual</option>
                </select>
                {error && <div className="error-msg">{error}</div>}
                <button type="submit" className="btn-gold" style={{ width: '100%' }} disabled={loading}>{loading ? 'Generating ID...' : 'Register Business'}</button>
              </form>
            </>
          ) : (
            <div>
              <h3 style={{color:'var(--gold-primary)', textAlign:'center'}}>Reset Password</h3>
              <input type="text" placeholder="Wallet, Phone, or Trade ID" value={wallet} onChange={(e) => setWallet(e.target.value)} disabled={resetStep === 2} />
              {resetStep === 1 ? (
                <button onClick={handleForgotPassword} className="btn-gold" style={{width:'100%'}} disabled={loading}>Send Reset Code</button>
              ) : (
                <>
                  <input type="text" placeholder="Enter 6-Digit Code" value={resetCodeInput} onChange={(e) => setResetCodeInput(e.target.value)} />
                  <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  <button onClick={handleResetPassword} className="btn-gold" style={{width:'100%'}} disabled={loading}>Reset Password</button>
                </>
              )}
              <button onClick={() => {setShowReset(false); setResetStep(1);}} style={{marginTop:'15px', background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', width:'100%'}}>Back to Login</button>
              {error && <div className="error-msg">{error}</div>}
            </div>
          )}
        </div>
        <footer className="global-footer"><div className="footer-content"><span className="footer-brand">© 2026 KS1 Trade ID</span><p className="footer-text">A nonprofit project by KS1 Empire Group & Foundation (KS1EGF)<br/>Built for Alkebulan (Africa) SMEs, Businesses, Entrepreneurs, Enterprises And Traders</p></div></footer>
      </div>
    );
  }

  // --- VIEW: ADMIN DASHBOARD ---
  if (view === 'admin') {
    return (
      <div className="container">
        <StarField />
        <div className="page-header"><h1>Admin Command</h1><p>Powered By KS1EGF</p></div>
        <div style={{display:'flex', justifyContent:'flex-end', marginBottom:'1rem'}}><button onClick={handleRefresh} className="btn-gold" disabled={loading}>🔄 Refresh Data</button></div>
        <div className="card">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem'}}><h3 style={{color:'#fff', fontSize:'1.4rem', margin:0}}>Registered Businesses</h3><span className="badge" style={{background:'var(--gold-primary)', color:'#000'}}>{allUsers.length} Total</span></div>
          {loading && allUsers.length === 0 ? <p>Loading...</p> : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Trade ID</th>
                    <th>Business Info</th>
                    <th>Location Details</th>
                    <th>Contact & Owner</th>
                    <th>Birthday</th>
                    <th>Stats</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map(user => {
                    const isEligible = user.reputationScore >= 70 && user.totalTradeVolume >= 1000 && user.disputeCount < 5;
                    const contact = user.walletAddress || user.phoneNumber;
                    const bday = new Date(user.ownerBirthday).toLocaleDateString();
                    return (
                      <tr key={user._id}>
                        <td><span className="trade-id-cell" style={{color:'var(--gold-primary)'}}>{user.tradeId}</span><br/><span style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>{new Date(user.createdAt).toLocaleDateString()}</span></td>
                        <td><div style={{fontWeight:'800', fontSize:'1.1rem'}}>{user.businessName}</div><div style={{color:'var(--text-muted)', fontSize:'0.9rem'}}>{user.businessType}</div></td>
                        <td><div>{user.town}, {user.city}</div><div style={{color:'var(--text-muted)'}}>{user.region}, {user.country}</div></td>
                        <td>
                          <span className="contact-bold">{user.ownerName}</span>
                          <span className="contact-sub">{contact}</span>
                          <span className="contact-sub">WA: {user.whatsappNumber}</span>
                        </td>
                        <td>
                          <div style={{fontSize:'0.9rem'}}>{bday}</div>
                          {user.isBirthday && <span className="badge badge-birthday">🎉 Today!</span>}
                        </td>
                        <td>
                          <div style={{color: user.reputationScore >= 70 ? 'var(--success)' : 'var(--danger)', fontWeight:'800'}}>Score: {user.reputationScore}</div>
                          <div style={{fontSize:'0.85rem'}}>Vol: ${user.totalTradeVolume.toLocaleString()}</div>
                          <span className={`badge ${isEligible ? 'badge-eligible' : 'badge-not-eligible'}`} style={{fontSize:'0.7rem', marginTop:'5px'}}>{isEligible ? 'ELIGIBLE' : 'PENDING'}</span>
                        </td>
                        <td><button onClick={() => handleDeleteUser(user._id)} className="btn-gold btn-danger" style={{padding:'8px 16px', fontSize:'0.8rem'}}>DELETE</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {allUsers.length === 0 && <p style={{textAlign:'center', padding:'3rem', color:'var(--text-muted)'}}>No businesses registered yet.</p>}
            </div>
          )}
        </div>
        <footer className="global-footer"><div className="footer-content"><span className="footer-brand">© 2026 KS1 Trade ID</span><p className="footer-text">A nonprofit project by KS1 Empire Group & Foundation (KS1EGF)<br/>Built for Alkebulan (Africa) SMEs, Businesses, Entrepreneurs, Enterprises And Traders</p></div></footer>
      </div>
    );
  }

  // --- VIEW: USER DASHBOARD ---
  return (
    <div className="container">
      <StarField />
      <div className="page-header"><h1>My Dashboard</h1><p>Powered By KS1EGF</p></div>
      <div style={{display:'flex', justifyContent:'flex-end', marginBottom:'1rem'}}><button onClick={handleRefresh} className="btn-gold" disabled={loading}>🔄 Refresh Data</button></div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap:'30px' }}>
          <div style={{flex:1, minWidth:'300px'}}>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize:'0.9rem', textTransform:'uppercase', letterSpacing:'1px' }}>Your Unique Trade ID</p>
            <div style={{fontSize:'2.5rem', color:'#fff', fontWeight:'900', margin:'10px 0', fontFamily:'monospace', textShadow:'0 0 20px rgba(255,215,0,0.4)'}}>{userData?.tradeId}</div>
            <div style={{marginTop:'15px', lineHeight:'1.8'}}>
              <p style={{margin:'5px 0', fontSize:'1.1rem'}}><strong style={{color:'var(--gold-primary)'}}>Business:</strong> {userData?.businessName} ({userData?.businessType})</p>
              <p style={{margin:'5px 0', fontSize:'1.1rem'}}><strong style={{color:'var(--gold-primary)'}}>Location:</strong> {userData?.town}, {userData?.city}, {userData?.region}, {userData?.country}</p>
              <p style={{margin:'5px 0', fontSize:'1.1rem'}}><strong style={{color:'var(--gold-primary)'}}>Owner:</strong> {userData?.ownerName}</p>
              <p style={{margin:'5px 0', fontSize:'1.1rem'}}><strong style={{color:'var(--gold-primary)'}}>Contact:</strong> <span style={{fontFamily:'monospace', fontSize:'1rem', color:'#fff'}}>{userData?.walletAddress || userData?.phoneNumber}</span></p>
              <p style={{margin:'5px 0', fontSize:'1.1rem'}}><strong style={{color:'var(--gold-primary)'}}>WhatsApp:</strong> {userData?.whatsappNumber}</p>
              <div style={{marginTop:'15px'}}><span className="badge badge-commission">⚖️ 1% Commission Policy Applied</span></div>
              {userData?.isBirthday && <div style={{marginTop:'15px'}}><span className="badge badge-birthday">🎉 Happy Birthday! KS1EGF loves you!</span></div>}
            </div>
          </div>
          <div className="funding-status-box">
            <div className="funding-title">Funding Status</div>
            <span className={`badge ${userData?.isEligible ? 'badge-eligible' : 'badge-not-eligible'}`} style={{fontSize:'1.3rem', padding:'12px 24px', boxShadow:'0 0 20px rgba(0,0,0,0.5)'}}>{userData?.isEligible ? 'ELIGIBLE FOR FUNDING' : 'NOT ELIGIBLE'}</span>
            <div className="funding-requirements"><div>• Score ≥ 70</div><div>• Vol ≥ $1,000</div><div>• Disputes &lt; 5</div></div>
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
        <h3 style={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px', marginBottom:'20px', textAlign:'center' }}>Simulate Activity</h3>
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
        {ledger.length === 0 ? <p style={{color:'var(--text-muted)', textAlign:'center'}}>No recent transactions.</p> : (
          <table className="ledger-table">
            <thead><tr><th>Date</th><th>Description</th><th>Impact</th></tr></thead>
            <tbody>{ledger.map((item) => (<tr key={item.id}><td>{item.date}</td><td>{item.description}</td><td className={item.type === 'positive' ? 'txn-positive' : item.type === 'negative' ? 'txn-negative' : 'txn-neutral'}>{item.type === 'positive' ? '+' : ''}{item.amount !== 0 ? `$${item.amount}` : 'Neutral'}</td></tr>))}</tbody>
          </table>
        )}
      </div>
      <footer className="global-footer"><div className="footer-content"><span className="footer-brand">© 2026 KS1 Trade ID</span><p className="footer-text">A nonprofit project by KS1 Empire Group & Foundation (KS1EGF)<br/>Built for Alkebulan (Africa) SMEs, Businesses, Entrepreneurs, Enterprises And Traders</p></div></footer>
    </div>
  );
}

export default App;
