import * as uiLayout from './common/uiLayout';
import { navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from './NavigationShell';
import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Chip, Button, CircularProgress,
  Dialog, DialogTitle, DialogContent, TextField, MenuItem, Select, InputLabel, FormControl
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import axios from 'axios';
import AttachmentViewer from './AttachmentViewer';

import { arSA } from 'date-fns/locale';

const TASKS_API = "https://api3.sstli.com/api/TasksWithSubs/All";
const USERS_API = "https://api1.sstli.com/api/userinfo";
const TASKS_BY_DEPT_API = (deptGuid) => `https://api3.sstli.com/api/Task/Load?departGuid=${deptGuid}`;
const TASKFLOW_API = "https://api3.sstli.com/api/TaskFlow/History";

export default function AdminDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchName, setSearchName] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [usersMap, setUsersMap] = useState({});
  const [subTaskNames, setSubTaskNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [fileDialog, setFileDialog] = useState({ open: false, filePath: '', sourceType: 'main' });
  const [flowDialog, setFlowDialog] = useState({ open: false, flows: [] });

  const STATUS_OPTIONS = ["", "معلقة", "جاري التنفيذ", "مكتملة", "مرفوضة"];

  useEffect(() => {
    const userFromStorage = localStorage.getItem('user');
    if (userFromStorage) {
      setCurrentUser(JSON.parse(userFromStorage));
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersResp = await axios.get(USERS_API);
        const usersData = usersResp.data;
        const userMapObj = {};
        usersData.forEach(u => {
          userMapObj[u.guid] = u.fullName || u.userName || "مستخدم غير معروف";
        });
        setUsersMap(userMapObj);

        const taskResp = await axios.get(TASKS_API);
        const taskData = taskResp.data;

        const deptGuids = [...new Set(taskData.map(t => t.departmentGuid).filter(Boolean))];
        let subTaskNameMap = {};
        for (const guid of deptGuids) {
          const subResp = await axios.get(TASKS_BY_DEPT_API(guid));
          subResp.data.forEach(s => {
            subTaskNameMap[s.guid] = s.taskName;
          });
        }
        setSubTaskNames(subTaskNameMap);
        setTasks(taskData);
      } catch (e) {
        setTasks([]);
      }
      setLoading(false);
    };
    if (currentUser) fetchData();
  }, [currentUser]);

  useEffect(() => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    const filtered = tasks
      .filter(t => t.createdAt?.startsWith(dateStr))
      .map(task => {
        const matchingSubs = task.subTasks.filter(sub => {
          const receivers = sub.userReceiverGuids?.split(',') || [];
          const receiverNames = receivers.map(id => usersMap[id] || "").join(', ');
          const matchName = searchName.trim() === '' || receiverNames.includes(searchName);
          const matchStatus = !statusFilter || sub.status === statusFilter;
          return matchName && matchStatus;
        });

        return matchingSubs.length > 0 ? { ...task, subTasks: matchingSubs } : null;
      })
      .filter(Boolean);

    setFilteredTasks(filtered);
  }, [selectedDate, tasks, searchName, statusFilter, usersMap]);

  const handleShowFile = (path, type) => {
    if (!path) return alert("لا يوجد مرفق");
    setFileDialog({ open: true, filePath: path, sourceType: type });
  };

  const handleShowFlows = async (subGuid) => {
    try {
      const res = await axios.get(`${TASKFLOW_API}?subTaskGuid=${subGuid}`);
      setFlowDialog({ open: true, flows: res.data });
    } catch {
      setFlowDialog({ open: true, flows: [] });
    }
  };

  if (!currentUser || loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <NavigationShell variant="admin" ><Box sx={{ display: 'flex' }}>
      

      <Box sx={{
        flex: 1,
        p: 3,
        ...navigationContentSx
      }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
          👋 مرحباً <span style={{ color: "#1e40af" }}>{currentUser?.fullName || currentUser?.userName || "المستخدم"}</span>، إليك المهام الخاصة بتاريخ:
          <span style={{ color: "#2563eb", marginRight: 8 }}>
            {selectedDate.toLocaleDateString('ar-EG')}
          </span>
        </Typography>

        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={arSA}>
          <Box sx={uiLayout.withUiSx({
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4
          }, uiLayout.formGridSx)}>
            <DatePicker
              label="اختر التاريخ"
              value={selectedDate}
              onChange={(newDate) => setSelectedDate(newDate)}
              sx={{ width: 200 }}
            />
            <TextField InputLabelProps={{ shrink: true }}
              label="بحث باسم المستلم"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              sx={uiLayout.withUiSx({ width: 240 }, uiLayout.formFieldSx)}
            />
            <FormControl sx={uiLayout.withUiSx({ width: 180 }, uiLayout.formFieldSx)}>
              <InputLabel>فلترة بالحالة</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="فلترة بالحالة"
              >
                {STATUS_OPTIONS.map(status => (
                  <MenuItem key={status} value={status}>{status || 'الكل'}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </LocalizationProvider>

        <Grid container spacing={2}>
          {filteredTasks.length === 0 ? (
            <Typography sx={{ ml: 2, color: '#9ca3af', fontStyle: 'italic' }}>
              لا توجد مهام مطابقة
            </Typography>
          ) : (
            filteredTasks.map(task => (
              <Grid item xs={12} key={task.guid}>
                <Card sx={{
                  borderRadius: 3,
                  boxShadow: '0 3px 12px rgba(0,0,0,0.1)',
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  transition: '0.3s',
                  '&:hover': {
                    boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                    transform: 'scale(1.01)'
                  }
                }}>
                  <CardContent>
                    <Typography variant="h6">{task.taskName}</Typography>
                    <Typography sx={{ color: '#555' }}>من: <b><bdi dir="ltr">{usersMap[task.senderGuid]}</bdi></b></Typography>
                    <Typography sx={{ color: '#777' }}>تاريخ الإرسال: {task.createdAt?.split('T')[0]}</Typography>
                    <Typography sx={{ mt: 1 }}>عدد المهام الفرعية: {task.subTasks.length}</Typography>
                    <Box sx={{ mt: 2 }}>
                      {task.subTasks.map(sub => (
                        <Box key={sub.guid} sx={uiLayout.withUiSx({ border: '1px solid #ddd', borderRadius: 2, p: 2, mb: 1 }, uiLayout.pageHeaderSx)}>
                          <Typography>المهمة الفرعية: <b><bdi dir="ltr">{subTaskNames[sub.taskSmallGuid] || "بدون اسم"}</bdi></b></Typography>
                          <Typography>المستلمون: <b>{sub.userReceiverGuids?.split(',').map(id => usersMap[id] || id).join(', ')}</b></Typography>
                          <Typography>الحالة: <Chip label={sub.status} /></Typography>
                          <Box sx={uiLayout.withUiSx({ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }, uiLayout.actionBarSx)}>
                            {sub.attachmentPath && (
                              <Button sx={uiLayout.buttonSx} onClick={() => handleShowFile(sub.attachmentPath, "main")} variant="outlined">📎 عرض المرفق</Button>
                            )}
                            {sub.completionReplyPath && (
                              <Button sx={uiLayout.buttonSx} onClick={() => handleShowFile(sub.completionReplyPath, "final")} variant="outlined" color="success">✅ الرد النهائي</Button>
                            )}
                            <Button sx={uiLayout.buttonSx} onClick={() => handleShowFlows(sub.guid)} variant="outlined" color="info">🧭 عرض المسار</Button>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>

        <AttachmentViewer
          open={fileDialog.open}
          filePath={fileDialog.filePath}
          sourceType={fileDialog.sourceType}
          onClose={() => setFileDialog({ open: false, filePath: '', sourceType: 'main' })}
        />

        <Dialog sx={uiLayout.dialogLayoutSx} open={flowDialog.open} onClose={() => setFlowDialog({ open: false, flows: [] })} maxWidth="md" fullWidth>
          <DialogTitle>مسار المهمة</DialogTitle>
          <DialogContent>
            {flowDialog.flows.length === 0 ? (
              <Typography sx={{ color: '#888' }}>لا يوجد مسار متاح لهذه المهمة</Typography>
            ) : (
              flowDialog.flows.map((f, i) => (
                <Box key={i} sx={{ mb: 2, borderBottom: '1px solid #ddd', pb: 1 }}>
                  <Typography>من: <b><bdi dir="ltr">{usersMap[f.fromUserGuid]}</bdi></b> → إلى: <b><bdi dir="ltr">{usersMap[f.toUserGuid]}</bdi></b></Typography>
                  <Typography>تاريخ: {f.createdAt?.split('T')[0]}</Typography>
                  <Typography>ملاحظة: {f.note || 'بدون ملاحظات'}</Typography>
                </Box>
              ))
            )}
          </DialogContent>
        </Dialog>
      </Box>
    </Box></NavigationShell>
  );
}
