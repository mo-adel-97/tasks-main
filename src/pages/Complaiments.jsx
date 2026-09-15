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
import appTheme from '../theme';

// إنشاء الثيم الجديد باللون #80b49e
const theme = createTheme(deepmerge(appTheme, {
  palette: {
    primary: {
      main: '#057546',
      light: '#80b49e',
      dark: '#034d31',
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
          padding: '7px 16px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          border: '1px solid rgba(5,117,70,0.11)',
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
  display: 'block',
  width: '100%',
  maxWidth: 'none !important',
  minHeight: 'auto',
  padding: '0 !important',
  margin: 0,
  background: 'transparent',
});

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: '12px',
  boxShadow: 'none',
  marginBottom: theme.spacing(1.5),
  overflow: 'hidden',
  border: '1px solid rgba(5,117,70,0.12)',
  background: '#ffffff',
}));

const StyledTable = styled(Table)(() => ({
  minWidth: 920,
  '& .MuiTableCell-root': {
    borderBottom: '1px solid #edf2ef',
    padding: '9px 10px',
    fontSize: '0.74rem',
    color: '#30483f',
    whiteSpace: 'nowrap',
  },
  '& .MuiTableCell-head': {
    fontWeight: 900,
    backgroundColor: '#edf7f2',
    color: '#17372b',
    borderBottom: '1px solid rgba(5,117,70,.16)',
  },
  '& .MuiTableRow-root:hover': {
    backgroundColor: '#f8fbf9',
  },
}));

const StatusBadge = styled(Box)(({ status }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 24,
  paddingInline: 10,
  borderRadius: 999,
  fontWeight: 850,
  fontSize: '0.68rem',
  border: '1px solid',
  backgroundColor:
    status === 'pending' ? '#fff8e7' :
    status === 'resolved' ? '#edf8f0' :
    '#fff0f0',
  color:
    status === 'pending' ? '#9a6500' :
    status === 'resolved' ? '#237a3a' :
    '#b3261e',
  borderColor:
    status === 'pending' ? '#f0d28c' :
    status === 'resolved' ? '#b8dec1' :
    '#efb8b4',
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
  background: '#057546',
  color: 'white',
  fontWeight: 700,
  boxShadow: 'none',
  '&:hover': {
    background: '#034d31',
    boxShadow: 'none',
  },
}));

