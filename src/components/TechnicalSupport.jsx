import * as uiLayout from './common/uiLayout';
import { navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from './NavigationShell';
import React, { useState, useEffect, useRef } from 'react';

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
  useMediaQuery,
  Autocomplete,
  useTheme,
  alpha,
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

const DESKTOP_BREAKPOINT = 1200;

const SUPPORT_TICKETS_CACHE_KEY = 'sstli_support_all_tickets_v4';
const SUPPORT_TICKETS_CACHE_TTL_MS = 60 * 1000;

const readSupportTicketsCache = () => {
  try {
    const raw = sessionStorage.getItem(SUPPORT_TICKETS_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const timestamp = Number(parsed?.timestamp || 0);

    if (
      !timestamp ||
      Date.now() - timestamp > SUPPORT_TICKETS_CACHE_TTL_MS
    ) {
      sessionStorage.removeItem(SUPPORT_TICKETS_CACHE_KEY);
      return null;
    }

    return Array.isArray(parsed?.data) ? parsed.data : null;
  } catch {
    return null;
  }
};

const writeSupportTicketsCache = (tickets) => {
  try {
    sessionStorage.setItem(
      SUPPORT_TICKETS_CACHE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        data: Array.isArray(tickets) ? tickets : []
      })
    );
  } catch {
    // Cache is an optimization only.
  }
};

