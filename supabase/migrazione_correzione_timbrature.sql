-- MIGRAZIONE UNA TANTUM — da eseguire UNA SOLA VOLTA sul progetto Supabase già in uso.
-- Aggiunge solo due regole di permesso (nessuna modifica a tabelle o dati esistenti):
-- da oggi responsabile/titolare/admin possono correggere o cancellare una timbratura
-- sbagliata (orario errato, doppia timbrata, uscita dimenticata). Il dipendente stesso
-- continua a poter solo aggiungere le proprie timbrature, non modificarle.
--
-- Sicura da eseguire più volte per errore: le policy vengono ricreate da zero ogni volta.

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
