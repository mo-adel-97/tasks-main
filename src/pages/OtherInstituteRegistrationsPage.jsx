import PageContainer from '../components/common/PageContainer';
import * as uiLayout from '../components/common/uiLayout';
import './rtl-forms-fix.css';
import { DESKTOP_BREAKPOINT, navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
import React, { useEffect, useMemo, useState } from "react";


import {
  Alert,
  AppBar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  GlobalStyles,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Toolbar,
  useMediaQuery,
  useTheme
} from "@mui/material";

import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import SchoolIcon from "@mui/icons-material/School";
import PersonIcon from "@mui/icons-material/Person";
import BusinessIcon from "@mui/icons-material/Business";
import InfoIcon from "@mui/icons-material/Info";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";




const primaryColor = "#80b49e";
const primaryDark = "#6a9a87";
const primaryLight = "#eef7f3";
const textColor = "#2c3e50";
const dangerColor = "#d32f2f";
const warningColor = "#ed6c02";

const DARK_BORDER = "#67C99D";
const DARK_TEXT = "#9BE0C1";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "https://api4.sstli.com/api";

// صلاحية الصفحة أصبحت من Form_Name + User_Premision.


const safeText = (value) => {
  if (value === null || value === undefined) return "";
  return String(value);
};

const shortStudentName = (value) => {
  const parts = safeText(value)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length <= 2) {
    return parts.join(" ");
  }

  return `${parts[0]} ${parts[parts.length - 1]}`;
};

const formatDate = (value) => {
  if (!value) return "";

  let raw = value;

  if (typeof raw === "object") {
    raw =
      raw?.dateTime ??
      raw?.DateTime ??
      raw?.date ??
      raw?.Date ??
      raw?.value ??
      raw?.Value ??
      raw?.iso ??
      raw?.ISO ??
      raw?.$date ??
      "";
  }

  if (!raw) return "";

  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    return typeof raw === "string" ? raw : "";
  }

  return d.toLocaleString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const isActiveRegistered = (value) =>
  value === true ||
  value === 1 ||
  String(value).toLowerCase() === "true";

