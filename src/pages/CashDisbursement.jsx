import { PRINT_READY_SCRIPT } from '../utils/printReady';
import PageContainer from '../components/common/PageContainer';
import * as uiLayout from '../components/common/uiLayout';
import './rtl-forms-fix.css';
import { DESKTOP_BREAKPOINT, navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert, AppBar, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, FormControlLabel, IconButton,
  InputAdornment, Paper, Stack, Switch, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Toolbar, Tooltip,
  Typography, useMediaQuery, useTheme
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import PrintIcon from "@mui/icons-material/Print";
import SaveIcon from "@mui/icons-material/Save";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Swal from "sweetalert2";



const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || "http://localhost:5258";


const primary = "#057546";
const primaryDark = "#034d31";
const soft = "#f7faf8";
const border = "#dce8e2";
const debounceMs = 550;

const getUser = () => {
  try { return JSON.parse(localStorage.getItem("user") || "{}"); }
  catch { return {}; }
};
const getUserGuid = (u) => u?.guid || u?.Guid || u?.userGuid || u?.UserGuid || u?.USER_GUID || u?.USER_GUID____ || "";
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
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
const id = () => {
  try {
    if (
      typeof window !== "undefined" &&
      window.crypto &&
      typeof window.crypto.randomUUID === "function"
    ) {
      return window.crypto.randomUUID();
    }
  } catch {
    // fallback below
  }

  return `${Date.now()}-${Math.random()}`;
};
const n = (v) => Number.isFinite(Number(v)) ? Number(v) : 0;
const money = (v) => n(v).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const LineCard = memo(function LineCard({ row, index, onChange, onDelete, onCost }) {
  return (
    <Paper variant="outlined" sx={{ p: 1, borderRadius: 2, borderColor: border }}>
      <Stack spacing={1}>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }} fullWidth size="small" label="الحساب" value={row.accountName} InputProps={{ readOnly: true }} />
          <IconButton color="error" onClick={() => onDelete(index)}><DeleteOutlineIcon /></IconButton>
        </Stack>
        <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }} size="small" label="البيان" value={row.notes} onChange={(e) => onChange(index, "notes", e.target.value)} />
        <Stack sx={uiLayout.filterBarSx} direction="row" spacing={1}>
          <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }} fullWidth size="small" type="number" label="المبلغ" value={row.amount}
            inputProps={{ min: 0, step: "0.01" , dir: "ltr" , style: { direction: "ltr", unicodeBidi: "isolate" } }} onChange={(e) => onChange(index, "amount", e.target.value)} />
          <Button fullWidth variant="outlined" onClick={() => onCost(index)} sx={uiLayout.withUiSx({ color: primary, borderColor: border }, uiLayout.buttonSx)}>
            {row.costName || "مركز التكلفة"}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
});

