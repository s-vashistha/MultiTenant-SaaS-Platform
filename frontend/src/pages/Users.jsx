import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const ROLE_COLORS = { admin: '#4f7cff', manager: '#f59e0b', viewer: '#22c55e' };

export default function Users() {
  const { can, user: me } = useAuth();
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name:'', email:'', role:'viewer', department:'' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/users').then(r => setUsers(r.data.users)).catch(() => setError('Failed to load users')).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/users', form);
      setShowForm(false);
      setForm({ name:'', email:'', role:'viewer', department:'' });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user');
    } finally { setSaving(false); }
  };

  const toggleActive = async (u) => {
    try {
      await api.patch(`/users/${u.id}`, { is_active: !u.is_active });
      load();
    } catch (err) { setError(err.response?.data?.error || 'Update failed'); }
  };

  const deleteUser = async (u) => {
    if (!window.confirm(`Delete ${u.name}?`)) return;
    try {
      await api.delete(`/users/${u.id}`);
      load();
    } catch (err) { setError(err.response?.data?.error || 'Delete failed'); }
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Users</h1>
          <p style={s.sub}>{users.length} members · all data isolated to your tenant schema</p>
        </div>
        {can('users','write') && (
          <button style={s.btn} onClick={() => setShowForm(v => !v)}>
            {showForm ? 'Cancel' : '+ Invite user'}
          </button>
        )}
      </div>

      {error && <div style={s.error}>{error}<button style={s.errClose} onClick={() => setError('')}>✕</button></div>}

      {showForm && (
        <div style={s.formCard}>
          <div style={s.cardTitle}>New user</div>
          <form onSubmit={handleCreate} style={s.formGrid}>
            <div><label style={s.label}>Full name</label><input style={s.input} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required /></div>
            <div><label style={s.label}>Email</label><input style={s.input} type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} required /></div>
            <div>
              <label style={s.label}>Role</label>
              <select style={s.input} value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}>
                {me?.role === 'admin' && <option value="admin">Admin</option>}
                <option value="manager">Manager</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <div><label style={s.label}>Department</label><input style={s.input} value={form.department} onChange={e=>setForm(f=>({...f,department:e.target.value}))} /></div>
            <div style={{gridColumn:'1/-1'}}>
              <button style={s.btn} type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create user'}</button>
            </div>
          </form>
        </div>
      )}

      <div style={s.card}>
        {loading ? <div style={s.loadingMsg}>Loading users…</div> : (
          <table style={s.table}>
            <thead>
              <tr>{['Name','Email','Role','Department','Status','Actions'].map(h=><th key={h} style={s.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={s.tr}>
                  <td style={s.td}>
                    <div style={{display:'flex',alignItems:'center',gap:9}}>
                      <div style={{...s.avatar, background:`${ROLE_COLORS[u.role]}22`,color:ROLE_COLORS[u.role]}}>
                        {u.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                      </div>
                      {u.name} {u.id === me?.id && <span style={s.youBadge}>you</span>}
                    </div>
                  </td>
                  <td style={{...s.td,color:'#7a7f94'}}>{u.email}</td>
                  <td style={s.td}><span style={{...s.roleBadge,background:`${ROLE_COLORS[u.role]}18`,color:ROLE_COLORS[u.role]}}>{u.role}</span></td>
                  <td style={s.td}>{u.department || '—'}</td>
                  <td style={s.td}>
                    <span style={{fontSize:12}}>
                      <span style={{width:6,height:6,borderRadius:'50%',background:u.is_active?'#22c55e':'#3a3f55',display:'inline-block',marginRight:6}} />
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={s.td}>
                    {can('users','write') && u.id !== me?.id && (
                      <button style={s.actionBtn} onClick={() => toggleActive(u)}>
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                    {can('users','delete') && u.id !== me?.id && (
                      <button style={{...s.actionBtn, color:'#ef4444', borderColor:'rgba(239,68,68,0.3)', marginLeft:6}} onClick={() => deleteUser(u)}>
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const s = {
  page:       { padding:'28px 32px' },
  header:     { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 },
  title:      { fontSize:20, fontWeight:600, color:'#e8eaf0' },
  sub:        { fontSize:13, color:'#7a7f94', marginTop:4 },
  btn:        { background:'#4f7cff', color:'#fff', border:'none', borderRadius:7, padding:'8px 16px', fontSize:13, fontWeight:500, cursor:'pointer' },
  card:       { background:'#111520', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, overflow:'hidden' },
  formCard:   { background:'#111520', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'18px 20px', marginBottom:16 },
  cardTitle:  { fontSize:14, fontWeight:600, color:'#e8eaf0', marginBottom:14 },
  formGrid:   { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 },
  label:      { display:'block', fontSize:12, color:'#7a7f94', marginBottom:5 },
  input:      { width:'100%', background:'#0d1117', border:'1px solid rgba(255,255,255,0.08)', borderRadius:6, padding:'8px 10px', color:'#e8eaf0', fontSize:13, boxSizing:'border-box' },
  error:      { background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', color:'#f87171', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:16, display:'flex', justifyContent:'space-between' },
  errClose:   { background:'none', border:'none', color:'#f87171', cursor:'pointer' },
  loadingMsg: { padding:24, textAlign:'center', color:'#7a7f94' },
  table:      { width:'100%', borderCollapse:'collapse' },
  th:         { textAlign:'left', fontSize:11, color:'#7a7f94', fontWeight:500, padding:'10px 14px', borderBottom:'1px solid rgba(255,255,255,0.06)', textTransform:'uppercase', letterSpacing:'0.05em' },
  tr:         { transition:'background .1s' },
  td:         { padding:'11px 14px', fontSize:13, borderBottom:'1px solid rgba(255,255,255,0.04)', color:'#e8eaf0' },
  avatar:     { width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:600, flexShrink:0 },
  youBadge:   { fontSize:10, background:'rgba(79,124,255,0.15)', color:'#7ca4ff', borderRadius:10, padding:'1px 6px' },
  roleBadge:  { fontSize:11, fontWeight:500, padding:'3px 9px', borderRadius:20 },
  actionBtn:  { background:'transparent', color:'#7a7f94', border:'1px solid rgba(255,255,255,0.1)', borderRadius:5, padding:'4px 10px', fontSize:12, cursor:'pointer' },
};
