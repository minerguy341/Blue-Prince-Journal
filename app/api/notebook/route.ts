import { getNotebook, refreshNotebook } from "@/lib/save-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return Response.json(getNotebook());
}

export async function POST() {
  return Response.json(refreshNotebook());
}
