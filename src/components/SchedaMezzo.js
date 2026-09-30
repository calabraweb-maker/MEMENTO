import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';

const COLORI_STATO = {
  'BUONO': '#4ade80', 'MEDIO': '#228b22', 'BASSO': '#ff8c00',
  'CRITICO': '#ff0000', 'IN_OFFICINA': '#f59e0b',
  'NOLEGGIO': '#00ffff',
  'USOFRUTTO': '#ff00ff', 'FERMO': '#8f969f', 'DA ROTTAMARE': '#ff0000'
};

const STATI = ['BUONO','MEDIO','BASSO','CRITICO','IN_OFFICINA','NOLEGGIO','USOFRUTTO','FERMO','DA ROTTAMARE'];

const s = {
  overlay: { position:'fixed', inset:0, zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(5,7,10,.78)', padding:20 },
  box: { width:'min(850px, 96vw)', maxHeight:'92vh', background:'#1c2025', border:'1px solid #3b414a', borderRadius:8, display:'flex', flexDirection:'column', overflow:'hidden' },
  header: { display:'flex', alignItems:'flex-start', justifyContent:'space-between', padding:'18px 20px', borderBottom:'1px solid #343941', flexShrink:0 },
  title: { color:'#fff', fontSize:14, fontWeight:800, letterSpacing:1 },
  subtitle: { marginTop:4, color:'#818791', fontSize:10, textTransform:'uppercase' },
  closeBtn: { width:30, height:30, border:0, borderRadius:5, background:'transparent', color:'#9da3ac', fontSize:22, cursor:'pointer', lineHeight:1 },
  body: { padding:20, overflowY:'auto', flex:1, minHeight:0 },
  sezione: { marginBottom:12, background:'#171a1f', border:'1px solid #30353d', borderRadius:6, overflow:'hidden' },
  sezTitolo: { marginBottom:12, color:'#dfe2e6', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1 },
  sezHeader: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 },
  grid: { display:'grid', gridTemplateColumns:'repeat(3, minmax(0, 1fr))', gap:8 },
  dato: { padding:10, background:'#20242a', border:'1px solid #30353d', borderRadius:4 },
  datoLabel: { display:'block', marginBottom:5, color:'#777e87', fontSize:8, textTransform:'uppercase', letterSpacing:0.6 },
  datoValore: { display:'block', color:'#e7e9ec', fontSize:12, wordBreak:'break-word' },
  input: { width:'100%', background:'#0f1216', color:'#fff', border:'1px solid #3a414b', borderRadius:4, padding:'5px 8px', fontSize:11, boxSizing:'border-box', fontFamily:'inherit' },
  footer: { display:'flex', justifyContent:'flex-end', gap:8, padding:'15px 20px', borderTop:'1px solid #343941', flexShrink:0 },
  btnP: { padding:'9px 14px', borderRadius:5, fontSize:11, fontWeight:600, border:'1px solid #686f79', background:'#e1e4e8', color:'#15181c', cursor:'pointer', fontFamily:'inherit' },
  btnS: { padding:'9px 14px', borderRadius:5, fontSize:11, fontWeight:600, border:'1px solid #3e444d', background:'#24282e', color:'#c6cad0', cursor:'pointer', fontFamily:'inherit' },
  btnDanger: { padding:'9px 14px', borderRadius:5, fontSize:11, fontWeight:600, border:'1px solid #c0392b', background:'#c0392b', color:'#fff', cursor:'pointer', fontFamily:'inherit' },
  evItem: { padding:11, background:'#20242a', border:'1px solid #30353d', borderLeft:'3px solid #656b74', borderRadius:4, marginBottom:7 },
  evData: { color:'#737a84', fontSize:9 },
  evTitolo: { marginTop:4, color:'#e3e6e9', fontSize:11, fontWeight:700, textTransform:'uppercase' },
  evTesto: { marginTop:6, color:'#c3c7cc', fontSize:11, lineHeight:1.5 },
  evOp: { marginTop:7, color:'#737a84', fontSize:9 },
  vuoto: { padding:20, color:'#666d76', fontSize:11, textAlign:'center' },
  allegato: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', background:'#20242a', border:'1px solid #30353d', borderRadius:4, marginBottom:7 },
  allegatoNome: { color:'#c3c7cc', fontSize:11, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1, marginRight:10 },
  allegatoLink: { color:'#2d7ff9', fontSize:11, textDecoration:'none', flexShrink:0 }
};

