import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('landing')
  const [user, setUser] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [fundingStatus, setFundingStatus] = useState({ eligible: true, score: 85, volume: 2450, disputes: 2 })

  // === REAL-TIME REFRESH FUNCTION ===
  const handleRefresh = () => {
    window.location.reload()
  }

  // === LOAD TRANSACTIONS ===
  useEffect(() => {
    if (currentPage === 'user-dashboard' && user) {
      setTransactions([
        { id: 1, date: '2026-03-02', type: 'Credit', description: 'Trade Settlement #KS1-9921', amount: 3250.00 },
        { id: 2, date: '2026-03-01', type: 'Debit', description: 'Platform Service Fee', amount: -95.00 },
        { id: 3, date: '2026-02-28', type: 'Credit', description: 'Grant Disbursement', amount: 10000.00 },
      ])
    }
  }, [currentPage, user])

  // === UNIVERSAL FOOTER COMPONENT ===
  const UniversalFooter = () => (
    <footer className="universal-footer">
      <div className="footer-trademark">
        &copy; 2026 KS1 Trade ID – A nonprofit project by<br />
        KS1 Empire Group & Foundation (KS1EGF)
      </div>
      <div className="footer-built-for">
        Built for Alkebulan (Africa) SMEs, Businesses,<br />
        Entrepreneurs, Enterprises And Traders
      </div>
      <div className="footer-powered">Powered By KS1EGF</div>
    </footer>
  )

  // === LANDING PAGE ===
  const LandingPage = () => (
    <div className="page-container">
      <div className="hero">
        <h1 className="ks1-title-3d">KS1 Trade ID</h1>
        <p className="hero-subtitle">Secure • Non-custodial • Alkebulan-first • Nonprofit-powered</p>
        <div className="hero-buttons">
          <button className="btn-primary" onClick={() => setCurrentPage('register')}>Get Started</button>
          <button className="btn-secondary" onClick={() => { setCurrentPage('user-dashboard'); setUser({ name: 'Demo User' }); }}>Demo Dashboard</button>
        </div>
      </div>
      <UniversalFooter />
    </div>
  )

  // === REGISTRATION PAGE ===
  const RegistrationPage = () => {
    const [formData, setFormData] = useState({ fullname: '', email: '', phone: '', category: '', password: '' })
    
    const categories = [
      'Individual', 'SME', 'Enterprise', 'Entrepreneur', 'Trader', 'Vendor', 'Freelancer',
      'Cooperative', 'NGO', 'Artisan', 'AgriBusiness', 'TechStartup', 'Logistics',
      'Hospitality', 'Education', 'Healthcare', 'Creative', 'Other'
    ]

    const handleSubmit = (e) => {
      e.preventDefault()
      alert('✓ Registration submitted! Welcome to KS1 Trade ID.')
      setCurrentPage('user-dashboard')
      setUser({ name: formData.fullname, category: formData.category })
    }

    return (
      <div className="page-container">
        <div className="auth-card">
          <h2 className="ks1-title-3d">Join KS1 Trade ID</h2>
          <form onSubmit={handleSubmit} className="ks1-form">
            <div className="form-group">
              <label>Full Name / Business Name *</label>
              <input type="text" required value={formData.fullname} onChange={e => setFormData({...formData, fullname: e.target.value})} placeholder="Enter name" />
            </div>
            <div className="form-group">
              <label>Email Address *</label>
              <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Enter email" />
            </div>
            <div className="form-group">
              <label>Phone Number *</label>
              <input type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+233..." />
            </div>
            <div className="form-group">
              <label>Business Category *</label>
              <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                <option value="" disabled>— Select Category —</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Password *</label>
              <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="Create secure password" />
            </div>
            <button type="submit" className="btn-primary btn-3d">Register Now</button>
          </form>
          <p className="form-footer">Already have an account? <button className="link-btn" onClick={() => setCurrentPage('user-dashboard')}>Sign In</button></p>
        </div>
        <UniversalFooter />
      </div>
    )
  }

  // === USER DASHBOARD ===
  const UserDashboard = () => (
    <div className="page-container">
      <header className="dashboard-header">
        <h2>KS1 Trade ID</h2>
        <button className="btn-refresh btn-3d-white" onClick={handleRefresh} title="Refresh for real-time updates">
          ↻ Refresh
        </button>
      </header>

      <div className="dashboard-title-wrap">
        <h1 className="dashboard-title-3d">My Dashboard</h1>
      </div>

      <div className="dashboard-grid">
        
        <div className="panel ks1-panel">
          <h3>Funding Status</h3>
          <div className="status-badge">
            <strong>ELIGIBLE FOR FUNDING</strong>
            <span>ID: KS1-{user?.name?.slice(0,3).toUpperCase() || 'USER'}-{Math.floor(Math.random()*9000)+1000}</span>
          </div>
          <ul className="criteria-list">
            <li>✓ Score ≥ 70 <small>(Yours: {fundingStatus.score})</small></li>
            <li>✓ Vol ≥ $1,000 <small>(Yours: ${fundingStatus.volume})</small></li>
            <li>✓ Disputes &lt; 5 <small>(Yours: {fundingStatus.disputes})</small></li>
          </ul>
        </div>

        <div className="panel ks1-panel">
          <h3>Transaction Ledger</h3>
          <div className="table-wrap">
            <table className="ks1-table">
              <thead>
                <tr>
                  <th>Date</th><th>Type</th><th>Description</th><th className="text-right">Amount (GHS)</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx.id}>
                    <td>{tx.date}</td>
                    <td className={tx.amount > 0 ? 'text-success' : 'text-danger'}>{tx.type}</td>
                    <td>{tx.description}</td>
                    <td className={`text-right ${tx.amount > 0 ? 'text-success' : 'text-danger'} fw-bold`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString('en-GH', {minimumFractionDigits:2})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
      <UniversalFooter />
    </div>
  )

  // === ADMIN DASHBOARD ===
  const AdminDashboard = () => (
    <div className="page-container">
      <header className="dashboard-header">
        <h2>KS1 Trade ID Admin</h2>
        <button className="btn-refresh btn-3d-white" onClick={handleRefresh}>↻ Refresh</button>
      </header>
      <div className="dashboard-title-wrap">
        <h1 className="dashboard-title-3d">Admin Dashboard</h1>
      </div>
      <div className="dashboard-grid">
        <div className="panel ks1-panel">
          <h3>System Overview</h3>
          <p className="admin-stats">
            • Total Businesses: <strong>1,247</strong><br />
            • Pending Verifications: <strong>34</strong><br />
            • Active Funding Reviews: <strong className="text-success">12</strong><br />
            • Open Support Tickets: <strong className="text-danger">5</strong>
          </p>
        </div>
        <div className="panel ks1-panel">
          <h3>Quick Actions</h3>
          <div className="admin-actions">
            <button className="btn-refresh btn-3d-white">Manage Users</button>
            <button className="btn-refresh btn-3d-white">View Transactions</button>
            <button className="btn-refresh btn-3d-white">Funding Approvals</button>
            <button className="btn-refresh btn-3d-white">Support Tickets</button>
          </div>
        </div>
      </div>
      <UniversalFooter />
    </div>
  )

  // === RENDER CURRENT PAGE ===
  return (
    <div className="app-wrapper">
      {currentPage === 'landing' && <LandingPage />}
      {currentPage === 'register' && <RegistrationPage />}
      {currentPage === 'user-dashboard' && <UserDashboard />}
      {currentPage === 'admin-dashboard' && <AdminDashboard />}
    </div>
  )
}

export default App
