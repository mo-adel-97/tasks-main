import * as uiLayout from '../components/hrLayout';
import './rtl-forms-fix.css';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useTheme
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import WorkRoundedIcon from "@mui/icons-material/WorkRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import NotificationsActiveRoundedIcon from "@mui/icons-material/NotificationsActiveRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import EventBusyRoundedIcon from "@mui/icons-material/EventBusyRounded";
import HistoryToggleOffRoundedIcon from "@mui/icons-material/HistoryToggleOffRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ManageAccountsRoundedIcon from "@mui/icons-material/ManageAccountsRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import FingerprintRoundedIcon from "@mui/icons-material/FingerprintRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import HomeWorkRoundedIcon from "@mui/icons-material/HomeWorkRounded";
import ContactPhoneRoundedIcon from "@mui/icons-material/ContactPhoneRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
import RateReviewRoundedIcon from "@mui/icons-material/RateReviewRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded";
import ExitToAppRoundedIcon from "@mui/icons-material/ExitToAppRounded";
import AssessmentRoundedIcon from "@mui/icons-material/AssessmentRounded";
import GavelRoundedIcon from "@mui/icons-material/GavelRounded";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import TodayRoundedIcon from "@mui/icons-material/TodayRounded";
import HrOrgOverviewPanel from "./components/HrOrgOverviewPanel";

// ============================================================
// RTL dialog form system
// Keeps Arabic labels above controls instead of floating on the outline,
// normalizes spacing/alignment, and preserves LTR rendering for date/time.
// ============================================================
const RTL_DIALOG_SX = (theme) => {
  const isDark = theme.palette.mode === "dark";
  return {
  "& .MuiDialog-paper": {
    direction: "rtl",
    textAlign: "right",
    backgroundImage: "none",
    border: isDark ? "1px solid #67C99D" : undefined
  },
  "& .MuiDialogTitle-root": {
    direction: "rtl",
    textAlign: "right",
    fontFamily: 'Cairo, "Segoe UI", Tahoma, Arial, sans-serif'
  },
  "& .MuiDialogContent-root": {
    direction: "rtl",
    textAlign: "right",
    overflowX: "hidden",

    "& .MuiFormControl-root": {
      direction: "rtl",
      textAlign: "right"
    },

    // Use a real external-looking label above the control. This avoids the
    // outlined-border/label collision that appears in Arabic RTL forms.
    "& .MuiInputLabel-root": {
      position: "static !important",
      transform: "none !important",
      transformOrigin: "top right !important",
      width: "100%",
      maxWidth: "100%",
      margin: "0 0 6px 0",
      padding: 0,
      direction: "rtl",
      textAlign: "right",
      whiteSpace: "normal",
      overflow: "visible",
      lineHeight: 1.45,
      fontFamily: 'Cairo, "Segoe UI", Tahoma, Arial, sans-serif',
      fontSize: "0.78rem",
      fontWeight: 800,
      color: isDark ? theme.palette.text.secondary : "#52635c",
      pointerEvents: "auto"
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: isDark ? theme.palette.primary.main : "#057546"
    },
    "& .MuiInputLabel-root.Mui-error": {
      color: "#d32f2f"
    },
    "& .MuiInputLabel-root.Mui-disabled": {
      color: "rgba(0,0,0,.42)"
    },

    // Unfocused/hover borders used to be light-mode-only literals
    // ("#d7e3dd" / "#9fc7b5"): the shared dark-color plugin doesn't
    // recognize either as "brand green" so it silently re-muddied them to a
    // flat gray in real dark rendering. Pinning the dark values with
    // pinColor() locks in an actually-visible, actually-green border here.
    "& .MuiOutlinedInput-root": {
      direction: "rtl",
      textAlign: "right",
      borderRadius: "10px",
      backgroundColor: isDark ? theme.palette.surfaces.input : "#fff",
      transition: "border-color .18s ease, box-shadow .18s ease, background-color .18s ease",
      "& .MuiOutlinedInput-notchedOutline": {
        borderColor: isDark ? pinColor("#67C99D") : "#d7e3dd",
        borderWidth: isDark ? "1.5px" : "1px"
      },
      "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: isDark ? pinColor("#67C99D") : "#9fc7b5"
      },
      "&.Mui-focused": {
        boxShadow: isDark ? `0 0 0 3px ${pinColor("rgba(103,201,157,.16)")}` : "0 0 0 3px rgba(5,117,70,.08)"
      },
      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderColor: isDark ? "#67C99D" : "#057546",
        borderWidth: "1.5px"
      },
      "&.Mui-error .MuiOutlinedInput-notchedOutline": {
        borderColor: "#d32f2f"
      }
    },

    // The label is no longer inside the outline, so remove MUI's notch.
    "& .MuiOutlinedInput-notchedOutline legend": {
      maxWidth: "0 !important"
    },
    "& .MuiOutlinedInput-notchedOutline legend > span": {
      display: "none !important"
    },

    "& .MuiInputBase-input, & textarea, & .MuiSelect-select": {
      direction: "rtl",
      textAlign: "right",
      fontFamily: 'Cairo, "Segoe UI", Tahoma, Arial, sans-serif'
    },
    "& .MuiSelect-select": {
      paddingRight: "14px !important",
      paddingLeft: "40px !important"
    },
    "& .MuiSelect-icon": {
      right: "auto !important",
      left: "10px !important"
    },
    "& .MuiInputAdornment-positionStart": {
      marginRight: "0 !important",
      marginLeft: "8px !important"
    },
    "& .MuiInputAdornment-positionEnd": {
      marginLeft: "0 !important",
      marginRight: "8px !important"
    },
    "& .MuiFormHelperText-root": {
      direction: "rtl",
      textAlign: "right",
      marginLeft: 0,
      marginRight: 0,
      marginTop: "5px",
      fontFamily: 'Cairo, "Segoe UI", Tahoma, Arial, sans-serif'
    },
    "& .MuiAutocomplete-inputRoot": {
      direction: "rtl",
      paddingRight: "10px !important",
      paddingLeft: "38px !important"
    },
    "& .MuiAutocomplete-endAdornment": {
      right: "auto !important",
      left: "8px !important"
    },
    "& .MuiFormControlLabel-root": {
      direction: "rtl",
      marginLeft: 0,
      marginRight: 0,
      gap: "3px"
    },
    "& .MuiFormControlLabel-label": {
      direction: "rtl",
      textAlign: "right",
      fontFamily: 'Cairo, "Segoe UI", Tahoma, Arial, sans-serif'
    },

    // Dates and times must keep their natural numeric order in Arabic UI.
    '& input[type="date"], & input[type="time"], & input[type="datetime-local"]': {
      direction: "ltr !important",
      textAlign: "center !important",
      unicodeBidi: "isolate"
    }
  },
  "& .MuiDialogActions-root": {
    direction: "rtl",
    gap: "8px",
    flexWrap: "wrap",
    padding: { xs: "12px 14px", sm: "14px 20px" },
    borderTop: isDark ? `1px solid #67C99D` : "1px solid #edf2ef",
    "& .MuiButton-root": {
      minHeight: 38,
      borderRadius: "10px",
      textTransform: "none",
      fontFamily: 'Cairo, "Segoe UI", Tahoma, Arial, sans-serif',
      fontWeight: 800
    },
    "& .MuiButton-startIcon": {
      marginRight: "0 !important",
      marginLeft: "6px !important"
    },
    "& .MuiButton-endIcon": {
      marginLeft: "0 !important",
      marginRight: "6px !important"
    }
  }
  };
};

const RTL_MENU_PROPS = {
  PaperProps: {
    sx: (theme) => ({
      direction: "rtl",
      textAlign: "right",
      mt: 0.5,
      borderRadius: "10px",
      maxHeight: 360,
      border: theme.palette.mode === "dark" ? "1px solid #67C99D" : undefined,
      "& .MuiMenuItem-root": {
        direction: "rtl",
        textAlign: "right",
        justifyContent: "flex-start",
        minHeight: 40,
        fontFamily: 'Cairo, "Segoe UI", Tahoma, Arial, sans-serif'
      }
    })
  },
  MenuListProps: {
    dir: "rtl",
    sx: { py: 0.5 }
  }
};

// Outer frame + header + every row/cell line of this page's HTML tables, all
// pinned to the same always-visible focus green (never hover/focus-only).
const TABLE_DARK_BORDER_SX = (theme) => (theme.palette.mode !== "dark" ? {} : {
  border: "1px solid #67C99D",
  "& .MuiTableCell-root": { borderBottom: "1px solid #67C99D" }
});

const RTL_AUTOCOMPLETE_LISTBOX_PROPS = {
  dir: "rtl",
  style: {
    direction: "rtl",
    textAlign: "right",
    fontFamily: 'Cairo, "Segoe UI", Tahoma, Arial, sans-serif'
  }
};

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "https://api4.sstli.com";

/* =========================================================
   DIRECTION / TEXT ALIGN
   عدّل الاتجاه والمحاذاة من هنا فقط
   ========================================================= */
const PAGE_DIRECTION = "rtl";
const PAGE_TEXT_ALIGN = "start";

const SECTION_DIRECTION = PAGE_DIRECTION;
const SECTION_TEXT_ALIGN = PAGE_TEXT_ALIGN;

const TABLE_DIRECTION = PAGE_DIRECTION;
const TABLE_TEXT_ALIGN = PAGE_TEXT_ALIGN;

const FORM_DIRECTION = PAGE_DIRECTION;
const FORM_TEXT_ALIGN = PAGE_TEXT_ALIGN;

const VALUE_DIRECTION = PAGE_DIRECTION;
const VALUE_TEXT_ALIGN = PAGE_TEXT_ALIGN;

const DATE_DIRECTION = "ltr";
const DATE_TEXT_ALIGN = "center";

/* Dialog directions are controlled here only. */
const DETAIL_DIALOG_DIRECTION = "rtl";
const DETAIL_DIALOG_TEXT_ALIGN = "start";

const LEAVE_DIALOG_DIRECTION = "rtl";
const LEAVE_DIALOG_TEXT_ALIGN = "start";

const LEAVE_TRACKING_DIALOG_DIRECTION = "rtl";
const LEAVE_TRACKING_DIALOG_TEXT_ALIGN = "right";

const primary = "#057546";
const primaryDark = "#034d31";
const border = "rgba(5,117,70,0.14)";
const soft = "#f6faf8";
const danger = "#c53030";
const warning = "#b7791f";

const permissionButtonSx = (theme) => {
  const isDark = theme.palette.mode === "dark";

  return {
    minHeight: 35,
    px: { xs: 0.8, sm: 1.05 },
    borderRadius: 2,
    fontWeight: 850,
    whiteSpace: "nowrap",
    boxShadow: "none",

    color: isDark ? "#b9ead2" : primary,

    backgroundColor: isDark
      ? "rgba(69,168,121,.14)"
      : "#edf7f2",

    border: isDark
      ? "1px solid rgba(128,201,167,.46)"
      : "1px solid rgba(5,117,70,.24)",

    "& .MuiSvgIcon-root": {
      color: isDark ? "#80c9a7" : primary
    },

    "&:hover": {
      color: isDark ? "#dcf7e9" : primaryDark,

      backgroundColor: isDark
        ? "rgba(69,168,121,.23)"
        : "#e4f3eb",

      borderColor: isDark
        ? "rgba(128,201,167,.72)"
        : "rgba(5,117,70,.42)",

      boxShadow: isDark
        ? "0 0 0 1px rgba(128,201,167,.08)"
        : "0 3px 10px rgba(5,117,70,.08)",

      transform: "none"
    },

    "&:active": {
      transform: "none"
    },

    transition:
      "background-color .15s ease, border-color .15s ease, color .15s ease, box-shadow .15s ease"
  };
};

// The emotion cache's dark-color plugin (adaptiveColorsPlugin) rewrites every
// literal border-category color it sees into light-dark(original, autoDark) —
// and for any color it doesn't recognize as brand green, autoDark is a flat
// muddy gray-green, not the color we actually picked for dark mode. Locking a
// value with light-dark(x, x) (both slots identical) makes the plugin's regex
// skip it entirely, so non-green dark-mode borders (amber/red/blue) actually
// render as chosen instead of being silently re-muddied.
const pinColor = (color) => `light-dark(${color}, ${color})`;

// MUI's built-in dark-mode Alert colors (a generic darken() of the stock
// Material severity color) render as a near-black/brown box that clashes
// with this page's actual dark surfaces + bright green-bordered design
// language. Give every severity a tinted-dark background and a visible,
// on-brand-saturation border instead, matching the same surfaces/borders
// system already used for cards on this page.
const darkAlertSx = (theme) => {
  if (theme.palette.mode !== "dark") return {};
  const tones = {
    Warning: { bg: "rgba(237,137,54,.12)", border: pinColor("rgba(237,137,54,.42)"), color: "#f0ad4e" },
    Error: { bg: "rgba(229,90,90,.12)", border: pinColor("rgba(229,90,90,.42)"), color: "#e57373" },
    Info: { bg: "rgba(90,160,229,.12)", border: pinColor("rgba(90,160,229,.42)"), color: "#78bdf5" },
    Success: { bg: "rgba(103,201,157,.12)", border: "#67C99D", color: theme.palette.primary.main }
  };
  return Object.fromEntries(
    Object.entries(tones).map(([severity, tone]) => [
      `&.MuiAlert-standard${severity}`,
      {
        backgroundColor: tone.bg,
        border: `1px solid ${tone.border}`,
        color: tone.color,
        "& .MuiAlert-icon": { color: tone.color }
      }
    ])
  );
};

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const fmtDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
};

const fmtDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("ar-SA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const fmtTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleTimeString("ar-SA", {
    hour: "2-digit",
    minute: "2-digit"
  });
};

const fmtClockValue = (value) => {
  if (!value) return "-";

  const text = String(value).trim();
  const match = text.match(/^(\d{1,2}):(\d{2})/);
  if (match) {
    return `${String(match[1]).padStart(2, "0")}:${match[2]}`;
  }

  return fmtTime(value);
};

const permissionTypeText = (value) => {
  switch (Number(value)) {
    case 1:
      return "تأخير حضور";
    case 2:
      return "انصراف مبكر";
    case 3:
      return "خروج أثناء الدوام";
    case 4:
      return "إذن يوم كامل";
    default:
      return "غير محدد";
  }
};

const money = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";

  return `${number.toLocaleString("ar-SA", {
    maximumFractionDigits: 2
  })} ر.س`;
};

