import * as uiLayout from './common/uiLayout';
import { navigationContentStyle } from '../config/sidebarLayout';
import NavigationShell from './NavigationShell';
import React, { useState, useEffect } from 'react';
import {
  TextField, Container, Alert, CircularProgress, Grow,
  Table, TableBody, TableCell, TableContainer, TableRow, Paper, Typography,
  Button, Dialog, DialogActions, DialogContent, DialogTitle, Select, MenuItem,
  InputLabel, FormControl, TableHead, Box, Chip, Card, CardContent
} from '@mui/material';
import {
  AccountCircle, Fingerprint, Phone, Wc, Public,
  AddIcCall, School, ReceiptLong, CalendarToday, Schedule
} from '@mui/icons-material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import FollowUpCallsDialog from './FollowUpCallsDialog';
import FormHelperText from '@mui/material/FormHelperText';
import axios from 'axios';
import AddNewStudentButton from './AddNewStudentButton';
import Swal from 'sweetalert2';
import CallHistory from './CallHistory';
import StudentStatementDialog from './StudentStatementDialog';

import MyCallHistoryDialog from './MyCallHistoryDialog';
import NotificationsIcon from "@mui/icons-material/InfoOutlined";
import { Badge } from '@mui/material';

// الألوان الجديدة
const primaryColor = '#80b49e';
const primaryDark = '#6a9a87';
const primaryLight = '#9ac9b5';
const backgroundColor = '#f8fbfa';
const surfaceColor = '#ffffff';
const textPrimary = '#2c3e50';
const textSecondary = '#5d6d7e';

export default function StudentSearch({ onLogout }) {
    const user = JSON.parse(localStorage.getItem("user"));
    const [openWhatsAppDialog, setOpenWhatsAppDialog] = useState(false);
    const [whatsappData, setWhatsappData] = useState({
        name: '',
        phone: '',
        notes: '',
        sentToStudent: false,
        sentToHR: false
    });
    const [nationalId, setNationalId] = useState('');
    const [student, setStudent] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [studyInfo, setStudyInfo] = useState([]);
    const [openStudyDialog, setOpenStudyDialog] = useState(false);
    const [openStatementDialog, setOpenStatementDialog] = useState(false);
    const [openCallForm, setOpenCallForm] = useState(false);
    const [newCall, setNewCall] = useState(null);
    const [showCallHistory, setShowCallHistory] = useState(false);
    const [followUpCalls, setFollowUpCalls] = useState([]);
    const [openFollowUpDialog, setOpenFollowUpDialog] = useState(false);
    const [supervisors, setSupervisors] = useState([]);
    const [salesUsers, setSalesUsers] = useState([]);
    const [followUpCount, setFollowUpCount] = useState(0);
    const [allCalls, setAllCalls] = useState([]);

       const [branches, setBranches] = useState([]); // ✅ أضفناها هنا
    const [snackbar, setSnackbar] = useState({ // ✅ أضفناها هنا
        open: false,
        message: "",
        severity: "success"
    });
    
    const [openFollowUpDialogOnlyForSales, setOpenFollowUpDialogOnlyForSales] = useState(false);
    const [followUpCallsForSales, setFollowUpCallsForSales] = useState([]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (nationalId.length === 10 && /^[1-9]\d{9}$/.test(nationalId)) {
                fetchStudent();
            } else {
                setStudent(null);
                setError('');
            }
        }, 800);
        return () => clearTimeout(delayDebounceFn);
    }, [nationalId]);

    useEffect(() => {
        const fetchFollowUpCount = async () => {
            try {
                const res = await axios.get('https://api1.sstli.com/api/call/all');
                const count = res.data.filter(c => c.callStatus === 1).length;
                setFollowUpCount(count);
            } catch (err) {
                console.error("Error fetching follow-up count:", err);
            }
        };

        fetchFollowUpCount();
    }, []);

    // جلب جميع المكالمات
    useEffect(() => {
        const fetchAllCalls = async () => {
            try {
                const res = await axios.get('https://api1.sstli.com/api/call/all');
                setAllCalls(res.data);
            } catch (err) {
                console.error("Error fetching all calls:", err);
            }
        };

        fetchAllCalls();
    }, []);

