import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function Dashboard() {
  const { user, tenant } = useAuth();
  const [summary,  setSummary]  = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/summary'),
      api.get('/analytics/activity?limit=8'),
    ]).then(([s, a]) => {
      setSummary(s.data);
      setActivity(a.data.activity);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={s.loading}>Loading dashboard…</div>;

  const rd = summary?.roleDistribution || {};

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>{tenant?.name} — Dashboard</h1>
          <p style={s.sub}>Welcome back, {user?.name} · <span style={s.role}>{user?.role}</span></p>
        </div>
        <div style={s.schemaBadge}>
          <span style={s.schemaLabel}>DB Schema</span>
          <code style={s.schemaVal}>tenant_{tenant?.slug}</code>
        </div>
      </div>

      {/* Metrics */}
      <div style={s.metrics}>
        {[
          { label: 'Total Users',    value: summary?.totalUsers,    change: `${summary?.activeUsers} active` },
          { label: 'Active Users',   value: summary?.activeUsers,   change: '↑ verified' },
          { label: 'Weekly Actions', value: summary?.weeklyActions, change: 'last 7 days' },
          { label: 'Plan',           value: tenant?.plan,           change: 'current tier' },
        ].map(m => (
          <div key={m.label} style={s.metricCard}>
            <div style={s.metricLabel}>{m.label}</div>
            <div style={s.metricValue}>{m.value ?? '—'}</div>
            <div style={s.metricChange}>{m.change}</div>
          </div>
        ))}
      </div>

      <div style={s.grid}>
        {/* Role distribution */}
        <div style={s.card}>
          <div style={s.cardTitle}>Role Distribution</div>
          {Object.entries(rd).map(([role, count]) => (
            <div key={role} style={{marginBottom:14}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:4}}>
                <span style={{textTransform:'capitalize'}}>{role}</span>
                <span style={{color:'#7a7f94'}}>{count} users</span>
              </div>
              <div style={{height:4,background:'#1e2438',borderRadius:2}}>
                <div style={{height:'100%',borderRadius:2,background:role==='admin'?'#4f7cff':role==='manager'?'#f59e0b':'#22c55e',width:`${Math.round(count/(summary?.totalUsers||1)*100)}%`}} />
              </div>
            </div>
          ))}
        </div>

        {/* Activity feed */}
        <div style={s.card}>
          <div style={s.cardTitle}>Recent Activity</div>
          {activity.length === 0 && <p style={{color:'#7a7f94',fontSize:13}}>No activity yet</p>}
          {activity.map(a => (
            <div key={a.id} style={s.activityItem}>
              <div style={s.activityDot} />
              <div>
                <div style={{fontSize:13}}><strong>{a.user_name || 'System'}</strong> · {a.action.replace(/_/g,' ')}</div>
                <div style={{fontSize:11,color:'#7a7f94'}}>{new Date(a.created_at).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tenant info */}
        <div style={s.card}>
          <div style={s.cardTitle}>Tenant Info</div>
          {[
            ['Name',    tenant?.name],
            ['Plan',    tenant?.plan],
            ['Schema',  `tenant_${tenant?.slug}`],
            ['Your Role', user?.role],
            ['Department', user?.department || '—'],
          ].map(([k,v]) => (
            <div key={k} style={s.infoRow}>
              <span style={{color:'#7a7f94',fontSize:12}}>{k}</span>
              <span style={{fontSize:13,fontFamily:k==='Schema'?'monospace':'inherit',color:k==='Schema'?'#4f7cff':'#e8eaf0'}}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const s = {
  page:         { padding:'28px 32px' },
  loading:      { padding:40, color:'#7a7f94', textAlign:'center' },
  header:       { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 },
  title:        { fontSize:20, fontWeight:600, letterSpacing:'-0.3px', color:'#e8eaf0' },
  sub:          { fontSize:13, color:'#7a7f94', marginTop:4 },
  role:         { color:'#4f7cff', textTransform:'capitalize' },
  schemaBadge:  { background:'#111520', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'8px 14px', textAlign:'right' },
  schemaLabel:  { display:'block', fontSize:10, color:'#7a7f94', marginBottom:2 },
  schemaVal:    { fontSize:12, color:'#4f7cff' },
  metrics:      { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 },
  metricCard:   { background:'#111520', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'16px 18px' },
  metricLabel:  { fontSize:11, color:'#7a7f94', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 },
  metricValue:  { fontSize:26, fontWeight:700, color:'#e8eaf0', textTransform:'capitalize' },
  metricChange: { fontSize:11, color:'#7a7f94', marginTop:4 },
  grid:         { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 },
  card:         { background:'#111520', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'18px 20px' },
  cardTitle:    { fontSize:14, fontWeight:600, color:'#e8eaf0', marginBottom:16 },
  activityItem: { display:'flex', gap:10, alignItems:'flex-start', marginBottom:12 },
  activityDot:  { width:6, height:6, background:'#4f7cff', borderRadius:'50%', marginTop:5, flexShrink:0 },
  infoRow:      { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' },
};
