import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import {
  Card, EmptyState, ScheletroCaricamento, IntestazioneSezione, pulsanteFantasma,
  SelettorePillole, GraficoBarre, inputStyle, IconaGrafico,
} from './ui'

const GIORNI_BREVI = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']
const MESI_BREVI = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']

function formattaData(d) {
  return d.toISOString().slice(0, 10)
}

function euro(v) {
  return `${Number(v || 0).toFixed(2)} €`
}

function inizioSettimana(d) {
  const x = new Date(d)
  const g = x.getDay() || 7
  x.setDate(x.getDate() - g + 1)
  return x
}

export default function Vendite({ azienda_id }) {
  const [vista, setVista] = useState('inserisci')

  return (
    <div>
      <IntestazioneSezione titolo="Vendite" sottotitolo="Incassi e andamento" />

      <div style={{ marginBottom: 16 }}>
        <SelettorePillole
          opzioni={[{ valore: 'inserisci', label: 'Inserisci' }, { valore: 'report', label: 'Report' }]}
          valore={vista}
          onCambia={setVista}
        />
      </div>

      {vista === 'inserisci' ? <VistaInserimento azienda_id={azienda_id} /> : <VistaReport azienda_id={azienda_id} />}
    </div>
  )
}

// Il fatturato del giorno è un unico numero (incassi_giornalieri.importo): lo si può
// scrivere direttamente, oppure farlo calcolare in automatico aprendo il dettaglio
// prodotto per prodotto — ogni modifica lì lo ricalcola e lo sovrascrive.
function VistaInserimento({ azienda_id }) {
  const [prodotti, setProdotti] = useState([])
  const [venditeGiorno, setVenditeGiorno] = useState({})
  const [incassoGiorno, setIncassoGiorno] = useState({ importo: null, costo: null })
  const [giorno, setGiorno] = useState(new Date())
  const [caricamento, setCaricamento] = useState(true)
  const [mostraPrezzi, setMostraPrezzi] = useState(false)
  const [mostraDettaglio, setMostraDettaglio] = useState(false)

  useEffect(() => {
    supabase.from('prodotti').select('id, nome, prezzo_vendita').order('nome').then(({ data }) => setProdotti(data || []))
  }, [])

  useEffect(() => {
    caricaGiorno()
  }, [giorno])

  async function caricaGiorno() {
    setCaricamento(true)
    const [{ data: vendite }, { data: incasso }] = await Promise.all([
      supabase.from('vendite').select('prodotto_id, quantita, importo').eq('giorno', formattaData(giorno)),
      supabase.from('incassi_giornalieri').select('importo, costo').eq('azienda_id', azienda_id).eq('giorno', formattaData(giorno)).maybeSingle(),
    ])
    const mappa = {}
    ;(vendite || []).forEach(v => { mappa[v.prodotto_id] = { quantita: v.quantita, importo: v.importo } })
    setVenditeGiorno(mappa)
    setIncassoGiorno(incasso || { importo: null, costo: null })
    setCaricamento(false)
  }

  async function aggiornaPrezzo(prodotto_id, prezzo_vendita) {
    setProdotti(prev => prev.map(p => p.id === prodotto_id ? { ...p, prezzo_vendita } : p))
    await supabase.from('prodotti').update({ prezzo_vendita }).eq('id', prodotto_id)
  }

  // Modificare una quantità aggiorna la riga del prodotto e ricalcola il totale del
  // giorno sommando tutti i prodotti, sovrascrivendo il fatturato del giorno.
  async function aggiornaQuantita(prodotto, quantita) {
    const importo = Math.round(quantita * (prodotto.prezzo_vendita || 0) * 100) / 100
    const nuoveVendite = { ...venditeGiorno, [prodotto.id]: { quantita, importo } }
    setVenditeGiorno(nuoveVendite)
    const { error } = await supabase.from('vendite').upsert({
      azienda_id, prodotto_id: prodotto.id, giorno: formattaData(giorno), quantita, importo,
    }, { onConflict: 'prodotto_id,giorno' })
    if (error) { alert('Errore nel salvataggio: ' + error.message); return }

    const totale = Object.values(nuoveVendite).reduce((s, v) => s + Number(v.importo || 0), 0)
    await salvaIncassoGiorno({ importo: totale })
  }

  async function salvaIncassoGiorno(campi) {
    const nuovo = { ...incassoGiorno, ...campi }
    setIncassoGiorno(nuovo)
    const { error } = await supabase.from('incassi_giornalieri').upsert({
      azienda_id, giorno: formattaData(giorno),
      importo: nuovo.importo, costo: nuovo.costo,
    }, { onConflict: 'azienda_id,giorno' })
    if (error) alert('Errore nel salvataggio: ' + error.message)
  }

  function giornoPrecedente() {
    setGiorno(g => { const x = new Date(g); x.setDate(x.getDate() - 1); return x })
  }

  function giornoSuccessivo() {
    setGiorno(g => { const x = new Date(g); x.setDate(x.getDate() + 1); return x })
  }

  const oggi = new Date()
  const isOggi = formattaData(giorno) === formattaData(oggi)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <button onClick={() => setMostraPrezzi(v => !v)} style={pulsanteFantasma}>
          {mostraPrezzi ? 'Chiudi' : 'Prezzi prodotto'}
        </button>
      </div>

      {mostraPrezzi && !caricamento && (
        <Card style={{ padding: '14px 16px', marginBottom: 16 }}>
          <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--espresso)' }}>Prezzi prodotto</p>
          <p style={{ margin: '0 0 12px', fontSize: 11, color: 'var(--mocha)' }}>Si impostano una volta sola, poi restano — servono solo per il dettaglio prodotto per prodotto.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {prodotti.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, color: 'var(--espresso)', flex: 1, minWidth: 90 }}>{p.nome}</span>
                <input type="number" min="0" step="0.10" value={p.prezzo_vendita ?? ''} placeholder="—"
                  onChange={e => aggiornaPrezzo(p.id, e.target.value ? Number(e.target.value) : null)}
                  style={{ width: 64, fontFamily: 'var(--font-dati)', fontSize: 13, border: '1.5px solid var(--bordo)', borderRadius: 6, padding: '4px 6px' }} />
                <span style={{ fontSize: 12, color: 'var(--mocha)' }}>€</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <button onClick={giornoPrecedente} style={pulsanteFantasma}>← Prec.</button>
        <span style={{ fontSize: 13, color: 'var(--mocha)', fontWeight: 600 }}>
          {isOggi ? 'Oggi' : giorno.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
        </span>
        <button onClick={giornoSuccessivo} disabled={isOggi} style={{ ...pulsanteFantasma, opacity: isOggi ? 0.4 : 1 }}>Succ. →</button>
      </div>

      {caricamento && <ScheletroCaricamento righe={4} />}

      {!caricamento && (
        <>
          <Card style={{ padding: '16px 20px', marginBottom: 14 }}>
            <label style={{ fontSize: 13, color: 'var(--mocha)', display: 'block', marginBottom: 8 }}>Fatturato di oggi</label>
            <input type="number" min="0" step="1" value={incassoGiorno.importo ?? ''} placeholder="0"
              onChange={e => salvaIncassoGiorno({ importo: e.target.value ? Number(e.target.value) : null })}
              style={{ ...inputStyle, marginBottom: 0, fontFamily: 'var(--font-dati)', fontSize: 24 }} />
          </Card>

          <Card style={{ padding: '12px 14px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 13, color: 'var(--espresso)', fontWeight: 500, flex: 1 }}>Costo del giorno</label>
              <input type="number" min="0" step="1" value={incassoGiorno.costo ?? ''} placeholder="—"
                onChange={e => salvaIncassoGiorno({ costo: e.target.value ? Number(e.target.value) : null })}
                style={{ width: 72, fontFamily: 'var(--font-dati)', fontSize: 14, border: '1.5px solid var(--bordo)', borderRadius: 8, padding: '6px 8px' }} />
              <span style={{ fontSize: 13, color: 'var(--mocha)' }}>€</span>
            </div>
            <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--mocha)' }}>Facoltativo — spesa in prodotto/materie prime, serve solo per il margine stimato nel Report.</p>
          </Card>

          <button onClick={() => setMostraDettaglio(v => !v)} style={{ ...pulsanteFantasma, width: '100%', marginBottom: mostraDettaglio ? 14 : 0 }}>
            {mostraDettaglio ? 'Nascondi dettaglio prodotto per prodotto' : '+ Dettaglio prodotto per prodotto'}
          </button>

          {mostraDettaglio && (
            prodotti.length === 0 ? (
              <EmptyState icona={<IconaGrafico />} titolo="Nessun prodotto ancora"
                sottotitolo="Aggiungi prima qualche prodotto nella sezione Inventario." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {prodotti.map(p => {
                  const venduto = venditeGiorno[p.id] || { quantita: 0, importo: 0 }
                  return (
                    <Card key={p.id} style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--espresso)' }}>{p.nome}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--mocha)' }}>
                          {p.prezzo_vendita ? `${euro(p.prezzo_vendita)} / pz` : 'Prezzo non impostato'}
                        </p>
                      </div>
                      <input type="number" min="0" step="1" value={venduto.quantita || 0}
                        disabled={!p.prezzo_vendita}
                        onChange={e => aggiornaQuantita(p, Number(e.target.value))}
                        style={{ width: 56, textAlign: 'center', fontFamily: 'var(--font-dati)', fontSize: 15, border: '1.5px solid var(--bordo)', borderRadius: 8, padding: '8px 6px' }} />
                      <span style={{ width: 68, textAlign: 'right', fontFamily: 'var(--font-dati)', fontSize: 14, color: 'var(--espresso)', fontWeight: 500 }}>
                        {euro(venduto.importo)}
                      </span>
                    </Card>
                  )
                })}
                <p style={{ fontSize: 11, color: 'var(--mocha)', margin: '4px 0 0' }}>
                  Il totale sopra si aggiorna da solo sommando queste righe — puoi comunque modificarlo a mano in qualsiasi momento.
                </p>
              </div>
            )
          )}
        </>
      )}
    </div>
  )
}

