"use client";

import { useState, useRef } from "react";
import { fal } from "@fal-ai/client";

// Todas las llamadas a fal pasan por nuestro proxy seguro (/api/fal/proxy),
// así la FAL_KEY nunca queda expuesta en el navegador.
fal.config({ proxyUrl: "/api/fal/proxy" });

const STYLES = [
  { emo: "💥", title: "Sale en 3D", sub: "Rompe la pantalla", prompt: "The product dramatically breaks out of its frame and pushes forward toward the viewer in a striking 3D out-of-bounds effect, parts of the product extend beyond the rectangular frame edges, strong sense of depth and perspective, the product itself stays perfectly sharp and undistorted, cinematic advertising shot" },
  { emo: "🔄", title: "Giro 360°", sub: "Producto rotando", prompt: "Slow smooth 360 degree turntable rotation of the product, fixed camera, clean studio lighting, the product stays perfectly sharp and undistorted, cinematic advertising shot" },
  { emo: "🎬", title: "Zoom cine", sub: "Acercamiento dramático", prompt: "Slow cinematic dolly push-in toward the product, shallow depth of field, elegant premium lighting, the product stays perfectly sharp and undistorted" },
  { emo: "✨", title: "Flotando", sub: "Con partículas", prompt: "The product floats and rotates very gently in the air, soft glowing particles drifting slowly around it, premium dreamy look, the product stays perfectly sharp and undistorted" },
  { emo: "🌟", title: "Revelado", sub: "Sale de la sombra", prompt: "Dramatic product reveal, warm light gradually illuminates the product emerging from darkness, slow elegant camera motion, the product stays perfectly sharp and undistorted" },
];

const PROMPT_SUFFIX = "Subtle realistic motion, smooth and slow, high quality commercial product video.";
const NEGATIVE_PROMPT = "text, letters, words, captions, watermark, logo overlay, distortion, warping, melting, deformed product, blurry, low quality, glitch, extra objects";

const FORMATS = [
  { ratio: "9:16", box: "r916", label: "Reels · TikTok" },
  { ratio: "1:1", box: "r11", label: "Feed · Post" },
  { ratio: "16:9", box: "r169", label: "YouTube · Web" },
];

const TEXT_COLORS = ["#ffffff", "#0a0b0d", "#c8ff3d", "#ff5d73"];

