import React, { useState, useEffect } from "react";
import "./SharedCoursesManager.css"
// إضافة الدالة apiPost هنا أو استيرادها
const API_BASE = "https://hassen.sstli.com/api/index.php";
async function apiPost(action, payload) {
  const res = await fetch(`${API_BASE}?action=${encodeURIComponent(action)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    mode: "cors",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function SharedCoursesManager() {
  const [sharedCourses, setSharedCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseExams, setCourseExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copying, setCopying] = useState(false);

  // جلب المواد المشتركة
  useEffect(() => {
    const fetchSharedCourses = async () => {
      try {
        setLoading(true);
        const res = await apiPost('get_shared_courses', {});
        if (res.ok) {
          setSharedCourses(res.shared_courses || []);
        }
      } catch (error) {
        console.error('Error fetching shared courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSharedCourses();
  }, []);

  // جلب امتحانات مادة معينة
  const fetchCourseExams = async (courseName) => {
    try {
      setLoading(true);
      const res = await apiPost('get_exams_by_course', {
        course_name: courseName
      });
      
      if (res.ok) {
        setCourseExams(res.exams || []);
        setSelectedCourse(courseName);
      }
    } catch (error) {
      console.error('Error fetching course exams:', error);
    } finally {
      setLoading(false);
    }
  };

  // نسخ امتحان
  const copyExam = async (sourceExamId, targetDiploma, targetLevel) => {
    try {
      setCopying(true);
      const res = await apiPost('copy_exam', {
        source_exam_id: sourceExamId,
        target_diploma: targetDiploma,
        target_level: targetLevel
      });

      if (res.ok) {
        alert('تم نسخ الامتحان بنجاح!');
        // إعادة تحميل البيانات
        if (selectedCourse) {
          fetchCourseExams(selectedCourse);
        }
      } else {
        alert(res.error || 'حدث خطأ أثناء النسخ');
      }
    } catch (error) {
      console.error('Error copying exam:', error);
      alert('حدث خطأ أثناء النسخ');
    } finally {
      setCopying(false);
    }
  };

  return (
    <div className="shared-courses-manager">
      {/* عرض تفاصيل المادة المحددة */}
      {selectedCourse && (
        <div className="card">
          <div className="card-title">
            اختبارات مادة: {selectedCourse}
            <button 
              className="btn outline small"
              onClick={() => {
                setSelectedCourse(null);
                setCourseExams([]);
              }}
              style={{marginInlineStart: '10px'}}
            >
              رجوع
            </button>
          </div>

          {courseExams.length === 0 && !loading && (
            <div className="empty">لا توجد اختبارات لهذه المادة</div>
          )}

          {courseExams.map((examData, index) => (
            <div key={index} className="exam-details">
              <div className="exam-header">
                <h4>{examData.exam.diploma_name} - {examData.exam.level_name}</h4>
                <div>
                  <span className="badge green" style={{marginInlineEnd: '10px'}}>
                    {examData.questions.length} سؤال
                  </span>
                  <span className="badge blue">
                    {examData.exam.total_grade} درجة
                  </span>
                </div>
              </div>

              {/* عرض الأسئلة */}
              <div className="questions-preview">
                {examData.questions.length === 0 ? (
                  <div className="empty">لا توجد أسئلة في هذا الامتحان</div>
                ) : (
                  examData.questions.map((question, qIndex) => (
                    <div key={qIndex} className="question-preview">
                      <div className="question-text">
                        <strong>{qIndex + 1}. {question.text || question.question_text || 'نص السؤال غير متوفر'}</strong>
                        <span className={`question-type ${question.type === 'TF' ? 'tf' : 'mcq'}`}>
                          {question.type === 'TF' ? 'صح/خطأ' : 'اختياري'}
                        </span>
                      </div>
                      
                      {question.options && question.options.length > 0 && (
                        <div className="options-preview">
                          {question.options.map((option, oIndex) => (
                            <div 
                              key={oIndex} 
                              className={`option-preview ${option.is_correct ? 'correct' : ''}`}
                            >
                              {String.fromCharCode(65 + oIndex)}. {option.opt_text || option.text || 'خيار'}
                              {option.is_correct && ' ✓'}
                            </div>
                          ))}
                        </div>
                      )}

                      {question.type === 'TF' && (
                        <div className="tf-answer">
                          <strong>الإجابة: </strong>
                          {question.options?.find(opt => opt.is_correct)?.opt_text === 'صح' ? '✓ صح' : '✗ خطأ'}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* أزرار النسخ للدبلومات الأخرى */}
              <div className="copy-actions">
                <strong>نسخ هذا الاختبار إلى:</strong>
                <div className="copy-buttons">
                  {sharedCourses
                    .find(c => c.title === selectedCourse)
                    ?.combinations.split(',')
                    .map((combo, i) => {
                      const [diploma, level] = combo.split('|');
                      const exists = courseExams.some(e => 
                        e.exam.diploma_name === diploma && e.exam.level_name === level
                      );
                      
                      // لا تعرض زر نسخ لنفس الدبلوم
                      if (examData.exam.diploma_name === diploma && examData.exam.level_name === level) {
                        return null;
                      }

                      return (
                        <button
                          key={i}
                          className="btn small"
                          disabled={exists || copying}
                          onClick={() => copyExam(examData.exam.id, diploma, level)}
                        >
                          {diploma} - {level}
                          {exists && ' (موجود)'}
                          {copying && ' جاري النسخ...'}
                        </button>
                      );
                    })
                    .filter(Boolean)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SharedCoursesManager;