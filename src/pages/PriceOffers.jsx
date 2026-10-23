// العروض والأسعار — الإعدادات العامة.
// - العروض: سعر نهائي لدبلوم/دورة في فروع محددة بين تاريخين، وطلب الالتحاق بيطبقه تلقائيًا.
// - أسعار الفروع: قائمة الأسعار اللي طلب الالتحاق بيستخدمها لكل فرع، وتعديلها (سعر سعر أو سعر واحد لكذا بند).
// - العروض القديمة: قوائم التسويق القديمة (اسمها وأسعارها وإيقافها).
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
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
  FormControlLabel,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  alpha,
  useMediaQuery,
  useTheme
} from "@mui/material";
import LocalOfferRoundedIcon from "@mui/icons-material/LocalOfferRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Swal from "sweetalert2";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || "https://api4.sstli.com";
const GREEN = "#057546";
const GREEN_DARK = "#034d31";
const ORANGE = "#e65100";
const ORANGE_LIGHT = "#ff9800";

const money = (v) => Number(v || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });

const getUserGuid = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return String(user?.guid || user?.Guid || "").trim();
  } catch {
    return "";
  }
};

const REG_TYPES = [
  { value: 0, label: "الدبلومات" },
  { value: 1, label: "الدورات التأهيلية" },
  { value: 2, label: "الدورات التطويرية" }
];

const STUDY_MODES = [
  { value: "0", label: "حضوري" },
  { value: "1", label: "عن بعد" },
  { value: "both", label: "حضوري وعن بعد" }
];
const studyModeLabel = (m) => (m === 0 ? "حضوري" : m === 1 ? "عن بعد" : "حضوري وعن بعد");

const round2 = (v) => Math.round((Number(v) + Number.EPSILON) * 100) / 100;
const netFromTotal = (total, vat) => (total === "" || total == null ? "" : round2(Number(total) / (1 + Number(vat || 0) / 100)));
const totalFromNet = (net, vat) => (net === "" || net == null ? "" : round2(Number(net) * (1 + Number(vat || 0) / 100)));

const STATUS = {
  running: { label: "ساري الآن", color: "success" },
  scheduled: { label: "مجدول", color: "info" },
  ended: { label: "منتهي", color: "default" },
  disabled: { label: "موقوف", color: "warning" }
};

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}/api/price-offers${path}`, {
    cache: "no-store",
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      result?.message ||
        (response.status === 404 ? "الخدمة غير متاحة على الخادم بعد (404) — تأكد من رفع ملفات الباك إند" : `حدث خطأ (${response.status})`)
    );
  }
  return result;
}

const confirmBox = async (title, text, confirmButtonText = "تأكيد") =>
  (
    await Swal.fire({
      icon: "question",
      title,
      text,
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText: "إلغاء",
      confirmButtonColor: GREEN,
      reverseButtons: true
    })
  ).isConfirmed;

const toast = (icon, title, text) => Swal.fire({ icon, title, text, confirmButtonText: "حسنًا", confirmButtonColor: GREEN });

// ألوان وأشكال مشتركة متوافقة مع الوضع الفاتح والداكن
function useUi() {
  const theme = useTheme();
  const dark = theme.palette.mode === "dark";
  return useMemo(
    () => ({
      theme,
      dark,
      card: {
        borderRadius: 3,
        border: `1px solid ${alpha(dark ? "#67C99D" : GREEN, dark ? 0.22 : 0.14)}`,
        bgcolor: "background.paper",
        boxShadow: dark ? "none" : "0 6px 22px rgba(3,77,49,.06)"
      },
      headRow: {
        "& th": {
          fontWeight: 900,
          whiteSpace: "nowrap",
          color: dark ? "#d7f5e6" : GREEN_DARK,
          bgcolor: dark ? alpha("#67C99D", 0.14) : alpha(GREEN, 0.07),
          borderBottom: `1px solid ${alpha(dark ? "#67C99D" : GREEN, 0.25)}`
        }
      },
      bodyRow: {
        "& td": { borderColor: alpha(dark ? "#ffffff" : GREEN, dark ? 0.08 : 0.08) },
        "&:hover td": { bgcolor: alpha(dark ? "#67C99D" : GREEN, dark ? 0.06 : 0.035) }
      },
      offerText: dark ? "#ffb74d" : ORANGE,
      offerSoft: alpha(ORANGE_LIGHT, dark ? 0.16 : 0.1),
      greenSoft: alpha(dark ? "#67C99D" : GREEN, dark ? 0.14 : 0.07),
      greenText: dark ? "#8fe0b8" : GREEN_DARK,
      primaryBtn: { fontWeight: 900, bgcolor: GREEN, color: "#fff", "&:hover": { bgcolor: GREEN_DARK } },
      offerBtn: { fontWeight: 900, color: "#fff", background: `linear-gradient(135deg,${ORANGE},${ORANGE_LIGHT})`, "&:hover": { background: `linear-gradient(135deg,#bf4300,${ORANGE})` } },
      dialogPaper: { borderRadius: { xs: 0, md: 3 }, bgcolor: "background.default", backgroundImage: "none" }
    }),
    [theme, dark]
  );
}

function DialogHeader({ title, subtitle, onClose, tone = "offer" }) {
  return (
    <DialogTitle
      sx={{
        color: "#fff",
        py: 1.5,
        background: tone === "offer" ? `linear-gradient(135deg,${ORANGE},${ORANGE_LIGHT})` : `linear-gradient(135deg,${GREEN},${GREEN_DARK})`
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 900, fontSize: 18 }} noWrap>
            {title}
          </Typography>
          {subtitle ? <Typography sx={{ fontSize: 12.5, opacity: 0.92 }}>{subtitle}</Typography> : null}
        </Box>
        {onClose ? (
          <IconButton onClick={onClose} sx={{ color: "#fff" }} aria-label="إغلاق">
            <CloseRoundedIcon />
          </IconButton>
        ) : null}
      </Stack>
    </DialogTitle>
  );
}

