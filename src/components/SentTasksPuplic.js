import { SIDEBAR_DESKTOP_QUERY } from '../config/sidebarLayout';
import { navigationContentSx } from '../config/sidebarLayout';
import React, { useEffect, useState } from 'react';
import { 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Chip, 
  Box, 
  Button, 
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  CircularProgress,
  IconButton,
  Tooltip,
  TextField,
  MenuItem,
  Checkbox,
  ListItemIcon,
  ListItemButton,
  FormControlLabel,
  Snackbar,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  Pagination,
  Stack,
  useMediaQuery,
  useTheme
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { Analytics } from '@mui/icons-material';
import {
  CheckCircleOutline,
  CancelOutlined,
  AttachFile,
  ExpandMore,
  HourglassTop,
  DoNotDisturbAlt,
  Close,
  AccessTime,
  Person,
  Description,
  Group,
  Update,
  FilterList,
  ViewList
} from '@mui/icons-material';
import axios from 'axios';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

// Import the PublicTaskDialog component
import PublicTaskDialog from './PublicTaskDialog'; // Adjust the path as needed

// API URLs
const PUPLIC_TASKS_API = "https://api3.sstli.com/api/PuplicTask/GetPuplicTasksByQuery";
const TASK_UPDATES_API = "https://api3.sstli.com/api/PuplicTask/GetTaskUpdates/";
const EXTERNAL_TASKS_API = "https://filesregsiteration.sstli.com/tasks/get_ubdated_tasks.php";

// Color palette based on #80b49e
const colorPalette = {
  primary: '#80b49e',
  primaryLight: '#a8c9bb',
  primaryDark: '#5a8f7a',
  primaryLighter: '#e1efe9',
  textDark: '#2d4a3e',
  textLight: '#5a7a6a',
  background: '#f8fbf9',
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336'
};

// Task status mapping
const taskStatusMap = {
  0: { text: "معلقة", color: "warning", icon: <HourglassTop /> },
  1: { text: "جاري التنفيذ", color: "info", icon: <HourglassTop /> },
  2: { text: "مكتملة", color: "success", icon: <CheckCircleOutline /> },
  3: { text: "مرفوضة", color: "error", icon: <DoNotDisturbAlt /> }
};

function SentTasks() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(SIDEBAR_DESKTOP_QUERY, { noSsr: true });

  const [sentTasks, setSentTasks] = useState([]);
  const [externalModifiedTasks, setExternalModifiedTasks] = useState([]);
  const [taskUpdates, setTaskUpdates] = useState({});
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [loading, setLoading] = useState(true);
  const [externalLoading, setExternalLoading] = useState(true);
  const [updatesLoading, setUpdatesLoading] = useState({});
  const [usersData, setUsersData] = useState({});
  const [openDialog, setOpenDialog] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [editForm, setEditForm] = useState({
  taskName: '',
  taskDescription: '',
  taskTimeInHours: 0,
  allowAttach: false,
  file: null
});
const [snackbar, setSnackbar] = useState({
  open: false,
  message: '',
  severity: 'success'
});

  const [statusSummaryDialog, setStatusSummaryDialog] = useState({
    open: false,
    task: null,
    statusSummary: null
  });
  const [viewMode, setViewMode] = useState('filtered'); // 'filtered' or 'all'
  const [showUpdatedOnly, setShowUpdatedOnly] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 6;

  const handleOpenStatusSummary = (task) => {
    const statusSummary = getTaskStatusSummary(task.id);
    setStatusSummaryDialog({
      open: true,
      task,
      statusSummary
    });
  };

  const handleCloseStatusSummary = () => {
    setStatusSummaryDialog({
      open: false,
      task: null,
      statusSummary: null
    });
  };

  const getOverallTaskStatus = (taskId) => {
    const updates = taskUpdates[taskId] || [];
    
    // تجميع أحدث تحديث لكل مستخدم
    const latestUpdatesByUser = {};
    updates.forEach(update => {
      if (!latestUpdatesByUser[update.updatedBy] || 
          new Date(update.updatedAt) > new Date(latestUpdatesByUser[update.updatedBy].updatedAt)) {
        latestUpdatesByUser[update.updatedBy] = update;
      }
    });

    // الحصول على جميع المستخدمين المعينين
    let assignedUsers = [];
    try {
      const task = sentTasks.find(t => t.id === taskId);
      if (task) {
        assignedUsers = JSON.parse(task.assignedTo.replace(/\\/g, '') || '[]');
      }
    } catch (error) {
      console.error("Error parsing assigned users:", error);
    }

    // التحقق من حالة كل مستخدم
    let allCompleted = true;
    let anyInProgress = false;
    let anyRejected = false;
    let pendingUsers = [];

    assignedUsers.forEach(user => {
      const userUpdate = latestUpdatesByUser[user.guid];
      
      if (!userUpdate) {
        allCompleted = false;
        pendingUsers.push(user.fullName);
      } else if (userUpdate.status === 1) { // جاري التنفيذ
        allCompleted = false;
        anyInProgress = true;
      } else if (userUpdate.status === 3) { // مرفوضة
        allCompleted = false;
        anyRejected = true;
      } else if (userUpdate.status !== 2) { // غير مكتملة
        allCompleted = false;
      }
    });

    // تحديد الحالة العامة
    if (anyRejected) {
      return { 
        status: 3, 
        text: "مرفوضة", 
        color: "error", 
        details: "هناك مستخدم رفض المهمة" 
      };
    } else if (allCompleted) {
      return { 
        status: 2, 
        text: "مكتملة", 
        color: "success", 
        details: "جميع المستخدمين أكملوا المهمة" 
      };
    } else if (anyInProgress) {
      return { 
        status: 1, 
        text: "جاري التنفيذ", 
        color: "info", 
        details: "هناك مستخدمين يعملون على المهمة" 
      };
    } else if (pendingUsers.length > 0) {
      return { 
        status: 0, 
        text: "معلقة", 
        color: "warning", 
        details: `${pendingUsers.join('، ')} لم يبدأوا المهمة بعد` 
      };
    } else {
      return { 
        status: 0, 
        text: "معلقة", 
        color: "warning", 
        details: "الحالة غير محددة" 
      };
    }
  };

  const getTaskStatusSummary = (taskId) => {
    const updates = taskUpdates[taskId] || [];
    
    // تجميع أحدث تحديث لكل مستخدم
    const latestUpdatesByUser = {};
    updates.forEach(update => {
      if (!latestUpdatesByUser[update.updatedBy] || 
          new Date(update.updatedAt) > new Date(latestUpdatesByUser[update.updatedBy].updatedAt)) {
        latestUpdatesByUser[update.updatedBy] = update;
      }
    });

    // حساب الإحصائيات
    const statusCount = {
      0: 0, // معلقة
      1: 0, // جاري التنفيذ
      2: 0, // مكتملة
      3: 0  // مرفوضة
    };

    Object.values(latestUpdatesByUser).forEach(update => {
      if (update.status in statusCount) {
        statusCount[update.status]++;
      }
    });

    return statusCount;
  };

  // State for PublicTaskDialog
  const [publicTaskDialogOpen, setPublicTaskDialogOpen] = useState(false);
  const [mainTaskName, setMainTaskName] = useState("");
  const [mainTaskTime, setMainTaskTime] = useState(0);
  const [taskUsers, setTaskUsers] = useState({default: []});

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get("https://api1.sstli.com/api/userinfo");
        if (Array.isArray(response.data)) {
          const usersMap = {};
          response.data.forEach(user => {
            usersMap[user.guid] = user.fullName;
          });
          setUsersData(usersMap);
          setAllUsers(response.data);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchExternalTasks = async () => {
      try {
        const response = await axios.get(EXTERNAL_TASKS_API);
        if (response.data.success && Array.isArray(response.data.data)) {
          setExternalModifiedTasks(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching external tasks:", error);
        setExternalModifiedTasks([]);
      } finally {
        setExternalLoading(false);
      }
    };
    
    fetchExternalTasks();
  }, []);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await axios.get(PUPLIC_TASKS_API);
        const currentUser = JSON.parse(localStorage.getItem("user"));
        if (Array.isArray(response.data)) {
          const filteredTasks = response.data.filter(task => {
            let assignedBy = JSON.parse(task.assignedBy.replace(/\\/g, '') || '{}');
            return assignedBy.guid === currentUser.guid;
          });
          setSentTasks(filteredTasks);

          // Load updates for all tasks initially
          if (initialLoad) {
            filteredTasks.forEach(task => {
              fetchTaskUpdates(task.id);
            });
            setInitialLoad(false);
          }

          const initialUpdatesLoading = {};
          filteredTasks.forEach(task => {
            initialUpdatesLoading[task.id] = false;
          });
          setUpdatesLoading(initialUpdatesLoading);
        }
      } catch (error) {
        console.error("Error fetching tasks:", error);
        setSentTasks([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [initialLoad, publicTaskDialogOpen]);

  const getUserDetails = (guid) => {
    if (guid === JSON.parse(localStorage.getItem("user")).guid) {
      return { name: "أنا", avatar: "أنا" };
    }
    const userName = usersData[guid] || "مستخدم غير معروف";
    const avatar = userName.charAt(0).toUpperCase();
    return { name: userName, avatar: avatar };
  };

  const fetchTaskUpdates = async (taskId) => {
    if (taskUpdates[taskId]) return;
    setUpdatesLoading(prev => ({ ...prev, [taskId]: true }));
    try {
      const response = await axios.get(`${TASK_UPDATES_API}${taskId}`);
      if (Array.isArray(response.data)) {
        // Sort updates by date (newest first)
        const sortedUpdates = response.data.sort((a, b) => 
          new Date(b.updatedAt) - new Date(a.updatedAt)
        );
        setTaskUpdates(prev => ({
          ...prev,
          [taskId]: sortedUpdates
        }));
      }
    } catch (error) {
      console.error(`Error fetching updates for task ${taskId}:`, error);
      setTaskUpdates(prev => ({
        ...prev,
        [taskId]: []
      }));
    } finally {
      setUpdatesLoading(prev => ({ ...prev, [taskId]: false }));
    }
  };

  const isTaskModifiedExternally = (taskId) => {
    return externalModifiedTasks.some(externalTask => 
      parseInt(externalTask.TaskId) === parseInt(taskId)
    );
  };

  const getExternalTaskData = (taskId) => {
    return externalModifiedTasks.find(externalTask => 
      parseInt(externalTask.TaskId) === parseInt(taskId)
    );
  };

  const getRemainingTime = (task) => {
    // Use external task data if available, otherwise use the original task data
    const isModifiedExternally = isTaskModifiedExternally(task.id);
    const externalTaskData = isModifiedExternally ? getExternalTaskData(task.id) : null;
    
    // Determine which time and creation date to use
    // Note: TaskTimeInMinutes is actually in HOURS, not minutes (misleading name)
    const taskTimeInHours = externalTaskData?.TaskTimeInMinutes || task.taskTimeInMinutes;
    const createdAt = externalTaskData?.ModifiedDate || task.createdAt;
    
    const timeAdjustment = 3 * 60 * 60 * 1000;
    const created = new Date(createdAt);
    created.setTime(created.getTime() + timeAdjustment);
    
    // Convert hours to milliseconds
    const deadline = created.getTime() + taskTimeInHours * 60 * 60 * 1000;
    const timeLeft = Math.max(0, deadline - Date.now());
    const totalSeconds = Math.floor(timeLeft / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    return { 
      hours, 
      mins, 
      secs, 
      ended: timeLeft <= 0
    };
  };

  const handleOpenDialog = (task) => {
    setCurrentTask(task);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentTask(null);
  };

  const handleEditTask = (task) => {
    setTaskToEdit(task);
    setMainTaskName(task.taskName);
    setMainTaskTime(task.taskTimeInMinutes); // This is actually in hours
    
    // Parse assigned users
    try {
      const assignedTo = JSON.parse(task.assignedTo.replace(/\\/g, '') || '[]');
      const selectedUserGuids = assignedTo.map(user => user.guid);
      setTaskUsers({default: selectedUserGuids});
    } catch (error) {
      console.error("Error parsing assigned users:", error);
      setTaskUsers({default: []});
    }
    
    setPublicTaskDialogOpen(true);
  };

  const handleTaskUsersChange = (key, value) => {
    setTaskUsers(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleCloseEditDialog = () => {
    setPublicTaskDialogOpen(false);
    setTaskToEdit(null);
    setMainTaskName("");
    setMainTaskTime(0);
    setTaskUsers({default: []});
  };

  const handleDownloadAttachment = (attachmentPath) => {
    const fileName = attachmentPath.split("\\").pop();
    const fileUrl = `https://api3.sstli.com/api/PuplicTask/DownloadFile?fileName=${fileName}`;
    window.open(fileUrl, "_blank");
  };

const handleEditFormChange = (field, value) => {
  setEditForm(prev => ({
    ...prev,
    [field]: value
  }));
};


  const handleFileChange = (e) => {
    handleEditFormChange('file', e.target.files[0]);
  };

  const handleToggleUser = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSelectAllUsers = () => {
    if (selectedUsers.length === allUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(allUsers.map(user => user.guid));
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    date.setTime(date.getTime() + 3 * 60 * 60 * 1000);
    return date.toLocaleString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  // Filter tasks based on view mode
  const filteredSentTasks = sentTasks.filter(task => {
    if (viewMode === 'all') {
      // Show all tasks
      return true;
    } else {
      // Filter by selected date
      if (!task.createdAt) return false;
      
      // الحصول على تاريخ الإنشاء الأصلي بدون إضافة 3 ساعات
      const taskCreatedDate = dayjs(task.createdAt).format('YYYY-MM-DD');
      
      // تحويل التاريخ المحدد للتصفية إلى نفس الصيغة
      const selectedDateFormatted = selectedDate.format('YYYY-MM-DD');
      
      // مقارنة التواريخ بدون أي تعديل على التوقيت
      return taskCreatedDate === selectedDateFormatted;
    }
  });

  // Filter tasks to show only updated ones if the option is selected
  const tasksToDisplay = showUpdatedOnly 
    ? filteredSentTasks.filter(task => isTaskModifiedExternally(task.id) || (taskUpdates[task.id] && taskUpdates[task.id].length > 0))
    : filteredSentTasks;

  // Pagination logic
  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = tasksToDisplay.slice(indexOfFirstTask, indexOfLastTask);
  const totalPages = Math.ceil(tasksToDisplay.length / tasksPerPage);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  if (loading || externalLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress size={60} sx={{ color: colorPalette.primary }} />
      </Box>
    );
  }

  return (
    <Box sx={{
      padding: isDesktop ? '20px' : {
        xs: 0.6,
        sm: 1,
        md: 1.4
      },
      marginBottom: isDesktop ? '50px' : {
        xs: 20,
        md: 35
      },
      marginTop: isDesktop ? '20px' : {
        xs: 8,
        md: 14
      },
      backgroundColor: colorPalette.background,
      minHeight: '100vh',
      width: isDesktop ? 'auto' : '100%',
      maxWidth: '100%',
      minWidth: 0,
      boxSizing: 'border-box',
      overflowX: 'hidden',
      '& .MuiTypography-h4': {
        fontSize: isDesktop ? undefined : {
          xs: '0.82rem',
          sm: '0.94rem',
          md: '1.08rem'
        }
      },
      '& .MuiTypography-h6': {
        fontSize: isDesktop ? undefined : {
          xs: '0.64rem',
          sm: '0.72rem',
          md: '0.82rem'
        }
      },
      '& .MuiTypography-body2': {
        fontSize: isDesktop ? undefined : {
          xs: '0.54rem',
          sm: '0.61rem',
          md: '0.7rem'
        }
      },
      '& .MuiButton-root': {
        fontSize: isDesktop ? undefined : {
          xs: '0.54rem',
          sm: '0.61rem',
          md: '0.7rem'
        },
        minHeight: isDesktop ? undefined : {
          xs: 28,
          sm: 30,
          md: 34
        }
      },
      '& .MuiChip-root': {
        fontSize: isDesktop ? undefined : {
          xs: '0.5rem',
          sm: '0.56rem',
          md: '0.64rem'
        },
        height: isDesktop ? undefined : {
          xs: 21,
          sm: 23,
          md: 26
        }
      },
      '& .MuiInputBase-root, & .MuiInputLabel-root, & .MuiFormControlLabel-label': {
        fontSize: isDesktop ? undefined : {
          xs: '0.56rem',
          sm: '0.63rem',
          md: '0.72rem'
        }
      },
      ...navigationContentSx
    }}>
      <Typography
        variant="h4"
        gutterBottom
        fontWeight={700}
        sx={{
          mb: isDesktop ? 3 : { xs: 1, sm: 1.2, md: 1.5 },
          color: colorPalette.textDark,
          textAlign: 'start'
        }}
      >
        المهام التي أرسلتها
      </Typography>

      {/* View Mode Toggle */}
      <Box sx={{ 
        display: 'flex',
        flexDirection: isDesktop ? 'row' : { xs: 'column', md: 'row' },
        alignItems: isDesktop ? 'center' : { xs: 'stretch', md: 'center' },
        gap: isDesktop ? 2 : { xs: 0.45, sm: 0.6, md: 0.8 },
        mb: isDesktop ? 2 : { xs: 0.8, sm: 1, md: 1.2 },
        backgroundColor: colorPalette.primaryLighter,
        p: isDesktop ? 2 : { xs: 0.55, sm: 0.7, md: 1 },
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(e, newMode) => {
            if (newMode) {
              setViewMode(newMode);
              setCurrentPage(1); // Reset to first page when changing view mode
            }
          }}
          aria-label="view mode"
          sx={{
            width: isDesktop ? 'auto' : '100%',
            '& .MuiToggleButton-root': {
              flex: isDesktop ? 'initial' : 1,
              minWidth: 0,
              px: isDesktop ? 1.5 : { xs: 0.45, sm: 0.65, md: 0.9 },
              py: isDesktop ? 1 : { xs: 0.45, sm: 0.55, md: 0.7 },
              fontSize: isDesktop ? undefined : { xs: '0.5rem', sm: '0.56rem', md: '0.64rem' },
              lineHeight: 1.35,
              whiteSpace: 'normal'
            }
          }}
        >
          <ToggleButton value="filtered" aria-label="filtered view" sx={{ color: colorPalette.primary }}>
            <FilterList sx={{ marginInlineEnd: 0.5, fontSize: isDesktop ? undefined : { xs: 16, sm: 17, md: 18 } }} />
            عرض المهام حسب التاريخ
          </ToggleButton>
          <ToggleButton value="all" aria-label="all tasks view" sx={{ color: colorPalette.primary }}>
            <ViewList sx={{ marginInlineEnd: 0.5, fontSize: isDesktop ? undefined : { xs: 16, sm: 17, md: 18 } }} />
            عرض جميع المهام
          </ToggleButton>
        </ToggleButtonGroup>

        {viewMode === 'filtered' && (
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="فلتر حسب اليوم"
              value={selectedDate}
              onChange={(newDate) => {
                setSelectedDate(newDate);
                setCurrentPage(1); // Reset to first page when changing date
              }}
              format="YYYY-MM-DD"
              slotProps={{ 
                textField: { 
                  size: "small",
                  sx: { 
                    backgroundColor: 'white',
                    borderRadius: 1,
                    minWidth: isDesktop ? 150 : 0,
                    width: isDesktop ? 150 : '100%',
                    '& .MuiInputBase-root': {
                      minHeight: isDesktop ? undefined : { xs: 34, sm: 36, md: 38 }
                    }
                  } 
                } 
              }}
            />
          </LocalizationProvider>
        )}

        <FormControlLabel
          control={
            <Checkbox
              checked={showUpdatedOnly}
              onChange={(e) => {
                setShowUpdatedOnly(e.target.checked);
                setCurrentPage(1); // Reset to first page when toggling filter
              }}
              sx={{ color: colorPalette.primary }}
            />
          }
          label="عرض المهام المحدثة فقط"
          sx={{
            m: 0,
            width: isDesktop ? 'auto' : '100%',
            '& .MuiFormControlLabel-label': {
              lineHeight: 1.3
            }
          }}
        />

        <Typography sx={{
          fontWeight: 700,
          fontSize: isDesktop ? 16 : { xs: '0.58rem', sm: '0.66rem', md: '0.74rem' },
          color: colorPalette.textDark,
          width: isDesktop ? 'auto' : '100%',
          textAlign: isDesktop ? 'initial' : 'center'
        }}>
          {viewMode === 'filtered' 
            ? `المهام بتاريخ: ${selectedDate.format('YYYY-MM-DD')}`
            : 'جميع المهام'}
        </Typography>
      </Box>

      {tasksToDisplay.length === 0 ? (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: isDesktop ? '60vh' : { xs: '34vh', sm: '40vh', md: '46vh' },
          backgroundColor: colorPalette.primaryLighter,
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <Typography variant="h6" sx={{
            color: colorPalette.textLight,
            fontSize: isDesktop ? undefined : { xs: '0.62rem', sm: '0.7rem', md: '0.8rem' },
            textAlign: 'center',
            px: 1
          }}>
            {showUpdatedOnly 
              ? 'لا توجد مهام محدثة' 
              : viewMode === 'filtered' 
                ? 'لا توجد مهام أرسلتها في هذا اليوم' 
                : 'لا توجد مهام أرسلتها'}
          </Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={isDesktop ? 4 : { xs: 1, sm: 1.5, md: 2 }}>
            {currentTasks.map((task) => {
              const { hours, mins, secs, ended } = getRemainingTime(task);
              const createdText = formatDate(task.createdAt);
              
              // Check if task is modified externally
              const isModifiedExternally = isTaskModifiedExternally(task.id);
              const externalTaskData = isModifiedExternally ? getExternalTaskData(task.id) : null;
              
              // Determine which assignedTo data to use
              let assignedTo = [];
              let assignedToNames = "";
              
              if (isModifiedExternally && externalTaskData?.AssignedTo) {
                // Use data from external API if modified externally
                assignedTo = externalTaskData.AssignedTo;
                assignedToNames = assignedTo.map(user => user.fullName).join(", ");
              } else {
                // Use original data from internal API
                try {
                  assignedTo = JSON.parse(task.assignedTo.replace(/\\/g, '') || '[]');
                  assignedToNames = assignedTo.map(user => user.fullName).join(", ");
                } catch (error) {
                  console.error("Error parsing assignedTo:", error);
                  assignedToNames = "مستخدم غير معروف";
                }
              }
              
              // Get the latest update status to show as the main task status
              const latestUpdate = taskUpdates[task.id]?.[0];
              const displayStatus = latestUpdate ? latestUpdate.status : task.status;

              // Check if task has updates
              const hasUpdates = isModifiedExternally || (taskUpdates[task.id] && taskUpdates[task.id].length > 0);

              return (
                <Grid item xs={12} sm={6} md={4} key={task.id}>
                  <Card sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 3,
                    boxShadow: ended ? "0 4px 20px 0 rgba(244, 67, 54, 0.2)" : "0 4px 20px 0 rgba(128, 180, 158, 0.2)",
                    transition: 'transform 0.3s, box-shadow 0.3s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: ended ? "0 6px 24px 0 rgba(244, 67, 54, 0.3)" : "0 6px 24px 0 rgba(128, 180, 158, 0.3)"
                    },
                    borderInlineStart: `4px solid ${
                      displayStatus === 2 ? colorPalette.success : 
                      displayStatus === 3 ? colorPalette.error : 
                      displayStatus === 1 ? colorPalette.primary : colorPalette.warning
                    }`,
                    // Highlight updated tasks with a different background
                    backgroundColor: hasUpdates ? colorPalette.primaryLighter : 'white',
                    border: ended ? `1px solid ${colorPalette.error}` : `1px solid ${colorPalette.primaryLighter}`,
                  }}>

                    <CardContent sx={{
                      flexGrow: 1,
                      position: 'relative',
                      padding: isDesktop ? '2rem' : { xs: 1, sm: 1.4, md: 1.8 }
                    }}>
                      <Box sx={{ 
                        position: 'absolute', 
                        top: 16, 
                        right: 16,
                        display: 'flex',
                        alignItems: 'center',
                        flexDirection: 'column',
                        gap: 1
                      }}>
                        {isModifiedExternally && (
                          <Tooltip title="هذه المهمة معدلة">
                            <Chip
                              icon={<Update />}
                              label="معدلة"
                              color="secondary"
                              size="small"
                              sx={{ 
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                px: 1
                              }}
                            />
                          </Tooltip>
                        )}
                        
                        {updatesLoading[task.id] ? (
                          <CircularProgress size={24} sx={{ color: colorPalette.primary }} />
                        ) : (
                          <Tooltip title={getOverallTaskStatus(task.id).details}>
                            <Chip
                              icon={taskStatusMap[getOverallTaskStatus(task.id).status]?.icon}
                              label={getOverallTaskStatus(task.id).text}
                              color={getOverallTaskStatus(task.id).color}
                              size="small"
                              sx={{ 
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                px: 1,
                                cursor: 'pointer'
                              }}
                              onClick={() => handleOpenStatusSummary(task)}
                            />
                          </Tooltip>
                        )}
                      </Box>

                      <Box sx={{ 
                        position: 'absolute', 
                        top: 16, 
                        left: 16,
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        <Tooltip title="تعديل المهمة">
                          <IconButton 
                            size="small" 
                            onClick={() => handleEditTask(task)}
                            sx={{ 
                              backgroundColor: colorPalette.primary,
                              color: 'white',
                              '&:hover': {
                                backgroundColor: colorPalette.primaryDark
                              }
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>

                      <Typography variant="h6" fontWeight={700} sx={{
                        mb: 2,
                        mt: 5,
                        color: colorPalette.textDark,
                        fontSize: '1.1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}>
                        <Description sx={{ color: colorPalette.primary }} />
                        {externalTaskData?.TaskName || task.taskName}
                        {hasUpdates && !isModifiedExternally && (
                          <Chip
                            label="محدثة"
                            size="small"
                            color="info"
                            sx={{ ml: 1, fontSize: '0.7rem' }}
                          />
                        )}
                      </Typography>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          gap: 1,
                          color: colorPalette.textLight,
                          mb: 1
                        }}>
                          <AccessTime fontSize="small" />
                          <strong>أنشئت:</strong> {createdText}
                        </Typography>

                        <Typography variant="body2" sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          gap: 1,
                          color: colorPalette.textLight,
                          mb: 1
                        }}>
                          <Group fontSize="small" />
                          <strong>المهمة أُرسلت إلى:</strong> {assignedToNames}
                        </Typography>

                        {externalTaskData?.ModifiedDate && (
                          <Typography variant="body2" sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            gap: 1,
                            color: '#9b59b6',
                            mb: 1,
                            fontWeight: 600
                          }}>
                            <Update fontSize="small" />
                            <strong>آخر تعديل:</strong> {formatDate(externalTaskData.ModifiedDate)}
                          </Typography>
                        )}

                        <Typography variant="body2" sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          gap: 1,
                          color: ended ? colorPalette.error : colorPalette.primary,
                          mb: 1,
                          fontWeight: 600
                        }}>
                          <AccessTime fontSize="small" />
                          <strong>الوقت المتبقي:</strong> 
                          {`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`}
                        </Typography>

                        <Typography variant="body2" sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          gap: 1,
                          color: colorPalette.textLight,
                          mb: 1
                        }}>
                          <AccessTime fontSize="small" />
                          <strong>مدة المهمة:</strong> 
                          {(externalTaskData?.TaskTimeInMinutes || task.taskTimeInMinutes)} ساعة
                        </Typography>
                      </Box>

                      <Typography variant="body2" sx={{ 
                        color: colorPalette.textDark,
                        mb: 2,
                        backgroundColor: colorPalette.primaryLighter,
                        p: 1.5,
                        borderRadius: 1,
                        borderInlineStart: `3px solid ${colorPalette.primary}`
                      }}>
                        <strong>الوصف:</strong> {externalTaskData?.TaskDescription || task.taskDescription || "لا يوجد وصف للمهمة"}
                      </Typography>

                      {(task.allowAttach && task.attachmentPath) || externalTaskData?.AttachFileName ? (
                        <Button
                          startIcon={<AttachFile />}
                          variant="outlined"
                          size="small"
                          sx={{
                            mt: 1,
                            borderRadius: 2,
                            textTransform: 'none',
                            color: colorPalette.primary,
                            borderColor: colorPalette.primary,
                            '&:hover': {
                              backgroundColor: colorPalette.primaryLighter,
                              borderColor: colorPalette.primary
                            }
                          }}
                          onClick={() => handleDownloadAttachment(externalTaskData?.AttachFileName || task.attachmentPath)}
                        >
                          عرض المرفق
                        </Button>
                      ) : null}

                      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                        <Button
                          variant="contained"
                          size="small"
                          sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            backgroundColor: colorPalette.primary,
                            '&:hover': {
                              backgroundColor: colorPalette.primaryDark
                            }
                          }}
                          onClick={() => handleOpenDialog(task)}
                          disabled={updatesLoading[task.id]}
                        >
                          {updatesLoading[task.id] ? (
                            <>
                              <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
                              جاري التحميل...
                            </>
                          ) : (
                            `عرض التحديثات (${taskUpdates[task.id]?.length || 0})`
                          )}
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Stack spacing={2}>
                <Pagination 
                  count={totalPages} 
                  page={currentPage} 
                  onChange={handlePageChange} 
                  color="primary" 
                  size={isDesktop ? "large" : "small"}
                  siblingCount={isDesktop ? 1 : 0}
                  boundaryCount={1}
                  showFirstButton 
                  showLastButton
                  sx={{
                    '& .MuiPaginationItem-root': {
                      '&.Mui-selected': {
                        backgroundColor: colorPalette.primary,
                        color: 'white',
                        '&:hover': {
                          backgroundColor: colorPalette.primaryDark
                        }
                      }
                    }
                  }}
                />
              </Stack>
            </Box>
          )}
        </>
      )}

      {/* Updates Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: isDesktop ? 3 : { xs: 2.2, sm: 2.5, md: 3 },
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            width: isDesktop ? 'auto' : { xs: 'calc(100vw - 20px)', sm: '88vw', md: '76vw' },
            maxWidth: isDesktop ? undefined : { xs: 'calc(100vw - 20px)', sm: 620, md: 760 },
            maxHeight: isDesktop ? '90vh' : { xs: '78dvh', sm: '82dvh', md: '86dvh' },
            m: isDesktop ? 2 : { xs: 1.2, sm: 1.5, md: 2 },
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          backgroundColor: colorPalette.primary, 
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: { xs: 0.6, sm: 1, md: 1.5 },
          py: isDesktop ? 2 : { xs: 0.7, sm: 0.9, md: 1.2 },
          px: isDesktop ? 3 : { xs: 1, sm: 1.3, md: 1.8 }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: 1 }}>
            <Description sx={{ marginInlineEnd: { xs: 0.5, md: 1 }, fontSize: isDesktop ? undefined : { xs: 18, sm: 20, md: 22 } }} />
            <Typography
              variant="h6"
              fontWeight={700}
              sx={{
                minWidth: 0,
                fontSize: isDesktop ? undefined : { xs: '0.78rem', sm: '0.9rem', md: '1rem' },
                lineHeight: 1.35,
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {currentTask?.taskName}
              {isTaskModifiedExternally(currentTask?.id) && (
                <Chip
                  icon={<Update />}
                  label="معدلة"
                  color="secondary"
                  size="small"
                  sx={{
                    ml: 0.7,
                    color: 'white',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    height: isDesktop ? 22 : { xs: 18, sm: 20, md: 22 },
                    fontSize: isDesktop ? '0.7rem' : { xs: '0.5rem', sm: '0.56rem', md: '0.64rem' }
                  }}
                />
              )}
            </Typography>
          </Box>

          <IconButton
            onClick={handleCloseDialog}
            sx={{
              color: 'white',
              width: isDesktop ? 40 : { xs: 30, sm: 34, md: 36 },
              height: isDesktop ? 40 : { xs: 30, sm: 34, md: 36 },
              flexShrink: 0
            }}
          >
            <Close sx={{ fontSize: isDesktop ? 24 : { xs: 18, sm: 20, md: 22 } }} />
          </IconButton>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            py: isDesktop ? 2 : { xs: 0.6, sm: 0.8, md: 1.2 },
            px: isDesktop ? 3 : { xs: 0.7, sm: 1, md: 1.4 },
            overflowY: 'auto'
          }}
        >
          {updatesLoading[currentTask?.id] ? (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: isDesktop ? 200 : { xs: 130, sm: 160, md: 180 }
            }}>
              <CircularProgress size={isDesktop ? 40 : 28} sx={{ color: colorPalette.primary }} />
            </Box>
          ) : (
            <List sx={{ width: '100%', p: 0 }}>
              {taskUpdates[currentTask?.id]?.length > 0 ? (
                taskUpdates[currentTask?.id].map((update, index) => {
                  const userDetails = getUserDetails(update.updatedBy);
                  const statusInfo = taskStatusMap[update.status] || { text: "غير معروف", color: "default" };
                  const fileName = update.attachmentFilePath?.split("\\").pop()?.toLowerCase();
                  const isFirstUpdate = index === 0;

                  return (
                    <React.Fragment key={index}>
                      <ListItem
                        alignItems="flex-start"
                        sx={{
                          backgroundColor: isFirstUpdate ? colorPalette.primaryLighter : 'transparent',
                          borderRadius: isDesktop ? 1 : 1.5,
                          mb: isDesktop ? 1 : { xs: 0.45, sm: 0.6, md: 0.8 },
                          p: isDesktop ? 2 : { xs: 0.7, sm: 0.9, md: 1.2 },
                          borderInlineStart: `${isDesktop ? 4 : 3}px solid ${
                            update.status === 2 ? colorPalette.success : 
                            update.status === 3 ? colorPalette.error : 
                            update.status === 1 ? colorPalette.primary : colorPalette.warning
                          }`
                        }}
                      >
                        <ListItemAvatar
                          sx={{
                            minWidth: isDesktop ? 56 : { xs: 38, sm: 44, md: 48 }
                          }}
                        >
                          <Tooltip title={userDetails.name}>
                            <Avatar sx={{ 
                              bgcolor: isFirstUpdate ? colorPalette.primary : colorPalette.textLight,
                              width: isDesktop ? 36 : { xs: 28, sm: 32, md: 34 }, 
                              height: isDesktop ? 36 : { xs: 28, sm: 32, md: 34 },
                              fontSize: isDesktop ? '0.9rem' : { xs: '0.58rem', sm: '0.66rem', md: '0.74rem' }
                            }}>
                              {userDetails.avatar}
                            </Avatar>
                          </Tooltip>
                        </ListItemAvatar>

                        <ListItemText
                          sx={{ m: 0, minWidth: 0 }}
                          primary={
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: isDesktop ? 0.7 : { xs: 0.35, sm: 0.45, md: 0.6 },
                                mb: isDesktop ? 0.5 : 0.3
                              }}
                            >
                              <Typography
                                variant="subtitle1"
                                fontWeight={700}
                                sx={{
                                  color: colorPalette.textDark,
                                  fontSize: isDesktop ? undefined : { xs: '0.66rem', sm: '0.74rem', md: '0.82rem' }
                                }}
                              >
                                {userDetails.name}
                              </Typography>

                              <Chip
                                label={statusInfo.text}
                                size="small"
                                color={statusInfo.color}
                                icon={statusInfo.icon}
                                sx={{
                                  height: isDesktop ? 22 : { xs: 18, sm: 20, md: 22 },
                                  fontSize: isDesktop ? '0.7rem' : { xs: '0.48rem', sm: '0.54rem', md: '0.61rem' },
                                  '& .MuiChip-icon': {
                                    fontSize: isDesktop ? undefined : { xs: 13, sm: 14, md: 15 }
                                  }
                                }}
                              />

                              {isFirstUpdate && (
                                <Chip
                                  label="آخر تحديث"
                                  size="small"
                                  color="primary"
                                  sx={{ 
                                    height: isDesktop ? 22 : { xs: 18, sm: 20, md: 22 }, 
                                    fontSize: isDesktop ? '0.7rem' : { xs: '0.48rem', sm: '0.54rem', md: '0.61rem' }
                                  }}
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <React.Fragment>
                              <Typography
                                variant="body2"
                                sx={{
                                  mt: 0.3,
                                  color: colorPalette.textDark,
                                  fontSize: isDesktop ? undefined : { xs: '0.56rem', sm: '0.63rem', md: '0.7rem' },
                                  lineHeight: 1.5
                                }}
                              >
                                {update.statusNote}
                              </Typography>

                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  flexWrap: 'wrap',
                                  gap: isDesktop ? 0.8 : { xs: 0.35, sm: 0.5 },
                                  mt: isDesktop ? 1 : 0.45
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: colorPalette.textLight,
                                    fontSize: isDesktop ? undefined : { xs: '0.5rem', sm: '0.56rem', md: '0.62rem' }
                                  }}
                                >
                                  {formatDate(update.updatedAt)}
                                </Typography>

                                {fileName && fileName !== "fake.txt" ? (
                                  <Button
                                    size="small"
                                    startIcon={<AttachFile fontSize="small" />}
                                    onClick={() => handleDownloadAttachment(update.attachmentFilePath)}
                                    sx={{ 
                                      minHeight: isDesktop ? undefined : 24,
                                      px: isDesktop ? undefined : 0.7,
                                      fontSize: isDesktop ? '0.7rem' : { xs: '0.5rem', sm: '0.56rem', md: '0.62rem' },
                                      color: colorPalette.primary,
                                      textTransform: 'none'
                                    }}
                                  >
                                    عرض المرفق
                                  </Button>
                                ) : null}
                              </Box>
                            </React.Fragment>
                          }
                        />
                      </ListItem>

                      {index < taskUpdates[currentTask?.id].length - 1 && (
                        <Divider
                          component="li"
                          sx={{
                            my: isDesktop ? 0.5 : 0.25,
                            ml: isDesktop ? 7 : 0
                          }}
                        />
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  height: isDesktop ? 100 : 80,
                  flexDirection: 'column',
                  color: colorPalette.textLight
                }}>
                  <CancelOutlined sx={{ fontSize: isDesktop ? 40 : 28, mb: 0.6 }} />
                  <Typography sx={{ fontSize: isDesktop ? undefined : '0.62rem' }}>
                    لا توجد تحديثات لهذه المهمة بعد
                  </Typography>
                </Box>
              )}
            </List>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            px: isDesktop ? 3 : { xs: 1, sm: 1.3, md: 1.8 },
            py: isDesktop ? 2 : { xs: 0.7, sm: 0.9, md: 1.2 }
          }}
        >
          <Button 
            onClick={handleCloseDialog}
            variant="contained"
            sx={{
              borderRadius: 2,
              minHeight: isDesktop ? undefined : 30,
              px: isDesktop ? undefined : { xs: 1.2, sm: 1.5, md: 2 },
              fontSize: isDesktop ? undefined : { xs: '0.56rem', sm: '0.64rem', md: '0.72rem' },
              backgroundColor: colorPalette.primary,
              '&:hover': {
                backgroundColor: colorPalette.primaryDark
              }
            }}
          >
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>

      {/* Public Task Dialog for Editing */}
      <PublicTaskDialog
        open={publicTaskDialogOpen}
        onClose={handleCloseEditDialog}
        mainTaskName={mainTaskName}
        setMainTaskName={setMainTaskName}
        mainTaskTime={mainTaskTime}
        setMainTaskTime={setMainTaskTime}
        taskUsers={taskUsers}
        handleTaskUsersChange={handleTaskUsersChange}
        disabled={false}
        isEditMode={true}
        taskToEdit={taskToEdit}
      />

      {/* Snackbar for notifications */}
     <Snackbar
  open={snackbar.open}
  autoHideDuration={6000}
  onClose={() => setSnackbar({ ...snackbar, open: false })}
  anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
>
  <Alert 
    onClose={() => setSnackbar({ ...snackbar, open: false })} 
    severity={snackbar.severity}
    sx={{ width: '100%' }}
  >
    {snackbar.message}
  </Alert>
</Snackbar>
      
      <Dialog
        open={statusSummaryDialog.open}
        onClose={handleCloseStatusSummary}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }
        }}
      >
        <DialogTitle sx={{ 
          backgroundColor: colorPalette.primary, 
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          py: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Analytics sx={{ marginInlineEnd: 1 }} />
            <Typography variant="h6" fontWeight={600}>
              إحصائيات حالة المهمة
            </Typography>
          </Box>
          <IconButton onClick={handleCloseStatusSummary} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        
        <DialogContent dividers sx={{ py: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ color: colorPalette.textDark }}>
            {statusSummaryDialog.task?.taskName}
          </Typography>
          
          <List sx={{ width: '100%' }}>
            {/* عرض المستخدمين الذين لديهم تحديثات */}
            {statusSummaryDialog.task && (() => {
              const updates = taskUpdates[statusSummaryDialog.task.id] || [];
              const latestUpdatesByUser = {};
              
              // تجميع أحدث تحديث لكل مستخدم
              updates.forEach(update => {
                if (!latestUpdatesByUser[update.updatedBy] || 
                    new Date(update.updatedAt) > new Date(latestUpdatesByUser[update.updatedBy].updatedAt)) {
                  latestUpdatesByUser[update.updatedBy] = update;
                }
              });

              // الحصول على جميع المستخدمين المعينين للمهمة
              let assignedUsers = [];
              try {
                assignedUsers = JSON.parse(statusSummaryDialog.task.assignedTo.replace(/\\/g, '') || '[]');
              } catch (error) {
                console.error("Error parsing assigned users:", error);
              }

              return (
                <>
                  {assignedUsers.map(user => {
                    const userUpdate = latestUpdatesByUser[user.guid];
                    const userDetails = getUserDetails(user.guid);
                    
                    return (
                      <ListItem key={user.guid} sx={{
                        borderInlineStart: `4px solid ${
                          userUpdate?.status === 2 ? colorPalette.success : 
                          userUpdate?.status === 3 ? colorPalette.error : 
                          userUpdate?.status === 1 ? colorPalette.primary : colorPalette.warning
                        }`,
                        mb: 1,
                        borderRadius: 1
                      }}>
                        <ListItemAvatar>
                          <Avatar sx={{ 
                            bgcolor: userUpdate ? colorPalette.primary : colorPalette.textLight,
                            width: 36, 
                            height: 36
                          }}>
                            {userDetails.avatar}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" fontWeight={600} sx={{ color: colorPalette.textDark }}>
                              {userDetails.name}
                            </Typography>
                          }
                          secondary={
                            userUpdate ? (
                              <Box>
                                <Chip
                                  label={taskStatusMap[userUpdate.status]?.text || "غير معروف"}
                                  size="small"
                                  color={taskStatusMap[userUpdate.status]?.color || "default"}
                                  sx={{ mb: 0.5 }}
                                />
                                <Typography variant="body2" sx={{ color: colorPalette.textLight }}>
                                  آخر تحديث: {formatDate(userUpdate.updatedAt)}
                                </Typography>
                                {userUpdate.statusNote && (
                                  <Typography variant="body2" sx={{ mt: 0.5, color: colorPalette.textDark }}>
                                    {userUpdate.statusNote}
                                  </Typography>
                                )}
                              </Box>
                            ) : (
                              <Chip
                                label="معلق"
                                color="warning"
                                size="small"
                                icon={<HourglassTop />}
                              />
                            )
                          }
                        />
                      </ListItem>
                    );
                  })}
                </>
              );
            })()}
          </List>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={handleCloseStatusSummary}
            variant="contained"
            sx={{
              borderRadius: 2,
              backgroundColor: colorPalette.primary,
              '&:hover': {
                backgroundColor: colorPalette.primaryDark
              }
            }}
          >
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default SentTasks;