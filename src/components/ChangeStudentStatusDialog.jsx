import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SaveIcon from "@mui/icons-material/Save";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";

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

const ChangeStudentStatusDialog = ({
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

  const [statuses, setStatuses] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedGuid, setSelectedGuid] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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

  const currentStatus = readValue(
    student,
    "statusName",
    "stautName",
    "studyStatusName",
    "caseName"
  );

  const selectedStatus =
    statuses.find((item) => item.guid === selectedGuid) || null;

  const loadStatuses = async (searchValue = "") => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (searchValue.trim()) {
        params.set("search", searchValue.trim());
      }

      const response = await fetch(
        `${apiBaseUrl}/api/student-status/list?${params.toString()}`
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            "تعذر تحميل حالات الطالب"
        );
      }

      setStatuses(
        Array.isArray(result?.data) ? result.data : []
      );
    } catch (err) {
      setStatuses([]);
      setError(err.message || "حدث خطأ أثناء تحميل الحالات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;

    setSearch("");
    setSelectedGuid("");
    setReason("");
    setError("");

    loadStatuses("");
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      loadStatuses(search);
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  const handleSave = async () => {
    if (!selectedStatus) {
      setError("برجاء اختيار حالة الطالب أولاً");
      return;
    }

    if (!accountGuid) {
      setError("رقم حساب الطالب غير موجود");
      return;
    }

    if (!levelGuid) {
      setError(
        "لا توجد بيانات مستوى دراسي للطالب، برجاء قبول الطالب أولاً"
      );
      return;
    }

    if (!userGuid) {
      setError(
        "تعذر قراءة بيانات المستخدم، برجاء تسجيل الدخول مرة أخرى"
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `${apiBaseUrl}/api/student-status/change`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            accountGuid,
            levelGuid,
            statusGuid: selectedStatus.guid,
            userGuid,
            actionReason: reason.trim()
          })
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            "تعذر تغيير حالة الطالب"
        );
      }

      onSaved?.({
        ...result,
        status: selectedStatus
      });
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء تغيير الحالة");
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
          overflow: "hidden"
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
        <SwapHorizIcon />
        تغيير حالة الطالب
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}

        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Stack spacing={1.2}>
            <TextField
              label="اسم الطالب"
              value={studentName}
              InputProps={{ readOnly: true }}
              fullWidth
            />

            <TextField
              label="رقم الهوية"
              value={nationalId}
              InputProps={{ readOnly: true }}
              fullWidth
            />

            <TextField
              label="الحالة الحالية"
              value={currentStatus || "-"}
              InputProps={{ readOnly: true }}
              fullWidth
            />
          </Stack>
        </Paper>

        <TextField
          fullWidth
          label="بحث في الحالات"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
          sx={{ mb: 1.5 }}
        />

        <Paper
          variant="outlined"
          sx={{
            maxHeight: 280,
            overflowY: "auto",
            mb: 2
          }}
        >
          {loading ? (
            <Box sx={{ py: 5, textAlign: "center" }}>
              <CircularProgress />
            </Box>
          ) : statuses.length === 0 ? (
            <Typography
              sx={{
                py: 4,
                textAlign: "center",
                color: "#777",
                fontWeight: 800
              }}
            >
              لا توجد حالات متاحة
            </Typography>
          ) : (
            <List disablePadding>
              {statuses.map((status) => (
                <ListItemButton
                  key={status.guid}
                  selected={selectedGuid === status.guid}
                  onClick={() => setSelectedGuid(status.guid)}
                  sx={{
                    borderBottom: "1px solid #edf1ef",
                    "&.Mui-selected": {
                      backgroundColor: "#e6f3ee"
                    },
                    "&.Mui-selected:hover": {
                      backgroundColor: "#d9eee5"
                    }
                  }}
                >
                  <ListItemText
                    primary={status.name}
                    secondary={`الكود: ${status.code}`}
                    primaryTypographyProps={{
                      fontWeight: 950,
                      textAlign: "right"
                    }}
                    secondaryTypographyProps={{
                      textAlign: "right"
                    }}
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </Paper>

        <TextField
          fullWidth
          multiline
          minRows={3}
          label="سبب التغيير / ملاحظة"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          inputProps={{ maxLength: 1000 }}
          helperText={`${reason.length}/1000`}
        />

        {selectedStatus ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            سيتم تغيير حالة الطالب إلى:{" "}
            <strong>{selectedStatus.name}</strong>
          </Alert>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || loading || !selectedStatus}
          startIcon={
            saving ? (
              <CircularProgress size={18} color="inherit" />
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

export default ChangeStudentStatusDialog;