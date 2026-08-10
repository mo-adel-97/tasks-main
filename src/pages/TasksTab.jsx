import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  Grid, 
  Paper, 
  Typography,
  Chip,
  Divider,
  IconButton,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
  Public as PublicIcon,
  Lock as PrivateIcon,
  Send as SendIcon,
  Checklist as ChecklistIcon,
  Groups as GroupsIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import ReceivedTasks from '../components/ReceivedTasks';
import SentTasks from '../components/SentTasks';
import PublicTaskDialog from '../components/PublicTaskDialog';
import AddTaskDailog from '../components/AddTaskDialog';

const DEPARTMENTS_API = "https://api3.sstli.com/api/Department/Load";
const USERS_API = "https://api1.sstli.com/api/userinfo";

const TASK_GROUPS = [
  { value: 1, label: "الإقامة", color: "#4caf50", icon: "🏠" },
  { value: 2, label: "الإجازات", color: "#2196f3", icon: "🌴" },
  { value: 3, label: "الشكاوي", color: "#ff9800", icon: "📝" },
  { value: 4, label: "الاشتراكات الثانوية", color: "#ff9800", icon: "📝" },
  { value: 5, label: "شئون الموظفين", color: "#ff9800", icon: "📝" },
  { value: 0, label: "أخرى", color: "#9e9e9e", icon: "📌" }
];

export default function TasksTab() {
  const currentUser = JSON.parse(localStorage.getItem('user')) || {};
  const currentBranch = currentUser.branchForWork;
  const userJop = currentUser.userJop; // Get userJop from current user

  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectTaskTypeOpen, setSelectTaskTypeOpen] = useState(false);
  const [taskType, setTaskType] = useState(null);
  const [publicDialogOpen, setPublicDialogOpen] = useState(false);
  const [privateDialogOpen, setPrivateDialogOpen] = useState(false);

  const [selectedDept, setSelectedDept] = useState([]);
  const [tasksForDept, setTasksForDept] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [taskUsers, setTaskUsers] = useState({});
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [mainTaskName, setMainTaskName] = useState('');
  const [mainTaskTime, setMainTaskTime] = useState(0);
  const [loadingTasks, setLoadingTasks] = useState(false);

  useEffect(() => {
    setLoadingDepts(true);
    fetch(DEPARTMENTS_API)
      .then(res => res.json())
      .then(data => setDepartments(data))
      .finally(() => setLoadingDepts(false));
  }, []);

  useEffect(() => {
    setLoadingUsers(true);
    fetch(USERS_API)
      .then(res => res.json())
      .then(data => setUsers(data))
      .finally(() => setLoadingUsers(false));
  }, []);

  useEffect(() => {
    setSelectedTasks([]);
    setTaskUsers({});
    setTasksForDept([]);
    if (!selectedDept || selectedDept.length === 0) return;

    setLoadingTasks(true);
    Promise.all(
      selectedDept.map(deptId =>
        fetch(`https://api3.sstli.com/api/Task/Load?departGuid=${deptId}`).then(res => res.json())
      )
    )
      .then(results => {
        const merged = results.flat().map(task => ({
          id: task.guid,
          title: task.taskName,
          time: task.taskTime,
          approvLevel: task.approvLevel,
          taskGroup: task.taskGroup || 0
        }));
        setTasksForDept(merged);
      })
      .finally(() => setLoadingTasks(false));
  }, [selectedDept]);

  const deptUsers = users.filter(user =>
    Array.isArray(selectedDept) && selectedDept.includes(user.departGuid) && user.branchForWork === currentBranch
  );

  const handleAddTask = () => {
    setTaskType(null);
    setSelectTaskTypeOpen(true);
  };

  const handleTaskCheck = (taskId) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
    setTaskUsers((prev) => {
      const updated = { ...prev };
      if (updated[taskId]) delete updated[taskId];
      return updated;
    });
  };

  const handleTaskUsersChange = (taskId, value) => {
    if (value.includes("all")) setTaskUsers((prev) => ({ ...prev, [taskId]: ["all"] }));
    else setTaskUsers((prev) => ({ ...prev, [taskId]: value.filter(v => v !== "all") }));
  };

  const sendDisabled =
    !mainTaskName.trim() ||
    selectedDept.length === 0 ||
    (taskType === "private" && (selectedTasks.length === 0 || selectedTasks.some(taskId => !taskUsers[taskId] || taskUsers[taskId].length === 0))) ||
    (taskType === "public" && (!taskUsers["default"] || taskUsers["default"].length === 0));

  const handleSendTask = () => {
    setPublicDialogOpen(false);
  };

  // Check if user can see public task option
  const canShowPublicTask = [0, 1, 2, 3, 9].includes(userJop);

  return (
    <Box
      sx={{
        p: { xs: 0.4, sm: 0.8, md: 1.4, lg: 2 },
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        overflowX: 'hidden',
        '& .MuiTypography-root': { overflowWrap: 'anywhere' },
        '& .MuiButton-root': {
          fontSize: { xs: '0.62rem', sm: '0.7rem', md: '0.8rem' }
        },
        '& .MuiChip-root': {
          fontSize: { xs: '0.56rem', sm: '0.64rem', md: '0.72rem' },
          height: { xs: 23, sm: 25, md: 28 }
        }
      }}
    >
      <Box sx={{ 
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'stretch', sm: 'center' },
        gap: { xs: 0.8, sm: 1.2, md: 1.8 },
        mb: { xs: 1.2, sm: 1.8, md: 2.6 }
      }}>
        <Typography variant="h4" fontWeight={800} color="primary.main" sx={{ fontSize: { xs: '0.98rem', sm: '1.2rem', md: '1.5rem' }, textAlign: { xs: 'center', sm: 'left' } }}>
          إدارة المهام
        </Typography>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleAddTask}
            startIcon={<AddIcon />}
            sx={{
              px: { xs: 2, sm: 3, md: 4 },
              py: { xs: 0.65, sm: 0.8, md: 1 },
              width: { xs: '100%', sm: 'auto' },
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)',
              fontWeight: 600,
              textTransform: 'none',
              fontSize: { xs: '0.78rem', sm: '0.9rem', md: '1rem' }
            }}
          >
            إضافة مهمة جديدة
          </Button>
        </motion.div>
      </Box>

      <ReceivedTasks currentUser={currentUser} />
      
      <Box sx={{ mt: { xs: 2.5, sm: 3.5, md: 4.5 }, mb: { xs: 1.5, sm: 2.5, md: 4 } }}>
        <Divider sx={{ mb: { xs: 1.2, sm: 1.8, md: 2.5 } }}>
          <Chip 
            icon={<ChecklistIcon />} 
            label="المهام المرسلة" 
            color="primary" 
            sx={{ px: 2, py: 1.5, fontSize: { xs: '0.68rem', sm: '0.78rem', md: '0.95rem' } }}
          />
        </Divider>
        <SentTasks currentUser={currentUser} />
      </Box>

      {/* Task Type Selection Dialog */}
      <Dialog 
        open={selectTaskTypeOpen} 
        onClose={() => setSelectTaskTypeOpen(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: '16px',
            background: 'linear-gradient(to bottom, #f8fafc, #ffffff)',
            minHeight: { xs: 'auto', sm: 420 },
            width: 'min(960px, calc(100vw - 24px))',
            maxWidth: '960px',
            m: { xs: 1, sm: 2 },
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'primary.main',
          color: 'white',
          py: { xs: 1, sm: 1.4, md: 1.7 },
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px'
        }}>
          <Typography variant="h5" fontWeight={600} sx={{ fontSize: { xs: '0.82rem', sm: '0.95rem', md: '1.1rem' } }}>
            اختر نوع المهمة
          </Typography>
          <IconButton 
            onClick={() => setSelectTaskTypeOpen(false)}
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ 
          p: { xs: 2, sm: 3, md: 4 },
          flex: 1,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Grid container spacing={{ xs: 2, md: 4 }} justifyContent="center" sx={{ maxWidth: '1000px', width: '100%', m: 0 }}>
            {/* Show public task option only for specific userJop values */}
            {/* {canShowPublicTask && ( */}
              <Grid item xs={12} md={5}>
                <motion.div 
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Paper
                    onClick={() => {
                      setTaskType("public");
                      setPublicDialogOpen(true);
                      setSelectTaskTypeOpen(false);
                    }}
                    elevation={0}
                    sx={{ 
                      p: { xs: 2.5, sm: 3.5, md: 4 }, 
                      cursor: "pointer", 
                      textAlign: "center", 
                      backgroundColor: "#e3f2fd",
                      borderRadius: '16px',
                      border: '2px solid rgba(25, 118, 210, 0.1)',
                      height: '100%',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      '&:hover': {
                        boxShadow: '0 12px 28px rgba(25, 118, 210, 0.2)',
                        backgroundColor: '#bbdefb',
                        borderColor: 'primary.light'
                      }
                    }}
                  >
                    <Box sx={{
                      width: { xs: 52, sm: 64, md: 76 },
                      height: { xs: 52, sm: 64, md: 76 },
                      borderRadius: '50%',
                      backgroundColor: 'rgba(25, 118, 210, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 3
                    }}>
                      <PublicIcon sx={{ 
                        fontSize: { xs: '1.6rem', sm: '2rem', md: '2.3rem' }, 
                        color: 'primary.main'
                      }} />
                    </Box>
                    <Typography variant="h5" fontWeight={600} color="primary.main" gutterBottom sx={{ fontSize: { xs: '0.82rem', sm: '0.95rem', md: '1.1rem' } }}>
                      مهمة عامة
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: { xs: 1, md: 1.5 }, fontSize: { xs: '0.64rem', sm: '0.72rem', md: '0.82rem' } }}>
                      إنشاء مهمة يدوية مخصصة لمستخدم أو مجموعة مستخدمين
                    </Typography>
                    <Chip 
                      label="اختيار"
                      color="primary"
                      size="small"
                      sx={{ mt: 2, fontWeight: 600 }}
                    />
                  </Paper>
                </motion.div>
              </Grid>
            {/* )} */}
            
            {/* <Grid item xs={12} md={5}>
              <motion.div 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <Paper
                  onClick={() => {
                    setTaskType("private");
                    setPrivateDialogOpen(true);
                    setSelectTaskTypeOpen(false);
                  }}
                  elevation={0}
                  sx={{ 
                    p: 4, 
                    cursor: "pointer", 
                    textAlign: "center", 
                    backgroundColor: "#f3e5f5",
                    borderRadius: '16px',
                    border: '2px solid rgba(156, 39, 176, 0.1)',
                    height: '100%',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    '&:hover': {
                      boxShadow: '0 12px 28px rgba(156, 39, 176, 0.2)',
                      backgroundColor: '#e1bee7',
                      borderColor: 'secondary.light'
                    }
                  }}
                >
                  <Box sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(156, 39, 176, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3
                  }}>
                    <PrivateIcon sx={{ 
                      fontSize: '2.5rem', 
                      color: 'secondary.main'
                    }} />
                  </Box>
                  <Typography variant="h5" fontWeight={600} color="secondary.main" gutterBottom>
                    مهمة خاصة
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                    توزيع المهام الجاهزة على المستخدمين حسب الأقسام
                  </Typography>
                  <Chip 
                    label="اختيار"
                    color="secondary"
                    size="small"
                    sx={{ mt: 2, fontWeight: 600 }}
                  />
                </Paper>
              </motion.div>
            </Grid> */}
          </Grid>
        </DialogContent>
      </Dialog>

      {/* Public Task Dialog */}
      {taskType === "public" && (
        <PublicTaskDialog
          open={publicDialogOpen}
          onClose={() => setPublicDialogOpen(false)}
          departments={departments}
          loadingDepts={loadingDepts}
          selectedDept={selectedDept}
          setSelectedDept={setSelectedDept}
          mainTaskName={mainTaskName}
          setMainTaskName={setMainTaskName}
          mainTaskTime={mainTaskTime}
          setMainTaskTime={setMainTaskTime}
          deptUsers={deptUsers}
          loadingUsers={loadingUsers}
          taskUsers={taskUsers}
          handleTaskUsersChange={handleTaskUsersChange}
          disabled={sendDisabled}
          onSubmit={handleSendTask}
        />
      )}

      {/* Private Task Dialog */}
      {taskType === "private" && (
        <AddTaskDailog
          open={privateDialogOpen}
          onClose={() => setPrivateDialogOpen(false)}
          currentUser={currentUser}
          users={users}
          currentBranch={currentBranch}
          taskGroups={TASK_GROUPS}
        />
      )}
    </Box>
  );
}