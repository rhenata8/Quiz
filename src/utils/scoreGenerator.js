/**
 * scoreGenerator.js
 * Utilitas untuk generate nilai random pretest/posttest
 * Pretest: 20–40 | Posttest: 80–97
 *
 * Distribusi merata — tidak banyak nilai kembar
 * menggunakan shuffle Fisher-Yates pada pool nilai
 */

/**
 * Seeded PRNG (xorshift32) — deterministik berdasarkan seed string
 */
function makePRNG(seed) {
  let state = 0;
  for (let i = 0; i < seed.length; i++) {
    state = Math.imul(state ^ seed.charCodeAt(i), 0x9e3779b9) >>> 0;
  }
  if (state === 0) state = 1;
  return function () {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0xffffffff;
  };
}

/**
 * Fisher-Yates shuffle dengan seed PRNG
 */
function seededShuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Buat pool nilai yang terdistribusi merata di rentang [min, max]
 * Setiap nilai hanya muncul max sekali, kecuali jumlah siswa > rentang
 */
function buildPool(min, max, count) {
  const range = max - min + 1;
  const pool = [];
  // Isi pool dengan siklus penuh jika siswa lebih banyak dari rentang
  let filled = 0;
  while (filled < count) {
    for (let v = min; v <= max && filled < count; v++) {
      pool.push(v);
      filled++;
    }
  }
  return pool;
}

/**
 * Generate nilai pretest: 20–40 (terdistribusi merata)
 * @param {string} seed - string unik untuk shuffle (biasanya nama sekolah)
 * @param {number} count - jumlah siswa
 * @returns {number[]} array nilai
 */
export function generatePretestScores(seed, count) {
  const rng = makePRNG(seed + '_pretest_v2');
  const pool = buildPool(20, 40, count);
  return seededShuffle(pool, rng).slice(0, count);
}

/**
 * Generate nilai posttest: 80–97 (terdistribusi merata)
 * @param {string} seed - string unik untuk shuffle
 * @param {number} count - jumlah siswa
 * @returns {number[]} array nilai
 */
export function generatePosttestScores(seed, count) {
  const rng = makePRNG(seed + '_posttest_v2');
  const pool = buildPool(80, 97, count);
  return seededShuffle(pool, rng).slice(0, count);
}

/**
 * Generate rekap lengkap untuk array siswa — nilai merata, tidak banyak kembar
 * @param {Array<{name: string, school: string}>} students
 * @param {'pretest' | 'posttest'} testType
 * @param {string} testDate - format YYYY-MM-DD
 * @returns {Array} array siap simpan ke Supabase
 */
export function generateBulkScores(students, testType, testDate) {
  // Kelompokkan per sekolah agar distribusi per sekolah lebih merata
  const bySchool = {};
  students.forEach((s, i) => {
    if (!bySchool[s.school]) bySchool[s.school] = [];
    bySchool[s.school].push({ ...s, _origIdx: i });
  });

  const result = new Array(students.length);

  Object.entries(bySchool).forEach(([school, group]) => {
    const scores =
      testType === 'pretest'
        ? generatePretestScores(school, group.length)
        : generatePosttestScores(school, group.length);

    group.forEach((s, i) => {
      result[s._origIdx] = {
        student_name: s.name.trim(),
        school_name: school.trim(),
        test_type: testType,
        test_date: testDate,
        score: scores[i],
      };
    });
  });

  return result;
}

/**
 * Tanggal default sesuai ketentuan Bu Nur
 */
export const DEFAULT_PRETEST_DATE = '2026-05-18';  // 18 Mei 2026
export const DEFAULT_POSTTEST_DATE = '2026-06-22'; // 22 Juni 2026

/**
 * Format tanggal ke tampilan Indonesia
 */
export function formatDateID(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Warna badge berdasarkan nilai
 */
export function getScoreColor(score, testType) {
  if (testType === 'pretest') {
    if (score <= 25) return '#ef4444';
    if (score <= 33) return '#f97316';
    return '#eab308';
  } else {
    if (score >= 93) return '#22c55e';
    if (score >= 85) return '#84cc16';
    return '#eab308';
  }
}


/**
 * Seeded random berdasarkan string (nama siswa) agar nilai konsisten
 * jika di-generate ulang dengan data yang sama
 */
function seededRandom(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  // Normalize ke 0–1
  return Math.abs(hash) / 2147483647;
}

/**
 * Generate nilai pretest: 20–40
 */
export function generatePretestScore(seed = '') {
  if (seed) {
    const rng = seededRandom(seed + 'pretest');
    return Math.floor(rng * 21) + 20; // 20–40
  }
  return Math.floor(Math.random() * 21) + 20;
}

/**
 * Generate nilai posttest: 80–97
 */
export function generatePosttestScore(seed = '') {
  if (seed) {
    const rng = seededRandom(seed + 'posttest');
    return Math.floor(rng * 18) + 80; // 80–97
  }
  return Math.floor(Math.random() * 18) + 80;
}

/**
 * Generate rekap lengkap untuk array siswa
 * @param {Array<{name: string, school: string}>} students
 * @param {'pretest' | 'posttest'} testType
 * @param {string} testDate - format YYYY-MM-DD
 * @returns {Array} array siap simpan ke Supabase
 */
export function generateBulkScores(students, testType, testDate) {
  return students.map((student) => ({
    student_name: student.name,
    school_name: student.school,
    test_type: testType,
    test_date: testDate,
    score:
      testType === 'pretest'
        ? generatePretestScore(student.name)
        : generatePosttestScore(student.name),
  }));
}

/**
 * Tanggal default sesuai ketentuan Bu Nur
 */
export const DEFAULT_PRETEST_DATE = '2026-05-18';  // 18 Mei 2026
export const DEFAULT_POSTTEST_DATE = '2026-06-22'; // 22 Juni 2026

/**
 * Format tanggal ke tampilan Indonesia
 */
export function formatDateID(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Warna badge berdasarkan nilai
 */
export function getScoreColor(score, testType) {
  if (testType === 'pretest') {
    if (score <= 30) return '#ef4444'; // merah
    if (score <= 40) return '#f97316'; // oranye
    return '#eab308'; // kuning
  } else {
    if (score >= 90) return '#22c55e'; // hijau
    if (score >= 80) return '#84cc16'; // hijau muda
    return '#eab308'; // kuning
  }
}
