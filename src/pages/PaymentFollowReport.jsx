import PageContainer from '../components/common/PageContainer';
import * as uiLayout from '../components/common/uiLayout';
import './rtl-forms-fix.css';
import { DESKTOP_BREAKPOINT, navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";
import * as XLSX from "xlsx";
import {
  AppBar,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  GlobalStyles,
  IconButton,
  LinearProgress,
  Menu,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import {
  DataGrid,
  GridToolbar
} from "@mui/x-data-grid";

import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import Groups2Icon from "@mui/icons-material/Groups2";
import PreviewIcon from "@mui/icons-material/Preview";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import SchoolIcon from "@mui/icons-material/School";
import BlockIcon from "@mui/icons-material/Block";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutline";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";


import StudentStatementDialog2 from "../components/StudentStatementDialog2";
import Swal from "sweetalert2";




const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "https://api4.sstli.com";

const pad2 = (value) =>
  String(value).padStart(2, "0");

const toIsoDate = (date) =>
  `${date.getFullYear()}-${pad2(
    date.getMonth() + 1
  )}-${pad2(date.getDate())}`;

const today = () =>
  toIsoDate(new Date());

const isValidGuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || "").trim()
  );

const normalizeArabic = (value) =>
  String(value || "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ")
    .trim();


const BLANK_FILTER_VALUE = "__SSTLI_BLANK__";
const BLANK_FILTER_LABEL = "بدون قيمة";

const normalizeFilterValue = (value) => {
  const normalized = String(value ?? "").trim();
  return normalized === ""
    ? BLANK_FILTER_VALUE
    : normalized;
};

const getFilterOptionLabel = (option) =>
  option === BLANK_FILTER_VALUE
    ? BLANK_FILTER_LABEL
    : String(option || "");

const getFixedCompanyTrainer = (
  branchName
) => {
  const normalizedBranch =
    normalizeArabic(branchName);

  if (
    normalizedBranch.includes(
      "حفر الباطن"
    ) &&
    normalizedBranch.includes(
      "المصيف"
    )
  ) {
    return {
      displayName:
        "أحمد محمد أحمد متولي",
      matchTokens: [
        "احمد",
        "محمد",
        "متولي"
      ]
    };
  }

  if (
    normalizedBranch.includes(
      "حفر الباطن"
    ) &&
    (
      normalizedBranch.includes(
        "الواحه"
      ) ||
      normalizedBranch.includes(
        "الواحة"
      )
    )
  ) {
    return {
      displayName:
        "أحمد متولي",
      matchTokens: [
        "احمد",
        "متولي"
      ]
    };
  }

  return null;
};

const isFixedCompanyTrainer = (
  trainer,
  fixedTrainer
) => {
  if (!fixedTrainer) {
    return false;
  }

  const normalizedName =
    normalizeArabic(
      trainer?.name ||
      trainer?.trainerName ||
      ""
    );

  return fixedTrainer.matchTokens
    .every((token) =>
      normalizedName.includes(
        normalizeArabic(token)
      )
    );
};

const isExcludedDistributionBranch = () =>
  false;

const unwrap = (value) => {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  if (typeof value !== "object") {
    return value;
  }

  const keys = [
    "value",
    "Value",
    "data",
    "Data",
    "amount",
    "Amount",
    "number",
    "Number",
    "decimal",
    "Decimal",
    "int32",
    "Int32",
    "int64",
    "Int64",
    "string",
    "String"
  ];

  for (const key of keys) {
    if (
      value[key] !== null &&
      value[key] !== undefined &&
      value[key] !== value
    ) {
      return unwrap(value[key]);
    }
  }

  return "";
};

const pick = (
  row,
  names,
  fallback = ""
) => {
  for (const name of names) {
    const value = unwrap(row?.[name]);

    if (
      value !== null &&
      value !== undefined &&
      String(value).trim() !== ""
    ) {
      return value;
    }
  }

  return fallback;
};

const toNumber = (value) => {
  const result = Number(
    unwrap(value)
  );

  return Number.isFinite(result)
    ? result
    : 0;
};

const money = (value) =>
  new Intl.NumberFormat(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  ).format(toNumber(value));

const firstAndLastName = (value) => {
  const parts = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length <= 1) {
    return parts[0] || "-";
  }

  return `${parts[0]} ${parts[parts.length - 1]}`;
};

const showError = async (message) =>
  Swal.fire({
    icon: "error",
    title: "حدث خطأ",
    text: message,
    confirmButtonText: "حسنًا",
    confirmButtonColor: "#ae1e21"
  });

const showSuccess = async (
  title,
  text = ""
) =>
  Swal.fire({
    icon: "success",
    title,
    text,
    confirmButtonText: "حسنًا",
    confirmButtonColor: "#057546"
  });

const readJson = async (response) => {
  const text =
    await response.text();

  let json = null;

  try {
    json = text
      ? JSON.parse(text)
      : null;
  } catch {
    json = null;
  }

  if (!response.ok) {
    const validationMessage =
      json?.errors
        ? Object.entries(
            json.errors
          )
            .flatMap(
              ([field, messages]) =>
                (Array.isArray(messages)
                  ? messages
                  : [messages]
                ).map(
                  (message) =>
                    `${field}: ${message}`
                )
            )
            .join("\n")
        : "";

    const message =
      validationMessage ||
      json?.details ||
      json?.message ||
      json?.title ||
      text
        ?.replace(/<[^>]*>/g, " ")
        ?.replace(/\s+/g, " ")
        ?.trim()
        ?.slice(0, 700);

    throw new Error(
      message ||
      `تعذر تنفيذ الطلب - HTTP ${response.status}`
    );
  }

  if (!json) {
    throw new Error(
      `الخادم لم يرجع JSON صحيحًا - HTTP ${response.status}`
    );
  }

  return json;
};

const TextCell = ({
  value,
  align = "center"
}) => (
  <Tooltip
    title={String(value || "")}
    arrow
  >
    <Typography
      sx={{
        width: "100%",
        px: 0.35,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        textAlign: align,
        fontFamily: "Cairo",
        fontSize: "0.76rem",
        fontWeight: 700,
        "@media (max-width: 599px)": { fontSize: "0.75rem", lineHeight: 1.15, fontWeight: 800 },
        [`@media (min-width: 600px) and (max-width: ${DESKTOP_BREAKPOINT - 0.05}px)`]: { fontSize: "0.75rem", lineHeight: 1.25 }
      }}
    >
      {value || "-"}
    </Typography>
  </Tooltip>
);

const MoneyCell = ({ value }) => (
  <Typography
    sx={{
      width: "100%",
      textAlign: "center",
      fontFamily: "Cairo",
      fontSize: "0.75rem",
      fontWeight: 800,
      "@media (max-width: 599px)": { fontSize: "0.75rem", lineHeight: 1.1, fontWeight: 900 },
      [`@media (min-width: 600px) and (max-width: ${DESKTOP_BREAKPOINT - 0.05}px)`]: { fontSize: "0.75rem", lineHeight: 1.2 }
    }}
  >
    {money(value)}
  </Typography>
);

const TotalItem = ({
  label,
  value,
  accent = "#057546"
}) => (
  <Box
    className="payment-total-item"
    sx={{
      minWidth: 0,
      px: 1.25,
      py: 1.1,
      borderRadius: 2.5,
      "@media (max-width: 599px)": { px: 0.55, py: 0.48, borderRadius: 1.5, minHeight: 43 },
      [`@media (min-width: 600px) and (max-width: ${DESKTOP_BREAKPOINT - 0.05}px)`]: { px: 0.75, py: 0.65, borderRadius: 2 },
      border:
        "1px solid rgba(5,117,70,0.12)",
      background:
        "linear-gradient(135deg,#ffffff 0%,#f7fbf9 100%)",
      boxShadow:
        "0 5px 14px rgba(31,45,61,0.05)",
      position: "relative",
      overflow: "hidden",

      "&::before": {
        content: '""',
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        width: 4,
        background: accent
      }
    }}
  >
    <Typography
      sx={{
        mb: 0.35,
        color: "#708179",
        fontFamily: "Cairo",
        fontSize: "0.75rem",
        fontWeight: 800,
        "@media (max-width: 599px)": { fontSize: "0.75rem", lineHeight: 1.1 },
        [`@media (min-width: 600px) and (max-width: ${DESKTOP_BREAKPOINT - 0.05}px)`]: { fontSize: "0.75rem" },
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }}
    >
      {label}
    </Typography>

    <Typography
      title={money(value)}
      sx={{
        color: "#173b2b",
        fontFamily: "Cairo",
        fontSize: "0.9rem",
        fontWeight: 900,
        "@media (max-width: 599px)": { fontSize: "0.75rem", lineHeight: 1.15 },
        [`@media (min-width: 600px) and (max-width: ${DESKTOP_BREAKPOINT - 0.05}px)`]: { fontSize: "0.75rem" },
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }}
    >
      {money(value)}
    </Typography>
  </Box>
);

const PaymentTotalsSection = ({
  totals,
  rowCount
}) => (
  <Paper
    elevation={0}
    sx={{
      mt: 0.9,
      p: 0.9,
      borderRadius: 2,
      border:
        "1px solid rgba(5,117,70,0.14)",
      background:
        "linear-gradient(135deg,#f7fbf9 0%,#ffffff 55%,#eef8f3 100%)",
      boxShadow:
        "0 10px 26px rgba(31,45,61,0.07)",
      direction: "rtl"
    }}
  >
    <Stack
      direction={{
        xs: "column",
        lg: "row"
      }}
      spacing={0.7}
      alignItems={{
        xs: "stretch",
        lg: "center"
      }}
    >
      <Box
        sx={{
          minWidth: {
            xs: "100%",
            lg: 215
          },
          px: 1.5,
          py: 1.25,
          borderRadius: 2.8,
          background:
            "linear-gradient(135deg,#057546 0%,#034d31 100%)",
          color: "#fff",
          boxShadow:
            "0 8px 20px rgba(5,117,70,0.20)"
        }}
      >
        <Typography
          sx={{
            fontFamily: "Cairo",
            fontSize: "0.76rem",
            fontWeight: 800,
            "@media (max-width: 599px)": { fontSize: "0.75rem" },
            [`@media (min-width: 600px) and (max-width: ${DESKTOP_BREAKPOINT - 0.05}px)`]: { fontSize: "0.75rem" },
            opacity: 0.88
          }}
        >
          ملخص النتائج
        </Typography>

        <Typography
          sx={{
            mt: 0.25,
            fontFamily: "Cairo",
            fontSize: "0.88rem",
            fontWeight: 900,
            "@media (max-width: 599px)": { fontSize: "0.75rem", lineHeight: 1.3 },
            [`@media (min-width: 600px) and (max-width: ${DESKTOP_BREAKPOINT - 0.05}px)`]: { fontSize: "0.75rem" }
          }}
        >
          العدد {rowCount} — المسددين {totals.paid} — لم يسدد {totals.unpaid}
        </Typography>
      </Box>

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            sm: "repeat(4, minmax(0, 1fr))",
            xl: "repeat(8, minmax(0, 1fr))"
          },
          gap: 1
        }}
      >
        <TotalItem
          label="الرصيد السابق"
          value={totals.preBalance}
          accent="#6f42c1"
        />

        <TotalItem
          label="مدين"
          value={totals.debit}
          accent="#c62828"
        />

        <TotalItem
          label="دفعة مقدمة"
          value={totals.startPay}
          accent="#d89400"
        />

        <TotalItem
          label="قسط شهري"
          value={totals.monthPay}
          accent="#1976d2"
        />

        <TotalItem
          label="سداد رسوم"
          value={totals.feesPay}
          accent="#00897b"
        />

        <TotalItem
          label="قيد مدين"
          value={totals.mDaily}
          accent="#8e24aa"
        />

        <TotalItem
          label="قيد دائن"
          value={totals.dDaily}
          accent="#ef6c00"
        />

        <TotalItem
          label="الرصيد الحالي"
          value={totals.balance}
          accent="#057546"
        />
      </Box>
    </Stack>
  </Paper>
);

const StudentInfo = ({ row }) => (
  <Paper
    elevation={0}
    sx={{
      p: 1.5,
      mb: 2,
      borderRadius: 3,
      border:
        "1px solid rgba(5,117,70,0.13)",
      background:
        "linear-gradient(135deg,#f8fcfa 0%,#ffffff 100%)"
    }}
  >
    <Stack
      direction={{
        xs: "column",
        md: "row"
      }}
      spacing={1.2}
      useFlexGap
      flexWrap="wrap"
    >
      <Chip
        label={`اسم الطالب: ${row?.studentName || "-"}`}
        sx={{
          fontFamily: "Cairo",
          fontWeight: 800
        }}
      />

      <Chip
        label={`رقم الهوية: ${row?.nationalId || "-"}`}
        sx={{
          fontFamily: "Cairo",
          fontWeight: 800
        }}
      />

      <Chip
        label={`الفرع الحالي: ${row?.branchName || "-"}`}
        sx={{
          fontFamily: "Cairo",
          fontWeight: 800
        }}
      />

      <Chip
        label={`التخصص الحالي: ${row?.diplomName || "-"}`}
        sx={{
          fontFamily: "Cairo",
          fontWeight: 800
        }}
      />
    </Stack>
  </Paper>
);


const MultiValueFilter = ({
  label,
  options,
  value,
  onChange
}) => {
  const selected = Array.isArray(value)
    ? value
    : [];

  const allSelected =
    options.length > 0 &&
    selected.length === options.length;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 0.9,
        borderRadius: 2,
        border: "1px solid #dce8e2",
        background: "#fff"
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
        sx={uiLayout.withUiSx({ mb: 1 }, uiLayout.pageHeaderSx)}
      >
        <Typography
          sx={{
            fontFamily: "Cairo",
            fontWeight: 900,
            color: "#173b2b"
          }}
        >
          {label}
        </Typography>

        <Stack sx={uiLayout.actionBarSx} direction="row" spacing={0.5}>
          <Button
            size="small"
            startIcon={<DoneAllIcon />}
            onClick={() =>
              onChange(
                allSelected ? [] : options
              )
            }
            sx={uiLayout.withUiSx({
              minWidth: 0,
              fontFamily: "Cairo",
              fontWeight: 800
            }, uiLayout.buttonSx)}
          >
            {allSelected
              ? "إلغاء الكل"
              : "تحديد الكل"}
          </Button>

          {selected.length > 0 && (
            <Button
              size="small"
              color="error"
              onClick={() => onChange([])}
              sx={uiLayout.withUiSx({
                minWidth: 0,
                fontFamily: "Cairo",
                fontWeight: 800
              }, uiLayout.buttonSx)}
            >
              مسح
            </Button>
          )}
        </Stack>
      </Stack>

      <Autocomplete
        multiple
        disableCloseOnSelect
        options={options}
        value={selected}
        getOptionLabel={getFilterOptionLabel}
        onChange={(event, newValue) =>
          onChange(newValue)
        }
        limitTags={2}
        noOptionsText="لا توجد نتائج"
        renderOption={(props, option, state) => (
          <li {...props}>
            <Checkbox
              checked={state.selected}
              sx={{
                mr: 1,
                color: "#6f8b7d",
                "&.Mui-checked": {
                  color: "#057546"
                }
              }}
            />
            <Typography
              sx={{
                fontFamily: "Cairo",
                fontSize: "0.82rem",
                fontWeight: 700
              }}
            >
              {getFilterOptionLabel(option)}
            </Typography>
          </li>
        )}
        renderTags={(tagValue, getTagProps) =>
          tagValue.map((option, index) => (
            <Chip
              {...getTagProps({ index })}
              key={option}
              label={getFilterOptionLabel(option)}
              size="small"
              sx={{
                fontFamily: "Cairo",
                fontWeight: 700
              }}
            />
          ))
        }
        renderInput={(params) => (
          <TextField InputLabelProps={{ shrink: true }}
            {...params}
            size="small"
            placeholder="ابحث وحدد أكثر من قيمة"
            helperText={
              selected.length
                ? `تم اختيار ${selected.length} من ${options.length}`
                : `الكل ظاهر (${options.length})`
            }
            sx={uiLayout.withUiSx({
              "& .MuiInputBase-root": {
                fontFamily: "Cairo"
              },
              "& .MuiFormHelperText-root": {
                fontFamily: "Cairo",
                textAlign: "right"
              }
            }, uiLayout.formFieldSx)}
          />
        )}
      />
    </Paper>
  );
};

