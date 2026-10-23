import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";
import StoreMallDirectoryOutlinedIcon from "@mui/icons-material/StoreMallDirectoryOutlined";

// نافذة فرق سعر تغيير التخصص (تأكيد الطلب / تسجيل قيد لطلب قديم) — بتتبع ثيم البرنامج (فاتح/داكن).
// المستخدم بيختار أساس السعر: وقت التحويل (قائمة أسعار الفرع) أو وقت تسجيل الطالب أو يدوي.

const fmt = (value) =>
  value === null || value === undefined || value === ""
    ? "—"
    : Number(value).toLocaleString("en-US", { maximumFractionDigits: 2 });

const fmtDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

const round2 = (n) => Math.round(n * 100) / 100;

export function BranchChip({ sameBranch, size = "small" }) {
  if (sameBranch === null || sameBranch === undefined) return null;
  return sameBranch ? (
    <Chip size={size} variant="outlined" color="success" label="نفس الفرع" />
  ) : (
    <Chip size={size} color="warning" icon={<StoreMallDirectoryOutlinedIcon />} label="انتقال لفرع مختلف" />
  );
}

function PriceOption({ value, label, price, hint, diff, disabled, selected }) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        border: `1px solid ${selected ? theme.palette.primary.main : theme.palette.divider}`,
        bgcolor: selected ? alpha(theme.palette.primary.main, 0.08) : "transparent",
        borderRadius: 1.5,
        px: 1.25,
        py: 0.5,
        opacity: disabled ? 0.55 : 1
      }}
    >
      <FormControlLabel
        value={value}
        disabled={disabled}
        control={<Radio size="small" />}
        sx={{ m: 0, width: "100%", alignItems: "flex-start", "& .MuiFormControlLabel-label": { flex: 1, pt: 0.75 } }}
        label={
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 800, fontSize: 14 }}>{label}</Typography>
              {hint && <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{hint}</Typography>}
            </Box>
            <Box sx={{ textAlign: "left", flexShrink: 0 }}>
              <Typography sx={{ fontWeight: 900, fontSize: 15, direction: "ltr" }}>{fmt(price)}</Typography>
              {diff !== null && diff !== undefined && (
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 800,
                    direction: "ltr",
                    color: diff > 0 ? "success.main" : diff < 0 ? "error.main" : "text.secondary"
                  }}
                >
                  {diff > 0 ? "+" : ""}{fmt(diff)}
                </Typography>
              )}
            </Box>
          </Stack>
        }
      />
    </Box>
  );
}

/**
 * mode: "confirm" (تأكيد طلب جديد + ملاحظات) أو "journal" (قيد لطلب مؤكد قديم)
 * data: بيانات الحساب (من price-diff أو price-pending)
 */
