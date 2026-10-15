import * as uiLayout from './common/uiLayout';
import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  MenuItem,
  Select,
  Stack,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import MergeTypeIcon from "@mui/icons-material/MergeType";
import Swal from "sweetalert2";

/*
  دمج حساب الأرشيف لطالب موجود — المرحلة التانية في الديسكتوب:
  كشف حساب الطالب ← "الأرشيف" (FindOldStudentData) ← IfStudentNotRegister (TxtAction = 1).
  بيسجل قيد الرصيد الافتتاحي (CalcCustBAlance) على حساب الطالب + ملف تدريبي (دبلوم أو دورة).
*/

const primaryColor = "#057546";
const primaryDark = "#034d31";
const accentColor = "#ae1e21";

const KIND_DIPLOMA = 0;
const KIND_COURSE = 1;

const emptyPlacement = {
  archiveKind: "",
  branchGuid: "",
  diplomGuid: "",
  batchGuid: "",
  levelGuid: "",
  courseGuid: "",
  caseGuid: ""
};

const readJson = async (response, fallback) => {
  const json = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(json?.message || json?.error || fallback);
  }
  return json;
};

const lookupCache = new Map();

const loadLookup = async (apiBaseUrl, kind, branchGuid = "") => {
  const key = `${kind}|${branchGuid}`;
  if (lookupCache.has(key)) return lookupCache.get(key);

  const params = new URLSearchParams({ kind });
  if (branchGuid) params.set("branchGuid", branchGuid);

  const json = await readJson(
    await fetch(`${apiBaseUrl}/api/students/archive-lookups?${params.toString()}`),
    "تعذر تحميل القائمة"
  );
  const data = Array.isArray(json?.data) ? json.data : [];
  lookupCache.set(key, data);
  return data;
};

