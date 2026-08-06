import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Divider,
  Stack,
  Chip,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
} from "@mui/material";

import CampaignIcon from "@mui/icons-material/Campaign";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SaveIcon from "@mui/icons-material/Save";
import DescriptionIcon from "@mui/icons-material/Description";
import SecurityIcon from "@mui/icons-material/Security";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ImageIcon from "@mui/icons-material/Image";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";

import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

import Sidebar from "../components/Sidebar";

const SIDEBAR_WIDTH = 280;
const API_BASE_URL = "https://sstli.com/api";

const UPLOAD_CIRCULAR_API = `${API_BASE_URL}/upload_circular.php`;
const GET_MY_CIRCULARS_API = `${API_BASE_URL}/get_my_circulars.php`;
const UPDATE_CIRCULAR_API = `${API_BASE_URL}/update_circular.php`;
const DELETE_CIRCULAR_API = `${API_BASE_URL}/delete_circular.php`;
const DELETE_CIRCULAR_FILE_API = `${API_BASE_URL}/delete_circular_file.php`;
const ADD_CIRCULAR_FILES_API = `${API_BASE_URL}/add_circular_files.php`;

const PRIMARY = "#057445";
const DANGER = "#8f171a";
const WHITE = "#ffffff";
const PAGE_BG = "#f7faf8";
const BORDER = "#dfeae4";

const allowedCircularUploaderGuids = [
  "f426653a-b389-4036-95f0-907920e7f205",
  "1e0c626f-c66b-4ec8-812f-0d53e1887113",
  "3f69ccb6-e2cf-4d6d-b801-7d727c977d8e",
  "35efb423-5491-4775-a5cc-98625fb66fa5",
];

const swalMain = {
  confirmButtonColor: PRIMARY,
  cancelButtonColor: DANGER,
  customClass: {
    popup: "swal-rtl-popup",
    title: "swal-rtl-title",
    htmlContainer: "swal-rtl-text",
  },
};

const textFieldSx = {
  "& .MuiInputBase-root": {
    borderRadius: 3,
    background: "#fbfdfc",
    fontFamily: "Cairo",
  },
  "& .MuiInputBase-input": {
    fontFamily: "Cairo",
    textAlign: "left",
    direction: "ltr",
  },
  "& textarea": {
    fontFamily: "Cairo",
    textAlign: "left !important",
    direction: "ltr !important",
    unicodeBidi: "plaintext",
  },
  "& textarea::placeholder": {
    textAlign: "left",
    direction: "ltr",
  },
  "& .MuiInputLabel-root": {
    fontFamily: "Cairo",
  },
};

