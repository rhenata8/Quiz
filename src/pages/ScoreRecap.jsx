import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import PrintableScoreRecap from '../components/printable/PrintableScoreRecap';
import {
  generateBulkScores,
  DEFAULT_PRETEST_DATE,
  DEFAULT_POSTTEST_DATE,
  formatDateID,
  getScoreColor,
} from '../utils/scoreGenerator';
import './ScoreRecap.css';

// ─── Daftar siswa dari data Bu Nur (127 siswa, 5 sekolah) ────────────────────
const STUDENT_LIST = [
  // Daruttaqwa (20 siswa)
  { name: 'Keenan Shaki Abidzarazka', school: 'Daruttaqwa' },
  { name: 'Mylinda Ivanka Bagastara', school: 'Daruttaqwa' },
  { name: 'Azkayra Shezan Putri Aditya', school: 'Daruttaqwa' },
  { name: 'Rafqi Abil Setyawan', school: 'Daruttaqwa' },
  { name: 'M. Alfarezel Arfan', school: 'Daruttaqwa' },
  { name: 'Shafwan Khoirullah Chavid', school: 'Daruttaqwa' },
  { name: 'Qonchiyulun Salamah', school: 'Daruttaqwa' },
  { name: 'Raihan Raayya Salsabila', school: 'Daruttaqwa' },
  { name: 'Berrinella Nayaka Varyana', school: 'Daruttaqwa' },
  { name: 'El Chanum Shaqella', school: 'Daruttaqwa' },
  { name: 'Amanda Azzahra Agustin', school: 'Daruttaqwa' },
  { name: 'Muhammad Alfarizky Tri Y.', school: 'Daruttaqwa' },
  { name: 'Aisyah Ichanza Azkarima', school: 'Daruttaqwa' },
  { name: 'Rivano Febriyan Putra', school: 'Daruttaqwa' },
  { name: 'Azka Raffaniya Putra', school: 'Daruttaqwa' },
  { name: 'Muhammad Defano Saputra', school: 'Daruttaqwa' },
  { name: 'Dekania Aprilla Ramadhani', school: 'Daruttaqwa' },
  { name: 'Almahyra Zea Dzakira', school: 'Daruttaqwa' },
  { name: 'Zayna Afrani Riyanti', school: 'Daruttaqwa' },
  { name: 'Octavianis Saputri', school: 'Daruttaqwa' },
  // Dharma Wanita 02 (16 siswa)
  { name: 'Muhammad Adiatma', school: 'Dharma Wanita 02' },
  { name: 'Antania Cinta Vyona', school: 'Dharma Wanita 02' },
  { name: 'Alfendi Yibran Agustin', school: 'Dharma Wanita 02' },
  { name: 'Muhammad Abisayta', school: 'Dharma Wanita 02' },
  { name: 'Kaira Nabila Tanisha', school: 'Dharma Wanita 02' },
  { name: 'Ribka Viola Nur Aini', school: 'Dharma Wanita 02' },
  { name: 'Kenzo Krisna Yoga', school: 'Dharma Wanita 02' },
  { name: 'Umi Rafiah', school: 'Dharma Wanita 02' },
  { name: 'Nafisa Khumairoh', school: 'Dharma Wanita 02' },
  { name: 'M. Arka Jovanka', school: 'Dharma Wanita 02' },
  { name: 'Alexandria Citro Asmara', school: 'Dharma Wanita 02' },
  { name: 'M. Faiq Hadziq', school: 'Dharma Wanita 02' },
  { name: 'M. Roger Sabastian', school: 'Dharma Wanita 02' },
  { name: 'M. Kafli Rajendra A.', school: 'Dharma Wanita 02' },
  { name: 'Loisella Jihan', school: 'Dharma Wanita 02' },
  { name: 'Adewa Deliza', school: 'Dharma Wanita 02' },
  // TK DM 15 (44 siswa)
  { name: 'Adzka Jhoufa Anum', school: 'TK DM 15' },
  { name: 'Ahmad Adhitama Rayyan', school: 'TK DM 15' },
  { name: 'Aisyah Khumairoh P.', school: 'TK DM 15' },
  { name: 'Alza Hilya Mafaza', school: 'TK DM 15' },
  { name: 'Alena Martania Anjani', school: 'TK DM 15' },
  { name: 'Aliesha Ailyah R.', school: 'TK DM 15' },
  { name: 'Aqila Dhiya Putri Inayah', school: 'TK DM 15' },
  { name: 'El-Zayn Luthan Ahmad', school: 'TK DM 15' },
  { name: 'El-Zio Rayyan A.', school: 'TK DM 15' },
  { name: 'Ghibran Raihan', school: 'TK DM 15' },
  { name: 'Haidak Maulud C.', school: 'TK DM 15' },
  { name: 'Hana Daulatul Inayah', school: 'TK DM 15' },
  { name: 'Helya Putri Agustin', school: 'TK DM 15' },
  { name: 'Husein Abdullah', school: 'TK DM 15' },
  { name: 'Ilyas Jinan', school: 'TK DM 15' },
  { name: 'Joura Cahya Almahira', school: 'TK DM 15' },
  { name: 'Jihan Talita Ulfa', school: 'TK DM 15' },
  { name: 'Kayyija Ami Alediyah', school: 'TK DM 15' },
  { name: 'Keysha Aqila', school: 'TK DM 15' },
  { name: 'M. Khabibi A.', school: 'TK DM 15' },
  { name: 'M. Wildan Afandi', school: 'TK DM 15' },
  { name: 'Mafaza Hilya Khalifah', school: 'TK DM 15' },
  { name: 'M. Ammar Lowie O.', school: 'TK DM 15' },
  { name: 'M. Davi Ardiansyah A.', school: 'TK DM 15' },
  { name: 'M. Iffat K.', school: 'TK DM 15' },
  { name: 'M. Rizal Imam S.', school: 'TK DM 15' },
  { name: 'M. Abdul Ghojali', school: 'TK DM 15' },
  { name: 'M. Adzec Syabani', school: 'TK DM 15' },
  { name: 'M. Aflah Sanjaya', school: 'TK DM 15' },
  { name: 'M. Azka Wahyu P.', school: 'TK DM 15' },
  { name: 'M. Fatihan Shaleh', school: 'TK DM 15' },
  { name: 'M. Giberan', school: 'TK DM 15' },
  { name: 'M. Raka Syahreza', school: 'TK DM 15' },
  { name: 'M. Umar Habsy', school: 'TK DM 15' },
  { name: 'M. Zarima Rasyad Y.', school: 'TK DM 15' },
  { name: 'Nafiza Azna Aqila K.', school: 'TK DM 15' },
  { name: 'Naina Hanna Hasan Khalifah', school: 'TK DM 15' },
  { name: 'Naja Khalida', school: 'TK DM 15' },
  { name: 'Najwa Maharani P.', school: 'TK DM 15' },
  { name: 'Nesya Billya P.', school: 'TK DM 15' },
  { name: 'Nur Inta H.', school: 'TK DM 15' },
  { name: 'Aghnia Azhalea', school: 'TK DM 15' },
  { name: 'Arka Dewi', school: 'TK DM 15' },
  { name: 'Amar Zidan', school: 'TK DM 15' },
  // TK DM 69 (22 siswa)
  { name: 'Shakeil', school: 'TK DM 69' },
  { name: 'Zaki', school: 'TK DM 69' },
  { name: 'Azka', school: 'TK DM 69' },
  { name: 'Aldo', school: 'TK DM 69' },
  { name: 'Vian', school: 'TK DM 69' },
  { name: 'Elshe', school: 'TK DM 69' },
  { name: 'Vlarisza', school: 'TK DM 69' },
  { name: 'Filzi', school: 'TK DM 69' },
  { name: 'Tata', school: 'TK DM 69' },
  { name: 'Keyla', school: 'TK DM 69' },
  { name: 'Mafruhah', school: 'TK DM 69' },
  { name: 'Revan', school: 'TK DM 69' },
  { name: 'Della', school: 'TK DM 69' },
  { name: 'Habib', school: 'TK DM 69' },
  { name: 'Darul', school: 'TK DM 69' },
  { name: 'Arman', school: 'TK DM 69' },
  { name: 'Faris', school: 'TK DM 69' },
  { name: 'Elshanum', school: 'TK DM 69' },
  { name: 'Aisyah', school: 'TK DM 69' },
  { name: 'Salsa', school: 'TK DM 69' },
  { name: 'Nafisa', school: 'TK DM 69' },
  { name: 'Arumi', school: 'TK DM 69' },
  // TK DM59 (25 siswa)
  { name: 'Andini Nauren A', school: 'TK DM59' },
  { name: 'Ellena Wijaya', school: 'TK DM59' },
  { name: 'Zahira Zahra', school: 'TK DM59' },
  { name: 'Azkiya Nursyifa', school: 'TK DM59' },
  { name: 'Adiva Dhaania Khaiza', school: 'TK DM59' },
  { name: 'Mahira Sajida', school: 'TK DM59' },
  { name: 'Aqilla Fatimatuz Zahra', school: 'TK DM59' },
  { name: 'Alesha Khanza', school: 'TK DM59' },
  { name: 'Addawiyatul Rahma', school: 'TK DM59' },
  { name: 'Nayna Nahda Rafanda', school: 'TK DM59' },
  { name: 'Ayu Maharani', school: 'TK DM59' },
  { name: 'Nada Hafidzah', school: 'TK DM59' },
  { name: 'Lava Ferdinan', school: 'TK DM59' },
  { name: 'Gabriel Bintang', school: 'TK DM59' },
  { name: 'M. Azfer Refeyta', school: 'TK DM59' },
  { name: 'Firnando Gandra', school: 'TK DM59' },
  { name: 'Ikmal Rayyan', school: 'TK DM59' },
  { name: 'Delio Athalla', school: 'TK DM59' },
  { name: 'M. Hafiz Al Farizqi', school: 'TK DM59' },
  { name: 'Moch Alif Amiruddin', school: 'TK DM59' },
  { name: 'M. Azka Irawan', school: 'TK DM59' },
  { name: 'M. Sahal Fahmi', school: 'TK DM59' },
  { name: 'Aisyah Syafina', school: 'TK DM59' },
  { name: 'Aksa Hafidz Syaputro', school: 'TK DM59' },
  { name: 'Muhammad Syauqi Ali', school: 'TK DM59' },
];


