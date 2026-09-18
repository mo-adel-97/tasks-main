import * as uiLayout from './common/uiLayout';
import { navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from './NavigationShell';
import React, { useEffect, useMemo, useState } from "react";
import {
  useTheme,
  GlobalStyles,
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Chip,
  IconButton,
  InputAdornment,
  Snackbar,
  Alert,
  Tooltip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  CircularProgress,
  Pagination,
  Menu,
  ListItemIcon,
  ListItemText,
} from "@mui/material";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";



// Backend base
const BASE_URL = "https://filesregsiteration.sstli.com";
const API_URL = `${BASE_URL}/exceptions.php`;
const BRANCHES_API = "https://api1.sstli.com/api/branches/all";

// Admin header key
const ADMIN_KEY = "MOHAMED";

const STATUS = {
  GRADUATED: "حرمان",
  ZERO_BALANCE: "أرصدة صفرية",
};

const statusColor = (status) => {
  if (status === STATUS.GRADUATED) return "success";
  if (status === STATUS.ZERO_BALANCE) return "warning";
  return "default";
};

const toBool = (v) => String(v) === "1" || v === 1 || v === true;

export default function ExceptionsListsAdmin() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const surfaces = theme.palette.surfaces || {};
  const darkCard = surfaces.card || "#13251d";
  const darkSection = surfaces.section || "#172b22";
  const darkNested = surfaces.nested || "#1b3328";
  const darkHover = surfaces.hover || "#214333";

  // user from localStorage
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  // Filters
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("الكل");
  const [filterBranch, setFilterBranch] = useState("الكل");

  // Data
  const [rows, setRows] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // UI
  const [toast, setToast] = useState({ open: false, type: "success", msg: "" });
  const showToast = (type, msg) => setToast({ open: true, type, msg });

  // Actions menu state
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuRow, setMenuRow] = useState(null);

  const openMenu = Boolean(menuAnchor);
  const handleOpenMenu = (e, row) => {
    setMenuAnchor(e.currentTarget);
    setMenuRow(row);
  };
  const handleCloseMenu = () => {
    setMenuAnchor(null);
    setMenuRow(null);
  };

  // Fetch branches
  const fetchBranches = async () => {
    setLoadingBranches(true);
    try {
      const res = await fetch(BRANCHES_API, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("فشل تحميل بيانات الفروع");

      const data = await res.json();
      const activeBranches = Array.isArray(data) ? data.filter((b) => b.status === "نشط") : [];
      setBranches(activeBranches);
    } catch (e) {
      showToast("error", e?.message || "فشل تحميل بيانات الفروع");
      setBranches([]);
    } finally {
      setLoadingBranches(false);
    }
  };

  const getBranchName = (branchGuid) => {
    if (!branchGuid) return "—";
    const branch = branches.find((b) => b.guid === branchGuid);
    return branch ? branch.name : branchGuid;
  };

  const getBranchCode = (branchGuid) => {
    if (!branchGuid) return "—";
    const branch = branches.find((b) => b.guid === branchGuid);
    return branch ? branch.code : "—";
  };

  const fetchListAll = async (opts = {}) => {
    const nextPage = opts.page ?? page;
    const nextSearch = opts.search ?? search;
    const nextStatus = opts.filterStatus ?? filterStatus;
    const nextBranch = opts.filterBranch ?? filterBranch;

    const qs = new URLSearchParams();
    qs.set("action", "list_all");
    qs.set("page", String(nextPage));
    qs.set("pageSize", String(pageSize));
    if (nextSearch?.trim()) qs.set("search", nextSearch.trim());
    if (nextStatus && nextStatus !== "الكل") qs.set("status", nextStatus);

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?${qs.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-ADMIN-KEY": ADMIN_KEY,
        },
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.success) throw new Error(json?.message || "فشل تحميل البيانات");

      let data = json.data || [];

      // branch filter client-side
      if (nextBranch && nextBranch !== "الكل") {
        data = data.filter((item) => (item.branch_guid || item.branchGuid) === nextBranch);
      }

      setRows(data);
      setTotalCount(json.pagination?.total ?? 0);
      setTotalPages(json.pagination?.totalPages ?? 1);
    } catch (e) {
      showToast("error", e?.message || "Server error");
      setRows([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // Admin delete
  const deleteItem = async (id) => {
    if (!id) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?action=delete_admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-ADMIN-KEY": ADMIN_KEY,
        },
        body: JSON.stringify({ id }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.success) throw new Error(json?.message || "فشل الحذف");

      showToast("info", "تم الحذف");
      await fetchListAll({ page });
    } catch (e) {
      showToast("error", e?.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Mark seen/unseen (Admin)
  const markSeen = async (id, isSeen) => {
    if (!id) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?action=mark_seen_admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-ADMIN-KEY": ADMIN_KEY,
        },
        body: JSON.stringify({ id, isSeen: isSeen ? 1 : 0 }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.success) throw new Error(json?.message || "فشل التحديث");

      showToast("success", isSeen ? "تم التحديد كمُطّلع عليه" : "تم إلغاء الاطلاع");

      // update local row directly (بدون refetch كامل لو تحب)
      setRows((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, is_seen: isSeen ? 1 : 0, seen_at: isSeen ? new Date().toISOString() : null }
            : r
        )
      );
    } catch (e) {
      showToast("error", e?.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    fetchBranches();
    fetchListAll({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      fetchListAll({ page: 1 });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterStatus, filterBranch]);

  useEffect(() => {
    fetchListAll({ page });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const stats = useMemo(() => {
    const pageGraduated = rows.filter((x) => x.status === STATUS.GRADUATED).length;
    const pageZero = rows.filter((x) => x.status === STATUS.ZERO_BALANCE).length;

    const branchStats = {};
    rows.forEach((item) => {
      const bg = item.branch_guid || item.branchGuid;
      const bn = getBranchName(bg);
      if (!branchStats[bn]) branchStats[bn] = { total: 0, graduated: 0, zero: 0 };
      branchStats[bn].total++;
      if (item.status === STATUS.GRADUATED) branchStats[bn].graduated++;
      if (item.status === STATUS.ZERO_BALANCE) branchStats[bn].zero++;
    });

    return { pageGraduated, pageZero, branchStats };
  }, [rows, branches]);

  return (
    <NavigationShell variant="standard" >
      <GlobalStyles
        styles={{
          ...(isDark
            ? {
                ".exceptions-admin-dark-root": {
                  backgroundColor: `${theme.palette.background.default} !important`,
                  color: `${theme.palette.text.primary} !important`
                },

                ".exceptions-admin-dark-root .MuiPaper-root, .exceptions-admin-dark-root .MuiCard-root": {
                  backgroundColor: `${darkCard} !important`,
                  backgroundImage: "none !important",
                  color: `${theme.palette.text.primary} !important`,
                  borderColor: "#67C99D !important",
                  boxShadow: "none !important"
                },
                ".exceptions-admin-dark-root .MuiCardContent-root": {
                  color: `${theme.palette.text.primary} !important`
                },

                ".exceptions-admin-dark-root .MuiButton-root, .MuiPopover-paper .MuiButton-root": {
                  background: "transparent !important",
                  backgroundColor: "transparent !important",
                  backgroundImage: "none !important",
                  color: "#9BE0C1 !important",
                  border: "1px solid #67C99D !important",
                  boxShadow: "none !important"
                },
                ".exceptions-admin-dark-root .MuiButton-root:hover, .MuiPopover-paper .MuiButton-root:hover": {
                  background: "transparent !important",
                  color: "#C9F2DF !important",
                  borderColor: "#67C99D !important",
                  boxShadow: "0 0 0 1px rgba(103,201,157,.16) !important"
                },
                ".exceptions-admin-dark-root .MuiButton-root.Mui-disabled": {
                  background: "transparent !important",
                  color: "rgba(155,224,193,.42) !important",
                  borderColor: "rgba(103,201,157,.34) !important"
                },

                ".exceptions-admin-dark-root .MuiIconButton-root": {
                  background: "transparent !important",
                  backgroundColor: "transparent !important",
                  color: "#9BE0C1 !important",
                  border: "1px solid #67C99D !important",
                  boxShadow: "none !important"
                },
                ".exceptions-admin-dark-root .MuiIconButton-root:hover": {
                  background: "transparent !important",
                  color: "#C9F2DF !important"
                },
                ".exceptions-admin-dark-root .MuiIconButton-root.Mui-disabled": {
                  color: "rgba(155,224,193,.42) !important",
                  borderColor: "rgba(103,201,157,.34) !important"
                },

                ".exceptions-admin-dark-root .MuiChip-root": {
                  background: "transparent !important",
                  backgroundColor: "transparent !important",
                  backgroundImage: "none !important",
                  color: "#9BE0C1 !important",
                  border: "1px solid #67C99D !important",
                  boxShadow: "none !important"
                },

                ".exceptions-admin-dark-root .MuiOutlinedInput-root, .MuiPopover-paper .MuiOutlinedInput-root": {
                  background: "transparent !important",
                  backgroundColor: "transparent !important",
                  backgroundImage: "none !important",
                  color: `${theme.palette.text.primary} !important`
                },
                ".exceptions-admin-dark-root .MuiOutlinedInput-notchedOutline, .MuiPopover-paper .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#67C99D !important",
                  borderWidth: "1px !important"
                },
                ".exceptions-admin-dark-root .MuiInputLabel-root, .MuiPopover-paper .MuiInputLabel-root": {
                  color: `${theme.palette.text.secondary} !important`
                },
                ".exceptions-admin-dark-root .MuiInputLabel-root.Mui-focused": {
                  color: "#9BE0C1 !important"
                },
                ".exceptions-admin-dark-root .MuiInputAdornment-root, .exceptions-admin-dark-root .MuiInputAdornment-root .MuiSvgIcon-root, .exceptions-admin-dark-root .MuiSelect-icon": {
                  color: "#9BE0C1 !important"
                },

                ".exceptions-admin-dark-root .MuiTableContainer-root": {
                  backgroundColor: `${darkCard} !important`,
                  backgroundImage: "none !important",
                  border: "1px solid #67C99D !important"
                },
                ".exceptions-admin-dark-root .MuiTableHead-root .MuiTableCell-root": {
                  backgroundColor: `${darkNested} !important`,
                  color: `${theme.palette.text.primary} !important`,
                  borderColor: "#67C99D !important"
                },
                ".exceptions-admin-dark-root .MuiTableBody-root .MuiTableCell-root": {
                  backgroundColor: `${darkCard} !important`,
                  color: `${theme.palette.text.primary} !important`,
                  borderColor: "rgba(103,201,157,.24) !important"
                },
                ".exceptions-admin-dark-root .MuiTableRow-root:hover .MuiTableCell-root": {
                  backgroundColor: `${darkHover} !important`
                },

                ".exceptions-admin-dark-root .MuiPaginationItem-root": {
                  background: "transparent !important",
                  color: "#9BE0C1 !important",
                  border: "1px solid #67C99D !important"
                },
                ".exceptions-admin-dark-root .MuiPaginationItem-root.Mui-selected": {
                  background: "transparent !important",
                  color: "#C9F2DF !important",
                  boxShadow: "inset 0 0 0 1px #67C99D !important"
                },

                ".MuiMenu-paper, .MuiPopover-paper": {
                  backgroundColor: `${darkSection} !important`,
                  backgroundImage: "none !important",
                  color: `${theme.palette.text.primary} !important`,
                  border: "1px solid #67C99D !important"
                },
                ".MuiMenuItem-root": {
                  background: "transparent !important",
                  color: `${theme.palette.text.primary} !important`
                },
                ".MuiMenuItem-root:hover, .MuiMenuItem-root.Mui-selected": {
                  backgroundColor: `${darkHover} !important`
                },
                ".MuiListItemIcon-root": {
                  color: "#9BE0C1 !important"
                },

                ".exceptions-admin-dark-root .MuiAlert-root": {
                  background: "transparent !important",
                  color: `${theme.palette.text.primary} !important`,
                  border: "1px solid #67C99D !important",
                  boxShadow: "none !important"
                },
                ".exceptions-admin-dark-root .MuiAlert-icon, .exceptions-admin-dark-root .MuiCircularProgress-root": {
                  color: "#67C99D !important"
                },
                ".MuiSnackbar-root .MuiAlert-root": {
                  backgroundColor: `${darkSection} !important`,
                  backgroundImage: "none !important",
                  color: `${theme.palette.text.primary} !important`,
                  border: "1px solid #67C99D !important",
                  boxShadow: "none !important"
                }
              }
            : {})
        }}
      />

      <Box
        className="exceptions-admin-dark-root"
        sx={{
          direction: "rtl",
          fontFamily: 'Cairo, Arial, "Noto Kufi Arabic", "Noto Sans Arabic", sans-serif',
          minHeight: "100vh",
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          overflowX: "hidden",
          boxSizing: "border-box",
          background: isDark ? theme.palette.background.default : "#f8fbfa",
          color: isDark ? theme.palette.text.primary : "inherit",
          display: "flex"
        }}
      >
      {/* Sidebar */}
      

      {/* Content */}
      <Box sx={{
        flex: 1,
        width: "100%",
        minWidth: 0,
        maxWidth: "100%",
        p: {
          xs: 2,
          md: 3
        },
        color: isDark ? theme.palette.text.primary : "inherit",
        ...navigationContentSx
      }}>
        {/* Header */}
        <Box
          sx={{
            mb: 2,
            display: "flex",
            alignItems: { xs: "stretch", md: "center" },
            justifyContent: "space-between",
            gap: 2,
            flexDirection: { xs: "column", md: "row" },
          }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, textAlign: "start" }}>
              قوائم الاستثناءات — Admin
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5, textAlign: "start" }}>
              عرض جميع الفروع — المستخدم الحالي: {user?.userName || "—"}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => {
                fetchBranches();
                fetchListAll({ page });
              }}
              disabled={loading || loadingBranches}
              sx={uiLayout.withUiSx({
                borderRadius: 2,
                fontWeight: 800,
                whiteSpace: "nowrap",
                backgroundColor: "transparent",
                color: isDark ? "#9BE0C1" : undefined,
                borderColor: isDark ? "#67C99D" : undefined
              }, uiLayout.buttonSx)}
            >
              تحديث الكل
            </Button>

            <Chip
              label={`${branches.length} فرع`}
              color={isDark ? "default" : "primary"}
              variant="outlined"
              size="small"
              sx={{
                backgroundColor: "transparent",
                color: isDark ? "#9BE0C1" : undefined,
                borderColor: isDark ? "#67C99D" : undefined
              }}
            />
          </Box>
        </Box>

        <Grid container spacing={2}>
          {/* Filters */}
          <Grid item xs={12}>
            <Card
              sx={{
                borderRadius: 2,
                backgroundColor: isDark ? darkCard : undefined,
                border: isDark ? "1px solid #67C99D" : undefined,
                boxShadow: isDark ? "none" : "0 8px 25px rgba(0,0,0,0.06)"
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, textAlign: "start" }}>
                  فلاتر
                </Typography>

                <Box sx={uiLayout.withUiSx({ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }, uiLayout.formGridSx)}>
                  <TextField InputLabelProps={{ shrink: true }}
                    size="small"
                    placeholder="بحث برقم الهوية / الملاحظات / branchGuid"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                    sx={uiLayout.withUiSx({ minWidth: { xs: "100%", sm: 320 } }, uiLayout.formFieldSx)}
                  />

                  <TextField InputLabelProps={{ shrink: true }}
                    size="small"
                    select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    sx={uiLayout.withUiSx({ minWidth: 180 }, uiLayout.formFieldSx)}
                  >
                    <MenuItem value="الكل">الكل</MenuItem>
                    <MenuItem value={STATUS.GRADUATED}>{STATUS.GRADUATED}</MenuItem>
                    <MenuItem value={STATUS.ZERO_BALANCE}>{STATUS.ZERO_BALANCE}</MenuItem>
                  </TextField>

                  <TextField InputLabelProps={{ shrink: true }}
                    size="small"
                    select
                    value={filterBranch}
                    onChange={(e) => setFilterBranch(e.target.value)}
                    disabled={loadingBranches || branches.length === 0}
                    sx={uiLayout.withUiSx({ minWidth: 260 }, uiLayout.formFieldSx)}
                  >
                    <MenuItem value="الكل">كل الفروع</MenuItem>
                    {loadingBranches ? (
                      <MenuItem disabled>جاري تحميل الفروع...</MenuItem>
                    ) : (
                      branches.map((b) => (
                        <MenuItem key={b.guid} value={b.guid}>
                          {b.code} - {b.name}
                        </MenuItem>
                      ))
                    )}
                  </TextField>
                </Box>

                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                  <Chip
                    label={`إجمالي السجلات: ${totalCount}`}
                    color={isDark ? "default" : "primary"}
                    variant={isDark ? "outlined" : "filled"}
                    sx={{
                      backgroundColor: isDark ? "transparent" : undefined,
                      color: isDark ? "#9BE0C1" : undefined,
                      borderColor: isDark ? "#67C99D" : undefined
                    }}
                  />
                  <Chip
                    color={isDark ? "default" : "success"}
                    variant={isDark ? "outlined" : "filled"}
                    label={`حرمان: ${stats.pageGraduated}`}
                    sx={{
                      backgroundColor: isDark ? "transparent" : undefined,
                      color: isDark ? "#9BE0C1" : undefined,
                      borderColor: isDark ? "#67C99D" : undefined
                    }}
                  />
                  <Chip
                    color={isDark ? "default" : "warning"}
                    variant={isDark ? "outlined" : "filled"}
                    label={`أرصدة صفرية: ${stats.pageZero}`}
                    sx={{
                      backgroundColor: isDark ? "transparent" : undefined,
                      color: isDark ? "#9BE0C1" : undefined,
                      borderColor: isDark ? "#67C99D" : undefined
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* List */}
          <Grid item xs={12}>
            <Card
              sx={{
                borderRadius: 2,
                backgroundColor: isDark ? darkCard : undefined,
                border: isDark ? "1px solid #67C99D" : undefined,
                boxShadow: isDark ? "none" : "0 8px 25px rgba(0,0,0,0.06)"
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, textAlign: "start" }}>
                  القائمة (كل الفروع)
                </Typography>

                <TableContainer
                  component={Paper}
                  sx={uiLayout.withUiSx({
                    borderRadius: 2,
                    overflowX: "auto",
                    overflowY: "hidden",
                    backgroundColor: isDark ? darkCard : undefined,
                    border: isDark ? "1px solid #67C99D" : undefined,
                    boxShadow: "none"
                  }, uiLayout.tableContainerSx)}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800, backgroundColor: isDark ? darkNested : undefined }}>كود الفرع</TableCell>
                        <TableCell sx={{ fontWeight: 800, backgroundColor: isDark ? darkNested : undefined }}>اسم الفرع</TableCell>
                        <TableCell sx={{ fontWeight: 800, backgroundColor: isDark ? darkNested : undefined }}>رقم الهوية</TableCell>
                        <TableCell sx={{ fontWeight: 800, backgroundColor: isDark ? darkNested : undefined }}>الحالة</TableCell>
                        <TableCell sx={{ fontWeight: 800, backgroundColor: isDark ? darkNested : undefined }}>ملاحظات</TableCell>
                        <TableCell sx={{ fontWeight: 800, backgroundColor: isDark ? darkNested : undefined }}>اطلاع</TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 800,
                            width: 120,
                            backgroundColor: isDark ? darkNested : undefined
                          }}
                          align="center"
                        >
                          الإجراءات
                        </TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={7} sx={{ py: 5, textAlign: "center" }}>
                            <CircularProgress size={26} />
                            <Typography sx={{ mt: 1, opacity: 0.7 }}>جاري التحميل...</Typography>
                          </TableCell>
                        </TableRow>
                      ) : rows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} sx={{ py: 4, textAlign: "center", opacity: 0.7 }}>
                            لا يوجد بيانات لعرضها
                          </TableCell>
                        </TableRow>
                      ) : (
                        rows.map((x) => {
                          const bg = x.branch_guid || x.branchGuid;
                          const branchName = getBranchName(bg);
                          const branchCode = getBranchCode(bg);
                          const seen = toBool(x.is_seen);

                          return (
                            <TableRow
                              key={x.id}
                              hover
                              sx={{
                                backgroundColor: isDark
                                  ? darkCard
                                  : seen
                                    ? "rgba(46, 125, 50, 0.06)"
                                    : "transparent",
                                "&:hover": {
                                  backgroundColor: isDark
                                    ? darkHover
                                    : undefined
                                },
                              }}
                            >
                              <TableCell sx={{ fontWeight: 700, opacity: 0.9 }}>{branchCode}</TableCell>

                              <TableCell sx={{ fontWeight: 600 }}>{branchName}</TableCell>

                              <TableCell sx={{ fontWeight: 700 }}>{x.national_id ?? x.nationalId}</TableCell>

                              <TableCell>
                                <Chip
                                  size="small"
                                  color={isDark ? "default" : statusColor(x.status)}
                                  variant={isDark ? "outlined" : "filled"}
                                  label={x.status}
                                  sx={{
                                    backgroundColor: isDark ? "transparent" : undefined,
                                    color: isDark ? "#9BE0C1" : undefined,
                                    borderColor: isDark ? "#67C99D" : undefined
                                  }}
                                />
                              </TableCell>

                              <TableCell sx={{ opacity: x.notes ? 1 : 0.5 }}>{x.notes || "—"}</TableCell>

                              <TableCell>
                                {seen ? (
                                  <Chip
                                    size="small"
                                    color={isDark ? "default" : "success"}
                                    variant={isDark ? "outlined" : "filled"}
                                    label="تم الاطلاع"
                                    sx={{
                                      backgroundColor: isDark ? "transparent" : undefined,
                                      color: isDark ? "#9BE0C1" : undefined,
                                      borderColor: isDark ? "#67C99D" : undefined
                                    }}
                                  />
                                ) : (
                                  <Chip
                                    size="small"
                                    variant="outlined"
                                    label="غير مطّلع"
                                    sx={{
                                      backgroundColor: "transparent",
                                      color: isDark ? "#9BE0C1" : undefined,
                                      borderColor: isDark ? "#67C99D" : undefined
                                    }}
                                  />
                                )}
                              </TableCell>

                              <TableCell align="center">
                                <Tooltip title="إجراءات" arrow>
                                  <IconButton onClick={(e) => handleOpenMenu(e, x)} disabled={loading}>
                                    <MoreVertIcon />
                                  </IconButton>
                                </Tooltip>

                                <Tooltip title="حذف (Admin)" arrow>
                                  <span>
                                    <IconButton
                                      onClick={() => deleteItem(x.id)}
                                      color={isDark ? "default" : "error"}
                                      disabled={loading}
                                      sx={{
                                        color: isDark ? "#9BE0C1" : undefined,
                                        borderColor: isDark ? "#67C99D" : undefined,
                                        backgroundColor: "transparent"
                                      }}
                                    >
                                      <DeleteOutlineIcon />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Pagination */}
                <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                  <Typography variant="body2" sx={{ opacity: 0.75 }}>
                    صفحة {page} من {totalPages} — إجمالي {totalCount} سجل
                  </Typography>

                  <Pagination
                    count={Math.max(1, totalPages)}
                    page={page}
                    onChange={(_, v) => setPage(v)}
                    color={isDark ? "standard" : "primary"}
                    shape="rounded"
                    sx={{
                      "& .MuiPaginationItem-root": {
                        backgroundColor: "transparent",
                        color: isDark ? "#9BE0C1" : undefined,
                        border: isDark ? "1px solid #67C99D" : undefined
                      },
                      "& .MuiPaginationItem-root.Mui-selected": {
                        backgroundColor: isDark ? "transparent" : undefined,
                        color: isDark ? "#C9F2DF" : undefined
                      }
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Actions Menu */}
        <Menu anchorEl={menuAnchor} open={openMenu} onClose={handleCloseMenu}>
          <MenuItem
            onClick={() => {
              const seen = toBool(menuRow?.is_seen);
              markSeen(menuRow?.id, !seen);
              handleCloseMenu();
            }}
          >
            <ListItemIcon>
              {toBool(menuRow?.is_seen) ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
            </ListItemIcon>
            <ListItemText
              primary={toBool(menuRow?.is_seen) ? "إلغاء تم الاطلاع" : "تحديد تم الاطلاع"}
            />
          </MenuItem>
        </Menu>

        <Snackbar
          open={toast.open}
          autoHideDuration={2500}
          onClose={() => setToast((p) => ({ ...p, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            severity={toast.type}
            variant={isDark ? "outlined" : "filled"}
            onClose={() => setToast((p) => ({ ...p, open: false }))}
            sx={{
              backgroundColor: isDark ? darkSection : undefined,
              color: isDark ? theme.palette.text.primary : undefined,
              borderColor: isDark ? "#67C99D" : undefined
            }}
          >
            {toast.msg}
          </Alert>
        </Snackbar>
      </Box>
    </Box></NavigationShell>
  );
}
