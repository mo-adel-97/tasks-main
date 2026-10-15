// إدارة الأصول: مكونات مشتركة (الصور، إضافة أصل، نقل عهدة، التفاصيل والسجل).
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useMediaQuery
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import ChairOutlinedIcon from "@mui/icons-material/ChairOutlined";
import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import AddBoxOutlinedIcon from "@mui/icons-material/AddBoxOutlined";
import HistoryIcon from "@mui/icons-material/History";
import DeleteSweepOutlinedIcon from "@mui/icons-material/DeleteSweepOutlined";
import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import { SoftChip, multilineSx, showError, toast } from "../tasks/TasksUi";
import { formatDate, formatDateTime, useTasksPalette } from "../tasks/tasksCommon";
import {
  DISPOSAL_STATUS,
  EDIT_STATUS,
  ENTRY_STATUS,
  ENTRY_TYPE,
  IMAGE_ACCEPT,
  INVOICE_ACCEPT,
  LOG_ACTION,
  MAX_IMAGE_MB,
  MAX_INVOICE_MB,
  TRANSFER_STATUS,
  apiGet,
  apiPost,
  apiPostForm,
  checkFile,
  fileUrl,
  isPdf,
  money,
  openAuthFile,
  qtyText,
  useAuthFile
} from "./assetsCommon";

// =========================================================
// شارات وكروت
// =========================================================

export const EntryStatusChip = ({ status }) => {
  const s = ENTRY_STATUS[status] || { label: status, color: "#6b7280" };
  return <SoftChip label={s.label} color={s.color} />;
};

export const TransferStatusChip = ({ status }) => {
  const s = TRANSFER_STATUS[status] || { label: status, color: "#6b7280" };
  return <SoftChip label={s.label} color={s.color} />;
};

export const DisposalStatusChip = ({ status }) => {
  const s = DISPOSAL_STATUS[status] || { label: status, color: "#6b7280" };
  return <SoftChip label={s.label} color={s.color} />;
};

export const EditStatusChip = ({ status }) => {
  const s = EDIT_STATUS[status] || { label: status, color: "#6b7280" };
  return <SoftChip label={s.label} color={s.color} />;
};

export const EntryTypeChip = ({ type }) => {
  const s = ENTRY_TYPE[type] || { label: type, color: "#6b7280" };
  return <SoftChip label={s.label} color={s.color} />;
};

export const StatCard = ({ label, value, color, icon }) => {
  const p = useTasksPalette();
  const t = p.tone(color);
  return (
    <Box sx={{ p: 1.75, borderRadius: 3, border: `1px solid ${p.border}`, bgcolor: p.card, display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
      <Box sx={{ width: 42, height: 42, borderRadius: 2.5, display: "grid", placeItems: "center", bgcolor: t.bg, color: t.fg, flexShrink: 0 }}>
        {React.cloneElement(icon, { sx: { fontSize: 22 } })}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 12.5, color: p.muted, fontWeight: 600 }}>{label}</Typography>
        <Typography sx={{ fontSize: 19, fontWeight: 800, color: p.text, lineHeight: 1.3 }} noWrap>{value}</Typography>
      </Box>
    </Box>
  );
};

// =========================================================
// الصور
// =========================================================

export const ImageLightbox = ({ src, title, onClose }) => (
  <Dialog open={Boolean(src)} onClose={onClose} maxWidth="lg" PaperProps={{ sx: { bgcolor: "#111", direction: "rtl" } }}>
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1, color: "#fff" }}>
      <Typography sx={{ fontWeight: 700 }}>{title}</Typography>
      <IconButton onClick={onClose} sx={{ color: "#fff" }}><CloseIcon /></IconButton>
    </Stack>
    {src ? <Box component="img" src={src} alt={title} sx={{ display: "block", maxWidth: "90vw", maxHeight: "80vh", objectFit: "contain", mx: "auto" }} /> : null}
  </Dialog>
);

