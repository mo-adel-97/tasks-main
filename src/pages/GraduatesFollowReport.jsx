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
  GlobalStyles,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";

import MoreVertIcon from "@mui/icons-material/MoreVert";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PaymentIcon from "@mui/icons-material/Payment";
import SchoolIcon from "@mui/icons-material/School";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import GroupsIcon from "@mui/icons-material/Groups";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import CloseIcon from "@mui/icons-material/Close";

import Swal from "sweetalert2";

import StudentStatementDialog2 from "../components/StudentStatementDialog2";
import StudentRegFeesDialog from "../components/StudentRegFeesDialog";
import StudentPaymentOrderDialog from "../components/StudentPaymentOrderDialog";



const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "https://api4.sstli.com";

const pad2 = (value) =>
  String(value).padStart(2, "0");

const toIsoDate = (date) =>
  `${date.getFullYear()}-${pad2(
    date.getMonth() + 1
  )}-${pad2(date.getDate())}`;

const today = () => toIsoDate(new Date());

const unwrap = (value) => {
  if (value === null || value === undefined) return value;
  if (typeof value !== "object") return value;

  for (const key of [
    "value", "Value", "data", "Data",
    "amount", "Amount", "number", "Number",
    "string", "String"
  ]) {
    if (
      value[key] !== undefined &&
      value[key] !== null &&
      value[key] !== value
    ) {
      return unwrap(value[key]);
    }
  }

  return "";
};

const pick = (row, names, fallback = "") => {
  for (const name of names) {
    const value = unwrap(row?.[name]);

    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      return value;
    }
  }

  return fallback;
};

const toNumber = (value) => {
  const result = Number(
    String(unwrap(value) ?? "0")
      .replace(/,/g, "")
  );

  return Number.isFinite(result)
    ? result
    : 0;
};

const money = (value) =>
  toNumber(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const readJson = async (response) => {
  const text = await response.text();
  let json = null;

  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!response.ok) {
    throw new Error(
      json?.message ||
      json?.details ||
      json?.title ||
      text?.replace(/<[^>]*>/g, " ")
        ?.replace(/\s+/g, " ")
        ?.trim()
        ?.slice(0, 700) ||
      `تعذر تنفيذ الطلب - HTTP ${response.status}`
    );
  }

  return json || {};
};

const showError = (message) =>
  Swal.fire({
    icon: "error",
    title: "حدث خطأ",
    text: message,
    confirmButtonText: "حسنًا",
    confirmButtonColor: "#ae1e21"
  });

const showSuccess = (message) =>
  Swal.fire({
    icon: "success",
    title: "تم التنفيذ بنجاح",
    text: message,
    confirmButtonText: "حسنًا",
    confirmButtonColor: "#057546"
  });

const TextCell = ({
  value,
  align = "center"
}) => (
  <Tooltip title={String(value || "")} arrow>
    <Typography
      sx={{
        width: "100%",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        textAlign: align,
        fontFamily: "Cairo",
        fontSize: "0.76rem",
        fontWeight: 700,
        "@media (max-width: 599px)": {
          fontSize: "0.75rem",
          lineHeight: 1.05
        },
        [`@media (min-width: 600px) and (max-width: ${DESKTOP_BREAKPOINT - 0.05}px)`]: {
          fontSize: "0.75rem",
          lineHeight: 1.15
        }
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
      "@media (max-width: 599px)": {
        fontSize: "0.75rem",
        lineHeight: 1.05
      },
      [`@media (min-width: 600px) and (max-width: ${DESKTOP_BREAKPOINT - 0.05}px)`]: {
        fontSize: "0.75rem",
        lineHeight: 1.15
      }
    }}
  >
    {money(value)}
  </Typography>
);


const MultiValueFilter = ({
  label,
  options,
  value,
  onChange
}) => {
  const selected =
    Array.isArray(value)
      ? value
      : [];

  const allSelected =
    options.length > 0 &&
    selected.length ===
      options.length;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.35,
        borderRadius: 3,
        border:
          "1px solid #dce8e2",
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

        <Stack sx={uiLayout.actionBarSx}
          direction="row"
          spacing={0.5}
        >
          <Button
            size="small"
            startIcon={
              <DoneAllIcon />
            }
            onClick={() =>
              onChange(
                allSelected
                  ? []
                  : options
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
              onClick={() =>
                onChange([])
              }
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
        onChange={(
          event,
          newValue
        ) =>
          onChange(newValue)
        }
        limitTags={2}
        noOptionsText="لا توجد نتائج"
        renderOption={(
          props,
          option,
          state
        ) => (
          <li {...props}>
            <Checkbox
              checked={
                state.selected
              }
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
                fontFamily:
                  "Cairo",
                fontSize:
                  "0.82rem",
                fontWeight: 700
              }}
            >
              {option}
            </Typography>
          </li>
        )}
        renderTags={(
          tagValue,
          getTagProps
        ) =>
          tagValue.map(
            (option, index) => (
              <Chip
                {...getTagProps({
                  index
                })}
                key={option}
                label={option}
                size="small"
                sx={{
                  fontFamily:
                    "Cairo",
                  fontWeight: 700
                }}
              />
            )
          )
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
              "& .MuiInputBase-root":
                {
                  fontFamily:
                    "Cairo"
                },
              "& .MuiFormHelperText-root":
                {
                  fontFamily:
                    "Cairo",
                  textAlign:
                    "right"
                }
            }, uiLayout.formFieldSx)}
          />
        )}
      />
    </Paper>
  );
};

