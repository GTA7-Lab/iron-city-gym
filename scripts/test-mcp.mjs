// Testa o endpoint MCP. Uso: npm run test:mcp [URL] (padrão http://localhost:3000/mcp)
const url = process.argv[2] ?? "http://localhost:3000/mcp";
let id = 0;
const rpc = async (method, params) => {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method, params }),
  });
  return (await res.json()).result;
};
const call = async (name, args) => (await rpc("tools/call", { name, arguments: args })).structuredContent;
const assert = (cond, msg) => { console.log(cond ? "✓" : "✗", msg); if (!cond) process.exitCode = 1; };

const init = await rpc("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "test", version: "0" } });
assert(init.serverInfo.name === "iron-city-gym", "initialize");
const { tools } = await rpc("tools/list");
assert(tools.map((t) => t.name).join() === "search_classes,get_class,enroll_class,cancel_enrollment", "tools/list");
const uri = tools[0]._meta?.ui?.resourceUri;
const ui = (await rpc("resources/read", { uri })).contents?.[0];
assert(uri && ui?.mimeType === "text/html;profile=mcp-app" && ui.text.includes("ui/initialize"), "search_classes tem widget (resources/read)");

const all = await call("search_classes", {});
assert(all.classes.every((c) => c.status === "available"), `search_classes só available (${all.count})`);
const yoga = await call("search_classes", { modality: "YOGA", date: "2026-11-07" });
assert(yoga.count === 1 && yoga.classes[0].id === "class-002", "yoga no sábado 07/11");
const evening = await call("search_classes", { min_time: "18:00", max_price: 40 });
assert(evening.classes.every((c) => c.time >= "18:00" && c.price <= 40) && evening.count > 0, `depois das 18h até R$40 (${evening.count})`);
const pair = await call("search_classes", { min_spots: 2 });
assert(pair.classes.every((c) => c.spots_left >= 2) && pair.count > 0, `vaga para 2 pessoas (${pair.count})`);
assert((await call("get_class", { id: "nope" })).error === "not_found", "get_class not_found");

// Matrícula (desfaz tudo no fim). class-001 tem 2 vagas, class-010 tem 1, class-008 está cancelada.
const T = "Teste MCP";
const a = await call("enroll_class", { class_id: "class-001", name: T });
assert(a.ok && a.spots_left === 1, "enroll_class ocupa uma vaga");
assert((await call("enroll_class", { class_id: "class-001", name: "teste mcp" })).error === "already_enrolled", "mesmo nome não entra duas vezes");
assert((await call("get_class", { id: "class-001" })).spots_left === 1, "get_class mostra a vaga ocupada");
assert((await call("enroll_class", { class_id: "class-008", name: T })).error === "cancelled", "aula cancelada recusa");
assert((await call("enroll_class", { class_id: "nope", name: T })).error === "not_found", "aula inexistente");
assert((await call("enroll_class", { class_id: "class-001", name: "  " })).error === "invalid_name", "nome vazio");
const race = await Promise.all([1, 2, 3].map((i) => call("enroll_class", { class_id: "class-010", name: `${T} ${i}` })));
assert(race.filter((r) => r.ok).length === 1 && race.filter((r) => r.error === "full").length === 2, "3 ao mesmo tempo na última vaga: só 1 entra");
assert((await call("get_class", { id: "class-010" })).status === "full", "aula lotada vira full");
assert((await call("search_classes", { modality: "crossfit" })).classes.every((c) => c.id !== "class-010"), "lotada sai da busca");
assert((await call("cancel_enrollment", { class_id: "class-001", name: "TESTE MCP" })).ok, "cancel_enrollment");
assert((await call("cancel_enrollment", { class_id: "class-001", name: T })).error === "not_enrolled", "cancelar de novo: not_enrolled");
for (const r of race.filter((r) => r.ok)) await call("cancel_enrollment", { class_id: "class-010", name: r.name });
assert((await call("get_class", { id: "class-010" })).spots_left === 1, "cancelar libera a vaga");
