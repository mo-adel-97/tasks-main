import * as uiLayout from '../components/common/uiLayout';
import './rtl-forms-fix.css';
import { DESKTOP_BREAKPOINT, navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  AppBar,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  GlobalStyles,
  IconButton,
  InputAdornment,
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
import { DataGrid } from "@mui/x-data-grid";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityIcon from "@mui/icons-material/Visibility";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import HistoryIcon from "@mui/icons-material/History";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import BlockIcon from "@mui/icons-material/Block";
import ReplayIcon from "@mui/icons-material/Replay";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import TuneIcon from "@mui/icons-material/Tune";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";


import SalesInvoiceDialog from "../components/SalesInvoiceDialog";
import StudentStatementDialog2 from "../components/StudentStatementDialog2";
import StudentOperationsDialog from "../components/StudentOperationsDialog";
import PaymentOrderDialog from "../components/PaymentOrderDialog";



const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5258";

const primaryColor = "#057546";
const primaryDark = "#034d31";
const accentColor = "#ae1e21";
const textColor = "#1f2d3d";

const fireSweetAlert = (options = {}) =>
  Swal.fire({
    direction: "rtl",
    reverseButtons: true,
    buttonsStyling: false,
    customClass: {
      popup: "sstli-swal-popup",
      title: "sstli-swal-title",
      htmlContainer: "sstli-swal-text",
      confirmButton: "sstli-swal-confirm",
      cancelButton: "sstli-swal-cancel",
      input: "sstli-swal-input"
    },
    didOpen: () => {
      const container = document.querySelector(".swal2-container");
      if (container) {
        container.style.zIndex = "20000";
      }

      const popup = document.querySelector(".sstli-swal-popup");
      if (popup) {
        popup.style.borderRadius = "18px";
        popup.style.fontFamily = "Tahoma, Arial, sans-serif";
      }

      const confirmButton = document.querySelector(".sstli-swal-confirm");
      if (confirmButton) {
        confirmButton.style.background = "#057546";
        confirmButton.style.color = "#fff";
        confirmButton.style.border = "0";
        confirmButton.style.borderRadius = "10px";
        confirmButton.style.padding = "10px 22px";
        confirmButton.style.margin = "0 5px";
        confirmButton.style.fontWeight = "900";
        confirmButton.style.cursor = "pointer";
      }

      const cancelButton = document.querySelector(".sstli-swal-cancel");
      if (cancelButton) {
        cancelButton.style.background = "#eef2f0";
        cancelButton.style.color = "#1f2d3d";
        cancelButton.style.border = "1px solid #d3ddd8";
        cancelButton.style.borderRadius = "10px";
        cancelButton.style.padding = "10px 22px";
        cancelButton.style.margin = "0 5px";
        cancelButton.style.fontWeight = "900";
        cancelButton.style.cursor = "pointer";
      }
    },
    ...options
  });


const currentUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const getUserGuid = (user) =>
  user?.userGuid || user?.guid || user?.Guid || user?.USER_GUID || user?.USER_GUID____ || "";

const today = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
};

const money = (value) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

// عرض مختصر للمبالغ داخل الجريد فقط:
// 500.00 => 500
// 500.50 => 500.5
// 1,250.75 => 1,250.75
const gridMoney = (value) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

