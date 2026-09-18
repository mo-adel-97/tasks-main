import PageContainer from '../components/common/PageContainer';
import * as uiLayout from '../components/common/uiLayout';
import './rtl-forms-fix.css';
import { navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
import React, { useEffect, useMemo, useState } from "react";
import {
  GlobalStyles,
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
  useTheme,
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
  "https://api4.sstli.com"
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
    return String(
      user?.guid ||
      user?.Guid ||
      user?.userGuid ||
      user?.UserGuid ||
      user?.USER_GUID ||
      localStorage.getItem("userGuid") ||
      localStorage.getItem("UserGuid") ||
      ""
    ).trim();
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
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const surfaces = theme.palette.surfaces || {};
  const darkCard = surfaces.card || "#13251d";
  const darkSection = surfaces.section || "#172b22";
  const darkNested = surfaces.nested || "#1b3328";
  const darkHover = surfaces.hover || "#214333";
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

  // جميع مجلدات القسم ترجع من الـ API كقائمة مسطحة ومع كل مجلد parentFolderGuid.
  // بهذه الطريقة نقدر ندخل مجلد داخل مجلد لأي عدد من المستويات بدون حد ثابت.
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

  const folderPath = useMemo(() => {
    if (!activeFolder) return [];

    const byGuid = new Map(
      folders.map((folder) => [String(folder.guid), folder])
    );
    const path = [];
    const visited = new Set();
    let current = activeFolder;

    while (current && !visited.has(String(current.guid))) {
      path.unshift(current);
      visited.add(String(current.guid));

      const parentGuid = String(current.parentFolderGuid || "");
      current = parentGuid ? byGuid.get(parentGuid) || null : null;
    }

    return path;
  }, [folders, activeFolder]);

  const currentFolders = useMemo(() => {
    const parentGuid = String(activeFolder?.guid || "");

    return folders.filter((folder) => {
      const folderParentGuid = String(folder?.parentFolderGuid || "");
      return parentGuid
        ? folderParentGuid === parentGuid
        : !folderParentGuid;
    });
  }, [folders, activeFolder]);

  const visibleFolders = useMemo(() => {
    const search = searchText.trim().toLowerCase();
    if (!search) return currentFolders;

    return currentFolders.filter((folder) =>
      [folder?.name, folder?.description]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search))
    );
  }, [currentFolders, searchText]);

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
    setActiveFolderGuid(activeFolder?.parentFolderGuid || "");
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
            parentFolderGuid: activeFolder?.guid || null,
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
      text: `سيتم حذف المجلد "${folder.name}" وكل المجلدات الفرعية والملفات الموجودة بداخله.`,
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
        setActiveFolderGuid(folder?.parentFolderGuid || "");
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
    <NavigationShell variant="standard" ><Box className="circulars-dark-root"
      dir="rtl"
      sx={{
        minHeight: "100vh",
        bgcolor: isDark ? theme.palette.background.default : PAGE_BG,
        fontFamily: "Cairo, Arial, sans-serif",
      }}
    >

      <GlobalStyles
        styles={{
          ...(isDark
            ? {
                ".circulars-dark-root": {
                  backgroundColor: `${theme.palette.background.default} !important`,
                  color: `${theme.palette.text.primary} !important`
                },

                ".circulars-dark-root .MuiPaper-root, .circulars-dark-root .MuiCard-root": {
                  backgroundColor: `${darkCard} !important`,
                  backgroundImage: "none !important",
                  color: `${theme.palette.text.primary} !important`,
                  borderColor: "#67C99D !important",
                  boxShadow: "none !important"
                },
                ".circulars-dark-root .MuiPaper-root .MuiPaper-root": {
                  backgroundColor: `${darkSection} !important`
                },

                ".circulars-dark-root .MuiButton-root, .MuiDialog-paper .MuiButton-root, .MuiPopover-paper .MuiButton-root": {
                  backgroundColor: "transparent !important",
                  backgroundImage: "none !important",
                  color: "#9BE0C1 !important",
                  border: "1px solid #67C99D !important",
                  boxShadow: "none !important",
                  borderRadius: "9px !important"
                },
                ".circulars-dark-root .MuiButton-root:hover, .MuiDialog-paper .MuiButton-root:hover, .MuiPopover-paper .MuiButton-root:hover": {
                  backgroundColor: "transparent !important",
                  color: "#C9F2DF !important",
                  borderColor: "#67C99D !important",
                  boxShadow: "0 0 0 1px rgba(103,201,157,.16) !important"
                },
                ".circulars-dark-root .MuiButton-root.Mui-disabled, .MuiDialog-paper .MuiButton-root.Mui-disabled": {
                  backgroundColor: "transparent !important",
                  color: "rgba(155,224,193,.42) !important",
                  borderColor: "rgba(103,201,157,.34) !important"
                },

                ".circulars-dark-root .MuiIconButton-root, .MuiDialog-paper .MuiIconButton-root": {
                  backgroundColor: "transparent !important",
                  backgroundImage: "none !important",
                  color: "#9BE0C1 !important",
                  border: "1px solid #67C99D !important",
                  boxShadow: "none !important"
                },
                ".circulars-dark-root .MuiIconButton-root:hover, .MuiDialog-paper .MuiIconButton-root:hover": {
                  backgroundColor: "transparent !important",
                  color: "#C9F2DF !important"
                },

                ".circulars-dark-root .MuiChip-root, .MuiDialog-paper .MuiChip-root": {
                  backgroundColor: "transparent !important",
                  backgroundImage: "none !important",
                  color: "#9BE0C1 !important",
                  border: "1px solid #67C99D !important",
                  boxShadow: "none !important"
                },

                ".circulars-dark-root .MuiTabs-root, .MuiDialog-paper .MuiTabs-root": {
                  backgroundColor: `${darkSection} !important`,
                  backgroundImage: "none !important",
                  border: "1px solid #67C99D !important",
                  borderRadius: "10px !important"
                },
                ".circulars-dark-root .MuiTab-root, .MuiDialog-paper .MuiTab-root": {
                  backgroundColor: "transparent !important",
                  color: `${theme.palette.text.secondary} !important`
                },
                ".circulars-dark-root .MuiTab-root.Mui-selected, .MuiDialog-paper .MuiTab-root.Mui-selected": {
                  backgroundColor: "transparent !important",
                  color: "#9BE0C1 !important"
                },
                ".circulars-dark-root .MuiTabs-indicator, .MuiDialog-paper .MuiTabs-indicator": {
                  backgroundColor: "#67C99D !important",
                  height: "2px !important"
                },

                ".circulars-dark-root .MuiOutlinedInput-root, .MuiDialog-paper .MuiOutlinedInput-root, .MuiPopover-paper .MuiOutlinedInput-root": {
                  backgroundColor: "transparent !important",
                  backgroundImage: "none !important",
                  color: `${theme.palette.text.primary} !important`
                },
                ".circulars-dark-root .MuiOutlinedInput-notchedOutline, .MuiDialog-paper .MuiOutlinedInput-notchedOutline, .MuiPopover-paper .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#67C99D !important",
                  borderWidth: "1px !important"
                },
                ".circulars-dark-root .MuiInputLabel-root, .MuiDialog-paper .MuiInputLabel-root, .MuiPopover-paper .MuiInputLabel-root, .circulars-dark-root .MuiFormHelperText-root": {
                  color: `${theme.palette.text.secondary} !important`
                },
                ".circulars-dark-root .MuiInputLabel-root.Mui-focused, .MuiDialog-paper .MuiInputLabel-root.Mui-focused": {
                  color: "#9BE0C1 !important"
                },
                ".circulars-dark-root .MuiInputAdornment-root, .circulars-dark-root .MuiInputAdornment-root .MuiSvgIcon-root, .circulars-dark-root .MuiSelect-icon, .MuiDialog-paper .MuiSelect-icon": {
                  color: "#9BE0C1 !important"
                },

                ".circulars-dark-root .MuiAlert-root, .MuiDialog-paper .MuiAlert-root": {
                  backgroundColor: "transparent !important",
                  backgroundImage: "none !important",
                  color: `${theme.palette.text.primary} !important`,
                  border: "1px solid #67C99D !important",
                  boxShadow: "none !important"
                },
                ".circulars-dark-root .MuiAlert-icon, .circulars-dark-root .MuiCircularProgress-root, .MuiDialog-paper .MuiCircularProgress-root": {
                  color: "#67C99D !important"
                },

                ".circulars-dark-root .MuiDivider-root, .MuiDialog-paper .MuiDivider-root": {
                  borderColor: "#67C99D !important"
                },

                ".MuiDialog-paper": {
                  backgroundColor: `${darkCard} !important`,
                  backgroundImage: "none !important",
                  color: `${theme.palette.text.primary} !important`,
                  border: "1px solid #67C99D !important",
                  boxShadow: "0 18px 50px rgba(2,18,12,.34) !important"
                },
                ".MuiDialogTitle-root": {
                  backgroundColor: `${darkSection} !important`,
                  backgroundImage: "none !important",
                  color: `${theme.palette.text.primary} !important`,
                  borderBottom: "1px solid #67C99D !important"
                },
                ".MuiDialogContent-root": {
                  backgroundColor: `${darkCard} !important`,
                  color: `${theme.palette.text.primary} !important`
                },
                ".MuiDialogActions-root": {
                  backgroundColor: `${darkSection} !important`,
                  borderTop: "1px solid #67C99D !important"
                },

                ".MuiMenu-paper, .MuiPopover-paper, .MuiAutocomplete-paper": {
                  backgroundColor: `${darkSection} !important`,
                  backgroundImage: "none !important",
                  color: `${theme.palette.text.primary} !important`,
                  border: "1px solid #67C99D !important"
                },
                ".MuiMenuItem-root, .MuiAutocomplete-option": {
                  backgroundColor: "transparent !important",
                  color: `${theme.palette.text.primary} !important`
                },
                ".MuiMenuItem-root:hover, .MuiAutocomplete-option:hover": {
                  backgroundColor: `${darkHover} !important`
                },
                ".MuiMenuItem-root.Mui-selected, .MuiAutocomplete-option[aria-selected='true']": {
                  backgroundColor: "transparent !important",
                  color: "#9BE0C1 !important"
                },

                ".swal2-popup": {
                  backgroundColor: `${darkCard} !important`,
                  backgroundImage: "none !important",
                  color: `${theme.palette.text.primary} !important`,
                  border: "1px solid #67C99D !important"
                },
                ".swal2-title, .swal2-html-container, .swal2-input-label": {
                  color: `${theme.palette.text.primary} !important`
                },
                ".swal2-confirm, .swal2-deny, .swal2-cancel, .swal-cairo-button": {
                  backgroundColor: "transparent !important",
                  backgroundImage: "none !important",
                  color: "#9BE0C1 !important",
                  border: "1px solid #67C99D !important",
                  boxShadow: "none !important"
                },
                ".swal2-input, .swal2-textarea, .swal2-select": {
                  backgroundColor: "transparent !important",
                  color: `${theme.palette.text.primary} !important`,
                  border: "1px solid #67C99D !important",
                  boxShadow: "none !important"
                }
              }
            : {})
        }}
      />

      

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
              borderRadius: 2,
              border: `1px solid ${isDark ? "#67C99D" : BORDER}`,
              bgcolor: isDark ? darkCard : WHITE,
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
                    bgcolor: isDark ? darkNested : "#e9f5ef",
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
                    sx={{ fontFamily: "Cairo", fontWeight: 950, color: isDark ? theme.palette.text.primary : TEXT }}
                  >
                    إدارة مكتبة المحتوى
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ fontFamily: "Cairo", color: isDark ? theme.palette.text.secondary : MUTED }}
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
                  variant={isDark ? "outlined" : "contained"}
                  startIcon={<AddRoundedIcon />}
                  onClick={() => openDialog("createTab")}
                  disabled={loading || busy || forbidden}
                  sx={uiLayout.withUiSx({
                    bgcolor: isDark ? "transparent" : PRIMARY,
                    borderRadius: 2.5,
                    boxShadow: "none",
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    "&:hover": { bgcolor: isDark ? "transparent" : PRIMARY_DARK, boxShadow: "none" },
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
                    borderColor: isDark ? "#67C99D" : BORDER,
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
              sx={{ borderRadius: 2, fontFamily: "Cairo" }}
            >
              {successMessage}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ borderRadius: 2, fontFamily: "Cairo" }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Paper
              elevation={0}
              sx={{
                minHeight: 360,
                borderRadius: 2,
                border: `1px solid ${isDark ? "#67C99D" : BORDER}`,
                display: "grid",
                placeItems: "center",
                bgcolor: isDark ? darkCard : WHITE,
              }}
            >
              <Stack alignItems="center" spacing={1.3}>
                <CircularProgress sx={{ color: PRIMARY }} />
                <Typography sx={{ fontFamily: "Cairo", color: isDark ? theme.palette.text.secondary : MUTED }}>
                  جاري تحميل إدارة مكتبة المحتوى...
                </Typography>
              </Stack>
            </Paper>
          ) : forbidden ? (
            <Paper
              elevation={0}
              sx={{
                minHeight: 340,
                borderRadius: 2,
                border: `1px solid ${isDark ? "#67C99D" : BORDER}`,
                display: "grid",
                placeItems: "center",
                bgcolor: isDark ? darkCard : WHITE,
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
                <Typography sx={{ fontFamily: "Cairo", color: isDark ? theme.palette.text.secondary : MUTED }}>
                  هذه الصفحة تحتاج صلاحية إدارة المحتوى والملفات.
                </Typography>
              </Stack>
            </Paper>
          ) : tree.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                minHeight: 360,
                borderRadius: 2,
                border: `1px dashed ${isDark ? "#67C99D" : BORDER}`,
                display: "grid",
                placeItems: "center",
                bgcolor: isDark ? darkCard : WHITE,
                textAlign: "center",
                p: 3,
              }}
            >
              <Box>
                <FolderRoundedIcon sx={{ fontSize: 62, color: "#a9bbb3" }} />
                <Typography
                  variant="h6"
                  sx={{ mt: 1, fontFamily: "Cairo", fontWeight: 900, color: isDark ? theme.palette.text.primary : TEXT }}
                >
                  لا توجد أقسام بعد
                </Typography>
                <Button
                  variant={isDark ? "outlined" : "contained"}
                  startIcon={<AddRoundedIcon />}
                  onClick={() => openDialog("createTab")}
                  sx={uiLayout.withUiSx({
                    mt: 1.5,
                    bgcolor: isDark ? "transparent" : PRIMARY,
                    borderRadius: 2.5,
                    boxShadow: "none",
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    "&:hover": { bgcolor: isDark ? "transparent" : PRIMARY_DARK, boxShadow: "none" },
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
                  borderRadius: 2,
                  border: `1px solid ${isDark ? "#67C99D" : BORDER}`,
                  bgcolor: isDark ? darkCard : WHITE,
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
                      bgcolor: isDark ? "transparent" : "#eef7f2",
                    },
                    "& .MuiTabs-indicator": {
                      height: 3,
                      bgcolor: isDark ? "transparent" : PRIMARY,
                      borderRadius: 2,
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
                  borderRadius: 2,
                  border: `1px solid ${isDark ? "#67C99D" : BORDER}`,
                  bgcolor: isDark ? darkCard : WHITE,
                  overflow: "hidden",
                  minHeight: 520,
                }}
              >
                <Box
                  sx={{
                    px: { xs: 1.5, md: 2 },
                    py: 1.2,
                    borderBottom: `1px solid ${isDark ? "#67C99D" : BORDER}`,
                    bgcolor: isDark ? darkSection : "#fbfdfc",
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
                        sx={{ fontFamily: "Cairo", color: isDark ? theme.palette.text.secondary : MUTED, whiteSpace: "nowrap" }}
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

                      {folderPath.map((folder, index) => (
                        <React.Fragment key={folder.guid}>
                          <Typography sx={{ color: "#a3b2ac" }}>/</Typography>
                          <Button
                            onClick={() => {
                              setActiveFolderGuid(folder.guid);
                              setSearchText("");
                            }}
                            disabled={index === folderPath.length - 1}
                            sx={uiLayout.withUiSx({
                              minWidth: 0,
                              maxWidth: { xs: 110, sm: 180 },
                              px: 0.35,
                              color:
                                index === folderPath.length - 1
                                  ? TEXT
                                  : MUTED,
                              fontFamily: "Cairo",
                              fontWeight:
                                index === folderPath.length - 1 ? 950 : 800,
                              justifyContent: "flex-start",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }, uiLayout.buttonSx)}
                          >
                            {folder.name}
                          </Button>
                        </React.Fragment>
                      ))}
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
                            ? "ابحث في المجلدات والملفات..."
                            : "ابحث في المجلدات..."
                        }
                        sx={uiLayout.withUiSx({
                          width: { xs: "100%", sm: 270 },
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2.5,
                            bgcolor: isDark ? darkCard : WHITE,
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

                      <Button
                        variant={isDark ? "outlined" : "contained"}
                        startIcon={<CreateNewFolderRoundedIcon />}
                        onClick={() => openDialog("createFolder")}
                        disabled={busy || !activeTab}
                        sx={uiLayout.withUiSx({
                          bgcolor: isDark ? "transparent" : PRIMARY,
                          borderRadius: 2.5,
                          boxShadow: "none",
                          fontFamily: "Cairo",
                          fontWeight: 900,
                          "&:hover": {
                            bgcolor: isDark ? "transparent" : PRIMARY_DARK,
                            boxShadow: "none",
                          },
                          "& .MuiButton-startIcon": { ml: 0.5, mr: 0 },
                        }, uiLayout.buttonSx)}
                      >
                        {activeFolder ? "مجلد فرعي جديد" : "مجلد جديد"}
                      </Button>

                      {!activeFolder ? (
                        <>
                          <Button
                            variant="outlined"
                            startIcon={<EditRoundedIcon />}
                            onClick={() => openDialog("editTab", activeTab)}
                            disabled={busy || !activeTab}
                            sx={uiLayout.withUiSx({
                              borderRadius: 2.5,
                              borderColor: isDark ? "#67C99D" : BORDER,
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
                            variant={isDark ? "outlined" : "contained"}
                            startIcon={<CloudUploadRoundedIcon />}
                            disabled={busy}
                            sx={uiLayout.withUiSx({
                              bgcolor: isDark ? "transparent" : PRIMARY,
                              borderRadius: 2.5,
                              boxShadow: "none",
                              fontFamily: "Cairo",
                              fontWeight: 900,
                              "&:hover": {
                                bgcolor: isDark ? "transparent" : PRIMARY_DARK,
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
                                border: `1px solid ${isDark ? "#67C99D" : BORDER}`,
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

                <Box sx={{ p: { xs: 1.5, md: 2 } }}>
                  {activeFolder ? (
                    <>
                      <Stack
                        direction="row"
                        spacing={1.1}
                        alignItems="center"
                        sx={{ mb: 1.4 }}
                      >
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2.5,
                            bgcolor: isDark ? darkNested : "#fff7dc",
                            display: "grid",
                            placeItems: "center",
                            flexShrink: 0,
                          }}
                        >
                          <FolderOpenRoundedIcon
                            sx={{ color: "#c89512", fontSize: 31 }}
                          />
                        </Box>

                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            variant="h6"
                            sx={{
                              fontFamily: "Cairo",
                              fontWeight: 950,
                              color: isDark ? theme.palette.text.primary : TEXT,
                              lineHeight: 1.35,
                            }}
                          >
                            {activeFolder.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ fontFamily: "Cairo", color: isDark ? theme.palette.text.secondary : MUTED }}
                          >
                            {currentFolders.length} مجلد فرعي •{" "}
                            {Array.isArray(activeFolder.files)
                              ? activeFolder.files.length
                              : 0}{" "}
                            ملف
                          </Typography>
                        </Box>
                      </Stack>

                      {activeFolder.description && (
                        <Typography
                          variant="body2"
                          sx={{ mb: 1.5, fontFamily: "Cairo", color: isDark ? theme.palette.text.secondary : MUTED }}
                        >
                          {activeFolder.description}
                        </Typography>
                      )}
                    </>
                  ) : (
                    activeTab?.description && (
                      <Typography
                        variant="body2"
                        sx={{ mb: 1.5, fontFamily: "Cairo", color: isDark ? theme.palette.text.secondary : MUTED }}
                      >
                        {activeTab.description}
                      </Typography>
                    )
                  )}

                  {visibleFolders.length > 0 && (
                    <Box sx={{ mb: activeFolder ? 2 : 0 }}>
                      {activeFolder && (
                        <Typography
                          sx={{
                            mb: 1,
                            fontFamily: "Cairo",
                            fontWeight: 950,
                            color: isDark ? theme.palette.text.primary : TEXT,
                          }}
                        >
                          المجلدات الفرعية
                        </Typography>
                      )}

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
                          const fileCount = Array.isArray(folder.files)
                            ? folder.files.length
                            : 0;
                          const subFolderCount = folders.filter(
                            (candidate) =>
                              String(candidate?.parentFolderGuid || "") ===
                              String(folder.guid)
                          ).length;

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
                                borderRadius: 2,
                                border: `1px solid ${isDark ? "#67C99D" : BORDER}`,
                                bgcolor: isDark ? darkCard : "#fcfefd",
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
                                  bgcolor: isDark ? darkCard : "#ffffff",
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
                                    color: isDark ? theme.palette.text.primary : TEXT,
                                    lineHeight: 1.5,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {folder.name}
                                </Typography>

                                <Typography
                                  variant="caption"
                                  sx={{ fontFamily: "Cairo", color: isDark ? theme.palette.text.secondary : MUTED }}
                                >
                                  {subFolderCount} مجلد • {fileCount} ملف
                                </Typography>
                              </Box>
                            </Paper>
                          );
                        })}
                      </Box>
                    </Box>
                  )}

                  {activeFolder && visibleFiles.length > 0 && (
                    <Box>
                      <Typography
                        sx={{
                          mb: 1,
                          fontFamily: "Cairo",
                          fontWeight: 950,
                          color: isDark ? theme.palette.text.primary : TEXT,
                        }}
                      >
                        الملفات
                      </Typography>

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
                              borderRadius: 2,
                              border: `1px solid ${isDark ? "#67C99D" : BORDER}`,
                              bgcolor: isDark ? darkCard : "#fcfefd",
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
                                  bgcolor: isDark ? darkCard : WHITE,
                                  border: `1px solid ${isDark ? "#67C99D" : BORDER}`,
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
                                      color: isDark ? theme.palette.text.primary : TEXT,
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
                                  sx={{ fontFamily: "Cairo", color: isDark ? theme.palette.text.secondary : MUTED }}
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
                    </Box>
                  )}

                  {visibleFolders.length === 0 &&
                    (!activeFolder || visibleFiles.length === 0) && (
                      <Box sx={{ py: 8, textAlign: "center" }}>
                        {activeFolder ? (
                          <InsertDriveFileRoundedIcon
                            sx={{ fontSize: 56, color: "#b7c5bf" }}
                          />
                        ) : (
                          <FolderRoundedIcon
                            sx={{ fontSize: 58, color: "#b4c4bd" }}
                          />
                        )}
                        <Typography
                          sx={{
                            mt: 1,
                            fontFamily: "Cairo",
                            fontWeight: 850,
                            color: isDark ? theme.palette.text.secondary : MUTED,
                          }}
                        >
                          {searchText
                            ? "لا توجد مجلدات أو ملفات مطابقة للبحث."
                            : activeFolder
                              ? "هذا المجلد فارغ. يمكنك إنشاء مجلد فرعي أو رفع ملفات."
                              : "لا توجد مجلدات داخل هذا القسم."}
                        </Typography>
                      </Box>
                    )}
                </Box>
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
            sx={uiLayout.withUiSx({ fontFamily: "Cairo", fontWeight: 900, color: isDark ? theme.palette.text.secondary : MUTED }, uiLayout.buttonSx)}
          >
            إلغاء
          </Button>

          <Button
            variant={isDark ? "outlined" : "contained"}
            onClick={saveDialog}
            disabled={busy}
            sx={uiLayout.withUiSx({
              minWidth: 110,
              bgcolor: isDark ? "transparent" : PRIMARY,
              borderRadius: 2.5,
              boxShadow: "none",
              fontFamily: "Cairo",
              fontWeight: 900,
              "&:hover": { bgcolor: isDark ? "transparent" : PRIMARY_DARK, boxShadow: "none" },
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
