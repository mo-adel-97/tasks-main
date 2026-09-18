import { DESKTOP_BREAKPOINT } from '../config/sidebarLayout';
import { pinColor } from '../config/themeColors';
import * as uiLayout from './common/uiLayout';
import React, { useEffect, useMemo, useRef, useState } from "react";
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
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FolderSharedIcon from "@mui/icons-material/FolderShared";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import RefreshIcon from "@mui/icons-material/Refresh";
import SchoolIcon from "@mui/icons-material/School";
import GroupsIcon from "@mui/icons-material/Groups";
import EventIcon from "@mui/icons-material/Event";
import NotesIcon from "@mui/icons-material/Notes";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const primaryColor = "#057546";
const primaryDark = "#034d31";
const primaryLight = "#e6f3ee";
const accentColor = "#ae1e21";
// Always-visible focus-green outline (never hover/focus-only) for every field
// and the dialog frame itself — matches the reference styling on the Home page.
const FOCUS_BORDER_SX = (theme) => (theme.palette.mode !== "dark" ? {} : {
  "& .MuiDialog-paper": { border: "1px solid #67C99D" },
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#67C99D" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#67C99D" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#67C99D" }
});
const whiteColor = "#fefefe";
const softBg = "#fefefe";
const textColor = "#1f2d3d";
const dangerColor = accentColor;
const warningColor = accentColor;
const noGuid = "00000000-0000-0000-0000-000000000000";

const safeText = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
};

