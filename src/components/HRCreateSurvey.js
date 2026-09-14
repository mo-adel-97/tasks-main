import { hrChipSx, hrTabIconSx } from "./hrControlStyles";
import { navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from './NavigationShell';
import React, { useState, useEffect, useMemo } from 'react';
import SurveyReportExporter from './SurveyReportExporter';
import { DataGrid } from '@mui/x-data-grid';
import HRCreateExams from './HRCreateExams';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Quiz } from '@mui/icons-material';
import QRCode from 'qrcode';
import { getChart } from '../chartjs'; // عدّل المسار حسب مكان الملف
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  IconButton,
  Chip,
  Grid,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Fade,
  CircularProgress,
  OutlinedInput,
  FormControlLabel,
  Avatar,
  Badge,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider
} from '@mui/material';
import { 
  Add, 
  Delete, 
  Edit,
  ContentCopy,
  ArrowForward, 
  ArrowBack, 
  Close, 
  Search, 
  Groups, 
  Work, 
  Person, 
  Business,
  Visibility,
  Poll,
  History,
  EmojiEvents,
  ExpandMore,
  CheckCircle,
  RadioButtonChecked,
  Star,
  School,
  LocationOn,
  Download,
  QrCode2
} from '@mui/icons-material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';
import Swal from 'sweetalert2';


// الألوان الأساسية
const primaryColor = '#80b49e';
const primaryDark = '#6a9a87';
const primaryLight = '#9ac9b5';
const backgroundColor = '#f8fbfa';
const textColor = '#2c3e50';

const IMAGE_API_BASE_URL = 'https://filesregsiteration.sstli.com/erp/image_api.php';
const SURVEY_API_BASE_URL = 'https://filesregsiteration.sstli.com/erp/survey_api.php';

const steps = ['المعلومات الأساسية', 'تحديد المستلمين', 'الأسئلة', 'المراجعة'];
const externalSteps = ['المعلومات الأساسية', 'تحديد الفروع والدبلومات', 'الأسئلة', 'المراجعة'];

const jobTitles = [
  "رئيس الشركة",                 // 0
  "المدير التنفيذي",             // 1
  "المشرف العام",                // 2
  "مدير إدارة الدعم الفني",       // 3
  "مدير ادارة الحسابات",          // 4
  "مدير ادارة المبيعات",          // 5
  "مدير ادارة الموارد البشرية",   // 6
  "مدير اداري",                  // 7
  "مساعد اداري",                 // 8
  "مشرف فرع",                    // 9
  "مراجع حسابات",                // 10
  "اخصائي موارد بشرية",           // 11
  "مشرف فرع",                    // 12 - Legacy
  "مساعد مشرف",                  // 13
  "مدرب",                        // 14
  "مسئول تحصيل",                 // 15
  "استقبال",                     // 16
  "موظف خدمة عملاء",              // 17
  "موظف مبيعات"                  // 18
];

// SweetAlert2 configuration
const showSuccessAlert = (message) => {
  Swal.fire({
    title: 'نجاح!',
    text: message,
    icon: 'success',
    confirmButtonText: 'موافق',
    confirmButtonColor: primaryColor,
    background: backgroundColor,
    color: textColor,
    customClass: {
      popup: 'custom-swal-popup'
    }
  });
};

const showErrorAlert = (message) => {
  Swal.fire({
    title: 'خطأ!',
    text: message,
    icon: 'error',
    confirmButtonText: 'موافق',
    confirmButtonColor: '#d32f2f',
    background: backgroundColor,
    color: textColor
  });
};

const showLoadingAlert = () => {
  return Swal.fire({
    title: 'جاري المعالجة...',
    text: 'يرجى الانتظار',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });
};

