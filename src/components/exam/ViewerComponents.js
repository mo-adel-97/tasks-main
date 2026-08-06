import React from "react";
import { Badge, Field } from "./SharedComponents";

/* مكون عرض الاختبار */
export function ExamViewer({ examData, onClose, onCopyToAll }) {
  if (!examData) return null;

  const tfQuestions = examData.questions?.filter(q => q.type === 'TF') || [];
  const mcqQuestions = examData.questions?.filter(q => q.type === 'MCQ') || [];

  return (
    <div className="exam-viewer-overlay">
      <div className="exam-viewer-modal">
        <div className="exam-viewer-header">
          <div className="header-title">
            <h2>📋 عرض الاختبار</h2>
            <div className="exam-stats">
              <Badge tone="blue">{tfQuestions.length} صح/خطأ</Badge>
              <Badge tone="green">{mcqQuestions.length} اختياري</Badge>
              <Badge tone="orange">الإجمالي: {examData.questions?.length || 0}</Badge>
            </div>
          </div>
          <div className="header-actions">
            {onCopyToAll && (
              <button 
                className="btn success"
                onClick={() => onCopyToAll(examData)}
                title="نسخ هذا الاختبار لجميع التركيبات الأخرى"
              >
                📤 نسخ للجميع
              </button>
            )}
            <button className="btn danger" onClick={onClose}>❌ إغلاق</button>
          </div>
        </div>
        
        <div className="exam-viewer-content">
          {/* محتوى عرض الاختبار */}
          <ExamMetaCard examData={examData} />
          
          {tfQuestions.length > 0 && (
            <QuestionSection 
              type="tf" 
              questions={tfQuestions} 
              title="📝 أسئلة الصح والخطأ" 
            />
          )}

          {mcqQuestions.length > 0 && (
            <QuestionSection 
              type="mcq" 
              questions={mcqQuestions} 
              title="🔘 الأسئلة الاختيارية" 
            />
          )}

          {examData.questions?.length === 0 && <EmptyExam />}
        </div>
      </div>
    </div>
  );
}

/* مكون بطاقة معلومات الامتحان */
function ExamMetaCard({ examData }) {
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

/* مكون قسم الأسئلة */
function QuestionSection({ type, questions, title }) {
  return (
    <div className={`question-section-${type}`}>
      <div className="section-header">
        <h4 className="section-title">{title}</h4>
        <Badge tone={type === 'tf' ? 'blue' : 'green'}>{questions.length} سؤال</Badge>
      </div>
      <div className="questions-grid">
        {questions.map((question, index) => (
          <QuestionCard key={question.id} question={question} index={index} type={type} />
        ))}
      </div>
    </div>
  );
}

/* مكون بطاقة السؤال */
function QuestionCard({ question, index, type }) {
  return (
    <div className={`question-card ${type}-card`}>
      <div className="question-header">
        <div className="question-meta">
          <span className="question-number">السؤال {index + 1}</span>
          <span className="question-score">({question.score} درجة)</span>
        </div>
      </div>
      <div className="question-text">{question.text}</div>
      
      {type === 'tf' ? (
        <TFOptions options={question.options} />
      ) : (
        <MCQOptions options={question.options} />
      )}
    </div>
  );
}

/* مكون خيارات الصح والخطأ */
function TFOptions({ options }) {
  return (
    <div className="tf-options-grid">
      {options?.map((opt, i) => (
        <div key={i} className={`tf-option ${opt.is_correct ? 'correct' : ''}`}>
          <span className="option-marker">{i === 0 ? 'أ) صح' : 'ب) خطأ'}</span>
          {opt.is_correct && <span className="correct-badge">✓ الإجابة الصحيحة</span>}
        </div>
      ))}
    </div>
  );
}

/* مكون خيارات الاختياري */
function MCQOptions({ options }) {
  return (
    <div className="mcq-options-list">
      {options?.map((opt, i) => (
        <div key={i} className={`mcq-option ${opt.is_correct ? 'correct' : ''}`}>
          <span className="option-marker">{String.fromCharCode(1570 + i)})</span>
          <span className="option-text">{opt.opt_text}</span>
          {opt.is_correct && <span className="correct-badge">✓ الإجابة الصحيحة</span>}
        </div>
      ))}
    </div>
  );
}

/* مكون فارغ */
function EmptyExam() {
  return (
    <div className="empty-exam">
      <div className="empty-icon">📭</div>
      <h4>لا توجد أسئلة في هذا الاختبار</h4>
      <p>لم يتم إضافة أي أسئلة لهذا الاختبار بعد.</p>
    </div>
  );
}