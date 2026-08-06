import React from "react";
import { Badge, ExamMetaCard } from "./SharedComponents";

export function AnswerKeyViewer({ examData, onClose }) {
  if (!examData) return null;

  const tfQuestions = examData.questions?.filter(q => q.type === 'TF') || [];
  const mcqQuestions = examData.questions?.filter(q => q.type === 'MCQ') || [];

  return (
    <div className="answer-key-overlay">
      <div className="answer-key-modal printable">
        <div className="answer-key-header">
          <div className="header-title">
            <h2>📝 نموذج الإجابة الصحيحة</h2>
            <div className="exam-stats">
              <Badge tone="blue">{tfQuestions.length} صح/خطأ</Badge>
              <Badge tone="green">{mcqQuestions.length} اختياري</Badge>
              <Badge tone="orange">الإجمالي: {examData.questions?.length || 0}</Badge>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn primary" onClick={() => window.print()}>
              🖨️ طباعة النموذج
            </button>
            <button className="btn danger" onClick={onClose}>❌ إغلاق</button>
          </div>
        </div>
        
        <div className="answer-key-content">
          <ExamMetaCard examData={examData} />
          <AnswerKeyTable tfQuestions={tfQuestions} mcqQuestions={mcqQuestions} />
          <QuestionsDetails tfQuestions={tfQuestions} mcqQuestions={mcqQuestions} />
        </div>
      </div>
    </div>
  );
}

/* جدول الإجابات الصحيحة */
function AnswerKeyTable({ tfQuestions, mcqQuestions }) {
  return (
    <div className="answer-key-table">
      <h4 className="table-title">🗝️ الإجابات الصحيحة</h4>
      
      {tfQuestions.length > 0 && (
        <AnswerSection 
          questions={tfQuestions} 
          title="أسئلة الصح والخطأ" 
          renderAnswer={renderTFAnswer}
        />
      )}

      {mcqQuestions.length > 0 && (
        <AnswerSection 
          questions={mcqQuestions} 
          title="الأسئلة الاختيارية" 
          renderAnswer={renderMCQAnswer}
        />
      )}
    </div>
  );
}

/* قسم الإجابات */
function AnswerSection({ questions, title, renderAnswer }) {
  return (
    <div className="answer-section">
      <h5 className="section-subtitle">{title}</h5>
      <div className="answers-grid">
        {questions.map((question, index) => (
          <div key={question.id} className="answer-row">
            <div className="question-number">السؤال {index + 1}</div>
            <div className="correct-answer">
              {renderAnswer(question)}
            </div>
            <div className="question-score">({question.score} درجة)</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* عرض إجابة الصح والخطأ */
function renderTFAnswer(question) {
  const correctAnswer = question.options?.find(opt => opt.is_correct);
  return correctAnswer?.opt_text === "صح" ? "✅ صح" : "❌ خطأ";
}

/* عرض إجابة الاختياري */
function renderMCQAnswer(question) {
  const correctOption = question.options?.find(opt => opt.is_correct);
  const optionIndex = question.options?.indexOf(correctOption);
  const optionLetter = optionIndex !== undefined ? String.fromCharCode(1570 + optionIndex) : '-';
  return `${optionLetter}) ${correctOption?.opt_text || '-'}`;
}

/* تفاصيل الأسئلة */
function QuestionsDetails({ tfQuestions, mcqQuestions }) {
  return (
    <div className="questions-details">
      <h4 className="table-title">📋 تفاصيل الأسئلة</h4>
      
      {tfQuestions.length > 0 && (
        <QuestionsSection 
          questions={tfQuestions} 
          title="أسئلة الصح والخطأ" 
          renderDetails={renderTFDetails}
        />
      )}

      {mcqQuestions.length > 0 && (
        <QuestionsSection 
          questions={mcqQuestions} 
          title="الأسئلة الاختيارية" 
          renderDetails={renderMCQDetails}
        />
      )}
    </div>
  );
}

/* قسم تفاصيل الأسئلة */
function QuestionsSection({ questions, title, renderDetails }) {
  return (
    <div className="questions-section">
      <h5 className="section-subtitle">{title}</h5>
      {questions.map((question, index) => (
        <QuestionDetail 
          key={question.id} 
          question={question} 
          index={index} 
          renderDetails={renderDetails}
        />
      ))}
    </div>
  );
}

/* تفاصيل السؤال */
function QuestionDetail({ question, index, renderDetails }) {
  return (
    <div className="question-detail">
      <div className="question-header">
        <span className="q-number">السؤال {index + 1}:</span>
        <span className="q-score">({question.score} درجة)</span>
      </div>
      <div className="question-text">{question.text}</div>
      {renderDetails(question)}
    </div>
  );
}

/* تفاصيل الصح والخطأ */
function renderTFDetails(question) {
  return (
    <div className="correct-answer-info">
      <strong>الإجابة الصحيحة:</strong> 
      {question.options?.find(opt => opt.is_correct)?.opt_text === "صح" ? " ✅ صح" : " ❌ خطأ"}
    </div>
  );
}

/* تفاصيل الاختياري */
function renderMCQDetails(question) {
  return (
    <div className="options-list">
      {question.options?.map((opt, i) => (
        <div key={i} className={`option ${opt.is_correct ? 'correct' : ''}`}>
          <span className="option-marker">{String.fromCharCode(1570 + i)})</span>
          {opt.opt_text}
          {opt.is_correct && <span className="correct-indicator"> ✓</span>}
        </div>
      ))}
    </div>
  );
}