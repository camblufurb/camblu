import { useEffect, useRef, useState } from 'react';
import { Icon } from '../Icon';

interface ImageCropper1x1Props {
  onCropped: (dataUrl: string) => void;
}

export function ImageCropper1x1({ onCropped }: ImageCropper1x1Props) {
  const [imgSrc, setImgSrc] = useState<string>('');
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImgSrc(reader.result);
        setZoom(1);
        setOffsetX(0);
        setOffsetY(0);
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!imgSrc) return;
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      drawCrop();
    };
    img.src = imgSrc;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgSrc]);

  const drawCrop = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 400;
    canvas.width = size;
    canvas.height = size;
    ctx.clearRect(0, 0, size, size);

    const baseScale = Math.max(size / img.naturalWidth, size / img.naturalHeight);
    const drawW = img.naturalWidth * baseScale * zoom;
    const drawH = img.naturalHeight * baseScale * zoom;
    const x = (size - drawW) / 2 + offsetX;
    const y = (size - drawH) / 2 + offsetY;
    ctx.drawImage(img, x, y, drawW, drawH);
  };

  useEffect(() => {
    drawCrop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, offsetX, offsetY]);

  const applyCrop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onCropped(canvas.toDataURL('image/webp', 0.9));
  };

  return (
    <div className="m3-card m3-card--tonal" style={{ display: 'grid', gap: '0.75rem', padding: '1rem' }}>
      <label className="m3-label-large" htmlFor="crop-upload">
        Foto do Integrante (Cortador 1:1 integrado)
      </label>
      <input
        id="crop-upload"
        type="file"
        accept="image/*"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {imgSrc && (
        <div style={{ display: 'grid', gap: '0.65rem', justifyItems: 'start' }}>
          <canvas
            ref={canvasRef}
            style={{
              inlineSize: '200px',
              blockSize: '200px',
              borderRadius: 'var(--md-sys-shape-corner-lg)',
              border: '2px solid var(--md-sys-color-primary)',
            }}
          />

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', inlineSize: '100%' }}>
            <label style={{ flex: '1 1 8rem', fontSize: '0.82rem' }}>
              Zoom ({zoom.toFixed(2)}x)
              <input
                type="range"
                min={1}
                max={2.6}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                style={{ inlineSize: '100%' }}
              />
            </label>
            <label style={{ flex: '1 1 8rem', fontSize: '0.82rem' }}>
              Posição X
              <input
                type="range"
                min={-150}
                max={150}
                value={offsetX}
                onChange={(e) => setOffsetX(Number(e.target.value))}
                style={{ inlineSize: '100%' }}
              />
            </label>
            <label style={{ flex: '1 1 8rem', fontSize: '0.82rem' }}>
              Posição Y
              <input
                type="range"
                min={-150}
                max={150}
                value={offsetY}
                onChange={(e) => setOffsetY(Number(e.target.value))}
                style={{ inlineSize: '100%' }}
              />
            </label>
          </div>

          <button type="button" className="m3-btn m3-btn--filled" onClick={applyCrop}>
            <Icon name="crop" size={18} />
            <span>Usar Foto Recortada (1:1)</span>
          </button>
        </div>
      )}
    </div>
  );
}