const PaymentFollowReport = () => {
  const theme = useTheme();

  const isDark = theme.palette.mode === "dark";
  const uiColors = {
    page: isDark ? theme.palette.background.default : "#f5faf7",
    card: isDark ? (theme.palette.surfaces?.card || "#13251d") : "#ffffff",
    section: isDark ? (theme.palette.surfaces?.section || "#172b22") : "#f7fbf9",
    nested: isDark ? (theme.palette.surfaces?.nested || "#1b3328") : "#fbfdfc",
    hover: isDark ? (theme.palette.surfaces?.hover || "#214333") : "#eef8f3",
    selected: isDark ? (theme.palette.surfaces?.selected || "#28513f") : "#e7f5ee",
    text: isDark ? (theme.palette.text?.primary || "#eef8f3") : "#173b2b",
    muted: isDark ? (theme.palette.text?.secondary || "#b7cfc3") : "#667a70",
    border: "#67C99D"
  };

  const darkContractStyles = isDark
    ? {
        ".payment-follow-ui": {
          backgroundColor: `${uiColors.page} !important`,
          color: `${uiColors.text} !important`
        },
        ".payment-follow-ui .MuiPaper-root, .payment-follow-ui .MuiCard-root, .payment-follow-ui .MuiTableContainer-root": {
          backgroundColor: `${uiColors.card} !important`,
          backgroundImage: "none !important",
          border: `1px solid ${uiColors.border} !important`,
          color: `${uiColors.text} !important`
        },
        ".payment-follow-ui .MuiOutlinedInput-root": {
          backgroundColor: `${uiColors.nested} !important`,
          color: `${uiColors.text} !important`,
          borderRadius: "10px !important"
        },
        ".payment-follow-ui .MuiOutlinedInput-notchedOutline": {
          borderColor: `${uiColors.border} !important`,
          borderWidth: "1px !important"
        },
        ".payment-follow-ui .MuiInputBase-input, .payment-follow-ui .MuiSelect-select": {
          color: `${uiColors.text} !important`
        },
        ".payment-follow-ui .MuiInputLabel-root, .payment-follow-ui .MuiFormHelperText-root": {
          color: `${uiColors.muted} !important`
        },
        ".payment-follow-ui .MuiInputLabel-root.Mui-focused": {
          color: `${uiColors.border} !important`
        },
        ".payment-follow-ui .MuiDivider-root": {
          borderColor: "rgba(103,201,157,.45) !important"
        },
        ".payment-follow-ui .MuiButton-root": {
          background: "transparent !important",
          backgroundColor: "transparent !important",
          backgroundImage: "none !important",
          color: `${uiColors.border} !important`,
          border: `1px solid ${uiColors.border} !important`,
          borderRadius: "9px !important",
          boxShadow: "none !important"
        },
        ".payment-follow-ui .MuiButton-root:hover": {
          background: "transparent !important",
          color: "#C9F2DF !important"
        },
        ".payment-follow-ui .MuiIconButton-root": {
          background: "transparent !important",
          color: `${uiColors.border} !important`,
          border: `1px solid ${uiColors.border} !important`,
          borderRadius: "9px !important"
        },
        ".payment-follow-ui .MuiChip-root": {
          background: "transparent !important",
          color: `${uiColors.border} !important`,
          border: `1px solid ${uiColors.border} !important`
        },
        ".payment-follow-ui .MuiDataGrid-root": {
          backgroundColor: `${uiColors.card} !important`,
          color: `${uiColors.text} !important`,
          border: `1px solid ${uiColors.border} !important`
        },
        ".payment-follow-ui .MuiDataGrid-columnHeaders": {
          backgroundColor: `${uiColors.section} !important`,
          color: `${uiColors.text} !important`,
          borderBottom: `1px solid ${uiColors.border} !important`
        },
        ".payment-follow-ui .MuiDataGrid-columnHeader, .payment-follow-ui .MuiDataGrid-cell": {
          borderColor: "rgba(103,201,157,.34) !important"
        },
        ".payment-follow-ui .MuiDataGrid-row": {
          backgroundColor: `${uiColors.card} !important`
        },
        ".payment-follow-ui .MuiDataGrid-row:hover": {
          backgroundColor: `${uiColors.hover} !important`
        },
        ".payment-follow-ui .MuiDataGrid-footerContainer": {
          backgroundColor: `${uiColors.section} !important`,
          borderTop: `1px solid ${uiColors.border} !important`
        },
        ".payment-follow-ui .MuiTable-root": {
          backgroundColor: `${uiColors.card} !important`,
          color: `${uiColors.text} !important`
        },
        ".payment-follow-ui .MuiTableCell-root": {
          color: `${uiColors.text} !important`,
          borderColor: "rgba(103,201,157,.34) !important"
        },
        ".payment-follow-ui .MuiPaginationItem-root": {
          color: `${uiColors.text} !important`,
          borderColor: `${uiColors.border} !important`
        },
        ".payment-follow-ui .MuiPaginationItem-root.Mui-selected": {
          backgroundColor: "transparent !important",
          color: `${uiColors.border} !important`,
          boxShadow: `inset 0 0 0 1px ${uiColors.border} !important`
        },
        ".MuiDialog-paper, .MuiPopover-paper, .MuiMenu-paper, .MuiAutocomplete-paper": {
          backgroundColor: `${uiColors.card} !important`,
          backgroundImage: "none !important",
          color: `${uiColors.text} !important`,
          border: `1px solid ${uiColors.border} !important`
        },
        ".MuiDialogTitle-root, .MuiDialogContent-root, .MuiDialogActions-root": {
          backgroundColor: `${uiColors.card} !important`,
          color: `${uiColors.text} !important`
        },
        ".MuiMenuItem-root": {
          color: `${uiColors.text} !important`
        },
        ".MuiMenuItem-root:hover, .MuiMenuItem-root.Mui-selected": {
          backgroundColor: `${uiColors.hover} !important`
        },
        ".payment-follow-ui .payment-total-item": {
          background: `${uiColors.nested} !important`,
          backgroundImage: "none !important",
          border: `1px solid ${uiColors.border} !important`,
          color: `${uiColors.text} !important`
        },
        ".payment-follow-ui .payment-total-item .MuiTypography-root": {
          color: `${uiColors.text} !important`
        },
        ".MuiDialog-paper .MuiPaper-root, .MuiDialog-paper .MuiTableContainer-root": {
          backgroundColor: `${uiColors.card} !important`,
          backgroundImage: "none !important",
          borderColor: `${uiColors.border} !important`,
          color: `${uiColors.text} !important`
        },
        ".MuiDialog-paper .MuiOutlinedInput-root": {
          backgroundColor: `${uiColors.nested} !important`,
          color: `${uiColors.text} !important`
        },
        ".MuiDialog-paper .MuiOutlinedInput-notchedOutline": {
          borderColor: `${uiColors.border} !important`
        },
        ".MuiDialog-paper .MuiInputLabel-root, .MuiDialog-paper .MuiFormHelperText-root": {
          color: `${uiColors.muted} !important`
        },
        ".MuiDialog-paper .MuiButton-root, .MuiPopover-paper .MuiButton-root": {
          background: "transparent !important",
          backgroundColor: "transparent !important",
          backgroundImage: "none !important",
          color: `${uiColors.border} !important`,
          border: `1px solid ${uiColors.border} !important`,
          boxShadow: "none !important"
        },
        ".MuiDialog-paper .MuiButton-root:hover, .MuiPopover-paper .MuiButton-root:hover": {
          background: "transparent !important",
          color: "#C9F2DF !important"
        },
        ".MuiDialog-paper .MuiIconButton-root": {
          background: "transparent !important",
          color: `${uiColors.border} !important`,
          border: `1px solid ${uiColors.border} !important`
        },
        ".MuiDialog-paper .MuiChip-root": {
          background: "transparent !important",
          color: `${uiColors.border} !important`,
          border: `1px solid ${uiColors.border} !important`
        },
        ".swal2-popup": {
          background: `${uiColors.card} !important`,
          color: `${uiColors.text} !important`,
          border: `1px solid ${uiColors.border} !important`
        },
        ".swal2-confirm, .swal2-deny, .swal2-cancel": {
          background: "transparent !important",
          color: `${uiColors.border} !important`,
          border: `1px solid ${uiColors.border} !important`,
          boxShadow: "none !important"
        },
        ".swal2-input, .swal2-textarea, .swal2-select": {
          background: "transparent !important",
          color: `${uiColors.text} !important`,
          border: `1px solid ${uiColors.border} !important`
        }
      }
    : {};


  const layoutSafetyStyles = {
    ".payment-follow-ui": {
      width: "100%",
      maxWidth: "100vw",
      overflowX: "hidden"
    },
    ".payment-follow-ui .MuiPaper-root, .payment-follow-ui .MuiTableContainer-root, .payment-follow-ui .MuiDataGrid-root": {
      boxSizing: "border-box",
      minWidth: 0,
      maxWidth: "100%"
    },
    [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
      ".payment-follow-ui .MuiDataGrid-virtualScroller": {
        overflowX: "hidden !important"
      },
      ".payment-follow-ui .MuiDataGrid-scrollbar--horizontal": {
        display: "none !important"
      },
      ".MuiDialog-paper": {
        width: "calc(100vw - 16px) !important",
        maxWidth: "calc(100vw - 16px) !important",
        margin: "8px !important",
        overflowX: "hidden !important"
      },
      ".MuiDialog-paper .MuiDialogContent-root": {
        overflowX: "hidden !important",
        boxSizing: "border-box !important"
      },
      ".MuiDialog-paper .MuiPaper-root, .MuiDialog-paper .MuiBox-root, .MuiDialog-paper .MuiStack-root, .MuiDialog-paper .MuiFormControl-root, .MuiDialog-paper .MuiAutocomplete-root": {
        minWidth: "0 !important",
        maxWidth: "100% !important",
        boxSizing: "border-box !important"
      },
      ".MuiDialog-paper .MuiTable-root": {
        width: "100% !important",
        maxWidth: "100% !important",
        tableLayout: "fixed !important"
      },
      ".MuiDialog-paper .MuiTableCell-root": {
        minWidth: "0 !important",
        maxWidth: "100% !important",
        overflow: "hidden !important",
        textOverflow: "ellipsis !important",
        overflowWrap: "anywhere !important"
      },
      ".MuiDialog-paper .MuiDialogActions-root": {
        maxWidth: "100% !important",
        flexWrap: "wrap !important",
        gap: "8px !important",
        boxSizing: "border-box !important"
      },
      ".MuiPopover-paper, .MuiMenu-paper, .MuiAutocomplete-paper": {
        maxWidth: "calc(100vw - 16px) !important"
      }
    }
  };

  const isPhone = useMediaQuery(
    theme.breakpoints.down("sm")
  );

  const isTablet = useMediaQuery(
    `(min-width:600px) and (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`
  );

  const isDesktop = useMediaQuery(
    `(min-width:${DESKTOP_BREAKPOINT}px)`,
    { noSsr: true }
  );

  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  const [mobileDetailsOpen, setMobileDetailsOpen] =
    useState(false);

  const [mobileDetailsRow, setMobileDetailsRow] =
    useState(null);

  useEffect(() => {
    if (isDesktop) {
      setMobileSidebarOpen(false);
    }
  }, [isDesktop]);

  const openMobileDetails = (row) => {
    setMobileDetailsRow(row);
    setMobileDetailsOpen(true);
  };

  const closeMobileDetails = () => {
    setMobileDetailsOpen(false);
    setMobileDetailsRow(null);
  };

  const currentUser = useMemo(
    () => {
      try {
        return JSON.parse(
          localStorage.getItem(
            "user"
          ) || "{}"
        );
      } catch {
        return {};
      }
    },
    []
  );

  const userGuid = String(
    currentUser?.guid ||
    currentUser?.Guid ||
    currentUser?.userGuid ||
    ""
  ).trim();

  const [fromDate, setFromDate] =
    useState(today());

  const [toDate, setToDate] =
    useState(today());

  const [branches, setBranches] =
    useState([]);

  const [batches, setBatches] =
    useState([]);

  const [trainers, setTrainers] =
    useState([]);

  const [diploms, setDiploms] =
    useState([]);

  const [branch, setBranch] =
    useState(null);

  const [batch, setBatch] =
    useState(null);

  const [rows, setRows] =
    useState([]);

  const [filterDialogOpen, setFilterDialogOpen] =
    useState(false);

  const [columnFilters, setColumnFilters] =
    useState({
      regTypeName: [],
      diplomName: [],
      levelName: [],
      sectionName: [],
      batchName: [],
      trainerName: [],
      studentType: []
    });

  const [loading, setLoading] =
    useState(false);

  const [menuAnchor, setMenuAnchor] =
    useState(null);

  const [menuRow, setMenuRow] =
    useState(null);

  const [
    statementStudent,
    setStatementStudent
  ] = useState(null);

  const [
    statementOpen,
    setStatementOpen
  ] = useState(false);

  const [
    actionDialog,
    setActionDialog
  ] = useState({
    type: "",
    row: null
  });

  const [reason, setReason] =
    useState("");

  const [attachment, setAttachment] =
    useState(null);

  const [
    selectedNewBranch,
    setSelectedNewBranch
  ] = useState(null);

  const [
    selectedNewDiplom,
    setSelectedNewDiplom
  ] = useState(null);

  const [savingAction, setSavingAction] =
    useState(false);

  const [distributionDialogOpen, setDistributionDialogOpen] = useState(false);
  const [distributionSelections, setDistributionSelections] = useState({});
  const [distributionPreview, setDistributionPreview] = useState(null);
  const [distributionStatus, setDistributionStatus] = useState(null);
  const [loadingDistribution, setLoadingDistribution] = useState(false);
  const [distributionStep, setDistributionStep] = useState(1);
  const [previewingDistribution, setPreviewingDistribution] = useState(false);
  const [confirmDistributionOpen, setConfirmDistributionOpen] = useState(false);
  const [executingDistribution, setExecutingDistribution] = useState(false);
  const [distributionProgressIndex, setDistributionProgressIndex] = useState(0);

  // توزيع مخصص: طلاب غير موزعين يتم اختيارهم يدويًا
  const [customDistributionOpen, setCustomDistributionOpen] = useState(false);
  const [customDistributionStep, setCustomDistributionStep] = useState(1);
  const [customStudentSelections, setCustomStudentSelections] = useState({});
  const [customTrainerSelections, setCustomTrainerSelections] = useState({});
  const [customDistributionPreview, setCustomDistributionPreview] = useState(null);
  const [executingCustomDistribution, setExecutingCustomDistribution] = useState(false);

  const fixedCompanyTrainer =
    useMemo(
      () =>
        getFixedCompanyTrainer(
          branch?.name
        ),
      [branch?.name]
    );

  const selectableTrainers =
    useMemo(
      () =>
        trainers.filter(
          (item) =>
            !isFixedCompanyTrainer(
              item,
              fixedCompanyTrainer
            )
        ),
      [
        trainers,
        fixedCompanyTrainer
      ]
    );

  const distributionProgressMessages = useMemo(
    () => [
      "يتم الآن تجهيز بيانات الطلاب...",
      "يتم مراجعة التوزيعات السابقة لضمان تدوير الطلاب...",
      "يتم حساب حصص المدربين الأساسيين والمتعاونين...",
      "يتم توزيع الطلاب بالتساوي النسبي...",
      "يتم حفظ التعيينات وتسجيل العملية...",
      "أوشكنا على الانتهاء، برجاء الانتظار..."
    ],
    []
  );

  useEffect(() => {
    if (!executingDistribution) {
      setDistributionProgressIndex(0);
      return undefined;
    }

    const timer = window.setInterval(() => {
      setDistributionProgressIndex((current) =>
        Math.min(
          current + 1,
          distributionProgressMessages.length - 1
        )
      );
    }, 2600);

    return () => window.clearInterval(timer);
  }, [executingDistribution, distributionProgressMessages]);

  const loadLookups = useCallback(
    async () => {
      if (!userGuid) {
        await showError(
          "بيانات المستخدم غير موجودة، برجاء تسجيل الدخول مرة أخرى"
        );
        return;
      }

      try {
        const [
          branchResponse,
          batchResponse,
          diplomResponse
        ] = await Promise.all([
          fetch(
            `${API_BASE_URL}/api/payment-follow/branches?userGuid=${encodeURIComponent(userGuid)}`
          ),
          fetch(
            `${API_BASE_URL}/api/payment-follow/batches?userGuid=${encodeURIComponent(userGuid)}`
          ),
          fetch(
            `${API_BASE_URL}/api/payment-follow/diploms?userGuid=${encodeURIComponent(userGuid)}`
          )
        ]);

        const [
          branchResult,
          batchResult,
          diplomResult
        ] = await Promise.all([
          readJson(branchResponse),
          readJson(batchResponse),
          readJson(diplomResponse)
        ]);

        const allowedBranches =
          Array.isArray(branchResult?.data)
            ? branchResult.data
            : [];

        setBranches(
          allowedBranches
        );

        /*
         * نعيد ضبط الفرع من نتيجة الـBackend فقط.
         * لو رجع فرع واحد يتم اختياره تلقائيًا،
         * ولا نحتفظ بأي فرع قديم من جلسة سابقة.
         */
        if (allowedBranches.length === 1) {
          setBranch(
            allowedBranches[0]
          );
        } else {
          setBranch(null);
        }

        setBatches(
          Array.isArray(batchResult?.data)
            ? batchResult.data
            : []
        );

        setDiploms(
          Array.isArray(diplomResult?.data)
            ? diplomResult.data
            : []
        );
      } catch (error) {
        await showError(
          error?.message ||
          "تعذر تحميل قوائم الشاشة"
        );
      }
    },
    [userGuid]
  );

  const loadTrainers = useCallback(
    async () => {
      if (!branch?.guid) {
        setTrainers([]);
        setDistributionSelections({});
        setDistributionStatus(null);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/payment-follow/trainers?userGuid=${encodeURIComponent(userGuid)}&branchGuid=${encodeURIComponent(branch.guid)}`
        );

        const result =
          await readJson(response);

        const values =
          Array.isArray(result?.data)
            ? result.data
            : [];

        setTrainers(values);

        const currentFixedTrainer =
          getFixedCompanyTrainer(
            branch?.name
          );

        setDistributionSelections(
          (current) => {
            const next = {};

            values.forEach((item) => {
              if (
                isFixedCompanyTrainer(
                  item,
                  currentFixedTrainer
                )
              ) {
                return;
              }

              if (current[item.guid]) {
                next[item.guid] =
                  current[item.guid];
              }
            });

            return next;
          }
        );
      } catch (error) {
        await showError(
          error?.message ||
          "تعذر تحميل مسؤولي الاتصال"
        );
      }
    },
    [
      branch,
      userGuid
    ]
  );

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  useEffect(() => {
    loadTrainers();
  }, [loadTrainers]);

  const loadData = useCallback(
    async () => {
      if (!branch?.guid) {
        await showError(
          "برجاء اختيار الفرع"
        );
        return;
      }

      if (fromDate > toDate) {
        await showError(
          "تاريخ البداية يجب ألا يتجاوز تاريخ النهاية"
        );
        return;
      }

      setLoading(true);

      try {
        const params =
          new URLSearchParams({
            userGuid,
            fromDate,
            toDate,
            branchGuid:
              branch.guid
          });

        const response = await fetch(
          `${API_BASE_URL}/api/payment-follow/report?${params.toString()}`
        );

        const result =
          await readJson(response);

        let data =
          Array.isArray(result?.data)
            ? result.data
            : [];

        if (batch?.guid) {
          data = data.filter(
            (item) =>
              String(
                pick(
                  item,
                  [
                    "BatchGuid",
                    "batchGuid"
                  ]
                )
              ) === batch.guid ||
              String(
                pick(
                  item,
                  [
                    "BatchName",
                    "batchName"
                  ]
                )
              ) === batch.name
          );
        }

        setRows(data);
      } catch (error) {
        setRows([]);

        await showError(
          error?.message ||
          "تعذر تحميل متابعة السداد"
        );
      } finally {
        setLoading(false);
      }
    },
    [
      userGuid,
      fromDate,
      toDate,
      branch,
      batch
    ]
  );

  const gridRows = useMemo(
    () =>
      rows.map((row, index) => ({
        id: String(
          pick(
            row,
            [
              "StudentLevelGuid",
              "studentLevelGuid",
              "Guid",
              "guid"
            ],
            `row-${index}`
          )
        ),

        raw: row,

        studentLevelGuid:
          String(
            pick(
              row,
              [
                "StudentLevelGuid",
                "studentLevelGuid"
              ]
            )
          ),

        accountGuid:
          String(
            pick(
              row,
              [
                "AccountGuid",
                "accountGuid"
              ]
            )
          ),

        regDocGuid:
          String(
            pick(
              row,
              [
                "RegDocGuid",
                "regDocGuid"
              ]
            )
          ),

        diplomGuid:
          String(
            pick(
              row,
              [
                "DiplomGuid",
                "diplomGuid"
              ]
            )
          ),

        trainerGuid:
          String(
            pick(
              row,
              [
                "TrainerGuid",
                "trainerGuid"
              ]
            )
          ),

        branchName:
          String(
            pick(
              row,
              [
                "BrEName",
                "BranchName",
                "branchName"
              ]
            )
          ),

        regType:
          String(
            pick(
              row,
              [
                "RegType",
                "regType"
              ]
            )
          ),

        regTypeName:
          String(
            pick(
              row,
              [
                "RegTypeName",
                "regTypeName"
              ]
            )
          ),

        diplomName:
          String(
            pick(
              row,
              [
                "DiplomName",
                "diplomName"
              ]
            )
          ),

        levelName:
          String(
            pick(
              row,
              [
                "LevelName",
                "levelName",
                "StudentLevelName",
                "studentLevelName",
                "Level",
                "level"
              ]
            )
          ),

        sectionName:
          String(
            pick(
              row,
              [
                "SectionName",
                "sectionName",
                "ClassName",
                "className",
                "Section",
                "section",
                "Class",
                "class"
              ]
            )
          ),

        batchName:
          String(
            pick(
              row,
              [
                "BatchName",
                "batchName"
              ]
            )
          ),

        studentName:
          String(
            pick(
              row,
              [
                "StudentName",
                "studentName"
              ]
            )
          ),

        studentTel:
          String(
            pick(
              row,
              [
                "StudentTel",
                "studentTel"
              ]
            )
          ),

        nationalId:
          String(
            pick(
              row,
              [
                "NationalId",
                "nationalId"
              ]
            )
          ),

        preBalance:
          toNumber(
            pick(
              row,
              [
                "PREBALANCE",
                "preBalance"
              ]
            )
          ),

        debit:
          toNumber(
            pick(
              row,
              [
                "MADEN__",
                "debit"
              ]
            )
          ),

        startPay:
          toNumber(
            pick(
              row,
              [
                "STARTPAY",
                "startPay"
              ]
            )
          ),

        monthPay:
          toNumber(
            pick(
              row,
              [
                "MONTHPAY",
                "monthPay"
              ]
            )
          ),

        feesPay:
          toNumber(
            pick(
              row,
              [
                "FESSPAY",
                "feesPay"
              ]
            )
          ),

        mDaily:
          toNumber(
            pick(
              row,
              [
                "MDaily_",
                "mDaily"
              ]
            )
          ),

        dDaily:
          toNumber(
            pick(
              row,
              [
                "DDaily_",
                "dDaily"
              ]
            )
          ),

        balance:
          toNumber(
            pick(
              row,
              [
                "BALANCE",
                "balance"
              ]
            )
          ),

        trainerName:
          String(
            pick(
              row,
              [
                "Name",
                "TrainerName",
                "trainerName"
              ]
            )
          ),

        studentType:
          String(
            pick(
              row,
              [
                "TYPESTUDENT",
                "studentType"
              ]
            )
          )
      })),
    [rows]
  );


  const filterOptions = useMemo(() => {
    const makeOptions = (field) => {
      const values = gridRows.map((row) =>
        normalizeFilterValue(row[field])
      );

      const hasBlank =
        values.includes(BLANK_FILTER_VALUE);

      const regularValues = Array.from(
        new Set(
          values.filter(
            (value) =>
              value !== BLANK_FILTER_VALUE
          )
        )
      ).sort((first, second) =>
        first.localeCompare(
          second,
          "ar",
          { numeric: true }
        )
      );

      return hasBlank
        ? [BLANK_FILTER_VALUE, ...regularValues]
        : regularValues;
    };

    return {
      regTypeName:
        makeOptions("regTypeName"),
      diplomName:
        makeOptions("diplomName"),
      levelName:
        makeOptions("levelName"),
      sectionName:
        makeOptions("sectionName"),
      batchName:
        makeOptions("batchName"),
      trainerName:
        makeOptions("trainerName"),
      studentType:
        makeOptions("studentType")
    };
  }, [gridRows]);

  const filteredGridRows = useMemo(
    () =>
      gridRows.filter((row) =>
        Object.entries(columnFilters)
          .every(([field, selectedValues]) => {
            if (!selectedValues.length) {
              return true;
            }

            return selectedValues.includes(
              normalizeFilterValue(
                row[field]
              )
            );
          })
      ),
    [gridRows, columnFilters]
  );

  // الطلاب المتاحون للطريقة الجديدة: غير موزعين فقط.
  // نعتمد على TrainerGuid أولاً، ولو الـBackend لا يرجعه نعتمد على الاسم.
  const unassignedDistributionRows = useMemo(
    () =>
      gridRows.filter((row) =>
        !String(row.trainerGuid || "").trim() &&
        !String(row.trainerName || "").trim()
      ),
    [gridRows]
  );

  // غير الموزعين الظاهرون حاليًا في الجريد بعد تطبيق فلاتر الصفحة.
  // دول فقط اللي زر "تحديد الظاهر" يتعامل معاهم.
  const visibleUnassignedDistributionRows = useMemo(
    () =>
      filteredGridRows.filter((row) =>
        !String(row.trainerGuid || "").trim() &&
        !String(row.trainerName || "").trim()
      ),
    [filteredGridRows]
  );

  const selectedCustomStudents = useMemo(
    () =>
      unassignedDistributionRows.filter(
        (row) => customStudentSelections[row.studentLevelGuid || row.id]
      ),
    [unassignedDistributionRows, customStudentSelections]
  );

  const selectedCustomTrainers = useMemo(
    () =>
      selectableTrainers
        .filter((item) => customTrainerSelections[item.guid]?.selected)
        .map((item) => ({
          guid: item.guid,
          name: item.name,
          role: customTrainerSelections[item.guid]?.role || "primary"
        })),
    [selectableTrainers, customTrainerSelections]
  );

  const activeFilterCount = useMemo(
    () =>
      Object.values(columnFilters)
        .filter((values) =>
          values.length > 0
        ).length,
    [columnFilters]
  );

  const resetColumnFilters = () =>
    setColumnFilters({
      regTypeName: [],
      diplomName: [],
      levelName: [],
      sectionName: [],
      batchName: [],
      trainerName: [],
      studentType: []
    });

  const updateColumnFilter =
    (field, values) =>
      setColumnFilters((current) => ({
        ...current,
        [field]: values
      }));

  /*
   * كل الأعمدة Flex ومن غير MinWidth كبيرة.
   * النتيجة: الأعمدة تتوزع داخل عرض الجريد،
   * ومفيش Horizontal Scroll.
   * وفي نفس الوقت MUI يسمح للمستخدم بسحب الفاصل
   * وتوسيع أو تصغير أي عمود.
   */
  /*
   * ترتيب الأعمدة مطابق تمامًا لشاشة متابعة السداد في الديسكتوب
   * من اليمين إلى اليسار:
   *
   * العمليات
   * نوع التسجيل
   * الدبلوم/الدورة
   * الدفعة
   * اسم الطالب
   * رقم الجوال
   * رقم الهوية
   * الرصيد الحالي
   * مدين
   * دفعة مقدمة
   * قسط شهري
   * سداد رسوم
   * قيد مدين
   * قيد دائن
   * الرصيد السابق
   * مسؤول الاتصال
   * نوع الطالب
   */
  /*
   * الترتيب مطابق للديسكتوب تمامًا من اليمين لليسار:
   *
   * العمليات
   * نوع التسجيل
   * الدبلوم/الدورة
   * الدفعة
   * اسم الطالب
   * رقم الجوال
   * رقم الهوية
   * الرصيد السابق
   * مدين
   * دفعة مقدمة
   * قسط شهري
   * سداد رسوم
   * قيد مدين
   * قيد دائن
   * الرصيد الحالي
   * مسؤول الاتصال
   * نوع الطالب
   *
   * وربط القيم مطابق أيضًا:
   * PREBALANCE -> الرصيد السابق
   * MADEN__    -> مدين
   * STARTPAY   -> دفعة مقدمة
   * MONTHPAY   -> قسط شهري
   * FESSPAY    -> سداد رسوم
   * MDaily_    -> قيد مدين
   * DDaily_    -> قيد دائن
   * BALANCE    -> الرصيد الحالي
   */
  const columns = useMemo(
    () => [
      {
        field: "actions",
        headerName: "العمليات",
        flex: 0.45,
        minWidth: 52,
        maxWidth: 72,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params) => (
          <IconButton
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              setMenuAnchor(
                event.currentTarget
              );
              setMenuRow(params.row);
            }}
          >
            <MoreVertIcon />
          </IconButton>
        )
      },
      {
        field: "regTypeName",
        headerName: "نوع التسجيل",
        flex: 0.8,
        minWidth: 0,
        renderCell: (params) => (
          <TextCell
            value={params.value}
          />
        )
      },
      {
        field: "diplomName",
        headerName: "الدبلوم/الدورة",
        flex: 1.8,
        minWidth: 0,
        renderCell: (params) => (
          <TextCell
            value={params.value}
            align="right"
          />
        )
      },
      {
        field: "batchName",
        headerName: "الدفعة",
        flex: 0.75,
        minWidth: 0,
        renderCell: (params) => (
          <TextCell
            value={params.value}
          />
        )
      },
      {
        field: "studentName",
        headerName: "اسم الطالب",
        flex: 1.65,
        minWidth: 0,
        renderCell: (params) => (
          <TextCell
            value={params.value}
            align="right"
          />
        )
      },
      {
        field: "studentTel",
        headerName: "رقم الجوال",
        flex: 0.9,
        minWidth: 0,
        renderCell: (params) => (
          <TextCell
            value={params.value}
          />
        )
      },
      {
        field: "nationalId",
        headerName: "رقم الهوية",
        flex: 0.95,
        minWidth: 0,
        renderCell: (params) => (
          <TextCell
            value={params.value}
          />
        )
      },
      {
        field: "preBalance",
        headerName: "الرصيد السابق",
        type: "number",
        flex: 0.9,
        minWidth: 0,
        renderCell: (params) => (
          <MoneyCell
            value={params.value}
          />
        )
      },
      {
        field: "debit",
        headerName: "مدين",
        type: "number",
        flex: 0.65,
        minWidth: 0,
        renderCell: (params) => (
          <MoneyCell
            value={params.value}
          />
        )
      },
      {
        field: "startPay",
        headerName: "دفعة مقدمة",
        type: "number",
        flex: 0.75,
        minWidth: 0,
        renderCell: (params) => (
          <MoneyCell
            value={params.value}
          />
        )
      },
      {
        field: "monthPay",
        headerName: "قسط شهري",
        type: "number",
        flex: 0.75,
        minWidth: 0,
        renderCell: (params) => (
          <MoneyCell
            value={params.value}
          />
        )
      },
      {
        field: "feesPay",
        headerName: "سداد رسوم",
        type: "number",
        flex: 0.75,
        minWidth: 0,
        renderCell: (params) => (
          <MoneyCell
            value={params.value}
          />
        )
      },
      {
        field: "mDaily",
        headerName: "قيد مدين",
        type: "number",
        flex: 0.7,
        minWidth: 0,
        renderCell: (params) => (
          <MoneyCell
            value={params.value}
          />
        )
      },
      {
        field: "dDaily",
        headerName: "قيد دائن",
        type: "number",
        flex: 0.7,
        minWidth: 0,
        renderCell: (params) => (
          <MoneyCell
            value={params.value}
          />
        )
      },
      {
        field: "balance",
        headerName: "الرصيد الحالي",
        type: "number",
        flex: 0.9,
        minWidth: 0,
        renderCell: (params) => (
          <MoneyCell
            value={params.value}
          />
        )
      },
      {
        field: "trainerName",
        headerName: "مسؤول الاتصال",
        flex: 1.2,
        minWidth: 0,
        renderCell: (params) => (
          <TextCell
            value={params.value}
            align="right"
          />
        )
      },
      {
        field: "studentType",
        headerName: "نوع الطالب",
        flex: 0.75,
        minWidth: 0,
        renderCell: (params) => (
          <TextCell
            value={params.value}
          />
        )
      }
    ],
    []
  );

  const compactColumns = useMemo(() => {
    const byField = (field) =>
      columns.find(
        (column) => column.field === field
      );

    const phoneFields = [
      "studentName",
      "nationalId",
      "monthPay",
      "balance"
    ];

    const tabletFields = [
      "studentName",
      "nationalId",
      "diplomName",
      "monthPay",
      "balance",
      "trainerName"
    ];

    const fields = isPhone
      ? phoneFields
      : tabletFields;

    const selected = fields
      .map(byField)
      .filter(Boolean)
      .map((column) => ({
        ...column,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        resizable: false,
        headerAlign: "center",
        align: "center",

        ...(column.field === "studentName"
          ? {
              renderCell: (params) => (
                <Typography
                  sx={{
                    width: "100%",
                    px: isPhone ? 0.1 : 0.25,
                    textAlign: "center",
                    fontFamily: "Cairo",
                    fontWeight: 800,
                    fontSize: isPhone
                      ? "0.75rem"
                      : "0.75rem",
                    lineHeight: 1.2,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}
                >
                  {isPhone
                    ? firstAndLastName(params.value)
                    : params.value || "-"}
                </Typography>
              )
            }
          : {}),

        ...(isPhone
          ? {
              flex:
                column.field === "studentName"
                  ? 1.45
                  : 1,
              minWidth: 0,
              maxWidth: undefined,
              width: undefined
            }
          : {
              flex:
                column.field === "studentName"
                  ? 1.35
                  : column.field === "diplomName"
                    ? 1.35
                    : 1,
              minWidth: 0,
              maxWidth: undefined,
              width: undefined
            })
      }));

    return [
      ...selected,
      {
        field: "__details",
        headerName: "",
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        resizable: false,
        width: isPhone ? 34 : 44,
        minWidth: isPhone ? 34 : 44,
        maxWidth: isPhone ? 34 : 44,
        align: "center",
        headerAlign: "center",

        renderCell: (params) => (
          <IconButton
            size="small"
            title="عرض التفاصيل"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              openMobileDetails(params.row);
            }}
            sx={{
              width: isPhone ? 24 : 30,
              height: isPhone ? 24 : 30,
              p: 0,
              color: "#057546",
              border:
                "1px solid rgba(5,117,70,.28)",
              backgroundColor: "#eef8f3"
            }}
          >
            <VisibilityOutlinedIcon
              sx={{
                fontSize: isPhone ? 14 : 18
              }}
            />
          </IconButton>
        )
      }
    ];
  }, [
    columns,
    isPhone,
    isTablet
  ]);

  // عمود اختيار الطلاب للتوزيع المخصص داخل الجريد الرئيسي نفسه.
  // يظهر Checkbox فقط للطالب غير الموزع، أما الطالب الذي لديه مسؤول اتصال
  // فيظهر له Checkbox معطل حتى لا تتم إعادة توزيعه بالخطأ.
  const customDistributionSelectionColumn = useMemo(
    () => ({
      field: "__customDistributionSelect",
      headerName: "توزيع",
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      resizable: false,
      width: isPhone ? 42 : 62,
      minWidth: isPhone ? 42 : 62,
      maxWidth: isPhone ? 42 : 62,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        const row = params.row;
        const key = row.studentLevelGuid || row.id;
        const isUnassigned =
          !String(row.trainerGuid || "").trim() &&
          !String(row.trainerName || "").trim();
        const checked = Boolean(customStudentSelections[key]);

        return (
          <Tooltip
            title={
              isUnassigned
                ? checked
                  ? "إلغاء اختيار الطالب من التوزيع"
                  : "اختيار الطالب للتوزيع"
                : "الطالب لديه مسؤول اتصال بالفعل"
            }
            arrow
          >
            <span>
              <Checkbox
                size="small"
                checked={isUnassigned && checked}
                disabled={!isUnassigned}
                onClick={(event) => event.stopPropagation()}
                onChange={(event) => {
                  event.stopPropagation();
                  if (!isUnassigned || !key) return;
                  setCustomStudentSelections((current) => ({
                    ...current,
                    [key]: event.target.checked
                  }));
                }}
                sx={{
                  p: 0.35,
                  color: "#8f79b7",
                  "&.Mui-checked": { color: "#6f42c1" },
                  "&.Mui-disabled": { opacity: 0.2 }
                }}
              />
            </span>
          </Tooltip>
        );
      }
    }),
    [customStudentSelections, isPhone]
  );

  const mainGridColumns = useMemo(
    () => [
      customDistributionSelectionColumn,
      ...(isDesktop ? columns : compactColumns)
    ],
    [customDistributionSelectionColumn, isDesktop, columns, compactColumns]
  );

  const totals = useMemo(
    () =>
      filteredGridRows.reduce(
        (result, row) => ({
          preBalance:
            result.preBalance +
            row.preBalance,
          debit:
            result.debit +
            row.debit,
          startPay:
            result.startPay +
            row.startPay,
          monthPay:
            result.monthPay +
            row.monthPay,
          feesPay:
            result.feesPay +
            row.feesPay,
          mDaily:
            result.mDaily +
            row.mDaily,
          dDaily:
            result.dDaily +
            row.dDaily,
          balance:
            result.balance +
            row.balance,
          paid:
            result.paid +
            (row.monthPay !== 0
              ? 1
              : 0),
          unpaid:
            result.unpaid +
            (row.monthPay === 0
              ? 1
              : 0)
        }),
        {
          preBalance: 0,
          debit: 0,
          startPay: 0,
          monthPay: 0,
          feesPay: 0,
          mDaily: 0,
          dDaily: 0,
          balance: 0,
          paid: 0,
          unpaid: 0
        }
      ),
    [filteredGridRows]
  );

  const postJson = async (
    path,
    body
  ) => {
    const response = await fetch(
      `${API_BASE_URL}/api/payment-follow/${path}`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify({
          userGuid,
          ...body
        })
      }
    );

    return readJson(response);
  };

  const confirmAction = async (
    title,
    text,
    action
  ) => {
    const confirmation =
      await Swal.fire({
        icon: "question",
        title,
        text,
        showCancelButton: true,
        confirmButtonText: "تأكيد",
        cancelButtonText: "إلغاء",
        confirmButtonColor: "#057546",
        cancelButtonColor: "#ae1e21",
        reverseButtons: true
      });

    if (!confirmation.isConfirmed) {
      return;
    }

    try {
      await action();
      await showSuccess(
        "تم التنفيذ بنجاح"
      );
      await loadData();
    } catch (error) {
      await showError(
        error?.message ||
        "تعذر تنفيذ العملية"
      );
    }
  };

  const clearTrainer = async (studentLevelGuid) => {
    if (!studentLevelGuid) {
      await showError(
        "بيانات الطالب غير مكتملة"
      );
      return;
    }

    await confirmAction(
      "حذف مسؤول الاتصال",
      "سيتم حذف مسؤول الاتصال من هذا الطالب فقط",
      () =>
        postJson(
          "clear-trainer",
          {
            studentLevelGuids: [
              studentLevelGuid
            ]
          }
        )
    );
  };

  const loadDistributionStatus = useCallback(async () => {
    if (!branch?.guid || !userGuid) {
      setDistributionStatus(null);
      return;
    }

    try {
      const params = new URLSearchParams({
        userGuid,
        branchGuid: branch.guid,
        branchName: branch.name || ""
      });

      const response = await fetch(
        `${API_BASE_URL}/api/payment-follow/monthly-distribution/status?${params.toString()}`
      );

      const result = await readJson(response);
      setDistributionStatus(result?.data || null);
    } catch (error) {
      setDistributionStatus({
        canExecute: false,
        message: error?.message || "تعذر التحقق من حالة التوزيع"
      });
    }
  }, [branch, userGuid]);

  useEffect(() => {
    loadDistributionStatus();
  }, [loadDistributionStatus]);

  const selectedDistributionTrainers = useMemo(
    () =>
      selectableTrainers
        .filter(
          (item) =>
            distributionSelections[
              item.guid
            ]?.selected
        )
        .map((item) => ({
          guid: item.guid,
          name: item.name,
          role:
            distributionSelections[
              item.guid
            ]?.role ||
            "primary"
        })),
    [
      selectableTrainers,
      distributionSelections
    ]
  );

  const openDistributionDialog = async () => {
    if (!branch?.guid) {
      await showError("برجاء اختيار الفرع أولًا");
      return;
    }

    if (isExcludedDistributionBranch(branch.name)) {
      await showError("هذا الفرع غير متاح للتوزيع");
      return;
    }

    await loadDistributionStatus();
    setDistributionPreview(null);
    setDistributionStep(1);
    setDistributionDialogOpen(true);
  };

  const closeDistributionDialog = () => {
    if (
      loadingDistribution ||
      previewingDistribution ||
      executingDistribution
    ) return;
    setDistributionDialogOpen(false);
    setDistributionPreview(null);
    setDistributionStep(1);
  };

  const toggleDistributionTrainer = (trainerItem) => {
    setDistributionSelections((current) => {
      const previous = current[trainerItem.guid];
      return {
        ...current,
        [trainerItem.guid]: previous?.selected
          ? { selected: false, role: previous.role || "primary" }
          : { selected: true, role: previous?.role || "primary" }
      };
    });
  };

  const changeDistributionRole = (trainerGuid, role) => {
    setDistributionSelections((current) => ({
      ...current,
      [trainerGuid]: { selected: true, role }
    }));
  };

  const previewDistribution = async () => {
    if (selectedDistributionTrainers.length === 0) {
      await showError("برجاء اختيار مدرب واحد على الأقل");
      return;
    }

    setLoadingDistribution(true);
    setPreviewingDistribution(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/payment-follow/monthly-distribution/preview`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            userGuid,
            branchGuid: branch.guid,
            branchName: branch.name || "",
            trainers: selectedDistributionTrainers
          })
        }
      );

      const result = await readJson(response);

      setDistributionPreview(
        result?.data || null
      );

      setDistributionStep(2);
    } catch (error) {
      await showError(
        error?.message ||
        "تعذر تجهيز معاينة التوزيع"
      );
    } finally {
      setPreviewingDistribution(false);
      setLoadingDistribution(false);
    }
  };

  const openDistributionConfirmation = () => {
    if (!distributionPreview) {
      return;
    }

    setConfirmDistributionOpen(true);
  };

  const closeDistributionConfirmation = () => {
    if (executingDistribution) {
      return;
    }

    setConfirmDistributionOpen(false);
  };

  const executeDistribution = async () => {
    if (!distributionPreview) return;

    setConfirmDistributionOpen(false);
    setLoadingDistribution(true);
    setExecutingDistribution(true);
    setDistributionProgressIndex(0);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/payment-follow/monthly-distribution/execute`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            userGuid,
            branchGuid:
              branch.guid,
            branchName:
              branch.name || "",
            trainers:
              selectedDistributionTrainers
          })
        }
      );

      const result =
        await readJson(response);

      /*
       * اقفل Dialog التحميل فور وصول نجاح الـBackend،
       * قبل إظهار رسالة النجاح. كده الـOverlay لا يفضل
       * شغال خلف SweetAlert ولا يحتاج المستخدم Refresh.
       */
      setExecutingDistribution(false);
      setLoadingDistribution(false);
      setDistributionProgressIndex(0);

      setConfirmDistributionOpen(false);
      setDistributionDialogOpen(false);
      setDistributionPreview(null);
      setDistributionStep(1);

      // ندي React فرصة يرسم إغلاق الـDialog قبل رسالة النجاح.
      await new Promise((resolve) =>
        window.requestAnimationFrame(() =>
          window.requestAnimationFrame(resolve)
        )
      );

      await Swal.fire({
        icon: "success",
        title: "تم التوزيع بنجاح",
        html: `
          <div style="
            direction:rtl;
            font-family:Cairo,Arial;
            line-height:2;
          ">
            تم توزيع
            <strong>
              ${result?.data?.totalStudents || 0}
            </strong>
            طالب على
            <strong>
              ${result?.data?.trainerCount || 0}
            </strong>
            مدرب.
            <br />
            تم تطبيق تدوير الطلاب بناءً على آخر توزيع محفوظ.
            ${
              result?.data?.fixedAssignmentCount
                ? `<br />تم تثبيت <strong>${result.data.fixedAssignmentCount}</strong> طالب حسب .`
                : ""
            }
          </div>
        `,
        confirmButtonText: "حسنًا",
        confirmButtonColor: "#057546"
      });

      await loadDistributionStatus();
      await loadData();
    } catch (error) {
      setExecutingDistribution(false);
      setLoadingDistribution(false);
      setDistributionProgressIndex(0);

      await new Promise((resolve) =>
        window.requestAnimationFrame(resolve)
      );

      await showError(
        error?.message ||
        "تعذر تنفيذ التوزيع"
      );
    } finally {
      // حماية إضافية لأي مسار خروج غير متوقع.
      setExecutingDistribution(false);
      setLoadingDistribution(false);
      setDistributionProgressIndex(0);
    }
  };

  const openCustomDistributionDialog = async () => {
    if (!branch?.guid) {
      await showError("برجاء اختيار الفرع أولًا");
      return;
    }

    if (!gridRows.length) {
      await showError("اعرض بيانات الفرع أولًا حتى نحدد الطلاب غير الموزعين");
      return;
    }

    if (!unassignedDistributionRows.length) {
      await showSuccess("لا يوجد طلاب غير موزعين", "كل الطلاب الظاهرين لديهم مسؤول اتصال حاليًا");
      return;
    }

    if (!selectedCustomStudents.length) {
      await showError("حدد الطلاب من الجريد أولًا عن طريق علامة الاختيار في عمود توزيع");
      return;
    }

    // اختيار الطلاب يتم من الجريد الرئيسي، لذلك لا نمسح التحديد عند فتح الـDialog.
    setCustomTrainerSelections({});
    setCustomDistributionPreview(null);
    setCustomDistributionStep(1);
    setCustomDistributionOpen(true);
  };

  const closeCustomDistributionDialog = () => {
    if (executingCustomDistribution) return;
    setCustomDistributionOpen(false);
    setCustomDistributionPreview(null);
    setCustomDistributionStep(1);
  };

  const toggleCustomStudent = (row) => {
    const key = row.studentLevelGuid || row.id;
    if (!key) return;

    setCustomStudentSelections((current) => ({
      ...current,
      [key]: !current[key]
    }));
  };

  const setAllVisibleCustomStudents = (checked) => {
    setCustomStudentSelections((current) => {
      const next = { ...current };
      visibleUnassignedDistributionRows.forEach((row) => {
        const key = row.studentLevelGuid || row.id;
        if (key) next[key] = checked;
      });
      return next;
    });
  };

  const toggleCustomTrainer = (trainerItem) => {
    setCustomTrainerSelections((current) => {
      const previous = current[trainerItem.guid];
      return {
        ...current,
        [trainerItem.guid]: previous?.selected
          ? { selected: false, role: previous.role || "primary" }
          : { selected: true, role: previous?.role || "primary" }
      };
    });
  };

  const changeCustomTrainerRole = (trainerGuid, role) => {
    setCustomTrainerSelections((current) => ({
      ...current,
      [trainerGuid]: { selected: true, role }
    }));
  };

  const buildCustomDistributionPreview = async () => {
    if (!selectedCustomStudents.length) {
      await showError("حدد طالبًا واحدًا على الأقل من الطلاب غير الموزعين");
      return;
    }

    if (!selectedCustomTrainers.length) {
      await showError("حدد مدربًا واحدًا على الأقل");
      return;
    }

    // نفس فكرة التوزيع الحالي: الأساسي وزنه 2، والمتعاون وزنه 1.
    // نختار في كل مرة أقل مدرب في (عدد الطلاب / الوزن) للحصول على توزيع متوازن.
    const buckets = selectedCustomTrainers.map((trainer) => ({
      ...trainer,
      roleLabel: trainer.role === "primary" ? "أساسي" : "متعاون",
      weight: trainer.role === "primary" ? 2 : 1,
      students: []
    }));

    const orderedStudents = [...selectedCustomStudents].sort((a, b) =>
      String(a.diplomName || "").localeCompare(String(b.diplomName || ""), "ar") ||
      String(a.studentName || "").localeCompare(String(b.studentName || ""), "ar")
    );

    orderedStudents.forEach((student) => {
      const target = [...buckets].sort((a, b) => {
        const aRatio = a.students.length / a.weight;
        const bRatio = b.students.length / b.weight;
        if (aRatio !== bRatio) return aRatio - bRatio;
        return a.students.length - b.students.length;
      })[0];
      target.students.push(student);
    });

    const assignments = buckets.flatMap((trainer) =>
      trainer.students.map((student) => ({
        studentLevelGuid: student.studentLevelGuid,
        studentName: student.studentName,
        nationalId: student.nationalId,
        diplomName: student.diplomName,
        trainerGuid: trainer.guid,
        trainerName: trainer.name,
        role: trainer.role
      }))
    );

    setCustomDistributionPreview({
      totalStudents: selectedCustomStudents.length,
      trainerCount: selectedCustomTrainers.length,
      trainers: buckets.map((trainer) => ({
        guid: trainer.guid,
        name: trainer.name,
        role: trainer.role,
        roleLabel: trainer.roleLabel,
        studentCount: trainer.students.length,
        students: trainer.students
      })),
      assignments
    });
    setCustomDistributionStep(2);
  };

  const executeCustomDistribution = async () => {
    if (!customDistributionPreview?.assignments?.length) return;

    const missingGuids = customDistributionPreview.assignments.filter(
      (item) => !isValidGuid(item.studentLevelGuid) || !isValidGuid(item.trainerGuid)
    );

    if (missingGuids.length) {
      await showError("يوجد طالب أو مدرب بياناته غير مكتملة، لا يمكن تنفيذ التوزيع بأمان");
      return;
    }

    const confirmation = await Swal.fire({
      icon: "question",
      title: "تأكيد التوزيع المخصص",
      html: `سيتم توزيع <strong>${customDistributionPreview.totalStudents}</strong> طالب غير موزع فقط على <strong>${customDistributionPreview.trainerCount}</strong> مدرب.`,
      showCancelButton: true,
      confirmButtonText: "تأكيد وبدء التوزيع",
      cancelButtonText: "رجوع",
      confirmButtonColor: "#057546",
      cancelButtonColor: "#6c757d",
      reverseButtons: true
    });

    if (!confirmation.isConfirmed) return;

    setExecutingCustomDistribution(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/payment-follow/custom-distribution/execute`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userGuid,
            branchGuid: branch.guid,
            branchName: branch.name || "",
            mode: "selected-unassigned-only",
            studentLevelGuids: customDistributionPreview.assignments.map(
              (item) => item.studentLevelGuid
            ),
            trainers: selectedCustomTrainers,
            assignments: customDistributionPreview.assignments.map((item) => ({
              studentLevelGuid: item.studentLevelGuid,
              trainerGuid: item.trainerGuid,
              role: item.role
            }))
          })
        }
      );

      const result = await readJson(response);

      setCustomDistributionOpen(false);
      setCustomDistributionPreview(null);
      setCustomDistributionStep(1);
      setCustomStudentSelections({});
      setCustomTrainerSelections({});

      await showSuccess(
        "تم التوزيع المخصص بنجاح",
        `تم توزيع ${result?.data?.totalStudents ?? customDistributionPreview.totalStudents} طالب غير موزع فقط`
      );

      await loadData();
    } catch (error) {
      await showError(
        error?.message ||
        "تعذر تنفيذ التوزيع المخصص. تأكد أن Endpoint custom-distribution/execute مضاف في الـBackend"
      );
    } finally {
      setExecutingCustomDistribution(false);
    }
  };

  const openActionDialog = (
    type,
    row
  ) => {
    setReason("");
    setAttachment(null);
    setSelectedNewBranch(null);
    setSelectedNewDiplom(null);

    setActionDialog({
      type,
      row
    });
  };

  const closeActionDialog = () => {
    if (savingAction) {
      return;
    }

    setActionDialog({
      type: "",
      row: null
    });

    setReason("");
    setAttachment(null);
    setSelectedNewBranch(null);
    setSelectedNewDiplom(null);
  };

  const submitFileAction =
    async () => {
      const {
        type,
        row
      } = actionDialog;

      if (!row) {
        return;
      }

      if (
        type === "dereg" &&
        !reason.trim()
      ) {
        await showError(
          "برجاء كتابة سبب طلب طي القيد"
        );
        return;
      }

      if (
        (
          type === "dereg" ||
          type === "defer"
        ) &&
        !attachment
      ) {
        await showError(
          "برجاء إرفاق الملف"
        );
        return;
      }

      if (
        type === "transfer-diplom" &&
        !selectedNewDiplom?.guid
      ) {
        await showError(
          "برجاء اختيار التخصص الجديد"
        );
        return;
      }

      if (
        type === "transfer-branch" &&
        !selectedNewBranch?.guid
      ) {
        await showError(
          "برجاء اختيار الفرع الجديد"
        );
        return;
      }

      setSavingAction(true);

      try {
        const form =
          new FormData();

        form.append(
          "userGuid",
          userGuid
        );

        form.append(
          "studentLevelGuid",
          row.studentLevelGuid
        );

        form.append(
          "accountGuid",
          row.accountGuid
        );

        form.append(
          "nationalId",
          row.nationalId || ""
        );

        form.append(
          "studentName",
          row.studentName || ""
        );

        form.append(
          "oldBranchName",
          row.branchName || ""
        );

        form.append(
          "oldDiplomName",
          row.diplomName || ""
        );

        if (attachment) {
          form.append(
            "file",
            attachment
          );
        }

        let endpoint = type;

        if (type === "dereg") {
          form.append(
            "reason",
            reason.trim()
          );

          form.append(
            "amount",
            String(row.balance || 0)
          );
        }

        if (
          type === "transfer-diplom"
        ) {
          /*
           * بعض صفوف AllStudentBalance لا ترجع DiplomGuid.
           * لا نرسل قيمة فارغة إلى Guid في ASP.NET حتى لا يحدث
           * Validation Error قبل دخول الـAction.
           */
          if (
            isValidGuid(
              row.diplomGuid
            )
          ) {
            form.append(
              "oldDiplomGuid",
              row.diplomGuid
            );
          }

          form.append(
            "newDiplomGuid",
            selectedNewDiplom.guid
          );

          form.append(
            "newDiplomName",
            selectedNewDiplom.name
          );
        }

        if (
          type === "transfer-branch"
        ) {
          form.append(
            "newBranchGuid",
            selectedNewBranch.guid
          );

          form.append(
            "newBranchName",
            selectedNewBranch.name
          );
        }

        const response = await fetch(
          `${API_BASE_URL}/api/payment-follow/${endpoint}`,
          {
            method: "POST",
            body: form
          }
        );

        const result =
          await readJson(response);

        closeActionDialog();

        await showSuccess(
          result?.message ||
          "تم حفظ الطلب بنجاح"
        );

        await loadData();
      } catch (error) {
        await showError(
          error?.message ||
          "تعذر حفظ الطلب"
        );
      } finally {
        setSavingAction(false);
      }
    };

