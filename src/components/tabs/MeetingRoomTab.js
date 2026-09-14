import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Avatar,
  AvatarGroup,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery,
  Paper,
  Checkbox,
  OutlinedInput,
  FormHelperText,
  InputAdornment,
  CircularProgress,
  Snackbar,
  Alert
} from "@mui/material";
import {
  Add,
  VideoCameraFront,
  Schedule,
  Groups,
  AccessTime,
  CalendarToday,
  Person,
  Edit,
  Delete,
  CheckCircle,
  MeetingRoom as MeetingRoomIcon,
  Link as LinkIcon,
  Launch,
  Business as DepartmentIcon,
  Work as WorkIcon,
  Search as SearchIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { alpha } from "@mui/material/styles";

const COLOR_SCHEME = {
  primary: "#80b49e",
  primaryLight: "#94c4ac",
  primaryDark: "#5a8f7a",
  secondary: "#ff6b6b",
  accent: "#4ecdc4",
  background: "#f8fbfa",
  text: "#2c3e50",
  success: "#22c55e",
  warning: "#f59e42",
  error: "#ef4444",
  info: "#3b82f6",
};

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

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userFullName = user.fullName || user.userName || 'مستخدم';
  const userGuid = user.guid;

  // صلاحيات إضافة المنشورات
  const userJob = user.userJop; // موجودة في الـ localStorage زي ما قلت
  const ALLOWED_POST_ROLES = [0, 1, 2, 3, 9];
  const canCreatePost = ALLOWED_POST_ROLES.includes(Number(userJob));
  
// Base URL للباكيند
const API_BASE_URL = "https://filesregsiteration.sstli.com/erp";

const MeetingRoomTab = () => {
  const [meetings, setMeetings] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [joinMeetingDialog, setJoinMeetingDialog] = useState(false);
  const [currentMeeting, setCurrentMeeting] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedDept, setSelectedDept] = useState([]);
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [currentUser, setCurrentUser] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    participants: [],
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));

  // جلب بيانات المستخدم من localStorage
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setCurrentUser(user);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  // جلب البيانات من الـ APIs
  useEffect(() => {
    if (currentUser) {
      fetchDepartments();
      fetchUsers();
      fetchMeetings();
    }
  }, [currentUser]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await fetch("https://api3.sstli.com/api/Department/Load");
      const data = await response.json();
      const filteredDepartments = data.filter(
        dept => dept.guid !== "de110cb9-b040-4af0-b303-4e57da831ba0"
      );
      setDepartments(filteredDepartments);
    } catch (error) {
      console.error("Error fetching departments:", error);
      showSnackbar("خطأ في جلب بيانات الأقسام", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("https://api1.sstli.com/api/userinfo");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
      showSnackbar("خطأ في جلب بيانات المستخدمين", "error");
    }
  };

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/meetings_api.php?user_guid=${currentUser.guid}`);
      if (response.ok) {
        const data = await response.json();
        setMeetings(data);
      } else {
        throw new Error("Failed to fetch meetings");
      }
    } catch (error) {
      console.error("Error fetching meetings:", error);
      showSnackbar("خطأ في جلب بيانات الاجتماعات", "error");
    } finally {
      setLoading(false);
    }
  };

  const createMeeting = async (meetingData) => {
    try {
      setSubmitting(true);
      const response = await fetch(`${API_BASE_URL}/meetings_api.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(meetingData)
      });

      const result = await response.json();

      if (response.ok) {
        showSnackbar("تم إنشاء الاجتماع بنجاح", "success");
        fetchMeetings(); // Refresh the meetings list
        return result;
      } else {
        throw new Error(result.message || "Failed to create meeting");
      }
    } catch (error) {
      console.error("Error creating meeting:", error);
      showSnackbar(error.message, "error");
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const updateMeeting = async (meetingId, meetingData) => {
    try {
      setSubmitting(true);
      const response = await fetch(`${API_BASE_URL}/meetings_api.php?meeting_id=${meetingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(meetingData)
      });

      const result = await response.json();

      if (response.ok) {
        showSnackbar("تم تحديث الاجتماع بنجاح", "success");
        fetchMeetings(); // Refresh the meetings list
        return result;
      } else {
        throw new Error(result.message || "Failed to update meeting");
      }
    } catch (error) {
      console.error("Error updating meeting:", error);
      showSnackbar(error.message, "error");
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const deleteMeeting = async (meetingId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/meetings_api.php?meeting_id=${meetingId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (response.ok) {
        showSnackbar("تم حذف الاجتماع بنجاح", "success");
        fetchMeetings(); // Refresh the meetings list
      } else {
        throw new Error(result.message || "Failed to delete meeting");
      }
    } catch (error) {
      console.error("Error deleting meeting:", error);
      showSnackbar(error.message, "error");
    }
  };

  // فلترة المستخدمين بناءً على الأقسام والوظائف والبحث
  const filteredUsers = React.useMemo(() => {
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

  // الوظائف المتاحة بناءً على الأقسام المختارة
  const filteredJobs = React.useMemo(() => {
    if (!Array.isArray(users) || users.length === 0) return [];
    if (!Array.isArray(selectedDept) || selectedDept.length === 0) return [];
    
    const deptUsers = users.filter(u => selectedDept.includes(u.departGuid));
    const uniqueJobs = [...new Set(deptUsers.map(u => u.userJop))];
    
    return uniqueJobs
      .filter(j => typeof j === 'number' && j >= 0 && j < jobTitles.length)
      .sort((a, b) => a - b);
  }, [users, selectedDept]);

  const handleOpenDialog = (meeting = null) => {
    if (meeting) {
      setSelectedMeeting(meeting);
      setFormData({
        title: meeting.title,
        description: meeting.description || "",
        date: meeting.date,
        time: meeting.time,
        participants: meeting.participants,
      });
      const userGuids = meeting.participants.map(p => p.id);
      setSelectedUsers(userGuids);
    } else {
      setSelectedMeeting(null);
      setFormData({
        title: "",
        description: "",
        date: "",
        time: "",
        participants: [],
      });
      setSelectedUsers([]);
      setSelectedDept([]);
      setSelectedJobs([]);
      setSearchTerm("");
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedMeeting(null);
    setSelectedUsers([]);
    setSelectedDept([]);
    setSelectedJobs([]);
    setSearchTerm("");
  };

const handleJoinMeeting = (meeting) => {
  setCurrentMeeting(meeting);
  setJoinMeetingDialog(true);
};

const handleStartMeeting = () => {
  if (currentMeeting) {
    // خلي البيانات الأساسية للمستخدم
    const userData = {
      guid: currentUser.guid,
      userName: currentUser.userName,
      fullName: currentUser.fullName,
      userJop: currentUser.userJop,
      departGuid: currentUser.departGuid
    };

    // شفّر البيانات باستخدام base64 مع encodeURIComponent
    const encodedUserData = btoa(encodeURIComponent(JSON.stringify(userData)));
    
    // اباصي البيانات في الـ URL
    const meetingUrl = `https://meetings.sstli.com/meeting/${currentMeeting.meeting_id}?user=${encodedUserData}`;
    
    window.open(meetingUrl, '_blank');
    setJoinMeetingDialog(false);
  }
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      showSnackbar("يجب تسجيل الدخول أولاً", "error");
      return;
    }

    const selectedParticipants = filteredUsers
      .filter(user => selectedUsers.includes(user.guid))
      .map(user => ({
        id: user.guid,
        name: user.fullName,
        avatar: user.fullName?.charAt(0) || 'U'
      }));

    const meetingData = {
      title: formData.title,
      description: formData.description,
      date: formData.date,
      time: formData.time,
      organizer_guid: currentUser.guid,
      organizer_name: currentUser.userName || currentUser.fullName,
      participants: selectedParticipants,
      status: selectedMeeting ? selectedMeeting.status : "جاري"
    };

    try {
      if (selectedMeeting) {
        await updateMeeting(selectedMeeting.meeting_id, meetingData);
      } else {
        await createMeeting(meetingData);
      }
      handleCloseDialog();
    } catch (error) {
      // Error handled in the functions
    }
  };

  const handleDeleteMeeting = async (meetingId) => {
    if (window.confirm("هل أنت متأكد من حذف هذا الاجتماع؟")) {
      await deleteMeeting(meetingId);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "مؤكد": return COLOR_SCHEME.success;
      case "مخطط": return COLOR_SCHEME.info;
      case "جاري": return COLOR_SCHEME.warning;
      case "منتهي": return COLOR_SCHEME.text;
      case "ملغى": return COLOR_SCHEME.error;
      default: return COLOR_SCHEME.primary;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "مؤكد": return <CheckCircle sx={{ fontSize: 16 }} />;
      case "جاري": return <VideoCameraFront sx={{ fontSize: 16 }} />;
      default: return <Schedule sx={{ fontSize: 16 }} />;
    }
  };

  const formatTime = (time) => {
    return time;
  };

  const isMeetingActive = (meeting) => {
    return meeting.status === "جاري" || meeting.status === "مؤكد";
  };

const copyToClipboard = (text) => {
  let meetingLink = text;
  if (text.includes('192.168.50.169:8534')) {
    const meetingId = text.split('/').pop();
    
    // اباصي بيانات المستخدم في الرابط علشان النسخ
    const userData = {
      guid: currentUser.guid,
      userName: currentUser.userName,
      fullName: currentUser.fullName,
      userJop: currentUser.userJop,
      departGuid: currentUser.departGuid
    };
    const encodedUserData = btoa(encodeURIComponent(JSON.stringify(userData)));
    
    meetingLink = `https://meetings.sstli.com/meeting/${meetingId}?user=${encodedUserData}`;
  }
  
  navigator.clipboard.writeText(meetingLink);
  showSnackbar("تم نسخ الرابط", "success");
};

  const handleSelectAllUsers = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.guid));
    }
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (!currentUser) {
    return (
      <Box sx={{ py: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          يرجى تسجيل الدخول للوصول إلى غرفة الاجتماعات
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        py: { xs: 0.8, sm: 1.2, md: 2.2 },
        px: { xs: 0.15, sm: 0.4, md: 0 },
        width: "100%",
        minWidth: 0,
        boxSizing: "border-box",
        "& .MuiTypography-root": { overflowWrap: "anywhere" },
        "& .MuiButton-root": {
          fontSize: { xs: "0.64rem", sm: "0.72rem", md: "0.82rem" },
          minHeight: { xs: 32, sm: 34, md: 38 },
        },
        "& .MuiChip-root": {
          fontSize: { xs: "0.58rem", sm: "0.66rem", md: "0.72rem" },
          height: { xs: 24, sm: 26, md: 28 },
        },
        "& .MuiInputBase-root, & .MuiInputLabel-root": {
          fontSize: { xs: "0.68rem", sm: "0.75rem", md: "0.84rem" },
        },
      }}
    >
      {/* Snackbar for notifications */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* رأس الصفحة */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "stretch", sm: "center" },
          mb: { xs: 1.5, sm: 2, md: 3 },
          flexWrap: "wrap",
          gap: { xs: 0.8, sm: 1.2, md: 2 }
        }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" color={COLOR_SCHEME.text} gutterBottom sx={{ fontSize: { xs: "1rem", sm: "1.2rem", md: "1.55rem" }, mb: { xs: 0.25, md: 0.5 } }}>
              غرفة الاجتماعات الافتراضية
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: "0.66rem", sm: "0.74rem", md: "0.84rem" } }}>
              انضم إلى الاجتماعات أو أنشئ اجتماعات جديدة بضغطة زر
            </Typography>
          </Box>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            {canCreatePost && (
  <Button
    variant="contained"
    startIcon={<VideoCameraFront />}
    onClick={() => handleOpenDialog()}
    sx={{
      bgcolor: COLOR_SCHEME.primary,
      '&:hover': {
        bgcolor: COLOR_SCHEME.primaryDark,
      },
      px: { xs: 1.2, sm: 1.8, md: 2.5 },
      py: { xs: 0.65, sm: 0.8, md: 1 },
      borderRadius: 2,
      fontWeight: 'bold',
      fontSize: { xs: "0.66rem", sm: "0.75rem", md: "0.86rem" },
      width: { xs: "100%", sm: "auto" },
    }}
  >
    اجتماع جديد
  </Button>
)}

          </motion.div>
        </Box>
      </motion.div>

      {/* إحصائيات سريعة */}
      <Grid container spacing={{ xs: 1, sm: 1.5, md: 2.5 }} sx={{ mb: { xs: 1.5, sm: 2, md: 3 } }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: `linear-gradient(135deg, ${alpha(COLOR_SCHEME.primary, 0.1)} 0%, ${alpha(COLOR_SCHEME.primary, 0.05)} 100%)`,
            border: `1px solid ${alpha(COLOR_SCHEME.primary, 0.2)}`,
            borderRadius: 3,
            p: { xs: 0.7, sm: 1, md: 1.5 },
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: `0 8px 25px ${alpha(COLOR_SCHEME.primary, 0.15)}`,
            }
          }}>
            <CardContent sx={{ textAlign: "center", p: { xs: "6px !important", sm: "10px !important", md: "14px !important" } }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                <VideoCameraFront sx={{ color: COLOR_SCHEME.primary, fontSize: { xs: 24, sm: 30, md: 36 } }} />
              </Box>
              <Typography variant="h5" fontWeight="bold" color={COLOR_SCHEME.text} sx={{ fontSize: { xs: "0.95rem", sm: "1.1rem", md: "1.25rem" } }}>
                {meetings.filter(m => m.status === "جاري").length}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.6rem", sm: "0.68rem", md: "0.76rem" } }}>
                اجتماعات نشطة
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: `linear-gradient(135deg, ${alpha(COLOR_SCHEME.info, 0.1)} 0%, ${alpha(COLOR_SCHEME.info, 0.05)} 100%)`,
            border: `1px solid ${alpha(COLOR_SCHEME.info, 0.2)}`,
            borderRadius: 3,
            p: { xs: 0.7, sm: 1, md: 1.5 },
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: `0 8px 25px ${alpha(COLOR_SCHEME.info, 0.15)}`,
            }
          }}>
            <CardContent sx={{ textAlign: "center", p: { xs: "6px !important", sm: "10px !important", md: "14px !important" } }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                <Schedule sx={{ color: COLOR_SCHEME.info, fontSize: { xs: 24, sm: 30, md: 36 } }} />
              </Box>
              <Typography variant="h5" fontWeight="bold" color={COLOR_SCHEME.text} sx={{ fontSize: { xs: "0.95rem", sm: "1.1rem", md: "1.25rem" } }}>
                {meetings.filter(m => m.status === "مخطط").length}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.6rem", sm: "0.68rem", md: "0.76rem" } }}>
                قادمة
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: `linear-gradient(135deg, ${alpha(COLOR_SCHEME.success, 0.1)} 0%, ${alpha(COLOR_SCHEME.success, 0.05)} 100%)`,
            border: `1px solid ${alpha(COLOR_SCHEME.success, 0.2)}`,
            borderRadius: 3,
            p: { xs: 0.7, sm: 1, md: 1.5 },
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: `0 8px 25px ${alpha(COLOR_SCHEME.success, 0.15)}`,
            }
          }}>
            <CardContent sx={{ textAlign: "center", p: { xs: "6px !important", sm: "10px !important", md: "14px !important" } }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                <Groups sx={{ color: COLOR_SCHEME.success, fontSize: { xs: 24, sm: 30, md: 36 } }} />
              </Box>
              <Typography variant="h5" fontWeight="bold" color={COLOR_SCHEME.text} sx={{ fontSize: { xs: "0.95rem", sm: "1.1rem", md: "1.25rem" } }}>
                {meetings.reduce((acc, meeting) => acc + meeting.participants.length, 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.6rem", sm: "0.68rem", md: "0.76rem" } }}>
                مشاركين
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: `linear-gradient(135deg, ${alpha(COLOR_SCHEME.warning, 0.1)} 0%, ${alpha(COLOR_SCHEME.warning, 0.05)} 100%)`,
            border: `1px solid ${alpha(COLOR_SCHEME.warning, 0.2)}`,
            borderRadius: 3,
            p: { xs: 0.7, sm: 1, md: 1.5 },
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: `0 8px 25px ${alpha(COLOR_SCHEME.warning, 0.15)}`,
            }
          }}>
            <CardContent sx={{ textAlign: "center", p: { xs: "6px !important", sm: "10px !important", md: "14px !important" } }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                <MeetingRoomIcon sx={{ color: COLOR_SCHEME.warning, fontSize: { xs: 24, sm: 30, md: 36 } }} />
              </Box>
              <Typography variant="h5" fontWeight="bold" color={COLOR_SCHEME.text} sx={{ fontSize: { xs: "0.95rem", sm: "1.1rem", md: "1.25rem" } }}>
                {meetings.length}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.6rem", sm: "0.68rem", md: "0.76rem" } }}>
                إجمالي الاجتماعات
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* قائمة الاجتماعات */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card sx={{ 
          borderRadius: 3,
          boxShadow: `0 8px 32px ${alpha(COLOR_SCHEME.primary, 0.08)}`,
          border: `1px solid ${alpha(COLOR_SCHEME.primary, 0.1)}`,
          overflow: 'hidden'
        }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ 
              p: 3, 
              bgcolor: alpha(COLOR_SCHEME.primary, 0.05),
              borderBottom: `1px solid ${alpha(COLOR_SCHEME.primary, 0.1)}`
            }}>
              <Typography variant="h6" fontWeight="bold" color={COLOR_SCHEME.text}>
                اجتماعاتي
              </Typography>
            </Box>

            {loading ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <CircularProgress sx={{ color: COLOR_SCHEME.primary }} />
                <Typography variant="body1" sx={{ mt: 2, color: 'text.secondary' }}>
                  جاري تحميل الاجتماعات...
                </Typography>
              </Box>
            ) : meetings.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <VideoCameraFront sx={{ fontSize: 60, color: alpha(COLOR_SCHEME.primary, 0.3), mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  لا توجد اجتماعات مخططة
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  ابدأ بإنشاء اجتماع جديد أو انضم إلى اجتماع موجود
                </Typography>
                {canCreatePost && (
  <Button 
    variant="contained" 
    startIcon={<VideoCameraFront />}
    onClick={() => handleOpenDialog()}
    sx={{ 
      bgcolor: COLOR_SCHEME.primary,
      '&:hover': {
        bgcolor: COLOR_SCHEME.primaryDark,
      }
    }}
  >
    إنشاء اجتماع جديد
  </Button>
)}

              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {meetings.map((meeting, index) => (
                  <React.Fragment key={meeting.meeting_id}>
                    <ListItem
                      sx={{
                        p: 3,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          bgcolor: alpha(COLOR_SCHEME.primary, 0.03),
                        },
                      }}
                    >
                      <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box>
                            <Typography variant="h6" fontWeight="bold" color={COLOR_SCHEME.text} sx={{ mb: 0.5 }}>
                              {meeting.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {meeting.description}
                            </Typography>
                          </Box>
                          <Chip 
                            icon={getStatusIcon(meeting.status)}
                            label={meeting.status} 
                            size="small"
                            sx={{ 
                              bgcolor: getStatusColor(meeting.status),
                              color: 'white',
                              fontWeight: 'bold',
                              '& .MuiChip-icon': { color: 'white' }
                            }}
                          />
                        </Box>
                        
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center', mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarToday sx={{ fontSize: 18, color: COLOR_SCHEME.primary }} />
                            <Typography variant="body2" color={COLOR_SCHEME.text} fontWeight="medium">
                              {meeting.date}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AccessTime sx={{ fontSize: 18, color: COLOR_SCHEME.primary }} />
                            <Typography variant="body2" color={COLOR_SCHEME.text} fontWeight="medium">
                              {formatTime(meeting.time)}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Person sx={{ fontSize: 18, color: COLOR_SCHEME.primary }} />
                            <Typography variant="body2" color={COLOR_SCHEME.text} fontWeight="medium">
                              {meeting.organizer}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Groups sx={{ fontSize: 18, color: COLOR_SCHEME.primary }} />
                            <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 28, height: 28, fontSize: '0.8rem' } }}>
                              {meeting.participants.map(participant => (
                                <Avatar key={participant.id} sx={{ bgcolor: COLOR_SCHEME.primary }}>
                                  {participant.avatar}
                                </Avatar>
                              ))}
                            </AvatarGroup>
                            <Typography variant="body2" color={COLOR_SCHEME.text} fontWeight="medium">
                              ({meeting.participants.length})
                            </Typography>
                          </Box>
                        </Box>

                        {/* رابط الاجتماع */}
                        {/* <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <LinkIcon sx={{ fontSize: 18, color: COLOR_SCHEME.primary }} />
                          <Typography variant="body2" color={COLOR_SCHEME.text} sx={{ fontFamily: 'monospace' }}>
                            {meeting.meeting_link}
                          </Typography>
                          <IconButton 
                            size="small" 
                            onClick={() => copyToClipboard(meeting.meeting_link)}
                            sx={{ color: COLOR_SCHEME.primary }}
                          >
                            <Launch sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Box> */}
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
                        {isMeetingActive(meeting) && (
                          <Button
                            variant="contained"
                            startIcon={<VideoCameraFront />}
                            onClick={() => handleJoinMeeting(meeting)}
                            sx={{
                              bgcolor: COLOR_SCHEME.success,
                              '&:hover': {
                                bgcolor: '#1a9c4d',
                              },
                              minWidth: '120px',
                              mb: { xs: 1, sm: 0 }
                            }}
                          >
                            انضم الآن
                          </Button>
                        )}
                        <IconButton 
                          size="small" 
                          onClick={() => handleOpenDialog(meeting)}
                          sx={{ color: COLOR_SCHEME.primary }}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleDeleteMeeting(meeting.meeting_id)}
                          sx={{ color: COLOR_SCHEME.error }}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </ListItem>
                    
                    {index < meetings.length - 1 && (
                      <Divider sx={{ mx: 3 }} />
                    )}
                  </React.Fragment>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* نافذة إنشاء/تعديل اجتماع */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ 
          bgcolor: alpha(COLOR_SCHEME.primary, 0.05),
          borderBottom: `1px solid ${alpha(COLOR_SCHEME.primary, 0.1)}`
        }}>
          <Typography variant="h6" fontWeight="bold" color={COLOR_SCHEME.text}>
            {selectedMeeting ? 'تعديل الاجتماع' : 'إنشاء اجتماع جديد'}
          </Typography>
        </DialogTitle>
        
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ p: 3 }}>
            <Grid container spacing={{ xs: 1, sm: 1.5, md: 2.5 }}>
              {/* معلومات الأساسية */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="عنوان الاجتماع"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                  placeholder="أدخل عنوان الاجتماع"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="وصف الاجتماع"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="أدخل وصف الاجتماع"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="تاريخ الاجتماع"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="time"
                  label="وقت الاجتماع"
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>

              {/* تحديد المستلمين */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: alpha(COLOR_SCHEME.primary, 0.05) }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Groups sx={{ color: COLOR_SCHEME.primary }} />
                    تحديد المستلمين
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>اختر الأقسام</InputLabel>
                        <Select
                          multiple
                          value={selectedDept}
                          onChange={(e) => {
                            setSelectedDept(e.target.value);
                            setSelectedJobs([]);
                            setSelectedUsers([]);
                          }}
                          input={<OutlinedInput label="اختر الأقسام" />}
                          disabled={loading}
                          renderValue={(selected) => (
                            <Box display="flex" flexWrap="wrap" gap={0.5}>
                              {departments
                                .filter(d => selected.includes(d.guid))
                                .map(d => (
                                  <Chip 
                                    key={d.guid} 
                                    label={d.departName} 
                                    size="small" 
                                    sx={{
                                      backgroundColor: COLOR_SCHEME.primaryLight,
                                      color: 'white',
                                    }}
                                  />
                                ))}
                            </Box>
                          )}
                        >
                          {departments.map((dept) => (
                            <MenuItem key={dept.guid} value={dept.guid}>
                              <Checkbox checked={selectedDept.includes(dept.guid)} sx={{ color: COLOR_SCHEME.primary }} />
                              <ListItemText primary={dept.departName} />
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {selectedDept.length > 0 && (
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>الوظائف المطلوبة</InputLabel>
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
                                    sx={{
                                      backgroundColor: COLOR_SCHEME.primary,
                                      color: 'white',
                                    }} 
                                  />
                                ) : (
                                  selected.map(j => (
                                    <Chip 
                                      key={j} 
                                      label={jobTitles[j] || `وظيفة رقم ${j}`} 
                                      size="small" 
                                      sx={{
                                        backgroundColor: COLOR_SCHEME.primaryLight,
                                        color: 'white',
                                      }}
                                    />
                                  ))
                                )}
                              </Box>
                            )}
                          >
                            <MenuItem value="all">
                              <Checkbox checked={selectedJobs.includes("all")} sx={{ color: COLOR_SCHEME.primary }} />
                              <ListItemText primary="كل الوظائف" />
                            </MenuItem>
                            {filteredJobs.map(job => (
                              <MenuItem key={job} value={job}>
                                <Checkbox checked={selectedJobs.includes(job)} sx={{ color: COLOR_SCHEME.primary }} />
                                <ListItemText 
                                  primary={`${jobTitles[job] || `وظيفة رقم ${job}`} (${users.filter(u => u.userJop === job && selectedDept.includes(u.departGuid)).length})`} 
                                />
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    )}

                    {selectedJobs.length > 0 && !loading && (
                      <Grid item xs={12}>
                        <FormControl fullWidth size="small">
                          <InputLabel>اختر الموظفين</InputLabel>
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
                                    sx={{
                                      backgroundColor: COLOR_SCHEME.primary,
                                      color: 'white',
                                    }} 
                                  />
                                ) : (
                                  filteredUsers
                                    .filter(u => selected.includes(u.guid))
                                    .map(u => (
                                      <Chip
                                        key={u.guid}
                                        label={u.fullName}
                                        avatar={<Avatar sx={{ backgroundColor: COLOR_SCHEME.primary, fontSize: '0.75rem' }}>{u.fullName?.charAt(0) || ''}</Avatar>}
                                        sx={{
                                          backgroundColor: COLOR_SCHEME.primaryLight,
                                          color: 'white',
                                        }}
                                      />
                                    ))
                                )}
                              </Box>
                            )}
                            MenuProps={{
                              PaperProps: {
                                style: {
                                  maxHeight: 400
                                }
                              }
                            }}
                          >
                            <Box sx={{ p: 1, borderBottom: `1px solid ${alpha(COLOR_SCHEME.primary, 0.1)}` }}>
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
                                      <SearchIcon sx={{ color: COLOR_SCHEME.primary }} />
                                    </InputAdornment>
                                  ),
                                  endAdornment: searchTerm && (
                                    <InputAdornment position="end">
                                      <IconButton
                                        size="small"
                                        onClick={() => setSearchTerm("")}
                                      >
                                        <CloseIcon fontSize="small" />
                                      </IconButton>
                                    </InputAdornment>
                                  )
                                }}
                              />
                            </Box>
                            
                            <MenuItem value="all" onClick={handleSelectAllUsers}>
                              <Checkbox checked={selectedUsers.length === filteredUsers.length} sx={{ color: COLOR_SCHEME.primary }} />
                              <ListItemText primary={`الكل (${filteredUsers.length})`} />
                            </MenuItem>
                            
                            {filteredUsers.length > 0 ? (
                              filteredUsers.map(user => (
                                <MenuItem key={user.guid} value={user.guid}>
                                  <Checkbox checked={selectedUsers.includes(user.guid)} sx={{ color: COLOR_SCHEME.primary }} />
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <Avatar sx={{ 
                                      width: 24, 
                                      height: 24, 
                                      fontSize: '0.75rem',
                                      backgroundColor: COLOR_SCHEME.primary 
                                    }}>
                                      {user.fullName?.charAt(0) || ''}
                                    </Avatar>
                                    <Box>
                                      <Typography variant="body1">{user.fullName || 'غير معروف'}</Typography>
                                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        {jobTitles[user.userJop] || `وظيفة رقم ${user.userJop}`}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </MenuItem>
                              ))
                            ) : (
                              <Box p={2} textAlign="center">
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                  {searchTerm ? 'لا يوجد موظفين مطابقين للبحث' : 'لا يوجد موظفين متاحين'}
                                </Typography>
                              </Box>
                            )}
                          </Select>
                          <FormHelperText>
                            تم اختيار {selectedUsers.includes("all") ? filteredUsers.length : selectedUsers.length} من أصل {filteredUsers.length} موظف
                          </FormHelperText>
                        </FormControl>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          </DialogContent>
          
          <DialogActions sx={{ p: 3, gap: 1 }}>
            <Button 
              onClick={handleCloseDialog}
              disabled={submitting}
              sx={{ 
                color: COLOR_SCHEME.text,
                '&:hover': {
                  bgcolor: alpha(COLOR_SCHEME.text, 0.05)
                }
              }}
            >
              إلغاء
            </Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={!formData.title || !formData.date || !formData.time || selectedUsers.length === 0 || submitting}
              startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : null}
              sx={{ 
                bgcolor: COLOR_SCHEME.primary,
                '&:hover': {
                  bgcolor: COLOR_SCHEME.primaryDark,
                },
                '&:disabled': {
                  bgcolor: alpha(COLOR_SCHEME.primary, 0.5)
                }
              }}
            >
              {submitting ? 'جاري الحفظ...' : selectedMeeting ? 'تحديث' : 'إنشاء'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* نافذة الانضمام للاجتماع */}
      <Dialog 
        open={joinMeetingDialog} 
        onClose={() => setJoinMeetingDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          bgcolor: alpha(COLOR_SCHEME.primary, 0.05),
          borderBottom: `1px solid ${alpha(COLOR_SCHEME.primary, 0.1)}`,
          textAlign: 'center'
        }}>
          <VideoCameraFront sx={{ fontSize: 40, color: COLOR_SCHEME.primary, mb: 1 }} />
          <Typography variant="h6" fontWeight="bold" color={COLOR_SCHEME.text}>
            الانضمام إلى الاجتماع
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3, textAlign: 'center' }}>
          {currentMeeting && (
            <>
              <Typography variant="h5" fontWeight="bold" color={COLOR_SCHEME.text} gutterBottom>
                {currentMeeting.title}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {currentMeeting.description}
              </Typography>
              
              {/* <Box sx={{ bgcolor: alpha(COLOR_SCHEME.primary, 0.05), p: 2, borderRadius: 2, mb: 3 }}>
                <Typography variant="body2" color={COLOR_SCHEME.text} fontWeight="medium" gutterBottom>
                  معلومات الاجتماع:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  الرابط: {currentMeeting.meeting_link}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  كلمة المرور: {currentMeeting.password}
                </Typography>
              </Box> */}
              
              <Typography variant="body2" color="text.secondary">
                سيتم فتح الاجتماع في نافذة جديدة
              </Typography>
            </>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, justifyContent: 'center', gap: 2 }}>
          <Button 
            onClick={() => setJoinMeetingDialog(false)}
            sx={{ 
              color: COLOR_SCHEME.text,
              '&:hover': {
                bgcolor: alpha(COLOR_SCHEME.text, 0.05)
              }
            }}
          >
            إلغاء
          </Button>
          <Button 
            variant="contained"
            startIcon={<VideoCameraFront />}
            onClick={handleStartMeeting}
            sx={{ 
              bgcolor: COLOR_SCHEME.success,
              '&:hover': {
                bgcolor: '#1a9c4d',
              },
              px: 4
            }}
          >
            انضم إلى الاجتماع
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MeetingRoomTab;