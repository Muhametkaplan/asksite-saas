 "use client";

import { useEffect, useRef, useState } from "react";
import { drawColorPreview, drawPBN, makePaintByNumbers, PBNResult } from "../lib/pbn";

type Sample = { name: string; src: string };

const samples: Sample[] = [
  {
    name: "Güneşli Manzara",
    src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700">
        <rect width="1000" height="700" fill="#9bd7ff"/>
        <circle cx="790" cy="130" r="75" fill="#ffd447"/>
        <polygon points="0,500 240,260 430,500" fill="#6da35b"/>
        <polygon points="300,500 610,180 930,500" fill="#477d4c"/>
        <polygon points="650,500 820,320 1000,500" fill="#75a85b"/>
        <rect y="500" width="1000" height="200" fill="#62b9df"/>
        <path d="M0 580 Q250 520 500 585 T1000 570 V700 H0Z" fill="#4a9fc6"/>
        <circle cx="190" cy="130" r="48" fill="#fff"/>
        <circle cx="240" cy="135" r="55" fill="#fff"/>
        <circle cx="290" cy="135" r="42" fill="#fff"/>
      </svg>`)}`
  },
  {
    name: "Kelebek",
    src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="900" height="700">
        <rect width="900" height="700" fill="#d9f1cf"/>
        <circle cx="450" cy="350" r="42" fill="#3f352d"/>
        <ellipse cx="350" cy="270" rx="170" ry="125" fill="#ef6a9c"/>
        <ellipse cx="550" cy="270" rx="170" ry="125" fill="#ef6a9c"/>
        <ellipse cx="355" cy="455" rx="130" ry="95" fill="#7e68d5"/>
        <ellipse cx="545" cy="455" rx="130" ry="95" fill="#7e68d5"/>
        <path d="M425 330 Q370 210 300 180" fill="none" stroke="#3f352d" stroke-width="10"/>
        <path d="M475 330 Q530 210 600 180" fill="none" stroke="#3f352d" stroke-width="10"/>
        <circle cx="300" cy="180" r="12" fill="#3f352d"/><circle cx="600" cy="180" r="12" fill="#3f352d"/>
      </svg>`)}`
  },
  {
    name: "Kedi",
    src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="900" height="700">
        <rect width="900" height="700" fill="#f6e6ce"/>
        <circle cx="450" cy="390" r="220" fill="#f29b54"/>
        <polygon points="275,250 315,70 420,210" fill="#f29b54"/>
        <polygon points="480,210 585,70 625,250" fill="#f29b54"/>
        <polygon points="315,155 330,105 370,190" fill="#e78373"/>
        <polygon points="530,190 570,105 585,155" fill="#e78373"/>
        <circle cx="370" cy="360" r="28" fill="#222"/>
        <circle cx="530" cy="360" r="28" fill="#222"/>
        <polygon points="450,410 425,440 475,440" fill="#9d4b5d"/>
        <path d="M450 440 Q425 485 390 480 M450 440 Q475 485 510 480" fill="none" stroke="#222" stroke-width="8"/>
        <path d="M260 405 L400 420 M250 450 L395 445 M640 405 L500 420 M650 450 L505 445" stroke="#555" stroke-width="6"/>
      </svg>`)}`
  }
];

