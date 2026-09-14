import * as uiLayout from './common/uiLayout';
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  Button
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export default function AttachmentViewer({ open, onClose, filePath, sourceType = "main" }) {
  const isImage = (path) =>
    /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(path || "");

  // استخراج اسم الملف فقط من المسار الكامل
  const extractFileName = (fullPath) => {
    if (!fullPath) return "";
    return fullPath.split("\\").pop(); // للويندوز
  };

  const fileName = extractFileName(filePath);

  // تحديد رابط التحميل حسب نوع الملف
  const fileUrl =
    sourceType === "main"
      ? `https://api3.sstli.com/api/TaskAssignment/File/${fileName}`
      : `https://api3.sstli.com/api/SubTaskStatus/CompletedFile?filePath=${encodeURIComponent(filePath)}`;

  return (
    <Dialog sx={uiLayout.dialogLayoutSx} open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        عرض المرفق
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ textAlign: "center" }}>
        {isImage(filePath) ? (
          <img
            src={fileUrl}
            alt="مرفق"
            style={{ maxWidth: "100%", maxHeight: "70vh", borderRadius: 8 }}
          />
        ) : (
          <>
            <Typography sx={{ mb: 2 }}>
              لا يمكن عرض هذا النوع من الملفات داخل المتصفح.
              <br />
              يمكنك تحميله من الزر أدناه.
            </Typography>
            <Button
              variant="contained"
              href={fileUrl}
              download
              sx={uiLayout.withUiSx({ mt: 2 }, uiLayout.buttonSx)}
            >
              تحميل الملف
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