const getStatusChip = (isStillRegistered, isDark = false) => {
  const active = isActiveRegistered(isStillRegistered);

  if (active) {
    return (
      <Chip
        icon={<CheckCircleIcon />}
        label="مازال مسجلاً"
        size="small"
        sx={{
          backgroundColor: isDark ? "transparent" : "#e8f5e9",
          color: isDark ? DARK_TEXT : "#1b5e20",
          border: isDark ? `1px solid ${DARK_BORDER}` : "none",
          fontWeight: 900,
          direction: "rtl",
          maxWidth: "100%",
          "& .MuiChip-label": {
            textAlign: "start",
            whiteSpace: "normal",
            "@media (max-width:599px)": {
              px: 0.5,
              fontSize: "0.75rem"
            },
            [`@media (min-width:600px) and (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
              px: 0.7,
              fontSize: "0.75rem"
            }
          },
          "@media (max-width:599px)": {
            height: 20,
            "& .MuiSvgIcon-root": {
              fontSize: 13
            }
          },
          [`@media (min-width:600px) and (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
            height: 23,
            "& .MuiSvgIcon-root": {
              fontSize: 14
            }
          }
        }}
      />
    );
  }

  return (
    <Chip
      icon={<CancelIcon />}
      label="لم يعد مسجلاً"
      size="small"
      sx={{
        backgroundColor: isDark ? "transparent" : "#ffebee",
        color: isDark ? DARK_TEXT : "#b71c1c",
        border: isDark ? `1px solid ${DARK_BORDER}` : "none",
        fontWeight: 900,
        direction: "rtl",
        maxWidth: "100%",
        "& .MuiChip-label": {
          textAlign: "start",
          whiteSpace: "normal"
        }
      }}
    />
  );
};

export default function OtherInstituteRegistrationsPage() {
  const muiTheme = useTheme();
  const isDark = muiTheme.palette.mode === "dark";
  const surfaces = muiTheme.palette.surfaces || {};
  const darkCard = surfaces.card || "#13251d";
  const darkSection = surfaces.section || "#172b22";
  const darkNested = surfaces.nested || "#1b3328";
  const darkHover = surfaces.hover || "#214333";

  const isPhone = useMediaQuery(
    muiTheme.breakpoints.down("sm")
  );

  const isTablet = useMediaQuery(
    `(min-width:600px) and (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`
  );

  const isDesktop = useMediaQuery(
    `(min-width:${DESKTOP_BREAKPOINT}px)`,
    { noSsr: true }
  );

  const isCompact = isPhone || isTablet;

  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  useEffect(() => {
    if (isDesktop) {
      setMobileSidebarOpen(false);
    }
  }, [isDesktop]);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userGuid = String(user?.guid || "").toLowerCase();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [updateNote, setUpdateNote] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await fetch(
        `${API_BASE_URL}/admission-requests/other-institute-registrations?userGuid=${encodeURIComponent(
          userGuid
        )}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "حدث خطأ أثناء تحميل البيانات");
      }

      setRows(Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();

    return rows.filter((row) => {
      const isStill = isActiveRegistered(row.isStillRegistered);

      if (statusFilter === "active" && !isStill) return false;
      if (statusFilter === "inactive" && isStill) return false;

      if (!q) return true;

      const text = [
        row.orderCode,
        row.regDocCode,
        row.studentName,
        row.nationalId,
        row.studentTel,
        row.branchName,
        row.sellerName,
        row.traineeStatusNote,
        row.otherInstituteName,
        row.notes,
        row.statusUpdateNote,
        row.createdAt,
        row.statusUpdatedAt
      ]
        .map(safeText)
        .join(" ")
        .toLowerCase();

      return text.includes(q);
    });
  }, [rows, search, statusFilter]);

  const totalCount = rows.length;
  const activeCount = rows.filter((x) =>
    isActiveRegistered(x.isStillRegistered)
  ).length;
  const inactiveCount = totalCount - activeCount;

  const openConfirm = (row) => {
    setSelectedRow(row);
    setUpdateNote("");
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    if (savingId) return;
    setConfirmOpen(false);
    setSelectedRow(null);
    setUpdateNote("");
  };

  const markAsNotRegistered = async () => {
    if (!selectedRow) return;

    const id = selectedRow.id || selectedRow.ID;

    if (!id) {
      setError("لا يمكن قراءة كود السجل");
      return;
    }

    setSavingId(id);
    setError("");
    setSuccessMessage("");

    try {
      const res = await fetch(
        `${API_BASE_URL}/admission-requests/other-institute-registrations/${id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            isStillRegistered: false,
            userGuid,
            note: updateNote
          })
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "حدث خطأ أثناء تحديث الحالة");
      }

      setRows((prev) =>
        prev.map((x) => {
          const rowId = x.id || x.ID;
          if (String(rowId) !== String(id)) return x;

          return {
            ...x,
            isStillRegistered: false,
            statusText: "لم يعد مسجلاً",
            statusUpdateNote: updateNote,
            statusUpdatedAt: new Date().toISOString(),
            statusUpdatedByGuid: userGuid
          };
        })
      );

      setSuccessMessage("تم تحديث الحالة بنجاح");
      closeConfirm();
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء تحديث الحالة");
    } finally {
      setSavingId(null);
    }
  };

  const commonCellSx = {
    fontFamily: "Cairo",
    fontWeight: 700,
    textAlign: "start",
    verticalAlign: "middle",
    whiteSpace: "normal",
    wordBreak: "break-word",
    overflowWrap: "anywhere",
    lineHeight: 1.55,
    px: isPhone ? 0.5 : isTablet ? 0.7 : 1.15,
    py: isPhone ? 0.55 : isTablet ? 0.75 : 1.05,
    fontSize: isPhone
      ? "0.42rem"
      : isTablet
        ? "0.5rem"
        : "0.82rem"
  };

  const headerCellSx = {
    fontFamily: "Cairo",
    fontWeight: 950,
    backgroundColor: "#057546",
    color: "#fff",
    textAlign: "start",
    whiteSpace: "normal",
    wordBreak: "break-word",
    lineHeight: 1.35,
    px: isPhone ? 0.45 : isTablet ? 0.65 : 1.05,
    py: isPhone ? 0.55 : isTablet ? 0.7 : 1,
    fontSize: isPhone
      ? "0.4rem"
      : isTablet
        ? "0.48rem"
        : "0.76rem",
    borderBottom: "1px solid rgba(255,255,255,.14)"
  };

  return (
    <NavigationShell
      variant="standard"
      mobileOpen={mobileSidebarOpen}
      onMobileClose={() => setMobileSidebarOpen(false)}
    >
      <Box
        sx={{
          minHeight: "100dvh",
          width: "100%",
          maxWidth: "100%",
          overflowX: "hidden",
          backgroundColor: isDark
            ? muiTheme.palette.background.default
            : "#f7faf9",
          color: "text.primary",
          direction: "rtl",

          ...(isDark && {
            "& .MuiButton-root": {
              backgroundColor: "transparent !important",
              backgroundImage: "none !important",
              color: `${DARK_TEXT} !important`,
              border: `1px solid ${DARK_BORDER} !important`,
              boxShadow: "none !important"
            },
            "& .MuiButton-root:hover": {
              backgroundColor: "transparent !important",
              color: "#C9F2DF !important",
              borderColor: `${DARK_BORDER} !important`,
              boxShadow: "0 0 0 1px rgba(103,201,157,.16) !important"
            },
            "& .MuiButton-root.Mui-disabled": {
              backgroundColor: "transparent !important",
              color: "rgba(155,224,193,.42) !important",
              borderColor: "rgba(103,201,157,.34) !important",
              boxShadow: "none !important"
            },
            "& .MuiIconButton-root": {
              backgroundColor: "transparent !important",
              backgroundImage: "none !important",
              color: `${DARK_TEXT} !important`,
              border: `1px solid ${DARK_BORDER} !important`,
              boxShadow: "none !important"
            },
            "& .MuiIconButton-root:hover": {
              backgroundColor: "transparent !important",
              color: "#C9F2DF !important"
            },
            "& .MuiChip-root": {
              backgroundColor: "transparent !important",
              backgroundImage: "none !important",
              color: `${DARK_TEXT} !important`,
              border: `1px solid ${DARK_BORDER} !important`,
              boxShadow: "none !important"
            },
            "& .MuiOutlinedInput-root": {
              backgroundColor: "transparent !important",
              color: `${muiTheme.palette.text.primary} !important`
            },
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: `${DARK_BORDER} !important`
            },
            "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline, & .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: `${DARK_BORDER} !important`
            },
            "& .MuiInputLabel-root": {
              color: `${muiTheme.palette.text.secondary} !important`
            },
            "& .MuiInputLabel-root.Mui-focused": {
              color: `${DARK_TEXT} !important`
            },
            "& .MuiSelect-icon": {
              color: `${DARK_TEXT} !important`
            },
            "& .MuiAlert-root": {
              backgroundColor: "transparent !important",
              backgroundImage: "none !important",
              color: `${muiTheme.palette.text.primary} !important`,
              border: `1px solid ${DARK_BORDER} !important`,
              boxShadow: "none !important"
            },
            "& .MuiAlert-icon, & .MuiCircularProgress-root": {
              color: `${DARK_TEXT} !important`
            },
            "& .MuiDivider-root": {
              borderColor: `${DARK_BORDER} !important`
            }
          })
        }}
      >
        <GlobalStyles
          styles={{
            ".MuiDrawer-root": {
              zIndex: "2100 !important"
            },
            ".MuiDrawer-root .MuiBackdrop-root": {
              zIndex: "2099 !important"
            },
            ".MuiDrawer-root .MuiDrawer-paper": {
              zIndex: "2101 !important"
            },
            ...(isDark
              ? {
                  ".MuiMenu-paper, .MuiPopover-paper": {
                    backgroundColor: `${darkSection} !important`,
                    backgroundImage: "none !important",
                    color: `${muiTheme.palette.text.primary} !important`,
                    border: `1px solid ${DARK_BORDER} !important`
                  },
                  ".MuiMenuItem-root": {
                    backgroundColor: "transparent !important",
                    color: `${muiTheme.palette.text.primary} !important`
                  },
                  ".MuiMenuItem-root:hover": {
                    backgroundColor: `${darkHover} !important`
                  },
                  ".MuiMenuItem-root.Mui-selected": {
                    backgroundColor: "transparent !important",
                    color: `${DARK_TEXT} !important`,
                    borderInlineStart: `2px solid ${DARK_BORDER} !important`
                  }
                }
              : {})
          }}
        />

        {!isDesktop && (
          <AppBar
            position="fixed"
            elevation={0}
            sx={{
              top: 0,
              left: 0,
              right: 0,
              width: "100%",
              zIndex: 1400,
              background: isDark ? darkSection : "rgba(255,255,255,.97)",
              backdropFilter: "blur(14px)",
              color: isDark ? muiTheme.palette.text.primary : textColor,
              borderBottom: isDark
                ? `1px solid ${DARK_BORDER}`
                : "1px solid #e4eeea",
              direction: "rtl"
            }}
          >
            <Toolbar
              sx={{
                direction: "rtl",
                minHeight: "var(--app-header-height, 56px)",
                px: { xs: 0.75, sm: 1 },
                gap: 0.8
              }}
            >
              <IconButton
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setMobileSidebarOpen((v) => !v);
                }}
                sx={{
                  width: { xs: 36, sm: 40 },
                  height: { xs: 36, sm: 40 },
                  color: isDark ? DARK_TEXT : "#fff",
                  background: isDark
                    ? "transparent"
                    : "linear-gradient(135deg,#057546,#034d31)",
                  border: isDark ? `1px solid ${DARK_BORDER}` : "none",
                  boxShadow: isDark
                    ? "none"
                    : "0 5px 14px rgba(5,117,70,.20)"
                }}
              >
                <MenuRoundedIcon sx={{ fontSize: { xs: 20, sm: 22 } }} />
              </IconButton>

              <Typography
                sx={{
                  flex: 1,
                  minWidth: 0,
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  fontSize: { xs: "0.75rem", sm: "0.8rem" },
                  color: isDark ? muiTheme.palette.text.primary : textColor,
                  textAlign: "start",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}
              >
                المسجلين في معاهد أخرى
              </Typography>
            </Toolbar>
          </AppBar>
        )}

        <PageContainer
          component="main"
          sx={{
            width: "100%",
            maxWidth: "100%",
            minWidth: 0,
            mt: {
              xs: "var(--app-header-height, 56px)",
              sm: "var(--app-header-height, 56px)"
            },
            minHeight: "100dvh",
            backgroundColor: isDark
              ? muiTheme.palette.background.default
              : "#f7faf9",
            direction: "rtl",
            textAlign: "start",
            fontFamily: "Cairo, Arial",
            overflowX: "hidden",
            boxSizing: "border-box",
            p: { xs: 0.5, sm: 0.75, md: 1.25 },
            [`@media (min-width:${DESKTOP_BREAKPOINT}px)`]: {
              mt: 0,
              p: 1.6
            },
            ...navigationContentSx
          }}
        >
          {/* Header: compact and quiet */}
          <Paper
            elevation={0}
            sx={{
              p: isPhone ? 0.55 : isTablet ? 0.75 : 1.15,
              mb: 0.8,
              borderRadius: isCompact ? 1.5 : 2.2,
              border: isDark
                ? `1px solid ${DARK_BORDER}`
                : "1px solid #e4eeea",
              background: isDark
                ? darkSection
                : "linear-gradient(135deg,#fff,#f4fbf8)",
              backgroundImage: isDark ? "none" : undefined
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={0.8}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={0.7}
                sx={{ minWidth: 0 }}
              >
                <SchoolIcon
                  sx={{
                    color: isDark ? DARK_TEXT : primaryDark,
                    fontSize: isPhone ? 19 : 24
                  }}
                />
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontFamily: "Cairo",
                      fontWeight: 950,
                      fontSize: isPhone ? "0.76rem" : isTablet ? "0.86rem" : "1.1rem",
                      color: isDark ? muiTheme.palette.text.primary : textColor,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}
                  >
                    المسجلين في معاهد أخرى
                  </Typography>
                  {!isPhone && (
                    <Typography
                      sx={{
                        mt: 0.1,
                        fontFamily: "Cairo",
                        fontSize: isTablet ? "0.7rem" : "0.76rem",
                        color: isDark
                          ? muiTheme.palette.text.secondary
                          : "#607d70"
                      }}
                    >
                      متابعة التسجيل الخارجي وتحديث حالة طي القيد
                    </Typography>
                  )}
                </Box>
              </Stack>

              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={loadData}
                disabled={loading}
                sx={uiLayout.withUiSx({
                  flexShrink: 0,
                  minHeight: 32,
                  px: 1,
                  fontFamily: "Cairo",
                  fontWeight: 900
                }, uiLayout.buttonSx)}
              >
                تحديث
              </Button>
            </Stack>
          </Paper>

          {/* One compact statistics strip instead of three large cards */}
          <Paper
            elevation={0}
            sx={{
              mb: 0.8,
              p: isPhone ? 0.4 : 0.55,
              borderRadius: isCompact ? 1.4 : 1.9,
              border: isDark
                ? `1px solid ${DARK_BORDER}`
                : "1px solid #e4eeea",
              background: isDark ? darkCard : "#fff",
              backgroundImage: "none"
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(3,minmax(0,1fr))",
                gap: 0.45
              }}
            >
              {[
                {
                  label: "الإجمالي",
                  value: totalCount,
                  icon: <InfoIcon />
                },
                {
                  label: "مازالوا مسجلين",
                  value: activeCount,
                  icon: <CheckCircleIcon />
                },
                {
                  label: "تم طي القيد",
                  value: inactiveCount,
                  icon: <CancelIcon />
                }
              ].map((item) => (
                <Box
                  key={item.label}
                  sx={{
                    minWidth: 0,
                    px: isPhone ? 0.35 : 0.6,
                    py: isPhone ? 0.35 : 0.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 0.45,
                    borderRadius: 1.2,
                    border: isDark
                      ? `1px solid ${DARK_BORDER}`
                      : "1px solid rgba(5,117,70,.09)",
                    background: isDark ? "transparent" : "#f8fcfa"
                  }}
                >
                  <Box
                    sx={{
                      display: "grid",
                      placeItems: "center",
                      color: isDark ? DARK_TEXT : primaryDark,
                      "& .MuiSvgIcon-root": {
                        fontSize: isPhone ? 14 : 17
                      }
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontFamily: "Cairo",
                        fontWeight: 800,
                        fontSize: isPhone ? "0.62rem" : "0.7rem",
                        color: isDark
                          ? muiTheme.palette.text.secondary
                          : "#607d70",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}
                    >
                      {item.label}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: "Cairo",
                        fontWeight: 950,
                        fontSize: isPhone ? "0.78rem" : "0.94rem",
                        color: isDark ? DARK_TEXT : primaryDark,
                        lineHeight: 1.2
                      }}
                    >
                      {item.value}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>

          {/* Compact filters */}
          <Paper
            elevation={0}
            sx={{
              p: isPhone ? 0.45 : 0.6,
              mb: 0.8,
              borderRadius: isCompact ? 1.4 : 1.9,
              border: isDark
                ? `1px solid ${DARK_BORDER}`
                : "1px solid #e4eeea",
              background: isDark ? darkCard : "#fff",
              backgroundImage: "none"
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "minmax(0,1fr) 190px"
                },
                gap: 0.55
              }}
            >
              <TextField
                fullWidth
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث بالطالب، الهوية، الجوال، الفرع أو المعهد الآخر..."
                InputProps={{
                  startAdornment: (
                    <SearchIcon
                      sx={{
                        color: isDark ? DARK_TEXT : "#8aa99c",
                        mr: 0.7,
                        fontSize: 18
                      }}
                    />
                  )
                }}
                size="small"
                sx={uiLayout.withUiSx({
                  "& input": {
                    textAlign: "start",
                    fontFamily: "Cairo",
                    fontWeight: 700,
                    fontSize: isPhone ? "0.72rem" : "0.78rem"
                  }
                }, uiLayout.formFieldSx)}
              />

              <TextField
                select
                fullWidth
                label="الحالة"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
                SelectProps={{
                  MenuProps: {
                    PaperProps: {
                      sx: {
                        backgroundColor: isDark ? darkSection : "#fff",
                        color: isDark
                          ? muiTheme.palette.text.primary
                          : "inherit",
                        border: isDark
                          ? `1px solid ${DARK_BORDER}`
                          : "none",
                        "& .MuiMenuItem-root": {
                          minHeight: 34,
                          fontFamily: "Cairo",
                          fontSize: "0.78rem"
                        }
                      }
                    }
                  }
                }}
                sx={uiLayout.formFieldSx}
              >
                <MenuItem value="all">الكل</MenuItem>
                <MenuItem value="active">مازال مسجلاً</MenuItem>
                <MenuItem value="inactive">تم طي القيد</MenuItem>
              </TextField>
            </Box>
          </Paper>

          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 0.8,
                fontFamily: "Cairo"
              }}
            >
              {error}
            </Alert>
          )}

          {successMessage && (
            <Alert
              severity="success"
              sx={{
                mb: 0.8,
                fontFamily: "Cairo"
              }}
            >
              {successMessage}
            </Alert>
          )}

          {/* Results */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: isCompact ? 1.5 : 2,
              border: isDark
                ? `1px solid ${DARK_BORDER}`
                : "1px solid #e4eeea",
              overflow: "hidden",
              background: isDark ? darkCard : "#fff",
              backgroundImage: "none",
              width: "100%"
            }}
          >
            {loading ? (
              <Box
                sx={{
                  minHeight: 260,
                  display: "grid",
                  placeItems: "center"
                }}
              >
                <Stack spacing={1} alignItems="center">
                  <CircularProgress size={30} />
                  <Typography
                    sx={{
                      fontFamily: "Cairo",
                      fontWeight: 800,
                      fontSize: "0.78rem"
                    }}
                  >
                    جاري تحميل البيانات...
                  </Typography>
                </Stack>
              </Box>
            ) : isCompact ? (
              <Box
                sx={{
                  display: "grid",
                  gap: 0.45,
                  p: 0.45
                }}
              >
                {filteredRows.length === 0 ? (
                  <Box
                    sx={{
                      minHeight: 220,
                      display: "grid",
                      placeItems: "center",
                      fontFamily: "Cairo",
                      fontWeight: 800,
                      color: isDark
                        ? muiTheme.palette.text.secondary
                        : "#789",
                      fontSize: "0.75rem"
                    }}
                  >
                    لا توجد بيانات للعرض
                  </Box>
                ) : (
                  filteredRows.map((row) => {
                    const id = row.id || row.ID;
                    const isStill = isActiveRegistered(row.isStillRegistered);

                    return (
                      <Paper
                        key={id}
                        variant="outlined"
                        sx={{
                          p: 0.65,
                          borderRadius: 1.2,
                          borderColor: isDark ? DARK_BORDER : "#e4eeea",
                          background: isDark ? darkSection : "#fff",
                          backgroundImage: "none"
                        }}
                      >
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="flex-start"
                          spacing={0.55}
                        >
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography
                              sx={{
                                fontFamily: "Cairo",
                                fontWeight: 950,
                                fontSize: "0.76rem",
                                color: isDark
                                  ? muiTheme.palette.text.primary
                                  : textColor,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis"
                              }}
                            >
                              {shortStudentName(row.studentName) || "-"}
                            </Typography>

                            <Typography
                              sx={{
                                mt: 0.1,
                                fontFamily: "Cairo",
                                fontSize: "0.68rem",
                                color: isDark
                                  ? muiTheme.palette.text.secondary
                                  : "#789"
                              }}
                            >
                              <bdi dir="ltr">{safeText(row.nationalId) || "-"}</bdi>
                              {" • "}
                              <bdi dir="ltr">{safeText(row.studentTel) || "-"}</bdi>
                            </Typography>
                          </Box>

                          {getStatusChip(row.isStillRegistered, isDark)}
                        </Stack>

                        <Box
                          sx={{
                            mt: 0.5,
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 0.45
                          }}
                        >
                          <Box>
                            <Typography
                              sx={{
                                fontFamily: "Cairo",
                                fontSize: "0.64rem",
                                color: isDark
                                  ? muiTheme.palette.text.secondary
                                  : "#8a9993"
                              }}
                            >
                              المعهد الآخر
                            </Typography>
                            <Typography
                              sx={{
                                fontFamily: "Cairo",
                                fontWeight: 800,
                                fontSize: "0.72rem",
                                color: isDark
                                  ? muiTheme.palette.text.primary
                                  : textColor
                              }}
                            >
                              {safeText(row.otherInstituteName) || "-"}
                            </Typography>
                          </Box>

                          <Box>
                            <Typography
                              sx={{
                                fontFamily: "Cairo",
                                fontSize: "0.64rem",
                                color: isDark
                                  ? muiTheme.palette.text.secondary
                                  : "#8a9993"
                              }}
                            >
                              الفرع
                            </Typography>
                            <Typography
                              sx={{
                                fontFamily: "Cairo",
                                fontWeight: 800,
                                fontSize: "0.72rem",
                                color: isDark
                                  ? muiTheme.palette.text.primary
                                  : textColor
                              }}
                            >
                              {safeText(row.branchName) || "-"}
                            </Typography>
                          </Box>
                        </Box>

                        {(row.traineeStatusNote || row.notes || row.statusUpdateNote) && (
                          <Box
                            sx={{
                              mt: 0.5,
                              p: 0.45,
                              borderRadius: 1,
                              background: isDark ? darkNested : "#f7faf9",
                              border: isDark
                                ? `1px solid ${DARK_BORDER}`
                                : "none"
                            }}
                          >
                            <Typography
                              sx={{
                                fontFamily: "Cairo",
                                fontSize: "0.68rem",
                                lineHeight: 1.45,
                                color: isDark
                                  ? muiTheme.palette.text.secondary
                                  : "#5e6f68"
                              }}
                            >
                              {safeText(
                                row.statusUpdateNote ||
                                  row.traineeStatusNote ||
                                  row.notes
                              )}
                            </Typography>
                          </Box>
                        )}

                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          spacing={0.45}
                          sx={{ mt: 0.5 }}
                        >
                          <Typography
                            sx={{
                              minWidth: 0,
                              fontFamily: "Cairo",
                              fontSize: "0.64rem",
                              color: isDark
                                ? muiTheme.palette.text.secondary
                                : "#789"
                            }}
                          >
                            {formatDate(row.createdAt)}
                          </Typography>

                          {isStill ? (
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<DoneAllIcon />}
                              onClick={() => openConfirm(row)}
                              disabled={savingId === id}
                              sx={uiLayout.withUiSx({
                                minHeight: 27,
                                px: 0.7,
                                fontFamily: "Cairo",
                                fontWeight: 900,
                                fontSize: "0.68rem",
                                whiteSpace: "nowrap"
                              }, uiLayout.buttonSx)}
                            >
                              تحديث الحالة
                            </Button>
                          ) : (
                            <Chip
                              label="تم طي القيد"
                              size="small"
                              sx={{
                                height: 23,
                                fontSize: "0.66rem",
                                fontWeight: 900,
                                backgroundColor: isDark
                                  ? "transparent"
                                  : "#ffebee",
                                color: isDark ? DARK_TEXT : "#b71c1c",
                                border: isDark
                                  ? `1px solid ${DARK_BORDER}`
                                  : "none"
                              }}
                            />
                          )}
                        </Stack>
                      </Paper>
                    );
                  })
                )}
              </Box>
            ) : (
              <TableContainer
                sx={{
                  maxHeight: "calc(100vh - 270px)",
                  overflowX: "hidden",
                  width: "100%",
                  backgroundColor: isDark ? darkCard : "#fff"
                }}
              >
                <Table
                  stickyHeader
                  size="small"
                  sx={{
                    tableLayout: "fixed",
                    width: "100%",
                    "& tbody tr:hover": {
                      backgroundColor: isDark ? darkHover : "#f4fbf8"
                    },
                    "& tbody td": {
                      borderBottom: isDark
                        ? "1px solid rgba(103,201,157,.22)"
                        : "1px solid #edf2ef"
                    }
                  }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          ...headerCellSx,
                          width: "12%",
                          backgroundColor: isDark ? darkNested : "#057546",
                          color: isDark
                            ? muiTheme.palette.text.primary
                            : "#fff",
                          borderBottom: isDark
                            ? `1px solid ${DARK_BORDER}`
                            : "1px solid rgba(255,255,255,.14)"
                        }}
                      >
                        الحالة
                      </TableCell>
                      <TableCell
                        sx={{
                          ...headerCellSx,
                          width: "14%",
                          backgroundColor: isDark ? darkNested : "#057546",
                          color: isDark
                            ? muiTheme.palette.text.primary
                            : "#fff",
                          borderBottom: isDark
                            ? `1px solid ${DARK_BORDER}`
                            : "1px solid rgba(255,255,255,.14)"
                        }}
                      >
                        الإجراء
                      </TableCell>
                      <TableCell
                        sx={{
                          ...headerCellSx,
                          width: "25%",
                          backgroundColor: isDark ? darkNested : "#057546",
                          color: isDark
                            ? muiTheme.palette.text.primary
                            : "#fff",
                          borderBottom: isDark
                            ? `1px solid ${DARK_BORDER}`
                            : "1px solid rgba(255,255,255,.14)"
                        }}
                      >
                        بيانات الطالب
                      </TableCell>
                      <TableCell
                        sx={{
                          ...headerCellSx,
                          width: "13%",
                          backgroundColor: isDark ? darkNested : "#057546",
                          color: isDark
                            ? muiTheme.palette.text.primary
                            : "#fff",
                          borderBottom: isDark
                            ? `1px solid ${DARK_BORDER}`
                            : "1px solid rgba(255,255,255,.14)"
                        }}
                      >
                        الفرع
                      </TableCell>
                      <TableCell
                        sx={{
                          ...headerCellSx,
                          width: "18%",
                          backgroundColor: isDark ? darkNested : "#057546",
                          color: isDark
                            ? muiTheme.palette.text.primary
                            : "#fff",
                          borderBottom: isDark
                            ? `1px solid ${DARK_BORDER}`
                            : "1px solid rgba(255,255,255,.14)"
                        }}
                      >
                        المعهد الآخر
                      </TableCell>
                      <TableCell
                        sx={{
                          ...headerCellSx,
                          width: "18%",
                          backgroundColor: isDark ? darkNested : "#057546",
                          color: isDark
                            ? muiTheme.palette.text.primary
                            : "#fff",
                          borderBottom: isDark
                            ? `1px solid ${DARK_BORDER}`
                            : "1px solid rgba(255,255,255,.14)"
                        }}
                      >
                        الملاحظات
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {filteredRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} sx={{ textAlign: "center", py: 5 }}>
                          <Typography
                            sx={{
                              fontFamily: "Cairo",
                              fontWeight: 900,
                              color: isDark
                                ? muiTheme.palette.text.secondary
                                : "#789"
                            }}
                          >
                            لا توجد بيانات للعرض
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRows.map((row) => {
                        const id = row.id || row.ID;
                        const isStill = isActiveRegistered(row.isStillRegistered);

                        return (
                          <TableRow key={id} hover>
                            <TableCell sx={commonCellSx}>
                              <Stack spacing={0.35}>
                                {getStatusChip(row.isStillRegistered, isDark)}
                                {row.statusUpdatedAt && (
                                  <Typography
                                    sx={{
                                      fontFamily: "Cairo",
                                      fontSize: "0.66rem",
                                      color: isDark
                                        ? muiTheme.palette.text.secondary
                                        : "#789"
                                    }}
                                  >
                                    {formatDate(row.statusUpdatedAt)}
                                  </Typography>
                                )}
                              </Stack>
                            </TableCell>

                            <TableCell sx={commonCellSx}>
                              {isStill ? (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<DoneAllIcon />}
                                  onClick={() => openConfirm(row)}
                                  disabled={savingId === id}
                                  sx={uiLayout.withUiSx({
                                    width: "100%",
                                    minHeight: 31,
                                    px: 0.65,
                                    fontFamily: "Cairo",
                                    fontWeight: 900,
                                    fontSize: "0.7rem",
                                    whiteSpace: "nowrap"
                                  }, uiLayout.buttonSx)}
                                >
                                  تحديث الحالة
                                </Button>
                              ) : (
                                <Chip
                                  label="تم طي القيد"
                                  size="small"
                                  sx={{
                                    fontFamily: "Cairo",
                                    fontWeight: 900,
                                    backgroundColor: isDark
                                      ? "transparent"
                                      : "#ffebee",
                                    color: isDark ? DARK_TEXT : "#b71c1c",
                                    border: isDark
                                      ? `1px solid ${DARK_BORDER}`
                                      : "none"
                                  }}
                                />
                              )}
                            </TableCell>

                            <TableCell sx={commonCellSx}>
                              <Stack spacing={0.15}>
                                <Typography
                                  sx={{
                                    fontFamily: "Cairo",
                                    fontWeight: 900,
                                    fontSize: "0.78rem",
                                    color: isDark
                                      ? muiTheme.palette.text.primary
                                      : textColor
                                  }}
                                >
                                  {safeText(row.studentName) || "-"}
                                </Typography>
                                <Typography
                                  sx={{
                                    fontFamily: "Cairo",
                                    fontSize: "0.67rem",
                                    color: isDark
                                      ? muiTheme.palette.text.secondary
                                      : "#789"
                                  }}
                                >
                                  هوية:{" "}
                                  <bdi dir="ltr">
                                    {safeText(row.nationalId) || "-"}
                                  </bdi>
                                  {" • "}
                                  جوال:{" "}
                                  <bdi dir="ltr">
                                    {safeText(row.studentTel) || "-"}
                                  </bdi>
                                </Typography>
                              </Stack>
                            </TableCell>

                            <TableCell sx={commonCellSx}>
                              {safeText(row.branchName) || "-"}
                            </TableCell>

                            <TableCell sx={commonCellSx}>
                              <Stack
                                direction="row"
                                spacing={0.45}
                                alignItems="flex-start"
                              >
                                <BusinessIcon
                                  sx={{
                                    flexShrink: 0,
                                    color: isDark ? DARK_TEXT : primaryDark,
                                    fontSize: 16,
                                    mt: 0.2
                                  }}
                                />
                                <span>
                                  {safeText(row.otherInstituteName) || "-"}
                                </span>
                              </Stack>
                            </TableCell>

                            <TableCell sx={commonCellSx}>
                              <Stack spacing={0.25}>
                                {(row.traineeStatusNote || row.notes) ? (
                                  <Typography
                                    sx={{
                                      fontFamily: "Cairo",
                                      fontWeight: 700,
                                      fontSize: "0.72rem",
                                      lineHeight: 1.45,
                                      color: isDark
                                        ? muiTheme.palette.text.primary
                                        : textColor
                                    }}
                                  >
                                    {safeText(
                                      row.traineeStatusNote || row.notes
                                    )}
                                  </Typography>
                                ) : (
                                  <Typography
                                    sx={{
                                      fontFamily: "Cairo",
                                      fontSize: "0.68rem",
                                      color: isDark
                                        ? muiTheme.palette.text.secondary
                                        : "#9aa7a1"
                                    }}
                                  >
                                    لا توجد ملاحظة
                                  </Typography>
                                )}

                                {row.statusUpdateNote && (
                                  <Typography
                                    sx={{
                                      fontFamily: "Cairo",
                                      fontWeight: 800,
                                      fontSize: "0.68rem",
                                      color: isDark ? DARK_TEXT : dangerColor
                                    }}
                                  >
                                    طي القيد: {safeText(row.statusUpdateNote)}
                                  </Typography>
                                )}

                                <Typography
                                  sx={{
                                    fontFamily: "Cairo",
                                    fontSize: "0.64rem",
                                    color: isDark
                                      ? muiTheme.palette.text.secondary
                                      : "#789"
                                  }}
                                >
                                  {formatDate(row.createdAt)}
                                </Typography>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>

          <Dialog
            open={confirmOpen}
            onClose={closeConfirm}
            maxWidth="sm"
            fullWidth
            fullScreen={isPhone}
            sx={uiLayout.dialogLayoutSx}
            PaperProps={{
              sx: {
                direction: "rtl",
                textAlign: "start",
                backgroundColor: isDark ? darkCard : "#fff",
                color: "text.primary",
                border: isDark ? `1px solid ${DARK_BORDER}` : "none",
                backgroundImage: "none",
                borderRadius: isPhone ? 0 : isTablet ? 2 : 3
              }
            }}
          >
            <DialogTitle
              sx={{
                fontFamily: "Cairo",
                fontWeight: 900,
                color: isDark ? muiTheme.palette.text.primary : textColor,
                backgroundColor: isDark ? darkSection : "transparent",
                borderBottom: isDark
                  ? `1px solid ${DARK_BORDER}`
                  : "none"
              }}
            >
              تأكيد طي القيد من المعهد الآخر
            </DialogTitle>

            <DialogContent
              sx={{
                pt: 2,
                backgroundColor: isDark ? darkCard : "#fff"
              }}
            >
              <Typography
                sx={{
                  fontFamily: "Cairo",
                  fontWeight: 700,
                  mb: 1.2
                }}
              >
                هل أنت متأكد أن الطالب لم يعد مسجلاً في المعهد الآخر؟
              </Typography>

              {selectedRow && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.2,
                    mb: 1.2,
                    borderRadius: 1.5,
                    backgroundColor: isDark ? darkSection : "#f7faf9",
                    border: isDark
                      ? `1px solid ${DARK_BORDER}`
                      : "1px solid #e4eeea"
                  }}
                >
                  <Typography sx={{ fontWeight: 900, fontFamily: "Cairo" }}>
                    الطالب: {safeText(selectedRow.studentName)}
                  </Typography>
                  <Typography sx={{ fontWeight: 700, fontFamily: "Cairo" }}>
                    رقم الهوية:{" "}
                    <bdi dir="ltr">{safeText(selectedRow.nationalId)}</bdi>
                  </Typography>
                  <Typography sx={{ fontWeight: 700, fontFamily: "Cairo" }}>
                    المعهد الآخر: {safeText(selectedRow.otherInstituteName)}
                  </Typography>
                </Paper>
              )}

              <TextField
                fullWidth
                multiline
                minRows={4}
                label="ملاحظة التحديث"
                placeholder="مثال: تم طي قيده من المعهد الآخر بناءً على الإفادة"
                value={updateNote}
                onChange={(e) => setUpdateNote(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={uiLayout.formFieldSx}
              />
            </DialogContent>

            <Divider />

            <DialogActions
              sx={{
                p: 1,
                gap: 0.55,
                backgroundColor: isDark ? darkSection : "#fff",
                borderTop: isDark
                  ? `1px solid ${DARK_BORDER}`
                  : "none"
              }}
            >
              <Button
                onClick={closeConfirm}
                disabled={!!savingId}
                sx={uiLayout.buttonSx}
              >
                إلغاء
              </Button>

              <Button
                variant="outlined"
                onClick={markAsNotRegistered}
                disabled={!!savingId}
                startIcon={
                  savingId ? (
                    <CircularProgress size={16} />
                  ) : (
                    <DoneAllIcon />
                  )
                }
                sx={uiLayout.buttonSx}
              >
                تأكيد طي القيد
              </Button>
            </DialogActions>
          </Dialog>
        </PageContainer>
      </Box>
    </NavigationShell>
  );
}
