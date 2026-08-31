"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FLASH, flashDataUrl } from "@/lib/flash";

type StudioDesign = { id: string; name: string; imageUrl: string };
type Picked = { name: string; src: string }; // src is a same-origin data/object URL

const MAXDIM = 1000;

function loadImage(src: string, crossOrigin = false): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

async function toSameOrigin(url: string): Promise<string> {
  // Fetch a (possibly cross-origin) image and return a same-origin object URL,
  // so drawing it to canvas never taints the export.
  const r = await fetch(url);
  const blob = await r.blob();
  return URL.createObjectURL(blob);
}

async function uploadDataUrl(dataUrl: string, filename: string): Promise<string> {
  const r = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataUrl, filename }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || "upload failed");
  return j.url as string;
}

export default function TryOn({ designs }: { designs: StudioDesign[] }) {
  const [step, setStep] = useState<"photo" | "place" | "result">("photo");

  // client
  const [clientName, setClientName] = useState("");
  const [clientContact, setClientContact] = useState("");
  const [consent, setConsent] = useState(false);

  // photo
  const [photoData, setPhotoData] = useState<string | null>(null);
  const baseImgRef = useRef<HTMLImageElement | null>(null);

  // design + transform
  const [picked, setPicked] = useState<Picked | null>(null);
  const designImgRef = useRef<HTMLImageElement | null>(null);
  const [tab, setTab] = useState<"flash" | "studio">(designs.length ? "studio" : "flash");
  const [tf, setTf] = useState({ x: 0.5, y: 0.5, scale: 0.42, rot: 0, opacity: 0.9 });

  // render
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [result, setResult] = useState<{ sessionId: string; beforeUrl: string; afterUrl: string } | null>(null);
  const [error, setError] = useState("");
  const sessionIdRef = useRef<string | null>(null);
  const photoUrlRef = useRef<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // ---- canvas draw ----
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const base = baseImgRef.current;
    if (!canvas || !base) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(base, 0, 0, canvas.width, canvas.height);
    const d = designImgRef.current;
    if (d) {
      const cw = canvas.width;
      const w = d.naturalWidth || d.width;
      const h = d.naturalHeight || d.height;
      const drawW = cw * tf.scale;
      const drawH = drawW * (h / w);
      ctx.save();
      ctx.globalAlpha = tf.opacity;
      ctx.globalCompositeOperation = "multiply";
      ctx.translate(tf.x * canvas.width, tf.y * canvas.height);
      ctx.rotate(tf.rot);
      ctx.drawImage(d, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();
    }
  }, [tf]);

  useEffect(() => { draw(); }, [draw, step]);

  // ---- photo intake ----
  async function setPhotoFromDataUrl(dataUrl: string) {
    const img = await loadImage(dataUrl);
    const scale = Math.min(1, MAXDIM / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);
    const canvas = canvasRef.current!;
    canvas.width = w; canvas.height = h;
    baseImgRef.current = img;
    setPhotoData(dataUrl);
    photoUrlRef.current = null;
    sessionIdRef.current = null;
    // upload in the background for the provider record
    uploadDataUrl(dataUrl, "photo.jpg").then((u) => (photoUrlRef.current = u)).catch(() => {});
  }

  function onPhotoFile(file: File) {
    const fr = new FileReader();
    fr.onload = () => setPhotoFromDataUrl(String(fr.result));
    fr.readAsDataURL(file);
  }

  // camera
  const [camOn, setCamOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      streamRef.current = stream;
      setCamOn(true);
      setTimeout(() => { if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); } }, 50);
    } catch { setError("Couldn't access the camera. Upload a photo instead."); }
  }
  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamOn(false);
  }
  function capture() {
    const v = videoRef.current;
    if (!v) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d")!.drawImage(v, 0, 0);
    stopCamera();
    setPhotoFromDataUrl(c.toDataURL("image/jpeg", 0.92));
  }
  useEffect(() => () => stopCamera(), []);

  // ---- design pick ----
  async function pickFlash(body: string, name: string) {
    const src = flashDataUrl(body);
    designImgRef.current = await loadImage(src);
    setPicked({ name, src });
    draw();
  }
  async function pickStudio(d: StudioDesign) {
    try {
      const src = await toSameOrigin(d.imageUrl); // avoid canvas taint
      designImgRef.current = await loadImage(src);
      setPicked({ name: d.name, src });
      draw();
    } catch { setError("Couldn't load that design."); }
  }

  // ---- generate ----
  async function generate() {
    if (!picked) { setError("Pick a design first."); return; }
    setError(""); setBusy(true); setStatusMsg("Preparing the placement…");
    try {
      const canvas = canvasRef.current!;
      const compositeData = canvas.toDataURL("image/jpeg", 0.92);
      const [compositeUrl, photoUrl] = await Promise.all([
        uploadDataUrl(compositeData, "composite.jpg"),
        photoUrlRef.current ? Promise.resolve(photoUrlRef.current) : uploadDataUrl(photoData!, "photo.jpg"),
      ]);
      photoUrlRef.current = photoUrl;

      setStatusMsg("Sending to the AI…");
      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionIdRef.current ?? undefined,
          clientName: clientName || undefined,
          clientContact: clientContact || undefined,
          consent,
          photoUrl,
          compositeUrl,
          designName: picked.name,
          placement: tf,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Render failed");
      sessionIdRef.current = j.sessionId;

      // poll
      setStatusMsg("Rendering the tattoo onto the skin…");
      let tries = 0;
      const poll = async (): Promise<void> => {
        const r = await fetch(`/api/render/${j.renderId}`);
        const s = await r.json();
        if (s.status === "completed" && s.resultUrl) {
          setResult({ sessionId: j.sessionId, beforeUrl: compositeUrl, afterUrl: s.resultUrl });
          setStep("result");
          return;
        }
        if (s.status === "failed") throw new Error(s.error || "The AI render failed.");
        if (tries++ > 90) throw new Error("Timed out waiting for the render.");
        await new Promise((r) => setTimeout(r, 2000));
        return poll();
      };
      await poll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false); setStatusMsg("");
    }
  }

  function reset(keepPhoto: boolean) {
    setResult(null); setError("");
    if (!keepPhoto) { setPicked(null); designImgRef.current = null; }
    setStep(keepPhoto ? "place" : "photo");
  }

  // ================= UI =================
  return (
    <div>
      <div style={{ display: "flex", gap: ".6rem", marginBottom: "1.4rem" }}>
        {["photo", "place", "result"].map((s, i) => (
          <div key={s} style={{ flex: 1, height: 4, borderRadius: 4, background: step === s || (["photo", "place", "result"].indexOf(step) > i) ? "var(--accent)" : "var(--line)" }} />
        ))}
      </div>

      {error && <p className="card" style={{ borderColor: "var(--bad)", color: "var(--bad)", marginBottom: "1rem", padding: ".8rem 1rem" }}>{error}</p>}

      {/* STEP 1: photo */}
      {step === "photo" && (
        <div style={{ display: "grid", gap: "1.4rem", gridTemplateColumns: "minmax(0,1fr) 320px" }} className="tryon-grid">
          <div className="card" style={{ display: "grid", placeItems: "center", minHeight: 360, position: "relative", overflow: "hidden" }}>
            {camOn ? (
              <div style={{ position: "relative", width: "100%", height: "100%", display: "grid", placeItems: "center" }}>
                <video ref={videoRef} playsInline style={{ maxWidth: "100%", maxHeight: 420, borderRadius: 10 }} />
                <div style={{ position: "absolute", bottom: 12, display: "flex", gap: ".6rem" }}>
                  <button className="btn btn-solid" onClick={capture}>Capture</button>
                  <button className="btn btn-ghost" onClick={stopCamera}>Cancel</button>
                </div>
              </div>
            ) : photoData ? (
              <img src={photoData} alt="client" style={{ maxWidth: "100%", maxHeight: 420, borderRadius: 10 }} />
            ) : (
              <div style={{ textAlign: "center", color: "var(--muted)" }}>
                <p style={{ marginBottom: "1rem" }}>Add a photo of where the tattoo will go.</p>
                <div style={{ display: "flex", gap: ".6rem", justifyContent: "center", flexWrap: "wrap" }}>
                  <label className="btn btn-solid">
                    Upload photo
                    <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && onPhotoFile(e.target.files[0])} />
                  </label>
                  <button className="btn btn-ghost" onClick={startCamera}>Use camera</button>
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="serif" style={{ fontSize: "1.2rem", fontWeight: 400, marginBottom: ".8rem" }}>Client</h3>
            <label className="field"><span className="label">Name (optional)</span>
              <input className="input" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Walk-in" /></label>
            <label className="field"><span className="label">Email / phone (optional)</span>
              <input className="input" value={clientContact} onChange={(e) => setClientContact(e.target.value)} placeholder="to send the mockup" /></label>
            <label style={{ display: "flex", gap: ".6rem", alignItems: "flex-start", fontSize: ".85rem", color: "var(--muted)", margin: ".4rem 0 1.2rem" }}>
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: 3 }} />
              <span>Client consents to their photo being used to generate a tattoo preview.</span>
            </label>
            <button className="btn btn-solid btn-block" disabled={!photoData || !consent} onClick={() => setStep("place")}>
              Continue to placement →
            </button>
            {!consent && <p className="faint" style={{ fontSize: ".78rem", marginTop: ".6rem" }}>Consent is required to continue.</p>}
          </div>
        </div>
      )}

      {/* STEP 2: place */}
      {step === "place" && (
        <div style={{ display: "grid", gap: "1.4rem", gridTemplateColumns: "minmax(0,1fr) 340px" }} className="tryon-grid">
          <div className="card" style={{ display: "grid", placeItems: "center", padding: "1rem" }}>
            <canvas
              ref={canvasRef}
              style={{ maxWidth: "100%", maxHeight: 480, borderRadius: 8, touchAction: "none", cursor: "grab" }}
              onPointerDown={(e) => {
                const el = e.currentTarget; el.setPointerCapture(e.pointerId);
                const rect = el.getBoundingClientRect();
                const move = (ev: PointerEvent) => {
                  setTf((t) => ({ ...t, x: (ev.clientX - rect.left) / rect.width, y: (ev.clientY - rect.top) / rect.height }));
                };
                const up = () => { el.removeEventListener("pointermove", move as EventListener); el.removeEventListener("pointerup", up); };
                el.addEventListener("pointermove", move as EventListener);
                el.addEventListener("pointerup", up);
                move(e.nativeEvent);
              }}
              onWheel={(e) => setTf((t) => ({ ...t, scale: Math.max(0.05, Math.min(1.4, t.scale * (e.deltaY < 0 ? 1.06 : 0.94)) ) }))}
            />
          </div>

          <div className="card" style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", gap: ".5rem", marginBottom: "1rem" }}>
              <button className={`btn btn-sm ${tab === "studio" ? "btn-solid" : "btn-ghost"}`} onClick={() => setTab("studio")}>Your flash</button>
              <button className={`btn btn-sm ${tab === "flash" ? "btn-solid" : "btn-ghost"}`} onClick={() => setTab("flash")}>Built-in</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: ".5rem", maxHeight: 190, overflowY: "auto", marginBottom: "1rem" }}>
              {tab === "flash"
                ? FLASH.map((d) => (
                    <button key={d.id} title={d.name} onClick={() => pickFlash(d.body, d.name)}
                      style={{ aspectRatio: "1", border: "1px solid var(--line)", borderRadius: 8, background: "var(--bg)", padding: 6, cursor: "pointer" }}>
                      <img src={flashDataUrl(d.body, "#e7e2d8")} alt={d.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    </button>
                  ))
                : designs.length
                ? designs.map((d) => (
                    <button key={d.id} title={d.name} onClick={() => pickStudio(d)}
                      style={{ aspectRatio: "1", border: "1px solid var(--line)", borderRadius: 8, background: "var(--bg)", padding: 6, cursor: "pointer" }}>
                      <img src={d.imageUrl} alt={d.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    </button>
                  ))
                : <p className="faint" style={{ gridColumn: "1/-1", fontSize: ".82rem" }}>No studio flash yet — add some in <Link href="/app/library" style={{ color: "var(--gold)" }}>Library</Link>, or use built-in.</p>}
            </div>

            <div style={{ opacity: picked ? 1 : 0.5, pointerEvents: picked ? "auto" : "none" }}>
              <label className="field"><span className="label">Size</span>
                <input type="range" min={5} max={140} value={Math.round(tf.scale * 100)} onChange={(e) => setTf((t) => ({ ...t, scale: +e.target.value / 100 }))} style={{ width: "100%" }} /></label>
              <label className="field"><span className="label">Rotation</span>
                <input type="range" min={-180} max={180} value={Math.round((tf.rot * 180) / Math.PI)} onChange={(e) => setTf((t) => ({ ...t, rot: (+e.target.value * Math.PI) / 180 }))} style={{ width: "100%" }} /></label>
              <label className="field"><span className="label">Opacity</span>
                <input type="range" min={30} max={100} value={Math.round(tf.opacity * 100)} onChange={(e) => setTf((t) => ({ ...t, opacity: +e.target.value / 100 }))} style={{ width: "100%" }} /></label>
            </div>

            <div style={{ marginTop: "auto", display: "flex", gap: ".5rem", paddingTop: "1rem" }}>
              <button className="btn btn-ghost" onClick={() => setStep("photo")}>← Photo</button>
              <button className="btn btn-solid" style={{ flex: 1 }} disabled={!picked || busy} onClick={generate}>
                {busy ? statusMsg || "Working…" : "✦ Generate realistic render"}
              </button>
            </div>
            <p className="faint" style={{ fontSize: ".72rem", marginTop: ".6rem" }}>Drag on the image to move · scroll to resize.</p>
          </div>
        </div>
      )}

      {/* STEP 3: result */}
      {step === "result" && result && (
        <div>
          <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "1fr 1fr", marginBottom: "1.4rem" }} className="tryon-grid">
            <figure className="card" style={{ padding: ".6rem" }}>
              <img src={result.beforeUrl} alt="placement" style={{ width: "100%", borderRadius: 8 }} />
              <figcaption className="faint" style={{ textAlign: "center", fontSize: ".72rem", marginTop: ".4rem", textTransform: "uppercase", letterSpacing: ".1em" }}>Placement</figcaption>
            </figure>
            <figure className="card" style={{ padding: ".6rem", borderColor: "var(--gold)" }}>
              <img src={result.afterUrl} alt="AI render" style={{ width: "100%", borderRadius: 8 }} />
              <figcaption style={{ textAlign: "center", fontSize: ".72rem", marginTop: ".4rem", textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)" }}>AI render</figcaption>
            </figure>
          </div>
          <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap" }}>
            <Link href={`/app/sessions/${result.sessionId}`} className="btn btn-solid">Save & view session</Link>
            <button className="btn btn-ghost" onClick={() => reset(true)}>Try another design</button>
            <button className="btn btn-ghost" onClick={() => reset(false)}>New client</button>
          </div>
        </div>
      )}

      <style>{`@media(max-width:820px){.tryon-grid{grid-template-columns:1fr !important}}`}</style>
    </div>
  );
}
