import PageContainer from '../components/common/PageContainer';
import * as uiLayout from '../components/common/uiLayout';
import './rtl-forms-fix.css';
import { navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CreateNewFolderRoundedIcon from "@mui/icons-material/CreateNewFolderRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";
import DashboardCustomizeRoundedIcon from "@mui/icons-material/DashboardCustomizeRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";

import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";





const API_BASE_URL = (
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  "http://localhost:5258"
).replace(/\/+$/, "");

const PRIMARY = "#057445";
const PRIMARY_DARK = "#034f31";
const DANGER = "#8f171a";
const PAGE_BG = "#f4f7f5";
const BORDER = "#dbe7e1";
const TEXT = "#183128";
const MUTED = "#6d8178";
const WHITE = "#ffffff";

const ACCEPTED_FILES =
  ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.txt";

const getUserGuid = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return String(user?.guid || user?.Guid || "").trim();
  } catch {
    return "";
  }
};

const formatBytes = (bytes) => {
  const value = Number(bytes || 0);
  if (!Number.isFinite(value) || value <= 0) return "0 KB";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (file, size = 34) => {
  const extension = String(file?.extension || "").toLowerCase();
  const contentType = String(file?.contentType || "").toLowerCase();

  if (extension === ".pdf" || contentType.includes("pdf")) {
    return <PictureAsPdfRoundedIcon sx={{ color: DANGER, fontSize: size }} />;
  }

  if (
    [".jpg", ".jpeg", ".png", ".webp"].includes(extension) ||
    contentType.startsWith("image/")
  ) {
    return <ImageRoundedIcon sx={{ color: "#3276b1", fontSize: size }} />;
  }

  if ([".doc", ".docx", ".txt"].includes(extension)) {
    return <DescriptionRoundedIcon sx={{ color: PRIMARY, fontSize: size }} />;
  }

  return <InsertDriveFileRoundedIcon sx={{ color: "#667b72", fontSize: size }} />;
};

const swalOptions = {
  confirmButtonColor: PRIMARY,
  cancelButtonColor: DANGER,
  reverseButtons: true,
  customClass: {
    popup: "swal-cairo-popup",
    title: "swal-cairo-title",
    htmlContainer: "swal-cairo-text",
    confirmButton: "swal-cairo-button",
    cancelButton: "swal-cairo-button",
  },
};

const showToast = (icon, title) =>
  Swal.fire({
    toast: true,
    position: "top",
    icon,
    title,
    showConfirmButton: false,
    timer: 2200,
    timerProgressBar: true,
    ...swalOptions,
  });

const showConfirm = async ({
  title,
  text,
  confirmText = "نعم، حذف",
}) => {
  const result = await Swal.fire({
    icon: "warning",
    title,
    text,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: "إلغاء",
    focusCancel: true,
    ...swalOptions,
  });

  return result.isConfirmed;
};

const showErrorAlert = (message) =>
  Swal.fire({
    icon: "error",
    title: "حدث خطأ",
    text: message || "تعذر تنفيذ العملية.",
    confirmButtonText: "حسنًا",
    ...swalOptions,
  });

const CircularsUpload = () => {
  const userGuid = getUserGuid();

  const [tree, setTree] = useState([]);
  const [activeTabGuid, setActiveTabGuid] = useState("");
  const [activeFolderGuid, setActiveFolderGuid] = useState("");
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [forbidden, setForbidden] = useState(false);

  const [dialog, setDialog] = useState({
    open: false,
    mode: "",
    target: null,
    name: "",
    description: "",
  });

  const activeTab = useMemo(
    () => tree.find((tab) => String(tab.guid) === String(activeTabGuid)) || null,
    [tree, activeTabGuid]
  );

  const folders = useMemo(
    () => (Array.isArray(activeTab?.folders) ? activeTab.folders : []),
    [activeTab]
  );

  const activeFolder = useMemo(
    () =>
      folders.find(
        (folder) => String(folder.guid) === String(activeFolderGuid)
      ) || null,
    [folders, activeFolderGuid]
  );

  const visibleFolders = useMemo(() => {
    const search = searchText.trim().toLowerCase();
    if (!search) return folders;

    return folders.filter((folder) =>
      [folder?.name, folder?.description]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search))
    );
  }, [folders, searchText]);

  const visibleFiles = useMemo(() => {
    const files = Array.isArray(activeFolder?.files) ? activeFolder.files : [];
    const search = searchText.trim().toLowerCase();
    if (!search) return files;

    return files.filter((file) =>
      [file?.displayName, file?.originalFileName, file?.extension]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search))
    );
  }, [activeFolder, searchText]);

  const showSuccess = (message) => {
    setSuccessMessage("");
    showToast("success", message || "تمت العملية بنجاح.");
  };

  const loadTree = async () => {
    if (!userGuid) {
      setTree([]);
      setError("تعذر تحديد المستخدم الحالي.");
      setForbidden(true);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setForbidden(false);

      const response = await fetch(
        `${API_BASE_URL}/api/circulars/manage-tree/${encodeURIComponent(userGuid)}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 403) setForbidden(true);
        throw new Error(
          result?.message ||
            (response.status === 403
              ? "ليس لديك صلاحية إدارة مكتبة المحتوى."
              : "تعذر تحميل إدارة مكتبة المحتوى.")
        );
      }

      const data = Array.isArray(result?.data) ? result.data : [];
      setTree(data);

      setActiveTabGuid((current) => {
        if (current && data.some((tab) => String(tab.guid) === String(current))) {
          return current;
        }
        return data[0]?.guid || "";
      });
    } catch (err) {
      console.error("Content management load error:", err);
      setTree([]);
      const message = err?.message || "تعذر تحميل إدارة مكتبة المحتوى.";
      setError(message);
      if (!forbidden) {
        showErrorAlert(message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTree();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (
      activeFolderGuid &&
      !folders.some((folder) => String(folder.guid) === String(activeFolderGuid))
    ) {
      setActiveFolderGuid("");
    }
  }, [folders, activeFolderGuid]);

  const requestJson = async (url, options = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
      },
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 403) setForbidden(true);
      throw new Error(result?.message || "حدث خطأ أثناء تنفيذ العملية.");
    }

    return result;
  };

  const changeTab = (_, value) => {
    setActiveTabGuid(value);
    setActiveFolderGuid("");
    setSearchText("");
  };

  const enterFolder = (folder) => {
    setActiveFolderGuid(folder.guid);
    setSearchText("");
  };

  const leaveFolder = () => {
    setActiveFolderGuid("");
    setSearchText("");
  };

  const openDialog = (mode, target = null) => {
    setError("");

    const isFile = mode === "editFile";
    setDialog({
      open: true,
      mode,
      target,
      name: isFile
        ? target?.displayName || target?.originalFileName || ""
        : target?.name || "",
      description: isFile ? "" : target?.description || "",
    });
  };

  const closeDialog = () => {
    if (busy) return;
    setDialog({
      open: false,
      mode: "",
      target: null,
      name: "",
      description: "",
    });
  };

  const saveDialog = async () => {
    const name = dialog.name.trim();

    if (!name) {
      setError(dialog.mode === "editFile" ? "اسم الملف مطلوب." : "الاسم مطلوب.");
      return;
    }

    try {
      setBusy(true);
      setError("");

      let result = null;

      if (dialog.mode === "createTab") {
        result = await requestJson(`${API_BASE_URL}/api/circulars/tabs`, {
          method: "POST",
          body: JSON.stringify({
            userGuid,
            name,
            description: dialog.description.trim() || null,
          }),
        });
      }

      if (dialog.mode === "editTab" && activeTab) {
        result = await requestJson(
          `${API_BASE_URL}/api/circulars/tabs/${encodeURIComponent(activeTab.guid)}`,
          {
            method: "PUT",
            body: JSON.stringify({
              userGuid,
              name,
              description: dialog.description.trim() || null,
            }),
          }
        );
      }

      if (dialog.mode === "createFolder" && activeTab) {
        result = await requestJson(`${API_BASE_URL}/api/circulars/folders`, {
          method: "POST",
          body: JSON.stringify({
            userGuid,
            tabGuid: activeTab.guid,
            name,
            description: dialog.description.trim() || null,
          }),
        });
      }

      if (dialog.mode === "editFolder" && dialog.target) {
        result = await requestJson(
          `${API_BASE_URL}/api/circulars/folders/${encodeURIComponent(
            dialog.target.guid
          )}`,
          {
            method: "PUT",
            body: JSON.stringify({
              userGuid,
              name,
              description: dialog.description.trim() || null,
            }),
          }
        );
      }

      if (dialog.mode === "editFile" && dialog.target) {
        result = await requestJson(
          `${API_BASE_URL}/api/circulars/files/${encodeURIComponent(
            dialog.target.guid
          )}`,
          {
            method: "PUT",
            body: JSON.stringify({
              userGuid,
              displayName: name,
            }),
          }
        );
      }

      setDialog({
        open: false,
        mode: "",
        target: null,
        name: "",
        description: "",
      });

      await loadTree();
      showSuccess(result?.message || "تم الحفظ بنجاح.");
    } catch (err) {
      console.error("Content save error:", err);
      const message = err?.message || "تعذر حفظ البيانات.";
      setError(message);
      showErrorAlert(message);
    } finally {
      setBusy(false);
    }
  };

  const deleteTab = async () => {
    if (!activeTab) return;

    const confirmed = await showConfirm({
      title: "حذف القسم؟",
      text: `سيتم حذف القسم "${activeTab.name}" نهائيًا مع جميع المجلدات والملفات الموجودة بداخله.`,
      confirmText: "نعم، حذف القسم",
    });

    if (!confirmed) return;

    try {
      setBusy(true);
      setError("");

      const result = await requestJson(
        `${API_BASE_URL}/api/circulars/tabs/${encodeURIComponent(
          activeTab.guid
        )}?userGuid=${encodeURIComponent(userGuid)}`,
        { method: "DELETE" }
      );

      setActiveFolderGuid("");
      setActiveTabGuid("");
      await loadTree();
      showSuccess(result?.message || "تم حذف القسم.");
    } catch (err) {
      const message = err?.message || "تعذر حذف القسم.";
      setError(message);
      showErrorAlert(message);
    } finally {
      setBusy(false);
    }
  };

  const deleteFolder = async (folder) => {
    const confirmed = await showConfirm({
      title: "حذف المجلد؟",
      text: `سيتم حذف المجلد "${folder.name}" وجميع الملفات الموجودة بداخله.`,
      confirmText: "نعم، حذف المجلد",
    });

    if (!confirmed) return;

    try {
      setBusy(true);
      setError("");

      const result = await requestJson(
        `${API_BASE_URL}/api/circulars/folders/${encodeURIComponent(
          folder.guid
        )}?userGuid=${encodeURIComponent(userGuid)}`,
        { method: "DELETE" }
      );

      if (String(activeFolderGuid) === String(folder.guid)) {
        setActiveFolderGuid("");
      }

      await loadTree();
      showSuccess(result?.message || "تم حذف المجلد.");
    } catch (err) {
      const message = err?.message || "تعذر حذف المجلد.";
      setError(message);
      showErrorAlert(message);
    } finally {
      setBusy(false);
    }
  };

  const deleteFile = async (file) => {
    const fileName = file.displayName || file.originalFileName;

    const confirmed = await showConfirm({
      title: "حذف الملف؟",
      text: `سيتم حذف الملف "${fileName}" نهائيًا.`,
      confirmText: "نعم، حذف الملف",
    });

    if (!confirmed) return;

    try {
      setBusy(true);
      setError("");

      const result = await requestJson(
        `${API_BASE_URL}/api/circulars/files/${encodeURIComponent(
          file.guid
        )}?userGuid=${encodeURIComponent(userGuid)}`,
        { method: "DELETE" }
      );

      await loadTree();
      showSuccess(result?.message || "تم حذف الملف.");
    } catch (err) {
      const message = err?.message || "تعذر حذف الملف.";
      setError(message);
      showErrorAlert(message);
    } finally {
      setBusy(false);
    }
  };

  const uploadFiles = async (fileList) => {
    if (!activeFolder) return;

    const selected = Array.from(fileList || []);
    if (selected.length === 0) return;

    try {
      setBusy(true);
      setError("");

      const formData = new FormData();
      formData.append("userGuid", userGuid);
      selected.forEach((file) => formData.append("files", file));

      const response = await fetch(
        `${API_BASE_URL}/api/circulars/folders/${encodeURIComponent(
          activeFolder.guid
        )}/files`,
        {
          method: "POST",
          body: formData,
          headers: { Accept: "application/json" },
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 403) setForbidden(true);
        throw new Error(result?.message || "تعذر رفع الملفات.");
      }

      await loadTree();
      showSuccess(result?.message || "تم رفع الملفات بنجاح.");
    } catch (err) {
      console.error("Content files upload error:", err);
      const message = err?.message || "تعذر رفع الملفات.";
      setError(message);
      showErrorAlert(message);
    } finally {
      setBusy(false);
    }
  };

  const openFile = (fileGuid) => {
    window.open(
      `${API_BASE_URL}/api/circulars/files/${encodeURIComponent(
        fileGuid
      )}/open?userGuid=${encodeURIComponent(userGuid)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const downloadFile = (fileGuid) => {
    window.open(
      `${API_BASE_URL}/api/circulars/files/${encodeURIComponent(
        fileGuid
      )}/download?userGuid=${encodeURIComponent(userGuid)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const dialogTitle = {
    createTab: "إضافة قسم جديد",
    editTab: "تعديل القسم",
    createFolder: "إضافة مجلد جديد",
    editFolder: "تعديل المجلد",
    editFile: "تعديل اسم الملف",
  }[dialog.mode];

  return (
    <NavigationShell variant="standard" ><Box
      dir="rtl"
      sx={{
        minHeight: "100vh",
        bgcolor: PAGE_BG,
        fontFamily: "Cairo, Arial, sans-serif",
      }}
    >
      

      <PageContainer
        component="main"
        sx={{
          minHeight: "100vh",
          width: "100%",
          boxSizing: "border-box",
          
          ...navigationContentSx
        }}
      >
        <Stack spacing={1.25} sx={{ width: "100%" }}>
          <Paper
            elevation={0}
            sx={{
              px: { xs: 1.5, md: 2 },
              py: 1.4,
              borderRadius: 3,
              border: `1px solid ${BORDER}`,
              bgcolor: WHITE,
            }}
          >
            <Stack
              direction={{ xs: "column", lg: "row" }}
              alignItems={{ xs: "stretch", lg: "center" }}
              justifyContent="space-between"
              spacing={1.25}
            >
              <Stack direction="row" spacing={1.2} alignItems="center">
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2.5,
                    bgcolor: "#e9f5ef",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <DashboardCustomizeRoundedIcon
                    sx={{ color: PRIMARY, fontSize: 27 }}
                  />
                </Box>

                <Box>
                  <Typography
                    variant="h6"
                    sx={{ fontFamily: "Cairo", fontWeight: 950, color: TEXT }}
                  >
                    إدارة مكتبة المحتوى
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ fontFamily: "Cairo", color: MUTED }}
                  >
                    أنشئ الأقسام ثم ادخل إلى المجلدات لإدارة ملفاتها
                  </Typography>
                </Box>
              </Stack>

              <Stack sx={uiLayout.actionBarSx}
                direction={{ xs: "column", sm: "row" }}
                spacing={0.8}
              >
                <Button
                  variant="contained"
                  startIcon={<AddRoundedIcon />}
                  onClick={() => openDialog("createTab")}
                  disabled={loading || busy || forbidden}
                  sx={uiLayout.withUiSx({
                    bgcolor: PRIMARY,
                    borderRadius: 2.5,
                    boxShadow: "none",
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    "&:hover": { bgcolor: PRIMARY_DARK, boxShadow: "none" },
                    "& .MuiButton-startIcon": { ml: 0.6, mr: 0 },
                  }, uiLayout.buttonSx)}
                >
                  قسم جديد
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<RefreshRoundedIcon />}
                  onClick={loadTree}
                  disabled={loading || busy}
                  sx={uiLayout.withUiSx({
                    borderRadius: 2.5,
                    borderColor: BORDER,
                    color: PRIMARY,
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    "& .MuiButton-startIcon": { ml: 0.6, mr: 0 },
                  }, uiLayout.buttonSx)}
                >
                  تحديث
                </Button>
              </Stack>
            </Stack>
          </Paper>

          {successMessage && (
            <Alert
              severity="success"
              sx={{ borderRadius: 3, fontFamily: "Cairo" }}
            >
              {successMessage}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ borderRadius: 3, fontFamily: "Cairo" }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Paper
              elevation={0}
              sx={{
                minHeight: 360,
                borderRadius: 3,
                border: `1px solid ${BORDER}`,
                display: "grid",
                placeItems: "center",
                bgcolor: WHITE,
              }}
            >
              <Stack alignItems="center" spacing={1.3}>
                <CircularProgress sx={{ color: PRIMARY }} />
                <Typography sx={{ fontFamily: "Cairo", color: MUTED }}>
                  جاري تحميل إدارة مكتبة المحتوى...
                </Typography>
              </Stack>
            </Paper>
          ) : forbidden ? (
            <Paper
              elevation={0}
              sx={{
                minHeight: 340,
                borderRadius: 3,
                border: `1px solid ${BORDER}`,
                display: "grid",
                placeItems: "center",
                bgcolor: WHITE,
                p: 3,
              }}
            >
              <Stack alignItems="center" spacing={1}>
                <SecurityRoundedIcon sx={{ fontSize: 52, color: DANGER }} />
                <Typography
                  variant="h6"
                  sx={{ fontFamily: "Cairo", fontWeight: 950, color: DANGER }}
                >
                  غير مصرح
                </Typography>
                <Typography sx={{ fontFamily: "Cairo", color: MUTED }}>
                  هذه الصفحة تحتاج صلاحية إدارة المحتوى والملفات.
                </Typography>
              </Stack>
            </Paper>
          ) : tree.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                minHeight: 360,
                borderRadius: 3,
                border: `1px dashed ${BORDER}`,
                display: "grid",
                placeItems: "center",
                bgcolor: WHITE,
                textAlign: "center",
                p: 3,
              }}
            >
              <Box>
                <FolderRoundedIcon sx={{ fontSize: 62, color: "#a9bbb3" }} />
                <Typography
                  variant="h6"
                  sx={{ mt: 1, fontFamily: "Cairo", fontWeight: 900, color: TEXT }}
                >
                  لا توجد أقسام بعد
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddRoundedIcon />}
                  onClick={() => openDialog("createTab")}
                  sx={uiLayout.withUiSx({
                    mt: 1.5,
                    bgcolor: PRIMARY,
                    borderRadius: 2.5,
                    boxShadow: "none",
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    "&:hover": { bgcolor: PRIMARY_DARK, boxShadow: "none" },
                    "& .MuiButton-startIcon": { ml: 0.5, mr: 0 },
                  }, uiLayout.buttonSx)}
                >
                  إنشاء أول قسم
                </Button>
              </Box>
            </Paper>
          ) : (
            <>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: `1px solid ${BORDER}`,
                  bgcolor: WHITE,
                  overflow: "hidden",
                }}
              >
                <Tabs
                  value={activeTabGuid || false}
                  onChange={changeTab}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    minHeight: 52,
                    px: 0.75,
                    "& .MuiTab-root": {
                      minHeight: 52,
                      minWidth: 120,
                      px: 2,
                      fontFamily: "Cairo",
                      fontWeight: 900,
                      color: "#61756c",
                    },
                    "& .Mui-selected": {
                      color: `${PRIMARY} !important`,
                      bgcolor: "#eef7f2",
                    },
                    "& .MuiTabs-indicator": {
                      height: 3,
                      bgcolor: PRIMARY,
                      borderRadius: 3,
                    },
                  }}
                >
                  {tree.map((tab) => (
                    <Tab key={tab.guid} value={tab.guid} label={tab.name} />
                  ))}
                </Tabs>
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: `1px solid ${BORDER}`,
                  bgcolor: WHITE,
                  overflow: "hidden",
                  minHeight: 520,
                }}
              >
                <Box
                  sx={{
                    px: { xs: 1.5, md: 2 },
                    py: 1.2,
                    borderBottom: `1px solid ${BORDER}`,
                    bgcolor: "#fbfdfc",
                  }}
                >
                  <Stack
                    direction={{ xs: "column", lg: "row" }}
                    alignItems={{ xs: "stretch", lg: "center" }}
                    justifyContent="space-between"
                    spacing={1}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={0.7}
                      sx={{ minWidth: 0 }}
                    >
                      {activeFolder ? (
                        <Button
                          onClick={leaveFolder}
                          startIcon={<ArrowBackRoundedIcon />}
                          sx={uiLayout.withUiSx({
                            minWidth: "auto",
                            px: 1,
                            color: PRIMARY,
                            fontFamily: "Cairo",
                            fontWeight: 900,
                            "& .MuiButton-startIcon": { ml: 0.4, mr: 0 },
                          }, uiLayout.buttonSx)}
                        >
                          رجوع
                        </Button>
                      ) : (
                        <HomeRoundedIcon sx={{ color: PRIMARY, fontSize: 22 }} />
                      )}

                      <Typography
                        sx={{ fontFamily: "Cairo", color: MUTED, whiteSpace: "nowrap" }}
                      >
                        إدارة المحتوى
                      </Typography>

                      <Typography sx={{ color: "#a3b2ac" }}>/</Typography>

                      <Typography
                        sx={{
                          fontFamily: "Cairo",
                          fontWeight: 900,
                          color: activeFolder ? MUTED : TEXT,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {activeTab?.name || ""}
                      </Typography>

                      {activeFolder && (
                        <>
                          <Typography sx={{ color: "#a3b2ac" }}>/</Typography>
                          <Typography
                            sx={{
                              fontFamily: "Cairo",
                              fontWeight: 950,
                              color: TEXT,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {activeFolder.name}
                          </Typography>
                        </>
                      )}
                    </Stack>

                    <Stack sx={uiLayout.filterBarSx}
                      direction={{ xs: "column", sm: "row" }}
                      spacing={0.7}
                    >
                      <TextField InputLabelProps={{ shrink: true }}
                        size="small"
                        value={searchText}
                        onChange={(event) => setSearchText(event.target.value)}
                        placeholder={
                          activeFolder
                            ? "ابحث في الملفات..."
                            : "ابحث في المجلدات..."
                        }
                        sx={uiLayout.withUiSx({
                          width: { xs: "100%", sm: 270 },
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2.5,
                            bgcolor: WHITE,
                          },
                          "& input": { fontFamily: "Cairo" },
                        }, uiLayout.formFieldSx)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchRoundedIcon sx={{ color: "#82968d" }} />
                            </InputAdornment>
                          ),
                        }}
                      />

                      {!activeFolder ? (
                        <>
                          <Button
                            variant="contained"
                            startIcon={<CreateNewFolderRoundedIcon />}
                            onClick={() => openDialog("createFolder")}
                            disabled={busy}
                            sx={uiLayout.withUiSx({
                              bgcolor: PRIMARY,
                              borderRadius: 2.5,
                              boxShadow: "none",
                              fontFamily: "Cairo",
                              fontWeight: 900,
                              "&:hover": {
                                bgcolor: PRIMARY_DARK,
                                boxShadow: "none",
                              },
                              "& .MuiButton-startIcon": { ml: 0.5, mr: 0 },
                            }, uiLayout.buttonSx)}
                          >
                            مجلد جديد
                          </Button>

                          <Button
                            variant="outlined"
                            startIcon={<EditRoundedIcon />}
                            onClick={() => openDialog("editTab", activeTab)}
                            disabled={busy || !activeTab}
                            sx={uiLayout.withUiSx({
                              borderRadius: 2.5,
                              borderColor: BORDER,
                              color: PRIMARY,
                              fontFamily: "Cairo",
                              fontWeight: 900,
                              px: 1.5,
                              "&:hover": {
                                borderColor: "#a9cdbb",
                                bgcolor: "#f6fbf8",
                              },
                              "& .MuiButton-startIcon": { ml: 0.5, mr: 0 },
                            }, uiLayout.buttonSx)}
                          >
                            تعديل القسم
                          </Button>

                          <Button
                            variant="outlined"
                            startIcon={<DeleteOutlineRoundedIcon />}
                            onClick={deleteTab}
                            disabled={busy || !activeTab}
                            sx={uiLayout.withUiSx({
                              borderRadius: 2.5,
                              borderColor: "#e6bcbc",
                              color: DANGER,
                              fontFamily: "Cairo",
                              fontWeight: 900,
                              px: 1.5,
                              "&:hover": {
                                borderColor: DANGER,
                                bgcolor: "#fff6f6",
                              },
                              "& .MuiButton-startIcon": { ml: 0.5, mr: 0 },
                            }, uiLayout.buttonSx)}
                          >
                            حذف القسم
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            component="label"
                            variant="contained"
                            startIcon={<CloudUploadRoundedIcon />}
                            disabled={busy}
                            sx={uiLayout.withUiSx({
                              bgcolor: PRIMARY,
                              borderRadius: 2.5,
                              boxShadow: "none",
                              fontFamily: "Cairo",
                              fontWeight: 900,
                              "&:hover": {
                                bgcolor: PRIMARY_DARK,
                                boxShadow: "none",
                              },
                              "& .MuiButton-startIcon": { ml: 0.5, mr: 0 },
                            }, uiLayout.buttonSx)}
                          >
                            رفع ملفات
                            <input
                              hidden
                              type="file"
                              multiple
                              accept={ACCEPTED_FILES}
                              onChange={(event) => {
                                uploadFiles(event.target.files);
                                event.target.value = "";
                              }}
                            />
                          </Button>

                          <Tooltip title="تعديل المجلد">
                            <IconButton
                              onClick={() =>
                                openDialog("editFolder", activeFolder)
                              }
                              disabled={busy}
                              sx={{
                                border: `1px solid ${BORDER}`,
                                borderRadius: 2.3,
                                color: PRIMARY,
                              }}
                            >
                              <EditRoundedIcon />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="حذف المجلد">
                            <IconButton
                              onClick={() => deleteFolder(activeFolder)}
                              disabled={busy}
                              sx={{
                                border: "1px solid #eed1d1",
                                borderRadius: 2.3,
                                color: DANGER,
                              }}
                            >
                              <DeleteOutlineRoundedIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Stack>
                  </Stack>
                </Box>

                {!activeFolder ? (
                  <Box sx={{ p: { xs: 1.5, md: 2 } }}>
                    {activeTab?.description && (
                      <Typography
                        variant="body2"
                        sx={{ mb: 1.5, fontFamily: "Cairo", color: MUTED }}
                      >
                        {activeTab.description}
                      </Typography>
                    )}

                    {visibleFolders.length === 0 ? (
                      <Box sx={{ py: 8, textAlign: "center" }}>
                        <FolderRoundedIcon
                          sx={{ fontSize: 58, color: "#b4c4bd" }}
                        />
                        <Typography
                          sx={{
                            mt: 1,
                            fontFamily: "Cairo",
                            fontWeight: 850,
                            color: MUTED,
                          }}
                        >
                          {searchText
                            ? "لا توجد مجلدات مطابقة للبحث."
                            : "لا توجد مجلدات داخل هذا القسم."}
                        </Typography>
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: {
                            xs: "repeat(2, minmax(0, 1fr))",
                            sm: "repeat(3, minmax(0, 1fr))",
                            md: "repeat(4, minmax(0, 1fr))",
                            lg: "repeat(5, minmax(0, 1fr))",
                            xl: "repeat(6, minmax(0, 1fr))",
                          },
                          gap: 1.25,
                        }}
                      >
                        {visibleFolders.map((folder) => {
                          const count = Array.isArray(folder.files)
                            ? folder.files.length
                            : 0;

                          return (
                            <Paper
                              key={folder.guid}
                              elevation={0}
                              role="button"
                              tabIndex={0}
                              onClick={() => enterFolder(folder)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") enterFolder(folder);
                              }}
                              sx={{
                                p: 1.45,
                                minHeight: 145,
                                borderRadius: 3,
                                border: `1px solid ${BORDER}`,
                                bgcolor: "#fcfefd",
                                cursor: "pointer",
                                transition: "all .18s ease",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                position: "relative",
                                "&:hover": {
                                  transform: "translateY(-2px)",
                                  borderColor: "#a9cdbb",
                                  boxShadow:
                                    "0 8px 24px rgba(5,116,69,0.09)",
                                  bgcolor: "#ffffff",
                                },
                              }}
                            >
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="flex-start"
                              >
                                <FolderRoundedIcon
                                  sx={{
                                    fontSize: 50,
                                    color: "#d7a429",
                                    filter:
                                      "drop-shadow(0 3px 4px rgba(0,0,0,.08))",
                                  }}
                                />

                                <Stack direction="row" spacing={0.25}>
                                  <Tooltip title="تعديل">
                                    <IconButton
                                      size="small"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        openDialog("editFolder", folder);
                                      }}
                                      sx={{ color: "#63796f" }}
                                    >
                                      <EditRoundedIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>

                                  <Tooltip title="حذف">
                                    <IconButton
                                      size="small"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        deleteFolder(folder);
                                      }}
                                      sx={{ color: DANGER }}
                                    >
                                      <DeleteOutlineRoundedIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Stack>
                              </Stack>

                              <Box sx={{ mt: 1 }}>
                                <Typography
                                  sx={{
                                    fontFamily: "Cairo",
                                    fontWeight: 950,
                                    color: TEXT,
                                    lineHeight: 1.5,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {folder.name}
                                </Typography>

                                <Stack
                                  direction="row"
                                  justifyContent="space-between"
                                  alignItems="center"
                                  sx={{ mt: 0.3 }}
                                >
                                  <Typography
                                    variant="caption"
                                    sx={{ fontFamily: "Cairo", color: MUTED }}
                                  >
                                    {count} ملف
                                  </Typography>

                                  <Chip
                                    size="small"
                                    label="فتح"
                                    sx={{
                                      height: 22,
                                      fontFamily: "Cairo",
                                      fontWeight: 900,
                                      bgcolor: "#edf5f1",
                                      color: PRIMARY,
                                    }}
                                  />
                                </Stack>
                              </Box>
                            </Paper>
                          );
                        })}
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Box sx={{ p: { xs: 1.5, md: 2 } }}>
                    <Stack
                      direction="row"
                      spacing={1.1}
                      alignItems="center"
                      sx={{ mb: 1.6 }}
                    >
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2.5,
                          bgcolor: "#fff7dc",
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        <FolderOpenRoundedIcon
                          sx={{ color: "#c89512", fontSize: 31 }}
                        />
                      </Box>

                      <Box>
                        <Typography
                          variant="h6"
                          sx={{
                            fontFamily: "Cairo",
                            fontWeight: 950,
                            color: TEXT,
                          }}
                        >
                          {activeFolder.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ fontFamily: "Cairo", color: MUTED }}
                        >
                          {visibleFiles.length} ملف
                        </Typography>
                      </Box>
                    </Stack>

                    {activeFolder.description && (
                      <Typography
                        variant="body2"
                        sx={{ mb: 1.5, fontFamily: "Cairo", color: MUTED }}
                      >
                        {activeFolder.description}
                      </Typography>
                    )}

                    {visibleFiles.length === 0 ? (
                      <Box sx={{ py: 8, textAlign: "center" }}>
                        <InsertDriveFileRoundedIcon
                          sx={{ fontSize: 56, color: "#b7c5bf" }}
                        />
                        <Typography
                          sx={{
                            mt: 1,
                            fontFamily: "Cairo",
                            fontWeight: 850,
                            color: MUTED,
                          }}
                        >
                          {searchText
                            ? "لا توجد ملفات مطابقة للبحث."
                            : "هذا المجلد فارغ. استخدم زر رفع ملفات لإضافة ملفات."}
                        </Typography>
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: {
                            xs: "1fr",
                            sm: "repeat(2, minmax(0, 1fr))",
                            lg: "repeat(3, minmax(0, 1fr))",
                            xl: "repeat(4, minmax(0, 1fr))",
                          },
                          gap: 1.1,
                        }}
                      >
                        {visibleFiles.map((file) => (
                          <Paper
                            key={file.guid}
                            elevation={0}
                            sx={{
                              p: 1.3,
                              borderRadius: 2.8,
                              border: `1px solid ${BORDER}`,
                              bgcolor: "#fcfefd",
                              transition: "all .18s ease",
                              "&:hover": {
                                borderColor: "#b4d0c2",
                                boxShadow: "0 7px 20px rgba(5,116,69,.07)",
                              },
                            }}
                          >
                            <Stack
                              direction="row"
                              spacing={1.1}
                              alignItems="center"
                            >
                              <Box
                                sx={{
                                  width: 48,
                                  height: 48,
                                  borderRadius: 2.5,
                                  bgcolor: WHITE,
                                  border: `1px solid ${BORDER}`,
                                  display: "grid",
                                  placeItems: "center",
                                  flexShrink: 0,
                                }}
                              >
                                {getFileIcon(file)}
                              </Box>

                              <Box sx={{ minWidth: 0, flex: 1 }}>
                                <Tooltip
                                  title={
                                    file.displayName ||
                                    file.originalFileName ||
                                    ""
                                  }
                                >
                                  <Typography
                                    sx={{
                                      fontFamily: "Cairo",
                                      fontWeight: 900,
                                      color: TEXT,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {file.displayName || file.originalFileName}
                                  </Typography>
                                </Tooltip>

                                <Typography
                                  variant="caption"
                                  sx={{ fontFamily: "Cairo", color: MUTED }}
                                >
                                  {formatBytes(file.fileSize)}
                                </Typography>
                              </Box>
                            </Stack>

                            <Stack
                              direction="row"
                              spacing={0.45}
                              justifyContent="flex-end"
                              sx={{ mt: 1.1 }}
                            >
                              <Tooltip title="فتح">
                                <IconButton
                                  size="small"
                                  onClick={() => openFile(file.guid)}
                                  sx={{ color: PRIMARY, bgcolor: "#edf7f2" }}
                                >
                                  <OpenInNewRoundedIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="تنزيل">
                                <IconButton
                                  size="small"
                                  onClick={() => downloadFile(file.guid)}
                                  sx={{ color: "#3276b1", bgcolor: "#edf4fa" }}
                                >
                                  <DownloadRoundedIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="تعديل الاسم">
                                <IconButton
                                  size="small"
                                  onClick={() => openDialog("editFile", file)}
                                  sx={{ color: "#8a6e00", bgcolor: "#fff8d9" }}
                                >
                                  <EditRoundedIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="حذف">
                                <IconButton
                                  size="small"
                                  onClick={() => deleteFile(file)}
                                  sx={{ color: DANGER, bgcolor: "#fff0f0" }}
                                >
                                  <DeleteOutlineRoundedIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </Paper>
                        ))}
                      </Box>
                    )}
                  </Box>
                )}
              </Paper>
            </>
          )}
        </Stack>
      </PageContainer>

      <Dialog sx={uiLayout.dialogLayoutSx}
        open={dialog.open}
        onClose={closeDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontFamily: "Cairo", fontWeight: 950 }}>
          {dialogTitle}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={1.5} sx={uiLayout.withUiSx({ mt: 0.5 }, uiLayout.formGridSx)}>
            <TextField InputLabelProps={{ shrink: true }}
              autoFocus
              label={dialog.mode === "editFile" ? "اسم الملف" : "الاسم"}
              value={dialog.name}
              onChange={(event) =>
                setDialog((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              fullWidth
              inputProps={{ maxLength: dialog.mode === "editFile" ? 250 : 200 }}
              sx={uiLayout.withUiSx({
                "& .MuiOutlinedInput-root": { borderRadius: 2.5 },
                "& .MuiInputBase-input, & .MuiInputLabel-root": {
                  fontFamily: "Cairo",
                },
              }, uiLayout.formFieldSx)}
            />

            {dialog.mode !== "editFile" && (
              <TextField InputLabelProps={{ shrink: true }}
                label="الوصف - اختياري"
                value={dialog.description}
                onChange={(event) =>
                  setDialog((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                fullWidth
                multiline
                minRows={3}
                inputProps={{ maxLength: 500 }}
                sx={uiLayout.withUiSx({
                  "& .MuiOutlinedInput-root": { borderRadius: 2.5 },
                  "& .MuiInputBase-input, & .MuiInputLabel-root": {
                    fontFamily: "Cairo",
                  },
                }, uiLayout.formFieldSx)}
              />
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={uiLayout.withUiSx({ p: 2 }, uiLayout.dialogActionsSx)}>
          <Button
            onClick={closeDialog}
            disabled={busy}
            sx={uiLayout.withUiSx({ fontFamily: "Cairo", fontWeight: 900, color: MUTED }, uiLayout.buttonSx)}
          >
            إلغاء
          </Button>

          <Button
            variant="contained"
            onClick={saveDialog}
            disabled={busy}
            sx={uiLayout.withUiSx({
              minWidth: 110,
              bgcolor: PRIMARY,
              borderRadius: 2.5,
              boxShadow: "none",
              fontFamily: "Cairo",
              fontWeight: 900,
              "&:hover": { bgcolor: PRIMARY_DARK, boxShadow: "none" },
            }, uiLayout.buttonSx)}
          >
            {busy ? (
              <CircularProgress size={20} sx={{ color: WHITE }} />
            ) : (
              "حفظ"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <style>
        {`
          .swal-cairo-popup,
          .swal-cairo-title,
          .swal-cairo-text,
          .swal-cairo-button {
            font-family: Cairo, Arial, sans-serif !important;
          }

          .swal-cairo-popup {
            direction: rtl !important;
          }

          .swal-cairo-title,
          .swal-cairo-text {
            text-align: center !important;
          }
        `}
      </style>
    </Box></NavigationShell>
  );
};

export default CircularsUpload;
