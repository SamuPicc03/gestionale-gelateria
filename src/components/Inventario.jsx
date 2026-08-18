import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import {
  Card, Badge, EmptyState, ScheletroCaricamento, IntestazioneSezione,
  PulsanteIcona, IconaScatola, IconaPiu, IconaCestino,
} from './ui'

export default function Inventario({ azienda_id, puoGestire }) {
  const [prodotti, setProdotti] = useState([])
  const [caricamento, setCaricamento] = useState(true)

  useEffect(() => {
    caricaProdotti()
  }, [])

  async function caricaProdotti() {
    setCaricamento(true)
    const { data } = await supabase.from('prodotti').select('*').order('nome')
    setProdotti(data || [])
    setCaricamento(false)
  }

  async function aggiornaQuantita(id, quantita) {
    setProdotti(prodotti.map(p => p.id === id ? { ...p, quantita } : p))
    await supabase.from('prodotti').update({ quantita }).eq('id', id)
  }

  async function aggiornaNome(id, nome) {
    setProdotti(prodotti.map(p => p.id === id ? { ...p, nome } : p))
    await supabase.from('prodotti').update({ nome }).eq('id', id)
  }

  async function aggiungiProdotto() {
    const { data, error } = await supabase.from('prodotti')
      .insert({ azienda_id, nome: 'Nuovo prodotto', quantita: 0 })
      .select()
      .single()
    if (!error && data) setProdotti(prev => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)))
  }

  async function eliminaProdotto(id, nome) {
    if (!window.confirm(`Eliminare "${nome}" dall'inventario?`)) return
    setProdotti(prodotti.filter(p => p.id !== id))
    await supabase.from('prodotti').delete().eq('id', id)
  }

  const scortaBassaCount = prodotti.filter(p => p.quantita <= 3).length

  return (
    <div>
      <IntestazioneSezione
        titolo="Inventario"
        sottotitolo={caricamento ? undefined : `${prodotti.length} prodotti`}
        azione={puoGestire && (
          <PulsanteIcona titolo="Aggiungi prodotto" colore="var(--pistacchio)" onClick={aggiungiProdotto}>
            <div style={{ width: 22, height: 22 }}><IconaPiu /></div>
          </PulsanteIcona>
        )}
      />

      {!caricamento && prodotti.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          {scortaBassaCount > 0 ? (
            <Badge colore="var(--fragola-scuro)" sfondo="var(--fragola-chiaro)">
              {scortaBassaCount} {scortaBassaCount === 1 ? 'prodotto in scorta bassa' : 'prodotti in scorta bassa'}
            </Badge>
          ) : (
            <Badge>Scorte a posto</Badge>
          )}
        </div>
      )}

      {caricamento && <ScheletroCaricamento righe={4} />}

      {!caricamento && prodotti.length === 0 && (
        <EmptyState
          icona={<IconaScatola />}
          titolo="Nessun prodotto ancora"
          sottotitolo={puoGestire ? 'Aggiungi il primo gusto o prodotto del tuo magazzino.' : 'Chiedi a chi gestisce l\'attività di aggiungere i prodotti.'}
          azione={puoGestire && (
            <button onClick={aggiungiProdotto} style={{ marginTop: 6, ...pulsanteAggiungiStile }}>+ Aggiungi prodotto</button>
          )}
        />
      )}

      {!caricamento && prodotti.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
          {prodotti.map(p => {
            const scortaBassa = p.quantita <= 3
            return (
              <Card key={p.id} style={{ padding: 16, position: 'relative' }}>
                {puoGestire && (
                  <div style={{ position: 'absolute', top: 6, right: 6 }}>
                    <PulsanteIcona titolo="Elimina prodotto" onClick={() => eliminaProdotto(p.id, p.nome)}>
                      <div style={{ width: 16, height: 16 }}><IconaCestino /></div>
                    </PulsanteIcona>
                  </div>
                )}
                <input value={p.nome} onChange={e => aggiornaNome(p.id, e.target.value)}
                  disabled={!puoGestire}
                  style={{ width: '85%', marginBottom: 10, fontWeight: 600, fontSize: 14, border: 'none', background: 'transparent', color: 'var(--espresso)', padding: 0 }} />
                <p style={{ fontFamily: 'var(--font-dati)', fontSize: 28, fontWeight: 500, margin: '0 0 6px', color: scortaBassa ? 'var(--fragola)' : 'var(--espresso)' }}>
                  {p.quantita}
                </p>
                {scortaBassa && <Badge colore="var(--fragola-scuro)" sfondo="var(--fragola-chiaro)">Scorta bassa</Badge>}
                <select value={p.quantita} onChange={e => aggiornaQuantita(p.id, Number(e.target.value))}
                  disabled={!puoGestire}
                  style={{ width: '100%', marginTop: 10, borderRadius: 8, border: '1.5px solid var(--bordo)', padding: '8px 10px', fontSize: 14 }}>
                  {Array.from({ length: 51 }, (_, q) => <option key={q} value={q}>{q}</option>)}
                </select>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

const pulsanteAggiungiStile = {
  background: 'var(--pistacchio)', color: '#FFFFFF', border: 'none',
  borderRadius: 999, padding: '10px 18px', fontSize: 14, fontWeight: 600,
}
