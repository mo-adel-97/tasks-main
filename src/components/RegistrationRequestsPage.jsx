import * as uiLayout from './common/uiLayout';
import { DESKTOP_BREAKPOINT, navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from './NavigationShell';
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  AppBar,
  Box,
  Button,
  CircularProgress,
  GlobalStyles,
  IconButton,
  Paper,
  Stack,
  TextField,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import RefreshIcon from "@mui/icons-material/Refresh";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";




const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5258";
const today = () => new Date().toISOString().slice(0, 10);

const exportCsv = (rows, fileName) => {
  const quote = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const headers = ["اسم المتدرب", "رقم الجوال", "رقم الهوية", "الدبلوم/الدورة", "المدينة"];
  const lines = [
    headers.map(quote).join(","),
    ...rows.map((row) =>
      [row.name, row.phoneNumber, row.nationalIdNumber, row.diploma, row.city]
        .map(quote)
        .join(",")
    )
  ];

  const blob = new Blob(["\uFEFF", lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const shortName = (name) => {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 2) return parts.join(" ");
  return `${parts[0]} ${parts[parts.length - 1]}`;
};

const RegistrationRequestsPage = ({ mode, title, subtitle, exportFileName }) => {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery("(min-width:600px) and (max-width:1599px)");
  const isDesktop = useMediaQuery(`(min-width:${DESKTOP_BREAKPOINT}px)`, { noSsr: true });
  const isCompact = isPhone || isTablet;

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (isDesktop) setMobileSidebarOpen(false);
  }, [isDesktop]);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const userGuid = String(user?.guid || user?.Guid || "").trim();
  const [fromDate, setFromDate] = useState(today());
  const [toDate, setToDate] = useState(today());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    if (!userGuid) return setError("بيانات المستخدم غير موجودة");
    if (!fromDate || !toDate) return setError("برجاء تحديد تاريخ البداية والنهاية");
    if (fromDate > toDate) return setError("تاريخ البداية يجب ألا يتجاوز تاريخ النهاية");

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({ userGuid, mode, fromDate, toDate });
      const response = await fetch(`${API_BASE_URL}/api/registration-requests?${params.toString()}`, {
        headers: { Accept: "application/json" }
      });

      const raw = await response.text();
      const result = raw ? JSON.parse(raw) : {};
      if (!response.ok) throw new Error(result?.message || "تعذر تحميل البيانات");
      setRows(Array.isArray(result?.data?.rows) ? result.data.rows : []);
    } catch (ex) {
      setRows([]);
      setError(ex?.message || "حدث خطأ أثناء تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <NavigationShell variant="standard" mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)}><Box sx={{ minHeight: "100dvh", width: "100%", maxWidth: "100vw", overflowX: "hidden", background: "#f5f8f7", direction: "rtl" }}>
      {!isDesktop && (
        <GlobalStyles
          styles={{
            ".MuiDrawer-root": { zIndex: "2100 !important" },
            ".MuiDrawer-root .MuiBackdrop-root": { zIndex: "2099 !important" },
            ".MuiDrawer-root .MuiDrawer-paper": { zIndex: "2101 !important" }
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
            color: "#17372b",
            borderBottom: "1px solid rgba(5,117,70,.12)",
            direction: "rtl"
          }}
        >
          <Toolbar
            sx={{
              direction: "rtl",
              minHeight: { xs: "50px !important", sm: "56px !important" },
              px: { xs: 0.75, sm: 1 },
              gap: { xs: 0.7, sm: 0.9 }
            }}
          >
            <IconButton
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setMobileSidebarOpen((current) => !current);
              }}
              aria-label={mobileSidebarOpen ? "إغلاق القائمة" : "فتح القائمة"}
              aria-expanded={mobileSidebarOpen}
              sx={{
                width: { xs: 36, sm: 40 },
                height: { xs: 36, sm: 40 },
                flexShrink: 0,
                color: "#fff",
                background: "linear-gradient(135deg,#057546,#034d31)",
                boxShadow: "0 5px 14px rgba(5,117,70,.20)",
                "&:hover": { background: "linear-gradient(135deg,#034d31,#057546)" }
              }}
            >
              <MenuRoundedIcon sx={{ fontSize: { xs: 20, sm: 22 } }} />
            </IconButton>

            <Typography
              sx={{
                flex: 1,
                fontFamily: "Cairo",
                fontWeight: 900,
                fontSize: { xs: "0.75rem", sm: "0.8rem" },
                color: "#17372b",
                textAlign: "start",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              {title}
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
            xs: "50px",
            sm: "56px"
          },
          p: {
            xs: 0.55,
            sm: 0.8,
            md: 1
          },
          boxSizing: "border-box",
          direction: "rtl",
          overflowX: "hidden",
          [`@media (min-width:${DESKTOP_BREAKPOINT}px)`]: {
            mt: 0,
            p: 3
          },
          ...navigationContentSx
        }}
      >
        <Paper
          elevation={0}
          sx={{
            borderRadius: isPhone ? 1.6 : isTablet ? 2.1 : 4,
            border: "1px solid rgba(5,117,70,.13)",
            overflow: "hidden"
          }}
        >
          <Box
            sx={{
              p: isPhone ? 0.7 : isTablet ? 1 : 3,
              background: "linear-gradient(135deg,#fff,#edf8f3)",
              borderBottom: "1px solid rgba(5,117,70,.12)"
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontFamily: "Cairo",
                fontWeight: 900,
                color: "#034d31",
                fontSize: isPhone ? "0.76rem" : isTablet ? "0.94rem" : undefined
              }}
            >
              {title}
            </Typography>

            <Typography
              sx={{
                mt: isPhone ? 0.2 : 0.5,
                fontFamily: "Cairo",
                color: "#60756d",
                fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
                display: isPhone ? "none" : "block"
              }}
            >
              {subtitle}
            </Typography>
          </Box>

          <Box sx={{ p: isPhone ? 0.65 : isTablet ? 0.9 : 3 }}>
            <Box
              sx={uiLayout.withUiSx({
                display: "grid",
                gridTemplateColumns: isCompact ? "repeat(2,minmax(0,1fr))" : "auto auto auto auto auto 1fr auto",
                gap: isPhone ? 0.55 : isTablet ? 0.75 : 1.5,
                mb: isPhone ? 0.8 : isTablet ? 1 : 2.5,
                alignItems: "center",
                "& .MuiInputLabel-root": {
                  fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
                  fontFamily: "Cairo"
                },
                "& .MuiInputBase-input": {
                  fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
                  py: isPhone ? 0.55 : isTablet ? 0.65 : undefined
                },
                "& .MuiOutlinedInput-root": {
                  minHeight: isPhone ? 32 : isTablet ? 35 : undefined,
                  borderRadius: isCompact ? 1.2 : undefined
                },
                "& .MuiButton-root": {
                  minHeight: isPhone ? 31 : isTablet ? 34 : undefined,
                  fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
                  px: isPhone ? 0.65 : isTablet ? 0.9 : undefined
                }
              }, uiLayout.filterBarSx)}
            >
              <TextField sx={uiLayout.formFieldSx} type="date" label="من تاريخ" value={fromDate} onChange={(e) => setFromDate(e.target.value)} InputLabelProps={{ shrink: true }} size="small" fullWidth  inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
              <TextField sx={uiLayout.formFieldSx} type="date" label="إلى تاريخ" value={toDate} onChange={(e) => setToDate(e.target.value)} InputLabelProps={{ shrink: true }} size="small" fullWidth  inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

              <Button variant="contained" startIcon={<SearchIcon />} onClick={loadData} disabled={loading} sx={uiLayout.withUiSx({ fontFamily: "Cairo", fontWeight: 800, background: "#057546" }, uiLayout.buttonSx)}>
                عرض
              </Button>

              <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData} disabled={loading} sx={uiLayout.withUiSx({ fontFamily: "Cairo", fontWeight: 800 }, uiLayout.buttonSx)}>
                تحديث
              </Button>

              <Button
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={() => exportCsv(rows, exportFileName)}
                disabled={loading || rows.length === 0}
                sx={uiLayout.withUiSx({
                  fontFamily: "Cairo",
                  fontWeight: 800,
                  color: "#ae1e21",
                  borderColor: "#ae1e21",
                  gridColumn: isCompact ? "1 / -1" : undefined
                }, uiLayout.buttonSx)}
              >
                تصدير Excel
              </Button>

              {!isCompact && <Box sx={{ flexGrow: 1 }} />}

              <Box
                sx={{
                  px: isPhone ? 0.65 : isTablet ? 0.9 : 2,
                  py: isPhone ? 0.55 : isTablet ? 0.7 : 1,
                  borderRadius: isCompact ? 1.2 : 2,
                  background: "#edf8f3",
                  color: "#034d31",
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
                  textAlign: "center",
                  gridColumn: isCompact ? "1 / -1" : undefined
                }}
              >
                العدد: {rows.length}
              </Box>
            </Box>

            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: isPhone ? 0.65 : 2,
                  fontFamily: "Cairo",
                  fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
                  py: isPhone ? 0.25 : undefined
                }}
              >
                {error}
              </Alert>
            )}

            <Box
              sx={{
                border: "1px solid rgba(5,117,70,.13)",
                borderRadius: isCompact ? 1.4 : 3,
                overflow: "hidden",
                minHeight: isPhone ? 340 : isTablet ? 380 : 360
              }}
            >
              {loading ? (
                <Box sx={{ minHeight: isPhone ? 340 : isTablet ? 380 : 360, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CircularProgress size={isPhone ? 28 : isTablet ? 34 : 40} />
                </Box>
              ) : isCompact ? (
                <Box sx={{ display: "grid", gap: isPhone ? 0.45 : 0.65, p: isPhone ? 0.45 : 0.65 }}>
                  {rows.length === 0 ? (
                    <Box sx={{ minHeight: 300, display: "grid", placeItems: "center", fontFamily: "Cairo", color: "#60756d", fontSize: isPhone ? "0.75rem" : "0.75rem" }}>
                      لا توجد بيانات خلال الفترة المحددة
                    </Box>
                  ) : (
                    rows.map((row, index) => (
                      <Paper
                        key={`${row.nationalIdNumber}-${index}`}
                        variant="outlined"
                        sx={{
                          p: isPhone ? 0.6 : 0.8,
                          borderRadius: isPhone ? 1.2 : 1.5,
                          borderColor: "rgba(5,117,70,.12)",
                          background: index % 2 === 0 ? "#fff" : "#fbfdfc"
                        }}
                      >
                        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", columnGap: isPhone ? 0.55 : 0.75, rowGap: isPhone ? 0.5 : 0.65 }}>
                          {[
                            ["المتدرب", shortName(row.name) || "-"],
                            ["الهوية", row.nationalIdNumber || "-"],
                            ["الجوال", row.phoneNumber || "-"],
                            ["المدينة", row.city || "-"]
                          ].map(([label, value]) => (
                            <Box key={label}>
                              <Typography sx={{ fontFamily: "Cairo", fontSize: isPhone ? "0.75rem" : "0.75rem", color: "#7a8b84" }}>{label}</Typography>
                              <Typography sx={{ fontFamily: "Cairo", fontWeight: 900, fontSize: isPhone ? "0.75rem" : "0.75rem", color: "#1f2d3d" }}>{value}</Typography>
                            </Box>
                          ))}

                          <Box sx={{ gridColumn: "1 / -1", pt: 0.2 }}>
                            <Typography sx={{ fontFamily: "Cairo", fontSize: isPhone ? "0.75rem" : "0.75rem", color: "#7a8b84" }}>الدبلوم / الدورة</Typography>
                            <Typography sx={{ fontFamily: "Cairo", fontWeight: 900, fontSize: isPhone ? "0.75rem" : "0.75rem", color: "#057546" }}>{row.diploma || "-"}</Typography>
                          </Box>
                        </Box>
                      </Paper>
                    ))
                  )}
                </Box>
              ) : (
                <Box
                  component="table"
                  sx={{
                    width: "100%",
                    minWidth: 850,
                    borderCollapse: "collapse",
                    direction: "rtl",
                    "& th": { p: 1.5, background: "#057546", color: "#fff", fontFamily: "Cairo", fontWeight: 900, textAlign: "start" },
                    "& td": { p: 1.35, borderBottom: "1px solid rgba(5,117,70,.09)", fontFamily: "Cairo", textAlign: "start" },
                    "& tbody tr:hover": { background: "#f1faf6" }
                  }}
                >
                  <thead>
                    <tr>
                      <th>اسم المتدرب</th>
                      <th>رقم الجوال</th>
                      <th>رقم الهوية</th>
                      <th>الدبلوم/الدورة</th>
                      <th>المدينة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr><td colSpan={5}>لا توجد بيانات خلال الفترة المحددة</td></tr>
                    ) : rows.map((row, index) => (
                      <tr key={`${row.nationalIdNumber}-${index}`}>
                        <td>{row.name || "-"}</td>
                        <td><bdi dir="ltr">{row.phoneNumber || "-"}</bdi></td>
                        <td><bdi dir="ltr">{row.nationalIdNumber || "-"}</bdi></td>
                        <td>{row.diploma || "-"}</td>
                        <td>{row.city || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </Box>
              )}
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box></NavigationShell>
  );
};

export default RegistrationRequestsPage;
