-- MIGRAZIONE UNA TANTUM — da eseguire UNA SOLA VOLTA sul progetto Supabase già in uso.
-- Due modifiche indipendenti, nessun dato esistente viene cancellato:
--
-- 1. Aggiunge un costo orario per dipendente, per calcolare il costo mensile del personale
--    (ore reali dalla timbratura × costo orario).
-- 2. Restringe la visibilità dell'Inventario a responsabile/titolare/admin — i dipendenti
--    da oggi vedono solo Timbratura e Turni, non più Inventario né Dipendenti (quest'ultima
--    resta accessibile via API per via dei Turni, ma la sezione è nascosta nell'app).
--
-- Sicura da eseguire più volte per errore: se il passo 1 dà "column already exists" vuol
-- dire che è già stata applicata, non serve rifarla.

alter table dipendenti add column costo_orario numeric(6,2);

drop policy if exists "vedi prodotti azienda" on prodotti;
drop policy if exists "vedi prodotti responsabile+" on prodotti;
create policy "vedi prodotti responsabile+" on prodotti
  for select using (
    azienda_id in (
      select azienda_id from profili
      where utente_id = auth.uid() and ruolo in ('responsabile', 'titolare', 'admin')
    )
  );
