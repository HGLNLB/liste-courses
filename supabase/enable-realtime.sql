-- À exécuter UNE SEULE FOIS si le schéma de base est déjà en place.
-- Active la synchronisation temps réel entre appareils (Supabase Realtime).

alter table categories replica identity full;
alter table items replica identity full;

do $$
begin
  alter publication supabase_realtime add table categories;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table items;
exception
  when duplicate_object then null;
end $$;
