import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { storeBuffer, storeDataUrl } from "@/lib/storage";

export const runtime = "nodejs";

// Accepts either multipart form-data (field `file`) or JSON { dataUrl, filename }.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.studioId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const ct = req.headers.get("content-type") || "";
  try {
    if (ct.includes("application/json")) {
      const { dataUrl, filename } = await req.json();
      if (typeof dataUrl !== "string") return NextResponse.json({ error: "dataUrl required" }, { status: 400 });
      const stored = await storeDataUrl(dataUrl, filename || "image.png");
      return NextResponse.json(stored);
    }
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "file required" }, { status: 400 });
    if (file.size > 12_000_000) return NextResponse.json({ error: "file too large" }, { status: 413 });
    const buf = Buffer.from(await file.arrayBuffer());
    const stored = await storeBuffer(buf, { filename: file.name || "image", contentType: file.type || "application/octet-stream" });
    return NextResponse.json(stored);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "upload failed" }, { status: 500 });
  }
}
