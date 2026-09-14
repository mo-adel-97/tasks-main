import * as uiLayout from './common/uiLayout';
import { SIDEBAR_DESKTOP_QUERY } from '../config/sidebarLayout';
import { navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from './NavigationShell';
import React, { useState, useEffect } from 'react';
import { 
  ExpandMore as ExpandMoreIcon, 
  CalendarMonth as CalendarMonthIcon, 
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  ArrowForward as ArrowForwardIcon,
  Visibility as VisibilityIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  CancelOutlined as CancelOutlinedIcon,
  AttachFile as AttachFileIcon,
  Close as CloseIcon,
  MenuRounded as MenuRoundedIcon
} from '@mui/icons-material';
import {
  Box, Typography, CircularProgress, Grid, Card, CardContent, CardActions,
  Button, Chip, Dialog, DialogTitle, DialogContent, IconButton, FormControl,
  InputLabel, Select, MenuItem, Stack, Popover, TextField, Autocomplete,
  Snackbar, Alert, Avatar, CardHeader, Divider, Tooltip,
  Pagination, useMediaQuery, useTheme, AppBar, Toolbar
} from '@mui/material';
import axios from 'axios';

import TaskStatusDialog from './DialogStutsChangePuplic';
import SentTasks from './SentTasksPuplic';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format } from 'date-fns';
import arLocale from 'date-fns/locale/ar-SA';
import NewTaskButton from './NewTaskButton';

const PUPLIC_TASKS_API = "https://api3.sstli.com/api/PuplicTask/GetPuplicTasksByQuery";  
const DOWNLOAD_API = "https://api3.sstli.com/api/PuplicTask/DownloadFile"; 
const TASK_UPDATES_API = "https://api3.sstli.com/api/PuplicTask/GetTaskUpdates";
const USERS_API = "https://api1.sstli.com/api/userinfo";
const PASSED_TASKS_API = "https://filesregsiteration.sstli.com/tasks/get_passed_tasks.php";
const UPDATE_STATUS_API = "https://api3.sstli.com/api/PuplicTask/UpdateTaskStatus";
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

function getUserFromStorage() {
  try {
    return JSON.parse(localStorage.getItem("user")) || {};
  } catch {
    return {};
  }
}

