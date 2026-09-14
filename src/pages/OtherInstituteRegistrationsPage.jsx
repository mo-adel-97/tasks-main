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

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5258/api";

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
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return safeText(value);

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

const getStatusChip = (isStillRegistered) => {
  const active = isActiveRegistered(isStillRegistered);

  if (active) {
    return (
      <Chip
        icon={<CheckCircleIcon />}
        label="مازال مسجلاً"
        size="small"
        sx={{
          backgroundColor: "#e8f5e9",
          color: "#1b5e20",
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
            "@media (min-width:600px) and (max-width:1599px)": {
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
          "@media (min-width:600px) and (max-width:1599px)": {
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
        backgroundColor: "#ffebee",
        color: "#b71c1c",
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

  const isPhone = useMediaQuery(
    muiTheme.breakpoints.down("sm")
  );

  const isTablet = useMediaQuery(
    "(min-width:600px) and (max-width:1599px)"
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
    <NavigationShell variant="standard" mobileOpen={mobileSidebarOpen} onMobileClose={() =>
          setMobileSidebarOpen(false)
        }><Box
      sx={{
        minHeight: "100dvh",
        width: "100%",
        maxWidth: "100vw",
        overflowX: "hidden",
        backgroundColor: "#f7faf9",
        direction: "rtl"
      }}
    >
      {!isDesktop && (
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
            }
          }}
        />
      )}

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
            background: "rgba(255,255,255,.97)",
            backdropFilter: "blur(14px)",
            color: textColor,
            borderBottom: "1px solid #e4eeea",
            direction: "rtl"
          }}
        >
          <Toolbar
            sx={{
              direction: "rtl",
              minHeight: {
                xs: "var(--app-header-height, 56px)",
                sm: "var(--app-header-height, 56px)"
              },
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
                color: "#fff",
                background:
                  "linear-gradient(135deg,#057546,#034d31)",
                boxShadow:
                  "0 5px 14px rgba(5,117,70,.20)"
              }}
            >
              <MenuRoundedIcon
                sx={{
                  fontSize: { xs: 20, sm: 22 }
                }}
              />
            </IconButton>

            <Typography
              sx={{
                flex: 1,
                fontFamily: "Cairo",
                fontWeight: 900,
                fontSize: {
                  xs: "0.75rem",
                  sm: "0.8rem"
                },
                color: textColor,
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

      

      <Box
        component="main"
        sx={{
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          ml: 0,
          mt: {
            xs: "var(--app-header-height, 56px)",
            sm: "var(--app-header-height, 56px)"
          },
          minHeight: "100dvh",
          p: {
            xs: 0.55,
            sm: 0.8,
            md: 1
          },
          backgroundColor: "#f7faf9",
          direction: "rtl",
          textAlign: "start",
          fontFamily: "Cairo, Arial",
          overflowX: "hidden",
          boxSizing: "border-box",
          [`@media (min-width:${DESKTOP_BREAKPOINT}px)`]: {
            mt: 0,
            p: 2.5
          },
          ...navigationContentSx
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: isPhone ? 0.5 : isTablet ? 0.75 : 2.3,
            mb: isPhone ? 0.5 : isTablet ? 0.7 : 1.6,
            borderRadius: isPhone ? 1.25 : isTablet ? 1.6 : 3.2,
            border: "1px solid #e4eeea",
            background: "linear-gradient(135deg, #ffffff 0%, #f4fbf8 100%)",
            direction: "rtl",
            textAlign: "start"
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            spacing={isPhone ? 0.55 : isTablet ? 0.8 : 1.5}
          >
            <Box sx={{ textAlign: "start" }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <SchoolIcon
                  sx={{
                    color: primaryDark,
                    fontSize: isPhone
                      ? 20
                      : isTablet
                        ? 24
                        : 30
                  }}
                />
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 900,
                    color: textColor,
                    textAlign: "start",
                    fontFamily: "Cairo",
                    fontSize: isPhone
                      ? "0.75rem"
                      : isTablet
                        ? "0.76rem"
                        : "1.3rem"
                  }}
                >
                  المسجلين في معاهد أخرى
                </Typography>
              </Stack>

              <Typography
                sx={{
                  mt: isPhone ? 0.15 : 0.45,
                  color: "#607d70",
                  fontWeight: 600,
                  fontSize: isPhone
                    ? "0.75rem"
                    : isTablet
                      ? "0.75rem"
                      : "0.82rem",
                  display: isPhone ? "none" : "block",
                  textAlign: "start",
                  fontFamily: "Cairo"
                }}
              >
                تقرير متابعة الطلاب الذين تم تسجيلهم كمسجلين في معاهد أخرى، مع إمكانية تحديث الحالة عند طي القيد.
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={loadData}
              disabled={loading}
              sx={uiLayout.withUiSx({
                borderRadius: 3,
                fontWeight: 900,
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryDark} 100%)`,
                fontFamily: "Cairo",
                minWidth: isPhone ? 0 : isTablet ? 90 : 110,
                minHeight: isPhone ? 30 : isTablet ? 33 : 38,
                px: isPhone ? 0.8 : isTablet ? 1.1 : 1.6,
                fontSize: isPhone
                  ? "0.75rem"
                  : isTablet
                    ? "0.75rem"
                    : "0.75rem"
              }, uiLayout.buttonSx)}
            >
              تحديث
            </Button>
          </Stack>
        </Paper>

        <Grid
          container
          spacing={isPhone ? 0.35 : isTablet ? 0.5 : 1.2}
          sx={{ mb: isPhone ? 0.5 : isTablet ? 0.7 : 1.5 }}
        >
          <Grid item xs={4} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: isPhone ? 0.35 : isTablet ? 0.55 : 1.35,
                borderRadius: isPhone ? 1 : isTablet ? 1.35 : 2.4,
                border: "1px solid #e4eeea",
                textAlign: "start",
                minHeight: isPhone ? 50 : isTablet ? 58 : 82
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <InfoIcon sx={{ color: primaryDark }} />
                <Box>
                  <Typography
                    sx={{
                      fontWeight: 900,
                      textAlign: "start",
                      fontSize: isPhone
                        ? "0.75rem"
                        : isTablet
                          ? "0.75rem"
                          : "0.75rem"
                    }}
                  >
                    إجمالي السجلات
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 900,
                      color: primaryDark,
                      fontSize: isPhone
                        ? "0.75rem"
                        : isTablet
                          ? "0.75rem"
                          : "1.25rem"
                    }}
                  >
                    {totalCount}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={4} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: isPhone ? 0.35 : isTablet ? 0.55 : 1.35,
                borderRadius: isPhone ? 1 : isTablet ? 1.35 : 2.4,
                border: "1px solid #e4eeea",
                textAlign: "start",
                minHeight: isPhone ? 50 : isTablet ? 58 : 82
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <CheckCircleIcon sx={{ color: primaryDark }} />
                <Box>
                  <Typography
                    sx={{
                      fontWeight: 900,
                      textAlign: "start",
                      fontSize: isPhone
                        ? "0.75rem"
                        : isTablet
                          ? "0.75rem"
                          : "0.75rem"
                    }}
                  >
                    مازالوا مسجلين
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 900,
                      color: primaryDark,
                      fontSize: isPhone
                        ? "0.75rem"
                        : isTablet
                          ? "0.75rem"
                          : "1.25rem"
                    }}
                  >
                    {activeCount}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={4} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: isPhone ? 0.35 : isTablet ? 0.55 : 1.35,
                borderRadius: isPhone ? 1 : isTablet ? 1.35 : 2.4,
                border: "1px solid #e4eeea",
                textAlign: "start",
                minHeight: isPhone ? 50 : isTablet ? 58 : 82
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <CancelIcon sx={{ color: dangerColor }} />
                <Box>
                  <Typography
                    sx={{
                      fontWeight: 900,
                      textAlign: "start",
                      fontSize: isPhone
                        ? "0.75rem"
                        : isTablet
                          ? "0.75rem"
                          : "0.75rem"
                    }}
                  >
                    لم يعودوا مسجلين
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 900,
                      color: dangerColor,
                      fontSize: isPhone
                        ? "0.75rem"
                        : isTablet
                          ? "0.75rem"
                          : "1.25rem"
                    }}
                  >
                    {inactiveCount}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        <Paper
          elevation={0}
          sx={{
            p: isPhone ? 0.45 : isTablet ? 0.65 : 1.4,
            mb: isPhone ? 0.5 : isTablet ? 0.7 : 1.5,
            borderRadius: isPhone ? 1.15 : isTablet ? 1.5 : 2.8,
            border: "1px solid #e4eeea",
            direction: "rtl",
            textAlign: "start"
          }}
        >
          <Grid
            container
            spacing={isPhone ? 0.55 : isTablet ? 0.75 : 1.2}
            alignItems="center"
          >
            <Grid item xs={12} sm={8} md={8}>
              <TextField InputLabelProps={{ shrink: true }}
                fullWidth
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث باسم الطالب، رقم الهوية، المعهد الآخر، الفرع، مسئول التسجيل..."
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: "#8aa99c", mr: 1 }} />
                }}
                size={isCompact ? "small" : "medium"}
                sx={uiLayout.withUiSx({
                  direction: "rtl",
                  "& .MuiOutlinedInput-root": {
                    minHeight: isPhone ? 31 : isTablet ? 34 : undefined,
                    borderRadius: isCompact ? 1.1 : undefined
                  },
                  "& input": {
                    textAlign: "start",
                    fontFamily: "Cairo",
                    fontWeight: 700,
                    fontSize: isPhone
                      ? "0.75rem"
                      : isTablet
                        ? "0.75rem"
                        : undefined,
                    py: isPhone ? 0.45 : isTablet ? 0.55 : undefined
                  },
                  "& .MuiSvgIcon-root": {
                    fontSize: isPhone ? 14 : isTablet ? 16 : undefined
                  }
                }, uiLayout.formFieldSx)}
              />
            </Grid>

            <Grid item xs={12} sm={4} md={4}>
              <TextField InputLabelProps={{ shrink: true }}
                select
                fullWidth
                label="الحالة"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                size={isCompact ? "small" : "medium"}
                SelectProps={{
                  MenuProps: {
                    PaperProps: {
                      sx: {
                        "& .MuiMenuItem-root": {
                          minHeight: isPhone ? 28 : isTablet ? 31 : 40,
                          fontSize: isPhone
                            ? "0.44rem"
                            : isTablet
                              ? "0.52rem"
                              : undefined,
                          fontFamily: "Cairo"
                        }
                      }
                    }
                  }
                }}
                sx={uiLayout.withUiSx({
                  direction: "rtl",
                  "& .MuiOutlinedInput-root": {
                    minHeight: isPhone ? 31 : isTablet ? 34 : undefined,
                    borderRadius: isCompact ? 1.1 : undefined
                  },
                  "& .MuiInputBase-input": {
                    textAlign: "start",
                    fontFamily: "Cairo",
                    fontWeight: 700,
                    fontSize: isPhone
                      ? "0.75rem"
                      : isTablet
                        ? "0.75rem"
                        : undefined,
                    py: isPhone ? 0.45 : isTablet ? 0.55 : undefined
                  },
                  "& .MuiInputLabel-root": {
                    left: 0,
                    right: "auto",
                    transformOrigin: "left",
                    fontSize: isPhone
                      ? "0.75rem"
                      : isTablet
                        ? "0.75rem"
                        : undefined
                  }
                }, uiLayout.formFieldSx)}
              >
                <MenuItem value="all">الكل</MenuItem>
                <MenuItem value="active">مازال مسجلاً</MenuItem>
                <MenuItem value="inactive">لم يعد مسجلاً</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 2, textAlign: "start", fontFamily: "Cairo" }}>
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" sx={{ mb: 2, textAlign: "start", fontFamily: "Cairo" }}>
            {successMessage}
          </Alert>
        )}

        <Paper
          elevation={0}
          sx={{
            borderRadius: isPhone ? 1.4 : isTablet ? 1.8 : 3,
            border: "1px solid #e4eeea",
            overflow: "hidden",
            direction: "rtl",
            textAlign: "start",
            width: "100%"
          }}
        >
          {loading ? (
            <Box sx={{ p: 6, textAlign: "center" }}>
              <CircularProgress sx={{ color: primaryDark }} />
              <Typography sx={{ mt: 2, fontWeight: 800 }}>
                جاري تحميل البيانات...
              </Typography>
            </Box>
          ) : isCompact ? (
            <Box
              sx={{
                display: "grid",
                gap: isPhone ? 0.35 : 0.5,
                p: isPhone ? 0.35 : 0.5
              }}
            >
              {filteredRows.length === 0 ? (
                <Box
                  sx={{
                    minHeight: 240,
                    display: "grid",
                    placeItems: "center",
                    fontFamily: "Cairo",
                    fontWeight: 800,
                    color: "#789",
                    fontSize: isPhone
                      ? "0.75rem"
                      : "0.75rem"
                  }}
                >
                  لا توجد بيانات للعرض
                </Box>
              ) : (
                filteredRows.map((row) => {
                  const id = row.id || row.ID;
                  const isStill = isActiveRegistered(
                    row.isStillRegistered
                  );

                  return (
                    <Paper
                      key={id}
                      variant="outlined"
                      sx={uiLayout.withUiSx({
                        p: isPhone ? 0.45 : 0.65,
                        borderRadius: isPhone ? 1 : 1.3,
                        borderColor: "#e4eeea",
                        background: "#fff"
                      }, uiLayout.pageHeaderSx)}
                    >
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="flex-start"
                        spacing={0.6}
                      >
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography
                            sx={{
                              fontFamily: "Cairo",
                              fontWeight: 950,
                              fontSize: isPhone
                                ? "0.75rem"
                                : "0.75rem",
                              color: textColor,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis"
                            }}
                          >
                            {shortStudentName(row.studentName) || "-"}
                          </Typography>

                          <Typography
                            sx={{
                              mt: 0.15,
                              fontFamily: "Cairo",
                              fontSize: isPhone
                                ? "0.75rem"
                                : "0.75rem",
                              color: "#789"
                            }}
                          >
                            {safeText(row.nationalId) || "-"} • {safeText(row.studentTel) || "-"}
                          </Typography>
                        </Box>

                        {getStatusChip(row.isStillRegistered)}
                      </Stack>

                      <Box
                        sx={{
                          mt: 0.55,
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(2,minmax(0,1fr))",
                          gap: isPhone ? 0.45 : 0.6
                        }}
                      >
                        <Box>
                          <Typography
                            sx={{
                              fontFamily: "Cairo",
                              fontSize: isPhone
                                ? "0.75rem"
                                : "0.75rem",
                              color: "#8a9993"
                            }}
                          >
                            المعهد الآخر
                          </Typography>
                          <Typography
                            sx={{
                              fontFamily: "Cairo",
                              fontWeight: 800,
                              fontSize: isPhone
                                ? "0.75rem"
                                : "0.75rem",
                              color: textColor
                            }}
                          >
                            {safeText(row.otherInstituteName) || "-"}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography
                            sx={{
                              fontFamily: "Cairo",
                              fontSize: isPhone
                                ? "0.75rem"
                                : "0.75rem",
                              color: "#8a9993"
                            }}
                          >
                            مسئول التسجيل
                          </Typography>
                          <Typography
                            sx={{
                              fontFamily: "Cairo",
                              fontWeight: 800,
                              fontSize: isPhone
                                ? "0.75rem"
                                : "0.75rem"
                            }}
                          >
                            {safeText(row.sellerName) || "-"}
                          </Typography>
                        </Box>
                      </Box>

                      {(row.traineeStatusNote || row.notes) && (
                        <Typography
                          sx={{
                            mt: 0.55,
                            p: 0.45,
                            borderRadius: 1,
                            background: "#f7faf9",
                            fontFamily: "Cairo",
                            fontSize: isPhone
                              ? "0.75rem"
                              : "0.75rem",
                            lineHeight: 1.45,
                            color: "#5e6f68"
                          }}
                        >
                          {safeText(
                            row.traineeStatusNote ||
                              row.notes
                          )}
                        </Typography>
                      )}

                      <Stack
                        direction="row"
                        justifyContent="flex-end"
                        alignItems="center"
                        spacing={0.45}
                        sx={{
                          mt: isPhone ? 0.4 : 0.5,
                          flexWrap: "nowrap"
                        }}
                      >
                        <Typography
                          sx={{
                            flex: 1,
                            minWidth: 0,
                            fontFamily: "Cairo",
                            fontSize: isPhone
                              ? "0.75rem"
                              : "0.75rem",
                            color: "#789"
                          }}
                        >
                          طلب {safeText(row.orderCode) || "-"} • استمارة {safeText(row.regDocCode) || "-"}
                        </Typography>

                        {isStill ? (
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => openConfirm(row)}
                            disabled={savingId === id}
                            sx={uiLayout.withUiSx({
                              minHeight: isPhone ? 24 : 27,
                              minWidth: isPhone ? 52 : 62,
                              px: isPhone ? 0.45 : 0.65,
                              py: 0,
                              fontFamily: "Cairo",
                              fontWeight: 900,
                              fontSize: isPhone
                                ? "0.75rem"
                                : "0.75rem",
                              borderRadius: isPhone ? 1 : 1.2,
                              boxShadow: "none",
                              backgroundColor: warningColor
                            }, uiLayout.buttonSx)}
                          >
                            طي القيد
                          </Button>
                        ) : (
                          <Chip
                            label="تم طي القيد"
                            size="small"
                            sx={{
                              height: isPhone ? 20 : 23,
                              fontSize: isPhone
                                ? "0.75rem"
                                : "0.75rem",
                              fontWeight: 900,
                              "& .MuiChip-label": {
                                px: isPhone ? 0.55 : 0.7
                              }
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
              sx={uiLayout.withUiSx({
                maxHeight: "calc(100vh - 300px)",
                overflowX: "hidden",
                width: "100%"
              }, uiLayout.tableContainerSx)}
            >
              <Table
                stickyHeader
                sx={{
                  tableLayout: "fixed",
                  width: "100%"
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ ...headerCellSx, width: "13%" }}>
                      الحالة
                    </TableCell>
                    <TableCell sx={{ ...headerCellSx, width: "13%" }}>
                      هل سوّى طي قيد من المعهد الآخر؟
                    </TableCell>
                    <TableCell sx={{ ...headerCellSx, width: "9%" }}>
                      رقم الطلب
                    </TableCell>
                    <TableCell sx={{ ...headerCellSx, width: "10%" }}>
                      رقم الاستمارة
                    </TableCell>
                    <TableCell sx={{ ...headerCellSx, width: "15%" }}>
                      اسم الطالب
                    </TableCell>
                    <TableCell sx={{ ...headerCellSx, width: "10%" }}>
                      رقم الهوية
                    </TableCell>
                    <TableCell sx={{ ...headerCellSx, width: "10%" }}>
                      رقم الجوال
                    </TableCell>
                    <TableCell sx={{ ...headerCellSx, width: "12%" }}>
                      الفرع
                    </TableCell>
                    <TableCell sx={{ ...headerCellSx, width: "10%" }}>
                      مسئول التسجيل
                    </TableCell>
                    <TableCell sx={{ ...headerCellSx, width: "14%" }}>
                      ملاحظة مسئول التسجيل
                    </TableCell>
                    <TableCell sx={{ ...headerCellSx, width: "13%" }}>
                      المعهد الآخر
                    </TableCell>
                    <TableCell sx={{ ...headerCellSx, width: "15%" }}>
                      ملاحظات
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} sx={{ textAlign: "center", py: 5 }}>
                        <Typography sx={{ fontWeight: 900, color: "#789" }}>
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
                            <Stack spacing={1}>
                              {getStatusChip(row.isStillRegistered)}

                              {row.statusUpdatedAt && (
                                <Typography
                                  sx={{
                                    fontSize: "0.75rem",
                                    color: "#789",
                                    fontWeight: 700,
                                    textAlign: "start"
                                  }}
                                >
                                  تحديث: {formatDate(row.statusUpdatedAt)}
                                </Typography>
                              )}
                            </Stack>
                          </TableCell>

                          <TableCell sx={commonCellSx}>
                            {isStill ? (
                              <Tooltip title="تحديث الحالة إلى لم يعد مسجلاً">
                                <span>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    startIcon={<DoneAllIcon />}
                                    disabled={savingId === id}
                                    onClick={() => openConfirm(row)}
                                    sx={uiLayout.withUiSx({
                                      fontWeight: 900,
                                      borderRadius: 2,
                                      backgroundColor: warningColor,
                                      fontFamily: "Cairo",
                                      width: "100%",
                                      whiteSpace: "normal",
                                      lineHeight: 1.5,
                                      py: 0.8,
                                      "&:hover": {
                                        backgroundColor: "#c75a00"
                                      }
                                    }, uiLayout.buttonSx)}
                                  >
                                   تحديث حالته
                                  </Button>
                                </span>
                              </Tooltip>
                            ) : (
                              <Chip
                                label="تم طي القيد"
                                size="small"
                                sx={{
                                  fontWeight: 900,
                                  backgroundColor: "#ffebee",
                                  color: "#b71c1c",
                                  whiteSpace: "normal",
                                  height: "auto",
                                  py: 0.5,
                                  "& .MuiChip-label": {
                                    whiteSpace: "normal"
                                  }
                                }}
                              />
                            )}
                          </TableCell>

                          <TableCell sx={commonCellSx}>{safeText(row.orderCode)}</TableCell>
                          <TableCell sx={commonCellSx}>{safeText(row.regDocCode)}</TableCell>

                          <TableCell sx={commonCellSx}>
                            <Stack direction="row" spacing={1} alignItems="flex-start">
                              <PersonIcon sx={{ color: primaryDark, fontSize: 18, mt: 0.3 }} />
                              <span>{safeText(row.studentName)}</span>
                            </Stack>
                          </TableCell>

                          <TableCell sx={commonCellSx}>{safeText(row.nationalId)}</TableCell>
                          <TableCell sx={commonCellSx}>{safeText(row.studentTel)}</TableCell>
                          <TableCell sx={commonCellSx}>{safeText(row.branchName)}</TableCell>
                          <TableCell sx={commonCellSx}>{safeText(row.sellerName)}</TableCell>

                          <TableCell sx={commonCellSx}>
                            {row.traineeStatusNote ? (
                              <Tooltip title={safeText(row.traineeStatusNote)} arrow>
                                <Typography
                                  sx={{
                                    fontFamily: "Cairo",
                                    fontWeight: 800,
                                    fontSize: "0.82rem",
                                    textAlign: "start",
                                    whiteSpace: "normal",
                                    wordBreak: "break-word",
                                    overflowWrap: "anywhere",
                                    color: textColor
                                  }}
                                >
                                  {safeText(row.traineeStatusNote)}
                                </Typography>
                              </Tooltip>
                            ) : (
                              <Typography
                                sx={{
                                  fontFamily: "Cairo",
                                  fontWeight: 700,
                                  fontSize: "0.8rem",
                                  color: "#9aa7a1",
                                  textAlign: "start"
                                }}
                              >
                                لا توجد ملاحظة
                              </Typography>
                            )}
                          </TableCell>

                          <TableCell sx={commonCellSx}>
                            <Stack direction="row" spacing={1} alignItems="flex-start">
                              <BusinessIcon sx={{ color: primaryDark, fontSize: 18, mt: 0.3 }} />
                              <span>{safeText(row.otherInstituteName)}</span>
                            </Stack>
                          </TableCell>

                          <TableCell sx={commonCellSx}>
                            <Stack spacing={0.8}>
                              {row.notes && (
                                <Typography
                                  sx={{
                                    fontFamily: "Cairo",
                                    fontWeight: 700,
                                    fontSize: "0.85rem",
                                    textAlign: "start",
                                    wordBreak: "break-word"
                                  }}
                                >
                                  {safeText(row.notes)}
                                </Typography>
                              )}

                              {row.statusUpdateNote && (
                                <Typography
                                  sx={{
                                    fontFamily: "Cairo",
                                    fontWeight: 800,
                                    fontSize: "0.78rem",
                                    color: dangerColor,
                                    textAlign: "start",
                                    wordBreak: "break-word"
                                  }}
                                >
                                  ملاحظة طي القيد: {safeText(row.statusUpdateNote)}
                                </Typography>
                              )}

                              <Typography
                                sx={{
                                  fontFamily: "Cairo",
                                  fontWeight: 700,
                                  fontSize: "0.75rem",
                                  color: "#789",
                                  textAlign: "start"
                                }}
                              >
                                تاريخ التسجيل: {formatDate(row.createdAt)}
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
          sx={uiLayout.withUiSx({
            "& .MuiDialog-container": {
              pt: isPhone ? "50px" : isTablet ? "58px" : 0,
              alignItems: isPhone ? "stretch" : "center"
            }
          }, uiLayout.dialogLayoutSx)}
          PaperProps={{
            sx: {
              direction: "rtl",
              textAlign: "start",
              borderRadius: isPhone ? 0 : isTablet ? 2 : 4,
              m: isPhone ? 0 : undefined,
              width: isPhone ? "100vw" : undefined,
              maxHeight: isPhone
                ? "calc(100dvh - 50px)"
                : isTablet
                  ? "90dvh"
                  : undefined
            }
          }}
        >
          <DialogTitle
            sx={{
              fontFamily: "Cairo",
              fontWeight: 900,
              textAlign: "start",
              color: textColor,
              fontSize: isPhone
                ? "0.75rem"
                : isTablet
                  ? "0.8rem"
                  : undefined,
              py: isPhone ? 0.7 : isTablet ? 1 : 2
            }}
          >
            تأكيد طي القيد من المعهد الآخر
          </DialogTitle>

          <DialogContent
            sx={{
              textAlign: "start",
              p: isPhone ? 0.7 : isTablet ? 1 : 2
            }}
          >
            <Typography sx={{ fontFamily: "Cairo", fontWeight: 700, mb: 2 }}>
              هل أنت متأكد أن الطالب لم يعد مسجلاً في المعهد الآخر؟
            </Typography>

            {selectedRow && (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  mb: 2,
                  borderRadius: 3,
                  backgroundColor: "#f7faf9",
                  border: "1px solid #e4eeea",
                  textAlign: "start"
                }}
              >
                <Typography sx={{ fontWeight: 900, textAlign: "start" }}>
                  الطالب: {safeText(selectedRow.studentName)}
                </Typography>
                <Typography sx={{ fontWeight: 800, textAlign: "start" }}>
                  رقم الهوية: {safeText(selectedRow.nationalId)}
                </Typography>
                <Typography sx={{ fontWeight: 800, textAlign: "start" }}>
                  المعهد الآخر: {safeText(selectedRow.otherInstituteName)}
                </Typography>
              </Paper>
            )}

            <TextField InputLabelProps={{ shrink: true }}
              fullWidth
              multiline
              minRows={3}
              label="ملاحظة التحديث"
              placeholder="مثال: تم طي قيده من المعهد الآخر بناءً على الإفادة"
              value={updateNote}
              onChange={(e) => setUpdateNote(e.target.value)}
              sx={uiLayout.withUiSx({
                direction: "rtl",
                "& textarea": {
                  textAlign: "start",
                  fontFamily: "Cairo",
                  fontWeight: 700
                },
                "& .MuiInputLabel-root": {
                  left: 0,
                  right: "auto",
                  transformOrigin: "left"
                }
              }, uiLayout.formFieldSx)}
            />
          </DialogContent>

          <Divider />

          <DialogActions
            sx={uiLayout.withUiSx({
              justifyContent: "flex-start",
              p: isPhone ? 0.5 : isTablet ? 0.75 : 2,
              gap: isPhone ? 0.35 : 0.55
            }, uiLayout.dialogActionsSx)}
          >
            <Button
              onClick={closeConfirm}
              size={isCompact ? "small" : "medium"}
              disabled={!!savingId}
              sx={uiLayout.withUiSx({ fontFamily: "Cairo", fontWeight: 900 }, uiLayout.buttonSx)}
            >
              إلغاء
            </Button>

            <Button
              variant="contained"
              size={isCompact ? "small" : "medium"}
              onClick={markAsNotRegistered}
              disabled={!!savingId}
              startIcon={savingId ? <CircularProgress size={16} /> : <DoneAllIcon />}
              sx={uiLayout.withUiSx({
                fontFamily: "Cairo",
                fontWeight: 900,
                borderRadius: 2,
                backgroundColor: warningColor,
                "&:hover": {
                  backgroundColor: "#c75a00"
                }
              }, uiLayout.buttonSx)}
            >
              تأكيد طي القيد
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box></NavigationShell>
  );
}