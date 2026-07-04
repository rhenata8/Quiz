import React from 'react';
import { formatDateID } from '../../utils/scoreGenerator';
import './PrintableScoreRecap.css';

/**
 * PrintableScoreRecap
 * Komponen yang muncul saat tombol Print PDF diklik.
 * Dioptimalkan untuk tampilan cetak A4.
 */
function PrintableScoreRecap({ scores, filterType, filterSchool }) {
  const printDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Pisahkan pretest dan posttest
  const pretestData = scores.filter((s) => s.test_type === 'pretest');
  const posttestData = scores.filter((s) => s.test_type === 'posttest');

  const showBoth = filterType === 'semua';
  const showPretest = filterType === 'pretest' || showBoth;
  const showPosttest = filterType === 'posttest' || showBoth;

  // Rata-rata nilai
  function avg(data) {
    if (data.length === 0) return 0;
    return (data.reduce((a, b) => a + b.score, 0) / data.length).toFixed(1);
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
            <span>Total Data</span>
            <span>{scores.length} siswa</span>
          </div>
        </div>
      </div>

      {/* Ringkasan */}
      {showBoth && (
        <div className="psr-summary">
          <div className="psr-summary-box pretest">
            <span className="psr-summary-label">PRETEST</span>
            <span className="psr-summary-count">{pretestData.length} siswa</span>
            <span className="psr-summary-avg">Rata-rata: {avg(pretestData)}</span>
            {pretestData[0] && (
              <span className="psr-summary-date">
                {formatDateID(pretestData[0].test_date)}
              </span>
            )}
          </div>
          <div className="psr-summary-box posttest">
            <span className="psr-summary-label">POSTTEST</span>
            <span className="psr-summary-count">{posttestData.length} siswa</span>
            <span className="psr-summary-avg">Rata-rata: {avg(posttestData)}</span>
            {posttestData[0] && (
              <span className="psr-summary-date">
                {formatDateID(posttestData[0].test_date)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Tabel Pretest */}
      {showPretest && pretestData.length > 0 && (
        <div className="psr-section">
          <div className="psr-section-header pretest">
            <span>📋 DATA PRETEST</span>
            <span>Tanggal: {formatDateID(pretestData[0]?.test_date)}</span>
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
              {pretestData.map((item, idx) => (
                <tr key={item.id} className={idx % 2 === 0 ? 'even' : 'odd'}>
                  <td className="psr-td-num">{idx + 1}</td>
                  <td>{item.student_name}</td>
                  <td>{item.school_name}</td>
                  <td className="psr-td-score">{item.score}</td>
                </tr>
              ))}
              <tr className="psr-tr-avg">
                <td colSpan={3} style={{ textAlign: 'right', fontWeight: 700 }}>
                  Rata-rata Nilai Pretest:
                </td>
                <td className="psr-td-score">{avg(pretestData)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Page break jika dua tabel */}
      {showBoth && pretestData.length > 0 && posttestData.length > 0 && (
        <div className="psr-page-break" />
      )}

      {/* Tabel Posttest */}
      {showPosttest && posttestData.length > 0 && (
        <div className="psr-section">
          <div className="psr-section-header posttest">
            <span>📋 DATA POSTTEST</span>
            <span>Tanggal: {formatDateID(posttestData[0]?.test_date)}</span>
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
              {posttestData.map((item, idx) => (
                <tr key={item.id} className={idx % 2 === 0 ? 'even' : 'odd'}>
                  <td className="psr-td-num">{idx + 1}</td>
                  <td>{item.student_name}</td>
                  <td>{item.school_name}</td>
                  <td className="psr-td-score">{item.score}</td>
                </tr>
              ))}
              <tr className="psr-tr-avg">
                <td colSpan={3} style={{ textAlign: 'right', fontWeight: 700 }}>
                  Rata-rata Nilai Posttest:
                </td>
                <td className="psr-td-score">{avg(posttestData)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="psr-footer">
        Dokumen ini digenerate oleh SiKecilPintar — {printDate}
      </div>
    </div>
  );
}

export default PrintableScoreRecap;
