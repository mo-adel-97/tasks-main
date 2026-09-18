import { DESKTOP_BREAKPOINT } from '../config/sidebarLayout';
import * as uiLayout from './common/uiLayout';
import React, { useMemo, useRef, useState } from "react";
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
  TextField,
  useMediaQuery,
  useTheme
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

const getResponsiveSwalOptions = () => {
  const width =
    typeof window !== "undefined"
      ? window.innerWidth
      : DESKTOP_BREAKPOINT;

  const isPhoneView = width < 600;


  return {
    width: isPhoneView ? "82vw" : "420px",
    padding: isPhoneView ? "0.65rem" : "0.85rem",
    customClass: {
      popup: "sstli-refund-swal",
      icon: "sstli-refund-swal-icon",
      title: "sstli-refund-swal-title",
      htmlContainer: "sstli-refund-swal-text",
      confirmButton: "sstli-refund-swal-confirm"
    }
  };
};

const showWarning = (message) =>
  Swal.fire({
    ...getResponsiveSwalOptions(),
    icon: "warning",
    title: "تنبيه",
    text: message,
    confirmButtonText: "حسناً",
    confirmButtonColor: accentColor
  });

const showError = (message) =>
  Swal.fire({
    ...getResponsiveSwalOptions(),
    icon: "error",
    title: "خطأ",
    text: message,
    confirmButtonText: "حسناً",
    confirmButtonColor: accentColor
  });

const StudentField = ({
  label,
  value,
  isPhone,
  isTablet
}) => (
  <TextField InputLabelProps={{ shrink: true }}
    fullWidth
    size="small"
    label={label}
    value={value || ""}
    InputProps={{
      readOnly: true
    }}
    sx={uiLayout.withUiSx({
      "& .MuiInputLabel-root": {
        fontSize: isPhone
          ? "0.75rem"
          : isTablet
            ? "0.75rem"
            : undefined,

        fontWeight: 850
      },

      "& .MuiInputBase-input": {
        fontSize: isPhone
          ? "0.75rem"
          : isTablet
            ? "0.75rem"
            : undefined,

        fontWeight: 850,

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

        borderRadius:
          isPhone || isTablet
            ? 1.2
            : undefined
      }
    }, uiLayout.formFieldSx)}
  />
);

