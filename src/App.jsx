import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Login from './components/Login'
import SceltaLingua from './components/SceltaLingua'
import SceltaSede from './components/SceltaSede'
import Aiuto from './components/Aiuto'
import Inventario from './components/Inventario'
import Vendite from './components/Vendite'
import Dipendenti from './components/Dipendenti'
import Timbratura from './components/Timbratura'
import Turni from './components/Turni'
import Fatture from './components/Fatture'
import { IconaScatola, IconaGrafico, IconaPersone, IconaOrologio, IconaCalendario, IconaScontrino } from './components/ui'
import { useLingua } from './i18n'

const RUOLI_GESTIONE = ['responsabile', 'titolare', 'admin']
const CHIAVE_SEDE_SALVATA = 'sede_attiva_azienda_id'

export default function App() {
  const { t, lingua, linguaScelta, setLingua } = useLingua()
  const [session, setSession] = useState(undefined)
  const [sedi, setSedi] = useState(undefined)
  const [sedeAttiva, setSedeAttiva] = useState(null)
  const [tab, setTab] = useState(null)
  const [mostraAiuto, setMostraAiuto] = useState(false)

  const TUTTE_LE_SEZIONI = [
    { id: 'inventario', label: t('app.tabInventario'), Icona: IconaScatola, soloGestione: true },
    { id: 'vendite', label: t('app.tabVendite'), Icona: IconaGrafico, soloGestione: true },
    { id: 'dipendenti', label: t('app.tabDipendenti'), Icona: IconaPersone, soloGestione: true },
    { id: 'timbratura', label: t('app.tabTimbratura'), Icona: IconaOrologio, soloGestione: false },
    { id: 'turni', label: t('app.tabTurni'), Icona: IconaCalendario, soloGestione: false },
    { id: 'fatture', label: t('app.tabFatture'), Icona: IconaScontrino, soloGestione: true },
  ]

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) {
      setSedi(undefined)
      setSedeAttiva(null)
      return
    }
    supabase.from('profili').select('id, azienda_id, ruolo, nome, aziende(nome)').eq('utente_id', session.user.id)
      .then(({ data }) => setSedi(data || []))
  }, [session])

  useEffect(() => {
    if (!sedi || sedi.length === 0) return
    if (sedi.length === 1) {
      sceglisede(sedi[0])
      return
    }
    const salvata = localStorage.getItem(CHIAVE_SEDE_SALVATA)
    const trovata = salvata && sedi.find(s => s.azienda_id === salvata)
    if (trovata) sceglisede(trovata)
  }, [sedi])

  function sceglisede(sede) {
    localStorage.setItem(CHIAVE_SEDE_SALVATA, sede.azienda_id)
    setSedeAttiva(sede)
  }

  function cambiaSede() {
    setSedeAttiva(null)
  }

  if (session === undefined) return null
  if (!session) return <Login />
  if (!linguaScelta) return <SceltaLingua onScegli={setLingua} />
  if (sedi === undefined) return <SchermataCaricamento />

  if (sedi.length === 0) {
    return (
      <SchermataMessaggio
        titolo={t('app.nessunAccesso')}
        messaggio={t('app.nessunAccessoMsg')}
      />
    )
  }

  if (!sedeAttiva) {
    return <SceltaSede sedi={sedi} onScegli={sceglisede} />
  }

  if (mostraAiuto) {
    return <Aiuto onChiudi={() => setMostraAiuto(false)} />
  }

  const puoGestire = RUOLI_GESTIONE.includes(sedeAttiva.ruolo)
  const sezioni = TUTTE_LE_SEZIONI.filter(s => !s.soloGestione || puoGestire)
  const tabIniziale = puoGestire ? 'inventario' : 'timbratura'
  const tabAttivo = sezioni.find(s => s.id === tab) ? tab : tabIniziale

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1.1rem 1.25rem', position: 'sticky', top: 0, zIndex: 5,
        background: 'var(--crema)', borderBottom: '1px solid var(--bordo-chiaro)',
      }}>
        <div>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 19, color: 'var(--espresso)', margin: 0 }}>
            {t('app.nomeApp')}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {sedi.length > 1 && (
              <button onClick={cambiaSede} style={pulsanteSede}>
                {sedeAttiva.aziende?.nome || t('app.sede')} · {t('app.cambia')}
              </button>
            )}
            <button onClick={() => setLingua(lingua === 'it' ? 'de' : 'it')} style={pulsanteSede} title="🇮🇹/🇩🇪">
              {lingua === 'it' ? '🇮🇹' : '🇩🇪'}
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => setMostraAiuto(true)} title={t('aiuto.titolo')} style={pulsanteAiuto}>?</button>
          <button onClick={() => supabase.auth.signOut()} style={pulsanteEsci}>{t('comune.esci')}</button>
        </div>
      </header>

      <main style={{ flex: 1, width: '100%', maxWidth: 720, margin: '0 auto', padding: '1.25rem 1.25rem 5.5rem', boxSizing: 'border-box' }}>
        {tabAttivo === 'inventario' && <Inventario azienda_id={sedeAttiva.azienda_id} puoGestire={puoGestire} />}
        {tabAttivo === 'vendite' && <Vendite azienda_id={sedeAttiva.azienda_id} />}
        {tabAttivo === 'dipendenti' && <Dipendenti azienda_id={sedeAttiva.azienda_id} puoGestire={puoGestire} />}
        {tabAttivo === 'timbratura' && <Timbratura azienda_id={sedeAttiva.azienda_id} puoGestire={puoGestire} utenteId={session.user.id} />}
        {tabAttivo === 'turni' && <Turni azienda_id={sedeAttiva.azienda_id} puoGestire={puoGestire} />}
        {tabAttivo === 'fatture' && <Fatture azienda_id={sedeAttiva.azienda_id} />}
      </main>

      <nav style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 5,
        display: 'flex', justifyContent: 'center',
        background: 'var(--bianco)', borderTop: '1px solid var(--bordo-chiaro)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        <div style={{ display: 'flex', width: '100%', maxWidth: 720 }}>
          {sezioni.map(s => {
            const attivo = tabAttivo === s.id
            return (
              <button
                key={s.id}
                onClick={() => setTab(s.id)}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  padding: '10px 4px 8px', border: 'none', background: 'transparent',
                  color: attivo ? 'var(--pistacchio)' : 'var(--mocha)',
                }}
              >
                <div style={{ width: 22, height: 22 }}><s.Icona /></div>
                <span style={{ fontSize: 11, fontWeight: attivo ? 600 : 500 }}>{s.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

function SchermataCaricamento() {
  const { t } = useLingua()
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p className="caricamento-pulse" style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--mocha)' }}>
        {t('app.caricamento')}
      </p>
    </div>
  )
}

function SchermataMessaggio({ titolo, messaggio }) {
  const { t } = useLingua()
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
      <div>
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, color: 'var(--espresso)', margin: '0 0 8px' }}>{titolo}</p>
        <p style={{ fontSize: 14, color: 'var(--mocha)', margin: '0 0 20px', maxWidth: 320 }}>{messaggio}</p>
        <button onClick={() => supabase.auth.signOut()} style={pulsanteEsci}>{t('comune.esci')}</button>
      </div>
    </div>
  )
}

const pulsanteEsci = {
  background: 'transparent', border: '1px solid var(--bordo)', borderRadius: 8,
  padding: '6px 14px', fontSize: 13, color: 'var(--mocha)',
}

const pulsanteAiuto = {
  background: 'var(--pistacchio-chiaro)', border: 'none', borderRadius: '50%',
  width: 30, height: 30, fontSize: 14, fontWeight: 700, color: 'var(--pistacchio-scuro)',
}

const pulsanteSede = {
  background: 'transparent', border: 'none', padding: 0, marginTop: 2,
  fontSize: 12, color: 'var(--pistacchio)', fontWeight: 500,
}
