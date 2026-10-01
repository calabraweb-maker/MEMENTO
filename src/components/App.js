import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import Login from './components/Login';
import Home from './components/Home';
import Dashboard from './components/Dashboard';
import ElencoMezzi from './components/ElencoMezzi';
import Scadenzario from './components/Scadenzario';
import SchedaMezzo from './components/SchedaMezzo';

const CANTIERE_ID = 'CC001';

export default function App() {
  const [utente, setUtente] = useState(null);
  const [pagina, setPagina] = useState('home');
  const [notifiche, setNotifiche] = useState([]);
  const [mezzoSelezionato, setMezzoSelezionato] = useState(null);

  useEffect(() => {
    // controlla sessione salvata
    const sessione = sessionStorage.getItem('memento_utente');
    if (sessione) {
      try { setUtente(JSON.parse(sessione)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (utente) caricaNotifiche();
  }, [utente]);

  async function caricaNotifiche() {
    const { data } = await supabase.from('scadenze').select('*').order('data_scadenza');
    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);
    const allerte = (data || []).filter(s => {
      if (!s.data_avviso) return false;
      return new Date(s.data_avviso) <= oggi;
    });
    setNotifiche(allerte);
  }

  function handleLogin(u) {
    setUtente(u);
    sessionStorage.setItem('memento_utente', JSON.stringify(u));
    setPagina('home');
  }

  function handleLogout() {
    setUtente(null);
    sessionStorage.removeItem('memento_utente');
    setPagina('home');
  }

  function vaiA(dest) {
    setPagina(dest);
  }

  if (!utente) return <Login onLogin={handleLogin} />;

  if (pagina === 'home') {
    return (
      <>
        <Home utente={utente} onLogout={handleLogout} onVaiA={vaiA} notifiche={notifiche} />
        {mezzoSelezionato && <SchedaMezzo idMezzo={mezzoSelezionato} onChiudi={() => setMezzoSelezionato(null)} onAggiorna={caricaNotifiche} cantiereId={CANTIERE_ID} />}
      </>
    );
  }

  if (pagina === 'gestione_flotta') {
    return <Dashboard onTornaHome={() => vaiA('home')} utente={utente} onLogout={handleLogout} notificheEsterne={notifiche} onAggiornaNofifiche={caricaNotifiche} />;
  }

  if (pagina === 'elenco') {
    return (
      <>
        <ElencoMezzi onTorna={() => vaiA('home')} onApriScheda={setMezzoSelezionato} />
        {mezzoSelezionato && <SchedaMezzo idMezzo={mezzoSelezionato} onChiudi={() => setMezzoSelezionato(null)} onAggiorna={caricaNotifiche} cantiereId={CANTIERE_ID} />}
      </>
    );
  }

  if (pagina === 'scadenzario') {
    return <Scadenzario onTorna={() => vaiA('home')} />;
  }

  return <Home utente={utente} onLogout={handleLogout} onVaiA={vaiA} notifiche={notifiche} />;
}
