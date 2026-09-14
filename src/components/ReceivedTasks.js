import { navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from './NavigationShell';
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Grid,
  DialogActions,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Divider,
  Stack,
  Popover,
  TextField,
  styled,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import CloseIcon from '@mui/icons-material/Close';
import DescriptionIcon from '@mui/icons-material/Description';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import HistoryIcon from '@mui/icons-material/History';
import Swal from 'sweetalert2';
import axios from 'axios';

import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format } from 'date-fns';
import arLocale from 'date-fns/locale/ar-SA';

const TASKS_API = "https://api3.sstli.com/api/NewTasks/routes/all";
const APPROVE_API = id =>
  `https://api3.sstli.com/api/NewTasks/routes/${id}/approve`;
const STATUS_API = taskGuid =>
  `https://api3.sstli.com/api/NewTasks/routes/${taskGuid}/status`;
const ATTACHMENT_API = (taskGuid, attId) =>
  `https://api3.sstli.com/api/NewTasks/routes/${taskGuid}/attachments/${attId}`;
const SAVE_DETAILS_API = "https://filesregsiteration.sstli.com/save_task_details.php";
const TASK_HISTORY_API = "https://filesregsiteration.sstli.com/GetTaskDetails.php";

const STATUS_OPTIONS = [
  { value: "معلقة", label: "معلقة" },
  { value: "جاري التنفيذ", label: "جاري التنفيذ" },
  { value: "مكتملة", label: "مكتملة" },
  { value: "مرفوضة", label: "مرفوضة" },
];

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

// Safe array utility function
const safeArray = (array) => Array.isArray(array) ? array : [];

// Safe date parsing function
const parseDateSafe = (dateString) => {
  if (!dateString) return new Date();
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? new Date() : date;
};

function getUserFromStorage() {
  try {
    return JSON.parse(localStorage.getItem("user")) || {};
  } catch {
    return {};
  }
}

