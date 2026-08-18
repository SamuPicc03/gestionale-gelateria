// Pezzi visivi condivisi tra le sezioni: card, pulsanti, stati vuoti/di caricamento, icone.

export const cardBase = {
  background: 'var(--bianco)',
  border: '1px solid var(--bordo)',
  borderRadius: 'var(--raggio)',
  boxShadow: 'var(--ombra-sm)',
}

export const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  marginBottom: 10,
  borderRadius: 'var(--raggio-piccolo)',
  border: '1.5px solid var(--bordo)',
  fontSize: 15,
  color: 'var(--espresso)',
  background: 'var(--bianco)',
}

export function pulsantePrimario(colore) {
  return {
    width: '100%',
    padding: '13px 14px',
    borderRadius: 'var(--raggio-piccolo)',
    border: 'none',
    background: colore,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 600,
    boxShadow: 'var(--ombra-sm)',
  }
}

export const pulsanteFantasma = {
  background: 'var(--bianco)',
  border: '1.5px solid var(--bordo)',
  borderRadius: 999,
  padding: '8px 16px',
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--mocha)',
}

export function Card({ children, style, className = '', ...rest }) {
  return (
    <div className={`comparsa ${className}`.trim()} style={{ ...cardBase, ...style }} {...rest}>
      {children}
    </div>
  )
}

export function Badge({ children, colore = 'var(--pistacchio)', sfondo = 'var(--pistacchio-chiaro)' }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: 999,
      background: sfondo, color: colore,
      fontSize: 12, fontWeight: 600,
    }}>
      {children}
    </span>
  )
}

export function PulsanteIcona({ onClick, colore = 'var(--fragola)', titolo, children, tipo = 'button' }) {
  return (
    <button
      type={tipo}
      onClick={onClick}
      title={titolo}
      aria-label={titolo}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 34, height: 34, borderRadius: '50%',
        border: 'none', background: 'transparent', color: colore,
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  )
}

export function EmptyState({ icona, titolo, sottotitolo, azione }) {
  return (
    <div className="comparsa" style={{
      ...cardBase, borderStyle: 'dashed', boxShadow: 'none',
      padding: '2.5rem 1.5rem', textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
    }}>
      <div style={{ color: 'var(--bordo)', width: 40, height: 40 }}>{icona}</div>
      <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: 'var(--espresso)' }}>{titolo}</p>
      {sottotitolo && <p style={{ margin: 0, fontSize: 13, color: 'var(--mocha)', maxWidth: 280 }}>{sottotitolo}</p>}
      {azione}
    </div>
  )
}

export function ScheletroCaricamento({ righe = 3 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.from({ length: righe }, (_, i) => (
        <div key={i} className="caricamento-pulse" style={{
          ...cardBase, height: 58, boxShadow: 'none', background: 'var(--bordo-chiaro)', border: 'none',
        }} />
      ))}
    </div>
  )
}

export function IntestazioneSezione({ titolo, sottotitolo, azione }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 22, margin: 0, color: 'var(--espresso)' }}>{titolo}</h1>
        {sottotitolo && <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--mocha)' }}>{sottotitolo}</p>}
      </div>
      {azione}
    </div>
  )
}