useEffect(() => {
    const fetchUsers = async () => {
        try {
            // نجيب بيانات المستخدمين والفروع مع بعض
            const [usersRes, branchesRes] = await Promise.all([
                axios.get("https://api1.sstli.com/api/userinfo"),
                axios.get("https://api1.sstli.com/api/branches/all")
            ]);

            const allUsers = usersRes.data;
            const allBranches = branchesRes.data;

            // نعمل map للفروع عشان نبقيها أسرع في البحث
            const branchMap = new Map();
            allBranches.forEach(branch => {
                branchMap.set(branch.guid, branch.name);
            });

            // فلتر المشرفين (userJop === 9) والبايعين (userJop === 18)
            const supervisorsList = allUsers.filter(user => user.userJop === 9);
            const salesList = allUsers.filter(user => user.userJop === 18);

            // نضيف اسم الفرع لكل مشرف باستخدام الـ branchForWork
            const supervisorsWithBranch = supervisorsList.map(sup => {
                const branchGuid = sup.branchForWork;
                let branchName = "فرع غير معروف";
                
                // لو فيه branchGuid، ندور على اسمه في الـ map
                if (branchGuid && branchGuid !== "00000000-0000-0000-0000-000000000000") {
                    branchName = branchMap.get(branchGuid) || "فرع غير معروف";
                }
                
                return {
                    ...sup,
                    branchName: branchName,
                    // ممكن نضيف الـ branchGuid كمان لو محتاجينه
                    branchGuid: branchGuid
                };
            });

            // نخزن البيانات في الـ state
            setSupervisors(supervisorsWithBranch);
            setSalesUsers(salesList);
            
            // (اختياري) نخزن الفروع في state عشان نستخدمها في حاجات تانية
            setBranches(allBranches);

        } catch (err) {
            console.error("Error fetching data", err);
            // ممكن نضيف snackbar أو alert للخطأ
            setSnackbar({
                open: true,
                message: "فشل تحميل البيانات. تأكد من اتصالك بالإنترنت.",
                severity: "error"
            });
        }
    };

    fetchUsers();
}, []);

    const validate = () => {
        const newErrors = {};

        if (!callForm.callType) newErrors.callType = "هذا الحقل مطلوب";
        if (!callForm.callStatus) newErrors.callStatus = "هذا الحقل مطلوب";

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    const fetchStudent = async () => {
        setLoading(true);
        setStudent(null);
        setError('');
        try {
            const response = await axios.get(`https://api1.sstli.com/api/student/${nationalId}`);
            setStudent(response.data);
            // Fetch study info when student is found
            try {
                const studyResponse = await axios.get(`https://api1.sstli.com/api/studyinfo/${response.data.accountGuid}`);
                setStudyInfo(studyResponse.data);
            } catch (studyError) {
                console.error("Error fetching study info:", studyError);
                setStudyInfo([]);
            }
            fetchFollowUpCalls(response.data.accountGuid);
        } catch (err) {
            setError('❌ الطالب غير موجود');
        } finally {
            setLoading(false);
        }
    };

    const fetchFollowUpCalls = async (accountGuid) => {
        try {
            const response = await axios.get(`https://api1.sstli.com/api/calls/${accountGuid}`);
            const filtered = response.data.filter(call => call.status === 'متابعة لاحقا');
            setFollowUpCalls(filtered);
        } catch (error) {
            console.error(error);
        }
    };

    const [callForm, setCallForm] = useState({
        callType: '',
        programInquiry: '',
        studyInquiryTopic: '',
        complainInquiry: '',
        complainDetails: '',
        complainSource: '',
        notes: '',
        callStatus: '',
        forwardCall: '',
        forwardTo: '',
        selectedSupervisor: '',
        selectedSales: ''
    });

    const [errors, setErrors] = useState({});

    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    const userJob = currentUser?.userJop;

    const submitCallForm = async () => {
        if (!validate()) return;

        try {
            // Generate a random 6-digit code
            const generateRandomCode = () => {
                return Math.floor(100000 + Math.random() * 900000).toString();
            };

            const callTypeValue = callForm.callType === "general" ? 0
                : callForm.callType === "study" ? 1
                    : 2;

            const programInquiryValue = callForm.callType === 'study'
                ? parseInt(callForm.programInquiry || 0)
                : null;

            const studyInquiryTopicValue = callForm.callType === 'study'
                ? parseInt(callForm.studyInquiryTopic || 0)
                : null;

            const complainInquiryValue = callForm.callType === 'complain' ? 1 : null;

            const complainDetailsValue = callForm.callType === 'complain'
                ? `شكوى من: ${callForm.complainSource || "غير محدد"} - التفاصيل: ${callForm.complainDetails}`
                : null;

            // Generate random code
            const randomCode = generateRandomCode();

            // إعداد بيانات الاتصال
            const requestData = {
                id: 0, // This should be handled by your backend (auto-increment)
                code: randomCode, // Use the generated random code
                callDate: new Date(),
                callTime: new Date(),
                callType: callTypeValue,
                accountGuid: student.accountGuid,
                programInquiry: programInquiryValue,
                studyInquiryTopic: studyInquiryTopicValue,
                complainInquiry: complainInquiryValue,
                complainDetails: complainDetailsValue,
                notes: callForm.notes || null,
                callStatus: parseInt(callForm.callStatus),
                userGuid: user.guid,
                forwardCall: callForm.forwardCall === "yes",
                forwardTo: callForm.forwardCall === "yes" ? callForm.forwardTo || null : null,
                supervisorGuid:
                    callForm.forwardCall === "yes"
                        ? callForm.selectedSupervisor || callForm.selectedSales || null
                        : null,

            };

            console.log("Submitting call data:", requestData);

            const response = await axios.post("https://api1.sstli.com/api/call", requestData);

            Swal.fire({
                icon: 'success',
                title: 'تم تسجيل الاتصال بنجاح!',
                text: `رقم الاتصال هو: ${randomCode}`,
                confirmButtonColor: primaryColor,
            });

            // تحديث السجل
            setNewCall({
                code: randomCode,
                callDate: new Date().toISOString(),
                callTime: new Date().toISOString(),
                notes: callForm.notes || '',
                status: "",
                userFullName: user.fullName
            });

            fetchFollowUpCalls(student.accountGuid);

            setOpenCallForm(false);
            setCallForm({
                callType: '',
                programInquiry: '',
                studyInquiryTopic: '',
                complainInquiry: '',
                complainDetails: '',
                complainSource: '',
                notes: '',
                callStatus: '',
                forwardCall: '',
                forwardTo: '',
                selectedSupervisor: ''
            });

        } catch (error) {
            console.error("Call submission error:", error.response?.data || error);

            let errorMessage = '❌ حدث خطأ أثناء حفظ الاتصال';
            if (error.response?.data?.errors) {
                const errors = Object.values(error.response.data.errors).flat();
                errorMessage = errors.join('\n');
            }

            Swal.fire({
                icon: 'error',
                title: 'خطأ',
                html: errorMessage.replace(/\n/g, '<br>'),
                confirmButtonColor: '#d33',
            });
        }
    };

    const fetchStudyInfo = async () => {
        try {
            const response = await axios.get(`https://api1.sstli.com/api/studyinfo/${student.accountGuid}`);
            setStudyInfo(response.data);
            console.log("studyinfostudyinfo", setStudyInfo)
            setOpenStudyDialog(true);
        } catch (error) {
            alert('❌ حدث خطأ أثناء تحميل الملف التدريبي');
        }
    };

    const [openMyCalls, setOpenMyCalls] = useState(false);
    useEffect(() => {
        const handleOpen = () => setOpenMyCalls(true);
        window.addEventListener('openMyCallsDialog', handleOpen);
        return () => window.removeEventListener('openMyCallsDialog', handleOpen);
    }, []);

    const getStudentType = (type) => {
        if (type === "0") return "ذكر";
        if (type === "1") return "أنثى";
        return "غير محدد";
    };

    const getStudentNational = (national) => {
        if (national === "0") return "مواطن";
        if (national === "1") return "مقيم";
        return "غير محدد";
    };

    // دالة لتحويل نوع المكالمة إلى نص مفهوم
    const getCallTypeText = (callType) => {
        switch (callType) {
            case 0: return "استفسار عام";
            case 1: return "استفسار دراسي";
            case 2: return "شكوى";
            default: return "غير محدد";
        }
    };

    // دالة للحصول على حالة المكالمة
    const getCallStatusText = (callStatus) => {
        switch (callStatus) {
            case 0: return "مكتملة";
            case 1: return "متابعة لاحقًا";
            default: return "غير محدد";
        }
    };

    // دالة للحصول على اسم المستخدم من الـ GUID
    const getUserName = (userGuid) => {
        // هنا يمكنك إضافة منطق للبحث عن اسم المستخدم من GUID
        // حالياً نعيد GUID نفسه كقيمة مؤقتة
        return userGuid;
    };

    // دالة للحصول على اسم المشرف/المبيعات من الـ GUID
// دالة للحصول على اسم المشرف/المبيعات من الـ GUID
const getForwardedToName = (forwardTo, supervisorGuid) => {
    if (!supervisorGuid) return "غير ممررة";
    
    if (forwardTo === "supervisor") {
        const supervisor = supervisors.find(sup => sup.guid === supervisorGuid);
        return supervisor ? `${supervisor.fullName} - ${supervisor.branchName}` : "مشرف غير معروف";
    } else if (forwardTo === "sales") {
        const sales = salesUsers.find(sale => sale.guid === supervisorGuid);
        return sales ? sales.fullName : "موظف مبيعات غير معروف";
    }
    return "غير ممررة";
};

    return (
        <NavigationShell variant="standard" ><div style={{ display: 'flex', minHeight: '100vh', backgroundColor: backgroundColor }}>
            
            <div style={{
              flex: 1,
              padding: '20px',
              direction: 'rtl',
              ...navigationContentStyle
            }}>
                <Card sx={{ 
                    mb: 3, 
                    borderRadius: 3, 
                    boxShadow: '0 4px 12px rgba(128, 180, 158, 0.1)',
                    background: `linear-gradient(135deg, ${surfaceColor} 0%, #f0f7f4 100%)`,
                    border: `1px solid ${primaryLight}`
                }}>
                    <CardContent>
                        <Typography variant="h4" align="center" sx={{ 
                            fontWeight: 'bold', 
                            color: primaryDark, 
                            mb: 2, 
                            fontFamily: 'Cairo',
                            background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryDark} 100%)`,
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>
                            نظام إدارة الطلاب والمكالمات
                        </Typography>
                        <Typography variant="h6" align="center" sx={{ 
                            color: textSecondary, 
                            mb: 3, 
                            fontFamily: 'Cairo' 
                        }}>
                            أهلاً {user.fullName} بك في خدمة العملاء
                        </Typography>

                        <Box sx={uiLayout.withUiSx({ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap', mb: 2 }, uiLayout.actionBarSx)}>
                            <Button
                                variant="outlined"
                                sx={uiLayout.withUiSx({
                                    borderColor: primaryColor,
                                    color: primaryColor,
                                    fontFamily: "Cairo",
                                    width: "200px",
                                    borderRadius: '12px',
                                    borderWidth: '2px',
                                    '&:hover': {
                                        borderColor: primaryDark,
                                        color: primaryDark,
                                        backgroundColor: `${primaryLight}20`
                                    }
                                }, uiLayout.buttonSx)}
                                onClick={() => window.dispatchEvent(new Event('openMyCallsDialog'))}
                            >
                                سجل اتصالاتي
                            </Button>

                            {user.userJop === 17 && (
                                <>
                                    <Button
                                        variant="outlined"
                                        sx={uiLayout.withUiSx({
                                            borderColor: '#e74c3c',
                                            color: '#e74c3c',
                                            fontFamily: "Cairo",
                                            width: "200px",
                                            borderRadius: '12px',
                                            borderWidth: '2px',
                                            '&:hover': {
                                                borderColor: '#c0392b',
                                                color: '#c0392b',
                                                backgroundColor: '#ffeaea'
                                            }
                                        }, uiLayout.buttonSx)}
                                        onClick={() => setOpenFollowUpDialogOnlyForSales(true)}
                                    >
                                        مكالمات تحتاج إلى متابعة
                                    </Button>
                                </>
                            )}

                            <Button
                                variant="contained"
                                sx={uiLayout.withUiSx({
                                    backgroundColor: '#25D366',
                                    color: 'white',
                                    fontFamily: 'Cairo',
                                    transition: 'all 0.3s ease',
                                    borderRadius: '12px',
                                    '&:hover': {
                                        backgroundColor: '#128C7E',
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 6px 12px rgba(37, 211, 102, 0.3)'
                                    }
                                }, uiLayout.buttonSx)}
                                onClick={() => setOpenWhatsAppDialog(true)}
                                startIcon={<WhatsAppIcon sx={{ fontSize: '24px' }} />}
                            >
                                استفسار توظيفي عبر الواتساب
                            </Button>
                        </Box>
                    </CardContent>
                </Card>

                <Card sx={{ 
                    borderRadius: 3, 
                    boxShadow: '0 4px 12px rgba(128, 180, 158, 0.1)', 
                    overflow: 'hidden',
                    background: `linear-gradient(135deg, ${surfaceColor} 0%, #f0f7f4 100%)`,
                    border: `1px solid ${primaryLight}`
                }}>
                    <CardContent sx={{ p: 4 }}>
                        <Typography variant="h5" sx={{ 
                            fontWeight: 'bold', 
                            color: primaryDark, 
                            mb: 3, 
                            textAlign: 'center', 
                            fontFamily: 'Cairo' 
                        }}>
                            🔍 البحث عن طالب
                        </Typography>

                        <TextField InputLabelProps={{ shrink: true }}
                            label="أدخل رقم الهوية"
                            variant="outlined"
                            fullWidth
                            value={nationalId}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (/^\d{0,10}$/.test(value)) {
                                    setNationalId(value);
                                }
                            }}
                            inputProps={{ style: { textAlign: 'right' , direction: "ltr", unicodeBidi: "isolate" }, dir: "ltr" }}
                            sx={uiLayout.withUiSx({
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': {
                                        borderColor: primaryLight,
                                        borderRadius: 2
                                    },
                                    '&:hover fieldset': {
                                        borderColor: primaryColor,
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: primaryColor,
                                        borderWidth: '2px',
                                        boxShadow: `0 0 0 2px ${primaryLight}80`
                                    }
                                },
                                mb: 2
                            }, uiLayout.formFieldSx)}
                        />

                        {loading && <CircularProgress sx={{ display: 'block', margin: '20px auto', color: primaryColor }} />}

                        {nationalId && !/^[1-9]\d{9}$/.test(nationalId) && (
                            <Alert severity="warning" sx={{ 
                                mt: 2, 
                                borderRadius: 2,
                                backgroundColor: '#fff3cd',
                                border: '1px solid #ffeaa7',
                                color: '#856404'
                            }}>
                                رقم الهوية يجب أن يكون مكون من 10 أرقام ويبدأ برقم غير صفر
                            </Alert>
                        )}

                        {error && !loading && (
                            <Box sx={{ textAlign: 'center', mt: 2 }}>
                                <Alert
                                    severity="error"
                                    sx={{ 
                                        mb: 2, 
                                        fontWeight: 'bold', 
                                        fontSize: '16px', 
                                        display: 'inline-block', 
                                        borderRadius: 2,
                                        backgroundColor: '#ffeaea',
                                        border: '1px solid #e74c3c'
                                    }}
                                >
                                    {error}
                                </Alert>
                                <br />
                                <AddNewStudentButton nationalId={nationalId} />
                            </Box>
                        )}

                        <Grow in={!!student && !loading}>
                            <Box>
                                {student && (
                                    <>
                                        <Card sx={{ 
                                            mt: 4, 
                                            borderRadius: 2, 
                                            boxShadow: '0 2px 8px rgba(128, 180, 158, 0.1)',
                                            border: `1px solid ${primaryLight}`,
                                            backgroundColor: surfaceColor
                                        }}>
                                            <CardContent>
                                                <Typography variant="h6" sx={{ 
                                                    fontWeight: 'bold', 
                                                    color: primaryDark, 
                                                    mb: 2, 
                                                    fontFamily: 'Cairo' 
                                                }}>
                                                    معلومات الطالب
                                                </Typography>
                                                <TableContainer sx={uiLayout.tableContainerSx}>
    <Table>
        <TableBody>
            <TableRow>
                <TableCell sx={{ fontFamily: "Cairo", fontWeight: 'bold', width: '30%', textAlign: "start" }} align="right">
                    <AccountCircle sx={{ marginInlineEnd: 1, color: primaryColor }} /> 
                    الاسم الكامل
                </TableCell>
                <TableCell align="right" sx={{ fontFamily: "Cairo", textAlign: 'right' }}>{student.studentName}</TableCell>
            </TableRow>
            <TableRow>
                <TableCell sx={{ fontFamily: "Cairo", fontWeight: 'bold', textAlign: "start" }} align="right">
                    <Fingerprint sx={{ marginInlineEnd: 1, color: primaryColor }} /> 
                    رقم الهوية
                </TableCell>
                <TableCell align="right" sx={{ fontFamily: "Cairo", textAlign: 'right' }}><bdi dir="ltr">{student.nationalId}</bdi></TableCell>
            </TableRow>
            <TableRow>
                <TableCell sx={{ fontFamily: "Cairo", fontWeight: 'bold', textAlign: "start" }} align="right">
                    <Phone sx={{ marginInlineEnd: 1, color: primaryColor }} /> 
                    رقم الجوال
                </TableCell>
                <TableCell align="right" sx={{ fontFamily: "Cairo", textAlign: 'right' }}><bdi dir="ltr">{student.studentTel}</bdi></TableCell>
            </TableRow>
            <TableRow>
                <TableCell sx={{ fontFamily: "Cairo", fontWeight: 'bold', textAlign: "start" }} align="right">
                    <Wc sx={{ marginInlineEnd: 1, color: primaryColor }} /> 
                    النوع
                </TableCell>
                <TableCell align="right" sx={{ fontFamily: "Cairo", textAlign: 'right' }}>{getStudentType(student.studentType)}</TableCell>
            </TableRow>
            <TableRow>
                <TableCell sx={{ fontFamily: "Cairo", fontWeight: 'bold', textAlign: "start" }} align="right">
                    <Public sx={{ marginInlineEnd: 1, color: primaryColor }} /> 
                    الجنسية
                </TableCell>
                <TableCell align="right" sx={{ fontFamily: "Cairo", textAlign: 'right' }}>{getStudentNational(student.studentNational)}</TableCell>
            </TableRow>
            {studyInfo.length > 0 && (
                <TableRow>
                    <TableCell sx={{ fontFamily: "Cairo", fontWeight: 'bold', textAlign: "start" }} align="right">
                        <School sx={{ marginInlineEnd: 1, color: primaryColor }} /> 
                        الفرع
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: "Cairo", textAlign: 'right' }}>{studyInfo[0].branch}</TableCell>
                </TableRow>
            )}
        </TableBody>
    </Table>
