import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import {
  Card, Badge, EmptyState, ScheletroCaricamento, IntestazioneSezione,
  pulsanteFantasma, pulsantePrimario, PulsanteIcona,
  IconaCalendario, IconaCestino, IconaPiu,
} from './ui'
import { inizioMese, fineMese, formattaMese, perInputLocale, calcolaOre, statoAttuale } from './timbratureUtils'

export default function Timbratura({ azienda_id, puoGestire, utenteId }) {
  return puoGestire
    ? <VistaGestione azienda_id={azienda_id} />
    : <VistaPersonale azienda_id={azienda_id} utenteId={utenteId} />
}

function NavigatoreMese({ mese, onCambia }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
      <button onClick={() => onCambia(-1)} style={pulsanteFantasma}>← Prec.</button>
      <span style={{ fontSize: 13, color: 'var(--mocha)', fontWeight: 600 }}>{formattaMese(mese)}</span>
      <button onClick={() => onCambia(1)} style={pulsanteFantasma}>Succ. →</button>
    </div>
  )
}

function VistaPersonale({ azienda_id, utenteId }) {
  const [caricamento, setCaricamento] = useState(true)
  const [mioDipendente, setMioDipendente] = useState(null)
  const [ultimoEvento, setUltimoEvento] = useState(null)
  const [eventiMese, setEventiMese] = useState([])
  const [mese, setMese] = useState(new Date())
  const [azione, setAzione] = useState(false)

  useEffect(() => {
    supabase.from('dipendenti').select('id, nome').eq('utente_id', utenteId).eq('azienda_id', azienda_id).maybeSingle()
      .then(({ data }) => {
        setMioDipendente(data)
        setCaricamento(false)
      })
  }, [])

  useEffect(() => {
    if (mioDipendente) caricaEventi()
  }, [mioDipendente, mese])

  async function caricaEventi() {
    const [{ data: ultimo }, { data: mensili }] = await Promise.all([
      supabase.from('timbrature').select('tipo, orario').eq('dipendente_id', mioDipendente.id).order('orario', { ascending: false }).limit(1),
      supabase.from('timbrature').select('tipo, orario').eq('dipendente_id', mioDipendente.id)
        .gte('orario', inizioMese(mese).toISOString()).lte('orario', fineMese(mese).toISOString())
        .order('orario', { ascending: true }),
    ])
    setUltimoEvento(ultimo?.[0] || null)
    setEventiMese(mensili || [])
  }

  async function timbra(tipo) {
    setAzione(true)
    await supabase.from('timbrature').insert({ azienda_id, dipendente_id: mioDipendente.id, tipo })
    await caricaEventi()
    setAzione(false)
  }

  if (caricamento) return <ScheletroCaricamento righe={2} />

  if (!mioDipendente) {
    return (
      <div>
        <IntestazioneSezione titolo="Timbratura" />
        <EmptyState icona={<IconaCalendario />} titolo="Account non ancora collegato"
          sottotitolo="Il tuo utente non risulta collegato a nessun dipendente. Chiedi a chi gestisce l'attività di collegarlo." />
      </div>
    )
  }

  const stato = statoAttuale(ultimoEvento)
  const oreMese = calcolaOre(eventiMese)

  return (
    <div>
      <IntestazioneSezione titolo="Timbratura" sottotitolo={mioDipendente.nome} />

      <Card style={{ padding: '2rem 1.5rem', textAlign: 'center', marginBottom: 16 }}>
        <p style={{ margin: '0 0 4px', fontSize: 13, color: 'var(--mocha)' }}>
          {stato.alLavoro ? `Al lavoro dalle ${stato.dalle}` : 'Fuori turno'}
        </p>
        <button
          onClick={() => timbra(stato.alLavoro ? 'uscita' : 'entrata')}
          disabled={azione}
          style={{
            ...pulsantePrimario(stato.alLavoro ? 'var(--fragola)' : 'var(--pistacchio)'),
            width: 180, height: 180, borderRadius: '50%', fontSize: 20, margin: '12px auto 0',
          }}
        >
          {stato.alLavoro ? 'Segna uscita' : 'Segna entrata'}
        </button>
      </Card>

      <NavigatoreMese mese={mese} onCambia={d => setMese(m => new Date(m.getFullYear(), m.getMonth() + d, 1))} />

      <Card style={{ padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: 'var(--mocha)', fontWeight: 500 }}>Ore totali del mese</span>
        <span style={{ fontFamily: 'var(--font-dati)', fontSize: 24, color: 'var(--espresso)', fontWeight: 500 }}>{oreMese}</span>
      </Card>
    </div>
  )
}

