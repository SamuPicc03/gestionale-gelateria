import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import {
  Card, Badge, EmptyState, ScheletroCaricamento, IntestazioneSezione, pulsanteFantasma,
  PulsanteIcona, IconaScatola, IconaPiu, IconaCestino,
} from './ui'
import { useLingua } from '../i18n'
import OrdineFornitori from './OrdineFornitori'

export default function Inventario({ azienda_id, puoGestire }) {
  const { t } = useLingua()
  const [prodotti, setProdotti] = useState([])
  const [caricamento, setCaricamento] = useState(true)
  const [mostraFornitori, setMostraFornitori] = useState(false)
  const [mostraOrdine, setMostraOrdine] = useState(false)

  useEffect(() => {
    caricaProdotti()
  }, [])

  async function caricaProdotti() {
    setCaricamento(true)
    const { data } = await supabase.from('prodotti').select('*').eq('azienda_id', azienda_id).order('nome')
    setProdotti(data || [])
    setCaricamento(false)
  }

  async function aggiornaQuantita(id, quantita) {
    setProdotti(prodotti.map(p => p.id === id ? { ...p, quantita } : p))
    await supabase.from('prodotti').update({ quantita }).eq('id', id)
  }

  async function aggiornaSoglia(id, soglia_scorta_bassa) {
    setProdotti(prodotti.map(p => p.id === id ? { ...p, soglia_scorta_bassa } : p))
    await supabase.from('prodotti').update({ soglia_scorta_bassa }).eq('id', id)
  }

  async function aggiornaFornitore(id, campo, valore) {
    setProdotti(prodotti.map(p => p.id === id ? { ...p, [campo]: valore } : p))
    await supabase.from('prodotti').update({ [campo]: valore }).eq('id', id)
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
    if (!window.confirm(t('inventario.confermaElimina')(nome))) return
    setProdotti(prodotti.filter(p => p.id !== id))
    await supabase.from('prodotti').delete().eq('id', id)
  }

  const scortaBassaCount = prodotti.filter(p => p.quantita <= (p.soglia_scorta_bassa ?? 3)).length

  if (mostraOrdine) {
    return <OrdineFornitori azienda_id={azienda_id} prodotti={prodotti} onChiudi={() => setMostraOrdine(false)} />
  }

  return (
    <div>
      <IntestazioneSezione
        titolo={t('inventario.titolo')}
        sottotitolo={caricamento ? undefined : `${prodotti.length} ${t('inventario.prodotti')}`}
        azione={puoGestire && (
          <PulsanteIcona titolo={t('inventario.aggiungiProdotto')} colore="var(--pistacchio)" onClick={aggiungiProdotto}>
            <div style={{ width: 22, height: 22 }}><IconaPiu /></div>
          </PulsanteIcona>
        )}
      />

      {puoGestire && !caricamento && prodotti.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <button onClick={() => setMostraFornitori(v => !v)} style={pulsanteFantasma}>{t('inventario.fornitori')}</button>
          <button onClick={() => setMostraOrdine(true)} style={pulsanteFantasma}>{t('inventario.creaOrdine')}</button>
        </div>
      )}

      {mostraFornitori && (
        <Card style={{ padding: '14px 16px', marginBottom: 16 }}>
          <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--espresso)' }}>{t('inventario.fornitori')}</p>
          <p style={{ margin: '0 0 12px', fontSize: 11, color: 'var(--mocha)' }}>{t('inventario.fornitoriSpiegazione')}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {prodotti.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, color: 'var(--espresso)', flex: '1 1 100px', minWidth: 90 }}>{p.nome}</span>
                <input placeholder={t('inventario.fornitoreNome')} value={p.fornitore_nome || ''}
                  onChange={e => aggiornaFornitore(p.id, 'fornitore_nome', e.target.value || null)}
                  style={{ flex: '1 1 120px', minWidth: 100, borderRadius: 6, border: '1.5px solid var(--bordo)', padding: '6px 8px', fontSize: 12 }} />
                <input placeholder={t('inventario.fornitoreEmail')} type="email" value={p.fornitore_email || ''}
                  onChange={e => aggiornaFornitore(p.id, 'fornitore_email', e.target.value || null)}
                  style={{ flex: '1 1 160px', minWidth: 140, borderRadius: 6, border: '1.5px solid var(--bordo)', padding: '6px 8px', fontSize: 12 }} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {!caricamento && prodotti.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          {scortaBassaCount > 0 ? (
            <Badge colore="var(--fragola-scuro)" sfondo="var(--fragola-chiaro)">
              {scortaBassaCount} {scortaBassaCount === 1 ? t('inventario.prodottoScortaBassa') : t('inventario.prodottiScortaBassa')}
            </Badge>
          ) : (
            <Badge>{t('inventario.scorteAPosto')}</Badge>
          )}
        </div>
      )}

      {caricamento && <ScheletroCaricamento righe={4} />}

      {!caricamento && prodotti.length === 0 && (
        <EmptyState
          icona={<IconaScatola />}
          titolo={t('inventario.nessunProdotto')}
          sottotitolo={puoGestire ? t('inventario.aggiungiPrimoProdotto') : t('inventario.chiediProdotti')}
          azione={puoGestire && (
            <button onClick={aggiungiProdotto} style={{ marginTop: 6, ...pulsanteAggiungiStile }}>{t('inventario.pulsanteAggiungi')}</button>
          )}
        />
      )}

      {!caricamento && prodotti.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
          {prodotti.map(p => {
            const soglia = p.soglia_scorta_bassa ?? 3
            const scortaBassa = p.quantita <= soglia
            return (
              <Card key={p.id} style={{ padding: 16, position: 'relative' }}>
                {puoGestire && (
                  <div style={{ position: 'absolute', top: 6, right: 6 }}>
                    <PulsanteIcona titolo={t('inventario.eliminaProdotto')} onClick={() => eliminaProdotto(p.id, p.nome)}>
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
                {scortaBassa && <Badge colore="var(--fragola-scuro)" sfondo="var(--fragola-chiaro)">{t('inventario.scortaBassa')}</Badge>}
                <input type="number" min="0" value={p.quantita} onChange={e => aggiornaQuantita(p.id, Number(e.target.value))}
                  disabled={!puoGestire}
                  style={{ width: '100%', marginTop: 10, borderRadius: 8, border: '1.5px solid var(--bordo)', padding: '8px 10px', fontSize: 14, fontFamily: 'var(--font-dati)' }} />
                {puoGestire && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                    <label style={{ fontSize: 11, color: 'var(--mocha)', flexShrink: 0 }}>{t('inventario.sogliaScortaBassa')}</label>
                    <input type="number" min="0" value={soglia}
                      onChange={e => aggiornaSoglia(p.id, e.target.value ? Number(e.target.value) : null)}
                      style={{ width: 44, borderRadius: 6, border: '1.5px solid var(--bordo)', padding: '4px 6px', fontSize: 12, fontFamily: 'var(--font-dati)' }} />
                  </div>
                )}
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
