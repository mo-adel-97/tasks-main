import * as uiLayout from './common/uiLayout';
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Button, 
  IconButton,
  CircularProgress,
  Box
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AttachFileIcon from '@mui/icons-material/AttachFile'; 
import axios from 'axios';
import Swal from 'sweetalert2';

const TaskStatusDialog = ({
  open,
  onClose,
  task,
  statusNote,
  setStatusNote,
  attachment,
  setAttachment,
  statusTitle,
  setStatusTitle
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getStatusText = (status) => {
    switch (status) {
      case 0: return "معلقة";
      case 1: return "جاري التنفيذ";
      case 2: return "مكتملة";
      case 3: return "مرفوضة";
      default: return "غير محددة";
    }
  };

  const createFakeFile = () => {
    const fakeFile = new File([""], "fake.txt", {
      type: "text/plain",
    });
    return fakeFile;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const user = JSON.parse(localStorage.getItem("user"));
    
    const formData = new FormData();
    formData.append('taskId', task.id);
    formData.append('status', statusTitle);
    formData.append('note', statusNote || "لا يوجد ملاحظات");
    formData.append('assignedTo', user.guid);
    
    // If no attachment, add a fake file
    const fileToSend = attachment || createFakeFile();
    formData.append('attachmentPath', fileToSend);

    try {
      const response = await axios.post(
        "https://api3.sstli.com/api/PuplicTask/SaveTaskUpdate",
        formData,
        { 
          headers: { 
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.status === 204) {
        Swal.fire({
          icon: 'success',
          title: 'تم تحديث الحالة بنجاح!',
          showConfirmButton: false,
          timer: 1500
        });
        // Reset form
        setStatusNote("");
        setAttachment(null);
        onClose();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'خطأ في الاستجابة!',
          text: `التفاصيل: ${JSON.stringify(response.data)}`
        });
      }
    } catch (error) {
      const errorDetails = error.response ? JSON.stringify(error.response.data) : error.message;
      Swal.fire({
        icon: 'error',
        title: 'فشل الاتصال!',
        text: `التفاصيل: ${errorDetails}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog sx={uiLayout.dialogLayoutSx} open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <span>{`تغيير حالة المهمة - الحالة الحالية: ${getStatusText(statusTitle)}`}</span>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
          label="ملاحظة"
          fullWidth
          multiline
          rows={3}
          value={statusNote}
          onChange={(e) => setStatusNote(e.target.value)}
          margin="normal"
          variant="outlined"
        />
        <Box mt={2} display="flex" alignItems="center">
          <Button sx={uiLayout.buttonSx}
            variant="outlined"
            component="label"
            startIcon={<AttachFileIcon />}
            disabled={isSubmitting}
          >
            {attachment ? attachment.name : "إرفاق ملف (اختياري)"}
            <input
              type="file"
              hidden
              onChange={(e) => setAttachment(e.target.files[0])}
            />
          </Button>
          {attachment && (
            <IconButton 
              onClick={() => setAttachment(null)} 
              color="error"
              size="small"
              sx={{ ml: 1 }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={uiLayout.dialogActionsSx}>
        <Button sx={uiLayout.buttonSx} 
          onClick={onClose} 
          color="secondary"
          disabled={isSubmitting}
        >
          إلغاء
        </Button>
        <Button sx={uiLayout.buttonSx} 
          onClick={handleSubmit} 
          color="primary" 
          variant="contained"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {isSubmitting ? 'جاري الإرسال...' : 'تحديث الحالة'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskStatusDialog;