import * as uiLayout from '../components/common/uiLayout';
import './rtl-forms-fix.css';
import { DESKTOP_BREAKPOINT, navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import {
  Alert,
  AppBar,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Stack,
  TextField,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";

import { DataGrid } from "@mui/x-data-grid";

import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import CloseIcon from "@mui/icons-material/Close";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import ClearAllOutlinedIcon from "@mui/icons-material/ClearAllOutlined";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";






const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "http://localhost:5258";

const primaryColor = "#057546";
const primaryDark = "#034d31";
const accentColor = "#ae1e21";
const textColor = "#1f2d3d";
const mutedColor = "#6f8a81";
const borderColor = "#dfe9e4";

const localDate = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000)
    .toISOString()
    .slice(0, 10);
};

const currentUser = () => {
  try {
    return JSON.parse(
      localStorage.getItem("user") || "{}"
    );
  } catch {
    return {};
  }
};

const getUserGuid = (user) =>
  user?.userGuid ||
  user?.guid ||
  user?.Guid ||
  user?.USER_GUID ||
  "";

const numberValue = (value) => {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
};

const money = (value) =>
  numberValue(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const shortMoney = (value) =>
  numberValue(value).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

const dateOnly = (value) => {
  if (!value) return "";
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    const [y, m, d] = text.slice(0, 10).split("-");
    return `${d}/${m}/${y}`;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return text;
  }

  return parsed.toLocaleDateString("en-GB");
};

const csvCell = (value) =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;


const normalizeFilterValue = (value) =>
  String(value ?? "").trim();

const multiSelectMenuProps = {
  PaperProps: {
    sx: {
      maxHeight: 320,
      borderRadius: 2,
      mt: 0.5
    }
  },
  MenuListProps: {
    dense: true
  }
};

const FILTER_FIELDS = [
  { key: "code", label: "رقم القيد" },
  { key: "dayDate", label: "تاريخ القيد", formatter: dateOnly },
  { key: "name", label: "نوع المستند" },
  { key: "actionCode", label: "رقم المستند" },
  { key: "maden", label: "مدين", formatter: shortMoney },
  { key: "daen", label: "دائن", formatter: shortMoney },
  { key: "balance", label: "الرصيد", formatter: shortMoney },
  { key: "notes", label: "البيان" },
  { key: "centerName", label: "مركز التكلفة" },
  { key: "branchName", label: "الفرع" }
];

const createEmptyAdvancedFilters = () =>
  FILTER_FIELDS.reduce((acc, field) => {
    acc[field.key] = [];
    return acc;
  }, {});

