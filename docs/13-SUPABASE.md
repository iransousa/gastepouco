# Supabase como banco de produção

> **Estado:** ✅ EXECUTADO no código (conexão, armazenamento e blindagem do schema).
> ⬜ PENDENTE a criação do projeto e o primeiro deploy — depende de credencial, não de código.

O Supabase entra **só como Postgres gerenciado e armazenamento de arquivo**. A
API continua sendo o único cliente do banco: nada de PostgREST, nada de Supabase
Auth, nada de `@supabase/supabase-js` no web.

Por que não o Supabase inteiro: o login, as sessões rotativas, o consentimento
versionado e o mínimo de anonimato dos preços (5 notas de 3 pessoas) são regra de
negócio testada em `apps/api/test`. Em Supabase Auth + RLS elas virariam policy
SQL sem teste — que foi exatamente onde o aplicativo anterior tinha o furo. E a
API é necessária de qualquer forma, por causa do publisher do oráculo e do x402.

---

## 1. Conexão

O Prisma separa a conexão de uso da conexão de migration, e no Supabase elas são
portas diferentes do mesmo pooler:

| Variável | Porta | Para quê | Por quê |
|---|---|---|---|
| `DATABASE_URL` | 6543 | requisições do dia a dia | transaction mode aguenta muita conexão curta |
| `DIRECT_URL` | 5432 | `migrate`, `db execute`, `introspect` | transaction mode **não** aceita DDL nem prepared statement |

```bash
DATABASE_URL="postgresql://postgres.<PROJECT-REF>:<SENHA>@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require"
DIRECT_URL="postgresql://postgres.<PROJECT-REF>:<SENHA>@aws-0-sa-east-1.pooler.supabase.com:5432/postgres?sslmode=require"
```

`pgbouncer=true` desliga os prepared statements do Prisma; `connection_limit=1`
evita que cada instância da API segure um punhado de conexões do pooler.

Em desenvolvimento as duas apontam para o Postgres do Docker — é o que está em
`.env.example`. **Testes e CI continuam no Docker**, nunca no Supabase: a suíte
cria e apaga usuários, e o incidente do `deleteMany` (ver `12-PROGRESSO.md`,
fase 6) é o motivo de nenhuma suíte apontar para base compartilhada.

Região: **sa-east-1 (São Paulo)**. O job de agregação de preços e as consultas de
ranking fazem várias idas ao banco; atravessar o Atlântico a cada uma cobra caro.

## 2. Fechar o schema para as chaves públicas

O ponto que mais dá errado com Prisma + Supabase: as tabelas nascem em `public`,
e o Supabase publica `public` pela API PostgREST. A chave `anon` é publica por
definição — vai no javascript de qualquer cliente. Sem tratar isso, ela lê a base
inteira.

`apps/api/prisma/sql/blindar-schema.sql` resolve com duas camadas:

1. **RLS ligada em toda tabela, sem nenhuma policy.** Sem policy ninguém passa. A
   API não sente: conecta como dona das tabelas, e dona não entra na RLS (só
   entraria com `FORCE ROW LEVEL SECURITY`).
2. **Privilégios revogados de `anon` e `authenticated`**, inclusive os padrões
   para tabelas futuras. RLS protege linha; privilégio protege a tabela.

O script é idempotente e não faz nada fora do Supabase (os papéis não existem no
Docker). Ele já foi aplicado como a migration `20260924170500_blindar_schema`, e
**precisa rodar de novo depois de toda migration que criar tabela**:

```bash
DATABASE_URL="$DIRECT_URL" pnpm --filter @gastemenos/api db:blindar
```

`DATABASE_URL="$DIRECT_URL"` porque `prisma db execute` usa a conexão de uso, e
`DO $$ ... $$` com DDL quer a conexão direta.

No painel, ainda vale tirar `public` de **Settings → API → Exposed schemas**. São
defesas independentes: a de cima é do banco e vai junto com o dump; a do painel
alguém pode reverter num clique.

## 3. Arquivos: Supabase Storage

O ZIP de "Baixar meus dados" ia para o disco do container. Disco de container é
efêmero: um deploy entre o pedido e o download apagaria o arquivo, e a pessoa
veria "pronto" num link que não baixa nada.

`ArmazenamentoService` tem dois destinos e escolhe pelo ambiente: disco quando
não há credencial (desenvolvimento e teste), Supabase Storage quando há.

```bash
SUPABASE_URL="https://<PROJECT-REF>.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="<chave de servico>"
SUPABASE_STORAGE_BUCKET="exportacoes"
```

Crie o balde **privado**, com esse nome. Sem policy nenhuma: o acesso é sempre
pela chave de serviço, no servidor.

**O arquivo nunca ganha URL pública, nem assinada.** Quem baixa passa pelo
endpoint autenticado `GET /v1/me/export/:id/download`, que lê o conteúdo pelo
serviço e devolve. Link assinado é portátil por natureza — circula em conversa,
sobrevive à troca de senha e vale para qualquer um que o receba. Num arquivo com
o histórico de compras inteiro de uma pessoa, isso não serve.

A chave de serviço ignora RLS e nunca pode chegar ao web: ela vive só no
ambiente da API.

## 4. O que o Supabase não resolve

- **Redis.** A fila da leitura de nota (BullMQ) continua precisando de um Redis
  no servidor. `REDIS_URL` aponta para ele no deploy.
- **Os quatro `@Cron`** (agregação de preços, fechamento do mês, aviso de
  sequência, expurgo LGPD) rodam no processo da API. Com mais de uma instância,
  cada job rodaria em todas — o que já vale hoje, Supabase ou não. Antes de
  escalar horizontalmente, envolver os jobs num `pg_advisory_lock`.
- **Backup.** Passa a ser do Supabase (PITR no plano pago). O item de backup
  diário em `09-SEGURANCA-LGPD.md` está atendido por ele.

## 5. Passo a passo do primeiro deploy

```bash
# 1. Preencher .env (ou as variáveis do Coolify) com as duas conexões + Storage.
# 2. Criar o schema no Supabase:
pnpm --filter @gastemenos/api db:deploy       # usa DIRECT_URL

# 3. Fechar o schema (a migration já faz isto; repita após novas migrations):
DATABASE_URL="$DIRECT_URL" pnpm --filter @gastemenos/api db:blindar

# 4. Conferir:
#    - Settings → API → Exposed schemas sem `public`
#    - Storage → balde `exportacoes` privado
#    - SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public';
#      (rowsecurity = t em todas)

# 5. Seed NÃO roda em produção: ele é dado de demonstração (docs/12-PROGRESSO.md).
```

Para uma base de demonstração do hackathon, aí sim `db:seed` — e num projeto
Supabase separado do de produção.

## 6. O que continua igual

Prisma, todos os módulos da API, os testes, o web e o design system. A troca é de
endereço do banco e de destino de arquivo; nenhuma regra de negócio muda.
