'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import type { ProcessedImage, PbnPaintState } from '@/lib/pbn-types';

interface PbnPaintCanvasProps {
  processedImage: ProcessedImage;
  paintState: PbnPaintState;
  onRegionClick: (regionId: number) => void;
  showNumbers?: boolean;
}

const ZOOM_MIN = 0.4;
const ZOOM_MAX = 6;

export default function PbnPaintCanvas({
  processedImage,
  paintState,
  onRegionClick,
  showNumbers = true,
}: PbnPaintCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const lastTouchDist = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // ---- Render ----
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height, regions, palette, outlineData, regionMap } = processedImage;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f8f6f2';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Build colored pixel data
    const imageData = ctx.createImageData(width, height);
    for (let i = 0; i < width * height; i++) {
      const regionId = regionMap[i];
      const idx4 = i * 4;

      if (regionId === 0) {
        imageData.data[idx4] = 248;
        imageData.data[idx4 + 1] = 246;
        imageData.data[idx4 + 2] = 242;
        imageData.data[idx4 + 3] = 255;
        continue;
      }

      const coloredId = paintState.coloredRegions.get(regionId);
      if (coloredId !== undefined) {
        const pal = palette.find((p) => p.id === coloredId);
        if (pal) {
          imageData.data[idx4] = pal.color.r;
          imageData.data[idx4 + 1] = pal.color.g;
          imageData.data[idx4 + 2] = pal.color.b;
          imageData.data[idx4 + 3] = 255;
        }
      } else {
        imageData.data[idx4] = 235;
        imageData.data[idx4 + 1] = 233;
        imageData.data[idx4 + 2] = 229;
        imageData.data[idx4 + 3] = 255;
      }
    }

    // Merge colored pixels + outline
    const finalData = new ImageData(width, height);
    for (let i = 0; i < width * height; i++) {
      const idx4 = i * 4;
      if (outlineData.data[idx4] < 100) {
        // Dark outline pixel
        finalData.data[idx4] = 40;
        finalData.data[idx4 + 1] = 38;
        finalData.data[idx4 + 2] = 35;
        finalData.data[idx4 + 3] = 255;
      } else {
        finalData.data[idx4] = imageData.data[idx4];
        finalData.data[idx4 + 1] = imageData.data[idx4 + 1];
        finalData.data[idx4 + 2] = imageData.data[idx4 + 2];
        finalData.data[idx4 + 3] = imageData.data[idx4 + 3];
      }
    }

    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const offCtx = offscreen.getContext('2d')!;
    offCtx.putImageData(finalData, 0, 0);

    // Scale to display canvas with pan/zoom
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);
    ctx.drawImage(offscreen, 0, 0);

    // Draw numbers on uncolored regions
    if (showNumbers) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (const region of regions) {
        if (paintState.coloredRegions.has(region.id)) continue;

        const fontSize = Math.max(6, Math.min(13, Math.sqrt(region.area) * 0.15));
        ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;

        const x = region.centerX;
        const y = region.centerY;

        // White halo behind number
        ctx.fillStyle = 'rgba(255,255,255,0.88)';
        ctx.fillRect(x - fontSize, y - fontSize * 0.65, fontSize * 2, fontSize * 1.3);

        ctx.fillStyle = '#2d2926';
        ctx.fillText(String(region.colorId), x, y);
      }
    }

    ctx.restore();
  }, [processedImage, paintState, zoom, pan, showNumbers]);

  // Resize canvas and render on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      render();
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => ro.disconnect();
  }, [render]);

  // Re-render on state changes using rAF
  useEffect(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [render]);

  // Coordinate conversion: client → image coords
  const canvasCoords = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      return {
        x: (clientX - rect.left - pan.x) / zoom,
        y: (clientY - rect.top - pan.y) / zoom,
      };
    },
    [pan, zoom]
  );

  const getRegionAt = useCallback(
    (x: number, y: number): number | null => {
      const px = Math.floor(x);
      const py = Math.floor(y);
      if (px < 0 || py < 0 || px >= processedImage.width || py >= processedImage.height) return null;
      const idx = py * processedImage.width + px;
      const regionId = processedImage.regionMap[idx];
      return regionId > 0 ? regionId : null;
    },
    [processedImage]
  );

  // Click → paint region
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const { x, y } = canvasCoords(e.clientX, e.clientY);
      const regionId = getRegionAt(x, y);
      if (regionId !== null) onRegionClick(regionId);
    },
    [canvasCoords, getRegionAt, onRegionClick]
  );

  // Pan with middle button / right click / left button hold
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.button === 2) {
      isPanning.current = true;
      lastPos.current = { x: e.clientX, y: e.clientY };
      e.preventDefault();
    } else if (e.button === 0) {
      // Left click — handled by handleClick
    }
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
    lastPos.current = { x: e.clientX, y: e.clientY };
  };
  const handleMouseUp = () => {
    isPanning.current = false;
  };

  // Wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((z) => Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z * factor)));
  }, []);

  // Touch
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist.current = Math.sqrt(dx * dx + dy * dy);
    } else if (e.touches.length === 1) {
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 2 && lastTouchDist.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const factor = dist / lastTouchDist.current;
      setZoom((z) => Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z * factor)));
      lastTouchDist.current = dist;
    } else if (e.touches.length === 1) {
      const dx = e.touches[0].clientX - lastPos.current.x;
      const dy = e.touches[0].clientY - lastPos.current.y;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
        lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (e.changedTouches.length === 1 && e.touches.length === 0) {
        const touch = e.changedTouches[0];
        const startX = lastPos.current.x;
        const startY = lastPos.current.y;
        const moved = Math.sqrt((touch.clientX - startX) ** 2 + (touch.clientY - startY) ** 2);
        if (moved < 10) {
          const { x, y } = canvasCoords(touch.clientX, touch.clientY);
          const regionId = getRegionAt(x, y);
          if (regionId !== null) onRegionClick(regionId);
        }
      }
      lastTouchDist.current = null;
    },
    [canvasCoords, getRegionAt, onRegionClick]
  );

  const zoomIn = () => setZoom((z) => Math.min(ZOOM_MAX, z * 1.3));
  const zoomOut = () => setZoom((z) => Math.max(ZOOM_MIN, z * 0.77));
  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-2xl bg-[#f8f6f2]"
      style={{ minHeight: 340, maxHeight: '70vh', height: '50vw' }}
    >
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onContextMenu={(e) => e.preventDefault()}
        className="block w-full h-full"
        style={{ cursor: 'crosshair', touchAction: 'none' }}
      />

      {/* Zoom Controls */}
      <div className="absolute bottom-3 right-3 flex flex-col gap-1 z-10">
        {[
          { label: '+', action: zoomIn, title: 'Yakınlaştır' },
          { label: '↺', action: resetView, title: 'Sıfırla' },
          { label: '−', action: zoomOut, title: 'Uzaklaştır' },
        ].map((btn) => (
          <button
            key={btn.label}
            onClick={btn.action}
            title={btn.title}
            className="w-9 h-9 rounded-xl bg-white/90 backdrop-blur shadow-md border border-gray-200 text-gray-700 font-black text-sm hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-90"
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}
