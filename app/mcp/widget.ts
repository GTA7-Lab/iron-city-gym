// Widget MCP Apps da grade: recebe o resultado de search_classes e matricula via enroll_class.
// Fala com o host por postMessage (JSON-RPC), sem SDK e sem recursos externos (CSP padrão).
// Dentro do <script> não usar crase nem cifrão-chave: o HTML é uma template string.
export const WIDGET_HTML = String.raw`<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Grade de aulas — Academia Iron City</title>
<style>
  :root {
    --bg: #faf8f5; --card: #ffffff; --ink: #1d1a17; --muted: #6f675f; --line: #e9e3db;
    --accent: #e0561b; --accent-ink: #ffffff; --accent-soft: #fdeee6; --ok: #1f8a4c; --ok-soft: #e6f4ec;
    --warn: #b4441a; --seat: #d9d2c8; --radius: 14px;
    --font: var(--font-sans, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  }
  :root[data-theme="dark"] {
    --bg: #161412; --card: #201d1a; --ink: #f3eee8; --muted: #a59c92; --line: #34302b;
    --accent: #ff7a3d; --accent-ink: #1a0f08; --accent-soft: #3a2418; --ok: #53c486; --ok-soft: #1b3326;
    --warn: #ff8a5c; --seat: #4a443d;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --bg: #161412; --card: #201d1a; --ink: #f3eee8; --muted: #a59c92; --line: #34302b;
      --accent: #ff7a3d; --accent-ink: #1a0f08; --accent-soft: #3a2418; --ok: #53c486; --ok-soft: #1b3326;
      --warn: #ff8a5c; --seat: #4a443d;
    }
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; background: var(--bg); color: var(--ink); font: 14px/1.45 var(--font); }
  .wrap { padding: 18px 16px 20px; max-width: 760px; margin: 0 auto; }
  .eyebrow { font-size: 11px; letter-spacing: .14em; text-transform: uppercase; color: var(--accent); font-weight: 700; }
  h1 { font-size: 22px; line-height: 1.2; margin: 4px 0 2px; letter-spacing: -.01em; }
  .sub { color: var(--muted); margin: 0 0 14px; }
  .days { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 4px; margin-bottom: 14px; scrollbar-width: none; }
  .days::-webkit-scrollbar { display: none; }
  .chip { flex: none; border: 1px solid var(--line); background: var(--card); color: var(--ink); border-radius: 999px;
    padding: 6px 12px; font: inherit; font-size: 13px; cursor: pointer; white-space: nowrap; }
  .chip[aria-pressed="true"] { background: var(--ink); color: var(--bg); border-color: var(--ink); }
  .day-label { font-size: 12px; font-weight: 700; color: var(--muted); margin: 16px 2px 8px; }
  .day-label::first-letter { text-transform: uppercase; }
  .day-label:first-child { margin-top: 0; }
  .card { display: grid; grid-template-columns: 64px 1fr auto; gap: 14px; align-items: center; background: var(--card);
    border: 1px solid var(--line); border-radius: var(--radius); padding: 14px; margin-bottom: 8px; transition: border-color .15s; }
  .card.open { border-color: var(--accent); }
  .card.done { border-color: var(--ok); }
  .time { text-align: center; border-right: 1px solid var(--line); padding-right: 12px; }
  .time b { display: block; font-size: 18px; letter-spacing: -.02em; }
  .time span { font-size: 11px; color: var(--muted); }
  .title { font-weight: 650; font-size: 15px; }
  .meta { color: var(--muted); font-size: 13px; margin-top: 2px; }
  .tag { display: inline-block; font-size: 11px; padding: 1px 7px; border-radius: 999px; background: var(--accent-soft);
    color: var(--warn); margin-left: 6px; vertical-align: 1px; text-transform: capitalize; }
  .side { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
  .price { font-weight: 700; }
  .seats { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--muted); }
  .seat { width: 9px; height: 9px; border-radius: 50%; background: var(--accent); }
  .seat.taken { background: var(--seat); }
  button.primary { background: var(--accent); color: var(--accent-ink); border: 0; border-radius: 10px; padding: 8px 14px;
    font: inherit; font-weight: 650; cursor: pointer; }
  button.primary:disabled { opacity: .55; cursor: default; }
  button.ghost { background: none; border: 0; color: var(--muted); font: inherit; cursor: pointer; padding: 8px 6px; text-decoration: underline; }
  .full { font-size: 12px; font-weight: 700; color: var(--muted); }
  .panel { grid-column: 1 / -1; display: flex; gap: 8px; flex-wrap: wrap; align-items: center; border-top: 1px dashed var(--line); padding-top: 12px; }
  .panel input { flex: 1 1 180px; min-width: 0; border: 1px solid var(--line); background: var(--bg); color: var(--ink);
    border-radius: 10px; padding: 9px 12px; font: inherit; }
  .panel input:focus { outline: 2px solid var(--accent); outline-offset: 1px; border-color: transparent; }
  .msg { grid-column: 1 / -1; font-size: 13px; }
  .msg.err { color: var(--warn); }
  .ok-box { grid-column: 1 / -1; display: flex; justify-content: space-between; align-items: center; gap: 8px;
    background: var(--ok-soft); color: var(--ok); border-radius: 10px; padding: 9px 12px; font-weight: 600; }
  .empty { text-align: center; color: var(--muted); padding: 32px 8px; border: 1px dashed var(--line); border-radius: var(--radius); }
  @media (max-width: 460px) {
    .card { grid-template-columns: 54px 1fr; }
    .side { grid-column: 1 / -1; flex-direction: row; justify-content: space-between; align-items: center; }
  }
</style>
</head>
<body>
<div class="wrap">
  <div class="eyebrow">Academia Iron City</div>
  <h1>Escolha sua aula</h1>
  <p class="sub" id="sub">Carregando a grade…</p>
  <div class="days" id="days" role="toolbar" aria-label="Filtrar por dia"></div>
  <div id="list"></div>
</div>
<script>
(function () {
  var classes = [];
  var day = "";
  var openId = null;
  var done = {};     // class_id -> nome matriculado aqui
  var errors = {};   // class_id -> mensagem
  var busy = {};
  var draft = {};    // class_id -> nome digitado (sobrevive ao re-render)
  var nextId = 1;
  var pending = {};

  // ---- JSON-RPC com o host ----
  function send(msg) { window.parent.postMessage(msg, "*"); }
  function request(method, params) {
    var id = nextId++;
    send({ jsonrpc: "2.0", id: id, method: method, params: params });
    return new Promise(function (resolve, reject) { pending[id] = { resolve: resolve, reject: reject }; });
  }
  function notify(method, params) { send({ jsonrpc: "2.0", method: method, params: params }); }

  window.addEventListener("message", function (ev) {
    var m = ev.data;
    if (!m || m.jsonrpc !== "2.0") return;
    if (m.id != null && pending[m.id] && !m.method) {
      var p = pending[m.id]; delete pending[m.id];
      if (m.error) p.reject(m.error); else p.resolve(m.result);
      return;
    }
    if (m.method === "ui/notifications/tool-result") onResult(m.params);
    else if (m.method === "ui/notifications/host-context-changed") applyContext(m.params);
    else if (m.method === "ui/resource-teardown" && m.id != null) send({ jsonrpc: "2.0", id: m.id, result: {} });
  });

  function applyContext(ctx) {
    if (!ctx) return;
    if (ctx.theme) document.documentElement.setAttribute("data-theme", ctx.theme);
    var vars = ctx.styles && ctx.styles.variables;
    if (vars && vars["--font-sans"]) document.documentElement.style.setProperty("--font-sans", vars["--font-sans"]);
  }

  function payload(result) {
    if (!result) return null;
    if (result.structuredContent) return result.structuredContent;
    var t = (result.content || []).filter(function (c) { return c.type === "text"; })[0];
    try { return t ? JSON.parse(t.text) : null; } catch (e) { return null; }
  }

  function onResult(result) {
    var data = payload(result);
    classes = (data && data.classes) || [];
    render();
  }

  function callTool(name, args) {
    return request("tools/call", { name: name, arguments: args }).then(payload);
  }

  // ---- Render ----
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function fmtDay(d, long) {
    var dt = new Date(d + "T12:00:00");
    return dt.toLocaleDateString("pt-BR", long ? { weekday: "long", day: "2-digit", month: "long" } : { weekday: "short", day: "2-digit" }).replace(".", "");
  }

  var ERR = {
    full: "Essa aula acabou de lotar.",
    cancelled: "Essa aula foi cancelada.",
    already_enrolled: "Esse nome já está matriculado nessa aula.",
    invalid_name: "Digite um nome.",
    not_found: "Aula não encontrada.",
    not_enrolled: "Matrícula não encontrada."
  };

  function render() {
    var days = [];
    classes.forEach(function (c) { if (days.indexOf(c.date) < 0) days.push(c.date); });
    if (day && days.indexOf(day) < 0) day = "";
    var dayBox = document.getElementById("days");
    dayBox.style.display = days.length > 1 ? "" : "none";
    dayBox.innerHTML = ['<button class="chip" data-day="" aria-pressed="' + (day === "") + '">Todos os dias</button>']
      .concat(days.map(function (d) {
        return '<button class="chip" data-day="' + d + '" aria-pressed="' + (day === d) + '">' + esc(fmtDay(d)) + "</button>";
      })).join("");

    var shown = classes.filter(function (c) { return !day || c.date === day; });
    var free = shown.filter(function (c) { return c.spots_left > 0; }).length;
    document.getElementById("sub").textContent = shown.length
      ? shown.length + (shown.length === 1 ? " aula" : " aulas") + ", " + free + " com vaga. Toque em Reservar e informe seu nome."
      : "";

    var list = document.getElementById("list");
    if (!shown.length) { list.innerHTML = '<div class="empty">Nenhuma aula com vaga para esses filtros.</div>'; resize(); return; }

    var html = [], last = "";
    shown.forEach(function (c) {
      if (c.date !== last) { html.push('<div class="day-label">' + esc(fmtDay(c.date, true)) + "</div>"); last = c.date; }
      html.push(card(c));
    });
    list.innerHTML = html.join("");
    var input = list.querySelector("input");
    if (input && document.activeElement !== input) input.focus();
    resize();
  }

  function card(c) {
    var seats = "";
    for (var i = 0; i < c.capacity; i++) seats += '<span class="seat' + (i < c.capacity - c.spots_left ? " taken" : "") + '"></span>';
    var left = c.spots_left === 1 ? "1 vaga" : c.spots_left + " vagas";
    var cls = "card" + (openId === c.id ? " open" : "") + (done[c.id] ? " done" : "");
    var action = done[c.id] ? "" : c.spots_left > 0
      ? '<button class="primary" data-act="open" data-id="' + c.id + '">Reservar</button>'
      : '<span class="full">Lotada</span>';
    var out = '<div class="' + cls + '">' +
      '<div class="time"><b>' + esc(c.time) + "</b><span>" + c.duration_min + " min</span></div>" +
      '<div><div class="title">' + esc(c.modality) + '<span class="tag">' + esc(c.level) + "</span></div>" +
      '<div class="meta">' + esc(c.instructor) + "</div></div>" +
      '<div class="side"><span class="price">R$ ' + c.price + "</span>" +
      '<span class="seats">' + seats + " " + left + "</span>" + action + "</div>";
    if (done[c.id]) {
      out += '<div class="ok-box"><span>✓ ' + esc(done[c.id]) + ", sua vaga está garantida.</span>" +
        '<button class="ghost" data-act="cancel" data-id="' + c.id + '"' + (busy[c.id] ? " disabled" : "") + ">Desfazer</button></div>";
    } else if (openId === c.id) {
      out += '<form class="panel" data-id="' + c.id + '"><input name="name" placeholder="Seu nome" autocomplete="name" maxlength="80" value="' + esc(draft[c.id] || "") + '"' +
        (busy[c.id] ? " disabled" : "") + '><button class="primary" type="submit"' + (busy[c.id] ? " disabled" : "") + ">" +
        (busy[c.id] ? "Reservando…" : "Confirmar") + '</button><button class="ghost" type="button" data-act="close">Voltar</button></form>';
    }
    if (errors[c.id]) out += '<div class="msg err">' + esc(errors[c.id]) + "</div>";
    return out + "</div>";
  }

  function update(id, patch) {
    classes = classes.map(function (c) { return c.id === id ? Object.assign({}, c, patch) : c; });
  }

  // ---- Ações ----
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest("button");
    if (!b) return;
    if (b.dataset.day !== undefined) { day = b.dataset.day; render(); return; }
    var id = b.dataset.id;
    if (b.dataset.act === "open") { openId = id; errors = {}; render(); }
    else if (b.dataset.act === "close") { openId = null; errors = {}; render(); }
    else if (b.dataset.act === "cancel") cancel(id);
  });

  document.addEventListener("input", function (ev) {
    var form = ev.target.form;
    if (form && form.dataset.id) draft[form.dataset.id] = ev.target.value;
  });

  document.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var form = ev.target, id = form.dataset.id, name = form.elements.name.value.trim();
    if (!name) { errors[id] = ERR.invalid_name; render(); return; }
    busy[id] = true; delete errors[id]; render();
    callTool("enroll_class", { class_id: id, name: name }).then(function (r) {
      if (r && r.ok) { done[id] = r.name; openId = null; update(id, { spots_left: r.spots_left }); }
      else {
        errors[id] = ERR[r && r.error] || "Não deu para reservar agora.";
        if (r && r.error === "full") update(id, { spots_left: 0 });
      }
    }, function () { errors[id] = "Não deu para falar com a academia. Tente de novo."; })
      .then(function () { delete busy[id]; render(); });
  });

  function cancel(id) {
    busy[id] = true; render();
    callTool("cancel_enrollment", { class_id: id, name: done[id] }).then(function (r) {
      if (r && r.ok) { delete done[id]; update(id, { spots_left: r.spots_left }); }
      else errors[id] = ERR[r && r.error] || "Não deu para desfazer agora.";
    }, function () { errors[id] = "Não deu para falar com a academia. Tente de novo."; })
      .then(function () { delete busy[id]; render(); });
  }

  // ---- Tamanho e handshake ----
  var lastH = 0;
  function resize() {
    var h = Math.ceil(document.documentElement.getBoundingClientRect().height);
    if (h !== lastH) { lastH = h; notify("ui/notifications/size-changed", { width: document.documentElement.clientWidth, height: h }); }
  }
  if (window.ResizeObserver) new ResizeObserver(resize).observe(document.body);

  request("ui/initialize", {
    protocolVersion: "2026-01-26",
    appInfo: { name: "iron-city-gym-grade", version: "1.0.0" },
    appCapabilities: { availableDisplayModes: ["inline"] }
  }).then(function (res) {
    applyContext(res && res.hostContext);
    notify("ui/notifications/initialized");
  }, function () {});
})();
</script>
</body>
</html>`;
