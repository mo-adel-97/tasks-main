import './rtl-forms-fix.css';
import { navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
import React, { useEffect, useMemo, useRef, useState } from "react";
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
  useMediaQuery
} from "@mui/material";
import {
  Print as PrintIcon,
  PictureAsPdf as PdfIcon,
  Download as DownloadIcon,
  FilterAlt as FilterIcon,
  Settings as SettingsIcon,
  School as SchoolIcon,
  Person as PersonIcon
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";

// استيراد الثوابت والمساعدين
import { COURSE_TITLES } from "../constants/courseTitles";
import { COURSE_CATALOG } from "../constants/courseCatalog";
import { API_BASE, apiPost, courseApi } from "../config/apiConfig";
import { toArabicDigits, deriveCourseCode } from "../utils/helpers";

import SharedCoursesManager from "./SharedCoursesManager";
import html2pdf from "html2pdf.js";
import logo1 from "../images/logo1.jpg";
import logo2 from "../images/logo2.jpg";

// ===== الكومبوننتات المُصممة بمتريال =====

/* صندوق الدرجة */
const ScoreBox = ({ max = 30, className = "" }) => (
  <Box
    sx={{
      width: 70,  // كانت 85
      height: 55, // كانت 70
      border: '2px solid',
      borderColor: 'text.primary',
      borderRadius: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      alignItems: 'center',
      backgroundColor: 'background.paper',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: '45%',
        left: 8,
        right: 8,
        height: '1.5px',
        backgroundColor: 'text.primary',
      }
    }}
    className={className}
    aria-label={`درجة من ${toArabicDigits(max)}`}
  >
    <Box sx={{ flex: 1, width: '100%' }} />
    <Typography variant="body1" fontWeight="bold" sx={{ pb: 0.5, fontSize: '1rem' }}>
      {toArabicDigits(max)}
    </Typography>
  </Box>
);

/* سطر صح/خطأ */
const OneLineTF = ({ i, text, isEnglish = false }) => (
  <Box
    sx={{ 
      display: 'flex', 
      alignItems: 'flex-start', 
      gap: 0.3,
      mb: 1,
      width: '100%',
      direction: isEnglish ? 'ltr' : 'rtl',
      textAlign: 'start',
      pageBreakInside: 'avoid',   // 👈 مهم
      breakInside: 'avoid'        // 👈 مهم
    }}
  >
    <Typography variant="body1" fontWeight="bold" sx={{ fontSize: '0.9rem', minWidth: '25px' }}>
      {isEnglish ? `${i} -` : `${toArabicDigits(i)} -`}
    </Typography>
    <Typography variant="body1" sx={{ flex: 1, fontSize: '0.9rem', lineHeight: 1.3 }}>
      {text}
    </Typography>
    <Typography
      variant="body1"
      sx={{ 
        minWidth: '80px',
        textAlign: 'center',
        fontSize: '0.9rem',
        letterSpacing: '1.2em',
        marginInlineStart: '0.5em',
        paddingInlineEnd: '0.2em'
      }}
    >
      (        )
    </Typography>
  </Box>
);


/* سؤال اختياري */
const OneLineMCQ = ({ i, q, opts, isEnglish = false }) => (
  <Box
    sx={{ 
      mb: 1.2,                    // قللتها شوية
      direction: isEnglish ? 'ltr' : 'rtl',
      width: '100%',
      pageBreakInside: 'avoid',   // 👈 يمنع تقسيم السؤال
      breakInside: 'avoid'        // 👈
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.3, mb: 0.8, width: '100%' }}>
      <Typography variant="body1" fontWeight="bold" sx={{ fontSize: '0.9rem', minWidth: '25px' }}>
        {isEnglish ? `${i} -` : `${toArabicDigits(i)} -`}
      </Typography>
      <Typography variant="body1" sx={{ flex: 1, textAlign: 'start', fontSize: '0.9rem', lineHeight: 1.3 }}>
        {q}
      </Typography>
    </Box>
    <Box
      sx={{ 
        display: 'flex', 
        gap: 0.8,
        flexWrap: 'wrap',
        direction: isEnglish ? 'ltr' : 'rtl',
        justifyContent: 'flex-start',
        width: '100%'
      }}
    >
      {opts.map((o, j) => (
        <Chip
          key={j}
          label={o}
          variant="outlined"
          size="small"
          sx={{ 
            borderRadius: 1,
            mb: 0.2,
            px: 0.7,
            fontSize: '0.8rem'
          }}
        />
      ))}
    </Box>
  </Box>
);


