import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import PrintableHeader from '../components/printable/PrintableHeader';
import PrintableQuestion from '../components/printable/PrintableQuestion';
import { exportPrintableToPDF } from '../utils/pdfExport';
import './AssignmentPreview.css';

/**
 * Loads an assignment by id, fetches its questions, and renders a paper-style
 * preview. Two export buttons:
 *   - "Unduh PDF" (jspdf + html2canvas)
 *   - "Cetak"    (window.print() via the @media print stylesheet)
 *
 * The "Tampilkan kunci jawaban" toggle is local to the preview, initialised
 * from what's stored on the assignment, so the teacher can flip between
 * worksheet and answer-key versions without re-saving.
 */
function AssignmentPreview() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [exporting, setExporting] = useState(false);

  const printableRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setErrorMsg('');
        const { data: a, error: aErr } = await supabase
          .from('assignments')
          .select('*')
          .eq('id', id)
          .single();
        if (aErr) throw aErr;
        if (cancelled) return;
        setAssignment(a);
        setShowAnswerKey(!!a.show_answer_key);

        const ids = Array.isArray(a.question_ids) ? a.question_ids : [];
        if (ids.length === 0) {
          setQuestions([]);
          return;
        }
        const { data: qData, error: qErr } = await supabase
          .from('questions')
          .select('*')
          .in('id', ids);
        if (qErr) throw qErr;
        if (cancelled) return;

        // Re-order according to the saved id list.
        const map = new Map((qData || []).map((q) => [q.id, q]));
        const ordered = ids.map((qid) => map.get(qid)).filter(Boolean);
        setQuestions(ordered);
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        if (err?.code === '42P01' || err?.message?.includes('relation')) {
          setErrorMsg('Tabel "assignments" belum dibuat. Lihat SETUP_ASSIGNMENTS.md.');
        } else {
          setErrorMsg(`Gagal memuat tugas: ${err.message}`);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  const fileBaseName = useMemo(() => {
    const safe = (assignment?.title || 'tugas')
      .replace(/[^a-zA-Z0-9-_ ]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase();
    return showAnswerKey ? `${safe}-kunci-jawaban` : safe;
  }, [assignment?.title, showAnswerKey]);

  async function handleDownloadPDF() {
    if (!printableRef.current) return;
    try {
      setExporting(true);
      // Wait one tick so any newly-rendered DOM is committed before capture.
      await new Promise((r) => setTimeout(r, 50));
      await exportPrintableToPDF(printableRef.current, `${fileBaseName}.pdf`);
    } catch (err) {
      console.error(err);
      alert(
        `Gagal mengekspor PDF: ${err.message}\n\n` +
        'Tip: pastikan bucket gambar di Supabase bersifat public dan tidak ada gambar yang gagal dimuat.',
      );
    } finally {
      setExporting(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <div className="ap-wrapper">
        <p className="muted">Memuat tugas...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="ap-wrapper">
        <div className="alert-warning">{errorMsg}</div>
        <button className="btn-secondary" onClick={() => navigate('/assignments')}>
          ← Kembali ke daftar tugas
        </button>
      </div>
    );
  }

  if (!assignment) return null;

  return (
    <div className="ap-wrapper">
      {/* ---------- Action bar (hidden on print & PDF capture) ---------- */}
      <header className="ap-actions no-print">
        <div className="ap-actions-left">
          <button className="btn-secondary" onClick={() => navigate('/assignments')}>
            ← Kembali
          </button>
          <button className="btn-secondary" onClick={() => navigate(`/assignments/${id}/edit`)}>
            ✏️ Edit Tugas
          </button>
        </div>
        <div className="ap-actions-right">
          <label className="ap-toggle">
            <input
              type="checkbox"
              checked={showAnswerKey}
              onChange={(e) => setShowAnswerKey(e.target.checked)}
            />
            <span>Tampilkan Kunci Jawaban</span>
          </label>
          <button className="btn-primary" onClick={handlePrint} disabled={exporting}>
            🖨️ Cetak
          </button>
          <button className="btn-primary solid" onClick={handleDownloadPDF} disabled={exporting}>
            {exporting ? '⏳ Membuat PDF...' : '⬇️ Unduh PDF'}
          </button>
        </div>
      </header>

      <div className="ap-meta no-print">
        <h2>{assignment.title}</h2>
        <p>
          {questions.length} soal terpilih.{' '}
          {questions.length === 0 && (
            <span className="muted">
              (belum ada soal — kembali ke editor untuk memilih.)
            </span>
          )}
        </p>
      </div>

      {/* ---------- Printable area ---------- */}
      <div className="ap-paper-container">
        <div className="ap-paper" ref={printableRef}>
          <PrintableHeader
            title={assignment.title}
            description={assignment.description}
            instructions={assignment.instructions}
            schoolName={assignment.school_name}
            showAnswerKey={showAnswerKey}
          />

          {questions.length === 0 ? (
            <div className="ap-no-questions">
              Belum ada soal yang dipilih untuk tugas ini.
            </div>
          ) : (
            questions.map((q, i) => (
              <PrintableQuestion
                key={q.id}
                question={q}
                number={i + 1}
                showAnswerKey={showAnswerKey}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default AssignmentPreview;
