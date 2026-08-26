import { useState } from 'react'
import { Card, pulsanteFantasma } from './ui'
import { useLingua } from '../i18n'

export default function Aiuto({ onChiudi }) {
  const { t } = useLingua()
  const sezioni = t('aiuto.sezioni')
  const [sezioneAperta, setSezioneAperta] = useState(null)
  const [domandaAperta, setDomandaAperta] = useState(null)

  function apriSezione(indice) {
    setSezioneAperta(sezioneAperta === indice ? null : indice)
    setDomandaAperta(null)
  }

  function apriDomanda(chiave) {
    setDomandaAperta(domandaAperta === chiave ? null : chiave)
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        background: 'var(--pistacchio)', color: '#FFFFFF',
        padding: '2.5rem 1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: 10,
        borderRadius: '0 0 28px 28px',
      }}>
        <button onClick={onChiudi} style={{ alignSelf: 'flex-start', background: 'transparent', border: 'none', color: '#FFFFFF', fontSize: 13, padding: 0 }}>
          {t('aiuto.chiudi')}
        </button>
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 24, margin: 0 }}>{t('aiuto.titolo')}</p>
        <p style={{ fontSize: 13, margin: 0, opacity: 0.85 }}>{t('aiuto.sottotitolo')}</p>
      </div>

      <div style={{ flex: 1, padding: '1.25rem', maxWidth: 640, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sezioni.map((sezione, i) => {
            const aperta = sezioneAperta === i
            return (
              <Card key={i} style={{ padding: 0, overflow: 'hidden' }}>
                <button
                  onClick={() => apriSezione(i)}
                  style={{
                    width: '100%', background: 'transparent', border: 'none', padding: '14px 16px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--espresso)' }}>{sezione.titolo}</span>
                  <span style={{ fontSize: 18, color: 'var(--mocha)' }}>{aperta ? '−' : '+'}</span>
                </button>

                {aperta && (
                  <div style={{ borderTop: '1px solid var(--bordo-chiaro)', padding: '6px 16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {sezione.domande.map((qa, j) => {
                      const chiave = `${i}_${j}`
                      const domandaApertaOra = domandaAperta === chiave
                      return (
                        <div key={j} style={{ borderBottom: j < sezione.domande.length - 1 ? '1px solid var(--bordo-chiaro)' : 'none', padding: '10px 0' }}>
                          <button
                            onClick={() => apriDomanda(chiave)}
                            style={{ width: '100%', background: 'transparent', border: 'none', padding: 0, textAlign: 'left', display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}
                          >
                            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--espresso)' }}>{qa.d}</span>
                            <span style={{ fontSize: 14, color: 'var(--pistacchio)', flexShrink: 0 }}>{domandaApertaOra ? '−' : '+'}</span>
                          </button>
                          {domandaApertaOra && (
                            <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--mocha)', lineHeight: 1.5 }}>{qa.r}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>
            )
          })}
        </div>

        <button onClick={onChiudi} style={{ ...pulsanteFantasma, width: '100%', marginTop: 20 }}>
          {t('aiuto.chiudi')}
        </button>
      </div>
    </div>
  )
}
