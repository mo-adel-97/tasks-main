import { PRINT_READY_SCRIPT } from '../utils/printReady';
import { pinColor } from '../config/themeColors';
import PageContainer from '../components/common/PageContainer';
import * as uiLayout from '../components/common/uiLayout';
import { designTokens } from '../config/designTokens';
import './rtl-forms-fix.css';
import { DESKTOP_BREAKPOINT, navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
import React, {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from "react";
import StudentStatementDialog2 from "../components/StudentStatementDialog2";
import StudyApprovalDialog from "../components/StudyApprovalDialog";
import DocumentHistoryDialog from "../components/DocumentHistoryDialog";
import RegisterDocumentDialog from "../components/RegisterDocumentDialog";
import AdmissionOrderDialog from "../components/AdmissionOrderDialog";
import StudentPaymentOrderDialog from "../components/StudentPaymentOrderDialog";
import StudentRegFeesDialog from "../components/StudentRegFeesDialog";
import StudentStudyFileDialog from "../components/StudentStudyFileDialog";
import EditStudentDialog from "../components/EditStudentDialog";
import StudentOperationsDialog from "../components/StudentOperationsDialog";
import DiscountOrderDialog from "../components/DiscountOrderDialog";
import ChangeStudentStatusDialog from "../components/ChangeStudentStatusDialog";
import RefundRequestDialog from "../components/RefundRequestDialog";
import ChangePaymentStatusDialog from "../components/ChangePaymentStatusDialog";
import RegistrationReturnDialog from "../components/RegistrationReturnDialog";
import InvoiceReturnDialog from "../components/InvoiceReturnDialog";
import ReceptionCelebration from "../components/ReceptionCelebration";
import {
  Alert,
  Backdrop,
  Box,
  GlobalStyles,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Tooltip,
  Typography,
  TextField,
  AppBar,
  Toolbar,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";



import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import AssignmentIcon from "@mui/icons-material/Assignment";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PaymentsIcon from "@mui/icons-material/Payments";
import SchoolIcon from "@mui/icons-material/School";
import HistoryIcon from "@mui/icons-material/History";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import DiscountIcon from "@mui/icons-material/Discount";
import VerifiedIcon from "@mui/icons-material/Verified";
import ReplayIcon from "@mui/icons-material/Replay";
import ChangeCircleIcon from "@mui/icons-material/ChangeCircle";
import VisibilityIcon from "@mui/icons-material/Visibility";
import FolderSharedIcon from "@mui/icons-material/FolderShared";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditNoteIcon from "@mui/icons-material/EditNote";
import DescriptionIcon from "@mui/icons-material/Description";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import UndoIcon from "@mui/icons-material/Undo";
import ReceiptIcon from "@mui/icons-material/Receipt";
import PublishedWithChangesIcon from "@mui/icons-material/PublishedWithChanges";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import CurrencyExchangeIcon from "@mui/icons-material/CurrencyExchange";
import ManageHistoryIcon from "@mui/icons-material/ManageHistory";
import CreditScoreIcon from "@mui/icons-material/CreditScore";
import PrintIcon from "@mui/icons-material/Print";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import AddStudentDialog from "../components/AddStudentDialog";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";


const API_BASE_URL = "https://api4.sstli.com";

const RECEPTION_PERMISSION_TTL_MS = 30 * 1000;
const receptionPermissionCache = new Map();
const receptionPermissionInFlight = new Map();

const receptionPermissionKey = (
  userGuid,
  formName,
  action
) =>
  [
    String(userGuid || "").toLowerCase(),
    String(formName || "").toLowerCase(),
    String(action || "").toLowerCase()
  ].join("|");

const checkReceptionPermissionFast = async ({
  apiBaseUrl = API_BASE_URL,
  userGuid,
  formName,
  action,
  force = false
}) => {
  const key = receptionPermissionKey(
    userGuid,
    formName,
    action
  );

  const cached = receptionPermissionCache.get(key);

  if (
    !force &&
    cached &&
    Date.now() - cached.timestamp < RECEPTION_PERMISSION_TTL_MS
  ) {
    return cached.result;
  }

  if (!force && receptionPermissionInFlight.has(key)) {
    return receptionPermissionInFlight.get(key);
  }

  const promise = (async () => {
    const params = new URLSearchParams({
      userGuid,
      formName,
      action
    });

    const response = await fetch(
      `${apiBaseUrl}/api/reception-office/permissions/check?${params.toString()}`,
      { cache: "no-store" }
    );

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        result?.message ||
        result?.error ||
        "تعذر فحص الصلاحية"
      );
    }

    receptionPermissionCache.set(key, {
      timestamp: Date.now(),
      result
    });

    return result;
  })();

  receptionPermissionInFlight.set(key, promise);

  try {
    return await promise;
  } finally {
    receptionPermissionInFlight.delete(key);
  }
};


const primaryColor = "#057546";
const primaryDark = "#034d31";
const primaryLight = "#e6f3ee";
const accentColor = "#ae1e21";
const whiteColor = "#fefefe";
const textColor = "#1f2d3d";
const softBg = "#fefefe";

const DARK_ACTION_GLOBAL_STYLES = (theme) => {
  if (theme.palette.mode !== "dark") return {};

  const darkBorder = "#67C99D";
  const darkText = "#9BE0C1";

  return {
    ".MuiButton-root": {
      backgroundColor: "transparent !important",
      backgroundImage: "none !important",
      color: `${darkText} !important`,
      border: `1px solid ${darkBorder} !important`,
      boxShadow: "none !important",
      borderRadius: "10px !important",
      fontWeight: "800 !important"
    },
    ".MuiButton-root:hover": {
      backgroundColor: "transparent !important",
      backgroundImage: "none !important",
      color: "#C9F2DF !important",
      borderColor: `${darkBorder} !important`,
      boxShadow: "0 0 0 1px rgba(103,201,157,.18) !important"
    },
    ".MuiButton-root.Mui-disabled": {
      backgroundColor: "transparent !important",
      color: "rgba(155,224,193,.42) !important",
      borderColor: "rgba(103,201,157,.35) !important",
      boxShadow: "none !important"
    },
    ".MuiButton-root .MuiSvgIcon-root": {
      color: "inherit !important"
    },
    ".MuiIconButton-root": {
      backgroundColor: "transparent !important",
      backgroundImage: "none !important",
      color: `${darkText} !important`,
      border: `1px solid ${darkBorder} !important`,
      boxShadow: "none !important"
    },
    ".MuiIconButton-root:hover": {
      backgroundColor: "transparent !important",
      color: "#C9F2DF !important",
      borderColor: `${darkBorder} !important`
    },
    ".MuiIconButton-root.Mui-disabled": {
      backgroundColor: "transparent !important",
      color: "rgba(155,224,193,.38) !important",
      borderColor: "rgba(103,201,157,.30) !important"
    },
    ".MuiChip-root": {
      backgroundColor: "transparent !important",
      backgroundImage: "none !important",
      color: `${darkText} !important`,
      border: `1px solid ${darkBorder} !important`,
      boxShadow: "none !important"
    },
    ".MuiChip-icon, .MuiChip-deleteIcon": {
      color: `${darkText} !important`
    },
    ".MuiOutlinedInput-root": {
      backgroundColor: "transparent !important",
      backgroundImage: "none !important"
    },
    ".MuiOutlinedInput-notchedOutline": {
      borderColor: `${darkBorder} !important`
    },
    ".MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: `${darkBorder} !important`
    },
    ".MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: `${darkBorder} !important`
    },
    ".MuiSelect-icon": {
      color: `${darkText} !important`
    },
    ".MuiAlert-root": {
      backgroundColor: "transparent !important",
      backgroundImage: "none !important",
      color: `${theme.palette.text.primary} !important`,
      border: `1px solid ${darkBorder} !important`,
      boxShadow: "none !important"
    },
    ".MuiAlert-icon": {
      color: `${darkText} !important`
    },
    ".MuiPaginationItem-root": {
      backgroundColor: "transparent !important",
      color: `${darkText} !important`,
      border: "1px solid transparent !important"
    },
    ".MuiPaginationItem-root.Mui-selected": {
      backgroundColor: "transparent !important",
      color: "#C9F2DF !important",
      border: `1px solid ${darkBorder} !important`
    },
    ".MuiSwitch-track": {
      backgroundColor: "transparent !important",
      border: `1px solid ${darkBorder} !important`,
      opacity: "1 !important"
    },
    ".MuiSwitch-thumb": {
      backgroundColor: `${darkBorder} !important`
    },
    ".MuiSwitch-switchBase.Mui-checked": {
      color: `${darkBorder} !important`
    },
    ".MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
      backgroundColor: "transparent !important",
      borderColor: `${darkBorder} !important`,
      opacity: "1 !important"
    }
  };
};


const showWarning = (message) => {
  return Swal.fire({
    icon: "warning",
    title: "تنبيه",
    text: message,
    confirmButtonText: "حسناً",
    confirmButtonColor: accentColor
  });
};

const showError = (message) => {
  return Swal.fire({
    icon: "error",
    title: "خطأ",
    text: message,
    confirmButtonText: "حسناً",
    confirmButtonColor: accentColor
  });
};

const showSuccess = (message) => {
  return Swal.fire({
    icon: "success",
    title: "تم بنجاح",
    text: message,
    confirmButtonText: "حسناً",
    confirmButtonColor: primaryColor
  });
};

const showInfo = (title, message) => {
  return Swal.fire({
    icon: "info",
    title,
    text: message,
    confirmButtonText: "حسناً",
    confirmButtonColor: primaryColor
  });
};

const normalizeBool = (value, defaultValue = false) => {
  if (value === null || value === undefined || value === "") return defaultValue;

  if (typeof value === "boolean") return value;

  if (value === 1 || value === "1") return true;
  if (value === 0 || value === "0") return false;

  const text = String(value || "").trim().toLowerCase();

  if (text === "true" || text === "yes" || text === "on") return true;
  if (text === "false" || text === "no" || text === "off") return false;

  return defaultValue;
};

const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};
const getUserGuid = (user) => {
  return (
    user?.userGuid ||
    user?.guid ||
    user?.Guid ||
    user?.USER_GUID ||
    user?.USER_GUID____ ||
    ""
  );
};

const parseHijriDate = (value) => {
  if (!value) return null;

  const parts = String(value).trim().split("-");
  if (parts.length !== 3) return null;

  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);

  if (!y || !m || !d) return null;

  return { year: y, month: m, day: d };
};

const getHijriPartsFromGregorian = (date) => {
  const formatter = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
    year: "numeric",
    month: "numeric",
    day: "numeric"
  });

  const parts = formatter.formatToParts(date);

  const getPart = (type) =>
    Number(parts.find((p) => p.type === type)?.value || 0);

  return {
    year: getPart("year"),
    month: getPart("month"),
    day: getPart("day")
  };
};

const compareHijri = (a, b) => {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month !== b.month) return a.month - b.month;
  return a.day - b.day;
};

const hijriToGregorianDate = (hijriValue) => {
  const target = parseHijriDate(hijriValue);
  if (!target) return null;

  // تقريب بداية ونهاية البحث
  const startYear = target.year + 577;
  const endYear = target.year + 581;

  let current = new Date(Date.UTC(startYear, 0, 1));
  const end = new Date(Date.UTC(endYear, 11, 31));

  while (current <= end) {
    const hijri = getHijriPartsFromGregorian(current);

    if (compareHijri(hijri, target) === 0) {
      return new Date(current);
    }

    current.setUTCDate(current.getUTCDate() + 1);
  }

  return null;
};

const formatBirthDate = (value) => {
  if (!value) return "-";

  const text = String(value).trim();

  // لو السنة هجري غالبًا أقل من 1700
  const year = Number(text.split("-")[0]);

  if (year > 0 && year < 1700) {
    const gregorianDate = hijriToGregorianDate(text);

    if (!gregorianDate) return text;

    return gregorianDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "numeric",
      day: "numeric"
    });
  }

  // لو التاريخ ميلادي عادي
  const date = new Date(text);

  if (Number.isNaN(date.getTime())) {
    return text;
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric"
  });
};

const EllipsisCell = ({ value, color = textColor }) => (
  <Tooltip title={value || ""} arrow>
    <Typography
      sx={{
        width: "100%",
        fontSize: "0.8rem",
        fontWeight: 800,
        color,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        textAlign: "center",
        direction: "rtl"
      }}
    >
      <bdi dir="auto">{value || "-"}</bdi>
    </Typography>
  </Tooltip>
);

const HeaderButton = ({
  icon,
  label,
  onClick,
  onPointerDown,
  color = primaryColor
}) => (
  <Button
    variant="outlined"
    startIcon={icon}
    onClick={onClick}
    onPointerDown={onPointerDown}
    sx={uiLayout.withUiSx((theme) => {
      const isDark = theme.palette.mode === "dark";
      const darkHoverBg = `${color}26`;
      return {
        height: "auto",
        minWidth: 0,
        width: { xs: "100%", sm: "auto" },
        borderRadius: 2.5,
        fontWeight: 950,
        color,
        borderColor: pinColor(color),
        backgroundColor: isDark ? theme.palette.surfaces.card : whiteColor,
        direction: "rtl",
        boxShadow: isDark ? "none" : "0 8px 20px rgba(5,117,70,0.08)",
        "& .MuiButton-startIcon": {
          ml: 0.5,
          mr: 0
        },
        "&:hover": {
          borderColor: pinColor(color),
          backgroundColor: isDark ? darkHoverBg : (color === accentColor ? "#fff4f4" : "#f0faf5"),
          boxShadow: isDark ? "none" : "0 10px 24px rgba(5,117,70,0.14)"
        }
      };
    }, uiLayout.buttonSx)}
  >
    {label}
  </Button>
);

const ActionButton = ({ title, icon, color, bg, onClick }) => (
  <Tooltip title={title} arrow>
    <IconButton
      size="small"
      onClick={onClick}
      sx={(theme) => {
        // `bg` is always a near-white tint of `color` (e.g. "#e8f5e9" next to
        // "#2e7d32"): safe as a light-mode pastel, but its brightness makes
        // the shared dark-color plugin flatten it to near-black in dark mode.
        // A translucent version of `color` itself keeps the same hue instead.
        const isDark = theme.palette.mode === "dark";
        const darkBg = `${color}26`;
        return {
          color,
          backgroundColor: isDark ? darkBg : bg,
          width: 28,
          height: 28,
          p: 0.4,
          "& svg": {
            fontSize: "1rem"
          },
          "&:hover": {
            backgroundColor: isDark ? darkBg : bg,
            filter: isDark ? "brightness(1.2)" : "brightness(0.95)"
          }
        };
      }}
    >
      {icon}
    </IconButton>
  </Tooltip>
);
const DetailItem = ({ label, value, strong = false }) => (
  <Paper
    elevation={0}
    sx={(theme) => {
      const isDark = theme.palette.mode === "dark";
      return {
        p: 1.3,
        borderRadius: 2,
        border: isDark ? "1px solid #67C99D" : `1px solid ${primaryLight}`,
        backgroundColor: isDark ? theme.palette.surfaces.nested : whiteColor,
        height: "100%",
        direction: "rtl",
        textAlign: "start"
      };
    }}
  >
    <Typography sx={(theme) => ({ color: theme.palette.mode === "dark" ? theme.palette.primary.main : primaryColor, fontWeight: 900, fontSize: "0.78rem", mb: 0.4 })}>
      {label}
    </Typography>
    <Typography
      sx={(theme) => ({
        color: strong ? "#d32f2f" : (theme.palette.mode === "dark" ? theme.palette.text.primary : textColor),
        fontWeight: 900,
        lineHeight: 1.7,
        wordBreak: "break-word",
        fontSize: strong ? "1rem" : "0.9rem"
      })}
    >
      {value || "-"}
    </Typography>
  </Paper>
);



const comingSoonMenuItemSx = {
  color: "#9e9e9e !important",
  cursor: "not-allowed",
  opacity: "1 !important",
  "& .MuiListItemIcon-root": {
    color: "#9e9e9e !important",
    minWidth: 38
  },
  "& .MuiListItemText-primary": {
    color: "#9e9e9e !important",
    fontWeight: "900 !important"
  },
  "&.Mui-disabled": {
    backgroundColor: "#fafafa",
    opacity: "1 !important"
  }
};

const ComingSoonMenuItem = ({ icon, label }) => (
  <MenuItem disabled sx={comingSoonMenuItemSx}>
    <ListItemIcon>{icon}</ListItemIcon>
    <ListItemText
      primary={
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
          sx={{ width: "100%" }}
        >
          <Typography sx={{ fontWeight: 900, color: "#777" }}>
            {label}
          </Typography>
          <Chip
            label="قريباً"
            size="small"
            sx={{
              height: 20,
              fontSize: "0.75rem",
              fontWeight: 950,
              color: "#777",
              backgroundColor: "#eeeeee",
              border: "1px solid #dddddd"
            }}
          />
        </Stack>
      }
    />
  </MenuItem>
);


const actionMenuItemSx = (color = primaryColor) => (theme) => {
  const isDark = theme.palette.mode === "dark";
  const darkHover = theme.palette.surfaces?.hover || "#214333";

  return {
    mx: 0.8,
    my: 0.35,
    minHeight: 46,
    px: 1.1,
    py: 0.55,
    borderRadius: 2.2,
    direction: "rtl",
    transition: "all 160ms ease",
    backgroundColor: "transparent",
    color: isDark ? theme.palette.text.primary : textColor,
    border: isDark
      ? "1px solid transparent"
      : "1px solid transparent",

    "& .MuiListItemIcon-root": {
      minWidth: 0,
      ml: 1.1,
      mr: 0
    },

    "&:hover": {
      backgroundColor: isDark ? darkHover : `${color}10`,
      borderColor: isDark ? "#67C99D" : "transparent",
      transform: "translateX(-3px)",

      "& .action-menu-icon": {
        backgroundColor: isDark ? "transparent" : color,
        color: isDark ? "#C9F2DF" : "#fff",
        borderColor: isDark ? "#67C99D" : `${color}28`,
        boxShadow: isDark ? "none" : `0 7px 16px ${color}35`
      }
    },

    [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
      mx: 0.35,
      my: 0.12,
      minHeight: 33,
      px: 0.55,
      py: 0.22,
      borderRadius: 1.35,

      "& .MuiListItemIcon-root": {
        ml: 0.5
      },

      "&:hover": {
        transform: "none"
      }
    },

    "@media (max-width:599px)": {
      minHeight: 30,
      mx: 0.25,
      px: 0.45,
      py: 0.16
    }
  };
};

const ActionMenuItem = ({ icon, label, color = primaryColor, onClick }) => (
  <MenuItem onClick={onClick} sx={actionMenuItemSx(color)}>
    <ListItemIcon>
      <Box
        className="action-menu-icon"
        sx={(theme) => {
          const isDark = theme.palette.mode === "dark";

          return {
            width: 34,
            height: 34,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: isDark ? "#9BE0C1" : color,
            backgroundColor: isDark ? "transparent" : `${color}12`,
            border: isDark
              ? "1px solid #67C99D"
              : `1px solid ${color}28`,
            boxShadow: "none",
            transition: "all 160ms ease",

            "& svg": {
              fontSize: "1.18rem"
            },

            [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
              width: 25,
              height: 25,
              borderRadius: 1.15,

              "& svg": {
                fontSize: "0.82rem"
              }
            },

            "@media (max-width:599px)": {
              width: 23,
              height: 23,

              "& svg": {
                fontSize: "0.76rem"
              }
            }
          };
        }}
      >
        {icon}
      </Box>
    </ListItemIcon>

    <ListItemText
      primary={label}
      primaryTypographyProps={{
        fontWeight: 900,
        textAlign: "start",
        sx: (theme) => ({
          color:
            theme.palette.mode === "dark"
              ? theme.palette.text.primary
              : textColor,
          fontSize: "0.88rem",
          lineHeight: 1.25,
          whiteSpace: "nowrap",

          [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
            fontSize: "0.62rem"
          },

          "@media (max-width:599px)": {
            fontSize: "0.56rem"
          }
        })
      }}
    />
  </MenuItem>
);

