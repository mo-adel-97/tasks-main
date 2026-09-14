import { DESKTOP_BREAKPOINT, navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  AppBar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import CloseIcon from "@mui/icons-material/Close";




const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5258";

const primaryColor = "#057546";
const primaryDark = "#034d31";
const accentColor = "#ae1e21";
const textColor = "#1f2d3d";
const mutedColor = "#6f8a81";
const borderColor = "#dfe9e4";

const today = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
};

const firstDayOfMonth = () => {
  const d = new Date();
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const offset = first.getTimezoneOffset();
  return new Date(first.getTime() - offset * 60000).toISOString().slice(0, 10);
};

const currentUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const getUserGuid = (user) =>
  user?.userGuid || user?.guid || user?.Guid || user?.USER_GUID || "";

const money = (value) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const gridMoney = (value) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

const asNumber = (value) => Number(value || 0);

const statusChip = (status) => {
  if (status === "ok") return <Chip size="small" color="success" label="سليم" />;
  if (status === "warning") return <Chip size="small" color="warning" label="تنبيه" />;
  return <Chip size="small" color="error" label="خلل" />;
};

const severityChip = (severity) => {
  if (severity === "critical") return <Chip size="small" color="error" label="مهم" />;
  return <Chip size="small" color="warning" label="تنبيه" />;
};

const normalizeCheck = (row = {}) => {
  const key = row.checkKey || "";

  if (key === "daily-balance") {
    return {
      ...row,
      checkName: "توازن اليومية العامة",
      notes: "إجمالي المدين يجب أن يساوي إجمالي الدائن داخل سماحية الفرق."
    };
  }

  if (key === "sales-net-vs-sales-account") {
    return {
      ...row,
      checkName: "صافي فواتير المبيعات مقابل حساب المبيعات",
      notes: "يطابق صافي تقرير المبيعات مع الطرف الدائن في حساب المبيعات."
    };
  }

  if (key === "sales-gross-vs-registrations") {
    return {
      ...row,
      checkName: "إجمالي فواتير المبيعات مقابل مدين تسجيلات الطلاب",
      notes: "يطابق إجمالي الفواتير مع الطرف المدين في حساب تسجيلات الطلاب."
    };
  }

  if (key === "sales-report-vs-tax-report-net") {
    return {
      ...row,
      checkName: "مطابقة الصافي: تقرير المبيعات مع مبيعات الضرائب",
      notes: "يقارن صافي تقرير المبيعات BillTotal مع صافي تقرير مبيعات الضرائب Cost."
    };
  }

  if (key === "sales-report-vs-tax-report-tax") {
    return {
      ...row,
      checkName: "مطابقة الضريبة: تقرير المبيعات مع مبيعات الضرائب",
      notes: "يقارن ضريبة تقرير المبيعات BillTax مع ضريبة تقرير مبيعات الضرائب Tax."
    };
  }

  if (key === "sales-report-vs-tax-report-gross") {
    return {
      ...row,
      checkName: "مطابقة الإجمالي: تقرير المبيعات مع مبيعات الضرائب",
      notes: "يقارن إجمالي تقرير المبيعات BillSubTotal مع إجمالي تقرير مبيعات الضرائب SubTotal."
    };
  }

  if (key === "receipts-vs-sales-invoices-journal") {
    return {
      ...row,
      checkName: "مطابقة سندات القبض مع فواتير المبيعات - اليومية",
      notes: "يقارن إجمالي قيود سند القبض مع إجمالي قيود فاتورة المبيعات داخل اليومية العامة."
    };
  }

  if (key === "sales-report-vs-zatca-388") {
    return {
      ...row,
      checkName: "مطابقة تقرير المبيعات مع فواتير الزكاة",
      notes:
        row.notes ||
        "يطابق أرقام فواتير تقرير المبيعات مع BillByJson للنوع ZacatType = 388."
    };
  }

  return row;
};

const normalizeProblem = (row = {}) => {
  if (row.problemType === "stopped-entry-out-of-numbers") {
    return {
      ...row,
      problemTitle: "قيد موقوف خارج الأرقام",
      suggestedPlace: "اليومية العامة - قيد موقوف",
      notes: row.notes || "هذا القيد موقوف IsUse = 0، لذلك يظهر للتنبيه فقط ولا يدخل في الإجماليات."
    };
  }

  if (row.problemType === "registrations-debit-mismatch") {
    return {
      ...row,
      problemTitle: "فرق في طرف تسجيلات الطلاب",
      suggestedPlace: "قيد فاتورة المبيعات - الطرف المدين"
    };
  }

  if (row.problemType === "sales-net-amount-mismatch") {
    return {
      ...row,
      problemTitle: "فرق في طرف حساب المبيعات",
      suggestedPlace: "قيد فاتورة المبيعات - الطرف الدائن"
    };
  }

  if (row.problemType === "sales-tax-report-row-mismatch") {
    return {
      ...row,
      problemTitle: row.problemTitle || "فرق بين تقرير المبيعات وتقرير مبيعات الضرائب",
      suggestedPlace: "تقرير المبيعات / تقرير مبيعات الضرائب"
    };
  }

  if (row.problemType === "receipts-vs-sales-invoices-journal") {
    return {
      ...row,
      problemTitle: "فرق بين سندات القبض وفواتير المبيعات",
      suggestedPlace: "اليومية العامة - سند قبض / فاتورة مبيعات"
    };
  }

  if (row.problemType === "missing-in-zatca") {
    return {
      ...row,
      problemTitle: "فاتورة مبيعات ناقصة في BillByJson",
      suggestedPlace: "تقرير المبيعات / BillByJson - 388"
    };
  }

  if (row.problemType === "extra-in-zatca") {
    return {
      ...row,
      problemTitle: "فاتورة زائدة في BillByJson",
      suggestedPlace: "BillByJson / تقرير المبيعات"
    };
  }

  if (row.problemType === "duplicate-in-zatca") {
    return {
      ...row,
      problemTitle: "فاتورة مكررة في BillByJson",
      suggestedPlace: "BillByJson - ZacatType 388"
    };
  }

  if (row.problemType === "amount-mismatch") {
    return {
      ...row,
      problemTitle: "فرق مبلغ مع JSON الزكاة",
      suggestedPlace: "تقرير المبيعات / BillByJson"
    };
  }

  return row;
};