// kind: catalog / entry-image — guid null أو hasImage=false بيعرض أيقونة.
export const AssetThumb = ({ kind, guid, hasImage = true, size = 56, title = "", rounded = 2 }) => {
  const p = useTasksPalette();
  const { src, failed } = useAuthFile(guid && hasImage ? fileUrl(kind, guid) : "");
  const [open, setOpen] = useState(false);
  const waiting = guid && hasImage && !src && !failed;

  return (
    <>
      <Box
        onClick={(e) => {
          if (!src) return;
          e.stopPropagation();
          setOpen(true);
        }}
        sx={{
          width: size,
          height: size,
          borderRadius: rounded,
          overflow: "hidden",
          flexShrink: 0,
          display: "grid",
          placeItems: "center",
          bgcolor: p.nested,
          border: `1px solid ${p.border}`,
          cursor: src ? "zoom-in" : "default"
        }}
      >
        {src ? (
          <Box component="img" src={src} alt={title} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : waiting ? (
          <CircularProgress size={Math.min(22, size / 3)} />
        ) : (
          <ChairOutlinedIcon sx={{ color: p.muted, opacity: 0.55, fontSize: size * 0.45 }} />
        )}
      </Box>
      <ImageLightbox src={open ? src : ""} title={title} onClose={() => setOpen(false)} />
    </>
  );
};

// اختيار صورة مع معاينة. existing = عنصر React بيتعرض لو مفيش صورة جديدة.
export const ImagePicker = ({ file, onChange, existing, label = "صورة الصنف", required = false, height = 170 }) => {
  const p = useTasksPalette();
  const inputRef = useRef(null);
  const [preview, setPreview] = useState("");

  useEffect(() => {
    if (!file) {
      setPreview("");
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <Box>
      <input
        ref={inputRef}
        type="file"
        hidden
        accept={IMAGE_ACCEPT}
        onChange={(e) => {
          const picked = e.target.files?.[0];
          e.target.value = "";
          if (!picked) return;
          const error = checkFile(picked, MAX_IMAGE_MB, IMAGE_ACCEPT, label);
          if (error) return showError(new Error(error));
          onChange(picked);
        }}
      />
      <Box
        onClick={() => inputRef.current?.click()}
        sx={{
          height,
          borderRadius: 3,
          border: `2px dashed ${p.borderStrong}`,
          bgcolor: p.nested,
          display: "grid",
          placeItems: "center",
          overflow: "hidden",
          cursor: "pointer",
          position: "relative",
          "&:hover": { borderColor: p.primary }
        }}
      >
        {preview ? (
          <Box component="img" src={preview} alt="" sx={{ width: "100%", height: "100%", objectFit: "contain" }} />
        ) : existing ? (
          existing
        ) : (
          <Stack alignItems="center" spacing={0.5} sx={{ color: p.muted, px: 2, textAlign: "center" }}>
            <AddPhotoAlternateOutlinedIcon sx={{ fontSize: 40 }} />
            <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{label}{required ? " *" : ""}</Typography>
            <Typography sx={{ fontSize: 12 }}>اضغط لاختيار صورة أو التقاطها بالجوال (الحد الأقصى {MAX_IMAGE_MB} ميجابايت)</Typography>
          </Stack>
        )}
      </Box>
      {preview || existing ? (
        <Stack direction="row" spacing={1} sx={{ mt: 0.75 }}>
          <Button size="small" onClick={() => inputRef.current?.click()}>تغيير الصورة</Button>
          {preview ? <Button size="small" color="error" onClick={() => onChange(null)}>إلغاء الصورة الجديدة</Button> : null}
        </Stack>
      ) : null}
    </Box>
  );
};

// صورة كاملة (مش thumbnail) بالتوكن — للتفاصيل.
export const AuthImage = ({ kind, guid, height = 260, title = "" }) => {
  const p = useTasksPalette();
  const { src, failed } = useAuthFile(guid ? fileUrl(kind, guid) : "");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Box
        onClick={() => src && setOpen(true)}
        sx={{ height, borderRadius: 3, border: `1px solid ${p.border}`, bgcolor: p.nested, display: "grid", placeItems: "center", overflow: "hidden", cursor: src ? "zoom-in" : "default" }}
      >
        {src ? (
          <Box component="img" src={src} alt={title} sx={{ width: "100%", height: "100%", objectFit: "contain" }} />
        ) : failed || !guid ? (
          <Stack alignItems="center" sx={{ color: p.muted }}>
            <ChairOutlinedIcon sx={{ fontSize: 44, opacity: 0.5 }} />
            <Typography sx={{ fontSize: 12 }}>لا توجد صورة</Typography>
          </Stack>
        ) : (
          <CircularProgress size={26} />
        )}
      </Box>
      <ImageLightbox src={open ? src : ""} title={title} onClose={() => setOpen(false)} />
    </>
  );
};

// =========================================================
// هيكل الديالوج
// =========================================================

export const DialogHeader = ({ icon, title, subtitle, onClose, disabled }) => {
  const p = useTasksPalette();
  return (
    <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1.5, borderBottom: `1px solid ${p.border}` }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
        {icon ? React.cloneElement(icon, { sx: { color: p.primary } }) : null}
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 17 }}>{title}</Typography>
          {subtitle ? <Typography sx={{ fontSize: 12.5, color: p.muted }}>{subtitle}</Typography> : null}
        </Box>
      </Stack>
      {onClose ? <IconButton onClick={onClose} disabled={disabled} size="small"><CloseIcon fontSize="small" /></IconButton> : null}
    </DialogTitle>
  );
};

// سطر الصنف في القوائم المنسدلة: صورة الإدارة + الاسم والموديل.
const CatalogOption = ({ guid, hasImage, name, model, categoryName, extra, size = 64 }) => {
  const p = useTasksPalette();
  return (
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0, width: "100%", py: 0.5 }}>
      <AssetThumb kind="catalog" guid={guid} hasImage={hasImage} size={size} title={name} />
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 14.5 }} noWrap>{name}</Typography>
        <Typography sx={{ fontSize: 12.5, color: p.muted }} noWrap>
          {[model && `موديل ${model}`, categoryName].filter(Boolean).join(" · ")}
        </Typography>
        {extra ? <Typography sx={{ fontSize: 12.5, color: p.primary, fontWeight: 600 }}>{extra}</Typography> : null}
      </Box>
    </Stack>
  );
};

// صورة الصنف المختار جوه خانة البحث نفسها.
const selectedAdornment = (params, guid, hasImage, name) =>
  guid
    ? {
        ...params.InputProps,
        startAdornment: (
          <Box sx={{ ml: 0.5, mr: 0.5, display: "flex" }}>
            <AssetThumb kind="catalog" guid={guid} hasImage={hasImage} size={34} title={name} rounded={1.5} />
          </Box>
        )
      }
    : params.InputProps;

// =========================================================
// إضافة / تعديل أصل (الفرع)
// =========================================================

const emptyEntry = () => ({
  itemId: null,
  entryType: "Existing",
  qty: "1",
  unitPrice: "",
  model: "",
  notes: "",
  purchaseDate: "",
  supplierName: "",
  invoiceNo: ""
});

