import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import {
  Card, Badge, EmptyState, ScheletroCaricamento, IntestazioneSezione,
  PulsanteIcona, IconaPersone, IconaPiu, IconaCestino,
} from './ui'
import { statoAttuale } from './timbratureUtils'
import { useLingua } from '../i18n'

export default function Dipendenti({ azienda_id, puoGestire }) {
  const { t, lingua } = useLingua()
  const locale = lingua === 'de' ? 'de-DE' : 'it-IT'
  const [dipendenti, setDipendenti] = useState([])
  const [ultimiEventi, setUltimiEventi] = useState({})
  const [caricamento, setCaricamento] = useState(true)

  useEffect(() => {
    caricaDipendenti()
  }, [])

  async function caricaDipendenti() {
    setCaricamento(true)
    const { data } = await supabase.from('dipendenti').select('*').order('nome')
    setDipendenti(data || [])
    setCaricamento(false)
    caricaPresenza()
  }

  async function caricaPresenza() {
    const { data } = await supabase.from('timbrature').select('dipendente_id, tipo, orario').eq('azienda_id', azienda_id)
      .order('orario', { ascending: false }).limit(200)
    const ultimi = {}
    ;(data || []).forEach(e => { if (!ultimi[e.dipendente_id]) ultimi[e.dipendente_id] = e })
    setUltimiEventi(ultimi)
  }

  async function aggiornaNome(id, nome) {
    setDipendenti(dipendenti.map(d => d.id === id ? { ...d, nome } : d))
    await supabase.from('dipendenti').update({ nome }).eq('id', id)
  }

  async function aggiornaCostoOrario(id, costo_orario) {
    setDipendenti(dipendenti.map(d => d.id === id ? { ...d, costo_orario } : d))
    await supabase.from('dipendenti').update({ costo_orario }).eq('id', id)
  }

  async function aggiungiDipendente() {
    const { data, error } = await supabase.from('dipendenti')
      .insert({ azienda_id, nome: 'Nuovo dipendente' })
      .select()
      .single()
    if (!error && data) setDipendenti(prev => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)))
  }

  async function eliminaDipendente(id, nome) {
    if (!window.confirm(t('dipendenti.confermaRimuovi')(nome))) return
    setDipendenti(dipendenti.filter(d => d.id !== id))
    await supabase.from('dipendenti').delete().eq('id', id)
  }

  return (
    <div>
      <IntestazioneSezione
        titolo={t('dipendenti.titolo')}
        sottotitolo={caricamento ? undefined : `${dipendenti.length} ${t('dipendenti.persone')}`}
        azione={puoGestire && (
          <PulsanteIcona titolo={t('dipendenti.aggiungiDipendente')} colore="var(--pistacchio)" onClick={aggiungiDipendente}>
            <div style={{ width: 22, height: 22 }}><IconaPiu /></div>
          </PulsanteIcona>
        )}
      />

      {caricamento && <ScheletroCaricamento righe={3} />}

      {!caricamento && dipendenti.length === 0 && (
        <EmptyState
          icona={<IconaPersone />}
          titolo={t('dipendenti.nessunDipendente')}
          sottotitolo={puoGestire ? t('dipendenti.aggiungiPrimaPersona') : t('dipendenti.chiediDipendenti')}
          azione={puoGestire && (
            <button onClick={aggiungiDipendente} style={{ marginTop: 6, ...pulsanteAggiungiStile }}>{t('dipendenti.pulsanteAggiungi')}</button>
          )}
        />
      )}

      {!caricamento && dipendenti.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {dipendenti.map(d => {
            const stato = statoAttuale(ultimiEventi[d.id], locale)
            return (
              <Card key={d.id} style={{ padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input value={d.nome} onChange={e => aggiornaNome(d.id, e.target.value)}
                    disabled={!puoGestire}
                    style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 15, fontWeight: 500, color: 'var(--espresso)', padding: '8px 4px', minWidth: 0 }} />
                  {stato.alLavoro
                    ? <Badge>{t('dipendenti.presenteDalle')} {stato.dalle}</Badge>
                    : <span style={{ fontSize: 12, color: 'var(--mocha)', flexShrink: 0 }}>{t('dipendenti.assente')}</span>}
                  {!d.utente_id && (
                    <Badge colore="var(--miele-scuro)" sfondo="var(--miele-chiaro)">{t('dipendenti.nonCollegato')}</Badge>
                  )}
                  {puoGestire && (
                    <PulsanteIcona titolo={t('dipendenti.rimuoviDipendente')} onClick={() => eliminaDipendente(d.id, d.nome)}>
                      <div style={{ width: 16, height: 16 }}><IconaCestino /></div>
                    </PulsanteIcona>
                  )}
                </div>
                {puoGestire && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 4px 2px' }}>
                    <label style={{ fontSize: 12, color: 'var(--mocha)' }}>{t('dipendenti.costoOrario')}</label>
                    <input type="number" min="0" step="0.5" value={d.costo_orario ?? ''}
                      placeholder="—"
                      onChange={e => aggiornaCostoOrario(d.id, e.target.value ? Number(e.target.value) : null)}
                      style={{ width: 64, fontFamily: 'var(--font-dati)', fontSize: 13, border: '1.5px solid var(--bordo)', borderRadius: 6, padding: '4px 6px' }} />
                    <span style={{ fontSize: 12, color: 'var(--mocha)' }}>{t('comune.euroOra')}</span>
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