function VistaReport({ azienda_id }) {
  const [periodo, setPeriodo] = useState('settimana')
  const [riferimento, setRiferimento] = useState(new Date())
  const [prodotti, setProdotti] = useState([])
  const [righeProdotti, setRigheProdotti] = useState([])
  const [righeIncassi, setRigheIncassi] = useState([])
  const [caricamento, setCaricamento] = useState(true)

  useEffect(() => {
    supabase.from('prodotti').select('id, nome').then(({ data }) => setProdotti(data || []))
  }, [])

  const { dal, al, etichettaPeriodo } = calcolaIntervallo(periodo, riferimento)

  useEffect(() => {
    caricaVendite()
  }, [periodo, riferimento])

  async function caricaVendite() {
    setCaricamento(true)
    const [{ data: vp }, { data: vi }] = await Promise.all([
      supabase.from('vendite').select('prodotto_id, giorno, quantita, importo')
        .gte('giorno', formattaData(dal)).lte('giorno', formattaData(al)),
      supabase.from('incassi_giornalieri').select('giorno, importo, costo').eq('azienda_id', azienda_id)
        .gte('giorno', formattaData(dal)).lte('giorno', formattaData(al)),
    ])
    setRigheProdotti(vp || [])
    setRigheIncassi(vi || [])
    setCaricamento(false)
  }

  function spostaPeriodo(direzione) {
    setRiferimento(r => {
      const x = new Date(r)
      if (periodo === 'settimana') x.setDate(x.getDate() + 7 * direzione)
      else if (periodo === 'mese') x.setMonth(x.getMonth() + direzione)
      else x.setFullYear(x.getFullYear() + direzione)
      return x
    })
  }

  const prodottiMappa = Object.fromEntries(prodotti.map(p => [p.id, p]))
  const incassiMappa = Object.fromEntries(righeIncassi.map(i => [i.giorno, i]))

  // Il fatturato del giorno è sempre e solo quello salvato in incassi_giornalieri —
  // che sia stato scritto a mano o calcolato dal dettaglio prodotto per prodotto,
  // qui non c'è bisogno di scegliere tra due fonti: ce n'è una sola.
  function incassoGiorno(giornoStr) {
    return Number(incassiMappa[giornoStr]?.importo || 0)
  }

  const datiGrafico = costruisciDatiGrafico(periodo, dal, al, incassoGiorno)
  const totalePeriodo = datiGrafico.reduce((s, d) => s + d.valore, 0)

  const perProdotto = {}
  righeProdotti.forEach(r => {
    if (!perProdotto[r.prodotto_id]) perProdotto[r.prodotto_id] = { quantita: 0, importo: 0 }
    perProdotto[r.prodotto_id].quantita += r.quantita
    perProdotto[r.prodotto_id].importo += Number(r.importo)
  })
  const classifica = Object.entries(perProdotto)
    .map(([id, v]) => ({ nome: prodottiMappa[id]?.nome || 'Prodotto rimosso', ...v }))
    .sort((a, b) => b.importo - a.importo)
    .slice(0, 5)

  let margineTotale = 0
  let qualcheCostoImpostato = false
  const cursoreMargine = new Date(dal)
  while (cursoreMargine <= al) {
    const chiave = formattaData(cursoreMargine)
    const costo = incassiMappa[chiave]?.costo
    if (costo != null) {
      qualcheCostoImpostato = true
      margineTotale += incassoGiorno(chiave) - Number(costo)
    }
    cursoreMargine.setDate(cursoreMargine.getDate() + 1)
  }

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <SelettorePillole
          opzioni={[{ valore: 'settimana', label: 'Settimana' }, { valore: 'mese', label: 'Mese' }, { valore: 'anno', label: 'Anno' }]}
          valore={periodo}
          onCambia={setPeriodo}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <button onClick={() => spostaPeriodo(-1)} style={pulsanteFantasma}>← Prec.</button>
        <span style={{ fontSize: 13, color: 'var(--mocha)', fontWeight: 600 }}>{etichettaPeriodo}</span>
        <button onClick={() => spostaPeriodo(1)} style={pulsanteFantasma}>Succ. →</button>
      </div>

      {caricamento && <ScheletroCaricamento righe={4} />}

      {!caricamento && totalePeriodo === 0 && (
        <EmptyState icona={<IconaGrafico />} titolo="Nessuna vendita in questo periodo"
          sottotitolo="Registra qualcosa dalla scheda Inserisci per vederlo qui." />
      )}

      {!caricamento && totalePeriodo > 0 && (
        <>
          <Card style={{ padding: '16px 20px', marginBottom: 16 }}>
            <p style={{ margin: '0 0 4px', fontSize: 12, color: 'var(--mocha)', fontWeight: 500 }}>Incasso totale</p>
            <p style={{ margin: '0 0 16px', fontFamily: 'var(--font-dati)', fontSize: 26, color: 'var(--espresso)', fontWeight: 500 }}>{euro(totalePeriodo)}</p>
            <GraficoBarre dati={datiGrafico} formattaValore={euro} />
          </Card>

          <Card style={{ padding: '16px 20px', marginBottom: 16 }}>
            <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: 'var(--espresso)' }}>Prodotti più venduti</p>
            {classifica.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {classifica.map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--espresso)' }}>{p.nome}</span>
                    <span style={{ fontSize: 12, color: 'var(--mocha)' }}>{p.quantita} pz · {euro(p.importo)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: 13, color: 'var(--mocha)' }}>
                Nessun dato per prodotto in questo periodo — apri "Dettaglio prodotto per prodotto" in Inserisci per vederlo qui.
              </p>
            )}
          </Card>

          <Card style={{ padding: '16px 20px' }}>
            <p style={{ margin: '0 0 4px', fontSize: 12, color: 'var(--mocha)', fontWeight: 500 }}>Margine stimato</p>
            {qualcheCostoImpostato ? (
              <>
                <p style={{ margin: 0, fontFamily: 'var(--font-dati)', fontSize: 22, color: 'var(--espresso)', fontWeight: 500 }}>{euro(margineTotale)}</p>
                <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--mocha)' }}>Incasso meno "Costo del giorno", calcolato solo sui giorni in cui l'hai impostato.</p>
              </>
            ) : (
              <p style={{ margin: 0, fontSize: 13, color: 'var(--mocha)' }}>
                Imposta il "Costo del giorno" nella scheda Inserisci per vedere qui il margine stimato.
              </p>
            )}
          </Card>
        </>
      )}
    </div>
  )
}

