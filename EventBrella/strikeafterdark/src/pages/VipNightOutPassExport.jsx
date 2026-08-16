import { useCallback, useEffect, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import VipNightOutPassCard from '../components/VipNightOutPassCard';
import '../styles/vip-night-out-pass.css';

const CARD_PX = 1000;
const PDF_INCHES = 8;
/** Capture multiplier for sharper PNG / PDF print fidelity (2000×2000 → embedded at 8×8") */
const EXPORT_PIXEL_RATIO = 2;

async function waitForFonts() {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
}

function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export default function VipNightOutPassExport() {
  const previewCardRef = useRef(null);
  const exportCardRef = useRef(null);
  const stageRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [busy, setBusy] = useState(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;

    function updateScale() {
      const w = stage.clientWidth;
      setScale(w > 0 ? w / CARD_PX : 1);
    }

    updateScale();
    const ro = new ResizeObserver(updateScale);
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);

  const capturePngDataUrl = useCallback(async () => {
    // Capture from the unscaled off-screen card for exact 1000×1000 fidelity
    const node = exportCardRef.current;
    if (!node) throw new Error('Card not ready');
    await waitForFonts();
    return toPng(node, {
      width: CARD_PX,
      height: CARD_PX,
      pixelRatio: EXPORT_PIXEL_RATIO,
      cacheBust: true,
      backgroundColor: '#050403',
    });
  }, []);

  async function onDownloadPng() {
    setBusy('png');
    setStatus('Generating PNG…');
    try {
      const dataUrl = await capturePngDataUrl();
      downloadDataUrl(dataUrl, 'strike-after-dark-vip-night-out-pass.png');
      setStatus('PNG downloaded.');
    } catch (err) {
      console.error(err);
      setStatus(err.message || 'PNG export failed.');
    } finally {
      setBusy(null);
    }
  }

  async function onDownloadPdf() {
    setBusy('pdf');
    setStatus('Generating PDF…');
    try {
      const dataUrl = await capturePngDataUrl();
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'in',
        format: [PDF_INCHES, PDF_INCHES],
        compress: true,
      });
      pdf.addImage(dataUrl, 'PNG', 0, 0, PDF_INCHES, PDF_INCHES, undefined, 'FAST');
      pdf.save('strike-after-dark-vip-night-out-pass.pdf');
      setStatus('PDF downloaded.');
    } catch (err) {
      console.error(err);
      setStatus(err.message || 'PDF export failed.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="vip-pass-page">
      <header className="vip-pass-page-header">
        <h1>VIP Night Out Pass</h1>
        <p>Marketing asset · 1000×1000px · 8×8&quot; print · PNG &amp; PDF export</p>
      </header>

      <div className="vip-pass-actions">
        <button
          type="button"
          className="vip-pass-btn"
          onClick={onDownloadPng}
          disabled={!!busy}
        >
          {busy === 'png' ? 'Preparing PNG…' : 'Download PNG'}
        </button>
        <button
          type="button"
          className="vip-pass-btn"
          onClick={onDownloadPdf}
          disabled={!!busy}
        >
          {busy === 'pdf' ? 'Preparing PDF…' : 'Download PDF'}
        </button>
        <a className="vip-pass-btn vip-pass-btn--ghost" href="/">
          Back to site
        </a>
      </div>

      <div className="vip-pass-status" role="status" aria-live="polite">
        {status}
      </div>

      <div className="vip-pass-stage" ref={stageRef}>
        <div
          className="vip-pass-stage-inner"
          style={{ transform: `scale(${scale})` }}
        >
          <VipNightOutPassCard ref={previewCardRef} />
        </div>
      </div>

      {/* Unscaled capture target — off-screen, not affected by preview scale */}
      <div className="vip-pass-export-host" aria-hidden="true">
        <VipNightOutPassCard ref={exportCardRef} />
      </div>
    </div>
  );
}
