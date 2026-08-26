import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { Card, EmptyState, ScheletroCaricamento, IntestazioneSezione, pulsanteFantasma, PulsanteIcona, IconaCalendario, IconaCestino } from './ui'
import { useLingua } from '../i18n'

function inizioSettimana(d) {
  const x = new Date(d)
  const g = x.getDay() || 7
  x.setDate(x.getDate() - g + 1)
  return x
}

function formattaData(d) {
  return d.toISOString().slice(0, 10)
}

function stessoGiorno(a, b) {
  return a.toDateString() === b.toDateString()
}

// Colore del pallino nel calendario in base all'ora di inizio — solo estetico,
// non un dato salvato: prima delle 12 = "mattina", 12-17 = "pomeriggio", dopo = "sera".
function coloreOraInizio(oraInizio) {
  const ora = parseInt(oraInizio.slice(0, 2), 10)
  if (ora < 12) return 'var(--miele)'
  if (ora < 17) return 'var(--blu-cielo)'
  return 'var(--viola)'
}

// Tutti i giorni da mostrare in griglia: dal lunedì della settimana del giorno 1
// fino a completare l'ultima settimana che contiene l'ultimo giorno del mese.
function generaGriglia(meseRif) {
  const primoDelMese = new Date(meseRif.getFullYear(), meseRif.getMonth(), 1)
  const ultimoDelMese = new Date(meseRif.getFullYear(), meseRif.getMonth() + 1, 0)
  const giorni = []
  const cursore = inizioSettimana(primoDelMese)
  do {
    giorni.push(new Date(cursore))
    cursore.setDate(cursore.getDate() + 1)
  } while (cursore <= ultimoDelMese || giorni.length % 7 !== 0)
  return giorni
}

