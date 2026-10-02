import React, { useState } from 'react';


const UTENTI = [
  { id: 'adm', password: 'adm', nome: 'Amministratore' }
];

export default function Login({ onLogin }) {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [errore, setErrore] = useState('');

  function accedi() {
    const utente = UTENTI.find(u => u.id === id.trim().toLowerCase() && u.password === password);
    if (!utente) {
      setErrore('ID o password non corretti.');
      return;
    }
    setErrore('');
    onLogin(utente);
  }

  return (
    <div style={{
      background: '#101216',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        width: 'min(380px, 94vw)',
        background: '#181b20',
        border: '1px solid #30343b',
        borderRadius: 10,
        padding: '40px 36px',
        boxSizing: 'border-box'
      }}>
        {/* LOGO */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
  width: 52, height: 52, borderRadius: 10,
  background: '#e5e7eb', color: '#111318',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  fontWeight: 800, fontSize: 22, marginBottom: 14
}}>GF</div>


          <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: 2 }}>MEMENTO</div>
          <div style={{ fontSize: 11, color: '#B06700', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>CSM</div>
        </div>

        {/* FORM */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 6, color: '#969da6', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>ID Utente</label>
          <input
            style={{ width: '100%', background: '#0f1216', color: '#fff', border: '1px solid #3a414b', borderRadius: 5, padding: '10px 12px', fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }}
            type="text"
            placeholder="Inserisci il tuo ID..."
            value={id}
            onChange={e => setId(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') accedi(); }}
            autoFocus
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', marginBottom: 6, color: '#969da6', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Password</label>
          <input
            style={{ width: '100%', background: '#0f1216', color: '#fff', border: '1px solid #3a414b', borderRadius: 5, padding: '10px 12px', fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }}
            type="password"
            placeholder="Inserisci la password..."
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') accedi(); }}
          />
        </div>

        {errore && (
          <div style={{ marginBottom: 16, padding: '9px 12px', background: '#2d1f1f', border: '1px solid #c0392b', borderRadius: 5, color: '#f87171', fontSize: 12 }}>
            {errore}
          </div>
        )}

        <button
          onClick={accedi}
          style={{
            width: '100%', padding: '11px', borderRadius: 5, fontSize: 13, fontWeight: 700,
            border: '1px solid #1a6ae0', background: '#2d7ff9', color: '#fff',
            cursor: 'pointer', fontFamily: 'inherit', letterSpacing: 0.5,
            transition: 'background 0.15s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#1a6ae0'}
          onMouseLeave={e => e.currentTarget.style.background = '#2d7ff9'}
        >
          Accedi
        </button>

        <div style={{ marginTop: 20, textAlign: 'center', color: '#3a3f47', fontSize: 10 }}>
          MEMENTO © 2026 — Gestione Flotta
        </div>
      </div>
    </div>
  );
}