const TABS = ['riwayat', 'input', 'generator'];

function ScoreRecap() {
  const [activeTab, setActiveTab] = useState('riwayat');
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('semua');
  const [filterSchool, setFilterSchool] = useState('semua');
  const [searchTerm, setSearchTerm] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);
  const printRef = useRef();

  // ─── Form Input Manual ─────────────────────────────────────────────────────
  const [form, setForm] = useState({
    student_name: '',
    school_name: '',
    test_type: 'pretest',
    test_date: DEFAULT_PRETEST_DATE,
    score: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formMsg, setFormMsg] = useState(null);

  // ─── Generator ────────────────────────────────────────────────────────────
  const [genType, setGenType] = useState('pretest');
  const [genDate, setGenDate] = useState(DEFAULT_PRETEST_DATE);
  const [genStudents, setGenStudents] = useState(
    STUDENT_LIST.map((s) => ({ ...s, selected: true }))
  );
  const [genPreview, setGenPreview] = useState([]);
  const [genLoading, setGenLoading] = useState(false);
  const [genMsg, setGenMsg] = useState(null);
  const [rawStudentInput, setRawStudentInput] = useState('');
  const [showPasteArea, setShowPasteArea] = useState(false);

  useEffect(() => {
    fetchScores();
  }, []);

  // Update tanggal default saat genType berubah
  useEffect(() => {
    setGenDate(
      genType === 'pretest' ? DEFAULT_PRETEST_DATE : DEFAULT_POSTTEST_DATE
    );
  }, [genType]);

  // ─── Fetch dari Supabase ───────────────────────────────────────────────────
  async function fetchScores() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('score_recap')
        .select('*')
        .order('test_date', { ascending: false })
        .order('student_name', { ascending: true });
      if (error) throw error;
      setScores(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // ─── Daftar sekolah unik untuk filter ─────────────────────────────────────
  const schools = ['semua', ...new Set(scores.map((s) => s.school_name))];

  // ─── Filter data riwayat ───────────────────────────────────────────────────
  const filteredScores = scores.filter((s) => {
    const matchType = filterType === 'semua' || s.test_type === filterType;
    const matchSchool =
      filterSchool === 'semua' || s.school_name === filterSchool;
    const matchSearch =
      s.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.school_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchType && matchSchool && matchSearch;
  });

  // ─── Submit Input Manual ───────────────────────────────────────────────────
  async function handleFormSubmit(e) {
    e.preventDefault();
    if (!form.student_name || !form.school_name || !form.score) {
      setFormMsg({ type: 'error', text: 'Semua field wajib diisi.' });
      return;
    }
    setFormLoading(true);
    setFormMsg(null);
    try {
      const { error } = await supabase.from('score_recap').insert([
        {
          ...form,
          score: parseInt(form.score),
        },
      ]);
      if (error) throw error;
      setFormMsg({ type: 'success', text: 'Nilai berhasil disimpan!' });
      setForm({
        student_name: '',
        school_name: form.school_name,
        test_type: form.test_type,
        test_date: form.test_date,
        score: '',
      });
      fetchScores();
    } catch (err) {
      setFormMsg({ type: 'error', text: err.message });
    } finally {
      setFormLoading(false);
    }
  }

  // ─── Generate Preview ──────────────────────────────────────────────────────
  function handleGenerate() {
    const selected = genStudents.filter((s) => s.selected);
    if (selected.length === 0) {
      setGenMsg({ type: 'error', text: 'Pilih minimal 1 siswa.' });
      return;
    }
    const preview = generateBulkScores(selected, genType, genDate);
    setGenPreview(preview);
    setGenMsg(null);
  }

  // ─── Simpan hasil generator ke Supabase ───────────────────────────────────
  async function handleSaveGenerated() {
    if (genPreview.length === 0) return;
    setGenLoading(true);
    setGenMsg(null);
    try {
      const { error } = await supabase.from('score_recap').insert(genPreview);
      if (error) throw error;
      setGenMsg({
        type: 'success',
        text: `${genPreview.length} nilai berhasil disimpan!`,
      });
      setGenPreview([]);
      fetchScores();
    } catch (err) {
      setGenMsg({ type: 'error', text: err.message });
    } finally {
      setGenLoading(false);
    }
  }

  // ─── Parse input teks daftar siswa ────────────────────────────────────────
  function handleParseStudents() {
    const lines = rawStudentInput
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const parsed = lines.map((line) => {
      // Format: "Nama Siswa | Nama Sekolah" atau "Nama Siswa,Nama Sekolah"
      const parts = line.split(/[|,\t]/).map((p) => p.trim());
      return {
        name: parts[0] || line,
        school: parts[1] || 'TK Tidak Diketahui',
        selected: true,
      };
    });
    setGenStudents(parsed);
    setShowPasteArea(false);
    setRawStudentInput('');
  }

  // ─── Toggle pilih siswa di generator ──────────────────────────────────────
  function toggleStudent(idx) {
    setGenStudents((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, selected: !s.selected } : s))
    );
  }

  function toggleAllStudents(val) {
    setGenStudents((prev) => prev.map((s) => ({ ...s, selected: val })));
  }

  // ─── Print PDF ─────────────────────────────────────────────────────────────
  function handlePrint() {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 300);
  }

  // ─── Hapus semua data (dengan konfirmasi) ─────────────────────────────────
  async function handleDeleteAll() {
    if (
      !window.confirm(
        `Hapus ${filteredScores.length} data yang ditampilkan sekarang? Tindakan ini tidak bisa dibatalkan.`
      )
    )
      return;
    const ids = filteredScores.map((s) => s.id);
    const { error } = await supabase
      .from('score_recap')
      .delete()
      .in('id', ids);
    if (!error) fetchScores();
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  if (isPrinting) {
    return (
      <PrintableScoreRecap
        scores={filteredScores}
        filterType={filterType}
        filterSchool={filterSchool}
      />
    );
  }

  return (
    <div className="sr-wrapper">
      <header className="sr-header">
        <div className="sr-header-text">
          <h2>Rekap Nilai Siswa</h2>
          <p>Kelola nilai pretest & posttest seluruh siswa</p>
        </div>
        <div className="sr-header-stats">
          <div className="sr-stat">
            <span className="sr-stat-num">
              {scores.filter((s) => s.test_type === 'pretest').length}
            </span>
            <span className="sr-stat-label">Pretest</span>
          </div>
          <div className="sr-stat">
            <span className="sr-stat-num">
              {scores.filter((s) => s.test_type === 'posttest').length}
            </span>
            <span className="sr-stat-label">Posttest</span>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="sr-tabs">
        <button
          className={`sr-tab ${activeTab === 'riwayat' ? 'active' : ''}`}
          onClick={() => setActiveTab('riwayat')}
        >
          📊 Riwayat
        </button>
        <button
          className={`sr-tab ${activeTab === 'input' ? 'active' : ''}`}
          onClick={() => setActiveTab('input')}
        >
          ✏️ Input Manual
        </button>
        <button
          className={`sr-tab ${activeTab === 'generator' ? 'active' : ''}`}
          onClick={() => setActiveTab('generator')}
        >
          ⚡ Generator
        </button>
      </div>

      {/* ── TAB RIWAYAT ─────────────────────────────────────────────────────── */}
      {activeTab === 'riwayat' && (
        <div className="sr-content">
          {/* Filter bar */}
          <div className="sr-filterbar">
            <input
              type="text"
              className="sr-search"
              placeholder="🔍 Cari nama / sekolah..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="sr-select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="semua">Semua Tes</option>
              <option value="pretest">Pretest</option>
              <option value="posttest">Posttest</option>
            </select>
            <select
              className="sr-select"
              value={filterSchool}
              onChange={(e) => setFilterSchool(e.target.value)}
            >
              {schools.map((s) => (
                <option key={s} value={s}>
                  {s === 'semua' ? 'Semua Sekolah' : s}
                </option>
              ))}
            </select>
            <button className="sr-btn-print" onClick={handlePrint}>
              🖨️ Print PDF
            </button>
            {filteredScores.length > 0 && (
              <button className="sr-btn-danger" onClick={handleDeleteAll}>
                🗑️ Hapus
              </button>
            )}
          </div>

          {/* Tabel */}
          <div className="sr-table-wrap">
            {loading ? (
              <div className="sr-empty">Memuat data...</div>
            ) : filteredScores.length === 0 ? (
              <div className="sr-empty">
                <span>📭</span>
                <p>Belum ada data nilai. Gunakan tab Generator atau Input Manual.</p>
              </div>
            ) : (
              <table className="sr-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nama Siswa</th>
                    <th>Sekolah</th>
                    <th>Jenis Tes</th>
                    <th>Tanggal</th>
                    <th>Nilai</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredScores.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="sr-td-num">{idx + 1}</td>
                      <td className="sr-td-name">{item.student_name}</td>
                      <td className="sr-td-school">{item.school_name}</td>
                      <td>
                        <span
                          className={`sr-badge ${item.test_type}`}
                        >
                          {item.test_type === 'pretest' ? 'Pretest' : 'Posttest'}
                        </span>
                      </td>
                      <td>{formatDateID(item.test_date)}</td>
                      <td>
                        <span
                          className="sr-score"
                          style={{
                            background: getScoreColor(item.score, item.test_type) + '22',
                            color: getScoreColor(item.score, item.test_type),
                          }}
                        >
                          {item.score}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {filteredScores.length > 0 && (
            <div className="sr-count">
              Menampilkan {filteredScores.length} data
            </div>
          )}
        </div>
      )}

      {/* ── TAB INPUT MANUAL ─────────────────────────────────────────────────── */}
      {activeTab === 'input' && (
        <div className="sr-content sr-form-wrap">
          <h3 className="sr-section-title">Input Nilai Manual</h3>
          <p className="sr-section-sub">
            Masukkan nilai satu per satu untuk setiap siswa
          </p>
          <form className="sr-form" onSubmit={handleFormSubmit}>
            <div className="sr-form-row">
              <div className="sr-field">
                <label>Nama Siswa</label>
                <input
                  type="text"
                  placeholder="Nama lengkap siswa"
                  value={form.student_name}
                  onChange={(e) =>
                    setForm({ ...form, student_name: e.target.value })
                  }
                />
              </div>
              <div className="sr-field">
                <label>Asal Sekolah</label>
                <input
                  type="text"
                  placeholder="Nama TK / sekolah"
                  value={form.school_name}
                  onChange={(e) =>
                    setForm({ ...form, school_name: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="sr-form-row">
              <div className="sr-field">
                <label>Jenis Tes</label>
                <select
                  value={form.test_type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      test_type: e.target.value,
                      test_date:
                        e.target.value === 'pretest'
                          ? DEFAULT_PRETEST_DATE
                          : DEFAULT_POSTTEST_DATE,
                    })
                  }
                >
                  <option value="pretest">Pretest</option>
                  <option value="posttest">Posttest</option>
                </select>
              </div>
              <div className="sr-field">
                <label>Tanggal</label>
                <input
                  type="date"
                  value={form.test_date}
                  onChange={(e) => setForm({ ...form, test_date: e.target.value })}
                />
              </div>
              <div className="sr-field">
                <label>Nilai (0–100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Contoh: 35"
                  value={form.score}
                  onChange={(e) => setForm({ ...form, score: e.target.value })}
                />
              </div>
            </div>
            {formMsg && (
              <div className={`sr-msg ${formMsg.type}`}>{formMsg.text}</div>
            )}
            <button
              type="submit"
              className="sr-btn-primary"
              disabled={formLoading}
            >
              {formLoading ? 'Menyimpan...' : '💾 Simpan Nilai'}
            </button>
          </form>
        </div>
      )}

      {/* ── TAB GENERATOR ───────────────────────────────────────────────────── */}
      {activeTab === 'generator' && (
        <div className="sr-content">
          <h3 className="sr-section-title">⚡ Generator Nilai Otomatis</h3>
          <p className="sr-section-sub">
            Generate nilai random untuk seluruh siswa sekaligus.
            <br />
            <b>Pretest:</b> 20–40 &nbsp;|&nbsp; <b>Posttest:</b> 80–97
          </p>

          {/* Pengaturan generator */}
          <div className="sr-gen-settings">
            <div className="sr-field">
              <label>Jenis Tes</label>
              <div className="sr-radio-group">
                <label className={`sr-radio ${genType === 'pretest' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="genType"
                    value="pretest"
                    checked={genType === 'pretest'}
                    onChange={() => setGenType('pretest')}
                  />
                  Pretest (20–40)
                </label>
                <label className={`sr-radio ${genType === 'posttest' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="genType"
                    value="posttest"
                    checked={genType === 'posttest'}
                    onChange={() => setGenType('posttest')}
                  />
                  Posttest (80–97)
                </label>
              </div>
            </div>
            <div className="sr-field">
              <label>Tanggal</label>
              <input
                type="date"
                value={genDate}
                onChange={(e) => setGenDate(e.target.value)}
                className="sr-date-input"
              />
              <span className="sr-date-hint">
                {genType === 'pretest'
                  ? '(Default: 18 Mei 2026)'
                  : '(Default: 22 Juni 2026)'}
              </span>
            </div>
          </div>

          {/* Daftar siswa */}
          <div className="sr-gen-students">
            <div className="sr-gen-students-header">
              <span>
                Daftar Siswa ({genStudents.filter((s) => s.selected).length} dipilih)
              </span>
              <div className="sr-gen-actions">
                <button
                  className="sr-btn-sm"
                  onClick={() => toggleAllStudents(true)}
                >
                  Pilih Semua
                </button>
                <button
                  className="sr-btn-sm"
                  onClick={() => toggleAllStudents(false)}
                >
                  Hapus Pilihan
                </button>
                <button
                  className="sr-btn-sm accent"
                  onClick={() => setShowPasteArea(!showPasteArea)}
                >
                  📋 Input Daftar Siswa
                </button>
              </div>
            </div>

            {showPasteArea && (
              <div className="sr-paste-area">
                <p className="sr-paste-hint">
                  Tempel daftar siswa, satu baris per siswa.<br />
                  Format: <code>Nama Siswa | Nama Sekolah</code> atau pisahkan dengan koma/tab.
                </p>
                <textarea
                  rows={8}
                  placeholder={'Aisyah Putri | TK Melati\nBudi Santoso | TK Harapan\n...'}
                  value={rawStudentInput}
                  onChange={(e) => setRawStudentInput(e.target.value)}
                />
                <button className="sr-btn-primary" onClick={handleParseStudents}>
                  ✅ Proses Daftar
                </button>
              </div>
            )}

            <div className="sr-student-list">
              {genStudents.map((s, idx) => (
                <label key={idx} className="sr-student-item">
                  <input
                    type="checkbox"
                    checked={s.selected}
                    onChange={() => toggleStudent(idx)}
                  />
                  <span className="sr-student-name">{s.name}</span>
                  <span className="sr-student-school">{s.school}</span>
                </label>
              ))}
            </div>
          </div>

          <button className="sr-btn-generate" onClick={handleGenerate}>
            ⚡ Generate Nilai
          </button>

          {/* Preview hasil generate */}
          {genPreview.length > 0 && (
            <div className="sr-gen-preview">
              <div className="sr-gen-preview-header">
                <h4>Preview ({genPreview.length} siswa)</h4>
                <div>
                  <span className="sr-preview-range">
                    {genType === 'pretest'
                      ? 'Nilai: 20–40'
                      : 'Nilai: 80–97'}{' '}
                    | Tanggal: {formatDateID(genDate)}
                  </span>
                </div>
              </div>
              <div className="sr-table-wrap">
                <table className="sr-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Nama Siswa</th>
                      <th>Sekolah</th>
                      <th>Nilai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {genPreview.map((item, idx) => (
                      <tr key={idx}>
                        <td className="sr-td-num">{idx + 1}</td>
                        <td className="sr-td-name">{item.student_name}</td>
                        <td className="sr-td-school">{item.school_name}</td>
                        <td>
                          <span
                            className="sr-score"
                            style={{
                              background:
                                getScoreColor(item.score, item.test_type) + '22',
                              color: getScoreColor(item.score, item.test_type),
                            }}
                          >
                            {item.score}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {genMsg && (
                <div className={`sr-msg ${genMsg.type}`}>{genMsg.text}</div>
              )}
              <div className="sr-gen-save-row">
                <button
                  className="sr-btn-primary"
                  onClick={handleSaveGenerated}
                  disabled={genLoading}
                >
                  {genLoading
                    ? 'Menyimpan...'
                    : `💾 Simpan ${genPreview.length} Nilai ke Database`}
                </button>
                <button
                  className="sr-btn-secondary"
                  onClick={() => setGenPreview([])}
                >
                  Batal
                </button>
              </div>
            </div>
          )}

          {genMsg && genPreview.length === 0 && (
            <div className={`sr-msg ${genMsg.type}`}>{genMsg.text}</div>
          )}
        </div>
      )}
    </div>
  );
}

export default ScoreRecap;