const fileSizeText = (value) => {
  const bytes = Number(value || 0);
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const minutesText = (value) => {
  const total = Math.max(0, Number(value || 0));
  const hours = Math.floor(total / 60);
  const minutes = total % 60;

  if (!hours) return `${minutes} د`;
  if (!minutes) return `${hours} س`;
  return `${hours} س ${minutes} د`;
};

const genderText = (value) => {
  if (Number(value) === 1) return "ذكر";
  if (Number(value) === 2) return "أنثى";
  return "غير محدد";
};

const maritalText = (value) => {
  const map = {
    1: "أعزب",
    2: "متزوج",
    3: "مطلق",
    4: "أرمل"
  };
  return map[Number(value)] || "غير محدد";
};

const educationLevelText = (value, apiName) => {
  const apiLabel = String(apiName || "").trim();
  if (apiLabel) return apiLabel;

  const map = {
    1: "ثانوي أو أقل",
    2: "دبلوم",
    3: "بكالوريوس",
    4: "ماجستير",
    5: "دكتوراه",
    6: "زمالة / بورد",
    7: "أخرى",
    8: "دبلوم عالي",
    9: "بدون مؤهل"
  };

  return map[Number(value)] || "غير محدد";
};

const contractTypeText = (value) => {
  if (Number(value) === 1) return "محدد المدة";
  if (Number(value) === 2) return "غير محدد المدة";
  return "غير محدد";
};

const statusMeta = (status) => {
  const value = String(status || "").trim();

  switch (value) {
    case "Present":
      return { text: "حاضر", color: "success" };
    case "Late":
      return { text: "متأخر", color: "warning" };
    case "Absent":
      return { text: "غائب", color: "error" };
    case "Leave":
      return { text: "إجازة", color: "info" };
    case "Holiday":
      return { text: "عطلة", color: "default" };
    case "Permission":
      return { text: "إذن", color: "secondary" };
    case "Incomplete":
      return { text: "لم يسجل انصراف", color: "warning" };
    case "Approved":
      return { text: "معتمد", color: "success" };
    case "PendingApproval":
    case "Pending":
    case "PendingManager":
    case "PendingHR":
      return { text: "بانتظار الموافقة", color: "warning" };
    case "Rejected":
      return { text: "مرفوض", color: "error" };
    case "Cancelled":
      return { text: "ملغي", color: "default" };
    case "Returned":
      return { text: "معاد للمراجعة", color: "info" };
    case "Terminated":
      return { text: "منتهي الخدمة", color: "error" };
    case "Expired":
      return { text: "منتهي", color: "error" };
    case "ExpiringSoon":
      return { text: "ينتهي قريبًا", color: "warning" };
    case "Upcoming":
      return { text: "قادم", color: "info" };
    case "Active":
      return { text: "ساري", color: "success" };
    default:
      return { text: value || "-", color: "default" };
  }
};

function StatusChip({ status }) {
  const meta = statusMeta(status);
  return (
    <Chip
      size="small"
      label={meta.text}
      color={meta.color}
      sx={{ fontWeight: 900 }}
    />
  );
}

function Section({ title, subtitle, action, children, sectionRef }) {
  return (
    <Paper
      ref={sectionRef}
      elevation={0}
      sx={(theme) => {
        const isDark = theme.palette.mode === "dark";
        return {
          border: isDark
            ? `1px solid #67C99D`
            : `1px solid ${border}`,
          borderRadius: 3,
          overflow: "hidden",
          background: isDark ? theme.palette.surfaces.card : "#fff",
          boxShadow: isDark
            ? `0 0 0 1px #67C99D, 0 0 26px rgba(103,201,157,.05), 0 18px 40px rgba(0,0,0,.45)`
            : "none",
          scrollMarginTop: 18
        };
      }}
    >
      <Box
        sx={(theme) => {
          const isDark = theme.palette.mode === "dark";
          return {
            px: { xs: 0.95, sm: 1.2, md: 1.6 },
            py: { xs: 0.85, sm: 1, md: 1.2 },
            display: "flex",
            alignItems: { xs: "stretch", sm: "center" },
            justifyContent: "space-between",
            flexDirection: { xs: "column", sm: "row" },
            gap: { xs: 0.65, sm: 1 },
            borderBottom: isDark
              ? `1px solid #67C99D`
              : `1px solid ${border}`,
            background: isDark
              ? `linear-gradient(180deg, ${theme.palette.surfaces.section}, ${theme.palette.surfaces.card})`
              : "linear-gradient(180deg, rgba(246,250,248,.96), rgba(255,255,255,.98))"
          };
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6"
            sx={(theme) => ({
              fontWeight: 950,
              color: theme.palette.mode === "dark" ? theme.palette.text.primary : "#17372b",
              lineHeight: 1.35,
              textAlign: SECTION_TEXT_ALIGN
            })}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              color="text.secondary"
              sx={{
                fontSize: { xs: 12, sm: 12, md: 12 },
                mt: 0.15,
                lineHeight: 1.5,
                textAlign: SECTION_TEXT_ALIGN
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        {action}
      </Box>

      <Box sx={{ p: { xs: 0.85, sm: 1.05, md: 1.5 } }}>{children}</Box>
    </Paper>
  );
}

function DetailTile({
  icon,
  label,
  value,
  ltr = false,
  wide = false,
  helper,
  expandable = false
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const displayValue =
    value === null ||
    value === undefined ||
    String(value).trim() === ""
      ? "-"
      : String(value);

  const canOpenDetails =
    expandable &&
    displayValue !== "-";

  return (
    <>
      <Box
        sx={(theme) => {
          const isDark = theme.palette.mode === "dark";
          return {
            gridColumn: wide ? { md: "span 2" } : "auto",
            minHeight: { xs: 68, sm: 74, md: 78 },
            height: "100%",
            p: { xs: 0.7, sm: 0.82, md: 0.95 },
            border: isDark
              ? `1px solid #67C99D`
              : `1px solid ${border}`,
            borderRadius: 2,
            background: isDark ? theme.palette.surfaces.nested : soft,
            display: "grid",
            gridTemplateColumns: {
              xs: "26px minmax(0,1fr)",
              sm: "29px minmax(0,1fr)",
              md: "32px minmax(0,1fr)"
            },
            gap: { xs: 0.5, sm: 0.65, md: 0.75 },
            alignItems: "start",
            overflow: "hidden",
            transition: "border-color .18s ease, box-shadow .18s ease",
            "&:hover": isDark
              ? {
                  borderColor: "#67C99D",
                  boxShadow: `0 0 0 1px #67C99D`
                }
              : undefined
          };
        }}
      >
        <Box
          sx={(theme) => {
            const isDark = theme.palette.mode === "dark";
            return {
              width: { xs: 25, sm: 28, md: 30 },
              height: { xs: 25, sm: 28, md: 30 },
              borderRadius: 1.4,
              display: "grid",
              placeItems: "center",
              color: isDark ? theme.palette.primary.main : primary,
              background: isDark ? theme.palette.borders.subtle : "rgba(5,117,70,.09)"
            };
          }}
        >
          {icon}
        </Box>

        <Box
          sx={{
            minWidth: 0,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            textAlign: SECTION_TEXT_ALIGN
          }}
        >
          <Typography
            color="text.secondary"
            sx={{
              fontSize: { xs: 12, sm: 12, md: 12 },
              fontWeight: 800,
              lineHeight: 1.35,
              textAlign: SECTION_TEXT_ALIGN
            }}
          >
            {label}
          </Typography>

          <Typography
            dir={ltr ? DATE_DIRECTION : VALUE_DIRECTION}
            title={!canOpenDetails ? displayValue : undefined}
            sx={(theme) => ({
              mt: 0.2,
              color: theme.palette.mode === "dark" ? theme.palette.text.primary : "#17372b",
              fontSize: { xs: 12, sm: 12, md: 12 },
              lineHeight: 1.4,
              fontWeight: 900,
              textAlign: ltr
                ? DATE_TEXT_ALIGN
                : VALUE_TEXT_ALIGN,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: canOpenDetails ? 1 : 2,
              WebkitBoxOrient: "vertical",
              overflowWrap: "anywhere"
            })}
          >
            {displayValue}
          </Typography>

          {helper && (
            <Typography
              color="text.secondary"
              sx={{
                fontSize: { xs: 12, sm: 12, md: 12 },
                mt: 0.08,
                textAlign: SECTION_TEXT_ALIGN,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }}
            >
              {helper}
            </Typography>
          )}

          {canOpenDetails && (
            <Button
              size="small"
              variant="text"
              onClick={() => setDetailsOpen(true)}
              sx={uiLayout.withUiSx({
                mt: "auto",
                p: 0,
                minWidth: 0,
                alignSelf: "flex-start",
                fontSize: 12,
                fontWeight: 900,
                lineHeight: 1.3
              }, uiLayout.buttonSx)}
            >
              قراءة المزيد
            </Button>
          )}
        </Box>
      </Box>

      {canOpenDetails && (
        <Dialog
        sx={uiLayout.withUiSx(RTL_DIALOG_SX, uiLayout.dialogLayoutSx)}
          dir={DETAIL_DIALOG_DIRECTION}
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          fullWidth
          maxWidth="xs"
          PaperProps={{
            sx: {
              width: { xs: "calc(100% - 20px)", sm: "min(460px, calc(100% - 32px))" },
              maxWidth: "460px !important",
              m: { xs: 1.25, sm: 2 },
              borderRadius: 2.5,
              direction: DETAIL_DIALOG_DIRECTION,
              textAlign: DETAIL_DIALOG_TEXT_ALIGN,
              overflow: "hidden"
            }
          }}
        >
          <DialogTitle
            sx={(theme) => ({
              px: { xs: 1.2, sm: 1.5 },
              py: { xs: 0.9, sm: 1.05 },
              borderBottom: theme.palette.mode === "dark"
                ? `1px solid #67C99D`
                : `1px solid ${border}`,
              textAlign: DETAIL_DIALOG_TEXT_ALIGN
            })}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              gap={1}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={(theme) => ({
                    fontSize: 15,
                    fontWeight: 950,
                    color: theme.palette.mode === "dark" ? theme.palette.text.primary : "#17372b",
                    textAlign: DETAIL_DIALOG_TEXT_ALIGN
                  })}
                >
                  {label}
                </Typography>

                <Typography
                  color="text.secondary"
                  sx={{
                    fontSize: 12,
                    mt: 0.2,
                    textAlign: DETAIL_DIALOG_TEXT_ALIGN
                  }}
                >
                  عرض البيانات كاملة
                </Typography>
              </Box>

              <IconButton
                size="small"
                onClick={() => setDetailsOpen(false)}
              >
                <CloseRoundedIcon />
              </IconButton>
            </Stack>
          </DialogTitle>

          <DialogContent
            sx={{
              p: { xs: "10px !important", sm: "12px !important" },
              direction: DETAIL_DIALOG_DIRECTION,
              textAlign: DETAIL_DIALOG_TEXT_ALIGN
            }}
          >
            <Paper
              elevation={0}
              sx={(theme) => {
                const isDark = theme.palette.mode === "dark";
                return {
                  p: { xs: 1, sm: 1.2 },
                  borderRadius: 2.2,
                  border: isDark
                    ? `1px solid #67C99D`
                    : `1px solid ${border}`,
                  background: isDark ? theme.palette.surfaces.nested : soft
                };
              }}
            >
              <Typography
                dir={ltr ? DATE_DIRECTION : VALUE_DIRECTION}
                sx={(theme) => ({
                  color: theme.palette.mode === "dark" ? theme.palette.text.primary : "#17372b",
                  fontSize: 12.3,
                  lineHeight: 1.9,
                  fontWeight: 800,
                  textAlign: ltr
                    ? DATE_TEXT_ALIGN
                    : DETAIL_DIALOG_TEXT_ALIGN,
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere"
                })}
              >
                {displayValue}
              </Typography>
            </Paper>

            {helper && (
              <Typography
                color="text.secondary"
                sx={{
                  mt: 1,
                  fontSize: 12,
                  textAlign: DETAIL_DIALOG_TEXT_ALIGN
                }}
              >
                {helper}
              </Typography>
            )}
          </DialogContent>

          <DialogActions
            sx={uiLayout.withUiSx({
              px: { xs: 1.2, sm: 1.5 },
              py: { xs: 0.7, sm: 0.8 },
              borderTop: `1px solid ${border}`,
              justifyContent: "flex-start"
            }, uiLayout.dialogActionsSx)}
          >
            <Button sx={[uiLayout.buttonSx, permissionButtonSx]}
              variant="outlined"
              onClick={() => setDetailsOpen(false)}
            >
              إغلاق
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
}

function DetailGrid({ children, compact = false }) {
  return (
    <Box
      sx={{
        display: "grid",
        // Fixed at 2 columns forever regardless of width used to leave 8-tile
        // sections as one cramped, tall column even on a 1200-1440px laptop
        // (this section only sits side-by-side with its sibling from xl up).
        // More columns unlock as width allows instead.
        // `compact` is the 4-tile "preview" grid used on the home cards: it
        // always lands as a clean 2x2 (mobile) or single row of 4 (tablet+)
        // instead of the fuller grid's 3-then-4 column ramp, which would
        // leave an orphan tile dangling on its own row for exactly 4 items.
        gridTemplateColumns: compact
          ? {
              xs: "repeat(2,minmax(0,1fr))",
              sm: "repeat(4,minmax(0,1fr))"
            }
          : {
              xs: "repeat(2,minmax(0,1fr))",
              sm: "repeat(2,minmax(0,1fr))",
              md: "repeat(3,minmax(0,1fr))",
              lg: "repeat(3,minmax(0,1fr))",
              xl: "repeat(4,minmax(0,1fr))"
            },
        // A fixed row height clipped any tile whose value/helper needed more
        // room (long department names, the "N مديرين" helper line). `auto`
        // lets the row grow to fit its tallest tile instead of cropping text.
        gridAutoRows: { xs: "minmax(68px,auto)", sm: "minmax(74px,auto)", md: "minmax(78px,auto)" },
        gap: { xs: 0.55, sm: 0.7, md: 0.8 },
        alignItems: "stretch"
      }}
    >
      {children}
    </Box>
  );
}


function ProfileDetailsDialog({
  open,
  onClose,
  title,
  subtitle,
  children
}) {
  return (
    <Dialog
        sx={uiLayout.withUiSx(RTL_DIALOG_SX, uiLayout.dialogLayoutSx)}
      dir={DETAIL_DIALOG_DIRECTION}
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          width: {
            xs: "calc(100% - 18px)",
            sm: "min(620px, calc(100% - 32px))"
          },
          maxWidth: "620px !important",
          m: { xs: 1.1, sm: 2 },
          maxHeight: { xs: "82dvh", sm: "78vh" },
          borderRadius: { xs: 2.5, sm: 3.2 },
          direction: DETAIL_DIALOG_DIRECTION,
          textAlign: DETAIL_DIALOG_TEXT_ALIGN,
          overflow: "hidden"
        }
      }}
    >
      <DialogTitle
        sx={(theme) => {
          const isDark = theme.palette.mode === "dark";
          return {
            px: { xs: 1.15, sm: 1.5 },
            py: { xs: 0.85, sm: 1 },
            borderBottom: isDark
              ? `1px solid #67C99D`
              : `1px solid ${border}`,
            background: isDark
              ? `linear-gradient(180deg, ${theme.palette.surfaces.section}, ${theme.palette.surfaces.card})`
              : "linear-gradient(180deg,#ffffff 0%,#f7fbf9 100%)",
            textAlign: DETAIL_DIALOG_TEXT_ALIGN
          };
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          gap={1}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={(theme) => ({
                fontSize: { xs: 14, sm: 16 },
                fontWeight: 950,
                color: theme.palette.mode === "dark" ? theme.palette.text.primary : "#17372b",
                textAlign: DETAIL_DIALOG_TEXT_ALIGN
              })}
            >
              {title}
            </Typography>

            {subtitle && (
              <Typography
                color="text.secondary"
                sx={{
                  mt: 0.15,
                  fontSize: { xs: 12, sm: 12 },
                  textAlign: DETAIL_DIALOG_TEXT_ALIGN
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>

          <IconButton
            size="small"
            onClick={onClose}
            sx={(theme) => {
              const isDark = theme.palette.mode === "dark";
              return {
                flexShrink: 0,
                border: isDark
                  ? `1px solid #67C99D`
                  : `1px solid ${border}`,
                background: isDark ? theme.palette.surfaces.nested : soft
              };
            }}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent
        sx={(theme) => ({
          p: {
            xs: "8px !important",
            sm: "10px !important"
          },
          background: theme.palette.mode === "dark" ? theme.palette.surfaces.card : "#fff",
          direction: DETAIL_DIALOG_DIRECTION,
          textAlign: DETAIL_DIALOG_TEXT_ALIGN
        })}
      >
        {children}
      </DialogContent>

      <DialogActions
        sx={uiLayout.withUiSx((theme) => {
          const isDark = theme.palette.mode === "dark";
          return {
            px: { xs: 1.15, sm: 1.5 },
            py: { xs: 0.65, sm: 0.75 },
            borderTop: isDark
              ? `1px solid #67C99D`
              : `1px solid ${border}`,
            background: isDark ? theme.palette.surfaces.section : "#fbfdfc",
            justifyContent: "flex-start"
          };
        }, uiLayout.dialogActionsSx)}
      >
        <Button
          variant="outlined"
          size="small"
          onClick={onClose}
          sx={uiLayout.withUiSx({
            minWidth: 90,
            fontWeight: 900
          }, uiLayout.buttonSx, permissionButtonSx)}
        >
          إغلاق
        </Button>
      </DialogActions>
    </Dialog>
  );
}


function HomeAlertDialog({ alert, open, acknowledging, onAcknowledge }) {
  const tone = String(alert?.alertType || "info").toLowerCase();
  const toneColor =
    tone === "error"
      ? "#d94a4a"
      : tone === "warning"
        ? "#d79a2b"
        : tone === "success"
          ? "#2f9b68"
          : "#4d8fe8";

  return (
    <Dialog
      open={open}
      onClose={() => {}}
      disableEscapeKeyDown
      fullWidth
      maxWidth="xs"
      dir="rtl"
      sx={{
        zIndex: (theme) => theme.zIndex.modal + 30,
        "& .MuiBackdrop-root": {
          backdropFilter: "blur(4px)",
          backgroundColor: "rgba(0,0,0,.58)"
        }
      }}
      PaperProps={{
        sx: (theme) => ({
          width: { xs: "calc(100% - 24px)", sm: "min(480px, calc(100% - 40px))" },
          maxWidth: "480px !important",
          m: { xs: 1.5, sm: 2.5 },
          borderRadius: 3.2,
          overflow: "hidden",
          direction: "rtl",
          textAlign: "right",
          backgroundImage: "none",
          backgroundColor: theme.palette.mode === "dark" ? "#111916" : "#ffffff",
          border: theme.palette.mode === "dark"
            ? "1px solid #67C99D"
            : "1px solid rgba(5,117,70,.13)",
          boxShadow: theme.palette.mode === "dark"
            ? "0 26px 70px rgba(0,0,0,.56)"
            : "0 26px 70px rgba(10,65,43,.18)"
        })
      }}
    >
      <Box
        sx={(theme) => ({
          position: "relative",
          px: { xs: 1.6, sm: 2.2 },
          pt: { xs: 2, sm: 2.4 },
          pb: { xs: 1.45, sm: 1.7 },
          borderBottom: theme.palette.mode === "dark"
            ? "1px solid #67C99D"
            : "1px solid rgba(5,117,70,.10)",
          background: theme.palette.mode === "dark"
            ? "linear-gradient(135deg, rgba(16,52,38,.95), rgba(17,25,22,.98))"
            : "linear-gradient(135deg,#f0faf5 0%,#ffffff 75%)"
        })}
      >
        <Stack direction="row" spacing={1.2} alignItems="center">
          <Box
            sx={(theme) => ({
              width: 46,
              height: 46,
              borderRadius: 2.2,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              color: theme.palette.mode === "dark" ? "#d8f4e5" : toneColor,
              backgroundColor: theme.palette.mode === "dark"
                ? "rgba(75,166,118,.16)"
                : `${toneColor}12`,
              border: theme.palette.mode === "dark"
                ? "1px solid #67C99D"
                : `1px solid ${toneColor}28`
            })}
          >
            <NotificationsActiveRoundedIcon />
          </Box>

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={0.7} alignItems="center" sx={{ mb: 0.35, flexWrap: "wrap", rowGap: 0.5 }}>
              <Typography
                sx={(theme) => ({
                  fontWeight: 950,
                  fontSize: { xs: 16, sm: 18 },
                  color: theme.palette.mode === "dark" ? "#eef8f2" : "#17372b"
                })}
              >
                {alert?.title || "تنبيه"}
              </Typography>
              <Chip
                size="small"
                label={`تنبيه #${alert?.alertId ?? "-"}`}
                sx={(theme) => ({
                  height: 22,
                  fontSize: 11,
                  fontWeight: 900,
                  color: theme.palette.mode === "dark" ? "#bfe8d2" : "#057546",
                  backgroundColor: theme.palette.mode === "dark"
                    ? "rgba(69,168,121,.12)"
                    : "rgba(5,117,70,.07)",
                  border: theme.palette.mode === "dark"
                    ? "1px solid #67C99D"
                    : "1px solid rgba(5,117,70,.16)"
                })}
              />
            </Stack>
            <Typography
              sx={(theme) => ({
                fontSize: 12,
                lineHeight: 1.55,
                color: theme.palette.mode === "dark" ? "rgba(226,238,231,.72)" : "#6a7c74"
              })}
            >
              يرجى قراءة التنبيه ثم تأكيد الاطلاع عليه.
            </Typography>
          </Box>
        </Stack>
      </Box>

      <DialogContent
        sx={(theme) => ({
          px: { xs: "16px !important", sm: "22px !important" },
          py: { xs: "18px !important", sm: "22px !important" },
          backgroundColor: theme.palette.mode === "dark" ? "#111916" : "#ffffff"
        })}
      >
        <Paper
          elevation={0}
          sx={(theme) => ({
            p: { xs: 1.5, sm: 1.8 },
            borderRadius: 2.4,
            backgroundColor: theme.palette.mode === "dark" ? "#151f1b" : "#f8fbf9",
            border: theme.palette.mode === "dark"
              ? "1px solid #67C99D"
              : "1px solid rgba(5,117,70,.09)"
          })}
        >
          <Typography
            sx={(theme) => ({
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
              fontSize: { xs: 13.2, sm: 14 },
              lineHeight: 2,
              fontWeight: 750,
              color: theme.palette.mode === "dark" ? "#e7f2eb" : "#263d34"
            })}
          >
            {alert?.message || ""}
          </Typography>
        </Paper>
      </DialogContent>

      <DialogActions
        sx={(theme) => ({
          px: { xs: 1.6, sm: 2.2 },
          py: { xs: 1.2, sm: 1.35 },
          justifyContent: "flex-start",
          backgroundColor: theme.palette.mode === "dark" ? "#0f1714" : "#fbfdfc",
          borderTop: theme.palette.mode === "dark"
            ? "1px solid #67C99D"
            : "1px solid rgba(5,117,70,.09)"
        })}
      >
        <Button
          variant="contained"
          disabled={acknowledging}
          onClick={onAcknowledge}
          startIcon={<CheckCircleRoundedIcon />}
          sx={(theme) => ({
            minWidth: 145,
            minHeight: 40,
            borderRadius: 2,
            fontWeight: 950,
            boxShadow: "none",
            backgroundColor: theme.palette.mode === "dark" ? "#1b7c52" : primary,
            "&:hover": {
              backgroundColor: theme.palette.mode === "dark" ? "#238d60" : primaryDark,
              boxShadow: "none"
            }
          })}
        >
          {acknowledging ? "جاري الحفظ..." : "تم الاطلاع"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function MetricCard({ title, value, subtitle, icon, tone = "default", onClick }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const tonesLight = {
    default: ["#fff", "rgba(5,117,70,.14)", "rgba(5,117,70,.09)", primary],
    warning: ["#fffaf0", "rgba(237,137,54,.22)", "rgba(237,137,54,.12)", warning],
    danger: ["#fff6f6", "rgba(197,48,48,.18)", "rgba(197,48,48,.09)", danger],
    info: ["#f5fbff", "rgba(49,130,206,.18)", "rgba(49,130,206,.09)", "#2b6cb0"]
  };
  const tonesDark = {
    default: [theme.palette.surfaces.card, "#67C99D", theme.palette.borders.subtle, theme.palette.primary.main],
    warning: [theme.palette.surfaces.card, pinColor("rgba(237,137,54,.42)"), "rgba(237,137,54,.14)", "#f0ad4e"],
    danger: [theme.palette.surfaces.card, pinColor("rgba(229,90,90,.42)"), "rgba(229,90,90,.14)", "#e57373"],
    info: [theme.palette.surfaces.card, pinColor("rgba(90,160,229,.42)"), "rgba(90,160,229,.14)", "#64b5f6"]
  };

  const tones = isDark ? tonesDark : tonesLight;
  const palette = tones[tone] || tones.default;

  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        p: { xs: 0.85, sm: 1.05, md: 1.3 },
        minHeight: { xs: 88, sm: 98, md: 108 },
        borderRadius: 2.8,
        border: `1px solid ${palette[1]}`,
        background: palette[0],
        boxShadow: isDark ? `0 0 0 1px #67C99D` : "none",
        cursor: onClick ? "pointer" : "default",
        transition: "transform .16s ease, box-shadow .16s ease, border-color .16s ease",
        "&:hover": onClick
          ? {
              transform: "translateY(-2px)",
              borderColor: palette[1],
              boxShadow: isDark
                ? `0 12px 28px rgba(0,0,0,.5), 0 0 0 1px ${palette[1]}`
                : "0 10px 24px rgba(5,117,70,.09)"
            }
          : undefined
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <Box
          sx={{
            width: { xs: 34, sm: 38, md: 42 },
            height: { xs: 34, sm: 38, md: 42 },
            borderRadius: 2,
            display: "grid",
            placeItems: "center",
            background: palette[2],
            color: palette[3],
            flexShrink: 0
          }}
        >
          {icon}
        </Box>

        <Box sx={{ minWidth: 0, flex: 1, textAlign: SECTION_TEXT_ALIGN }}>
          <Typography
            color="text.secondary"
            sx={{
              fontSize: { xs: 12, sm: 12, md: 12 },
              lineHeight: 1.35,
              fontWeight: 800,
              textAlign: SECTION_TEXT_ALIGN
            }}
          >
            {title}
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: 17, sm: 19, md: 21 },
              lineHeight: 1.2,
              fontWeight: 950,
              color: isDark ? theme.palette.text.primary : "#17372b",
              mt: 0.15,
              textAlign: SECTION_TEXT_ALIGN
            }}
          >
            {value}
          </Typography>
        </Box>
      </Stack>

      {subtitle && (
        <Typography
          color="text.secondary"
          sx={{
            fontSize: { xs: 12, sm: 12, md: 12 },
            mt: { xs: 0.55, md: 0.9 },
            lineHeight: 1.35,
            textAlign: SECTION_TEXT_ALIGN
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Paper>
  );
}

function HomeSkeleton() {
  return (
    <Box dir={PAGE_DIRECTION} sx={{ width: "100%" }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, md: 2 },
          mb: 1.5,
          borderRadius: 3.3,
          background: "linear-gradient(125deg,#034d31,#057546)"
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Skeleton variant="circular" width={88} height={88} sx={{ bgcolor: "rgba(255,255,255,.18)" }} />
          <Box sx={{ flex: 1 }}>
            <Skeleton width="34%" height={35} sx={{ bgcolor: "rgba(255,255,255,.18)" }} />
            <Skeleton width="52%" height={22} sx={{ bgcolor: "rgba(255,255,255,.12)" }} />
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Skeleton width={110} height={28} sx={{ bgcolor: "rgba(255,255,255,.12)" }} />
              <Skeleton width={90} height={28} sx={{ bgcolor: "rgba(255,255,255,.12)" }} />
            </Stack>
          </Box>
        </Stack>
      </Paper>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4,1fr)" },
          gap: 1,
          mb: 1.5
        }}
      >
        {[1, 2, 3, 4].map((item) => (
          <Paper key={item} elevation={0} sx={(theme) => ({ p: 1.4, borderRadius: 2.8, border: theme.palette.mode === "dark" ? "1px solid #67C99D" : `1px solid ${border}` })}>
            <Skeleton width="45%" />
            <Skeleton width="70%" height={38} />
            <Skeleton width="82%" />
          </Paper>
        ))}
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 1.5 }}>
        {[1, 2, 3, 4].map((item) => (
          <Paper key={item} elevation={0} sx={(theme) => ({ p: 1.5, borderRadius: 3, border: theme.palette.mode === "dark" ? "1px solid #67C99D" : `1px solid ${border}` })}>
            <Skeleton width="30%" height={30} />
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
              {[1, 2, 3, 4, 5, 6].map((row) => (
                <Skeleton key={row} variant="rounded" height={68} />
              ))}
            </Box>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}

function FilePreviewDialog({ preview, onClose, onDownload }) {
  return (
    <Dialog
        sx={uiLayout.withUiSx(RTL_DIALOG_SX, uiLayout.dialogLayoutSx)}
      open={preview.open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      PaperProps={{
        sx: {
          width: { xs: "94vw", md: "74vw", xl: "68vw" },
          maxWidth: 1050,
          height: { xs: "84vh", md: "82vh" },
          borderRadius: 3,
          overflow: "hidden"
        }
      }}
    >
      <DialogTitle sx={(theme) => ({ py: 1.2, borderBottom: theme.palette.mode === "dark" ? `1px solid #67C99D` : `1px solid ${border}` })}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 950, fontSize: 15 }}>{preview.title || "معاينة الملف"}</Typography>
            <Typography color="text.secondary" sx={{ fontSize: 12, mt: 0.2 }}>
              {preview.fileName || ""}
            </Typography>
          </Box>
          <IconButton onClick={onClose}><CloseRoundedIcon /></IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={(theme) => ({ p: 0, bgcolor: theme.palette.mode === "dark" ? theme.palette.surfaces.page : "#f4f7f5", minHeight: 0 })}>
        {preview.loading && (
          <Box sx={{ height: "100%", display: "grid", placeItems: "center" }}>
            <Stack spacing={1} alignItems="center">
              <Skeleton variant="rounded" width={360} height={36} />
              <Typography color="text.secondary" sx={{ fontSize: 12 }}>جاري تجهيز المعاينة...</Typography>
            </Stack>
          </Box>
        )}

        {!preview.loading && preview.error && (
          <Box sx={{ p: 2 }}>
            <Alert severity="warning" sx={darkAlertSx}>{preview.error}</Alert>
          </Box>
        )}

        {!preview.loading && !preview.error && preview.url && preview.previewKind === "image" && (
          <Box sx={{ width: "100%", height: "100%", p: 1.5, display: "grid", placeItems: "center", overflow: "auto" }}>
            <Box component="img" src={preview.url} alt={preview.title || "preview"} sx={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 1.5 }} />
          </Box>
        )}

        {!preview.loading && !preview.error && preview.url && preview.previewKind === "pdf" && (
          <Box component="iframe" title="file-preview" src={preview.url} sx={{ border: 0, width: "100%", height: "100%", minHeight: "70vh" }} />
        )}
      </DialogContent>

      <DialogActions sx={uiLayout.withUiSx((theme) => ({ px: 1.5, py: 1, borderTop: theme.palette.mode === "dark" ? `1px solid #67C99D` : `1px solid ${border}` }), uiLayout.dialogActionsSx)}>
        <Button sx={uiLayout.buttonSx} onClick={onDownload} startIcon={<DownloadRoundedIcon />} disabled={!preview.requestUrl}>
          تحميل الملف
        </Button>
        <Button sx={uiLayout.buttonSx} onClick={onClose}>إغلاق</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function HrEmployeeHomePage() {
  const navigate = useNavigate();
  const [user] = useState(() => readUser());
  const [home, setHome] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);

  const attendanceRef = useRef(null);
  const documentsRef = useRef(null);
  const contractRef = useRef(null);
  const approvalsRef = useRef(null);

  const [myApprovals, setMyApprovals] = useState([]);
  const [approvalsLoading, setApprovalsLoading] = useState(false);
  const [resolvedManagers, setResolvedManagers] = useState([]);
  const [resolvedManagerSource, setResolvedManagerSource] = useState("");

  const [leaveTrackingOpen, setLeaveTrackingOpen] = useState(false);
  const [leaveTrackingLoading, setLeaveTrackingLoading] = useState(false);
  const [leaveTrackingData, setLeaveTrackingData] = useState(null);

  const [preview, setPreview] = useState({
    open: false,
    loading: false,
    url: "",
    error: "",
    title: "",
    fileName: "",
    previewKind: "",
    requestUrl: ""
  });

  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    leaveTypeGuid: "",
    fromDate: "",
    toDate: "",
    dayPart: 0,
    reason: "",
    attachment: null
  });
  const [leaveCalculation, setLeaveCalculation] = useState(null);
  const [leaveCalcError, setLeaveCalcError] = useState("");
  const [leaveCalculating, setLeaveCalculating] = useState(false);
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);

  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [permissionSubmitting, setPermissionSubmitting] = useState(false);
  const [permissionError, setPermissionError] = useState("");
  const [myPermissions, setMyPermissions] = useState([]);
  const [myPermissionsLoading, setMyPermissionsLoading] = useState(false);
  const [permissionForm, setPermissionForm] = useState(() => ({
    permissionDate: new Date().toISOString().slice(0, 10),
    permissionType: 1,
    fromTime: "",
    toTime: "",
    reason: "",
    notes: ""
  }));

  const [workDetailsOpen, setWorkDetailsOpen] = useState(false);
  const [personalDetailsOpen, setPersonalDetailsOpen] = useState(false);
  const [homeAlerts, setHomeAlerts] = useState([]);
  const [homeAlertAcknowledging, setHomeAlertAcknowledging] = useState(false);

  const userGuid = String(user?.guid || user?.Guid || "").trim();
  const userName = user?.fullName || user?.FullName || user?.userName || "الموظف";

  const selfHeaders = useMemo(
    () => ({
      Accept: "application/json",
      "X-User-Guid": userGuid
    }),
    [userGuid]
  );

  const loadData = useCallback(
    async ({ initial = false } = {}) => {
      if (!userGuid) {
        setError("تعذر تحديد المستخدم الحالي من localStorage.");
        setInitialLoading(false);
        return;
      }

      if (initial) setInitialLoading(true);
      else setRefreshing(true);

      setError("");

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/hr/home/${encodeURIComponent(userGuid)}`,
          {
            method: "GET",
            headers: selfHeaders,
            cache: "no-store"
          }
        );

        const result = await response.json().catch(() => null);

        if (!response.ok) {
          const message = result?.message || "تعذر تحميل الملف الوظيفي";
          const detail = result?.error || result?.detail || "";
          throw new Error(detail ? `${message} — ${detail}` : message);
        }

        const homeData = result?.data || result || {};
        let mergedHomeData = homeData;

        try {
          const profileResponse = await fetch(
            `${API_BASE_URL}/api/hr/employees/${encodeURIComponent(userGuid)}/profile`,
            {
              method: "GET",
              headers: selfHeaders,
              cache: "no-store"
            }
          );

          const profileResult = await profileResponse
            .json()
            .catch(() => null);

          if (profileResponse.ok) {
            mergedHomeData = {
              ...homeData,
              profile: {
                ...(homeData?.profile || {}),
                ...(profileResult?.data || {})
              }
            };
          }
        } catch (profileError) {
          console.warn(
            "Employee education/profile enrichment failed:",
            profileError
          );
        }

        setHome(mergedHomeData);
      } catch (requestError) {
        console.error("HR home error:", requestError);
        setError(requestError?.message || "حدث خطأ أثناء تحميل الصفحة الرئيسية");
      } finally {
        setInitialLoading(false);
        setRefreshing(false);
      }
    },
    [selfHeaders, userGuid]
  );

  const loadMyApprovals = useCallback(
    async () => {
      if (!userGuid) {
        setMyApprovals([]);
        return;
      }

      setApprovalsLoading(true);

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/hr/leaves/workflow/my-approvals?actorUserGuid=${encodeURIComponent(userGuid)}`,
          {
            cache: "no-store",
            headers: selfHeaders
          }
        );

        const result = await response
          .json()
          .catch(() => null);

        if (!response.ok) {
          throw new Error(
            result?.message ||
            result?.error ||
            "تعذر تحميل الموافقات الحالية"
          );
        }

        setMyApprovals(
          Array.isArray(result?.data)
            ? result.data
            : []
        );
      } catch (approvalError) {
        console.error(
          "HR workflow approvals error:",
          approvalError
        );

        // لا نسقط ملف الموظف بسبب فشل جزء الموافقات.
        setMyApprovals([]);
      } finally {
        setApprovalsLoading(false);
      }
    },
    [selfHeaders, userGuid]
  );

  const loadMyPermissions = useCallback(async () => {
    if (!userGuid) {
      setMyPermissions([]);
      return;
    }

    setMyPermissionsLoading(true);

    try {
      const params = new URLSearchParams({
        actorUserGuid: userGuid,
        take: "12"
      });

      const response = await fetch(
        `${API_BASE_URL}/api/hr/permissions/self?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
          headers: selfHeaders
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message ||
          result?.error ||
          "تعذر تحميل أذونات الموظف"
        );
      }

      setMyPermissions(
        Array.isArray(result?.data)
          ? result.data
          : []
      );
    } catch (permissionLoadError) {
      console.error(
        "HR self permissions error:",
        permissionLoadError
      );
      setMyPermissions([]);
    } finally {
      setMyPermissionsLoading(false);
    }
  }, [selfHeaders, userGuid]);

  const loadResolvedManagers = useCallback(async () => {
    if (!userGuid) {
      setResolvedManagers([]);
      setResolvedManagerSource("");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/hr/org/manager-chain/${encodeURIComponent(userGuid)}`,
        { cache: "no-store" }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message ||
          "تعذر تحديد المدير المباشر"
        );
      }

      setResolvedManagers(
        Array.isArray(result?.managers)
          ? result.managers
          : []
      );
      setResolvedManagerSource(result?.source || "");
    } catch (managerError) {
      console.warn(
        "Direct manager resolution failed:",
        managerError
      );
      setResolvedManagers([]);
      setResolvedManagerSource("");
    }
  }, [userGuid]);

  const loadHomeAlerts = useCallback(async () => {
    if (!userGuid) {
      setHomeAlerts([]);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/hr/home-alerts/unread/${encodeURIComponent(userGuid)}`,
        {
          method: "GET",
          cache: "no-store",
          headers: selfHeaders
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message || result?.error || "تعذر تحميل التنبيهات"
        );
      }

      setHomeAlerts(Array.isArray(result?.data) ? result.data : []);
    } catch (homeAlertError) {
      console.warn("Employee home alerts load failed:", homeAlertError);
      setHomeAlerts([]);
    }
  }, [selfHeaders, userGuid]);

  const acknowledgeHomeAlert = useCallback(async () => {
    const currentAlert = homeAlerts[0];
    if (!currentAlert?.alertGuid || !userGuid || homeAlertAcknowledging) return;

    setHomeAlertAcknowledging(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/hr/home-alerts/${encodeURIComponent(currentAlert.alertGuid)}/seen`,
        {
          method: "POST",
          headers: {
            ...selfHeaders,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ employeeGuid: userGuid })
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message || result?.error || "تعذر حفظ الاطلاع على التنبيه"
        );
      }

      setHomeAlerts((current) =>
        current.filter((item) => item?.alertGuid !== currentAlert.alertGuid)
      );
    } catch (homeAlertError) {
      console.error("Employee home alert acknowledge failed:", homeAlertError);
      setNotice({
        severity: "error",
        text: homeAlertError?.message || "تعذر حفظ الاطلاع على التنبيه"
      });
    } finally {
      setHomeAlertAcknowledging(false);
    }
  }, [homeAlerts, homeAlertAcknowledging, selfHeaders, userGuid]);

  useEffect(() => {
    loadHomeAlerts();
  }, [loadHomeAlerts]);

  useEffect(() => {
    loadData({ initial: true });
    loadMyApprovals();
    loadMyPermissions();
    loadResolvedManagers();
  }, [
    loadData,
    loadMyApprovals,
    loadMyPermissions,
    loadResolvedManagers
  ]);

  useEffect(() => {
    return () => {
      if (preview.url) URL.revokeObjectURL(preview.url);
    };
  }, [preview.url]);

  const employee = home?.employee || {};
  const profile = home?.profile || {};
  const attendance = home?.attendance || {};
  const leave = home?.leave || {};
  const contract = home?.contract || {};
  const documents = home?.documents || {};
  const management = home?.management || {};
  const scope = home?.scope || {};
  const capabilities = home?.capabilities || {};
  const hrPermissions = home?.hrPermissions || {};

  const canShowManagement = scope?.canManage === true;

  const annualBalance =
    (leave?.balances || []).find(
      (item) => String(item.code || "").toUpperCase() === "ANNUAL"
    ) || (leave?.balances || []).find((item) => item.requiresBalance);

  const contractEnd = contract?.endDate ? new Date(contract.endDate) : null;
  const contractDaysLeft =
    contractEnd && !Number.isNaN(contractEnd.getTime())
      ? Math.ceil((contractEnd.getTime() - Date.now()) / 86400000)
      : null;

  const imageUrl = userGuid
    ? `https://filesregsiteration.sstli.com/erp/image_api.php?action=get&userGuid=${encodeURIComponent(userGuid)}`
    : "";

  const quickLinks = useMemo(() => {
    if (hrPermissions?.canView !== true) return [];

    const all = [
      ["employees", "ملفات الموظفين", "/dashboard/hr-employees", <GroupsRoundedIcon fontSize="small" />],
      ["departments", "الأقسام", "/dashboard/hr-departments", <ApartmentRoundedIcon fontSize="small" />],
      ["jobTitles", "المسميات الوظيفية", "/dashboard/hr-job-titles", <WorkRoundedIcon fontSize="small" />],
      ["contracts", "عقود الموظفين", "/dashboard/hr-contracts", <DescriptionRoundedIcon fontSize="small" />],
      ["attendance", "الحضور والانصراف", "/dashboard/hr-attendance", <AccessTimeRoundedIcon fontSize="small" />],
      ["leaves", "الإجازات", "/dashboard/hr-leaves", <EventAvailableRoundedIcon fontSize="small" />],
      ["employeePermissions", "أذونات الموظفين", "/dashboard/hr-employee-permissions", <ManageAccountsRoundedIcon fontSize="small" />],
      ["assetsCustody", "العهد والأصول", "/dashboard/hr-assets-custody", <AccountBalanceRoundedIcon fontSize="small" />],
      ["payroll", "مسير الرواتب", "/dashboard/hr-payroll", <PaymentsRoundedIcon fontSize="small" />],
      ["allowancesDeductions", "البدلات والاستقطاعات", "/dashboard/hr-allowances-deductions", <PaidRoundedIcon fontSize="small" />],
      ["evaluations", "تقييم الموظفين", "/dashboard/hr-evaluations", <RateReviewRoundedIcon fontSize="small" />],
      ["training", "التدريب والتطوير", "/dashboard/hr-training", <SchoolRoundedIcon fontSize="small" />],
      ["disciplinaryActions", "الجزاءات والمخالفات", "/dashboard/hr-disciplinary-actions", <BlockRoundedIcon fontSize="small" />],
      ["recruitment", "طلبات التوظيف", "/dashboard/hr-recruitment", <PersonAddAlt1RoundedIcon fontSize="small" />],
      ["termination", "إنهاء الخدمة", "/dashboard/hr-termination", <ExitToAppRoundedIcon fontSize="small" />],
      ["reports", "تقارير الموارد البشرية", "/dashboard/hr-reports", <AssessmentRoundedIcon fontSize="small" />]
    ];

    return all
      .filter(([permission]) => hrPermissions?.[permission] === true)
      .map(([permission, label, path, icon]) => ({ permission, label, path, icon }));
  }, [hrPermissions]);

  const scrollTo = (ref) => {
    ref?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const getOwnFileUrl = (item, kind, download = false) => {
    if (kind === "contract") {
      return `${API_BASE_URL}/api/hr/home/${encodeURIComponent(userGuid)}/contract/${encodeURIComponent(item.contractGuid)}/file${download ? "?download=true" : ""}`;
    }

    return `${API_BASE_URL}/api/hr/home/${encodeURIComponent(userGuid)}/documents/${encodeURIComponent(item.documentGuid)}/file${download ? "?download=true" : ""}`;
  };

  const closePreview = () => {
    if (preview.url) URL.revokeObjectURL(preview.url);
    setPreview({
      open: false,
      loading: false,
      url: "",
      error: "",
      title: "",
      fileName: "",
      previewKind: "",
      requestUrl: ""
    });
  };

  const openPreview = async (item, kind) => {
    const fileName = item?.originalFileName || (kind === "contract" ? "العقد الوظيفي" : "مرفق الموظف");
    const extension = String(item?.fileExtension || `.${String(fileName).split(".").pop() || ""}`).toLowerCase();
    const contentType = String(item?.contentType || "").toLowerCase();
    const previewKind =
      contentType.includes("pdf") || extension === ".pdf"
        ? "pdf"
        : contentType.startsWith("image/") || [".jpg", ".jpeg", ".png", ".webp"].includes(extension)
          ? "image"
          : "";

    const requestUrl = getOwnFileUrl(item, kind, false);

    if (preview.url) URL.revokeObjectURL(preview.url);

    setPreview({
      open: true,
      loading: Boolean(previewKind),
      url: "",
      error: previewKind ? "" : "هذا النوع لا يدعم المعاينة داخل المتصفح، ويمكن تحميله من زر تحميل الملف.",
      title: kind === "contract" ? "معاينة العقد الوظيفي" : item?.documentTypeName || "معاينة المرفق",
      fileName,
      previewKind,
      requestUrl
    });

    if (!previewKind) return;

    try {
      const response = await fetch(requestUrl, {
        headers: selfHeaders,
        cache: "no-store"
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message || "تعذر تحميل المعاينة");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      setPreview((current) => ({
        ...current,
        loading: false,
        url,
        error: ""
      }));
    } catch (previewError) {
      setPreview((current) => ({
        ...current,
        loading: false,
        error: previewError?.message || "تعذر عرض الملف"
      }));
    }
  };

  const downloadOwnFile = async (item, kind) => {
    try {
      const url = getOwnFileUrl(item, kind, true);
      const response = await fetch(url, {
        headers: selfHeaders,
        cache: "no-store"
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message || "تعذر تحميل الملف");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = item?.originalFileName || (kind === "contract" ? "contract" : "document");
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (downloadError) {
      setNotice({ severity: "error", text: downloadError?.message || "تعذر تحميل الملف" });
    }
  };

  const downloadCurrentPreview = async () => {
    if (!preview.requestUrl) return;

    try {
      const downloadUrl = preview.requestUrl.includes("?")
        ? `${preview.requestUrl}&download=true`
        : `${preview.requestUrl}?download=true`;

      const response = await fetch(downloadUrl, {
        headers: selfHeaders,
        cache: "no-store"
      });

      if (!response.ok) throw new Error("تعذر تحميل الملف");

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = preview.fileName || "file";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (downloadError) {
      setNotice({ severity: "error", text: downloadError?.message || "تعذر تحميل الملف" });
    }
  };

  const selectedLeaveType = useMemo(
    () => (leave?.types || []).find((item) => item.leaveTypeGuid === leaveForm.leaveTypeGuid) || null,
    [leave?.types, leaveForm.leaveTypeGuid]
  );

  useEffect(() => {
    setLeaveCalculation(null);
    setLeaveCalcError("");

    if (!leaveDialogOpen || !leaveForm.leaveTypeGuid || !leaveForm.fromDate || !leaveForm.toDate) return undefined;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        setLeaveCalculating(true);

        const response = await fetch(`${API_BASE_URL}/api/hr/leaves/calculate-days`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-User-Guid": userGuid
          },
          body: JSON.stringify({
            employeeGuid: userGuid,
            leaveTypeGuid: leaveForm.leaveTypeGuid,
            fromDate: leaveForm.fromDate,
            toDate: leaveForm.toDate,
            dayPart: Number(leaveForm.dayPart || 0)
          }),
          signal: controller.signal
        });

        const result = await response.json().catch(() => null);
        if (!response.ok) throw new Error(result?.message || result?.error || "تعذر حساب أيام الإجازة");
        setLeaveCalculation(result);
      } catch (calcError) {
        if (calcError?.name !== "AbortError") {
          setLeaveCalcError(calcError?.message || "تعذر حساب أيام الإجازة");
        }
      } finally {
        if (!controller.signal.aborted) setLeaveCalculating(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [leaveDialogOpen, leaveForm.leaveTypeGuid, leaveForm.fromDate, leaveForm.toDate, leaveForm.dayPart, userGuid]);

  const openPermissionDialog = () => {
    setPermissionForm({
      permissionDate: new Date().toISOString().slice(0, 10),
      permissionType: 1,
      fromTime: "",
      toTime: "",
      reason: "",
      notes: ""
    });
    setPermissionError("");
    setPermissionDialogOpen(true);
  };

  const submitPermissionRequest = async () => {
    if (!userGuid) {
      setPermissionError("تعذر تحديد الموظف الحالي.");
      return;
    }

    if (!permissionForm.permissionDate) {
      setPermissionError("حدد تاريخ الإذن.");
      return;
    }

    if (!String(permissionForm.reason || "").trim()) {
      setPermissionError("سبب الإذن مطلوب.");
      return;
    }

    const type = Number(permissionForm.permissionType);

    if (type === 1 && !permissionForm.toTime) {
      setPermissionError("حدد وقت السماح بالحضور.");
      return;
    }

    if (type === 2 && !permissionForm.fromTime) {
      setPermissionError("حدد وقت بداية الانصراف.");
      return;
    }

    if (type === 3) {
      if (!permissionForm.fromTime || !permissionForm.toTime) {
        setPermissionError("حدد وقت الخروج ووقت العودة.");
        return;
      }

      // الوردية قد تكون ليلية وتعبر منتصف الليل؛
      // التحقق النهائي من ترتيب/احتواء الأوقات يتم في الـ API مقابل الوردية الفعلية.
    }

    try {
      setPermissionSubmitting(true);
      setPermissionError("");

      const response = await fetch(
        `${API_BASE_URL}/api/hr/permissions/self`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-User-Guid": userGuid
          },
          body: JSON.stringify({
            actorUserGuid: userGuid,
            actorName: userName,
            permissionDate: permissionForm.permissionDate,
            permissionType: type,
            fromTime:
              (type === 2 || type === 3) &&
              permissionForm.fromTime
                ? `${permissionForm.fromTime}:00`
                : null,
            toTime:
              (type === 1 || type === 3) &&
              permissionForm.toTime
                ? `${permissionForm.toTime}:00`
                : null,
            reason: String(permissionForm.reason).trim(),
            notes:
              String(permissionForm.notes || "").trim() ||
              null
          })
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message ||
          result?.error ||
          "تعذر إرسال طلب الإذن"
        );
      }

      setPermissionDialogOpen(false);
      setNotice({
        severity: "success",
        text:
          result?.message ||
          "تم إرسال طلب الإذن للمراجعة"
      });

      await Promise.all([
        loadMyPermissions(),
        loadData()
      ]);
    } catch (permissionSubmitError) {
      setPermissionError(
        permissionSubmitError?.message ||
        "تعذر إرسال طلب الإذن"
      );
    } finally {
      setPermissionSubmitting(false);
    }
  };

  const cancelMyPermission = async (row) => {
    if (!row?.permissionGuid || !userGuid) return;

    const confirm = await Swal.fire({
      icon: "warning",
      title: "إلغاء طلب الإذن؟",
      text: `سيتم إلغاء الطلب رقم ${row.permissionNumber || ""}`,
      showCancelButton: true,
      confirmButtonText: "إلغاء الطلب",
      cancelButtonText: "رجوع",
      confirmButtonColor: danger
    });

    if (!confirm.isConfirmed) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/hr/permissions/self/${encodeURIComponent(
          row.permissionGuid
        )}/cancel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-User-Guid": userGuid
          },
          body: JSON.stringify({
            actorUserGuid: userGuid,
            actorName: userName,
            reason: "إلغاء بواسطة الموظف"
          })
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message ||
          result?.error ||
          "تعذر إلغاء طلب الإذن"
        );
      }

      setNotice({
        severity: "success",
        text: result?.message || "تم إلغاء طلب الإذن"
      });

      await loadMyPermissions();
    } catch (permissionCancelError) {
      await Swal.fire({
        icon: "error",
        title: "تعذر الإلغاء",
        text:
          permissionCancelError?.message ||
          "حدث خطأ أثناء إلغاء طلب الإذن"
      });
    }
  };

  const openLeaveDialog = () => {
    const firstType = (leave?.types || [])[0];
    const today = new Date().toISOString().slice(0, 10);

    setLeaveForm({
      leaveTypeGuid: firstType?.leaveTypeGuid || "",
      fromDate: today,
      toDate: today,
      dayPart: 0,
      reason: "",
      attachment: null
    });
    setLeaveCalculation(null);
    setLeaveCalcError("");
    setLeaveDialogOpen(true);
  };

  const submitLeaveRequest = async () => {
    if (!leaveForm.leaveTypeGuid || !leaveForm.fromDate || !leaveForm.toDate) {
      setLeaveCalcError("حدد نوع الإجازة والفترة أولاً.");
      return;
    }

    if (selectedLeaveType?.requiresAttachment && !leaveForm.attachment) {
      setLeaveCalcError("نوع الإجازة المختار يتطلب إرفاق ملف.");
      return;
    }

    if (!leaveCalculation || Number(leaveCalculation.requestedDays || 0) <= 0) {
      setLeaveCalcError("انتظر حساب أيام الإجازة والتأكد من صحة الفترة.");
      return;
    }

    try {
      setLeaveSubmitting(true);
      setLeaveCalcError("");

      const formData = new FormData();
      formData.append("EmployeeGuid", userGuid);
      formData.append("LeaveTypeGuid", leaveForm.leaveTypeGuid);
      formData.append("FromDate", leaveForm.fromDate);
      formData.append("ToDate", leaveForm.toDate);
      formData.append("DayPart", String(Number(leaveForm.dayPart || 0)));
      formData.append("Reason", leaveForm.reason || "");
      formData.append("ActorUserGuid", userGuid);
      formData.append("ActorName", userName);
      if (leaveForm.attachment) formData.append("Attachment", leaveForm.attachment);

      const response = await fetch(`${API_BASE_URL}/api/hr/leaves/request`, {
        method: "POST",
        headers: { "X-User-Guid": userGuid },
        body: formData
      });

      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message || result?.error || "تعذر إرسال طلب الإجازة");

      setLeaveDialogOpen(false);
      setNotice({
        severity: "success",
        text: result?.message || `تم إرسال طلب الإجازة رقم ${result?.data?.requestNumber || ""} بنجاح`
      });
      await Promise.all([
        loadData({ initial: false }),
        loadMyApprovals()
      ]);
    } catch (submitError) {
      setLeaveCalcError(submitError?.message || "تعذر إرسال طلب الإجازة");
    } finally {
      setLeaveSubmitting(false);
    }
  };

  
  const leaveTrackingStageInfo = (status) => {
    switch (status) {
      case "Approved":
        return ["تمت الموافقة", "success"];
      case "Rejected":
        return ["مرفوضة", "error"];
      case "Cancelled":
        return ["ملغاة", "default"];
      case "Pending":
      default:
        return ["بانتظار الموافقة", "warning"];
    }
  };

  const leaveHistoryActionText = (action) => {
    switch (action) {
      case "SUBMIT":
        return "تم تقديم الطلب";
      case "STEP_APPROVE":
        return "تمت موافقة مرحلة";
      case "FINAL_APPROVE":
        return "تم الاعتماد النهائي";
      case "STEP_REJECT":
        return "تم رفض الطلب";
      case "CANCEL":
        return "تم إلغاء الطلب";
      case "ROUTE_REFRESH":
        return "تم تحديث مسار الموافقات";
      default:
        return action || "إجراء";
    }
  };

  const openLeaveTracking = async (row) => {
    if (!row?.leaveRequestGuid || !userGuid)
      return;

    setLeaveTrackingOpen(true);
    setLeaveTrackingLoading(true);
    setLeaveTrackingData(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/hr/leaves/${encodeURIComponent(row.leaveRequestGuid)}/tracking?actorUserGuid=${encodeURIComponent(userGuid)}`,
        {
          cache: "no-store",
          headers: selfHeaders
        }
      );

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message ||
          result?.error ||
          "تعذر تحميل متابعة طلب الإجازة"
        );
      }

      setLeaveTrackingData(result);
    } catch (trackingError) {
      setLeaveTrackingOpen(false);

      await Swal.fire({
        icon: "error",
        title: "تعذر تحميل المتابعة",
        text:
          trackingError?.message ||
          "حدث خطأ أثناء تحميل مسار الإجازة"
      });
    } finally {
      setLeaveTrackingLoading(false);
    }
  };

const decideLeaveApproval = async (
    row,
    action
  ) => {
    if (!row?.leaveRequestGuid || !userGuid)
      return;

    const isReject = action === "reject";

    const ask = await Swal.fire({
      icon: isReject ? "warning" : "question",
      title: isReject
        ? "رفض طلب الإجازة"
        : `الموافقة - ${row.currentApprovalRole || "المرحلة الحالية"}`,
      html: `
        <div style="font-size:13px;line-height:1.9;text-align:right">
          <b>${row.employeeName || "-"}</b><br/>
          ${row.leaveTypeName || "-"} • ${row.requestedDays || 0} يوم
        </div>
      `,
      input: "textarea",
      inputPlaceholder: isReject
        ? "اكتب سبب الرفض..."
        : "ملاحظات الموافقة - اختياري",
      showCancelButton: true,
      confirmButtonText: isReject
        ? "رفض الطلب"
        : "موافقة",
      cancelButtonText: "رجوع",
      confirmButtonColor: isReject
        ? "#c53030"
        : "#057546",
      inputValidator: (value) =>
        isReject &&
        !String(value || "").trim()
          ? "سبب الرفض مطلوب"
          : undefined
    });

    if (!ask.isConfirmed)
      return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/hr/leaves/${encodeURIComponent(row.leaveRequestGuid)}/${action}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-Guid": userGuid
          },
          body: JSON.stringify({
            notes: String(ask.value || "").trim(),
            actorUserGuid: userGuid,
            actorName: userName
          })
        }
      );

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message ||
          result?.error ||
          "تعذر تنفيذ قرار الموافقة"
        );
      }

      await Swal.fire({
        icon: "success",
        title: "تم",
        text:
          result?.message ||
          "تم تنفيذ القرار بنجاح"
      });

      await Promise.all([
        loadMyApprovals(),
        loadData({ initial: false })
      ]);
    } catch (approvalError) {
      await Swal.fire({
        icon: "error",
        title: "تعذر تنفيذ القرار",
        text:
          approvalError?.message ||
          "حدث خطأ أثناء تنفيذ الموافقة"
      });
    }
  };

  const openLeaveApprovalAttachment = (row) => {
    if (!row?.leaveRequestGuid)
      return;

    window.open(
      `${API_BASE_URL}/api/hr/leaves/${encodeURIComponent(row.leaveRequestGuid)}/attachment`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  if (initialLoading) return <HomeSkeleton />;

  if (error && !home) {
    return (
      <Paper elevation={0} sx={(theme) => ({ p: 2, borderRadius: 3, border: theme.palette.mode === "dark" ? `1px solid ${pinColor("rgba(229,90,90,.4)")}` : "1px solid rgba(197,48,48,.15)" })}>
        <Alert severity="error" sx={darkAlertSx} action={<Button sx={uiLayout.buttonSx} size="small" onClick={() => loadData({ initial: true })}>إعادة المحاولة</Button>}>
          {error}
        </Alert>
      </Paper>
    );
  }

  return (
    <Box
      dir={PAGE_DIRECTION}
      sx={{
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        ...uiLayout.scopeSx,
        pb: { xs: 1, sm: 1.5 },
        textAlign: PAGE_TEXT_ALIGN,
        "& .MuiButton-startIcon": {
          marginInlineEnd: { xs: 0.45, sm: 0.7 }
        }
      }}
    >
      {refreshing && <LinearProgress sx={{ mb: 0.6, borderRadius: 2 }} />}

      {notice && (
        <Alert
          severity={notice.severity || "info"}
          onClose={() => setNotice(null)}
          sx={uiLayout.withUiSx(darkAlertSx, { mb: 1 })}
        >
          {notice.text}
        </Alert>
      )}

      {error && home && (
        <Alert severity="warning" sx={uiLayout.withUiSx(darkAlertSx, { mb: 1 })}>
          تعذر تحديث بعض البيانات: {error}
        </Alert>
      )}

      <HomeAlertDialog
        alert={homeAlerts[0] || null}
        open={Boolean(homeAlerts[0])}
        acknowledging={homeAlertAcknowledging}
        onAcknowledge={acknowledgeHomeAlert}
      />

      <Paper
        elevation={0}
        sx={(theme) => {
          const isDark = theme.palette.mode === "dark";
          return {
            position: "relative",
            overflow: "hidden",
            borderRadius: 3.3,
            p: { xs: 1, sm: 1.35, md: 2 },
            mb: { xs: 0.85, sm: 1.05, md: 1.25 },
            color: "#fff",
            // The light-mode gradient's bright, saturated green looked out of
            // place dropped straight onto the dark page (too neon next to
            // the muted dark cards below it), so dark mode gets its own
            // deeper, richer blend of the same brand green instead of reusing
            // the light one as-is, plus the glow border used on every other
            // card so the header reads as "handled for dark mode" too.
            background: isDark
              ? "linear-gradient(125deg,#0a2118 0%,#155c3d 55%,#1f8058 100%)"
              : "linear-gradient(125deg,#034d31 0%,#057546 52%,#0b8b58 100%)",
            border: isDark ? "1px solid rgba(103,201,157,.28)" : "none",
            boxShadow: isDark
              ? "0 0 32px rgba(103,201,157,.10), 0 18px 40px rgba(0,0,0,.55)"
              : "0 15px 35px rgba(3,77,49,.15)"
          };
        }}
      >
        <Box
          sx={{
            position: "absolute",
            insetInlineEnd: -75,
            top: -100,
            width: 250,
            height: 250,
            borderRadius: "50%",
            border: "38px solid rgba(255,255,255,.05)"
          }}
        />

        <Box
          sx={{
            position: "relative",
            display: "grid",
            gridTemplateColumns: {
              xs: "58px minmax(0,1fr)",
              sm: "auto minmax(0,1fr) auto"
            },
            gap: { xs: 0.8, sm: 1.15, md: 1.4 },
            alignItems: "center"
          }}
        >
          <Avatar
            src={imageUrl}
            alt={employee?.fullName || ""}
            sx={{
              width: { xs: 56, sm: 72, md: 92 },
              height: { xs: 56, sm: 72, md: 92 },
              border: "4px solid rgba(255,255,255,.25)",
              background: "rgba(255,255,255,.16)",
              fontSize: { xs: 22, sm: 26, md: 30 },
              fontWeight: 950
            }}
          >
            {(employee?.fullName || "?").slice(0, 1)}
          </Avatar>

          <Box sx={{ minWidth: 0, textAlign: SECTION_TEXT_ALIGN }}>
            <Typography
              sx={{
                fontSize: { xs: 16, sm: 20, md: 26 },
                fontWeight: 950,
                lineHeight: 1.2,
                textAlign: SECTION_TEXT_ALIGN
              }}
            >
              {employee?.fullName || "الموظف"}
            </Typography>

            <Typography
              sx={{
                opacity: 0.9,
                fontSize: { xs: 12, sm: 12, md: 12 },
                lineHeight: 1.45,
                fontWeight: 800,
                mt: 0.25,
                textAlign: SECTION_TEXT_ALIGN
              }}
            >
              {employee?.jobTitleName || scope?.displayName || "موظف"}
              {employee?.departmentName ? ` • ${employee.departmentName}` : ""}
              {employee?.branchName ? ` • ${employee.branchName}` : ""}
            </Typography>

            <Stack
              direction="row"
              spacing={0.45}
              flexWrap="wrap"
              useFlexGap
              sx={{
                mt: { xs: 0.65, sm: 0.9, md: 1.05 },
                            "& .MuiChip-root": {
                  height: { xs: 22, sm: 25, md: 28 },
                  fontSize: { xs: 12, sm: 12, md: 12 }
                }
              }}
            >
              <Chip size="small" label={`كود الموظف: ${employee?.employeeCode || "-"}`} sx={{ color: "#fff", background: "rgba(255,255,255,.14)", fontWeight: 900 }} />
              <Chip size="small" label={employee?.isActive ? "موظف نشط" : "غير نشط"} sx={{ color: "#fff", background: "rgba(255,255,255,.14)", fontWeight: 900 }} />
              {canShowManagement && (
                <Chip size="small" label={scope?.scopeLabel || "لوحة إدارية"} sx={{ color: "#fff", background: "rgba(255,255,255,.14)", fontWeight: 900 }} />
              )}
            </Stack>
          </Box>

          <Button
            variant="contained"
            startIcon={<RefreshRoundedIcon />}
            onClick={() => {
              loadData({ initial: false });
              loadMyApprovals();
            }}
            disabled={refreshing}
            sx={uiLayout.withUiSx({
              // Pinned (not auto-darkened): this button keeps a white
              // background in both themes (see below), so its text must stay
              // dark green too instead of the auto dark-mode lightening a
              // plain literal color would otherwise get.
              color: `light-dark(${primaryDark}, ${primaryDark})`,
              // This button sits on the header's fixed brand-green gradient in
              // both themes, so its background must stay light-dark()-pinned
              // white — a literal "#fff" would otherwise get auto-darkened by
              // the dark-mode color plugin and vanish into a near-black chip
              // against the still-green banner.
              background: "light-dark(#ffffff, #ffffff)",
              fontWeight: 950,
              minHeight: { xs: 34, sm: 38 },
              fontSize: { xs: 12, sm: 12 },
              gridColumn: { xs: "1 / -1", sm: "auto" },
              justifySelf: { xs: "stretch", sm: "end" },
              "&:hover": { background: "light-dark(#f3fbf7, #f3fbf7)" }
            }, uiLayout.buttonSx)}
          >
            تحديث الملف
          </Button>
        </Box>
      </Paper>

      <Paper
        elevation={0}
        sx={(theme) => {
          const isDark = theme.palette.mode === "dark";
          return {
            p: { xs: 0.65, sm: 0.85, md: 1 },
            mb: { xs: 0.85, sm: 1, md: 1.25 },
            borderRadius: 2.7,
            border: isDark
              ? `1px solid #67C99D`
              : `1px solid ${border}`,
            background: isDark ? theme.palette.surfaces.card : "rgba(255,255,255,.86)",
            boxShadow: isDark ? `0 0 0 1px #67C99D` : "none"
          };
        }}
      >
        <Box
          sx={uiLayout.withUiSx({
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2,minmax(0,1fr))",
              sm: "repeat(5,minmax(0,auto))"
            },
            gap: { xs: 0.45, sm: 0.7 },
            "& .MuiButton-root": {
              minHeight: { xs: 32, sm: 35 },
              px: { xs: 0.55, sm: 0.9 },
              fontSize: { xs: 12, sm: 12 },
              whiteSpace: "nowrap"
            }
          }, uiLayout.actionBarSx)}
        >
          <Button sx={[uiLayout.buttonSx, permissionButtonSx]} size="small" variant="outlined" startIcon={<AddRoundedIcon />} onClick={openLeaveDialog} disabled={!capabilities?.canRequestLeave}>
            طلب إجازة جديد
          </Button>
          <Button
  sx={[uiLayout.buttonSx, permissionButtonSx]}
  size="small"
  variant="outlined"
  startIcon={<ManageAccountsRoundedIcon />}
  onClick={openPermissionDialog}
>
  طلب إذن
</Button>
          <Button sx={uiLayout.buttonSx} size="small" variant="outlined" startIcon={<AccessTimeRoundedIcon />} onClick={() => scrollTo(attendanceRef)}>
            حضوري
          </Button>
          <Button sx={uiLayout.buttonSx} size="small" variant="outlined" startIcon={<DescriptionRoundedIcon />} onClick={() => scrollTo(contractRef)}>
            عقدي وراتبي
          </Button>
          <Button sx={uiLayout.buttonSx} size="small" variant="outlined" startIcon={<FolderRoundedIcon />} onClick={() => scrollTo(documentsRef)}>
            مرفقاتي ({documents?.count || 0})
          </Button>
        </Box>
      </Paper>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2,minmax(0,1fr))",
            md: "repeat(4,minmax(0,1fr))"
          },
          gap: { xs: 0.55, sm: 0.8, md: 1 },
          mb: { xs: 0.9, sm: 1.1, md: 1.4 }
        }}
      >
        <MetricCard title="الحضور هذا الشهر" value={attendance?.presentDays ?? 0} subtitle={`تأخير ${attendance?.lateDays ?? 0} • غياب ${attendance?.absentDays ?? 0}`} icon={<AccessTimeRoundedIcon />} tone="info" onClick={() => scrollTo(attendanceRef)} />
        <MetricCard title="رصيد الإجازة السنوية" value={annualBalance ? `${Number(annualBalance.availableDays || 0).toLocaleString("ar-SA", { maximumFractionDigits: 2 })} يوم` : "0 يوم"} subtitle={annualBalance?.leaveTypeName || "لا يوجد رصيد معرف"} icon={<EventAvailableRoundedIcon />} onClick={openLeaveDialog} />
        <MetricCard title="الراتب الأساسي" value={contract?.hasContract ? money(contract?.basicSalary) : "غير متاح"} subtitle={contract?.hasContract ? `العقد: ${statusMeta(contract.contractStatus).text}` : "لا يوجد عقد حالي"} icon={<AccountBalanceWalletRoundedIcon />} onClick={() => scrollTo(contractRef)} />
        <MetricCard title="المرفقات" value={documents?.count ?? 0} subtitle="مستندات الملف الوظيفي" icon={<FolderRoundedIcon />} onClick={() => scrollTo(documentsRef)} />
      </Box>

      {(approvalsLoading || myApprovals.length > 0) && (
        <Box
          ref={approvalsRef}
          sx={{ mb: { xs: 0.9, sm: 1.2, md: 1.4 } }}
        >
          <Section
            title={`موافقات تنتظر قراري${myApprovals.length ? ` (${myApprovals.length})` : ""}`}
            subtitle="لا يظهر هنا إلا الطلب الموجود في مرحلتك الحالية أنت"
          >
            {approvalsLoading ? (
              <Stack spacing={0.7}>
                <Skeleton variant="rounded" height={82} />
                <Skeleton variant="rounded" height={82} />
              </Stack>
            ) : (
              <Stack spacing={0.75}>
                {myApprovals.map((row) => (
                  <Paper
                    key={row.leaveRequestGuid}
                    elevation={0}
                    sx={(theme) => {
                      const isDark = theme.palette.mode === "dark";
                      return {
                        p: { xs: 0.9, sm: 1.1 },
                        borderRadius: 2.2,
                        border: isDark
                          ? `1px solid #67C99D`
                          : `1px solid ${border}`,
                        background: isDark
                          ? theme.palette.surfaces.nested
                          : "linear-gradient(180deg,#fff 0%,#fbfdfc 100%)"
                      };
                    }}
                  >
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          md: "minmax(0,1fr) auto"
                        },
                        gap: { xs: 0.8, md: 1.2 },
                        alignItems: "center"
                      }}
                    >
                      <Box
                        sx={{
                          minWidth: 0,
                          textAlign: SECTION_TEXT_ALIGN
                        }}
                      >
                        <Stack
                          direction="row"
                          spacing={0.55}
                          flexWrap="wrap"
                          useFlexGap
                          alignItems="center"
                          sx={{ mb: 0.35 }}
                        >
                          <Chip
                            size="small"
                            color="warning"
                            label={
                              row.currentApprovalRole ||
                              `المرحلة ${row.currentApprovalStep || ""}`
                            }
                            sx={{
                              fontWeight: 900,
                              height: 24
                            }}
                          />
                          <Chip
                            size="small"
                            variant="outlined"
                            label={`#${row.requestNumber}`}
                            sx={{ height: 24 }}
                          />
                        </Stack>

                        <Typography
                          sx={{
                            fontWeight: 950,
                            fontSize: { xs: 12.2, sm: 13.2 }
                          }}
                        >
                          {row.employeeName}
                        </Typography>

                        <Typography
                          color="text.secondary"
                          sx={{
                            mt: 0.15,
                            fontSize: { xs: 12, sm: 12 }
                          }}
                        >
                          {row.employeeCode
                            ? `كود ${row.employeeCode} • `
                            : ""}
                          {row.branchName || "بدون فرع"}
                        </Typography>

                        <Box
                          sx={{
                            mt: 0.65,
                            display: "grid",
                            gridTemplateColumns: {
                              xs: "1fr 1fr",
                              sm: "repeat(3,minmax(0,auto))"
                            },
                            gap: 0.55
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: { xs: 12, sm: 12 },
                              fontWeight: 850
                            }}
                          >
                            {row.leaveTypeName}
                          </Typography>
                          <Typography
                            dir={DATE_DIRECTION}
                            sx={{
                              fontSize: { xs: 12, sm: 12 },
                              textAlign: DATE_TEXT_ALIGN
                            }}
                          >
                            {fmtDate(row.fromDate)}
                            {" → "}
                            {fmtDate(row.toDate)}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: { xs: 12, sm: 12 },
                              fontWeight: 900
                            }}
                          >
                            {row.requestedDays || 0} يوم
                          </Typography>
                        </Box>

                        {row.reason && (
                          <Typography
                            color="text.secondary"
                            sx={{
                              mt: 0.55,
                              fontSize: { xs: 12, sm: 12 },
                              lineHeight: 1.6,
                              overflow: "hidden",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical"
                            }}
                          >
                            السبب: {row.reason}
                          </Typography>
                        )}
                      </Box>

                      <Stack
                        direction={{ xs: "row", md: "column" }}
                        spacing={0.55}
                        sx={uiLayout.withUiSx({
                          minWidth: { md: 112 },
                          "& .MuiButton-root": {
                            minHeight: 32,
                            fontSize: { xs: 12, sm: 12 },
                            fontWeight: 900
                          }
                        }, uiLayout.actionBarSx)}
                      >
                        <Button sx={uiLayout.buttonSx}
                          fullWidth
                          size="small"
                          variant="outlined"
                          startIcon={
                            <HistoryToggleOffRoundedIcon fontSize="small" />
                          }
                          onClick={() =>
                            openLeaveTracking(row)
                          }
                        >
                          متابعة
                        </Button>

                        <Button sx={uiLayout.buttonSx}
                          fullWidth
                          size="small"
                          color="success"
                          variant="contained"
                          onClick={() =>
                            decideLeaveApproval(
                              row,
                              "approve"
                            )
                          }
                        >
                          موافقة
                        </Button>

                        <Button sx={uiLayout.buttonSx}
                          fullWidth
                          size="small"
                          color="error"
                          variant="outlined"
                          onClick={() =>
                            decideLeaveApproval(
                              row,
                              "reject"
                            )
                          }
                        >
                          رفض
                        </Button>

                        {row.attachmentOriginalName && (
                          <Button sx={uiLayout.buttonSx}
                            fullWidth
                            size="small"
                            variant="text"
                            startIcon={
                              <FolderRoundedIcon fontSize="small" />
                            }
                            onClick={() =>
                              openLeaveApprovalAttachment(row)
                            }
                          >
                            المرفق
                          </Button>
                        )}
                      </Stack>
                    </Box>
                  </Paper>
                ))}
              </Stack>
            )}
          </Section>
        </Box>
      )}

      <HrOrgOverviewPanel userGuid={userGuid} />

      {false && canShowManagement && (
        <Stack spacing={1.4} sx={{ mb: 1.4 }}>
          <Section title={scope?.scopeLabel || "لوحة الإدارة"} subtitle={`${scope?.scopeDescription || "ملخص النطاق الإداري"} — المعروض طبقًا لصلاحيات الموارد البشرية الحالية`}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(3,1fr)", xl: "repeat(6,1fr)" }, gap: 1 }}>
              {hrPermissions?.employees && <MetricCard title="الموظفون" value={management?.totalEmployees ?? 0} subtitle="داخل نطاقك الإداري" icon={<GroupsRoundedIcon />} />}
              {hrPermissions?.attendance && <MetricCard title="حضور اليوم" value={management?.presentToday ?? 0} subtitle={`متأخر ${management?.lateToday ?? 0}`} icon={<CheckCircleRoundedIcon />} tone="info" onClick={() => navigate("/dashboard/hr-attendance")} />}
              {hrPermissions?.attendance && <MetricCard title="غياب اليوم" value={management?.absentToday ?? 0} subtitle={`إجازة ${management?.leaveToday ?? 0}`} icon={<EventBusyRoundedIcon />} tone={Number(management?.absentToday || 0) > 0 ? "danger" : "default"} onClick={() => navigate("/dashboard/hr-attendance")} />}
              {hrPermissions?.attendance && <MetricCard title="لم يسجل انصراف" value={management?.incompleteToday ?? 0} subtitle="يحتاج مراجعة" icon={<HistoryToggleOffRoundedIcon />} tone={Number(management?.incompleteToday || 0) > 0 ? "warning" : "default"} onClick={() => navigate("/dashboard/hr-attendance")} />}
              {myApprovals.length > 0 && <MetricCard title="موافقات عندي" value={myApprovals.length} subtitle="طلبات في مرحلتي الحالية" icon={<FactCheckRoundedIcon />} tone="warning" onClick={() => scrollTo(approvalsRef)} />}
              {hrPermissions?.contracts && <MetricCard title="عقود تنتهي قريبًا" value={management?.contractsExpiring30 ?? 0} subtitle="خلال 30 يوم" icon={<WarningAmberRoundedIcon />} tone={Number(management?.contractsExpiring30 || 0) > 0 ? "warning" : "default"} onClick={() => navigate("/dashboard/hr-contracts")} />}
            </Box>
          </Section>

          {hrPermissions?.attendance && (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr" }, gap: 1.4 }}>
              {hrPermissions?.attendance && (
                <Section title="حالة الفريق اليوم" subtitle="الموظفون داخل نطاقك حسب صلاحية الحضور" action={<Button sx={uiLayout.buttonSx} size="small" endIcon={<ArrowBackRoundedIcon />} onClick={() => navigate("/dashboard/hr-attendance")}>شاشة الحضور</Button>}>
                  <TableContainer sx={uiLayout.withUiSx({ maxHeight: 390 }, uiLayout.tableContainerSx, TABLE_DARK_BORDER_SX)}>
                    <Table size="small" stickyHeader dir={TABLE_DIRECTION} sx={{ "& .MuiTableCell-root": { textAlign: TABLE_TEXT_ALIGN } }}>
                      <TableHead><TableRow><TableCell>الموظف</TableCell><TableCell>المسمى</TableCell><TableCell>الحالة</TableCell><TableCell>الدخول</TableCell><TableCell>الخروج</TableCell></TableRow></TableHead>
                      <TableBody>
                        {(management?.teamToday || []).map((row) => (
                          <TableRow key={row.employeeGuid} hover>
                            <TableCell><Typography sx={{ fontWeight: 900, fontSize: 12 }}>{row.employeeName}</Typography><Typography color="text.secondary" sx={{ fontSize: 12 }}>{row.employeeCode}</Typography></TableCell>
                            <TableCell sx={{ fontSize: 12 }}>{row.jobTitleName || "-"}</TableCell>
                            <TableCell><StatusChip status={row.status || "Pending"} /></TableCell>
                            <TableCell dir={DATE_DIRECTION} sx={{ textAlign: DATE_TEXT_ALIGN, fontSize: 12 }}>{fmtTime(row.checkInAt)}</TableCell>
                            <TableCell dir={DATE_DIRECTION} sx={{ textAlign: DATE_TEXT_ALIGN, fontSize: 12 }}>{fmtTime(row.checkOutAt)}</TableCell>
                          </TableRow>
                        ))}
                        {!management?.teamToday?.length && <TableRow><TableCell colSpan={5} align="center"><Typography color="text.secondary" sx={{ py: 2.5, fontSize: 12 }}>لا توجد بيانات حضور متاحة اليوم.</Typography></TableCell></TableRow>}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Section>
              )}

              {hrPermissions?.leaves && (
                <Section title="موافقات الإجازات" subtitle="الطلبات الموجودة عند خطوتك الحالية">
                  <Stack spacing={0.75}>
                    {(management?.pendingApprovals || []).map((row) => (
                      <Paper key={row.leaveRequestGuid} variant="outlined" sx={(theme) => ({ p: 1, borderRadius: 2, borderColor: theme.palette.mode === "dark" ? "#67C99D" : border })}>
                        <Stack direction="row" justifyContent="space-between" gap={1}>
                          <Box sx={{ minWidth: 0, textAlign: SECTION_TEXT_ALIGN }}>
                            <Typography sx={{ fontSize: 12, fontWeight: 950 }}>{row.employeeName}</Typography>
                            <Typography color="text.secondary" sx={{ fontSize: 12 }}>{row.leaveTypeName} • {row.currentApprovalRole || "موافقة"}</Typography>
                          </Box>
                          <Chip size="small" label={`${row.requestedDays || 0} يوم`} />
                        </Stack>
                      </Paper>
                    ))}
                    {!management?.pendingApprovals?.length && <Alert severity="success" sx={darkAlertSx}>لا توجد طلبات تنتظر موافقتك حاليًا.</Alert>}
                  </Stack>
                </Section>
              )}
            </Box>
          )}
        </Stack>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", xl: "1fr 1fr" },
          gap: 1.4,
          mb: 1.4,
          alignItems: "start"
        }}
      >
        <Section
          title="بياناتي الوظيفية"
          subtitle="أهم بيانات الوظيفة والقسم والفرع ونظام الدوام"
          action={
            <Button
              size="small"
              variant="text"
              startIcon={<VisibilityRoundedIcon />}
              onClick={() => setWorkDetailsOpen(true)}
              sx={uiLayout.withUiSx({
                width: { xs: "100%", sm: "auto" },
                minHeight: { xs: 30, sm: 32 },
                fontSize: { xs: 12, sm: 12 },
                fontWeight: 900
              }, uiLayout.buttonSx)}
            >
              عرض التفاصيل
            </Button>
          }
        >
          <DetailGrid compact>
            <DetailTile
              icon={<BadgeRoundedIcon fontSize="small" />}
              label="كود الموظف"
              value={employee?.employeeCode}
              ltr
            />
            <DetailTile
              icon={<WorkRoundedIcon fontSize="small" />}
              label="المسمى الوظيفي"
              value={employee?.jobTitleName}
            />
            <DetailTile
              icon={<ApartmentRoundedIcon fontSize="small" />}
              label="القسم"
              value={employee?.departmentName}
            />
            <DetailTile
              icon={<BusinessRoundedIcon fontSize="small" />}
              label="الفرع"
              value={employee?.branchName}
            />
          </DetailGrid>
        </Section>

        <Section
          title="البيانات الشخصية والتواصل"
          subtitle="أهم البيانات الشخصية ووسائل التواصل"
          action={
            <Button
              size="small"
              variant="text"
              startIcon={<VisibilityRoundedIcon />}
              onClick={() => setPersonalDetailsOpen(true)}
              sx={uiLayout.withUiSx({
                width: { xs: "100%", sm: "auto" },
                minHeight: { xs: 30, sm: 32 },
                fontSize: { xs: 12, sm: 12 },
                fontWeight: 900
              }, uiLayout.buttonSx)}
            >
              عرض التفاصيل
            </Button>
          }
        >
          <DetailGrid compact>
            <DetailTile
              icon={<FingerprintRoundedIcon fontSize="small" />}
              label="رقم الهوية"
              value={employee?.nationalId}
              ltr
            />
            <DetailTile
              icon={<CalendarMonthRoundedIcon fontSize="small" />}
              label="تاريخ الميلاد"
              value={fmtDate(profile?.birthDate)}
              ltr
            />
            <DetailTile
              icon={<PhoneRoundedIcon fontSize="small" />}
              label="الجوال"
              value={employee?.mobile}
              ltr
            />
            <DetailTile
              icon={<EmailRoundedIcon fontSize="small" />}
              label="البريد الإلكتروني"
              value={employee?.email}
              ltr
            />
          </DetailGrid>
        </Section>
      </Box>

      <Box ref={contractRef} sx={{ scrollMarginTop: 18, mb: 1.4 }}>
        <Section
          title="العقد والبيانات المالية"
          subtitle="العقد الحالي والراتب الأساسي المسجل بالعقد"
          action={contract?.hasContract && contract?.contractGuid && contract?.originalFileName ? (
            <Stack sx={uiLayout.actionBarSx} direction="row" spacing={0.6}>
              <Button sx={uiLayout.buttonSx} size="small" variant="outlined" startIcon={<VisibilityRoundedIcon />} onClick={() => openPreview(contract, "contract")}>معاينة العقد</Button>
              <Button sx={uiLayout.buttonSx} size="small" startIcon={<DownloadRoundedIcon />} onClick={() => downloadOwnFile(contract, "contract")}>تحميل</Button>
            </Stack>
          ) : null}
        >
          {contract?.hasContract ? (
            <>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: ".55fr 1.45fr" }, gap: 1.1 }}>
                <Paper elevation={0} sx={(theme) => ({ p: 1.5, borderRadius: 2.5, color: "#fff", background: "linear-gradient(135deg,#057546,#034d31)", border: theme.palette.mode === "dark" ? "1px solid #67C99D" : "none" })}>
                  <Typography sx={{ fontSize: 12, opacity: 0.82 }}>الراتب الأساسي حسب العقد</Typography>
                  <Typography sx={{ fontSize: 28, fontWeight: 950, mt: 0.4 }}>{money(contract?.basicSalary)}</Typography>
                  <Divider sx={{ my: 1.2, borderColor: "rgba(255,255,255,.16)" }} />
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography sx={{ fontSize: 12, opacity: 0.85 }}>حالة العقد</Typography>
                    <StatusChip status={contract?.contractStatus} />
                  </Stack>
                </Paper>

                <DetailGrid>
                  <DetailTile icon={<DescriptionRoundedIcon fontSize="small" />} label="رقم العقد" value={contract?.contractNumber} ltr />
                  <DetailTile icon={<WorkRoundedIcon fontSize="small" />} label="نوع العقد" value={contractTypeText(contract?.contractType)} />
                  <DetailTile icon={<CalendarMonthRoundedIcon fontSize="small" />} label="بداية العقد" value={fmtDate(contract?.startDate)} ltr />
                  <DetailTile icon={<CalendarMonthRoundedIcon fontSize="small" />} label="نهاية العقد" value={fmtDate(contract?.endDate)} ltr />
                  <DetailTile icon={<GavelRoundedIcon fontSize="small" />} label="فترة التجربة بالعقد" value={contract?.probationDays != null ? `${contract.probationDays} يوم` : "غير محدد"} />
                  <DetailTile icon={<AutorenewRoundedIcon fontSize="small" />} label="التجديد التلقائي" value={contract?.autoRenew ? "نعم" : "لا"} />
                  <DetailTile icon={<InsertDriveFileRoundedIcon fontSize="small" />} label="ملف العقد" value={contract?.originalFileName} ltr />
                  <DetailTile icon={<FolderRoundedIcon fontSize="small" />} label="حجم الملف" value={fileSizeText(contract?.fileSize)} ltr />
                  <DetailTile icon={<CalendarMonthRoundedIcon fontSize="small" />} label="تاريخ رفع العقد" value={fmtDateTime(contract?.uploadedAt)} ltr />
                  <DetailTile icon={<DescriptionRoundedIcon fontSize="small" />} label="ملاحظات العقد" value={contract?.notes} wide />
                  {contract?.isTerminated && <DetailTile icon={<ExitToAppRoundedIcon fontSize="small" />} label="سبب إنهاء العقد" value={contract?.terminationReason || "غير محدد"} wide />}
                </DetailGrid>
              </Box>

              {(contract?.history || []).length > 1 && (
                <Box sx={{ mt: 1.4 }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 950, mb: 0.7 }}>سجل العقود السابقة</Typography>
                  <TableContainer sx={uiLayout.withUiSx((theme) => ({ border: theme.palette.mode === "dark" ? `1px solid #67C99D` : `1px solid ${border}`, borderRadius: 2 }), uiLayout.tableContainerSx, TABLE_DARK_BORDER_SX)}>
                    <Table size="small" dir={TABLE_DIRECTION} sx={{ "& .MuiTableCell-root": { textAlign: TABLE_TEXT_ALIGN } }}>
                      <TableHead><TableRow><TableCell>رقم العقد</TableCell><TableCell>النوع</TableCell><TableCell>البداية</TableCell><TableCell>النهاية</TableCell><TableCell>الراتب الأساسي</TableCell><TableCell>الحالة</TableCell></TableRow></TableHead>
                      <TableBody>
                        {contract.history.map((row) => (
                          <TableRow key={row.contractGuid}>
                            <TableCell sx={{ fontSize: 12 }}>{row.contractNumber || "-"}</TableCell>
                            <TableCell sx={{ fontSize: 12 }}>{contractTypeText(row.contractType)}</TableCell>
                            <TableCell dir={DATE_DIRECTION} sx={{ textAlign: DATE_TEXT_ALIGN, fontSize: 12 }}>{fmtDate(row.startDate)}</TableCell>
                            <TableCell dir={DATE_DIRECTION} sx={{ textAlign: DATE_TEXT_ALIGN, fontSize: 12 }}>{fmtDate(row.endDate)}</TableCell>
                            <TableCell sx={{ fontSize: 12 }}>{money(row.basicSalary)}</TableCell>
                            <TableCell><Chip size="small" label={row.isCurrent ? "الحالي" : row.isTerminated ? "منتهي" : "سابق"} color={row.isCurrent ? "success" : "default"} /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </>
          ) : (
            <Alert severity="warning" sx={darkAlertSx}>لا يوجد عقد حالي محفوظ على ملفك الوظيفي.</Alert>
          )}
        </Section>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1.25fr .75fr" }, gap: 1.4, mb: 1.4 }}>
        <Section
          sectionRef={attendanceRef}
          title="حضوري هذا الشهر"
          subtitle={`إجمالي العمل: ${minutesText(attendance?.workedMinutes)} • إجمالي التأخير: ${minutesText(attendance?.lateMinutes)}`}
          action={hrPermissions?.attendance ? <Button sx={uiLayout.buttonSx} size="small" onClick={() => navigate("/dashboard/hr-attendance")}>شاشة الحضور الإدارية</Button> : null}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2,minmax(0,1fr))",
                sm: "repeat(5,minmax(0,1fr))"
              },
              gap: 0.55,
              mb: 1,
              "& .MuiChip-root": {
                height: { xs: 28, sm: 32 },
                fontSize: { xs: 12, sm: 12 }
              }
            }}
          >
            <Chip label={`حاضر ${attendance?.presentDays || 0}`} color="success" variant="outlined" />
            <Chip label={`متأخر ${attendance?.lateDays || 0}`} color="warning" variant="outlined" />
            <Chip label={`غائب ${attendance?.absentDays || 0}`} color="error" variant="outlined" />
            <Chip label={`إجازة ${attendance?.leaveDays || 0}`} color="info" variant="outlined" />
            <Chip label={`غير مكتمل ${attendance?.incompleteDays || 0}`} variant="outlined" />
          </Box>

          <TableContainer sx={uiLayout.withUiSx({ maxHeight: 390 }, uiLayout.tableContainerSx, TABLE_DARK_BORDER_SX)}>
            <Table size="small" stickyHeader dir={TABLE_DIRECTION} sx={{ "& .MuiTableCell-root": { textAlign: TABLE_TEXT_ALIGN } }}>
              <TableHead><TableRow><TableCell>التاريخ</TableCell><TableCell>الحالة</TableCell><TableCell>الدخول</TableCell><TableCell>الخروج</TableCell><TableCell>التأخير</TableCell><TableCell>الخروج المبكر</TableCell><TableCell>الإضافي</TableCell></TableRow></TableHead>
              <TableBody>
                {(attendance?.recent || []).map((row, index) => (
                  <TableRow key={`${row.attendanceDate}-${index}`}>
                    <TableCell dir={DATE_DIRECTION} sx={{ textAlign: DATE_TEXT_ALIGN, fontSize: 12 }}>{fmtDate(row.attendanceDate)}</TableCell>
                    <TableCell><StatusChip status={row.status} /></TableCell>
                    <TableCell dir={DATE_DIRECTION} sx={{ textAlign: DATE_TEXT_ALIGN, fontSize: 12 }}>{fmtTime(row.checkInAt)}</TableCell>
                    <TableCell dir={DATE_DIRECTION} sx={{ textAlign: DATE_TEXT_ALIGN, fontSize: 12 }}>{fmtTime(row.checkOutAt)}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{Number(row.lateMinutes || 0) ? `${row.lateMinutes} د` : "-"}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{Number(row.earlyLeaveMinutes || 0) ? `${row.earlyLeaveMinutes} د` : "-"}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{Number(row.overtimeMinutes || 0) ? `${row.overtimeMinutes} د` : "-"}</TableCell>
                  </TableRow>
                ))}
                {!attendance?.recent?.length && <TableRow><TableCell colSpan={7} align="center"><Typography color="text.secondary" sx={{ py: 3, fontSize: 12 }}>لا توجد سجلات حضور متاحة لهذا الشهر.</Typography></TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        </Section>

        <Section title="أرصدة الإجازات" subtitle={`السنة ${leave?.year || new Date().getFullYear()}`} action={<Button sx={[uiLayout.buttonSx, permissionButtonSx]} size="small" variant="outlined" startIcon={<AddRoundedIcon />} onClick={openLeaveDialog}>طلب إجازة</Button>}>
          <Stack spacing={0.75}>
            {(leave?.balances || []).map((row) => (
              <Box
                key={row.leaveTypeGuid}
                sx={(theme) => {
                  const isDark = theme.palette.mode === "dark";
                  return {
                    p: 1,
                    borderRadius: 2,
                    border: isDark
                      ? `1px solid #67C99D`
                      : `1px solid ${border}`,
                    background: isDark ? theme.palette.surfaces.nested : soft
                  };
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                  <Box sx={{ textAlign: SECTION_TEXT_ALIGN }}>
                    <Typography sx={{ fontSize: 12, fontWeight: 950 }}>{row.leaveTypeName}</Typography>
                    <Typography color="text.secondary" sx={{ fontSize: 12 }}>مستخدم {row.usedDays || 0} يوم</Typography>
                  </Box>
                  <Typography sx={{ color: primary, fontWeight: 950, fontSize: 15 }}>{Number(row.availableDays || 0).toLocaleString("ar-SA", { maximumFractionDigits: 2 })} يوم</Typography>
                </Stack>
              </Box>
            ))}
            {!leave?.balances?.length && <Alert severity="info" sx={darkAlertSx}>لا توجد أرصدة إجازات معرفة للسنة الحالية.</Alert>}
          </Stack>
        </Section>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: ".9fr 1.1fr" }, gap: 1.4, mb: 1.4 }}>
        <Section title="آخر طلبات الإجازة" subtitle="المسار والحالة الحالية لكل طلب">
          <Stack spacing={0.7}>
            {(leave?.requests || []).map((row) => (
              <Box
                key={row.leaveRequestGuid}
                sx={(theme) => {
                  const isDark = theme.palette.mode === "dark";
                  return {
                    p: 1,
                    border: isDark
                      ? `1px solid #67C99D`
                      : `1px solid ${border}`,
                    borderRadius: 2,
                    background: isDark ? theme.palette.surfaces.nested : "transparent"
                  };
                }}
              >
                <Stack direction="row" justifyContent="space-between" gap={1} alignItems="flex-start">
                  <Box sx={{ minWidth: 0, textAlign: SECTION_TEXT_ALIGN }}>
                    <Typography sx={{ fontSize: 12, fontWeight: 950 }}>#{row.requestNumber || "-"} • {row.leaveTypeName}</Typography>
                    <Typography color="text.secondary" sx={{ fontSize: 12, mt: 0.2 }}><span dir={DATE_DIRECTION}>{fmtDate(row.fromDate)}</span> - <span dir={DATE_DIRECTION}>{fmtDate(row.toDate)}</span> • {row.requestedDays || 0} يوم</Typography>
                    {row.currentApprovalRole && <Typography sx={{ fontSize: 12, color: "#2b6cb0", mt: 0.35 }}>الخطوة الحالية: {row.currentApprovalRole}</Typography>}
                    {row.reason && <Typography color="text.secondary" sx={{ fontSize: 12, mt: 0.35 }}>السبب: {row.reason}</Typography>}
                    <Button
                      size="small"
                      variant="text"
                      startIcon={<HistoryToggleOffRoundedIcon fontSize="small" />}
                      onClick={() => openLeaveTracking(row)}
                      sx={uiLayout.withUiSx({
                        mt: 0.35,
                        p: 0,
                        minWidth: 0,
                        fontSize: 12,
                        fontWeight: 900
                      }, uiLayout.buttonSx)}
                    >
                      متابعة الطلب
                    </Button>
                  </Box>
                  <StatusChip status={row.status} />
                </Stack>
              </Box>
            ))}
            {!leave?.requests?.length && <Alert severity="info" sx={darkAlertSx}>لا توجد طلبات إجازة مسجلة حتى الآن.</Alert>}
          </Stack>
        </Section>

        <Section
          title="أذوناتي"
          subtitle="طلبات التأخير والانصراف والخروج أثناء الدوام"
          action={
            <Button
  sx={[uiLayout.buttonSx, permissionButtonSx]}
  size="small"
  variant="outlined"
  startIcon={<ManageAccountsRoundedIcon />}
  onClick={openPermissionDialog}
>
  طلب إذن
</Button>
          }
        >
          {myPermissionsLoading ? (
            <Stack spacing={0.7}>
              <Skeleton variant="rounded" height={68} />
              <Skeleton variant="rounded" height={68} />
            </Stack>
          ) : (
            <Stack spacing={0.7}>
              {myPermissions.map((row) => (
                <Box
                  key={row.permissionGuid}
                  sx={(theme) => {
                    const isDark = theme.palette.mode === "dark";
                    return {
                      p: 1,
                      border: isDark
                        ? `1px solid #67C99D`
                        : `1px solid ${border}`,
                      borderRadius: 2,
                      background: isDark ? theme.palette.surfaces.nested : "transparent"
                    };
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    gap={1}
                    alignItems="flex-start"
                  >
                    <Box sx={{ minWidth: 0, textAlign: SECTION_TEXT_ALIGN }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 950 }}>
                        #{row.permissionNumber || "-"} • {row.permissionTypeName || permissionTypeText(row.permissionType)}
                      </Typography>

                      <Typography color="text.secondary" sx={{ fontSize: 12, mt: 0.2 }}>
                        <span dir={DATE_DIRECTION}>{fmtDate(row.permissionDate)}</span>
                        {Number(row.permissionType) === 1 && row.toTime
                          ? ` • السماح بالحضور حتى ${fmtClockValue(row.toTime)}`
                          : ""}
                        {Number(row.permissionType) === 2 && row.fromTime
                          ? ` • الانصراف من ${fmtClockValue(row.fromTime)}`
                          : ""}
                        {Number(row.permissionType) === 3
                          ? ` • ${fmtClockValue(row.fromTime)} - ${fmtClockValue(row.toTime)}`
                          : ""}
                      </Typography>

                      {row.reason && (
                        <Typography color="text.secondary" sx={{ fontSize: 12, mt: 0.35 }}>
                          السبب: {row.reason}
                        </Typography>
                      )}

                      {String(row.status || "").toLowerCase() === "pending" && (
                        <Button
                          size="small"
                          color="error"
                          variant="text"
                          onClick={() => cancelMyPermission(row)}
                          sx={uiLayout.withUiSx({
                            mt: 0.25,
                            p: 0,
                            minWidth: 0,
                            fontSize: 12,
                            fontWeight: 900
                          }, uiLayout.buttonSx)}
                        >
                          إلغاء الطلب
                        </Button>
                      )}
                    </Box>

                    <StatusChip status={row.status} />
                  </Stack>
                </Box>
              ))}

              {!myPermissions.length && (
                <Alert severity="info" sx={darkAlertSx}>
                  لا توجد طلبات أذونات مسجلة حتى الآن.
                </Alert>
              )}
            </Stack>
          )}
        </Section>

        <Section sectionRef={documentsRef} title="مرفقاتي" subtitle={`إجمالي المرفقات: ${documents?.count || 0} — يمكنك المعاينة أو التحميل`}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 0.75 }}>
            {(documents?.recent || []).map((row) => (
              <Paper
                key={row.documentGuid}
                variant="outlined"
                sx={(theme) => ({
                  p: 1,
                  borderRadius: 2.2,
                  borderColor: theme.palette.mode === "dark" ? "#67C99D" : border
                })}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box sx={{ width: 38, height: 38, display: "grid", placeItems: "center", borderRadius: 1.5, color: primary, background: "rgba(5,117,70,.08)", flexShrink: 0 }}>
                    <InsertDriveFileRoundedIcon fontSize="small" />
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1, textAlign: SECTION_TEXT_ALIGN }}>
                    <Typography sx={{ fontSize: 12, fontWeight: 950, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.documentTypeName || row.originalFileName || "مرفق"}</Typography>
                    <Typography color="text.secondary" sx={{ fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.originalFileName}</Typography>
                    <Typography color="text.secondary" sx={{ fontSize: 12 }}>{fileSizeText(row.fileSize)} • {fmtDate(row.uploadedAt)}</Typography>
                    {(row.issueDate || row.expiryDate) && <Typography color="text.secondary" sx={{ fontSize: 12 }}>إصدار: {fmtDate(row.issueDate)} • انتهاء: {fmtDate(row.expiryDate)}</Typography>}
                  </Box>
                  <Stack direction="row" spacing={0.2}>
                    <Tooltip title="معاينة"><IconButton size="small" onClick={() => openPreview(row, "document")}><VisibilityRoundedIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="تحميل"><IconButton size="small" onClick={() => downloadOwnFile(row, "document")}><DownloadRoundedIcon fontSize="small" /></IconButton></Tooltip>
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Box>
          {!documents?.recent?.length && <Alert severity="info" sx={darkAlertSx}>لا توجد مرفقات على الملف الوظيفي.</Alert>}
        </Section>
      </Box>

      {quickLinks.length > 0 && (
        <Section title="إدارة الموارد البشرية" subtitle="تظهر فقط الشاشات التي يملك المستخدم صلاحية عرضها">
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4,1fr)" }, gap: 0.8 }}>
            {quickLinks.map((item) => (
              <Button key={item.path} variant="outlined" startIcon={item.icon} onClick={() => navigate(item.path)} sx={uiLayout.withUiSx((theme) => {
                const isDark = theme.palette.mode === "dark";
                return {
                  justifyContent: "flex-start",
                  minHeight: 46,
                  borderColor: isDark ? "#67C99D" : border,
                  color: isDark ? theme.palette.text.primary : "#17372b",
                  fontWeight: 900,
                  fontSize: 12,
                  "&:hover": {
                    borderColor: isDark ? "#67C99D" : primary,
                    background: isDark ? theme.palette.surfaces.hover : "rgba(5,117,70,.04)"
                  }
                };
              }, uiLayout.buttonSx)}>
                {item.label}
              </Button>
            ))}
          </Box>
        </Section>
      )}

      <ProfileDetailsDialog
        open={workDetailsOpen}
        onClose={() => setWorkDetailsOpen(false)}
        title="تفاصيل البيانات الوظيفية"
        subtitle="بيانات إضافية"
      >
        <DetailGrid>
          <DetailTile
            icon={<PersonRoundedIcon fontSize="small" />}
            label="اسم المستخدم"
            value={employee?.userName}
            ltr
          />
          <DetailTile
            icon={<ManageAccountsRoundedIcon fontSize="small" />}
            label="المدير المباشر"
            value={
              resolvedManagers.length > 0
                ? resolvedManagers
                    .map((manager) => manager.managerName)
                    .filter(Boolean)
                    .join(" / ")
                : profile?.directManagerName || "غير محدد"
            }
            helper={
              resolvedManagers.length > 1
                ? `${resolvedManagers.length} مديرين حسب الهيكل الإداري`
                : resolvedManagerSource
                  ? `حسب الهيكل: ${resolvedManagerSource}`
                  : undefined
            }
          />
          <DetailTile
            icon={<ScheduleRoundedIcon fontSize="small" />}
            label="نوع الدوام"
            value={profile?.workTypeName || "غير محدد"}
          />
          <DetailTile
            icon={<AccessTimeRoundedIcon fontSize="small" />}
            label="ساعات الدوام اليومية"
            value={
              profile?.dailyWorkingHours != null
                ? `${profile.dailyWorkingHours} ساعة`
                : "غير محدد"
            }
          />
          <DetailTile
            icon={<TodayRoundedIcon fontSize="small" />}
            label="أيام العمل الأسبوعية"
            value={
              profile?.weeklyWorkDays != null
                ? `${profile.weeklyWorkDays} أيام`
                : "غير محدد"
            }
          />
          <DetailTile
            icon={<CalendarMonthRoundedIcon fontSize="small" />}
            label="تاريخ المباشرة"
            value={fmtDate(profile?.hireDate || employee?.hireDate)}
            ltr
          />
          <DetailTile
            icon={<GavelRoundedIcon fontSize="small" />}
            label="فترة التجربة"
            value={
              profile?.probationDays != null
                ? `${profile.probationDays} يوم`
                : "غير محدد"
            }
          />
          <DetailTile
            icon={<CheckCircleRoundedIcon fontSize="small" />}
            label="حالة الموظف"
            value={employee?.isActive ? "نشط" : "غير نشط"}
          />
        </DetailGrid>
      </ProfileDetailsDialog>

      <ProfileDetailsDialog
        open={personalDetailsOpen}
        onClose={() => setPersonalDetailsOpen(false)}
        title="تفاصيل البيانات الشخصية"
        subtitle="بيانات إضافية"
      >
        <DetailGrid>
          <DetailTile
            icon={<PersonRoundedIcon fontSize="small" />}
            label="الجنس"
            value={genderText(profile?.gender)}
          />
          <DetailTile
            icon={<PersonRoundedIcon fontSize="small" />}
            label="الجنسية"
            value={profile?.nationality}
          />
          <DetailTile
            icon={<PersonRoundedIcon fontSize="small" />}
            label="الحالة الاجتماعية"
            value={maritalText(profile?.maritalStatus)}
          />
          <DetailTile
            icon={<PhoneRoundedIcon fontSize="small" />}
            label="جوال إضافي"
            value={employee?.mobile2}
            ltr
          />
          <DetailTile
            icon={<AccountBalanceRoundedIcon fontSize="small" />}
            label="IBAN"
            value={employee?.iban}
            ltr
          />
          <DetailTile
            icon={<SchoolRoundedIcon fontSize="small" />}
            label="المؤهل"
            value={educationLevelText(
              profile?.educationLevel,
              profile?.educationLevelName
            )}
          />
          <DetailTile
            icon={<SchoolRoundedIcon fontSize="small" />}
            label="التخصص"
            value={profile?.specialization || "غير محدد"}
          />
          <DetailTile
            icon={<HomeWorkRoundedIcon fontSize="small" />}
            label="المدينة"
            value={profile?.city}
          />
          <DetailTile
            icon={<HomeWorkRoundedIcon fontSize="small" />}
            label="العنوان"
            value={profile?.address}
            expandable
          />
          <DetailTile
            icon={<PhoneRoundedIcon fontSize="small" />}
            label="جوال الطوارئ"
            value={profile?.emergencyContactPhone}
            ltr
          />
        </DetailGrid>
      </ProfileDetailsDialog>

      <Dialog
        sx={uiLayout.withUiSx(RTL_DIALOG_SX, uiLayout.dialogLayoutSx)}
        dir={LEAVE_TRACKING_DIALOG_DIRECTION}
        open={leaveTrackingOpen}
        onClose={() =>
          !leaveTrackingLoading &&
          setLeaveTrackingOpen(false)
        }
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            width: {
              xs: "calc(100% - 16px)",
              sm: "min(640px, calc(100% - 32px))"
            },
            maxWidth: "640px !important",
            m: { xs: 1, sm: 2 },
            maxHeight: { xs: "86dvh", sm: "82vh" },
            borderRadius: { xs: 2.5, sm: 3.2 },
            direction:
              LEAVE_TRACKING_DIALOG_DIRECTION,
            textAlign:
              LEAVE_TRACKING_DIALOG_TEXT_ALIGN,
            overflow: "hidden"
          }
        }}
      >
        <DialogTitle
          sx={(theme) => ({
            px: { xs: 1.2, sm: 2 },
            py: { xs: 1, sm: 1.4 },
            borderBottom: theme.palette.mode === "dark"
              ? `1px solid #67C99D`
              : `1px solid ${border}`,
            textAlign:
              LEAVE_TRACKING_DIALOG_TEXT_ALIGN
          })}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            gap={1}
          >
            <Box sx={{minWidth:0}}>
              <Typography
                sx={{
                  fontSize:{xs:14,sm:16},
                  fontWeight:950
                }}
              >
                متابعة طلب الإجازة
              </Typography>

              {leaveTrackingData?.request && (
                <Typography
                  color="text.secondary"
                  sx={{
                    mt:.15,
                    fontSize:{xs:12,sm:12}
                  }}
                >
                  #{leaveTrackingData.request.requestNumber}
                  {" • "}
                  {leaveTrackingData.request.leaveTypeName}
                </Typography>
              )}
            </Box>

            <IconButton
              size="small"
              onClick={() =>
                setLeaveTrackingOpen(false)
              }
              disabled={leaveTrackingLoading}
            >
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent
          sx={{
            p:{
              xs:"9px !important",
              sm:"16px !important"
            },
            overflowY:"auto",
            direction:
              LEAVE_TRACKING_DIALOG_DIRECTION,
            textAlign:
              LEAVE_TRACKING_DIALOG_TEXT_ALIGN
          }}
        >
          {leaveTrackingLoading ? (
            <Stack spacing={.7}>
              <Skeleton variant="rounded" height={90} />
              <Skeleton variant="rounded" height={92} />
              <Skeleton variant="rounded" height={92} />
            </Stack>
          ) : leaveTrackingData?.request ? (
            <Stack spacing={1}>
              <Paper
                elevation={0}
                sx={(theme) => {
                  const isDark = theme.palette.mode === "dark";
                  return {
                    p: { xs: .9, sm: 1.1 },
                    borderRadius: 2.2,
                    border: isDark
                      ? `1px solid #67C99D`
                      : `1px solid ${border}`,
                    background: isDark ? theme.palette.surfaces.nested : soft
                  };
                }}
              >
                <Box
                  sx={{
                    display:"grid",
                    gridTemplateColumns:{
                      xs:"1fr 1fr",
                      sm:"repeat(4,minmax(0,1fr))"
                    },
                    gap:.7
                  }}
                >
                  <Box>
                    <Typography color="text.secondary" sx={{fontSize:12}}>
                      الحالة
                    </Typography>
                    <StatusChip
                      status={leaveTrackingData.request.status}
                    />
                  </Box>

                  <Box>
                    <Typography color="text.secondary" sx={{fontSize:12}}>
                      المرحلة الحالية
                    </Typography>
                    <Typography sx={{fontSize:12,fontWeight:950,mt:.25}}>
                      {leaveTrackingData.request.currentApprovalRole || "-"}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography color="text.secondary" sx={{fontSize:12}}>
                      المسؤول الحالي
                    </Typography>
                    <Typography sx={{fontSize:12,fontWeight:950,mt:.25}}>
                      {leaveTrackingData.request.currentApproverName || "-"}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography color="text.secondary" sx={{fontSize:12}}>
                      الأيام
                    </Typography>
                    <Typography sx={{fontSize:12,fontWeight:950,mt:.25}}>
                      {leaveTrackingData.request.requestedDays || 0} يوم
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              <Typography
                sx={{
                  fontSize:{xs:12,sm:12.5},
                  fontWeight:950
                }}
              >
                خطوات الموافقة
              </Typography>

              <Stack spacing={.65}>
                {(leaveTrackingData.stages || []).map((stage) => {
                  const [label,color] =
                    leaveTrackingStageInfo(stage.status);

                  const isCurrent =
                    leaveTrackingData.request.status === "PendingApproval" &&
                    Number(leaveTrackingData.request.currentApprovalStep) ===
                      Number(stage.stepNo);

                  return (
                    <Paper
                      key={stage.requestStageGuid}
                      elevation={0}
                      sx={(theme) => {
                        const isDark = theme.palette.mode === "dark";
                        return {
                          p: { xs: .8, sm: 1 },
                          borderRadius: 2,
                          border: `1px solid ${
                            isCurrent
                              ? pinColor("rgba(237,137,54,.55)")
                              : (isDark ? "#67C99D" : border)
                          }`,
                          background: isCurrent
                            ? (isDark ? "rgba(237,137,54,.12)" : "rgba(255,247,237,.72)")
                            : (isDark ? theme.palette.surfaces.nested : "#fff")
                        };
                      }}
                    >
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="flex-start"
                        gap={.7}
                      >
                        <Box sx={{minWidth:0}}>
                          <Stack
                            direction="row"
                            spacing={.4}
                            flexWrap="wrap"
                            useFlexGap
                          >
                            <Chip
                              size="small"
                              variant="outlined"
                              label={`خطوة ${stage.stepNo}`}
                              sx={{height:22,fontSize:12}}
                            />
                            <Chip
                              size="small"
                              color={color}
                              label={label}
                              sx={{height:22,fontSize:12,fontWeight:900}}
                            />
                            {isCurrent && (
                              <Chip
                                size="small"
                                color="warning"
                                label="الحالية"
                                sx={{height:22,fontSize:12,fontWeight:950}}
                              />
                            )}
                          </Stack>

                          <Typography
                            sx={{
                              mt:.45,
                              fontSize:{xs:12,sm:12},
                              fontWeight:950
                            }}
                          >
                            {stage.stepName}
                          </Typography>

                          <Typography
                            color="text.secondary"
                            sx={{
                              mt:.25,
                              fontSize:{xs:12,sm:12},
                              lineHeight:1.5
                            }}
                          >
                            المسؤولون:{" "}
                            {(stage.approvers || [])
                              .map((x) => x.approverName || x.approverCode)
                              .filter(Boolean)
                              .join(" / ") || "-"}
                          </Typography>
                        </Box>

                        {stage.actionByName && (
                          <Box
                            sx={{
                              maxWidth:"42%",
                              textAlign:
                                LEAVE_TRACKING_DIALOG_TEXT_ALIGN
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize:{xs:12,sm:12},
                                fontWeight:900
                              }}
                            >
                              وافق/نفذ: {stage.actionByName}
                            </Typography>

                            <Typography
                              color="text.secondary"
                              sx={{
                                mt:.15,
                                fontSize:12,
                                direction:DATE_DIRECTION
                              }}
                            >
                              {fmtDateTime(stage.actionAt)}
                            </Typography>

                            {stage.actionNotes && (
                              <Typography
                                sx={{
                                  mt:.25,
                                  fontSize:12,
                                  lineHeight:1.45
                                }}
                              >
                                {stage.actionNotes}
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>

              <Typography
                sx={{
                  pt:.3,
                  fontSize:{xs:12,sm:12.5},
                  fontWeight:950
                }}
              >
                السجل الكامل
              </Typography>

              <Stack spacing={.55}>
                {(leaveTrackingData.history || []).map((item) => (
                  <Paper
                    key={item.approvalHistoryGuid}
                    elevation={0}
                    sx={(theme) => {
                      const isDark = theme.palette.mode === "dark";
                      return {
                        p: .75,
                        borderRadius: 1.8,
                        border: isDark
                          ? `1px solid #67C99D`
                          : `1px solid ${border}`,
                        background: isDark ? theme.palette.surfaces.nested : "#fbfdfc"
                      };
                    }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      gap={.7}
                    >
                      <Box>
                        <Typography sx={{fontSize:12,fontWeight:950}}>
                          {leaveHistoryActionText(item.actionName)}
                        </Typography>
                        <Typography color="text.secondary" sx={{fontSize:12}}>
                          {item.actionByName || "النظام"}
                        </Typography>
                      </Box>

                      <Typography
                        color="text.secondary"
                        sx={{
                          fontSize:12,
                          direction:DATE_DIRECTION
                        }}
                      >
                        {fmtDateTime(item.actionAt)}
                      </Typography>
                    </Stack>

                    {item.notes && (
                      <Typography
                        sx={{
                          mt:.3,
                          fontSize:12,
                          lineHeight:1.55
                        }}
                      >
                        {item.notes}
                      </Typography>
                    )}
                  </Paper>
                ))}
              </Stack>
            </Stack>
          ) : (
            <Alert severity="info" sx={darkAlertSx}>
              لا توجد بيانات متابعة لهذا الطلب.
            </Alert>
          )}
        </DialogContent>

        <DialogActions
          sx={uiLayout.withUiSx({
            px:1.2,
            py:.9,
            borderTop:`1px solid ${border}`,
            justifyContent:"flex-start"
          }, uiLayout.dialogActionsSx)}
        >
          <Button sx={[uiLayout.buttonSx, permissionButtonSx]}
            variant="outlined"
            onClick={() =>
              setLeaveTrackingOpen(false)
            }
          >
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>

      <FilePreviewDialog preview={preview} onClose={closePreview} onDownload={downloadCurrentPreview} />

      <Dialog
        sx={uiLayout.withUiSx(RTL_DIALOG_SX, uiLayout.dialogLayoutSx)}
        dir={LEAVE_DIALOG_DIRECTION}
        open={permissionDialogOpen}
        onClose={() =>
          !permissionSubmitting &&
          setPermissionDialogOpen(false)
        }
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            width: {
              xs: "calc(100% - 12px)",
              sm: "min(560px, calc(100% - 32px))"
            },
            maxWidth: "560px !important",
            m: { xs: 0.75, sm: 2 },
            maxHeight: { xs: "88dvh", sm: "82vh" },
            borderRadius: { xs: 2.5, sm: 3.2 },
            direction: LEAVE_DIALOG_DIRECTION,
            textAlign: LEAVE_DIALOG_TEXT_ALIGN,
            overflow: "hidden"
          }
        }}
      >
        <DialogTitle
          sx={(theme) => {
            const isDark = theme.palette.mode === "dark";
            return {
              px: { xs: 1.1, sm: 1.5 },
              py: { xs: 0.85, sm: 1 },
              borderBottom: isDark
                ? `1px solid #67C99D`
                : `1px solid ${border}`,
              background: isDark
                ? `linear-gradient(180deg, ${theme.palette.surfaces.section}, ${theme.palette.surfaces.card})`
                : "linear-gradient(180deg,#ffffff 0%,#fbfdfc 100%)"
            };
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
            gap={1}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={(theme) => ({
                  fontSize: { xs: 14.5, sm: 17 },
                  fontWeight: 950,
                  color: theme.palette.mode === "dark" ? theme.palette.text.primary : "#17372b"
                })}
              >
                طلب إذن جديد
              </Typography>
              <Typography
                color="text.secondary"
                sx={{ fontSize: 11.5, mt: 0.2, lineHeight: 1.5 }}
              >
                الطلب يمر بمسار الموافقات، ويشترط وجود وردية فعالة تغطي التاريخ والوقت.
              </Typography>
            </Box>

            <IconButton
              size="small"
              onClick={() => setPermissionDialogOpen(false)}
              disabled={permissionSubmitting}
              sx={(theme) => {
                const isDark = theme.palette.mode === "dark";
                return {
                  flexShrink: 0,
                  width: 34,
                  height: 34,
                  border: isDark
                    ? `1px solid #67C99D`
                    : `1px solid ${border}`,
                  background: isDark ? theme.palette.surfaces.nested : soft
                };
              }}
            >
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent
          dividers
          sx={(theme) => ({
            px: { xs: 1.25, sm: 2.3 },
            py: { xs: "12px !important", sm: "18px !important" },
            background: theme.palette.mode === "dark" ? theme.palette.surfaces.page : "#fbfdfc",
            overflowX: "hidden"
          })}
        >
          <Stack spacing={1.2}>
            <Alert severity="info" sx={uiLayout.withUiSx(darkAlertSx, { borderRadius: 2, py: 0.35 })}>
              لن يتم إرسال الإذن إذا لم تكن هناك وردية فعالة أو إذا كان التاريخ ليس يوم عمل في ورديتك.
            </Alert>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 1.1,
                "& > *": { minWidth: 0 }
              }}
            >
              <Box>
                <Typography sx={{ mb: 0.5, fontSize: 11.5, fontWeight: 900, color: "#52635c" }}>
                  تاريخ الإذن
                </Typography>
                <TextField
                  sx={uiLayout.formFieldSx}
                  size="small"
                  fullWidth
                  type="date"
                  value={permissionForm.permissionDate}
                  onChange={(event) =>
                    setPermissionForm((current) => ({
                      ...current,
                      permissionDate: event.target.value
                    }))
                  }
                  inputProps={{
                    dir: "ltr",
                    style: {
                      textAlign: DATE_TEXT_ALIGN,
                      direction: "ltr",
                      unicodeBidi: "isolate"
                    }
                  }}
                />
              </Box>

              <Box>
                <Typography sx={{ mb: 0.5, fontSize: 11.5, fontWeight: 900, color: "#52635c" }}>
                  نوع الإذن
                </Typography>
                <FormControl sx={uiLayout.formFieldSx} size="small" fullWidth>
                  <Select
                    MenuProps={RTL_MENU_PROPS}
                    value={permissionForm.permissionType}
                    onChange={(event) =>
                      setPermissionForm((current) => ({
                        ...current,
                        permissionType: Number(event.target.value),
                        fromTime: "",
                        toTime: ""
                      }))
                    }
                  >
                    <MenuItem value={1}>تأخير حضور</MenuItem>
                    <MenuItem value={2}>انصراف مبكر</MenuItem>
                    <MenuItem value={3}>خروج أثناء الدوام</MenuItem>
                    <MenuItem value={4}>إذن يوم كامل</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {permissionForm.permissionType !== 4 && (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns:
                    permissionForm.permissionType === 3
                      ? { xs: "1fr", sm: "1fr 1fr" }
                      : "1fr",
                  gap: 1.1,
                  "& > *": { minWidth: 0 }
                }}
              >
                {(permissionForm.permissionType === 2 ||
                  permissionForm.permissionType === 3) && (
                  <Box>
                    <Typography sx={{ mb: 0.5, fontSize: 11.5, fontWeight: 900, color: "#52635c" }}>
                      {permissionForm.permissionType === 2
                        ? "وقت بداية الانصراف المسموح"
                        : "وقت الخروج"}
                    </Typography>
                    <TextField
                      sx={uiLayout.formFieldSx}
                      size="small"
                      fullWidth
                      type="time"
                      value={permissionForm.fromTime}
                      onChange={(event) =>
                        setPermissionForm((current) => ({
                          ...current,
                          fromTime: event.target.value
                        }))
                      }
                      inputProps={{
                        dir: "ltr",
                        style: {
                          textAlign: DATE_TEXT_ALIGN,
                          direction: "ltr",
                          unicodeBidi: "isolate"
                        }
                      }}
                    />
                  </Box>
                )}

                {(permissionForm.permissionType === 1 ||
                  permissionForm.permissionType === 3) && (
                  <Box>
                    <Typography sx={{ mb: 0.5, fontSize: 11.5, fontWeight: 900, color: "#52635c" }}>
                      {permissionForm.permissionType === 1
                        ? "السماح بالحضور حتى"
                        : "وقت العودة"}
                    </Typography>
                    <TextField
                      sx={uiLayout.formFieldSx}
                      size="small"
                      fullWidth
                      type="time"
                      value={permissionForm.toTime}
                      onChange={(event) =>
                        setPermissionForm((current) => ({
                          ...current,
                          toTime: event.target.value
                        }))
                      }
                      inputProps={{
                        dir: "ltr",
                        style: {
                          textAlign: DATE_TEXT_ALIGN,
                          direction: "ltr",
                          unicodeBidi: "isolate"
                        }
                      }}
                    />
                  </Box>
                )}
              </Box>
            )}

            {permissionForm.permissionType === 4 && (
              <Alert severity="info" sx={uiLayout.withUiSx(darkAlertSx, { borderRadius: 2, py: 0.35 })}>
                إذن يوم كامل، لكن يجب أن يكون اليوم ضمن أيام العمل الفعلية في ورديتك.
              </Alert>
            )}

            <Box>
              <Typography sx={{ mb: 0.5, fontSize: 11.5, fontWeight: 900, color: "#52635c" }}>
                السبب
              </Typography>
              <TextField
                sx={uiLayout.formFieldSx}
                size="small"
                fullWidth
                multiline
                minRows={2}
                placeholder="اكتب سبب طلب الإذن..."
                value={permissionForm.reason}
                onChange={(event) =>
                  setPermissionForm((current) => ({
                    ...current,
                    reason: event.target.value
                  }))
                }
              />
            </Box>

            <Box>
              <Typography sx={{ mb: 0.5, fontSize: 11.5, fontWeight: 900, color: "#52635c" }}>
                ملاحظات
              </Typography>
              <TextField
                sx={uiLayout.formFieldSx}
                size="small"
                fullWidth
                multiline
                minRows={2}
                placeholder="ملاحظات إضافية - اختياري"
                value={permissionForm.notes}
                onChange={(event) =>
                  setPermissionForm((current) => ({
                    ...current,
                    notes: event.target.value
                  }))
                }
              />
            </Box>

            {permissionError && (
              <Alert severity="error" sx={uiLayout.withUiSx(darkAlertSx, { borderRadius: 2 })}>
                {permissionError}
              </Alert>
            )}
          </Stack>
        </DialogContent>

        <DialogActions
          sx={uiLayout.withUiSx((theme) => {
            const isDark = theme.palette.mode === "dark";
            return {
              px: { xs: 1.1, sm: 2.3 },
              py: { xs: 0.9, sm: 1.25 },
              borderTop: isDark
                ? `1px solid #67C99D`
                : `1px solid ${border}`,
              background: isDark ? theme.palette.surfaces.section : "#fff",
              gap: 0.7,
              justifyContent: "flex-start"
            };
          }, uiLayout.dialogActionsSx)}
        >
          <Button
            variant="outlined"
            startIcon={<SaveRoundedIcon />}
            onClick={submitPermissionRequest}
            disabled={permissionSubmitting}
            sx={uiLayout.withUiSx({ fontWeight: 900, minWidth: 118 }, uiLayout.buttonSx, permissionButtonSx)}
          >
            {permissionSubmitting ? "جاري الإرسال..." : "إرسال الطلب"}
          </Button>

          <Button
            variant="outlined"
            sx={[uiLayout.buttonSx, permissionButtonSx]}
            onClick={() => setPermissionDialogOpen(false)}
            disabled={permissionSubmitting}
          >
            إلغاء
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        sx={uiLayout.withUiSx(RTL_DIALOG_SX, uiLayout.dialogLayoutSx)}
        dir={LEAVE_DIALOG_DIRECTION}
        open={leaveDialogOpen}
        onClose={() =>
          !leaveSubmitting &&
          setLeaveDialogOpen(false)
        }
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            width: {
              xs: "calc(100% - 16px)",
              sm: "min(560px, calc(100% - 32px))"
            },
            maxWidth: "560px !important",
            m: { xs: 0.75, sm: 2 },
            maxHeight: { xs: "88dvh", sm: "82vh" },
            borderRadius: { xs: 2.5, sm: 3.2 },
            direction: LEAVE_DIALOG_DIRECTION,
            textAlign: LEAVE_DIALOG_TEXT_ALIGN,
            overflow: "hidden"
          }
        }}
      >
        <DialogTitle
          sx={(theme) => {
            const isDark = theme.palette.mode === "dark";
            return {
              px: { xs: 1.1, sm: 1.5 },
              py: { xs: 0.85, sm: 1 },
              borderBottom: isDark
                ? `1px solid #67C99D`
                : `1px solid ${border}`,
              background: isDark
                ? `linear-gradient(180deg, ${theme.palette.surfaces.section}, ${theme.palette.surfaces.card})`
                : "linear-gradient(180deg,#ffffff 0%,#fbfdfc 100%)",
              textAlign: LEAVE_DIALOG_TEXT_ALIGN
            };
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
            gap={1.2}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={(theme) => ({
                  fontSize: { xs: 14.5, sm: 17 },
                  fontWeight: 950,
                  color: theme.palette.mode === "dark" ? theme.palette.text.primary : "#17372b",
                  textAlign: LEAVE_DIALOG_TEXT_ALIGN
                })}
              >
                طلب إجازة جديد
              </Typography>
            </Box>

            <IconButton
              size="small"
              onClick={() =>
                setLeaveDialogOpen(false)
              }
              disabled={leaveSubmitting}
              sx={(theme) => {
                const isDark = theme.palette.mode === "dark";
                return {
                  mt: { xs: -0.15, sm: -0.35 },
                  flexShrink: 0,
                  width: { xs: 32, sm: 36 },
                  height: { xs: 32, sm: 36 },
                  border: isDark
                    ? `1px solid #67C99D`
                    : `1px solid ${border}`,
                  background: isDark ? theme.palette.surfaces.nested : soft
                };
              }}
            >
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent
          dir={LEAVE_DIALOG_DIRECTION}
          sx={(theme) => {
            const isDark = theme.palette.mode === "dark";
            return {
              px: { xs: 1.25, sm: 2.3 },
              py: { xs: "12px !important", sm: "20px !important" },
              direction: LEAVE_DIALOG_DIRECTION,
              textAlign: LEAVE_DIALOG_TEXT_ALIGN,
              background: isDark ? theme.palette.surfaces.page : "#fff",
              overflowY: "auto",

              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                minHeight: { xs: 42, sm: 46 },
                background: isDark ? theme.palette.surfaces.input : "#fff"
              },

              "& .MuiInputBase-input, & .MuiSelect-select, & textarea": {
                textAlign: LEAVE_DIALOG_TEXT_ALIGN,
                fontSize: { xs: 12.5, sm: 14 }
              },

              "& .MuiSelect-select": {
                py: { xs: 1.05, sm: 1.2 }
              },

              "& textarea": {
                lineHeight: 1.55
              }
            };
          }}
        >
          <Stack spacing={{ xs: 1.25, sm: 1.8 }}>
            {/* نوع الإجازة */}
            <Box>
              <Typography
                sx={{
                  mb: { xs: 0.45, sm: 0.7 },
                  fontSize: { xs: 12, sm: 12 },
                  fontWeight: 900,
                  color: "#52635c",
                  textAlign: LEAVE_DIALOG_TEXT_ALIGN
                }}
              >
                نوع الإجازة
              </Typography>

              <FormControl sx={uiLayout.formFieldSx}
                size="small"
                fullWidth
              >
                <Select
                  MenuProps={RTL_MENU_PROPS}
                  value={leaveForm.leaveTypeGuid}
                  displayEmpty
                  onChange={(event) =>
                    setLeaveForm((current) => ({
                      ...current,
                      leaveTypeGuid: event.target.value,
                      dayPart: 0,
                      attachment: null
                    }))
                  }
                >
                  {(leave?.types || []).map((type) => (
                    <MenuItem
                      key={type.leaveTypeGuid}
                      value={type.leaveTypeGuid}
                    >
                      {type.leaveTypeName}
                      {type.requiresBalance
                        ? " • من الرصيد"
                        : ""}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* الفترة */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "1fr 1fr"
                },
                gap: { xs: 0.9, sm: 1.4 }
              }}
            >
              <Box>
                <Typography
                  sx={{
                    mb: 0.7,
                    fontSize: 12,
                    fontWeight: 900,
                    color: "#52635c",
                    textAlign: LEAVE_DIALOG_TEXT_ALIGN
                  }}
                >
                  من تاريخ
                </Typography>

                <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                  size="small"
                  fullWidth
                  type="date"
                  value={leaveForm.fromDate}
                  onChange={(event) =>
                    setLeaveForm((current) => ({
                      ...current,
                      fromDate: event.target.value
                    }))
                  }
                  inputProps={{
                    dir: "ltr",
                    style: {
                      textAlign: DATE_TEXT_ALIGN
                    , direction: "ltr", unicodeBidi: "isolate" }
                  }}
                />
              </Box>

              <Box>
                <Typography
                  sx={{
                    mb: 0.7,
                    fontSize: 12,
                    fontWeight: 900,
                    color: "#52635c",
                    textAlign: LEAVE_DIALOG_TEXT_ALIGN
                  }}
                >
                  إلى تاريخ
                </Typography>

                <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                  size="small"
                  fullWidth
                  type="date"
                  value={leaveForm.toDate}
                  onChange={(event) =>
                    setLeaveForm((current) => ({
                      ...current,
                      toDate: event.target.value
                    }))
                  }
                  inputProps={{
                    dir: "ltr",
                    style: {
                      textAlign: DATE_TEXT_ALIGN
                    , direction: "ltr", unicodeBidi: "isolate" }
                  }}
                />
              </Box>
            </Box>

            {/* نوع اليوم */}
            {selectedLeaveType?.allowsHalfDay && (
              <Box>
                <Typography
                  sx={{
                    mb: 0.7,
                    fontSize: 12,
                    fontWeight: 900,
                    color: "#52635c",
                    textAlign: LEAVE_DIALOG_TEXT_ALIGN
                  }}
                >
                  نوع اليوم
                </Typography>

                <FormControl sx={uiLayout.formFieldSx}
                  size="small"
                  fullWidth
                >
                  <Select
                  MenuProps={RTL_MENU_PROPS}
                    value={leaveForm.dayPart}
                    onChange={(event) =>
                      setLeaveForm((current) => ({
                        ...current,
                        dayPart: Number(
                          event.target.value
                        )
                      }))
                    }
                  >
                    <MenuItem value={0}>
                      يوم كامل
                    </MenuItem>
                    <MenuItem value={1}>
                      النصف الأول
                    </MenuItem>
                    <MenuItem value={2}>
                      النصف الثاني
                    </MenuItem>
                  </Select>
                </FormControl>
              </Box>
            )}

            {/* سبب الإجازة */}
            <Box>
              <Typography
                sx={{
                  mb: { xs: 0.45, sm: 0.7 },
                  fontSize: { xs: 12, sm: 12 },
                  fontWeight: 900,
                  color: "#52635c",
                  textAlign: LEAVE_DIALOG_TEXT_ALIGN
                }}
              >
                سبب الإجازة
              </Typography>

              <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                size="small"
                multiline
                minRows={2}
                fullWidth
                placeholder="اكتب سبب طلب الإجازة..."
                value={leaveForm.reason}
                onChange={(event) =>
                  setLeaveForm((current) => ({
                    ...current,
                    reason: event.target.value
                  }))
                }
              />
            </Box>

            {/* المرفق */}
            <Box>
              <Typography
                sx={{
                  mb: { xs: 0.45, sm: 0.7 },
                  fontSize: { xs: 12, sm: 12 },
                  fontWeight: 900,
                  color: "#52635c",
                  textAlign: LEAVE_DIALOG_TEXT_ALIGN
                }}
              >
                المرفق
                {selectedLeaveType?.requiresAttachment
                  ? " • مطلوب"
                  : " • اختياري"}
              </Typography>

              <Button
                component="label"
                variant="outlined"
                startIcon={<FolderRoundedIcon />}
                fullWidth
                sx={uiLayout.withUiSx({
                  minHeight: { xs: 40, sm: 46 },
                  borderRadius: 2,
                                px: { xs: 1, sm: 1.4 },
                  fontSize: { xs: 12, sm: 12 },
                  overflow: "hidden"
                }, uiLayout.buttonSx)}
              >
                <Typography
                  component="span"
                  sx={{
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontSize: 12,
                    fontWeight: 800
                  }}
                >
                  {leaveForm.attachment
                    ? leaveForm.attachment.name
                    : "اختيار ملف"}
                </Typography>

                <input
                  hidden
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={(event) =>
                    setLeaveForm((current) => ({
                      ...current,
                      attachment:
                        event.target.files?.[0] ||
                        null
                    }))
                  }
                />
              </Button>
            </Box>

            {leaveCalculating && (
              <LinearProgress
                sx={{ borderRadius: 2 }}
              />
            )}

            {leaveCalcError && (
              <Alert
                severity="error"
                sx={uiLayout.withUiSx(darkAlertSx, {
                  borderRadius: 2,
                  alignItems: "center",
                  py: { xs: 0.35, sm: 0.6 },
                  "& .MuiAlert-message": {
                    fontSize: { xs: 12, sm: 12 },
                    lineHeight: 1.5
                  }
                })}
              >
                {leaveCalcError}
              </Alert>
            )}

            {leaveCalculation &&
              !leaveCalcError && (
                <Alert
                  severity="info"
                  sx={uiLayout.withUiSx(darkAlertSx, {
                    borderRadius: 2,
                    alignItems: "flex-start",
                    py: { xs: 0.35, sm: 0.6 },
                    "& .MuiAlert-message": {
                      width: "100%"
                    }
                  })}
                >
                  <Stack spacing={0.35}>
                    <Typography
                      sx={{
                        fontSize: 12,
                        fontWeight: 950
                      }}
                    >
                      الأيام المحسوبة:{" "}
                      {leaveCalculation.requestedDays} يوم
                    </Typography>

                    {leaveCalculation.requiresBalance && (
                      <Typography
                        sx={{ fontSize: 12 }}
                      >
                        الرصيد المتاح:{" "}
                        {leaveCalculation.availableBalance ??
                          0}{" "}
                        يوم
                      </Typography>
                    )}

                    {Number(
                      leaveCalculation.holidayDays ||
                        0
                    ) > 0 && (
                      <Typography
                        sx={{ fontSize: 12 }}
                      >
                        عطلات مستبعدة:{" "}
                        {leaveCalculation.holidayDays}
                      </Typography>
                    )}

                    {leaveCalculation.minNoticeDays !=
                      null && (
                      <Typography
                        sx={{ fontSize: 12 }}
                      >
                        الحد الأدنى للتقديم المسبق:{" "}
                        {
                          leaveCalculation.minNoticeDays
                        }{" "}
                        يوم
                      </Typography>
                    )}
                  </Stack>
                </Alert>
              )}
          </Stack>
        </DialogContent>

        <DialogActions
          dir={LEAVE_DIALOG_DIRECTION}
          sx={uiLayout.withUiSx((theme) => {
            const isDark = theme.palette.mode === "dark";
            return {
              px: { xs: 1.1, sm: 2.3 },
              py: { xs: 0.9, sm: 1.35 },
              borderTop: isDark
                ? `1px solid #67C99D`
                : `1px solid ${border}`,
              background: isDark ? theme.palette.surfaces.section : "#fbfdfc",
              gap: { xs: 0.55, sm: 0.7 },
              "& .MuiButton-root": {
                minHeight: { xs: 38, sm: 40 },
                fontSize: { xs: 12, sm: 12 }
              }
            };
          }, uiLayout.dialogActionsSx)}
        >
          <Button
            variant="outlined"
            // startIcon={<SaveRoundedIcon />}
            onClick={submitLeaveRequest}
            disabled={
              leaveSubmitting ||
              leaveCalculating ||
              !leaveCalculation
            }
            sx={uiLayout.withUiSx({
              minWidth: { xs: 0, sm: 122 },
              flex: { xs: 1, sm: "0 0 auto" },
              fontWeight: 900
            }, uiLayout.buttonSx, permissionButtonSx)}
          >
            {leaveSubmitting
              ? "جاري الإرسال..."
              : "إرسال الطلب"}
          </Button>

          <Button
            variant="outlined"
            onClick={() =>
              setLeaveDialogOpen(false)
            }
            disabled={leaveSubmitting}
            sx={uiLayout.withUiSx({
              flex: { xs: 1, sm: "0 0 auto" }
            }, uiLayout.buttonSx, permissionButtonSx)}
          >
            إلغاء
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