const GraduatesFollowReport = () => {
  const theme = useTheme();

  const isDark = theme.palette.mode === "dark";
  const uiColors = {
    page: isDark ? theme.palette.background.default : "#f5faf7",
    card: isDark ? (theme.palette.surfaces?.card || "#10251d") : "#ffffff",
    section: isDark ? (theme.palette.surfaces?.section || "#133126") : "#f7fbf9",
    nested: isDark ? (theme.palette.surfaces?.nested || "#173b2d") : "#fbfdfc",
    hover: isDark ? (theme.palette.surfaces?.hover || "#1b4735") : "#eef8f3",
    selected: isDark ? (theme.palette.surfaces?.selected || "#20543e") : "#e7f5ee",
    text: isDark ? (theme.palette.text?.primary || "#eef8f3") : "#173b2b",
    muted: isDark ? (theme.palette.text?.secondary || "#b7cfc3") : "#667a70",
    border: "#67C99D"
  };

  const darkContractStyles = isDark
    ? {
        ".graduates-follow-ui": {
          backgroundColor: `${uiColors.page} !important`,
          color: `${uiColors.text} !important`
        },
        ".graduates-follow-ui .MuiPaper-root, .graduates-follow-ui .MuiCard-root, .graduates-follow-ui .MuiTableContainer-root": {
          backgroundColor: `${uiColors.card} !important`,
          backgroundImage: "none !important",
          border: `1px solid ${uiColors.border} !important`,
          color: `${uiColors.text} !important`
        },
        ".graduates-follow-ui .MuiOutlinedInput-root": {
          backgroundColor: `${uiColors.nested} !important`,
          color: `${uiColors.text} !important`,
          borderRadius: "10px !important"
        },
        ".graduates-follow-ui .MuiOutlinedInput-notchedOutline": {
          borderColor: `${uiColors.border} !important`,
          borderWidth: "1px !important"
        },
        ".graduates-follow-ui .MuiInputBase-input, .graduates-follow-ui .MuiSelect-select": {
          color: `${uiColors.text} !important`
        },
        ".graduates-follow-ui .MuiInputLabel-root, .graduates-follow-ui .MuiFormHelperText-root": {
          color: `${uiColors.muted} !important`
        },
        ".graduates-follow-ui .MuiInputLabel-root.Mui-focused": {
          color: `${uiColors.border} !important`
        },
        ".graduates-follow-ui .MuiDivider-root": {
          borderColor: "rgba(103,201,157,.45) !important"
        },
        ".graduates-follow-ui .MuiButton-root": {
          border: `1px solid ${uiColors.border} !important`,
          borderRadius: "9px !important"
        },
        ".graduates-follow-ui .MuiIconButton-root": {
          border: `1px solid ${uiColors.border} !important`,
          borderRadius: "9px !important"
        },
        ".graduates-follow-ui .MuiChip-root": {
          borderColor: `${uiColors.border} !important`
        },
        ".graduates-follow-ui .MuiDataGrid-root": {
          backgroundColor: `${uiColors.card} !important`,
          color: `${uiColors.text} !important`,
          border: `1px solid ${uiColors.border} !important`
        },
        ".graduates-follow-ui .MuiDataGrid-columnHeaders": {
          backgroundColor: `${uiColors.section} !important`,
          color: `${uiColors.text} !important`,
          borderBottom: `1px solid ${uiColors.border} !important`
        },
        ".graduates-follow-ui .MuiDataGrid-columnHeader, .graduates-follow-ui .MuiDataGrid-cell": {
          borderColor: "rgba(103,201,157,.34) !important"
        },
        ".graduates-follow-ui .MuiDataGrid-row": {
          backgroundColor: `${uiColors.card} !important`
        },
        ".graduates-follow-ui .MuiDataGrid-row:hover": {
          backgroundColor: `${uiColors.hover} !important`
        },
        ".graduates-follow-ui .MuiDataGrid-footerContainer": {
          backgroundColor: `${uiColors.section} !important`,
          borderTop: `1px solid ${uiColors.border} !important`
        },
        ".graduates-follow-ui .MuiTable-root": {
          backgroundColor: `${uiColors.card} !important`,
          color: `${uiColors.text} !important`
        },
        ".graduates-follow-ui .MuiTableCell-root": {
          color: `${uiColors.text} !important`,
          borderColor: "rgba(103,201,157,.34) !important"
        },
        ".graduates-follow-ui .MuiPaginationItem-root": {
          color: `${uiColors.text} !important`,
          borderColor: `${uiColors.border} !important`
        },
        ".graduates-follow-ui .MuiPaginationItem-root.Mui-selected": {
          backgroundColor: `${uiColors.selected} !important`,
          color: `${uiColors.text} !important`
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
        }
      }
    : {};


  const layoutSafetyStyles = {
    ".graduates-follow-ui": {
      width: "100%",
      maxWidth: "100vw",
      overflowX: "hidden"
    },
    ".graduates-follow-ui .MuiPaper-root, .graduates-follow-ui .MuiTableContainer-root, .graduates-follow-ui .MuiDataGrid-root": {
      boxSizing: "border-box",
      minWidth: 0,
      maxWidth: "100%"
    },
    [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
      ".graduates-follow-ui .MuiDataGrid-virtualScroller": {
        overflowX: "hidden !important"
      },
      ".graduates-follow-ui .MuiDataGrid-scrollbar--horizontal": {
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

  const [detailsOpen, setDetailsOpen] =
    useState(false);

  const [detailsRow, setDetailsRow] =
    useState(null);

  useEffect(() => {
    if (isDesktop) {
      setMobileSidebarOpen(false);
    }
  }, [isDesktop]);

  const openDetails = (row) => {
    setDetailsRow(row);
    setDetailsOpen(true);
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setDetailsRow(null);
  };

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(
        localStorage.getItem("user") || "{}"
      );
    } catch {
      return {};
    }
  }, []);

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

  const [trainers, setTrainers] =
    useState([]);

  const [branch, setBranch] =
    useState(null);

  const [rows, setRows] =
    useState([]);

  const [
    filterDialogOpen,
    setFilterDialogOpen
  ] = useState(false);

  const [
    columnFilters,
    setColumnFilters
  ] = useState({
    regTypeName: [],
    diplomName: [],
    trainerName: [],
    studentType: []
  });

  const [loading, setLoading] =
    useState(false);

  const [menuAnchor, setMenuAnchor] =
    useState(null);

  const [menuRow, setMenuRow] =
    useState(null);

  const [statementOpen, setStatementOpen] =
    useState(false);

  const [feesOpen, setFeesOpen] =
    useState(false);

  const [paymentOpen, setPaymentOpen] =
    useState(false);

  const [
    paymentContext,
    setPaymentContext
  ] = useState(null);

  const [
    paymentContextLoading,
    setPaymentContextLoading
  ] = useState(false);

  const [trainerDialogOpen, setTrainerDialogOpen] =
    useState(false);

  const [selectedTrainer, setSelectedTrainer] =
    useState(null);

  /*
   * التحديد الجماعي داخل الجريد.
   * يحتفظ بمعرفات الصفوف المحددة فقط.
   */
  const [
    selectedRowIds,
    setSelectedRowIds
  ] = useState([]);

  const [
    bulkTrainerDialogOpen,
    setBulkTrainerDialogOpen
  ] = useState(false);

  const [
    bulkSelectedTrainer,
    setBulkSelectedTrainer
  ] = useState(null);

  const [
    bulkActionLoading,
    setBulkActionLoading
  ] = useState(false);

  const selectedStudent = menuRow || null;

  const loadLookups = useCallback(async () => {
    if (!userGuid) {
      await showError(
        "بيانات المستخدم غير موجودة، برجاء تسجيل الدخول مرة أخرى"
      );
      return;
    }

    try {
      const branchesResponse =
        await fetch(
          `${API_BASE_URL}/api/graduates-follow/branches?userGuid=${encodeURIComponent(userGuid)}`
        );

      const branchesResult =
        await readJson(
          branchesResponse
        );

      const availableBranches =
        Array.isArray(branchesResult?.data)
          ? branchesResult.data
          : [];

      setBranches(availableBranches);
      if (availableBranches.length === 1) {
        setBranch(availableBranches[0]);
      }
    } catch (error) {
      await showError(
        error?.message ||
        "تعذر تحميل قوائم الشاشة"
      );
    }
  }, [userGuid]);

  const loadTrainers = useCallback(async () => {
    if (!branch?.guid) {
      setTrainers([]);
      setSelectedTrainer(null);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/graduates-follow/trainers?userGuid=${encodeURIComponent(userGuid)}&branchGuid=${encodeURIComponent(branch.guid)}`
      );

      const result = await readJson(response);

      setTrainers(
        Array.isArray(result?.data)
          ? result.data
          : []
      );
    } catch (error) {
      setTrainers([]);
      await showError(
        error?.message ||
        "تعذر تحميل مسؤولي الاتصال"
      );
    }
  }, [branch?.guid, userGuid]);

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  useEffect(() => {
    loadTrainers();
  }, [loadTrainers]);

  const loadData = useCallback(async () => {
    if (!branch?.guid) {
      await showError("برجاء اختيار الفرع");
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
      const params = new URLSearchParams({
        userGuid,
        fromDate,
        toDate,
        branchGuid: branch.guid
      });

      const response = await fetch(
        `${API_BASE_URL}/api/graduates-follow/report?${params.toString()}`
      );

      const result = await readJson(response);

      let data = Array.isArray(result?.data)
        ? result.data
        : [];

      setRows(data);
    } catch (error) {
      setRows([]);
      await showError(
        error?.message ||
        "تعذر تحميل متابعة الخريجين"
      );
    } finally {
      setLoading(false);
    }
  }, [
    userGuid,
    fromDate,
    toDate,
    branch
  ]);

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

        studentLevelGuid: String(
          pick(row, [
            "StudentLevelGuid",
            "studentLevelGuid"
          ])
        ),

        accountGuid: String(
          pick(row, [
            "AccountGuid",
            "accountGuid"
          ])
        ),

        regDocGuid: String(
          pick(row, [
            "RegDocGuid",
            "regDocGuid"
          ])
        ),

        diplomGuid: String(
          pick(row, [
            "DiplomGuid",
            "diplomGuid"
          ])
        ),

        branchGuid: String(
          pick(
            row,
            ["BranchGuid", "branchGuid"],
            branch?.guid || ""
          )
        ),

        branchName: String(
          pick(
            row,
            ["BrEName", "BranchName", "branchName"],
            branch?.name || ""
          )
        ),

        trainerGuid: String(
          pick(row, [
            "TrainerGuid",
            "trainerGuid"
          ])
        ),

        trainerName: String(
          pick(row, [
            "Name",
            "TrainerName",
            "trainerName"
          ])
        ),

        regType: String(
          pick(row, [
            "RegType",
            "regType"
          ])
        ),

        regTypeName: String(
          pick(row, [
            "RegTypeName",
            "regTypeName"
          ])
        ),

        diplomName: String(
          pick(row, [
            "DiplomName",
            "diplomName"
          ])
        ),

        studentName: String(
          pick(row, [
            "StudentName",
            "studentName"
          ])
        ),

        studentTel: String(
          pick(row, [
            "StudentTel",
            "studentTel"
          ])
        ),

        nationalId: String(
          pick(row, [
            "NationalId",
            "nationalId"
          ])
        ),

        studentNational: String(
          pick(row, [
            "StudentNational",
            "studentNational"
          ])
        ),

        preBalance: toNumber(
          pick(row, [
            "PREBALANCE",
            "preBalance"
          ])
        ),

        debit: toNumber(
          pick(row, [
            "MADEN__",
            "debit"
          ])
        ),

        startPay: toNumber(
          pick(row, [
            "STARTPAY",
            "startPay"
          ])
        ),

        monthPay: toNumber(
          pick(row, [
            "MONTHPAY",
            "monthPay"
          ])
        ),

        feesPay: toNumber(
          pick(row, [
            "FESSPAY",
            "feesPay"
          ])
        ),

        mDaily: toNumber(
          pick(row, [
            "MDaily_",
            "mDaily"
          ])
        ),

        dDaily: toNumber(
          pick(row, [
            "DDaily_",
            "dDaily"
          ])
        ),

        balance: toNumber(
          pick(row, [
            "BALANCE",
            "balance"
          ])
        ),

        studentType: String(
          pick(row, [
            "TYPESTUDENT",
            "studentType"
          ])
        )
      })),
    [rows, branch]
  );


  const filterOptions = useMemo(() => {
    const makeOptions = (field) =>
      Array.from(
        new Set(
          gridRows
            .map((row) =>
              String(
                row[field] || ""
              ).trim()
            )
            .filter(Boolean)
        )
      ).sort((first, second) =>
        first.localeCompare(
          second,
          "ar",
          { numeric: true }
        )
      );

    return {
      regTypeName:
        makeOptions(
          "regTypeName"
        ),
      diplomName:
        makeOptions(
          "diplomName"
        ),
      trainerName:
        makeOptions(
          "trainerName"
        ),
      studentType:
        makeOptions(
          "studentType"
        )
    };
  }, [gridRows]);

  const filteredGridRows =
    useMemo(
      () =>
        gridRows.filter((row) =>
          Object.entries(
            columnFilters
          ).every(
            ([
              field,
              selectedValues
            ]) =>
              !selectedValues
                .length ||
              selectedValues
                .includes(
                  String(
                    row[field] || ""
                  ).trim()
                )
          )
        ),
      [
        gridRows,
        columnFilters
      ]
    );

  const activeFilterCount =
    useMemo(
      () =>
        Object.values(
          columnFilters
        ).filter(
          (values) =>
            values.length > 0
        ).length,
      [columnFilters]
    );

  const resetColumnFilters =
    () =>
      setColumnFilters({
        regTypeName: [],
        diplomName: [],
        trainerName: [],
        studentType: []
      });

  const updateColumnFilter =
    (field, values) =>
      setColumnFilters(
        (current) => ({
          ...current,
          [field]: values
        })
      );

  const columns = useMemo(
    () => [
      {
        field: "actions",
        headerName: "العمليات",
        width: 54,
        minWidth: 54,
        maxWidth: 54,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params) => (
          <IconButton
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              setMenuAnchor(event.currentTarget);
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
        flex: 0.75,
        minWidth: 0,
        renderCell: (params) => (
          <TextCell value={params.value} />
        )
      },
      {
        field: "diplomName",
        headerName: "الدبلوم/الدورة",
        flex: 1.55,
        minWidth: 0,
        renderCell: (params) => (
          <TextCell
            value={params.value}
            align="right"
          />
        )
      },
      {
        field: "studentName",
        headerName: "اسم الطالب",
        flex: 1.45,
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
          <TextCell value={params.value} />
        )
      },
      {
        field: "nationalId",
        headerName: "رقم الهوية",
        flex: 0.95,
        minWidth: 0,
        renderCell: (params) => (
          <TextCell value={params.value} />
        )
      },
      {
        field: "preBalance",
        headerName: "الرصيد السابق",
        flex: 0.9,
        minWidth: 0,
        renderCell: (params) => (
          <MoneyCell value={params.value} />
        )
      },
      {
        field: "debit",
        headerName: "مدين",
        flex: 0.65,
        minWidth: 0,
        renderCell: (params) => (
          <MoneyCell value={params.value} />
        )
      },
      {
        field: "startPay",
        headerName: "دفعة مقدمة",
        flex: 0.75,
        minWidth: 0,
        renderCell: (params) => (
          <MoneyCell value={params.value} />
        )
      },
      {
        field: "monthPay",
        headerName: "قسط شهري",
        flex: 0.75,
        minWidth: 0,
        renderCell: (params) => (
          <MoneyCell value={params.value} />
        )
      },
      {
        field: "feesPay",
        headerName: "سداد رسوم",
        flex: 0.75,
        minWidth: 0,
        renderCell: (params) => (
          <MoneyCell value={params.value} />
        )
      },
      {
        field: "mDaily",
        headerName: "قيد مدين",
        flex: 0.7,
        minWidth: 0,
        renderCell: (params) => (
          <MoneyCell value={params.value} />
        )
      },
      {
        field: "dDaily",
        headerName: "قيد دائن",
        flex: 0.7,
        minWidth: 0,
        renderCell: (params) => (
          <MoneyCell value={params.value} />
        )
      },
      {
        field: "balance",
        headerName: "الرصيد الحالي",
        flex: 0.9,
        minWidth: 0,
        renderCell: (params) => (
          <MoneyCell value={params.value} />
        )
      },
      {
        field: "trainerName",
        headerName: "مسؤول الاتصال",
        flex: 1.05,
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
          <TextCell value={params.value} />
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
      "diplomName",
      "trainerName"
    ];

    const tabletFields = [
      "studentName",
      "nationalId",
      "diplomName",
      "trainerName",
      "balance",
      "studentType"
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
        maxWidth: undefined,
        width: undefined,

        ...(isPhone
          ? {
              flex:
                column.field === "studentName"
                  ? 1.35
                  : column.field === "diplomName"
                    ? 1.2
                    : 1,
              minWidth: 0
            }
          : {
              flex:
                column.field === "studentName"
                  ? 1.35
                  : column.field === "diplomName"
                    ? 1.25
                    : 1,
              minWidth: 0
            }),

        renderCell:
          column.field === "studentName"
            ? (params) => (
                <Typography
                  sx={{
                    width: "100%",
                    px: 0.1,
                    textAlign: "center",
                    fontFamily: "Cairo",
                    fontWeight: 800,
                    fontSize: isPhone
                      ? "0.75rem"
                      : "0.75rem",
                    lineHeight: 1.15,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}
                >
                  {params.value || "-"}
                </Typography>
              )
            : column.renderCell
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
              openDetails(params.row);
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
                fontSize: isPhone
                  ? 14
                  : 18
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

  const closeMenu = () => {
    setMenuAnchor(null);
  };

  /*
   * في الديسكتوب يتم تشغيل:
   * FormTypeGuid("salesinvoice")
   * ثم AutoGetInvoiceType للنوع 1 والنوع 2.
   *
   * لذلك لا نفتح شاشة طلب السداد بالبيانات المختصرة
   * القادمة من تقرير الخريجين فقط، بل نطلب Payment Context
   * الكامل من الباك إند أولًا حتى تصل بيانات دفتر السداد:
   * payDocGuid / payDocCode / payDocName
   * payFeesDocGuid / payFeesDocCode / payFeesDocName
   */
  const openPaymentOrder = async (row) => {
    if (!row?.accountGuid) {
      await showError(
        "لا يمكن قراءة حساب الطالب"
      );
      return;
    }

    if (!row?.branchGuid) {
      await showError(
        "لا يمكن قراءة فرع الطالب"
      );
      return;
    }

    if (!row?.diplomGuid) {
      await showError(
        "لا يمكن قراءة تخصص الطالب"
      );
      return;
    }

    try {
      setPaymentContextLoading(true);
      setPaymentContext(null);

      const params = new URLSearchParams({
        accountGuid:
          row.accountGuid,
        studentName:
          row.studentName || "",
        nationalId:
          row.nationalId || "",
        tel:
          row.studentTel || "",
        diplomName:
          row.diplomName || "",
        diplomGuid:
          row.diplomGuid,
        branchGuid:
          row.branchGuid,
        branchName:
          row.branchName || "",
        regDocGuid:
          row.regDocGuid || ""
      });

      const response = await fetch(
        `${API_BASE_URL}/api/reception-office/payment/context?${params.toString()}`,
        {
          method: "GET",
          headers: {
            Accept:
              "application/json"
          },
          cache: "no-store"
        }
      );

      const result =
        await readJson(response);

      const readyContext = {
        ...result,

        accountGuid:
          result?.accountGuid ||
          row.accountGuid,

        studentName:
          result?.studentName ||
          row.studentName,

        nationalId:
          result?.nationalId ||
          row.nationalId,

        tel:
          result?.tel ||
          row.studentTel,

        studentNational:
          row.studentNational ??
          "0",

        diplomName:
          result?.diplomName ||
          row.diplomName,

        diplomGuid:
          result?.diplomGuid ||
          row.diplomGuid,

        branchGuid:
          result?.branchGuid ||
          row.branchGuid,

        branchName:
          result?.branchName ||
          row.branchName,

        regDocGuid:
          result?.regDocGuid ||
          row.regDocGuid
      };

      if (
        !readyContext.payDocGuid
      ) {
        throw new Error(
          "لم يرجع الباك إند دفتر سداد القسط الشهري"
        );
      }

      if (
        !readyContext.payFeesDocGuid
      ) {
        throw new Error(
          "لم يرجع الباك إند دفتر سداد الرسوم"
        );
      }

      setPaymentContext(
        readyContext
      );

      setPaymentOpen(true);
    } catch (error) {
      setPaymentContext(null);

      await showError(
        error?.message ||
        "تعذر تجهيز بيانات طلب السداد"
      );
    } finally {
      setPaymentContextLoading(false);
    }
  };

  const openAction = async (action) => {
    closeMenu();

    if (!menuRow) return;

    if (action === "statement") {
      setStatementOpen(true);
    } else if (action === "fees") {
      setFeesOpen(true);
    } else if (action === "payment") {
      await openPaymentOrder(
        menuRow
      );
    } else if (action === "assign") {
      const current =
        trainers.find(
          (item) =>
            String(item.guid).toLowerCase() ===
            String(menuRow.trainerGuid).toLowerCase()
        ) || null;

      setSelectedTrainer(current);
      setTrainerDialogOpen(true);
    } else if (action === "clear") {
      clearTrainer();
    } else if (action === "graduate") {
      finishStudy();
    }
  };

  const postJson = async (path, body) => {
    const response = await fetch(
      `${API_BASE_URL}/api/graduates-follow/${path}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userGuid,
          ...body
        })
      }
    );

    return readJson(response);
  };

  const saveTrainer = async () => {
    if (!menuRow?.studentLevelGuid) {
      await showError("بيانات الطالب غير مكتملة");
      return;
    }

    if (!selectedTrainer?.guid) {
      await showError(
        "برجاء اختيار مسؤول الاتصال"
      );
      return;
    }

    try {
      await postJson("assign-trainer", {
        studentLevelGuid:
          menuRow.studentLevelGuid,
        trainerGuid:
          selectedTrainer.guid,
        nationalId:
          menuRow.nationalId,
        studentName:
          menuRow.studentName
      });

      setTrainerDialogOpen(false);
      await showSuccess(
        "تم تعيين مسؤول الاتصال"
      );
      await loadData();
    } catch (error) {
      await showError(
        error?.message ||
        "تعذر تعيين مسؤول الاتصال"
      );
    }
  };

  const clearTrainer = async () => {
    if (!menuRow?.studentLevelGuid) {
      await showError("بيانات الطالب غير مكتملة");
      return;
    }

    const confirmation = await Swal.fire({
      icon: "question",
      title: "حذف مسؤول الاتصال",
      text: `سيتم حذف مسؤول الاتصال من الطالب ${menuRow.studentName}`,
      showCancelButton: true,
      confirmButtonText: "تأكيد الحذف",
      cancelButtonText: "إلغاء",
      confirmButtonColor: "#ae1e21",
      cancelButtonColor: "#6b7280",
      reverseButtons: true
    });

    if (!confirmation.isConfirmed) return;

    try {
      await postJson("clear-trainer", {
        studentLevelGuid:
          menuRow.studentLevelGuid,
        nationalId:
          menuRow.nationalId,
        studentName:
          menuRow.studentName
      });

      await showSuccess(
        "تم حذف مسؤول الاتصال"
      );
      await loadData();
    } catch (error) {
      await showError(
        error?.message ||
        "تعذر حذف مسؤول الاتصال"
      );
    }
  };

  const finishStudy = async () => {
    if (!menuRow?.studentLevelGuid) {
      await showError("بيانات الطالب غير مكتملة");
      return;
    }

    if (toNumber(menuRow.balance) > 0) {
      await showError(
        "توجد مبالغ مالية متبقية على المتدرب، يرجى التواصل مع إدارة الحسابات"
      );
      return;
    }

    const confirmation = await Swal.fire({
      icon: "question",
      title: "إنهاء دراسة المتدرب",
      text: `هل تريد الاستمرار في إنهاء دراسة ${menuRow.studentName}؟`,
      input: "textarea",
      inputLabel: "ملاحظات الإنهاء",
      inputPlaceholder:
        "اكتب ملاحظة الإنهاء إن وجدت",
      showCancelButton: true,
      confirmButtonText: "تأكيد الإنهاء",
      cancelButtonText: "إلغاء",
      confirmButtonColor: "#057546",
      cancelButtonColor: "#ae1e21",
      reverseButtons: true
    });

    if (!confirmation.isConfirmed) return;

    try {
      await postJson("finish-study", {
        studentLevelGuid:
          menuRow.studentLevelGuid,
        accountGuid:
          menuRow.accountGuid,
        nationalId:
          menuRow.nationalId,
        studentName:
          menuRow.studentName,
        balance:
          menuRow.balance,
        reason:
          confirmation.value || ""
      });

      await showSuccess(
        "تم إنهاء دراسة المتدرب"
      );
      await loadData();
    } catch (error) {
      await showError(
        error?.message ||
        "تعذر إنهاء دراسة المتدرب"
      );
    }
  };

  const selectedRows = useMemo(
    () => {
      const selectedSet =
        new Set(
          selectedRowIds.map(
            (value) =>
              String(value)
          )
        );

      return gridRows.filter(
        (row) =>
          selectedSet.has(
            String(row.id)
          )
      );
    },
    [
      selectedRowIds,
      gridRows
    ]
  );

  const clearGridSelection = () => {
    setSelectedRowIds([]);
  };

  const openBulkAssignDialog = async () => {
    if (selectedRows.length === 0) {
      await showError(
        "برجاء تحديد طالب واحد على الأقل"
      );
      return;
    }

    if (!branch?.guid) {
      await showError(
        "برجاء اختيار الفرع أولًا"
      );
      return;
    }

    setBulkSelectedTrainer(null);
    setBulkTrainerDialogOpen(true);
  };

  const bulkAssignTrainer = async () => {
    if (selectedRows.length === 0) {
      await showError(
        "لا توجد صفوف محددة"
      );
      return;
    }

    if (!bulkSelectedTrainer?.guid) {
      await showError(
        "برجاء اختيار مسؤول الاتصال"
      );
      return;
    }

    const invalidRows =
      selectedRows.filter(
        (row) =>
          !row.studentLevelGuid
      );

    if (invalidRows.length > 0) {
      await showError(
        `يوجد ${invalidRows.length} طالب بياناته غير مكتملة`
      );
      return;
    }

    const confirmation =
      await Swal.fire({
        icon: "question",
        title:
          "تعيين مسؤول الاتصال جماعيًا",
        html: `
          <div style="
            direction:rtl;
            font-family:Cairo,Arial;
            line-height:2;
          ">
            سيتم تعيين
            <strong>
              ${bulkSelectedTrainer.name || ""}
            </strong>
            لعدد
            <strong>
              ${selectedRows.length}
            </strong>
            طالب
          </div>
        `,
        showCancelButton: true,
        confirmButtonText:
          "تأكيد التعيين",
        cancelButtonText: "إلغاء",
        confirmButtonColor:
          "#057546",
        cancelButtonColor:
          "#6b7280",
        reverseButtons: true
      });

    if (!confirmation.isConfirmed) {
      return;
    }

    try {
      setBulkActionLoading(true);

      /*
       * نستخدم نفس Endpoint التعيين الفردي
       * لكل طالب حتى تظل الصلاحيات وUser Actions
       * مطبقة كما هي في الباك إند.
       */
      for (const row of selectedRows) {
        await postJson(
          "assign-trainer",
          {
            studentLevelGuid:
              row.studentLevelGuid,
            trainerGuid:
              bulkSelectedTrainer.guid,
            nationalId:
              row.nationalId,
            studentName:
              row.studentName
          }
        );
      }

      setBulkTrainerDialogOpen(false);
      setBulkSelectedTrainer(null);
      clearGridSelection();

      await showSuccess(
        `تم تعيين مسؤول الاتصال لعدد ${selectedRows.length} طالب`
      );

      await loadData();
    } catch (error) {
      await showError(
        error?.message ||
        "تعذر إتمام التعيين الجماعي"
      );
    } finally {
      setBulkActionLoading(false);
    }
  };

  const bulkClearTrainer = async () => {
    if (selectedRows.length === 0) {
      await showError(
        "برجاء تحديد طالب واحد على الأقل"
      );
      return;
    }

    const invalidRows =
      selectedRows.filter(
        (row) =>
          !row.studentLevelGuid
      );

    if (invalidRows.length > 0) {
      await showError(
        `يوجد ${invalidRows.length} طالب بياناته غير مكتملة`
      );
      return;
    }

    const confirmation =
      await Swal.fire({
        icon: "warning",
        title:
          "حذف مسؤول الاتصال جماعيًا",
        text:
          `سيتم حذف مسؤول الاتصال من ${selectedRows.length} طالب`,
        showCancelButton: true,
        confirmButtonText:
          "تأكيد الحذف",
        cancelButtonText: "إلغاء",
        confirmButtonColor:
          "#ae1e21",
        cancelButtonColor:
          "#6b7280",
        reverseButtons: true
      });

    if (!confirmation.isConfirmed) {
      return;
    }

    try {
      setBulkActionLoading(true);

      /*
       * نستخدم نفس Endpoint الحذف الفردي
       * لكل طالب حتى يتم تسجيل User Action
       * مستقل لكل عملية.
       */
      for (const row of selectedRows) {
        await postJson(
          "clear-trainer",
          {
            studentLevelGuid:
              row.studentLevelGuid,
            nationalId:
              row.nationalId,
            studentName:
              row.studentName
          }
        );
      }

      clearGridSelection();

      await showSuccess(
        `تم حذف مسؤول الاتصال من ${selectedRows.length} طالب`
      );

      await loadData();
    } catch (error) {
      await showError(
        error?.message ||
        "تعذر إتمام الحذف الجماعي"
      );
    } finally {
      setBulkActionLoading(false);
    }
  };

  const exportExcel = () => {
    if (filteredGridRows.length === 0) {
      showError("لا توجد بيانات للتصدير");
      return;
    }

    try {
      const headers = [
        "نوع التسجيل",
        "الدبلوم / الدورة",
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
        String(row.studentName || ""),
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

      const worksheet = XLSX.utils.aoa_to_sheet([
        headers,
        ...dataRows
      ]);

      worksheet["!cols"] = [
        { wch: 16 },
        { wch: 34 },
        { wch: 30 },
        { wch: 16 },
        { wch: 16 },
        { wch: 16 },
        { wch: 14 },
        { wch: 15 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
        { wch: 16 },
        { wch: 26 },
        { wch: 16 }
      ];

      worksheet["!autofilter"] = {
        ref: `A1:O${dataRows.length + 1}`
      };

      worksheet["!freeze"] = {
        xSplit: 0,
        ySplit: 1,
        topLeftCell: "A2",
        activePane: "bottomLeft",
        state: "frozen"
      };

      ["F", "G", "H", "I", "J", "K", "L", "M"].forEach((columnLetter) => {
        for (let rowIndex = 2; rowIndex <= dataRows.length + 1; rowIndex += 1) {
          const cell = worksheet[`${columnLetter}${rowIndex}`];
          if (cell) {
            cell.t = "n";
            cell.z = '#,##0.00';
          }
        }
      });

      ["D", "E"].forEach((columnLetter) => {
        for (let rowIndex = 2; rowIndex <= dataRows.length + 1; rowIndex += 1) {
          const cell = worksheet[`${columnLetter}${rowIndex}`];
          if (cell) {
            cell.t = "s";
            cell.v = String(cell.v ?? "");
          }
        }
      });

      const workbook = XLSX.utils.book_new();
      workbook.Workbook = {
        Views: [{ RTL: true }]
      };

      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "متابعة الخريجين"
      );

      const safeBranchName = String(branch?.name || "الفرع")
        .replace(/[\\/:*?"<>|]/g, "-")
        .trim();

      XLSX.writeFile(
        workbook,
        `متابعة الخريجين - ${safeBranchName} - ${fromDate} إلى ${toDate}.xlsx`,
        { compression: true }
      );
    } catch (error) {
      showError(
        error?.message ||
        "حدث خطأ أثناء تصدير ملف Excel"
      );
    }
  };


  return (
    <NavigationShell variant="standard" mobileOpen={mobileSidebarOpen} onMobileClose={() =>
            setMobileSidebarOpen(false)
          }><Box
      className="graduates-follow-ui"
      sx={{
        minHeight: "100vh",
        maxWidth: "100%",
        overflowX: "hidden",
        background:
          theme.palette.mode === 'dark'
            ? theme.palette.background.default
            : "linear-gradient(135deg,#f5faf7 0%,#ffffff 55%,#eef8f3 100%)",
        direction: "rtl"
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
                px: {
                  xs: 0.75,
                  sm: 1
                },
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
                  width: {
                    xs: 36,
                    sm: 40
                  },
                  height: {
                    xs: 36,
                    sm: 40
                  },
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
                متابعة الخريجين
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
          minWidth: 0,
          maxWidth: "100%",
          boxSizing: "border-box",
          overflowX: "hidden"
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: isDesktop
              ? 2
              : isPhone
                ? 0.6
                : 0.85,
            mb: isDesktop
              ? 1.5
              : 0.6,
            borderRadius: 4,
            border:
              "1px solid rgba(5,117,70,0.14)",
            boxShadow:
              "0 12px 30px rgba(5,117,70,0.08)"
          }}
        >
          <Stack
            direction={{
              xs: "column",
              lg: "row"
            }}
            spacing={1.2}
            alignItems={{
              xs: "stretch",
              lg: "center"
            }}
            sx={uiLayout.withUiSx({
              "& .MuiButton-root": {
                minHeight: !isDesktop
                  ? isPhone
                    ? 29
                    : 33
                  : undefined,
                px: !isDesktop
                  ? isPhone
                    ? 0.55
                    : 0.8
                  : undefined,
                fontSize: !isDesktop
                  ? isPhone
                    ? "0.75rem"
                    : "0.75rem"
                  : undefined
              },
              "& .MuiChip-root": {
                height: !isDesktop
                  ? isPhone
                    ? 25
                    : 29
                  : undefined,
                fontSize: !isDesktop
                  ? isPhone
                    ? "0.75rem"
                    : "0.75rem"
                  : undefined
              }
            }, uiLayout.actionBarSx)}
          >
            <Box sx={{ flex: 1 }}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
              >
                <GroupsIcon
                  sx={{
                    color: "#057546",
                    fontSize: isDesktop
                      ? 34
                      : isPhone
                        ? 17
                        : 21
                  }}
                />

                <Box>
                  <Typography
                    sx={{
                      fontFamily: "Cairo",
                      fontSize: isDesktop
                        ? "1.15rem"
                        : isPhone
                          ? "0.75rem"
                          : "0.75rem",
                      fontWeight: 900,
                      color: "#173b2b"
                    }}
                  >
                    متابعة الخريجين
                  </Typography>
                </Box>
              </Stack>
            </Box>

            {selectedRows.length > 0 && (
              <Chip
                label={`تم تحديد ${selectedRows.length} طالب`}
                onDelete={
                  bulkActionLoading
                    ? undefined
                    : clearGridSelection
                }
                sx={{
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  color: "#fff",
                  backgroundColor:
                    "#057546"
                }}
              />
            )}

            <Button
              variant="contained"
              startIcon={
                bulkActionLoading
                  ? (
                    <CircularProgress
                      size={17}
                      color="inherit"
                    />
                  )
                  : <GroupAddIcon />
              }
              onClick={
                openBulkAssignDialog
              }
              disabled={
                selectedRows.length === 0 ||
                bulkActionLoading
              }
              sx={uiLayout.withUiSx({
                fontFamily: "Cairo",
                fontWeight: 900,
                background:
                  "linear-gradient(135deg,#057546,#034d31)"
              }, uiLayout.buttonSx)}
            >
              تعيين جماعي
            </Button>

            <Button
              variant="outlined"
              color="error"
              startIcon={
                bulkActionLoading
                  ? (
                    <CircularProgress
                      size={17}
                      color="inherit"
                    />
                  )
                  : <PersonRemoveIcon />
              }
              onClick={
                bulkClearTrainer
              }
              disabled={
                selectedRows.length === 0 ||
                bulkActionLoading
              }
              sx={uiLayout.withUiSx({
                fontFamily: "Cairo",
                fontWeight: 900
              }, uiLayout.buttonSx)}
            >
              حذف جماعي
            </Button>

            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={exportExcel}
              sx={uiLayout.withUiSx({
                fontFamily: "Cairo",
                fontWeight: 800
              }, uiLayout.buttonSx)}
            >
              تصدير Excel
            </Button>

            <Button
              variant={
                activeFilterCount > 0
                  ? "contained"
                  : "outlined"
              }
              startIcon={
                <FilterAltIcon />
              }
              onClick={() =>
                setFilterDialogOpen(
                  true
                )
              }
              sx={uiLayout.withUiSx({
                fontFamily: "Cairo",
                fontWeight: 800,
                ...(activeFilterCount >
                0
                  ? {
                      background:
                        "linear-gradient(135deg,#057546,#034d31)"
                    }
                  : {})
              }, uiLayout.buttonSx)}
            >
              فلاتر متقدمة
              {activeFilterCount > 0
                ? ` (${activeFilterCount})`
                : ""}
            </Button>

            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadLookups}
              sx={uiLayout.withUiSx({
                fontFamily: "Cairo",
                fontWeight: 800
              }, uiLayout.buttonSx)}
            >
              تحديث القوائم
            </Button>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: isDesktop
              ? 1.5
              : isPhone
                ? 0.55
                : 0.75,
            mb: isDesktop
              ? 1.5
              : 0.6,
            borderRadius: 3.5,
            border:
              "1px solid rgba(5,117,70,0.13)"
          }}
        >
          <Box
            sx={uiLayout.withUiSx({
              display: "grid",
              gridTemplateColumns: isDesktop
                ? "repeat(3,minmax(0,1fr)) auto"
                : isPhone
                  ? "repeat(2,minmax(0,1fr))"
                  : "repeat(4,minmax(0,1fr))",
              columnGap: isDesktop
                ? 1.2
                : isPhone
                  ? 0.8
                  : 1,
              rowGap: isDesktop
                ? 1.2
                : isPhone
                  ? 1
                  : 1.1,
              alignItems: "center",
              "& .MuiInputLabel-root": {
                fontFamily: "Cairo",
                fontSize: !isDesktop
                  ? isPhone
                    ? "0.75rem"
                    : "0.75rem"
                  : undefined
              },
              "& .MuiInputBase-root": {
                minHeight: !isDesktop
                  ? isPhone
                    ? 31
                    : 35
                  : undefined,
                fontFamily: "Cairo",
                fontSize: !isDesktop
                  ? isPhone
                    ? "0.75rem"
                    : "0.75rem"
                  : undefined
              }
            }, uiLayout.filterBarSx)}
          >
            <TextField sx={uiLayout.formFieldSx}
              type="date"
              label="من تاريخ"
              value={fromDate}
              onChange={(event) =>
                setFromDate(event.target.value)
              }
              InputLabelProps={{ shrink: true }}
              size="small"
             inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

            <TextField sx={uiLayout.formFieldSx}
              type="date"
              label="إلى تاريخ"
              value={toDate}
              onChange={(event) =>
                setToDate(event.target.value)
              }
              InputLabelProps={{ shrink: true }}
              size="small"
             inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

            <Autocomplete
              sx={{
                gridColumn: "auto"
              }}
              options={branches}
              value={branch}
              onChange={(_, value) => {
                setBranch(value);
                setRows([]);
              }}
              getOptionLabel={(option) =>
                option?.name || ""
              }
              isOptionEqualToValue={(
                option,
                value
              ) =>
                String(option?.guid) ===
                String(value?.guid)
              }
              renderInput={(params) => (
                <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                  {...params}
                  label="الفرع"
                  size="small"
                />
              )}
            />

            <Button
              variant="contained"
              startIcon={
                loading
                  ? (
                    <CircularProgress
                      size={18}
                      color="inherit"
                    />
                  )
                  : <SearchIcon />
              }
              onClick={loadData}
              disabled={loading}
              sx={uiLayout.withUiSx({
                gridColumn: "auto",
                minHeight: isDesktop
                  ? 40
                  : isPhone
                    ? 31
                    : 35,
                fontSize: !isDesktop
                  ? isPhone
                    ? "0.75rem"
                    : "0.75rem"
                  : undefined,
                fontFamily: "Cairo",
                fontWeight: 900,
                background:
                  "linear-gradient(135deg,#057546,#034d31)"
              }, uiLayout.buttonSx)}
            >
              عرض
            </Button>
          </Box>
        </Paper>

        <Paper
          elevation={0}
          sx={uiLayout.withUiSx({
            width: "100%",
            minWidth: 0,
            height: isDesktop
              ? "calc(100vh - 245px)"
              : isPhone
                ? "calc(100dvh - 285px)"
                : "calc(100dvh - 260px)",
            minHeight: isDesktop
              ? 500
              : isPhone
                ? 420
                : 540,
            borderRadius: 3.5,
            overflow: "hidden",
            border:
              "1px solid rgba(5,117,70,0.13)"
          }, uiLayout.tableContainerSx)}
        >
          <DataGrid
            rows={filteredGridRows}
            columns={
              isDesktop
                ? columns
                : compactColumns
            }
            loading={loading}
            checkboxSelection
            disableRowSelectionOnClick
            rowSelectionModel={
              selectedRowIds
            }
            onRowSelectionModelChange={(
              newSelection
            ) =>
              setSelectedRowIds(
                Array.isArray(
                  newSelection
                )
                  ? newSelection
                  : Array.from(
                      newSelection || []
                    )
              )
            }
            keepNonExistentRowsSelected
            slots={
              isDesktop
                ? {
                    toolbar: GridToolbar
                  }
                : {}
            }
            slotProps={
              isDesktop
                ? {
                    toolbar: {
                      showQuickFilter: true,
                      quickFilterProps: {
                        debounceMs: 350
                      }
                    }
                  }
                : {}
            }
            initialState={{
              pagination: {
                paginationModel: {
                  pageSize: 50,
                  page: 0
                }
              }
            }}
            pageSizeOptions={[
              25, 50, 100, 200
            ]}
            rowHeight={
              isDesktop
                ? 52
                : isPhone
                  ? 30
                  : 38
            }
            columnHeaderHeight={
              isDesktop
                ? 54
                : isPhone
                  ? 30
                  : 40
            }
            sx={uiLayout.withUiSx({
              border: 0,
              direction: "rtl",
              fontFamily: "Cairo",

              /*
               * لا نخفي الـVirtual Scroller بالقوة،
               * لأن ده كان بيكسر حساب عرض الأعمدة
               * ويعمل مساحة فاضية كبيرة ناحية الشمال.
               *
               * الأعمدة نفسها Flex ومجموعها يتمدد
               * تلقائيًا على عرض الجريد بالكامل.
               */
              "& .MuiDataGrid-main": {
                minWidth: 0
              },

              "& .MuiDataGrid-columnHeaders": {
                backgroundColor:
                  "#eef8f3",
                color: "#173b2b",
                fontWeight: 900
              },

              "& .MuiDataGrid-columnHeaderTitleContainer": {
                justifyContent: "center",
                minWidth: 0,
                overflow: "hidden"
              },

              "& .MuiDataGrid-columnHeaderTitle": {
                fontFamily: "Cairo",
                fontWeight: 900,
                fontSize: !isDesktop
                  ? isPhone
                    ? "0.75rem"
                    : "0.75rem"
                  : undefined,
                whiteSpace: !isDesktop
                  ? "nowrap"
                  : undefined,
                overflow: !isDesktop
                  ? "hidden"
                  : undefined,
                textOverflow: !isDesktop
                  ? "ellipsis"
                  : undefined
              },

              "& .MuiDataGrid-cell": {
                borderColor:
                  "rgba(5,117,70,0.08)",
                px: !isDesktop
                  ? isPhone
                    ? 0.04
                    : 0.2
                  : undefined,
                fontSize: !isDesktop
                  ? isPhone
                    ? "0.75rem"
                    : "0.75rem"
                  : undefined,
                justifyContent: !isDesktop
                  ? "center"
                  : undefined,
                textAlign: !isDesktop
                  ? "center"
                  : undefined
              },

              ...(!isDesktop
                ? {
                    "& .MuiDataGrid-menuIcon, & .MuiDataGrid-iconButtonContainer, & .MuiDataGrid-sortIcon": {
                      display: "none"
                    },
                    "& .MuiDataGrid-columnSeparator": {
                      display: "none"
                    },
                    "& .MuiDataGrid-toolbarContainer": {
                      display: "none"
                    },
                    "& .MuiDataGrid-main": {
                      minWidth: 0,
                      overflowX: "hidden"
                    },
                    "& .MuiDataGrid-virtualScroller": {
                      direction: "rtl",
                      overflowX: "hidden"
                    },
                    "& .MuiDataGrid-scrollbar--horizontal": {
                      display: "none"
                    }
                  }
                : {}),

              "& .MuiCheckbox-root.Mui-checked":
                {
                  color: "#057546"
                },

              "& .MuiDataGrid-virtualScroller":
                {
                  direction: "rtl"
                },

              "& .MuiDataGrid-footerContainer":
                {
                  direction: "rtl"
                }
            }, uiLayout.dataGridSx)}
          />
        </Paper>


        <Dialog sx={uiLayout.dialogLayoutSx}
          open={detailsOpen}
          onClose={closeDetails}
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
              justifyContent:
                "space-between",
              gap: 0.6,
              fontFamily: "Cairo",
              fontWeight: 950,
              color: "#057546",
              fontSize: isPhone
                ? "0.76rem"
                : "0.94rem"
            }}
          >
            <span>تفاصيل الخريج</span>

            <IconButton
              onClick={closeDetails}
              sx={{
                width: isPhone ? 30 : 34,
                height: isPhone ? 30 : 34,
                color: "#ae1e21"
              }}
            >
              <CloseIcon
                sx={{
                  fontSize: isPhone
                    ? 18
                    : 20
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
            {detailsRow ? (
              <>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns:
                      isPhone
                        ? "repeat(2,minmax(0,1fr))"
                        : "repeat(3,minmax(0,1fr))",
                    gap: isPhone
                      ? 0.45
                      : 0.65
                  }}
                >
                  {[
                    ["اسم الطالب", detailsRow.studentName],
                    ["رقم الهوية", detailsRow.nationalId],
                    ["رقم الجوال", detailsRow.studentTel],
                    ["نوع التسجيل", detailsRow.regTypeName],
                    ["الدبلوم / الدورة", detailsRow.diplomName],
                    ["مسؤول الاتصال", detailsRow.trainerName],
                    ["نوع الطالب", detailsRow.studentType],
                    ["الفرع", detailsRow.branchName],
                    ["الرصيد السابق", money(detailsRow.preBalance)],
                    ["مدين", money(detailsRow.debit)],
                    ["دفعة مقدمة", money(detailsRow.startPay)],
                    ["قسط شهري", money(detailsRow.monthPay)],
                    ["سداد رسوم", money(detailsRow.feesPay)],
                    ["قيد مدين", money(detailsRow.mDaily)],
                    ["قيد دائن", money(detailsRow.dDaily)],
                    ["الرصيد الحالي", money(detailsRow.balance)]
                  ].map(([label, value]) => (
                    <Box
                      key={label}
                      sx={{
                        minWidth: 0,
                        p: isPhone
                          ? 0.55
                          : 0.72,
                        border:
                          "1px solid rgba(5,117,70,.14)",
                        borderRadius: 1.3,
                        backgroundColor:
                          isDark ? uiColors.nested : "#fbfdfc"
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
                          wordBreak:
                            "break-word"
                        }}
                      >
                        {value || "-"}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                <Stack
                  direction="row"
                  spacing={0.5}
                  useFlexGap
                  flexWrap="wrap"
                  sx={uiLayout.withUiSx({ mt: 0.8 }, uiLayout.actionBarSx)}
                >
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<ReceiptLongIcon />}
                    onClick={() => {
                      setMenuRow(detailsRow);
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
                    startIcon={<PaymentIcon />}
                    onClick={async () => {
                      setMenuRow(detailsRow);
                      await openPaymentOrder(
                        detailsRow
                      );
                    }}
                    sx={uiLayout.withUiSx({
                      fontFamily: "Cairo",
                      fontWeight: 900,
                      fontSize: isPhone
                        ? "0.75rem"
                        : "0.75rem"
                    }, uiLayout.buttonSx)}
                  >
                    طلب سداد
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
              onClick={closeDetails}
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
            setFilterDialogOpen(
              false
            )
          }
          fullWidth
          maxWidth="md"
          PaperProps={{
            sx: {
              borderRadius: isPhone
                ? 2.5
                : 4,
              width: !isDesktop
                ? isPhone
                  ? "94vw"
                  : "88vw"
                : undefined,
              maxHeight: !isDesktop
                ? "86dvh"
                : undefined,
              direction: "rtl"
            }
          }}
        >
          <DialogTitle
            sx={{
              fontFamily: "Cairo",
              fontWeight: 900,
              color: "#173b2b",
              display: "flex",
              alignItems: "center",
              justifyContent:
                "space-between",
              gap: 1
            }}
          >
            <Box>
              الفلاتر المتقدمة

              <Typography
                component="div"
                sx={{
                  mt: 0.35,
                  fontFamily:
                    "Cairo",
                  fontSize:
                    "0.75rem",
                  color:
                    "#708179",
                  fontWeight: 700
                }}
              >
                يمكنك تحديد أكثر من قيمة في كل فلتر أو تحديد الكل
              </Typography>
            </Box>

            {activeFilterCount >
              0 && (
              <Chip
                label={`${activeFilterCount} فلاتر نشطة`}
                sx={{
                  fontFamily:
                    "Cairo",
                  fontWeight: 800,
                  color: "#fff",
                  backgroundColor:
                    "#057546"
                }}
              />
            )}
          </DialogTitle>

          <DialogContent
            dividers
            sx={{
              background: isDark
                ? uiColors.section
                : "linear-gradient(135deg,#f7fbf9,#ffffff)"
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns:
                  {
                    xs: "1fr",
                    md:
                      "repeat(2,minmax(0,1fr))"
                  },
                gap: 1.25
              }}
            >
              <MultiValueFilter
                label="نوع التسجيل"
                options={
                  filterOptions
                    .regTypeName
                }
                value={
                  columnFilters
                    .regTypeName
                }
                onChange={(values) =>
                  updateColumnFilter(
                    "regTypeName",
                    values
                  )
                }
              />

              <MultiValueFilter
                label="الدبلوم أو الدورة"
                options={
                  filterOptions
                    .diplomName
                }
                value={
                  columnFilters
                    .diplomName
                }
                onChange={(values) =>
                  updateColumnFilter(
                    "diplomName",
                    values
                  )
                }
              />

              <MultiValueFilter
                label="مسؤول الاتصال"
                options={
                  filterOptions
                    .trainerName
                }
                value={
                  columnFilters
                    .trainerName
                }
                onChange={(values) =>
                  updateColumnFilter(
                    "trainerName",
                    values
                  )
                }
              />

              <MultiValueFilter
                label="نوع الطالب"
                options={
                  filterOptions
                    .studentType
                }
                value={
                  columnFilters
                    .studentType
                }
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
              py: 1.4
            }, uiLayout.dialogActionsSx)}
          >
            <Button
              color="error"
              startIcon={
                <RestartAltIcon />
              }
              onClick={
                resetColumnFilters
              }
              disabled={
                activeFilterCount ===
                0
              }
              sx={uiLayout.withUiSx({
                fontFamily: "Cairo",
                fontWeight: 800
              }, uiLayout.buttonSx)}
            >
              مسح الفلاتر
            </Button>

            <Box sx={{ flex: 1 }} />

            <Button
              variant="contained"
              onClick={() =>
                setFilterDialogOpen(
                  false
                )
              }
              sx={uiLayout.withUiSx({
                fontFamily: "Cairo",
                fontWeight: 900,
                background:
                  "linear-gradient(135deg,#057546,#034d31)"
              }, uiLayout.buttonSx)}
            >
              تطبيق وإغلاق
            </Button>
          </DialogActions>
        </Dialog>

        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={closeMenu}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "left"
          }}
        >
          <MenuItem
            onClick={() =>
              openAction("statement")
            }
          >
            <AccountBalanceWalletIcon
              sx={{ ml: 1 }}
            />
            كشف حساب
          </MenuItem>

          <MenuItem
            onClick={() =>
              openAction("fees")
            }
          >
            <ReceiptLongIcon sx={{ ml: 1 }} />
            استمارة رسوم
          </MenuItem>

          <MenuItem
            disabled={
              paymentContextLoading
            }
            onClick={() =>
              openAction("payment")
            }
          >
            {paymentContextLoading
              ? (
                <CircularProgress
                  size={18}
                  sx={{ ml: 1 }}
                />
              )
              : (
                <PaymentIcon
                  sx={{ ml: 1 }}
                />
              )}

            {paymentContextLoading
              ? "جاري تجهيز طلب السداد..."
              : "طلب سداد"}
          </MenuItem>

          <MenuItem
            onClick={() =>
              openAction("graduate")
            }
          >
            <SchoolIcon sx={{ ml: 1 }} />
            إنهاء الدراسة
          </MenuItem>

          <MenuItem
            onClick={() =>
              openAction("assign")
            }
          >
            <PersonAddAlt1Icon
              sx={{ ml: 1 }}
            />
            تعيين مسؤول الاتصال
          </MenuItem>

          <MenuItem
            onClick={() =>
              openAction("clear")
            }
            sx={{ color: "#ae1e21" }}
          >
            <PersonRemoveIcon sx={{ ml: 1 }} />
            حذف مسؤول الاتصال
          </MenuItem>
        </Menu>

        <StudentStatementDialog2
          open={statementOpen}
          onClose={() =>
            setStatementOpen(false)
          }
          student={selectedStudent}
          apiBaseUrl={API_BASE_URL}
        />

        <StudentRegFeesDialog
          open={feesOpen}
          onClose={() =>
            setFeesOpen(false)
          }
          student={selectedStudent}
          apiBaseUrl={API_BASE_URL}
          onSaved={async () => {
            setFeesOpen(false);
            await loadData();
          }}
        />

        <StudentPaymentOrderDialog
          open={paymentOpen}
          onClose={() => {
            setPaymentOpen(false);
            setPaymentContext(null);
          }}
          context={paymentContext}
          selectedStudent={selectedStudent}
          apiBaseUrl={API_BASE_URL}
          onSaved={async () => {
            setPaymentOpen(false);
            await loadData();
          }}
        />

        <Dialog sx={uiLayout.dialogLayoutSx}
          open={
            bulkTrainerDialogOpen
          }
          onClose={() => {
            if (
              bulkActionLoading
            ) {
              return;
            }

            setBulkTrainerDialogOpen(
              false
            );
            setBulkSelectedTrainer(
              null
            );
          }}
          fullWidth
          maxWidth="sm"
          PaperProps={{
            sx: {
              borderRadius: 4,
              direction: "rtl"
            }
          }}
        >
          <DialogTitle
            sx={{
              fontFamily: "Cairo",
              fontWeight: 900,
              color: "#173b2b"
            }}
          >
            تعيين مسؤول اتصال جماعي
          </DialogTitle>

          <DialogContent
            dividers
          >
            <Stack
              spacing={1.5}
              sx={{ mt: 0.5 }}
            >
              <Chip
                label={`عدد الطلاب المحددين: ${selectedRows.length}`}
                sx={{
                  alignSelf:
                    "flex-start",
                  fontFamily:
                    "Cairo",
                  fontWeight: 900,
                  color: "#fff",
                  backgroundColor:
                    "#057546"
                }}
              />

              <Autocomplete
                options={trainers}
                value={
                  bulkSelectedTrainer
                }
                onChange={(
                  _,
                  value
                ) =>
                  setBulkSelectedTrainer(
                    value
                  )
                }
                getOptionLabel={(
                  option
                ) =>
                  option?.name || ""
                }
                isOptionEqualToValue={(
                  option,
                  value
                ) =>
                  String(
                    option?.guid
                  ) ===
                  String(
                    value?.guid
                  )
                }
                noOptionsText="لا يوجد مسؤولو اتصال"
                renderInput={(
                  params
                ) => (
                  <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                    {...params}
                    label="مسؤول الاتصال"
                    placeholder="اختر مسؤول الاتصال"
                  />
                )}
              />

              <Typography
                sx={{
                  fontFamily:
                    "Cairo",
                  fontSize:
                    "0.78rem",
                  color: "#708179",
                  fontWeight: 700
                }}
              >
                سيتم تطبيق المسؤول المختار على جميع الطلاب المحددين 
              </Typography>
            </Stack>
          </DialogContent>

          <DialogActions
            sx={uiLayout.withUiSx({
              px: 2,
              py: 1.4
            }, uiLayout.dialogActionsSx)}
          >
            <Button
              onClick={() => {
                setBulkTrainerDialogOpen(
                  false
                );
                setBulkSelectedTrainer(
                  null
                );
              }}
              disabled={
                bulkActionLoading
              }
              sx={uiLayout.withUiSx({
                fontFamily: "Cairo",
                fontWeight: 800
              }, uiLayout.buttonSx)}
            >
              إلغاء
            </Button>

            <Button
              variant="contained"
              onClick={
                bulkAssignTrainer
              }
              disabled={
                bulkActionLoading ||
                !bulkSelectedTrainer
              }
              startIcon={
                bulkActionLoading
                  ? (
                    <CircularProgress
                      size={17}
                      color="inherit"
                    />
                  )
                  : <GroupAddIcon />
              }
              sx={uiLayout.withUiSx({
                fontFamily: "Cairo",
                fontWeight: 900,
                background:
                  "linear-gradient(135deg,#057546,#034d31)"
              }, uiLayout.buttonSx)}
            >
              تنفيذ التعيين
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog sx={uiLayout.dialogLayoutSx}
          open={trainerDialogOpen}
          onClose={() =>
            setTrainerDialogOpen(false)
          }
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle
            sx={{
              fontFamily: "Cairo",
              fontWeight: 900
            }}
          >
            تعيين مسؤول الاتصال
          </DialogTitle>

          <DialogContent>
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              <Chip
                label={`الطالب: ${menuRow?.studentName || "-"}`}
                sx={{
                  fontFamily: "Cairo",
                  fontWeight: 800
                }}
              />

              <Autocomplete
                options={trainers}
                value={selectedTrainer}
                onChange={(_, value) =>
                  setSelectedTrainer(value)
                }
                getOptionLabel={(option) =>
                  option?.name || ""
                }
                isOptionEqualToValue={(
                  option,
                  value
                ) =>
                  String(option?.guid) ===
                  String(value?.guid)
                }
                renderInput={(params) => (
                  <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                    {...params}
                    label="مسؤول الاتصال"
                  />
                )}
              />
            </Stack>
          </DialogContent>

          <DialogActions sx={uiLayout.dialogActionsSx}>
            <Button sx={uiLayout.buttonSx}
              onClick={() =>
                setTrainerDialogOpen(false)
              }
            >
              إلغاء
            </Button>

            <Button
              variant="contained"
              onClick={saveTrainer}
              sx={uiLayout.withUiSx({
                fontFamily: "Cairo",
                fontWeight: 900,
                backgroundColor: "#057546"
              }, uiLayout.buttonSx)}
            >
              حفظ
            </Button>
          </DialogActions>
        </Dialog>
      </PageContainer>
    </Box></NavigationShell>
  );
};

export default GraduatesFollowReport;