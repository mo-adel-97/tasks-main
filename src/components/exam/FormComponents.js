import React from "react";
import { Field, Badge } from "./SharedComponents";

/* مكون الفلاتر الأساسية */
export function BasicFilters({ 
  form, 
  setForm, 
  diplomas, 
  levels, 
  filteredCourses, 
  setExamId, 
  setQuestions 
}) {
  return (
    <>
      <div className="grid g3">
        <Field label="الدبلوم" required>
          <select
            value={form.diploma_id}
            onChange={(e) => {
              const v = e.target.value;
              setForm(f => ({ ...f, diploma_id: v, level_id: "", course_id: "" }));
              setExamId(null); setQuestions([]);
            }}
          >
            <option value="">— اختر الدبلوم —</option>
            {diplomas.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </Field>

        <Field label="المستوى" required>
          <select
            value={form.level_id}
            onChange={(e) => {
              const v = e.target.value;
              setForm(f => ({ ...f, level_id: v, course_id: "" }));
              setExamId(null); setQuestions([]);
            }}
            disabled={!form.diploma_id}
          >
            <option value="">— اختر المستوى —</option>
            {levels.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </Field>

        <Field label="المقرر" required>
          <select
            value={form.course_id}
            onChange={(e) => {
              const v = e.target.value;
              setForm(f => ({ ...f, course_id: v }));
              setExamId(null); setQuestions([]);
            }}
            disabled={!form.level_id}
          >
            <option value="">— اختر المقرر —</option>
            {filteredCourses.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid g2">
        <Field label="الدرجة الكلية">
          <input
            type="number"
            min={1}
            step={1}
            value={form.total_grade}
            onChange={(e) => setForm(f => ({ ...f, total_grade: e.target.value }))}
          />
        </Field>
        <Field label="المدة (دقيقة)">
          <input
            type="number"
            min={10}
            step={5}
            value={form.duration_minutes}
            onChange={(e) => setForm(f => ({ ...f, duration_minutes: e.target.value }))}
          />
        </Field>
      </div>
    </>
  );
}

/* مكون الفلاتر للمواد المشتركة */
export function SharedCourseFilters({ 
  sharedCourses, 
  selectedSharedCourse, 
  setSelectedSharedCourse,
  filteredCombinations,
  viewExam,
  viewAnswerKey,
  busy,
  form,
  setForm
}) {
  return (
    <>
      <div className="grid g1">
        <Field label="المادة المشتركة" required>
          <select
            value={selectedSharedCourse}
            onChange={(e) => setSelectedSharedCourse(e.target.value)}
          >
            <option value="">— اختر المادة المشتركة —</option>
            {sharedCourses.map(course => (
              <option key={course.id} value={course.id}>{course.name}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid g2">
        <Field label="الدرجة الكلية">
          <input
            type="number"
            min={1}
            step={1}
            value={form.total_grade}
            onChange={(e) => setForm(f => ({ ...f, total_grade: e.target.value }))}
          />
        </Field>
        <Field label="المدة (دقيقة)">
          <input
            type="number"
            min={10}
            step={5}
            value={form.duration_minutes}
            onChange={(e) => setForm(f => ({ ...f, duration_minutes: e.target.value }))}
          />
        </Field>
      </div>

      {selectedSharedCourse && (
        <SharedCombinationsList 
          combinations={filteredCombinations}
          onViewExam={viewExam}
          onViewAnswerKey={viewAnswerKey}
          busy={busy}
        />
      )}
    </>
  );
}

/* قائمة التركيبات المشتركة */
function SharedCombinationsList({ combinations, onViewExam, onViewAnswerKey, busy }) {
  return (
    <div className="shared-combinations">
      <div className="combinations-header">
        <h4>التركيبات المتاحة لهذه المادة:</h4>
        <Badge tone="purple">
          إجمالي التركيبات: {combinations.length}
        </Badge>
      </div>
      <div className="combinations-list">
        {combinations.map((comb, index) => (
          <div key={index} className="combination-item">
            <div className="combination-info">
              <Badge tone="blue">{comb.diploma}</Badge>
              <Badge tone="green">{comb.level}</Badge>
              <span className="course-name">{comb.course_name}</span>
            </div>
            <div className="combination-actions">
              <button 
                className="btn outline small"
                onClick={() => onViewExam(comb)}
                disabled={busy}
              >
                {busy ? "جارٍ..." : "👁️ عرض الاختبار"}
              </button>
              <button 
                className="btn primary small"
                onClick={() => onViewAnswerKey(comb)}
                disabled={busy}
              >
                {busy ? "جارٍ..." : "🗝️ نموذج الإجابة"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}