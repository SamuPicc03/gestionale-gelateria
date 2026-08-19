import { Card, IconaGelato } from './ui'
import { useLingua } from '../i18n'

export default function SceltaLingua({ onScegli }) {
  const { t } = useLingua()

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        background: 'var(--pistacchio)', color: '#FFFFFF',
        padding: '3.5rem 1.75rem 2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        borderRadius: '0 0 28px 28px',
      }}>
        <div style={{ width: 44, height: 44 }}><IconaGelato /></div>
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 22, margin: 0, textAlign: 'center' }}>
          {t('sceltaLingua.titolo')}
        </p>
        <p style={{ fontSize: 13, margin: 0, opacity: 0.85 }}>{t('sceltaLingua.sottotitolo')}</p>
      </div>

      <div style={{ flex: 1, padding: '1.5rem', maxWidth: 480, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Card style={{ padding: 0 }}>
            <button
              onClick={() => onScegli('it')}
              style={{
                width: '100%', textAlign: 'left', background: 'transparent', border: 'none',
                padding: '18px', display: 'flex', alignItems: 'center', gap: 14,
              }}
            >
              <span style={{ fontSize: 28 }}>🇮🇹</span>
              <span style={{ fontSize: 17, fontWeight: 600, color: 'var(--espresso)' }}>Italiano</span>
            </button>
          </Card>
          <Card style={{ padding: 0 }}>
            <button
              onClick={() => onScegli('de')}
              style={{
                width: '100%', textAlign: 'left', background: 'transparent', border: 'none',
                padding: '18px', display: 'flex', alignItems: 'center', gap: 14,
              }}
            >
              <span style={{ fontSize: 28 }}>🇩🇪</span>
              <span style={{ fontSize: 17, fontWeight: 600, color: 'var(--espresso)' }}>Deutsch</span>
            </button>
          </Card>
        </div>
      </div>
    </div>
  )
}
