import React from "react";

/* مكوّن إدخال عام */
export function Field({ label, children, required = false, hint }) {
  return (
    <div className="field">
      <label className="field-label">
        {label} {required && <span className="req">*</span>}
      </label>
      {children}
      {hint ? <div className="hint">{hint}</div> : null}
    </div>
  );
}

/* شارة صغيرة */
export function Badge({ children, tone = "neutral" }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

/* مكون بطاقة معلومات الامتحان */
export function ExamMetaCard({ examData }) {
  return (
    <div className="exam-meta-card">
      <div className="exam-title-section">
        <h3>{examData.exam?.title || "اختبار"}</h3>
        <div className="exam-meta-badges">
          <Badge tone="blue">الدبلوم: {examData.diploma}</Badge>
          <Badge tone="green">المستوى: {examData.level}</Badge>
          <Badge tone="purple">المقرر: {examData.course_name}</Badge>
        </div>
      </div>
      <div className="exam-details-grid">
        <div className="detail-item">
          <span className="detail-label">الدرجة الكلية:</span>
          <span className="detail-value">{examData.exam?.total_grade || 60}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">المدة:</span>
          <span className="detail-value">{examData.exam?.duration_minutes || 60} دقيقة</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">عدد الأسئلة:</span>
          <span className="detail-value">{examData.questions?.length || 0}</span>
        </div>
      </div>
    </div>
  );
}