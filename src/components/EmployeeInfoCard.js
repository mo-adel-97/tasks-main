import { hrChipSx } from "./hrControlStyles";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Card,
  Chip,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Snackbar,
  Stack,
  Typography
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { motion } from "framer-motion";
import {
  CalendarMonth,
  CameraAlt,
  Delete,
  Edit,
  Notifications,
  Security,
  Work
} from "@mui/icons-material";

const COLOR_SCHEME = {
  primary: "#057546",
  primaryDark: "#034d31",
  primaryLight: "#e6f3ee",
  accent: "#ae1e21",
  white: "#fefefe",
  text: "#1f2d3d",
  muted: "#6f8a81",
  gold: "#f4b740"
};

const API_BASE_URL = "https://filesregsiteration.sstli.com/erp/image_api.php";

const fadeIn = {
  hidden: { opacity: 0, y: 28, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, ease: "easeOut" }
  }
};

const glassChipSx = {
  color: COLOR_SCHEME.white,
  fontWeight: 900,
  borderRadius: 999,
  background: "rgba(255,255,255,0.16)",
  border: "1px solid rgba(255,255,255,0.28)",
  backdropFilter: "blur(10px)",
  fontSize: { xs: "0.62rem", sm: "0.7rem", md: "0.78rem" },
  height: { xs: 26, sm: 29, md: 32 },
  "& .MuiChip-label": { px: { xs: 0.8, sm: 1 } },
  "& .MuiChip-icon": {
    color: COLOR_SCHEME.white,
    fontSize: { xs: 15, sm: 17, md: 19 }
  }
};

