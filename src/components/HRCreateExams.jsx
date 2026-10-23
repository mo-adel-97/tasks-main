import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import QRCode from 'qrcode';
import { QrCode2, FileDownload } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import {
  splitSection,
  stripSection,
  joinSection,
  sectionRuns,
  orderBySection
} from '../utils/questionSections';
import { useTheme } from '@mui/material/styles';
import {
  Pagination,
  GlobalStyles,
  Container,
  Paper,
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Radio,
  CircularProgress,
  Divider,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip
} from '@mui/material';

import { bestAttemptPerStudent } from '../utils/examAttempts';
import {
  Add,
  Delete,
  Edit,
  Visibility,
  ExpandMore,
  CheckCircle,
  Search,
  Quiz,
  Close,
  Save,
  ContentCopy,
  FileCopy,
  AddPhotoAlternate,
  OpenInNew,
  Assessment,
  Cancel
} from '@mui/icons-material';

const primaryColor = '#80b49e';
const primaryDark = '#6a9a87';
const primaryLight = '#9ac9b5';
const backgroundColor = '#f8fbfa';
const textColor = '#2c3e50';
const focusBorderColor = '#67C99D';

const EXAM_API_BASE_URL = 'https://filesregsiteration.sstli.com/erp/exam_api.php';
const STUDENT_EXAM_BASE_URL = 'http://examsforstudents.sstli.com';

const EXAMS_PER_PAGE = 12;
const USERS_CACHE_TTL_MS = 5 * 60 * 1000;
const EXAMS_CACHE_TTL_MS = 60 * 1000;

const readSessionCache = (key, ttlMs) => {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const timestamp = Number(parsed?.timestamp || 0);

    if (!timestamp || Date.now() - timestamp > ttlMs) {
      sessionStorage.removeItem(key);
      return null;
    }

    return parsed?.data ?? null;
  } catch {
    return null;
  }
};

const writeSessionCache = (key, data) => {
  try {
    sessionStorage.setItem(
      key,
      JSON.stringify({
        timestamp: Date.now(),
        data
      })
    );
  } catch {
    // Cache is an optimization only.
  }
};

// استضافة الاختبارات (Hostinger) بترفض الطلبات المتوازية الكتير بخطأ 500 فاضي (من غير أي رد).
// الخطأ ده بيحصل قبل ما الطلب يتنفذ، فإعادة المحاولة آمنة. أخطاء الـ API الحقيقية بترجع JSON وما بتتعادش.
const EXAM_RETRY_DELAYS = [400, 900, 1800, 3000, 5000];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// انقطاع النت بيتعاد في القراءة بس (الحفظ ممكن يكون اتنفذ قبل الانقطاع)
const isExamOverload = (error, method) => {
  const response = error?.response;
  if (!response) return method === 'get' && !axios.isCancel?.(error);
  const emptyBody = response.data === '' || response.data == null;
  return [500, 502, 503, 504, 508].includes(response.status) && emptyBody;
};

const withExamRetry = async (method, url, request) => {
  if (!String(url).startsWith(EXAM_API_BASE_URL)) return request();
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await request();
    } catch (error) {
      if (attempt >= EXAM_RETRY_DELAYS.length || !isExamOverload(error, method)) throw error;
      await sleep(EXAM_RETRY_DELAYS[attempt] + Math.floor(Math.random() * 300));
    }
  }
};

const examHttp = {
  get: (url, ...rest) => withExamRetry('get', url, () => axios.get(url, ...rest)),
  post: (url, ...rest) => withExamRetry('post', url, () => axios.post(url, ...rest))
};

// طلبين بس في نفس الوقت عشان الاستضافة ما ترفضش
const runInBatches = async (items, worker, batchSize = 2) => {
  for (let start = 0; start < items.length; start += batchSize) {
    const batch = items.slice(start, start + batchSize);
    await Promise.all(batch.map(worker));
  }
};

const EXAM_ADMINS = [
  'f426653a-b389-4036-95f0-907920e7f205',
  '3f69ccb6-e2cf-4d6d-b801-7d727c977d8e',
  '35efb423-5491-4775-a5cc-98625fb66fa5'
];

const emptyExam = (currentUser = {}) => ({
  title: '',
  description: '',
  start_date: '',
  end_date: '',
  duration_minutes: 30,
  pass_score: 50,
  is_active: 1,
  created_by_guid: currentUser?.guid || '',
  created_by_name: currentUser?.fullName || currentUser?.userName || '',
  questions: [newExamQuestion()]
});

