import { allClasses, fmtDate, searchClasses, type GymClass } from "@/lib/classes";

type Params = Record<string, string | undefined>;

const LEVELS = ["iniciante", "intermediário", "avançado", "todos"];
const STATUS_LABEL = { available: "Vagas abertas", full: "Lotada", cancelled: "Cancelada" };

export default async function Home({ searchParams }: { searchParams: Promise<Params> }) {
  const p = await searchParams;
  const hasFilters = Object.values(p).some(Boolean);
  const num = (v?: string) => (v ? Number(v) : undefined);
  const classes: GymClass[] = hasFilters
    ? searchClasses({
        date: p.date || undefined,
        modality: p.modality || undefined,
        level: p.level || undefined,
        max_price: num(p.max_price),
        min_time: p.min_time || undefined,
        min_spots: num(p.min_spots),
      })
    : allClasses();

  return (
    <>
      <h1>Grade de aulas</h1>
      <form className="filters">
        <label>Data<input type="date" name="date" defaultValue={p.date} /></label>
        <label>Modalidade<input name="modality" placeholder="ex.: yoga" defaultValue={p.modality} /></label>
        <label>
          Nível
          <select name="level" defaultValue={p.level ?? ""}>
            <option value="">qualquer</option>
            {LEVELS.map((l) => <option key={l}>{l}</option>)}
          </select>
        </label>
        <label>Preço máx. (R$)<input type="number" name="max_price" min="0" defaultValue={p.max_price} /></label>
        <label>A partir de<input type="time" name="min_time" defaultValue={p.min_time} /></label>
        <label>Vagas mín.<input type="number" name="min_spots" min="1" defaultValue={p.min_spots} /></label>
        <button type="submit">Filtrar</button>
        {hasFilters && <a href="/">Limpar</a>}
      </form>

      <p className="muted">
        {hasFilters ? `${classes.length} aula(s) disponível(is) com esses filtros.` : `${classes.length} aulas na grade.`}
      </p>

      <div className="grid">
        {classes.map((c) => (
          <a key={c.id} href={`/aulas/${c.id}`} className={`card ${c.status}`}>
            <div className="row">
              <strong>{c.modality}</strong>
              <span className={`badge ${c.status}`}>{STATUS_LABEL[c.status]}</span>
            </div>
            <div>{fmtDate(c.date)} · {c.time} · {c.duration_min} min</div>
            <div className="muted">{c.instructor} · {c.level}</div>
            <div className="row">
              <span>R$ {c.price}</span>
              <span className="muted">{c.spots_left}/{c.capacity} vagas</span>
            </div>
          </a>
        ))}
      </div>
    </>
  );
}
