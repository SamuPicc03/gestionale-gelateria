import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { Card, EmptyState, ScheletroCaricamento, IntestazioneSezione, inputStyle, pulsantePrimario, pulsanteFantasma, IconaScontrino } from './ui'

export default function Fatture({ azienda_id }) {
  const [fatture, setFatture] = useState([])
  const [caricamentoLista, setCaricamentoLista] = useState(true)
  const [caricamento, setCaricamento] = useState(false)
  const [mostraForm, setMostraForm] = useState(false)
  const [nuovaFattura, setNuovaFattura] = useState({ fornitore: '', importo: '', data_fattura: '', scadenza: '' })
  const [file, setFile] = useState(null)

  useEffect(() => {
    caricaFatture()
  }, [])

  async function caricaFatture() {
    setCaricamentoLista(true)
    const { data } = await supabase.from('fatture').select('*').order('caricato_il', { ascending: false })
    setFatture(data || [])
    setCaricamentoLista(false)
  }

  async function handleUpload(e) {
    e.preventDefault()
    setCaricamento(true)

    let file_path = null
    if (file) {
      const nomeFile = `${Date.now()}_${file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('fatture')
        .upload(nomeFile, file)
      if (uploadError) {
        alert('Errore nel caricamento del PDF: ' + uploadError.message)
        setCaricamento(false)
        return
      }
      file_path = uploadData.path
    }

    const { error } = await supabase.from('fatture').insert({
      azienda_id,
      fornitore: nuovaFattura.fornitore,
      importo: nuovaFattura.importo ? Number(nuovaFattura.importo) : null,
      data_fattura: nuovaFattura.data_fattura || null,
      scadenza: nuovaFattura.scadenza || null,
      file_path,
    })

    if (error) {
      alert('Errore nel salvataggio: ' + error.message)
    } else {
      setNuovaFattura({ fornitore: '', importo: '', data_fattura: '', scadenza: '' })
      setFile(null)
      setMostraForm(false)
      caricaFatture()
    }
    setCaricamento(false)
  }

  async function apriPdf(file_path) {
    const { data } = await supabase.storage.from('fatture').createSignedUrl(file_path, 60)
    if (data) window.open(data.signedUrl, '_blank')
  }

  const totale = fatture.reduce((sum, f) => sum + (Number(f.importo) || 0), 0)

  const oggi = new Date()
  const fraSetteGiorni = new Date(oggi)
  fraSetteGiorni.setDate(oggi.getDate() + 7)
  const inScadenza = fatture.filter(f => {
    if (!f.scadenza) return false
    const s = new Date(f.scadenza)
    return s >= oggi && s <= fraSetteGiorni
  })

  return (
    <div>
      <IntestazioneSezione
        titolo="Fatture"
        sottotitolo={caricamentoLista ? undefined : `${fatture.length} registrate`}
        azione={
          <button onClick={() => setMostraForm(v => !v)} style={{ ...pulsanteFantasma, background: mostraForm ? 'var(--bordo-chiaro)' : 'var(--bianco)' }}>
            {mostraForm ? 'Annulla' : '+ Nuova'}
          </button>
        }
      />

      {!caricamentoLista && fatture.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: inScadenza.length ? '1fr 1fr' : '1fr', gap: 10, marginBottom: 16 }}>
          <Card style={{ padding: '14px 16px' }}>
            <p style={{ margin: '0 0 4px', fontSize: 12, color: 'var(--mocha)', fontWeight: 500 }}>Totale registrato</p>
            <p style={{ margin: 0, fontFamily: 'var(--font-dati)', fontSize: 20, color: 'var(--espresso)' }}>{totale.toFixed(2)} €</p>
          </Card>
          {inScadenza.length > 0 && (
            <Card style={{ padding: '14px 16px', background: 'var(--miele-chiaro)', border: 'none' }}>
              <p style={{ margin: '0 0 4px', fontSize: 12, color: 'var(--miele-scuro)', fontWeight: 600 }}>In scadenza 7gg</p>
              <p style={{ margin: 0, fontFamily: 'var(--font-dati)', fontSize: 20, color: 'var(--espresso)' }}>{inScadenza.length}</p>
            </Card>
          )}
        </div>
      )}

      {mostraForm && (
        <form onSubmit={handleUpload} style={{ ...cardStyleForm, padding: 16, marginBottom: '1.5rem' }}>
          <p style={{ fontWeight: 600, marginTop: 0, marginBottom: 12, fontSize: 14, color: 'var(--espresso)' }}>Carica nuova fattura</p>
          <input placeholder="Fornitore" value={nuovaFattura.fornitore}
            onChange={e => setNuovaFattura({ ...nuovaFattura, fornitore: e.target.value })} required style={inputStyle} />
          <input placeholder="Importo (€)" type="number" step="0.01" value={nuovaFattura.importo}
            onChange={e => setNuovaFattura({ ...nuovaFattura, importo: e.target.value })} style={inputStyle} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--mocha)' }}>Data fattura</label>
              <input type="date" value={nuovaFattura.data_fattura}
                onChange={e => setNuovaFattura({ ...nuovaFattura, data_fattura: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--mocha)' }}>Scadenza</label>
              <input type="date" value={nuovaFattura.scadenza}
                onChange={e => setNuovaFattura({ ...nuovaFattura, scadenza: e.target.value })} style={inputStyle} />
            </div>
          </div>
          <input type="file" accept="application/pdf" onChange={e => setFile(e.target.files[0])} style={{ margin: '4px 0 14px', fontSize: 13 }} />
          <button type="submit" disabled={caricamento} style={pulsantePrimario('var(--fragola)')}>
            {caricamento ? 'Caricamento…' : 'Salva fattura'}
          </button>
        </form>
      )}

      {caricamentoLista && <ScheletroCaricamento righe={3} />}

      {!caricamentoLista && fatture.length === 0 && !mostraForm && (
        <EmptyState icona={<IconaScontrino />} titolo="Nessuna fattura ancora"
          sottotitolo="Carica il PDF di una fattura per iniziare a tracciarla."
          azione={<button onClick={() => setMostraForm(true)} style={{ marginTop: 6, ...pulsantePrimarioPiccolo }}>+ Nuova fattura</button>} />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {fatture.map(f => (
          <Card key={f.id} style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontWeight: 600, fontSize: 14, margin: 0, color: 'var(--espresso)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.fornitore}</p>
              <p style={{ fontSize: 12, color: 'var(--mocha)', margin: '2px 0 0' }}>
                {f.data_fattura ? `Emessa il ${f.data_fattura}` : ''}{f.scadenza ? ` · Scade il ${f.scadenza}` : ''}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <span style={{ fontFamily: 'var(--font-dati)', fontSize: 15, color: 'var(--espresso)' }}>
                {f.importo ? `${Number(f.importo).toFixed(2)} €` : '—'}
              </span>
              {f.file_path && <button onClick={() => apriPdf(f.file_path)} style={pulsanteFantasma}>PDF</button>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

const cardStyleForm = {
  background: 'var(--bianco)', border: '1px solid var(--bordo)', borderRadius: 'var(--raggio)',
}

const pulsantePrimarioPiccolo = {
  background: 'var(--fragola)', color: '#FFFFFF', border: 'none',
  borderRadius: 999, padding: '10px 18px', fontSize: 14, fontWeight: 600,
}
