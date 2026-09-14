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
  Fade,
  Zoom,
  Tabs,
  Tab
} from '@mui/material';
import {
  Poll,
  AccessTime,
  Assignment,
  Send,
  CheckCircle,
  EmojiEvents,
  TrendingUp,
  History,
  Description
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';


// الألوان الأساسية
const primaryColor = '#80b49e';
const primaryDark = '#6a9a87';
const primaryLight = '#9ac9b5';
const backgroundColor = '#f8fbfa';
const textColor = '#2c3e50';

const EmployeeSurveys = () => {
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
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="اكتب إجابتك هنا..."
            value={responses[index] || ''}
            onChange={(e) => handleResponseChange(index, e.target.value)}
            variant="outlined"
            sx={{ 
              mt: 2,
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': { borderColor: primaryColor },
                '&.Mui-focused fieldset': { borderColor: primaryColor },
              }
            }}
          />
        );

      case 'radio':
        return (
          <FormControl component="fieldset" sx={{ mt: 2, width: '100%' }}>
            <RadioGroup
              value={responses[index] || ''}
              onChange={(e) => handleResponseChange(index, e.target.value)}
            >
              {question.options.map((option, optIndex) => (
                <FormControlLabel
                  key={optIndex}
                  value={option}
                  control={<Radio sx={{ color: primaryColor }} />}
                  label={
                    <Typography sx={{ fontFamily: '"Cairo", sans-serif', fontSize: '1rem' }}>
                      {option}
                    </Typography>
                  }
                  sx={{ 
                    mb: 2,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: responses[index] === option ? `${primaryColor}15` : 'transparent',
                    border: responses[index] === option ? `1px solid ${primaryColor}` : '1px solid transparent',
                    transition: 'all 0.3s ease',
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
                  <Typography sx={{ fontFamily: '"Cairo", sans-serif', fontSize: '1rem' }}>
                    {option}
                  </Typography>
                }
                sx={{ 
                  mb: 2,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: (responses[index] || []).includes(option) ? `${primaryColor}15` : 'transparent',
                  border: (responses[index] || []).includes(option) ? `1px solid ${primaryColor}` : '1px solid transparent',
                  transition: 'all 0.3s ease',
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
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Rating
              value={parseInt(responses[index]) || 0}
              onChange={(event, newValue) => {
                handleResponseChange(index, newValue?.toString() || '0');
              }}
              size="large"
              sx={{ 
                fontSize: '3rem',
                '& .MuiRating-icon': {
                  color: primaryColor
                }
              }}
            />
            <Typography variant="h6" sx={{ mt: 2, color: primaryDark, fontFamily: '"Cairo", sans-serif' }}>
              {responses[index] ? `تقييمك: ${responses[index]} نجوم` : 'اختر تقييمك من 1 إلى 5 نجوم'}
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
    <Grid container spacing={3} justifyContent="center">
      {surveys.map((survey, index) => (
        <Grid item xs={12} md={6} lg={4} key={survey.id}>
          <Zoom in={true} timeout={500 + (index * 100)}>
            <Card 
              sx={{ 
                border: `2px solid ${primaryLight}`,
                borderRadius: 3,
                transition: 'all 0.4s ease',
                cursor: 'pointer',
                background: `linear-gradient(135deg, #ffffff 0%, ${backgroundColor} 100%)`,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': {
                  boxShadow: `0 15px 40px rgba(128, 180, 158, 0.25)`,
                  transform: 'translateY(-8px)',
                  borderColor: primaryColor
                }
              }}
              onClick={() => handleSurveyClick(survey)}
            >
              <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        color: primaryDark,
                        fontWeight: 'bold',
                        fontFamily: '"Cairo", sans-serif',
                        lineHeight: 1.3,
                        mb: 1
                      }}
                    >
                      {survey.title}
                    </Typography>
                  </Box>
                  <Chip 
                    icon={<AccessTime />}
                    label={`${getDaysRemaining(survey.end_date)} أيام`}
                    size="small"
                    sx={{ 
                      backgroundColor: getUrgencyColor(getDaysRemaining(survey.end_date)) + '15',
                      color: getUrgencyColor(getDaysRemaining(survey.end_date)),
                      fontFamily: '"Cairo", sans-serif',
                      fontWeight: 'bold',
                      border: `1px solid ${getUrgencyColor(getDaysRemaining(survey.end_date))}30`
                    }}
                  />
                </Box>

                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: textColor,
                    mb: 3,
                    fontFamily: '"Cairo", sans-serif',
                    lineHeight: 1.6,
                    flexGrow: 1
                  }}
                >
                  {survey.description}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Assignment sx={{ fontSize: 20, color: primaryColor }} />
                    <Typography variant="body2" sx={{ color: primaryDark, fontFamily: '"Cairo", sans-serif', fontWeight: 'bold' }}>
                      {survey.questions.length} أسئلة
                    </Typography>
                  </Box>
                  
                  <Button
                    variant="contained"
                    size="medium"
                    sx={{
                      background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryDark} 100%)`,
                      color: 'white',
                      borderRadius: 2,
                      px: 3,
                      py: 1,
                      fontFamily: '"Cairo", sans-serif',
                      fontWeight: 'bold',
                      boxShadow: `0 4px 15px ${primaryColor}40`,
                      '&:hover': {
                        background: `linear-gradient(135deg, ${primaryDark} 0%, #5a8875 100%)`,
                        boxShadow: `0 6px 20px ${primaryColor}60`,
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    ابدأ الآن
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Zoom>
        </Grid>
      ))}
    </Grid>
  );

  const renderSubmittedSurveys = () => (
    <Grid container spacing={3} justifyContent="center">
      {submittedSurveys.map((survey, index) => (
        <Grid item xs={12} md={6} lg={4} key={survey.id}>
          <Zoom in={true} timeout={500 + (index * 100)}>
            <Card 
              sx={{ 
                border: `2px solid ${primaryLight}`,
                borderRadius: 3,
                background: `linear-gradient(135deg, ${backgroundColor} 0%, ${primaryLight}15 100%)`,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                opacity: 0.8
              }}
            >
              <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        color: primaryDark,
                        fontWeight: 'bold',
                        fontFamily: '"Cairo", sans-serif',
                        lineHeight: 1.3,
                        mb: 1
                      }}
                    >
                      {survey.title}
                    </Typography>
                  </Box>
                  <Chip 
                    icon={<CheckCircle />}
                    label="مكتمل"
                    size="small"
                    sx={{ 
                      backgroundColor: '#4caf50',
                      color: 'white',
                      fontFamily: '"Cairo", sans-serif',
                      fontWeight: 'bold'
                    }}
                  />
                </Box>

                <Box sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Description sx={{ fontSize: 18, color: primaryColor }} />
                    <Typography variant="body2" sx={{ color: primaryDark, fontFamily: '"Cairo", sans-serif' }}>
                      {survey.questions_count} أسئلة
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <History sx={{ fontSize: 18, color: primaryColor }} />
                    <Typography variant="body2" sx={{ color: primaryDark, fontFamily: '"Cairo", sans-serif' }}>
                      تم التقديم: {formatDate(survey.submitted_date)}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <CheckCircle sx={{ fontSize: 40, color: '#4caf50', mb: 1 }} />
                  <Typography variant="body2" sx={{ color: '#4caf50', fontFamily: '"Cairo", sans-serif', fontWeight: 'bold' }}>
                    شكراً لمشاركتك
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Zoom>
        </Grid>
      ))}
    </Grid>
  );

  if (loading) {
    return (
      <NavigationShell variant="standard" ><Box sx={{ display: 'flex', minHeight: '100vh', background: backgroundColor }}>
        
        <Container 
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            ...navigationContentSx
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress sx={{ color: primaryColor, mb: 2 }} size={60} />
            <Typography variant="h6" sx={{ color: primaryDark, fontFamily: '"Cairo", sans-serif' }}>
              جاري تحميل الاستبيانات...
            </Typography>
          </Box>
        </Container>
      </Box></NavigationShell>
    );
  }

  return (
    <NavigationShell variant="standard" ><Box sx={{ display: 'flex', minHeight: '100vh', background: backgroundColor }}>
      
      
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Container 
          maxWidth="lg" 
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            ...navigationContentSx
          }}
        >
          <Fade in={true} timeout={800}>
            <Paper 
              elevation={0}
              sx={{ 
                p: { xs: 3, md: 5 },
                background: 'white',
                borderRadius: 4,
                boxShadow: '0 20px 60px rgba(128, 180, 158, 0.15)',
                border: `1px solid ${primaryLight}`,
                width: '100%',
                maxWidth: '1200px',
                my: 4
              }}
            >
              {/* Header Section */}
              <Box sx={{ 
                textAlign: 'center', 
                mb: 4,
                background: `linear-gradient(135deg, ${primaryColor}15 0%, ${primaryDark}15 100%)`,
                padding: 4,
                borderRadius: 3,
                border: `1px solid ${primaryLight}`
              }}>
                <Poll sx={{ fontSize: 60, color: primaryColor, mb: 2 }} />
                <Typography 
                  variant="h3" 
                  sx={{ 
                    color: primaryDark,
                    fontWeight: 'bold',
                    fontFamily: '"Cairo", sans-serif',
                    mb: 1
                  }}
                >
                  الاستبيانات
                </Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: primaryDark,
                    fontFamily: '"Cairo", sans-serif',
                    opacity: 0.8
                  }}
                >
                  شارك برأيك وساعدنا في التحسين المستمر
                </Typography>
              </Box>

              {/* Tabs Section */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
                <Tabs 
                  value={activeTab} 
                  onChange={(e, newValue) => setActiveTab(newValue)}
                  centered
                  sx={{
                    '& .MuiTab-root': {
                      fontFamily: '"Cairo", sans-serif',
                      fontWeight: 'bold',
                      fontSize: '1.1rem'
                    },
                    '& .Mui-selected': {
                      color: primaryColor
                    }
                  }}
                >
                  <Tab 
                    icon={<EmojiEvents />}
                    iconPosition="start"
                    label={`استبيانات جديدة (${surveys.length})`} 
                  />
                  <Tab 
                    icon={<History />}
                    iconPosition="start"
                    label={`الاستبيانات السابقة (${submittedSurveys.length})`} 
                  />
                </Tabs>
              </Box>

              {/* Content based on active tab */}
              {activeTab === 0 ? (
                surveys.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <CheckCircle sx={{ fontSize: 80, color: primaryLight, mb: 3 }} />
                    {/* <Typography variant="h4" sx={{ color: primaryDark, mb: 2, fontFamily: '"Cairo", sans-serif', fontWeight: 'bold' }}>
                      أحسنت! 🎉
                    </Typography> */}
                    <Typography variant="h6" sx={{ color: primaryDark, mb: 1, fontFamily: '"Cairo", sans-serif' }}>
                      لا توجد استبيانات جديدة حالياً
                    </Typography>
                    <Typography variant="body1" sx={{ color: primaryDark, fontFamily: '"Cairo", sans-serif', opacity: 0.7 }}>
                      جميع الاستبيانات المطلوبة منك قد تم إكمالها بنجاح
                    </Typography>
                  </Box>
                ) : (
                  renderNewSurveys()
                )
              ) : (
                submittedSurveys.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <History sx={{ fontSize: 80, color: primaryLight, mb: 3 }} />
                    <Typography variant="h4" sx={{ color: primaryDark, mb: 2, fontFamily: '"Cairo", sans-serif', fontWeight: 'bold' }}>
                      لا توجد استبيانات سابقة
                    </Typography>
                    <Typography variant="body1" sx={{ color: primaryDark, fontFamily: '"Cairo", sans-serif', opacity: 0.7 }}>
                      لم تقم بتقديم أي استبيانات حتى الآن
                    </Typography>
                  </Box>
                ) : (
                  renderSubmittedSurveys()
                )
              )}
            </Paper>
          </Fade>

          {/* Survey Response Dialog */}
          <Dialog 
            open={responseDialog} 
            onClose={() => !submitting && setResponseDialog(false)}
            maxWidth="md"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 3,
                background: 'white'
              }
            }}
          >
            <DialogTitle sx={{ 
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryDark} 100%)`,
              color: 'white',
              fontFamily: '"Cairo", sans-serif',
              fontWeight: 'bold',
              textAlign: 'center',
              py: 3
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                <Poll sx={{ fontSize: 32 }} />
                <Typography variant="h4" sx={{ fontFamily: '"Cairo", sans-serif', fontWeight: 'bold' }}>
                  {selectedSurvey?.title}
                </Typography>
              </Box>
            </DialogTitle>

            <DialogContent sx={{ p: 4 }}>
              {submitSuccess ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <CheckCircle sx={{ fontSize: 80, color: '#4caf50', mb: 3 }} />
                  <Typography variant="h4" sx={{ color: primaryDark, mb: 2, fontFamily: '"Cairo", sans-serif', fontWeight: 'bold' }}>
                    شكراً لمشاركتك! 🌟
                  </Typography>
                  <Typography variant="h6" sx={{ color: primaryDark, mb: 1, fontFamily: '"Cairo", sans-serif' }}>
                    تم إرسال إجاباتك بنجاح
                  </Typography>
                  <Typography variant="body1" sx={{ color: primaryDark, fontFamily: '"Cairo", sans-serif', opacity: 0.7 }}>
                    رأيك يساعدنا في التحسين المستمر
                  </Typography>
                </Box>
              ) : (
                <>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: primaryDark,
                      mb: 3,
                      fontFamily: '"Cairo", sans-serif',
                      lineHeight: 1.6,
                      textAlign: 'center',
                      background: `${primaryColor}10`,
                      padding: 3,
                      borderRadius: 2,
                      border: `1px solid ${primaryLight}`
                    }}
                  >
                    {selectedSurvey?.description}
                  </Typography>

                  <Divider sx={{ my: 3, borderColor: primaryLight }} />

                  {selectedSurvey?.questions.map((question, index) => (
                    <Box 
                      key={index} 
                      sx={{ 
                        mb: 4, 
                        p: 3, 
                        border: `2px solid ${primaryLight}`,
                        borderRadius: 3,
                        background: 'white',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          borderColor: primaryColor,
                          boxShadow: `0 4px 20px ${primaryColor}15`
                        }
                      }}
                    >
                      <Typography 
                        variant="h5" 
                        sx={{ 
                          color: primaryDark,
                          mb: 3,
                          fontFamily: '"Cairo", sans-serif',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        <Box 
                          sx={{ 
                            background: primaryColor,
                            color: 'white',
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1rem',
                            fontWeight: 'bold'
                          }}
                        >
                          {index + 1}
                        </Box>
                        {question.text}
                      </Typography>
                      {renderQuestion(question, index)}
                    </Box>
                  ))}
                </>
              )}
            </DialogContent>

            {!submitSuccess && (
              <DialogActions sx={{ p: 3, gap: 2, justifyContent: 'center' }}>
                <Button
                  onClick={() => setResponseDialog(false)}
                  disabled={submitting}
                  variant="outlined"
                  sx={{
                    borderColor: primaryColor,
                    color: primaryColor,
                    fontFamily: '"Cairo", sans-serif',
                    fontWeight: 'bold',
                    borderRadius: 2,
                    px: 4,
                    py: 1,
                    '&:hover': {
                      borderColor: primaryDark,
                      backgroundColor: `${primaryColor}10`
                    }
                  }}
                >
                  إلغاء
                </Button>
                <Button
                  onClick={handleSubmitResponse}
                  disabled={submitting}
                  variant="contained"
                  startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <Send />}
                  sx={{
                    background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryDark} 100%)`,
                    color: 'white',
                    fontFamily: '"Cairo", sans-serif',
                    fontWeight: 'bold',
                    borderRadius: 2,
                    px: 4,
                    py: 1,
                    boxShadow: `0 4px 15px ${primaryColor}40`,
                    '&:hover': {
                      background: `linear-gradient(135deg, ${primaryDark} 0%, #5a8875 100%)`,
                      boxShadow: `0 6px 20px ${primaryColor}60`
                    },
                    '&:disabled': {
                      background: '#ccc'
                    }
                  }}
                >
                  {submitting ? 'جاري الإرسال...' : 'إرسال الإجابات'}
                </Button>
              </DialogActions>
            )}
          </Dialog>
        </Container>
      </LocalizationProvider>
    </Box></NavigationShell>
  );
};

export default EmployeeSurveys;