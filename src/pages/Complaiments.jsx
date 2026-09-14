import PageContainer from '../components/common/PageContainer';
import * as uiLayout from '../components/common/uiLayout';
import './rtl-forms-fix.css';
import deepmerge from '@mui/utils/deepmerge';
import { rtlComponents } from '../config/rtlComponents';
import { navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
import React, { useEffect, useState, useRef } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Paper, 
  Table, 
  TableHead, 
  TableRow, 
  TableCell, 
  TableBody,
  CircularProgress,
  Container,
  Avatar,
  Card,
  CardContent,
  Divider,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  TextareaAutosize,
  TablePagination,
  Pagination,
  createTheme,
  ThemeProvider
} from "@mui/material";

import Swal from 'sweetalert2';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Menu from '@mui/material/Menu';
import VisibilityIcon from '@mui/icons-material/Visibility';

// إنشاء الثيم الجديد باللون #80b49e
const theme = createTheme(deepmerge({ direction: "rtl", components: rtlComponents }, {
  palette: {
    primary: {
      main: '#80b49e',
      light: '#a8d5c0',
      dark: '#5a8f7e',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#f5a623',
      light: '#f7c46c',
      dark: '#b37719',
    },
    background: {
      default: '#f8fbf9',
      paper: '#ffffff',
    },
    text: {
      primary: '#2c3e50',
      secondary: '#546e7a',
    },
    success: {
      main: '#4caf50',
      light: '#80e27e',
      dark: '#087f23',
    },
    warning: {
      main: '#ff9800',
      light: '#ffc947',
      dark: '#c66900',
    },
    error: {
      main: '#f44336',
      light: '#ff7961',
      dark: '#ba000d',
    },
  },
  typography: {
    fontFamily: '"Cairo", "Tahoma", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      color: '#2c3e50',
    },
    h6: {
      fontWeight: 600,
      color: '#2c3e50',
    },
    body1: {
      color: '#546e7a',
    },
    body2: {
      color: '#546e7a',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          padding: '8px 24px',
          boxShadow: '0 2px 8px rgba(128, 180, 158, 0.2)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(128, 180, 158, 0.3)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 20px rgba(128, 180, 158, 0.15)',
          border: '1px solid rgba(128, 180, 158, 0.1)',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#f8fbf9',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          color: '#2c3e50',
          backgroundColor: '#f8fbf9',
        },
        body: {
          color: '#546e7a',
        },
      },
    },
  },
}));

// Styled components
const CenteredContainer = styled(Container)({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  minHeight: '80vh',
  padding: '2rem',
  background: 'linear-gradient(135deg, #f8fbf9 0%, #e8f4ef 100%)',
});

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: '16px',
  boxShadow: '0 8px 32px rgba(128, 180, 158, 0.15)',
  marginBottom: theme.spacing(4),
  overflow: 'hidden',
  border: `1px solid ${theme.palette.primary.light}20`,
  background: 'linear-gradient(145deg, #ffffff 0%, #f8fbf9 100%)',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 12px 40px rgba(128, 180, 158, 0.25)',
  }
}));

const StyledTable = styled(Table)(({ theme }) => ({
  minWidth: 650,
  '& .MuiTableCell-head': {
    fontWeight: 'bold',
    backgroundColor: '#f8fbf9',
    borderBottom: `2px solid ${theme.palette.primary.light}40`,
  },
  '& .MuiTableRow-root': {
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: `${theme.palette.primary.light}10`,
    }
  }
}));

const StatusBadge = styled(Box)(({ theme, status }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(0.5, 1.5),
  borderRadius: 20,
  fontWeight: 600,
  fontSize: '0.75rem',
  backgroundColor: 
    status === 'pending' ? theme.palette.warning.light : 
    status === 'resolved' ? theme.palette.success.light : 
    theme.palette.error.light,
  color: 
    status === 'pending' ? theme.palette.warning.dark : 
    status === 'resolved' ? theme.palette.success.dark : 
    theme.palette.error.dark,
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
}));

