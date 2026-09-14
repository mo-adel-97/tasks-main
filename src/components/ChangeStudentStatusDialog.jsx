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
  Grid,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
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
  const theme = useTheme();

  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(
    "(min-width:600px) and (max-width:1599px)"
  );

  const isCompact = isPhone || isTablet;

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
        Array.isArray(result?.data)
          ? result.data
          : []
      );
    } catch (err) {
      setStatuses([]);
      setError(
        err.message ||
          "حدث خطأ أثناء تحميل الحالات"
      );
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
      setError(
        err.message ||
          "حدث خطأ أثناء تغيير الحالة"
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
      fullScreen={isPhone}
      dir="rtl"
      sx={{
        "& .MuiDialog-container": {
          pt: isPhone
            ? "58px"
            : isTablet
              ? "64px"
              : 1.5,

          px: isPhone
            ? 0
            : isTablet
              ? 0.5
              : 1.5,

          pb: isPhone
            ? 0
            : isTablet
              ? 0.5
              : 1.5,

          alignItems: isPhone
            ? "stretch"
            : "center"
        }
      }}
      PaperProps={{
        sx: {
          width: isPhone
            ? "100vw"
            : isTablet
              ? "94vw"
              : undefined,

          maxWidth: isPhone
            ? "100vw"
            : isTablet
              ? "850px"
              : undefined,

          height: isPhone
            ? "calc(100dvh - 58px)"
            : isTablet
              ? "calc(100dvh - 72px)"
              : "82vh",

          maxHeight: isPhone
            ? "calc(100dvh - 58px)"
            : isTablet
              ? "calc(100dvh - 72px)"
              : "82vh",

          m: 0,

          borderRadius: isPhone
            ? 0
            : isTablet
              ? 2
              : 3,

          overflow: "hidden",

          display: "flex",
          flexDirection: "column"
        }
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 950,
          color: primaryColor,
          display: "flex",
          alignItems: "center",

          gap: isCompact ? 0.35 : 1,

          py: isPhone
            ? 0.5
            : isTablet
              ? 0.7
              : 1.5,

          px: isPhone
            ? 0.65
            : isTablet
              ? 0.9
              : 2,

          fontSize: isPhone
            ? "0.68rem"
            : isTablet
              ? "0.8rem"
              : undefined,

          flexShrink: 0
        }}
      >
        <SwapHorizIcon
          sx={{
            fontSize: isPhone
              ? 16
              : isTablet
                ? 19
                : undefined
          }}
        />

        تغيير حالة الطالب
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          p: isPhone
            ? 0.3
            : isTablet
              ? 0.55
              : 3,

          overflowY: "auto",
          flex: 1,
          minHeight: 0,

          "& .MuiInputLabel-root": {
            fontSize: isPhone
              ? "0.47rem"
              : isTablet
                ? "0.56rem"
                : undefined
          },

          "& .MuiInputBase-input": {
            fontSize: isPhone
              ? "0.5rem"
              : isTablet
                ? "0.59rem"
                : undefined,

            py: isPhone
              ? 0.5
              : isTablet
                ? 0.65
                : undefined
          },

          "& .MuiOutlinedInput-root": {
            minHeight: isPhone
              ? 31
              : isTablet
                ? 35
                : undefined,

            borderRadius: isCompact
              ? 1.25
              : undefined
          },

          "& .MuiFormHelperText-root": {
            fontSize: isPhone
              ? "0.4rem"
              : isTablet
                ? "0.48rem"
                : undefined
          }
        }}
      >
        {error ? (
          <Alert
            severity="error"
            sx={{
              mb: isCompact ? 0.35 : 2,
              py: isCompact ? 0.15 : undefined,

              fontSize: isPhone
                ? "0.46rem"
                : isTablet
                  ? "0.54rem"
                  : undefined
            }}
          >
            {error}
          </Alert>
        ) : null}

        <Paper
          variant="outlined"
          sx={{
            p: isPhone
              ? 0.4
              : isTablet
                ? 0.6
                : 2,

            mb: isCompact
              ? 0.45
              : 2,

            borderRadius: isCompact
              ? 1.4
              : undefined
          }}
        >
          <Grid
            container
            spacing={
              isPhone
                ? 0.35
                : isTablet
                  ? 0.55
                  : 1.2
            }
          >
            <Grid item xs={12} sm={6}>
              <TextField
                label="اسم الطالب"
                value={studentName}
                InputProps={{ readOnly: true }}
                fullWidth
              />
            </Grid>

            <Grid item xs={6} sm={3}>
              <TextField
                label="رقم الهوية"
                value={nationalId}
                InputProps={{ readOnly: true }}
                fullWidth
              />
            </Grid>

            <Grid item xs={6} sm={3}>
              <TextField
                label="الحالة الحالية"
                value={currentStatus || "-"}
                InputProps={{ readOnly: true }}
                fullWidth
              />
            </Grid>
          </Grid>
        </Paper>

        <TextField
          fullWidth
          label="بحث في الحالات"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon
                  sx={{
                    fontSize: isPhone
                      ? 15
                      : isTablet
                        ? 17
                        : undefined
                  }}
                />
              </InputAdornment>
            )
          }}
          sx={{
            mb: isCompact
              ? 0.4
              : 1.5
          }}
        />

        <Paper
          variant="outlined"
          sx={{
            maxHeight: isPhone
              ? 190
              : isTablet
                ? 230
                : 280,

            overflowY: "auto",

            mb: isCompact
              ? 0.45
              : 2,

            borderRadius: isCompact
              ? 1.3
              : undefined
          }}
        >
          {loading ? (
            <Box
              sx={{
                py: isPhone
                  ? 2
                  : isTablet
                    ? 3
                    : 5,

                textAlign: "center"
              }}
            >
              <CircularProgress
                size={
                  isPhone
                    ? 22
                    : isTablet
                      ? 28
                      : 40
                }
              />
            </Box>
          ) : statuses.length === 0 ? (
            <Typography
              sx={{
                py: isPhone
                  ? 2
                  : isTablet
                    ? 3
                    : 4,

                textAlign: "center",
                color: "#777",
                fontWeight: 800,

                fontSize: isPhone
                  ? "0.5rem"
                  : isTablet
                    ? "0.58rem"
                    : undefined
              }}
            >
              لا توجد حالات متاحة
            </Typography>
          ) : (
            <List
              disablePadding
              sx={{
                p: isCompact
                  ? 0.2
                  : 0
              }}
            >
              {statuses.map((status) => (
                <ListItemButton
                  key={status.guid}
                  selected={
                    selectedGuid === status.guid
                  }
                  onClick={() =>
                    setSelectedGuid(status.guid)
                  }
                  sx={{
                    minHeight: isPhone
                      ? 32
                      : isTablet
                        ? 36
                        : 48,

                    py: isPhone
                      ? 0.3
                      : isTablet
                        ? 0.4
                        : 0.75,

                    px: isPhone
                      ? 0.65
                      : isTablet
                        ? 0.85
                        : 1.5,

                    mb: isCompact
                      ? 0.15
                      : 0,

                    borderRadius: isCompact
                      ? 1
                      : 0,

                    borderBottom:
                      "1px solid #edf1ef",

                    "&.Mui-selected": {
                      backgroundColor:
                        "#e6f3ee"
                    },

                    "&.Mui-selected:hover": {
                      backgroundColor:
                        "#d9eee5"
                    }
                  }}
                >
                  <ListItemText
                    primary={status.name}
                    secondary={`الكود: ${status.code}`}
                    primaryTypographyProps={{
                      fontWeight: 950,
                      textAlign: "right",

                      fontSize: isPhone
                        ? "0.5rem"
                        : isTablet
                          ? "0.58rem"
                          : undefined,

                      lineHeight: 1.15
                    }}
                    secondaryTypographyProps={{
                      textAlign: "right",

                      fontSize: isPhone
                        ? "0.4rem"
                        : isTablet
                          ? "0.47rem"
                          : undefined,

                      lineHeight: 1.1
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
          minRows={
            isPhone
              ? 2
              : isTablet
                ? 2
                : 3
          }
          label="سبب التغيير / ملاحظة"
          value={reason}
          onChange={(event) =>
            setReason(event.target.value)
          }
          inputProps={{
            maxLength: 1000
          }}
          helperText={`${reason.length}/1000`}
        />

        {selectedStatus ? (
          <Alert
            severity="info"
            sx={{
              mt: isCompact
                ? 0.4
                : 2,

              py: isCompact
                ? 0.15
                : undefined,

              fontSize: isPhone
                ? "0.46rem"
                : isTablet
                  ? "0.54rem"
                  : undefined
            }}
          >
            سيتم تغيير حالة الطالب إلى:{" "}
            <strong>
              {selectedStatus.name}
            </strong>
          </Alert>
        ) : null}
      </DialogContent>

      <DialogActions
        sx={{
          px: isPhone
            ? 0.35
            : isTablet
              ? 0.55
              : 3,

          py: isPhone
            ? 0.28
            : isTablet
              ? 0.42
              : 2,

          gap: isCompact
            ? 0.35
            : 1,

          flexShrink: 0
        }}
      >
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={
            saving ||
            loading ||
            !selectedStatus
          }
          startIcon={
            saving ? (
              <CircularProgress
                size={
                  isPhone ? 14 : 18
                }
                color="inherit"
              />
            ) : (
              <SaveIcon
                sx={{
                  fontSize: isPhone
                    ? 14
                    : undefined
                }}
              />
            )
          }
          sx={{
            backgroundColor:
              primaryColor,

            minWidth: isPhone
              ? 90
              : isTablet
                ? 110
                : 140,

            minHeight: isPhone
              ? 30
              : isTablet
                ? 34
                : undefined,

            px: isPhone
              ? 0.8
              : isTablet
                ? 1.1
                : undefined,

            fontSize: isPhone
              ? "0.48rem"
              : isTablet
                ? "0.56rem"
                : undefined
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

            minWidth: isPhone
              ? 65
              : isTablet
                ? 75
                : 90,

            minHeight: isPhone
              ? 30
              : isTablet
                ? 34
                : undefined,

            px: isPhone
              ? 0.7
              : isTablet
                ? 1
                : undefined,

            fontSize: isPhone
              ? "0.48rem"
              : isTablet
                ? "0.56rem"
                : undefined
          }}
        >
          إغلاق
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChangeStudentStatusDialog;