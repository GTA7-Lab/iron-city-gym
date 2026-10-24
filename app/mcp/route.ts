// Servidor MCP mínimo (Streamable HTTP, stateless, respostas JSON).
import { cancelEnrollment, enroll, getClass, searchClasses, type SearchFilters } from "@/lib/classes";

const PROTOCOL_VERSION = "2025-06-18";

const TOOLS = [
  {
    name: "search_classes",
    description:
      "Busca aulas coletivas disponíveis (status available) na Academia Iron City, ordenadas por data e horário. Todos os filtros são opcionais.",
    inputSchema: {
      type: "object",
      properties: {
        date: { type: "string", description: "Data no formato YYYY-MM-DD" },
        modality: { type: "string", description: "Modalidade (ex.: yoga, spinning), sem diferenciar maiúsculas" },
        level: { type: "string", description: "iniciante, intermediário, avançado ou todos" },
        max_price: { type: "number", description: "Preço máximo da aula avulsa em R$" },
        min_time: { type: "string", description: "Horário mínimo de início, HH:MM (ex.: 18:00)" },
        min_spots: { type: "number", description: "Número mínimo de vagas restantes" },
      },
    },
  },
  {
    name: "get_class",
    description: "Retorna os dados completos de uma aula pelo id (inclusive full/cancelled), ou { error: \"not_found\" }.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "Id da aula, ex.: class-001" } },
      required: ["id"],
    },
  },
  {
    name: "enroll_class",
    description:
      "Matricula uma pessoa numa aula pelo nome. Cada aula tem poucas vagas (capacity). Retorna { ok, class_id, name, spots_left } ou { error }: not_found, cancelled, full, already_enrolled, invalid_name.",
    inputSchema: {
      type: "object",
      properties: {
        class_id: { type: "string", description: "Id da aula, ex.: class-001" },
        name: { type: "string", description: "Nome da pessoa" },
      },
      required: ["class_id", "name"],
    },
  },
  {
    name: "cancel_enrollment",
    description:
      "Cancela a matrícula de uma pessoa numa aula (nome sem diferenciar maiúsculas) e libera a vaga. Retorna { ok, class_id, name, spots_left } ou { error }: not_found, not_enrolled.",
    inputSchema: {
      type: "object",
      properties: {
        class_id: { type: "string", description: "Id da aula, ex.: class-001" },
        name: { type: "string", description: "Nome usado na matrícula" },
      },
      required: ["class_id", "name"],
    },
  },
];

type RpcMessage = { jsonrpc: "2.0"; id?: string | number | null; method?: string; params?: any };

async function callTool(name: string, args: any = {}) {
  if (name === "search_classes") {
    const classes = await searchClasses(args as SearchFilters);
    return { count: classes.length, classes };
  }
  if (name === "get_class") return getClass(String(args.id ?? ""));
  if (name === "enroll_class") return enroll(String(args.class_id ?? ""), String(args.name ?? ""));
  if (name === "cancel_enrollment") return cancelEnrollment(String(args.class_id ?? ""), String(args.name ?? ""));
  return null;
}

async function handle(msg: RpcMessage) {
  const ok = (result: unknown) => ({ jsonrpc: "2.0", id: msg.id, result });
  const err = (code: number, message: string) => ({ jsonrpc: "2.0", id: msg.id ?? null, error: { code, message } });

  switch (msg.method) {
    case "initialize":
      return ok({
        protocolVersion: msg.params?.protocolVersion ?? PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: { name: "iron-city-gym", version: "0.2.0" },
      });
    case "ping":
      return ok({});
    case "tools/list":
      return ok({ tools: TOOLS });
    case "tools/call": {
      const data = await callTool(msg.params?.name, msg.params?.arguments);
      if (data === null) return err(-32602, `Unknown tool: ${msg.params?.name}`);
      return ok({
        content: [{ type: "text", text: JSON.stringify(data) }],
        structuredContent: data,
        isError: false,
      });
    }
    default:
      return err(-32601, `Method not found: ${msg.method}`);
  }
}

export async function POST(req: Request) {
  let body: RpcMessage | RpcMessage[];
  try {
    body = await req.json();
  } catch {
    return Response.json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, { status: 400 });
  }
  const msgs = Array.isArray(body) ? body : [body];
  // Notificações (sem id) não têm resposta.
  const replies = await Promise.all(msgs.filter((m) => m.id !== undefined && m.id !== null).map(handle));
  if (replies.length === 0) return new Response(null, { status: 202 });
  return Response.json(Array.isArray(body) ? replies : replies[0]);
}

export async function GET() {
  return new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });
}
