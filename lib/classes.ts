import data from "@/data/classes.json";

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
  modality?: string;
  level?: string;
  max_price?: number;
  min_time?: string;
  min_spots?: number;
}

const classes = data as GymClass[];

const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

const byDateTime = (a: GymClass, b: GymClass) =>
  (a.date + a.time).localeCompare(b.date + b.time);

export function allClasses(): GymClass[] {
  return [...classes].sort(byDateTime);
}

// Só aulas "available", ordenadas por data e horário.
export function searchClasses(f: SearchFilters = {}): GymClass[] {
  return classes
    .filter((c) => c.status === "available")
    .filter((c) => !f.date || c.date === f.date)
    .filter((c) => !f.modality || norm(c.modality).includes(norm(f.modality)))
    .filter((c) => !f.level || norm(c.level) === norm(f.level))
    .filter((c) => f.max_price == null || c.price <= f.max_price)
    .filter((c) => !f.min_time || c.time >= f.min_time)
    .filter((c) => f.min_spots == null || c.spots_left >= f.min_spots)
    .sort(byDateTime);
}

export function getClass(id: string): GymClass | { error: "not_found" } {
  return classes.find((c) => c.id === id) ?? { error: "not_found" };
}

export const fmtDate = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
