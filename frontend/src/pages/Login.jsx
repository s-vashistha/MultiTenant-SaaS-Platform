import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [tenants,    setTenants]    = useState([]);
  const [tenantSlug, setTenantSlug] = useState('');
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [error,      setError]      = useState('');
  const [loading,    setLoading]    = useState(false);

  useEffect(() => {
    if (user) navigate('/dashboard');
    api.get('/tenants').then(r => {
      setTenants(r.data.tenants);
      if (r.data.tenants.length) setTenantSlug(r.data.tenants[0].slug);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(tenantSlug, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email) => { setEmail(email); setPassword('password123'); };

  const selectedTenant = tenants.find(t => t.slug === tenantSlug);

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>NexaCore</div>
        <p style={s.sub}>Multi-Tenant SaaS Platform</p>

        <form onSubmit={handleSubmit}>
          <label style={s.label}>Organisation</label>
          <select style={s.input} value={tenantSlug} onChange={e => setTenantSlug(e.target.value)}>
            {tenants.map(t => <option key={t.slug} value={t.slug}>{t.name} ({t.plan})</option>)}
          </select>

          <label style={s.label}>Email</label>
          <input style={s.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required />

          <label style={s.label}>Password</label>
          <input style={s.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />

          {error && <div style={s.error}>{error}</div>}

          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div style={s.demoBox}>
          <div style={s.demoTitle}>Quick demo logins {selectedTenant ? `— ${selectedTenant.name}` : ''}</div>
          {tenantSlug === 'acme_corp' && <>
            <button style={s.demoBtn} onClick={() => fillDemo('arjun@acme.com')}>Admin — arjun@acme.com</button>
            <button style={s.demoBtn} onClick={() => fillDemo('priya@acme.com')}>Manager — priya@acme.com</button>
            <button style={s.demoBtn} onClick={() => fillDemo('rahul@acme.com')}>Viewer — rahul@acme.com</button>
          </>}
          {tenantSlug === 'nova_studios' && <>
            <button style={s.demoBtn} onClick={() => fillDemo('ananya@nova.io')}>Admin — ananya@nova.io</button>
            <button style={s.demoBtn} onClick={() => fillDemo('dev@nova.io')}>Manager — dev@nova.io</button>
          </>}
          {tenantSlug === 'zeta_finance' && <>
            <button style={s.demoBtn} onClick={() => fillDemo('ria@zeta.com')}>Admin — ria@zeta.com</button>
            <button style={s.demoBtn} onClick={() => fillDemo('nikhil@zeta.com')}>Manager — nikhil@zeta.com</button>
          </>}
          <div style={{fontSize:11,color:'#7a7f94',marginTop:6}}>All passwords: <code>password123</code></div>
        </div>
      </div>
    </div>
  );
}

const s = {
  page:      { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0a0d14', padding:20 },
  card:      { background:'#111520', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'36px 32px', width:'100%', maxWidth:400 },
  logo:      { fontSize:24, fontWeight:700, background:'linear-gradient(135deg,#4f7cff,#7c5cfc)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', marginBottom:4 },
  sub:       { color:'#7a7f94', fontSize:13, marginBottom:28 },
  label:     { display:'block', fontSize:12, color:'#7a7f94', marginBottom:6, marginTop:16, fontWeight:500 },
  input:     { width:'100%', background:'#161c2d', border:'1px solid rgba(255,255,255,0.1)', borderRadius:7, padding:'9px 12px', color:'#e8eaf0', fontSize:13, outline:'none', boxSizing:'border-box' },
  error:     { background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', color:'#f87171', borderRadius:7, padding:'8px 12px', fontSize:13, marginTop:14 },
  btn:       { width:'100%', background:'#4f7cff', color:'#fff', border:'none', borderRadius:7, padding:'10px', fontSize:14, fontWeight:500, cursor:'pointer', marginTop:20 },
  demoBox:   { marginTop:24, padding:'14px 16px', background:'#0d1117', borderRadius:8, border:'1px solid rgba(255,255,255,0.06)' },
  demoTitle: { fontSize:12, color:'#7a7f94', marginBottom:8, fontWeight:500 },
  demoBtn:   { display:'block', width:'100%', background:'transparent', border:'1px solid rgba(255,255,255,0.08)', borderRadius:6, padding:'6px 10px', color:'#a0a8c0', fontSize:12, cursor:'pointer', marginBottom:5, textAlign:'left' },
};
