import * as uiLayout from '../common/uiLayout';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Paper,
  Divider,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  EmojiEvents,
  Star,
  Person,
  Business,
  Grade,
  History,
  Add,
  Edit,
  Visibility
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const COLOR_SCHEME = {
  primary: '#76ae97',
  primaryLight: '#94c4ac',
  primaryDark: '#5a8f7a',
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
  background: '#f8fbfa'
};

const IMAGE_API_BASE_URL = 'https://filesregsiteration.sstli.com/erp/image_api.php';
const API_BASE_URL = 'https://filesregsiteration.sstli.com/erp/best-employee.php';

const EmployeeOfTheMonthTab = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [openRatingDialog, setOpenRatingDialog] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // +1 لأن الشهر في PHP بيكون من 1-12
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reason, setReason] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [employeesPerPage] = useState(8);
  const [pastWinners, setPastWinners] = useState([]);
  const [currentRatings, setCurrentRatings] = useState({});
  const [loading, setLoading] = useState(false);
  const [existingEvaluations, setExistingEvaluations] = useState({});

  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const years = [2023, 2024, 2025];

  const evaluationCriteria = {
    productivity: { name: 'الإنتاجية', weight: 25 },
    quality: { name: 'جودة العمل', weight: 20 },
    teamwork: { name: 'روح الفريق', weight: 15 },
    creativity: { name: 'الإبداع', weight: 15 },
    commitment: { name: 'الالتزام', weight: 15 },
    development: { name: 'التطور', weight: 10 }
  };

  useEffect(() => {
    fetchEmployees();
    fetchPastWinners();
    checkExistingEvaluations();
  }, [selectedMonth, selectedYear]);

  // جلب بيانات الموظفين
  const fetchEmployees = async () => {
    try {
      const response = await fetch('https://api1.sstli.com/api/userinfo');
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
        
        // فلترة الموظفين بنفس الفرع
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const sameBranchEmployees = data.filter(emp => 
          emp.branchForWork === currentUser.branchForWork && emp.guid !== currentUser.guid
        );
        
        // جلب التقييمات الحالية من الـ API
        const employeesWithRatings = await Promise.all(
          sameBranchEmployees.map(async (emp) => {
            const evaluation = await fetchEmployeeEvaluation(emp.guid, selectedMonth, selectedYear);
            return {
              ...emp,
              ratings: evaluation ? {
                productivity: evaluation.productivity_rating,
                quality: evaluation.quality_rating,
                teamwork: evaluation.teamwork_rating,
                creativity: evaluation.creativity_rating,
                commitment: evaluation.commitment_rating,
                development: evaluation.development_rating
              } : {
                productivity: 0,
                quality: 0,
                teamwork: 0,
                creativity: 0,
                commitment: 0,
                development: 0
              },
              evaluationId: evaluation?.id,
              existingEvaluation: !!evaluation
            };
          })
        );
        
        setFilteredEmployees(employeesWithRatings);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setErrorMessage('حدث خطأ في جلب بيانات الموظفين');
    }
  };

// جلب تقييم موظف معين
// جلب تقييم موظف معين
const fetchEmployeeEvaluation = async (employeeGuid, month, year) => {
  try {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const url = `${API_BASE_URL}?action=get_evaluations&supervisor_guid=${currentUser.guid}&employee_guid=${employeeGuid}&month=${month}&year=${year}`;
    
    console.log('Fetching evaluation from:', url);
    
    const response = await fetch(url);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Evaluation data:', data);
      
      if (data.length > 0) {
        const evaluation = data[0];
        
        // تحويل البيانات من الحقول المنفصلة إلى object ratings
        return {
          ...evaluation,
          productivity_rating: evaluation.ratings?.productivity || evaluation.productivity_rating,
          quality_rating: evaluation.ratings?.quality || evaluation.quality_rating,
          teamwork_rating: evaluation.ratings?.teamwork || evaluation.teamwork_rating,
          creativity_rating: evaluation.ratings?.creativity || evaluation.creativity_rating,
          commitment_rating: evaluation.ratings?.commitment || evaluation.commitment_rating,
          development_rating: evaluation.ratings?.development || evaluation.development_rating
        };
      }
      return null;
    } else {
      console.error('Failed to fetch evaluation:', response.status);
      return null;
    }
  } catch (error) {
    console.error('Error fetching evaluation:', error);
    return null;
  }
};