const StyledAvatar = styled(Avatar)(() => ({
  background: '#edf7f2',
  color: '#057546',
  fontWeight: 900,
  boxShadow: 'none',
  border: '1px solid rgba(5,117,70,.12)',
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
    const currentPage = isPrevious ? previousPage : page;
    const currentRowsPerPage = isPrevious ? previousRowsPerPage : rowsPerPage;

    const paginatedComplaints = complaintsData.slice(
      currentPage * currentRowsPerPage,
      currentPage * currentRowsPerPage + currentRowsPerPage
    );

    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 0.8 }}>
          <Box>
            <Typography sx={{ fontWeight: 900, color: '#17372b', fontSize: '0.9rem', lineHeight: 1.25 }}>
              {title}
            </Typography>
            <Typography sx={{ mt: 0.1, color: '#6b7d75', fontSize: '0.67rem' }}>
              {complaintsData.length} شكوى
            </Typography>
          </Box>

          <Box sx={{
            minWidth: 34, height: 28, px: 0.8, borderRadius: 999,
            display: 'grid', placeItems: 'center',
            bgcolor: '#edf7f2', color: '#057546',
            border: '1px solid rgba(5,117,70,.12)',
            fontWeight: 900, fontSize: '0.72rem'
          }}>
            {complaintsData.length}
          </Box>
        </Box>

        {complaintsData.length > 0 ? (
          <>
            <Box sx={{
              overflowX: 'auto',
              borderRadius: 2,
              border: '1px solid rgba(5,117,70,.11)',
              background: '#fff',
              scrollbarWidth: 'thin'
            }}>
              <StyledTable size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>أرسلت بواسطة</TableCell>
                    <TableCell>الشكوى من</TableCell>
                    <TableCell>إلى</TableCell>
                    <TableCell>العنوان</TableCell>
                    <TableCell>التفاصيل</TableCell>
                    <TableCell>الحالة</TableCell>
                    <TableCell>التاريخ</TableCell>
                    {showActions && <TableCell align="center">الإجراءات</TableCell>}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {paginatedComplaints.map((complaint) => (
                    <TableRow key={complaint.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                          <StyledAvatar sx={{ width: 26, height: 26, fontSize: '0.7rem' }}>
                            {complaint.created_by_name?.charAt(0) || '?'}
                          </StyledAvatar>
                          <Typography sx={{ fontSize: '0.73rem', fontWeight: 750 }}>
                            {complaint.created_by_name || 'غير معروف'}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Typography sx={{ fontSize: '0.73rem', fontWeight: 700 }}>
                          {complaint.complaint_from_name || 'غير معروف'}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography sx={{ fontSize: '0.73rem', fontWeight: 700 }}>
                          {complaint.complaint_to_name || 'غير معروف'}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ maxWidth: 190 }}>
                        <Typography
                          title={complaint.title}
                          sx={{
                            maxWidth: 190, overflow: 'hidden',
                            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            fontSize: '0.73rem', fontWeight: 750
                          }}
                        >
                          {complaint.title}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Button
                          size="small"
                          variant="text"
                          startIcon={<VisibilityIcon sx={{ fontSize: 16 }} />}
                          onClick={() => handleDetailsDialogOpen(complaint.details)}
                          sx={{ minWidth: 0, px: 0.6, color: '#057546', fontSize: '0.68rem', fontWeight: 800 }}
                        >
                          عرض
                        </Button>
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.35 }}>
                          <StatusBadge status={complaint.status}>
                            {getStatusText(complaint.status)}
                          </StatusBadge>

                          {complaint.comment && (
                            <Tooltip title="عرض التعليق">
                              <IconButton
                                size="small"
                                onClick={() => handleCommentDialogOpen(complaint.comment)}
                                sx={{ width: 26, height: 26, color: '#057546' }}
                              >
                                <VisibilityIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700 }}>
                          {new Date(complaint.created_at).toLocaleDateString('ar-EG')}
                        </Typography>
                        <Typography sx={{ fontSize: '0.61rem', color: '#7b8983' }}>
                          {new Date(complaint.created_at).toLocaleTimeString('ar-EG')}
                        </Typography>
                      </TableCell>

                      {showActions && (
                        <TableCell align="center">
                          <IconButton
                            aria-label="إجراءات الشكوى"
                            aria-controls="complaint-actions"
                            aria-haspopup="true"
                            onClick={(event) => handleMenuOpen(event, complaint)}
                            disabled={statusUpdating}
                            size="small"
                            sx={{
                              width: 30, height: 30,
                              border: '1px solid rgba(5,117,70,.14)',
                              color: '#057546'
                            }}
                          >
                            <MoreVertIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </StyledTable>
            </Box>

            <Box sx={{
              mt: 0.75,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
              flexWrap: 'wrap'
            }}>
              <FormControl
                size="small"
                sx={uiLayout.withUiSx({
                  width: 105,
                  minWidth: 105,
                  '& .MuiInputBase-root': { minHeight: 34, fontSize: '0.72rem' }
                }, uiLayout.formFieldSx)}
              >
                <InputLabel>الصفوف</InputLabel>
                <Select
                  value={currentRowsPerPage}
                  onChange={isPrevious ? handlePreviousChangeRowsPerPage : handleChangeRowsPerPage}
                  label="الصفوف"
                >
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                </Select>
              </FormControl>

              <Pagination
                count={Math.ceil(complaintsData.length / currentRowsPerPage)}
                page={currentPage + 1}
                onChange={(event, nextPage) =>
                  isPrevious
                    ? handlePreviousChangePage(event, nextPage - 1)
                    : handleChangePage(event, nextPage - 1)
                }
                color="primary"
                size="small"
                siblingCount={1}
              />
            </Box>
          </>
        ) : (
          <Box sx={{
            minHeight: 120,
            display: 'grid',
            placeItems: 'center',
            textAlign: 'center',
            borderRadius: 2,
            border: '1px dashed rgba(5,117,70,.20)',
            bgcolor: '#fbfdfc',
            px: 2,
            py: 2
          }}>
            <Box>
              <Typography sx={{ fontWeight: 900, color: '#50645b', fontSize: '0.82rem' }}>
                لا توجد شكاوى لعرضها
              </Typography>
              <Typography sx={{ mt: 0.25, color: '#85928c', fontSize: '0.67rem' }}>
                ستظهر الشكاوى هنا عند توفرها
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    );
  };

  const renderAddComplaintDialog = () => (
    <Dialog
      sx={uiLayout.dialogLayoutSx}
      open={openDialog}
      onClose={() => !submitting && setOpenDialog(false)}
      fullWidth
      maxWidth={false}
      PaperProps={{
        sx: {
          width: { xs: 'calc(100% - 16px)', sm: 'min(760px, calc(100% - 32px))' },
          maxWidth: '760px !important',
          m: { xs: 1, sm: 2 },
          borderRadius: 2.5,
          overflow: 'hidden',
          background: '#fff'
        }
      }}
    >
      <DialogTitle sx={{ px: { xs: 1.25, sm: 1.75 }, py: 1, borderBottom: '1px solid rgba(5,117,70,.11)' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
          <Box>
            <Typography sx={{ fontWeight: 950, color: '#17372b', fontSize: '1rem' }}>
              إضافة شكوى جديدة
            </Typography>
            <Typography sx={{ mt: 0.1, color: '#74827c', fontSize: '0.67rem' }}>
              حدد أطراف الشكوى ثم اكتب العنوان والتفاصيل
            </Typography>
          </Box>
          <IconButton size="small" disabled={submitting} onClick={() => setOpenDialog(false)}>
            <CloseIcon sx={{ fontSize: 19 }} />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: { xs: 1.25, sm: 1.75 }, bgcolor: '#fbfdfc' }}>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
            gap: 1.1,
            '& > *': { minWidth: 0, width: '100%' }
          }}
        >
          <FormControl fullWidth size="small" sx={uiLayout.formFieldSx}>
            <InputLabel>الشكوى من</InputLabel>
            <Select
              name="complaintFromGuid"
              value={formData.complaintFromGuid}
              onChange={handleInputChange}
              required
              label="الشكوى من"
            >
              {getComplaintFromEmployees().map((emp) => (
                <MenuItem key={emp.guid} value={emp.guid}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                    <StyledAvatar sx={{ width: 24, height: 24, fontSize: '0.66rem' }}>
                      {emp.fullName.charAt(0)}
                    </StyledAvatar>
                    <Typography sx={{ fontSize: '0.75rem' }}>{emp.fullName}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small" sx={uiLayout.formFieldSx}>
            <InputLabel>الشكوى إلى</InputLabel>
            <Select
              name="complaintToGuid"
              value={formData.complaintToGuid}
              onChange={handleInputChange}
              required
              label="الشكوى إلى"
            >
              {getComplaintToEmployees().map((emp) => (
                <MenuItem key={emp.guid} value={emp.guid}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                    <StyledAvatar sx={{ width: 24, height: 24, fontSize: '0.66rem' }}>
                      {emp.fullName.charAt(0)}
                    </StyledAvatar>
                    <Typography sx={{ fontSize: '0.75rem' }}>{emp.fullName}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            InputLabelProps={{ shrink: true }}
            fullWidth
            size="small"
            label="عنوان الشكوى"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            sx={uiLayout.withUiSx({ gridColumn: { sm: '1 / -1' } }, uiLayout.formFieldSx)}
          />

          <TextField
            InputLabelProps={{ shrink: true }}
            fullWidth
            size="small"
            label="تفاصيل الشكوى"
            name="details"
            value={formData.details}
            onChange={handleInputChange}
            required
            multiline
            minRows={4}
            sx={uiLayout.withUiSx({ gridColumn: { sm: '1 / -1' } }, uiLayout.formFieldSx)}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={uiLayout.withUiSx({
        px: { xs: 1.25, sm: 1.75 }, py: 1, gap: 0.75, justifyContent: 'flex-start'
      }, uiLayout.dialogActionsSx)}>
        <GradientButton
          onClick={handleSubmit}
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <AddIcon />}
          sx={{ minWidth: 118 }}
        >
          {submitting ? 'جاري الإرسال...' : 'إرسال الشكوى'}
        </GradientButton>
        <Button onClick={() => setOpenDialog(false)} disabled={submitting} color="inherit">
          إلغاء
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderStatusDialog = () => (
    <Dialog
      sx={uiLayout.dialogLayoutSx}
      open={statusDialogOpen}
      onClose={handleStatusDialogClose}
      fullWidth
      maxWidth={false}
      PaperProps={{
        sx: {
          width: { xs: 'calc(100% - 16px)', sm: 'min(520px, calc(100% - 32px))' },
          maxWidth: '520px !important',
          borderRadius: 2.5,
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ px: 1.5, py: 1, borderBottom: '1px solid rgba(5,117,70,.11)' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
          <Box display="flex" alignItems="center" gap={0.7}>
            {selectedStatus === 'resolved' ? (
              <CheckIcon color="success" sx={{ fontSize: 20 }} />
            ) : selectedStatus === 'rejected' ? (
              <CloseIcon color="error" sx={{ fontSize: 20 }} />
            ) : (
              <MoreVertIcon color="warning" sx={{ fontSize: 20 }} />
            )}
            <Typography sx={{ fontWeight: 900, fontSize: '0.92rem', color: '#17372b' }}>
              {selectedStatus === 'resolved'
                ? 'اعتماد حل الشكوى'
                : selectedStatus === 'rejected'
                ? 'رفض الشكوى'
                : 'إعادة إلى قيد الانتظار'}
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleStatusDialogClose}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 1.5, bgcolor: '#fbfdfc' }}>
        <Typography sx={{ mb: 0.8, color: '#60736b', fontSize: '0.72rem' }}>
          {selectedStatus === 'resolved'
            ? 'يمكن إضافة تعليق مختصر يوضح الإجراء الذي تم.'
            : selectedStatus === 'rejected'
            ? 'يمكن إضافة سبب الرفض.'
            : 'يمكن إضافة ملاحظة قبل إعادة الشكوى للانتظار.'}
        </Typography>
        <TextField
          fullWidth
          multiline
          minRows={3}
          maxRows={6}
          placeholder="أضف تعليقًا - اختياري"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          sx={uiLayout.formFieldSx}
        />
      </DialogContent>

      <DialogActions sx={uiLayout.withUiSx({ px: 1.5, py: 1, gap: 0.75, justifyContent: 'flex-start' }, uiLayout.dialogActionsSx)}>
        <GradientButton
          onClick={updateComplaintStatus}
          disabled={statusUpdating}
          startIcon={statusUpdating ? <CircularProgress size={18} color="inherit" /> : null}
          sx={{ minWidth: 96 }}
        >
          {statusUpdating ? 'جاري التحديث...' : 'تأكيد'}
        </GradientButton>
        <Button onClick={handleStatusDialogClose} disabled={statusUpdating} color="inherit">
          إلغاء
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderCommentDialog = () => (
    <Dialog
      sx={uiLayout.dialogLayoutSx}
      open={commentDialogOpen}
      onClose={handleCommentDialogClose}
      fullWidth
      maxWidth={false}
      PaperProps={{
        sx: {
          width: { xs: 'calc(100% - 16px)', sm: 'min(520px, calc(100% - 32px))' },
          maxWidth: '520px !important',
          borderRadius: 2.5,
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ px: 1.5, py: 1, borderBottom: '1px solid rgba(5,117,70,.11)' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography sx={{ fontWeight: 900, fontSize: '0.92rem', color: '#17372b' }}>
            تعليق على الشكوى
          </Typography>
          <IconButton size="small" onClick={handleCommentDialogClose}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 1.5, bgcolor: '#fbfdfc' }}>
        <Box sx={{
          p: 1.25, bgcolor: '#fff', border: '1px solid rgba(5,117,70,.11)',
          borderRadius: 2, minHeight: 80, whiteSpace: 'pre-wrap',
          color: '#30483f', fontSize: '0.78rem', lineHeight: 1.7
        }}>
          {selectedComment || 'لا يوجد تعليق'}
        </Box>
      </DialogContent>
      <DialogActions sx={uiLayout.withUiSx({ px: 1.5, py: 1 }, uiLayout.dialogActionsSx)}>
        <GradientButton onClick={handleCommentDialogClose}>إغلاق</GradientButton>
      </DialogActions>
    </Dialog>
  );

  const renderDetailsDialog = () => (
    <Dialog
      sx={uiLayout.dialogLayoutSx}
      open={detailsDialogOpen}
      onClose={handleDetailsDialogClose}
      fullWidth
      maxWidth={false}
      PaperProps={{
        sx: {
          width: { xs: 'calc(100% - 16px)', sm: 'min(620px, calc(100% - 32px))' },
          maxWidth: '620px !important',
          borderRadius: 2.5,
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ px: 1.5, py: 1, borderBottom: '1px solid rgba(5,117,70,.11)' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography sx={{ fontWeight: 900, fontSize: '0.92rem', color: '#17372b' }}>
            تفاصيل الشكوى
          </Typography>
          <IconButton size="small" onClick={handleDetailsDialogClose}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 1.5, bgcolor: '#fbfdfc' }}>
        <Box sx={{
          p: 1.25, bgcolor: '#fff', border: '1px solid rgba(5,117,70,.11)',
          borderRadius: 2, minHeight: 110, whiteSpace: 'pre-wrap',
          color: '#30483f', fontSize: '0.78rem', lineHeight: 1.75
        }}>
          {selectedDetails}
        </Box>
      </DialogContent>
      <DialogActions sx={uiLayout.withUiSx({ px: 1.5, py: 1 }, uiLayout.dialogActionsSx)}>
        <GradientButton onClick={handleDetailsDialogClose}>إغلاق</GradientButton>
      </DialogActions>
    </Dialog>
  );


  return (
    <NavigationShell variant="standard">
      <ThemeProvider theme={(outerTheme) => ({ ...theme, palette: outerTheme.palette })}>
        <Box sx={{ display: 'flex', minHeight: '100vh', background: '#f6faf8' }}>
          <PageContainer component="main" sx={{ flexGrow: 1, ...navigationContentSx }}>
            {loading ? (
              <Box sx={{ minHeight: 220, display: 'grid', placeItems: 'center' }}>
                <CircularProgress size={36} sx={{ color: '#057546' }} />
              </Box>
            ) : (
              <>
                <Box
                  sx={{
                    minHeight: 72,
                    mb: 1,
                    px: 1.5,
                    py: 1,
                    borderRadius: 2.5,
                    bgcolor: '#034d31',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1.25,
                    flexWrap: 'wrap'
                  }}
                >
                  <Box minWidth={0}>
                    <Typography sx={{ fontWeight: 950, fontSize: '1.1rem', lineHeight: 1.25 }}>
                      الشكاوى
                    </Typography>
                    <Typography sx={{ mt: 0.18, color: 'rgba(255,255,255,.76)', fontSize: '0.7rem' }}>
                      {[0, 1, 2].includes(user.userJop)
                        ? `لديك ${complaints.length} شكوى موجهة إليك للمراجعة`
                        : 'متابعة الشكاوى التي قمت بإرسالها وحالتها'}
                    </Typography>
                  </Box>

                  {!([0, 1, 2].includes(user.userJop)) ? (
                    <Button
                      startIcon={<AddIcon />}
                      onClick={() => setOpenDialog(true)}
                      variant="contained"
                      sx={{
                        minHeight: 36,
                        px: 1.25,
                        bgcolor: '#fff',
                        color: '#034d31',
                        fontWeight: 900,
                        fontSize: '0.72rem',
                        boxShadow: 'none',
                        '&:hover': { bgcolor: '#f4f8f6', boxShadow: 'none' }
                      }}
                    >
                      شكوى جديدة
                    </Button>
                  ) : (
                    <Box sx={{
                      minWidth: 42, height: 34, px: 1, borderRadius: 999,
                      display: 'grid', placeItems: 'center',
                      bgcolor: 'rgba(255,255,255,.12)',
                      border: '1px solid rgba(255,255,255,.22)',
                      fontWeight: 950, fontSize: '0.78rem'
                    }}>
                      {complaints.length}
                    </Box>
                  )}
                </Box>

                <Paper
                  elevation={0}
                  sx={{
                    p: 1.25,
                    borderRadius: 2.5,
                    border: '1px solid rgba(5,117,70,.11)',
                    bgcolor: '#fff'
                  }}
                >
                  {!([0, 1, 2].includes(user.userJop))
                    ? renderComplaintsTable(previousComplaints, 'الشكاوى التي أرسلتها', false, true)
                    : renderComplaintsTable(complaints, 'الشكاوى الموجهة إليك', true)}
                </Paper>

                {!([0, 1, 2].includes(user.userJop)) && renderAddComplaintDialog()}

                <Menu
                  id="complaint-actions"
                  anchorEl={anchorEl}
                  keepMounted
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  PaperProps={{
                    sx: {
                      mt: 0.4, minWidth: 190, p: 0.4, borderRadius: 2,
                      boxShadow: '0 8px 24px rgba(31,45,61,.12)',
                      border: '1px solid rgba(5,117,70,.10)'
                    }
                  }}
                >
                  <MenuItem
                    onClick={() => handleStatusDialogOpen('resolved')}
                    disabled={selectedComplaint?.status === 'resolved'}
                    sx={{ minHeight: 38, borderRadius: 1.4, fontSize: '0.74rem', fontWeight: 750 }}
                  >
                    <CheckIcon color="success" sx={{ marginInlineEnd: 0.75, fontSize: 18 }} />
                    تم الحل
                  </MenuItem>
                  <MenuItem
                    onClick={() => handleStatusDialogOpen('rejected')}
                    disabled={selectedComplaint?.status === 'rejected'}
                    sx={{ minHeight: 38, borderRadius: 1.4, fontSize: '0.74rem', fontWeight: 750 }}
                  >
                    <CloseIcon color="error" sx={{ marginInlineEnd: 0.75, fontSize: 18 }} />
                    رفض
                  </MenuItem>
                  <MenuItem
                    onClick={() => handleStatusDialogOpen('pending')}
                    disabled={selectedComplaint?.status === 'pending'}
                    sx={{ minHeight: 38, borderRadius: 1.4, fontSize: '0.74rem', fontWeight: 750 }}
                  >
                    <MoreVertIcon color="warning" sx={{ marginInlineEnd: 0.75, fontSize: 18 }} />
                    إعادة إلى الانتظار
                  </MenuItem>
                </Menu>

                {renderStatusDialog()}
                {renderCommentDialog()}
                {renderDetailsDialog()}
              </>
            )}
          </PageContainer>
        </Box>
      </ThemeProvider>
    </NavigationShell>
  );
};

export default Complaints;