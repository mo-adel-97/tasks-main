import React, { useEffect, useMemo, useState } from "react";
import Swal from 'sweetalert2';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Switch,
  FormControlLabel,
  TextField,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  AppBar,
  Toolbar,
  Stack,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Radio,
  RadioGroup,
  FormControlLabel as MuiFormControlLabel,
  FormLabel,
  Snackbar
} from "@mui/material";
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  VisibilityOff as ViewOffIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Shuffle as ShuffleIcon,
  Reorder as ReorderIcon,
  ContentCopy as CopyIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from "@mui/icons-material";
import { API_BASE, apiPost, courseApi } from "../config/apiConfig";
import { LEVEL_ORDER, levelRank, COURSES_DATA } from "../constants/courseData";
import Sidebar from "../components/Sidebar";

// ===== المكونات المساعدة =====

const Badge = ({ children, tone = "neutral" }) => {
  const toneColors = {
    neutral: { bg: "#f8f9fa", color: "#6c757d" },
    blue: { bg: "#80b49e", color: "white" },
    green: { bg: "#28a745", color: "white" },
    orange: { bg: "#fd7e14", color: "white" },
    purple: { bg: "#6f42c1", color: "white" }
  };

  const colors = toneColors[tone] || toneColors.neutral;

  return (
    <Chip
      label={children}
      size="small"
      sx={{
        backgroundColor: colors.bg,
        color: colors.color,
        fontWeight: "bold",
        fontSize: "0.75rem"
      }}
    />
  );
};

// ===== مكون إدارة المقررات =====

const CourseManagement = ({ 
  diplomas, 
  levels, 
  userBranch,
  onCourseCreated 
}) => {
  const [showCourseDialog, setShowCourseDialog] = useState(false);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [courseForm, setCourseForm] = useState({
    diploma_name: '',
    level_name: '',
    course_name: ''
  });

   const showAlert = (title, text, icon = 'success') => {
    return Swal.fire({
      title,
      text,
      icon,
      confirmButtonText: 'موافق',
      confirmButtonColor: '#80b49e'
    });
  };

  const showConfirm = (title, text, confirmButtonText = 'نعم', cancelButtonText = 'لا') => {
    return Swal.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#80b49e',
      confirmButtonText,
      cancelButtonText
    });
  };
// جلب المقررات عند فتح الدايلوج
const loadCourses = async (diploma = '', level = '') => {
  if (!userBranch?.guid) return;
  
  setLoading(true);
  try {
    // استخدم BRANCHGUID بدلاً من branch_guid
    const payload = { BRANCHGUID: userBranch.guid };
    
    // استخدم DIPLOMA و LEVELS بدلاً من diploma_name و level_name
    if (diploma) payload.DIPLOMA = diploma;
    if (level) payload.LEVELS = level;
    
    console.log('Loading courses with payload:', payload); // لل debugging
    
    const res = await courseApi.getCourses(payload);
    if (res.ok) {
      setCourses(res.courses || []);
    } else {
      console.error('Error in response:', res.error);
    }
  } catch (error) {
    console.error('Error loading courses:', error);
  } finally {
    setLoading(false);
  }
};

  // فتح دايلوج إدارة المقررات
  const handleOpenDialog = () => {
    setShowCourseDialog(true);
    loadCourses();
  };

// إنشاء مقرر جديد
// إنشاء مقرر جديد - النسخة المحسنة
const handleCreateCourse = async () => {
  if (!courseForm.diploma_name || !courseForm.level_name || !courseForm.course_name) {
    Swal.fire({
      title: 'تنبيه',
      text: 'يرجى ملء جميع الحقول',
      icon: 'warning',
      confirmButtonText: 'موافق',
      confirmButtonColor: '#80b49e'
    });
    return;
  }

  setLoading(true);
  try {
    const payload = {
      branch_guid: userBranch.guid,
      diploma_name: courseForm.diploma_name,
      level_name: courseForm.level_name,
      course_name: courseForm.course_name
    };
    
    console.log('Creating course with payload:', payload);
    
    const res = await courseApi.createCourse(payload);
    
    console.log('Create course response:', res);
    
    if (res.ok) {
      await Swal.fire({
        title: 'نجاح',
        text: res.message || 'تم إنشاء المقرر بنجاح',
        icon: 'success',
        confirmButtonText: 'موافق',
        confirmButtonColor: '#80b49e'
      });
      
      setCourseForm({ diploma_name: '', level_name: '', course_name: '' });
      loadCourses(courseForm.diploma_name, courseForm.level_name);
      if (onCourseCreated) onCourseCreated();
    } else {
      await Swal.fire({
        title: 'خطأ',
        text: res.error || 'حدث خطأ أثناء إنشاء المقرر',
        icon: 'error',
        confirmButtonText: 'موافق',
        confirmButtonColor: '#80b49e'
      });
    }
  } catch (error) {
    console.error('Error creating course:', error);
    await Swal.fire({
      title: 'خطأ',
      text: 'حدث خطأ غير متوقع: ' + error.message,
      icon: 'error',
      confirmButtonText: 'موافق',
      confirmButtonColor: '#80b49e'
    });
  } finally {
    setLoading(false);
  }
};

