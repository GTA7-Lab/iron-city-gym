import { searchClasses } from "@/lib/classes";

export function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const num = (k: string) => (p.get(k) ? Number(p.get(k)) : undefined);
  return Response.json(
    searchClasses({
      date: p.get("date") || undefined,
      modality: p.get("modality") || undefined,
      level: p.get("level") || undefined,
      max_price: num("max_price"),
      min_time: p.get("min_time") || undefined,
      min_spots: num("min_spots"),
    })
  );
}
