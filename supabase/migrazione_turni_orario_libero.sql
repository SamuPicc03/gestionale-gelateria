-- MIGRAZIONE UNA TANTUM — da eseguire UNA SOLA VOLTA sul progetto Supabase già in uso.
-- Sostituisce le fasce fisse (mattina/pomeriggio/sera) dei Turni con orario libero
-- (inizio/fine), e aggiunge una soglia di scorta bassa personalizzabile ai prodotti.
--
-- I turni già pianificati NON si perdono: vengono convertiti in orari plausibili
-- (mattina 08:00–13:00, pomeriggio 13:00–18:00, sera 18:00–23:00), modificabili
-- dopo dall'app. Nessun altro dato viene toccato.

-- 1. Aggiungo le nuove colonne orario (nullable per ora, le popolo e poi le rendo obbligatorie)
alter table turni add column if not exists ora_inizio time;
alter table turni add column if not exists ora_fine time;

-- 2. Converto le fasce esistenti in orari plausibili
update turni set ora_inizio = '08:00', ora_fine = '13:00' where fascia = 'mattina' and ora_inizio is null;
update turni set ora_inizio = '13:00', ora_fine = '18:00' where fascia = 'pomeriggio' and ora_inizio is null;
update turni set ora_inizio = '18:00', ora_fine = '23:00' where fascia = 'sera' and ora_inizio is null;

-- 3. Rendo le nuove colonne obbligatorie e tolgo la vecchia colonna/vincolo fascia
alter table turni alter column ora_inizio set not null;
alter table turni alter column ora_fine set not null;
alter table turni alter column ora_inizio set default '09:00';
alter table turni alter column ora_fine set default '13:00';

do $$
declare r record;
begin
  for r in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    where rel.relname = 'turni' and con.contype = 'u'
  loop
    execute format('alter table turni drop constraint %I', r.conname);
  end loop;
end $$;

alter table turni drop column if exists fascia;

-- 4. Soglia scorta bassa personalizzabile per prodotto (opzionale, default 3 se non impostata)
alter table prodotti add column if not exists soglia_scorta_bassa int;
