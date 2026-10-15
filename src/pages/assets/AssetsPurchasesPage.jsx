// شاشة "طلبات الشراء": طلب شراء + 3 عروض أسعار على الأقل ← اعتماد عرض واحد ← تسجيل الشراء بالفاتورة
// ← طلب إضافة (شراء) يروح للحسابات، وبعد اعتماده ينزل على عهدة الفرع.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Radio,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import HistoryIcon from "@mui/icons-material/History";
import { CenterLoader, EmptyState, NoAccess, SectionCard, SoftChip, TasksPageShell, confirmAction, multilineSx, showError, toast } from "../tasks/TasksUi";
import { formatDateTime, readJson, useTasksPalette } from "../tasks/tasksCommon";
import { ASSETS_API, PURCHASE_STATUS, apiGet, apiPost, apiPostForm, getUserGuid, money, qtyText } from "./assetsCommon";
import {
  AssetThumb,
  AttachmentPicker,
  BranchSelect,
  DialogHeader,
  EntryStatusChip,
  FileButton,
  FilterSelect,
  HistoryList,
  ImagePicker,
  filterFieldSx
} from "./AssetsUi";

const PurchaseStatusChip = ({ status }) => {
  const s = PURCHASE_STATUS[status] || { label: status, color: "#6b7280" };
  return <SoftChip label={s.label} color={s.color} />;
};

const emptyQuote = () => ({ supplier: "", amount: "", notes: "", file: null });

// =========================================================
// طلب شراء جديد
// =========================================================

