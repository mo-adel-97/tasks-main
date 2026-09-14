import * as uiLayout from '../components/common/uiLayout';
import './rtl-forms-fix.css';
import { DESKTOP_BREAKPOINT, navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DescriptionIcon from "@mui/icons-material/Description";
import PrintIcon from "@mui/icons-material/Print";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import Swal from "sweetalert2";





const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "http://localhost:5258";



const ACCOUNT_SEARCH_DEBOUNCE_MS = 550;
const JOURNAL_SEARCH_DEBOUNCE_MS = 650;
const MIN_ACCOUNT_SEARCH_LENGTH = 2;
const MIN_JOURNAL_SEARCH_LENGTH = 2;

const primary = "#057546";
const primaryDark = "#034d31";
const soft = "#f7faf8";
const line = "#dce8e2";

const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const getUserGuid = (u) =>
  u?.guid ||
  u?.Guid ||
  u?.userGuid ||
  u?.USER_GUID ||
  "";

const today = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const isGregorianSqlDate = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  return (
    year >= 1753 &&
    year <= 9999 &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= 31
  );
};


const gregorianDateCache = new Map();

const parseNumericDate = (value) => {
  const text = String(value || "").trim();
  if (!text) return null;

  // yyyy-MM-dd أو yyyy/MM/dd
  let m = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/.exec(text);
  if (m) {
    return {
      year: Number(m[1]),
      month: Number(m[2]),
      day: Number(m[3])
    };
  }

  // MM/dd/yyyy (شكل بعض الحقول القديمة)
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text);
  if (m) {
    return {
      year: Number(m[3]),
      month: Number(m[1]),
      day: Number(m[2])
    };
  }

  return null;
};

