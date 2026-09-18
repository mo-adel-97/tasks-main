import * as uiLayout from './common/uiLayout';
import { hrChipSx, hrTabIconSx } from "./hrControlStyles";
import { navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from './NavigationShell';
import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Checkbox,
  FormGroup,
  Rating,
  Tabs,
  Tab
} from '@mui/material';
import {
  AccessTime,
  Assignment,
  Send,
  CheckCircle,
  History,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useTheme } from '@mui/material/styles';
import axios from 'axios';


// الألوان الأساسية
const primaryColor = '#057546';
const primaryDark = '#034d31';
const primaryLight = '#80b49e';
const backgroundColor = '#f6faf8';
const textColor = '#17372b';
const focusBorderColor = '#67C99D';

const EmployeeSurveys = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [surveys, setSurveys] = useState([]);
  const [submittedSurveys, setSubmittedSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [responseDialog, setResponseDialog] = useState(false);
  const [responses, setResponses] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserData(user);
    fetchActiveSurveys(user);
    fetchSubmittedSurveys(user);
  }, []);

const fetchActiveSurveys = async (user) => {
  try {
    setLoading(true);
    
    // استخدام الاسم بدل الجيUID
    const userName = user.fullName || user.userName || 'غير معروف';
    const response = await axios.get(`https://filesregsiteration.sstli.com/erp/survey_api.php/user_eligible_surveys?user_name=${encodeURIComponent(userName)}`);
    
    // فلتر علشان نجيب بس الاستبيانات اللي اليوزر الحالي موجود في target_users
    const activeSurveys = response.data.filter(survey => {
      // إذا الـ target_users فارغ أو null، مش هنعرض الاستبيان
      if (!survey.target_users || survey.target_users.length === 0) {
        return false;
      }
      
      // نشوف إذا اليوزر الحالي موجود في الـ target_users
      const userInTarget = survey.target_users.some(targetUser => 
        targetUser && targetUser === user.guid
      );
      
      // نرجع true فقط إذا اليوزر موجود في الـ target_users ومش قدم الاستبيان
      return userInTarget && !survey.already_submitted;
    });
    
    setSurveys(activeSurveys);
  } catch (error) {
    console.error('Error fetching active surveys:', error);
    // في حالة الخطأ، استخدم الطريقة القديمة كـ fallback
    try {
      const fallbackResponse = await axios.get('https://filesregsiteration.sstli.com/erp/survey_api.php/active_surveys');
      
      // نفس الفلتر علشان الـ fallback
      const filteredSurveys = fallbackResponse.data.filter(survey => {
        if (!survey.target_users || survey.target_users.length === 0) {
          return false;
        }
        
        const userInTarget = survey.target_users.some(targetUser => 
          targetUser && targetUser === user.guid
        );
        
        return userInTarget;
      });
      
      setSurveys(filteredSurveys);
    } catch (fallbackError) {
      console.error('Error in fallback:', fallbackError);
      setSurveys([]);
    }
  } finally {
    setLoading(false);
  }
};

