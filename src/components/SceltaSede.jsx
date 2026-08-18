import { supabase } from '../supabaseClient'
import { Card, IconaGelato } from './ui'

export default function SceltaSede({ sedi, onScegli }) {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        background: 'var(--pistacchio)', color: '#FFFFFF',
        padding: '3.5rem 1.75rem 2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        borderRadius: '0 0 28px 28px',
      }}>
        <div style={{ width: 44, height: 44 }}><IconaGelato /></div>
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 22, margin: 0, textAlign: 'center' }}>Quale sede vuoi vedere?</p>
        <p style={{ fontSize: 13, margin: 0, opacity: 0.85 }}>Puoi cambiarla in qualsiasi momento</p>
      </div>

      <div style={{ flex: 1, padding: '1.5rem', maxWidth: 480, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sedi.map(sede => (
            <Card key={sede.id} style={{ padding: 0 }}>
              <button
                onClick={() => onScegli(sede)}
                style={{
                  width: '100%', textAlign: 'left', background: 'transparent', border: 'none',
                  padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                }}
              >
                <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--espresso)' }}>
                  {sede.aziende?.nome || 'Sede senza nome'}
                </span>
                <span style={{ color: 'var(--mocha)', fontSize: 18 }}>›</span>
              </button>
            </Card>
          ))}
        </div>

        <button onClick={() => supabase.auth.signOut()} style={{
          marginTop: 28, width: '100%', background: 'transparent', border: 'none',
          color: 'var(--mocha)', fontSize: 13, padding: 10,
        }}>
          Esci
        </button>
      </div>
    </div>
  )
}