// حذف مقرر - النسخة المحسنة
const handleDeleteCourse = async (courseId) => {
  const result = await Swal.fire({
    title: 'تأكيد الحذف',
    text: 'هل أنت متأكد من حذف هذا المقرر؟',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#80b49e',
    confirmButtonText: 'نعم، احذف',
    cancelButtonText: 'إلغاء'
  });
  
  if (!result.isConfirmed) return;
  
  try {
    console.log('Deleting course with ID:', courseId);
    
    const res = await courseApi.deleteCourse({ course_id: courseId });
    
    console.log('Delete response:', res);
    
    if (res.ok) {
      await Swal.fire({
        title: 'نجاح',
        text: res.message || 'تم حذف المقرر بنجاح',
        icon: 'success',
        confirmButtonText: 'موافق',
        confirmButtonColor: '#80b49e'
      });
      loadCourses(courseForm.diploma_name, courseForm.level_name);
    } else {
      await Swal.fire({
        title: 'خطأ',
        text: res.error || 'حدث خطأ أثناء حذف المقرر',
        icon: 'error',
        confirmButtonText: 'موافق',
        confirmButtonColor: '#80b49e'
      });
    }
  } catch (error) {
    console.error('Delete course error:', error);
    await Swal.fire({
      title: 'خطأ',
      text: 'حدث خطأ غير متوقع: ' + error.message,
      icon: 'error',
      confirmButtonText: 'موافق',
      confirmButtonColor: '#80b49e'
    });
  }
};


  // عند تغيير الدبلوم أو المستوى
  const handleDiplomaChange = (diploma) => {
    setCourseForm(prev => ({ ...prev, diploma_name: diploma, level_name: '' }));
    loadCourses(diploma, '');
  };

  const handleLevelChange = (level) => {
    setCourseForm(prev => ({ ...prev, level_name: level }));
    loadCourses(courseForm.diploma_name, level);
  };

  return (
    <>
      {/* زر فتح إدارة المقررات */}
      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={handleOpenDialog}
        sx={{ 
          borderColor: '#80b49e', 
          color: '#80b49e',
          '&:hover': {
            borderColor: '#6a9c8a',
            backgroundColor: 'rgba(128, 180, 158, 0.04)'
          }
        }}
      >
        إدارة المقررات
      </Button>

      {/* دايلوج إدارة المقررات */}
      <Dialog 
        open={showCourseDialog} 
        onClose={() => setShowCourseDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h5" fontWeight="bold" sx={{ color: '#80b49e' }}>
            إدارة المقررات
          </Typography>
        </DialogTitle>
        
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            {/* نموذج إضافة مقرر جديد */}
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#80b49e' }}>
                  إضافة مقرر جديد
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>الدبلوم</InputLabel>
                      <Select
                        value={courseForm.diploma_name}
                        onChange={(e) => handleDiplomaChange(e.target.value)}
                        label="الدبلوم"
                      >
                        <MenuItem value="">— اختر الدبلوم —</MenuItem>
                        {diplomas.map((d) => (
                          <MenuItem key={d} value={d}>{d}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth disabled={!courseForm.diploma_name}>
                      <InputLabel>المستوى</InputLabel>
                      <Select
                        value={courseForm.level_name}
                        onChange={(e) => handleLevelChange(e.target.value)}
                        label="المستوى"
                      >
                        <MenuItem value="">— اختر المستوى —</MenuItem>
                        {levels
                          .filter(l => diplomas.includes(courseForm.diploma_name))
                          .map((lv) => (
                            <MenuItem key={lv} value={lv}>{lv}</MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      label="اسم المقرر"
                      value={courseForm.course_name}
                      onChange={(e) => setCourseForm(prev => ({ ...prev, course_name: e.target.value }))}
                      fullWidth
                      disabled={!courseForm.level_name}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      onClick={handleCreateCourse}
                      disabled={loading || !courseForm.course_name}
                      sx={{ 
                        backgroundColor: '#80b49e',
                        '&:hover': { backgroundColor: '#6a9c8a' }
                      }}
                    >
                      {loading ? 'جاري الإضافة...' : 'إضافة المقرر'}
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* قائمة المقررات الحالية */}
           <Card variant="outlined">
  <CardContent>
    <Typography variant="h6" gutterBottom sx={{ color: '#80b49e' }}>
      المقررات الحالية ({courses.length})
      {courseForm.diploma_name && courseForm.level_name && (
        <Typography variant="body2" color="text.secondary">
          {courseForm.diploma_name} - {courseForm.level_name}
        </Typography>
      )}
    </Typography>

    {loading ? (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress />
      </Box>
    ) : courses.length > 0 ? (
      <List>
        {courses.map((course) => (
          <ListItem
            key={course.ID || course.id} // استخدم ID أو id
            secondaryAction={
              <IconButton 
                edge="end" 
                onClick={() => handleDeleteCourse(course.ID || course.id)}
                color="error"
              >
                <DeleteIcon />
              </IconButton>
            }
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              mb: 1
            }}
          >
            <ListItemText
              primary={course.NAME || course.name || course.course_name} // استخدم NAME أو name أو course_name
              secondary={`${course.DIPLOMA || course.diploma || course.diploma_name} - ${course.LEVELS || course.level || course.level_name}`}
            />
          </ListItem>
        ))}
      </List>
    ) : (
      <Alert severity="info">
        لا توجد مقررات مسجلة {courseForm.diploma_name && courseForm.level_name ? 'لهذا الدبلوم والمستوى' : ''}
      </Alert>
    )}
  </CardContent>
</Card>
          </Stack>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowCourseDialog(false)}>
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// ===== مكونات الفورم =====

const BasicFilters = ({ form, setForm, diplomas, levels, filteredCourses, setExamId, setQuestions }) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={3}>
        <FormControl fullWidth>
          <InputLabel>الدبلوم</InputLabel>
          <Select
            value={form.diploma_id}
            onChange={(e) => {
              setForm({ ...form, diploma_id: e.target.value, level_id: "", course_id: "" });
              setExamId(null);
              setQuestions([]);
            }}
            label="الدبلوم"
          >
            <MenuItem value="">— اختر الدبلوم —</MenuItem>
            {diplomas.map((d) => (
              <MenuItem key={d} value={d}>{d}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} md={3}>
        <FormControl fullWidth disabled={!form.diploma_id}>
          <InputLabel>المستوى</InputLabel>
          <Select
            value={form.level_id}
            onChange={(e) => {
              setForm({ ...form, level_id: e.target.value, course_id: "" });
              setExamId(null);
              setQuestions([]);
            }}
            label="المستوى"
          >
            <MenuItem value="">— اختر المستوى —</MenuItem>
            {levels.map((lv) => (
              <MenuItem key={lv} value={lv}>{lv}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

             <Grid item xs={12} md={3}>
        <FormControl fullWidth disabled={!form.level_id}>
          <InputLabel>المقرر</InputLabel>
          <Select
            value={form.course_id}
            onChange={(e) => setForm({ ...form, course_id: e.target.value })}
            label="المقرر"
          >
            <MenuItem value="">— اختر المقرر —</MenuItem>
            {filteredCourses.map((course) => {
              const courseId = course.id;
              const courseName = course.name;
              return (
                <MenuItem key={courseId} value={courseId}>
                  {courseName}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </Grid>



      <Grid item xs={12} md={3}>
        <Stack spacing={2}>
          <TextField
            label="عنوان الاختبار"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            size="small"
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              label="الدرجة الكلية"
              type="number"
              value={form.total_grade}
              onChange={(e) => setForm({ ...form, total_grade: e.target.value })}
              size="small"
              sx={{ flex: 1 }}
            />
            <TextField
              label="المدة (دقيقة)"
              type="number"
              value={form.duration_minutes}
              onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
              size="small"
              sx={{ flex: 1 }}
            />
          </Box>
        </Stack>
      </Grid>
    </Grid>
  );
};

const SharedCourseFilters = ({ 
  sharedCourses, 
  selectedSharedCourse, 
  setSelectedSharedCourse, 
  filteredCombinations, 
  viewExam, 
  viewAnswerKey, 
  busy,
  form,
 setForm,
 editExamFromCombination}) => {
  return (
    <Stack spacing={3}>
      <FormControl fullWidth>
        <InputLabel>المادة المشتركة</InputLabel>
        <Select
          value={selectedSharedCourse}
          onChange={(e) => setSelectedSharedCourse(e.target.value)}
          label="المادة المشتركة"
        >
          <MenuItem value="">— اختر المادة المشتركة —</MenuItem>
         {sharedCourses.map((course) => (
   <MenuItem key={course.id} value={course.name}>
     {course.name}
   </MenuItem>
 ))}
        </Select>
      </FormControl>

      {selectedSharedCourse && (
        <Box>
          <Typography variant="h6" gutterBottom sx={{ color: '#80b49e', fontWeight: 'bold' }}>
            التركيبات المتاحة ({filteredCombinations.length})
          </Typography>
          <Grid container spacing={2}>
            {filteredCombinations.map((combination, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="body1" fontWeight="bold">
                        {combination.course_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {combination.diploma} - {combination.level}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        startIcon={<ViewIcon />}
                        onClick={() => viewExam(combination)}
                        disabled={busy}
                        sx={{ color: '#80b49e' }}
                      >
                        عرض
                      </Button>
                      <Button
                        size="small"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => viewAnswerKey(combination)}
                        disabled={busy}
                        sx={{ color: '#80b49e' }}
                      >
                        الإجابة
                      </Button>
                       <Button
  size="small"
   startIcon={<EditIcon />}
   onClick={() => editExamFromCombination(combination)}
   disabled={busy}
   sx={{ color: '#80b49e' }}
 >
   تعديل
 </Button>
                    </Stack>
                  </Stack>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="الدرجة الكلية"
          type="number"
          value={form.total_grade}
          onChange={(e) => setForm({ ...form, total_grade: e.target.value })}
          size="small"
          sx={{ width: 120 }}
        />
        <TextField
          label="المدة (دقيقة)"
          type="number"
          value={form.duration_minutes}
          onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
          size="small"
          sx={{ width: 120 }}
        />
      </Box>
    </Stack>
  );
};

// ===== مكونات الأسئلة =====

const QuestionForm = ({
  editingId,
  qType,
  setQType,
  qText,
  setQText,
  score,
  setScore,
  tfCorrect,
  setTfCorrect,
  mcqOpts,
  updateOpt,
  addOpt,
  removeOpt,
  setCorrectOnly,
  submitQuestion,
  busy
}) => {
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ color: '#80b49e', fontWeight: 'bold' }}>
          {editingId ? "تعديل السؤال" : "إضافة سؤال جديد"}
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>نوع السؤال</InputLabel>
              <Select
                value={qType}
                onChange={(e) => setQType(e.target.value)}
                label="نوع السؤال"
              >
                <MenuItem value="TF">صح/خطأ</MenuItem>
                <MenuItem value="MCQ">اختيار من متعدد</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="الدرجة"
              type="number"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="نص السؤال"
              value={qText}
              onChange={(e) => setQText(e.target.value)}
              multiline
              rows={3}
              fullWidth
            />
          </Grid>

          {qType === "TF" && (
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <FormLabel component="legend">الإجابة الصحيحة</FormLabel>
                <RadioGroup
                  row
                  value={tfCorrect}
                  onChange={(e) => setTfCorrect(e.target.value)}
                >
                  <MuiFormControlLabel value="صح" control={<Radio />} label="صح" />
                  <MuiFormControlLabel value="خطأ" control={<Radio />} label="خطأ" />
                </RadioGroup>
              </FormControl>
            </Grid>
          )}

          {qType === "MCQ" && (
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                الخيارات
              </Typography>
              <Stack spacing={2}>
                {mcqOpts.map((opt, index) => (
                  <Box key={opt.id} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Radio
                      checked={opt.correct}
                      onChange={() => setCorrectOnly(opt.id)}
                      sx={{ color: '#80b49e' }}
                    />
                    <TextField
                      value={opt.text}
                      onChange={(e) => updateOpt(opt.id, { text: e.target.value })}
                      placeholder={`الخيار ${index + 1}`}
                      fullWidth
                      size="small"
                    />
                    {mcqOpts.length > 2 && (
                      <IconButton
                        onClick={() => removeOpt(opt.id)}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>
                ))}
                <Button
                  startIcon={<AddIcon />}
                  onClick={addOpt}
                  sx={{ color: '#80b49e', alignSelf: 'flex-start' }}
                >
                  إضافة خيار
                </Button>
              </Stack>
            </Grid>
          )}

          <Grid item xs={12}>
            <Button
              variant="contained"
              startIcon={busy ? <CircularProgress size={20} /> : <SaveIcon />}
              onClick={submitQuestion}
              disabled={busy || !qText.trim()}
              sx={{ 
                backgroundColor: '#80b49e',
                '&:hover': { backgroundColor: '#6a9c8a' }
              }}
            >
              {busy ? "جاري الحفظ..." : (editingId ? "تحديث السؤال" : "إضافة السؤال")}
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

const QuestionList = ({
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
}) => {
  const tfQuestions = questions.filter(q => q.type === "TF");
  const mcqQuestions = questions.filter(q => q.type === "MCQ");

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ color: '#80b49e', fontWeight: 'bold' }}>
            قائمة الأسئلة ({questions.length} سؤال)
          </Typography>
          
          <Stack direction="row" spacing={1}>
            <Button
              startIcon={<ReorderIcon />}
              onClick={() => reorderQuestions('tfFirst')}
              variant="outlined"
              size="small"
              sx={{ color: '#80b49e', borderColor: '#80b49e' }}
            >
              صح/خطأ أولاً
            </Button>
            <Button
              startIcon={<ReorderIcon />}
              onClick={() => reorderQuestions('mcqFirst')}
              variant="outlined"
              size="small"
              sx={{ color: '#80b49e', borderColor: '#80b49e' }}
            >
              اختياري أولاً
            </Button>
            <Button
              startIcon={<ShuffleIcon />}
              onClick={() => reorderQuestions('shuffle')}
              variant="outlined"
              size="small"
              sx={{ color: '#80b49e', borderColor: '#80b49e' }}
            >
              خلط
            </Button>
          </Stack>
        </Box>

        {!examSaved && (
          <Box sx={{ mb: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 1 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body1">
                {questions.length > 0 ? "تم إضافة الأسئلة، يمكنك الحفظ النهائي" : "أضف الأسئلة أولاً"}
              </Typography>
              <Button
                variant="contained"
                startIcon={busy ? <CircularProgress size={20} /> : <SaveIcon />}
                onClick={saveExam}
                disabled={busy || questions.length === 0}
                sx={{ 
                  backgroundColor: '#80b49e',
                  '&:hover': { backgroundColor: '#6a9c8a' }
                }}
              >
                {busy ? "جاري الحفظ..." : "حفظ الاختبار نهائياً"}
              </Button>
            </Stack>
          </Box>
        )}

        {examSaved && (
          <Alert severity="success" sx={{ mb: 3 }}>
            تم حفظ الاختبار بنجاح!
          </Alert>
        )}

        {/* أسئلة الصح/خطأ */}
        {tfQuestions.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#80b49e', fontWeight: 'bold', borderBottom: '2px solid #80b49e', pb: 1 }}>
              أسئلة الصح/خطأ ({tfQuestions.length})
            </Typography>
            <List>
              {tfQuestions.map((q, index) => (
                <QuestionListItem
                  key={q.id}
                  question={q}
                  index={index}
                  onEdit={startEdit}
                  onDelete={deleteQuestion}
                  type="TF"
                />
              ))}
            </List>
          </Box>
        )}

        {/* أسئلة الاختيار من متعدد */}
        {mcqQuestions.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ color: '#80b49e', fontWeight: 'bold', borderBottom: '2px solid #80b49e', pb: 1 }}>
              أسئلة الاختيار من متعدد ({mcqQuestions.length})
            </Typography>
            <List>
              {mcqQuestions.map((q, index) => (
                <QuestionListItem
                  key={q.id}
                  question={q}
                  index={index}
                  onEdit={startEdit}
                  onDelete={deleteQuestion}
                  type="MCQ"
                />
              ))}
            </List>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const QuestionListItem = ({ question, index, onEdit, onDelete, type }) => {
  return (
    <ListItem
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        mb: 1,
        bgcolor: 'background.paper'
      }}
    >
      <ListItemText
        primary={
          <Box>
            <Typography variant="body1" fontWeight="bold" gutterBottom>
              {index + 1}. {question.text}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Badge tone={type === "TF" ? "blue" : "purple"}>
                {type === "TF" ? "صح/خطأ" : "اختياري"}
              </Badge>
              <Badge tone="orange">
                {question.score} نقطة
              </Badge>
            </Stack>
          </Box>
        }
        secondary={
          type === "MCQ" && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                الخيارات:
              </Typography>
              <Stack spacing={0.5}>
                {question.options.map((opt, optIndex) => (
                  <Box
                    key={optIndex}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      color: opt.correct ? 'success.main' : 'text.secondary',
                      fontWeight: opt.correct ? 'bold' : 'normal'
                    }}
                  >
                    <CheckCircleIcon
                      sx={{
                        fontSize: 16,
                        color: opt.correct ? 'success.main' : 'transparent'
                      }}
                    />
                    <Typography variant="body2">
                      {opt.text}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          )
        }
      />
      <ListItemSecondaryAction>
        <Stack direction="row" spacing={1}>
          <IconButton
            onClick={() => onEdit(question)}
            sx={{ color: '#80b49e' }}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            onClick={() => onDelete(question.id)}
            color="error"
          >
            <DeleteIcon />
          </IconButton>
        </Stack>
      </ListItemSecondaryAction>
    </ListItem>
  );
};

// ===== مكونات العرض =====

const ExamViewer = ({ examData, onClose, onCopyToAll }) => {
  if (!examData) return null;

  return (
    <Dialog open={true} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" fontWeight="bold">
            معاينة الاختبار
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>
      
      <DialogContent>
        <ExamViewerContent examData={examData} />
      </DialogContent>
      
      <DialogActions>
        <Button
          startIcon={<CopyIcon />}
          onClick={() => onCopyToAll(examData)}
          sx={{ color: '#80b49e' }}
        >
          نسخ لجميع التركيبات
        </Button>
        <Button onClick={onClose} variant="contained" sx={{ backgroundColor: '#80b49e' }}>
          إغلاق
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ExamViewerContent = ({ examData }) => {
  const { exam, questions = [] } = examData;
  const tfQuestions = questions.filter(q => q.type === "TF");
  const mcqQuestions = questions.filter(q => q.type === "MCQ");

  return (
    <Stack spacing={3}>
      {/* معلومات الاختبار */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: '#80b49e', fontWeight: 'bold' }}>
            معلومات الاختبار
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography><strong>العنوان:</strong> {exam?.title}</Typography>
              <Typography><strong>الدبلوم:</strong> {examData.diploma}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography><strong>المستوى:</strong> {examData.level}</Typography>
              <Typography><strong>المقرر:</strong> {examData.course_name}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography><strong>الدرجة الكلية:</strong> {exam?.total_grade}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography><strong>المدة:</strong> {exam?.duration_minutes} دقيقة</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* أسئلة الصح/خطأ */}
      {tfQuestions.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: '#80b49e', fontWeight: 'bold' }}>
              أسئلة الصح/خطأ ({tfQuestions.length})
            </Typography>
            <List>
              {tfQuestions.map((q, index) => (
                <ListItem key={q.id} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                  <ListItemText
                    primary={`${index + 1}. ${q.text}`}
                    secondary={
                      <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                        <Chip label={`${q.score} نقطة`} size="small" />
                        <Chip 
                          label={q.options.find(opt => opt.correct)?.text === "صح" ? "الإجابة: صح" : "الإجابة: خطأ"} 
                          size="small" 
                          color="success"
                        />
                      </Stack>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* أسئلة الاختيار من متعدد */}
      {mcqQuestions.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: '#80b49e', fontWeight: 'bold' }}>
              أسئلة الاختيار من متعدد ({mcqQuestions.length})
            </Typography>
            <List>
              {mcqQuestions.map((q, index) => (
                <ListItem key={q.id} sx={{ borderBottom: '1px solid', borderColor: 'divider', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <ListItemText
                    primary={`${index + 1}. ${q.text}`}
                    secondary={
                      <Box sx={{ mt: 1, width: '100%' }}>
                        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                          <Chip label={`${q.score} نقطة`} size="small" />
                        </Stack>
                        <Grid container spacing={1}>
                          {q.options.map((opt, optIndex) => (
                            <Grid item xs={12} md={6} key={optIndex}>
                              <Box
                                sx={{
                                  p: 1,
                                  border: '1px solid',
                                  borderColor: opt.correct ? 'success.main' : 'divider',
                                  borderRadius: 1,
                                  bgcolor: opt.correct ? 'success.light' : 'transparent',
                                  color: opt.correct ? 'success.dark' : 'text.primary',
                                  fontWeight: opt.correct ? 'bold' : 'normal'
                                }}
                              >
                                {opt.text}
                                {opt.correct && (
                                  <CheckCircleIcon sx={{ fontSize: 16, ml: 1 }} />
                                )}
                              </Box>
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {questions.length === 0 && (
        <Alert severity="info">
          لا توجد أسئلة في هذا الاختبار
        </Alert>
      )}
    </Stack>
  );
};

const AnswerKeyViewer = ({ examData, onClose }) => {
  if (!examData) return null;

  return (
    <Dialog open={true} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" fontWeight="bold">
            نموذج الإجابة الصحيحة
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>
      
      <DialogContent>
        <AnswerKeyContent examData={examData} />
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} variant="contained" sx={{ backgroundColor: '#80b49e' }}>
          إغلاق
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const AnswerKeyContent = ({ examData }) => {
  const { questions = [] } = examData;
  const tfQuestions = questions.filter(q => q.type === "TF");
  const mcqQuestions = questions.filter(q => q.type === "MCQ");

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: '#80b49e', fontWeight: 'bold', textAlign: 'center' }}>
            نموذج الإجابة الصحيحة
          </Typography>

          {/* أسئلة الصح/خطأ */}
          {tfQuestions.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ borderBottom: '2px solid #80b49e', pb: 1 }}>
                أسئلة الصح/خطأ
              </Typography>
              <Grid container spacing={2}>
                {tfQuestions.map((q, index) => (
                  <Grid item xs={12} md={6} key={q.id}>
                    <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography fontWeight="bold">
                          {index + 1}
                        </Typography>
                        <Typography fontWeight="bold" color="success.main">
                          {q.options.find(opt => opt.correct)?.text}
                        </Typography>
                        <Typography color="text.secondary">
                          {q.score} نقطة
                        </Typography>
                      </Stack>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* أسئلة الاختيار من متعدد */}
          {mcqQuestions.length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ borderBottom: '2px solid #80b49e', pb: 1 }}>
                أسئلة الاختيار من متعدد
              </Typography>
              <Grid container spacing={2}>
                {mcqQuestions.map((q, index) => (
                  <Grid item xs={12} key={q.id}>
                    <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                        <Typography fontWeight="bold" sx={{ minWidth: 40 }}>
                          {index + 1}
                        </Typography>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" gutterBottom>
                            {q.text}
                          </Typography>
                          <Typography variant="body2" color="success.main" fontWeight="bold">
                            الإجابة الصحيحة: {q.options.find(opt => opt.correct)?.text}
                          </Typography>
                        </Box>
                        <Typography color="text.secondary">
                          {q.score} نقطة
                        </Typography>
                      </Stack>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {questions.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              لا توجد أسئلة في هذا الاختبار
            </Alert>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
};

// ===== الصفحة الرئيسية =====

export default function CreateExam({ userBranch }) {
  const [metaLoading, setMetaLoading] = useState(false);
  const [metaErr, setMetaErr] = useState("");
  const [studentsData, setStudentsData] = useState([]);
  const [branchCourses, setBranchCourses] = useState([]);
  const [branchCoursesLoading, setBranchCoursesLoading] = useState(false);
  const [branchCoursesErr, setBranchCoursesErr] = useState("");
const [allBranchCourses, setAllBranchCourses] = useState([]);
const [allBranchCoursesLoading, setAllBranchCoursesLoading] = useState(false);
const [allBranchCoursesErr, setAllBranchCoursesErr] = useState("");
    const [form, setForm] = useState({
    diploma_id: "",
    level_id: "",
    course_id: "",
    title: "",
    total_grade: 60,
    duration_minutes: 60,
  });
    // تحميل المقررات الخاصة بالفرع + الدبلوم + المستوى
  useEffect(() => {
    if (!userBranch?.guid || !form.diploma_id || !form.level_id) {
      setBranchCourses([]);
      setBranchCoursesErr("");
      return;
    }

    let cancelled = false;

    (async () => {
      setBranchCoursesLoading(true);
      setBranchCoursesErr("");

      try {
        const res = await courseApi.getCourses({
          BRANCHGUID: userBranch.guid,
          DIPLOMA: form.diploma_id,
          LEVELS: form.level_id,
        });

        if (cancelled) return;

        if (res.ok) {
          setBranchCourses(res.courses || []);
          if (!res.courses || res.courses.length === 0) {
            setBranchCoursesErr("لا توجد مقررات مسجلة لهذا الفرع/الدبلوم/المستوى.");
          }
        } else {
          setBranchCourses([]);
          setBranchCoursesErr(res.error || "فشل في تحميل المقررات.");
        }
      } catch (err) {
        if (!cancelled) {
          setBranchCourses([]);
          setBranchCoursesErr("خطأ في تحميل المقررات.");
        }
      } finally {
        if (!cancelled) setBranchCoursesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userBranch?.guid, form.diploma_id, form.level_id]);

// تحميل كل المقررات الخاصة بالفرع (بدون فلترة دبلوم/مستوى) علشان المواد المشتركة
useEffect(() => {
  if (!userBranch?.guid) {
    setAllBranchCourses([]);
    setAllBranchCoursesErr("");
    return;
  }

  let cancelled = false;

  (async () => {
    setAllBranchCoursesLoading(true);
    setAllBranchCoursesErr("");

    try {
      const res = await courseApi.getCourses({
        BRANCHGUID: userBranch.guid, // بس الفرع
      });

      if (cancelled) return;

      if (res.ok) {
        setAllBranchCourses(res.courses || []);
        if (!res.courses || res.courses.length === 0) {
          setAllBranchCoursesErr("لا توجد مقررات مسجلة لهذا الفرع.");
        }
      } else {
        setAllBranchCourses([]);
        setAllBranchCoursesErr(res.error || "فشل في تحميل مقررات الفرع.");
      }
    } catch (err) {
      if (!cancelled) {
        setAllBranchCourses([]);
        setAllBranchCoursesErr("خطأ في تحميل مقررات الفرع.");
      }
    } finally {
      if (!cancelled) setAllBranchCoursesLoading(false);
    }
  })();

  return () => {
    cancelled = true;
  };
}, [userBranch?.guid]);

const editExamFromCombination = (combination) => {
  // روح للوضع العادي
  setSharedCourseMode(false);

  // ظبط الفلتر على نفس الدبلوم/المستوى/المقرر
  setForm(prev => ({
    ...prev,
    diploma_id: combination.diploma,
    level_id: combination.level,
    course_id: combination.course_id,
  }));

  // عشان نضمن أنه يعيد تحميل الاختبار من السيرفر
  setExamId(null);
  setQuestions([]);
  setExamSaved(false);
};

  const [examId, setExamId] = useState(null);
  const [examSaved, setExamSaved] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [sectionOrder, setSectionOrder] = useState(["TF", "MCQ"]);

  // وضع التعديل
  const [editingId, setEditingId] = useState(null);
  const [qType, setQType] = useState("TF");
  const [qText, setQText] = useState("");
  const [score, setScore] = useState(1);
  const [tfCorrect, setTfCorrect] = useState("صح");
  const [mcqOpts, setMcqOpts] = useState([
    { id: 1, text: "", correct: false },
    { id: 2, text: "", correct: false },
  ]);

  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  // حالة جديدة للتعامل مع المواد المشتركة
  const [sharedCourseMode, setSharedCourseMode] = useState(false);
  const [selectedSharedCourse, setSelectedSharedCourse] = useState("");
  const [sharedCourseCombinations, setSharedCourseCombinations] = useState([]);

  // حالة لعرض الاختبار
  const [viewingExam, setViewingExam] = useState(null);
  const [copyingExam, setCopyingExam] = useState(false);
  
  // حالة لعرض نموذج الإجابة الصحيحة
  const [viewingAnswerKey, setViewingAnswerKey] = useState(null);

  const showToast = (message, severity = "success") => {
    setToast({ open: true, message, severity });
  };

  const handleCloseToast = () => {
    setToast({ ...toast, open: false });
  };

  // استخدام branch المستخدم بدلاً من الرابط الثابت
  const STUDENTS_API = userBranch?.guid 
    ? `https://api1.sstli.com/api/StudentStudyInfo/by-branch/${userBranch.guid}`
    : null;

  /* تحميل الدبلومات/المستويات */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!STUDENTS_API) return;
      
      setMetaLoading(true);
      setMetaErr("");
      try {
        const res = await fetch(STUDENTS_API, {
          mode: "cors",
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Content-Type': 'application/json'
          }
        });
        const json = await res.json();
        if (!cancelled) {
          const arr = Array.isArray(json) ? json : [];
          setStudentsData(arr);
        }
      } catch (e) {
        if (!cancelled) {
          setMetaErr("تعذر تحميل الدبلومات/المستويات من الـ API. تم الاعتماد على بيانات تجريبية.");
          const fake = [
            { diplomName: "دبلوم القانون", levelName: "الأول" },
            { diplomName: "دبلوم الموارد البشرية", levelName: "الرابع" },
            { diplomName: "دبلوم إدارة الأعمال", levelName: "الرابع" },
            { diplomName: "دبلوم إدارة الأعمال", levelName: "الأول" },
            { diplomName: "دبلوم الأمن السيبراني", levelName: "الأول" },
            { diplomName: "دبلوم إدارة الأعمال", levelName: "السادس" },
          ];
          setStudentsData(fake);
        }
      } finally {
        if (!cancelled) setMetaLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [STUDENTS_API]);

  const diplomas = useMemo(() => {
    const set = new Set(studentsData.map(s => (s.diplomName || "").trim()).filter(Boolean));
    return Array.from(set).sort();
  }, [studentsData]);

  const levels = useMemo(() => {
    const filtered = studentsData.filter(s =>
      !form.diploma_id
        ? true
        : (s.diplomName || "").trim() === (form.diploma_id || "").trim()
    );
    const set = new Set(filtered.map(s => (s.levelName || "").trim()).filter(Boolean));
    return Array.from(set).sort((a,b) => levelRank(a) - levelRank(b));
  }, [studentsData, form.diploma_id]);

// بيانات الـ master من COURSES_DATA (زي ما هي)
const courses = useMemo(() => COURSES_DATA, []);

// المواد المشتركة في الـ master (دبلوم = "مشترك")
const masterSharedCourses = useMemo(() => {
  return courses.filter(course => course.diploma === "مشترك");
}, [courses]);

// أسماء المواد المشتركة من الـ master
const sharedNamesSet = useMemo(() => {
  return new Set(
    masterSharedCourses
      .map(c => (c.name || "").trim())
      .filter(Boolean)
  );
}, [masterSharedCourses]);

// استخراج المواد المشتركة الموجودة فعليًا في الفرع + كل التركيبات (دبلوم + مستوى) للفرع فقط
const {
  sharedCoursesInBranch,
  sharedCombinationsInBranch
} = useMemo(() => {
  const resultSharedList = [];   // للـ Dropdown
  const resultCombinations = []; // لكل (دبلوم + مستوى + course_id) جوه الفرع

  if (!allBranchCourses || allBranchCourses.length === 0 || sharedNamesSet.size === 0) {
    return { sharedCoursesInBranch: [], sharedCombinationsInBranch: [] };
  }

  // نطبع بيانات الفرع لصيغة موحدة
  const normalized = allBranchCourses.map(c => ({
    id: c.id || c.ID,
    name: (c.name || c.NAME || c.course_name || "").trim(),
    diploma: c.diploma || c.DIPLOMA || c.diploma_name || "",
    level: c.level || c.LEVELS || c.level_name || "",
  }));

  // نجمع بالكورس نيم
  const byName = new Map();

  normalized.forEach(c => {
    if (!c.name) return;
    // لازم يكون الاسم موجود أصلاً في قائمة المواد المشتركة من COURSES_DATA
    if (!sharedNamesSet.has(c.name)) return;

    if (!byName.has(c.name)) {
      byName.set(c.name, {
        id: c.id,       // أول id نصادفه للاسم ده
        name: c.name,
        combos: [],
      });
    }

    byName.get(c.name).combos.push({
      diploma: c.diploma,
      level: c.level,
      course_id: c.id,
    });
  });

  // نبني الـ list اللي هتظهر في Dropdown
  for (const [, value] of byName.entries()) {
    resultSharedList.push({
      id: value.id,
      name: value.name,
    });

    value.combos.forEach(cb => {
      resultCombinations.push({
        ...cb,
        course_name: value.name,
      });
    });
  }

  return {
    sharedCoursesInBranch: resultSharedList,
    sharedCombinationsInBranch: resultCombinations,
  };
}, [allBranchCourses, sharedNamesSet]);


  // الفلتر المصحح للمواد المشتركة
const filteredCourses = useMemo(() => {
  if (sharedCourseMode) {
    // في وضع المواد المشتركة: نعرض بس المواد المشتركة الموجودة فعلاً في الفرع
    return sharedCoursesInBranch;
  }

  // الوضع العادي: نستخدم المقررات القادمة من API الخاصة بالفرع/الدبلوم/المستوى
  return (branchCourses || []).map(c => ({
    id: c.id || c.ID,
    name: c.name || c.NAME || c.course_name,
    diploma: c.diploma || c.DIPLOMA || c.diploma_name,
    level: c.level || c.LEVELS || c.level_name,
    raw: c,
  }));
}, [sharedCourseMode, sharedCoursesInBranch, branchCourses]);




  // فلتر التركيبات حسب المادة المختارة
const filteredCombinations = useMemo(() => {
  if (!selectedSharedCourse) return [];
  // نفلتر حسب الـ course_id اللي اخترناه من المواد المشتركة في الفرع
  return sharedCombinationsInBranch.filter(comb => 
    comb.course_name === selectedSharedCourse
  );
}, [sharedCombinationsInBranch, selectedSharedCourse]);


  /* تحميل الاختبار تلقائيًا عند اكتمال الاختيارات */
  useEffect(() => {
    const canLoad = form.diploma_id && form.level_id && form.course_id;
    if (!canLoad) return;

    (async () => {
      try {
        setBusy(true);

        const selectedCourse = (branchCourses || []).find(
          c => (c.id || c.ID) === form.course_id
        );

        const courseName =
          selectedCourse?.NAME ||
          selectedCourse?.name ||
          selectedCourse?.course_name ||
          form.course_id;

        const res = await apiPost("get_exam_by_meta", {
            branch_guid: userBranch.guid,          // 👈 جديد
          diploma_name: form.diploma_id,
          level_name: form.level_id,
          course_name: courseName,
        });

        if (res.ok && res.exam) {
          setExamId(res.exam.id);
          setExamSaved(false);
          setForm(f => ({
            ...f,
            title: res.exam.title || f.title,
            total_grade: res.exam.total_grade ?? f.total_grade,
            duration_minutes: res.exam.duration_minutes ?? f.duration_minutes,
          }));
          const mapped = (res.questions || []).map(q => ({
            id: q.id,
            type: q.type,
            text: q.text,
            score: Number(q.score || 1),
          options: (q.options || []).map(o => ({
  id: o.id,
  text: o.text || o.opt_text,
  correct: o.correct ?? !!o.is_correct
}))

          }));
          setQuestions(mapped);
          showToast("تم تحميل الاختبار الموجود، يمكنك التعديل.");
        } else {
          setExamId(null);
          setQuestions([]);
        }
      } catch (e) {
        showToast("تعذر جلب الاختبار (سيرفر).", "error");
      } finally {
        setBusy(false);
      }
    })();
  }, [form.diploma_id, form.level_id, form.course_id, branchCourses]);


/* إنشاء اختبار جديد إن لم يوجد */
const createExam = async () => {
  if (!form.diploma_id || !form.level_id || !form.course_id) {
    showToast("أكمل الحقول المطلوبة.", "error");
    return;
  }
  
  const selectedCourse = (branchCourses || []).find(
    c => (c.id || c.ID) === form.course_id
  );

  // هنا نعرّف courseName فعليًا
  const courseName =
    selectedCourse?.NAME ||
    selectedCourse?.name ||
    selectedCourse?.course_name ||
    "";

  const courseTitle = form.title?.trim()
    ? form.title.trim()
    : (courseName || "اختبار");

  setBusy(true);
  try {
    const payload = {
      branch_guid: userBranch.guid,
      diploma_name: form.diploma_id,
      level_name: form.level_id,
      course_code: form.course_id,   // لو محتاجه في PHP خليه
      title: courseName,            // ممكن يبقى نفس اسم المقرر
      total_grade: Number(form.total_grade) || 60,
      duration_minutes: Number(form.duration_minutes) || 60,
    };

    const res = await apiPost("create_exam", payload);

    if (res.ok) {
      setExamId(res.exam_id);
      setExamSaved(false);
      
      if (res.existing) {
        showToast("الاختبار موجود بالفعل، تم تحميله للتعديل.");
        const examRes = await apiPost("get_exam_by_meta", {
          branch_guid: userBranch.guid,
          diploma_name: form.diploma_id,
          level_name: form.level_id,
          course_name: courseName,   // خليك ثابت على نفس القيمة
        });

        if (examRes.ok && examRes.exam) {
          const mapped = (examRes.questions || []).map(q => ({
            id: q.id,
            type: q.type,
            text: q.text,
            score: Number(q.score || 1),
            options: (q.options || []).map(o => ({
              id: o.id,
              text: o.text || o.opt_text,
              correct: o.correct ?? !!o.is_correct
            }))
          }));
          setQuestions(mapped);
          setForm(f => ({
            ...f,
            title: examRes.exam.title || f.title,
            total_grade: examRes.exam.total_grade ?? f.total_grade,
            duration_minutes: examRes.exam.duration_minutes ?? f.duration_minutes,
          }));
        }
      } else {
        showToast("تم إنشاء الاختبار. يمكنك الآن إضافة/تعديل الأسئلة.");
        setQuestions([]);
      }
    } else {
      throw new Error(res.error || "فشل إنشاء الاختبار");
    }
  } catch (e) {
    const fakeId = Math.floor(Math.random() * 1e7);
    setExamId(fakeId);
    setExamSaved(false);
    showToast("تم إنشاء الاختبار (وضع تجريبي).");
  } finally {
    setBusy(false);
  }
};


  /* إنشاء اختبار للمواد المشتركة لجميع التركيبات */
  const createSharedExam = async () => {
    if (!selectedSharedCourse || filteredCombinations.length === 0) {
      showToast("اختر مادة مشتركة.", "error");
      return;
    }
    
    setBusy(true);
    
    try {
      const createdExams = [];
      const existingExams = [];
      const failedExams = [];
 const selectedCourse = sharedCoursesInBranch.find(c => c.name === selectedSharedCourse);
      const courseTitle = selectedCourse ? selectedCourse.name : "اختبار";
      
      for (const combination of filteredCombinations) {
        try {
        const payload = {
  branch_guid: userBranch.guid,          // 👈 جديد
  diploma_name: form.diploma_id,
  level_name: form.level_id,
  course_code: form.course_id,
  title: courseTitle,
  total_grade: Number(form.total_grade) || 60,
  duration_minutes: Number(form.duration_minutes) || 60,
};

          
          const res = await apiPost("create_exam", payload);
          
          if (res.ok) {
            if (res.existing) {
              existingExams.push({
                exam_id: res.exam_id,
                diploma: combination.diploma,
                level: combination.level,
                course: combination.course_name,
                status: 'existing'
              });
            } else {
              createdExams.push({
                exam_id: res.exam_id,
                diploma: combination.diploma,
                level: combination.level,
                course: combination.course_name,
                status: 'created'
              });
            }
          } else {
            failedExams.push({
              diploma: combination.diploma,
              level: combination.level,
              course: combination.course_name,
              error: res.error || 'Unknown error',
            });
          }
        } catch (error) {
          failedExams.push({
            diploma: combination.diploma,
            level: combination.level,
            course: combination.course_name,
            error: error.message,
          });
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      let message = '';
      
      if (createdExams.length > 0 && existingExams.length > 0 && failedExams.length > 0) {
        message = `تم إنشاء ${createdExams.length} اختبار جديد، ${existingExams.length} موجود مسبقاً، ${failedExams.length} فشل`;
      } else if (createdExams.length > 0 && existingExams.length > 0) {
        message = `تم إنشاء ${createdExams.length} اختبار جديد و ${existingExams.length} اختبار موجود مسبقاً`;
      } else if (createdExams.length > 0 && failedExams.length > 0) {
        message = `تم إنشاء ${createdExams.length} اختبار جديد، ${failedExams.length} فشل`;
      } else if (existingExams.length > 0 && failedExams.length > 0) {
        message = `${existingExams.length} اختبار موجود مسبقاً، ${failedExams.length} فشل`;
      } else if (createdExams.length > 0) {
        message = `تم إنشاء ${createdExams.length} اختبار جديد بنجاح`;
      } else if (existingExams.length > 0) {
        message = `جميع الاختبارات موجودة مسبقاً (${existingExams.length} اختبار)`;
      } else if (failedExams.length > 0) {
        message = `فشل إنشاء جميع الاختبارات (${failedExams.length} فشل)`;
      } else {
        message = "لم تتم معالجة أي اختبار.";
      }
      
      showToast(message);
      
      if (existingExams.length > 0) {
        const firstExistingExam = existingExams[0];
        setExamId(firstExistingExam.exam_id);
        setExamSaved(false);
        
        try {
          const examRes = await apiPost("get_exam_by_meta", {
              branch_guid: userBranch.guid,          // 👈 جديد
            diploma_name: firstExistingExam.diploma,
            level_name: firstExistingExam.level,
            course_name: firstExistingExam.course,
          });
          
          if (examRes.ok && examRes.exam) {
            const mapped = (examRes.questions || []).map(q => ({
              id: q.id,
              type: q.type,
              text: q.text,
              score: Number(q.score || 1),
              options: (q.options || []).map(o => ({
                id: o.id,
                text: o.opt_text,
                correct: !!o.is_correct
              }))
            }));
            setQuestions(mapped);
            setForm(f => ({
              ...f,
              title: examRes.exam.title || f.title,
              total_grade: examRes.exam.total_grade ?? f.total_grade,
              duration_minutes: examRes.exam.duration_minutes ?? f.duration_minutes,
            }));
          } else {
            setQuestions([]);
          }
        } catch (loadError) {
          console.error('❌ خطأ في تحميل الاختبار الموجود:', loadError);
          setQuestions([]);
        }
        
      } else if (createdExams.length > 0) {
        const firstCreatedExam = createdExams[0];
        setExamId(firstCreatedExam.exam_id);
        setExamSaved(false);
        setQuestions([]);
        setForm(f => ({
          ...f,
          title: firstCreatedExam.course,
        }));
      }
      
    } catch (e) {
      console.error('❌ خطأ عام في إنشاء الاختبارات المشتركة:', e);
      showToast("حدث خطأ أثناء إنشاء الاختبارات.", "error");
    } finally {
      setBusy(false);
    }
  };

  /* دالة عرض الاختبار */
  const viewExam = async (combination) => {
    setBusy(true);
    
    try {
      const res = await apiPost("get_exam_by_meta", {
          branch_guid: userBranch.guid,          // 👈 جديد
        diploma_name: combination.diploma,
        level_name: combination.level,
        course_name: combination.course_name,
      });
      
      if (res.ok && res.exam) {
        setViewingExam({
          ...res,
          diploma: combination.diploma,
          level: combination.level,
          course_name: combination.course_name
        });
        showToast("تم تحميل الاختبار بنجاح");
      } else {
        showToast("لا يوجد اختبار مسجل لهذه التركيبة", "warning");
      }
    } catch (e) {
      showToast("تعذر تحميل الاختبار", "error");
      console.error("Error loading exam:", e);
    } finally {
      setBusy(false);
    }
  };

  /* دالة عرض نموذج الإجابة الصحيحة */
  const viewAnswerKey = async (combination) => {
    setBusy(true);
    
    try {
      const res = await apiPost("get_exam_by_meta", {
          branch_guid: userBranch.guid,          // 👈 جديد
        diploma_name: combination.diploma,
        level_name: combination.level,
        course_name: combination.course_name,
      });
      
      if (res.ok && res.exam) {
        setViewingAnswerKey({
          ...res,
          diploma: combination.diploma,
          level: combination.level,
          course_name: combination.course_name
        });
        showToast("تم تحميل نموذج الإجابة الصحيحة");
      } else {
        showToast("لا يوجد اختبار مسجل لهذه التركيبة", "warning");
      }
    } catch (e) {
      showToast("تعذر تحميل نموذج الإجابة", "error");
      console.error("Error loading answer key:", e);
    } finally {
      setBusy(false);
    }
  };

  /* دالة نسخ الاختبار لجميع التركيبات */
  const copyExamToAllCombinations = async (sourceExam) => {
    if (!sourceExam || !selectedSharedCourse || filteredCombinations.length === 0) {
      showToast("لا يمكن نسخ الاختبار.", "error");
      return;
    }

    setCopyingExam(true);
    showToast("جاري نسخ الأسئلة لجميع التركيبات...", "info");

    try {
      const sourceCombination = filteredCombinations.find(comb => 
        comb.diploma === sourceExam.diploma && 
        comb.level === sourceExam.level
      );

      if (!sourceCombination) {
        showToast("لم يتم العثور على التركيبة المصدر.", "error");
        return;
      }

      let successCount = 0;
      let errorCount = 0;
      let skippedCount = 0;

      for (const targetCombination of filteredCombinations) {
        if (targetCombination.diploma === sourceExam.diploma && targetCombination.level === sourceExam.level) {
          skippedCount++;
          continue;
        }

        try {
          const existingExamRes = await apiPost("get_exam_by_meta", {
              branch_guid: userBranch.guid,          // 👈 جديد
            diploma_name: targetCombination.diploma,
            level_name: targetCombination.level,
            course_name: targetCombination.course_name,
          });

          if (existingExamRes.ok && existingExamRes.exam) {
            if (existingExamRes.questions && existingExamRes.questions.length > 0) {
              for (const question of existingExamRes.questions) {
                await apiPost("delete_question", { question_id: question.id });
              }
            }

            let questionsCopied = 0;
            for (const question of sourceExam.questions) {
              try {
                const addQRes = await apiPost("add_question", {
                  exam_id: existingExamRes.exam.id,
                  type: question.type,
                  text: question.text,
                  score: question.score,
                  order_no: question.order_no,
                });

                if (addQRes.ok && addQRes.question_id) {
                  for (const option of question.options) {
                    await apiPost("add_option", {
                      question_id: addQRes.question_id,
                      opt_text: option.opt_text,
                      is_correct: option.is_correct ? 1 : 0,
                    });
                  }
                  questionsCopied++;
                }
              } catch (questionError) {
                console.error(`❌ خطأ في نسخ السؤال:`, questionError);
              }
            }

            if (questionsCopied > 0) {
              successCount++;
            } else {
              errorCount++;
            }
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
        }
      }

      showToast(`تم النسخ: ${successCount} نجاح, ${errorCount} فشل, ${skippedCount} تم تخطيها`);
      
    } catch (e) {
      showToast("حدث خطأ أثناء نسخ الأسئلة", "error");
      console.error("❌ خطأ عام في نسخ الأسئلة:", e);
    } finally {
      setCopyingExam(false);
    }
  };

  /* حفظ نهائي */
  const saveExam = async () => {
    if (questions.length === 0) {
      showToast("أضف أسئلة أولاً قبل الحفظ.", "error");
      return;
    }
    if (!examId) {
      showToast("لا يوجد اختبار محفوظ بعد.", "error");
      return;
    }
    setBusy(true);
    try {
      await apiPost("finalize_exam", { exam_id: examId });
      setExamSaved(true);
      showToast("تم حفظ الاختبار بنجاح!");
    } catch (e) {
      setExamSaved(true);
      showToast("تم حفظ الاختبار بنجاح! (وضع تجريبي)");
    } finally {
      setBusy(false);
    }
  };

  /* إدارة خيارات MCQ */
  const updateOpt = (id, patch) => {
    setMcqOpts(prev => prev.map(o => (o.id === id ? { ...o, ...patch } : o)));
  };
  const addOpt = () => {
    setMcqOpts(prev => [...prev, { id: (prev.at(-1)?.id || 0) + 1, text: "", correct: false }]);
  };
  const removeOpt = (id) => {
    setMcqOpts(prev => prev.filter(o => o.id !== id));
  };
  const setCorrectOnly = (id) => {
    setMcqOpts(prev => prev.map(o => ({ ...o, correct: o.id === id })));
  };

  /* بدء تعديل سؤال */
  const startEdit = (q) => {
    setEditingId(q.id);
    setQType(q.type);
    setQText(q.text);
    setScore(Number(q.score || 1));
    if (q.type === "TF") {
      const isTrueCorrect = !!q.options?.[0]?.correct;
      setTfCorrect(isTrueCorrect ? "صح" : "خطأ");
      setMcqOpts([
        { id: 1, text: "صح", correct: isTrueCorrect },
        { id: 2, text: "خطأ", correct: !isTrueCorrect },
      ]);
    } else {
      const mapped = (q.options || []).map((o, i) => ({
        id: i + 1,
        text: o.text,
        correct: !!o.correct
      }));
      setMcqOpts(mapped.length > 0 ? mapped : [
        { id: 1, text: "", correct: false },
        { id: 2, text: "", correct: false },
      ]);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* حذف سؤال */
  const deleteQuestion = async (qid) => {
    if (!qid) return;
    if (!window.confirm("تأكيد حذف السؤال؟")) return;
    try {
      setBusy(true);
      const res = await apiPost("delete_question", { question_id: qid });
      if (res.ok) {
        setQuestions(prev => prev.filter(q => q.id !== qid));
        showToast("تم حذف السؤال.");
      } else {
        showToast("فشل حذف السؤال.", "error");
      }
    } catch {
      showToast("تعذر حذف السؤال (سيرفر).", "error");
    } finally {
      setBusy(false);
    }
  };

  /* إضافة/تحديث سؤال */
  const submitQuestion = async () => {
    if (!examId) { showToast("أنشئ الاختبار أولًا.", "error"); return; }
    if (!qText.trim()) { showToast("اكتب نص السؤال.", "error"); return; }

    if (editingId) {
      const payload = {
        question_id: editingId,
        type: qType,
        text: qText.trim(),
        score: Number(score) || 1,
        options: qType === "TF"
          ? [
              { text: "صح",  correct: tfCorrect === "صح"  },
              { text: "خطأ", correct: tfCorrect === "خطأ" },
            ]
          : mcqOpts.filter(o => o.text.trim()).map(o => ({
              text: o.text.trim(), correct: !!o.correct
            })),
      };

      if (qType === "MCQ") {
        const nonEmpty = mcqOpts.filter(o => o.text.trim());
        if (nonEmpty.length < 2) { showToast("أضف خيارين على الأقل.", "error"); return; }
        if (!nonEmpty.some(o => o.correct)) { showToast("حدد الإجابة الصحيحة.", "error"); return; }
      }

      try {
        setBusy(true);
        const res = await apiPost("save_question_full", payload);
        if (res.ok) {
          setQuestions(prev => prev.map(q => {
            if (q.id !== editingId) return q;
            return {
              ...q,
              type: payload.type,
              text: payload.text,
              score: payload.score,
              options: payload.options.map((o, i) => ({ id: i+1, text: o.text, correct: !!o.correct })),
            };
          }));
          setEditingId(null);
          setQText("");
          setScore(1);
          setQType("TF");
          setTfCorrect("صح");
          setMcqOpts([{ id: 1, text: "", correct: false }, { id: 2, text: "", correct: false }]);
          showToast("تم تحديث السؤال.");
        } else {
          showToast("فشل تحديث السؤال.", "error");
        }
      } catch (e) {
        showToast("تعذر تحديث السؤال (سيرفر).", "error");
      } finally {
        setBusy(false);
      }
      return;
    }

    if (qType === "MCQ") {
      const nonEmpty = mcqOpts.filter(o => o.text.trim());
      if (nonEmpty.length < 2) { showToast("أضف خيارين على الأقل.", "error"); return; }
      if (!nonEmpty.some(o => o.correct)) { showToast("حدد الإجابة الصحيحة.", "error"); return; }
    }

    try {
      setBusy(true);
      const addQRes = await apiPost("add_question", {
        exam_id: Number(examId),
        type: qType,
        text: qText.trim(),
        score: Number(score) || 1,
        order_no: questions.length + 1,
      });

      let qid = addQRes.ok ? addQRes.question_id : null;

      if (qType === "TF") {
        const tfOptions = [
          { text: "صح", correct: tfCorrect === "صح" },
          { text: "خطأ", correct: tfCorrect === "خطأ" },
        ];
        if (qid) {
          for (const opt of tfOptions) {
            await apiPost("add_option", {
              question_id: Number(qid),
              opt_text: opt.text,
              is_correct: opt.correct ? 1 : 0,
            });
          }
        }
        setQuestions(prev => [...prev, {
          id: qid || Date.now(),
          type: "TF",
          text: qText.trim(),
          score: Number(score) || 1,
          options: tfOptions
        }]);
      } else {
        const cleaned = mcqOpts.filter(o => o.text.trim()).map(o => ({
          text: o.text.trim(),
          correct: !!o.correct
        }));
        if (qid) {
          for (const opt of cleaned) {
            await apiPost("add_option", {
              question_id: Number(qid),
              opt_text: opt.text,
              is_correct: opt.correct ? 1 : 0,
            });
          }
        }
        setQuestions(prev => [...prev, {
          id: qid || Date.now(),
          type: "MCQ",
          text: qText.trim(),
          score: Number(score) || 1,
          options: cleaned
        }]);
      }

      setQText("");
      setScore(1);
      setTfCorrect("صح");
      setQType("TF");
      setMcqOpts([{ id: 1, text: "", correct: false }, { id: 2, text: "", correct: false }]);
      showToast("تمت إضافة السؤال.");
    } catch (e) {
      showToast("تمت إضافة السؤال (وضع تجريبي).");
      const local = qType === "TF"
        ? [{ text: "صح", correct: tfCorrect === "صح" }, { text: "خطأ", correct: tfCorrect === "خطأ" }]
        : mcqOpts.filter(o => o.text.trim()).map(o => ({ text: o.text.trim(), correct: !!o.correct }));

      setQuestions(prev => [...prev, {
        id: Date.now(),
        type: qType,
        text: qText.trim(),
        score: Number(score) || 1,
        options: local
      }]);
      setQText(""); setScore(1); setTfCorrect("صح"); setQType("TF");
      setMcqOpts([{ id: 1, text: "", correct: false }, { id: 2, text: "", correct: false }]);
    } finally {
      setBusy(false);
    }
  };

  /* فصل الأسئلة حسب النوع */
  const tfQuestions = questions.filter(q => q.type === "TF");
  const mcqQuestions = questions.filter(q => q.type === "MCQ");

  const fisherYates = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const reorderQuestions = (orderType) => {
    const tf = questions.filter(q => q.type === "TF");
    const mcq = questions.filter(q => q.type === "MCQ");

    switch(orderType) {
      case 'tfFirst': {
        setSectionOrder(["TF", "MCQ"]);
        setQuestions([...tf, ...mcq]);
        break;
      }
      case 'mcqFirst': {
        setSectionOrder(["MCQ", "TF"]);
        setQuestions([...mcq, ...tf]);
        break;
      }
      case 'shuffle': {
        const tfShuffled = fisherYates(tf);
        const mcqShuffled = fisherYates(mcq);
        const [first, second] = sectionOrder;
        const firstList  = first === "TF" ? tfShuffled : mcqShuffled;
        const secondList = second === "TF" ? tfShuffled : mcqShuffled;
        setQuestions([...firstList, ...secondList]);
        break;
      }
      default: break;
    }
  };

  const canCreate = !!form.diploma_id && !!form.level_id && !!form.course_id && !examId;
  const canCreateShared = !!selectedSharedCourse && filteredCombinations.length > 0;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'grey.50' }}>
      <Sidebar />

      <Box sx={{ flex: 1, marginLeft: '280px', minHeight: '100vh' }}>
        <Container maxWidth="xl" sx={{ py: 3 }}>
          {/* الهيدر الرئيسي */}
          <Paper sx={{ p: 3, mb: 3, background: `linear-gradient(135deg, #80b49e 0%, #6a9c8a 100%)`, color: 'white' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                  📝 نظام إنشاء الاختبارات
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  إنشاء وإدارة اختبارات الطلاب
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {examId && (
                  <Badge tone={examSaved ? "green" : "blue"}>
                    {examSaved ? "تم الحفظ" : `Exam ID: ${examId}`}
                  </Badge>
                )}
                {!examId && <Badge>جديد</Badge>}
              </Box>
            </Box>
          </Paper>

          {/* ميتاداتا */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ mb: 3 }}>
                <Stack direction="row" spacing={1} sx={{ bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
                  <Button
                    variant={!sharedCourseMode ? "contained" : "outlined"}
                    onClick={() => setSharedCourseMode(false)}
                    sx={{ 
                      flex: 1,
                      backgroundColor: !sharedCourseMode ? '#80b49e' : 'transparent',
                      color: !sharedCourseMode ? 'white' : '#80b49e',
                      borderColor: '#80b49e',
                      '&:hover': {
                        backgroundColor: !sharedCourseMode ? '#6a9c8a' : 'grey.200'
                      }
                    }}
                  >
                    الوضع العادي
                  </Button>
                  <Button
                    variant={sharedCourseMode ? "contained" : "outlined"}
                    onClick={() => setSharedCourseMode(true)}
                    sx={{ 
                      flex: 1,
                      backgroundColor: sharedCourseMode ? '#80b49e' : 'transparent',
                      color: sharedCourseMode ? 'white' : '#80b49e',
                      borderColor: '#80b49e',
                      '&:hover': {
                        backgroundColor: sharedCourseMode ? '#6a9c8a' : 'grey.200'
                      }
                    }}
                  >
                    المواد المشتركة
                  </Button>
                  
                  {/* زر إدارة المقررات */}
                  <CourseManagement 
                    diplomas={diplomas}
                    levels={levels}
                    userBranch={userBranch}
                    onCourseCreated={() => {
                      // يمكنك إضافة أي منطق تريده عند إنشاء مقرر جديد
                    }}
                  />
                </Stack>
              </Box>

              {!sharedCourseMode ? (
                // الوضع العادي
                <>
                  <BasicFilters
                    form={form}
                    setForm={setForm}
                    diplomas={diplomas}
                    levels={levels}
                    filteredCourses={filteredCourses}
                    setExamId={setExamId}
                    setQuestions={setQuestions}
                  />

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button
                      variant="contained"
                      onClick={createExam}
                      disabled={busy || !canCreate}
                      sx={{ 
                        backgroundColor: '#80b49e',
                        '&:hover': { backgroundColor: '#6a9c8a' }
                      }}
                    >
                      {busy ? <CircularProgress size={24} /> : (examId ? "الاختبار موجود" : "إنشاء اختبار")}
                    </Button>
                    <Button
  variant="outlined"
  startIcon={<CheckCircleIcon />}
  onClick={async () => {
    if (!form.diploma_id || !form.level_id || !form.course_id) {
      showToast("أكمل الحقول المطلوبة.", "warning");
      return;
    }

    try {
      setBusy(true);

      const selectedCourse = (branchCourses || []).find(
        c => (c.id || c.ID) === form.course_id
      );

      const courseName =
        selectedCourse?.NAME ||
        selectedCourse?.name ||
        selectedCourse?.course_name ||
        ""

      const res = await apiPost("get_exam_by_meta", {
        branch_guid: userBranch.guid,
        diploma_name: form.diploma_id,
        level_name: form.level_id,
        course_name: courseName,
      });

      if (res.ok && res.exam) {
        setViewingAnswerKey({
          ...res,
          diploma: form.diploma_id,
          level: form.level_id,
          course_name: courseName
        });
      } else {
        showToast("لا يوجد اختبار مسجل لهذه المادة", "warning");
      }
    } catch (e) {
      showToast("تعذر تحميل نموذج الإجابة", "error");
    } finally {
      setBusy(false);
    }
  }}
  sx={{
    borderColor: '#80b49e',
    color: '#80b49e',
    '&:hover': { borderColor: '#6a9c8a', backgroundColor: 'rgba(128, 180, 158, 0.04)' }
  }}
>
  نموذج الإجابة
</Button>

                    {metaLoading && <Typography variant="body2" color="text.secondary">تحميل البيانات…</Typography>}
                    {metaErr && <Typography variant="body2" color="error">{metaErr}</Typography>}
                  </Box>
                </>
              ) : (
                // وضع المواد المشتركة
                <>
                  <SharedCourseFilters
  sharedCourses={sharedCoursesInBranch}
  selectedSharedCourse={selectedSharedCourse}
  setSelectedSharedCourse={setSelectedSharedCourse}
  filteredCombinations={filteredCombinations}
  viewExam={viewExam}
  viewAnswerKey={viewAnswerKey}
  busy={busy}
  form={form}
 setForm={setForm}
 editExamFromCombination={editExamFromCombination}
/>


                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button
                      variant="contained"
                      onClick={createSharedExam}
                      disabled={busy || !canCreateShared}
                      sx={{ 
                        backgroundColor: '#80b49e',
                        '&:hover': { backgroundColor: '#6a9c8a' }
                      }}
                    >
                      {busy ? <CircularProgress size={24} /> : `إنشاء ${filteredCombinations.length} اختبار`}
                    </Button>
                    {metaLoading && <Typography variant="body2" color="text.secondary">تحميل البيانات…</Typography>}
                    {metaErr && <Typography variant="body2" color="error">{metaErr}</Typography>}
                  </Box>
                </>
              )}
            </CardContent>
          </Card>

          {/* إضافة/تعديل الأسئلة */}
          { (examId || (!examId && form.diploma_id && form.level_id && form.course_id)) && !examSaved && (
            <QuestionForm
              editingId={editingId}
              qType={qType}
              setQType={setQType}
              qText={qText}
              setQText={setQText}
              score={score}
              setScore={setScore}
              tfCorrect={tfCorrect}
              setTfCorrect={setTfCorrect}
              mcqOpts={mcqOpts}
              updateOpt={updateOpt}
              addOpt={addOpt}
              removeOpt={removeOpt}
              setCorrectOnly={setCorrectOnly}
              submitQuestion={submitQuestion}
              busy={busy}
            />
          )}

          {/* قائمة الأسئلة */}
          {examId && (
            <QuestionList
              examId={examId}
              examSaved={examSaved}
              questions={questions}
              form={form}
              sectionOrder={sectionOrder}
              startEdit={startEdit}
              deleteQuestion={deleteQuestion}
              saveExam={saveExam}
              busy={busy}
              reorderQuestions={reorderQuestions}
            />
          )}

          {/* رسالة فارغة */}
          {(!examId && form.diploma_id && form.level_id && form.course_id && questions.length === 0) && (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  لا يوجد اختبار مسجل لهذا الاختيار حتى الآن.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  اكتب عنوان الاختبار وأنشئه لتبدأ بإضافة الأسئلة.
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Snackbar للرسائل */}
          <Snackbar
            open={toast.open}
            autoHideDuration={6000}
            onClose={handleCloseToast}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          >
            <Alert onClose={handleCloseToast} severity={toast.severity} sx={{ width: '100%' }}>
              {toast.message}
            </Alert>
          </Snackbar>

          {/* عرض الاختبار */}
          {viewingExam && (
            <ExamViewer 
              examData={viewingExam} 
              onClose={() => setViewingExam(null)}
              onCopyToAll={copyExamToAllCombinations}
            />
          )}

          {/* عرض نموذج الإجابة الصحيحة */}
          {viewingAnswerKey && (
            <AnswerKeyViewer 
              examData={viewingAnswerKey} 
              onClose={() => setViewingAnswerKey(null)}
            />
          )}
        </Container>
      </Box>
    </Box>
  );
}