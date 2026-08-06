import React, { useEffect, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Box, Button, IconButton, Divider, TextField,
  Typography, Tooltip, Paper, MenuItem, Grid, Avatar, Chip, CircularProgress, Fade, Zoom, Grow,
  Slide, Collapse, Autocomplete, ListItemAvatar, ListItemText
} from "@mui/material";
import {
  Close as CloseIcon,
  AttachFile as AttachFileIcon,
  Delete as DeleteIcon,
  ArrowBackIosNew as ArrowBackIosNewIcon,
  Assignment as AssignmentIcon,
  AccessTime as AccessTimeIcon,
  Business as BusinessIcon,
  Description as DescriptionIcon,
  Send as SendIcon,
  People as PeopleIcon,
  Notes as NotesIcon,
  Schedule as ScheduleIcon
} from "@mui/icons-material";
import Swal from "sweetalert2";
import axios from "axios";
import { motion } from "framer-motion";

const TASKS_API = "https://api3.sstli.com/api/NewTasks";
const DEPTS_API = "https://api3.sstli.com/api/Department/Load";
const USERS_API = "https://api1.sstli.com/api/userinfo";

const getApprovalLevelColor = (level) => {
  switch(level) {
    case 0: return '#4caf50'; // Executive - green
    case 1: return '#2196f3'; // General supervision - blue
    case 2: return '#ff9800'; // Branch supervisor - orange
    default: return '#9e9e9e'; // Default - gray
  }
};



const GroupCard = ({ group, selected, onClick }) => (
  <motion.div 
    whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
    whileTap={{ scale: 0.98 }}
    transition={{ type: "spring", stiffness: 300 }}
  >
    <Paper
      onClick={onClick}
      sx={{
        p: 3,
        cursor: "pointer",
        textAlign: "center",
        backgroundColor: selected ? "#e3f2fd" : "#f5f5f5",
        border: selected ? "2px solid #1976d2" : "1px solid rgba(0,0,0,0.1)",
        borderRadius: "12px",
        minWidth: 150,
        height: "100%",
        transition: "all 0.3s cubic-bezier(.25,.8,.25,1)",
        boxShadow: selected ? "0 4px 8px rgba(25,118,210,0.2)" : "0 2px 4px rgba(0,0,0,0.05)",
        "&:hover": {
          borderColor: "#1976d2"
        }
      }}
    >
      <Box sx={{ 
        fontSize: "2.5rem",
        mb: 1.5,
        transition: "transform 0.3s ease",
        transform: selected ? "scale(1.1)" : "scale(1)"
      }}>
        {group.icon}
      </Box>
      <Typography variant="subtitle1" fontWeight={600}>{group.label}</Typography>
    </Paper>
  </motion.div>
);