export default function Home() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [desc, setDesc] = useState("");
  const [styleIdx, setStyleIdx] = useState(0);
  const [ratio, setRatio] = useState("9:16");
  const [dur, setDur] = useState(5);
  const [audioOn, setAudioOn] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [videoUrl, setVideoUrl] = useState(null);
  const [logLine, setLogLine] = useState("Esto tarda ~1-2 minutos");
  const [errMsg, setErrMsg] = useState("");
  const [credits, setCredits] = useState(3);

  // Texto sobre el video
  const [overlayText, setOverlayText] = useState("");
  const [textPos, setTextPos] = useState({ x: 50, y: 80 }); // en %
  const [textSize, setTextSize] = useState("m"); // s | m | l
  const [textColor, setTextColor] = useState("#ffffff");

  const stageRef = useRef(null);
  const dragging = useRef(false);

  function onFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  // ---- arrastrar el texto dentro del preview ----
  function startDrag(e) {
    dragging.current = true;
    e.currentTarget.classList.add("dragging");
  }
  function onMove(e) {
    if (!dragging.current || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    let x = ((point.clientX - rect.left) / rect.width) * 100;
    let y = ((point.clientY - rect.top) / rect.height) * 100;
    x = Math.max(5, Math.min(95, x));
    y = Math.max(5, Math.min(95, y));
    setTextPos({ x, y });
  }
  function endDrag() {
    dragging.current = false;
    document.querySelectorAll(".vtext").forEach((el) => el.classList.remove("dragging"));
  }

  async function generate() {
    if (!file) {
      alert("Primero subí una foto de tu producto 📸");
      return;
    }
    setStatus("loading");
    setVideoUrl(null);
    setErrMsg("");
    setLogLine("Subiendo tu imagen...");

    try {
      const imageUrl = await fal.storage.upload(file);
      const basePrompt = [desc.trim(), STYLES[styleIdx].prompt, PROMPT_SUFFIX].filter(Boolean).join(". ");
      const useAudio = audioOn;

      let model, input;
      if (useAudio) {
        model = "fal-ai/veo3/image-to-video";
        input = {
          image_url: imageUrl,
          prompt: basePrompt,
          aspect_ratio: ratio === "1:1" ? "auto" : ratio,
          duration: String(dur) + "s",
        };
      } else {
        model = "fal-ai/kling-video/v2.1/standard/image-to-video";
        input = {
          image_url: imageUrl,
          prompt: basePrompt,
          negative_prompt: NEGATIVE_PROMPT,
          duration: dur >= 8 ? "10" : "5",
        };
      }

      setLogLine("Animando tu producto...");
      const result = await fal.subscribe(model, {
        input,
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            const logs = update.logs || [];
            const last = logs.length ? logs[logs.length - 1].message : null;
            if (last) setLogLine(last);
          }
        },
      });

      const url = result?.data?.video?.url || result?.data?.video_url;
      if (!url) throw new Error("La respuesta no trajo un video. Revisá el modelo o el formato.");
      setVideoUrl(url);
      setStatus("done");
      setCredits((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
      setErrMsg(err?.message || "Algo falló al generar. Revisá tu FAL_KEY y el crédito en fal.ai.");
      setStatus("error");
    }
  }

  const modelLabel = audioOn ? "Veo 3.1" : "Kling 2.1";

  return (
    <div className="wrap">
      <header>
        <div className="brand">
          <div className="logo">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M5 4l9 8-9 8V4z" fill="#0a0b0d" />
              <path d="M14 8l6 4-6 4V8z" fill="#0a0b0d" opacity=".55" />
            </svg>
          </div>
          <div className="wordmark">Mov<span>eo</span></div>
        </div>
        <div className="credits">⚡ <b>{credits}</b> créditos</div>
      </header>

      <div className="hero">
        <h1>Tu producto, <em>en movimiento.</em></h1>
        <p>Subí una foto, elegí el estilo y generá un video publicitario con IA.</p>
      </div>

      <div className="layout">
        {/* ====== COLUMNA IZQUIERDA: controles ====== */}
        <div className="controls">
          {/* STEP 1 */}
          <div className="step">
            <div className="step-head"><div className="num">1</div><h2>Subí tu producto</h2></div>
            <label className={"drop" + (preview ? " has-img" : "")}>
              {preview ? (
                <>
                  <img src={preview} alt="producto" />
                  <div className="change">Cambiar</div>
                </>
              ) : (
                <div>
                  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <p>Tocá para subir una foto</p>
                  <span>JPG o PNG · fondo limpio funciona mejor</span>
                </div>
              )}
              <input type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} />
            </label>
          </div>

          {/* STEP 2 */}
          <div className="step">
            <div className="step-head"><div className="num">2</div><h2>Describí tu producto <small>&nbsp;(opcional)</small></h2></div>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Ej: Bombones artesanales rellenos de frambuesa, sobre fondo oscuro elegante."
            />
          </div>

          {/* STEP 3 */}
          <div className="step">
            <div className="step-head"><div className="num">3</div><h2>Estilo de animación</h2></div>
            <div className="chips">
              {STYLES.map((s, i) => (
                <div key={i} className={"chip" + (i === styleIdx ? " sel" : "")} onClick={() => setStyleIdx(i)}>
                  <span className="emo">{s.emo}</span>
                  <span className="t">{s.title}<small>{s.sub}</small></span>
                </div>
              ))}
            </div>
          </div>

          {/* STEP 4 */}
          <div className="step">
            <div className="step-head"><div className="num">4</div><h2>Formato y duración</h2></div>
            <div className="sub-lbl">Formato</div>
            <div className="formats">
              {FORMATS.map((f) => (
                <div key={f.ratio} className={"fmt" + (ratio === f.ratio ? " sel" : "")} onClick={() => setRatio(f.ratio)}>
                  <div className={"fmt-box " + f.box} />
                  <span className="fmt-t">{f.ratio}<small>{f.label}</small></span>
                </div>
              ))}
            </div>
            <div className="sub-lbl" style={{ marginTop: 16 }}>Duración</div>
            <div className="durations">
              <div className={"dur" + (dur === 5 ? " sel" : "")} onClick={() => setDur(5)}>5 segundos<small>más barato</small></div>
              <div className={"dur" + (dur === 8 ? " sel" : "")} onClick={() => setDur(8)}>8 segundos<small>+créditos</small></div>
            </div>
          </div>

          {/* STEP 5: TEXTO SOBRE EL VIDEO */}
          <div className="step">
            <div className="step-head"><div className="num">5</div><h2>Texto en el video <small>&nbsp;(opcional)</small></h2></div>
            <input
              className="txt"
              value={overlayText}
              onChange={(e) => setOverlayText(e.target.value)}
              placeholder="Ej: 50% OFF · Envío gratis"
            />
            {overlayText && (
              <>
                <div className="opt-row">
                  <div className={"mini" + (textSize === "s" ? " sel" : "")} onClick={() => setTextSize("s")}>Chico</div>
                  <div className={"mini" + (textSize === "m" ? " sel" : "")} onClick={() => setTextSize("m")}>Mediano</div>
                  <div className={"mini" + (textSize === "l" ? " sel" : "")} onClick={() => setTextSize("l")}>Grande</div>
                </div>
                <div className="opt-row" style={{ alignItems: "center" }}>
                  <span style={{ fontSize: 12.5, color: "var(--muted)", fontWeight: 600 }}>Color:</span>
                  {TEXT_COLORS.map((c) => (
                    <div key={c} className={"swatch" + (textColor === c ? " sel" : "")} style={{ background: c }} onClick={() => setTextColor(c)} />
                  ))}
                </div>
                <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 10 }}>👉 Arrastrá el texto sobre el video para ubicarlo donde quieras.</p>
              </>
            )}
          </div>

          {/* STEP 6: AUDIO */}
          <div className="step">
            <div className="step-head"><div className="num">6</div><h2>Audio</h2></div>
            <div className="audio-row">
              <div className="lbl">Generar con audio<small>Música y ambiente (usa Veo 3.1 · +créditos)</small></div>
              <div className={"toggle" + (audioOn ? " on" : "")} onClick={() => setAudioOn((v) => !v)} />
            </div>
          </div>
        </div>

        {/* ====== COLUMNA DERECHA: preview siempre visible ====== */}
        <div className="preview-col">
          <div className="preview-card">
            <div
              className="stage-wrap"
              ref={stageRef}
              onMouseMove={onMove}
              onMouseUp={endDrag}
              onMouseLeave={endDrag}
              onTouchMove={onMove}
              onTouchEnd={endDrag}
            >
              <div className="stage" style={{ aspectRatio: ratio.replace(":", "/") }}>
                {status === "done" && videoUrl ? (
                  <video src={videoUrl} controls autoPlay loop muted={!audioOn} playsInline />
                ) : preview ? (
                  <img src={preview} alt="preview" />
                ) : (
                  <div className="empty">Tu video va a aparecer acá 🎬</div>
                )}

                {status === "loading" && (
                  <>
                    <div className="scanner" />
                    <div className="loadbox">
                      <div className="spinner" />
                      <p>Animando tu producto...</p>
                      <small>{logLine}</small>
                    </div>
                  </>
                )}

                {/* texto arrastrable */}
                {overlayText && (
                  <div
                    className={"vtext t-" + textSize}
                    style={{ left: textPos.x + "%", top: textPos.y + "%", color: textColor }}
                    onMouseDown={startDrag}
                    onTouchStart={startDrag}
                  >
                    {overlayText}
                  </div>
                )}
              </div>
            </div>

            <button className="gen" onClick={generate} disabled={status === "loading"}>
              {status === "loading" ? "Generando..." : "Generar animación ✨"}
            </button>

            {status === "done" && (
              <div className="result-info" style={{ marginTop: 12, borderRadius: 12 }}>
                <div className="meta">Modelo: <b>{modelLabel}</b> · <b>{ratio} · {dur}s</b></div>
                <a className="dl" href={videoUrl} target="_blank" rel="noreferrer" download>Descargar</a>
              </div>
            )}
            {status === "error" && (
              <div className="err"><b>Ups.</b> {errMsg}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