function StatCard({ label, value, color, icon }) {
  const ui = useUi();
  return (
    <Paper elevation={0} sx={{ ...ui.card, p: 1.5, flex: 1, minWidth: 150, display: "flex", alignItems: "center", gap: 1.2 }}>
      <Box
        sx={{
          width: 42,
          height: 42,
          borderRadius: 2,
          display: "grid",
          placeItems: "center",
          color: "#fff",
          background: color
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography sx={{ fontSize: 12.5, color: "text.secondary", fontWeight: 700 }}>{label}</Typography>
        <Typography sx={{ fontSize: 22, fontWeight: 900, lineHeight: 1.1 }}>{value}</Typography>
      </Box>
    </Paper>
  );
}

// ============================== جدول أسعار قابل للتعديل (أسعار الفرع + العروض القديمة) ==============================

function PriceItemsTable({ items, canEdit, saving, onSave, onDelete, offerColumn = false, confirmNote = "" }) {
  const ui = useUi();
  const [selected, setSelected] = useState({});
  const [rowPrices, setRowPrices] = useState({});
  const [bulkPrice, setBulkPrice] = useState("");

  useEffect(() => {
    setSelected({});
    setRowPrices({});
    setBulkPrice("");
  }, [items]);

  const chosen = items.filter((i) => selected[i.detailGuid]);
  const allChecked = items.length > 0 && chosen.length === items.length;

  const save = async (rows, label) => {
    if (!(await confirmBox("تأكيد تعديل الأسعار", `${label}${confirmNote}`, "حفظ"))) return;
    await onSave(rows.map((r) => ({ detailGuid: r.detailGuid, price: Number(r.newPrice) })));
  };

  const remove = async (item) => {
    if (!(await confirmBox("حذف من القائمة", `حذف "${item.name}" من القائمة؟ مش هيظهر في طلب الالتحاق بالسعر ده.${confirmNote}`, "حذف"))) return;
    await onDelete(item);
  };

  return (
    <Box>
      {chosen.length ? (
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          flexWrap="wrap"
          useFlexGap
          sx={{ p: 1.2, bgcolor: ui.greenSoft, borderBottom: `1px solid ${alpha(GREEN, 0.2)}` }}
        >
          <Chip label={`المحدد: ${chosen.length}`} color="primary" sx={{ fontWeight: 800 }} />
          <TextField
            size="small"
            type="number"
            label="سعر واحد للمحدد"
            value={bulkPrice}
            onChange={(e) => setBulkPrice(e.target.value)}
            InputProps={{ endAdornment: <InputAdornment position="end">ريال</InputAdornment> }}
            sx={{ width: 200, bgcolor: "background.paper", borderRadius: 1 }}
          />
          <Button
            variant="contained"
            disabled={!canEdit || saving || !(Number(bulkPrice) > 0)}
            onClick={() => save(chosen.map((i) => ({ ...i, newPrice: bulkPrice })), `سيصبح سعر ${chosen.length} بند ${money(bulkPrice)} ريال (شامل الضريبة).`)}
            sx={ui.primaryBtn}
          >
            تطبيق على المحدد
          </Button>
          <Button color="inherit" onClick={() => setSelected({})}>
            إلغاء التحديد
          </Button>
        </Stack>
      ) : null}
      <TableContainer sx={{ maxHeight: "62vh" }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={ui.headRow}>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={allChecked}
                  indeterminate={chosen.length > 0 && !allChecked}
                  disabled={!canEdit || !items.length}
                  onChange={() => setSelected(Object.fromEntries(items.map((i) => [i.detailGuid, !allChecked])))}
                />
              </TableCell>
              <TableCell>الدبلوم / الدورة</TableCell>
              <TableCell align="center">الصافي</TableCell>
              <TableCell align="center">الضريبة</TableCell>
              <TableCell align="center">السعر النهائي</TableCell>
              {offerColumn ? <TableCell align="center">العرض الساري</TableCell> : null}
              <TableCell align="center" sx={{ width: 240 }}>
                سعر جديد
              </TableCell>
              {onDelete ? <TableCell align="center" sx={{ width: 56 }}>حذف</TableCell> : null}
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.detailGuid} selected={!!selected[item.detailGuid]} sx={ui.bodyRow}>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={!!selected[item.detailGuid]}
                    disabled={!canEdit}
                    onChange={() => setSelected((prev) => ({ ...prev, [item.detailGuid]: !prev[item.detailGuid] }))}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 800, minWidth: 220 }}>{item.name}</TableCell>
                <TableCell align="center">{money(item.cost)}</TableCell>
                <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                  {money(item.tax)}{" "}
                  <Typography component="span" variant="caption" color="text.secondary">
                    ({money(item.vat)}%)
                  </Typography>
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: 900,
                    whiteSpace: "nowrap",
                    textDecoration: item.offerPrice ? "line-through" : "none",
                    color: item.offerPrice ? "text.secondary" : "text.primary"
                  }}
                >
                  {money(item.subTotal)}
                </TableCell>
                {offerColumn ? (
                  <TableCell align="center">
                    {item.offerPrice ? (
                      <Tooltip title={`${item.offerName} — ساري حتى ${item.offerEndDate}`} arrow>
                        <Chip
                          size="small"
                          icon={<LocalOfferRoundedIcon sx={{ "&&": { color: "#fff" } }} />}
                          label={`${money(item.offerPrice)} — ${item.offerName}`}
                          sx={{ fontWeight: 900, color: "#fff", background: `linear-gradient(135deg,${ORANGE},${ORANGE_LIGHT})`, maxWidth: 260 }}
                        />
                      </Tooltip>
                    ) : (
                      <Typography color="text.disabled">—</Typography>
                    )}
                  </TableCell>
                ) : null}
                <TableCell align="center">
                  <Stack direction="row" spacing={0.8} justifyContent="center">
                    <TextField
                      size="small"
                      type="number"
                      placeholder={String(item.subTotal)}
                      value={rowPrices[item.detailGuid] ?? ""}
                      onChange={(e) => setRowPrices((prev) => ({ ...prev, [item.detailGuid]: e.target.value }))}
                      disabled={!canEdit || saving}
                      inputProps={{ min: 0, "aria-label": `سعر جديد ${item.name}` }}
                      sx={{ width: 130 }}
                    />
                    <Button
                      size="small"
                      variant="contained"
                      disabled={!canEdit || saving || !(Number(rowPrices[item.detailGuid]) > 0)}
                      onClick={() =>
                        save(
                          [{ ...item, newPrice: rowPrices[item.detailGuid] }],
                          `سعر "${item.name}" هيبقى ${money(rowPrices[item.detailGuid])} ريال بدل ${money(item.subTotal)}.`
                        )
                      }
                      sx={ui.primaryBtn}
                    >
                      حفظ
                    </Button>
                  </Stack>
                </TableCell>
                {onDelete ? (
                  <TableCell align="center">
                    <Tooltip title="حذف من القائمة">
                      <span>
                        <IconButton size="small" color="error" disabled={!canEdit || saving} onClick={() => remove(item)} aria-label={`حذف ${item.name}`}>
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
            {!items.length ? (
              <TableRow>
                <TableCell colSpan={(offerColumn ? 7 : 6) + (onDelete ? 1 : 0)} align="center" sx={{ py: 4, color: "text.secondary" }}>
                  لا توجد أسعار
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

async function savePriceItems(items) {
  const result = await api("/branch-prices", { method: "PUT", body: JSON.stringify({ userGuid: getUserGuid(), items }) });
  await toast("success", "تم الحفظ", result?.message);
}

async function deletePriceItem(item) {
  const result = await api(`/branch-prices/${item.detailGuid}?userGuid=${getUserGuid()}`, { method: "DELETE" });
  await toast("success", "تم الحذف", result?.message);
}

// ============================== نافذة إنشاء/تعديل عرض ==============================

function OfferDialog({ open, onClose, onSaved, lookups, editGuid }) {
  const ui = useUi();
  const fullScreen = useMediaQuery(ui.theme.breakpoints.down("md"));
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [notes, setNotes] = useState("");
  const [branches, setBranches] = useState([]);
  const [regType, setRegType] = useState(0);
  const [diplomas, setDiplomas] = useState([]);
  const [prices, setPrices] = useState({}); // الإجمالي بعد الضريبة لكل دبلوم
  const [nets, setNets] = useState({}); // قبل الضريبة (للعرض والإدخال)
  const [studyMode, setStudyMode] = useState("0");
  const [unifiedPrice, setUnifiedPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const vatOf = (d) => Number(d?.vat ?? 0);
  const setTotal = (d, value) => {
    setPrices((prev) => ({ ...prev, [d.guid]: value }));
    setNets((prev) => ({ ...prev, [d.guid]: value === "" ? "" : String(netFromTotal(value, vatOf(d))) }));
  };
  const setNet = (d, value) => {
    setNets((prev) => ({ ...prev, [d.guid]: value }));
    setPrices((prev) => ({ ...prev, [d.guid]: value === "" ? "" : String(totalFromNet(value, vatOf(d))) }));
  };

  useEffect(() => {
    if (!open) return;
    setStudyMode("0");
    setNets({});
    setName("");
    setStartDate(lookups?.today || "");
    setEndDate(lookups?.today || "");
    setIsActive(true);
    setNotes("");
    setBranches([]);
    setDiplomas([]);
    setPrices({});
    setUnifiedPrice("");
    setRegType(0);
    if (!editGuid) return;

    setLoading(true);
    api(`/${editGuid}?userGuid=${getUserGuid()}`)
      .then(({ offer, items }) => {
        setName(offer.name);
        setStartDate(offer.startDate);
        setEndDate(offer.endDate);
        setIsActive(offer.isActive);
        setNotes(offer.notes || "");
        setStudyMode(offer.studyMode === 0 || offer.studyMode === 1 ? String(offer.studyMode) : "both");
        const branchSet = new Set(items.map((i) => i.branchGuid));
        const diplomSet = new Set(items.map((i) => i.diplomGuid));
        setBranches((lookups?.branches || []).filter((b) => branchSet.has(b.guid)));
        const selected = (lookups?.diplomas || []).filter((d) => diplomSet.has(d.guid));
        setDiplomas(selected);
        if (selected.length) setRegType(selected[0].regType);
        const priceMap = {};
        const netMap = {};
        const vatByGuid = new Map((lookups?.diplomas || []).map((d) => [d.guid, Number(d.vat || 0)]));
        items.forEach((i) => {
          if (priceMap[i.diplomGuid] === undefined) {
            priceMap[i.diplomGuid] = String(i.price);
            netMap[i.diplomGuid] = String(netFromTotal(i.price, vatByGuid.get(i.diplomGuid)));
          }
        });
        setPrices(priceMap);
        setNets(netMap);
      })
      .catch((e) => toast("error", "حدث خطأ", e.message))
      .finally(() => setLoading(false));
  }, [open, editGuid, lookups]);

  const diplomaOptions = useMemo(() => (lookups?.diplomas || []).filter((d) => d.regType === regType), [lookups, regType]);
  const itemsCount = branches.length * diplomas.length;

  const save = async () => {
    if (!name.trim()) return toast("warning", "بيانات ناقصة", "اكتب اسم العرض");
    if (!startDate || !endDate) return toast("warning", "بيانات ناقصة", "حدد تاريخ بداية ونهاية العرض");
    if (endDate < startDate) return toast("warning", "تاريخ غير صحيح", "تاريخ النهاية يجب أن يكون بعد تاريخ البداية");
    if (!branches.length) return toast("warning", "بيانات ناقصة", "اختر فرعًا واحدًا على الأقل");
    if (!diplomas.length) return toast("warning", "بيانات ناقصة", "اختر دبلومًا أو دورة واحدة على الأقل");
    const missing = diplomas.filter((d) => !(Number(prices[d.guid]) > 0));
    if (missing.length) return toast("warning", "أسعار ناقصة", `حدد سعر العرض لـ: ${missing.map((d) => d.name).join("، ")}`);

    const items = branches.flatMap((b) => diplomas.map((d) => ({ branchGuid: b.guid, diplomGuid: d.guid, price: Number(prices[d.guid]) })));
    setSaving(true);
    try {
      const body = JSON.stringify({
        userGuid: getUserGuid(),
        name: name.trim(),
        startDate,
        endDate,
        isActive,
        notes,
        studyMode: studyMode === "both" ? null : Number(studyMode),
        items
      });
      const result = editGuid ? await api(`/${editGuid}`, { method: "PUT", body }) : await api("", { method: "POST", body });
      await toast("success", "تم الحفظ", result?.message);
      onSaved();
    } catch (e) {
      toast("error", "حدث خطأ", e.message);
    } finally {
      setSaving(false);
    }
  };

  const section = { ...ui.card, p: 1.5 };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullScreen={fullScreen}
      maxWidth="lg"
      fullWidth
      dir="rtl"
      PaperProps={{ sx: ui.dialogPaper }}
    >
      <DialogHeader
        title={editGuid ? "تعديل العرض" : "عرض جديد"}
        subtitle="السعر اللي هتكتبه هو اللي الطالب بيدفعه في طلب الالتحاق (شامل الضريبة)"
        onClose={saving ? undefined : onClose}
      />
      <DialogContent sx={{ pt: "16px !important" }}>
        {loading ? (
          <Box sx={{ py: 8, textAlign: "center" }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={1.5}>
            <Paper elevation={0} sx={section}>
              <Typography sx={{ fontWeight: 900, mb: 1.2 }}>بيانات العرض</Typography>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }}>
                <TextField label="اسم العرض" value={name} onChange={(e) => setName(e.target.value)} fullWidth size="small" inputProps={{ maxLength: 200 }} />
                <TextField label="من" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} size="small" InputLabelProps={{ shrink: true }} sx={{ minWidth: 170 }} />
                <TextField label="إلى" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} size="small" InputLabelProps={{ shrink: true }} sx={{ minWidth: 170 }} />
                <FormControlLabel
                  control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} color="success" />}
                  label={<Typography sx={{ fontWeight: 800 }}>{isActive ? "مفعّل" : "موقوف"}</Typography>}
                  sx={{ whiteSpace: "nowrap", m: 0 }}
                />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }} sx={{ mt: 1.5 }}>
                <Box>
                  <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: "text.secondary", mb: 0.5 }}>نوع الدراسة</Typography>
                  <ToggleButtonGroup size="small" exclusive color="warning" value={studyMode} onChange={(_, v) => v !== null && setStudyMode(v)}>
                    {STUDY_MODES.map((m) => (
                      <ToggleButton key={m.value} value={m.value} sx={{ fontWeight: 800, px: 1.6 }}>
                        {m.label}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </Box>
                <TextField label="ملاحظات" value={notes} onChange={(e) => setNotes(e.target.value)} size="small" fullWidth multiline minRows={1} inputProps={{ maxLength: 500 }} />
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.8 }}>
                العرض بيظهر في طلب الالتحاق لما نوع الدراسة المختار يطابق نوع العرض.
              </Typography>
            </Paper>

            <Paper elevation={0} sx={section}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
                <Typography sx={{ fontWeight: 900 }}>الفروع ({branches.length})</Typography>
                <Stack direction="row" spacing={1}>
                  <Button size="small" variant="outlined" onClick={() => setBranches(lookups?.branches || [])}>
                    كل الفروع
                  </Button>
                  <Button size="small" color="inherit" onClick={() => setBranches([])}>
                    مسح
                  </Button>
                </Stack>
              </Stack>
              <Autocomplete
                multiple
                disableCloseOnSelect
                options={lookups?.branches || []}
                value={branches}
                onChange={(_, v) => setBranches(v)}
                getOptionLabel={(o) => o.name}
                isOptionEqualToValue={(a, b) => a.guid === b.guid}
                renderInput={(params) => <TextField {...params} size="small" placeholder="اختر الفروع" />}
                ChipProps={{ size: "small" }}
              />
            </Paper>

            <Paper elevation={0} sx={section}>
              <Stack direction={{ xs: "column", md: "row" }} alignItems={{ md: "center" }} justifyContent="space-between" spacing={1} sx={{ mb: 1 }}>
                <Typography sx={{ fontWeight: 900 }}>الدبلومات / الدورات ({diplomas.length})</Typography>
                <ToggleButtonGroup
                  size="small"
                  exclusive
                  color="success"
                  value={regType}
                  onChange={(_, v) => {
                    if (v !== null) setRegType(v);
                  }}
                >
                  {REG_TYPES.map((t) => (
                    <ToggleButton key={t.value} value={t.value} sx={{ fontWeight: 800, px: 1.5 }}>
                      {t.label}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Stack>
              <Autocomplete
                multiple
                disableCloseOnSelect
                options={diplomaOptions}
                value={diplomas}
                onChange={(_, v) => setDiplomas(v)}
                getOptionLabel={(o) => o.name}
                isOptionEqualToValue={(a, b) => a.guid === b.guid}
                filterSelectedOptions
                renderInput={(params) => <TextField {...params} size="small" placeholder="اختر الدبلومات أو الدورات" />}
                ChipProps={{ size: "small" }}
              />

              {diplomas.length ? (
                <>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }} flexWrap="wrap" useFlexGap>
                    <TextField
                      size="small"
                      type="number"
                      label="سعر موحد قبل الضريبة"
                      value={unifiedPrice}
                      onChange={(e) => setUnifiedPrice(e.target.value)}
                      InputProps={{ endAdornment: <InputAdornment position="end">ريال</InputAdornment> }}
                      sx={{ width: 210 }}
                    />
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={!(Number(unifiedPrice) > 0)}
                      onClick={() => diplomas.forEach((d) => setNet(d, unifiedPrice))}
                      sx={{ fontWeight: 800 }}
                    >
                      تطبيق على كل المختار
                    </Button>
                    <Typography variant="caption" color="text.secondary">
                      الضريبة بتتحسب لكل دبلوم حسب نسبته (دبلوم سعودي 0% — أجنبي ودورات 15%)
                    </Typography>
                  </Stack>
                  <TableContainer sx={{ mt: 1.2, maxHeight: 330, borderRadius: 2, border: `1px solid ${alpha(GREEN, 0.18)}` }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow sx={ui.headRow}>
                          <TableCell>الدبلوم / الدورة</TableCell>
                          <TableCell align="center">الضريبة %</TableCell>
                          <TableCell align="center" sx={{ width: 170 }}>
                            السعر قبل الضريبة
                          </TableCell>
                          <TableCell align="center">قيمة الضريبة</TableCell>
                          <TableCell align="center" sx={{ width: 170 }}>
                            الإجمالي بعد الضريبة
                          </TableCell>
                          <TableCell align="center" sx={{ width: 50 }} />
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {diplomas.map((d) => {
                          const total = prices[d.guid] ?? "";
                          const net = nets[d.guid] ?? (total === "" ? "" : String(netFromTotal(total, vatOf(d))));
                          const taxValue = total === "" || net === "" ? null : round2(Number(total) - Number(net));
                          return (
                          <TableRow key={d.guid} sx={ui.bodyRow}>
                            <TableCell sx={{ fontWeight: 800, minWidth: 200 }}>
                              {d.name}
                              <Typography component="span" variant="caption" color="text.secondary" sx={{ display: "block" }}>
                                {d.regTypeName}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip size="small" label={`${vatOf(d)}%`} color={vatOf(d) ? "warning" : "default"} variant="outlined" sx={{ fontWeight: 800 }} />
                            </TableCell>
                            <TableCell align="center">
                              <TextField
                                size="small"
                                type="number"
                                value={net}
                                onChange={(e) => setNet(d, e.target.value)}
                                inputProps={{ min: 0, "aria-label": `قبل الضريبة ${d.name}` }}
                              />
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 800, whiteSpace: "nowrap" }}>
                              {taxValue === null ? "—" : money(taxValue)}
                            </TableCell>
                            <TableCell align="center">
                              <TextField
                                size="small"
                                type="number"
                                value={total}
                                onChange={(e) => setTotal(d, e.target.value)}
                                inputProps={{ min: 0, "aria-label": `سعر ${d.name}` }}
                                sx={{ "& input": { fontWeight: 900, color: ui.offerText } }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <IconButton size="small" onClick={() => setDiplomas((prev) => prev.filter((x) => x.guid !== d.guid))} aria-label={`إزالة ${d.name}`}>
                                <DeleteOutlineRoundedIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              ) : null}
            </Paper>

            {itemsCount ? (
              <Alert severity={isActive ? "success" : "warning"} sx={{ fontWeight: 700, borderRadius: 2 }}>
                العرض ({studyModeLabel(studyMode === "both" ? null : Number(studyMode))}) هيتطبق على {diplomas.length} دبلوم/دورة في {branches.length} فرع ({itemsCount} سعر) من {startDate} إلى {endDate}
                {isActive ? "" : " — العرض موقوف ومش هيتطبق لحد ما تفعّله"}.
              </Alert>
            ) : null}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 1.5, borderTop: `1px solid ${alpha(GREEN, 0.15)}` }}>
        <Button onClick={onClose} disabled={saving} color="inherit">
          إلغاء
        </Button>
        <Button
          variant="contained"
          onClick={save}
          disabled={saving || loading}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveRoundedIcon />}
          sx={ui.offerBtn}
        >
          حفظ العرض
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ============================== محتوى عرض جديد ==============================

function OfferViewDialog({ open, guid, lookups, onClose, onEdit, canEdit }) {
  const ui = useUi();
  const fullScreen = useMediaQuery(ui.theme.breakpoints.down("md"));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !guid) return;
    setLoading(true);
    setData(null);
    api(`/${guid}?userGuid=${getUserGuid()}`)
      .then(setData)
      .catch((e) => toast("error", "حدث خطأ", e.message))
      .finally(() => setLoading(false));
  }, [open, guid]);

  // كل دبلوم بسعره والفروع اللي عليها السعر ده
  const rows = useMemo(() => {
    if (!data) return [];
    const branchName = new Map((lookups?.branches || []).map((b) => [b.guid, b.name]));
    const diplom = new Map((lookups?.diplomas || []).map((d) => [d.guid, d]));
    const groups = new Map();
    data.items.forEach((i) => {
      const key = `${i.diplomGuid}|${i.price}`;
      if (!groups.has(key)) groups.set(key, { diplom: diplom.get(i.diplomGuid), diplomGuid: i.diplomGuid, price: i.price, branches: [] });
      groups.get(key).branches.push(branchName.get(i.branchGuid) || "فرع غير نشط");
    });
    return [...groups.values()].sort(
      (a, b) => (a.diplom?.regType ?? 9) - (b.diplom?.regType ?? 9) || String(a.diplom?.name || "").localeCompare(String(b.diplom?.name || ""), "ar")
    );
  }, [data, lookups]);

  const offer = data?.offer;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth fullScreen={fullScreen} dir="rtl" PaperProps={{ sx: ui.dialogPaper }}>
      <DialogHeader title={offer ? offer.name : "محتوى العرض"} subtitle="الدبلومات والدورات وأسعارها والفروع اللي عليها العرض" onClose={onClose} />
      <DialogContent sx={{ pt: "16px !important" }}>
        {loading || !offer ? (
          <Box sx={{ py: 8, textAlign: "center" }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip icon={<EventRoundedIcon />} label={`من ${offer.startDate} إلى ${offer.endDate}`} sx={{ fontWeight: 800 }} />
              <Chip label={offer.isActive ? "مفعّل" : "موقوف"} color={offer.isActive ? "success" : "warning"} sx={{ fontWeight: 800 }} />
              <Chip label={studyModeLabel(offer.studyMode)} color="warning" variant="outlined" sx={{ fontWeight: 800 }} />
              <Chip label={`${new Set(data.items.map((i) => i.branchGuid)).size} فرع`} variant="outlined" sx={{ fontWeight: 700 }} />
              <Chip label={`${new Set(data.items.map((i) => i.diplomGuid)).size} دبلوم/دورة`} variant="outlined" sx={{ fontWeight: 700 }} />
            </Stack>
            {offer.notes ? (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                {offer.notes}
              </Alert>
            ) : null}
            <Paper elevation={0} sx={{ ...ui.card, overflow: "hidden" }}>
              <TableContainer sx={{ maxHeight: "60vh" }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow sx={ui.headRow}>
                      <TableCell>الدبلوم / الدورة</TableCell>
                      <TableCell align="center">الضريبة %</TableCell>
                      <TableCell align="center">قبل الضريبة</TableCell>
                      <TableCell align="center">الضريبة</TableCell>
                      <TableCell align="center">الإجمالي بعد الضريبة</TableCell>
                      <TableCell>الفروع</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={`${r.diplomGuid}|${r.price}`} sx={ui.bodyRow}>
                        <TableCell sx={{ fontWeight: 800, minWidth: 200 }}>
                          {r.diplom?.name || "دبلوم غير نشط"}
                          <Typography component="span" variant="caption" color="text.secondary" sx={{ display: "block" }}>
                            {r.diplom?.regTypeName || ""}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">{Number(r.diplom?.vat || 0)}%</TableCell>
                        <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>{money(netFromTotal(r.price, r.diplom?.vat))}</TableCell>
                        <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>{money(round2(r.price - netFromTotal(r.price, r.diplom?.vat)))}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 900, color: ui.offerText, whiteSpace: "nowrap", fontSize: 15 }}>
                          {money(r.price)} ريال
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                            {r.branches.map((b) => (
                              <Chip key={b} size="small" label={b} sx={{ bgcolor: ui.greenSoft, color: ui.greenText, fontWeight: 700 }} />
                            ))}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 1.5, borderTop: `1px solid ${alpha(GREEN, 0.15)}` }}>
        <Button onClick={onClose} color="inherit">
          إغلاق
        </Button>
        <Button variant="contained" startIcon={<EditRoundedIcon />} disabled={!canEdit || !offer} onClick={onEdit} sx={ui.offerBtn}>
          تعديل العرض
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ============================== محتوى عرض قديم ==============================

function LegacyDialog({ open, guid, onClose, onChanged, canEdit }) {
  const ui = useUi();
  const fullScreen = useMediaQuery(ui.theme.breakpoints.down("md"));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");

  const load = useCallback(async () => {
    if (!guid) return;
    setLoading(true);
    try {
      const result = await api(`/legacy/${guid}?userGuid=${getUserGuid()}`);
      setData(result);
      setName(result.info.name || "");
    } catch (e) {
      toast("error", "حدث خطأ", e.message);
    } finally {
      setLoading(false);
    }
  }, [guid]);

  useEffect(() => {
    if (open) {
      setData(null);
      load();
    }
  }, [open, load]);

  const saveName = async () => {
    setSaving(true);
    try {
      const result = await api(`/legacy/${guid}`, { method: "PUT", body: JSON.stringify({ userGuid: getUserGuid(), name }) });
      await toast("success", "تم", result?.message);
      onChanged();
      await load();
    } catch (e) {
      toast("error", "حدث خطأ", e.message);
    } finally {
      setSaving(false);
    }
  };

  const removeItem = async (item) => {
    setSaving(true);
    try {
      await deletePriceItem(item);
      onChanged();
      await load();
    } catch (e) {
      toast("error", "حدث خطأ", e.message);
    } finally {
      setSaving(false);
    }
  };

  const savePrices = async (items) => {
    setSaving(true);
    try {
      await savePriceItems(items);
      await load();
    } catch (e) {
      toast("error", "حدث خطأ", e.message);
    } finally {
      setSaving(false);
    }
  };

  const branches = data?.branches || [];
  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="lg" fullWidth fullScreen={fullScreen} dir="rtl" PaperProps={{ sx: ui.dialogPaper }}>
      <DialogHeader
        tone="green"
        title={data?.info ? data.info.name || `عرض قديم بدون اسم — قائمة ${data.info.code}` : "عرض قديم"}
        subtitle="تعديل الاسم والأسعار — التعديل بيتطبق على كل الفروع المرتبطة بالعرض"
        onClose={saving ? undefined : onClose}
      />
      <DialogContent sx={{ pt: "16px !important" }}>
        {loading || !data ? (
          <Box sx={{ py: 8, textAlign: "center" }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={1.5}>
            <Paper elevation={0} sx={{ ...ui.card, p: 1.5 }}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "center" }}>
                <TextField
                  label="اسم العرض (ممكن تسيبه فاضي)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  size="small"
                  fullWidth
                  disabled={!canEdit || saving}
                />
                <Button
                  variant="contained"
                  startIcon={<SaveRoundedIcon />}
                  disabled={!canEdit || saving || name === (data.info.name || "")}
                  onClick={saveName}
                  sx={{ ...ui.primaryBtn, whiteSpace: "nowrap" }}
                >
                  حفظ الاسم
                </Button>
              </Stack>
              <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap alignItems="center" sx={{ mt: 1.5 }}>
                <Chip size="small" label={data.info.regTypeName} variant="outlined" />
                <Chip size="small" label={data.info.isUse ? "مفعّل" : "موقوف"} color={data.info.isUse ? "warning" : "default"} />
                {data.info.startIn ? <Chip size="small" icon={<EventRoundedIcon />} label={data.info.startIn} variant="outlined" /> : null}
                <Typography variant="body2" sx={{ fontWeight: 800, mx: 0.5 }}>
                  الفروع:
                </Typography>
                {branches.length ? (
                  branches.map((b) => <Chip key={b.guid} size="small" label={b.name} sx={{ bgcolor: ui.greenSoft, color: ui.greenText, fontWeight: 700 }} />)
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    لا يوجد
                  </Typography>
                )}
              </Stack>
            </Paper>

            <Paper elevation={0} sx={{ ...ui.card, overflow: "hidden" }}>
              <PriceItemsTable
                items={data.items}
                canEdit={canEdit}
                saving={saving}
                onSave={savePrices}
                onDelete={removeItem}
                confirmNote={branches.length > 1 ? `\n\nالعرض ده على ${branches.length} فروع: ${branches.map((b) => b.name).join("، ")}.` : ""}
              />
            </Paper>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 1.5, borderTop: `1px solid ${alpha(GREEN, 0.15)}` }}>
        <Button onClick={onClose} disabled={saving} color="inherit">
          إغلاق
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ============================== تبويب العروض ==============================

function OffersTab({ lookups, canEdit, offers, reload, loading }) {
  const ui = useUi();
  const [dialog, setDialog] = useState({ open: false, guid: null });
  const [view, setView] = useState(null);
  const [filter, setFilter] = useState("all");

  const shown = useMemo(() => (filter === "all" ? offers : offers.filter((o) => o.status === filter)), [offers, filter]);
  const counts = useMemo(() => offers.reduce((acc, o) => ({ ...acc, [o.status]: (acc[o.status] || 0) + 1 }), {}), [offers]);

  const toggleActive = async (offer) => {
    try {
      await api(`/${offer.guid}/active`, { method: "PUT", body: JSON.stringify({ userGuid: getUserGuid(), isActive: !offer.isActive }) });
      reload();
    } catch (e) {
      toast("error", "حدث خطأ", e.message);
    }
  };

  const remove = async (offer) => {
    if (!(await confirmBox("حذف العرض", `هل تريد حذف "${offer.name}" نهائيًا؟`, "حذف"))) return;
    try {
      await api(`/${offer.guid}?userGuid=${getUserGuid()}`, { method: "DELETE" });
      reload();
    } catch (e) {
      toast("error", "حدث خطأ", e.message);
    }
  };

  return (
    <Box>
      <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "center" }} sx={{ mb: 1.5 }} flexWrap="wrap" useFlexGap>
        <Button variant="contained" startIcon={<AddRoundedIcon />} disabled={!canEdit} onClick={() => setDialog({ open: true, guid: null })} sx={ui.offerBtn}>
          عرض جديد
        </Button>
        <Box sx={{ flex: 1 }} />
        <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
          <Chip label={`الكل: ${offers.length}`} clickable color={filter === "all" ? "primary" : "default"} onClick={() => setFilter("all")} sx={{ fontWeight: 800 }} />
          {Object.entries(STATUS).map(([key, s]) => (
            <Chip
              key={key}
              label={`${s.label}: ${counts[key] || 0}`}
              clickable
              color={filter === key ? s.color : "default"}
              variant={filter === key ? "filled" : "outlined"}
              onClick={() => setFilter(key)}
              sx={{ fontWeight: 800 }}
            />
          ))}
        </Stack>
      </Stack>

      <Paper elevation={0} sx={{ ...ui.card, overflow: "hidden" }}>
        <TableContainer sx={{ maxHeight: "calc(100vh - 420px)", minHeight: 260 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow sx={ui.headRow}>
                <TableCell>العرض</TableCell>
                <TableCell align="center">الفترة</TableCell>
                <TableCell align="center">نوع الدراسة</TableCell>
                <TableCell align="center">الحالة</TableCell>
                <TableCell align="center">الفروع</TableCell>
                <TableCell align="center">الدبلومات/الدورات</TableCell>
                <TableCell align="center">السعر</TableCell>
                <TableCell align="center">مفعّل</TableCell>
                <TableCell align="center">إجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : shown.length ? (
                shown.map((o) => (
                  <TableRow key={o.guid} sx={ui.bodyRow}>
                    <TableCell sx={{ cursor: "pointer", minWidth: 200 }} onClick={() => setView(o.guid)}>
                      <Typography sx={{ fontWeight: 900 }}>{o.name}</Typography>
                      {o.notes ? (
                        <Typography variant="caption" color="text.secondary">
                          {o.notes}
                        </Typography>
                      ) : null}
                    </TableCell>
                    <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                      {o.startDate} ← {o.endDate}
                    </TableCell>
                    <TableCell align="center">
                      <Chip size="small" label={studyModeLabel(o.studyMode)} variant="outlined" sx={{ fontWeight: 800 }} />
                    </TableCell>
                    <TableCell align="center">
                      <Chip size="small" label={STATUS[o.status]?.label || o.status} color={STATUS[o.status]?.color || "default"} sx={{ fontWeight: 800 }} />
                    </TableCell>
                    <TableCell align="center">{o.branchesCount}</TableCell>
                    <TableCell align="center">{o.diplomasCount}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 900, color: ui.offerText, whiteSpace: "nowrap" }}>
                      {o.minPrice === o.maxPrice ? money(o.minPrice) : `${money(o.minPrice)} - ${money(o.maxPrice)}`}
                    </TableCell>
                    <TableCell align="center">
                      <Switch checked={o.isActive} onChange={() => toggleActive(o)} disabled={!canEdit} color="success" size="small" />
                    </TableCell>
                    <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                      <Tooltip title="محتوى العرض">
                        <IconButton size="small" color="primary" onClick={() => setView(o.guid)}>
                          <VisibilityRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="تعديل">
                        <span>
                          <IconButton size="small" disabled={!canEdit} onClick={() => setDialog({ open: true, guid: o.guid })}>
                            <EditRoundedIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="حذف">
                        <span>
                          <IconButton size="small" color="error" disabled={!canEdit} onClick={() => remove(o)}>
                            <DeleteOutlineRoundedIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 7, color: "text.secondary" }}>
                    <LocalOfferRoundedIcon sx={{ fontSize: 40, opacity: 0.35, display: "block", mx: "auto", mb: 1 }} />
                    لا توجد عروض — اضغط "عرض جديد" لإضافة عرض
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <OfferViewDialog
        open={Boolean(view)}
        guid={view}
        lookups={lookups}
        canEdit={canEdit}
        onClose={() => setView(null)}
        onEdit={() => {
          setDialog({ open: true, guid: view });
          setView(null);
        }}
      />

      <OfferDialog
        open={dialog.open}
        editGuid={dialog.guid}
        lookups={lookups}
        onClose={() => setDialog({ open: false, guid: null })}
        onSaved={() => {
          setDialog({ open: false, guid: null });
          reload();
        }}
      />
    </Box>
  );
}

