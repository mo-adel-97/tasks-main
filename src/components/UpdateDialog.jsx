import * as uiLayout from './common/uiLayout';
import React from 'react';
import {
  Dialog,
  DialogContent,
  Button,
  Typography,
  Box,
  Divider,
  Slide,
  Fade
} from '@mui/material';
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt';
import DownloadIcon from '@mui/icons-material/Download';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

// Animation للنزول
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="down" ref={ref} {...props} timeout={450} />;
});

export default function UpdateDialog({
  open,
  onClose,
  onDownload,
  update
}) {
  if (!update) return null;

  return (
    <Dialog sx={uiLayout.dialogLayoutSx}
      open={open}
      TransitionComponent={Transition}
      keepMounted
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 5,
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0,0,0,.25)'
        }
      }}
    >
      {/* ================= Header ================= */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #2563eb, #1e40af)',
          color: '#fff',
          p: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}
      >
        <SystemUpdateAltIcon sx={{ fontSize: 48 }} />
        <Box>
          <Typography variant="h6" fontWeight="bold">
            تحديث جديد متاح
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            برنامج الحسابات
          </Typography>
        </Box>
      </Box>

      {/* ================= Content ================= */}
      <DialogContent sx={{ p: 3 }}>
        <Fade in={open} timeout={700}>
          <Box>
            {/* تاريخ الإصدار */}
            <Box sx={{ mb: 2 }}>
              <Typography fontWeight="bold">تاريخ الإصدار</Typography>
              <Typography variant="body2" color="text.secondary">
                {update.uploaded_at}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* تفاصيل التحديث */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <InfoOutlinedIcon color="info" />
              <Typography fontWeight="bold">
                تفاصيل التحديث
              </Typography>
            </Box>

            <Typography variant="body2" sx={{ mt: 1 }}>
              التحديث الخاص بالتحديث التلقائي حيث انه لن تحتاج ثانية الى تحميله من برنامج المهام
            </Typography>

            <Divider sx={{ my: 2 }} />

            {/* طريقة التثبيت */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <InfoOutlinedIcon color="primary" />
              <Typography fontWeight="bold">
                طريقة تثبيت البرنامج
              </Typography>
            </Box>

            <Typography variant="body2" sx={{ mt: 1 }}>
              1️⃣ قم بالضغط على زر <b>تحميل التحديث</b>.
            </Typography>

            <Typography variant="body2" sx={{ mt: 0.5 }}>
              2️⃣ بعد اكتمال التحميل، قم بنقل الملف المضغوط إلى أي مكان على جهازك.
            </Typography>

            <Typography variant="body2" sx={{ mt: 0.5 }}>
              3️⃣ قم <b>بفك ضغط</b> الملف، ثم الدخول إلى المجلد الناتج.
            </Typography>

            <Typography variant="body2" sx={{ mt: 0.5 }}>
              4️⃣ ستجد ملف <b>sstli.exe</b> — وهذا هو ملف تشغيل البرنامج.
            </Typography>

          </Box>
        </Fade>
      </DialogContent>

      {/* ================= Actions ================= */}
      <Box
        sx={uiLayout.withUiSx({
          p: 3,
          pt: 0,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 2
        }, uiLayout.actionBarSx)}
      >
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={onDownload}
          sx={uiLayout.withUiSx({
            borderRadius: 3,
            px: 3,
            background: 'linear-gradient(135deg, #2563eb, #1e40af)'
          }, uiLayout.buttonSx)}
        >
          تحميل التحديث
        </Button>

        <Button
          variant="outlined"
          onClick={onClose}
          sx={uiLayout.withUiSx({ borderRadius: 3, px: 3 }, uiLayout.buttonSx)}
        >
          لاحقًا
        </Button>
      </Box>
    </Dialog>
  );
}
