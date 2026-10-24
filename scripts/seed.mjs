// Cria as tabelas e carrega a grade de data/classes.json. Uso: npm run db:seed
// Pode rodar de novo: atualiza as aulas e mantém as matrículas.
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

await sql`CREATE TABLE IF NOT EXISTS classes (
  id text PRIMARY KEY,
  modality text NOT NULL,
  instructor text NOT NULL,
  date text NOT NULL,
  time text NOT NULL,
  duration_min int NOT NULL,
  level text NOT NULL,
  price int NOT NULL,
  capacity int NOT NULL CHECK (capacity > 0),
  enrolled int NOT NULL DEFAULT 0 CHECK (enrolled >= 0 AND enrolled <= capacity),
  status text NOT NULL CHECK (status IN ('available', 'cancelled')),
  description text
)`;
await sql`CREATE TABLE IF NOT EXISTS enrollments (
  id serial PRIMARY KEY,
  class_id text NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
)`;
await sql`CREATE UNIQUE INDEX IF NOT EXISTS enrollments_class_name ON enrollments (class_id, lower(name))`;

const classes = JSON.parse(readFileSync(new URL("../data/classes.json", import.meta.url), "utf8"));
for (const c of classes) {
  await sql`INSERT INTO classes (id, modality, instructor, date, time, duration_min, level, price, capacity, status, description)
    VALUES (${c.id}, ${c.modality}, ${c.instructor}, ${c.date}, ${c.time}, ${c.duration_min}, ${c.level}, ${c.price}, ${c.capacity}, ${c.status}, ${c.description ?? null})
    ON CONFLICT (id) DO UPDATE SET modality = EXCLUDED.modality, instructor = EXCLUDED.instructor, date = EXCLUDED.date,
      time = EXCLUDED.time, duration_min = EXCLUDED.duration_min, level = EXCLUDED.level, price = EXCLUDED.price,
      capacity = EXCLUDED.capacity, status = EXCLUDED.status, description = EXCLUDED.description`;
}
console.log(`${classes.length} aulas carregadas.`);
