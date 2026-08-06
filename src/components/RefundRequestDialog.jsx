import React, { useMemo, useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  TextField
} from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CurrencyExchangeIcon from "@mui/icons-material/CurrencyExchange";
import SaveIcon from "@mui/icons-material/Save";
import Swal from "sweetalert2";

const primaryColor = "#057546";
const accentColor = "#ae1e21";

const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const getUserGuid = (user) =>
  user?.userGuid ||
  user?.guid ||
  user?.Guid ||
  user?.USER_GUID ||
  user?.USER_GUID____ ||
  "";

const readValue = (object, ...keys) => {
  for (const key of keys) {
    const value = object?.[key];

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return "";
};

const showWarning = (message) =>
  Swal.fire({
    icon: "warning",
    title: "تنبيه",
    text: message,
    confirmButtonText: "حسناً",
    confirmButtonColor: accentColor
  });

const showError = (message) =>
  Swal.fire({
    icon: "error",
    title: "خطأ",
    text: message,
    confirmButtonText: "حسناً",
    confirmButtonColor: accentColor
  });

const StudentField = ({ label, value }) => (
  <TextField
    fullWidth
    size="small"
    label={label}
    value={value || ""}
    InputProps={{ readOnly: true }}
  />
);

const RefundRequestDialog = ({
  open,
  student,
  apiBaseUrl,
  onClose,
  onSaved
}) => {
  const userGuid = useMemo(
    () => getUserGuid(getCurrentUser()),
    []
  );

  const studentName = readValue(
    student,
    "studentName",
    "StudentName"
  );

  const nationalId = readValue(
    student,
    "nationalId",
    "NationalId"
  );

  const studentTel = readValue(
    student,
    "studentTel",
    "tel",
    "StudentTel"
  );

  const accountGuid = readValue(
    student,
    "accountGuid",
    "AccountGuid"
  );

  const levelGuid = readValue(
    student,
    "levelGuid",
    "LevelGuid"
  );

  const [notes, setNotes] = useState("");
  const [ibanFile, setIbanFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  React.useEffect(() => {
    if (!open) return;

    setNotes("");
    setIbanFile(null);
    setError("");
  }, [open, student]);

  const handleSave = async () => {
    if (!accountGuid) {
      showWarning("رقم حساب الطالب غير موجود");
      return;
    }

    if (!levelGuid) {
      showWarning(
        "برجاء قبول المتدرب أولاً من قبل المشرف"
      );
      return;
    }

    if (!userGuid) {
      showWarning(
        "تعذر قراءة بيانات المستخدم، برجاء تسجيل الدخول مرة أخرى"
      );
      return;
    }

    if (!notes.trim()) {
      showWarning("برجاء إدخال سبب الاسترداد");
      return;
    }

    if (!ibanFile) {
      showWarning(
        "برجاء اختيار ملف الآيبان الخاص بالمتدرب"
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const formData = new FormData();

      formData.append("accountGuid", accountGuid);
      formData.append("levelGuid", levelGuid);
      formData.append("userGuid", userGuid);
      formData.append("nationalId", nationalId);
      formData.append("notes", notes.trim());
      formData.append("ibanFile", ibanFile);

      const response = await fetch(
        `${apiBaseUrl}/api/refund-requests`,
        {
          method: "POST",
          body: formData
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            "تعذر حفظ طلب الاسترداد"
        );
      }

      onSaved?.(result);
    } catch (err) {
      setError(
        err.message ||
          "حدث خطأ أثناء حفظ طلب الاسترداد"
      );

      showError(
        err.message ||
          "حدث خطأ أثناء حفظ طلب الاسترداد"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      maxWidth="md"
      fullWidth
      dir="rtl"
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: 620
        }
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 950,
          color: primaryColor,
          display: "flex",
          alignItems: "center",
          gap: 1
        }}
      >
        <CurrencyExchangeIcon />
        طلب استرداد
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}

        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={1.5}>
            <Grid item xs={12} md={4}>
              <StudentField
                label="اسم الطالب"
                value={studentName}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <StudentField
                label="رقم الهوية"
                value={nationalId}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <StudentField
                label="رقم الجوال"
                value={studentTel}
              />
            </Grid>
          </Grid>
        </Paper>

        <TextField
          fullWidth
          multiline
          minRows={8}
          label="سبب الاسترداد"
          value={notes}
          onChange={(event) =>
            setNotes(event.target.value)
          }
          inputProps={{ maxLength: 2000 }}
          helperText={`${notes.length}/2000`}
          sx={{ mb: 2 }}
        />

        <Button
          component="label"
          fullWidth
          variant="outlined"
          startIcon={<AttachFileIcon />}
          sx={{
            minHeight: 58,
            color: accentColor,
            borderColor: accentColor,
            fontWeight: 950
          }}
        >
          {ibanFile
            ? ibanFile.name
            : "إرفاق ملف الآيبان — إجباري"}

          <input
            hidden
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(event) =>
              setIbanFile(
                event.target.files?.[0] || null
              )
            }
          />
        </Button>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          startIcon={
            saving ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <SaveIcon />
            )
          }
          sx={{
            backgroundColor: primaryColor,
            minWidth: 150
          }}
        >
          حفظ الطلب
        </Button>

        <Button
          onClick={onClose}
          disabled={saving}
          sx={{
            color: accentColor,
            fontWeight: 900,
            minWidth: 90
          }}
        >
          إغلاق
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RefundRequestDialog;