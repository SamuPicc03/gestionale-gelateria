import { createContext, useContext, useState } from 'react'

const CHIAVE_LINGUA = 'lingua'

const TESTI = {
  it: {
    comune: {
      esci: 'Esci', oggi: 'Oggi', prec: '← Prec.', succ: 'Succ. →',
      chiudi: 'Chiudi', correggi: 'Correggi', entrata: 'Entrata', uscita: 'Uscita',
      caricamento: 'Caricamento…', euroOra: '€/ora',
    },
    sceltaLingua: {
      titolo: 'Scegli la lingua', sottotitolo: 'Puoi cambiarla quando vuoi',
      italiano: 'Italiano', tedesco: 'Deutsch',
    },
    sceltaSede: {
      titolo: 'Quale sede vuoi vedere?', sottotitolo: 'Puoi cambiarla in qualsiasi momento',
      sedeSenzaNome: 'Sede senza nome',
    },
    app: {
      nomeApp: 'Gestionale', sede: 'Sede', cambia: 'cambia',
      nessunAccesso: 'Nessun accesso configurato',
      nessunAccessoMsg: 'Il tuo utente non è ancora collegato a nessuna sede. Contatta chi gestisce l\'attività.',
      caricamento: 'Caricamento…',
      tabInventario: 'Inventario', tabVendite: 'Vendite', tabDipendenti: 'Dipendenti',
      tabTimbratura: 'Timbratura', tabTurni: 'Turni', tabFatture: 'Fatture',
    },
    inventario: {
      titolo: 'Inventario', prodotti: 'prodotti', aggiungiProdotto: 'Aggiungi prodotto',
      prodottoScortaBassa: 'prodotto in scorta bassa', prodottiScortaBassa: 'prodotti in scorta bassa',
      scorteAPosto: 'Scorte a posto', scortaBassa: 'Scorta bassa',
      nessunProdotto: 'Nessun prodotto ancora',
      aggiungiPrimoProdotto: 'Aggiungi il primo gusto o prodotto del tuo magazzino.',
      chiediProdotti: 'Chiedi a chi gestisce l\'attività di aggiungere i prodotti.',
      pulsanteAggiungi: '+ Aggiungi prodotto', eliminaProdotto: 'Elimina prodotto',
      confermaElimina: nome => `Eliminare "${nome}" dall'inventario?`,
    },
    vendite: {
      titolo: 'Vendite', sottotitolo: 'Incassi e andamento',
      inserisci: 'Inserisci', report: 'Report',
      prezziProdotto: 'Prezzi prodotto',
      prezziSpiegazione: 'Si impostano una volta sola, poi restano — servono solo per il dettaglio prodotto per prodotto.',
      fatturatoOggi: 'Fatturato di oggi', costoGiorno: 'Costo del giorno',
      costoSpiegazione: 'Facoltativo — spesa in prodotto/materie prime, serve solo per il margine stimato nel Report.',
      nascondiDettaglio: 'Nascondi dettaglio prodotto per prodotto', mostraDettaglio: '+ Dettaglio prodotto per prodotto',
      nessunProdotto: 'Nessun prodotto ancora', aggiungiProdottoInventario: 'Aggiungi prima qualche prodotto nella sezione Inventario.',
      prezzoNonImpostato: 'Prezzo non impostato', perPezzo: '/ pz',
      totaleAutomatico: 'Il totale sopra si aggiorna da solo sommando queste righe — puoi comunque modificarlo a mano in qualsiasi momento.',
      settimana: 'Settimana', mese: 'Mese', anno: 'Anno',
      incassoTotale: 'Incasso totale', prodottiPiuVenduti: 'Prodotti più venduti',
      pezzi: 'pz', nessunDatoProdotto: 'Nessun dato per prodotto in questo periodo — apri "Dettaglio prodotto per prodotto" in Inserisci per vederlo qui.',
      margineStimato: 'Margine stimato',
      margineSpiegazione: 'Incasso meno "Costo del giorno", calcolato solo sui giorni in cui l\'hai impostato.',
      margineVuoto: 'Imposta il "Costo del giorno" nella scheda Inserisci per vedere qui il margine stimato.',
      nessunaVendita: 'Nessuna vendita in questo periodo', registraQualcosa: 'Registra qualcosa dalla scheda Inserisci per vederlo qui.',
      prodottoRimosso: 'Prodotto rimosso', erroreSalvataggio: 'Errore nel salvataggio: ',
      giorniBrevi: ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'],
      mesiBrevi: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'],
    },
    dipendenti: {
      titolo: 'Dipendenti', persone: 'persone in squadra', aggiungiDipendente: 'Aggiungi dipendente',
      nessunDipendente: 'Nessun dipendente ancora',
      aggiungiPrimaPersona: 'Aggiungi la prima persona della tua squadra.',
      chiediDipendenti: 'Chiedi a chi gestisce l\'attività di aggiungere i dipendenti.',
      pulsanteAggiungi: '+ Aggiungi dipendente',
      presenteDalle: 'Presente dalle', assente: 'Assente', nonCollegato: 'Non collegato',
      rimuoviDipendente: 'Rimuovi dipendente',
      confermaRimuovi: nome => `Rimuovere "${nome}" dai dipendenti?`,
      costoOrario: 'Costo orario',
    },
    timbratura: {
      titolo: 'Timbratura',
      accountNonCollegato: 'Account non ancora collegato',
      accountNonCollegatoMsg: 'Il tuo utente non risulta collegato a nessun dipendente. Chiedi a chi gestisce l\'attività di collegarlo.',
      alLavoroDalle: 'Al lavoro dalle', fuoriTurno: 'Fuori turno',
      segnaUscita: 'Segna uscita', segnaEntrata: 'Segna entrata',
      oreTotaliMese: 'Ore totali del mese', dipendenti: 'dipendenti',
      nessunDipendente: 'Nessun dipendente ancora', aggiungiDipendenti: 'Aggiungi prima qualcuno nella sezione Dipendenti.',
      nessunaTimbratura: 'Nessuna timbratura questo mese.',
      eliminaTimbratura: 'Elimina timbratura', aggiungiDimenticata: 'Aggiungi timbratura dimenticata', aggiungi: 'Aggiungi',
      confermaElimina: 'Eliminare questa timbratura? Non si può annullare.', ore: 'ore',
    },
    turni: {
      titolo: 'Turni', sottotitolo: 'Calendario mensile della squadra',
      mesePrec: '← Mese prec.', meseSucc: 'Mese succ. →',
      nessunDipendente: 'Nessun dipendente da pianificare', aggiungiDipendenti: 'Aggiungi prima qualcuno nella sezione Dipendenti.',
      turnoSpezzato: 'Turno spezzato',
      mattina: 'Mattina', pomeriggio: 'Pomeriggio', sera: 'Sera', riposo: 'Riposo',
      giorniBrevi: ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'],
      giorniLabel: ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'],
    },
    fatture: {
      titolo: 'Fatture', registrate: 'registrate', annulla: 'Annulla', nuova: '+ Nuova',
      totaleRegistrato: 'Totale registrato', inScadenza7: 'In scadenza 7gg',
      caricaNuova: 'Carica nuova fattura', fornitore: 'Fornitore', importo: 'Importo (€)',
      dataFattura: 'Data fattura', scadenza: 'Scadenza', salvaFattura: 'Salva fattura',
      nessunaFattura: 'Nessuna fattura ancora', caricaPdf: 'Carica il PDF di una fattura per iniziare a tracciarla.',
      nuovaFattura: '+ Nuova fattura', emessaIl: 'Emessa il', scadeIl: 'Scade il',
      erroreCaricamento: 'Errore nel caricamento del PDF: ', erroreSalvataggio: 'Errore nel salvataggio: ',
    },
  },
  de: {
    comune: {
      esci: 'Abmelden', oggi: 'Heute', prec: '← Zurück', succ: 'Weiter →',
      chiudi: 'Schließen', correggi: 'Korrigieren', entrata: 'Kommen', uscita: 'Gehen',
      caricamento: 'Wird geladen…', euroOra: '€/Std.',
    },
    sceltaLingua: {
      titolo: 'Sprache wählen', sottotitolo: 'Du kannst sie jederzeit ändern',
      italiano: 'Italiano', tedesco: 'Deutsch',
    },
    sceltaSede: {
      titolo: 'Welchen Standort möchtest du sehen?', sottotitolo: 'Du kannst jederzeit wechseln',
      sedeSenzaNome: 'Standort ohne Namen',
    },
    app: {
      nomeApp: 'Gestionale', sede: 'Standort', cambia: 'wechseln',
      nessunAccesso: 'Kein Zugang eingerichtet',
      nessunAccessoMsg: 'Dein Konto ist noch keinem Standort zugeordnet. Wende dich an die Geschäftsleitung.',
      caricamento: 'Wird geladen…',
      tabInventario: 'Lager', tabVendite: 'Umsatz', tabDipendenti: 'Mitarbeiter',
      tabTimbratura: 'Zeiterfassung', tabTurni: 'Schichten', tabFatture: 'Rechnungen',
    },
    inventario: {
      titolo: 'Lagerbestand', prodotti: 'Produkte', aggiungiProdotto: 'Produkt hinzufügen',
      prodottoScortaBassa: 'Produkt fast leer', prodottiScortaBassa: 'Produkte fast leer',
      scorteAPosto: 'Bestand in Ordnung', scortaBassa: 'Bestand niedrig',
      nessunProdotto: 'Noch keine Produkte',
      aggiungiPrimoProdotto: 'Füge die erste Sorte oder das erste Produkt deines Lagers hinzu.',
      chiediProdotti: 'Bitte die Geschäftsleitung, Produkte hinzuzufügen.',
      pulsanteAggiungi: '+ Produkt hinzufügen', eliminaProdotto: 'Produkt löschen',
      confermaElimina: nome => `"${nome}" aus dem Lager löschen?`,
    },
    vendite: {
      titolo: 'Umsatz', sottotitolo: 'Einnahmen und Verlauf',
      inserisci: 'Eingeben', report: 'Bericht',
      prezziProdotto: 'Produktpreise',
      prezziSpiegazione: 'Werden einmal eingestellt und bleiben gespeichert — nur für die Detailansicht pro Produkt nötig.',
      fatturatoOggi: 'Umsatz heute', costoGiorno: 'Tageskosten',
      costoSpiegazione: 'Optional — Ausgaben für Waren/Zutaten, nur für die geschätzte Marge im Bericht nötig.',
      nascondiDettaglio: 'Detailansicht pro Produkt ausblenden', mostraDettaglio: '+ Detailansicht pro Produkt',
      nessunProdotto: 'Noch keine Produkte', aggiungiProdottoInventario: 'Füge zuerst Produkte im Bereich Lager hinzu.',
      prezzoNonImpostato: 'Preis nicht festgelegt', perPezzo: '/ Stk.',
      totaleAutomatico: 'Die Summe oben wird automatisch aus diesen Zeilen berechnet — du kannst sie trotzdem jederzeit manuell ändern.',
      settimana: 'Woche', mese: 'Monat', anno: 'Jahr',
      incassoTotale: 'Gesamtumsatz', prodottiPiuVenduti: 'Meistverkaufte Produkte',
      pezzi: 'Stk.', nessunDatoProdotto: 'Keine Produktdaten in diesem Zeitraum — öffne "Detailansicht pro Produkt" unter Eingeben, um sie hier zu sehen.',
      margineStimato: 'Geschätzte Marge',
      margineSpiegazione: 'Umsatz minus "Tageskosten", nur für Tage berechnet, an denen sie eingetragen wurden.',
      margineVuoto: 'Trage die "Tageskosten" unter Eingeben ein, um hier die geschätzte Marge zu sehen.',
      nessunaVendita: 'Keine Verkäufe in diesem Zeitraum', registraQualcosa: 'Trage etwas unter Eingeben ein, um es hier zu sehen.',
      prodottoRimosso: 'Entferntes Produkt', erroreSalvataggio: 'Fehler beim Speichern: ',
      giorniBrevi: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
      mesiBrevi: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
    },
    dipendenti: {
      titolo: 'Mitarbeiter', persone: 'Personen im Team', aggiungiDipendente: 'Mitarbeiter hinzufügen',
      nessunDipendente: 'Noch keine Mitarbeiter',
      aggiungiPrimaPersona: 'Füge die erste Person deines Teams hinzu.',
      chiediDipendenti: 'Bitte die Geschäftsleitung, Mitarbeiter hinzuzufügen.',
      pulsanteAggiungi: '+ Mitarbeiter hinzufügen',
      presenteDalle: 'Anwesend seit', assente: 'Abwesend', nonCollegato: 'Nicht verknüpft',
      rimuoviDipendente: 'Mitarbeiter entfernen',
      confermaRimuovi: nome => `"${nome}" aus den Mitarbeitern entfernen?`,
      costoOrario: 'Stundenlohn',
    },
    timbratura: {
      titolo: 'Zeiterfassung',
      accountNonCollegato: 'Konto noch nicht verknüpft',
      accountNonCollegatoMsg: 'Dein Konto ist keinem Mitarbeiter zugeordnet. Bitte die Geschäftsleitung, es zu verknüpfen.',
      alLavoroDalle: 'Im Dienst seit', fuoriTurno: 'Nicht im Dienst',
      segnaUscita: 'Gehen erfassen', segnaEntrata: 'Kommen erfassen',
      oreTotaliMese: 'Gesamtstunden diesen Monat', dipendenti: 'Mitarbeiter',
      nessunDipendente: 'Noch keine Mitarbeiter', aggiungiDipendenti: 'Füge zuerst jemanden im Bereich Mitarbeiter hinzu.',
      nessunaTimbratura: 'Keine Erfassung diesen Monat.',
      eliminaTimbratura: 'Erfassung löschen', aggiungiDimenticata: 'Vergessene Erfassung hinzufügen', aggiungi: 'Hinzufügen',
      confermaElimina: 'Diese Erfassung löschen? Kann nicht rückgängig gemacht werden.', ore: 'Std.',
    },
    turni: {
      titolo: 'Schichten', sottotitolo: 'Monatskalender des Teams',
      mesePrec: '← Vorheriger Monat', meseSucc: 'Nächster Monat →',
      nessunDipendente: 'Keine Mitarbeiter zu planen', aggiungiDipendenti: 'Füge zuerst jemanden im Bereich Mitarbeiter hinzu.',
      turnoSpezzato: 'Geteilte Schicht',
      mattina: 'Morgen', pomeriggio: 'Nachmittag', sera: 'Abend', riposo: 'Frei',
      giorniBrevi: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
      giorniLabel: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'],
    },
    fatture: {
      titolo: 'Rechnungen', registrate: 'erfasst', annulla: 'Abbrechen', nuova: '+ Neu',
      totaleRegistrato: 'Gesamt erfasst', inScadenza7: 'Fällig in 7 Tagen',
      caricaNuova: 'Neue Rechnung hochladen', fornitore: 'Lieferant', importo: 'Betrag (€)',
      dataFattura: 'Rechnungsdatum', scadenza: 'Fälligkeit', salvaFattura: 'Rechnung speichern',
      nessunaFattura: 'Noch keine Rechnungen', caricaPdf: 'Lade das PDF einer Rechnung hoch, um sie zu erfassen.',
      nuovaFattura: '+ Neue Rechnung', emessaIl: 'Ausgestellt am', scadeIl: 'Fällig am',
      erroreCaricamento: 'Fehler beim Hochladen des PDFs: ', erroreSalvataggio: 'Fehler beim Speichern: ',
    },
  },
}

const LinguaContext = createContext(null)

export function LinguaProvider({ children }) {
  const [lingua, setLinguaState] = useState(() => localStorage.getItem(CHIAVE_LINGUA))

  function setLingua(nuova) {
    localStorage.setItem(CHIAVE_LINGUA, nuova)
    setLinguaState(nuova)
  }

  function t(chiave) {
    const percorso = chiave.split('.')
    let nodo = TESTI[lingua] || TESTI.it
    for (const passo of percorso) nodo = nodo?.[passo]
    if (nodo === undefined) {
      let fallback = TESTI.it
      for (const passo of percorso) fallback = fallback?.[passo]
      return fallback ?? chiave
    }
    return nodo
  }

  return (
    <LinguaContext.Provider value={{ lingua: lingua || 'it', linguaScelta: lingua, setLingua, t }}>
      {children}
    </LinguaContext.Provider>
  )
}

export function useLingua() {
  return useContext(LinguaContext)
}
