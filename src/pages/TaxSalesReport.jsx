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
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";

import { DataGrid } from "@mui/x-data-grid";

import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import ClearAllOutlinedIcon from "@mui/icons-material/ClearAllOutlined";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import PercentIcon from "@mui/icons-material/Percent";
import CloseIcon from "@mui/icons-material/Close";

import Sidebar from "../components/Sidebar";
import SalesInvoiceDialog from "../components/SalesInvoiceDialog";

const SIDEBAR_WIDTH = 280;
const DESKTOP_BREAKPOINT = 1600;

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

  return new Date(
    d.getTime() - offset * 60000
  )
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

const num = (value) => {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
};

const money = (value) =>
  num(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const shortMoney = (value) =>
  num(value).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

const dateOnly = (value) => {
  if (!value) return "";

  const text = String(value);

  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    const [y, m, d] =
      text.slice(0, 10).split("-");

    return `${d}/${m}/${y}`;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return text;
  }

  return parsed.toLocaleDateString("en-GB");
};

const FILTER_FIELDS = [
  {
    key: "billDate",
    label: "تاريخ الفاتورة",
    formatter: dateOnly
  },
  {
    key: "code",
    label: "رقم الفاتورة"
  },
  {
    key: "docName",
    label: "نوع المستند"
  },
  {
    key: "studentName",
    label: "اسم الطالب"
  },
  {
    key: "nationalId",
    label: "رقم الهوية"
  },
  {
    key: "cost",
    label: "الصافي",
    formatter: shortMoney
  },
  {
    key: "tax",
    label: "الضريبة",
    formatter: shortMoney
  },
  {
    key: "subTotal",
    label: "الإجمالي",
    formatter: shortMoney
  },
  {
    key: "branchName",
    label: "الفرع"
  },
  {
    key: "diplomName",
    label: "الخدمة المقدمة"
  },
  {
    key: "times",
    label: "المدة"
  }
];

const emptyFilters = () =>
  FILTER_FIELDS.reduce(
    (result, field) => {
      result[field.key] = [];
      return result;
    },
    {}
  );

const filterText = (row, field) => {
  const value = row?.[field.key];

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  return field.formatter
    ? String(field.formatter(value))
    : String(value).trim();
};

const csvCell = (value) =>
  `"${String(value ?? "")
    .replace(/"/g, '""')}"`;


