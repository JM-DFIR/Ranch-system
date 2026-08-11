-- Extensions: pgcrypto (gen_random_uuid + digest, used by uuid_generate_v7
-- and later by invitation tokens), pg_trgm (partial tag/name search),
-- pg_cron (nightly attention-flag recompute, wired up in a later session).
create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_trgm with schema extensions;
create extension if not exists pg_cron with schema extensions;
