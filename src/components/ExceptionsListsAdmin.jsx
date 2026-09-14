import * as uiLayout from './common/uiLayout';
import { navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from './NavigationShell';
import React, { useEffect, useMemo, useState } from "react";
import {
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
    <NavigationShell variant="standard" ><Box
      sx={{
        direction: "rtl",
        fontFamily: 'Cairo, Arial, "Noto Kufi Arabic", "Noto Sans Arabic", sans-serif',
        minHeight: "100vh",
        background: "#f8fbfa",
        display: "flex",
      }}
    >
      {/* Sidebar */}
      

      {/* Content */}
      <Box sx={{
        flex: 1,
        width: "100%",
        p: {
          xs: 2,
          md: 3
        },
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
              sx={uiLayout.withUiSx({ borderRadius: 2, fontWeight: 800, whiteSpace: "nowrap" }, uiLayout.buttonSx)}
            >
              تحديث الكل
            </Button>

            <Chip label={`${branches.length} فرع`} color="primary" variant="outlined" size="small" />
          </Box>
        </Box>

        <Grid container spacing={2}>
          {/* Filters */}
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 3, boxShadow: "0 8px 25px rgba(0,0,0,0.06)" }}>
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
                  <Chip label={`إجمالي السجلات: ${totalCount}`} color="primary" />
                  <Chip color="success" label={`حرمان: ${stats.pageGraduated}`} />
                  <Chip color="warning" label={`أرصدة صفرية: ${stats.pageZero}`} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* List */}
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 3, boxShadow: "0 8px 25px rgba(0,0,0,0.06)" }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, textAlign: "start" }}>
                  القائمة (كل الفروع)
                </Typography>

                <TableContainer component={Paper} sx={uiLayout.withUiSx({ borderRadius: 2, overflow: "hidden" }, uiLayout.tableContainerSx)}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800 }}>كود الفرع</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>اسم الفرع</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>رقم الهوية</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>الحالة</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>ملاحظات</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>اطلاع</TableCell>
                        <TableCell sx={{ fontWeight: 800, width: 120 }} align="center">
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
                                backgroundColor: seen ? "rgba(46, 125, 50, 0.06)" : "transparent",
                              }}
                            >
                              <TableCell sx={{ fontWeight: 700, opacity: 0.9 }}>{branchCode}</TableCell>

                              <TableCell sx={{ fontWeight: 600 }}>{branchName}</TableCell>

                              <TableCell sx={{ fontWeight: 700 }}>{x.national_id ?? x.nationalId}</TableCell>

                              <TableCell>
                                <Chip size="small" color={statusColor(x.status)} label={x.status} />
                              </TableCell>

                              <TableCell sx={{ opacity: x.notes ? 1 : 0.5 }}>{x.notes || "—"}</TableCell>

                              <TableCell>
                                {seen ? (
                                  <Chip size="small" color="success" label="تم الاطلاع" />
                                ) : (
                                  <Chip size="small" variant="outlined" label="غير مطّلع" />
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
                                    <IconButton onClick={() => deleteItem(x.id)} color="error" disabled={loading}>
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
                    color="primary"
                    shape="rounded"
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
          <Alert severity={toast.type} variant="filled" onClose={() => setToast((p) => ({ ...p, open: false }))}>
            {toast.msg}
          </Alert>
        </Snackbar>
      </Box>
    </Box></NavigationShell>
  );
}