export default function Turni({ azienda_id, puoGestire }) {
  const { t, lingua } = useLingua()
  const GIORNI_BREVI = t('turni.giorniBrevi')
  const GIORNI_LABEL = t('turni.giorniLabel')

  function formattaMeseAnno(data) {
    const testo = data.toLocaleDateString(lingua === 'de' ? 'de-DE' : 'it-IT', { month: 'long', year: 'numeric' })
    return testo.charAt(0).toUpperCase() + testo.slice(1)
  }

  const [dipendenti, setDipendenti] = useState([])
  const [turni, setTurni] = useState({})
  const [mese, setMese] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [caricamento, setCaricamento] = useState(true)
  const [giornoSelezionato, setGiornoSelezionato] = useState(formattaData(new Date()))

  const oggi = new Date()
  const giorniGriglia = generaGriglia(mese)
  const settimane = Array.from({ length: giorniGriglia.length / 7 }, (_, i) => giorniGriglia.slice(i * 7, i * 7 + 7))

  useEffect(() => {
    supabase.from('dipendenti').select('*').eq('azienda_id', azienda_id).order('nome').then(({ data }) => setDipendenti(data || []))
  }, [])

  useEffect(() => {
    caricaTurni()
  }, [mese])

  async function caricaTurni() {
    setCaricamento(true)
    const dal = formattaData(giorniGriglia[0])
    const al = formattaData(giorniGriglia[giorniGriglia.length - 1])
    const { data } = await supabase.from('turni').select('*').eq('azienda_id', azienda_id).gte('giorno', dal).lte('giorno', al).order('ora_inizio')
    const mappa = {}
    ;(data || []).forEach(turno => {
      const chiave = `${turno.dipendente_id}_${turno.giorno}`
      ;(mappa[chiave] ||= []).push({ id: turno.id, ora_inizio: turno.ora_inizio.slice(0, 5), ora_fine: turno.ora_fine.slice(0, 5) })
    })
    setTurni(mappa)
    setCaricamento(false)
  }

  async function aggiungiTurno(dipendente_id, giorno) {
    const { data, error } = await supabase.from('turni')
      .insert({ azienda_id, dipendente_id, giorno, ora_inizio: '09:00', ora_fine: '13:00' })
      .select().single()
    if (error || !data) return
    const chiave = `${dipendente_id}_${giorno}`
    setTurni(prev => ({ ...prev, [chiave]: [...(prev[chiave] || []), { id: data.id, ora_inizio: '09:00', ora_fine: '13:00' }] }))
  }

  async function aggiornaTurno(dipendente_id, giorno, id, campo, valore) {
    const chiave = `${dipendente_id}_${giorno}`
    setTurni(prev => ({ ...prev, [chiave]: (prev[chiave] || []).map(tu => tu.id === id ? { ...tu, [campo]: valore } : tu) }))
    await supabase.from('turni').update({ [campo]: valore }).eq('id', id)
  }

  async function eliminaTurno(dipendente_id, giorno, id) {
    const chiave = `${dipendente_id}_${giorno}`
    setTurni(prev => ({ ...prev, [chiave]: (prev[chiave] || []).filter(tu => tu.id !== id) }))
    await supabase.from('turni').delete().eq('id', id)
  }

  // "Riposo" non è un valore salvato: significa solo togliere tutti i turni di quel giorno.
  async function impostaRiposo(dipendente_id, giorno) {
    const chiave = `${dipendente_id}_${giorno}`
    setTurni(prev => ({ ...prev, [chiave]: [] }))
    await supabase.from('turni').delete().match({ dipendente_id, giorno })
  }

  function mesePrecedente() {
    setMese(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))
    setGiornoSelezionato(null)
  }

  function meseSuccessivo() {
    setMese(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))
    setGiornoSelezionato(null)
  }

  const dettaglioData = giornoSelezionato ? giorniGriglia.find(d => formattaData(d) === giornoSelezionato) : null

  return (
    <div>
      <IntestazioneSezione titolo={t('turni.titolo')} sottotitolo={t('turni.sottotitolo')} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <button onClick={mesePrecedente} style={pulsanteFantasma}>{t('turni.mesePrec')}</button>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, color: 'var(--espresso)' }}>
          {formattaMeseAnno(mese)}
        </span>
        <button onClick={meseSuccessivo} style={pulsanteFantasma}>{t('turni.meseSucc')}</button>
      </div>

      {caricamento && <ScheletroCaricamento righe={4} />}

      {!caricamento && dipendenti.length === 0 && (
        <EmptyState icona={<IconaCalendario />} titolo={t('turni.nessunDipendente')}
          sottotitolo={t('turni.aggiungiDipendenti')} />
      )}

      {!caricamento && dipendenti.length > 0 && (
        <>
          <Card style={{ padding: 10, marginBottom: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
              {GIORNI_BREVI.map((g, i) => (
                <span key={i} style={{ textAlign: 'center', fontSize: 11, color: 'var(--mocha)', fontWeight: 600 }}>{g}</span>
              ))}
            </div>

            {settimane.map((settimana, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
                {settimana.map(d => {
                  const giorno = formattaData(d)
                  const fuoriMese = d.getMonth() !== mese.getMonth()
                  const isOggi = stessoGiorno(d, oggi)
                  const selezionato = giorno === giornoSelezionato
                  const puntiGiorno = dipendenti.flatMap(dip =>
                    (turni[`${dip.id}_${giorno}`] || []).map(tu => ({ chiave: `${dip.id}_${tu.id}`, colore: coloreOraInizio(tu.ora_inizio) }))
                  )

                  return (
                    <button
                      key={giorno}
                      onClick={() => setGiornoSelezionato(selezionato ? null : giorno)}
                      style={{
                        aspectRatio: '1', borderRadius: 8, border: isOggi ? '1.5px solid var(--pistacchio)' : '1px solid transparent',
                        background: selezionato ? 'var(--pistacchio)' : 'var(--crema)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                        padding: 2, opacity: fuoriMese ? 0.4 : 1,
                      }}
                    >
                      <span style={{ fontSize: 12, fontWeight: isOggi ? 700 : 500, color: selezionato ? '#FFFFFF' : 'var(--espresso)' }}>
                        {d.getDate()}
                      </span>
                      <span style={{ display: 'flex', gap: 2, height: 5, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 20 }}>
                        {puntiGiorno.slice(0, 6).map(p => (
                          <span key={p.chiave} style={{
                            width: 5, height: 5, borderRadius: '50%',
                            background: selezionato ? '#FFFFFF' : p.colore,
                          }} />
                        ))}
                      </span>
                    </button>
                  )
                })}
              </div>
            ))}
          </Card>

          {dettaglioData && (
            <Card style={{ padding: 16 }}>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, color: 'var(--espresso)', margin: '0 0 14px' }}>
                {GIORNI_LABEL[(dettaglioData.getDay() || 7) - 1]} {dettaglioData.getDate()}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {dipendenti.map(dip => {
                  const turniGiorno = turni[`${dip.id}_${giornoSelezionato}`] || []
                  return (
                    <div key={dip.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--espresso)' }}>{dip.nome}</p>
                        {puoGestire && turniGiorno.length > 0 && (
                          <button onClick={() => impostaRiposo(dip.id, giornoSelezionato)} style={{ ...pulsanteFantasma, padding: '4px 10px', fontSize: 11 }}>
                            {t('turni.riposo')}
                          </button>
                        )}
                      </div>

                      {turniGiorno.length === 0 ? (
                        <p style={{ margin: 0, fontSize: 12, color: 'var(--mocha)' }}>{t('turni.nessunTurno')}</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                          {turniGiorno.map(tu => (
                            <div key={tu.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: coloreOraInizio(tu.ora_inizio), flexShrink: 0 }} />
                              <input type="time" value={tu.ora_inizio} disabled={!puoGestire}
                                onChange={e => aggiornaTurno(dip.id, giornoSelezionato, tu.id, 'ora_inizio', e.target.value)}
                                style={{ flex: 1, minWidth: 0, borderRadius: 8, border: '1.5px solid var(--bordo)', padding: '7px 6px', fontSize: 13 }} />
                              <span style={{ color: 'var(--mocha)', fontSize: 12 }}>–</span>
                              <input type="time" value={tu.ora_fine} disabled={!puoGestire}
                                onChange={e => aggiornaTurno(dip.id, giornoSelezionato, tu.id, 'ora_fine', e.target.value)}
                                style={{ flex: 1, minWidth: 0, borderRadius: 8, border: '1.5px solid var(--bordo)', padding: '7px 6px', fontSize: 13 }} />
                              {puoGestire && (
                                <PulsanteIcona titolo={t('turni.eliminaTurno')} onClick={() => eliminaTurno(dip.id, giornoSelezionato, tu.id)}>
                                  <div style={{ width: 15, height: 15 }}><IconaCestino /></div>
                                </PulsanteIcona>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {puoGestire && (
                        <button onClick={() => aggiungiTurno(dip.id, giornoSelezionato)} style={{ ...pulsanteFantasma, fontSize: 12, padding: '6px 12px' }}>
                          {t('turni.aggiungiTurno')}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
