import * as uiLayout from './common/uiLayout';
import React, { useEffect, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, MenuItem, CircularProgress } from '@mui/material';
import Swal from 'sweetalert2';
import axios from "axios";

export default function AddNewStudentButton({ nationalId }) {
  const [open, setOpen] = useState(false);
  const [sectors, setSectors] = useState([]);
  const [accountSetting, setAccountSetting] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // ← حالة التحميل

  const [formData, setFormData] = useState({
    StudentName: '',
    NationalId: nationalId || '',
    StudentTel: '',
    StudentType: '',
    StudentNational: '',
    Email: '',
    Notes: '',
    CompanyGuid: '',
    StudyType: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    const fetchSectors = async () => {
      try {
        const res = await axios.get('https://api1.sstli.com/api/call/sectors');
        setSectors(res.data);
      } catch (err) {
        Swal.fire('خطأ', 'حدث خطأ أثناء تحميل القطاعات', 'error');
      }
    };

    const fetchAccountSettings = async () => {
      try {
        const res = await axios.get('https://api1.sstli.com/api/call/account-settings?depGuid=10');
        if (res.data.length > 0) {
          setAccountSetting(res.data[0]);
        }
      } catch (err) {
        Swal.fire('خطأ', 'حدث خطأ أثناء تحميل بيانات الحساب', 'error');
      }
    };

    if (open) {
      fetchSectors();
      fetchAccountSettings();
    }
  }, [open]);

  const validateMobile = (mobile) => /^05\d{8}$/.test(mobile);
const validateNationalId = (id) => /^[123]\d{9}$/.test(id);


  const handleSave = async () => {
    if (!formData.StudentName || !formData.NationalId || !formData.CompanyGuid || formData.StudyType === '' || !accountSetting) {
      Swal.fire('خطأ', 'يرجى إدخال جميع البيانات المطلوبة بما فيها الحساب الأساسي', 'error');
      return;
    }

    // ✅ تحقق من رقم الجوال
if (!validateMobile(formData.StudentTel)) {
  Swal.fire('خطأ', 'رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام', 'error');
  return;
}

// ✅ تحقق من رقم الهوية
if (!validateNationalId(formData.NationalId)) {
  Swal.fire('خطأ', 'رقم الهوية يجب أن يكون من 10 أرقام ويبدأ بـ 1 أو 2 أو 3', 'error');
  return;
}


    const dataToPost = {
      ParentGuid: accountSetting.accountGuid,
      ParentCode: accountSetting.code,
      AccountName: formData.StudentName || "Student Account",
      AccountKind: false,
      AccountType: 1,
      Maden: 0,
      Daen: 0,
      IsShow: true,
      Type_: 2,
      AcadmyId: "STU-" + Math.floor(Math.random() * 100000),
      StudentName: formData.StudentName,
      StudentTel: formData.StudentTel,
      NationalId: formData.NationalId,
      RegCaseGuid: "b73b985a-df3d-42c7-ae36-45d602dc425e",
      BarnchGuid: "47fa287e-2517-4424-b58f-bd67f9a042d9",
      IsUse: true,
      Notes: formData.Notes,
      NoData: false,
      Email: formData.Email,
      StudentType: Number(formData.StudentType) || 0,
      StudentNational: Number(formData.StudentNational) || 0,
      StudyType: Number(formData.StudyType) || 0,
      CompanyGuid: formData.CompanyGuid
    };

    setIsSubmitting(true); // ← تشغيل اللودر

    try {
      await axios.post('https://api1.sstli.com/api/Call/AddStudentWithAccount', dataToPost);
      Swal.fire('تم', 'تم إضافة الطالب بنجاح', 'success');
      setOpen(false);
      setFormData({
        StudentName: '',
        NationalId: nationalId || '',
        StudentTel: '',
        StudentType: '',
        StudentNational: '',
        Email: '',
        Notes: '',
        CompanyGuid: '',
        StudyType: ''
      });
    } catch (error) {
      console.error(error);
      Swal.fire('خطأ', 'حدث خطأ أثناء إضافة الطالب', 'error');
    } finally {
      setIsSubmitting(false); // ← إيقاف اللودر
    }
  };

  return (
    <>
      <Button sx={uiLayout.buttonSx} onClick={() => setOpen(true)} variant="contained" color="primary" style={{ fontWeight: 'bold', marginTop: '15px' }}>
        ➕ إضافة طالب جديد
      </Button>

      <Dialog sx={uiLayout.dialogLayoutSx} open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle style={{ textAlign: 'center', fontWeight: 'bold' }}>📝 إضافة طالب جديد</DialogTitle>
        <DialogContent style={{ direction: 'rtl' }}>
          <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }} fullWidth label="الاسم الكامل" name="StudentName" margin="normal" value={formData.StudentName} onChange={handleChange} />
          <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }} fullWidth label="رقم الهوية" name="NationalId" margin="normal" value={formData.NationalId} onChange={handleChange} />
          <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }} fullWidth label="رقم الجوال" name="StudentTel" margin="normal" value={formData.StudentTel} onChange={handleChange} />
          <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }} fullWidth label="الإيميل" name="Email" margin="normal" value={formData.Email} onChange={handleChange} />

          <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
            select
            fullWidth
            label="النوع"
            name="StudentType"
            margin="normal"
            value={formData.StudentType}
            onChange={handleChange}
          >
            <MenuItem value="0">ذكر</MenuItem>
            <MenuItem value="1">أنثى</MenuItem>
          </TextField>

          <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
            select
            fullWidth
            label="الجنسية"
            name="StudentNational"
            margin="normal"
            value={formData.StudentNational}
            onChange={handleChange}
          >
            <MenuItem value="0">مواطن</MenuItem>
            <MenuItem value="1">مقيم</MenuItem>
          </TextField>
          <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
            select fullWidth label="القطاع"
            name="CompanyGuid" margin="normal"
            value={formData.CompanyGuid} onChange={handleChange}>
            {sectors.map((sector) => (
              <MenuItem key={sector.guid} value={sector.guid}>
                {sector.companyName}
              </MenuItem>
            ))}
          </TextField>

          <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
            select fullWidth label="نوع الدراسة"
            name="StudyType" margin="normal"
            value={formData.StudyType} onChange={handleChange}>
            <MenuItem value="0">حضوري</MenuItem>
            <MenuItem value="1">عن بعد</MenuItem>
          </TextField>
          <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }} fullWidth label="ملاحظات" name="Notes" margin="normal" value={formData.Notes} onChange={handleChange} />

        </DialogContent>
        <DialogActions sx={uiLayout.dialogActionsSx}>
          <Button sx={uiLayout.buttonSx} onClick={() => setOpen(false)} color="secondary">إلغاء</Button>
          {
            isSubmitting
              ? <CircularProgress size={28} color="primary" />
              : <Button sx={uiLayout.buttonSx} onClick={handleSave} variant="contained" color="primary">حفظ</Button>
          }
        </DialogActions>
      </Dialog>
    </>
  );
}
