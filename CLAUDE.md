# Academia Iron City (GTA7 Lab)

Entidade "gym" da cidade digital GTA7 Lab: grade de aulas coletivas consultável na web e via MCP pelo Core Orchestrator.

## Stack
Next.js (App Router) + TypeScript, sem banco. Deploy na Vercel. MCP implementado à mão (JSON-RPC, Streamable HTTP stateless, respostas JSON), sem SDK.

## Dados — `data/classes.json`
`id, modality, instructor, date (YYYY-MM-DD), time (HH:MM), duration_min, level (iniciante|intermediário|avançado|todos), price (R$ inteiro), capacity, spots_left, status (available|full|cancelled), description?`

## MCP — `POST /mcp`
- `search_classes` { date?, modality?, level?, max_price?, min_time?, min_spots? } → `{ count, classes }`, só `available`, ordenado por data+hora. modality: substring sem caixa/acentos; level: igualdade.
- `get_class` { id } → aula completa (qualquer status) ou `{ "error": "not_found" }`.

## Arquivos principais
- `lib/classes.ts` — tipos, busca e filtros (usado pela página, API e MCP)
- `app/mcp/route.ts` — servidor MCP
- `app/page.tsx` — grade + filtros (form GET); `app/aulas/[id]/page.tsx` — detalhes
- `app/api/classes/route.ts` — mesma busca via GET ?filtros
- `manifest.json` — manifesto para o Core
- `scripts/test-mcp.mjs` — `npm run test:mcp [url]`

## Status
v1 funcional localmente (build ok, test:mcp ok).

## Próxima tarefa
Deploy na Vercel, preencher `endpoint` no manifest.json e registrar no Core.
