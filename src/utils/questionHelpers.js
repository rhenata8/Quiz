// Helpers for reading the raw `questions` row data into a stable shape that
// the printable components & builder can consume safely.

// Convert a stored `correct_answer` string into an array of correct option
// indexes. Mirrors the helper in ChapterDetail.jsx.
export function getCorrectIndexes(correctAnswerStr, optionsList = []) {
  if (!correctAnswerStr) return [];
  if (correctAnswerStr === 'matching' || correctAnswerStr === 'sequence') return [];

  try {
    const parsed = JSON.parse(correctAnswerStr);
    if (Array.isArray(parsed)) return parsed.map(Number);
  } catch {
    // ignore malformed JSON, fall through to numeric / text matching
  }

  const asNum = parseInt(correctAnswerStr, 10);
  if (!isNaN(asNum) && asNum.toString() === String(correctAnswerStr)) {
    return [asNum];
  }

  const idx = (optionsList || []).findIndex((opt) => {
    const txt = typeof opt === 'object' && opt !== null ? opt.text : opt;
    return txt === correctAnswerStr;
  });
  return idx !== -1 ? [idx] : [];
}

// Stable letter labels for options (A, B, C, ...).
export function letterFor(idx) {
  return String.fromCharCode(65 + idx);
}

// Deterministic shuffle using a string seed so the same assignment always
// produces the same order on screen and in the exported PDF.
export function seededShuffle(arr, seed) {
  const result = [...arr];
  let h = 2166136261;
  const seedStr = String(seed || 'kiro');
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  for (let i = result.length - 1; i > 0; i--) {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
    const j = Math.abs(h) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Plain-text label for a question type (used in builder filters & headers).
export const QUESTION_TYPE_EMOJI = {
  'Pilihan Ganda (MCQ)': '🅰️',
  'Multi-Select': '✅',
  'Matching (Tarik Garis)': '🔗',
  'Matching': '🔗',
  'Sequencing (Urutkan)': '🔢',
  'Drag & Drop to Zone': '📦',
  'Free Drawing Canvas': '🖌️',
  'Coloring Canvas': '🎨',
  'Visual Classification (Tap-to-Mark)': '🏷️',
  'Image Hotspot / Label': '📍',
  'Counting Input': '🔢',
  'Reading + Question': '📖',
  'Mood/Emoji Picker': '😊',
};