export default function TaxSalesReport() {
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
    useMemo(
      () => currentUser(),
      []
    );

  const userGuid =
    useMemo(
      () =>
        String(
          getUserGuid(user)
        ).trim(),
      [user]
    );

  const [
    mobileSidebarOpen,
    setMobileSidebarOpen
  ] = useState(false);

  const [
    permissionLoading,
    setPermissionLoading
  ] = useState(true);

  const [
    authorized,
    setAuthorized
  ] = useState(false);

  const [fromDate, setFromDate] =
    useState(localDate());

  const [toDate, setToDate] =
    useState(localDate());

  const [rows, setRows] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [
    advancedOpen,
    setAdvancedOpen
  ] = useState(false);

  const [
    advancedFilters,
    setAdvancedFilters
  ] = useState(emptyFilters);

  // فلتر خفيف: نافذة واحدة فقط بدل إنشاء آلاف MenuItem.
  const [
    filterPickerField,
    setFilterPickerField
  ] = useState(null);

  const [
    filterPickerSearch,
    setFilterPickerSearch
  ] = useState("");

  const [
    detailRow,
    setDetailRow
  ] = useState(null);

  const [
    detailOpen,
    setDetailOpen
  ] = useState(false);

  const [
    invoiceDialogOpen,
    setInvoiceDialogOpen
  ] = useState(false);

  const [
    selectedInvoice,
    setSelectedInvoice
  ] = useState(null);

  const openInvoiceDialog = (row) => {
    // مهم:
    // ShowTaxReport / ShowReTaxReport أصبحا يرجعان BillGuid الحقيقي.
    // نفس استراتيجية كشف الحساب: نمرر BillGuid إلى SalesInvoiceDialog
    // بدون تغيير طريقة تحميل فاتورة المبيعات.
    const billGuid =
      row?.billGuid ||
      row?.BillGuid ||
      "";

    if (!billGuid) {
      setError(
        "الفاتورة لا تحتوي على BillGuid. تأكد أن الـ Stored Procedure والـ API يرجعان BillGuid."
      );
      return;
    }

    setError("");

    setSelectedInvoice({
      ...row,
      billGuid
    });

    setInvoiceDialogOpen(true);
  };

  const requestRef =
    useRef(null);

  const requestIdRef =
    useRef(0);

  // =========================================================
  // Permission
  // =========================================================
  useEffect(() => {
    let alive = true;

    const run = async () => {
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
          `${API_BASE_URL}/api/user-permissions/${encodeURIComponent(userGuid)}`,
          {
            cache: "no-store",
            headers: {
              Accept: "application/json"
            }
          }
        );

        const result =
          await response
            .json()
            .catch(() => null);

        if (!response.ok) {
          throw new Error(
            result?.message ||
            "تعذر تحميل الصلاحيات"
          );
        }

        const reports =
          result?.data?.reports || {};

        if (alive) {
          setAuthorized(
            reports?.canView === true &&
            reports?.screens
              ?.taxSalesReport === true
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

    run();

    return () => {
      alive = false;
    };
  }, [userGuid]);

  // =========================================================
  // نفس LOADREGDOC بتاع الديسكتوب:
  // Request واحد فقط -> ShowTaxReport مرة واحدة فقط
  // =========================================================
  const loadReport =
    useCallback(async () => {
      if (!authorized || !userGuid) {
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

      requestRef.current?.abort?.();

      const controller =
        new AbortController();

      requestRef.current =
        controller;

      const requestId =
        ++requestIdRef.current;

      try {
        setLoading(true);
        setError("");

        const params =
          new URLSearchParams({
            userGuid,
            fromDate,
            toDate
          });

        const response =
          await fetch(
            `${API_BASE_URL}/api/tax-sales-report?${params.toString()}`,
            {
              cache: "no-store",
              headers: {
                Accept: "application/json"
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
          requestIdRef.current
        ) {
          return;
        }

        if (!response.ok) {
          throw new Error(
            result?.message ||
            result?.error ||
            "تعذر تحميل تقرير الضرائب"
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
          requestIdRef.current
        ) {
          return;
        }

        setRows([]);

        setError(
          e?.message ||
          "تعذر تحميل تقرير الضرائب"
        );
      } finally {
        if (
          requestId ===
          requestIdRef.current
        ) {
          setLoading(false);
        }
      }
    }, [
      authorized,
      userGuid,
      fromDate,
      toDate
    ]);

  useEffect(() => {
    return () => {
      requestRef.current?.abort?.();
    };
  }, []);

  // =========================================================
  // الفلاتر كلها Client-side بعد تحميل نفس الداتا مرة واحدة.
  // لا يوجد أي Request للسيرفر عند البحث داخل الفلاتر.
  //
  // تحسين الأداء:
  // 1) تجهيز النصوص مرة واحدة فقط عند تغيّر rows.
  // 2) إنشاء Sets للقيم مرة واحدة.
  // 3) نافذة فلتر واحدة فقط، وبحد أقصى 80 نتيجة ظاهرة.
  // 4) البحث العام يستخدم searchText الجاهز بدل إعادة formatting لكل صف.
  // =========================================================
  const preparedRows =
    useMemo(() => {
      return rows.map((row) => {
        const filterValues = {};

        FILTER_FIELDS.forEach(
          (field) => {
            filterValues[field.key] =
              filterText(
                row,
                field
              );
          }
        );

        return {
          row,
          filterValues,
          searchText: [
            row?.billDate,
            row?.code,
            row?.docName,
            row?.studentName,
            row?.nationalId,
            row?.cost,
            row?.tax,
            row?.subTotal,
            row?.branchName,
            row?.diplomName,
            row?.times
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

      FILTER_FIELDS.forEach(
        (field) => {
          sets[field.key] =
            new Set();
        }
      );

      for (
        const item
        of preparedRows
      ) {
        for (
          const field
          of FILTER_FIELDS
        ) {
          const value =
            item.filterValues[
              field.key
            ];

          if (value) {
            sets[field.key]
              .add(value);
          }
        }
      }

      const result = {};

      FILTER_FIELDS.forEach(
        (field) => {
          result[field.key] =
            Array.from(
              sets[field.key]
            ).sort(
              (a, b) =>
                String(a)
                  .localeCompare(
                    String(b),
                    "ar",
                    {
                      numeric: true
                    }
                  )
            );
        }
      );

      return result;
    }, [preparedRows]);

  const activeFilterCount =
    useMemo(
      () =>
        Object.values(
          advancedFilters
        ).filter(
          (value) =>
            Array.isArray(value) &&
            value.length > 0
        ).length,
      [advancedFilters]
    );

  const selectedSets =
    useMemo(() => {
      const result = {};

      FILTER_FIELDS.forEach(
        (field) => {
          const values =
            advancedFilters[
              field.key
            ] || [];

          if (values.length) {
            result[field.key] =
              new Set(values);
          }
        }
      );

      return result;
    }, [advancedFilters]);

  const clearAdvancedFilters =
    useCallback(() => {
      setAdvancedFilters(
        emptyFilters()
      );
    }, []);

  const openFilterPicker =
    useCallback(
      (field) => {
        setFilterPickerSearch("");
        setFilterPickerField(
          field
        );
      },
      []
    );

  const closeFilterPicker =
    useCallback(() => {
      setFilterPickerField(
        null
      );

      setFilterPickerSearch("");
    }, []);

  const toggleFilterValue =
    useCallback(
      (key, value) => {
        setAdvancedFilters(
          (current) => {
            const oldValues =
              current[key] || [];

            const exists =
              oldValues.includes(
                value
              );

            return {
              ...current,
              [key]: exists
                ? oldValues.filter(
                    (item) =>
                      item !== value
                  )
                : [
                    ...oldValues,
                    value
                  ]
            };
          }
        );
      },
      []
    );

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
        return all.slice(
          0,
          80
        );
      }

      const result = [];

      for (
        let i = 0;
        i < all.length;
        i += 1
      ) {
        const value =
          all[i];

        if (
          String(value)
            .toLowerCase()
            .includes(q)
        ) {
          result.push(value);

          if (
            result.length >= 80
          ) {
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

  const filteredRows =
    useMemo(() => {
      const q =
        search
          .trim()
          .toLowerCase();

      const activeKeys =
        Object.keys(
          selectedSets
        );

      // أسرع مسار: لا بحث ولا فلاتر.
      if (
        !q &&
        activeKeys.length === 0
      ) {
        return rows;
      }

      const result = [];

      for (
        const item
        of preparedRows
      ) {
        if (
          q &&
          !item.searchText
            .includes(q)
        ) {
          continue;
        }

        let matches = true;

        for (
          let i = 0;
          i < activeKeys.length;
          i += 1
        ) {
          const key =
            activeKeys[i];

          if (
            !selectedSets[key]
              .has(
                item.filterValues[
                  key
                ]
              )
          ) {
            matches = false;
            break;
          }
        }

        if (matches) {
          result.push(
            item.row
          );
        }
      }

      return result;
    }, [
      rows,
      preparedRows,
      search,
      selectedSets
    ]);

  const totals =
    useMemo(() => {
      return filteredRows.reduce(
        (acc, row) => {
          acc.cost += num(row.cost);
          acc.tax += num(row.tax);
          acc.subTotal +=
            num(row.subTotal);

          return acc;
        },
        {
          cost: 0,
          tax: 0,
          subTotal: 0
        }
      );
    }, [filteredRows]);

  const exportCsv = () => {
    if (!filteredRows.length) {
      return;
    }

    const header = [
      "تاريخ الفاتورة",
      "رقم الفاتورة",
      "نوع المستند",
      "اسم الطالب",
      "رقم الهوية",
      "الصافي",
      "الضريبة",
      "الإجمالي",
      "الفرع",
      "الخدمة المقدمة",
      "المدة"
    ];

    const lines =
      filteredRows.map((row) =>
        [
          dateOnly(row.billDate),
          row.code,
          row.docName,
          row.studentName,
          row.nationalId,
          row.cost,
          row.tax,
          row.subTotal,
          row.branchName,
          row.diplomName,
          row.times
        ]
          .map(csvCell)
          .join(",")
      );

    const csv =
      "\uFEFF" +
      [
        header
          .map(csvCell)
          .join(","),
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
      `تقرير-الضرائب-${fromDate}-${toDate}.csv`;

    a.click();

    URL.revokeObjectURL(url);
  };

  const desktopColumns =
    useMemo(
      () => [
        {
          field: "billDate",
          headerName:
            "تاريخ الفاتورة",
          flex: 0.9,
          minWidth: 75,
          valueFormatter:
            (params) =>
              dateOnly(
                params.value
              ),
          align: "center",
          headerAlign:
            "center"
        },
        {
          field: "code",
          headerName:
            "رقم الفاتورة",
          flex: 0.75,
          minWidth: 70,
          align: "center",
          headerAlign:
            "center"
        },
        {
          field: "docName",
          headerName:
            "نوع المستند",
          flex: 1,
          minWidth: 90
        },
        {
          field: "studentName",
          headerName:
            "اسم الطالب",
          flex: 1.35,
          minWidth: 115
        },
        {
          field: "nationalId",
          headerName:
            "رقم الهوية",
          flex: 0.9,
          minWidth: 88,
          align: "center",
          headerAlign:
            "center"
        },
        {
          field: "cost",
          headerName: "الصافي",
          flex: 0.7,
          minWidth: 62,
          valueFormatter:
            (params) =>
              shortMoney(
                params.value
              ),
          align: "center",
          headerAlign:
            "center"
        },
        {
          field: "tax",
          headerName: "الضريبة",
          flex: 0.7,
          minWidth: 62,
          valueFormatter:
            (params) =>
              shortMoney(
                params.value
              ),
          align: "center",
          headerAlign:
            "center"
        },
        {
          field: "subTotal",
          headerName:
            "الإجمالي",
          flex: 0.75,
          minWidth: 66,
          valueFormatter:
            (params) =>
              shortMoney(
                params.value
              ),
          align: "center",
          headerAlign:
            "center"
        },
        {
          field: "branchName",
          headerName: "الفرع",
          flex: 1.25,
          minWidth: 110
        },
        {
          field: "diplomName",
          headerName:
            "الخدمة المقدمة",
          flex: 1.35,
          minWidth: 115
        },
        {
          field: "__invoice",
          headerName: "الفاتورة",
          width: 92,
          minWidth: 92,
          maxWidth: 92,
          sortable: false,
          filterable: false,
          disableColumnMenu: true,
          align: "center",
          headerAlign: "center",
          renderCell: (params) => (
            <Button
              size="small"
              variant="outlined"
              startIcon={
                <VisibilityOutlinedIcon
                  sx={{ fontSize: 15 }}
                />
              }
              onClick={(event) => {
                event.stopPropagation();
                openInvoiceDialog(params.row);
              }}
              sx={{
                minWidth: 78,
                px: 0.8,
                py: 0.2,
                fontFamily: "Cairo",
                fontWeight: 900,
                fontSize: 9,
                color: primaryColor,
                borderColor: "rgba(5,117,70,.35)",
                "&:hover": {
                  borderColor: primaryColor,
                  bgcolor: "#eef8f3"
                }
              }}
            >
              عرض
            </Button>
          )
        },
        {
          field: "times",
          headerName: "المدة",
          flex: 0.65,
          minWidth: 55,
          align: "center",
          headerAlign:
            "center"
        }
      ],
      []
    );

  const compactColumns =
    useMemo(() => {
      const cols = [
        {
          field: "billDate",
          headerName: "التاريخ",
          flex: 0.9,
          minWidth: 0,
          valueFormatter:
            (params) =>
              dateOnly(
                params.value
              ),
          sortable: false,
          align: "center",
          headerAlign:
            "center"
        },
        {
          field: "code",
          headerName: "الفاتورة",
          flex: 0.8,
          minWidth: 0,
          sortable: false,
          align: "center",
          headerAlign:
            "center"
        },
        {
          field: "studentName",
          headerName: "الطالب",
          flex: 1.4,
          minWidth: 0,
          sortable: false
        }
      ];

      if (!isPhone) {
        cols.push(
          {
            field: "tax",
            headerName: "الضريبة",
            flex: 0.7,
            minWidth: 0,
            sortable: false,
            valueFormatter:
              (params) =>
                shortMoney(
                  params.value
                ),
            align: "center",
            headerAlign:
              "center"
          },
          {
            field: "branchName",
            headerName: "الفرع",
            flex: 1.1,
            minWidth: 0,
            sortable: false
          }
        );
      }

      cols.push(
        {
          field: "subTotal",
          headerName:
            "الإجمالي",
          flex: 0.75,
          minWidth: 0,
          sortable: false,
          valueFormatter:
            (params) =>
              shortMoney(
                params.value
              ),
          align: "center",
          headerAlign:
            "center"
        },
        {
          field: "__invoiceCompact",
          headerName: "",
          width: isPhone ? 34 : 40,
          minWidth: isPhone ? 34 : 40,
          maxWidth: isPhone ? 34 : 40,
          sortable: false,
          filterable: false,
          disableColumnMenu: true,
          align: "center",
          renderCell: (params) => (
            <IconButton
              size="small"
              title="عرض الفاتورة"
              onClick={(event) => {
                event.stopPropagation();
                openInvoiceDialog(params.row);
              }}
              sx={{
                width: isPhone ? 24 : 28,
                height: isPhone ? 24 : 28,
                p: 0,
                color: "#fff",
                bgcolor: primaryColor,
                "&:hover": {
                  bgcolor: primaryDark
                }
              }}
            >
              <VisibilityOutlinedIcon
                sx={{
                  fontSize:
                    isPhone ? 13 : 16
                }}
              />
            </IconButton>
          )
        },
        {
          field: "__details",
          headerName: "",
          width:
            isPhone ? 32 : 38,
          minWidth:
            isPhone ? 32 : 38,
          maxWidth:
            isPhone ? 32 : 38,
          sortable: false,
          filterable: false,
          disableColumnMenu: true,
          align: "center",
          renderCell:
            (params) => (
              <IconButton
                size="small"
                onClick={(
                  event
                ) => {
                  event
                    .stopPropagation();

                  setDetailRow(
                    params.row
                  );

                  setDetailOpen(
                    true
                  );
                }}
                sx={{
                  width:
                    isPhone
                      ? 23
                      : 27,
                  height:
                    isPhone
                      ? 23
                      : 27,
                  p: 0,
                  color:
                    primaryColor,
                  bgcolor:
                    "#eef8f3",
                  border:
                    "1px solid rgba(5,117,70,.18)"
                }}
              >
                <VisibilityOutlinedIcon
                  sx={{
                    fontSize:
                      isPhone
                        ? 13
                        : 16
                  }}
                />
              </IconButton>
            )
        }
      );

      return cols;
    }, [isPhone]);

  if (permissionLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center"
        }}
      >
        <CircularProgress />
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
          p: 2
        }}
      >
        <Alert severity="error">
          ليس لديك صلاحية تقرير الضرائب.
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f4f7f6",
        direction: "ltr",
        overflowX: "hidden"
      }}
    >
      <Sidebar
        mobileOpen={
          mobileSidebarOpen
        }
        onMobileClose={() =>
          setMobileSidebarOpen(
            false
          )
        }
      />

      <Box
        component="main"
        sx={{
          width: isDesktop
            ? `calc(100vw - ${SIDEBAR_WIDTH}px)`
            : "100vw",

          ml: isDesktop
            ? `${SIDEBAR_WIDTH}px`
            : 0,

          boxSizing:
            "border-box",

          p: isDesktop
            ? "12px 14px"
            : isPhone
              ? "5px"
              : "8px",

          overflowX: "hidden"
        }}
      >
        {!isDesktop && (
          <AppBar
            position="static"
            elevation={0}
            sx={{
              bgcolor:
                primaryColor,
              mb: 0.5
            }}
          >
            <Toolbar
              variant="dense"
              sx={{
                minHeight:
                  isPhone
                    ? "42px !important"
                    : "48px !important"
              }}
            >
              <IconButton
                onClick={() =>
                  setMobileSidebarOpen(
                    true
                  )
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
                  fontFamily:
                    "Cairo",
                  fontWeight: 950,
                  fontSize:
                    isPhone
                      ? 14
                      : 16
                }}
              >
                تقرير مبيعات الضرائب
              </Typography>
            </Toolbar>
          </AppBar>
        )}

        <Paper
          elevation={0}
          sx={{
            border:
              `1px solid ${borderColor}`,
            borderRadius: 2.5,
            overflow: "hidden",
            bgcolor: "#fff"
          }}
        >
          <Box
            sx={{
              px:
                isPhone ? 0.9 : 1.4,
              py:
                isPhone ? 0.7 : 1,
              bgcolor:
                primaryColor,
              color: "#fff"
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.8}
            >
              <PercentIcon />

              <Box>
                <Typography
                  sx={{
                    fontFamily:
                      "Cairo",
                    fontWeight: 950,
                    fontSize:
                      isPhone
                        ? 14
                        : 19
                  }}
                >
                  تقرير مبيعات الضرائب
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Box
            sx={{
              p:
                isPhone ? 0.6 : 0.9
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p:
                  isPhone ? 0.55 : 0.8,
                border:
                  `1px solid ${borderColor}`,
                borderRadius: 2,
                mb: 0.7
              }}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns:
                    isDesktop
                      ? "145px 145px 100px 125px minmax(220px,1fr)"
                      : isTablet
                        ? "repeat(3,minmax(0,1fr))"
                        : "repeat(2,minmax(0,1fr))",
                  gap:
                    isPhone
                      ? 0.4
                      : 0.6,
                  alignItems:
                    "center"
                }}
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
                  }}
                  InputLabelProps={{
                    shrink: true
                  }}
                  size="small"
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
                  }}
                  InputLabelProps={{
                    shrink: true
                  }}
                  size="small"
                />

                <Button
                  variant="contained"
                  onClick={
                    loadReport
                  }
                  disabled={
                    loading
                  }
                  startIcon={
                    loading
                      ? (
                        <CircularProgress
                          size={14}
                          sx={{
                            color:
                              "#fff"
                          }}
                        />
                      )
                      : (
                        <RefreshIcon />
                      )
                  }
                  sx={{
                    bgcolor:
                      primaryColor,
                    fontWeight: 900,
                    "&:hover": {
                      bgcolor:
                        primaryDark
                    }
                  }}
                >
                  {loading
                    ? "جاري..."
                    : "عرض"}
                </Button>

                <Button
                  variant="outlined"
                  onClick={
                    exportCsv
                  }
                  disabled={
                    !filteredRows.length
                  }
                  startIcon={
                    <FileDownloadIcon />
                  }
                  sx={{
                    fontWeight: 900
                  }}
                >
                  تصدير Excel
                </Button>

                <TextField
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                  placeholder="بحث في التقرير..."
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    gridColumn:
                      isPhone
                        ? "1 / -1"
                        : "auto"
                  }}
                />
              </Box>

              <Stack
                direction="row"
                spacing={0.5}
                sx={{
                  mt: 0.55,
                  flexWrap: "wrap",
                  gap: 0.4
                }}
              >
                <Button
                  variant={
                    advancedOpen
                      ? "contained"
                      : "outlined"
                  }
                  onClick={() =>
                    setAdvancedOpen(
                      (v) => !v
                    )
                  }
                  startIcon={
                    <TuneOutlinedIcon />
                  }
                  endIcon={
                    advancedOpen
                      ? (
                        <ExpandLessRoundedIcon />
                      )
                      : (
                        <ExpandMoreRoundedIcon />
                      )
                  }
                  sx={{
                    bgcolor:
                      advancedOpen
                        ? primaryColor
                        : undefined,
                    fontWeight: 900
                  }}
                >
                  فلاتر متقدمة
                  {activeFilterCount
                    ? ` (${activeFilterCount})`
                    : ""}
                </Button>

                {activeFilterCount >
                  0 && (
                  <Button
                    color="error"
                    onClick={
                      clearAdvancedFilters
                    }
                    startIcon={
                      <ClearAllOutlinedIcon />
                    }
                  >
                    مسح الفلاتر
                  </Button>
                )}

                <Chip
                  size="small"
                  icon={
                    <FilterAltOutlinedIcon />
                  }
                  label={`المعروض ${filteredRows.length} من ${rows.length}`}
                  sx={{
                    ml: "auto",
                    fontFamily:
                      "Cairo",
                    fontWeight: 900
                  }}
                />
              </Stack>

              <Collapse
                in={
                  advancedOpen
                }
              >
                <Box
                  sx={{
                    mt: 0.7,
                    p: 0.6,
                    display: "grid",
                    gridTemplateColumns:
                      isDesktop
                        ? "repeat(4,minmax(0,1fr))"
                        : isTablet
                          ? "repeat(3,minmax(0,1fr))"
                          : "repeat(2,minmax(0,1fr))",
                    gap: 0.5,
                    bgcolor:
                      "#f5faf7",
                    borderRadius:
                      1.5
                  }}
                >
                  {FILTER_FIELDS.map(
                    (field) => {
                      const selected =
                        advancedFilters[
                          field.key
                        ] || [];

                      return (
                        <Button
                          key={
                            field.key
                          }
                          variant="outlined"
                          onClick={() =>
                            openFilterPicker(
                              field
                            )
                          }
                          startIcon={
                            <FilterAltOutlinedIcon />
                          }
                          sx={{
                            justifyContent:
                              "flex-start",
                            minWidth: 0,
                            minHeight:
                              isPhone
                                ? 34
                                : 38,
                            px:
                              isPhone
                                ? 0.7
                                : 1,
                            fontFamily:
                              "Cairo",
                            fontWeight:
                              900,
                            fontSize:
                              isPhone
                                ? 8.3
                                : 10.5,
                            color:
                              selected.length
                                ? primaryColor
                                : textColor,
                            borderColor:
                              selected.length
                                ? primaryColor
                                : borderColor,
                            bgcolor:
                              selected.length
                                ? "#eef8f3"
                                : "#fff",
                            overflow:
                              "hidden"
                          }}
                        >
                          <Box
                            component="span"
                            sx={{
                              overflow:
                                "hidden",
                              textOverflow:
                                "ellipsis",
                              whiteSpace:
                                "nowrap"
                            }}
                          >
                            {field.label}
                            {selected.length
                              ? ` (${selected.length})`
                              : ""}
                          </Box>
                        </Button>
                      );
                    }
                  )}
                </Box>
              </Collapse>
            </Paper>

            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 0.7
                }}
              >
                {error}
              </Alert>
            )}

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns:
                  isPhone
                    ? "1fr 1fr"
                    : "repeat(3,1fr)",
                gap: 0.6,
                mb: 0.7
              }}
            >
              {[
                [
                  "الصافي",
                  totals.cost
                ],
                [
                  "الضريبة",
                  totals.tax
                ],
                [
                  "الإجمالي",
                  totals.subTotal
                ]
              ].map(
                ([title, value]) => (
                  <Paper
                    key={title}
                    elevation={0}
                    sx={{
                      p: 0.8,
                      border:
                        `1px solid ${borderColor}`,
                      gridColumn:
                        isPhone &&
                        title ===
                          "الإجمالي"
                          ? "1 / -1"
                          : "auto"
                    }}
                  >
                    <Typography
                      sx={{
                        color:
                          mutedColor,
                        fontWeight:
                          900,
                        fontSize: 10
                      }}
                    >
                      {title}
                    </Typography>

                    <Typography
                      sx={{
                        fontWeight:
                          950,
                        fontSize:
                          isPhone
                            ? 14
                            : 19,
                        color:
                          title ===
                          "الإجمالي"
                            ? accentColor
                            : textColor
                      }}
                    >
                      {money(
                        value
                      )}
                    </Typography>
                  </Paper>
                )
              )}
            </Box>

            <Box
              sx={{
                width: "100%",
                height:
                  isPhone
                    ? 430
                    : isTablet
                      ? 525
                      : 610,
                overflowX:
                  "hidden"
              }}
            >
              <DataGrid
                rows={
                  filteredRows
                }
                columns={
                  isDesktop
                    ? desktopColumns
                    : compactColumns
                }
                loading={
                  loading
                }
                density="compact"
                rowHeight={
                  isDesktop
                    ? 39
                    : 35
                }
                columnHeaderHeight={
                  isDesktop
                    ? 42
                    : 36
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
                      page: 0,
                      pageSize:
                        isPhone
                          ? 25
                          : 50
                    }
                  }
                }}
                onRowDoubleClick={(
                  params
                ) => {
                  setDetailRow(
                    params.row
                  );
                  setDetailOpen(
                    true
                  );
                }}
                getRowClassName={(
                  params
                ) =>
                  params
                    .indexRelativeToCurrentPage %
                    2 ===
                  0
                    ? "even-row"
                    : "odd-row"
                }
                sx={{
                  border:
                    `1px solid ${borderColor}`,
                  direction:
                    "ltr",
                  "& .MuiDataGrid-virtualScroller":
                    {
                      overflowX:
                        "hidden !important"
                    },
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
                      fontWeight:
                        950,
                      fontSize:
                        isDesktop
                          ? 11
                          : isPhone
                            ? 7.5
                            : 9.2
                    },
                  "& .MuiDataGrid-cell":
                    {
                      fontFamily:
                        "Cairo",
                      fontWeight:
                        800,
                      fontSize:
                        isDesktop
                          ? 10.8
                          : isPhone
                            ? 7.5
                            : 9,
                      px:
                        isPhone
                          ? 0.1
                          : 0.3
                    },
                  "& .MuiDataGrid-columnSeparator":
                    {
                      display:
                        isDesktop
                          ? "flex"
                          : "none"
                    },
                  "& .even-row":
                    {
                      bgcolor:
                        "#fff"
                    },
                  "& .odd-row":
                    {
                      bgcolor:
                        "#fff5e8"
                    },
                  "& .MuiDataGrid-row:hover":
                    {
                      bgcolor:
                        "#eef7f2 !important"
                    }
                }}
              />
            </Box>
          </Box>
        </Paper>
      </Box>

      <SalesInvoiceDialog
        open={invoiceDialogOpen}
        onClose={() => {
          setInvoiceDialogOpen(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
        apiBaseUrl={API_BASE_URL}
      />

      {/* =====================================================
          نافذة فلتر واحدة خفيفة.
          لا يتم إنشاء آلاف MenuItem داخل الصفحة.
          البحث هنا محلي 100% ولا يرسل أي طلب للسيرفر.
          ===================================================== */}
      <Dialog
        open={
          Boolean(
            filterPickerField
          )
        }
        onClose={
          closeFilterPicker
        }
        fullWidth
        maxWidth="sm"
        fullScreen={
          isPhone
        }
        PaperProps={{
          sx: {
            borderRadius:
              isPhone
                ? 0
                : 3,
            direction: "ltr",
            overflow:
              "hidden"
          }
        }}
      >
        <DialogTitle
          sx={{
            fontFamily:
              "Cairo",
            fontWeight: 950,
            color:
              primaryColor,
            display: "flex",
            alignItems:
              "center",
            gap: 1
          }}
        >
          <FilterAltOutlinedIcon />

          فلتر{" "}
          {filterPickerField
            ?.label || ""}

          <Box
            sx={{
              flexGrow: 1
            }}
          />

          <Chip
            size="small"
            label={`المحدد: ${selectedPickerValues.length}`}
            sx={{
              fontFamily:
                "Cairo",
              fontWeight: 900
            }}
          />

          <IconButton
            onClick={
              closeFilterPicker
            }
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent
          dividers
        >
          <TextField
            autoFocus
            fullWidth
            value={
              filterPickerSearch
            }
            onChange={(e) =>
              setFilterPickerSearch(
                e.target.value
              )
            }
            placeholder="ابحث داخل قيم هذا الفلتر..."
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
            sx={{
              mb: 1
            }}
          />

          <Stack
            direction="row"
            spacing={0.6}
            sx={{
              mb: 0.7,
              flexWrap: "wrap",
              gap: 0.4
            }}
          >
            <Chip
              size="small"
              label={`إجمالي القيم: ${
                filterPickerField
                  ? (
                      filterOptions[
                        filterPickerField
                          .key
                      ] || []
                    ).length
                  : 0
              }`}
            />

            <Chip
              size="small"
              label={`المعروض: ${pickerOptions.length}`}
            />

            {(
              filterPickerField &&
              (
                filterOptions[
                  filterPickerField
                    .key
                ] || []
              ).length > 80
            ) && (
              <Typography
                sx={{
                  fontFamily:
                    "Cairo",
                  color:
                    mutedColor,
                  fontSize: 9,
                  alignSelf:
                    "center"
                }}
              >
                اكتب في البحث للوصول لباقي القيم
              </Typography>
            )}
          </Stack>

          <List
            dense
            sx={{
              maxHeight:
                isPhone
                  ? "calc(100vh - 220px)"
                  : 430,
              overflowY:
                "auto",
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
                    .includes(
                      option
                    );

                return (
                  <ListItemButton
                    key={
                      option
                    }
                    selected={
                      selected
                    }
                    onClick={() =>
                      toggleFilterValue(
                        filterPickerField
                          .key,
                        option
                      )
                    }
                    sx={{
                      minHeight:
                        36,
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
                      checked={
                        selected
                      }
                      tabIndex={
                        -1
                      }
                      disableRipple
                      sx={{
                        p: 0.4,
                        mr: 0.7
                      }}
                    />

                    <ListItemText
                      primary={
                        option
                      }
                      primaryTypographyProps={{
                        fontFamily:
                          "Cairo",
                        fontWeight:
                          800,
                        fontSize:
                          11,
                        noWrap:
                          true
                      }}
                    />
                  </ListItemButton>
                );
              }
            )}

            {pickerOptions.length ===
              0 && (
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
                لا توجد قيم مطابقة
              </Box>
            )}
          </List>
        </DialogContent>

        <DialogActions
          sx={{
            p: 1,
            gap: 1
          }}
        >
          {selectedPickerValues
            .length > 0 && (
            <Button
              color="error"
              onClick={() => {
                const key =
                  filterPickerField
                    .key;

                setAdvancedFilters(
                  (current) => ({
                    ...current,
                    [key]: []
                  })
                );
              }}
              sx={{
                fontFamily:
                  "Cairo",
                fontWeight: 900
              }}
            >
              مسح هذا الفلتر
            </Button>
          )}

          <Box
            sx={{
              flexGrow: 1
            }}
          />

          <Button
            variant="contained"
            onClick={
              closeFilterPicker
            }
            sx={{
              bgcolor:
                primaryColor,
              fontFamily:
                "Cairo",
              fontWeight: 900
            }}
          >
            تم
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={
          detailOpen
        }
        onClose={() =>
          setDetailOpen(
            false
          )
        }
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            direction: "ltr",
            borderRadius: 2.5
          }
        }}
      >
        <DialogTitle
          sx={{
            color:
              primaryColor,
            fontFamily:
              "Cairo",
            fontWeight: 950
          }}
        >
          تفاصيل فاتورة الضرائب
          {detailRow?.code
            ? ` #${detailRow.code}`
            : ""}
        </DialogTitle>

        <DialogContent
          dividers
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns:
                isPhone
                  ? "1fr"
                  : isTablet
                    ? "1fr 1fr"
                    : "repeat(3,1fr)",
              gap: 0.7
            }}
          >
            {[
              [
                "تاريخ الفاتورة",
                dateOnly(
                  detailRow
                    ?.billDate
                )
              ],
              [
                "رقم الفاتورة",
                detailRow?.code
              ],
              [
                "نوع المستند",
                detailRow
                  ?.docName
              ],
              [
                "اسم الطالب",
                detailRow
                  ?.studentName
              ],
              [
                "رقم الهوية",
                detailRow
                  ?.nationalId
              ],
              [
                "الصافي",
                money(
                  detailRow
                    ?.cost
                )
              ],
              [
                "الضريبة",
                money(
                  detailRow
                    ?.tax
                )
              ],
              [
                "الإجمالي",
                money(
                  detailRow
                    ?.subTotal
                )
              ],
              [
                "الفرع",
                detailRow
                  ?.branchName
              ],
              [
                "الخدمة المقدمة",
                detailRow
                  ?.diplomName
              ],
              [
                "المدة",
                detailRow
                  ?.times
              ]
            ].map(
              ([label, value]) => (
                <Paper
                  key={label}
                  elevation={0}
                  sx={{
                    p: 0.8,
                    border:
                      `1px solid ${borderColor}`,
                    borderRadius:
                      1.5
                  }}
                >
                  <Typography
                    sx={{
                      color:
                        mutedColor,
                      fontSize: 9,
                      fontWeight:
                        800
                    }}
                  >
                    {label}
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: 12,
                      fontWeight:
                        900,
                      wordBreak:
                        "break-word"
                    }}
                  >
                    {value || "-"}
                  </Typography>
                </Paper>
              )
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() =>
              setDetailOpen(
                false
              )
            }
          >
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}