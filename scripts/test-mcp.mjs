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
assert(tools.map((t) => t.name).join() === "search_classes,get_class", "tools/list");

const all = await call("search_classes", {});
assert(all.classes.every((c) => c.status === "available"), `search_classes só available (${all.count})`);
const yoga = await call("search_classes", { modality: "YOGA", date: "2026-11-07" });
assert(yoga.count === 1 && yoga.classes[0].id === "class-002", "yoga no sábado 07/11");
const evening = await call("search_classes", { min_time: "18:00", max_price: 40 });
assert(evening.classes.every((c) => c.time >= "18:00" && c.price <= 40) && evening.count > 0, `depois das 18h até R$40 (${evening.count})`);
const group = await call("search_classes", { min_spots: 10 });
assert(group.classes.every((c) => c.spots_left >= 10) && group.count > 0, `vaga para 10 pessoas (${group.count})`);
assert((await call("get_class", { id: "class-003" })).status === "full", "get_class retorna aula full");
assert((await call("get_class", { id: "nope" })).error === "not_found", "get_class not_found");
