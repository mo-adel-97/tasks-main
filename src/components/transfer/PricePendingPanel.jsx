import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Paper,
  Stack,
  Typography
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import LinkIcon from "@mui/icons-material/Link";
import DoNotDisturbOnIcon from "@mui/icons-material/DoNotDisturbOn";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import Swal from "sweetalert2";
import PriceDiffDialog, { BranchChip } from "./PriceDiffDialog";

// طلبات تغيير تخصص اتحولت فعلاً ومحتاجة قيد فرق سعر (القديمة قبل القيد التلقائي، أو اللي محتاجة مراجعة).

const fmt = (value) =>
  value === null || value === undefined || value === ""
    ? "—"
    : Number(value).toLocaleString("en-US", { maximumFractionDigits: 2 });

const signed = (value) =>
  value === null || value === undefined ? "—" : `${Number(value) > 0 ? "+" : ""}${fmt(value)}`;

const fmtDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

const readJson = async (response) => {
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.message || result?.details || "حدث خطأ أثناء الاتصال بالخادم");
  return result;
};

function Info({ label, value, emphasis }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>{label}</Typography>
      <Typography sx={{ fontSize: 13.5, fontWeight: emphasis ? 900 : 600, overflowWrap: "anywhere" }}>{value || "—"}</Typography>
    </Box>
  );
}

function statusOf(row) {
  if (row.manualJournal) return { label: "قيد يدوي بمبلغ مختلف — يحتاج مراجعة", color: "warning" };
  if (row.diff === null || row.diff === undefined) return { label: "يحتاج سعرًا يدويًا", color: "info" };
  return { label: "بانتظار قيد الفرق", color: "error" };
}

