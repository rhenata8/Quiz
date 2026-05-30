import React from 'react';
import { getCorrectIndexes, letterFor, seededShuffle } from '../../utils/questionHelpers';
import './PrintableQuestion.css';

/**
 * Renders one question in a paper-friendly form. Picks the right sub-component
 * for each question type. When `showAnswerKey` is true, correct answers are
 * highlighted and a "Kunci Jawaban" line is appended where appropriate.
 */
function PrintableQuestion({ question, number, showAnswerKey }) {
  if (!question) return null;
  const type = question.question_type;

  return (
    <article className="pq-card" data-pdf-block>
      <header className="pq-head">
        <span className="pq-num">Soal {number}</span>
        <span className="pq-type">{type}</span>
      </header>

      <h3 className="pq-text">{question.question_text}</h3>

      {/* Main image (for types that need it shown above the answer area).
          Coloring & Free Drawing render the image inside their body block
          for clarity, so we hide it here for those types. */}
      {question.content && !['Coloring Canvas', 'Free Drawing Canvas', 'Image Hotspot / Label'].includes(type) && (
        <div className="pq-main-img-wrap">
          <img
            src={question.content}
            alt=""
            className="pq-main-img"
            crossOrigin="anonymous"
            loading="eager"
          />
        </div>
      )}

      <div className="pq-body">
        {renderBody({ question, showAnswerKey })}
      </div>
    </article>
  );
}

function renderBody({ question, showAnswerKey }) {
  const type = question.question_type;
  const props = { question, showAnswerKey };
  switch (type) {
    case 'Pilihan Ganda (MCQ)':
      return <McqBody {...props} multi={false} />;
    case 'Multi-Select':
      return <McqBody {...props} multi />;
    case 'Matching':
    case 'Matching (Tarik Garis)':
      return <MatchingBody {...props} />;
    case 'Sequencing (Urutkan)':
      return <SequencingBody {...props} />;
    case 'Drag & Drop to Zone':
      return <DragDropBody {...props} />;
    case 'Coloring Canvas':
      return <ColoringBody {...props} />;
    case 'Free Drawing Canvas':
      return <FreeDrawBody {...props} />;
    case 'Visual Classification (Tap-to-Mark)':
      return <TapMarkBody {...props} />;
    case 'Image Hotspot / Label':
      return <HotspotBody {...props} />;
    case 'Counting Input':
      return <CountingBody {...props} />;
    case 'Reading + Question':
      return <ReadingBody {...props} />;
    case 'Mood/Emoji Picker':
      return <MoodBody {...props} />;
    default:
      return <FallbackBody {...props} />;
  }
}

/* -------------------- MCQ / Multi-Select -------------------- */
function McqBody({ question, multi, showAnswerKey }) {
  const opts = Array.isArray(question.options) ? question.options : [];
  const correct = getCorrectIndexes(question.correct_answer, opts);
  return (
    <>
      {multi && (
        <p className="pq-hint">Beri tanda ✔ pada semua pilihan yang benar (boleh lebih dari satu).</p>
      )}
      {!multi && (
        <p className="pq-hint">Beri tanda ✔ pada satu pilihan yang benar.</p>
      )}
      <ul className={`pq-options ${multi ? 'multi' : 'single'}`}>
        {opts.map((opt, i) => {
          const text = typeof opt === 'object' && opt !== null ? opt.text : opt;
          const image = typeof opt === 'object' && opt !== null ? opt.image : null;
          const isCorrect = correct.includes(i);
          return (
            <li key={i} className={`pq-option ${showAnswerKey && isCorrect ? 'is-correct' : ''}`}>
              <span className="pq-checkbox">{showAnswerKey && isCorrect ? '✔' : ''}</span>
              <span className="pq-letter">{letterFor(i)}.</span>
              {image && <img src={image} alt="" className="pq-opt-img" crossOrigin="anonymous" />}
              <span className="pq-opt-text">{text || <em>(gambar)</em>}</span>
            </li>
          );
        })}
      </ul>
      {showAnswerKey && (
        <div className="pq-answer-key">
          Kunci: {correct.map((i) => letterFor(i)).join(', ') || '—'}
        </div>
      )}
    </>
  );
}

