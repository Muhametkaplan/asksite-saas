'use client';

import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, QrCode } from 'lucide-react';

interface QRCodeGeneratorProps {
  slug: string;
  partner1: string;
  partner2: string;
}

export default function QRCodeGenerator({ slug, partner1, partner2 }: QRCodeGeneratorProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const targetUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/c/${slug}`
    : `https://asksite.com/c/${slug}`;

  const downloadPNG = () => {
    if (!svgRef.current) return;
    const svgElement = svgRef.current;
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = 1000;
    canvas.height = 1000;

    img.onload = () => {
      if (!ctx) return;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 100, 100, 800, 800);

      // Add branding footer to HD PNG
      ctx.font = 'bold 36px sans-serif';
      ctx.fillStyle = '#ff4d6d';
      ctx.textAlign = 'center';
      ctx.fillText(`${partner1} & ${partner2} ❤️`, 500, 940);

      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `${slug}-HD-QR.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="flex flex-col items-center justify-center rounded-3xl bg-white/80 backdrop-blur-md p-6 border border-white/90 shadow-md text-center">
      <h3 className="flex items-center gap-2 text-base font-bold text-gray-900 mb-2">
        <QrCode className="h-5 w-5 text-rose-500" /> İndirilebilir HD QR Kod
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        Sitenize doğrudan erişim sağlayan yüksek çözünürlüklü dijital QR kodunuz.
      </p>

      <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm mb-4">
        <QRCodeSVG
          ref={svgRef}
          value={targetUrl}
          size={200}
          fgColor="#e11d48"
          bgColor="#ffffff"
          level="H"
          includeMargin={true}
        />
      </div>

      <button
        onClick={downloadPNG}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:scale-105 active:scale-95"
      >
        <Download className="h-4 w-4" /> HD Yüksek Çözünürlüklü QR İndir (PNG)
      </button>
    </div>
  );
}