function VistaGestione({ azienda_id }) {
  const [caricamento, setCaricamento] = useState(true)
  const [dipendenti, setDipendenti] = useState([])
  const [ultimiEventi, setUltimiEventi] = useState({})
  const [eventiMese, setEventiMese] = useState({})
  const [mese, setMese] = useState(new Date())
  const [azioneId, setAzioneId] = useState(null)
  const [correzioneApertaId, setCorrezioneApertaId] = useState(null)

  useEffect(() => {
    supabase.from('dipendenti').select('id, nome, costo_orario').order('nome').then(({ data }) => {
      setDipendenti(data || [])
      setCaricamento(false)
    })
  }, [])

  useEffect(() => {
    if (dipendenti.length > 0) caricaEventi()
  }, [dipendenti, mese])

  async function caricaEventi() {
    const [{ data: recenti }, { data: mensili }] = await Promise.all([
      supabase.from('timbrature').select('dipendente_id, tipo, orario').eq('azienda_id', azienda_id)
        .order('orario', { ascending: false }).limit(200),
      supabase.from('timbrature').select('id, dipendente_id, tipo, orario').eq('azienda_id', azienda_id)
        .gte('orario', inizioMese(mese).toISOString()).lte('orario', fineMese(mese).toISOString())
        .order('orario', { ascending: true }),
    ])

    const ultimi = {}
    ;(recenti || []).forEach(e => { if (!ultimi[e.dipendente_id]) ultimi[e.dipendente_id] = e })
    setUltimiEventi(ultimi)

    const perDipendente = {}
    ;(mensili || []).forEach(e => { (perDipendente[e.dipendente_id] ||= []).push(e) })
    setEventiMese(perDipendente)
  }

  async function timbra(dipendente_id, tipo) {
    setAzioneId(dipendente_id)
    await supabase.from('timbrature').insert({ azienda_id, dipendente_id, tipo })
    await caricaEventi()
    setAzioneId(null)
  }

  async function correggiEvento(id, campi) {
    await supabase.from('timbrature').update(campi).eq('id', id)
    await caricaEventi()
  }

  async function eliminaEvento(id) {
    if (!window.confirm('Eliminare questa timbratura? Non si può annullare.')) return
    await supabase.from('timbrature').delete().eq('id', id)
    await caricaEventi()
  }

  async function aggiungiCorrezione(dipendente_id, tipo, orarioLocale) {
    if (!orarioLocale) return
    await supabase.from('timbrature').insert({ azienda_id, dipendente_id, tipo, orario: new Date(orarioLocale).toISOString() })
    await caricaEventi()
  }

  return (
    <div>
      <IntestazioneSezione titolo="Timbratura" sottotitolo={caricamento ? undefined : `${dipendenti.length} dipendenti`} />

      {caricamento && <ScheletroCaricamento righe={3} />}

      {!caricamento && dipendenti.length === 0 && (
        <EmptyState icona={<IconaCalendario />} titolo="Nessun dipendente ancora"
          sottotitolo="Aggiungi prima qualcuno nella sezione Dipendenti." />
      )}

      {!caricamento && dipendenti.length > 0 && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {dipendenti.map(d => {
              const stato = statoAttuale(ultimiEventi[d.id])
              return (
                <Card key={d.id} style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: 'var(--espresso)' }}>{d.nome}</p>
                    {stato.alLavoro
                      ? <Badge>Al lavoro dalle {stato.dalle}</Badge>
                      : <span style={{ fontSize: 12, color: 'var(--mocha)' }}>Fuori turno</span>}
                  </div>
                  <button
                    onClick={() => timbra(d.id, stato.alLavoro ? 'uscita' : 'entrata')}
                    disabled={azioneId === d.id}
                    style={{ ...pulsanteFantasma, flexShrink: 0, background: stato.alLavoro ? 'var(--fragola-chiaro)' : 'var(--pistacchio-chiaro)', border: 'none', color: stato.alLavoro ? 'var(--fragola-scuro)' : 'var(--pistacchio-scuro)' }}
                  >
                    {stato.alLavoro ? 'Segna uscita' : 'Segna entrata'}
                  </button>
                </Card>
              )
            })}
          </div>

          <NavigatoreMese mese={mese} onCambia={d => setMese(m => new Date(m.getFullYear(), m.getMonth() + d, 1))} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {dipendenti.map(d => {
              const aperto = correzioneApertaId === d.id
              return (
                <Card key={d.id} style={{ padding: 0, overflow: 'hidden' }}>
                  <button
                    onClick={() => setCorrezioneApertaId(aperto ? null : d.id)}
                    style={{
                      width: '100%', background: 'transparent', border: 'none', padding: '14px 16px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--espresso)' }}>{d.nome}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontFamily: 'var(--font-dati)', fontSize: 15, color: 'var(--espresso)' }}>
                        {calcolaOre(eventiMese[d.id] || [])} ore
                        {d.costo_orario ? ` · ${(calcolaOre(eventiMese[d.id] || []) * d.costo_orario).toFixed(2)} €` : ''}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--pistacchio)', fontWeight: 500 }}>{aperto ? 'Chiudi' : 'Correggi'}</span>
                    </span>
                  </button>
                  {aperto && (
                    <PannelloCorrezione
                      dipendente={d}
                      eventi={eventiMese[d.id] || []}
                      onCorreggi={correggiEvento}
                      onElimina={eliminaEvento}
                      onAggiungi={aggiungiCorrezione}
                    />
                  )}
                </Card>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function PannelloCorrezione({ dipendente, eventi, onCorreggi, onElimina, onAggiungi }) {
  const [nuovoTipo, setNuovoTipo] = useState('entrata')
  const [nuovoOrario, setNuovoOrario] = useState('')

  return (
    <div style={{ borderTop: '1px solid var(--bordo-chiaro)', padding: '12px 16px 16px', background: 'var(--bordo-chiaro)' }}>
      {eventi.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--mocha)', margin: '0 0 12px' }}>Nessuna timbratura questo mese.</p>
      )}
      {eventi.map(e => (
        <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <select value={e.tipo} onChange={ev => onCorreggi(e.id, { tipo: ev.target.value })}
            style={{ borderRadius: 8, border: '1.5px solid var(--bordo)', padding: '8px 6px', fontSize: 13, background: 'var(--bianco)' }}>
            <option value="entrata">Entrata</option>
            <option value="uscita">Uscita</option>
          </select>
          <input type="datetime-local" value={perInputLocale(e.orario)}
            onChange={ev => ev.target.value && onCorreggi(e.id, { orario: new Date(ev.target.value).toISOString() })}
            style={{ flex: 1, minWidth: 0, borderRadius: 8, border: '1.5px solid var(--bordo)', padding: '8px 6px', fontSize: 13, background: 'var(--bianco)' }} />
          <PulsanteIcona titolo="Elimina timbratura" onClick={() => onElimina(e.id)}>
            <div style={{ width: 16, height: 16 }}><IconaCestino /></div>
          </PulsanteIcona>
        </div>
      ))}

      <p style={{ fontSize: 12, color: 'var(--mocha)', fontWeight: 600, margin: '12px 0 8px' }}>Aggiungi timbratura dimenticata</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <select value={nuovoTipo} onChange={e => setNuovoTipo(e.target.value)}
          style={{ borderRadius: 8, border: '1.5px solid var(--bordo)', padding: '8px 6px', fontSize: 13, background: 'var(--bianco)' }}>
          <option value="entrata">Entrata</option>
          <option value="uscita">Uscita</option>
        </select>
        <input type="datetime-local" value={nuovoOrario} onChange={e => setNuovoOrario(e.target.value)}
          style={{ flex: 1, minWidth: 0, borderRadius: 8, border: '1.5px solid var(--bordo)', padding: '8px 6px', fontSize: 13, background: 'var(--bianco)' }} />
        <PulsanteIcona titolo="Aggiungi" colore="var(--pistacchio)" onClick={() => { onAggiungi(dipendente.id, nuovoTipo, nuovoOrario); setNuovoOrario('') }}>
          <div style={{ width: 20, height: 20 }}><IconaPiu /></div>
        </PulsanteIcona>
      </div>
    </div>
  )
}
