"use client";

import { useState, useRef } from "react";
import { fal } from "@fal-ai/client";

fal.config({ proxyUrl: "/api/fal/proxy" });

const STYLES = [
  { emo: "🏙️", title: "Billboard 3D", sub: "Sale del cartel gigante", cost: "premium", prompt: "Photorealistic anamorphic 3D LED billboard wrapping a building corner in a busy city, the exact product shown in the input image bursts forward out of the curved screen toward the viewer with a hyper-realistic 3D out-of-bounds illusion and dramatic depth, the product keeps its real shape, color and texture from the photo, ultra detailed, realistic city lighting at dusk, pedestrians and traffic below, no on-screen text, clean screen background" },
  { emo: "🧊", title: "Acercamiento 3D", sub: "Zoom con profundidad", cost: "eco", prompt: "Slow gentle camera push-in toward the product with a strong three-dimensional sense of depth, parallax and volume, the product feels like it subtly comes forward toward the viewer, the product stays completely intact, solid, sharp and undistorted at all times, it must not break, crack, split, melt or deform, smooth realistic motion, cinematic premium advertising shot" },
  { emo: "🎬", title: "Zoom cine", sub: "Acercamiento dramático", cost: "eco", prompt: "Slow cinematic dolly push-in toward the product, shallow depth of field, elegant premium lighting, the product stays perfectly sharp and undistorted" },
  { emo: "🔄", title: "Giro 360°", sub: "Producto rotando", cost: "eco", prompt: "Slow smooth 360 degree turntable rotation of the product, fixed camera, clean studio lighting, the product stays perfectly sharp and undistorted, cinematic advertising shot" },
  { emo: "✨", title: "Flotando", sub: "Con partículas", cost: "eco", prompt: "The product floats and rotates very gently in the air, soft glowing particles drifting slowly around it, premium dreamy look, the product stays perfectly sharp and undistorted" },
  { emo: "🌟", title: "Revelado", sub: "Sale de la sombra", cost: "eco", prompt: "Dramatic product reveal, warm light gradually illuminates the product emerging from darkness, slow elegant camera motion, the product stays perfectly sharp and undistorted" },
];

const PROMPT_SUFFIX = "Subtle realistic motion, smooth and slow, high quality commercial product video.";
const NEGATIVE_PROMPT = "text, letters, words, captions, watermark, logo overlay, distortion, warping, melting, deformed product, breaking apart, cracking, exploding, falling apart, shattering, blurry, low quality, glitch, extra objects";

const FORMATS = [
  { ratio: "9:16", box: "r916", label: "Reels · TikTok" },
  { ratio: "1:1", box: "r11", label: "Feed · Post" },
  { ratio: "16:9", box: "r169", label: "YouTube · Web" },
];

const CITIES = [
  { title: "Times Square", prompt: "in Times Square New York with iconic giant curved LED billboards and yellow taxis" },
  { title: "Tokyo", prompt: "in Shibuya Tokyo at night with colorful neon signs everywhere" },
  { title: "Dubai", prompt: "in modern Dubai with luxury skyscrapers and golden dusk light" },
  { title: "Genérica", prompt: "in a modern downtown city with tall glass buildings" },
];

const FONTS = [
  { name: "Poppins", css: "'Poppins', sans-serif" },
  { name: "Montserrat", css: "'Montserrat', sans-serif" },
  { name: "Oswald", css: "'Oswald', sans-serif" },
  { name: "Bebas Neue", css: "'Bebas Neue', sans-serif" },
  { name: "Anton", css: "'Anton', sans-serif" },
  { name: "Lora", css: "'Lora', serif" },
  { name: "Playfair Display", css: "'Playfair Display', serif" },
  { name: "Pacifico", css: "'Pacifico', cursive" },
  { name: "Dancing Script", css: "'Dancing Script', cursive" },
  { name: "Lobster", css: "'Lobster', cursive" },
];

const PALETTE = ["#ffffff", "#000000", "#c8ff3d", "#ff5d73", "#ffd23f", "#3fa7ff", "#ff8a3d", "#b06bff", "#7a1f2b"];
const SIZE_PX = { s: 18, m: 28, l: 42 };

