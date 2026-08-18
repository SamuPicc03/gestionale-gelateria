// Helper condivisi tra Timbratura.jsx e Dipendenti.jsx per calcolare stato e ore lavorate.

export function inizioMese(data) {
  return new Date(data.getFullYear(), data.getMonth(), 1)
}

export function fineMese(data) {
  return new Date(data.getFullYear(), data.getMonth() + 1, 0, 23, 59, 59)
}

export function formattaMese(data) {
  const testo = data.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
  return testo.charAt(0).toUpperCase() + testo.slice(1)
}

export function formattaOrario(iso) {
  return new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}

// Formato richiesto da <input type="datetime-local">, in orario locale (non UTC)
export function perInputLocale(iso) {
  const d = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Accoppia ogni "entrata" con la "uscita" successiva (in ordine cronologico) e somma le ore.
// Un'entrata senza uscita (turno ancora aperto) non viene conteggiata nel totale.
export function calcolaOre(eventiOrdinatiAsc) {
  let totaleMs = 0
  let apertura = null
  for (const e of eventiOrdinatiAsc) {
    if (e.tipo === 'entrata') {
      apertura = new Date(e.orario)
    } else if (e.tipo === 'uscita' && apertura) {
      totaleMs += new Date(e.orario) - apertura
      apertura = null
    }
  }
  return Math.round((totaleMs / 3_600_000) * 10) / 10
}

export function statoAttuale(ultimoEvento) {
  if (!ultimoEvento || ultimoEvento.tipo === 'uscita') return { alLavoro: false }
  return { alLavoro: true, dalle: formattaOrario(ultimoEvento.orario) }
}
