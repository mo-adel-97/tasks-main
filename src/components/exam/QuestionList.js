import React from "react";
import { Badge } from "./SharedComponents";
import { QuestionItem } from "./QuestionComponents";

export function QuestionList({ 
  examId, 
  examSaved, 
  questions, 
  form, 
  sectionOrder, 
  startEdit, 
  deleteQuestion, 
  saveExam, 
  busy,
  reorderQuestions 
}) {
  const tfQuestions = questions.filter(q => q.type === "TF");
  const mcqQuestions = questions.filter(q => q.type === "MCQ");

  return (
    <div className="card">
      <div className="questions-header">
        <h2 className="card-title">الأسئلة المضافة</h2>
        <div className="questions-actions">
          <div className="total-score">
            <Badge tone="green">الدرجة الكلية: {form.total_grade}</Badge>
            <Badge tone="blue">أسئلة صح/خطأ: {tfQuestions.length}</Badge>
            <Badge tone="purple">أسئلة اختياري: {mcqQuestions.length}</Badge>
          </div>
          {!examSaved && (
            <button className="btn success" onClick={saveExam} disabled={busy}>
              {busy ? "جارٍ الحفظ..." : "💾 حفظ الامتحان"}
            </button>
          )}
        </div>
      </div>

      <div className="exam-paper">
        <div className="exam-header">
          <div className="exam-title">{form.title || "اختبار"}</div>
          <div className="exam-meta">
            <span>المدة: {form.duration_minutes} دقيقة</span>
            <span>الدرجة الكلية: {form.total_grade}</span>
          </div>
        </div>

        {!examSaved && (
          <OrderControls onReorder={reorderQuestions} />
        )}

        <div className="question-section">
          {sectionOrder.map((t) => {
            const list = questions.filter(q => q.type === t);
            if (list.length === 0) return null;

            return (
              <div key={t} className="question-group">
                <h3 className="section-title">{t === "TF" ? "✅ أسئلة الصح والخطأ" : "🔘 أسئلة الاختياري"}</h3>
                <div className="questions-list">
                  {list.map((q, idx) => (
                    <QuestionItem
                      key={q.id}
                      question={q}
                      index={idx}
                      onEdit={startEdit}
                      onDelete={deleteQuestion}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* عناصر التحكم في الترتيب */
function OrderControls({ onReorder }) {
  return (
    <div className="order-controls">
      <h4>ترتيب الأسئلة:</h4>
      <div className="order-buttons">
        <button className="btn outline small" onClick={() => onReorder('tfFirst')}>✅ صح/خطأ أولاً</button>
        <button className="btn outline small" onClick={() => onReorder('mcqFirst')}>🔘 اختياري أولاً</button>
        <button className="btn outline small" onClick={() => onReorder('shuffle')}>🔀 ترتيب عشوائي</button>
      </div>
    </div>
  );
}