const formatIsoDate = (year, month, day) =>
  `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const hijriToGregorian = (year, month, day) => {
  const cacheKey = `${year}-${month}-${day}`;
  if (gregorianDateCache.has(cacheKey)) {
    return gregorianDateCache.get(cacheKey);
  }

  try {
    const formatter = new Intl.DateTimeFormat(
      "en-US-u-ca-islamic-umalqura-nu-latn",
      {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        timeZone: "UTC"
      }
    );

    // تقريب السنة الميلادية المقابلة ثم البحث حولها.
    const approximateGregorianYear = Math.floor(
      year * 0.970224 + 621.5774
    );

    const start = new Date(
      Date.UTC(approximateGregorianYear - 1, 0, 1)
    );

    // عامان ونصف تقريبًا كافية لأي فرق في التقويم.
    for (let i = 0; i < 950; i += 1) {
      const current = new Date(
        start.getTime() + i * 86400000
      );

      const parts = formatter.formatToParts(current);
      const part = (type) =>
        Number(parts.find((p) => p.type === type)?.value || 0);

      if (
        part("year") === year &&
        part("month") === month &&
        part("day") === day
      ) {
        const result = formatIsoDate(
          current.getUTCFullYear(),
          current.getUTCMonth() + 1,
          current.getUTCDate()
        );
        gregorianDateCache.set(cacheKey, result);
        return result;
      }
    }
  } catch {
    // لو المتصفح لا يدعم تقويم أم القرى نرجع القيمة الآمنة أدناه.
  }

  return "";
};

const toGregorianDate = (value) => {
  const parsed = parseNumericDate(value);
  if (!parsed) return "";

  const { year, month, day } = parsed;

  // ميلادي صالح بالفعل.
  if (year >= 1753 && year <= 9999) {
    return formatIsoDate(year, month, day);
  }

  // السنوات الهجرية المعتادة في بيانات النظام.
  if (year >= 1300 && year <= 1600) {
    return hijriToGregorian(year, month, day);
  }

  return "";
};

const displayGregorianDate = (value) =>
  toGregorianDate(value) || "-";

const normalizeGregorianInput = (value) =>
  toGregorianDate(value) || today();

const emptyLine = () => ({
  id: crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
  accountCode: "",
  accountName: "",
  accountGuid: "",
  accountType: "",
  notes: "",
  debit: "",
  credit: "",
  costName: "",
  costGuid: ""
});

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const money = (v) =>
  num(v).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

export default function JournalEntry() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "lg"));
  const isDesktop = useMediaQuery(
    `(min-width:${DESKTOP_BREAKPOINT}px)`,
    { noSsr: true }
  );
  const isCompact = !isDesktop;

  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  // إلغاء أي طلب بحث قديم بدل ما تتراكم Requests أثناء الكتابة.
  const accountAbortRef = useRef(null);
  const journalAbortRef = useRef(null);

  const handleMobileSidebarClose = useCallback(() => {
    setMobileSidebarOpen(false);
  }, []);

  const user = useMemo(() => getUser(), []);
  const userGuid = useMemo(() => String(getUserGuid(user)).trim(), [user]);

  const [authorized, setAuthorized] = useState(false);
  const [permissionLoading, setPermissionLoading] = useState(true);

  const [guid, setGuid] = useState("");
  const [code, setCode] = useState("");
  const [dayDate, setDayDate] = useState(today());
  const [notes, setNotes] = useState("");
  const [isUse, setIsUse] = useState(true);
  const [linkedToDocument, setLinkedToDocument] = useState(false);
  const [rows, setRows] = useState([emptyLine()]);
  const [saving, setSaving] = useState(false);

  const [accountOpen, setAccountOpen] = useState(false);
  const [accountRowIndex, setAccountRowIndex] = useState(-1);
  const [accountSearch, setAccountSearch] = useState("");
  const [accountBy, setAccountBy] = useState("name");
  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);

  const [costOpen, setCostOpen] = useState(false);
  const [costRowIndex, setCostRowIndex] = useState(-1);
  const [costs, setCosts] = useState([]);
  const [costSearch, setCostSearch] = useState("");

  const [listOpen, setListOpen] = useState(false);
  const [journalSearch, setJournalSearch] = useState("");
  const [journalList, setJournalList] = useState([]);
  const [listLoading, setListLoading] = useState(false);

  // ------------------------------------------------------------
  // Permission: الحسابات العامة + journalEntry
  // ------------------------------------------------------------
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
        const response = await fetch(
          `${API_BASE_URL}/api/user-permissions/${encodeURIComponent(userGuid)}`,
          { cache: "no-store" }
        );
        const result = await response.json().catch(() => null);

        const ok =
          response.ok &&
          result?.data?.generalAccounts?.canView === true &&
          result?.data?.generalAccounts?.screens?.journalEntry === true;

        if (alive) setAuthorized(ok);
      } catch {
        if (alive) setAuthorized(false);
      } finally {
        if (alive) setPermissionLoading(false);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [userGuid]);

  const totals = useMemo(() => {
    const debit = rows.reduce((s, r) => s + num(r.debit), 0);
    const credit = rows.reduce((s, r) => s + num(r.credit), 0);
    return {
      debit,
      credit,
      diff: Math.round((debit - credit) * 100) / 100
    };
  }, [rows]);

  const updateRow = useCallback((index, field, value) => {
    setRows((current) => {
      const currentRow = current[index];

      if (!currentRow || currentRow[field] === value) {
        return current;
      }

      // Clone السطر المتغير فقط بدل عمليات إضافية على بقية البيانات.
      const next = current.slice();
      next[index] = {
        ...currentRow,
        [field]: value
      };
      return next;
    });
  }, []);

  const newEntry = () => {
    setGuid("");
    setCode("");
    setDayDate(today());
    setNotes("");
    setIsUse(true);
    setLinkedToDocument(false);
    setRows([emptyLine()]);
  };

  const addRow = useCallback(() => {
    setRows((current) => [...current, emptyLine()]);
  }, []);

  const removeRow = useCallback((index) => {
    setRows((current) => {
      if (current.length === 1) {
        return [emptyLine()];
      }

      const next = current.slice();
      next.splice(index, 1);
      return next;
    });
  }, []);

  // ------------------------------------------------------------
  // Account lookup
  // ------------------------------------------------------------
  const openAccountLookup = (index, by = "name") => {
    setAccountRowIndex(index);
    setAccountBy(by);
    setAccountSearch("");
    setAccounts([]);
    setAccountOpen(true);
  };

  const loadAccounts = useCallback(async () => {
    if (!accountOpen || !authorized) return;

    const q = accountSearch.trim();

    // لا نضرب قاعدة البيانات مع كل ضغطة أو بحرف واحد.
    if (q.length > 0 && q.length < MIN_ACCOUNT_SEARCH_LENGTH) {
      setAccounts([]);
      setAccountsLoading(false);
      return;
    }

    // ألغي البحث السابق لو المستخدم كتب قيمة أحدث.
    accountAbortRef.current?.abort();
    const controller = new AbortController();
    accountAbortRef.current = controller;

    setAccountsLoading(true);

    try {
      const params = new URLSearchParams({
        userGuid,
        q,
        by: accountBy
      });

      const response = await fetch(
        `${API_BASE_URL}/api/journal-entries/accounts?${params.toString()}`,
        {
          cache: "no-store",
          signal: controller.signal
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message || "تعذر تحميل الحسابات"
        );
      }

      if (!controller.signal.aborted) {
        setAccounts(
          Array.isArray(result?.data) ? result.data : []
        );
      }
    } catch (e) {
      if (e?.name !== "AbortError") {
        setAccounts([]);
      }
    } finally {
      if (!controller.signal.aborted) {
        setAccountsLoading(false);
      }
    }
  }, [
    accountOpen,
    accountSearch,
    accountBy,
    authorized,
    userGuid
  ]);

  useEffect(() => {
    if (!accountOpen) {
      accountAbortRef.current?.abort();
      return;
    }

    const timer = setTimeout(
      loadAccounts,
      ACCOUNT_SEARCH_DEBOUNCE_MS
    );

    return () => {
      clearTimeout(timer);
      accountAbortRef.current?.abort();
    };
  }, [
    accountOpen,
    accountSearch,
    accountBy,
    loadAccounts
  ]);

  const chooseAccount = (account) => {
    if (accountRowIndex < 0) return;

    setRows((current) =>
      current.map((row, i) =>
        i === accountRowIndex
          ? {
              ...row,
              accountCode: account.code || "",
              accountName: account.name || "",
              accountGuid: account.guid || "",
              accountType: String(account.accountType ?? ""),
              costName:
                String(account.accountType ?? "") === "0" ||
                String(account.accountType ?? "") === "1"
                  ? row.costName
                  : "",
              costGuid:
                String(account.accountType ?? "") === "0" ||
                String(account.accountType ?? "") === "1"
                  ? row.costGuid
                  : "00000000-0000-0000-0000-000000000000"
            }
          : row
      )
    );

    setAccountOpen(false);
  };

  // ------------------------------------------------------------
  // Cost center lookup
  // ------------------------------------------------------------
  const openCostLookup = async (index) => {
    const row = rows[index];

    if (!row.accountGuid) {
      await Swal.fire({
        icon: "warning",
        title: "اختيار الحساب أولًا",
        text: "اختر الحساب قبل مركز التكلفة"
      });
      return;
    }

    if (String(row.accountType) !== "0" && String(row.accountType) !== "1") {
      await Swal.fire({
        icon: "info",
        title: "لا يحتاج مركز تكلفة",
        text: "الحساب المحدد غير مطلوب له مركز تكلفة"
      });
      return;
    }

    setCostRowIndex(index);
    setCostSearch("");
    setCostOpen(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/journal-entries/cost-centers?userGuid=${encodeURIComponent(userGuid)}`,
        { cache: "no-store" }
      );
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error();
      setCosts(Array.isArray(result?.data) ? result.data : []);
    } catch {
      setCosts([]);
    }
  };

  const chooseCost = (cost) => {
    if (costRowIndex < 0) return;
    setRows((current) =>
      current.map((row, i) =>
        i === costRowIndex
          ? {
              ...row,
              costName: cost.name || "",
              costGuid: cost.guid || ""
            }
          : row
      )
    );
    setCostOpen(false);
  };

  // ------------------------------------------------------------
  // Journal list / load
  // ------------------------------------------------------------
  const loadJournalList = useCallback(async () => {
    if (!authorized) return;

    const q = journalSearch.trim();

    if (q.length > 0 && q.length < MIN_JOURNAL_SEARCH_LENGTH) {
      setJournalList([]);
      setListLoading(false);
      return;
    }

    journalAbortRef.current?.abort();
    const controller = new AbortController();
    journalAbortRef.current = controller;

    setListLoading(true);

    try {
      const params = new URLSearchParams({
        userGuid,
        search: q,
        // 80 كفاية للنافذة وأخف كثيرًا من 250 في كل بحث.
        take: q ? "80" : "50"
      });

      const response = await fetch(
        `${API_BASE_URL}/api/journal-entries?${params.toString()}`,
        {
          cache: "no-store",
          signal: controller.signal
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message || "تعذر تحميل القيود"
        );
      }

      if (!controller.signal.aborted) {
        setJournalList(
          Array.isArray(result?.data) ? result.data : []
        );
      }
    } catch (e) {
      if (e?.name !== "AbortError") {
        setJournalList([]);
      }
    } finally {
      if (!controller.signal.aborted) {
        setListLoading(false);
      }
    }
  }, [authorized, journalSearch, userGuid]);

  useEffect(() => {
    if (!listOpen) {
      journalAbortRef.current?.abort();
      return;
    }

    const timer = setTimeout(
      loadJournalList,
      JOURNAL_SEARCH_DEBOUNCE_MS
    );

    return () => {
      clearTimeout(timer);
      journalAbortRef.current?.abort();
    };
  }, [listOpen, journalSearch, loadJournalList]);

  const loadEntry = async (selectedCode) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/journal-entries/${encodeURIComponent(selectedCode)}?userGuid=${encodeURIComponent(userGuid)}`,
        { cache: "no-store" }
      );
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message || "تعذر تحميل القيد");

      const d = result?.data || {};
      setGuid(d.guid || "");
      setCode(String(d.code ?? selectedCode));
      setDayDate(normalizeGregorianInput(d.dayDate));
      setNotes(d.notes || "");
      setIsUse(d.isUse !== false);
      setLinkedToDocument(d.linkedToDocument === true);
      setRows(
        Array.isArray(d.rows) && d.rows.length
          ? d.rows.map((r) => ({
              ...emptyLine(),
              ...r,
              debit: r.debit ?? "",
              credit: r.credit ?? ""
            }))
          : [emptyLine()]
      );
      setListOpen(false);
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "تعذر تحميل القيد",
        text: e?.message || "حدث خطأ"
      });
    }
  };

  // ------------------------------------------------------------
  // Validation + save
  // ------------------------------------------------------------
  const validate = () => {
    if (!isGregorianSqlDate(dayDate))
      return "تاريخ القيد يجب أن يكون تاريخًا ميلاديًا صحيحًا";

    if (!notes.trim()) return "برجاء إدخال ملاحظات القيد";

    const actualRows = rows.filter(
      (r) =>
        r.accountGuid ||
        r.accountCode ||
        r.accountName ||
        r.notes ||
        num(r.debit) ||
        num(r.credit)
    );

    if (!actualRows.length) return "أضف تفاصيل القيد";

    for (const r of actualRows) {
      if (!r.accountGuid) return "يوجد سطر بدون حساب";
      if (!String(r.notes || "").trim()) return "أدخل البيان لكل سطر";

      if (num(r.debit) > 0 && num(r.credit) > 0)
        return "السطر الواحد لا يمكن أن يكون مدينًا ودائنًا معًا";

      if (
        (String(r.accountType) === "0" ||
          String(r.accountType) === "1") &&
        !r.costGuid
      )
        return `اختر مركز التكلفة للحساب: ${r.accountName}`;
    }

    if (Math.abs(totals.diff) > 0.001)
      return "القيد غير متزن، إجمالي المدين يجب أن يساوي إجمالي الدائن";

    return null;
  };

  const save = async () => {
    if (saving) return;

    const error = validate();
    if (error) {
      await Swal.fire({
        icon: "warning",
        title: "راجع بيانات القيد",
        text: error
      });
      return;
    }

    if (linkedToDocument && guid) {
      await Swal.fire({
        icon: "error",
        title: "لا يمكن التعديل",
        text: "هذا القيد مرتبط بمستند آخر"
      });
      return;
    }

    let reason = "";

    if (guid) {
      const result = await Swal.fire({
        title: "سبب تعديل القيد",
        input: "textarea",
        inputPlaceholder: "اكتب سبب التعديل...",
        showCancelButton: true,
        confirmButtonText: "حفظ التعديل",
        cancelButtonText: "رجوع",
        confirmButtonColor: primary,
        inputValidator: (value) =>
          !String(value || "").trim()
            ? "سبب التعديل مطلوب"
            : undefined
      });

      if (!result.isConfirmed) return;
      reason = String(result.value || "").trim();
    }

    const payload = {
      userGuid,
      dayDate: String(dayDate),
      notes: notes.trim(),
      isUse,
      reason,
      rows: rows
        .filter((r) => r.accountGuid)
        .map((r) => ({
          accountGuid: r.accountGuid,
          accountType: String(r.accountType ?? ""),
          notes: String(r.notes || "").trim(),
          debit: num(r.debit),
          credit: num(r.credit),
          costGuid:
            r.costGuid ||
            "00000000-0000-0000-0000-000000000000"
        }))
    };

    setSaving(true);
    try {
      const response = await fetch(
        guid
          ? `${API_BASE_URL}/api/journal-entries/${encodeURIComponent(guid)}`
          : `${API_BASE_URL}/api/journal-entries`,
        {
          method: guid ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );

      const rawResponse = await response.text();

      let result = null;

      if (rawResponse) {
        try {
          result = JSON.parse(rawResponse);
        } catch {
          result = null;
        }
      }

      if (!response.ok) {
        if (
          response.status === 409 &&
          result?.code === "ACCOUNTING_BUSY"
        ) {
          throw new Error(
            result?.message ||
              "يوجد ترحيل محاسبي آخر جارٍ الآن. حاول بعد لحظات."
          );
        }

        const serverMessage =
          result?.message ||
          result?.error ||
          result?.detail ||
          rawResponse?.trim();

        throw new Error(
          serverMessage ||
            `تعذر ${guid ? "تعديل" : "حفظ"} القيد (HTTP ${response.status})`
        );
      }

      const newGuid = result?.data?.guid || guid;
      const newCode = String(result?.data?.code ?? code);

      setGuid(newGuid);
      setCode(newCode);

      await Swal.fire({
        icon: "success",
        title: guid ? "تم تعديل قيد اليومية" : "تم حفظ قيد اليومية",
        html: newCode
          ? `رقم القيد: <b>${newCode}</b>`
          : undefined,
        confirmButtonColor: primary
      });
    } catch (e) {
      await Swal.fire({
        icon: "error",
        title: guid ? "تعذر التعديل" : "تعذر الحفظ",
        html: `
          <div style="direction:rtl;text-align:center">
            <div>${String(e?.message || "حدث خطأ")}</div>
          </div>
        `,
        confirmButtonText: "حسنًا"
      });
    } finally {
      setSaving(false);
    }
  };

  // ------------------------------------------------------------
  // Print
  // ------------------------------------------------------------
  const printEntry = async () => {
    if (!guid) {
      Swal.fire({
        icon: "warning",
        title: "اختر أو احفظ القيد أولًا"
      });
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/journal-entries/${encodeURIComponent(guid)}/print?userGuid=${encodeURIComponent(userGuid)}`,
        { cache: "no-store" }
      );
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message || "تعذر تحميل الطباعة");

      const p = window.open("", "_blank", "width=1100,height=800");
      if (!p) throw new Error("المتصفح منع نافذة الطباعة");

      const detailHtml = rows
        .filter((r) => r.accountGuid)
        .map(
          (r) => `
            <tr>
              <td>${r.accountCode || ""}</td>
              <td>${r.accountName || ""}</td>
              <td>${r.notes || ""}</td>
              <td>${money(r.debit)}</td>
              <td>${money(r.credit)}</td>
              <td>${r.costName || ""}</td>
            </tr>`
        )
        .join("");

      p.document.write(`<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<title>قيد يومية ${code}</title>
<style>
body{font-family:Arial,Tahoma,sans-serif;padding:24px;color:#111}
h1{text-align:center;color:${primary};margin:0 0 20px}
.meta{display:flex;gap:20px;justify-content:space-between;border:1px solid #ddd;padding:12px;margin-bottom:16px}
table{width:100%;border-collapse:collapse}
th,td{border:1px solid #bbb;padding:8px;text-align:center}
th{background:#eef6f2}
.totals{margin-top:18px;font-weight:bold;font-size:18px}
.notes{margin:15px 0;padding:12px;border:1px solid #ddd;min-height:50px}
</style>
</head>
<body>
<h1>قيد يومية رقم ${code}</h1>
<div class="meta"><span>التاريخ: ${dayDate}</span><span>الحالة: ${isUse ? "نشط" : "غير نشط"}</span></div>
<div class="notes"><b>ملاحظات:</b> ${notes}</div>
<table>
<thead><tr><th>رقم الحساب</th><th>اسم الحساب</th><th>البيان</th><th>مدين</th><th>دائن</th><th>مركز تكلفة</th></tr></thead>
<tbody>${detailHtml}</tbody>
</table>
<div class="totals">إجمالي مدين: ${money(totals.debit)} &nbsp;&nbsp; | &nbsp;&nbsp; إجمالي دائن: ${money(totals.credit)} &nbsp;&nbsp; | &nbsp;&nbsp; الفرق: ${money(totals.diff)}</div>
<script>window.onload=()=>{window.print();}</script>
</body></html>`);
      p.document.close();
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "تعذر الطباعة",
        text: e?.message || "حدث خطأ"
      });
    }
  };

  if (permissionLoading) {
    return (
      <Box sx={{ minHeight: "70vh", display: "grid", placeItems: "center" }}>
        <CircularProgress sx={{ color: primary }} />
      </Box>
    );
  }

  if (!authorized) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          لا توجد لديك صلاحية قيد يومية ضمن الحسابات العامة.
        </Alert>
      </Box>
    );
  }

  return (
    <NavigationShell variant="standard" mobileOpen={mobileSidebarOpen} onMobileClose={handleMobileSidebarClose}><Box
      dir="rtl"
      sx={{
        minHeight: "100vh",
        bgcolor: "#f7faf8",
        fontFamily: '"Cairo","Tahoma",sans-serif'
      }}
    >
      {!isDesktop && (
        <AppBar
          position="sticky"
          elevation={1}
          sx={{
            bgcolor: primary,
            zIndex: (theme) => theme.zIndex.drawer + 1
          }}
        >
          <Toolbar
            variant="dense"
            sx={{
              minHeight: { xs: 48, sm: 54 },
              px: { xs: 1, sm: 1.5 }
            }}
          >
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setMobileSidebarOpen(true)}
              sx={{ ml: 0.5 }}
            >
              <MenuRoundedIcon />
            </IconButton>

            <Typography
              sx={{
                flex: 1,
                fontWeight: 950,
                fontSize: { xs: "0.92rem", sm: "1.05rem" }
              }}
            >
              قيد يومية
            </Typography>

            <Chip
              label={code ? `قيد ${code}` : "جديد"}
              size="small"
              sx={{
                bgcolor: "#fff",
                color: primaryDark,
                fontWeight: 900,
                height: 25
              }}
            />
          </Toolbar>
        </AppBar>
      )}

      

      <Box
        sx={{
          p: {
            xs: 0.75,
            sm: 1,
            lg: 1.5
          },
          minWidth: 0,
          ...navigationContentSx
        }}
      >
      <Paper
        elevation={0}
        sx={{
          border: "1px solid rgba(5,117,70,.15)",
          borderRadius: { xs: 2, sm: 3 },
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(5,117,70,.06)"
        }}
      >
        <Box
          sx={{
            background: `linear-gradient(135deg, ${primary}, ${primaryDark})`,
            color: "#fff",
            px: { xs: 1.5, sm: 2 },
            py: 1.3,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            flexWrap: "wrap"
          }}
        >
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: { xs: 18, sm: 22 } }}>
              قيد يومية
            </Typography>
            <Typography sx={{ opacity: 0.85, fontSize: 12 }}>
              الحسابات العامة — إنشاء وتعديل وطباعة قيود اليومية
            </Typography>
          </Box>

          <Chip
            label={code ? `رقم القيد: ${code}` : "قيد جديد"}
            sx={{ bgcolor: "#fff", color: primaryDark, fontWeight: 900 }}
          />
        </Box>

        <Box sx={{ p: { xs: 1, sm: 2 } }}>
          <Box
            sx={uiLayout.withUiSx({
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr 1fr",
                sm: "repeat(4, minmax(120px, 1fr))",
                lg: "repeat(4, 150px)"
              },
              gap: 1,
              mb: { xs: 1.25, sm: 1.75 },
              alignItems: "stretch"
            }, uiLayout.actionBarSx)}
          >
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={newEntry}
              sx={uiLayout.withUiSx({ bgcolor: primary, fontWeight: 800 }, uiLayout.buttonSx)}
            >
              جديد
            </Button>

            <Button
              variant="outlined"
              startIcon={<SearchIcon />}
              onClick={() => setListOpen(true)}
              sx={uiLayout.withUiSx({ borderColor: primary, color: primary, fontWeight: 800 }, uiLayout.buttonSx)}
            >
              بحث عن قيد
            </Button>

            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
              disabled={saving || linkedToDocument}
              onClick={save}
              sx={uiLayout.withUiSx({ bgcolor: primary, fontWeight: 800 }, uiLayout.buttonSx)}
            >
              {guid ? "حفظ التعديل" : "حفظ"}
            </Button>

            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              disabled={!guid}
              onClick={printEntry}
              sx={uiLayout.withUiSx({ fontWeight: 800 }, uiLayout.buttonSx)}
            >
              طباعة
            </Button>
          </Box>

          {linkedToDocument && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              هذا القيد مرتبط بمستند آخر؛ العرض والطباعة متاحان لكن التعديل غير مسموح.
            </Alert>
          )}

          <Box
            sx={uiLayout.withUiSx({
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr 1fr",
                sm: "150px 190px minmax(260px,1fr) 150px",
                md: "170px 210px minmax(320px,1fr) 160px"
              },
              gap: 1.2,
              mb: 1.5
            }, uiLayout.formGridSx)}
          >
            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
              label="رقم القيد"
              value={code}
              size="small"
              InputProps={{ readOnly: true }}
             inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

            <TextField sx={uiLayout.formFieldSx}
              label="التاريخ الميلادي"
              type="date"
              value={dayDate}
              onChange={(e) => setDayDate(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
              inputProps={{
                min: "1753-01-01",
                max: "9999-12-31",
                dir: "ltr"
              }}
              disabled={linkedToDocument}
            />

            <TextField InputLabelProps={{ shrink: true }}
              sx={uiLayout.withUiSx({
                gridColumn: { xs: "1 / -1", sm: "auto" }
              }, uiLayout.formFieldSx)}
              label="ملاحظات القيد"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              size="small"
              multiline
              minRows={isMobile ? 2 : 1}
              disabled={linkedToDocument}
            />

            <FormControlLabel
              sx={uiLayout.withUiSx({
                m: 0,
                border: `1px solid ${line}`,
                borderRadius: 1,
                px: 1
              }, uiLayout.checkboxFieldSx)}
              control={
                <Switch
                  checked={isUse}
                  onChange={(e) => setIsUse(e.target.checked)}
                  disabled={linkedToDocument}
                />
              }
              label={isUse ? "نشط" : "غير نشط"}
            />
          </Box>

          <Divider sx={{ my: 1.5 }} />

          {isCompact ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0,1fr))",
                  lg: "1fr"
                },
                gap: 1.2
              }}
            >
              {rows.map((row, index) => (
                <Paper
                  key={row.id}
                  variant="outlined"
                  sx={{
                    p: { xs: 1, sm: 1.15 },
                    borderColor: "rgba(5,117,70,.16)",
                    bgcolor: "#fff",
                    borderRadius: 2,
                    boxShadow: "0 4px 14px rgba(5,117,70,.05)"
                  }}
                >
                  <Stack sx={uiLayout.formGridSx} spacing={1}>
                    <Stack direction="row" spacing={1}>
                      <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                        fullWidth
                        label="رقم الحساب"
                        value={row.accountCode}
                        size="small"
                        InputProps={{
                          readOnly: true,
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                size="small"
                                onClick={() => openAccountLookup(index, "code")}
                                disabled={linkedToDocument}
                              >
                                <SearchIcon fontSize="small" />
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                       inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
                      <IconButton
                        color="error"
                        onClick={() => removeRow(index)}
                        disabled={linkedToDocument}
                      >
                        <DeleteOutlineIcon />
                      </IconButton>
                    </Stack>

                    <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                      label="اسم الحساب"
                      value={row.accountName}
                      size="small"
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              onClick={() => openAccountLookup(index, "name")}
                              disabled={linkedToDocument}
                            >
                              <SearchIcon fontSize="small" />
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                    />

                    <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                      label="البيان"
                      value={row.notes}
                      onChange={(e) => updateRow(index, "notes", e.target.value)}
                      size="small"
                      disabled={linkedToDocument}
                    />

                    <Stack sx={uiLayout.formGridSx} direction="row" spacing={1}>
                      <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                        label="مدين"
                        type="number"
                        value={row.debit}
                        onChange={(e) => updateRow(index, "debit", e.target.value)}
                        size="small"
                        fullWidth
                        disabled={linkedToDocument}
                        inputProps={{ min: 0, step: "0.01" , dir: "ltr" , style: { direction: "ltr", unicodeBidi: "isolate" } }}
                      />
                      <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                        label="دائن"
                        type="number"
                        value={row.credit}
                        onChange={(e) => updateRow(index, "credit", e.target.value)}
                        size="small"
                        fullWidth
                        disabled={linkedToDocument}
                        inputProps={{ min: 0, step: "0.01" , dir: "ltr" , style: { direction: "ltr", unicodeBidi: "isolate" } }}
                      />
                    </Stack>

                    <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                      label="مركز التكلفة"
                      value={row.costName}
                      size="small"
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              onClick={() => openCostLookup(index)}
                              disabled={linkedToDocument}
                            >
                              <SearchIcon fontSize="small" />
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                    />
                  </Stack>
                </Paper>
              ))}
            </Box>
          ) : (
            <TableContainer
              sx={uiLayout.withUiSx({
                border: `1px solid ${line}`,
                borderRadius: 2,
                overflowX: "auto"
              }, uiLayout.tableContainerSx)}
            >
              <Table
                size="small"
                sx={{
                  minWidth: isTablet ? 950 : 1100,
                  "& th": {
                    bgcolor: "#eaf3ef",
                    fontWeight: 900,
                    whiteSpace: "nowrap"
                  },
                  "& td": { verticalAlign: "middle" }
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 120 }}>رقم الحساب</TableCell>
                    <TableCell sx={{ minWidth: 220 }}>اسم الحساب</TableCell>
                    <TableCell sx={{ minWidth: 280 }}>البيان</TableCell>
                    <TableCell sx={{ width: 120 }}>مدين</TableCell>
                    <TableCell sx={{ width: 120 }}>دائن</TableCell>
                    <TableCell sx={{ minWidth: 180 }}>مركز تكلفة</TableCell>
                    <TableCell sx={{ width: 60 }} />
                  </TableRow>
                </TableHead>

                <TableBody>
                  {rows.map((row, index) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                          value={row.accountCode}
                          size="small"
                          fullWidth
                          InputProps={{
                            readOnly: true,
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  size="small"
                                  onClick={() => openAccountLookup(index, "code")}
                                  disabled={linkedToDocument}
                                >
                                  <SearchIcon fontSize="small" />
                                </IconButton>
                              </InputAdornment>
                            )
                          }}
                         inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
                      </TableCell>

                      <TableCell>
                        <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                          value={row.accountName}
                          size="small"
                          fullWidth
                          InputProps={{
                            readOnly: true,
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  size="small"
                                  onClick={() => openAccountLookup(index, "name")}
                                  disabled={linkedToDocument}
                                >
                                  <SearchIcon fontSize="small" />
                                </IconButton>
                              </InputAdornment>
                            )
                          }}
                        />
                      </TableCell>

                      <TableCell>
                        <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                          value={row.notes}
                          onChange={(e) => updateRow(index, "notes", e.target.value)}
                          size="small"
                          fullWidth
                          disabled={linkedToDocument}
                        />
                      </TableCell>

                      <TableCell>
                        <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                          type="number"
                          value={row.debit}
                          onChange={(e) => updateRow(index, "debit", e.target.value)}
                          size="small"
                          fullWidth
                          disabled={linkedToDocument}
                          inputProps={{ min: 0, step: "0.01" , dir: "ltr" , style: { direction: "ltr", unicodeBidi: "isolate" } }}
                        />
                      </TableCell>

                      <TableCell>
                        <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                          type="number"
                          value={row.credit}
                          onChange={(e) => updateRow(index, "credit", e.target.value)}
                          size="small"
                          fullWidth
                          disabled={linkedToDocument}
                          inputProps={{ min: 0, step: "0.01" , dir: "ltr" , style: { direction: "ltr", unicodeBidi: "isolate" } }}
                        />
                      </TableCell>

                      <TableCell>
                        <Button
                          fullWidth
                          variant="outlined"
                          onClick={() => openCostLookup(index)}
                          disabled={linkedToDocument}
                          sx={uiLayout.withUiSx({
                            justifyContent: "flex-start",
                            textTransform: "none",
                            color: row.costName ? primaryDark : "text.secondary"
                          }, uiLayout.buttonSx)}
                        >
                          {row.costName || "اختيار مركز تكلفة"}
                        </Button>
                      </TableCell>

                      <TableCell>
                        <Tooltip title="حذف السطر">
                          <span>
                            <IconButton
                              color="error"
                              onClick={() => removeRow(index)}
                              disabled={linkedToDocument}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Button
            startIcon={<AddIcon />}
            onClick={addRow}
            disabled={linkedToDocument}
            sx={uiLayout.withUiSx({ mt: 1.2, color: primary, fontWeight: 800 }, uiLayout.buttonSx)}
          >
            إضافة سطر
          </Button>

          <Box
            sx={{
              mt: 2,
              display: "grid",
              gridTemplateColumns: { xs: "repeat(3, 1fr)", sm: "repeat(3, 1fr)" },
              gap: 1
            }}
          >
            <Paper variant="outlined" sx={{ p: { xs: .8, sm: 1.2 }, textAlign: "center", borderRadius: 2 }}>
              <Typography variant="caption">إجمالي مدين</Typography>
              <Typography sx={{ fontWeight: 900, color: primaryDark }}>
                {money(totals.debit)}
              </Typography>
            </Paper>

            <Paper variant="outlined" sx={{ p: { xs: .8, sm: 1.2 }, textAlign: "center", borderRadius: 2 }}>
              <Typography variant="caption">إجمالي دائن</Typography>
              <Typography sx={{ fontWeight: 900, color: primaryDark }}>
                {money(totals.credit)}
              </Typography>
            </Paper>

            <Paper
              variant="outlined"
              sx={{
                p: 1.2,
                textAlign: "center",
                borderColor: totals.diff === 0 ? "#b8ddcb" : "#efb4b4"
              }}
            >
              <Typography variant="caption">فرق القيد</Typography>
              <Typography
                sx={{
                  fontWeight: 900,
                  color: totals.diff === 0 ? primary : "#c62828"
                }}
              >
                {money(totals.diff)}
              </Typography>
            </Paper>
          </Box>
        </Box>
      </Paper>

      {/* Accounts dialog */}
      <Dialog sx={uiLayout.dialogLayoutSx}
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        fullScreen={isMobile}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 900 }}>
          قائمة الحسابات
          <IconButton
            onClick={() => setAccountOpen(false)}
            sx={{ position: "absolute", left: 12, top: 10 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={uiLayout.withUiSx({ mb: 1.5 }, uiLayout.formGridSx)}
          >
            <TextField InputLabelProps={{ shrink: true }}
              select
              size="small"
              value={accountBy}
              onChange={(e) => setAccountBy(e.target.value)}
              sx={uiLayout.withUiSx({ minWidth: 150 }, uiLayout.formFieldSx)}
            >
              <MenuItem value="name">اسم الحساب</MenuItem>
              <MenuItem value="code">كود الحساب</MenuItem>
            </TextField>

            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
              autoFocus
              fullWidth
              size="small"
              value={accountSearch}
              onChange={(e) => setAccountSearch(e.target.value)}
              placeholder={
                accountBy === "name"
                  ? "اكتب اسم الحساب..."
                  : "اكتب كود الحساب..."
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Stack>

          {accountsLoading ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <TableContainer sx={uiLayout.tableContainerSx}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>كود الحساب</TableCell>
                    <TableCell>اسم الحساب</TableCell>
                    <TableCell>الحالة</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {accounts.map((a) => (
                    <TableRow
                      hover
                      key={`${a.guid}-${a.code}`}
                      onDoubleClick={() => chooseAccount(a)}
                      onClick={() => isMobile && chooseAccount(a)}
                      sx={{ cursor: "pointer" }}
                    >
                      <TableCell>{a.code}</TableCell>
                      <TableCell>{a.name}</TableCell>
                      <TableCell>
                        <Chip size="small" label="نشط" color="success" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>

      {/* Cost centers dialog */}
      <Dialog sx={uiLayout.dialogLayoutSx}
        open={costOpen}
        onClose={() => setCostOpen(false)}
        fullScreen={isMobile}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 900 }}>مراكز التكلفة</DialogTitle>
        <DialogContent dividers>
          <TextField InputLabelProps={{ shrink: true }}
            fullWidth
            size="small"
            value={costSearch}
            onChange={(e) => setCostSearch(e.target.value)}
            placeholder="بحث في مراكز التكلفة..."
            sx={uiLayout.withUiSx({ mb: 1.5 }, uiLayout.formFieldSx)}
          />

          <Stack spacing={0.8}>
            {costs
              .filter((c) =>
                `${c.name} ${c.code}`
                  .toLowerCase()
                  .includes(costSearch.toLowerCase())
              )
              .map((c) => (
                <Button
                  key={c.guid}
                  variant="outlined"
                  onClick={() => chooseCost(c)}
                  sx={uiLayout.withUiSx({
                    justifyContent: "space-between",
                    color: primaryDark,
                    borderColor: line
                  }, uiLayout.buttonSx)}
                >
                  <span>{c.name}</span>
                  <small>{c.code}</small>
                </Button>
              ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={uiLayout.dialogActionsSx}>
          <Button sx={uiLayout.buttonSx} onClick={() => setCostOpen(false)}>إغلاق</Button>
        </DialogActions>
      </Dialog>

      {/* Journal list */}
      <Dialog sx={uiLayout.dialogLayoutSx}
        open={listOpen}
        onClose={() => setListOpen(false)}
        fullScreen={isMobile}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 900 }}>
          قائمة قيود اليومية
          <IconButton
            onClick={() => setListOpen(false)}
            sx={{ position: "absolute", left: 12, top: 10 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <TextField InputLabelProps={{ shrink: true }}
            autoFocus
            fullWidth
            size="small"
            value={journalSearch}
            onChange={(e) => setJournalSearch(e.target.value)}
            placeholder="بحث برقم القيد أو البيان..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
            sx={uiLayout.withUiSx({ mb: 1.5 }, uiLayout.formFieldSx)}
          />

          {listLoading ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <CircularProgress size={28} />
            </Box>
          ) : isMobile ? (
            <Stack spacing={1}>
              {journalList.map((j) => (
                <Paper
                  variant="outlined"
                  key={j.guid}
                  sx={{ p: 1.2, borderColor: line }}
                  onClick={() => loadEntry(j.code)}
                >
                  <Stack direction="row" justifyContent="space-between">
                    <Typography sx={{ fontWeight: 900 }}>
                      قيد {j.code}
                    </Typography>
                    <Typography variant="body2">{displayGregorianDate(j.dayDate)}</Typography>
                  </Stack>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    {j.notes || "-"}
                  </Typography>
                </Paper>
              ))}
            </Stack>
          ) : (
            <TableContainer sx={uiLayout.tableContainerSx}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>رقم القيد</TableCell>
                    <TableCell>التاريخ</TableCell>
                    <TableCell>البيان</TableCell>
                    <TableCell>الحالة</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {journalList.map((j) => (
                    <TableRow hover key={j.guid}>
                      <TableCell>{j.code}</TableCell>
                      <TableCell>{displayGregorianDate(j.dayDate)}</TableCell>
                      <TableCell>{j.notes}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={j.isUse ? "نشط" : "غير نشط"}
                          color={j.isUse ? "success" : "default"}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton onClick={() => loadEntry(j.code)}>
                          <VisibilityIcon color="success" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>
      </Box>
    </Box></NavigationShell>
  );
}
