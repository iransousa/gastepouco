-- Fecha o schema para as chaves publicas do Supabase.
--
-- O problema: o Prisma cria as tabelas em `public`, e o Supabase publica esse
-- schema pela API PostgREST. Sem isto, qualquer pessoa com a chave `anon` — que
-- por definicao e publica, vai no javascript do site — le a base inteira.
--
-- Duas camadas, porque uma so nao basta:
--
-- 1. RLS ligada em toda tabela, sem nenhuma policy. Sem policy, ninguem passa.
--    A API nao e afetada: ela conecta como dona das tabelas, e dona nao entra
--    na RLS (so entraria com FORCE ROW LEVEL SECURITY).
-- 2. Privilegios revogados de `anon` e `authenticated`, inclusive os padroes
--    para tabelas futuras. RLS protege linha; privilegio protege a tabela.
--
-- E idempotente e nao faz nada fora do Supabase (os papeis nao existem no
-- Postgres do Docker). Rode depois de toda migration que cria tabela:
--
--   pnpm --filter @gastemenos/api db:blindar
--
-- Ver docs/13-SUPABASE.md.

DO $$
DECLARE
  tabela record;
BEGIN
  FOR tabela IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tabela.tablename);
  END LOOP;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
    REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
    REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;
    REVOKE USAGE ON SCHEMA public FROM anon, authenticated;

    -- Tabela criada por uma migration futura ja nasce fechada.
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated;

    RAISE NOTICE 'Schema public fechado para anon e authenticated.';
  ELSE
    RAISE NOTICE 'Papeis anon/authenticated nao existem aqui; so a RLS foi ligada.';
  END IF;
END $$;