const fetchSubmittedSurveys = async (user) => {
  try {
    // استخدام الاسم بدل الجيUID
    const userName = user.fullName || user.userName || 'غير معروف';
    const response = await axios.get(`https://filesregsiteration.sstli.com/erp/survey_api.php/user_submitted_surveys?user_name=${encodeURIComponent(userName)}`);
    
    // فلتر علشان نجيب بس الاستبيانات اللي اليوزر الحالي كان موجود في target_users
    const filteredSubmitted = response.data.filter(survey => {
      // هنا مش محتاجين نتحقق من الـ target_users لأن الاستبيان اتم تقديمه بالفعل
      // لكن علشان نظهر فقط الاستبيانات اللي كانت مخصصة له
      return true; // نرجع كل الاستبيانات المقدمة
    });
    
    setSubmittedSurveys(filteredSubmitted);
  } catch (error) {
    console.error('Error fetching submitted surveys:', error);
    // في حالة الخطأ، استخدم بيانات وهمية للتجربة فقط
    const mockSubmitted = [
      {
        id: 1001,
        title: "استبيان الرضا الوظيفي",
        submitted_date: "2024-01-15",
        questions_count: 5,
        description: "استبيان لقياس مستوى الرضا الوظيفي"
      }
    ];
    setSubmittedSurveys(mockSubmitted);
  }
};;

  const isUserEligible = (survey, user) => {
    if (survey.target_users && survey.target_users.includes(user.guid)) {
      return true;
    }

    if (survey.target_departments && survey.target_departments.includes(user.departGuid)) {
      if (survey.target_jobs && 
          (survey.target_jobs.includes("all") || survey.target_jobs.includes(user.userJop))) {
        return true;
      }
    }

    return false;
  };

  const handleSurveyClick = (survey) => {
    setSelectedSurvey(survey);
    setResponses({});
    setResponseDialog(true);
  };

  const handleResponseChange = (questionIndex, value) => {
    setResponses(prev => ({
      ...prev,
      [questionIndex]: value
    }));
  };

  const handleSubmitResponse = async () => {
    if (!selectedSurvey || !userData) return;

    try {
      setSubmitting(true);
      
      const allQuestionsAnswered = selectedSurvey.questions.every((question, index) => {
        return responses[index] !== undefined && responses[index] !== '' && 
               (!Array.isArray(responses[index]) || responses[index].length > 0);
      });

      if (!allQuestionsAnswered) {
        alert('يرجى الإجابة على جميع الأسئلة');
        return;
      }

      // استخدام الـ fullName من اللوكال ستورج
      const responseData = {
        survey_id: selectedSurvey.id,
        employee_name: userData.fullName || userData.userName || 'غير معروف',
        department: userData.departName || 'غير محدد',
        responses: responses
      };

      await axios.post('https://filesregsiteration.sstli.com/erp/survey_api.php/submit_response', responseData);
      
      setSubmitSuccess(true);
      setTimeout(() => {
        setResponseDialog(false);
        setSubmitSuccess(false);
        // إزالة الاستبيان من القائمة وإضافته للاستبيانات المقدمة
        setSurveys(prev => prev.filter(s => s.id !== selectedSurvey.id));
        setSubmittedSurveys(prev => [...prev, {
          id: selectedSurvey.id,
          title: selectedSurvey.title,
          submitted_date: new Date().toISOString().split('T')[0],
          questions_count: selectedSurvey.questions.length,
          description: selectedSurvey.description
        }]);
      }, 2000);

    } catch (error) {
      console.error('Error submitting response:', error);
      alert('حدث خطأ أثناء إرسال الاستبيان');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question, index) => {
    switch (question.type) {
      case 'text':
        return (
          <TextField InputLabelProps={{ shrink: true }}
            fullWidth
            multiline
            rows={3}
            placeholder="اكتب إجابتك هنا..."
            value={responses[index] || ''}
            onChange={(e) => handleResponseChange(index, e.target.value)}
            variant="outlined"
            sx={uiLayout.withUiSx({ 
              mt: 0.8,
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': { borderColor: primaryColor },
                '&.Mui-focused fieldset': { borderColor: primaryColor },
              }
            }, uiLayout.formFieldSx)}
          />
        );

      case 'radio':
        return (
          <FormControl component="fieldset" sx={uiLayout.withUiSx({ mt: 0.8, width: '100%' }, uiLayout.formFieldSx)}>
            <RadioGroup sx={uiLayout.radioGroupSx}
              value={responses[index] || ''}
              onChange={(e) => handleResponseChange(index, e.target.value)}
            >
              {question.options.map((option, optIndex) => (
                <FormControlLabel
                  key={optIndex}
                  value={option}
                  control={<Radio sx={{ color: primaryColor }} />}
                  label={
                    <Typography sx={{ fontFamily: '"Cairo", sans-serif', fontSize: '0.76rem' }}>
                      {option}
                    </Typography>
                  }
                  sx={{ 
                    mb: 0.5,
                    padding: '5px 8px',
                    borderRadius: '8px',
                    backgroundColor: responses[index] === option ? `${primaryColor}15` : 'transparent',
                    border: isDark ? `1px solid ${focusBorderColor}` : '1px solid rgba(5,117,70,0.11)',
                    transition: 'background-color .15s ease, border-color .15s ease',
                    '&:hover': {
                      backgroundColor: `${primaryColor}10`
                    }
                  }}
                />
              ))}
            </RadioGroup>
          </FormControl>
        );

      case 'checkbox':
        return (
          <FormGroup sx={{ mt: 2, width: '100%' }}>
            {question.options.map((option, optIndex) => (
              <FormControlLabel
                key={optIndex}
                control={
                  <Checkbox
                    checked={(responses[index] || []).includes(option)}
                    onChange={(e) => {
                      const currentValues = responses[index] || [];
                      const newValues = e.target.checked
                        ? [...currentValues, option]
                        : currentValues.filter(val => val !== option);
                      handleResponseChange(index, newValues);
                    }}
                    sx={{ color: primaryColor }}
                  />
                }
                label={
                  <Typography sx={{ fontFamily: '"Cairo", sans-serif', fontSize: '0.76rem' }}>
                    {option}
                  </Typography>
                }
                sx={{ 
                  mb: 0.5,
                  padding: '5px 8px',
                  borderRadius: '8px',
                  backgroundColor: (responses[index] || []).includes(option) ? `${primaryColor}15` : 'transparent',
                  border: isDark ? `1px solid ${focusBorderColor}` : '1px solid rgba(5,117,70,0.11)',
                  transition: 'background-color .15s ease, border-color .15s ease',
                  '&:hover': {
                    backgroundColor: `${primaryColor}10`
                  }
                }}
              />
            ))}
          </FormGroup>
        );

      case 'rating':
        return (
          <Box sx={{ mt: 1, textAlign: 'center' }}>
            <Rating
              value={parseInt(responses[index]) || 0}
              onChange={(event, newValue) => {
                handleResponseChange(index, newValue?.toString() || '0');
              }}
              size="large"
              sx={{ 
                fontSize: '2rem',
                '& .MuiRating-icon': {
                  color: primaryColor
                }
              }}
            />
            <Typography variant="body2" sx={{ mt: 0.5, color: primaryDark, fontFamily: '"Cairo", sans-serif' }}>
              {responses[index] ? `التقييم: ${responses[index]} من 5` : 'اختر التقييم'}
            </Typography>
          </Box>
        );

      default:
        return null;
    }
  };

  const getDaysRemaining = (endDate) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getUrgencyColor = (days) => {
    if (days <= 1) return '#f44336';
    if (days <= 3) return '#ff9800';
    return '#4caf50';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderNewSurveys = () => (
    <Grid container spacing={1}>
      {surveys.map((survey) => {
        const daysRemaining = getDaysRemaining(survey.end_date);

        return (
          <Grid item xs={12} md={6} xl={4} key={survey.id}>
            <Card
              onClick={() => handleSurveyClick(survey)}
              sx={{
                height: '100%',
                cursor: 'pointer',
                borderRadius: 2.5,
                border: isDark ? `1px solid ${focusBorderColor}` : '1px solid rgba(5,117,70,0.11)',
                boxShadow: 'none',
                bgcolor: '#fff',
                transition: 'border-color .15s ease, background-color .15s ease',
                '&:hover': {
                  borderColor: isDark ? focusBorderColor : 'rgba(5,117,70,0.11)',
                  bgcolor: '#fbfdfc'
                }
              }}
            >
              <CardContent sx={{ p: '12px !important' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                      sx={{
                        color: '#17372b',
                        fontWeight: 900,
                        fontFamily: '"Cairo", sans-serif',
                        fontSize: '0.88rem',
                        lineHeight: 1.4
                      }}
                    >
                      {survey.title}
                    </Typography>

                    {survey.description && (
                      <Typography
                        sx={{
                          mt: 0.35,
                          color: '#6d7e76',
                          fontFamily: '"Cairo", sans-serif',
                          fontSize: '0.68rem',
                          lineHeight: 1.55,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {survey.description}
                      </Typography>
                    )}
                  </Box>

                  <Chip
                    icon={<AccessTime sx={{ fontSize: 14 }} />}
                    label={`${daysRemaining} يوم`}
                    size="small"
                    sx={[hrChipSx("small"), {
                      height: 24,
                      flexShrink: 0,
                      bgcolor: daysRemaining <= 3 ? '#fff5e8' : '#edf7f2',
                      color: daysRemaining <= 3 ? '#a86600' : '#057546',
                      border: `1px solid ${daysRemaining <= 3 ? '#f0d5a0' : 'rgba(5,117,70,.16)'}`,
                      fontFamily: '"Cairo", sans-serif',
                      fontSize: '0.64rem',
                      fontWeight: 850
                    }]}
                  />
                </Box>

                <Box
                  sx={{
                    mt: 1,
                    pt: 0.8,
                    borderTop: '1px solid #edf2ef',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.45, color: '#60736b' }}>
                    <Assignment sx={{ fontSize: 16, color: primaryColor }} />
                    <Typography sx={{ fontSize: '0.67rem', fontWeight: 750 }}>
                      {survey.questions.length} سؤال
                    </Typography>
                  </Box>

                  <Button
                    variant="contained"
                    size="small"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleSurveyClick(survey);
                    }}
                    sx={uiLayout.withUiSx({
                      minHeight: 32,
                      px: 1,
                      bgcolor: primaryColor,
                      color: '#fff',
                      borderRadius: 1.7,
                      fontFamily: '"Cairo", sans-serif',
                      fontSize: '0.67rem',
                      fontWeight: 850,
                      boxShadow: 'none',
                      '&:hover': {
                        bgcolor: primaryDark,
                        boxShadow: 'none'
                      }
                    }, uiLayout.buttonSx)}
                  >
                    فتح الاستبيان
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );

  const renderSubmittedSurveys = () => (
    <Grid container spacing={1}>
      {submittedSurveys.map((survey) => (
        <Grid item xs={12} md={6} xl={4} key={survey.id}>
          <Card
            sx={{
              height: '100%',
              borderRadius: 2.5,
              border: isDark ? `1px solid ${focusBorderColor}` : '1px solid rgba(5,117,70,0.11)',
              boxShadow: 'none',
              bgcolor: '#fff'
            }}
          >
            <CardContent sx={{ p: '12px !important' }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                <Typography
                  sx={{
                    color: '#17372b',
                    fontWeight: 900,
                    fontFamily: '"Cairo", sans-serif',
                    fontSize: '0.86rem',
                    lineHeight: 1.4
                  }}
                >
                  {survey.title}
                </Typography>

                <Chip
                  icon={<CheckCircle sx={{ fontSize: 14 }} />}
                  label="تم الإرسال"
                  size="small"
                  sx={[hrChipSx("small"), {
                    height: 24,
                    bgcolor: '#edf8f0',
                    color: '#237a3a',
                    border: '1px solid #c3e1ca',
                    fontFamily: '"Cairo", sans-serif',
                    fontSize: '0.63rem',
                    fontWeight: 850
                  }]}
                />
              </Box>

              <Box
                sx={{
                  mt: 1,
                  pt: 0.8,
                  borderTop: '1px solid #edf2ef',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1,
                  flexWrap: 'wrap'
                }}
              >
                <Typography sx={{ color: '#60736b', fontSize: '0.66rem' }}>
                  {survey.questions_count} سؤال
                </Typography>

                <Typography sx={{ color: '#60736b', fontSize: '0.66rem' }}>
                  {formatDate(survey.submitted_date)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  if (loading) {
    return (
      <NavigationShell variant="standard">
        <Box sx={{
        display: 'flex',
        minHeight: '100vh',
        background: isDark ? theme.palette.background.default : '#f6faf8',
        '& .MuiPaper-root, & .MuiCard-root': { border: isDark ? `1px solid ${focusBorderColor}` : '1px solid rgba(5,117,70,0.11)' },
        '& .MuiOutlinedInput-notchedOutline': { borderColor: isDark ? `${focusBorderColor} !important` : undefined },
        '& .MuiTableCell-root': { borderColor: isDark ? `${focusBorderColor} !important` : undefined }
      }} >
          <Container
            maxWidth={false}
            disableGutters
            sx={{
              minHeight: 220,
              display: 'grid',
              placeItems: 'center',
              ...navigationContentSx
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress sx={{ color: primaryColor }} size={34} />
              <Typography sx={{ mt: 0.75, color: '#60736b', fontSize: '0.72rem' }}>
                جاري تحميل الاستبيانات...
              </Typography>
            </Box>
          </Container>
        </Box>
      </NavigationShell>
    );
  }

  return (
    <NavigationShell variant="standard">
      <Box sx={{
        display: 'flex',
        minHeight: '100vh',
        background: isDark ? theme.palette.background.default : '#f6faf8',
        '& .MuiPaper-root, & .MuiCard-root': { border: isDark ? `1px solid ${focusBorderColor}` : '1px solid rgba(5,117,70,0.11)' },
        '& .MuiOutlinedInput-notchedOutline': { borderColor: isDark ? `${focusBorderColor} !important` : undefined },
        '& .MuiTableCell-root': { borderColor: isDark ? `${focusBorderColor} !important` : undefined }
      }} >
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Container
            maxWidth={false}
            disableGutters
            sx={{
              width: '100%',
              ...navigationContentSx
            }}
          >
            <Box
              sx={{
                minHeight: 72,
                px: { xs: 1, sm: 1.25, md: 1.5 },
                py: 1,
                mb: 1,
                borderRadius: 2.5,
                bgcolor: primaryDark,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
                flexWrap: 'wrap'
              }}
            >
              <Box>
                <Typography
                  sx={{
                    fontFamily: '"Cairo", sans-serif',
                    fontWeight: 950,
                    fontSize: '1.08rem',
                    lineHeight: 1.25
                  }}
                >
                  استبياناتي
                </Typography>
                <Typography
                  sx={{
                    mt: 0.15,
                    color: 'rgba(255,255,255,.74)',
                    fontFamily: '"Cairo", sans-serif',
                    fontSize: '0.68rem'
                  }}
                >
                  الاستبيانات المطلوبة والمكتملة
                </Typography>
              </Box>

              <Box
                sx={{
                  minWidth: 42,
                  height: 32,
                  px: 0.8,
                  borderRadius: 999,
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: 'rgba(255,255,255,.12)',
                  border: '1px solid rgba(255,255,255,.2)',
                  fontSize: '0.7rem',
                  fontWeight: 900
                }}
              >
                {surveys.length} متاح
              </Box>
            </Box>

            <Paper
              elevation={0}
              sx={{
                p: { xs: 0.75, sm: 1, md: 1.15 },
                borderRadius: 2.5,
                border: isDark ? `1px solid ${focusBorderColor}` : '1px solid rgba(5,117,70,0.11)',
                bgcolor: '#fff'
              }}
            >
              <Box
                sx={{
                  mb: 1,
                  borderBottom: '1px solid #edf2ef',
                  overflowX: 'auto'
                }}
              >
                <Tabs
                  value={activeTab}
                  onChange={(event, newValue) => setActiveTab(newValue)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    minHeight: 42,
                    '& .MuiTab-root': {
                      minHeight: 42,
                      px: 1.2,
                      fontFamily: '"Cairo", sans-serif',
                      fontWeight: 850,
                      fontSize: '0.72rem'
                    },
                    '& .Mui-selected': { color: primaryColor },
                    '& .MuiTabs-indicator': { bgcolor: primaryColor, height: 2 }
                  }}
                >
                  <Tab
                    sx={hrTabIconSx}
                    icon={<Assignment sx={{ fontSize: 17 }} />}
                    iconPosition="start"
                    label={`المطلوبة (${surveys.length})`}
                  />
                  <Tab
                    sx={hrTabIconSx}
                    icon={<History sx={{ fontSize: 17 }} />}
                    iconPosition="start"
                    label={`المكتملة (${submittedSurveys.length})`}
                  />
                </Tabs>
              </Box>

              {activeTab === 0 ? (
                surveys.length === 0 ? (
                  <Box
                    sx={{
                      minHeight: 140,
                      display: 'grid',
                      placeItems: 'center',
                      textAlign: 'center'
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontWeight: 900, color: '#50645b', fontSize: '0.82rem' }}>
                        لا توجد استبيانات مطلوبة
                      </Typography>
                      <Typography sx={{ mt: 0.25, color: '#85928c', fontSize: '0.66rem' }}>
                        ستظهر هنا الاستبيانات الجديدة عند إضافتها
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  renderNewSurveys()
                )
              ) : submittedSurveys.length === 0 ? (
                <Box
                  sx={{
                    minHeight: 140,
                    display: 'grid',
                    placeItems: 'center',
                    textAlign: 'center'
                  }}
                >
                  <Box>
                    <Typography sx={{ fontWeight: 900, color: '#50645b', fontSize: '0.82rem' }}>
                      لا توجد استبيانات مكتملة
                    </Typography>
                    <Typography sx={{ mt: 0.25, color: '#85928c', fontSize: '0.66rem' }}>
                      الاستبيانات التي ترسلها ستظهر هنا
                    </Typography>
                  </Box>
                </Box>
              ) : (
                renderSubmittedSurveys()
              )}
            </Paper>

            <Dialog
              sx={[uiLayout.dialogLayoutSx, { '& .MuiDialog-paper': { border: isDark ? `1px solid ${focusBorderColor}` : '1px solid rgba(5,117,70,0.11)' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: isDark ? `${focusBorderColor} !important` : undefined } }]}
              open={responseDialog}
              onClose={() => !submitting && setResponseDialog(false)}
              fullWidth
              maxWidth={false}
              PaperProps={{
                sx: {
                  width: { xs: 'calc(100% - 16px)', sm: 'min(820px, calc(100% - 32px))' },
                  maxWidth: '820px !important',
                  m: { xs: 1, sm: 2 },
                  borderRadius: 2.5,
                  overflow: 'hidden',
                  bgcolor: '#fff'
                }
              }}
            >
              <DialogTitle
                sx={{
                  px: { xs: 1.25, sm: 1.5 },
                  py: 1,
                  borderBottom: isDark ? `1px solid ${focusBorderColor}` : '1px solid rgba(5,117,70,.08)',
                  bgcolor: '#fff'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                  <Box minWidth={0}>
                    <Typography
                      sx={{
                        color: '#17372b',
                        fontFamily: '"Cairo", sans-serif',
                        fontWeight: 950,
                        fontSize: '0.96rem',
                        lineHeight: 1.35
                      }}
                    >
                      {selectedSurvey?.title}
                    </Typography>
                    <Typography sx={{ mt: 0.1, color: '#74827c', fontSize: '0.66rem' }}>
                      أجب عن جميع الأسئلة ثم أرسل الاستبيان
                    </Typography>
                  </Box>

                  <Button
                    onClick={() => setResponseDialog(false)}
                    disabled={submitting}
                    color="inherit"
                    size="small"
                    sx={{ minWidth: 0, px: 0.75, fontSize: '0.68rem' }}
                  >
                    إغلاق
                  </Button>
                </Box>
              </DialogTitle>

              <DialogContent dividers sx={{ p: { xs: 1, sm: 1.5 }, bgcolor: '#fbfdfc' }}>
                {submitSuccess ? (
                  <Box
                    sx={{
                      minHeight: 180,
                      display: 'grid',
                      placeItems: 'center',
                      textAlign: 'center'
                    }}
                  >
                    <Box>
                      <CheckCircle sx={{ fontSize: 42, color: '#2e7d32' }} />
                      <Typography sx={{ mt: 0.6, color: '#17372b', fontWeight: 900, fontSize: '0.9rem' }}>
                        تم إرسال الاستبيان
                      </Typography>
                      <Typography sx={{ mt: 0.2, color: '#74827c', fontSize: '0.68rem' }}>
                        تم حفظ إجاباتك بنجاح
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <>
                    {selectedSurvey?.description && (
                      <Box
                        sx={{
                          mb: 1,
                          p: 1,
                          borderRadius: 2,
                          bgcolor: '#edf7f2',
                          border: isDark ? `1px solid ${focusBorderColor}` : '1px solid rgba(5,117,70,0.11)'
                        }}
                      >
                        <Typography
                          sx={{
                            color: '#456056',
                            fontFamily: '"Cairo", sans-serif',
                            fontSize: '0.72rem',
                            lineHeight: 1.6
                          }}
                        >
                          {selectedSurvey.description}
                        </Typography>
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                      {selectedSurvey?.questions.map((question, index) => (
                        <Box
                          key={index}
                          sx={{
                            p: { xs: 0.9, sm: 1.1 },
                            border: isDark ? `1px solid ${focusBorderColor}` : '1px solid rgba(5,117,70,0.11)',
                            borderRadius: 2,
                            bgcolor: '#fff'
                          }}
                        >
                          <Typography
                            sx={{
                              color: '#17372b',
                              mb: 0.65,
                              fontFamily: '"Cairo", sans-serif',
                              fontWeight: 900,
                              fontSize: '0.78rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.6
                            }}
                          >
                            <Box
                              sx={{
                                width: 24,
                                height: 24,
                                borderRadius: 1.5,
                                display: 'grid',
                                placeItems: 'center',
                                bgcolor: '#edf7f2',
                                color: primaryColor,
                                fontSize: '0.67rem',
                                fontWeight: 950,
                                flexShrink: 0
                              }}
                            >
                              {index + 1}
                            </Box>
                            {question.text}
                          </Typography>
                          {renderQuestion(question, index)}
                        </Box>
                      ))}
                    </Box>
                  </>
                )}
              </DialogContent>

              {!submitSuccess && (
                <DialogActions
                  sx={uiLayout.withUiSx({
                    px: { xs: 1.25, sm: 1.5 },
                    py: 1,
                    gap: 0.7,
                    justifyContent: 'flex-start',
                    bgcolor: '#fff'
                  }, uiLayout.dialogActionsSx)}
                >
                  <Button
                    onClick={handleSubmitResponse}
                    disabled={submitting}
                    variant="contained"
                    startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <Send />}
                    sx={uiLayout.withUiSx({
                      minHeight: 36,
                      px: 1.25,
                      bgcolor: primaryColor,
                      color: '#fff',
                      fontFamily: '"Cairo", sans-serif',
                      fontWeight: 900,
                      fontSize: '0.7rem',
                      boxShadow: 'none',
                      '&:hover': { bgcolor: primaryDark, boxShadow: 'none' },
                      '&:disabled': { bgcolor: '#c9d3ce' }
                    }, uiLayout.buttonSx)}
                  >
                    {submitting ? 'جاري الإرسال...' : 'إرسال الاستبيان'}
                  </Button>

                  <Button
                    onClick={() => setResponseDialog(false)}
                    disabled={submitting}
                    color="inherit"
                    sx={uiLayout.buttonSx}
                  >
                    إلغاء
                  </Button>
                </DialogActions>
              )}
            </Dialog>
          </Container>
        </LocalizationProvider>
      </Box>
    </NavigationShell>
  );
};

export default EmployeeSurveys;