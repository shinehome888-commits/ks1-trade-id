import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const ADMIN_SECRET = 'admin123';

function App() {
  const [view, setView] = useState('login');
  const [wallet, setWallet] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [userData, setUserData] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ledger, setLedger] = useState([]);
  const [regMode, setRegMode] = useState('wallet');
  const [showReset, setShowReset] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetCodeInput, setResetCodeInput] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [form, setForm] = useState({
    businessName: '', ownerName: '', ownerBirthday: '', whatsappNumber: '',
    country: '', region: '', city: '', town: '', businessType: 'SME'
  });

  const timerRef = useRef(null);
  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (view === 'dashboard' || view === 'admin') {
      timerRef.current = setTimeout(() => handleLogout(), 45000);
    }
  };

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const handle = () => resetTimer();
    events.forEach(e => window.addEventListener(e, handle));
    resetTimer();
    return () => { events.forEach(e => window.removeEventListener(e, handle)); if(timerRef.current) clearTimeout(timerRef.current); };
  }, [view]);

  const handleLogout = () => {
    setUserData(null); setAllUsers([]); setWallet(''); setPhone(''); setPassword('');
    setForm({ businessName: '', ownerName: '', ownerBirthday: '', whatsappNumber: '', country: '', region: '', city: '', town: '', businessType: 'SME' });
    setLedger([]); setView('login'); setShowReset(false);
    alert("Session expired.");
  };

  const handleRefresh = async () => {
    setLoading(true); resetTimer();
    if (view === 'admin') {
      try { const res = await axios.get(`${API_URL}/admin/all-users`); setAllUsers(res.data); } catch(e){}
    } else if (userData) {
      try {
        const id = userData.walletAddress || userData.phoneNumber || userData.tradeId;
        const res = await axios.get(`${API_URL}/user/${id}`);
        setUserData(res.data);
        if(res.data.isBirthday) alert(`🎉 Happy Birthday ${userData.ownerName}!\n\nKS1 Trade ID is honored to have you in our ecosystem. May this year bring unprecedented success to your business! 🚀`);
        addLedger("Refresh", 0, "neutral");
      } catch(e) { handleLogout(); }
    }
    setLoading(false);
  };

  const addLedger = (desc, amt, type) => setLedger(prev => [{id:Date.now(), date:new Date().toLocaleDateString(), description:desc, amount:amt, type}, ...prev].slice(0,10));

  const handleLogin = async (e) => {
    e.preventDefault(); setLoading(true); setError(''); resetTimer();
    if (wallet === ADMIN_SECRET) {
      try { const res = await axios.get(`${API_URL}/admin/all-users`); setAllUsers(res.data); setView('admin'); } catch(err){ setError(err.message); }
      setLoading(false); return;
    }
    try {
      const res = await axios.post(`${API_URL}/login`, { identifier: wallet || phone, password });
      setUserData(res.data); setView('dashboard');
      addLedger("Login", 0, "neutral");
      if(res.data.isBirthday) alert(`🎉 Happy Birthday ${res.data.ownerName}!\n\nFrom all of us at KS1 Trade ID, we appreciate you being part of our journey. May your business flourish and your dreams soar higher! 🌟`);
    } catch(err) { setError(err.response?.data?.message || "Login failed"); }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault(); setLoading(true); setError(''); resetTimer();
    const id = regMode === 'wallet' ? wallet : phone;
    if (!id || !form.ownerName || !form.ownerBirthday || !form.whatsappNumber || !password) {
      setError("All fields required."); setLoading(false); return;
    }
    try {
      const payload = {
        [regMode === 'wallet' ? 'walletAddress' : 'phoneNumber']: id,
        password, ...form
      };
      const res = await axios.post(`${API_URL}/register`, payload);
      setUserData(res.data.user); setView('dashboard');
      addLedger("Registered", 0, "neutral");
      if(res.data.user.isBirthday) alert(`🎉 Happy Birthday ${res.data.user.ownerName}!\n\nKS1 Trade ID celebrates you today! Thank you for trusting us with your business identity. Wishing you continued success and growth! 🌍💛`);
    } catch(err) { setError(err.response?.data?.message || "Register failed"); }
    setLoading(false);
  };

  const handleForgot = async () => {
    setLoading(true); setError('');
    try {
      const res = await axios.post(`${API_URL}/forgot-password`, { identifier: wallet || phone });
      alert(`Code: ${res.data.debugCode}`);
      setResetStep(2);
    } catch(err) { setError(err.response?.data?.message); }
    setLoading(false);
  };

  const handleReset = async () => {
    setLoading(true); setError('');
    try {
      await axios.post(`${API_URL}/reset-password`, { identifier: wallet || phone, code: resetCodeInput, newPassword });
      alert("Password reset! Login now.");
      setShowReset(false); setResetStep(1); setPassword('');
    } catch(err) { setError(err.response?.data?.message); }
    setLoading(false);
  };

  const simulate = async (ep, pay, desc, amt, type) => {
    setLoading(true); resetTimer();
    try {
      const id = userData.walletAddress || userData.phoneNumber || userData.tradeId;
      const key = userData.walletAddress ? 'walletAddress' : userData.phoneNumber ? 'phoneNumber' : 'tradeId';
      const res = await axios.post(`${API_URL}/${ep}`, { [key]: id, ...pay });
      setUserData(res.data.user); addLedger(desc, amt, type);
    } catch(e) { alert("Failed"); }
    setLoading(false);
  };

  const StarField = () => (
    <div className="star-field">
      {[...Array(50)].map((_, i) => (
        <div key={i} className="star" style={{top:`${Math.random()*100}%`, left:`${Math.random()*100}%`, width:`${Math.random()*3+1}px`, height:`${Math.random()*3+1}px`, animationDelay:`${Math.random()*2}s`}} />
      ))}
      {[...Array(5)].map((_, i) => (
        <div key={`s${i}`} className="shooting-star" style={{top:`${Math.random()*50}%`, left:`${Math.random()*100+50}%`, animationDelay:`${i*1.5}s`}} />
      ))}
    </div>
  );

  if (view === 'login') {
    return (
      <div className="container" style={{maxWidth:'600px', marginTop:'60px'}}>
        <StarField />
        <div className="card">
          <div className="page-header"><h1>KS1 Trade ID</h1><p>Powered By KS1EGF</p></div>
          {!showReset ? (
            <>
              <form onSubmit={handleLogin}>
                <label style={{color:'var(--gold-primary)', fontWeight:'800', fontSize:'0.9rem'}}>Access Dashboard</label>
                <input type="text" placeholder="Wallet, Phone, or Trade ID" value={wallet} onChange={e=>setWallet(e.target.value)} required />
                <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
                <button type="submit" className="btn-gold" style={{width:'100%'}} disabled={loading}>{loading?'Loading...':'Enter'}</button>
              </form>
              <div style={{textAlign:'center', marginTop:'10px'}}><button onClick={()=>setShowReset(true)} style={{background:'none', border:'none', color:'var(--gold-primary)', cursor:'pointer', textDecoration:'underline'}}>Forgot Password?</button></div>
              <hr />
              <h3 style={{color:'var(--gold-primary)', textAlign:'center'}}>New Registration</h3>
              <div className="reg-toggle">
                <div className={`reg-option ${regMode==='wallet'?'active':''}`} onClick={()=>setRegMode('wallet')}>💼 Wallet</div>
                <div className={`reg-option ${regMode==='phone'?'active':''}`} onClick={()=>setRegMode('phone')}>📱 Phone</div>
              </div>
              <form onSubmit={handleRegister}>
                {regMode==='wallet' ? <input type="text" placeholder="Wallet" value={wallet} onChange={e=>setWallet(e.target.value)} required/> : <input type="tel" placeholder="Phone" value={phone} onChange={e=>setPhone(e.target.value)} required/>}
                <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required/>
                <input type="text" placeholder="Owner Full Name" onChange={e=>setForm({...form, ownerName:e.target.value})} required/>
                <label style={{color:'var(--text-muted)', fontSize:'0.8rem'}}>Birthday</label>
                <input type="date" onChange={e=>setForm({...form, ownerBirthday:e.target.value})} required style={{colorScheme:'dark'}}/>
                <input type="tel" placeholder="WhatsApp" onChange={e=>setForm({...form, whatsappNumber:e.target.value})} required/>
                <input type="text" placeholder="Business Name" onChange={e=>setForm({...form, businessName:e.target.value})} required/>
                <input type="text" placeholder="Country" onChange={e=>setForm({...form, country:e.target.value})} required/>
                <div className="location-grid">
                  <input type="text" placeholder="Region" onChange={e=>setForm({...form, region:e.target.value})} required/>
                  <input type="text" placeholder="City" onChange={e=>setForm({...form, city:e.target.value})} required/>
                </div>
                <input type="text" placeholder="Town" onChange={e=>setForm({...form, town:e.target.value})} required/>
                <select onChange={e=>setForm({...form, businessType:e.target.value})}>
                  <option value="SME">SME</option><option value="Entrepreneur">Entrepreneur</option><option value="Trader">Trader</option><option value="Vendor">Vendor</option><option value="Enterprise">Enterprise</option><option value="Corporation">Corporation</option><option value="Startup">Startup</option><option value="Freelancer">Freelancer</option><option value="Cooperative">Cooperative</option><option value="NGO">NGO</option><option value="Individual">Individual</option>
                </select>
                {error && <div className="error-msg">{error}</div>}
                <button type="submit" className="btn-gold" style={{width:'100%'}} disabled={loading}>{loading?'Creating...':'Register'}</button>
              </form>
            </>
          ) : (
            <div>
              <h3 style={{color:'var(--gold-primary)', textAlign:'center'}}>Reset Password</h3>
              <input type="text" placeholder="Wallet/Phone/ID" value={wallet} onChange={e=>setWallet(e.target.value)} disabled={resetStep===2}/>
              {resetStep===1 ? (
                <button onClick={handleForgot} className="btn-gold" style={{width:'100%'}} disabled={loading}>Send Code</button>
              ) : (
                <>
                  <input type="text" placeholder="Code" value={resetCodeInput} onChange={e=>setResetCodeInput(e.target.value)}/>
                  <input type="password" placeholder="New Password" value={newPassword} onChange={e=>setNewPassword(e.target.value)}/>
                  <button onClick={handleReset} className="btn-gold" style={{width:'100%'}} disabled={loading}>Reset</button>
                </>
              )}
              <button onClick={()=>{setShowReset(false);setResetStep(1);}} style={{marginTop:'15px', background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', width:'100%'}}>Back</button>
              {error && <div className="error-msg">{error}</div>}
            </div>
          )}
        </div>
        <footer className="global-footer"><div className="footer-content"><span className="footer-brand">© 2026 KS1 Trade ID</span><p className="footer-text">A nonprofit project by KS1 Empire Group & Foundation (KS1EGF)<br/>Built for Alkebulan (Africa) SMEs, Businesses, Entrepreneurs, Enterprises And Traders</p></div></footer>
      </div>
    );
  }

  if (view === 'admin') {
    return (
      <div className="container">
        <StarField />
        <div className="page-header"><h1>Admin Command</h1><p>Powered By KS1EGF</p></div>
        <div style={{display:'flex', justifyContent:'flex-end', marginBottom:'1.5rem'}}>
          <button onClick={handleRefresh} className="btn-gold" disabled={loading}>
            🔄 Refresh Data
          </button>
        </div>
        <div className="card">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem'}}>
            <h3 style={{color:'#fff', margin:0, fontSize:'1.8rem', fontWeight:'900'}}>Registered Businesses</h3>
            <span className="badge" style={{background:'var(--gold-primary)', color:'#000', fontSize:'1.1rem', padding:'12px 24px', fontWeight:'900'}}>{allUsers.length} Total</span>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID & Date</th>
                  <th>Business Info</th>
                  <th>Location Details</th>
                  <th>Owner Name</th>
                  <th>Phone Number</th>
                  <th>WhatsApp</th>
                  <th>Birthday</th>
                  <th>Stats</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map(u => {
                  const elig = u.reputationScore>=70 && u.totalTradeVolume>=1000 && u.disputeCount<5;
                  const contact = u.walletAddress || u.phoneNumber;
                  return (
                    <tr key={u._id}>
                      <td>
                        <div style={{fontWeight:'900', fontSize:'1.15rem', color:'var(--gold-primary)', marginBottom:'5px', fontFamily:'monospace'}}>{u.tradeId}</div>
                        <div style={{fontSize:'0.85rem', color:'var(--text-muted)', fontWeight:'600'}}>Registered: {new Date(u.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td>
                        <div style={{fontWeight:'900', fontSize:'1.15rem', color:'#fff', marginBottom:'6px'}}>{u.businessName}</div>
                        <div style={{fontSize:'0.95rem', color:'var(--text-muted)', fontWeight:'700', textTransform:'uppercase'}}>{u.businessType}</div>
                      </td>
                      <td>
                        <div style={{fontWeight:'800', fontSize:'0.95rem', color:'#fff', marginBottom:'3px'}}>{u.town}, {u.city}</div>
                        <div style={{fontSize:'0.85rem', color:'var(--text-muted)', fontWeight:'700'}}>{u.region}, {u.country}</div>
                      </td>
                      <td>
                        <div style={{fontWeight:'900', fontSize:'1.1rem', color:'#fff', fontFamily:'monospace'}}>{u.ownerName}</div>
                      </td>
                      <td>
                        <div style={{fontWeight:'800', fontSize:'0.95rem', color:'#fff', fontFamily:'monospace'}}>{contact}</div>
                      </td>
                      <td>
                        <div style={{fontWeight:'800', fontSize:'0.95rem', color:'#fff', fontFamily:'monospace'}}>{u.whatsappNumber}</div>
                      </td>
                      <td>
                        <div style={{fontWeight:'800', fontSize:'0.95rem', color:'#fff', marginBottom:'6px'}}>{new Date(u.ownerBirthday).toLocaleDateString()}</div>
                        {u.isBirthday && <span className="badge badge-birthday" style={{marginTop:'5px', display:'block', fontSize:'0.85rem', fontWeight:'800'}}>🎉 Today!</span>}
                      </td>
                      <td>
                        <div style={{fontWeight:'900', fontSize:'1.3rem', color:u.reputationScore>=70?'var(--success)':'var(--danger)', marginBottom:'8px'}}>{u.reputationScore}</div>
                        <div style={{fontSize:'0.85rem', color:'var(--text-muted)', fontWeight:'700', marginBottom:'6px'}}>Vol: ${u.totalTradeVolume.toLocaleString()}</div>
                        <span className={`badge ${elig?'badge-eligible':'badge-not-eligible'}`} style={{fontSize:'0.75rem', fontWeight:'900', marginTop:'8px', display:'inline-block', letterSpacing:'0.5px'}}>ELIGIBLE</span>
                      </td>
                      <td>
                        <button 
                          onClick={async()=>{if(window.confirm('Delete this user permanently? This action cannot be undone.')){await axios.delete(`${API_URL}/admin/delete-user/${u._id}`); handleRefresh();}}} 
                          className="btn-gold btn-danger" 
                          style={{padding:'12px 18px', fontSize:'0.85rem', fontWeight:'900', width:'100%', textTransform:'uppercase'}}
                        >
                          DELETE
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {allUsers.length===0 && <p style={{textAlign:'center', padding:'3rem', color:'var(--text-muted)', fontSize:'1.2rem', fontWeight:'700'}}>No businesses registered yet.</p>}
          </div>
        </div>
        <footer className="global-footer">
          <div className="footer-content">
            <span className="footer-brand">© 2026 KS1 Trade ID</span>
            <p className="footer-text">A nonprofit project by KS1 Empire Group & Foundation (KS1EGF)<br/>Built for Alkebulan (Africa) SMEs, Businesses, Entrepreneurs, Enterprises And Traders</p>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="container">
      <StarField />
      <div className="page-header"><h1>My Dashboard</h1><p>Powered By KS1EGF</p></div>
      <div style={{display:'flex', justifyContent:'flex-end', marginBottom:'1rem'}}><button onClick={handleRefresh} className="btn-gold" disabled={loading}>🔄 Refresh</button></div>
      <div className="card">
        <div style={{display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:'30px'}}>
          <div style={{flex:1, minWidth:'300px'}}>
            <p style={{color:'var(--text-muted)', fontSize:'0.9rem', textTransform:'uppercase'}}>Trade ID</p>
            <div style={{fontSize:'2.5rem', color:'#fff', fontWeight:'900', fontFamily:'monospace', textShadow:'0 0 20px rgba(255,215,0,0.4)'}}>{userData?.tradeId}</div>
            <div style={{marginTop:'15px', lineHeight:'1.8'}}>
              <p><strong style={{color:'var(--gold-primary)'}}>Business:</strong> {userData?.businessName} ({userData?.businessType})</p>
              <p><strong style={{color:'var(--gold-primary)'}}>Location:</strong> {userData?.town}, {userData?.city}, {userData?.region}, {userData?.country}</p>
              <p><strong style={{color:'var(--gold-primary)'}}>Owner:</strong> {userData?.ownerName}</p>
              <p><strong style={{color:'var(--gold-primary)'}}>Contact:</strong> <span style={{fontFamily:'monospace', color:'#fff'}}>{userData?.walletAddress||userData?.phoneNumber}</span></p>
              <p><strong style={{color:'var(--gold-primary)'}}>WhatsApp:</strong> {userData?.whatsappNumber}</p>
              <div style={{marginTop:'15px'}}><span className="badge badge-commission">⚖️ 1% Commission Policy</span></div>
              {userData?.isBirthday && <div style={{marginTop:'15px'}}><span className="badge badge-birthday">🎉 Happy Birthday!</span></div>}
            </div>
          </div>
          <div className="funding-status-box">
            <div className="funding-title">Funding Status</div>
            <span className={`badge ${userData?.isEligible?'badge-eligible':'badge-not-eligible'}`} style={{fontSize:'1.3rem', padding:'12px 24px'}}>{userData?.isEligible?'ELIGIBLE':'NOT ELIGIBLE'}</span>
            <div className="funding-requirements">
              <div>• Score ≥ 70</div>
              <div>• Vol ≥ $1k</div>
              <div>• Disputes &lt; 5</div>
            </div>
          </div>
        </div>
      </div>
      <div className="metrics-grid">
        <div className="metric-box"><span className="metric-value">{userData?.reputationScore}</span><span className="metric-label">Score</span></div>
        <div className="metric-box"><span className="metric-value">${userData?.totalTradeVolume.toLocaleString()}</span><span className="metric-label">Volume</span></div>
        <div className="metric-box"><span className="metric-value">{userData?.totalTransactions}</span><span className="metric-label">Txns</span></div>
        <div className="metric-box"><span className="metric-value" style={{color:userData?.disputeCount>0?'var(--danger)':'var(--success)'}}>{userData?.disputeCount}</span><span className="metric-label">Disputes</span></div>
        <div className="metric-box"><span className="metric-value">${userData?.fundingReceived.toLocaleString()}</span><span className="metric-label">Funding</span></div>
        <div className="metric-box"><span className="metric-value">{userData?.repaymentScore}%</span><span className="metric-label">Repayment</span></div>
      </div>
      <div className="card" style={{marginTop:'2rem'}}>
        <h3 style={{color:'#fff', borderBottom:'1px solid rgba(255,255,255,0.1)', paddingBottom:'15px', textAlign:'center'}}>Simulate</h3>
        <div className="btn-group">
          <button onClick={()=>simulate('simulate-transaction',{amount:150},"Trade",150,"positive")} className="btn-gold" disabled={loading}>+ Txn ($150)</button>
          <button onClick={()=>simulate('simulate-dispute',{},"Dispute",0,"negative")} className="btn-gold btn-danger" disabled={loading}>+ Dispute</button>
          <button onClick={()=>simulate('simulate-funding',{amount:500},"Fund",500,"positive")} className="btn-gold" disabled={loading}>+ Fund</button>
          <button onClick={()=>simulate('simulate-repayment',{scoreImpact:5},"Repay",0,"positive")} className="btn-gold" disabled={loading}>+ Repay</button>
          <button onClick={()=>simulate('simulate-repayment',{scoreImpact:-10},"Miss",0,"negative")} className="btn-gold" style={{background:'#fff', color:'#64748b'}} disabled={loading}>- Miss</button>
        </div>
      </div>
      <div className="ledger-container">
        <div className="ledger-title">Ledger</div>
        {ledger.length===0 ? <p style={{color:'var(--text-muted)', textAlign:'center'}}>No activity.</p> : (
          <table className="ledger-table">
            <thead><tr><th>Date</th><th>Description</th><th>Impact</th></tr></thead>
            <tbody>{ledger.map(i=>(<tr key={i.id}><td>{i.date}</td><td>{i.description}</td><td className={i.type==='positive'?'txn-positive':i.type==='negative'?'txn-negative':'txn-neutral'}>{i.type==='positive'?'+':''}{i.amount?`$${i.amount}`:'-'}</td></tr>))}</tbody>
          </table>
        )}
      </div>
      <footer className="global-footer"><div className="footer-content"><span className="footer-brand">© 2026 KS1 Trade ID</span><p className="footer-text">A nonprofit project by KS1 Empire Group & Foundation (KS1EGF)<br/>Built for Alkebulan (Africa) SMEs, Businesses, Entrepreneurs, Enterprises And Traders</p></div></footer>
    </div>
  );
}

export default App;
