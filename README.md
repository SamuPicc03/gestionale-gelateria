# Gestionale gelateria — avvio del progetto

## 1. Crea il progetto Supabase
1. Vai su https://supabase.com e crea un account gratuito.
2. Crea un nuovo progetto (scegli una password per il database, salvala da parte).
3. Nel pannello del progetto vai su **SQL Editor**, incolla tutto il contenuto del file `supabase/schema.sql` e clicca **Run**. Questo crea le tabelle e le regole di permesso.
4. Vai su **Project settings > API**: copia l'**URL del progetto** e la chiave **anon public**.

## 2. Configura il progetto locale
1. Installa Node.js se non lo hai già (https://nodejs.org, versione LTS).
2. Apri il terminale nella cartella del progetto ed esegui:
   ```
   npm install
   ```
3. Copia il file `.env.example` in un nuovo file chiamato `.env` e incolla i valori copiati da Supabase:
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```
4. Avvia il progetto:
   ```
   npm run dev
   ```
5. Apri il link che appare nel terminale (di solito http://localhost:5173).

## 3. Crea il primo utente e i primi dati
1. In Supabase vai su **Authentication > Users > Add user** e crea il tuo utente (email + password) — è quello con cui farai login nell'app.
2. Vai su **Table editor > aziende** e crea una riga per la tua gelateria.
3. Vai su **Table editor > profili**, crea una riga: `utente_id` = l'id dell'utente creato al punto 1 (lo trovi nella pagina Authentication), `azienda_id` = l'id dell'azienda creata al punto 2, `ruolo` = `admin`.
4. Vai su **Table editor > prodotti**, aggiungi 12 righe con `azienda_id` uguale a quello della tua azienda (puoi lasciare `nome` e `quantita` di default, poi li modifichi dall'app).
5. Fai lo stesso su **dipendenti** per i dipendenti che vuoi iniziare a tracciare.

A questo punto puoi fare login nell'app con l'utente creato e vedrai i tuoi prodotti e dipendenti, modificabili direttamente dall'interfaccia.

## Sezione Fatture
Lo schema SQL crea anche la tabella `fatture` e un bucket di storage chiamato `fatture` per salvare i PDF caricati. Se hai già eseguito una versione precedente dello schema, esegui di nuovo tutto il file `supabase/schema.sql` nell'SQL Editor — le istruzioni sono scritte per non duplicare nulla se già presente.

Solo gli utenti con ruolo `responsabile`, `titolare` o `admin` vedono e caricano le fatture (i dipendenti non le vedono), in linea con i permessi descritti in precedenza.

Dalla sezione Fatture nell'app puoi: caricare un PDF con fornitore, importo, data fattura e scadenza di pagamento; vedere l'elenco con il totale; riaprire il PDF originale con un click.

## Sezione Turni
Lo schema SQL crea anche la tabella `turni`, collegata ai dipendenti esistenti. Se hai già eseguito lo schema in precedenza, riesegui tutto il file `supabase/schema.sql` — è scritto per non duplicare nulla di già esistente.

Solo responsabile/titolare/admin possono modificare i turni; tutti possono vederli. La vista è un calendario mensile (come un calendario cartaceo): tocca un giorno per aprire il dettaglio e assegnare le fasce a ogni dipendente. Un dipendente può avere più fasce nello stesso giorno (es. mattina e sera, per un turno spezzato) — ogni fascia è un interruttore indipendente, "Riposo" toglie tutte le fasce di quel giorno.

**Se il tuo progetto Supabase era già attivo prima di questa funzione** (turni con una sola fascia esclusiva per dipendente/giorno), esegui **una sola volta** `supabase/migrazione_turni_multipli.sql` — permette più fasce per giorno e ripulisce le vecchie righe "riposo" (erano equivalenti a "nessuna fascia", nessun dato perso). Le fasce già assegnate restano.

## Aggiungere ed eliminare prodotti e dipendenti dall'app
Chi ha ruolo `responsabile`, `titolare` o `admin` può ora aggiungere e rimuovere prodotti (sezione Inventario) e dipendenti (sezione Dipendenti) direttamente dall'app, senza passare dal pannello Supabase. Se hai già eseguito una versione precedente di `supabase/schema.sql`, riesegui tutto il file nell'SQL Editor per attivare le nuove regole di permesso — senza rieseguirlo i pulsanti "+" e di eliminazione non funzioneranno.

## Clienti con più sedi (multi-sede)
Un utente può ora appartenere a più aziende/sedi contemporaneamente: la tabella `profili` ammette più righe con lo stesso `utente_id` ma `azienda_id` diverso, una per sede, ciascuna con il proprio `ruolo`.

- **Se hai un progetto Supabase nuovo**: `schema.sql` crea già la tabella `profili` in questa forma, non serve altro.
- **Se il tuo progetto Supabase è già in uso** (con dati che non vuoi perdere, come una demo per i clienti): esegui **una sola volta** il file `supabase/migrazione_multisede.sql` nell'SQL Editor. Trasforma la tabella `profili` mantenendo intatti tutti i dati (prodotti, dipendenti, fatture, turni non vengono toccati). Non eseguirlo più di una volta: se lo fai per errore, il secondo tentativo darà un errore chiaro sulla colonna già esistente, segno che è già stato applicato.

**Per dare a un utente accesso a una seconda sede**: vai su **Table editor > profili** e crea una nuova riga con lo stesso `utente_id` dell'utente e l'`azienda_id` della nuova sede (creata prima in **Table editor > aziende**).

Nell'app: se un utente ha una sola sede, entra direttamente nell'interfaccia come sempre. Se ne ha più di una, dopo il login vede una schermata per scegliere quale sede monitorare, e può cambiarla in qualsiasi momento dal pulsante sotto il nome dell'app in alto — senza fare logout.

## Timbratura dipendenti e ore mensili
Le ore non si inseriscono più a mano: ogni dipendente timbra entrata/uscita con il proprio account, e l'app calcola da sola il totale ore del mese (accoppiando ogni entrata con l'uscita successiva).

- **Se hai un progetto Supabase nuovo**: `schema.sql` crea già la tabella `timbrature` e la colonna `dipendenti.utente_id`, non serve altro.
- **Se il tuo progetto Supabase è già in uso**: esegui **una sola volta** `supabase/migrazione_timbrature.sql` nell'SQL Editor. Aggiunge la tabella `timbrature` e collega `dipendenti` agli account di login, senza toccare aziende/profili/prodotti/fatture/turni. L'unico dato che si perde è il vecchio numero inserito a mano in "ore oggi" (non aveva comunque storico).

**Per far timbrare da solo un dipendente** (serve un account per ciascuno, come per gli altri utenti):
1. **Authentication > Users > Add user** → crea l'utente (email + password) del dipendente.
2. **Table editor > profili** → nuova riga: `utente_id` = id dell'utente appena creato, `azienda_id` = la sua sede, `ruolo` = `dipendente`.
3. **Table editor > dipendenti** → sulla riga del dipendente (o creandone una nuova dalla sezione Dipendenti dell'app), imposta `utente_id` con lo stesso id.

Da questo momento, quando quel dipendente fa login vede solo un pulsante Entra/Esci e il proprio totale ore del mese (non l'inventario o le altre sezioni riservate). Nella sezione Dipendenti dell'app, chi non è ancora collegato a un account mostra un'etichetta "Non collegato" così è facile capire chi manca di fare l'onboarding. Chi ha ruolo responsabile/titolare/admin vede invece lo stato di tutta la squadra (chi è al lavoro adesso) e il riepilogo ore mensile di tutti, e può timbrare al posto di un dipendente come ripiego (es. se dimentica il telefono).

**Se il tuo progetto Supabase era già attivo prima di questa funzione**, esegui anche `supabase/migrazione_correzione_timbrature.sql` — aggiunge i permessi che permettono a responsabile/titolare/admin di correggere o eliminare una timbratura sbagliata (orario errato, doppia timbrata, uscita dimenticata) dalla sezione Timbratura.

## Costo del personale e permessi dipendenti ristretti
Ogni dipendente può avere un costo orario (impostabile da responsabile/titolare/admin nella sezione Dipendenti) — nella sezione Timbratura, accanto alle ore mensili di ciascuno, viene mostrato anche il costo stimato (ore × costo orario). Nella sezione Dipendenti si vede anche chi è presente/assente in tempo reale, non solo l'anagrafica.

I dipendenti (ruolo `dipendente`) ora vedono **solo** Timbratura (le proprie ore) e Turni (il calendario della squadra, in sola lettura) — Inventario, Dipendenti e Fatture sono riservati a chi gestisce.

- **Se hai un progetto Supabase nuovo**: `schema.sql` è già aggiornato, non serve altro.
- **Se il tuo progetto Supabase è già in uso**: esegui **una sola volta** `supabase/migrazione_permessi_dipendenti.sql` — aggiunge il costo orario a `dipendenti` e restringe la visibilità dell'inventario. Nessun dato esistente viene toccato.

## Sezione Vendite/Incassi
Il fatturato del giorno è **un unico numero** ("Fatturato di oggi", sempre visibile e modificabile a mano) — perché in una gelateria contare ogni pallina venduta prodotto per prodotto è quasi impossibile da tenere come abitudine quotidiana. Chi vuole essere più preciso può aprire il **dettaglio prodotto per prodotto** (richiede di impostare una volta il prezzo di ciascuno da "Prezzi prodotto"): ogni modifica lì ricalcola e sovrascrive il numero in alto, che resta comunque modificabile a mano in qualsiasi momento.

C'è anche un campo facoltativo **"Costo del giorno"** (spesa in prodotto/materie prime), indipendente dal resto — serve per calcolare il margine stimato (incasso − costo) nella scheda Report, dove si vede anche l'andamento con un grafico a barre (Settimana/Mese/Anno) e i prodotti più venduti (solo per i giorni in cui è stato usato il dettaglio per prodotto).

Nuove tabelle `vendite` (dettaglio per prodotto) e `incassi_giornalieri` (fatturato del giorno + costo del giorno), più un campo opzionale `prezzo_vendita` su `prodotti`. Visibile solo a responsabile/titolare/admin, come Fatture e Inventario.

- **Se hai un progetto Supabase nuovo**: `schema.sql` è già aggiornato, non serve altro.
- **Se il tuo progetto Supabase è già in uso**: esegui **una sola volta** `supabase/migrazione_vendite.sql` — è sicura da eseguire anche se avevi già lanciato una versione precedente di questo file. Nessun dato esistente viene toccato (a parte l'eventuale vecchio campo "costo unitario" per prodotto, sostituito dal più semplice "costo del giorno").

## Cosa manca ancora (prossimi passi)
- Interfaccia di registrazione/onboarding per nuove aziende/clienti (per ora la prima azienda e il primo utente admin si creano ancora a mano su Supabase — va bene finché sei tu a fare il setup per ogni nuovo cliente).
- Interfaccia di registrazione/invito utenti con assegnazione ruolo, invece di crearli a mano da Supabase (vale anche per il collegamento di un dipendente al suo account per la timbratura).
- Ricezione automatica delle fatture via email (per ora è caricamento manuale del PDF).
- Ordine automatico al fornitore via email dalle scorte in esaurimento (richiede la stessa infrastruttura email delle notifiche, ancora da valutare).
- Nei turni manca ancora il confronto tra ore pianificate e ore effettivamente lavorate (dalla sezione Dipendenti).
- Fasce prodotto (Base/Pro/Super Pro) — da definire quali funzioni includere in ciascuna prima di implementarle.
