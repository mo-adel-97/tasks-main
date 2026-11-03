import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import Swal from "sweetalert2";
import PersonOffRoundedIcon from "@mui/icons-material/PersonOffRounded";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import HowToRegRoundedIcon from "@mui/icons-material/HowToRegRounded";
import { SSTLI_API_URL } from "../config/apiUrls";
import { useNicknames, withNickname } from "../utils/nicknames";

/*
  شاشة "الموظفون غير النشطين":
  كل قوائم الموارد البشرية تعرض النشطين فقط، وغير النشطين (Staut_ = 0) يظهرون هنا،
  ومنها يمكن إعادة تنشيط الموظف.
  أصحاب المسميات المخفية (HR_JobTitle.HideFromEmployeeLists) لا يظهرون هنا أيضاً.
*/

const API_BASE_URL = SSTLI_API_URL;

const primaryColor = "#057546";
const primaryDark = "#034d31";
const accentColor = "#ae1e21";

const COLUMNS = [
  { key: "employeeCode", label: "الكود", width: 70 },
  { key: "fullName", label: "اسم الموظف", width: 220, className: "r" },
  { key: "branchName", label: "الفرع", width: 130 },
  { key: "departmentName", label: "القسم", width: 140 },
  { key: "jobTitle", label: "المسمى الوظيفي", width: 150 },
  { key: "mobile", label: "الجوال", width: 120, className: "ltr" }
];

const getCurrentActor = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return {
      changedByUserGuid: user?.guid || user?.Guid || null,
      changedByName: user?.fullName || user?.FullName || user?.userName || user?.UserName || "مستخدم النظام"
    };
  } catch {
    return { changedByUserGuid: null, changedByName: "مستخدم النظام" };
  }
};

const readJson = async (response, fallback) => {
  const json = await response.json().catch(() => null);
  if (!response.ok) throw new Error(json?.message || json?.error || fallback);
  return json;
};

const norm = (value) => String(value ?? "").trim().toLowerCase();