const pick = (obj, ...names) => {
  for (const name of names) {
    const value = obj?.[name];
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  return "";
};

const showWarning = (message) =>
  Swal.fire({
    icon: "warning",
    title: "تنبيه",
    text: message,
    confirmButtonText: "حسناً",
    confirmButtonColor: warningColor
  });

const showError = (message) =>
  Swal.fire({
    icon: "error",
    title: "خطأ",
    text: message,
    confirmButtonText: "حسناً",
    confirmButtonColor: accentColor
  });

const showSuccess = (message) =>
  Swal.fire({
    icon: "success",
    title: "تم بنجاح",
    text: message,
    confirmButtonText: "حسناً",
    confirmButtonColor: primaryColor
  });

const FieldBox = ({ label, value, icon, strong = false, color = textColor }) => (
  <Paper
    elevation={0}
    sx={(theme) => {
      const isDark = theme.palette.mode === "dark";
      return {
      p: 1.4,
      borderRadius: 3,
      [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
        p: 0.5,
        borderRadius: 1.35,
        minHeight: 48
      },
      "@media (max-width:599px)": {
        p: 0.35,
        minHeight: 44
      },
      border: isDark ? `1px solid #67C99D` : `1px solid ${primaryLight}`,
      background: isDark
        ? (strong ? "rgba(229,90,90,.1)" : theme.palette.surfaces.card)
        : (strong
          ? `linear-gradient(135deg, #fff6f6 0%, ${whiteColor} 100%)`
          : `linear-gradient(135deg, #f4fbf7 0%, ${whiteColor} 100%)`),
      height: "100%",
      position: "relative",
      overflow: "hidden"
      };
    }}
  >
    <Stack
      direction="row"
      spacing={0.8}
      alignItems="center"
      sx={{
        mb: 0.7,
        [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: { mb: 0.18, gap: "4px !important" }
      }}
    >
      {icon}
      <Typography
        sx={{
          color: primaryColor,
          fontWeight: 950,
          fontSize: "0.78rem",
          lineHeight: 1.1,
          [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: { fontSize: "0.75rem" },
          "@media (max-width:599px)": { fontSize: "0.75rem" }
        }}
      >
        {label}
      </Typography>
    </Stack>
    <Tooltip title={safeText(value)} arrow>
      <Typography
        sx={{
          color,
          fontWeight: strong ? 1000 : 950,
          fontSize: strong ? "1rem" : "0.92rem",
          lineHeight: 1.7,
          [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
            fontSize: strong ? "0.75rem" : "0.75rem",
            lineHeight: 1.2
          },
          "@media (max-width:599px)": {
            fontSize: strong ? "0.75rem" : "0.75rem"
          },
          textAlign: "start",
          direction: "rtl",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis"
        }}
      >
        <bdi dir="auto">{safeText(value)}</bdi>
      </Typography>
    </Tooltip>
  </Paper>
);

const statusChipSx = (value, isDark = false) => {
  const text = String(value || "");

  if (text.includes("مستمر") || text.includes("نشط")) {
    return { color: isDark ? "#67c99d" : primaryColor, backgroundColor: isDark ? "rgba(103,201,157,.14)" : "#e6f3ee" };
  }

  if (text.includes("موقوف") || text.includes("منتهي") || text.includes("منتهى")) {
    return { color: isDark ? "#e57373" : dangerColor, backgroundColor: isDark ? "rgba(229,90,90,.14)" : "#fff4f4" };
  }

  return { color: isDark ? "#f0ad4e" : warningColor, backgroundColor: isDark ? "rgba(237,137,54,.14)" : "#fff4f4" };
};

const StudentStudyFileDialog = ({ open, onClose, student, apiBaseUrl }) => {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(`(min-width:600px) and (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`);
  const isCompact = isPhone || isTablet;

  const [loading, setLoading] = useState(false);
  const [savingClass, setSavingClass] = useState(false);
  const [studyInfo, setStudyInfo] = useState(null);
  const [manualClassGuid, setManualClassGuid] = useState("");

  const getResponsiveSwalOptions = () => {
    if (!isCompact) return {};

    return {
      width: isPhone ? "82vw" : "420px",
      padding: isPhone ? "0.65rem" : "0.85rem",
      customClass: {
        popup: "sstli-study-swal",
        icon: "sstli-study-swal-icon",
        title: "sstli-study-swal-title",
        htmlContainer: "sstli-study-swal-text",
        actions: "sstli-study-swal-actions",
        confirmButton: "sstli-study-swal-confirm",
        cancelButton: "sstli-study-swal-cancel"
      }
    };
  };

  const studentGuid = useMemo(
    () => pick(student, "accountGuid", "AccountGuid", "studentGuid", "StudentGuid"),
    [student]
  );
  const diplomGuid = useMemo(() => pick(student, "diplomGuid", "DiplomGuid"), [student]);
  const branchGuid = useMemo(
    () => pick(student, "branchGuid", "BranchGuid", "studyBranchGuid", "StudyBranchGuid"),
    [student]
  );
  const nationalId = useMemo(() => pick(student, "nationalId", "NationalId"), [student]);

  const canLoad = Boolean(studentGuid && diplomGuid && branchGuid);

  const loadStudyInfo = async () => {
    if (!open || !student) return;

    if (!canLoad) {
      setStudyInfo(null);
      showWarning("لا يمكن قراءة بيانات الملف التدريبي: ناقص حساب الطالب أو الدبلوم أو الفرع.");
      return;
    }

    try {
      setLoading(true);
      setStudyInfo(null);

      const params = new URLSearchParams({
        studentGuid,
        diplomGuid,
        branchGuid
      });

      const response = await fetch(`${apiBaseUrl}/api/student-study-file/info?${params.toString()}`);
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message || result?.error || "تعذر تحميل الملف التدريبي");
      }

      setStudyInfo(result?.data || null);
      setManualClassGuid(result?.data?.classGuid || "");
    } catch (error) {
      showError(error.message || "حدث خطأ أثناء تحميل الملف التدريبي");
      setStudyInfo(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) loadStudyInfo();
    else {
      setStudyInfo(null);
      setManualClassGuid("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, studentGuid, diplomGuid, branchGuid]);

  // Lazy-mount guard: this dialog is mounted eagerly (but closed) as soon
  // as the parent page loads, so skip building its JSX until it has
  // actually been opened once. Once opened, later closes still render
  // normally so the MUI exit transition keeps working.
  const hasOpenedRef = useRef(open);
  if (open) hasOpenedRef.current = true;
  if (!hasOpenedRef.current) return null;

  const openAttachments = async () => {
    const id = String(nationalId || "").trim();

    if (!id) {
      showWarning("برجاء اختيار الطالب أولاً.");
      return;
    }

    if (!/^\d+$/.test(id)) {
      showWarning("رقم الهوية غير صحيح.");
      return;
    }

    try {
      const params = new URLSearchParams({ nationalId: id });
      const response = await fetch(`${apiBaseUrl}/api/student-study-file/attachments-url?${params.toString()}`);
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message || result?.error || "تعذر تجهيز رابط المرفقات");
      }

      const url = result?.url;
      if (!url) {
        showWarning("لم يتم تجهيز رابط المرفقات.");
        return;
      }

      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      showError(error.message || "حدث خطأ أثناء عرض المرفقات");
    }
  };

  const updateClass = async () => {
    const regType = String(studyInfo?.regType ?? "");

    if (regType !== "0") {
      showWarning("الملف التدريبي للطالب غير مسموح له ربط بشعبة.");
      return;
    }

    const classGuid = String(manualClassGuid || "").trim();

    if (!studyInfo?.guid || studyInfo.guid === noGuid) {
      showWarning("لا يمكن قراءة Guid الملف التدريبي.");
      return;
    }

    if (!classGuid || classGuid === noGuid) {
      showWarning("برجاء إدخال ClassGuid للشعبة المراد ربطها.");
      return;
    }

    const confirm = await Swal.fire({
      ...getResponsiveSwalOptions(),
      icon: "question",
      title: "ربط المتدرب بشعبة",
      text: "هل تريد ربط الطالب بالشعبة المحددة؟",
      showCancelButton: true,
      confirmButtonText: "نعم، ربط",
      cancelButtonText: "تراجع",
      confirmButtonColor: primaryColor,
      cancelButtonColor: "#777",
      reverseButtons: true
    });

    if (!confirm.isConfirmed) return;

    try {
      setSavingClass(true);

      const response = await fetch(`${apiBaseUrl}/api/student-study-file/class`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guid: studyInfo.guid,
          classGuid,
          isReg: true
        })
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message || result?.error || "تعذر ربط الطالب بالشعبة");
      }

      await showSuccess(result?.message || "تم ربط الطالب بالشعبة بنجاح");
      await loadStudyInfo();
    } catch (error) {
      showError(error.message || "حدث خطأ أثناء ربط الطالب بالشعبة");
    } finally {
      setSavingClass(false);
    }
  };

  return (
    <>
      <style>
        {`
          @media screen {
            .sstli-study-swal {
              max-width: 420px !important;
              border-radius: 14px !important;
              font-family: Cairo, Arial, sans-serif !important;
            }
            .sstli-study-swal-icon {
              width: 3.4em !important;
              height: 3.4em !important;
              margin: 0.6em auto 0.25em !important;
            }
            .sstli-study-swal-icon .swal2-icon-content {
              font-size: 2.3em !important;
            }
            .sstli-study-swal-title {
              font-size: 0.95rem !important;
              line-height: 1.2 !important;
              padding-top: 0.2em !important;
            }
            .sstli-study-swal-text {
              font-size: 0.68rem !important;
              line-height: 1.4 !important;
              padding: 0 0.75em !important;
            }
            .sstli-study-swal-actions {
              margin-top: 0.65em !important;
              gap: 0.35rem !important;
            }
            .sstli-study-swal-confirm,
            .sstli-study-swal-cancel {
              min-width: 76px !important;
              min-height: 31px !important;
              padding: 0.38rem 0.75rem !important;
              margin: 0 !important;
              font-size: 0.66rem !important;
              border-radius: 8px !important;
              font-weight: 900 !important;
            }
          }

          @media (max-width: 599px) {
            .sstli-study-swal {
              width: 82vw !important;
              max-width: 300px !important;
              border-radius: 12px !important;
            }
            .sstli-study-swal-icon {
              width: 3em !important;
              height: 3em !important;
              margin: 0.5em auto 0.2em !important;
            }
            .sstli-study-swal-icon .swal2-icon-content {
              font-size: 2em !important;
            }
            .sstli-study-swal-title {
              font-size: 0.8rem !important;
            }
            .sstli-study-swal-text {
              font-size: 0.57rem !important;
              padding: 0 0.5em !important;
            }
            .sstli-study-swal-confirm,
            .sstli-study-swal-cancel {
              min-width: 64px !important;
              min-height: 28px !important;
              padding: 0.32rem 0.55rem !important;
              font-size: 0.56rem !important;
            }
          }
        `}
      </style>

      <Dialog
      open={open}
      onClose={() => !loading && !savingClass && onClose?.()}
      fullWidth
      maxWidth="md"
      fullScreen={isPhone}
      sx={uiLayout.withUiSx({
        "& .MuiDialog-container": {
          pt: isPhone ? "58px" : isTablet ? "64px" : 1.5,
          px: isPhone ? 0 : isTablet ? 0.5 : 1.5,
          pb: isPhone ? 0 : isTablet ? 0.5 : 1.5,
          alignItems: isPhone ? "stretch" : "center"
        }
      }, uiLayout.dialogLayoutSx, FOCUS_BORDER_SX)}
      PaperProps={{
        sx: {
          width: isPhone ? "100vw" : isTablet ? "94vw" : undefined,
          maxWidth: isPhone ? "100vw" : isTablet ? "980px" : undefined,
          height: isPhone
            ? "calc(100dvh - 58px)"
            : isTablet
              ? "calc(100dvh - 72px)"
              : "88vh",
          maxHeight: isPhone
            ? "calc(100dvh - 58px)"
            : isTablet
              ? "calc(100dvh - 72px)"
              : "88vh",
          m: 0,
          borderRadius: isPhone ? 0 : isTablet ? 2 : 4,
          direction: "rtl",
          textAlign: "start",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          border: (theme) => theme.palette.mode === "dark" ? "1px solid #67C99D" : `1px solid ${primaryLight}`,
          boxShadow: "0 18px 50px rgba(5,117,70,0.16)"
        }
      }}
    >
      <DialogTitle
        sx={{
          p: 0,
          borderBottom: `1px solid ${primaryDark}`,
          background: `linear-gradient(135deg, ${primaryColor}, ${primaryDark})`
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            px: isPhone ? 0.45 : isTablet ? 0.7 : 2,
            py: isPhone ? 0.35 : isTablet ? 0.5 : 1.4,
            gap: isCompact ? 0.3 : 1
          }}
        >
          <Stack direction="row" spacing={isCompact ? 0.3 : 1.2} alignItems="center" sx={{ minWidth: 0 }}>
            <IconButton
              onClick={onClose}
              disabled={loading || savingClass}
              sx={{
                color: accentColor,
                backgroundColor: pinColor(whiteColor),
                width: isPhone ? 25 : isTablet ? 29 : undefined,
                height: isPhone ? 25 : isTablet ? 29 : undefined,
                p: isCompact ? 0.2 : undefined,
                "& svg": { fontSize: isPhone ? 14 : isTablet ? 16 : undefined },
                "&:hover": { backgroundColor: pinColor("#fff4f4") }
              }}
            >
              <CloseIcon />
            </IconButton>
            <Box>
              <Typography
                sx={{
                  fontWeight: 1000,
                  color: pinColor(whiteColor),
                  fontSize: isPhone ? "0.75rem" : isTablet ? "0.78rem" : "1.15rem",
                  lineHeight: 1.1
                }}
              >
                الملف التدريبي
              </Typography>
              <Typography
                sx={{
                  fontWeight: 800,
                  color: pinColor("#e6f3ee"),
                  fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : "0.82rem",
                  lineHeight: 1.1,
                  display: isPhone ? "none" : "block"
                }}
              >
                بيانات الدراسة + عرض مرفقات الطالب
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={isCompact ? 0.22 : 1} alignItems="center">
            <Chip
              icon={<SchoolIcon />}
              label={safeText(studyInfo?.stautName || pick(student, "statusName", "stautName"))}
              sx={(theme) => ({
                fontWeight: 950,
                borderRadius: isCompact ? 1.1 : 2,
                height: isPhone ? 21 : isTablet ? 24 : undefined,
                fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
                "& .MuiChip-label": {
                  px: isPhone ? 0.45 : isTablet ? 0.6 : undefined
                },
                "& .MuiChip-icon": {
                  fontSize: isPhone ? 13 : isTablet ? 15 : undefined
                },
                ...statusChipSx(studyInfo?.stautName, theme.palette.mode === "dark")
              })}
            />
            <Button
              size="small"
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadStudyInfo}
              disabled={loading || savingClass}
              sx={uiLayout.withUiSx({
                borderRadius: isCompact ? 1.1 : 2,
                fontWeight: 950,
                minWidth: isPhone ? 48 : isTablet ? 58 : undefined,
                height: isPhone ? 25 : isTablet ? 29 : undefined,
                px: isPhone ? 0.4 : isTablet ? 0.6 : undefined,
                fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
                direction: "rtl",
                color: pinColor(whiteColor),
                borderColor: pinColor("#e6f3ee"),
                "&:hover": { borderColor: pinColor(whiteColor), backgroundColor: "rgba(255,255,255,0.10)" }
              }, uiLayout.buttonSx)}
            >
              تحديث
            </Button>
          </Stack>
        </Stack>
      </DialogTitle>

      <DialogContent
        dividers
        sx={(theme) => ({
          background: theme.palette.mode === "dark" ? theme.palette.surfaces.page : `linear-gradient(180deg, ${softBg} 0%, #f4fbf7 100%)`,
          p: isPhone ? 0.3 : isTablet ? 0.5 : 2,
          overflowY: "auto",
          flex: 1,
          minHeight: 0
        })}
      >
        {loading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: isPhone ? 3 : isTablet ? 4 : 7 }}>
            <CircularProgress />
            <Typography
              sx={{
                mt: isCompact ? 0.6 : 2,
                fontWeight: 950,
                fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
              }}
            >جاري تحميل الملف التدريبي...</Typography>
          </Stack>
        ) : !student ? (
          <Alert
            severity="warning"
            sx={{
              borderRadius: isCompact ? 1.2 : 2,
              py: isCompact ? 0.15 : undefined,
              fontWeight: 900,
              fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
            }}
          >
            لا يوجد طالب محدد.
          </Alert>
        ) : (
          <Stack spacing={isPhone ? 0.4 : isTablet ? 0.6 : 1.5}>
            <Paper
              elevation={0}
              sx={(theme) => ({
                p: isPhone ? 0.38 : isTablet ? 0.58 : 1.5,
                borderRadius: isCompact ? 1.4 : 3,
                border: theme.palette.mode === "dark" ? "1px solid #67C99D" : `1px solid ${primaryLight}`,
                backgroundColor: theme.palette.mode === "dark" ? theme.palette.surfaces.card : whiteColor
              })}
            >
              <Typography
                sx={{
                  fontWeight: 1000,
                  color: textColor,
                  mb: isCompact ? 0.35 : 1.2,
                  px: isPhone ? 0.45 : isTablet ? 0.65 : 1.5,
                  py: isPhone ? 0.3 : isTablet ? 0.4 : 0.8,
                  borderRadius: isCompact ? 1.1 : 2,
                  fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
                  textAlign: "start",
                  background: `linear-gradient(135deg, ${primaryColor}, ${primaryDark})`,
                  color: whiteColor
                }}
              >
                بيانات الطالب
              </Typography>

              <Grid container spacing={isPhone ? 0.32 : isTablet ? 0.5 : 1.2}>
                <Grid item xs={12} sm={6} md={5}>
                  <FieldBox label="اسم الطالب" value={pick(student, "studentName", "StudentName")} strong color="#0d47a1" />
                </Grid>
                <Grid item xs={6} sm={3} md={3.5}>
                  <FieldBox label="رقم الهوية" value={nationalId} strong />
                </Grid>
                <Grid item xs={6} sm={3} md={3.5}>
                  <FieldBox label="رقم الجوال" value={pick(student, "studentTel", "StudentTel", "tel", "Tel")} strong />
                </Grid>
              </Grid>
            </Paper>

            <Paper
              elevation={0}
              sx={(theme) => ({
                p: isPhone ? 0.38 : isTablet ? 0.58 : 1.5,
                borderRadius: isCompact ? 1.4 : 3,
                border: theme.palette.mode === "dark" ? "1px solid #67C99D" : `1px solid ${primaryLight}`,
                backgroundColor: theme.palette.mode === "dark" ? theme.palette.surfaces.card : whiteColor
              })}
            >
              <Typography
                sx={{
                  fontWeight: 1000,
                  color: textColor,
                  mb: isCompact ? 0.35 : 1.2,
                  px: isPhone ? 0.45 : isTablet ? 0.65 : 1.5,
                  py: isPhone ? 0.3 : isTablet ? 0.4 : 0.8,
                  borderRadius: isCompact ? 1.1 : 2,
                  fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
                  textAlign: "start",
                  background: `linear-gradient(135deg, ${primaryColor}, ${primaryDark})`,
                  color: whiteColor
                }}
              >
                بيانات الدراسة
              </Typography>

              {studyInfo ? (
                <Grid container spacing={isPhone ? 0.32 : isTablet ? 0.5 : 1.2}>
                  <Grid item xs={6} sm={6} md={6}>
                    <FieldBox label="فرع الدراسة" value={pick(student, "branchName", "studyBranchName", "BranchName")} strong />
                  </Grid>
                  <Grid item xs={6} sm={6} md={6}>
                    <FieldBox label="الدبلوم / الدورة" value={pick(student, "diplomName", "DiplomName")} strong />
                  </Grid>
                  <Grid item xs={6} sm={4} md={4}>
                    <FieldBox label="الدفعة" value={studyInfo.batchName} icon={<EventIcon fontSize="small" />} />
                  </Grid>
                  <Grid item xs={6} sm={4} md={4}>
                    <FieldBox label="المستوى" value={studyInfo.levelName} icon={<SchoolIcon fontSize="small" />} />
                  </Grid>
                  <Grid item xs={6} sm={4} md={4}>
                    <FieldBox label="حالة التسجيل" value={studyInfo.stautName} strong color={statusChipSx(studyInfo.stautName).color} />
                  </Grid>
                  <Grid item xs={6} sm={4} md={4}>
                    <FieldBox label="تاريخ البداية" value={studyInfo.start} icon={<EventIcon fontSize="small" />} />
                  </Grid>
                  <Grid item xs={6} sm={4} md={4}>
                    <FieldBox label="تاريخ النهاية" value={studyInfo.end} icon={<EventIcon fontSize="small" />} />
                  </Grid>
                  <Grid item xs={6} sm={4} md={4}>
                    <FieldBox label="الشعبة" value={studyInfo.className || "غير مربوط"} icon={<GroupsIcon fontSize="small" />} />
                  </Grid>
                  <Grid item xs={12}>
                    <FieldBox label="ملاحظات" value={studyInfo.notes} icon={<NotesIcon fontSize="small" />} />
                  </Grid>
                </Grid>
              ) : (
                <Alert
                  severity="info"
                  sx={{
                    borderRadius: isCompact ? 1.2 : 2,
                    py: isCompact ? 0.15 : undefined,
                    fontWeight: 900,
                    fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
                  }}
                >
                  لم يتم العثور على بيانات ملف تدريبي لهذا الطالب بنفس الفرع والدبلوم.
                </Alert>
              )}
            </Paper>

            {/* {studyInfo && (
              <Paper elevation={0} sx={{ p: 1.5, borderRadius: 3, border: `1px solid ${primaryLight}`, backgroundColor: whiteColor }}>
                <Typography sx={{ fontWeight: 1000, color: primaryDark, mb: 1 }}>
                  ربط المتدرب بشعبة
                </Typography>

                <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems="stretch">
                  <TextField
                    fullWidth
                    size="small"
                    label="ClassGuid"
                    value={manualClassGuid}
                    onChange={(e) => setManualClassGuid(e.target.value)}
                    disabled={savingClass || String(studyInfo.regType) !== "0"}
                    helperText={
                      String(studyInfo.regType) === "0"
                        ? "اكتب Guid الشعبة المراد ربطها، أو اربط لاحقاً بقائمة الشعب عند تجهيزها."
                        : "هذا الملف التدريبي غير مسموح له ربط بشعبة."
                    }
                    inputProps={{ style: { direction: "ltr", textAlign: "left", fontWeight: 900 } }}
                  />
                  <Button
                    variant="contained"
                    startIcon={savingClass ? <CircularProgress size={17} color="inherit" /> : <GroupsIcon />}
                    onClick={updateClass}
                    disabled={savingClass || String(studyInfo.regType) !== "0"}
                    sx={{
                      minWidth: 170,
                      borderRadius: 2,
                      fontWeight: 950,
                      direction: "rtl",
                      background: `linear-gradient(135deg, ${primaryColor}, ${primaryDark})`,
                      boxShadow: "none"
                    }}
                  >
                    ربط الشعبة
                  </Button>
                </Stack>
              </Paper>
            )} */}
          </Stack>
        )}
      </DialogContent>

      <DialogActions
        sx={uiLayout.withUiSx({
          px: isPhone ? 0.35 : isTablet ? 0.55 : 2,
          py: isPhone ? 0.28 : isTablet ? 0.42 : 1.4,
          gap: isCompact ? 0.35 : 1,
          borderTop: `1px solid ${primaryLight}`,
          backgroundColor: whiteColor,
          justifyContent: "space-between",
          flexShrink: 0
        }, uiLayout.dialogActionsSx)}
      >
        <Button
          onClick={openAttachments}
          startIcon={<AttachFileIcon />}
          disabled={!student || loading || savingClass}
          sx={uiLayout.withUiSx({
            fontWeight: 950,
            color: primaryColor,
            direction: "rtl",
            minHeight: isPhone ? 29 : isTablet ? 33 : undefined,
            px: isPhone ? 0.7 : isTablet ? 1 : undefined,
            fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
          }, uiLayout.buttonSx)}
        >
          عرض المرفقات
        </Button>

        <Button
          onClick={onClose}
          disabled={loading || savingClass}
          startIcon={<CloseIcon />}
          sx={uiLayout.withUiSx({
            fontWeight: 950,
            color: dangerColor,
            direction: "rtl",
            minHeight: isPhone ? 29 : isTablet ? 33 : undefined,
            px: isPhone ? 0.7 : isTablet ? 1 : undefined,
            fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
          }, uiLayout.buttonSx)}
        >
          خروج
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
};

export default StudentStudyFileDialog;