const CircularsUpload = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserGuid = String(user?.guid || user?.Guid || "").toLowerCase();

  const canUpload = allowedCircularUploaderGuids.includes(currentUserGuid);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);

  const [myCirculars, setMyCirculars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editFiles, setEditFiles] = useState([]);
  const [editLoading, setEditLoading] = useState(false);

  const showToast = (icon, titleText) => {
    Swal.fire({
      toast: true,
      position: "top",
      icon,
      title: titleText,
      showConfirmButton: false,
      timer: 2200,
      timerProgressBar: true,
      ...swalMain,
    });
  };

  const showLoading = (titleText) => {
    Swal.fire({
      title: titleText,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
      ...swalMain,
    });
  };

  const getCreatedByName = () => {
    return (
      user?.name ||
      user?.fullName ||
      user?.FullName ||
      user?.userName ||
      user?.UserName ||
      "غير محدد"
    );
  };

  const normalizeFileUrl = (filePath = "") => {
    const rawPath = String(filePath || "").trim();

    if (!rawPath) return "";

    if (rawPath.startsWith("http://") || rawPath.startsWith("https://")) {
      return encodeURI(rawPath);
    }

    const cleanPath = rawPath.replace(/\\/g, "/").replace(/^\/+/, "");
    const cleanBase = API_BASE_URL.replace(/\/+$/, "");

    return encodeURI(`${cleanBase}/${cleanPath}`);
  };

  const getFileIcon = (fileType = "", fileName = "") => {
    const type = String(fileType || "").toLowerCase();
    const name = String(fileName || "").toLowerCase();

    if (type.includes("pdf") || name.endsWith(".pdf")) {
      return <PictureAsPdfIcon sx={{ color: DANGER }} />;
    }

    if (
      type.includes("image") ||
      name.endsWith(".jpg") ||
      name.endsWith(".jpeg") ||
      name.endsWith(".png") ||
      name.endsWith(".webp") ||
      name.endsWith(".gif")
    ) {
      return <ImageIcon sx={{ color: PRIMARY }} />;
    }

    if (
      name.endsWith(".doc") ||
      name.endsWith(".docx") ||
      type.includes("word") ||
      type.includes("document")
    ) {
      return <DescriptionIcon sx={{ color: PRIMARY }} />;
    }

    return <InsertDriveFileIcon sx={{ color: PRIMARY }} />;
  };

  const getCircularFiles = (item) => {
    if (!item) return [];

    if (Array.isArray(item.Files)) return item.Files;
    if (Array.isArray(item.files)) return item.files;

    if (typeof item.Files === "string" && item.Files.trim()) {
      try {
        const parsed = JSON.parse(item.Files);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return [];
      }
    }

    const singlePath = item.FilePath || item.filePath || "";
    const singleName = item.FileName || item.fileName || "";
    const singleType = item.FileType || item.fileType || "";

    if (singlePath) {
      return [
        {
          Id: item.FileId || item.fileId || null,
          CircularId: item.Id || item.id,
          FileName: singleName || "ملف مرفق",
          FilePath: singlePath,
          FileType: singleType,
        },
      ];
    }

    return [];
  };

  const getFileName = (fileItem) => {
    return fileItem?.FileName || fileItem?.fileName || fileItem?.name || "ملف مرفق";
  };

  const getFilePath = (fileItem) => {
    return fileItem?.FilePath || fileItem?.filePath || "";
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setFiles([]);

    const fileInput = document.getElementById("circular-file-input");
    if (fileInput) fileInput.value = "";
  };

  const resetEditFileInput = () => {
    setEditFiles([]);

    const editFileInput = document.getElementById("edit-circular-file-input");
    if (editFileInput) editFileInput.value = "";
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "";

    try {
      return new Date(dateValue).toLocaleString("ar-SA", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateValue;
    }
  };

  const fetchMyCirculars = async (withAlert = false) => {
    if (!canUpload) return;

    try {
      setListLoading(true);

      if (withAlert) {
        showLoading("جاري تحديث التعميمات...");
      }

      const res = await fetch(
        `${GET_MY_CIRCULARS_API}?createdByGuid=${encodeURIComponent(currentUserGuid)}`
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "حدث خطأ أثناء تحميل تعميماتك");
      }

      setMyCirculars(Array.isArray(data.data) ? data.data : []);

      if (withAlert) {
        Swal.close();
        showToast("success", "تم تحديث التعميمات");
      }
    } catch (error) {
      if (withAlert) Swal.close();

      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: error.message || "حدث خطأ أثناء تحميل تعميماتك",
        ...swalMain,
      });
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchMyCirculars(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUpload, currentUserGuid]);

  const handleFilesChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(selectedFiles);

    if (selectedFiles.length > 0) {
      showToast("success", `تم اختيار ${selectedFiles.length} ملف`);
    }
  };

  const handleEditFilesChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    setEditFiles(selectedFiles);

    if (selectedFiles.length > 0) {
      showToast("success", `تم اختيار ${selectedFiles.length} ملف جديد`);
    }
  };

  const removeSelectedFile = (index) => {
    const nextFiles = files.filter((_, i) => i !== index);
    setFiles(nextFiles);

    const fileInput = document.getElementById("circular-file-input");
    if (fileInput && nextFiles.length === 0) fileInput.value = "";
  };

  const removeEditSelectedFile = (index) => {
    const nextFiles = editFiles.filter((_, i) => i !== index);
    setEditFiles(nextFiles);

    const fileInput = document.getElementById("edit-circular-file-input");
    if (fileInput && nextFiles.length === 0) fileInput.value = "";
  };

  const openFile = (fileItem) => {
    const url = normalizeFileUrl(getFilePath(fileItem));

    if (!url) {
      Swal.fire({
        icon: "warning",
        title: "لا يوجد ملف",
        text: "لا يوجد رابط للملف.",
        ...swalMain,
      });
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canUpload) {
      Swal.fire({
        icon: "error",
        title: "غير مصرح",
        text: "ليس لديك صلاحية رفع التعميمات.",
        ...swalMain,
      });
      return;
    }

    if (!title.trim()) {
      Swal.fire({
        icon: "warning",
        title: "اسم التعميم مطلوب",
        text: "من فضلك اكتب اسم التعميم.",
        ...swalMain,
      });
      return;
    }

    try {
      setLoading(true);
      showLoading("جاري رفع التعميم...");

      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("createdByGuid", currentUserGuid);
      formData.append("createdByName", getCreatedByName());

      files.forEach((selectedFile) => {
        formData.append("files[]", selectedFile);
      });

      const res = await fetch(UPLOAD_CIRCULAR_API, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "حدث خطأ أثناء رفع التعميم");
      }

      Swal.close();

      await Swal.fire({
        icon: "success",
        title: "تم الحفظ",
        text: "تم رفع التعميم بنجاح.",
        ...swalMain,
      });

      resetForm();
      fetchMyCirculars(false);
    } catch (error) {
      Swal.close();

      Swal.fire({
        icon: "error",
        title: "خطأ أثناء الحفظ",
        text: error.message || "حدث خطأ غير متوقع",
        ...swalMain,
      });
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (item) => {
    setEditItem(item);
    setEditTitle(item.Title || "");
    setEditDescription(item.Description || "");
    setEditFiles([]);
    setEditOpen(true);
  };

  const closeEdit = () => {
    if (editLoading) return;

    setEditOpen(false);
    setEditItem(null);
    setEditTitle("");
    setEditDescription("");
    resetEditFileInput();
  };

const handleUpdate = async () => {
  if (!editItem) return;

  if (!editTitle.trim()) {
    Swal.fire({
      icon: "warning",
      title: "اسم التعميم مطلوب",
      text: "من فضلك اكتب اسم التعميم.",
      ...swalMain,
    });
    return;
  }

  try {
    setEditLoading(true);
    showLoading("جاري تعديل التعميم...");

    // 1) تعديل بيانات التعميم الأساسية
    const updateFormData = new FormData();
    updateFormData.append("id", editItem.Id);
    updateFormData.append("guid", editItem.Guid || "");
    updateFormData.append("title", editTitle.trim());
    updateFormData.append("description", editDescription.trim());
    updateFormData.append("createdByGuid", currentUserGuid);

    const updateRes = await fetch(UPDATE_CIRCULAR_API, {
      method: "POST",
      body: updateFormData,
    });

    const updateData = await updateRes.json();

    if (!updateRes.ok || !updateData.success) {
      throw new Error(updateData.message || "حدث خطأ أثناء تعديل التعميم");
    }

    // 2) إضافة ملفات جديدة لو الراجل اختار ملفات
    if (editFiles.length > 0) {
      const filesFormData = new FormData();
      filesFormData.append("circularId", editItem.Id);
      filesFormData.append("createdByGuid", currentUserGuid);

      editFiles.forEach((selectedFile) => {
        filesFormData.append("files[]", selectedFile);
      });

      const filesRes = await fetch(ADD_CIRCULAR_FILES_API, {
        method: "POST",
        body: filesFormData,
      });

      const filesData = await filesRes.json();

      if (!filesRes.ok || !filesData.success) {
        throw new Error(filesData.message || "تم تعديل التعميم لكن حدث خطأ أثناء إضافة الملفات");
      }
    }

    Swal.close();

    await Swal.fire({
      icon: "success",
      title: "تم التعديل",
      text:
        editFiles.length > 0
          ? "تم تعديل التعميم وإضافة الملفات الجديدة بنجاح."
          : "تم تعديل التعميم بنجاح.",
      ...swalMain,
    });

    closeEdit();
    fetchMyCirculars(false);
  } catch (error) {
    Swal.close();

    Swal.fire({
      icon: "error",
      title: "خطأ أثناء التعديل",
      text: error.message || "حدث خطأ أثناء تعديل التعميم",
      ...swalMain,
    });
  } finally {
    setEditLoading(false);
  }
};

  const handleDeleteFile = async (fileItem) => {
    const fileId = fileItem?.Id || fileItem?.id;

    if (!fileId) {
      Swal.fire({
        icon: "warning",
        title: "تنبيه",
        text: "لا يمكن حذف هذا الملف لأنه لا يحتوي على رقم ملف. تأكد أن API يرجع Id من جدول CircularFiles.",
        ...swalMain,
      });
      return;
    }

    const result = await Swal.fire({
      icon: "warning",
      title: "حذف الملف",
      text: `هل تريد حذف الملف: ${getFileName(fileItem)} ؟`,
      showCancelButton: true,
      confirmButtonText: "نعم، احذف",
      cancelButtonText: "إلغاء",
      reverseButtons: true,
      ...swalMain,
    });

    if (!result.isConfirmed) return;

    try {
      showLoading("جاري حذف الملف...");

      const formData = new FormData();
      formData.append("fileId", fileId);
      formData.append("createdByGuid", currentUserGuid);

      const res = await fetch(DELETE_CIRCULAR_FILE_API, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "حدث خطأ أثناء حذف الملف");
      }

      Swal.close();

      showToast("success", "تم حذف الملف بنجاح");
      fetchMyCirculars(false);
    } catch (error) {
      Swal.close();

      Swal.fire({
        icon: "error",
        title: "خطأ أثناء حذف الملف",
        text: error.message || "حدث خطأ أثناء حذف الملف",
        ...swalMain,
      });
    }
  };

  const handleDelete = async (item) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "تأكيد الحذف",
      text: `هل تريد حذف التعميم: ${item.Title} ؟`,
      showCancelButton: true,
      confirmButtonText: "نعم، احذف",
      cancelButtonText: "إلغاء",
      reverseButtons: true,
      ...swalMain,
    });

    if (!result.isConfirmed) return;

    try {
      showLoading("جاري حذف التعميم...");

      const formData = new FormData();
      formData.append("id", item.Id);
      formData.append("guid", item.Guid || "");
      formData.append("createdByGuid", currentUserGuid);

      const res = await fetch(DELETE_CIRCULAR_API, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "حدث خطأ أثناء حذف التعميم");
      }

      Swal.close();

      await Swal.fire({
        icon: "success",
        title: "تم الحذف",
        text: "تم حذف التعميم بنجاح.",
        ...swalMain,
      });

      fetchMyCirculars(false);
    } catch (error) {
      Swal.close();

      Swal.fire({
        icon: "error",
        title: "خطأ أثناء الحذف",
        text: error.message || "حدث خطأ أثناء حذف التعميم",
        ...swalMain,
      });
    }
  };

  const FilesPreview = ({ selectedFiles, onRemove }) => {
    if (!selectedFiles || selectedFiles.length === 0) return null;

    return (
      <Box
        sx={{
          mt: 2,
          mx: "auto",
          maxWidth: 680,
          p: 1.5,
          borderRadius: 3,
          background: "#eef7f3",
          border: `1px solid ${BORDER}`,
          textAlign: "left",
        }}
      >
        <Typography
          variant="body2"
          sx={{
            fontFamily: "Cairo",
            color: PRIMARY,
            fontWeight: 950,
            mb: 1,
          }}
        >
          الملفات المختارة: {selectedFiles.length}
        </Typography>

        <Stack spacing={0.8}>
          {selectedFiles.map((selectedFile, index) => (
            <Box
              key={`${selectedFile.name}-${index}`}
              sx={{
                p: 1,
                borderRadius: 2,
                background: WHITE,
                border: `1px solid ${BORDER}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontFamily: "Cairo",
                  color: "#17251f",
                  fontWeight: 800,
                  wordBreak: "break-word",
                }}
              >
                {index + 1} - {selectedFile.name}
              </Typography>

              <IconButton
                size="small"
                onClick={() => onRemove(index)}
                sx={{
                  color: DANGER,
                  background: "#fff4f4",
                  "&:hover": { background: "#ffe3e3" },
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Stack>
      </Box>
    );
  };

  const ExistingFilesList = ({ item, allowDelete = false }) => {
    const itemFiles = getCircularFiles(item);

    if (itemFiles.length === 0) {
      return (
        <Typography
          variant="body2"
          sx={{
            fontFamily: "Cairo",
            color: DANGER,
            fontWeight: 800,
            mt: 1,
          }}
        >
          لا توجد ملفات مرفقة.
        </Typography>
      );
    }

    return (
      <Stack spacing={1} sx={{ mt: 1.2 }}>
        {itemFiles.map((fileItem, index) => {
          const fileName = getFileName(fileItem);
          const fileUrl = normalizeFileUrl(getFilePath(fileItem));

          return (
            <Box
              key={fileItem.Id || fileItem.id || `${fileName}-${index}`}
              sx={{
                p: 1.1,
                borderRadius: 2.5,
                background: WHITE,
                border: `1px solid ${BORDER}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1.5,
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                <Box
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: 2,
                    border: `1px solid ${BORDER}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    background: "#fbfdfc",
                  }}
                >
                  {getFileIcon(fileItem.FileType || fileItem.fileType, fileName)}
                </Box>

                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "Cairo",
                    color: "#17251f",
                    fontWeight: 850,
                    wordBreak: "break-word",
                  }}
                >
                  {fileName}
                </Typography>
              </Stack>

              <Stack direction="row" spacing={0.7} alignItems="center" sx={{ flexShrink: 0 }}>
                <Tooltip title={fileUrl ? "فتح الملف" : "لا يوجد رابط"}>
                  <span>
                    <IconButton
                      size="small"
                      disabled={!fileUrl}
                      onClick={() => openFile(fileItem)}
                      sx={{
                        color: PRIMARY,
                        background: "#eef7f3",
                        "&:hover": { background: "#dff1e9" },
                      }}
                    >
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>

                {allowDelete && (
                  <Tooltip title="حذف الملف">
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteFile(fileItem)}
                      sx={{
                        color: DANGER,
                        background: "#fff4f4",
                        "&:hover": { background: "#ffe3e3" },
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            </Box>
          );
        })}
      </Stack>
    );
  };

  return (
    <Box
      dir="rtl"
      sx={{
        minHeight: "100vh",
        background: PAGE_BG,
        fontFamily: "Cairo, Arial, sans-serif",
      }}
    >
      <Sidebar />

      <Box
        component="main"
        sx={{
          minHeight: "100vh",
          ml: { xs: 0, md: `${SIDEBAR_WIDTH}px` },
          p: "20px",
          boxSizing: "border-box",
        }}
      >
        {!canUpload ? (
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 4,
              border: `1px solid ${DANGER}`,
              background: WHITE,
              boxShadow: "0 12px 28px rgba(143,23,26,0.08)",
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <SecurityIcon sx={{ color: DANGER, fontSize: 34 }} />

              <Box>
                <Typography
                  variant="h6"
                  sx={{ fontFamily: "Cairo", fontWeight: 900, color: DANGER }}
                >
                  غير مصرح
                </Typography>

                <Typography variant="body2" sx={{ fontFamily: "Cairo", color: "#6f5555" }}>
                  هذه الصفحة مخصصة للمستخدمين المصرح لهم برفع التعميمات فقط.
                </Typography>
              </Box>
            </Stack>
          </Paper>
        ) : (
          <Box sx={{ width: "100%" }}>
            <Box
              sx={{
                mb: 2.5,
                p: { xs: 2.5, md: 3 },
                borderRadius: 4,
                background: `linear-gradient(135deg, ${PRIMARY} 0%, ${DANGER} 120%)`,
                color: WHITE,
                boxShadow: "0 16px 38px rgba(5,116,69,0.18)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                  flexWrap: "wrap",
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 4,
                      background: "rgba(255,255,255,0.16)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid rgba(255,255,255,0.25)",
                    }}
                  >
                    <CampaignIcon sx={{ fontSize: 34 }} />
                  </Box>

                  <Box>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 950,
                        fontFamily: "Cairo",
                        lineHeight: 1.6,
                      }}
                    >
                      رفع التعميمات
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{
                        opacity: 0.92,
                        mt: 0.3,
                        fontFamily: "Cairo",
                        lineHeight: 1.9,
                      }}
                    >
                      أضف اسم التعميم والوصف وارفع ملف أو أكثر، وسيظهر لكل المستخدمين.
                    </Typography>
                  </Box>
                </Stack>

                <Chip
                  label="خاص بالإدارة"
                  sx={{
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    background: WHITE,
                    color: PRIMARY,
                    px: 1,
                  }}
                />
              </Box>
            </Box>

            <Paper
              elevation={0}
              sx={{
                p: "20px",
                borderRadius: 4,
                border: `1px solid ${BORDER}`,
                boxShadow: "0 10px 28px rgba(5,116,69,0.08)",
                background: WHITE,
                mb: 2.5,
              }}
            >
              <form onSubmit={handleSubmit}>
                <Stack spacing={2.2}>
                  <Box>
                    <Typography
                      sx={{
                        fontFamily: "Cairo",
                        fontWeight: 900,
                        mb: 1,
                        color: PRIMARY,
                        textAlign: "left",
                      }}
                    >
                      اسم التعميم
                    </Typography>

                    <TextField
                      fullWidth
                      placeholder="مثال: تعميم بخصوص مواعيد العمل"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      inputProps={{ dir: "rtl" }}
                      sx={textFieldSx}
                    />
                  </Box>

                  <Box>
                    <Typography
                      sx={{
                        fontFamily: "Cairo",
                        fontWeight: 900,
                        mb: 1,
                        color: PRIMARY,
                        textAlign: "left",
                      }}
                    >
                      وصف التعميم
                    </Typography>

                    <TextField
                      fullWidth
                      multiline
                      minRows={5}
                      placeholder="اكتب تفاصيل التعميم هنا..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      inputProps={{ dir: "rtl" }}
                      sx={textFieldSx}
                    />
                  </Box>

                  <Divider />

                  <Box
                    sx={{
                      border: `2px dashed ${PRIMARY}`,
                      background: "#fbfdfc",
                      borderRadius: 4,
                      p: "20px",
                      textAlign: "center",
                    }}
                  >
                    <Box
                      sx={{
                        width: 72,
                        height: 72,
                        borderRadius: "50%",
                        mx: "auto",
                        mb: 1.5,
                        background: "#eef7f3",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <CloudUploadIcon sx={{ fontSize: 42, color: PRIMARY }} />
                    </Box>

                    <Typography
                      sx={{
                        fontFamily: "Cairo",
                        fontWeight: 950,
                        mb: 0.8,
                        color: DANGER,
                      }}
                    >
                      اختر ملفات التعميم
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: "Cairo",
                        color: "#60736b",
                        mb: 2,
                        lineHeight: 1.9,
                      }}
                    >
                      يمكنك اختيار أكثر من صورة أو ملف في نفس التعميم
                    </Typography>

                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<DescriptionIcon />}
                      sx={{
                        fontFamily: "Cairo",
                        fontWeight: 900,
                        borderRadius: 3,
                        px: 3,
                        py: 1,
                        borderColor: PRIMARY,
                        color: PRIMARY,
                        "&:hover": {
                          borderColor: DANGER,
                          color: DANGER,
                          background: "#fff7f7",
                        },
                        "& .MuiButton-startIcon": {
                          ml: 1,
                          mr: 0,
                        },
                      }}
                    >
                      اختيار ملفات
                      <input
                        id="circular-file-input"
                        type="file"
                        hidden
                        multiple
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.txt,.zip,.rar"
                        onChange={handleFilesChange}
                      />
                    </Button>

                    <FilesPreview selectedFiles={files} onRemove={removeSelectedFile} />
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "flex-start",
                      gap: 1.5,
                      flexWrap: "wrap",
                    }}
                  >
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading}
                      startIcon={
                        loading ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />
                      }
                      sx={{
                        fontFamily: "Cairo",
                        fontWeight: 950,
                        borderRadius: 3,
                        px: 4,
                        py: 1.25,
                        minWidth: 170,
                        background: PRIMARY,
                        boxShadow: "0 8px 18px rgba(5,116,69,0.22)",
                        "&:hover": { background: DANGER },
                        "& .MuiButton-startIcon": {
                          ml: 1,
                          mr: 0,
                        },
                      }}
                    >
                      {loading ? "جاري الحفظ..." : "حفظ التعميم"}
                    </Button>

                    <Button
                      type="button"
                      variant="outlined"
                      disabled={loading}
                      onClick={resetForm}
                      sx={{
                        fontFamily: "Cairo",
                        fontWeight: 900,
                        borderRadius: 3,
                        px: 3,
                        py: 1.25,
                        borderColor: DANGER,
                        color: DANGER,
                        "&:hover": {
                          borderColor: PRIMARY,
                          color: PRIMARY,
                          background: "#eef7f3",
                        },
                      }}
                    >
                      تفريغ الحقول
                    </Button>
                  </Box>
                </Stack>
              </form>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: "20px",
                borderRadius: 4,
                border: `1px solid ${BORDER}`,
                boxShadow: "0 10px 28px rgba(5,116,69,0.08)",
                background: WHITE,
              }}
            >
              <Box
                sx={{
                  mb: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                  flexWrap: "wrap",
                }}
              >
                <Box>
                  <Typography
                    variant="h6"
                    sx={{ fontFamily: "Cairo", fontWeight: 950, color: DANGER }}
                  >
                    التعميمات التي قمت برفعها
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{ fontFamily: "Cairo", color: "#60736b", mt: 0.4 }}
                  >
                    يمكنك تعديل العنوان والوصف وإضافة ملفات جديدة أو حذف ملفات مرفقة.
                  </Typography>
                </Box>

                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={() => fetchMyCirculars(true)}
                  disabled={listLoading}
                  sx={{
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    borderRadius: 3,
                    borderColor: PRIMARY,
                    color: PRIMARY,
                    "&:hover": {
                      borderColor: DANGER,
                      color: DANGER,
                    },
                    "& .MuiButton-startIcon": {
                      ml: 1,
                      mr: 0,
                    },
                  }}
                >
                  تحديث
                </Button>
              </Box>

              {listLoading && (
                <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
                  <CircularProgress sx={{ color: PRIMARY }} />
                </Box>
              )}

              {!listLoading && myCirculars.length === 0 && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    background: "#eef7f3",
                    border: `1px solid ${BORDER}`,
                  }}
                >
                  <Typography sx={{ fontFamily: "Cairo", fontWeight: 900, color: PRIMARY }}>
                    لم تقم برفع أي تعميمات حتى الآن.
                  </Typography>
                </Paper>
              )}

              {!listLoading && myCirculars.length > 0 && (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      lg: "repeat(2, minmax(0, 1fr))",
                    },
                    gap: 2,
                  }}
                >
                  {myCirculars.map((item) => (
                    <Card
                      key={item.Id}
                      elevation={0}
                      sx={{
                        borderRadius: 3,
                        border: `1px solid ${BORDER}`,
                        background: "#fbfdfc",
                        overflow: "hidden",
                      }}
                    >
                      <CardContent sx={{ p: 2.2 }}>
                        <Typography
                          sx={{
                            fontFamily: "Cairo",
                            fontWeight: 950,
                            color: PRIMARY,
                            mb: 1,
                            lineHeight: 1.7,
                          }}
                        >
                          {item.Title}
                        </Typography>

                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: "Cairo",
                            color: "#52645d",
                            lineHeight: 2,
                            whiteSpace: "pre-wrap",
                            mb: 1.5,
                            textAlign: "right",
                            direction: "rtl",
                          }}
                        >
                          {item.Description || "لا يوجد وصف."}
                        </Typography>

                        <Typography
                          variant="caption"
                          sx={{
                            fontFamily: "Cairo",
                            color: "#60736b",
                            fontWeight: 800,
                          }}
                        >
                          تاريخ الرفع: {formatDate(item.CreatedAt)}
                        </Typography>

                        <Divider sx={{ my: 1.5 }} />

                        <Typography
                          sx={{
                            fontFamily: "Cairo",
                            fontWeight: 950,
                            color: DANGER,
                            mb: 0.5,
                          }}
                        >
                          الملفات المرفقة
                        </Typography>

                        <ExistingFilesList item={item} allowDelete />

                        <Divider sx={{ my: 1.5 }} />

                        <Stack direction="row" spacing={1} justifyContent="flex-start" flexWrap="wrap">
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<EditIcon />}
                            onClick={() => openEdit(item)}
                            sx={{
                              fontFamily: "Cairo",
                              fontWeight: 900,
                              borderRadius: 2.5,
                              background: PRIMARY,
                              "&:hover": { background: DANGER },
                              "& .MuiButton-startIcon": {
                                ml: 1,
                                mr: 0,
                              },
                            }}
                          >
                            تعديل
                          </Button>

                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleDelete(item)}
                            sx={{
                              fontFamily: "Cairo",
                              fontWeight: 900,
                              borderRadius: 2.5,
                              borderColor: DANGER,
                              color: DANGER,
                              "&:hover": {
                                borderColor: DANGER,
                                background: "#fff7f7",
                              },
                              "& .MuiButton-startIcon": {
                                ml: 1,
                                mr: 0,
                              },
                            }}
                          >
                            حذف التعميم
                          </Button>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Paper>

            <Dialog
              open={editOpen}
              onClose={closeEdit}
              fullWidth
              maxWidth="md"
              dir="rtl"
              PaperProps={{
                sx: {
                  borderRadius: 4,
                  fontFamily: "Cairo",
                },
              }}
            >
              <DialogTitle
                sx={{
                  fontFamily: "Cairo",
                  fontWeight: 950,
                  color: PRIMARY,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                  pb: 1,
                }}
              >
                تعديل التعميم

                <IconButton onClick={closeEdit} disabled={editLoading}>
                  <CloseIcon />
                </IconButton>
              </DialogTitle>

              <DialogContent>
                <Stack spacing={2} sx={{ pt: 1 }}>
                  <TextField
                    fullWidth
                    label="اسم التعميم"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    inputProps={{ dir: "rtl" }}
                    sx={textFieldSx}
                  />

                  <TextField
                    fullWidth
                    multiline
                    minRows={5}
                    label="وصف التعميم"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    inputProps={{ dir: "rtl" }}
                    sx={textFieldSx}
                  />

                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 3,
                      background: "#fbfdfc",
                      border: `1px solid ${BORDER}`,
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: "Cairo",
                        fontWeight: 950,
                        color: DANGER,
                        mb: 1,
                      }}
                    >
                      الملفات الحالية
                    </Typography>

                    <ExistingFilesList item={editItem} allowDelete />
                  </Box>

                  <Box
                    sx={{
                      border: `2px dashed ${PRIMARY}`,
                      background: "#fbfdfc",
                      borderRadius: 4,
                      p: "18px",
                      textAlign: "center",
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: "Cairo",
                        fontWeight: 950,
                        mb: 1,
                        color: PRIMARY,
                      }}
                    >
                      إضافة ملفات جديدة لهذا التعميم
                    </Typography>

                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<CloudUploadIcon />}
                      disabled={editLoading}
                      sx={{
                        fontFamily: "Cairo",
                        fontWeight: 900,
                        borderRadius: 3,
                        px: 3,
                        py: 1,
                        borderColor: PRIMARY,
                        color: PRIMARY,
                        "&:hover": {
                          borderColor: DANGER,
                          color: DANGER,
                          background: "#fff7f7",
                        },
                        "& .MuiButton-startIcon": {
                          ml: 1,
                          mr: 0,
                        },
                      }}
                    >
                      اختيار ملفات جديدة
                      <input
                        id="edit-circular-file-input"
                        type="file"
                        hidden
                        multiple
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.txt,.zip,.rar"
                        onChange={handleEditFilesChange}
                      />
                    </Button>

                    <FilesPreview selectedFiles={editFiles} onRemove={removeEditSelectedFile} />
                  </Box>
                </Stack>
              </DialogContent>

              <DialogActions sx={{ px: 3, pb: 2, justifyContent: "flex-start" }}>
                <Button
                  variant="contained"
                  onClick={handleUpdate}
                  disabled={editLoading}
                  sx={{
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    borderRadius: 3,
                    background: PRIMARY,
                    "&:hover": { background: DANGER },
                  }}
                >
                  {editLoading ? "جاري الحفظ..." : "حفظ التعديل"}
                </Button>

                <Button
                  variant="outlined"
                  onClick={closeEdit}
                  disabled={editLoading}
                  sx={{
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    borderRadius: 3,
                    borderColor: DANGER,
                    color: DANGER,
                  }}
                >
                  إلغاء
                </Button>
              </DialogActions>
            </Dialog>
          </Box>
        )}
      </Box>

      <style>
        {`
          .swal-rtl-popup {
            font-family: Cairo, Arial, sans-serif !important;
            direction: rtl !important;
          }

          .swal-rtl-title,
          .swal-rtl-text {
            font-family: Cairo, Arial, sans-serif !important;
            direction: rtl !important;
            text-align: center !important;
          }
        `}
      </style>
    </Box>
  );
};

export default CircularsUpload;
