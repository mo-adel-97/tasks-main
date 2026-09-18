import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import QRCode from 'qrcode';
import { QrCode2 } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import {
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
  TableRow
} from '@mui/material';

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
  questions: [
    {
      text: '',
      type: 'single_choice',
      points: 1,
      answers: [
        { text: '', is_correct: 1 },
        { text: '', is_correct: 0 }
      ]
    }
  ]
});

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
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserGuid = currentUser?.guid || '';
  const isExamAdmin = EXAM_ADMINS.includes(String(currentUserGuid).toLowerCase());

  const [users, setUsers] = useState([]);
  const [allExams, setAllExams] = useState([]);
  const [loadingExams, setLoadingExams] = useState(false);
  const [examSearch, setExamSearch] = useState('');

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
  }, []);

  const initializeData = async () => {
    await fetchUsers();
    await fetchAllExams();
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('https://api1.sstli.com/api/userinfo');
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(error);
      setUsers([]);
    }
  };

  const fetchAllExams = async () => {
    try {
      setLoadingExams(true);
      const response = await axios.get(`${EXAM_API_BASE_URL}?action=get_exams`);

      if (response.data.success) {
        let exams = response.data.data || [];

        if (!isExamAdmin) {
          exams = exams.filter(
            (e) =>
              String(e.created_by_guid || '').toLowerCase() ===
              String(currentUserGuid).toLowerCase()
          );
        }

        setAllExams(exams);
      } else {
        setAllExams([]);
        showErrorAlert(response.data.message || 'فشل في جلب الاختبارات');
      }
    } catch (error) {
      console.error(error);
      showErrorAlert('حدث خطأ أثناء جلب الاختبارات');
    } finally {
      setLoadingExams(false);
    }
  };

  const getCreatorName = (guid) => {
    const user = users.find(
      (u) => String(u.guid || '').toLowerCase() === String(guid || '').toLowerCase()
    );

    return user?.fullName || user?.userName || 'غير معروف';
  };

  const filteredExams = useMemo(() => {
    const term = examSearch.trim().toLowerCase();
    if (!term) return allExams;

    return allExams.filter((exam) => {
      const creator = getCreatorName(exam.created_by_guid);
      return `${exam.title} ${exam.description} ${creator}`.toLowerCase().includes(term);
    });
  }, [allExams, examSearch, users]);

  const openCreateDialog = () => {
    setIsEditMode(false);
    setExamForm(emptyExam(currentUser));
    setShowCreateExamDialog(true);
  };

  const openEditDialog = async (examId) => {
    try {
      const response = await axios.get(`${EXAM_API_BASE_URL}?action=get_exam&id=${examId}`);

      if (!response.data.success) {
        showErrorAlert(response.data.message || 'فشل في جلب بيانات الاختبار');
        return;
      }

      const exam = response.data.data;

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
        questions: (exam.questions || []).map((q) => ({
          id: q.id,
          question_order: q.question_order,
          text: q.question_text || '',
          type: q.question_type || 'single_choice',
          points: Number(q.points || 1),
          answers: (q.answers || []).map((a) => ({
            id: a.id,
            text: a.answer_text || '',
            is_correct: Number(a.is_correct || 0)
          }))
        }))
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
      const response = await axios.get(`${EXAM_API_BASE_URL}?action=get_exam&id=${examId}`);

      if (response.data.success) {
        setSelectedExamDetails(response.data.data);
        setShowExamDetailsDialog(true);
      } else {
        showErrorAlert(response.data.message || 'فشل في جلب تفاصيل الاختبار');
      }
    } catch (error) {
      console.error(error);
      showErrorAlert('حدث خطأ أثناء جلب تفاصيل الاختبار');
    }
  };

  const handleOpenExamAttempts = async (examId) => {
    try {
      setLoadingAttempts(true);
      setShowAttemptsDialog(true);
      setSelectedExamAttempts(null);

      const response = await axios.get(`${EXAM_API_BASE_URL}?action=get_exam_attempts&exam_id=${examId}`);

      if (response.data.success) {
        setSelectedExamAttempts(response.data.data);
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

  const updateExamField = (field, value) => {
    setExamForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const addQuestion = () => {
    setExamForm((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          text: '',
          type: 'single_choice',
          points: 1,
          answers: [
            { text: '', is_correct: 1 },
            { text: '', is_correct: 0 }
          ]
        }
      ]
    }));
  };

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

      if (!q.answers.some((a) => String(a.text || '').trim() !== '')) {
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
          created_by_guid: currentUserGuid,
          created_by_name: currentUser?.fullName || currentUser?.userName || ''
        };

        const response = await axios.post(`${EXAM_API_BASE_URL}?action=create_exam`, payload);

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

      const basicResponse = await axios.post(`${EXAM_API_BASE_URL}?action=update_exam`, {
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

      for (let i = 0; i < examForm.questions.length; i++) {
        const q = examForm.questions[i];

        if (q.id) {
          await axios.post(`${EXAM_API_BASE_URL}?action=update_question`, {
            question_id: q.id,
            text: q.text,
            type: q.type,
            points: q.points,
            question_order: i + 1,
            answers: q.answers
          });
        } else {
          await axios.post(`${EXAM_API_BASE_URL}?action=add_question`, {
            exam_id: examForm.id,
            text: q.text,
            type: q.type,
            points: q.points,
            answers: q.answers
          });
        }
      }

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
      showErrorAlert('حدث خطأ أثناء حفظ الاختبار');
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
      const response = await axios.get(`${EXAM_API_BASE_URL}?action=delete_exam&id=${examId}`);

      if (response.data.success) {
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
      const response = await axios.get(`${EXAM_API_BASE_URL}?action=delete_question&id=${questionId}`);

      if (response.data.success) {
        showSuccessAlert('تم حذف السؤال بنجاح');

        if (selectedExamDetails?.id) {
          handleOpenExamDetails(selectedExamDetails.id);
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
    <Container maxWidth="xl" dir="rtl" sx={{ py: 4, fontFamily: '"Cairo", sans-serif' }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 4 },
          borderRadius: 5,
          background: isDark
            ? theme.palette.background.default
            : `linear-gradient(135deg, ${backgroundColor}, #ffffff)`,
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 4 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: primaryDark, mb: 1 }}>
              إدارة الاختبارات
            </Typography>

            <Typography sx={{ color: textColor }}>
              إنشاء الاختبارات، إدارة الأسئلة، تحديد مفتاح الإجابة، وعرض تفاصيل الاختبارات.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={openCreateDialog}
              sx={{
                background: `linear-gradient(135deg, ${primaryColor}, ${primaryDark})`,
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
              onClick={fetchAllExams}
              sx={{
                borderColor: primaryColor,
                color: primaryDark,
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
                <Search sx={{ color: primaryDark }} />
              </InputAdornment>
            )
          }}
        />

        {loadingExams ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <CircularProgress sx={{ color: primaryColor }} />
          </Box>
        ) : (
          <Grid container spacing={2.5}>
            {filteredExams.map((exam) => (
              <Grid item xs={12} md={6} lg={4} key={exam.id}>
                <Card
                  sx={{
                    borderRadius: 4,
                    border: isDark ? `1px solid ${focusBorderColor}` : '1px solid rgba(5,117,70,0.11)',
                    backgroundColor: isDark ? theme.palette.surfaces.card : '#fff',
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

                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: primaryDark, mb: 1 }}>
                      {exam.title}
                    </Typography>

                    <Typography variant="body2" sx={{ color: textColor, mb: 2, minHeight: 42 }}>
                      {exam.description || 'لا يوجد وصف'}
                    </Typography>

                    {isExamAdmin && (
                      <Typography variant="caption" sx={{ display: 'block', mb: 1, color: '#777' }}>
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
                        backgroundColor: isDark ? theme.palette.surfaces.nested : '#f1f8f5',
                        border: isDark ? `1px solid ${focusBorderColor}` : '1px solid rgba(5,117,70,0.11)',
                        wordBreak: 'break-all'
                      }}
                    >
                      <Typography variant="caption" sx={{ color: primaryDark, fontWeight: 'bold' }}>
                        رابط الطالب:
                      </Typography>

                      <Typography variant="caption" sx={{ display: 'block', color: textColor }}>
                        {generateStudentExamLink(exam.id)}
                      </Typography>
                    </Box>

                    <Divider sx={{ mb: 1.5 }} />

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <IconButton onClick={() => handleOpenExamDetails(exam.id)} sx={{ color: primaryDark }}>
                        <Visibility />
                      </IconButton>

                      <IconButton onClick={() => handleOpenExamAttempts(exam.id)} sx={{ color: '#ef6c00' }}>
                        <Assessment />
                      </IconButton>

                      <IconButton onClick={() => openEditDialog(exam.id)} sx={{ color: '#1976d2' }}>
                        <Edit />
                      </IconButton>

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
                  <Typography sx={{ color: primaryDark, fontWeight: 'bold' }}>
                    لا توجد اختبارات للعرض
                  </Typography>
                </Paper>
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
            backgroundColor: isDark ? theme.palette.surfaces.card : '#fff'
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
        <DialogTitle sx={{ fontWeight: 'bold', color: primaryDark }}>
          {isEditMode ? 'تعديل الاختبار' : 'إنشاء اختبار جديد'}
        </DialogTitle>

        <DialogContent dividers sx={{ backgroundColor: isDark ? theme.palette.surfaces.section : backgroundColor }}>
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
                rows={2}
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

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: primaryDark }}>
              الأسئلة
            </Typography>

            <Button variant="outlined" startIcon={<Add />} onClick={addQuestion}>
              إضافة سؤال
            </Button>
          </Box>

          {examForm.questions.map((q, qIndex) => (
            <Accordion key={qIndex} defaultExpanded sx={{ mb: 2, borderRadius: 3 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography sx={{ fontWeight: 'bold' }}>
                  السؤال رقم {qIndex + 1}
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
          ))}
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
            backgroundColor: isDark ? theme.palette.surfaces.card : '#fff'
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
        <DialogTitle sx={{ fontWeight: 'bold', color: primaryDark }}>
          تفاصيل الاختبار
        </DialogTitle>

        <DialogContent dividers>
          {selectedExamDetails && (
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                {selectedExamDetails.title}
              </Typography>

              <Typography sx={{ mb: 2, color: textColor }}>
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

              {selectedExamDetails.questions?.map((q, index) => (
                <Accordion key={q.id} sx={{ mb: 1.5, borderRadius: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography sx={{ fontWeight: 'bold' }}>
                      {index + 1}. {q.question_text}
                    </Typography>
                  </AccordionSummary>

                  <AccordionDetails>
                    <Chip
                      label={q.question_type === 'true_false' ? 'صح وغلط' : 'اختياري'}
                      size="small"
                      sx={{ mb: 2 }}
                    />

                    {q.answers?.map((a) => (
                      <Box
                        key={a.id}
                        sx={{
                          p: 1.2,
                          mb: 1,
                          borderRadius: 2,
                          border: `1px solid ${Number(a.is_correct) === 1 ? '#4caf50' : (isDark ? focusBorderColor : '#ddd')}`,
                          backgroundColor: isDark
                            ? (Number(a.is_correct) === 1 ? 'rgba(76,175,80,.14)' : theme.palette.surfaces.card)
                            : (Number(a.is_correct) === 1 ? '#edf7ed' : '#fff'),
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        {Number(a.is_correct) === 1 && <CheckCircle sx={{ color: '#4caf50' }} />}
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
              ))}
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
            backgroundColor: isDark ? theme.palette.surfaces.card : '#fff'
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
        <DialogTitle sx={{ fontWeight: 'bold', color: primaryDark }}>
          نتائج وإجابات الاختبار
        </DialogTitle>

        <DialogContent dividers sx={{ backgroundColor: isDark ? theme.palette.surfaces.section : '#fbfdfc' }}>
          {loadingAttempts ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <CircularProgress sx={{ color: primaryColor }} />
            </Box>
          ) : selectedExamAttempts ? (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: primaryDark, mb: 1 }}>
                  {selectedExamAttempts.exam?.title}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label={`عدد المحاولات: ${selectedExamAttempts.attempts?.length || 0}`} />
                  <Chip label={`عدد الأسئلة: ${selectedExamAttempts.exam?.questions_count || 0}`} />
                </Box>
              </Box>

              {selectedExamAttempts.attempts?.length ? (
                selectedExamAttempts.attempts.map((attempt, attemptIndex) => (
                  <Accordion key={attempt.id} defaultExpanded={attemptIndex === 0} sx={{ mb: 2, borderRadius: 3 }}>
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
                        <Typography sx={{ fontWeight: 'bold', color: primaryDark }}>
                          {attemptIndex + 1}. {attempt.student_name}
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Chip label={`الهوية: ${attempt.national_id}`} size="small" />
                          <Chip label={`الدرجة: ${attempt.score} / ${attempt.total_score}`} size="small" />
                          <Chip label={`النسبة: ${attempt.percentage}%`} size="small" />
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
                          backgroundColor: isDark ? theme.palette.surfaces.card : '#fff'
                        }}
                      >
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ backgroundColor: isDark ? theme.palette.surfaces.nested : '#edf7f2' }}>
                              <TableCell align="center" sx={{ fontWeight: 'bold' }}>#</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 'bold' }}>السؤال</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 'bold' }}>إجابة الطالب</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 'bold' }}>الإجابة الصحيحة</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 'bold' }}>الحالة</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 'bold' }}>الدرجة</TableCell>
                            </TableRow>
                          </TableHead>

                          <TableBody>
                            {attempt.answers?.map((ans, index) => (
                              <TableRow
                                key={`${attempt.id}-${ans.question_id}`}
                                sx={{
                                  backgroundColor: isDark
                                    ? (Number(ans.is_correct) === 1 ? 'rgba(76,175,80,.14)' : 'rgba(229,90,90,.12)')
                                    : (Number(ans.is_correct) === 1 ? '#f1f8f4' : '#fff7f7')
                                }}
                              >
                                <TableCell align="center">{index + 1}</TableCell>
                                <TableCell align="right" sx={{ minWidth: 260 }}>
                                  {ans.question_text}
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
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </AccordionDetails>
                  </Accordion>
                ))
              ) : (
                <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 4 }}>
                  <Typography sx={{ color: primaryDark, fontWeight: 'bold' }}>
                    لا توجد محاولات لهذا الاختبار حتى الآن
                  </Typography>
                </Paper>
              )}
            </Box>
          ) : (
            <Typography>لا توجد بيانات</Typography>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setShowAttemptsDialog(false)}>إغلاق</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default HRCreateExams;