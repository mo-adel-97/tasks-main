import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography
} from "@mui/material";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import {
  RECEPTION_EXTRAS_API,
  getCurrentUserGuid,
  loadVipFlags,
  readApiJson
} from "../utils/receptionExtras";

// قيم الـ Guid الفاضية أو "-" (طالب جديد ملوش فرع/تخصص في صف البحث) ما تتبعتش، والباك إند بيكملها.
const guidOrNull = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || "")) &&
  !/^0{8}-0{4}-0{4}-0{4}-0{12}$/.test(String(value || ""))
    ? value
    : null;
const textOrEmpty = (value) => (value && value !== "-" ? value : "");

// طلب تحويل VIP من مكتب الاستقبال (متاح لكل المستخدمين).
const ReceptionVipDialog = ({ open, student, onClose, onDone }) => {
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setNotes("");
      setError("");
      setSaving(false);
    }
  }, [open]);

  const handleSave = async () => {
    setError("");
    setSaving(true);
    try {
      const response = await fetch(`${RECEPTION_EXTRAS_API}/vip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userGuid: getCurrentUserGuid(),
          studentGuid: guidOrNull(student?.studentGuid),
          accountGuid: guidOrNull(student?.accountGuid),
          studentName: textOrEmpty(student?.studentName),
          studentTel: textOrEmpty(student?.studentTel || student?.tel),
          nationalId: textOrEmpty(student?.nationalId),
          email: textOrEmpty(student?.email),
          branchGuid: guidOrNull(student?.branchGuid) || guidOrNull(student?.studyBranchGuid),
          branchName: textOrEmpty(student?.branchName),
          diplomGuid: guidOrNull(student?.diplomGuid),
          diplomName: textOrEmpty(student?.diplomName),
          notes: notes.trim()
        })
      });
      const result = await readApiJson(response);
      await loadVipFlags({ force: true });
      onDone?.(result?.message || "تم إرسال طلب تحويل VIP");
    } catch (err) {
      setError(err?.message || "تعذر إرسال طلب تحويل VIP");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth dir="rtl">
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 900, fontFamily: '"Cairo", sans-serif' }}>
        <WorkspacePremiumRoundedIcon sx={{ color: "#d99a00" }} />
        طلب تحويل VIP
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ p: 1.5, mb: 2, borderRadius: 2, border: "1px solid rgba(217,154,0,.35)", backgroundColor: "rgba(255,224,138,.12)" }}>
          <Typography sx={{ fontWeight: 900, fontFamily: '"Cairo", sans-serif' }}>{student?.studentName || "-"}</Typography>
          <Typography sx={{ fontSize: ".85rem", opacity: 0.8, fontFamily: '"Cairo", sans-serif' }}>
            {[student?.nationalId && `الهوية: ${student.nationalId}`, student?.diplomName, student?.branchName]
              .filter((part) => part && part !== "-")
              .join(" • ")}
          </Typography>
        </Box>

        <TextField
          fullWidth
          multiline
          minRows={3}
          label="ملاحظات الطلب (اختياري)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={saving}
        />

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions sx={{ gap: 1, px: 2, py: 1.5 }}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <WorkspacePremiumRoundedIcon />}
          sx={{ fontWeight: 900, background: "linear-gradient(135deg, #f5b70a, #d99a00)", color: "#3d2700" }}
        >
          إرسال طلب تحويل VIP
        </Button>
        <Button onClick={onClose} disabled={saving}>إلغاء</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReceptionVipDialog;