export default function AssignedTasks() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(SIDEBAR_DESKTOP_QUERY, { noSsr: true });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (isDesktop) {
      setMobileSidebarOpen(false);
    }
  }, [isDesktop]);

  const [tasks, setTasks] = useState([]);
  const [passedTasksData, setPassedTasksData] = useState([]);
  const [externalModifiedTasks, setExternalModifiedTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [externalLoading, setExternalLoading] = useState(true);
  const [openAttachment, setOpenAttachment] = useState(null);
  const currentUser = getUserFromStorage(); 
  const [now, setNow] = useState(Date.now());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarAnchorEl, setCalendarAnchorEl] = useState(null);
  const [filterByDate, setFilterByDate] = useState(true);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [statusNote, setStatusNote] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [statusTitle, setStatusTitle] = useState("");
  const [openUpdates, setOpenUpdates] = useState(false);
  const [AttachmentType, setAttachmentType] = useState('original');
  const [taskUpdates, setTaskUpdates] = useState({});
  const [openPassDialog, setOpenPassDialog] = useState(false);
  const [passNote, setPassNote] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [updatesDialogOpen, setUpdatesDialogOpen] = useState(false);
  const [selectedTaskUpdates, setSelectedTaskUpdates] = useState([]);
  const [selectedUser, setSelectedUser] = useState([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 6;

  // Fetch external tasks
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

const isTaskModifiedExternally = (taskId) => {
  const externalTask = externalModifiedTasks.find(externalTask => 
    parseInt(externalTask.TaskId) === parseInt(taskId)
  );
  
  if (!externalTask) return false;
  
  // تحقق مما إذا كان المستخدم الحالي موجوداً في AssignedTo الخارجي
  const externalAssignedTo = parseExternalAssignedTo(externalTask.AssignedTo);
  return externalAssignedTo.some(user => user.guid === currentUser.guid);
};

  // Get external task data
  const getExternalTaskData = (taskId) => {
    return externalModifiedTasks.find(externalTask => 
      parseInt(externalTask.TaskId) === parseInt(taskId)
    );
  };

  // Fetch tasks on component mount
useEffect(() => {
  const fetchTasks = async () => {
    try {
      // جلب جميع المهام العامة
      const response = await axios.get(PUPLIC_TASKS_API);
      
      // جلب بيانات المهام الممررة
      const passedResponse = await axios.get(`${PASSED_TASKS_API}?userGuid=${currentUser.guid}`);
      setPassedTasksData(passedResponse.data.success ? passedResponse.data.data : []);

      // جلب المهام المعدلة خارجياً
      const externalResponse = await axios.get(EXTERNAL_TASKS_API);
      const externalTasks = externalResponse.data.success ? externalResponse.data.data : [];
      setExternalModifiedTasks(externalTasks);

      // تصفية المهام التي تنتمي للمستخدم الحالي
      let filteredTasks = response.data.filter(task => {
        const isModifiedExternally = externalTasks.some(externalTask => 
          parseInt(externalTask.TaskId) === parseInt(task.id)
        );

        // إذا كانت المهمة معدلة خارجياً، تحقق من الـ assignedTo في البيانات الخارجية
        if (isModifiedExternally) {
          const externalTask = externalTasks.find(et => parseInt(et.TaskId) === parseInt(task.id));
          if (externalTask && externalTask.AssignedTo) {
            try {
              // محاولة تحليل AssignedTo من البيانات الخارجية
              const externalAssignedTo = typeof externalTask.AssignedTo === 'string' 
                ? JSON.parse(externalTask.AssignedTo) 
                : externalTask.AssignedTo;
              
              const isInExternalAssignedTo = Array.isArray(externalAssignedTo) && 
                externalAssignedTo.some(user => user.guid === currentUser.guid);
              
              return isInExternalAssignedTo;
            } catch (e) {
              console.error("Error parsing external AssignedTo:", e);
              // إذا فشل التحليل، استخدم المنطق الأصلي
            }
          }
          return false; // إذا لم يكن هناك AssignedTo في البيانات الخارجية، لا تعرض المهمة
        }

        // للمهام غير المعدلة خارجياً، استخدم المنطق الأصلي
        const assignedToString = task.assignedTo.replace(/\\/g, '');
        const assignedUsers = JSON.parse(assignedToString || '[]');
        const isDirectlyAssigned = assignedUsers.some(user => user.guid === currentUser.guid);
        
        const isPassedToUser = passedResponse.data.success && 
          passedResponse.data.data.some(passedTask => 
            passedTask.task_info.task_id === task.id.toString() &&
            passedTask.passing_history[passedTask.passing_history.length - 1].receiver_guid === currentUser.guid
          );
        
        return isDirectlyAssigned || isPassedToUser;
      });

      // إضافة معلومات تاريخ التمرير للمهام
      filteredTasks = filteredTasks.map(task => {
        const passedTaskInfo = passedResponse.data.success 
          ? passedResponse.data.data.find(pt => pt.task_info.task_id === task.id.toString())
          : null;
        
        const isModifiedExternally = externalTasks.some(externalTask => 
          parseInt(externalTask.TaskId) === parseInt(task.id)
        );
        
        return {
          ...task,
          passingHistory: passedTaskInfo ? passedTaskInfo.passing_history : null,
          isPassedTask: !!passedTaskInfo,
          isCurrentUserSender: passedTaskInfo 
            ? passedTaskInfo.passing_history.some(p => p.sender_guid === currentUser.guid)
            : false,
          isCurrentUserReceiver: passedTaskInfo
            ? passedTaskInfo.passing_history[passedTaskInfo.passing_history.length - 1].receiver_guid === currentUser.guid
            : false,
          isModifiedExternally: isModifiedExternally
        };
      });

      setTasks(filteredTasks || []);
      filterTasksByDate(filteredTasks, new Date());
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setTasks([]); 
      setFilteredTasks([]);
      setPassedTasksData([]);
    } finally {
      setLoading(false);
    }
  };

  fetchTasks();
}, [currentUser.guid]);

const parseExternalAssignedTo = (assignedToData) => {
  if (Array.isArray(assignedToData)) {
    return assignedToData;
  }
  
  if (typeof assignedToData === 'string') {
    try {
      return JSON.parse(assignedToData);
    } catch (e) {
      console.error("Error parsing AssignedTo string:", e);
      return [];
    }
  }
  
  return [];
};

  // Fetch users if current user is manager (userJop === 9)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(USERS_API);
        setUsers(response.data);
        const filtered = response.data.filter(user => 
          user.branchForWork === currentUser.branchForWork && 
          user.guid !== currentUser.guid
        );
        setFilteredUsers(filtered);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    if (currentUser.userJop === 9) {
      fetchUsers();
    }
  }, [currentUser.branchForWork, currentUser.userJop, currentUser.guid]);

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch task updates when tasks change
  useEffect(() => {
    const fetchTaskUpdates = async () => {
      const updates = {};
      const currentUserGuid = getUserFromStorage().guid;
  
      for (const task of tasks) {
        try {
          const response = await axios.get(`${TASK_UPDATES_API}/${task.id}`);
          updates[task.id] = response.data;
        } catch (error) {
          console.error(`Error fetching updates for task ${task.id}:`, error);
          updates[task.id] = [];
        }
      }
  
      setTaskUpdates(updates);
    };
  
    if (tasks.length > 0) {
      fetchTaskUpdates();
    }
  }, [tasks]);

  // Filter tasks by selected date
  const filterTasksByDate = (tasksToFilter, date) => {
    const filtered = tasksToFilter.filter(task => {
      const taskDate = new Date(new Date(task.createdAt).getTime() + 3 * 60 * 60 * 1000);
      const selected = new Date(date);
      return (
        taskDate.getDate() === selected.getDate() &&
        taskDate.getMonth() === selected.getMonth() &&
        taskDate.getFullYear() === selected.getFullYear()
      );
    });
    setFilteredTasks(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Calendar handlers
  const handleCalendarOpen = (event) => {
    setCalendarAnchorEl(event.currentTarget);
  };

  const handleCalendarClose = () => {
    setCalendarAnchorEl(null);
  };

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    filterTasksByDate(tasks, newDate);
    setFilterByDate(true);
    handleCalendarClose();
  };

  // Task filtering handlers
  const showAllTasks = () => {
    setFilterByDate(false);
    setFilteredTasks(tasks);
    setCurrentPage(1); // Reset to first page when showing all tasks
  };

  const showTodayTasks = () => {
    const today = new Date();
    setSelectedDate(today);
    filterTasksByDate(tasks, today);
    setFilterByDate(true);
  };

  // Calculate remaining time for a task (using external data if available)
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
    const timeLeft = Math.max(0, deadline - now);
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

  // Attachment handlers
  const handleDownloadAttachment = (attachmentPath) => {
    const fileName = attachmentPath.split("\\").pop();
    const fileUrl = `${DOWNLOAD_API}?fileName=${fileName}`;
    window.open(fileUrl, "_blank");
  };

  const handleOpenAttachment = (attachmentPath) => {
    const fileName = attachmentPath.split("\\").pop();
    const fileUrl = `${DOWNLOAD_API}?fileName=${fileName}`;
    setOpenAttachment(fileUrl);
    setAttachmentType('original');
  };

  const handleOpenAttachmentUpdates = (attachmentPath) => {
    const fileName = attachmentPath.split("\\").pop();
    const fileUrl = `https://api3.sstli.com/api/PuplicTask/DownloadTaskAttachment?fileName=${fileName}`;
    setOpenAttachment(fileUrl);
    setAttachmentType('update');
  };

  const handleCloseAttachment = () => {
    setOpenAttachment(null);
  };

  // Task status change handler - now updates the original task for everyone
  const handleChangeStatus = async (taskId, newStatus) => {
    try {
      await axios.put(`${UPDATE_STATUS_API}/${taskId}`, { 
        status: newStatus,
        updatedBy: currentUser.guid 
      });
      
      // Update task status in state
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId
            ? { ...task, status: newStatus }
            : task
        )
      );
      
      setSnackbarMessage("تم تحديث حالة المهمة بنجاح");
      setSnackbarOpen(true);
    } catch (err) {
      console.error("Error changing status:", err);
    }
  };

  // Task dialog handlers
  const handleOpenDialog = (task) => {
    setSelectedTask(task);
    setStatusNote("");
    setAttachment(null);
    let newStatusTitle = '';
    switch (task.status) {
      case 0: newStatusTitle = 'معلقة'; break;
      case 1: newStatusTitle = 'جاري التنفيذ'; break;
      case 2: newStatusTitle = 'مكتملة'; break;
      case 3: newStatusTitle = 'مرفوضة'; break;
      default: newStatusTitle = 'غير محددة';
    }
    setStatusTitle(newStatusTitle);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Task passing handlers
  const handleOpenPassDialog = (task) => {
    setSelectedTask(task);
    setSelectedUser([]);
    setPassNote("");
    setOpenPassDialog(true);
  };

  const handleClosePassDialog = () => {
    setOpenPassDialog(false);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handlePassTask = async () => {
    if (!selectedUser || selectedUser.length === 0 || !selectedTask) return;

    try {
      // إنشاء مصفوفة من وعود (promises) لكل عملية تمرير
      const passPromises = selectedUser.map(async (user) => {
        const taskData = {
          task_id: selectedTask.id,
          task_name: selectedTask.taskName,
          task_description: selectedTask.taskDescription,
          task_created_at: selectedTask.createdAt,
          task_deadline: new Date(new Date(selectedTask.createdAt).getTime() + selectedTask.taskTimeInMinutes * 60000),
          sender_guid: currentUser.guid,
          sender_name: currentUser.fullName,
          sender_department: currentUser.branchForWork,
          receiver_guid: user.guid,
          receiver_name: user.fullName,
          receiver_department: user.branchForWork,
          pass_note: passNote,
          original_attachment_filename: selectedTask.attachmentPath ? selectedTask.attachmentPath.split("\\").pop() : null,
          original_attachment_path: selectedTask.attachmentPath || null,
          original_attachment_size: null,
          status_at_pass_time: selectedTask.status === 0 ? 'Pending' : 
                              selectedTask.status === 1 ? 'In Progress' : 
                              selectedTask.status === 2 ? 'Completed' : 'Rejected'
        };

        return axios.post(
          'https://filesregsiteration.sstli.com/tasks/pass_task.php',
          taskData,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      });

      // تنفيذ جميع عمليات التمرير في نفس الوقت
      await Promise.all(passPromises);

      setSnackbarMessage(`تم تمرير المهمة إلى ${selectedUser.length} موظف بنجاح`);
      setSnackbarOpen(true);
      
      handleClosePassDialog();
      
      // تحديث قائمة المهام بعد التمرير
      const response = await axios.get(PUPLIC_TASKS_API);
      const passedResponse = await axios.get(`${PASSED_TASKS_API}?userGuid=${currentUser.guid}`);
      setPassedTasksData(passedResponse.data.success ? passedResponse.data.data : []);

      let filteredTasks = response.data.filter(task => {
        const assignedToString = task.assignedTo.replace(/\\/g, '');
        const assignedUsers = JSON.parse(assignedToString || '[]');
        const isDirectlyAssigned = assignedUsers.some(user => user.guid === currentUser.guid);
        const isPassedToUser = passedResponse.data.success && 
          passedResponse.data.data.some(passedTask => 
            passedTask.task_info.task_id === task.id.toString() &&
            passedTask.passing_history[passedTask.passing_history.length - 1].receiver_guid === currentUser.guid
          );
        return isDirectlyAssigned || isPassedToUser;
      });

      filteredTasks = filteredTasks.map(task => {
        const passedTaskInfo = passedResponse.data.success 
          ? passedResponse.data.data.find(pt => pt.task_info.task_id === task.id.toString())
          : null;
        
        return {
          ...task,
          passingHistory: passedTaskInfo ? passedTaskInfo.passing_history : null,
          isPassedTask: !!passedTaskInfo,
          isCurrentUserSender: passedTaskInfo 
            ? passedTaskInfo.passing_history.some(p => p.sender_guid === currentUser.guid)
            : false,
          isCurrentUserReceiver: passedTaskInfo
            ? passedTaskInfo.passing_history[passedTaskInfo.passing_history.length - 1].receiver_guid === currentUser.guid
            : false
        };
      });

      setTasks(filteredTasks || []);
      filterTasksByDate(filteredTasks, selectedDate);
    } catch (error) {
      console.error("Error passing task:", error);
      setSnackbarMessage("حدث خطأ أثناء تمرير المهمة");
      setSnackbarOpen(true);
    }
  };

  // Pagination logic
  const displayTasks = filterByDate ? filteredTasks : tasks;
  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = displayTasks.slice(indexOfFirstTask, indexOfLastTask);
  const totalPages = Math.ceil(displayTasks.length / tasksPerPage);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

if (loading || externalLoading) {
  return (
    <NavigationShell variant="standard" mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)}><>
      

      {!isDesktop && (
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1401,
            background: 'rgba(255,255,255,0.96)',
            backdropFilter: 'blur(14px)',
            color: '#17372b',
            borderBottom: '1px solid rgba(5,117,70,0.12)',
          }}
        >
          <Toolbar
            sx={{
              minHeight: {
                xs: "var(--app-header-height, 56px)",
                sm: "var(--app-header-height, 56px)",
                md: "var(--app-header-height, 56px)",
              },
              px: { xs: 0.8, sm: 1.2, md: 1.6 },
              gap: 0.8,
            }}
          >
            <IconButton
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setMobileSidebarOpen((current) => !current);
              }}
              aria-label={mobileSidebarOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
              aria-expanded={mobileSidebarOpen}
              sx={{
                width: { xs: 36, sm: 40, md: 42 },
                height: { xs: 36, sm: 40, md: 42 },
                flexShrink: 0,
                color: '#fff',
                background: 'linear-gradient(135deg, #057546, #034d31)',
                boxShadow: '0 6px 16px rgba(5,117,70,0.22)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #034d31, #057546)',
                },
              }}
            >
              <MenuRoundedIcon sx={{ fontSize: { xs: 20, sm: 22, md: 23 } }} />
            </IconButton>
          </Toolbar>
        </AppBar>
      )}

      <Box
        sx={{
          p: {
            xs: 1,
            sm: 1.25,
            md: 2
          },
          boxSizing: 'border-box',
          minWidth: 0,
          maxWidth: '100%',
          overflowX: 'hidden',
          ...navigationContentSx
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: isDesktop ? '50vh' : { xs: '38vh', sm: '42vh', md: '46vh' } 
        }}>
          <CircularProgress sx={{ color: colorPalette.primary }} />
        </Box>
      </Box>
    </></NavigationShell>
  );
}

  return (
    <NavigationShell variant="standard" mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)}><>
      

      {!isDesktop && (
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1401,
            background: 'rgba(255,255,255,0.96)',
            backdropFilter: 'blur(14px)',
            color: '#17372b',
            borderBottom: '1px solid rgba(5,117,70,0.12)',
          }}
        >
          <Toolbar
            sx={{
              minHeight: {
                xs: "var(--app-header-height, 56px)",
                sm: "var(--app-header-height, 56px)",
                md: "var(--app-header-height, 56px)",
              },
              px: { xs: 0.8, sm: 1.2, md: 1.6 },
              gap: 0.8,
            }}
          >
            <IconButton
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setMobileSidebarOpen((current) => !current);
              }}
              aria-label={mobileSidebarOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
              aria-expanded={mobileSidebarOpen}
              sx={{
                width: { xs: 36, sm: 40, md: 42 },
                height: { xs: 36, sm: 40, md: 42 },
                flexShrink: 0,
                color: '#fff',
                background: 'linear-gradient(135deg, #057546, #034d31)',
                boxShadow: '0 6px 16px rgba(5,117,70,0.22)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #034d31, #057546)',
                },
              }}
            >
              <MenuRoundedIcon sx={{ fontSize: { xs: 20, sm: 22, md: 23 } }} />
            </IconButton>
          </Toolbar>
        </AppBar>
      )}

      <Box
        sx={{
          p: isDesktop ? '20px' : {
            xs: 0.7,
            sm: 1,
            md: 1.35
          },
          pt: isDesktop ? '20px' : {
            xs: "var(--app-header-height, 56px)",
            sm: "var(--app-header-height, 56px)",
            md: "var(--app-header-height, 56px)"
          },
          pb: isDesktop ? '20px' : {
            xs: 1.5,
            sm: 2,
            md: 2.5
          },
          backgroundColor: colorPalette.background,
          boxSizing: 'border-box',
          minWidth: 0,
          maxWidth: '100%',
          overflowX: 'hidden',
          '& .MuiTypography-h4': {
            fontSize: isDesktop ? undefined : {
              xs: '0.88rem',
              sm: '1rem',
              md: '1.12rem'
            }
          },
          '& .MuiTypography-h6': {
            fontSize: isDesktop ? undefined : {
              xs: "0.75rem",
              sm: '0.76rem',
              md: '0.86rem'
            }
          },
          '& .MuiTypography-body2': {
            fontSize: isDesktop ? undefined : {
              xs: "0.75rem",
              sm: "0.75rem",
              md: "0.75rem"
            }
          },
          '& .MuiButton-root': {
            fontSize: isDesktop ? undefined : {
              xs: "0.75rem",
              sm: "0.75rem",
              md: "0.75rem"
            },
            minHeight: isDesktop ? undefined : {
              xs: 31,
              sm: 34,
              md: 36
            }
          },
          '& .MuiChip-root': {
            fontSize: isDesktop ? undefined : {
              xs: "0.75rem",
              sm: "0.75rem",
              md: "0.75rem"
            },
            height: isDesktop ? undefined : {
              xs: 23,
              sm: 25,
              md: 28
            }
          },
          '& .MuiInputBase-root, & .MuiInputLabel-root': {
            fontSize: isDesktop ? undefined : {
              xs: "0.75rem",
              sm: "0.75rem",
              md: '0.8rem'
            }
          },
          ...navigationContentSx
        }}
      >
        {/* Header section */}
        <Box sx={uiLayout.withUiSx({
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: isDesktop ? 'center' : { xs: 'stretch', md: 'center' },
          flexDirection: isDesktop ? 'row' : { xs: 'column', md: 'row' },
          flexWrap: isDesktop ? 'nowrap' : 'wrap',
          gap: isDesktop ? 0 : { xs: 0.8, sm: 1, md: 1.2 },
          mb: isDesktop ? 3 : { xs: 0.9, sm: 1.2, md: 1.6 }
        }, uiLayout.pageHeaderSx)}>
          <Typography variant="h4" gutterBottom fontWeight={700} sx={{ color: colorPalette.textDark }}>
            المهام الخاصة بك ({displayTasks.length})
          </Typography>
          
          <Box sx={uiLayout.withUiSx({
            display: 'flex',
            alignItems: isDesktop ? 'center' : 'stretch',
            flexDirection: isDesktop ? 'row' : { xs: 'column', sm: 'row' },
            gap: isDesktop ? 2 : { xs: 0.5, sm: 0.75, md: 1 },
            flexWrap: isDesktop ? 'nowrap' : 'wrap',
            justifyContent: isDesktop ? 'flex-start' : { xs: 'center', md: 'flex-start' },
            width: isDesktop ? 'auto' : { xs: '100%', md: 'auto' },
            '& > *': {
              width: isDesktop ? 'auto' : { xs: '100%', sm: 'auto' }
            }
          }, uiLayout.actionBarSx)}>
            {filterByDate ? (
              <>
                <Chip 
                  label={`${format(selectedDate, 'yyyy/MM/dd', { locale: arLocale })}`}
                  onDelete={showAllTasks}
                  sx={{ 
                    backgroundColor: colorPalette.primary,
                    color: 'white',
                    fontWeight: 600
                  }}
                />
                <Button variant="outlined" onClick={showAllTasks} sx={uiLayout.withUiSx({ color: colorPalette.primary, borderColor: colorPalette.primary }, uiLayout.buttonSx)}>
                  عرض جميع المهام
                </Button>
              </>
            ) : (
              <Button variant="outlined" onClick={showTodayTasks} sx={uiLayout.withUiSx({ color: colorPalette.primary, borderColor: colorPalette.primary }, uiLayout.buttonSx)}>
                عرض مهام اليوم
              </Button>
            )}
            
            <Button
              variant="outlined"
              startIcon={<CalendarMonthIcon />}
              onClick={handleCalendarOpen}
              sx={uiLayout.withUiSx({ fontWeight: 700, color: colorPalette.primary, borderColor: colorPalette.primary }, uiLayout.buttonSx)}
            >
              اختر تاريخ
            </Button>
          </Box>

          <Box sx={{ width: isDesktop ? 'auto' : { xs: '100%', sm: 'auto' } }}>
            <NewTaskButton
              buttonProps={{
                sx: {
                  width: isDesktop ? 'auto' : { xs: '100%', sm: 'auto' },
                  minHeight: isDesktop ? undefined : { xs: 32, sm: 34, md: 36 },
                  fontSize: isDesktop ? undefined : { xs: '0.58rem', sm: '0.66rem', md: '0.74rem' },
                }
              }}
            />
          </Box>
        </Box>

        {/* Calendar popover */}
        <Popover
          open={Boolean(calendarAnchorEl)}
          anchorEl={calendarAnchorEl}
          onClose={handleCalendarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={arLocale}>
            <DateCalendar
              value={selectedDate}
              onChange={handleDateChange}
              views={['year', 'month', 'day']}
              sx={{ width: isDesktop ? 320 : { xs: 280, sm: 310, md: 320 }, maxWidth: isDesktop ? 320 : '92vw' }}
            />
          </LocalizationProvider>
        </Popover>

        {/* Tasks list */}
        {displayTasks.length === 0 ? (
          <Typography sx={{ textAlign: 'center', mt: 4, color: colorPalette.textLight }}>
            {filterByDate
              ? `لا توجد مهام في التاريخ المحدد (${format(selectedDate, 'yyyy/MM/dd', { locale: arLocale })})`
              : 'لا توجد مهام متاحة حالياً'}
          </Typography>
        ) : (
          <>
            <Grid container spacing={isDesktop ? 3 : { xs: 1, sm: 1.5, md: 2 }}>
              {currentTasks.map(task => {
                const userUpdates = taskUpdates[task.id] || [];
                const lastUserUpdate = userUpdates[userUpdates.length - 1];
                
                // Check if task is modified externally
                const isModifiedExternally = isTaskModifiedExternally(task.id);
                const externalTaskData = isModifiedExternally ? getExternalTaskData(task.id) : null;
                

                const { hours, mins, secs, ended } = getRemainingTime(task);
                const created = new Date(task.createdAt);
                created.setTime(created.getTime() + 3 * 60 * 60 * 1000);
                
                const assignedBy = JSON.parse(task.assignedBy || '{}');
                const assignedByName = assignedBy ? assignedBy.fullName : "غير معروف";
                
                // Status chip configuration
                const chipConfig = {
                  0: { label: "معلقة", color: "warning", icon: <CancelOutlinedIcon /> },
                  1: { label: "جاري التنفيذ", color: "info", icon: <CheckCircleOutlineIcon /> },
                  2: { label: "مكتملة", color: "success", icon: <CheckCircleOutlineIcon /> },
                  3: { label: "مرفوضة", color: "error", icon: <CancelOutlinedIcon /> }
                };
                
                const statusInfo = lastUserUpdate ? 
                  chipConfig[lastUserUpdate.status] || chipConfig[0] : 
                  chipConfig[0];

                return (
                  <Grid item xs={12} sm={6} md={4} key={task.id}>
                    <Card sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 3,
                      boxShadow: ended ? "0 4px 20px 0 rgba(244, 67, 54, 0.2)" : "0 4px 20px 0 rgba(128, 180, 158, 0.2)",
                      border: ended ? `1px solid ${colorPalette.error}` : `1px solid ${colorPalette.primaryLighter}`,
                      transition: "transform 0.2s, box-shadow 0.2s",
                      "&:hover": { 
                        transform: "translateY(-5px)",
                        boxShadow: ended ? "0 6px 24px 0 rgba(244, 67, 54, 0.3)" : "0 6px 24px 0 rgba(128, 180, 158, 0.3)"
                      }
                    }}>
                      {/* Card header with task type and status */}
                      <CardHeader
                        avatar={
                          <Avatar sx={{ 
                            bgcolor: ended ? colorPalette.error : task.isPassedTask ? '#9c27b0' : colorPalette.primary,
                            width: isDesktop ? 40 : { xs: 30, sm: 34, md: 38 },
                            height: isDesktop ? 40 : { xs: 30, sm: 34, md: 38 },
                            fontSize: isDesktop ? '0.875rem' : { xs: "0.75rem", sm: "0.75rem", md: '0.82rem' }
                          }}>
                            {ended ? '!' : task.isPassedTask ? 'م' : 'ع'}
                          </Avatar>
                        }
                        action={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {isModifiedExternally && (
                              <Tooltip title="هذه المهمة معدلة">
                                <Chip
                                  icon={<ArrowForwardIcon />}
                                  label="معدلة"
                                  color="secondary"
                                  size="small"
                                  sx={{ mr: 1, mt: 1 }}
                                />
                              </Tooltip>
                            )}
                            <Chip 
                              icon={statusInfo.icon}
                              label={statusInfo.label}
                              color={statusInfo.color}
                              size="small"
                              sx={{ mt: 1 }}
                            />
                          </Box>
                        }
                        title={
                          <Typography variant="h6" fontWeight={700} sx={{ mt: 4, width: "100%", color: colorPalette.textDark }}>
                            {externalTaskData?.TaskName || task.taskName}
                            {task.isPassedTask && (
                              <Tooltip title="هذه المهمة ممررة" arrow>
                                <ArrowForwardIcon color="secondary" sx={{ ml: 1, fontSize: '1rem' }} />
                              </Tooltip>
                            )}
                          </Typography>
                        }
                        subheader={`تم الإنشاء: ${format(created, 'yyyy/MM/dd HH:mm', { locale: arLocale })}`}
                        sx={{ 
                          pb: 1,
                          borderBottom: `1px solid ${colorPalette.primaryLighter}`,
                          '& .MuiCardHeader-subheader': {
                            color: colorPalette.textLight,
                            fontSize: '0.8rem'
                          }
                        }}
                      />

                      {/* Card content */}
                      <CardContent sx={{ flexGrow: 1, py: isDesktop ? 2 : { xs: 1, sm: 1.25, md: 1.5 }, px: isDesktop ? 2 : { xs: 1, sm: 1.25, md: 1.5 } }}>
                        {/* Task description */}
                        <Box sx={{
                          mb: 2,
                          p: 2,
                          backgroundColor: colorPalette.primaryLighter,
                          borderRadius: 2,
                          borderInlineStart: `4px solid ${colorPalette.primary}`
                        }}>
                          <Typography variant="body2" sx={{ color: colorPalette.textDark }}>
                            {externalTaskData?.TaskDescription || task.taskDescription || "لا يوجد وصف للمهمة"}
                          </Typography>
                        </Box>

                        {/* Assigned by */}
                      {task.isModifiedExternally ? (
  // عرض AssignedTo من البيانات الخارجية
  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
    <Typography variant="body2" sx={{ mr: 1, color: colorPalette.textLight }}>
      مرسل المهمة (معدل):
    </Typography>
    <Typography variant="body2" fontWeight="bold" sx={{ color: colorPalette.primary }}>
      {(() => {
        const externalTask = getExternalTaskData(task.id);
        const externalAssignedTo = parseExternalAssignedTo(externalTask?.AssignedTo);
        const assignedUser = externalAssignedTo.find(user => user.guid === currentUser.guid);
        return assignedUser ? assignedUser.fullName : "غير معروف";
      })()}
    </Typography>
  </Box>
) : (
  // عرض AssignedTo من البيانات الداخلية
  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
    <Typography variant="body2" sx={{ mr: 1, color: colorPalette.textLight }}>
      {task.isPassedTask ? 'مرسل المهمة الأصلي:' : 'مرسل المهمة:'}
    </Typography>
    <Typography variant="body2" fontWeight="bold" sx={{ color: colorPalette.primary }}>
      {assignedByName}
    </Typography>
  </Box>
)}

                        {/* Passing history for passed tasks */}
                        {task.isPassedTask && task.passingHistory && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold', color: colorPalette.textDark }}>
                              تاريخ التمرير:
                            </Typography>
                            <Box sx={{ 
                              maxHeight: 120, 
                              overflowY: 'auto',
                              p: 1,
                              backgroundColor: colorPalette.primaryLighter,
                              borderRadius: 1
                            }}>
                              {task.passingHistory.map((pass, index) => (
                                <Box key={index} sx={{ mb: 1 }}>
                                  <Typography variant="caption" display="block">
                                    {format(new Date(pass.pass_timestamp), 'yyyy/MM/dd HH:mm', { locale: arLocale })}
                                  </Typography>
                                  <Typography variant="caption" display="block" sx={{ color: colorPalette.textLight }}>
                                    {pass.sender_guid === currentUser.guid ? (
                                      `لقد مررت هذه المهمة إلى ${pass.receiver_name}`
                                    ) : pass.receiver_guid === currentUser.guid ? (
                                      `تم استلامها من ${pass.sender_name}`
                                    ) : (
                                      `تم تمريرها من ${pass.sender_name} إلى ${pass.receiver_name}`
                                    )}
                                  </Typography>
                                  {pass.pass_note && (
                                    <Typography variant="caption" display="block" sx={{ color: colorPalette.textLight, fontStyle: 'italic' }}>
                                      ملاحظة: {pass.pass_note}
                                    </Typography>
                                  )}
                                  {index < task.passingHistory.length - 1 && <Divider sx={{ my: 1 }} />}
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        )}

                        {/* External modification info */}
                        {isModifiedExternally && externalTaskData?.ModifiedDate && (
                          <Box sx={{ 
                            mb: 2,
                            p: 1.5,
                            backgroundColor: '#f3e5f5',
                            borderRadius: 2,
                            borderInlineStart: '4px solid #9c27b0'
                          }}>
                            <Typography variant="body2" fontWeight="bold" color="secondary.main">
                              آخر تعديل خارجي: {format(new Date(externalTaskData.ModifiedDate), 'yyyy/MM/dd HH:mm', { locale: arLocale })}
                            </Typography>
                          </Box>
                        )}

                        {/* Time remaining */}
                        <Box sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 1.5,
                          backgroundColor: ended ? '#ffeeee' : colorPalette.primaryLighter,
                          borderRadius: 2,
                          mb: 2
                        }}>
                          <Typography variant="body2" fontWeight="bold" sx={{ color: colorPalette.textDark }}>
                            الوقت المتبقي:
                          </Typography>
                          <Typography variant="body2" fontWeight="bold" color={ended ? "error" : colorPalette.primary}>
                            {`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`}
                            {ended && " (انتهت)"}
                          </Typography>
                        </Box>

                        {/* Task duration */}
                        <Box sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 1,
                          backgroundColor: colorPalette.primaryLighter,
                          borderRadius: 2,
                          mb: 2
                        }}>
                          <Typography variant="body2" fontWeight="bold" sx={{ color: colorPalette.textDark }}>
                            مدة المهمة:
                          </Typography>
                          <Typography variant="body2" fontWeight="bold" sx={{ color: colorPalette.primary }}>
                            {(externalTaskData?.TaskTimeInMinutes || task.taskTimeInMinutes)} ساعة
                          </Typography>
                        </Box>

                        {/* Attachment button */}
                        {(task.allowAttach && task.attachmentPath) || externalTaskData?.AttachFileName ? (
                          <Button
                            fullWidth
                            startIcon={<AttachFileIcon />}
                            sx={uiLayout.withUiSx({
                              mb: 2,
                              backgroundColor: colorPalette.primaryLighter,
                              color: colorPalette.primary,
                              '&:hover': {
                                backgroundColor: colorPalette.primaryLight
                              }
                            }, uiLayout.buttonSx)}
                            onClick={() => handleOpenAttachment(externalTaskData?.AttachFileName || task.attachmentPath)}
                          >
                            عرض المرفق
                          </Button>
                        ) : null}

                        {/* Task updates */}
                        <Box sx={{ mt: 2 }}>
                          <Button
                            fullWidth
                            endIcon={<VisibilityIcon />}
                            onClick={() => {
                              setSelectedTaskUpdates(taskUpdates[task.id] || []);
                              setUpdatesDialogOpen(true);
                            }}
                            sx={uiLayout.withUiSx({
                              textTransform: 'none',
                              color: colorPalette.textLight,
                              justifyContent: 'space-between'
                            }, uiLayout.buttonSx)}
                          >
                            عرض التحديثات ({taskUpdates[task.id]?.length || 0})
                          </Button>
                        </Box>
                      </CardContent>

                      {/* Card actions */}
                      <CardActions sx={{
                        justifyContent: 'space-between',
                        flexDirection: isDesktop ? 'row' : { xs: 'column', sm: 'row' },
                        alignItems: isDesktop ? 'center' : { xs: 'stretch', sm: 'center' },
                        gap: isDesktop ? 0 : { xs: 0.7, sm: 1 },
                        p: isDesktop ? 2 : { xs: 0.8, sm: 1.1, md: 1.4 },
                        borderTop: `1px solid ${colorPalette.primaryLighter}`,
                        backgroundColor: colorPalette.primaryLighter
                      }}>
                        {ended ? (
                          <Typography variant="body2" sx={{ color: colorPalette.textLight, fontStyle: 'italic' }}>
                            المهمة انتهت، لا يمكن تعديل الحالة
                          </Typography>
                        ) : (
                          <>
                            <FormControl sx={uiLayout.withUiSx({ minWidth: 120 }, uiLayout.formFieldSx)} size="small">
                              <InputLabel>تغيير الحالة</InputLabel>
                              <Select
                                value={task.status}
                                onChange={(e) => {
                                  const newStatus = e.target.value;
                                  handleChangeStatus(task.id, newStatus);
                                  setSelectedTask(task);
                                  setStatusNote("");
                                  setAttachment(null);
                                  setOpenDialog(true);
                                  setStatusTitle(newStatus);
                                }}
                                label="تغيير الحالة"
                              >
                                <MenuItem value={0}>معلقة</MenuItem>
                                <MenuItem value={1}>جاري التنفيذ</MenuItem>
                                <MenuItem value={2}>مكتملة</MenuItem>
                                <MenuItem value={3}>مرفوضة</MenuItem>
                              </Select>
                            </FormControl>
                            
                            {(currentUser.userJop === 9 || task.isCurrentUserSender) && (
                              <Button sx={uiLayout.buttonSx}
                                variant="contained"
                                color="secondary"
                                startIcon={<SendIcon />}
                                onClick={() => handleOpenPassDialog(task)}
                                size="small"
                              >
                                تمرير المهمة
                              </Button>
                            )}
                          </>
                        )}
                      </CardActions>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination 
                  count={totalPages} 
                  page={currentPage} 
                  onChange={handlePageChange} 
                  color="primary" 
                  size="large"
                  showFirstButton 
                  showLastButton
                />
              </Box>
            )}
          </>
        )}
      </Box>

      {/* Attachment dialog */}
      <Dialog sx={uiLayout.dialogLayoutSx} open={!!openAttachment} onClose={handleCloseAttachment} maxWidth="md" fullWidth>
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          backgroundColor: colorPalette.primaryLighter,
          borderBottom: `1px solid ${colorPalette.primaryLighter}`,
          color: colorPalette.textDark
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AttachFileIcon sx={{ marginInlineEnd: 1, color: colorPalette.primary }} />
            <span>عرض المرفق</span>
          </Box>
          <IconButton onClick={handleCloseAttachment}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            minHeight: '400px'
          }}>
            <iframe
              src={openAttachment}
              style={{ 
                width: '100%', 
                height: '400px', 
                border: `1px solid ${colorPalette.primaryLighter}`,
                borderRadius: '4px'
              }}
              title="Attachment"
            />
            <Button 
              href={openAttachment} 
              download 
              variant="contained" 
              sx={uiLayout.withUiSx({ mt: 3, backgroundColor: colorPalette.primary }, uiLayout.buttonSx)}
              startIcon={<AttachFileIcon />}
            >
              تحميل الملف
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Task status dialog */}
      <TaskStatusDialog
        open={openDialog}
        onClose={handleCloseDialog}
        task={selectedTask}
        statusNote={statusNote}
        setStatusNote={setStatusNote}
        attachment={attachment}
        setAttachment={setAttachment}
        statusTitle={statusTitle}
      />

      {/* Pass task dialog */}
      <Dialog sx={uiLayout.dialogLayoutSx} open={openPassDialog} onClose={handleClosePassDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          backgroundColor: colorPalette.primaryLighter,
          borderBottom: `1px solid ${colorPalette.primaryLighter}`,
          color: colorPalette.textDark
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SendIcon sx={{ marginInlineEnd: 1, color: colorPalette.primary }} />
            <span>تمرير المهمة إلى موظفين آخرين</span>
          </Box>
          <IconButton onClick={handleClosePassDialog}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={uiLayout.withUiSx({ mt: 2 }, uiLayout.formGridSx)}>
            <Autocomplete
              multiple
              options={filteredUsers}
              getOptionLabel={(option) => option.fullName}
              value={selectedUser || []}
              onChange={(event, newValue) => setSelectedUser(newValue)}
              renderInput={(params) => (
                <TextField InputLabelProps={{ shrink: true }}
                  {...params}
                  label="اختر الموظفين"
                  variant="outlined"
                  fullWidth
                  sx={uiLayout.withUiSx({ mb: 2 }, uiLayout.formFieldSx)}
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar 
                    sx={{ 
                      width: 32, 
                      height: 32, 
                      marginInlineEnd: 1,
                      backgroundColor: stringToColor(option.fullName)
                    }}
                  >
                    {option.fullName.split(' ').map(n => n[0]).join('')}
                  </Avatar>
                  {option.fullName}
                </Box>
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option.guid}
                    avatar={<Avatar src={option.photo} alt={option.fullName} />}
                    label={option.fullName}
                    size="small"
                  />
                ))
              }
            />

            <TextField InputLabelProps={{ shrink: true }}
              label="ملاحظة (اختياري)"
              variant="outlined"
              fullWidth
              multiline
              rows={3}
              sx={uiLayout.withUiSx({ mt: 2 }, uiLayout.formFieldSx)}
              value={passNote}
              onChange={(e) => setPassNote(e.target.value)}
              placeholder="أضف أي ملاحظات أو تعليمات للموظفين..."
            />

            <Box sx={uiLayout.withUiSx({ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              mt: 3,
              pt: 2,
              borderTop: `1px solid ${colorPalette.primaryLighter}`
            }, uiLayout.actionBarSx)}>
              <Button
                variant="outlined"
                onClick={handleClosePassDialog}
                sx={uiLayout.withUiSx({ mr: 2, color: colorPalette.primary, borderColor: colorPalette.primary }, uiLayout.buttonSx)}
              >
                إلغاء
              </Button>
              <Button
                variant="contained"
                sx={uiLayout.withUiSx({ backgroundColor: colorPalette.primary }, uiLayout.buttonSx)}
                onClick={handlePassTask}
                disabled={!selectedUser || selectedUser.length === 0}
                startIcon={<SendIcon />}
              >
                تأكيد التمرير ({selectedUser?.length || 0})
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Success snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
          icon={<CheckCircleIcon fontSize="inherit" />}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <SentTasks tasks={tasks} />
      
      {/* Task Updates Dialog */}
      <Dialog sx={uiLayout.dialogLayoutSx} 
        open={updatesDialogOpen} 
        onClose={() => setUpdatesDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          backgroundColor: colorPalette.primaryLighter,
          borderBottom: `1px solid ${colorPalette.primaryLighter}`,
          color: colorPalette.textDark
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CheckCircleOutlineIcon sx={{ marginInlineEnd: 1, color: colorPalette.primary }} />
            <span>سجل التحديثات</span>
          </Box>
          <IconButton onClick={() => setUpdatesDialogOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ 
            maxHeight: '60vh',
            mt:"20px",
            overflowY: 'auto',
            pr: 2
          }}>
            {selectedTaskUpdates.length === 0 ? (
              <Typography sx={{ textAlign: 'center', py: 4, color: colorPalette.textLight }}>
                لا توجد تحديثات متاحة
              </Typography>
            ) : (
              <Stack spacing={3}>
                {selectedTaskUpdates.map((update, index) => {
                  const fileName = update.attachmentFilePath?.split("\\").pop();
                  const updatedByUser = users.find(user => user.guid === update.updatedBy) || 
                                      { fullName: '' };
                  
                  let statusText = '';
                  let statusColor = '';
                  switch(update.status) {
                    case 0: 
                      statusText = 'معلقة';
                      statusColor = colorPalette.warning;
                      break;
                    case 1: 
                      statusText = 'جاري التنفيذ';
                      statusColor = colorPalette.primary;
                      break;
                    case 2: 
                      statusText = 'مكتملة';
                      statusColor = colorPalette.success;
                      break;
                    case 3: 
                      statusText = 'مرفوضة';
                      statusColor = colorPalette.error;
                      break;
                    default:
                      statusText = 'غير محددة';
                      statusColor = colorPalette.textLight;
                  }
                  
                  return (
                    <Box 
                      key={index} 
                      sx={{ 
                        p: 3,
                        border: `1px solid ${colorPalette.primaryLighter}`,
                        borderRadius: 2,
                        backgroundColor: 'white',
                        position: 'relative'
                      }}
                    >
                      {/* Status badge */}
                      <Box sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        backgroundColor: statusColor,
                        color: 'white',
                        px: 2,
                        py: 0.5,
                        borderRadius: '0 0 4px 0',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                      }}>
                        {statusText}
                      </Box>
                      
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ color: colorPalette.textDark }}>
                          التحديث #{index + 1}
                        </Typography>
                        
                        <Typography variant="body2" sx={{ mt: 2, color: colorPalette.textDark }}>
                          {update.statusNote || "لا توجد ملاحظات"}
                        </Typography>
                        
                        {fileName && fileName.toLowerCase() !== "fake.txt" && (
                          <Button
                            size="small"
                            variant="outlined"
                            sx={uiLayout.withUiSx({ 
                              color: colorPalette.primary,
                              borderColor: colorPalette.primary,
                              mt: 2 
                            }, uiLayout.buttonSx)}
                            startIcon={<AttachFileIcon fontSize="small" />}
                            onClick={() => handleOpenAttachmentUpdates(update.attachmentFilePath)}
                          >
                            {fileName}
                          </Button>
                            )}
                        
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          mt: 2,
                          pt: 2,
                          borderTop: `1px dashed ${colorPalette.primaryLighter}`
                        }}>
                          <Typography variant="caption" sx={{ color: colorPalette.textLight }}>
                            {format(new Date(update.updatedAt), 'yyyy/MM/dd HH:mm', { locale: arLocale })}
                          </Typography>
                          <Typography variant="caption" sx={{ color: colorPalette.textLight, fontStyle: 'italic' }}>
                            تم بواسطة: {updatedByUser.fullName}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </></NavigationShell>
  );
}

// Helper function to generate color from string
function stringToColor(string) {
  let hash = 0;
  let i;

  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = '#';

  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }

  return color;
}