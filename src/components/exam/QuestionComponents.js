import React from "react";
import { Field } from "./SharedComponents";

/* مكون السؤال */
export function QuestionItem({ question, index, onEdit, onDelete }) {
  return (
    <div className={`question-item ${question.type === 'TF' ? 'tf-type' : 'mcq-type'}`}>
      <div className="question-content">
        <div className="question-header">
          <div className="question-number">السؤال {index + 1}</div>
          <div className="question-actions">
            <button className="btn small" onClick={() => onEdit(question)}>تعديل</button>
            <button className="btn small danger" onClick={() => onDelete(question.id)}>حذف</button>
          </div>
        </div>

        <div className="question-text">{question.text}</div>

        <div className="question-options">
          {question.type === "TF" ? (
            <div className="tf-options">
              <div className={`option ${question.options?.[0]?.is_correct || question.options?.[0]?.correct ? 'correct' : ''}`}>
                <span className="option-marker">أ)</span> صح
              </div>
              <div className={`option ${question.options?.[1]?.is_correct || question.options?.[1]?.correct ? 'correct' : ''}`}>
                <span className="option-marker">ب)</span> خطأ
              </div>
            </div>
          ) : (
            <div className="mcq-options">
              {(question.options || []).map((opt, i) => (
                <div key={i} className={`option ${(opt.is_correct || opt.correct) ? 'correct' : ''}`}>
                  <span className="option-marker">{String.fromCharCode(1570 + i)})</span> {opt.opt_text || opt.text}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* مكون إدخال السؤال */
export function QuestionForm({
  editingId,
  qType,
  setQType,
  qText,
  setQText,
  score,
  setScore,
  tfCorrect,
  setTfCorrect,
  mcqOpts,
  updateOpt,
  addOpt,
  removeOpt,
  setCorrectOnly,
  submitQuestion,
  busy,
  onCancelEdit
}) {
  return (
    <div className="card">
      <h2 className="card-title">{editingId ? "✏️ تعديل سؤال" : "➕ إضافة سؤال"}</h2>
      <div className="grid g4">
        <Field label="نوع السؤال" required>
          <div className="seg">
            <button
              className={`seg-btn ${qType === "TF" ? "active" : ""}`}
              onClick={() => setQType("TF")}
            >✅ صح/خطأ</button>
            <button
              className={`seg-btn ${qType === "MCQ" ? "active" : ""}`}
              onClick={() => setQType("MCQ")}
            >🔘 اختياري</button>
          </div>
        </Field>

        <div className="col-span-3">
          <Field label="نص السؤال" required>
            <textarea
              rows={3}
              placeholder="اكتب نص السؤال بوضوح…"
              value={qText}
              onChange={(e) => setQText(e.target.value)}
            />
          </Field>
        </div>
      </div>

      <div className="grid g3">
        <Field label="درجة السؤال">
          <input
            type="number"
            min={0}
            step={0.5}
            value={score}
            onChange={(e) => setScore(e.target.value)}
          />
        </Field>
      </div>

      {qType === "TF" ? (
        <div className="grid g3">
          <Field label="الإجابة الصحيحة" required>
            <div className="seg">
              <button
                className={`seg-btn ${tfCorrect === "صح" ? "active" : ""}`}
                onClick={() => setTfCorrect("صح")}
              >✅ صح</button>
              <button
                className={`seg-btn ${tfCorrect === "خطأ" ? "active" : ""}`}
                onClick={() => setTfCorrect("خطأ")}
              >❌ خطأ</button>
            </div>
          </Field>
        </div>
      ) : (
        <div className="mcq-box">
          <div className="mcq-list">
            {mcqOpts.map((o) => (
              <div className="mcq-item" key={o.id}>
                <button
                  type="button"
                  className={`flag ${o.correct ? "on" : ""}`}
                  title="تحديد كصحيح"
                  onClick={() => setCorrectOnly(o.id)}
                >✓</button>
                <input
                  type="text"
                  placeholder="نص الاختيار…"
                  value={o.text}
                  onChange={(e) => updateOpt(o.id, { text: e.target.value })}
                />
                <button
                  type="button"
                  className="icon danger"
                  title="حذف"
                  onClick={() => removeOpt(o.id)}
                  disabled={mcqOpts.length <= 2}
                >✕</button>
              </div>
            ))}
          </div>
          <div className="bar">
            <button type="button" className="btn" onClick={addOpt}>+ إضافة اختيار</button>
            <span className="muted">حد أدنى اختيارين | اختيار واحد صحيح</span>
          </div>
        </div>
      )}

      <div className="bar">
        <button className="btn primary" onClick={submitQuestion} disabled={busy}>
          {busy ? "جارٍ..." : (editingId ? "تحديث السؤال" : "إضافة السؤال")}
        </button>
        {editingId && onCancelEdit && (
          <button className="btn" onClick={onCancelEdit}>إلغاء التعديل</button>
        )}
      </div>
    </div>
  );
}