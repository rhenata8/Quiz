import React from 'react';
import './PrintableHeader.css';

/**
 * Header that appears at the top of the first page of the exported PDF.
 * Includes logo, title, optional school name & instructions, and the
 * Nama / Kelas / Tanggal fill-in fields.
 */
function PrintableHeader({
  title,
  description,
  instructions,
  schoolName,
  showAnswerKey,
}) {
  return (
    <div className="ph-root" data-pdf-header>
      <div className="ph-top">
        <img
          src="/LogoFull-SiKecilPintar.png"
          alt="SiKecilPintar"
          className="ph-logo"
          crossOrigin="anonymous"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        <div className="ph-title-block">
          {schoolName && <div className="ph-school">{schoolName}</div>}
          <h1 className="ph-title">{title || 'Lembar Tugas'}</h1>
          {description && <div className="ph-desc">{description}</div>}
          {showAnswerKey && (
            <div className="ph-key-badge">KUNCI JAWABAN</div>
          )}
        </div>
      </div>

      <div className="ph-fields">
        <div className="ph-field">
          <span className="ph-field-label">Nama</span>
          <span className="ph-field-line" />
        </div>
        <div className="ph-field">
          <span className="ph-field-label">Sekolah / Kelas</span>
          <span className="ph-field-line" />
        </div>
        <div className="ph-field">
          <span className="ph-field-label">Tanggal</span>
          <span className="ph-field-line" />
        </div>
      </div>

      {instructions && (
        <div className="ph-instructions">
          <strong>Petunjuk Pengerjaan:</strong>
          <p>{instructions}</p>
        </div>
      )}
    </div>
  );
}

export default PrintableHeader;
