import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from "@mui/material";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";
import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {
  RECEPTION_EXTRAS_API,
  getCurrentUserGuid,
  readApiJson
} from "../utils/receptionExtras";

const isGuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || "")) &&
  !/^0{8}-0{4}-0{4}-0{4}-0{12}$/.test(String(value || ""));

// طلب نقل فرع / تحويل تخصص من مكتب الاستقبال (متاح لكل المستخدمين).
// يشتغل للطالب المقبول (ملف تدريبي) والطالب الجديد (استمارة لم تُقبل) وطلب الالتحاق.
const ReceptionTransferDialog = ({ open, student, onClose, onDone }) => {
  const [type, setType] = useState("diplom");
  const [context, setContext] = useState(null);
  const [options, setOptions] = useState({ branches: [], diploms: [] });
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState("");
  const [formFile, setFormFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState("");

  const studentKey = [
    student?.accountGuid,
    student?.diplomGuid,
    student?.branchGuid || student?.studyBranchGuid,
    student?.regDocGuid
  ].join("|");

  useEffect(() => {
    if (!open) return;
    setType("diplom");
    setSelected(null);
    setNotes("");
    setFormFile(null);
    setError("");
    setBlocked("");
    setSaving(false);
    setContext(null);

    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const userGuid = getCurrentUserGuid();
        const params = new URLSearchParams({ userGuid, accountGuid: student?.accountGuid || "" });
        if (isGuid(student?.studentGuid)) params.set("studentGuid", student.studentGuid);
        if (isGuid(student?.diplomGuid)) params.set("diplomGuid", student.diplomGuid);
        const branch = student?.branchGuid || student?.studyBranchGuid;
        if (isGuid(branch)) params.set("branchGuid", branch);
        if (isGuid(student?.regDocGuid)) params.set("regDocGuid", student.regDocGuid);

        const contextResponse = await fetch(`${RECEPTION_EXTRAS_API}/transfer-context?${params.toString()}`, { cache: "no-store" });
        const contextResult = await contextResponse.json().catch(() => null);
        if (!contextResponse.ok) {
          if (alive) setBlocked(contextResult?.message || "لا يمكن عمل طلب نقل/تحويل لهذا الطالب");
          return;
        }
        if (!alive) return;
        setContext(contextResult);

        const optionParams = new URLSearchParams({ userGuid });
        if (contextResult?.regType !== null && contextResult?.regType !== undefined) {
          optionParams.set("regType", String(contextResult.regType));
        }
        const optionsResponse = await fetch(`${RECEPTION_EXTRAS_API}/transfer-options?${optionParams.toString()}`, { cache: "no-store" });
        const optionsResult = await readApiJson(optionsResponse);
        if (alive) setOptions({ branches: optionsResult?.branches || [], diploms: optionsResult?.diploms || [] });
      } catch (err) {
        if (alive) setError(err?.message || "تعذر تحميل البيانات");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, studentKey]);

  const list = useMemo(() => {
    const currentGuid = String(type === "branch" ? context?.branchGuid || "" : context?.diplomGuid || "").toLowerCase();
    const source = type === "branch" ? options.branches : options.diploms;
    return source.filter((item) => String(item.guid).toLowerCase() !== currentGuid);
  }, [type, options, context]);

  const handleSave = async () => {
    setError("");
    if (!selected?.guid) {
      setError(type === "branch" ? "برجاء اختيار الفرع الجديد" : "برجاء اختيار التخصص الجديد");
      return;
    }

    setSaving(true);
    try {
      const branch = student?.branchGuid || student?.studyBranchGuid;
      const response = await fetch(`${RECEPTION_EXTRAS_API}/transfer-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userGuid: getCurrentUserGuid(),
          type,
          accountGuid: student?.accountGuid,
          studentGuid: isGuid(student?.studentGuid) ? student.studentGuid : null,
          diplomGuid: isGuid(student?.diplomGuid) ? student.diplomGuid : null,
          branchGuid: isGuid(branch) ? branch : null,
          regDocGuid: isGuid(student?.regDocGuid) ? student.regDocGuid : null,
          nationalId: student?.nationalId || "",
          studentName: student?.studentName || "",
          newGuid: selected.guid,
          newName: selected.name,
          notes: notes.trim()
        })
      });
      const result = await readApiJson(response);
      let message = result?.message || "تم إرسال الطلب";

      // رفع "النموذج" بعد حفظ الطلب (اختياري)
      const requestGuid = result?.data?.requestGuid;
      if (formFile && requestGuid) {
        try {
          const upload = new FormData();
          upload.append("userGuid", getCurrentUserGuid());
          upload.append("file", formFile);
          const uploadResponse = await fetch(`${RECEPTION_EXTRAS_API}/transfer-request/${requestGuid}/form`, {
            method: "POST",
            body: upload
          });
          await readApiJson(uploadResponse);
          message += " مع النموذج";
        } catch (uploadError) {
          message += " — لكن تعذر رفع النموذج: " + (uploadError?.message || "");
        }
      }

      onDone?.(message);
    } catch (err) {
      setError(err?.message || "تعذر حفظ الطلب");
    } finally {
      setSaving(false);
    }
  };

  const infoRow = (label, value) => (
    <Typography sx={{ fontSize: ".9rem", fontFamily: '"Cairo", sans-serif' }}>
      {label}: <b>{value || "-"}</b>
    </Typography>
  );

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth dir="rtl">
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 900, fontFamily: '"Cairo", sans-serif' }}>
        <SwapHorizRoundedIcon color="primary" />
        طلب نقل / تحويل
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ p: 1.5, mb: 2, borderRadius: 2, border: "1px solid rgba(5,117,70,.25)", backgroundColor: "rgba(5,117,70,.05)" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 0.5 }}>
            <Typography sx={{ fontWeight: 900, fontFamily: '"Cairo", sans-serif' }}>{student?.studentName || "-"}</Typography>
            {context?.stage && <Chip size="small" color="success" variant="outlined" label={context.stage} />}
          </Box>
          {loading && !context ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={16} />
              <Typography sx={{ fontSize: ".85rem" }}>جاري تحميل بيانات الطالب...</Typography>
            </Box>
          ) : context ? (
            <>
              {infoRow("التخصص الحالي", context.diplomName)}
              {infoRow("الفرع الحالي", context.branchName)}
            </>
          ) : null}
        </Box>

        {blocked ? (
          <Alert severity="warning">{blocked}</Alert>
        ) : (
          <>
            <ToggleButtonGroup
              exclusive
              fullWidth
              color="primary"
              value={type}
              onChange={(_, value) => {
                if (value) {
                  setType(value);
                  setSelected(null);
                  setError("");
                }
              }}
              sx={{ mb: 2, "& .MuiToggleButton-root": { fontWeight: 900, fontFamily: '"Cairo", sans-serif' } }}
            >
              <ToggleButton value="diplom">تحويل من تخصص لتخصص</ToggleButton>
              <ToggleButton value="branch">نقل من فرع لفرع</ToggleButton>
            </ToggleButtonGroup>

            <Autocomplete
              options={list}
              value={selected}
              loading={loading}
              onChange={(_, value) => setSelected(value)}
              getOptionLabel={(option) => option?.name || ""}
              isOptionEqualToValue={(option, value) => option.guid === value.guid}
              noOptionsText={loading ? "جاري التحميل..." : "لا توجد نتائج"}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={type === "branch" ? "الفرع الجديد" : "التخصص الجديد"}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loading ? <CircularProgress size={18} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    )
                  }}
                />
              )}
              disabled={saving || !context}
            />

            <TextField
              fullWidth
              multiline
              minRows={2}
              label="ملاحظات الطلب (اختياري)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={saving || !context}
              sx={{ mt: 2 }}
            />

            <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Button
                component="label"
                variant="outlined"
                startIcon={<AttachFileRoundedIcon />}
                disabled={saving || !context}
                sx={{ fontWeight: 900 }}
              >
                النموذج (اختياري)
                <input
                  hidden
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    e.target.value = "";
                    if (file && file.size > 10 * 1024 * 1024) {
                      setError("حجم ملف النموذج أكبر من 10 ميجا");
                      return;
                    }
                    setFormFile(file);
                  }}
                />
              </Button>
              {formFile && (
                <Chip
                  label={formFile.name}
                  onDelete={saving ? undefined : () => setFormFile(null)}
                  deleteIcon={<CloseRoundedIcon />}
                  sx={{ maxWidth: 320, fontFamily: '"Cairo", sans-serif' }}
                />
              )}
            </Box>
          </>
        )}

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions sx={{ gap: 1, px: 2, py: 1.5 }}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || loading || !context || Boolean(blocked)}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SwapHorizRoundedIcon />}
          sx={{ fontWeight: 900 }}
        >
          إرسال الطلب
        </Button>
        <Button onClick={onClose} disabled={saving}>إلغاء</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReceptionTransferDialog;
