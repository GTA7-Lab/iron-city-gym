import { notFound } from "next/navigation";
import { fmtDate, getClass } from "@/lib/classes";

export default async function ClassPage({ params }: { params: Promise<{ id: string }> }) {
  const c = await getClass((await params).id);
  if ("error" in c) notFound();

  return (
    <article className="detail">
      <a href="/">← Voltar à grade</a>
      <h1>{c.modality}</h1>
      {c.description && <p>{c.description}</p>}
      <dl>
        <dt>Instrutor</dt><dd>{c.instructor}</dd>
        <dt>Data</dt><dd>{fmtDate(c.date)} ({c.date})</dd>
        <dt>Horário</dt><dd>{c.time} · {c.duration_min} min</dd>
        <dt>Nível</dt><dd>{c.level}</dd>
        <dt>Preço avulso</dt><dd>R$ {c.price}</dd>
        <dt>Vagas</dt><dd>{c.spots_left} de {c.capacity}</dd>
        <dt>Status</dt><dd><span className={`badge ${c.status}`}>{c.status}</span></dd>
        <dt>Id</dt><dd><code>{c.id}</code></dd>
      </dl>
    </article>
  );
}