export function SelettorePillole({ opzioni, valore, onCambia }) {
  return (
    <div style={{ display: 'flex', background: 'var(--bordo-chiaro)', borderRadius: 999, padding: 3, gap: 2 }}>
      {opzioni.map(o => {
        const attivo = valore === o.valore
        return (
          <button key={o.valore} onClick={() => onCambia(o.valore)} style={{
            flex: 1, padding: '8px 10px', borderRadius: 999, border: 'none',
            background: attivo ? 'var(--bianco)' : 'transparent',
            color: attivo ? 'var(--espresso)' : 'var(--mocha)',
            fontSize: 13, fontWeight: attivo ? 600 : 500,
            boxShadow: attivo ? 'var(--ombra-sm)' : 'none',
          }}>
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

// Grafico a barre minimale disegnato a mano, nessuna libreria esterna.
// dati: [{ label, valore }]. Con molte barre (es. i giorni di un mese) le etichette
// si nascondono da sole per non affollare — il periodo si legge già nel titolo sopra.
export function GraficoBarre({ dati, formattaValore }) {
  const max = Math.max(1, ...dati.map(d => d.valore))
  const mostraEtichette = dati.length <= 12
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: dati.length > 20 ? 2 : 6, height: 130 }}>
      {dati.map((d, i) => (
        <div key={i} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
          <div
            title={formattaValore ? formattaValore(d.valore) : String(d.valore)}
            style={{
              width: '100%', maxWidth: 26, borderRadius: 4,
              background: d.valore > 0 ? 'var(--pistacchio)' : 'var(--bordo-chiaro)',
              height: `${Math.max(3, (d.valore / max) * 100)}%`,
            }}
          />
          {mostraEtichette && <span style={{ fontSize: 10, color: 'var(--mocha)' }}>{d.label}</span>}
        </div>
      ))}
    </div>
  )
}

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }

export function IconaScatola(props) {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" {...props}>
      <path {...stroke} d="M3 8l9-5 9 5-9 5-9-5Z" />
      <path {...stroke} d="M3 8v8l9 5 9-5V8" />
      <path {...stroke} d="M12 13v8" />
    </svg>
  )
}

export function IconaPersone(props) {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" {...props}>
      <circle {...stroke} cx="9" cy="8" r="3.2" />
      <path {...stroke} d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle {...stroke} cx="17.5" cy="9" r="2.5" />
      <path {...stroke} d="M15.8 14.2c2.6.4 4.7 2.6 4.7 5.8" />
    </svg>
  )
}

export function IconaCalendario(props) {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" {...props}>
      <rect {...stroke} x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path {...stroke} d="M3.5 10h17" />
      <path {...stroke} d="M8 3v4M16 3v4" />
    </svg>
  )
}

export function IconaScontrino(props) {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" {...props}>
      <path {...stroke} d="M6 3.5h12v17l-2.2-1.5-2 1.5-2-1.5-2 1.5-2-1.5-1.8 1.5v-17Z" />
      <path {...stroke} d="M9 8h6M9 11.5h6M9 15h4" />
    </svg>
  )
}

export function IconaPiu(props) {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" {...props}>
      <path {...stroke} d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function IconaCestino(props) {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" {...props}>
      <path {...stroke} d="M4 7h16" />
      <path {...stroke} d="M9 7V4.8c0-.4.4-.8.9-.8h4.2c.5 0 .9.4.9.8V7" />
      <path {...stroke} d="M6 7l1 12.2c0 .9.8 1.6 1.7 1.6h6.6c.9 0 1.7-.7 1.7-1.6L18 7" />
      <path {...stroke} d="M10 11v6M14 11v6" />
    </svg>
  )
}

export function IconaOrologio(props) {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" {...props}>
      <circle {...stroke} cx="12" cy="12" r="8.5" />
      <path {...stroke} d="M12 7.5V12l3 2" />
    </svg>
  )
}

export function IconaGrafico(props) {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" {...props}>
      <path {...stroke} d="M3.5 20.5h17" />
      <rect {...stroke} x="5.5" y="13" width="3.4" height="7.5" rx="0.8" />
      <rect {...stroke} x="10.3" y="8.5" width="3.4" height="12" rx="0.8" />
      <rect {...stroke} x="15.1" y="4" width="3.4" height="16.5" rx="0.8" />
    </svg>
  )
}

export function IconaGelato(props) {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" {...props}>
      <path {...stroke} d="M7 10a5 5 0 0 1 10 0c0 .6-.1 1.1-.3 1.6" />
      <path {...stroke} d="M6.2 10.5h11.6L12.9 20.4a1 1 0 0 1-1.7 0L6.2 10.5Z" />
    </svg>
  )
}