export default function PriceDiffDialog({ open, mode, data, loading, request, onClose, onSubmit, submitting }) {
  const theme = useTheme();
  const manual = mode === "journal" ? data?.manualJournal : null;
  const already = manual ? Number(manual.amount) || 0 : 0;

  const [basis, setBasis] = useState("current");
  const [manualPrice, setManualPrice] = useState("");
  const [diffText, setDiffText] = useState("");
  const [supervisionNotes, setSupervisionNotes] = useState("");
  const [accountsNotes, setAccountsNotes] = useState("");

  const oldPrice = data?.oldPrice;
  const priceFor = (b) =>
    b === "current" ? data?.newPrice : b === "registration" ? data?.registrationPrice : manualPrice === "" ? null : Number(manualPrice);

  const computeDiff = (b, manualValue = manualPrice) => {
    const p = b === "manual" ? (manualValue === "" ? null : Number(manualValue)) : priceFor(b);
    if (p === null || p === undefined || !Number.isFinite(p) || oldPrice === null || oldPrice === undefined) return "";
    return String(round2(p - Number(oldPrice) - already));
  };

  useEffect(() => {
    if (!open) return;
    const initial =
      data?.newPrice !== null && data?.newPrice !== undefined
        ? "current"
        : data?.registrationPrice !== null && data?.registrationPrice !== undefined
          ? "registration"
          : "manual";
    setBasis(initial);
    setManualPrice("");
    setDiffText(computeDiff(initial, ""));
    setSupervisionNotes(request?.supervisionNotes || "");
    setAccountsNotes(request?.accountsNotes || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, data]);

  const diff = diffText === "" || !Number.isFinite(Number(diffText)) ? null : Number(diffText);
  const diffMeaning = useMemo(() => {
    if (diff === null)
      return { text: "بدون قيمة: سيبقى الطلب بانتظار قيد فرق السعر — اكتب 0 إذا لم يكن هناك فرق", color: "warning.main" };
    if (diff > 0) return { text: `زيادة على الطالب ${fmt(diff)} ريال (مدين الطالب / دائن تسجيلات الطلاب)`, color: "success.main" };
    if (diff < 0) return { text: `خصم للطالب ${fmt(Math.abs(diff))} ريال (مدين تسجيلات الطلاب / دائن الطالب)`, color: "error.main" };
    return { text: "بدون قيد فرق سعر", color: "text.secondary" };
  }, [diff]);

  const studentName = data?.studentName || request?.studentName || "";
  const oldDiplom = data?.oldDiplomName || request?.oldValue || "";
  const newDiplom = data?.newDiplomName || request?.newValue || "";
  const alreadyJournal = mode === "confirm" && data?.journalCode;

  const submit = () => {
    const price = priceFor(basis);
    onSubmit({
      // فاضي = يفضل بانتظار القيد (يظهر في قسم الطلبات المحتاجة قيد)، و0 = بدون فرق سعر
      priceDiff: alreadyJournal ? null : diff,
      newPrice: alreadyJournal || price === null || price === undefined || !Number.isFinite(price) ? null : price,
      supervisionNotes: supervisionNotes.trim(),
      accountsNotes: accountsNotes.trim()
    });
  };

  const sectionSx = {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 2,
    p: 1.5,
    bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.06 : 0.03)
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth dir="rtl">
      <DialogTitle sx={{ fontWeight: 900, display: "flex", alignItems: "center", gap: 1 }}>
        <SwapHorizRoundedIcon color="primary" />
        {mode === "confirm" ? "تأكيد تحويل التخصص" : "تسجيل قيد فرق السعر"}
      </DialogTitle>

      <DialogContent dividers sx={{ display: "grid", gap: 1.5 }}>
        {/* الطالب والتحويل */}
        <Box sx={sectionSx}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
            <Typography sx={{ fontWeight: 900, fontSize: 16 }}>
              {studentName}
              {data?.nationalId && <Typography component="span" sx={{ fontSize: 13, color: "text.secondary", mr: 1 }}>{data.nationalId}</Typography>}
            </Typography>
            <BranchChip sameBranch={data?.sameBranch} />
          </Stack>
          <Typography sx={{ mt: 0.75, fontSize: 14 }}>
            {oldDiplom} <b style={{ color: theme.palette.primary.main }}>⟵ {newDiplom}</b>
          </Typography>
          {(data?.oldBranchName || data?.branchName) && (
            <Typography sx={{ mt: 0.5, fontSize: 13, color: "text.secondary" }}>
              الفرع وقت الطلب: <b>{data?.oldBranchName || "—"}</b>
              {data?.sameBranch === false && <> &nbsp;⟵&nbsp; فرع الدراسة الجديد: <b>{data?.branchName}</b></>}
            </Typography>
          )}
          {request?.requestNotes && (
            <Typography sx={{ mt: 0.5, fontSize: 13, color: "text.secondary" }}>ملاحظة مقدم الطلب: {request.requestNotes}</Typography>
          )}
        </Box>

        {loading ? (
          <Box sx={{ py: 3, display: "grid", placeItems: "center" }}><CircularProgress size={28} /></Box>
        ) : alreadyJournal ? (
          <Alert severity="success">تم تسجيل قيد فرق السعر لهذا الطلب من قبل (قيد رقم {data.journalCode}).</Alert>
        ) : (
          <Box sx={{ display: "grid", gap: 1 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="baseline">
              <Typography sx={{ fontWeight: 900, color: "primary.main" }}>سعر الدبلوم الجديد</Typography>
              <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                سعر الدبلوم القديم (ما دفعه الطالب): <b style={{ direction: "ltr", display: "inline-block" }}>{fmt(oldPrice)}</b>
              </Typography>
            </Stack>

            {data?.warning && <Alert severity="warning" sx={{ py: 0 }}>{data.warning}</Alert>}

            <RadioGroup
              value={basis}
              onChange={(e) => {
                setBasis(e.target.value);
                setDiffText(computeDiff(e.target.value));
              }}
              sx={{ display: "grid", gap: 0.75 }}
            >
              <PriceOption
                value="current"
                selected={basis === "current"}
                label="وقت التحويل"
                hint={data?.newPriceSource ? data.newPriceSource : "غير موجود في قائمة أسعار الفرع"}
                price={data?.newPrice}
                diff={data?.newPrice != null && oldPrice != null ? round2(data.newPrice - oldPrice - already) : null}
                disabled={data?.newPrice === null || data?.newPrice === undefined}
              />
              <PriceOption
                value="registration"
                selected={basis === "registration"}
                label="وقت تسجيل الطالب"
                hint={
                  data?.registrationPrice != null
                    ? `تسجيل الطالب ${fmtDate(data?.registrationDate)} — من ${data?.registrationPriceCount || 0} استمارة بنفس الفرع في نفس الفترة`
                    : "لا توجد تسجيلات لنفس الدبلوم بالفرع في تلك الفترة"
                }
                price={data?.registrationPrice}
                diff={data?.registrationPrice != null && oldPrice != null ? round2(data.registrationPrice - oldPrice - already) : null}
                disabled={data?.registrationPrice === null || data?.registrationPrice === undefined}
              />
              <PriceOption value="manual" selected={basis === "manual"} label="سعر يدوي" hint="اكتب السعر المتفق عليه" price={manualPrice === "" ? null : Number(manualPrice)} />
            </RadioGroup>

            {basis === "manual" && (
              <TextField
                id="price-diff-manual-price"
                size="small"
                type="number"
                label="سعر الدبلوم الجديد"
                value={manualPrice}
                autoFocus
                onChange={(e) => {
                  setManualPrice(e.target.value);
                  setDiffText(computeDiff("manual", e.target.value));
                }}
                inputProps={{ dir: "ltr", step: "0.01", style: { textAlign: "center" } }}
              />
            )}

            {manual && (
              <Alert severity="info" sx={{ py: 0.25 }}>
                الحسابات سجلت قيدًا يدويًا رقم <b>{manual.code}</b> بتاريخ {fmtDate(manual.date)} بمبلغ{" "}
                <b style={{ direction: "ltr", display: "inline-block" }}>{Number(manual.amount) > 0 ? "+" : ""}{fmt(manual.amount)}</b> — الفرق هنا هو المتبقي بعده.
              </Alert>
            )}

            <TextField
              id="price-diff-value"
              label="الفرق المطلوب قيده"
              type="number"
              value={diffText}
              onChange={(e) => setDiffText(e.target.value)}
              helperText={<span style={{ color: theme.palette[diffMeaning.color.split(".")[0]]?.main }}>{diffMeaning.text}</span>}
              inputProps={{ dir: "ltr", step: "0.01", style: { textAlign: "center", fontWeight: 900, fontSize: 18 } }}
            />
          </Box>
        )}

        {mode === "confirm" && (
          <Box sx={{ display: "grid", gap: 1 }}>
            <TextField id="confirm-supervision-notes" label="ملاحظة الإشراف العام" multiline minRows={2} value={supervisionNotes} onChange={(e) => setSupervisionNotes(e.target.value)} />
            <TextField id="confirm-accounts-notes" label="ملاحظة الحسابات" multiline minRows={2} value={accountsNotes} onChange={(e) => setAccountsNotes(e.target.value)} />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1.25 }}>
        <Button onClick={onClose} disabled={submitting}>رجوع</Button>
        <Button
          variant="contained"
          onClick={submit}
          disabled={submitting || loading || (mode === "journal" && diff === null)}
          startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {mode === "confirm" ? (diff ? "تأكيد وتسجيل القيد" : "تأكيد الطلب") : "تسجيل القيد"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
