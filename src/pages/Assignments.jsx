import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Assignments.css';

/**
 * List page for saved assignments. Each row links to the preview (re-export)
 * and the builder (edit). Delete is destructive — no soft delete.
 */
function Assignments() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    fetchAssignments();
  }, []);

  async function fetchAssignments() {
    try {
      setLoading(true);
      setErrorMsg('');
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setAssignments(data || []);
    } catch (err) {
      console.error(err);
      // Common case: table not yet created. Surface a helpful message.
      if (err?.message?.includes('relation') || err?.code === '42P01') {
        setErrorMsg(
          'Tabel "assignments" belum dibuat di Supabase. Lihat SETUP_ASSIGNMENTS.md untuk SQL-nya.',
        );
      } else {
        setErrorMsg(`Gagal memuat tugas: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    try {
      const { error } = await supabase.from('assignments').delete().eq('id', id);
      if (error) throw error;
      setAssignments((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      alert(`Gagal menghapus tugas: ${err.message}`);
    } finally {
      setConfirmDeleteId(null);
    }
  }

  return (
    <div className="assignments-wrapper">
      <header className="assignments-header">
        <div>
          <h2>Tugas (Lembar Kerja PDF)</h2>
          <p>Kumpulkan soal dari berbagai bab menjadi satu lembar kerja yang bisa diunduh sebagai PDF.</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/assignments/new')}>
          ✨ Buat Tugas Baru
        </button>
      </header>

      {errorMsg && <div className="alert-warning">{errorMsg}</div>}

      <section className="assignments-list">
        {loading ? (
          <p className="muted">Memuat tugas...</p>
        ) : assignments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-emoji">📝</div>
            <h3>Belum ada tugas tersimpan</h3>
            <p>Klik <b>Buat Tugas Baru</b> untuk memilih soal dan menyusun lembar kerja.</p>
          </div>
        ) : (
          <div className="assignments-grid">
            {assignments.map((a) => {
              const count = Array.isArray(a.question_ids) ? a.question_ids.length : 0;
              return (
                <article key={a.id} className="assignment-card">
                  <div className="card-top">
                    <h3 className="card-title">{a.title}</h3>
                    <span className="card-count">{count} soal</span>
                  </div>
                  {a.description && <p className="card-desc">{a.description}</p>}
                  <div className="card-meta">
                    <span>Dibuat: {new Date(a.created_at).toLocaleDateString('id-ID')}</span>
                    {a.updated_at && a.updated_at !== a.created_at && (
                      <span>Diubah: {new Date(a.updated_at).toLocaleDateString('id-ID')}</span>
                    )}
                  </div>
                  <div className="card-actions">
                    <Link to={`/assignments/${a.id}/preview`} className="btn-preview">
                      👁️ Preview & PDF
                    </Link>
                    <Link to={`/assignments/${a.id}/edit`} className="btn-edit">
                      ✏️ Edit
                    </Link>
                    <button
                      className="btn-danger"
                      onClick={() => setConfirmDeleteId(a.id)}
                      title="Hapus tugas"
                    >
                      🗑️
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {confirmDeleteId && (
        <div className="modal-overlay" onClick={() => setConfirmDeleteId(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">⚠️</div>
            <h3>Hapus tugas ini?</h3>
            <p>Tindakan ini tidak bisa dibatalkan. Soal yang tersimpan tidak akan ikut terhapus.</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setConfirmDeleteId(null)}>
                Batal
              </button>
              <button className="btn-danger-solid" onClick={() => handleDelete(confirmDeleteId)}>
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Assignments;
