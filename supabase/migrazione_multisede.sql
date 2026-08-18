-- MIGRAZIONE UNA TANTUM — da eseguire UNA SOLA VOLTA sul progetto Supabase già in uso,
-- per passare da "un utente = un'azienda" a "un utente può appartenere a più aziende (sedi)".
--
-- Non cancella nessun dato: prodotti, dipendenti, fatture e turni restano intatti.
-- Solo la tabella "profili" cambia struttura (aggiunge la possibilità di più righe per utente).
--
-- Se la esegui due volte per errore, il passo 2 (rename/drop colonna) darà un errore chiaro
-- ("column already exists" o simile): in quel caso vuol dire che è già stata applicata, non
-- serve rieseguirla.

-- 1. Rimuovo le policy che oggi fanno riferimento a "profili.id" (le ricreo dopo,
--    identiche a quelle in schema.sql, con il nuovo nome di colonna)
drop policy if exists "vedi propria azienda" on aziende;
drop policy if exists "vedi proprio profilo" on profili;
drop policy if exists "vedi proprie appartenenze" on profili;
drop policy if exists "vedi prodotti azienda" on prodotti;
drop policy if exists "modifica prodotti responsabile+" on prodotti;
drop policy if exists "crea prodotti responsabile+" on prodotti;
drop policy if exists "elimina prodotti responsabile+" on prodotti;
drop policy if exists "vedi dipendenti azienda" on dipendenti;
drop policy if exists "modifica proprie ore" on dipendenti;
drop policy if exists "crea dipendenti responsabile+" on dipendenti;
drop policy if exists "elimina dipendenti responsabile+" on dipendenti;
drop policy if exists "vedi fatture responsabile+" on fatture;
drop policy if exists "carica fatture responsabile+" on fatture;
drop policy if exists "modifica fatture responsabile+" on fatture;
drop policy if exists "vedi turni azienda" on turni;
drop policy if exists "gestisci turni responsabile+" on turni;
drop policy if exists "modifica turni responsabile+" on turni;

-- 2. Trasformo "profili" da 1 riga per utente a N righe per utente (una per sede)
alter table profili rename column id to utente_id;
alter table profili drop constraint profili_pkey;
alter table profili add column id uuid primary key default gen_random_uuid();
alter table profili add constraint profili_utente_azienda_unique unique (utente_id, azienda_id);

-- 3. Ricreo tutte le policy con "utente_id" al posto di "id" — stessa identica logica di permessi di prima,
--    ora semplicemente valida per-sede invece che per l'intero utente.

create policy "vedi propria azienda" on aziende
  for select using (
    id in (select azienda_id from profili where utente_id = auth.uid())
  );

create policy "vedi proprie appartenenze" on profili
  for select using (utente_id = auth.uid());

create policy "vedi prodotti azienda" on prodotti
  for select using (
    azienda_id in (select azienda_id from profili where utente_id = auth.uid())
  );

create policy "modifica prodotti responsabile+" on prodotti
  for update using (
    azienda_id in (
      select azienda_id from profili
      where utente_id = auth.uid() and ruolo in ('responsabile', 'titolare', 'admin')
    )
  );

create policy "crea prodotti responsabile+" on prodotti
  for insert with check (
    azienda_id in (
      select azienda_id from profili
      where utente_id = auth.uid() and ruolo in ('responsabile', 'titolare', 'admin')
    )
  );

create policy "elimina prodotti responsabile+" on prodotti
  for delete using (
    azienda_id in (
      select azienda_id from profili
      where utente_id = auth.uid() and ruolo in ('responsabile', 'titolare', 'admin')
    )
  );

create policy "vedi dipendenti azienda" on dipendenti
  for select using (
    azienda_id in (select azienda_id from profili where utente_id = auth.uid())
  );

create policy "modifica proprie ore" on dipendenti
  for update using (
    azienda_id in (select azienda_id from profili where utente_id = auth.uid())
    and (
      nome = (select nome from profili where utente_id = auth.uid() and azienda_id = dipendenti.azienda_id)
      or (select ruolo from profili where utente_id = auth.uid() and azienda_id = dipendenti.azienda_id) in ('responsabile', 'titolare', 'admin')
    )
  );

create policy "crea dipendenti responsabile+" on dipendenti
  for insert with check (
    azienda_id in (
      select azienda_id from profili
      where utente_id = auth.uid() and ruolo in ('responsabile', 'titolare', 'admin')
    )
  );

create policy "elimina dipendenti responsabile+" on dipendenti
  for delete using (
    azienda_id in (
      select azienda_id from profili
      where utente_id = auth.uid() and ruolo in ('responsabile', 'titolare', 'admin')
    )
  );

create policy "vedi fatture responsabile+" on fatture
  for select using (
    azienda_id in (
      select azienda_id from profili
      where utente_id = auth.uid() and ruolo in ('responsabile', 'titolare', 'admin')
    )
  );

create policy "carica fatture responsabile+" on fatture
  for insert with check (
    azienda_id in (
      select azienda_id from profili
      where utente_id = auth.uid() and ruolo in ('responsabile', 'titolare', 'admin')
    )
  );

create policy "modifica fatture responsabile+" on fatture
  for update using (
    azienda_id in (
      select azienda_id from profili
      where utente_id = auth.uid() and ruolo in ('responsabile', 'titolare', 'admin')
    )
  );

create policy "vedi turni azienda" on turni
  for select using (
    azienda_id in (select azienda_id from profili where utente_id = auth.uid())
  );

create policy "gestisci turni responsabile+" on turni
  for insert with check (
    azienda_id in (
      select azienda_id from profili
      where utente_id = auth.uid() and ruolo in ('responsabile', 'titolare', 'admin')
    )
  );

create policy "modifica turni responsabile+" on turni
  for update using (
    azienda_id in (
      select azienda_id from profili
      where utente_id = auth.uid() and ruolo in ('responsabile', 'titolare', 'admin')
    )
  );

-- Fatto. Il tuo utente esistente ha ancora la sua unica riga in "profili" (ora con
-- "utente_id" al posto di "id"), quindi il login continuerà a funzionare esattamente
-- come prima. Per aggiungere una seconda sede a un utente, vai su Table editor > profili
-- e crea una nuova riga con lo stesso "utente_id" ma un'altra "azienda_id".
