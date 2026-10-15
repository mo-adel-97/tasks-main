import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import SearchIcon from "@mui/icons-material/Search";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import PrintIcon from "@mui/icons-material/Print";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import EditIcon from "@mui/icons-material/Edit";
import UndoIcon from "@mui/icons-material/Undo";
import Swal from "sweetalert2";
import * as uiLayout from "../components/common/uiLayout";
import OfferPriceEditBeforePreviewDialog from "../components/offerPrice/OfferPriceEditBeforePreviewDialog";
import OfferPricePreviewDialog from "../components/offerPrice/OfferPricePreviewDialog";
import {
  OFFER_MODES,
  OFFER_MODE_COUNT,
  OFFER_MODE_ITEMS,
  OFFER_MODE_TRAINEES,
  applyItemEdit,
  applyTraineePrice,
  buildPrintServices,
  buildPrintTrainees,
  computeTotals,
  defaultPrintTexts,
  emptyTrainee,
  itemFromService,
  newRowId,
  serviceNames,
  syncItemsFromTrainees,
  toNum
} from "../components/offerPrice/offerPriceCalc";

/*
  شاشة "عرض سعر" — نقل EncodingOfferPrice من الديسكتوب (قائمة ملف).
  الصلاحية من إضافة مستخدم (عرض سعر - كود 52): العرض يفتح الشاشة، والإضافة تسمح بالحفظ.
  بعد الحفظ: تعديل قبل المعاينة ← معاينة ← طباعة / PDF (نفس PRINTOFFERPRICE).
*/

const API_BASE_URL = process.env.REACT_APP_API_URL || "https://api4.sstli.com";
const OFFER_API = `${API_BASE_URL}/api/offer-price`;

const primaryColor = "#057546";
const primaryDark = "#034d31";
const accentColor = "#ae1e21";

const getUserGuid = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return String(user?.guid || user?.Guid || user?.userGuid || user?.UserGuid || user?.USER_GUID____ || "").trim();
  } catch {
    return "";
  }
};

const readJson = async (response, fallback) => {
  const json = await response.json().catch(() => null);
  if (!response.ok) throw new Error(json?.message || json?.error || fallback);
  return json;
};

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const emptyHeader = () => ({
  code: "",
  offerDate: todayIso(),
  offerTitle: "عرض سعر",
  offerMode: OFFER_MODE_ITEMS,
  companyName: "",
  contactName: "",
  contactTel: "",
  email: "",
  address: "",
  accountNo: "",
  ibanNo: "",
  isUse: true,
  userName: ""
});

