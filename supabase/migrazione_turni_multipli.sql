-- MIGRAZIONE UNA TANTUM — da eseguire UNA SOLA VOLTA sul progetto Supabase già in uso.
-- Permette a un dipendente di avere più fasce nello stesso giorno (es. mattina e sera),
-- invece di una sola fascia esclusiva. "Riposo" non è più un valore salvato: è
-- semplicemente l'assenza di fasce quel giorno.
--
-- Non tocca aziende/profili/prodotti/dipendenti/fatture/timbrature. Le righe esistenti
-- con fascia "riposo" vengono rimosse (erano equivalenti a "nessuna fascia", nessuna
-- informazione persa). Le altre righe (mattina/pomeriggio/sera già assegnate) restano.
--
-- Sicura da eseguire più volte per errore: ogni passo usa "if exists"/ricrea da zero.

delete from turni where fascia = 'riposo';

-- Rimuove il vecchio vincolo "un solo turno per dipendente al giorno" (qualunque sia
-- il suo nome esatto nel tuo progetto) e lo sostituisce con uno che permette più fasce.
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

alter table turni add constraint turni_dipendente_giorno_fascia_key unique (dipendente_id, giorno, fascia);

alter table turni alter column fascia drop default;

drop policy if exists "elimina turni responsabile+" on turni;
create policy "elimina turni responsabile+" on turni
  for delete using (
    azienda_id in (
      select azienda_id from profili
      where utente_id = auth.uid() and ruolo in ('responsabile', 'titolare', 'admin')
    )
  );
