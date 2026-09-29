import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

const COLORI_STATO = {
  scaduta: '#ff0000',
  urgente: '#ff8c00',
  presto: '#f59e0b',
  ok: '#4ade80'
};

function statoScadenza(dataScadenza, dataAvviso) {
  const oggi = new Date();
  oggi.setHours(0, 0, 0, 0);
  const scad = dataScadenza ? new Date(dataScadenza) : null;
  const avv = dataAvviso ? new Date(dataAvviso) : null;
  if (!scad) return 'ok';
  if (scad < oggi) return 'scaduta';
  if (avv && avv <= oggi) return 'urgente';
  const diff = (scad - oggi) / (1000 * 60 * 60 * 24);
  if (diff <= 30) return 'presto';
  return 'ok';
}

function etichettaStato(stato) {
  if (stato === 'scaduta') return '🔴 SCADUTA';
  if (stato === 'urgente') return '🟠 URGENTE';
  if (stato === 'presto') return '🟡 IN SCADENZA';
  return '🟢 OK';
}

const stileBtnP = { padding: '9px 14px', borderRadius: 5, fontSize: 11, fontWeight: 600, border: '1px solid #686f79', background: '#e1e4e8', color: '#15181c', cursor: 'pointer', fontFamily: 'inherit' };
const stileBtnS = { padding: '9px 14px', borderRadius: 5, fontSize: 11, fontWeight: 600, border: '1px solid #3e444d', background: '#24282e', color: '#c6cad0', cursor: 'pointer', fontFamily: 'inherit' };
const stileInput = { width: '100%', background: '#0f1216', color: '#fff', border: '1px solid #3a414b', borderRadius: 4, padding: '8px 10px', fontSize: 11, boxSizing: 'border-box', fontFamily: 'inherit' };
const stileLabel = { display: 'block', marginBottom: 5, color: '#969da6', fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 };
const stileBtn = { padding: '6px 11px', border: '1px solid #1a6ae0', borderRadius: 5, background: '#2d7ff9', color: '#fff', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' };
const stileFiltro = { background: '#12151a', color: '#fff', border: '1px solid #3b414a', borderRadius: 5, padding: '8px 12px', fontSize: 12, fontFamily: 'inherit', outline: 'none' };

function InputData({ value, onChange }) {
  return (
    <input
      style={stileInput}
      type="date"
      value={value}
      min="1900-01-01"
      max="2099-12-31"
      onChange={e => {
        const val = e.target.value;
        if (val && val.split('-')[0].length > 4) return;
        onChange(val);
      }}
    />
  );
}

export default function Scadenzario({ onTorna }) {
  const [scadenze, setScadenze] = useState([]);
  const [tipi, setTipi] = useState([]);
  const [mezzi, setMezzi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modale, setModale] = useState(null);
  const [scadenzaSelezionata, setScadenzaSelezionata] = useState(null);
  const [cerca, setCerca] = useState('');
  const [filtroStato, setFiltroStato] = useState('');
  const [filtroDal, setFiltroDal] = useState('');
  const [filtroAl, setFiltroAl] = useState('');
  const [nuovoTipoTitolo, setNuovoTipoTitolo] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [dati, setDati] = useState({
    tipo_id: '', tipo_titolo: '', cod_univoco: '', id_mezzo: '',
    data_scadenza: '', data_avviso: '', note: ''
  });
  const [emailList, setEmailList] = useState([]);
  const [nuovaEmail, setNuovaEmail] = useState('');
  const [modalePrecedente, setModalePrecedente] = useState('nuova');

  useEffect(() => { caricaTutto(); }, []);

  async function caricaTutto() {
    setLoading(true);
    const [{ data: s }, { data: t }, { data: m }] = await Promise.all([
      supabase.from('scadenze').select('*').order('data_scadenza'),
      supabase.from('tipi_scadenza').select('*').order('titolo'),
      supabase.from('mezzi').select('id, targa').order('targa')
    ]);
    setScadenze(s || []);
    setTipi(t || []);
    setMezzi(m || []);
    setLoading(false);
  }

  async function caricaEmail(scadenzaId) {
    const { data } = await supabase.from('scadenze_email').select('*').eq('scadenza_id', scadenzaId);
    setEmailList(data || []);
  }

  function apriNuova() {
    setDati({ tipo_id: '', tipo_titolo: '', cod_univoco: '', id_mezzo: '', data_scadenza: '', data_avviso: '', note: '' });
    setEmailList([]);
    setNuovaEmail('');
    setScadenzaSelezionata(null);
    setModalePrecedente('nuova');
    setModale('nuova');
  }

  function apriModifica(scad) {
    setDati({
      tipo_id: scad.tipo_id || '',
      tipo_titolo: scad.tipo_titolo || '',
      cod_univoco: scad.cod_univoco || '',
      id_mezzo: scad.id_mezzo || '',
      data_scadenza: scad.data_scadenza || '',
      data_avviso: scad.data_avviso || '',
      note: scad.note || ''
    });
    setScadenzaSelezionata(scad);
    caricaEmail(scad.id);
    setNuovaEmail('');
    setModalePrecedente('modifica');
    setModale('modifica');
  }

  async function salva() {
    if (!dati.data_scadenza) { alert('La data scadenza è obbligatoria.'); return; }
    if (!dati.cod_univoco && !dati.id_mezzo) { alert('Inserisci il codice univoco o seleziona un mezzo.'); return; }
    setSalvando(true);

    const mezzoSel = mezzi.find(m => m.id === dati.id_mezzo);
    const codUnico = dati.id_mezzo ? (mezzoSel?.targa || dati.cod_univoco) : dati.cod_univoco;

    const payload = {
      tipo_id: dati.tipo_id || null,
      tipo_titolo: dati.tipo_titolo || '',
      cod_univoco: codUnico,
      id_mezzo: dati.id_mezzo || null,
      data_scadenza: dati.data_scadenza || null,
      data_avviso: dati.data_avviso || null,
      note: dati.note || ''
    };

    if (modale === 'nuova') {
      const id = 'SCAD_' + Date.now();
      const { error } = await supabase.from('scadenze').insert({ id, ...payload });
      if (error) { alert('Errore salvataggio: ' + error.message); setSalvando(false); return; }
      if (emailList.length > 0) {
        const righe = emailList.map((e, i) => ({ id: 'EM_' + Date.now() + '_' + i, scadenza_id: id, email: e.email }));
        await supabase.from('scadenze_email').insert(righe);
      }
    } else {
      const { error } = await supabase.from('scadenze').update(payload).eq('id', scadenzaSelezionata.id);
      if (error) { alert('Errore aggiornamento: ' + error.message); setSalvando(false); return; }
    }

    setSalvando(false);
    setModale(null);
    await caricaTutto();
  }

  async function eliminaScadenza(id) {
    if (!window.confirm('Eliminare questa scadenza?')) return;
    await supabase.from('scadenze_email').delete().eq('scadenza_id', id);
    await supabase.from('scadenze').delete().eq('id', id);
    await caricaTutto();
  }

  async function salvaNuovoTipo() {
    if (!nuovoTipoTitolo.trim()) { alert('Inserisci un titolo.'); return; }
    const id = 'TIPO_' + Date.now();
    const titolo = nuovoTipoTitolo.trim();
    const { error } = await supabase.from('tipi_scadenza').insert({ id, titolo });
    if (error) { alert('Errore creazione tipo: ' + error.message); return; }
    const { data } = await supabase.from('tipi_scadenza').select('*').order('titolo');
    setTipi(data || []);
    setDati(d => ({ ...d, tipo_id: id, tipo_titolo: titolo }));
    setNuovoTipoTitolo('');
    setModale(modalePrecedente);
  }

  async function aggiungiEmail() {
    if (!nuovaEmail.trim() || !nuovaEmail.includes('@')) { alert('Email non valida.'); return; }
    if (modale === 'modifica' && scadenzaSelezionata) {
      const id = 'EM_' + Date.now();
      await supabase.from('scadenze_email').insert({ id, scadenza_id: scadenzaSelezionata.id, email: nuovaEmail.trim() });
      caricaEmail(scadenzaSelezionata.id);
    } else {
      setEmailList(prev => [...prev, { id: 'tmp_' + Date.now(), email: nuovaEmail.trim() }]);
    }
    setNuovaEmail('');
  }

  async function rimuoviEmail(id) {
    if (modale === 'modifica') {
      await supabase.from('scadenze_email').delete().eq('id', id);
      caricaEmail(scadenzaSelezionata.id);
    } else {
      setEmailList(prev => prev.filter(e => e.id !== id));
    }
  }

  const scadenzeFiltrate = scadenze.filter(s => {
    const q = cerca.toLowerCase();
    if (q && !(
      (s.cod_univoco || '').toLowerCase().includes(q) ||
      (s.tipo_titolo || '').toLowerCase().includes(q) ||
      (s.note || '').toLowerCase().includes(q)
    )) return false;
    if (filtroStato && statoScadenza(s.data_scadenza, s.data_avviso) !== filtroStato) return false;
    if (filtroDal && s.data_scadenza && s.data_scadenza < filtroDal) return false;
    if (filtroAl && s.data_scadenza && s.data_scadenza > filtroAl) return false;
    return true;
  });

  return (
    <div style={{ background: '#101216', minHeight: '100vh', color: '#e8eaed', fontFamily: 'Arial, sans-serif' }}>

      {/* HEADER */}
      <header style={{ height: 76, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: '#181b20', borderBottom: '1px solid #30343b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 8, background: '#e5e7eb', color: '#111318', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 20 }}>GF</div>
          <div>
            <h1 style={{ fontSize: 20, letterSpacing: 1.5, color: '#fff', margin: 0 }}>SCADENZARIO</h1>
            <span style={{ fontSize: 11, color: '#B06700', textTransform: 'uppercase', letterSpacing: 1 }}>
              {loading ? '...' : `${scadenzeFiltrate.length} di ${scadenze.length} scadenze`}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ ...stileBtn, background: '#24282e', border: '1px solid #3e444d', color: '#c6cad0' }} onClick={apriNuova}>+ Crea scadenza</button>
          <button style={stileBtn} onClick={onTorna}>← Gestione Flotta</button>
        </div>
      </header>

      {/* FILTRI */}
      <div style={{ padding: '14px 24px', background: '#181b20', borderBottom: '1px solid #30343b', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input style={{ ...stileFiltro, width: 220 }} placeholder="🔍  Cerca codice, tipo, note..."
          value={cerca} onChange={e => setCerca(e.target.value)} />
        <select style={stileFiltro} value={filtroStato} onChange={e => setFiltroStato(e.target.value)}>
          <option value="">Tutti gli stati</option>
          <option value="scaduta">🔴 Scadute</option>
          <option value="urgente">🟠 Urgenti</option>
          <option value="presto">🟡 In scadenza</option>
          <option value="ok">🟢 OK</option>
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#656b74', fontSize: 11 }}>Dal</span>
          <input style={stileFiltro} type="date" min="1900-01-01" max="2099-12-31" value={filtroDal}
            onChange={e => { const v = e.target.value; if (v && v.split('-')[0].length > 4) return; setFiltroDal(v); }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#656b74', fontSize: 11 }}>Al</span>
          <input style={stileFiltro} type="date" min="1900-01-01" max="2099-12-31" value={filtroAl}
            onChange={e => { const v = e.target.value; if (v && v.split('-')[0].length > 4) return; setFiltroAl(v); }} />
        </div>
        {(cerca || filtroStato || filtroDal || filtroAl) && (
          <button onClick={() => { setCerca(''); setFiltroStato(''); setFiltroDal(''); setFiltroAl(''); }}
            style={{ background: 'transparent', color: '#f87171', border: '1px solid #c0392b', borderRadius: 5, padding: '8px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
            ✕ Reset
          </button>
        )}
      </div>

      {/* TABELLA */}
      <div style={{ padding: '14px 24px', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#656b74' }}>Caricamento...</div>
        ) : scadenzeFiltrate.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#656b74' }}>Nessuna scadenza trovata.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#20242a' }}>
                {['STATO', 'TIPO', 'COD. UNIVOCO', 'DATA SCADENZA', 'DATA AVVISO', 'NOTE', 'AZIONI'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#8b919a', fontSize: 10, letterSpacing: 0.7, fontWeight: 700, borderBottom: '1px solid #343941', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scadenzeFiltrate.map((scad, i) => {
                const stato = statoScadenza(scad.data_scadenza, scad.data_avviso);
                return (
                  <tr key={scad.id}
                    style={{ background: i % 2 === 0 ? '#191c21' : '#1c2025', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#252930'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#191c21' : '#1c2025'}
                  >
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #252930' }}>
                      <span style={{ color: COLORI_STATO[stato], fontWeight: 700, fontSize: 10 }}>{etichettaStato(stato)}</span>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#c3c7cc', borderBottom: '1px solid #252930' }}>{scad.tipo_titolo || '-'}</td>
                    <td style={{ padding: '10px 12px', color: '#fff', fontWeight: 700, borderBottom: '1px solid #252930' }}>{scad.cod_univoco || '-'}</td>
                    <td style={{ padding: '10px 12px', color: COLORI_STATO[stato], borderBottom: '1px solid #252930', fontWeight: stato !== 'ok' ? 700 : 400 }}>
                      {scad.data_scadenza ? new Date(scad.data_scadenza).toLocaleDateString('it-IT') : '-'}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#c3c7cc', borderBottom: '1px solid #252930' }}>
                      {scad.data_avviso ? new Date(scad.data_avviso).toLocaleDateString('it-IT') : '-'}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#8b919a', borderBottom: '1px solid #252930', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{scad.note || '-'}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #252930' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => apriModifica(scad)} style={{ ...stileBtnP, padding: '4px 10px', fontSize: 10 }}>✏️ Modifica</button>
                        <button onClick={() => eliminaScadenza(scad.id)} style={{ border: 'none', background: 'transparent', color: '#f87171', cursor: 'pointer', fontSize: 12 }}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* MODALE NUOVA / MODIFICA */}
      {(modale === 'nuova' || modale === 'modifica') && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(5,7,10,.82)', padding: 20 }}>
          <div style={{ width: 'min(700px, 96vw)', maxHeight: '92vh', background: '#1c2025', border: '1px solid #3b414a', borderRadius: 8, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid #343941', flexShrink: 0 }}>
              <div style={{ color: '#fff', fontSize: 14, fontWeight: 800, letterSpacing: 1 }}>
                {modale === 'nuova' ? 'NUOVA SCADENZA' : 'MODIFICA SCADENZA'}
              </div>
              <button onClick={() => setModale(null)} style={{ width: 30, height: 30, border: 0, background: 'transparent', color: '#9da3ac', fontSize: 22, cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

                {/* TIPO SCADENZA */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={stileLabel}>TIPO DI SCADENZA</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select style={{ ...stileInput, flex: 1 }} value={dati.tipo_id}
                      onChange={e => {
                        const id = e.target.value;
                        const trovato = tipi.find(t => t.id === id);
                        setDati(d => ({ ...d, tipo_id: id, tipo_titolo: trovato ? trovato.titolo : '' }));
                      }}>
                      <option value="">-- Seleziona tipo --</option>
                      {tipi.map(t => <option key={t.id} value={t.id}>{t.titolo}</option>)}
                    </select>
                    <button onClick={() => setModale('nuovoTipo')} style={{ ...stileBtnS, whiteSpace: 'nowrap', padding: '8px 12px' }}>+ Crea tipo</button>
                  </div>
                </div>

                {/* COD UNIVOCO */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={stileLabel}>COD. UNIVOCO / TARGA</label>
                  <select style={stileInput} value={dati.id_mezzo}
                    onChange={e => setDati(d => ({ ...d, id_mezzo: e.target.value, cod_univoco: '' }))}>
                    <option value="">-- Seleziona mezzo --</option>
                    {mezzi.map(m => <option key={m.id} value={m.id}>{m.targa}</option>)}
                  </select>
                  {!dati.id_mezzo && (
                    <input style={{ ...stileInput, marginTop: 6 }} type="text"
                      placeholder="oppure scrivi manualmente un bene non registrato..."
                      value={dati.cod_univoco}
                      onChange={e => setDati(d => ({ ...d, cod_univoco: e.target.value }))} />
                  )}
                </div>

                {/* DATA SCADENZA */}
                <div>
                  <label style={stileLabel}>DATA SCADENZA *</label>
                  <InputData
                    value={dati.data_scadenza}
                    onChange={val => setDati(d => ({ ...d, data_scadenza: val }))}
                  />
                </div>

                {/* DATA AVVISO */}
                <div>
                  <label style={stileLabel}>DATA AVVISO</label>
                  <InputData
                    value={dati.data_avviso}
                    onChange={val => setDati(d => ({ ...d, data_avviso: val }))}
                  />
                  <div style={{ marginTop: 4, fontSize: 10, color: '#656b74' }}>Da questa data apparirà la notifica in dashboard</div>
                </div>

                {/* NOTE */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={stileLabel}>NOTE</label>
                  <textarea style={{ ...stileInput, resize: 'vertical' }} rows={3}
                    value={dati.note}
                    onChange={e => setDati(d => ({ ...d, note: e.target.value }))}
                    placeholder="Informazioni aggiuntive..." />
                </div>

              </div>

              {/* EMAIL */}
              <div style={{ marginTop: 16, padding: 14, background: '#171a1f', border: '1px solid #30353d', borderRadius: 6 }}>
                <div style={{ color: '#dfe2e6', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>📧 Indirizzi e-mail per notifiche</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <input style={{ ...stileInput, flex: 1 }} type="email" placeholder="Inserisci indirizzo e-mail..."
                    value={nuovaEmail} onChange={e => setNuovaEmail(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') aggiungiEmail(); }} />
                  <button onClick={aggiungiEmail} style={{ ...stileBtnS, whiteSpace: 'nowrap' }}>+ Aggiungi</button>
                </div>
                {emailList.length === 0 ? (
                  <div style={{ color: '#656b74', fontSize: 11, textAlign: 'center', padding: 10 }}>Nessun indirizzo aggiunto</div>
                ) : (
                  emailList.map(em => (
                    <div key={em.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#20242a', borderRadius: 4, marginBottom: 5 }}>
                      <span style={{ color: '#c3c7cc', fontSize: 11 }}>✉️ {em.email}</span>
                      <button onClick={() => rimuoviEmail(em.id)} style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 12 }}>✕</button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '15px 20px', borderTop: '1px solid #343941', flexShrink: 0 }}>
              <button style={stileBtnS} onClick={() => setModale(null)}>Annulla</button>
              <button style={stileBtnP} onClick={salva} disabled={salvando}>{salvando ? 'Salvataggio...' : 'Salva scadenza'}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE NUOVO TIPO */}
      {modale === 'nuovoTipo' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(5,7,10,.85)', padding: 20 }}>
          <div style={{ width: 'min(400px, 96vw)', background: '#1c2025', border: '1px solid #3b414a', borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid #343941' }}>
              <div style={{ color: '#fff', fontSize: 14, fontWeight: 800, letterSpacing: 1 }}>CREA TIPO SCADENZA</div>
              <button onClick={() => setModale(modalePrecedente)}
                style={{ width: 30, height: 30, border: 0, background: 'transparent', color: '#9da3ac', fontSize: 22, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ padding: 20 }}>
              <label style={stileLabel}>TITOLO TIPO *</label>
              <input style={stileInput} type="text"
                placeholder="Es. Revisione, Assicurazione, Bollo..."
                value={nuovoTipoTitolo}
                onChange={e => setNuovoTipoTitolo(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') salvaNuovoTipo(); }}
                autoFocus />
              {tipi.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ color: '#8b919a', fontSize: 10, marginBottom: 8 }}>Tipi esistenti:</div>
                  {tipi.map(t => (
                    <div key={t.id} style={{ padding: '5px 8px', background: '#20242a', borderRadius: 4, marginBottom: 4, color: '#c3c7cc', fontSize: 11 }}>▶ {t.titolo}</div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '15px 20px', borderTop: '1px solid #343941' }}>
              <button style={stileBtnS} onClick={() => setModale(modalePrecedente)}>Annulla</button>
              <button style={stileBtnP} onClick={salvaNuovoTipo}>Crea tipo</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