const CommentText = styled(Typography)(({ theme }) => ({
  fontStyle: 'italic',
  color: theme.palette.text.secondary,
  marginTop: theme.spacing(1),
  padding: theme.spacing(1.5),
  backgroundColor: `${theme.palette.primary.light}10`,
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.primary.light}20`,
}));

const GradientButton = styled(Button)(({ theme }) => ({
  background: `linear-gradient(45deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
  color: 'white',
  fontWeight: 600,
  '&:hover': {
    background: `linear-gradient(45deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
    boxShadow: '0 6px 20px rgba(128, 180, 158, 0.4)',
  },
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  background: `linear-gradient(45deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
  fontWeight: 'bold',
  boxShadow: '0 2px 8px rgba(128, 180, 158, 0.3)',
}));

const Complaints = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const [complaints, setComplaints] = useState([]);
  const [previousComplaints, setPreviousComplaints] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [formData, setFormData] = useState({
    complaintFromGuid: '',
    complaintFromName: '',
    complaintToGuid: '',
    complaintToName: '',
    title: '',
    details: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [comment, setComment] = useState('');
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState('');
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState('');
  const selectedComplaintRef = useRef(null);
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [previousPage, setPreviousPage] = useState(0);
  const [previousRowsPerPage, setPreviousRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://api1.sstli.com/api/userinfo');
        const data = await response.json();
        
        const filteredEmployees = data.filter(emp => 
          emp.branchForWork === user.branchForWork
        );
        
        setEmployees(filteredEmployees);
        setAllEmployees(data);
        setLoading(false);
      } catch (error) {
        setLoading(false);
        console.error('Error fetching employees:', error);
        Swal.fire({
          icon: 'error',
          title: 'خطأ',
          text: 'فشل في جلب بيانات الموظفين',
          confirmButtonText: 'حسناً'
        });
      }
    };

    fetchEmployees();
  }, [user.branchForWork]);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        setLoading(true);
        
        if ([0, 1, 2].includes(user.userJop)) {
          // For admins: fetch complaints sent to them
          const response = await fetch(`https://filesregsiteration.sstli.com/Post_Compalimient.php?toUserId=${user.guid}`);
          const data = await response.json();
          setComplaints(data);
        } else {
          // For regular employees: fetch complaints sent to them
          const incomingResponse = await fetch(`https://filesregsiteration.sstli.com/Post_Compalimient.php?toUserId=${user.guid}`);
          const incomingData = await incomingResponse.json();
          setComplaints(incomingData);
          
          // Fetch complaints they sent (previous)
          const previousResponse = await fetch(`https://filesregsiteration.sstli.com/Post_Compalimient.php?fromUserId=${user.guid}`);
          const previousData = await previousResponse.json();
          setPreviousComplaints(previousData);
        }
        
        setLoading(false);
      } catch (error) {
        setLoading(false);
        console.error('Error fetching complaints:', error);
        Swal.fire({
          icon: 'error',
          title: 'خطأ',
          text: 'فشل في جلب الشكاوى',
          confirmButtonText: 'حسناً'
        });
      }
    };

    fetchComplaints();
  }, [user.userJop, user.guid]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'complaintFromGuid') {
      const selectedEmployee = employees.find(emp => emp.guid === value);
      setFormData(prev => ({
        ...prev,
        complaintFromGuid: value,
        complaintFromName: selectedEmployee ? selectedEmployee.fullName : ''
      }));
    } else if (name === 'complaintToGuid') {
      const selectedEmployee = allEmployees.find(emp => emp.guid === value);
      setFormData(prev => ({
        ...prev,
        complaintToGuid: value,
        complaintToName: selectedEmployee ? selectedEmployee.fullName : ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const response = await fetch('https://filesregsiteration.sstli.com/Post_Compalimient.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          complaint_from_guid: formData.complaintFromGuid,
          complaint_from_name: formData.complaintFromName,
          complaint_to_guid: formData.complaintToGuid,
          complaint_to_name: formData.complaintToName,
          title: formData.title,
          details: formData.details,
          created_by_guid: user.guid,
          created_by_name: user.fullName,
          status: 'pending'
        })
      });

      const result = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'تم بنجاح',
          text: 'تم إرسال الشكوى بنجاح',
          confirmButtonText: 'حسناً',
          background: '#f8fbf9',
          color: '#2c3e50'
        });
        setFormData({
          complaintFromGuid: '',
          complaintFromName: '',
          complaintToGuid: '',
          complaintToName: '',
          title: '',
          details: ''
        });
        setOpenDialog(false);
        
        // Refresh complaints after submission
        if ([0, 1, 2].includes(user.userJop)) {
          const refreshResponse = await fetch(`https://filesregsiteration.sstli.com/Post_Compalimient.php?toUserId=${user.guid}`);
          const refreshData = await refreshResponse.json();
          setComplaints(refreshData);
        } else {
          const incomingResponse = await fetch(`https://filesregsiteration.sstli.com/Post_Compalimient.php?toUserId=${user.guid}`);
          const incomingData = await incomingResponse.json();
          setComplaints(incomingData);
          
          const previousResponse = await fetch(`https://filesregsiteration.sstli.com/Post_Compalimient.php?fromUserId=${user.guid}`);
          const previousData = await previousResponse.json();
          setPreviousComplaints(previousData);
        }
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'خطأ',
        text: error.message,
        confirmButtonText: 'حسناً',
        background: '#f8fbf9',
        color: '#2c3e50'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleMenuOpen = (event, complaint) => {
    setAnchorEl(event.currentTarget);
    setSelectedComplaint(complaint);
    selectedComplaintRef.current = complaint;
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleStatusDialogOpen = (status) => {
    if (!selectedComplaintRef.current) {
      console.error("No complaint selected");
      return;
    }
    setSelectedStatus(status);
    setStatusDialogOpen(true);
    handleMenuClose();
  };

  const handleStatusDialogClose = () => {
    setStatusDialogOpen(false);
    setComment('');
    setSelectedStatus('');
  };

  const handleCommentDialogOpen = (comment) => {
    setSelectedComment(comment);
    setCommentDialogOpen(true);
  };

  const handleCommentDialogClose = () => {
    setCommentDialogOpen(false);
    setSelectedComment('');
  };

  const handleDetailsDialogOpen = (details) => {
    setSelectedDetails(details);
    setDetailsDialogOpen(true);
  };

  const handleDetailsDialogClose = () => {
    setDetailsDialogOpen(false);
    setSelectedDetails('');
  };

  const updateComplaintStatus = async () => {
    if (!selectedComplaintRef.current || !selectedComplaintRef.current.id) {
      console.error("No valid complaint selected", selectedComplaintRef.current);
      Swal.fire({
        icon: 'error',
        title: 'خطأ',
        text: 'لم يتم تحديد شكوى صالحة',
        confirmButtonText: 'حسناً',
        background: '#f8fbf9',
        color: '#2c3e50'
      });
      return;
    }
    
    try {
      setStatusUpdating(true);
      
      console.log("Updating complaint:", {
        id: selectedComplaintRef.current.id,
        status: selectedStatus,
        comment: comment
      });

      const response = await fetch(`https://filesregsiteration.sstli.com/Post_Compalimient.php?id=${selectedComplaintRef.current.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: selectedStatus,
          comment: comment || null
        })
      });

      const result = await response.json();
      console.log("Update response:", result);

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'تم بنجاح',
          text: 'تم تحديث حالة الشكوى بنجاح',
          confirmButtonText: 'حسناً',
          background: '#f8fbf9',
          color: '#2c3e50'
        });
        
        // Update the complaint in state
        const updateComplaintInState = (prevComplaints) => 
          prevComplaints.map(c => 
            c.id === selectedComplaintRef.current.id ? { 
              ...c, 
              status: selectedStatus, 
              comment: comment || c.comment 
            } : c
          );
          
        setComplaints(updateComplaintInState);
        setPreviousComplaints(updateComplaintInState);
        handleStatusDialogClose();
      } else {
        throw new Error(result.message || "Failed to update complaint");
      }
    } catch (error) {
      console.error("Update error:", error);
      Swal.fire({
        icon: 'error',
        title: 'خطأ',
        text: error.message,
        confirmButtonText: 'حسناً',
        background: '#f8fbf9',
        color: '#2c3e50'
      });
    } finally {
      setStatusUpdating(false);
    }
  };

  const getComplaintToEmployees = () => {
    return allEmployees.filter(emp => [0, 1, 2].includes(emp.userJop));
  };

  const getComplaintFromEmployees = () => {
    return employees;
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'pending': return 'قيد الانتظار';
      case 'resolved': return 'تم الحل';
      case 'rejected': return 'مرفوض';
      default: return status;
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle page change for current complaints
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change for current complaints
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle page change for previous complaints
  const handlePreviousChangePage = (event, newPage) => {
    setPreviousPage(newPage);
  };

  // Handle rows per page change for previous complaints
  const handlePreviousChangeRowsPerPage = (event) => {
    setPreviousRowsPerPage(parseInt(event.target.value, 10));
    setPreviousPage(0);
  };

  const renderComplaintsTable = (complaintsData, title, showActions = false, isPrevious = false) => {
    // Calculate pagination based on whether it's previous complaints or not
    const currentPage = isPrevious ? previousPage : page;
    const currentRowsPerPage = isPrevious ? previousRowsPerPage : rowsPerPage;
    
    const paginatedComplaints = complaintsData.slice(
      currentPage * currentRowsPerPage,
      currentPage * currentRowsPerPage + currentRowsPerPage
    );

    return (
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.dark' }}>{title}</Typography>
        {complaintsData.length > 0 ? (
          <>
            <Box sx={{ overflowX: 'auto', borderRadius: 3, border: '1px solid', borderColor: 'primary.light', background: 'white' }}>
              <StyledTable>
                <TableHead>
                  <TableRow>
                    <TableCell>أرسلت بواسطة</TableCell>
                    <TableCell>شكوى من</TableCell>
                    <TableCell>إلى</TableCell>
                    <TableCell>العنوان</TableCell>
                    <TableCell>التفاصيل</TableCell>
                    <TableCell>الحالة</TableCell>
                    <TableCell>التاريخ</TableCell>
                    {showActions && <TableCell>إجراءات</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedComplaints.map(complaint => (
                    <TableRow key={complaint.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <StyledAvatar sx={{ width: 32, height: 32, mr: 2, fontSize: '0.875rem' }}>
                            {complaint.created_by_name?.charAt(0) || '?'}
                          </StyledAvatar>
                          <Box>
                            <Typography variant="body2" fontWeight={500} color="text.primary">
                              {complaint.created_by_name || 'غير معروف'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <StyledAvatar sx={{ width: 32, height: 32, mr: 2, fontSize: '0.875rem' }}>
                            {complaint.complaint_from_name?.charAt(0) || '?'}
                          </StyledAvatar>
                          <Box>
                            <Typography variant="body2" fontWeight={500} color="text.primary">
                              {complaint.complaint_from_name || 'غير معروف'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <StyledAvatar sx={{ width: 32, height: 32, mr: 2, fontSize: '0.875rem' }}>
                            {complaint.complaint_to_name?.charAt(0) || '?'}
                          </StyledAvatar>
                          <Box>
                            <Typography variant="body2" fontWeight={500} color="text.primary">
                              {complaint.complaint_to_name || 'غير معروف'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 200 }}>
                        <Typography variant="body2" noWrap color="text.primary">
                          {complaint.title}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 300 }}>
                        <Box display="flex" alignItems="center">
                          <Typography variant="body2" noWrap sx={{ maxWidth: 100 }} color="text.primary">
                            {complaint.details.length > 10 
                              ? `${complaint.details.substring(0, 10)}...` 
                              : complaint.details}
                          </Typography>
                          {complaint.details.length > 10 && (
                              <Tooltip title="شاهد التفاصيل ">
                              <IconButton 
                                size="small" 
                                onClick={() => handleDetailsDialogOpen(complaint.details)}
                                sx={{ ml: 1, color: 'primary.main' }}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <StatusBadge status={complaint.status}>
                            {getStatusText(complaint.status)}
                          </StatusBadge>
                          {complaint.comment && (
                            <Tooltip title="عرض التعليق">
                              <IconButton 
                                size="small" 
                                onClick={() => handleCommentDialogOpen(complaint.comment)}
                                sx={{ ml: 1, color: 'primary.main' }}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.primary">
                          {new Date(complaint.created_at).toLocaleDateString('ar-EG')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(complaint.created_at).toLocaleTimeString('ar-EG')}
                        </Typography>
                      </TableCell>
                      {showActions && (
                        <TableCell>
                          <IconButton
                            aria-label="more"
                            aria-controls="complaint-actions"
                            aria-haspopup="true"
                            onClick={(e) => handleMenuOpen(e, complaint)}
                            disabled={statusUpdating}
                            sx={{ color: 'primary.main' }}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </StyledTable>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination
                count={Math.ceil(complaintsData.length / currentRowsPerPage)}
                page={currentPage + 1}
                onChange={(e, page) => isPrevious ? handlePreviousChangePage(e, page - 1) : handleChangePage(e, page - 1)}
                color="primary"
                showFirstButton
                showLastButton
              />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <FormControl variant="outlined" sx={uiLayout.withUiSx({ minWidth: 120 }, uiLayout.formFieldSx)}>
                <InputLabel>عدد الصفوف</InputLabel>
                <Select
                  value={currentRowsPerPage}
                  onChange={isPrevious ? handlePreviousChangeRowsPerPage : handleChangeRowsPerPage}
                  label="عدد الصفوف"
                >
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </>
        ) : (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            py: 6,
            border: '2px dashed',
            borderColor: 'primary.light',
            borderRadius: 3,
            backgroundColor: '#f8fbf9'
          }}>
            <Box 
              sx={{ 
                width: 120, 
                height: 120, 
                backgroundColor: 'primary.light', 
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
                opacity: 0.7
              }}
            >
              <Typography variant="h4" color="primary.dark">📝</Typography>
            </Box>
            <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
              لا توجد شكاوى لعرضها
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
              قم بإضافة شكوى جديدة لبدء العمل
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  const renderAddComplaintDialog = () => (
    <Dialog sx={uiLayout.dialogLayoutSx} 
      open={openDialog} 
      onClose={() => setOpenDialog(false)}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: 'linear-gradient(145deg, #ffffff 0%, #f8fbf9 100%)'
        }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: 'primary.main', 
        color: 'white',
        textAlign: 'center',
        py: 3
      }}>
        <Box display="flex" alignItems="center" justifyContent="center">
          <AddIcon sx={{ marginInlineEnd: 1 }} />
          <Typography variant="h6" fontWeight={600}>إضافة شكوى جديدة</Typography>
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ py: 3, bgcolor: '#f8fbf9' }}>
        <Box sx={uiLayout.formGridSx} component="form" onSubmit={handleSubmit}>
          <FormControl fullWidth sx={uiLayout.withUiSx({ mb: 3 }, uiLayout.formFieldSx)}>
            <InputLabel>الشكوى من</InputLabel>
            <Select
              name="complaintFromGuid"
              value={formData.complaintFromGuid}
              onChange={handleInputChange}
              required
              label="الشكوى من"
            >
              {getComplaintFromEmployees().map(emp => (
                <MenuItem key={emp.guid} value={emp.guid}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <StyledAvatar sx={{ width: 32, height: 32, mr: 2, fontSize: '0.875rem' }}>
                      {emp.fullName.charAt(0)}
                    </StyledAvatar>
                    {emp.fullName}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth sx={uiLayout.withUiSx({ mb: 3 }, uiLayout.formFieldSx)}>
            <InputLabel>الشكوى إلى</InputLabel>
            <Select
              name="complaintToGuid"
              value={formData.complaintToGuid}
              onChange={handleInputChange}
              required
              label="الشكوى إلى"
            >
              {getComplaintToEmployees().map(emp => (
                <MenuItem key={emp.guid} value={emp.guid}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <StyledAvatar sx={{ width: 32, height: 32, mr: 2, fontSize: '0.875rem' }}>
                      {emp.fullName.charAt(0)}
                    </StyledAvatar>
                    {emp.fullName}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField InputLabelProps={{ shrink: true }}
            fullWidth
            label="عنوان الشكوى"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            sx={uiLayout.withUiSx({ mb: 3 }, uiLayout.formFieldSx)}
            variant="outlined"
          />
          
          <TextField InputLabelProps={{ shrink: true }}
            fullWidth
            label="تفاصيل الشكوى"
            name="details"
            value={formData.details}
            onChange={handleInputChange}
            required
            multiline
            rows={6}
            sx={uiLayout.withUiSx({ mb: 3 }, uiLayout.formFieldSx)}
            variant="outlined"
          />
        </Box>
      </DialogContent>
      <DialogActions sx={uiLayout.withUiSx({ px: 3, py: 2, bgcolor: '#f8fbf9' }, uiLayout.dialogActionsSx)}>
        <Button 
          onClick={() => setOpenDialog(false)}
          color="error"
          variant="outlined"
          sx={uiLayout.withUiSx({ borderRadius: 2 }, uiLayout.buttonSx)}
        >
          إلغاء
        </Button>
        <GradientButton 
          onClick={handleSubmit}
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={20} /> : <AddIcon />}
        >
          {submitting ? 'جاري الإرسال...' : 'إرسال الشكوى'}
        </GradientButton>
      </DialogActions>
    </Dialog>
  );

  const renderStatusDialog = () => (
    <Dialog sx={uiLayout.dialogLayoutSx}
      open={statusDialogOpen}
      onClose={handleStatusDialogClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: 'linear-gradient(145deg, #ffffff 0%, #f8fbf9 100%)'
        }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', py: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="center">
          {selectedStatus === 'resolved' ? (
            <CheckIcon color="success" sx={{ mr: 1, fontSize: 32 }} />
          ) : selectedStatus === 'rejected' ? (
            <CloseIcon color="error" sx={{ mr: 1, fontSize: 32 }} />
          ) : (
            <MoreVertIcon color="warning" sx={{ mr: 1, fontSize: 32 }} />
          )}
          <Typography variant="h6" fontWeight={600}>
            {selectedStatus === 'resolved' ? 'تم الحل' : 
             selectedStatus === 'rejected' ? 'رفض الشكوى' : 
             'إعادة إلى قيد الانتظار'}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ bgcolor: '#f8fbf9' }}>
        <Typography variant="body1" gutterBottom color="text.primary">
          {selectedStatus === 'resolved' ? 'يرجى إضافة تعليق حول حل الشكوى (اختياري)' : 
           selectedStatus === 'rejected' ? 'يرجى إضافة سبب الرفض (اختياري)' : 
           'يرجى إضافة تعليق (اختياري)'}
        </Typography>
        <TextareaAutosize
          minRows={4}
          maxRows={8}
          style={{ 
            width: '100%', 
            padding: '12px', 
            marginTop: '16px', 
            fontFamily: "Cairo, Tahoma, Arial, sans-serif",
            borderRadius: '8px',
            border: `2px solid #80b49e40`,
            backgroundColor: '#ffffff',
            fontSize: '14px',
            resize: 'vertical'
          }}
          placeholder="أضف تعليقك هنا..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </DialogContent>
      <DialogActions sx={uiLayout.withUiSx({ bgcolor: '#f8fbf9' }, uiLayout.dialogActionsSx)}>
        <Button onClick={handleStatusDialogClose} color="error" variant="outlined" sx={uiLayout.withUiSx({ borderRadius: 2 }, uiLayout.buttonSx)}>
          إلغاء
        </Button>
        <GradientButton 
          onClick={updateComplaintStatus}
          disabled={statusUpdating}
          startIcon={statusUpdating ? <CircularProgress size={20} /> : null}
        >
          {statusUpdating ? 'جاري التحديث...' : 'تأكيد'}
        </GradientButton>
      </DialogActions>
    </Dialog>
  );

  const renderCommentDialog = () => (
    <Dialog sx={uiLayout.dialogLayoutSx}
      open={commentDialogOpen}
      onClose={handleCommentDialogClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: 'linear-gradient(145deg, #ffffff 0%, #f8fbf9 100%)'
        }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', py: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="center">
          <VisibilityIcon color="info" sx={{ marginInlineEnd: 1, fontSize: 32 }} />
          <Typography variant="h6" fontWeight={600}>تعليق على الشكوى</Typography>
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ bgcolor: '#f8fbf9' }}>
        <Typography variant="body1" sx={{ 
          p: 3, 
          backgroundColor: '#ffffff', 
          borderRadius: 2,
          border: `1px solid #80b49e20`,
          minHeight: 100,
          lineHeight: 1.6
        }}>
          {selectedComment || 'لا يوجد تعليق'}
        </Typography>
      </DialogContent>
      <DialogActions sx={uiLayout.withUiSx({ bgcolor: '#f8fbf9' }, uiLayout.dialogActionsSx)}>
        <GradientButton onClick={handleCommentDialogClose}>
          إغلاق
        </GradientButton>
      </DialogActions>
    </Dialog>
  );

  const renderDetailsDialog = () => (
    <Dialog sx={uiLayout.dialogLayoutSx}
      open={detailsDialogOpen}
      onClose={handleDetailsDialogClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: 'linear-gradient(145deg, #ffffff 0%, #f8fbf9 100%)'
        }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', py: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="center">
          <VisibilityIcon color="info" sx={{ marginInlineEnd: 1, fontSize: 32 }} />
          <Typography variant="h6" fontWeight={600}>تفاصيل الشكوى</Typography>
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ bgcolor: '#f8fbf9' }}>
        <Typography variant="body1" sx={{ 
          p: 3, 
          backgroundColor: '#ffffff', 
          borderRadius: 2,
          border: `1px solid #80b49e20`,
          minHeight: 200,
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap'
        }}>
          {selectedDetails}
        </Typography>
      </DialogContent>
      <DialogActions sx={uiLayout.withUiSx({ bgcolor: '#f8fbf9' }, uiLayout.dialogActionsSx)}>
        <GradientButton onClick={handleDetailsDialogClose}>
          إغلاق
        </GradientButton>
      </DialogActions>
    </Dialog>
  );

  return (
    <NavigationShell variant="standard" ><ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #f8fbf9 0%, #e8f4ef 100%)' }}>
        
        <PageContainer component="main" sx={{
          flexGrow: 1,
          
          ...navigationContentSx
        }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
              <CircularProgress size={60} sx={{ color: 'primary.main' }} />
            </Box>
          ) : ![0, 1, 2].includes(user.userJop) ? (
            <CenteredContainer maxWidth="lg">
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h4" fontWeight={700} color="primary.dark">
                  نظام إدارة الشكاوى
                </Typography>
                <GradientButton
                  startIcon={<AddIcon />}
                  onClick={() => setOpenDialog(true)}
                  sx={{ px: 4, py: 1.5 }}
                >
                  إضافة شكوى جديدة
                </GradientButton>
              </Box>

              <StyledCard>
                <CardContent sx={{ p: 4 }}>
                  {renderComplaintsTable(previousComplaints, "الشكاوى التي أرسلتها", false, true)}
                </CardContent>
              </StyledCard>

              {renderAddComplaintDialog()}
              {renderCommentDialog()}
              {renderDetailsDialog()}
            </CenteredContainer>
          ) : (
            <CenteredContainer maxWidth="lg">
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Box>
                  <Typography variant="h4" fontWeight={700} color="primary.dark">
                    الشكاوى المرسلة إليك
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                    لديك {complaints.length} شكوى تحتاج إلى مراجعتك
                  </Typography>
                </Box>
                <Box sx={{ 
                  backgroundColor: 'primary.light', 
                  color: 'primary.dark',
                  px: 3,
                  py: 1,
                  borderRadius: 3,
                  fontWeight: 600
                }}>
                  {complaints.length}
                </Box>
              </Box>

              <StyledCard>
                <CardContent sx={{ p: 4 }}>
                  {renderComplaintsTable(complaints, "الشكاوى الموجهة إليك", true)}
                </CardContent>
              </StyledCard>

              {/* Status Update Menu */}
              <Menu
                id="complaint-actions"
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                  sx: {
                    borderRadius: 2,
                    boxShadow: '0 8px 24px rgba(128, 180, 158, 0.2)',
                    border: '1px solid rgba(128, 180, 158, 0.1)'
                  }
                }}
              >
                <MenuItem 
                  onClick={() => handleStatusDialogOpen('resolved')}
                  disabled={selectedComplaint?.status === 'resolved'}
                  sx={{ borderRadius: 1, my: 0.5 }}
                >
                  <Box display="flex" alignItems="center">
                    <CheckIcon color="success" sx={{ marginInlineEnd: 1 }} />
                    <Typography>تم الحل</Typography>
                  </Box>
                </MenuItem>
                <MenuItem 
                  onClick={() => handleStatusDialogOpen('rejected')}
                  disabled={selectedComplaint?.status === 'rejected'}
                  sx={{ borderRadius: 1, my: 0.5 }}
                >
                  <Box display="flex" alignItems="center">
                    <CloseIcon color="error" sx={{ marginInlineEnd: 1 }} />
                    <Typography>رفض</Typography>
                  </Box>
                </MenuItem>
                <MenuItem 
                  onClick={() => handleStatusDialogOpen('pending')}
                  disabled={selectedComplaint?.status === 'pending'}
                  sx={{ borderRadius: 1, my: 0.5 }}
                >
                  <Box display="flex" alignItems="center">
                    <MoreVertIcon color="warning" sx={{ marginInlineEnd: 1 }} />
                    <Typography>إعادة إلى قيد الانتظار</Typography>
                  </Box>
                </MenuItem>
              </Menu>

              {renderStatusDialog()}
              {renderCommentDialog()}
              {renderDetailsDialog()}
            </CenteredContainer>
          )}
        </PageContainer>
      </Box>
    </ThemeProvider></NavigationShell>
  );
};

export default Complaints;