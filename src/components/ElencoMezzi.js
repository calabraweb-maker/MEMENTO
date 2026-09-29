import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

const COLORI_STATO = {
  'BUONO': '#4ade80', 'MEDIO': '#228b22', 'BASSO': '#ff8c00',
  'CRITICO': '#ff0000', 'IN_OFFICINA': '#f59e0b',
  'NOLEGGIO': '#00ffff', 'USOFRUTTO': '#ff00ff',
  'FERMO': '#8f969f', 'DA ROTTAMARE': '#ff0000'
};

export default function ElencoMezzi({ onTorna, onApriScheda }) {
  const [mezzi, setMezzi] = useState([]);
  const [centri, setCentri] = useState([]);
  const [officine, setOfficine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cerca, setCerca] = useState('');
  const [filtroStato, setFiltroStato] = useState('');
  const [filtroColonna, setFiltroColonna] = useState('');
  const [ordinamento, setOrdinamento] = useState('targa');

  useEffect(() => { caricaDati(); }, []);

  async function caricaDati() {
    setLoading(true);
    const [{ data: m }, { data: c }, { data: o }] = await Promise.all([
      supabase.from('mezzi').select('*').order('targa'),
      supabase.from('centri_costo').select('*').eq('attivo', true).order('ordine'),
      supabase.from('officine').select('*').eq('attiva', true).order('ordine')
    ]);
    setMezzi(m || []);
    setCentri(c || []);
    setOfficine(o || []);
    setLoading(false);
  }

  function nomeColonna(id) {
    const c = centri.find(x => x.id === id);
    if (c) return c.titolo;
    const o = officine.find(x => x.id === id);
    if (o) return o.titolo;
    return id || '-';
  }

  const tutteLeColonne = [
    ...centri.map(c => ({ id: c.id, titolo: c.titolo })),
    ...officine.map(o => ({ id: o.id, titolo: o.titolo }))
  ];

  const mezziFiltrati = mezzi
    .filter(m => {
      const q = cerca.toLowerCase();
      if (q && !(
        (m.targa || '').toLowerCase().includes(q) ||
        (m.marca || '').toLowerCase().includes(q) ||
        (m.proprietario || '').toLowerCase().includes(q) ||
        (m.telaio || '').toLowerCase().includes(q) ||
        (m.cdc || '').toLowerCase().includes(q)
      )) return false;
      if (filtroStato && m.stato !== filtroStato) return false;
      if (filtroColonna && m.id_colonna !== filtroColonna) return false;
      return true;
    })
    .sort((a, b) => {
      if (ordinamento === 'targa') return (a.targa || '').localeCompare(b.targa || '');
      if (ordinamento === 'marca') return (a.marca || '').localeCompare(b.marca || '');
      if (ordinamento === 'stato') return (a.stato || '').localeCompare(b.stato || '');
      if (ordinamento === 'colonna') return nomeColonna(a.id_colonna).localeCompare(nomeColonna(b.id_colonna));
      return 0;
    });

  const stileInput = { background: '#12151a', color: '#fff', border: '1px solid #3b414a', borderRadius: 5, padding: '8px 12px', fontSize: 12, fontFamily: 'inherit', outline: 'none' };
  const stileBtn = { padding: '6px 11px', border: '1px solid #1a6ae0', borderRadius: 5, background: '#2d7ff9', color: '#fff', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' };

  return (
    <div style={{ background: '#101216', minHeight: '100vh', color: '#e8eaed', fontFamily: 'Arial, sans-serif' }}>

      {/* HEADER */}
      <header style={{ height: 76, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: '#181b20', borderBottom: '1px solid #30343b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 8, background: '#e5e7eb', color: '#111318', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 20 }}>GF</div>
          <div>
            <h1 style={{ fontSize: 20, letterSpacing: 1.5, color: '#fff', margin: 0 }}>ELENCO MEZZI</h1>
            <span style={{ fontSize: 11, color: '#B06700', textTransform: 'uppercase', letterSpacing: 1 }}>
              {loading ? '...' : `${mezziFiltrati.length} di ${mezzi.length} mezzi`}
            </span>
          </div>
        </div>
        <button style={stileBtn} onClick={onTorna}>← Gestione Flotta</button>
      </header>

      {/* FILTRI */}
      <div style={{ padding: '14px 24px', background: '#181b20', borderBottom: '1px solid #30343b', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          style={{ ...stileInput, width: 260 }}
          placeholder="🔍  Cerca targa, marca, telaio, proprietario..."
          value={cerca}
          onChange={e => setCerca(e.target.value)}
          autoFocus
        />
        <select style={stileInput} value={filtroStato} onChange={e => setFiltroStato(e.target.value)}>
          <option value="">Tutti gli stati</option>
          {['BUONO','MEDIO','BASSO','CRITICO','IN_OFFICINA','NOLEGGIO','USOFRUTTO','FERMO','DA ROTTAMARE'].map(s => (
            <option key={s} value={s}>{s === 'IN_OFFICINA' ? 'IN OFFICINA' : s}</option>
          ))}
        </select>
        <select style={stileInput} value={filtroColonna} onChange={e => setFiltroColonna(e.target.value)}>
          <option value="">Tutte le colonne</option>
          {tutteLeColonne.map(c => <option key={c.id} value={c.id}>{c.titolo}</option>)}
        </select>
        <select style={stileInput} value={ordinamento} onChange={e => setOrdinamento(e.target.value)}>
          <option value="targa">Ordina per targa</option>
          <option value="marca">Ordina per marca</option>
          <option value="stato">Ordina per stato</option>
          <option value="colonna">Ordina per colonna</option>
        </select>
        {(cerca || filtroStato || filtroColonna) && (
          <button onClick={() => { setCerca(''); setFiltroStato(''); setFiltroColonna(''); }}
            style={{ ...stileInput, cursor: 'pointer', color: '#f87171', borderColor: '#c0392b', background: 'transparent' }}>
            ✕ Reset
          </button>
        )}
      </div>

      {/* TABELLA */}
      <div style={{ padding: '14px 24px', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#656b74' }}>Caricamento...</div>
        ) : mezziFiltrati.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#656b74' }}>Nessun mezzo trovato.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#20242a' }}>
                {['TARGA','MARCA','PROPRIETARIO','COLONNA','STATO','KM','ALIMENTAZIONE'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#8b919a', fontSize: 10, letterSpacing: 0.7, fontWeight: 700, borderBottom: '1px solid #343941', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mezziFiltrati.map((mezzo, i) => (
                <tr
                  key={mezzo.id}
                  onClick={() => onApriScheda(mezzo.id)}
                  style={{ background: i % 2 === 0 ? '#191c21' : '#1c2025', cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#252930'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#191c21' : '#1c2025'}
                >
                  <td style={{ padding: '10px 12px', color: '#fff', fontWeight: 800, letterSpacing: 1, borderBottom: '1px solid #252930' }}>{mezzo.targa}</td>
                  <td style={{ padding: '10px 12px', color: '#c3c7cc', borderBottom: '1px solid #252930' }}>{mezzo.marca || '-'}</td>
                  <td style={{ padding: '10px 12px', color: '#c3c7cc', borderBottom: '1px solid #252930' }}>{mezzo.proprietario || '-'}</td>
                  <td style={{ padding: '10px 12px', color: '#aeb3bb', borderBottom: '1px solid #252930' }}>{nomeColonna(mezzo.id_colonna)}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #252930' }}>
                    <span style={{ color: COLORI_STATO[mezzo.stato] || '#8f969f', fontWeight: 700, fontSize: 10, textTransform: 'uppercase' }}>
                      {mezzo.stato === 'IN_OFFICINA' ? 'IN OFFICINA' : mezzo.stato || '-'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', color: '#c3c7cc', borderBottom: '1px solid #252930' }}>{mezzo.km_attuali ? mezzo.km_attuali.toLocaleString('it-IT') : '-'}</td>
                  <td style={{ padding: '10px 12px', color: '#c3c7cc', borderBottom: '1px solid #252930' }}>{mezzo.alimentazione || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
