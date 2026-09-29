import React, { useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { supabase } from '../supabase';
import SchedaMezzo from './SchedaMezzo';
import NuovoMezzo from './NuovoMezzo';
import ElencoMezzi from './ElencoMezzi';
import Scadenzario from './Scadenzario';

const CANTIERE_ID = 'CC001';

const stileBtnS = { padding: '9px 14px', borderRadius: 5, fontSize: 11, fontWeight: 600, border: '1px solid #3e444d', background: '#24282e', color: '#c6cad0', cursor: 'pointer', fontFamily: 'inherit' };
const stileBtnP = { padding: '9px 14px', borderRadius: 5, fontSize: 11, fontWeight: 600, border: '1px solid #686f79', background: '#e1e4e8', color: '#15181c', cursor: 'pointer', fontFamily: 'inherit' };
const stileInput = { width: '100%', background: '#12151a', color: '#fff', border: '1px solid #3b414a', borderRadius: 5, padding: '9px 10px', fontSize: 12, boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: 10 };

const MENU_VOCI = [
  { id: 'elenco',      icona: '▶', titolo: 'Elenco mezzi',                gruppo: 'VISUALIZZA' },
  { id: 'scadenzario', icona: '▶', titolo: 'Scadenzario',                 gruppo: 'VISUALIZZA' },
  { id: 'nuovo_mezzo', icona: '▶', titolo: 'Crea nuovo mezzo',            gruppo: 'CREA' },
  { id: 'nuovo_cdc',   icona: '▶', titolo: 'Crea nuovo centro di costo',  gruppo: 'CREA' },
  { id: 'nuova_off',   icona: '▶', titolo: 'Crea nuova officina',         gruppo: 'CREA' },
];

export default function Dashboard() {
  const [mezzi, setMezzi] = useState([]);
  const [centri, setCentri] = useState([]);
  const [officine, setOfficine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mezzoSelezionato, setMezzoSelezionato] = useState(null);
  const [nuovoMezzo, setNuovoMezzo] = useState(false);
  const [pagina, setPagina] = useState('dashboard'); // 'dashboard' | 'elenco' | 'scadenzario'
  const [spostamento, setSpostamento] = useState(null);
  const [motivazione, setMotivazione] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [modale, setModale] = useState(null);
  const [menuAperto, setMenuAperto] = useState(false);
  const [notifiche, setNotifiche] = useState([]);
  const [pannelloNotifiche, setPannelloNotifiche] = useState(false);
  const menuRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => { caricaDati(); }, []);

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuAperto(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setPannelloNotifiche(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function caricaDati() {
    setLoading(true);
    const [{ data: m }, { data: c }, { data: o }, { data: s }] = await Promise.all([
      supabase.from('mezzi').select('*'),
      supabase.from('centri_costo').select('*').eq('attivo', true).order('ordine'),
      supabase.from('officine').select('*').eq('attiva', true).order('ordine'),
      supabase.from('scadenze').select('*').order('data_scadenza')
    ]);
    setMezzi(m || []);
    setCentri(c || []);
    setOfficine(o || []);

    // calcola notifiche
    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);
    const allerte = (s || []).filter(scad => {
      if (!scad.data_avviso) return false;
      const avv = new Date(scad.data_avviso);
      return avv <= oggi;
    });
    setNotifiche(allerte);
    setLoading(false);
  }

  async function onDragEnd(result) {
    const { draggableId, destination, source, type } = result;
    if (!destination) return;
    if (type === 'COLONNA_CDC') {
      if (source.index === destination.index) return;
      const nuovi = Array.from(centri);
      const [r] = nuovi.splice(source.index, 1); nuovi.splice(destination.index, 0, r);
      setCentri(nuovi);
      for (let i = 0; i < nuovi.length; i++) await supabase.from('centri_costo').update({ ordine: i + 1 }).eq('id', nuovi[i].id);
      return;
    }
    if (type === 'COLONNA_OFF') {
      if (source.index === destination.index) return;
      const nuove = Array.from(officine);
      const [r] = nuove.splice(source.index, 1); nuove.splice(destination.index, 0, r);
      setOfficine(nuove);
      for (let i = 0; i < nuove.length; i++) await supabase.from('officine').update({ ordine: i + 1 }).eq('id', nuove[i].id);
      return;
    }
    const idMezzo = draggableId;
    const nuovaColonna = destination.droppableId;
    if (nuovaColonna === 'CDC_CONTAINER' || nuovaColonna === 'OFF_CONTAINER') return;
    const mezzo = mezzi.find(m => m.id === idMezzo);
    if (!mezzo || mezzo.id_colonna === nuovaColonna) return;
    const colonna = centri.find(c => c.id === nuovaColonna) || officine.find(o => o.id === nuovaColonna);
    setSpostamento({ idMezzo, nuovaColonna, nomeColonna: colonna ? colonna.titolo : nuovaColonna });
    setMotivazione('');
  }

  async function confermaSpostamento() {
    if (!motivazione.trim()) { alert('La motivazione è obbligatoria.'); return; }
    setSalvando(true);
    const mezzo = mezzi.find(m => m.id === spostamento.idMezzo);
    const vecchiaColonna = mezzo?.id_colonna || '';
    const vecchiaColonnaNome = centri.find(c => c.id === vecchiaColonna)?.titolo || officine.find(o => o.id === vecchiaColonna)?.titolo || vecchiaColonna;
    const isOfficina = officine.some(o => o.id === spostamento.nuovaColonna);
    const nuovoStato = isOfficina ? 'IN_OFFICINA' : (mezzo?.stato === 'IN_OFFICINA' ? 'BUONO' : mezzo?.stato);
    await supabase.from('mezzi').update({ id_colonna: spostamento.nuovaColonna, stato: nuovoStato }).eq('id', spostamento.idMezzo);
    await supabase.from('eventi').insert({ id: 'EVT_' + Date.now(), id_mezzo: spostamento.idMezzo, tipo_evento: 'SPOSTAMENTO', da_id: vecchiaColonna, da_nome: vecchiaColonnaNome, a_id: spostamento.nuovaColonna, a_nome: spostamento.nomeColonna, motivazione: motivazione.trim(), operatore: 'utente' });
    setSalvando(false); setSpostamento(null); setMotivazione(''); caricaDati();
  }

  async function salvaModale() {
    if (!modale) return;
    const { tipo, azione, dati } = modale;
    setSalvando(true);
    if (azione === 'elimina') {
      const mezziColonna = mezzi.filter(m => m.id_colonna === dati.id);
      for (const mezzo of mezziColonna) {
        await supabase.from('mezzi').update({ id_colonna: CANTIERE_ID, stato: mezzo.stato === 'IN_OFFICINA' ? 'BUONO' : mezzo.stato }).eq('id', mezzo.id);
        await supabase.from('eventi').insert({ id: 'EVT_' + Date.now() + '_' + mezzo.id, id_mezzo: mezzo.id, tipo_evento: 'SPOSTAMENTO_AUTO', da_id: dati.id, da_nome: dati.titolo, a_id: CANTIERE_ID, a_nome: 'CANTIERE', motivazione: 'Spostamento automatico per eliminazione colonna.', operatore: 'sistema' });
      }
      if (tipo === 'CDC') await supabase.from('centri_costo').update({ attivo: false }).eq('id', dati.id);
      if (tipo === 'OFF') await supabase.from('officine').update({ attiva: false }).eq('id', dati.id);
      setModale(null); setSalvando(false); caricaDati(); return;
    }
    if (tipo === 'CDC') {
      if (!dati.titolo && dati.id !== CANTIERE_ID) { alert('Il titolo è obbligatorio.'); setSalvando(false); return; }
      if (dati.id === CANTIERE_ID) {
        await supabase.from('centri_costo').update({ coordinatore: dati.coordinatore }).eq('id', dati.id);
      } else {
        if (!dati.coordinatore) { alert('Il coordinatore è obbligatorio.'); setSalvando(false); return; }
        if (azione === 'nuovo') await supabase.from('centri_costo').insert({ id: 'CDC_' + Date.now(), titolo: dati.titolo, coordinatore: dati.coordinatore, ordine: centri.length + 1, attivo: true });
        else await supabase.from('centri_costo').update({ titolo: dati.titolo, coordinatore: dati.coordinatore }).eq('id', dati.id);
      }
    }
    if (tipo === 'OFF') {
      if (!dati.titolo) { alert('Il titolo è obbligatorio.'); setSalvando(false); return; }
      if (azione === 'nuovo') await supabase.from('officine').insert({ id: 'OFF_' + Date.now(), titolo: dati.titolo, telefono: dati.telefono || '', ordine: officine.length + 1, attiva: true });
      else await supabase.from('officine').update({ titolo: dati.titolo, telefono: dati.telefono || '' }).eq('id', dati.id);
    }
    setModale(null); setSalvando(false); caricaDati();
  }

  function handleVoceMenu(id) {
    setMenuAperto(false);
    if (id === 'elenco') setPagina('elenco');
    if (id === 'scadenzario') setPagina('scadenzario');
    if (id === 'nuovo_mezzo') setNuovoMezzo(true);
    if (id === 'nuovo_cdc') setModale({ tipo: 'CDC', azione: 'nuovo', dati: { titolo: '', coordinatore: '' } });
    if (id === 'nuova_off') setModale({ tipo: 'OFF', azione: 'nuovo', dati: { titolo: '', telefono: '' } });
  }

  const totale = mezzi.length;
  const fermi = mezzi.filter(m => m.stato === 'FERMO').length;
  const inOfficina = mezzi.filter(m => m.stato === 'IN_OFFICINA').length;
  const gruppi = [...new Set(MENU_VOCI.map(v => v.gruppo))];

  if (pagina === 'elenco') {
    return (
      <>
        <ElencoMezzi onTorna={() => setPagina('dashboard')} onApriScheda={setMezzoSelezionato} />
        {mezzoSelezionato && <SchedaMezzo idMezzo={mezzoSelezionato} onChiudi={() => setMezzoSelezionato(null)} onAggiorna={caricaDati} cantiereId={CANTIERE_ID} />}
      </>
    );
  }

  if (pagina === 'scadenzario') {
    return <Scadenzario onTorna={() => { setPagina('dashboard'); caricaDati(); }} />;
  }

  if (loading) return <div style={{ background: '#101216', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Caricamento...</div>;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div style={{ background: '#101216', height: '100vh', color: '#e8eaed', fontFamily: 'Arial, sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* HEADER */}
        <header style={{ height: 76, minHeight: 76, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: '#181b20', borderBottom: '1px solid #30343b', zIndex: 100, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>

            {/* MENU HAMBURGER */}
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button onClick={() => setMenuAperto(!menuAperto)}
                style={{ width: 36, height: 36, border: '1px solid #343941', borderRadius: 6, background: menuAperto ? '#2a2f36' : 'transparent', color: '#aeb3bb', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <span style={{ width: 16, height: 2, background: '#aeb3bb', borderRadius: 2, display: 'block' }} />
                <span style={{ width: 16, height: 2, background: '#aeb3bb', borderRadius: 2, display: 'block' }} />
                <span style={{ width: 16, height: 2, background: '#aeb3bb', borderRadius: 2, display: 'block' }} />
              </button>
              {menuAperto && (
                <div style={{ position: 'absolute', top: 44, left: 0, width: 240, background: '#13161b', border: '1px solid #252930', borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 9999, overflow: 'hidden' }}>
                  {gruppi.map((gruppo, gi) => (
                    <div key={gruppo}>
                      {gi > 0 && <div style={{ height: 1, background: '#1e2229', margin: '4px 0' }} />}
                      <div style={{ padding: '8px 14px 4px', color: '#3a3f47', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 }}>{gruppo}</div>
                      {MENU_VOCI.filter(v => v.gruppo === gruppo).map(voce => (
                        <button key={voce.id} onClick={() => handleVoceMenu(voce.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 14px', border: 'none', background: 'transparent', color: '#8b919a', fontSize: 12, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'background 0.15s, color 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#1e2229'; e.currentTarget.style.color = '#e8eaed'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8b919a'; }}>
                          <span style={{ fontSize: 10, color: '#B06700' }}>{voce.icona}</span>
                          <span>{voce.titolo}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ width: 42, height: 42, borderRadius: 8, background: '#e5e7eb', color: '#111318', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 20 }}>GF</div>
            <div>
              <h1 style={{ fontSize: 20, letterSpacing: 1.5, color: '#fff', margin: 0 }}>GESTIONE FLOTTA</h1>
              <span style={{ fontSize: 11, color: '#B06700', textTransform: 'uppercase', letterSpacing: 1 }}>Memento</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>

            {/* CAMPANELLA NOTIFICHE */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button onClick={() => setPannelloNotifiche(!pannelloNotifiche)}
                style={{ width: 36, height: 36, border: '1px solid #343941', borderRadius: 6, background: pannelloNotifiche ? '#2a2f36' : 'transparent', color: notifiche.length > 0 ? '#f59e0b' : '#aeb3bb', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                🔔
                {notifiche.length > 0 && (
                  <span style={{ position: 'absolute', top: 4, right: 4, width: 16, height: 16, background: '#ff0000', borderRadius: '50%', fontSize: 9, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {notifiche.length > 9 ? '9+' : notifiche.length}
                  </span>
                )}
              </button>
              {pannelloNotifiche && (
                <div style={{ position: 'absolute', top: 44, right: 0, width: 320, background: '#13161b', border: '1px solid #252930', borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 9999, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e2229', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>🔔 Notifiche scadenze</span>
                    <button onClick={() => { setPannelloNotifiche(false); setPagina('scadenzario'); }}
                      style={{ background: 'transparent', border: 'none', color: '#2d7ff9', fontSize: 10, cursor: 'pointer' }}>Vedi tutte →</button>
                  </div>
                  {notifiche.length === 0 ? (
                    <div style={{ padding: 20, textAlign: 'center', color: '#656b74', fontSize: 11 }}>Nessuna notifica</div>
                  ) : (
                    notifiche.slice(0, 8).map(n => {
                      const scad = n.data_scadenza ? new Date(n.data_scadenza) : null;
                      const oggi = new Date(); oggi.setHours(0, 0, 0, 0);
                      const scaduta = scad && scad < oggi;
                      return (
                        <div key={n.id} style={{ padding: '10px 16px', borderBottom: '1px solid #1e2229', cursor: 'pointer' }}
                          onClick={() => { setPannelloNotifiche(false); setPagina('scadenzario'); }}
                          onMouseEnter={e => e.currentTarget.style.background = '#1e2229'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <div style={{ color: scaduta ? '#ff0000' : '#f59e0b', fontSize: 10, fontWeight: 700 }}>
                            {scaduta ? '🔴 SCADUTA' : '🟠 IN SCADENZA'}
                          </div>
                          <div style={{ color: '#fff', fontSize: 11, fontWeight: 600, marginTop: 2 }}>{n.cod_univoco || '-'} — {n.tipo_titolo || 'Scadenza'}</div>
                          <div style={{ color: '#656b74', fontSize: 10, marginTop: 1 }}>
                            Scade: {scad ? scad.toLocaleDateString('it-IT') : '-'}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {[['Mezzi totali', totale], ['Fermi', fermi], ['In officina', inOfficina]].map(([label, val]) => (
              <div key={label} style={{ minWidth: 110, padding: '8px 14px', background: '#20242a', border: '1px solid #343941', borderRadius: 7, textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: 10, color: '#8b919a', textTransform: 'uppercase', letterSpacing: 0.7 }}>{label}</span>
                <span style={{ display: 'block', marginTop: 3, fontSize: 20, fontWeight: 700, color: '#fff' }}>{val}</span>
              </div>
            ))}
          </div>
        </header>

        {/* CONTENUTO */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '14px 18px', gap: 14 }}>

          <div style={{ display: 'flex', alignItems: 'center', height: 25, flexShrink: 0 }}>
            <h2 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.4, color: '#aeb3bb', margin: 0 }}>Centri di costo</h2>
          </div>
          <Droppable droppableId="CDC_CONTAINER" direction="horizontal" type="COLONNA_CDC">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps}
                style={{ display: 'flex', gap: 8, overflowX: 'auto', overflowY: 'hidden', paddingBottom: 4, flex: '0 0 calc(62% - 25px)', alignItems: 'stretch' }}>
                {centri.map((cdc, index) => (
                  <Draggable key={cdc.id} draggableId={'COL_CDC_' + cdc.id} index={index}>
                    {(provided, snapshot) => (
                      <div ref={provided.innerRef} {...provided.draggableProps} style={{ flex: '0 0 150px', minWidth: 150, height: '100%', ...provided.draggableProps.style }}>
                        <Colonna colonna={cdc} tipo="CENTRO_COSTO" mezzi={mezzi.filter(m => m.id_colonna === cdc.id)}
                          isCantiere={cdc.id === CANTIERE_ID} onMezzoClick={setMezzoSelezionato}
                          onModifica={() => setModale({ tipo: 'CDC', azione: 'modifica', dati: { ...cdc } })}
                          onElimina={() => setModale({ tipo: 'CDC', azione: 'elimina', dati: { ...cdc } })}
                          dragHandleProps={provided.dragHandleProps} isDragging={snapshot.isDragging} />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          <div style={{ display: 'flex', alignItems: 'center', height: 25, flexShrink: 0 }}>
            <h2 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.4, color: '#aeb3bb', margin: 0 }}>Officine</h2>
          </div>
          <Droppable droppableId="OFF_CONTAINER" direction="horizontal" type="COLONNA_OFF">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps}
                style={{ display: 'flex', gap: 8, overflowX: 'auto', overflowY: 'hidden', paddingBottom: 4, flex: '0 0 calc(35% - 25px)', alignItems: 'stretch' }}>
                {officine.map((off, index) => (
                  <Draggable key={off.id} draggableId={'COL_OFF_' + off.id} index={index}>
                    {(provided, snapshot) => (
                      <div ref={provided.innerRef} {...provided.draggableProps} style={{ flex: '0 0 150px', minWidth: 150, height: '100%', ...provided.draggableProps.style }}>
                        <Colonna colonna={off} tipo="OFFICINA" mezzi={mezzi.filter(m => m.id_colonna === off.id)}
                          isCantiere={false} onMezzoClick={setMezzoSelezionato}
                          onModifica={() => setModale({ tipo: 'OFF', azione: 'modifica', dati: { ...off } })}
                          onElimina={() => setModale({ tipo: 'OFF', azione: 'elimina', dati: { ...off } })}
                          dragHandleProps={provided.dragHandleProps} isDragging={snapshot.isDragging} />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

        </div>

        {/* MODALE CDC/OFF */}
        {modale && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(5,7,10,.78)', padding: 20 }}>
            <div style={{ width: 'min(460px, 96vw)', background: '#1c2025', border: '1px solid #3b414a', borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid #343941' }}>
                <div style={{ color: '#fff', fontSize: 14, fontWeight: 800, letterSpacing: 1 }}>
                  {modale.azione === 'elimina' ? 'ELIMINA' : modale.azione === 'nuovo' ? 'NUOVO' : 'MODIFICA'}{' '}
                  {modale.tipo === 'CDC' ? 'CENTRO DI COSTO' : 'OFFICINA'}
                </div>
                <button onClick={() => setModale(null)} style={{ width: 30, height: 30, border: 0, background: 'transparent', color: '#9da3ac', fontSize: 22, cursor: 'pointer' }}>×</button>
              </div>
              <div style={{ padding: 20 }}>
                {modale.azione === 'elimina' ? (
                  <div style={{ color: '#aeb4bc', fontSize: 13, lineHeight: 1.8 }}>
                    Sei sicuro di voler eliminare <strong style={{ color: '#fff' }}>{modale.dati.titolo}</strong>?
                    <br /><span style={{ color: '#f59e0b', fontSize: 12 }}>⚠️ Tutti i mezzi verranno spostati in <strong>CANTIERE</strong>.</span>
                  </div>
                ) : (
                  <>
                    {modale.dati.id !== CANTIERE_ID && (<>
                      <label style={{ display: 'block', marginBottom: 6, color: '#b9bec6', fontSize: 11, textTransform: 'uppercase' }}>Titolo *</label>
                      <input style={stileInput} type="text" value={modale.dati.titolo || ''} onChange={e => setModale({ ...modale, dati: { ...modale.dati, titolo: e.target.value } })} placeholder="Nome..." autoFocus />
                    </>)}
                    {modale.dati.id === CANTIERE_ID && <div style={{ color: '#f59e0b', fontSize: 12, marginBottom: 12, padding: '8px 10px', background: '#24282e', borderRadius: 5 }}>⚠️ CANTIERE è protetto. Puoi modificare solo il coordinatore.</div>}
                    {modale.tipo === 'CDC' && (<>
                      <label style={{ display: 'block', marginBottom: 6, color: '#b9bec6', fontSize: 11, textTransform: 'uppercase' }}>Coordinatore</label>
                      <input style={stileInput} type="text" value={modale.dati.coordinatore || ''} onChange={e => setModale({ ...modale, dati: { ...modale.dati, coordinatore: e.target.value } })} placeholder="Nome coordinatore..." autoFocus={modale.dati.id === CANTIERE_ID} />
                    </>)}
                    {modale.tipo === 'OFF' && (<>
                      <label style={{ display: 'block', marginBottom: 6, color: '#b9bec6', fontSize: 11, textTransform: 'uppercase' }}>Telefono</label>
                      <input style={stileInput} type="tel" value={modale.dati.telefono || ''} onChange={e => setModale({ ...modale, dati: { ...modale.dati, telefono: e.target.value } })} placeholder="Es. 0984 123456..." />
                    </>)}
                  </>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '15px 20px', borderTop: '1px solid #343941' }}>
                <button onClick={() => setModale(null)} style={stileBtnS}>Annulla</button>
                <button onClick={salvaModale} disabled={salvando} style={modale.azione === 'elimina' ? { ...stileBtnP, background: '#c0392b', border: '1px solid #c0392b', color: '#fff' } : stileBtnP}>
                  {salvando ? 'Salvataggio...' : modale.azione === 'elimina' ? 'Elimina' : 'Salva'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODALE SPOSTAMENTO */}
        {spostamento && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(5,7,10,.78)', padding: 20 }}>
            <div style={{ width: 'min(500px, 96vw)', background: '#1c2025', border: '1px solid #3b414a', borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid #343941' }}>
                <div>
                  <div style={{ color: '#fff', fontSize: 14, fontWeight: 800, letterSpacing: 1 }}>SPOSTAMENTO MEZZO</div>
                  <div style={{ marginTop: 4, color: '#818791', fontSize: 10, textTransform: 'uppercase' }}>Conferma operazione</div>
                </div>
                <button onClick={() => setSpostamento(null)} style={{ width: 30, height: 30, border: 0, background: 'transparent', color: '#9da3ac', fontSize: 22, cursor: 'pointer' }}>×</button>
              </div>
              <div style={{ padding: 20 }}>
                <div style={{ marginBottom: 16, padding: 13, background: '#24282e', border: '1px solid #363c44', borderRadius: 5, color: '#aeb4bc', fontSize: 12, lineHeight: 1.5 }}>
                  Il mezzo verrà spostato in:
                  <strong style={{ display: 'block', marginTop: 5, color: '#fff', fontSize: 14 }}>{spostamento.nomeColonna}</strong>
                </div>
                <label style={{ display: 'block', marginBottom: 7, color: '#b9bec6', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>Motivazione obbligatoria</label>
                <textarea rows={5} placeholder="Inserisci la motivazione..." value={motivazione} onChange={e => setMotivazione(e.target.value)} autoFocus
                  style={{ width: '100%', background: '#12151a', color: '#fff', border: '1px solid #3b414a', borderRadius: 5, padding: '11px 12px', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '15px 20px', borderTop: '1px solid #343941' }}>
                <button onClick={() => setSpostamento(null)} style={stileBtnS}>Annulla</button>
                <button onClick={confermaSpostamento} disabled={salvando} style={stileBtnP}>{salvando ? 'Salvataggio...' : 'Conferma spostamento'}</button>
              </div>
            </div>
          </div>
        )}

        {nuovoMezzo && <NuovoMezzo onChiudi={() => setNuovoMezzo(false)} onAggiorna={caricaDati} />}
        {mezzoSelezionato && <SchedaMezzo idMezzo={mezzoSelezionato} onChiudi={() => setMezzoSelezionato(null)} onAggiorna={caricaDati} cantiereId={CANTIERE_ID} />}

      </div>
    </DragDropContext>
  );
}

function Colonna({ colonna, tipo, mezzi, onMezzoClick, onModifica, onElimina, dragHandleProps, isDragging, isCantiere }) {
  const [hover, setHover] = useState(false);
  const coloriStato = {
    'BUONO': '#4ade80', 'MEDIO': '#228b22', 'BASSO': '#ff8c00',
    'CRITICO': '#ff0000', 'IN_OFFICINA': '#f59e0b',
    'NOLEGGIO': '#00ffff', 'USOFRUTTO': '#ff00ff',
    'FERMO': '#ff0000', 'DA ROTTAMARE': '#ff0000'
  };
  return (
    <div style={{ height: '100%', background: '#191c21', border: isDragging ? '2px solid #2d7ff9' : '1px solid #343941', borderRadius: 6, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div {...dragHandleProps}
        style={{ minHeight: 64, padding: 10, background: hover ? '#c47200' : '#B06700', borderBottom: '1px solid #343941', position: 'relative', transition: 'background 0.15s', cursor: 'grab', flexShrink: 0 }}
        onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
        <div style={{ color: '#fff', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', lineHeight: 1.3, paddingRight: hover ? 46 : 0 }}>{colonna.titolo}</div>
        {tipo === 'CENTRO_COSTO' && colonna.coordinatore && <div style={{ marginTop: 5, color: '#fff', fontSize: 10 }}>Coord.: {colonna.coordinatore}</div>}
        {tipo === 'OFFICINA' && colonna.telefono && <div style={{ marginTop: 5, color: '#fff', fontSize: 10 }}>Tel.: {colonna.telefono}</div>}
        {hover && (
          <div style={{ position: 'absolute', top: 6, right: 6, display: 'flex', gap: 3 }}>
            <button onClick={e => { e.stopPropagation(); onModifica(); }} style={{ width: 22, height: 22, border: 'none', borderRadius: 4, background: '#2d7ff9', color: '#fff', fontSize: 10, cursor: 'pointer' }}>✏️</button>
            {!isCantiere && <button onClick={e => { e.stopPropagation(); onElimina(); }} style={{ width: 22, height: 22, border: 'none', borderRadius: 4, background: '#c0392b', color: '#fff', fontSize: 10, cursor: 'pointer' }}>🗑️</button>}
          </div>
        )}
      </div>
      <Droppable droppableId={colonna.id} type="MEZZO">
        {(provided, snapshot) => (
          <div ref={provided.innerRef} {...provided.droppableProps}
            style={{ flex: 1, padding: 8, overflowY: 'auto', minHeight: 0, background: snapshot.isDraggingOver ? '#292e35' : 'transparent', transition: 'background 0.15s ease' }}>
            {mezzi.map((mezzo, index) => (
              <Draggable key={mezzo.id} draggableId={mezzo.id} index={index}>
                {(provided, snapshot) => (
                  <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                    onClick={() => onMezzoClick(mezzo.id)}
                    style={{ marginBottom: 7, padding: '10px 8px', background: snapshot.isDragging ? '#30353c' : '#252930', border: '1px solid #3a3f47', borderRadius: 5, cursor: 'pointer', opacity: snapshot.isDragging ? 0.85 : 1, ...provided.draggableProps.style }}>
                    <div style={{ color: '#fff', fontSize: 14, fontWeight: 800, letterSpacing: 1, textAlign: 'center' }}>{mezzo.targa}</div>
                    <div style={{ marginTop: 5, fontSize: 9, textAlign: 'center', textTransform: 'uppercase', color: coloriStato[mezzo.stato] || '#8f969f' }}>
                      {mezzo.stato === 'IN_OFFICINA' ? 'IN OFFICINA' : mezzo.stato}
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
