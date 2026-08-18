import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { inputStyle, pulsantePrimario, IconaGelato } from './ui'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errore, setErrore] = useState(null)
  const [caricamento, setCaricamento] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setErrore(null)
    setCaricamento(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setErrore('Email o password non corrette. Riprova.')
    setCaricamento(false)
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        background: 'var(--pistacchio)', color: '#FFFFFF',
        padding: '4rem 1.75rem 3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        borderRadius: '0 0 28px 28px',
      }}>
        <div style={{ width: 52, height: 52 }}><IconaGelato /></div>
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 28, margin: 0 }}>Gestionale</p>
        <p style={{ fontSize: 14, margin: 0, opacity: 0.85 }}>Tutto il tuo locale, in una tasca</p>
      </div>

      <form onSubmit={handleLogin} style={{ flex: 1, padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', maxWidth: 420, width: '100%', margin: '0 auto' }}>
        <p style={{ fontWeight: 600, fontSize: 16, margin: '0 0 16px', color: 'var(--espresso)' }}>Accedi</p>

        <label style={{ fontSize: 13, color: 'var(--mocha)', marginBottom: 6, display: 'block' }}>Email</label>
        <input type="email" autoComplete="email" placeholder="tu@esempio.it" value={email}
          onChange={e => setEmail(e.target.value)} required style={inputStyle} />

        <label style={{ fontSize: 13, color: 'var(--mocha)', marginBottom: 6, display: 'block' }}>Password</label>
        <input type="password" autoComplete="current-password" placeholder="••••••••" value={password}
          onChange={e => setPassword(e.target.value)} required style={{ ...inputStyle, marginBottom: 18 }} />

        {errore && (
          <p style={{ background: 'var(--fragola-chiaro)', color: 'var(--fragola-scuro)', padding: '10px 12px', borderRadius: 10, fontSize: 13, marginBottom: 16 }}>
            {errore}
          </p>
        )}

        <button type="submit" disabled={caricamento} style={pulsantePrimario('var(--pistacchio)')}>
          {caricamento ? 'Accesso in corso…' : 'Accedi'}
        </button>

        <p style={{ fontSize: 12, color: 'var(--mocha)', textAlign: 'center', marginTop: 24 }}>
          Problemi ad accedere? Chiedi le credenziali a chi gestisce l'attività.
        </p>
      </form>
    </div>
  )
}
