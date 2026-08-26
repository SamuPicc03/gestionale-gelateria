-- Tabella aziende: ogni riga è una sede (un cliente con più locali ne avrà più di una)
create table aziende (
  id uuid primary key default gen_random_uuid(),
  nome text not null default 'La mia gelateria',
  creato_il timestamptz default now()
);

-- Appartenenza di un utente a una o più aziende (multi-sede): un utente può avere
-- più righe qui, una per ogni sede a cui ha accesso, con un ruolo per ciascuna.
create table profili (
  id uuid primary key default gen_random_uuid(),
  utente_id uuid references auth.users(id) on delete cascade,
  azienda_id uuid references aziende(id) on delete cascade,
  ruolo text not null default 'dipendente' check (ruolo in ('dipendente', 'responsabile', 'titolare', 'admin')),
  nome text,
  unique (utente_id, azienda_id)
);

-- Prodotti in inventario. "prezzo_vendita" è opzionale: serve solo per la modalità
-- "prodotto per prodotto" della sezione Vendite, non per l'inventario in sé.
-- "soglia_scorta_bassa" è opzionale: se non impostata si usa 3 come default (vedi app).
-- "fornitore_nome"/"fornitore_email" sono opzionali: servono per gli ordini fornitori.
create table prodotti (
  id uuid primary key default gen_random_uuid(),
  azienda_id uuid references aziende(id) on delete cascade,
  nome text not null default 'Prodotto',
  quantita int not null default 0,
  prezzo_vendita numeric(8,2),
  soglia_scorta_bassa int,
  fornitore_nome text,
  fornitore_email text,
  aggiornato_il timestamptz default now()
);

-- Dipendenti. "utente_id" collega (quando presente) il dipendente al suo account
-- di login, per permettergli di timbrare da solo entrata/uscita.
create table dipendenti (
  id uuid primary key default gen_random_uuid(),
  azienda_id uuid references aziende(id) on delete cascade,
  utente_id uuid references auth.users(id) on delete set null,
  nome text not null default 'Dipendente',
  costo_orario numeric(6,2),
  aggiornato_il timestamptz default now()
);

-- Fatture ricevute (caricamento manuale del PDF per iniziare)
create table fatture (
  id uuid primary key default gen_random_uuid(),
  azienda_id uuid references aziende(id) on delete cascade,
  fornitore text not null default '',
  importo numeric(10,2),
  data_fattura date,
  scadenza date,
  file_path text, -- percorso del PDF nello storage Supabase
  caricato_il timestamptz default now()
);

-- Attiva le regole di sicurezza per riga (permessi)
alter table prodotti enable row level security;
alter table dipendenti enable row level security;
alter table profili enable row level security;
alter table fatture enable row level security;
alter table aziende enable row level security;

-- Un utente vede tutte le aziende a cui appartiene
drop policy if exists "vedi propria azienda" on aziende;
create policy "vedi propria azienda" on aziende
  for select using (
    id in (select azienda_id from profili where utente_id = auth.uid())
  );

-- Un utente vede tutte le proprie righe di appartenenza (una per sede)
drop policy if exists "vedi proprio profilo" on profili;
create policy "vedi proprie appartenenze" on profili
  for select using (utente_id = auth.uid());

-- Solo chi gestisce vede l'inventario (i dipendenti vedono solo Timbratura e Turni)
drop policy if exists "vedi prodotti azienda" on prodotti;
drop policy if exists "vedi prodotti responsabile+" on prodotti;
create policy "vedi prodotti responsabile+" on prodotti
  for select using (
    azienda_id in (
      select azienda_id from profili
      where utente_id = auth.uid() and ruolo in ('responsabile', 'titolare', 'admin')
    )
  );

-- Responsabile e titolare possono modificare l'inventario
drop policy if exists "modifica prodotti responsabile+" on prodotti;
create policy "modifica prodotti responsabile+" on prodotti
  for update using (
    azienda_id in (
      select azienda_id from profili
      where utente_id = auth.uid() and ruolo in ('responsabile', 'titolare', 'admin')
    )
  );

-- Responsabile/titolare/admin possono aggiungere e rimuovere prodotti
drop policy if exists "crea prodotti responsabile+" on prodotti;
create policy "crea prodotti responsabile+" on prodotti
  for insert with check (
    azienda_id in (
      select azienda_id from profili
      where utente_id = auth.uid() and ruolo in ('responsabile', 'titolare', 'admin')
    )
  );

drop policy if exists "elimina prodotti responsabile+" on prodotti;
create policy "elimina prodotti responsabile+" on prodotti
  for delete using (
    azienda_id in (
      select azienda_id from profili
      where utente_id = auth.uid() and ruolo in ('responsabile', 'titolare', 'admin')
    )
  );

-- Tutti gli utenti dell'azienda vedono i dipendenti
drop policy if exists "vedi dipendenti azienda" on dipendenti;
create policy "vedi dipendenti azienda" on dipendenti
  for select using (
    azienda_id in (select azienda_id from profili where utente_id = auth.uid())
  );

