import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { QUESTION_TYPE_EMOJI } from '../utils/questionHelpers';
import './AssignmentBuilder.css';

/**
 * Assignment builder. Handles both /assignments/new and /assignments/:id/edit.
 *
 * Layout:
 *   ┌────────────────────────────────────────────────────────────┐
 *   │ Title / description / instructions / school / answer-key   │
 *   ├──────────────────────────┬─────────────────────────────────┤
 *   │ Pool soal (kiri):        │ Soal terpilih (kanan):          │
 *   │  - search input          │  - ordered list                 │
 *   │  - filter by type        │  - up / down / remove           │
 *   │  - chapter accordion     │                                 │
 *   │  - per-chapter "select   │                                 │
 *   │    all" + per-question   │                                 │
 *   │    checkboxes            │                                 │
 *   └──────────────────────────┴─────────────────────────────────┘
 */
function AssignmentBuilder() {
  const { id: assignmentId } = useParams();
  const isEdit = !!assignmentId;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [chapters, setChapters] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Metadata
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState(
    'Bacalah dengan teliti. Kerjakan dengan rapi menggunakan pensil. Selamat mengerjakan!',
  );
  const [schoolName, setSchoolName] = useState('');
  const [showAnswerKey, setShowAnswerKey] = useState(false);

  // Selection
  const [selectedIds, setSelectedIds] = useState([]); // ordered

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('Semua');
  const [openChapters, setOpenChapters] = useState({}); // chapterId -> bool

  const [saving, setSaving] = useState(false);

  // -------- fetch chapters + questions --------
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setErrorMsg('');
        const [{ data: chapterData, error: chErr }, { data: qData, error: qErr }] = await Promise.all([
          supabase.from('chapters').select('*').order('id', { ascending: true }),
          supabase.from('questions').select('*').order('id', { ascending: true }),
        ]);
        if (chErr) throw chErr;
        if (qErr) throw qErr;
        if (cancelled) return;
        setChapters(chapterData || []);
        setQuestions(qData || []);

        // open the first chapter by default for discoverability
        if (chapterData && chapterData.length > 0) {
          setOpenChapters({ [chapterData[0].id]: true });
        }

        if (isEdit) {
          const { data: aData, error: aErr } = await supabase
            .from('assignments')
            .select('*')
            .eq('id', assignmentId)
            .single();
          if (aErr) throw aErr;
          if (aData && !cancelled) {
            setTitle(aData.title || '');
            setDescription(aData.description || '');
            setInstructions(aData.instructions || '');
            setSchoolName(aData.school_name || '');
            setShowAnswerKey(!!aData.show_answer_key);
            setSelectedIds(Array.isArray(aData.question_ids) ? aData.question_ids : []);
          }
        }
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        if (err?.code === '42P01' || err?.message?.includes('relation')) {
          setErrorMsg('Tabel "assignments" belum dibuat. Lihat SETUP_ASSIGNMENTS.md.');
        } else {
          setErrorMsg(`Gagal memuat data: ${err.message}`);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [assignmentId, isEdit]);

  // -------- derived data --------
  const questionsById = useMemo(() => {
    const m = new Map();
    questions.forEach((q) => m.set(q.id, q));
    return m;
  }, [questions]);

  const allTypes = useMemo(() => {
    const s = new Set(questions.map((q) => q.question_type).filter(Boolean));
    return ['Semua', ...Array.from(s)];
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    const term = search.trim().toLowerCase();
    return questions.filter((q) => {
      if (typeFilter !== 'Semua' && q.question_type !== typeFilter) return false;
      if (!term) return true;
      return (q.question_text || '').toLowerCase().includes(term);
    });
  }, [questions, search, typeFilter]);

  const questionsByChapter = useMemo(() => {
    const grouped = new Map();
    chapters.forEach((c) => grouped.set(c.id, { chapter: c, items: [] }));
    filteredQuestions.forEach((q) => {
      if (!grouped.has(q.chapter_id)) {
        grouped.set(q.chapter_id, { chapter: { id: q.chapter_id, title: 'Tanpa Bab' }, items: [] });
      }
      grouped.get(q.chapter_id).items.push(q);
    });
    return Array.from(grouped.values()).filter((g) => g.items.length > 0);
  }, [chapters, filteredQuestions]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const selectedQuestions = useMemo(
    () => selectedIds.map((id) => questionsById.get(id)).filter(Boolean),
    [selectedIds, questionsById],
  );

  // -------- selection handlers --------
  const toggleQuestion = (qId) => {
    setSelectedIds((prev) =>
      prev.includes(qId) ? prev.filter((x) => x !== qId) : [...prev, qId],
    );
  };

  const selectAllInChapter = (chapterId) => {
    const chapterQs = questions
      .filter((q) => q.chapter_id === chapterId)
      .map((q) => q.id);
    setSelectedIds((prev) => {
      const set = new Set(prev);
      chapterQs.forEach((id) => set.add(id));
      // Preserve previous order, append new
      const newOnes = chapterQs.filter((id) => !prev.includes(id));
      return [...prev, ...newOnes];
    });
  };

  const clearChapter = (chapterId) => {
    const chapterQIds = new Set(
      questions.filter((q) => q.chapter_id === chapterId).map((q) => q.id),
    );
    setSelectedIds((prev) => prev.filter((id) => !chapterQIds.has(id)));
  };

  const moveSelected = (qId, direction) => {
    setSelectedIds((prev) => {
      const idx = prev.indexOf(qId);
      if (idx < 0) return prev;
      const target = direction === 'up' ? idx - 1 : idx + 1;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const removeSelected = (qId) => {
    setSelectedIds((prev) => prev.filter((id) => id !== qId));
  };

  const clearAllSelected = () => {
    if (selectedIds.length === 0) return;
    if (window.confirm('Kosongkan semua soal terpilih?')) {
      setSelectedIds([]);
    }
  };

  const toggleChapterOpen = (cid) => {
    setOpenChapters((prev) => ({ ...prev, [cid]: !prev[cid] }));
  };

  // -------- save --------
  async function handleSave({ thenPreview = false } = {}) {
    if (!title.trim()) {
      alert('Judul tugas wajib diisi.');
      return;
    }
    if (selectedIds.length === 0) {
      alert('Pilih minimal 1 soal terlebih dahulu.');
      return;
    }
    try {
      setSaving(true);
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        instructions: instructions.trim() || null,
        school_name: schoolName.trim() || null,
        show_answer_key: showAnswerKey,
        question_ids: selectedIds,
      };

      let savedId = assignmentId;
      if (isEdit) {
        const { error } = await supabase
          .from('assignments')
          .update(payload)
          .eq('id', assignmentId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('assignments')
          .insert([{ ...payload, created_by: user?.id || null }])
          .select()
          .single();
        if (error) throw error;
        savedId = data.id;
      }

      if (thenPreview) {
        navigate(`/assignments/${savedId}/preview`);
      } else {
        navigate('/assignments');
      }
    } catch (err) {
      console.error(err);
      alert(`Gagal menyimpan tugas: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="ab-wrapper">
        <p className="muted">Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="ab-wrapper">
      <header className="ab-header">
        <button className="ab-back" onClick={() => navigate('/assignments')}>← Kembali</button>
        <h2>{isEdit ? 'Edit Tugas' : 'Buat Tugas Baru'}</h2>
      </header>

      {errorMsg && <div className="alert-warning">{errorMsg}</div>}

      {/* ---------- Metadata ---------- */}
      <section className="ab-meta-card">
        <div className="ab-meta-grid">
          <div className="form-group span-2">
            <label>Judul Tugas <span className="req">*</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Latihan Tema 1 — Mengenal Hewan"
              maxLength={120}
            />
          </div>
          <div className="form-group">
            <label>Nama Sekolah / Lembaga</label>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="Opsional. Akan tampil di header PDF."
              maxLength={120}
            />
          </div>
          <div className="form-group">
            <label>Deskripsi Singkat</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Lembar kerja minggu ke-3"
              maxLength={200}
            />
          </div>
          <div className="form-group span-2">
            <label>Petunjuk untuk Siswa</label>
            <textarea
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Contoh: Kerjakan dengan teliti..."
            />
          </div>
          <div className="form-group toggle-row span-2">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={showAnswerKey}
                onChange={(e) => setShowAnswerKey(e.target.checked)}
              />
              <span className="slider" />
            </label>
            <div>
              <strong>Tampilkan Kunci Jawaban</strong>
              <small>
                Aktifkan jika ingin mencetak versi <b>Kunci Jawaban</b> untuk guru. Versi siswa biasanya dimatikan.
              </small>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Picker: pool + selected ---------- */}
      <section className="ab-picker">
        <div className="ab-pool">
          <div className="ab-pool-head">
            <h3>Pool Soal</h3>
            <div className="ab-filters">
              <input
                type="search"
                className="ab-search"
                placeholder="🔍 Cari teks soal..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                className="ab-type-filter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                {allTypes.map((t) => (
                  <option key={t} value={t}>
                    {t === 'Semua' ? 'Semua tipe' : `${QUESTION_TYPE_EMOJI[t] || ''} ${t}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="ab-pool-body">
            {questionsByChapter.length === 0 ? (
              <p className="muted">Tidak ada soal yang cocok dengan filter ini.</p>
            ) : (
              questionsByChapter.map(({ chapter, items }) => {
                const isOpen = !!openChapters[chapter.id];
                const totalInChapter = questions.filter((q) => q.chapter_id === chapter.id).length;
                const selectedInChapter = items.filter((q) => selectedSet.has(q.id)).length;
                return (
                  <div key={chapter.id} className="ab-chapter">
                    <div className="ab-chapter-head">
                      <button
                        type="button"
                        className="ab-chapter-toggle"
                        onClick={() => toggleChapterOpen(chapter.id)}
                      >
                        <span className={`chev ${isOpen ? 'open' : ''}`}>▶</span>
                        <strong>{chapter.title}</strong>
                        <span className="ab-chapter-meta">
                          {items.length} dari {totalInChapter} soal
                          {selectedInChapter > 0 && (
                            <span className="ab-chip"> {selectedInChapter} dipilih</span>
                          )}
                        </span>
                      </button>
                      <div className="ab-chapter-actions">
                        <button type="button" onClick={() => selectAllInChapter(chapter.id)}>
                          + Semua
                        </button>
                        <button type="button" onClick={() => clearChapter(chapter.id)}>
                          − Kosongkan
                        </button>
                      </div>
                    </div>
                    {isOpen && (
                      <ul className="ab-q-list">
                        {items.map((q, idx) => {
                          const isSelected = selectedSet.has(q.id);
                          return (
                            <li
                              key={q.id}
                              className={`ab-q-item ${isSelected ? 'selected' : ''}`}
                              onClick={() => toggleQuestion(q.id)}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleQuestion(q.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="ab-q-info">
                                <div className="ab-q-row">
                                  <span className="ab-q-idx">{idx + 1}.</span>
                                  <span className="ab-q-type">
                                    {QUESTION_TYPE_EMOJI[q.question_type] || '❓'} {q.question_type}
                                  </span>
                                </div>
                                <div className="ab-q-text">{q.question_text || '(tanpa teks)'}</div>
                              </div>
                              {q.content && (
                                <img
                                  src={q.content}
                                  alt=""
                                  className="ab-q-thumb"
                                  loading="lazy"
                                />
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="ab-selected">
          <div className="ab-selected-head">
            <h3>Soal Terpilih <span className="ab-count">{selectedIds.length}</span></h3>
            {selectedIds.length > 0 && (
              <button className="link-danger" onClick={clearAllSelected}>Kosongkan</button>
            )}
          </div>
          <div className="ab-selected-body">
            {selectedQuestions.length === 0 ? (
              <div className="ab-empty-selected">
                <span>👈 Pilih soal dari panel kiri untuk menyusun lembar tugas.</span>
              </div>
            ) : (
              <ol className="ab-selected-list">
                {selectedQuestions.map((q, idx) => (
                  <li key={q.id} className="ab-selected-item">
                    <span className="ab-sel-idx">{idx + 1}</span>
                    <div className="ab-sel-info">
                      <div className="ab-sel-type">
                        {QUESTION_TYPE_EMOJI[q.question_type] || '❓'} {q.question_type}
                      </div>
                      <div className="ab-sel-text">{q.question_text || '(tanpa teks)'}</div>
                    </div>
                    <div className="ab-sel-actions">
                      <button
                        type="button"
                        title="Naik"
                        disabled={idx === 0}
                        onClick={() => moveSelected(q.id, 'up')}
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        title="Turun"
                        disabled={idx === selectedQuestions.length - 1}
                        onClick={() => moveSelected(q.id, 'down')}
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        title="Hapus dari tugas"
                        className="remove"
                        onClick={() => removeSelected(q.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </section>

      <footer className="ab-footer">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => navigate('/assignments')}
          disabled={saving}
        >
          Batal
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={() => handleSave({ thenPreview: false })}
          disabled={saving}
        >
          {saving ? 'Menyimpan...' : '💾 Simpan'}
        </button>
        <button
          type="button"
          className="btn-primary solid"
          onClick={() => handleSave({ thenPreview: true })}
          disabled={saving}
        >
          {saving ? 'Menyimpan...' : '👁️ Simpan & Preview'}
        </button>
      </footer>
    </div>
  );
}

export default AssignmentBuilder;