const firstAndLastName = (value) => {
  const parts = String(value || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts[0] || "-";
  return `${parts[0]} ${parts[parts.length - 1]}`;
};

const formatDateTime = (value) => {
  if (!value) return "-";

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    return String(value);
  }

  // التاريخ فقط - ميلادي Gregorian - بدون وقت.
  return new Intl.DateTimeFormat("en-GB-u-ca-gregory", {
    calendar: "gregory",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(d);
};

const statusLabel = (row) => {
  if (row?.isUse === false) return "ملغي";
  const status = Number(row?.status ?? -1);
  if (status === 0) return row?.orderStatus || "غير مؤكد";
  if (status === 1) return row?.orderStatus || "مؤكد";
  if (status === 2) return row?.orderStatus || "مكرر";
  if (status === 3) return row?.orderStatus || "ملغي";
  return row?.orderStatus || "غير معروف";
};

const statusColor = (row) => {
  if (row?.isUse === false) return "error";
  const status = Number(row?.status ?? -1);
  if (status === 1) return "success";
  if (status === 2) return "warning";
  if (status === 3) return "error";
  return "default";
};

export default function PaymentRequestsReport() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(`(min-width:${DESKTOP_BREAKPOINT}px)`, { noSsr: true });
  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery("(min-width:600px) and (max-width:1599px)");

  const user = useMemo(() => currentUser(), []);
  const userGuid = useMemo(() => getUserGuid(user), [user]);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [fromDate, setFromDate] = useState(today());
  const [toDate, setToDate] = useState(today());
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // يمنع تداخل طلبات العرض لو المستخدم غيّر التاريخ بسرعة
  // أو ضغط "عرض" أكثر من مرة.
  const activeRequestRef = useRef(null);
  const requestSequenceRef = useRef(0);
  const initialLoadDoneRef = useRef(false);

  // =========================
  // الفلاتر المتقدمة
  // كل فلتر Multi Select ويمكن الجمع بين أكثر من فلتر في نفس الوقت.
  // =========================
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [branchFilter, setBranchFilter] = useState([]);
  const [documentFilter, setDocumentFilter] = useState([]);
  const [cashBoxFilter, setCashBoxFilter] = useState([]);
  const [statusFilter, setStatusFilter] = useState([]);
  const [createdByFilter, setCreatedByFilter] = useState([]);
  const [accountantFilter, setAccountantFilter] = useState([]);

  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuRow, setMenuRow] = useState(null);

  const [orderOpen, setOrderOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [statementOpen, setStatementOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [operationsOpen, setOperationsOpen] = useState(false);
  const [selectedOperationsStudent, setSelectedOperationsStudent] = useState(null);

  const loadData = useCallback(async () => {
    if (!userGuid) {
      setError("تعذر قراءة بيانات المستخدم. برجاء تسجيل الدخول مرة أخرى.");
      return;
    }

    if (!fromDate || !toDate) {
      setError("برجاء اختيار الفترة من وإلى");
      return;
    }

    // مقارنة YYYY-MM-DD كنص آمنة لأن الصيغة مرتبة سنة-شهر-يوم.
    if (fromDate > toDate) {
      setRows([]);
      setError("تاريخ البداية يجب أن يكون أقل من أو يساوي تاريخ النهاية");
      return;
    }

    // إلغاء أي طلب سابق مازال شغال.
    if (activeRequestRef.current) {
      activeRequestRef.current.abort();
    }

    const controller = new AbortController();
    activeRequestRef.current = controller;

    const requestId = ++requestSequenceRef.current;

    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        userGuid,
        fromDate,
        toDate
      });

      const response = await fetch(
        `${API_BASE_URL}/api/payment-requests?${params.toString()}`,
        {
          cache: "no-store",
          headers: { Accept: "application/json" },
          signal: controller.signal
        }
      );

      const result = await response.json().catch(() => null);

      // لو أثناء انتظار الرد بدأ Request أحدث، نهمل الرد القديم تمامًا.
      if (requestId !== requestSequenceRef.current) {
        return;
      }

      if (!response.ok) {
        throw new Error(
          result?.error ||
          result?.message ||
          "تعذر تحميل طلبات السداد"
        );
      }

      const serverRows =
        Array.isArray(result?.data)
          ? result.data
          : [];

      /*
       * حماية إضافية في الفرونت:
       * حتى لو Stored Procedure رجعت صفوف خارج الفترة،
       * لا نعرض إلا OrderDate داخل الفترة المختارة بالضبط.
       */
      const exactRows = serverRows.filter((row) => {
        const rawDate = String(row?.orderDate || "").trim();
        if (!rawDate) return false;

        const dateOnly = rawDate.slice(0, 10);

        return (
          dateOnly >= fromDate &&
          dateOnly <= toDate
        );
      });

      setRows(exactRows);
    } catch (e) {
      if (e?.name === "AbortError") {
        return;
      }

      if (requestId !== requestSequenceRef.current) {
        return;
      }

      setRows([]);
      setError(
        e?.message ||
        "حدث خطأ أثناء تحميل طلبات السداد"
      );
    } finally {
      if (requestId === requestSequenceRef.current) {
        setLoading(false);

        if (activeRequestRef.current === controller) {
          activeRequestRef.current = null;
        }
      }
    }
  }, [userGuid, fromDate, toDate]);

  /*
   * تحميل أول مرة فقط.
   * سابقًا useEffect كان يعيد loadData تلقائيًا مع كل تغيير في
   * fromDate / toDate لأن loadData نفسها تتغير، وده كان يعمل
   * Requests متداخلة وقد يصل رد قديم بعد الرد الجديد فيظهر تاريخ غلط.
   *
   * بعد التعديل:
   * - أول فتح للشاشة: تحميل مرة واحدة.
   * - تغيير من/إلى: لا يرسل Request تلقائي.
   * - المستخدم يضغط "عرض" => Request واحد للفترة الحالية.
   */
  useEffect(() => {
    if (initialLoadDoneRef.current) {
      return;
    }

    initialLoadDoneRef.current = true;
    loadData();
  }, [loadData]);

  // عند مغادرة الشاشة نلغي أي fetch مازال شغال.
  useEffect(() => {
    return () => {
      if (activeRequestRef.current) {
        activeRequestRef.current.abort();
      }
    };
  }, []);

  const handlePaymentOrderUpdated =
    useCallback(async () => {
      // لو فيه فلتر على البنك القديم أو بحث باسمه،
      // الصف سيختفي من filteredRows بعد تغيير البنك.
      setSearch("");
      setCashBoxFilter([]);
      await loadData();
    }, [loadData]);

  const uniqueOptions = useCallback(
    (fieldGetter) =>
      Array.from(
        new Set(
          rows
            .map(fieldGetter)
            .map((value) => String(value ?? "").trim())
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b, "ar")),
    [rows]
  );

  const filterOptions = useMemo(
    () => ({
      branches: uniqueOptions((row) => row.branchName),
      documents: uniqueOptions((row) => row.documentName),
      cashBoxes: uniqueOptions((row) => row.cashBoxName),
      statuses: uniqueOptions((row) => statusLabel(row)),
      createdBy: uniqueOptions((row) => row.createdBy),
      accountants: uniqueOptions((row) => row.accountantName)
    }),
    [rows, uniqueOptions]
  );

  const activeAdvancedFiltersCount = useMemo(
    () =>
      branchFilter.length +
      documentFilter.length +
      cashBoxFilter.length +
      statusFilter.length +
      createdByFilter.length +
      accountantFilter.length,
    [
      branchFilter,
      documentFilter,
      cashBoxFilter,
      statusFilter,
      createdByFilter,
      accountantFilter
    ]
  );

  const clearAdvancedFilters = () => {
    setBranchFilter([]);
    setDocumentFilter([]);
    setCashBoxFilter([]);
    setStatusFilter([]);
    setCreatedByFilter([]);
    setAccountantFilter([]);
  };

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();

    return rows.filter((row) => {
      // البحث العام
      const matchesSearch =
        !q ||
        [
          row.code,
          row.studentName,
          row.nationalId,
          row.documentName,
          row.branchName,
          row.cashBoxName,
          row.referenceNumber,
          row.createdBy,
          row.accountantName,
          row.billCode,
          statusLabel(row)
        ].some((value) =>
          String(value ?? "").toLowerCase().includes(q)
        );

      if (!matchesSearch) return false;

      // كل مجموعة Multi Select تعمل OR داخل نفسها.
      // والمجموعات المختلفة تعمل AND مع بعضها.
      if (
        branchFilter.length &&
        !branchFilter.includes(String(row.branchName ?? "").trim())
      ) {
        return false;
      }

      if (
        documentFilter.length &&
        !documentFilter.includes(String(row.documentName ?? "").trim())
      ) {
        return false;
      }

      if (
        cashBoxFilter.length &&
        !cashBoxFilter.includes(String(row.cashBoxName ?? "").trim())
      ) {
        return false;
      }

      if (
        statusFilter.length &&
        !statusFilter.includes(statusLabel(row))
      ) {
        return false;
      }

      if (
        createdByFilter.length &&
        !createdByFilter.includes(String(row.createdBy ?? "").trim())
      ) {
        return false;
      }

      if (
        accountantFilter.length &&
        !accountantFilter.includes(String(row.accountantName ?? "").trim())
      ) {
        return false;
      }

      return true;
    });
  }, [
    rows,
    search,
    branchFilter,
    documentFilter,
    cashBoxFilter,
    statusFilter,
    createdByFilter,
    accountantFilter
  ]);

  const cashBoxOptions = useMemo(() => {
    const map = new Map();

    rows.forEach((row) => {
      const cashBoxGuid = String(row?.cashBoxGuid || "").trim();
      const cashBoxName = String(row?.cashBoxName || "").trim();
      const costCenterGuid = String(row?.costCenterGuid || "").trim();

      if (!cashBoxGuid || !cashBoxName) return;

      if (!map.has(cashBoxGuid)) {
        map.set(cashBoxGuid, {
          cashBoxGuid,
          cashBoxName,
          costCenterGuid
        });
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.cashBoxName.localeCompare(b.cashBoxName, "ar")
    );
  }, [rows]);

  const totals = useMemo(() => {
    return filteredRows.reduce(
      (acc, row) => {
        acc.total += Number(row.orderTotal || 0);
        acc.tax += Number(row.orderTax || 0);
        acc.subTotal += Number(row.orderSubTotal || 0);
        return acc;
      },
      { total: 0, tax: 0, subTotal: 0 }
    );
  }, [filteredRows]);

  const openRequest = (row) => {
    setSelectedOrder(row);
    setOrderOpen(true);
    setMenuAnchor(null);
  };

  const openInvoice = async (row) => {
    const billGuid = row?.billGuid || row?.BillGuid || "";
    if (!billGuid) {
      await fireSweetAlert({
        icon: "warning",
        title: "تنبيه",
        text: "يجب تأكيد التحويل أولاً لتتمكن من عرض الفاتورة",
        confirmButtonText: "حسنًا"
      });
      return;
    }
    setSelectedInvoice({ ...row, billGuid });
    setInvoiceOpen(true);
    setMenuAnchor(null);
  };

  const openStatement = (row) => {
    setSelectedStudent({
      accountGuid: row?.accountGuid || row?.AccountGuid || "",
      studentName: row?.studentName || row?.StudentName || "",
      nationalId: row?.nationalId || row?.NationalId || ""
    });
    setStatementOpen(true);
    setMenuAnchor(null);
  };

  const openOperations = (row) => {
    setSelectedOperationsStudent({
      actionHistoryGuid: row?.orderGuid || row?.guid || "",
      accountGuid: row?.accountGuid || "",
      studentName: row?.studentName || "",
      nationalId: row?.nationalId || ""
    });
    setOperationsOpen(true);
    setMenuAnchor(null);
  };

  const openAttachment = async (row) => {
    if (!row?.nationalId || !row?.code) {
      await fireSweetAlert({
        icon: "warning",
        title: "بيانات ناقصة",
        text: "رقم الهوية أو كود الطلب غير موجود",
        confirmButtonText: "حسنًا"
      });
      return;
    }
    const url = `https://sstli.com/arc/api/view.php?nationalId=${encodeURIComponent(row.nationalId)}&billCode=${encodeURIComponent(row.code)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setMenuAnchor(null);
  };

  const copyToClipboard = async (value, successMessage = "تم النسخ") => {
    const text = String(value ?? "").trim();

    if (!text) {
      await fireSweetAlert({
        icon: "info",
        title: "لا يوجد رقم للنسخ",
        confirmButtonText: "حسنًا"
      });
      return false;
    }

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      }

      await fireSweetAlert({
        icon: "success",
        title: successMessage,
        text,
        timer: 1200,
        showConfirmButton: false
      });

      return true;
    } catch {
      await fireSweetAlert({
        icon: "error",
        title: "تعذر النسخ",
        text: "يمكنك تحديد الرقم ونسخه يدويًا.",
        confirmButtonText: "حسنًا"
      });

      return false;
    }
  };

  const confirmRow = async (row) => {
    if (Number(row?.status) !== 0 || row?.isUse === false) {
      await fireSweetAlert({
        icon: "warning",
        title: "لا يمكن التأكيد",
        text: "هذا الطلب لا يمكن تأكيده في حالته الحالية",
        confirmButtonText: "حسنًا"
      });
      return;
    }

    const confirmation = await fireSweetAlert({
      icon: "question",
      title: "تأكيد التحويل",
      html: `
        <div style="direction:rtl;text-align:center;line-height:1.9">
          هل تريد تأكيد طلب السداد رقم
          <b style="color:#057546">${row.code}</b>؟
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "نعم، تأكيد",
      cancelButtonText: "إلغاء",
      focusCancel: true
    });

    if (!confirmation.isConfirmed) return;

    try {
      setLoading(true);
      setError("");

      fireSweetAlert({
        title: "جاري تأكيد التحويل...",
        html: "جاري التحقق من العمليات المحاسبية ثم إنشاء الفاتورة والقيد...",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          const container = document.querySelector(".swal2-container");
          if (container) container.style.zIndex = "20000";
          Swal.showLoading();
        }
      });

      const response = await fetch(
        `${API_BASE_URL}/api/payment-requests/${encodeURIComponent(row.orderGuid)}/confirm`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userGuid })
        }
      );

      const result = await response.json().catch(() => null);

      Swal.close();

      if (!response.ok) {
        if (
          response.status === 409 &&
          (result?.busy || result?.code === "ACCOUNTING_BUSY")
        ) {
          await fireSweetAlert({
            icon: "info",
            title: "جاري تنفيذ قيد آخر",
            html: `
              <div style="direction:rtl;line-height:1.9;text-align:center">
                ${result?.message || "يوجد ترحيل محاسبي آخر يتم تنفيذه حاليًا."}
                <br/>
                <small style="color:#666">
                  لم يبدأ تأكيد طلب السداد ولم يتم إنشاء أي فاتورة أو قيد.
                </small>
              </div>
            `,
            confirmButtonText: "حسنًا"
          });
          return;
        }

        throw new Error(
          result?.error ||
          result?.message ||
          "تعذر تأكيد التحويل"
        );
      }

      const confirmedBillCode =
        result?.data?.billCode || "";

      await fireSweetAlert({
        icon: result?.warning ? "warning" : "success",
        title: result?.warning ? "تم التأكيد مع تنبيه" : "تم بنجاح",
        html: `
          <div style="direction:rtl;line-height:1.9;text-align:center">
            ${result?.message || "تم تأكيد التحويل بنجاح"}

            ${
              confirmedBillCode
                ? `
                  <div
                    style="
                      margin:14px auto 4px;
                      padding:10px 12px;
                      max-width:300px;
                      border:1px solid #cfe1d8;
                      border-radius:10px;
                      background:#f7fbf9;
                    "
                  >
                    <div style="font-size:12px;color:#66756e">
                      رقم الفاتورة
                    </div>

                    <div
                      id="confirmed-bill-code"
                      style="
                        font-size:22px;
                        font-weight:1000;
                        color:#057546;
                        direction:ltr;
                      "
                    >
                      ${confirmedBillCode}
                    </div>

                    <button
                      type="button"
                      id="copy-confirmed-bill-code"
                      style="
                        margin-top:8px;
                        border:1px solid #057546;
                        background:#fff;
                        color:#057546;
                        border-radius:8px;
                        padding:6px 14px;
                        cursor:pointer;
                        font-weight:900;
                      "
                    >
                      نسخ رقم الفاتورة
                    </button>
                  </div>
                `
                : ""
            }

            ${
              result?.warning
                ? `<br/><small style="color:#a15c00">${result.warning}</small>`
                : ""
            }
          </div>
        `,
        confirmButtonText: "حسنًا",
        didOpen: () => {
          const container =
            document.querySelector(".swal2-container");

          if (container) {
            container.style.zIndex = "20000";
          }

          const copyButton =
            document.getElementById(
              "copy-confirmed-bill-code"
            );

          if (copyButton && confirmedBillCode) {
            copyButton.onclick = async () => {
              try {
                await navigator.clipboard.writeText(
                  String(confirmedBillCode)
                );

                copyButton.textContent = "تم النسخ ✓";
                copyButton.style.background = "#057546";
                copyButton.style.color = "#fff";
              } catch {
                copyButton.textContent =
                  "حدد الرقم وانسخه يدويًا";
              }
            };
          }
        }
      });

      await loadData();
    } catch (e) {
      Swal.close();

      const message =
        e?.message ||
        "فشل تأكيد التحويل وتم التراجع عن جميع العمليات";

      setError(message);

      await fireSweetAlert({
        icon: "error",
        title: "فشل تأكيد التحويل",
        text: message,
        confirmButtonText: "حسنًا"
      });
    } finally {
      setLoading(false);
      setMenuAnchor(null);
    }
  };

  const changeOrderStatus = async (row) => {
    /*
     * السبب الحقيقي لمشكلة عدم الكتابة:
     * MUI Menu كان يظل مفتوحًا أثناء فتح SweetAlert،
     * والـ Menu/Popover يعيد الـ focus لنفسه، فيمنع textarea
     * داخل SweetAlert من استقبال الماوس والكيبورد.
     *
     * لذلك لازم نقفل الـ Menu أولًا وننتظر انتهاء transition
     * قبل فتح أي SweetAlert به input.
     */
    setMenuAnchor(null);
    setMenuRow(null);

    // نسمح لـ MUI Menu/Popover أن يعمل unmount كامل.
    await new Promise((resolve) => setTimeout(resolve, 250));

    if (Number(row?.status) !== 0) {
      await fireSweetAlert({
        icon: "warning",
        title: "لا يمكن تغيير الحالة",
        text: "يمكن تغيير حالة الطلب فقط عندما تكون حالته غير مؤكدة.",
        confirmButtonText: "حسنًا"
      });
      return;
    }

    // =====================================================
    // الخطوة 1: اختيار الحالة
    // =====================================================
    const statusResult = await Swal.fire({
      direction: "rtl",
      icon: "question",
      title: "تغيير حالة التحويل",

      html: `
        <div style="
          direction:rtl;
          text-align:center;
          font-weight:900;
          color:#31473d;
          margin-bottom:8px;
        ">
          الطلب رقم ${row.code}
        </div>
      `,

      input: "select",
      inputOptions: {
        2: "مكرر",
        3: "ملغي"
      },
      inputPlaceholder: "اختر الحالة الجديدة",

      showCancelButton: true,
      confirmButtonText: "التالي",
      cancelButtonText: "رجوع",

      reverseButtons: true,
      buttonsStyling: false,
      focusConfirm: false,
      focusCancel: false,
      returnFocus: false,

      customClass: {
        popup: "sstli-swal-popup",
        title: "sstli-swal-title",
        htmlContainer: "sstli-swal-text",
        confirmButton: "sstli-swal-confirm",
        cancelButton: "sstli-swal-cancel",
        input: "sstli-swal-input"
      },

      inputValidator: (value) => {
        if (!value) {
          return "برجاء اختيار الحالة الجديدة";
        }

        return undefined;
      },

      didOpen: () => {
        const container =
          document.querySelector(".swal2-container");

        if (container) {
          container.style.zIndex = "2147483647";
          container.style.pointerEvents = "auto";
        }

        const popup = Swal.getPopup();

        if (popup) {
          popup.style.pointerEvents = "auto";
          popup.style.borderRadius = "18px";
          popup.style.fontFamily =
            "Tahoma, Arial, sans-serif";
        }

        const input = Swal.getInput();

        if (input) {
          input.style.direction = "rtl";
          input.style.textAlign = "right";
          input.style.height = "44px";
          input.style.fontFamily =
            "Tahoma, Arial, sans-serif";
          input.style.pointerEvents = "auto";
        }

        const actions =
          popup?.querySelector(".swal2-actions");

        if (actions) {
          actions.style.display = "flex";
          actions.style.gap = "24px";
          actions.style.marginTop = "22px";
        }

        const confirmButton =
          Swal.getConfirmButton();

        const cancelButton =
          Swal.getCancelButton();

        if (confirmButton) {
          confirmButton.style.background = "#057546";
          confirmButton.style.color = "#fff";
          confirmButton.style.border = "0";
          confirmButton.style.borderRadius = "10px";
          confirmButton.style.padding = "10px 24px";
          confirmButton.style.fontWeight = "900";
          confirmButton.style.cursor = "pointer";
        }

        if (cancelButton) {
          cancelButton.style.background = "#eef2f0";
          cancelButton.style.color = "#1f2d3d";
          cancelButton.style.border =
            "1px solid #d3ddd8";
          cancelButton.style.borderRadius = "10px";
          cancelButton.style.padding = "10px 24px";
          cancelButton.style.fontWeight = "900";
          cancelButton.style.cursor = "pointer";
        }
      }
    });

    if (!statusResult.isConfirmed) {
      return;
    }

    const newStatus =
      Number(statusResult.value);

    // =====================================================
    // الخطوة 2: كتابة السبب
    // SweetAlert نفسه ينشئ الـ textarea، وليس HTML يدوي.
    // =====================================================
    const reasonResult = await Swal.fire({
      direction: "rtl",
      icon: newStatus === 2 ? "warning" : "question",

      title:
        newStatus === 2
          ? "تحويل الطلب إلى مكرر"
          : "إلغاء طلب السداد",

      html: `
        <div style="
          direction:rtl;
          text-align:center;
          line-height:1.9;
        ">
          الطلب رقم
          <b style="color:#057546">
            ${row.code}
          </b>
          <br/>
          الحالة الجديدة:
          <b style="color:#ae1e21">
            ${newStatus === 2 ? "مكرر" : "ملغي"}
          </b>
        </div>
      `,

      input: "textarea",
      inputLabel: "سبب تغيير الحالة",
      inputPlaceholder:
        "اكتب سبب تغيير الحالة هنا...",

      inputAttributes: {
        dir: "rtl",
        rows: "5",
        autocomplete: "off",
        autocorrect: "off",
        spellcheck: "false"
      },

      showCancelButton: true,
      confirmButtonText: "حفظ التغيير",
      cancelButtonText: "رجوع",

      reverseButtons: true,
      buttonsStyling: false,

      /*
       * مهم جدًا:
       * لا نرجع الـ focus للـ Menu القديم بعد إغلاق SweetAlert.
       */
      returnFocus: false,
      focusConfirm: false,
      focusCancel: false,

      customClass: {
        popup: "sstli-swal-popup",
        title: "sstli-swal-title",
        htmlContainer: "sstli-swal-text",
        confirmButton: "sstli-swal-confirm",
        cancelButton: "sstli-swal-cancel",
        input: "sstli-swal-input"
      },

      inputValidator: (value) => {
        const reason =
          String(value || "").trim();

        if (!reason) {
          return "برجاء كتابة سبب تغيير الحالة";
        }

        return undefined;
      },

      didOpen: () => {
        const container =
          document.querySelector(".swal2-container");

        if (container) {
          /*
           * أعلى من MUI Menu / Drawer / Dialog / Backdrop.
           */
          container.style.zIndex = "2147483647";
          container.style.pointerEvents = "auto";
        }

        const popup =
          Swal.getPopup();

        if (popup) {
          popup.style.pointerEvents = "auto";
          popup.style.borderRadius = "18px";
          popup.style.fontFamily =
            "Tahoma, Arial, sans-serif";
        }

        const input =
          Swal.getInput();

        if (input) {
          input.removeAttribute("readonly");
          input.removeAttribute("disabled");

          input.style.direction = "rtl";
          input.style.textAlign = "right";
          input.style.minHeight = "145px";
          input.style.padding = "12px";
          input.style.fontSize = "15px";
          input.style.lineHeight = "1.8";
          input.style.fontFamily =
            "Tahoma, Arial, sans-serif";
          input.style.background = "#fff";
          input.style.color = "#222";
          input.style.pointerEvents = "auto";
          input.style.userSelect = "text";
          input.style.webkitUserSelect = "text";
          input.style.cursor = "text";
          input.style.position = "relative";
          input.style.zIndex = "2";

          /*
           * نخلي click على الـ textarea نفسه يرجع له الـ focus
           * حتى لو فيه أي listener خارجي في الصفحة.
           */
          input.addEventListener(
            "mousedown",
            (event) => {
              event.stopPropagation();
            }
          );

          input.addEventListener(
            "click",
            (event) => {
              event.stopPropagation();
              input.focus();
            }
          );

          /*
           * منع Hotkeys/Handlers في الصفحة من اعتراض الكتابة.
           */
          ["keydown", "keyup", "keypress", "input"].forEach(
            (eventName) => {
              input.addEventListener(
                eventName,
                (event) => {
                  event.stopPropagation();
                }
              );
            }
          );

          setTimeout(() => {
            input.focus();
            input.click();
          }, 100);
        }

        const actions =
          popup?.querySelector(".swal2-actions");

        if (actions) {
          actions.style.display = "flex";
          actions.style.gap = "28px";
          actions.style.marginTop = "24px";
        }

        const confirmButton =
          Swal.getConfirmButton();

        const cancelButton =
          Swal.getCancelButton();

        if (confirmButton) {
          confirmButton.style.background = "#057546";
          confirmButton.style.color = "#fff";
          confirmButton.style.border = "0";
          confirmButton.style.borderRadius = "10px";
          confirmButton.style.padding = "10px 24px";
          confirmButton.style.fontWeight = "900";
          confirmButton.style.cursor = "pointer";
        }

        if (cancelButton) {
          cancelButton.style.background = "#eef2f0";
          cancelButton.style.color = "#1f2d3d";
          cancelButton.style.border =
            "1px solid #d3ddd8";
          cancelButton.style.borderRadius = "10px";
          cancelButton.style.padding = "10px 24px";
          cancelButton.style.fontWeight = "900";
          cancelButton.style.cursor = "pointer";
        }
      }
    });

    if (!reasonResult.isConfirmed) {
      return;
    }

    const reason =
      String(reasonResult.value || "").trim();

    const isCancelled =
      newStatus === 3;

    // =====================================================
    // الخطوة 3: الحفظ
    // =====================================================
    try {
      setLoading(true);
      setError("");

      fireSweetAlert({
        title:
          newStatus === 2
            ? "جاري تحويل الطلب إلى مكرر..."
            : "جاري إلغاء الطلب...",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          const container =
            document.querySelector(
              ".swal2-container"
            );

          if (container) {
            container.style.zIndex =
              "2147483647";
          }

          Swal.showLoading();
        }
      });

      const response = await fetch(
        `${API_BASE_URL}/api/payment-requests/${encodeURIComponent(
          row.orderGuid
        )}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            userGuid,
            status: newStatus,
            isUse: !isCancelled,
            reason
          })
        }
      );

      const result =
        await response
          .json()
          .catch(() => null);

      Swal.close();

      if (!response.ok) {
        throw new Error(
          result?.error ||
          result?.message ||
          "تعذر تغيير حالة الطلب"
        );
      }

      await fireSweetAlert({
        icon: "success",
        title: "تم تغيير الحالة",
        html: `
          <div style="direction:rtl;line-height:1.9">
            ${
              result?.message ||
              (newStatus === 2
                ? "تم تحويل الطلب إلى مكرر بنجاح"
                : "تم إلغاء الطلب بنجاح")
            }
            <br/>
            <small style="color:#666">
              تم حفظ سبب تغيير الحالة بنجاح.
            </small>
          </div>
        `,
        confirmButtonText: "حسنًا"
      });

      await loadData();
    } catch (e) {
      Swal.close();

      const message =
        e?.message ||
        "تعذر تغيير حالة الطلب";

      setError(message);

      await fireSweetAlert({
        icon: "error",
        title: "تعذر تغيير الحالة",
        text: message,
        confirmButtonText: "حسنًا"
      });
    } finally {
      setLoading(false);
      setMenuAnchor(null);
      setMenuRow(null);
    }
  };

  const exportExcel = () => {
    if (!filteredRows.length) {
      fireSweetAlert({
        icon: "info",
        title: "لا توجد بيانات",
        text: "لا توجد بيانات لتصديرها",
        confirmButtonText: "حسنًا"
      });
      return;
    }

    const headers = [
      "كود", "التاريخ", "المستند", "الفرع", "اسم الطالب", "رقم الهوية",
      "الإجمالي", "الضريبة", "الصافي", "الخزينة/البنك", "رقم المرجع",
      "تاريخ الحوالة", "مدخل البيانات", "حالة التحويل", "المحاسب", "كود الفاتورة"
    ];

    const csvRows = filteredRows.map((row) => [
      row.code,
      formatDateTime(row.orderDate),
      row.documentName,
      row.branchName,
      row.studentName,
      row.nationalId,
      row.orderTotal,
      row.orderTax,
      row.orderSubTotal,
      row.cashBoxName,
      row.referenceNumber,
      formatDateTime(row.paymentDate),
      row.createdBy,
      statusLabel(row),
      row.accountantName,
      row.billCode
    ]);

    const escapeCsv = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const csv = "\uFEFF" + [headers, ...csvRows].map((r) => r.map(escapeCsv).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `طلبات_السداد_${fromDate}_${toDate}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const columns = useMemo(() => [
    {
      field: "actions",
      headerName: isPhone ? "عرض" : "إجراءات",
      flex: isPhone ? 0 : 0.72,
      width: isPhone ? 40 : undefined,
      minWidth: isPhone ? 40 : 64,
      maxWidth: isPhone ? 40 : 84,
      sortable: false,
      filterable: false,
      align: "center",
      headerAlign: "center",
      renderCell: ({ row }) => (
        <Stack
          direction="row"
          spacing={0}
          sx={{
            width: "100%",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <Tooltip title="عرض الطلب">
            <IconButton
              size="small"
              onClick={() => openRequest(row)}
              sx={{
                color: primaryColor,
                p: isPhone ? 0.25 : 0.45
              }}
            >
              <VisibilityIcon sx={{ fontSize: isPhone ? 15 : 18 }} />
            </IconButton>
          </Tooltip>

          {!isPhone && (
            <IconButton
              size="small"
              onClick={(e) => {
                setMenuAnchor(e.currentTarget);
                setMenuRow(row);
              }}
              sx={{ p: 0.45 }}
            >
              <MoreVertIcon sx={{ fontSize: 18 }} />
            </IconButton>
          )}
        </Stack>
      )
    },

    {
      field: "code",
      headerName: "كود",
      flex: isPhone ? 0 : 0.48,
      width: isPhone ? 48 : undefined,
      minWidth: isPhone ? 48 : 54,
      maxWidth: isPhone ? 48 : 68,
      align: "center",
      headerAlign: "center"
    },

    {
      field: "orderDate",
      headerName: "التاريخ",
      flex: isPhone ? 0 : 0.86,
      width: isPhone ? 88 : undefined,
      minWidth: isPhone ? 88 : 92,
      maxWidth: isPhone ? 88 : 108,
      align: "center",
      headerAlign: "center",
      cellClassName: "date-cell",
      valueFormatter: (value) =>
        formatDateTime(value?.value ?? value)
    },

    {
      field: "documentName",
      headerName: "المستند",
      flex: 1.55,
      minWidth: 130,
      align: "center",
      headerAlign: "center"
    },

    {
      field: "branchName",
      headerName: "الفرع",
      flex: 1.8,
      minWidth: 180,
      align: "center",
      headerAlign: "center",
      renderCell: ({ value }) => (
        <Tooltip title={String(value || "")}>
          <Typography
            component="div"
            sx={{
              width: "100%",
              textAlign: "center",
              fontWeight: 750,
              fontSize: { xs: "0.75rem", sm: "0.75rem", md: "0.75rem" },
              lineHeight: 1.25,
              whiteSpace: "normal",
              overflow: "visible",
              textOverflow: "clip",
              wordBreak: "normal"
            }}
          >
            {isPhone ? firstAndLastName(value) : value || "-"}
          </Typography>
        </Tooltip>
      )
    },

    {
      field: "studentName",
      headerName: "اسم الطالب",
      flex: isPhone ? 1 : 1.75,
      minWidth: isPhone ? 118 : 175,
      align: "center",
      headerAlign: "center",
      renderCell: ({ value }) => (
        <Tooltip title={String(value || "")}>
          <Typography
            component="div"
            sx={{
              width: "100%",
              textAlign: "center",
              fontWeight: 850,
              fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : "0.75rem",
              lineHeight: 1.25,
              whiteSpace: "normal",
              overflow: "visible",
              textOverflow: "clip",
              wordBreak: "normal"
            }}
          >
            {value || "-"}
          </Typography>
        </Tooltip>
      )
    },

    {
      field: "nationalId",
      headerName: "رقم الهوية",
      flex: 0.95,
      minWidth: 95,
      align: "center",
      headerAlign: "center"
    },

 {
  field: "orderTotal",
  headerName: "الإجمالي",
  flex: 0.72,
  minWidth: 78,
  maxWidth: 95,
  align: "center",
  headerAlign: "center",
  cellClassName: "amount-cell",
  valueFormatter: (value) =>
    gridMoney(value?.value ?? value)
},

{
  field: "orderTax",
  headerName: "الضريبة",
  flex: 0.68,
  minWidth: 72,
  maxWidth: 90,
  align: "center",
  headerAlign: "center",
  cellClassName: "amount-cell",
  valueFormatter: (value) =>
    gridMoney(value?.value ?? value)
},

{
  field: "orderSubTotal",
  headerName: "الصافي",
  flex: 0.72,
  minWidth: 78,
  maxWidth: 95,
  align: "center",
  headerAlign: "center",
  cellClassName: "amount-cell",
  valueFormatter: (value) =>
    gridMoney(value?.value ?? value)
},

    {
      field: "cashBoxName",
      headerName: "الخزينة/البنك",
      flex: 0.95,
      minWidth: 92,
      maxWidth: 125,
      align: "center",
      headerAlign: "center"
    },

    {
      field: "referenceNumber",
      headerName: "رقم المرجع",
      flex: 0.9,
      minWidth: 86,
      align: "center",
      headerAlign: "center"
    },

    {
      field: "paymentDate",
      headerName: "تاريخ الحوالة",
      flex: 0.88,
      minWidth: 92,
      maxWidth: 108,
      align: "center",
      headerAlign: "center",
      cellClassName: "date-cell",
      valueFormatter: (value) =>
        formatDateTime(value?.value ?? value)
    },

    {
      field: "createdBy",
      headerName: "مدخل البيانات",
      flex: 0.78,
      minWidth: 78,
      maxWidth: 105,
      align: "center",
      headerAlign: "center"
    },

    {
      field: "orderStatus",
      headerName: "حالة التحويل",
      flex: 0.95,
      minWidth: 92,
      align: "center",
      headerAlign: "center",
      renderCell: ({ row }) => (
        <Chip
          size="small"
          label={statusLabel(row)}
          color={statusColor(row)}
          variant={Number(row.status) === 1 ? "filled" : "outlined"}
          sx={{
            fontWeight: 900,
            height: isPhone ? 18 : isTablet ? 22 : 24,
            fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : "0.75rem",
            "& .MuiChip-label": {
              px: isPhone ? 0.35 : 0.7
            }
          }}
        />
      )
    },

    {
      field: "accountantName",
      headerName: "المحاسب",
      flex: 0.9,
      minWidth: 86,
      align: "center",
      headerAlign: "center"
    },

    {
      field: "billCode",
      headerName: "كود الفاتورة",
      flex: 0.75,
      minWidth: 78,
      align: "center",
      headerAlign: "center",
      sortable: true,
      renderCell: ({ value }) => {
        const billCode = String(value || "").trim();

        if (!billCode) return "-";

        return (
          <Tooltip title="اضغط لنسخ رقم الفاتورة">
            <Button
              size="small"
              variant="text"
              onClick={(event) => {
                event.stopPropagation();
                copyToClipboard(
                  billCode,
                  "تم نسخ رقم الفاتورة"
                );
              }}
              sx={uiLayout.withUiSx({
                minWidth: 0,
                px: 0.5,
                fontWeight: 950,
                fontSize: { xs: "0.75rem", sm: "0.75rem" },
                color: primaryColor
              }, uiLayout.buttonSx)}
            >
              {billCode}
            </Button>
          </Tooltip>
        );
      }
    }
  ], [isPhone, isTablet, copyToClipboard]);

  const compactColumns = useMemo(() => {
    const fields = isPhone
      ? ["studentName", "nationalId", "orderSubTotal", "orderStatus"]
      : ["studentName", "nationalId", "branchName", "documentName", "orderSubTotal", "orderStatus"];

    const selected = fields
      .map((field) => columns.find((column) => column.field === field))
      .filter(Boolean)
      .map((column) => ({
        ...column,
        width: undefined,
        maxWidth: undefined,
        minWidth: 0,
        resizable: false,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        align: "center",
        headerAlign: "center",
        flex:
          column.field === "studentName"
            ? 1.45
            : column.field === "branchName" || column.field === "documentName"
              ? 1.2
              : 1
      }));

    return [
      ...selected,
      {
        field: "__mobileActions",
        headerName: "",
        width: isPhone ? 34 : 42,
        minWidth: isPhone ? 34 : 42,
        maxWidth: isPhone ? 34 : 42,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => (
          <IconButton
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              openRequest(row);
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
            <VisibilityIcon sx={{ fontSize: isPhone ? 14 : 17 }} />
          </IconButton>
        )
      }
    ];
  }, [columns, isPhone]);

  const desktopResizableColumns = useMemo(() => {
  return columns.map((column) => ({
    ...column,

    // كل أعمدة الديسكتوب قابلة للشد بالماوس
    resizable: true,

    // مهم جدًا:
    // نلغي الحد الأقصى الموجود في بعض الأعمدة
    // حتى تقدر توسع العمود براحتك
    maxWidth: undefined,
  }));
}, [columns]);
  /*
   * مهم:
   * الـ DataGrid يعمل Horizontal Scroll عندما يكون مجموع أقل عروض الأعمدة
   * أكبر من مساحة الجريد. لذلك نخفي الأعمدة الثانوية حسب حجم الشاشة
   * بدل إجبار المستخدم على السحب يمين/يسار.
   */
  const columnVisibilityModel = useMemo(() => {
    // الموبايل: أهم بيانات القرار فقط، وكل التفاصيل موجودة في "عرض الطلب".
    if (isPhone) {
      return {
        // الموبايل: 4 أعمدة فقط حتى لا يحصل قص أو سكرول أفقي.
        documentName: false,
        branchName: false,
        nationalId: false,
        orderTotal: false,
        orderTax: false,
        orderSubTotal: false,
        cashBoxName: false,
        referenceNumber: false,
        paymentDate: false,
        createdBy: false,
        orderStatus: false,
        accountantName: false,
        billCode: false
      };
    }

    // التابلت: نظهر بيانات أكثر بدون إجبار المستخدم على سكرول أفقي.
    if (isTablet) {
      return {
        nationalId: false,
        orderTax: false,
        referenceNumber: false,
        paymentDate: false,
        createdBy: false,
        accountantName: false,
        billCode: false
      };
    }

    return {};
  }, [isPhone, isTablet]);

  const AdvancedMultiSelect = ({
    label,
    options,
    value,
    onChange,
    placeholder
  }) => (
    <Autocomplete
      multiple
      disableCloseOnSelect
      options={options}
      value={value}
      onChange={(_, newValue) => onChange(newValue)}
      limitTags={isPhone ? 1 : 2}
      noOptionsText="لا توجد خيارات"
      ListboxProps={{
        sx: {
          p: { xs: 0.25, sm: 0.5 },
          maxHeight: { xs: 190, sm: 240 },
          "& .MuiAutocomplete-option": {
            minHeight: { xs: 28, sm: 34 },
            py: { xs: 0.35, sm: 0.55 },
            px: { xs: 0.7, sm: 1 },
            fontSize: { xs: "0.58rem", sm: "0.72rem" },
            lineHeight: 1.35,
            whiteSpace: "normal"
          }
        }
      }}
      componentsProps={{
        paper: {
          sx: {
            mt: 0.35,
            borderRadius: 1.5,
            boxShadow: "0 8px 24px rgba(0,0,0,.14)",
            fontSize: { xs: "0.58rem", sm: "0.72rem" },
            maxWidth: { xs: 190, sm: 320 }
          }
        },
        popper: {
          sx: {
            zIndex: 16000,
            "& .MuiAutocomplete-paper": {
              minWidth: { xs: "150px !important", sm: "220px !important" }
            }
          }
        }
      }}
      renderTags={(selected, getTagProps) =>
        selected.map((option, index) => (
          <Chip
            {...getTagProps({ index })}
            key={`${label}-${option}`}
            label={option}
            size="small"
            sx={{
              height: { xs: 19, sm: 22 },
              maxWidth: { xs: 92, sm: 150 },
              fontWeight: 800,
              fontSize: { xs: "0.75rem", sm: "0.75rem" },
              "& .MuiChip-label": {
                overflow: "hidden",
                textOverflow: "ellipsis"
              }
            }}
          />
        ))
      }
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          label={label}
          placeholder={value.length ? "" : placeholder}
          InputLabelProps={{ shrink: true }}
          sx={uiLayout.withUiSx({
            "& .MuiInputBase-root": {
              minHeight: { xs: 31, sm: 39 },
              py: "0px !important",
              px: { xs: 0.15, sm: 0.5 },
              bgcolor: "#fff"
            },
            "& .MuiInputLabel-root": {
              fontWeight: 850,
              fontSize: { xs: "0.75rem", sm: "0.75rem" }
            },
            "& .MuiInputBase-input": {
              fontSize: { xs: "0.75rem", sm: "0.75rem" }
            }
          }, uiLayout.formFieldSx)}
        />
      )}
      sx={{ minWidth: 0, width: "100%" }}
    />
  );

  return (
    <NavigationShell variant="standard" mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)}><Box dir="rtl" sx={{ minHeight: "100vh", bgcolor: "#f7faf8" }}>
      {!isDesktop && (
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            bgcolor: "rgba(255,255,255,.97)",
            color: textColor,
            borderBottom: "1px solid rgba(5,117,70,.12)",
            backdropFilter: "blur(14px)",
            zIndex: 1400,
            left: 0,
            right: 0,
            width: "100%"
          }}
        >
          <Toolbar
            variant="dense"
            sx={{
              minHeight: isPhone ? "50px !important" : "56px !important",
              px: isPhone ? 0.75 : 1
            }}
          >
            <IconButton
              onClick={() => setMobileSidebarOpen(true)}
              sx={{
                width: isPhone ? 36 : 40,
                height: isPhone ? 36 : 40,
                color: "#fff",
                bgcolor: primaryColor,
                "&:hover": { bgcolor: primaryDark }
              }}
            >
              <MenuRoundedIcon />
            </IconButton>
            <Typography sx={{ flex: 1, fontWeight: 950, fontSize: isPhone ? "0.75rem" : "0.82rem", color: textColor }}>
              طلبات السداد
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      {!isDesktop && (
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
      )}

      

      <Box
        sx={{
          px: isDesktop ? 2 : isPhone ? 0.85 : 1.25,
          py: isDesktop ? 2 : isPhone ? 0.7 : 1,
          mt: !isDesktop ? isPhone ? "50px" : "56px" : 0,
          mx: "auto",
          boxSizing: "border-box",
          overflowX: "hidden",
          ...navigationContentSx
        }}
      >
        <Paper elevation={0} sx={{ border: "1px solid rgba(5,117,70,.15)", borderRadius: 3, overflow: "hidden" }}>
          <Box
            sx={{
              px: isDesktop ? 2 : isPhone ? 0.7 : 1,
              py: isDesktop ? 1.3 : isPhone ? 0.5 : 0.8,
              color: isDesktop ? textColor : "white",
              background: isDesktop
                ? "linear-gradient(135deg,#ffffff 0%,#f2faf6 100%)"
                : `linear-gradient(135deg, ${primaryColor}, ${primaryDark})`,
              borderBottom: isDesktop ? "1px solid rgba(5,117,70,.12)" : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 0.7,
              flexWrap: "wrap"
            }}
          >
            <Box>
              <Typography sx={{ fontWeight: 1000, fontSize: isDesktop ? "1.2rem" : isPhone ? "0.75rem" : "0.9rem", lineHeight: 1.2, color: isDesktop ? primaryDark : "inherit" }}>
                طلبات السداد
              </Typography>
              <Typography sx={{ opacity: .9, fontSize: isDesktop ? "0.75rem" : "0.75rem", color: isDesktop ? "#60756d" : "inherit", display: { xs: "none", sm: "block" } }}>شاشة الحسابات لعرض وتأكيد طلبات السداد وإدارة الفاتورة والمستندات</Typography>
            </Box>
            <Chip
              label={`عدد الطلبات: ${filteredRows.length}`}
              size="small"
              sx={{
                bgcolor: isDesktop ? "#eef8f3" : "white",
                color: primaryDark,
                fontWeight: 950,
                height: isPhone ? 22 : isTablet ? 26 : 30,
                fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : "0.75rem"
              }}
            />
          </Box>

          <Box sx={{ p: { xs: 1, md: 1.6 } }}>
            {error ? <Alert severity="error" sx={{ mb: 1.2 }}>{error}</Alert> : null}

            <Box
              sx={uiLayout.withUiSx({
                display: "grid",
                mt: { xs: 0.35, sm: 0.7, md: 1 },
                gridTemplateColumns: {
                  xs: "repeat(2,minmax(0,1fr))",
                  sm: "repeat(4,minmax(0,1fr))",
                  xl: "145px 145px 90px 130px 145px minmax(240px,1fr)"
                },
                gap: { xs: 0.55, sm: 0.7, md: 0.8 },
                alignItems: "center",
                mb: { xs: 0.7, md: 1.1 }
              }, uiLayout.filterBarSx)}
            >
              <TextField
                size="small"
                type="date"
                label="الفترة من"
                value={fromDate}
                max={toDate || undefined}
                onChange={(e) => setFromDate(e.target.value)}
                inputProps={{ max: toDate || undefined , dir: "ltr" , style: { direction: "ltr", unicodeBidi: "isolate" } }}
                InputLabelProps={{ shrink: true }}
                sx={uiLayout.withUiSx({
                  "& .MuiInputBase-root": { height: { xs: 34, sm: 38 } },
                  "& .MuiInputBase-input": { fontSize: { xs: "0.75rem", sm: ".78rem" }, py: 0.45 },
                  "& .MuiInputLabel-root": { fontSize: { xs: "0.75rem", sm: "0.75rem" } }
                }, uiLayout.formFieldSx)}
              />

              <TextField
                size="small"
                type="date"
                label="الفترة إلى"
                value={toDate}
                min={fromDate || undefined}
                onChange={(e) => setToDate(e.target.value)}
                inputProps={{ min: fromDate || undefined , dir: "ltr" , style: { direction: "ltr", unicodeBidi: "isolate" } }}
                InputLabelProps={{ shrink: true }}
                sx={uiLayout.withUiSx({
                  "& .MuiInputBase-root": { height: { xs: 34, sm: 38 } },
                  "& .MuiInputBase-input": { fontSize: { xs: "0.75rem", sm: ".78rem" }, py: 0.45 },
                  "& .MuiInputLabel-root": { fontSize: { xs: "0.75rem", sm: "0.75rem" } }
                }, uiLayout.formFieldSx)}
              />

              <Button
                variant="contained"
                onClick={loadData}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <RefreshIcon sx={{ fontSize: 17 }} />}
                sx={uiLayout.withUiSx({
                  minHeight: { xs: 32, sm: 36 },
                  fontSize: { xs: "0.75rem", sm: ".76rem" },
                  px: { xs: 0.7, sm: 1.3 }
                }, uiLayout.buttonSx)}
              >
                عرض
              </Button>

              <Button
                variant="outlined"
                onClick={exportExcel}
                startIcon={<FileDownloadIcon sx={{ fontSize: 17 }} />}
                sx={uiLayout.withUiSx({
                  minHeight: { xs: 32, sm: 36 },
                  fontSize: { xs: "0.75rem", sm: "0.75rem" },
                  px: { xs: 0.55, sm: 1.1 }
                }, uiLayout.buttonSx)}
              >
                تصدير Excel
              </Button>

              <Button
                variant={advancedFiltersOpen ? "contained" : "outlined"}
                color={activeAdvancedFiltersCount ? "success" : "inherit"}
                onClick={() => setAdvancedFiltersOpen((prev) => !prev)}
                startIcon={<TuneIcon sx={{ fontSize: 17 }} />}
                sx={uiLayout.withUiSx({
                  minHeight: { xs: 32, sm: 36 },
                  fontSize: { xs: "0.75rem", sm: "0.75rem" },
                  px: { xs: 0.55, sm: 1.1 },
                  gridColumn: { xs: "1 / -1", sm: "auto", lg: "auto" },
                  whiteSpace: "nowrap"
                }, uiLayout.buttonSx)}
              >
                فلاتر متقدمة
                {activeAdvancedFiltersCount > 0
                  ? ` (${activeAdvancedFiltersCount})`
                  : ""}
              </Button>

              <TextField InputLabelProps={{ shrink: true }}
                size="small"
                placeholder="بحث في الطلبات..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={uiLayout.withUiSx({
                  gridColumn: { xs: "1 / -1", sm: "1 / -1", lg: "auto" },
                  minWidth: 0,
                  "& .MuiInputBase-root": { height: { xs: 33, sm: 38 } },
                  "& .MuiInputBase-input": { fontSize: { xs: "0.75rem", sm: ".78rem" }, py: 0.45 }
                }, uiLayout.formFieldSx)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />
                    </InputAdornment>
                  )
                }}
              />
            </Box>

            {advancedFiltersOpen && (
              <Paper
                elevation={0}
                sx={{
                  mb: { xs: 0.8, md: 1.1 },
                  p: { xs: 0.6, sm: 0.9, md: 1.2 },
                  border: "1px solid rgba(5,117,70,.18)",
                  borderRadius: 2.2,
                  bgcolor: "#f8fcfa"
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  spacing={1}
                  sx={{ mb: { xs: 0.35, sm: 0.85 } }}
                >
                  <Box>
                    <Typography
                      sx={{
                        fontWeight: 1000,
                        color: primaryDark,
                        fontSize: { xs: "0.75rem", sm: ".86rem" }
                      }}
                    >
                      الفلاتر المتقدمة
                    </Typography>
                    <Typography
                      sx={{
                        color: "#64748b",
                        fontSize: { xs: "0.75rem", sm: "0.75rem" },
                        display: { xs: "none", sm: "block" }
                      }}
                    >
                      تقدر تختار أكثر من قيمة من نفس الفلتر وتجمع أكثر من فلتر مع بعض
                    </Typography>
                  </Box>

                  <Button
                    size="small"
                    color="error"
                    variant="text"
                    disabled={!activeAdvancedFiltersCount}
                    onClick={clearAdvancedFilters}
                    startIcon={<FilterAltOffIcon sx={{ fontSize: 16 }} />}
                    sx={uiLayout.withUiSx({
                      fontWeight: 900,
                      fontSize: { xs: "0.75rem", sm: "0.75rem" },
                      whiteSpace: "nowrap"
                    }, uiLayout.buttonSx)}
                  >
                    مسح الكل
                  </Button>
                </Stack>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "repeat(2, minmax(0, 1fr))",
                      sm: "repeat(2, minmax(0, 1fr))",
                      md: "repeat(3, minmax(0, 1fr))",
                      lg: "repeat(3, minmax(0, 1fr))",
                      xl: "repeat(6, minmax(0, 1fr))"
                    },
                    gap: { xs: 0.45, sm: 0.75 }
                  }}
                >
                  <AdvancedMultiSelect
                    label="الفرع"
                    placeholder="اختر فرع أو أكثر"
                    options={filterOptions.branches}
                    value={branchFilter}
                    onChange={setBranchFilter}
                  />

                  <AdvancedMultiSelect
                    label="المستند"
                    placeholder="اختر مستند أو أكثر"
                    options={filterOptions.documents}
                    value={documentFilter}
                    onChange={setDocumentFilter}
                  />

                  <AdvancedMultiSelect
                    label="الخزينة / البنك"
                    placeholder="اختر بنك أو خزينة"
                    options={filterOptions.cashBoxes}
                    value={cashBoxFilter}
                    onChange={setCashBoxFilter}
                  />

                  <AdvancedMultiSelect
                    label="حالة التحويل"
                    placeholder="اختر حالة أو أكثر"
                    options={filterOptions.statuses}
                    value={statusFilter}
                    onChange={setStatusFilter}
                  />

                  <AdvancedMultiSelect
                    label="مدخل البيانات"
                    placeholder="اختر مستخدم أو أكثر"
                    options={filterOptions.createdBy}
                    value={createdByFilter}
                    onChange={setCreatedByFilter}
                  />

                  <AdvancedMultiSelect
                    label="المحاسب"
                    placeholder="اختر محاسب أو أكثر"
                    options={filterOptions.accountants}
                    value={accountantFilter}
                    onChange={setAccountantFilter}
                  />
                </Box>

                {activeAdvancedFiltersCount > 0 && (
                  <Stack
                    direction="row"
                    spacing={0.5}
                    useFlexGap
                    flexWrap="wrap"
                    sx={{ mt: 1 }}
                  >
                    <Chip
                      size="small"
                      color="success"
                      variant="outlined"
                      label={`الفلاتر المختارة: ${activeAdvancedFiltersCount}`}
                      sx={{ fontWeight: 900 }}
                    />
                    <Chip
                      size="small"
                      variant="outlined"
                      label={`النتائج: ${filteredRows.length}`}
                      sx={{ fontWeight: 900 }}
                    />
                  </Stack>
                )}
              </Paper>
            )}

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(3,minmax(0,1fr))",
                gap: isPhone ? 0.35 : 0.6,
                mb: isPhone ? 0.6 : 1
              }}
            >
              {[
                ["الإجمالي", totals.total, primaryColor],
                ["الضريبة", totals.tax, "#a66a00"],
                ["الصافي", totals.subTotal, accentColor]
              ].map(([label, value, color]) => (
                <Paper
                  key={label}
                  elevation={0}
                  sx={{
                    p: isPhone ? 0.42 : isTablet ? 0.65 : 0.8,
                    borderRadius: isPhone ? 1.3 : 1.8,
                    border: "1px solid rgba(5,117,70,.13)",
                    bgcolor: "#fbfdfc",
                    textAlign: "center"
                  }}
                >
                  <Typography sx={{ fontWeight: 850, color: "#60756d", fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : "0.75rem" }}>
                    {label}
                  </Typography>
                  <Typography sx={{ mt: 0.15, fontWeight: 950, color, fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : ".8rem", direction: "ltr" }}>
                    {money(value)}
                  </Typography>
                </Paper>
              ))}
            </Box>

            <Box
              sx={uiLayout.withUiSx({
                width: "100%",
                maxWidth: "100%",
                overflowX: isDesktop ? "auto" : "hidden",
                overflowY: "visible"
              }, uiLayout.tableContainerSx)}
            >
