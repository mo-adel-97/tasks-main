import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Divider
} from '@mui/material';
import {
  Star,
  CheckCircle,
  RadioButtonChecked,
  BarChart,
  PieChart,
  TrendingUp
} from '@mui/icons-material';

// الألوان الأساسية
const primaryColor = '#80b49e';
const primaryDark = '#6a9a87';
const primaryLight = '#9ac9b5';
const backgroundColor = '#f8fbfa';
const textColor = '#2c3e50';

const SurveyReportExporter = ({ survey, responses, isExternal = false }) => {

  // توليد تحليل مفصّل لكل سؤال
  const generateDetailedAnalysis = () => {
    return survey.questions?.map((question, qIndex) => {
      const questionResponses = responses.map(response => ({
        respondent: (isExternal ? response.student_name : response.employee_name) || 'بدون اسم',
        answer: response.responses?.[qIndex] ?? null,
        date: response.submitted_at
      }));

      const analysis = analyzeQuestionResponses(question, questionResponses);

      return {
        question,
        questionResponses,
        analysis
      };
    });
  };

  const analyzeQuestionResponses = (question, questionResponses) => {
    const totalResponses = questionResponses.filter(
      r => r.answer !== null && r.answer !== '' && r.answer !== undefined
    ).length;

    switch (question.type) {
      case 'radio':
      case 'checkbox':
        return analyzeMultipleChoice(question, questionResponses, totalResponses);

      case 'rating':
        return analyzeRating(question, questionResponses, totalResponses);

      case 'text':
        return analyzeText(question, questionResponses, totalResponses);

      default:
        return { totalResponses, type: 'unknown' };
    }
  };

  // تحليل اختيار من متعدد / متعدد الاختيار
  const analyzeMultipleChoice = (question, questionResponses, totalResponses) => {
    const optionCounts = {};
    const optionPercentages = {};

    // تهيئة العدادات
    question.options?.forEach((_, index) => {
      optionCounts[index] = 0;
    });

    // العد
    questionResponses.forEach(response => {
      if (response.answer === null || response.answer === '' || response.answer === undefined) return;

      if (question.type === 'checkbox') {
        let answers;

        if (Array.isArray(response.answer)) {
          answers = response.answer;
        } else if (typeof response.answer === 'string' && response.answer.trim().startsWith('[')) {
          try {
            answers = JSON.parse(response.answer);
          } catch {
            answers = [response.answer];
          }
        } else {
          answers = [response.answer];
        }

        answers.forEach(ans => {
          const key = ans;
          if (key !== null && key !== '' && optionCounts.hasOwnProperty(key)) {
            optionCounts[key] = (optionCounts[key] || 0) + 1;
          }
        });
      } else {
        const key = response.answer;
        if (optionCounts.hasOwnProperty(key)) {
          optionCounts[key] = (optionCounts[key] || 0) + 1;
        }
      }
    });

    // حساب النسب
    Object.keys(optionCounts).forEach(key => {
      const count = optionCounts[key];
      optionPercentages[key] =
        totalResponses > 0 ? ((count / totalResponses) * 100).toFixed(1) : '0.0';
    });

    // تحديد الخيارات الأكثر شيوعًا (مع التعامل مع التعادل)
    const keys = Object.keys(optionCounts);
    const maxCount = keys.length
      ? Math.max(...keys.map(k => optionCounts[k] || 0))
      : 0;

    const mostPopularKeys =
      maxCount > 0
        ? keys.filter(k => optionCounts[k] === maxCount)
        : [];

    const mostPopularLabels = mostPopularKeys.map(k => {
      const idx = parseInt(k, 10);
      return question.options?.[idx] ?? `الخيار ${idx + 1}`;
    });

    return {
      type: 'multipleChoice',
      totalResponses,
      optionCounts,
      optionPercentages,
      mostPopular: {
        optionIndexes: mostPopularKeys.map(k => parseInt(k, 10)),
        labels: mostPopularLabels,
        countPerOption: maxCount,
        percentagePerOption:
          totalResponses > 0 ? ((maxCount / totalResponses) * 100).toFixed(1) : '0.0'
      }
    };
  };

  // تحليل أسئلة التقييم
  const analyzeRating = (question, questionResponses, totalResponses) => {
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let ratingSum = 0;
    let ratingCount = 0;

    questionResponses.forEach(response => {
      const rating = parseInt(response.answer, 10);
      if (!isNaN(rating) && rating >= 1 && rating <= 5) {
        ratingCounts[rating]++;
        ratingSum += rating;
        ratingCount++;
      }
    });

    const averageRating = ratingCount > 0 ? (ratingSum / ratingCount).toFixed(1) : '0.0';

    const starDistribution = Object.keys(ratingCounts).map(star => ({
      stars: parseInt(star, 10),
      count: ratingCounts[star],
      percentage:
        ratingCount > 0
          ? ((ratingCounts[star] / ratingCount) * 100).toFixed(1)
          : '0.0'
    }));

    return {
      type: 'rating',
      totalResponses: ratingCount,
      ratingCounts,
      averageRating,
      starDistribution
    };
  };

  // تحليل الأسئلة النصية
  const analyzeText = (question, questionResponses, totalResponses) => {
    const wordCounts = [];
    const responseLengths = [];

    questionResponses.forEach(response => {
      if (typeof response.answer === 'string' && response.answer.trim() !== '') {
        const words = response.answer.trim().split(/\s+/);
        wordCounts.push(words.length);
        responseLengths.push(response.answer.length);
      }
    });

    const totalWords = wordCounts.reduce((a, b) => a + b, 0);
    const avgWordCount =
      wordCounts.length > 0
        ? (totalWords / wordCounts.length).toFixed(1)
        : '0.0';

    const totalLength = responseLengths.reduce((a, b) => a + b, 0);
    const avgResponseLength =
      responseLengths.length > 0
        ? (totalLength / responseLengths.length).toFixed(1)
        : '0.0';

    return {
      type: 'text',
      totalResponses,
      avgWordCount,
      avgResponseLength,
      totalWords
    };
  };

  // معدل الإكمال
  const calculateCompletionRate = () => {
    if (!responses.length || !survey.questions || !survey.questions.length) return 0;

    const totalQuestions = survey.questions.length;
    let totalAnswered = 0;

    responses.forEach(response => {
      const answered = (response.responses || []).filter(
        r => r !== null && r !== '' && r !== undefined
      ).length;
      totalAnswered += answered;
    });

    const completionRate =
      (totalAnswered / (responses.length * totalQuestions)) * 100;

    return Math.round(completionRate);
  };

  // السؤال الأكثر تفاعلًا
  const getMostEngagedQuestion = () => {
    if (!survey.questions || survey.questions.length === 0) return 'لا يوجد بيانات';

    let maxResponses = 0;
    let mostEngagedQuestion = '';

    survey.questions.forEach((question, index) => {
      const responseCount = responses.filter(r =>
        r.responses &&
        r.responses[index] !== null &&
        r.responses[index] !== '' &&
        r.responses[index] !== undefined
      ).length;

      if (responseCount > maxResponses) {
        maxResponses = responseCount;
        mostEngagedQuestion = question.text;
      }
    });

    if (!mostEngagedQuestion) return 'لا يوجد بيانات';

    return mostEngagedQuestion.length > 50
      ? mostEngagedQuestion.substring(0, 50) + '...'
      : mostEngagedQuestion;
  };

  // حساب الرضا العام من أسئلة الـ Rating
  const calculateOverallSatisfaction = () => {
    if (!survey.questions || survey.questions.length === 0) return 0;

    const ratingIndices = survey.questions
      .map((q, idx) => (q.type === 'rating' ? idx : null))
      .filter(idx => idx !== null);

    if (!ratingIndices.length) return 0;

    let totalRating = 0;
    let ratingCount = 0;

    responses.forEach(response => {
      ratingIndices.forEach(idx => {
        const rating = parseInt(response.responses?.[idx], 10);
        if (!isNaN(rating) && rating >= 1 && rating <= 5) {
          totalRating += rating;
          ratingCount++;
        }
      });
    });

    if (!ratingCount) return 0;

    const avg = totalRating / ratingCount;
    return Math.round((avg / 5) * 100);
  };

  // وقت الذروة
  const getPeakResponseTime = () => {
    if (!responses.length) return 'لا يوجد بيانات';

    const hourCounts = {};

    responses.forEach(response => {
      const date = new Date(response.submitted_at);
      if (isNaN(date.getTime())) return;
      const hour = date.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const hours = Object.keys(hourCounts);
    if (!hours.length) return 'لا يوجد بيانات';

    const peakHour = hours.reduce((a, b) =>
      hourCounts[a] > hourCounts[b] ? a : b
    );

    const start = parseInt(peakHour, 10);
    const end = (start + 1) % 24;

    return `${start}:00 - ${end}:00`;
  };

  // نوع السؤال كنص
  const getQuestionTypeText = (type) => {
    const types = {
      text: 'نص حر',
      radio: 'اختيار من متعدد',
      checkbox: 'اختيار متعدد',
      rating: 'تقييم (1-5)'
    };
    return types[type] || type;
  };

  // تنسيق الإجابة للتصدير
  const formatAnswerForExport = (type, answer, options) => {
    if ((answer === null || answer === '' || answer === undefined) && answer !== 0) {
      return '<span style="color: #999; font-style: italic;">لم يتم الإجابة</span>';
    }

    switch (type) {
      case 'text':
        return `<div style="background: #f8fbfa; padding: 10px 15px; border-radius: 8px; border-right: 4px solid #80b49e; margin: 5px 0;">${answer}</div>`;

      case 'radio': {
        const idx = parseInt(answer, 10);
        const label = options?.[idx] ?? answer;
        return `<span class="answer-badge">${label}</span>`;
      }

      case 'checkbox': {
        let arr;

        if (Array.isArray(answer)) {
          arr = answer;
        } else if (typeof answer === 'string' && answer.trim().startsWith('[')) {
          try {
            arr = JSON.parse(answer);
          } catch {
            arr = [answer];
          }
        } else {
          arr = [answer];
        }

        return arr
          .map(opt => {
            const idx = parseInt(opt, 10);
            const label = options?.[idx] ?? opt;
            return `<span class="answer-badge">${label}</span>`;
          })
          .join('');
      }

      case 'rating': {
        const rating = parseInt(answer, 10);
        const safeRating = isNaN(rating) ? 0 : Math.max(1, Math.min(5, rating));
        const stars = '★'.repeat(safeRating) + '☆'.repeat(5 - safeRating);
        return `<div><span class="rating-stars">${stars}</span> <strong style="color: #6a9a87;">(${safeRating}/5)</strong></div>`;
      }

      default:
        return String(answer);
    }
  };

  // تحليل خيارات الاختيارات
  const renderOptionsAnalysis = (analysis, question) => {
    return `
    <div style="margin-top: 20px;">
      <h5 style="color: #6a9a87; margin-bottom: 15px;">📊 توزيع الإجابات:</h5>
      ${
        Object.keys(analysis.optionCounts)
          .map(optionKey => {
            const percentage = analysis.optionPercentages[optionKey];
            const count = analysis.optionCounts[optionKey] || 0;
            const idx = parseInt(optionKey, 10);
            const label = question.options?.[idx] ?? `الخيار ${idx + 1}`;
            return `
              <div style="margin: 10px 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <span style="font-weight: 600;">${label}</span>
                  <span style="color: #6a9a87; font-weight: 600;">${count} (${percentage}%)</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${percentage}%;"></div>
                </div>
              </div>
            `;
          })
          .join('')
      }
    </div>
    `;
  };

  // إحصائيات السؤال
  const renderQuestionStats = (analysis, question) => {
    switch (analysis.type) {
      case 'multipleChoice': {
        const labels = analysis.mostPopular.labels || [];
        const labelText =
          !labels.length
            ? 'لا يوجد بيانات كافية'
            : labels.length === 1
              ? `الخيار الأكثر شيوعاً: ${labels[0]} (${analysis.percentagePerOption}%)`
              : `أكثر من خيار متساوي في الشيوع: ${labels.join('، ')} (${analysis.countPerOption} إجابة لكل منهم)`;

        return `
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px;">
            <div style="background: #f8fbfa; padding: 15px; border-radius: 10px; border: 1px solid #e8f5f1;">
              <strong>إجمالي الردود:</strong> ${analysis.totalResponses}
            </div>
            <div style="background: #f8fbfa; padding: 15px; border-radius: 10px; border: 1px solid #e8f5f1;">
              <strong>${labels.length <= 1 ? 'الخيار الأكثر شيوعاً:' : 'الخيارات الأكثر شيوعاً:'}</strong>
              <div style="margin-top: 5px;">${labelText}</div>
            </div>
          </div>
          ${renderOptionsAnalysis(analysis, question)}
        `;
      }

      case 'rating':
        return `
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px;">
            <div style="background: #f8fbfa; padding: 15px; border-radius: 10px; border: 1px solid #e8f5f1;">
              <strong>متوسط التقييم:</strong> ${analysis.averageRating}/5
            </div>
            <div style="background: #f8fbfa; padding: 15px; border-radius: 10px; border: 1px solid #e8f5f1;">
              <strong>إجمالي التقييمات:</strong> ${analysis.totalResponses}
            </div>
          </div>
        `;

      case 'text':
        return `
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px;">
            <div style="background: #f8fbfa; padding: 15px; border-radius: 10px; border: 1px solid #e8f5f1;">
              <strong>متوسط عدد الكلمات:</strong> ${analysis.avgWordCount}
            </div>
            <div style="background: #f8fbfa; padding: 15px; border-radius: 10px; border: 1px solid #e8f5f1;">
              <strong>متوسط طول الإجابة:</strong> ${analysis.avgResponseLength} حرف</strong>
            </div>
          </div>
        `;

      default:
        return `<div>إجمالي الردود: ${analysis.totalResponses || 0}</div>`;
    }
  };

  // فيجوال للسؤال
  const renderVisualization = (question, analysis, qIndex) => {
    if (analysis.type === 'rating') {
      return `
      <div class="chart-container">
        <div class="chart-title">⭐ توزيع التقييمات</div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
          ${
            analysis.starDistribution
              .map(star => `
                <div style="text-align: center; background: #f8fbfa; padding: 15px; border-radius: 10px; border: 2px solid #e8f5f1;">
                  <div class="rating-stars">${'★'.repeat(star.stars)}${'☆'.repeat(5 - star.stars)}</div>
                  <div style="font-size: 1.1rem; font-weight: bold; color: #6a9a87; margin: 5px 0;">${star.count}</div>
                  <div style="font-size: 0.9rem; color: #2c3e50;">${star.percentage}%</div>
                </div>
              `)
              .join('')
          }
        </div>
      </div>
      `;
    }

    if (analysis.type === 'multipleChoice') {
      return `
      <div class="chart-container">
        <div class="chart-title">📈 رسم بياني للإجابات</div>
        <canvas id="chart-q-${qIndex}" width="400" height="200"></canvas>
      </div>
      `;
    }

    return '';
  };

  // تحليل سؤال كامل كـ HTML
  const renderQuestionAnalysis = (item, qIndex) => {
    const { question, analysis } = item;

    return `
    <div class="question-card">
      <div class="question-header">
        <div class="question-number">${qIndex + 1}</div>
        <div class="question-text">${question.text}</div>
        <div class="question-type">${getQuestionTypeText(question.type)}</div>
      </div>

      <div class="analysis-section">
        <h4 style="color: #6a9a87; margin-bottom: 15px;">📈 التحليل الإحصائي</h4>
        ${renderQuestionStats(analysis, question)}
      </div>

      ${renderVisualization(question, analysis, qIndex)}

      <div class="chart-container">
        <div class="chart-title">📋 الردود التفصيلية</div>
        <details class="details-block">
          <summary>مشاهدة التفاصيل</summary>
          <div class="details-content">
            <table class="responses-table">
              <thead>
                <tr>
                  <th style="width: 30%;">${isExternal ? 'الطالب' : 'الموظف'}</th>
                  <th style="width: 50%;">الإجابة</th>
                  <th style="width: 20%;">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                ${
                  item.questionResponses
                    .map(response => `
                      <tr>
                        <td><strong>${response.respondent || 'بدون اسم'}</strong></td>
                        <td>${formatAnswerForExport(question.type, response.answer, question.options)}</td>
                        <td>${response.date ? new Date(response.date).toLocaleDateString('ar-EG') : ''}</td>
                      </tr>
                    `)
                    .join('')
                }
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </div>
    `;
  };

  // سكريبت الرسومات (Chart.js)
  const generateChartsScript = (analysis) => {
    let chartScripts = '';

    analysis.forEach((item, index) => {
      if (item.analysis.type === 'multipleChoice') {
        const labels = Object.keys(item.analysis.optionCounts).map(k => {
          const idx = parseInt(k, 10);
          return item.question.options?.[idx] ?? `الخيار ${idx + 1}`;
        });
        const data = Object.values(item.analysis.optionCounts);

        chartScripts += `
        (function() {
          const canvas = document.getElementById('chart-q-${index}');
          if (canvas && window.Chart) {
            const ctx = canvas.getContext('2d');
            new Chart(ctx, {
              type: 'bar',
              data: {
                labels: ${JSON.stringify(labels)},
                datasets: [{
                  label: 'عدد الإجابات',
                  data: ${JSON.stringify(data)},
                  backgroundColor: '${primaryColor}',
                  borderColor: '${primaryDark}',
                  borderWidth: 2,
                  borderRadius: 10
                }]
              },
              options: {
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                    rtl: true
                  },
                  title: {
                    display: false
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return 'عدد الإجابات: ' + context.parsed.y;
                      }
                    }
                  }
                },
                scales: {
                  x: {
                    ticks: { font: { size: 12 } }
                  },
                  y: {
                    beginAtZero: true,
                    ticks: {
                      precision: 0
                    }
                  }
                }
              }
            });
          }
        })();
        `;
      }
    });

    return chartScripts;
  };

  // HTML النهائي
  const generateHTMLReport = () => {
    const analysis = generateDetailedAnalysis();

    const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تقرير الاستبيان - ${survey.title}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #2c3e50;
      background: linear-gradient(135deg, #f8fbfa 0%, #e8f5f1 100%);
      padding: 20px;
    }
    .container {
      max-width: 1400px;
      margin: 0 auto;
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(128, 180, 158, 0.2);
      border: 2px solid #9ac9b5;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #80b49e 0%, #6a9a87 100%);
      color: white;
      padding: 40px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .header::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
      background-size: 20px 20px;
      animation: float 20s linear infinite;
    }
    @keyframes float {
      0% { transform: translate(0, 0) rotate(0deg); }
      100% { transform: translate(-20px, -20px) rotate(360deg); }
    }
    .header h1 {
      font-size: 2.6rem;
      margin-bottom: 15px;
      font-weight: bold;
      position: relative;
    }
    .header .subtitle {
      font-size: 1.2rem;
      opacity: 0.95;
      position: relative;
    }
    .survey-info {
      padding: 30px;
      background: #f8fbfa;
      border-bottom: 3px solid #9ac9b5;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    .info-item {
      background: linear-gradient(135deg, #ffffff 0%, #f8fbfa 100%);
      padding: 18px;
      border-radius: 15px;
      border: 2px solid #e8f5f1;
      box-shadow: 0 5px 20px rgba(128, 180, 158, 0.1);
    }
    .info-item strong {
      color: #6a9a87;
      display: block;
      margin-bottom: 8px;
      font-size: 1.05rem;
      border-bottom: 2px solid #e8f5f1;
      padding-bottom: 5px;
    }
    .stats-section {
      padding: 30px;
      background: white;
      border-bottom: 3px solid #9ac9b5;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    .stat-card {
      background: linear-gradient(135deg, #80b49e 0%, #6a9a87 100%);
      color: white;
      padding: 25px;
      border-radius: 15px;
      text-align: center;
      box-shadow: 0 10px 30px rgba(128, 180, 158, 0.3);
    }
    .stat-number {
      font-size: 2.4rem;
      font-weight: bold;
      margin-bottom: 8px;
    }
    .stat-label {
      font-size: 1.1rem;
      opacity: 0.95;
    }
    .summary-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 25px;
      border-radius: 15px;
      margin: 20px 30px;
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
    }
    .insight-item {
      background: white;
      color: #2c3e50;
      padding: 12px 15px;
      margin: 8px 0;
      border-radius: 10px;
      border-right: 4px solid #80b49e;
      font-size: 0.95rem;
    }
    .questions-section {
      padding: 30px;
    }
    .question-card {
      background: linear-gradient(135deg, #ffffff 0%, #f8fbfa 100%);
      border: 3px solid #9ac9b5;
      border-radius: 20px;
      padding: 25px;
      margin-bottom: 30px;
      box-shadow: 0 10px 40px rgba(128, 180, 158, 0.15);
    }
    .question-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 3px solid #e8f5f1;
      gap: 15px;
    }
    .question-number {
      background: linear-gradient(135deg, #80b49e 0%, #6a9a87 100%);
      color: white;
      width: 46px;
      height: 46px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 1.3rem;
    }
    .question-text {
      flex: 1;
      font-size: 1.2rem;
      font-weight: bold;
      color: #2c3e50;
      line-height: 1.5;
    }
    .question-type {
      background: #e8f5f1;
      color: #6a9a87;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: bold;
      font-size: 0.95rem;
      border: 2px solid #9ac9b5;
      white-space: nowrap;
    }
    .analysis-section {
      background: white;
      padding: 18px;
      border-radius: 15px;
      margin: 18px 0;
      border: 2px solid #e8f5f1;
    }
    .chart-container {
      background: white;
      padding: 18px;
      border-radius: 15px;
      margin: 18px 0;
      box-shadow: 0 5px 20px rgba(0,0,0,0.08);
      border: 2px solid #e8f5f1;
    }
    .chart-title {
      color: #6a9a87;
      font-size: 1.2rem;
      font-weight: bold;
      margin-bottom: 15px;
      text-align: center;
      border-bottom: 2px solid #e8f5f1;
      padding-bottom: 8px;
    }
    .progress-bar {
      background: #e0e0e0;
      border-radius: 10px;
      overflow: hidden;
      height: 20px;
      margin: 10px 0;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #80b49e, #6a9a87);
      border-radius: 10px;
    }
    .rating-stars {
      color: #ffc107;
      font-size: 1.3rem;
      margin: 5px 0;
    }
    .responses-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      background: white;
      border-radius: 15px;
      overflow: hidden;
    }
    .responses-table th {
      background: linear-gradient(135deg, #80b49e 0%, #6a9a87 100%);
      color: white;
      padding: 12px;
      text-align: right;
      font-weight: bold;
      font-size: 0.95rem;
    }
    .responses-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #f1f1f1;
      font-size: 0.95rem;
    }
    .responses-table tr:nth-child(even) {
      background: #f8fbfa;
    }
    .answer-badge {
      background: linear-gradient(135deg, #80b49e, #6a9a87);
      color: white;
      padding: 5px 10px;
      border-radius: 16px;
      font-size: 0.85rem;
      margin: 2px;
      display: inline-block;
    }
    .empty-state {
      text-align: center;
      padding: 50px;
      color: #6a9a87;
      font-size: 1.1rem;
      background: #f8fbfa;
      border-radius: 15px;
      margin: 20px 0;
      border: 2px dashed #9ac9b5;
    }
    .footer {
      text-align: center;
      padding: 20px;
      background: linear-gradient(135deg, #f8fbfa 0%, #e8f5f1 100%);
      color: #6a9a87;
      border-top: 3px solid #9ac9b5;
      margin-top: 30px;
      font-size: 0.95rem;
    }
    .details-block {
      border-radius: 12px;
      border: 1px dashed #9ac9b5;
      padding: 0;
    }
    .details-block > summary {
      cursor: pointer;
      padding: 10px 14px;
      font-weight: 600;
      color: #6a9a87;
      list-style: none;
    }
    .details-block > summary::-webkit-details-marker {
      display: none;
    }
    .details-block[open] > summary {
      border-bottom: 1px solid #e8f5f1;
      margin-bottom: 6px;
    }
    .details-block > summary::before {
      content: '▼';
      display: inline-block;
      margin-left: 8px;
      font-size: 0.8rem;
      transform: rotate(90deg);
      transition: transform 0.2s ease;
    }
    .details-block[open] > summary::before {
      transform: rotate(0deg);
    }
    .details-content {
      padding: 0 10px 10px 10px;
    }
    @media (max-width: 768px) {
      .header h1 { font-size: 2rem; }
      .info-grid { grid-template-columns: 1fr; }
      .stats-grid { grid-template-columns: 1fr; }
      .question-header { flex-direction: column; align-items: flex-start; }
      .question-text { text-align: right; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 التقرير الإحصائي المتقدم للاستبيان</h1>
      <div class="subtitle">تحليل مفصل وإحصائيات متقدمة - ${survey.title}</div>
    </div>

    <div class="survey-info">
      <h2 style="color: #6a9a87; margin-bottom: 15px; font-size: 1.5rem;">📋 معلومات الاستبيان</h2>
      <div class="info-grid">
        <div class="info-item">
          <strong>📝 العنوان:</strong>
          <span>${survey.title}</span>
        </div>
        <div class="info-item">
          <strong>📋 الوصف:</strong>
          <span>${survey.description || 'لا يوجد وصف'}</span>
        </div>
        <div class="info-item">
          <strong>📅 تاريخ البدء:</strong>
          <span>${survey.start_date ? new Date(survey.start_date).toLocaleDateString('ar-EG') : 'غير محدد'}</span>
        </div>
        <div class="info-item">
          <strong>⏰ تاريخ الانتهاء:</strong>
          <span>${survey.end_date ? new Date(survey.end_date).toLocaleDateString('ar-EG') : 'غير محدد'}</span>
        </div>
        <div class="info-item">
          <strong>👥 نوع الاستبيان:</strong>
          <span>${isExternal ? 'استبيان خارجي للعملاء / المتدربين' : 'استبيان داخلي للموظفين'}</span>
        </div>
        <div class="info-item">
          <strong>🕒 تاريخ التصدير:</strong>
          <span>${new Date().toLocaleDateString('ar-EG')} - ${new Date().toLocaleTimeString('ar-EG')}</span>
        </div>
      </div>
    </div>

    <div class="stats-section">
      <h2 style="color: #6a9a87; margin-bottom: 15px; font-size: 1.5rem;">📈 الإحصائيات العامة</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">${responses.length}</div>
          <div class="stat-label">إجمالي الردود</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${survey.questions?.length || 0}</div>
          <div class="stat-label">عدد الأسئلة</div>
        </div>
      </div>
    </div>

    <div class="summary-card">
      <h3 style="margin-bottom: 10px; font-size: 1.3rem;">🎯 ملخص سريع</h3>
      <div class="insight-item">
        <strong>أفضل سؤال من حيث التفاعل:</strong>
        <span> ${getMostEngagedQuestion()} </span>
      </div>
      <div class="insight-item">
        <strong>أكثر فترة زمنية فيها ردود:</strong>
        <span> ${getPeakResponseTime()} </span>
      </div>
    </div>

    <div class="questions-section">
      <h2 style="color: #6a9a87; margin-bottom: 20px; font-size: 1.5rem;">📊 التحليل التفصيلي للأسئلة</h2>
      ${
        responses.length === 0
          ? '<div class="empty-state">🚫 لا توجد ردود على هذا الاستبيان بعد</div>'
          : analysis
              .map((item, qIndex) => renderQuestionAnalysis(item, qIndex))
              .join('')
      }
    </div>

    <div class="footer">
      <p>تم إنشاء هذا التقرير تلقائياً من نظام إدارة الاستبيانات</p>
      <p>© ${new Date().getFullYear()} - جميع الحقوق محفوظة</p>
    </div>
  </div>

  <script>
    document.addEventListener('DOMContentLoaded', function() {
      ${generateChartsScript(analysis)}
    });
  </script>
</body>
</html>
    `;

    return htmlContent;
  };

  // التصدير كملف HTML
const exportReport = () => {
    const htmlContent = generateHTMLReport();
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `تقرير_${survey.title}_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return { exportReport };
};

export default SurveyReportExporter;