// Function to get the latest status from history
const getLatestStatus = (history) => {
  if (!Array.isArray(history) || history.length === 0) return "معلقة";
  
  // Sort history by date (newest first)
  const sortedHistory = [...history].sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  ); // Added missing closing parenthesis here
  
  return sortedHistory[0].status || "معلقة";
};
export default function AllTaskRoutesList() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAttachment, setOpenAttachment] = useState(null);
  const [taskHistories, setTaskHistories] = useState({});
  const [expandedTasks, setExpandedTasks] = useState({});
  const currentUser = getUserFromStorage();
  const [now, setNow] = useState(Date.now());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarAnchorEl, setCalendarAnchorEl] = useState(null);
  const [filterByDate, setFilterByDate] = useState(true);
  const [statusChangeDialog, setStatusChangeDialog] = useState({
    open: false,
    taskGuid: null,
    taskId: null,
    status: '',
    notes: '',
    requiredFilesCount: 0,
    uploadedFiles: []
  });

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const response = await axios.get(TASKS_API);
        const tasksData = safeArray(response?.data);
        
        // Fetch histories for all tasks
        const histories = {};
        const tasksWithStatus = [];
        
        for (const task of tasksData) {
          try {
            const historyResponse = await axios.get(`${TASK_HISTORY_API}?taskGuid=${task.id}`);
            
            if (historyResponse?.data?.success) {
              // Find the correct history for this task
              const taskHistory = safeArray(historyResponse.data.data).find(
                item => String(item.taskGuid) === String(task.id)
              ); // Added missing parenthesis here
              
              if (taskHistory) {
                histories[task.id] = safeArray(taskHistory.history);
                // Update task status based on history
                tasksWithStatus.push({
                  ...task,
                  status: getLatestStatus(taskHistory.history)
                });
              } else {
                histories[task.id] = [];
                tasksWithStatus.push({
                  ...task,
                  status: task.status || "معلقة"
                });
              }
            }
          } catch (error) {
            console.error(`Error fetching history for task ${task.id}:`, error);
            histories[task.id] = [];
            tasksWithStatus.push({
              ...task,
              status: task.status || "معلقة"
            });
          }
        }
        
        setTasks(tasksWithStatus);
        setTaskHistories(histories);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };
  
    fetchTasks();
  }, []);

  const toggleTaskExpansion = (taskId) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  // Update countdown every second
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const canShow = task => {
    const { departGuid, userJop } = currentUser;
    if (!departGuid || userJop == null) return false;
    if (task?.approveLevel === 4) {
      return departGuid === task?.doneDepartGuid;
    }
    if ([0,1,2].includes(task?.approveLevel)) {
      if (
        (task?.approveLevel === 0 && [0,1].includes(userJop)) ||
        (task?.approveLevel === 1 && userJop === 2) ||
        (task?.approveLevel === 2 && userJop === 9)
      ) {
        return true;
      }
      if (task?.isApproved && departGuid === task?.doneDepartGuid) {
        return true;
      }
    }
    return false;
  };

  const handleApprove = async id => {
    try {
      Swal.fire({ title: 'جاري الموافقة...', didOpen: () => Swal.showLoading() });
      await axios.post(APPROVE_API(id));
      setTasks(ts =>
        safeArray(ts).map(t =>
          t?.id === id
            ? { ...t, isApproved: true, status: 'معلقة' }
            : t
        )
      );
      Swal.fire({ icon: 'success', title: 'تمت الموافقة', timer: 1200, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'فشل الاعتماد', text: err?.response?.data?.message });
    }
  };

  const handleChangeStatus = (taskGuid, id, newStatus) => {
    const task = tasks.find(t => t.id === id && t.taskGuid === taskGuid);
    const requiredFilesCount = newStatus === "مكتملة" ? (safeArray(task?.attachments)?.length || 0) : 0;
  
    setStatusChangeDialog({
      open: true,
      taskGuid,
      taskId: id,
      status: newStatus,
      notes: '',
      requiredFilesCount,
      uploadedFiles: []
    });
  };
  
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files || []);
    setStatusChangeDialog(prev => ({
      ...prev,
      uploadedFiles: [...safeArray(prev.uploadedFiles), ...files]
    }));
  };

  const removeUploadedFile = (index) => {
    setStatusChangeDialog(prev => ({
      ...prev,
      uploadedFiles: safeArray(prev.uploadedFiles).filter((_, i) => i !== index)
    }));
  };

  const handleSubmitStatusChange = async () => {
    try {
      if (statusChangeDialog.status === "مكتملة" && 
          safeArray(statusChangeDialog.uploadedFiles).length < statusChangeDialog.requiredFilesCount) {
        Swal.fire({
          icon: 'error',
          title: 'خطأ',
          text: `يجب رفع ${statusChangeDialog.requiredFilesCount} ملف/ملفات لإكمال المهمة`
        });
        return;
      }
  
      Swal.fire({ title: 'جاري تغيير الحالة...', didOpen: () => Swal.showLoading() });
      
      // First update the status via API
      await axios.put(STATUS_API(statusChangeDialog.taskGuid), { 
        status: statusChangeDialog.status 
      });
      
      // Prepare form data for additional details
      const formData = new FormData();
      
      formData.append('taskGuid', statusChangeDialog.taskId);
      formData.append('status', statusChangeDialog.status);
      formData.append('notes', statusChangeDialog.notes);
      
      safeArray(statusChangeDialog.uploadedFiles).forEach((file) => {
        formData.append('files[]', file);
      });
  
      if (statusChangeDialog.notes || safeArray(statusChangeDialog.uploadedFiles).length > 0) {
        await axios.post(SAVE_DETAILS_API, formData);
      }
      
      // Update local state
      setTasks(ts =>
        safeArray(ts).map(t =>
          t?.id === statusChangeDialog.taskId
            ? { ...t, status: statusChangeDialog.status }
            : t
        )
      );
      
      // Refresh task history for this specific task
      try {
        const historyResponse = await axios.get(`${TASK_HISTORY_API}?taskGuid=${statusChangeDialog.taskId}`);
        if (historyResponse?.data?.success) {
          const taskHistory = safeArray(historyResponse.data.data).find(
            item => String(item.taskGuid) === String(statusChangeDialog.taskId)
          ); // Added missing parenthesis here
          
          setTaskHistories(prev => ({
            ...prev,
            [statusChangeDialog.taskId]: taskHistory ? safeArray(taskHistory.history) : []
          }));
        }
      } catch (error) {
        console.error('Error refreshing task history:', error);
      }
      
      // Close dialog
      setStatusChangeDialog({ 
        open: false, 
        taskGuid: null, 
        taskId: null,
        status: '', 
        notes: '', 
        requiredFilesCount: 0,
        uploadedFiles: [] 
      });
      
      Swal.fire({ 
        icon: 'success', 
        title: `تم تغيير الحالة إلى ${statusChangeDialog.status}`, 
        timer: 1200, 
        showConfirmButton: false 
      });
    } catch (err) {
      Swal.fire({ 
        icon: 'error', 
        title: 'فشل تغيير الحالة', 
        text: err?.response?.data?.message || 'حدث خطأ أثناء حفظ البيانات'
      });
    }
  };

  const handleCalendarOpen = (event) => {
    setCalendarAnchorEl(event.currentTarget);
  };

  const handleCalendarClose = () => {
    setCalendarAnchorEl(null);
  };

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    setFilterByDate(true);
    handleCalendarClose();
  };

  const clearDateFilter = () => {
    setFilterByDate(false);
  };

  const showAllTasks = () => {
    setFilterByDate(false);
  };

  const showTodayTasks = () => {
    setSelectedDate(new Date());
    setFilterByDate(true);
  };

  const calendarOpen = Boolean(calendarAnchorEl);

  const filteredTasks = filterByDate 
    ? safeArray(tasks).filter(task => {
        const taskDate = parseDateSafe(task?.createdAt);
        const selected = new Date(selectedDate);
        return (
          taskDate.getDate() === selected.getDate() &&
          taskDate.getMonth() === selected.getMonth() &&
          taskDate.getFullYear() === selected.getFullYear()
        );
      })
    : safeArray(tasks);

  const visibleTasks = safeArray(filteredTasks).filter(canShow);

  if (loading) {
    return <NavigationShell variant="admin" ><>
      
      <Box sx={{
        flex: 1,
        p: 3,
        ...navigationContentSx
      }}><CircularProgress /></Box>
    </></NavigationShell>;
  }

  return (
    <NavigationShell variant="admin" ><>
      
      <Box sx={{
        flex: 1,
        p: 3,
        direction: "rtl",
        background: "#f5f7fb",
        width: "100%",
        ...navigationContentSx
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" gutterBottom fontWeight={700}>المهام التي لديك</Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {filterByDate ? (
              <>
                <Chip 
                  label={`${format(selectedDate, 'yyyy/MM/dd', { locale: arLocale })}`}
                  onDelete={clearDateFilter}
                  color="primary"
                />
                <Button 
                  variant="outlined"
                  onClick={showAllTasks}
                >
                  عرض جميع المهام
                </Button>
              </>
            ) : (
              <Button 
                variant="outlined"
                onClick={showTodayTasks}
              >
                عرض مهام اليوم
              </Button>
            )}
            
            <Button
              variant="outlined"
              startIcon={<CalendarMonthIcon />}
              onClick={handleCalendarOpen}
              sx={{ fontWeight: 700 }}
            >
              اختر تاريخ
            </Button>
          </Box>
        </Box>

        <Popover
          open={calendarOpen}
          anchorEl={calendarAnchorEl}
          onClose={handleCalendarClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={arLocale}>
            <DateCalendar
              value={selectedDate}
              onChange={handleDateChange}
              views={['year', 'month', 'day']}
              sx={{ width: 320 }}
            />
          </LocalizationProvider>
        </Popover>

        {safeArray(visibleTasks).length === 0 && (
          <Typography sx={{ textAlign: 'center', mt: 4 }}>
            {filterByDate
              ? `لا توجد مهام في التاريخ المحدد (${format(selectedDate, 'yyyy/MM/dd', { locale: arLocale })})`
              : 'لا توجد مهام متاحة حالياً'}
          </Typography>
        )}

        <Grid container spacing={4}>
          {safeArray(visibleTasks).map(task => {
            const created = parseDateSafe(task?.createdAt);
            const createdText = isNaN(created.getTime()) 
              ? 'تاريخ غير معروف' 
              : created.toLocaleString('en-GB', {
                  year: 'numeric', 
                  month: '2-digit', 
                  day: '2-digit',
                  hour: '2-digit', 
                  minute: '2-digit', 
                  second: '2-digit',
                  hour12: false,
                }).replace(',', '');

                const requiredHrs = parseFloat(task?.requiredExecutionTime || 0) + 3;
                const deadline = created.getTime() + (task?.status === "مكتملة" ? 0 : requiredHrs * 3600 * 1000);
                const timeLeft = Math.max(0, deadline - now);
                const totalSeconds = Math.floor(timeLeft / 1000);
                const hours = Math.floor(totalSeconds / 3600);
                const mins = Math.floor((totalSeconds % 3600) / 60);
                const secs = totalSeconds % 60;
                const ended = timeLeft <= 0;
                const expired = ended && !["مكتملة", "مرفوضة"].includes(task?.status);

            const taskHistory = safeArray(taskHistories[task?.id]);
            const isExpanded = expandedTasks[task?.id] || false;

            return (
              <Grid sx={{marginTop:"20px"}} key={task?.id}>
               <Card
  sx={{
    position: 'relative',
    borderRadius: 4,
    margin:"5px",
    width:"400px",
    boxShadow: task?.status === "مكتملة" ? "0 4px 24px 0 #10b98180" :
               expired ? "0 6px 24px 0 #e62b2b44" : "0 4px 24px 0 #2E7D3280",
    border: task?.status === "مكتملة" ? '2.5px solid #10b981' :
            expired ? '2.5px solid #e62b2b' : '1.5px solid #d7e5e9',
    background: task?.status === "مكتملة" ? "#f0fdf4" :
               expired ? "#fff2f2" : "#ffffff",
    transition: "transform 0.18s",
    "&:hover": { 
      transform: "scale(1.025)", 
      boxShadow: task?.status === "مكتملة" ? "0 6px 36px 0 #10b98155" :
                 expired ? "0 8px 28px 0 #e62b2b55" : "0 6px 36px 0 #23916f55" 
    }
  }}
>
                  <Box sx={{ position: 'absolute', top: 18, left: 18 }}>
                    {task?.isApproved
                      ? <Chip icon={<CheckCircleOutlineIcon />} label="معتمدة" color="success" size="small"/>
                      : <Chip icon={<CancelOutlinedIcon />} label="معلقة" color="warning" size="small"/>
                    }
                  </Box>

                  <CardContent sx={{ pt: 3, marginTop: "20px" }}>
                    <Stack spacing={1.3}>
                      <Typography variant="h6" fontWeight={700} color="primary.main">{task?.taskName}</Typography>
                      <Box display="flex" gap={1}>
                        <Chip label={`القسم: ${task?.departName}`} size="small" color="info" sx={{ fontWeight: 600 }}/>
                        <Chip label={`المنفذ: ${task?.doneDepartName}`} size="small" sx={{ fontWeight: 600, background: "#d9f6e5", color: "#14653b" }}/>
                      </Box>
                      <Typography variant="body2" color="text.secondary" fontWeight={500}>
                        أنشئت: {createdText}
                      </Typography>

                      {requiredHrs > 0 && (
  <Typography fontWeight={700} sx={{
    color: task?.status === "مكتملة" ? "#10b981" : 
           expired ? "#d32f2f" : "#0288d1",
    fontSize: 15,
    border: task?.status === "مكتملة" ? '1.5px solid #a7f3d0' :
            expired ? '2px solid #d32f2f' : '1.5px solid #aee4f7',
    px: 2, py: .7, borderRadius: 2, 
    background: task?.status === "مكتملة" ? '#ecfdf5' :
               expired ? '#fff0f0' : '#eaf8fe', 
    width: "fit-content"
  }}>
    {task?.status === "مكتملة" ? "تم إكمال المهمة بنجاح" :
     expired ? "انتهى الوقت ولم تكتمل المهمة!" :
     `الوقت المتبقي: ${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    }
  </Typography>
)}

                      {expired && (
                        <Typography sx={{ color: "#e62b2b", fontWeight: 800, mt: 1 }}>
                          انتهى الوقت المسموح للمهمة ولا يمكن تعديل حالتها الآن إلا من الإدارة.
                        </Typography>
                      )}

                      {task?.notes && (
                        <>
                          <Divider sx={{ my: 1.5 }} />
                          <Box sx={{
                            background: "#f6f7f8",
                            px: 2, py: 1.5, borderRadius: 2, mb: 1,
                            display: "flex", alignItems: "center", gap: 1
                          }}>
                            <DescriptionIcon color="disabled" fontSize="small" />
                            <Typography fontWeight={600} fontSize={15}>ملاحظات:</Typography>
                            <Typography fontSize={14} sx={{ color: "#374151" }}>{task?.notes}</Typography>
                          </Box>
                        </>
                      )}

                      {safeArray(task?.attachments).length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" fontWeight={700} mb={0.5}>
                            المرفقات:
                          </Typography>
                          <Stack direction="column" spacing={1} flexWrap="wrap">
                            {safeArray(task?.attachments).map(att => (
                              <Tooltip title={att?.originalName || ""} key={att?.id}>
                                <Button
                                  variant={att?.isRequired ? 'contained' : 'outlined'}
                                  size="small"
                                  startIcon={<VisibilityIcon />}
                                  sx={{
                                    minWidth: 120, fontWeight: 700,
                                    mb: 0.5, background: att?.isRequired ? "#0288d1" : "#fff"
                                  }}
                                  onClick={() => setOpenAttachment({ 
                                    url: ATTACHMENT_API(task?.taskGuid, att?.id), 
                                    name: att?.name, 
                                    originalName: att?.originalName, 
                                    fileName: att?.fileName 
                                  })}
                                >
                                  {att?.name}
                                </Button>
                              </Tooltip>
                            ))}
                          </Stack>
                        </Box>
                      )}
                    </Stack>
                  </CardContent>

                  <CardActions sx={{ justifyContent: 'space-between', px: 3, pb: 2, pt: 1 }}>
                  <FormControl size="small" sx={{ minWidth: 140 }}>
  <InputLabel>الحالة</InputLabel>
  <Select
    label="الحالة"
    value={task?.status || ''}
    onChange={e => handleChangeStatus(task?.taskGuid, task?.id, e.target.value)}
    disabled={currentUser?.departGuid !== task?.doneDepartGuid || expired || task?.status === "مكتملة"}
  >
    {STATUS_OPTIONS.map(opt => (
      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
    ))}
  </Select>
</FormControl>

                    {[0,1,2].includes(task?.approveLevel) && !task?.isApproved && !expired && (
                      <Button
                        variant="contained"
                        size="small"
                        sx={{ px: 4, fontWeight: 700, borderRadius: 2 }}
                        onClick={() => handleApprove(task?.id)}
                      >
                        أوافق
                      </Button>
                    )}
                  </CardActions>

                  <Box sx={{ px: 2, pb: 2 }}>
                    <Button
                      fullWidth
                      startIcon={<HistoryIcon />}
                      endIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      onClick={() => toggleTaskExpansion(task?.id)}
                      sx={{ justifyContent: 'space-between' }}
                    >
                      سجل التغييرات
                    </Button>
                    
                    <Collapse in={isExpanded}>
                      <Box sx={{ mt: 2, maxHeight: 300, overflow: 'auto' }}>
                        {taskHistory.length > 0 ? (
                          <List dense>
                            {taskHistory.map((historyItem, index) => {
                              const historyDate = parseDateSafe(historyItem?.createdAt);
                              const formattedDate = isNaN(historyDate.getTime()) 
                                ? 'تاريخ غير معروف'
                                : format(historyDate, 'yyyy/MM/dd HH:mm', { locale: arLocale });

                              return (
                                <Box key={index} sx={{ mb: 2, border: '1px solid #eee', borderRadius: 2, p: 1 }}>
                                  <ListItem>
                                    <ListItemIcon>
                                      {historyItem?.status === "مكتملة" ? (
                                        <CheckCircleOutlineIcon color="success" />
                                      ) : historyItem?.status === "مرفوضة" ? (
                                        <CancelOutlinedIcon color="error" />
                                      ) : (
                                        <DescriptionIcon color="info" />
                                      )}
                                    </ListItemIcon>
                                    <ListItemText
                                      primary={`الحالة: ${historyItem?.status || 'غير معروف'}`}
                                      secondary={`التاريخ: ${formattedDate}`}
                                    />
                                  </ListItem>
                                  
                                  {historyItem?.notes && (
                                    <Box sx={{ px: 2, py: 1 }}>
                                      <Typography variant="body2" color="text.secondary">
                                        <strong>ملاحظات:</strong> {historyItem.notes}
                                      </Typography>
                                    </Box>
                                  )}
                                  
                                  {safeArray(historyItem?.attachments).length > 0 && (
                                    <Box sx={{ px: 2, py: 1 }}>
                                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        <strong>الملفات المرفقة:</strong>
                                      </Typography>
                                      <Stack direction="column" spacing={1} flexWrap="wrap">
                                        {safeArray(historyItem.attachments).map((att, attIndex) => (
                                          <Chip
                                            key={attIndex}
                                            label={att?.originalName || 'ملف'}
                                            onClick={() => window.open(att?.url, '_blank')}
                                            sx={{ cursor: 'pointer' }}
                                          />
                                        ))}
                                      </Stack>
                                    </Box>
                                  )}
                                </Box>
                              );
                            })}
                          </List>
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                            لا يوجد سجل تغييرات لهذه المهمة
                          </Typography>
                        )}
                      </Box>
                    </Collapse>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        <Dialog open={!!openAttachment} onClose={() => setOpenAttachment(null)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            {openAttachment?.name}
            <IconButton onClick={() => setOpenAttachment(null)}><CloseIcon/></IconButton>
          </DialogTitle>
          <DialogContent>
            {openAttachment?.url && (() => {
              const att = openAttachment;
              const getExt = att => {
                if (att?.originalName) return att.originalName.split('.').pop().toLowerCase();
                if (att?.fileName) return att.fileName.split('.').pop().toLowerCase();
                return '';
              };
              const ext = getExt(att);
              const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
              if (imageTypes.includes(ext)) {
                return (
                  <Box display="flex" justifyContent="center">
                    <img src={att.url} alt={att.name} style={{ maxWidth: "100%", maxHeight: 500, borderRadius: 10, border: '1px solid #ddd' }} />
                  </Box>
                );
              } else if (ext === 'pdf') {
                return (
                  <Box component="iframe" src={att.url} width="100%" height="600px" sx={{ border:'none' }}/>
                );
              } else {
                return (
                  <Box display="flex" flexDirection="column" alignItems="center">
                    <Typography>هذا الملف غير قابل للعرض المباشر. يمكنك تحميله:</Typography>
                    <Button href={att.url} target="_blank" download variant="contained" sx={{ mt: 2 }}>تحميل الملف</Button>
                  </Box>
                );
              }
            })()}
          </DialogContent>
        </Dialog>

        <Dialog 
          open={statusChangeDialog.open} 
          onClose={() => setStatusChangeDialog({ 
            open: false, 
            taskGuid: null, 
            taskId: null,
            status: '', 
            notes: '', 
            requiredFilesCount: 0,
            uploadedFiles: []
          })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">تغيير حالة المهمة</Typography>
            <IconButton onClick={() => setStatusChangeDialog({ 
              open: false, 
              taskGuid: null, 
              taskId: null,
              status: '', 
              notes: '', 
              requiredFilesCount: 0,
              uploadedFiles: []
            })}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <Stack spacing={3}>
              <Typography>
                سيتم تغيير حالة المهمة إلى: <strong>{statusChangeDialog.status}</strong>
              </Typography>
              
              {statusChangeDialog.status === "مكتملة" && statusChangeDialog.requiredFilesCount > 0 && (
                <Typography color="primary" fontWeight={700}>
                  يجب رفع {statusChangeDialog.requiredFilesCount} ملف/ملفات لإكمال المهمة
                </Typography>
              )}
              
              <FormControl fullWidth>
                <TextField
                  label="ملاحظات (اختياري)"
                  multiline
                  rows={4}
                  value={statusChangeDialog.notes}
                  onChange={(e) => setStatusChangeDialog({ 
                    ...statusChangeDialog, 
                    notes: e.target.value 
                  })}
                />
              </FormControl>
              
              {statusChangeDialog.status === "مكتملة" && statusChangeDialog.requiredFilesCount > 0 && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} mb={1}>
                    {`الملفات المطلوبة (${safeArray(statusChangeDialog.uploadedFiles).length}/${statusChangeDialog.requiredFilesCount})`}
                  </Typography>
                  
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<AttachFileIcon />}
                    sx={{ mb: 2 }}
                  >
                    رفع ملفات
                    <VisuallyHiddenInput 
                      type="file" 
                      onChange={handleFileUpload}
                      multiple
                    />
                  </Button>
                  
                  <Stack spacing={1}>
                    {safeArray(statusChangeDialog.uploadedFiles).map((file, index) => (
                      <Chip 
                        key={index}
                        label={file?.name || 'ملف'}
                        onDelete={() => removeUploadedFile(index)}
                        deleteIcon={<DeleteIcon />}
                        sx={{ mr: 1 }}
                      />
                    ))}
                  </Stack>
                </Box>
              )}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button 
              onClick={() => setStatusChangeDialog({ 
                open: false, 
                taskGuid: null, 
                taskId: null,
                status: '', 
                notes: '', 
                requiredFilesCount: 0,
                uploadedFiles: []
              })}
              variant="outlined"
            >
              إلغاء
            </Button>
            <Button 
              onClick={handleSubmitStatusChange}
              variant="contained"
              color="primary"
              disabled={statusChangeDialog.status === "مكتملة" && 
                       safeArray(statusChangeDialog.uploadedFiles).length < statusChangeDialog.requiredFilesCount}
            >
              تأكيد التغيير
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </></NavigationShell>
  );
}