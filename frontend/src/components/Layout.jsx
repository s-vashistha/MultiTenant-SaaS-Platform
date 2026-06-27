import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';   // ← ADD

const NAV = [
  { to: '/dashboard', icon: '⬛', label: 'Dashboard' },
  { to: '/users',     icon: '👥', label: 'Users'     },
  { to: '/rbac',      icon: '🔐', label: 'Roles & Permissions' },
];

const ROLE_COLORS = { admin: '#4f7cff', manager: '#f59e0b', viewer: '#22c55e' };

export default function Layout() {
  const { user, tenant, logout } = useAuth();
  const { themeKey, setThemeKey, themes } = useTheme();   // ← ADD
  const navigate = useNavigate();

  const handleLogout = async () => { await logout(); navigate('/login'); };

  return (
    <div style={s.app}>
      {/* Topbar */}
      <header style={s.topbar}>
        <span style={s.logo}>NexaCore</span>
        <div style={s.divider} />
        <div style={s.tenantChip}>
          <div style={{...s.tenantDot, background: ROLE_COLORS[user?.role] || '#4f7cff'}} />
          <span style={s.tenantName}>{tenant?.name}</span>
          <span style={s.tenantPlan}>{tenant?.plan}</span>
        </div>

        {/* ── Theme switcher ── */}
        <div style={s.themeSwitcher}>
          {Object.entries(themes).map(([key, t]) => (
            <button
              key={key}
              title={t.name}
              onClick={() => setThemeKey(key)}
              style={{
                ...s.themeBtn,
                ...(themeKey === key ? s.themeBtnActive : {}),
              }}
            >
              {t.icon}
            </button>
          ))}
        </div>

        <div style={s.topRight}>
          <span style={{...s.roleBadge, background:`${ROLE_COLORS[user?.role]}18`, color:ROLE_COLORS[user?.role], border:`1px solid ${ROLE_COLORS[user?.role]}40`}}>
            {user?.role}
          </span>
          <div style={s.avatar}>{user?.name?.split(' ').map(n=>n[0]).join('').slice(0,2)}</div>
          <button style={s.logoutBtn} onClick={handleLogout}>Sign out</button>
        </div>
      </header>

      {/* Sidebar */}
      <aside style={s.sidebar}>
        <div style={s.navSection}>Main</div>
        {NAV.map(n => (
          <NavLink key={n.to} to={n.to} style={({ isActive }) => ({...s.navItem, ...(isActive ? s.navItemActive : {})})}>
            <span style={s.navIcon}>{n.icon}</span>
            {n.label}
          </NavLink>
        ))}
        <div style={s.schemaBox}>
          <div style={s.schemaLabel}>DB Schema</div>
          <code style={s.schemaVal}>tenant_{tenant?.slug}</code>
        </div>
      </aside>

      {/* Main */}
      <main style={s.main}>
        <Outlet />
      </main>
    </div>
  );
}

const s = {
  app:            { display:'grid', gridTemplateRows:'52px 1fr', gridTemplateColumns:'220px 1fr', height:'100vh', background:'var(--bg)', fontFamily:'Inter,system-ui,sans-serif' },
  topbar:         { gridColumn:'1/-1', display:'flex', alignItems:'center', padding:'0 20px', gap:14, background:'var(--surface)', borderBottom:'1px solid var(--border)' },
  logo:           { fontSize:17, fontWeight:700, background:'linear-gradient(135deg,#4f7cff,#7c5cfc)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' },
  divider:        { width:1, height:20, background:'var(--border2)', margin:'0 4px' },
  tenantChip:     { display:'flex', alignItems:'center', gap:8, background:'var(--surface2)', border:'1px solid var(--border2)', borderRadius:8, padding:'5px 12px' },
  tenantDot:      { width:8, height:8, borderRadius:'50%' },
  tenantName:     { fontSize:13, fontWeight:500, color:'var(--text)' },
  tenantPlan:     { fontSize:11, color:'var(--muted)', marginLeft:4 },
  themeSwitcher:  { display:'flex', alignItems:'center', gap:4, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, padding:'3px 5px' },
  themeBtn:       { background:'transparent', border:'none', borderRadius:6, padding:'4px 7px', fontSize:14, cursor:'pointer', opacity:0.5, transition:'all .15s' },
  themeBtnActive: { background:'var(--dim)', opacity:1 },
  topRight:       { marginLeft:'auto', display:'flex', alignItems:'center', gap:10 },
  roleBadge:      { fontSize:11, fontWeight:500, padding:'3px 10px', borderRadius:20 },
  avatar:         { width:30, height:30, borderRadius:'50%', background:'linear-gradient(135deg,#4f7cff,#7c5cfc)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:600, color:'#fff' },
  logoutBtn:      { background:'transparent', border:'1px solid var(--border2)', borderRadius:6, padding:'5px 12px', color:'var(--muted)', fontSize:12, cursor:'pointer' },
  sidebar:        { background:'var(--surface)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', padding:'12px 8px', overflowY:'auto' },
  navSection:     { fontSize:10, fontWeight:600, color:'var(--muted)', letterSpacing:'.08em', textTransform:'uppercase', padding:'14px 14px 6px' },
  navItem:        { display:'flex', alignItems:'center', gap:10, padding:'8px 14px', margin:'1px 0', borderRadius:6, cursor:'pointer', fontSize:13, color:'var(--muted)', textDecoration:'none', transition:'all .15s' },
  navItemActive:  { background:'rgba(79,124,255,0.12)', color:'#4f7cff', fontWeight:500 },
  navIcon:        { fontSize:14, width:18, textAlign:'center' },
  schemaBox:      { marginTop:'auto', padding:'14px', borderTop:'1px solid var(--border)' },
  schemaLabel:    { fontSize:10, color:'var(--muted)', marginBottom:3 },
  schemaVal:      { fontSize:11, color:'#4f7cff' },
  main:           { overflowY:'auto', background:'var(--bg)' },
};