export default function GeneralAccountStatement() {
  const theme = useTheme();

  const isDesktop =
    useMediaQuery(
      `(min-width:${DESKTOP_BREAKPOINT}px)`,
      { noSsr: true }
    );

  const isPhone =
    useMediaQuery(
      theme.breakpoints.down("sm")
    );

  const isTablet =
    useMediaQuery(
      "(min-width:600px) and (max-width:1599px)"
    );

  const user =
    useMemo(() => currentUser(), []);

  const userGuid =
    useMemo(
      () => String(getUserGuid(user)).trim(),
      [user]
    );

  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  const [fromDate, setFromDate] =
    useState(localDate());

  const [toDate, setToDate] =
    useState(localDate());

  const [selectedAccount, setSelectedAccount] =
    useState(null);

  const [rows, setRows] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [permissionLoading, setPermissionLoading] =
    useState(true);

  const [authorized, setAuthorized] =
    useState(false);

  const [accountDialogOpen, setAccountDialogOpen] =
    useState(false);

  const [accountSearch, setAccountSearch] =
    useState("");

  const [accounts, setAccounts] =
    useState([]);

  const [accountsLoading, setAccountsLoading] =
    useState(false);

  const [selectedAccountGuid, setSelectedAccountGuid] =
    useState("");

  const [gridSearch, setGridSearch] =
    useState("");

  const [advancedFiltersOpen, setAdvancedFiltersOpen] =
    useState(false);

  const [advancedFilters, setAdvancedFilters] =
    useState(createEmptyAdvancedFilters);

  // نافذة فلتر واحدة خفيفة بدل إنشاء آلاف MenuItem لكل الأعمدة.
  const [filterPickerField, setFilterPickerField] =
    useState(null);
  const [filterPickerSearch, setFilterPickerSearch] =
    useState("");

  const [detailRow, setDetailRow] =
    useState(null);

  const [detailOpen, setDetailOpen] =
    useState(false);

  const activeRequestRef = useRef(null);
  const requestSequenceRef = useRef(0);
  const accountRequestRef = useRef(null);

  // =========================================================
  // Permission:
  // قائمة الحسابات العامة + كشف حساب code=21
  // =========================================================
  useEffect(() => {
    let alive = true;

    const checkPermission = async () => {
      if (!userGuid) {
        if (alive) {
          setAuthorized(false);
          setPermissionLoading(false);
        }
        return;
      }

      try {
        setPermissionLoading(true);

        const response = await fetch(
          `${API_BASE_URL}/api/user-permissions/${encodeURIComponent(
            userGuid
          )}`,
          {
            cache: "no-store",
            headers: {
              Accept: "application/json"
            }
          }
        );

        const result =
          await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            result?.message ||
            "تعذر تحميل الصلاحيات"
          );
        }

        const generalAccounts =
          result?.data?.generalAccounts || {};

        const screens =
          generalAccounts?.screens || {};

        if (alive) {
          setAuthorized(
            generalAccounts?.canView === true &&
            screens?.generalAccountStatement === true
          );
        }
      } catch {
        if (alive) {
          setAuthorized(false);
        }
      } finally {
        if (alive) {
          setPermissionLoading(false);
        }
      }
    };

    checkPermission();

    return () => {
      alive = false;
    };
  }, [userGuid]);

  // =========================================================
  // Load account list - server search only.
  // Same desktop logic:
  // IsUse = 1, AccountType2 = 2 => AccountType <> 2
  // =========================================================
  const loadAccounts =
    useCallback(
      async (query = "") => {
        if (!authorized || !userGuid) {
          return;
        }

        if (accountRequestRef.current) {
          accountRequestRef.current.abort();
        }

        const controller =
          new AbortController();

        accountRequestRef.current =
          controller;

        try {
          setAccountsLoading(true);

          const params =
            new URLSearchParams({
              userGuid,
              q: String(query || "").trim(),
              limit: "100"
            });

          const response =
            await fetch(
              `${API_BASE_URL}/api/general-account-statement/accounts?${params.toString()}`,
              {
                cache: "no-store",
                headers: {
                  Accept:
                    "application/json"
                },
                signal:
                  controller.signal
              }
            );

          const result =
            await response
              .json()
              .catch(() => null);

          if (!response.ok) {
            throw new Error(
              result?.message ||
              "تعذر تحميل الحسابات"
            );
          }

          setAccounts(
            Array.isArray(result?.data)
              ? result.data
              : []
          );
        } catch (e) {
          if (e?.name !== "AbortError") {
            setAccounts([]);
          }
        } finally {
          if (
            accountRequestRef.current ===
            controller
          ) {
            setAccountsLoading(false);
            accountRequestRef.current =
              null;
          }
        }
      },
      [authorized, userGuid]
    );

  useEffect(() => {
    if (!accountDialogOpen) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        loadAccounts(accountSearch);
      }, 240);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    accountDialogOpen,
    accountSearch,
    loadAccounts
  ]);

  // =========================================================
  // Load statement.
  // Selecting account behaves like Desktop and loads directly.
  // =========================================================
  const loadStatement =
    useCallback(
      async (accountOverride = null) => {
        const account =
          accountOverride ||
          selectedAccount;

        if (!authorized || !userGuid) {
          return;
        }

        if (!account?.guid) {
          setError(
            "برجاء اختيار الحساب أولاً"
          );
          return;
        }

        if (!fromDate || !toDate) {
          setError(
            "برجاء اختيار الفترة من وإلى"
          );
          return;
        }

        if (fromDate > toDate) {
          setError(
            "تاريخ البداية لا يمكن أن يكون بعد تاريخ النهاية"
          );
          return;
        }

        if (activeRequestRef.current) {
          activeRequestRef.current.abort();
        }

        const controller =
          new AbortController();

        activeRequestRef.current =
          controller;

        const requestId =
          ++requestSequenceRef.current;

        try {
          setLoading(true);
          setError("");

          const params =
            new URLSearchParams({
              userGuid,
              accountGuid:
                account.guid,
              fromDate,
              toDate
            });

          const response =
            await fetch(
              `${API_BASE_URL}/api/general-account-statement?${params.toString()}`,
              {
                cache: "no-store",
                headers: {
                  Accept:
                    "application/json"
                },
                signal:
                  controller.signal
              }
            );

          const result =
            await response
              .json()
              .catch(() => null);

          if (
            requestId !==
            requestSequenceRef.current
          ) {
            return;
          }

          if (!response.ok) {
            throw new Error(
              result?.message ||
              result?.error ||
              "تعذر تحميل كشف الحساب"
            );
          }

          setRows(
            Array.isArray(result?.data)
              ? result.data
              : []
          );
        } catch (e) {
          if (e?.name === "AbortError") {
            return;
          }

          if (
            requestId !==
            requestSequenceRef.current
          ) {
            return;
          }

          setRows([]);
          setError(
            e?.message ||
            "تعذر تحميل كشف الحساب"
          );
        } finally {
          if (
            requestId ===
            requestSequenceRef.current
          ) {
            setLoading(false);

            if (
              activeRequestRef.current ===
              controller
            ) {
              activeRequestRef.current =
                null;
            }
          }
        }
      },
      [
        authorized,
        userGuid,
        selectedAccount,
        fromDate,
        toDate
      ]
    );

  useEffect(() => {
    return () => {
      activeRequestRef.current?.abort?.();
      accountRequestRef.current?.abort?.();
    };
  }, []);

  const chooseAccount = async () => {
    const account =
      accounts.find(
        (item) =>
          String(item?.guid) ===
          String(selectedAccountGuid)
      );

    if (!account) {
      return;
    }

    setSelectedAccount(account);
    setAccountDialogOpen(false);
    setAccountSearch("");
    setGridSearch("");
    setAdvancedFilters(createEmptyAdvancedFilters());

    await loadStatement(account);
  };

  // =========================================================
  // Performance: build formatted values once when rows change.
  // No MenuItem rendering is done here.
  // =========================================================
  const preparedRows =
    useMemo(() => {
      return rows.map((row) => {
        const filterValues = {
          code: normalizeFilterValue(row?.code),
          dayDate: dateOnly(row?.dayDate),
          name: normalizeFilterValue(row?.name),
          actionCode: normalizeFilterValue(row?.actionCode),
          maden: shortMoney(row?.maden),
          daen: shortMoney(row?.daen),
          balance: shortMoney(row?.balance),
          notes: normalizeFilterValue(row?.notes),
          centerName: normalizeFilterValue(row?.centerName),
          branchName: normalizeFilterValue(row?.branchName)
        };

        return {
          row,
          filterValues,
          searchText: [
            row?.dayDate,
            row?.code,
            row?.name,
            row?.actionCode,
            row?.notes,
            row?.centerName,
            row?.branchName,
            row?.maden,
            row?.daen,
            row?.balance
          ]
            .filter(
              (value) =>
                value !== null &&
                value !== undefined
            )
            .join(" ")
            .toLowerCase()
        };
      });
    }, [rows]);

  const filterOptions =
    useMemo(() => {
      const sets = {};

      FILTER_FIELDS.forEach((field) => {
        sets[field.key] = new Set();
      });

      for (const item of preparedRows) {
        for (const field of FILTER_FIELDS) {
          const value =
            item.filterValues[field.key];

          if (value) {
            sets[field.key].add(value);
          }
        }
      }

      const result = {};

      FILTER_FIELDS.forEach((field) => {
        result[field.key] =
          Array.from(sets[field.key]).sort(
            (a, b) =>
              String(a).localeCompare(
                String(b),
                "ar",
                { numeric: true }
              )
          );
      });

      return result;
    }, [preparedRows]);

  const activeAdvancedFilterCount =
    useMemo(
      () =>
        Object.values(advancedFilters)
          .filter(
            (value) =>
              Array.isArray(value) &&
              value.length > 0
          )
          .length,
      [advancedFilters]
    );

  const hasAnyAdvancedFilter =
    activeAdvancedFilterCount > 0;

  const clearAdvancedFilters =
    useCallback(() => {
      setAdvancedFilters(
        createEmptyAdvancedFilters()
      );
    }, []);

  const toggleFilterValue =
    useCallback((key, value) => {
      setAdvancedFilters((current) => {
        const oldValues =
          current[key] || [];

        const exists =
          oldValues.includes(value);

        return {
          ...current,
          [key]: exists
            ? oldValues.filter(
                (item) => item !== value
              )
            : [...oldValues, value]
        };
      });
    }, []);

  const openFilterPicker =
    useCallback((field) => {
      setFilterPickerSearch("");
      setFilterPickerField(field);
    }, []);

  const closeFilterPicker =
    useCallback(() => {
      setFilterPickerField(null);
      setFilterPickerSearch("");
    }, []);

  const pickerOptions =
    useMemo(() => {
      if (!filterPickerField) {
        return [];
      }

      const all =
        filterOptions[
          filterPickerField.key
        ] || [];

      const q =
        filterPickerSearch
          .trim()
          .toLowerCase();

      if (!q) {
        return all.slice(0, 80);
      }

      const result = [];

      for (let i = 0; i < all.length; i += 1) {
        const value = all[i];

        if (
          String(value)
            .toLowerCase()
            .includes(q)
        ) {
          result.push(value);

          if (result.length >= 80) {
            break;
          }
        }
      }

      return result;
    }, [
      filterPickerField,
      filterPickerSearch,
      filterOptions
    ]);

  const selectedPickerValues =
    filterPickerField
      ? advancedFilters[
          filterPickerField.key
        ] || []
      : [];

  const selectedSets =
    useMemo(() => {
      const result = {};

      FILTER_FIELDS.forEach((field) => {
        const values =
          advancedFilters[field.key] || [];

        if (values.length) {
          result[field.key] =
            new Set(values);
        }
      });

      return result;
    }, [advancedFilters]);

  const filteredRows =
    useMemo(() => {
      const q =
        gridSearch
          .trim()
          .toLowerCase();

      const activeKeys =
        Object.keys(selectedSets);

      // Fast path: no filters/search -> return original array without scan.
      if (!q && activeKeys.length === 0) {
        return rows;
      }

      const result = [];

      for (const item of preparedRows) {
        if (
          q &&
          !item.searchText.includes(q)
        ) {
          continue;
        }

        let matches = true;

        for (let i = 0; i < activeKeys.length; i += 1) {
          const key =
            activeKeys[i];

          if (
            !selectedSets[key].has(
              item.filterValues[key]
            )
          ) {
            matches = false;
            break;
          }
        }

        if (matches) {
          result.push(item.row);
        }
      }

      return result;
    }, [
      rows,
      preparedRows,
      gridSearch,
      selectedSets
    ]);

  const totals =
    useMemo(() => {
      return filteredRows.reduce(
        (acc, row) => {
          acc.maden +=
            numberValue(row.maden);

          acc.daen +=
            numberValue(row.daen);

          return acc;
        },
        {
          maden: 0,
          daen: 0
        }
      );
    }, [filteredRows]);

  const totalBalance =
    totals.maden - totals.daen;

  const exportCsv = () => {
    if (!filteredRows.length) {
      return;
    }

    const header = [
      "رقم القيد",
      "تاريخ القيد",
      "نوع المستند",
      "رقم المستند",
      "مدين",
      "دائن",
      "الرصيد",
      "البيان",
      "مركز التكلفة",
      "الفرع"
    ];

    const lines =
      filteredRows.map((row) =>
        [
          row.code,
          dateOnly(row.dayDate),
          row.name,
          row.actionCode,
          row.maden,
          row.daen,
          row.balance,
          row.notes,
          row.centerName,
          row.branchName
        ]
          .map(csvCell)
          .join(",")
      );

    const csv =
      "\uFEFF" +
      [
        header.map(csvCell).join(","),
        ...lines
      ].join("\n");

    const blob =
      new Blob(
        [csv],
        {
          type:
            "text/csv;charset=utf-8"
        }
      );

    const url =
      URL.createObjectURL(blob);

    const a =
      document.createElement("a");

    a.href = url;
    a.download =
      `كشف-حساب-${
        selectedAccount?.name ||
        "حساب"
      }-${fromDate}-${toDate}.csv`;

    a.click();
    URL.revokeObjectURL(url);
  };

  const openDetails = (row) => {
    setDetailRow(row);
    setDetailOpen(true);
  };

  const desktopColumns =
    useMemo(
      () => [
        {
          field: "code",
          headerName: "رقم القيد",
          width: 105,
          align: "center",
          headerAlign: "center"
        },
        {
          field: "dayDate",
          headerName: "تاريخ القيد",
          width: 125,
          align: "center",
          headerAlign: "center",
          valueFormatter:
            (params) =>
              dateOnly(params.value)
        },
        {
          field: "name",
          headerName: "نوع المستند",
          width: 155,
          align: "center",
          headerAlign: "center"
        },
        {
          field: "actionCode",
          headerName: "رقم المستند",
          width: 115,
          align: "center",
          headerAlign: "center"
        },
        {
          field: "maden",
          headerName: "مدين",
          width: 115,
          align: "center",
          headerAlign: "center",
          valueFormatter:
            (params) =>
              shortMoney(params.value)
        },
        {
          field: "daen",
          headerName: "دائن",
          width: 115,
          align: "center",
          headerAlign: "center",
          valueFormatter:
            (params) =>
              shortMoney(params.value)
        },
        {
          field: "balance",
          headerName: "الرصيد",
          width: 130,
          align: "center",
          headerAlign: "center",
          valueFormatter:
            (params) =>
              shortMoney(params.value)
        },
        {
          field: "notes",
          headerName: "بيان",
          minWidth: 300,
          flex: 1.6
        },
        {
          field: "centerName",
          headerName: "مركز التكلفة",
          minWidth: 220,
          flex: 1.15
        },
        {
          field: "branchName",
          headerName: "الفرع",
          minWidth: 230,
          flex: 1.2
        }
      ],
      []
    );

  const compactColumns =
    useMemo(() => {
      const cols = [
        {
          field: "dayDate",
          headerName: "التاريخ",
          flex: 0.95,
          minWidth: 0,
          align: "center",
          headerAlign: "center",
          sortable: false,
          valueFormatter:
            (params) =>
              dateOnly(params.value)
        },
        {
          field: "actionCode",
          headerName: "المستند",
          flex: 0.8,
          minWidth: 0,
          align: "center",
          headerAlign: "center",
          sortable: false
        },
        {
          field: "maden",
          headerName: "مدين",
          flex: 0.72,
          minWidth: 0,
          align: "center",
          headerAlign: "center",
          sortable: false,
          valueFormatter:
            (params) =>
              shortMoney(params.value)
        },
        {
          field: "daen",
          headerName: "دائن",
          flex: 0.72,
          minWidth: 0,
          align: "center",
          headerAlign: "center",
          sortable: false,
          valueFormatter:
            (params) =>
              shortMoney(params.value)
        },
        {
          field: "balance",
          headerName: "الرصيد",
          flex: 0.9,
          minWidth: 0,
          align: "center",
          headerAlign: "center",
          sortable: false,
          valueFormatter:
            (params) =>
              shortMoney(params.value)
        }
      ];

      if (!isPhone) {
        cols.splice(
          2,
          0,
          {
            field: "name",
            headerName:
              "نوع المستند",
            flex: 1.05,
            minWidth: 0,
            align: "center",
            headerAlign:
              "center",
            sortable: false
          }
        );
      }

      cols.push({
        field: "__details",
        headerName: "",
        width: isPhone ? 34 : 42,
        minWidth:
          isPhone ? 34 : 42,
        maxWidth:
          isPhone ? 34 : 42,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => (
          <IconButton
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              openDetails(
                params.row
              );
            }}
            sx={{
              width:
                isPhone
                  ? 24
                  : 28,
              height:
                isPhone
                  ? 24
                  : 28,
              p: 0,
              color:
                primaryColor,
              bgcolor:
                "#eef8f3",
              border:
                "1px solid rgba(5,117,70,.22)"
            }}
          >
            <VisibilityOutlinedIcon
              sx={{
                fontSize:
                  isPhone
                    ? 14
                    : 17
              }}
            />
          </IconButton>
        )
      });

      return cols;
    }, [isPhone]);

  const renderAdvancedFilter =
    (field) => {
      const selected =
        advancedFilters[field.key] || [];

      return (
        <Button
          key={field.key}
          variant={
            selected.length
              ? "contained"
              : "outlined"
          }
          onClick={() =>
            openFilterPicker(field)
          }
          sx={uiLayout.withUiSx({
            minWidth: 0,
            minHeight:
              isPhone ? 34 : 38,
            justifyContent:
              "space-between",
            px: isPhone ? 0.8 : 1,
            fontFamily: "Cairo",
            fontWeight: 900,
            fontSize:
              isPhone ? 12 : 12,
            textTransform: "none",
            overflow: "hidden",
            bgcolor:
              selected.length
                ? primaryColor
                : "#fff",
            color:
              selected.length
                ? "#fff"
                : textColor,
            borderColor:
              "rgba(5,117,70,.35)",
            "&:hover": {
              bgcolor:
                selected.length
                  ? primaryDark
                  : "#eef8f3"
            }
          }, uiLayout.buttonSx)}
        >
          <Box
            component="span"
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}
          >
            {field.label}
          </Box>

          <Chip
            size="small"
            label={
              selected.length > 0
                ? selected.length
                : "▼"
            }
            sx={{
              ml: 0.6,
              height: 20,
              minWidth: 24,
              fontSize: 12,
              pointerEvents: "none",
              bgcolor:
                selected.length
                  ? "rgba(255,255,255,.18)"
                  : "#eef8f3",
              color:
                selected.length
                  ? "#fff"
                  : primaryColor
            }}
          />
        </Button>
      );
    };

  if (permissionLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          bgcolor: "#f4f7f6"
        }}
      >
        <Stack
          alignItems="center"
          spacing={1}
        >
          <CircularProgress />
          <Typography
            sx={{
              fontFamily: "Cairo",
              fontWeight: 800
            }}
          >
            جاري التحقق من الصلاحيات...
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (!authorized) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          bgcolor: "#f4f7f6",
          p: 2
        }}
      >
        <Alert
          severity="error"
          sx={{
            fontFamily: "Cairo",
            fontWeight: 800
          }}
        >
          ليس لديك صلاحية الحسابات العامة / كشف حساب.
        </Alert>
      </Box>
    );
  }

  return (
    <NavigationShell variant="standard" mobileOpen={mobileSidebarOpen} onMobileClose={() =>
          setMobileSidebarOpen(false)
        }><Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f4f7f6",
        direction: "rtl",
        overflowX: "hidden"
      }}
    >
      

      <Box
        component="main"
        sx={{
          boxSizing: "border-box",
          p: isDesktop ? "16px 18px" : isPhone ? "6px" : "10px",
          direction: "rtl",
          ...navigationContentSx
        }}
      >
        {!isDesktop && (
          <AppBar
            position="static"
            elevation={0}
            sx={{
              borderRadius:
                isPhone
                  ? "8px 8px 0 0"
                  : 2,
              bgcolor:
                primaryColor,
              mb: 0.6
            }}
          >
            <Toolbar
              variant="dense"
              sx={{
                minHeight:
                  isPhone
                    ? "44px !important"
                    : "50px !important"
              }}
            >
              <IconButton
                onClick={() =>
                  setMobileSidebarOpen(true)
                }
                sx={{
                  color: "#fff"
                }}
              >
                <MenuRoundedIcon />
              </IconButton>

              <Typography
                sx={{
                  flexGrow: 1,
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  fontSize:
                    isPhone
                      ? 14
                      : 16
                }}
              >
                كشف حساب عام
              </Typography>
            </Toolbar>
          </AppBar>
        )}

        <Paper
          elevation={0}
          sx={{
            border:
              `1px solid ${borderColor}`,
            borderRadius: 3,
            overflow: "hidden",
            bgcolor: "#fff"
          }}
        >
          <Box
            sx={{
              px:
                isPhone
                  ? 1
                  : 1.6,
              py:
                isPhone
                  ? 0.8
                  : 1.2,
              bgcolor:
                primaryColor,
              color: "#fff"
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
            >
              <AccountBalanceIcon />

              <Box>
                <Typography
                  sx={{
                    fontFamily:
                      "Cairo",
                    fontWeight: 950,
                    fontSize:
                      isPhone
                        ? 14
                        : 20
                  }}
                >
                  كشف حساب عام
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Box
            sx={{
              p:
                isPhone
                  ? 0.7
                  : isTablet
                    ? 1
                    : 1.4
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: isPhone ? 0.65 : 0.9,
                mb: 0.9,
                border:
                  `1px solid ${borderColor}`,
                borderRadius: 2,
                bgcolor: "#fbfdfc"
              }}
            >
              <Box
                sx={uiLayout.withUiSx({
                  display: "grid",
                  gridTemplateColumns: isDesktop
                    ? "150px 150px minmax(230px,1fr) 110px 125px minmax(220px,280px)"
                    : isTablet
                      ? "repeat(3,minmax(0,1fr))"
                      : "repeat(2,minmax(0,1fr))",
                  gap: isPhone ? 0.45 : 0.65,
                  alignItems: "center",
                  direction: "rtl"
                }, uiLayout.filterBarSx)}
              >
                <TextField
                  type="date"
                  label="الفترة من"
                  value={fromDate}
                  onChange={(e) =>
                    setFromDate(
                      e.target.value
                    )
                  }
                  inputProps={{
                    max:
                      toDate ||
                      undefined
                  , dir: "ltr" , style: { direction: "ltr", unicodeBidi: "isolate" } }}
                  InputLabelProps={{
                    shrink: true
                  }}
                  size="small"
                  sx={uiLayout.withUiSx({
                    minWidth: 0,
                    "& .MuiInputBase-root": {
                      minHeight: isPhone ? 34 : 40
                    },
                    "& input": {
                      fontSize: isPhone ? 12 : 12,
                      fontWeight: 800
                    }
                  }, uiLayout.formFieldSx)}
                />

                <TextField
                  type="date"
                  label="الفترة إلى"
                  value={toDate}
                  onChange={(e) =>
                    setToDate(
                      e.target.value
                    )
                  }
                  inputProps={{
                    min:
                      fromDate ||
                      undefined
                  , dir: "ltr" , style: { direction: "ltr", unicodeBidi: "isolate" } }}
                  InputLabelProps={{
                    shrink: true
                  }}
                  size="small"
                  sx={uiLayout.withUiSx({
                    minWidth: 0,
                    "& .MuiInputBase-root": {
                      minHeight: isPhone ? 34 : 40
                    },
                    "& input": {
                      fontSize: isPhone ? 12 : 12,
                      fontWeight: 800
                    }
                  }, uiLayout.formFieldSx)}
                />

                <Button
                  variant="outlined"
                  startIcon={
                    <SearchIcon />
                  }
                  onClick={() => {
                    setSelectedAccountGuid(
                      selectedAccount?.guid ||
                      ""
                    );
                    setAccountDialogOpen(
                      true
                    );
                  }}
                  sx={uiLayout.withUiSx({
                    minWidth: 0,
                    minHeight: isPhone ? 34 : 40,
                    fontWeight: 900,
                    fontSize: isPhone ? 12 : 12,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    justifyContent: "flex-start",
                    gridColumn: isPhone
                      ? "1 / -1"
                      : "auto"
                  }, uiLayout.buttonSx)}
                >
                  <Box
                    component="span"
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      display: "block",
                      width: "100%"
                    }}
                  >
                    {selectedAccount?.name
                      ? selectedAccount.name
                      : "اختيار الحساب"}
                  </Box>
                </Button>

                <Button
                  variant="contained"
                  startIcon={
                    loading
                      ? (
                        <CircularProgress
                          size={14}
                          sx={{
                            color: "#fff"
                          }}
                        />
                      )
                      : (
                        <RefreshIcon />
                      )
                  }
                  onClick={() =>
                    loadStatement()
                  }
                  disabled={
                    loading ||
                    !selectedAccount
                  }
                  sx={uiLayout.withUiSx({
                    minHeight: isPhone ? 34 : 40,
                    bgcolor:
                      primaryColor,
                    fontWeight: 900,
                    fontSize: isPhone ? 12 : 12,
                    "&:hover": {
                      bgcolor:
                        primaryDark
                    }
                  }, uiLayout.buttonSx)}
                >
                  {loading
                    ? "جاري..."
                    : "عرض"}
                </Button>

                <Button
                  variant="outlined"
                  startIcon={
                    <FileDownloadIcon />
                  }
                  onClick={exportCsv}
                  disabled={
                    !filteredRows.length
                  }
                  sx={uiLayout.withUiSx({
                    minHeight: isPhone ? 34 : 40,
                    fontWeight: 900,
                    fontSize: isPhone ? 12 : 12,
                    whiteSpace: "nowrap"
                  }, uiLayout.buttonSx)}
                >
                  تصدير Excel
                </Button>

                <TextField InputLabelProps={{ shrink: true }}
                  value={gridSearch}
                  onChange={(e) =>
                    setGridSearch(
                      e.target.value
                    )
                  }
                  placeholder="بحث داخل الحركة..."
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon
                          sx={{
                            fontSize:
                              isPhone ? 15 : 18
                          }}
                        />
                      </InputAdornment>
                    )
                  }}
                  sx={uiLayout.withUiSx({
                    minWidth: 0,
                    gridColumn: isPhone
                      ? "1 / -1"
                      : "auto",
                    "& .MuiInputBase-root": {
                      minHeight: isPhone ? 34 : 40
                    },
                    "& input": {
                      fontSize: isPhone ? 12 : 12
                    }
                  }, uiLayout.formFieldSx)}
                />
              </Box>

              <Stack
                direction="row"
                alignItems="center"
                spacing={0.6}
                sx={uiLayout.withUiSx({
                  mt: 0.65,
                  direction: "rtl",
                  flexWrap: "wrap",
                  gap: 0.45
                }, uiLayout.actionBarSx)}
              >
                <Button
                  variant={
                    advancedFiltersOpen
                      ? "contained"
                      : "outlined"
                  }
                  startIcon={
                    <TuneOutlinedIcon />
                  }
                  endIcon={
                    advancedFiltersOpen
                      ? <ExpandLessRoundedIcon />
                      : <ExpandMoreRoundedIcon />
                  }
                  onClick={() =>
                    setAdvancedFiltersOpen(
                      (current) => !current
                    )
                  }
                  sx={uiLayout.withUiSx({
                    minHeight: isPhone ? 32 : 36,
                    bgcolor:
                      advancedFiltersOpen
                        ? primaryColor
                        : undefined,
                    fontWeight: 900,
                    fontSize: isPhone ? 12 : 12
                  }, uiLayout.buttonSx)}
                >
                  فلاتر متقدمة
                  {activeAdvancedFilterCount > 0
                    ? ` (${activeAdvancedFilterCount})`
                    : ""}
                </Button>

                {hasAnyAdvancedFilter && (
                  <Button
                    variant="text"
                    color="error"
                    startIcon={
                      <ClearAllOutlinedIcon />
                    }
                    onClick={clearAdvancedFilters}
                    sx={uiLayout.withUiSx({
                      minHeight: isPhone ? 32 : 36,
                      fontWeight: 900,
                      fontSize: isPhone ? 12 : 12
                    }, uiLayout.buttonSx)}
                  >
                    مسح الفلاتر
                  </Button>
                )}

                <Chip
                  size="small"
                  icon={<FilterAltOutlinedIcon />}
                  label={`المعروض: ${filteredRows.length} من ${rows.length}`}
                  sx={{
                    ml: "auto",
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    fontSize: isPhone ? 12 : 12
                  }}
                />
              </Stack>

              <Collapse in={advancedFiltersOpen}>
                <Box
                  sx={{
                    mt: 0.8,
                    p: isPhone ? 0.55 : 0.8,
                    borderRadius: 2,
                    border:
                      "1px solid rgba(5,117,70,.16)",
                    bgcolor: "#f5faf7"
                  }}
                >
                  <Typography
                    sx={{
                      mb: 0.55,
                      fontFamily: "Cairo",
                      fontWeight: 950,
                      color: primaryColor,
                      fontSize: isPhone ? 12 : 12,
                      direction: "ltr"
                    }}
                  >
                    اختر قيمة أو أكثر من أي عمود
                  </Typography>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: isDesktop
                        ? "repeat(5,minmax(0,1fr))"
                        : isTablet
                          ? "repeat(3,minmax(0,1fr))"
                          : "repeat(2,minmax(0,1fr))",
                      gap: isPhone ? 0.45 : 0.65,
                      direction: "rtl"
                    }}
                  >
                    {FILTER_FIELDS.map(
                      renderAdvancedFilter
                    )}
                  </Box>
                </Box>
              </Collapse>
            </Paper>

            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 1,
                  fontFamily:
                    "Cairo",
                  fontWeight: 800
                }}
              >
                {error}
              </Alert>
            )}

            {loading && (
              <Paper
                elevation={0}
                sx={{
                  mb: 1,
                  p: 0.8,
                  bgcolor:
                    "#eef8f3",
                  border:
                    "1px solid rgba(5,117,70,.18)",
                  borderRadius: 2
                }}
              >
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >
                  <CircularProgress
                    size={20}
                  />

                  <Typography
                    sx={{
                      fontFamily:
                        "Cairo",
                      color:
                        primaryColor,
                      fontWeight: 900,
                      fontSize:
                        isPhone
                          ? 12
                          : 12
                    }}
                  >
                    جاري تحميل حركة الحساب...
                  </Typography>
                </Stack>
              </Paper>
            )}

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr 1fr",
                  sm: "repeat(3, 1fr)"
                },
                gap:
                  isPhone
                    ? 0.45
                    : 0.7,
                mb: 0.85
              }}
            >
              {[
                {
                  title:
                    "إجمالي مدين",
                  value:
                    totals.maden
                },
                {
                  title:
                    "إجمالي دائن",
                  value:
                    totals.daen
                },
                {
                  title:
                    "الرصيد",
                  value:
                    totalBalance,
                  accent: true
                }
              ].map(
                (item) => (
                  <Paper
                    key={
                      item.title
                    }
                    elevation={0}
                    sx={{
                      p:
                        isPhone
                          ? 0.65
                          : 1.1,
                      borderRadius: 2,
                      border:
                        `1px solid ${borderColor}`,
                      gridColumn:
                        isPhone &&
                        item.title ===
                          "الرصيد"
                          ? "1 / -1"
                          : "auto"
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily:
                          "Cairo",
                        color:
                          mutedColor,
                        fontWeight: 900,
                        fontSize:
                          isPhone
                            ? 12
                            : 12
                      }}
                    >
                      {item.title}
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.25,
                        fontFamily:
                          "Cairo",
                        fontWeight: 950,
                        fontSize:
                          isPhone
                            ? 13
                            : 20,
                        color:
                          item.accent
                            ? (
                              totalBalance ===
                              0
                                ? primaryColor
                                : accentColor
                            )
                            : textColor
                      }}
                    >
                      {money(
                        item.value
                      )}
                    </Typography>
                  </Paper>
                )
              )}
            </Box>

            <Box
              sx={uiLayout.withUiSx({
                height:
                  isPhone
                    ? 420
                    : isTablet
                      ? 520
                      : 600,
                width: "100%"
              }, uiLayout.tableContainerSx)}
            >
              <DataGrid
                rows={filteredRows}
                columns={
                  isDesktop
                    ? desktopColumns
                    : compactColumns
                }
                loading={loading}
                density="compact"
                rowHeight={
                  isDesktop
                    ? 42
                    : isPhone
                      ? 34
                      : 38
                }
                columnHeaderHeight={
                  isDesktop
                    ? 44
                    : isPhone
                      ? 34
                      : 38
                }
                disableRowSelectionOnClick
                disableColumnMenu={
                  !isDesktop
                }
                pageSizeOptions={[
                  25,
                  50,
                  100
                ]}
                initialState={{
                  pagination: {
                    paginationModel: {
                      pageSize:
                        isPhone
                          ? 25
                          : 50,
                      page: 0
                    }
                  }
                }}
                getRowClassName={(params) =>
                  params.row.isOpeningBalance
                    ? "opening-balance-row"
                    : (
                      params.indexRelativeToCurrentPage %
                        2 ===
                      0
                        ? "even-row"
                        : "odd-row"
                    )
                }
                sx={uiLayout.withUiSx({
                  border:
                    `1px solid ${borderColor}`,
                  direction: "rtl",

                  "& .MuiDataGrid-columnHeaders":
                    {
                      bgcolor:
                        "#eef7f2",
                      color:
                        primaryDark
                    },

                  "& .MuiDataGrid-columnHeaderTitle":
                    {
                      fontFamily:
                        "Cairo",
                      fontWeight: 950,
                      fontSize:
                        isDesktop
                          ? 12
                          : isPhone
                            ? 12
                            : 12,
                      textAlign:
                        "center"
                    },

                  "& .MuiDataGrid-columnHeaderTitleContainer":
                    {
                      justifyContent:
                        "center"
                    },

                  "& .MuiDataGrid-cell":
                    {
                      fontFamily:
                        "Cairo",
                      fontWeight: 800,
                      fontSize:
                        isDesktop
                          ? 12
                          : isPhone
                            ? 12
                            : 12,
                      px:
                        isPhone
                          ? 0.15
                          : 0.45,
                      borderColor:
                        "#edf2ef"
                    },

                  "& .even-row":
                    {
                      bgcolor:
                        "#ffffff"
                    },

                  "& .odd-row":
                    {
                      bgcolor:
                        "#f8fbf9"
                    },

                  "& .MuiDataGrid-row:hover":
                    {
                      bgcolor:
                        "#eef7f2 !important"
                    },

                  "& .opening-balance-row":
                    {
                      bgcolor:
                        "#e9f3ee !important",
                      fontWeight:
                        "950 !important"
                    },

                  "& .MuiDataGrid-columnSeparator, & .MuiDataGrid-menuIcon":
                    {
                      display:
                        !isDesktop
                          ? "none"
                          : undefined
                    },

                  "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus":
                    {
                      outline:
                        "none"
                    }
                }, uiLayout.dataGridSx)}
              />
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* =====================================================
          Lightweight advanced-filter picker.
          Only ONE dialog is rendered and at most 80 values are mounted.
          ===================================================== */}
      <Dialog sx={uiLayout.dialogLayoutSx}
        open={Boolean(filterPickerField)}
        onClose={closeFilterPicker}
        fullWidth
        maxWidth="sm"
        fullScreen={isPhone}
        PaperProps={{
          sx: {
            borderRadius:
              isPhone ? 0 : 3,
            direction: "rtl",
            overflow: "hidden"
          }
        }}
      >
        <DialogTitle
          sx={{
            fontFamily: "Cairo",
            fontWeight: 950,
            color: primaryColor,
            display: "flex",
            alignItems: "center",
            gap: 1
          }}
        >
          <FilterAltOutlinedIcon />
          فلتر {filterPickerField?.label || ""}

          <Box sx={{ flexGrow: 1 }} />

          <Chip
            size="small"
            label={`المحدد: ${selectedPickerValues.length}`}
          />

          <IconButton
            onClick={closeFilterPicker}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <TextField InputLabelProps={{ shrink: true }}
            autoFocus
            fullWidth
            value={filterPickerSearch}
            onChange={(e) =>
              setFilterPickerSearch(
                e.target.value
              )
            }
            placeholder="اكتب للبحث داخل قيم الفلتر..."
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
            sx={uiLayout.withUiSx({ mb: 1 }, uiLayout.formFieldSx)}
          />

          <List
            dense
            sx={{
              maxHeight:
                isPhone
                  ? "calc(100vh - 190px)"
                  : 430,
              overflowY: "auto",
              border:
                `1px solid ${borderColor}`,
              borderRadius: 2,
              p: 0
            }}
          >
            {pickerOptions.map(
              (option) => {
                const selected =
                  selectedPickerValues
                    .includes(option);

                return (
                  <ListItemButton
                    key={option}
                    selected={selected}
                    onClick={() =>
                      toggleFilterValue(
                        filterPickerField.key,
                        option
                      )
                    }
                    sx={{
                      minHeight: 36,
                      borderBottom:
                        `1px solid ${borderColor}`,
                      "&.Mui-selected":
                        {
                          bgcolor:
                            "#e8f5ee"
                        }
                    }}
                  >
                    <Checkbox
                      size="small"
                      checked={selected}
                      tabIndex={-1}
                      disableRipple
                      sx={{
                        p: 0.4,
                        mr: 0.7
                      }}
                    />

                    <ListItemText
                      primary={option}
                      primaryTypographyProps={{
                        fontFamily: "Cairo",
                        fontWeight: 800,
                        fontSize: 11,
                        noWrap: true
                      }}
                    />
                  </ListItemButton>
                );
              }
            )}

            {pickerOptions.length === 0 && (
              <Box
                sx={{
                  p: 3,
                  textAlign: "center",
                  color: mutedColor,
                  fontFamily: "Cairo"
                }}
              >
                لا توجد قيم مطابقة
              </Box>
            )}
          </List>
        </DialogContent>

        <DialogActions
          sx={uiLayout.withUiSx({
            p: 1,
            gap: 1
          }, uiLayout.dialogActionsSx)}
        >
          {selectedPickerValues.length > 0 && (
            <Button sx={uiLayout.buttonSx}
              color="error"
              onClick={() => {
                const key =
                  filterPickerField.key;

                setAdvancedFilters(
                  (current) => ({
                    ...current,
                    [key]: []
                  })
                );
              }}
            >
              مسح هذا الفلتر
            </Button>
          )}

          <Box sx={{ flexGrow: 1 }} />

          <Button
            variant="contained"
            onClick={closeFilterPicker}
            sx={uiLayout.withUiSx({
              bgcolor: primaryColor,
              fontWeight: 900
            }, uiLayout.buttonSx)}
          >
            تم
          </Button>
        </DialogActions>
      </Dialog>

      {/* =====================================================
          Account List
          ===================================================== */}
      <Dialog sx={uiLayout.dialogLayoutSx}
        open={accountDialogOpen}
        onClose={() =>
          setAccountDialogOpen(false)
        }
        fullWidth
        maxWidth="md"
        fullScreen={isPhone}
        PaperProps={{
          sx: {
            borderRadius:
              isPhone
                ? 0
                : 3,
            direction: "rtl",
            overflow: "hidden"
          }
        }}
      >
        <DialogTitle
          sx={{
            fontFamily: "Cairo",
            fontWeight: 950,
            color: primaryColor,
            display: "flex",
            alignItems: "center",
            gap: 1
          }}
        >
          <AccountBalanceIcon />
          قائمة الحسابات

          <Box sx={{ flexGrow: 1 }} />

          <IconButton
            onClick={() =>
              setAccountDialogOpen(false)
            }
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <TextField InputLabelProps={{ shrink: true }}
            autoFocus
            fullWidth
            value={accountSearch}
            onChange={(e) =>
              setAccountSearch(
                e.target.value
              )
            }
            placeholder="ابحث باسم الحساب أو الكود..."
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  {accountsLoading
                    ? (
                      <CircularProgress
                        size={18}
                      />
                    )
                    : (
                      <SearchIcon />
                    )}
                </InputAdornment>
              )
            }}
            sx={uiLayout.withUiSx({ mb: 1 }, uiLayout.formFieldSx)}
          />

          <Stack
            direction="row"
            justifyContent="space-between"
            sx={{ mb: 0.6 }}
          >
            <Chip
              size="small"
              label={`عدد النتائج: ${accounts.length}`}
            />

            <Typography
              sx={{
                color: mutedColor,
                fontFamily: "Cairo",
                fontSize: 12,
                fontWeight: 700
              }}
            >
              الحسابات النشطة فقط — نفس منطق قائمة الديسكتوب
            </Typography>
          </Stack>

          <List
            dense
            sx={{
              maxHeight:
                isPhone
                  ? "calc(100vh - 190px)"
                  : 430,
              overflowY: "auto",
              border:
                `1px solid ${borderColor}`,
              borderRadius: 2,
              p: 0
            }}
          >
            {accounts.map(
              (account) => {
                const selected =
                  String(
                    selectedAccountGuid
                  ) ===
                  String(
                    account.guid
                  );

                return (
                  <ListItemButton
                    key={account.guid}
                    selected={selected}
                    onClick={() =>
                      setSelectedAccountGuid(
                        account.guid
                      )
                    }
                    onDoubleClick={() => {
                      setSelectedAccount(
                        account
                      );
                      setSelectedAccountGuid(
                        account.guid
                      );
                      setAccountDialogOpen(
                        false
                      );
                      setGridSearch("");
                      setAdvancedFilters(
                        createEmptyAdvancedFilters()
                      );
                      loadStatement(
                        account
                      );
                    }}
                    sx={{
                      borderBottom:
                        `1px solid ${borderColor}`,
                      "&.Mui-selected":
                        {
                          bgcolor:
                            "#e8f5ee"
                        }
                    }}
                  >
                    <ListItemText
                      primary={
                        account.name
                      }
                      secondary={
                        account.code
                          ? `الكود: ${account.code}`
                          : ""
                      }
                      primaryTypographyProps={{
                        fontFamily:
                          "Cairo",
                        fontWeight: 900,
                        fontSize:
                          isPhone
                            ? 12
                            : 14
                      }}
                      secondaryTypographyProps={{
                        fontFamily:
                          "Cairo",
                        fontSize:
                          10
                      }}
                    />

                    {selected && (
                      <CheckCircleOutlineIcon
                        sx={{
                          color:
                            primaryColor
                        }}
                      />
                    )}
                  </ListItemButton>
                );
              }
            )}

            {!accountsLoading &&
              accounts.length === 0 && (
                <Box
                  sx={{
                    p: 3,
                    textAlign:
                      "center",
                    color:
                      mutedColor,
                    fontFamily:
                      "Cairo"
                  }}
                >
                  لا توجد حسابات مطابقة
                </Box>
              )}
          </List>
        </DialogContent>

        <DialogActions
          sx={uiLayout.withUiSx({
            p: 1.2,
            gap: 1
          }, uiLayout.dialogActionsSx)}
        >
          <Button sx={uiLayout.buttonSx}
            onClick={() =>
              setAccountDialogOpen(false)
            }
          >
            رجوع
          </Button>

          <Button
            variant="contained"
            disabled={
              !selectedAccountGuid
            }
            onClick={chooseAccount}
            sx={uiLayout.withUiSx({
              bgcolor:
                primaryColor,
              fontWeight: 900
            }, uiLayout.buttonSx)}
          >
            اختيار وعرض
          </Button>
        </DialogActions>
      </Dialog>

      {/* =====================================================
          Mobile / Tablet details
          ===================================================== */}
      <Dialog sx={uiLayout.dialogLayoutSx}
        open={detailOpen}
        onClose={() =>
          setDetailOpen(false)
        }
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            direction: "rtl"
          }
        }}
      >
        <DialogTitle
          sx={{
            fontFamily: "Cairo",
            fontWeight: 950,
            color: primaryColor
          }}
        >
          تفاصيل حركة الحساب
        </DialogTitle>

        <DialogContent dividers>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns:
                isPhone
                  ? "1fr"
                  : "1fr 1fr",
              gap: 0.8
            }}
          >
            {[
              ["تاريخ القيد", dateOnly(detailRow?.dayDate)],
              ["رقم القيد", detailRow?.code],
              ["نوع المستند", detailRow?.name],
              ["رقم المستند", detailRow?.actionCode],
              ["مدين", money(detailRow?.maden)],
              ["دائن", money(detailRow?.daen)],
              ["الرصيد", money(detailRow?.balance)],
              ["مركز التكلفة", detailRow?.centerName],
              ["الفرع", detailRow?.branchName]
            ].map(([label, value]) => (
              <Paper
                key={label}
                elevation={0}
                sx={{
                  p: 0.8,
                  border:
                    `1px solid ${borderColor}`,
                  borderRadius: 2
                }}
              >
                <Typography
                  sx={{
                    color:
                      mutedColor,
                    fontFamily:
                      "Cairo",
                    fontWeight: 800,
                    fontSize: 12
                  }}
                >
                  {label}
                </Typography>

                <Typography
                  sx={{
                    fontFamily:
                      "Cairo",
                    fontWeight: 900,
                    fontSize: 12
                  }}
                >
                  {value || "-"}
                </Typography>
              </Paper>
            ))}

            <Paper
              elevation={0}
              sx={{
                p: 0.8,
                border:
                  `1px solid ${borderColor}`,
                borderRadius: 2,
                gridColumn:
                  "1 / -1"
              }}
            >
              <Typography
                sx={{
                  color:
                    mutedColor,
                  fontFamily:
                    "Cairo",
                  fontWeight: 800,
                  fontSize: 12
                }}
              >
                البيان
              </Typography>

              <Typography
                sx={{
                  fontFamily:
                    "Cairo",
                  fontWeight: 900,
                  fontSize: 12,
                  whiteSpace:
                    "pre-wrap"
                }}
              >
                {detailRow?.notes ||
                  "-"}
              </Typography>
            </Paper>
          </Box>
        </DialogContent>

        <DialogActions sx={uiLayout.dialogActionsSx}>
          <Button sx={uiLayout.buttonSx}
            onClick={() =>
              setDetailOpen(false)
            }
          >
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>
    </Box></NavigationShell>
  );
}