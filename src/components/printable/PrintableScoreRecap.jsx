import React from 'react';
import { formatDateID } from '../../utils/scoreGenerator';
import './PrintableScoreRecap.css';

/**
 * PrintableScoreRecap
 * Komponen yang muncul saat tombol Print PDF diklik.
 * Dioptimalkan untuk tampilan cetak A4.
 * Data dibagi per Aspek (Ekoliterasi & Food Literacy) dan per Jenis Tes (Pretest & Posttest).
 */
function PrintableScoreRecap({ scores, filterType, filterAspect, filterSchool }) {
  const printDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  function aspectLabel(aspect) {
    if (aspect === 'ekoliterasi') return 'Ekoliterasi';
    if (aspect === 'food_literacy') return 'Food Literacy';
    return aspect || '-';
  }

  function avg(data) {
    if (data.length === 0) return '0';
    return (data.reduce((a, b) => a + Number(b.score), 0) / data.length).toFixed(1);
  }

  // Kelompokkan data berdasarkan aspek dan jenis tes
  const ekolPre  = scores.filter((s) => s.aspect === 'ekoliterasi'   && s.test_type === 'pretest');
  const ekolPost = scores.filter((s) => s.aspect === 'ekoliterasi'   && s.test_type === 'posttest');
  const foodPre  = scores.filter((s) => s.aspect === 'food_literacy' && s.test_type === 'pretest');
  const foodPost = scores.filter((s) => s.aspect === 'food_literacy' && s.test_type === 'posttest');

  // Tentukan apa yang ditampilkan berdasarkan filter
  const showEkol = filterAspect === 'semua' || filterAspect === 'ekoliterasi';
  const showFood = filterAspect === 'semua' || filterAspect === 'food_literacy';
  const showPre  = filterType   === 'semua' || filterType   === 'pretest';
  const showPost = filterType   === 'semua' || filterType   === 'posttest';

  // Judul aspek untuk header
  const aspectTitle = filterAspect === 'semua'
    ? 'Ekoliterasi & Food Literacy'
    : aspectLabel(filterAspect);

  // ─── Render satu tabel ────────────────────────────────────────────────────
  function renderTable(data, testLabel, aspectName, colorClass) {
    if (data.length === 0) return null;
    return (
      <div className="psr-section">
        <div className={`psr-section-header ${colorClass}`}>
          <span>📋 {testLabel.toUpperCase()} — {aspectName.toUpperCase()}</span>
          <span>Tanggal: {formatDateID(data[0]?.test_date)}</span>
        </div>
        <table className="psr-table">
          <thead>
            <tr>
              <th className="psr-th-num">No.</th>
              <th>Nama Siswa</th>
              <th>Asal Sekolah</th>
              <th className="psr-th-score">Nilai</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr key={item.id} className={idx % 2 === 0 ? 'even' : 'odd'}>
                <td className="psr-td-num">{idx + 1}</td>
                <td>{item.student_name}</td>
                <td>{item.school_name}</td>
                <td className="psr-td-score">{item.score}</td>
              </tr>
            ))}
            <tr className="psr-tr-avg">
              <td colSpan={3} style={{ textAlign: 'right', fontWeight: 700 }}>
                Rata-rata:
              </td>
              <td className="psr-td-score">{avg(data)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  // ─── Render ringkasan per aspek ───────────────────────────────────────────
  function renderSummaryAspect(label, preData, postData) {
    return (
      <div className="psr-summary-box" style={{ flex: 1 }}>
        <span className="psr-summary-label">{label.toUpperCase()}</span>
        {showPre && (
          <span className="psr-summary-avg">Pretest avg: {avg(preData)}</span>
        )}
        {showPost && (
          <span className="psr-summary-avg">Posttest avg: {avg(postData)}</span>
        )}
        <span className="psr-summary-count">
          {preData.length + postData.length} data
        </span>
      </div>
    );
  }

  return (
    <div className="psr-wrapper">
      {/* Header */}
      <div className="psr-header">
        <div className="psr-logo">
          <img src="/LogoFull-SiKecilPintar.png" alt="SiKecilPintar" className="psr-logo-image" />
          <div>
            <h1 className="psr-title">SiKecilPintar</h1>
            <p className="psr-subtitle">Laporan Rekap Nilai Siswa</p>
          </div>
        </div>
        <div className="psr-meta">
          <div className="psr-meta-row">
            <span>Dicetak pada</span>
            <span>{printDate}</span>
          </div>
          {filterSchool !== 'semua' && (
            <div className="psr-meta-row">
              <span>Sekolah</span>
              <span>{filterSchool}</span>
            </div>
          )}
          <div className="psr-meta-row">
            <span>Aspek</span>
            <span>{aspectTitle}</span>
          </div>
          <div className="psr-meta-row">
            <span>Total Data</span>
            <span>{scores.length} data</span>
          </div>
        </div>
      </div>

      {/* Ringkasan */}
      <div className="psr-summary">
        {showEkol && renderSummaryAspect('Ekoliterasi', ekolPre, ekolPost)}
        {showFood && renderSummaryAspect('Food Literacy', foodPre, foodPost)}
      </div>

      {/* ─── BAGIAN EKOLITERASI ──────────────────────────────────────────── */}
      {showEkol && (
        <>
          {showPre  && renderTable(ekolPre,  'Pretest',  'Ekoliterasi', 'pretest')}
          {showPost && renderTable(ekolPost, 'Posttest', 'Ekoliterasi', 'posttest')}
        </>
      )}

      {/* Page break antara Ekoliterasi dan Food Literacy */}
      {showEkol && showFood && <div className="psr-page-break" />}

      {/* ─── BAGIAN FOOD LITERACY ────────────────────────────────────────── */}
      {showFood && (
        <>
          {showPre  && renderTable(foodPre,  'Pretest',  'Food Literacy', 'pretest')}
          {showPost && renderTable(foodPost, 'Posttest', 'Food Literacy', 'posttest')}
        </>
      )}

      <div className="psr-footer">
        Dokumen ini digenerate oleh SiKecilPintar — {printDate}
      </div>
    </div>
  );
}

export default PrintableScoreRecap;
