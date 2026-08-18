-- Esegui questo PRIMA di rieseguire schema.sql, per ripartire puliti
drop table if exists turni cascade;
drop table if exists fatture cascade;
drop table if exists dipendenti cascade;
drop table if exists prodotti cascade;
drop table if exists profili cascade;
drop table if exists aziende cascade;

-- Nota: se il bucket di storage "fatture" è già stato creato in un tentativo precedente,
-- vai su Storage nel menu Supabase e cancellalo manualmente da lì (non è possibile farlo via SQL).
-- Se non l'hai ancora visto comparire in Storage, non serve fare nulla: verrà creato al prossimo Run di schema.sql.