export default function BalanceReviewPage() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(`(min-width:${DESKTOP_BREAKPOINT}px)`, { noSsr: true });
  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery("(min-width:600px) and (max-width:1599px)");

  const user = useMemo(() => currentUser(), []);
  const userGuid = useMemo(() => getUserGuid(user), [user]);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [fromDate, setFromDate] = useState(today());
  const [toDate, setToDate] = useState(today());
  const [tolerance, setTolerance] = useState("2");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  // يمنع تداخل أكثر من طلب في نفس الوقت ويمنع رد قديم
  // من الكتابة فوق نتيجة أحدث.
  const activeRequestRef = useRef(null);
  const requestSequenceRef = useRef(0);
  const initialLoadDoneRef = useRef(false);

  const [loadingSeconds, setLoadingSeconds] = useState(0);
  const [checkDetailsOpen, setCheckDetailsOpen] = useState(false);
  const [checkDetailsRow, setCheckDetailsRow] = useState(null);
  const [problemDetailsOpen, setProblemDetailsOpen] = useState(false);
  const [problemDetailsRow, setProblemDetailsRow] = useState(null);
  const deferredSearch = useDeferredValue(search);

  const loadData = useCallback(async () => {
    if (!userGuid) {
      setError("تعذر قراءة بيانات المستخدم. برجاء تسجيل الدخول مرة أخرى.");
      return;
    }

    if (!fromDate || !toDate) {
      setError("برجاء اختيار الفترة من وإلى");
      return;
    }

    if (fromDate > toDate) {
      setError("تاريخ البداية يجب أن يكون أقل من أو يساوي تاريخ النهاية");
      return;
    }

    // إلغاء أي Request سابق مازال شغال.
    if (activeRequestRef.current) {
      activeRequestRef.current.abort();
    }

    const controller = new AbortController();
    activeRequestRef.current = controller;

    const requestId =
      ++requestSequenceRef.current;

    try {
      setLoading(true);
      setLoadingSeconds(0);
      setError("");

      const params = new URLSearchParams({
        userGuid,
        fromDate,
        toDate,
        tolerance: String(tolerance || 2)
      });

      const response = await fetch(
        `${API_BASE_URL}/api/balance-review?${params.toString()}`,
        {
          cache: "no-store",
          headers: { Accept: "application/json" },
          signal: controller.signal
        }
      );

      const data =
        await response.json().catch(() => null);

      // لو فيه Request أحدث، تجاهل الرد القديم.
      if (requestId !== requestSequenceRef.current) {
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
          data?.details ||
          "تعذر تشغيل مراجعة الميزان"
        );
      }

      setResult(data);
    } catch (e) {
      if (e?.name === "AbortError") {
        return;
      }

      if (requestId !== requestSequenceRef.current) {
        return;
      }

      setError(
        e?.message ||
        "حدث خطأ أثناء مراجعة الميزان"
      );
    } finally {
      if (requestId === requestSequenceRef.current) {
        setLoading(false);

        if (activeRequestRef.current === controller) {
          activeRequestRef.current = null;
        }
      }
    }
  }, [userGuid, fromDate, toDate, tolerance]);

  /*
   * تحميل أول مرة فقط.
   *
   * قبل كده أي تغيير في من / إلى / السماحية
   * كان يطلق Request جديد تلقائيًا لأن loadData تتغير،
   * وبعدها المستخدم يضغط "عرض" فيطلع Request إضافي.
   *
   * دلوقتي:
   * - أول فتح: تحميل مرة واحدة.
   * - تغيير الفلاتر: لا يرسل شيء.
   * - الضغط على "عرض": Request واحد فقط.
   */
  useEffect(() => {
    if (initialLoadDoneRef.current) {
      return;
    }

    initialLoadDoneRef.current = true;
    loadData();
  }, [loadData]);

  // عداد بسيط أثناء التحميل عشان المستخدم يعرف إن الشاشة شغالة.
  useEffect(() => {
    if (!loading) {
      setLoadingSeconds(0);
      return;
    }

    const timer = window.setInterval(() => {
      setLoadingSeconds((value) => value + 1);
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [loading]);

  // إلغاء أي Request عند مغادرة الصفحة.
  useEffect(() => {
    return () => {
      if (activeRequestRef.current) {
        activeRequestRef.current.abort();
      }
    };
  }, []);

  const summary = result?.summary || {};
  const checks = useMemo(
    () => (Array.isArray(result?.checks) ? result.checks.map(normalizeCheck) : []),
    [result]
  );
  const problems = useMemo(
    () => (Array.isArray(result?.problems) ? result.problems.map(normalizeProblem) : []),
    [result]
  );

  const zatcaComparison = useMemo(
    () =>
      Array.isArray(result?.zatcaComparison)
        ? result.zatcaComparison
        : [],
    [result]
  );

  const filteredProblems = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    if (!q) return problems;
    return problems.filter((row) =>
      [
        row.problemTitle,
        row.problemType,
        row.suggestedPlace,
        row.billCode,
        row.day1Code,
        row.studentName,
        row.nationalId,
        row.branchName,
        row.notes
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [problems, deferredSearch]);

  const status = result?.status || "ok";
  const isOk = status === "ok";

  const summaryCards = [
    {
      title: "اليومية العامة",
      value: summary.dailyDifference,
      helper: `مدين ${money(summary.dailyMaden)} / دائن ${money(summary.dailyDaen)}`,
      danger: Math.abs(asNumber(summary.dailyDifference)) > asNumber(tolerance || 2)
    },
    {
      title: "حساب المبيعات",
      value: summary.salesNetDifference,
      helper: `صافي الفواتير ${money(summary.salesReportNet)} / حساب المبيعات ${money(summary.salesAccountCredit)}`,
      danger: Math.abs(asNumber(summary.salesNetDifference)) > asNumber(tolerance || 2)
    },
    {
      title: "تسجيلات الطلاب",
      value: summary.registrationsDifference,
      helper: `إجمالي الفواتير ${money(summary.salesReportGross)} / مدين تسجيلات الطلاب ${money(summary.registrationsDebit)}`,
      danger: Math.abs(asNumber(summary.registrationsDifference)) > asNumber(tolerance || 2)
    },
    {
      title: "مبيعات الضرائب",
      value: summary.taxReportGrossDifference,
      helper: `تقرير المبيعات ${money(summary.salesReportGross)} / تقرير الضرائب ${money(summary.taxReportGross)}`,
      danger: Math.abs(asNumber(summary.taxReportGrossDifference)) > asNumber(tolerance || 2)
    },
    {
      title: "سندات القبض",
      value: summary.receiptSalesDifference,
      helper: `فواتير المبيعات ${money(summary.salesInvoiceJournalTotal)} / سندات القبض ${money(summary.receiptJournalTotal)}`,
      danger: Math.abs(asNumber(summary.receiptSalesDifference)) > asNumber(tolerance || 2)
    },
    {
      title: "مطابقة الزكاة",
      value: Number(summary.zatcaMatchedCount || 0),
      helper:
        `مبيعات ${Number(summary.salesInvoiceCount || 0)} / ` +
        `زكاة 388 ${Number(summary.zatcaInvoiceCount || 0)} / ` +
        `ناقص ${Number(summary.zatcaMissingCount || 0)} / ` +
        `زائد ${Number(summary.zatcaExtraCount || 0)} / ` +
        `مكرر ${Number(summary.zatcaDuplicateCount || 0)}`,
      danger:
        Number(summary.zatcaMissingCount || 0) > 0 ||
        Number(summary.zatcaExtraCount || 0) > 0 ||
        Number(summary.zatcaDuplicateCount || 0) > 0 ||
        Number(summary.zatcaAmountMismatchCount || 0) > 0
    }
  ];

  const zatcaStatusChip = (row) => {
    const status = row?.status || "";

    if (status === "matched") {
      return <Chip size="small" color="success" label="مطابق" />;
    }

    if (status === "missing-in-zatca") {
      return <Chip size="small" color="error" label="ناقص بالزكاة" />;
    }

    if (status === "extra-in-zatca") {
      return <Chip size="small" color="warning" label="زائد بالزكاة" />;
    }

    if (status === "duplicate-in-zatca") {
      return <Chip size="small" color="warning" label="مكرر" />;
    }

    if (status === "amount-mismatch") {
      return <Chip size="small" color="error" label="فرق مبلغ" />;
    }

    return <Chip size="small" label={row?.statusLabel || "-"} />;
  };

  const zatcaColumns = useMemo(
    () => [
      {
        field: "status",
        headerName: "الحالة",
        width: 125,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => zatcaStatusChip(params.row)
      },
      {
        field: "billCode",
        headerName: "رقم الفاتورة",
        width: 115,
        align: "center",
        headerAlign: "center"
      },
      {
        field: "studentName",
        headerName: "اسم الطالب",
        minWidth: 190,
        flex: 1.15
      },
      {
        field: "branchName",
        headerName: "الفرع",
        minWidth: 200,
        flex: 1.15
      },
      {
        field: "salesAmount",
        headerName: "تقرير المبيعات",
        width: 125,
        align: "center",
        headerAlign: "center",
        valueFormatter: (params) => gridMoney(params.value)
      },
      {
        field: "zatcaAmount",
        headerName: "BillByJson",
        width: 115,
        align: "center",
        headerAlign: "center",
        valueFormatter: (params) => gridMoney(params.value)
      },
      {
        field: "difference",
        headerName: "الفرق",
        width: 95,
        align: "center",
        headerAlign: "center",
        valueFormatter: (params) => gridMoney(params.value)
      },
      {
        field: "billByJsonCount",
        headerName: "عدد سجلات الزكاة",
        width: 120,
        align: "center",
        headerAlign: "center"
      },
      {
        field: "sendCheck",
        headerName: "تم الإرسال",
        width: 95,
        align: "center",
        headerAlign: "center",
        renderCell: (params) =>
          params.value ? (
            <Chip size="small" color="success" label="نعم" />
          ) : (
            <Chip size="small" variant="outlined" label="لا" />
          )
      },
      {
        field: "zacatStaut",
        headerName: "حالة الزكاة",
        minWidth: 130,
        flex: 0.8
      },
      {
        field: "notes",
        headerName: "التوضيح",
        minWidth: 280,
        flex: 1.4
      }
    ],
    []
  );

  const compactZatcaColumns = useMemo(
    () => [
      {
        field: "status",
        headerName: "الحالة",
        flex: 0.9,
        minWidth: 0,
        align: "center",
        headerAlign: "center",
        sortable: false,
        renderCell: (params) => zatcaStatusChip(params.row)
      },
      {
        field: "billCode",
        headerName: "الفاتورة",
        flex: 0.8,
        minWidth: 0,
        align: "center",
        headerAlign: "center",
        sortable: false
      },
      {
        field: "studentName",
        headerName: "الطالب",
        flex: isPhone ? 1.3 : 1.6,
        minWidth: 0,
        align: "center",
        headerAlign: "center",
        sortable: false
      },
      {
        field: "difference",
        headerName: "الفرق",
        flex: 0.75,
        minWidth: 0,
        align: "center",
        headerAlign: "center",
        sortable: false,
        valueFormatter: (params) => gridMoney(params.value)
      }
    ],
    [isPhone]
  );

  const checkColumns = useMemo(() => [
    {
      field: "status",
      headerName: "الحالة",
      width: 95,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => statusChip(params.value)
    },
    { field: "checkName", headerName: "الفحص", flex: 1.35, minWidth: 240 },
    {
      field: "reportValue",
      headerName: "القيمة الأولى",
      width: 145,
      align: "center",
      headerAlign: "center",
      valueFormatter: (params) => money(params.value)
    },
    {
      field: "journalValue",
      headerName: "القيمة الثانية",
      width: 145,
      align: "center",
      headerAlign: "center",
      valueFormatter: (params) => money(params.value)
    },
    {
      field: "difference",
      headerName: "الفرق",
      width: 110,
      align: "center",
      headerAlign: "center",
      valueFormatter: (params) => money(params.value)
    },
    { field: "notes", headerName: "التوضيح", flex: 1.5, minWidth: 300 }
  ], []);

  const compactCheckColumns = useMemo(() => [
    {
      field: "status",
      headerName: "الحالة",
      flex: 0.7,
      minWidth: 0,
      align: "center",
      headerAlign: "center",
      sortable: false,
      renderCell: (params) => statusChip(params.value)
    },
    {
      field: "checkName",
      headerName: "الفحص",
      flex: isPhone ? 1.7 : 2,
      minWidth: 0,
      align: "center",
      headerAlign: "center",
      sortable: false
    },
    {
      field: "difference",
      headerName: "الفرق",
      flex: 0.85,
      minWidth: 0,
      align: "center",
      headerAlign: "center",
      sortable: false,
      valueFormatter: (params) => gridMoney(params.value)
    },
    {
      field: "__details",
      headerName: "",
      width: isPhone ? 34 : 42,
      minWidth: isPhone ? 34 : 42,
      maxWidth: isPhone ? 34 : 42,
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
            setCheckDetailsRow(params.row);
            setCheckDetailsOpen(true);
          }}
          sx={{
            width: isPhone ? 24 : 28,
            height: isPhone ? 24 : 28,
            p: 0,
            color: primaryColor,
            bgcolor: "#eef8f3",
            border: "1px solid rgba(5,117,70,.22)"
          }}
        >
          <VisibilityOutlinedIcon sx={{ fontSize: isPhone ? 14 : 17 }} />
        </IconButton>
      )
    }
  ], [isPhone]);

  const problemColumns = useMemo(() => [
    {
      field: "severity",
      headerName: "الأهمية",
      width: 95,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => severityChip(params.value)
    },
    { field: "problemTitle", headerName: "المشكلة", minWidth: 220, flex: 1.15 },
    { field: "suggestedPlace", headerName: "مكان المراجعة", minWidth: 200, flex: 1 },
    { field: "billCode", headerName: "رقم المستند", width: 115, align: "center", headerAlign: "center" },
    { field: "day1Code", headerName: "رقم القيد", width: 105, align: "center", headerAlign: "center" },
    { field: "studentName", headerName: "الطالب / الحساب", minWidth: 175, flex: 1 },
    { field: "nationalId", headerName: "الهوية", width: 120, align: "center", headerAlign: "center" },
    { field: "branchName", headerName: "الفرع", minWidth: 190, flex: 1 },
    {
      field: "amount",
      headerName: "القيمة",
      width: 105,
      align: "center",
      headerAlign: "center",
      valueFormatter: (params) => gridMoney(params.value)
    },
    {
      field: "journalAmount",
      headerName: "اليومية",
      width: 105,
      align: "center",
      headerAlign: "center",
      valueFormatter: (params) => gridMoney(params.value)
    },
    {
      field: "difference",
      headerName: "الفرق",
      width: 95,
      align: "center",
      headerAlign: "center",
      valueFormatter: (params) => gridMoney(params.value)
    },
    { field: "notes", headerName: "البيان", minWidth: 240, flex: 1.2 }
  ], []);

  const compactProblemColumns = useMemo(() => {
    const cols = [
      {
        field: "severity",
        headerName: "الأهمية",
        flex: 0.7,
        minWidth: 0,
        align: "center",
        headerAlign: "center",
        sortable: false,
        renderCell: (params) => severityChip(params.value)
      },
      {
        field: "problemTitle",
        headerName: "المشكلة",
        flex: isPhone ? 1.7 : 1.8,
        minWidth: 0,
        align: "center",
        headerAlign: "center",
        sortable: false
      },
      {
        field: "difference",
        headerName: "الفرق",
        flex: 0.85,
        minWidth: 0,
        align: "center",
        headerAlign: "center",
        sortable: false,
        valueFormatter: (params) => gridMoney(params.value)
      }
    ];

    if (!isPhone) {
      cols.splice(2, 0, {
        field: "studentName",
        headerName: "الطالب / الحساب",
        flex: 1.25,
        minWidth: 0,
        align: "center",
        headerAlign: "center",
        sortable: false
      });
    }

    cols.push({
      field: "__details",
      headerName: "",
      width: isPhone ? 34 : 42,
      minWidth: isPhone ? 34 : 42,
      maxWidth: isPhone ? 34 : 42,
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
            setProblemDetailsRow(params.row);
            setProblemDetailsOpen(true);
          }}
          sx={{
            width: isPhone ? 24 : 28,
            height: isPhone ? 24 : 28,
            p: 0,
            color: primaryColor,
            bgcolor: "#eef8f3",
            border: "1px solid rgba(5,117,70,.22)"
          }}
        >
          <VisibilityOutlinedIcon sx={{ fontSize: isPhone ? 14 : 17 }} />
        </IconButton>
      )
    });

    return cols;
  }, [isPhone]);

  const exportCsv = () => {
    const header = [
      "المشكلة",
      "مكان المراجعة",
      "رقم المستند",
      "رقم القيد",
      "الطالب/الحساب",
      "الهوية",
      "الفرع",
      "القيمة",
      "اليومية",
      "الفرق",
      "البيان"
    ];

    const lines = filteredProblems.map((row) =>
      [
        row.problemTitle,
        row.suggestedPlace,
        row.billCode,
        row.day1Code,
        row.studentName,
        row.nationalId,
        row.branchName,
        row.amount,
        row.journalAmount,
        row.difference,
        row.notes
      ]
        .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );

    const csv = "\uFEFF" + [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `مراجعة-الميزان-${fromDate}-${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <NavigationShell variant="standard" mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)}><Box sx={{ direction: "rtl", minHeight: "100vh", bgcolor: "#f4f7f6", overflowX: "hidden" }}>
      

      <Box
        component="main"
        sx={{
          maxWidth: "100vw",
          padding: isDesktop ? "18px 20px" : isPhone ? "6px 5px" : "10px",
          boxSizing: "border-box",
          transition: "margin 0.2s ease, width 0.2s ease",
          overflowX: "hidden",
          ...navigationContentSx
        }}
      >
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: "rgba(255,255,255,0.96)",
            color: textColor,
            border: `1px solid ${borderColor}`,
            borderRadius: 3,
            backdropFilter: "blur(10px)"
          }}
        >
          <Toolbar
            sx={{
              gap: isDesktop ? 1.1 : isPhone ? 0.45 : 0.55,
              minHeight: isDesktop ? 64 : isPhone ? 50 : 56,
              flexWrap: "wrap",
              alignItems: "center",
              direction: "rtl",
              px: isDesktop ? 1.5 : isPhone ? 0.55 : 0.65,
              py: isDesktop ? 0.4 : isPhone ? 0.55 : 0.25
            }}
          >
            {!isDesktop && (
              <IconButton onClick={() => setMobileSidebarOpen(true)} edge="start">
                <MenuRoundedIcon />
              </IconButton>
            )}

            <FactCheckIcon sx={{ color: primaryColor }} />
            <Box
              sx={{
                flexGrow: 1,
                minWidth: isDesktop ? 260 : isPhone ? 150 : 200,
                width: isPhone ? "calc(100% - 86px)" : "auto",
                textAlign: "start",
                direction: "rtl"
              }}
            >
              <Typography
                sx={{
                  fontWeight: 900,
                  fontSize: isDesktop ? 23 : isPhone ? 13 : 17
                }}
              >
                مراجعة الميزان
              </Typography>
              {!isPhone && (
                <Typography
                  sx={{
                    color: mutedColor,
                    fontSize: isDesktop ? 13 : 10,
                    fontWeight: 700
                  }}
                >
                  فحص محاسبي مختصر للفواتير، القيود، الضريبة، والحسابات الرقابية
                </Typography>
              )}
            </Box>

            <TextField
              label="من"
              type="date"
              size="small"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              inputProps={{ max: toDate || undefined , dir: "ltr" , style: { direction: "ltr", unicodeBidi: "isolate" } }}
              InputLabelProps={{ shrink: true }}
              sx={{
                width: isPhone ? "calc(50% - 3px)" : 145,
                "& .MuiInputBase-root": { height: isPhone ? 34 : 40 },
                "& .MuiInputBase-input": { fontSize: isPhone ? "0.68rem" : undefined },
                "& .MuiInputLabel-root": { fontSize: isPhone ? "0.64rem" : undefined }
              }}
            />
            <TextField
              label="إلى"
              type="date"
              size="small"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              inputProps={{ min: fromDate || undefined , dir: "ltr" , style: { direction: "ltr", unicodeBidi: "isolate" } }}
              InputLabelProps={{ shrink: true }}
              sx={{
                width: isPhone ? "calc(50% - 3px)" : 145,
                "& .MuiInputBase-root": { height: isPhone ? 34 : 40 },
                "& .MuiInputBase-input": { fontSize: isPhone ? "0.68rem" : undefined },
                "& .MuiInputLabel-root": { fontSize: isPhone ? "0.64rem" : undefined }
              }}
            />
            <TextField
              label="سماحية الفرق"
              size="small"
              value={tolerance}
              onChange={(e) => setTolerance(e.target.value)}
              sx={{
                width: isPhone ? "calc(50% - 3px)" : 125,
                "& .MuiInputBase-root": { height: isPhone ? 34 : 40 },
                "& .MuiInputBase-input": { fontSize: isPhone ? "0.68rem" : undefined },
                "& .MuiInputLabel-root": { fontSize: isPhone ? "0.64rem" : undefined }
              }}
            />
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <RefreshIcon />}
              onClick={loadData}
              disabled={loading}
              sx={{
                bgcolor: primaryColor,
                fontWeight: 900,
                px: isDesktop ? 3 : 1.2,
                minHeight: isPhone ? 34 : 40,
                width: isPhone ? "calc(50% - 3px)" : "auto",
                fontSize: isPhone ? "0.68rem" : undefined,
                flex: "none",
                "&:hover": { bgcolor: primaryDark }
              }}
            >
              {loading ? "جاري الفحص..." : "عرض"}
            </Button>
          </Toolbar>
        </AppBar>

        {loading && (
          <Paper
            elevation={0}
            sx={{
              mt: 1,
              p: isPhone ? 0.8 : 1.1,
              borderRadius: 2,
              border: "1px solid rgba(5,117,70,.22)",
              bgcolor: "rgba(238,248,243,.95)",
              position: "sticky",
              top: isPhone ? 56 : 70,
              zIndex: 20
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ direction: "rtl" }}
            >
              <CircularProgress
                size={isPhone ? 18 : 22}
                thickness={5}
              />

              <Box sx={{ flexGrow: 1 }}>
                <Typography
                  sx={{
                    fontWeight: 900,
                    color: primaryColor,
                    fontSize: isPhone ? 10 : 13
                  }}
                >
                  جاري تجهيز مراجعة الميزان...
                </Typography>

                <Typography
                  sx={{
                    color: mutedColor,
                    fontWeight: 700,
                    fontSize: isPhone ? 8 : 10.5
                  }}
                >
                  يتم تشغيل الفحوصات بالتوازي — مرّ {loadingSeconds} ثانية
                </Typography>
              </Box>
            </Stack>
          </Paper>
        )}

        <Box sx={{ pt: 2, maxWidth: "100%", overflowX: "hidden" }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2, fontWeight: 800, direction: "rtl" }}>
              {error}
            </Alert>
          )}

          {result && (
            <Alert
              severity={isOk ? "success" : status === "warning" ? "warning" : "error"}
              icon={isOk ? <CheckCircleIcon /> : status === "warning" ? <WarningAmberIcon /> : <ErrorIcon />}
              sx={{ mb: 2, fontWeight: 900, borderRadius: 2, direction: "rtl" }}
            >
              {result.message} — مشاكل مهمة: {result.criticalCount || 0} / تنبيهات: {result.warningCount || 0}
            </Alert>
          )}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, minmax(0, 1fr))",
                sm: "repeat(3, minmax(0, 1fr))",
                xl: "repeat(5, minmax(0, 1fr))"
              },
              gap: isPhone ? 0.5 : isTablet ? 0.8 : 1.15,
              mb: isPhone ? 0.7 : 1.4,
              direction: "rtl"
            }}
          >
            {summaryCards.map((card) => (
              <Paper
                key={card.title}
                sx={{
                  borderRadius: isPhone ? 1.6 : 2.5,
                  p: isPhone ? 0.65 : isTablet ? 0.9 : 1.15,
                  minHeight: isPhone ? 72 : isTablet ? 84 : 92,
                  boxShadow: "none",
                  border: `1px solid ${card.danger ? "#efc1c1" : borderColor}`,
                  bgcolor: card.info ? "#f8fbfa" : "#fff"
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 900,
                    color: mutedColor,
                    mb: isPhone ? 0.35 : 0.7,
                    fontSize: isPhone ? 9 : isTablet ? 11 : 12
                  }}
                >
                  {card.title}
                </Typography>
                <Typography
                  sx={{
                    fontWeight: 950,
                    fontSize: isPhone ? 14 : isTablet ? 18 : 21,
                    color: card.danger ? accentColor : primaryColor,
                    direction: "ltr",
                    textAlign: "right"
                  }}
                >
                  {money(card.value)}
                </Typography>
                <Typography
                  sx={{
                    fontWeight: 700,
                    color: textColor,
                    mt: isPhone ? 0.35 : 0.7,
                    fontSize: isPhone ? 8.5 : isTablet ? 9.5 : 11,
                    lineHeight: 1.35
                  }}
                >
                  {card.helper}
                </Typography>
              </Paper>
            ))}
          </Box>

          <Paper
            sx={{
              borderRadius: 3,
              p: isPhone ? 0.6 : isTablet ? 0.9 : 1.3,
              mb: isPhone ? 0.8 : 1.5,
              boxShadow: "none",
              border: `1px solid ${borderColor}`,
              overflow: "hidden"
            }}
          >
            <Stack
              direction={isPhone ? "column" : "row"}
              spacing={0.7}
              alignItems={isPhone ? "stretch" : "center"}
              sx={{ mb: isPhone ? 0.55 : 1, direction: "rtl" }}
            >
              <Box sx={{ flexGrow: 1 }}>
                <Typography
                  sx={{
                    fontWeight: 950,
                    fontSize: isPhone ? 12 : isTablet ? 15 : 18
                  }}
                >
                  مطابقة تقرير المبيعات مع فواتير الزكاة
                </Typography>

                <Typography
                  sx={{
                    color: mutedColor,
                    fontWeight: 750,
                    fontSize: isPhone ? 8 : 10.5,
                    mt: 0.2
                  }}
                >
                  BillByJson — ZacatType = 388 فقط
                </Typography>
              </Box>

              <Stack
                direction="row"
                spacing={0.45}
                sx={{ flexWrap: "wrap", gap: 0.45 }}
              >
                <Chip
                  size="small"
                  color="success"
                  label={`مطابق ${Number(summary.zatcaMatchedCount || 0)}`}
                />
                <Chip
                  size="small"
                  color="error"
                  label={`ناقص ${Number(summary.zatcaMissingCount || 0)}`}
                />
                <Chip
                  size="small"
                  color="warning"
                  label={`زائد ${Number(summary.zatcaExtraCount || 0)}`}
                />
                <Chip
                  size="small"
                  variant="outlined"
                  label={`مكرر ${Number(summary.zatcaDuplicateCount || 0)}`}
                />
              </Stack>
            </Stack>

            <Box
              sx={{
                width: "100%",
                height: isPhone ? 320 : isTablet ? 360 : 420,
                overflow: "hidden"
              }}
            >
              <DataGrid
                rows={zatcaComparison.map((row, index) => ({
                  ...row,
                  id: row.id || `zatca-${row.billCode || index}`
                }))}
                columns={isDesktop ? zatcaColumns : compactZatcaColumns}
                density="compact"
                rowHeight={isDesktop ? 42 : isPhone ? 34 : 38}
                columnHeaderHeight={isDesktop ? 42 : isPhone ? 34 : 38}
                disableColumnMenu
                disableRowSelectionOnClick
                pageSizeOptions={[10, 25, 50, 100]}
                initialState={{
                  pagination: {
                    paginationModel: {
                      pageSize: 25,
                      page: 0
                    }
                  }
                }}
                getRowClassName={(params) =>
                  params.row.status === "matched"
                    ? "zatca-match-row"
                    : "zatca-error-row"
                }
                sx={{
                  border: 0,
                  direction: "rtl",
                  "& .MuiDataGrid-columnHeaders": {
                    bgcolor: "#eef7f2",
                    fontWeight: 900
                  },
                  "& .MuiDataGrid-cell": {
                    fontWeight: 750,
                    borderColor: "#edf2ef",
                    fontSize: isDesktop ? 12 : isPhone ? 9 : 10,
                    px: isPhone ? 0.15 : 0.45,
                    justifyContent: !isDesktop ? "center" : undefined,
                    textAlign: !isDesktop ? "center" : undefined
                  },
                  "& .MuiDataGrid-columnHeaderTitle": {
                    fontWeight: 900,
                    fontSize: isDesktop ? 12 : isPhone ? 9 : 10,
                    textAlign: "center"
                  },
                  "& .MuiDataGrid-columnHeaderTitleContainer": {
                    justifyContent: "center"
                  },
                  "& .MuiDataGrid-columnSeparator, & .MuiDataGrid-menuIcon": {
                    display: !isDesktop ? "none" : undefined
                  },
                  "& .zatca-match-row": {
                    bgcolor: "rgba(5,117,70,0.035)"
                  },
                  "& .zatca-error-row": {
                    bgcolor: "rgba(174,30,33,0.045)"
                  },
                  "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus": {
                    outline: "none"
                  }
                }}
              />
            </Box>
          </Paper>

          <Paper sx={{ borderRadius: 3, p: isPhone ? 0.6 : isTablet ? 0.9 : 1.3, mb: isPhone ? 0.8 : 1.5, boxShadow: "none", border: `1px solid ${borderColor}`, overflow: "hidden" }}>
            <Stack
              direction={isPhone ? "column" : "row"}
              spacing={0.7}
              alignItems={isPhone ? "stretch" : "center"}
              sx={{ mb: isPhone ? 0.55 : 1, direction: "rtl" }}
            >
              <Typography sx={{ fontWeight: 950, fontSize: isPhone ? 12 : isTablet ? 15 : 18, flexGrow: 1 }}>
                الفحوصات الرئيسية
              </Typography>
              <Tooltip title="تصدير المشاكل CSV">
                <Button
                  variant="outlined"
                  startIcon={<FileDownloadIcon />}
                  onClick={exportCsv}
                  fullWidth={isPhone}
                  sx={{
                    minHeight: isPhone ? 34 : 36,
                    fontSize: isPhone ? "0.7rem" : undefined,
                    fontWeight: 850
                  }}
                >
                  تصدير المشاكل
                </Button>
              </Tooltip>
            </Stack>
            <Box sx={{ width: "100%", height: isPhone ? 300 : isTablet ? 330 : 360, overflow: "hidden" }}>
              <DataGrid
                rows={checks.map((row, index) => ({ ...row, id: row.checkKey || row.id || index + 1 }))}
                columns={isDesktop ? checkColumns : compactCheckColumns}
                density="compact"
                rowHeight={isDesktop ? 42 : isPhone ? 34 : 38}
                columnHeaderHeight={isDesktop ? 42 : isPhone ? 34 : 38}
                disableColumnMenu
                disableRowSelectionOnClick
                pageSizeOptions={[5, 10, 25]}
                initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
                sx={{
                  border: 0,
                  direction: "rtl",
                  "& .MuiDataGrid-columnHeaders": { bgcolor: "#eef7f2", fontWeight: 900 },
                  "& .MuiDataGrid-cell": {
                    fontWeight: 700,
                    borderColor: "#edf2ef",
                    fontSize: isDesktop ? 12 : isPhone ? 9 : 10,
                    px: isPhone ? 0.15 : 0.45,
                    justifyContent: !isDesktop ? "center" : undefined,
                    textAlign: !isDesktop ? "center" : undefined
                  },
                  "& .MuiDataGrid-columnHeaderTitle": {
                    fontWeight: 900,
                    fontSize: isDesktop ? 12 : isPhone ? 9 : 10,
                    textAlign: "center"
                  },
                  "& .MuiDataGrid-columnHeaderTitleContainer": { justifyContent: "center" },
                  "& .MuiDataGrid-columnSeparator, & .MuiDataGrid-menuIcon": {
                    display: !isDesktop ? "none" : undefined
                  },
                  "& .MuiDataGrid-row:hover": { bgcolor: "rgba(5,117,70,0.035)" },
                  "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus": { outline: "none" }
                }}
              />
            </Box>
          </Paper>

          <Paper sx={{ borderRadius: 3, p: isPhone ? 0.6 : isTablet ? 0.9 : 1.3, boxShadow: "none", border: `1px solid ${borderColor}`, overflow: "hidden" }}>
            <Stack
              direction={isPhone ? "column" : "row"}
              spacing={isPhone ? 0.5 : 0.8}
              alignItems={isPhone ? "stretch" : "center"}
              sx={{ mb: isPhone ? 0.55 : 1, direction: "rtl" }}
            >
              <Typography sx={{ fontWeight: 950, fontSize: isPhone ? 12 : isTablet ? 15 : 18, flexGrow: 1 }}>
                تفاصيل المراجعة
              </Typography>
              <TextField
                size="small"
                placeholder="بحث برقم مستند / قيد / طالب / هوية"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{ startAdornment: <SearchIcon sx={{ color: "#8aa79a", ml: 1 }} /> }}
                sx={{
                  minWidth: { xs: "100%", sm: 280, xl: 360 },
                  direction: "rtl",
                  "& .MuiInputBase-root": { height: isPhone ? 36 : 38 },
                  "& .MuiInputBase-input": { fontSize: isPhone ? "0.72rem" : undefined }
                }}
              />
            </Stack>

            <Box sx={{ width: "100%", height: isPhone ? 430 : isTablet ? 500 : 600, overflow: "hidden" }}>
              <DataGrid
                rows={filteredProblems.map((row, index) => ({ ...row, id: `${row.problemType || "p"}-${row.billCode || ""}-${row.day1Code || ""}-${index}` }))}
                columns={isDesktop ? problemColumns : compactProblemColumns}
                loading={loading}
                density="compact"
                rowHeight={isDesktop ? 42 : isPhone ? 34 : 38}
                columnHeaderHeight={isDesktop ? 42 : isPhone ? 34 : 38}
                disableColumnMenu
                disableRowSelectionOnClick
                pageSizeOptions={[10, 25, 50, 100]}
                initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
                getRowClassName={(params) =>
                  params.row.problemType === "stopped-entry-out-of-numbers"
                    ? "stopped-row"
                    : params.row.severity === "critical"
                      ? "critical-row"
                      : "warning-row"
                }
                sx={{
                  border: 0,
                  direction: "rtl",
                  minHeight: 300,
                  "& .MuiDataGrid-columnHeaders": { bgcolor: "#eef7f2", fontWeight: 900 },
                  "& .MuiDataGrid-cell": {
                    fontWeight: 700,
                    borderColor: "#edf2ef",
                    fontSize: isDesktop ? 12 : isPhone ? 9 : 10,
                    px: isPhone ? 0.15 : 0.45,
                    justifyContent: !isDesktop ? "center" : undefined,
                    textAlign: !isDesktop ? "center" : undefined
                  },
                  "& .MuiDataGrid-columnHeaderTitle": {
                    fontWeight: 900,
                    fontSize: isDesktop ? 12 : isPhone ? 9 : 10,
                    textAlign: "center"
                  },
                  "& .MuiDataGrid-columnHeaderTitleContainer": { justifyContent: "center" },
                  "& .MuiDataGrid-columnSeparator, & .MuiDataGrid-menuIcon": {
                    display: !isDesktop ? "none" : undefined
                  },
                  "& .MuiDataGrid-row:hover": { bgcolor: "rgba(5,117,70,0.035)" },
                  "& .critical-row": { bgcolor: "rgba(174,30,33,0.045)" },
                  "& .warning-row": { bgcolor: "rgba(245,158,11,0.055)" },
                  "& .stopped-row": { bgcolor: "rgba(245,158,11,0.08)" },
                  "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus": { outline: "none" }
                }}
              />
            </Box>
          </Paper>
        </Box>

        <Dialog
          open={checkDetailsOpen}
          onClose={() => setCheckDetailsOpen(false)}
          fullWidth
          maxWidth="sm"
          dir="rtl"
          PaperProps={{
            sx: {
              width: isPhone ? "94vw" : "82vw",
              m: 1,
              borderRadius: 2.4,
              maxHeight: "86dvh"
            }
          }}
        >
          <DialogTitle
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontWeight: 950,
              color: primaryDark,
              fontSize: isPhone ? "0.76rem" : "0.95rem"
            }}
          >
            تفاصيل الفحص
            <IconButton onClick={() => setCheckDetailsOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ p: isPhone ? 0.8 : 1.2 }}>
            {checkDetailsRow && (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: isPhone ? "repeat(2,minmax(0,1fr))" : "repeat(3,minmax(0,1fr))",
                  gap: 0.55
                }}
              >
                {[
                  ["الفحص", checkDetailsRow.checkName],
                  ["الحالة", checkDetailsRow.status],
                  ["القيمة الأولى", money(checkDetailsRow.reportValue)],
                  ["القيمة الثانية", money(checkDetailsRow.journalValue)],
                  ["الفرق", money(checkDetailsRow.difference)],
                  ["التوضيح", checkDetailsRow.notes]
                ].map(([label, value]) => (
                  <Paper key={label} elevation={0} sx={{ p: 0.65, border: `1px solid ${borderColor}`, borderRadius: 1.4 }}>
                    <Typography sx={{ fontWeight: 900, color: mutedColor, fontSize: isPhone ? "0.38rem" : "0.5rem" }}>
                      {label}
                    </Typography>
                    <Typography sx={{ mt: 0.2, fontWeight: 850, color: textColor, fontSize: isPhone ? "0.5rem" : "0.64rem", wordBreak: "break-word" }}>
                      {String(value ?? "-")}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button variant="contained" onClick={() => setCheckDetailsOpen(false)} sx={{ bgcolor: primaryColor, fontWeight: 900 }}>إغلاق</Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={problemDetailsOpen}
          onClose={() => setProblemDetailsOpen(false)}
          fullWidth
          maxWidth="md"
          dir="rtl"
          PaperProps={{
            sx: {
              width: isPhone ? "94vw" : "86vw",
              m: 1,
              borderRadius: 2.4,
              maxHeight: "86dvh"
            }
          }}
        >
          <DialogTitle
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontWeight: 950,
              color: primaryDark,
              fontSize: isPhone ? "0.76rem" : "0.95rem"
            }}
          >
            تفاصيل المشكلة
            <IconButton onClick={() => setProblemDetailsOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ p: isPhone ? 0.8 : 1.2 }}>
            {problemDetailsRow && (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: isPhone ? "repeat(2,minmax(0,1fr))" : "repeat(3,minmax(0,1fr))",
                  gap: 0.55
                }}
              >
                {[
                  ["المشكلة", problemDetailsRow.problemTitle],
                  ["الأهمية", problemDetailsRow.severity],
                  ["مكان المراجعة", problemDetailsRow.suggestedPlace],
                  ["رقم المستند", problemDetailsRow.billCode],
                  ["رقم القيد", problemDetailsRow.day1Code],
                  ["الطالب / الحساب", problemDetailsRow.studentName],
                  ["الهوية", problemDetailsRow.nationalId],
                  ["الفرع", problemDetailsRow.branchName],
                  ["القيمة", gridMoney(problemDetailsRow.amount)],
                  ["اليومية", gridMoney(problemDetailsRow.journalAmount)],
                  ["الفرق", gridMoney(problemDetailsRow.difference)],
                  ["البيان", problemDetailsRow.notes]
                ].map(([label, value]) => (
                  <Paper key={label} elevation={0} sx={{ p: 0.65, border: `1px solid ${borderColor}`, borderRadius: 1.4 }}>
                    <Typography sx={{ fontWeight: 900, color: mutedColor, fontSize: isPhone ? "0.38rem" : "0.5rem" }}>
                      {label}
                    </Typography>
                    <Typography sx={{ mt: 0.2, fontWeight: 850, color: textColor, fontSize: isPhone ? "0.5rem" : "0.64rem", wordBreak: "break-word" }}>
                      {String(value ?? "-")}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button variant="contained" onClick={() => setProblemDetailsOpen(false)} sx={{ bgcolor: primaryColor, fontWeight: 900 }}>إغلاق</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box></NavigationShell>
  );
}