function calcolaIntervallo(periodo, riferimento) {
  if (periodo === 'settimana') {
    const dal = inizioSettimana(riferimento)
    const al = new Date(dal)
    al.setDate(al.getDate() + 6)
    return { dal, al, etichettaPeriodo: `${dal.getDate()} — ${al.getDate()} ${MESI_BREVI[al.getMonth()]}` }
  }
  if (periodo === 'mese') {
    const dal = new Date(riferimento.getFullYear(), riferimento.getMonth(), 1)
    const al = new Date(riferimento.getFullYear(), riferimento.getMonth() + 1, 0)
    const testo = riferimento.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
    return { dal, al, etichettaPeriodo: testo.charAt(0).toUpperCase() + testo.slice(1) }
  }
  const dal = new Date(riferimento.getFullYear(), 0, 1)
  const al = new Date(riferimento.getFullYear(), 11, 31)
  return { dal, al, etichettaPeriodo: String(riferimento.getFullYear()) }
}

function costruisciDatiGrafico(periodo, dal, al, incassoGiornoFn) {
  if (periodo === 'anno') {
    const perMese = Array(12).fill(0)
    const cursore = new Date(dal)
    while (cursore <= al) {
      perMese[cursore.getMonth()] += incassoGiornoFn(formattaData(cursore))
      cursore.setDate(cursore.getDate() + 1)
    }
    return perMese.map((valore, i) => ({ label: MESI_BREVI[i], valore }))
  }

  const giorni = []
  const cursore = new Date(dal)
  while (cursore <= al) {
    const chiave = formattaData(cursore)
    giorni.push({
      label: periodo === 'settimana' ? GIORNI_BREVI[(cursore.getDay() || 7) - 1] : String(cursore.getDate()),
      valore: incassoGiornoFn(chiave),
    })
    cursore.setDate(cursore.getDate() + 1)
  }
  return giorni
}
