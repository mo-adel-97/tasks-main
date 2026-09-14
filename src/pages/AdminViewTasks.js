import * as uiLayout from '../components/common/uiLayout';
import './rtl-forms-fix.css';
import { navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
import React, { useState, useEffect } from 'react';

import { useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  CircularProgress,
  IconButton,
  Collapse,
  Stack,
  Tooltip,
  Grid,
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Avatar,
  Alert,
  CardHeader,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Fab,
  useTheme,
  alpha
} from '@mui/material';
import {
  Visibility,
  FilterList,
  Refresh,
  Download,
  Upload,
  Edit,
  Assignment,
  Person,
  Schedule,
  TrendingUp,
  CheckCircle,
  Cancel,
  Pending,
  PlayArrow,
  ExpandMore,
  Business,
  Search,
  Add,
  Task,
  CalendarMonth,
  Groups
} from '@mui/icons-material';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import axios from 'axios';

const statusMap = {
  0: { label: 'معلقة', color: 'warning', icon: <Pending /> },
  1: { label: 'قيد التنفيذ', color: 'info', icon: <PlayArrow /> },
  2: { label: 'مكتملة', color: 'success', icon: <CheckCircle /> },
  3: { label: 'ملغاة', color: 'error', icon: <Cancel /> }
};

const EXTERNAL_TASKS_API = "https://filesregsiteration.sstli.com/tasks/get_ubdated_tasks.php";
const BRANCHES_API = "https://api1.sstli.com/api/branches/all";
const USERS_API = "https://api1.sstli.com/api/userinfo";
const TASKS_API = "https://api3.sstli.com/api/PuplicTask/GetPuplicTasksByQuery";

const AdminViewTasksByBranches = () => {
  const theme = useTheme();
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [externalTasks, setExternalTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [externalLoading, setExternalLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskUpdates, setTaskUpdates] = useState([]);
  const [expandedTask, setExpandedTask] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [isDateRangeSelected, setIsDateRangeSelected] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [filters, setFilters] = useState({
    status: 'all',
    branch: 'all',
    timeRange: 'all',
    showModifiedOnly: false
  });
  const [showFilters, setShowFilters] = useState(false);
  const [expandedBranch, setExpandedBranch] = useState(null);
  const [branchDialogOpen, setBranchDialogOpen] = useState(false);
  const [selectedBranchData, setSelectedBranchData] = useState(null);

  // تعريف الدوال المساعدة قبل useMemo
  const getLastUpdateStatus = (task) => {
    if (task.taskUpdates && task.taskUpdates.length > 0) {
      const sortedUpdates = [...task.taskUpdates].sort((a, b) => 
        new Date(b.updatedAt) - new Date(a.updatedAt)
      );
      return sortedUpdates[0].status;
    }
    return task.status;
  };

  const isTaskModifiedExternally = (taskId) => {
    return externalTasks.some(externalTask => 
      parseInt(externalTask.TaskId) === parseInt(taskId)
    );
  };

  const getExternalTaskData = (taskId) => {
    return externalTasks.find(externalTask => 
      parseInt(externalTask.TaskId) === parseInt(taskId)
    );
  };

  const getTaskDisplayData = (task) => {
    if (task.isModified) {
      const externalData = getExternalTaskData(task.id);
      if (externalData) {
        return {
          name: externalData.TaskName || task.taskName,
          description: externalData.TaskDescription || task.taskDescription,
          time: externalData.TaskTimeInMinutes || task.taskTimeInMinutes,
          assignedTo: externalData.AssignedTo || task.assignedTo
        };
      }
    }
    return {
      name: task.taskName,
      description: task.taskDescription,
      time: task.taskTimeInMinutes,
      assignedTo: task.assignedTo
    };
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Filter by status
      if (filters.status !== 'all') {
        const lastStatus = getLastUpdateStatus(task);
        if (lastStatus !== parseInt(filters.status)) return false;
      }
      
      // Filter by branch
      if (filters.branch !== 'all') {
        if (task.branchInfo.senderBranch.guid !== filters.branch && 
            task.branchInfo.receiverBranch.guid !== filters.branch) {
          return false;
        }
      }
      
      // Filter by modified only
      if (filters.showModifiedOnly && !task.isModified) {
        return false;
      }
      
      return true;
    });
  }, [tasks, filters, externalTasks]);

  useEffect(() => {
    // تحميل الفروع والمستخدمين فقط عند فتح الصفحة
    const loadInitialData = async () => {
      try {
        await Promise.all([fetchBranches(), fetchUsers()]);
      } catch (err) {
        console.error('Error fetching initial data:', err);
      }
    };
    
    loadInitialData();
  }, []);

  const fetchAllData = async () => {
    if (!dateRange.start || !dateRange.end) {
      setIsDateRangeSelected(false);
      setTasks([]);
      setLoading(false);
      return;
    }
    
    setIsDateRangeSelected(true);
    setLoading(true);
    
    try {
      await Promise.all([
        fetchTasks(),
        fetchExternalTasks()
      ]);
    } catch (err) {
      setError('فشل في جلب البيانات. يرجى المحاولة مرة أخرى.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await axios.get(BRANCHES_API);
      setBranches(response.data);
    } catch (err) {
      console.error('Error fetching branches:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(USERS_API);
      setUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchExternalTasks = async () => {
    setExternalLoading(true);
    try {
      const response = await axios.get(EXTERNAL_TASKS_API);
      if (response.data.success && Array.isArray(response.data.data)) {
        setExternalTasks(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching external tasks:', err);
      setExternalTasks([]);
    } finally {
      setExternalLoading(false);
    }
  };

  const fetchTasks = async () => {
    if (!dateRange.start || !dateRange.end) {
      setIsDateRangeSelected(false);
      setTasks([]);
      setLoading(false);
      return;
    }
    
    setIsDateRangeSelected(true);
    
    try {
      const response = await axios.get(TASKS_API);
      
      const tasksWithUpdates = await Promise.all(
        response.data.map(async (task) => {
          const taskDate = format(new Date(task.createdAt), 'yyyy-MM-dd');
          
          if (taskDate >= dateRange.start && taskDate <= dateRange.end) {
            try {
              const updatesResponse = await axios.get(
                `https://api3.sstli.com/api/PuplicTask/GetTaskUpdates/${task.id}`
              );
              
              const branchInfo = await getTaskBranchInfo(task);
              
              return {
                ...task,
                taskUpdates: updatesResponse.data,
                isModified: isTaskModifiedExternally(task.id),
                branchInfo: branchInfo
              };
            } catch {
              const branchInfo = await getTaskBranchInfo(task);
              
              return {
                ...task,
                taskUpdates: [],
                isModified: isTaskModifiedExternally(task.id),
                branchInfo: branchInfo
              };
            }
          }
          return null;
        })
      );

      const filteredTasks = tasksWithUpdates.filter(task => task !== null);
      setTasks(filteredTasks);
    } catch (err) {
      setError('فشل في جلب المهام. يرجى المحاولة مرة أخرى.');
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTaskBranchInfo = async (task) => {
    try {
      const assignedByUser = users.find(user => user.guid === JSON.parse(task.assignedBy).guid);
      let senderBranch = null;
      
      if (assignedByUser && assignedByUser.branchForWork !== "00000000-0000-0000-0000-000000000000") {
        senderBranch = branches.find(branch => branch.guid === assignedByUser.branchForWork);
      }
      
      let receiverBranch = null;
      const assignedToUsers = JSON.parse(task.assignedTo);
      
      for (const user of assignedToUsers) {
        const assignedUser = users.find(u => u.guid === user.guid);
        if (assignedUser && assignedUser.branchForWork !== "00000000-0000-0000-0000-000000000000") {
          receiverBranch = branches.find(branch => branch.guid === assignedUser.branchForWork);
          if (receiverBranch) break;
        }
      }
      
      return {
        senderBranch: senderBranch || { name: "غير محدد", guid: "unknown" },
        receiverBranch: receiverBranch || { name: "غير محدد", guid: "unknown" }
      };
    } catch (error) {
      console.error('Error getting branch info:', error);
      return {
        senderBranch: { name: "غير محدد", guid: "unknown" },
        receiverBranch: { name: "غير محدد", guid: "unknown" }
      };
    }
  };

  const fetchTaskUpdates = async (taskId) => {
    try {
      const response = await axios.get(`https://api3.sstli.com/api/PuplicTask/GetTaskUpdates/${taskId}`);
      const updatesWithNames = response.data.map(update => {
        const user = users.find(u => u.guid === update.updatedBy);
        return {
          ...update,
          updatedByName: user ? user.fullName : 'غير معروف'
        };
      });
      setTaskUpdates(updatesWithNames);
    } catch (err) {
      console.error('Error fetching task updates:', err);
    }
  };

  const handleDateChange = (field, value) => {
    const newDateRange = { ...dateRange, [field]: value };
    setDateRange(newDateRange);
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    fetchTaskUpdates(task.id);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTask(null);
    setTaskUpdates([]);
  };

  const handleBranchClick = (branchData) => {
    setSelectedBranchData(branchData);
    setBranchDialogOpen(true);
  };

  const handleCloseBranchDialog = () => {
    setBranchDialogOpen(false);
    setSelectedBranchData(null);
  };

  const getUserName = (userJson) => {
    try {
      const user = JSON.parse(userJson);
      return user.fullName;
    } catch {
      return 'غير معروف';
    }
  };

  const getAssignedToNames = (assignedToJson) => {
    try {
      if (typeof assignedToJson === 'string') {
        const assignedTo = JSON.parse(assignedToJson);
        return assignedTo.map(user => user.fullName).join('، ');
      } else if (Array.isArray(assignedToJson)) {
        return assignedToJson.map(user => user.fullName).join('، ');
      }
      return 'غير معروف';
    } catch {
      return 'غير معروف';
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const refreshData = () => {
    fetchAllData();
  };

  // تجميع المهام حسب الفروع
  const groupTasksByBranch = () => {
    const branchesWithTasks = {};
    
    branches.forEach(branch => {
      branchesWithTasks[branch.guid] = {
        branch,
        sentTasks: [],
        receivedTasks: []
      };
    });
    
    branchesWithTasks.unknown = {
      branch: { name: "اداري", guid: "unknown" },
      sentTasks: [],
      receivedTasks: []
    };
    
    filteredTasks.forEach(task => {
      const senderBranchGuid = task.branchInfo.senderBranch.guid;
      const receiverBranchGuid = task.branchInfo.receiverBranch.guid;
      
      if (branchesWithTasks[senderBranchGuid]) {
        branchesWithTasks[senderBranchGuid].sentTasks.push(task);
      } else {
        branchesWithTasks.unknown.sentTasks.push(task);
      }
      
      if (branchesWithTasks[receiverBranchGuid]) {
        branchesWithTasks[receiverBranchGuid].receivedTasks.push(task);
      } else {
        branchesWithTasks.unknown.receivedTasks.push(task);
      }
    });
    
    return branchesWithTasks;
  };

  const branchesWithTasks = groupTasksByBranch();

  // إحصائيات لكل فرع
  const calculateBranchStats = (tasks) => {
    const stats = {
      pending: 0,
      inProgress: 0,
      completed: 0,
      cancelled: 0,
      total: tasks.length,
      modified: tasks.filter(task => task.isModified).length
    };

    tasks.forEach(task => {
      const lastStatus = getLastUpdateStatus(task);
      switch(lastStatus) {
        case 0: stats.pending++; break;
        case 1: stats.inProgress++; break;
        case 2: stats.completed++; break;
        case 3: stats.cancelled++; break;
        default: break;
      }
    });

    return stats;
  };

  const colors = {
    primary: '#1976d2',
    primaryLight: '#42a5f5',
    primaryDark: '#1565c0',
    secondary: '#9c27b0',
    secondaryLight: '#ba68c8',
    secondaryDark: '#7b1fa2',
    error: '#d32f2f',
    errorLight: '#ef5350',
    errorDark: '#c62828',
    warning: '#ed6c02',
    warningLight: '#ff9800',
    warningDark: '#e65100',
    info: '#0288d1',
    infoLight: '#03a9f4',
    infoDark: '#01579b',
    success: '#2e7d32',
    successLight: '#4caf50',
    successDark: '#1b5e20',
    background: '#f5f5f5',
    paper: '#ffffff',
    textPrimary: 'rgba(0, 0, 0, 0.87)',
    textSecondary: 'rgba(0, 0, 0, 0.6)',
  };

  return (
    <NavigationShell variant="admin" ><Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: colors.background }}>
      
      
      <Box component="main" sx={{
        flexGrow: 1,
        p: 3,
        ...navigationContentSx
      }}>
        <Stack spacing={3}>
          {/* Header Section */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: 2,
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
            p: 3,
            borderRadius: 2,
            color: 'white'
          }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                المهام حسب الفروع
              </Typography>
              <Typography variant="body2">
                نظام متكامل لإدارة ومتابعة المهام بين فروع المؤسسة
              </Typography>
            </Box>
            
            <Box sx={uiLayout.withUiSx({ display: 'flex', alignItems: 'center', gap: 2 }, uiLayout.filterBarSx)}>
              <TextField
                label="من تاريخ"
                type="date"
                value={dateRange.start}
                onChange={(e) => handleDateChange('start', e.target.value)}
                InputLabelProps={{ 
                  shrink: true,
                  sx: { color: 'white' }
                }}
                sx={uiLayout.withUiSx({ 
                  width: 150,
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': {
                      borderColor: 'rgba(255,255,255,0.5)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'white',
                    },
                  }
                }, uiLayout.formFieldSx)}
                inputProps={{ 
                  max: format(new Date(), 'yyyy-MM-dd'),
                  sx: { color: 'white' }
                , dir: "ltr" , style: { direction: "ltr", unicodeBidi: "isolate" } }}
              />
              <TextField
                label="إلى تاريخ"
                type="date"
                value={dateRange.end}
                onChange={(e) => handleDateChange('end', e.target.value)}
                InputLabelProps={{ 
                  shrink: true,
                  sx: { color: 'white' }
                }}
                sx={uiLayout.withUiSx({ 
                  width: 150,
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': {
                      borderColor: 'rgba(255,255,255,0.5)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'white',
                    },
                  }
                }, uiLayout.formFieldSx)}
                inputProps={{ 
                  max: format(new Date(), 'yyyy-MM-dd'),
                  min: dateRange.start,
                  sx: { color: 'white' }
                , dir: "ltr" , style: { direction: "ltr", unicodeBidi: "isolate" } }}
              />
              
              <Button
                variant="contained"
                onClick={fetchAllData}
                disabled={!dateRange.start || !dateRange.end}
                sx={uiLayout.withUiSx({ 
                  backgroundColor: 'white',
                  color: colors.primary,
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.9)',
                  }
                }, uiLayout.buttonSx)}
                startIcon={<Search />}
              >
                بحث
              </Button>
              
              <Tooltip title="الفلاتر">
                <IconButton
                  onClick={toggleFilters}
                  sx={{ 
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.5)',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.1)',
                    }
                  }}
                >
                  <FilterList />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Filters Section */}
          <Collapse in={showFilters}>
            <Paper elevation={4} sx={{ p: 3, mb: 2, backgroundColor: colors.paper, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', color: colors.primary }}>
                <FilterList sx={{ marginInlineEnd: 1 }} /> فلاتر البحث
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl sx={uiLayout.formFieldSx} fullWidth>
                    <InputLabel>حالة المهمة</InputLabel>
                    <Select
                      value={filters.status}
                      label="حالة المهمة"
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                    >
                      <MenuItem value="all">جميع الحالات</MenuItem>
                      <MenuItem value={0}>معلقة</MenuItem>
                      <MenuItem value={1}>قيد التنفيذ</MenuItem>
                      <MenuItem value={2}>مكتملة</MenuItem>
                      <MenuItem value={3}>ملغاة</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl sx={uiLayout.formFieldSx} fullWidth>
                    <InputLabel>الفرع</InputLabel>
                    <Select
                      value={filters.branch}
                      label="الفرع"
                      onChange={(e) => handleFilterChange('branch', e.target.value)}
                    >
                      <MenuItem value="all">جميع الفروع</MenuItem>
                      {branches.map(branch => (
                        <MenuItem key={branch.guid} value={branch.guid}>
                          {branch.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl sx={uiLayout.formFieldSx} fullWidth>
                    <InputLabel>الفترة الزمنية</InputLabel>
                    <Select
                      value={filters.timeRange}
                      label="الفترة الزمنية"
                      onChange={(e) => handleFilterChange('timeRange', e.target.value)}
                    >
                      <MenuItem value="all">جميع الفترات</MenuItem>
                      <MenuItem value="today">اليوم</MenuItem>
                      <MenuItem value="week">أسبوع</MenuItem>
                      <MenuItem value="month">شهر</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={filters.showModifiedOnly}
                        onChange={(e) => handleFilterChange('showModifiedOnly', e.target.checked)}
                        sx={{
                          color: colors.primary,
                          '&.Mui-checked': {
                            color: colors.primary,
                          },
                        }}
                      />
                    }
                    label="عرض المهام المعدلة فقط"
                  />
                </Grid>
              </Grid>
            </Paper>
          </Collapse>

          {!dateRange.start || !dateRange.end ? (
            <Paper elevation={3} sx={{ p: 6, textAlign: 'center', backgroundColor: colors.paper, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <CalendarMonth sx={{ fontSize: 60, color: colors.info, mb: 2 }} />
                <Typography variant="h5" sx={{ color: colors.infoDark, fontWeight: 'bold', mb: 2 }}>
                  نظام إدارة المهام المتقدم
                </Typography>
                <Typography variant="body1" sx={{ color: colors.textSecondary, mb: 3, maxWidth: 500 }}>
                  يرجى تحديد الفترة الزمنية المطلوبة (من تاريخ - إلى تاريخ) لعرض المهام والتحليلات الخاصة بكل فرع
                </Typography>
                <Button 
                  variant="contained" 
                  size="large"
                  startIcon={<CalendarMonth />}
                  sx={uiLayout.withUiSx({ 
                    backgroundColor: colors.primary,
                    '&:hover': {
                      backgroundColor: colors.primaryDark,
                    }
                  }, uiLayout.buttonSx)}
                >
                  تحديد الفترة الزمنية
                </Button>
              </Box>
            </Paper>
          ) : loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
              <Box sx={{ textAlign: 'center' }}>
                <CircularProgress size={60} thickness={4} sx={{ color: colors.primary, mb: 2 }} />
                <Typography variant="h6" sx={{ color: colors.primary }}>
                  جاري تحميل البيانات...
                </Typography>
              </Box>
            </Box>
          ) : error ? (
            <Paper elevation={3} sx={{ p: 3, textAlign: 'center', backgroundColor: colors.errorLight, borderRadius: 2 }}>
              <Typography sx={{ color: colors.error }}>{error}</Typography>
            </Paper>
          ) : tasks.length === 0 ? (
            <Paper elevation={3} sx={{ p: 6, textAlign: 'center', backgroundColor: colors.paper, borderRadius: 2 }}>
              <Assignment sx={{ fontSize: 60, color: colors.warning, mb: 2 }} />
              <Typography variant="h6" sx={{ color: colors.warningDark, mb: 2 }}>
                لا توجد مهام في الفترة المحددة
              </Typography>
              <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                لم يتم العثور على أي مهام للفترة من {dateRange.start} إلى {dateRange.end}
              </Typography>
            </Paper>
          ) : (
            <Box>
              <Typography variant="h5" sx={{ mb: 3, color: colors.primary, display: 'flex', alignItems: 'center' }}>
                <Business sx={{ marginInlineEnd: 1 }} /> الفروع
              </Typography>
              
              <Grid container spacing={3}>
                {Object.values(branchesWithTasks).map((branchData, index) => {
                  if (branchData.sentTasks.length === 0 && branchData.receivedTasks.length === 0) return null;
                  
                  const sentStats = calculateBranchStats(branchData.sentTasks);
                  const receivedStats = calculateBranchStats(branchData.receivedTasks);
                  const totalTasks = sentStats.total + receivedStats.total;
                  
                  if (totalTasks === 0) return null;
                  
                  return (
                    <Grid item xs={12} sm={6} md={4} key={branchData.branch.guid}>
                      <Card 
                        elevation={3} 
                        sx={{ 
                          borderRadius: 2,
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                          }
                        }}
                        onClick={() => handleBranchClick(branchData)}
                      >
                        <CardHeader 
                          title={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Business sx={{ marginInlineEnd: 1, color: colors.primary }} />
                              <Typography variant="h6">{branchData.branch.name}</Typography>
                            </Box>
                          }
                          sx={{ 
                            backgroundColor: alpha(colors.primary, 0.1),
                            borderBottom: `1px solid ${alpha(colors.primary, 0.2)}`
                          }}
                        />
                        <CardContent>
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Box sx={{ textAlign: 'center', p: 1 }}>
                                <Typography variant="h4" sx={{ color: colors.primary, fontWeight: 'bold' }}>
                                  {sentStats.total}
                                </Typography>
                                <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                                  مهام مرسلة
                                </Typography>
                            </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box sx={{ textAlign: 'center', p: 1 }}>
                                <Typography variant="h4" sx={{ color: colors.secondary, fontWeight: 'bold' }}>
                                  {receivedStats.total}
                                </Typography>
                                <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                                  مهام مستلمة
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>
                          
                          <Box sx={{ mt: 2, p: 1, backgroundColor: alpha(colors.primary, 0.05), borderRadius: 1 }}>
                            <Typography variant="body2" sx={{ textAlign: 'center', color: colors.textSecondary }}>
                              {sentStats.completed + receivedStats.completed} مكتملة • {sentStats.pending + receivedStats.pending} معلقة
                            </Typography>
                          </Box>
                          
                          <Button 
                            fullWidth 
                            variant="outlined" 
                            sx={uiLayout.withUiSx({ mt: 2 }, uiLayout.buttonSx)}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBranchClick(branchData);
                            }}
                          >
                            عرض التفاصيل
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          )}
        </Stack>

        {/* Branch Details Dialog */}
        <Dialog sx={uiLayout.dialogLayoutSx} 
          open={branchDialogOpen} 
          onClose={handleCloseBranchDialog} 
          maxWidth="lg" 
          fullWidth
          PaperProps={{
            sx: { borderRadius: 2 }
          }}
        >
          <DialogTitle sx={{ 
            backgroundColor: colors.primary, 
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Business sx={{ marginInlineEnd: 1 }} />
              <span>تفاصيل فرع {selectedBranchData?.branch.name}</span>
            </Box>
            <IconButton onClick={handleCloseBranchDialog} sx={{ color: 'white' }}>
              <Cancel />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 3 }}>
            {selectedBranchData && (
              <Box>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ mb: 2 }}>
                      <CardHeader 
                        title={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <TrendingUp sx={{ marginInlineEnd: 1 }} />
                            <span>إحصائيات المهام المرسلة</span>
                          </Box>
                        }
                        sx={{ 
                          backgroundColor: alpha(colors.primary, 0.1),
                          borderBottom: `1px solid ${alpha(colors.primary, 0.2)}`
                        }}
                      />
                      <CardContent>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Box sx={{ textAlign: 'center', p: 1 }}>
                              <Typography variant="h4" sx={{ color: colors.primary, fontWeight: 'bold' }}>
                                {calculateBranchStats(selectedBranchData.sentTasks).total}
                              </Typography>
                              <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                                الإجمالي
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box sx={{ textAlign: 'center', p: 1 }}>
                              <Typography variant="h4" sx={{ color: colors.success, fontWeight: 'bold' }}>
                                {calculateBranchStats(selectedBranchData.sentTasks).completed}
                              </Typography>
                              <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                                مكتملة
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box sx={{ textAlign: 'center', p: 1 }}>
                              <Typography variant="h4" sx={{ color: colors.warning, fontWeight: 'bold' }}>
                                {calculateBranchStats(selectedBranchData.sentTasks).pending}
                              </Typography>
                              <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                                معلقة
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box sx={{ textAlign: 'center', p: 1 }}>
                              <Typography variant="h4" sx={{ color: colors.info, fontWeight: 'bold' }}>
                                {calculateBranchStats(selectedBranchData.sentTasks).inProgress}
                              </Typography>
                              <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                                قيد التنفيذ
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                    
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                      <Assignment sx={{ marginInlineEnd: 1 }} /> المهام المرسلة
                    </Typography>
                    
                    {selectedBranchData.sentTasks.map(task => {
                      const lastStatus = getLastUpdateStatus(task);
                      const displayData = getTaskDisplayData(task);
                      const isModified = task.isModified;
                      
                      return (
                        <Paper 
                          key={task.id} 
                          elevation={1} 
                          sx={{ 
                            p: 2, 
                            mb: 2, 
                            backgroundColor: colors.paper,
                            borderRadius: 2,
                            borderInlineStart: `4px solid ${colors.primary}`,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: alpha(colors.primary, 0.05),
                              transform: 'translateX(4px)'
                            }
                          }}
                          onClick={() => handleTaskClick(task)}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box sx={{ flexGrow: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                  {displayData.name}
                                </Typography>
                                {isModified && (
                                  <Tooltip title="مهمة معدلة">
                                    <Edit sx={{ fontSize: 16, ml: 1, color: colors.secondary }} />
                                  </Tooltip>
                                )}
                              </Box>
                              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                                إلى: {getAssignedToNames(displayData.assignedTo)}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {format(new Date(task.createdAt), 'dd/MM/yyyy HH:mm', { locale: arSA })}
                              </Typography>
                            </Box>
                            <Chip
                              icon={statusMap[lastStatus]?.icon}
                              label={statusMap[lastStatus]?.label || 'غير معروف'}
                              sx={{
                                color: 
                                  lastStatus === 0 ? colors.warningDark :
                                  lastStatus === 1 ? colors.infoDark :
                                  lastStatus === 2 ? colors.successDark :
                                  colors.errorDark,
                                borderColor: 
                                  lastStatus === 0 ? colors.warning :
                                  lastStatus === 1 ? colors.info :
                                  lastStatus === 2 ? colors.success :
                                  colors.error,
                                backgroundColor: 
                                  lastStatus === 0 ? colors.warningLight + '40' :
                                  lastStatus === 1 ? colors.infoLight + '40' :
                                  lastStatus === 2 ? colors.successLight + '40' :
                                  colors.errorLight + '40'
                              }}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        </Paper>
                      );
                    })}
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Card sx={{ mb: 2 }}>
                      <CardHeader 
                        title={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <TrendingUp sx={{ marginInlineEnd: 1 }} />
                            <span>إحصائيات المهام المستلمة</span>
                          </Box>
                        }
                        sx={{ 
                          backgroundColor: alpha(colors.secondary, 0.1),
                          borderBottom: `1px solid ${alpha(colors.secondary, 0.2)}`
                        }}
                      />
                      <CardContent>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Box sx={{ textAlign: 'center', p: 1 }}>
                              <Typography variant="h4" sx={{ color: colors.secondary, fontWeight: 'bold' }}>
                                {calculateBranchStats(selectedBranchData.receivedTasks).total}
                              </Typography>
                              <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                                الإجمالي
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box sx={{ textAlign: 'center', p: 1 }}>
                              <Typography variant="h4" sx={{ color: colors.success, fontWeight: 'bold' }}>
                                {calculateBranchStats(selectedBranchData.receivedTasks).completed}
                              </Typography>
                              <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                                مكتملة
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box sx={{ textAlign: 'center', p: 1 }}>
                              <Typography variant="h4" sx={{ color: colors.warning, fontWeight: 'bold' }}>
                                {calculateBranchStats(selectedBranchData.receivedTasks).pending}
                              </Typography>
                              <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                                معلقة
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box sx={{ textAlign: 'center', p: 1 }}>
                              <Typography variant="h4" sx={{ color: colors.info, fontWeight: 'bold' }}>
                                {calculateBranchStats(selectedBranchData.receivedTasks).inProgress}
                              </Typography>
                              <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                                قيد التنفيذ
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                    
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                      <Assignment sx={{ marginInlineEnd: 1 }} /> المهام المستلمة
                    </Typography>
                    
                    {selectedBranchData.receivedTasks.map(task => {
                      const lastStatus = getLastUpdateStatus(task);
                      const displayData = getTaskDisplayData(task);
                      const isModified = task.isModified;
                      
                      return (
                        <Paper 
                          key={task.id} 
                          elevation={1} 
                          sx={{ 
                            p: 2, 
                            mb: 2, 
                            backgroundColor: colors.paper,
                            borderRadius: 2,
                            borderInlineStart: `4px solid ${colors.secondary}`,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: alpha(colors.secondary, 0.05),
                              transform: 'translateX(4px)'
                            }
                          }}
                          onClick={() => handleTaskClick(task)}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box sx={{ flexGrow: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                  {displayData.name}
                                </Typography>
                                {isModified && (
                                  <Tooltip title="مهمة معدلة">
                                    <Edit sx={{ fontSize: 16, ml: 1, color: colors.secondary }} />
                                  </Tooltip>
                                )}
                              </Box>
                              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                                من: {getUserName(task.assignedBy)}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {format(new Date(task.createdAt), 'dd/MM/yyyy HH:mm', { locale: arSA })}
                              </Typography>
                            </Box>
                            <Chip
                              icon={statusMap[lastStatus]?.icon}
                              label={statusMap[lastStatus]?.label || 'غير معروف'}
                              sx={{
                                color: 
                                  lastStatus === 0 ? colors.warningDark :
                                  lastStatus === 1 ? colors.infoDark :
                                  lastStatus === 2 ? colors.successDark :
                                  colors.errorDark,
                                borderColor: 
                                  lastStatus === 0 ? colors.warning :
                                  lastStatus === 1 ? colors.info :
                                  lastStatus === 2 ? colors.success :
                                  colors.error,
                                backgroundColor: 
                                  lastStatus === 0 ? colors.warningLight + '40' :
                                  lastStatus === 1 ? colors.infoLight + '40' :
                                  lastStatus === 2 ? colors.successLight + '40' :
                                  colors.errorLight + '40'
                              }}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        </Paper>
                      );
                    })}
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={uiLayout.withUiSx({ p: 2 }, uiLayout.dialogActionsSx)}>
            <Button 
              onClick={handleCloseBranchDialog} 
              sx={uiLayout.withUiSx({ 
                minWidth: 120,
                backgroundColor: colors.primary,
                color: 'white',
                '&:hover': {
                  backgroundColor: colors.primaryDark,
                }
              }, uiLayout.buttonSx)}
            >
              إغلاق
            </Button>
          </DialogActions>
        </Dialog>

        {/* Task Details Dialog */}
        <Dialog sx={uiLayout.dialogLayoutSx} 
          open={openDialog} 
          onClose={handleCloseDialog} 
          maxWidth="md" 
          fullWidth
          PaperProps={{
            sx: { borderRadius: 2 }
          }}
        >
          <DialogTitle sx={{ 
            backgroundColor: colors.primary, 
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>تفاصيل المهمة</span>
            {selectedTask && (
              <Chip
                icon={statusMap[getLastUpdateStatus(selectedTask)]?.icon}
                label={statusMap[getLastUpdateStatus(selectedTask)]?.label || 'غير معروف'}
                sx={{ 
                  color: 'white', 
                  backgroundColor: colors.primaryDark,
                  borderColor: 'rgba(255, 255, 255, 0.3)'
                }}
              />
            )}
          </DialogTitle>
          <DialogContent dividers sx={{ p: 3 }}>
            {selectedTask && (
              <Stack spacing={3}>
                <Box>
                  <Typography variant="h6" sx={{ color: colors.primary, mb: 1 }}>
                    {getTaskDisplayData(selectedTask).name}
                  </Typography>
                  <Typography variant="subtitle2" color="textSecondary">
                    تم إنشاؤها في: {format(new Date(selectedTask.createdAt), 'dd/MM/yyyy HH:mm', { locale: arSA })}
                  </Typography>
                </Box>
                
                <Box sx={{ 
                  p: 2, 
                  backgroundColor: 'rgba(0, 0, 0, 0.04)', 
                  borderRadius: 1,
                  borderInlineStart: '4px solid',
                  borderColor: colors.primary
                }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>الوصف:</Typography>
                  <Typography paragraph sx={{ ml: 2 }}>{getTaskDisplayData(selectedTask).description}</Typography>
                </Box>
                
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
                  gap: 2 
                }}>
                  <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                    <Typography variant="subtitle2" color="textSecondary">الوقت المطلوب</Typography>
                    <Typography variant="body1">{getTaskDisplayData(selectedTask).time} ساعة</Typography>
                  </Paper>
                  
                  <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                    <Typography variant="subtitle2" color="textSecondary">تم إنشاؤها بواسطة</Typography>
                    <Typography variant="body1">{getUserName(selectedTask.assignedBy)}</Typography>
                  </Paper>
                  
                  <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                    <Typography variant="subtitle2" color="textSecondary">مخصصة ل</Typography>
                    <Typography variant="body1">{getAssignedToNames(getTaskDisplayData(selectedTask).assignedTo)}</Typography>
                  </Paper>
                </Box>
                
                {selectedTask.isModified && (
                  <Alert severity="info" sx={{ backgroundColor: colors.infoLight + '20' }}>
                    تم تعديل هذه المهمة .
                  </Alert>
                )}
                
                {selectedTask.allowAttach && selectedTask.attachFileName && (
                  <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>المرفق:</Typography>
                    <Typography>{selectedTask.attachFileName}</Typography>
                  </Paper>
                )}
                
                {selectedTask.note && (
                  <Paper elevation={0} sx={{ 
                    p: 2, 
                    backgroundColor: colors.warningLight + '20', 
                    borderRadius: 1,
                    borderInlineStart: '4px solid',
                    borderColor: colors.warning
                  }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>ملاحظة:</Typography>
                    <Typography>{selectedTask.note}</Typography>
                  </Paper>
                )}

                <Typography variant="h6" sx={{ color: colors.primary }}>
                  سجل التحديثات
                </Typography>
                
                {taskUpdates.length > 0 ? (
                  <TableContainer sx={uiLayout.tableContainerSx} component={Paper} elevation={0} variant="outlined">
                    <Table size="small">
                      <TableHead sx={{ backgroundColor: 'rgba(0, 0, 0, 0.04)' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>الحالة</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>ملاحظة</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>المستخدم</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>تاريخ التحديث</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {taskUpdates.map((update, index) => (
                          <TableRow key={index} hover>
                            <TableCell>
                              <Chip
                                icon={statusMap[update.status]?.icon}
                                label={statusMap[update.status]?.label || 'غير معروف'}
                                sx={{
                                  color: 
                                    update.status === 0 ? colors.warningDark :
                                    update.status === 1 ? colors.infoDark :
                                    update.status === 2 ? colors.successDark :
                                    colors.errorDark,
                                  borderColor: 
                                    update.status === 0 ? colors.warning :
                                    update.status === 1 ? colors.info :
                                    update.status === 2 ? colors.success :
                                    colors.error,
                                  backgroundColor: 
                                    update.status === 0 ? colors.warningLight + '40' :
                                    update.status === 1 ? colors.infoLight + '40' :
                                    update.status === 2 ? colors.successLight + '40' :
                                    colors.errorLight + '40'
                                }}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>{update.statusNote}</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar sx={{ width: 24, height: 24, marginInlineEnd: 1, fontSize: '0.8rem' }}>
                                  {update.updatedByName.charAt(0)}
                                </Avatar>
                                {update.updatedByName}
                              </Box>
                            </TableCell>
                            <TableCell>
                              {format(new Date(update.updatedAt), 'dd/MM/yyyy HH:mm', { locale: arSA })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                  </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', p: 2 }}>
                    لا توجد تحديثات مسجلة لهذه المهمة
                  </Typography>
                )}
              </Stack>
            )}
          </DialogContent>
          <DialogActions sx={uiLayout.withUiSx({ p: 2 }, uiLayout.dialogActionsSx)}>
            <Button 
              onClick={handleCloseDialog} 
              sx={uiLayout.withUiSx({ 
                minWidth: 120,
                backgroundColor: colors.primary,
                color: 'white',
                '&:hover': {
                  backgroundColor: colors.primaryDark,
                }
              }, uiLayout.buttonSx)}
            >
              إغلاق
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box></NavigationShell>
  );
};

export default AdminViewTasksByBranches;