export default function PricePendingPanel({ apiBaseUrl, userGuid, onChanged }) {
  const theme = useTheme();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(true);
  const [busy, setBusy] = useState("");
  const [dialogRow, setDialogRow] = useState(null);

  const load = useCallback(async () => {
    if (!userGuid) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ userGuid });
      const result = await readJson(
        await fetch(`${apiBaseUrl}/api/transfer-requests/diplom/price-pending?${params}`, { cache: "no-store" })
      );
      setRows(Array.isArray(result?.data) ? result.data : []);
    } catch (e) {
      setError(e.message || "تعذر تحميل الطلبات");
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, userGuid]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (row, body, successTitle) => {
    setBusy(row.requestGuid);
    try {
      const result = await readJson(
        await fetch(`${apiBaseUrl}/api/transfer-requests/diplom/${encodeURIComponent(row.requestGuid)}/price-journal`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userGuid, ...body })
        })
      );
      setDialogRow(null);
      await Swal.fire({ icon: "success", title: successTitle, text: result?.message || "تمت العملية بنجاح" });
      await load();
      onChanged?.();
    } catch (e) {
      await Swal.fire({ icon: "error", title: "تعذرت العملية", text: e.message });
    } finally {
      setBusy("");
    }
  };

  const linkManual = async (row) => {
    const confirm = await Swal.fire({
      icon: "question",
      title: "اعتماد القيد اليدوي",
      text: `قيد رقم ${row.manualJournal.code} بمبلغ ${signed(row.manualJournal.amount)} ريال سيُعتبر قيد فرق السعر لهذا الطلب بدون إنشاء قيد جديد.`,
      showCancelButton: true,
      confirmButtonText: "اعتماد",
      cancelButtonText: "رجوع"
    });
    if (confirm.isConfirmed) await submit(row, { linkManualJournal: true }, "تم الاعتماد");
  };

  const noDiff = async (row) => {
    const confirm = await Swal.fire({
      icon: "warning",
      title: "بدون فرق سعر",
      text: `سيتم اعتماد طلب ${row.studentName} بدون قيد فرق سعر.`,
      showCancelButton: true,
      confirmButtonText: "اعتماد بدون قيد",
      cancelButtonText: "رجوع"
    });
    if (confirm.isConfirmed) await submit(row, { priceDiff: 0 }, "تم الاعتماد");
  };

  if (!loading && !error && rows.length === 0) return null;

  const accent = theme.palette.error.main;

  return (
    <Paper
      variant="outlined"
      sx={{ mb: 1.25, borderRadius: 2, borderColor: alpha(accent, 0.45), overflow: "hidden", bgcolor: "background.paper" }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 1.5, py: 1, bgcolor: alpha(accent, theme.palette.mode === "dark" ? 0.16 : 0.07), cursor: "pointer" }}
        onClick={() => setOpen((v) => !v)}
      >
        <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
          <ReceiptLongIcon sx={{ color: accent }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 900, fontSize: 15 }}>طلبات تغيير تخصص بانتظار قيد فرق السعر</Typography>
            <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
              طلبات مؤكدة والطالب تحوّل فعليًا للتخصص الجديد، ولم يُسجَّل لها قيد فرق السعر بعد
            </Typography>
          </Box>
          {loading ? <CircularProgress size={16} /> : <Chip size="small" color="error" label={rows.length} sx={{ fontWeight: 900 }} />}
        </Stack>
        {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </Stack>

      <Collapse in={open}>
        <Box sx={{ p: 1.25, display: "grid", gap: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {rows.map((row) => {
            const status = statusOf(row);
            const due = row.manualJournal ? row.remaining : row.diff;
            return (
              <Paper
                key={row.requestGuid}
                variant="outlined"
                sx={{ p: 1.25, borderRadius: 1.5, borderInlineStart: `4px solid ${theme.palette[status.color].main}` }}
              >
                <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between" alignItems={{ md: "flex-start" }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Typography sx={{ fontWeight: 900, fontSize: 15 }}>{row.studentName}</Typography>
                      <Typography sx={{ fontSize: 12.5, color: "text.secondary" }}>{row.nationalId}</Typography>
                      <Chip size="small" color={status.color} variant="outlined" label={status.label} />
                      <BranchChip sameBranch={row.sameBranch} />
                    </Stack>
                    <Typography sx={{ mt: 0.5, fontSize: 13.5, color: "text.secondary" }}>
                      {row.oldDiplomName} <b style={{ color: theme.palette.primary.main }}>⟵ {row.newDiplomName}</b>
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: { md: "left" } }}>
                    <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>الفرق المستحق</Typography>
                    <Typography
                      sx={{
                        fontWeight: 900,
                        fontSize: 18,
                        direction: "ltr",
                        color: due > 0 ? "success.main" : due < 0 ? "error.main" : "text.secondary"
                      }}
                    >
                      {due === null || due === undefined ? "—" : `${signed(due)} ريال`}
                    </Typography>
                  </Box>
                </Stack>

                <Box sx={{ mt: 1, display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)", lg: "repeat(6, 1fr)" } }}>
                  <Info label="الفرع وقت الطلب" value={row.oldBranchName} />
                  <Info label="فرع دراسة التخصص الجديد" value={row.branchName} />
                  <Info label="تاريخ الطلب / التأكيد" value={`${fmtDate(row.createdAt)} — ${fmtDate(row.confirmedAt)}`} />
                  <Info label="سعر الدبلوم القديم" value={fmt(row.oldPrice)} />
                  <Info label="الجديد وقت التحويل" value={`${fmt(row.newPrice)} (${signed(row.diff)})`} emphasis />
                  <Info
                    label="الجديد وقت تسجيل الطالب"
                    value={row.registrationPrice != null ? `${fmt(row.registrationPrice)} (${signed(row.registrationDiff)})` : "—"}
                  />
                </Box>

                {row.manualJournal && (
                  <Alert severity="warning" sx={{ mt: 1, py: 0.25 }}>
                    قيد يدوي رقم <b>{row.manualJournal.code}</b> بتاريخ {fmtDate(row.manualJournal.date)} بمبلغ{" "}
                    <b style={{ direction: "ltr", display: "inline-block" }}>{signed(row.manualJournal.amount)}</b> ريال، والمتبقي{" "}
                    <b style={{ direction: "ltr", display: "inline-block" }}>{signed(row.remaining)}</b> ريال.
                    {row.manualJournal.notes ? ` — ${row.manualJournal.notes}` : ""}
                  </Alert>
                )}
                {row.warning && <Alert severity="info" sx={{ mt: 1, py: 0.25 }}>{row.warning} — اختر سعر وقت التسجيل أو أدخل سعرًا يدويًا.</Alert>}

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={busy === row.requestGuid ? <CircularProgress size={14} color="inherit" /> : <ReceiptLongIcon />}
                    disabled={Boolean(busy)}
                    onClick={() => setDialogRow(row)}
                  >
                    تسجيل قيد الفرق
                  </Button>
                  {row.manualJournal && (
                    <Button size="small" variant="outlined" startIcon={<LinkIcon />} disabled={Boolean(busy)} onClick={() => linkManual(row)}>
                      القيد اليدوي صحيح
                    </Button>
                  )}
                  <Button size="small" color="error" startIcon={<DoNotDisturbOnIcon />} disabled={Boolean(busy)} onClick={() => noDiff(row)}>
                    بدون فرق سعر
                  </Button>
                </Stack>
              </Paper>
            );
          })}
        </Box>
      </Collapse>

      <PriceDiffDialog
        open={Boolean(dialogRow)}
        mode="journal"
        data={dialogRow}
        submitting={Boolean(busy)}
        onClose={() => setDialogRow(null)}
        onSubmit={(values) =>
          submit(dialogRow, { priceDiff: values.priceDiff, newPrice: values.newPrice }, "تم تسجيل القيد")
        }
      />
    </Paper>
  );
}
