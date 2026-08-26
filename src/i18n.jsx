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
      quantita: 'Quantità', sogliaScortaBassa: 'Soglia scorta bassa',
      fornitori: 'Fornitori', fornitoriSpiegazione: 'Si impostano una volta sola, poi restano — servono per mandare gli ordini.',
      fornitoreNome: 'Nome fornitore', fornitoreEmail: 'Email fornitore', creaOrdine: '📦 Crea ordine',
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
      costoOrario: 'Costo orario', costoStima: 'Stima, non un calcolo di busta paga',
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
      costoStimato: 'Costo stimato',
    },
    turni: {
      titolo: 'Turni', sottotitolo: 'Calendario mensile della squadra',
      mesePrec: '← Mese prec.', meseSucc: 'Mese succ. →',
      nessunDipendente: 'Nessun dipendente da pianificare', aggiungiDipendenti: 'Aggiungi prima qualcuno nella sezione Dipendenti.',
      riposo: 'Riposo', oraInizio: 'Inizio', oraFine: 'Fine', aggiungiTurno: '+ Aggiungi turno',
      nessunTurno: 'Riposo — nessun turno oggi', eliminaTurno: 'Elimina turno',
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
    aiuto: {
      titolo: 'Aiuto', sottotitolo: 'Le domande più comuni', chiudi: '← Chiudi',
      sezioni: [
        { titolo: 'Accesso e sedi', domande: [
          { d: 'Ho dimenticato la password, cosa faccio?', r: 'Chiedi a chi gestisce l\'attività di impostartene una nuova — non puoi farlo da solo per ora.' },
          { d: 'Ho più di una sede, come cambio quella che vedo?', r: 'Tocca la scritta con il nome della sede, sotto "Gestionale" in alto, e scegli quella che vuoi vedere.' },
          { d: 'Come cambio la lingua dell\'app?', r: 'Tocca la bandierina in alto accanto al nome della sede.' },
        ]},
        { titolo: 'Inventario', domande: [
          { d: 'Come aggiungo un nuovo prodotto?', r: 'Nella sezione Inventario, tocca il pulsante "+" in alto a destra.' },
          { d: 'Come cambio la quantità di un prodotto?', r: 'Tocca il numero sotto il nome del prodotto e scrivi quello nuovo.' },
          { d: 'Cosa vuol dire "Scorta bassa"?', r: 'Compare quando la quantità scende sotto la soglia impostata per quel prodotto (di base 3, ma la puoi cambiare tu).' },
          { d: 'Come cambio quando scatta l\'avviso di scorta bassa?', r: 'Sotto la quantità di ogni prodotto c\'è il campo "Soglia scorta bassa" — scrivi il numero che preferisci.' },
        ]},
        { titolo: 'Vendite', domande: [
          { d: 'Come registro quanto ho incassato oggi?', r: 'Nella sezione Vendite, scheda "Inserisci", scrivi il numero nel campo "Fatturato di oggi".' },
          { d: 'Cosa fa il "Dettaglio prodotto per prodotto"?', r: 'È facoltativo: se lo apri e inserisci le quantità vendute di ogni prodotto, il totale sopra si calcola da solo e in Report vedi anche i prodotti più venduti.' },
          { d: 'Come vedo l\'andamento delle vendite nel tempo?', r: 'Scheda "Report", puoi scegliere Settimana, Mese o Anno.' },
        ]},
        { titolo: 'Dipendenti', domande: [
          { d: 'Come aggiungo un dipendente?', r: 'Nella sezione Dipendenti, tocca il pulsante "+" in alto a destra.' },
          { d: 'Come imposto quanto costa un dipendente all\'ora?', r: 'Sotto il nome del dipendente trovi il campo "Costo orario".' },
          { d: 'Cosa vuol dire "Non collegato"?', r: 'Vuol dire che quel dipendente non ha ancora un proprio account per timbrare da solo — chiedi a chi gestisce l\'attività di collegarlo.' },
        ]},
        { titolo: 'Timbratura', domande: [
          { d: 'Come fa un dipendente a timbrare entrata e uscita?', r: 'Deve avere un account personale collegato al suo profilo dipendente. Una volta collegato, fa login e trova un grande pulsante per segnare entrata/uscita.' },
          { d: 'Ho sbagliato a timbrare, come correggo?', r: 'Chi gestisce può aprire il nome del dipendente nella sezione Timbratura e toccare "Correggi" per modificare o aggiungere una timbratura.' },
        ]},
        { titolo: 'Turni', domande: [
          { d: 'Come assegno un turno a un dipendente?', r: 'Tocca il giorno nel calendario, poi "+ Aggiungi turno" sotto il nome del dipendente, e scrivi l\'orario di inizio e fine.' },
          { d: 'Come segno che un dipendente è in riposo quel giorno?', r: 'Se ha già dei turni quel giorno, tocca "Riposo" accanto al suo nome per toglierli tutti in un colpo solo.' },
        ]},
        { titolo: 'Fatture', domande: [
          { d: 'Come carico una fattura ricevuta?', r: 'Tocca "+ Nuova", compila fornitore e importo, e carica il PDF della fattura.' },
        ]},
      ],
    },
    ordine: {
      titolo: 'Ordine fornitori', sottotitolo: 'Scegli cosa ordinare, per fornitore', chiudi: '← Chiudi',
      quantitaDaOrdinare: 'Quantità da ordinare', nessunProdotto: 'Nessun prodotto in inventario.',
      prodottiSenzaFornitore: 'Prodotti selezionati senza fornitore impostato',
      vaiSuFornitori: 'Vai su "Fornitori" in Inventario per collegarli a un\'email.',
      inviaA: fornitore => `Invia a ${fornitore}`,
      inviando: 'Invio in corso…', ordineInviato: 'Ordine inviato!', erroreInvio: 'Errore nell\'invio: ',
      nessunaSelezione: 'Non hai selezionato nessun prodotto — scrivi una quantità maggiore di zero su quelli che vuoi ordinare.',
      oggettoOrdine: azienda => `Ordine da ${azienda}`,
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
      quantita: 'Menge', sogliaScortaBassa: 'Schwelle für niedrigen Bestand',
      fornitori: 'Lieferanten', fornitoriSpiegazione: 'Werden einmal eingestellt und bleiben gespeichert — nötig, um Bestellungen zu senden.',
      fornitoreNome: 'Lieferantenname', fornitoreEmail: 'Lieferanten-E-Mail', creaOrdine: '📦 Bestellung erstellen',
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
      costoOrario: 'Stundenlohn', costoStima: 'Schätzung, keine echte Lohnabrechnung',
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
      costoStimato: 'Geschätzte Kosten',
    },
    turni: {
      titolo: 'Schichten', sottotitolo: 'Monatskalender des Teams',
      mesePrec: '← Vorheriger Monat', meseSucc: 'Nächster Monat →',
      nessunDipendente: 'Keine Mitarbeiter zu planen', aggiungiDipendenti: 'Füge zuerst jemanden im Bereich Mitarbeiter hinzu.',
      riposo: 'Frei', oraInizio: 'Beginn', oraFine: 'Ende', aggiungiTurno: '+ Schicht hinzufügen',
      nessunTurno: 'Frei — heute keine Schicht', eliminaTurno: 'Schicht löschen',
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
    aiuto: {
      titolo: 'Hilfe', sottotitolo: 'Die häufigsten Fragen', chiudi: '← Schließen',
      sezioni: [
        { titolo: 'Zugang und Standorte', domande: [
          { d: 'Ich habe mein Passwort vergessen, was mache ich?', r: 'Bitte die Geschäftsleitung, dir ein neues einzurichten — das geht derzeit nicht allein.' },
          { d: 'Ich habe mehrere Standorte, wie wechsle ich?', r: 'Tippe auf den Namen des Standorts unter "Gestionale" oben und wähle den gewünschten aus.' },
          { d: 'Wie ändere ich die Sprache der App?', r: 'Tippe oben neben dem Standortnamen auf die Flagge.' },
        ]},
        { titolo: 'Lagerbestand', domande: [
          { d: 'Wie füge ich ein neues Produkt hinzu?', r: 'Tippe im Bereich Lagerbestand oben rechts auf "+".' },
          { d: 'Wie ändere ich die Menge eines Produkts?', r: 'Tippe auf die Zahl unter dem Produktnamen und trage die neue ein.' },
          { d: 'Was bedeutet "Bestand niedrig"?', r: 'Erscheint, wenn die Menge unter die für dieses Produkt festgelegte Schwelle fällt (Standard 3, änderbar).' },
          { d: 'Wie ändere ich, wann der Hinweis erscheint?', r: 'Unter der Menge jedes Produkts gibt es das Feld "Schwelle für niedrigen Bestand" — trage die gewünschte Zahl ein.' },
        ]},
        { titolo: 'Umsatz', domande: [
          { d: 'Wie trage ich den heutigen Umsatz ein?', r: 'Im Bereich Umsatz, Reiter "Eingeben", die Zahl bei "Umsatz heute" eintragen.' },
          { d: 'Was macht die "Detailansicht pro Produkt"?', r: 'Optional: trägst du dort die verkauften Mengen ein, berechnet sich die Summe oben automatisch, und im Bericht siehst du auch die meistverkauften Produkte.' },
          { d: 'Wie sehe ich den Umsatzverlauf?', r: 'Reiter "Bericht" — wählbar zwischen Woche, Monat oder Jahr.' },
        ]},
        { titolo: 'Mitarbeiter', domande: [
          { d: 'Wie füge ich einen Mitarbeiter hinzu?', r: 'Tippe im Bereich Mitarbeiter oben rechts auf "+".' },
          { d: 'Wie lege ich den Stundenlohn fest?', r: 'Unter dem Namen des Mitarbeiters findest du das Feld "Stundenlohn".' },
          { d: 'Was bedeutet "Nicht verknüpft"?', r: 'Dieser Mitarbeiter hat noch kein eigenes Konto, um selbst zu stempeln — bitte die Geschäftsleitung, es zu verknüpfen.' },
        ]},
        { titolo: 'Zeiterfassung', domande: [
          { d: 'Wie stempelt ein Mitarbeiter Kommen und Gehen?', r: 'Er braucht ein persönliches, mit seinem Mitarbeiterprofil verknüpftes Konto. Nach der Anmeldung sieht er eine große Taste zum Stempeln.' },
          { d: 'Ich habe falsch gestempelt, wie korrigiere ich das?', r: 'Wer die Verwaltung hat, kann im Bereich Zeiterfassung den Namen öffnen und auf "Korrigieren" tippen.' },
        ]},
        { titolo: 'Schichten', domande: [
          { d: 'Wie plane ich eine Schicht für einen Mitarbeiter?', r: 'Tippe im Kalender auf den Tag, dann unter dem Namen auf "+ Schicht hinzufügen" und trage Beginn und Ende ein.' },
          { d: 'Wie trage ich ein, dass jemand an diesem Tag frei hat?', r: 'Hat er bereits Schichten an diesem Tag, tippe neben seinem Namen auf "Frei", um sie alle auf einmal zu entfernen.' },
        ]},
        { titolo: 'Rechnungen', domande: [
          { d: 'Wie lade ich eine erhaltene Rechnung hoch?', r: 'Tippe auf "+ Neu", trage Lieferant und Betrag ein und lade das PDF der Rechnung hoch.' },
        ]},
      ],
    },
    ordine: {
      titolo: 'Lieferantenbestellung', sottotitolo: 'Wähle aus, was du pro Lieferant bestellen willst', chiudi: '← Schließen',
      quantitaDaOrdinare: 'Zu bestellende Menge', nessunProdotto: 'Keine Produkte im Lager.',
      prodottiSenzaFornitore: 'Ausgewählte Produkte ohne festgelegten Lieferanten',
      vaiSuFornitori: 'Gehe zu "Lieferanten" im Lagerbestand, um sie mit einer E-Mail zu verknüpfen.',
      inviaA: fornitore => `An ${fornitore} senden`,
      inviando: 'Wird gesendet…', ordineInviato: 'Bestellung gesendet!', erroreInvio: 'Fehler beim Senden: ',
      nessunaSelezione: 'Du hast kein Produkt ausgewählt — trage bei den gewünschten Produkten eine Menge größer als null ein.',
      oggettoOrdine: azienda => `Bestellung von ${azienda}`,
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
