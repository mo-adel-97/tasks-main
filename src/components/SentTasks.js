import { adaptiveInlineStyle } from '../config/themeColors';
import * as uiLayout from './common/uiLayout';
import { navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from './NavigationShell';
import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, CardActions, Button, Chip, 
  Dialog, DialogTitle, DialogContent, IconButton, Tooltip, Divider, Stack,
  Popover, Collapse, List, ListItem, ListItemText, ListItemIcon
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import CloseIcon from '@mui/icons-material/Close';
import DescriptionIcon from '@mui/icons-material/Description';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import HistoryIcon from '@mui/icons-material/History';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format } from 'date-fns';
import arLocale from 'date-fns/locale/ar-SA';

const TASKS_API = "https://api3.sstli.com/api/NewTasks/routes/all";
const ATTACHMENT_API = (taskGuid, attId) =>
  `https://api3.sstli.com/api/NewTasks/routes/${taskGuid}/attachments/${attId}`;
const TASK_HISTORY_API = "https://filesregsiteration.sstli.com/GetTaskDetails.php";

// Utility functions
const safeArray = (array) => Array.isArray(array) ? array : [];
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

export default function SentTaskRoutesList() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAttachment, setOpenAttachment] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarAnchorEl, setCalendarAnchorEl] = useState(null);
  const [filterByDate, setFilterByDate] = useState(true);
  const [taskHistories, setTaskHistories] = useState({});
  const [expandedTasks, setExpandedTasks] = useState({});

  const currentUser = getUserFromStorage();

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const getCurrentStatus = (taskId) => {
    const history = safeArray(taskHistories[taskId]);
    if (history.length === 0) return 'معلقة';
    
    // Sort history by date (newest first)
    const sortedHistory = [...history].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    return sortedHistory[0].status || 'معلقة';
  };
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch(TASKS_API);
        const data = await response.json();
        const tasksData = safeArray(data);
        setTasks(tasksData);
  
        // Filter tasks sent by current user
        const myTasks = tasksData.filter(t => t.senderGuid === currentUser.guid);
        
        // Create a map to store histories for each task
        const histories = {};
  
        // Fetch history for each task in parallel
        await Promise.all(myTasks.map(async (task) => {
          try {
            const historyResponse = await fetch(`${TASK_HISTORY_API}?taskGuid=${task.taskGuid}`);
            const historyData = await historyResponse.json();
            
            if (historyData?.success) {
              // Find the matching task data in the response
              const clean = val => String(val ?? '').trim().replace(/^0+/, '');

const taskData = safeArray(historyData.data).find(t => clean(t.taskGuid) === clean(task.id));
if (taskData) {
  histories[task.id] = safeArray(taskData.history);
} else {
  histories[task.id] = [];
}
            } else {
              histories[task.taskGuid] = [];
            }
          } catch (error) {
            console.error(`Error fetching history for task ${task.taskGuid}:`, error);
            histories[task.taskGuid] = [];
          }
        }));
  
        setTaskHistories(histories);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };
  
    fetchTasks();
  }, [currentUser.guid]);

  const toggleTaskExpansion = (taskId) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
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

  const showAllTasks = () => {
    setFilterByDate(false);
  };

  const showTodayTasks = () => {
    setSelectedDate(new Date());
    setFilterByDate(true);
  };

  const getExt = att => {
    if (att?.originalName) return att.originalName.split('.').pop().toLowerCase();
    if (att?.fileName) return att.fileName.split('.').pop().toLowerCase();
    return '';
  };

  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];

  // Get tasks sent by current user
  const mySentTasks = safeArray(tasks).filter(t => t.senderGuid === currentUser.guid);

  // Filter tasks by selected date
  const filteredTasks = filterByDate 
    ? mySentTasks.filter(task => {
        const taskDate = parseDateSafe(task?.createdAt);
        const selected = new Date(selectedDate);
        return (
          taskDate.getDate() === selected.getDate() &&
          taskDate.getMonth() === selected.getMonth() &&
          taskDate.getFullYear() === selected.getFullYear()
        );
      })
    : mySentTasks;

  if (loading) {
    return (
      <NavigationShell variant="admin" ><>
        
        <Box sx={{
          flex: 1,
          p: 3,
          ...navigationContentSx
        }}><Typography>جاري التحميل...</Typography></Box>
      </></NavigationShell>
    );
  }

  return (
    <NavigationShell variant="admin" ><div>
      
      <Box sx={{
        flex: 1,
        p: 3,
        background: "#f5f7fb",
        width: "100%",
        ...navigationContentSx
      }}>
        <Box sx={uiLayout.withUiSx({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }, uiLayout.pageHeaderSx)}>
          <Typography variant="h4" fontWeight={700}>
            المهام التي أرسلتها ({filteredTasks.length})
          </Typography>
          
          <Box sx={uiLayout.withUiSx({ display: 'flex', alignItems: 'center', gap: 2 }, uiLayout.actionBarSx)}>
            {filterByDate ? (
              <>
                <Chip 
                  label={`${format(selectedDate, 'yyyy/MM/dd', { locale: arLocale })}`}
                  onDelete={showAllTasks}
                  color="primary"
                />
                <Button sx={uiLayout.buttonSx} 
                  variant="outlined"
                  onClick={showAllTasks}
                >
                  عرض جميع المهام
                </Button>
              </>
            ) : (
              <Button sx={uiLayout.buttonSx} 
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
              sx={uiLayout.withUiSx({ fontWeight: 700 }, uiLayout.buttonSx)}
            >
              اختر تاريخ
            </Button>
          </Box>
        </Box>

        <Popover
          open={Boolean(calendarAnchorEl)}
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

        {filteredTasks.length === 0 && (
          <Typography sx={{ textAlign: 'center', mt: 4 }}>
            {filterByDate
              ? `لا توجد مهام في التاريخ المحدد (${format(selectedDate, 'yyyy/MM/dd', { locale: arLocale })})`
              : 'لا توجد مهام قمت بإرسالها حتى الآن'}
          </Typography>
        )}

        <Grid container spacing={4}>
          {filteredTasks.map(task => {
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
            
            const requiredHrs = parseFloat(task?.requiredExecutionTime || 0);
            // Add 3 hours (3 * 60 * 60 * 1000 = 10,800,000 milliseconds)
            const deadline = created.getTime() + requiredHrs * 3600 * 1000 + (3 * 3600 * 1000);
            const timeLeft = Math.max(0, deadline - now);
            const totalSeconds = Math.floor(timeLeft / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const mins = Math.floor((totalSeconds % 3600) / 60);
            const secs = totalSeconds % 60;
            const ended = timeLeft <= 0;
            const expired = ended && !["مكتملة", "مرفوضة"].includes(getCurrentStatus(task?.id));
            const taskHistory = safeArray(taskHistories[task?.id]);
const isExpanded = expandedTasks[task?.id] || false;


            return (
              <Grid style={{marginTop:"50px"}} key={task?.taskGuid}>
                  <Card
  sx={{
    position: 'relative',
    minHeight: "400px",
    margin:"2px",
    width:"400px",
    borderRadius: 4,
    boxShadow: getCurrentStatus(task?.id) === "مكتملة" ? "0 4px 24px 0 #10b98180" :
               expired ? "0 6px 24px 0 #e62b2b44" : "0 4px 24px 0 #2E7D3280",
    border: getCurrentStatus(task?.id) === "مكتملة" ? '2.5px solid #10b981' :
            expired ? '2.5px solid #e62b2b' : '1.5px solid #d7e5e9',
    background: getCurrentStatus(task?.id) === "مكتملة" ? "#f0fdf4" :
               expired ? "#fff2f2" : "#ffffff",
    transition: "transform 0.18s",
    "&:hover": { 
      transform: "scale(1.025)", 
      boxShadow: getCurrentStatus(task?.id) === "مكتملة" ? "0 6px 36px 0 #10b98155" :
                 expired ? "0 8px 28px 0 #e62b2b55" : "0 6px 36px 0 #23916f55" 
    }
  }}
>
                
                  <Box sx={{ position: 'absolute', top: 18, left: 18 }}>
                    {task?.isApproved
                      ? <Chip icon={<CheckCircleOutlineIcon />} label="معتمدة" color="success" size="small" />
                      : <Chip icon={<CancelOutlinedIcon />} label="معلقة" color="warning" size="small" />
                    }
                  </Box>

                  <CardContent sx={{ pt: 3, marginTop: "20px" }}>
                    <Stack spacing={1.1}>
                      <Typography variant="h6" fontWeight={700} color="primary.main">{task?.taskName}</Typography>
                      <Typography sx={{ color: '#64748b', fontWeight: 500, fontSize: 15, mb: 1 }}>
  الحالة:
  <span style={adaptiveInlineStyle({
    fontWeight: 700,
    color: getCurrentStatus(task?.id) === "معلقة" ? "#f59e42" :
      getCurrentStatus(task?.id) === "جاري التنفيذ" ? "#3b82f6" :
        getCurrentStatus(task?.id) === "مكتملة" ? "#10b981" : "#ef4444"
  })}>
    {" "}{getCurrentStatus(task?.id)}
  </span>
</Typography>
                      <Box display="flex" gap={1}>
                        <Chip label={`القسم: ${task?.departName}`} size="small" color="info" sx={{ fontWeight: 600 }} />
                        <Chip label={`المنفذ: ${task?.doneDepartName}`} size="small" sx={{ fontWeight: 600, background: "#d9f6e5", color: "#14653b" }} />
                      </Box>
                      <Typography variant="body2" color="text.secondary" fontWeight={500}>
                        أنشئت: {createdText}
                      </Typography>

                      {requiredHrs > 0 && (
  <Typography fontWeight={700} sx={{
    color: getCurrentStatus(task?.id) === "مكتملة" ? "#10b981" : 
           expired ? "#d32f2f" : "#0288d1",
    fontSize: 15,
    border: getCurrentStatus(task?.id) === "مكتملة" ? '1.5px solid #a7f3d0' :
            expired ? '2px solid #d32f2f' : '1.5px solid #aee4f7',
    px: 2, py: .7, borderRadius: 2, 
    background: getCurrentStatus(task?.id) === "مكتملة" ? '#ecfdf5' :
               expired ? '#fff0f0' : '#eaf8fe', 
    width: "fit-content"
  }}>
    {getCurrentStatus(task?.id) === "مكتملة" ? "تم إكمال المهمة بنجاح" :
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
                                  sx={uiLayout.withUiSx({
                                    minWidth: 120, fontWeight: 700,
                                    mb: 0.5, background: att?.isRequired ? "#0288d1" : "#fff"
                                  }, uiLayout.buttonSx)}
                                  onClick={() => setOpenAttachment({ ...att, url: ATTACHMENT_API(task?.taskGuid, att?.id) })}
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

                  {/* Task History Section */}
                  <Box sx={{ px: 2, pb: 2 }}>
                    <Button
                      fullWidth
                      startIcon={<HistoryIcon />}
                      endIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      onClick={() => toggleTaskExpansion(task?.id)}
                      sx={uiLayout.withUiSx({ justifyContent: 'space-between' }, uiLayout.buttonSx)}
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

        <Dialog sx={uiLayout.dialogLayoutSx} open={!!openAttachment} onClose={() => setOpenAttachment(null)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {openAttachment?.name}
            <IconButton onClick={() => setOpenAttachment(null)}><CloseIcon /></IconButton>
          </DialogTitle>
          <DialogContent>
            {openAttachment?.url && (() => {
              const ext = getExt(openAttachment);
              if (imageTypes.includes(ext)) {
                return (
                  <Box display="flex" justifyContent="center">
                    <img src={openAttachment.url} alt={openAttachment.name} style={adaptiveInlineStyle({ maxWidth: "100%", maxHeight: 500, borderRadius: 10, border: '1px solid #ddd' })} />
                  </Box>
                );
              } else if (ext === 'pdf') {
                return (
                  <Box component="iframe" src={openAttachment.url} width="100%" height="600px" sx={{ border: 'none' }} />
                );
              } else {
                return (
                  <Box display="flex" flexDirection="column" alignItems="center">
                    <Typography>هذا الملف غير قابل للعرض المباشر. يمكنك تحميله:</Typography>
                    <Button href={openAttachment.url} target="_blank" download variant="contained" sx={uiLayout.withUiSx({ mt: 2 }, uiLayout.buttonSx)}>تحميل الملف</Button>
                  </Box>
                );
              }
            })()}
          </DialogContent>
        </Dialog>
      </Box>
    </div></NavigationShell>
  );
}