export default function PaintByNumbers() {
  const [result, setResult] = useState<PBNResult | null>(null);
  const [sourceName, setSourceName] = useState("Güneşli Manzara");
  const [colors, setColors] = useState(12);
  const [showNumbers, setShowNumbers] = useState(true);
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState<"numbers" | "preview">("numbers");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const sourceCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    loadImage(samples[0].src, "Güneşli Manzara");
  }, []);

  useEffect(() => {
    if (result && canvasRef.current) drawPBN(canvasRef.current, result, showNumbers);
    if (result && previewRef.current) drawColorPreview(previewRef.current, result);
  }, [result, showNumbers]);

  async function loadImage(src: string, name: string) {
    setBusy(true);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = src;
      });

      const maxSide = 620;
      const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.max(120, Math.round(img.naturalWidth * scale));
      const h = Math.max(120, Math.round(img.naturalHeight * scale));

      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      const ctx = c.getContext("2d", { willReadFrequently: true })!;
      ctx.drawImage(img, 0, 0, w, h);
      sourceCanvasRef.current = c;

      const data = ctx.getImageData(0, 0, w, h).data;
      const pbn = makePaintByNumbers(data, w, h, colors);
      setResult(pbn);
      setSourceName(name);
    } finally {
      setBusy(false);
    }
  }

  function processUploaded(file: File) {
    const url = URL.createObjectURL(file);
    loadImage(url, file.name).finally(() => URL.revokeObjectURL(url));
  }

  function regenerate() {
    const c = sourceCanvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d", { willReadFrequently: true })!;
    setBusy(true);
    requestAnimationFrame(() => {
      const data = ctx.getImageData(0, 0, c.width, c.height).data;
      setResult(makePaintByNumbers(data, c.width, c.height, colors));
      setBusy(false);
    });
  }

  function downloadCanvas() {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `sayilarla-boyama-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  }

  return (
    <main className="page">
      <header className="topbar">
        <div className="brand">
          <div className="logo">#</div>
          <div>
            <strong>Sayılarla Boyama</strong>
            <span>Fotoğrafını şablona dönüştür</span>
          </div>
        </div>
        <a className="github" href="https://nextjs.org/" target="_blank" rel="noreferrer">Next.js + React</a>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">KENDİ FOTOĞRAFINI YÜKLE</p>
          <h1>Fotoğrafını <em>sayılarla boyama</em> eserine dönüştür.</h1>
          <p className="lead">
            Hazır çizimlerden birini seç veya telefonundan kendi fotoğrafını yükle.
            Uygulama renkleri analiz edip numaralı bölgeler ve renk paleti oluşturur.
          </p>
        </div>
        <label className="upload">
          <input
            type="file"
            accept="image/*"
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) processUploaded(f);
            }}
          />
          <span className="uploadIcon">↑</span>
          <strong>Fotoğraf Yükle</strong>
          <small>JPG, PNG, WEBP • cihazında işlenir</small>
        </label>
      </section>

      <section className="workspace">
        <aside className="sidebar">
          <div className="panel">
            <h3>Hazır Çizimler</h3>
            <div className="samples">
              {samples.map(s => (
                <button
                  key={s.name}
                  className={sourceName === s.name ? "sample active" : "sample"}
                  onClick={() => loadImage(s.src, s.name)}
                >
                  <img src={s.src} alt={s.name} />
                  <span>{s.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="panel settings">
            <h3>Ayarlar</h3>
            <label>Renk sayısı <b>{colors}</b></label>
            <input
              type="range"
              min="6"
              max="20"
              value={colors}
              onChange={e => setColors(Number(e.target.value))}
            />
            <div className="rangeLabels"><span>Kolay</span><span>Detaylı</span></div>

            <button className="primary" onClick={regenerate} disabled={busy}>
              {busy ? "İşleniyor..." : "Şablonu Yenile"}
            </button>
          </div>
        </aside>

        <section className="board">
          <div className="boardHead">
            <div>
              <span className="badge">AKTİF</span>
              <strong>{sourceName}</strong>
            </div>
            <div className="actions">
              <button onClick={() => setShowNumbers(v => !v)}>
                {showNumbers ? "Numaraları Gizle" : "Numaraları Göster"}
              </button>
              <button onClick={downloadCanvas}>PNG İndir</button>
            </div>
          </div>

          <div className="tabs">
            <button className={activeTab === "numbers" ? "selected" : ""} onClick={() => setActiveTab("numbers")}>
              Sayılarla Boya
            </button>
            <button className={activeTab === "preview" ? "selected" : ""} onClick={() => setActiveTab("preview")}>
              Renkli Önizleme
            </button>
          </div>

          <div className="canvasWrap">
            {busy && <div className="loading">Fotoğraf analiz ediliyor…</div>}
            <canvas ref={canvasRef} className={activeTab === "numbers" ? "canvas visible" : "canvas"} />
            <canvas ref={previewRef} className={activeTab === "preview" ? "canvas visible" : "canvas"} />
          </div>

          <div className="palette">
            <div className="paletteTitle">RENK PALETİ</div>
            <div className="swatches">
              {result?.palette.map((p, i) => (
                <div className="swatch" key={p.id} title={p.hex}>
                  <span style={{ background: p.hex }} />
                  <b>{i + 1}</b>
                </div>
              ))}
            </div>
          </div>
        </section>
      </section>

      <footer>
        <span>🔒 Görseller sunucuya gönderilmez — tarayıcı içinde işlenir.</span>
        <span>© 2026 Sayılarla Boyama</span>
      </footer>
    </main>
  );
}