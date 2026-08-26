import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { Card, EmptyState, pulsantePrimario, pulsanteFantasma, IconaScatola } from './ui'
import { useLingua } from '../i18n'

export default function OrdineFornitori({ azienda_id, prodotti, onChiudi }) {
  const { t, lingua } = useLingua()
  const [nomeAzienda, setNomeAzienda] = useState('')
  const [quantita, setQuantita] = useState(() => {
    const iniziale = {}
    prodotti.forEach(p => {
      const soglia = p.soglia_scorta_bassa ?? 3
      if (p.quantita <= soglia) iniziale[p.id] = 10
    })
    return iniziale
  })
  const [statoInvio, setStatoInvio] = useState({})

  useEffect(() => {
    supabase.from('aziende').select('nome').eq('id', azienda_id).single()
      .then(({ data }) => setNomeAzienda(data?.nome || ''))
  }, [azienda_id])

  function aggiornaQuantita(id, valore) {
    setQuantita(prev => ({ ...prev, [id]: valore }))
  }

  const selezionati = prodotti.filter(p => (quantita[p.id] || 0) > 0)
  const conFornitore = selezionati.filter(p => p.fornitore_email)
  const senzaFornitore = selezionati.filter(p => !p.fornitore_email)

  const gruppi = {}
  conFornitore.forEach(p => {
    const chiave = p.fornitore_email
    if (!gruppi[chiave]) gruppi[chiave] = { fornitore_nome: p.fornitore_nome || p.fornitore_email, fornitore_email: p.fornitore_email, prodotti: [] }
    gruppi[chiave].prodotti.push({ nome: p.nome, quantita: quantita[p.id] })
  })

  async function inviaOrdine(chiave, gruppo) {
    setStatoInvio(prev => ({ ...prev, [chiave]: 'inviando' }))
    const { error } = await supabase.functions.invoke('invia-ordine', {
      body: {
        azienda_id,
        nome_azienda: nomeAzienda,
        fornitore_nome: gruppo.fornitore_nome,
        fornitore_email: gruppo.fornitore_email,
        righe: gruppo.prodotti,
        lingua,
      },
    })
    setStatoInvio(prev => ({ ...prev, [chiave]: error ? `errore:${error.message}` : 'inviato' }))
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        background: 'var(--pistacchio)', color: '#FFFFFF',
        padding: '2.5rem 1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: 10,
        borderRadius: '0 0 28px 28px',
      }}>
        <button onClick={onChiudi} style={{ alignSelf: 'flex-start', background: 'transparent', border: 'none', color: '#FFFFFF', fontSize: 13, padding: 0 }}>
          {t('ordine.chiudi')}
        </button>
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 22, margin: 0 }}>{t('ordine.titolo')}</p>
        <p style={{ fontSize: 13, margin: 0, opacity: 0.85 }}>{t('ordine.sottotitolo')}</p>
      </div>

      <div style={{ flex: 1, padding: '1.25rem', maxWidth: 640, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {prodotti.length === 0 ? (
          <EmptyState icona={<IconaScatola />} titolo={t('ordine.nessunProdotto')} />
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {prodotti.map(p => (
                <Card key={p.id} style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ flex: 1, fontSize: 14, color: 'var(--espresso)', minWidth: 0 }}>{p.nome}</span>
                  <input type="number" min="0" value={quantita[p.id] || 0}
                    onChange={e => aggiornaQuantita(p.id, Number(e.target.value))}
                    style={{ width: 64, textAlign: 'center', fontFamily: 'var(--font-dati)', fontSize: 14, border: '1.5px solid var(--bordo)', borderRadius: 8, padding: '6px 8px' }} />
                </Card>
              ))}
            </div>

            {selezionati.length === 0 && (
              <p style={{ fontSize: 13, color: 'var(--mocha)', textAlign: 'center' }}>{t('ordine.nessunaSelezione')}</p>
            )}

            {senzaFornitore.length > 0 && (
              <Card style={{ padding: '14px 16px', marginBottom: 16, background: 'var(--miele-chiaro)', border: 'none' }}>
                <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--miele-scuro)' }}>{t('ordine.prodottiSenzaFornitore')}</p>
                <p style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--espresso)' }}>{senzaFornitore.map(p => p.nome).join(', ')}</p>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--mocha)' }}>{t('ordine.vaiSuFornitori')}</p>
              </Card>
            )}

            {Object.entries(gruppi).map(([chiave, gruppo]) => {
              const stato = statoInvio[chiave]
              const inErrore = stato?.startsWith('errore:')
              return (
                <Card key={chiave} style={{ padding: '14px 16px', marginBottom: 12 }}>
                  <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: 'var(--espresso)' }}>{gruppo.fornitore_nome}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
                    {gruppo.prodotti.map((r, i) => (
                      <span key={i} style={{ fontSize: 13, color: 'var(--mocha)' }}>{r.quantita} × {r.nome}</span>
                    ))}
                  </div>
                  <button onClick={() => inviaOrdine(chiave, gruppo)} disabled={stato === 'inviando' || stato === 'inviato'}
                    style={pulsantePrimario(stato === 'inviato' ? 'var(--pistacchio-scuro)' : 'var(--pistacchio)')}>
                    {stato === 'inviando' ? t('ordine.inviando') : stato === 'inviato' ? t('ordine.ordineInviato') : t('ordine.inviaA')(gruppo.fornitore_nome)}
                  </button>
                  {inErrore && (
                    <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--fragola-scuro)' }}>{t('ordine.erroreInvio')}{stato.slice(7)}</p>
                  )}
                </Card>
              )
            })}
          </>
        )}

        <button onClick={onChiudi} style={{ ...pulsanteFantasma, width: '100%', marginTop: 12 }}>{t('ordine.chiudi')}</button>
      </div>
    </div>
  )
}