const money = (value) =>
  Number(toNum(value)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const showError = (text) => Swal.fire({ icon: "error", title: "خطأ", text, confirmButtonText: "حسناً", confirmButtonColor: accentColor });
const showWarning = (text) => Swal.fire({ icon: "warning", title: "تنبيه", text, confirmButtonText: "حسناً", confirmButtonColor: accentColor });

// خانة رقمية بتتحسب لما المستخدم يخلص (زي CellEndEdit في الديسكتوب).
const CellInput = ({ value, onCommit, disabled, text = false, width = 90 }) => {
  const [draft, setDraft] = useState(value ?? "");
  useEffect(() => setDraft(value ?? ""), [value]);

  const commit = () => {
    if (String(draft) !== String(value ?? "")) onCommit(draft);
  };

  return (
    <TextField
      value={draft}
      disabled={disabled}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
      size="small"
      sx={{ minWidth: width, "& .MuiInputBase-input": { textAlign: "center", fontWeight: 800, py: 0.6 } }}
      inputProps={{ dir: text ? "rtl" : "ltr", inputMode: text ? "text" : "decimal" }}
    />
  );
};

const ReadCell = ({ children }) => (
  <Typography sx={{ fontWeight: 800, textAlign: "center", whiteSpace: "nowrap", fontSize: "0.85rem" }}>{children}</Typography>
);

const headCellSx = {
  fontWeight: 900,
  whiteSpace: "nowrap",
  textAlign: "center",
  background: primaryColor,
  color: "#fff",
  py: 1
};

// ===================== خدمة جديدة (AddDiplom + AddPriceListDiplom) =====================
const STUDY_TYPES = ["دبلوم", "دورة تأهيلية", "دورة تطويرية", "بدون"];
const TAX_TYPES = ["ضريبة القيمة المضافة 15%", "الضريبة الصفرية", "الضريبة المعفاة"];
const emptyNewService = () => ({ name: "", unit: "", studyType: 0, taxType: 0, unitCost: "", includesTax: false });

const NewServiceDialog = ({ open, onClose, onCreated, userGuid }) => {
  const [form, setForm] = useState(emptyNewService);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm(emptyNewService());
    setError("");
  }, [open]);

  // الدورات التأهيلية والتطويرية ضريبتها دايمًا 15%.
  const taxLocked = form.studyType === 1 || form.studyType === 2;
  const taxType = taxLocked ? 0 : form.taxType;
  const price = toNum(form.unitCost);
  const taxRate = taxType === 0 ? 15 : 0;
  // نفس حساب الباك إند: لو السعر شامل الضريبة الإجمالي بيفضل زي ما اتكتب.
  const taxValue = form.includesTax
    ? Math.round((price * taxRate * 100) / (100 + taxRate)) / 100
    : Math.round(price * taxRate) / 100;
  const unitCost = form.includesTax ? price - taxValue : price;
  const set = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const save = async () => {
    if (!form.name.trim()) return setError("برجاء إدخال اسم الخدمة");
    if (price <= 0) return setError("برجاء إدخال سعر الخدمة");
    try {
      setSaving(true);
      setError("");
      const json = await readJson(
        await fetch(`${OFFER_API}/services`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userGuid,
            name: form.name.trim(),
            unit: form.unit.trim(),
            studyType: form.studyType,
            taxType,
            unitCost: price,
            priceIncludesTax: form.includesTax
          })
        }),
        "تعذر إضافة الخدمة"
      );
      onCreated(json.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="xs" PaperProps={{ sx: { direction: "rtl" } }}>
      <DialogTitle sx={{ fontWeight: 900, color: "#fff", background: `linear-gradient(135deg, ${primaryColor}, ${primaryDark})` }}>
        خدمة جديدة
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5}>
          {error ? <Alert severity="error" sx={{ fontWeight: 800 }}>{error}</Alert> : null}
          <TextField label="اسم الخدمة *" value={form.name} onChange={(e) => set("name", e.target.value)} size="small" fullWidth autoFocus inputProps={{ maxLength: 150 }} />
          <TextField label="الوحدة" value={form.unit} onChange={(e) => set("unit", e.target.value)} size="small" fullWidth inputProps={{ maxLength: 50 }} />
          <FormControl size="small" fullWidth>
            <InputLabel>نوع الخدمة</InputLabel>
            <Select label="نوع الخدمة" value={form.studyType} onChange={(e) => set("studyType", Number(e.target.value))}>
              {STUDY_TYPES.map((t, i) => <MenuItem key={t} value={i}>{t}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth disabled={taxLocked}>
            <InputLabel>الضريبة</InputLabel>
            <Select label="الضريبة" value={taxType} onChange={(e) => set("taxType", Number(e.target.value))}>
              {TAX_TYPES.map((t, i) => <MenuItem key={t} value={i}>{t}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth>
            <InputLabel>السعر المكتوب</InputLabel>
            <Select label="السعر المكتوب" value={form.includesTax ? 1 : 0} onChange={(e) => set("includesTax", e.target.value === 1)}>
              <MenuItem value={0}>قبل الضريبة</MenuItem>
              <MenuItem value={1}>شامل الضريبة (الإجمالي)</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label={form.includesTax ? "الإجمالي شامل الضريبة *" : "السعر قبل الضريبة *"}
            value={form.unitCost}
            onChange={(e) => set("unitCost", e.target.value)}
            size="small"
            fullWidth
            type="number"
            inputProps={{ min: 0, step: "0.01" }}
          />
          <Stack direction="row" justifyContent="space-between" sx={{ px: 0.5, flexWrap: "wrap", gap: 1 }}>
            <Typography sx={{ fontWeight: 800 }}>قبل الضريبة: {money(unitCost)}</Typography>
            <Typography sx={{ fontWeight: 800 }}>الضريبة: {money(taxValue)}</Typography>
            <Typography sx={{ fontWeight: 900, color: primaryColor }}>الإجمالي: {money(unitCost + taxValue)}</Typography>
          </Stack>
          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
            الخدمة هتتسجل في السيستم وتتضاف لقائمة أسعار عروض السعر، فهتظهر في العروض الجاية كمان.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving} sx={{ fontWeight: 900, color: accentColor }}>إلغاء</Button>
        <Button
          variant="contained"
          onClick={save}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
          sx={{ fontWeight: 900, backgroundColor: primaryColor, "&:hover": { backgroundColor: primaryDark } }}
        >
          حفظ وإضافة للعرض
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ===================== اختيار الخدمات (AddServicesOfferPrice) =====================
const ServicesPickerDialog = ({ open, onClose, onSelect, userGuid, canAdd }) => {
  const [newOpen, setNewOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setSelected([]);
    setSearch("");
    setError("");
    setLoading(true);

    fetch(`${OFFER_API}/services?userGuid=${encodeURIComponent(userGuid)}`, { cache: "no-store" })
      .then((r) => readJson(r, "تعذر تحميل الخدمات"))
      .then((json) => setServices(Array.isArray(json?.data) ? json.data : []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [open, userGuid]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? services.filter((s) => `${s.name} ${s.code}`.toLowerCase().includes(q)) : services;
  }, [services, search]);

  const toggle = (guid) => setSelected((prev) => (prev.includes(guid) ? prev.filter((g) => g !== guid) : [...prev, guid]));

  const confirm = (list) => {
    if (!list.length) return;
    onSelect(list);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { direction: "rtl" } }}>
      <DialogTitle sx={{ fontWeight: 900, color: "#fff", background: `linear-gradient(135deg, ${primaryColor}, ${primaryDark})` }}>
        إضافة خدمة لعرض السعر
      </DialogTitle>
      <DialogContent dividers>
        <TextField
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث باسم الخدمة"
          fullWidth
          size="small"
          sx={{ mb: 1.5 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
        />
        {error ? <Alert severity="error" sx={{ fontWeight: 800 }}>{error}</Alert> : null}
        {loading ? (
          <Stack alignItems="center" sx={{ py: 4 }}><CircularProgress sx={{ color: primaryColor }} /></Stack>
        ) : (
          <Box sx={{ maxHeight: 420, overflowY: "auto" }}>
            {filtered.map((s) => (
              <Stack
                key={s.guid}
                direction="row"
                alignItems="center"
                onClick={() => toggle(s.guid)}
                onDoubleClick={() => confirm([s])}
                sx={{
                  px: 1,
                  py: 0.5,
                  cursor: "pointer",
                  borderBottom: "1px solid #eef2f0",
                  "&:hover": { background: "#f1f8f4" }
                }}
              >
                <Checkbox checked={selected.includes(s.guid)} size="small" sx={{ color: primaryColor }} />
                <Typography sx={{ fontWeight: 800, flex: 1 }}>{s.name}</Typography>
                <Typography sx={{ fontWeight: 800, color: primaryColor, whiteSpace: "nowrap" }}>{money(s.total)}</Typography>
              </Stack>
            ))}
            {!filtered.length && !error ? (
              <Typography sx={{ textAlign: "center", py: 3, color: "text.secondary", fontWeight: 700 }}>لا توجد خدمات</Typography>
            ) : null}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        {canAdd ? (
          <Button
            startIcon={<AddIcon />}
            onClick={() => setNewOpen(true)}
            sx={{ fontWeight: 900, color: primaryColor, ml: "auto" }}
          >
            خدمة جديدة
          </Button>
        ) : null}
        <Button onClick={onClose} sx={{ fontWeight: 900, color: accentColor }}>إلغاء</Button>
        <Button
          variant="contained"
          disabled={!selected.length}
          onClick={() => confirm(services.filter((s) => selected.includes(s.guid)))}
          sx={{ fontWeight: 900, backgroundColor: primaryColor, "&:hover": { backgroundColor: primaryDark } }}
        >
          إضافة ({selected.length})
        </Button>
      </DialogActions>
      <NewServiceDialog
        open={newOpen}
        onClose={() => setNewOpen(false)}
        userGuid={userGuid}
        onCreated={(service) => {
          setNewOpen(false);
          // الخدمة الجديدة + أي خدمات كانت متعلّم عليها تتضاف للعرض مع بعض.
          confirm([...services.filter((s) => selected.includes(s.guid)), service]);
        }}
      />
    </Dialog>
  );
};

// ===================== البحث عن عرض سعر (OfferPriceList) =====================
const OfferListDialog = ({ open, onClose, onPick, userGuid }) => {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(
    async (q = "") => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ userGuid });
        if (q.trim()) params.set("search", q.trim());
        const json = await readJson(await fetch(`${OFFER_API}/list?${params}`, { cache: "no-store" }), "تعذر تحميل عروض الأسعار");
        setRows(Array.isArray(json?.data) ? json.data : []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    },
    [userGuid]
  );

  useEffect(() => {
    if (open) {
      setSearch("");
      load();
    }
  }, [open, load]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ sx: { direction: "rtl" } }}>
      <DialogTitle sx={{ fontWeight: 900, color: "#fff", background: `linear-gradient(135deg, ${primaryColor}, ${primaryDark})` }}>
        عروض الأسعار
      </DialogTitle>
      <DialogContent dividers>
        <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
          <TextField
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load(search)}
            placeholder="رقم العرض أو اسم الجهة أو الجوال"
            fullWidth
            size="small"
          />
          <Button variant="contained" onClick={() => load(search)} sx={{ fontWeight: 900, backgroundColor: primaryColor, "&:hover": { backgroundColor: primaryDark } }}>
            بحث
          </Button>
        </Stack>
        {error ? <Alert severity="error" sx={{ fontWeight: 800, mb: 1 }}>{error}</Alert> : null}
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {["رقم العرض", "التاريخ", "الجهة / الشركة", "الجوال", "الإجمالي", "المستخدم", "الحالة"].map((h) => (
                  <TableCell key={h} sx={headCellSx}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} sx={{ textAlign: "center", py: 3 }}><CircularProgress size={26} sx={{ color: primaryColor }} /></TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow><TableCell colSpan={7} sx={{ textAlign: "center", fontWeight: 700, color: "text.secondary" }}>لا توجد عروض</TableCell></TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.code} hover onClick={() => onPick(r.code)} sx={{ cursor: "pointer" }}>
                    <TableCell sx={{ textAlign: "center", fontWeight: 900 }}>{r.code}</TableCell>
                    <TableCell sx={{ textAlign: "center" }}>{r.offerDate ? String(r.offerDate).slice(0, 10) : "-"}</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>{r.companyName || "-"}</TableCell>
                    <TableCell sx={{ textAlign: "center" }} dir="ltr">{r.contactTel || "-"}</TableCell>
                    <TableCell sx={{ textAlign: "center", fontWeight: 800 }}>{money(r.offerSubTotal)}</TableCell>
                    <TableCell sx={{ textAlign: "center" }}>{r.userName || "-"}</TableCell>
                    <TableCell sx={{ textAlign: "center" }}>
                      <Chip size="small" label={r.isUse ? "نشط" : "ملغي"} color={r.isUse ? "success" : "default"} sx={{ fontWeight: 800 }} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ fontWeight: 900, color: accentColor }}>إغلاق</Button>
      </DialogActions>
    </Dialog>
  );
};