let TID = 1;
function newText() {
  return { id: TID++, text: "", font: FONTS[0].css, bold: true, italic: false, underline: false, color: "#ffffff", size: "m", x: 50, y: 80 };
}

export default function Home() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [desc, setDesc] = useState("");
  const [styleIdx, setStyleIdx] = useState(0);
  const [cityIdx, setCityIdx] = useState(0);
  const [ratio, setRatio] = useState("16:9");
  const [dur, setDur] = useState(5);
  const [status, setStatus] = useState("idle");
  const [videoUrl, setVideoUrl] = useState(null);
  const [logLine, setLogLine] = useState("Esto tarda 1-2 minutos");
  const [errMsg, setErrMsg] = useState("");
  const [credits, setCredits] = useState(3);
  const [exporting, setExporting] = useState(false);

  const [openSec, setOpenSec] = useState("prod");
  const [texts, setTexts] = useState([newText()]);
  const [activeId, setActiveId] = useState(texts[0]?.id);

  const stageRef = useRef(null);
  const dragId = useRef(null);

  function toggle(k) { setOpenSec((s) => (s === k ? null : k)); }

  function onFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function updateText(id, patch) {
    setTexts((arr) => arr.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }
  function addText() {
    const t = newText();
    setTexts((arr) => [...arr, t]);
    setActiveId(t.id);
  }
  function removeText(id) {
    setTexts((arr) => arr.filter((t) => t.id !== id));
  }

  function startDrag(id) { dragId.current = id; setActiveId(id); }
  function onMove(e) {
    if (dragId.current == null || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const p = e.touches ? e.touches[0] : e;
    let x = ((p.clientX - rect.left) / rect.width) * 100;
    let y = ((p.clientY - rect.top) / rect.height) * 100;
    x = Math.max(4, Math.min(96, x));
    y = Math.max(4, Math.min(96, y));
    updateText(dragId.current, { x, y });
  }
  function endDrag() { dragId.current = null; }

  async function generate() {
    if (!file) { alert("Primero subí una foto de tu producto 📸"); return; }
    setStatus("loading"); setVideoUrl(null); setErrMsg(""); setLogLine("Subiendo tu imagen...");
    try {
      const imageUrl = await fal.storage.upload(file);
      const isBillboard = styleIdx === 0;
      const parts = [desc.trim(), STYLES[styleIdx].prompt];
      if (isBillboard) parts.push(CITIES[cityIdx].prompt);
      parts.push(PROMPT_SUFFIX);
      const basePrompt = parts.filter(Boolean).join(". ");

      let model, input;
      if (isBillboard) {
        model = "fal-ai/veo3.1/image-to-video";
        input = { image_url: imageUrl, prompt: basePrompt };
        if (ratio === "16:9" || ratio === "9:16") input.aspect_ratio = ratio;
      } else {
        model = "fal-ai/kling-video/v2.1/standard/image-to-video";
        input = { image_url: imageUrl, prompt: basePrompt, negative_prompt: NEGATIVE_PROMPT, duration: dur >= 8 ? "10" : "5" };
      }

      setLogLine("Animando tu producto...");
      const result = await fal.subscribe(model, {
        input, logs: true,
        onQueueUpdate: (u) => {
          if (u.status === "IN_PROGRESS") {
            const logs = u.logs || [];
            const last = logs.length ? logs[logs.length - 1].message : null;
            if (last) setLogLine(last);
          }
        },
      });
      const url = result?.data?.video?.url || result?.data?.video_url;
      if (!url) throw new Error("La respuesta no trajo un video. Probá de nuevo.");
      setVideoUrl(url); setStatus("done"); setCredits((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
      setErrMsg(err?.message || "Algo falló al generar. Revisá tu crédito en fal.ai.");
      setStatus("error");
    }
  }

  const modelLabel = styleIdx === 0 ? "Veo 3.1" : "Kling 2.1";

  function plainDownload() {
    const a = document.createElement("a");
    a.href = videoUrl; a.download = "moveo-video.mp4"; a.target = "_blank";
    document.body.appendChild(a); a.click(); a.remove();
  }

  async function downloadWithText() {
    if (!videoUrl) return;
    const activeTexts = texts.filter((t) => t.text);
    if (activeTexts.length === 0) { plainDownload(); return; }

    setExporting(true);
    try {
      if (typeof MediaRecorder === "undefined") throw new Error("nomr");
      await document.fonts.ready;

      const video = document.createElement("video");
      video.crossOrigin = "anonymous";
      video.muted = true; video.playsInline = true; video.src = videoUrl;

      await new Promise((res, rej) => {
        video.onloadedmetadata = res;
        video.onerror = () => rej(new Error("cors"));
        setTimeout(() => rej(new Error("timeout")), 15000);
      });

      const W = video.videoWidth, H = video.videoHeight;
      const canvas = document.createElement("canvas");
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext("2d");

      const stream = canvas.captureStream(30);
      const rec = new MediaRecorder(stream, { mimeType: "video/webm" });
      const chunks = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      const stopped = new Promise((res) => (rec.onstop = res));

      const sizeFrac = { s: 0.05, m: 0.078, l: 0.11 };
      function drawTexts() {
        activeTexts.forEach((t) => {
          const fpx = sizeFrac[t.size] * H;
          const fam = t.font;
          ctx.font = `${t.italic ? "italic " : ""}${t.bold ? "800" : "400"} ${fpx}px ${fam}`;
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.shadowColor = "rgba(0,0,0,.75)"; ctx.shadowBlur = fpx * 0.35;
          ctx.fillStyle = t.color;
          const px = (t.x / 100) * W, py = (t.y / 100) * H;
          ctx.fillText(t.text, px, py);
          if (t.underline) {
            const w = ctx.measureText(t.text).width;
            ctx.shadowBlur = 0; ctx.strokeStyle = t.color; ctx.lineWidth = fpx * 0.07;
            ctx.beginPath(); ctx.moveTo(px - w / 2, py + fpx * 0.42); ctx.lineTo(px + w / 2, py + fpx * 0.42); ctx.stroke();
          }
          ctx.shadowBlur = 0;
        });
      }

      rec.start();
      await video.play();
      function loop() {
        ctx.drawImage(video, 0, 0, W, H);
        drawTexts();
        if (!video.ended) requestAnimationFrame(loop);
        else rec.stop();
      }
      loop();
      await stopped;

      const blob = new Blob(chunks, { type: "video/webm" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = "moveo-con-texto.webm";
      document.body.appendChild(a); a.click(); a.remove();
    } catch (e) {
      console.error(e);
      alert("No pude grabar el texto dentro del video (suele ser por permisos del servidor de video). Te descargo el video sin texto y podés sumarlo en una app de edición.");
      plainDownload();
    } finally {
      setExporting(false);
    }
  }


  return (
    <div className="wrap">
      <header className="topbar">
        <div className="brand">
          <div className="logo">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M5 4l9 8-9 8V4z" fill="#0a0b0d" />
              <path d="M14 8l6 4-6 4V8z" fill="#0a0b0d" opacity=".55" />
            </svg>
          </div>
          <div className="brand-txt">
            <div className="wordmark">Mov<span>eo</span></div>
            <div className="tag">STUDIO</div>
          </div>
        </div>
        <div className="topbar-actions">
          <div className="credits">⚡ <b>{credits}</b></div>
          <button className="gen gen-top" onClick={generate} disabled={status === "loading"}>
            {status === "loading" ? "Generando..." : "▶ Generar"}
          </button>
        </div>
      </header>

      <div className="layout">
        {/* ===== CONTROLES (acordeón) ===== */}
        <div className="controls">

          {/* 1. PRODUCTO */}
          <div className={"acc" + (openSec === "prod" ? " open" : "")}>
            <div className="acc-head" onClick={() => toggle("prod")}>
              <div className="num">1</div><h2>Tu producto</h2>
              {file && <span className="done">✓</span>}
              <span className="chev">▼</span>
            </div>
            <div className="acc-body">
              <label className={"drop" + (preview ? " has-img" : "")}>
                {preview ? (
                  <><img src={preview} alt="producto" /><div className="change">Cambiar</div></>
                ) : (
                  <div>
                    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <p>Tocá para subir una foto</p>
                    <span>JPG o PNG · fondo limpio funciona mejor</span>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} />
              </label>
              <textarea style={{ marginTop: 12 }} value={desc} onChange={(e) => setDesc(e.target.value)}
                placeholder="Describí tu producto (opcional). Ej: bombón redondo de chocolate oscuro liso y brillante." />
            </div>
          </div>

          {/* 2. ESTILO */}
          <div className={"acc" + (openSec === "estilo" ? " open" : "")}>
            <div className="acc-head" onClick={() => toggle("estilo")}>
              <div className="num">2</div><h2>Estilo de animación</h2>
              <span className="chev">▼</span>
            </div>
            <div className="acc-body">
              <div className="chips">
                {STYLES.map((s, i) => (
                  <div key={i} className={"chip" + (i === styleIdx ? " sel" : "")} onClick={() => setStyleIdx(i)}>
                    <span className="emo">{s.emo}</span>
                    <span className="t">{s.title}<small>{s.sub}</small></span>
                    <span className={"costbadge " + s.cost}>{s.cost === "premium" ? "~$3" : "~$0.28"}</span>
                  </div>
                ))}
              </div>
              {styleIdx === 0 && (
                <>
                  <div className="sub-lbl" style={{ marginTop: 16 }}>Ciudad del cartel</div>
                  <div className="durations" style={{ gridTemplateColumns: "1fr 1fr" }}>
                    {CITIES.map((c, i) => (
                      <div key={i} className={"dur" + (cityIdx === i ? " sel" : "")} onClick={() => setCityIdx(i)}>{c.title}</div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 3. FORMATO */}
          <div className={"acc" + (openSec === "formato" ? " open" : "")}>
            <div className="acc-head" onClick={() => toggle("formato")}>
              <div className="num">3</div><h2>Formato y duración</h2>
              <span className="chev">▼</span>
            </div>
            <div className="acc-body">
              <div className="sub-lbl">Formato</div>
              <div className="formats">
                {FORMATS.map((f) => (
                  <div key={f.ratio} className={"fmt" + (ratio === f.ratio ? " sel" : "")} onClick={() => setRatio(f.ratio)}>
                    <div className={"fmt-box " + f.box} /><span className="fmt-t">{f.ratio}<small>{f.label}</small></span>
                  </div>
                ))}
              </div>
              <div className="sub-lbl" style={{ marginTop: 16 }}>Duración</div>
              <div className="durations">
                <div className={"dur" + (dur === 5 ? " sel" : "")} onClick={() => setDur(5)}>5 segundos<small>más barato</small></div>
                <div className={"dur" + (dur === 8 ? " sel" : "")} onClick={() => setDur(8)}>8 segundos<small>+créditos</small></div>
              </div>
            </div>
          </div>

          {/* 4. TEXTO */}
          <div className={"acc" + (openSec === "texto" ? " open" : "")}>
            <div className="acc-head" onClick={() => toggle("texto")}>
              <div className="num">4</div><h2>Texto en el video</h2>
              <span className="chev">▼</span>
            </div>
            <div className="acc-body">
              {texts.map((t) => (
                <div key={t.id} className={"tblock" + (activeId === t.id ? " active" : "")} onClick={() => setActiveId(t.id)}>
                  <input className="txt" value={t.text} onChange={(e) => updateText(t.id, { text: e.target.value })} placeholder="Escribí tu texto..." />
                  <div className="trow">
                    <select className="tsel" value={t.font} onChange={(e) => updateText(t.id, { font: e.target.value })}>
                      {FONTS.map((f) => <option key={f.name} value={f.css} style={{ fontFamily: f.css }}>{f.name}</option>)}
                    </select>
                    <button className={"tbtn b" + (t.bold ? " on" : "")} onClick={() => updateText(t.id, { bold: !t.bold })}>B</button>
                    <button className={"tbtn i" + (t.italic ? " on" : "")} onClick={() => updateText(t.id, { italic: !t.italic })}>I</button>
                    <button className={"tbtn u" + (t.underline ? " on" : "")} onClick={() => updateText(t.id, { underline: !t.underline })}>U</button>
                  </div>
                  <div className="trow">
                    {PALETTE.map((c) => (
                      <div key={c} className={"tswatch" + (t.color === c ? " sel" : "")} style={{ background: c }} onClick={() => updateText(t.id, { color: c })} />
                    ))}
                    <input type="color" className="color-in" value={t.color} onChange={(e) => updateText(t.id, { color: e.target.value })} title="Color personalizado" />
                  </div>
                  <div className="tsize" style={{ marginTop: 8 }}>
                    {["s", "m", "l"].map((s) => (
                      <div key={s} className={"s" + (t.size === s ? " sel" : "")} onClick={() => updateText(t.id, { size: s })}>
                        {s === "s" ? "Chico" : s === "m" ? "Mediano" : "Grande"}
                      </div>
                    ))}
                  </div>
                  {texts.length > 1 && <button className="tdel" onClick={() => removeText(t.id)}>✕ Eliminar este texto</button>}
                </div>
              ))}
              <button className="taddbtn" onClick={addText}>+ Agregar otro texto</button>
              <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 10, lineHeight: 1.4 }}>
                👉 Arrastrá cada texto sobre el preview para ubicarlo. (Por ahora es guía visual: aún no queda grabado dentro del video.)
              </p>
            </div>
          </div>
        </div>

        {/* ===== PREVIEW ===== */}
        <div className="preview-col">
          <div className="preview-card">
            <div className="stage-wrap" ref={stageRef}
              onMouseMove={onMove} onMouseUp={endDrag} onMouseLeave={endDrag}
              onTouchMove={onMove} onTouchEnd={endDrag}>
              <div className="stage" style={{ aspectRatio: ratio.replace(":", "/") }}>
                {status === "done" && videoUrl ? (
                  <video src={videoUrl} controls autoPlay loop playsInline />
                ) : preview ? (
                  <img src={preview} alt="preview" />
                ) : (
                  <div className="empty">Tu video va a aparecer acá 🎬</div>
                )}
                {status === "loading" && (
                  <><div className="scanner" />
                    <div className="loadbox"><div className="spinner" /><p>Animando tu producto...</p><small>{logLine}</small></div></>
                )}
                {texts.filter((t) => t.text).map((t) => (
                  <div key={t.id} className="vtext"
                    style={{
                      left: t.x + "%", top: t.y + "%", transform: "translate(-50%,-50%)",
                      fontFamily: t.font, fontWeight: t.bold ? 800 : 400,
                      fontStyle: t.italic ? "italic" : "normal",
                      textDecoration: t.underline ? "underline" : "none",
                      color: t.color, fontSize: SIZE_PX[t.size],
                    }}
                    onMouseDown={() => startDrag(t.id)} onTouchStart={() => startDrag(t.id)}>
                    {t.text}
                  </div>
                ))}
              </div>
            </div>

            <div className="costhint">
              {STYLES[styleIdx].cost === "premium"
                ? "💎 Estilo premium (Veo 3.1) · ~$3 por video"
                : "💚 Estilo económico (Kling 2.1) · ~$0.28 por video"}
            </div>
            <button className="gen gen-inline" onClick={generate} disabled={status === "loading"}>
              {status === "loading" ? "Generando..." : "Generar animación ✨"}
            </button>

            {status === "done" && (
              <div className="result-info" style={{ marginTop: 12, borderRadius: 12 }}>
                <div className="meta">Modelo: <b>{modelLabel}</b> · <b>{ratio}</b></div>
                <button className="dl" onClick={downloadWithText} disabled={exporting}>
                  {exporting ? "Grabando texto..." : (texts.some((t) => t.text) ? "Descargar con texto" : "Descargar")}
                </button>
              </div>
            )}
            {status === "error" && <div className="err"><b>Ups.</b> {errMsg}</div>}
          </div>
        </div>
      </div>

      {/* barra inferior fija (celular) */}
      <div className="mobilebar">
        {status === "done" ? (
          <button className="gen" onClick={downloadWithText} disabled={exporting}>
            {exporting ? "Grabando texto..." : (texts.some((t) => t.text) ? "⬇ Descargar con texto" : "⬇ Descargar")}
          </button>
        ) : (
          <button className="gen" onClick={generate} disabled={status === "loading"}>
            {status === "loading" ? "Generando..." : "▶ Generar animación"}
          </button>
        )}
      </div>
    </div>
  );
}
