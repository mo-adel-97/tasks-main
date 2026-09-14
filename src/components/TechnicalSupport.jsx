import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Card,
  CardContent,
  IconButton,
  Alert,
  Snackbar,
  CircularProgress,
  Avatar,
  Divider,
  Tooltip,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  TablePagination,
  DialogContentText,
  Autocomplete,
} from '@mui/material';
import {
  AttachFile,
  Close,
  Send,
  Computer,
  Security,
  Edit,
  Warning,
  Add,
  Description,
  CalendarToday,
  PriorityHigh,
  CheckCircle,
  CloudUpload,
  Image,
  Lightbulb,
  AccessTime,
  Info,
  TaskAlt,
  HourglassTop,
  Download,
  Refresh,
  Visibility,
  Reply,
  Person,
  AdminPanelSettings,
  Search,
  Block,
} from '@mui/icons-material';
import axios from 'axios';
import * as XLSX from 'xlsx';

const API_BASE_URL = 'https://filesregsiteration.sstli.com/erp/tech_tickets.php';
const USER_API_URL = 'https://api1.sstli.com/api/userinfo';
const BRANCHES_API_URL = 'https://api1.sstli.com/api/branches/all';

const TechnicalSupport = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userGuid = user?.guid || '';
  const userName = user?.userName || '';
  const branchGuid = user?.branchForWork || '';
  const fullName = user?.fullName || user?.name || '';
  const userJop = user?.userJop || 0;
  
  const isSupportStaff = ['محمد عادل', 'sa','emadn','admin','خالد مجدي','حسام تغيان'].includes(userName);
  const isSupervisor = userJop === 9;
  
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [ticketType, setTicketType] = useState('');
  const [priority, setPriority] = useState('medium');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', type: 'success' });
  const [tabValue, setTabValue] = useState(0);
  const [tickets, setTickets] = useState([]);
  const [allUsersTickets, setAllUsersTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [usersData, setUsersData] = useState({});
  const [branchesData, setBranchesData] = useState({});
  
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyFiles, setReplyFiles] = useState([]);
  const [sendingReply, setSendingReply] = useState(false);
  
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [ticketDetails, setTicketDetails] = useState(null);
  
  const [viewAllTickets, setViewAllTickets] = useState(isSupportStaff);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedEmployeeGuid, setSelectedEmployeeGuid] = useState('all');
  
  const [hasPendingTicket, setHasPendingTicket] = useState(false);
  const [checkingPendingTicket, setCheckingPendingTicket] = useState(false);
  const [pendingTicketDialogOpen, setPendingTicketDialogOpen] = useState(false);

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const ticketTypes = [
    { 
      value: 'technical', 
      label: 'مشكلة فنية', 
      icon: <Computer />, 
      color: '#f44336',
      description: 'مشاكل في النظام، أخطاء، تعليق، بطء'
    },
    { 
      value: 'permissions', 
      label: 'فتح صلاحيات', 
      icon: <Security />, 
      color: '#ff9800',
      description: 'طلب صلاحيات إضافية أو تعديلها'
    },
    { 
      value: 'data_edit', 
      label: 'تعديل بيانات', 
      icon: <Edit />, 
      color: '#2196f3',
      description: 'تعديل معلومات الحساب أو البيانات'
    },
    { 
      value: 'suggestion', 
      label: 'اقتراح', 
      icon: <Lightbulb />, 
      color: '#9c27b0',
      description: 'اقتراحات لتحسين النظام'
    },
    { 
      value: 'other', 
      label: 'أخرى', 
      icon: <Description />, 
      color: '#9e9e9e',
      description: 'أي طلب آخر لا ينتمي للأقسام السابقة'
    },
  ];

  const priorities = [
    { 
      value: 'low', 
      label: 'منخفضة', 
      color: '#4caf50',
      icon: <CheckCircle fontSize="small" />
    },
    { 
      value: 'medium', 
      label: 'متوسطة', 
      color: '#ff9800',
      icon: <AccessTime fontSize="small" />
    },
    { 
      value: 'high', 
      label: 'عالية', 
      color: '#f44336',
      icon: <PriorityHigh fontSize="small" />
    },
    { 
      value: 'urgent', 
      label: 'عاجلة', 
      color: '#d32f2f',
      icon: <Warning fontSize="small" />
    },
  ];

  // تحميل بيانات المستخدمين والفروع
  useEffect(() => {
    fetchUsersData();
    fetchBranchesData();
  }, []);

  // تحميل التذاكر عند بدء التشغيل
  useEffect(() => {
    if (isSupportStaff && viewAllTickets) {
      fetchAllTickets();
    } else {
      fetchUserTickets();
    }
  }, [isSupportStaff, viewAllTickets]);

  // Reset pagination when data changes
  useEffect(() => {
    setPage(0);
  }, [allUsersTickets, tickets, tabValue, statusFilter, searchQuery, selectedEmployeeGuid]);

  // تحقق من وجود تذكرة قيد الانتظار عند فتح النموذج
  useEffect(() => {
    if (!isSupportStaff && userGuid) {
      checkForPendingTickets();
    }
  }, [userGuid, isSupportStaff, tickets]);

  const checkForPendingTickets = async () => {
    try {
      setCheckingPendingTicket(true);
      const response = await axios.get(`${API_BASE_URL}?request=user_tickets&user_guid=${userGuid}`);
      
      if (response.data.status === 'success') {
        const userTickets = response.data.data || [];
        const pendingTickets = userTickets.filter(ticket => 
          ticket.status === 'pending' || ticket.status === 'in_progress'
        );
        
        // استثناء المشرفين من القيود
        if (isSupervisor) {
          setHasPendingTicket(false);
        } else {
          setHasPendingTicket(pendingTickets.length > 1);
        }
      }
    } catch (error) {
      console.error('Error checking pending tickets:', error);
    } finally {
      setCheckingPendingTicket(false);
    }
  };

  const fetchBranchesData = async () => {
    try {
      const response = await axios.get(BRANCHES_API_URL);
      if (response.data) {
        const branchesMap = {};
        response.data.forEach(branch => {
          branchesMap[branch.guid] = {
            name: branch.name,
            code: branch.code,
            status: branch.status
          };
        });
        setBranchesData(branchesMap);
      }
    } catch (error) {
      console.error('Error fetching branches data:', error);
    }
  };

  const fetchUsersData = async () => {
    try {
      const response = await axios.get(USER_API_URL);
      if (response.data) {
        const usersMap = {};
        response.data.forEach(user => {
          usersMap[user.guid] = {
            fullName: user.fullName || user.userName,
            userName: user.userName
          };
        });
        setUsersData(usersMap);
      }
    } catch (error) {
      console.error('Error fetching users data:', error);
    }
  };

  const fetchUserTickets = async () => {
    try {
      setLoadingTickets(true);
      const response = await axios.get(`${API_BASE_URL}?request=user_tickets&user_guid=${userGuid}`);
      
      if (response.data.status === 'success') {
        setTickets(response.data.data);
      } else {
        showAlert('فشل في تحميل التذاكر', 'error');
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      showAlert('حدث خطأ في تحميل التذاكر', 'error');
    } finally {
      setLoadingTickets(false);
    }
  };

  const fetchAllTickets = async () => {
    try {
      setLoadingTickets(true);
      
      let url = `${API_BASE_URL}?request=all_tickets`;
      
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`;
      }
      
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }
      
      const response = await axios.get(url);
      
      if (response.data.status === 'success') {
        setAllUsersTickets(response.data.data);
      } else {
        showAlert('فشل في تحميل جميع التذاكر', 'error');
      }
    } catch (error) {
      console.error('Error fetching all tickets:', error);
      showAlert('حدث خطأ في تحميل التذاكر', 'error');
    } finally {
      setLoadingTickets(false);
    }
  };

  // الحصول على اسم المستخدم من GUID
  const getUserNameFromGuid = (guid) => {
    return usersData[guid]?.fullName || fullName || 'مستخدم غير معروف';
  };

  // الحصول على اسم الفرع من GUID
  const getBranchNameFromGuid = (guid) => {
    return branchesData[guid]?.name || 'غير محدد';
  };

  const handleFileUpload = (event) => {
    const selectedFiles = Array.from(event.target.files);
    if (selectedFiles.length + files.length > 100) {
      showAlert('الحد الأقصى 100 ملفات فقط', 'error');
      return;
    }

    const newFiles = selectedFiles.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2),
      type: file.type.startsWith('image/') ? 'image' : 'file',
      fileObject: file,
    }));

    setFiles([...files, ...newFiles]);
  };

  const handleReplyFileUpload = (event) => {
    const selectedFiles = Array.from(event.target.files);
    if (selectedFiles.length + replyFiles.length > 100) {
      showAlert('الحد الأقصى 100 ملفات فقط', 'error');
      return;
    }

    const newFiles = selectedFiles.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2),
      type: file.type.startsWith('image/') ? 'image' : 'file',
      fileObject: file,
    }));

    setReplyFiles([...replyFiles, ...newFiles]);
  };

  const removeFile = (id) => {
    setFiles(files.filter(file => file.id !== id));
  };

  const removeReplyFile = (id) => {
    setReplyFiles(replyFiles.filter(file => file.id !== id));
  };

  const showAlert = (message, type) => {
    setAlert({ open: true, message, type });
  };

  const uploadFormFiles = async (ticketId) => {
    const uploadedAttachments = [];
    
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('ticket_id', ticketId);
        formData.append('user_guid', userGuid);
        formData.append('upload_type', 'ticket');
        formData.append('file', file.fileObject);
        
        const response = await axios.post(`${API_BASE_URL}?request=upload_file`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        if (response.data.status === 'success') {
          uploadedAttachments.push(response.data.data);
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        showAlert(`فشل في رفع الملف: ${file.name}`, 'warning');
      }
    }
    
    return uploadedAttachments;
  };

  const uploadReplyFiles = async () => {
    const uploadedAttachments = [];
    
    for (const file of replyFiles) {
      try {
        const formData = new FormData();
        formData.append('ticket_id', selectedTicket.id);
        formData.append('user_guid', userGuid);
        formData.append('upload_type', 'reply');
        formData.append('file', file.fileObject);
        
        const response = await axios.post(`${API_BASE_URL}?request=upload_file`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        if (response.data.status === 'success') {
          uploadedAttachments.push(response.data.data);
        }
      } catch (error) {
        console.error('Error uploading reply file:', error);
      }
    }
    
    return uploadedAttachments;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // التحقق من وجود تذكرة قيد الانتظار للمستخدمين العاديين فقط (استثناء المشرفين)
    if (!isSupportStaff && !isSupervisor) {
      if (hasPendingTicket) {
        setPendingTicketDialogOpen(true);
        return;
      }
    }
    
    if (!subject || !description || !ticketType) {
      showAlert('يرجى ملء جميع الحقول المطلوبة', 'error');
      return;
    }

    if (subject.length < 10) {
      showAlert('عنوان التذكرة يجب أن يكون 10 أحرف على الأقل', 'warning');
      return;
    }

    if (description.length < 20) {
      showAlert('وصف المشكلة يجب أن يكون 20 حرف على الأقل', 'warning');
      return;
    }

    if (!userGuid) {
      showAlert('يجب تسجيل الدخول أولاً', 'error');
      return;
    }

    setLoading(true);

    try {
      const ticketData = {
        user_guid: userGuid,
        branch_guid: branchGuid,
        subject,
        description,
        ticket_type: ticketType,
        priority,
      };

      const createResponse = await axios.post(`${API_BASE_URL}?request=create_ticket`, ticketData);
      
      if (createResponse.data.status !== 'success') {
        throw new Error(createResponse.data.message || 'فشل في إنشاء التذكرة');
      }

      const ticketId = createResponse.data.data?.id;
      
      if (!ticketId) {
        throw new Error('لم يتم استلام رقم التذكرة من الخادم');
      }
      
      if (files.length > 0) {
        await uploadFormFiles(ticketId);
      }

      const ticketNumber = createResponse.data.ticket_number || createResponse.data.data?.ticket_number || 'غير معروف';
      showAlert(`✅ تم إرسال التذكرة بنجاح! رقم التذكرة: ${ticketNumber}`, 'success');
      
      setSubject('');
      setDescription('');
      setTicketType('');
      setPriority('medium');
      setFiles([]);
      
      // تحديث حالة وجود تذكرة قيد الانتظار
      if (!isSupervisor) {
        setHasPendingTicket(true);
      }
      
      setTimeout(() => {
        fetchUserTickets();
      }, 2000);
      
    } catch (error) {
      console.error('Error creating ticket:', error);
      showAlert(`فشل في إرسال التذكرة: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReply = async () => {
    if (!replyMessage.trim()) {
      showAlert('يرجى كتابة رسالة الرد', 'error');
      return;
    }

    setSendingReply(true);

    try {
      let replyAttachments = [];
      if (replyFiles.length > 0) {
        replyAttachments = await uploadReplyFiles();
      }

      const replyData = {
        ticket_id: selectedTicket.id,
        user_guid: userGuid,
        message: replyMessage,
        attachments: replyAttachments,
      };

      const response = await axios.post(`${API_BASE_URL}?request=add_reply`, replyData);
      
      if (response.data.status === 'success') {
        showAlert('✅ تم إرسال الرد بنجاح', 'success');
        
        setReplyMessage('');
        setReplyFiles([]);
        setReplyDialogOpen(false);
        
        if (isSupportStaff && viewAllTickets) {
          await fetchAllTickets();
        } else {
          await fetchUserTickets();
        }
        
        if (detailsDialogOpen && ticketDetails?.id === selectedTicket.id) {
          const updatedTicket = isSupportStaff && viewAllTickets 
            ? allUsersTickets.find(t => t.id === selectedTicket.id)
            : tickets.find(t => t.id === selectedTicket.id);
          setTicketDetails(updatedTicket);
        }
      } else {
        showAlert('فشل في إرسال الرد', 'error');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      showAlert('فشل في إرسال الرد', 'error');
    } finally {
      setSendingReply(false);
    }
  };

  const openReplyDialog = (ticket) => {
    setSelectedTicket(ticket);
    setReplyMessage('');
    setReplyFiles([]);
    setReplyDialogOpen(true);
  };

  const openTicketDetails = async (ticket) => {
    try {
      const response = await axios.get(`${API_BASE_URL}?request=ticket&id=${ticket.id}`);
      if (response.data.status === 'success') {
        setTicketDetails(response.data.data);
        setDetailsDialogOpen(true);
      }
    } catch (error) {
      console.error('Error fetching ticket details:', error);
      showAlert('فشل في تحميل تفاصيل التذكرة', 'error');
    }
  };

  const downloadFile = (filePath, fileName) => {
    const link = document.createElement('a');
    link.href = `https://filesregsiteration.sstli.com/erp/${filePath}`;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const updateTicketStatus = async (ticketId, newStatus) => {
    try {
      const response = await axios.post(`${API_BASE_URL}?request=update_status`, {
        id: ticketId,
        status: newStatus,
        updated_by: userGuid,
      });
      
      if (response.data.status === 'success') {
        showAlert('✅ تم تحديث حالة التذكرة', 'success');
        
        // إذا كان المستخدم عاديًا وتذكرة قيد الانتظار تم تغيير حالتها
        if (!isSupportStaff && !isSupervisor) {
          const updatedTickets = tickets.filter(t => t.id !== ticketId || t.status !== 'pending');
          const hasPending = updatedTickets.some(t => t.status === 'pending' || t.status === 'in_progress');
          setHasPendingTicket(hasPending);
        }
        
        if (isSupportStaff && viewAllTickets) {
          await fetchAllTickets();
        } else {
          await fetchUserTickets();
        }
      } else {
        showAlert(response.data.message || 'فشل في تحديث حالة التذكرة', 'error');
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
      showAlert('فشل في تحديث حالة التذكرة', 'error');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ff9800';
      case 'in_progress': return '#2196f3';
      case 'resolved': return '#4caf50';
      case 'closed': return '#9e9e9e';
      default: return '#9e9e9e';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'قيد الانتظار';
      case 'in_progress': return 'قيد المعالجة';
      case 'resolved': return 'تم الحل';
      case 'closed': return 'مغلقة';
      default: return 'غير معروف';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <HourglassTop fontSize="small" />;
      case 'in_progress': return <AccessTime fontSize="small" />;
      case 'resolved': return <TaskAlt fontSize="small" />;
      case 'closed': return <CheckCircle fontSize="small" />;
      default: return <Info fontSize="small" />;
    }
  };

  // الموظفون الموجودون فعلياً داخل التذاكر
  const employeeOptions = Array.from(
    new Map(
      allUsersTickets
        .filter(ticket => ticket.user_guid)
        .map(ticket => [
          ticket.user_guid,
          {
            guid: ticket.user_guid,
            name: getUserNameFromGuid(ticket.user_guid),
          },
        ])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name, 'ar'));

  const exportTicketsToExcel = () => {
    const rows = displayedTickets.map((ticket, index) => {
      const typeInfo = ticketTypes.find(t => t.value === ticket.ticket_type);
      const priorityInfo = priorities.find(p => p.value === ticket.priority);

      return {
        'م': index + 1,
        'رقم التذكرة': ticket.ticket_number || '',
        'اسم الموظف': getUserNameFromGuid(ticket.user_guid),
        'الفرع': getBranchNameFromGuid(ticket.branch_guid),
        'عنوان التذكرة': ticket.subject || '',
        'الوصف': ticket.description || '',
        'نوع التذكرة': typeInfo?.label || ticket.ticket_type || '',
        'الحالة': getStatusText(ticket.status),
        'الأولوية': priorityInfo?.label || ticket.priority || '',
        'تاريخ الإنشاء': ticket.created_at
          ? new Date(ticket.created_at).toLocaleDateString('ar-EG')
          : '',
        'وقت الإنشاء': ticket.created_at
          ? new Date(ticket.created_at).toLocaleTimeString('ar-EG')
          : '',
      };
    });

    if (rows.length === 0) {
      showAlert('لا توجد تذاكر لتصديرها', 'warning');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 16 },
      { wch: 28 },
      { wch: 30 },
      { wch: 40 },
      { wch: 60 },
      { wch: 20 },
      { wch: 18 },
      { wch: 14 },
      { wch: 16 },
      { wch: 16 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'التذاكر');

    const employeeName = selectedEmployeeGuid === 'all'
      ? 'جميع_الموظفين'
      : (getUserNameFromGuid(selectedEmployeeGuid) || 'موظف').replace(/[\/:*?"<>|]/g, '_');

    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `تذاكر_${employeeName}_${today}.xlsx`);
    showAlert(`تم تصدير ${rows.length} تذكرة بنجاح`, 'success');
  };

  // الحصول على التذاكر المعروضة بناءً على دور المستخدم
  const getDisplayedTickets = () => {
    if (isSupportStaff) {
      let list = [...allUsersTickets];

      if (statusFilter !== 'all') {
        list = list.filter(t => t.status === statusFilter);
      }

      if (selectedEmployeeGuid !== 'all') {
        list = list.filter(t => t.user_guid === selectedEmployeeGuid);
      }

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        list = list.filter(t => {
          const subject = (t.subject || '').toLowerCase();
          const desc = (t.description || '').toLowerCase();
          const number = (t.ticket_number || '').toString().toLowerCase();
          const userName = (getUserNameFromGuid(t.user_guid) || '').toLowerCase();
          const branchName = (getBranchNameFromGuid(t.branch_guid) || '').toLowerCase();

          return (
            subject.includes(q) ||
            desc.includes(q) ||
            number.includes(q) ||
            userName.includes(q) ||
            branchName.includes(q)
          );
        });
      }

      return list;
    }

    return tickets.filter(ticket => {
      if (tabValue === 0) return true;
      if (tabValue === 1) return ticket.status === 'pending';
      if (tabValue === 2) return ticket.status === 'in_progress';
      if (tabValue === 3) return ticket.status === 'resolved';
      return true;
    });
  };

  const displayedTickets = getDisplayedTickets();

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Calculate paginated tickets
  const paginatedTickets = displayedTickets.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <Sidebar />
      
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 3,
          ml: { md: '280px' },
          width: { md: 'calc(100% - 280px)' },
          minHeight: '100vh',
        }}
      >
        <Container maxWidth="xl">
          {/* العنوان مع الملاحظة */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ 
                  p: 2, 
                  bgcolor: isSupportStaff ? '#e8f5e9' : '#e3f2fd', 
                  borderRadius: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {isSupportStaff ? (
                    <AdminPanelSettings sx={{ fontSize: 32, color: '#4caf50' }} />
                  ) : (
                    <Computer sx={{ fontSize: 32, color: '#2196f3' }} />
                  )}
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a237e' }}>
                    {isSupportStaff ? 'لوحة تحكم الدعم الفني' : 'مركز الدعم الفني'}
                  </Typography>
                  <Typography sx={{ mt: "20px"}} variant="body1" color="text.secondary">
                    {isSupportStaff 
                      ? 'إدارة جميع تذاكر الدعم الفني والرد عليها' 
                      : 'قدم تذكرة دعم فني أو تابع حالة التذاكر السابقة'}
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={() => {
                  if (isSupportStaff && viewAllTickets) {
                    fetchAllTickets();
                  } else {
                    fetchUserTickets();
                  }
                }}
                sx={{ borderRadius: 2 }}
              >
                تحديث
              </Button>
            </Box>

            {!isSupportStaff && !isSupervisor && (
              <Alert 
                severity="info" 
                icon={<Info />}
                sx={{ 
                  borderRadius: 2,
                  bgcolor: '#e3f2fd',
                  border: '1px solid #bbdefb',
                  mb: 3
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  ⚠️ ملاحظة: قد تستغرق معالجة التذكرة من 1 إلى 24 ساعة حسب درجة الأولوية وتوفر فريق الدعم.
                  نحرص على الرد في أقرب وقت ممكن.
                </Typography>
              </Alert>
            )}

            {isSupervisor && !isSupportStaff && (
              <Alert 
                severity="success" 
                icon={<Info />}
                sx={{ 
                  borderRadius: 2,
                  bgcolor: '#e8f5e9',
                  border: '1px solid #c8e6c9',
                  mb: 3
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  👨‍💼 حالة المشرف: يمكنك تقديم تذاكر دون قيود بغض النظر عن عدد التذاكر القيد الانتظار.
                </Typography>
              </Alert>
            )}
          </Box>

          {/* نموذج إنشاء تذكرة (للمستخدمين العاديين فقط) */}
          {!isSupportStaff && (
            <Paper sx={{ 
              p: 4, 
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              border: '1px solid #e0e0e0',
              mb: 4,
              position: 'relative',
              opacity: (hasPendingTicket && !isSupervisor) ? 0.7 : 1,
              filter: (hasPendingTicket && !isSupervisor) ? 'grayscale(0.3)' : 'none',
            }}>
              {(hasPendingTicket && !isSupervisor) && (
                <Box sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                  borderRadius: 3,
                  p: 4,
                  textAlign: 'center',
                }}>
                  <Avatar sx={{ 
                    bgcolor: '#ff9800', 
                    width: 80, 
                    height: 80,
                    mb: 3,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                    <Block sx={{ fontSize: 40 }} />
                  </Avatar>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: '#1a237e' }}>
                    ⚠️ لديك طلبين مازال قيد الانتظار
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 3, maxWidth: 500, lineHeight: 1.8 }}>
                    لا يمكنك تقديم تذكرة جديدة حتى يتم الرد على تذكرتك الحالية أو تغيير حالتها.
                    يمكنك متابعة حالة التذكرة الحالية في قسم "تذاكري السابقة" أدناه.
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => {
                      document.getElementById('tickets-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    sx={{
                      bgcolor: '#2196f3',
                      py: 1.5,
                      px: 4,
                      borderRadius: 2,
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      '&:hover': {
                        bgcolor: '#1976d2',
                      }
                    }}
                  >
                    عرض تذكرتي الحالية
                  </Button>
                </Box>
              )}
              
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ 
                    p: 1.5, 
                    bgcolor: '#2196f3', 
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Add sx={{ color: 'white' }} />
                  </Box>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1a237e' }}>
                      تقديم تذكرة جديدة
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      املأ النموذج أدناه لرفع تذكرة دعم فني جديدة
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Alert 
                severity="warning" 
                sx={{ mb: 4, borderRadius: 2 }}
                icon={<Warning />}
              >
                <Typography variant="body2">
                  <strong>تنويه مهم:</strong> قبل تقديم التذكرة، تأكد من وصف المشكلة بوضوح وإرفاق الصور اللازمة. 
                  هذا يساعد فريق الدعم على فهم المشكلة وحلها بشكل أسرع.
                </Typography>
              </Alert>

              <form onSubmit={handleSubmit}>
                <Grid container spacing={4}>
                  <Grid item xs={12}>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth required sx={{ bgcolor: 'white', borderRadius: 1 }}>
                          <InputLabel sx={{ fontWeight: 'medium', color: '#555' }}>نوع التذكرة</InputLabel>
                          <Select
                            value={ticketType}
                            onChange={(e) => setTicketType(e.target.value)}
                            label="نوع التذكرة"
                            sx={{ height: '56px' }}
                            disabled={hasPendingTicket && !isSupervisor}
                          >
                            {ticketTypes.map((type) => (
                              <MenuItem key={type.value} value={type.value}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Avatar sx={{ bgcolor: type.color + '20', color: type.color, width: 32, height: 32 }}>
                                    {type.icon}
                                  </Avatar>
                                  <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                      {type.label}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {type.description}
                                    </Typography>
                                  </Box>
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth sx={{ bgcolor: 'white', borderRadius: 1 }}>
                          <InputLabel sx={{ fontWeight: 'medium', color: '#555' }}>درجة الأولوية</InputLabel>
                          <Select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                            label="درجة الأولوية"
                            sx={{ height: '56px' }}
                            disabled={hasPendingTicket && !isSupervisor}
                          >
                            {priorities.map((p) => (
                              <MenuItem key={p.value} value={p.value}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Box sx={{ 
                                    p: 0.5, 
                                    bgcolor: p.color + '20', 
                                    borderRadius: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}>
                                    {p.icon}
                                  </Box>
                                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                    {p.label}
                                  </Typography>
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      required
                      label="عنوان التذكرة"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="مثال: مشكلة في تسجيل الدخول إلى النظام الأساسي"
                      helperText="اكتب عنواناً واضحاً يصف المشكلة بشكل مختصر"
                      sx={{ 
                        bgcolor: 'white',
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1,
                        }
                      }}
                      InputProps={{
                        sx: { height: '56px', fontSize: '1rem' }
                      }}
                      disabled={hasPendingTicket && !isSupervisor}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      required
                      multiline
                      rows={6}
                      label="وصف المشكلة / الاقتراح"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="صف المشكلة بالتفصيل..."
                      helperText="كلما كان الوصف أكثر تفصيلاً، كان حل المشكلة أسرع وأكثر دقة"
                      sx={{ 
                        bgcolor: 'white',
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1,
                        }
                      }}
                      disabled={hasPendingTicket && !isSupervisor}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Box sx={{ 
                      p: 3, 
                      border: '2px dashed #2196f3', 
                      borderRadius: 2,
                      bgcolor: '#f8fdff',
                      textAlign: 'center',
                      opacity: (hasPendingTicket && !isSupervisor) ? 0.6 : 1,
                    }}>
                      <CloudUpload sx={{ fontSize: 48, color: '#2196f3', mb: 2 }} />
                      <Typography variant="h6" sx={{ mb: 1, color: '#1a237e' }}>
                        إرفاق ملفات داعمة
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        اسحب الملفات هنا أو انقر للرفع. المسموح: صور، PDF، Word. الحد الأقصى 5 ملفات، كل ملف حتى 100MB
                      </Typography>
                      
                      <Button
                        component="label"
                        variant="contained"
                        startIcon={<CloudUpload />}
                        sx={{ 
                          bgcolor: '#2196f3',
                          borderRadius: 2,
                          px: 4,
                          py: 1.2,
                          '&:hover': {
                            bgcolor: '#1976d2',
                          }
                        }}
                        disabled={hasPendingTicket && !isSupervisor}
                      >
                        اختر الملفات
                        <input
                          type="file"
                          multiple
                          accept="image/*,.pdf,.doc,.docx"
                          onChange={handleFileUpload}
                          style={{ display: 'none' }}
                          disabled={hasPendingTicket && !isSupervisor}
                        />
                      </Button>
                    </Box>

                    {files.length > 0 && (
                      <Box sx={{ mt: 3 }}>
                        <Divider sx={{ my: 3 }} />
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#1a237e' }}>
                          📎 الملفات المرفوعة ({files.length}/5)
                        </Typography>
                        <Grid container spacing={2}>
                          {files.map((file) => (
                            <Grid item xs={12} sm={6} md={4} key={file.id}>
                              <Card 
                                variant="outlined" 
                                sx={{ 
                                  borderRadius: 2,
                                  borderLeft: `4px solid ${file.type === 'image' ? '#4caf50' : '#2196f3'}`,
                                  '&:hover': {
                                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                                  }
                                }}
                              >
                                <CardContent sx={{ p: 2 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                      <Box sx={{ 
                                        p: 1.5, 
                                        bgcolor: file.type === 'image' ? '#e8f5e9' : '#e3f2fd',
                                        borderRadius: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                      }}>
                                        {file.type === 'image' ? 
                                          <Image sx={{ color: '#4caf50', fontSize: 24 }} /> : 
                                          <AttachFile sx={{ color: '#2196f3', fontSize: 24 }} />
                                        }
                                      </Box>
                                      <Box sx={{ maxWidth: 120 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 'medium', wordBreak: 'break-word' }}>
                                          {file.name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          {file.size} MB
                                        </Typography>
                                      </Box>
                                    </Box>
                                    <IconButton 
                                      size="small" 
                                      onClick={() => removeFile(file.id)}
                                      sx={{ color: '#f44336' }}
                                      disabled={hasPendingTicket && !isSupervisor}
                                    >
                                      <Close />
                                    </IconButton>
                                  </Box>
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    )}
                  </Grid>

                  <Grid item xs={12}>
                    <Box sx={{ 
                      p: 3, 
                      bgcolor: '#f9f9f9', 
                      borderRadius: 2,
                      border: '1px solid #e8e8e8',
                      mb: 2
                    }}>
                      <Typography variant="body1" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Info fontSize="small" />
                        <strong>معلومة:</strong> عند إرسال التذكرة، ستحصل على رقم متابعة فريد يمكنك استخدامه لمتابعة حالتها.
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ستتلقى تحديثات حالة التذكرة عبر النظام.
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setSubject('');
                          setDescription('');
                          setTicketType('');
                          setPriority('medium');
                          setFiles([]);
                        }}
                        sx={{ 
                          py: 1.5, 
                          px: 6,
                          borderRadius: 2,
                          fontSize: '1rem',
                          fontWeight: 'medium'
                        }}
                        disabled={hasPendingTicket && !isSupervisor}
                      >
                        مسح النموذج
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={loading || uploading || (hasPendingTicket && !isSupervisor)}
                        startIcon={(loading || uploading) ? <CircularProgress size={20} color="inherit" /> : <Send />}
                        sx={{ 
                          py: 1.5, 
                          px: 8,
                          borderRadius: 2,
                          bgcolor: (hasPendingTicket && !isSupervisor) ? '#9e9e9e' : '#2196f3',
                          fontSize: '1.1rem',
                          fontWeight: 'bold',
                          minWidth: 200,
                          '&:hover': (hasPendingTicket && !isSupervisor) ? {} : {
                            bgcolor: '#1976d2',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 6px 20px rgba(33, 150, 243, 0.4)'
                          },
                          transition: 'all 0.3s ease',
                          cursor: (hasPendingTicket && !isSupervisor) ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {(hasPendingTicket && !isSupervisor) 
                          ? 'طلب قيد الانتظار' 
                          : loading ? 'جاري الإرسال...' 
                          : uploading ? 'جاري رفع الملفات...' 
                          : 'إرسال التذكرة'}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </form>
            </Paper>
          )}

          {/* التذاكر السابقة */}
          <Paper 
            id="tickets-section"
            sx={{ 
              p: 4, 
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              border: '1px solid #e0e0e0',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ 
                  p: 1.5, 
                  bgcolor: '#e8f5e9', 
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CalendarToday sx={{ color: '#4caf50' }} />
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1a237e' }}>
                    {isSupportStaff && viewAllTickets ? 'جميع تذاكر المستخدمين' : 'تذاكري السابقة'}
                  </Typography>
                  <Typography sx={{mt:"10px"}} variant="body2" color="text.secondary">
                    {isSupportStaff && viewAllTickets 
                      ? `إدارة جميع التذاكر المقدمة من المستخدمين (${allUsersTickets.length} تذكرة)` 
                      : `جميع التذاكر التي قدمتها سابقاً (${tickets.length} تذكرة)`}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                {isSupportStaff && viewAllTickets && (
                  <>
                    <TextField
                      size="small"
                      placeholder="ابحث في التذاكر..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      sx={{ width: 200 }}
                      InputProps={{
                        startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                      }}
                    />

                    <Autocomplete
                      size="small"
                      sx={{ width: 240 }}
                      options={[{ guid: 'all', name: 'جميع الموظفين' }, ...employeeOptions]}
                      value={
                        selectedEmployeeGuid === 'all'
                          ? { guid: 'all', name: 'جميع الموظفين' }
                          : employeeOptions.find(emp => emp.guid === selectedEmployeeGuid) || { guid: 'all', name: 'جميع الموظفين' }
                      }
                      onChange={(event, newValue) => {
                        setSelectedEmployeeGuid(newValue?.guid || 'all');
                      }}
                      getOptionLabel={(option) => option.name || ''}
                      isOptionEqualToValue={(option, value) => option.guid === value.guid}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="الموظف"
                          placeholder="ابحث باسم الموظف"
                        />
                      )}
                    />

                    <FormControl size="small" sx={{ minWidth: 140 }}>
                      <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        displayEmpty
                      >
                        <MenuItem value="all">جميع الحالات</MenuItem>
                        <MenuItem value="pending">قيد الانتظار</MenuItem>
                        <MenuItem value="in_progress">قيد المعالجة</MenuItem>
                        <MenuItem value="resolved">تم الحل</MenuItem>
                        <MenuItem value="closed">مغلقة</MenuItem>
                      </Select>
                    </FormControl>

                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<Download />}
                      onClick={exportTicketsToExcel}
                      disabled={displayedTickets.length === 0}
                      sx={{ borderRadius: 2, whiteSpace: 'nowrap' }}
                    >
                      تصدير Excel
                    </Button>
                  </>
                )}
                <Button
                  variant="outlined"
                  onClick={() => {
                    if (isSupportStaff && viewAllTickets) {
                      fetchAllTickets();
                    } else {
                      fetchUserTickets();
                    }
                  }}
                  startIcon={<Refresh />}
                  sx={{ borderRadius: 2 }}
                >
                  تحديث
                </Button>
              </Box>
            </Box>

            {/* تبويبات الفلترة للمستخدمين العاديين */}
            {!isSupportStaff && (
              <Tabs
                value={tabValue}
                onChange={(e, newValue) => setTabValue(newValue)}
                sx={{ 
                  mb: 3,
                  '& .MuiTab-root': {
                    fontWeight: 'medium',
                    fontSize: '0.9rem'
                  }
                }}
              >
                <Tab label="الكل" icon={<Description />} iconPosition="start" />
                <Tab label="قيد الانتظار" icon={<HourglassTop />} iconPosition="start" />
                <Tab label="قيد المعالجة" icon={<AccessTime />} iconPosition="start" />
                <Tab label="تم الحل" icon={<TaskAlt />} iconPosition="start" />
              </Tabs>
            )}

            {loadingTickets ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                {/* جدول التذاكر */}
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table>
                    <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                      <TableRow>
                        {isSupportStaff && viewAllTickets && (
                          <TableCell sx={{ fontWeight: 'bold', color: '#1a237e' }}>المستخدم</TableCell>
                        )}
                        <TableCell sx={{ fontWeight: 'bold', color: '#1a237e' }}>#</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: '#1a237e' }}>التذكرة</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: '#1a237e' }}>النوع</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: '#1a237e' }}>الحالة</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: '#1a237e' }}>الأولوية</TableCell>
                        {isSupportStaff && viewAllTickets && (
                          <TableCell sx={{ fontWeight: 'bold', color: '#1a237e' }}>الفرع</TableCell>
                        )}
                        <TableCell sx={{ fontWeight: 'bold', color: '#1a237e' }}>التاريخ</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: '#1a237e' }}>الإجراءات</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedTickets.length > 0 ? (
                        paginatedTickets.map((ticket) => {
                          const typeInfo = ticketTypes.find(t => t.value === ticket.ticket_type);
                          const priorityInfo = priorities.find(p => p.value === ticket.priority);
                          
                          return (
                            <TableRow 
                              key={ticket.id}
                              sx={{ 
                                '&:hover': { bgcolor: '#f9f9f9' },
                                cursor: 'pointer'
                              }}
                            >
                              {isSupportStaff && viewAllTickets && (
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Avatar sx={{ bgcolor: '#2196f3', width: 32, height: 32, fontSize: 14 }}>
                                      <Person />
                                    </Avatar>
                                    <Box>
                                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                        {getUserNameFromGuid(ticket.user_guid)}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </TableCell>
                              )}
                              <TableCell>
                                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                                  #{ticket.ticket_number}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 0.5 }}>
                                    {ticket.subject}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                                    {ticket.description ? (ticket.description.substring(0, 60) + (ticket.description.length > 60 ? '...' : '')) : 'لا يوجد وصف'}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  icon={typeInfo?.icon}
                                  label={typeInfo?.label}
                                  size="small"
                                  variant="outlined"
                                  sx={{
                                    borderColor: typeInfo?.color,
                                    color: typeInfo?.color,
                                    fontWeight: 'medium'
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Chip
                                  icon={getStatusIcon(ticket.status)}
                                  label={getStatusText(ticket.status)}
                                  size="small"
                                  sx={{
                                    bgcolor: getStatusColor(ticket.status) + '15',
                                    color: getStatusColor(ticket.status),
                                    fontWeight: 'bold'
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: priorityInfo?.color }} />
                                  <Typography variant="body2">
                                    {priorityInfo?.label}
                                  </Typography>
                                </Box>
                              </TableCell>
                              {isSupportStaff && viewAllTickets && (
                                <TableCell>
                                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                    {getBranchNameFromGuid(ticket.branch_guid)}
                                  </Typography>
                                </TableCell>
                              )}
                              <TableCell>
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                    {new Date(ticket.created_at).toLocaleDateString('ar-EG')}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {new Date(ticket.created_at).toLocaleTimeString('ar-EG')}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <Tooltip title="مشاهدة التفاصيل">
                                    <IconButton 
                                      size="small" 
                                      sx={{ color: '#2196f3' }}
                                      onClick={() => openTicketDetails(ticket)}
                                    >
                                      <Visibility fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  
                                  {/* إظهار زر الرد لموظفي الدعم فقط */}
                                  {isSupportStaff && (
                                    <Tooltip title="إضافة رد">
                                      <IconButton 
                                        size="small" 
                                        sx={{ color: '#4caf50' }}
                                        onClick={() => openReplyDialog(ticket)}
                                      >
                                        <Reply fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                  
                                  {/* إظهار زر الرد للمستخدمين العاديين فقط إذا كانوا هم منشئي التذكرة */}
                                  {!isSupportStaff && ticket.user_guid === userGuid && (
                                    <Tooltip
                                      title={
                                        ticket.status === 'closed'
                                          ? 'هذه التذكرة اصبحت مغلقة من الدعم الفني'
                                          : 'إضافة رد'
                                      }
                                    >
                                      <span>
                                        <IconButton
                                          size="small"
                                          sx={{ color: ticket.status === 'closed' ? '#9e9e9e' : '#4caf50' }}
                                          onClick={
                                            ticket.status === 'closed'
                                              ? undefined
                                              : () => openReplyDialog(ticket)
                                          }
                                          disabled={ticket.status === 'closed'}
                                        >
                                          <Reply fontSize="small" />
                                        </IconButton>
                                      </span>
                                    </Tooltip>
                                  )}

                                  {/* إظهار أزرار تغيير الحالة لموظفي الدعم فقط */}
                                  {isSupportStaff && (
                                    <>
                                      {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                                        <Tooltip title="تم الحل">
                                          <IconButton 
                                            size="small" 
                                            sx={{ color: '#4caf50' }}
                                            onClick={() => updateTicketStatus(ticket.id, 'resolved')}
                                          >
                                            <CheckCircle fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                      )}
                                      {ticket.status !== 'in_progress' && ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                                        <Tooltip title="قيد المعالجة">
                                          <IconButton 
                                            size="small" 
                                            sx={{ color: '#ff9800' }}
                                            onClick={() => updateTicketStatus(ticket.id, 'in_progress')}
                                          >
                                            <AccessTime fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                      )}
                                      {ticket.status !== 'closed' && (
                                        <Tooltip title="إغلاق التذكرة">
                                          <IconButton 
                                            size="small" 
                                            sx={{ color: '#9e9e9e' }}
                                            onClick={() => updateTicketStatus(ticket.id, 'closed')}
                                          >
                                            <Close fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                      )}
                                    </>
                                  )}
                                </Box>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={isSupportStaff && viewAllTickets ? 9 : 7}>
                            <Box sx={{ 
                              textAlign: 'center', 
                              py: 4,
                              bgcolor: '#fafafa',
                              borderRadius: 2
                            }}>
                              <Description sx={{ fontSize: 64, color: '#bdbdbd', mb: 2 }} />
                              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                                لا توجد تذاكر
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {isSupportStaff && viewAllTickets 
                                  ? 'لا توجد تذاكر من المستخدمين'
                                  : tabValue === 0 ? 'لم تقم بإنشاء أي تذاكر بعد' : 
                                   tabValue === 1 ? 'لا توجد تذاكر قيد الانتظار' :
                                   tabValue === 2 ? 'لا توجد تذاكر قيد المعالجة' : 'لا توجد تذاكر تم حلها'}
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Pagination */}
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={displayedTickets.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  labelRowsPerPage="صفوف لكل صفحة:"
                  labelDisplayedRows={({ from, to, count }) => `${from}-${to} من ${count}`}
                  sx={{ direction: 'ltr' }}
                />
              </>
            )}
          </Paper>
        </Container>

        {/* ديالوج تفاصيل التذكرة */}
        <Dialog
          open={detailsDialogOpen}
          onClose={() => setDetailsDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          {ticketDetails && (
            <>
              <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      تفاصيل التذكرة #{ticketDetails.ticket_number}
                    </Typography>
                    {isSupportStaff && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        تم إنشاؤها بواسطة: {getUserNameFromGuid(ticketDetails.user_guid)}
                      </Typography>
                    )}
                  </Box>
                  <Chip
                    label={getStatusText(ticketDetails.status)}
                    sx={{
                      bgcolor: getStatusColor(ticketDetails.status) + '15',
                      color: getStatusColor(ticketDetails.status),
                      fontWeight: 'bold'
                    }}
                  />
                </Box>
              </DialogTitle>
              <DialogContent dividers>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      العنوان
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {ticketDetails.subject}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      النوع
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      {ticketTypes.find(t => t.value === ticketDetails.ticket_type)?.icon}
                      <Typography variant="body1">
                        {ticketTypes.find(t => t.value === ticketDetails.ticket_type)?.label}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      الوصف
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, mt: 1, mb: 3 }}>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                        {ticketDetails.description}
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  {/* معلومات المستخدم للموظفين الدعم */}
                  {isSupportStaff && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        معلومات مقدم التذكرة
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: '#2196f3' }}>
                            <Person />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {getUserNameFromGuid(ticketDetails.user_guid)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              الفرع: {getBranchNameFromGuid(ticketDetails.branch_guid)}
                            </Typography>
                          </Box>
                        </Box>
                      </Paper>
                    </Grid>
                  )}
                  
                  {/* المرفقات */}
                  {ticketDetails.attachments && ticketDetails.attachments.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                        المرفقات ({ticketDetails.attachments.length})
                      </Typography>
                      <Grid container spacing={2}>
                        {ticketDetails.attachments.map((attachment, index) => (
                          <Grid item xs={12} sm={6} key={index}>
                            <Card variant="outlined">
                              <CardContent sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <AttachFile />
                                    <Box>
                                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                        {attachment.file_name}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {(attachment.file_size / 1024 / 1024).toFixed(2)} MB
                                      </Typography>
                                    </Box>
                                  </Box>
                                  <IconButton 
                                    size="small"
                                    onClick={() => downloadFile(attachment.file_path, attachment.file_name)}
                                  >
                                    <Download fontSize="small" />
                                  </IconButton>
                                </Box>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Grid>
                  )}
                  
                  {/* الردود */}
                  {ticketDetails.replies && ticketDetails.replies.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                        الردود ({ticketDetails.replies.length})
                      </Typography>
                      <List>
                        {ticketDetails.replies.map((reply, index) => (
                          <ListItem key={index} alignItems="flex-start">
                            <ListItemAvatar>
                              <Avatar sx={{ 
                                bgcolor: reply.user_guid === userGuid 
                                  ? '#2196f3' 
                                  : isSupportStaff 
                                    ? '#4caf50' 
                                    : '#ff9800'
                              }}>
                                {reply.user_guid === userGuid 
                                  ? 'أنت' 
                                  : usersData[reply.user_guid] 
                                    ? usersData[reply.user_guid].userName.substring(0, 2)
                                    : 'دعم'}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                    {reply.user_guid === userGuid 
                                      ? 'أنت' 
                                      : getUserNameFromGuid(reply.user_guid)}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {new Date(reply.created_at).toLocaleString('ar-EG')}
                                  </Typography>
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                                    {reply.message}
                                  </Typography>
                                  {reply.attachments && reply.attachments.length > 0 && (
                                    <Box sx={{ mt: 1 }}>
                                      <Typography variant="caption" color="text.secondary">
                                        المرفقات: {reply.attachments.length}
                                      </Typography>
                                    </Box>
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Grid>
                  )}
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setDetailsDialogOpen(false)}>
                  إغلاق
                </Button>
                {(isSupportStaff || ticketDetails.user_guid === userGuid) && (
                  <Tooltip
                    title={
                      !isSupportStaff && ticketDetails.status === 'closed'
                        ? 'هذه التذكرة اصبحت مغلقة من الدعم الفني'
                        : ''
                    }
                  >
                    <span>
                      <Button
                        variant="contained"
                        onClick={() => {
                          if (!isSupportStaff && ticketDetails.status === 'closed') return;
                          setDetailsDialogOpen(false);
                          openReplyDialog(ticketDetails);
                        }}
                        disabled={!isSupportStaff && ticketDetails.status === 'closed'}
                        sx={{ bgcolor: '#2196f3' }}
                      >
                        إضافة رد
                      </Button>
                    </span>
                  </Tooltip>
                )}
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* ديالوج إضافة رد */}
        <Dialog
          open={replyDialogOpen}
          onClose={() => setReplyDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Reply />
              إضافة رد على التذكرة #{selectedTicket?.ticket_number}
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            <TextField
              autoFocus
              multiline
              rows={4}
              fullWidth
              label="رسالة الرد"
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              sx={{ mb: 2 }}
            />
            
            <Box sx={{ mb: 2 }}>
              <Button
                component="label"
                variant="outlined"
                startIcon={<CloudUpload />}
                size="small"
              >
                إرفاق ملفات
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleReplyFileUpload}
                  style={{ display: 'none' }}
                />
              </Button>
              
              {replyFiles.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    الملفات المرفوعة:
                  </Typography>
                  {replyFiles.map((file) => (
                    <Box key={file.id} sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      p: 1,
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      mt: 1
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AttachFile fontSize="small" />
                        <Typography variant="body2">
                          {file.name}
                        </Typography>
                      </Box>
                      <IconButton size="small" onClick={() => removeReplyFile(file.id)}>
                        <Close fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setReplyDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmitReply}
              disabled={sendingReply || !replyMessage.trim()}
              startIcon={sendingReply ? <CircularProgress size={20} /> : <Send />}
              sx={{ bgcolor: '#2196f3' }}
            >
              {sendingReply ? 'جاري الإرسال...' : 'إرسال الرد'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ديالوج طلب قيد الانتظار */}
        <Dialog
          open={pendingTicketDialogOpen}
          onClose={() => setPendingTicketDialogOpen(false)}
          maxWidth="sm"
        >
          <DialogTitle sx={{ textAlign: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 1 }}>
              <Avatar sx={{ bgcolor: '#ff9800', width: 48, height: 48 }}>
                <Block sx={{ fontSize: 32 }} />
              </Avatar>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a237e' }}>
              ⚠️ لديك طلب مازال قيد الانتظار
            </Typography>
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8 }}>
                لا يمكنك تقديم تذكرة جديدة حتى يتم الرد على تذكرتك الحالية أو تغيير حالتها.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                يمكنك متابعة حالة التذكرة الحالية في قسم "تذاكري السابقة" أدناه.
              </Typography>
            </DialogContentText>
            
            {tickets.filter(t => t.status === 'pending' || t.status === 'in_progress').slice(0, 2).map(ticket => (
              <Card key={ticket.id} variant="outlined" sx={{ mb: 2 }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        #{ticket.ticket_number} - {ticket.subject}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {getStatusText(ticket.status)} - {new Date(ticket.created_at).toLocaleDateString('ar-EG')}
                      </Typography>
                    </Box>
                    <Chip
                      label={getStatusText(ticket.status)}
                      size="small"
                      sx={{
                        bgcolor: getStatusColor(ticket.status) + '15',
                        color: getStatusColor(ticket.status),
                        fontWeight: 'bold'
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            ))}
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
            <Button
              variant="contained"
              onClick={() => {
                setPendingTicketDialogOpen(false);
                document.getElementById('tickets-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              sx={{
                bgcolor: '#2196f3',
                py: 1.2,
                px: 4,
                borderRadius: 2,
                fontSize: '1rem',
                fontWeight: 'bold',
                minWidth: 200,
              }}
            >
              عرض تذكرتي الحالية
            </Button>
            <Button
              onClick={() => setPendingTicketDialogOpen(false)}
              sx={{ color: '#666' }}
            >
              إغلاق
            </Button>
          </DialogActions>
        </Dialog>

        {/* الإشعارات */}
        <Snackbar
          open={alert.open}
          autoHideDuration={5000}
          onClose={() => setAlert({ ...alert, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            severity={alert.type}
            onClose={() => setAlert({ ...alert, open: false })}
            sx={{ 
              minWidth: 350,
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {alert.message}
            </Typography>
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default TechnicalSupport;