import * as uiLayout from '../components/common/uiLayout';
import './rtl-forms-fix.css';
import { DESKTOP_BREAKPOINT, navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  TextField,
  Typography,
  useMediaQuery
} from "@mui/material";
import LockResetIcon from "@mui/icons-material/LockReset";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";




const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  "https://api4.sstli.com";




const primary = "#057546";
const primaryDark = "#034d31";
const border = "#dce8e2";
const soft = "#f7fbf9";

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const currentUser = readUser();

const getUserGuid = () =>
  String(
    currentUser?.guid ||
      currentUser?.Guid ||
      currentUser?.userGuid ||
      currentUser?.UserGuid ||
      ""
  ).trim();

export default function ChangeUserPassword() {
  const navigate = useNavigate();

  const isDesktop = useMediaQuery(
    `(min-width:${DESKTOP_BREAKPOINT}px)`,
    { noSsr: true }
  );

  const userGuid = useMemo(() => getUserGuid(), []);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [saving, setSaving] = useState(false);

  const validate = () => {
    if (!userGuid)
      return "بيانات المستخدم الحالي غير متاحة. سجل الدخول مرة أخرى.";

    if (!currentPassword)
      return "برجاء إدخال كلمة المرور الحالية";

    if (!newPassword)
      return "برجاء إدخال كلمة المرور الجديدة";

    if (newPassword.length < 4)
      return "كلمة المرور الجديدة يجب ألا تقل عن 4 أحرف";

    if (currentPassword === newPassword)
      return "كلمة المرور الجديدة يجب أن تختلف عن كلمة المرور الحالية";

    return "";
  };

  const submit = async () => {
    const error = validate();

    if (error) {
      await Swal.fire({
        icon: "warning",
        title: "راجع البيانات",
        text: error
      });
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/change-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            userGuid,
            currentPassword,
            newPassword
          })
        }
      );

      const raw = await response.text();

      let result = null;
      try {
        result = raw ? JSON.parse(raw) : null;
      } catch {
        result = null;
      }

      if (!response.ok) {
        throw new Error(
          [
            result?.message,
            result?.error,
            result?.detail
          ]
            .filter(Boolean)
            .join(" — ") ||
            raw ||
            "تعذر تغيير كلمة المرور"
        );
      }

      await Swal.fire({
        icon: "success",
        title: "تم بنجاح",
        text:
          result?.message ||
          "تم تغيير كلمة المرور بنجاح"
      });

      setCurrentPassword("");
      setNewPassword("");

      // لا نعمل Logout إجباري حتى يظل السلوك قريبًا من الديسكتوب.
      navigate("/dashboard");
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "تعذر تغيير كلمة المرور",
        text:
          error?.message ||
          "تعذر تغيير كلمة المرور"
      });
    } finally {
      setSaving(false);
    }
  };

  const fieldSx = {
    "& .MuiInputBase-root": {
      minHeight: { xs: 34, sm: 42 }
    },
    "& .MuiInputBase-input": {
      fontSize: { xs: 10.4, sm: 13.5 },
      py: { xs: 0.45, sm: 0.8 }
    },
    "& .MuiInputLabel-root": {
      fontSize: { xs: 9.2, sm: 12.5 }
    }
  };

  // Always-visible focus-green outline on every field, in every state (idle,
  // hover, focused) — matches the reference styling adopted on the Home page.
  const fieldBorderSx = (theme) => (theme.palette.mode !== "dark" ? {} : {
    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#67C99D" },
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#67C99D" },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#67C99D" }
  });

  const page = (
    <Box
      dir="rtl"
      sx={(theme) => ({
        minHeight: "100vh",
        bgcolor: theme.palette.mode === "dark" ? theme.palette.background.default : soft,
        p: { xs: 0.35, sm: 0.9 },
        display: "grid",
        placeItems: "start center",
        overflowX: "hidden"
      })}
    >
      <Paper
        elevation={0}
        sx={(theme) => {
          const isDark = theme.palette.mode === "dark";
          return {
            mt: { xs: 0.3, sm: 2 },
            width: "100%",
            maxWidth: 760,
            border: isDark ? "1px solid #67C99D" : `1px solid ${border}`,
            borderRadius: { xs: 1.2, sm: 2.4 },
            overflow: "hidden",
            boxShadow: isDark ? "0 0 0 1px #67C99D, 0 18px 40px rgba(0,0,0,.45)" : "none"
          };
        }}
      >
        <Box
          sx={uiLayout.withUiSx({
            bgcolor: primaryDark,
            color: "#fff",
            px: { xs: 0.65, sm: 1.5 },
            py: { xs: 0.55, sm: 1 },
            display: "flex",
            alignItems: "center",
            gap: 0.55
          }, uiLayout.mobileHeaderSx)}
        >
          {!isDesktop && (
            <IconButton
              onClick={() =>
                setMobileSidebarOpen(true)
              }
              sx={{
                color: "#fff",
                p: 0.25
              }}
            >
              <MenuRoundedIcon />
            </IconButton>
          )}

          <LockResetIcon />

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontWeight: 900,
                fontSize: { xs: 14, sm: 21 }
              }}
            >
              تغيير كلمة المرور
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            p: { xs: 0.75, sm: 1.4 }
          }}
        >
          <Alert
            severity="info"
            sx={{
              mb: 1,
              fontSize: { xs: 12, sm: 12.5 },
              py: { xs: 0.15, sm: 0.5 }
            }}
          >
            أدخل كلمة المرور الحالية أولًا، ثم اكتب كلمة المرور الجديدة واضغط تأكيد.
          </Alert>

          <Box
            sx={uiLayout.withUiSx({
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr"
              },
              gap: { xs: 0.65, sm: 1 },
              "& .MuiTextField-root": fieldSx
            }, uiLayout.formSectionSx)}
          >
            <TextField sx={uiLayout.withUiSx(uiLayout.formFieldSx, fieldBorderSx)} InputLabelProps={{ shrink: true }}
              autoFocus
              fullWidth
              size="small"
              label="كلمة المرور الحالية"
              type="password"
              value={currentPassword}
              onChange={(e) =>
                setCurrentPassword(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();

                  const newField =
                    document.getElementById(
                      "new-password-field"
                    );

                  newField?.focus();
                }
              }}
            />

            <TextField sx={uiLayout.withUiSx(uiLayout.formFieldSx, fieldBorderSx)} InputLabelProps={{ shrink: true }}
              id="new-password-field"
              fullWidth
              size="small"
              label="كلمة المرور الجديدة"
              type="password"
              value={newPassword}
              onChange={(e) =>
                setNewPassword(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submit();
                }
              }}
            />
          </Box>

          <Box
            sx={uiLayout.withUiSx({
              mt: { xs: 0.8, sm: 1.3 },
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr 1fr",
                sm: "160px 160px"
              },
              justifyContent: {
                xs: "stretch",
                sm: "center"
              },
              gap: 0.65
            }, uiLayout.actionBarSx)}
          >
            <Button
              variant="contained"
              color="success"
              startIcon={
                saving ? (
                  <CircularProgress
                    size={14}
                    color="inherit"
                  />
                ) : (
                  <CheckCircleOutlineIcon />
                )
              }
              disabled={saving}
              onClick={submit}
              sx={uiLayout.withUiSx({
                fontWeight: 900,
                fontSize: { xs: 12, sm: 12.5 },
                minHeight: { xs: 32, sm: 40 }
              }, uiLayout.buttonSx)}
            >
              تأكيد
            </Button>

            <Button
              variant="outlined"
              color="error"
              startIcon={<CloseIcon />}
              disabled={saving}
              onClick={() =>
                navigate("/dashboard")
              }
              sx={uiLayout.withUiSx({
                fontWeight: 900,
                fontSize: { xs: 12, sm: 12.5 },
                minHeight: { xs: 32, sm: 40 }
              }, uiLayout.buttonSx)}
            >
              خروج
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );

  return (
    <NavigationShell variant="standard" mobileOpen={mobileSidebarOpen} onMobileClose={() =>
              setMobileSidebarOpen(false)
            }><Box
      sx={(theme) => ({
        minHeight: "100vh",
        bgcolor: theme.palette.mode === "dark" ? theme.palette.background.default : soft
      })}
    >
      {isDesktop ? (
        <>
          
          <Box sx={{
            ...navigationContentSx
          }}>
            {page}
          </Box>
        </>
      ) : (
        <>
          
          {page}
        </>
      )}
    </Box></NavigationShell>
  );
}
