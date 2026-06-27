import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const ROLE_COLORS = { admin: '#4f7cff', manager: '#f59e0b', viewer: '#22c55e' };

export default function RBAC() {
  const { user, isAdmin } = useAuth();
  const [matrix, setMatrix] = useState(null);
  const [myPerms, setMyPerms] = useState(null);
  const [selected, setSelected] = useState('admin');

  useEffect(() => {
    api.get('/rbac/my-permissions').then(r => setMyPerms(r.data));
    if (isAdmin) api.get('/rbac/matrix').then(r => setMatrix(r.data.matrix));
  }, [isAdmin]);

  const displayMatrix = matrix || (myPerms ? { [user?.role]: myPerms.permissions } : null);
  const roles = Object.keys(displayMatrix || {});

  return (
    <div style={s.page}>
      <h1 style={s.title}>Roles & Permissions</h1>
      <p style={s.sub}>
        {isAdmin ? 'Full RBAC matrix — admin view' : `Showing permissions for your role: ${user?.role}`}
      </p>

      {displayMatrix && (
        <div style={s.layout}>
          <div style={s.roleList}>
            <div style={s.listTitle}>Roles</div>
            {roles.map(role => (
              <div key={role} style={{...s.roleItem, ...(selected===role ? s.roleItemActive : {})}} onClick={() => setSelected(role)}>
                <div style={{...s.roleDot, background:ROLE_COLORS[role]}} />
                <span style={{textTransform:'capitalize'}}>{role}</span>
              </div>
            ))}
          </div>

          <div>
            <div style={s.listTitle}>Permissions — <span style={{color:ROLE_COLORS[selected]}}>{selected}</span></div>
            <div style={s.permGrid}>
              {Object.entries(displayMatrix[selected] || {}).map(([resource, actions]) => (
                <div key={resource} style={s.permCard}>
                  <div style={s.permTitle}>{resource.charAt(0).toUpperCase()+resource.slice(1)}</div>
                  {['read','write','delete'].map(action => (
                    <div key={action} style={s.permRow}>
                      <span style={{fontSize:12,color:'#7a7f94',textTransform:'capitalize'}}>{action}</span>
                      <div style={{...s.toggle, background: actions.includes(action) ? '#4f7cff' : '#2a2f45'}}>
                        <div style={{...s.toggleThumb, left: actions.includes(action) ? 14 : 2}} />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {!isAdmin && (
              <div style={s.note}>
                ⓘ You're viewing your own permissions. Admins can see and edit the full matrix.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page:          { padding:'28px 32px' },
  title:         { fontSize:20, fontWeight:600, color:'#e8eaf0', marginBottom:4 },
  sub:           { fontSize:13, color:'#7a7f94', marginBottom:24 },
  layout:        { display:'grid', gridTemplateColumns:'180px 1fr', gap:20 },
  roleList:      { display:'flex', flexDirection:'column', gap:6 },
  listTitle:     { fontSize:11, fontWeight:600, color:'#7a7f94', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:10 },
  roleItem:      { display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:8, cursor:'pointer', border:'1px solid rgba(255,255,255,0.07)', transition:'all .15s' },
  roleItemActive:{ border:'1px solid #4f7cff', background:'rgba(79,124,255,0.08)' },
  roleDot:       { width:8, height:8, borderRadius:'50%', flexShrink:0 },
  permGrid:      { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 },
  permCard:      { background:'#111520', border:'1px solid rgba(255,255,255,0.07)', borderRadius:8, padding:'12px 14px' },
  permTitle:     { fontSize:13, fontWeight:600, color:'#e8eaf0', marginBottom:12 },
  permRow:       { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 },
  toggle:        { width:28, height:16, borderRadius:8, position:'relative', transition:'background .2s', flexShrink:0 },
  toggleThumb:   { position:'absolute', width:12, height:12, background:'#fff', borderRadius:'50%', top:2, transition:'left .2s' },
  note:          { marginTop:14, fontSize:12, color:'#7a7f94', background:'#111520', border:'1px solid rgba(255,255,255,0.06)', borderRadius:8, padding:'10px 14px' },
};