<DataGrid 
  autoHeight 
  rows={filteredRows} 
  columns={isDesktop ? columns : compactColumns} 
  getRowId={(row) => row.guid || row.id} 
  disableRowSelectionOnClick 
  rowHeight={isDesktop ? 52 : isPhone ? 34 : 42} 
  columnHeaderHeight={isDesktop ? 46 : isPhone ? 34 : 42} 

  getRowClassName={(params) => 
    params.indexRelativeToCurrentPage % 2 === 0 
      ? "payment-row-even" 
      : "payment-row-odd" 
  } 

  sx={uiLayout.withUiSx({ 
    border: "none", 

    // اتجاه الجريد يظل LTR
    direction: "rtl", 

    /* ==============================
       الهيدر
    ============================== */ 
    "& .MuiDataGrid-columnHeaders": { 
      backgroundColor: "#f4f1ec", 
      borderBottom: "1px solid #d8d1c7", 
      color: "#163e32", 
      fontWeight: "900", 
      fontSize: isDesktop ? "12px" : isPhone ? "12px" : "12px" 
    }, 

    "& .MuiDataGrid-columnHeader": { 
      backgroundColor: "#f4f1ec" 
    }, 

    "& .MuiDataGrid-columnHeaderTitle": { 
      fontWeight: "900 !important", 
      color: "#163e32" 
    }, 

    /* ==============================
       جميع الخلايا
    ============================== */ 
    "& .MuiDataGrid-virtualScroller": { 
      minHeight: "0 !important" 
    }, 

    "& .MuiDataGrid-virtualScrollerContent": { 
      minHeight: "0 !important" 
    }, 

    "& .MuiDataGrid-cell": { 
      borderBottom: "1px solid #dedbd5", 
      fontSize: isDesktop ? "12px" : isPhone ? "12px" : "12px", 
      fontWeight: "700", 
      color: "#24352f", 
      display: "flex", 
      alignItems: "center" 
    }, 

    /* ==============================
       المبالغ فقط
       تكبير على الديسكتوب فقط
    ============================== */ 
    "& .amount-cell": { 
      fontSize: isDesktop 
        ? "15px" 
        : isPhone 
          ? "12px" 
          : "12px", 

      fontWeight: isDesktop 
        ? "900 !important" 
        : "800", 

      color: "#20382f", 
      fontVariantNumeric: "tabular-nums",
      lineHeight: 1.2
    }, 

    /* ==============================
       التاريخ
    ============================== */ 
    "& .date-cell": { 
      fontSize: isDesktop ? "12px" : isPhone ? "12px" : "12px", 
      fontWeight: "750", 
      color: "#24352f", 
      whiteSpace: "nowrap", 
      overflow: "visible", 
      textOverflow: "clip", 
      fontVariantNumeric: "tabular-nums" 
    }, 

    /* ==============================
       صف أبيض + صف خوخي
    ============================== */ 
    "& .payment-row-even": { 
      backgroundColor: "#ffffff" 
    }, 

    "& .payment-row-odd": { 
      backgroundColor: "#fff0df" 
    }, 

    /* Hover */ 
    "& .payment-row-even:hover, & .payment-row-odd:hover": { 
      backgroundColor: "#f9e2c8 !important" 
    }, 

    /* ==============================
       التحديد
    ============================== */ 
    "& .MuiDataGrid-row.Mui-selected": { 
      backgroundColor: "#f6dfc6 !important" 
    }, 

    "& .MuiDataGrid-row.Mui-selected:hover": { 
      backgroundColor: "#f2d4b2 !important" 
    }, 

    /* ==============================
       الفوتر
    ============================== */ 
    "& .MuiDataGrid-footerContainer": { 
      borderTop: "1px solid #d8d1c7", 
      backgroundColor: "#faf8f5", 
      fontWeight: "700" 
    }, 

    /* ==============================
       إزالة Outline
    ============================== */ 
    "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus": { 
      outline: "none" 
    }, 

    /* ==============================
       فون / تابلت فقط
    ============================== */ 
    ...(!isDesktop 
      ? { 
          "& .MuiDataGrid-columnHeaderTitleContainer": { 
            justifyContent: "center", 
            minWidth: 0, 
            overflow: "hidden" 
          }, 

          "& .MuiDataGrid-columnHeaderTitle": { 
            textAlign: "center", 
            whiteSpace: "nowrap", 
            overflow: "hidden", 
            textOverflow: "ellipsis" 
          }, 

          "& .MuiDataGrid-columnSeparator, & .MuiDataGrid-menuIcon, & .MuiDataGrid-iconButtonContainer": { 
            display: "none" 
          }, 

          "& .MuiDataGrid-cell": { 
            px: isPhone ? 0.05 : 0.2, 
            justifyContent: "center", 
            textAlign: "center" 
          }, 

          "& .MuiDataGrid-virtualScroller": { 
            overflowX: "auto" 
          }, 

          "& .MuiDataGrid-scrollbar--horizontal": { 
            display: "block" 
          } 
        } 
      : {}) 
  }, uiLayout.dataGridSx)} 
