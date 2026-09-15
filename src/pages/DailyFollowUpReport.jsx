import * as uiLayout from '../components/common/uiLayout';
import './rtl-forms-fix.css';
import deepmerge from '@mui/utils/deepmerge';
import { rtlComponents } from '../config/rtlComponents';
import { navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
import React, { useState, useEffect } from 'react';
import { 
  createTheme, 
  ThemeProvider, 
  styled, 
  alpha 
} from '@mui/material/styles';
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
  Checkbox,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
  Chip,
  Menu,
  MenuItem,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  Snackbar,
  Alert,
  Card,
  CardContent,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  AddCircleOutline, 
  RemoveCircleOutline, 
  ArrowForward, 
  ArrowBack,
  FilterList,
  Check,
  Clear,
  Visibility,
  Close,
  People as PeopleAltIcon,
  Assignment as AssignmentIcon,
  School as SchoolIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  Engineering as EngineeringIcon,
  Task as TaskIcon
} from '@mui/icons-material';

import DiplomaStatistics from '../components/DiplomaStatistics';
import ComplaintsSuggestionsTasks from '../components/ComplaintsSuggestionsTasks';
import appTheme from '../theme';
// Professional theme with Cairo font and updated color scheme
const theme = createTheme(deepmerge(appTheme, {
  typography: {
    fontFamily: '"Cairo", sans-serif',
    h4: {
      fontWeight: 600,
      color: '#80b49e',
      fontSize: '1.15rem'
    },
    h6: {
      fontWeight: 600,
      color: '#6a9a87',
      fontSize: '0.9rem'
    },
    body1: {
      color: '#2c3e50'
    }
  },
  direction: "rtl",
  palette: {
    primary: {
      main: '#80b49e',
      light: '#9ac9b5',
      dark: '#6a9a87',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#4caf50',
      light: '#80e27e',
      dark: '#087f23'
    },
    background: {
      default: '#f8fbfa',
      paper: '#ffffff'
    },
    text: {
      primary: '#2c3e50',
      secondary: '#5d6d7e'
    }
  },
  shape: {
    borderRadius: 12
  }
}));

// Enhanced styled components with modern design
const MainContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  minHeight: '100vh',
  backgroundColor: theme.palette.background.default,
  backgroundImage: 'linear-gradient(to bottom, #f8fbfa 0%, #e8f4ef 100%)'
}));

const ContentContainer = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(4),
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.easeInOut,
    duration: theme.transitions.duration.standard
  }),
  [theme.breakpoints.down('md')]: {
    marginLeft: '0',
    padding: theme.spacing(3)
  },
  ...navigationContentSx
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: '0px 12px 30px rgba(128, 180, 158, 0.08)',
  marginBottom: theme.spacing(4),
  backgroundColor: theme.palette.background.paper,
  border: '1px solid rgba(128, 180, 158, 0.1)',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3)
  }
}));

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  boxShadow: '0px 4px 20px rgba(128, 180, 158, 0.05)',
  marginTop: theme.spacing(3),
  overflow: 'hidden',
  border: '1px solid rgba(128, 180, 158, 0.1)',
  '& .MuiTableCell-root': {
    borderBottom: `1px solid rgba(128, 180, 158, 0.1)`,
    padding: theme.spacing(2),
    '&:first-of-type': {
      paddingLeft: theme.spacing(3)
    },
    '&:last-of-type': {
      paddingRight: theme.spacing(3)
    }
  }
}));

const StyledTableHead = styled(TableHead)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.08),
  '& .MuiTableCell-root': {
    fontWeight: 700,
    color: theme.palette.primary.dark,
    fontSize: '0.875rem',
    letterSpacing: '0.5px'
  }
}));

const StatusBadge = styled(Box)(({ theme, active }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: theme.spacing(0.5, 1.5),
  borderRadius: '20px',
  backgroundColor: active ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
  border: `1px solid ${active ? theme.palette.primary.main : theme.palette.divider}`,
  cursor: 'pointer',
  transition: theme.transitions.create(['background-color', 'border-color'], {
    duration: theme.transitions.duration.short
  }),
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
    borderColor: active ? theme.palette.primary.main : theme.palette.text.secondary
  },
  '& .MuiTypography-root': {
    fontWeight: active ? 600 : 500,
    color: active ? theme.palette.primary.dark : theme.palette.text.secondary
  }
}));

const statusOptions = [
  { label: 'حاضر', value: 'present', color: '#4caf50' },
  { label: 'غائب', value: 'absent', color: '#f44336' },
  { label: 'استئذان', value: 'permission', color: '#ff9800' },
  { label: 'اجازة', value: 'leave', color: '#2196f3' }
];