const TechnicalSupport = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isPhone = useMediaQuery('(max-width:599.95px)');
  const isTablet = useMediaQuery('(min-width:600px) and (max-width:1199.95px)');
  const isDesktop = useMediaQuery(`(min-width:${DESKTOP_BREAKPOINT}px)`);
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
  const [updatingTicketIds, setUpdatingTicketIds] = useState([]);
  const allTicketsRequestIdRef = useRef(0);

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
      fetchAllTickets({ preferCache: true });
    } else {
      fetchUserTickets();
    }
  }, [isSupportStaff, viewAllTickets]);

  // Reset pagination when data changes
  useEffect(() => {
    setPage(0);
  }, [allUsersTickets, tickets, tabValue, statusFilter, searchQuery, selectedEmployeeGuid]);

  // التذاكر محملة بالفعل؛ لا نكرر نفس endpoint فقط لمعرفة حالة الانتظار
  useEffect(() => {
    if (isSupportStaff) return;

    setCheckingPendingTicket(false);

    if (isSupervisor) {
      setHasPendingTicket(false);
      return;
    }

    const pendingCount = tickets.filter(
      (ticket) =>
        ticket.status === 'pending' ||
        ticket.status === 'in_progress'
    ).length;

    // نفس قاعدة العمل الموجودة أصلًا
    setHasPendingTicket(pendingCount > 1);
  }, [tickets, isSupportStaff, isSupervisor]);

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

  const fetchAllTickets = async ({
    silent = false,
    preferCache = true
  } = {}) => {
    const requestId = ++allTicketsRequestIdRef.current;

    const cached = preferCache
      ? readSupportTicketsCache()
      : null;

    if (Array.isArray(cached)) {
      setAllUsersTickets(cached);

      if (!silent) {
        setLoadingTickets(false);
      }
    } else if (!silent) {
      setLoadingTickets(true);
    }

    try {
      // مهم: نحفظ القائمة الكاملة دائمًا.
      // status/search/employee يتم تطبيقهم محليًا في getDisplayedTickets.
      const response = await axios.get(
        `${API_BASE_URL}?request=all_tickets`,
        { timeout: 30000 }
      );

      if (response.data.status !== 'success') {
        throw new Error(
          response.data.message || 'فشل في تحميل جميع التذاكر'
        );
      }

      const nextTickets = Array.isArray(response.data.data)
        ? response.data.data
        : [];

      // لا تسمح لطلب قديم أبطأ أن يكتب فوق طلب أحدث
      if (requestId === allTicketsRequestIdRef.current) {
        setAllUsersTickets(nextTickets);
        writeSupportTicketsCache(nextTickets);
      }

      return nextTickets;
    } catch (error) {
      console.error('Error fetching all tickets:', error);

      if (!Array.isArray(cached) && !silent) {
        showAlert('حدث خطأ في تحميل التذاكر', 'error');
      }

      return Array.isArray(cached) ? cached : null;
    } finally {
      if (
        requestId === allTicketsRequestIdRef.current &&
        !silent
      ) {
        setLoadingTickets(false);
      }
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
          await fetchAllTickets({ preferCache: false });
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

  const openTicketDetails = (ticket) => {
    // افتح الديالوج فورًا من بيانات الصف الموجودة بالفعل.
    // لا ننتظر أي endpoint حتى يظهر للمستخدم.
    setSelectedTicket(ticket);
    setTicketDetails(ticket);
    setDetailsDialogOpen(true);

    // هات التفاصيل الكاملة في الخلفية فقط.
    axios
      .get(
        `${API_BASE_URL}?request=ticket&id=${ticket.id}`,
        { timeout: 15000 }
      )
      .then((response) => {
        if (response.data.status !== 'success') return;

        const fullTicket = response.data.data;

        setTicketDetails((current) => {
          if (
            !current ||
            String(current.id) !== String(ticket.id)
          ) {
            return current;
          }

          return {
            ...ticket,
            ...fullTicket
          };
        });
      })
      .catch((error) => {
        // البيانات الأساسية ظاهرة بالفعل؛ فشل التفاصيل الإضافية
        // لا يمنع فتح الديالوج ولا يزعج المستخدم برسالة فشل.
        console.error(
          'Background ticket details fetch failed:',
          error
        );
      });
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

  const patchTicketStatus = (list, ticketId, newStatus) =>
    (Array.isArray(list) ? list : []).map((ticket) =>
      String(ticket.id) === String(ticketId)
        ? {
            ...ticket,
            status: newStatus,
            updated_at: new Date().toISOString()
          }
        : ticket
    );

  const verifyTicketStatus = async (ticketId, expectedStatus) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}?request=ticket&id=${ticketId}`,
        { timeout: 12000 }
      );

      const serverTicket =
        response.data?.status === 'success'
          ? response.data?.data
          : null;

      return {
        confirmed:
          !!serverTicket &&
          String(serverTicket.status) ===
            String(expectedStatus),
        ticket: serverTicket
      };
    } catch (error) {
      console.error(
        'Error verifying ticket status:',
        error
      );

      return {
        confirmed: false,
        ticket: null
      };
    }
  };

  const updateTicketStatus = async (ticketId, newStatus) => {
    if (
      updatingTicketIds.some(
        (id) => String(id) === String(ticketId)
      )
    ) {
      return;
    }

    const previousAllTickets = allUsersTickets;
    const previousUserTickets = tickets;
    const previousSelectedTicket = selectedTicket;
    const previousTicketDetails = ticketDetails;

    setUpdatingTicketIds((current) => [
      ...current,
      ticketId
    ]);

    // Optimistic update:
    // الواجهة والفلتر يتحدثان فورًا بدون انتظار Reload.
    setAllUsersTickets((current) => {
      const next = patchTicketStatus(
        current,
        ticketId,
        newStatus
      );

      writeSupportTicketsCache(next);
      return next;
    });

    setTickets((current) =>
      patchTicketStatus(current, ticketId, newStatus)
    );

    setSelectedTicket((current) =>
      current &&
      String(current.id) === String(ticketId)
        ? { ...current, status: newStatus }
        : current
    );

    setTicketDetails((current) =>
      current &&
      String(current.id) === String(ticketId)
        ? { ...current, status: newStatus }
        : current
    );

    try {
      let confirmed = false;
      let verifiedTicket = null;
      let mutationError = null;

      try {
        const response = await axios.post(
          `${API_BASE_URL}?request=update_status`,
          {
            id: ticketId,
            status: newStatus,
            updated_by: userGuid
          },
          { timeout: 15000 }
        );

        confirmed =
          response.data?.status === 'success' ||
          response.data?.success === true ||
          response.data?.updated === true;

        if (!confirmed) {
          mutationError = new Error(
            response.data?.message ||
              'لم يؤكد الخادم تحديث الحالة'
          );
        }
      } catch (error) {
        // أحيانًا الـDB تكون اتحدثت بالفعل لكن الرد يتأخر/ينقطع.
        mutationError = error;
      }

      // قبل ما نقول "فشل"، نتأكد من الحالة الحقيقية من التذكرة نفسها.
      if (!confirmed) {
        const verification = await verifyTicketStatus(
          ticketId,
          newStatus
        );

        confirmed = verification.confirmed;
        verifiedTicket = verification.ticket;
      }

      if (!confirmed) {
        throw mutationError || new Error(
          'فشل في تحديث حالة التذكرة'
        );
      }

      // لو تحققنا من نسخة السيرفر، ادمجها في الحالة المحلية.
      if (verifiedTicket) {
        const mergeVerified = (list) =>
          (Array.isArray(list) ? list : []).map((ticket) =>
            String(ticket.id) === String(ticketId)
              ? { ...ticket, ...verifiedTicket }
              : ticket
          );

        setAllUsersTickets((current) => {
          const next = mergeVerified(current);
          writeSupportTicketsCache(next);
          return next;
        });

        setTickets((current) =>
          mergeVerified(current)
        );

        setSelectedTicket((current) =>
          current &&
          String(current.id) === String(ticketId)
            ? { ...current, ...verifiedTicket }
            : current
        );

        setTicketDetails((current) =>
          current &&
          String(current.id) === String(ticketId)
            ? { ...current, ...verifiedTicket }
            : current
        );
      }

      if (!isSupportStaff && !isSupervisor) {
        const nextUserTickets = patchTicketStatus(
          previousUserTickets,
          ticketId,
          newStatus
        );

        const pendingCount = nextUserTickets.filter(
          (ticket) =>
            ticket.status === 'pending' ||
            ticket.status === 'in_progress'
        ).length;

        setHasPendingTicket(pendingCount > 1);
      }

      showAlert(
        '✅ تم تحديث حالة التذكرة',
        'success'
      );

      // لا يوجد fetchAllTickets هنا.
      // نجاح التعديل لم يعد مرتبطًا بنجاح Refresh ثاني.
    } catch (error) {
      console.error(
        'Error updating ticket status:',
        error
      );

      // Rollback فقط إذا لم نستطع تأكيد التحديث من السيرفر.
      setAllUsersTickets(previousAllTickets);
      setTickets(previousUserTickets);
      setSelectedTicket(previousSelectedTicket);
      setTicketDetails(previousTicketDetails);

      writeSupportTicketsCache(previousAllTickets);

      showAlert(
        error?.response?.data?.message ||
          error?.message ||
          'فشل في تحديث حالة التذكرة',
        'error'
      );
    } finally {
      setUpdatingTicketIds((current) =>
        current.filter(
          (id) => String(id) !== String(ticketId)
        )
      );
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
    <NavigationShell variant="standard" ><Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: isDark ? theme.palette.background.default : '#f6faf8' }}>
      
      
      <Box 
        component="main" 
        sx={{
          flexGrow: 1,
          p: isPhone ? 0.5 : isTablet ? 0.8 : 1.2,
          minHeight: '100vh',
          minWidth: 0,
          maxWidth: '100%',
          boxSizing: 'border-box',
          overflowX: 'hidden',
          ...navigationContentSx,
          '& .MuiTypography-root': {
            wordBreak: 'break-word'
          },
          '& .MuiButton-root': {
            textTransform: 'none'
          }
        }}
      >
        <Container maxWidth={false} disableGutters sx={{ width: "100%", maxWidth: "100%", p: 0 }}>
          {/* العنوان */}
          <Box sx={{ mb: isPhone ? 0.7 : 1 }}>
            <Box
              sx={{
                minHeight: isPhone ? 62 : 70,
                px: isPhone ? 1 : isTablet ? 1.2 : 1.5,
                py: isPhone ? 0.8 : 1,
                mb: 0.7,
                borderRadius: isPhone ? 2 : 2.5,
                bgcolor: isDark ? theme.palette.surfaces.section : '#034d31',
                border: isDark ? '1px solid #67C99D' : 'none',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexDirection: isPhone ? 'column' : 'row',
                flexWrap: 'wrap',
                gap: isPhone ? 0.7 : 1.2
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isPhone ? 0.7 : 0.9,
                  width: isPhone ? '100%' : 'auto',
                  minWidth: 0
                }}
              >
                <Box
                  sx={{
                    width: isPhone ? 34 : 38,
                    height: isPhone ? 34 : 38,
                    flexShrink: 0,
                    borderRadius: 1.8,
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: 'rgba(255,255,255,.11)',
                    border: '1px solid rgba(255,255,255,.16)'
                  }}
                >
                  {isSupportStaff ? (
                    <AdminPanelSettings sx={{ fontSize: isPhone ? 19 : 21, color: '#fff' }} />
                  ) : (
                    <Computer sx={{ fontSize: isPhone ? 19 : 21, color: '#fff' }} />
                  )}
                </Box>

                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontWeight: 950,
                      fontSize: isPhone ? '0.95rem' : isTablet ? '1.02rem' : '1.12rem',
                      lineHeight: 1.25
                    }}
                  >
                    {isSupportStaff ? 'الدعم الفني' : 'مركز الدعم الفني'}
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.12,
                      color: 'rgba(255,255,255,.76)',
                      fontSize: isPhone ? '0.62rem' : '0.7rem',
                      lineHeight: 1.45
                    }}
                  >
                    {isSupportStaff
                      ? 'متابعة التذاكر والرد على طلبات المستخدمين'
                      : 'رفع تذكرة جديدة ومتابعة طلباتك السابقة'}
                  </Typography>
                </Box>
              </Box>

              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={() => {
                  if (isSupportStaff && viewAllTickets) {
                    fetchAllTickets({ preferCache: false });
                  } else {
                    fetchUserTickets();
                  }
                }}
                sx={uiLayout.withUiSx({
                  minHeight: 34,
                  px: 1.1,
                  width: isPhone ? '100%' : 'auto',
                  color: '#fff',
                  borderColor: 'rgba(255,255,255,.48)',
                  fontSize: '0.7rem',
                  fontWeight: 850,
                  '&:hover': {
                    borderColor: '#fff',
                    bgcolor: 'rgba(255,255,255,.08)'
                  }
                }, uiLayout.buttonSx)}
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
                  bgcolor: isDark ? 'rgba(33,150,243,.14)' : '#f7fbf9',
                  border: isDark ? '1px solid #67C99D' : '1px solid rgba(5,117,70,.14)',
                  py: 0.1,
                  mb: 0.65,
                  color: isDark ? theme.palette.text.primary : 'inherit',
                  '& .MuiAlert-icon': { color: isDark ? theme.palette.primary.main : '#057546' }
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 'medium', color: isDark ? theme.palette.text.primary : 'inherit' }}>
عادةً تتم مراجعة التذكرة خلال 1 إلى 24 ساعة حسب الأولوية وتوفر فريق الدعم.
                </Typography>
              </Alert>
            )}

            {isSupervisor && !isSupportStaff && (
              <Alert
                severity="success"
                icon={<Info />}
                sx={{
                  borderRadius: 2,
                  bgcolor: isDark ? 'rgba(76,175,80,.14)' : '#f7fbf9',
                  border: isDark ? '1px solid #67C99D' : '1px solid rgba(5,117,70,.14)',
                  py: 0.1,
                  mb: 0.65,
                  color: isDark ? theme.palette.text.primary : 'inherit',
                  '& .MuiAlert-icon': { color: isDark ? theme.palette.primary.main : undefined }
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 'medium', color: isDark ? theme.palette.text.primary : 'inherit' }}>
                  يمكنك تقديم تذاكر جديدة دون قيود عددية.
                </Typography>
              </Alert>
            )}
          </Box>

          {/* نموذج إنشاء تذكرة (للمستخدمين العاديين فقط) */}
          {!isSupportStaff && (
            <Paper sx={{
              p: isPhone ? 0.8 : isTablet ? 1 : 1.25,
              borderRadius: isPhone ? 2 : 2.5,
              boxShadow: 'none',
              border: isDark ? '1px solid #67C99D' : '1px solid rgba(5,117,70,.12)',
              bgcolor: isDark ? theme.palette.surfaces.card : '#fff',
              mb: isPhone ? 0.8 : 1,
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
                  bgcolor: isDark ? alpha(theme.palette.background.default, 0.92) : 'rgba(255, 255, 255, 0.9)',
                  border: isDark ? '1px solid #67C99D' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                  borderRadius: 2.5,
                  p: isPhone ? 1.2 : 2,
                  textAlign: 'center',
                }}>
                  <Avatar sx={{
                    bgcolor: '#ff9800',
                    width: isPhone ? 46 : 56,
                    height: isPhone ? 46 : 56,
                    mb: 1,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                    <Block sx={{ fontSize: isPhone ? 24 : 30 }} />
                  </Avatar>
                  <Typography sx={{ fontWeight: 900, mb: 0.5, color: isDark ? theme.palette.text.primary : '#034d31', fontSize: isPhone ? '0.88rem' : '1rem' }}>
                    ⚠️ لديك طلبين مازال قيد الانتظار
                  </Typography>
                  <Typography sx={{ mb: 1, maxWidth: 500, lineHeight: 1.6, fontSize: '0.72rem', color: isDark ? theme.palette.text.secondary : 'text.secondary' }}>
                    لا يمكنك تقديم تذكرة جديدة حتى يتم الرد على تذكرتك الحالية أو تغيير حالتها.
                    يمكنك متابعة حالة التذكرة الحالية في قسم "تذاكري السابقة" أدناه.
                  </Typography>
                  <Button
                    variant={isDark ? 'outlined' : 'contained'}
                    onClick={() => {
                      document.getElementById('tickets-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    sx={uiLayout.withUiSx({
                      py: 1.5,
                      px: 4,
                      borderRadius: 2,
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      ...(isDark ? {
                        background: 'transparent',
                        color: '#67C99D',
                        borderColor: '#67C99D',
                        '&:hover': { background: 'rgba(103,201,157,.1)', borderColor: '#67C99D' }
                      } : {
                        bgcolor: '#057546',
                        '&:hover': { bgcolor: '#034d31' }
                      })
                    }, uiLayout.buttonSx)}
                  >
                    عرض تذكرتي الحالية
                  </Button>
                </Box>
              )}
              
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.85 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box sx={{
                    width: 34,
                    height: 34,
                    bgcolor: isDark ? 'rgba(103,201,157,.16)' : '#edf7f2',
                    color: isDark ? theme.palette.primary.main : '#057546',
                    border: isDark ? '1px solid #67C99D' : 'none',
                    borderRadius: 1.8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Add sx={{ color: isDark ? theme.palette.primary.main : '#057546', fontSize: 19 }} />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 900, color: isDark ? theme.palette.text.primary : '#034d31', fontSize: isPhone ? '0.85rem' : '0.95rem' }}>
                      تقديم تذكرة جديدة
                    </Typography>
                    <Typography variant="body2" sx={{ color: isDark ? theme.palette.text.secondary : 'text.secondary' }}>
                      املأ النموذج أدناه لرفع تذكرة دعم فني جديدة
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Alert
                severity="warning"
                sx={{
                  mb: 2.5,
                  borderRadius: 2,
                  py: 1,
                  bgcolor: isDark ? 'rgba(255,152,0,.16)' : undefined,
                  border: isDark ? '1px solid #67C99D' : 'none',
                  color: isDark ? theme.palette.text.primary : 'inherit'
                }}
                icon={<Warning />}
              >
                <Typography variant="body2" sx={{ color: isDark ? theme.palette.text.primary : 'inherit' }}>
                  صف المشكلة بوضوح وأرفق صورة أو ملفًا عند الحاجة.
                </Typography>
              </Alert>

              <form onSubmit={handleSubmit}>
                <Grid container spacing={isPhone ? 2 : 2.5} sx={{ minWidth: 0 }}>
                  <Grid item xs={12} sx={{ minWidth: 0 }}>
                    <Grid container spacing={isPhone ? 2 : 2.5} sx={{ minWidth: 0 }}>
                      <Grid item xs={12} lg={6} sx={{ minWidth: 0 }}>
                        <FormControl fullWidth required sx={uiLayout.withUiSx({
                          bgcolor: isDark ? theme.palette.surfaces.input : 'white',
                          borderRadius: 1,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: isDark ? '#67C99D !important' : undefined
                          }
                        }, uiLayout.formFieldSx)}>
                          <InputLabel sx={{ fontWeight: 'medium', color: isDark ? theme.palette.text.secondary : '#555' }}>نوع التذكرة</InputLabel>
                          <Select
                            value={ticketType}
                            onChange={(e) => setTicketType(e.target.value)}
                            label="نوع التذكرة"
                            sx={{ height: isPhone ? '40px' : '42px', color: isDark ? theme.palette.text.primary : 'inherit' }}
                            disabled={hasPendingTicket && !isSupervisor}
                          >
                            {ticketTypes.map((type) => (
                              <MenuItem key={type.value} value={type.value}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.9 }}>
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

                      <Grid item xs={12} lg={6} sx={{ minWidth: 0 }}>
                        <FormControl fullWidth sx={uiLayout.withUiSx({
                          bgcolor: isDark ? theme.palette.surfaces.input : 'white',
                          borderRadius: 1,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: isDark ? '#67C99D !important' : undefined
                          }
                        }, uiLayout.formFieldSx)}>
                          <InputLabel sx={{ fontWeight: 'medium', color: isDark ? theme.palette.text.secondary : '#555' }}>درجة الأولوية</InputLabel>
                          <Select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                            label="درجة الأولوية"
                            sx={{ height: isPhone ? '40px' : '42px', color: isDark ? theme.palette.text.primary : 'inherit' }}
                            disabled={hasPendingTicket && !isSupervisor}
                          >
                            {priorities.map((p) => (
                              <MenuItem key={p.value} value={p.value}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.9 }}>
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

                  <Grid item xs={12} sx={{ minWidth: 0 }}>
                    <TextField InputLabelProps={{ shrink: true }}
                      fullWidth
                      required
                      label="عنوان التذكرة"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="مثال: مشكلة في تسجيل الدخول إلى النظام الأساسي"
                      helperText="اكتب عنواناً واضحاً يصف المشكلة بشكل مختصر"
                      sx={uiLayout.withUiSx({
                        bgcolor: isDark ? theme.palette.surfaces.input : 'white',
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1,
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: isDark ? '#67C99D !important' : undefined
                        },
                        '& .MuiInputBase-input': {
                          color: isDark ? theme.palette.text.primary : 'inherit'
                        }
                      }, uiLayout.formFieldSx)}
                      InputProps={{
                        sx: { height: isPhone ? '40px' : '42px', fontSize: '0.78rem' }
                      }}
                      disabled={hasPendingTicket && !isSupervisor}
                    />
                  </Grid>

                  <Grid item xs={12} sx={{ minWidth: 0 }}>
                    <TextField
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                      required
                      multiline
                      minRows={4}
                      label="وصف المشكلة / الاقتراح"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="صف المشكلة بالتفصيل..."
                      helperText="كلما كان الوصف أكثر تفصيلاً، كان حل المشكلة أسرع وأكثر دقة"
                      sx={{
                        bgcolor: isDark ? theme.palette.surfaces.input : 'white',
                        borderRadius: 1,

                        // حماية الـ multiline من أي height عام موروث من theme / global styles
                        '&& .MuiOutlinedInput-root': {
                          borderRadius: 1,
                          alignItems: 'flex-start',
                          bgcolor: isDark ? theme.palette.surfaces.input : 'white',
                        },
                        '&& .MuiOutlinedInput-root.MuiInputBase-multiline': {
                          height: 'auto !important',
                          minHeight: isPhone ? '112px !important' : '124px !important',
                          maxHeight: 'none !important',
                          padding: '12px 14px !important',
                          alignItems: 'flex-start !important',
                        },
                        '&& .MuiOutlinedInput-notchedOutline': {
                          borderColor: isDark ? '#67C99D !important' : 'rgba(5,117,70,.28)'
                        },
                        '&& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline, && .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#67C99D !important'
                        },

                        // استهداف الـ textarea المرئي فقط حتى لا نكسر textarea القياس الداخلي الخاص بـ MUI
                        '&& textarea.MuiInputBase-inputMultiline:not([aria-hidden="true"])': {
                          height: 'auto !important',
                          minHeight: isPhone ? '84px !important' : '96px !important',
                          maxHeight: 'none !important',
                          color: isDark ? theme.palette.text.primary : 'inherit',
                          lineHeight: '1.75 !important',
                          resize: 'vertical',
                          overflowY: 'auto !important',
                          boxSizing: 'border-box',
                          padding: '0 !important',
                        },
                        '& .MuiFormHelperText-root': {
                          mx: 0.5,
                          mt: 0.6,
                          color: isDark ? theme.palette.text.secondary : 'text.secondary',
                        },
                      }}
                      disabled={hasPendingTicket && !isSupervisor}
                    />
                  </Grid>

                  <Grid item xs={12} sx={{ minWidth: 0 }}>
                    <Box sx={{
                      p: isPhone ? 1.5 : 2,
                      border: isDark ? '1px dashed #67C99D' : '1px dashed rgba(5,117,70,.28)',
                      borderRadius: 2,
                      bgcolor: isDark ? theme.palette.surfaces.nested : '#fbfdfc',
                      textAlign: 'center',
                      minWidth: 0,
                      opacity: (hasPendingTicket && !isSupervisor) ? 0.6 : 1,
                    }}>
                      <CloudUpload sx={{ fontSize: isPhone ? 25 : 30, color: isDark ? theme.palette.primary.main : '#057546', mb: 0.6 }} />
                      <Typography sx={{ mb: 0.4, color: isDark ? theme.palette.text.primary : '#034d31', fontSize: '0.8rem', fontWeight: 900 }}>
                        إرفاق ملفات داعمة
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 0.7, fontSize: '0.68rem', color: isDark ? theme.palette.text.secondary : 'text.secondary' }}>
                        اسحب الملفات هنا أو انقر للرفع. المسموح: صور، PDF، Word. الحد الأقصى 5 ملفات، كل ملف حتى 100MB
                      </Typography>

                      <Button
                        component="label"
                        variant={isDark ? 'outlined' : 'contained'}
                        startIcon={<CloudUpload />}
                        sx={uiLayout.withUiSx({
                          borderRadius: 2,
                          px: 1.4,
                          py: 0.65,
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          ...(isDark ? {
                            background: 'transparent',
                            color: '#67C99D',
                            borderColor: '#67C99D',
                            '&:hover': { background: 'rgba(103,201,157,.1)', borderColor: '#67C99D' }
                          } : {
                            bgcolor: '#057546',
                            '&:hover': { bgcolor: '#034d31' }
                          })
                        }, uiLayout.buttonSx)}
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
                      <Box sx={{ mt: 0.8, minWidth: 0 }}>
                        <Divider sx={{ my: 0.8 }} />
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: isDark ? theme.palette.text.primary : '#034d31' }}>
                          📎 الملفات المرفوعة ({files.length}/5)
                        </Typography>
                        <Grid container spacing={isPhone ? 1.5 : 2} sx={{ minWidth: 0 }}>
                          {files.map((file) => (
                            <Grid item xs={12} sm={6} lg={4} key={file.id} sx={{ minWidth: 0 }}>
                              <Card
                                variant="outlined"
                                sx={{
                                  borderRadius: 2,
                                  border: isDark ? '1px solid #67C99D' : '1px solid rgba(0,0,0,.12)',
                                  bgcolor: isDark ? theme.palette.surfaces.card : '#fff',
                                  borderInlineStart: `4px solid ${file.type === 'image' ? '#4caf50' : '#2196f3'}`,
                                  minWidth: 0,
                                  '&:hover': {
                                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                                  }
                                }}
                              >
                                <CardContent sx={{ p: isPhone ? 0.75 : 1 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 0.5, flexWrap: 'wrap' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.9, minWidth: 0 }}>
                                      <Box sx={{
                                        p: 1.5,
                                        bgcolor: isDark
                                          ? (file.type === 'image' ? 'rgba(76,175,80,.18)' : 'rgba(33,150,243,.18)')
                                          : (file.type === 'image' ? '#e8f5e9' : '#e3f2fd'),
                                        borderRadius: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                      }}>
                                        {file.type === 'image' ?
                                          <Image sx={{ color: '#4caf50', fontSize: 24 }} /> :
                                          <AttachFile sx={{ color: '#2196f3', fontSize: 24 }} />
                                        }
                                      </Box>
                                      <Box sx={{ maxWidth: 120, minWidth: 0 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 'medium', wordBreak: 'break-word', color: isDark ? theme.palette.text.primary : 'inherit' }}>
                                          {file.name}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: isDark ? theme.palette.text.secondary : 'text.secondary' }}>
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

                  <Grid item xs={12} sx={{ minWidth: 0 }}>
                    <Box sx={{
                      p: isPhone ? 1.2 : 1.5,
                      bgcolor: isDark ? theme.palette.surfaces.nested : '#f7fbf9',
                      borderRadius: 2,
                      border: isDark ? '1px solid #67C99D' : '1px solid rgba(5,117,70,.10)',
                      mb: 2,
                      minWidth: 0
                    }}>
                      <Typography
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 0.55,
                          fontSize: isPhone ? '0.65rem' : '0.7rem',
                          lineHeight: 1.5,
                          color: isDark ? theme.palette.text.secondary : 'text.secondary'
                        }}
                      >
                        <Info sx={{ fontSize: 16, mt: 0.1, flexShrink: 0 }} />
                        عند الإرسال ستحصل على رقم متابعة ويمكنك متابعة حالة التذكرة من نفس الصفحة.
                      </Typography>
                    </Box>

                    <Box
                      sx={uiLayout.withUiSx({
                        display: 'flex',
                        flexDirection: isPhone ? 'column' : 'row',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        gap: 1.5,
                        width: '100%'
                      }, uiLayout.actionBarSx)}
                    >
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setSubject('');
                          setDescription('');
                          setTicketType('');
                          setPriority('medium');
                          setFiles([]);
                        }}
                        sx={uiLayout.withUiSx({
                          minHeight: 38,
                          py: 0.55,
                          px: 1.5,
                          width: isPhone ? '100%' : 'auto',
                          borderRadius: 2,
                          fontSize: '0.72rem',
                          fontWeight: 750,
                          ...(isDark ? {
                            background: 'transparent',
                            color: '#67C99D',
                            borderColor: '#67C99D',
                            '&:hover': { background: 'rgba(103,201,157,.1)', borderColor: '#67C99D' }
                          } : {})
                        }, uiLayout.buttonSx)}
                        disabled={hasPendingTicket && !isSupervisor}
                      >
                        مسح النموذج
                      </Button>
                      <Button
                        type="submit"
                        variant={isDark ? 'outlined' : 'contained'}
                        disabled={loading || uploading || (hasPendingTicket && !isSupervisor)}
                        startIcon={(loading || uploading) ? <CircularProgress size={20} color="inherit" /> : <Send />}
                        sx={uiLayout.withUiSx({
                          minHeight: 38,
                          py: 0.55,
                          px: 1.6,
                          width: isPhone ? '100%' : 'auto',
                          borderRadius: 2,
                          fontSize: '0.74rem',
                          fontWeight: 850,
                          minWidth: isPhone ? 0 : 150,
                          boxShadow: 'none',
                          cursor: (hasPendingTicket && !isSupervisor) ? 'not-allowed' : 'pointer',
                          ...(isDark ? {
                            background: 'transparent',
                            color: (hasPendingTicket && !isSupervisor) ? theme.palette.text.secondary : '#67C99D',
                            borderColor: (hasPendingTicket && !isSupervisor) ? theme.palette.text.secondary : '#67C99D',
                            '&:hover': (hasPendingTicket && !isSupervisor) ? {} : { background: 'rgba(103,201,157,.1)', borderColor: '#67C99D' }
                          } : {
                            bgcolor: (hasPendingTicket && !isSupervisor) ? '#9e9e9e' : '#057546',
                            '&:hover': (hasPendingTicket && !isSupervisor) ? {} : {
                              bgcolor: '#034d31',
                              boxShadow: 'none'
                            }
                          })
                        }, uiLayout.buttonSx)}
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
              p: isPhone ? 0.7 : isTablet ? 0.9 : 1,
              borderRadius: isPhone ? 2 : 2.5,
              boxShadow: 'none',
              border: isDark ? '1px solid #67C99D' : '1px solid rgba(5,117,70,.11)',
              bgcolor: isDark ? theme.palette.surfaces.card : '#fff',
            }}
          >
            {isSupportStaff && viewAllTickets ? (
              <Box sx={{ mb: 1 }}>
                {/* Admin section heading */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: isPhone ? 'stretch' : 'center',
                    justifyContent: 'space-between',
                    flexDirection: isPhone ? 'column' : 'row',
                    flexWrap: 'wrap',
                    gap: 0.75,
                    mb: 0.8
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                    <Box
                      sx={{
                        width: 34,
                        height: 34,
                        flexShrink: 0,
                        bgcolor: isDark ? 'rgba(103,201,157,.16)' : '#edf7f2',
                        color: isDark ? theme.palette.primary.main : '#057546',
                        borderRadius: 1.7,
                        display: 'grid',
                        placeItems: 'center',
                        border: isDark ? '1px solid #67C99D' : '1px solid rgba(5,117,70,.10)'
                      }}
                    >
                      <CalendarToday sx={{ fontSize: 18 }} />
                    </Box>

                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontWeight: 900,
                          color: isDark ? theme.palette.text.primary : '#034d31',
                          fontSize: isPhone ? '0.82rem' : '0.96rem',
                          lineHeight: 1.25
                        }}
                      >
                        تذاكر الدعم الفني
                      </Typography>
                      <Typography
                        sx={{
                          mt: 0.1,
                          color: isDark ? theme.palette.text.secondary : '#70827a',
                          fontSize: isPhone ? '0.62rem' : '0.68rem',
                          lineHeight: 1.4
                        }}
                      >
                        عرض وفرز ومتابعة طلبات المستخدمين
                      </Typography>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.45,
                      flexWrap: 'wrap'
                    }}
                  >
                    <Chip
                      size="small"
                      label={`${allUsersTickets.length} إجمالي`}
                      sx={{
                        height: 26,
                        bgcolor: isDark ? 'rgba(103,201,157,.16)' : '#edf7f2',
                        color: isDark ? theme.palette.primary.main : '#057546',
                        border: isDark ? '1px solid #67C99D' : 'none',
                        fontWeight: 850,
                        fontSize: '0.64rem',
                        '& .MuiChip-label': { px: 0.85 }
                      }}
                    />
                    <Chip
                      size="small"
                      label={`${allUsersTickets.filter((t) => t.status === 'pending').length} انتظار`}
                      sx={{
                        height: 26,
                        bgcolor: isDark ? 'rgba(255,152,0,.18)' : '#fff8e7',
                        color: isDark ? '#ffb74d' : '#9a6500',
                        border: isDark ? '1px solid #67C99D' : 'none',
                        fontWeight: 800,
                        fontSize: '0.62rem',
                        '& .MuiChip-label': { px: 0.8 }
                      }}
                    />
                    <Chip
                      size="small"
                      label={`${allUsersTickets.filter((t) => t.status === 'in_progress').length} معالجة`}
                      sx={{
                        height: 26,
                        bgcolor: isDark ? 'rgba(33,150,243,.18)' : '#eef5ff',
                        color: isDark ? '#64b5f6' : '#31669a',
                        border: isDark ? '1px solid #67C99D' : 'none',
                        fontWeight: 800,
                        fontSize: '0.62rem',
                        '& .MuiChip-label': { px: 0.8 }
                      }}
                    />
                  </Box>
                </Box>

                {/* Admin filters: one coherent toolbar, no uiLayout.filterBarSx override */}
                <Box
                  sx={{
                    p: isPhone ? 0.65 : 0.75,
                    borderRadius: 2,
                    bgcolor: isDark ? theme.palette.surfaces.nested : '#f8fbf9',
                    border: isDark ? '1px solid #67C99D' : '1px solid rgba(5,117,70,.10)',
                    display: 'grid',
                    gridTemplateColumns: isDesktop
                      ? 'minmax(250px, 1.55fr) minmax(210px, 1.2fr) minmax(145px, .75fr) auto 38px'
                      : isTablet
                      ? 'repeat(2, minmax(0, 1fr))'
                      : '1fr',
                    gap: 0.6,
                    alignItems: 'center',
                    '& .MuiInputBase-root': {
                      minHeight: 38,
                      bgcolor: isDark ? theme.palette.surfaces.input : '#fff',
                      color: isDark ? theme.palette.text.primary : 'inherit',
                      fontSize: '0.72rem'
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: isDark ? '#67C99D !important' : undefined
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '0.7rem'
                    }
                  }}
                >
                  <TextField
                    InputLabelProps={{ shrink: true }}
                    size="small"
                    label="البحث"
                    placeholder="رقم التذكرة، العنوان، المستخدم أو الفرع"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{
                      minWidth: 0,
                      width: '100%',
                      '& .MuiOutlinedInput-root': { borderRadius: 1.7 }
                    }}
                    InputProps={{
                      endAdornment: (
                        <Search
                          sx={{
                            ml: 0.4,
                            color: isDark ? theme.palette.text.secondary : '#6f8179',
                            fontSize: 18,
                            flexShrink: 0
                          }}
                        />
                      )
                    }}
                  />

                  <Autocomplete
                    size="small"
                    options={[{ guid: 'all', name: 'جميع الموظفين' }, ...employeeOptions]}
                    value={
                      selectedEmployeeGuid === 'all'
                        ? { guid: 'all', name: 'جميع الموظفين' }
                        : employeeOptions.find((emp) => emp.guid === selectedEmployeeGuid) ||
                          { guid: 'all', name: 'جميع الموظفين' }
                    }
                    onChange={(event, newValue) => {
                      setSelectedEmployeeGuid(newValue?.guid || 'all');
                    }}
                    getOptionLabel={(option) => option.name || ''}
                    isOptionEqualToValue={(option, value) => option.guid === value.guid}
                    sx={{
                      width: '100%',
                      minWidth: 0,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.7,
                        minHeight: 38,
                        py: '0 !important'
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        InputLabelProps={{ shrink: true }}
                        label="الموظف"
                        placeholder="جميع الموظفين"
                      />
                    )}
                  />

                  <FormControl
                    size="small"
                    sx={{
                      width: '100%',
                      minWidth: 0,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.7
                      }
                    }}
                  >
                    <InputLabel>الحالة</InputLabel>
                    <Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      label="الحالة"
                    >
                      <MenuItem value="all">جميع الحالات</MenuItem>
                      <MenuItem value="pending">قيد الانتظار</MenuItem>
                      <MenuItem value="in_progress">قيد المعالجة</MenuItem>
                      <MenuItem value="resolved">تم الحل</MenuItem>
                      <MenuItem value="closed">مغلقة</MenuItem>
                    </Select>
                  </FormControl>

                  <Button
                    variant={isDark ? 'outlined' : 'contained'}
                    startIcon={<Download sx={{ fontSize: 17 }} />}
                    onClick={exportTicketsToExcel}
                    disabled={displayedTickets.length === 0}
                    sx={{
                      minHeight: 38,
                      width: isTablet || isPhone ? '100%' : 'auto',
                      px: 1.25,
                      borderRadius: 1.7,
                      boxShadow: 'none',
                      whiteSpace: 'nowrap',
                      fontSize: '0.68rem',
                      fontWeight: 850,
                      ...(isDark ? {
                        background: 'transparent',
                        color: '#67C99D',
                        borderColor: '#67C99D',
                        '&:hover': { background: 'rgba(103,201,157,.1)', borderColor: '#67C99D' }
                      } : {
                        bgcolor: '#057546',
                        '&:hover': { bgcolor: '#034d31', boxShadow: 'none' }
                      })
                    }}
                  >
                    تصدير Excel
                  </Button>

                  <Tooltip title="تحديث التذاكر">
                    <IconButton
                      onClick={fetchAllTickets}
                      sx={{
                        width: isPhone || isTablet ? '100%' : 38,
                        height: 38,
                        borderRadius: 1.7,
                        color: isDark ? theme.palette.primary.main : '#057546',
                        bgcolor: isDark ? theme.palette.surfaces.input : '#fff',
                        border: isDark ? '1px solid #67C99D' : '1px solid rgba(5,117,70,.18)',
                        '&:hover': {
                          bgcolor: isDark ? 'rgba(103,201,157,.1)' : '#edf7f2'
                        },
                        ...(isTablet && {
                          gridColumn: '2 / 3'
                        })
                      }}
                    >
                      <Refresh sx={{ fontSize: 19 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: isPhone ? 'stretch' : 'center',
                  justifyContent: 'space-between',
                  flexDirection: isPhone ? 'column' : 'row',
                  flexWrap: 'wrap',
                  gap: 0.7,
                  mb: 0.9
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                  <Box
                    sx={{
                      width: 34,
                      height: 34,
                      flexShrink: 0,
                      bgcolor: isDark ? 'rgba(103,201,157,.16)' : '#edf7f2',
                      border: isDark ? '1px solid #67C99D' : 'none',
                      borderRadius: 1.7,
                      display: 'grid',
                      placeItems: 'center'
                    }}
                  >
                    <CalendarToday sx={{ color: isDark ? theme.palette.primary.main : '#057546', fontSize: 18 }} />
                  </Box>

                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontWeight: 900,
                        color: isDark ? theme.palette.text.primary : '#034d31',
                        fontSize: isPhone ? '0.82rem' : '0.96rem'
                      }}
                    >
                      تذاكري السابقة
                    </Typography>
                    <Typography sx={{ mt: 0.1, color: isDark ? theme.palette.text.secondary : '#70827a', fontSize: '0.66rem' }}>
                      {tickets.length} تذكرة
                    </Typography>
                  </Box>
                </Box>

                <Button
                  variant="outlined"
                  onClick={fetchUserTickets}
                  startIcon={<Refresh />}
                  sx={{
                    minHeight: 36,
                    width: isPhone ? '100%' : 'auto',
                    px: 1.1,
                    borderRadius: 1.7,
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    ...(isDark ? {
                      background: 'transparent',
                      color: '#67C99D',
                      borderColor: '#67C99D',
                      '&:hover': { background: 'rgba(103,201,157,.1)', borderColor: '#67C99D' }
                    } : {
                      color: '#057546',
                      borderColor: 'rgba(5,117,70,.26)'
                    })
                  }}
                >
                  تحديث
                </Button>
              </Box>
            )}

            {/* تبويبات الفلترة للمستخدمين العاديين */}
            {!isSupportStaff && (
              <Tabs
                value={tabValue}
                onChange={(e, newValue) => setTabValue(newValue)}
                variant={isPhone ? 'scrollable' : 'standard'}
                scrollButtons={isPhone ? 'auto' : false}
                allowScrollButtonsMobile
                sx={{
                  mb: 0.8,
                  minHeight: 38,
                  borderBottom: isDark ? '1px solid #67C99D' : '1px solid rgba(5,117,70,.10)',
                  '& .MuiTabs-flexContainer': {
                    gap: isPhone ? 0.1 : 0.35
                  },
                  '& .MuiTab-root': {
                    minHeight: 38,
                    minWidth: isPhone ? 92 : 110,
                    px: isPhone ? 0.7 : 1,
                    py: 0.45,
                    fontWeight: 750,
                    fontSize: isPhone ? '0.66rem' : '0.72rem',
                    color: isDark ? theme.palette.text.secondary : undefined
                  },
                  '& .MuiTab-root.Mui-selected': {
                    color: isDark ? '#67C99D' : undefined
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: isDark ? '#67C99D' : undefined
                  },
                  '& .MuiTab-iconWrapper': {
                    fontSize: 17
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
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 1.2 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>

                {!isDesktop ? (
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: isTablet ? 'repeat(2, minmax(0, 1fr))' : '1fr',
                      gap: isPhone ? 0.65 : 0.8
                    }}
                  >
                    {paginatedTickets.length > 0 ? (
                      paginatedTickets.map((ticket) => {
                        const typeInfo = ticketTypes.find(t => t.value === ticket.ticket_type);
                        const priorityInfo = priorities.find(p => p.value === ticket.priority);

                        return (
                          <Paper
                            key={ticket.id}
                            variant="outlined"
                            sx={{
                              p: isPhone ? 0.8 : 0.95,
                              minWidth: 0,
                              borderRadius: 2,
                              borderColor: isDark ? '#67C99D' : 'rgba(5,117,70,.12)',
                              boxShadow: 'none',
                              bgcolor: isDark ? theme.palette.surfaces.card : '#fff'
                            }}
                          >
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                justifyContent: 'space-between',
                                gap: 0.7
                              }}
                            >
                              <Box sx={{ minWidth: 0, flex: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.55, mb: 0.35, flexWrap: 'wrap' }}>
                                  <Typography
                                    sx={{
                                      fontFamily: 'monospace',
                                      fontWeight: 900,
                                      color: isDark ? theme.palette.primary.main : '#057546',
                                      fontSize: '0.7rem'
                                    }}
                                  >
                                    #{ticket.ticket_number}
                                  </Typography>

                                  <Chip
                                    label={getStatusText(ticket.status)}
                                    size="small"
                                    sx={{
                                      height: 22,
                                      bgcolor: isDark ? alpha(getStatusColor(ticket.status), 0.2) : getStatusColor(ticket.status) + '12',
                                      color: getStatusColor(ticket.status),
                                      fontWeight: 800,
                                      fontSize: '0.62rem',
                                      border: isDark ? `1px solid ${alpha(getStatusColor(ticket.status), 0.5)}` : 'none',
                                      '& .MuiChip-label': { px: 0.7 }
                                    }}
                                  />
                                </Box>

                                <Typography
                                  sx={{
                                    fontWeight: 850,
                                    color: isDark ? theme.palette.text.primary : '#243a31',
                                    fontSize: isPhone ? '0.75rem' : '0.8rem',
                                    lineHeight: 1.45,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                  }}
                                >
                                  {ticket.subject}
                                </Typography>
                              </Box>

                              <IconButton
                                size="small"
                                aria-label="مشاهدة التفاصيل"
                                onClick={() => openTicketDetails(ticket)}
                                sx={{
                                  width: 30,
                                  height: 30,
                                  flexShrink: 0,
                                  color: isDark ? theme.palette.primary.main : '#057546',
                                  border: isDark ? '1px solid #67C99D' : '1px solid rgba(5,117,70,.14)'
                                }}
                              >
                                <Visibility sx={{ fontSize: 17 }} />
                              </IconButton>
                            </Box>

                            {isSupportStaff && viewAllTickets && (
                              <Box
                                sx={{
                                  display: 'grid',
                                  gridTemplateColumns: isPhone ? '1fr' : 'repeat(2,minmax(0,1fr))',
                                  gap: 0.45,
                                  mt: 0.65,
                                  p: 0.6,
                                  borderRadius: 1.5,
                                  bgcolor: isDark ? theme.palette.surfaces.nested : '#f8fbf9',
                                  border: isDark ? '1px solid #67C99D' : 'none'
                                }}
                              >
                                <Typography sx={{ fontSize: '0.64rem', color: isDark ? theme.palette.text.secondary : '#60736b' }}>
                                  <strong>الموظف:</strong> {getUserNameFromGuid(ticket.user_guid)}
                                </Typography>
                                <Typography sx={{ fontSize: '0.64rem', color: isDark ? theme.palette.text.secondary : '#60736b' }}>
                                  <strong>الفرع:</strong> {getBranchNameFromGuid(ticket.branch_guid)}
                                </Typography>
                              </Box>
                            )}

                            <Box
                              sx={{
                                mt: 0.65,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.45,
                                flexWrap: 'wrap'
                              }}
                            >
                              <Chip
                                label={typeInfo?.label || 'غير محدد'}
                                size="small"
                                variant="outlined"
                                sx={{
                                  height: 22,
                                  borderColor: typeInfo?.color,
                                  color: typeInfo?.color,
                                  fontSize: '0.61rem',
                                  '& .MuiChip-label': { px: 0.65 }
                                }}
                              />

                              <Chip
                                label={priorityInfo?.label || 'غير محدد'}
                                size="small"
                                variant="outlined"
                                sx={{
                                  height: 22,
                                  borderColor: priorityInfo?.color,
                                  color: priorityInfo?.color,
                                  fontSize: '0.61rem',
                                  '& .MuiChip-label': { px: 0.65 }
                                }}
                              />

                              <Typography
                                sx={{
                                  marginInlineStart: 'auto',
                                  fontSize: '0.61rem',
                                  color: isDark ? theme.palette.text.secondary : '#7b8983',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {new Date(ticket.created_at).toLocaleDateString('ar-EG')}
                              </Typography>
                            </Box>

                            <Box
                              sx={{
                                mt: 0.7,
                                pt: 0.6,
                                borderTop: isDark ? '1px solid rgba(103,201,157,.25)' : '1px solid rgba(5,117,70,.08)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.35,
                                flexWrap: 'wrap'
                              }}
                            >
                              {(isSupportStaff || (ticket.user_guid === userGuid && ticket.status !== 'closed')) && (
                                <Button
                                  size="small"
                                  variant="text"
                                  startIcon={<Reply sx={{ fontSize: 16 }} />}
                                  onClick={() => openReplyDialog(ticket)}
                                  sx={{
                                    minHeight: 30,
                                    px: 0.65,
                                    color: isDark ? theme.palette.primary.main : '#057546',
                                    fontSize: '0.64rem',
                                    fontWeight: 800
                                  }}
                                >
                                  رد
                                </Button>
                              )}

                              {isSupportStaff && ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                                <Button
                                  size="small"
                                  variant="text"
                                  startIcon={<CheckCircle sx={{ fontSize: 16 }} />}
                                  onClick={() => updateTicketStatus(ticket.id, 'resolved')}
                                  disabled={updatingTicketIds.some(
                                    (id) =>
                                      String(id) ===
                                      String(ticket.id)
                                  )}
                                  sx={{
                                    minHeight: 30,
                                    px: 0.65,
                                    color: isDark ? '#66bb6a' : '#2e7d32',
                                    fontSize: '0.64rem',
                                    fontWeight: 800
                                  }}
                                >
                                  تم الحل
                                </Button>
                              )}

                              {isSupportStaff &&
                                ticket.status !== 'in_progress' &&
                                ticket.status !== 'resolved' &&
                                ticket.status !== 'closed' && (
                                  <Button
                                    size="small"
                                    variant="text"
                                    startIcon={<AccessTime sx={{ fontSize: 16 }} />}
                                    onClick={() => updateTicketStatus(ticket.id, 'in_progress')}
                                  disabled={updatingTicketIds.some(
                                    (id) =>
                                      String(id) ===
                                      String(ticket.id)
                                  )}
                                    sx={{
                                      minHeight: 30,
                                      px: 0.65,
                                      color: isDark ? '#ffb74d' : '#b26a00',
                                      fontSize: '0.64rem',
                                      fontWeight: 800
                                    }}
                                  >
                                    معالجة
                                  </Button>
                                )}

                              {isSupportStaff && ticket.status !== 'closed' && (
                                <Button
                                  size="small"
                                  variant="text"
                                  startIcon={<Close sx={{ fontSize: 16 }} />}
                                  onClick={() => updateTicketStatus(ticket.id, 'closed')}
                                  disabled={updatingTicketIds.some(
                                    (id) =>
                                      String(id) ===
                                      String(ticket.id)
                                  )}
                                  sx={{
                                    minHeight: 30,
                                    px: 0.65,
                                    color: isDark ? theme.palette.text.secondary : '#6f7d77',
                                    fontSize: '0.64rem',
                                    fontWeight: 800
                                  }}
                                >
                                  إغلاق
                                </Button>
                              )}
                            </Box>
                          </Paper>
                        );
                      })
                    ) : (
                      <Box
                        sx={{
                          gridColumn: '1 / -1',
                          minHeight: 110,
                          display: 'grid',
                          placeItems: 'center',
                          textAlign: 'center',
                          border: isDark ? '1px dashed #67C99D' : '1px dashed rgba(5,117,70,.18)',
                          borderRadius: 2,
                          bgcolor: isDark ? theme.palette.surfaces.nested : '#fbfdfc',
                          p: 1.5
                        }}
                      >
                        <Box>
                          <Description sx={{ fontSize: 30, color: isDark ? theme.palette.text.secondary : '#aab9b2', mb: 0.35 }} />
                          <Typography sx={{ fontWeight: 850, color: isDark ? theme.palette.text.primary : '#52645d', fontSize: '0.75rem' }}>
                            لا توجد تذاكر
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Box>
                ) : (
                <TableContainer
                  component={Paper}
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    boxShadow: 'none',
                    overflow: 'hidden',
                    overflowX: 'auto',
                    width: '100%',
                    maxWidth: '100%',
                    border: isDark ? '1px solid #67C99D' : '1px solid rgba(5,117,70,.11)',
                    bgcolor: isDark ? theme.palette.surfaces.card : '#fff',
                    '& .MuiTable-root': {
                      width: '100%',
                      minWidth: 0,
                      tableLayout: 'fixed'
                    },
                    '& .MuiTableCell-root': {
                      px: 0.6,
                      py: 0.68,
                      fontSize: '0.67rem',
                      whiteSpace: 'normal',
                      overflow: 'hidden',
                      verticalAlign: 'middle'
                    }
                  }}
                >
                  <Table size="small">
                    <TableHead
                      sx={{
                        bgcolor: isDark ? theme.palette.surfaces.section : '#edf7f2',
                        '& .MuiTableCell-head': {
                          color: isDark ? theme.palette.text.primary : '#27463a',
                          fontWeight: 900,
                          borderBottom: isDark ? '1px solid #67C99D' : '1px solid rgba(5,117,70,.14)'
                        }
                      }}
                    >
                      <TableRow>
                        {isSupportStaff && viewAllTickets && (
                          <TableCell sx={{ width: '17%', fontWeight: 900, color: isDark ? theme.palette.text.primary : '#034d31' }}>المستخدم</TableCell>
                        )}
                        <TableCell sx={{ width: '13%', fontWeight: 900, color: isDark ? theme.palette.text.primary : '#034d31' }}>#</TableCell>
                        <TableCell sx={{ width: '20%', fontWeight: 900, color: isDark ? theme.palette.text.primary : '#034d31' }}>التذكرة</TableCell>
                        <TableCell sx={{ width: '8%', fontWeight: 900, color: isDark ? theme.palette.text.primary : '#034d31' }}>النوع</TableCell>
                        <TableCell sx={{ width: '9%', fontWeight: 900, color: isDark ? theme.palette.text.primary : '#034d31' }}>الحالة</TableCell>
                        <TableCell sx={{ width: '7%', fontWeight: 900, color: isDark ? theme.palette.text.primary : '#034d31' }}>الأولوية</TableCell>
                        {isSupportStaff && viewAllTickets && (
                          <TableCell sx={{ width: '8%', fontWeight: 900, color: isDark ? theme.palette.text.primary : '#034d31' }}>الفرع</TableCell>
                        )}
                        <TableCell sx={{ width: '8%', fontWeight: 900, color: isDark ? theme.palette.text.primary : '#034d31' }}>التاريخ</TableCell>
                        <TableCell sx={{ width: '10%', fontWeight: 900, color: isDark ? theme.palette.text.primary : '#034d31' }}>الإجراءات</TableCell>
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
                                '&:hover': { bgcolor: isDark ? theme.palette.surfaces.hover : '#f8fbf9' },
                                '& .MuiTableCell-root': {
                                  borderBottom: `1px solid ${theme.palette.divider}`
                                }
                              }}
                            >
                              {isSupportStaff && viewAllTickets && (
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                                    <Avatar
                                      sx={{
                                        bgcolor: isDark ? 'rgba(103,201,157,.16)' : '#edf7f2',
                                        color: isDark ? theme.palette.primary.main : '#057546',
                                        width: 27,
                                        height: 27,
                                        flexShrink: 0,
                                        border: isDark ? '1px solid #67C99D' : 'none'
                                      }}
                                    >
                                      <Person sx={{ fontSize: 17 }} />
                                    </Avatar>
                                    <Typography
                                      title={getUserNameFromGuid(ticket.user_guid)}
                                      sx={{
                                        minWidth: 0,
                                        fontWeight: 750,
                                        fontSize: '0.65rem',
                                        lineHeight: 1.35,
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        color: isDark ? theme.palette.text.primary : 'inherit'
                                      }}
                                    >
                                      {getUserNameFromGuid(ticket.user_guid)}
                                    </Typography>
                                  </Box>
                                </TableCell>
                              )}
                              <TableCell>
                                <Typography
                                  title={`#${ticket.ticket_number}`}
                                  sx={{
                                    fontFamily: 'monospace',
                                    fontWeight: 800,
                                    fontSize: '0.6rem',
                                    lineHeight: 1.3,
                                    overflowWrap: 'anywhere',
                                    color: isDark ? theme.palette.text.secondary : '#40574e'
                                  }}
                                >
                                  #{ticket.ticket_number}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography
                                  title={ticket.subject}
                                  sx={{
                                    fontWeight: 800,
                                    color: isDark ? theme.palette.text.primary : '#30483f',
                                    fontSize: '0.67rem',
                                    lineHeight: 1.4,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                  }}
                                >
                                  {ticket.subject}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={typeInfo?.label}
                                  size="small"
                                  variant="outlined"
                                  sx={{
                                    maxWidth: '100%',
                                    height: 22,
                                    borderColor: typeInfo?.color,
                                    color: typeInfo?.color,
                                    fontWeight: 750,
                                    fontSize: '0.58rem',
                                    bgcolor: isDark ? alpha(typeInfo?.color || '#67C99D', 0.1) : 'transparent',
                                    '& .MuiChip-label': {
                                      px: 0.5,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis'
                                    }
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={getStatusText(ticket.status)}
                                  size="small"
                                  sx={{
                                    maxWidth: '100%',
                                    height: 22,
                                    bgcolor: isDark ? alpha(getStatusColor(ticket.status), 0.2) : getStatusColor(ticket.status) + '12',
                                    color: getStatusColor(ticket.status),
                                    fontWeight: 800,
                                    fontSize: '0.58rem',
                                    border: isDark ? `1px solid ${alpha(getStatusColor(ticket.status), 0.5)}` : 'none',
                                    '& .MuiChip-label': {
                                      px: 0.5,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis'
                                    }
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, minWidth: 0 }}>
                                  <Box
                                    sx={{
                                      width: 6,
                                      height: 6,
                                      borderRadius: '50%',
                                      bgcolor: priorityInfo?.color,
                                      flexShrink: 0
                                    }}
                                  />
                                  <Typography
                                    sx={{
                                      minWidth: 0,
                                      fontSize: '0.6rem',
                                      fontWeight: 750,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      color: isDark ? theme.palette.text.primary : 'inherit'
                                    }}
                                  >
                                    {priorityInfo?.label}
                                  </Typography>
                                </Box>
                              </TableCell>
                              {isSupportStaff && viewAllTickets && (
                                <TableCell>
                                  <Typography
                                    title={getBranchNameFromGuid(ticket.branch_guid)}
                                    sx={{
                                      fontWeight: 700,
                                      fontSize: '0.61rem',
                                      lineHeight: 1.3,
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                      overflow: 'hidden',
                                      color: isDark ? theme.palette.text.primary : 'inherit'
                                    }}
                                  >
                                    {getBranchNameFromGuid(ticket.branch_guid)}
                                  </Typography>
                                </TableCell>
                              )}
                              <TableCell>
                                <Typography
                                  sx={{
                                    fontWeight: 750,
                                    fontSize: '0.6rem',
                                    lineHeight: 1.3,
                                    color: isDark ? theme.palette.text.secondary : '#52645d'
                                  }}
                                >
                                  {new Date(ticket.created_at).toLocaleDateString('ar-EG')}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 0.2,
                                    flexWrap: 'wrap',
                                    maxWidth: '100%'
                                  }}
                                >
                                  <Tooltip title="مشاهدة التفاصيل">
                                    <IconButton
                                      size="small"
                                      sx={{
                                        width: 30,
                                        height: 30,
                                        color: isDark ? theme.palette.primary.main : '#057546',
                                        border: isDark ? '1px solid #67C99D' : '1px solid rgba(5,117,70,.12)'
                                      }}
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
                                        sx={{
                                          width: 27,
                                          height: 27,
                                          color: isDark ? '#66bb6a' : '#2e7d32',
                                          border: isDark ? '1px solid #67C99D' : 'none'
                                        }}
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
                                          sx={{
                                              width: 27,
                                              height: 27,
                                              color: ticket.status === 'closed'
                                                ? (isDark ? theme.palette.text.secondary : '#9e9e9e')
                                                : (isDark ? '#66bb6a' : '#2e7d32'),
                                              border: isDark ? '1px solid #67C99D' : 'none'
                                            }}
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
                                            sx={{
                                              width: 27,
                                              height: 27,
                                              color: isDark ? '#66bb6a' : '#2e7d32',
                                              border: isDark ? '1px solid #67C99D' : 'none'
                                            }}
                                            onClick={() => updateTicketStatus(ticket.id, 'resolved')}
                                  disabled={updatingTicketIds.some(
                                    (id) =>
                                      String(id) ===
                                      String(ticket.id)
                                  )}
                                          >
                                            <CheckCircle fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                      )}
                                      {ticket.status !== 'in_progress' && ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                                        <Tooltip title="قيد المعالجة">
                                          <IconButton
                                            size="small"
                                            sx={{
                                              width: 27,
                                              height: 27,
                                              color: isDark ? '#ffb74d' : '#b26a00',
                                              border: isDark ? '1px solid #67C99D' : 'none'
                                            }}
                                            onClick={() => updateTicketStatus(ticket.id, 'in_progress')}
                                  disabled={updatingTicketIds.some(
                                    (id) =>
                                      String(id) ===
                                      String(ticket.id)
                                  )}
                                          >
                                            <AccessTime fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                      )}
                                      {ticket.status !== 'closed' && (
                                        <Tooltip title="إغلاق التذكرة">
                                          <IconButton
                                            size="small"
                                            sx={{
                                              width: 27,
                                              height: 27,
                                              color: isDark ? theme.palette.text.secondary : '#6f7d77',
                                              border: isDark ? '1px solid #67C99D' : 'none'
                                            }}
                                            onClick={() => updateTicketStatus(ticket.id, 'closed')}
                                  disabled={updatingTicketIds.some(
                                    (id) =>
                                      String(id) ===
                                      String(ticket.id)
                                  )}
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
                              py: 1.2,
                              bgcolor: isDark ? theme.palette.surfaces.nested : '#fafafa',
                              borderRadius: 2
                            }}>
                              <Description sx={{ fontSize: 34, color: isDark ? theme.palette.text.secondary : '#aab9b2', mb: 0.6 }} />
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

                )}

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
                  sx={uiLayout.withUiSx({
                    direction: 'rtl',
                    mt: 0.55,
                    borderTop: isDark ? '1px solid rgba(103,201,157,.25)' : '1px solid rgba(5,117,70,.08)',
                    color: isDark ? theme.palette.text.secondary : undefined,
                    '& .MuiTablePagination-toolbar': {
                      minHeight: 42,
                      px: isPhone ? 0 : 0.5,
                      gap: isPhone ? 0.25 : 0.5,
                      flexWrap: isPhone ? 'wrap' : 'nowrap',
                      justifyContent: isPhone ? 'center' : 'flex-end'
                    },
                    '& .MuiTablePagination-spacer': {
                      display: isPhone ? 'none' : 'block'
                    },
                    '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                      m: 0,
                      fontSize: isPhone ? '0.62rem' : '0.68rem'
                    },
                    '& .MuiTablePagination-actions': {
                      marginInlineStart: isPhone ? 0 : 1
                    }
                  }, uiLayout.tablePaginationSx)}
                />
              </>
            )}
          </Paper>
        </Container>

        {/* ديالوج تفاصيل التذكرة */}
        <Dialog
          sx={uiLayout.dialogLayoutSx}
          open={detailsDialogOpen}
          onClose={() => setDetailsDialogOpen(false)}
          fullWidth
          maxWidth={false}
          PaperProps={{
            sx: {
              width: isPhone ? 'calc(100% - 16px)' : isTablet ? 'calc(100% - 32px)' : 'min(900px, calc(100% - 48px))',
              maxWidth: isPhone ? 'calc(100% - 16px)' : isTablet ? '900px' : '900px',
              maxHeight: isPhone ? 'calc(100dvh - 16px)' : 'calc(100dvh - 40px)',
              m: isPhone ? 1 : 2,
              borderRadius: isPhone ? 2 : 2.5,
              overflow: 'hidden',
              border: isDark ? '1px solid #67C99D' : 'none',
              bgcolor: isDark ? theme.palette.surfaces.card : '#fff'
            }
          }}
        >
          {ticketDetails && (
            <>
              <DialogTitle sx={{
                px: isPhone ? 1 : 1.5,
                py: 1,
                borderBottom: isDark ? '1px solid #67C99D' : '1px solid rgba(5,117,70,.11)',
                bgcolor: isDark ? theme.palette.surfaces.section : 'transparent'
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: isDark ? theme.palette.text.primary : 'inherit' }}>
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
                      bgcolor: isDark ? alpha(getStatusColor(ticketDetails.status), 0.2) : getStatusColor(ticketDetails.status) + '15',
                      color: getStatusColor(ticketDetails.status),
                      fontWeight: 'bold',
                      border: isDark ? `1px solid ${alpha(getStatusColor(ticketDetails.status), 0.5)}` : 'none'
                    }}
                  />
                </Box>
              </DialogTitle>
              <DialogContent dividers sx={{ p: isPhone ? 1 : 1.5, bgcolor: isDark ? theme.palette.surfaces.card : '#fbfdfc', borderColor: isDark ? '#67C99D' : undefined }}>
                <Grid container spacing={isPhone ? 1.5 : 2}>
                  <Grid item xs={12} lg={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      العنوان
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2, color: isDark ? theme.palette.text.primary : 'inherit' }}>
                      {ticketDetails.subject}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} lg={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      النوع
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      {ticketTypes.find(t => t.value === ticketDetails.ticket_type)?.icon}
                      <Typography variant="body1" sx={{ color: isDark ? theme.palette.text.primary : 'inherit' }}>
                        {ticketTypes.find(t => t.value === ticketDetails.ticket_type)?.label}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      الوصف
                    </Typography>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        mt: 1,
                        mb: 3,
                        borderColor: isDark ? '#67C99D' : undefined,
                        bgcolor: isDark ? theme.palette.surfaces.nested : 'transparent'
                      }}
                    >
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', color: isDark ? theme.palette.text.primary : 'inherit' }}>
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
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderColor: isDark ? '#67C99D' : undefined,
                          bgcolor: isDark ? theme.palette.surfaces.nested : '#f5f5f5'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.9 }}>
                          <Avatar sx={{ bgcolor: isDark ? theme.palette.primary.main : '#057546' }}>
                            <Person />
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'medium', color: isDark ? theme.palette.text.primary : 'inherit' }}>
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
                      <Grid container spacing={isPhone ? 1.5 : 2}>
                        {ticketDetails.attachments.map((attachment, index) => (
                          <Grid item xs={12} sm={6} key={index}>
                            <Card
                              variant="outlined"
                              sx={{
                                borderColor: isDark ? '#67C99D' : undefined,
                                bgcolor: isDark ? theme.palette.surfaces.nested : 'transparent'
                              }}
                            >
                              <CardContent sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.9, minWidth: 0 }}>
                                    <AttachFile sx={{ color: isDark ? theme.palette.primary.main : 'inherit' }} />
                                    <Box sx={{ minWidth: 0 }}>
                                      <Typography variant="body2" sx={{ fontWeight: 'medium', color: isDark ? theme.palette.text.primary : 'inherit' }}>
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
                                    sx={{ color: isDark ? theme.palette.primary.main : 'inherit' }}
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
                          <ListItem
                            key={index}
                            alignItems="flex-start"
                            sx={{
                              mb: 1,
                              borderRadius: 2,
                              border: isDark ? '1px solid #67C99D' : '1px solid transparent',
                              bgcolor: isDark ? theme.palette.surfaces.nested : 'transparent'
                            }}
                          >
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
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 0.5, minWidth: 0 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 'medium', color: isDark ? theme.palette.text.primary : 'inherit' }}>
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
                                  <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap', color: isDark ? theme.palette.text.secondary : 'inherit' }}>
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
              <DialogActions sx={uiLayout.withUiSx({
                  px: isPhone ? 1 : 1.5,
                  py: 1,
                  gap: 0.6,
                  flexWrap: 'wrap',
                  justifyContent: 'flex-start',
                  bgcolor: isDark ? theme.palette.surfaces.section : 'transparent',
                  borderTop: isDark ? '1px solid #67C99D' : 'none'
                }, uiLayout.dialogActionsSx)}>
                <Button
                  variant={isDark ? 'outlined' : 'text'}
                  sx={uiLayout.withUiSx({
                    borderRadius: 2,
                    px: 4,
                    fontWeight: 600,
                    ...(isDark ? {
                      background: 'transparent',
                      color: '#67C99D',
                      borderColor: '#67C99D',
                      '&:hover': { background: 'rgba(103,201,157,.1)', borderColor: '#67C99D' }
                    } : {})
                  }, uiLayout.buttonSx)}
                  onClick={() => setDetailsDialogOpen(false)}
                >
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
                        variant={isDark ? 'outlined' : 'contained'}
                        onClick={() => {
                          if (!isSupportStaff && ticketDetails.status === 'closed') return;
                          setDetailsDialogOpen(false);
                          openReplyDialog(ticketDetails);
                        }}
                        disabled={!isSupportStaff && ticketDetails.status === 'closed'}
                        sx={uiLayout.withUiSx({
                          borderRadius: 2,
                          px: 4,
                          fontWeight: 600,
                          ...(isDark ? {
                            background: 'transparent',
                            color: '#67C99D',
                            borderColor: '#67C99D',
                            '&:hover': { background: 'rgba(103,201,157,.1)', borderColor: '#67C99D' }
                          } : { bgcolor: '#057546' })
                        }, uiLayout.buttonSx)}
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
          sx={uiLayout.dialogLayoutSx}
          open={replyDialogOpen}
          onClose={() => setReplyDialogOpen(false)}
          fullWidth
          maxWidth={false}
          PaperProps={{
            sx: {
              width: isPhone ? 'calc(100% - 16px)' : 'min(640px, calc(100% - 32px))',
              maxWidth: '640px',
              m: isPhone ? 1 : 2,
              borderRadius: isPhone ? 2 : 2.5,
              overflow: 'hidden',
              border: isDark ? '1px solid #67C99D' : 'none',
              bgcolor: isDark ? theme.palette.surfaces.card : '#fff'
            }
          }}
        >
          <DialogTitle sx={{
            px: isPhone ? 1 : 1.5,
            py: 1,
            borderBottom: isDark ? '1px solid #67C99D' : '1px solid rgba(5,117,70,.11)',
            bgcolor: isDark ? theme.palette.surfaces.section : 'transparent',
            color: isDark ? theme.palette.text.primary : 'inherit'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, flexWrap: 'wrap' }}>
              <Reply sx={{ color: isDark ? theme.palette.primary.main : 'inherit' }} />
              إضافة رد على التذكرة #{selectedTicket?.ticket_number}
            </Box>
          </DialogTitle>
          <DialogContent dividers sx={{ p: isPhone ? 1 : 1.5, bgcolor: isDark ? theme.palette.surfaces.card : '#fbfdfc', borderColor: isDark ? '#67C99D' : undefined }}>
            <TextField
              InputLabelProps={{ shrink: true }}
              autoFocus
              multiline
              minRows={4}
              fullWidth
              label="رسالة الرد"
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="اكتب ردك بالتفصيل..."
              sx={{
                mb: 2,
                bgcolor: isDark ? theme.palette.surfaces.input : 'white',
                borderRadius: 1,

                // حماية حقل الرد من أي height عام موروث من theme / global styles
                '&& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                  alignItems: 'flex-start',
                  bgcolor: isDark ? theme.palette.surfaces.input : 'white',
                },
                '&& .MuiOutlinedInput-root.MuiInputBase-multiline': {
                  height: 'auto !important',
                  minHeight: isPhone ? '112px !important' : '124px !important',
                  maxHeight: 'none !important',
                  padding: '12px 14px !important',
                  alignItems: 'flex-start !important',
                },
                '&& .MuiOutlinedInput-notchedOutline': {
                  borderColor: isDark ? '#67C99D !important' : 'rgba(5,117,70,.28)'
                },
                '&& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline, && .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#67C99D !important'
                },
                '&& textarea.MuiInputBase-inputMultiline:not([aria-hidden="true"])': {
                  height: 'auto !important',
                  minHeight: isPhone ? '84px !important' : '96px !important',
                  maxHeight: 'none !important',
                  color: isDark ? theme.palette.text.primary : 'inherit',
                  lineHeight: '1.75 !important',
                  resize: 'vertical',
                  overflowY: 'auto !important',
                  boxSizing: 'border-box',
                  padding: '0 !important',
                },
              }}
            />

            <Box sx={{ mb: 2 }}>
              <Button
                component="label"
                variant="outlined"
                startIcon={<CloudUpload />}
                size="small"
                sx={uiLayout.withUiSx({
                  borderRadius: 2,
                  fontWeight: 600,
                  ...(isDark ? {
                    background: 'transparent',
                    color: '#67C99D',
                    borderColor: '#67C99D',
                    '&:hover': { background: 'rgba(103,201,157,.1)', borderColor: '#67C99D' }
                  } : {})
                }, uiLayout.buttonSx)}
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
                      flexWrap: 'wrap',
                      gap: 1,
                      p: 1,
                      border: isDark ? '1px solid #67C99D' : '1px solid #e0e0e0',
                      borderRadius: 1,
                      mt: 1,
                      bgcolor: isDark ? theme.palette.surfaces.nested : 'transparent'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                        <AttachFile fontSize="small" sx={{ color: isDark ? theme.palette.primary.main : 'inherit' }} />
                        <Typography variant="body2" sx={{ color: isDark ? theme.palette.text.primary : 'inherit' }}>
                          {file.name}
                        </Typography>
                      </Box>
                      <IconButton size="small" onClick={() => removeReplyFile(file.id)} sx={{ color: isDark ? theme.palette.text.secondary : 'inherit' }}>
                        <Close fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={uiLayout.withUiSx({
                  px: isPhone ? 1 : 1.5,
                  py: 1,
                  gap: 0.6,
                  flexWrap: 'wrap',
                  justifyContent: 'flex-start',
                  bgcolor: isDark ? theme.palette.surfaces.section : 'transparent',
                  borderTop: isDark ? '1px solid #67C99D' : 'none'
                }, uiLayout.dialogActionsSx)}>
            <Button
              variant={isDark ? 'outlined' : 'text'}
              sx={uiLayout.withUiSx({
                borderRadius: 2,
                px: 4,
                fontWeight: 600,
                ...(isDark ? {
                  background: 'transparent',
                  color: '#67C99D',
                  borderColor: '#67C99D',
                  '&:hover': { background: 'rgba(103,201,157,.1)', borderColor: '#67C99D' }
                } : {})
              }, uiLayout.buttonSx)}
              onClick={() => setReplyDialogOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              variant={isDark ? 'outlined' : 'contained'}
              onClick={handleSubmitReply}
              disabled={sendingReply || !replyMessage.trim()}
              startIcon={sendingReply ? <CircularProgress size={20} /> : <Send />}
              sx={uiLayout.withUiSx({
                borderRadius: 2,
                px: 4,
                fontWeight: 600,
                ...(isDark ? {
                  background: 'transparent',
                  color: '#67C99D',
                  borderColor: '#67C99D',
                  '&:hover': { background: 'rgba(103,201,157,.1)', borderColor: '#67C99D' }
                } : { bgcolor: '#057546' })
              }, uiLayout.buttonSx)}
            >
              {sendingReply ? 'جاري الإرسال...' : 'إرسال الرد'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ديالوج طلب قيد الانتظار */}
        <Dialog
          sx={uiLayout.dialogLayoutSx}
          open={pendingTicketDialogOpen}
          onClose={() => setPendingTicketDialogOpen(false)}
          fullWidth
          maxWidth={false}
          PaperProps={{
            sx: {
              width: isPhone ? 'calc(100% - 16px)' : 'min(600px, calc(100% - 32px))',
              maxWidth: '600px',
              m: isPhone ? 1 : 2,
              borderRadius: isPhone ? 2 : 2.5,
              overflow: 'hidden',
              border: isDark ? '1px solid #67C99D' : 'none',
              bgcolor: isDark ? theme.palette.surfaces.card : '#fff'
            }
          }}
        >
          <DialogTitle sx={{
            px: isPhone ? 1 : 1.5,
            py: 1,
            textAlign: 'center',
            borderBottom: isDark ? '1px solid #67C99D' : '1px solid rgba(5,117,70,.11)',
            bgcolor: isDark ? theme.palette.surfaces.section : 'transparent'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.7, mb: 0.35 }}>
              <Avatar sx={{
                bgcolor: isDark ? 'rgba(255,152,0,.18)' : '#fff8e7',
                color: isDark ? '#ffb74d' : '#c77800',
                width: 34,
                height: 34,
                border: isDark ? '1px solid #67C99D' : 'none'
              }}>
                <Block sx={{ fontSize: 19 }} />
              </Avatar>
            </Box>
            <Typography sx={{ fontWeight: 900, color: isDark ? theme.palette.text.primary : '#034d31', fontSize: '0.9rem' }}>
              ⚠️ لديك طلب مازال قيد الانتظار
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ p: isPhone ? 1 : 1.5, bgcolor: isDark ? theme.palette.surfaces.card : 'transparent' }}>
            <DialogContentText sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8, color: isDark ? theme.palette.text.primary : 'inherit' }}>
                لا يمكنك تقديم تذكرة جديدة حتى يتم الرد على تذكرتك الحالية أو تغيير حالتها.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                يمكنك متابعة حالة التذكرة الحالية في قسم "تذاكري السابقة" أدناه.
              </Typography>
            </DialogContentText>

            {tickets.filter(t => t.status === 'pending' || t.status === 'in_progress').slice(0, 2).map(ticket => (
              <Card
                key={ticket.id}
                variant="outlined"
                sx={{
                  mb: 0.7,
                  borderRadius: 2,
                  boxShadow: 'none',
                  borderColor: isDark ? '#67C99D' : undefined,
                  bgcolor: isDark ? theme.palette.surfaces.nested : 'transparent'
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'medium', color: isDark ? theme.palette.text.primary : 'inherit' }}>
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
                        bgcolor: isDark ? alpha(getStatusColor(ticket.status), 0.2) : getStatusColor(ticket.status) + '15',
                        color: getStatusColor(ticket.status),
                        fontWeight: 'bold',
                        border: isDark ? `1px solid ${alpha(getStatusColor(ticket.status), 0.5)}` : 'none'
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            ))}
          </DialogContent>
          <DialogActions sx={uiLayout.withUiSx({
              px: isPhone ? 1 : 1.5,
              py: 1,
              gap: 0.6,
              flexWrap: 'wrap',
              justifyContent: 'center',
              bgcolor: isDark ? theme.palette.surfaces.section : 'transparent',
              borderTop: isDark ? '1px solid #67C99D' : 'none'
            }, uiLayout.dialogActionsSx)}>
            <Button
              variant={isDark ? 'outlined' : 'contained'}
              onClick={() => {
                setPendingTicketDialogOpen(false);
                document.getElementById('tickets-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              sx={uiLayout.withUiSx({
                minHeight: 36,
                py: 0.55,
                px: 4,
                width: isPhone ? '100%' : 'auto',
                borderRadius: 2,
                fontSize: '0.7rem',
                fontWeight: 850,
                minWidth: isPhone ? 0 : 150,
                ...(isDark ? {
                  background: 'transparent',
                  color: '#67C99D',
                  borderColor: '#67C99D',
                  '&:hover': { background: 'rgba(103,201,157,.1)', borderColor: '#67C99D' }
                } : { bgcolor: '#057546' })
              }, uiLayout.buttonSx)}
            >
              عرض تذكرتي الحالية
            </Button>
            <Button
              variant={isDark ? 'outlined' : 'text'}
              onClick={() => setPendingTicketDialogOpen(false)}
              sx={uiLayout.withUiSx({
                borderRadius: 2,
                px: 4,
                fontWeight: 600,
                ...(isDark ? {
                  background: 'transparent',
                  color: '#67C99D',
                  borderColor: '#67C99D',
                  '&:hover': { background: 'rgba(103,201,157,.1)', borderColor: '#67C99D' }
                } : { color: '#666' })
              }, uiLayout.buttonSx)}
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
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: isPhone ? 'center' : 'right'
          }}
        >
          <Alert
            severity={alert.type}
            onClose={() => setAlert({ ...alert, open: false })}
            sx={{
              minWidth: isPhone ? 0 : 320,
              width: isPhone ? 'calc(100vw - 24px)' : 'auto',
              maxWidth: '100%',
              borderRadius: 2,
              boxShadow: '0 6px 18px rgba(31,45,61,.12)',
              border: isDark ? '1px solid #67C99D' : 'none',
              ...(isDark ? {
                bgcolor:
                  alert.type === 'success' ? 'rgba(76,175,80,.18)' :
                  alert.type === 'warning' ? 'rgba(255,152,0,.18)' :
                  alert.type === 'error' ? 'rgba(229,90,90,.18)' :
                  'rgba(33,150,243,.18)',
                color: theme.palette.text.primary,
                '& .MuiAlert-icon': {
                  color:
                    alert.type === 'success' ? '#66bb6a' :
                    alert.type === 'warning' ? '#ffb74d' :
                    alert.type === 'error' ? '#ef9a9a' :
                    '#64b5f6'
                }
              } : {})
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 'medium', color: isDark ? theme.palette.text.primary : 'inherit' }}>
              {alert.message}
            </Typography>
          </Alert>
        </Snackbar>
      </Box>
    </Box></NavigationShell>
  );
};

export default TechnicalSupport;