/>
            </Box>
          </Box>
        </Paper>
      </Box>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)} dir="rtl">
        <MenuItem onClick={() => menuRow && openRequest(menuRow)}><VisibilityIcon fontSize="small" sx={{ ml: 1 }} />عرض طلب السداد</MenuItem>
        <MenuItem disabled={!menuRow || Number(menuRow.status) !== 0 || menuRow.isUse === false} onClick={() => menuRow && confirmRow(menuRow)}><CheckCircleIcon fontSize="small" sx={{ ml: 1, color: primaryColor }} />تأكيد التحويل</MenuItem>
        <MenuItem disabled={!menuRow?.billGuid} onClick={() => menuRow && openInvoice(menuRow)}><ReceiptLongIcon fontSize="small" sx={{ ml: 1 }} />عرض الفاتورة</MenuItem>
        <MenuItem onClick={() => menuRow && openStatement(menuRow)}><AccountBalanceWalletIcon fontSize="small" sx={{ ml: 1 }} />كشف الحساب</MenuItem>
        <MenuItem onClick={() => menuRow && openOperations(menuRow)}><HistoryIcon fontSize="small" sx={{ ml: 1 }} />العمليات</MenuItem>
        <MenuItem onClick={() => menuRow && openAttachment(menuRow)}><AttachFileIcon fontSize="small" sx={{ ml: 1 }} />عرض مستند الدفع</MenuItem>
        <MenuItem
          disabled={!menuRow || Number(menuRow.status) !== 0}
          onClick={() => menuRow && changeOrderStatus(menuRow)}
        >
          <ReplayIcon
            fontSize="small"
            sx={{ ml: 1, color: accentColor }}
          />
          تغيير حالة التحويل
        </MenuItem>
      </Menu>

      <PaymentOrderDialog
        open={orderOpen}
        onClose={() => setOrderOpen(false)}
        order={selectedOrder}
        apiBaseUrl={API_BASE_URL}
        userGuid={userGuid}
        onConfirmed={loadData}
        onUpdated={handlePaymentOrderUpdated}
        onOpenInvoice={(data) => openInvoice({ ...selectedOrder, ...data })}
        onOpenStatement={(data) => openStatement({ ...selectedOrder, ...data })}
        onOpenOperations={(data) => openOperations({ ...selectedOrder, ...data })}
        cashBoxOptions={cashBoxOptions}
      />

      <SalesInvoiceDialog open={invoiceOpen} onClose={() => setInvoiceOpen(false)} invoice={selectedInvoice} apiBaseUrl={API_BASE_URL} />

      <StudentStatementDialog2 open={statementOpen} onClose={() => setStatementOpen(false)} student={selectedStudent} apiBaseUrl={API_BASE_URL} />

      <StudentOperationsDialog open={operationsOpen} onClose={() => setOperationsOpen(false)} student={selectedOperationsStudent} apiBaseUrl={API_BASE_URL} />
    </Box></NavigationShell>
  );
}
