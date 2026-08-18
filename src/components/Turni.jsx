import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { Card, EmptyState, ScheletroCaricamento, IntestazioneSezione, pulsanteFantasma, IconaCalendario } from './ui'

const FASCE = ['mattina', 'pomeriggio', 'sera', 'riposo']
const LABEL_FASCIA = { mattina: 'Mattina', pomeriggio: 'Pomeriggio', sera: 'Sera', riposo: 'Riposo' }
const COLORE_FASCIA = { mattina: 'var(--miele)', pomeriggio: 'var(--blu-cielo)', sera: 'var(--viola)', riposo: 'var(--mocha)' }
const COLORE_FASCIA_CHIARO = { mattina: 'var(--miele-chiaro)', pomeriggio: 'var(--blu-cielo-chiaro)', sera: 'var(--viola-chiaro)', riposo: 'var(--bordo-chiaro)' }
const GIORNI_BREVI = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']
const GIORNI_LABEL = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica']

function inizioSettimana(data) {
  const d = new Date(data)
  const giorno = d.getDay() || 7
  d.setDate(d.getDate() - giorno + 1)
  return d
}

function formattaData(d) {
  return d.toISOString().slice(0, 10)
}

function stessoGiorno(a, b) {
  return a.toDateString() === b.toDateString()
}

function formattaMeseAnno(data) {
  const testo = data.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
  return testo.charAt(0).toUpperCase() + testo.slice(1)
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
  const [dipendenti, setDipendenti] = useState([])
  const [turni, setTurni] = useState({})
  const [mese, setMese] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [caricamento, setCaricamento] = useState(true)
  const [giornoSelezionato, setGiornoSelezionato] = useState(formattaData(new Date()))

  const oggi = new Date()
  const giorniGriglia = generaGriglia(mese)
  const settimane = Array.from({ length: giorniGriglia.length / 7 }, (_, i) => giorniGriglia.slice(i * 7, i * 7 + 7))

  useEffect(() => {
    supabase.from('dipendenti').select('*').order('nome').then(({ data }) => setDipendenti(data || []))
  }, [])

  useEffect(() => {
    caricaTurni()
  }, [mese])

  async function caricaTurni() {
    setCaricamento(true)
    const dal = formattaData(giorniGriglia[0])
    const al = formattaData(giorniGriglia[giorniGriglia.length - 1])
    const { data } = await supabase.from('turni').select('*').gte('giorno', dal).lte('giorno', al)
    const mappa = {}
    ;(data || []).forEach(t => {
      const chiave = `${t.dipendente_id}_${t.giorno}`
      ;(mappa[chiave] ||= []).push(t.fascia)
    })
    setTurni(mappa)
    setCaricamento(false)
  }

  // Ogni fascia è indipendente: un dipendente può averne più di una nello stesso giorno.
  async function toggleFascia(dipendente_id, giorno, fascia, attualmenteAttiva) {
    const chiave = `${dipendente_id}_${giorno}`
    if (attualmenteAttiva) {
      setTurni(prev => ({ ...prev, [chiave]: (prev[chiave] || []).filter(f => f !== fascia) }))
      await supabase.from('turni').delete().match({ dipendente_id, giorno, fascia })
    } else {
      setTurni(prev => ({ ...prev, [chiave]: [...(prev[chiave] || []), fascia] }))
      await supabase.from('turni').upsert({ azienda_id, dipendente_id, giorno, fascia }, { onConflict: 'dipendente_id,giorno,fascia' })
    }
  }

  // "Riposo" non è un valore salvato: significa solo togliere tutte le fasce di quel giorno.
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
      <IntestazioneSezione titolo="Turni" sottotitolo="Calendario mensile della squadra" />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <button onClick={mesePrecedente} style={pulsanteFantasma}>← Mese prec.</button>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, color: 'var(--espresso)' }}>
          {formattaMeseAnno(mese)}
        </span>
        <button onClick={meseSuccessivo} style={pulsanteFantasma}>Mese succ. →</button>
      </div>

      {caricamento && <ScheletroCaricamento righe={4} />}

      {!caricamento && dipendenti.length === 0 && (
        <EmptyState icona={<IconaCalendario />} titolo="Nessun dipendente da pianificare"
          sottotitolo="Aggiungi prima qualcuno nella sezione Dipendenti." />
      )}

      {!caricamento && dipendenti.length > 0 && (
        <>
          <Card style={{ padding: 10, marginBottom: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
              {GIORNI_BREVI.map(g => (
                <span key={g} style={{ textAlign: 'center', fontSize: 11, color: 'var(--mocha)', fontWeight: 600 }}>{g}</span>
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
                    (turni[`${dip.id}_${giorno}`] || []).map(f => ({ chiave: `${dip.id}_${f}`, colore: COLORE_FASCIA[f] }))
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {dipendenti.map(dip => {
                  const fasceAttive = turni[`${dip.id}_${giornoSelezionato}`] || []
                  return (
                    <div key={dip.id}>
                      <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 600, color: 'var(--espresso)' }}>{dip.nome}</p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                        {FASCE.map(f => {
                          const selezionata = f === 'riposo' ? fasceAttive.length === 0 : fasceAttive.includes(f)
                          return (
                            <button
                              key={f}
                              disabled={!puoGestire}
                              onClick={() => f === 'riposo'
                                ? impostaRiposo(dip.id, giornoSelezionato)
                                : toggleFascia(dip.id, giornoSelezionato, f, selezionata)}
                              style={{
                                padding: '8px 2px', borderRadius: 8, border: 'none',
                                background: selezionata ? COLORE_FASCIA[f] : COLORE_FASCIA_CHIARO[f],
                                color: selezionata ? '#FFFFFF' : 'var(--espresso)',
                                fontSize: 11, fontWeight: selezionata ? 700 : 500,
                              }}
                            >
                              {LABEL_FASCIA[f]}
                            </button>
                          )
                        })}
                      </div>
                      {fasceAttive.length > 1 && (
                        <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--mocha)' }}>
                          Turno spezzato: {fasceAttive.map(f => LABEL_FASCIA[f]).join(' + ')}
                        </p>
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