/* ورقة الأسئلة الرئيسية */
function ExamPaperPerStudent({
  student,
  courseKey,
  examMeta,
  tfList,
  mcqList,
  sectionOrder,
  courseName,
}) {
  const courseCode = deriveCourseCode(student.diplomName, student.levelName, courseKey, COURSE_TITLES);
  const isEnglishCourse = ["eng1", "eng2", "eng3", "english_reports"].includes(courseKey);
  const isEng3 = courseKey === "eng3";
  const isEnglishReports = courseKey === "english_reports";

  const renderTF = () =>
    tfList?.length > 0 && (
      <>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 1.5,
          direction: isEnglishCourse ? 'ltr' : 'rtl'
        }}>
          {isEnglishCourse ? (
            <ScoreBox max={30} />
          ) : (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.5,
              flex: 1,
              justifyContent: 'center'
            }}>
              <Divider sx={{ flex: 1 }} />
              <Typography variant="h6" fontWeight="bold" sx={{color:"#000", fontSize: '1.1rem' }}>
                السؤال الأول: الصح والخطأ
              </Typography>
              <Divider sx={{ flex: 1 }} />
            </Box>
          )}
          
          {isEnglishCourse ? (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.5,
              flex: 1,
              justifyContent: 'center'
            }}>
              <Divider sx={{ flex: 1 }} />
              <Typography variant="h6" fontWeight="bold" color="primary.main" sx={{ fontSize: '1.1rem' }}>
                True/False Questions
              </Typography>
              <Divider sx={{ flex: 1 }} />
            </Box>
          ) : (
            <ScoreBox max={30} />
          )}
        </Box>
        
        <Box sx={{ mb: 2, direction: isEnglishCourse ? 'ltr' : 'rtl' }}>
          {tfList.map((t, i) => (
            <OneLineTF key={`tf-${i}`} i={i + 1} text={t} isEnglish={isEnglishCourse} />
          ))}
        </Box>
      </>
    );

  const renderMCQ = () =>
    mcqList?.length > 0 && (
      <>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 1.5,
          direction: isEnglishCourse ? 'ltr' : 'rtl'
        }}>
          {isEnglishCourse ? (
            <ScoreBox max={30} />
          ) : (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.5,
              flex: 1,
              justifyContent: 'center'
            }}>
              <Divider sx={{ flex: 1 }} />
              <Typography variant="h6" fontWeight="bold" sx={{color:"#000", fontSize: '1.1rem' }}>
                السؤال الثاني: اختر الإجابة الصحيحة
              </Typography>
              <Divider sx={{ flex: 1 }} />
            </Box>
          )}
          
          {isEnglishCourse ? (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.5,
              flex: 1,
              justifyContent: 'center'
            }}>
              <Divider sx={{ flex: 1 }} />
              <Typography variant="h6" fontWeight="bold" color="primary.main" sx={{ fontSize: '1.1rem' }}>
                Multiple Choice Questions
              </Typography>
              <Divider sx={{ flex: 1 }} />
            </Box>
          ) : (
            <ScoreBox max={30} />
          )}
        </Box>
        
        <Box sx={{ direction: isEnglishCourse ? 'ltr' : 'rtl', mb: 1.5 }}>
          {mcqList.map((m, i) => (
            <OneLineMCQ key={`mcq-${i}`} i={i + 1} q={m.q} opts={m.a} isEnglish={isEnglishCourse} />
          ))}
        </Box>
      </>
    );

  const renderEnglishQuestions = () =>
    mcqList?.length > 0 && (
      <>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 1.5,
          direction: 'rtl'
        }}>
          <ScoreBox max={60} />
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1.5,
            flex: 1,
            justifyContent: 'center'
          }}>
            <Divider sx={{ flex: 1 }} />
            <Typography variant="h6" fontWeight="bold" color="primary.main" sx={{ fontSize: '1.1rem' }}>
              Questions
            </Typography>
            <Divider sx={{ flex: 1 }} />
          </Box>
        </Box>
        
        <Box sx={{ direction: 'rtl', mb: 1.5 }}>
          {mcqList.map((m, i) => (
            <OneLineMCQ key={`mcq-${i}`} i={i + 1} q={m.q} opts={m.a} isEnglish={true} />
          ))}
        </Box>
      </>
    );

  const blocks = [];
  
  if (isEng3 || isEnglishReports) {
    if (sectionOrder === "tf-first" || (sectionOrder === "auto" && (tfList?.length || 0) >= (mcqList?.length || 0))) {
      blocks.push(renderTF());
      blocks.push(renderMCQ());
    } else {
      blocks.push(renderMCQ());
      blocks.push(renderTF());
    }
  } else if (isEnglishCourse && mcqList?.length > 0) {
    blocks.push(renderEnglishQuestions());
  } else {
    if (sectionOrder === "tf-first" || (sectionOrder === 'auto' && (tfList?.length || 0) >= (mcqList?.length || 0))) {
      blocks.push(renderTF());
      blocks.push(renderMCQ());
    } else {
      blocks.push(renderMCQ());
      blocks.push(renderTF());
    }
  }

  return (
    <Box
      className="exam-paper"
      sx={{
        width: "210mm",       // عرض A4
        maxWidth: "100%",
        mx: "auto",
        p: 0,
        m: 0,
        direction: (isEnglishCourse || isEng3 || isEnglishReports) ? "ltr" : "rtl",
        pageBreakAfter: "always",
        breakAfter: "page",
      }}
    >
      {/* Wrapper ممنوع يتقسم بين صفحات */}
      <Box
        sx={{
          pageBreakInside: "avoid",
          breakInside: "avoid",
        }}
      >
        {/* الهيدر */}
        <Box sx={{ 
          p: 0.6,        // كانت 1
    mb: 0.6,       // كانت 1
          border: '2px solid',
          borderColor: 'divider',
          borderRadius: 1,
          width: '100%'
        }}>
          {/* اللوجوهات */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Box 
              component="img"
              src={logo1}
              alt="Logo 1"
              sx={{ 
                width: 80,
                height: 60,
                objectFit: 'contain',
              }} 
            />
            <Box 
              component="img"
              src={logo2}
              alt="Logo 2"
              sx={{ 
                width: 80,
                height: 60,
                objectFit: 'contain',
              }} 
            />
          </Box>

          <Grid container spacing={1.5} justifyContent="center">
            <Grid item xs={12} md={5}>
              <Stack spacing={0.8}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1" fontWeight="bold" sx={{ minWidth: 65, fontSize: '0.9rem' }}>اسم المتدرب:</Typography>
                  <Typography variant="body1" sx={{ flex: 1, borderBottom: '1px solid', borderColor: 'divider', textAlign: 'center', fontSize: '0.9rem' }}>
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1" fontWeight="bold" sx={{ minWidth: 65, fontSize: '0.9rem' }}>رقم الهوية:</Typography>
                  <Typography variant="body1" sx={{ flex: 1, borderBottom: '1px solid', borderColor: 'divider', textAlign: 'center', fontSize: '0.9rem' }}>
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1" fontWeight="bold" sx={{ minWidth: 65, fontSize: '0.9rem' }}>الدبلوم:</Typography>
                  <Typography variant="body1" sx={{ flex: 1, borderBottom: '1px solid', borderColor: 'divider', textAlign: 'center', fontSize: '0.9rem' }}>
                    {student.diplomName}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1" fontWeight="bold" sx={{ minWidth: 65, fontSize: '0.9rem' }}>المستوى:</Typography>
                  <Typography variant="body1" sx={{ flex: 1, borderBottom: '1px solid', borderColor: 'divider', textAlign: 'center', fontSize: '0.9rem' }}>
                    {student.levelName}
                  </Typography>
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12} md={5}>
              <Stack spacing={0.8}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
  <Typography variant="body1" fontWeight="bold" sx={{ minWidth: 65, fontSize: '0.9rem' }}>المقرر:</Typography>
  <Typography variant="body1" sx={{ flex: 1, borderBottom: '1px solid', borderColor: 'divider', textAlign: 'center', fontSize: '0.9rem' }}>
    {courseName || COURSE_TITLES[courseKey] || "—"} {/* 👈 التعديل هنا */}
  </Typography>
</Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1" fontWeight="bold" sx={{ minWidth: 65, fontSize: '0.9rem' }}>درجة الاختبار:</Typography>
                  <Typography variant="body1" sx={{ flex: 1, borderBottom: '1px solid', borderColor: 'divider', textAlign: 'center', fontSize: '0.9rem' }}>
                    ({examMeta?.total_grade ? toArabicDigits(examMeta.total_grade) : "—"}) /
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1" fontWeight="bold" sx={{ minWidth: 65, fontSize: '0.9rem' }}>مدة الاختبار:</Typography>
                  <Typography variant="body1" sx={{ flex: 1, borderBottom: '1px solid', borderColor: 'divider', textAlign: 'center', fontSize: '0.9rem' }}>
                    {examMeta?.duration_minutes ? toArabicDigits(examMeta.duration_minutes) : "—"}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1" fontWeight="bold" sx={{ minWidth: 65, fontSize: '0.9rem' }}>كود الطالب:</Typography>
                  <Typography variant="body1" sx={{ flex: 1, borderBottom: '1px solid', borderColor: 'divider', textAlign: 'center', fontSize: '0.9rem' }}>
                    {student.code ? toArabicDigits(student.code) : ".................................."}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>

          <Divider sx={{ my: 1 }} />
        </Box>

        {/* المحتوى الرئيسي */}
        <Box sx={{ 
          width: '100%',
          p: 0.6,
          m: 0
        }}>
          {blocks}
        </Box>

        {/* الفوتر */}
        <Box sx={{ 
    mt: 0.05,        // كانت 2
          textAlign: 'center',
          direction: isEnglishCourse ? 'ltr' : 'rtl',
          p: 0
        }}>
          <Typography variant="body1" fontWeight="bold" color="text.secondary" sx={{ fontSize: '0.9rem' }}>
            {isEnglishCourse
              ? "End of questions. We wish you success and good luck."
              : "انتهت الأسئلة. مع تمنياتنا لكم بالتوفيق والنجاح."}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

/* الفلاتر بمتريال - معدلة لتعتمد على بيانات قاعدة البيانات */
function Filters({ 
  data, 
  selected, 
  setSelected, 
  sectionOrder, 
  setSectionOrder,
  branchCourses,
  branchCoursesLoading,
  branchCoursesErr 
}) {
  const diplomas = useMemo(() => Array.from(new Set(data.map((s) => s.diplomName))).sort(), [data]);
  
  const levels = useMemo(() => {
    const filtered = selected.diploma ? data.filter((s) => s.diplomName === selected.diploma) : data;
    return Array.from(new Set(filtered.map((s) => s.levelName))).sort();
  }, [data, selected.diploma]);

  // المقررات المتاحة بناءً على الفرع + الدبلوم + المستوى
  const availableCourses = useMemo(() => {
    if (!selected.diploma || !selected.level) return [];
    
    const filteredCourses = (branchCourses || []).filter(course => {
      const courseDiploma = course.diploma || course.DIPLOMA || course.diploma_name;
      const courseLevel = course.level || course.LEVELS || course.level_name;
      return courseDiploma === selected.diploma && courseLevel === selected.level;
    });
    
    return filteredCourses.map(course => ({
      id: course.id || course.ID,
      name: course.name || course.NAME || course.course_name,
      raw: course
    }));
  }, [branchCourses, selected.diploma, selected.level]);

  useEffect(() => {
    if (selected.course && !availableCourses.find(c => c.id === selected.course)) {
      setSelected((p) => ({ ...p, course: "" }));
    }
  }, [availableCourses, selected.course, setSelected]);

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <FilterIcon sx={{color:"#80b49e"}} />
          <Typography variant="h6" fontWeight="bold">
            تصفية البيانات
          </Typography>
        </Box>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>الدبلوم</InputLabel>
              <Select
                value={selected.diploma}
                onChange={(e) => setSelected({ diploma: e.target.value || "", level: "", course: "" })}
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
            <FormControl fullWidth disabled={!selected.diploma}>
              <InputLabel>المستوى</InputLabel>
              <Select
                value={selected.level}
                onChange={(e) => setSelected((p) => ({ ...p, level: e.target.value || "", course: "" }))}
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
            <FormControl fullWidth disabled={!selected.level || branchCoursesLoading}>
              <InputLabel>المقرر</InputLabel>
              <Select
                value={selected.course}
                onChange={(e) => setSelected((p) => ({ ...p, course: e.target.value }))}
                label="المقرر"
              >
                <MenuItem value="">— اختر المقرر —</MenuItem>
                {availableCourses.map((course) => (
                  <MenuItem key={course.id} value={course.id}>
                    {course.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {branchCoursesLoading && (
              <Typography variant="caption" color="text.secondary">
                جاري تحميل المقررات...
              </Typography>
            )}
            {branchCoursesErr && (
              <Typography variant="caption" color="error">
                {branchCoursesErr}
              </Typography>
            )}
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>ترتيب الأسئلة</InputLabel>
              <Select
                value={sectionOrder}
                onChange={(e) => setSectionOrder(e.target.value)}
                label="ترتيب الأسئلة"
              >
                <MenuItem value="tf-first">الصح/الخطأ أولًا</MenuItem>
                <MenuItem value="mcq-first">الاختياري أولًا</MenuItem>
                <MenuItem value="auto">تلقائي</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

/* لوحة التحكم بمتريال */
function ControlPanel({ 
  isCustomSheet, 
  setIsCustomSheet, 
  customCode, 
  setCustomCode, 
  eligibleText, 
  loading, 
  err, 
  canPrint, 
  studentsToPrint, 
  examStatus, 
  handlePrint, 
  exporting, 
  exportToPDF 
}) {
  return (
    <Card>
      <CardContent>
        <Stack spacing={3}>
          {/* إعدادات الطباعة */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <SettingsIcon  sx={{color:"#80b49e"}} />
              <Typography variant="h6" fontWeight="bold">
                إعدادات الطباعة
              </Typography>
            </Box>
            
            <FormControlLabel
              control={
                <Switch
                  checked={isCustomSheet}
                  onChange={(e) => setIsCustomSheet(e.target.checked)}
                  color="primary"
                />
              }
              label="ورقة مخصصة (كود يدوي)"
            />
            
            {isCustomSheet && (
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="كود الطالب"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  placeholder="اكتب كود الطالب هنا"
                  size="small"
                 inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  سيتم تحويل الأرقام للعرض بالعربية تلقائيًا في الورقة
                </Typography>
              </Box>
            )}
          </Box>

          {/* الإحصائيات */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <SchoolIcon sx={{color:"#80b49e"}} />
              <Typography variant="h6" fontWeight="bold">
                الإحصائيات
              </Typography>
            </Box>
            
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CircularProgress size={20} />
                <Typography variant="body2">جاري تحميل البيانات...</Typography>
              </Box>
            ) : (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="body2">عدد المستحقين:</Typography>
                  <Chip 
                    label={toArabicDigits(eligibleText)} 
                    color="primary" 
                    variant="outlined"
                  />
                </Box>
                {err && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    {err}
                  </Alert>
                )}
              </Box>
            )}
          </Box>

          {/* الإجراءات */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <PersonIcon sx={{color:"#80b49e"}} />
              <Typography variant="h6" fontWeight="bold">
                الإجراءات
              </Typography>
            </Box>
            
            <Stack spacing={1}>              
              <Button
                variant="outlined"
                sx={{color:"#80b49e"}}
                startIcon={exporting ? <CircularProgress size={20} /> : <PdfIcon sx={{color:"#80b49e"}} />}
                onClick={exportToPDF}
                disabled={exporting || !canPrint || studentsToPrint.length === 0 || examStatus !== "found"}
                fullWidth
              >
                {exporting ? "جاري إنشاء PDF..." : "تصدير PDF"}
              </Button>
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

/* التطبيق الرئيسي - معدل ليعتمد على بيانات قاعدة البيانات */
export default function PrintExamPage({ userBranch }) {
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState({ diploma: "", level: "", course: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [sectionOrder, setSectionOrder] = useState("tf-first");

  const [examMeta, setExamMeta] = useState(null);
  const [tfList, setTfList] = useState([]);
  const [mcqList, setMcqList] = useState([]);
  const [examStatus, setExamStatus] = useState("idle");

  const [isCustomSheet, setIsCustomSheet] = useState(false);
  const [customCode, setCustomCode] = useState("");

  // حالات جديدة لجلب المقررات من قاعدة البيانات
  const [branchCourses, setBranchCourses] = useState([]);
  const [branchCoursesLoading, setBranchCoursesLoading] = useState(false);
  const [branchCoursesErr, setBranchCoursesErr] = useState("");

  const printAreaRef = useRef(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const STUDENTS_API = userBranch?.guid 
    ? `https://api1.sstli.com/api/StudentStudyInfo/by-branch/${userBranch.guid}`
    : null;

  // تحميل بيانات الطلاب
  useEffect(() => {
    const fetchData = async () => {
      if (!STUDENTS_API) return;
      
      setLoading(true);
      setErr("");
      try {
        const res = await fetch(STUDENTS_API, {
          mode: "cors",
          headers: {
            "ngrok-skip-browser-warning": "true",
            "Content-Type": "application/json",
          },
        });
        const json = await res.json();
        setStudents(Array.isArray(json) ? json : []);
      } catch (e) {
        setErr("تعذر تحميل البيانات. تأكد من الـ API و CORS.");
        setStudents([
          {
            studentName: "سعيد علي صالح الزهراني",
            nationalId: "1063203838",
            diplomName: "دبلوم الأمن السيبراني",
            levelName: "السادس",
            code: "",
          },
          {
            studentName: "هويدي خلف عبدالهادي الدوسري",
            nationalId: "1094831052",
            diplomName: "دبلوم الموارد البشرية",
            levelName: "الخامس",
            code: "",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [STUDENTS_API]);

  // تحميل المقررات الخاصة بالفرع + الدبلوم + المستوى
  useEffect(() => {
    if (!userBranch?.guid || !selected.diploma || !selected.level) {
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
          DIPLOMA: selected.diploma,
          LEVELS: selected.level,
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
  }, [userBranch?.guid, selected.diploma, selected.level]);

  const filtered = useMemo(() => {
    return students.filter((s) => {
      if (selected.diploma && s.diplomName !== selected.diploma) return false;
      if (selected.level && s.levelName !== selected.level) return false;
      return true;
    });
  }, [students, selected.diploma, selected.level]);

  // تحميل الامتحان بناءً على المقرر المختار
  useEffect(() => {
    setExamMeta(null);
    setTfList([]);
    setMcqList([]);
    setExamStatus("idle");

    const { diploma, level, course } = selected;
    if (!diploma || !level || !course) return;

    const selectedCourse = branchCourses.find(c => 
      (c.id || c.ID) === course
    );

    const courseName = selectedCourse?.name || selectedCourse?.NAME || selectedCourse?.course_name;

    if (!courseName) return;

    (async () => {
      try {
        setExamStatus("loading");
        const res = await apiPost("get_exam_by_meta", {
          branch_guid: userBranch.guid,
          diploma_name: diploma,
          level_name: level,
          course_name: courseName,
        });

        if (res.ok && res.exam) {
          setExamMeta({
            id: res.exam.id,
            title: res.exam.title || "—",
            total_grade: Number(res.exam.total_grade ?? 60),
            duration_minutes: Number(res.exam.duration_minutes ?? 60),
          });

          const questions = Array.isArray(res.questions) ? res.questions : [];

          const tf = questions
            .filter((q) => {
              const type = (q.type || "").toUpperCase();
              return type === "TF" || type === "TRUE_FALSE" || type === "صح وخطأ";
            })
            .map((q) => q.text || q.question_text || q.content || q.question || "نص السؤال غير متوفر");

          const mcq = questions
            .filter((q) => {
              const type = (q.type || "").toUpperCase();
              return type === "MCQ" || type === "MULTIPLE_CHOICE" || type === "اختياري";
            })
            .map((q) => ({
              q: q.text || q.question_text || q.content || q.question || "نص السؤال غير متوفر",
              a: (q.options || [])
                .map((o) => o.opt_text || o.text || o.content || o.option || o.label || "خيار")
                .filter(Boolean),
            }));

          setTfList(tf);
          setMcqList(mcq);
          setExamStatus("found");
        } else {
          setExamStatus("not_found");
        }
      } catch (e) {
        setExamStatus("error");
      }
    })();
  }, [selected.diploma, selected.level, selected.course, branchCourses, userBranch?.guid]);

  const canBasePrint = selected.diploma && selected.level && selected.course;
  const canCustomPrint = isCustomSheet ? !!customCode : true;
  const canPrint = canBasePrint && canCustomPrint;

  const handlePrint = () => window.print();

  const studentsToPrint = useMemo(() => {
    if (!canBasePrint) return [];
    if (isCustomSheet) {
      return [
        {
          studentName: "",
          nationalId: "",
          diplomName: selected.diploma,
          levelName: selected.level,
          code: customCode?.trim(),
        },
      ];
    }
    return filtered;
  }, [isCustomSheet, customCode, filtered, selected.diploma, selected.level, canBasePrint]);

  const eligibleText = toArabicDigits(filtered.length);

  const [exporting, setExporting] = useState(false);

  const exportToPDF = async () => {
    if (!printAreaRef.current) return;
    
    try {
      setExporting(true);
      
      const element = printAreaRef.current;
      
      const options = {
        margin: [2, 2],
        filename: `امتحانات_${selected.diploma}_${selected.level}.pdf`,
        image: { 
          type: 'jpeg', 
          quality: 0.98 
        },
        html2canvas: { 
          scale: 3,
          useCORS: true,
          logging: false,
          letterRendering: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait',
          compress: true
        },
        pagebreak: { 
          mode: ['css', 'legacy']   // اعتمد على CSS فقط
        }
      };

      await html2pdf().set(options).from(element).save();
      
    } catch (error) {
      console.error('PDF export error:', error);
      alert('حدث خطأ أثناء التصدير إلى PDF');
    } finally {
      setExporting(false);
    }
  };

  return (
    <NavigationShell variant="standard" ><Box sx={{ display: 'flex', minHeight: '100vh', direction: "rtl" }}>
      
      
      <Box sx={{
        flex: 1,
        minHeight: '100vh',
        backgroundColor: 'grey.50',
        ...navigationContentSx
      }}>
        <Container maxWidth="xl" sx={{ py: 3 }}>
          {/* الهيدر الرئيسي */}
          <Paper sx={{ p: 3, mb: 3, background: `linear-gradient(135deg, #80b49e 0%, #6a9c8a 100%)`, color: 'white' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                  📄 نظام طباعة أوراق الاختبارات
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  إدارة وتنظيم أوراق اختبارات الطلاب
                </Typography>
              </Box>
              <Chip 
                label={`📍 ${userBranch?.name || "الفروع"}`} 
                sx={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.2)', 
                  color: 'white',
                  backdropFilter: 'blur(10px)'
                }} 
              />
            </Box>
          </Paper>

          {/* منطقة التحكم */}
          <Box sx={{ display: { xs: 'block', lg: 'grid' }, gridTemplateColumns: '1fr 400px', gap: 3, mb: 3 }}>
            <Box>
              <Filters
                data={students}
                selected={selected}
                setSelected={setSelected}
                sectionOrder={sectionOrder}
                setSectionOrder={setSectionOrder}
                branchCourses={branchCourses}
                branchCoursesLoading={branchCoursesLoading}
                branchCoursesErr={branchCoursesErr}
              />
              
              <Box sx={{ display: { xs: 'block', lg: 'none' }, mb: 3 }}>
                <ControlPanel
                  isCustomSheet={isCustomSheet}
                  setIsCustomSheet={setIsCustomSheet}
                  customCode={customCode}
                  setCustomCode={setCustomCode}
                  eligibleText={eligibleText}
                  loading={loading}
                  err={err}
                  canPrint={canPrint}
                  studentsToPrint={studentsToPrint}
                  examStatus={examStatus}
                  handlePrint={handlePrint}
                  exporting={exporting}
                  exportToPDF={exportToPDF}
                />
              </Box>

              {/* مدير المقررات المشتركة */}
              <SharedCoursesManager />
            </Box>

            <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
              <ControlPanel
                isCustomSheet={isCustomSheet}
                setIsCustomSheet={setIsCustomSheet}
                customCode={customCode}
                setCustomCode={setCustomCode}
                eligibleText={eligibleText}
                loading={loading}
                err={err}
                canPrint={canPrint}
                studentsToPrint={studentsToPrint}
                examStatus={examStatus}
                handlePrint={handlePrint}
                exporting={exporting}
                exportToPDF={exportToPDF}
              />
            </Box>
          </Box>

          {/* منطقة المعاينة والطباعة */}
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                <Typography variant="h5" fontWeight="bold">
                  👁️ معاينة الأوراق
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {examStatus === "found" && (
                    <Chip 
                      label={`✓ تم تحميل ${tfList.length + mcqList.length} سؤال`} 
                      color="success" 
                      variant="outlined"
                    />
                  )}
                  {examStatus === "loading" && (
                    <Chip 
                      label="⏳ جاري تحميل الامتحان..." 
                      color="warning" 
                      variant="outlined"
                    />
                  )}
                  {examStatus === "not_found" && (
                    <Chip 
                      label="⚠️ لا يوجد امتحان مسجل" 
                      color="error" 
                      variant="outlined"
                    />
                  )}
                </Box>
              </Box>

              <Box ref={printAreaRef} sx={{ width: '100%', margin: '0 auto' }}>
               {canPrint && examStatus === "found" && studentsToPrint.map((st, index) => {
  // 👇 احصل على اسم المقرر من branchCourses
  const selectedCourse = branchCourses.find(c => 
    (c.id || c.ID) === selected.course
  );
  const courseName = selectedCourse?.name || selectedCourse?.NAME || selectedCourse?.course_name;
  
  return (
    <ExamPaperPerStudent
      key={`${st.nationalId || "custom"}-${index}`}
      student={st}
      courseKey={selected.course}
      examMeta={examMeta}
      tfList={tfList}
      mcqList={mcqList}
      sectionOrder={sectionOrder}
      courseName={courseName} // 👈 أضف هذا
    />
  );
})}

                {canBasePrint && examStatus === "loading" && (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <CircularProgress size={60} sx={{ mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      جاري تحميل الامتحان...
                    </Typography>
                  </Box>
                )}

                {canBasePrint && examStatus === "not_found" && (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography variant="h3" color="text.secondary" sx={{ mb: 2 }}>
                      📭
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                      لا يوجد امتحان مسجل لهذه التركيبة (الدبلوم/المستوى/المقرر).
                    </Typography>
                  </Box>
                )}

                {canBasePrint && examStatus === "error" && (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography variant="h3" color="text.secondary" sx={{ mb: 2 }}>
                      ❌
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                      حدث خطأ أثناء جلب الامتحان. تأكد من الـ API.
                    </Typography>
                  </Box>
                )}
              </Box>

              {!canBasePrint && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography variant="h3" color="text.secondary" sx={{ mb: 2 }}>
                    📝
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    اختر الدبلوم ثم المستوى ثم المقرر لعرض الأوراق وتجهيز الطباعة/التصدير.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Container>
      </Box>
    </Box></NavigationShell>
  );
}
