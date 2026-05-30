// Per-question PDF export. We capture each printable block separately and
// place them onto A4 pages so questions never get split mid-content unless
// the question itself is taller than a single page.
//
// Why per-block instead of one big canvas?
//   * Avoids ugly mid-question page splits.
//   * Lets us add optional spacing between questions on screen without
//     bleeding into the PDF margins.
//
// We use `useCORS: true` so Supabase storage images render. Make sure your
// bucket is public; otherwise the canvas will be tainted and html2canvas
// will throw a SecurityError.

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const MARGIN_MM = 12;

async function captureToImage(node, scale = 2) {
  const canvas = await html2canvas(node, {
    useCORS: true,
    allowTaint: false,
    backgroundColor: '#ffffff',
    scale,
    logging: false,
    imageTimeout: 15000,
  });
  return {
    dataUrl: canvas.toDataURL('image/jpeg', 0.92),
    width: canvas.width,
    height: canvas.height,
  };
}

function mmHeightFor(img, contentWidthMm) {
  return (img.height * contentWidthMm) / img.width;
}

export async function exportPrintableToPDF(rootElement, fileName = 'tugas.pdf') {
  if (!rootElement) throw new Error('exportPrintableToPDF: rootElement is required');

  const headerEl = rootElement.querySelector('[data-pdf-header]');
  const blockEls = Array.from(rootElement.querySelectorAll('[data-pdf-block]'));

  if (blockEls.length === 0) {
    throw new Error('exportPrintableToPDF: no [data-pdf-block] elements found');
  }

  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const contentWidth = A4_WIDTH_MM - MARGIN_MM * 2;
  const usableHeight = A4_HEIGHT_MM - MARGIN_MM * 2;

  let cursorY = MARGIN_MM;

  // Header (rendered on first page; we don't repeat it, kid only needs name
  // fields once).
  if (headerEl) {
    const headerImg = await captureToImage(headerEl, 2);
    const headerHeight = mmHeightFor(headerImg, contentWidth);
    pdf.addImage(
      headerImg.dataUrl,
      'JPEG',
      MARGIN_MM,
      cursorY,
      contentWidth,
      headerHeight,
      undefined,
      'FAST',
    );
    cursorY += headerHeight + 4;
  }

  for (let i = 0; i < blockEls.length; i++) {
    const block = blockEls[i];
    const blockImg = await captureToImage(block, 2);
    const blockHeight = mmHeightFor(blockImg, contentWidth);

    const remaining = A4_HEIGHT_MM - MARGIN_MM - cursorY;

    if (blockHeight <= remaining) {
      // Fits on current page.
      pdf.addImage(
        blockImg.dataUrl,
        'JPEG',
        MARGIN_MM,
        cursorY,
        contentWidth,
        blockHeight,
        undefined,
        'FAST',
      );
      cursorY += blockHeight + 4;
    } else if (blockHeight <= usableHeight) {
      // Doesn't fit on current page but fits on a fresh one — push to next.
      pdf.addPage();
      cursorY = MARGIN_MM;
      pdf.addImage(
        blockImg.dataUrl,
        'JPEG',
        MARGIN_MM,
        cursorY,
        contentWidth,
        blockHeight,
        undefined,
        'FAST',
      );
      cursorY += blockHeight + 4;
    } else {
      // Block is taller than a full page — paginate by image slicing.
      // Always start such a block on a fresh page.
      if (cursorY > MARGIN_MM) {
        pdf.addPage();
        cursorY = MARGIN_MM;
      }
      let renderedHeight = 0;
      let remainingPx = blockImg.height;
      // height in px equivalent to one page of usable area
      const pxPerMm = blockImg.width / contentWidth;
      const pageHeightPx = Math.floor(usableHeight * pxPerMm);
      let firstPiece = true;

      // Build offscreen canvas for slicing
      const sourceCanvas = document.createElement('canvas');
      const sourceCtx = sourceCanvas.getContext('2d');
      const sourceImg = new Image();
      sourceImg.src = blockImg.dataUrl;
      await new Promise((resolve) => {
        sourceImg.onload = resolve;
        sourceImg.onerror = resolve;
      });
      sourceCanvas.width = blockImg.width;
      sourceCanvas.height = blockImg.height;
      sourceCtx.drawImage(sourceImg, 0, 0);

      while (remainingPx > 0) {
        if (!firstPiece) {
          pdf.addPage();
          cursorY = MARGIN_MM;
        }
        const sliceHeight = Math.min(pageHeightPx, remainingPx);
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = blockImg.width;
        sliceCanvas.height = sliceHeight;
        const sliceCtx = sliceCanvas.getContext('2d');
        sliceCtx.drawImage(
          sourceCanvas,
          0,
          renderedHeight,
          blockImg.width,
          sliceHeight,
          0,
          0,
          blockImg.width,
          sliceHeight,
        );
        const sliceDataUrl = sliceCanvas.toDataURL('image/jpeg', 0.92);
        const sliceHeightMm = (sliceHeight * contentWidth) / blockImg.width;
        pdf.addImage(
          sliceDataUrl,
          'JPEG',
          MARGIN_MM,
          cursorY,
          contentWidth,
          sliceHeightMm,
          undefined,
          'FAST',
        );
        cursorY += sliceHeightMm + 4;
        renderedHeight += sliceHeight;
        remainingPx -= sliceHeight;
        firstPiece = false;
      }
    }
  }

  pdf.save(fileName);
}