const exportExcel = () => {
  if (!filteredGridRows.length) {
    showError("لا توجد بيانات متاحة للتصدير");
    return;
  }

  try {
    const headers = [
      "نوع التسجيل",
      "الدبلوم / الدورة",
      "الدفعة",
      "اسم الطالب",
      "رقم الجوال",
      "رقم الهوية",
      "الرصيد السابق",
      "مدين",
      "دفعة مقدمة",
      "قسط شهري",
      "سداد رسوم",
      "قيد مدين",
      "قيد دائن",
      "الرصيد الحالي",
      "مسؤول الاتصال",
      "نوع الطالب"
    ];

    const dataRows = filteredGridRows.map((row) => [
      String(row.regTypeName || ""),
      String(row.diplomName || ""),
      String(row.batchName || ""),
      String(row.studentName || ""),

      // تظل كنص حتى لا يحذف Excel الصفر الأول
      String(row.studentTel || ""),
      String(row.nationalId || ""),

      Number(row.preBalance || 0),
      Number(row.debit || 0),
      Number(row.startPay || 0),
      Number(row.monthPay || 0),
      Number(row.feesPay || 0),
      Number(row.mDaily || 0),
      Number(row.dDaily || 0),
      Number(row.balance || 0),

      String(row.trainerName || ""),
      String(row.studentType || "")
    ]);

    const totalsRow = [
      "",
      "",
      "",
      `الإجمالي — عدد الطلاب: ${filteredGridRows.length}`,
      "",
      "",
      Number(totals.preBalance || 0),
      Number(totals.debit || 0),
      Number(totals.startPay || 0),
      Number(totals.monthPay || 0),
      Number(totals.feesPay || 0),
      Number(totals.mDaily || 0),
      Number(totals.dDaily || 0),
      Number(totals.balance || 0),
      "",
      ""
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([
      headers,
      ...dataRows,
      totalsRow
    ]);

    // تحديد عرض الأعمدة
    worksheet["!cols"] = [
      { wch: 16 }, // نوع التسجيل
      { wch: 34 }, // الدبلوم
      { wch: 18 }, // الدفعة
      { wch: 30 }, // الطالب
      { wch: 16 }, // الجوال
      { wch: 16 }, // الهوية
      { wch: 16 }, // الرصيد السابق
      { wch: 14 }, // مدين
      { wch: 15 }, // دفعة مقدمة
      { wch: 14 }, // قسط شهري
      { wch: 14 }, // سداد رسوم
      { wch: 14 }, // قيد مدين
      { wch: 14 }, // قيد دائن
      { wch: 16 }, // الرصيد الحالي
      { wch: 26 }, // مسؤول الاتصال
      { wch: 15 }  // نوع الطالب
    ];

    // فلتر تلقائي للعناوين
    worksheet["!autofilter"] = {
      ref: `A1:P${dataRows.length + 1}`
    };

    // تثبيت الصف الأول
    worksheet["!freeze"] = {
      xSplit: 0,
      ySplit: 1,
      topLeftCell: "A2",
      activePane: "bottomLeft",
      state: "frozen"
    };

    // تنسيق الأعمدة المالية
    const financialColumns = [
      "G",
      "H",
      "I",
      "J",
      "K",
      "L",
      "M",
      "N"
    ];

    financialColumns.forEach((columnLetter) => {
      for (
        let rowIndex = 2;
        rowIndex <= dataRows.length + 2;
        rowIndex += 1
      ) {
        const cell = worksheet[`${columnLetter}${rowIndex}`];

        if (cell) {
          cell.t = "n";
          cell.z = '#,##0.00';
        }
      }
    });

    // التأكد من أن الجوال والهوية يتم حفظهما كنص
    ["E", "F"].forEach((columnLetter) => {
      for (
        let rowIndex = 2;
        rowIndex <= dataRows.length + 1;
        rowIndex += 1
      ) {
        const cell = worksheet[`${columnLetter}${rowIndex}`];

        if (cell) {
          cell.t = "s";
          cell.v = String(cell.v ?? "");
        }
      }
    });

    const workbook = XLSX.utils.book_new();

    workbook.Workbook = {
      Views: [
        {
          RTL: true
        }
      ]
    };

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "متابعة السداد"
    );

    const safeBranchName = String(branch?.name || "الفرع")
      .replace(/[\\/:*?"<>|]/g, "-")
      .trim();

    XLSX.writeFile(
      workbook,
      `متابعة السداد - ${safeBranchName} - ${fromDate} إلى ${toDate}.xlsx`,
      {
        compression: true
      }
    );
  } catch (error) {
    showError(
      error?.message ||
      "حدث خطأ أثناء تصدير ملف Excel"
    );
  }
};

  const selectedStatementStudent =
    statementStudent
      ? {
          ...statementStudent,
          AccountGuid:
            statementStudent.accountGuid,
          StudentName:
            statementStudent.studentName,
          NationalId:
            statementStudent.nationalId
        }
      : null;

  const dialogTitleMap = {
    dereg: "طلب طي قيد",
    defer:
      "إضافة إلى قوائم التأجيل",
    "transfer-diplom":
      "تحويل من تخصص إلى تخصص",
    "transfer-branch":
      "نقل من فرع إلى فرع"
  };

  return (
    <NavigationShell variant="standard" mobileOpen={mobileSidebarOpen} onMobileClose={() =>
            setMobileSidebarOpen(false)
          }><Box
      className="payment-follow-ui"
      sx={{
        minHeight: "100vh",
        background: theme.palette.mode === 'dark' ? theme.palette.background.default : "#f4f8f6",
        direction: "rtl",
        overflowX: "hidden"
      }}
    >
      <GlobalStyles styles={darkContractStyles} />
      <GlobalStyles styles={layoutSafetyStyles} />

      {!isDesktop && (
        <>
          <GlobalStyles
            styles={{
              ".MuiDrawer-root": {
                zIndex: "2100 !important"
              },
              ".MuiDrawer-root .MuiBackdrop-root": {
                zIndex: "2099 !important"
              },
              ".MuiDrawer-root .MuiDrawer-paper": {
                zIndex: "2101 !important"
              }
            }}
          />

          <AppBar
            position="fixed"
            elevation={0}
            sx={{
              top: 0,
              left: 0,
              right: 0,
              zIndex: 1400,
              background: isDark ? uiColors.section : "rgba(255,255,255,.97)",
              backdropFilter: "blur(14px)",
              color: isDark ? uiColors.text : "#173b2b",
              borderBottom: `1px solid ${isDark ? uiColors.border : "rgba(5,117,70,.12)"}`,
              direction: "rtl"
            }}
          >
            <Toolbar
              sx={{
                minHeight: {
                  xs: "var(--app-header-height, 56px)",
                  sm: "var(--app-header-height, 56px)"
                },
                px: { xs: 0.75, sm: 1 },
                gap: 0.8
              }}
            >
              <IconButton
                onClick={() =>
                  setMobileSidebarOpen(
                    (current) => !current
                  )
                }
                sx={{
                  width: { xs: 36, sm: 40 },
                  height: { xs: 36, sm: 40 },
                  color: "#fff",
                  background:
                    "linear-gradient(135deg,#057546,#034d31)",
                  boxShadow:
                    "0 5px 14px rgba(5,117,70,.20)"
                }}
              >
                <MenuRoundedIcon
                  sx={{
                    fontSize: {
                      xs: 20,
                      sm: 22
                    }
                  }}
                />
              </IconButton>

              <Typography
                sx={{
                  flex: 1,
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  fontSize: {
                    xs: "0.75rem",
                    sm: "0.78rem"
                  },
                  color: isDark ? uiColors.text : "#173b2b",
                  textAlign: "start"
                }}
              >
                متابعة السداد
              </Typography>
            </Toolbar>
          </AppBar>
        </>
      )}

      

      
      <PageContainer
        component="main"
        sx={{
          ...navigationContentSx,
          mt: isDesktop ? 0 : isPhone ? "var(--app-header-height, 56px)" : "var(--app-header-height, 56px)",
          direction: "rtl",
          minWidth: 0,
          maxWidth: "100%",
          boxSizing: "border-box",
          overflowX: "hidden"
        }}
      >
        <Paper
          elevation={0}
          sx={{
            borderRadius: 2.5,
            overflow: "hidden",
            border:
              "1px solid rgba(5,117,70,.14)"
          }}
        >
          <Box
            sx={{
              p: isDesktop
                ? 1.35
                : isPhone
                  ? 0.75
                  : 1,
              background: isDark
                ? uiColors.section
                : "linear-gradient(135deg,#fff,#eaf7f1)",
              borderBottom:
                "4px solid #057546"
            }}
          >
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
            >
              <Box
                sx={{
                  width: isDesktop ? 52 : isPhone ? 34 : 40,
                  height: isDesktop ? 52 : isPhone ? 34 : 40,
                  borderRadius: 3,
                  display: "grid",
                  placeItems: "center",
                  background:
                    "linear-gradient(135deg,#057546,#034d31)",
                  color: "white"
                }}
              >
                <PaymentsOutlinedIcon />
              </Box>

              <Box>
                <Typography
                  variant={isDesktop ? "h5" : "body1"}
                  fontWeight={900}
                  fontFamily="Cairo"
                  sx={{
                    fontSize: isDesktop
                      ? undefined
                      : isPhone
                        ? "0.75rem"
                        : "0.82rem"
                  }}
                >
                  متابعة السداد
                </Typography>

                {isDesktop && (
                  <Typography
                    fontFamily="Cairo"
                    color="text.secondary"
                  >
                    متابعة أرصدة الطلاب والتحصيل ومسؤولي الاتصال وتنفيذ إجراءات الطالب
                  </Typography>
                )}
              </Box>
            </Stack>
          </Box>

          <Box
            sx={{
              p: isDesktop
                ? 2
                : isPhone
                  ? 0.6
                  : 0.85
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: isDesktop ? 1.05 : 0.75,
                mb: isDesktop ? 1 : 0.7,
                borderRadius: 2,
                border:
                  "1px solid #dcebe4",
                background: isDark ? uiColors.nested : "#fbfdfc"
              }}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "repeat(2,minmax(0,1fr))",
                    sm: "repeat(2,minmax(0,1fr))",
                    md: "repeat(4,minmax(0,1fr))"
                  },
                  gap: { xs: 0.65, sm: 0.75 },
                  alignItems: "end",
                  minWidth: 0,
                  "& .MuiFormControl-root, & .MuiAutocomplete-root": {
                    width: "100%",
                    minWidth: "0 !important"
                  },
                  "& .MuiInputLabel-root": {
                    fontFamily: "Cairo"
                  },
                  "& .MuiInputBase-root": {
                    minHeight: isPhone ? 34 : 38,
                    fontFamily: "Cairo"
                  }
                }}
              >
                <TextField
                  type="date"
                  size="small"
                  label="من تاريخ"
                  value={fromDate}
                  onChange={(event) =>
                    setFromDate(event.target.value)
                  }
                  InputLabelProps={{ shrink: true }}
                  sx={uiLayout.formFieldSx}
                  inputProps={{
                    dir: "ltr",
                    style: {
                      direction: "ltr",
                      unicodeBidi: "isolate"
                    }
                  }}
                />

                <TextField
                  type="date"
                  size="small"
                  label="إلى تاريخ"
                  value={toDate}
                  onChange={(event) =>
                    setToDate(event.target.value)
                  }
                  InputLabelProps={{ shrink: true }}
                  sx={uiLayout.formFieldSx}
                  inputProps={{
                    dir: "ltr",
                    style: {
                      direction: "ltr",
                      unicodeBidi: "isolate"
                    }
                  }}
                />

                <Autocomplete
                  options={branches}
                  value={branch}
                  disabled={branches.length === 1}
                  onChange={(event, value) =>
                    setBranch(value)
                  }
                  getOptionLabel={(item) =>
                    item?.name || ""
                  }
                  isOptionEqualToValue={(first, second) =>
                    first.guid === second.guid
                  }
                  sx={{
                    minWidth: 0,
                    width: "100%"
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      label="الفرع"
                      InputLabelProps={{ shrink: true }}
                      sx={uiLayout.formFieldSx}
                    />
                  )}
                />

                <Autocomplete
                  options={batches}
                  value={batch}
                  onChange={(event, value) =>
                    setBatch(value)
                  }
                  getOptionLabel={(item) =>
                    item?.name || ""
                  }
                  isOptionEqualToValue={(first, second) =>
                    first.guid === second.guid
                  }
                  sx={{
                    minWidth: 0,
                    width: "100%"
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      label="الدفعة (اختياري)"
                      InputLabelProps={{ shrink: true }}
                      sx={uiLayout.formFieldSx}
                    />
                  )}
                />
              </Box>

              <Stack
                direction="row"
                useFlexGap
                flexWrap="wrap"
                spacing={0.7}
                sx={{
                  mt: 0.85,
                  alignItems: "center",
                  "& .MuiButton-root": {
                    width: "auto !important",
                    flex: "0 0 auto",
                    minWidth: isPhone ? 92 : 110,
                    minHeight: isPhone ? 32 : 35,
                    fontFamily: "Cairo",
                    fontSize: isPhone ? "0.75rem" : undefined
                  }
                }}
              >
                <Button
                  variant={isDark ? "outlined" : "contained"}
                  startIcon={<SearchIcon />}
                  onClick={loadData}
                  sx={uiLayout.withUiSx({
                    bgcolor: isDark ? "transparent" : "#057546",
                    color: isDark ? uiColors.border : "#fff",
                    borderColor: isDark ? uiColors.border : "#057546",
                    fontWeight: 900
                  }, uiLayout.buttonSx)}
                >
                  عرض
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={loadData}
                  sx={uiLayout.withUiSx({
                    fontWeight: 800
                  }, uiLayout.buttonSx)}
                >
                  تحديث
                </Button>

                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<FileDownloadIcon />}
                  onClick={exportExcel}
                  disabled={!filteredGridRows.length}
                  sx={uiLayout.withUiSx({
                    fontWeight: 800
                  }, uiLayout.buttonSx)}
                >
                  تصدير
                </Button>
              </Stack>
            </Paper>

            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              flexWrap="wrap"
              sx={{
                mb: isDesktop ? 1 : 0.7,
                p: { xs: 0.55, sm: 0.7 },
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: { xs: 0.4, sm: 0.6 },
                border: isDark
                  ? `1px solid ${uiColors.border}`
                  : "1px solid #dcebe4",
                borderRadius: 2,
                backgroundColor: isDark
                  ? uiColors.section
                  : "#fbfdfc",
                "& > *": {
                  minWidth: "0 !important"
                },
                "& .MuiChip-root": {
                  width: "auto !important",
                  flex: "0 0 auto",
                  height: isPhone ? 25 : 29,
                  fontFamily: "Cairo",
                  fontSize: isPhone ? "0.72rem" : "0.78rem"
                },
                "& .MuiButton-root": {
                  width: "auto !important",
                  flex: "0 0 auto",
                  minWidth: "unset !important",
                  minHeight: isPhone ? 29 : 33,
                  px: isPhone ? 0.8 : 1.1,
                  fontSize: isPhone ? "0.72rem" : "0.78rem",
                  whiteSpace: "nowrap"
                }
              }}
            >
              <Chip
                label={`العدد: ${filteredGridRows.length} من ${gridRows.length}`}
              />

              <Chip
                label={`المسددين: ${totals.paid}`}
                color="success"
              />

              <Chip
                label={`لم يسدد: ${totals.unpaid}`}
                color="error"
              />

              <Chip
                label={`إجمالي الرصيد: ${money(totals.balance)}`}
                color="primary"
              />

              <Button
                size="small"
                variant="outlined"
                startIcon={<FilterAltIcon />}
                onClick={() =>
                  setFilterDialogOpen(true)
                }
                sx={uiLayout.withUiSx({
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  ...(activeFilterCount
                    ? {
                        bgcolor: "#7b4d00",
                        "&:hover": {
                          bgcolor: "#5f3b00"
                        }
                      }
                    : {})
                }, uiLayout.buttonSx)}
              >
                الفلاتر المتقدمة
                {activeFilterCount
                  ? ` (${activeFilterCount})`
                  : ""}
              </Button>

              {activeFilterCount > 0 && (
                <Button
                  size="small"
                  color="error"
                  variant="text"
                  startIcon={<RestartAltIcon />}
                  onClick={resetColumnFilters}
                  sx={uiLayout.withUiSx({
                    fontFamily: "Cairo",
                    fontWeight: 900
                  }, uiLayout.buttonSx)}
                >
                  إلغاء الفلاتر
                </Button>
              )}

              <Button
                size="small"
                variant={isDark ? "outlined" : "contained"}
                startIcon={<Groups2Icon />}
                onClick={openDistributionDialog}
                disabled={
                  !branch?.guid ||
                  isExcludedDistributionBranch(branch?.name) ||
                  distributionStatus?.canExecute === false
                }
                sx={uiLayout.withUiSx({
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  background: "linear-gradient(135deg,#057546,#034d31)"
                }, uiLayout.buttonSx)}
              >
                تعيين مسؤولي الاتصال للشهر الحالي
              </Button>

              <Chip
                size="small"
                label={`المحدد للتوزيع: ${selectedCustomStudents.length}`}
                color={selectedCustomStudents.length ? "secondary" : "default"}
                variant={selectedCustomStudents.length ? "filled" : "outlined"}
                sx={{ fontFamily: "Cairo", fontWeight: 900 }}
              />

              <Button
                size="small"
                variant="text"
                onClick={() => setAllVisibleCustomStudents(true)}
                disabled={!visibleUnassignedDistributionRows.length}
                sx={uiLayout.withUiSx({ fontFamily: "Cairo", fontWeight: 900, color: "#6f42c1" }, uiLayout.buttonSx)}
              >
                تحديد غير الموزعين الظاهرين
              </Button>

              <Button
                size="small"
                variant="text"
                color="error"
                onClick={() => setCustomStudentSelections({})}
                disabled={!selectedCustomStudents.length}
                sx={uiLayout.withUiSx({ fontFamily: "Cairo", fontWeight: 900 }, uiLayout.buttonSx)}
              >
                إلغاء تحديد الطلاب
              </Button>

              <Button
                size="small"
                variant="outlined"
                startIcon={<PersonAddAlt1Icon />}
                onClick={openCustomDistributionDialog}
                disabled={!branch?.guid || !gridRows.length || !selectedCustomStudents.length}
                sx={uiLayout.withUiSx({
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  color: "#6f42c1",
                  borderColor: "rgba(111,66,193,.45)",
                  background: "#faf8ff",
                  "&:hover": {
                    borderColor: "#6f42c1",
                    background: "#f3edff"
                  }
                }, uiLayout.buttonSx)}
              >
                توزيع الطلاب المحددين ({selectedCustomStudents.length})
              </Button>

              {distributionStatus?.message && (
                <Chip
                  label={distributionStatus.message}
                  color={distributionStatus.canExecute ? "success" : "warning"}
                  variant="outlined"
                  sx={{ fontFamily: "Cairo", fontWeight: 800 }}
                />
              )}
            </Stack>

            <Box
              sx={uiLayout.withUiSx({
                height: isDesktop
                  ? 650
                  : isPhone
                    ? "calc(100dvh - 360px)"
                    : "calc(100dvh - 330px)",
                minHeight: isDesktop
                  ? undefined
                  : isPhone
                    ? 360
                    : 500,
                width: "100%",
                border:
                  "1px solid #dcebe4",
                borderRadius: 2,
                overflow: "hidden"
              }, uiLayout.tableContainerSx)}
            >
              <DataGrid
                rows={filteredGridRows}
                columns={mainGridColumns}
                loading={loading}
                rowHeight={
                  isDesktop
                    ? 50
                    : isPhone
                      ? 38
                      : 44
                }
                columnHeaderHeight={
                  isDesktop
                    ? 60
                    : isPhone
                      ? 32
                      : 42
                }
                disableRowSelectionOnClick
                disableColumnFilter
                disableColumnMenu={!isDesktop}
                showToolbar={isDesktop}
                disableColumnVirtualization={isDesktop}
                slots={{
                  toolbar: GridToolbar
                }}
                slotProps={{
                  toolbar: {
                    showQuickFilter: true,
                    quickFilterProps: {
                      debounceMs: 300
                    },
                    printOptions: {
                      disableToolbarButton: true
                    }
                  }
                }}
                pageSizeOptions={[
                  25,
                  50,
                  100
                ]}
                initialState={{
                  pagination: {
                    paginationModel: {
                      page: 0,
                      pageSize: 25
                    }
                  }
                }}
                getRowClassName={(params) => {
                  const key = params.row.studentLevelGuid || params.row.id;
                  const paymentClass = params.row.monthPay !== 0
                    ? "paid-row"
                    : "unpaid-row";
                  const selectedClass = customStudentSelections[key]
                    ? "custom-distribution-selected-row"
                    : "";
                  return `${paymentClass} ${selectedClass}`.trim();
                }}
                sx={uiLayout.withUiSx({
                  direction: "rtl",
                  fontFamily: "Cairo",
                  border: 0,

                  "& .MuiDataGrid-main": {
                    overflow: "hidden"
                  },

                  "& .MuiDataGrid-virtualScroller": {
                    overflowX:
                      "auto"
                  },

                  "& .MuiDataGrid-virtualScrollerContent": {
                    minWidth:
                      "100% !important"
                  },

                  "& .MuiDataGrid-columnHeaders": {
                    background:
                      "linear-gradient(135deg,#057546,#034d31)",
                    color: "#fff"
                  },

                  "& .MuiDataGrid-columnHeader": {
                    background:
                      "transparent",
                    px: 0.35
                  },

                  "& .MuiDataGrid-columnHeaderTitle": {
                    width: "100%",
                    overflow: "hidden",
                    textOverflow:
                      "ellipsis",
                    whiteSpace: "normal",
                    lineHeight: 1.25,
                    textAlign: "center",
                    fontSize: isDesktop
                      ? "0.75rem"
                      : isPhone
                        ? "0.75rem"
                        : "0.75rem",
                    fontWeight: 900,
                    whiteSpace: isDesktop
                      ? "normal"
                      : "nowrap"
                  },

                  "& .MuiDataGrid-cell": {
                    px: isDesktop
                      ? 0.25
                      : isPhone
                        ? 0.04
                        : 0.2,
                    fontSize: !isDesktop
                      ? isPhone
                        ? "0.75rem"
                        : "0.75rem"
                      : undefined,
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                      "center",
                    borderColor:
                      "#e5ece8",
                    overflow: "hidden"
                  },

                  "& .paid-row": {
                    backgroundColor:
                      "#ecfaef"
                  },

                  "& .unpaid-row": {
                    backgroundColor:
                      "#fff1f1"
                  },

                  "& .custom-distribution-selected-row": {
                    backgroundColor: "#f2ebff !important",
                    boxShadow: "inset 4px 0 0 #6f42c1"
                  },

                  "& .MuiDataGrid-row:hover": {
                    backgroundColor:
                      "#fff3d6"
                  },

                  ...(!isDesktop
                    ? {
                        "& .MuiDataGrid-menuIcon, & .MuiDataGrid-iconButtonContainer, & .MuiDataGrid-sortIcon": {
                          display: "none"
                        },
                        "& .MuiDataGrid-columnSeparator": {
                          display: "none"
                        },
                        "& .MuiDataGrid-columnHeaderTitleContainer": {
                          justifyContent: "center",
                          minWidth: 0,
                          overflow: "hidden"
                        },
                        "& .MuiDataGrid-toolbarContainer": {
                          display: "none"
                        }
                      }
                    : {})
                }, uiLayout.dataGridSx)}
              />
            </Box>

            <Box
              sx={{
                "& > .MuiPaper-root": {
                  mt: !isDesktop ? 0.7 : undefined,
                  p: !isDesktop
                    ? isPhone
                      ? 0.65
                      : 0.9
                    : undefined
                }
              }}
            >
              <PaymentTotalsSection
                totals={totals}
                rowCount={filteredGridRows.length}
              />
            </Box>
          </Box>
        </Paper>


        <Dialog sx={uiLayout.dialogLayoutSx}
          open={mobileDetailsOpen}
          onClose={closeMobileDetails}
          fullWidth
          maxWidth="lg"
          dir="rtl"
          PaperProps={{
            sx: {
              width: isPhone
                ? "94vw"
                : "90vw",
              maxWidth: isPhone
                ? "94vw"
                : "980px",
              maxHeight: isPhone
                ? "86dvh"
                : "84dvh",
              m: 1,
              borderRadius: 2.5,
              overflow: "hidden"
            }
          }}
        >
          <DialogTitle
            sx={{
              px: isPhone ? 1 : 1.5,
              py: isPhone ? 0.8 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 0.6,
              fontFamily: "Cairo",
              fontWeight: 950,
              color: "#057546",
              fontSize: isPhone
                ? "0.76rem"
                : "0.94rem"
            }}
          >
            <span>تفاصيل متابعة السداد</span>

            <IconButton
              onClick={closeMobileDetails}
              sx={{
                width: isPhone ? 30 : 34,
                height: isPhone ? 30 : 34,
                color: "#ae1e21"
              }}
            >
              <CloseIcon
                sx={{
                  fontSize: isPhone ? 18 : 20
                }}
              />
            </IconButton>
          </DialogTitle>

          <DialogContent
            dividers
            sx={{
              p: isPhone ? 0.8 : 1.1,
              overflowY: "auto"
            }}
          >
            {mobileDetailsRow ? (
              <>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: isPhone
                      ? "repeat(2,minmax(0,1fr))"
                      : "repeat(3,minmax(0,1fr))",
                    gap: isPhone ? 0.45 : 0.65
                  }}
                >
                  {[
                    ["اسم الطالب", mobileDetailsRow.studentName],
                    ["رقم الهوية", mobileDetailsRow.nationalId],
                    ["رقم الجوال", mobileDetailsRow.studentTel],
                    ["نوع التسجيل", mobileDetailsRow.regTypeName],
                    ["الدبلوم / الدورة", mobileDetailsRow.diplomName],
                    ["الدفعة", mobileDetailsRow.batchName],
                    ["مسؤول الاتصال", mobileDetailsRow.trainerName],
                    ["نوع الطالب", mobileDetailsRow.studentType],
                    ["الرصيد السابق", money(mobileDetailsRow.preBalance)],
                    ["مدين", money(mobileDetailsRow.debit)],
                    ["دفعة مقدمة", money(mobileDetailsRow.startPay)],
                    ["قسط شهري", money(mobileDetailsRow.monthPay)],
                    ["سداد رسوم", money(mobileDetailsRow.feesPay)],
                    ["قيد مدين", money(mobileDetailsRow.mDaily)],
                    ["قيد دائن", money(mobileDetailsRow.dDaily)],
                    ["الرصيد الحالي", money(mobileDetailsRow.balance)]
                  ].map(([label, value]) => (
                    <Box
                      key={label}
                      sx={{
                        minWidth: 0,
                        p: isPhone ? 0.55 : 0.72,
                        border:
                          "1px solid rgba(5,117,70,.14)",
                        borderRadius: 1.3,
                        backgroundColor: isDark ? uiColors.nested : "#fbfdfc"
                      }}
                    >
                      <Typography
                        sx={{
                          mb: 0.2,
                          fontFamily: "Cairo",
                          fontWeight: 900,
                          color: "#60756d",
                          fontSize: isPhone
                            ? "0.75rem"
                            : "0.75rem"
                        }}
                      >
                        {label}
                      </Typography>

                      <Typography
                        sx={{
                          fontFamily: "Cairo",
                          fontWeight: 800,
                          color: "#1f2d3d",
                          fontSize: isPhone
                            ? "0.75rem"
                            : "0.75rem",
                          wordBreak: "break-word"
                        }}
                      >
                        {value || "-"}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                <Stack
                  direction="row"
                  spacing={0.6}
                  useFlexGap
                  flexWrap="wrap"
                  sx={uiLayout.withUiSx({ mt: 1 }, uiLayout.actionBarSx)}
                >
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<PreviewIcon />}
                    onClick={() => {
                      setStatementStudent(
                        mobileDetailsRow
                      );
                      setStatementOpen(true);
                    }}
                    sx={uiLayout.withUiSx({
                      fontFamily: "Cairo",
                      fontWeight: 900,
                      fontSize: isPhone
                        ? "0.75rem"
                        : "0.75rem"
                    }, uiLayout.buttonSx)}
                  >
                    كشف الحساب
                  </Button>

                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() =>
                      openActionDialog(
                        "defer",
                        mobileDetailsRow
                      )
                    }
                    sx={uiLayout.withUiSx({
                      fontFamily: "Cairo",
                      fontWeight: 900,
                      fontSize: isPhone
                        ? "0.75rem"
                        : "0.75rem"
                    }, uiLayout.buttonSx)}
                  >
                    إجراءات الطالب
                  </Button>
                </Stack>
              </>
            ) : null}
          </DialogContent>

          <DialogActions
            sx={uiLayout.withUiSx({
              px: isPhone ? 1 : 1.5,
              py: isPhone ? 0.7 : 1
            }, uiLayout.dialogActionsSx)}
          >
            <Button
              variant="contained"
              onClick={closeMobileDetails}
              sx={uiLayout.withUiSx({
                backgroundColor: "#057546",
                fontFamily: "Cairo",
                fontWeight: 900,
                fontSize: isPhone
                  ? "0.75rem"
                  : "0.75rem"
              }, uiLayout.buttonSx)}
            >
              إغلاق
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog sx={uiLayout.dialogLayoutSx}
          open={filterDialogOpen}
          onClose={() =>
            setFilterDialogOpen(false)
          }
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: isPhone ? 2.5 : 4,
              width: !isDesktop
                ? isPhone
                  ? "94vw"
                  : "88vw"
                : undefined,
              maxHeight: !isDesktop
                ? "86dvh"
                : undefined,
              direction: "rtl",
              overflow: "hidden"
            }
          }}
        >
          <DialogTitle
            sx={{
              color: "#fff",
              background:
                "linear-gradient(135deg,#057546,#034d31)",
              fontFamily: "Cairo",
              fontWeight: 900,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
            >
              <FilterAltIcon />
              <Box>
                <Typography
                  sx={{
                    fontFamily: "Cairo",
                    fontWeight: 900
                  }}
                >
                  الفلاتر المتقدمة
                </Typography>
              </Box>
            </Stack>

            <IconButton
              onClick={() =>
                setFilterDialogOpen(false)
              }
              sx={{ color: "#fff" }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent
            dividers
            sx={{
              p: 2,
              background: isDark ? uiColors.section : "#f7faf8"
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(2,minmax(0,1fr))"
                },
                gap: 1.3
              }}
            >
              <MultiValueFilter
                label="نوع التسجيل"
                options={filterOptions.regTypeName}
                value={columnFilters.regTypeName}
                onChange={(values) =>
                  updateColumnFilter(
                    "regTypeName",
                    values
                  )
                }
              />

              <MultiValueFilter
                label="الدبلوم / الدورة"
                options={filterOptions.diplomName}
                value={columnFilters.diplomName}
                onChange={(values) =>
                  updateColumnFilter(
                    "diplomName",
                    values
                  )
                }
              />

              <MultiValueFilter
                label="المستوى"
                options={filterOptions.levelName}
                value={columnFilters.levelName}
                onChange={(values) =>
                  updateColumnFilter(
                    "levelName",
                    values
                  )
                }
              />

              <MultiValueFilter
                label="الشعبة"
                options={filterOptions.sectionName}
                value={columnFilters.sectionName}
                onChange={(values) =>
                  updateColumnFilter(
                    "sectionName",
                    values
                  )
                }
              />

              <MultiValueFilter
                label="الدفعة"
                options={filterOptions.batchName}
                value={columnFilters.batchName}
                onChange={(values) =>
                  updateColumnFilter(
                    "batchName",
                    values
                  )
                }
              />

              <MultiValueFilter
                label="مسؤول الاتصال"
                options={filterOptions.trainerName}
                value={columnFilters.trainerName}
                onChange={(values) =>
                  updateColumnFilter(
                    "trainerName",
                    values
                  )
                }
              />

              <MultiValueFilter
                label="نوع الطالب"
                options={filterOptions.studentType}
                value={columnFilters.studentType}
                onChange={(values) =>
                  updateColumnFilter(
                    "studentType",
                    values
                  )
                }
              />
            </Box>
          </DialogContent>

          <DialogActions
            sx={uiLayout.withUiSx({
              px: 2,
              py: 1.5,
              direction: "rtl"
            }, uiLayout.dialogActionsSx)}
          >
            <Button
              color="error"
              startIcon={<RestartAltIcon />}
              onClick={resetColumnFilters}
              disabled={!activeFilterCount}
              sx={uiLayout.withUiSx({
                fontFamily: "Cairo",
                fontWeight: 900
              }, uiLayout.buttonSx)}
            >
              مسح جميع الفلاتر
            </Button>

            <Box sx={{ flex: 1 }} />

            <Button
              variant={isDark ? "outlined" : "contained"}
              onClick={() =>
                setFilterDialogOpen(false)
              }
              sx={uiLayout.withUiSx({
                bgcolor: isDark ? "transparent" : "#057546",
                color: isDark ? uiColors.border : "#fff",
                borderColor: isDark ? uiColors.border : "#057546",
                fontFamily: "Cairo",
                fontWeight: 900,
                px: 3
              }, uiLayout.buttonSx)}
            >
              تطبيق وإغلاق
            </Button>
          </DialogActions>
        </Dialog>

        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() =>
            setMenuAnchor(null)
          }
          PaperProps={{
            sx: {
              minWidth: 260,
              direction: "rtl",
              fontFamily: "Cairo"
            }
          }}
        >
          <MenuItem
            onClick={() => {
              setMenuAnchor(null);
              setStatementStudent(
                menuRow
              );
              setStatementOpen(true);
            }}
          >
            <AccountBalanceWalletIcon
              sx={{ ml: 1 }}
            />
            كشف الحساب
          </MenuItem>

          <MenuItem
            onClick={() => {
              setMenuAnchor(null);
              clearTrainer(
                menuRow.id
              );
            }}
          >
            <PersonRemoveIcon
              sx={{ ml: 1 }}
            />
            حذف مسؤول الاتصال
          </MenuItem>

          <Divider />

          <MenuItem
            onClick={() => {
              setMenuAnchor(null);

              confirmAction(
                "تحويل لخريج",
                `تحويل ${menuRow?.studentName} إلى خريج؟`,
                () =>
                  postJson(
                    "graduate",
                    {
                      studentLevelGuid:
                        menuRow
                          .studentLevelGuid,
                      accountGuid:
                        menuRow
                          .accountGuid
                    }
                  )
              );
            }}
          >
            <SchoolIcon
              sx={{ ml: 1 }}
            />
            تحويل لخريج
          </MenuItem>

          <MenuItem
            onClick={() => {
              setMenuAnchor(null);
              openActionDialog(
                "dereg",
                menuRow
              );
            }}
          >
            <BlockIcon
              sx={{ ml: 1 }}
            />
            طلب طي قيد
          </MenuItem>

          <MenuItem
            onClick={() => {
              setMenuAnchor(null);
              openActionDialog(
                "defer",
                menuRow
              );
            }}
          >
            <PauseCircleOutlineIcon
              sx={{ ml: 1 }}
            />
            إضافة لقوائم التأجيل
          </MenuItem>

          <Divider />

          <MenuItem
            onClick={() => {
              setMenuAnchor(null);
              openActionDialog(
                "transfer-diplom",
                menuRow
              );
            }}
          >
            <SwapHorizIcon
              sx={{ ml: 1 }}
            />
            تحويل من تخصص إلى تخصص
          </MenuItem>

          <MenuItem
            onClick={() => {
              setMenuAnchor(null);
              openActionDialog(
                "transfer-branch",
                menuRow
              );
            }}
          >
            <SwapHorizIcon
              sx={{ ml: 1 }}
            />
            نقل من فرع إلى فرع
          </MenuItem>
        </Menu>

        <StudentStatementDialog2
          open={statementOpen}
          onClose={() => {
            setStatementOpen(false);
            setStatementStudent(null);
          }}
          student={
            selectedStatementStudent
          }
          apiBaseUrl={API_BASE_URL}
        />

        <Dialog sx={uiLayout.dialogLayoutSx}
          open={customDistributionOpen}
          onClose={closeCustomDistributionDialog}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 5,
              direction: "rtl",
              overflow: "hidden",
              boxShadow: "0 24px 70px rgba(62,38,104,0.22)"
            }
          }}
        >
          <DialogTitle
            sx={{
              p: 2.2,
              color: "#fff",
              background: "linear-gradient(135deg,#6f42c1 0%,#452780 100%)",
              borderBottom: "4px solid #d7a51f",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            <Stack direction="row" spacing={1.2} alignItems="center">
              <PersonAddAlt1Icon sx={{ fontSize: 34 }} />
              <Box>
                <Typography sx={{ fontFamily: "Cairo", fontWeight: 900 }}>
                  توزيع جديد — الطلاب غير الموزعين فقط
                </Typography>
                <Typography sx={{ fontFamily: "Cairo", fontSize: "0.78rem", color: "rgba(255,255,255,.82)" }}>
                  {branch?.name || ""} — تم اختيار {selectedCustomStudents.length} طالب من الجريد الرئيسي
                </Typography>
              </Box>
            </Stack>
            <IconButton onClick={closeCustomDistributionDialog} disabled={executingCustomDistribution} sx={{ color: "#fff" }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent
            dividers
            sx={{
              p: 2.2,
              background: isDark
                ? uiColors.section
                : "linear-gradient(180deg,#faf8ff 0%,#ffffff 100%)",
              maxHeight: "74vh"
            }}
          >
            {customDistributionStep === 1 ? (
              <>
                <Paper
                  elevation={0}
                  sx={{
                    mb: 1.5,
                    p: 1.5,
                    borderRadius: 3,
                    border: "1px solid #ded4f1",
                    background: "#f7f3ff"
                  }}
                >
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    alignItems={{ xs: "stretch", sm: "center" }}
                    justifyContent="space-between"
                  >
                    <Box>
                      <Typography sx={{ fontFamily: "Cairo", fontWeight: 900, color: "#452780" }}>
                        الطلاب تم اختيارهم من الجريد الرئيسي
                      </Typography>
                      <Typography sx={{ mt: 0.25, fontFamily: "Cairo", fontSize: "0.76rem", color: "text.secondary" }}>
                        تم تحديد {selectedCustomStudents.length} طالب غير موزع. أغلق النافذة إذا أردت تعديل اختيار الطلاب من الجريد.
                      </Typography>
                    </Box>
                    <Chip
                      label={`${selectedCustomStudents.length} طالب محدد`}
                      color="secondary"
                      sx={{ fontFamily: "Cairo", fontWeight: 900 }}
                    />
                  </Stack>
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    p: 1.6,
                    borderRadius: 3.5,
                    border: "1px solid #dce8e2",
                    background: "#fff"
                  }}
                >
                  <Typography sx={{ fontFamily: "Cairo", fontWeight: 900, color: "#034d31" }}>
                    اختر المدربين وحدد النوع
                  </Typography>
                  <Typography sx={{ mt: 0.35, mb: 1.2, fontFamily: "Cairo", fontSize: "0.76rem", color: "text.secondary", lineHeight: 1.8 }}>
                    الأساسي وزنه حصتان، والمتعاون حصة واحدة — وبعدها اضغط معاينة التوزيع.
                  </Typography>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2,minmax(0,1fr))",
                        lg: "repeat(3,minmax(0,1fr))"
                      },
                      gap: 1,
                      maxHeight: 455,
                      overflowY: "auto",
                      pr: 0.4
                    }}
                  >
                    {selectableTrainers.map((trainerItem) => {
                      const selection = customTrainerSelections[trainerItem.guid];
                      const checked = Boolean(selection?.selected);
                      const role = selection?.role || "primary";
                      return (
                        <Paper
                          key={trainerItem.guid}
                          elevation={0}
                          sx={{
                            p: 1,
                            borderRadius: 2.5,
                            border: checked ? "1px solid #057546" : "1px solid #e1ebe6",
                            background: checked ? "#f3fbf7" : "#fff"
                          }}
                        >
                          <Stack direction="row" alignItems="center" spacing={0.8}>
                            <Checkbox
                              checked={checked}
                              onChange={() => toggleCustomTrainer(trainerItem)}
                              sx={{ color: "#6f8b7d", "&.Mui-checked": { color: "#057546" } }}
                            />
                            <Typography
                              sx={{
                                flex: 1,
                                minWidth: 0,
                                fontFamily: "Cairo",
                                fontWeight: 900,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap"
                              }}
                            >
                              {trainerItem.name}
                            </Typography>
                            <Select
                              size="small"
                              value={role}
                              disabled={!checked}
                              onChange={(event) => changeCustomTrainerRole(trainerItem.guid, event.target.value)}
                              sx={{ minWidth: 112, fontFamily: "Cairo", fontWeight: 800 }}
                            >
                              <MenuItem value="primary" sx={{ fontFamily: "Cairo" }}>أساسي</MenuItem>
                              <MenuItem value="collaborator" sx={{ fontFamily: "Cairo" }}>متعاون</MenuItem>
                            </Select>
                          </Stack>
                        </Paper>
                      );
                    })}
                  </Box>
                </Paper>
              </>
            ) : (
              <>
                <Paper elevation={0} sx={{ mb: 1.5, p: 1.5, borderRadius: 3, border: "1px solid #ded4f1", background: "#f7f3ff" }}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} useFlexGap flexWrap="wrap">
                    <Chip label={`الطلاب المحددون: ${customDistributionPreview?.totalStudents || 0}`} sx={{ fontFamily: "Cairo", fontWeight: 900 }} />
                    <Chip label={`المدربون: ${customDistributionPreview?.trainerCount || 0}`} color="success" sx={{ fontFamily: "Cairo", fontWeight: 900 }} />
                    <Chip label="غير الموزعين فقط" color="secondary" variant="outlined" sx={{ fontFamily: "Cairo", fontWeight: 900 }} />
                  </Stack>
                </Paper>

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,minmax(0,1fr))", lg: "repeat(3,minmax(0,1fr))" }, gap: 1.2 }}>
                  {(customDistributionPreview?.trainers || []).map((trainer) => (
                    <Paper key={trainer.guid} elevation={0} sx={{ p: 1.3, borderRadius: 3, border: "1px solid #dce7e1", background: "#fff" }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography title={trainer.name} sx={{ fontFamily: "Cairo", fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {trainer.name}
                          </Typography>
                          <Typography sx={{ fontFamily: "Cairo", fontSize: "0.75rem", color: "text.secondary" }}>
                            {trainer.roleLabel}
                          </Typography>
                        </Box>
                        <Chip label={`${trainer.studentCount} طالب`} color={trainer.role === "primary" ? "success" : "warning"} size="small" />
                      </Stack>

                      <Box sx={{ mt: 1, maxHeight: 175, overflowY: "auto" }}>
                        {trainer.students.map((student) => (
                          <Box key={student.studentLevelGuid || student.id} sx={{ py: 0.55, borderTop: "1px dashed #edf1ef" }}>
                            <Typography sx={{ fontFamily: "Cairo", fontSize: "0.75rem", fontWeight: 800 }}>
                              {student.studentName}
                            </Typography>
                            <Typography sx={{ fontFamily: "Cairo", fontSize: "0.75rem", color: "text.secondary" }}>
                              <bdi dir="ltr">{student.nationalId}</bdi> — {student.diplomName}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Paper>
                  ))}
                </Box>

                <Paper elevation={0} sx={{ mt: 1.5, p: 1.4, borderRadius: 3, border: "1px solid #f0d58b", background: "#fff9e8" }}>
                  <Typography sx={{ fontFamily: "Cairo", fontSize: "0.8rem", fontWeight: 800, color: "#775100", lineHeight: 1.9 }}>
                    هذه الطريقة لن تلمس أي طالب لديه مسؤول اتصال بالفعل. التنفيذ يرسل فقط StudentLevelGuid للطلاب الذين حددتهم ومع كل طالب TrainerGuid المقترح له.
                  </Typography>
                </Paper>
              </>
            )}
          </DialogContent>

          <DialogActions sx={uiLayout.withUiSx({ p: 2, gap: 1 }, uiLayout.dialogActionsSx)}>
            <Button
              variant="outlined"
              color="inherit"
              onClick={customDistributionStep === 2 ? () => setCustomDistributionStep(1) : closeCustomDistributionDialog}
              disabled={executingCustomDistribution}
              sx={uiLayout.withUiSx({ fontFamily: "Cairo", fontWeight: 900 }, uiLayout.buttonSx)}
            >
              {customDistributionStep === 2 ? "رجوع للمدربين" : "إلغاء"}
            </Button>

            {customDistributionStep === 1 ? (
              <Button
                variant="contained"
                startIcon={<PreviewIcon />}
                onClick={buildCustomDistributionPreview}
                disabled={!selectedCustomStudents.length || !selectedCustomTrainers.length}
                sx={uiLayout.withUiSx({ fontFamily: "Cairo", fontWeight: 900, background: "linear-gradient(135deg,#6f42c1,#452780)" }, uiLayout.buttonSx)}
              >
                معاينة توزيع المحددين
              </Button>
            ) : (
              <Button
                variant="contained"
                startIcon={executingCustomDistribution ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                onClick={executeCustomDistribution}
                disabled={executingCustomDistribution}
                sx={uiLayout.withUiSx({ fontFamily: "Cairo", fontWeight: 900, background: "linear-gradient(135deg,#057546,#034d31)" }, uiLayout.buttonSx)}
              >
                {executingCustomDistribution ? "جارٍ التوزيع..." : "تأكيد وتنفيذ التوزيع"}
              </Button>
            )}
          </DialogActions>
        </Dialog>

        <Dialog sx={uiLayout.dialogLayoutSx}
          open={distributionDialogOpen}
          onClose={closeDistributionDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 5,
              direction: "rtl",
              overflow: "hidden",
              boxShadow: "0 24px 70px rgba(15,45,31,0.24)"
            }
          }}
        >
          <DialogTitle
            sx={{
              p: 2.2,
              color: "#fff",
              background:
                "linear-gradient(135deg,#057546 0%,#034d31 100%)",
              borderBottom: "4px solid #d7a51f",
              fontFamily: "Cairo",
              fontWeight: 900,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Groups2Icon sx={{ color: "#fff", fontSize: 34 }} />
              <Box>
                <Typography sx={{ fontFamily: "Cairo", fontWeight: 900 }}>التعيين الجماعي لمسؤولي الاتصال</Typography>
                <Typography sx={{ fontFamily: "Cairo", fontSize: "0.78rem", color: "rgba(255,255,255,.82)" }}>{branch?.name || ""}</Typography>
              </Box>
            </Stack>
            <IconButton onClick={closeDistributionDialog} disabled={loadingDistribution} sx={{ color: "#fff" }}><CloseIcon /></IconButton>
          </DialogTitle>

          <DialogContent
            dividers
            sx={{
              p: 2.5,
              background: isDark
                ? uiColors.section
                : "linear-gradient(180deg,#f7fbf9 0%,#ffffff 100%)",
              maxHeight: "72vh"
            }}
          >
            {distributionStatus?.canExecute === false ? (
              <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #f0b8b8", background: "#fff5f5" }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <WarningAmberIcon color="error" />
                  <Typography sx={{ fontFamily: "Cairo", fontWeight: 900, color: "#9b1c1c" }}>{distributionStatus?.message}</Typography>
                </Stack>
              </Paper>
            ) : distributionStep === 1 ? (
              <>
                <Paper
                  elevation={0}
                  sx={{
                    mb: 2,
                    p: 1.6,
                    borderRadius: 3,
                    border:
                      "1px solid rgba(5,117,70,0.13)",
                    background: "#f8fcfa"
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: "Cairo",
                      fontWeight: 900,
                      color: "#034d31"
                    }}
                  >
                    اختر المدربين المشاركين وحدد نوع كل مدرب
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.5,
                      fontFamily: "Cairo",
                      fontSize: "0.82rem",
                      color: "text.secondary"
                    }}
                  >
                    الأساسي وزنه 100%، والمتعاون وزنه 50%.
                    سيتم توزيع الطلاب بالتساوي النسبي.
                  </Typography>
                </Paper>

                {fixedCompanyTrainer && (
                  <Paper
                    elevation={0}
                    sx={{
                      mb: 2,
                      p: 1.55,
                      borderRadius: 3,
                      border:
                        "1px solid #e7b53d",
                      background:
                        "linear-gradient(135deg,#fff8dc,#ffffff)"
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={1.2}
                      alignItems="center"
                    >
                      <Box
                        sx={{
                          width: 42,
                          height: 42,
                          borderRadius: 2.5,
                          display: "grid",
                          placeItems: "center",
                          color: "#fff",
                          background:
                            "linear-gradient(135deg,#d89400,#b66d00)"
                        }}
                      >
                        <Groups2Icon />
                      </Box>

                      <Box>
                        <Typography
                          sx={{
                            fontFamily: "Cairo",
                            fontWeight: 900,
                            color: "#6d4700"
                          }}
                        >
                          تعيين تلقائي ثابت
                        </Typography>

                        <Typography
                          sx={{
                            mt: 0.2,
                            fontFamily: "Cairo",
                            fontSize: "0.84rem",
                            fontWeight: 800,
                            color: "#5e4a17"
                          }}
                        >
                          {fixedCompanyTrainer.displayName}
                          {" "}
                          (طلاب الشركات)
                        </Typography>

                        <Typography
                          sx={{
                            mt: 0.25,
                            fontFamily: "Cairo",
                            fontSize: "0.75rem",
                            color: "#7c6a3a"
                          }}
                        >
                          سيتم تعيين الطلاب المسجلين  له تلقائيًا،
                          لذلك لن يظهر ضمن اختيار المدربين.
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                )}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "repeat(1,minmax(0,1fr))",
                      md: "repeat(2,minmax(0,1fr))"
                    },
                    gap: 1,
                    maxHeight: 430,
                    overflowY: "auto",
                    pr: 0.4
                  }}
                >
                  {selectableTrainers.map((trainerItem) => {
                    const selection =
                      distributionSelections[
                        trainerItem.guid
                      ] || {};

                    return (
                      <Paper
                        key={trainerItem.guid}
                        elevation={0}
                        onClick={() =>
                          toggleDistributionTrainer(
                            trainerItem
                          )
                        }
                        sx={{
                          p: 1.25,
                          borderRadius: 3,
                          cursor: "pointer",
                          transition:
                            "all .18s ease",
                          border:
                            selection.selected
                              ? "2px solid #057546"
                              : "1px solid #dce7e1",
                          background:
                            selection.selected
                              ? "linear-gradient(135deg,#eaf8f1,#ffffff)"
                              : "#fff",
                          boxShadow:
                            selection.selected
                              ? "0 8px 20px rgba(5,117,70,.12)"
                              : "0 3px 10px rgba(31,45,61,.04)",
                          "&:hover": {
                            transform:
                              "translateY(-1px)",
                            borderColor:
                              "#48a47c"
                          }
                        }}
                      >
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                        >
                          <Checkbox
                            checked={Boolean(
                              selection.selected
                            )}
                            onClick={(event) =>
                              event.stopPropagation()
                            }
                            onChange={() =>
                              toggleDistributionTrainer(
                                trainerItem
                              )
                            }
                            sx={{
                              color: "#789188",
                              "&.Mui-checked": {
                                color: "#057546"
                              }
                            }}
                          />

                          <Box
                            sx={{
                              flex: 1,
                              minWidth: 0
                            }}
                          >
                            <Typography
                              title={
                                trainerItem.name
                              }
                              sx={{
                                fontFamily:
                                  "Cairo",
                                fontWeight: 900,
                                color: "#243b32",
                                overflow: "hidden",
                                textOverflow:
                                  "ellipsis",
                                whiteSpace:
                                  "nowrap"
                              }}
                            >
                              {trainerItem.name}
                            </Typography>

                            <Typography
                              sx={{
                                mt: 0.15,
                                fontFamily:
                                  "Cairo",
                                fontSize:
                                  "0.75rem",
                                color:
                                  selection.selected
                                    ? "#057546"
                                    : "text.secondary",
                                fontWeight: 700
                              }}
                            >
                              {selection.selected
                                ? "مشارك في التوزيع"
                                : "اضغط للاختيار"}
                            </Typography>
                          </Box>

                          <Select
                            size="small"
                            value={
                              selection.role ||
                              "primary"
                            }
                            disabled={
                              !selection.selected
                            }
                            onClick={(event) =>
                              event.stopPropagation()
                            }
                            onChange={(event) =>
                              changeDistributionRole(
                                trainerItem.guid,
                                event.target.value
                              )
                            }
                            sx={{
                              minWidth: 112,
                              fontFamily:
                                "Cairo",
                              fontWeight: 800,
                              borderRadius: 2.2,
                              background: "#fff"
                            }}
                          >
                            <MenuItem
                              value="primary"
                            >
                              أساسي
                            </MenuItem>

                            <MenuItem
                              value="collaborator"
                            >
                              متعاون
                            </MenuItem>
                          </Select>
                        </Stack>
                      </Paper>
                    );
                  })}
                </Box>
              </>
            ) : (
              <>
                <Paper elevation={0} sx={{ mb: 2, p: 1.7, borderRadius: 3, border: "1px solid #edcf78", background: "#fff9e8" }}>
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <WarningAmberIcon sx={{ color: "#b77900", mt: 0.3 }} />
                    <Box>
                      <Typography sx={{ fontFamily: "Cairo", fontWeight: 900, color: "#775100" }}>راجع التوزيع قبل التأكيد النهائي</Typography>
                      <Typography sx={{ mt: 0.5, fontFamily: "Cairo", fontSize: "0.82rem", lineHeight: 1.9 }}>
                        سيتم توزيع باقي الطلاب حيث يحصل المتعاون على نصف
                        حصة الأساسي، مع تدوير الأسماء عن آخر توزيع محفوظ.
                        أما الأسماء الموجودة في  فتُعيّن مباشرة
                        ولا تدخل في أي قاعدة من قواعد التوزيع.
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
                  <Chip label={`الشهر: ${distributionPreview?.periodLabel || "-"}`} />
                  <Chip label={`عدد الطلاب: ${distributionPreview?.totalStudents || 0}`} color="primary" />
                  <Chip label={`عدد التخصصات: ${distributionPreview?.diplomaCount || 0}`} color="secondary" />
                  <Chip label={`عدد المدربين: ${distributionPreview?.trainerCount || 0}`} color="success" />

                  {(distributionPreview?.fixedAssignmentCount || 0) > 0 && (
                    <Chip
                      label={`ثابت من: ${distributionPreview.fixedAssignmentCount}`}
                      sx={{
                        fontFamily: "Cairo",
                        fontWeight: 900,
                        background: "#fff3cd",
                        color: "#8a5a00",
                        border: "1px solid #efc34a"
                      }}
                    />
                  )}
                </Stack>
                {(distributionPreview?.fixedAssignments || []).length > 0 && (
                  <Paper
                    elevation={0}
                    sx={{
                      mb: 1.5,
                      p: 1.4,
                      borderRadius: 3,
                      border: "1px solid #efc34a",
                      background:
                        "linear-gradient(135deg,#fff8df,#ffffff)"
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: "Cairo",
                        fontWeight: 900,
                        color: "#7a5200"
                      }}
                    >
                      تعيينات ثابتة  
                    </Typography>

                    {(distributionPreview.fixedAssignments || []).map(
                      (item) => (
                        <Typography
                          key={item.trainerGuid}
                          sx={{
                            mt: 0.45,
                            fontFamily: "Cairo",
                            fontSize: "0.82rem",
                            fontWeight: 800,
                            color: "#5e4a17"
                          }}
                        >
                          {item.trainerName}: {item.studentCount} طالب
                        </Typography>
                      )
                    )}

                    <Typography
                      sx={{
                        mt: 0.65,
                        fontFamily: "Cairo",
                        fontSize: "0.75rem",
                        color: "#7c6a3a"
                      }}
                    >
                      هذه الأسماء خارج قواعد التوزيع، ولن تظهر ضمن المدربين المشاركين.
                    </Typography>
                  </Paper>
                )}

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "repeat(1,minmax(0,1fr))",
                      sm: "repeat(2,minmax(0,1fr))",
                      lg: "repeat(3,minmax(0,1fr))"
                    },
                    gap: 1,
                    mb: 2
                  }}
                >
                  {(distributionPreview?.trainers || []).map((item) => (
                    <Paper
                      key={item.guid}
                      elevation={0}
                      sx={{
                        p: 1.2,
                        borderRadius: 3,
                        border:
                          "1px solid #dce7e1",
                        background: "#fff",
                        boxShadow:
                          "0 4px 14px rgba(31,45,61,.05)"
                      }}
                    >
                      <Typography
                        title={item.name}
                        sx={{
                          fontFamily: "Cairo",
                          fontWeight: 900,
                          color: "#243b32",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {item.name}
                      </Typography>

                      <Stack
                        direction="row"
                        spacing={0.6}
                        useFlexGap
                        flexWrap="wrap"
                        sx={{ mt: 0.8 }}
                      >
                        <Chip
                          size="small"
                          label={item.roleLabel}
                          color={
                            item.role === "primary"
                              ? "success"
                              : "warning"
                          }
                        />

                        <Chip
                          size="small"
                          label={`الطلاب: ${item.studentCount}`}
                          variant="outlined"
                        />
                      </Stack>
                    </Paper>
                  ))}
                </Box>
                <Typography sx={{ mb: 1, fontFamily: "Cairo", fontWeight: 900 }}>توزيع التخصصات</Typography>
                <Box sx={{ maxHeight: 290, overflowY: "auto", border: "1px solid #dce7e1", borderRadius: 3 }}>
                  {(distributionPreview?.diplomas || []).map((diplomaItem) => (
                    <Box key={diplomaItem.name} sx={{ p: 1.2, borderBottom: "1px solid #e8eeeb", "&:last-child": { borderBottom: 0 } }}>
                      <Typography sx={{ fontFamily: "Cairo", fontWeight: 900 }}>{diplomaItem.name} — {diplomaItem.totalStudents} طالب</Typography>
                      <Typography sx={{ mt: 0.35, fontFamily: "Cairo", fontSize: "0.78rem", color: "text.secondary" }}>{diplomaItem.assignments.map((item) => `${item.trainerName}: ${item.studentCount}`).join(" — ")}</Typography>
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </DialogContent>

          <DialogActions sx={uiLayout.withUiSx({ p: 2, gap: 1 }, uiLayout.dialogActionsSx)}>
            <Button variant="outlined" color="inherit" onClick={distributionStep === 2 ? () => setDistributionStep(1) : closeDistributionDialog} disabled={loadingDistribution} sx={uiLayout.withUiSx({ fontFamily: "Cairo", fontWeight: 800 }, uiLayout.buttonSx)}>{distributionStep === 2 ? "رجوع" : "إلغاء"}</Button>
            {distributionStatus?.canExecute !== false && distributionStep === 1 && (
              <Button variant="contained" startIcon={<PreviewIcon />} onClick={previewDistribution} disabled={loadingDistribution || selectedDistributionTrainers.length === 0} sx={uiLayout.withUiSx({ background: "#057546", fontFamily: "Cairo", fontWeight: 900 }, uiLayout.buttonSx)}>معاينة التوزيع</Button>
            )}
            {distributionStatus?.canExecute !== false && distributionStep === 2 && (
              <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={
                    openDistributionConfirmation
                  }
                  disabled={loadingDistribution}
                  sx={uiLayout.withUiSx({
                    px: 2.4,
                    py: 1,
                    borderRadius: 2.6,
                    background:
                      "linear-gradient(135deg,#057546,#034d31)",
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    boxShadow:
                      "0 8px 18px rgba(5,117,70,.20)"
                  }, uiLayout.buttonSx)}
                >
                  مراجعة وتأكيد التنفيذ
                </Button>
            )}
          </DialogActions>
        </Dialog>

        <Dialog sx={uiLayout.dialogLayoutSx}
          open={previewingDistribution}
          disableEscapeKeyDown
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 5,
              overflow: "hidden",
              direction: "rtl"
            }
          }}
        >
          <Box
            sx={{
              px: 3,
              py: 4,
              textAlign: "center",
              background: isDark
                ? uiColors.section
                : "linear-gradient(180deg,#ffffff 0%,#eef9f3 100%)"
            }}
          >
            <Box
              sx={{
                width: 82,
                height: 82,
                mx: "auto",
                mb: 2,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                position: "relative",
                background:
                  "linear-gradient(135deg,#057546,#034d31)",
                boxShadow:
                  "0 16px 36px rgba(5,117,70,.24)"
              }}
            >
              <CircularProgress
                size={98}
                thickness={2.2}
                sx={{
                  position: "absolute",
                  color: "#d7a51f"
                }}
              />

              <PreviewIcon
                sx={{
                  color: "#fff",
                  fontSize: 38
                }}
              />
            </Box>

            <Typography
              variant="h6"
              sx={{
                fontFamily: "Cairo",
                fontWeight: 900,
                color: "#034d31"
              }}
            >
              يتم الآن تجهيز معاينة التوزيع
            </Typography>

            <Typography
              sx={{
                mt: 1,
                fontFamily: "Cairo",
                fontSize: "0.84rem",
                color: "#60736a",
                lineHeight: 1.9
              }}
            >
              نقوم بحساب أعداد الطلاب، ومراجعة التوزيع السابق،
              وتطبيق أوزان المدربين الأساسيين والمتعاونين.
            </Typography>

            <LinearProgress
              sx={{
                mt: 2.4,
                height: 8,
                borderRadius: 8,
                backgroundColor: "#dcebe4",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 8,
                  background:
                    "linear-gradient(90deg,#057546,#d7a51f)"
                }
              }}
            />
          </Box>
        </Dialog>

        <Dialog sx={uiLayout.dialogLayoutSx}
          open={confirmDistributionOpen}
          onClose={closeDistributionConfirmation}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 5,
              overflow: "hidden",
              direction: "rtl",
              boxShadow:
                "0 28px 80px rgba(15,45,31,.28)"
            }
          }}
        >
          <DialogTitle
            sx={{
              p: 2.2,
              color: "#fff",
              background:
                "linear-gradient(135deg,#057546 0%,#034d31 100%)",
              borderBottom: "4px solid #d7a51f"
            }}
          >
            <Stack
              direction="row"
              spacing={1.2}
              alignItems="center"
            >
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: 3,
                  display: "grid",
                  placeItems: "center",
                  background:
                    "rgba(255,255,255,.14)"
                }}
              >
                <WarningAmberIcon
                  sx={{
                    color: "#ffe08a",
                    fontSize: 30
                  }}
                />
              </Box>

              <Box>
                <Typography
                  sx={{
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    fontSize: "1.15rem"
                  }}
                >
                  التأكيد النهائي للتوزيع
                </Typography>

                <Typography
                  sx={{
                    mt: 0.25,
                    fontFamily: "Cairo",
                    fontSize: "0.78rem",
                    color:
                      "rgba(255,255,255,.82)"
                  }}
                >
                  راجع الملخص قبل بدء عملية التعيين
                </Typography>
              </Box>
            </Stack>
          </DialogTitle>

          <DialogContent
            sx={{
              p: 2.5,
              background: isDark
                ? uiColors.section
                : "linear-gradient(180deg,#f7fbf9,#ffffff)"
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(1,minmax(0,1fr))",
                  sm: "repeat(3,minmax(0,1fr))"
                },
                gap: 1,
                mb: 2
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 1.4,
                  borderRadius: 3,
                  border:
                    "1px solid #dce7e1",
                  background: "#fff"
                }}
              >
                <Typography
                  sx={{
                    fontFamily: "Cairo",
                    fontSize: "0.75rem",
                    color: "text.secondary",
                    fontWeight: 800
                  }}
                >
                  الفرع
                </Typography>

                <Typography
                  sx={{
                    mt: 0.4,
                    fontFamily: "Cairo",
                    fontWeight: 900
                  }}
                >
                  {branch?.name || "-"}
                </Typography>
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  p: 1.4,
                  borderRadius: 3,
                  border:
                    "1px solid #dce7e1",
                  background: "#fff"
                }}
              >
                <Typography
                  sx={{
                    fontFamily: "Cairo",
                    fontSize: "0.75rem",
                    color: "text.secondary",
                    fontWeight: 800
                  }}
                >
                  شهر التوزيع
                </Typography>

                <Typography
                  sx={{
                    mt: 0.4,
                    fontFamily: "Cairo",
                    fontWeight: 900
                  }}
                >
                  {distributionPreview?.periodLabel || "-"}
                </Typography>
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  p: 1.4,
                  borderRadius: 3,
                  border:
                    "1px solid #dce7e1",
                  background: "#fff"
                }}
              >
                <Typography
                  sx={{
                    fontFamily: "Cairo",
                    fontSize: "0.75rem",
                    color: "text.secondary",
                    fontWeight: 800
                  }}
                >
                  إجمالي الطلاب
                </Typography>

                <Typography
                  sx={{
                    mt: 0.4,
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    color: "#057546",
                    fontSize: "1.05rem"
                  }}
                >
                  {distributionPreview?.totalStudents || 0}
                </Typography>
              </Paper>
            </Box>

            {(distributionPreview?.fixedAssignments || []).length > 0 && (
              <Paper
                elevation={0}
                sx={{
                  mb: 1.5,
                  p: 1.35,
                  borderRadius: 3,
                  border: "1px solid #efc34a",
                  background: "#fff9e8"
                }}
              >
                <Typography
                  sx={{
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    color: "#775100"
                  }}
                >
                  التعيينات الثابتة
                </Typography>

                {(distributionPreview.fixedAssignments || []).map(
                  (item) => (
                    <Typography
                      key={item.trainerGuid}
                      sx={{
                        mt: 0.35,
                        fontFamily: "Cairo",
                        fontSize: "0.8rem",
                        fontWeight: 800
                      }}
                    >
                      {item.trainerName}: {item.studentCount} طالب  
                    </Typography>
                  )
                )}
              </Paper>
            )}

            <Typography
              sx={{
                mb: 1,
                fontFamily: "Cairo",
                fontWeight: 900,
                color: "#243b32"
              }}
            >
              المدربون المشاركون في توزيع باقي الطلاب
            </Typography>

            <Box
              sx={{
                maxHeight: 250,
                overflowY: "auto",
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(1,minmax(0,1fr))",
                  sm: "repeat(2,minmax(0,1fr))"
                },
                gap: 0.8,
                p: 0.3
              }}
            >
              {(distributionPreview?.trainers || []).map((item) => (
                <Paper
                  key={item.guid}
                  elevation={0}
                  sx={{
                    p: 1.1,
                    borderRadius: 2.5,
                    border:
                      "1px solid #dce7e1",
                    background: "#fff"
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                  >
                    <Box
                      sx={{
                        width: 34,
                        height: 34,
                        borderRadius: 2,
                        display: "grid",
                        placeItems: "center",
                        color: "#fff",
                        background:
                          item.role === "primary"
                            ? "#057546"
                            : "#d89400"
                      }}
                    >
                      <Groups2Icon
                        sx={{
                          fontSize: 20
                        }}
                      />
                    </Box>

                    <Box
                      sx={{
                        flex: 1,
                        minWidth: 0
                      }}
                    >
                      <Typography
                        title={item.name}
                        sx={{
                          fontFamily: "Cairo",
                          fontWeight: 900,
                          overflow: "hidden",
                          textOverflow:
                            "ellipsis",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {item.name}
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.1,
                          fontFamily: "Cairo",
                          fontSize: "0.75rem",
                          color:
                            "text.secondary"
                        }}
                      >
                        {item.roleLabel}
                        {" — "}
                        {item.studentCount} طالب
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              ))}
            </Box>

            <Paper
              elevation={0}
              sx={{
                mt: 2,
                p: 1.5,
                borderRadius: 3,
                border:
                  "1px solid #f0d58b",
                background: "#fff9e8"
              }}
            >
              <Typography
                sx={{
                  fontFamily: "Cairo",
                  fontSize: "0.82rem",
                  fontWeight: 800,
                  color: "#775100",
                  lineHeight: 1.9
                }}
              >
                سيتم التوزيع  بالتساوي النسبي؛ المتعاون
                يحصل على نصف حصة الأساسي. كما سيتم تدوير الطلاب
                بعيدًا عن مسؤول الاتصال السابق كلما توفر بديل.
              </Typography>
            </Paper>
          </DialogContent>

          <DialogActions
            sx={uiLayout.withUiSx({
              p: 2,
              gap: 1,
              borderTop:
                "1px solid #e6ece9"
            }, uiLayout.dialogActionsSx)}
          >
            <Button
              variant="outlined"
              color="inherit"
              onClick={
                closeDistributionConfirmation
              }
              sx={uiLayout.withUiSx({
                minWidth: 110,
                fontFamily: "Cairo",
                fontWeight: 900
              }, uiLayout.buttonSx)}
            >
              رجوع
            </Button>

            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={executeDistribution}
              sx={uiLayout.withUiSx({
                minWidth: 190,
                py: 1,
                borderRadius: 2.5,
                background:
                  "linear-gradient(135deg,#057546,#034d31)",
                fontFamily: "Cairo",
                fontWeight: 900,
                boxShadow:
                  "0 8px 18px rgba(5,117,70,.22)"
              }, uiLayout.buttonSx)}
            >
              تأكيد وبدء التوزيع
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog sx={uiLayout.dialogLayoutSx}
          open={executingDistribution}
          disableEscapeKeyDown
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 5,
              overflow: "hidden",
              direction: "rtl"
            }
          }}
        >
          <Box
            sx={{
              px: 3,
              py: 4,
              textAlign: "center",
              background: isDark
                ? uiColors.section
                : "linear-gradient(180deg,#ffffff 0%,#f0faf5 100%)"
            }}
          >
            <Box
              sx={{
                width: 94,
                height: 94,
                mx: "auto",
                mb: 2.2,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                position: "relative",
                background:
                  "linear-gradient(135deg,#057546,#034d31)",
                boxShadow:
                  "0 18px 40px rgba(5,117,70,.26)"
              }}
            >
              <CircularProgress
                size={110}
                thickness={2.2}
                sx={{
                  position: "absolute",
                  color: "#d7a51f"
                }}
              />

              <Groups2Icon
                sx={{
                  color: "#fff",
                  fontSize: 44
                }}
              />
            </Box>

            <Typography
              variant="h5"
              sx={{
                fontFamily: "Cairo",
                fontWeight: 900,
                color: "#034d31"
              }}
            >
              يتم الآن تعيين مسؤولي الاتصال
            </Typography>

            <Typography
              sx={{
                mt: 1,
                minHeight: 30,
                fontFamily: "Cairo",
                fontWeight: 800,
                color: "#5f7169"
              }}
            >
              {
                distributionProgressMessages[
                  distributionProgressIndex
                ]
              }
            </Typography>

            <LinearProgress
              sx={{
                mt: 2.5,
                height: 9,
                borderRadius: 8,
                backgroundColor: "#dcebe4",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 8,
                  background:
                    "linear-gradient(90deg,#057546,#d7a51f)"
                }
              }}
            />

            <Paper
              elevation={0}
              sx={{
                mt: 2.5,
                p: 1.5,
                borderRadius: 3,
                border: "1px solid #f1d58b",
                background: "#fff9e8"
              }}
            >
              <Typography
                sx={{
                  fontFamily: "Cairo",
                  fontSize: "0.82rem",
                  fontWeight: 800,
                  color: "#775100",
                  lineHeight: 1.9
                }}
              >
                برجاء عدم إغلاق الصفحة. قد تستغرق العملية بعض الوقت
                حسب عدد الطلاب، وسيتم حفظ سجل كامل بعد اكتمال التوزيع.
              </Typography>
            </Paper>
          </Box>
        </Dialog>

        <Dialog sx={uiLayout.dialogLayoutSx}
          open={Boolean(
            actionDialog.type
          )}
          onClose={
            closeActionDialog
          }
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              direction: "rtl"
            }
          }}
        >
          <DialogTitle
            sx={{
              p: 2,
              borderBottom:
                "1px solid #e6ece9",
              fontFamily: "Cairo",
              fontWeight: 900,
              display: "flex",
              alignItems: "center",
              justifyContent:
                "space-between"
            }}
          >
            {
              dialogTitleMap[
                actionDialog.type
              ]
            }

            <IconButton
              onClick={
                closeActionDialog
              }
              disabled={savingAction}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent
            dividers
            sx={{ p: 2.5 }}
          >
            <StudentInfo
              row={actionDialog.row}
            />

            {actionDialog.type ===
              "dereg" && (
              <TextField InputLabelProps={{ shrink: true }}
                fullWidth
                multiline
                minRows={4}
                label="سبب طلب طي القيد"
                value={reason}
                onChange={(event) =>
                  setReason(
                    event.target.value
                  )
                }
                sx={uiLayout.withUiSx({ mb: 2 }, uiLayout.formFieldSx)}
              />
            )}

            {actionDialog.type ===
              "transfer-diplom" && (
              <Autocomplete
                options={diploms}
                value={
                  selectedNewDiplom
                }
                onChange={(
                  event,
                  value
                ) =>
                  setSelectedNewDiplom(
                    value
                  )
                }
                getOptionLabel={(
                  item
                ) =>
                  item?.name || ""
                }
                isOptionEqualToValue={(
                  first,
                  second
                ) =>
                  first.guid ===
                  second.guid
                }
                renderInput={(params) => (
                  <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                    {...params}
                    label="اسم التخصص/الدبلوم الجديد"
                    placeholder="اختر التخصص الجديد"
                  />
                )}
                sx={{ mb: 2 }}
              />
            )}

            {actionDialog.type ===
              "transfer-branch" && (
              <Autocomplete
                options={branches.filter(
                  (item) =>
                    item.guid !==
                    branch?.guid
                )}
                value={
                  selectedNewBranch
                }
                onChange={(
                  event,
                  value
                ) =>
                  setSelectedNewBranch(
                    value
                  )
                }
                getOptionLabel={(
                  item
                ) =>
                  item?.name || ""
                }
                isOptionEqualToValue={(
                  first,
                  second
                ) =>
                  first.guid ===
                  second.guid
                }
                renderInput={(params) => (
                  <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                    {...params}
                    label="اسم الفرع الجديد"
                    placeholder="اختر الفرع الجديد"
                  />
                )}
                sx={{ mb: 2 }}
              />
            )}

            <Button
              component="label"
              variant="outlined"
              fullWidth
              startIcon={
                <AttachFileIcon />
              }
              sx={uiLayout.withUiSx({
                minHeight: 52,
                fontFamily: "Cairo",
                fontWeight: 900
              }, uiLayout.buttonSx)}
            >
              {attachment
                ? attachment.name
                : actionDialog.type ===
                  "defer"
                ? "إرفاق مستند طلب التأجيل"
                : actionDialog.type ===
                  "dereg"
                ? "إرفاق مستند طي القيد"
                : "إرفاق ملف الطلب (اختياري)"}

              <input
                hidden
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(event) =>
                  setAttachment(
                    event.target
                      .files?.[0] ||
                    null
                  )
                }
              />
            </Button>

            {(actionDialog.type ===
              "dereg" ||
              actionDialog.type ===
                "defer") && (
              <Typography
                sx={{
                  mt: 1,
                  color: "#ae1e21",
                  fontFamily: "Cairo",
                  fontWeight: 800,
                  fontSize: "0.78rem"
                }}
              >
                المرفق مطلوب ويقبل PDF أو JPG أو PNG.
              </Typography>
            )}
          </DialogContent>

          <DialogActions
            sx={uiLayout.withUiSx({
              p: 2,
              gap: 1
            }, uiLayout.dialogActionsSx)}
          >
            <Button
              variant="outlined"
              color="inherit"
              onClick={
                closeActionDialog
              }
              disabled={savingAction}
              sx={uiLayout.withUiSx({
                fontFamily: "Cairo",
                fontWeight: 800
              }, uiLayout.buttonSx)}
            >
              إلغاء
            </Button>

            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={
                submitFileAction
              }
              disabled={savingAction}
              sx={uiLayout.withUiSx({
                background: "#057546",
                fontFamily: "Cairo",
                fontWeight: 900
              }, uiLayout.buttonSx)}
            >
              {savingAction
                ? "جارٍ الحفظ..."
                : "حفظ الطلب"}
            </Button>
          </DialogActions>
        </Dialog>
      </PageContainer>
    </Box></NavigationShell>
  );
};

export default PaymentFollowReport;