// ===================== الشاشة =====================
const OfferPricePage = () => {
  const userGuid = useMemo(() => getUserGuid(), []);

  const [permissions, setPermissions] = useState({ view: false, add: false, loading: true });
  const [header, setHeader] = useState(emptyHeader);
  const [items, setItems] = useState([]);
  const [trainees, setTrainees] = useState([]);
  const [traineesCount, setTraineesCount] = useState("");
  const [savedCode, setSavedCode] = useState("");
  // التعديل متاح لمنشئ العرض فقط (canEdit راجعة من الباك).
  const [canEdit, setCanEdit] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingOffer, setLoadingOffer] = useState(false);

  const [servicesOpen, setServicesOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [editDoc, setEditDoc] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);

  const readOnly = Boolean(savedCode) && !editing;
  const mode = Number(header.offerMode);
  const totals = useMemo(() => computeTotals(items), [items]);
  const specOptions = useMemo(() => serviceNames(items), [items]);

  useEffect(() => {
    if (!userGuid) {
      setPermissions({ view: false, add: false, loading: false });
      return;
    }
    fetch(`${OFFER_API}/permissions?userGuid=${encodeURIComponent(userGuid)}`, { cache: "no-store" })
      .then((r) => readJson(r, "تعذر قراءة الصلاحيات"))
      .then((json) => setPermissions({ view: Boolean(json?.view), add: Boolean(json?.add), loading: false }))
      .catch(() => setPermissions({ view: false, add: false, loading: false }));
  }, [userGuid]);

  const setField = (name, value) => setHeader((prev) => ({ ...prev, [name]: value }));

  // ===== البنود =====
  const addServices = (list) => {
    setItems((prev) => {
      const next = [...prev, ...list.map(itemFromService)];
      return mode === OFFER_MODE_TRAINEES ? syncItemsFromTrainees(next, trainees) : next;
    });
  };

  const commitItem = (id, field, value) => {
    const next = items.map((item) => (item.id === id ? applyItemEdit(item, field, value) : item));
    if (mode !== OFFER_MODE_TRAINEES) {
      setItems(next);
      return;
    }
    // تغيير تكلفة البند بيغيّر سعر المتدربين على نفس التخصص.
    const repriced = trainees.map((t) => applyTraineePrice(t, next));
    setTrainees(repriced);
    setItems(syncItemsFromTrainees(next, repriced));
  };

  const removeItem = (id) => {
    setItems((prev) => {
      const next = prev.filter((item) => item.id !== id);
      return mode === OFFER_MODE_TRAINEES ? syncItemsFromTrainees(next, trainees) : next;
    });
  };

  // ===== المتدربين (عرض تفصيلي - أسماء) =====
  const commitTrainee = (id, field, value) => {
    const next = trainees.map((t) => {
      if (t.id !== id) return t;
      const updated = { ...t, [field]: value };
      return ["specialization", "discountPercent", "paidAmount", "priceBeforeDiscount"].includes(field)
        ? applyTraineePrice(updated, items)
        : updated;
    });
    setTrainees(next);
    setItems((prev) => syncItemsFromTrainees(prev, next));
  };

  const addTrainee = () => setTrainees((prev) => [...prev, emptyTrainee()]);

  const removeTrainee = (id) => {
    const next = trainees.filter((t) => t.id !== id);
    setTrainees(next);
    setItems((prev) => syncItemsFromTrainees(prev, next));
  };

  // ===== نوع العرض / العدد =====
  const changeMode = (value) => {
    setField("offerMode", value);
    if (value === OFFER_MODE_TRAINEES) {
      setItems((prev) => syncItemsFromTrainees(prev, trainees));
    }
    if (value !== OFFER_MODE_COUNT) setTraineesCount("");
  };

  // ApplyCountModeQtyToPayGrid: لو فيه بند واحد بس، الكمية = عدد المتدربين.
  const changeCount = (value) => {
    const clean = value.replace(/[^\d.]/g, "");
    setTraineesCount(clean);
    const qty = toNum(clean);
    if (qty <= 0) return;
    setItems((prev) => {
      const real = prev.filter((item) => item.serviceGuid);
      if (real.length !== 1) return prev;
      return prev.map((item) => (item.id === real[0].id ? applyItemEdit(item, "qty", qty) : item));
    });
  };

  // ===== جديد =====
  const resetForm = () => {
    setHeader(emptyHeader());
    setItems([]);
    setTrainees([]);
    setTraineesCount("");
    setSavedCode("");
    setCanEdit(false);
    setEditing(false);
  };

  // ===== تحميل عرض محفوظ (CmdFind_Click) =====
  const fillFromOffer = (data, ownerCanEdit = false) => {
    const h = data?.header || {};
    setHeader({
      code: h.code || "",
      offerDate: h.offerDate ? String(h.offerDate).slice(0, 10) : todayIso(),
      offerTitle: h.offerTitle || "عرض سعر",
      offerMode: Number(h.offerMode || 0),
      companyName: h.companyName || "",
      contactName: h.contactName || "",
      contactTel: h.contactTel || "",
      email: h.email || "",
      address: h.address || "",
      accountNo: h.accountNo || "",
      ibanNo: h.ibanNo || "",
      isUse: h.isUse !== false,
      userName: h.userName || ""
    });
    setItems((data?.items || []).map((i) => ({ ...i, id: newRowId() })));
    setTrainees((data?.trainees || []).map((t) => ({ ...t, id: newRowId() })));
    setTraineesCount(Number(h.traineesCount) > 0 ? String(h.traineesCount) : "");
    setSavedCode(h.code || "");
    setCanEdit(Boolean(ownerCanEdit));
    setEditing(false);
  };

  const loadOffer = async (code) => {
    setListOpen(false);
    try {
      setLoadingOffer(true);
      const json = await readJson(
        await fetch(`${OFFER_API}/${encodeURIComponent(code)}?userGuid=${encodeURIComponent(userGuid)}`, { cache: "no-store" }),
        "تعذر تحميل عرض السعر"
      );
      fillFromOffer(json?.data, json?.canEdit);
    } catch (e) {
      showError(e.message);
    } finally {
      setLoadingOffer(false);
    }
  };

  // ===== الحفظ (CmdSave_Click → VALIDATE_DATA → FORSAVE) =====
  const validate = () => {
    if (!header.companyName.trim()) return "برجاء إدخال اسم الجهة / الشركة";
    if (!items.some((i) => i.serviceGuid)) return "برجاء إضافة بند واحد على الأقل في عرض السعر";

    if (mode === OFFER_MODE_TRAINEES) {
      const named = trainees.filter((t) => String(t.traineeName || "").trim());
      if (!named.length) return "برجاء إدخال اسم متدرب واحد على الأقل أو اختيار عرض بنود فقط";
      for (const t of named) {
        if (!String(t.specialization || "").trim()) return `برجاء اختيار التخصص للمتدرب: ${t.traineeName}`;
        if (!specOptions.includes(String(t.specialization).trim())) {
          return `تخصص المتدرب لازم يكون من بنود الخدمات المضافة في العرض: ${t.traineeName}`;
        }
      }
    }

    if (mode === OFFER_MODE_COUNT) {
      const count = toNum(traineesCount) > 0 ? toNum(traineesCount) : items.reduce((s, i) => s + toNum(i.qty), 0);
      if (count <= 0) return "برجاء إدخال إجمالي عدد المتدربين أو وضع الكميات في جدول البنود";
    }

    return "";
  };

  const buildDoc = (code, sourceItems = items, sourceTrainees = trainees) => ({
    code,
    offerMode: mode,
    companyName: header.companyName.trim(),
    offerTitle: header.offerTitle.trim() || "عرض سعر",
    texts: defaultPrintTexts(header.companyName.trim()),
    services: buildPrintServices(sourceItems),
    trainees: mode === OFFER_MODE_TRAINEES ? buildPrintTrainees(sourceTrainees) : []
  });

  const handleSave = async () => {
    if (readOnly) return;
    const isUpdate = Boolean(savedCode) && editing;
    if (isUpdate && !canEdit) {
      showWarning("تعديل عرض السعر متاح فقط للمستخدم اللي أنشأه");
      return;
    }
    if (!isUpdate && !permissions.add) {
      showWarning("ليس لديك صلاحية إضافة عرض سعر");
      return;
    }

    const message = validate();
    if (message) {
      showWarning(message);
      return;
    }

    const finalTrainees = mode === OFFER_MODE_TRAINEES ? trainees.map((t) => applyTraineePrice(t, items)) : [];
    const finalItems = mode === OFFER_MODE_TRAINEES ? syncItemsFromTrainees(items, finalTrainees) : items;

    try {
      setSaving(true);
      const json = await readJson(
        await fetch(isUpdate ? `${OFFER_API}/${encodeURIComponent(savedCode)}` : OFFER_API, {
          method: isUpdate ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userGuid,
            offerDate: header.offerDate || null,
            isUse: header.isUse,
            offerMode: mode,
            companyName: header.companyName.trim(),
            contactName: header.contactName,
            contactTel: header.contactTel,
            email: header.email,
            address: header.address,
            offerTitle: header.offerTitle,
            accountNo: header.accountNo,
            ibanNo: header.ibanNo,
            traineesCount: mode === OFFER_MODE_COUNT ? toNum(traineesCount) : 0,
            items: finalItems
              .filter((i) => i.serviceGuid)
              .map((i) => ({
                serviceGuid: i.serviceGuid,
                serviceName: i.serviceName,
                unit: i.unit,
                qty: toNum(i.qty),
                unitCost: toNum(i.unitCost),
                taxRate: toNum(i.taxRate),
                taxValue: toNum(i.taxValue),
                total: toNum(i.total),
                discountPercent: toNum(i.discountPercent),
                priceAfterDiscount: toNum(i.priceAfterDiscount),
                paidAmount: toNum(i.paidAmount),
                remainingAmount: toNum(i.remainingAmount)
              })),
            trainees: finalTrainees.filter((t) => String(t.traineeName || "").trim())
          })
        }),
        isUpdate ? "تعذر تعديل عرض السعر" : "تعذر حفظ عرض السعر"
      );

      if (json?.data) fillFromOffer(json.data, json?.canEdit);
      else {
        setSavedCode(json?.code || "");
        setEditing(false);
      }

      const next = await Swal.fire({
        icon: "success",
        title: json?.message || (isUpdate ? "تم تعديل عرض السعر بنجاح" : "تم حفظ عرض السعر بنجاح"),
        text: `رقم العرض: ${json?.code || ""}`,
        showCancelButton: true,
        confirmButtonText: "معاينة وطباعة",
        cancelButtonText: "تمام",
        confirmButtonColor: primaryColor
      });

      if (next.isConfirmed) {
        const savedItems = (json?.data?.items || finalItems).map((i) => ({ ...i, id: newRowId() }));
        const savedTrainees = (json?.data?.trainees || finalTrainees).map((t) => ({ ...t, id: newRowId() }));
        setEditDoc(buildDoc(json?.code || "", savedItems, savedTrainees));
      }
    } catch (e) {
      showError(e.message);
    } finally {
      setSaving(false);
    }
  };

  // إلغاء التعديل: نرجّع العرض زي ما هو محفوظ.
  const cancelEdit = () => {
    if (savedCode) loadOffer(savedCode);
    else setEditing(false);
  };

  const openPreview = () => {
    if (!savedCode || editing) return;
    setEditDoc(buildDoc(savedCode));
  };

  if (permissions.loading) {
    return (
      <Stack alignItems="center" sx={{ py: 8 }}>
        <CircularProgress sx={{ color: primaryColor }} />
      </Stack>
    );
  }

  if (!permissions.view) {
    return (
      <Box sx={{ p: 3, direction: "rtl" }}>
        <Alert severity="warning" sx={{ fontWeight: 900 }}>ليس لديك صلاحية على شاشة عرض السعر</Alert>
      </Box>
    );
  }

  const textField = (name, label, props = {}) => (
    <TextField
      label={label}
      value={header[name] ?? ""}
      onChange={(e) => setField(name, e.target.value)}
      disabled={readOnly}
      fullWidth
      size="small"
      InputLabelProps={{ shrink: true }}
      sx={uiLayout.formFieldSx}
      {...props}
    />
  );

  const itemNumberCell = (item, field, width = 90) => (
    <TableCell sx={{ p: 0.5 }}>
      <CellInput value={item[field]} disabled={readOnly} width={width} onCommit={(v) => commitItem(item.id, field, v)} />
    </TableCell>
  );

  return (
    <Box sx={{ direction: "rtl", p: { xs: 1, md: 2 } }}>
      {/* العنوان والأزرار */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.2, md: 2 },
          mb: 2,
          borderRadius: 3,
          border: "1px solid #dfe7e3",
          display: "flex",
          flexWrap: "wrap",
          gap: 1.5,
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <Stack direction="row" spacing={1.2} alignItems="center">
          <RequestQuoteIcon sx={{ color: primaryColor, fontSize: 34 }} />
          <Box>
            <Typography sx={{ fontWeight: 950, fontSize: "1.2rem", color: primaryColor }}>عرض سعر</Typography>
            <Typography sx={{ fontWeight: 700, fontSize: "0.8rem", color: "text.secondary" }}>
              {savedCode
                ? `${editing ? "تعديل " : ""}عرض رقم ${savedCode}${header.userName ? ` — ${header.userName}` : ""}`
                : "عرض سعر جديد"}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button variant="outlined" startIcon={<NoteAddIcon />} onClick={resetForm} disabled={saving} sx={{ fontWeight: 900, borderColor: primaryColor, color: primaryColor }}>
            جديد
          </Button>
          <Button variant="outlined" startIcon={<SearchIcon />} onClick={() => setListOpen(true)} disabled={saving} sx={{ fontWeight: 900, borderColor: primaryColor, color: primaryColor }}>
            بحث
          </Button>
          {savedCode && canEdit && !editing ? (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setEditing(true)}
              disabled={saving || loadingOffer}
              sx={{ fontWeight: 900, borderColor: "#b26a00", color: "#b26a00" }}
            >
              تعديل
            </Button>
          ) : null}
          {editing ? (
            <Button
              variant="outlined"
              startIcon={<UndoIcon />}
              onClick={cancelEdit}
              disabled={saving}
              sx={{ fontWeight: 900, borderColor: "#9e9e9e", color: "text.secondary" }}
            >
              إلغاء التعديل
            </Button>
          ) : null}
          <Tooltip
            title={
              editing
                ? ""
                : !permissions.add
                  ? "ليس لديك صلاحية إضافة عرض سعر"
                  : readOnly
                    ? canEdit ? "اضغط تعديل لتعديل العرض" : "العرض محفوظ — اضغط جديد لعرض آخر"
                    : ""
            }
          >
            <span>
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                onClick={handleSave}
                disabled={saving || readOnly || (!editing && !permissions.add)}
                sx={{ fontWeight: 900, backgroundColor: primaryColor, "&:hover": { backgroundColor: primaryDark } }}
              >
                {editing ? "حفظ التعديل" : "حفظ"}
              </Button>
            </span>
          </Tooltip>
          <Tooltip title={!savedCode ? "احفظ العرض الأول" : editing ? "احفظ التعديل الأول" : ""}>
            <span>
              <Button
                variant="contained"
                startIcon={<PrintIcon />}
                onClick={openPreview}
                disabled={!savedCode || editing}
                sx={{ fontWeight: 900, backgroundColor: "#1f4e79", "&:hover": { backgroundColor: "#173a5a" } }}
              >
                معاينة وطباعة
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Paper>

      {loadingOffer ? (
        <Stack alignItems="center" sx={{ py: 6 }}><CircularProgress sx={{ color: primaryColor }} /></Stack>
      ) : (
        <>
          {/* بيانات العرض */}
          <Paper elevation={0} sx={{ p: { xs: 1.2, md: 2 }, mb: 2, borderRadius: 3, border: "1px solid #dfe7e3" }}>
            <Grid container spacing={1.5}>
              <Grid item xs={6} md={2}>{textField("code", "رقم العرض", { disabled: true, placeholder: "تلقائي", value: savedCode })}</Grid>
              <Grid item xs={6} md={2}>{textField("offerDate", "التاريخ", { type: "date" })}</Grid>
              <Grid item xs={12} md={4}>{textField("offerTitle", "عنوان العرض")}</Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small" sx={uiLayout.formFieldSx}>
                  <InputLabel shrink>نوع العرض</InputLabel>
                  <Select value={mode} label="نوع العرض" disabled={readOnly} onChange={(e) => changeMode(Number(e.target.value))} notched>
                    {OFFER_MODES.map((m) => (
                      <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>{textField("companyName", "اسم الجهة / الشركة *")}</Grid>
              <Grid item xs={12} md={4}>{textField("contactName", "اسم المسؤول")}</Grid>
              <Grid item xs={6} md={2}>{textField("contactTel", "الجوال", { inputProps: { dir: "ltr" } })}</Grid>
              <Grid item xs={6} md={2}>{textField("email", "الإيميل", { inputProps: { dir: "ltr" } })}</Grid>
              <Grid item xs={12} md={mode === OFFER_MODE_COUNT ? 6 : 8}>{textField("address", "العنوان")}</Grid>
              {mode === OFFER_MODE_COUNT ? (
                <Grid item xs={12} md={2}>
                  <TextField
                    label="عدد المتدربين"
                    value={traineesCount}
                    onChange={(e) => changeCount(e.target.value)}
                    disabled={readOnly}
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ dir: "ltr", inputMode: "numeric" }}
                    sx={{ ...uiLayout.formFieldSx, "& .MuiInputBase-root": { background: "#fff8dc" } }}
                  />
                </Grid>
              ) : null}
              <Grid item xs={6} md={2}>{textField("accountNo", "رقم الحساب (اختياري)", { inputProps: { dir: "ltr" } })}</Grid>
              <Grid item xs={6} md={2}>{textField("ibanNo", "الآيبان (اختياري)", { inputProps: { dir: "ltr" } })}</Grid>
            </Grid>
          </Paper>

          {/* البنود */}
          <Paper elevation={0} sx={{ p: { xs: 1, md: 2 }, mb: 2, borderRadius: 3, border: "1px solid #dfe7e3" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography sx={{ fontWeight: 950, color: primaryColor }}>بنود العرض</Typography>
              <Button startIcon={<AddIcon />} onClick={() => setServicesOpen(true)} disabled={readOnly} sx={{ fontWeight: 900, color: primaryColor }}>
                إضافة بند
              </Button>
            </Stack>
            <TableContainer sx={{ border: "1px solid #e3ebe7", borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {["الكود", "الخدمة", "الوحدة", "الكمية", "التكلفة", "نسبة الضريبة %", "قيمة الضريبة", "الإجمالي", "نسبة الخصم %", "بعد الخصم", "المدفوع", "المتبقي", ""].map((h, i) => (
                      <TableCell key={i} sx={headCellSx}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={13} sx={{ textAlign: "center", py: 3, fontWeight: 700, color: "text.secondary" }}>
                        لم تتم إضافة بنود بعد
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell><ReadCell>{item.serviceCode}</ReadCell></TableCell>
                        <TableCell sx={{ minWidth: 200 }}><Typography sx={{ fontWeight: 800, fontSize: "0.85rem" }}>{item.serviceName}</Typography></TableCell>
                        <TableCell><ReadCell>{item.unit}</ReadCell></TableCell>
                        {itemNumberCell(item, "qty", 70)}
                        {itemNumberCell(item, "unitCost")}
                        {itemNumberCell(item, "taxRate", 75)}
                        {itemNumberCell(item, "taxValue")}
                        {itemNumberCell(item, "total", 100)}
                        {itemNumberCell(item, "discountPercent", 75)}
                        {itemNumberCell(item, "priceAfterDiscount", 100)}
                        {itemNumberCell(item, "paidAmount")}
                        {itemNumberCell(item, "remainingAmount")}
                        <TableCell sx={{ p: 0.5 }}>
                          <IconButton size="small" color="error" disabled={readOnly} onClick={() => removeItem(item.id)}>
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Grid container spacing={1.5} sx={{ mt: 1 }}>
              {[
                ["إجمالي التكلفة", totals.totalCost],
                ["إجمالي الضريبة", totals.totalTax],
                ["الإجمالي بعد الخصم", totals.totalAfterDiscount]
              ].map(([label, value]) => (
                <Grid item xs={12} sm={4} key={label}>
                  <Paper elevation={0} sx={{ p: 1.2, borderRadius: 2, background: "#f1f8f4", border: "1px solid #d5ebdf", textAlign: "center" }}>
                    <Typography sx={{ fontWeight: 800, fontSize: "0.8rem", color: "text.secondary" }}>{label}</Typography>
                    <Typography sx={{ fontWeight: 950, fontSize: "1.15rem", color: primaryColor }}>{money(value)}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* أسماء المتدربين */}
          {mode === OFFER_MODE_TRAINEES ? (
            <Paper elevation={0} sx={{ p: { xs: 1, md: 2 }, mb: 2, borderRadius: 3, border: "1px solid #dfe7e3" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography sx={{ fontWeight: 950, color: primaryColor }}>
                  أسماء المتدربين - اختر التخصص من الخدمات، واكتب نسبة الخصم % والمدفوع فقط
                </Typography>
                <Button startIcon={<AddIcon />} onClick={addTrainee} disabled={readOnly} sx={{ fontWeight: 900, color: primaryColor }}>
                  إضافة متدرب
                </Button>
              </Stack>
              <TableContainer sx={{ border: "1px solid #e3ebe7", borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {["اسم المتدرب", "رقم الهوية", "الجوال", "التخصص", "الحالة الدراسية", "السعر قبل الخصم", "نسبة الخصم %", "السعر بعد الخصم", "المدفوع", "المتبقي", "ملاحظات", ""].map((h, i) => (
                        <TableCell key={i} sx={headCellSx}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {trainees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={12} sx={{ textAlign: "center", py: 3, fontWeight: 700, color: "text.secondary" }}>
                          اضغط "إضافة متدرب" لإدخال الأسماء
                        </TableCell>
                      </TableRow>
                    ) : (
                      trainees.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell sx={{ p: 0.5 }}><CellInput text width={160} value={t.traineeName} disabled={readOnly} onCommit={(v) => commitTrainee(t.id, "traineeName", v)} /></TableCell>
                          <TableCell sx={{ p: 0.5 }}><CellInput width={110} value={t.nationalId} disabled={readOnly} onCommit={(v) => commitTrainee(t.id, "nationalId", v)} /></TableCell>
                          <TableCell sx={{ p: 0.5 }}><CellInput width={110} value={t.tel} disabled={readOnly} onCommit={(v) => commitTrainee(t.id, "tel", v)} /></TableCell>
                          <TableCell sx={{ p: 0.5, minWidth: 180 }}>
                            <Select
                              value={specOptions.includes(t.specialization) ? t.specialization : ""}
                              displayEmpty
                              disabled={readOnly}
                              size="small"
                              fullWidth
                              onChange={(e) => commitTrainee(t.id, "specialization", e.target.value)}
                              sx={{ fontWeight: 800 }}
                            >
                              <MenuItem value="">اختر التخصص</MenuItem>
                              {specOptions.map((name) => (
                                <MenuItem key={name} value={name}>{name}</MenuItem>
                              ))}
                            </Select>
                          </TableCell>
                          <TableCell sx={{ p: 0.5 }}><CellInput text width={110} value={t.studyStatus} disabled={readOnly} onCommit={(v) => commitTrainee(t.id, "studyStatus", v)} /></TableCell>
                          <TableCell><ReadCell>{money(t.priceBeforeDiscount)}</ReadCell></TableCell>
                          <TableCell sx={{ p: 0.5 }}><CellInput width={75} value={t.discountPercent} disabled={readOnly} onCommit={(v) => commitTrainee(t.id, "discountPercent", v)} /></TableCell>
                          <TableCell><ReadCell>{money(t.priceAfterDiscount)}</ReadCell></TableCell>
                          <TableCell sx={{ p: 0.5 }}><CellInput width={90} value={t.paidAmount} disabled={readOnly} onCommit={(v) => commitTrainee(t.id, "paidAmount", v)} /></TableCell>
                          <TableCell><ReadCell>{money(t.remainingAmount)}</ReadCell></TableCell>
                          <TableCell sx={{ p: 0.5 }}><CellInput text width={140} value={t.notes} disabled={readOnly} onCommit={(v) => commitTrainee(t.id, "notes", v)} /></TableCell>
                          <TableCell sx={{ p: 0.5 }}>
                            <IconButton size="small" color="error" disabled={readOnly} onClick={() => removeTrainee(t.id)}>
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          ) : null}

          {readOnly ? (
            <Alert severity="info" sx={{ fontWeight: 800 }}>
              {canEdit
                ? 'العرض محفوظ. لتعديله اضغط "تعديل"، وللمعاينة والطباعة اضغط "معاينة وطباعة"، ولعرض جديد اضغط "جديد".'
                : 'العرض محفوظ، والتعديل متاح لمنشئ العرض فقط. للمعاينة والطباعة اضغط "معاينة وطباعة"، ولعرض جديد اضغط "جديد".'}
            </Alert>
          ) : null}
        </>
      )}

      <ServicesPickerDialog open={servicesOpen} onClose={() => setServicesOpen(false)} onSelect={addServices} userGuid={userGuid} canAdd={permissions.add} />
      <OfferListDialog open={listOpen} onClose={() => setListOpen(false)} onPick={loadOffer} userGuid={userGuid} />
      <OfferPriceEditBeforePreviewDialog
        open={Boolean(editDoc)}
        initialDoc={editDoc}
        onClose={() => setEditDoc(null)}
        onPreview={(doc) => {
          setEditDoc(null);
          setPreviewDoc(doc);
        }}
      />
      <OfferPricePreviewDialog open={Boolean(previewDoc)} doc={previewDoc} onClose={() => setPreviewDoc(null)} />
    </Box>
  );
};

export default OfferPricePage;