const NewPurchaseDialog = ({ open, onClose, onSaved, branchGuid, branchName, items, minQuotes, maxQuotes }) => {
  const theme = useTheme();
  const phone = useMediaQuery(theme.breakpoints.down("sm"));
  const p = useTasksPalette();
  const [itemId, setItemId] = useState(null);
  const [qty, setQty] = useState("1");
  const [description, setDescription] = useState("");
  const [quotes, setQuotes] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setItemId(null);
    setQty("1");
    setDescription("");
    setQuotes(Array.from({ length: minQuotes }, emptyQuote));
  }, [open, minQuotes]);

  const item = items.find((i) => i.id === itemId) || null;
  const setQuote = (index, patch) => setQuotes((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)));

  const save = async () => {
    const n = Number(qty);
    if (!item) return showError(new Error("يُرجى اختيار الصنف المطلوب شراؤه"));
    if (!Number.isInteger(n) || n <= 0) return showError(new Error("يُرجى إدخال كمية صحيحة"));
    if (!description.trim()) return showError(new Error("يُرجى كتابة وصف دقيق لما سيتم شراؤه"));
    for (let i = 0; i < quotes.length; i += 1) {
      const q = quotes[i];
      if (!q.supplier.trim()) return showError(new Error(`يُرجى كتابة اسم المورد في العرض ${i + 1}`));
      if (!(Number(q.amount) > 0)) return showError(new Error(`يُرجى إدخال قيمة العرض ${i + 1}`));
      if (!q.file) return showError(new Error(`يُرجى إرفاق ملف العرض ${i + 1}`));
    }
    try {
      setSaving(true);
      // القوائم بتتبعت بنفس الترتيب (مورد/قيمة/ملاحظة/ملف) لكل عرض.
      const form = new FormData();
      form.append("userGuid", getUserGuid());
      form.append("branchGuid", branchGuid);
      form.append("catalogItemId", item.id);
      form.append("qty", n);
      form.append("description", description.trim());
      quotes.forEach((q) => {
        form.append("quoteSupplier", q.supplier.trim());
        form.append("quoteAmount", Number(q.amount));
        form.append("quoteNotes", q.notes.trim());
        form.append("quoteFiles", q.file);
      });
      const json = await readJson(await fetch(`${ASSETS_API}/purchases`, { method: "POST", body: form }));
      toast(json?.message || "تم إرسال طلب الشراء");
      onSaved?.();
      onClose();
    } catch (e) {
      showError(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullScreen={phone} fullWidth maxWidth="md" PaperProps={{ sx: { direction: "rtl" } }}>
      <DialogHeader
        icon={<ShoppingCartIcon />}
        title="طلب شراء جديد"
        subtitle={`${branchName ? `الفرع: ${branchName} — ` : ""}يجب إرفاق ${minQuotes} عروض أسعار على الأقل، وسيُعتمد أحدها`}
        onClose={onClose}
        disabled={saving}
      />
      <DialogContent dividers sx={p.containedSx}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Autocomplete
              options={items}
              value={item}
              onChange={(_, v) => setItemId(v?.id || null)}
              getOptionLabel={(o) => [o.name, o.model].filter(Boolean).join(" - ")}
              groupBy={(o) => o.categoryName || "بدون مجموعة"}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              renderOption={(props, o) => (
                <li {...props} key={o.id}>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 0.5 }}>
                    <AssetThumb kind="catalog" guid={o.guid} hasImage={o.hasImage} size={56} title={o.name} />
                    <Box>
                      <Typography sx={{ fontWeight: 700 }}>{o.name}</Typography>
                      <Typography sx={{ fontSize: 12.5, color: p.muted }}>{[o.model && `موديل ${o.model}`, o.categoryName].filter(Boolean).join(" · ")}</Typography>
                    </Box>
                  </Stack>
                </li>
              )}
              noOptionsText="لا توجد أصناف، ويجب أن تضيفها الإدارة أولًا"
              renderInput={(params) => <TextField {...params} label="الصنف المطلوب شراؤه *" placeholder="ابحث باسم الصنف أو الموديل" />}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField label="الكمية *" type="number" value={qty} onChange={(e) => setQty(e.target.value)} inputProps={{ min: 1, step: 1 }} fullWidth />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="وصف ما سيتم شراؤه بالتحديد *"
              placeholder="المواصفات، المقاسات، اللون، سبب الاحتياج..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              minRows={3}
              fullWidth
              inputProps={{ maxLength: 2000 }}
              sx={multilineSx(72, 200)}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.25 }}>
          <Typography sx={{ fontWeight: 800 }}>عروض الأسعار ({quotes.length})</Typography>
          <Button size="small" startIcon={<AddIcon />} disabled={quotes.length >= maxQuotes} onClick={() => setQuotes((prev) => [...prev, emptyQuote()])}>
            إضافة عرض
          </Button>
        </Stack>
        <Stack spacing={1.5}>
          {quotes.map((q, i) => (
            <Box key={i} sx={{ p: 1.5, borderRadius: 3, border: `1px solid ${p.border}`, bgcolor: p.nested }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 14 }}>العرض {i + 1}</Typography>
                {quotes.length > minQuotes ? (
                  <IconButton size="small" color="error" onClick={() => setQuotes((prev) => prev.filter((_, j) => j !== i))}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                ) : null}
              </Stack>
              <Grid container spacing={1.5}>
                <Grid item xs={12} md={7}>
                  <Stack spacing={1.5}>
                    <TextField size="small" label="اسم المورد *" value={q.supplier} onChange={(e) => setQuote(i, { supplier: e.target.value })} inputProps={{ maxLength: 200 }} fullWidth />
                    <TextField
                      size="small"
                      label="إجمالي العرض *"
                      type="number"
                      value={q.amount}
                      onChange={(e) => setQuote(i, { amount: e.target.value })}
                      inputProps={{ min: 0, step: "0.01" }}
                      fullWidth
                    />
                    <TextField size="small" label="ملاحظة (اختياري)" value={q.notes} onChange={(e) => setQuote(i, { notes: e.target.value })} inputProps={{ maxLength: 500 }} fullWidth />
                  </Stack>
                </Grid>
                <Grid item xs={12} md={5}>
                  <AttachmentPicker file={q.file} onChange={(file) => setQuote(i, { file })} label={`ملف العرض ${i + 1}`} height={128} />
                </Grid>
              </Grid>
            </Box>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5, ...p.containedSx }}>
        <Button onClick={onClose} disabled={saving}>إلغاء</Button>
        <Button variant="contained" onClick={save} disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <ShoppingCartIcon />}>
          إرسال طلب الشراء
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// =========================================================
// تسجيل الشراء (بعد اعتماد العرض)
// =========================================================

const CompleteDialog = ({ request, onClose, onSaved }) => {
  const p = useTasksPalette();
  const selected = request?.quotes?.find((q) => q.selected);
  const [total, setTotal] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [notes, setNotes] = useState("");
  const [invoice, setInvoice] = useState(null);
  const [image, setImage] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!request) return;
    setTotal(selected ? String(selected.totalAmount) : "");
    setPurchaseDate(new Date().toISOString().slice(0, 10));
    setInvoiceNo("");
    setNotes("");
    setInvoice(null);
    setImage(null);
  }, [request]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    if (!(Number(total) > 0)) return showError(new Error("يُرجى إدخال إجمالي مبلغ الشراء الفعلي"));
    if (!invoice) return showError(new Error("يجب رفع فاتورة الشراء"));
    if (!image) return showError(new Error("يجب رفع صورة الصنف بعد الشراء"));
    try {
      setSaving(true);
      const json = await apiPostForm(`/purchases/${request.guid}/complete`, {
        totalAmount: Number(total),
        purchaseDate,
        invoiceNo: invoiceNo.trim(),
        notes: notes.trim(),
        invoice,
        image
      });
      toast(json?.message || "تم تسجيل الشراء");
      onSaved?.();
      onClose();
    } catch (e) {
      showError(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={Boolean(request)} onClose={saving ? undefined : onClose} fullWidth maxWidth="md" PaperProps={{ sx: { direction: "rtl" } }}>
      <DialogHeader
        icon={<ReceiptLongOutlinedIcon />}
        title="تسجيل الشراء"
        subtitle={request ? `${request.itemName} × ${request.qty} — المورد المعتمد: ${selected?.supplierName || ""}` : ""}
        onClose={onClose}
        disabled={saving}
      />
      <DialogContent dividers>
        <Alert severity="info" sx={{ mb: 2, fontWeight: 600 }}>
          بعد التسجيل يُرسل الشراء إلى الحسابات لمراجعة الفاتورة، وعند اعتماده يُضاف الصنف إلى عهدة الفرع.
        </Alert>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Stack spacing={1.75}>
              <TextField
                label="إجمالي مبلغ الشراء الفعلي *"
                type="number"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                inputProps={{ min: 0, step: "0.01" }}
                helperText={selected ? `قيمة العرض المعتمد: ${money(selected.totalAmount)}` : ""}
                fullWidth
              />
              <TextField label="تاريخ الشراء" type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
              <TextField label="رقم الفاتورة" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} inputProps={{ maxLength: 100 }} fullWidth />
              <TextField label="ملاحظات" value={notes} onChange={(e) => setNotes(e.target.value)} multiline minRows={2} fullWidth inputProps={{ maxLength: 1000 }} sx={multilineSx(56, 160)} />
            </Stack>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 0.75 }}>فاتورة الشراء *</Typography>
            <AttachmentPicker file={invoice} onChange={setInvoice} label="فاتورة الشراء" height={150} />
            <Typography sx={{ fontSize: 13, fontWeight: 700, mt: 2, mb: 0.75 }}>صورة الصنف بعد الشراء *</Typography>
            <ImagePicker file={image} onChange={setImage} required height={170} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5, ...p.containedSx }}>
        <Button onClick={onClose} disabled={saving}>إلغاء</Button>
        <Button variant="contained" onClick={save} disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <ReceiptLongOutlinedIcon />}>
          تسجيل الشراء وإرساله للحسابات
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// =========================================================
// تفاصيل الطلب + اعتماد عرض
// =========================================================

const PurchaseDetailsDialog = ({ request, canDecide, canAct, onClose, onChanged, onComplete }) => {
  const theme = useTheme();
  const phone = useMediaQuery(theme.breakpoints.down("sm"));
  const p = useTasksPalette();
  const [quoteGuid, setQuoteGuid] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setQuoteGuid("");
    setNotes("");
  }, [request]);

  if (!request) return null;
  const pending = request.status === "Pending";
  const lowest = Math.min(...request.quotes.map((q) => q.totalAmount));

  const decide = async (approve) => {
    if (approve && !quoteGuid) return showError(new Error("يُرجى اختيار عرض السعر المعتمد"));
    if (!approve && !notes.trim()) return showError(new Error("يُرجى كتابة سبب الرفض في خانة الملاحظة"));
    try {
      setSaving(true);
      const json = await apiPost(`/purchases/${request.guid}/review`, { approve, quoteGuid: approve ? quoteGuid : null, notes: notes.trim() });
      toast(json?.message || "تم");
      onChanged();
      onClose();
    } catch (e) {
      showError(e);
    } finally {
      setSaving(false);
    }
  };

  const cancel = async () => {
    if (!(await confirmAction("إلغاء طلب الشراء؟", `${request.itemName} × ${request.qty}`, true))) return;
    try {
      const json = await apiPost(`/purchases/${request.guid}/cancel`);
      toast(json?.message || "تم الإلغاء");
      onChanged();
      onClose();
    } catch (e) {
      showError(e);
    }
  };

  return (
    <Dialog open onClose={saving ? undefined : onClose} fullScreen={phone} fullWidth maxWidth="md" PaperProps={{ sx: { direction: "rtl" } }}>
      <DialogHeader
        icon={<ShoppingCartIcon />}
        title={`طلب شراء رقم ${request.id}: ${request.itemName}`}
        subtitle={`${request.branchName} — ${request.requestedBy} — ${formatDateTime(request.requestedAt)}`}
        onClose={onClose}
        disabled={saving}
      />
      <DialogContent dividers sx={p.containedSx}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 2 }}>
          <AssetThumb kind="catalog" guid={request.itemGuid} hasImage={request.itemHasImage} size={72} title={request.itemName} />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={0.75} sx={{ mb: 0.75 }} flexWrap="wrap" useFlexGap>
              <PurchaseStatusChip status={request.status} />
              {request.entryStatus ? <EntryStatusChip status={request.entryStatus} /> : null}
              <SoftChip label={`الكمية: ${qtyText(request.qty)} ${request.unit}`} color="#64748b" />
            </Stack>
            <Typography sx={{ fontSize: 13.5, whiteSpace: "pre-wrap" }}>{request.description}</Typography>
            {request.reviewNotes ? (
              <Alert severity={request.status === "Rejected" ? "error" : "info"} sx={{ mt: 1, fontWeight: 600 }}>
                {request.status === "Rejected" ? "سبب الرفض" : "ملاحظة المعتمِد"}: {request.reviewNotes}
              </Alert>
            ) : null}
          </Box>
        </Stack>

        <Typography sx={{ fontWeight: 800, mb: 1 }}>عروض الأسعار</Typography>
        <Stack spacing={1}>
          {request.quotes.map((q) => (
            <Stack
              key={q.guid}
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              alignItems={{ xs: "stretch", sm: "center" }}
              onClick={() => pending && canDecide && setQuoteGuid(String(q.guid))}
              sx={{
                p: 1.25,
                borderRadius: 2.5,
                border: `2px solid ${q.selected || quoteGuid === String(q.guid) ? "#059669" : p.border}`,
                bgcolor: q.selected ? p.tone("#059669").bg : "transparent",
                cursor: pending && canDecide ? "pointer" : "default"
              }}
            >
              {pending && canDecide ? <Radio checked={quoteGuid === String(q.guid)} size="small" /> : null}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Typography sx={{ fontWeight: 700 }}>{q.supplierName}</Typography>
                  {q.totalAmount === lowest && request.quotes.length > 1 ? <SoftChip label="الأقل سعرًا" color="#2563eb" /> : null}
                  {q.selected ? <SoftChip label="العرض المعتمد" color="#059669" strong /> : null}
                </Stack>
                {q.notes ? <Typography sx={{ fontSize: 12.5, color: p.muted }}>{q.notes}</Typography> : null}
              </Box>
              <Typography sx={{ fontWeight: 800, color: p.primary, minWidth: 110 }}>{money(q.totalAmount)}</Typography>
              <FileButton kind="quote" guid={q.guid} label={q.fileName} />
            </Stack>
          ))}
        </Stack>

        {pending && canDecide ? (
          <TextField
            label="ملاحظة للفرع (إلزامية عند الرفض)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline
            minRows={2}
            fullWidth
            inputProps={{ maxLength: 1000 }}
            sx={{ mt: 2, ...multilineSx(56, 160) }}
          />
        ) : null}

        {request.purchasedBy ? (
          <Typography sx={{ fontSize: 13, color: p.muted, mt: 2 }}>
            سجّل الشراء: {request.purchasedBy} — {formatDateTime(request.purchasedAt)}
          </Typography>
        ) : null}

        <Divider sx={{ my: 2 }} />
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
          <HistoryIcon sx={{ fontSize: 18, color: p.muted }} />
          <Typography sx={{ fontWeight: 700, fontSize: 14 }}>السجل</Typography>
        </Stack>
        <HistoryList entityType="Purchase" guid={request.guid} />
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5, gap: 1, flexWrap: "wrap", ...p.containedSx }}>
        {canAct && ["Pending", "Approved"].includes(request.status) ? (
          <Button color="error" onClick={cancel} disabled={saving} sx={{ ml: "auto" }}>إلغاء الطلب</Button>
        ) : null}
        {pending && canDecide ? (
          <>
            <Button color="error" variant="outlined" startIcon={<HighlightOffIcon />} disabled={saving} onClick={() => decide(false)}>رفض</Button>
            <Button variant="contained" startIcon={<CheckCircleOutlineIcon />} disabled={saving || !quoteGuid} onClick={() => decide(true)}>
              اعتماد العرض المختار
            </Button>
          </>
        ) : null}
        {request.status === "Approved" && canAct ? (
          <Button variant="contained" startIcon={<ReceiptLongOutlinedIcon />} onClick={() => onComplete(request)}>تم الشراء — تسجيل الفاتورة</Button>
        ) : null}
      </DialogActions>
    </Dialog>
  );
};

// =========================================================
// قائمة طلبات الشراء — بتتعرض كتبويب في "أصول الفرع" (للمشرف) وفي "مراجعة الأصول" (للمعتمِد)
// =========================================================

// branchGuid = فلتر الفرع ("" = كل الفروع لمن يرى الكل)، status = فلتر الحالة، search = بحث.
// onCount بيرجّع عدد الطلبات (لعنوان التبويب) وعدد اللي مستني القرار.
export const PurchasesPanel = ({ branchGuid = "", status = "", search = "", items = [], branches = [], onCount }) => {
  const p = useTasksPalette();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [details, setDetails] = useState(null);
  const [completeFor, setCompleteFor] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const json = await apiGet("/purchases", { branchGuid, status });
      setData(json);
      onCount?.({
        total: json?.requests?.length || 0,
        pending: (json?.requests || []).filter((r) => r.status === "Pending").length
      });
    } catch (e) {
      setData(null);
      showError(e);
    } finally {
      setLoading(false);
    }
  }, [branchGuid, status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  const requests = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.requests || []).filter((r) => !q || [r.itemName, r.branchName, r.requestedBy, r.description, ...r.quotes.map((x) => x.supplierName)].join(" ").toLowerCase().includes(q));
  }, [data, search]);

  const createBranch = branchGuid || data?.branchGuid || "";
  const createBranchName = branches.find((b) => b.guid === createBranch)?.name || "";
  const canCreate = Boolean(data?.canCreate) && Boolean(createBranch);

  return (
    <Box>
      {data?.canAct ? (
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} sx={{ mb: 1.5 }} flexWrap="wrap" useFlexGap>
          <Typography sx={{ fontSize: 13, color: p.muted }}>
            طلب الشراء بثلاثة عروض أسعار على الأقل ← اعتماد عرض واحد ← الشراء وتسجيل الفاتورة ← الإضافة إلى العهدة بعد مراجعة الحسابات
          </Typography>
          <Tooltip title={canCreate ? "" : "طلبات الشراء مغلقة حاليًا من الإدارة"}>
            <span>
              <Button variant="contained" startIcon={<AddIcon />} disabled={!canCreate} onClick={() => setNewOpen(true)}>طلب شراء جديد</Button>
            </span>
          </Tooltip>
        </Stack>
      ) : null}

      {loading && !data ? <CenterLoader /> : null}

      {data ? (
        requests.length ? (
          <SectionCard>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>رقم</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>الصنف</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>الفرع</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">الكمية</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>العروض</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>طلبه</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>الحالة</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requests.map((r) => {
                    const selected = r.quotes.find((q) => q.selected);
                    return (
                      <TableRow key={r.guid} hover sx={{ cursor: "pointer" }} onClick={() => setDetails(r)}>
                        <TableCell>{r.id}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1.25} alignItems="center">
                            <AssetThumb kind="catalog" guid={r.itemGuid} hasImage={r.itemHasImage} size={42} title={r.itemName} />
                            <Box sx={{ minWidth: 0 }}>
                              <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{r.itemName}</Typography>
                              <Typography sx={{ fontSize: 12, color: p.muted, maxWidth: 260 }} noWrap title={r.description}>{r.description}</Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>{r.branchName}</TableCell>
                        <TableCell align="center">{qtyText(r.qty)}</TableCell>
                        <TableCell>
                          {selected ? (
                            <Typography sx={{ fontSize: 13, color: "#059669", fontWeight: 700 }}>{selected.supplierName} — {money(selected.totalAmount)}</Typography>
                          ) : (
                            <Typography sx={{ fontSize: 13 }}>{r.quotes.length} عروض — من {money(Math.min(...r.quotes.map((q) => q.totalAmount)))}</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 13 }}>{r.requestedBy}</Typography>
                          <Typography sx={{ fontSize: 11.5, color: p.muted }}>{formatDateTime(r.requestedAt)}</Typography>
                        </TableCell>
                        <TableCell>
                          <PurchaseStatusChip status={r.status} />
                          {r.entryStatus ? <Box sx={{ mt: 0.5 }}><EntryStatusChip status={r.entryStatus} /></Box> : null}
                        </TableCell>
                        <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                          {r.status === "Approved" && data.canAct ? (
                            <Button size="small" variant="contained" startIcon={<ReceiptLongOutlinedIcon />} onClick={() => setCompleteFor(r)}>تم الشراء</Button>
                          ) : r.status === "Pending" && data.canDecide ? (
                            <Button size="small" variant="outlined" onClick={() => setDetails(r)}>مراجعة العروض</Button>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </SectionCard>
        ) : (
          <EmptyState
            text={status === "Pending" ? "لا توجد طلبات شراء بانتظار اعتماد عرض" : "لا توجد طلبات شراء"}
            hint={canCreate ? "اضغط \"طلب شراء جديد\" وأرفق 3 عروض أسعار على الأقل" : undefined}
          />
        )
      ) : null}

      <NewPurchaseDialog
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onSaved={load}
        branchGuid={createBranch}
        branchName={createBranchName}
        items={items}
        minQuotes={data?.minQuotes || 3}
        maxQuotes={data?.maxQuotes || 6}
      />
      <PurchaseDetailsDialog
        request={details}
        canDecide={Boolean(data?.canDecide)}
        canAct={Boolean(data?.canAct)}
        onClose={() => setDetails(null)}
        onChanged={load}
        onComplete={(r) => {
          setDetails(null);
          setCompleteFor(r);
        }}
      />
      <CompleteDialog request={completeFor} onClose={() => setCompleteFor(null)} onSaved={load} />
    </Box>
  );
};

// المسار القديم /dashboard/assets/purchases: نفس القائمة بفلاترها (الشاشة مخفية من القائمة الجانبية).
const AssetsPurchasesPage = () => {
  const [boot, setBoot] = useState(null);
  const [bootError, setBootError] = useState("");
  const [items, setItems] = useState([]);
  const [branchGuid, setBranchGuid] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    apiGet("/bootstrap")
      .then(setBoot)
      .catch((e) => setBootError(e.status === 403 ? "ليس لديك صلاحية على طلبات الشراء" : e.message));
    apiGet("/catalog").then((json) => setItems(json?.items || [])).catch(() => setItems([]));
  }, []);

  if (bootError) return <NoAccess message={bootError} />;
  if (!boot) return <CenterLoader />;
  if (!boot.access.purchase) return <NoAccess message="ليس لديك صلاحية على طلبات الشراء" />;
  const canChoose = boot.access.purchaseEdit || boot.access.report;

  return (
    <TasksPageShell icon={<ShoppingCartIcon />} title="طلبات الشراء" subtitle="طلبات الشراء بعروض الأسعار">
      <SectionCard sx={{ mb: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ p: 1.5 }} flexWrap="wrap" useFlexGap>
          {canChoose ? <BranchSelect branches={boot.branches} value={branchGuid} onChange={setBranchGuid} allLabel="كل الفروع" /> : null}
          <FilterSelect
            label="الحالة"
            value={status}
            onChange={setStatus}
            allLabel="كل الحالات"
            width={230}
            options={Object.entries(PURCHASE_STATUS).map(([k, v]) => ({ value: k, label: v.label }))}
          />
          <TextField
            size="small"
            placeholder="بحث (صنف، فرع، مورد...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={filterFieldSx(260)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          />
        </Stack>
      </SectionCard>
      <PurchasesPanel branchGuid={branchGuid} status={status} search={search} items={items} branches={boot.branches} />
    </TasksPageShell>
  );
};

export default AssetsPurchasesPage;