const RefundRequestDialog = ({
  open,
  student,
  apiBaseUrl,
  onClose,
  onSaved
}) => {
  const theme = useTheme();

  const isPhone = useMediaQuery(
    theme.breakpoints.down("sm")
  );

  const isTablet = useMediaQuery(
    `(min-width:600px) and (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`
  );

  const isCompact = isPhone || isTablet;

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

  // Lazy-mount guard: this dialog is mounted eagerly (but closed) as soon
  // as the parent page loads, so skip building its JSX until it has
  // actually been opened once. Once opened, later closes still render
  // normally so the MUI exit transition keeps working.
  const hasOpenedRef = useRef(open);
  if (open) hasOpenedRef.current = true;
  if (!hasOpenedRef.current) return null;

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

      const result =
        await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            "تعذر حفظ طلب الاسترداد"
        );
      }

      onSaved?.(result);
    } catch (err) {
      const message =
        err.message ||
        "حدث خطأ أثناء حفظ طلب الاسترداد";

      setError(message);
      showError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <style>
        {`
          @media screen {
            .sstli-refund-swal {
              max-width: 420px !important;
              border-radius: 14px !important;
              font-family: Cairo, Arial, sans-serif !important;
            }

            .sstli-refund-swal-icon {
              width: 3.4em !important;
              height: 3.4em !important;
              margin: 0.6em auto 0.25em !important;
            }

            .sstli-refund-swal-title {
              font-size: 0.95rem !important;
            }

            .sstli-refund-swal-text {
              font-size: 0.68rem !important;
              line-height: 1.4 !important;
            }

            .sstli-refund-swal-confirm {
              min-width: 76px !important;
              min-height: 31px !important;
              padding: 0.38rem 0.75rem !important;
              font-size: 0.66rem !important;
              border-radius: 8px !important;
              font-weight: 900 !important;
            }
          }

          @media (max-width: 599px) {
            .sstli-refund-swal {
              width: 82vw !important;
              max-width: 300px !important;
            }

            .sstli-refund-swal-title {
              font-size: 0.8rem !important;
            }

            .sstli-refund-swal-text {
              font-size: 0.57rem !important;
            }

            .sstli-refund-swal-confirm {
              min-width: 64px !important;
              min-height: 28px !important;
              font-size: 0.56rem !important;
            }
          }
        `}
      </style>

      <Dialog
        open={open}
        onClose={saving ? undefined : onClose}
        maxWidth="md"
        fullWidth
        fullScreen={isPhone}
        dir="rtl"
        sx={uiLayout.withUiSx({
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
        }, uiLayout.dialogLayoutSx)}
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
                : "78vh",

            maxHeight: isPhone
              ? "calc(100dvh - 58px)"
              : isTablet
                ? "calc(100dvh - 72px)"
                : "78vh",

            minHeight: 0,
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

            px: isPhone
              ? 0.8
              : isTablet
                ? 1
                : 2,

            py: isPhone
              ? 0.45
              : isTablet
                ? 0.65
                : 1.5,

            fontSize: isPhone
              ? "0.75rem"
              : isTablet
                ? "0.75rem"
                : undefined,

            flexShrink: 0
          }}
        >
          <CurrencyExchangeIcon
            sx={{
              fontSize: isPhone
                ? 15
                : isTablet
                  ? 18
                  : undefined
            }}
          />

          طلب استرداد
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            // Padding متساوي يمين وشمال
            px: isPhone
              ? 1
              : isTablet
                ? 1.3
                : 3,

            py: isPhone
              ? 0.8
              : isTablet
                ? 1
                : 3,

            overflowY: "auto",
            flex: 1,
            minHeight: 0
          }}
        >
          {error ? (
            <Alert
              severity="error"
              sx={{
                mb: isCompact ? 0.5 : 2,
                py: isCompact ? 0.15 : undefined,

                fontSize: isPhone
                  ? "0.75rem"
                  : isTablet
                    ? "0.75rem"
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
                ? 0.45
                : isTablet
                  ? 0.65
                  : 2,

              mb: isPhone
                ? 0.7
                : isTablet
                  ? 0.9
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
                  ? 0.7
                  : isTablet
                    ? 0.9
                    : 1.5
              }
            >
              {/* الاسم سطر كامل */}
              <Grid
                item
                xs={12}
                sm={6}
                md={4}
              >
                <StudentField
                  label="اسم الطالب"
                  value={studentName}
                  isPhone={isPhone}
                  isTablet={isTablet}
                />
              </Grid>

              {/* الهوية والجوال جنب بعض */}
              <Grid
                item
                xs={6}
                sm={3}
                md={4}
              >
                <StudentField
                  label="رقم الهوية"
                  value={nationalId}
                  isPhone={isPhone}
                  isTablet={isTablet}
                />
              </Grid>

              <Grid
                item
                xs={6}
                sm={3}
                md={4}
              >
                <StudentField
                  label="رقم الجوال"
                  value={studentTel}
                  isPhone={isPhone}
                  isTablet={isTablet}
                />
              </Grid>
            </Grid>
          </Paper>

          <TextField InputLabelProps={{ shrink: true }}
            fullWidth
            multiline
            minRows={
              isPhone
                ? 3
                : isTablet
                  ? 4
                  : 8
            }
            label="سبب الاسترداد"
            value={notes}
            onChange={(event) =>
              setNotes(event.target.value)
            }
            inputProps={{
              maxLength: 2000
            }}
            helperText={`${notes.length}/2000`}
            sx={uiLayout.withUiSx({
              mb: isPhone
                ? 0.7
                : isTablet
                  ? 0.9
                  : 2,

              "& .MuiInputLabel-root": {
                fontSize: isPhone
                  ? "0.75rem"
                  : isTablet
                    ? "0.75rem"
                    : undefined
              },

              "& .MuiInputBase-input": {
                fontSize: isPhone
                  ? "0.75rem"
                  : isTablet
                    ? "0.75rem"
                    : undefined,

                lineHeight: 1.4
              },

              "& .MuiFormHelperText-root": {
                fontSize: isPhone
                  ? "0.75rem"
                  : isTablet
                    ? "0.75rem"
                    : undefined
              }
            }, uiLayout.formFieldSx)}
          />

          <Button
            component="label"
            fullWidth
            variant="outlined"
            startIcon={
              <AttachFileIcon
                sx={{
                  fontSize: isPhone
                    ? 15
                    : isTablet
                      ? 18
                      : undefined
                }}
              />
            }
            sx={uiLayout.withUiSx({
              minHeight: isPhone
                ? 34
                : isTablet
                  ? 38
                  : 58,

              color: accentColor,
              borderColor: accentColor,
              fontWeight: 950,

              fontSize: isPhone
                ? "0.75rem"
                : isTablet
                  ? "0.75rem"
                  : undefined,

              borderRadius: isCompact
                ? 1.3
                : undefined,

              px: isPhone
                ? 0.6
                : isTablet
                  ? 0.8
                  : undefined,

              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }, uiLayout.buttonSx)}
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

        <DialogActions
          sx={uiLayout.withUiSx({
            px: isPhone
              ? 0.6
              : isTablet
                ? 0.8
                : 3,

            py: isPhone
              ? 0.3
              : isTablet
                ? 0.45
                : 2,

            gap: isCompact
              ? 0.4
              : 1,

            flexShrink: 0
          }, uiLayout.dialogActionsSx)}
        >
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
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
            sx={uiLayout.withUiSx({
              backgroundColor: primaryColor,

              minWidth: isPhone
                ? 95
                : isTablet
                  ? 115
                  : 150,

              minHeight: isPhone
                ? 30
                : isTablet
                  ? 34
                  : undefined,

              fontSize: isPhone
                ? "0.75rem"
                : isTablet
                  ? "0.75rem"
                  : undefined
            }, uiLayout.buttonSx)}
          >
            حفظ الطلب
          </Button>

          <Button
            onClick={onClose}
            disabled={saving}
            sx={uiLayout.withUiSx({
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

              fontSize: isPhone
                ? "0.75rem"
                : isTablet
                  ? "0.75rem"
                  : undefined
            }, uiLayout.buttonSx)}
          >
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default RefundRequestDialog;