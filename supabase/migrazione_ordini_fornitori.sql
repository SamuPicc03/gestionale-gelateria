-- MIGRAZIONE UNA TANTUM — da eseguire UNA SOLA VOLTA sul progetto Supabase già in uso.
-- Aggiunge due campi opzionali ai prodotti per poter mandare ordini ai fornitori via
-- email dall'Inventario. Nessun dato esistente viene toccato.

alter table prodotti add column if not exists fornitore_nome text;
alter table prodotti add column if not exists fornitore_email text;