// دالة لتصدير التقرير الإحصائي كملف HTML
const exportSurveyReport = (survey, responses, isExternal = false) => {
  // إنشاء محتوى HTML
  const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تقرير الاستبيان - ${survey.title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #2c3e50;
            background: linear-gradient(135deg, #f8fbfa 0%, #e8f5f1 100%);
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 15px 50px rgba(128, 180, 158, 0.15);
            border: 1px solid #9ac9b5;
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #80b49e 0%, #6a9a87 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            font-weight: bold;
        }
        .header .subtitle {
            font-size: 1.2rem;
            opacity: 0.9;
        }
        .survey-info {
            padding: 25px;
            background: #f8fbfa;
            border-bottom: 2px solid #9ac9b5;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 15px;
        }
        .info-item {
            background: white;
            padding: 15px;
            border-radius: 10px;
            border: 1px solid #9ac9b5;
        }
        .info-item strong {
            color: #6a9a87;
            display: block;
            margin-bottom: 5px;
            font-size: 1.1rem;
        }
        .stats-section {
            padding: 25px;
            border-bottom: 2px solid #9ac9b5;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .stat-card {
            background: linear-gradient(135deg, #80b49e 0%, #6a9a87 100%);
            color: white;
            padding: 25px;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 8px 25px rgba(128, 180, 158, 0.3);
        }
        .stat-number {
            font-size: 2.5rem;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .stat-label {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        .questions-section {
            padding: 25px;
        }
        .question-card {
            background: white;
            border: 2px solid #9ac9b5;
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 25px;
            box-shadow: 0 5px 20px rgba(128, 180, 158, 0.1);
        }
        .question-header {
            display: flex;
            justify-content: between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #f8fbfa;
        }
        .question-number {
            background: #80b49e;
            color: white;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 1.2rem;
        }
        .question-text {
            flex: 1;
            margin-right: 15px;
            font-size: 1.3rem;
            font-weight: bold;
            color: #2c3e50;
        }
        .question-type {
            background: #e8f5f1;
            color: #6a9a87;
            padding: 8px 15px;
            border-radius: 20px;
            font-weight: bold;
        }
        .responses-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 3px 15px rgba(0,0,0,0.1);
        }
        .responses-table th {
            background: linear-gradient(135deg, #80b49e 0%, #6a9a87 100%);
            color: white;
            padding: 15px;
            text-align: right;
            font-weight: bold;
            font-size: 1.1rem;
        }
        .responses-table td {
            padding: 12px 15px;
            border-bottom: 1px solid #e8f5f1;
        }
        .responses-table tr:nth-child(even) {
            background: #f8fbfa;
        }
        .responses-table tr:hover {
            background: #e8f5f1;
        }
        .answer-badge {
            background: #80b49e;
            color: white;
            padding: 5px 12px;
            border-radius: 15px;
            font-size: 0.9rem;
            display: inline-block;
            margin: 2px;
        }
        .rating-stars {
            color: #ffc107;
            font-size: 1.2rem;
        }
        .empty-state {
            text-align: center;
            padding: 40px;
            color: #6a9a87;
            font-size: 1.2rem;
        }
        .footer {
            text-align: center;
            padding: 20px;
            background: #f8fbfa;
            color: #6a9a87;
            border-top: 1px solid #9ac9b5;
            margin-top: 30px;
        }
        @media (max-width: 768px) {
            .header h1 { font-size: 2rem; }
            .info-grid { grid-template-columns: 1fr; }
            .stats-grid { grid-template-columns: 1fr; }
            .question-header { flex-direction: column; gap: 15px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 التقرير الإحصائي للاستبيان</h1>
            <div class="subtitle">${survey.title}</div>
        </div>
        
        <div class="survey-info">
            <h2 style="color: #6a9a87; margin-bottom: 15px;">معلومات الاستبيان</h2>
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
                    <span>${new Date(survey.start_date).toLocaleDateString('ar-EG')}</span>
                </div>
                <div class="info-item">
                    <strong>⏰ تاريخ الانتهاء:</strong>
                    <span>${new Date(survey.end_date).toLocaleDateString('ar-EG')}</span>
                </div>
                <div class="info-item">
                    <strong>👥 نوع الاستبيان:</strong>
                    <span>${isExternal ? 'استبيان خارجي للعملاء' : 'استبيان داخلي للموظفين'}</span>
                </div>
                <div class="info-item">
                    <strong>🕒 تاريخ التصدير:</strong>
                    <span>${new Date().toLocaleDateString('ar-EG')} - ${new Date().toLocaleTimeString('ar-EG')}</span>
                </div>
            </div>
        </div>
        
        <div class="stats-section">
            <h2 style="color: #6a9a87; margin-bottom: 15px;">الإحصائيات العامة</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">${responses.length}</div>
                    <div class="stat-label">إجمالي الردود</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${survey.questions?.length || 0}</div>
                    <div class="stat-label">عدد الأسئلة</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${Math.round(responses.length / (survey.target_users?.length || survey.target_branches?.length || 1) * 100)}%</div>
                    <div class="stat-label">نسبة المشاركة</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${survey.max_responses || '∞'}</div>
                    <div class="stat-label">الحد الأقصى</div>
                </div>
            </div>
        </div>
        
        <div class="questions-section">
            <h2 style="color: #6a9a87; margin-bottom: 25px;">الردود التفصيلية</h2>
            
            ${responses.length === 0 ? 
                '<div class="empty-state">🚫 لا توجد ردود على هذا الاستبيان بعد</div>' :
                survey.questions?.map((question, qIndex) => {
                    const questionResponses = responses.map(response => ({
                        respondent: isExternal ? response.student_name : response.employee_name,
                        answer: response.responses?.[qIndex] || 'لم يتم الإجابة',
                        date: response.submitted_at
                    }));
                    
                    return `
                    <div class="question-card">
                        <div class="question-header">
                            <div class="question-number">${qIndex + 1}</div>
                            <div class="question-text">${question.text}</div>
                            <div class="question-type">${getQuestionTypeText(question.type)}</div>
                        </div>
                        
                        <table class="responses-table">
                            <thead>
                                <tr>
                                    <th style="width: 30%;">${isExternal ? 'الطالب' : 'الموظف'}</th>
                                    <th style="width: 50%;">الإجابة</th>
                                    <th style="width: 20%;">التاريخ</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${questionResponses.map((response, rIndex) => `
                                    <tr>
                                        <td><strong>${response.respondent}</strong></td>
                                        <td>${formatAnswerForExport(question.type, response.answer, question.options)}</td>
                                        <td>${new Date(response.date).toLocaleDateString('ar-EG')}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        
                        ${question.type === 'radio' || question.type === 'checkbox' ? `
                            <div style="margin-top: 20px; padding: 15px; background: #f8fbfa; border-radius: 8px;">
                                <h4 style="color: #6a9a87; margin-bottom: 10px;">📈 تحليل الإجابات:</h4>
                                ${generateAnswerAnalysis(questionResponses, question.options, question.type)}
                            </div>
                        ` : ''}
                    </div>
                    `;
                }).join('')
            }
        </div>
        
        <div class="footer">
            <p>تم إنشاء هذا التقرير تلقائياً من نظام إدارة الاستبيانات</p>
            <p>© ${new Date().getFullYear()} - جميع الحقوق محفوظة</p>
        </div>
    </div>
</body>
</html>
`;

  // إنشاء ملف HTML وتنزيله
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `تقرير_الاستبيان_${survey.title}_${new Date().toISOString().split('T')[0]}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// دالة مساعدة للحصول على نص نوع السؤال
const getQuestionTypeText = (type) => {
  const types = {
    text: 'نص حر',
    radio: 'اختيار من متعدد',
    checkbox: 'اختيار متعدد',
    rating: 'تقييم (1-5)'
  };
  return types[type] || type;
};

// دالة مساعدة لتنسيق الإجابة للتصدير
const formatAnswerForExport = (type, answer, options) => {
  if (!answer && answer !== 0) return '<span style="color: #999; font-style: italic;">لم يتم الإجابة</span>';
  
  switch (type) {
    case 'text':
      return `<div style="background: #f8fbfa; padding: 8px 12px; border-radius: 6px; border-right: 3px solid #80b49e;">${answer}</div>`;
    
    case 'radio':
      const radioOption = options?.[parseInt(answer)];
      return `<span class="answer-badge">${radioOption || answer}</span>`;
    
    case 'checkbox':
      const selectedOptions = Array.isArray(answer) ? answer : [answer];
      return selectedOptions.map(opt => 
        `<span class="answer-badge">${options?.[parseInt(opt)] || opt}</span>`
      ).join('');
    
    case 'rating':
      const stars = '★'.repeat(answer) + '☆'.repeat(5 - answer);
      return `<span class="rating-stars">${stars}</span> <strong>(${answer}/5)</strong>`;
    
    default:
      return answer;
  }
};

// دالة لتحليل الإجابات وإظهار الإحصائيات
const generateAnswerAnalysis = (responses, options, type) => {
  const answerCounts = {};
  let totalAnswers = 0;

  responses.forEach(response => {
    if (type === 'checkbox') {
      // معالجة الإجابات المتعددة
      const answers = Array.isArray(response.answer) ? response.answer : [response.answer];
      answers.forEach(ans => {
        const optionText = options?.[parseInt(ans)] || ans;
        answerCounts[optionText] = (answerCounts[optionText] || 0) + 1;
        totalAnswers++;
      });
    } else {
      // معالجة الإجابات الفردية
      const optionText = options?.[parseInt(response.answer)] || response.answer;
      if (optionText && optionText !== 'لم يتم الإجابة') {
        answerCounts[optionText] = (answerCounts[optionText] || 0) + 1;
        totalAnswers++;
      }
    }
  });

  if (totalAnswers === 0) {
    return '<p style="color: #999;">لا توجد إجابات لتحليلها</p>';
  }

  return Object.entries(answerCounts)
    .map(([option, count]) => {
      const percentage = ((count / totalAnswers) * 100).toFixed(1);
      return `
        <div style="margin: 8px 0; display: flex; align-items: center; gap: 10px;">
          <div style="flex: 1;">
            <span style="font-weight: bold;">${option}</span>
          </div>
          <div style="width: 100px; background: #e0e0e0; border-radius: 10px; overflow: hidden;">
            <div style="width: ${percentage}%; background: linear-gradient(90deg, #80b49e, #6a9a87); height: 20px; border-radius: 10px;"></div>
          </div>
          <div style="width: 80px; text-align: left; font-weight: bold; color: #6a9a87;">
            ${count} (${percentage}%)
          </div>
        </div>
      `;
    })
    .join('');
};

const HRCreateSurvey = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedDept, setSelectedDept] = useState([]);
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCreateExternalDialog, setShowCreateExternalDialog] = useState(false);
  const [allSurveys, setAllSurveys] = useState([]);
  const [allExternalSurveys, setAllExternalSurveys] = useState([]);
  const [surveyResponses, setSurveyResponses] = useState({});
  const [externalSurveyResponses, setExternalSurveyResponses] = useState({});
  const [loadingSurveys, setLoadingSurveys] = useState(false);
  const [loadingExternalSurveys, setLoadingExternalSurveys] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedSurveyForDetails, setSelectedSurveyForDetails] = useState(null);
  const [showResponsesDialog, setShowResponsesDialog] = useState(false);
  const [branches, setBranches] = useState([]);
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [diplomas, setDiplomas] = useState([]);
  const [selectedDiplomas, setSelectedDiplomas] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingDiplomas, setLoadingDiplomas] = useState(false);
  const [responsesDialogOpen, setResponsesDialogOpen] = useState(false);
const [responsesDialogSurvey, setResponsesDialogSurvey] = useState(null); // { ...survey, isExternal }
const [selectedResponseRow, setSelectedResponseRow] = useState(null);     // response object
const [responsesSearch, setResponsesSearch] = useState('');
const [isTrainerSurvey, setIsTrainerSurvey] = useState(false);
const [selectedTrainers, setSelectedTrainers] = useState([]);
const [trainerSearchTerm, setTrainerSearchTerm] = useState('');
const [editingSurveyId, setEditingSurveyId] = useState(null);
const [editingExternalSurveyId, setEditingExternalSurveyId] = useState(null);
const [isEditMode, setIsEditMode] = useState(false);
const [isExternalEditMode, setIsExternalEditMode] = useState(false);
const computeGlobalInsights = (survey, responses) => {
  let ratingSum = 0;
  let ratingCount = 0;
  const choiceCounts = {};

  survey.questions.forEach((q, qi) => {
    if (q.type === 'rating') {
      responses.forEach(r => {
        const v = Number(r.responses?.[qi]);
        if (!isNaN(v)) {
          ratingSum += v;
          ratingCount++;
        }
      });
    }

    if (q.type === 'radio' || q.type === 'checkbox') {
      responses.forEach(r => {
        const ans = r.responses?.[qi];
        if (ans == null) return;

        const arr = Array.isArray(ans) ? ans : [ans];
        arr.forEach(a => {
          const label = q.options?.[parseInt(a)] ?? a;
          choiceCounts[label] = (choiceCounts[label] || 0) + 1;
        });
      });
    }
  });

  const topChoice = Object.entries(choiceCounts)
    .sort((a,b) => b[1]-a[1])[0];

  return {
    avgRating: ratingCount ? (ratingSum / ratingCount).toFixed(2) : null,
    topChoice: topChoice ? `${topChoice[0]} (${topChoice[1]})` : '—'
  };
};

function freeze(ws, row = 1, col = 0) {
  ws.views = [{ state: 'frozen', xSplit: col, ySplit: row, rightToLeft: true }];
}

function styleHeaderRow(ws, rowNum = 1) {
  const row = ws.getRow(rowNum);
  row.font = { bold: true };
  row.alignment = { vertical: 'middle', horizontal: 'center' };
  row.height = 22;

  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFEFEF' } };
    cell.border = {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' }
    };
  });
}

function zebraAndBorders(ws, startRow, endRow, startCol, endCol) {
  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      const cell = ws.getCell(r, c);
      cell.border = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' }
      };
      if (r % 2 === 0) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAFAFA' } };
      }
      cell.alignment = { vertical: 'middle', horizontal: 'right', wrapText: true };
    }
  }
}

function autoFitColumns(ws, min = 10, max = 60) {
  ws.columns.forEach(col => {
    let m = min;
    col.eachCell({ includeEmpty: true }, (cell) => {
      const v = cell.value;
      const len = v ? String(v).length : 0;
      m = Math.max(m, Math.min(max, len + 2));
    });
    col.width = m;
  });
}

// دالة لتحميل الملفات
const UPLOADS_PUBLIC_BASE = "https://filesregsiteration.sstli.com/erp/"; // علشان file_path = uploads/...

const handleDownloadFile = async (fileInfo) => {
  try {
    console.log("File info for download:", fileInfo);

    // 1) لو URL كامل
    if (typeof fileInfo === "string" && /^https?:\/\//i.test(fileInfo)) {
      window.open(fileInfo, "_blank");
      return;
    }

    // 2) لو string مسار uploads/...
    if (typeof fileInfo === "string") {
      const s = fileInfo.trim();

      if (s.includes("uploads/") || s.startsWith("uploads/")) {
        window.open(`${UPLOADS_PUBLIC_BASE}${s.replace(/^\/+/, "")}`, "_blank");
        return;
      }

      // لو string اسم ملف فقط (saved_name)
      window.open(`${UPLOADS_PUBLIC_BASE}uploads/${encodeURIComponent(s)}`, "_blank");
      return;
    }

    // 3) لو object (الحالة الأهم)
    if (fileInfo && typeof fileInfo === "object") {
      // أفضل حالة: file_path موجود
      if (fileInfo.file_path) {
        const p = String(fileInfo.file_path).replace(/^\/+/, "");
        window.open(`${UPLOADS_PUBLIC_BASE}${p}`, "_blank");
        return;
      }

      // saved_name موجود
      if (fileInfo.saved_name) {
        window.open(`${UPLOADS_PUBLIC_BASE}uploads/${encodeURIComponent(fileInfo.saved_name)}`, "_blank");
        return;
      }

      // file_name فقط (زي اللي طالع لك في الـ console)
      if (fileInfo.file_name) {
        // لو ده original name، مش هينفع نطلّع saved_name منه.
        // بس غالبًا الـ API عندك ساعات بيرجع file_name = saved_name
        window.open(`${UPLOADS_PUBLIC_BASE}uploads/${encodeURIComponent(fileInfo.file_name)}`, "_blank");
        return;
      }
    }

    console.error("Unknown file format:", fileInfo);
    showErrorAlert("تنسيق الملف غير معروف للتحميل");
  } catch (error) {
    console.error("Error downloading file:", error, fileInfo);
    showErrorAlert("حدث خطأ في تحميل الملف");
  }
};


// دالة مساعدة لتنسيق حجم الملف
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const handleExportExcel = async (surveyObj, isExternal = false) => {


  const survey = surveyObj;
  const responses = isExternal
    ? (externalSurveyResponses[survey.id] || [])
    : (surveyResponses[survey.id] || []);

  if (!responses.length) {
    showErrorAlert('لا توجد ردود لتصديرها');
    return;
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = 'SSTLI Survey Analytics';
  wb.created = new Date();

  const stats = buildQuestionStats(survey, responses);
  const insights = computeGlobalInsights(survey, responses);
const wsDash = wb.addWorksheet('Dashboard', { views: [{ rightToLeft: true }] });
wsDash.getCell('A1').value = `📊 Dashboard - ${survey.title}`;
wsDash.getCell('A1').font = { bold: true, size: 18 };
wsDash.mergeCells('A1', 'H1');

wsDash.addRow([]);
wsDash.addRow(['عدد الردود', responses.length, '', 'عدد الأسئلة', survey.questions.length, '', 'متوسط التقييم العام', insights.avgRating ?? '—']);
wsDash.addRow(['أكثر إجابة متكررة', insights.topChoice]);

zebraAndBorders(wsDash, 3, 4, 1, 8);
autoFitColumns(wsDash);
freeze(wsDash, 2, 0);

// Chart: Global Rating Distribution
const allRatings = [];
survey.questions.forEach((q, qi) => {
  if (q.type === 'rating') {
    responses.forEach(r => {
      const v = Number(r.responses?.[qi]);
      if (!isNaN(v)) allRatings.push(v);
    });
  }
});
if (allRatings.length) {
  const dist = ratingDistribution(allRatings);
  const png = await chartToPngBase64({
    labels: ['1','2','3','4','5'],
    values: [dist[1],dist[2],dist[3],dist[4],dist[5]],
    type: 'bar',
    title: 'توزيع التقييم العام (1-5)',
    horizontal: true
  });
  const img = wb.addImage({ base64: png, extension: 'png' });
  wsDash.addImage(img, { tl: { col: 0, row: 6 }, ext: { width: 1000, height: 420 } });
}

  /* =======================
     Sheet 1: Executive Summary
  ======================= */
  const wsSummary = wb.addWorksheet('Executive Summary', { views: [{ rightToLeft: true }] });
  wsSummary.columns = [
    { header: 'المؤشر', key: 'k', width: 40 },
    { header: 'القيمة', key: 'v', width: 30 }
  ];

  wsSummary.addRows([
    { k: 'عنوان الاستبيان', v: survey.title },
    { k: 'نوع الاستبيان', v: isExternal ? 'خارجي' : 'داخلي' },
    { k: 'عدد الردود', v: responses.length },
    { k: 'عدد الأسئلة', v: survey.questions.length },
    { k: 'متوسط التقييم العام', v: insights.avgRating ?? '—' },
    { k: 'أكثر إجابة متكررة', v: insights.topChoice },
    { k: 'تاريخ التصدير', v: new Date().toLocaleString('ar-EG') }
  ]);

  wsSummary.getRow(1).font = { bold: true };

  /* =======================
     Sheet 2: Analytics Table
  ======================= */
  const wsAnalytics = wb.addWorksheet('Question Analytics', { views: [{ rightToLeft: true }] });
 wsAnalytics.columns = [
  { header: '#', key: 'i', width: 5 },
  { header: 'السؤال', key: 'q', width: 60 },
  { header: 'النوع', key: 't', width: 16 },
  { header: 'عدد الإجابات', key: 'c', width: 14 },
  { header: 'Avg', key: 'a', width: 10 },
  { header: 'Median', key: 'm2', width: 10 },
  { header: 'رضا % (4-5)', key: 'sat', width: 14 },
  { header: 'Top Answer', key: 'top', width: 30 },
  { header: 'Top %', key: 'topPct', width: 10 },
];
styleHeaderRow(wsAnalytics, 1);
freeze(wsAnalytics, 1, 0);

  wsAnalytics.getRow(1).font = { bold: true };

stats.forEach(s => {
  const top = s.dist ? Object.entries(s.dist).sort((a,b)=>b[1]-a[1])[0] : null;
  const topPct = top && s.total ? ((top[1] / s.total) * 100).toFixed(1) + '%' : '';

  wsAnalytics.addRow({
    i: s.index,
    q: s.text,
    t: getQuestionTypeText(s.type),
    c: s.total,
    a: s.avg ?? '',
    m2: s.med ?? '',
    sat: s.satPct ?? '',
    top: top?.[0] ?? '',
    topPct
  });
});

autoFitColumns(wsAnalytics);
zebraAndBorders(wsAnalytics, 2, wsAnalytics.rowCount, 1, wsAnalytics.columnCount);


  /* =======================
     Charts Section
  ======================= */
let rowCursor = stats.length + 4;

for (const s of stats) {

  // ✅ توزيع التقييم
  if (s.distRating) {
    const png = await chartToPngBase64({
      labels: ['1','2','3','4','5'],
      values: [s.distRating[1], s.distRating[2], s.distRating[3], s.distRating[4], s.distRating[5]],
      type: 'bar',
      title: `Q${s.index} - توزيع التقييم`,
      horizontal: true
    });

    const img = wb.addImage({ base64: png, extension: 'png' });
    wsAnalytics.addImage(img, {
      tl: { col: 0, row: rowCursor },
      ext: { width: 950, height: 380 }
    });

    rowCursor += 22;
  }

  // ✅ توزيع إجابات radio/checkbox
  if (s.dist) {
    const labels = Object.keys(s.dist);
    const values = Object.values(s.dist);

    const png = await chartToPngBase64({
      labels,
      values,
      type: 'bar',
      doughnut: labels.length <= 6,
      title: `Q${s.index} - توزيع الإجابات`,
      horizontal: labels.length > 6
    });

    const img = wb.addImage({ base64: png, extension: 'png' });
    wsAnalytics.addImage(img, {
      tl: { col: 0, row: rowCursor },
      ext: { width: 950, height: 420 }
    });

    rowCursor += 24;
  }
}


  /* =======================
     Sheet 3: Raw Responses
  ======================= */
  const wsRaw = wb.addWorksheet('Raw Responses', { views: [{ rightToLeft: true }] });

  const baseCols = isExternal
    ? ['student_name', 'branch_name', 'diplom_name', 'submitted_at']
    : ['employee_name', 'department', 'submitted_at'];

  wsRaw.columns = [
    ...baseCols.map(c => ({ header: c, key: c, width: 22 })),
    ...survey.questions.map((_, i) => ({ header: `Q${i+1}`, key: `q${i}`, width: 30 }))
  ];

  responses.forEach(r => {
    const row = {};
    baseCols.forEach(c => row[c] = r[c] ?? '');
    survey.questions.forEach((q, i) => {
      const ans = r.responses?.[i];
      row[`q${i}`] =
        q.type === 'radio'
          ? q.options?.[parseInt(ans)] ?? ans
          : q.type === 'checkbox'
            ? (Array.isArray(ans) ? ans.map(x=>q.options?.[x]).join(' | ') : '')
            : ans ?? '';
    });
    wsRaw.addRow(row);
  });

styleHeaderRow(wsRaw, 1);
freeze(wsRaw, 1, 0);
autoFitColumns(wsRaw, 12, 55);
zebraAndBorders(wsRaw, 2, wsRaw.rowCount, 1, wsRaw.columnCount);

  /* =======================
     Save
  ======================= */
  const buf = await wb.xlsx.writeBuffer();
  saveAs(
    new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `Survey_Analytics_${survey.title}_${new Date().toISOString().split('T')[0]}.xlsx`
  );

  showSuccessAlert('تم تصدير تقرير Excel تحليلي متكامل بالرسومات بنجاح');
};


  const [survey, setSurvey] = useState({
    title: '',
    description: '',
    start_date: null,
    end_date: null,
    max_responses: '',
    target_departments: [],
    target_jobs: [],
    target_users: [],
    assigned_by: '',
    created_by_guid: '',
    questions: [{ text: '', type: 'text', options: [''] }]
  });

const [externalSurvey, setExternalSurvey] = useState({
  title: '',
  description: '',
  start_date: null,
  end_date: null,
  max_responses: '',
  target_branches: [],
  target_diplomas: [],
  is_trainer_survey: false,
  target_trainers: [],
  assigned_by: '',
  created_by_guid: '',
  questions: [{ text: '', type: 'text', options: [''] }]
});

  // جلب البيانات من الـ APIs
  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      // جلب الأقسام
      setLoadingDepts(true);
      const deptResponse = await fetch("https://api3.sstli.com/api/Department/Load");
      const deptData = await deptResponse.json();
      const filteredDepartments = deptData.filter(
        dept => dept.departName !== "الإدارة التنفيذية"
      );
      setDepartments(filteredDepartments);

      // جلب المستخدمين
      setLoadingUsers(true);
      const userResponse = await fetch("https://api1.sstli.com/api/userinfo");
      const userData = await userResponse.json();
      setUsers(userData);

      // جلب بيانات المستخدم الحالي
      const userDataFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
 setSurvey(prev => ({
  ...prev,
  assigned_by: userDataFromStorage.userName || '',
  created_by_guid: userDataFromStorage.guid || ''
}));

setExternalSurvey(prev => ({
  ...prev,
  assigned_by: userDataFromStorage.userName || '',
  created_by_guid: userDataFromStorage.guid || ''
}));

      // جلب جميع الاستبيانات
      await fetchAllSurveys();
      await fetchAllExternalSurveys();
      await fetchBranches();

    } catch (error) {
      console.error('Error initializing data:', error);
      showErrorAlert('حدث خطأ في تحميل البيانات الأساسية');
    } finally {
      setLoadingDepts(false);
      setLoadingUsers(false);
    }
  };

  // جلب جميع الاستبيانات الداخلية
  const fetchAllSurveys = async () => {
    try {
      setLoadingSurveys(true);
      const response = await axios.get(`${SURVEY_API_BASE_URL}?endpoint=active_surveys`);
      
      if (response.data && Array.isArray(response.data)) {
        setAllSurveys(response.data);
        
        // جلب الردود لكل استبيان
        for (const survey of response.data) {
          await fetchSurveyResponses(survey.id);
        }
      } else {
        console.error('Invalid response format for surveys:', response.data);
        setAllSurveys([]);
      }
    } catch (error) {
      console.error('Error fetching surveys:', error);
      showErrorAlert('فشل في جلب الاستبيانات الداخلية');
      setAllSurveys([]);
    } finally {
      setLoadingSurveys(false);
    }
  };

  // جلب جميع الاستبيانات الخارجية
  const fetchAllExternalSurveys = async () => {
    try {
      setLoadingExternalSurveys(true);
      const response = await axios.get(`${SURVEY_API_BASE_URL}?endpoint=active_external_surveys`);
      
      if (response.data && Array.isArray(response.data)) {
        setAllExternalSurveys(response.data);
        
        // جلب الردود لكل استبيان خارجي
        for (const survey of response.data) {
          await fetchExternalSurveyResponses(survey.id);
        }
      } else {
        console.error('Invalid response format for external surveys:', response.data);
        setAllExternalSurveys([]);
      }
    } catch (error) {
      console.error('Error fetching external surveys:', error);
      showErrorAlert('فشل في جلب الاستبيانات الخارجية');
      setAllExternalSurveys([]);
    } finally {
      setLoadingExternalSurveys(false);
    }
  };

  // جلب الفروع
  const fetchBranches = async () => {
    try {
      setLoadingBranches(true);
      const response = await axios.get(`${SURVEY_API_BASE_URL}?endpoint=branches`);
      if (response.data && Array.isArray(response.data)) {
        setBranches(response.data);
      } else {
        setBranches([]);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
      setBranches([]);
    } finally {
      setLoadingBranches(false);
    }
  };

  // جلب الدبلومات بناءً على الفروع المختارة
  useEffect(() => {
    if (selectedBranches.length > 0) {
      fetchDiplomasForBranches();
    } else {
      setDiplomas([]);
      setSelectedDiplomas([]);
    }
  }, [selectedBranches]);

  const fetchDiplomasForBranches = async () => {
    try {
      setLoadingDiplomas(true);
      const allDiplomas = new Set();
      
      for (const branchGuid of selectedBranches) {
        const response = await axios.get(`${SURVEY_API_BASE_URL}?endpoint=branch_diplomas&branch_guid=${branchGuid}`);
        if (response.data && Array.isArray(response.data)) {
          response.data.forEach(diploma => allDiplomas.add(diploma));
        }
      }
      
      setDiplomas(Array.from(allDiplomas));
    } catch (error) {
      console.error('Error fetching diplomas:', error);
    } finally {
      setLoadingDiplomas(false);
    }
  };

  // جلب الردود لاستبيان معين
const fetchSurveyResponses = async (surveyId) => {
  try {
    const response = await axios.get(`${SURVEY_API_BASE_URL}?endpoint=survey_responses&survey_id=${surveyId}`);
    
    const enhancedResponses = response.data.map(res => {
      // معالجة file_responses لو كانت JSON
      let fileResponses = {};
      try {
        if (res.file_responses && typeof res.file_responses === 'string') {
          fileResponses = JSON.parse(res.file_responses);
        } else if (res.file_responses && typeof res.file_responses === 'object') {
          fileResponses = res.file_responses;
        }
      } catch (e) {
        console.warn('Error parsing file_responses:', e);
      }
      
      const user = users.find(u => {
        const responseName = res.employee_name?.trim().toLowerCase();
        const userName = u.fullName?.trim().toLowerCase();
        return userName === responseName;
      });
      
      // دمج الردود مع ملفات
      const mergedResponses = res.responses?.map((response, index) => {
        const hasFileResponse = fileResponses[`question_${index}`] || 
                               fileResponses[index] || 
                               fileResponses[`q${index}`];
        
        if (hasFileResponse) {
          return hasFileResponse; // راجع إذا كان فيه response نصي برضه
        }
        return response;
      }) || [];
      
      return {
        ...res,
        employee_guid: user?.guid || null,
        file_responses: fileResponses,
        responses: mergedResponses
      };
    });
    
    setSurveyResponses(prev => ({
      ...prev,
      [surveyId]: enhancedResponses
    }));
  } catch (error) {
    console.error('Error fetching responses:', error);
  }
};

  // جلب الردود لاستبيان خارجي معين
const fetchExternalSurveyResponses = async (surveyId) => {
  try {
    const response = await axios.get(
      `${SURVEY_API_BASE_URL}?endpoint=external_survey_responses&survey_id=${surveyId}`
    );

    const enhancedResponses = (response.data || []).map((res) => {
      // 1) parse file_responses (string JSON -> object)
      let fileResponses = {};
      try {
        if (res.file_responses && typeof res.file_responses === "string") {
          fileResponses = JSON.parse(res.file_responses);
        } else if (res.file_responses && typeof res.file_responses === "object") {
          fileResponses = res.file_responses;
        }
      } catch (e) {
        console.warn("Error parsing external file_responses:", e);
      }

      // 2) merge into responses array
      const mergedResponses =
        (res.responses || []).map((ans, index) => {
          const fr =
            fileResponses?.[`question_${index}`] ||
            fileResponses?.[index] ||
            fileResponses?.[`q${index}`];

          // لو في ملف لهذا السؤال، خلّي الإجابة هي object الملف (اللي فيه saved_name/file_path)
          return fr ? fr : ans;
        }) || [];

      return {
        ...res,
        file_responses: fileResponses,
        responses: mergedResponses,
      };
    });

    setExternalSurveyResponses((prev) => ({
      ...prev,
      [surveyId]: enhancedResponses,
    }));
  } catch (error) {
    console.error("Error fetching external responses:", error);
  }
};


  // دالة لتصدير التقرير الإحصائي
  const handleExportReport = (survey, isExternal = false) => {
  const responses = isExternal 
    ? externalSurveyResponses[survey.id] || []
    : surveyResponses[survey.id] || [];
  
  if (responses.length === 0) {
    showErrorAlert('لا توجد ردود لتصديرها لهذا الاستبيان');
    return;
  }

  // استخدام الكومبوننت الجديد
  const exporter = SurveyReportExporter({ survey, responses, isExternal });
  exporter.exportReport();
  
  showSuccessAlert('تم تصدير التقرير الإحصائي المتقدم بنجاح!');
};

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // فانكشن لتوليد لينك الاستبيان الخارجي
const generateSurveyLink = (survey, trainer = null) => {
  const baseUrl = 'https://surveys.sstli.com';

  const params = new URLSearchParams();

  params.append('survey_id', survey.id);

  if (trainer?.trainerGuid) {
    params.append('trainer_guid', trainer.trainerGuid);
    params.append('trainer_name', trainer.fullName || trainer.userName || '');
  }

  if (survey.target_branches && survey.target_branches.length > 0) {
    survey.target_branches.forEach((branchGuid) => {
      params.append('branches', branchGuid);
    });
  }

  if (
    survey.target_diplomas &&
    survey.target_diplomas.length > 0 &&
    !survey.target_diplomas.includes('all')
  ) {
    survey.target_diplomas.forEach((diploma) => {
      params.append('diplomas', diploma);
    });
  }

  return `${baseUrl}?${params.toString()}`;
};

const getSurveyTrainers = (survey) => {
  if (!survey?.is_trainer_survey) return [];

  let targetTrainers = survey.target_trainers || [];

  if (typeof targetTrainers === 'string') {
    try {
      targetTrainers = JSON.parse(targetTrainers);
    } catch {
      targetTrainers = [];
    }
  }

  if (!Array.isArray(targetTrainers)) return [];

  return targetTrainers
    .map((trainerGuid) => {
      const trainer = users.find(
        (u) =>
          String(u.trainerGuid || '').toLowerCase() ===
          String(trainerGuid || '').toLowerCase()
      );

      return trainer
        ? {
            trainerGuid: trainer.trainerGuid,
            fullName: trainer.fullName,
            userName: trainer.userName
          }
        : {
            trainerGuid,
            fullName: trainerGuid,
            userName: ''
          };
    })
    .filter((trainer) => trainer.trainerGuid);
};

const exportSurveyQrCode = async (link, title = 'استبيان', subTitle = '') => {
  try {
    const qrData = await QRCode.toDataURL(link, {
      width: 520,
      margin: 2,
      errorCorrectionLevel: 'H'
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = 900;
    canvas.height = 1150;

    // الخلفية
    ctx.fillStyle = '#f8fbfa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // الهيدر
    const gradient = ctx.createLinearGradient(0, 0, 900, 240);
    gradient.addColorStop(0, '#80b49e');
    gradient.addColorStop(1, '#6a9a87');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 900, 240);

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';

    ctx.font = 'bold 34px Arial';
    ctx.fillText('المعهد السعودي المتخصص العالي للتدريب', 450, 75);

    ctx.font = 'bold 30px Arial';
    ctx.fillText('QR Code - استبيان', 450, 135);

    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(300, 175);
    ctx.lineTo(600, 175);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // العنوان
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 30px Arial';
    ctx.fillText(title || 'استبيان', 450, 315);

    if (subTitle) {
      ctx.fillStyle = '#6a9a87';
      ctx.font = 'bold 24px Arial';
      ctx.fillText(subTitle, 450, 360);
    }

    // كارت QR
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.12)';
    ctx.shadowBlur = 22;
    ctx.shadowOffsetY = 8;
    ctx.fillRect(180, 420, 540, 540);

    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = '#9ac9b5';
    ctx.lineWidth = 4;
    ctx.strokeRect(180, 420, 540, 540);

    const img = new Image();
    img.src = qrData;

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    ctx.drawImage(img, 210, 450, 480, 480);

    // النص تحت QR
    ctx.fillStyle = '#60756e';
    ctx.font = '22px Arial';
    ctx.fillText('امسح الكود للدخول إلى الاستبيان', 450, 1015);

    ctx.fillStyle = '#555';
    ctx.font = '15px Arial';

    const shortLink = link.length > 90 ? `${link.substring(0, 90)}...` : link;
    ctx.fillText(shortLink, 450, 1060);

    const finalImage = canvas.toDataURL('image/png');

    const a = document.createElement('a');
    a.href = finalImage;
    a.download = `survey-${title}-${subTitle || 'link'}-qrcode.png`
      .replace(/[\\/:*?"<>|]/g, '-');

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    showSuccessAlert('تم تصدير QR Code بنجاح');
  } catch (error) {
    console.error(error);
    showErrorAlert('فشل تصدير QR Code');
  }
};
  // فانكشن نسخ اللينك
  const copySurveyLink = (link) => {
    navigator.clipboard.writeText(link).then(() => {
      showSuccessAlert('تم نسخ لينك الاستبيان بنجاح!');
    }).catch(err => {
      console.error('Failed to copy link: ', err);
      showErrorAlert('حدث خطأ في نسخ اللينك');
    });
  };

  // فلترة المستخدمين بناءً على الأقسام والوظائف المختارة
  const filteredUsers = useMemo(() => {
    if (!Array.isArray(users) || users.length === 0) return [];
    if (!Array.isArray(selectedDept) || selectedDept.length === 0) return [];
    
    let result = users.filter(u => selectedDept.includes(u.departGuid));
    
    if (selectedJobs.length > 0 && !selectedJobs.includes("all")) {
      result = result.filter(u => selectedJobs.includes(u.userJop));
    }
    
    if (searchTerm.trim() !== "") {
      const term = searchTerm.trim().toLowerCase();
      result = result.filter(u => {
        const userName = (u.fullName || "").toString().toLowerCase();
        const userJob = (jobTitles[u.userJop] || "").toString().toLowerCase();
        return userName.includes(term) || userJob.includes(term);
      });
    }
    
    return result.sort((a, b) => {
      const nameA = (a.fullName || "").toString().toLowerCase();
      const nameB = (b.fullName || "").toString().toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [users, selectedDept, selectedJobs, searchTerm]);

  const trainersForSelectedBranches = useMemo(() => {
  if (!Array.isArray(users) || users.length === 0) return [];
  if (!Array.isArray(selectedBranches) || selectedBranches.length === 0) return [];

  const selectedBranchSet = new Set(
    selectedBranches.map((b) => String(b).toLowerCase())
  );

  let result = users.filter((u) => {
    const branchForWork = String(u.branchForWork || '').toLowerCase();

    return (
      u.chkTrainer === true &&
      u.trainerGuid &&
      selectedBranchSet.has(branchForWork)
    );
  });

  if (trainerSearchTerm.trim()) {
    const term = trainerSearchTerm.trim().toLowerCase();

    result = result.filter((u) =>
      `${u.fullName || ''} ${u.userName || ''}`.toLowerCase().includes(term)
    );
  }

  return result.sort((a, b) =>
    String(a.fullName || a.userName || '').localeCompare(
      String(b.fullName || b.userName || ''),
      'ar'
    )
  );
}, [users, selectedBranches, trainerSearchTerm]);
  const filteredJobs = useMemo(() => {
    if (!Array.isArray(users) || users.length === 0) return [];
    if (!Array.isArray(selectedDept) || selectedDept.length === 0) return [];
    
    const deptUsers = users.filter(u => selectedDept.includes(u.departGuid));
    const uniqueJobs = [...new Set(deptUsers.map(u => u.userJop))];
    
    return uniqueJobs
      .filter(j => typeof j === 'number' && j >= 0 && j < jobTitles.length)
      .sort((a, b) => a - b);
  }, [users, selectedDept]);

  // تحديث بيانات الاستبيان عند تغيير المستلمين
  useEffect(() => {
    setSurvey(prev => ({
      ...prev,
      target_departments: selectedDept,
      target_jobs: selectedJobs,
      target_users: selectedUsers
    }));
  }, [selectedDept, selectedJobs, selectedUsers]);

  // تحديث بيانات الاستبيان الخارجي عند تغيير الفروع والدبلومات
useEffect(() => {
  setExternalSurvey(prev => ({
    ...prev,
    target_branches: selectedBranches,
    target_diplomas: selectedDiplomas,
    is_trainer_survey: isTrainerSurvey,
    target_trainers: selectedTrainers
  }));
}, [selectedBranches, selectedDiplomas, isTrainerSurvey, selectedTrainers]);
useEffect(() => {
  if (!selectedBranches.length) {
    setSelectedTrainers([]);
    return;
  }

  const selectedBranchSet = new Set(
    selectedBranches.map((b) => String(b).toLowerCase())
  );

  setSelectedTrainers((prev) =>
    prev.filter((trainerGuid) => {
      const trainer = users.find(
        (u) =>
          String(u.trainerGuid || '').toLowerCase() ===
          String(trainerGuid || '').toLowerCase()
      );

      return trainer && selectedBranchSet.has(String(trainer.branchForWork || '').toLowerCase());
    })
  );
}, [selectedBranches, users]);
  // دوال إدارة الأسئلة
  const addQuestion = (isExternal = false) => {
    if (isExternal) {
      setExternalSurvey(prev => ({
        ...prev,
        questions: [...prev.questions, { text: '', type: 'text', options: [''] }]
      }));
    } else {
      setSurvey(prev => ({
        ...prev,
        questions: [...prev.questions, { text: '', type: 'text', options: [''] }]
      }));
    }
  };

  const removeQuestion = (index, isExternal = false) => {
    if (isExternal) {
      setExternalSurvey(prev => ({
        ...prev,
        questions: prev.questions.filter((_, i) => i !== index)
      }));
    } else {
      setSurvey(prev => ({
        ...prev,
        questions: prev.questions.filter((_, i) => i !== index)
      }));
    }
  };

  const updateQuestion = (index, field, value, isExternal = false) => {
    if (isExternal) {
      const updatedQuestions = [...externalSurvey.questions];
      updatedQuestions[index][field] = value;
      
      if (field === 'type' && (value === 'text' || value === 'rating')) {
        updatedQuestions[index].options = [''];
      }
      
      setExternalSurvey(prev => ({ ...prev, questions: updatedQuestions }));
    } else {
      const updatedQuestions = [...survey.questions];
      updatedQuestions[index][field] = value;
      
      if (field === 'type' && (value === 'text' || value === 'rating')) {
        updatedQuestions[index].options = [''];
      }
      
      setSurvey(prev => ({ ...prev, questions: updatedQuestions }));
    }
  };

  const addOption = (questionIndex, isExternal = false) => {
    if (isExternal) {
      const updatedQuestions = [...externalSurvey.questions];
      updatedQuestions[questionIndex].options.push('');
      setExternalSurvey(prev => ({ ...prev, questions: updatedQuestions }));
    } else {
      const updatedQuestions = [...survey.questions];
      updatedQuestions[questionIndex].options.push('');
      setSurvey(prev => ({ ...prev, questions: updatedQuestions }));
    }
  };

  const updateOption = (questionIndex, optionIndex, value, isExternal = false) => {
    if (isExternal) {
      const updatedQuestions = [...externalSurvey.questions];
      updatedQuestions[questionIndex].options[optionIndex] = value;
      setExternalSurvey(prev => ({ ...prev, questions: updatedQuestions }));
    } else {
      const updatedQuestions = [...survey.questions];
      updatedQuestions[questionIndex].options[optionIndex] = value;
      setSurvey(prev => ({ ...prev, questions: updatedQuestions }));
    }
  };

  const removeOption = (questionIndex, optionIndex, isExternal = false) => {
    if (isExternal) {
      const updatedQuestions = [...externalSurvey.questions];
      updatedQuestions[questionIndex].options = updatedQuestions[questionIndex].options.filter((_, i) => i !== optionIndex);
      setExternalSurvey(prev => ({ ...prev, questions: updatedQuestions }));
    } else {
      const updatedQuestions = [...survey.questions];
      updatedQuestions[questionIndex].options = updatedQuestions[questionIndex].options.filter((_, i) => i !== optionIndex);
      setSurvey(prev => ({ ...prev, questions: updatedQuestions }));
    }
  };

  const safeJsonArray = (value, fallback = []) => {
  if (Array.isArray(value)) return value;

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      if (value.trim() === '') return fallback;
      return value.includes(',') ? value.split(',').map(x => x.trim()) : fallback;
    }
  }

  return fallback;
};

const parseDateForPicker = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const normalizeSurveyPayload = (obj) => ({
  ...obj,
  max_responses: obj.max_responses === '' ? null : obj.max_responses,
  start_date: obj.start_date ? new Date(obj.start_date).toISOString() : null,
  end_date: obj.end_date ? new Date(obj.end_date).toISOString() : null,
  questions: Array.isArray(obj.questions) ? obj.questions : safeJsonArray(obj.questions, [])
});


 const handleSubmit = async (isExternal = false) => {
  const loadingAlert = showLoadingAlert();

  try {
    if (isExternal) {
      const formattedData = normalizeSurveyPayload(externalSurvey);

      const url = isExternalEditMode
        ? `${SURVEY_API_BASE_URL}/update_external_survey`
        : `${SURVEY_API_BASE_URL}/create_external_survey`;

      const payload = isExternalEditMode
        ? { ...formattedData, id: editingExternalSurveyId }
        : formattedData;

      const response = await axios.post(url, payload);

      loadingAlert.close();

      if (response.data.success) {
        showSuccessAlert(
          isExternalEditMode
            ? 'تم تعديل الاستبيان الخارجي بنجاح!'
            : 'تم إنشاء الاستبيان الخارجي بنجاح!'
        );

        resetExternalForm();
        setShowCreateExternalDialog(false);
        setIsExternalEditMode(false);
        setEditingExternalSurveyId(null);
        fetchAllExternalSurveys();
      } else {
        showErrorAlert(response.data.message || 'فشل في حفظ الاستبيان');
      }

      return;
    }

    const formattedData = normalizeSurveyPayload(survey);

    const url = isEditMode
      ? `${SURVEY_API_BASE_URL}/update_survey`
      : `${SURVEY_API_BASE_URL}/create_survey`;

    const payload = isEditMode
      ? { ...formattedData, id: editingSurveyId }
      : formattedData;

    const response = await axios.post(url, payload);

    loadingAlert.close();

    if (response.data.success) {
      showSuccessAlert(
        isEditMode
          ? 'تم تعديل الاستبيان الداخلي بنجاح!'
          : 'تم إنشاء الاستبيان الداخلي بنجاح!'
      );

      resetForm();
      setShowCreateDialog(false);
      setIsEditMode(false);
      setEditingSurveyId(null);
      fetchAllSurveys();
    } else {
      showErrorAlert(response.data.message || 'فشل في حفظ الاستبيان');
    }
  } catch (error) {
    loadingAlert.close();
    console.error(error);
    showErrorAlert('حدث خطأ أثناء حفظ الاستبيان');
  }
};

const resetForm = () => {
  const userDataFromStorage = JSON.parse(localStorage.getItem('user') || '{}');

  setSurvey({
    title: '',
    description: '',
    start_date: null,
    end_date: null,
    max_responses: '',
    target_departments: [],
    target_jobs: [],
    target_users: [],
    assigned_by: userDataFromStorage.userName || '',
    created_by_guid: userDataFromStorage.guid || '',
    questions: [{ text: '', type: 'text', options: [''] }]
  });

  setSelectedDept([]);
  setSelectedJobs([]);
  setSelectedUsers([]);
  setEditingSurveyId(null);
  setIsEditMode(false);
  setActiveStep(0);
};

const resetExternalForm = () => {
  const userDataFromStorage = JSON.parse(localStorage.getItem('user') || '{}');

  setExternalSurvey({
    title: '',
    description: '',
    start_date: null,
    end_date: null,
    max_responses: '',
    target_branches: [],
    target_diplomas: [],
    is_trainer_survey: false,
    target_trainers: [],
    assigned_by: userDataFromStorage.userName || '',
    created_by_guid: userDataFromStorage.guid || '',
    questions: [{ text: '', type: 'text', options: [''] }]
  });

  setSelectedBranches([]);
  setSelectedDiplomas([]);
  setIsTrainerSurvey(false);
  setSelectedTrainers([]);
  setTrainerSearchTerm('');
  setEditingExternalSurveyId(null);
  setIsExternalEditMode(false);
  setActiveStep(0);
};

  const handleOpenCreateDialog = () => {
    resetForm();
    setShowCreateDialog(true);
  };

  const handleOpenCreateExternalDialog = () => {
    resetExternalForm();
    setShowCreateExternalDialog(true);
  };

  const handleCloseCreateDialog = () => {
    setShowCreateDialog(false);
    resetForm();
  };

  const handleCloseCreateExternalDialog = () => {
    setShowCreateExternalDialog(false);
    resetExternalForm();
  };
const handleEditSurvey = (row) => {
  const targetDepartments = safeJsonArray(row.target_departments);
  const targetJobs = safeJsonArray(row.target_jobs);
  const targetUsers = safeJsonArray(row.target_users);
  const questions = safeJsonArray(row.questions, [{ text: '', type: 'text', options: [''] }]);

  setSurvey({
    title: row.title || '',
    description: row.description || '',
    start_date: parseDateForPicker(row.start_date),
    end_date: parseDateForPicker(row.end_date),
    max_responses: row.max_responses || '',
    target_departments: targetDepartments,
    target_jobs: targetJobs,
    target_users: targetUsers,
    assigned_by: row.assigned_by || '',
    created_by_guid: row.created_by_guid || '',
    questions
  });

  setSelectedDept(targetDepartments);
  setSelectedJobs(targetJobs);
  setSelectedUsers(targetUsers);
  setEditingSurveyId(row.id);
  setIsEditMode(true);
  setActiveStep(0);
  setShowCreateDialog(true);
};

const handleEditExternalSurvey = (row) => {
  const targetBranches = safeJsonArray(row.target_branches);
  const targetDiplomas = safeJsonArray(row.target_diplomas);
  const targetTrainers = safeJsonArray(row.target_trainers);
  const questions = safeJsonArray(row.questions, [{ text: '', type: 'text', options: [''] }]);

  setExternalSurvey({
    title: row.title || '',
    description: row.description || '',
    start_date: parseDateForPicker(row.start_date),
    end_date: parseDateForPicker(row.end_date),
    max_responses: row.max_responses || '',
    target_branches: targetBranches,
    target_diplomas: targetDiplomas,
    is_trainer_survey: !!Number(row.is_trainer_survey || row.isTrainerSurvey || 0),
    target_trainers: targetTrainers,
    assigned_by: row.assigned_by || '',
    created_by_guid: row.created_by_guid || '',
    questions
  });

  setSelectedBranches(targetBranches);
  setSelectedDiplomas(targetDiplomas);
  setIsTrainerSurvey(!!Number(row.is_trainer_survey || row.isTrainerSurvey || 0));
  setSelectedTrainers(targetTrainers);
  setEditingExternalSurveyId(row.id);
  setIsExternalEditMode(true);
  setActiveStep(0);
  setShowCreateExternalDialog(true);
};

const handleDeleteSurvey = async (id, isExternal = false) => {
  const result = await Swal.fire({
    title: 'تأكيد الحذف',
    text: 'هل أنت متأكد من حذف هذا الاستبيان؟ سيتم إخفاؤه من القائمة ولن يتم حذف الردود نهائيًا.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'نعم، احذف',
    cancelButtonText: 'إلغاء',
    confirmButtonColor: '#d32f2f',
    cancelButtonColor: primaryColor
  });

  if (!result.isConfirmed) return;

  const loadingAlert = showLoadingAlert();

  try {
    const endpoint = isExternal ? 'delete_external_survey' : 'delete_survey';

    const response = await axios.post(`${SURVEY_API_BASE_URL}/${endpoint}`, { id });

    loadingAlert.close();

    if (response.data.success) {
      showSuccessAlert('تم حذف الاستبيان بنجاح');

      if (isExternal) {
        fetchAllExternalSurveys();
      } else {
        fetchAllSurveys();
      }
    } else {
      showErrorAlert(response.data.message || 'فشل حذف الاستبيان');
    }
  } catch (error) {
    loadingAlert.close();
    console.error(error);
    showErrorAlert('حدث خطأ أثناء حذف الاستبيان');
  }
};

const handleDuplicateSurvey = async (row, isExternal = false) => {
  const result = await Swal.fire({
    title: 'نسخ الاستبيان',
    text: 'سيتم إنشاء استبيان جديد بنفس البيانات والأسئلة بدون الردود. هل تريد المتابعة؟',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'نعم، انسخ',
    cancelButtonText: 'إلغاء',
    confirmButtonColor: primaryColor
  });

  if (!result.isConfirmed) return;

  const loadingAlert = showLoadingAlert();

  try {
    const userDataFromStorage = JSON.parse(localStorage.getItem('user') || '{}');

    const endpoint = isExternal ? 'duplicate_external_survey' : 'duplicate_survey';

    const response = await axios.post(`${SURVEY_API_BASE_URL}/${endpoint}`, {
      id: row.id,
      title: `${row.title || 'استبيان'}`,
      assigned_by: userDataFromStorage.userName || row.assigned_by || '',
      created_by_guid: userDataFromStorage.guid || row.created_by_guid || ''
    });

    loadingAlert.close();

    if (response.data.success) {
      showSuccessAlert('تم نسخ الاستبيان وإنشاء نسخة جديدة بنجاح');

      if (isExternal) {
        fetchAllExternalSurveys();
      } else {
        fetchAllSurveys();
      }
    } else {
      showErrorAlert(response.data.message || 'فشل نسخ الاستبيان');
    }
  } catch (error) {
    loadingAlert.close();
    console.error(error);
    showErrorAlert('حدث خطأ أثناء نسخ الاستبيان');
  }
};
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysRemaining = (endDate) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

const handleViewResponses = (survey, isExternal = false, trainer = null) => {
  setResponsesDialogSurvey({
    ...survey,
    isExternal,
    trainer_filter_guid: trainer?.trainerGuid || null,
    trainer_filter_name: trainer?.fullName || trainer?.userName || null
  });

  setSelectedResponseRow(null);
  setResponsesSearch('');
  setResponsesDialogOpen(true);
};
const getDialogResponses = () => {
  if (!responsesDialogSurvey) return [];

  const allResponses = responsesDialogSurvey.isExternal
    ? (externalSurveyResponses[responsesDialogSurvey.id] || [])
    : (surveyResponses[responsesDialogSurvey.id] || []);

  if (
    responsesDialogSurvey.isExternal &&
    responsesDialogSurvey.trainer_filter_guid
  ) {
    return allResponses.filter((r) =>
      String(r.trainer_guid || '').toLowerCase() ===
      String(responsesDialogSurvey.trainer_filter_guid || '').toLowerCase()
    );
  }

  return allResponses;
};
const ResponsesMasterDetail = ({
  survey,
  isExternal,
  responses,
  onSelect,
  selected,
  search,
  setSearch,
  renderDetails
}) => {
  const filtered = useMemo(() => {
    const term = (search || '').trim().toLowerCase();
    if (!term) return responses;

    return responses.filter(r => {
      const name = (isExternal ? r.student_name : r.employee_name) || '';
      const dep  = (r.department || '');
      const diplom = (r.diplom_name || '');
      const branch = (r.branch_name || '');
      const tel = (r.student_tel || '');
      const hay = `${name} ${dep} ${diplom} ${branch} ${tel}`.toLowerCase();
      return hay.includes(term);
    });
  }, [responses, search, isExternal]);

  const participation = useMemo(() => {
    const target = isExternal
      ? (survey.target_branches?.length || 0) * (survey.target_diplomas?.includes("all") ? 1 : (survey.target_diplomas?.length || 1))
      : (survey.target_users?.length || 0);

    const base = target || 1;
    return Math.min(100, Math.round((responses.length / base) * 100));
  }, [survey, responses, isExternal]);

  const columns = useMemo(() => {
    if (isExternal) {
      return [
        { field: 'student_name', align: "right", headerAlign: "right", headerName: 'الطالب', flex: 1, minWidth: 180 },
        { field: 'branch_name', align: "right", headerAlign: "right", headerName: 'الفرع', flex: 1, minWidth: 140 },
        { field: 'diplom_name', align: "right", headerAlign: "right", headerName: 'الدبلوم', flex: 1, minWidth: 180 },
        { field: 'student_tel', renderCell: (params) => <bdi dir="ltr">{params.value}</bdi>, align: "right", headerAlign: "right", headerName: 'الجوال', flex: 0.8, minWidth: 130 },
        {
          field: 'submitted_at',
          align: "right", headerAlign: "right", headerName: 'التاريخ',
          flex: 0.8,
          minWidth: 140,
          valueGetter: (p) => formatDate(p.row.submitted_at)
        }
      ];
    }

    return [
      { field: 'employee_name', align: "right", headerAlign: "right", headerName: 'الموظف', flex: 1, minWidth: 200 },
      { field: 'department', align: "right", headerAlign: "right", headerName: 'القسم', flex: 1, minWidth: 160 },
      {
        field: 'submitted_at',
        align: "right", headerAlign: "right", headerName: 'التاريخ',
        flex: 0.8,
        minWidth: 140,
        valueGetter: (p) => formatDate(p.row.submitted_at)
      }
    ];
  }, [isExternal]);
  return (
    <Box sx={{ p: 2 }}>
      {/* KPIs + Search */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={8}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip label={`عدد الردود: ${responses.length}`} sx={chipStyle} />
            <Chip label={`عدد الأسئلة: ${(survey.questions || []).length}`} sx={chipStyle} />
            <Chip label={`نسبة المشاركة: ${participation}%`} sx={participation >= 60 ? primaryChipStyle : chipStyle} />
            <Chip
              label={`المتبقي: ${getDaysRemaining(survey.end_date)} يوم`}
              sx={getDaysRemaining(survey.end_date) <= 3 ? { ...chipStyle, borderColor: '#d32f2f' } : chipStyle}
            />
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث سريع..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: primaryColor }} />
                </InputAdornment>
              )
            }}
            sx={fieldStyle}
          />
        </Grid>
      </Grid>

      {/* Master / Detail */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ borderRadius: 3, border: `1px solid ${primaryLight}`, overflow: 'hidden' }}>
            <Box sx={{ height: 520, width: '100%' }}>
              <DataGrid
                rows={filtered.map((r, idx) => ({ id: r.id || `${survey.id}_${idx}`, ...r }))}
                columns={columns}
                pageSizeOptions={[10, 20, 50]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 10, page: 0 } }
                }}
                onRowClick={(p) => onSelect(p.row)}
                disableRowSelectionOnClick
                sx={{
                  border: 0,
                  '& .MuiDataGrid-columnHeaders': {
                    backgroundColor: backgroundColor,
                    fontFamily: '"Cairo", sans-serif',
                    fontWeight: 'bold'
                  },
                  '& .MuiDataGrid-cell': { fontFamily: '"Cairo", sans-serif' }
                }}
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ borderRadius: 3, border: `1px solid ${primaryLight}`, height: 520, overflow: 'auto', p: 2 }}>
            {selected ? (
              renderDetails(selected)
            ) : (
              <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ fontFamily: '"Cairo", sans-serif', color: primaryDark }}>
                  اختر رد من الجدول لعرض التفاصيل هنا
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

function median(arr) {
  const a = [...arr].sort((x,y)=>x-y);
  const n = a.length;
  if (!n) return null;
  const mid = Math.floor(n/2);
  return n % 2 ? a[mid] : (a[mid-1] + a[mid]) / 2;
}

function ratingDistribution(nums) {
  const dist = { 1:0, 2:0, 3:0, 4:0, 5:0 };
  nums.forEach(v => { if (dist[v] != null) dist[v]++; });
  return dist;
}

function buildQuestionStats(survey, responses) {
  const questions = survey.questions || [];
  return questions.map((q, qi) => {
    const rawAnswers = responses.map(r => r.responses?.[qi]).filter(a => a !== undefined && a !== null && a !== '');
    const total = rawAnswers.length;

    if (q.type === 'rating') {
      const nums = rawAnswers.map(Number).filter(n => !Number.isNaN(n));
      const avg = nums.length ? nums.reduce((a,b)=>a+b,0)/nums.length : 0;
      const med = median(nums);
      const distRating = ratingDistribution(nums);
      const satPct = nums.length ? ((distRating[4] + distRating[5]) / nums.length) * 100 : 0;

      return {
        index: qi+1,
        text: q.text,
        type: q.type,
        total,
        avg: Number(avg.toFixed(2)),
        med: med != null ? Number(med.toFixed(2)) : null,
        satPct: Number(satPct.toFixed(1)),
        distRating,
        dist: null
      };
    }

    if (q.type === 'radio') {
      const dist = {};
      rawAnswers.forEach(a => {
        const key = q.options?.[parseInt(a)] ?? String(a);
        dist[key] = (dist[key] || 0) + 1;
      });
      return { index: qi+1, text: q.text, type: q.type, total, avg: null, med: null, satPct: null, distRating: null, dist };
    }

    if (q.type === 'checkbox') {
      const dist = {};
      rawAnswers.forEach(a => {
        const arr = Array.isArray(a) ? a : [a];
        arr.forEach(x => {
          const key = q.options?.[parseInt(x)] ?? String(x);
          dist[key] = (dist[key] || 0) + 1;
        });
      });
      return { index: qi+1, text: q.text, type: q.type, total, avg: null, med: null, satPct: null, distRating: null, dist };
    }

    return { index: qi+1, text: q.text, type: q.type, total, avg: null, med: null, satPct: null, distRating: null, dist: null };
  });
}


async function chartToPngBase64({
  labels,
  values,
  type = 'bar',
  title = '',
  horizontal = false,
  doughnut = false,
}) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 550;

  const Chart = getChart();
  const ctx = canvas.getContext('2d');

  const chartType = doughnut ? 'doughnut' : type;

  new Chart(ctx, {
    type: chartType,
    data: {
      labels,
      datasets: [{
        label: title || 'Results',
        data: values,
        borderWidth: 1,
      }]
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      indexAxis: horizontal ? 'y' : 'x',
      layout: { padding: 20 },
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: { boxWidth: 12, padding: 15 }
        },
        title: {
          display: !!title,
          text: title,
          padding: { top: 10, bottom: 20 },
          font: { size: 18, weight: 'bold' }
        },
        tooltip: { enabled: true }
      },
      scales: chartType === 'doughnut' ? {} : {
        x: { ticks: { font: { size: 12 } }, grid: { display: false } },
        y: { ticks: { font: { size: 12 } }, grid: { display: true } }
      }
    }
  });

  await new Promise(r => setTimeout(r, 200));
  return canvas.toDataURL('image/png');
}




  const renderResponseDetails = (response, surveyQuestions, isExternal = false) => {
    if (!response.responses) return null;

    if (isExternal) {
      return (
        <Box sx={{ mt: 2 }}>
          <Card sx={{ mb: 3, border: `2px solid ${primaryLight}`, backgroundColor: backgroundColor }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ 
                  width: 60, 
                  height: 60, 
                  backgroundColor: primaryColor,
                  border: `2px solid ${primaryLight}`,
                  fontSize: '1.2rem',
                  fontWeight: 'bold'
                }}>
                  {response.student_name?.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontFamily: '"Cairo", sans-serif', fontWeight: 'bold', color: primaryDark }}>
                    {response.student_name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: textColor, fontFamily: '"Cairo", sans-serif' }}>
                    {response.diplom_name} - {response.branch_name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: textColor, fontFamily: '"Cairo", sans-serif' }}>
                    {response.student_tel} - {formatDate(response.submitted_at)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {surveyQuestions.map((question, index) => (
            <Card key={index} sx={{ mb: 2, border: `1px solid ${primaryLight}` }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: primaryDark, mb: 1 }}>
                  {index + 1}. {question.text}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {renderAnswer(question.type, response.responses[index], question.options)}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      );
    } else {
      return (
        <Box sx={{ mt: 2 }}>
          <Card sx={{ mb: 3, border: `2px solid ${primaryLight}`, backgroundColor: backgroundColor }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <EmployeeAvatar userGuid={response.employee_guid} employeeName={response.employee_name} />
                <Box>
                  <Typography variant="h6" sx={{ fontFamily: '"Cairo", sans-serif', fontWeight: 'bold', color: primaryDark }}>
                    {response.employee_name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: textColor, fontFamily: '"Cairo", sans-serif' }}>
                    {response.department} - {formatDate(response.submitted_at)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {surveyQuestions.map((question, index) => (
            <Card key={index} sx={{ mb: 2, border: `1px solid ${primaryLight}` }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: primaryDark, mb: 1 }}>
                  {index + 1}. {question.text}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {renderAnswer(question.type, response.responses[index], question.options)}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      );
    }
  };

  const EmployeeAvatar = ({ userGuid, employeeName }) => {
    const [imageUrl, setImageUrl] = useState(null);
    const [imageLoading, setImageLoading] = useState(false);

    useEffect(() => {
      if (userGuid) {
        fetchUserImage();
      }
    }, [userGuid]);

    const fetchUserImage = async () => {
      try {
        setImageLoading(true);
        const timestamp = new Date().getTime();
        const response = await fetch(`${IMAGE_API_BASE_URL}?action=get&userGuid=${userGuid}&t=${timestamp}`);

        if (response.ok) {
          const blob = await response.blob();
          if (blob.size > 0) {
            const url = URL.createObjectURL(blob);
            setImageUrl(url);
          }
        }
      } catch (error) {
        console.error('Error fetching employee image:', error);
      } finally {
        setImageLoading(false);
      }
    };

    if (imageLoading) {
      return (
        <Avatar sx={{ width: 60, height: 60, backgroundColor: primaryLight }}>
          <CircularProgress size={20} sx={{ color: primaryColor }} />
        </Avatar>
      );
    }

    return (
      <Avatar
        sx={{ 
          width: 60, 
          height: 60, 
          backgroundColor: imageUrl ? 'transparent' : primaryColor,
          border: `2px solid ${primaryLight}`,
          fontSize: '1.2rem',
          fontWeight: 'bold'
        }}
        src={imageUrl}
        alt={employeeName}
      >
        {!imageUrl && employeeName?.charAt(0)}
      </Avatar>
    );
  };

  const renderAnswer = (type, answer, options) => {
    if (!answer && answer !== 0) {
      return <Typography sx={{ color: '#999', fontStyle: 'italic' }}>لم يتم الإجابة</Typography>;
    }

    switch (type) {
      case 'text':
        return (
          <Typography sx={{ color: textColor, p: 1, backgroundColor: backgroundColor, borderRadius: 1 }}>
            {answer}
          </Typography>
        );
      
      case 'radio':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <RadioButtonChecked sx={{ color: primaryColor, fontSize: 20 }} />
            <Typography sx={{ color: textColor }}>
              {options?.[parseInt(answer)] || answer}
            </Typography>
          </Box>
        );
      
      case 'checkbox':
        const selectedOptions = Array.isArray(answer) ? answer : [answer];
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {selectedOptions.map((option, idx) => (
              <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle sx={{ color: primaryColor, fontSize: 20 }} />
                <Typography sx={{ color: textColor }}>
                  {options?.[parseInt(option)] || option}
                </Typography>
              </Box>
            ))}
          </Box>
        );
      
      case 'rating':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Star sx={{ color: '#ffc107' }} />
            <Typography sx={{ color: textColor, fontWeight: 'bold' }}>
              {answer} / 5
            </Typography>
          </Box>
        );
    case "file":
  if (answer && typeof answer === "object") {
    const displayName =
      answer.original_name || answer.file_name || answer.saved_name || "ملف مرفوع";

    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Typography sx={{ color: textColor, fontWeight: "bold" }}>
          📁 {displayName}
        </Typography>

        <Button
          variant="outlined"
          size="small"
          startIcon={<Download />}
          onClick={() => handleDownloadFile(answer)}
          sx={{ borderColor: primaryColor, color: primaryColor }}
        >
          تحميل الملف
        </Button>

        {typeof answer.file_size === "number" && (
          <Typography variant="caption" sx={{ color: "#666" }}>
            {formatFileSize(answer.file_size)}
          </Typography>
        )}
      </Box>
    );
  }

  // لو string uploads/.. أو URL
  if (typeof answer === "string") {
    const fileName = answer.includes("/") ? answer.split("/").pop() : answer;
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Typography sx={{ color: textColor, fontWeight: "bold" }}>
          📁 {fileName}
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Download />}
          onClick={() => handleDownloadFile(answer)}
          sx={{ borderColor: primaryColor, color: primaryColor }}
        >
          تحميل الملف
        </Button>
      </Box>
    );
  }

  return <Typography sx={{ color: "#999", fontStyle: "italic" }}>لم يتم رفع ملف</Typography>;

    }
  };

  // Styles
  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8fbfa 0%, #e8f5f1 100%)',
    padding: 0,
    margin: 0
  };

  const mainPaperStyle = {
    p: 4,
    background: 'white',
    borderRadius: 4,
    boxShadow: '0 15px 50px rgba(128, 180, 158, 0.15)',
    border: `1px solid ${primaryLight}`,
    width: '100%',
    maxWidth: '1400px',
    my: 4,
    minHeight: '80vh'
  };

  const fieldStyle = {
    '& .MuiOutlinedInput-root': {
      '&:hover fieldset': { borderColor: primaryColor },
      '&.Mui-focused fieldset': { borderColor: primaryColor },
    },
    '& .MuiInputLabel-root.Mui-focused': { color: primaryColor },
  };

  const chipStyle = {
    backgroundColor: backgroundColor,
    color: textColor,
    border: `1px solid ${primaryLight}`,
    fontFamily: '"Cairo", sans-serif'
  };

  const primaryChipStyle = {
    backgroundColor: primaryColor,
    color: 'white',
    fontFamily: '"Cairo", sans-serif'
  };

  const cardStyle = {
    border: `1px solid ${primaryLight}`,
    borderRadius: 3,
    background: 'white',
    transition: 'all 0.3s ease',
    mb: 2,
    '&:hover': {
      boxShadow: `0 8px 25px rgba(128, 180, 158, 0.15)`,
      transform: 'translateY(-2px)'
    }
  };

  const subtitleStyle = {
    color: primaryDark,
    fontWeight: 'bold',
    fontSize: '1.1rem',
    fontFamily: '"Cairo", sans-serif'
  };

  const iconButtonStyle = {
    '&:hover': { background: 'rgba(211, 47, 47, 0.1)' }
  };

  const outlinedButtonStyle = {
    borderColor: primaryColor,
    color: primaryColor,
    mt: 2,
    px: 3,
    py: 1,
    borderRadius: 2,
    fontFamily: '"Cairo", sans-serif',
    '&:hover': {
      borderColor: primaryDark,
      backgroundColor: 'rgba(128, 180, 158, 0.1)',
      transform: 'translateY(-1px)'
    },
    transition: 'all 0.3s ease'
  };

  const primaryButtonStyle = {
    background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryDark} 100%)`,
    color: 'white',
    fontWeight: 'bold',
    borderRadius: 2,
    px: 4,
    py: 1.5,
    fontSize: '1rem',
    fontFamily: '"Cairo", sans-serif',
    '&:hover': {
      background: `linear-gradient(135deg, ${primaryDark} 0%, #5a8875 100%)`,
      boxShadow: `0 8px 25px rgba(128, 180, 158, 0.4)`,
      transform: 'translateY(-2px)'
    },
    transition: 'all 0.3s ease'
  };

  const reviewTextStyle = {
    color: textColor,
    lineHeight: 1.8,
    fontSize: '1rem',
    fontFamily: '"Cairo", sans-serif'
  };

  const isFormValid = 
    survey.title && 
    survey.start_date && 
    survey.end_date && 
    selectedDept.length > 0 && 
    selectedJobs.length > 0 && 
    selectedUsers.length > 0 &&
    survey.questions.every(q => q.text.trim() !== '');

  const isExternalFormValid = 
    externalSurvey.title && 
    externalSurvey.start_date && 
    externalSurvey.end_date && 
    selectedBranches.length > 0 && 
    selectedDiplomas.length > 0 &&
    externalSurvey.questions.every(q => q.text.trim() !== '');

  // Render functions for create survey dialog
  const renderBasicInfoStep = (isExternal = false) => (
    <Fade in={true} timeout={500}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="عنوان الاستبيان"
            value={isExternal ? externalSurvey.title : survey.title}
            onChange={(e) => isExternal ? 
              setExternalSurvey(prev => ({ ...prev, title: e.target.value })) :
              setSurvey(prev => ({ ...prev, title: e.target.value }))
            }
            required
            sx={fieldStyle}
            variant="outlined"
            size="medium"
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="وصف الاستبيان"
            value={isExternal ? externalSurvey.description : survey.description}
            onChange={(e) => isExternal ?
              setExternalSurvey(prev => ({ ...prev, description: e.target.value })) :
              setSurvey(prev => ({ ...prev, description: e.target.value }))
            }
            multiline
            rows={3}
            sx={fieldStyle}
            variant="outlined"
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <DatePicker
            label="تاريخ البدء"
            value={isExternal ? externalSurvey.start_date : survey.start_date}
            onChange={(newValue) => isExternal ?
              setExternalSurvey(prev => ({ ...prev, start_date: newValue })) :
              setSurvey(prev => ({ ...prev, start_date: newValue }))
            }
            renderInput={(params) => 
              <TextField 
                {...params} 
                fullWidth 
                required 
                sx={fieldStyle}
                variant="outlined"
              />
            }
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <DatePicker
            label="تاريخ الانتهاء"
            value={isExternal ? externalSurvey.end_date : survey.end_date}
            onChange={(newValue) => isExternal ?
              setExternalSurvey(prev => ({ ...prev, end_date: newValue })) :
              setSurvey(prev => ({ ...prev, end_date: newValue }))
            }
            renderInput={(params) => 
              <TextField 
                {...params} 
                fullWidth 
                required 
                sx={fieldStyle}
                variant="outlined"
              />
            }
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="الحد الأقصى للمشاركين (اختياري)"
            type="number"
            value={isExternal ? externalSurvey.max_responses : survey.max_responses}
            onChange={(e) => isExternal ?
              setExternalSurvey(prev => ({ ...prev, max_responses: e.target.value })) :
              setSurvey(prev => ({ ...prev, max_responses: e.target.value }))
            }
            sx={fieldStyle}
            variant="outlined"
           inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
        </Grid>
      </Grid>
    </Fade>
  );

  const renderRecipientsStep = () => (
    <Fade in={true} timeout={500}>
      <Box>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontFamily: '"Cairo", sans-serif' }}>اختر الأقسام</InputLabel>
              <Select
                multiple
                value={selectedDept}
                onChange={(e) => {
                  setSelectedDept(e.target.value);
                  setSelectedJobs([]);
                  setSelectedUsers([]);
                }}
                input={<OutlinedInput label="اختر الأقسام" />}
                disabled={loadingDepts}
                renderValue={(selected) => (
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {departments
                      .filter(d => selected.includes(d.guid))
                      .map(d => (
                        <Chip 
                          key={d.guid} 
                          label={d.departName} 
                          size="small" 
                          sx={chipStyle}
                        />
                      ))}
                  </Box>
                )}
                startAdornment={
                  <Business sx={{ color: primaryColor, marginInlineEnd: 1 }} />
                }
              >
                {departments.map((dept) => (
                  <MenuItem key={dept.guid} value={dept.guid} sx={{ fontFamily: '"Cairo", sans-serif' }}>
                    <Checkbox checked={selectedDept.includes(dept.guid)} sx={{ color: primaryColor }} />
                    <ListItemText primary={dept.departName} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {selectedDept.length > 0 && (
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontFamily: '"Cairo", sans-serif' }}>الوظائف المطلوبة</InputLabel>
                <Select
                  multiple
                  value={selectedJobs}
                  onChange={(e) => {
                    setSelectedJobs(e.target.value);
                    setSelectedUsers([]);
                  }}
                  input={<OutlinedInput label="الوظائف المطلوبة" />}
                  renderValue={(selected) => (
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {selected.includes("all") ? (
                        <Chip 
                          label="كل الوظائف" 
                          size="small" 
                          sx={primaryChipStyle}
                        />
                      ) : (
                        selected.map(j => (
                          <Chip 
                            key={j} 
                            label={jobTitles[j] || `وظيفة رقم ${j}`} 
                            size="small" 
                            sx={chipStyle}
                          />
                        ))
                      )}
                    </Box>
                  )}
                  startAdornment={
                    <Work sx={{ color: primaryColor, marginInlineEnd: 1 }} />
                  }
                >
                  <MenuItem value="all" sx={{ fontFamily: '"Cairo", sans-serif' }}>
                    <Checkbox checked={selectedJobs.includes("all")} sx={{ color: primaryColor }} />
                    <ListItemText primary="كل الوظائف" />
                  </MenuItem>
                  {filteredJobs.map(job => (
                    <MenuItem key={job} value={job} sx={{ fontFamily: '"Cairo", sans-serif' }}>
                      <Checkbox checked={selectedJobs.includes(job)} sx={{ color: primaryColor }} />
                      <ListItemText 
                        primary={`${jobTitles[job] || `وظيفة رقم ${job}`} (${users.filter(u => u.userJop === job && selectedDept.includes(u.departGuid)).length})`} 
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          {selectedJobs.length > 0 && !loadingUsers && (
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontFamily: '"Cairo", sans-serif' }}>اختر الموظفين</InputLabel>
                <Select
                  multiple
                  value={selectedUsers}
                  onChange={(e) => setSelectedUsers(e.target.value)}
                  input={<OutlinedInput label="اختر الموظفين" />}
                  renderValue={(selected) => (
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {selected.includes("all") ? (
                        <Chip 
                          label={`الكل (${filteredUsers.length})`} 
                          size="small" 
                          sx={primaryChipStyle}
                        />
                      ) : (
                        filteredUsers
                          .filter(u => selected.includes(u.guid))
                          .map(u => (
                            <Chip
                              key={u.guid}
                              label={u.fullName}
                              avatar={<Avatar sx={{ backgroundColor: primaryColor, fontSize: '0.75rem' }}>
                                {u.fullName?.charAt(0) || ''}
                              </Avatar>}
                              sx={[hrChipSx(), chipStyle]}
                            />
                          ))
                      )}
                    </Box>
                  )}
                  startAdornment={
                    <Badge 
                      badgeContent={selectedUsers.includes("all") ? filteredUsers.length : selectedUsers.length} 
                      sx={{ marginInlineEnd: 1 }}
                    >
                      <Person sx={{ color: primaryColor }} />
                    </Badge>
                  }
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 400
                      }
                    }
                  }}
                >
                  <Box sx={{ p: 1, borderBottom: `1px solid ${primaryLight}` }}>
                    <TextField
                      fullWidth
                      variant="outlined"
                      size="small"
                      placeholder="ابحث عن موظف..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Search sx={{ color: primaryColor }} />
                          </InputAdornment>
                        ),
                        endAdornment: searchTerm && (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              onClick={() => setSearchTerm("")}
                            >
                              <Close fontSize="small" />
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                    />
                  </Box>
                  
                  <MenuItem value="all" sx={{ fontFamily: '"Cairo", sans-serif' }}>
                    <Checkbox checked={selectedUsers.includes("all")} sx={{ color: primaryColor }} />
                    <ListItemText primary={`الكل (${filteredUsers.length})`} />
                  </MenuItem>
                  
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map(user => (
                      <MenuItem key={user.guid} value={user.guid} sx={{ fontFamily: '"Cairo", sans-serif' }}>
                        <Checkbox checked={selectedUsers.includes(user.guid)} sx={{ color: primaryColor }} />
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar sx={{ 
                            width: 24, 
                            height: 24, 
                            fontSize: '0.75rem',
                            backgroundColor: primaryColor 
                          }}>
                            {user.fullName?.charAt(0) || ''}
                          </Avatar>
                          <Box>
                            <Typography variant="body1" sx={{ fontFamily: '"Cairo", sans-serif' }}>
                              {user.fullName || 'غير معروف'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: primaryDark, fontFamily: '"Cairo", sans-serif' }}>
                              {jobTitles[user.userJop] || `وظيفة رقم ${user.userJop}`}
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))
                  ) : (
                    <Box p={2} textAlign="center">
                      <Typography variant="body2" sx={{ color: primaryDark, fontFamily: '"Cairo", sans-serif' }}>
                        {searchTerm ? 'لا يوجد موظفين مطابقين للبحث' : 'لا يوجد موظفين متاحين'}
                      </Typography>
                    </Box>
                  )}
                </Select>
              </FormControl>
            </Grid>
          )}
        </Grid>

        {selectedUsers.length > 0 && (
          <Box mt={3} p={2} sx={{ backgroundColor: backgroundColor, borderRadius: 2, border: `1px solid ${primaryLight}` }}>
            <Typography variant="subtitle1" sx={{ color: primaryDark, fontWeight: 'bold', mb: 1, fontFamily: '"Cairo", sans-serif' }}>
              المستلمون المحددون: {selectedUsers.includes("all") ? filteredUsers.length : selectedUsers.length} موظف
            </Typography>
          </Box>
        )}
      </Box>
    </Fade>
  );

  const renderBranchesDiplomasStep = () => (
    <Fade in={true} timeout={500}>
      <Box>
        <Grid container spacing={2}>
         <Grid item xs={12}>
  <Box
    sx={{
      p: 2,
      borderRadius: 2,
      border: `1px solid ${primaryLight}`,
      backgroundColor: '#fff'
    }}
  >
    <FormControlLabel
      control={
        <Checkbox
          checked={isTrainerSurvey}
          onChange={(e) => setIsTrainerSurvey(e.target.checked)}
          sx={{
            color: primaryColor,
            '&.Mui-checked': {
              color: primaryDark
            }
          }}
        />
      }
      label={
        <Typography sx={{ fontWeight: 'bold', color: primaryDark }}>
          هل هذا الاستبيان عن مدربين؟
        </Typography>
      }
    />
  </Box>
</Grid>

<Grid item xs={12} md={6}>
  <FormControl fullWidth size="small">
    <InputLabel sx={{ fontFamily: '"Cairo", sans-serif' }}>اختر الفروع</InputLabel>
    <Select
      multiple
      value={selectedBranches}
      onChange={(e) => {
        setSelectedBranches(e.target.value);
        setSelectedDiplomas([]);
      }}
      input={<OutlinedInput label="اختر الفروع" />}
      disabled={loadingBranches}
      renderValue={(selected) => (
        <Box display="flex" flexWrap="wrap" gap={0.5}>
          {branches
            .filter(b => selected.includes(b.guid))
            .map(b => (
              <Chip 
                key={b.guid} 
                label={b.name} 
                size="small" 
                sx={chipStyle}
              />
            ))}
        </Box>
      )}
      startAdornment={
        <LocationOn sx={{ color: primaryColor, marginInlineEnd: 1 }} />
      }
    >
      {branches.map((branch) => (
        <MenuItem key={branch.guid} value={branch.guid} sx={{ fontFamily: '"Cairo", sans-serif' }}>
          <Checkbox checked={selectedBranches.includes(branch.guid)} sx={{ color: primaryColor }} />
          <ListItemText primary={branch.name} />
        </MenuItem>
      ))}
    </Select>
  </FormControl>
</Grid>

          {selectedBranches.length > 0 && (
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontFamily: '"Cairo", sans-serif' }}>الدبلومات المطلوبة</InputLabel>
                <Select
                  multiple
                  value={selectedDiplomas}
                  onChange={(e) => setSelectedDiplomas(e.target.value)}
                  input={<OutlinedInput label="الدبلومات المطلوبة" />}
                  disabled={loadingDiplomas}
                  renderValue={(selected) => (
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {selected.includes("all") ? (
                        <Chip 
                          label="كل الدبلومات" 
                          size="small" 
                          sx={primaryChipStyle}
                        />
                      ) : (
                        selected.map(diploma => (
                          <Chip 
                            key={diploma} 
                            label={diploma} 
                            size="small" 
                            sx={chipStyle}
                          />
                        ))
                      )}
                    </Box>
                  )}
                  startAdornment={
                    <School sx={{ color: primaryColor, marginInlineEnd: 1 }} />
                  }
                >
                  <MenuItem value="all" sx={{ fontFamily: '"Cairo", sans-serif' }}>
                    <Checkbox checked={selectedDiplomas.includes("all")} sx={{ color: primaryColor }} />
                    <ListItemText primary="كل الدبلومات" />
                  </MenuItem>
                  {diplomas.map(diploma => (
                    <MenuItem key={diploma} value={diploma} sx={{ fontFamily: '"Cairo", sans-serif' }}>
                      <Checkbox checked={selectedDiplomas.includes(diploma)} sx={{ color: primaryColor }} />
                      <ListItemText primary={diploma} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
        </Grid>
{isTrainerSurvey && (
  <Grid item xs={12}>
    <Card
      sx={{
        mt: 1,
        borderRadius: 3,
        border: `1px solid ${primaryLight}`,
        backgroundColor: '#ffffff'
      }}
    >
      <CardContent>
        <Typography
          variant="h6"
          sx={{
            fontFamily: '"Cairo", sans-serif',
            fontWeight: 'bold',
            color: primaryDark,
            mb: 2
          }}
        >
          تحديد المدربين حسب الفروع المختارة
        </Typography>

        <Alert severity="info" sx={{ mb: 2, fontFamily: '"Cairo", sans-serif' }}>
          يتم عرض المدربين حسب الفرع المختار  .
        </Alert>

        <TextField
          fullWidth
          size="small"
          placeholder="بحث باسم المدرب..."
          value={trainerSearchTerm}
          onChange={(e) => setTrainerSearchTerm(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: primaryColor }} />
              </InputAdornment>
            )
          }}
        />

        <FormControl fullWidth size="small">
          <InputLabel sx={{ fontFamily: '"Cairo", sans-serif' }}>
            اختر المدربين
          </InputLabel>

          <Select
            multiple
            value={selectedTrainers}
            onChange={(e) => setSelectedTrainers(e.target.value)}
            input={<OutlinedInput label="اختر المدربين" />}
            disabled={!selectedBranches.length || trainersForSelectedBranches.length === 0}
            renderValue={(selected) => (
              <Box display="flex" flexWrap="wrap" gap={0.5}>
                {selected.map((trainerGuid) => {
                  const trainer = users.find(
                    (u) =>
                      String(u.trainerGuid || '').toLowerCase() ===
                      String(trainerGuid || '').toLowerCase()
                  );

                  return (
                    <Chip
                      key={trainerGuid}
                      label={trainer?.fullName || trainer?.userName || trainerGuid}
                      size="small"
                      sx={primaryChipStyle}
                    />
                  );
                })}
              </Box>
            )}
          >
            {trainersForSelectedBranches.map((trainer) => (
              <MenuItem
                key={trainer.trainerGuid}
                value={trainer.trainerGuid}
                sx={{ fontFamily: '"Cairo", sans-serif' }}
              >
                <Checkbox
                  checked={selectedTrainers.includes(trainer.trainerGuid)}
                  sx={{ color: primaryColor }}
                />

                <ListItemText
                  primary={trainer.fullName || trainer.userName}
                  // secondary={`كود المدرب: ${trainer.trainerGuid}`}
                />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label={`عدد المدربين المتاحين: ${trainersForSelectedBranches.length}`}
            size="small"
            sx={chipStyle}
          />

          <Chip
            label={`عدد المدربين المختارين: ${selectedTrainers.length}`}
            size="small"
            sx={primaryChipStyle}
          />
        </Box>
      </CardContent>
    </Card>
  </Grid>
)}
        {selectedDiplomas.length > 0 && (
          <Box mt={3} p={2} sx={{ backgroundColor: backgroundColor, borderRadius: 2, border: `1px solid ${primaryLight}` }}>
            <Typography variant="subtitle1" sx={{ color: primaryDark, fontWeight: 'bold', mb: 1, fontFamily: '"Cairo", sans-serif' }}>
              الفئات المستهدفة: {selectedBranches.length} فرع - {selectedDiplomas.includes("all") ? "كل الدبلومات" : `${selectedDiplomas.length} دبلوم`}
            </Typography>
          </Box>
        )}
      </Box>
    </Fade>
  );

  const renderQuestionsStep = (isExternal = false) => (
    <Fade in={true} timeout={500}>
      <Box>
        {(isExternal ? externalSurvey.questions : survey.questions).map((question, qIndex) => (
          <Card key={qIndex} sx={cardStyle}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Typography variant="h6" sx={subtitleStyle}>
                  السؤال {qIndex + 1}
                </Typography>
                <IconButton 
                  onClick={() => removeQuestion(qIndex, isExternal)}
                  color="error"
                  disabled={(isExternal ? externalSurvey.questions : survey.questions).length === 1}
                  sx={iconButtonStyle}
                >
                  <Delete />
                </IconButton>
              </Box>
              
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={8}>
                  <TextField
                    fullWidth
                    label="نص السؤال"
                    value={question.text}
                    onChange={(e) => updateQuestion(qIndex, 'text', e.target.value, isExternal)}
                    required
                    sx={fieldStyle}
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth sx={fieldStyle}>
                    <InputLabel>نوع السؤال</InputLabel>
                    <Select
                      value={question.type}
                      onChange={(e) => updateQuestion(qIndex, 'type', e.target.value, isExternal)}
                      label="نوع السؤال"
                      variant="outlined"
                    >
                      <MenuItem value="text">نص حر</MenuItem>
                      <MenuItem value="radio">اختيار من متعدد</MenuItem>
                      <MenuItem value="checkbox">اختيار متعدد</MenuItem>
                      <MenuItem value="rating">تقييم (1-5)</MenuItem>
                      <MenuItem value="file">رفع ملف (PDF/Word)</MenuItem> 
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              
              {(question.type === 'radio' || question.type === 'checkbox') && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" gutterBottom sx={subtitleStyle}>
                    خيارات الإجابة:
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {question.options.map((option, oIndex) => (
                      <Grid item xs={12} md={6} key={oIndex}>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <TextField
                            fullWidth
                            size="medium"
                            value={option}
                            onChange={(e) => updateOption(qIndex, oIndex, e.target.value, isExternal)}
                            placeholder={`الخيار ${oIndex + 1}`}
                            sx={fieldStyle}
                            variant="outlined"
                          />
                          <IconButton 
                            onClick={() => removeOption(qIndex, oIndex, isExternal)}
                            color="error"
                            disabled={question.options.length === 1}
                            sx={iconButtonStyle}
                            size="medium"
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                  
                  <Button 
                    startIcon={<Add />}
                    onClick={() => addOption(qIndex, isExternal)}
                    variant="outlined"
                    size="medium"
                    sx={outlinedButtonStyle}
                  >
                    إضافة خيار
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        ))}
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button 
            startIcon={<Add />}
            onClick={() => addQuestion(isExternal)}
            variant="contained"
            sx={primaryButtonStyle}
            size="large"
          >
            إضافة سؤال جديد
          </Button>
        </Box>
      </Box>
    </Fade>
  );

  const renderReviewStep = (isExternal = false) => (
    <Fade in={true} timeout={500}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card sx={cardStyle}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={subtitleStyle}>
                معلومات الاستبيان
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography sx={reviewTextStyle}><strong>العنوان:</strong> {isExternal ? externalSurvey.title : survey.title}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography sx={reviewTextStyle}><strong>الوصف:</strong> {isExternal ? externalSurvey.description : survey.description || 'لا يوجد'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography sx={reviewTextStyle}><strong>تاريخ البدء:</strong> {(isExternal ? externalSurvey.start_date : survey.start_date)?.toLocaleDateString('ar-EG')}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography sx={reviewTextStyle}><strong>تاريخ الانتهاء:</strong> {(isExternal ? externalSurvey.end_date : survey.end_date)?.toLocaleDateString('ar-EG')}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography sx={reviewTextStyle}><strong>الحد الأقصى:</strong> {isExternal ? externalSurvey.max_responses : survey.max_responses || 'لا يوجد حد'}</Typography>
                </Grid>
                {isExternal ? (
                  <>
                    <Grid item xs={12} md={6}>
                      <Typography sx={reviewTextStyle}><strong>الفروع المستهدفة:</strong></Typography>
                      <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selectedBranches.map(branchGuid => {
                          const branch = branches.find(b => b.guid === branchGuid);
                          return (
                            <Chip 
                              key={branchGuid}
                              label={branch?.name || 'فرع غير معروف'}
                              size="small"
                              sx={chipStyle}
                            />
                          );
                        })}
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography sx={reviewTextStyle}><strong>الدبلومات المستهدفة:</strong></Typography>
                      <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selectedDiplomas.includes("all") ? (
                          <Chip label="كل الدبلومات" size="small" sx={primaryChipStyle} />
                        ) : (
                          selectedDiplomas.map(diploma => (
                            <Chip 
                              key={diploma}
                              label={diploma}
                              size="small"
                              sx={chipStyle}
                            />
                          ))
                        )}
                      </Box>
                    </Grid>
                  </>
                ) : (
                  <>
                    <Grid item xs={12} md={6}>
                      <Typography sx={reviewTextStyle}><strong>الأقسام المستهدفة:</strong> {selectedDept.length} قسم</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography sx={reviewTextStyle}><strong>الوظائف المستهدفة:</strong> {selectedJobs.length} وظيفة</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography sx={reviewTextStyle}><strong>عدد المستلمين:</strong> {selectedUsers.includes("all") ? filteredUsers.length : selectedUsers.length} موظف</Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Card sx={cardStyle}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={subtitleStyle}>
                الأسئلة ({(isExternal ? externalSurvey.questions : survey.questions).length})
              </Typography>
              {(isExternal ? externalSurvey.questions : survey.questions).map((question, index) => (
                <Box key={index} sx={{ mb: 2, p: 2, background: backgroundColor, borderRadius: 2, border: `1px solid ${primaryLight}` }}>
                  <Typography sx={reviewTextStyle}><strong>السؤال {index + 1}:</strong> {question.text}</Typography>
                  <Typography sx={reviewTextStyle}><strong>النوع:</strong> {getQuestionTypeText(question.type)}</Typography>
                  {question.options.length > 0 && question.options[0] !== '' && (
                    <Typography sx={reviewTextStyle}><strong>الخيارات:</strong> {question.options.join('، ')}</Typography>
                  )}
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Fade>
  );

  const getQuestionTypeText = (type) => {
    const types = {
      text: 'نص حر',
      radio: 'اختيار من متعدد',
      checkbox: 'اختيار متعدد',
      rating: 'تقييم (1-5)'
    };
    return types[type] || type;
  };

  // Render functions for main page
  const renderSurveysTable = () => (
    <TableContainer component={Paper} sx={{ borderRadius: 3, border: `1px solid ${primaryLight}` }}>
      <Table>
        <TableHead sx={{ backgroundColor: backgroundColor }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold', color: primaryDark, fontFamily: '"Cairo", sans-serif' }}>العنوان</TableCell>
            <TableCell sx={{ fontWeight: 'bold', color: primaryDark, fontFamily: '"Cairo", sans-serif' }}>الوصف</TableCell>
            <TableCell sx={{ fontWeight: 'bold', color: primaryDark, fontFamily: '"Cairo", sans-serif' }}>تاريخ البدء</TableCell>
            <TableCell sx={{ fontWeight: 'bold', color: primaryDark, fontFamily: '"Cairo", sans-serif' }}>تاريخ الانتهاء</TableCell>
            <TableCell sx={{ fontWeight: 'bold', color: primaryDark, fontFamily: '"Cairo", sans-serif' }}>المستهدفون</TableCell>
            <TableCell sx={{ fontWeight: 'bold', color: primaryDark, fontFamily: '"Cairo", sans-serif' }}>عدد الردود</TableCell>
            <TableCell sx={{ fontWeight: 'bold', color: primaryDark, fontFamily: '"Cairo", sans-serif' }}>الإجراءات</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {allSurveys.map((survey) => (
            <TableRow key={survey.id} hover>
              <TableCell sx={{ fontFamily: '"Cairo", sans-serif' }}>{survey.title}</TableCell>
<TableCell
  sx={{ fontFamily: '"Cairo", sans-serif' }}
  title={survey.description || ''}
>
  {(survey.description || '').length > 100
    ? (survey.description || '').slice(0, 80) + '...'
    : (survey.description || '')}
</TableCell>
              <TableCell sx={{ fontFamily: '"Cairo", sans-serif' }}>{formatDate(survey.start_date)}</TableCell>
              <TableCell sx={{ fontFamily: '"Cairo", sans-serif' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {formatDate(survey.end_date)}
                  <Chip 
                    label={`${getDaysRemaining(survey.end_date)} أيام`}
                    size="small"
                    color={getDaysRemaining(survey.end_date) <= 3 ? 'error' : getDaysRemaining(survey.end_date) <= 7 ? 'warning' : 'success'}
                  />
                </Box>
              </TableCell>
              <TableCell sx={{ fontFamily: '"Cairo", sans-serif' }}>
                {survey.target_users?.length || 0} موظف
              </TableCell>
              <TableCell sx={{ fontFamily: '"Cairo", sans-serif' }}>
                {surveyResponses[survey.id]?.length || 0} رد
              </TableCell>
              <TableCell>
  <Box
    sx={{
      display: 'flex',
      gap: 1,
      flexDirection: 'column',
      minWidth: 150
    }}
  >
    <Button
      variant="outlined"
      size="small"
      startIcon={<Visibility />}
      sx={{
        fontFamily: '"Cairo", sans-serif',
        fontSize: '0.75rem',
        borderColor: primaryColor,
        color: primaryDark,
        '&:hover': {
          borderColor: primaryDark,
          backgroundColor: `${primaryColor}10`
        }
      }}
      onClick={() => handleViewResponses(survey, false)}
    >
      عرض الردود
    </Button>

    <Button
      variant="outlined"
      size="small"
      startIcon={<Edit />}
      sx={{
        fontFamily: '"Cairo", sans-serif',
        fontSize: '0.75rem',
        borderColor: primaryColor,
        color: primaryDark,
        '&:hover': {
          borderColor: primaryDark,
          backgroundColor: `${primaryColor}10`
        }
      }}
      onClick={() => handleEditSurvey(survey)}
    >
      تعديل
    </Button>

    <Button
      variant="outlined"
      size="small"
      startIcon={<ContentCopy />}
      sx={{
        fontFamily: '"Cairo", sans-serif',
        fontSize: '0.75rem',
        borderColor: '#1976d2',
        color: '#1976d2',
        '&:hover': {
          borderColor: '#115293',
          backgroundColor: 'rgba(25, 118, 210, 0.08)'
        }
      }}
      onClick={() => handleDuplicateSurvey(survey, false)}
    >
      نسخ
    </Button>

    <Button
      variant="outlined"
      size="small"
      startIcon={<Delete />}
      sx={{
        fontFamily: '"Cairo", sans-serif',
        fontSize: '0.75rem',
        borderColor: '#d32f2f',
        color: '#d32f2f',
        '&:hover': {
          borderColor: '#b71c1c',
          backgroundColor: 'rgba(211, 47, 47, 0.08)'
        }
      }}
      onClick={() => handleDeleteSurvey(survey.id, false)}
    >
      حذف
    </Button>

    <Button
      startIcon={<Download />}
      variant="contained"
      size="small"
      sx={{
        backgroundColor: '#28a745',
        color: 'white',
        fontFamily: '"Cairo", sans-serif',
        '&:hover': {
          backgroundColor: '#218838'
        }
      }}
      onClick={() => handleExportReport(survey, false)}
      disabled={
        !surveyResponses[survey.id] ||
        surveyResponses[survey.id].length === 0
      }
    >
      تصدير التقرير
    </Button>
  </Box>
</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

const renderExternalSurveysTable = () => (
  <TableContainer
    component={Paper}
    sx={{
      borderRadius: 3,
      border: `1px solid ${primaryLight}`,
      overflowX: 'auto'
    }}
  >
    <Table sx={{ minWidth: 900 }}>
      <TableHead sx={{ backgroundColor: backgroundColor }}>
        <TableRow>
          <TableCell
            sx={{
              fontWeight: 'bold',
              color: primaryDark,
              fontFamily: '"Cairo", sans-serif',
              width: '22%'
            }}
          >
            البيانات الأساسية
          </TableCell>

          <TableCell
            sx={{
              fontWeight: 'bold',
              color: primaryDark,
              fontFamily: '"Cairo", sans-serif',
              width: '10%',
              textAlign: 'center'
            }}
          >
            عدد الردود
          </TableCell>

          <TableCell
            sx={{
              fontWeight: 'bold',
              color: primaryDark,
              fontFamily: '"Cairo", sans-serif',
              width: '46%'
            }}
          >
            لينك الاستبيان
          </TableCell>

          <TableCell
            sx={{
              fontWeight: 'bold',
              color: primaryDark,
              fontFamily: '"Cairo", sans-serif',
              width: '22%'
            }}
          >
            الإجراءات
          </TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {allExternalSurveys.map((survey) => {
          const surveyLink = generateSurveyLink(survey);

          const branchNames =
            survey.target_branches?.map((branchGuid) => {
              const branch = branches.find((b) => b.guid === branchGuid);
              return branch ? branch.name : 'فرع غير معروف';
            }) || [];

          const diplomaNames = survey.target_diplomas?.includes('all')
            ? ['كل الدبلومات']
            : survey.target_diplomas || [];

          return (
            <TableRow key={survey.id} hover>
              {/* البيانات الأساسية فقط */}
              <TableCell sx={{ fontFamily: '"Cairo", sans-serif' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography
                    sx={{
                      fontFamily: '"Cairo", sans-serif',
                      fontWeight: 'bold',
                      color: textColor,
                      fontSize: '0.95rem'
                    }}
                  >
                    {survey.title}
                  </Typography>

                  {survey.description && (
                    <Typography
                      variant="caption"
                      sx={{
                        fontFamily: '"Cairo", sans-serif',
                        color: '#666',
                        display: 'block',
                        maxWidth: 260,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                      title={survey.description}
                    >
                      {survey.description}
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    <Chip
                      size="small"
                      label={`من ${formatDate(survey.start_date)}`}
                      sx={chipStyle}
                    />

                    <Chip
                      size="small"
                      label={`إلى ${formatDate(survey.end_date)}`}
                      color={
                        getDaysRemaining(survey.end_date) <= 3
                          ? 'error'
                          : getDaysRemaining(survey.end_date) <= 7
                          ? 'warning'
                          : 'success'
                      }
                    />
                  </Box>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {branchNames.slice(0, 2).map((name, index) => (
                      <Chip
                        key={index}
                        label={name}
                        size="small"
                        sx={chipStyle}
                      />
                    ))}

                    {branchNames.length > 2 && (
                      <Chip
                        label={`+${branchNames.length - 2} فروع`}
                        size="small"
                        sx={chipStyle}
                      />
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {diplomaNames.slice(0, 2).map((name, index) => (
                      <Chip
                        key={index}
                        label={name}
                        size="small"
                        sx={primaryChipStyle}
                      />
                    ))}

                    {diplomaNames.length > 2 && (
                      <Chip
                        label={`+${diplomaNames.length - 2} دبلومات`}
                        size="small"
                        sx={primaryChipStyle}
                      />
                    )}
                  </Box>
                </Box>
              </TableCell>

              {/* عدد الردود */}
              <TableCell
                sx={{
                  fontFamily: '"Cairo", sans-serif',
                  textAlign: 'center',
                  fontWeight: 'bold'
                }}
              >
                {externalSurveyResponses[survey.id]?.length || 0} رد
              </TableCell>

              {/* لينكات الاستبيان */}
              <TableCell sx={{ minWidth: 380 }}>
                {survey.is_trainer_survey && getSurveyTrainers(survey).length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {getSurveyTrainers(survey).map((trainer) => {
                      const trainerSurveyLink = generateSurveyLink(survey, trainer);
                      const trainerName = trainer.fullName || trainer.userName || 'مدرب';

                      return (
                        <Box
  key={trainer.trainerGuid}
  sx={{
    p: 1,
    border: `1px solid ${primaryLight}`,
    borderRadius: 2,
    backgroundColor: '#fff',
    display: 'grid',
    gridTemplateColumns: '1fr auto auto auto',
    alignItems: 'center',
    gap: 1
  }}
>
  <Chip
    label={trainerName}
    size="small"
    sx={{
      ...primaryChipStyle,
      maxWidth: 170,
      '& .MuiChip-label': {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }
    }}
  />

  <Button
    variant="contained"
    size="small"
    sx={{
      backgroundColor: '#2196f3',
      color: 'white',
      fontFamily: '"Cairo", sans-serif',
      fontSize: '0.72rem',
      minWidth: 80,
      '&:hover': {
        backgroundColor: '#1976d2'
      }
    }}
    onClick={() => copySurveyLink(trainerSurveyLink)}
  >
    نسخ
  </Button>

  <IconButton
    size="small"
    onClick={() =>
      exportSurveyQrCode(
        trainerSurveyLink,
        survey.title,
        trainerName
      )
    }
    sx={{
      border: `1px solid ${primaryLight}`,
      color: primaryDark,
      backgroundColor: '#f8fbfa',
      '&:hover': {
        backgroundColor: '#e8f5f1'
      }
    }}
    title="تصدير QR Code"
  >
    <QrCode2 fontSize="small" />
  </IconButton>

  <Button
    variant="outlined"
    size="small"
    sx={{
      fontFamily: '"Cairo", sans-serif',
      fontSize: '0.72rem',
      borderColor: primaryColor,
      color: primaryDark,
      minWidth: 95,
      '&:hover': {
        borderColor: primaryDark,
        backgroundColor: `${primaryColor}10`
      }
    }}
    onClick={() => handleViewResponses(survey, true, trainer)}
  >
    عرض الردود
  </Button>
</Box>
                      );
                    })}
                  </Box>
                ) : (
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto auto',
                      alignItems: 'center',
                      gap: 1,
                      minWidth: 320
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: primaryDark,
                        fontFamily: '"Cairo", sans-serif',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                      title={surveyLink}
                    >
                      {surveyLink}
                    </Typography>

                    <Button
                      variant="contained"
                      size="small"
                      sx={{
                        backgroundColor: '#2196f3',
                        color: 'white',
                        fontFamily: '"Cairo", sans-serif',
                        fontSize: '0.75rem',
                        minWidth: 80,
                        '&:hover': {
                          backgroundColor: '#1976d2'
                        }
                      }}
                      onClick={() => copySurveyLink(surveyLink)}
                    >
                      نسخ
                    </Button>

                    <IconButton
                      size="small"
                      onClick={() => exportSurveyQrCode(surveyLink, survey.title)}
                      sx={{
                        border: `1px solid ${primaryLight}`,
                        color: primaryDark,
                        backgroundColor: '#f8fbfa',
                        '&:hover': {
                          backgroundColor: '#e8f5f1'
                        }
                      }}
                      title="تصدير QR Code"
                    >
                      <QrCode2 fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </TableCell>

              {/* الإجراءات */}
              <TableCell>
  <Box
    sx={{
      display: 'flex',
      gap: 1,
      flexDirection: 'column',
      minWidth: 150
    }}
  >
    <Button
      variant="outlined"
      size="small"
      startIcon={<Visibility />}
      sx={{
        fontFamily: '"Cairo", sans-serif',
        fontSize: '0.75rem',
        borderColor: primaryColor,
        color: primaryDark,
        '&:hover': {
          borderColor: primaryDark,
          backgroundColor: `${primaryColor}10`
        }
      }}
      onClick={() => handleViewResponses(survey, true)}
    >
      عرض كل الردود
    </Button>

    <Button
      variant="outlined"
      size="small"
      startIcon={<Edit />}
      sx={{
        fontFamily: '"Cairo", sans-serif',
        fontSize: '0.75rem',
        borderColor: primaryColor,
        color: primaryDark,
        '&:hover': {
          borderColor: primaryDark,
          backgroundColor: `${primaryColor}10`
        }
      }}
      onClick={() => handleEditExternalSurvey(survey)}
    >
      تعديل
    </Button>

    <Button
      variant="outlined"
      size="small"
      startIcon={<ContentCopy />}
      sx={{
        fontFamily: '"Cairo", sans-serif',
        fontSize: '0.75rem',
        borderColor: '#1976d2',
        color: '#1976d2',
        '&:hover': {
          borderColor: '#115293',
          backgroundColor: 'rgba(25, 118, 210, 0.08)'
        }
      }}
      onClick={() => handleDuplicateSurvey(survey, true)}
    >
      نسخ
    </Button>

    <Button
      variant="outlined"
      size="small"
      startIcon={<Delete />}
      sx={{
        fontFamily: '"Cairo", sans-serif',
        fontSize: '0.75rem',
        borderColor: '#d32f2f',
        color: '#d32f2f',
        '&:hover': {
          borderColor: '#b71c1c',
          backgroundColor: 'rgba(211, 47, 47, 0.08)'
        }
      }}
      onClick={() => handleDeleteSurvey(survey.id, true)}
    >
      حذف
    </Button>

    <Button
      startIcon={<Download />}
      variant="contained"
      size="small"
      sx={{
        backgroundColor: '#28a745',
        color: 'white',
        fontFamily: '"Cairo", sans-serif',
        '&:hover': {
          backgroundColor: '#218838'
        }
      }}
      onClick={() => handleExportReport(survey, true)}
      disabled={
        !externalSurveyResponses[survey.id] ||
        externalSurveyResponses[survey.id].length === 0
      }
    >
      تصدير التقرير
    </Button>
  </Box>
</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </TableContainer>
);

  const renderResponsesView = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: primaryDark, fontFamily: '"Cairo", sans-serif', mb: 3 }}>
        الردود على الاستبيانات الداخلية
      </Typography>
      {allSurveys.map((survey) => (
        <Card key={survey.id} sx={{ ...cardStyle, mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ color: primaryDark, fontFamily: '"Cairo", sans-serif' }}>
                {survey.title}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Chip 
                  label={`${surveyResponses[survey.id]?.length || 0} رد`}
                  color="primary"
                />
                <Button
                  startIcon={<Download />}
                  variant="contained"
                  size="small"
                  sx={{
                    backgroundColor: '#28a745',
                    color: 'white',
                    fontFamily: '"Cairo", sans-serif',
                    '&:hover': {
                      backgroundColor: '#218838',
                    }
                  }}
                  onClick={() => handleExportReport(survey, false)}
                  disabled={!surveyResponses[survey.id] || surveyResponses[survey.id].length === 0}
                >
                  تصدير التقرير
                </Button>
              </Box>
            </Box>
            
            {surveyResponses[survey.id]?.map((response, index) => (
              <Accordion key={index} sx={{ mb: 2, border: `1px solid ${primaryLight}`, borderRadius: '8px !important' }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <EmployeeAvatar 
                      userGuid={response.employee_guid} 
                      employeeName={response.employee_name} 
                    />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography sx={{ fontWeight: 'bold', fontFamily: '"Cairo", sans-serif' }}>
                        {response.employee_name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: primaryDark, fontFamily: '"Cairo", sans-serif' }}>
                        {response.department} - {formatDate(response.submitted_at)}
                      </Typography>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {renderResponseDetails(response, survey.questions || [], false)}
                </AccordionDetails>
              </Accordion>
            ))}
            
            {(!surveyResponses[survey.id] || surveyResponses[survey.id].length === 0) && (
              <Typography sx={{ color: primaryDark, fontFamily: '"Cairo", sans-serif', textAlign: 'center', py: 3 }}>
                لا توجد ردود على هذا الاستبيان بعد
              </Typography>
            )}
          </CardContent>
        </Card>
      ))}

      <Typography variant="h6" gutterBottom sx={{ color: primaryDark, fontFamily: '"Cairo", sans-serif', mb: 3, mt: 4 }}>
        الردود على الاستبيانات الخارجية
      </Typography>
      {allExternalSurveys.map((survey) => (
        <Card key={survey.id} sx={{ ...cardStyle, mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ color: primaryDark, fontFamily: '"Cairo", sans-serif' }}>
                {survey.title}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Chip 
                  label={`${externalSurveyResponses[survey.id]?.length || 0} رد`}
                  color="primary"
                />
                <Button
                  startIcon={<Download />}
                  variant="contained"
                  size="small"
                  sx={{
                    backgroundColor: '#28a745',
                    color: 'white',
                    fontFamily: '"Cairo", sans-serif',
                    '&:hover': {
                      backgroundColor: '#218838',
                    }
                  }}
                  onClick={() => handleExportReport(survey, true)}
                  disabled={!externalSurveyResponses[survey.id] || externalSurveyResponses[survey.id].length === 0}
                >
                  تصدير التقرير
                </Button>
              </Box>
            </Box>
            
            {externalSurveyResponses[survey.id]?.map((response, index) => (
              <Accordion key={index} sx={{ mb: 2, border: `1px solid ${primaryLight}`, borderRadius: '8px !important' }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <Avatar sx={{ 
                      width: 60, 
                      height: 60, 
                      backgroundColor: primaryColor,
                      border: `2px solid ${primaryLight}`,
                      fontSize: '1.2rem',
                      fontWeight: 'bold'
                    }}>
                      {response.student_name?.charAt(0)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography sx={{ fontWeight: 'bold', fontFamily: '"Cairo", sans-serif' }}>
                        {response.student_name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: primaryDark, fontFamily: '"Cairo", sans-serif' }}>
                        {response.diplom_name} - {response.branch_name} - {formatDate(response.submitted_at)}
                      </Typography>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {renderResponseDetails(response, survey.questions || [], true)}
                </AccordionDetails>
              </Accordion>
            ))}
            
            {(!externalSurveyResponses[survey.id] || externalSurveyResponses[survey.id].length === 0) && (
              <Typography sx={{ color: primaryDark, fontFamily: '"Cairo", sans-serif', textAlign: 'center', py: 3 }}>
                لا توجد ردود على هذا الاستبيان بعد
              </Typography>
            )}
          </CardContent>
        </Card>
      ))}
    </Box>
  );

  const renderExternalSurveysView = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ color: primaryDark, fontFamily: '"Cairo", sans-serif' }}>
          الاستبيانات الخارجية للعملاء
        </Typography>
        <Button 
          startIcon={<Add />}
          onClick={handleOpenCreateExternalDialog}
          variant="contained"
          sx={primaryButtonStyle}
        >
          إنشاء استبيان خارجي
        </Button>
      </Box>

      {loadingExternalSurveys ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
          <CircularProgress sx={{ color: primaryColor }} />
          <Typography sx={{ marginInlineStart: 2, fontFamily: '"Cairo", sans-serif' }}>
            جاري تحميل البيانات...
          </Typography>
        </Box>
      ) : (
        renderExternalSurveysTable()
      )}
    </Box>
  );

  const renderLoadingState = () => (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      py: 8,
      flexDirection: 'column',
      gap: 2
    }}>
      <CircularProgress 
        size={60} 
        sx={{ color: primaryColor }} 
      />
      <Typography 
        variant="h6" 
        sx={{ 
          color: primaryDark, 
          fontFamily: '"Cairo", sans-serif',
          fontWeight: 'bold'
        }}
      >
        جاري تحميل البيانات...
      </Typography>
    </Box>
  );

  return (
    <NavigationShell variant="standard" ><Box sx={containerStyle}>
      
      
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Container 
          maxWidth={false}
          sx={{
            py: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            transition: 'all 0.3s ease',
            ...navigationContentSx
          }}
        >
          <Paper sx={mainPaperStyle}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Typography 
                variant="h4" 
                component="h1" 
                sx={{
                  color: primaryDark,
                  fontWeight: 'bold',
                  fontFamily: '"Cairo", sans-serif'
                }}
              >
                إدارة الاستبيانات
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button 
                  startIcon={<Add />}
                  onClick={handleOpenCreateExternalDialog}
                  variant="outlined"
                 sx={{
  ...outlinedButtonStyle,
  mt: 0,
  borderColor: '#ff9800',
  color: '#ff9800',
  '&:hover': {
    borderColor: '#f57c00',
    backgroundColor: 'rgba(255, 152, 0, 0.1)'
  }
}}
                >
                  استبيان خارجي
                </Button>
                <Button 
                  startIcon={<Add />}
                  onClick={handleOpenCreateDialog}
                  variant="contained"
                  sx={primaryButtonStyle}
                >
                  استبيان داخلي
                </Button>
              </Box>
            </Box>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
              <Tabs 
  value={activeTab} 
  onChange={(e, newValue) => setActiveTab(newValue)}
  sx={{
    '& .MuiTab-root': {
      fontFamily: '"Cairo", sans-serif',
      fontWeight: 'bold',
      fontSize: '1rem'
    },
    '& .Mui-selected': {
      color: primaryColor
    }
  }}
>
  <Tab sx={hrTabIconSx} 
    icon={<Poll />}
    iconPosition="start"
    label="الاستبيانات الداخلية" 
  />
  <Tab sx={hrTabIconSx} 
    icon={<Groups />}
    iconPosition="start"
    label="الاستبيانات الخارجية" 
  />
  <Tab sx={hrTabIconSx} 
    icon={<History />}
    iconPosition="start"
    label="الردود والمشاركات" 
  />

  {/* 👇 الجديد */}
  <Tab sx={hrTabIconSx} 
    icon={<Quiz />}
    iconPosition="start"
    label="الاختبارات" 
  />
</Tabs>
            </Box>

            {/* Content */}
            {loadingSurveys ? (
              renderLoadingState()
            ) : (
              <>
                {activeTab === 0 && renderSurveysTable()}
                {activeTab === 1 && renderExternalSurveysView()}
                {activeTab === 2 && renderResponsesView()}
                {activeTab === 3 && <HRCreateExams />}
              </>
            )}

            {/* Create Internal Survey Dialog */}
            <Dialog 
              open={showCreateDialog} 
              onClose={handleCloseCreateDialog}
              maxWidth="md"
              fullWidth
              PaperProps={{
                sx: {
                  borderRadius: 3,
                  background: 'white'
                }
              }}
            >
              <DialogTitle sx={{ fontFamily: '"Cairo", sans-serif', color: primaryDark }}>
  {isEditMode ? 'تعديل استبيان داخلي' : 'إنشاء استبيان داخلي'}
</DialogTitle>

              <DialogContent sx={{ p: 4 }}>
                <Stepper activeStep={activeStep} sx={{ m: 4 }}>
                  {steps.map((label) => (
                    <Step key={label}>
                      <StepLabel sx={{ 
                        '& .MuiStepLabel-label': { 
                          fontWeight: 'bold', 
                          fontSize: '0.9rem',
                          fontFamily: '"Cairo", sans-serif'
                        } 
                      }}>
                        {label}
                      </StepLabel>
                    </Step>
                  ))}
                </Stepper>

                <Box sx={{ minHeight: '400px'}}>
                  {activeStep === 0 && renderBasicInfoStep(false)}
                  {activeStep === 1 && renderRecipientsStep()}
                  {activeStep === 2 && renderQuestionsStep(false)}
                  {activeStep === 3 && renderReviewStep(false)}
                </Box>
              </DialogContent>

              <DialogActions sx={{ p: 3, gap: 2, justifyContent: 'space-between' }}>
                <Box>
                  <Button
                    onClick={handleNext}
                    disabled={activeStep === steps.length - 1}
                    endIcon={<ArrowBack />}
                    sx={primaryButtonStyle}
                  >
                    التالي
                  </Button>
                  
                  <Button
                    onClick={handleBack}
                    startIcon={<ArrowForward />}
                    sx={outlinedButtonStyle}
                    disabled={activeStep === 0}
                  >
                    رجوع
                  </Button>
                </Box>
                
                {activeStep === steps.length - 1 ? (
                 <Button
  onClick={() => handleSubmit(false)}
  variant="contained"
  sx={primaryButtonStyle}
>
  {isEditMode ? 'حفظ التعديل' : 'إنشاء الاستبيان'}
</Button>
                ) : null}
              </DialogActions>
            </Dialog>

            {/* Create External Survey Dialog */}
            <Dialog 
              open={showCreateExternalDialog} 
              onClose={handleCloseCreateExternalDialog}
              maxWidth="md"
              fullWidth
              PaperProps={{
                sx: {
                  borderRadius: 3,
                  background: 'white'
                }
              }}
            >
              <DialogTitle sx={{ fontFamily: '"Cairo", sans-serif', color: primaryDark }}>
  {isExternalEditMode ? 'تعديل استبيان خارجي' : 'إنشاء استبيان خارجي'}
</DialogTitle>

              <DialogContent sx={{ p: 4 }}>
                <Stepper activeStep={activeStep} sx={{ m: 4 }}>
                  {externalSteps.map((label) => (
                    <Step key={label}>
                      <StepLabel sx={{ 
                        '& .MuiStepLabel-label': { 
                          fontWeight: 'bold', 
                          fontSize: '0.9rem',
                          fontFamily: '"Cairo", sans-serif'
                        } 
                      }}>
                        {label}
                      </StepLabel>
                    </Step>
                  ))}
                </Stepper>

                <Box sx={{ minHeight: '400px'}}>
                  {activeStep === 0 && renderBasicInfoStep(true)}
                  {activeStep === 1 && renderBranchesDiplomasStep()}
                  {activeStep === 2 && renderQuestionsStep(true)}
                  {activeStep === 3 && renderReviewStep(true)}
                </Box>
              </DialogContent>

              <DialogActions sx={{ p: 3, gap: 2, justifyContent: 'space-between' }}>
                <Box>
                  <Button
                    onClick={handleNext}
                    disabled={activeStep === externalSteps.length - 1}
                    endIcon={<ArrowBack />}
                    sx={{
                      ...primaryButtonStyle,
                      background: `linear-gradient(135deg, #ff9800 0%, #f57c00 100%)`,
                      '&:hover': {
                        background: `linear-gradient(135deg, #f57c00 0%, #ef6c00 100%)`,
                      }
                    }}
                  >
                    التالي
                  </Button>
                  
                  <Button
                    onClick={handleBack}
                    startIcon={<ArrowForward />}
                    sx={{
                      ...outlinedButtonStyle,
                      borderColor: '#ff9800',
                      color: '#ff9800',
                      '&:hover': {
                        borderColor: '#f57c00',
                        backgroundColor: 'rgba(255, 152, 0, 0.1)'
                      }
                    }}
                    disabled={activeStep === 0}
                  >
                    رجوع
                  </Button>
                </Box>
                
                {activeStep === externalSteps.length - 1 ? (
                  <Button 
                    onClick={() => handleSubmit(true)}
                    variant="contained"
                    disabled={!isExternalFormValid}
                    sx={{
                      ...primaryButtonStyle,
                      background: `linear-gradient(135deg, #28a745 0%, #20c997 100%)`,
                      '&:hover': {
                        background: `linear-gradient(135deg, #20c997 0%, #1e9e8a 100%)`,
                      },
                      '&:disabled': {
                        background: '#ccc'
                      }
                    }}
                  >
                   {isExternalEditMode ? 'حفظ التعديل' : 'إنشاء الاستبيان الخارجي'}
                  </Button>
                ) : null}
              </DialogActions>
            </Dialog>

            {/* Responses Details Dialog */}
           <Dialog
  open={responsesDialogOpen}
  onClose={() => setResponsesDialogOpen(false)}
  maxWidth="xl"
  fullWidth
  PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
>
  <DialogTitle
    sx={{
      background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryDark} 100%)`,
      color: 'white',
      fontFamily: '"Cairo", sans-serif',
      fontWeight: 'bold',
      py: 2
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Visibility />
        <Typography variant="h6" sx={{ fontFamily: '"Cairo", sans-serif', fontWeight: 'bold' }}>
         عرض الردود - {responsesDialogSurvey?.title || ''}
{responsesDialogSurvey?.trainer_filter_name
  ? ` - ${responsesDialogSurvey.trainer_filter_name}`
  : ''}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          startIcon={<Download />}
          variant="contained"
          sx={{
            backgroundColor: '#28a745',
            fontFamily: '"Cairo", sans-serif',
            '&:hover': { backgroundColor: '#218838' }
          }}
          disabled={!responsesDialogSurvey}
          onClick={() => handleExportExcel(responsesDialogSurvey, responsesDialogSurvey?.isExternal)}
        >
          تصدير Excel
        </Button>

        <IconButton onClick={() => setResponsesDialogOpen(false)} sx={{ color: 'white' }}>
          <Close />
        </IconButton>
      </Box>
    </Box>
  </DialogTitle>

  <DialogContent sx={{ p: 0 }}>
    {responsesDialogSurvey ? (
      <ResponsesMasterDetail
        survey={responsesDialogSurvey}
        isExternal={responsesDialogSurvey.isExternal}
      responses={getDialogResponses()}
        users={users}
        onSelect={(row) => setSelectedResponseRow(row)}
        selected={selectedResponseRow}
        search={responsesSearch}
        setSearch={setResponsesSearch}
        renderDetails={(row) =>
          row ? renderResponseDetails(row, responsesDialogSurvey.questions || [], responsesDialogSurvey.isExternal) : null
        }
      />
    ) : null}
  </DialogContent>

  <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
    <Typography variant="caption" sx={{ fontFamily: '"Cairo", sans-serif', color: primaryDark }}>
      اختر صف من الجدول لعرض التفاصيل يمينًا.
    </Typography>

    <Button variant="outlined" sx={outlinedButtonStyle} onClick={() => setResponsesDialogOpen(false)}>
      إغلاق
    </Button>
  </DialogActions>
</Dialog>

          </Paper>
        </Container>
      </LocalizationProvider>
    </Box></NavigationShell>
  );
};

export default HRCreateSurvey;