const TaskCard = ({ task, selected, onClick,getDeptName  }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    whileHover={{ scale: 1.02 }}
  >
    <Paper
      onClick={onClick}
      elevation={selected ? 6 : 2}
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        border: selected ? '2px solid #1976d2' : '1px solid rgba(0,0,0,0.1)',
        borderRadius: '12px',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(.25,.8,.25,1)',
        height: '100%',
        "&:hover": {
          boxShadow: '0 6px 12px rgba(0,0,0,0.1)'
        }
      }}
    >
      <Box sx={{ 
        backgroundColor: getApprovalLevelColor(task.approveLevel),
        color: 'white',
        p: 1.5,
        textAlign: 'center',
        position: 'relative'
      }}>
        <Typography variant="subtitle2" fontWeight={600}>
          {task.approveLevel === 0 ? "الإدارة التنفيذية" :
           task.approveLevel === 1 ? "الإشراف العام" :
           task.approveLevel === 2 ? "مشرف الفرع" : "تنفذ مباشرة"}
        </Typography>
        {selected && (
          <Box sx={{
            position: 'absolute',
            top: -10,
            right: -10,
            width: 30,
            height: 30,
            backgroundColor: '#1976d2',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Box>
        )}
      </Box>
      
      <Box sx={{ p: 2.5, flexGrow: 1 }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
          {task.name}
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 2,
          backgroundColor: 'rgba(25, 118, 210, 0.08)',
          p: 1,
          borderRadius: '6px'
        }}>
          <Avatar sx={{ 
            width: 32, 
            height: 32, 
            fontSize: '0.9rem',
            backgroundColor: '#e3f2fd',
            color: '#1976d2',
            mr: 2
          }}>
            {task.timeForDone}
          </Avatar>
          <Box>
            <Typography variant="caption" color="textSecondary">مدة التنفيذ</Typography>
            <Typography variant="body2" fontWeight={600}>{task.timeForDone} ساعة</Typography>
          </Box>
        </Box>
        
        <Chip 
          label={getDeptName(task.doneDepartGuid)}
          size="small"
          sx={{ 
            backgroundColor: '#e8f5e9',
            color: '#2e7d32',
            mb: 2,
            height: '28px',
            fontSize: '0.8rem',
            fontWeight: 500
          }}
        />
        
        <Typography 
          variant="body2" 
          color="textSecondary" 
          sx={{ 
            mt: 2, 
            lineHeight: 1.6,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {task.description || "لا يوجد وصف للمهمة"}
        </Typography>
      </Box>
    </Paper>
  </motion.div>
);

export default function AddTaskDailog({
  open,
  onClose,
  currentUser,
  users: usersProp,
  currentBranch,
  taskGroups
}) {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [attachmentFiles, setAttachmentFiles] = useState({});
  const [taskUsers, setTaskUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [possibleReceivers, setPossibleReceivers] = useState([]);
  const [notes, setNotes] = useState("");
  const [requiredExecutionTime, setRequiredExecutionTime] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showTasks, setShowTasks] = useState(false);
  const [templates, setTemplates] = useState([]);

  // Load Departments
  useEffect(() => {
    axios.get(DEPTS_API)
      .then(res => setDepartments(res.data || []))
      .catch(() => setDepartments([]));
  }, []);

  useEffect(() => {
    axios.get('https://filesregsiteration.sstli.com/GetTemplates.php')
      .then(res => {
        if(res.data.success){
          setTemplates(res.data.data); // البيانات كلها من الجدول
        }
      })
      .catch(err => console.error(err));
  }, []);
  // Load ALL users once
  useEffect(() => {
    axios.get(USERS_API)
      .then(res => setAllUsers(res.data || []))
      .catch(() => setAllUsers([]));
  }, []);

  // Load Tasks for current dept
  useEffect(() => {
    if (open && currentUser?.departGuid) {
      setLoading(true);
      axios.get(TASKS_API)
        .then(res => {
          const filteredTasks = (res.data || []).filter(t => t.departGuid === currentUser.departGuid);
          setTasks(filteredTasks);
          setFilteredTasks(filteredTasks);
        })
        .catch(() => {
          setTasks([]);
          setFilteredTasks([]);
        })
        .finally(() => setLoading(false));
      setSelectedTask(null);
      setAttachmentFiles({});
      setTaskUsers([]);
      setNotes("");
      setRequiredExecutionTime("");
      setPossibleReceivers([]);
      setSelectedGroup(null);
      setShowTasks(false);
    }
  }, [open, currentUser]);

  const handleGroupSelect = (groupValue) => {
    setSelectedGroup(groupValue);
    setShowTasks(true);
    if (groupValue === null) {
      setFilteredTasks(tasks);
    } else {
      setFilteredTasks(tasks.filter(task => task.taskGroup === groupValue));
    }
  };

  const getDeptName = guid => {
    if (!guid) return "";
    const dep = departments.find(d => d.guid === guid);
    return dep ? dep.departName : guid;
  };

  const handleTaskSelect = (task) => {
    setSelectedTask(task);
    setAttachmentFiles({});
    setTaskUsers([]);
    setNotes("");
    setRequiredExecutionTime("");
    
    let receivers = [];
    if (task.approveLevel === 0) {
      receivers = allUsers.filter(u => [0, 1].includes(u.userJop));
    } else if (task.approveLevel === 1) {
      receivers = allUsers.filter(u => u.userJop === 2);
    } else if (task.approveLevel === 2) {
      receivers = allUsers.filter(u => u.userJop === 9);
    } else {
      receivers = allUsers.filter(u => u.departGuid === task.doneDepartGuid);
    }
    setPossibleReceivers(receivers);
  };

  const handleFileChange = (attachmentId, file) => {
    setAttachmentFiles(prev => ({ ...prev, [attachmentId]: file }));
  };
  
  const handleRemoveFile = (attachmentId) => {
    setAttachmentFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[attachmentId];
      return newFiles;
    });
  };


  const handleSubmit = async () => {
    if (!selectedTask) {
      Swal.fire({ icon: "error", text: "اختر مهمة أولاً." });
      return;
    }
    if (taskUsers.length === 0) {
      Swal.fire({ icon: "error", text: "اختر على الأقل موظف واحد لاستلام المهمة." });
      return;
    }
  
    let execTime = requiredExecutionTime;
    if (!execTime || isNaN(execTime) || Number(execTime) <= 0) {
      execTime = selectedTask?.timeForDone ?? 1;
    }
  
    // --------- تحميل ملفات المرفقات التوضيحية ---------
    let newAttachmentFiles = { ...attachmentFiles };
  
    const attachmentsToAutoDownload = selectedTask.attachments
      .filter(att => {
        const matchedTemplate = templates?.find(temp =>
          temp.taskName === selectedTask.name && temp.templateName === att.name
        );
        return matchedTemplate;
      });
  
    for (const att of attachmentsToAutoDownload) {
      if (!newAttachmentFiles[att.id]) {
        const matchedTemplate = templates?.find(temp =>
          temp.taskName === selectedTask.name && temp.templateName === att.name
        );
        if (!matchedTemplate) {
          console.warn("No template found for attachment", att.name);
          continue;
        }
        const url = `https://filesregsiteration.sstli.com/${matchedTemplate.filePath}`;
        try {
          console.log("Trying to download template file:", url);
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const blob = await response.blob();
          const filename = url.split('/').pop();
          const file = new File([blob], filename, { type: blob.type });
          newAttachmentFiles[att.id] = file;
        } catch (e) {
          console.error("Failed to download", url, e);
          Swal.fire({
            icon: "error",
            title: "خطأ في تحميل أحد المرفقات التوضيحية",
            html: `
              <div>تعذر تحميل المرفق <b>${att.name}</b></div>
              <div style="word-break: break-all; font-size: 12px; margin-top: 10px">
                الرابط: <span dir="ltr">${url}</span><br>
                <span style="color: #d32f2f">${e.message}</span>
              </div>
              <div style="margin-top: 10px; font-size: 12px">جرب تحميل الملف يدويًا أو تواصل مع مسؤول النظام.</div>
            `,
          });
          return;
        }
      }
    }
    // --------- نهاية الجزء الجديد ---------
  
    // تحقق من وجود كل المرفقات الضرورية
    if (selectedTask?.attachments?.length > 0) {
      const missingRequired = selectedTask.attachments
        .filter(a => a.isRequired)
        .find(a => !newAttachmentFiles[a.id]);
      if (missingRequired) {
        Swal.fire({
          icon: "error",
          title: "مرفق ضروري مفقود",
          text: `يجب رفع جميع المرفقات الضرورية (${missingRequired.name}) قبل إرسال المهمة.`,
        });
        return;
      }
    }
  
    const dto = {
      taskGuid: selectedTask.guid,
      senderGuid: currentUser.guid,
      senderName: currentUser?.userName || currentUser?.name || "",
      departGuid: selectedTask.departGuid,
      departName: getDeptName(selectedTask.departGuid),
      doneDepartGuid: selectedTask.doneDepartGuid,
      doneDepartName: getDeptName(selectedTask.doneDepartGuid),
      taskName: selectedTask.name,
      approveLevel: selectedTask.approveLevel,
      approveLevelText:
        selectedTask?.approveLevel === 0 ? "الإدارة التنفيذية" :
        selectedTask?.approveLevel === 1 ? "الإشراف العام" :
        selectedTask?.approveLevel === 2 ? "مشرف الفرع" :
        "تنفذ مباشرة",
      receivers: possibleReceivers
        .filter(u => taskUsers.includes(u.guid))
        .map(u => ({
          receiverGuid: u.guid,
          receiverName: u.userName
        })),
      notes,
      requiredExecutionTime: execTime,
      attachments: selectedTask.attachments
        .filter(att => newAttachmentFiles[att.id])
        .map(att => ({
          id: att.id,
          name: att.name,
          isRequired: att.isRequired,
          fileKey: `file_${att.id}`
        }))
    };
  
    const formData = new FormData();
    formData.append("dto", JSON.stringify(dto));
    Object.entries(newAttachmentFiles).forEach(([attId, file]) => {
      formData.append(`file_${attId}`, file);
    });
  
    setLoading(true);
    try {
      await axios.post("https://api3.sstli.com/api/NewTasks/route/assign", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      Swal.fire({ 
        icon: "success", 
        title: "تم إرسال المهمة بنجاح",
        showConfirmButton: false,
        timer: 1500,
        background: '#f5f5f5',
        position: 'center'
      });
      onClose();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "خطأ في الإرسال",
        text: err?.response?.data || err.message,
        confirmButtonColor: '#1976d2'
      });
    } finally {
      setLoading(false);
    }
  };
  
  

  return (
    <Dialog
  open={open}
  onClose={onClose}
  maxWidth="lg"
  fullWidth
  PaperProps={{ 
    sx: { 
      maxWidth: "90%",
      maxHeight: "90vh",
      borderRadius: "12px",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column"
    } 
  }}
>
  <DialogTitle sx={{ 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderBottom: '1px solid #e0e0e0',
    py: 2,
    px: 3,
    flexShrink: 0
  }}>
    <Typography variant="h6" fontWeight={600}>
      توزيع مهمة قسمك
    </Typography>
    <IconButton onClick={onClose} size="small" sx={{ color: '#757575' }}>
      <CloseIcon />
    </IconButton>
  </DialogTitle>

  <DialogContent sx={{
    p: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    overflow: 'auto',
    flex: 1
  }}>
    <Box sx={{
      width: '100%',
      p: 4,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
     <Fade in timeout={500}>
  <Box sx={{ width: '100%' }}>
    {!showTasks ? (
      <Box sx={{ textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Typography variant="h5" fontWeight={700} sx={{ mb: 4 }}>
            اختر نوع المهمة
          </Typography>
        </motion.div>
        
        <Grid container spacing={3} justifyContent="center">
          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <GroupCard 
                group={{ label: "الكل", value: null, icon: "📋" }} 
                selected={selectedGroup === null}
                onClick={() => handleGroupSelect(null)}
              />
            </motion.div>
          </Grid>
          {taskGroups
            .filter(group => {
              // Show group if it has tasks or if it's the "All" group
              if (group.value === null) return true;
              return tasks.some(task => task.taskGroup === group.value);
            })
            .map((group, index) => (
              <Grid item xs={12} sm={6} md={3} key={group.value}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <GroupCard 
                    group={group}
                    selected={selectedGroup === group.value}
                    onClick={() => handleGroupSelect(group.value)}
                  />
                </motion.div>
              </Grid>
            ))
          }
        </Grid>
      </Box>
    ) : (
      <Box sx={{ width: '100%' }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 4,
          p: 2,
          backgroundColor: 'rgba(25, 118, 210, 0.05)',
          borderRadius: '8px'
        }}>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <IconButton 
              onClick={() => {
                setShowTasks(false);
                setSelectedTask(null); // Clear selected task when going back
              }}
              size="medium"
              sx={{ 
                mr: 2, 
                backgroundColor: 'primary.main',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.dark'
                }
              }}
            >
              <ArrowBackIosNewIcon fontSize="small" />
            </IconButton>
          </motion.div>
          <Typography variant="h5" fontWeight={700} color="primary">
            {selectedGroup ? taskGroups.find(g => g.value === selectedGroup)?.label : "الكل"}
          </Typography>
        </Box>

        {loading && (
          <Box 
            display="flex" 
            justifyContent="center" 
            alignItems="center" 
            sx={{ height: '300px' }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            >
              <CircularProgress size={40} thickness={4} />
            </motion.div>
          </Box>
        )}
        
        {!loading && filteredTasks.length === 0 && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Paper elevation={0} sx={{ 
              p: 6, 
              textAlign: 'center', 
              backgroundColor: 'background.paper',
              borderRadius: '16px',
              maxWidth: '500px',
              mx: 'auto'
            }}>
              <Box sx={{ fontSize: '3rem', mb: 2 }}>📭</Box>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                لا توجد مهام متاحة
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                لا توجد مهام متاحة لهذا القسم أو المجموعة المحددة
              </Typography>
              <Button 
                variant="contained"
                onClick={() => setShowTasks(false)}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: '8px',
                  boxShadow: 'none'
                }}
              >
                العودة لاختيار المجموعة
              </Button>
            </Paper>
          </motion.div>
        )}
        
        {!loading && filteredTasks.length > 0 && (
          <>
            {/* Return Button (only shows when a task is selected) */}
            {selectedTask && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                style={{ width: '100%', textAlign: 'center', marginBottom: '20px' }}
              >
                <Button
                  variant="outlined"
                  endIcon={<ArrowBackIosNewIcon />}
                  onClick={() => setSelectedTask(null)}
                  sx={{
                    borderRadius: '8px',
                    borderWidth: '2px',
                    '&:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 0.04)',
                      borderWidth: '2px'
                    }
                  }}
                >
                  عرض جميع المهام
                </Button>
              </motion.div>
            )}

            <Grid container spacing={3} justifyContent="center" sx={{ width: '100%' }}>
              {filteredTasks.map((task, index) => (
                <Grid item xs={12} sm={6} md={4} key={task.id} sx={{
                  display: selectedTask ? (selectedTask.id === task.id ? 'flex' : 'none') : 'flex',
                  minWidth: '300px',
                  maxWidth: '400px',
                  transition: 'all 0.3s ease'
                }}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0,
                      scale: selectedTask?.id === task.id ? 1.02 : 1
                    }}
                    transition={{ 
                      duration: 0.3, 
                      delay: index * 0.05,
                      type: 'spring'
                    }}
                    style={{ width: '100%' }}
                  >
                    <TaskCard 
                      task={task}
                      selected={selectedTask?.id === task.id}
                      onClick={() => {
                        if (selectedTask?.id === task.id) {
                          setSelectedTask(null); // Deselect if clicking same task
                        } else {
                          handleTaskSelect(task);
                        }
                      }}
                      getDeptName={getDeptName}
                      sx={{ 
                        width: '100%',
                        height: '100%',
                        transform: selectedTask?.id === task.id ? 'translateY(-5px)' : 'none',
                        transition: 'transform 0.3s ease'
                      }}
                    />
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </Box>
    )}
  </Box>
</Fade>

      <Slide direction="up" in={!!selectedTask} mountOnEnter unmountOnExit>
        <Box sx={{ 
          width: '100%',
          mt: 4,
          backgroundColor: 'background.paper',
          borderRadius: '16px',
          boxShadow: 3,
          overflow: 'hidden'
        }}>
          <Box sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 4, color: 'primary.main' }}>
              تفاصيل المهمة المختارة
            </Typography>
            
            <Grid container spacing={4} sx={{ width: '100%' }}>
              <Grid item xs={12} md={6} style={{maxWidth:"600px"}}>
                <Box sx={{ 
                  p: 3, 
                  backgroundColor: 'background.default',
                  borderRadius: '12px',
                  border: '1px solid',
                  borderColor: 'divider',
                  height: '100%'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Avatar sx={{ 
                      mr: 2,
                      backgroundColor: 'primary.light',
                      color: 'primary.contrastText'
                    }}>
                      <AssignmentIcon />
                    </Avatar>
                    <Typography variant="h6" fontWeight={600}>
                      {selectedTask?.name}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
                    <Chip 
                      icon={<AccessTimeIcon fontSize="small" />}
                      label={`${selectedTask?.timeForDone} ساعة`}
                      color="info"
                      variant="outlined"
                      sx={{ height: '32px' }}
                    />
                    <Chip 
                      icon={<BusinessIcon fontSize="small" />}
                      label={getDeptName(selectedTask?.doneDepartGuid)}
                      color="secondary"
                      variant="outlined"
                      sx={{ height: '32px' }}
                    />
                  </Box>

                  {selectedTask?.attachments?.length > 0 && (
  <Box sx={{ mt: 4 }}>
    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
      <AttachFileIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
      المرفقات المطلوبة
    </Typography>
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {selectedTask.attachments.map(att => {
        const matchedTemplate = templates?.find(temp =>
          temp.taskName === selectedTask.name &&
          temp.templateName === att.name
        );

        const downloadUrl = matchedTemplate
          ? `https://filesregsiteration.sstli.com/${matchedTemplate.filePath}`
          : null;

        return (
          <motion.div
            key={att.id}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Paper elevation={0} sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderRadius: '12px',
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: '#fafafa',
            }}>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <DescriptionIcon
                    fontSize="small"
                    color={att.isRequired ? "error" : "action"}
                    sx={{ mr: 1 }}
                  />
                  <Typography sx={{
                    fontWeight: att.isRequired ? 700 : 600,
                    color: att.isRequired ? 'error.main' : 'text.primary'
                  }}>
                    {att.name}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: "wrap" }}>
                  {/* زر التحميل إن وُجد */}
                  {downloadUrl && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        const newTab = window.open('', '_blank');
                        if (newTab) {
                          const html = `
                            <html>
                              <head><title>تحميل الملف</title></head>
                              <body style="display: flex; align-items: center; justify-content: center; height: 100vh;">
                                <h2>جارٍ تحميل الملف...</h2>
                                <a id="downloadLink" href="${downloadUrl}" download style="display:none"></a>
                                <script>
                                  document.getElementById('downloadLink').click();
                                </script>
                              </body>
                            </html>
                          `;
                          newTab.document.write(html);
                          newTab.documen2t.close();
                        } else {
                          alert("يرجى السماح بالنوافذ المنبثقة (pop-ups) في المتصفح.");
                        }
                      }}
                      sx={{
                        borderRadius: '8px',
                        color: 'primary.main',
                        borderColor: 'primary.main',
                        fontWeight: 600,
                        textTransform: 'none',
                        px: 2
                      }}
                    >
                      المرفق التوضيحي
                    </Button>
                  )}

                  {/* بدل زر الإرفاق بنص عند وجود مرفق توضيحي */}
                  {downloadUrl ? (
                    <Typography
                      sx={{
                        fontWeight: 500,
                        color: 'primary.main',
                        fontSize: '15px',
                        px: 1,
                        py: 0.5,
                        borderRadius: '6px',
                        background: '#e3f2fd',
                        display: 'inline-block'
                      }}
                    >
                      سيتم إرسال الملف تلقائيًا عند إرسال المهمة
                    </Typography>
                  ) : (
                    <Button
                      component="label"
                      startIcon={<AttachFileIcon />}
                      variant={attachmentFiles[att.id] ? "contained" : "outlined"}
                      size="small"
                      sx={{
                        borderRadius: '8px',
                        minWidth: '120px',
                        textTransform: 'none',
                        px: 2
                      }}
                    >
                      {attachmentFiles[att.id] ? "تغيير المرفق" : "إرفاق"}
                      <input
                        type="file"
                        hidden
                        onChange={e => {
                          const file = e.target.files[0];
                          if (file) handleFileChange(att.id, file);
                        }}
                      />
                    </Button>
                  )}

                  {/* زر الحذف (يظهر فقط لو مش مرفق توضيحي ومرفوع فايل فعلي) */}
                  {!downloadUrl && attachmentFiles[att.id] && (
                    <IconButton
                      onClick={() => handleRemoveFile(att.id)}
                      size="small"
                      sx={{
                        backgroundColor: 'error.light',
                        color: 'error.main',
                        '&:hover': {
                          backgroundColor: 'error.main',
                          color: 'error.contrastText'
                        }
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              </Box>
            </Paper>
          </motion.div>
        );
      })}
    </Box>
  </Box>
)}
                </Box>
              </Grid>

              <Grid item xs={12} md={6} sx={{ minWidth: "500px" }}>
                <Box sx={{ 
                  p: 3, 
                  backgroundColor: 'background.default',
                  borderRadius: '12px',
                  border: '1px solid',
                  borderColor: 'divider',
                  height: '100%'
                }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
                    <SendIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                    إرسال المهمة
                  </Typography>

                  <Box sx={{ mb: 4 }}>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                      <PeopleIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                      الموظفون المستلمون
                    </Typography>
                    <Autocomplete
                      multiple
                      options={possibleReceivers}
                      getOptionLabel={(option) => option.userName}
                      value={possibleReceivers.filter(u => taskUsers.includes(u.guid))}
                      onChange={(_, newValue) => {
                        setTaskUsers(newValue.map(u => u.guid));
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          variant="outlined"
                          placeholder="اختر الموظفين"
                        />
                      )}
                      renderOption={(props, option) => (
                        <MenuItem {...props}>
                          <ListItemAvatar>
                            <Avatar sx={{ 
                              backgroundColor: 'primary.light',
                              color: 'primary.contrastText'
                            }}>
                              {option.userName.charAt(0)}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={option.userName}
                            secondary={
                              option.userJop === 0 ? "مدير تنفيذي" :
                              option.userJop === 1 ? "مسؤول تنفيذي" :
                              option.userJop === 2 ? "مشرف عام" :
                              option.userJop === 9 ? "مشرف فرع" : "موظف"
                            }
                          />
                        </MenuItem>
                      )}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip
                            {...getTagProps({ index })}
                            key={option.guid}
                            avatar={<Avatar>{option.userName.charAt(0)}</Avatar>}
                            label={option.userName}
                            sx={{ mr: 1, mb: 1 }}
                          />
                        ))
                      }
                    />
                  </Box>

                  <Box sx={{ mb: 4 }}>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                      <NotesIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                      ملاحظات إضافية
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="أدخل أي ملاحظات أو تعليمات إضافية هنا..."
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px'
                        }
                      }}
                    />
                  </Box>

                  {/* Replace the existing execution time Box component with this conditional rendering */}
{[0, 1, 2, 3, 9].includes(currentUser.userJop) && (
  <Box sx={{ mb: 4 }}>
    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
      <ScheduleIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
      وقت التنفيذ المطلوب
    </Typography>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <TextField
        type="number"
        value={requiredExecutionTime}
        onChange={e => setRequiredExecutionTime(e.target.value)}
        placeholder={selectedTask?.timeForDone?.toString() ?? ""}
        inputProps={{ min: 1 }}
        variant="outlined"
        size="small"
        sx={{ 
          maxWidth: '120px',
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px'
          }
        }}
      />
      <Typography variant="body2" color="text.secondary">
        الوقت الافتراضي: {selectedTask?.timeForDone} ساعة
      </Typography>
    </Box>
  </Box>
)}

                  <Divider sx={{ my: 3 }} />

                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end', 
                    gap: 2,
                    pt: 2
                  }}>
                    <Button 
                      onClick={onClose} 
                      variant="outlined"
                      sx={{ 
                        minWidth: '120px',
                        borderRadius: '8px',
                        borderWidth: '2px',
                        '&:hover': {
                          borderWidth: '2px'
                        }
                      }}
                    >
                      إلغاء
                    </Button>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        variant="contained"
                        disabled={loading || !selectedTask}
                        onClick={handleSubmit}
                        sx={{ 
                          minWidth: '140px',
                          borderRadius: '8px',
                          boxShadow: 'none',
                          '&:hover': {
                            boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                          }
                        }}
                        startIcon={loading ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          <SendIcon fontSize="small" />
                        )}
                      >
                        {loading ? 'جاري الإرسال' : 'إرسال المهمة'}
                      </Button>
                    </motion.div>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Slide>
    </Box>
  </DialogContent>
</Dialog>
  );
}