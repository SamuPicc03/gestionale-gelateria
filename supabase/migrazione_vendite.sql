-- MIGRAZIONE UNA TANTUM — da eseguire UNA SOLA VOLTA sul progetto Supabase già in uso.
-- Aggiunge la sezione Vendite: un prezzo opzionale sui prodotti (per il dettaglio
-- prodotto per prodotto), una tabella per quel dettaglio, e una tabella per il
-- fatturato del giorno (un numero solo) + costo del giorno (per il margine stimato).
--
-- Sicura da eseguire anche se avevi già lanciato una versione precedente di questo
-- file: ogni passo usa "if not exists"/"if exists", rinomina invece di ricreare dove
-- serve, o ricrea le policy da zero. Non tocca nessun dato esistente di
-- aziende/profili/dipendenti/fatture/turni/timbrature.

alter table prodotti add column if not exists prezzo_vendita numeric(8,2);
alter table prodotti drop column if exists costo_unitario;

create table if not exists vendite (
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

create table if not exists incassi_giornalieri (
  id uuid primary key default gen_random_uuid(),
  azienda_id uuid references aziende(id) on delete cascade,
  giorno date not null,
  importo numeric(10,2),
  costo numeric(10,2),
  aggiornato_il timestamptz default now(),
  unique (azienda_id, giorno)
);

-- Se avevi già lanciato una versione precedente di questa migrazione, la colonna si
-- chiamava "importo_manuale": la rinomino invece di perdere i dati già inseriti.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'incassi_giornalieri' and column_name = 'importo_manuale'
  ) then
    alter table incassi_giornalieri rename column importo_manuale to importo;
  end if;
end $$;

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
