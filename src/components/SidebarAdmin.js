import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Avatar,
  Chip,
  Tooltip,
  IconButton,
  Collapse,
} from "@mui/material";
import AssignmentIndRoundedIcon from "@mui/icons-material/AssignmentIndRounded";
import { Link, useLocation, useNavigate } from "react-router-dom";
import MonetizationOnRoundedIcon from "@mui/icons-material/MonetizationOnRounded";

// ✅ Material Icons
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import AddTaskRoundedIcon from "@mui/icons-material/AddTaskRounded";
import FormatListBulletedRoundedIcon from "@mui/icons-material/FormatListBulletedRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";

const PRIMARY = "#80b49e";
const PRIMARY_DARK = "#6a9a87";
const BG = "#0f172a";        // slate-900
const BG2 = "#111c33";       // deeper
const TEXT_MUTED = "#94a3b8";

export default function Sidebar() {
  const [currentUser, setCurrentUser] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
      } catch {
        setCurrentUser(null);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const displayName = useMemo(() => {
    return (
      currentUser?.fullName ||
      currentUser?.userName ||
      currentUser?.name ||
      "مستخدم"
    );
  }, [currentUser]);

  const roleLabel = useMemo(() => {
    // عدّلها حسب نظامك
    if (currentUser?.userName === "sa") return "Super Admin";
    if (currentUser?.userJop != null) return `Role: ${currentUser.userJop}`;
    return "User";
  }, [currentUser]);

  const menu = useMemo(() => {
    const base = [
  {
    label: "الدخل",
    to: "/admin-income",
    icon: <MonetizationOnRoundedIcon />,
  },
  {
    label: "الرئيسية",
    to: "/admin-dashboard",
    icon: <DashboardRoundedIcon />,
  },
  {
  label: "السير الذاتية",
  to: "/dashboard/employee-cvs",
  icon: <AssignmentIndRoundedIcon />,
},
  {
    label: "عرض الإحصائيات",
    to: "/admin-stats",
    icon: <BarChartRoundedIcon />,
  },
  {
    label: "إضافة مهمة جديدة",
    to: "/admin-add-task",
    icon: <AddTaskRoundedIcon />,
  },
  {
    label: "عرض المهام",
    to: "/admin-view-tasks",
    icon: <FormatListBulletedRoundedIcon />,
  },
];


    if (currentUser?.userName === "sa") {
      base.push({
        label: "إدارة المهام",
        to: "/admin-all-tasks",
        icon: <AdminPanelSettingsRoundedIcon />,
        admin: true,
      });
    }

    return base;
  }, [currentUser]);

  const isActive = (path) => {
    // لو عندك nested routes خليها startsWith
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const itemSx = (active) => ({
    borderRadius: 2,
    mb: 0.75,
    mx: 1,
    px: collapsed ? 1 : 1.5,
    py: 1.1,
    transition: "all .25s ease",
    color: "white",
    position: "relative",
    overflow: "hidden",
    ...(active
      ? {
          background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_DARK} 100%)`,
          boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
        }
      : {
          backgroundColor: "rgba(255,255,255,0.04)",
          "&:hover": {
            backgroundColor: "rgba(255,255,255,0.09)",
            transform: "translateY(-1px)",
          },
        }),
    "&::after": active
      ? {
          content: '""',
          position: "absolute",
          top: -40,
          right: -40,
          width: 120,
          height: 120,
          background:
            "radial-gradient(circle, rgba(255,255,255,0.22) 0%, transparent 60%)",
          transform: "rotate(20deg)",
        }
      : {},
  });

  return (
    <Box
      sx={{
        width: collapsed ? 86 : 280,
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 1200,
        color: "white",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: `linear-gradient(180deg, ${BG} 0%, ${BG2} 100%)`,
        borderRight: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 18px 45px rgba(0,0,0,0.35)",
        transition: "width .25s ease",
        overflow: "hidden",
      }}
    >
      {/* ====== Top / Brand ====== */}
      <Box sx={{ p: 2.2 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.2,
            mb: 2,
            px: 1,
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_DARK} 100%)`,
              boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
              flexShrink: 0,
            }}
          >
            <SchoolRoundedIcon />
          </Box>

          <Collapse orientation="horizontal" in={!collapsed} unmountOnExit>
            <Box>
              <Typography sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                لوحة التحكم
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: TEXT_MUTED, fontWeight: 500 }}
              >
                Saudi Training Institute
              </Typography>
            </Box>
          </Collapse>

          <Box sx={{ flexGrow: 1 }} />

          <Tooltip title={collapsed ? "توسيع" : "تصغير"} placement="right" arrow>
            <IconButton
              onClick={() => setCollapsed((p) => !p)}
              sx={{
                color: "white",
                backgroundColor: "rgba(255,255,255,0.06)",
                borderRadius: 2,
                "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
              }}
            >
              {collapsed ? <ChevronRightRoundedIcon /> : <ChevronLeftRoundedIcon />}
            </IconButton>
          </Tooltip>
        </Box>

        {/* ====== User Card ====== */}
        <Box
          sx={{
            mt: 1,
            p: 1.5,
            borderRadius: 3,
            backgroundColor: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            gap: 1.3,
          }}
        >
          <Avatar
            sx={{
              bgcolor: PRIMARY,
              color: "#0b1220",
              fontWeight: 900,
              width: 42,
              height: 42,
              flexShrink: 0,
            }}
          >
            {String(displayName || "U").trim().charAt(0).toUpperCase()}
          </Avatar>

          <Collapse orientation="horizontal" in={!collapsed} unmountOnExit>
            <Box>
              <Typography sx={{ fontWeight: 800, maxWidth: 170 }} noWrap>
                {displayName}
              </Typography>
              <Chip
                size="small"
                label={roleLabel}
                sx={{
                  mt: 0.7,
                  height: 22,
                  fontWeight: 700,
                  bgcolor: "rgba(128,180,158,0.18)",
                  color: "#d8fff0",
                  border: "1px solid rgba(128,180,158,0.35)",
                }}
              />
            </Box>
          </Collapse>
        </Box>

        <Divider
          sx={{
            my: 2.2,
            borderColor: "rgba(148,163,184,0.25)",
          }}
        />

        {/* ====== Menu ====== */}
        <List sx={{ px: 0 }}>
          {menu.map((item) => {
            const active = isActive(item.to);

            return (
              <Tooltip
                key={item.to}
                title={collapsed ? item.label : ""}
                placement="right"
                arrow
              >
                <ListItemButton
                  component={Link}
                  to={item.to}
                  sx={itemSx(active)}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: collapsed ? 0 : 1.3,
                      color: "white",
                      opacity: active ? 1 : 0.9,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>

                  {!collapsed && (
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontWeight: active ? 900 : 700,
                        fontSize: "0.95rem",
                      }}
                    />
                  )}

                  {!collapsed && item.admin && (
                    <Chip
                      size="small"
                      label="ADMIN"
                      sx={{
                        ml: 1,
                        height: 20,
                        fontSize: "0.65rem",
                        fontWeight: 900,
                        bgcolor: "rgba(255,255,255,0.12)",
                        color: "white",
                        border: "1px solid rgba(255,255,255,0.16)",
                      }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            );
          })}
        </List>
      </Box>

      {/* ====== Bottom / Logout ====== */}
      <Box sx={{ p: 2 }}>
        <Divider sx={{ mb: 2, borderColor: "rgba(148,163,184,0.25)" }} />

        <Tooltip title={collapsed ? "تسجيل الخروج" : ""} placement="right" arrow>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 2.5,
              px: collapsed ? 1 : 1.5,
              py: 1.2,
              backgroundColor: "rgba(244,67,54,0.10)",
              border: "1px solid rgba(244,67,54,0.25)",
              color: "white",
              transition: "all .25s ease",
              "&:hover": {
                backgroundColor: "rgba(244,67,54,0.18)",
                transform: "translateY(-1px)",
                boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: collapsed ? 0 : 1.3,
                color: "#ffb4ae",
              }}
            >
              <LogoutRoundedIcon />
            </ListItemIcon>
            {!collapsed && (
              <ListItemText
                primary="تسجيل الخروج"
                primaryTypographyProps={{ fontWeight: 900 }}
              />
            )}
          </ListItemButton>
        </Tooltip>

        <Typography
          variant="body2"
          sx={{
            mt: 2,
            textAlign: "center",
            color: TEXT_MUTED,
            fontWeight: 600,
          }}
        >
          © {new Date().getFullYear()}
        </Typography>
      </Box>
    </Box>
  );
}
