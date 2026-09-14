import React, { useEffect, useState } from 'react';
import IconButton from '@mui/material/IconButton';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TablePagination from '@mui/material/TablePagination';
import { 
  FormHelperText,
  // بقية المكونات المستوردة...
} from '@mui/material';
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, CircularProgress,
  Typography, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem,
  Select, InputLabel, FormControl, Collapse, Box
} from '@mui/material';
import axios from 'axios';

export default function CallHistory({ accountGuid, newCall, user, supervisors, salesUsers }){
  const [errors, setErrors] = useState({
  type: '',
  status: ''
});
  const [calls, setCalls] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openFollowForm, setOpenFollowForm] = useState(false);
  const [selectedCall, setSelectedCall] = useState(null);
  const [followUpNote, setFollowUpNote] = useState('');
  const [followUpStatus, setFollowUpStatus] = useState('');
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [dialogCall, setDialogCall] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCall, setEditingCall] = useState(null);
const [allUsers, setAllUsers] = useState([]);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [searchText, setSearchText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

useEffect(() => {
  if (!accountGuid) return;
  const fetchData = async () => {
    setLoading(true);
    try {
      const [callsRes, followUpsRes, usersRes] = await Promise.all([
        axios.get(`https://api1.sstli.com/api/calls/${accountGuid}`),
        axios.get('https://api1.sstli.com/api/followcall'),
        axios.get('https://api1.sstli.com/api/userinfo')
      ]);
      
      // Enhance users with branch information for supervisors
      const enhancedUsers = await Promise.all(
        usersRes.data.map(async (user) => {
          if (user.userJop === 9) { // Only for supervisors
            try {
              const branchRes = await axios.get(`https://api3.sstli.com/api/Trainer/UserBranchForWork`, {
                params: { userGuid: user.guid }
              });
              return {
                ...user,
                branchName: branchRes.data[0]?.brEName || "فرع غير معروف"
              };
            } catch (err) {
              console.error(`Failed to fetch branch for supervisor ${user.fullName}`, err);
              return {
                ...user,
                branchName: "فرع غير معروف"
              };
            }
          }
          return user;
        })
      );

      setCalls(callsRes.data);
      setFollowUps(followUpsRes.data);
      setAllUsers(enhancedUsers);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, [accountGuid]);


  useEffect(() => {
    if (!newCall || !accountGuid) return;
  
    const fetchUpdatedCalls = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const res = await axios.get(`https://api1.sstli.com/api/calls/${accountGuid}`);
        setCalls(res.data);
      } catch (err) {
        console.error("فشل في جلب المكالمات بعد إضافة جديدة:", err);
      }
    };
  
    fetchUpdatedCalls();
  }, [newCall, accountGuid]);
  
  const getFollowUpsForCall = (guid) => followUps.filter(f => f.callGuid === guid);

  const filteredCalls = calls
    .filter(call =>
      (typeFilter === '' || call.type === typeFilter) &&
      (statusFilter === '' || call.status === statusFilter) &&
      (userFilter === '' || call.userFullName === userFilter) &&
      (
        call.code?.toString().includes(searchText) ||
        call.type?.toLowerCase().includes(searchText.toLowerCase()) ||
        call.status?.toLowerCase().includes(searchText.toLowerCase()) ||
        call.userFullName?.toLowerCase().includes(searchText.toLowerCase()) ||
        call.notes?.toLowerCase().includes(searchText.toLowerCase())
      )
    )
    .sort((a, b) => new Date(b.callDate) - new Date(a.callDate));

  const paginatedCalls = filteredCalls.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFollowUp = (call) => {
    setSelectedCall(call);
    setOpenFollowForm(true);
  };

  const handleClose = () => {
    setOpenFollowForm(false);
    setSelectedCall(null);
    setFollowUpNote('');
    setFollowUpStatus('');
  };

  const handleViewDetails = (call) => {
    setDialogCall(call);
    setDetailsDialogOpen(true);
  };

const handleEditCall = (call) => {
  // تحويل نوع الاتصال من النصي إلى القيمة المخزنة
  let callType = '';
  if (call.type === 'استفسار عام') callType = 'general';
  else if (call.type === 'استفسار دراسي') callType = 'study';
  else if (call.type === 'شكوى') callType = 'complain';
  else callType = call.type; // في حال كانت القيمة محفوظة بالفعل كـ general/study/complain

  // تحويل حالة الاتصال من النصي إلى الرقمي
  let callStatus = call.status === 'مكتملة' ? '0' : '1';

  setEditingCall({
    ...call,
    type: callType,
    status: callStatus
  });
  setEditDialogOpen(true);
};

  const handleCloseEdit = () => {
    setEditDialogOpen(false);
    setEditingCall(null);
  };

const submitFollowUp = async () => {
  if (!selectedCall || !selectedCall.guid || !user?.guid) return;

  setIsSubmitting(true);
  const payload = {
    callGuid: selectedCall.guid,
    followUpNotes: followUpNote,
    stauts: followUpStatus === "1" ? 1 : 0,  // Changed this line
    userGuid: user.guid
  };

  try {
    await axios.post('https://api1.sstli.com/api/callfollowup/add', payload);
    const followUpsRes = await axios.get('https://api1.sstli.com/api/followcall');
    setFollowUps(followUpsRes.data);

    if (followUpStatus === "0") {  // Changed this condition
      setCalls(prev =>
        prev.map(call =>
          call.guid === selectedCall.guid
            ? { ...call, status: "مكتملة" }
            : call
        )
      );
    }

    await import('sweetalert2').then(Swal => {
      Swal.default.fire({
        icon: 'success',
        title: 'تم الحفظ',
        text: '✅ تمت إضافة المتابعة بنجاح'
      });
    });

    handleClose();
  } catch (err) {
    console.error(err);
    await import('sweetalert2').then(Swal => {
      Swal.default.fire({
        icon: 'error',
        title: 'خطأ',
        text: '❌ فشل في حفظ المتابعة'
      });
    });
  } finally {
    setIsSubmitting(false);
  }
};

const handleUpdateCall = async () => {
  if (!editingCall) return;
  
  setIsSubmitting(true);
  try {
    // Convert call type to integer (1: general, 2: study, 3: complain)
    let callTypeInt;
    if (editingCall.type === 'general') callTypeInt = 1;
    else if (editingCall.type === 'study') callTypeInt = 2;
    else if (editingCall.type === 'complain') callTypeInt = 3;
    else callTypeInt = 1; // default to general

    // Convert status to integer (0: completed, 1: follow-up)
    const callStatusInt = editingCall.status === '0' ? 0 : 1;

    const payload = {
      callDate: editingCall.callDate,
      callTime: editingCall.callTime,
      callType: callTypeInt, // using integer value
      programInquiry: editingCall.programInquiry ? parseInt(editingCall.programInquiry) : null,
      studyInquiryTopic: editingCall.studyInquiryTopic ? parseInt(editingCall.studyInquiryTopic) : null,
      complainSource: editingCall.complainSource || null,
      complainDetails: editingCall.complainDetails || '',
      notes: editingCall.notes || '',
      callStatus: callStatusInt, // using integer value
      forwardCall: editingCall.forwardCall === "yes" || editingCall.forwardCall === true,
      forwardTo: editingCall.forwardTo || null,
      supervisorGuid: editingCall.supervisorGuid || null
    };

    await axios.put(`https://api1.sstli.com/api/call/${editingCall.guid}`, payload);
    
    // Refresh calls after update
    const res = await axios.get(`https://api1.sstli.com/api/calls/${accountGuid}`);
    setCalls(res.data);
    
    await import('sweetalert2').then(Swal => {
      Swal.default.fire({
        icon: 'success',
        title: 'تم التحديث',
        text: '✅ تم تحديث بيانات المكالمة بنجاح'
      });
    });
    
    handleCloseEdit();
  } catch (error) {
    console.error(error);
    await import('sweetalert2').then(Swal => {
      Swal.default.fire({
        icon: 'error',
        title: 'خطأ',
        text: '❌ فشل في تحديث بيانات المكالمة'
      });
    });
  } finally {
    setIsSubmitting(false);
  }
};

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userJob = currentUser?.userJop;

  if (loading) return <CircularProgress style={{ marginTop: 20 }} />;
  if (calls.length === 0) return <Typography sx={{ mt: 2, fontFamily: 'Cairo, sans-serif' }}>لا يوجد سجل اتصالات.</Typography>;

  return (
    <Box sx={{ fontFamily: 'Cairo, sans-serif' }}>
      <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
        <FormControl sx={{ minWidth: 160 }}>
          <InputLabel>نوع الاتصال</InputLabel>
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} label="نوع الاتصال">
            <MenuItem value="">الكل</MenuItem>
            {[...new Set(calls.map(c => c.type))].map((type, i) => (
              <MenuItem key={i} value={type}>{type}</MenuItem>
            ))}
          </Select>
        </FormControl>

      <FormControl fullWidth margin="normal">
  <InputLabel>الحالة</InputLabel>
  <Select
    value={followUpStatus}
    onChange={(e) => setFollowUpStatus(e.target.value)}
    label="الحالة"
  >
    {userJob === 17 && (
      <MenuItem value="0">مكتملة</MenuItem>  // This will send 0 for completed
    )}
    <MenuItem value="1">متابعة لاحقًا</MenuItem>  // This will send 1 for follow-up
  </Select>
</FormControl>

        <FormControl sx={{ minWidth: 160 }}>
          <InputLabel>المستخدم</InputLabel>
          <Select value={userFilter} onChange={(e) => setUserFilter(e.target.value)} label="المستخدم">
            <MenuItem value="">الكل</MenuItem>
            {[...new Set(calls.map(c => c.userFullName))].map((user, i) => (
              <MenuItem key={i} value={user}>{user}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="بحث عام"
          variant="outlined"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{ minWidth: 200 }}
        />
      </Box>

      <TableContainer component={Paper} sx={{ width: '100%', mt: 2, borderRadius: 2, boxShadow: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f1f1f1' }}>
              <TableCell align="center">نوع الاتصال</TableCell>
              <TableCell align="center">التاريخ</TableCell>
              <TableCell align="center">الوقت</TableCell>
              <TableCell align="center">ملاحظات</TableCell>
              <TableCell align="center" sx={{ width: '150px' }}>الحالة</TableCell>
              <TableCell align="center">المستخدم</TableCell>
              <TableCell align="center">الإجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedCalls.map((call, index) => (
              <React.Fragment key={index}>
                <TableRow hover>
                  <TableCell align="center">{call.type}</TableCell>
                  <TableCell align="center">{call.callDate?.split('T')[0]}</TableCell>
                  <TableCell align="center">
                    {call.callTime ? new Date(call.callTime).toLocaleTimeString('ar-EG') : '-'}
                  </TableCell>
                  <TableCell align="center">{call.notes || '-'}</TableCell>
                  <TableCell align="center">
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontWeight: 'bold',
                      color: 'white',
                      backgroundColor:
                        call.status === 'مكتملة' ? '#4caf50' :
                        call.status === 'متابعة لاحقًا' ? '#fb8c00' :
                        '#9e9e9e'
                    }}>
                      {call.status}
                    </span>
                  </TableCell>
                  <TableCell align="center">{call.userFullName}</TableCell>
                  <TableCell align="center">
                    <Box display="flex" justifyContent="center" alignItems="center" gap={1}>
                      {call.status !== 'مكتملة' && (
                        <Button size="small" variant="contained" color="primary" onClick={() => handleFollowUp(call)}>متابعة</Button>
                      )}
                      <Button size="small" variant="outlined" color="secondary" onClick={() => handleViewDetails(call)}>عرض</Button>
                      <Button size="small" variant="outlined" color="warning" onClick={() => handleEditCall(call)}>تعديل</Button>
                      {getFollowUpsForCall(call.guid).length > 0 && (
                        <IconButton color="success" size="small" onClick={() => setExpandedRow(expandedRow === call.guid ? null : call.guid)}>
                          {expandedRow === call.guid ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
                {expandedRow === call.guid && (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ p: 2, backgroundColor: '#f9f9f9' }}>
                      <Collapse in={true} timeout="auto" unmountOnExit>
                        <Typography fontWeight="bold" mb={1}>📌 المتابعات</Typography>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell align="center">الملاحظات</TableCell>
                              <TableCell align="center">الحالة</TableCell>
                              <TableCell align="center">المستخدم</TableCell>
                              <TableCell align="center">التاريخ</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {getFollowUpsForCall(call.guid).map((f, i) => (
                              <TableRow key={i}>
                                <TableCell align="center">{f.followUpNotes || '-'}</TableCell>
                                <TableCell align="center">{f.stauts == 0 ? 'مكتملة' : 'متابعة لاحقًا'}</TableCell>
                                <TableCell align="center">{f.userFullName}</TableCell>
                                <TableCell align="center">{new Date(f.createdAt).toLocaleString('ar-EG')}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredCalls.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* متابعة جديدة Dialog */}
      <Dialog open={openFollowForm} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>📝 إضافة متابعة للمكالمة</DialogTitle>
        <DialogContent>
          <TextField
            label="ملاحظات المتابعة"
            multiline
            fullWidth
            rows={4}
            margin="normal"
            value={followUpNote}
            onChange={(e) => setFollowUpNote(e.target.value)}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>الحالة</InputLabel>
            <Select
              value={followUpStatus}
              onChange={(e) => setFollowUpStatus(e.target.value)}
              label="الحالة"
            >
              {userJob === 17 && (
                <MenuItem value="0">مكتملة</MenuItem>
              )}
              <MenuItem value="1">متابعة لاحقًا</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="secondary">إلغاء</Button>
          {isSubmitting ? (
            <CircularProgress size={24} color="primary" />
          ) : (
            <Button onClick={submitFollowUp} color="primary" variant="contained">حفظ</Button>
          )}
        </DialogActions>
      </Dialog>

      {/* تفاصيل المكالمة Dialog */}
      <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} fullWidth maxWidth="md" dir="rtl">
        <DialogTitle sx={{ fontWeight: 'bold', color: '#1976d2', textAlign: 'center', fontSize: 22 }}>
          📞 تفاصيل المكالمة
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#f9f9f9', padding: 3 }}>
          {dialogCall && (
            <>
              <Typography variant="h6" sx={{ mt: 1, mb: 2, fontWeight: 'bold', color: '#333' }}>🔹 معلومات المكالمة</Typography>
              <TableContainer component={Paper} sx={{ mb: 3, borderRadius: 2, boxShadow: 2 }}>
                <Table size="small">
                  <TableBody>
                    <TableRow><TableCell sx={{ fontWeight: 'bold' }}>رقم الاتصال</TableCell><TableCell>{dialogCall.code}</TableCell></TableRow>
                    <TableRow><TableCell sx={{ fontWeight: 'bold' }}>نوع الاتصال</TableCell><TableCell>{dialogCall.type}</TableCell></TableRow>
                    <TableRow><TableCell sx={{ fontWeight: 'bold' }}>تاريخ الاتصال</TableCell><TableCell>{dialogCall.callDate?.split('T')[0]}</TableCell></TableRow>
                    <TableRow><TableCell sx={{ fontWeight: 'bold' }}>وقت الاتصال</TableCell><TableCell>{new Date(dialogCall.callTime).toLocaleTimeString('ar-EG')}</TableCell></TableRow>
                    <TableRow><TableCell sx={{ fontWeight: 'bold' }}>ملاحظات</TableCell><TableCell>{dialogCall.notes || '-'}</TableCell></TableRow>
                    <TableRow><TableCell sx={{ fontWeight: 'bold' }}>الحالة</TableCell><TableCell>{dialogCall.status}</TableCell></TableRow>
                    <TableRow><TableCell sx={{ fontWeight: 'bold' }}>اسم المستخدم</TableCell><TableCell>{dialogCall.userFullName}</TableCell></TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              {getFollowUpsForCall(dialogCall.guid).length > 0 && (
                <>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#333' }}>📝 المتابعات المسجلة</Typography>
                  <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#f1f1f1' }}>
                          <TableCell align="center">الملاحظات</TableCell>
                          <TableCell align="center">الحالة</TableCell>
                          <TableCell align="center">المستخدم</TableCell>
                          <TableCell align="center">التاريخ</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {getFollowUpsForCall(dialogCall.guid).map((f, i) => (
                          <TableRow key={i}>
                            <TableCell align="center">{f.followUpNotes || '-'}</TableCell>
                            <TableCell align="center">{f.stauts === 0 ? 'مكتملة' : 'متابعة لاحقًا'}</TableCell>
                            <TableCell align="center">{f.userFullName}</TableCell>
                            <TableCell align="center">{new Date(f.createdAt).toLocaleString('ar-EG')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'flex-start', px: 3, pb: 2 }}>
          <Button onClick={() => setDetailsDialogOpen(false)} variant="contained" color="secondary">
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>

      {/* تعديل المكالمة Dialog */}
{/* تعديل المكالمة Dialog */}
{/* تعديل المكالمة Dialog */}
<Dialog open={editDialogOpen} onClose={handleCloseEdit} fullWidth maxWidth="md">
  <DialogTitle sx={{ fontWeight: 'bold', color: '#1976d2', textAlign: 'center', fontFamily: 'Cairo' }}>
    ✏️ تعديل بيانات المكالمة
  </DialogTitle>
  <DialogContent sx={{ pt: 3, fontFamily: 'Cairo' }}>
    {editingCall && (
      <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>


        {/* معلومات المكالمة الأساسية */}
        <Typography variant="h6" sx={{ mt: 1, mb: 2, fontWeight: 'bold', color: '#333' }}>
          معلومات المكالمة
        </Typography>
        
        {/* نوع الاتصال (غير قابل للتعديل) */}
        <TextField
          label="نوع الاتصال"
          fullWidth
          margin="normal"
          value={
            editingCall.type === 'general' ? 'استفسار عام' :
            editingCall.type === 'study' ? 'استفسار دراسي' :
            editingCall.type === 'complain' ? 'شكوى' : editingCall.type
          }
          InputProps={{
            readOnly: true,
          }}
        />

        {/* حقول إضافية بناءً على نوع الاتصال */}
        {editingCall.type === 'study' && (
          <>
            <FormControl fullWidth margin="normal">
              <InputLabel id="program-inquiry-label">البرنامج</InputLabel>
              <Select
                labelId="program-inquiry-label"
                label="البرنامج"
                value={editingCall.programInquiry || ''}
                onChange={(e) => setEditingCall({...editingCall, programInquiry: e.target.value})}
              >
                {["دبلوم الإدارة المكتبية", "دبلوم الموارد البشرية", "دبلوم إدارة الأعمال", "دبلوم القانون", "دبلوم المستشفيات", "دبلوم الأمن السيبراني", "دبلوم مشارك مكتبي", "دبلوم إدارة السلامة", "دبلوم المحاسبة", "دورة الحاسب الآلي 3 شهور", "دورة الحاسب الآلي 6 شهور", "دورة الإدارة المكتبية 3 شهور", "دورة الإدارة المكتبية 6 شهور", "دورات تطويرية", "آخري"].map((label, i) => (
                  <MenuItem key={i + 1} value={i + 1}>{label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel id="study-topic-label">موضوع الاستفسار</InputLabel>
              <Select
                labelId="study-topic-label"
                label="موضوع الاستفسار"
                value={editingCall.studyInquiryTopic || ''}
                onChange={(e) => setEditingCall({...editingCall, studyInquiryTopic: e.target.value})}
              >
                {["الرسوم الدراسية", "التسجيل", "الاختبارات", "شهادة التخرج", "جدول الدراسة", "التجسير", "آخري"].map((label, i) => (
                  <MenuItem key={i + 1} value={i + 1}>{label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </>
        )}

        {editingCall.type === 'complain' && (
          <>
            <FormControl fullWidth margin="normal">
              <InputLabel id="complain-source-label">شكوى من</InputLabel>
              <Select
                labelId="complain-source-label"
                label="شكوى من"
                value={editingCall.complainSource || ''}
                onChange={(e) => setEditingCall({...editingCall, complainSource: e.target.value})}
              >
                {["موظف إداري", "مدرب", "مشرف فرع", "مسوق", "آخري"].map((label, i) => (
                  <MenuItem key={i} value={label}>{label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="تفاصيل الشكوى"
              fullWidth
              multiline
              rows={3}
              margin="normal"
              value={editingCall.complainDetails || ''}
              onChange={(e) => setEditingCall({...editingCall, complainDetails: e.target.value})}
            />
          </>
        )}

        {/* معلومات المكالمة الثابتة */}
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>تاريخ الاتصال</TableCell>
                <TableCell>{editingCall.callDate?.split('T')[0] || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>وقت الاتصال</TableCell>
                <TableCell>
                  {editingCall.callTime ? new Date(editingCall.callTime).toLocaleTimeString('ar-EG') : '-'}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>مسجل بواسطة</TableCell>
                <TableCell>{editingCall.userFullName || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>حالة الاتصال</TableCell>
                <TableCell>
                  {editingCall.status === '0' ? 'مكتملة' : 
                   editingCall.status === '1' ? 'متابعة لاحقًا' : 
                   editingCall.status}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {/* معلومات التحويل الحالية */}
       {editingCall.forwardCall && (
          <>
            <Typography variant="h6" sx={{ mt: 1, mb: 2, fontWeight: 'bold', color: '#333' }}>
              معلومات التحويل الحالية
            </Typography>
            
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>تم التحويل إلى</TableCell>
                    <TableCell>
                      {editingCall.forwardTo === 'supervisor' ? 'مشرف فرع' : 
                       editingCall.forwardTo === 'sales' ? 'مبيعات' : 
                       editingCall.forwardTo}
                    </TableCell>
                  </TableRow>
                  {editingCall.supervisorGuid && (
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>المشرف الحالي</TableCell>
                      <TableCell>
                        <bdi dir="ltr">{allUsers.find(u => u.guid === editingCall.supervisorGuid)?.fullName || 'غير معروف'}</bdi> - 
                        <bdi dir="ltr">{allUsers.find(u => u.guid === editingCall.supervisorGuid)?.branchName || 'فرع غير معروف'}</bdi>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}


        {/* خيارات التعديل */}
        <Typography variant="h6" sx={{ mt: 1, mb: 2, fontWeight: 'bold', color: '#333' }}>
          خيارات التعديل
        </Typography>

        {/* Forwarding Options */}
        <FormControl fullWidth margin="normal">
          <InputLabel>تمرير الاتصال</InputLabel>
          <Select
            value={editingCall.forwardCall ? "yes" : "no"}
            onChange={(e) => setEditingCall({...editingCall, forwardCall: e.target.value === "yes"})}
            label="تمرير الاتصال"
          >
            <MenuItem value="no">لا</MenuItem>
            <MenuItem value="yes">نعم</MenuItem>
          </Select>
        </FormControl>

        {editingCall.forwardCall && (
          <>
            <FormControl fullWidth margin="normal">
              <InputLabel>تمرير إلى</InputLabel>
              <Select
                value={editingCall.forwardTo || ''}
                onChange={(e) => setEditingCall({...editingCall, forwardTo: e.target.value})}
                label="تمرير إلى"
              >
                <MenuItem value="supervisor">مشرف فرع</MenuItem>
                <MenuItem value="sales">مبيعات</MenuItem>
              </Select>
            </FormControl>
            
          {editingCall.forwardCall && editingCall.forwardTo === "supervisor" && (
          <FormControl fullWidth margin="normal">
            <InputLabel>اختر المشرف</InputLabel>
            <Select
              value={editingCall.supervisorGuid || ''}
              onChange={(e) => setEditingCall({...editingCall, supervisorGuid: e.target.value})}
              label="اختر المشرف"
            >
              <MenuItem value="" disabled>اختر مشرفًا</MenuItem>
              {allUsers
                .filter(u => u.userJop === 9)
                .map((user) => (
                  <MenuItem key={user.guid} value={user.guid}>
                    {user.fullName} – {user.branchName || 'فرع غير معروف'}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        )}

            {editingCall.forwardTo === "sales" && (
              <FormControl fullWidth margin="normal">
                <InputLabel>اختر موظف المبيعات</InputLabel>
                <Select
                  value={editingCall.supervisorGuid || ''}
                  onChange={(e) => setEditingCall({...editingCall, supervisorGuid: e.target.value})}
                  label="اختر موظف المبيعات"
                >
                  <MenuItem value="" disabled>اختر موظفًا</MenuItem>
                  {allUsers.filter(u => u.userJop === 18).map((user) => (
                    <MenuItem key={user.guid} value={user.guid}>
                      {user.fullName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </>
        )}

        {/* ملاحظات إضافية */}
        <TextField
          label="ملاحظات"
          fullWidth
          multiline
          rows={3}
          margin="normal"
          value={editingCall.notes || ''}
          onChange={(e) => setEditingCall({...editingCall, notes: e.target.value})}
        />
      </Box>
    )}
  </DialogContent>
  <DialogActions>
    <Button onClick={handleCloseEdit} color="secondary">إلغاء</Button>
    {isSubmitting ? (
      <CircularProgress size={24} />
    ) : (
      <Button onClick={handleUpdateCall} variant="contained" color="primary">
        حفظ التعديلات
      </Button>
    )}
  </DialogActions>
</Dialog>

    </Box>
  );
}