const money = (value) =>
  Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ArchiveMergeDialog = ({ open, onClose, onMerged, row, accountGuid, userGuid, apiBaseUrl }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ctx, setCtx] = useState(null);
  const [placement, setPlacement] = useState(emptyPlacement);
  const [lookups, setLookups] = useState({
    branches: [],
    diplomas: [],
    batches: [],
    levels: [],
    statuses: [],
    courses: []
  });

  const oldCustomerNo = String(row?.oldCustomerNo || "").trim();
  const oldBranchCode = Number(row?.branchCode || 0);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      setCtx(null);
      setPlacement(emptyPlacement);

      try {
        if (!userGuid) throw new Error("تعذر قراءة بيانات المستخدم، برجاء تسجيل الدخول مرة أخرى");
        if (!accountGuid) throw new Error("لا يمكن قراءة حساب الطالب");
        if (!oldCustomerNo || !oldBranchCode) throw new Error("تعذر قراءة رقم العميل أو كود الفرع القديم");

        const params = new URLSearchParams({
          accountGuid,
          oldCustomerNo,
          oldBranchCode: String(oldBranchCode),
          userGuid
        });

        const [context, branches, statuses, diplomas, batches, levels] = await Promise.all([
          readJson(
            await fetch(`${apiBaseUrl}/api/students/archive-merge-context?${params.toString()}`, { cache: "no-store" }),
            "تعذر تجهيز دمج حساب الأرشيف"
          ),
          loadLookup(apiBaseUrl, "branches"),
          loadLookup(apiBaseUrl, "statuses"),
          loadLookup(apiBaseUrl, "diplomas"),
          loadLookup(apiBaseUrl, "batches"),
          loadLookup(apiBaseUrl, "levels")
        ]);
        if (cancelled) return;

        setCtx(context);
        setLookups({ branches, statuses, diplomas, batches, levels, courses: [] });
      } catch (err) {
        if (!cancelled) setError(err?.message || "تعذر تجهيز دمج حساب الأرشيف");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [open, accountGuid, oldCustomerNo, oldBranchCode, userGuid, apiBaseUrl]);

  const setValue = (name, value) => setPlacement((prev) => ({ ...prev, [name]: value }));

  const handleKindChange = (kind) => {
    setPlacement({ ...emptyPlacement, archiveKind: kind });
    setLookups((prev) => ({ ...prev, courses: [] }));
  };

  const handleBranchChange = async (branchGuid) => {
    setPlacement((prev) => ({ ...prev, branchGuid, courseGuid: "" }));
    setLookups((prev) => ({ ...prev, courses: [] }));

    if (!branchGuid || Number(placement.archiveKind) !== KIND_COURSE) return;

    try {
      const courses = await loadLookup(apiBaseUrl, "courses", branchGuid);
      setLookups((prev) => ({ ...prev, courses }));
    } catch (err) {
      setError(err?.message || "تعذر تحميل الدورات");
    }
  };

  // نفس VALIDATE_DATA في IfStudentNotRegister.
  const validate = () => {
    if (placement.archiveKind === "") return "برجاء اختيار نوع التسجيل اولا";
    if (!placement.branchGuid) return "برجاء اختيار الفرع اولا";

    if (Number(placement.archiveKind) === KIND_DIPLOMA) {
      if (!placement.diplomGuid) return "برجاء اختيار الدبلوم اولا";
      if (!placement.batchGuid) return "برجاء اختيار الدفعه اولا";
      if (!placement.levelGuid) return "برجاء اختيار المستوي اولا";
    } else if (!placement.courseGuid) {
      return "برجاء اختيار الدورة اولا";
    }

    if (!placement.caseGuid) return "برجاءاختيار الحالة اولا";
    return "";
  };

  const handleMerge = async () => {
    const message = validate();
    if (message) {
      setError(message);
      return;
    }

    const confirm = await Swal.fire({
      icon: "question",
      title: "دمج حساب الأرشيف",
      html: `سيتم تسجيل رصيد افتتاحي للطالب:<br/><b>مدين ${money(ctx?.maden)} / دائن ${money(ctx?.daen)}</b><br/>وإضافة الملف التدريبي المحدد.`,
      showCancelButton: true,
      confirmButtonText: "نعم، دمج",
      cancelButtonText: "تراجع",
      confirmButtonColor: primaryColor,
      reverseButtons: true
    });
    if (!confirm.isConfirmed) return;

    try {
      setSaving(true);
      setError("");

      const result = await readJson(
        await fetch(`${apiBaseUrl}/api/students/archive-merge`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userGuid,
            accountGuid,
            oldCustomerNo,
            oldBranchCode,
            archiveKind: Number(placement.archiveKind),
            branchGuid: placement.branchGuid || null,
            diplomGuid: placement.diplomGuid || null,
            batchGuid: placement.batchGuid || null,
            levelGuid: placement.levelGuid || null,
            courseGuid: placement.courseGuid || null,
            caseGuid: placement.caseGuid || null
          })
        }),
        "تعذر دمج حساب الأرشيف"
      );

      await Swal.fire({
        icon: "success",
        title: result?.message || "تم دمج الحساب بنجاح",
        confirmButtonText: "حسناً",
        confirmButtonColor: primaryColor
      });

      onMerged?.(result);
      onClose?.();
    } catch (err) {
      setError(err?.message || "تعذر دمج حساب الأرشيف");
    } finally {
      setSaving(false);
    }
  };

  const renderSelect = (label, name, items, { onChange, disabled = false, emptyText } = {}) => (
    <Grid item xs={12} sm={6}>
      <Typography sx={{ fontWeight: 900, fontSize: "0.85rem", mb: 0.5, color: isDark ? "#9BE0C1" : primaryColor }}>
        {label}
      </Typography>
      <FormControl fullWidth size="small" sx={uiLayout.formFieldSx}>
        <Select
          value={placement[name]}
          displayEmpty
          disabled={disabled || saving}
          onChange={(e) => (onChange ? onChange(e.target.value) : setValue(name, e.target.value))}
          sx={{ fontWeight: 900 }}
          MenuProps={{ PaperProps: { sx: { maxHeight: 300, direction: "rtl" } } }}
        >
          <MenuItem value="">{emptyText || `اختر ${label}`}</MenuItem>
          {items.map((item) => (
            <MenuItem key={item.guid} value={item.guid}>
              {item.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Grid>
  );

  const alreadyMerged = Boolean(ctx?.alreadyMerged);

  return (
    <Dialog
      open={open}
      onClose={() => !saving && onClose?.()}
      fullWidth
      maxWidth="sm"
      fullScreen={isPhone}
      // من غيرها نافذة SweetAlert (التأكيد) مش بتاخد التركيز.
      disableEnforceFocus
      sx={uiLayout.withUiSx({}, uiLayout.dialogLayoutSx)}
      PaperProps={{ sx: { direction: "rtl", borderRadius: isPhone ? 0 : 3 } }}
    >
      <DialogTitle
        sx={{
          fontWeight: 1000,
          color: "#fefefe",
          textAlign: "center",
          background: `linear-gradient(135deg, ${primaryColor}, ${primaryDark})`
        }}
      >
        دمج حساب الأرشيف
      </DialogTitle>

      <DialogContent dividers sx={{ direction: "rtl" }}>
        <Typography sx={{ fontWeight: 800, mb: 1 }}>
          رقم العميل القديم: {oldCustomerNo || "-"} — كود الفرع القديم: {oldBranchCode || "-"}
        </Typography>

        {loading ? (
          <Stack direction="row" alignItems="center" spacing={1} sx={{ py: 2 }}>
            <CircularProgress size={20} sx={{ color: primaryColor }} />
            <Typography sx={{ fontWeight: 800 }}>جاري حساب رصيد الأرشيف...</Typography>
          </Stack>
        ) : ctx ? (
          <>
            <Alert severity={alreadyMerged ? "warning" : "info"} sx={{ mb: 1.5, fontWeight: 900 }}>
              {alreadyMerged
                ? "حساب الأرشيف ده اتدمج للطالب قبل كده."
                : `الرصيد الافتتاحي: مدين ${money(ctx.maden)} / دائن ${money(ctx.daen)}`}
            </Alert>

            {!alreadyMerged ? (
              <Grid container spacing={1.5}>
                <Grid item xs={12} sm={6}>
                  <Typography sx={{ fontWeight: 900, fontSize: "0.85rem", mb: 0.5, color: isDark ? "#9BE0C1" : primaryColor }}>
                    نوع التسجيل
                  </Typography>
                  <FormControl fullWidth size="small" sx={uiLayout.formFieldSx}>
                    <Select
                      value={placement.archiveKind}
                      displayEmpty
                      disabled={saving}
                      onChange={(e) => handleKindChange(e.target.value)}
                      sx={{ fontWeight: 900 }}
                    >
                      <MenuItem value="">اختر النوع</MenuItem>
                      <MenuItem value={KIND_DIPLOMA}>دبلوم</MenuItem>
                      <MenuItem value={KIND_COURSE}>دورة</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {placement.archiveKind !== "" ? (
                  <>
                    {renderSelect("الفرع", "branchGuid", lookups.branches, { onChange: handleBranchChange })}

                    {Number(placement.archiveKind) === KIND_DIPLOMA ? (
                      <>
                        {renderSelect("الدبلوم", "diplomGuid", lookups.diplomas)}
                        {renderSelect("الدفعة", "batchGuid", lookups.batches)}
                        {renderSelect("المستوى", "levelGuid", lookups.levels)}
                      </>
                    ) : (
                      renderSelect("الدورة", "courseGuid", lookups.courses, {
                        disabled: !placement.branchGuid,
                        emptyText: placement.branchGuid ? "اختر الدورة" : "اختر الفرع أولاً"
                      })
                    )}

                    {renderSelect("الحالة", "caseGuid", lookups.statuses)}
                  </>
                ) : null}
              </Grid>
            ) : null}
          </>
        ) : null}

        {error ? (
          <Alert severity="error" sx={{ mt: 1.5, fontWeight: 900 }}>
            {error}
          </Alert>
        ) : null}
      </DialogContent>

      <DialogActions sx={uiLayout.withUiSx({ gap: 1 }, uiLayout.dialogActionsSx)}>
        <Button onClick={onClose} disabled={saving} sx={{ color: accentColor, fontWeight: 900 }}>
          إغلاق
        </Button>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <MergeTypeIcon />}
          onClick={handleMerge}
          disabled={saving || loading || !ctx || alreadyMerged}
          sx={{ fontWeight: 900, backgroundColor: primaryColor, "&:hover": { backgroundColor: primaryDark } }}
        >
          دمج الحساب
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ArchiveMergeDialog;
