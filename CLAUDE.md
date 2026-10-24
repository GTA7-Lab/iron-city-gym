# Academia Iron City (GTA7 Lab)

Entidade "gym" da cidade digital GTA7 Lab: grade de aulas coletivas consultável na web e via MCP pelo Core Orchestrator.

## Stack
Next.js (App Router) + TypeScript, Postgres no Neon (`DATABASE_URL`, driver `@neondatabase/serverless`). Deploy na Vercel. MCP implementado à mão (JSON-RPC, Streamable HTTP stateless, respostas JSON), sem SDK.

## Dados — Postgres
- `classes`: `id, modality, instructor, date (YYYY-MM-DD), time (HH:MM), duration_min, level (iniciante|intermediário|avançado|todos), price (R$ inteiro), capacity (1–2), enrolled, status (available|cancelled), description?`
- `enrollments`: `class_id, name, created_at`; nome único por aula (sem caixa).
- Na API, `spots_left = capacity - enrolled` e `status` vira `full` quando lota.
- `data/classes.json` é o seed: `npm run db:seed` cria as tabelas e atualiza as aulas (mantém matrículas).

## MCP — `POST /mcp`
- `search_classes` { date?, modality?, level?, max_price?, min_time?, min_spots? } → `{ count, classes }`, só `available`, ordenado por data+hora. modality: substring sem caixa/acentos; level: igualdade, e aulas "todos" entram em qualquer nível.
- `get_class` { id } → aula completa (qualquer status) ou `{ "error": "not_found" }`.
- `enroll_class` { class_id, name } → `{ ok, class_id, name, spots_left }` ou `{ error: not_found|cancelled|full|already_enrolled|invalid_name }`. Ocupar a vaga e gravar é um comando só (sem overbooking).
- `cancel_enrollment` { class_id, name } → `{ ok, ... }` ou `{ error: not_found|not_enrolled }`.

## Arquivos principais
- `lib/classes.ts` — tipos, acesso ao banco, busca, filtros, matrícula (usado pela página, API e MCP)
- `scripts/seed.mjs` — schema + carga de `data/classes.json`
- `app/mcp/route.ts` — servidor MCP
- `app/page.tsx` — grade + filtros (form GET); `app/aulas/[id]/page.tsx` — detalhes
- `app/api/classes/route.ts` — mesma busca via GET ?filtros
- `manifest.json` — manifesto para o Core
- `scripts/test-mcp.mjs` — `npm run test:mcp [url]`

## Status
v1 publicada em https://iron-city-gym-ecru.vercel.app (projeto Vercel iron-city-gym, ligado a GTA7-Lab/iron-city-gym, deploy automático na main). MCP: https://iron-city-gym-ecru.vercel.app/mcp

## Próxima tarefa
Registrar a entidade no Core Orchestrator.