// allowExisting / allowPurchase = النوع مفتوح من الإدارة (أو المستخدم من الإدارة).
// admin = المراجع بيعدّل إضافة معتمدة بنفسه (لازم سبب التعديل).
export const EntryDialog = ({ open, onClose, onSaved, branchGuid, branchName, items, entry, allowExisting = true, allowPurchase = true, admin = false }) => {
  const theme = useTheme();
  const phone = useMediaQuery(theme.breakpoints.down("sm"));
  const p = useTasksPalette();
  const [form, setForm] = useState(emptyEntry);
  const [image, setImage] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [removeInvoice, setRemoveInvoice] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const invoiceRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setImage(null);
    setInvoice(null);
    setRemoveInvoice(false);
    setAdminNotes(entry?.adminNotes || "");
    setForm(
      entry
        ? {
            itemId: entry.itemId,
            entryType: entry.entryType,
            qty: String(entry.qty),
            unitPrice: entry.unitPrice ? String(entry.unitPrice) : "",
            model: entry.model || "",
            notes: entry.notes || "",
            purchaseDate: entry.purchaseDate ? String(entry.purchaseDate).slice(0, 10) : "",
            supplierName: entry.supplierName || "",
            invoiceNo: entry.invoiceNo || ""
          }
        : { ...emptyEntry(), entryType: "Existing" }
    );
  }, [open, entry, allowExisting, allowPurchase]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const selected = useMemo(() => items.find((i) => i.id === form.itemId) || null, [items, form.itemId]);
  const purchase = form.entryType === "Purchase";
  const qty = Number(form.qty) || 0;
  const unitPrice = Number(form.unitPrice) || 0;

  const save = async () => {
    if (!form.itemId) return showError(new Error("يُرجى اختيار الصنف"));
    if (qty <= 0 || !Number.isInteger(qty)) return showError(new Error("يُرجى إدخال كمية صحيحة"));
    if (purchase && unitPrice <= 0) return showError(new Error("يُرجى إدخال سعر الشراء"));
    if (!entry && !image) return showError(new Error("يجب رفع صورة الصنف من الفرع"));
    if (admin && !adminNotes.trim()) return showError(new Error("يُرجى كتابة سبب التعديل"));
    try {
      setSaving(true);
      const json = await apiPostForm(admin ? `/entries/${entry.guid}/admin-edit` : "/entries", {
        entryGuid: admin ? undefined : entry?.guid,
        adminNotes: admin ? adminNotes.trim() : undefined,
        branchGuid: branchGuid || entry?.branchGuid,
        catalogItemId: form.itemId,
        entryType: form.entryType,
        qty,
        unitPrice,
        model: form.model.trim(),
        notes: form.notes.trim(),
        purchaseDate: purchase ? form.purchaseDate : "",
        supplierName: purchase ? form.supplierName.trim() : "",
        invoiceNo: purchase ? form.invoiceNo.trim() : "",
        removeInvoice: removeInvoice && !invoice ? "true" : "",
        image,
        invoice: purchase ? invoice : null
      });
      toast(json?.message || "تم الحفظ");
      onSaved?.();
      onClose();
    } catch (e) {
      showError(e);
    } finally {
      setSaving(false);
    }
  };

  const existingInvoice = entry?.hasInvoice && !removeInvoice && !invoice;

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullScreen={phone} fullWidth maxWidth="md" PaperProps={{ sx: { direction: "rtl" } }}>
      <DialogHeader
        icon={<AddBoxOutlinedIcon />}
        title={admin ? "تعديل إضافة معتمدة (المراجع)" : entry ? "تعديل طلب إضافة صنف" : "إضافة صنف للفرع"}
        subtitle={
          admin
            ? `${entry?.branchName || ""} — التعديل يُطبّق مباشرة على عهدة الفرع ويُسجَّل في السجل`
            : branchName ? `الفرع: ${branchName} — سيُرسل الطلب إلى الحسابات للمراجعة` : "سيُرسل الطلب إلى الحسابات للمراجعة"
        }
        onClose={onClose}
        disabled={saving}
      />
      <DialogContent dividers sx={p.containedSx}>
        {!admin && entry?.status === "Rejected" && entry.reviewNotes ? (
          <Alert severity="error" sx={{ mb: 2, fontWeight: 600 }}>سبب الرفض: {entry.reviewNotes}</Alert>
        ) : null}
        {!admin && entry?.status === "Returned" && entry.reviewNotes ? (
          <Alert severity="warning" sx={{ mb: 2, fontWeight: 600 }}>المطلوب تعديله: {entry.reviewNotes}</Alert>
        ) : null}
        {admin ? (
          <TextField
            label="سبب التعديل *"
            placeholder="مثال: تصحيح الكمية بناءً على طلب الفرع"
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            fullWidth
            inputProps={{ maxLength: 1000 }}
            sx={{ mb: 2 }}
          />
        ) : null}
        <Grid container spacing={2}>
          <Grid item xs={12} md={7}>
            <Stack spacing={1.75}>
              <Autocomplete
                options={items}
                value={selected}
                onChange={(_, v) => set("itemId", v?.id || null)}
                getOptionLabel={(o) => [o.name, o.model].filter(Boolean).join(" - ")}
                groupBy={(o) => o.categoryName || "بدون مجموعة"}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <CatalogOption guid={option.guid} hasImage={option.hasImage} name={option.name} model={option.model} categoryName={option.categoryName} />
                  </li>
                )}
                ListboxProps={{ style: { maxHeight: 420 } }}
                noOptionsText="لا توجد أصناف، ويجب أن تضيفها الإدارة أولًا"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="الصنف *"
                    placeholder="ابحث باسم الصنف أو الموديل"
                    InputProps={selectedAdornment(params, selected?.guid, selected?.hasImage, selected?.name)}
                  />
                )}
              />
              {selected?.description ? (
                <Typography sx={{ fontSize: 13, color: p.muted, bgcolor: p.nested, p: 1.25, borderRadius: 2, whiteSpace: "pre-wrap" }}>
                  {selected.description}
                </Typography>
              ) : null}

              {!admin ? (
                <Stack direction="row" spacing={1} alignItems="center" sx={{ p: 1, borderRadius: 2, bgcolor: p.nested }}>
                  <EntryTypeChip type={form.entryType} />
                  <Typography sx={{ fontSize: 12.5, color: p.muted }}>
                    {form.entryType === "Purchase" ? "إضافة ناتجة عن طلب شراء" : "لتسجيل مشتريات جديدة استخدم شاشة \"طلبات الشراء\" (طلب + 3 عروض أسعار)."}
                  </Typography>
                </Stack>
              ) : null}
              <Box sx={{ display: admin ? "block" : "none" }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 0.75 }}>نوع الإضافة</Typography>
                <ToggleButtonGroup
                  exclusive
                  fullWidth
                  size="small"
                  value={form.entryType}
                  onChange={(_, v) => v && set("entryType", v)}
                  sx={{ direction: "ltr" }}
                >
                  <ToggleButton value="Purchase" disabled={!allowPurchase && form.entryType !== "Purchase"} sx={{ fontWeight: 700 }}>شراء جديد</ToggleButton>
                  <ToggleButton value="Existing" disabled={!allowExisting && form.entryType !== "Existing"} sx={{ fontWeight: 700 }}>موجود بالفعل في الفرع</ToggleButton>
                </ToggleButtonGroup>

              </Box>

              <Stack direction="row" spacing={1.5}>
                <TextField label="الكمية *" type="number" value={form.qty} onChange={(e) => set("qty", e.target.value)} inputProps={{ min: 1, step: 1 }} fullWidth />
                <TextField
                  label={purchase ? "سعر الوحدة *" : "سعر الوحدة (إن كان معروفًا)"}
                  type="number"
                  value={form.unitPrice}
                  onChange={(e) => set("unitPrice", e.target.value)}
                  inputProps={{ min: 0, step: "0.01" }}
                  fullWidth
                />
              </Stack>
              <Stack direction="row" justifyContent="space-between" sx={{ px: 0.5 }}>
                <Typography sx={{ fontSize: 13, color: p.muted }}>{selected ? `الوحدة: ${selected.unit}` : ""}</Typography>
                <Typography sx={{ fontWeight: 800, color: p.primary }}>الإجمالي: {money(qty * unitPrice)}</Typography>
              </Stack>

              <TextField label="الموديل (إن كان مختلفًا عن الصنف)" value={form.model} onChange={(e) => set("model", e.target.value)} inputProps={{ maxLength: 100 }} fullWidth />

              {purchase ? (
                <Box sx={{ p: 1.5, borderRadius: 3, border: `1px solid ${p.border}`, bgcolor: p.nested }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1.25 }}>بيانات الشراء</Typography>
                  <Grid container spacing={1.5}>
                    <Grid item xs={12} sm={6}>
                      <TextField label="تاريخ الشراء" type="date" value={form.purchaseDate} onChange={(e) => set("purchaseDate", e.target.value)} InputLabelProps={{ shrink: true }} fullWidth size="small" />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField label="رقم الفاتورة" value={form.invoiceNo} onChange={(e) => set("invoiceNo", e.target.value)} inputProps={{ maxLength: 100 }} fullWidth size="small" />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField label="المورد" value={form.supplierName} onChange={(e) => set("supplierName", e.target.value)} inputProps={{ maxLength: 200 }} fullWidth size="small" />
                    </Grid>
                    <Grid item xs={12}>
                      <input
                        ref={invoiceRef}
                        type="file"
                        hidden
                        accept={INVOICE_ACCEPT}
                        onChange={(e) => {
                          const picked = e.target.files?.[0];
                          e.target.value = "";
                          if (!picked) return;
                          const error = checkFile(picked, MAX_INVOICE_MB, INVOICE_ACCEPT, "الفاتورة");
                          if (error) return showError(new Error(error));
                          setInvoice(picked);
                        }}
                      />
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                        <Button variant="outlined" size="small" startIcon={<ReceiptLongOutlinedIcon />} onClick={() => invoiceRef.current?.click()}>
                          {invoice || existingInvoice ? "تغيير الفاتورة" : "إرفاق الفاتورة (PDF / صورة)"}
                        </Button>
                        {invoice ? <Typography sx={{ fontSize: 13 }}>{invoice.name}</Typography> : null}
                        {existingInvoice ? <Typography sx={{ fontSize: 13 }}>{entry.invoiceFileName || "فاتورة مرفقة"}</Typography> : null}
                        {invoice || existingInvoice ? (
                          <Button size="small" color="error" onClick={() => { setInvoice(null); if (entry?.hasInvoice) setRemoveInvoice(true); }}>
                            إزالة
                          </Button>
                        ) : null}
                      </Stack>
                    </Grid>
                  </Grid>
                </Box>
              ) : null}

              <TextField
                label="ملاحظات"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                multiline
                minRows={2}
                inputProps={{ maxLength: 1000 }}
                fullWidth
                sx={multilineSx(56, 160)}
              />
            </Stack>
          </Grid>

          <Grid item xs={12} md={5}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 0.75 }}>صورة الصنف من الفرع {entry ? "" : "*"}</Typography>
            <ImagePicker
              file={image}
              onChange={setImage}
              required={!entry}
              height={phone ? 200 : 260}
              existing={entry ? <AuthImage kind="entry-image" guid={entry.guid} height={phone ? 196 : 256} title={entry.itemName} /> : null}
            />
            {selected?.hasImage ? (
              <Box sx={{ mt: 2 }}>
                <Typography sx={{ fontSize: 12.5, color: p.muted, mb: 0.5 }}>صورة الصنف المعتمدة من الإدارة (للمقارنة)</Typography>
                <AuthImage kind="catalog" guid={selected.guid} height={130} title={selected.name} />
              </Box>
            ) : null}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5, ...p.containedSx }}>
        <Button onClick={onClose} disabled={saving}>إلغاء</Button>
        <Button variant="contained" onClick={save} disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>
          {admin ? "حفظ التعديل" : entry ? "حفظ وإعادة الإرسال للمراجعة" : "إرسال للمراجعة"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// =========================================================
// نقل عهدة
// =========================================================

// holdings = أرصدة الفرع المعتمدة، initialItemId = الصنف لو الطلب من كارت الصنف.
export const TransferDialog = ({ open, onClose, onSaved, holdings = [], initialItemId = null, fromBranchGuid, branches }) => {
  const p = useTasksPalette();
  const [itemId, setItemId] = useState(null);
  const [toBranch, setToBranch] = useState("");
  const [qty, setQty] = useState("1");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setItemId(initialItemId);
    setToBranch("");
    setQty("1");
    setReason("");
  }, [open, initialItemId]);

  const options = useMemo(() => holdings.filter((h) => h.qty - h.pendingOut > 0), [holdings]);
  const holding = holdings.find((h) => h.itemId === itemId) || null;
  const available = holding ? holding.qty - holding.pendingOut : 0;

  const save = async () => {
    const n = Number(qty);
    if (!holding) return showError(new Error("يُرجى اختيار الصنف المراد نقله"));
    if (!toBranch) return showError(new Error("يُرجى اختيار الفرع المنقول إليه"));
    if (!Number.isInteger(n) || n <= 0) return showError(new Error("يُرجى إدخال كمية صحيحة"));
    if (n > available) return showError(new Error(`الكمية المتاحة للنقل ${available} فقط`));
    if (!reason.trim()) return showError(new Error("يُرجى كتابة سبب النقل"));
    try {
      setSaving(true);
      const json = await apiPost("/transfers", {
        fromBranchGuid,
        toBranchGuid: toBranch,
        catalogItemId: holding.itemId,
        qty: n,
        reason: reason.trim()
      });
      toast(json?.message || "تم إرسال طلب النقل");
      onSaved?.();
      onClose();
    } catch (e) {
      showError(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { direction: "rtl" } }}>
      <DialogHeader
        icon={<SwapHorizIcon />}
        title="طلب نقل عهدة إلى فرع آخر"
        subtitle="يؤكد الفرع المستلم الاستلام، ثم توافق الحسابات، وعندها تُنقل الكمية إلى رصيده"
        onClose={onClose}
        disabled={saving}
      />
      <DialogContent dividers>
        <Stack spacing={2}>
          <Autocomplete
            options={options}
            value={holding}
            onChange={(_, v) => setItemId(v?.itemId ?? null)}
            getOptionLabel={(o) => [o.itemName, o.model].filter(Boolean).join(" - ")}
            isOptionEqualToValue={(a, b) => a.itemId === b.itemId}
            renderOption={(props, o) => (
              <li {...props} key={o.itemId}>
                <CatalogOption
                  guid={o.itemGuid}
                  hasImage={o.itemHasImage}
                  name={o.itemName}
                  model={o.model}
                  categoryName={o.categoryName}
                  extra={`المتاح للنقل: ${qtyText(o.qty - o.pendingOut)} ${o.unit}`}
                  size={56}
                />
              </li>
            )}
            ListboxProps={{ style: { maxHeight: 380 } }}
            noOptionsText="لا توجد أصناف معتمدة متاحة للنقل"
            renderInput={(params) => (
              <TextField
                {...params}
                label="الصنف المراد نقله *"
                placeholder="ابحث في أصناف عهدة الفرع"
                InputProps={selectedAdornment(params, holding?.itemGuid, holding?.itemHasImage, holding?.itemName)}
              />
            )}
          />
          {holding ? (
            <Typography sx={{ fontSize: 13, color: p.muted, px: 0.5 }}>
              الرصيد {qtyText(holding.qty)} {holding.unit}
              {holding.pendingOut ? ` — منها ${qtyText(holding.pendingOut)} محجوزة في طلبات لم تُنفّذ بعد` : ""}
            </Typography>
          ) : null}
          <FormControl fullWidth>
            <InputLabel>الفرع المنقول إليه *</InputLabel>
            <Select label="الفرع المنقول إليه *" value={toBranch} onChange={(e) => setToBranch(e.target.value)}>
              {branches.filter((b) => b.guid !== fromBranchGuid).map((b) => (
                <MenuItem key={b.guid} value={b.guid}>{b.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label={holding ? `الكمية * (المتاح ${qtyText(available)})` : "الكمية *"}
            type="number"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            inputProps={{ min: 1, max: available || undefined, step: 1 }}
            fullWidth
          />
          <TextField label="سبب النقل *" value={reason} onChange={(e) => setReason(e.target.value)} multiline minRows={2} inputProps={{ maxLength: 1000 }} fullWidth sx={multilineSx(56, 160)} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5, ...p.containedSx }}>
        <Button onClick={onClose} disabled={saving}>إلغاء</Button>
        <Button variant="contained" onClick={save} disabled={saving || !holding} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SwapHorizIcon />}>
          إرسال طلب النقل
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// =========================================================
// المرفقات (صورة أو PDF)
// =========================================================

// اختيار مرفق إلزامي: صورة بتتعرض، وPDF بيظهر اسمه.
export const AttachmentPicker = ({ file, onChange, label = "المرفق", height = 200, accept = INVOICE_ACCEPT, maxMb = MAX_INVOICE_MB }) => {
  const p = useTasksPalette();
  const inputRef = useRef(null);
  const [preview, setPreview] = useState("");

  useEffect(() => {
    if (!file || isPdf(file.name)) {
      setPreview("");
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <Box>
      <input
        ref={inputRef}
        type="file"
        hidden
        accept={accept}
        onChange={(e) => {
          const picked = e.target.files?.[0];
          e.target.value = "";
          if (!picked) return;
          const error = checkFile(picked, maxMb, accept, label);
          if (error) return showError(new Error(error));
          onChange(picked);
        }}
      />
      <Box
        onClick={() => inputRef.current?.click()}
        sx={{
          height,
          borderRadius: 3,
          border: `2px dashed ${file ? p.primary : p.borderStrong}`,
          bgcolor: p.nested,
          display: "grid",
          placeItems: "center",
          overflow: "hidden",
          cursor: "pointer",
          "&:hover": { borderColor: p.primary }
        }}
      >
        {preview ? (
          <Box component="img" src={preview} alt="" sx={{ width: "100%", height: "100%", objectFit: "contain" }} />
        ) : file ? (
          <Stack alignItems="center" spacing={0.5} sx={{ px: 2, textAlign: "center" }}>
            <PictureAsPdfOutlinedIcon sx={{ fontSize: 44, color: "#dc2626" }} />
            <Typography sx={{ fontWeight: 700, fontSize: 13, wordBreak: "break-all" }}>{file.name}</Typography>
          </Stack>
        ) : (
          <Stack alignItems="center" spacing={0.5} sx={{ color: p.muted, px: 2, textAlign: "center" }}>
            <AttachFileIcon sx={{ fontSize: 38 }} />
            <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{label} *</Typography>
            <Typography sx={{ fontSize: 12 }}>صورة أو ملف PDF (الحد الأقصى {maxMb} ميجابايت)</Typography>
          </Stack>
        )}
      </Box>
      {file ? (
        <Stack direction="row" spacing={1} sx={{ mt: 0.75 }}>
          <Button size="small" onClick={() => inputRef.current?.click()}>تغيير الملف</Button>
          <Button size="small" color="error" onClick={() => onChange(null)}>إزالة</Button>
        </Stack>
      ) : null}
    </Box>
  );
};

// عرض مرفق محفوظ: الصورة مصغّرة، والـ PDF زر فتح.
export const AttachmentView = ({ kind, guid, fileName, size = 44, title = "" }) =>
  isPdf(fileName) ? (
    <Tooltip title={fileName || "فتح المرفق"}>
      <IconButton
        onClick={(e) => {
          e.stopPropagation();
          openAuthFile(fileUrl(kind, guid)).catch(showError);
        }}
        sx={{ width: size, height: size, borderRadius: 2, border: "1px solid", borderColor: "divider" }}
      >
        <PictureAsPdfOutlinedIcon sx={{ color: "#dc2626" }} />
      </IconButton>
    </Tooltip>
  ) : (
    <AssetThumb kind={kind} guid={guid} size={size} title={title} />
  );

// زر فتح ملف محفوظ (فاتورة / عرض سعر / محضر).
export const FileButton = ({ kind, guid, label }) => (
  <Button
    size="small"
    startIcon={<AttachFileIcon />}
    onClick={(e) => {
      e.stopPropagation();
      openAuthFile(fileUrl(kind, guid)).catch(showError);
    }}
    sx={{ px: 0.5, minWidth: 0, maxWidth: 220, justifyContent: "flex-start" }}
  >
    <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</Box>
  </Button>
);

// تأكيد استلام نقل عهدة: محضر الاستلام إلزامي.
export const ReceiveDialog = ({ transfer, onClose, onSaved }) => {
  const p = useTasksPalette();
  const [notes, setNotes] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!transfer) return;
    setNotes("");
    setReceipt(null);
  }, [transfer]);

  const save = async () => {
    if (!receipt) return showError(new Error("يجب رفع محضر الاستلام"));
    try {
      setSaving(true);
      const json = await apiPostForm(`/transfers/${transfer.guid}/receive`, { notes: notes.trim(), receipt });
      toast(json?.message || "تم تأكيد الاستلام");
      onSaved?.();
      onClose();
    } catch (e) {
      showError(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={Boolean(transfer)} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { direction: "rtl" } }}>
      <DialogHeader
        icon={<TaskAltIcon />}
        title="تأكيد استلام العهدة"
        subtitle={transfer ? `${transfer.itemName} × ${transfer.qty} من ${transfer.fromBranchName}` : ""}
        onClose={onClose}
        disabled={saving}
      />
      <DialogContent dividers>
        <Alert severity="info" sx={{ mb: 2, fontWeight: 600 }}>
          لا تؤكد الاستلام إلا بعد وصول العهدة إلى الفرع فعليًا. بعد التأكيد يُرسل الطلب إلى الحسابات، وعند موافقتها تُضاف الكمية إلى رصيد فرعك.
        </Alert>
        <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 0.75 }}>محضر الاستلام * (صورة أو PDF)</Typography>
        <AttachmentPicker file={receipt} onChange={setReceipt} label="محضر الاستلام" height={180} />
        <TextField
          label="ملاحظة (اختياري)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          multiline
          minRows={2}
          fullWidth
          inputProps={{ maxLength: 1000 }}
          sx={{ mt: 2, ...multilineSx(56, 160) }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5, ...p.containedSx }}>
        <Button onClick={onClose} disabled={saving}>إلغاء</Button>
        <Button variant="contained" onClick={save} disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <TaskAltIcon />}>
          تأكيد الاستلام
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// =========================================================
// طلب تكهين
// =========================================================

