import { neon } from "@neondatabase/serverless";

export type Level = "iniciante" | "intermediário" | "avançado" | "todos";
export type Status = "available" | "full" | "cancelled";

export interface GymClass {
  id: string;
  modality: string;
  instructor: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  duration_min: number;
  level: Level;
  price: number; // R$, inteiro
  capacity: number;
  spots_left: number;
  status: Status;
  description?: string;
}

export interface SearchFilters {
  date?: string;
  date_from?: string;
  date_to?: string;
  modality?: string;
  instructor?: string;
  level?: string;
  max_price?: number;
  min_time?: string;
  max_time?: string;
  min_spots?: number;
}

const sql = neon(process.env.DATABASE_URL!);

type Row = Omit<GymClass, "spots_left" | "status"> & { enrolled: number; status: "available" | "cancelled" };

// "full" e spots_left saem da contagem de matrículas.
const toClass = ({ enrolled, ...r }: Row): GymClass => ({
  ...r,
  description: r.description ?? undefined,
  spots_left: r.capacity - enrolled,
  status: r.status === "cancelled" ? "cancelled" : enrolled >= r.capacity ? "full" : "available",
});

const loadClasses = async () => ((await sql`SELECT * FROM classes`) as Row[]).map(toClass);

const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

const byDateTime = (a: GymClass, b: GymClass) =>
  (a.date + a.time).localeCompare(b.date + b.time);

export async function allClasses(): Promise<GymClass[]> {
  return (await loadClasses()).sort(byDateTime);
}

// Só aulas "available", ordenadas por data e horário.
// Aulas de nível "todos" entram em qualquer filtro de nível.
export async function searchClasses(f: SearchFilters = {}): Promise<GymClass[]> {
  return (await loadClasses())
    .filter((c) => c.status === "available")
    .filter((c) => !f.date || c.date === f.date)
    .filter((c) => !f.date_from || c.date >= f.date_from)
    .filter((c) => !f.date_to || c.date <= f.date_to)
    .filter((c) => !f.modality || norm(c.modality).includes(norm(f.modality)))
    .filter((c) => !f.instructor || norm(c.instructor).includes(norm(f.instructor)))
    .filter((c) => !f.level || c.level === "todos" || norm(c.level) === norm(f.level))
    .filter((c) => f.max_price == null || c.price <= f.max_price)
    .filter((c) => !f.min_time || c.time >= f.min_time)
    .filter((c) => !f.max_time || c.time <= f.max_time)
    .filter((c) => f.min_spots == null || c.spots_left >= f.min_spots)
    .sort(byDateTime);
}

// Valores válidos para os filtros, tirados da grade inteira.
export async function listOptions() {
  const classes = await loadClasses();
  const uniq = (xs: string[]) => [...new Set(xs)].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const dates = classes.map((c) => c.date).sort();
  return {
    modalities: uniq(classes.map((c) => c.modality)),
    instructors: uniq(classes.map((c) => c.instructor)),
    levels: ["iniciante", "intermediário", "avançado", "todos"],
    date_range: { from: dates[0], to: dates[dates.length - 1] },
  };
}

export async function getClass(id: string): Promise<GymClass | { error: "not_found" }> {
  const [row] = (await sql`SELECT * FROM classes WHERE id = ${id}`) as Row[];
  return row ? toClass(row) : { error: "not_found" };
}

export type EnrollResult =
  | { ok: true; class_id: string; name: string; spots_left: number }
  | { error: "not_found" | "cancelled" | "full" | "already_enrolled" | "not_enrolled" | "invalid_name" };

// Ocupa a vaga e grava a matrícula num só comando: duas pessoas não levam a última vaga.
export async function enroll(classId: string, name: string): Promise<EnrollResult> {
  name = name.trim();
  if (!name) return { error: "invalid_name" };
  try {
    const [row] = await sql`
      WITH seat AS (
        UPDATE classes SET enrolled = enrolled + 1
        WHERE id = ${classId} AND status = 'available' AND enrolled < capacity
        RETURNING id, capacity - enrolled AS spots_left
      )
      INSERT INTO enrollments (class_id, name) SELECT id, ${name} FROM seat
      RETURNING (SELECT spots_left FROM seat)`;
    if (row) return { ok: true, class_id: classId, name, spots_left: row.spots_left };
  } catch (e: any) {
    if (e.code === "23505") return { error: "already_enrolled" };
    throw e;
  }
  const c = await getClass(classId);
  return { error: "error" in c ? "not_found" : c.status === "cancelled" ? "cancelled" : "full" };
}

export async function cancelEnrollment(classId: string, name: string): Promise<EnrollResult> {
  const [row] = await sql`
    WITH gone AS (
      DELETE FROM enrollments WHERE class_id = ${classId} AND lower(name) = lower(${name.trim()})
      RETURNING class_id, name
    )
    UPDATE classes SET enrolled = enrolled - 1 FROM gone WHERE classes.id = gone.class_id
    RETURNING gone.name, capacity - enrolled AS spots_left`;
  if (row) return { ok: true, class_id: classId, name: row.name, spots_left: row.spots_left };
  return "error" in (await getClass(classId)) ? { error: "not_found" } : { error: "not_enrolled" };
}

export const fmtDate = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
