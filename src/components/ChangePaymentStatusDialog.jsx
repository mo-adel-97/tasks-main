import React, { useMemo, useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField
} from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import SaveIcon from "@mui/icons-material/Save";
import Swal from "sweetalert2";

const primaryColor = "#057546";
const accentColor = "#ae1e21";

const statuses = [
  { value: 0, label: "مستحق السداد" },
  { value: 1, label: "حرمان" },
  { value: 2, label: "أرصدة صفرية" }
];

const getCurrentUser = () => {
  try {
    return JSON.parse(
      localStorage.getItem("user") || "{}"
    );
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

    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      return value;
    }
  }

  return "";
};

const warn = (text) =>
  Swal.fire({
    icon: "warning",
    title: "تنبيه",
    text,
    confirmButtonText: "حسناً",
    confirmButtonColor: accentColor
  });

export default function ChangePaymentStatusDialog({
  open,
  student,
  apiBaseUrl,
  onClose,
  onSaved
}) {
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

  const levelGuid = readValue(
    student,
    "levelGuid",
    "LevelGuid"
  );

  const [currentPayStatus, setCurrentPayStatus] =
    useState("");

  const [currentPayStatusName, setCurrentPayStatusName] =
    useState("غير محددة");

  const [payStatus, setPayStatus] = useState("");
  const [loadingCurrent, setLoadingCurrent] =
    useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadCurrentStatus = async () => {
    if (!levelGuid) {
      setCurrentPayStatus("");
      setCurrentPayStatusName("غير محددة");
      return;
    }

    try {
      setLoadingCurrent(true);
      setError("");

      const response = await fetch(
        `${apiBaseUrl}/api/payment-status/current?levelGuid=${encodeURIComponent(
          levelGuid
        )}`
      );

      const result =
        await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            "تعذر قراءة حالة السداد الحالية"
        );
      }

      const statusValue =
        result?.data?.payStatus;

      const statusName =
        result?.data?.payStatusName ||
        "غير محددة";

      if (
        statusValue === 0 ||
        statusValue === 1 ||
        statusValue === 2
      ) {
        setCurrentPayStatus(statusValue);
        setPayStatus(statusValue);
      } else {
        setCurrentPayStatus("");
        setPayStatus("");
      }

      setCurrentPayStatusName(statusName);
    } catch (e) {
      setCurrentPayStatus("");
      setCurrentPayStatusName("غير محددة");
      setPayStatus("");

      setError(
        e.message ||
          "حدث خطأ أثناء قراءة حالة السداد الحالية"
      );
    } finally {
      setLoadingCurrent(false);
    }
  };

  React.useEffect(() => {
    if (!open) return;

    setPayStatus("");
    setCurrentPayStatus("");
    setCurrentPayStatusName("غير محددة");
    setError("");

    loadCurrentStatus();
  }, [open, levelGuid]);

  const save = async () => {
    if (!levelGuid) {
      return warn(
        "برجاء قبول المتدرب أولاً من قبل المشرف"
      );
    }

    if (!userGuid) {
      return warn(
        "تعذر قراءة بيانات المستخدم، برجاء تسجيل الدخول مرة أخرى"
      );
    }

    if (payStatus === "") {
      return warn(
        "برجاء اختيار حالة السداد أولاً"
      );
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `${apiBaseUrl}/api/payment-status/change`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            levelGuid,
            payStatus: Number(payStatus),
            userGuid
          })
        }
      );

      const result =
        await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            "تعذر تغيير حالة السداد"
        );
      }

      onSaved?.(result);
    } catch (e) {
      setError(
        e.message ||
          "حدث خطأ أثناء تغيير حالة السداد"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      dir="rtl"
    >
      <DialogTitle
        sx={{
          fontWeight: 950,
          color: primaryColor,
          display: "flex",
          gap: 1,
          alignItems: "center"
        }}
      >
        <AccountBalanceWalletIcon />
        تغيير حالة السداد
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}

        <Paper
          variant="outlined"
          sx={{ p: 2, mb: 2 }}
        >
          <Stack spacing={1.5}>
            <TextField
              label="اسم الطالب"
              value={studentName || ""}
              InputProps={{ readOnly: true }}
              fullWidth
            />

            <TextField
              label="رقم الهوية"
              value={nationalId || ""}
              InputProps={{ readOnly: true }}
              fullWidth
            />
          </Stack>
        </Paper>

        <TextField
          fullWidth
          label="حالة السداد الحالية"
          value={
            loadingCurrent
              ? "جارٍ تحميل الحالة..."
              : currentPayStatusName
          }
          InputProps={{ readOnly: true }}
          sx={{ mb: 2 }}
        />

        <FormControl
          fullWidth
          disabled={loadingCurrent}
        >
          <InputLabel>
            حالة السداد الجديدة
          </InputLabel>

          <Select
            value={payStatus}
            label="حالة السداد الجديدة"
            onChange={(event) =>
              setPayStatus(event.target.value)
            }
          >
            {statuses.map((status) => (
              <MenuItem
                key={status.value}
                value={status.value}
              >
                {status.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {currentPayStatus !== "" ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            الحالة الحالية هي:{" "}
            <strong>
              {currentPayStatusName}
            </strong>
          </Alert>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          variant="contained"
          onClick={save}
          disabled={
            saving ||
            loadingCurrent ||
            payStatus === ""
          }
          startIcon={
            saving ? (
              <CircularProgress
                size={18}
                color="inherit"
              />
            ) : (
              <SaveIcon />
            )
          }
          sx={{
            backgroundColor: primaryColor,
            minWidth: 140
          }}
        >
          حفظ
        </Button>

        <Button
          onClick={onClose}
          disabled={saving}
          sx={{
            color: accentColor,
            fontWeight: 900
          }}
        >
          إغلاق
        </Button>
      </DialogActions>
    </Dialog>
  );
}