export const DisposalDialog = ({ open, onClose, onSaved, holdings = [], initialItemId = null, branchGuid }) => {
  const p = useTasksPalette();
  const [itemId, setItemId] = useState(null);
  const [qty, setQty] = useState("1");
  const [reason, setReason] = useState("");
  const [image, setImage] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setItemId(initialItemId);
    setQty("1");
    setReason("");
    setImage(null);
  }, [open, initialItemId]);

  const options = useMemo(() => holdings.filter((h) => h.qty - h.pendingOut > 0), [holdings]);
  const holding = holdings.find((h) => h.itemId === itemId) || null;
  const available = holding ? holding.qty - holding.pendingOut : 0;

  const save = async () => {
    const n = Number(qty);
    if (!holding) return showError(new Error("يُرجى اختيار الصنف المراد تكهينه"));
    if (!Number.isInteger(n) || n <= 0) return showError(new Error("يُرجى إدخال كمية صحيحة"));
    if (n > available) return showError(new Error(`الكمية المتاحة للتكهين ${available} فقط`));
    if (!reason.trim()) return showError(new Error("يُرجى كتابة سبب التكهين"));
    if (!image) return showError(new Error("يجب رفع مرفق التكهين (صورة أو محضر)"));
    try {
      setSaving(true);
      const json = await apiPostForm("/disposals", { branchGuid, catalogItemId: holding.itemId, qty: n, reason: reason.trim(), image });
      toast(json?.message || "تم إرسال طلب التكهين");
      onSaved?.();
      onClose();
    } catch (e) {
      showError(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="md" PaperProps={{ sx: { direction: "rtl" } }}>
      <DialogHeader
        icon={<DeleteSweepOutlinedIcon />}
        title="طلب تكهين صنف"
        subtitle="يُرسل الطلب إلى الحسابات، وعند الموافقة تُخصم الكمية من عهدة الفرع"
        onClose={onClose}
        disabled={saving}
      />
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} md={7}>
            <Stack spacing={2}>
              <Autocomplete
                options={options}
                value={holding}
                onChange={(_, v) => setItemId(v?.itemId ?? null)}
                getOptionLabel={(o) => [o.itemName, o.model].filter(Boolean).join(" - ")}
                isOptionEqualToValue={(a, b) => a.itemId === b.itemId}
                renderOption={(props, o) => (
                  <li {...props} key={o.itemId}>
                    <CatalogOption
                      guid={o.itemGuid}
                      hasImage={o.itemHasImage}
                      name={o.itemName}
                      model={o.model}
                      categoryName={o.categoryName}
                      extra={`المتاح: ${qtyText(o.qty - o.pendingOut)} ${o.unit}`}
                      size={56}
                    />
                  </li>
                )}
                ListboxProps={{ style: { maxHeight: 380 } }}
                noOptionsText="لا توجد أصناف معتمدة متاحة للتكهين"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="الصنف المراد تكهينه *"
                    placeholder="ابحث في أصناف عهدة الفرع"
                    InputProps={selectedAdornment(params, holding?.itemGuid, holding?.itemHasImage, holding?.itemName)}
                  />
                )}
              />
              {holding ? (
                <Typography sx={{ fontSize: 13, color: p.muted, px: 0.5 }}>
                  الرصيد {qtyText(holding.qty)} {holding.unit}
                  {holding.pendingOut ? ` — منها ${qtyText(holding.pendingOut)} محجوزة في طلبات لم تُنفّذ بعد` : ""}
                </Typography>
              ) : null}
              <TextField
                label={holding ? `الكمية * (المتاح ${qtyText(available)})` : "الكمية *"}
                type="number"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                inputProps={{ min: 1, max: available || undefined, step: 1 }}
                fullWidth
              />
              <TextField
                label="سبب التكهين *"
                placeholder="مثال: كسر في القاعدة ولا يمكن إصلاحه"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                multiline
                minRows={3}
                inputProps={{ maxLength: 1000 }}
                fullWidth
                sx={multilineSx(72, 180)}
              />
            </Stack>
          </Grid>
          <Grid item xs={12} md={5}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 0.75 }}>مرفق التكهين * (صورة الصنف أو محضر PDF)</Typography>
            <AttachmentPicker file={image} onChange={setImage} label="مرفق التكهين" height={240} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5, ...p.containedSx }}>
        <Button onClick={onClose} disabled={saving}>إلغاء</Button>
        <Button variant="contained" color="error" onClick={save} disabled={saving || !holding} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <DeleteSweepOutlinedIcon />}>
          إرسال طلب التكهين
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// =========================================================
// طلب تعديل (الفرع) + سبب إجراء (الإدارة)
// =========================================================

// target = { entityType, guid, title }
export const EditRequestDialog = ({ target, onClose, onSaved }) => {
  const p = useTasksPalette();
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (target) setNotes("");
  }, [target]);

  const save = async () => {
    if (!notes.trim()) return showError(new Error("يُرجى كتابة التعديل المطلوب"));
    try {
      setSaving(true);
      const json = await apiPost("/edit-requests", { entityType: target.entityType, entityGuid: target.guid, notes: notes.trim() });
      toast(json?.message || "تم إرسال طلب التعديل");
      onSaved?.();
      onClose();
    } catch (e) {
      showError(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={Boolean(target)} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { direction: "rtl" } }}>
      <DialogHeader icon={<EditNoteOutlinedIcon />} title="طلب تعديل" subtitle={target?.title} onClose={onClose} disabled={saving} />
      <DialogContent>
        <Alert severity="info" sx={{ mt: 1, mb: 1.5, fontWeight: 600 }}>
          اكتب بوضوح ما الخطأ وما التعديل المطلوب، وسيصل الطلب إلى المراجع ليعدّله أو يفتحه لك للتعديل.
        </Alert>
        <TextField
          autoFocus
          label="التعديل المطلوب *"
          placeholder="مثال: الكمية الصحيحة 45 وليست 54"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          multiline
          minRows={3}
          fullWidth
          inputProps={{ maxLength: 1000 }}
          sx={multilineSx(72, 200)}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5, ...p.containedSx }}>
        <Button onClick={onClose} disabled={saving}>إلغاء</Button>
        <Button variant="contained" onClick={save} disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <EditNoteOutlinedIcon />}>
          إرسال طلب التعديل
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// إجراء من الإدارة لازم له سبب (حذف / إلغاء / فتح للفرع / رفض طلب تعديل).
// action = { title, label, placeholder, confirmLabel, color, hint, initial, optional, run(notes) }
export const ReasonDialog = ({ action, onClose }) => {
  const p = useTasksPalette();
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (action) setNotes(action.initial || "");
  }, [action]);

  const confirm = async () => {
    if (!action.optional && !notes.trim()) return showError(new Error(`يُرجى كتابة ${action.label || "السبب"}`));
    try {
      setSaving(true);
      await action.run(notes.trim());
      onClose();
    } catch (e) {
      showError(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={Boolean(action)} onClose={saving ? undefined : onClose} fullWidth maxWidth="xs" PaperProps={{ sx: { direction: "rtl" } }}>
      <DialogHeader title={action?.title || ""} onClose={onClose} disabled={saving} />
      <DialogContent>
        {action?.hint ? <Alert severity={action.color === "error" ? "warning" : "info"} sx={{ mt: 1, fontWeight: 600 }}>{action.hint}</Alert> : null}
        <TextField
          autoFocus
          label={`${action?.label || "السبب"}${action?.optional ? " (اختياري)" : " *"}`}
          placeholder={action?.placeholder || ""}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          multiline
          minRows={3}
          fullWidth
          inputProps={{ maxLength: 1000 }}
          sx={{ mt: 1.5, ...multilineSx(72, 200) }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5, ...p.containedSx }}>
        <Button onClick={onClose} disabled={saving}>تراجع</Button>
        <Button variant="contained" color={action?.color || "primary"} onClick={confirm} disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>
          {action?.confirmLabel || "تأكيد"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// =========================================================
// السجل + التفاصيل
// =========================================================

export const HistoryList = ({ entityType, guid }) => {
  const p = useTasksPalette();
  const [rows, setRows] = useState(null);

  useEffect(() => {
    let alive = true;
    setRows(null);
    apiGet("/history", { entityType, guid })
      .then((json) => alive && setRows(json?.rows || []))
      .catch(() => alive && setRows([]));
    return () => {
      alive = false;
    };
  }, [entityType, guid]);

  if (rows === null) return <CircularProgress size={20} />;
  if (!rows.length) return <Typography sx={{ fontSize: 13, color: p.muted }}>لا يوجد سجل</Typography>;
  return (
    <Stack spacing={1}>
      {rows.map((r, i) => (
        <Stack key={i} direction="row" spacing={1} alignItems="flex-start">
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: r.action === "Rejected" ? "#dc2626" : r.action === "Approved" ? "#059669" : p.primary, mt: 0.9, flexShrink: 0 }} />
          <Box>
            <Typography sx={{ fontSize: 13.5 }}>
              <b>{r.by || "—"}</b> {LOG_ACTION[r.action] || r.action}
              {r.notes ? ` — ${r.notes}` : ""}
            </Typography>
            <Typography sx={{ fontSize: 11.5, color: p.muted }}>{formatDateTime(r.at)}</Typography>
          </Box>
        </Stack>
      ))}
    </Stack>
  );
};

const InfoRow = ({ label, children }) => {
  const p = useTasksPalette();
  return (
    <Stack direction="row" spacing={1} sx={{ py: 0.6, borderBottom: `1px dashed ${p.border}` }}>
      <Typography sx={{ fontSize: 13, color: p.muted, minWidth: 110, flexShrink: 0 }}>{label}</Typography>
      <Box sx={{ fontSize: 13.5, fontWeight: 600, minWidth: 0, wordBreak: "break-word" }}>{children || "—"}</Box>
    </Stack>
  );
};

// actions = أزرار تحت (موافقة/رفض في المراجعة، تعديل/حذف في الفرع)
export const EntryDetailsDialog = ({ entry, onClose, actions }) => {
  const theme = useTheme();
  const phone = useMediaQuery(theme.breakpoints.down("sm"));
  const p = useTasksPalette();
  if (!entry) return null;

  return (
    <Dialog open onClose={onClose} fullScreen={phone} fullWidth maxWidth="md" PaperProps={{ sx: { direction: "rtl" } }}>
      <DialogHeader icon={<ChairOutlinedIcon />} title={entry.itemName} subtitle={`${entry.branchName} — طلب رقم ${entry.id}`} onClose={onClose} />
      <DialogContent dividers>
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={6}>
            <Typography sx={{ fontSize: 12.5, color: p.muted, mb: 0.5 }}>صورة الصنف من الفرع</Typography>
            <AuthImage kind="entry-image" guid={entry.guid} height={phone ? 240 : 300} title={entry.itemName} />
            {entry.itemHasImage ? (
              <>
                <Typography sx={{ fontSize: 12.5, color: p.muted, mt: 1.5, mb: 0.5 }}>صورة الصنف المعتمدة من الإدارة</Typography>
                <AuthImage kind="catalog" guid={entry.itemGuid} height={130} title={entry.itemName} />
              </>
            ) : null}
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack direction="row" spacing={0.75} sx={{ mb: 1.25 }} flexWrap="wrap" useFlexGap>
              <EntryStatusChip status={entry.status} />
              <EntryTypeChip type={entry.entryType} />
              {entry.categoryName ? <SoftChip label={entry.categoryName} color="#64748b" /> : null}
            </Stack>
            {entry.status === "Rejected" && entry.reviewNotes ? (
              <Alert severity="error" sx={{ mb: 1.25, fontWeight: 600 }}>سبب الرفض: {entry.reviewNotes}</Alert>
            ) : null}
            {entry.status === "Returned" && entry.reviewNotes ? (
              <Alert severity="warning" sx={{ mb: 1.25, fontWeight: 600 }}>مفتوح للتعديل — المطلوب: {entry.reviewNotes}</Alert>
            ) : null}
            {entry.status === "Deleted" ? (
              <Alert severity="info" sx={{ mb: 1.25, fontWeight: 600 }}>حذفته الإدارة{entry.reviewNotes ? ` — السبب: ${entry.reviewNotes}` : ""}</Alert>
            ) : null}
            {entry.status === "Approved" && entry.reviewNotes ? (
              <Alert severity="success" sx={{ mb: 1.25, fontWeight: 600 }}>ملاحظة الحسابات: {entry.reviewNotes}</Alert>
            ) : null}
            <InfoRow label="الكمية">{qtyText(entry.qty)} {entry.unit}</InfoRow>
            <InfoRow label="سعر الوحدة">{money(entry.unitPrice)}</InfoRow>
            <InfoRow label="الإجمالي"><span style={{ color: p.primary }}>{money(entry.totalPrice)}</span></InfoRow>
            <InfoRow label="الموديل">{entry.model}</InfoRow>
            {entry.entryType === "Purchase" ? (
              <>
                <InfoRow label="تاريخ الشراء">{entry.purchaseDate ? formatDate(entry.purchaseDate) : ""}</InfoRow>
                <InfoRow label="المورد">{entry.supplierName}</InfoRow>
                <InfoRow label="رقم الفاتورة">{entry.invoiceNo}</InfoRow>
                <InfoRow label="الفاتورة">
                  {entry.hasInvoice ? (
                    <Button
                      size="small"
                      startIcon={<ReceiptLongOutlinedIcon />}
                      onClick={() => openAuthFile(fileUrl("entry-invoice", entry.guid)).catch(showError)}
                      sx={{ p: 0, minWidth: 0 }}
                    >
                      {entry.invoiceFileName || "فتح الفاتورة"}
                    </Button>
                  ) : null}
                </InfoRow>
              </>
            ) : null}
            <InfoRow label="ملاحظات"><span style={{ whiteSpace: "pre-wrap", fontWeight: 400 }}>{entry.notes}</span></InfoRow>
            <InfoRow label="أضافه">{entry.createdBy} — {formatDateTime(entry.createdAt)}</InfoRow>
            {entry.reviewedBy ? <InfoRow label="راجعه">{entry.reviewedBy} — {formatDateTime(entry.reviewedAt)}</InfoRow> : null}

            <Divider sx={{ my: 1.5 }} />
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
              <HistoryIcon sx={{ fontSize: 18, color: p.muted }} />
              <Typography sx={{ fontWeight: 700, fontSize: 14 }}>السجل</Typography>
            </Stack>
            <HistoryList entityType="Entry" guid={entry.guid} />
          </Grid>
        </Grid>
      </DialogContent>
      {actions ? <DialogActions sx={{ px: 3, py: 1.5, gap: 1, flexWrap: "wrap", ...p.containedSx }}>{actions}</DialogActions> : null}
    </Dialog>
  );
};

// سبب الرفض / ملاحظة الموافقة
export const DecisionDialog = ({ open, approve, title, onClose, onConfirm, confirmLabel, hint }) => {
  const p = useTasksPalette();
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setNotes("");
  }, [open]);

  const confirm = async () => {
    if (!approve && !notes.trim()) return showError(new Error("يُرجى كتابة سبب الرفض"));
    try {
      setSaving(true);
      await onConfirm(notes.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="xs" PaperProps={{ sx: { direction: "rtl" } }}>
      <DialogHeader title={title} onClose={onClose} disabled={saving} />
      <DialogContent>
        {hint ? <Alert severity="info" sx={{ mt: 1, fontWeight: 600 }}>{hint}</Alert> : null}
        <TextField
          autoFocus
          label={approve ? "ملاحظة (اختياري)" : "سبب الرفض *"}
          placeholder={approve ? "" : "اكتب للفرع موضع الخطأ ليقوم بتعديله"}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          multiline
          minRows={3}
          fullWidth
          inputProps={{ maxLength: 1000 }}
          sx={{ mt: 1, ...multilineSx(72, 200) }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5, ...p.containedSx }}>
        <Button onClick={onClose} disabled={saving}>تراجع</Button>
        <Button variant="contained" color={approve ? "primary" : "error"} onClick={confirm} disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>
          {confirmLabel || (approve ? "تأكيد الموافقة" : "تأكيد الرفض")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// index.css بيحط min-width: 0 على كل الحقول جوه الشاشة، فالعرض لازم يكون width ثابت.
// "الكل" بقيمة داخلية مش فاضية عشان يبان كنص والعنوان يفضل فوق.
const ALL = "__all__";

export const filterFieldSx = (width = 200) => ({ width: { xs: "100%", sm: width }, flexShrink: 0 });

export const FilterSelect = ({ label, value, onChange, options, allLabel, width = 200, size = "small" }) => (
  <FormControl size={size} sx={filterFieldSx(width)}>
    <InputLabel shrink>{label}</InputLabel>
    <Select
      label={label}
      notched
      value={value === "" || value === null || value === undefined ? (allLabel ? ALL : "") : value}
      onChange={(e) => onChange(e.target.value === ALL ? "" : e.target.value)}
    >
      {allLabel ? <MenuItem value={ALL}>{allLabel}</MenuItem> : null}
      {options.map((o) => (
        <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
      ))}
    </Select>
  </FormControl>
);

export const BranchSelect = ({ branches, value, onChange, label = "الفرع", allLabel, width = 220 }) => (
  <FilterSelect
    label={label}
    value={value}
    onChange={onChange}
    allLabel={allLabel}
    width={width}
    options={branches.map((b) => ({ value: b.guid, label: b.name }))}
  />
);

export const IconAction = ({ title, onClick, children, color }) => (
  <Tooltip title={title}>
    <span>
      <IconButton size="small" color={color} onClick={(e) => { e.stopPropagation(); onClick(); }}>
        {children}
      </IconButton>
    </span>
  </Tooltip>
);
