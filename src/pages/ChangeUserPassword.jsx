import React, { memo, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
  useMediaQuery
} from "@mui/material";
import LockResetIcon from "@mui/icons-material/LockReset";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";

const StableSidebar = memo(Sidebar);

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  "http://localhost:5258";

const SIDEBAR_WIDTH = 280;
const DESKTOP_BREAKPOINT = 1600;

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

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

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

  const page = (
    <Box
      dir="rtl"
      sx={{
        minHeight: "100vh",
        bgcolor: soft,
        p: { xs: 0.35, sm: 0.9 },
        display: "grid",
        placeItems: "start center",
        overflowX: "hidden"
      }}
    >
      <Paper
        elevation={0}
        sx={{
          mt: { xs: 0.3, sm: 2 },
          width: "100%",
          maxWidth: 760,
          border: `1px solid ${border}`,
          borderRadius: { xs: 1.2, sm: 2.4 },
          overflow: "hidden"
        }}
      >
        <Box
          sx={{
            bgcolor: primaryDark,
            color: "#fff",
            px: { xs: 0.65, sm: 1.5 },
            py: { xs: 0.55, sm: 1 },
            display: "flex",
            alignItems: "center",
            gap: 0.55
          }}
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
              fontSize: { xs: 9, sm: 12.5 },
              py: { xs: 0.15, sm: 0.5 }
            }}
          >
            أدخل كلمة المرور الحالية أولًا، ثم اكتب كلمة المرور الجديدة واضغط تأكيد.
          </Alert>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr"
              },
              gap: { xs: 0.65, sm: 1 },
              "& .MuiTextField-root": fieldSx
            }}
          >
            <TextField
              autoFocus
              fullWidth
              size="small"
              label="كلمة المرور الحالية"
              type={
                showCurrent
                  ? "text"
                  : "password"
              }
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
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      size="small"
                      onMouseDown={() =>
                        setShowCurrent(true)
                      }
                      onMouseUp={() =>
                        setShowCurrent(false)
                      }
                      onMouseLeave={() =>
                        setShowCurrent(false)
                      }
                      onTouchStart={() =>
                        setShowCurrent(true)
                      }
                      onTouchEnd={() =>
                        setShowCurrent(false)
                      }
                      onClick={() =>
                        setShowCurrent(
                          (current) => !current
                        )
                      }
                    >
                      {showCurrent ? (
                        <VisibilityOffIcon fontSize="small" />
                      ) : (
                        <VisibilityIcon fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <TextField
              id="new-password-field"
              fullWidth
              size="small"
              label="كلمة المرور الجديدة"
              type={
                showNew
                  ? "text"
                  : "password"
              }
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
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      size="small"
                      onMouseDown={() =>
                        setShowNew(true)
                      }
                      onMouseUp={() =>
                        setShowNew(false)
                      }
                      onMouseLeave={() =>
                        setShowNew(false)
                      }
                      onTouchStart={() =>
                        setShowNew(true)
                      }
                      onTouchEnd={() =>
                        setShowNew(false)
                      }
                      onClick={() =>
                        setShowNew(
                          (current) => !current
                        )
                      }
                    >
                      {showNew ? (
                        <VisibilityOffIcon fontSize="small" />
                      ) : (
                        <VisibilityIcon fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Box>

          <Box
            sx={{
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
            }}
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
              sx={{
                fontWeight: 900,
                fontSize: { xs: 9.3, sm: 12.5 },
                minHeight: { xs: 32, sm: 40 }
              }}
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
              sx={{
                fontWeight: 900,
                fontSize: { xs: 9.3, sm: 12.5 },
                minHeight: { xs: 32, sm: 40 }
              }}
            >
              خروج
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: soft
      }}
    >
      {isDesktop ? (
        <>
          <StableSidebar />
          <Box sx={{ ml: `${SIDEBAR_WIDTH}px` }}>
            {page}
          </Box>
        </>
      ) : (
        <>
          <StableSidebar
            mobileOpen={mobileSidebarOpen}
            onMobileClose={() =>
              setMobileSidebarOpen(false)
            }
          />
          {page}
        </>
      )}
    </Box>
  );
}