/* -------------------- Matching -------------------- */
function MatchingBody({ question, showAnswerKey }) {
  const pairs = Array.isArray(question.options) ? question.options : [];
  // Independently shuffle the right-hand column so the kid actually has
  // matching to do. Use the question id as seed so the layout is stable
  // between preview and PDF re-export.
  const right = seededShuffle(
    pairs.map((p, idx) => ({ ...p.right, originalIdx: idx })),
    `m-${question.id}`,
  );
  return (
    <>
      <p className="pq-hint">Tarik garis dari titik (●) di kiri ke titik (●) di kanan untuk memasangkannya.</p>
      <div className="pq-match-grid">
        <div className="pq-match-col left">
          {pairs.map((p, i) => (
            <div className="pq-match-row" key={`l-${i}`}>
              <div className="pq-match-cell">
                {p.left?.image && <img src={p.left.image} alt="" className="pq-match-img" crossOrigin="anonymous" />}
                <span>{p.left?.text}</span>
              </div>
              <span className="pq-match-dot right-dot">●</span>
            </div>
          ))}
        </div>
        <div className="pq-match-col right">
          {right.map((r, i) => (
            <div className="pq-match-row" key={`r-${i}`}>
              <span className="pq-match-dot left-dot">●</span>
              <div className="pq-match-cell">
                {r.image && <img src={r.image} alt="" className="pq-match-img" crossOrigin="anonymous" />}
                <span>{r.text}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {showAnswerKey && (
        <div className="pq-answer-key">
          Kunci pasangan benar:
          <ul>
            {pairs.map((p, i) => (
              <li key={i}>
                {p.left?.text || '(kiri)'} ↔ {p.right?.text || '(kanan)'}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

/* -------------------- Sequencing -------------------- */
function SequencingBody({ question, showAnswerKey }) {
  // `options` are stored in the correct order. For paper, shuffle them so the
  // kid actually has to think about the sequence, then ask them to write the
  // order number in the box.
  const opts = Array.isArray(question.options) ? question.options : [];
  const items = opts.map((opt, originalIdx) => ({
    text: typeof opt === 'object' && opt !== null ? opt.text : opt,
    image: typeof opt === 'object' && opt !== null ? opt.image : null,
    originalIdx,
  }));
  const shuffled = seededShuffle(items, `s-${question.id}`);
  return (
    <>
      <p className="pq-hint">Tulis nomor urutan yang benar (1, 2, 3, ...) di dalam kotak.</p>
      <ol className="pq-seq-list">
        {shuffled.map((it, i) => (
          <li key={i} className="pq-seq-row">
            <span className="pq-seq-box">{showAnswerKey ? it.originalIdx + 1 : ''}</span>
            {it.image && <img src={it.image} alt="" className="pq-seq-img" crossOrigin="anonymous" />}
            <span className="pq-seq-text">{it.text}</span>
          </li>
        ))}
      </ol>
      {showAnswerKey && (
        <div className="pq-answer-key">
          Urutan benar: {opts.map((o, i) => `${i + 1}. ${(typeof o === 'object' && o) ? o.text : o}`).join(' → ')}
        </div>
      )}
    </>
  );
}

/* -------------------- Drag & Drop to Zone -------------------- */
function DragDropBody({ question, showAnswerKey }) {
  const opt = question.options || {};
  const zones = Array.isArray(opt.zones) ? opt.zones : [];
  const items = Array.isArray(opt.items) ? opt.items : [];
  // Shuffle items so list order doesn't telegraph the answer.
  const shuffled = seededShuffle(
    items.map((it, idx) => ({ ...it, originalIdx: idx, letter: letterFor(idx) })),
    `dd-${question.id}`,
  );
  return (
    <>
      <p className="pq-hint">
        Tulis huruf dari setiap item di bawah ke dalam kotak kategori yang tepat.
      </p>
      <div className="pq-dd-items">
        {shuffled.map((it) => (
          <div className="pq-dd-item" key={it.originalIdx}>
            <span className="pq-dd-letter">{it.letter}.</span>
            {it.image && <img src={it.image} alt="" className="pq-dd-img" crossOrigin="anonymous" />}
            <span>{it.text}</span>
          </div>
        ))}
      </div>
      <div className="pq-dd-zones">
        {zones.map((z, zi) => (
          <div className="pq-dd-zone" key={zi}>
            <div className="pq-dd-zone-label">{z}</div>
            <div className="pq-dd-zone-box">
              {showAnswerKey
                ? shuffled
                    .filter((it) => Number(it.zoneIndex) === zi)
                    .map((it) => it.letter)
                    .join(', ')
                : ' '}
            </div>
          </div>
        ))}
      </div>
      {showAnswerKey && (
        <div className="pq-answer-key">
          Kunci: {shuffled
            .map((it) => `${it.letter} → ${zones[it.zoneIndex] || '?'}`)
            .join(' • ')}
        </div>
      )}
    </>
  );
}

/* -------------------- Coloring Canvas -------------------- */
function ColoringBody({ question }) {
  return (
    <>
      <p className="pq-hint">Warnai gambar di bawah ini dengan rapi.</p>
      {question.content ? (
        <div className="pq-coloring">
          <img src={question.content} alt="" className="pq-coloring-img" crossOrigin="anonymous" />
        </div>
      ) : (
        <div className="pq-blank-box pq-blank-tall">Area Mewarnai</div>
      )}
    </>
  );
}

/* -------------------- Free Drawing Canvas -------------------- */
function FreeDrawBody({ question }) {
  return (
    <>
      <p className="pq-hint">Gambarlah sesuai instruksi di kotak kosong di bawah.</p>
      {question.content && (
        <div className="pq-freedraw-ref">
          <small>Contoh / referensi:</small>
          <img src={question.content} alt="" className="pq-freedraw-img" crossOrigin="anonymous" />
        </div>
      )}
      <div className="pq-blank-box pq-blank-tall">Area Menggambar</div>
    </>
  );
}

/* -------------------- Visual Classification (Tap-to-Mark) -------------------- */
function TapMarkBody({ question, showAnswerKey }) {
  const opt = question.options || {};
  const cats = Array.isArray(opt.categories) ? opt.categories : [];
  const items = Array.isArray(opt.items) ? opt.items : [];
  return (
    <>
      <p className="pq-hint">
        Tulis tanda yang sesuai di kotak setiap item. Lihat keterangan di bawah.
      </p>
      <div className="pq-mark-legend">
        <strong>Keterangan:</strong>
        <ul>
          {cats.map((c, i) => (
            <li key={i}>
              <span className="pq-mark-symbol">{c.symbol}</span> = {c.name}
            </li>
          ))}
        </ul>
      </div>
      <div className="pq-mark-grid">
        {items.map((it, i) => (
          <div className="pq-mark-item" key={i}>
            {it.image && <img src={it.image} alt="" className="pq-mark-img" crossOrigin="anonymous" />}
            <span className="pq-mark-text">{it.text}</span>
            <span className="pq-mark-box">
              {showAnswerKey ? cats[it.markIndex]?.symbol || '' : ''}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

/* -------------------- Image Hotspot / Label -------------------- */
function HotspotBody({ question, showAnswerKey }) {
  const hotspots = Array.isArray(question.options) ? question.options : [];
  return (
    <>
      <p className="pq-hint">
        Lihat angka pada gambar. Tuliskan nama bagian sesuai nomor di tabel di bawah.
      </p>
      {question.content ? (
        <div className="pq-hotspot-img-wrap">
          <img src={question.content} alt="" className="pq-hotspot-img" crossOrigin="anonymous" />
          {hotspots.map((h, i) => (
            <span
              key={i}
              className="pq-hotspot-pin"
              style={{ left: `${h.x}%`, top: `${h.y}%` }}
            >
              {i + 1}
            </span>
          ))}
        </div>
      ) : null}
      <ol className="pq-hotspot-list">
        {hotspots.map((h, i) => (
          <li key={i}>
            <span className="pq-hotspot-num">{i + 1}.</span>
            <span className="pq-hotspot-line">
              {showAnswerKey ? h.label : ''}
            </span>
          </li>
        ))}
      </ol>
    </>
  );
}

/* -------------------- Counting Input -------------------- */
function CountingBody({ question, showAnswerKey }) {
  const items = Array.isArray(question.options) ? question.options : [];
  return (
    <>
      <p className="pq-hint">Hitung objek di gambar, lalu tulis jumlahnya di tempat yang disediakan.</p>
      <ul className="pq-count-list">
        {items.map((it, i) => (
          <li key={i} className="pq-count-row">
            {it.image && <img src={it.image} alt="" className="pq-count-img" crossOrigin="anonymous" />}
            <span className="pq-count-name">Berapa jumlah {it.name}?</span>
            <span className="pq-count-eq">=</span>
            <span className="pq-count-box">{showAnswerKey ? it.correctCount : ''}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

/* -------------------- Reading + Question -------------------- */
function ReadingBody({ question, showAnswerKey }) {
  const opt = question.options || {};
  const passage = opt.passage || '';
  const subQs = Array.isArray(opt.questions) ? opt.questions : [];
  return (
    <>
      {passage && (
        <div className="pq-reading-passage">
          <strong>Bacaan:</strong>
          <p>{passage}</p>
        </div>
      )}
      <ol className="pq-reading-qs">
        {subQs.map((rq, qi) => (
          <li key={qi} className="pq-reading-q">
            <p className="pq-reading-q-text">{rq.question}</p>
            <ul className="pq-options single">
              {(rq.choices || []).map((ch, ci) => {
                const isCorrect = rq.correctIndex === ci;
                return (
                  <li
                    key={ci}
                    className={`pq-option ${showAnswerKey && isCorrect ? 'is-correct' : ''}`}
                  >
                    <span className="pq-checkbox">{showAnswerKey && isCorrect ? '✔' : ''}</span>
                    <span className="pq-letter">{letterFor(ci)}.</span>
                    <span className="pq-opt-text">{ch.text}</span>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ol>
      {showAnswerKey && (
        <div className="pq-answer-key">
          Kunci:{' '}
          {subQs.map((rq, qi) => `${qi + 1}.${letterFor(rq.correctIndex || 0)}`).join('  ')}
        </div>
      )}
    </>
  );
}

/* -------------------- Mood / Emoji Picker -------------------- */
function MoodBody({ question }) {
  const opts = Array.isArray(question.options) ? question.options : [];
  return (
    <>
      <p className="pq-hint">Lingkari gambar yang menggambarkan perasaanmu hari ini.</p>
      <ul className="pq-mood-list">
        {opts.map((opt, i) => {
          const text = typeof opt === 'object' && opt !== null ? opt.text : opt;
          const image = typeof opt === 'object' && opt !== null ? opt.image : null;
          return (
            <li key={i} className="pq-mood-item">
              {image && <img src={image} alt="" className="pq-mood-img" crossOrigin="anonymous" />}
              <span className="pq-mood-text">{text}</span>
              <span className="pq-mood-circle" />
            </li>
          );
        })}
      </ul>
    </>
  );
}

/* -------------------- Fallback -------------------- */
function FallbackBody() {
  return (
    <div className="pq-fallback">
      <em>Tipe soal ini belum didukung di versi cetak.</em>
    </div>
  );
}

export default PrintableQuestion;
