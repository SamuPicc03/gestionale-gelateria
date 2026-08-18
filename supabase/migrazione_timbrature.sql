-- MIGRAZIONE UNA TANTUM — da eseguire UNA SOLA VOLTA sul progetto Supabase già in uso,
-- per passare dall'inserimento manuale delle ore ("dipendenti.ore_oggi") a un vero
-- sistema di timbratura entrata/uscita.
--
-- Non cancella nessun dato di aziende/profili/prodotti/fatture/turni. L'unico dato che
-- sparisce è il valore oggi presente in "dipendenti.ore_oggi" (un numero inserito a mano,
-- senza storico) — da qui in poi le ore si calcolano dalle timbrature reali.
--
-- Se la esegui due volte per errore, il passo 2 darà un errore chiaro ("column already
-- exists" o "column does not exist"): vuol dire che è già stata applicata, non serve rifarla.

-- 1. Rimuovo la vecchia policy di dipendenti basata sul confronto per nome
drop policy if exists "modifica proprie ore" on dipendenti;

-- 2. Aggiorno la struttura di "dipendenti"
alter table dipendenti add column utente_id uuid references auth.users(id) on delete set null;
alter table dipendenti drop column ore_oggi;

-- 3. Nuova policy di modifica per dipendenti (solo responsabile/titolare/admin,
--    non più "ognuno modifica le proprie ore" visto che le ore ora sono un registro)
drop policy if exists "modifica dipendenti responsabile+" on dipendenti;
create policy "modifica dipendenti responsabile+" on dipendenti
  for update using (
    azienda_id in (
      select azienda_id from profili
      where utente_id = auth.uid() and ruolo in ('responsabile', 'titolare', 'admin')
    )
  );

-- 4. Nuova tabella per il registro di timbrature
create table if not exists timbrature (
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

-- Fatto. Per far timbrare da solo un dipendente: crea il suo utente in Authentication,
-- aggiungi la sua riga in "profili" (ruolo = dipendente), poi sulla sua riga in
-- "dipendenti" imposta "utente_id" con lo stesso id dell'utente appena creato.