const ActionMenuSection = ({ children }) => (
  <Box
    sx={{
      py: 0.35,
      [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: { py: 0.12 }
    }}
  >
    {children}
  </Box>
);


const oldMoney = (value) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const OldStudentStatementDialog = ({
  open,
  loading,
  data,
  error,
  onClose
}) => {
  const renderRows = (rows, type) =>
    (rows || [])
      .map((row) => {
        if (type === "cash") {
          return `
            <tr>
              <td>${row.date || "-"}</td>
              <td>${row.documentNo || "-"}</td>
              <td>${oldMoney(row.debit)}</td>
              <td>${oldMoney(row.credit)}</td>
              <td>${row.statement || "-"}</td>
              <td>${row.reference || "-"}</td>
              <td>${row.bank || "-"}</td>
            </tr>
          `;
        }

        return `
          <tr>
            <td>${row.date || "-"}</td>
            <td>${row.documentType || "-"}</td>
            <td>${row.documentNo || "-"}</td>
            <td>${oldMoney(row.debit)}</td>
            <td>${oldMoney(row.credit)}</td>
            <td>${row.statement || "-"}</td>
            <td>${row.sellerName || "-"}</td>
          </tr>
        `;
      })
      .join("");

  const handlePrint = () => {
    if (!data) return;

    const win = window.open("", "_blank", "width=1200,height=850");
    if (!win) {
      showWarning("المتصفح منع نافذة الطباعة");
      return;
    }

    win.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <title>كشف حساب سابق - ${data.studentName || ""}</title>
          <style>
            @page { size: A4 landscape; margin: 10mm; }
            * { box-sizing: border-box; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            body { font-family: Arial, Tahoma, sans-serif; direction: rtl; color:#1f2d3d; }
            h1 { color:#057546; text-align:center; margin:0 0 8px; }
            .sub { text-align:center; font-weight:bold; margin-bottom:12px; }
            .summary { display:grid; grid-template-columns:repeat(5,1fr); gap:8px; margin-bottom:14px; }
            .card { border:1px solid #cfe6db; border-radius:8px; padding:9px; text-align:center; font-weight:bold; }
            .card b { display:block; color:#057546; margin-bottom:5px; }
            table { width:100%; border-collapse:collapse; margin:8px 0 18px; font-size:10px; }
            th { background:#057546; color:#fff; padding:7px 4px; }
            td { border:1px solid #d9e6e0; padding:6px 4px; text-align:center; }
            h2 { color:#057546; font-size:16px; margin:10px 0 5px; }
          </style>
        ${PRINT_READY_SCRIPT}</head>
        <body>
          <h1>كشف حساب سابق</h1>
          <div class="sub">
            ${data.studentName || ""} — رقم العميل: ${data.oldCustomerNo || "-"} — كود الفرع: ${data.branchCode || "-"}
          </div>

          <div class="summary">
            <div class="card"><b>مدين</b>${oldMoney(data.summary?.debit)}</div>
            <div class="card"><b>دائن</b>${oldMoney(data.summary?.credit)}</div>
            <div class="card"><b>الرصيد</b>${oldMoney(data.summary?.balance)}</div>
            <div class="card"><b>افتتاحي مدين</b>${oldMoney(data.opening?.debit)}</div>
            <div class="card"><b>افتتاحي دائن</b>${oldMoney(data.opening?.credit)}</div>
          </div>

          <h2>استمارات التسجيل</h2>
          <table>
            <thead><tr><th>التاريخ</th><th>نوع المستند</th><th>رقم المستند</th><th>مدين</th><th>دائن</th><th>البيان</th><th>مندوب البيع</th></tr></thead>
            <tbody>${renderRows(data.registrations, "reg") || '<tr><td colspan="7">لا توجد حركات</td></tr>'}</tbody>
          </table>

          <h2>الحركات النقدية</h2>
          <table>
            <thead><tr><th>التاريخ</th><th>رقم المستند</th><th>مدين</th><th>دائن</th><th>البيان</th><th>المرجع</th><th>البنك / الخزينة</th></tr></thead>
            <tbody>${renderRows(data.cashMovements, "cash") || '<tr><td colspan="7">لا توجد حركات</td></tr>'}</tbody>
          </table>
          <script>window.onload=()=>setTimeout(()=>printWhenReady(),300);</script>
        </body>
      </html>
    `);

    win.document.close();
  };

  const table = (title, rows, type) => (
    <Paper elevation={0} sx={(theme) => ({
      border: theme.palette.mode === "dark" ? "1px solid #67C99D" : `1px solid ${primaryLight}`,
      borderRadius: 3,
      overflow: "hidden"
    })}>
      <Typography sx={(theme) => ({
        p: 1.2,
        fontWeight: 950,
        color: primaryColor,
        backgroundColor: theme.palette.mode === "dark" ? "rgba(103,201,157,.12)" : "#f4fbf7"
      })}>
        {title}
      </Typography>
      <Box sx={{ overflowX: "auto" }}>
        <Box component="table" sx={(theme) => {
          const isDark = theme.palette.mode === "dark";
          return {
            width: "100%",
            borderCollapse: "collapse",
            backgroundColor: isDark ? theme.palette.surfaces.card : undefined,
            "& th": { backgroundColor: primaryColor, color: "#fff", fontWeight: 950, p: 1, whiteSpace: "nowrap" },
            "& td": { borderBottom: isDark ? "1px solid #67C99D" : "1px solid #e7efeb", p: 0.9, textAlign: "center", fontWeight: 800 }
          };
        }}>
          <thead>
            <tr>
              <th>التاريخ</th>
              {type !== "cash" ? <th>نوع المستند</th> : null}
              <th>رقم المستند</th>
              <th>مدين</th>
              <th>دائن</th>
              <th>البيان</th>
              {type === "cash" ? <th>المرجع</th> : null}
              <th>{type === "cash" ? "البنك / الخزينة" : "مندوب البيع"}</th>
            </tr>
          </thead>
          <tbody>
            {(rows || []).length ? (rows || []).map((row) => (
              <tr key={row.id}>
                <td>{row.date || "-"}</td>
                {type !== "cash" ? (
                  <td>{row.documentType || "-"}</td>
                ) : null}
                <td>{row.documentNo || "-"}</td>
                <td>{oldMoney(row.debit)}</td>
                <td>{oldMoney(row.credit)}</td>
                <td style={{ textAlign: "right" }}>
                  {row.statement || "-"}
                </td>
                {type === "cash" ? (
                  <td>{row.reference || "-"}</td>
                ) : null}
                <td>
                  {type === "cash"
                    ? row.bank || "-"
                    : row.sellerName || "-"}
                </td>
              </tr>
            )) : <tr><td colSpan={7}>لا توجد حركات</td></tr>}
          </tbody>
        </Box>
      </Box>
    </Paper>
  );

  return (
    <Dialog
      sx={uiLayout.withUiSx(uiLayout.dialogLayoutSx, (theme) => (theme.palette.mode === "dark" ? { "& .MuiDialog-paper": { border: "1px solid #67C99D" } } : {}))}
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="xl"
      fullWidth
      dir="rtl"
    >
      <DialogTitle sx={{ fontWeight: 950, color: primaryColor }}>كشف حساب سابق</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Stack alignItems="center" spacing={2} sx={{ py: 8 }}>
            <CircularProgress />
            <Typography sx={{ fontWeight: 900 }}>جاري تحميل كشف الحساب القديم...</Typography>
          </Stack>
        ) : error ? <Alert severity="error">{error}</Alert> : data ? (
          <Stack spacing={2}>
            <Typography variant="h5" sx={{ textAlign: "center", fontWeight: 950 }}>
              {data.studentName || "طالب قديم"}
            </Typography>
            <Typography sx={{ textAlign: "center", fontWeight: 900 }}>
              رقم العميل القديم: {data.oldCustomerNo} — كود الفرع: {data.branchCode}
            </Typography>

            <Grid container spacing={1.5}>
              {[
                ["مدين", data.summary?.debit],
                ["دائن", data.summary?.credit],
                ["الرصيد", data.summary?.balance],
                ["افتتاحي مدين", data.opening?.debit],
                ["افتتاحي دائن", data.opening?.credit]
              ].map(([label, value]) => (
                <Grid item xs={12} sm={6} md key={label}>
                  <Paper elevation={0} sx={(theme) => ({
                    p: 1.5,
                    textAlign: "center",
                    borderRadius: 3,
                    border: theme.palette.mode === "dark" ? "1px solid #67C99D" : `1px solid ${primaryLight}`,
                    background: theme.palette.mode === "dark" ? theme.palette.surfaces.card : undefined
                  })}>
                    <Typography sx={{ color: primaryColor, fontWeight: 950 }}>{label}</Typography>
                    <Typography variant="h6" sx={{ mt: 0.4, fontWeight: 950, color: label === "الرصيد" ? accentColor : textColor }}>
                      {oldMoney(value)}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {table("استمارات التسجيل", data.registrations, "reg")}
            {table("الحركات النقدية", data.cashMovements, "cash")}
          </Stack>
        ) : null}
      </DialogContent>
      <DialogActions sx={uiLayout.withUiSx({ p: { xs: 1, sm: 2 }, justifyContent: "space-between", flexDirection: { xs: "column", sm: "row" }, gap: 1, "& .MuiButton-root": { width: { xs: "100%", sm: "auto" } } }, uiLayout.dialogActionsSx)}>
        <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrint} disabled={!data || loading}
          sx={uiLayout.withUiSx({ backgroundColor: primaryColor, fontWeight: 900 }, uiLayout.buttonSx)}>
          طباعة
        </Button>
        <Button onClick={onClose} disabled={loading} sx={uiLayout.withUiSx({ color: accentColor, fontWeight: 900 }, uiLayout.buttonSx)}>إغلاق</Button>
      </DialogActions>
    </Dialog>
  );
};


const FastAddStudentDialogHost = memo(
  forwardRef(({ onCreated }, ref) => {
    const [open, setOpen] = useState(false);
    const [initialData, setInitialData] = useState(null);
    const [permissionMode, setPermissionMode] =
      useState("addStudent");
    const openRef = useRef(false);

    const closeDialog = useCallback(() => {
      openRef.current = false;
      setOpen(false);
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        openNew: () => {
          if (openRef.current) return;

          setInitialData(null);
          setPermissionMode("addStudent");
          openRef.current = true;
          setOpen(true);
        },

        openArchive: (data) => {
          setInitialData(data);
          setPermissionMode("acceptOldStudent");
          openRef.current = true;
          setOpen(true);
        },

        close: closeDialog
      }),
      [closeDialog]
    );

    const handleCreated = useCallback(
      (student) => {
        openRef.current = false;
        setOpen(false);
        onCreated?.(student);
      },
      [onCreated]
    );

    return (
      <AddStudentDialog
        open={open}
        initialData={initialData}
        permissionMode={permissionMode}
        onClose={closeDialog}
        onCreated={handleCreated}
      />
    );
  })
);

FastAddStudentDialogHost.displayName =
  "FastAddStudentDialogHost";


const FastReceptionDialogsHost = memo(
  forwardRef(
    (
      {
        onRefresh,
        onOpenStatementDocument,
        onOpenStatementSalesInvoice,
        onOpenStatementSalesReturn,
        onOpenStatementHistory
      },
      ref
    ) => {
      const [editState, setEditState] = useState({ open: false, student: null });
      const [statementState, setStatementState] = useState({ open: false, student: null });
      const [admissionState, setAdmissionState] = useState({ open: false, student: null });
      const [feesState, setFeesState] = useState({ open: false, student: null });
      const [paymentState, setPaymentState] = useState({
        open: false,
        loading: false,
        context: null,
        student: null,
        needsRefresh: false
      });

      const paymentRequestIdRef = useRef(0);

      const openEdit = useCallback((student) => {
        setEditState({ open: true, student });
      }, []);

      const openStatement = useCallback((student) => {
        setStatementState({ open: true, student });
      }, []);

      const openAdmission = useCallback((student) => {
        setAdmissionState({ open: true, student });
      }, []);

      const openFees = useCallback((student) => {
        setFeesState({ open: true, student });
      }, []);

      const openPayment = useCallback((student) => {
        const branchGuid =
          student?.branchGuid ||
          student?.studyBranchGuid ||
          student?.BranchGuid ||
          "";

        const requestId = ++paymentRequestIdRef.current;

        // Show the shell immediately.
        setPaymentState({
          open: true,
          loading: true,
          context: null,
          student,
          needsRefresh: false
        });

        // Network starts after the first paint opportunity.
        window.setTimeout(async () => {
          try {
            const params = new URLSearchParams({
              accountGuid: student?.accountGuid || "",
              studentName: student?.studentName || "",
              nationalId: student?.nationalId || "",
              tel: student?.studentTel || student?.tel || "",
              studentNational: String(
                student?.studentNational ??
                student?.StudentNational ??
                "0"
              ),
              diplomName: student?.diplomName || "",
              diplomGuid: student?.diplomGuid || "",
              branchGuid,
              branchName:
                student?.branchName ||
                student?.studyBranchName ||
                "",
              regDocGuid: student?.regDocGuid || ""
            });

            const response = await fetch(
              `${API_BASE_URL}/api/student-payment-orders/context?${params.toString()}`
            );

            const result = await response.json().catch(() => null);

            if (!response.ok) {
              throw new Error(
                result?.message ||
                result?.error ||
                "تعذر تجهيز بيانات السداد"
              );
            }

            if (requestId !== paymentRequestIdRef.current) return;

            setPaymentState((current) => ({
              ...current,
              loading: false,
              context: result
            }));
          } catch (error) {
            if (requestId !== paymentRequestIdRef.current) return;

            setPaymentState((current) => ({
              ...current,
              loading: false,
              open: false,
              context: null
            }));

            showError(
              error?.message ||
              "حدث خطأ أثناء تجهيز بيانات السداد"
            );
          }
        }, 0);
      }, []);

      const closePayment = useCallback(() => {
        if (paymentState.loading) return;

        const shouldRefresh = paymentState.needsRefresh;

        setPaymentState({
          open: false,
          loading: false,
          context: null,
          student: null,
          needsRefresh: false
        });

        if (shouldRefresh) onRefresh?.();
      }, [
        paymentState.loading,
        paymentState.needsRefresh,
        onRefresh
      ]);

      useImperativeHandle(
        ref,
        () => ({
          openEdit,
          openStatement,
          openAdmission,
          openFees,
          openPayment,
          closeAll: () => {
            setEditState({ open: false, student: null });
            setStatementState({ open: false, student: null });
            setAdmissionState({ open: false, student: null });
            setFeesState({ open: false, student: null });
            setPaymentState({
              open: false,
              loading: false,
              context: null,
              student: null,
              needsRefresh: false
            });
          }
        }),
        [openEdit, openStatement, openAdmission, openFees, openPayment]
      );

      return (
        <>
          <EditStudentDialog
            open={editState.open}
            onClose={() => setEditState({ open: false, student: null })}
            student={editState.student}
            apiBaseUrl={API_BASE_URL}
            onSaved={() => {
              setEditState({ open: false, student: null });
              onRefresh?.();
            }}
          />

          <StudentStatementDialog2
            open={statementState.open}
            onClose={() => setStatementState({ open: false, student: null })}
            student={statementState.student}
            apiBaseUrl={API_BASE_URL}
            onOpenStatementDocument={onOpenStatementDocument}
            onOpenSalesInvoice={onOpenStatementSalesInvoice}
            onOpenSalesReturn={onOpenStatementSalesReturn}
            onOpenHistory={onOpenStatementHistory}
          />

          <AdmissionOrderDialog
            open={admissionState.open}
            onClose={() => setAdmissionState({ open: false, student: null })}
            student={admissionState.student}
            apiBaseUrl={API_BASE_URL}
            onSaved={() => onRefresh?.()}
          />

          <StudentRegFeesDialog
            open={feesState.open}
            onClose={() => setFeesState({ open: false, student: null })}
            student={feesState.student}
            apiBaseUrl={API_BASE_URL}
            onSaved={() => {
              setFeesState({ open: false, student: null });
              onRefresh?.();
            }}
          />

          <StudentPaymentOrderDialog
            open={paymentState.open}
            onClose={closePayment}
            context={paymentState.context}
            selectedStudent={paymentState.student}
            loading={paymentState.loading}
            apiBaseUrl={API_BASE_URL}
            onSaved={() => {
              setPaymentState((current) => ({
                ...current,
                needsRefresh: true
              }));
            }}
          />
        </>
      );
    }
  )
);

FastReceptionDialogsHost.displayName = "FastReceptionDialogsHost";

const ReceptionOffice = () => {
  const theme = useTheme();
  
  const isDesktop = useMediaQuery(`(min-width:${DESKTOP_BREAKPOINT}px)`, { noSsr: true });
  const isPhone = useMediaQuery('(max-width:599px)', { noSsr: true });
  const isTablet = useMediaQuery(`(min-width:600px) and (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`, { noSsr: true });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchType, setSearchType] = useState("nationalId");
  const [searchText, setSearchText] = useState("");
  const [students, setStudents] = useState([]);
  const [oldStudents, setOldStudents] = useState([]);
  const [showOldGrid, setShowOldGrid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
const fastAddStudentDialogRef = useRef(null);
const fastReceptionDialogsRef = useRef(null);
const [oldStatementOpen, setOldStatementOpen] = useState(false);
const [oldStatementLoading, setOldStatementLoading] = useState(false);
const [oldStatementData, setOldStatementData] = useState(null);
const [oldStatementError, setOldStatementError] = useState("");
  useEffect(() => {
    if (isDesktop) setMobileSidebarOpen(false);
  }, [isDesktop]);


  const [documentHistoryOpen, setDocumentHistoryOpen] = useState(false);
const [documentHistoryRow, setDocumentHistoryRow] = useState(null);

const [registerDocumentOpen, setRegisterDocumentOpen] = useState(false);
const [registerDocumentRow, setRegisterDocumentRow] = useState(null);

  const [actionAnchorEl, setActionAnchorEl] = useState(null);
  const [actionRow, setActionRow] = useState(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [studentDetails, setStudentDetails] = useState(null);

  const [studyFileOpen, setStudyFileOpen] = useState(false);
const [studyFileStudent, setStudyFileStudent] = useState(null);

const [studentOperationsOpen, setStudentOperationsOpen] = useState(false);
const [studentOperationsStudent, setStudentOperationsStudent] = useState(null);
const [discountOrderOpen, setDiscountOrderOpen] = useState(false);
const [discountOrderStudent, setDiscountOrderStudent] = useState(null);
const [changeStudentStatusOpen, setChangeStudentStatusOpen] = useState(false);
const [changeStudentStatusStudent, setChangeStudentStatusStudent] = useState(null);
const [refundRequestOpen, setRefundRequestOpen] = useState(false);
const [refundRequestStudent, setRefundRequestStudent] = useState(null);
const [changePaymentStatusOpen, setChangePaymentStatusOpen] = useState(false);
const [changePaymentStatusStudent, setChangePaymentStatusStudent] = useState(null);
const [studyApprovalOpen, setStudyApprovalOpen] = useState(false);
const [studyApprovalStudent, setStudyApprovalStudent] = useState(null);
const [registrationReturnOpen, setRegistrationReturnOpen] = useState(false);
const [registrationReturnStudent, setRegistrationReturnStudent] = useState(null);
const [invoiceReturnOpen, setInvoiceReturnOpen] = useState(false);
const [invoiceReturnStudent, setInvoiceReturnStudent] = useState(null);
const [actionLoading, setActionLoading] = useState(false);
const [actionLoadingLabel, setActionLoadingLabel] = useState("جاري فتح الشاشة...");
const autoSearchTimerRef = useRef(null);

  useEffect(() => {
    if (isDesktop) {
      setMobileSidebarOpen(false);
    }
  }, [isDesktop]);

  const searchLabel = useMemo(() => {
    if (searchType === "nationalId") return "رقم الهوية";
    if (searchType === "tel") return "رقم الجوال";
    return "اسم الطالب";
  }, [searchType]);

  const buildSearchParams = (customValue = searchText) => {
    const params = new URLSearchParams();
    const value = String(customValue || "").trim();

    if (searchType === "nationalId") params.append("nationalId", value);
    if (searchType === "tel") params.append("studentTel", value);
    if (searchType === "name") params.append("studentName", value);

    return params.toString();
  };

  const handleSearch = async (customValue = null, silent = false) => {
    const value = String(customValue ?? searchText).trim();

    if (!value) {
      if (!silent) {
        showWarning("اكتب قيمة البحث أولاً");
      }
      return;
    }

    try {
      setLoading(true);
      setStudents([]);
      setOldStudents([]);
      setShowOldGrid(false);

      const response = await fetch(
        `${API_BASE_URL}/api/reception-office/students/search?${buildSearchParams(value)}`
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message || result?.error || "فشل تحميل بيانات الطالب");
      }

      const data = Array.isArray(result?.data) ? result.data : [];

      setStudents(
        data.map((item, index) => ({
          ...item,
          id:
            item.id ||
            item.accountGuid ||
            item.studentGuid ||
            item.nationalId ||
            index + 1,
          serial: index + 1
        }))
      );

      if (data.length === 0 && searchType === "nationalId" && value.length === 10) {
        await loadOldStudents(value);
      }
    } catch (error) {
      showError(error.message || "حدث خطأ أثناء البحث");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const loadOldStudents = async (customValue = searchText) => {
    try {
      const params = new URLSearchParams();

      const value = String(customValue || "").trim();

      if (searchType === "nationalId") params.append("nationalId", value);
      if (searchType === "tel") params.append("studentTel", value);
      if (searchType === "name") params.append("studentName", value);

      const response = await fetch(
        `${API_BASE_URL}/api/reception-office/old-students/search?${params.toString()}`
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message || result?.error || "فشل تحميل بيانات الأرشيف");
      }

      const data = Array.isArray(result?.data) ? result.data : [];

      setOldStudents(
        data.map((item, index) => ({
          ...item,
          id:
            item.id ||
            item.oldCustomerNo ||
            item.nationalId ||
            item.studentTel ||
            index + 1,
          serial: index + 1
        }))
      );

      setShowOldGrid(data.length > 0);
    } catch (error) {
      showError(error.message || "حدث خطأ أثناء تحميل بيانات الأرشيف");
      setOldStudents([]);
      setShowOldGrid(false);
    }
  };

  useEffect(() => {
    const value = searchText.trim();

    if (autoSearchTimerRef.current) {
      clearTimeout(autoSearchTimerRef.current);
    }

    if (!value) {
      setStudents([]);
      setOldStudents([]);
      setShowOldGrid(false);
      return;
    }

    const canAutoSearch =
      (searchType === "nationalId" && value.length >= 10) ||
      (searchType === "tel" && value.length >= 5) ||
      (searchType === "name" && value.length >= 2);

    if (!canAutoSearch) {
      return;
    }

    autoSearchTimerRef.current = setTimeout(() => {
      handleSearch(value, true);
    }, 500);

    return () => {
      if (autoSearchTimerRef.current) {
        clearTimeout(autoSearchTimerRef.current);
      }
    };
  }, [searchText, searchType]);

  const handleRefresh = () => {
    setSearchText("");
    setStudents([]);
    setOldStudents([]);
    setShowOldGrid(false);
    setSelectedStudent(null);
    
    
    
    setActionAnchorEl(null);
    setActionRow(null);
    setDetailsOpen(false);
    setStudentDetails(null);
    
    
    fastAddStudentDialogRef.current?.close();
    fastReceptionDialogsRef.current?.closeAll();
    

setStudyFileOpen(false);
setStudyFileStudent(null);
setStudentOperationsOpen(false);
setStudentOperationsStudent(null);
  };

  const handleOpenActionMenu = (event, row) => {
    setActionAnchorEl(event.currentTarget);
    setActionRow(row);

    // Start the two most common permission checks while the user is
    // still looking at the actions menu. The actual handlers still
    // await the same permission result, so no rule is bypassed.
    const userGuid = getUserGuid(getCurrentUser());

    if (userGuid) {
      void checkReceptionPermissionFast({
        apiBaseUrl: API_BASE_URL,
        userGuid,
        formName: "addstudent",
        action: "find"
      }).catch(() => {});

      void checkReceptionPermissionFast({
        apiBaseUrl: API_BASE_URL,
        userGuid,
        formName: "studentstatment",
        action: "find"
      }).catch(() => {});
    }
  };

  const handleCloseActionMenu = () => {
    setActionAnchorEl(null);
    setActionRow(null);
  };

  const runAction = async (
    callback,
    loadingLabel = "جاري فتح الشاشة...",
    showLoader = true
  ) => {
    const row = actionRow;
    if (!row || actionLoading) return;

    try {
      if (showLoader) {
        setActionLoadingLabel(loadingLabel);
        setActionLoading(true);
      }

      // Open isolated dialog first.
      await Promise.resolve(callback(row));

      // Close parent Menu one task later, so its render cannot delay dialog paint.
      window.setTimeout(() => {
        handleCloseActionMenu();
      }, 0);
    } catch (error) {
      handleCloseActionMenu();
      showError(
        error?.message ||
        "حدث خطأ أثناء فتح الشاشة"
      );
    } finally {
      if (showLoader) {
        setActionLoading(false);
      }
    }
  };


const checkAcceptOldStudentPermission = async () => {
  const userGuid = getUserGuid(getCurrentUser());

  if (!userGuid) {
    throw new Error(
      "تعذر قراءة بيانات المستخدم، برجاء تسجيل الدخول مرة أخرى"
    );
  }

  const params = new URLSearchParams({ userGuid });

  const response = await fetch(
    `${API_BASE_URL}/api/reception-office/permissions/accept-old-student?${params.toString()}`,
    { cache: "no-store" }
  );

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      result?.message ||
      result?.error ||
      "تعذر فحص صلاحية قبول الطالب من الأرشيف"
    );
  }

  return {
    allowed: Boolean(result?.allowed),
    message:
      result?.message ||
      "لا تملك صلاحية قبول طالب من الأرشيف برجاء التواصل مع الإدارة"
  };
};

const loadOldStatementData = async (row, purpose = "view") => {
  const oldCustomerNo = String(row?.oldCustomerNo || "").trim();
  const branchCode = Number(row?.branchCode || 0);
  const userGuid = getUserGuid(getCurrentUser());

  if (!oldCustomerNo || !branchCode) {
    throw new Error("تعذر قراءة رقم العميل أو كود الفرع القديم");
  }

  if (!userGuid) {
    throw new Error("تعذر قراءة بيانات المستخدم، برجاء تسجيل الدخول مرة أخرى");
  }

  const params = new URLSearchParams({
    oldCustomerNo,
    branchCode: String(branchCode),
    studentName: row?.studentName || "",
    userGuid,
    purpose
  });

  const response = await fetch(
    `${API_BASE_URL}/api/reception-office/old-students/statement?${params.toString()}`,
    { cache: "no-store" }
  );

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      result?.message ||
      result?.error ||
      "تعذر تحميل كشف الحساب القديم"
    );
  }

  return result?.data || null;
};

const handleOldStatement = async (row) => {
  setOldStatementOpen(true);
  setOldStatementLoading(true);
  setOldStatementData(null);
  setOldStatementError("");

  try {
    setOldStatementData(await loadOldStatementData(row, "view"));
  } catch (error) {
    setOldStatementError(error?.message || "حدث خطأ أثناء تحميل كشف الحساب القديم");
  } finally {
    setOldStatementLoading(false);
  }
};

const handleAcceptOldStudent = async (row) => {
  // إظهار اللودر فقط أثناء الطلب الفعلي،
  // وإغلاقه فوراً قبل أي رسالة تنبيه أو خطأ.
  setActionLoadingLabel("جاري فحص صلاحية قبول الطالب القديم...");
  setActionLoading(true);

  try {
    // قبول طالب قديم له صلاحية مستقلة ACCEPTOLDSTUDENT.
    const permission = await checkAcceptOldStudentPermission();

    if (!permission.allowed) {
      // مهم: نقفل اللودر قبل فتح SweetAlert
      // حتى لا يظل الـ Backdrop ظاهراً خلف رسالة عدم الصلاحية.
      setActionLoading(false);

      await showWarning(permission.message);
      return;
    }

    setActionLoadingLabel("جاري تجهيز بيانات الطالب القديم...");

    const statement = await loadOldStatementData(row, "accept");

    const archiveData = {
      fromArchive: true,
      studentName: row?.studentName || "",
      studentTel: row?.studentTel || row?.tel || "",
      nationalId: row?.nationalId || "",
      oldCustomerNo: row?.oldCustomerNo || "",
      branchCode: row?.branchCode || "",
      maden: Number(statement?.summary?.debit || 0),
      daen: Number(statement?.summary?.credit || 0),
      notes: [
        row?.notes || "",
        `منقول من الأرشيف القديم - رقم العميل ${row?.oldCustomerNo || "-"} - كود الفرع ${row?.branchCode || "-"}`
      ].filter(Boolean).join(" | ")
    };

    setActionLoading(false);
    fastAddStudentDialogRef.current?.openArchive(
      archiveData
    );
  } catch (error) {
    // نقفل اللودر قبل رسالة الخطأ مباشرة.
    setActionLoading(false);

    await showError(
      error?.message ||
      "حدث خطأ أثناء تجهيز قبول الطالب القديم"
    );
  }
};

const handleStudentCreated = useCallback((student) => {
  if (student?.nationalId) {
    setSearchType("nationalId");
    setSearchText(student.nationalId);
  }

  if (student) {
    setStudents([
      {
        ...student,
        id:
          student.accountGuid ||
          student.studentGuid ||
          student.nationalId,
        serial: 1,
        code: student.studentCode,
        studentCode: student.studentCode
      }
    ]);

    setShowOldGrid(false);
    setOldStudents([]);
  }
}, []);

const handleNewStudent = () => {
  const userGuid = getUserGuid(getCurrentUser());

  if (!userGuid) {
    showWarning(
      "تعذر قراءة بيانات المستخدم، برجاء تسجيل الدخول مرة أخرى"
    );
    return;
  }

  // فتح مباشر داخل Host صغير بدون إعادة Render للشاشة الكبيرة.
  fastAddStudentDialogRef.current?.openNew();
};

const ensureStudentActive = (row) => {
  /*
    نفس منطق الديسكتوب:
    - فحص الإيقاف الحقيقي يكون من IsUse فقط.
    - studentType = نوع الطالب (ذكر / أنثى) وليس له أي علاقة بالإيقاف.
    - لا نعتمد هنا على isStudentActive لأن الإصدارات القديمة من الباكيند كانت ترجعه من studentType بالخطأ.
    - لا نعتمد على statusName / staut / staut_ لأنها حالة دراسة مثل "مستمر" وليست إيقاف تعامل.
  */

  const profileLocked = normalizeBool(
    row?.lockProfile ??
      row?.LockProfile ??
      row?.isProfileLocked ??
      row?.IsProfileLocked ??
      false,
    false
  );

  if (profileLocked) {
    showWarning("ملف الطالب مغلق برجاء التواصل مع الإدارة");
    return false;
  }

  const activeValue =
    row?.studentIsUse ??
    row?.StudentIsUse ??
    row?.isUse ??
    row?.IsUse ??
    true;

  const studentActive = normalizeBool(activeValue, true);

  if (!studentActive) {
    showWarning("الطالب موقوف عن التعامل");
    return false;
  }

  return true;
};

  const ensureStudentCanPay = (row) => {
    const canPay = normalizeBool(row?.levelStatus ?? row?.canPay ?? true);

    if (!canPay) {
      showWarning("الطالب أنهى الدراسة في هذا الملف التدريبي ولذلك لن تتمكن من إجراء أي عملية سداد لهذا الملف");
      return false;
    }

    return true;
  };

  const ensureHasStudyFile = (row) => {
    const diplomGuid = row?.diplomGuid || row?.DiplomGuid || "";

    if (!diplomGuid || diplomGuid === "00000000-0000-0000-0000-000000000000") {
      showWarning("لا تتوفر بيانات تدريبية / استمارة تسجيل لهذا الطالب");
      return false;
    }

    return true;
  };

  const handleInvoiceReturn = async (row) => {
    setSelectedStudent(row);

    if (!ensureStudentActive(row)) return;

    const accountGuid =
      row?.accountGuid ||
      row?.AccountGuid ||
      "";

    if (
      !accountGuid ||
      accountGuid === "00000000-0000-0000-0000-000000000000"
    ) {
      showWarning("لا يمكن قراءة حساب الطالب");
      return;
    }

    const userGuid = getUserGuid(getCurrentUser());

    if (!userGuid) {
      showWarning(
        "تعذر قراءة بيانات المستخدم، برجاء تسجيل الدخول مرة أخرى"
      );
      return;
    }

    try {
      const params = new URLSearchParams({
        userGuid,
        formName: "repay",
        action: "find"
      });

      const permissionResponse = await fetch(
        `${API_BASE_URL}/api/reception-office/permissions/check?${params.toString()}`
      );

      const permissionResult =
        await permissionResponse.json().catch(() => null);

      if (!permissionResponse.ok) {
        throw new Error(
          permissionResult?.error ||
          permissionResult?.message ||
          "تعذر فحص صلاحية مرتجع الفاتورة"
        );
      }

      if (!permissionResult?.allowed) {
        showWarning(
          permissionResult?.message ||
          "لا تملك صلاحية استعراض مرتجع الفاتورة"
        );
        return;
      }

      const invoiceParams = new URLSearchParams({
        accountGuid,
        userGuid
      });

      const invoiceResponse = await fetch(
        `${API_BASE_URL}/api/invoice-returns/invoices?${invoiceParams.toString()}`
      );

      const invoiceResult =
        await invoiceResponse.json().catch(() => null);

      if (!invoiceResponse.ok) {
        throw new Error(
          invoiceResult?.error ||
          invoiceResult?.message ||
          "تعذر فحص فواتير الطالب"
        );
      }

      const availableInvoices = Array.isArray(invoiceResult?.data)
        ? invoiceResult.data.filter((item) => !item.isReturned)
        : [];

      if (availableInvoices.length === 0) {
        showWarning(
          "لا تتوفر أي فواتير خاصة بالطالب لعمل مرتجع"
        );
        return;
      }

      setInvoiceReturnStudent(row);
      setInvoiceReturnOpen(true);
    } catch (error) {
      showError(
        error.message ||
        "حدث خطأ أثناء فتح مرتجع الفاتورة"
      );
    }
  };

  const handleViewStudentDetails = async (row) => {
    const userGuid = getUserGuid(getCurrentUser());

    if (!userGuid) {
      showWarning(
        "تعذر قراءة بيانات المستخدم، برجاء تسجيل الدخول مرة أخرى"
      );
      return;
    }

    try {
      const result = await checkReceptionPermissionFast({
        apiBaseUrl: API_BASE_URL,
        userGuid,
        formName: "addstudent",
        action: "find"
      });

      if (!result?.allowed) {
        showWarning(
          result?.message ||
          "لا تملك صلاحية استعراض بيانات الطالب"
        );
        return;
      }

      fastReceptionDialogsRef.current?.openEdit(row);
    } catch (error) {
      showError(
        error.message ||
        "حدث خطأ أثناء فحص صلاحية بيانات الطالب"
      );
    }
  };

const handleAdmissionOrder = (row) => {
  const profileLocked = normalizeBool(
    row?.lockProfile ??
    row?.isProfileLocked ??
    false
  );

  if (profileLocked) {
    showWarning(
      "ملف الطالب مغلق برجاء التواصل مع الإدارة"
    );
    return;
  }

  fastReceptionDialogsRef.current?.openAdmission(row);
};

const handleFeesForm = (row) => {
  if (!ensureStudentActive(row)) return;
  if (!ensureStudentCanPay(row)) return;

  const accountGuid =
    row?.accountGuid ||
    row?.AccountGuid ||
    row?.studentGuid ||
    row?.StudentGuid ||
    "";

  if (!accountGuid) {
    showWarning("لا يمكن قراءة حساب الطالب");
    return;
  }

  fastReceptionDialogsRef.current?.openFees(row);
};

  const handlePaymentOrder = (row) => {
    if (!ensureStudentActive(row)) return;
    if (!ensureStudentCanPay(row)) return;
    if (!ensureHasStudyFile(row)) return;

    const branchGuid =
      row?.branchGuid ||
      row?.studyBranchGuid ||
      row?.BranchGuid ||
      "";

    if (!branchGuid) {
      showWarning(
        "لا يمكن قراءة فرع الدراسة للطالب"
      );
      return;
    }

    fastReceptionDialogsRef.current?.openPayment(row);
  };


const handleStudyFile = (row) => {
  setSelectedStudent(row);

  if (!ensureStudentActive(row)) return;
  if (!ensureHasStudyFile(row)) return;

  setStudyFileStudent(row);
  setStudyFileOpen(true);
};

  const handleHistory = (row) => {
    setSelectedStudent(row);

    const actionGuid =
      row?.actionHistoryGuid ||
      row?.ActionHistoryGuid ||
      row?.raw?.__index_10 ||
      row?.accountGuid ||
      "";

    if (!actionGuid) {
      showWarning("لا يمكن قراءة معرف سجل عمليات الطالب");
      return;
    }

    setStudentOperationsStudent({
      ...row,
      actionHistoryGuid: actionGuid
    });

    setStudentOperationsOpen(true);
  };

const handleStatement = async (row) => {
  const accountGuid =
    row?.accountGuid ||
    row?.AccountGuid ||
    "";

  if (!accountGuid) {
    showWarning("لا يمكن قراءة حساب الطالب");
    return;
  }

  const profileLocked = normalizeBool(
    row?.lockProfile ??
    row?.LockProfile ??
    row?.isProfileLocked ??
    row?.IsProfileLocked ??
    false,
    false
  );

  if (profileLocked) {
    showWarning(
      "ملف الطالب مغلق برجاء التواصل مع الإدارة"
    );
    return;
  }

  const userGuid = getUserGuid(getCurrentUser());

  if (!userGuid) {
    showWarning(
      "تعذر قراءة بيانات المستخدم، برجاء تسجيل الدخول مرة أخرى"
    );
    return;
  }

  try {
    const result = await checkReceptionPermissionFast({
      apiBaseUrl: API_BASE_URL,
      userGuid,
      formName: "studentstatment",
      action: "find"
    });

    if (!result?.allowed) {
      showWarning(
        result?.message ||
        "لا تملك صلاحية استعراض كشف الحساب"
      );
      return;
    }

    fastReceptionDialogsRef.current?.openStatement(row);
  } catch (error) {
    showError(
      error.message ||
      "حدث خطأ أثناء فحص صلاحية كشف الحساب"
    );
  }
};


const handleOpenStatementDocument = async (row) => {
  const formName = String(row?.formName || "")
    .trim()
    .toLowerCase();

  if (!formName) {
    showWarning("لا يمكن تحديد نوع المستند");
    return;
  }

  if (formName !== "addregdoc") {
    showWarning("عرض المستند متاح حاليًا لاستمارات التسجيل فقط");
    return;
  }

  const docGuid =
    row?.actionGuid ||
    row?.ActionGuid ||
    "";

  if (
    !docGuid ||
    docGuid === "00000000-0000-0000-0000-000000000000"
  ) {
    showWarning("لا يمكن قراءة معرف استمارة التسجيل");
    return;
  }

  try {
    const params = new URLSearchParams({
      docGuid
    });

    const response = await fetch(
      `${API_BASE_URL}/api/reception-office/student-statement/register-order/check?${params.toString()}`
    );

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        result?.message ||
        result?.error ||
        "تعذر فحص استمارة التسجيل"
      );
    }

    setRegisterDocumentRow({
      ...row,
      hasOrder: Boolean(result?.hasOrder)
    });

    setRegisterDocumentOpen(true);
  } catch (error) {
    showError(
      error.message ||
      "حدث خطأ أثناء فتح استمارة التسجيل"
    );
  }
};

const handleOpenStatementHistory = (row) => {
  const actionGuid =
    row?.actionGuid ||
    row?.ActionGuid ||
    "";

  if (
    !actionGuid ||
    actionGuid === "00000000-0000-0000-0000-000000000000"
  ) {
    showWarning("لا يمكن قراءة معرف المستند");
    return;
  }

  setDocumentHistoryRow(row);
  setDocumentHistoryOpen(true);
};

const handleOpenStatementSalesInvoice = (row) => {
  showInfo("فاتورة مبيعات", `سيتم فتح فاتورة المبيعات رقم ${row?.invoiceNo || ""}`);
};

const handleOpenStatementSalesReturn = (row) => {
  showInfo("مرتجع مبيعات", `سيتم فتح مرتجع المبيعات رقم ${row?.returnNo || ""}`);
};

  const handleDiscountOrder = (row) => {
    setSelectedStudent(row);

    if (!ensureStudentActive(row)) return;

    const accountGuid = row?.accountGuid || row?.AccountGuid || "";

    if (!accountGuid || accountGuid === "00000000-0000-0000-0000-000000000000") {
      showWarning("لا يمكن إنشاء طلب خصم لعدم توفر رقم حساب الطالب");
      return;
    }

    setDiscountOrderStudent(row);
    setDiscountOrderOpen(true);
  };

  const handleChangeStudentStatus = async (row) => {
    setSelectedStudent(row);

    const accountGuid =
      row?.accountGuid ||
      row?.AccountGuid ||
      "";

    const levelGuid =
      row?.levelGuid ||
      row?.LevelGuid ||
      "";

    if (
      !accountGuid ||
      accountGuid === "00000000-0000-0000-0000-000000000000"
    ) {
      showWarning("لا يمكن قراءة حساب الطالب");
      return;
    }

    if (
      !levelGuid ||
      levelGuid === "00000000-0000-0000-0000-000000000000"
    ) {
      showWarning("برجاء قبول الطالب أولاً من قبل المشرف");
      return;
    }

    const userGuid = getUserGuid(getCurrentUser());

    if (!userGuid) {
      showWarning(
        "تعذر قراءة بيانات المستخدم، برجاء تسجيل الدخول مرة أخرى"
      );
      return;
    }

    try {
      const params = new URLSearchParams({
        userGuid,
        formName: "addstudent",
        action: "update"
      });

      const response = await fetch(
        `${API_BASE_URL}/api/reception-office/permissions/check?${params.toString()}`
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
          result?.message ||
          "تعذر فحص صلاحية تغيير حالة الطالب"
        );
      }

      if (!result?.allowed) {
        showWarning(
          result?.message ||
          "لا تملك صلاحية تعديل حالة الطالب"
        );
        return;
      }

      setChangeStudentStatusStudent(row);
      setChangeStudentStatusOpen(true);
    } catch (error) {
      showError(
        error.message ||
        "حدث خطأ أثناء فحص صلاحية تغيير حالة الطالب"
      );
    }
  };

const handleAcceptOrder = (row) => {
  setSelectedStudent(row);

  if (!ensureStudentActive(row)) return;

  const accountGuid =
    row?.accountGuid ||
    row?.AccountGuid ||
    "";

  if (
    !accountGuid ||
    accountGuid === "00000000-0000-0000-0000-000000000000"
  ) {
    showWarning("لا يمكن قراءة حساب الطالب");
    return;
  }

  setStudyApprovalStudent(row);
  setStudyApprovalOpen(true);
};

  const handleReRegister = async (row) => {
    setSelectedStudent(row);

    if (!ensureStudentActive(row)) return;

    const regDocGuid =
      row?.regDocGuid ||
      row?.RegDocGuid ||
      "";

    if (
      !regDocGuid ||
      regDocGuid === "00000000-0000-0000-0000-000000000000"
    ) {
      showWarning("لا تتوفر استمارة للطالب لعمل مرتجع");
      return;
    }

    const userGuid = getUserGuid(getCurrentUser());

    if (!userGuid) {
      showWarning("تعذر قراءة بيانات المستخدم، برجاء تسجيل الدخول مرة أخرى");
      return;
    }

    try {
      const params = new URLSearchParams({
        userGuid,
        formName: "reregister",
        action: "find"
      });

      const permissionResponse = await fetch(
        `${API_BASE_URL}/api/reception-office/permissions/check?${params.toString()}`
      );

      const permissionResult =
        await permissionResponse.json().catch(() => null);

      if (!permissionResponse.ok) {
        throw new Error(
          permissionResult?.error ||
          permissionResult?.message ||
          "تعذر فحص صلاحية مرتجع الاستمارة"
        );
      }

      if (!permissionResult?.allowed) {
        showWarning(
          permissionResult?.message ||
          "لا تملك صلاحية استعراض مرتجع الاستمارة"
        );
        return;
      }

      setRegistrationReturnStudent(row);
      setRegistrationReturnOpen(true);
    } catch (error) {
      showError(
        error.message ||
        "حدث خطأ أثناء فحص صلاحية مرتجع الاستمارة"
      );
    }
  };

  const handleRePay = (row) => {
    setSelectedStudent(row);

    if (!ensureStudentActive(row)) return;

    showInfo("مرتجع سند", "سيتم فتح قائمة فواتير الطالب لعمل مرتجع في الخطوة القادمة");
  };

  const handleRefundRequest = (row) => {
    setSelectedStudent(row);

    if (!ensureStudentActive(row)) return;

    const accountGuid =
      row?.accountGuid ||
      row?.AccountGuid ||
      "";

    const levelGuid =
      row?.levelGuid ||
      row?.LevelGuid ||
      "";

    if (
      !accountGuid ||
      accountGuid === "00000000-0000-0000-0000-000000000000"
    ) {
      showWarning("لا يمكن قراءة حساب الطالب");
      return;
    }

    if (
      !levelGuid ||
      levelGuid === "00000000-0000-0000-0000-000000000000"
    ) {
      showWarning(
        "برجاء قبول المتدرب أولاً من قبل المشرف"
      );
      return;
    }

    setRefundRequestStudent(row);
    setRefundRequestOpen(true);
  };

  const handleChangePayStatus = (row) => {
    setSelectedStudent(row);

    const levelGuid = row?.levelGuid || row?.LevelGuid || "";

    if (!levelGuid || levelGuid === "00000000-0000-0000-0000-000000000000") {
      showWarning("برجاء قبول المتدرب أولاً من قبل المشرف");
      return;
    }

    setChangePaymentStatusStudent(row);
    setChangePaymentStatusOpen(true);
  };

  const handleToggleProfileLock = async (row, lockProfile) => {
    const accountGuid =
      row?.accountGuid ||
      row?.AccountGuid ||
      "";

    if (
      !accountGuid ||
      accountGuid === "00000000-0000-0000-0000-000000000000"
    ) {
      showWarning("لا يمكن قراءة حساب الطالب");
      return;
    }

    const currentLock = normalizeBool(
      row?.lockProfile ??
        row?.LockProfile ??
        row?.isProfileLocked ??
        row?.IsProfileLocked ??
        false,
      false
    );

    if (lockProfile && currentLock) {
      showWarning("ملف الطالب مغلق بالفعل");
      return;
    }

    if (!lockProfile && !currentLock) {
      showWarning("ملف الطالب مفتوح بالفعل");
      return;
    }

    const userGuid = getUserGuid(getCurrentUser());

    if (!userGuid) {
      showWarning(
        "تعذر قراءة بيانات المستخدم، برجاء تسجيل الدخول مرة أخرى"
      );
      return;
    }

    const confirmResult = await Swal.fire({
      icon: "question",
      title: lockProfile
        ? "إغلاق ملف الطالب"
        : "إعادة فتح ملف الطالب",
      html: `
        <div style="font-weight:800;line-height:1.9">
          <div>${row?.studentName || ""}</div>
          <div>${row?.nationalId || ""}</div>
          <div style="margin-top:8px">
            ${
              lockProfile
                ? "بعد الإغلاق لن يمكن تنفيذ العمليات على هذا الملف حتى تتم إعادة فتحه."
                : "سيتم السماح بتنفيذ العمليات على ملف الطالب مرة أخرى."
            }
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: lockProfile
        ? "نعم، إغلاق الملف"
        : "نعم، إعادة الفتح",
      cancelButtonText: "تراجع",
      confirmButtonColor: lockProfile
        ? accentColor
        : primaryColor,
      cancelButtonColor: "#777",
      reverseButtons: true
    });

    if (!confirmResult.isConfirmed) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/student-profile/change`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            accountGuid,
            lockProfile,
            userGuid
          })
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            "تعذر تعديل حالة ملف الطالب"
        );
      }

      await showSuccess(
        result?.message ||
          (lockProfile
            ? "تم إغلاق ملف الطالب بنجاح"
            : "تم إعادة فتح ملف الطالب بنجاح")
      );

      handleSearch(searchText, true);
    } catch (error) {
      showError(
        error.message ||
          "حدث خطأ أثناء تعديل حالة ملف الطالب"
      );
    }
  };

  const getStudentStatusChip = (row) => {
    // حالة الدراسة في الديسكتوب جاية من StautName / dr(5)،
    // وليست من إيقاف الطالب أو قفل الملف. الإيقاف والقفل للـ validations فقط.
    const statusText =
      row?.statusName ||
      row?.stautName ||
      row?.studyStatusName ||
      row?.caseName ||
      "-";

    const text = String(statusText).trim() || "-";

    let color = "#2e7d32";
    let backgroundColor = "#e8f5e9";
    let darkColor = "#67c99d";
    let darkBackgroundColor = "rgba(103,201,157,.14)";

    if (
      text.includes("منتهي") ||
      text.includes("منتهى") ||
      text.includes("انهى") ||
      text.includes("أنهى") ||
      text.includes("انته")
    ) {
      color = "#ef6c00";
      backgroundColor = "#fff3e0";
      darkColor = "#f0ad4e";
      darkBackgroundColor = "rgba(237,137,54,.14)";
    }

    if (
      text.includes("موقوف") ||
      text.includes("موقوفة") ||
      text.includes("إيقاف") ||
      text.includes("ايقاف")
    ) {
      color = "#c62828";
      backgroundColor = "#ffebee";
      darkColor = "#e57373";
      darkBackgroundColor = "rgba(229,90,90,.14)";
    }

    return (
      <Chip
        label={text}
        size="small"
        sx={(theme) => ({
          fontWeight: 900,
          color: theme.palette.mode === "dark" ? darkColor : color,
          backgroundColor: theme.palette.mode === "dark" ? darkBackgroundColor : backgroundColor,
          borderRadius: 2
        })}
      />
    );
  };

  const getCompactStudentName = (fullName) => {
    const parts = String(fullName || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (parts.length <= 2) return parts.join(" ");
    return `${parts[0]} ${parts[parts.length - 1]}`;
  };

  const studentColumns = useMemo(
    () => [
      {
        field: "studentName",
        headerName: "اسم الطالب",
        flex: 1.45,
        minWidth: 150,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => <EllipsisCell value={params.value} />
      },
      {
        field: "studentTel",
        headerName: "رقم الجوال",
        flex: 0.75,
        minWidth: 95,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => (
          <Typography sx={{ fontWeight: 600, fontSize: designTokens.typography.table }}>
            {params.value || params.row?.tel || "-"}
          </Typography>
        )
      },
      {
        field: "nationalId",
        headerName: "رقم الهوية",
        flex: 0.75,
        minWidth: 95,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => (
          <Typography sx={{ fontWeight: 600, fontSize: designTokens.typography.table }}>
            {params.value || "-"}
          </Typography>
        )
      },
      {
        field: "registrationTypeText",
        headerName: "نوع الدراسة",
        flex: 0.7,
        minWidth: 95,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => (
          <Typography sx={{ fontWeight: 600, fontSize: designTokens.typography.table }}>
            {params.row?.registrationTypeText || params.row?.regTypeText || params.row?.typeRegText || "-"}
          </Typography>
        )
      },
      {
        field: "statusName",
        headerName: "حالة الدراسة",
        flex: 0.7,
        minWidth: 95,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => getStudentStatusChip(params.row)
      },
      {
        field: "branchName",
        headerName: "فرع الدراسة",
        flex: 1,
        minWidth: 150,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => (
          <EllipsisCell
            value={
              params.row?.branchName ||
              params.row?.studyBranchName ||
              params.row?.regBranchName ||
              "-"
            }
          />
        )
      },
      {
        field: "diplomName",
        headerName: "الدبلوم/الدورة",
        flex: 1.1,
        minWidth: 160,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => <EllipsisCell value={params.row?.diplomName || "-"} />
      },
      {
        field: "actions",
        headerName: "الإجراءات",
        width: 180,
        minWidth: 180,
        maxWidth: 180,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => (
          <Button
            variant="contained"
            endIcon={<MoreVertIcon />}
            onClick={(event) => handleOpenActionMenu(event, params.row)}
            sx={uiLayout.withUiSx({
              minWidth: 0,
              width: "100%",
              flexShrink: 0,
              flexGrow: 0,
              height: 32,
              px: 1.25,
              justifyContent: "center",
              borderRadius: `${designTokens.radius}px`,
              fontWeight: 600,
              fontSize: designTokens.typography.table,
              whiteSpace: "nowrap",
              background: `linear-gradient(135deg, ${primaryColor}, ${primaryDark})`,
              boxShadow: "0 6px 16px rgba(5,117,70,0.22)",
              "&:hover": {
                background: `linear-gradient(135deg, ${primaryDark}, ${primaryColor})`,
                boxShadow: "0 8px 20px rgba(5,117,70,0.28)"
              },
              "& .MuiButton-endIcon": { ml: 0, mr: 0.75, flexShrink: 0 }
            }, uiLayout.buttonSx)}
          >
            الإجراءات
          </Button>
        )
      }    ],
    []
  );

  const oldStudentColumns = useMemo(
    () => [
      {
        field: "studentName",
        headerName: "اسم الطالب",
        flex: 1.4,
        minWidth: 150,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => <EllipsisCell value={params.value} />
      },
      {
        field: "studentTel",
        headerName: "رقم الجوال",
        flex: 0.8,
        minWidth: 100,
        align: "center",
        headerAlign: "center"
      },
      {
        field: "nationalId",
        headerName: "رقم الهوية",
        flex: 0.8,
        minWidth: 100,
        align: "center",
        headerAlign: "center"
      },
      {
        field: "notes",
        headerName: "ملاحظات",
        flex: 1.3,
        minWidth: 150,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => <EllipsisCell value={params.value} />
      },
      {
        field: "branchCode",
        headerName: "كود الفرع",
        flex: 0.6,
        minWidth: 80,
        align: "center",
        headerAlign: "center"
      },
      {
        field: "oldCustomerNo",
        headerName: "رقم العميل القديم",
        flex: 0.8,
        minWidth: 110,
        align: "center",
        headerAlign: "center"
      },
      {
        field: "oldActions",
        headerName: "العمليات",
        width: 180,
        minWidth: 180,
        maxWidth: 180,
        align: "center",
        headerAlign: "center",
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params) => (
          <Stack direction="row" spacing={0.6} justifyContent="center" sx={{ width: "100%" }}>
            <ActionButton
              title="قبول طالب من الأرشيف"
              icon={<PersonAddAlt1Icon />}
              color="#2e7d32"
              bg="#e8f5e9"
              onClick={() => handleAcceptOldStudent(params.row)}
            />

            <ActionButton
              title="كشف حساب قديم"
              icon={<VisibilityIcon />}
              color="#1565c0"
              bg="#e3f2fd"
              onClick={() => handleOldStatement(params.row)}
            />
          </Stack>
        )
      }
    ],
    []
  );

  // أعمدة مختصرة للموبايل والتابلت:
  // الاسم الأول + الأخير، الهوية، الدبلوم/الدورة، وإجراء واحد صغير.
  const compactStudentColumns = [
    {
      field: "studentName",
      headerName: "الطالب",
      flex: 1,
      minWidth: isPhone ? 92 : 140,
      align: "center",
      headerAlign: "center",
      sortable: true,
      renderCell: (params) => (
        <Tooltip title={params.value || ""} arrow>
          <Typography
            sx={{
              width: "100%",
              fontWeight: 600,
              fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : "0.75rem",
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              textAlign: "center",
              color: textColor
            }}
          >
            {getCompactStudentName(params.value) || "-"}
          </Typography>
        </Tooltip>
      )
    },
    {
      field: "nationalId",
      headerName: "الهوية",
      width: isPhone ? 82 : 110,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Typography
          sx={{
            fontWeight: 900,
            fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : "0.75rem",
            whiteSpace: "nowrap"
          }}
        >
          {params.value || "-"}
        </Typography>
      )
    },
    {
      field: "diplomName",
      headerName: "الدبلوم",
      flex: 1,
      minWidth: isPhone ? 94 : 145,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Tooltip title={params.row?.diplomName || ""} arrow>
          <Typography
            sx={{
              width: "100%",
              fontWeight: 900,
              fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : "0.75rem",
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              textAlign: "center"
            }}
          >
            {params.row?.diplomName || "-"}
          </Typography>
        </Tooltip>
      )
    },
    {
      field: "actions",
      headerName: "",
      width: isPhone ? 42 : 48,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <IconButton
          size="small"
          onClick={(event) => handleOpenActionMenu(event, params.row)}
          aria-label="إجراءات الطالب"
          sx={{
            width: isPhone ? 26 : 30,
            height: isPhone ? 26 : 30,
            color: whiteColor,
            background: `linear-gradient(135deg, ${primaryColor}, ${primaryDark})`,
            "&:hover": {
              background: `linear-gradient(135deg, ${primaryDark}, ${primaryColor})`
            }
          }}
        >
          <MoreVertIcon sx={{ fontSize: isPhone ? 15 : 17 }} />
        </IconButton>
      )
    }
  ];

  const compactOldStudentColumns = [
    {
      field: "studentName",
      headerName: "الطالب",
      flex: 1,
      minWidth: isPhone ? 100 : 150,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Typography
          title={params.value || ""}
          sx={{
            width: "100%",
            fontWeight: 900,
            fontSize: isPhone ? "0.75rem" : "0.75rem",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            textAlign: "center"
          }}
        >
          {getCompactStudentName(params.value) || "-"}
        </Typography>
      )
    },
    {
      field: "nationalId",
      headerName: "الهوية",
      width: isPhone ? 84 : 112,
      align: "center",
      headerAlign: "center"
    },
    {
      field: "oldActions",
      headerName: "",
      width: isPhone ? 64 : 82,
      align: "center",
      headerAlign: "center",
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.25} justifyContent="center">
          <ActionButton
            title="قبول طالب من الأرشيف"
            icon={<PersonAddAlt1Icon />}
            color="#2e7d32"
            bg="#e8f5e9"
            onClick={() => handleAcceptOldStudent(params.row)}
          />
          <ActionButton
            title="كشف حساب قديم"
            icon={<VisibilityIcon />}
            color="#1565c0"
            bg="#e3f2fd"
            onClick={() => handleOldStatement(params.row)}
          />
        </Stack>
      )
    }
  ];

  return (
    <NavigationShell variant="standard" mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)}><GlobalStyles styles={DARK_ACTION_GLOBAL_STYLES} /><Box
      sx={(theme) => ({
        background: theme.palette.mode === "dark" ? theme.palette.background.default : `
          radial-gradient(circle at 18% 8%, rgba(174,30,33,0.075) 0%, transparent 24%),
          radial-gradient(circle at 82% 6%, rgba(5,117,70,0.13) 0%, transparent 28%),
          linear-gradient(180deg, ${softBg} 0%, #f4fbf7 100%)
        `,
        minHeight: "100dvh",
        fontFamily: "Cairo, Arial, sans-serif",
        direction: "rtl",
        textAlign: "start",
        overflowX: "hidden",
        '& .MuiTypography-h3': { fontSize: isDesktop ? undefined : { xs: '0.86rem', sm: '1rem', md: '1.15rem' } },
        '& .MuiTypography-h4': { fontSize: isDesktop ? undefined : { xs: '0.78rem', sm: '0.9rem', md: '1.05rem' } },
        '& .MuiTypography-h5': { fontSize: isDesktop ? undefined : { xs: "0.75rem", sm: '0.8rem', md: '0.94rem' } },
        '& .MuiTypography-h6': { fontSize: isDesktop ? undefined : { xs: "0.75rem", sm: "0.75rem", md: '0.8rem' } },
        '& .MuiTypography-body1': { fontSize: isDesktop ? undefined : { xs: "0.75rem", sm: "0.75rem", md: "0.75rem" } },
        '& .MuiTypography-body2': { fontSize: isDesktop ? undefined : { xs: "0.75rem", sm: "0.75rem", md: "0.75rem" } },
        '& .MuiButton-root': { fontSize: isDesktop ? undefined : { xs: "0.75rem", sm: "0.75rem", md: "0.75rem" } },
        '& .MuiChip-root': { fontSize: isDesktop ? undefined : { xs: "0.75rem", sm: "0.75rem", md: "0.75rem" } }
      })}
    >
      {!isDesktop && (
        <AppBar
          position="fixed"
          elevation={0}
          sx={(theme) => {
            const isDark = theme.palette.mode === "dark";
            return {
              top: 0,
              left: 0,
              right: 0,
              zIndex: 1401,
              background: isDark ? theme.palette.surfaces.card : "rgba(255,255,255,0.96)",
              backdropFilter: "blur(14px)",
              color: isDark ? theme.palette.text.primary : "#17372b",
              borderBottom: isDark ? "1px solid #67C99D" : "1px solid rgba(5,117,70,0.12)"
            };
          }}
        >
          <Toolbar
            sx={{
              minHeight: {
                xs: "var(--app-header-height, 56px)",
                sm: "var(--app-header-height, 56px)",
                md: "var(--app-header-height, 56px)"
              },
              px: { xs: 0.8, sm: 1.2, md: 1.6 },
              gap: 0.8,
              direction: "rtl"
            }}
          >
            <IconButton
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setMobileSidebarOpen((current) => !current);
              }}
              aria-label={mobileSidebarOpen ? "إغلاق القائمة" : "فتح القائمة"}
              aria-expanded={mobileSidebarOpen}
              sx={{
                width: { xs: 36, sm: 40, md: 42 },
                height: { xs: 36, sm: 40, md: 42 },
                flexShrink: 0,
                color: "#fff",
                background: "linear-gradient(135deg, #057546, #034d31)",
                boxShadow: "0 6px 16px rgba(5,117,70,0.22)",
                "&:hover": {
                  background: "linear-gradient(135deg, #034d31, #057546)"
                }
              }}
            >
              <MenuRoundedIcon sx={{ fontSize: { xs: 20, sm: 22, md: 23 } }} />
            </IconButton>

            <Typography
              sx={{
                flex: 1,
                fontWeight: 900,
                fontSize: { xs: "0.75rem", sm: "0.8rem", md: "0.88rem" },
                color: "#17372b",
                whiteSpace: "nowrap",
                overflow: "hidden",
                minWidth: 0,
                textOverflow: "ellipsis"
              }}
            >
              مكتب الاستقبال
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      
      {/* <ReceptionCelebration
        title="مكتب الاستقبال"
        // subtitle="تجربة استقبال أسرع، بحث فوري، وإجراءات مرتبة باحتراف"
        duration={5200}
      /> */}

      <PageContainer
        sx={{
          maxWidth: "100%",
          
          mt: isDesktop ? 0 : {
            xs: "var(--app-header-height, 56px)",
            sm: "var(--app-header-height, 56px)",
            md: "var(--app-header-height, 56px)"
          },
          boxSizing: "border-box",
          overflowX: "hidden",
          minWidth: 0,
          ...navigationContentSx
        }}
      >
        <Box sx={{ width: "100%", maxWidth: "100%", mx: "auto", minWidth: 0 }}>
        <Paper
          elevation={0}
          sx={(theme) => {
            const isDark = theme.palette.mode === "dark";
            return {
              mb: isDesktop ? 1.8 : { xs: 0.45, sm: 0.7, md: 0.9 },
              borderRadius: isDesktop ? `${designTokens.radius}px` : { xs: 1.6, sm: 2, md: 2.4 },
              border: isDark ? "1px solid #67C99D" : `1px solid rgba(5,117,70,0.16)`,
              overflow: "hidden",
              backgroundColor: isDark ? theme.palette.surfaces.card : whiteColor,
              boxShadow: isDark
                ? "0 0 0 1px #67C99D, 0 18px 40px rgba(0,0,0,.45)"
                : "0 14px 32px rgba(5,117,70,0.10)",
              position: "relative"
            };
          }}
        >
          <Box
            sx={(theme) => {
              const isDark = theme.palette.mode === "dark";
              return {
                minHeight: "auto",
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                px: isDesktop ? 1.25 : { xs: 0.45, sm: 0.7, md: 1 },
                py: isDesktop ? 0.8 : { xs: 0.45, sm: 0.6, md: 0.8 },
                gap: isDesktop ? 1 : { xs: 0.35, sm: 0.55, md: 0.75 },
                background: isDark
                  ? `linear-gradient(135deg, ${theme.palette.surfaces.section}, ${theme.palette.surfaces.card})`
                  : `
                    radial-gradient(circle at 12% 0%, rgba(174,30,33,0.10), transparent 30%),
                    radial-gradient(circle at 88% 0%, rgba(5,117,70,0.16), transparent 34%),
                    linear-gradient(135deg, ${whiteColor} 0%, #f1faf6 55%, #e8f5ef 100%)
                  `,
                position: "relative",
                "&:after": {
                  content: '""',
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 3,
                  background: `linear-gradient(90deg, ${pinColor(accentColor)}, ${pinColor("#f4c542")}, ${primaryColor})`
                }
              };
            }}
          >
            <Box
              sx={(theme) => {
                const isDark = theme.palette.mode === "dark";
                return {
                  display: isDesktop ? "flex" : "none",
                  width: "clamp(7.5rem, 11vw, 9rem)",
                  maxWidth: "100%",
                  minWidth: 0,
                  padding: "0.5rem 0.75rem",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: `${designTokens.radius}px`,
                  border: isDark ? "2px solid #67C99D" : `2px solid rgba(5,117,70,0.26)`,
                  background: isDark ? theme.palette.surfaces.nested : `linear-gradient(145deg, ${whiteColor} 0%, #edf9f3 100%)`,
                  color: primaryDark,
                  fontWeight: 1000,
                  textAlign: "center",
                  fontSize: designTokens.typography.control,
                  letterSpacing: "0.3px",
                  boxShadow: isDark ? "none" : "0 16px 35px rgba(5,117,70,0.17)",
                  position: "relative",
                  overflow: "hidden",
                  "&:before": {
                    content: '"★"',
                    position: "absolute",
                    top: 6,
                    right: 10,
                    color: accentColor,
                    fontSize: "1rem"
                  }
                };
              }}
            >
              SSTLI
              <br />
              مكتب الاستقبال
            </Box>

            <Stack
              direction="row"
              spacing={isDesktop ? 0.8 : 0}
              alignItems="center"
              sx={{ ...uiLayout.actionBarSx, width: { xs: '100%', md: 'auto' },
          '& > .MuiButton-root': { flex: { xs: '1 1 120px', md: '0 0 auto' }, width: 'auto', minHeight: { xs: 44, lg: 36 }, px: 1.5, fontSize: '0.8125rem' } }}
            >
              <HeaderButton
                label="طالب جديد"
                icon={<PersonAddAlt1Icon />}
                onPointerDown={handleNewStudent}
                onClick={handleNewStudent}
                color={primaryColor}
              />

              <HeaderButton
                label="تحديث"
                icon={<RefreshIcon />}
                onClick={handleSearch}
                color={primaryColor}
              />

              <HeaderButton
                label="خروج"
                icon={<LogoutIcon />}
                onClick={() => window.history.back()}
                color={accentColor}
              />
            </Stack>
          </Box>

          <Divider />

          <Box
            sx={(theme) => ({
              px: isDesktop ? 1.25 : { xs: 0.45, sm: 0.7, md: 1 },
              py: isDesktop ? 0.9 : { xs: 0.45, sm: 0.6, md: 0.8 },
              background: theme.palette.mode === "dark"
                ? theme.palette.surfaces.card
                : `linear-gradient(180deg, ${whiteColor} 0%, #fbfffd 100%)`
            })}
          >
            <Grid
              container
              spacing={0.8}
              alignItems="center"
              sx={{
                direction: "rtl"
              }}
            >
              <Grid item xs={12} md={4} sx={{ width: "100%" }}>
                <RadioGroup
                  row
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  sx={uiLayout.withUiSx({
                    justifyContent: "flex-start",
                    direction: "rtl",
                    gap: isDesktop ? 1 : { xs: 0.25, sm: 0.45, md: 0.65 },
                    flexWrap: "nowrap",
                    width: "100%",
                    justifyContent: isDesktop ? "flex-start" : "space-between",
                    "& .MuiRadio-root": {
                      p: isDesktop ? undefined : { xs: 0.25, sm: 0.35 }
                    },
                    "& .MuiSvgIcon-root": {
                      fontSize: isDesktop ? undefined : { xs: 16, sm: 18, md: 20 }
                    },
                    "& .MuiFormControlLabel-label": {
                      fontSize: isDesktop ? undefined : { xs: "0.75rem", sm: "0.75rem", md: "0.75rem" }
                    }
                  }, uiLayout.radioGroupSx)}
                >
                  <FormControlLabel
                    value="nationalId"
                    control={<Radio />}
                    label="رقم الهوية"
                    sx={{
                      m: 0,
                      "& .MuiFormControlLabel-label": { fontWeight: 900 }
                    }}
                  />
                  <FormControlLabel
                    value="tel"
                    control={<Radio />}
                    label="رقم الجوال"
                    sx={{
                      m: 0,
                      "& .MuiFormControlLabel-label": { fontWeight: 900 }
                    }}
                  />
                  <FormControlLabel
                    value="name"
                    control={<Radio />}
                    label="اسم الطالب"
                    sx={{
                      m: 0,
                      "& .MuiFormControlLabel-label": { fontWeight: 900 }
                    }}
                  />
                </RadioGroup>
              </Grid>

              <Grid item xs={12} md={4} sx={{ width: "100%" }}>
                <TextField
                  fullWidth
                  size="small"
                  value={searchText}
                  onChange={(e) => {
                    const value = e.target.value;

                    if (searchType === "nationalId" || searchType === "tel") {
                      setSearchText(value.replace(/\D/g, ""));
                      return;
                    }

                    setSearchText(value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                  label={searchLabel}
                 InputLabelProps={{
  sx: {
    fontWeight: 900,
    right: "auto",
    transformOrigin: "top left",

    fontSize: isPhone
      ? "0.75rem"
      : isTablet
        ? "0.75rem"
        : undefined,
  }
, shrink: true }}
                  inputProps={{
                    style: {
                      textAlign: "right",
                      fontWeight: 900,
                      direction: "rtl",
                      fontSize: designTokens.typography.control
                    }
                  }}
                  sx={uiLayout.withUiSx({
  backgroundColor: whiteColor,
  borderRadius: `${designTokens.radius}px`,
  direction: "rtl",
  boxShadow: "0 8px 22px rgba(5,117,70,0.07)",

  "& .MuiOutlinedInput-root": {
    fontWeight: 900,
    minHeight: isDesktop ? undefined : { xs: 34, sm: 38, md: 40 },
    borderRadius: isDesktop ? `${designTokens.radius}px` : 1.5,

    "& fieldset": {
      borderColor: primaryLight
    },

    "&:hover fieldset": {
      borderColor: primaryColor
    },

    "&.Mui-focused fieldset": {
      borderColor: primaryColor,
      borderWidth: 2
    }
  },

  // خلي فتحة الـ label ناحية الشمال فقط
  "& .MuiOutlinedInput-notchedOutline": {
    direction: "ltr"
  },

  "& .MuiOutlinedInput-notchedOutline legend": {
    textAlign: "left"
  }

}, uiLayout.formFieldSx, (theme) => (theme.palette.mode !== "dark" ? {} : {
  backgroundColor: theme.palette.surfaces.input,
  "& .MuiOutlinedInput-root fieldset": { borderColor: "#67C99D" },
  "& .MuiOutlinedInput-root:hover fieldset": { borderColor: "#67C99D" },
  "& .MuiOutlinedInput-root.Mui-focused fieldset": { borderColor: "#67C99D" }
}))}
                />
              </Grid>

              <Grid item xs={12} md={4} sx={{ width: "100%" }}>
                <Box
                  sx={uiLayout.withUiSx({
                    direction: "rtl",
                    width: "100%",

                    // Desktop: كل العناصر في صف واحد.
                    display: isDesktop ? "grid" : "grid",
                    alignItems: "center",
                    justifyContent: isDesktop ? "center" : "stretch",
                    flexWrap: isDesktop ? "nowrap" : undefined,

                    // Mobile / Tablet: العداد + العنوان + الزرين في صف مرتب.
                    gridTemplateColumns: isDesktop
                      ? "auto minmax(20px,auto) auto auto"
                      : "auto auto minmax(0, 1fr) minmax(0, 1fr)",

                    gap: isDesktop
                      ? 1
                      : { xs: 0.35, sm: 0.55, md: 0.7 },

                    "& .MuiButton-root": {
                      width: isDesktop ? "auto" : "100%",
                      minWidth: isDesktop ? 0 : 0,
                      px: isDesktop ? 0.7 : undefined,
                      height: isDesktop ? designTokens.controlHeight : { xs: 30, sm: 33, md: 36 },
                      fontSize: isDesktop
                        ? designTokens.typography.control
                        : { xs: "0.75rem", sm: "0.75rem", md: "0.75rem" },
                      whiteSpace: "nowrap"
                    }
                  }, uiLayout.actionBarSx)}
                >
                  <Typography
                    sx={{
                      fontWeight: 900,
                      color: textColor,
                      lineHeight: 1.2,
                      whiteSpace: "nowrap",
                      minWidth: isDesktop ? "auto" : "auto",
                      fontSize: isDesktop
                        ? designTokens.typography.control
                        : { xs: "0.75rem", sm: "0.75rem", md: "0.75rem" },
                      textAlign: "center"
                    }}
                  >
                    نتائج البحث
                  </Typography>

                  <Typography
                    sx={{
                      color: accentColor,
                      fontWeight: 900,
                      fontSize: isDesktop
                        ? "0.75rem"
                        : { xs: "0.75rem", sm: "0.9rem", md: "1rem" },
                      minWidth: isDesktop ? 20 : 22,
                      textAlign: "center"
                    }}
                  >
                    {showOldGrid ? oldStudents.length : students.length}
                  </Typography>

                  <Button
                    variant="contained"
                    startIcon={
                      loading ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : (
                        <SearchIcon />
                      )
                    }
                    disabled={loading}
                    onClick={handleSearch}
                    sx={uiLayout.withUiSx({
                      minWidth: isDesktop ? 0 : 0,
                      borderRadius: 2,
                      fontWeight: 900,
                      background: `linear-gradient(135deg, ${primaryColor}, ${primaryDark})`,
                      boxShadow: "0 8px 20px rgba(5,117,70,0.22)",
                      direction: "rtl",
                      "& .MuiButton-startIcon": {
                        ml: 0.5,
                        mr: 0
                      },
                      "&:hover": {
                        background: `linear-gradient(135deg, ${primaryDark}, ${primaryColor})`,
                        boxShadow: "0 10px 24px rgba(5,117,70,0.28)"
                      }
                    }, uiLayout.buttonSx)}
                  >
                    بحث
                  </Button>

                  <Button
                    variant="outlined"
                    onClick={handleRefresh}
                    sx={uiLayout.withUiSx((theme) => {
                      const isDark = theme.palette.mode === "dark";
                      return {
                        minWidth: isDesktop ? 0 : 0,
                        borderRadius: 2,
                        fontWeight: 900,
                        color: accentColor,
                        borderColor: accentColor,
                        backgroundColor: isDark ? "rgba(229,90,90,.1)" : whiteColor,
                        "&:hover": {
                          borderColor: accentColor,
                          backgroundColor: isDark ? "rgba(229,90,90,.18)" : "#fff4f4"
                        }
                      };
                    }, uiLayout.buttonSx)}
                  >
                    مسح
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Paper>

        {!showOldGrid && students.length === 0 && !loading && (
          <Alert
            severity="info"
           sx={{
  mb: 1.5,
  borderRadius: 2,
  fontWeight: 800,
  direction: "rtl",
  textAlign: "start",

  fontSize: isPhone
    ? "0.75rem"
    : isTablet
      ? "0.75rem"
      : undefined,

  py: isPhone ? 0.25 : isTablet ? 0.4 : undefined,

  "& .MuiAlert-icon": {
    fontSize: isPhone ? 17 : isTablet ? 19 : undefined,
  },
}}
          >
            ابدأ بالبحث عن الطالب برقم الهوية أو رقم الجوال أو الاسم.
          </Alert>
        )}

        {showOldGrid && (
          <Alert
            severity="warning"
            sx={{
              mb: 1.5,
              borderRadius: 2,
              fontWeight: 800,
              direction: "rtl",
              textAlign: "start"
            }}
          >
            لم يتم العثور على الطالب في النظام الجديد، وتم عرض بيانات الأرشيف القديم.
          </Alert>
        )}

        <Paper
          elevation={0}
          sx={(theme) => {
            const isDark = theme.palette.mode === "dark";
            return {
              minHeight: isDesktop ? 430 : { xs: "68dvh", sm: "72dvh", md: "74dvh" },
              width: "100%",
              overflow: "hidden",
              maxWidth: "100%",
              borderRadius: `${designTokens.radius}px`,
              border: isDark ? "1px solid #67C99D" : "1px solid rgba(5,117,70,0.16)",
              backgroundColor: isDark ? theme.palette.surfaces.card : whiteColor,
              boxShadow: isDark
                ? "0 0 0 1px #67C99D, 0 18px 40px rgba(0,0,0,.45)"
                : "0 20px 50px rgba(5,117,70,0.10)"
            };
          }}
        >
          <Box
            sx={uiLayout.withUiSx({
              width: "100%",
              overflowX: "hidden",
              WebkitOverflowScrolling: "touch",
              minWidth: 0
            }, uiLayout.tableContainerSx)}
          >
          <DataGrid
            rows={showOldGrid ? oldStudents : students}
            columns={
              isDesktop
                ? (showOldGrid ? oldStudentColumns : studentColumns)
                : (showOldGrid ? compactOldStudentColumns : compactStudentColumns)
            }
            loading={loading}
            disableRowSelectionOnClick
            rowHeight={isDesktop ? 52 : isPhone ? 44 : 48}
            columnHeaderHeight={isDesktop ? 42 : isPhone ? 34 : 40}
            pageSizeOptions={[30, 60, 100]}
            initialState={{
              pagination: {
                paginationModel: {
                  pageSize: 30,
                  page: 0
                }
              }
            }}
            disableColumnMenu={!isDesktop}
            disableColumnFilter={!isDesktop}
            localeText={{
              noRowsLabel: "لا توجد بيانات",
              footerRowSelected: (count) => `${count} صف محدد`,
              MuiTablePagination: {
                labelRowsPerPage: "عدد الصفوف"
              }
            }}
            sx={uiLayout.withUiSx({
              border: "none",
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,
              direction: "rtl",
              height: "clamp(18rem, 58dvh, 38rem)",

              "& .MuiDataGrid-main": {
                overflow: "hidden"
              },

              "& .MuiDataGrid-virtualScroller": {
                overflowX: "hidden"
              },

              "& .MuiDataGrid-columnHeaders": {
                background: `linear-gradient(135deg, ${primaryColor}, ${primaryDark})`,
                color: whiteColor,
                fontWeight: 900,
                borderBottom: `1px solid ${primaryDark}`
              },

              "& .MuiDataGrid-columnHeaderTitle": {
                fontWeight: 950,
                fontSize: "0.6875rem",
                whiteSpace: "normal",
                lineHeight: 1.2,
                textAlign: "center",
                color: whiteColor
              },

              "& .MuiDataGrid-cell": {
                borderBottom: "1px solid #edf4f1",
                fontWeight: 800,
                outline: "none !important",
                px: isDesktop ? 0.5 : { xs: 0.15, sm: 0.35, md: 0.45 },
                fontSize: "0.6875rem",
                overflow: "hidden"
              },

              // Vertical breathing for this grid only:
              // keep column widths unchanged and add space above/below row content.
              "& .MuiDataGrid-row": {
                boxSizing: "border-box"
              },

              "& .MuiDataGrid-cell": {
                py: isDesktop ? 0.75 : 0.5,
                boxSizing: "border-box",
                alignItems: "center"
              },

              "& .MuiDataGrid-cell[data-field=\"actions\"]": {
                px: 0.75,
                justifyContent: "center"
              },

              "& .MuiDataGrid-columnHeader[data-field=\"actions\"]": {
                px: 1.25
              },

              "& .MuiDataGrid-row:hover": {
                backgroundColor: "#f0faf5"
              },

              "& .MuiDataGrid-row.Mui-selected": {
                backgroundColor: "#e3f5ed !important"
              },

              "& .MuiDataGrid-footerContainer": {
                direction: "rtl"
              }
            }, uiLayout.dataGridSx, (theme) => (theme.palette.mode !== "dark" ? {} : {
              border: "1px solid #67C99D",
              "& .MuiDataGrid-columnHeaders": { borderBottom: "1px solid #67C99D" },
              "& .MuiDataGrid-cell": { borderColor: "#67C99D" },
              "& .MuiDataGrid-footerContainer": { borderTop: "1px solid #67C99D" },
              "& .MuiDataGrid-row:hover": { backgroundColor: theme.palette.surfaces.hover },
              "& .MuiDataGrid-row.Mui-selected": { backgroundColor: `${theme.palette.surfaces.selected} !important` }
            }))}
          />

          </Box>        </Paper>
      </Box>

      <Menu
        anchorEl={actionAnchorEl}
        open={Boolean(actionAnchorEl)}
        onClose={handleCloseActionMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: (theme) => {
            const isDark = theme.palette.mode === "dark";
            return {
              width: isDesktop ? 310 : { xs: 205, sm: 230, md: 245 },
              maxWidth: isDesktop ? 310 : "72vw",
              maxHeight: isDesktop ? "76vh" : { xs: "67dvh", sm: "70dvh", md: "72dvh" },
              mt: isDesktop ? 0.8 : 0.35,
              borderRadius: isDesktop ? 3.2 : 1.8,
              direction: "rtl",
              textAlign: "right",
              border: isDark ? "1px solid #67C99D" : "1px solid rgba(5,117,70,0.15)",
              background: isDark ? (theme.palette.surfaces?.card || "#13251d") : "linear-gradient(180deg, #ffffff 0%, #fbfefc 100%)",
              boxShadow: isDark
                ? "none"
                : (isDesktop
                  ? "0 24px 60px rgba(31,45,61,0.22)"
                  : "0 12px 28px rgba(31,45,61,0.18)"),
              overflowY: "auto",
              overflowX: "hidden",
              "&::-webkit-scrollbar": { width: isDesktop ? 7 : 4 },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: isDark ? "#67C99D" : "rgba(5,117,70,0.25)",
                borderRadius: 10
              }
            };
          }
        }}
        MenuListProps={{
          sx: {
            py: isDesktop ? 0.8 : 0.3
          }
        }}
      >
        <Box
          sx={(theme) => {
            const isDark = theme.palette.mode === "dark";

            return {
              mx: isDesktop ? 1 : 0.4,
              mb: isDesktop ? 0.55 : 0.22,
              px: isDesktop ? 1.4 : { xs: 0.65, sm: 0.8, md: 0.9 },
              py: isDesktop ? 1.15 : { xs: 0.5, sm: 0.6, md: 0.7 },
              borderRadius: isDesktop ? 2.4 : 1.35,
              color: isDark ? "#9BE0C1" : "#fff",
              background: isDark
                ? (theme.palette.surfaces?.section || "#172b22")
                : `linear-gradient(135deg, ${primaryColor}, ${primaryDark})`,
              backgroundImage: isDark ? "none" : undefined,
              border: isDark ? "1px solid #67C99D" : "none",
              boxShadow: isDark
                ? "none"
                : isDesktop
                  ? "0 9px 22px rgba(5,117,70,0.22)"
                  : "0 5px 12px rgba(5,117,70,0.18)"
            };
          }}
        >
          <Typography
            sx={{
              fontWeight: 950,
              fontSize: isDesktop ? "0.92rem" : { xs: "0.75rem", sm: "0.75rem", md: "0.75rem" },
              lineHeight: 1.2,
              textAlign: "start"
            }}
          >
            إجراءات الطالب
          </Typography>

          <Typography
            sx={{
              mt: isDesktop ? 0.2 : 0.1,
              opacity: 0.9,
              fontSize: isDesktop ? "0.75rem" : { xs: "0.75rem", sm: "0.75rem", md: "0.75rem" },
              fontWeight: 800,
              lineHeight: 1.25,
              textAlign: "start",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}
          >
            {actionRow?.studentName
              ? getCompactStudentName(actionRow.studentName)
              : "اختر الإجراء المطلوب"}
          </Typography>
        </Box>

        <ActionMenuSection>
          <ActionMenuItem icon={<EditNoteIcon />} label="عرض بيانات الطالب" color="#546e7a" onClick={() => runAction(handleViewStudentDetails, "جاري فتح بيانات الطالب...", false)} />
          <ActionMenuItem icon={<AccountBalanceWalletIcon />} label="كشف حساب" color="#1565c0" onClick={() => runAction(handleStatement, "جاري تجهيز كشف الحساب...", false)} />
          <ActionMenuItem icon={<AssignmentIcon />} label="طلب التحاق" color="#6a1b9a" onClick={() => runAction(handleAdmissionOrder, "جاري تجهيز شاشة طلب الالتحاق...", false)} />
          <ActionMenuItem icon={<DescriptionIcon />} label="استمارة رسوم" color="#ef6c00" onClick={() => runAction(handleFeesForm, "جاري تجهيز استمارة الرسوم...", false)} />
          <ActionMenuItem icon={<RequestQuoteIcon />} label="طلب سداد" color="#00838f" onClick={() => runAction(handlePaymentOrder, "جاري تجهيز بيانات السداد...", false)} />
          <ActionMenuItem icon={<MenuBookIcon />} label="الملف التدريبي" color="#3949ab" onClick={() => runAction(handleStudyFile, "جاري فتح الملف التدريبي...")} />
        </ActionMenuSection>

        <Divider
          sx={(theme) => ({
            mx: isDesktop ? 1.2 : 0.55,
            borderColor:
              theme.palette.mode === "dark"
                ? "rgba(103,201,157,.42)"
                : undefined
          })}
        />

        <ActionMenuSection>
          <ActionMenuItem icon={<UndoIcon />} label="مرتجع استمارة" color="#8e24aa" onClick={() => runAction(handleReRegister, "جاري تجهيز مرتجع الاستمارة...")} />
          <ActionMenuItem icon={<ReceiptIcon />} label="مرتجع فاتورة" color="#c62828" onClick={() => runAction(handleInvoiceReturn, "جاري تحميل فواتير الطالب...")} />
          <ActionMenuItem icon={<LockIcon />} label="إغلاق ملف طالب" color={accentColor} onClick={() => runAction((row) => handleToggleProfileLock(row, true), "", false)} />
          <ActionMenuItem icon={<LockOpenIcon />} label="إعادة فتح ملف طالب" color={primaryColor} onClick={() => runAction((row) => handleToggleProfileLock(row, false), "", false)} />
        </ActionMenuSection>

        <Divider
          sx={(theme) => ({
            mx: isDesktop ? 1.2 : 0.55,
            borderColor:
              theme.palette.mode === "dark"
                ? "rgba(103,201,157,.42)"
                : undefined
          })}
        />

        <ActionMenuSection>
          <ActionMenuItem icon={<PublishedWithChangesIcon />} label="تغيير حالة الطالب" color="#00897b" onClick={() => runAction(handleChangeStudentStatus, "جاري تحميل حالات الطالب...")} />
          <ActionMenuItem icon={<LocalOfferIcon />} label="طلب خصم" color="#ad1457" onClick={() => runAction(handleDiscountOrder, "جاري فتح نموذج طلب الخصم...")} />
          <ActionMenuItem icon={<TaskAltIcon />} label="طلب موافقة دراسية" color="#2e7d32" onClick={() => runAction(handleAcceptOrder, "جاري تجهيز طلب الموافقة الدراسية...")} />
          <ActionMenuItem icon={<CurrencyExchangeIcon />} label="طلب استرداد" color="#0277bd" onClick={() => runAction(handleRefundRequest, "جاري فتح طلب الاسترداد...")} />
          <ActionMenuItem icon={<ManageHistoryIcon />} label="العمليات" color="#5d4037" onClick={() => runAction(handleHistory, "جاري تحميل سجل العمليات...")} />
          <ActionMenuItem icon={<CreditScoreIcon />} label="تغيير حالة السداد" color="#455a64" onClick={() => runAction(handleChangePayStatus, "جاري تحميل حالة السداد...")} />
        </ActionMenuSection>
      </Menu>

        </PageContainer>
      <Backdrop
        open={actionLoading}
        sx={{
          zIndex: (theme) => theme.zIndex.modal + 2500,
          color: "#fff",
          backgroundColor: "rgba(15, 31, 25, 0.68)",
          backdropFilter: "blur(5px)"
        }}
      >
        <Paper
          elevation={0}
          sx={(theme) => {
            const isDark = theme.palette.mode === "dark";
            return {
              minWidth: { xs: 210, sm: 245 },
              px: 2,
              py: 1.45,
              borderRadius: `${designTokens.radius}px`,
              textAlign: "center",
              direction: "rtl",
              border: isDark ? "1px solid #67C99D" : "1px solid rgba(5,117,70,.22)",
              background: isDark ? theme.palette.surfaces.card : "rgba(255,255,255,0.98)",
              color: isDark ? theme.palette.text.primary : textColor,
              boxShadow: isDark ? "none" : "0 18px 48px rgba(0,0,0,0.22)"
            };
          }}
        >
          <Box sx={{ position: "relative", display: "inline-flex" }}>
            <CircularProgress size={30} thickness={4.5} sx={{ color: "#67C99D" }} />
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <SchoolIcon sx={{ color: "#67C99D", fontSize: 14 }} />
            </Box>
          </Box>
          <Typography
            sx={(theme) => ({
              mt: 0.85,
              color: theme.palette.mode === "dark" ? theme.palette.text.primary : textColor,
              fontWeight: 950,
              fontSize: designTokens.typography.control
            })}
          >
            {actionLoadingLabel}
          </Typography>
          <Typography
            sx={(theme) => ({
              mt: 0.35,
              color: theme.palette.mode === "dark" ? theme.palette.text.secondary : "#6b7b75",
              fontWeight: 700,
              fontSize: "0.75rem"
            })}
          >
            برجاء الانتظار لحظات
          </Typography>
        </Paper>
      </Backdrop>

      <Dialog sx={uiLayout.dialogLayoutSx}
        open={detailsOpen}
        onClose={() => !detailsLoading && setDetailsOpen(false)}
        fullWidth
        maxWidth="lg"
        PaperProps={{ sx: (theme) => ({ borderRadius: `${designTokens.radius}px`, direction: "rtl", textAlign: "start", border: theme.palette.mode === "dark" ? "1px solid #67C99D" : undefined }) }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: textColor }}>
          بيانات تسجيل طالب
        </DialogTitle>
        <DialogContent dividers>
          {detailsLoading ? (
            <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
              <CircularProgress />
              <Typography sx={{ mt: 2, fontWeight: 900 }}>جاري تحميل بيانات الطالب...</Typography>
            </Stack>
          ) : (
            <Box>
              <Grid container spacing={1.5}>
                <Grid item xs={12} md={3}><DetailItem label="كود" value={studentDetails?.studentCode || studentDetails?.code || selectedStudent?.studentCode || selectedStudent?.code || "-"} strong /></Grid>
                <Grid item xs={12} md={3}><DetailItem label="رقم الهوية" value={studentDetails?.nationalId} strong /></Grid>
                <Grid item xs={12} md={3}><DetailItem label="اسم الطالب" value={studentDetails?.studentName} /></Grid>
                <Grid item xs={12} md={3}><DetailItem label="الاسم بالإنجليزية" value={studentDetails?.studentNameEn || "-"} /></Grid>
                <Grid item xs={12} md={3}><DetailItem label="رقم الجوال" value={studentDetails?.studentTel} /></Grid>
                <Grid item xs={12} md={3}><DetailItem label="رقم جوال آخر" value={studentDetails?.studentTel2} /></Grid>
                <Grid item xs={12} md={3}><DetailItem label="الجنسية" value={studentDetails?.studentNationalText} /></Grid>
                <Grid item xs={12} md={3}><DetailItem label="نوع العميل" value={studentDetails?.customerTypeText} /></Grid>
                <Grid item xs={12} md={3}><DetailItem label="النوع" value={studentDetails?.genderText || studentDetails?.studentTypeText} /></Grid>
                <Grid item xs={12} md={3}>
  <DetailItem
    label="تاريخ الميلاد"
    value={formatBirthDate(
      studentDetails?.birthDate ||
      studentDetails?.BirthDate ||
      selectedStudent?.birthDate ||
      selectedStudent?.BirthDate
    )}
  />
</Grid>
                <Grid item xs={12} md={3}><DetailItem label="الإيميل" value={studentDetails?.email} /></Grid>
                {/* <Grid item xs={12} md={3}><DetailItem label="نوع التسجيل" value={studentDetails?.registrationTypeText || studentDetails?.regTypeText} strong /></Grid> */}
                <Grid item xs={12} md={3}><DetailItem label="نوع الدراسة" value={studentDetails?.studyTypeText} strong /></Grid>
                <Grid item xs={12} md={4}><DetailItem label="القطاع" value={studentDetails?.sectorName || studentDetails?.companyName} /></Grid>
                <Grid item xs={12} md={4}><DetailItem label="مندوب البيع" value={studentDetails?.sellerName} /></Grid>
                <Grid item xs={12} md={4}><DetailItem label="الحساب الرئيسي" value={studentDetails?.parentAccountName || "العملاء"} /></Grid>
                <Grid item xs={12} md={3}><DetailItem label="رقم الحساب" value={studentDetails?.accountCode} strong /></Grid>
                {/* <Grid item xs={12} md={3}><DetailItem label="مدين" value={studentDetails?.maden ?? "0"} /></Grid> */}
                {/* <Grid item xs={12} md={3}><DetailItem label="دائن" value={studentDetails?.daen ?? "0"} /></Grid> */}
                {/* <Grid item xs={12} md={3}><DetailItem label="حالة الطالب" value={studentDetails?.isUseText} /></Grid> */}
                <Grid item xs={12}><DetailItem label="ملاحظات" value={studentDetails?.notes} /></Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={uiLayout.withUiSx({ px: 2, py: 1.5 }, uiLayout.dialogActionsSx)}>
          <Button onClick={() => setDetailsOpen(false)} disabled={detailsLoading} sx={uiLayout.withUiSx({ fontWeight: 900, color: "#c62828" }, uiLayout.buttonSx)}>
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>

      <OldStudentStatementDialog
        open={oldStatementOpen}
        loading={oldStatementLoading}
        data={oldStatementData}
        error={oldStatementError}
        onClose={() => {
          setOldStatementOpen(false);
          setOldStatementData(null);
          setOldStatementError("");
        }}
      />

      <FastAddStudentDialogHost
        ref={fastAddStudentDialogRef}
        onCreated={handleStudentCreated}
      />
      <FastReceptionDialogsHost
        ref={fastReceptionDialogsRef}
        onRefresh={handleSearch}
        onOpenStatementDocument={handleOpenStatementDocument}
        onOpenStatementSalesInvoice={handleOpenStatementSalesInvoice}
        onOpenStatementSalesReturn={handleOpenStatementSalesReturn}
        onOpenStatementHistory={handleOpenStatementHistory}
      />
<StudentOperationsDialog
  open={studentOperationsOpen}
  onClose={() => {
    setStudentOperationsOpen(false);
    setStudentOperationsStudent(null);
  }}
  student={studentOperationsStudent}
  apiBaseUrl={API_BASE_URL}
/>

<DocumentHistoryDialog
  open={documentHistoryOpen}
  onClose={() => {
    setDocumentHistoryOpen(false);
    setDocumentHistoryRow(null);
  }}
  actionGuid={
    documentHistoryRow?.actionGuid ||
    documentHistoryRow?.ActionGuid ||
    ""
  }
  documentNo={
    documentHistoryRow?.documentNo ||
    documentHistoryRow?.DocumentNo ||
    ""
  }
  apiBaseUrl={API_BASE_URL}
/>

<RegisterDocumentDialog
  open={registerDocumentOpen}
  onClose={() => {
    setRegisterDocumentOpen(false);
    setRegisterDocumentRow(null);
  }}
  docGuid={
    registerDocumentRow?.actionGuid ||
    registerDocumentRow?.ActionGuid ||
    ""
  }
  documentNo={
    registerDocumentRow?.documentNo ||
    registerDocumentRow?.DocumentNo ||
    ""
  }
  apiBaseUrl={API_BASE_URL}
/>
<StudentStudyFileDialog
  open={studyFileOpen}
  onClose={() => {
    setStudyFileOpen(false);
    setStudyFileStudent(null);
  }}
  student={studyFileStudent}
  apiBaseUrl={API_BASE_URL}
/>
<ChangePaymentStatusDialog
  open={changePaymentStatusOpen}
  student={changePaymentStatusStudent}
  apiBaseUrl={API_BASE_URL}
  onClose={() => {
    setChangePaymentStatusOpen(false);
    setChangePaymentStatusStudent(null);
  }}
  onSaved={async (result) => {
    setChangePaymentStatusOpen(false);
    setChangePaymentStatusStudent(null);
    await showSuccess(result?.message || "تم تغيير حالة السداد بنجاح");
    handleSearch(searchText, true);
  }}
/>

<RefundRequestDialog
  open={refundRequestOpen}
  student={refundRequestStudent}
  apiBaseUrl={API_BASE_URL}
  onClose={() => {
    setRefundRequestOpen(false);
    setRefundRequestStudent(null);
  }}
  onSaved={async (result) => {
    setRefundRequestOpen(false);
    setRefundRequestStudent(null);

    await showSuccess(
      result?.message ||
        "تم حفظ طلب الاسترداد ورفع ملف الآيبان بنجاح"
    );
  }}
/>

<ChangeStudentStatusDialog
  open={changeStudentStatusOpen}
  student={changeStudentStatusStudent}
  apiBaseUrl={API_BASE_URL}
  onClose={() => {
    setChangeStudentStatusOpen(false);
    setChangeStudentStatusStudent(null);
  }}
  onSaved={async (result) => {
    setChangeStudentStatusOpen(false);
    setChangeStudentStatusStudent(null);
    await showSuccess(
      result?.message || "تم تغيير حالة الطالب بنجاح"
    );
    handleSearch();
  }}
/>

<DiscountOrderDialog
  open={discountOrderOpen}
  student={discountOrderStudent}
  apiBaseUrl={API_BASE_URL}
  onClose={() => {
    setDiscountOrderOpen(false);
    setDiscountOrderStudent(null);
  }}
  onSaved={() => {
    setDiscountOrderOpen(false);
    setDiscountOrderStudent(null);
    showSuccess("تم حفظ طلب الخصم بنجاح");
  }}
/>

<InvoiceReturnDialog
  open={invoiceReturnOpen}
  student={invoiceReturnStudent}
  apiBaseUrl={API_BASE_URL}
  onClose={() => {
    setInvoiceReturnOpen(false);
    setInvoiceReturnStudent(null);
  }}
  onSaved={async (result) => {
    setInvoiceReturnOpen(false);
    setInvoiceReturnStudent(null);

    await showSuccess(
      result?.message || "تم حفظ مرتجع المبيعات بنجاح"
    );

    handleSearch(searchText, true);
  }}
/>

<RegistrationReturnDialog
  open={registrationReturnOpen}
  student={registrationReturnStudent}
  apiBaseUrl={API_BASE_URL}
  onClose={() => {
    setRegistrationReturnOpen(false);
    setRegistrationReturnStudent(null);
  }}
  onSaved={async (result) => {
    setRegistrationReturnOpen(false);
    setRegistrationReturnStudent(null);
    await showSuccess(
      result?.message || "تم حفظ مرتجع التسجيل بنجاح"
    );
    handleSearch(searchText, true);
  }}
/>

<StudyApprovalDialog
  open={studyApprovalOpen}
  student={studyApprovalStudent}
  apiBaseUrl={API_BASE_URL}
  onClose={() => {
    setStudyApprovalOpen(false);
    setStudyApprovalStudent(null);
  }}
  onSaved={(result) => {
    console.log("Saved approval:", result);
  }}
/>

    </Box></NavigationShell>
  );
};

export default ReceptionOffice;