-- Responsabile/titolare/admin possono modificare i dipendenti (nome, collegamento account)
drop policy if exists "modifica proprie ore" on dipendenti;
drop policy if exists "modifica dipendenti responsabile+" on dipendenti;
create policy "modifica dipendenti responsabile+" on dipendenti
  for update using (
    azienda_id in (
      select azienda_id from profili
      where utente_id = auth.uid() and ruolo in ('responsabile', 'titolare', 'admin')
    )
  );

-- Responsabile/titolare/admin possono aggiungere e rimuovere dipendenti
drop policy if exists "crea dipendenti responsabile+" on dipendenti;
create policy "crea dipendenti responsabile+" on dipendenti
  for insert with check (
    azienda_id in (
      select azienda_id from profili
      where utente_id = auth.uid() and ruolo in ('responsabile', 'titolare', 'admin')
    )
  );

drop policy if exists "elimina dipendenti responsabile+" on dipendenti;
create policy "elimina dipendenti responsabile+" on dipendenti
  for delete using (
    azienda_id in (
      select azienda_id from profili
      where utente_id = auth.uid() and ruolo in ('responsabile', 'titolare', 'admin')
    )
  );

-- Timbrature: registro di entrata/uscita, un dipendente timbra da solo (se collegato
-- al suo account), responsabile+ può farlo per lui come ripiego. Nessun update/delete:
-- è un registro, non un dato modificabile.
create table timbrature (
  id uuid primary key default gen_random_uuid(),
  azienda_id uuid references aziende(id) on delete cascade,
  dipendente_id uuid references dipendenti(id) on delete cascade,
  tipo text not null check (tipo in ('entrata', 'uscita')),
  orario timestamptz not null default now()
);

alter table timbrature enable row level security;

drop policy if exists "vedi timbrature azienda" on timbrature;
create policy "vedi timbrature azienda" on timbrature
  for select using (
    azienda_id in (select azienda_id from profili where utente_id = auth.uid())
  );

drop policy if exists "timbra se stesso o responsabile+" on timbrature;
create policy "timbra se stesso o responsabile+" on timbrature
  for insert with check (
    dipendente_id in (select id from dipendenti where utente_id = auth.uid())
    or azienda_id in (
      select azienda_id from profili
      where utente_id = auth.uid() and ruolo in ('responsabile', 'titolare', 'admin')
    )
  );

-- Solo responsabile/titolare/admin possono correggere errori (orario sbagliato, timbrata
-- dimenticata o doppia) — il dipendente stesso non può modificare le proprie timbrature.
drop policy if exists "correggi timbrature responsabile+" on timbrature;
create policy "correggi timbrature responsabile+" on timbrature
  for update using (
    azienda_id in (
      select azienda_id from profili
      where utente_id = auth.uid() and ruolo in ('responsabile', 'titolare', 'admin')
    )
  );

drop policy if exists "elimina timbrature responsabile+" on timbrature;
create policy "elimina timbrature responsabile+" on timbrature
  for delete using (
    azienda_id in (
      select azienda_id from profili
      where utente_id = auth.uid() and ruolo in ('responsabile', 'titolare', 'admin')
    )
  );

-- Solo responsabile, titolare e admin vedono e gestiscono le fatture (i dipendenti non le vedono)
drop policy if exists "vedi fatture responsabile+" on fatture;
create policy "vedi fatture responsabile+" on fatture
  for select using (
    azienda_id in (
      select azienda_id from profili
      where utente_id = auth.uid() and ruolo in ('responsabile', 'titolare', 'admin')
    )
  );

drop policy if exists "carica fatture responsabile+" on fatture;
create policy "carica fatture responsabile+" on fatture
  for insert with check (
    azienda_id in (
      select azienda_id from profili
      where utente_id = auth.uid() and ruolo in ('responsabile', 'titolare', 'admin')
    )
  );

drop policy if exists "modifica fatture responsabile+" on fatture;
create policy "modifica fatture responsabile+" on fatture
  for update using (
    azienda_id in (
      select azienda_id from profili
      where utente_id = auth.uid() and ruolo in ('responsabile', 'titolare', 'admin')
    )
  );

-- Vendite: una riga per prodotto per giorno. "importo" si congela al momento del
-- salvataggio (quantità × prezzo di vendita in quel momento) così un cambio di prezzo
-- futuro non altera i report dei mesi passati. Nessun delete: una correzione si fa
-- reinserendo il numero giusto (upsert su prodotto_id+giorno).
create table vendite (
  id uuid primary key default gen_random_uuid(),
  azienda_id uuid references aziende(id) on delete cascade,
  prodotto_id uuid references prodotti(id) on delete cascade,
  giorno date not null,
  quantita int not null default 0,
  importo numeric(10,2) not null default 0,
  aggiornato_il timestamptz default now(),
  unique (prodotto_id, giorno)
);

alter table vendite enable row level security;

