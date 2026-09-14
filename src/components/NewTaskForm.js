import { navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from './NavigationShell';
import React, { useState, useEffect } from "react";
import {
  Box, Typography, TextField, Button, MenuItem,
  FormControl, InputLabel, Select, Checkbox, FormControlLabel, Paper, Divider, IconButton
} from "@mui/material";
import axios from "axios";
import DeleteIcon from '@mui/icons-material/Delete';
import Swal from "sweetalert2";


const API_DEPT_URL = "https://api3.sstli.com/api/Department/Load";

// Define task groups as integers with Arabic labels
const TASK_GROUPS = [
  { value: 1, label: "الإقامة" },
  { value: 2, label: "الإجازات" },
  { value: 3, label: "الشكاوي" },
  { value: 4, label: "الاشتراكات الثانوية" },
  { value: 5, label: " شئون الموظفين" },
  { value: 0, label: "أخرى" }
];

export default function NewTaskForm() {
  const TEMPLATE_UPLOAD_URL = "https://filesregsiteration.sstli.com/TaskTemplate.php";

  const [error, setError] = useState("");
  const [templateFiles, setTemplateFiles] = useState({});
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({
    taskName: "",
    departmentGuid: "",
    expectedDuration: "",
    approvalLevel: "",
    implementor: "",
    taskGroup: 0, // Default to first option (0)
    needAttachment: false,
    requiredAttachments: [],
  });
  const [loading, setLoading] = useState(false);
  const [attachmentInput, setAttachmentInput] = useState("");

  useEffect(() => {
    axios.get(API_DEPT_URL)
      .then(res => setDepartments(res.data))
      .catch(() => setDepartments([]));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setForm({ ...form, [name]: checked });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleAddAttachment = () => {
    if (!attachmentInput.trim()) return;
    setForm({
      ...form,
      requiredAttachments: [
        ...form.requiredAttachments,
        { name: attachmentInput.trim(), isRequired: false }
      ]
    });
    setAttachmentInput("");
  };
  

  const handleDeleteAttachment = (idx) => {
    const updated = [...form.requiredAttachments];
    const removed = updated.splice(idx, 1)[0];
    setForm({ ...form, requiredAttachments: updated });
  
    const newFiles = { ...templateFiles };
    delete newFiles[removed.name];
    setTemplateFiles(newFiles);
  };
  

  const handleToggleAttachmentRequired = (idx) => {
    const list = [...form.requiredAttachments];
    list[idx].isRequired = !list[idx].isRequired;
    setForm({ ...form, requiredAttachments: list });
  };

  const BASE_URL = "https://api3.sstli.com/api/NewTasks";

  const handleSubmit = async (e) => {
    console.log("HANDLE SUBMIT CLICKED");
    e.preventDefault();
  
    if (form.departmentGuid && form.implementor && form.departmentGuid === form.implementor) {
      Swal.fire({
        icon: 'error',
        title: 'خطأ',
        text: 'لا يمكن أن يكون القسم المختص هو نفس الجهة المنفذة.',
        confirmButtonText: 'حسناً'
      });
      return;
    }
  
    const dataToSend = {
      code: "",
      name: form.taskName,
      departGuid: form.departmentGuid,
      timeForDone: form.expectedDuration,
      approveLevel: form.approvalLevel ? parseInt(form.approvalLevel) : 0,
      doneDepartGuid: form.implementor,
      taskGroup: parseInt(form.taskGroup), // Ensure it's sent as integer
      allowAttach: !!form.needAttachment,
      attachments: form.needAttachment
        ? form.requiredAttachments.map(att => ({
            name: att.name,
            isRequired: att.isRequired
          }))
        : []
    };
  
    setLoading(true);
    try {
      await axios.post(BASE_URL, dataToSend);
          // رفع الملفات التوضيحية إن وجدت
for (const att of form.requiredAttachments) {
  const file = templateFiles[att.name];
  if (file) {
    const formData = new FormData();
    formData.append("taskName", form.taskName);
    formData.append("templateName", att.name);
    formData.append("templateFile", file);
    await axios.post(TEMPLATE_UPLOAD_URL, formData);
  }
}
      setLoading(false);
      setTemplateFiles({});
      Swal.fire({
        icon: 'success',
        title: 'تم حفظ المهمة بنجاح',
        confirmButtonText: 'موافق'
      });
      setForm({
        taskName: "",
        departmentGuid: "",
        expectedDuration: "",
        approvalLevel: "",
        implementor: "",
        taskGroup: 0,
        needAttachment: false,
        requiredAttachments: [],
      });
    } catch (error) {
      setLoading(false);
      Swal.fire({
        icon: 'error',
        title: 'خطأ أثناء الحفظ',
        text: error?.response?.data?.message || "حدث خطأ غير متوقع!",
        confirmButtonText: 'حسناً'
      });
    }


  };

  return (
    <NavigationShell variant="admin"><Box sx={navigationContentSx}>
      
      <Box sx={{
        maxWidth: 600,
        mx: "auto",
        mt: 6
      }}>
        <Paper elevation={4} sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
            إضافة مهمة جديدة
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <form onSubmit={handleSubmit}>
            <TextField
              name="taskName"
              label="اسم المهمة"
              fullWidth
              required
              sx={{ mb: 2 }}
              value={form.taskName}
              onChange={handleChange}
            />

            {/* Task Group Dropdown - Added Here */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="taskGroup-label">المجموعة</InputLabel>
              <Select
                labelId="taskGroup-label"
                name="taskGroup"
                value={form.taskGroup}
                label="المجموعة"
                required
                onChange={handleChange}
              >
                {TASK_GROUPS.map((group) => (
                  <MenuItem key={group.value} value={group.value}>
                    {group.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="department-label">القسم المختص</InputLabel>
              <Select
                labelId="department-label"
                name="departmentGuid"
                value={form.departmentGuid}
                label="القسم المختص"
                required
                onChange={handleChange}
              >
                {departments.map((d) => (
                  <MenuItem key={d.guid} value={d.guid}>{d.departName}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              name="expectedDuration"
              label="الوقت المتوقع (ساعة/يوم)"
              type="text"
              fullWidth
              required
              sx={{ mb: 2 }}
              value={form.expectedDuration}
              onChange={handleChange}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="approvalLevel-label">مستوى الموافقة</InputLabel>
              <Select
                labelId="approvalLevel-label"
                name="approvalLevel"
                value={form.approvalLevel}
                label="مستوى الموافقة"
                required
                onChange={handleChange}
              >
                <MenuItem value="4">بدون</MenuItem>
                <MenuItem value="0">المستوى الأول</MenuItem>
                <MenuItem value="1">المستوى الثاني</MenuItem>
                <MenuItem value="2">المستوى الثالث</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="implementor-label">الجهة المنفذة</InputLabel>
              <Select
                labelId="implementor-label"
                name="implementor"
                value={form.implementor}
                label="الجهة المنفذة"
                required
                onChange={handleChange}
              >
                {departments.map((d) => (
                  <MenuItem key={d.guid} value={d.guid}>{d.departName}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Checkbox
                  checked={form.needAttachment}
                  name="needAttachment"
                  onChange={handleChange}
                />
              }
              label="مطلوب إرفاق أو توضيح"
              sx={{ mb: 2 }}
            />

{form.needAttachment && (
  <Box sx={{ mb: 2 }}>
    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
      أسماء المرفقات/التوضيحات المطلوبة للمُنفذ
    </Typography>

    <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
      <TextField
        label="اسم المرفق أو التوضيح"
        value={attachmentInput}
        onChange={e => setAttachmentInput(e.target.value)}
        sx={{ flex: 1 }}
      />
      <Button
        variant="contained"
        onClick={handleAddAttachment}
        disabled={!attachmentInput.trim()}
      >
        إضافة
      </Button>
    </Box>

    {form.requiredAttachments.length > 0 && (
      <Box>
        {form.requiredAttachments.map((att, idx) => (
          <Box
            key={idx}
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
              mb: 2,
              background: "#f1f5f9",
              px: 2,
              py: 2,
              borderRadius: 2
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography sx={{ flex: 1 }}>
                {att.name}
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={att.isRequired}
                    onChange={() => handleToggleAttachmentRequired(idx)}
                  />
                }
                label="ضروري"
              />
              <IconButton onClick={() => handleDeleteAttachment(idx)}>
                <DeleteIcon color="error" />
              </IconButton>
            </Box>

            {/* زر رفع ملف توضيحي اختياري */}
            <Box>
              <Button variant="outlined" component="label">
                ارفق ملف توضيحي (اختياري)
                <input
                  type="file"
                  hidden
                  onChange={(e) =>
                    setTemplateFiles({
                      ...templateFiles,
                      [att.name]: e.target.files[0]
                    })
                  }
                />
              </Button>

              {templateFiles[att.name] && (
                <Typography variant="body2" sx={{ color: "green", mt: 1 }}>
                  📎 {templateFiles[att.name].name}
                </Typography>
              )}
            </Box>
          </Box>
        ))}
      </Box>
    )}

    <Typography variant="caption" color="warning.main">
      سيتم إلزام المنفذ برفع هذه المرفقات أو التوضيحات عند التنفيذ
      (ولا يمكنه إرسال المهمة بدونهم إذا كانوا محددين كضروري)
    </Typography>
  </Box>
)}


            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ py: 1.2, fontWeight: 700, mt: 2 }}
            >
              {loading ? "جارٍ الحفظ..." : "إضافة المهمة"}
            </Button>
          </form>
        </Paper>
      </Box>
    </Box></NavigationShell>
  );
}