function Accordion({ titolo, badge, children, defaultOpen = false, azione }) {
  const [aperto, setAperto] = useState(defaultOpen);
  return (
    <div style={s.sezione}>
      <div
        onClick={() => setAperto(!aperto)}
        style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 15px', cursor:'pointer', background: aperto ? '#1e2229' : '#171a1f', transition:'background 0.15s', userSelect:'none' }}
      >
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ color: aperto ? '#fff' : '#aeb3bb', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1 }}>{titolo}</span>
          {badge !== undefined && (
            <span style={{ background:'#2d7ff9', color:'#fff', fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:20 }}>{badge}</span>
          )}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {azione && <div onClick={e => e.stopPropagation()}>{azione}</div>}
          <span style={{ color:'#656b74', fontSize:16, transition:'transform 0.2s', display:'inline-block', transform: aperto ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
        </div>
      </div>
      {aperto && (
        <div style={{ padding:'0 15px 15px' }}>
          {children}
        </div>
      )}
    </div>
  );
}

export default function SchedaMezzo({ idMezzo, onChiudi, onAggiorna, cantiereId }) {
  const [mezzo, setMezzo] = useState(null);
  const [eventi, setEventi] = useState([]);
  const [note, setNote] = useState([]);
  const [allegati, setAllegati] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modifica, setModifica] = useState(false);
  const [datiModifica, setDatiModifica] = useState({});
  const [nuovaNota, setNuovaNota] = useState(false);
  const [tipoNota, setTipoNota] = useState('');
  const [testoNota, setTestoNota] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [uploadando, setUploadando] = useState(false);
  const [eliminaModale, setEliminaModale] = useState(false);
  const [motivazioneElimina, setMotivazioneElimina] = useState('');
  const fileRef = useRef();

  useEffect(() => {
  async function caricaDati() {
    setLoading(true);

    const [{ data: m }, { data: e }, { data: n }, { data: a }] = await Promise.all([
      supabase.from('mezzi').select('*').eq('id', idMezzo).single(),
      supabase.from('eventi').select('*').eq('id_mezzo', idMezzo).order('created_at', { ascending: false }),
      supabase.from('cronologia_mezzi').select('*').eq('id_mezzo', idMezzo).order('created_at', { ascending: false }),
      supabase.from('allegati').select('*').eq('id_mezzo', idMezzo).order('created_at', { ascending: false })
    ]);

    setMezzo(m);
    setEventi(e || []);
    setNote(n || []);
    setAllegati(a || []);
    setLoading(false);
  }

  if (idMezzo) caricaDati();
}, [idMezzo]);


  function abilitaModifica() {
    setDatiModifica({
      targa: mezzo.targa || '', marca: mezzo.marca || '', proprietario: mezzo.proprietario || '',
      cdc: mezzo.cdc || '', telaio: mezzo.telaio || '', portata: mezzo.portata || '',
      alimentazione: mezzo.alimentazione || '', km_attuali: mezzo.km_attuali || 0, note: mezzo.note || ''
    });
    setModifica(true);
  }

  async function salvaModifiche() {
    if (!datiModifica.targa) { alert('La targa è obbligatoria.'); return; }
    setSalvando(true);
    await supabase.from('mezzi').update(datiModifica).eq('id', idMezzo);
    await supabase.from('eventi').insert({ id: 'EVT_' + Date.now(), id_mezzo: idMezzo, tipo_evento: 'MODIFICA', motivazione: 'Dati mezzo aggiornati.', operatore: 'utente' });
    setSalvando(false); setModifica(false); caricaDati();
    if (onAggiorna) onAggiorna();
  }

  async function cambiaStato(nuovoStato) {
    if (!window.confirm('Confermi il cambio di stato a: ' + nuovoStato + '?')) return;
    await supabase.from('mezzi').update({ stato: nuovoStato }).eq('id', idMezzo);
    await supabase.from('eventi').insert({ id: 'EVT_' + Date.now(), id_mezzo: idMezzo, tipo_evento: 'CAMBIO_STATO', motivazione: 'Stato aggiornato a: ' + nuovoStato, operatore: 'utente' });
    caricaDati();
    if (onAggiorna) onAggiorna();
  }

  async function salvaNota() {
    if (!testoNota.trim()) { alert('Inserisci il testo della nota.'); return; }
    setSalvando(true);
    await supabase.from('cronologia_mezzi').insert({ id: 'NOTA_' + Date.now(), id_mezzo: idMezzo, tipo: tipoNota || 'NOTA', testo: testoNota.trim(), operatore: 'utente' });
    setTipoNota(''); setTestoNota(''); setNuovaNota(false); setSalvando(false);
    caricaDati();
  }

  async function caricaAllegato(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadando(true);
    const targa = mezzo?.targa || idMezzo;
    const path = `${targa}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('allegati-flotta').upload(path, file);
    if (error) { alert('Errore upload: ' + error.message); setUploadando(false); return; }
    const { data: urlData } = supabase.storage.from('allegati-flotta').getPublicUrl(path);
    await supabase.from('allegati').insert({ id: 'ALL_' + Date.now(), id_mezzo: idMezzo, nome_file: file.name, url: urlData.publicUrl, storage_path: path });
    setUploadando(false);
    if (fileRef.current) fileRef.current.value = '';
    caricaDati();
  }

  async function eliminaAllegato(allegato) {
    if (!window.confirm('Eliminare il file "' + allegato.nome_file + '"?')) return;
    await supabase.storage.from('allegati-flotta').remove([allegato.storage_path]);
    await supabase.from('allegati').delete().eq('id', allegato.id);
    caricaDati();
  }

  async function eliminaMezzo() {
    if (!motivazioneElimina.trim()) { alert('La motivazione è obbligatoria.'); return; }
    setSalvando(true);
    for (const a of allegati) {
      if (a.storage_path) await supabase.storage.from('allegati-flotta').remove([a.storage_path]);
    }
    await supabase.from('allegati').delete().eq('id_mezzo', idMezzo);
    await supabase.from('cronologia_mezzi').delete().eq('id_mezzo', idMezzo);
    await supabase.from('eventi').delete().eq('id_mezzo', idMezzo);
    await supabase.from('mezzi').delete().eq('id', idMezzo);
    setSalvando(false); setEliminaModale(false);
    if (onAggiorna) onAggiorna();
    onChiudi();
  }

  function formattaData(d) {
    if (!d) return '';
    return new Date(d).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function campo(id, label, tipo = 'text') {
    if (modifica) {
      return (
        <div style={s.dato}>
          <span style={s.datoLabel}>{label}</span>
          <input style={s.input} type={tipo} value={datiModifica[id] || ''} onChange={e => setDatiModifica({ ...datiModifica, [id]: e.target.value })} />
        </div>
      );
    }
    return (
      <div style={s.dato}>
        <span style={s.datoLabel}>{label}</span>
        <strong style={s.datoValore}>{mezzo[id] || '-'}</strong>
      </div>
    );
  }

  const isInCantiere = mezzo?.id_colonna === cantiereId;

  if (!idMezzo) return null;

  return (
    <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) onChiudi(); }}>
      <div style={s.box}>

        <div style={s.header}>
          <div>
            <div style={s.title}>SCHEDA AUTOMEZZO</div>
            <div style={s.subtitle}>{mezzo?.targa || '...'}</div>
          </div>
          <button style={s.closeBtn} onClick={onChiudi}>×</button>
        </div>

        <div style={s.body}>
          {loading ? <div style={s.vuoto}>Caricamento...</div> : !mezzo ? <div style={s.vuoto}>Mezzo non trovato.</div> : (
            <>
              {/* DATI MEZZO — sempre visibili */}
              <div style={{ ...s.sezione, marginBottom: 12 }}>
                <div style={{ padding:'12px 15px 0' }}>
                  <div style={s.sezTitolo}>Dati del mezzo</div>
                </div>
                <div style={{ padding:'0 15px 15px' }}>
                  <div style={s.grid}>
                    <div style={s.dato}><span style={s.datoLabel}>ID MEZZO</span><strong style={s.datoValore}>{mezzo.id}</strong></div>
                    {campo('targa', 'TARGA')}
                    {campo('marca', 'MARCA')}
                    {campo('proprietario', 'PROPRIETARIO')}
                    {campo('cdc', 'CENTRO DI COSTO')}
                    {campo('telaio', 'TELAIO')}
                    <div style={s.dato}><span style={s.datoLabel}>IMMATRICOLAZIONE</span><strong style={s.datoValore}>{mezzo.data_immatricolazione || '-'}</strong></div>
                    {campo('portata', 'PORTATA')}
                    {campo('alimentazione', 'ALIMENTAZIONE')}
                    {campo('km_attuali', 'KM ATTUALI', 'number')}
                    <div style={s.dato}><span style={s.datoLabel}>COLONNA</span><strong style={s.datoValore}>{mezzo.id_colonna || '-'}</strong></div>
                    <div style={s.dato}>
                      <span style={s.datoLabel}>STATO</span>
                      <select style={{ ...s.input, color: COLORI_STATO[mezzo.stato] || '#8f969f' }} value={mezzo.stato || 'BUONO'} onChange={e => cambiaStato(e.target.value)}>
                        {STATI.map(st => <option key={st} value={st}>{st === 'IN_OFFICINA' ? 'IN OFFICINA' : st}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ ...s.dato, marginTop: 8 }}>
                    <span style={s.datoLabel}>NOTE</span>
                    {modifica
                      ? <textarea style={{ ...s.input, resize: 'vertical' }} rows={3} value={datiModifica.note || ''} onChange={e => setDatiModifica({ ...datiModifica, note: e.target.value })} />
                      : <strong style={s.datoValore}>{mezzo.note || '-'}</strong>
                    }
                  </div>
                </div>
              </div>

              {isInCantiere && (
                <div style={{ marginBottom: 12, padding: '12px 15px', background: '#2d1f1f', border: '1px solid #c0392b', borderRadius: 6, color: '#f87171', fontSize: 12 }}>
                  ⚠️ Questo mezzo è in <strong>CANTIERE</strong>. Da qui puoi eliminarlo definitivamente.
                </div>
              )}

              {/* ALLEGATI — accordion */}
              <Accordion
                titolo="Allegati"
                badge={allegati.length || undefined}
                azione={
                  <label style={{ ...s.btnP, padding:'5px 10px', fontSize:10, cursor:'pointer' }}>
                    {uploadando ? '...' : '+ Carica'}
                    <input ref={fileRef} type="file" style={{ display:'none' }} onChange={caricaAllegato} disabled={uploadando} />
                  </label>
                }
              >
                <div style={{ marginTop: 10 }}>
                  {allegati.length === 0 ? <div style={s.vuoto}>Nessun allegato.</div> : allegati.map(a => (
                    <div key={a.id} style={s.allegato}>
                      <span style={s.allegatoNome}>📎 {a.nome_file}</span>
                      <div style={{ display:'flex', gap:8 }}>
                        <a href={a.url} target="_blank" rel="noopener noreferrer" style={s.allegatoLink}>Apri</a>
                        <button onClick={() => eliminaAllegato(a)} style={{ background:'transparent', border:'none', color:'#f87171', fontSize:11, cursor:'pointer' }}>Elimina</button>
                      </div>
                    </div>
                  ))}
                </div>
              </Accordion>

              {/* CRONOLOGIA EVENTI — accordion */}
              <Accordion titolo="Cronologia eventi" badge={eventi.length || undefined}>
                <div style={{ marginTop: 10 }}>
                  {eventi.length === 0 ? <div style={s.vuoto}>Nessun evento registrato.</div> : eventi.map(ev => (
                    <div key={ev.id} style={s.evItem}>
                      <div style={s.evData}>{formattaData(ev.created_at)}</div>
                      <div style={s.evTitolo}>{ev.tipo_evento}</div>
                      {(ev.da_nome || ev.a_nome) && <div style={{ ...s.evTesto, fontSize:10 }}>{ev.da_nome || ev.da_id || '-'} → {ev.a_nome || ev.a_id || '-'}</div>}
                      <div style={s.evTesto}>{ev.motivazione || ''}</div>
                      <div style={s.evOp}>Operatore: {ev.operatore || 'N/D'}</div>
                    </div>
                  ))}
                </div>
              </Accordion>

              {/* CRONOLOGIA MEZZO — accordion */}
              <Accordion
                titolo="Cronologia mezzo"
                badge={note.length || undefined}
                azione={
                  <button style={{ ...s.btnP, padding:'5px 10px', fontSize:10 }} onClick={() => setNuovaNota(!nuovaNota)}>
                    + Nota
                  </button>
                }
              >
                <div style={{ marginTop: 10 }}>
                  {nuovaNota && (
                    <div style={{ marginBottom: 12, padding: 13, background: '#20242a', border: '1px solid #3a4048', borderRadius: 5 }}>
                      <label style={{ display:'block', marginBottom:6, color:'#969da6', fontSize:9, textTransform:'uppercase' }}>Tipo nota</label>
                      <input style={{ ...s.input, marginBottom:10 }} type="text" placeholder="Es. MANUTENZIONE, RIFORNIMENTO..." value={tipoNota} onChange={e => setTipoNota(e.target.value)} />
                      <label style={{ display:'block', marginBottom:6, color:'#969da6', fontSize:9, textTransform:'uppercase' }}>Testo</label>
                      <textarea style={{ ...s.input, resize:'vertical', marginBottom:10 }} rows={4} placeholder="Inserisci informazioni..." value={testoNota} onChange={e => setTestoNota(e.target.value)} />
                      <div style={{ display:'flex', justifyContent:'flex-end', gap:7 }}>
                        <button style={s.btnS} onClick={() => setNuovaNota(false)}>Annulla</button>
                        <button style={s.btnP} onClick={salvaNota} disabled={salvando}>{salvando ? 'Salvataggio...' : 'Salva nota'}</button>
                      </div>
                    </div>
                  )}
                  {note.length === 0 ? <div style={s.vuoto}>Nessuna nota inserita.</div> : note.map(n => (
                    <div key={n.id} style={s.evItem}>
                      <div style={s.evData}>{formattaData(n.created_at)}</div>
                      <div style={s.evTitolo}>{n.tipo || 'NOTA'}</div>
                      <div style={s.evTesto}>{n.testo}</div>
                      <div style={s.evOp}>Inserita da: {n.operatore || 'N/D'}</div>
                    </div>
                  ))}
                </div>
              </Accordion>

            </>
          )}
        </div>

        <div style={s.footer}>
          {isInCantiere && !modifica && (
            <button style={s.btnDanger} onClick={() => setEliminaModale(true)}>🗑️ Elimina mezzo</button>
          )}
          <div style={{ flex: 1 }} />
          <button style={s.btnS} onClick={onChiudi}>Chiudi</button>
          {!modifica
            ? <button style={s.btnP} onClick={abilitaModifica}>Modifica</button>
            : <>
                <button style={s.btnS} onClick={() => setModifica(false)}>Annulla</button>
                <button style={s.btnP} onClick={salvaModifiche} disabled={salvando}>{salvando ? 'Salvataggio...' : 'Salva modifiche'}</button>
              </>
          }
        </div>

      </div>

      {eliminaModale && (
        <div style={{ position:'fixed', inset:0, zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(5,7,10,.85)', padding:20 }}>
          <div style={{ width:'min(460px, 96vw)', background:'#1c2025', border:'1px solid #c0392b', borderRadius:8 }}>
            <div style={{ padding:'18px 20px', borderBottom:'1px solid #343941' }}>
              <div style={{ color:'#f87171', fontSize:14, fontWeight:800, letterSpacing:1 }}>⚠️ ELIMINA MEZZO DEFINITIVAMENTE</div>
              <div style={{ marginTop:4, color:'#818791', fontSize:10, textTransform:'uppercase' }}>Operazione irreversibile</div>
            </div>
            <div style={{ padding:20 }}>
              <div style={{ marginBottom:16, padding:13, background:'#2d1f1f', border:'1px solid #c0392b', borderRadius:5, color:'#f87171', fontSize:12, lineHeight:1.6 }}>
                Stai per eliminare definitivamente il mezzo <strong>{mezzo?.targa}</strong>.<br />
                Verranno eliminati anche tutti gli eventi, le note e gli allegati.<br />
                <strong>Questa operazione non può essere annullata.</strong>
              </div>
              <label style={{ display:'block', marginBottom:7, color:'#b9bec6', fontSize:11, textTransform:'uppercase' }}>Motivazione obbligatoria</label>
              <textarea rows={4} placeholder="Inserisci la motivazione dell'eliminazione..." value={motivazioneElimina} onChange={e => setMotivazioneElimina(e.target.value)} autoFocus
                style={{ width:'100%', background:'#12151a', color:'#fff', border:'1px solid #c0392b', borderRadius:5, padding:'11px 12px', fontSize:13, resize:'vertical', boxSizing:'border-box', fontFamily:'inherit' }} />
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:8, padding:'15px 20px', borderTop:'1px solid #343941' }}>
              <button onClick={() => { setEliminaModale(false); setMotivazioneElimina(''); }} style={s.btnS}>Annulla</button>
              <button onClick={eliminaMezzo} disabled={salvando} style={s.btnDanger}>{salvando ? 'Eliminazione...' : 'Elimina definitivamente'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
