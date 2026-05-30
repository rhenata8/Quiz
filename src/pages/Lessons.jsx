import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Lessons.css';

function Lessons() {
  const navigate = useNavigate();
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Semua');
 
  // State untuk form tambah/edit bab
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChapterId, setEditingChapterId] = useState(null);
  const [newChapter, setNewChapter] = useState({ title: '', description: '', Category: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State KHUSUS untuk Custom Pop-up Delete
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [chapterToDelete, setChapterToDelete] = useState(null);

  useEffect(() => {
    fetchChapters();
  }, []);

  async function fetchChapters() {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('chapters').select('*').order('id', { ascending: true });
      if (error) throw error;
      setChapters(data || []);
    } catch (error) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  const dynamicTabs = ['Semua', ...new Set(chapters.map(c => c.Category || 'Umum'))];
  const filteredChapters = activeTab === 'Semua'
    ? chapters
    : chapters.filter(c => (c.Category || 'Umum') === activeTab);

  // --- HANDLER MODAL TAMBAH & EDIT ---
  const openModalForAdd = () => {
    setEditingChapterId(null);
    setNewChapter({ title: '', description: '', Category: '' });
    setIsModalOpen(true);
  };

  const openModalForEdit = (chapter) => {
    setEditingChapterId(chapter.id);
    setNewChapter({ title: chapter.title, description: chapter.description, Category: chapter.Category || 'Umum' });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingChapterId(null);
    setNewChapter({ title: '', description: '', Category: '' });
  };

  // --- HANDLER SIMPAN (CREATE & UPDATE) ---
  const handleSaveChapter = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        title: newChapter.title,
        description: newChapter.description,
        Category: newChapter.Category || 'Umum'
      };

      if (editingChapterId) {
        const { error } = await supabase.from('chapters').update(payload).eq('id', editingChapterId);
        if (error) throw error;
        setChapters(chapters.map(c => c.id === editingChapterId ? { ...c, ...payload } : c));
        closeModal();
      } else {
        const { data, error } = await supabase.from('chapters').insert([payload]).select();
        if (error) throw error;
        closeModal();
        if (data && data.length > 0) navigate(`/chapter/${data[0].id}`);
      }
    } catch (error) {
      console.error("Gagal menyimpan bab:", error.message);
      alert("Gagal menyimpan bab. Pastikan koneksi aman.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- HANDLER CUSTOM POP-UP DELETE ---
  const confirmDelete = (id) => {
    setChapterToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setChapterToDelete(null);
  };

  const executeDelete = async () => {
    if (!chapterToDelete) return;
    try {
      const { error } = await supabase.from('chapters').delete().eq('id', chapterToDelete);
      if (error) throw error;
      setChapters(chapters.filter(c => c.id !== chapterToDelete));
    } catch (error) {
      console.error("Gagal menghapus bab:", error.message);
      alert("Gagal menghapus bab.");
    } finally {
      setIsDeleteModalOpen(false);
      setChapterToDelete(null);
    }
  };

  return (
    <div className="lessons-wrapper">
      <header className="lessons-header">
        <div className="header-top">
          <div>
            <h2>Pustaka Pelajaran</h2>
            <p>Jelajahi kategori dan temukan materi pembelajaran yang menyenangkan.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link
              to="/assignments"
              className="btn-add-lesson"
              style={{ background: 'white', color: '#356D7A', border: '2px solid #356D7A', textDecoration: 'none' }}
            >
              <span className="icon-plus">📝</span> Buat Tugas PDF
            </Link>
            <button className="btn-add-lesson" onClick={openModalForAdd}>
              <span className="icon-plus">✨</span> Tambah Bab Baru
            </button>
          </div>
        </div>
      </header>

      {/* Tabs Kategori Dinamis */}
      <div className="filter-scroll">
        <div className="filter-tabs">
          {dynamicTabs.map(tab => (
            <button key={tab} className={`filter-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Pelajaran */}
      <section className="lessons-content">
        <div className="lessons-grid">
          {loading ? (
            <p className="loading-text">Memuat pelajaran...</p>
          ) : filteredChapters.length > 0 ? (
            filteredChapters.map((chapter) => (
              <div className="lesson-card" key={chapter.id}>
               
                {/* TOMBOL AKSI POJOK KANAN ATAS */}
                <div className="card-top-actions">
                  <button className="btn-card-edit" onClick={() => openModalForEdit(chapter)} title="Edit Bab">✏️</button>
                  <button className="btn-card-delete" onClick={() => confirmDelete(chapter.id)} title="Hapus Bab">🗑️</button>
                </div>

                <div className="lesson-icon bg-light-blue">
                  {chapter.icon || '📚'}
                </div>
                <h4>{chapter.title}</h4>
                <p className="lesson-meta">{chapter.description || 'Tidak ada deskripsi'}</p>
                
                {/* BAGIAN TOMBOL BAWAH */}
                <div className="lesson-actions-container">
                  <div className="lesson-actions-top">
                    <span className="category-badge">{chapter.Category || 'Umum'}</span>
                    <Link to={`/chapter/${chapter.id}`} className="btn-edit-lesson">Kelola Soal</Link>
                  </div>
                  {/* TOMBOL BARU: MULAI KUIS */}
                  <Link to={`/quiz/${chapter.id}`} className="btn-start-quiz">
                    🚀 Mulai Quiz
                  </Link>
                </div>

              </div>
            ))
          ) : (
            <p className="empty-text">Belum ada materi di kategori ini.</p>
          )}
        </div>
      </section>

      {/* 1. Modal / Pop-up Form Tambah & Edit Bab */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editingChapterId ? '✏️ Edit Bab Pelajaran' : '✨ Buat Bab Pelajaran Baru'}</h3>
            <form onSubmit={handleSaveChapter}>
              <div className="form-group">
                <label>Judul Bab</label>
                <input type="text" required placeholder="Contoh: Mengenal Hewan" value={newChapter.title} onChange={(e) => setNewChapter({...newChapter, title: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Kategori</label>
                <input type="text" required placeholder="Contoh: Sains, Matematika, Seni..." value={newChapter.Category} onChange={(e) => setNewChapter({...newChapter, Category: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Deskripsi Singkat</label>
                <textarea rows="3" placeholder="Jelaskan isi pelajaran ini..." value={newChapter.description} onChange={(e) => setNewChapter({...newChapter, description: e.target.value})}></textarea>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={closeModal}>Batal</button>
                <button type="submit" className="btn-save" disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : (editingChapterId ? 'Simpan Perubahan' : 'Simpan & Lanjut Buat Soal')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal / Pop-up Custom KONFIRMASI HAPUS */}
      {isDeleteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: '3.5rem', margin: '0 auto 15px', width: '80px', height:'80px', background:'#FFEBEE', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'50%' }}>
              ⚠️
            </div>
            <h3 style={{ color: '#D32F2F', marginBottom: '15px', fontWeight: '900' }}>Hapus Bab Pelajaran?</h3>
            <p style={{ color: '#666', marginBottom: '25px', lineHeight: '1.6', fontSize: '0.95rem', fontWeight:'600' }}>
              Apakah Anda yakin ingin menghapus Bab ini?<br/>
              <b>Semua soal di dalamnya</b> akan ikut terhapus secara permanen.
            </p>
            <div className="modal-actions" style={{ justifyContent: 'center', marginTop: '10px' }}>
              <button type="button" className="btn-cancel" onClick={cancelDelete}>Batalkan</button>
              <button type="button" className="btn-save" style={{ background: '#D32F2F', border: 'none', boxShadow:'0 4px 0 #B71C1C' }} onClick={executeDelete}>
                Ya, Hapus!
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Lessons;