const HrInactiveEmployeesPage = () => {
  useNicknames();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const accent = isDark ? theme.palette.success.light : primaryColor;
  const border = isDark ? alpha(theme.palette.success.light, 0.25) : "#d7e8df";

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [busyGuid, setBusyGuid] = useState("");
  const deferredSearch = useDeferredValue(search);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/hr/employees?isActive=false`, {
        cache: "no-store",
        headers: { Accept: "application/json" }
      });
      const json = await readJson(response, "تعذر تحميل الموظفين غير النشطين");
      setRows(Array.isArray(json?.data) ? json.data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const q = norm(deferredSearch);
    if (!q) return rows;
    return rows.filter((r) =>
      [r.fullName, r.employeeCode, r.mobile, r.branchName, r.departmentName, r.jobTitle, r.nationalId].some((v) =>
        norm(v).includes(q)
      )
    );
  }, [rows, deferredSearch]);

  const reactivate = async (row) => {
    const confirm = await Swal.fire({
      icon: "question",
      title: "إعادة تنشيط الموظف",
      text: `هل تريد إعادة تنشيط الموظف "${row.fullName}"؟ سيظهر مرة أخرى في جميع قوائم الموارد البشرية.`,
      showCancelButton: true,
      confirmButtonText: "نعم، تنشيط",
      cancelButtonText: "إلغاء",
      confirmButtonColor: primaryColor,
      cancelButtonColor: "#6b7280"
    });
    if (!confirm.isConfirmed) return;

    setBusyGuid(row.employeeGuid);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/hr/employees/${encodeURIComponent(row.employeeGuid)}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ isActive: true, ...getCurrentActor() })
        }
      );
      const json = await readJson(response, "تعذر تنشيط الموظف");
      setRows((current) => current.filter((r) => r.employeeGuid !== row.employeeGuid));
      Swal.fire({
        icon: "success",
        title: json?.message || "تم تنشيط الموظف بنجاح",
        confirmButtonText: "حسنًا",
        confirmButtonColor: primaryColor
      });
    } catch (e) {
      Swal.fire({ icon: "error", title: "خطأ", text: e.message, confirmButtonText: "حسنًا", confirmButtonColor: accentColor });
    } finally {
      setBusyGuid("");
    }
  };

  const panelSx = {
    borderRadius: 3,
    border: `1px solid ${border}`,
    background: theme.palette.background.paper
  };

  const tableSx = {
    overflow: "auto",
    maxHeight: "calc(100dvh - 260px)",
    "& table": { borderCollapse: "separate", borderSpacing: 0, minWidth: "100%", fontSize: 13, color: "text.primary" },
    "& th": {
      position: "sticky",
      top: 0,
      zIndex: 2,
      background: isDark ? theme.palette.background.paper : primaryColor,
      color: isDark ? theme.palette.success.light : "#fff",
      padding: "10px 8px",
      whiteSpace: "nowrap",
      fontWeight: 900,
      borderBottom: `1px solid ${border}`
    },
    "& td": { padding: "7px 8px", borderBottom: `1px solid ${border}`, textAlign: "center", whiteSpace: "nowrap", fontWeight: 600 },
    "& td.r": { textAlign: "right" },
    "& td.ltr": { direction: "ltr" },
    "& tbody tr:nth-of-type(even)": { background: alpha(theme.palette.success.main, isDark ? 0.05 : 0.035) },
    "& tbody tr:hover": { background: alpha(theme.palette.success.main, isDark ? 0.12 : 0.08) }
  };

  return (
    <Box sx={{ direction: "rtl", p: { xs: 1, md: 2 } }}>
      <Paper elevation={0} sx={{ ...panelSx, p: { xs: 1.2, md: 2 }, mb: 1.5 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }} justifyContent="space-between">
          <Stack direction="row" spacing={1.2} alignItems="center">
            <PersonOffRoundedIcon sx={{ color: isDark ? theme.palette.error.light : accentColor, fontSize: 34 }} />
            <Box>
              <Box sx={{ fontWeight: 950, fontSize: "1.2rem", color: accent }}>الموظفون غير النشطين</Box>
              <Typography sx={{ fontWeight: 700, fontSize: "0.8rem", color: "text.secondary" }}>
                الموظفون الموقوفون لا يظهرون في قوائم الموارد البشرية، ويمكن إعادة تنشيطهم من هنا
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <Paper elevation={0} sx={{ ...panelSx, px: 1.5, py: 0.6, textAlign: "center" }}>
              <Typography sx={{ fontSize: 12, fontWeight: 800, color: "text.secondary" }}>العدد</Typography>
              <Box sx={{ fontSize: 20, fontWeight: 950, color: isDark ? theme.palette.error.light : accentColor }}>{rows.length}</Box>
            </Paper>
            <Button
              variant="contained"
              onClick={load}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
              sx={{ fontWeight: 900, color: "#fff", backgroundColor: primaryColor, "&:hover": { backgroundColor: primaryDark } }}
            >
              تحديث
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ ...panelSx, overflow: "hidden" }}>
        <Box sx={{ p: 1.2 }}>
          <TextField
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو الكود أو الفرع أو الجوال..."
            size="small"
            fullWidth
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          />
        </Box>

        <Box sx={{ height: 3 }}>{loading && rows.length > 0 ? <LinearProgress color="success" sx={{ height: 3 }} /> : null}</Box>

        <Box sx={tableSx}>
          <table>
            <thead>
              <tr>
                {COLUMNS.map((c) => (
                  <th key={c.key} style={{ minWidth: c.width }}>{c.label}</th>
                ))}
                <th style={{ width: 130 }} />
              </tr>
            </thead>
            <tbody>
              {loading && rows.length === 0 ? (
                <tr><td colSpan={COLUMNS.length + 1} style={{ padding: 40 }}><CircularProgress size={28} sx={{ color: accent }} /></td></tr>
              ) : error ? (
                <tr><td colSpan={COLUMNS.length + 1} style={{ padding: 30, color: accentColor, fontWeight: 800 }}>{error}</td></tr>
              ) : visible.length === 0 ? (
                <tr><td colSpan={COLUMNS.length + 1} style={{ padding: 30, color: theme.palette.text.secondary, fontWeight: 700 }}>لا يوجد موظفون غير نشطين</td></tr>
              ) : (
                visible.map((r) => (
                  <tr key={r.employeeGuid}>
                    {COLUMNS.map((c) => (
                      <td key={c.key} className={c.className}>{c.key === "fullName" ? withNickname(r.fullName, r.employeeGuid) : r[c.key] ?? ""}</td>
                    ))}
                    <td>
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={busyGuid === r.employeeGuid}
                        onClick={() => reactivate(r)}
                        startIcon={busyGuid === r.employeeGuid ? <CircularProgress size={14} color="inherit" /> : <HowToRegRoundedIcon />}
                        sx={{ fontWeight: 800, borderColor: accent, color: accent, whiteSpace: "nowrap" }}
                      >
                        إعادة تنشيط
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Box>
      </Paper>
    </Box>
  );
};

export default HrInactiveEmployeesPage;