drop policy if exists "vedi vendite responsabile+" on vendite;
create policy "vedi vendite responsabile+" on vendite
  for select using (
    azienda_id in (
      select azienda_id from profili
      where utente_id = auth.uid() and ruolo in ('responsabile', 'titolare', 'admin')
    )
  );

drop policy if exists "registra vendite responsabile+" on vendite;
create policy "registra vendite responsabile+" on vendite
  for insert with check (
    azienda_id in (
      select azienda_id from profili
      where utente_id = auth.uid() and ruolo in ('responsabile', 'titolare', 'admin')
    )
  );

drop policy if exists "modifica vendite responsabile+" on vendite;
create policy "modifica vendite responsabile+" on vendite
  for update using (
    azienda_id in (
      select azienda_id from profili
      where utente_id = auth.uid() and ruolo in ('responsabile', 'titolare', 'admin')
    )
  );

-- Incassi giornalieri: il fatturato del giorno, un numero solo per azienda+giorno.
-- Si può scrivere a mano, oppure farlo calcolare aprendo il dettaglio prodotto per
-- prodotto in "vendite" — ogni modifica lì lo ricalcola e sovrascrive "importo" qui.
-- "costo" è facoltativo e indipendente, serve solo per il margine stimato.
create table incassi_giornalieri (
  id uuid primary key default gen_random_uuid(),
  azienda_id uuid references aziende(id) on delete cascade,
  giorno date not null,
  importo numeric(10,2),
  costo numeric(10,2),
  aggiornato_il timestamptz default now(),
  unique (azienda_id, giorno)
);

alter table incassi_giornalieri enable row level security;

drop policy if exists "vedi incassi responsabile+" on incassi_giornalieri;
create policy "vedi incassi responsabile+" on incassi_giornalieri
  for select using (
    azienda_id in (
      select azienda_id from profili
      where utente_id = auth.uid() and ruolo in ('responsabile', 'titolare', 'admin')
    )
  );

drop policy if exists "registra incassi responsabile+" on incassi_giornalieri;
create policy "registra incassi responsabile+" on incassi_giornalieri
  for insert with check (
    azienda_id in (
      select azienda_id from profili
      where utente_id = auth.uid() and ruolo in ('responsabile', 'titolare', 'admin')
    )
  );

drop policy if exists "modifica incassi responsabile+" on incassi_giornalieri;
create policy "modifica incassi responsabile+" on incassi_giornalieri
  for update using (
    azienda_id in (
      select azienda_id from profili
      where utente_id = auth.uid() and ruolo in ('responsabile', 'titolare', 'admin')
    )
  );

-- Turni pianificati con orario libero. Un dipendente può avere più turni nello stesso
-- giorno (es. turno spezzato): una riga per ogni turno, identificata dal proprio id
-- (non da una fascia fissa). "Riposo" non si salva come valore: è semplicemente
-- l'assenza di righe per quel dipendente in quel giorno.
create table turni (
  id uuid primary key default gen_random_uuid(),
  azienda_id uuid references aziende(id) on delete cascade,
  dipendente_id uuid references dipendenti(id) on delete cascade,
  giorno date not null,
  ora_inizio time not null default '09:00',
  ora_fine time not null default '13:00',
  aggiornato_il timestamptz default now()
);

alter table turni enable row level security;

-- Tutti gli utenti dell'azienda vedono i turni
drop policy if exists "vedi turni azienda" on turni;
create policy "vedi turni azienda" on turni
  for select using (
    azienda_id in (select azienda_id from profili where utente_id = auth.uid())
  );

-- Solo responsabile, titolare e admin possono creare/modificare i turni
drop policy if exists "gestisci turni responsabile+" on turni;
create policy "gestisci turni responsabile+" on turni
  for insert with check (
    azienda_id in (
      select azienda_id from profili
      where utente_id = auth.uid() and ruolo in ('responsabile', 'titolare', 'admin')
    )
  );

drop policy if exists "modifica turni responsabile+" on turni;
create policy "modifica turni responsabile+" on turni
  for update using (
    azienda_id in (
      select azienda_id from profili
      where utente_id = auth.uid() and ruolo in ('responsabile', 'titolare', 'admin')
    )
  );

-- Serve per togliere un turno già assegnato (es. tornare a "riposo")
drop policy if exists "elimina turni responsabile+" on turni;
create policy "elimina turni responsabile+" on turni
  for delete using (
    azienda_id in (
      select azienda_id from profili
      where utente_id = auth.uid() and ruolo in ('responsabile', 'titolare', 'admin')
    )
  );

insert into storage.buckets (id, name, public) values ('fatture', 'fatture', false)
on conflict (id) do nothing;

drop policy if exists "carica pdf fatture" on storage.objects;
create policy "carica pdf fatture" on storage.objects
  for insert with check (
    bucket_id = 'fatture'
    and auth.role() = 'authenticated'
  );

drop policy if exists "vedi pdf fatture" on storage.objects;
create policy "vedi pdf fatture" on storage.objects
  for select using (
    bucket_id = 'fatture'
    and auth.role() = 'authenticated'
  );
