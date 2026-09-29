import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

const stileBtnP = { padding: '9px 14px', borderRadius: 5, fontSize: 11, fontWeight: 600, border: '1px solid #686f79', background: '#e1e4e8', color: '#15181c', cursor: 'pointer', fontFamily: 'inherit' };
const stileBtnS = { padding: '9px 14px', borderRadius: 5, fontSize: 11, fontWeight: 600, border: '1px solid #3e444d', background: '#24282e', color: '#c6cad0', cursor: 'pointer', fontFamily: 'inherit' };
const stileInput = { width: '100%', background: '#0f1216', color: '#fff', border: '1px solid #3a414b', borderRadius: 4, padding: '8px 10px', fontSize: 11, boxSizing: 'border-box', fontFamily: 'inherit' };
const stileLabel = { display: 'block', marginBottom: 5, color: '#969da6', fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 };

const STATI = ['BUONO','MEDIO','BASSO','CRITICO','IN_OFFICINA','NOLEGGIO','USOFRUTTO','FERMO'];

export default function NuovoMezzo({ onChiudi, onAggiorna }) {
  const [centri, setCentri] = useState([]);
  const [officine, setOfficine] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [dati, setDati] = useState({
    id: '', targa: '', marca: '', proprietario: '', cdc: '', telaio: '',
    data_immatricolazione: '', portata: '', alimentazione: '',
    km_attuali: 0, id_colonna: '', stato: 'BUONO', note: ''
  });

  useEffect(() => {
    async function carica() {
      const [{ data: c }, { data: o }] = await Promise.all([
        supabase.from('centri_costo').select('*').eq('attivo', true).order('ordine'),
        supabase.from('officine').select('*').eq('attiva', true).order('ordine')
      ]);
      setCentri(c || []);
      setOfficine(o || []);
    }
    carica();
  }, []);

  function set(campo, valore) {
    setDati(d => ({ ...d, [campo]: valore }));
  }

  async function salva() {
    if (!dati.id.trim()) { alert('ID mezzo obbligatorio.'); return; }
    if (!dati.targa.trim()) { alert('Targa obbligatoria.'); return; }
    setSalvando(true);
    const { error } = await supabase.from('mezzi').insert({
      id: dati.id.trim().toUpperCase(),
      targa: dati.targa.trim().toUpperCase(),
      marca: dati.marca.trim(),
      proprietario: dati.proprietario.trim(),
      cdc: dati.cdc.trim(),
      telaio: dati.telaio.trim(),
      data_immatricolazione: dati.data_immatricolazione || null,
      portata: dati.portata.trim(),
      alimentazione: dati.alimentazione,
      km_attuali: parseInt(dati.km_attuali) || 0,
      id_colonna: dati.id_colonna || null,
      stato: dati.stato || 'BUONO',
      note: dati.note.trim()
    });
    if (error) { alert('Errore: ' + error.message); setSalvando(false); return; }
    await supabase.from('eventi').insert({ id: 'EVT_' + Date.now(), id_mezzo: dati.id.trim().toUpperCase(), tipo_evento: 'CENSIMENTO', motivazione: 'Nuovo mezzo censito.', operatore: 'utente' });
    setSalvando(false);
    if (onAggiorna) onAggiorna();
    onChiudi();
  }

  const campo = (label, key, tipo = 'text', placeholder = '') => (
    <div style={{ minWidth: 0 }}>
      <label style={stileLabel}>{label}</label>
      <input style={stileInput} type={tipo} placeholder={placeholder} value={dati[key] || ''} onChange={e => set(key, e.target.value)} />
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(5,7,10,.78)', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onChiudi(); }}>
      <div style={{ width: 'min(850px, 96vw)', maxHeight: '92vh', background: '#1c2025', border: '1px solid #3b414a', borderRadius: 8, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid #343941', flexShrink: 0 }}>
          <div>
            <div style={{ color: '#fff', fontSize: 14, fontWeight: 800, letterSpacing: 1 }}>NUOVO AUTOMEZZO</div>
            <div style={{ marginTop: 4, color: '#818791', fontSize: 10, textTransform: 'uppercase' }}>Censimento mezzo</div>
          </div>
          <button onClick={onChiudi} style={{ width: 30, height: 30, border: 0, background: 'transparent', color: '#9da3ac', fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
          <div style={{ padding: 15, background: '#171a1f', border: '1px solid #30353d', borderRadius: 6 }}>
            <div style={{ marginBottom: 12, color: '#dfe2e6', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Dati del mezzo</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>

              {campo('ID MEZZO *', 'id', 'text', 'Es. M022')}
              {campo('TARGA *', 'targa', 'text', 'Es. AB123CD')}
              {campo('MARCA', 'marca', 'text', 'Es. Iveco Daily')}
              {campo('PROPRIETARIO', 'proprietario', 'text', 'Es. Azienda Srl')}

              <div>
                <label style={stileLabel}>ASSEGNA A</label>
                <select style={stileInput} value={dati.id_colonna || ''} onChange={e => set('id_colonna', e.target.value)}>
                  <option value="">-- Nessuno (Cantiere) --</option>
                  <optgroup label="Centri di costo">
                    {centri.map(c => <option key={c.id} value={c.id}>{c.titolo}</option>)}
                  </optgroup>
                  <optgroup label="Officine">
                    {officine.map(o => <option key={o.id} value={o.id}>{o.titolo}</option>)}
                  </optgroup>
                </select>
              </div>

              {campo('TELAIO', 'telaio', 'text', 'Numero telaio')}
              {campo('DATA IMMATRICOLAZIONE', 'data_immatricolazione', 'date')}
              {campo('PORTATA', 'portata', 'text', 'Es. 3500 kg')}

              <div>
                <label style={stileLabel}>ALIMENTAZIONE</label>
                <select style={stileInput} value={dati.alimentazione || ''} onChange={e => set('alimentazione', e.target.value)}>
                  <option value="">-- Seleziona --</option>
                  <option value="DIESEL">Diesel</option>
                  <option value="BENZINA">Benzina</option>
                  <option value="GPL">GPL</option>
                  <option value="METANO">Metano</option>
                  <option value="IBRIDO">Ibrido</option>
                  <option value="ELETTRICO">Elettrico</option>
                  <option value="ALTRO">Altro</option>
                </select>
              </div>

              {campo('KM ATTUALI', 'km_attuali', 'number', '0')}

              <div>
                <label style={stileLabel}>STATO</label>
                <select style={stileInput} value={dati.stato || 'BUONO'} onChange={e => set('stato', e.target.value)}>
                  {STATI.map(s => <option key={s} value={s}>{s === 'IN_OFFICINA' ? 'IN OFFICINA' : s}</option>)}
                </select>
              </div>

            </div>

            <div style={{ marginTop: 12 }}>
              <label style={stileLabel}>NOTE</label>
              <textarea style={{ ...stileInput, resize: 'vertical' }} rows={4} placeholder="Informazioni aggiuntive..." value={dati.note || ''} onChange={e => set('note', e.target.value)} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '15px 20px', borderTop: '1px solid #343941', flexShrink: 0 }}>
          <button style={stileBtnS} onClick={onChiudi}>Annulla</button>
          <button style={stileBtnP} onClick={salva} disabled={salvando}>{salvando ? 'Salvataggio...' : 'Censisci mezzo'}</button>
        </div>

      </div>
    </div>
  );
}
