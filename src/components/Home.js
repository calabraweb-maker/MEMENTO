import React, { useRef, useState, useEffect } from 'react';


const MENU_VOCI = [
  { id: 'gestione_flotta', icona: '▶', titolo: 'Gestione Flotta', gruppo: 'REPARTI' },
  { id: 'scadenzario',     icona: '▶', titolo: 'Scadenzario',     gruppo: 'REPARTI' },
  { id: 'elenco',          icona: '▶', titolo: 'Elenco mezzi',    gruppo: 'REPARTI' },
];

export default function Home({ utente, onLogout, onVaiA, notifiche }) {
  const [menuAperto, setMenuAperto] = useState(false);
  const [pannelloNotifiche, setPannelloNotifiche] = useState(false);
  const menuRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuAperto(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setPannelloNotifiche(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const gruppi = [...new Set(MENU_VOCI.map(v => v.gruppo))];

  return (
    <div style={{ background: '#101216', height: '100vh', color: '#e8eaed', fontFamily: 'Arial, sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* HEADER */}
      <header style={{ height: 62, minHeight: 62, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', background: '#181b20', borderBottom: '1px solid #30343b', zIndex: 100, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

          {/* MENU HAMBURGER */}
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button onClick={() => setMenuAperto(!menuAperto)}
              style={{ width: 32, height: 32, border: '1px solid #343941', borderRadius: 5, background: menuAperto ? '#2a2f36' : 'transparent', color: '#aeb3bb', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
              <span style={{ width: 14, height: 2, background: '#aeb3bb', borderRadius: 2, display: 'block' }} />
              <span style={{ width: 14, height: 2, background: '#aeb3bb', borderRadius: 2, display: 'block' }} />
              <span style={{ width: 14, height: 2, background: '#aeb3bb', borderRadius: 2, display: 'block' }} />
            </button>
            {menuAperto && (
              <div style={{ position: 'absolute', top: 40, left: 0, width: 240, background: '#13161b', border: '1px solid #252930', borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 9999, overflow: 'hidden' }}>
                {gruppi.map((gruppo, gi) => (
                  <div key={gruppo}>
                    {gi > 0 && <div style={{ height: 1, background: '#1e2229', margin: '4px 0' }} />}
                    <div style={{ padding: '7px 14px 3px', color: '#3a3f47', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 }}>{gruppo}</div>
                    {MENU_VOCI.filter(v => v.gruppo === gruppo).map(voce => (
                      <button key={voce.id} onClick={() => { setMenuAperto(false); onVaiA(voce.id); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 14px', border: 'none', background: 'transparent', color: '#8b919a', fontSize: 12, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'background 0.15s, color 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#1e2229'; e.currentTarget.style.color = '#e8eaed'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8b919a'; }}>
                        <span style={{ fontSize: 9, color: '#B06700' }}>{voce.icona}</span>
                        <span>{voce.titolo}</span>
                      </button>
                    ))}
                  </div>
                ))}
                <div style={{ height: 1, background: '#1e2229', margin: '4px 0' }} />
                <button onClick={onLogout}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 14px', border: 'none', background: 'transparent', color: '#f87171', fontSize: 12, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#1e2229'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <span style={{ fontSize: 9 }}>▶</span>
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>

          <div style={{ width: 36, height: 36, borderRadius: 7, background: '#e5e7eb', color: '#111318', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16 }}>GF</div>
          <div>
            <div style={{ fontSize: 17, letterSpacing: 1.5, color: '#fff', fontWeight: 700, lineHeight: 1 }}>MEMENTO</div>
            <div style={{ fontSize: 10, color: '#B06700', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>Home</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* CAMPANELLA */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button onClick={() => setPannelloNotifiche(!pannelloNotifiche)}
              style={{ width: 32, height: 32, border: `1px solid ${notifiche && notifiche.length > 0 ? '#f59e0b' : '#343941'}`, borderRadius: 5, background: '#101216', color: notifiche && notifiche.length > 0 ? '#f59e0b' : '#656b74', cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              🔔
              {notifiche && notifiche.length > 0 && (
                <span style={{ position: 'absolute', top: 3, right: 3, width: 13, height: 13, background: '#f59e0b', border: '1px solid #101216', borderRadius: '50%', fontSize: 8, fontWeight: 700, color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {notifiche.length > 9 ? '9+' : notifiche.length}
                </span>
              )}
            </button>
            {pannelloNotifiche && (
              <div style={{ position: 'absolute', top: 40, right: 0, width: 300, background: '#13161b', border: '1px solid #252930', borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 9999, overflow: 'hidden' }}>
                <div style={{ padding: '10px 14px', borderBottom: '1px solid #1e2229', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>Notifiche scadenze</span>
                  <button onClick={() => { setPannelloNotifiche(false); onVaiA('scadenzario'); }} style={{ background: 'transparent', border: 'none', color: '#2d7ff9', fontSize: 10, cursor: 'pointer' }}>Vedi tutte →</button>
                </div>
                {!notifiche || notifiche.length === 0 ? (
                  <div style={{ padding: 16, textAlign: 'center', color: '#656b74', fontSize: 11 }}>Nessuna notifica</div>
                ) : (
                  notifiche.slice(0, 8).map(n => {
                    const scad = n.data_scadenza ? new Date(n.data_scadenza) : null;
                    const oggi = new Date(); oggi.setHours(0, 0, 0, 0);
                    const scaduta = scad && scad < oggi;
                    return (
                      <div key={n.id} style={{ padding: '9px 14px', borderBottom: '1px solid #1e2229', cursor: 'pointer' }}
                        onClick={() => { setPannelloNotifiche(false); onVaiA('scadenzario'); }}
                        onMouseEnter={e => e.currentTarget.style.background = '#1e2229'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <div style={{ color: scaduta ? '#ff0000' : '#f59e0b', fontSize: 9, fontWeight: 700, textTransform: 'uppercase' }}>{scaduta ? '🔴 Scaduta' : '🟠 In scadenza'}</div>
                        <div style={{ color: '#fff', fontSize: 11, fontWeight: 600, marginTop: 2 }}>{n.cod_univoco || '-'} — {n.tipo_titolo || 'Scadenza'}</div>
                        <div style={{ color: '#656b74', fontSize: 10, marginTop: 1 }}>Scade: {scad ? scad.toLocaleDateString('it-IT') : '-'}</div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* UTENTE */}
          <div style={{ padding: '5px 10px', background: '#20242a', border: '1px solid #343941', borderRadius: 5, fontSize: 11, color: '#aeb3bb' }}>
            👤 {utente?.nome || 'Utente'}
          </div>
        </div>
      </header>

      {/* CORPO HOME — vuoto, pronto per i moduli */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#2a2f36' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏠</div>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>Home</div>
          <div style={{ fontSize: 11, marginTop: 6, color: '#1e2229' }}>I moduli verranno aggiunti qui</div>
        </div>
      </div>

    </div>
  );
}