const AttendanceStatus = ({ employeeGuid, attendance, setAttendance }) => {
  const currentStatus = attendance[employeeGuid];
  
  const handleStatusChange = (status) => {
    if (currentStatus === status) {
      // If clicking the already selected status, unselect it
      const newAttendance = { ...attendance };
      delete newAttendance[employeeGuid];
      setAttendance(newAttendance);
    } else {
      setAttendance(prev => ({
        ...prev,
        [employeeGuid]: status
      }));
    }
  };

  return (
    <Box display="flex" gap={1.5} flexWrap="wrap">
      {statusOptions.map(({ label, value, color }) => (
        <StatusBadge 
          key={value}
          active={currentStatus === value}
          onClick={() => handleStatusChange(value)}
        >
          <Checkbox
            checked={currentStatus === value}
            onChange={() => handleStatusChange(value)}
            color="primary"
            size="small"
            sx={{ 
              padding: 0, 
              marginRight: 1,
              color: currentStatus === value ? color : theme.palette.action.disabled
            }}
          />
          <Typography variant="body2">{label}</Typography>
        </StatusBadge>
      ))}
    </Box>
  );
};

const AttendanceReport = ({ employees, attendance, setAttendance, loading, error }) => {
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [bulkStatus, setBulkStatus] = useState('');
  const [positionFilter, setPositionFilter] = useState('');

  const openFilter = Boolean(filterAnchorEl);

  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const newSelected = employees.map((emp) => emp.guid);
      setSelectedEmployees(newSelected);
      return;
    }
    setSelectedEmployees([]);
  };

  const handleSelectEmployee = (employeeGuid) => {
    const selectedIndex = selectedEmployees.indexOf(employeeGuid);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedEmployees, employeeGuid);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedEmployees.slice(1));
    } else if (selectedIndex === selectedEmployees.length - 1) {
      newSelected = newSelected.concat(selectedEmployees.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedEmployees.slice(0, selectedIndex),
        selectedEmployees.slice(selectedIndex + 1)
      );
    }

    setSelectedEmployees(newSelected);
  };

  const handleBulkStatusChange = () => {
    if (!bulkStatus || selectedEmployees.length === 0) return;

    const newAttendance = { ...attendance };
    selectedEmployees.forEach(guid => {
      newAttendance[guid] = bulkStatus;
    });
    setAttendance(newAttendance);
    setBulkStatus('');
  };

  const handleClearBulkStatus = () => {
    const newAttendance = { ...attendance };
    selectedEmployees.forEach(guid => {
      delete newAttendance[guid];
    });
    setAttendance(newAttendance);
  };

  const filteredEmployees = employees.filter(emp => 
    !positionFilter || emp.position === positionFilter
  );

  const positions = [...new Set(employees.map(emp => emp.position))];

  return (
    <Box mt={4}>
      <Box sx={uiLayout.pageHeaderSx} display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" fontWeight="bold" color="primary">
          التقرير الحضوري للموظفين
        </Typography>
        
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={handleFilterClick}
            sx={uiLayout.withUiSx({
              borderRadius: '8px',
              borderWidth: '2px',
              fontWeight: 600
            }, uiLayout.buttonSx)}
          >
            خيارات متقدمة
          </Button>
          
          <Menu
            anchorEl={filterAnchorEl}
            open={openFilter}
            onClose={handleFilterClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <Box p={2} width={320}>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>
                تحديث جماعي
              </Typography>
              
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <FormControl sx={uiLayout.formFieldSx} fullWidth size="small">
                  <InputLabel>حالة الحضور</InputLabel>
                  <Select
                    value={bulkStatus}
                    onChange={(e) => setBulkStatus(e.target.value)}
                    label="حالة الحضور"
                  >
                    {statusOptions.map(({ label, value }) => (
                      <MenuItem key={value} value={value}>{label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <Tooltip title="تطبيق">
                  <IconButton 
                    color="primary" 
                    onClick={handleBulkStatusChange}
                    disabled={!bulkStatus || selectedEmployees.length === 0}
                  >
                    <Check />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="مسح الحالة">
                  <IconButton 
                    color="error"
                    onClick={handleClearBulkStatus}
                    disabled={selectedEmployees.length === 0}
                  >
                    <Clear />
                  </IconButton>
                </Tooltip>
              </Box>
              
              <Typography variant="body2" color="text.secondary">
                {selectedEmployees.length} موظف محدد
              </Typography>
            </Box>
          </Menu>
        </Box>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress color="primary" size={60} thickness={4} />
        </Box>
      ) : error ? (
        <Box 
          p={2} 
          borderRadius={1} 
          bgcolor="error.light" 
          color="error.contrastText"
          textAlign="center"
        >
          <Typography variant="body1">{error}</Typography>
        </Box>
      ) : (
        <StyledTableContainer sx={uiLayout.tableContainerSx} component={Paper}>
          <Table>
            <StyledTableHead>
              <TableRow>
                <TableCell padding="checkbox" sx={{ width: '48px' }}>
                  <Checkbox
                    indeterminate={
                      selectedEmployees.length > 0 &&
                      selectedEmployees.length < filteredEmployees.length
                    }
                    checked={
                      filteredEmployees.length > 0 &&
                      selectedEmployees.length === filteredEmployees.length
                    }
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell sx={{ width: '40%' }}>اسم الموظف</TableCell>
                <TableCell align="center">حالة الحضور</TableCell>
              </TableRow>
            </StyledTableHead>
            <TableBody>
              {filteredEmployees.map((employee) => {
                const isSelected = selectedEmployees.indexOf(employee.guid) !== -1;
                const currentStatus = attendance[employee.guid];
                const statusOption = statusOptions.find(opt => opt.value === currentStatus);

                return (
                  <TableRow 
                    key={employee.guid}
                    hover
                    selected={isSelected}
                    sx={{ 
                      '&:last-child td': { borderBottom: 0 },
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.02)
                      }
                    }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleSelectEmployee(employee.guid)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={600} color="text.primary">
                        {employee.fullName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {employee.position}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" justifyContent="center">
                        <AttendanceStatus
                          employeeGuid={employee.guid}
                          attendance={attendance}
                          setAttendance={setAttendance}
                        />
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </StyledTableContainer>
      )}
    </Box>
  );
};

const OrderedListInput = ({ title, items, setItems }) => {
  const handleItemChange = (index, value) => {
    const newItems = [...items];
    newItems[index] = value;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, '']);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };

  return (
    <Box mt={4}>
      <Typography variant="h6" gutterBottom fontWeight="bold" color="primary" sx={{ mb: 3 }}>
        {title}
      </Typography>
      <List sx={{ padding: 0 }}>
        {items.map((item, index) => (
          <ListItem 
            key={index} 
            sx={{ 
              padding: 0,
              marginBottom: 2,
              alignItems: 'flex-start',
              transition: theme.transitions.create('background-color', {
                duration: theme.transitions.duration.shortest
              }),
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.02)
              }
            }}
          >
            <Box display="flex" width="100%" alignItems="center">
              <Box 
                display="flex" 
                alignItems="center" 
                justifyContent="center"
                minWidth={36}
                height={36}
                borderRadius="50%"
                bgcolor={alpha(theme.palette.primary.main, 0.1)}
                color={theme.palette.primary.dark}
                marginRight={2}
                sx={{
                  fontWeight: 600,
                  fontSize: '0.875rem'
                }}
              >
                {index + 1}
              </Box>
              <TextField InputLabelProps={{ shrink: true }}
                fullWidth
                variant="outlined"
                value={item}
                onChange={(e) => handleItemChange(index, e.target.value)}
                placeholder={`أدخل البند ${index + 1}`}
                size="small"
                sx={uiLayout.withUiSx({
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    '& fieldset': {
                      borderColor: alpha(theme.palette.primary.main, 0.3)
                    },
                    '&:hover fieldset': {
                      borderColor: alpha(theme.palette.primary.main, 0.5)
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.primary.main,
                      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`
                    }
                  }
                }, uiLayout.formFieldSx)}
              />
              <Box style={{display:"flex"}} marginLeft={2}>
                {index === items.length - 1 && (
                  <IconButton 
                    onClick={addItem} 
                    color="primary"
                    size="small"
                    sx={{ 
                      marginRight: 1,
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      '&:hover': { 
                        backgroundColor: alpha(theme.palette.primary.main, 0.2) 
                      }
                    }}
                  >
                    <AddCircleOutline fontSize="small" />
                  </IconButton>
                )}
                <IconButton 
                  onClick={() => removeItem(index)} 
                  color="error"
                  size="small"
                  sx={{ 
                    backgroundColor: alpha(theme.palette.error.main, 0.1),
                    '&:hover': { 
                      backgroundColor: alpha(theme.palette.error.main, 0.2) 
                    }
                  }}
                >
                  <RemoveCircleOutline fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

const ReportPreview = ({ 
  employees, 
  attendance, 
  trainingReview, 
  supervisoryVisits, 
  unusualWork, 
  dailyTasks,
  diplomaData,
  complaintsData,
  onConfirm,
  submitLoading,
  onCancel
}) => {
  const getStatusLabel = (status) => {
    const statusMap = {
      present: 'حاضر',
      absent: 'غائب',
      permission: 'استئذان',
      leave: 'اجازة'
    };
    return statusMap[status] || 'غير محدد';
  };

  const getStatusColor = (status) => {
    const colorMap = {
      present: '#4CAF50',
      absent: '#F44336',
      permission: '#FF9800',
      leave: '#2196F3'
    };
    return colorMap[status] || '#9E9E9E';
  };

  const getStatusBgColor = (status) => {
    const bgColorMap = {
      present: 'rgba(76, 175, 80, 0.1)',
      absent: 'rgba(244, 67, 54, 0.1)',
      permission: 'rgba(255, 152, 0, 0.1)',
      leave: 'rgba(33, 150, 243, 0.1)'
    };
    return bgColorMap[status] || 'rgba(158, 158, 158, 0.1)';
  };

  return (
    <Box sx={uiLayout.withUiSx({ p: 3 }, uiLayout.pageHeaderSx)}>
      {/* Header Section */}
      <Box sx={{ 
        textAlign: 'center',
        mb: 4,
        p: 3,
        backgroundColor: '#f8fafc',
        borderRadius: 2,
        borderInlineStart: '4px solid #1976d2'
      }}>
        <Typography variant="h4" sx={{ 
          fontWeight: 700,
          color: '#1976d2',
          mb: 1
        }}>
          معاينة التقرير النهائي
        </Typography>
        <Typography variant="body1" sx={{ color: '#546e7a' }}>
          يرجى مراجعة البيانات قبل تأكيد الإرسال
        </Typography>
      </Box>

      {/* Attendance Section */}
      <Card sx={{ 
        mb: 4,
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        border: '1px solid rgba(0,0,0,0.03)'
      }}>
        <CardContent>
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            mb: 3,
            pb: 2,
            borderBottom: '1px solid rgba(0,0,0,0.05)'
          }}>
            <Box sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: '#e3f2fd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2
            }}>
              <PeopleAltIcon color="primary" />
            </Box>
            <Typography variant="h5" sx={{ 
              fontWeight: 700,
              color: '#1976d2'
            }}>
              حالة حضور الموظفين
            </Typography>
          </Box>

          <TableContainer sx={uiLayout.tableContainerSx}>
            <Table>
              <TableHead>
                <TableRow sx={{ 
                  backgroundColor: '#f5f9fd',
                  '& th': {
                    fontWeight: 700,
                    color: '#1976d2'
                  }
                }}>
                  <TableCell sx={{ width: '40%' }}>اسم الموظف</TableCell>
                  <TableCell sx={{ width: '30%' }}>الوظيفة</TableCell>
                  <TableCell sx={{ width: '30%' }} align="center">حالة الحضور</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow 
                    key={employee.guid}
                    sx={{ 
                      '&:last-child td': { borderBottom: 0 },
                      '&:hover': { backgroundColor: '#f8fafc' }
                    }}
                  >
                    <TableCell>
                      <Typography fontWeight={600}>{employee.fullName}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {employee.position}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box
                        sx={{
                          display: 'inline-block',
                          px: 2,
                          py: 1,
                          borderRadius: '20px',
                          backgroundColor: getStatusBgColor(attendance[employee.guid] || 'absent'),
                          color: getStatusColor(attendance[employee.guid] || 'absent'),
                          fontWeight: 600,
                          fontSize: '0.8rem'
                        }}
                      >
                        {getStatusLabel(attendance[employee.guid] || 'absent')}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Work Items Section */}
      <Typography variant="h5" sx={{ 
        fontWeight: 700,
        color: '#1976d2',
        mb: 3,
        display: 'flex',
        alignItems: 'center'
      }}>
        <AssignmentIcon sx={{ marginInlineEnd: 1 }} />
        تفاصيل الأعمال اليومية
      </Typography>

      <Grid container spacing={3}>
        {/* Training Review */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            height: '100%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            border: '1px solid rgba(0,0,0,0.03)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 24px rgba(0,0,0,0.08)'
            }
          }}>
            <CardContent>
              <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                mb: 2
              }}>
                <SchoolIcon sx={{ 
                  color: '#4CAF50',
                  marginInlineEnd: 1.5,
                  fontSize: '1.5rem'
                }} />
                <Typography variant="h6" sx={{ 
                  fontWeight: 700,
                  color: '#2E7D32'
                }}>
                  مراجعة التدريب الأهلي
                </Typography>
              </Box>
              
              <List dense sx={{ p: 0 }}>
                {trainingReview.filter(item => item.trim()).map((item, index) => (
                  <ListItem 
                    key={index}
                    sx={{
                      p: '8px 0',
                      alignItems: 'flex-start',
                      '&:hover': { backgroundColor: 'rgba(0,0,0,0.01)' }
                    }}
                  >
                    <Box sx={{
                      minWidth: 24,
                      height: 24,
                      borderRadius: '50%',
                      backgroundColor: '#E8F5E9',
                      color: '#2E7D32',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2,
                      mt: '2px',
                      fontWeight: 600,
                      fontSize: '0.75rem'
                    }}>
                      {index + 1}
                    </Box>
                    <ListItemText 
                      primary={item}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Supervisory Visits */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            height: '100%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            border: '1px solid rgba(0,0,0,0.03)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 24px rgba(0,0,0,0.08)'
            }
          }}>
            <CardContent>
              <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                mb: 2
              }}>
                <AssignmentTurnedInIcon sx={{ 
                  color: '#FF9800',
                  marginInlineEnd: 1.5,
                  fontSize: '1.5rem'
                }} />
                <Typography variant="h6" sx={{ 
                  fontWeight: 700,
                  color: '#E65100'
                }}>
                  زيارات إشرافية خارجية
                </Typography>
              </Box>
              
              <List dense sx={{ p: 0 }}>
                {supervisoryVisits.filter(item => item.trim()).map((item, index) => (
                  <ListItem 
                    key={index}
                    sx={{
                      p: '8px 0',
                      alignItems: 'flex-start',
                      '&:hover': { backgroundColor: 'rgba(0,0,0,0.01)' }
                    }}
                  >
                    <Box sx={{
                      minWidth: 24,
                      height: 24,
                      borderRadius: '50%',
                      backgroundColor: '#FFF3E0',
                      color: '#E65100',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2,
                      mt: '2px',
                      fontWeight: 600,
                      fontSize: '0.75rem'
                    }}>
                      {index + 1}
                    </Box>
                    <ListItemText 
                      primary={item}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Unusual Work */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            height: '100%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            border: '1px solid rgba(0,0,0,0.03)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 24px rgba(0,0,0,0.08)'
            }
          }}>
            <CardContent>
              <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                mb: 2
              }}>
                <EngineeringIcon sx={{ 
                  color: '#9C27B0',
                  marginInlineEnd: 1.5,
                  fontSize: '1.5rem'
                }} />
                <Typography variant="h6" sx={{ 
                  fontWeight: 700,
                  color: '#6A1B9A'
                }}>
                  أعمال غير اعتيادية
                </Typography>
              </Box>
              
              <List dense sx={{ p: 0 }}>
                {unusualWork.filter(item => item.trim()).map((item, index) => (
                  <ListItem 
                    key={index}
                    sx={{
                      p: '8px 0',
                      alignItems: 'flex-start',
                      '&:hover': { backgroundColor: 'rgba(0,0,0,0.01)' }
                    }}
                  >
                    <Box sx={{
                      minWidth: 24,
                      height: 24,
                      borderRadius: '50%',
                      backgroundColor: '#F3E5F5',
                      color: '#6A1B9A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2,
                      mt: '2px',
                      fontWeight: 600,
                      fontSize: '0.75rem'
                    }}>
                      {index + 1}
                    </Box>
                    <ListItemText 
                      primary={item}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Daily Tasks */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            height: '100%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            border: '1px solid rgba(0,0,0,0.03)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 24px rgba(0,0,0,0.08)'
            }
          }}>
            <CardContent>
              <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                mb: 2
              }}>
                <TaskIcon sx={{ 
                  color: '#2196F3',
                  marginInlineEnd: 1.5,
                  fontSize: '1.5rem'
                }} />
                <Typography variant="h6" sx={{ 
                  fontWeight: 700,
                  color: '#1565C0'
                }}>
                  مهام عمل يومية
                </Typography>
              </Box>
              
              <List dense sx={{ p: 0 }}>
                {dailyTasks.filter(item => item.trim()).map((item, index) => (
                  <ListItem 
                    key={index}
                    sx={{
                      p: '8px 0',
                      alignItems: 'flex-start',
                      '&:hover': { backgroundColor: 'rgba(0,0,0,0.01)' }
                    }}
                  >
                    <Box sx={{
                      minWidth: 24,
                      height: 24,
                      borderRadius: '50%',
                      backgroundColor: '#E3F2FD',
                      color: '#1565C0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2,
                      mt: '2px',
                      fontWeight: 600,
                      fontSize: '0.75rem'
                    }}>
                      {index + 1}
                    </Box>
                    <ListItemText 
                      primary={item}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Diploma Statistics Section */}
      <Typography variant="h5" sx={{ 
        fontWeight: 700,
        color: '#1976d2',
        mb: 3,
        mt: 6,
        display: 'flex',
        alignItems: 'center'
      }}>
        <SchoolIcon sx={{ marginInlineEnd: 1 }} />
        إحصائيات الدبلومات
      </Typography>

      <Grid container spacing={3}>
        {/* Registrations */}
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            height: '100%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            border: '1px solid rgba(0,0,0,0.03)'
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ 
                fontWeight: 700,
                color: '#1976d2',
                mb: 2,
                display: 'flex',
                alignItems: 'center'
              }}>
                <AssignmentTurnedInIcon sx={{ marginInlineEnd: 1, color: '#1976d2' }} />
                تسجيلات جديدة
              </Typography>
              
              <List dense sx={{ p: 0 }}>
                {diplomaData.registrations.filter(reg => 
                  reg.diplomaName.trim() || reg.count.trim() || reg.batch.trim()
                ).map((reg, index) => (
                  <ListItem key={index} sx={{ p: '8px 0' }}>
                    <ListItemText
                      primary={`${reg.diplomaName || 'غير محدد'} - ${reg.count || '0'}`}
                      secondary={`الدفعة: ${reg.batch || 'غير محدد'}`}
                      primaryTypographyProps={{ fontWeight: 600 }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Attendance */}
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            height: '100%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            border: '1px solid rgba(0,0,0,0.03)'
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ 
                fontWeight: 700,
                color: '#1976d2',
                mb: 2,
                display: 'flex',
                alignItems: 'center'
              }}>
                <PeopleAltIcon sx={{ marginInlineEnd: 1, color: '#1976d2' }} />
                حضور الدبلومات
              </Typography>
              
              <List dense sx={{ p: 0 }}>
                {diplomaData.attendance.filter(att => 
                  att.diplomaName.trim() || att.count.trim()
                ).map((att, index) => (
                  <ListItem key={index} sx={{ p: '8px 0' }}>
                    <ListItemText
                      primary={`${att.diplomaName || 'غير محدد'} - ${att.count || '0'}`}
                      primaryTypographyProps={{ fontWeight: 600 }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Approvals */}
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            height: '100%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            border: '1px solid rgba(0,0,0,0.03)'
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ 
                fontWeight: 700,
                color: '#1976d2',
                mb: 2,
                display: 'flex',
                alignItems: 'center'
              }}>
                <Check sx={{ marginInlineEnd: 1, color: '#1976d2' }} />
                اعتمادات الدبلومات
              </Typography>
              
              <List dense sx={{ p: 0 }}>
                {diplomaData.approvals.filter(app => 
                  app.diplomaName.trim() || app.count.trim() || app.batch.trim()
                ).map((app, index) => (
                  <ListItem key={index} sx={{ p: '8px 0' }}>
                    <ListItemText
                      primary={`${app.diplomaName || 'غير محدد'} - ${app.count || '0'}`}
                      secondary={`الدفعة: ${app.batch || 'غير محدد'}`}
                      primaryTypographyProps={{ fontWeight: 600 }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Complaints & Suggestions Section */}
      <Typography variant="h5" sx={{ 
        fontWeight: 700,
        color: '#1976d2',
        mb: 3,
        mt: 6,
        display: 'flex',
        alignItems: 'center'
      }}>
        <AssignmentIcon sx={{ marginInlineEnd: 1 }} />
        الشكاوي والمقترحات
      </Typography>

      <Grid container spacing={3}>
        {/* Complaints */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            height: '100%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            border: '1px solid rgba(0,0,0,0.03)'
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ 
                fontWeight: 700,
                color: '#f44336',
                mb: 2,
                display: 'flex',
                alignItems: 'center'
              }}>
                <Clear sx={{ marginInlineEnd: 1, color: '#f44336' }} />
                الشكاوي
              </Typography>
              
              <List dense sx={{ p: 0 }}>
                {complaintsData.complaints.filter(c => c.trim()).map((complaint, index) => (
                  <ListItem key={index} sx={{ p: '8px 0' }}>
                    <Box sx={{
                      minWidth: 24,
                      height: 24,
                      borderRadius: '50%',
                      backgroundColor: '#ffebee',
                      color: '#f44336',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2,
                      mt: '2px',
                      fontWeight: 600,
                      fontSize: '0.75rem'
                    }}>
                      {index + 1}
                    </Box>
                    <ListItemText 
                      primary={complaint}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Suggestions */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            height: '100%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            border: '1px solid rgba(0,0,0,0.03)'
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ 
                fontWeight: 700,
                color: '#4caf50',
                mb: 2,
                display: 'flex',
                alignItems: 'center'
              }}>
                <Check sx={{ marginInlineEnd: 1, color: '#4caf50' }} />
                المقترحات
              </Typography>
              
              <List dense sx={{ p: 0 }}>
                {complaintsData.suggestions.filter(s => s.trim()).map((suggestion, index) => (
                  <ListItem key={index} sx={{ p: '8px 0' }}>
                    <Box sx={{
                      minWidth: 24,
                      height: 24,
                      borderRadius: '50%',
                      backgroundColor: '#e8f5e9',
                      color: '#4caf50',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2,
                      mt: '2px',
                      fontWeight: 600,
                      fontSize: '0.75rem'
                    }}>
                      {index + 1}
                    </Box>
                    <ListItemText 
                      primary={suggestion}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box sx={uiLayout.withUiSx({ 
        mt: 4,
        pt: 3,
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 2,
        borderTop: '1px solid rgba(0,0,0,0.1)'
      }, uiLayout.actionBarSx)}>
        <Button
          variant="outlined"
          color="primary"
          onClick={onCancel}
          sx={uiLayout.withUiSx({
            minWidth: 150,
            py: 1.5,
            fontWeight: 600,
            borderRadius: '8px',
            borderWidth: '2px',
            '&:hover': {
              borderWidth: '2px',
              backgroundColor: 'rgba(25, 118, 210, 0.04)'
            }
          }, uiLayout.buttonSx)}
        >
          تعديل التقرير
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={onConfirm}
          disabled={submitLoading}
          sx={uiLayout.withUiSx({
            minWidth: 150,
            py: 1.5,
            fontWeight: 600,
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(25, 118, 210, 0.3)',
            '&:hover': {
              boxShadow: '0 4px 14px rgba(25, 118, 210, 0.4)'
            }
          }, uiLayout.buttonSx)}
        >
          {submitLoading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            'تأكيد الإرسال'
          )}
        </Button>
      </Box>
    </Box>
  );
};

const steps = [
  'التقرير الحضوري',
  'مراجعة التدريب الأهلي',
  'زيارات إشرافية خارجية',
  'أعمال غير اعتيادية',
  'مهام عمل يومية', 
  'إحصائيات الدبلومات',
  'الشكاوي والمقترحات'
];

const DailyFollowUpReport = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attendance, setAttendance] = useState({});
  const [trainingReview, setTrainingReview] = useState(['']);
  const [supervisoryVisits, setSupervisoryVisits] = useState(['']);
  const [unusualWork, setUnusualWork] = useState(['']);
  const [dailyTasks, setDailyTasks] = useState(['']);
  const [diplomaData, setDiplomaData] = useState({
  registrations: [{ diplomaName: '', count: '', batch: '' }],
  attendance: [{ diplomaName: '', count: '' }],
  approvals: [{ diplomaName: '', count: '', batch: '' }]
});

const [complaintsData, setComplaintsData] = useState({
  complaints: [''],
  suggestions: ['']
});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [showPreview, setShowPreview] = useState(false);

  // Get current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem('user'));
  const currentBranch = currentUser?.branchForWork;

useEffect(() => {
  const fetchEmployees = async () => {
    try {
      const response = await fetch('https://api1.sstli.com/api/userinfo');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      
      // Filter employees by branchForWork AND staut_ = true
      const filteredEmployees = data.filter(
        emp => emp.branchForWork === currentBranch && emp.staut_ === true
      );
      
      setEmployees(filteredEmployees);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  fetchEmployees();
}, [currentBranch]);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const handleCancelPreview = () => {
    setShowPreview(false);
  };

const submitReport = async () => {
  try {
    setSubmitLoading(true);
    setShowPreview(false);
    
    const employeesData = employees.map(emp => ({
      employeeGuid: emp.guid,
      employeeName: emp.fullName,
      employeePosition: emp.position,
      status: attendance[emp.guid] || 'absent'
    }));

    const reportData = {
      userGuid: currentUser.guid,
      branchGuid: currentUser.branchForWork,
      employees: employeesData,
      trainingReview: trainingReview.filter(item => item.trim() !== ''),
      supervisoryVisits: supervisoryVisits.filter(item => item.trim() !== ''),
      unusualWork: unusualWork.filter(item => item.trim() !== ''),
      dailyTasks: dailyTasks.filter(item => item.trim() !== ''),
      diplomaRegistrations: diplomaData.registrations.filter(reg => 
        reg.diplomaName.trim() !== '' && reg.count.trim() !== ''
      ),
      diplomaAttendance: diplomaData.attendance.filter(att => 
        att.diplomaName.trim() !== '' && att.count.trim() !== ''
      ),
      diplomaApprovals: diplomaData.approvals.filter(app => 
        app.diplomaName.trim() !== '' && app.count.trim() !== ''
      ),
      complaints: complaintsData.complaints.filter(c => c.trim() !== ''),
      suggestions: complaintsData.suggestions.filter(s => s.trim() !== '')
    };

    const response = await fetch('https://filesregsiteration.sstli.com/save_report.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reportData)
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to save report');
    }

    setSnackbar({
      open: true,
      message: 'تم حفظ التقرير بنجاح',
      severity: 'success'
    });
    
    // Reset form
    setAttendance({});
    setTrainingReview(['']);
    setSupervisoryVisits(['']);
    setUnusualWork(['']);
    setDailyTasks(['']);
    setDiplomaData({
      registrations: [{ diplomaName: '', count: '', batch: '' }],
      attendance: [{ diplomaName: '', count: '' }],
      approvals: [{ diplomaName: '', count: '', batch: '' }]
    });
    setComplaintsData({
      complaints: [''],
      suggestions: ['']
    });
    setActiveStep(0);
  } catch (error) {
    setSnackbar({
      open: true,
      message: `حدث خطأ: ${error.message}`,
      severity: 'error'
    });
  } finally {
    setSubmitLoading(false);
  }
};

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

const renderStepContent = (step) => {
 if (showPreview) {
  return (
    <ReportPreview
      employees={employees}
      attendance={attendance}
      trainingReview={trainingReview}
      supervisoryVisits={supervisoryVisits}
      unusualWork={unusualWork}
      dailyTasks={dailyTasks}
      diplomaData={diplomaData}
      complaintsData={complaintsData}
      onConfirm={submitReport}
      onCancel={handleCancelPreview}
      submitLoading={submitLoading} // Add this line
    />
  );
}

  switch (step) {
    case 0:
      return <AttendanceReport employees={employees} attendance={attendance} setAttendance={setAttendance} loading={loading} error={error} />;
    case 1:
      return <OrderedListInput title="مراجعة التدريب الأهلي" items={trainingReview} setItems={setTrainingReview} />;
    case 2:
      return <OrderedListInput title="زيارات إشرافية خارجية" items={supervisoryVisits} setItems={setSupervisoryVisits} />;
    case 3:
      return <OrderedListInput title="أعمال غير اعتيادية" items={unusualWork} setItems={setUnusualWork} />;
    case 4:
      return <OrderedListInput title="مهام عمل يومية" items={dailyTasks} setItems={setDailyTasks} />;
    case 5:
      return <DiplomaStatistics diplomaData={diplomaData} setDiplomaData={setDiplomaData} />;
    case 6:
      return <ComplaintsSuggestionsTasks complaintsData={complaintsData} setComplaintsData={setComplaintsData} />;
    default:
      return null;
  }
};

  return (
    <NavigationShell variant="standard" ><ThemeProvider theme={(outerTheme) => ({ ...theme, palette: outerTheme.palette })}>
      <MainContainer>
        
        <ContentContainer>
          <StyledPaper>
            <Typography variant="h4" gutterBottom fontWeight="bold" color="primary" sx={{ mb: 3 }}>
              تقرير المتابعة اليومي
            </Typography>
            <Divider sx={{ 
              marginBottom: 4,
              borderColor: alpha(theme.palette.primary.main, 0.2),
              borderBottomWidth: 2
            }} />
            
            <Stepper 
              activeStep={activeStep} 
              alternativeLabel
              sx={{ 
                padding: 3,
                backgroundColor: alpha(theme.palette.primary.main, 0.03),
                borderRadius: theme.shape.borderRadius,
                mb: 4,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
              }}
            >
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel 
                    sx={{
                      '& .MuiStepLabel-label': {
                        fontWeight: 600,
                        fontSize: '0.85rem'
                      }
                    }}
                    StepIconProps={{
                      sx: {
                        '&.Mui-completed': { 
                          color: 'success.main',
                          '& .MuiStepIcon-text': {
                            fill: theme.palette.success.contrastText
                          }
                        },
                        '&.Mui-active': { 
                          color: 'primary.main',
                          '& .MuiStepIcon-text': {
                            fill: theme.palette.primary.contrastText
                          }
                        },
                        '&.Mui-disabled': {
                          color: theme.palette.action.disabledBackground
                        }
                      }
                    }}
                  >
                    {label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
            
            <Box mt={4} mb={6}>
              {renderStepContent(activeStep)}
            </Box>
            
            <Box 
              mt={4} 
              display="flex" 
              justifyContent="space-between"
              sx={{
                position: 'sticky',
                bottom: 20,
                backgroundColor: 'background.paper',
                padding: 2,
                borderRadius: theme.shape.borderRadius,
                boxShadow: '0px -4px 20px rgba(0, 0, 0, 0.08)',
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                zIndex: 1
              }}
            >
              <Box>
                {activeStep === steps.length - 1 && !showPreview && (
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handlePreview}
                    disabled={submitLoading}
                    sx={uiLayout.withUiSx({
                      padding: '10px 24px',
                      fontWeight: 600,
                      borderRadius: '8px'
                    }, uiLayout.buttonSx)}
                  >
                    معاينة التقرير
                  </Button>
                )}
              </Box>
              
              <Box sx={uiLayout.actionBarSx} display="flex" gap={2}>
                <Button sx={uiLayout.buttonSx}
                  variant="outlined"
                  disabled={activeStep === 0 || showPreview}
                  startIcon={<ArrowForward />}
                  onClick={handleBack}
                >
                  السابق
                </Button>
                <Button sx={uiLayout.buttonSx}
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<ArrowBack />}
                  disabled={activeStep === steps.length - 1 || showPreview}
                >
                  التالي
                </Button>
              </Box>
            </Box>
          </StyledPaper>
        </ContentContainer>
      </MainContainer>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider></NavigationShell>
  );
};

export default DailyFollowUpReport;