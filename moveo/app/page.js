"use client";

import { useState } from "react";
import { fal } from "@fal-ai/client";

// Todas las llamadas a fal pasan por nuestro proxy seguro (/api/fal/proxy),
// así la FAL_KEY nunca queda expuesta en el navegador.
fal.config({ proxyUrl: "/api/fal/proxy" });

const STYLES = [
  { emo: "🔄", title: "Giro 360°", sub: "Producto rotando", prompt: "Giro 360° lento del producto, cámara fija, iluminación de estudio" },
  { emo: "🎬", title: "Zoom cine", sub: "Acercamiento dramático", prompt: "Zoom cinemático lento acercándose al producto, profundidad de campo" },
  { emo: "✨", title: "Flotando", sub: "Con partículas", prompt: "Producto flotando suavemente con partículas brillantes alrededor" },
  { emo: "🌟", title: "Revelado", sub: "Sale de la sombra", prompt: "Revelado dramático del producto desde la oscuridad con luz que entra" },
];

const FORMATS = [
  { ratio: "9:16", box: "r916", label: "Reels · TikTok" },
  { ratio: "1:1", box: "r11", label: "Feed · Post" },
  { ratio: "16:9", box: "r169", label: "YouTube · Web" },
];

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
  const [logLine, setLogLine] = useState("Esto tarda ~30-60 segundos");
  const [errMsg, setErrMsg] = useState("");
  const [credits, setCredits] = useState(3);

  function onFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
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
      // 1) Subimos la imagen a fal storage para obtener una URL
      const imageUrl = await fal.storage.upload(file);

      // 2) Armamos el prompt y elegimos modelo según el toggle de audio
      const prompt = [desc.trim(), STYLES[styleIdx].prompt].filter(Boolean).join(". ");
      const useAudio = audioOn;
      const model = useAudio ? "fal-ai/veo3/image-to-video" : "fal-ai/ltx-video/image-to-video";

      // Input base que aceptan ambos modelos
      const input = { image_url: imageUrl, prompt };

      // Veo soporta formato y duración; LTX genera clips cortos sin estos params
      if (useAudio) {
        input.aspect_ratio = ratio === "1:1" ? "auto" : ratio; // veo: 16:9 | 9:16 | auto
        input.duration = String(dur) + "s";
      }

      setLogLine("Animando tu producto...");

      // 3) Generamos (fal maneja la cola y el polling automáticamente)
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

      // 4) Sacamos la URL del video del resultado
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

  const model = audioOn ? "Veo 3.1" : "LTX Video";

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
        <h1>Tu producto,<br /><em>en movimiento.</em></h1>
        <p>Subí una foto, contanos de qué se trata, y la IA genera un video publicitario listo para tus redes.</p>
      </div>

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
          placeholder="Ej: Perfume artesanal con aroma a cítricos, frasco de vidrio dorado. Quiero un anuncio elegante y premium."
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

      {/* STEP 5 */}
      <div className="step">
        <div className="step-head"><div className="num">5</div><h2>Audio</h2></div>
        <div className="audio-row">
          <div className="lbl">Generar con audio<small>Música y ambiente (usa Veo 3.1 · +créditos)</small></div>
          <div className={"toggle" + (audioOn ? " on" : "")} onClick={() => setAudioOn((v) => !v)} />
        </div>
      </div>

      <button className="gen" onClick={generate} disabled={status === "loading"}>
        {status === "loading" ? "Generando..." : "Generar animación ✨"}
      </button>

      {/* RESULT */}
      {status !== "idle" && status !== "error" && (
        <div className="result">
          <div className="stage" style={{ aspectRatio: ratio.replace(":", "/") }}>
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
            {status === "done" && videoUrl && (
              <video src={videoUrl} controls autoPlay loop muted={!audioOn} playsInline />
            )}
          </div>
          {status === "done" && (
            <div className="result-info">
              <div className="meta">
                Modelo: <b>{model}</b> · <b>{audioOn ? "con audio" : "sin audio"} · {ratio} · {dur}s</b>
              </div>
              <a className="dl" href={videoUrl} target="_blank" rel="noreferrer" download>Descargar</a>
            </div>
          )}
        </div>
      )}

      {status === "error" && (
        <div className="err"><b>Ups.</b> {errMsg}</div>
      )}
    </div>
  );
}