</TableContainer>
                                            </CardContent>
                                        </Card>

                                        <Box sx={uiLayout.actionBarSx} mt={3} display="flex" gap={2} flexWrap="wrap">
                                            <Button
                                                variant="contained"
                                                sx={uiLayout.withUiSx({
                                                    backgroundColor: primaryColor,
                                                    color: 'white',
                                                    fontFamily: "Cairo",
                                                    borderRadius: 2,
                                                    '&:hover': {
                                                        backgroundColor: primaryDark
                                                    }
                                                }, uiLayout.buttonSx)}
                                                onClick={() => setOpenCallForm(true)}
                                                startIcon={<AddIcCall />}
                                            >
                                                اتصال جديد
                                            </Button>

                                            <Button
                                                variant="contained"
                                                sx={uiLayout.withUiSx({
                                                    backgroundColor: primaryColor,
                                                    color: 'white',
                                                    fontFamily: "Cairo",
                                                    borderRadius: 2,
                                                    '&:hover': {
                                                        backgroundColor: primaryDark
                                                    }
                                                }, uiLayout.buttonSx)}
                                                onClick={fetchStudyInfo}
                                                startIcon={<School />}
                                            >
                                                الملف التدريبي
                                            </Button>

                                            <Button
                                                variant="contained"
                                                sx={uiLayout.withUiSx({ 
                                                    backgroundColor: primaryColor, 
                                                    color: 'white', 
                                                    fontFamily: "Cairo", 
                                                    borderRadius: 2,
                                                    '&:hover': {
                                                        backgroundColor: primaryDark
                                                    }
                                                }, uiLayout.buttonSx)}
                                                onClick={() => setOpenStatementDialog(true)}
                                                startIcon={<ReceiptLong />}
                                            >
                                                كشف الحساب
                                            </Button>

                                            {followUpCalls.length > 0 && (
                                                <Button
                                                    onClick={() => setOpenFollowUpDialog(true)}
                                                    variant="contained"
                                                    sx={uiLayout.withUiSx({
                                                        backgroundColor: '#e74c3c',
                                                        color: 'white',
                                                        fontFamily: "Cairo",
                                                        borderRadius: 2,
                                                        boxShadow: '0 0 10px #ff1744, 0 0 20px #ff1744',
                                                        animation: 'glow 1s infinite alternate',
                                                        '&:hover': {
                                                            backgroundColor: '#c0392b',
                                                        }
                                                    }, uiLayout.buttonSx)}
                                                >
                                                    <>
                                                        <NotificationsIcon />
                                                    </>
                                                    <span style={{ marginRight: 8, fontWeight: 'bold', fontFamily: "Cairo" }}>متابعة لاحقًا</span>
                                                </Button>
                                            )}
                                        </Box>

                                        <StudentStatementDialog open={openStatementDialog} onClose={() => setOpenStatementDialog(false)} accountGuid={student?.accountGuid} />

                                        {/* عرض تفاصيل المكالمات */}
                                        <Card sx={{ 
                                            mt: 4, 
                                            borderRadius: 2, 
                                            boxShadow: '0 2px 8px rgba(128, 180, 158, 0.1)',
                                            border: `1px solid ${primaryLight}`,
                                            backgroundColor: surfaceColor
                                        }}>
                                            <CardContent>
                                                <Typography variant="h6" sx={{ 
                                                    fontWeight: 'bold', 
                                                    color: primaryDark, 
                                                    mb: 2, 
                                                    fontFamily: 'Cairo' 
                                                }}>
                                                    📞 سجل المكالمات
                                                </Typography>

                                                {allCalls.filter(call => call.accountGuid === student.accountGuid).length === 0 ? (
                                                    <Typography align="center" sx={{ 
                                                        fontFamily: 'Cairo', 
                                                        color: textSecondary, 
                                                        py: 3 
                                                    }}>
                                                        لا توجد مكالمات مسجلة لهذا الطالب
                                                    </Typography>
                                                ) : (
                                                    <TableContainer component={Paper} sx={uiLayout.withUiSx({ 
                                                        borderRadius: 2, 
                                                        overflow: 'hidden',
                                                        border: `1px solid ${primaryLight}`
                                                    }, uiLayout.tableContainerSx)}>
                                                        <Table>
                                                            <TableHead sx={{ backgroundColor: '#f0f7f4' }}>
                                                                <TableRow>
                                                                    <TableCell sx={{ fontFamily: "Cairo", fontWeight: 'bold', color: primaryDark }} align="center">نوع المكالمة</TableCell>
                                                                    <TableCell sx={{ fontFamily: "Cairo", fontWeight: 'bold', color: primaryDark }} align="center">التاريخ</TableCell>
                                                                    <TableCell sx={{ fontFamily: "Cairo", fontWeight: 'bold', color: primaryDark }} align="center">الوقت</TableCell>
                                                                    <TableCell sx={{ fontFamily: "Cairo", fontWeight: 'bold', color: primaryDark }} align="center">الحالة</TableCell>
                                                                    <TableCell sx={{ fontFamily: "Cairo", fontWeight: 'bold', color: primaryDark }} align="center">تم التمرير إلى</TableCell>
                                                                    <TableCell sx={{ fontFamily: "Cairo", fontWeight: 'bold', color: primaryDark }} align="center">ملاحظات</TableCell>
                                                                </TableRow>
                                                            </TableHead>
                                                            <TableBody>
                                                                {allCalls
                                                                    .filter(call => call.accountGuid === student.accountGuid)
                                                                    .map((call, index) => (
                                                                        <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                                            <TableCell align="center" sx={{ fontFamily: "Cairo" }}>
                                                                                <Chip
                                                                                    label={getCallTypeText(call.callType)}
                                                                                    sx={{
                                                                                        backgroundColor: 
                                                                                            call.callType === 0 ? `${primaryColor}20` :
                                                                                            call.callType === 1 ? `${primaryDark}20` : '#ffeaea',
                                                                                        color:
                                                                                            call.callType === 0 ? primaryColor :
                                                                                            call.callType === 1 ? primaryDark : '#e74c3c'
                                                                                    }}
                                                                                    size="small"
                                                                                />
                                                                            </TableCell>
                                                                            <TableCell align="center" sx={{ fontFamily: "Cairo" }}>
                                                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                                    <CalendarToday sx={{ fontSize: 16, marginInlineEnd: 0.5, color: primaryColor }} />
                                                                                    {call.callDate?.split('T')[0]}
                                                                                </Box>
                                                                            </TableCell>
                                                                            <TableCell align="center" sx={{ fontFamily: "Cairo" }}>
                                                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                                    <Schedule sx={{ fontSize: 16, marginInlineEnd: 0.5, color: primaryColor }} />
                                                                                    {new Date(call.callTime).toLocaleTimeString('ar-EG')}
                                                                                </Box>
                                                                            </TableCell>
                                                                            <TableCell align="center" sx={{ fontFamily: "Cairo" }}>
                                                                                <Chip
                                                                                    label={getCallStatusText(call.callStatus)}
                                                                                    sx={{
                                                                                        backgroundColor: call.callStatus === 0 ? '#e8f5e9' : '#fff3e0',
                                                                                        color: call.callStatus === 0 ? '#2e7d32' : '#e65100'
                                                                                    }}
                                                                                    size="small"
                                                                                />
                                                                            </TableCell>
                                                                            <TableCell align="center" sx={{ fontFamily: "Cairo" }}>
                                                                                {call.forwardCall ? (
                                                                                    <Chip
                                                                                        label={getForwardedToName(call.forwardTo, call.supervisorGuid)}
                                                                                        sx={{
                                                                                            backgroundColor: `${primaryLight}20`,
                                                                                            color: primaryDark
                                                                                        }}
                                                                                        size="small"
                                                                                    />
                                                                                ) : (
                                                                                    <Chip
                                                                                        label="غير ممررة"
                                                                                        variant="outlined"
                                                                                        size="small"
                                                                                        sx={{
                                                                                            borderColor: primaryLight,
                                                                                            color: textSecondary
                                                                                        }}
                                                                                    />
                                                                                )}
                                                                            </TableCell>
                                                                            <TableCell align="center" sx={{ fontFamily: "Cairo", maxWidth: 200 }}>
                                                                                <Typography noWrap title={call.notes || 'لا توجد ملاحظات'}>
                                                                                    {call.notes || '---'}
                                                                                </Typography>
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                            </TableBody>
                                                        </Table>
                                                    </TableContainer>
                                                )}
                                            </CardContent>
                                        </Card>

                                        <Box mt={6}>
                                          <Button
                                            onClick={() => setShowCallHistory(!showCallHistory)}
                                            variant="outlined"
                                            sx={uiLayout.withUiSx({
                                                color: primaryColor,
                                                borderColor: primaryColor,
                                                fontFamily: 'Cairo, sans-serif',
                                                fontWeight: 'bold', 
                                                fontSize: '18px',
                                                borderRadius: '12px',
                                                borderWidth: '2px',
                                                '&:hover': {
                                                    borderColor: primaryDark,
                                                    color: primaryDark,
                                                    backgroundColor: `${primaryLight}20`
                                                }
                                            }, uiLayout.buttonSx)}
                                            endIcon={
                                              <span style={{
                                                display: 'inline-block',
                                                transform: showCallHistory ? 'rotate(90deg)' : 'rotate(0deg)',
                                                transition: 'transform 0.3s ease',
                                                margin: "5px"
                                              }}>
                                                ➤
                                              </span>
                                            }
                                          >
                                            {showCallHistory ? 'إخفاء سجل الاتصالات' : 'عرض سجل الاتصالات'}
                                          </Button>

                                          <Grow in={showCallHistory}>
                                            <Box mt={3}>
                                              <Typography variant="h5" style={{ 
                                                  fontWeight: 'bold', 
                                                  color: primaryDark, 
                                                  marginBottom: '15px',
                                                  fontFamily:"cairo"
                                                }}>
                                                📞 سجل الاتصالات
                                              </Typography>
                                                <CallHistory 
                                                  accountGuid={student.accountGuid} 
                                                  newCall={newCall} 
                                                  user={user}
                                                  supervisors={supervisors}
                                                  salesUsers={salesUsers}
                                                />          
                                            </Box>
                                          </Grow>
                                        </Box>
                                    </>
                                )}
                            </Box>
                        </Grow>
                    </CardContent>
                </Card>

                {/* Dialog for adding new call */}
                <Dialog sx={uiLayout.dialogLayoutSx}
                    open={openCallForm}
                    onClose={() => setOpenCallForm(false)}
                    fullWidth
                    maxWidth="sm"
                    PaperProps={{ 
                        sx: { 
                            borderRadius: 3,
                            background: `linear-gradient(135deg, ${surfaceColor} 0%, #f0f7f4 100%)`,
                            border: `1px solid ${primaryLight}`
                        } 
                    }}
                >
                    <DialogTitle sx={{ 
                        textAlign: 'center', 
                        fontWeight: 'bold', 
                        color: primaryDark, 
                        fontFamily: "Cairo", 
                        bgcolor: '#f8fbfa',
                        borderBottom: `1px solid ${primaryLight}`
                    }}>
                        📞 إضافة اتصال جديد
                    </DialogTitle>
                    <DialogContent sx={{ direction: 'rtl', pt: 3 }}>
                        <FormControl sx={uiLayout.formFieldSx} fullWidth margin="normal" error={!!errors.callType}>
                            <InputLabel id="call-type-label" style={{ fontFamily: "Cairo", color: primaryDark }}>نوع الاتصال</InputLabel>
                            <Select
                                labelId="call-type-label"
                                id="call-type"
                                label="نوع الاتصال"
                                value={callForm.callType}
                                onChange={(e) => setCallForm({ ...callForm, callType: e.target.value })}
                                sx={{
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: primaryLight,
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: primaryColor,
                                    }
                                }}
                            >
                                <MenuItem value="general" style={{ fontFamily: "Cairo" }}>استفسار عام</MenuItem>
                                <MenuItem value="study" style={{ fontFamily: "Cairo" }}>استفسار دراسي</MenuItem>
                                <MenuItem value="complain" style={{ fontFamily: "Cairo" }}>شكوى</MenuItem>
                            </Select>
                            {errors.callType && <FormHelperText>{errors.callType}</FormHelperText>}
                        </FormControl>

                        {callForm.callType === 'study' && (
                            <>
                                <FormControl sx={uiLayout.formFieldSx} fullWidth margin="normal">
                                    <InputLabel id="program-inquiry-label" style={{ fontFamily: "Cairo", color: primaryDark }}>البرنامج</InputLabel>
                                    <Select
                                        labelId="program-inquiry-label"
                                        id="program-inquiry"
                                        label="البرنامج"
                                        value={callForm.programInquiry}
                                        onChange={(e) => setCallForm({ ...callForm, programInquiry: e.target.value })}
                                        sx={{
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: primaryLight,
                                            },
                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                borderColor: primaryColor,
                                            }
                                        }}
                                    >
                                        {["دبلوم الإدارة المكتبية", "دبلوم الموارد البشرية", "دبلوم إدارة الأعمال", "دبلوم القانون", "دبلوم المستشفيات", "دبلوم الأمن السيبراني", "دبلوم مشارك مكتبي", "دبلوم إدارة السلامة", "دبلوم المحاسبة", "دورة الحاسب الآلي 3 شهور", "دورة الحاسب الآلي 6 شهور", "دورة الإدارة المكتبية 3 شهور", "دورة الإدارة المكتبية 6 شهور", "دورات تطويرية", "آخري"].map((label, i) => (
                                            <MenuItem style={{ fontFamily: "Cairo" }} key={i + 1} value={i + 1}>{label}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl sx={uiLayout.formFieldSx} fullWidth margin="normal">
                                    <InputLabel id="study-topic-label" style={{ fontFamily: "Cairo", color: primaryDark }}>موضوع الاستفسار</InputLabel>
                                    <Select
                                        labelId="study-topic-label"
                                        id="study-topic"
                                        label="موضوع الاستفسار"
                                        value={callForm.studyInquiryTopic}
                                        onChange={(e) => setCallForm({ ...callForm, studyInquiryTopic: e.target.value })}
                                        sx={{
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: primaryLight,
                                            },
                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                borderColor: primaryColor,
                                            }
                                        }}
                                    >
                                        {["الرسوم الدراسية", "التسجيل", "الاختبارات", "شهادة التخرج", "جدول الدراسة", "التجسير", "آخري"].map((label, i) => (
                                            <MenuItem style={{ fontFamily: "Cairo" }} key={i + 1} value={i + 1}>{label}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </>
                        )}

                        {callForm.callType === 'complain' && (
                            <>
                                <FormControl sx={uiLayout.formFieldSx} fullWidth margin="normal">
                                    <InputLabel id="complain-source-label" style={{ fontFamily: "Cairo", color: primaryDark }}>شكوى من</InputLabel>
                                    <Select
                                        labelId="complain-source-label"
                                        id="complain-source"
                                        label="شكوى من"
                                        value={callForm.complainSource}
                                        onChange={(e) => setCallForm({ ...callForm, complainSource: e.target.value })}
                                        sx={{
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: primaryLight,
                                            },
                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                borderColor: primaryColor,
                                            }
                                        }}
                                    >
                                        {["موظف إداري", "مدرب", "مشرف فرع", "مسوق", "آخري"].map((label, i) => (
                                            <MenuItem style={{ fontFamily: "Cairo" }} key={i} value={label}>{label}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <TextField InputLabelProps={{ shrink: true }}
                                    label="تفاصيل الشكوى"
                                    fullWidth
                                    multiline
                                    rows={3}
                                    margin="normal"
                                    style={{ fontFamily: "Cairo" }}
                                    value={callForm.complainDetails}
                                    onChange={(e) => setCallForm({ ...callForm, complainDetails: e.target.value })}
                                    sx={uiLayout.withUiSx({
                                        '& .MuiOutlinedInput-root': {
                                            '& fieldset': {
                                                borderColor: primaryLight,
                                            },
                                            '&:hover fieldset': {
                                                borderColor: primaryColor,
                                            }
                                        }
                                    }, uiLayout.formFieldSx)}
                                />
                            </>
                        )}

                        <FormControl sx={uiLayout.formFieldSx} fullWidth margin="normal" error={!!errors.callStatus}>
                            <InputLabel id="call-status-label" style={{ fontFamily: "Cairo", color: primaryDark }}>حالة الاتصال</InputLabel>
                            <Select
                                labelId="call-status-label"
                                id="call-status"
                                label="حالة الاتصال"
                                value={callForm.callStatus}
                                onChange={(e) => setCallForm({ ...callForm, callStatus: e.target.value })}
                                sx={{
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: primaryLight,
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: primaryColor,
                                    }
                                }}
                            >
                                {(userJob !== 18 || userJob === 9) && (
                                    <MenuItem value="0" style={{ fontFamily: "Cairo" }}>مكتملة</MenuItem>
                                )}
                                <MenuItem value="1" style={{ fontFamily: "Cairo" }}>متابعة لاحقًا</MenuItem>
                            </Select>
                            {errors.callStatus && <FormHelperText>{errors.callStatus}</FormHelperText>}
                        </FormControl>

                        <FormControl sx={uiLayout.formFieldSx} fullWidth margin="normal">
                            <InputLabel id="forward-call-label" style={{ fontFamily: "Cairo", color: primaryDark }}>هل تريد تمرير الاتصال؟</InputLabel>
                            <Select
                                labelId="forward-call-label"
                                id="forward-call"
                                label="هل تريد تمرير الاتصال؟"
                                value={callForm.forwardCall || ''}
                                onChange={(e) => setCallForm({ ...callForm, forwardCall: e.target.value })}
                                sx={{
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: primaryLight,
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: primaryColor,
                                    }
                                }}
                            >
                                <MenuItem value="no" style={{ fontFamily: "Cairo" }}>لا</MenuItem>
                                <MenuItem value="yes" style={{ fontFamily: "Cairo" }}>نعم</MenuItem>
                            </Select>
                        </FormControl>

                        {callForm.forwardCall === "yes" && (
                            <>
                                <FormControl sx={uiLayout.formFieldSx} fullWidth margin="normal">
                                    <InputLabel id="forward-to-label" style={{ fontFamily: "Cairo", color: primaryDark }}>تمرير إلى</InputLabel>
                                    <Select
                                        labelId="forward-to-label"
                                        id="forward-to"
                                        label="تمرير إلى"
                                        value={callForm.forwardTo || ''}
                                        onChange={(e) => setCallForm({ ...callForm, forwardTo: e.target.value })}
                                        sx={{
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: primaryLight,
                                            },
                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                borderColor: primaryColor,
                                            }
                                        }}
                                    >
                                        <MenuItem value="supervisor" style={{ fontFamily: "Cairo" }}>مشرف فرع</MenuItem>
                                        <MenuItem value="sales" style={{ fontFamily: "Cairo" }}>مبيعات</MenuItem>
                                    </Select>
                                </FormControl>

                                {callForm.forwardTo === "supervisor" && (
                                    <FormControl sx={uiLayout.formFieldSx} fullWidth margin="normal">
                                        <InputLabel id="supervisor-label" style={{ fontFamily: "Cairo", color: primaryDark }}>اختر المشرف</InputLabel>
                                        <Select
                                            labelId="supervisor-label"
                                            id="supervisor"
                                            label="اختر المشرف"
                                            value={callForm.selectedSupervisor || ''}
                                            onChange={(e) => setCallForm({ ...callForm, selectedSupervisor: e.target.value })}
                                            required
                                            sx={{
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: primaryLight,
                                                },
                                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: primaryColor,
                                                }
                                            }}
                                        >
                                            <MenuItem value="" disabled style={{ fontFamily: "Cairo" }}>اختر مشرفًا</MenuItem>
                                            {supervisors.map((sup) => (
                                                <MenuItem key={sup.guid} value={sup.guid} style={{ fontFamily: "Cairo", marginBottom: "15px" }}>
                                                    {sup.fullName} – {sup.branchName}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                )}

                                {callForm.forwardTo === "sales" && (
                                    <FormControl sx={uiLayout.formFieldSx} fullWidth margin="normal">
                                        <InputLabel id="sales-label" style={{ fontFamily: "Cairo", color: primaryDark }}>اختر موظف المبيعات</InputLabel>
                                        <Select
                                            labelId="sales-label"
                                            id="sales"
                                            label="اختر موظف المبيعات"
                                            value={callForm.selectedSales || ''}
                                            onChange={(e) => setCallForm({ ...callForm, selectedSales: e.target.value })}
                                            required
                                            sx={{
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: primaryLight,
                                                },
                                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: primaryColor,
                                                }
                                            }}
                                        >
                                            <MenuItem value="" disabled style={{ fontFamily: "Cairo" }}>اختر موظفًا</MenuItem>
                                            {salesUsers.map((sales) => (
                                                <MenuItem key={sales.guid} value={sales.guid} style={{ fontFamily: "Cairo" }}>
                                                    {sales.fullName}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                )}
                            </>
                        )}

                        <TextField InputLabelProps={{ shrink: true }}
                            label="ملاحظات إضافية"
                            fullWidth
                            margin="normal"
                            multiline
                            rows={3}
                            style={{ fontFamily: "Cairo" }}
                            value={callForm.notes}
                            onChange={(e) => setCallForm({ ...callForm, notes: e.target.value })}
                            sx={uiLayout.withUiSx({
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': {
                                        borderColor: primaryLight,
                                    },
                                    '&:hover fieldset': {
                                        borderColor: primaryColor,
                                    }
                                }
                            }, uiLayout.formFieldSx)}
                        />
                    </DialogContent>
                    <DialogActions sx={uiLayout.withUiSx({ p: 3, borderTop: `1px solid ${primaryLight}` }, uiLayout.dialogActionsSx)}>
                        <Button
                            onClick={() => setOpenCallForm(false)}
                            sx={uiLayout.withUiSx({ 
                                fontFamily: "Cairo", 
                                borderRadius: 2,
                                color: primaryColor,
                                borderColor: primaryColor,
                                '&:hover': {
                                    borderColor: primaryDark,
                                    color: primaryDark,
                                    backgroundColor: `${primaryLight}20`
                                }
                            }, uiLayout.buttonSx)}
                            variant="outlined"
                        >
                            إلغاء
                        </Button>
                        <Button
                            onClick={submitCallForm}
                            variant="contained"
                            sx={uiLayout.withUiSx({ 
                                fontFamily: "Cairo", 
                                borderRadius: 2,
                                backgroundColor: primaryColor,
                                '&:hover': {
                                    backgroundColor: primaryDark
                                }
                            }, uiLayout.buttonSx)}
                        >
                            إرسال
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Dialog for follow-up calls */}
                <Dialog sx={uiLayout.dialogLayoutSx} open={openFollowUpDialog} onClose={() => setOpenFollowUpDialog(false)} fullWidth maxWidth="md" PaperProps={{ 
                    sx: { 
                        borderRadius: 3,
                        background: `linear-gradient(135deg, ${surfaceColor} 0%, #f0f7f4 100%)`,
                        border: `1px solid ${primaryLight}`
                    } 
                }}>
                    <DialogTitle sx={{ 
                        fontWeight: 'bold', 
                        color: primaryDark, 
                        textAlign: 'center', 
                        fontFamily: 'Cairo',
                        borderBottom: `1px solid ${primaryLight}`
                    }}>
                        🕒 مكالمات المتابعة لاحقًا
                    </DialogTitle>
                    <DialogContent>
                        {followUpCalls.length === 0 ? (
                            <Typography style={{ fontFamily: "Cairo, sans-serif" }} align="center" mt={2}>لا توجد مكالمات متابعة لاحقًا.</Typography>
                        ) : (
                            <TableContainer component={Paper} sx={uiLayout.withUiSx({ mt: 2, borderRadius: 2, border: `1px solid ${primaryLight}` }, uiLayout.tableContainerSx)}>
                                <Table>
                                    <TableHead sx={{ backgroundColor: '#f0f7f4' }}>
                                        <TableRow>
                                            <TableCell style={{ fontFamily: "Cairo, sans-serif", fontWeight: 'bold', color: primaryDark }} align="center">التاريخ</TableCell>
                                            <TableCell style={{ fontFamily: "Cairo, sans-serif", fontWeight: 'bold', color: primaryDark }} align="center">الوقت</TableCell>
                                            <TableCell style={{ fontFamily: "Cairo, sans-serif", fontWeight: 'bold', color: primaryDark }} align="center">ملاحظات</TableCell>
                                            <TableCell style={{ fontFamily: "Cairo, sans-serif", fontWeight: 'bold', color: primaryDark }} align="center">المستخدم</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {followUpCalls.map((call, index) => (
                                            <TableRow key={index}>
                                                <TableCell style={{ fontFamily: "Cairo, sans-serif" }} align="center">{call.callDate?.split('T')[0]}</TableCell>
                                                <TableCell style={{ fontFamily: "Cairo, sans-serif" }} align="center">{new Date(call.callTime).toLocaleTimeString('ar-EG')}</TableCell>
                                                <TableCell style={{ fontFamily: "Cairo, sans-serif" }} align="center">{call.notes || '-'}</TableCell>
                                                <TableCell style={{ fontFamily: "Cairo, sans-serif" }} align="center">{call.userFullName}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Dialog for study info */}
                <Dialog sx={uiLayout.dialogLayoutSx} open={openStudyDialog} onClose={() => setOpenStudyDialog(false)} fullWidth maxWidth="md" PaperProps={{ 
                    sx: { 
                        borderRadius: 3,
                        background: `linear-gradient(135deg, ${surfaceColor} 0%, #f0f7f4 100%)`,
                        border: `1px solid ${primaryLight}`
                    } 
                }}>
                    <DialogTitle style={{ 
                        textAlign: 'center', 
                        fontWeight: 'bold', 
                        color: primaryDark, 
                        fontFamily: "cairo",
                        borderBottom: `1px solid ${primaryLight}`
                    }}>
                        📚 الملف التدريبي
                    </DialogTitle>

                    <DialogContent style={{ direction: 'rtl' }}>
                        {studyInfo.length === 0 ? (
                            <Typography align="center" mt={2}>لا توجد بيانات متاحة.</Typography>
                        ) : (
                            <TableContainer sx={uiLayout.tableContainerSx} component={Paper} style={{ marginTop: 10, borderRadius: 2, border: `1px solid ${primaryLight}` }}>
                                <Table>
                                    <TableBody>
                                        {studyInfo.map((item, index) => (
                                            <React.Fragment key={index}>
                                                <TableRow><TableCell style={{ fontFamily: "Cairo, sans-serif", fontWeight: 'bold', color: primaryDark }} align="right">الفرع</TableCell><TableCell align="right">{item.branch}</TableCell></TableRow>
                                                <TableRow><TableCell style={{ fontFamily: "Cairo, sans-serif", fontWeight: 'bold', color: primaryDark }} align="right">البرنامج</TableCell><TableCell align="right">{item.diplom}</TableCell></TableRow>
                                                <TableRow><TableCell style={{ fontFamily: "Cairo, sans-serif", fontWeight: 'bold', color: primaryDark }} align="right">الدفعة</TableCell><TableCell align="right">{item.batch}</TableCell></TableRow>
                                                <TableRow><TableCell style={{ fontFamily: "Cairo, sans-serif", fontWeight: 'bold', color: primaryDark }} align="right">المستوى</TableCell><TableCell align="right">{item.level}</TableCell></TableRow>
                                                <TableRow><TableCell style={{ fontFamily: "Cairo, sans-serif", fontWeight: 'bold', color: primaryDark }} align="right">تاريخ البداية</TableCell><TableCell align="left">{item.dateStart || '---'}</TableCell></TableRow>
                                                <TableRow><TableCell style={{ fontFamily: "Cairo, sans-serif", fontWeight: 'bold', color: primaryDark }} align="right">تاريخ النهاية</TableCell><TableCell align="left">{item.dateEnd || '---'}</TableCell></TableRow>
                                                <TableRow><TableCell style={{ fontFamily: "Cairo, sans-serif", fontWeight: 'bold', color: primaryDark }} align="right">الحالة</TableCell><TableCell align="right">{item.status}</TableCell></TableRow>
                                                <TableRow><TableCell style={{ fontFamily: "Cairo, sans-serif", fontWeight: 'bold', color: primaryDark }} align="right">ملاحظات</TableCell><TableCell align="right">{item.notes}</TableCell></TableRow>
                                            </React.Fragment>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </DialogContent>

                    <DialogActions sx={uiLayout.withUiSx({ borderTop: `1px solid ${primaryLight}` }, uiLayout.dialogActionsSx)}>
                        <Button onClick={() => setOpenStudyDialog(false)} sx={uiLayout.withUiSx({ color: primaryColor }, uiLayout.buttonSx)}>إغلاق</Button>
                    </DialogActions>
                </Dialog>

                <MyCallHistoryDialog open={openMyCalls} onClose={() => setOpenMyCalls(false)} userGuid={user.guid} />
                <FollowUpCallsDialog
                    open={openFollowUpDialogOnlyForSales}
                    onClose={() => setOpenFollowUpDialogOnlyForSales(false)}
                    calls={followUpCallsForSales}
                />

                {/* WhatsApp Dialog */}
                <Dialog sx={uiLayout.dialogLayoutSx}
                    open={openWhatsAppDialog}
                    onClose={() => {
                        setOpenWhatsAppDialog(false);
                        setWhatsappData({ name: '', phone: '', notes: '', sentToStudent: false, sentToHR: false });
                    }}
                    fullWidth
                    maxWidth="sm"
                    PaperProps={{ 
                        sx: { 
                            borderRadius: 3,
                            background: `linear-gradient(135deg, ${surfaceColor} 0%, #f0f7f4 100%)`,
                            border: `1px solid ${primaryLight}`
                        } 
                    }}
                >
                    <DialogTitle sx={{ 
                        textAlign: 'center', 
                        fontWeight: 'bold', 
                        color: '#25D366', 
                        fontFamily: "Cairo", 
                        bgcolor: '#f8fbfa',
                        borderBottom: `1px solid ${primaryLight}`
                    }}>
                        إرسال تفاصيل عبر واتساب
                    </DialogTitle>
                    <DialogContent sx={{ direction: 'rtl', pt: 3 }}>
                        <TextField InputLabelProps={{ shrink: true }}
                            label="الاسم"
                            fullWidth
                            margin="normal"
                            style={{ fontFamily: "Cairo" }}
                            value={whatsappData.name}
                            onChange={(e) => setWhatsappData({ ...whatsappData, name: e.target.value })}
                            required
                            sx={uiLayout.withUiSx({
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': {
                                        borderColor: primaryLight,
                                    },
                                    '&:hover fieldset': {
                                        borderColor: primaryColor,
                                    }
                                }
                            }, uiLayout.formFieldSx)}
                        />
                        <TextField InputLabelProps={{ shrink: true }}
                            label="رقم الجوال"
                            fullWidth
                            margin="normal"
                            style={{ fontFamily: "Cairo" }}
                            value={whatsappData.phone}
                            onChange={(e) => setWhatsappData({ ...whatsappData, phone: e.target.value })}
                            helperText="يجب أن يبدأ بـ 05 ويتكون من 10 أرقام"
                            required
                            sx={uiLayout.withUiSx({
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': {
                                        borderColor: primaryLight,
                                    },
                                    '&:hover fieldset': {
                                        borderColor: primaryColor,
                                    }
                                }
                            }, uiLayout.formFieldSx)}
                         inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
                        <TextField InputLabelProps={{ shrink: true }}
                            label="ملاحظات"
                            fullWidth
                            multiline
                            rows={3}
                            margin="normal"
                            style={{ fontFamily: "Cairo" }}
                            value={whatsappData.notes}
                            onChange={(e) => setWhatsappData({ ...whatsappData, notes: e.target.value })}
                            sx={uiLayout.withUiSx({
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': {
                                        borderColor: primaryLight,
                                    },
                                    '&:hover fieldset': {
                                        borderColor: primaryColor,
                                    }
                                }
                            }, uiLayout.formFieldSx)}
                        />

                        {/* إضافة حالة لإظهار أي الرسائل تم إرسالها */}
                        {whatsappData.sentToStudent && (
                            <Alert severity="success" style={{ marginTop: 10, fontFamily: "Cairo" }}>
                                تم إرسال رسالة إلى الطالب بنجاح
                            </Alert>
                        )}
                        {whatsappData.sentToHR && (
                            <Alert severity="success" style={{ marginTop: 10, fontFamily: "Cairo" }}>
                                تم إرسال التفاصيل إلى الموارد البشرية بنجاح
                            </Alert>
                        )}
                    </DialogContent>
                    <DialogActions sx={uiLayout.dialogActionsSx} style={{ justifyContent: 'space-between', p: 3, borderTop: `1px solid ${primaryLight}` }}>
                        <div>
                            <Button sx={uiLayout.buttonSx}
                                style={{
                                    fontFamily: "Cairo",
                                    backgroundColor: whatsappData.sentToStudent ? '#4caf50' : '#25D366',
                                    color: 'white',
                                    marginLeft: '8px',
                                    borderRadius: '8px'
                                }}
                                onClick={() => {
                                    if (!whatsappData.name || !whatsappData.phone) {
                                        Swal.fire({
                                            icon: 'error',
                                            title: 'خطأ',
                                            text: 'الاسم ورقم الجوال مطلوبان',
                                            confirmButtonColor: '#d33',
                                        });
                                        return;
                                    }

                                    if (!/^05\d{8}$/.test(whatsappData.phone)) {
                                        Swal.fire({
                                            icon: 'error',
                                            title: 'رقم غير صحيح',
                                            text: 'يجب أن يبدأ رقم الجوال بـ 05 ويتكون من 10 أرقام',
                                            confirmButtonColor: '#d33',
                                        });
                                        return;
                                    }

                                    // Message to student
                                    const studentMessage = `السيد/ة ${whatsappData.name}،

نشكركم على تواصلكم معنا بخصوص الفرص الوظيفية. 
برجاء إرسال السيرة الذاتية على البريد الإلكتروني:
hr@administration.sstli.com

مع تمنياتنا لكم بالتوفيق`;

                                    const encodedStudentMessage = encodeURIComponent(studentMessage);
                                    window.open(`https://wa.me/966${whatsappData.phone.slice(1)}?text=${encodedStudentMessage}`, '_blank');

                                    setWhatsappData({ ...whatsappData, sentToStudent: true });

                                    Swal.fire({
                                        icon: 'success',
                                        title: 'تم إرسال الرسالة للطالب',
                                        text: 'سيتم فتح واتساب لإرسال الرسالة',
                                        confirmButtonColor: '#25D366',
                                    });
                                }}
                                variant="contained"
                                disabled={whatsappData.sentToStudent}
                            >
                                {whatsappData.sentToStudent ? 'تم الإرسال للطالب' : 'إرسال للطالب'}
                            </Button>

                            <Button sx={uiLayout.buttonSx}
                                style={{
                                    fontFamily: "Cairo",
                                    backgroundColor: whatsappData.sentToHR ? '#4caf50' : primaryColor,
                                    color: 'white',
                                    borderRadius: '8px'
                                }}
                                onClick={() => {
                                    if (!whatsappData.name || !whatsappData.phone) {
                                        Swal.fire({
                                            icon: 'error',
                                            title: 'خطأ',
                                            text: 'الاسم ورقم الجوال مطلوبان',
                                            confirmButtonColor: '#d33',
                                        });
                                        return;
                                    }

                                    // Message to HR team (0543502504)
                                    const hrMessage = `📋 *طلب توظيف جديد* 📋
          
👤 *المتقدم:*
   - الاسم: ${whatsappData.name}
   - رقم الجوال: ${whatsappData.phone}
   
📝 *ملاحظات:*
   ${whatsappData.notes || 'لا يوجد ملاحظات'}

👨‍💼 *مسجل بواسطة:*
   ${user.fullName} - خدمة العملاء`;

                                    const encodedHrMessage = encodeURIComponent(hrMessage);
                                    window.open(`https://wa.me/966543502504?text=${encodedHrMessage}`, '_blank');

                                    setWhatsappData({ ...whatsappData, sentToHR: true });

                                    Swal.fire({
                                        icon: 'success',
                                        title: 'تم إرسال التفاصيل للموارد البشرية',
                                        text: 'سيتم فتح واتساب لإرسال الرسالة',
                                        confirmButtonColor: primaryColor,
                                    });
                                }}
                                variant="contained"
                                disabled={whatsappData.sentToHR}
                            >
                                {whatsappData.sentToHR ? 'تم الإرسال للموارد البشرية' : 'إرسال للموارد البشرية'}
                            </Button>
                        </div>

                        <Button sx={uiLayout.buttonSx}
                            style={{ 
                                fontFamily: "Cairo",
                                color: primaryColor,
                                borderRadius: '8px'
                            }}
                            onClick={() => {
                                setOpenWhatsAppDialog(false);
                                setWhatsappData({ name: '', phone: '', notes: '', sentToStudent: false, sentToHR: false });
                            }}
                            variant="outlined"
                        >
                            إغلاق
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        </div></NavigationShell>
    );
}