// ============================== إضافة دبلومات/دورات لقائمة أسعار ==============================

function AddItemsDialog({ open, list, lookups, onClose, onSaved }) {
  const ui = useUi();
  const fullScreen = useMediaQuery(ui.theme.breakpoints.down("md"));
  const [diplomas, setDiplomas] = useState([]);
  const [prices, setPrices] = useState({});
  const [nets, setNets] = useState({});
  const [unified, setUnified] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDiplomas([]);
    setPrices({});
    setNets({});
    setUnified("");
  }, [open]);

  const inList = useMemo(() => new Set((list?.items || []).map((i) => i.diplomGuid)), [list]);
  const options = useMemo(
    () => (lookups?.diplomas || []).filter((d) => d.regType === list?.regType && !inList.has(d.guid)),
    [lookups, list, inList]
  );
  const vatOf = (d) => Number(d?.vat ?? 0);
  const setNet = (d, v) => {
    setNets((p) => ({ ...p, [d.guid]: v }));
    setPrices((p) => ({ ...p, [d.guid]: v === "" ? "" : String(totalFromNet(v, vatOf(d))) }));
  };
  const setTotal = (d, v) => {
    setPrices((p) => ({ ...p, [d.guid]: v }));
    setNets((p) => ({ ...p, [d.guid]: v === "" ? "" : String(netFromTotal(v, vatOf(d))) }));
  };

  const save = async () => {
    if (!diplomas.length) return toast("warning", "بيانات ناقصة", "اختر دبلومًا أو دورة واحدة على الأقل");
    const missing = diplomas.filter((d) => !(Number(prices[d.guid]) > 0));
    if (missing.length) return toast("warning", "أسعار ناقصة", `حدد السعر لـ: ${missing.map((d) => d.name).join("، ")}`);
    const shared = list?.sharedWith ? `\n\nالقائمة مشتركة مع: ${list.sharedWith} — هيظهروا هناك كمان.` : "";
    if (!(await confirmBox("إضافة للقائمة", `إضافة ${diplomas.length} لقائمة "${list.name || list.code}" (${list.kindName}).${shared}`, "إضافة"))) return;

    setSaving(true);
    try {
      const result = await api("/branch-prices/items", {
        method: "POST",
        body: JSON.stringify({
          userGuid: getUserGuid(),
          priceSaleGuid: list.guid,
          items: diplomas.map((d) => ({ diplomGuid: d.guid, price: Number(prices[d.guid]) }))
        })
      });
      await toast("success", "تم", result?.message);
      onSaved();
    } catch (e) {
      toast("error", "حدث خطأ", e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="lg" fullWidth fullScreen={fullScreen} dir="rtl" PaperProps={{ sx: ui.dialogPaper }}>
      <DialogHeader
        tone="green"
        title={`إضافة ${list?.regTypeName || ""} لقائمة: ${list?.name || list?.code || ""}`}
        subtitle={`${list?.kindName || ""} — بيظهروا في طلب الالتحاق لما يتم اختيار ${list?.kind === "online" ? "عن بعد" : list?.kind === "offline" ? "حضوري" : "الفرع"}`}
        onClose={saving ? undefined : onClose}
      />
      <DialogContent sx={{ pt: "16px !important" }}>
        <Stack spacing={1.5}>
          <Autocomplete
            multiple
            disableCloseOnSelect
            options={options}
            value={diplomas}
            onChange={(_, v) => setDiplomas(v)}
            getOptionLabel={(o) => o.name}
            isOptionEqualToValue={(a, b) => a.guid === b.guid}
            filterSelectedOptions
            noOptionsText="كل المتاح موجود في القائمة بالفعل"
            renderInput={(params) => <TextField {...params} size="small" label="الدبلومات / الدورات" placeholder="اختر من غير الموجود في القائمة" />}
            ChipProps={{ size: "small" }}
          />
          {diplomas.length ? (
            <>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <TextField
                  size="small"
                  type="number"
                  label="سعر موحد قبل الضريبة"
                  value={unified}
                  onChange={(e) => setUnified(e.target.value)}
                  InputProps={{ endAdornment: <InputAdornment position="end">ريال</InputAdornment> }}
                  sx={{ width: 210 }}
                />
                <Button size="small" variant="outlined" disabled={!(Number(unified) > 0)} onClick={() => diplomas.forEach((d) => setNet(d, unified))} sx={{ fontWeight: 800 }}>
                  تطبيق على كل المختار
                </Button>
              </Stack>
              <Paper elevation={0} sx={{ ...ui.card, overflow: "hidden" }}>
                <TableContainer sx={{ maxHeight: "50vh" }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow sx={ui.headRow}>
                        <TableCell>الدبلوم / الدورة</TableCell>
                        <TableCell align="center">الضريبة %</TableCell>
                        <TableCell align="center" sx={{ width: 170 }}>السعر قبل الضريبة</TableCell>
                        <TableCell align="center">قيمة الضريبة</TableCell>
                        <TableCell align="center" sx={{ width: 170 }}>الإجمالي بعد الضريبة</TableCell>
                        <TableCell align="center" sx={{ width: 50 }} />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {diplomas.map((d) => {
                        const total = prices[d.guid] ?? "";
                        const net = nets[d.guid] ?? "";
                        const tax = total === "" || net === "" ? null : round2(Number(total) - Number(net));
                        return (
                          <TableRow key={d.guid} sx={ui.bodyRow}>
                            <TableCell sx={{ fontWeight: 800, minWidth: 200 }}>{d.name}</TableCell>
                            <TableCell align="center">
                              <Chip size="small" label={`${vatOf(d)}%`} color={vatOf(d) ? "warning" : "default"} variant="outlined" sx={{ fontWeight: 800 }} />
                            </TableCell>
                            <TableCell align="center">
                              <TextField size="small" type="number" value={net} onChange={(e) => setNet(d, e.target.value)} inputProps={{ min: 0, "aria-label": `قبل الضريبة ${d.name}` }} />
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 800 }}>{tax === null ? "—" : money(tax)}</TableCell>
                            <TableCell align="center">
                              <TextField
                                size="small"
                                type="number"
                                value={total}
                                onChange={(e) => setTotal(d, e.target.value)}
                                inputProps={{ min: 0, "aria-label": `الإجمالي ${d.name}` }}
                                sx={{ "& input": { fontWeight: 900 } }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <IconButton size="small" onClick={() => setDiplomas((p) => p.filter((x) => x.guid !== d.guid))} aria-label={`إزالة ${d.name}`}>
                                <DeleteOutlineRoundedIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 1.5, borderTop: `1px solid ${alpha(GREEN, 0.15)}` }}>
        <Button onClick={onClose} disabled={saving} color="inherit">إلغاء</Button>
        <Button variant="contained" onClick={save} disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <AddRoundedIcon />} sx={ui.primaryBtn}>
          إضافة للقائمة
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ============================== قائمة أسعار جديدة للفرع ==============================

function CreateListDialog({ open, branch, missing, onClose, onSaved }) {
  const ui = useUi();
  const [choice, setChoice] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const first = missing[0];
    setChoice(first ? `${first.regType}|${first.mode}` : "");
    setName("");
  }, [open, missing]);

  useEffect(() => {
    const m = missing.find((x) => `${x.regType}|${x.mode}` === choice);
    if (m && branch) setName(`اسعار ${m.regTypeName === "دبلوم" ? "الدبلومات" : m.regTypeName === "دورة تأهيلية" ? "الدورات التأهيلية" : "الدورات التطويرية"} ${m.mode === 1 ? "عن بعد" : "حضوري"} ${branch.name}`);
  }, [choice, missing, branch]);

  const save = async () => {
    const m = missing.find((x) => `${x.regType}|${x.mode}` === choice);
    if (!m) return;
    setSaving(true);
    try {
      const result = await api("/branch-prices/lists", {
        method: "POST",
        body: JSON.stringify({ userGuid: getUserGuid(), branchGuid: branch.guid, regType: m.regType, studyMode: m.mode, name })
      });
      await toast("success", "تم", result?.message);
      onSaved();
    } catch (e) {
      toast("error", "حدث خطأ", e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth dir="rtl" PaperProps={{ sx: ui.dialogPaper }}>
      <DialogHeader tone="green" title="قائمة أسعار جديدة" subtitle={branch?.name} onClose={saving ? undefined : onClose} />
      <DialogContent sx={{ pt: "16px !important" }}>
        {missing.length ? (
          <Stack spacing={1.5}>
            <Typography sx={{ fontWeight: 800 }}>النوع (الأنواع اللي الفرع مالوش قائمة ليها):</Typography>
            <ToggleButtonGroup orientation="vertical" exclusive color="success" value={choice} onChange={(_, v) => v && setChoice(v)} fullWidth>
              {missing.map((m) => (
                <ToggleButton key={`${m.regType}|${m.mode}`} value={`${m.regType}|${m.mode}`} sx={{ fontWeight: 800, justifyContent: "flex-start" }}>
                  {m.regTypeName} — {m.mode === 1 ? "عن بعد" : "حضوري"}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            <TextField label="اسم القائمة" value={name} onChange={(e) => setName(e.target.value)} size="small" fullWidth />
            <Alert severity="info" sx={{ borderRadius: 2 }}>بعد الإنشاء ضيف عليها الدبلومات/الدورات وأسعارها من زرار "إضافة".</Alert>
          </Stack>
        ) : (
          <Alert severity="success">الفرع عنده قوائم لكل الأنواع (حضوري وعن بعد) — ضيف على القائمة الموجودة.</Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 1.5 }}>
        <Button onClick={onClose} disabled={saving} color="inherit">إلغاء</Button>
        <Button variant="contained" onClick={save} disabled={saving || !missing.length || !choice} sx={ui.primaryBtn}>
          إنشاء القائمة
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ============================== تبويب أسعار الفروع ==============================

function BranchPricesTab({ lookups, canEdit }) {
  const ui = useUi();
  const [branch, setBranch] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addTo, setAddTo] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async (b) => {
    if (!b) return;
    setLoading(true);
    try {
      setData(await api(`/branch-prices?userGuid=${getUserGuid()}&branchGuid=${b.guid}`));
    } catch (e) {
      setData(null);
      toast("error", "حدث خطأ", e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const removeItem = async (item) => {
    setSaving(true);
    try {
      await deletePriceItem(item);
      await load(branch);
    } catch (e) {
      toast("error", "حدث خطأ", e.message);
    } finally {
      setSaving(false);
    }
  };

  const savePrices = async (items) => {
    setSaving(true);
    try {
      await savePriceItems(items);
      await load(branch);
    } catch (e) {
      toast("error", "حدث خطأ", e.message);
    } finally {
      setSaving(false);
    }
  };

  const lists = data?.lists || [];

  // لكل نوع تسجيل: فيه قائمة حضوري؟ فيه قائمة عن بعد؟ (عرض قديم بيغطي الاتنين)
  const coverage = REG_TYPES.map((t) => {
    const ofType = lists.filter((l) => l.regType === t.value);
    const market = ofType.some((l) => l.kind === "market");
    return {
      regType: t.value,
      label: t.label,
      offline: market || ofType.some((l) => l.kind === "offline"),
      online: market || ofType.some((l) => l.kind === "online")
    };
  });
  const missing = data
    ? coverage.flatMap((c) =>
        [
          !lists.some((l) => l.regType === c.regType && l.kind === "offline") ? { regType: c.regType, mode: 0 } : null,
          !lists.some((l) => l.regType === c.regType && l.kind === "online") ? { regType: c.regType, mode: 1 } : null
        ]
          .filter(Boolean)
          .map((m) => ({ ...m, regTypeName: c.regType === 0 ? "دبلوم" : c.regType === 1 ? "دورة تأهيلية" : "دورة تطويرية" }))
      )
    : [];
  const offersOnBranch = lists.flatMap((l) => l.items).filter((i) => i.offerPrice).length + (data?.offerOnly || []).length;

  return (
    <Box>
      <Paper elevation={0} sx={{ ...ui.card, p: 2, mb: 1.5 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }}>
          <Autocomplete
            options={lookups?.branches || []}
            value={branch}
            onChange={(_, v) => {
              setBranch(v);
              setData(null);
              load(v);
            }}
            getOptionLabel={(o) => o.name}
            isOptionEqualToValue={(a, b) => a.guid === b.guid}
            renderInput={(params) => (
              <TextField
                {...params}
                label="الفرع"
                placeholder="اختر الفرع لعرض أسعاره"
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <StorefrontRoundedIcon sx={{ color: ui.greenText, mr: 0.5 }} />
                      {params.InputProps.startAdornment}
                    </>
                  )
                }}
              />
            )}
            sx={{ width: { xs: "100%", md: 560 }, flexShrink: 0 }}
            ListboxProps={{ style: { maxHeight: 420 } }}
          />
          <Button startIcon={<RefreshRoundedIcon />} disabled={!branch || loading} onClick={() => load(branch)} sx={{ fontWeight: 800 }}>
            تحديث
          </Button>
          <Button variant="outlined" startIcon={<AddRoundedIcon />} disabled={!branch || !data || !canEdit} onClick={() => setCreateOpen(true)} sx={{ fontWeight: 800 }}>
            قائمة جديدة
          </Button>
          <Box sx={{ flex: 1 }} />
          {data ? (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip label={`${lists.length} قائمة أسعار`} sx={{ fontWeight: 800, bgcolor: ui.greenSoft, color: ui.greenText }} />
              <Chip
                icon={<LocalOfferRoundedIcon sx={{ "&&": { color: ui.offerText } }} />}
                label={`${offersOnBranch} سعر عليه عرض`}
                sx={{ fontWeight: 800, bgcolor: ui.offerSoft, color: ui.offerText }}
              />
            </Stack>
          ) : null}
        </Stack>
      </Paper>

      {!branch ? (
        <Paper elevation={0} sx={{ ...ui.card, py: 7, textAlign: "center", color: "text.secondary" }}>
          <StorefrontRoundedIcon sx={{ fontSize: 46, opacity: 0.35, mb: 1 }} />
          <Typography sx={{ fontWeight: 800 }}>اختر فرعًا لعرض أسعاره الحالية والعروض السارية عليه</Typography>
        </Paper>
      ) : loading ? (
        <Box sx={{ py: 8, textAlign: "center" }}>
          <CircularProgress />
        </Box>
      ) : (
        <Stack spacing={1.5}>
          {data ? (
            <Paper elevation={0} sx={{ ...ui.card, p: 1.5 }}>
              <Typography sx={{ fontWeight: 900, mb: 1 }}>اللي بيظهر في طلب الالتحاق للفرع ده</Typography>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1} useFlexGap flexWrap="wrap">
                {coverage.map((c) => (
                  <Stack key={c.regType} direction="row" spacing={0.6} alignItems="center" sx={{ p: 0.8, borderRadius: 2, bgcolor: ui.greenSoft }}>
                    <Typography sx={{ fontWeight: 800, mx: 0.5 }}>{c.label}:</Typography>
                    <Chip size="small" label={`حضوري ${c.offline ? "✓" : "✗"}`} color={c.offline ? "success" : "error"} variant={c.offline ? "filled" : "outlined"} sx={{ fontWeight: 800 }} />
                    <Chip size="small" label={`عن بعد ${c.online ? "✓" : "✗"}`} color={c.online ? "success" : "error"} variant={c.online ? "filled" : "outlined"} sx={{ fontWeight: 800 }} />
                  </Stack>
                ))}
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.8 }}>
                ✗ يعني مفيش قائمة للنوع ده — طلب الالتحاق هيقول "غير متوفر قائمة أسعار". اعملها من "قائمة جديدة".
              </Typography>
            </Paper>
          ) : null}
          {(data?.offerOnly || []).length ? (
            <Alert severity="warning" icon={<LocalOfferRoundedIcon />} sx={{ fontWeight: 700, borderRadius: 2 }}>
              عروض على دبلومات/دورات مش موجودة في قوائم الفرع:{" "}
              {data.offerOnly.map((o) => `${o.name} (${money(o.price)} — ${o.offerName}${o.status === "scheduled" ? ` يبدأ ${o.startDate}` : ""})`).join("، ")}
            </Alert>
          ) : null}
          {data && !lists.length ? (
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              لا توجد قوائم أسعار مفعّلة لهذا الفرع.
            </Alert>
          ) : null}
          {lists.map((list) => (
            <Paper
              key={list.guid}
              elevation={0}
              sx={{
                ...ui.card,
                overflow: "hidden",
                opacity: list.inEffect ? 1 : 0.8,
                borderInlineStart: `5px solid ${list.kind === "market" ? ORANGE : list.inEffect ? GREEN : alpha(GREEN, 0.35)}`
              }}
            >
              <Box sx={{ px: 2, py: 1.4, bgcolor: list.kind === "market" ? ui.offerSoft : ui.greenSoft }}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Typography sx={{ fontWeight: 900, fontSize: 16 }}>{list.name || `قائمة ${list.code}`}</Typography>
                  <Chip size="small" label={list.regTypeName} variant="outlined" />
                  <Chip size="small" label={list.kindName} color={list.kind === "market" ? "warning" : "default"} />
                  <Chip
                    size="small"
                    label={list.inEffect ? "مستخدمة في طلب الالتحاق" : "غير مستخدمة (فيه عرض قديم بيغطي عليها)"}
                    color={list.inEffect ? "success" : "default"}
                    variant={list.inEffect ? "filled" : "outlined"}
                    sx={{ fontWeight: 800 }}
                  />
                  <Box sx={{ flex: 1 }} />
                  <Button size="small" variant="contained" startIcon={<AddRoundedIcon />} disabled={!canEdit} onClick={() => setAddTo(list)} sx={ui.primaryBtn}>
                    إضافة {list.regType === 0 ? "دبلوم" : "دورة"}
                  </Button>
                </Stack>
                {list.sharedWith ? (
                  <Typography variant="caption" sx={{ display: "block", mt: 0.6, color: ui.offerText, fontWeight: 800 }}>
                    ⚠ القائمة دي مشتركة مع: {list.sharedWith} — أي تعديل هنا بيتطبق عليهم كمان.
                  </Typography>
                ) : null}
              </Box>
              <PriceItemsTable
                items={list.items}
                canEdit={canEdit}
                saving={saving}
                onSave={savePrices}
                onDelete={removeItem}
                offerColumn
                confirmNote={list.sharedWith ? `\n\nتنبيه: القائمة مشتركة مع: ${list.sharedWith} — التعديل هيأثر على الفروع دي كمان.` : ""}
              />
            </Paper>
          ))}
        </Stack>
      )}

      <AddItemsDialog
        open={Boolean(addTo)}
        list={addTo}
        lookups={lookups}
        onClose={() => setAddTo(null)}
        onSaved={() => {
          setAddTo(null);
          load(branch);
        }}
      />
      <CreateListDialog
        open={createOpen}
        branch={branch}
        missing={missing}
        onClose={() => setCreateOpen(false)}
        onSaved={() => {
          setCreateOpen(false);
          load(branch);
        }}
      />
    </Box>
  );
}

// ============================== تبويب العروض القديمة ==============================

function LegacyTab({ legacy, canEdit, reload }) {
  const ui = useUi();
  const [openGuid, setOpenGuid] = useState(null);

  const disable = async (item) => {
    if (!(await confirmBox("إيقاف العرض القديم", `إيقاف "${item.name || `قائمة ${item.code}`}"؟ الفروع (${item.branches}) هترجع لقوائم أسعارها العادية في طلب الالتحاق.`, "إيقاف"))) return;
    try {
      const result = await api(`/legacy/${item.guid}/disable`, { method: "PUT", body: JSON.stringify({ userGuid: getUserGuid(), isActive: false }) });
      await toast("success", "تم", result?.message);
      reload();
    } catch (e) {
      toast("error", "حدث خطأ", e.message);
    }
  };

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 1.5, fontWeight: 700, borderRadius: 2 }}>
        دي قوائم العروض القديمة من الديسكتوب (نوع تسويق). طول ما هي مفعّلة بتاخد مكان قائمة أسعار الفرع كلها في طلب الالتحاق، وتواريخها مش بتتراجع تلقائيًا.
        اضغط "المحتوى" لتعديل الاسم والأسعار.
      </Alert>
      <Paper elevation={0} sx={{ ...ui.card, overflow: "hidden" }}>
        <TableContainer sx={{ maxHeight: "calc(100vh - 440px)", minHeight: 240 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow sx={ui.headRow}>
                <TableCell>العرض</TableCell>
                <TableCell align="center">النوع</TableCell>
                <TableCell>الفروع</TableCell>
                <TableCell align="center">عدد الأسعار</TableCell>
                <TableCell align="center">التاريخ (هجري)</TableCell>
                <TableCell align="center">إجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {legacy.length ? (
                legacy.map((l) => (
                  <TableRow key={l.guid} sx={ui.bodyRow}>
                    <TableCell sx={{ fontWeight: 800, cursor: "pointer", minWidth: 180 }} onClick={() => setOpenGuid(l.guid)}>
                      {l.name || (
                        <Typography component="span" color="text.secondary" sx={{ fontStyle: "italic" }}>
                          بدون اسم — قائمة {l.code}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Chip size="small" label={l.regTypeName} variant="outlined" />
                    </TableCell>
                    <TableCell sx={{ minWidth: 200 }}>{l.branches || "—"}</TableCell>
                    <TableCell align="center">{l.itemsCount}</TableCell>
                    <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                      {l.startIn || "—"}
                    </TableCell>
                    <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                      <Button size="small" variant="contained" startIcon={<VisibilityRoundedIcon />} onClick={() => setOpenGuid(l.guid)} sx={{ ...ui.primaryBtn, ml: 0.8 }}>
                        المحتوى
                      </Button>
                      <Button size="small" color="warning" variant="outlined" disabled={!canEdit} onClick={() => disable(l)} sx={{ fontWeight: 800 }}>
                        إيقاف
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    لا توجد عروض قديمة مفعّلة
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      <LegacyDialog open={Boolean(openGuid)} guid={openGuid} canEdit={canEdit} onClose={() => setOpenGuid(null)} onChanged={reload} />
    </Box>
  );
}

// ============================== الصفحة ==============================

export default function PriceOffers() {
  const ui = useUi();
  const [tab, setTab] = useState(0);
  const [lookups, setLookups] = useState(null);
  const [offers, setOffers] = useState([]);
  const [legacy, setLegacy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api(`?userGuid=${getUserGuid()}`);
      setOffers(result?.offers || []);
      setLegacy(result?.legacy || []);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api(`/lookups?userGuid=${getUserGuid()}`)
      .then(setLookups)
      .catch((e) => setError(e.message));
    reload();
  }, [reload]);

  const canEdit = Boolean(lookups?.canEdit);
  const running = offers.filter((o) => o.status === "running").length;
  const scheduled = offers.filter((o) => o.status === "scheduled").length;

  return (
    <Box dir="rtl" sx={{ p: { xs: 1.5, md: 3 }, minWidth: 0 }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 2.5 },
          mb: 2,
          borderRadius: 3,
          color: "#fff",
          background: `linear-gradient(135deg,${GREEN} 0%,${GREEN_DARK} 70%)`,
          position: "relative",
          overflow: "hidden"
        }}
      >
        <Box sx={{ position: "absolute", insetInlineEnd: -40, top: -40, width: 180, height: 180, borderRadius: "50%", bgcolor: alpha("#fff", 0.07) }} />
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ position: "relative" }}>
          <Box sx={{ width: 52, height: 52, borderRadius: 2.5, display: "grid", placeItems: "center", bgcolor: alpha("#fff", 0.15) }}>
            <LocalOfferRoundedIcon sx={{ fontSize: 30 }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 900, fontSize: { xs: 19, md: 22 } }}>العروض والأسعار</Typography>
            <Typography sx={{ fontSize: 13, opacity: 0.9 }}>
              عروض على الدبلومات والدورات لفروع محددة بتاريخ بداية ونهاية — بتتطبق في طلب الالتحاق تلقائيًا، مع أسعار كل فرع وتعديلها
            </Typography>
          </Box>
        </Stack>
      </Paper>

      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <StatCard label="ساري الآن" value={running} color={`linear-gradient(135deg,${ORANGE},${ORANGE_LIGHT})`} icon={<LocalOfferRoundedIcon />} />
        <StatCard label="مجدول" value={scheduled} color="linear-gradient(135deg,#0277bd,#29b6f6)" icon={<EventRoundedIcon />} />
        <StatCard label="كل العروض" value={offers.length} color={`linear-gradient(135deg,${GREEN},${GREEN_DARK})`} icon={<StorefrontRoundedIcon />} />
        <StatCard label="عروض قديمة مفعّلة" value={legacy.length} color="linear-gradient(135deg,#6d4c41,#a1887f)" icon={<HistoryRoundedIcon />} />
      </Stack>

      {error ? (
        <Alert severity="error" sx={{ mb: 2, fontWeight: 600, borderRadius: 2 }}>
          {error}
        </Alert>
      ) : null}
      {lookups && !canEdit ? (
        <Alert severity="info" sx={{ mb: 2, fontWeight: 600, borderRadius: 2 }}>
          لديك صلاحية العرض فقط.
        </Alert>
      ) : null}

      <Paper elevation={0} sx={{ ...ui.card, mb: 2, px: 1 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          allowScrollButtonsMobile
          textColor="inherit"
          TabIndicatorProps={{ sx: { height: 3, borderRadius: 2, bgcolor: ui.dark ? "#67C99D" : GREEN } }}
          sx={{ "& .MuiTab-root": { fontWeight: 900, minHeight: 54 }, "& .Mui-selected": { color: ui.greenText } }}
        >
          <Tab icon={<LocalOfferRoundedIcon />} iconPosition="start" label="العروض" />
          <Tab icon={<StorefrontRoundedIcon />} iconPosition="start" label="أسعار الفروع" />
          <Tab icon={<HistoryRoundedIcon />} iconPosition="start" label={`العروض القديمة (${legacy.length})`} />
        </Tabs>
      </Paper>

      {tab === 0 ? <OffersTab lookups={lookups} canEdit={canEdit} offers={offers} reload={reload} loading={loading} /> : null}
      {tab === 1 ? <BranchPricesTab lookups={lookups} canEdit={canEdit} /> : null}
      {tab === 2 ? <LegacyTab legacy={legacy} canEdit={canEdit} reload={reload} /> : null}
    </Box>
  );
}