// التحقق من التقييمات الموجودة
const checkExistingEvaluations = async () => {
  try {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const url = `${API_BASE_URL}?action=get_evaluations&supervisor_guid=${currentUser.guid}&month=${selectedMonth}&year=${selectedYear}`;
    
    console.log('Checking existing evaluations:', url);
    
    const response = await fetch(url);
    
    if (response.ok) {
      const evaluations = await response.json();
      console.log('Existing evaluations:', evaluations);
      const evaluationMap = {};
      evaluations.forEach(evaluation => {
        evaluationMap[evaluation.employee_guid] = true;
      });
      setExistingEvaluations(evaluationMap);
    }
  } catch (error) {
    console.error('Error checking existing evaluations:', error);
  }
};

  // جلب موظفي الشهور الماضية
  const fetchPastWinners = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await fetch(
        `${API_BASE_URL}?action=get_employees_of_month&supervisor_guid=${currentUser.guid}`
      );
      
      if (response.ok) {
        const winners = await response.json();
        setPastWinners(winners);
      } else {
        // بيانات تجريبية في حالة فشل الـ API
        setPastWinners([
          {
            id: 1,
            employee_name: 'أحمد محمد',
            department: 'المبيعات',
            selected_month: 'ديسمبر 2023',
            reason: 'تميز في تحقيق أعلى مبيعات للشهر',
            achievements: ['+150% زيادة في المبيعات', '15 عميل جديد']
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching past winners:', error);
    }
  };

  const fetchUserImage = async (userGuid) => {
    try {
      const timestamp = new Date().getTime();
      const response = await fetch(`${IMAGE_API_BASE_URL}?action=get&userGuid=${userGuid}&t=${timestamp}`);
      
      if (response.ok) {
        const blob = await response.blob();
        if (blob.size > 0) {
          return URL.createObjectURL(blob);
        }
      }
      return null;
    } catch (error) {
      console.error('Error fetching user image:', error);
      return null;
    }
  };

  const calculateTotalScore = (employee) => {
    let totalScore = 0;
    Object.keys(evaluationCriteria).forEach(criteria => {
      const rating = employee.ratings?.[criteria] || 0;
      const weight = evaluationCriteria[criteria].weight;
      totalScore += (rating * weight) / 5;
    });
    return Math.round(totalScore);
  };

  const getPerformanceGrade = (score) => {
    if (score >= 90) return { grade: 'A', color: '#22c55e', label: 'ممتاز' };
    if (score >= 80) return { grade: 'B', color: '#3b82f6', label: 'جيد جداً' };
    if (score >= 70) return { grade: 'C', color: '#f59e0b', label: 'جيد' };
    if (score >= 60) return { grade: 'D', color: '#ef4444', label: 'مقبول' };
    return { grade: 'F', color: '#dc2626', label: 'ضعيف' };
  };

  const handleRateEmployee = (employee) => {
    setSelectedEmployee(employee);
    setCurrentRatings({...employee.ratings});
    setOpenRatingDialog(true);
  };

  const handleAssignEmployee = (employee) => {
    setSelectedEmployee(employee);
    setOpenAssignDialog(true);
  };

  const handleRatingChange = (criteria, value) => {
    setCurrentRatings(prev => ({
      ...prev,
      [criteria]: value
    }));
  };

  // حفظ التقييم في الـ API
// حفظ التقييم في الـ API
const handleSaveRating = async () => {
  if (!selectedEmployee) return;

  setLoading(true);
  try {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const totalScore = calculateTotalScore({ ratings: currentRatings });
    const performanceGrade = getPerformanceGrade(totalScore);

    const evaluationData = {
      supervisor_guid: currentUser.guid,
      employee_guid: selectedEmployee.guid,
      evaluation_month: selectedMonth,
      evaluation_year: selectedYear,
      ratings: currentRatings,
      total_score: totalScore,
      final_grade: performanceGrade.grade
    };

    // استخدام query parameters بدل endpoints منفصلة
    const action = selectedEmployee.evaluationId ? 'update_evaluation' : 'save_evaluation';
    const url = `${API_BASE_URL}?action=${action}`;

    const requestData = selectedEmployee.evaluationId 
      ? { ...evaluationData, evaluation_id: selectedEmployee.evaluationId }
      : evaluationData;

    console.log('Sending request to:', url);
    console.log('Request data:', requestData);

    const response = await fetch(url, {
      method: 'POST', // دائماً POST لأن الـ PHP بيقرأ من الـ action parameter
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });

    console.log('Response status:', response.status);

    if (response.ok) {
      const result = await response.json();
      console.log('API Response:', result);
      
      // تحديث الـ state المحلي
      const updatedEmployees = filteredEmployees.map(emp => 
        emp.guid === selectedEmployee.guid 
          ? { 
              ...emp, 
              ratings: { ...currentRatings },
              evaluationId: result.evaluation_id || selectedEmployee.evaluationId,
              existingEvaluation: true
            }
          : emp
      );
      
      setFilteredEmployees(updatedEmployees);
      setOpenRatingDialog(false);
      setSuccessMessage(`تم ${selectedEmployee.evaluationId ? 'تحديث' : 'حفظ'} تقييم ${selectedEmployee.fullName} بنجاح!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // تحديث التقييمات الموجودة
      checkExistingEvaluations();
    } else {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`فشل في حفظ التقييم: ${response.status}`);
    }
  } catch (error) {
    console.error('Error saving rating:', error);
    setErrorMessage(`حدث خطأ في حفظ التقييم: ${error.message}`);
    setTimeout(() => setErrorMessage(''), 5000);
  } finally {
    setLoading(false);
  }
};

  // تعيين موظف الشهر
  const handleSubmitAssignment = async () => {
    if (!selectedEmployee) return;

    setLoading(true);
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const totalScore = calculateTotalScore(selectedEmployee);
      const performanceGrade = getPerformanceGrade(totalScore);

      const assignmentData = {
        employee_guid: selectedEmployee.guid,
        employee_name: selectedEmployee.fullName,
        supervisor_guid: currentUser.guid,
        supervisor_name: currentUser.userName || 'مشرف',
        selected_month: selectedMonth,
        selected_year: selectedYear,
        reason: reason,
        total_score: totalScore,
        final_grade: performanceGrade.grade,
        achievements: [
          `تقييم ${performanceGrade.grade} - ${performanceGrade.label}`,
          `نتيجة التقييم: ${totalScore}%`
        ]
      };

      const response = await fetch(`${API_BASE_URL}?action=assign_employee_of_month`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assignmentData)
      });

      if (response.ok) {
        const result = await response.json();
        
        setSuccessMessage(`تم تعيين ${selectedEmployee.fullName} كموظف الشهر بنجاح!`);
        setOpenAssignDialog(false);
        setReason('');
        setSelectedEmployee(null);
        
        setTimeout(() => {
          setSuccessMessage('');
          fetchPastWinners(); // تحديث قائمة الفائزين
        }, 3000);
      } else {
        throw new Error('فشل في تعيين موظف الشهر');
      }
    } catch (error) {
      console.error('Error submitting assignment:', error);
      setErrorMessage('حدث خطأ في تعيين موظف الشهر');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Pagination
  const indexOfLastEmployee = currentPage * employeesPerPage;
  const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage;
  const currentEmployees = filteredEmployees.slice(indexOfFirstEmployee, indexOfLastEmployee);
  const totalPages = Math.ceil(filteredEmployees.length / employeesPerPage);

  const EmployeeGrid = () => {
    const [imageUrls, setImageUrls] = useState({});

    useEffect(() => {
      const loadImages = async () => {
        const urls = {};
        for (const employee of currentEmployees) {
          urls[employee.guid] = await fetchUserImage(employee.guid);
        }
        setImageUrls(urls);
      };
      loadImages();
    }, [currentEmployees]);

    return (
      <Box>
        {/* فلترة الشهر والسنة */}
        <Card sx={{ mb: 3, p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <FormControl sx={uiLayout.formFieldSx} fullWidth size="small">
                <InputLabel>الشهر</InputLabel>
                <Select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  label="الشهر"
                >
                  {months.map((month, index) => (
                    <MenuItem key={index} value={index + 1}>
                      {month}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl sx={uiLayout.formFieldSx} fullWidth size="small">
                <InputLabel>السنة</InputLabel>
                <Select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  label="السنة"
                >
                  {years.map(year => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Card>

        {successMessage && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
            {successMessage}
          </Alert>
        )}

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {errorMessage}
          </Alert>
        )}

        <Grid container spacing={3}>
          {currentEmployees.map((employee) => {
            const totalScore = calculateTotalScore(employee);
            const performanceGrade = getPerformanceGrade(totalScore);
            const imageUrl = imageUrls[employee.guid];
            const hasEvaluation = employee.existingEvaluation;

            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={employee.guid}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card 
                    sx={{ 
                      borderRadius: 3,
                      background: 'white',
                      border: `2px solid ${performanceGrade.color}20`,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: `0 8px 25px ${performanceGrade.color}30`,
                        border: `2px solid ${performanceGrade.color}`
                      }
                    }}
                  >
                    <CardContent sx={{ p: 2 }}>
                      {/* Header */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar
                          sx={{
                            width: 60,
                            height: 60,
                            backgroundColor: imageUrl ? 'transparent' : COLOR_SCHEME.primary,
                            marginInlineEnd: 2,
                            border: `2px solid ${performanceGrade.color}`
                          }}
                          src={imageUrl}
                          alt={employee.fullName}
                        >
                          {!imageUrl && employee.fullName?.charAt(0)}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', color: COLOR_SCHEME.primaryDark, fontSize: '0.9rem' }}>
                            {employee.fullName}
                          </Typography>
                          <Typography variant="body2" sx={{ color: COLOR_SCHEME.text, fontSize: '0.8rem' }}>
                            {employee.userName}
                          </Typography>
                          {hasEvaluation && (
                            <Chip
                              label="تم التقييم"
                              size="small"
                              color="success"
                              sx={{ fontSize: "0.75rem", height: 20, mt: 0.5 }}
                            />
                          )}
                        </Box>
                      </Box>

                      {/* Performance Grade */}
                      <Box sx={{ textAlign: 'center', mb: 2 }}>
                        <Chip
                          label={`${performanceGrade.grade} - ${performanceGrade.label}`}
                          sx={{
                            backgroundColor: performanceGrade.color,
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '0.8rem'
                          }}
                        />
                        <Typography variant="body2" sx={{ color: COLOR_SCHEME.primary, fontWeight: 'bold', mt: 0.5 }}>
                          النتيجة: {totalScore}%
                        </Typography>
                      </Box>

                      {/* Ratings Grid */}
                      <Grid container spacing={1} sx={{ mb: 2 }}>
                        {Object.keys(evaluationCriteria).map((criteria) => (
                          <Grid item xs={6} key={criteria}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="caption" sx={{ color: COLOR_SCHEME.text, fontSize: "0.75rem" }}>
                                {evaluationCriteria[criteria].name}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    sx={{
                                      fontSize: '0.8rem',
                                      color: star <= employee.ratings[criteria] ? COLOR_SCHEME.gold : '#ddd'
                                    }}
                                  />
                                ))}
                              </Box>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>

                      {/* Action Buttons */}
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<Grade />}
                            onClick={() => handleRateEmployee(employee)}
                            disabled={loading}
                            sx={uiLayout.withUiSx({
                              borderColor: COLOR_SCHEME.primary,
                              color: COLOR_SCHEME.primary,
                              fontWeight: 'bold',
                              fontSize: "0.75rem",
                              py: 0.8
                            }, uiLayout.buttonSx)}
                          >
                            {employee.existingEvaluation ? 'تعديل' : 'تقييم'}
                          </Button>
                        </Grid>
                        <Grid item xs={6}>
                          <Button
                            fullWidth
                            variant="contained"
                            startIcon={<EmojiEvents />}
                            onClick={() => handleAssignEmployee(employee)}
                            disabled={loading || totalScore === 0}
                            sx={uiLayout.withUiSx({
                              background: `linear-gradient(135deg, ${COLOR_SCHEME.primary} 0%, ${COLOR_SCHEME.primaryDark} 100%)`,
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: "0.75rem",
                              py: 0.8
                            }, uiLayout.buttonSx)}
                          >
                            تعيين
                          </Button>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            );
          })}
        </Grid>

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={(event, value) => setCurrentPage(value)}
              color="primary"
              size="large"
            />
          </Box>
        )}
      </Box>
    );
  };

  const PastWinnersTab = () => (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ color: COLOR_SCHEME.primaryDark, fontWeight: 'bold', mb: 3 }}>
        🏆 أبطال الشهور الماضية
      </Typography>

      {pastWinners.length === 0 ? (
        <Alert severity="info">
          لا توجد بيانات لموظفي الشهور الماضية
        </Alert>
      ) : (
        <TableContainer component={Paper} sx={uiLayout.withUiSx({ borderRadius: 3 }, uiLayout.tableContainerSx)}>
          <Table>
            <TableHead sx={{ backgroundColor: COLOR_SCHEME.primary }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>الموظف</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>القسم</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>الشهر</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>سبب التميز</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>التقييم</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pastWinners.map((winner) => (
                <TableRow key={winner.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ backgroundColor: COLOR_SCHEME.primary, width: 40, height: 40 }}>
                        {winner.employee_name?.charAt(0)}
                      </Avatar>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {winner.employee_name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{winner.department}</TableCell>
                  <TableCell>
                    <Chip 
                      label={`${months[winner.selected_month - 1]} ${winner.selected_year}`}
                      sx={{ 
                        backgroundColor: COLOR_SCHEME.gold, 
                        color: 'white',
                        fontWeight: 'bold'
                      }} 
                    />
                  </TableCell>
                  <TableCell>{winner.reason}</TableCell>
                  <TableCell>
                    <Chip
                      label={`${winner.final_grade} - ${winner.total_score}%`}
                      sx={{
                        backgroundColor: getPerformanceGrade(winner.total_score).color,
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );

  return (
    <Box sx={{ p: 2, background: COLOR_SCHEME.background, minHeight: '100vh' }}>
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h4" gutterBottom sx={{ color: COLOR_SCHEME.primaryDark, fontWeight: 'bold', textAlign: 'center' }}>
            🏆 موظف الشهر
          </Typography>
          
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            centered
            sx={{
              '& .MuiTab-root': {
                fontWeight: 'bold',
                fontSize: '1rem',
                minHeight: 60,
              },
              '& .Mui-selected': {
                color: COLOR_SCHEME.primary,
              }
            }}
          >
            <Tab 
              icon={<Person />}
              label="تقييم الموظفين" 
            />
            <Tab 
              icon={<History />}
              label="موظف الشهر" 
            />
          </Tabs>
        </CardContent>
      </Card>

      {activeTab === 0 && <EmployeeGrid />}
      {activeTab === 1 && <PastWinnersTab />}

      {/* Dialog لتقييم الموظف */}
      <Dialog sx={uiLayout.dialogLayoutSx} open={openRatingDialog} onClose={() => setOpenRatingDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ 
          background: `linear-gradient(135deg, ${COLOR_SCHEME.primary} 0%, ${COLOR_SCHEME.primaryDark} 100%)`,
          color: 'white',
          textAlign: 'center'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <Grade />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {selectedEmployee?.existingEvaluation ? 'تعديل تقييم الموظف' : 'تقييم الموظف'}
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          {selectedEmployee && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    backgroundColor: COLOR_SCHEME.primary,
                    fontSize: '1.5rem',
                    fontWeight: 'bold'
                  }}
                >
                  {selectedEmployee.fullName?.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ color: COLOR_SCHEME.primaryDark, fontWeight: 'bold' }}>
                    {selectedEmployee.fullName}
                  </Typography>
                  <Typography variant="body2" sx={{ color: COLOR_SCHEME.text }}>
                    {selectedEmployee.userName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: COLOR_SCHEME.primary, display: 'block', mt: 1 }}>
                    {months[selectedMonth - 1]} {selectedYear}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* تقييمات الموظف */}
              <Typography variant="h6" sx={{ color: COLOR_SCHEME.primaryDark, mb: 2 }}>
                معايير التقييم:
              </Typography>
              <Grid container spacing={2}>
                {Object.keys(evaluationCriteria).map((criteria) => (
                  <Grid item xs={12} key={criteria}>
                    <Paper sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body1" sx={{ color: COLOR_SCHEME.text, fontWeight: 'bold' }}>
                          {evaluationCriteria[criteria].name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: COLOR_SCHEME.primary }}>
                          {evaluationCriteria[criteria].weight}%
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <IconButton
                            key={star}
                            onClick={() => handleRatingChange(criteria, star)}
                            disabled={loading}
                            sx={{ 
                              color: star <= currentRatings[criteria] ? COLOR_SCHEME.gold : '#ddd',
                              '&:hover': { color: COLOR_SCHEME.gold }
                            }}
                          >
                            <Star />
                          </IconButton>
                        ))}
                      </Box>
                      <Typography variant="caption" sx={{ color: COLOR_SCHEME.text, textAlign: 'center', display: 'block', mt: 1 }}>
                        {currentRatings[criteria] || 0} / 5
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              {/* النتيجة المتوقعة */}
              <Box sx={{ mt: 3, p: 2, backgroundColor: COLOR_SCHEME.background, borderRadius: 2 }}>
                <Typography variant="h6" sx={{ color: COLOR_SCHEME.primaryDark, textAlign: 'center' }}>
                  النتيجة المتوقعة: {calculateTotalScore({ ratings: currentRatings })}%
                </Typography>
                <Typography variant="body1" sx={{ color: getPerformanceGrade(calculateTotalScore({ ratings: currentRatings })).color, textAlign: 'center', fontWeight: 'bold' }}>
                  التقدير: {getPerformanceGrade(calculateTotalScore({ ratings: currentRatings })).grade} - {getPerformanceGrade(calculateTotalScore({ ratings: currentRatings })).label}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={uiLayout.withUiSx({ p: 3, gap: 1 }, uiLayout.dialogActionsSx)}>
          <Button 
            onClick={() => setOpenRatingDialog(false)}
            variant="outlined"
            disabled={loading}
            sx={uiLayout.withUiSx({ 
              borderColor: COLOR_SCHEME.primary,
              color: COLOR_SCHEME.primary
            }, uiLayout.buttonSx)}
          >
            إلغاء
          </Button>
          <Button 
            onClick={handleSaveRating}
            variant="contained"
            disabled={loading}
            sx={uiLayout.withUiSx({ 
              background: `linear-gradient(135deg, ${COLOR_SCHEME.primary} 0%, ${COLOR_SCHEME.primaryDark} 100%)`,
              color: 'white',
              fontWeight: 'bold',
              px: 4
            }, uiLayout.buttonSx)}
          >
            {loading ? <CircularProgress size={24} /> : (selectedEmployee?.existingEvaluation ? 'تحديث التقييم' : 'حفظ التقييم')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog لتعيين موظف الشهر */}
      <Dialog sx={uiLayout.dialogLayoutSx} open={openAssignDialog} onClose={() => setOpenAssignDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ 
          background: `linear-gradient(135deg, ${COLOR_SCHEME.primary} 0%, ${COLOR_SCHEME.primaryDark} 100%)`,
          color: 'white',
          textAlign: 'center'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <EmojiEvents />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              تعيين موظف الشهر
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          {selectedEmployee && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    backgroundColor: COLOR_SCHEME.primary,
                    fontSize: '1.5rem',
                    fontWeight: 'bold'
                  }}
                >
                  {selectedEmployee.fullName?.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ color: COLOR_SCHEME.primaryDark, fontWeight: 'bold' }}>
                    {selectedEmployee.fullName}
                  </Typography>
                  <Typography variant="body2" sx={{ color: COLOR_SCHEME.text }}>
                    {selectedEmployee.userName}
                  </Typography>
                  <Chip
                    label={`التقييم: ${getPerformanceGrade(calculateTotalScore(selectedEmployee)).grade}`}
                    sx={{
                      backgroundColor: getPerformanceGrade(calculateTotalScore(selectedEmployee)).color,
                      color: 'white',
                      fontWeight: 'bold',
                      mt: 1
                    }}
                  />
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* تقييمات الموظف */}
              <Typography variant="h6" sx={{ color: COLOR_SCHEME.primaryDark, mb: 2 }}>
                التقييم التفصيلي:
              </Typography>
              <Grid container spacing={2}>
                {Object.keys(evaluationCriteria).map((criteria) => (
                  <Grid item xs={6} md={4} key={criteria}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="body2" sx={{ color: COLOR_SCHEME.text, fontWeight: 'bold', mb: 1 }}>
                        {evaluationCriteria[criteria].name}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            sx={{
                              color: star <= selectedEmployee.ratings[criteria] ? COLOR_SCHEME.gold : '#ddd'
                            }}
                          />
                        ))}
                      </Box>
                      <Typography variant="caption" sx={{ color: COLOR_SCHEME.primary }}>
                        {evaluationCriteria[criteria].weight}%
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid sm={6} item xs={12}>
              <FormControl sx={uiLayout.formFieldSx} fullWidth>
                <InputLabel>الشهر</InputLabel>
                <Select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  label="الشهر"
                >
                  {months.map((month, index) => (
                    <MenuItem key={index} value={index + 1}>
                      {month}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid sm={6} item xs={12}>
              <FormControl sx={uiLayout.formFieldSx} fullWidth>
                <InputLabel>السنة</InputLabel>
                <Select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  label="السنة"
                >
                  {years.map(year => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
            fullWidth
            multiline
            rows={4}
            label="سبب التعيين"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="اكتب هنا سبب تعيين هذا الموظف كموظف الشهر... يمكنك ذكر إنجازاته وتميزه خلال الشهر"
          />
        </DialogContent>
        
        <DialogActions sx={uiLayout.withUiSx({ p: 3, gap: 1 }, uiLayout.dialogActionsSx)}>
          <Button 
            onClick={() => setOpenAssignDialog(false)}
            variant="outlined"
            disabled={loading}
            sx={uiLayout.withUiSx({ 
              borderColor: COLOR_SCHEME.primary,
              color: COLOR_SCHEME.primary
            }, uiLayout.buttonSx)}
          >
            إلغاء
          </Button>
          <Button 
            onClick={handleSubmitAssignment}
            variant="contained"
            disabled={!reason.trim() || loading}
            sx={uiLayout.withUiSx({ 
              background: `linear-gradient(135deg, ${COLOR_SCHEME.gold} 0%, ${COLOR_SCHEME.primary} 100%)`,
              color: 'white',
              fontWeight: 'bold',
              px: 4
            }, uiLayout.buttonSx)}
          >
            {loading ? <CircularProgress size={24} /> : 'تأكيد التعيين'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeOfTheMonthTab;