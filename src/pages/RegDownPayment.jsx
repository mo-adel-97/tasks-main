// مقدم التسجيل — الحد الأدنى للدفعة المقدمة لتسجيل الدبلوم لكل فرع (RegSetting.AmountPay)، تحت الإعدادات العامة.
// طلب الالتحاق بيقرأ القيمة دي مباشرة من قاعدة البيانات.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  InputAdornment,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useTheme
} from "@mui/material";
import LocalAtmRoundedIcon from "@mui/icons-material/LocalAtmRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import Swal from "sweetalert2";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || "https://api4.sstli.com";
const primary = "#057546";
const primaryDark = "#034d31";

const money = (v) => Number(v || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });

const getUserGuid = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return String(user?.guid || user?.Guid || "").trim();
  } catch {
    return "";
  }
};

export default function RegDownPayment() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [items, setItems] = useState([]);
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState([]);
  const [amount, setAmount] = useState("");
  const [rowAmounts, setRowAmounts] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ userGuid: getUserGuid() });
      const response = await fetch(`${API_BASE_URL}/api/reg-down-payment?${params}`, { cache: "no-store" });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          result?.message ||
            (response.status === 404
              ? "خدمة مقدم التسجيل غير متاحة على الخادم بعد (404) — تأكد من رفع ملفات الباك إند وإعادة تشغيل api4"
              : `تعذر تحميل مقدم التسجيل (خطأ ${response.status})`)
        );
      }
      setItems(result?.items || []);
      setCanEdit(Boolean(result?.canEdit));
      setRowAmounts({});
      setSelected([]);
    } catch (e) {
      setError(e.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ملخص القيم الحالية: كل قيمة وعدد الفروع اللي عليها
  const summary = useMemo(() => {
    const map = new Map();
    items.filter((i) => i.isUse).forEach((i) => map.set(Number(i.amountPay), (map.get(Number(i.amountPay)) || 0) + 1));
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [items]);

  const allSelected = items.length > 0 && selected.length === items.length;

  const save = async ({ value, all, ids, label }) => {
    const numeric = Number(value);
    if (value === "" || !Number.isFinite(numeric) || numeric < 0) {
      await Swal.fire({ icon: "warning", title: "قيمة غير صحيحة", text: "أدخل قيمة المقدم بالريال (صفر أو أكثر)", confirmButtonText: "حسنًا" });
      return;
    }

    const confirm = await Swal.fire({
      icon: "question",
      title: "تأكيد حفظ مقدم التسجيل",
      text: `سيصبح الحد الأدنى للدفعة المقدمة ${money(numeric)} ريال ${label}. هل تريد المتابعة؟`,
      showCancelButton: true,
      confirmButtonText: "حفظ",
      cancelButtonText: "إلغاء",
      confirmButtonColor: primary,
      reverseButtons: true
    });
    if (!confirm.isConfirmed) return;

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/reg-down-payment`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userGuid: getUserGuid(), amount: numeric, all, ids })
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message || `تعذر حفظ مقدم التسجيل (خطأ ${response.status})`);
      await Swal.fire({ icon: "success", title: "تم الحفظ", text: result?.message, confirmButtonText: "حسنًا", confirmButtonColor: primary });
      setAmount("");
      await load();
    } catch (e) {
      await Swal.fire({ icon: "error", title: "حدث خطأ", text: e.message, confirmButtonText: "حسنًا" });
    } finally {
      setSaving(false);
    }
  };

  const toggle = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <Box dir="rtl" sx={{ p: { xs: 1.5, md: 3 }, minWidth: 0 }}>
      <Paper sx={{ p: 2, mb: 2, borderRadius: 3, color: "#fff", background: `linear-gradient(135deg,${primary},${primaryDark})` }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <LocalAtmRoundedIcon sx={{ fontSize: 32 }} />
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: 21 }}>مقدم التسجيل</Typography>
            <Typography sx={{ fontSize: 13, opacity: 0.9 }}>
              الحد الأدنى للدفعة المقدمة عند تسجيل الدبلوم في طلب الالتحاق — لكل فرع أو لكل الفروع مرة واحدة
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {error ? <Alert severity="error" sx={{ mb: 2, fontWeight: 600 }}>{error}</Alert> : null}
      {!loading && !error && !canEdit ? (
        <Alert severity="info" sx={{ mb: 2, fontWeight: 600 }}>لديك صلاحية العرض فقط — التعديل يحتاج صلاحية تعديل على إعدادات التسجيل.</Alert>
      ) : null}

      <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} flexWrap="wrap" useFlexGap>
          <TextField
            size="small"
            type="number"
            label="قيمة المقدم"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={!canEdit || saving}
            inputProps={{ min: 0, step: 50 }}
            InputProps={{ endAdornment: <InputAdornment position="end">ريال</InputAdornment> }}
            sx={{ width: { xs: "100%", md: 200 } }}
          />
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <DoneAllRoundedIcon />}
            disabled={!canEdit || saving || !items.length}
            onClick={() => save({ value: amount, all: true, ids: [], label: "لكل الفروع" })}
            sx={{ fontWeight: 900, bgcolor: primary, "&:hover": { bgcolor: primaryDark } }}
          >
            تطبيق على كل الفروع
          </Button>
          <Button
            variant="outlined"
            startIcon={<SaveRoundedIcon />}
            disabled={!canEdit || saving || selected.length === 0}
            onClick={() => save({ value: amount, all: false, ids: selected, label: `للفروع المحددة (${selected.length})` })}
            sx={{ fontWeight: 900 }}
          >
            تطبيق على المحدد ({selected.length})
          </Button>
          <Button variant="text" startIcon={<RefreshRoundedIcon />} onClick={load} disabled={loading || saving} sx={{ fontWeight: 800 }}>
            تحديث
          </Button>
          <Box sx={{ flex: 1 }} />
          <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
            {summary.map(([value, count]) => (
              <Chip key={value} label={`${money(value)} ريال: ${count} فرع`} sx={{ fontWeight: 800 }} color={value > 0 ? "success" : "default"} variant="outlined" />
            ))}
          </Stack>
        </Stack>
      </Paper>

      <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
        {loading ? (
          <Box sx={{ py: 8, textAlign: "center" }}>
            <CircularProgress sx={{ color: primary }} />
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: "calc(100vh - 360px)", minHeight: 300 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow sx={{ "& th": { fontWeight: 900, bgcolor: isDark ? "rgba(5,117,70,.25)" : "#eef8f3" } }}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={allSelected}
                      indeterminate={selected.length > 0 && !allSelected}
                      onChange={() => setSelected(allSelected ? [] : items.map((i) => i.id))}
                      disabled={!canEdit}
                      inputProps={{ "aria-label": "تحديد الكل" }}
                    />
                  </TableCell>
                  <TableCell>الفرع</TableCell>
                  <TableCell>دفتر التسجيل</TableCell>
                  <TableCell align="center">الحالة</TableCell>
                  <TableCell align="center">المقدم الحالي</TableCell>
                  <TableCell align="center" sx={{ width: 260 }}>تعديل هذا الفرع</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => {
                  const rowValue = rowAmounts[item.id] ?? "";
                  return (
                    <TableRow key={item.id} hover selected={selected.includes(item.id)} sx={{ opacity: item.isUse ? 1 : 0.55 }}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selected.includes(item.id)}
                          onChange={() => toggle(item.id)}
                          disabled={!canEdit}
                          inputProps={{ "aria-label": `تحديد ${item.branchName}` }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>{item.branchName || "—"}</TableCell>
                      <TableCell>{item.docName}</TableCell>
                      <TableCell align="center">
                        <Chip size="small" label={item.isUse ? "نشط" : "موقوف"} color={item.isUse ? "success" : "default"} variant="outlined" sx={{ fontWeight: 800 }} />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={Number(item.amountPay) > 0 ? `${money(item.amountPay)} ريال` : "غير محدد"}
                          sx={{ fontWeight: 900, minWidth: 110 }}
                          color={Number(item.amountPay) > 0 ? "primary" : "default"}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.8} justifyContent="center">
                          <TextField
                            size="small"
                            type="number"
                            placeholder={String(Number(item.amountPay) || 0)}
                            value={rowValue}
                            onChange={(e) => setRowAmounts((prev) => ({ ...prev, [item.id]: e.target.value }))}
                            disabled={!canEdit || saving}
                            inputProps={{ min: 0, step: 50, "aria-label": `مقدم ${item.branchName}` }}
                            sx={{ width: 120 }}
                          />
                          <Button
                            size="small"
                            variant="contained"
                            disabled={!canEdit || saving || rowValue === ""}
                            onClick={() => save({ value: rowValue, all: false, ids: [item.id], label: `لفرع ${item.branchName}` })}
                            sx={{ fontWeight: 900, bgcolor: primary, "&:hover": { bgcolor: primaryDark } }}
                          >
                            حفظ
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!items.length ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6, color: "text.secondary" }}>
                      لا توجد دفاتر تسجيل دبلوم
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}