// sectionKey معرف داخلي للقسم في المحرر بس (عشان مسح الاسم أثناء الكتابة ما يدمجش الأقسام)،
// واللي بيتحفظ هو اسم القسم (section) كبادئة في نص السؤال.
const newSectionKey = () => `sec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const sectionKeyFromTitle = (title) => (title ? `title:${title}` : '');

// سؤال جديد فاضي، اختياري يتحدد قسمه ونوعه.
function newExamQuestion(section = '', type = 'single_choice', sectionKey = sectionKeyFromTitle(section)) {
  return {
    sectionKey,
    section,
    text: '',
    type,
    points: 1,
    answers:
      type === 'true_false'
        ? [
            { text: 'صح', is_correct: 1 },
            { text: 'غلط', is_correct: 0 }
          ]
        : [
            { text: '', is_correct: 1 },
            { text: '', is_correct: 0 }
          ]
  };
}

// عنوان قسم داخل عرض الأسئلة (تفاصيل الاختبار / النتائج).
const SectionHeading = ({ title, isDark }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      mt: 2.5,
      mb: 1.2,
      px: 1.5,
      py: 1,
      borderRadius: 2,
      borderInlineStart: `5px solid ${primaryColor}`,
      backgroundColor: isDark ? 'rgba(128,180,158,0.12)' : '#eef7f2'
    }}
  >
    <Typography sx={{ fontWeight: 900, color: isDark ? '#cfe7dc' : primaryDark }}>
      {title}
    </Typography>
  </Box>
);

const pickAttachment = (item = {}) => ({
  attachment_url: item.attachment_url || '',
  attachment_name: item.attachment_name || '',
  attachment_type: item.attachment_type || ''
});

const isImageAttachment = (item = {}) =>
  String(item.attachment_type || '').startsWith('image/') ||
  /\.(jpe?g|png|gif|webp)$/i.test(String(item.attachment_url || '').split('?')[0]);

const uploadAttachment = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await examHttp.post(
    `${EXAM_API_BASE_URL}?action=upload_attachment`,
    formData,
    { timeout: 60000 }
  );

  if (!response.data.success) {
    throw new Error(response.data.message || 'فشل رفع الصورة');
  }

  return {
    attachment_url: response.data.data.url,
    attachment_name: response.data.data.name,
    attachment_type: response.data.data.type
  };
};

const AttachmentField = ({ item, onChange, compact = false }) => {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showErrorAlert('مسموح برفع الصور فقط');
      return;
    }

    setUploading(true);
    try {
      onChange(await uploadAttachment(file));
    } catch (error) {
      console.error(error);
      showErrorAlert(error?.message || 'فشل رفع الصورة');
    } finally {
      setUploading(false);
    }
  };

  const size = compact ? 56 : 120;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFile} />

      {item.attachment_url ? (
        <>
          {isImageAttachment(item) ? (
            <Box
              component="img"
              src={item.attachment_url}
              alt={item.attachment_name}
              onClick={() => window.open(item.attachment_url, '_blank')}
              sx={{ width: size, height: size, objectFit: 'cover', borderRadius: 1.5, border: '1px solid #ddd', cursor: 'pointer' }}
            />
          ) : (
            <Chip size="small" label={item.attachment_name || 'مرفق'} />
          )}

          <Tooltip title="تغيير الصورة">
            <IconButton size="small" onClick={() => inputRef.current?.click()} disabled={uploading}>
              {uploading ? <CircularProgress size={18} /> : <Edit fontSize="small" />}
            </IconButton>
          </Tooltip>

          <Tooltip title="حذف الصورة">
            <IconButton
              size="small"
              color="error"
              onClick={() => onChange({ attachment_url: '', attachment_name: '', attachment_type: '' })}
            >
              <Close fontSize="small" />
            </IconButton>
          </Tooltip>
        </>
      ) : compact ? (
        <Tooltip title="إضافة صورة للإجابة">
          <IconButton onClick={() => inputRef.current?.click()} disabled={uploading} sx={{ color: primaryDark }}>
            {uploading ? <CircularProgress size={20} /> : <AddPhotoAlternate />}
          </IconButton>
        </Tooltip>
      ) : (
        <Button
          size="small"
          variant="outlined"
          startIcon={uploading ? <CircularProgress size={16} /> : <AddPhotoAlternate />}
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'جاري الرفع...' : 'إضافة صورة للسؤال'}
        </Button>
      )}
    </Box>
  );
};

const showSuccessAlert = (message) => {
  Swal.fire({
    title: 'نجاح',
    text: message,
    icon: 'success',
    confirmButtonText: 'موافق',
    confirmButtonColor: primaryColor
  });
};

const showErrorAlert = (message) => {
  Swal.fire({
    title: 'خطأ',
    text: message,
    icon: 'error',
    confirmButtonText: 'موافق',
    confirmButtonColor: '#d32f2f'
  });
};

const HRCreateExams = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const surfaces = theme.palette.surfaces || {};
  const darkCard = surfaces.card || '#13251d';
  const darkSection = surfaces.section || '#172b22';
  const darkNested = surfaces.nested || '#1b3328';
  const darkHover = surfaces.hover || '#214333';

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserGuid = currentUser?.guid || '';
  const isExamAdmin = EXAM_ADMINS.includes(String(currentUserGuid).toLowerCase());

  const [users, setUsers] = useState([]);
  const [allExams, setAllExams] = useState([]);
  const [loadingExams, setLoadingExams] = useState(false);
  const [examSearch, setExamSearch] = useState('');
  const deferredExamSearch = useDeferredValue(examSearch);
  const [examPage, setExamPage] = useState(1);
  const examDetailsCacheRef = useRef(new Map());

  const [showCreateExamDialog, setShowCreateExamDialog] = useState(false);
  const [showExamDetailsDialog, setShowExamDetailsDialog] = useState(false);
  const [selectedExamDetails, setSelectedExamDetails] = useState(null);

  const [showAttemptsDialog, setShowAttemptsDialog] = useState(false);
  const [selectedExamAttempts, setSelectedExamAttempts] = useState(null);
  const [loadingAttempts, setLoadingAttempts] = useState(false);

  const [isEditMode, setIsEditMode] = useState(false);
  const [examForm, setExamForm] = useState(emptyExam(currentUser));

  useEffect(() => {
    initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const usersCacheKey = 'sstli_exam_users_v1';
  const examsCacheKey = `sstli_exam_list_v2_${String(currentUserGuid || 'guest').toLowerCase()}_${
    isExamAdmin ? 'admin' : 'user'
  }`;

  const initializeData = async () => {
    const cachedUsers = readSessionCache(usersCacheKey, USERS_CACHE_TTL_MS);
    const cachedExams = readSessionCache(examsCacheKey, EXAMS_CACHE_TTL_MS);

    if (Array.isArray(cachedUsers)) {
      setUsers(cachedUsers);
    }

    if (Array.isArray(cachedExams)) {
      setAllExams(cachedExams);
    }

    await Promise.allSettled([
      fetchUsers({ silent: Array.isArray(cachedUsers) }),
      fetchAllExams({ silent: Array.isArray(cachedExams) })
    ]);
  };

  const fetchUsers = async ({ silent = false } = {}) => {
    try {
      const response = await examHttp.get(
        'https://api1.sstli.com/api/userinfo',
        { timeout: 20000 }
      );

      const nextUsers = Array.isArray(response.data) ? response.data : [];
      setUsers(nextUsers);
      writeSessionCache(usersCacheKey, nextUsers);
    } catch (error) {
      console.error(error);

      if (!silent) {
        setUsers((current) => (current.length ? current : []));
      }
    }
  };

  const fetchAllExams = async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        setLoadingExams(true);
      }

      const response = await examHttp.get(
        `${EXAM_API_BASE_URL}?action=get_exams`,
        { timeout: 30000 }
      );

      if (response.data.success) {
        let exams = Array.isArray(response.data.data)
          ? response.data.data
          : [];

        if (!isExamAdmin) {
          exams = exams.filter(
            (e) =>
              String(e.created_by_guid || '').toLowerCase() ===
              String(currentUserGuid).toLowerCase()
          );
        }

        setAllExams(exams);
        writeSessionCache(examsCacheKey, exams);
      } else if (!silent) {
        setAllExams([]);
        showErrorAlert(response.data.message || 'فشل في جلب الاختبارات');
      }
    } catch (error) {
      console.error(error);

      if (!silent) {
        showErrorAlert('حدث خطأ أثناء جلب الاختبارات');
      }
    } finally {
      if (!silent) {
        setLoadingExams(false);
      }
    }
  };

  const usersByGuid = useMemo(() => {
    const map = new Map();

    users.forEach((user) => {
      const guid = String(user?.guid || '').toLowerCase();
      if (!guid) return;

      map.set(
        guid,
        user?.fullName || user?.userName || 'غير معروف'
      );
    });

    return map;
  }, [users]);

  const getCreatorName = (guid) => {
    return (
      usersByGuid.get(String(guid || '').toLowerCase()) ||
      'غير معروف'
    );
  };

  const filteredExams = useMemo(() => {
    const term = deferredExamSearch.trim().toLowerCase();
    if (!term) return allExams;

    return allExams.filter((exam) => {
      const creator =
        usersByGuid.get(
          String(exam.created_by_guid || '').toLowerCase()
        ) || 'غير معروف';

      return `${exam.title || ''} ${exam.description || ''} ${creator}`
        .toLowerCase()
        .includes(term);
    });
  }, [allExams, deferredExamSearch, usersByGuid]);

  const totalExamPages = Math.max(
    1,
    Math.ceil(filteredExams.length / EXAMS_PER_PAGE)
  );

  const visibleExams = useMemo(() => {
    const safePage = Math.min(examPage, totalExamPages);
    const start = (safePage - 1) * EXAMS_PER_PAGE;
    return filteredExams.slice(start, start + EXAMS_PER_PAGE);
  }, [filteredExams, examPage, totalExamPages]);

  useEffect(() => {
    setExamPage(1);
  }, [deferredExamSearch]);

  useEffect(() => {
    setExamPage((current) =>
      Math.min(Math.max(1, current), totalExamPages)
    );
  }, [totalExamPages]);

  const fetchExamById = async (examId, { force = false } = {}) => {
    const cacheKey = String(examId);

    if (!force && examDetailsCacheRef.current.has(cacheKey)) {
      return examDetailsCacheRef.current.get(cacheKey);
    }

    const response = await examHttp.get(
      `${EXAM_API_BASE_URL}?action=get_exam&id=${examId}`,
      { timeout: 30000 }
    );

    if (!response.data.success) {
      throw new Error(
        response.data.message || 'فشل في جلب بيانات الاختبار'
      );
    }

    examDetailsCacheRef.current.set(
      cacheKey,
      response.data.data
    );

    return response.data.data;
  };

  const openCreateDialog = () => {
    setIsEditMode(false);
    setExamForm(emptyExam(currentUser));
    setShowCreateExamDialog(true);
  };

  const openEditDialog = async (examId) => {
    try {
      const exam = await fetchExamById(examId);

      setExamForm({
        id: exam.id,
        title: exam.title || '',
        description: exam.description || '',
        start_date: exam.start_date ? String(exam.start_date).slice(0, 10) : '',
        end_date: exam.end_date ? String(exam.end_date).slice(0, 10) : '',
        duration_minutes: Number(exam.duration_minutes || 30),
        pass_score: Number(exam.pass_score || 50),
        is_active: Number(exam.is_active ?? 1),
        created_by_guid: exam.created_by_guid || currentUserGuid,
        created_by_name: exam.created_by_name || currentUser?.fullName || currentUser?.userName || '',
        // أسئلة كل قسم تتجمع جنب بعض في المحرر (لو سؤال اتضاف لقسم بعد الإنشاء وجه في الآخر).
        questions: orderBySection((exam.questions || []).map((q) => ({
          id: q.id,
          question_order: q.question_order,
          section: splitSection(q.question_text).section,
          sectionKey: sectionKeyFromTitle(splitSection(q.question_text).section),
          text: stripSection(q.question_text || ''),
          type: q.question_type || 'single_choice',
          points: Number(q.points || 1),
          ...pickAttachment(q),
          answers: (q.answers || []).map((a) => ({
            id: a.id,
            text: a.answer_text || '',
            is_correct: Number(a.is_correct || 0),
            ...pickAttachment(a)
          }))
        })))
      });

      setIsEditMode(true);
      setShowCreateExamDialog(true);
    } catch (error) {
      console.error(error);
      showErrorAlert('حدث خطأ أثناء فتح التعديل');
    }
  };

  const handleOpenExamDetails = async (examId) => {
    try {
      const exam = await fetchExamById(examId);
      setSelectedExamDetails(exam);
      setShowExamDetailsDialog(true);
    } catch (error) {
      console.error(error);
      showErrorAlert(
        error?.message || 'حدث خطأ أثناء جلب تفاصيل الاختبار'
      );
    }
  };

  const handleOpenExamAttempts = async (examId) => {
    try {
      setLoadingAttempts(true);
      setShowAttemptsDialog(true);
      setSelectedExamAttempts(null);

      const response = await examHttp.get(`${EXAM_API_BASE_URL}?action=get_exam_attempts&exam_id=${examId}`);

      if (response.data.success) {
        const data = response.data.data || {};
        const allAttempts = data.attempts || [];
        // أعلى نتيجة لكل طالب (الطالب ممكن يختبر أكثر من مرة)
        setSelectedExamAttempts({
          ...data,
          attempts: bestAttemptPerStudent(allAttempts),
          total_attempts: allAttempts.length
        });
      } else {
        showErrorAlert(response.data.message || 'فشل في جلب نتائج الاختبار');
      }
    } catch (error) {
      console.error(error);
      showErrorAlert('حدث خطأ أثناء جلب نتائج الاختبار');
    } finally {
      setLoadingAttempts(false);
    }
  };

  // تصدير نتائج وإجابات الاختبار إلى Excel (xlsx):
  // ملخص لكل طالب + الإجابات التفصيلية + مصفوفة (طالب × سؤال) لسهولة التحليل.
  const handleExportAttemptsExcel = () => {
    const exam = selectedExamAttempts?.exam || {};
    const attempts = selectedExamAttempts?.attempts || [];
    if (!attempts.length) return;

    const num = (value) => {
      const n = Number(value);
      return Number.isFinite(n) ? n : value ?? '';
    };
    const isPassed = (attempt) => Number(attempt.is_passed) === 1;
    const isCorrect = (answer) => Number(answer.is_correct) === 1;

    const summaryRows = attempts.map((attempt, index) => ({
      '#': index + 1,
      'اسم الطالب': attempt.student_name || '',
      'رقم الهوية': String(attempt.national_id ?? ''),
      'الجوال': String(attempt.student_tel ?? ''),
      'البريد': attempt.student_email || '',
      'وقت الإرسال': attempt.submitted_at || '',
      'الدرجة': num(attempt.score),
      'الدرجة الكلية': num(attempt.total_score),
      'النسبة %': num(attempt.percentage),
      'النتيجة': isPassed(attempt) ? 'ناجح' : 'راسب',
      'عدد الإجابات الصحيحة': (attempt.answers || []).filter(isCorrect).length,
      'عدد المحاولات': attempt.attempts_count || 1,
    }));

    // ترتيب الأسئلة من أول محاولة فيها إجابات، والباقي يتضاف بالترتيب لو ظهر.
    const questionOrder = [];
    const questionTitles = new Map();
    attempts.forEach((attempt) =>
      (attempt.answers || []).forEach((answer) => {
        const key = String(answer.question_id ?? answer.question_text);
        if (!questionTitles.has(key)) {
          questionOrder.push(key);
          questionTitles.set(key, `س${questionOrder.length}: ${stripSection(answer.question_text)}`.slice(0, 120));
        }
      })
    );

    const detailRows = attempts.flatMap((attempt) =>
      (attempt.answers || []).map((answer) => ({
        'اسم الطالب': attempt.student_name || '',
        'رقم الهوية': String(attempt.national_id ?? ''),
        'رقم السؤال': questionOrder.indexOf(String(answer.question_id ?? answer.question_text)) + 1,
        'القسم': splitSection(answer.question_text).section,
        'السؤال': stripSection(answer.question_text),
        'إجابة الطالب': answer.selected_answer_text || 'لم تتم الإجابة',
        'الإجابة الصحيحة': answer.correct_answer_text || '',
        'الحالة': isCorrect(answer) ? 'صحيح' : 'خطأ',
        'الدرجة المحققة': num(answer.points_earned),
        'درجة السؤال': num(answer.question_points),
      }))
    );

    const matrixRows = attempts.map((attempt) => {
      const row = {
        'اسم الطالب': attempt.student_name || '',
        'رقم الهوية': String(attempt.national_id ?? ''),
      };
      const byQuestion = new Map(
        (attempt.answers || []).map((answer) => [String(answer.question_id ?? answer.question_text), answer])
      );
      questionOrder.forEach((key) => {
        const answer = byQuestion.get(key);
        row[questionTitles.get(key)] = answer
          ? `${answer.selected_answer_text || 'لم تتم الإجابة'} ${isCorrect(answer) ? '✔' : '✘'}`
          : '';
      });
      row['الدرجة'] = num(attempt.score);
      row['النسبة %'] = num(attempt.percentage);
      row['النتيجة'] = isPassed(attempt) ? 'ناجح' : 'راسب';
      return row;
    });

    const makeSheet = (rows) => {
      const sheet = XLSX.utils.json_to_sheet(rows);
      const headers = Object.keys(rows[0] || {});
      sheet['!cols'] = headers.map((header) => ({
        wch: Math.min(
          50,
          Math.max(String(header).length, ...rows.map((r) => String(r[header] ?? '').length)) + 2
        ),
      }));
      return sheet;
    };

    const workbook = XLSX.utils.book_new();
    workbook.Workbook = { Views: [{ RTL: true }, { RTL: true }, { RTL: true }] };
    XLSX.utils.book_append_sheet(workbook, makeSheet(summaryRows), 'ملخص النتائج');
    if (detailRows.length) {
      XLSX.utils.book_append_sheet(workbook, makeSheet(detailRows), 'الإجابات التفصيلية');
      XLSX.utils.book_append_sheet(workbook, makeSheet(matrixRows), 'مصفوفة الإجابات');
    }

    const safeTitle = String(exam.title || 'اختبار').replace(/[\\/:*?"<>|]/g, '-').trim();
    XLSX.writeFile(workbook, `نتائج وإجابات - ${safeTitle}.xlsx`);
  };

  const updateExamField = (field, value) => {
    setExamForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  // سؤال جديد في آخر الاختبار تابع لآخر قسم.
  const addQuestion = () => {
    setExamForm((prev) => {
      const last = prev.questions[prev.questions.length - 1];
      return {
        ...prev,
        questions: [
          ...prev.questions,
          newExamQuestion(last?.section || '', last?.type, last?.sectionKey || '')
        ]
      };
    });
  };

  // ===== الأقسام =====
  const addSection = () => {
    setExamForm((prev) => {
      const count = sectionRuns(prev.questions, (q) => q.sectionKey || '').filter((run) => run.section).length;
      return {
        ...prev,
        questions: [...prev.questions, newExamQuestion(`القسم ${count + 1}`, 'single_choice', newSectionKey())]
      };
    });
  };

  // سؤال جديد في آخر القسم بنفس نوع آخر سؤال فيه.
  const addQuestionToRun = (run) => {
    setExamForm((prev) => {
      const questions = [...prev.questions];
      const lastInRun = questions[run.end];
      questions.splice(
        run.end + 1,
        0,
        newExamQuestion(lastInRun?.section || '', lastInRun?.type, lastInRun?.sectionKey || '')
      );
      return { ...prev, questions };
    });
  };

  const updateRunQuestions = (run, patch) => {
    setExamForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q, index) =>
        index >= run.start && index <= run.end ? { ...q, ...patch } : q
      )
    }));
  };

  const renameRun = (run, title) => updateRunQuestions(run, { section: title });

  // تحويل أسئلة بدون قسم لقسم جديد.
  const makeRunSection = (run) =>
    updateRunQuestions(run, { section: 'قسم جديد', sectionKey: newSectionKey() });

  // إلغاء القسم: الأسئلة تفضل موجودة لكن بدون قسم.
  const ungroupRun = (run) => updateRunQuestions(run, { section: '', sectionKey: '' });

  const removeQuestion = (questionIndex) => {
    setExamForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, index) => index !== questionIndex)
    }));
  };

  const updateQuestion = (questionIndex, field, value) => {
    setExamForm((prev) => {
      const questions = [...prev.questions];
      questions[questionIndex] = {
        ...questions[questionIndex],
        [field]: value
      };

      if (field === 'type' && value === 'true_false') {
        questions[questionIndex].answers = [
          { text: 'صح', is_correct: 1 },
          { text: 'غلط', is_correct: 0 }
        ];
      }

      return { ...prev, questions };
    });
  };

  const addAnswer = (questionIndex) => {
    setExamForm((prev) => {
      const questions = [...prev.questions];
      questions[questionIndex].answers.push({
        text: '',
        is_correct: 0
      });

      return { ...prev, questions };
    });
  };

  const removeAnswer = (questionIndex, answerIndex) => {
    setExamForm((prev) => {
      const questions = [...prev.questions];
      questions[questionIndex].answers = questions[questionIndex].answers.filter(
        (_, index) => index !== answerIndex
      );

      return { ...prev, questions };
    });
  };

  const updateAnswer = (questionIndex, answerIndex, field, value) => {
    setExamForm((prev) => {
      const questions = [...prev.questions];
      questions[questionIndex].answers[answerIndex] = {
        ...questions[questionIndex].answers[answerIndex],
        [field]: value
      };

      return { ...prev, questions };
    });
  };

  const updateQuestionAttachment = (questionIndex, attachment) => {
    setExamForm((prev) => {
      const questions = [...prev.questions];
      questions[questionIndex] = { ...questions[questionIndex], ...attachment };
      return { ...prev, questions };
    });
  };

  const updateAnswerAttachment = (questionIndex, answerIndex, attachment) => {
    setExamForm((prev) => {
      const questions = [...prev.questions];
      const answers = [...questions[questionIndex].answers];
      answers[answerIndex] = { ...answers[answerIndex], ...attachment };
      questions[questionIndex] = { ...questions[questionIndex], answers };
      return { ...prev, questions };
    });
  };

  const setCorrectAnswer = (questionIndex, answerIndex) => {
    setExamForm((prev) => {
      const questions = [...prev.questions];

      questions[questionIndex].answers = questions[questionIndex].answers.map((answer, index) => ({
        ...answer,
        is_correct: index === answerIndex ? 1 : 0
      }));

      return { ...prev, questions };
    });
  };

  const validateExam = () => {
    if (!examForm.title.trim()) {
      showErrorAlert('عنوان الاختبار مطلوب');
      return false;
    }

    if (!examForm.questions.length) {
      showErrorAlert('يجب إضافة سؤال واحد على الأقل');
      return false;
    }

    for (let i = 0; i < examForm.questions.length; i++) {
      const q = examForm.questions[i];

      if (!q.text.trim()) {
        showErrorAlert(`نص السؤال رقم ${i + 1} مطلوب`);
        return false;
      }

      if (!q.answers || q.answers.length < 2) {
        showErrorAlert(`السؤال رقم ${i + 1} يجب أن يحتوي على إجابتين على الأقل`);
        return false;
      }

      if (q.answers.some((a) => String(a.text || '').trim() === '' && !a.attachment_url)) {
        showErrorAlert(`إجابات السؤال رقم ${i + 1} مطلوبة`);
        return false;
      }

      if (!q.answers.some((a) => Number(a.is_correct) === 1)) {
        showErrorAlert(`حدد مفتاح الإجابة للسؤال رقم ${i + 1}`);
        return false;
      }
    }

    return true;
  };

  const handleSaveExam = async () => {
    if (!validateExam()) return;

    Swal.fire({
      title: 'جاري الحفظ...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      if (!isEditMode) {
        const payload = {
          ...examForm,
          questions: examForm.questions.map(({ section, sectionKey, ...q }) => ({
            ...q,
            text: joinSection(section, q.text)
          })),
          created_by_guid: currentUserGuid,
          created_by_name: currentUser?.fullName || currentUser?.userName || ''
        };

        const response = await examHttp.post(`${EXAM_API_BASE_URL}?action=create_exam`, payload);

        Swal.close();

        if (response.data.success) {
          showSuccessAlert('تم إنشاء الاختبار بنجاح');
          setShowCreateExamDialog(false);
          fetchAllExams();
        } else {
          showErrorAlert(response.data.message || 'فشل في إنشاء الاختبار');
        }

        return;
      }

      const basicResponse = await examHttp.post(`${EXAM_API_BASE_URL}?action=update_exam`, {
        id: examForm.id,
        title: examForm.title,
        description: examForm.description,
        start_date: examForm.start_date || null,
        end_date: examForm.end_date || null,
        duration_minutes: examForm.duration_minutes,
        pass_score: examForm.pass_score,
        is_active: examForm.is_active
      });

      if (!basicResponse.data.success) {
        Swal.close();
        showErrorAlert(basicResponse.data.message || 'فشل تعديل بيانات الاختبار');
        return;
      }

      const questionJobs = examForm.questions.map(
        (question, index) => ({
          question,
          index
        })
      );

      await runInBatches(
        questionJobs,
        async ({ question: q, index }) => {
          if (q.id) {
            const response = await examHttp.post(
              `${EXAM_API_BASE_URL}?action=update_question`,
              {
                question_id: q.id,
                text: joinSection(q.section, q.text),
                type: q.type,
                points: q.points,
                question_order: index + 1,
                ...pickAttachment(q),
                answers: q.answers
              },
              { timeout: 30000 }
            );

            if (response?.data?.success === false) {
              throw new Error(
                response.data.message ||
                  `فشل حفظ السؤال رقم ${index + 1}`
              );
            }

            return;
          }

          const response = await examHttp.post(
            `${EXAM_API_BASE_URL}?action=add_question`,
            {
              exam_id: examForm.id,
              text: joinSection(q.section, q.text),
              question_order: index + 1,
              type: q.type,
              points: q.points,
              ...pickAttachment(q),
              answers: q.answers
            },
            { timeout: 30000 }
          );

          if (response?.data?.success === false) {
            throw new Error(
              response.data.message ||
                `فشل إضافة السؤال رقم ${index + 1}`
            );
          }
        },
        2
      );

      examDetailsCacheRef.current.delete(
        String(examForm.id)
      );

      Swal.close();
      showSuccessAlert('تم تعديل الاختبار بنجاح');
      setShowCreateExamDialog(false);
      fetchAllExams();

      if (selectedExamDetails?.id) {
        handleOpenExamDetails(selectedExamDetails.id);
      }
    } catch (error) {
      Swal.close();
      console.error(error);
      showErrorAlert(error?.message || 'حدث خطأ أثناء حفظ الاختبار');
    }
  };

  const handleDuplicateExam = async (examId) => {
    const result = await Swal.fire({
      title: 'نسخ الاختبار',
      text: 'هل تريد إنشاء اختبار جديد بنفس الأسئلة والإجابات ومفتاح الإجابة؟',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'نعم، نسخ',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: primaryColor
    });

    if (!result.isConfirmed) return;

    Swal.fire({
      title: 'جاري نسخ الاختبار...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      const exam = await fetchExamById(examId, { force: true });

      // نسخة جديدة بدون أي IDs قديمة، مسجلة باسم المستخدم الحالي
      const payload = {
        title: `${exam.title || ''} - نسخة`,
        description: exam.description || '',
        start_date: exam.start_date ? String(exam.start_date).slice(0, 10) : '',
        end_date: exam.end_date ? String(exam.end_date).slice(0, 10) : '',
        duration_minutes: Number(exam.duration_minutes || 30),
        pass_score: Number(exam.pass_score || 50),
        is_active: Number(exam.is_active ?? 1),
        created_by_guid: currentUserGuid,
        created_by_name: currentUser?.fullName || currentUser?.userName || '',
        questions: (exam.questions || []).map((q, qIndex) => ({
          text: q.question_text || '',
          type: q.question_type || 'single_choice',
          points: Number(q.points || 1),
          question_order: qIndex + 1,
          attachment_url: q.attachment_url || '',
          attachment_name: q.attachment_name || '',
          attachment_type: q.attachment_type || '',
          answers: (q.answers || []).map((a) => ({
            text: a.answer_text || '',
            is_correct: Number(a.is_correct || 0),
            attachment_url: a.attachment_url || '',
            attachment_name: a.attachment_name || '',
            attachment_type: a.attachment_type || ''
          }))
        }))
      };

      const response = await examHttp.post(`${EXAM_API_BASE_URL}?action=create_exam`, payload);

      Swal.close();

      if (response.data.success) {
        showSuccessAlert('تم نسخ الاختبار بنجاح');
        fetchAllExams();
      } else {
        showErrorAlert(response.data.message || 'فشل في نسخ الاختبار');
      }
    } catch (error) {
      Swal.close();
      console.error(error);
      showErrorAlert(error?.message || 'حدث خطأ أثناء نسخ الاختبار');
    }
  };

  const handleDeleteExam = async (examId) => {
    const result = await Swal.fire({
      title: 'تأكيد الحذف',
      text: 'هل تريد حذف الاختبار بالكامل؟ سيتم حذف الأسئلة والإجابات.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم، حذف',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#d32f2f'
    });

    if (!result.isConfirmed) return;

    try {
      const response = await examHttp.get(`${EXAM_API_BASE_URL}?action=delete_exam&id=${examId}`);

      if (response.data.success) {
        examDetailsCacheRef.current.delete(String(examId));
        showSuccessAlert('تم حذف الاختبار بنجاح');
        fetchAllExams();
      } else {
        showErrorAlert(response.data.message || 'فشل حذف الاختبار');
      }
    } catch (error) {
      console.error(error);
      showErrorAlert('حدث خطأ أثناء حذف الاختبار');
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    const result = await Swal.fire({
      title: 'تأكيد الحذف',
      text: 'هل تريد حذف هذا السؤال؟',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم، حذف',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#d32f2f'
    });

    if (!result.isConfirmed) return;

    try {
      const response = await examHttp.get(`${EXAM_API_BASE_URL}?action=delete_question&id=${questionId}`);

      if (response.data.success) {
        if (selectedExamDetails?.id) {
          examDetailsCacheRef.current.delete(
            String(selectedExamDetails.id)
          );
        }

        showSuccessAlert('تم حذف السؤال بنجاح');

        if (selectedExamDetails?.id) {
          const refreshedExam = await fetchExamById(
            selectedExamDetails.id,
            { force: true }
          );
          setSelectedExamDetails(refreshedExam);
        }

        fetchAllExams();
      } else {
        showErrorAlert(response.data.message || 'فشل حذف السؤال');
      }
    } catch (error) {
      console.error(error);
      showErrorAlert('حدث خطأ أثناء حذف السؤال');
    }
  };

  const generateStudentExamLink = (examId) => {
    return `${STUDENT_EXAM_BASE_URL}?idforexam=${examId}`;
  };

const exportExamQrCode = async (exam) => {
  try {
    const link = generateStudentExamLink(exam.id);

    const qrData = await QRCode.toDataURL(link, {
      width: 500,
      margin: 2,
      errorCorrectionLevel: 'H'
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = 800;
    canvas.height = 1000;

    // background
    ctx.fillStyle = '#f8fbfa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // header
    const gradient = ctx.createLinearGradient(0, 0, 800, 220);
    gradient.addColorStop(0, '#80b49e');
    gradient.addColorStop(1, '#6a9a87');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 220);

    // institute name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('المعهد السعودي المتخصص العالي للتدريب', 400, 75);

    // subtitle
    ctx.font = 'bold 22px Arial';
    ctx.fillText('رابط الاختبار الإلكتروني', 400, 125);

    // small line
    ctx.strokeStyle = '#ffffff';
    ctx.globalAlpha = 0.75;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(270, 155);
    ctx.lineTo(530, 155);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // exam title
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 26px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(exam.title || 'اختبار إلكتروني', 400, 285);

    // load QR
    const img = new Image();
    img.src = qrData;

    await new Promise((resolve) => {
      img.onload = resolve;
    });

    // QR white card
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(180, 330, 440, 440);

    // QR border
    ctx.strokeStyle = '#dfeee8';
    ctx.lineWidth = 4;
    ctx.strokeRect(180, 330, 440, 440);

    // QR image
    ctx.drawImage(img, 200, 350, 400, 400);

    // text under QR
    ctx.fillStyle = '#60756e';
    ctx.font = '20px Arial';
    ctx.fillText('امسح الكود للدخول إلى الاختبار', 400, 825);

    // link
    ctx.fillStyle = '#555';
    ctx.font = '14px Arial';
    ctx.fillText(link, 400, 875);

    // footer
    ctx.fillStyle = '#6a9a87';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('SSTLI', 400, 940);

    // download png
    const finalImage = canvas.toDataURL('image/png');

    const a = document.createElement('a');
    a.href = finalImage;
    a.download = `exam-${exam.id}-qrcode.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    showSuccessAlert('تم تصدير QR Code بنجاح');
  } catch (err) {
    console.error(err);
    showErrorAlert('فشل إنشاء QR Code');
  }
};

  const copyExamLink = async (examId) => {
    const link = generateStudentExamLink(examId);

    try {
      await navigator.clipboard.writeText(link);
      showSuccessAlert('تم نسخ رابط الاختبار بنجاح');
    } catch (error) {
      console.error(error);
      showErrorAlert('فشل نسخ الرابط');
    }
  };

  const openExamLink = (examId) => {
    window.open(generateStudentExamLink(examId), '_blank');
  };

  return (
    <Container
      className="hr-exams-dark-root"
      maxWidth="xl"
      dir="rtl"
      sx={{
        py: { xs: 1.5, md: 2.5 },
        minHeight: '100dvh',
        width: '100%',
        maxWidth: '100% !important',
        overflowX: 'hidden',
        boxSizing: 'border-box',
        backgroundColor: isDark
          ? theme.palette.background.default
          : backgroundColor,
        fontFamily: '"Cairo", sans-serif'
      }}
    >
      <GlobalStyles
        styles={{
          ...(isDark
            ? {
                ".hr-exams-dark-root .MuiPaper-root, .hr-exams-dark-root .MuiCard-root, .hr-exams-dark-root .MuiAccordion-root": {
                  backgroundColor: `${darkCard} !important`,
                  backgroundImage: "none !important",
                  color: `${theme.palette.text.primary} !important`,
                  borderColor: "#67C99D !important",
                  boxShadow: "none !important"
                },
                ".hr-exams-dark-root .MuiAccordionSummary-root": {
                  backgroundColor: `${darkSection} !important`,
                  color: `${theme.palette.text.primary} !important`,
                  borderBottom: "1px solid rgba(103,201,157,.28) !important"
                },
                ".hr-exams-dark-root .MuiAccordionDetails-root": {
                  backgroundColor: `${darkCard} !important`,
                  color: `${theme.palette.text.primary} !important`
                },

                ".hr-exams-dark-root .MuiButton-root, .MuiDialog-paper .MuiButton-root, .MuiPopover-paper .MuiButton-root": {
                  backgroundColor: "transparent !important",
                  backgroundImage: "none !important",
                  color: "#9BE0C1 !important",
                  border: "1px solid #67C99D !important",
                  boxShadow: "none !important"
                },
                ".hr-exams-dark-root .MuiButton-root:hover, .MuiDialog-paper .MuiButton-root:hover, .MuiPopover-paper .MuiButton-root:hover": {
                  backgroundColor: "transparent !important",
                  color: "#C9F2DF !important",
                  borderColor: "#67C99D !important",
                  boxShadow: "0 0 0 1px rgba(103,201,157,.16) !important"
                },
                ".hr-exams-dark-root .MuiButton-root.Mui-disabled, .MuiDialog-paper .MuiButton-root.Mui-disabled": {
                  backgroundColor: "transparent !important",
                  color: "rgba(155,224,193,.42) !important",
                  borderColor: "rgba(103,201,157,.34) !important"
                },

                ".hr-exams-dark-root .MuiIconButton-root, .MuiDialog-paper .MuiIconButton-root": {
                  backgroundColor: "transparent !important",
                  backgroundImage: "none !important",
                  color: "#9BE0C1 !important",
                  border: "1px solid #67C99D !important",
                  boxShadow: "none !important"
                },
                ".hr-exams-dark-root .MuiIconButton-root:hover, .MuiDialog-paper .MuiIconButton-root:hover": {
                  backgroundColor: "transparent !important",
                  color: "#C9F2DF !important"
                },

                ".hr-exams-dark-root .MuiChip-root, .MuiDialog-paper .MuiChip-root": {
                  backgroundColor: "transparent !important",
                  backgroundImage: "none !important",
                  color: "#9BE0C1 !important",
                  border: "1px solid #67C99D !important",
                  boxShadow: "none !important"
                },

                ".hr-exams-dark-root .MuiOutlinedInput-root, .MuiDialog-paper .MuiOutlinedInput-root, .MuiPopover-paper .MuiOutlinedInput-root": {
                  backgroundColor: "transparent !important",
                  backgroundImage: "none !important",
                  color: `${theme.palette.text.primary} !important`
                },
                ".hr-exams-dark-root .MuiOutlinedInput-notchedOutline, .MuiDialog-paper .MuiOutlinedInput-notchedOutline, .MuiPopover-paper .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#67C99D !important",
                  borderWidth: "1px !important"
                },
                ".hr-exams-dark-root .MuiInputLabel-root, .MuiDialog-paper .MuiInputLabel-root, .MuiPopover-paper .MuiInputLabel-root": {
                  color: `${theme.palette.text.secondary} !important`
                },
                ".hr-exams-dark-root .MuiInputLabel-root.Mui-focused, .MuiDialog-paper .MuiInputLabel-root.Mui-focused": {
                  color: "#9BE0C1 !important"
                },
                ".hr-exams-dark-root .MuiInputAdornment-root, .hr-exams-dark-root .MuiSelect-icon, .MuiDialog-paper .MuiSelect-icon": {
                  color: "#9BE0C1 !important"
                },

                ".hr-exams-dark-root .MuiRadio-root, .MuiDialog-paper .MuiRadio-root": {
                  color: "#67C99D !important"
                },

                ".hr-exams-dark-root .MuiDivider-root, .MuiDialog-paper .MuiDivider-root": {
                  borderColor: "#67C99D !important"
                },

                ".hr-exams-dark-root .MuiTableContainer-root, .MuiDialog-paper .MuiTableContainer-root": {
                  backgroundColor: `${darkCard} !important`,
                  backgroundImage: "none !important",
                  borderColor: "#67C99D !important"
                },
                ".hr-exams-dark-root .MuiTableHead-root .MuiTableCell-root, .MuiDialog-paper .MuiTableHead-root .MuiTableCell-root": {
                  backgroundColor: `${darkNested} !important`,
                  color: `${theme.palette.text.primary} !important`,
                  borderColor: "#67C99D !important"
                },
                ".hr-exams-dark-root .MuiTableBody-root .MuiTableCell-root, .MuiDialog-paper .MuiTableBody-root .MuiTableCell-root": {
                  backgroundColor: `${darkCard} !important`,
                  color: `${theme.palette.text.primary} !important`,
                  borderColor: "rgba(103,201,157,.24) !important"
                },
                ".hr-exams-dark-root .MuiTableRow-root:hover .MuiTableCell-root, .MuiDialog-paper .MuiTableRow-root:hover .MuiTableCell-root": {
                  backgroundColor: `${darkHover} !important`
                },

                ".hr-exams-dark-root .MuiPaginationItem-root": {
                  backgroundColor: "transparent !important",
                  color: "#9BE0C1 !important",
                  border: "1px solid #67C99D !important"
                },
                ".hr-exams-dark-root .MuiPaginationItem-root.Mui-selected": {
                  backgroundColor: "transparent !important",
                  color: "#C9F2DF !important",
                  boxShadow: "inset 0 0 0 1px #67C99D !important"
                },

                ".MuiDialog-paper": {
                  backgroundColor: `${darkCard} !important`,
                  backgroundImage: "none !important",
                  color: `${theme.palette.text.primary} !important`,
                  border: "1px solid #67C99D !important",
                  boxShadow: "0 18px 50px rgba(2,18,12,.34) !important"
                },
                ".MuiDialogTitle-root": {
                  backgroundColor: `${darkSection} !important`,
                  color: `${theme.palette.text.primary} !important`,
                  borderBottom: "1px solid #67C99D !important"
                },
                ".MuiDialogContent-root": {
                  backgroundColor: `${darkCard} !important`,
                  color: `${theme.palette.text.primary} !important`
                },
                ".MuiDialogActions-root": {
                  backgroundColor: `${darkSection} !important`,
                  borderTop: "1px solid #67C99D !important"
                },
                ".MuiDialog-paper .MuiAccordion-root": {
                  backgroundColor: `${darkCard} !important`,
                  color: `${theme.palette.text.primary} !important`,
                  border: "1px solid #67C99D !important",
                  boxShadow: "none !important"
                },
                ".MuiDialog-paper .MuiAccordionSummary-root": {
                  backgroundColor: `${darkSection} !important`,
                  color: `${theme.palette.text.primary} !important`
                },

                ".MuiMenu-paper, .MuiPopover-paper, .MuiSelect-paper": {
                  backgroundColor: `${darkSection} !important`,
                  color: `${theme.palette.text.primary} !important`,
                  border: "1px solid #67C99D !important"
                },
                ".MuiMenuItem-root": {
                  backgroundColor: "transparent !important",
                  color: `${theme.palette.text.primary} !important`
                },
                ".MuiMenuItem-root:hover, .MuiMenuItem-root.Mui-selected": {
                  backgroundColor: `${darkHover} !important`
                },

                ".swal2-popup": {
                  backgroundColor: `${darkCard} !important`,
                  backgroundImage: "none !important",
                  color: `${theme.palette.text.primary} !important`,
                  border: "1px solid #67C99D !important"
                },
                ".swal2-title, .swal2-html-container, .swal2-input-label": {
                  color: `${theme.palette.text.primary} !important`
                },
                ".swal2-confirm, .swal2-deny, .swal2-cancel": {
                  backgroundColor: "transparent !important",
                  backgroundImage: "none !important",
                  color: "#9BE0C1 !important",
                  border: "1px solid #67C99D !important",
                  boxShadow: "none !important"
                },
                ".swal2-input, .swal2-textarea, .swal2-select": {
                  backgroundColor: "transparent !important",
                  color: `${theme.palette.text.primary} !important`,
                  border: "1px solid #67C99D !important"
                },

                ".hr-exams-dark-root input[type='date'], .MuiDialog-paper input[type='date']": {
                  colorScheme: "dark"
                }
              }
            : {})
        }}
      />

      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.25, md: 2 },
          borderRadius: 2.5,
          background: isDark
            ? darkCard
            : `linear-gradient(135deg, ${backgroundColor}, #ffffff)`,
          backgroundImage: isDark ? 'none' : undefined,
          border: isDark ? `1px solid ${focusBorderColor}` : '1px solid rgba(5,117,70,0.11)',
          boxShadow: 'none',
          '& .MuiCard-root, & .MuiPaper-root, & .MuiAccordion-root, & .MuiTableContainer-root': {
            border: isDark ? `1px solid ${focusBorderColor}` : '1px solid rgba(5,117,70,0.11)'
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: isDark ? `${focusBorderColor} !important` : undefined
          },
          '& .MuiTableCell-root': {
            borderColor: isDark ? `${focusBorderColor} !important` : undefined
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: isDark ? theme.palette.text.primary : primaryDark, mb: 1 }}>
              إدارة الاختبارات
            </Typography>

            <Typography sx={{ color: isDark ? theme.palette.text.primary : textColor }}>
              إنشاء الاختبارات، إدارة الأسئلة، تحديد مفتاح الإجابة، وعرض تفاصيل الاختبارات.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={openCreateDialog}
              sx={{
                background: isDark
                  ? 'transparent'
                  : `linear-gradient(135deg, ${primaryColor}, ${primaryDark})`,
                color: isDark ? '#9BE0C1' : '#fff',
                border: isDark ? '1px solid #67C99D' : 'none',
                borderRadius: 3,
                px: 3,
                py: 1.3,
                fontWeight: 'bold'
              }}
            >
              إنشاء اختبار
            </Button>

            <Button
              variant="outlined"
              startIcon={<Visibility />}
              onClick={() => fetchAllExams({ silent: false })}
              sx={{
                borderColor: primaryColor,
                color: isDark ? theme.palette.text.primary : primaryDark,
                borderRadius: 3,
                px: 3,
                py: 1.3,
                fontWeight: 'bold'
              }}
            >
              عرض الاختبارات
            </Button>
          </Box>
        </Box>

        <TextField
          fullWidth
          value={examSearch}
          onChange={(e) => setExamSearch(e.target.value)}
          placeholder="بحث باسم الاختبار أو المنشئ..."
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: isDark ? theme.palette.text.primary : primaryDark }} />
              </InputAdornment>
            )
          }}
        />

        {loadingExams ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <CircularProgress sx={{ color: primaryColor }} />
          </Box>
        ) : (
          <Grid container spacing={1.5}>
            {visibleExams.map((exam) => (
              <Grid item xs={12} md={6} lg={4} key={exam.id}>
                <Card
                  sx={{
                    borderRadius: 2,
                    border: isDark ? `1px solid ${focusBorderColor}` : '1px solid rgba(5,117,70,0.11)',
                    backgroundColor: isDark ? darkCard : '#fff',
                    height: '100%',
                    boxShadow: '0 10px 30px rgba(0,0,0,.06)',
                    transition: '.3s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 18px 45px rgba(128,180,158,.25)'
                    }
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Chip
                        label={Number(exam.is_active) === 1 ? 'نشط' : 'غير نشط'}
                        color={Number(exam.is_active) === 1 ? 'success' : 'default'}
                        size="small"
                      />

                      <Chip
                        icon={<Quiz />}
                        label={`${exam.questions_count || 0} سؤال`}
                        size="small"
                        sx={{
                          backgroundColor: isDark ? 'rgba(103,201,157,.14)' : backgroundColor,
                          color: isDark ? theme.palette.primary.main : primaryDark
                        }}
                      />
                    </Box>

                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: isDark ? theme.palette.text.primary : primaryDark, mb: 1 }}>
                      {exam.title}
                    </Typography>

                    <Typography variant="body2" sx={{ color: isDark ? theme.palette.text.primary : textColor, mb: 2, minHeight: 42 }}>
                      {exam.description || 'لا يوجد وصف'}
                    </Typography>

                    {isExamAdmin && (
                      <Typography variant="caption" sx={{ display: 'block', mb: 1, color: isDark ? theme.palette.text.secondary : '#777' }}>
                        أنشأه: {getCreatorName(exam.created_by_guid)}
                      </Typography>
                    )}

                    <Typography variant="caption" sx={{ display: 'block', mb: 2 }}>
                      المدة: {exam.duration_minutes || 0} دقيقة — درجة النجاح: {exam.pass_score || 0}
                    </Typography>

                    <Box
                      sx={{
                        p: 1,
                        mb: 1.5,
                        borderRadius: 2,
                        backgroundColor: isDark ? darkNested : '#f1f8f5',
                        border: isDark ? `1px solid ${focusBorderColor}` : '1px solid rgba(5,117,70,0.11)',
                        wordBreak: 'break-all'
                      }}
                    >
                      <Typography variant="caption" sx={{ color: isDark ? theme.palette.text.primary : primaryDark, fontWeight: 'bold' }}>
                        رابط الطالب:
                      </Typography>

                      <Typography variant="caption" sx={{ display: 'block', color: isDark ? theme.palette.text.primary : textColor }}>
                        {generateStudentExamLink(exam.id)}
                      </Typography>
                    </Box>

                    <Divider sx={{ mb: 1.5 }} />

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <IconButton onClick={() => handleOpenExamDetails(exam.id)} sx={{ color: isDark ? theme.palette.text.primary : primaryDark }}>
                        <Visibility />
                      </IconButton>

                      <IconButton onClick={() => handleOpenExamAttempts(exam.id)} sx={{ color: '#ef6c00' }}>
                        <Assessment />
                      </IconButton>

                      <IconButton onClick={() => openEditDialog(exam.id)} sx={{ color: '#1976d2' }}>
                        <Edit />
                      </IconButton>

                      <Tooltip title="نسخ الاختبار بكل الأسئلة والإجابات" arrow placement="top">
                        <IconButton onClick={() => handleDuplicateExam(exam.id)} sx={{ color: '#0097a7' }}>
                          <FileCopy />
                        </IconButton>
                      </Tooltip>

                      <IconButton onClick={() => copyExamLink(exam.id)} sx={{ color: '#6a1b9a' }}>
                        <ContentCopy />
                      </IconButton>

                      <IconButton onClick={() => openExamLink(exam.id)} sx={{ color: '#2e7d32' }}>
                        <OpenInNew />
                      </IconButton>
<IconButton
  onClick={() => exportExamQrCode(exam)}
  sx={{ color: '#00897b' }}
>
  <QrCode2 />
</IconButton>
                      <IconButton onClick={() => handleDeleteExam(exam.id)} sx={{ color: '#d32f2f' }}>
                        <Delete />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}

            {!filteredExams.length && (
              <Grid item xs={12}>
                <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 4 }}>
                  <Typography sx={{ color: isDark ? theme.palette.text.primary : primaryDark, fontWeight: 'bold' }}>
                    لا توجد اختبارات للعرض
                  </Typography>
                </Paper>
              </Grid>
            )}

            {!!filteredExams.length && (
              <Grid item xs={12}>
                <Box
                  sx={{
                    mt: 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                    flexWrap: 'wrap'
                  }}
                >
                  <Chip
                    variant="outlined"
                    label={`إجمالي الاختبارات: ${filteredExams.length}`}
                    sx={{ fontWeight: 800 }}
                  />

                  <Pagination
                    count={totalExamPages}
                    page={Math.min(examPage, totalExamPages)}
                    onChange={(_, value) => setExamPage(value)}
                    shape="rounded"
                    size="small"
                    siblingCount={1}
                    boundaryCount={1}
                  />
                </Box>
              </Grid>
            )}
          </Grid>
        )}
      </Paper>

      {/* CREATE / EDIT EXAM DIALOG */}
      <Dialog
        sx={{
          '& .MuiDialog-paper': {
            border: isDark ? `1px solid ${focusBorderColor}` : '1px solid rgba(5,117,70,0.11)',
            backgroundColor: isDark ? darkCard : '#fff'
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: isDark ? `${focusBorderColor} !important` : undefined
          }
        }}
        open={showCreateExamDialog}
        onClose={() => setShowCreateExamDialog(false)}
        maxWidth="lg"
        fullWidth
        dir="rtl"
      >
        <DialogTitle sx={{ fontWeight: 'bold', color: isDark ? theme.palette.text.primary : primaryDark }}>
          {isEditMode ? 'تعديل الاختبار' : 'إنشاء اختبار جديد'}
        </DialogTitle>

        <DialogContent dividers sx={{ backgroundColor: isDark ? darkSection : backgroundColor }}>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="عنوان الاختبار"
                value={examForm.title}
                onChange={(e) => updateExamField('title', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="number"
                label="مدة الاختبار بالدقائق"
                value={examForm.duration_minutes}
                onChange={(e) => updateExamField('duration_minutes', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="number"
                label="درجة النجاح"
                value={examForm.pass_score}
                onChange={(e) => updateExamField('pass_score', e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                minRows={4}
                label="وصف الاختبار"
                value={examForm.description}
                onChange={(e) => updateExamField('description', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="date"
                label="تاريخ البداية"
                InputLabelProps={{ shrink: true }}
                value={examForm.start_date || ''}
                onChange={(e) => updateExamField('start_date', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="date"
                label="تاريخ النهاية"
                InputLabelProps={{ shrink: true }}
                value={examForm.end_date || ''}
                onChange={(e) => updateExamField('end_date', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>حالة الاختبار</InputLabel>
                <Select
                  label="حالة الاختبار"
                  value={examForm.is_active}
                  onChange={(e) => updateExamField('is_active', e.target.value)}
                >
                  <MenuItem value={1}>نشط</MenuItem>
                  <MenuItem value={0}>غير نشط</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: isDark ? theme.palette.text.primary : primaryDark }}>
              الأسئلة
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button variant="contained" startIcon={<Add />} onClick={addSection} sx={{ backgroundColor: primaryColor, fontWeight: 'bold' }}>
                إضافة قسم
              </Button>
              <Button variant="outlined" startIcon={<Add />} onClick={addQuestion}>
                إضافة سؤال
              </Button>
            </Box>
          </Box>

          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            تقدر تقسّم الاختبار لأقسام (مثلًا: قسم صح وغلط، قسم اختياري). كل سؤال يتبع القسم اللي هو فيه، والطالب يشوف الأسئلة متقسمة بنفس الترتيب.
          </Typography>

          {sectionRuns(examForm.questions, (q) => q.sectionKey || '').map((run, runIndex) => {
            const isSection = Boolean(run.section);
            const sectionTitle = examForm.questions[run.start]?.section || '';
            const count = run.end - run.start + 1;

            return (
          <Box
            key={`run-${run.section || 'none'}-${run.start}`}
            sx={{
              mb: 2.5,
              p: { xs: 1, sm: 1.5 },
              borderRadius: 3,
              border: isSection
                ? `1.5px solid ${isDark ? focusBorderColor : 'rgba(5,117,70,0.28)'}`
                : `1px dashed ${isDark ? focusBorderColor : 'rgba(5,117,70,0.2)'}`,
              backgroundColor: isSection ? (isDark ? darkSection : '#f4faf7') : 'transparent'
            }}
          >
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mb: 1.5 }}>
              {isSection ? (
                <TextField
                  size="small"
                  label={`اسم القسم ${runIndex + 1}`}
                  value={sectionTitle}
                  onChange={(e) => renameRun(run, e.target.value)}
                  placeholder="مثلًا: أسئلة صح وغلط"
                  sx={{ flex: 1, minWidth: 220, '& input': { fontWeight: 'bold' } }}
                />
              ) : (
                <Typography sx={{ flex: 1, fontWeight: 'bold', color: 'text.secondary' }}>
                  أسئلة بدون قسم
                </Typography>
              )}

              <Chip size="small" label={`${count} سؤال`} />

              <Button size="small" startIcon={<Add />} onClick={() => addQuestionToRun(run)}>
                سؤال في {isSection ? 'هذا القسم' : 'هنا'}
              </Button>

              {isSection ? (
                <Button size="small" color="inherit" onClick={() => ungroupRun(run)}>
                  إلغاء القسم
                </Button>
              ) : (
                <Button size="small" onClick={() => makeRunSection(run)}>
                  تحويلها لقسم
                </Button>
              )}
            </Box>

          {examForm.questions.slice(run.start, run.end + 1).map((q, offset) => {
            const qIndex = run.start + offset;
            return (
            <Accordion
              key={qIndex}
              defaultExpanded={qIndex === 0}
              TransitionProps={{ unmountOnExit: true }}
              sx={{ mb: 1.2, borderRadius: 2 }}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography sx={{ fontWeight: 'bold' }}>
                  السؤال رقم {qIndex + 1}
                  {q.text ? ` — ${String(q.text).slice(0, 60)}` : ''}
                </Typography>
              </AccordionSummary>

              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={7}>
                    <TextField
                      fullWidth
                      label="نص السؤال"
                      value={q.text}
                      onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>نوع السؤال</InputLabel>
                      <Select
                        label="نوع السؤال"
                        value={q.type}
                        onChange={(e) => updateQuestion(qIndex, 'type', e.target.value)}
                      >
                        <MenuItem value="single_choice">اختياري</MenuItem>
                        <MenuItem value="true_false">صح وغلط</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={8} md={1}>
                    <TextField
                      fullWidth
                      type="number"
                      label="الدرجة"
                      value={q.points}
                      onChange={(e) => updateQuestion(qIndex, 'points', e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={4} md={1}>
                    <IconButton color="error" onClick={() => removeQuestion(qIndex)}>
                      <Delete />
                    </IconButton>
                  </Grid>

                  <Grid item xs={12}>
                    <AttachmentField
                      item={q}
                      onChange={(attachment) => updateQuestionAttachment(qIndex, attachment)}
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 2 }}>
                  <Typography sx={{ fontWeight: 'bold', mb: 1 }}>
                    الإجابات ومفتاح الإجابة
                  </Typography>

                  {q.answers.map((answer, aIndex) => (
                    <Box key={aIndex} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                      <Radio
                        checked={Number(answer.is_correct) === 1}
                        onChange={() => setCorrectAnswer(qIndex, aIndex)}
                      />

                      <TextField
                        fullWidth
                        size="small"
                        label={`الإجابة ${aIndex + 1}`}
                        value={answer.text}
                        onChange={(e) => updateAnswer(qIndex, aIndex, 'text', e.target.value)}
                        disabled={q.type === 'true_false'}
                      />

                      {q.type !== 'true_false' && (
                        <AttachmentField
                          compact
                          item={answer}
                          onChange={(attachment) => updateAnswerAttachment(qIndex, aIndex, attachment)}
                        />
                      )}

                      {Number(answer.is_correct) === 1 && (
                        <Chip icon={<CheckCircle />} label="مفتاح الإجابة" color="success" size="small" />
                      )}

                      {q.type !== 'true_false' && q.answers.length > 2 && (
                        <IconButton color="error" onClick={() => removeAnswer(qIndex, aIndex)}>
                          <Delete />
                        </IconButton>
                      )}
                    </Box>
                  ))}

                  {q.type !== 'true_false' && (
                    <Button size="small" startIcon={<Add />} onClick={() => addAnswer(qIndex)}>
                      إضافة إجابة
                    </Button>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
            );
          })}
          </Box>
            );
          })}
        </DialogContent>

        <DialogActions>
          <Button startIcon={<Close />} onClick={() => setShowCreateExamDialog(false)}>
            إغلاق
          </Button>

          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSaveExam}
            sx={{
              background: `linear-gradient(135deg, ${primaryColor}, ${primaryDark})`,
              fontWeight: 'bold'
            }}
          >
            حفظ الاختبار
          </Button>
        </DialogActions>
      </Dialog>

      {/* EXAM DETAILS DIALOG */}
      <Dialog
        sx={{
          '& .MuiDialog-paper': {
            border: isDark ? `1px solid ${focusBorderColor}` : '1px solid rgba(5,117,70,0.11)',
            backgroundColor: isDark ? darkCard : '#fff'
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: isDark ? `${focusBorderColor} !important` : undefined
          }
        }}
        open={showExamDetailsDialog}
        onClose={() => setShowExamDetailsDialog(false)}
        maxWidth="md"
        fullWidth
        dir="rtl"
      >
        <DialogTitle sx={{ fontWeight: 'bold', color: isDark ? theme.palette.text.primary : primaryDark }}>
          تفاصيل الاختبار
        </DialogTitle>

        <DialogContent dividers>
          {selectedExamDetails && (
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                {selectedExamDetails.title}
              </Typography>

              <Typography sx={{ mb: 2, color: isDark ? theme.palette.text.primary : textColor }}>
                {selectedExamDetails.description || 'لا يوجد وصف'}
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                <Chip label={`المدة: ${selectedExamDetails.duration_minutes} دقيقة`} />
                <Chip label={`درجة النجاح: ${selectedExamDetails.pass_score}`} />
                <Chip label={`عدد الأسئلة: ${selectedExamDetails.questions?.length || 0}`} />

                {isExamAdmin && (
                  <Chip label={`أنشأه: ${getCreatorName(selectedExamDetails.created_by_guid)}`} />
                )}
              </Box>

              {orderBySection(
                selectedExamDetails.questions || [],
                (item) => splitSection(item.question_text).section
              ).map((q, index, list) => {
                const section = splitSection(q.question_text).section;
                const prevSection = index > 0 ? splitSection(list[index - 1].question_text).section : null;
                return (
                <React.Fragment key={q.id}>
                {section && section !== prevSection && (
                  <SectionHeading title={section} isDark={isDark} />
                )}
                <Accordion
                  TransitionProps={{ unmountOnExit: true }}
                  sx={{ mb: 1, borderRadius: 2 }}
                >
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography sx={{ fontWeight: 'bold' }}>
                      {index + 1}. {stripSection(q.question_text)}
                    </Typography>
                  </AccordionSummary>

                  <AccordionDetails>
                    <Chip
                      label={q.question_type === 'true_false' ? 'صح وغلط' : 'اختياري'}
                      size="small"
                      sx={{ mb: 2 }}
                    />

                    {q.attachment_url && isImageAttachment(q) && (
                      <Box
                        component="img"
                        src={q.attachment_url}
                        alt={q.attachment_name}
                        sx={{ display: 'block', maxWidth: '100%', maxHeight: 280, objectFit: 'contain', borderRadius: 2, mb: 2 }}
                      />
                    )}

                    {q.answers?.map((a) => (
                      <Box
                        key={a.id}
                        sx={{
                          p: 1.2,
                          mb: 1,
                          borderRadius: 2,
                          border: `1px solid ${
                            isDark
                              ? focusBorderColor
                              : Number(a.is_correct) === 1
                                ? '#4caf50'
                                : '#ddd'
                          }`,
                          backgroundColor: isDark
                            ? 'transparent'
                            : Number(a.is_correct) === 1
                              ? '#edf7ed'
                              : '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        {Number(a.is_correct) === 1 && <CheckCircle sx={{ color: '#4caf50' }} />}
                        {a.attachment_url && isImageAttachment(a) && (
                          <Box
                            component="img"
                            src={a.attachment_url}
                            alt={a.attachment_name}
                            sx={{ width: 90, height: 90, objectFit: 'contain', borderRadius: 1.5 }}
                          />
                        )}
                        <Typography>{a.answer_text}</Typography>

                        {Number(a.is_correct) === 1 && (
                          <Chip size="small" label="مفتاح الإجابة" color="success" />
                        )}
                      </Box>
                    ))}

                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <Button size="small" startIcon={<Edit />} onClick={() => openEditDialog(selectedExamDetails.id)}>
                        تعديل الاختبار
                      </Button>

                      <Button
                        size="small"
                        color="error"
                        startIcon={<Delete />}
                        onClick={() => handleDeleteQuestion(q.id)}
                      >
                        حذف السؤال
                      </Button>
                    </Box>
                  </AccordionDetails>
                </Accordion>
                </React.Fragment>
                );
              })}
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setShowExamDetailsDialog(false)}>إغلاق</Button>
        </DialogActions>
      </Dialog>

      {/* ATTEMPTS / RESULTS DIALOG */}
      <Dialog
        sx={{
          '& .MuiDialog-paper': {
            border: isDark ? `1px solid ${focusBorderColor}` : '1px solid rgba(5,117,70,0.11)',
            backgroundColor: isDark ? darkCard : '#fff'
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: isDark ? `${focusBorderColor} !important` : undefined
          }
        }}
        open={showAttemptsDialog}
        onClose={() => setShowAttemptsDialog(false)}
        maxWidth="xl"
        fullWidth
        dir="rtl"
      >
        <DialogTitle sx={{ fontWeight: 'bold', color: isDark ? theme.palette.text.primary : primaryDark }}>
          نتائج وإجابات الاختبار
        </DialogTitle>

        <DialogContent dividers sx={{ backgroundColor: isDark ? darkSection : '#fbfdfc' }}>
          {loadingAttempts ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <CircularProgress sx={{ color: primaryColor }} />
            </Box>
          ) : selectedExamAttempts ? (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: isDark ? theme.palette.text.primary : primaryDark, mb: 1 }}>
                  {selectedExamAttempts.exam?.title}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label={`عدد الطلاب: ${selectedExamAttempts.attempts?.length || 0}`} />
                  <Chip label={`إجمالي المحاولات: ${selectedExamAttempts.total_attempts || 0}`} />
                  <Chip label="المعروض: أعلى نتيجة لكل طالب" color="success" variant="outlined" />
                  <Chip label={`عدد الأسئلة: ${selectedExamAttempts.exam?.questions_count || 0}`} />
                </Box>
              </Box>

              {selectedExamAttempts.attempts?.length ? (
                selectedExamAttempts.attempts.map((attempt, attemptIndex) => (
                  <Accordion
                    key={attempt.id}
                    defaultExpanded={attemptIndex === 0}
                    TransitionProps={{ unmountOnExit: true }}
                    sx={{ mb: 1.2, borderRadius: 2 }}
                  >
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box
                        sx={{
                          width: '100%',
                          display: 'flex',
                          gap: 1,
                          flexWrap: 'wrap',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <Typography sx={{ fontWeight: 'bold', color: isDark ? theme.palette.text.primary : primaryDark }}>
                          {attemptIndex + 1}. {attempt.student_name}
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Chip label={`الهوية: ${attempt.national_id}`} size="small" />
                          <Chip label={`الدرجة: ${attempt.score} / ${attempt.total_score}`} size="small" />
                          <Chip label={`النسبة: ${attempt.percentage}%`} size="small" />
                          {attempt.attempts_count > 1 ? (
                            <Chip label={`أعلى نتيجة من ${attempt.attempts_count} محاولات`} size="small" color="info" variant="outlined" />
                          ) : null}
                          <Chip
                            label={Number(attempt.is_passed) === 1 ? 'ناجح' : 'راسب'}
                            color={Number(attempt.is_passed) === 1 ? 'success' : 'error'}
                            size="small"
                          />
                        </Box>
                      </Box>
                    </AccordionSummary>

                    <AccordionDetails>
                      <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip label={`الجوال: ${attempt.student_tel || 'غير مسجل'}`} />
                        <Chip label={`البريد: ${attempt.student_email || 'غير مسجل'}`} />
                        <Chip label={`وقت الإرسال: ${attempt.submitted_at || '-'}`} />
                      </Box>

                      <TableContainer
                        component={Paper}
                        sx={{
                          borderRadius: 3,
                          border: isDark ? `1px solid ${focusBorderColor}` : '1px solid rgba(5,117,70,0.11)',
                          backgroundColor: isDark ? darkCard : '#fff'
                        }}
                      >
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ backgroundColor: isDark ? darkNested : '#edf7f2' }}>
                              <TableCell align="center" sx={{ fontWeight: 'bold' }}>#</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 'bold' }}>السؤال</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 'bold' }}>إجابة الطالب</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 'bold' }}>الإجابة الصحيحة</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 'bold' }}>الحالة</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 'bold' }}>الدرجة</TableCell>
                            </TableRow>
                          </TableHead>

                          <TableBody>
                            {orderBySection(
                              attempt.answers || [],
                              (item) => splitSection(item.question_text).section
                            ).map((ans, index, list) => {
                              const section = splitSection(ans.question_text).section;
                              const prevSection = index > 0 ? splitSection(list[index - 1].question_text).section : null;
                              return (
                              <React.Fragment key={`${attempt.id}-${ans.question_id}`}>
                              {section && section !== prevSection && (
                                <TableRow>
                                  <TableCell
                                    colSpan={6}
                                    sx={{
                                      fontWeight: 900,
                                      color: isDark ? '#cfe7dc' : primaryDark,
                                      backgroundColor: isDark ? 'rgba(128,180,158,0.12)' : '#e6f3ec',
                                      borderInlineStart: `5px solid ${primaryColor}`
                                    }}
                                  >
                                    {section}
                                  </TableCell>
                                </TableRow>
                              )}
                              <TableRow
                                sx={{
                                  backgroundColor: isDark
                                    ? 'transparent'
                                    : Number(ans.is_correct) === 1
                                      ? '#f1f8f4'
                                      : '#fff7f7',
                                }}
                              >
                                <TableCell align="center">{index + 1}</TableCell>
                                <TableCell align="right" sx={{ minWidth: 260 }}>
                                  {stripSection(ans.question_text)}
                                </TableCell>
                                <TableCell align="right">
                                  {ans.selected_answer_text || 'لم تتم الإجابة'}
                                </TableCell>
                                <TableCell align="right" sx={{ color: '#2e7d32', fontWeight: 'bold' }}>
                                  {ans.correct_answer_text || '-'}
                                </TableCell>
                                <TableCell align="center">
                                  {Number(ans.is_correct) === 1 ? (
                                    <Chip icon={<CheckCircle />} label="صحيح" color="success" size="small" />
                                  ) : (
                                    <Chip icon={<Cancel />} label="خطأ" color="error" size="small" />
                                  )}
                                </TableCell>
                                <TableCell align="center">
                                  {ans.points_earned} / {ans.question_points}
                                </TableCell>
                              </TableRow>
                              </React.Fragment>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </AccordionDetails>
                  </Accordion>
                ))
              ) : (
                <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 4 }}>
                  <Typography sx={{ color: isDark ? theme.palette.text.primary : primaryDark, fontWeight: 'bold' }}>
                    لا توجد محاولات لهذا الاختبار حتى الآن
                  </Typography>
                </Paper>
              )}
            </Box>
          ) : (
            <Typography>لا توجد بيانات</Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'space-between' }}>
          <Button
            variant="contained"
            startIcon={<FileDownload />}
            onClick={handleExportAttemptsExcel}
            disabled={loadingAttempts || !selectedExamAttempts?.attempts?.length}
            sx={{ backgroundColor: primaryColor, fontWeight: 'bold' }}
          >
            تصدير Excel
          </Button>
          <Button onClick={() => setShowAttemptsDialog(false)}>إغلاق</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default HRCreateExams;