export default function CashDisbursement() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isDesktop = useMediaQuery(`(min-width:${DESKTOP_BREAKPOINT}px)`, { noSsr: true });
  const isCompact = !isDesktop;
  const user = useMemo(() => getUser(), []);
  const userGuid = useMemo(() => String(getUserGuid(user)).trim(), [user]);

  const [authorized, setAuthorized] = useState(false);
  const [permissionLoading, setPermissionLoading] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [guid, setGuid] = useState("");
  const [code, setCode] = useState("");
  const [day1Guid, setDay1Guid] = useState("");
  const [day1Code, setDay1Code] = useState("");
  const [date, setDate] = useState(today());
  const [cashBoxName, setCashBoxName] = useState("");
  const [cashBoxGuid, setCashBoxGuid] = useState("");
  const [cashBoxCostName, setCashBoxCostName] = useState("");
  const [cashBoxCostGuid, setCashBoxCostGuid] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [vendorTax, setVendorTax] = useState("");
  const [vendorTel, setVendorTel] = useState("");
  const [notes, setNotes] = useState("");
  const [isUse, setIsUse] = useState(true);
  const [rows, setRows] = useState([]);
  const [attachment, setAttachment] = useState(null);
  const [saving, setSaving] = useState(false);

  const [accountOpen, setAccountOpen] = useState(false);
  const [accountSearch, setAccountSearch] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);

  const [costOpen, setCostOpen] = useState(false);
  const [costRowIndex, setCostRowIndex] = useState(-1);
  const [costSearch, setCostSearch] = useState("");
  const [costs, setCosts] = useState([]);

  const [cashBoxOpen, setCashBoxOpen] = useState(false);
  const [cashBoxSearch, setCashBoxSearch] = useState("");
  const [cashBoxes, setCashBoxes] = useState([]);
  const [cashBoxesLoading, setCashBoxesLoading] = useState(false);
    const [cashBoxesError, setCashBoxesError] = useState("");

  const [listOpen, setListOpen] = useState(false);
  const [listSearch, setListSearch] = useState("");
  const [documents, setDocuments] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState("");

  const accountAbort = useRef(null);
  const cashAbort = useRef(null);
  const listAbort = useRef(null);
  const fileRef = useRef(null);

  const total = useMemo(() => rows.reduce((s, r) => s + n(r.amount), 0), [rows]);

  useEffect(() => {
    let alive = true;
    const norm = (v) => String(v ?? "").trim().toLowerCase();
    (async () => {
      try {
        if (!userGuid) return;
        const res = await fetch(`${API_BASE_URL}/api/user-permissions/${encodeURIComponent(userGuid)}`, { cache: "no-store" });
        const result = await res.json().catch(() => null);
        const data = result?.data || {};
        const direct = data?.generalAccounts?.canView === true && data?.generalAccounts?.screens?.cashDisbursement === true;
        const menu = Array.isArray(data?.menus) && data.menus.some(x => norm(x?.code) === "account" || norm(x?.name) === norm("الحسابات العامة"));
        const form = Array.isArray(data?.forms) && data.forms.some(x => norm(x?.code) === "15" || norm(x?.name) === norm("سند صرف") || norm(x?.guid) === "14a1c747-33ed-461e-a6ec-225eef21b54b");
        if (alive) setAuthorized(res.ok && (direct || (menu && form)));
      } catch { if (alive) setAuthorized(false); }
      finally { if (alive) setPermissionLoading(false); }
    })();
    return () => { alive = false; };
  }, [userGuid]);

  const reset = useCallback(() => {
    setGuid(""); setCode(""); setDay1Guid(""); setDay1Code(""); setDate(today());
    setCashBoxName(""); setCashBoxGuid(""); setCashBoxCostName(""); setCashBoxCostGuid("");
    setVendorName(""); setVendorTax(""); setVendorTel(""); setNotes(""); setIsUse(true); setRows([]); setAttachment(null);
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  const updateRow = useCallback((index, field, value) => {
    setRows(current => {
      const target = current[index];
      if (!target || target[field] === value) return current;
      const next = current.slice();
      next[index] = { ...target, [field]: value };
      return next;
    });
  }, []);
  const deleteRow = useCallback((index) => setRows(current => current.filter((_, i) => i !== index)), []);

  useEffect(() => {
    if (!accountOpen) { accountAbort.current?.abort(); return; }
    const q = accountSearch.trim();
    if (q.length < 2) { setAccounts([]); setAccountsLoading(false); return; }
    const t = setTimeout(async () => {
      accountAbort.current?.abort();
      const c = new AbortController(); accountAbort.current = c; setAccountsLoading(true);
      try {
        const p = new URLSearchParams({ userGuid, q });
        const res = await fetch(`${API_BASE_URL}/api/cash-disbursements/accounts?${p}`, { cache: "no-store", signal: c.signal });
        const result = await res.json().catch(() => null);
        if (res.ok && !c.signal.aborted) setAccounts(Array.isArray(result?.data) ? result.data : []);
      } catch (e) { if (e?.name !== "AbortError") setAccounts([]); }
      finally { if (!c.signal.aborted) setAccountsLoading(false); }
    }, debounceMs);
    return () => { clearTimeout(t); accountAbort.current?.abort(); };
  }, [accountOpen, accountSearch, userGuid]);

  const chooseAccount = useCallback((a) => {
    const type = String(a?.accountType ?? "");
    setRows(current => [...current, {
      id: id(), accountName: a?.name || "", accountGuid: a?.guid || "", accountType: type,
      notes: "", amount: "", costName: "",
      costGuid: type === "0" || type === "1" ? "" : "00000000-0000-0000-0000-000000000000"
    }]);
    setAccountOpen(false); setAccountSearch(""); setAccounts([]);
  }, []);

  const openCost = useCallback(async (index) => {
    const row = rows[index]; if (!row) return;
    if (row.accountType !== "0" && row.accountType !== "1") {
      await Swal.fire({ icon: "info", title: "هذا الحساب لا يحتاج مركز تكلفة" }); return;
    }
    setCostRowIndex(index); setCostOpen(true);
    if (costs.length) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/cash-disbursements/cost-centers?userGuid=${encodeURIComponent(userGuid)}`, { cache: "no-store" });
      const result = await res.json().catch(() => null);
      if (res.ok) setCosts(Array.isArray(result?.data) ? result.data : []);
    } catch { setCosts([]); }
  }, [rows, costs.length, userGuid]);

  const chooseCost = useCallback((cost) => {
    setRows(current => {
      if (costRowIndex < 0 || !current[costRowIndex]) return current;
      const next = current.slice();
      next[costRowIndex] = { ...next[costRowIndex], costName: cost?.name || "", costGuid: cost?.guid || "" };
      return next;
    });
    setCostOpen(false);
  }, [costRowIndex]);

  useEffect(() => {
    if (!cashBoxOpen) { cashAbort.current?.abort(); return; }

    const t = setTimeout(async () => {
      cashAbort.current?.abort();

      const c = new AbortController();
      cashAbort.current = c;

      setCashBoxesLoading(true);
      setCashBoxesError("");

      try {
        const p = new URLSearchParams({
          userGuid,
          q: cashBoxSearch.trim()
        });

        const res = await fetch(
          `${API_BASE_URL}/api/cash-disbursements/cash-boxes?${p}`,
          { cache: "no-store", signal: c.signal }
        );

        const raw = await res.text();

        let result = null;

        if (raw) {
          try {
            result = JSON.parse(raw);
          } catch {
            result = null;
          }
        }

        if (!res.ok) {
          throw new Error(
            result?.message ||
            result?.error ||
            result?.detail ||
            raw ||
            `تعذر تحميل الخزائن / البنوك (HTTP ${res.status})`
          );
        }

        if (!c.signal.aborted) {
          setCashBoxes(
            Array.isArray(result?.data)
              ? result.data
              : []
          );
        }
      } catch (e) {
        if (e?.name !== "AbortError") {
          setCashBoxes([]);
          setCashBoxesError(
            e?.message ||
            "تعذر تحميل الخزائن / البنوك"
          );
        }
      } finally {
        if (!c.signal.aborted) {
          setCashBoxesLoading(false);
        }
      }
    }, 250);

    return () => {
      clearTimeout(t);
      cashAbort.current?.abort();
    };
  }, [cashBoxOpen, cashBoxSearch, userGuid]);

  const chooseCashBox = useCallback((b) => {
    setCashBoxName(b?.name || "");
    setCashBoxGuid(b?.guid || "");
    setCashBoxCostName(b?.costName || "");
    setCashBoxCostGuid(b?.costGuid || "");
    setCashBoxOpen(false);
  }, []);

  useEffect(() => {
    if (!listOpen) {
      listAbort.current?.abort();
      return;
    }

    const t = setTimeout(async () => {
      listAbort.current?.abort();

      const c = new AbortController();
      listAbort.current = c;

      setListLoading(true);
      setListError("");

      try {
        const p = new URLSearchParams({
          userGuid,
          search: listSearch.trim()
        });

        const res = await fetch(
          `${API_BASE_URL}/api/cash-disbursements?${p}`,
          {
            cache: "no-store",
            signal: c.signal
          }
        );

        const raw = await res.text();

        let result = null;

        if (raw) {
          try {
            result = JSON.parse(raw);
          } catch {
            result = null;
          }
        }

        if (!res.ok) {
          throw new Error(
            result?.message ||
            result?.error ||
            result?.detail ||
            raw ||
            `تعذر تحميل سندات الصرف (HTTP ${res.status})`
          );
        }

        if (!c.signal.aborted) {
          setDocuments(
            Array.isArray(result?.data)
              ? result.data
              : []
          );
        }
      } catch (e) {
        if (e?.name !== "AbortError") {
          setDocuments([]);
          setListError(
            e?.message ||
            "تعذر تحميل سندات الصرف"
          );
        }
      } finally {
        if (!c.signal.aborted) {
          setListLoading(false);
        }
      }
    }, 350);

    return () => {
      clearTimeout(t);
      listAbort.current?.abort();
    };
  }, [listOpen, listSearch, userGuid]);

  const loadDocument = useCallback(async (selectedCode) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/cash-disbursements/${encodeURIComponent(selectedCode)}?userGuid=${encodeURIComponent(userGuid)}`, { cache: "no-store" });
      const result = await res.json().catch(() => null);
      if (!res.ok) throw new Error(result?.message || "تعذر تحميل سند الصرف");
      const d = result?.data || {};
      setGuid(d.guid || ""); setCode(String(d.code ?? "")); setDay1Guid(d.day1Guid || ""); setDay1Code(String(d.day1Code ?? ""));
      setDate(normalizeGregorianInput(d.date)); setCashBoxName(d.cashBoxName || ""); setCashBoxGuid(d.cashBoxGuid || "");
      setCashBoxCostName(d.costName || ""); setCashBoxCostGuid(d.costGuid || "");
      setVendorName(d.vendorName || ""); setVendorTax(d.vendorTax || ""); setVendorTel(d.vendorTel || "");
      setNotes(d.notes || ""); setIsUse(d.isUse !== false);
      setRows(Array.isArray(d.rows) ? d.rows.map(r => ({ id: id(), ...r, accountType: String(r.accountType ?? ""), amount: r.amount ?? "" })) : []);
      setAttachment(null); if (fileRef.current) fileRef.current.value = ""; setListOpen(false);
    } catch (e) { Swal.fire({ icon: "error", title: "تعذر تحميل سند الصرف", text: e?.message || "حدث خطأ" }); }
  }, [userGuid]);

  const validate = useCallback(() => {
    if (!isGregorianSqlDate(date))
      return "تاريخ سند الصرف يجب أن يكون تاريخًا ميلاديًا صحيحًا";

    if (!cashBoxGuid) return "برجاء اختيار الخزينة / البنك";
    if (!cashBoxCostGuid) return "الخزينة / البنك لا تحتوي على مركز تكلفة";
    if (!notes.trim()) return "برجاء إدخال ملاحظات سند الصرف";
    if (!rows.length) return "برجاء إضافة حساب واحد على الأقل";
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.accountGuid) return `يوجد صف بدون حساب - الصف ${i+1}`;
      if (!String(r.notes || "").trim()) return `أدخل البيان للصف ${i+1}`;
      if (n(r.amount) <= 0) return `المبلغ يجب أن يكون أكبر من صفر - الصف ${i+1}`;
      if ((r.accountType === "0" || r.accountType === "1") && !r.costGuid) return `حدد مركز التكلفة للصف ${i+1}`;
    }
    return total <= 0 ? "برجاء إدخال قيمة سند الصرف" : null;
  }, [date, cashBoxGuid, cashBoxCostGuid, notes, rows, total]);

  const save = useCallback(async () => {
    if (saving) return;
    const problem = validate();
    if (problem) { await Swal.fire({ icon: "warning", title: "راجع بيانات سند الصرف", text: problem }); return; }
    let reason = "";
    if (guid) {
      const r = await Swal.fire({ title: "سبب تعديل سند الصرف", input: "textarea", inputPlaceholder: "اكتب سبب التعديل...", showCancelButton: true,
        confirmButtonText: "حفظ التعديل", cancelButtonText: "رجوع", confirmButtonColor: primary,
        inputValidator: v => !String(v || "").trim() ? "سبب التعديل مطلوب" : undefined });
      if (!r.isConfirmed) return;
      reason = String(r.value || "").trim();
    }
    const payload = {
      userGuid, date: String(date), cashBoxGuid, cashBoxCostGuid, notes: notes.trim(), isUse,
      vendorName: vendorName.trim(), vendorTax: vendorTax.trim(), vendorTel: vendorTel.trim(), reason,
      rows: rows.map(r => ({ accountGuid: r.accountGuid, accountType: String(r.accountType ?? ""), amount: n(r.amount),
        notes: String(r.notes || "").trim(), costGuid: r.costGuid || "00000000-0000-0000-0000-000000000000" }))
    };
    const form = new FormData(); form.append("payload", JSON.stringify(payload)); if (attachment) form.append("attachment", attachment);
    setSaving(true);
    try {
      const res = await fetch(guid ? `${API_BASE_URL}/api/cash-disbursements/${encodeURIComponent(guid)}` : `${API_BASE_URL}/api/cash-disbursements`,
        { method: guid ? "PUT" : "POST", body: form });
      const raw = await res.text(); let result = null; try { result = raw ? JSON.parse(raw) : null; } catch {}
      if (!res.ok) {
        const parts = [
          result?.message,
          result?.error,
          result?.detail
        ].filter(Boolean);

        throw new Error(
          parts.length
            ? parts.join(" — ")
            : (raw || "تعذر حفظ سند الصرف")
        );
      }
      const d = result?.data || {};
      setGuid(d.guid || guid); setCode(String(d.code ?? code)); setDay1Guid(d.day1Guid || day1Guid); setDay1Code(String(d.day1Code ?? day1Code));
      setAttachment(null); if (fileRef.current) fileRef.current.value = "";
      await Swal.fire({ icon: "success", title: guid ? "تم تعديل سند الصرف" : "تم حفظ سند الصرف", html: d.code ? `رقم السند: <b>${d.code}</b>` : undefined, confirmButtonColor: primary });
    } catch (e) { await Swal.fire({ icon: "error", title: guid ? "تعذر التعديل" : "تعذر الحفظ", text: e?.message || "حدث خطأ" }); }
    finally { setSaving(false); }
  }, [saving, validate, guid, userGuid, date, cashBoxGuid, cashBoxCostGuid, notes, isUse, vendorName, vendorTax, vendorTel, rows, attachment, code, day1Guid, day1Code]);

  const printDoc = useCallback(async () => {
    if (!guid) { Swal.fire({ icon: "warning", title: "احفظ أو اختر سندًا أولًا" }); return; }
    try {
      const res = await fetch(`${API_BASE_URL}/api/cash-disbursements/${encodeURIComponent(guid)}/print?userGuid=${encodeURIComponent(userGuid)}`, { cache: "no-store" });
      const result = await res.json().catch(() => null); if (!res.ok) throw new Error(result?.message || "تعذر تحميل الطباعة");
      const w = window.open("", "_blank", "width=1100,height=800"); if (!w) throw new Error("المتصفح منع نافذة الطباعة");
      const body = rows.map(r => `<tr><td>${r.accountName}</td><td>${r.notes}</td><td>${money(r.amount)}</td><td>${r.costName || ""}</td></tr>`).join("");
      w.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>سند صرف ${code}</title><style>@page { size: A4 portrait; margin: 10mm; }body{font-family:Arial,Tahoma;padding:28px}h1{text-align:center;color:${primary}}table{width:100%;border-collapse:collapse}th,td{border:1px solid #bbb;padding:8px;text-align:center}th{background:#eef6f2}.box{border:1px solid #ccc;padding:10px;margin:8px 0}.total{font-size:20px;font-weight:bold}</style>${PRINT_READY_SCRIPT}</head><body><h1>سند صرف رقم ${code}</h1><div class="box">التاريخ: ${date} | الخزينة/البنك: ${cashBoxName} | الإجمالي: ${money(total)}</div><div class="box">المورد: ${vendorName || "-"} | الرقم الضريبي: ${vendorTax || "-"} | الهاتف: ${vendorTel || "-"}</div><div class="box"><b>ملاحظات:</b> ${notes}</div><table><thead><tr><th>الحساب</th><th>البيان</th><th>المبلغ</th><th>مركز التكلفة</th></tr></thead><tbody>${body}</tbody></table><div class="total">الإجمالي: ${money(total)}</div><div class="box"><b>التفقيط:</b> ${result?.data?.tafkeet || ""}</div><script>window.onload=()=>printWhenReady()</script></body></html>`);
      w.document.close();
    } catch (e) { Swal.fire({ icon: "error", title: "تعذر الطباعة", text: e?.message || "حدث خطأ" }); }
  }, [guid, userGuid, code, date, cashBoxName, total, vendorName, vendorTax, vendorTel, notes, rows]);

  if (permissionLoading) return <Box sx={{ minHeight: "70vh", display: "grid", placeItems: "center" }}><CircularProgress sx={{ color: primary }} /></Box>;
  if (!authorized) return <Box sx={{ p: 2 }}><Alert severity="error">لا توجد لديك صلاحية سند صرف ضمن الحسابات العامة.</Alert></Box>;

  return (
    <NavigationShell variant="standard" mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)}><Box dir="rtl" sx={{ minHeight: "100vh", bgcolor: soft, fontFamily: '"Cairo","Tahoma",sans-serif' }}>
      {!isDesktop && <AppBar position="sticky" sx={{ bgcolor: primary }}><Toolbar variant="dense"><IconButton color="inherit" onClick={() => setMobileSidebarOpen(true)}><MenuRoundedIcon /></IconButton><Typography sx={{ flex: 1, fontWeight: 900 }}>سند صرف</Typography><Chip size="small" label={code ? `سند ${code}` : "جديد"} sx={{ bgcolor: "white", color: primaryDark, fontWeight: 900 }} /></Toolbar></AppBar>}
      

      <PageContainer sx={{
        
        minWidth: 0,
        ...navigationContentSx
      }}>
        <Paper elevation={0} sx={{ border: `1px solid ${border}`, borderRadius: 3, overflow: "hidden" }}>
          <Box sx={{ background: `linear-gradient(135deg,${primary},${primaryDark})`, color: "white", p: 1.5, display: "flex", justifyContent: "space-between", flexWrap: "wrap" }}>
            <Box><Typography sx={{ fontWeight: 950, fontSize: 22 }}>سند صرف</Typography><Typography sx={{ opacity: .85, fontSize: 12 }}>الحسابات العامة — إنشاء وتعديل وطباعة سندات الصرف</Typography></Box>
            <Chip label={code ? `رقم السند: ${code}` : "سند جديد"} sx={{ bgcolor: "white", color: primaryDark, fontWeight: 900 }} />
          </Box>
          <Box sx={{ p: { xs: 1, sm: 1.5 } }}>
            <Box sx={uiLayout.withUiSx({ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4,minmax(120px,1fr))", lg: "repeat(4,150px)" }, gap: 1, mb: 1.5 }, uiLayout.actionBarSx)}>
              <Button variant="contained" startIcon={<AddIcon />} onClick={reset} sx={uiLayout.withUiSx({ bgcolor: primary, fontWeight: 900 }, uiLayout.buttonSx)}>جديد</Button>
              <Button variant="outlined" startIcon={<SearchIcon />} onClick={() => setListOpen(true)} sx={uiLayout.withUiSx({ color: primary, borderColor: primary, fontWeight: 900 }, uiLayout.buttonSx)}>بحث عن سند</Button>
              <Button variant="contained" startIcon={saving ? <CircularProgress size={17} color="inherit" /> : <SaveIcon />} disabled={saving} onClick={save} sx={uiLayout.withUiSx({ bgcolor: primary, fontWeight: 900 }, uiLayout.buttonSx)}>{guid ? "حفظ التعديل" : "حفظ"}</Button>
              <Button variant="outlined" startIcon={<PrintIcon />} disabled={!guid} onClick={printDoc} sx={uiLayout.withUiSx({ fontWeight: 900 }, uiLayout.buttonSx)}>طباعة</Button>
            </Box>

            <Box sx={uiLayout.withUiSx({ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "150px 180px minmax(220px,1fr)", lg: "150px 190px minmax(220px,1fr) minmax(260px,1fr)" }, gap: 1, mb: 1 }, uiLayout.formSectionSx)}>
              <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }} size="small" label="رقم السند" value={code} InputProps={{ readOnly: true }}  inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
              <TextField sx={uiLayout.formFieldSx}
                size="small"
                type="date"
                label="التاريخ الميلادي"
                value={date}
                onChange={e => setDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  min: "1753-01-01",
                  max: "9999-12-31",
                  dir: "ltr"
                }}
              />
              <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }} size="small" label="الخزينة / البنك" value={cashBoxName} InputProps={{ readOnly: true, endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={() => setCashBoxOpen(true)}><SearchIcon fontSize="small" /></IconButton></InputAdornment> }} />
              <TextField InputLabelProps={{ shrink: true }} size="small" label="ملاحظات" value={notes} onChange={e => setNotes(e.target.value)} sx={uiLayout.withUiSx({ gridColumn: { xs: "1 / -1", lg: "auto" } }, uiLayout.formFieldSx)} />
              <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }} size="small" label="المورد" value={vendorName} onChange={e => setVendorName(e.target.value)} />
              <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }} size="small" label="الرقم الضريبي" value={vendorTax} onChange={e => setVendorTax(e.target.value)} />
              <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }} size="small" label="رقم الهاتف" value={vendorTel} onChange={e => setVendorTel(e.target.value)} />
              <FormControlLabel sx={uiLayout.withUiSx({ m: 0, border: `1px solid ${border}`, borderRadius: 1, px: 1 }, uiLayout.checkboxFieldSx)} control={<Switch checked={isUse} onChange={e => setIsUse(e.target.checked)} />} label={isUse ? "نشط" : "غير نشط"} />
            </Box>

            <Box sx={uiLayout.withUiSx({ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 190px" }, gap: 1, mb: 1.5 }, uiLayout.filterBarSx)}>
              <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }} size="small" label="مركز تكلفة الخزينة / البنك" value={cashBoxCostName || cashBoxCostGuid} InputProps={{ readOnly: true }}  inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
              <Button component="label" variant="outlined" startIcon={<AttachFileIcon />} sx={uiLayout.withUiSx({ color: primary, borderColor: primary, fontWeight: 800 }, uiLayout.buttonSx)}>
                {attachment ? attachment.name : "المرفق"}
                <input ref={fileRef} hidden type="file" accept=".pdf,.jpg,.jpeg" onChange={e => setAttachment(e.target.files?.[0] || null)} />
              </Button>
            </Box>

            <Divider sx={{ my: 1 }} />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} sx={{ mb: 1 }}>
              <Button startIcon={<AddIcon />} onClick={() => setAccountOpen(true)} sx={uiLayout.withUiSx({ color: primary, fontWeight: 900 }, uiLayout.buttonSx)}>إضافة حساب</Button>
              <Paper variant="outlined" sx={{ px: 2, py: .7, minWidth: 180, textAlign: "center" }}><Typography variant="caption">الإجمالي</Typography><Typography sx={{ fontWeight: 950, color: primaryDark, fontSize: 18 }}>{money(total)}</Typography></Paper>
            </Stack>

            {!rows.length && <Alert severity="info" sx={{ mb: 1 }}>أضف حسابًا واحدًا أو أكثر لسند الصرف.</Alert>}

            {isCompact ? (
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,minmax(0,1fr))", lg: "1fr" }, gap: 1 }}>
                {rows.map((row, index) => <LineCard key={row.id} row={row} index={index} onChange={updateRow} onDelete={deleteRow} onCost={openCost} />)}
              </Box>
            ) : (
              <TableContainer sx={uiLayout.withUiSx({ border: `1px solid ${border}`, borderRadius: 2 }, uiLayout.tableContainerSx)}><Table size="small"><TableHead><TableRow sx={{ "& th": { bgcolor: "#eaf3ef", fontWeight: 950 } }}><TableCell>الحساب</TableCell><TableCell>البيان</TableCell><TableCell sx={{ width: 140 }}>المبلغ</TableCell><TableCell sx={{ width: 220 }}>مركز التكلفة</TableCell><TableCell sx={{ width: 55 }} /></TableRow></TableHead><TableBody>
                {rows.map((row, index) => <TableRow key={row.id}><TableCell><b>{row.accountName}</b></TableCell><TableCell><TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }} fullWidth size="small" value={row.notes} onChange={e => updateRow(index, "notes", e.target.value)} /></TableCell><TableCell><TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }} fullWidth size="small" type="number" inputProps={{ min: 0, step: ".01" , dir: "ltr" , style: { direction: "ltr", unicodeBidi: "isolate" } }} value={row.amount} onChange={e => updateRow(index, "amount", e.target.value)} /></TableCell><TableCell><Button fullWidth variant="outlined" onClick={() => openCost(index)} sx={uiLayout.withUiSx({ color: primary, borderColor: border }, uiLayout.buttonSx)}>{row.costName || "اختيار"}</Button></TableCell><TableCell><Tooltip title="حذف"><IconButton color="error" onClick={() => deleteRow(index)}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip></TableCell></TableRow>)}
              </TableBody></Table></TableContainer>
            )}
          </Box>
        </Paper>
      </PageContainer>

      <Dialog sx={uiLayout.dialogLayoutSx} open={accountOpen} onClose={() => setAccountOpen(false)} fullScreen={isMobile} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>قائمة الحسابات<IconButton onClick={() => setAccountOpen(false)} sx={{ position: "absolute", left: 12, top: 10 }}><CloseIcon /></IconButton></DialogTitle>
        <DialogContent dividers><TextField InputLabelProps={{ shrink: true }} autoFocus fullWidth size="small" value={accountSearch} onChange={e => setAccountSearch(e.target.value)} placeholder="اكتب حرفين على الأقل من اسم الحساب..." InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} sx={uiLayout.withUiSx({ mb: 1 }, uiLayout.formFieldSx)} />
          {accountsLoading ? <Box sx={{ p: 4, textAlign: "center" }}><CircularProgress size={28} /></Box> : <Stack spacing={.7}>{accounts.map(a => <Button key={a.guid} variant="outlined" onClick={() => chooseAccount(a)} sx={uiLayout.withUiSx({ justifyContent: "flex-start", color: primaryDark, borderColor: border }, uiLayout.buttonSx)}>{a.name}</Button>)}</Stack>}
        </DialogContent>
      </Dialog>

      <Dialog sx={uiLayout.dialogLayoutSx} open={cashBoxOpen} onClose={() => setCashBoxOpen(false)} fullScreen={isMobile} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>قائمة الخزائن / البنوك</DialogTitle>
        <DialogContent dividers><TextField InputLabelProps={{ shrink: true }} autoFocus fullWidth size="small" value={cashBoxSearch} onChange={e => setCashBoxSearch(e.target.value)} placeholder="بحث..." sx={uiLayout.withUiSx({ mb: 1 }, uiLayout.formFieldSx)} />
          {cashBoxesLoading ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <CircularProgress size={28} />
            </Box>
          ) : cashBoxesError ? (
            <Alert severity="error">{cashBoxesError}</Alert>
          ) : cashBoxes.length === 0 ? (
            <Alert severity="warning">
              لم يتم العثور على خزائن / بنوك نشطة.
            </Alert>
          ) : (
            <Stack spacing={.6}>
              {cashBoxes.map((b, index) => (
                <Button
                  key={b.guid || `${b.code}-${index}`}
                  variant="outlined"
                  onClick={() => chooseCashBox(b)}
                  sx={uiLayout.withUiSx({
                    justifyContent: "space-between",
                    color: primaryDark,
                    borderColor: border
                  }, uiLayout.buttonSx)}
                >
                  <span>{b.name}</span>
                  <small>
                    {b.status}
                    {b.costName ? ` - ${b.costName}` : ""}
                  </small>
                </Button>
              ))}
            </Stack>
          )}
        </DialogContent><DialogActions sx={uiLayout.dialogActionsSx}><Button sx={uiLayout.buttonSx} onClick={() => setCashBoxOpen(false)}>إغلاق</Button></DialogActions>
      </Dialog>

      <Dialog sx={uiLayout.dialogLayoutSx} open={costOpen} onClose={() => setCostOpen(false)} fullScreen={isMobile} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>مراكز التكلفة</DialogTitle>
        <DialogContent dividers><TextField InputLabelProps={{ shrink: true }} fullWidth size="small" value={costSearch} onChange={e => setCostSearch(e.target.value)} placeholder="بحث..." sx={uiLayout.withUiSx({ mb: 1 }, uiLayout.formFieldSx)} />
          <Stack spacing={.6}>{costs.filter(c => `${c.name} ${c.code}`.toLowerCase().includes(costSearch.toLowerCase())).map(c => <Button key={c.guid} variant="outlined" onClick={() => chooseCost(c)} sx={uiLayout.withUiSx({ justifyContent: "space-between", color: primaryDark, borderColor: border }, uiLayout.buttonSx)}><span>{c.name}</span><small>{c.code}</small></Button>)}</Stack>
        </DialogContent><DialogActions sx={uiLayout.dialogActionsSx}><Button sx={uiLayout.buttonSx} onClick={() => setCostOpen(false)}>إغلاق</Button></DialogActions>
      </Dialog>

      <Dialog sx={uiLayout.dialogLayoutSx} open={listOpen} onClose={() => setListOpen(false)} fullScreen={isMobile} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>سندات الصرف</DialogTitle>
        <DialogContent dividers><TextField InputLabelProps={{ shrink: true }} autoFocus fullWidth size="small" value={listSearch} onChange={e => setListSearch(e.target.value)} placeholder="بحث بالحساب أو الوصف..." sx={uiLayout.withUiSx({ mb: 1 }, uiLayout.formFieldSx)} />
          {listLoading ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <CircularProgress size={28} />
            </Box>
          ) : listError ? (
            <Alert severity="error">
              {listError}
            </Alert>
          ) : documents.length === 0 ? (
            <Alert severity="info">
              لا توجد سندات صرف مطابقة للبحث.
            </Alert>
          ) : isMobile ? (
            <Stack spacing={.8}>
              {documents.map(d => (
                <Paper
                  key={d.guid || d.code}
                  variant="outlined"
                  onClick={() => loadDocument(d.code)}
                  sx={{ p: 1, cursor: "pointer" }}
                >
                  <Stack direction="row" justifyContent="space-between">
                    <b>سند {d.code}</b>
                    <span>{displayGregorianDate(d.date)}</span>
                  </Stack>

                  <Typography variant="body2" sx={{ fontWeight: 800 }}>
                    {d.account}
                  </Typography>

                  <Typography variant="caption" sx={{ display: "block", mt: .4 }}>
                    {d.description || "-"}
                  </Typography>

                  <Chip
                    size="small"
                    label={d.status || "-"}
                    sx={{ mt: .7, height: 22 }}
                  />
                </Paper>
              ))}
            </Stack>
          ) : (
            <TableContainer sx={uiLayout.tableContainerSx}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>كود</TableCell>
                    <TableCell>التاريخ</TableCell>
                    <TableCell>الحساب</TableCell>
                    <TableCell>الوصف</TableCell>
                    <TableCell>الحالة</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>

                <TableBody>
                  {documents.map(d => (
                    <TableRow hover key={d.guid || d.code}>
                      <TableCell>{d.code}</TableCell>
                      <TableCell>{displayGregorianDate(d.date)}</TableCell>
                      <TableCell>{d.account}</TableCell>
                      <TableCell>{d.description}</TableCell>
                      <TableCell>{d.status}</TableCell>
                      <TableCell>
                        <IconButton onClick={() => loadDocument(d.code)}>
                          <VisibilityIcon color="success" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent><DialogActions sx={uiLayout.dialogActionsSx}><Button sx={uiLayout.buttonSx} onClick={() => setListOpen(false)}>إغلاق</Button></DialogActions>
      </Dialog>
    </Box></NavigationShell>
  );
}