const EmployeeInfoCard = ({ user, isHRUser, isHRManager }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });

  const fileInputRef = useRef(null);

  const displayName = user?.fullName || user?.FullName || "اسم الموظف";
  const userName = user?.userName || user?.UserName || "اسم المستخدم";
  const department = user?.userDepart || user?.UserDepart || user?.departName || "القسم";
  const employeeCode = user?.code || user?.Code || "غير محدد";
  const isActive = Boolean(user?.staut_ ?? user?.staut ?? user?.Staut);
  const firstLetter = displayName && displayName !== "اسم الموظف" ? displayName.charAt(0) : "U";

  useEffect(() => {
    if (user?.guid || user?.Guid) {
      fetchUserImage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.guid, user?.Guid]);

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  const getUserGuid = () => user?.guid || user?.Guid || "";

  const fetchUserImage = async () => {
    const userGuid = getUserGuid();
    if (!userGuid) return;

    try {
      setImageLoading(true);
      const timestamp = new Date().getTime();
      const response = await fetch(
        `${API_BASE_URL}?action=get&userGuid=${encodeURIComponent(userGuid)}&t=${timestamp}`
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setImageUrl((oldUrl) => {
          if (oldUrl) URL.revokeObjectURL(oldUrl);
          return url;
        });
      } else {
        setImageUrl(null);
      }
    } catch (error) {
      console.error("Error while fetching image:", error);
      setImageUrl(null);
    } finally {
      setImageLoading(false);
    }
  };

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const userGuid = getUserGuid();
    if (!userGuid) {
      setSnackbar({ open: true, message: "لا يمكن قراءة المستخدم الحالي", severity: "error" });
      return;
    }

    try {
      setImageLoading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userGuid", userGuid);

      const response = await fetch(`${API_BASE_URL}?action=upload`, {
        method: "POST",
        body: formData
      });

      const textResult = await response.text();
      let result;

      try {
        result = JSON.parse(textResult);
      } catch {
        result = { message: "Invalid server response" };
      }

      if (response.ok) {
        setSnackbar({
          open: true,
          message: result.message || "تم رفع الصورة بنجاح",
          severity: "success"
        });
        await fetchUserImage();
      } else {
        setSnackbar({
          open: true,
          message: result.message || "فشل في رفع الصورة",
          severity: "error"
        });
      }
    } catch (error) {
      console.error("Error during upload:", error);
      setSnackbar({ open: true, message: "حدث خطأ أثناء رفع الصورة", severity: "error" });
    } finally {
      setImageLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      handleMenuClose();
    }
  };

  const handleDeleteImage = async () => {
    const userGuid = getUserGuid();
    if (!userGuid) {
      setSnackbar({ open: true, message: "لا يمكن قراءة المستخدم الحالي", severity: "error" });
      return;
    }

    try {
      setImageLoading(true);
      const response = await fetch(`${API_BASE_URL}?action=delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userGuid })
      });

      const textResult = await response.text();
      let result;

      try {
        result = JSON.parse(textResult);
      } catch {
        result = { message: "Invalid delete response" };
      }

      if (response.ok) {
        setSnackbar({
          open: true,
          message: result.message || "تم حذف الصورة بنجاح",
          severity: "success"
        });
        setImageUrl((oldUrl) => {
          if (oldUrl) URL.revokeObjectURL(oldUrl);
          return null;
        });
      } else {
        setSnackbar({
          open: true,
          message: result.message || "فشل في حذف الصورة",
          severity: "error"
        });
      }
    } catch (error) {
      console.error("Error during delete:", error);
      setSnackbar({ open: true, message: "حدث خطأ أثناء حذف الصورة", severity: "error" });
    } finally {
      setImageLoading(false);
      handleMenuClose();
    }
  };

  const handleSnackbarClose = () => setSnackbar((prev) => ({ ...prev, open: false }));

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible">
      <Card
        sx={{
          p: { xs: 1.25, sm: 1.7, md: 2.2, lg: 3 },
          borderRadius: { xs: 3, sm: 4, md: 5 },
          background: `linear-gradient(135deg, ${COLOR_SCHEME.primary} 0%, ${COLOR_SCHEME.primaryDark} 100%)`,
          color: COLOR_SCHEME.white,
          boxShadow: `0 24px 60px ${alpha(COLOR_SCHEME.primary, 0.28)}`,
          position: "relative",
          overflow: "hidden",
          mb: { xs: 1.2, sm: 1.8, md: 2.4 },
          border: "1px solid rgba(255,255,255,0.18)",
          "&:before": {
            content: '""',
            position: "absolute",
            width: 260,
            height: 260,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.10)",
            top: -110,
            right: -70
          },
          "&:after": {
            content: '"SSTLI"',
            position: "absolute",
            right: 24,
            bottom: 10,
            fontWeight: 1000,
            fontSize: { xs: 40, md: 72 },
            letterSpacing: 5,
            color: "rgba(255,255,255,0.055)",
            pointerEvents: "none"
          }
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: { xs: "center", sm: "center" },
            flexDirection: { xs: "column", sm: "row" },
            gap: { xs: 1.2, sm: 1.8, md: 2.4 },
            position: "relative",
            zIndex: 2
          }}
        >
          <Box sx={{ position: "relative", alignSelf: "center" }}>
            <Box
              sx={{
                p: 0.8,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.16)",
                border: "1px solid rgba(255,255,255,0.24)",
                boxShadow: "0 16px 32px rgba(0,0,0,0.14)"
              }}
            >
              {imageLoading ? (
                <Box
                  sx={{
                    width: { xs: 66, sm: 82, md: 96, lg: 108 },
                    height: { xs: 66, sm: 82, md: 96, lg: 108 },
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(255,255,255,0.10)",
                    border: "4px solid rgba(255,255,255,0.35)"
                  }}
                >
                  <CircularProgress size={34} sx={{ color: COLOR_SCHEME.white }} />
                </Box>
              ) : (
                <Avatar
                  sx={{
                    width: { xs: 66, sm: 82, md: 96, lg: 108 },
                    height: { xs: 66, sm: 82, md: 96, lg: 108 },
                    border: "4px solid rgba(255,255,255,0.34)",
                    fontSize: { xs: "1.7rem", sm: "2rem", md: "2.3rem" },
                    fontWeight: 1000,
                    background: imageUrl
                      ? "transparent"
                      : `linear-gradient(135deg, ${COLOR_SCHEME.white} 0%, ${COLOR_SCHEME.primaryLight} 100%)`,
                    color: COLOR_SCHEME.primary
                  }}
                  src={imageUrl || undefined}
                >
                  {!imageUrl && firstLetter}
                </Avatar>
              )}
            </Box>

            <IconButton
              sx={{
                position: "absolute",
                bottom: { xs: 1, sm: 3, md: 5 },
                right: { xs: 1, sm: 3, md: 5 },
                width: { xs: 28, sm: 32, md: 36 },
                height: { xs: 28, sm: 32, md: 36 },
                background: COLOR_SCHEME.accent,
                color: COLOR_SCHEME.white,
                border: "3px solid rgba(255,255,255,0.95)",
                boxShadow: "0 8px 18px rgba(0,0,0,0.20)",
                "&:hover": {
                  background: "#8f171a",
                  transform: "scale(1.04)"
                },
                transition: "all 0.2s ease"
              }}
              size="small"
              onClick={handleMenuOpen}
              disabled={imageLoading}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Box>

          <Box sx={{ flex: 1, width: "100%", textAlign: { xs: "center", sm: "start" } }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 1000,
                mb: 0.8,
                letterSpacing: "0.2px",
                fontSize: { xs: "1.18rem", sm: "1.4rem", md: "1.72rem", lg: "1.95rem" }
              }}
            >
              {displayName}
            </Typography>

            <Typography variant="h6" sx={{ opacity: 0.92, mb: 0.45, fontWeight: 850, fontSize: { xs: '0.78rem', sm: '0.9rem', md: '1.02rem' } }}>
              {userName}
            </Typography>

            <Typography variant="body1" sx={{ opacity: 0.84, fontWeight: 750, fontSize: { xs: '0.68rem', sm: '0.78rem', md: '0.88rem' } }}>
              {department} • {employeeCode}
            </Typography>

            {isHRUser && (
              <Stack
                direction="row"
                gap={1}
                flexWrap="wrap"
                justifyContent={{ xs: "center", sm: "flex-start" }}
                sx={{ mt: { xs: 1, sm: 1.4 } }}
              >
                <Chip
                  label={isHRManager ? "مدير موارد بشرية" : "موظف موارد بشرية"}
                  size="small"
                  sx={{
                    background: COLOR_SCHEME.white,
                    color: COLOR_SCHEME.primary,
                    fontWeight: 1000,
                    borderRadius: 999
                  }}
                />
                <Chip
                  label="إدارة الطلبات"
                  size="small"
                  sx={{
                    ...glassChipSx,
                    borderColor: "rgba(255,255,255,0.42)"
                  }}
                />
              </Stack>
            )}
          </Box>

          <Box
            sx={{
              minWidth: { xs: "100%", sm: 150, md: 175 },
              textAlign: "center",
              p: { xs: 0.8, sm: 1.05, md: 1.35 },
              borderRadius: { xs: 2.4, sm: 3, md: 4 },
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.18)",
              backdropFilter: "blur(10px)"
            }}
          >
            <Typography variant="body1" sx={{ opacity: 0.92, mb: 0.7, fontWeight: 900, fontSize: { xs: '0.68rem', sm: '0.76rem', md: '0.84rem' } }}>
              {new Date().toLocaleDateString("ar-EG", {
                day: "numeric",
                month: "long",
                year: "numeric"
              })}
            </Typography>
            <Chip
              icon={<CalendarMonth />}
              label={isActive ? "الحالة: نشط" : "الحالة: غير نشط"}
              sx={[hrChipSx(), {
                ...glassChipSx,
                background: isActive ? "rgba(255,255,255,0.18)" : alpha(COLOR_SCHEME.accent, 0.22)
              }]}
            />
          </Box>
        </Box>

        <Stack
          direction="row"
          flexWrap="wrap"
          gap={{ xs: 0.6, sm: 0.8, md: 1.1 }}
          sx={{ mt: { xs: 1.2, sm: 1.7, md: 2.3 }, position: "relative", zIndex: 2 }}
        >
          <Chip icon={<Work />} label={`كود الموظف: ${employeeCode}`} sx={[hrChipSx(), glassChipSx]} />
          <Chip icon={<Security />} label={`الحالة: ${isActive ? "نشط" : "غير نشط"}`} sx={[hrChipSx(), glassChipSx]} />
          <Chip icon={<Notifications />} label={`اسم المستخدم: ${userName}`} sx={[hrChipSx(), glassChipSx]} />
          {isHRUser && (
            <Chip
              icon={<Security />}
              label={`الصلاحية: ${isHRManager ? "مدير" : "موظف"}`}
              sx={[hrChipSx(), {
                ...glassChipSx,
                background: alpha(COLOR_SCHEME.gold, 0.22),
                borderColor: alpha(COLOR_SCHEME.gold, 0.65)
              }]}
            />
          )}
        </Stack>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 190,
              borderRadius: 3,
              border: `1px solid ${COLOR_SCHEME.primaryLight}`,
              boxShadow: "0 14px 36px rgba(31,45,61,0.16)",
              overflow: "hidden"
            }
          }}
        >
          <MenuItem
            onClick={() => fileInputRef.current?.click()}
            sx={{ fontWeight: 900, color: COLOR_SCHEME.primaryDark }}
          >
            <CameraAlt sx={{ marginInlineEnd: 1, color: COLOR_SCHEME.primary }} />
            {imageUrl ? "تغيير الصورة" : "إضافة صورة"}
          </MenuItem>
          {imageUrl && (
            <MenuItem onClick={handleDeleteImage} sx={{ color: COLOR_SCHEME.accent, fontWeight: 900 }}>
              <Delete sx={{ marginInlineEnd: 1 }} />
              حذف الصورة
            </MenuItem>
          )}
        </Menu>

        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          accept=".jpg,.jpeg,.png,.gif,.webp"
          onChange={handleImageUpload}
        />
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{
            width: "100%",
            borderRadius: 2,
            fontWeight: 900,
            "& .MuiAlert-icon": {
              alignItems: "center"
            }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </motion.div>
  );
};

export default EmployeeInfoCard;