import deepmerge from '@mui/utils/deepmerge';
import { rtlComponents } from '../config/rtlComponents';
import { navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Snackbar,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Alert,
  Button,
  CircularProgress,
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab
} from "@mui/material";
import { 
  Error, 
  CheckCircle
} from "@mui/icons-material";
import ProfessionalCard from "../components/common/ProfessionalCard";
import StudentSearchForm from "../components/attendance/StudentSearchForm";
import StudentInfoCard from "../components/attendance/StudentInfoCard";
import AttendanceDialog from "../components/attendance/AttendanceDialog";


const theme = createTheme(deepmerge({ direction: "rtl", components: rtlComponents }, {
  direction: 'rtl',
  palette: {
    primary: {
      main: '#80b49e', // تطبيق اللون المطلوب
    },
  },
  typography: {
    fontFamily: '"Cairo", sans-serif',
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    body1: {
      fontSize: '1.1rem',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          fontFamily: '"Cairo", sans-serif',
          fontWeight: 600,
          textTransform: 'none',
          letterSpacing: '0.5px',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          fontFamily: '"Cairo", sans-serif',
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          fontFamily: '"Cairo", sans-serif',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontFamily: '"Cairo", sans-serif',
          '&.Mui-selected': {
            color: '#80b49e', // تطبيق اللون على التب المحدد
          },
        },
      },
    },
  },
}));

const AttendancePage = () => {
  const [studentId, setStudentId] = useState("");
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [attendanceData, setAttendanceData] = useState({
    level: "",
    diploma: "",
    course: "",
    confirmed: false
  });
  const [selectedTab, setSelectedTab] = useState(3); // جعل الحضور هو الافتراضي
  const navigate = useNavigate();

  const levels = ["المستوى الأول", "المستوى الثاني", "المستوى الثالث", "المستوى الرابع"];
  const diplomas = ["دبلوم الحاسب الآلي", "دبلوم الشبكات", "دبلوم البرمجة"];
  const courses = ["أساسيات الحاسب", "شبكات الحاسب", "برمجة الويب"];

  const handleTabChange = (event, newValue) => {
    setTimeout(() => {
      switch(newValue) {
        case 0:
          navigate('/periodic-reports'); // الصفحة الجديدة
          break;
        case 1:
          navigate('/monthly');
          break;
        case 2:
          navigate('/daily');
          break;
        case 3:
          navigate('/attendance');
          break;
        default:
          break;
      }
    }, 100);
  };

  const handleAttendance = async () => {
    if (!studentId) {
      setError("يرجى إدخال رقم الهوية");
      setSnackbarOpen(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`https://api1.sstli.com/api/student/${studentId}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error("لم يتم العثور على الطالب");
      }

      const data = await response.json();
      setStudentData(data);
      setSuccess(true);
    } catch (error) {
      setError("لم يتم العثور على الطالب");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleReset = () => {
    setStudentData(null);
    setStudentId("");
    setSuccess(false);
  };

  const handleOpenAttendanceDialog = () => {
    setAttendanceDialogOpen(true);
  };

  const handleCloseAttendanceDialog = () => {
    setAttendanceDialogOpen(false);
  };

  const handleAttendanceSubmit = async () => {
    if (!studentData || !studentData.studentName || !studentData.nationalId || !attendanceData.level || !attendanceData.diploma) {
      setError("يرجى ملء جميع الحقول المطلوبة");
      setSnackbarOpen(true);
      return;
    }

    setSubmitting(true);
    setError(null);

    const currentUser = JSON.parse(localStorage.getItem("user"));
    const payload = {
      name: studentData.studentName,
      national_id: studentData.nationalId,
      level_id: attendanceData.level,
      diploma_id: attendanceData.diploma,
      course: attendanceData.course,
      attendance_date: new Date().toISOString().split("T")[0],
      attendance_time: new Date().toTimeString().split(" ")[0],
      created_by: currentUser.guid,
    };

    try {
      const response = await fetch("https://filesregsiteration.sstli.com/PostAttendent.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "فشل في تسجيل الحضور");
      }

      if (data.success) {
        setSuccess(true);
        setSnackbarOpen(true);
        setAttendanceDialogOpen(false);
        setAttendanceData({
          level: "",
          diploma: "",
          course: "",
          confirmed: false
        });
      } else {
        throw new Error(data.message || "فشل في تسجيل الحضور");
      }
    } catch (err) {
      setError(err.message);
      setSnackbarOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAttendanceChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAttendanceData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <NavigationShell variant="standard" ><ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        {/* السايدبار */}
        
        
        {/* المحتوى الرئيسي */}
        <Box 
          component="main" 
          sx={{
            flexGrow: 1,
            p: 3,
            minHeight: "100vh",
            backgroundColor: "#f5f7fa",
            direction: 'rtl',
            ...navigationContentSx
          }}
        >
          {/* النافبار - تم تعديل المحاذاة لتبدأ من اليسار */}
          <AppBar 
            position="static" 
            sx={{ 
              backgroundColor: 'white',
              color: '#80b49e', // تطبيق اللون على النص
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              width: '100%',
              left: 0,
              right: 'auto'
            }}
          >
            <Toolbar sx={{ justifyContent: 'space-between', paddingLeft: '16px' }}>
              <Tabs 
                value={selectedTab} 
                onChange={handleTabChange}
                textColor="inherit"
                sx={{
                  '& .MuiTab-root': {
                    color: '#80b49e', // تطبيق اللون على التبويبات
                    '&.Mui-selected': {
                      color: '#80b49e', // اللون عند التحديد
                      fontWeight: 'bold'
                    },
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#80b49e', // تطبيق اللون على المؤشر
                  }
                }}
              >
                <Tab label="التقارير الدورية" />
                <Tab label="التقرير الشهري" />
                <Tab label="التقرير اليومي" />
                <Tab label="الحضور" />
              </Tabs>
              
              <Typography variant="h6" component="div" sx={{ color: '#80b49e' }}>
                نظام إدارة الحضور
              </Typography>
            </Toolbar>
          </AppBar>

          {/* محتوى الصفحة */}
          <Box
            sx={{
              textAlign: "right",
              margin: "0 auto",
              padding: { xs: "20px", md: "40px" },
              backgroundColor: "#f5f7fa",
              minHeight: "calc(100vh - 120px)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              fontFamily: '"Cairo", sans-serif',
            }}
          >
            <ProfessionalCard>
              {!studentData ? (
                <StudentSearchForm
                  studentId={studentId}
                  setStudentId={setStudentId}
                  loading={loading}
                  handleAttendance={handleAttendance}
                />
              ) : (
                <StudentInfoCard
                  studentData={studentData}
                  handleOpenAttendanceDialog={handleOpenAttendanceDialog}
                  handleReset={handleReset}
                />
              )}
            </ProfessionalCard>

            <AttendanceDialog
              open={attendanceDialogOpen}
              onClose={handleCloseAttendanceDialog}
              studentData={studentData}
              attendanceData={attendanceData}
              handleAttendanceChange={handleAttendanceChange}
              handleAttendanceSubmit={handleAttendanceSubmit}
              levels={levels}
              diplomas={diplomas}
              courses={courses}
              submitting={submitting}
            />

            <Snackbar
              open={snackbarOpen}
              autoHideDuration={6000}
              onClose={handleCloseSnackbar}
              anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
              <Alert
                onClose={handleCloseSnackbar}
                severity={error ? "error" : "success"}
                icon={error ? <Error /> : <CheckCircle />}
                sx={{
                  width: "100%",
                  fontFamily: '"Cairo", sans-serif',
                  fontSize: "1rem",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
                  '& .MuiAlert-icon': {
                    color: error ? undefined : '#80b49e' // تطبيق اللون على أيقونة النجاح
                  }
                }}
              >
                {error
                  ? error.includes("Failed to fetch")
                    ? "فشل الاتصال بالسيرفر"
                    : error.includes("not found")
                      ? "البيانات غير موجودة"
                      : "تأكد من ملئ جميع البيانات"
                  : "تم تسجيل حضور الطالب بنجاح"}
              </Alert>
            </Snackbar>
          </Box>
        </Box>
      </Box>
    </ThemeProvider></NavigationShell>
  );
};

export default AttendancePage;