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
  Divider,
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
  Switch,
  FormControlLabel,
} from "@mui/material";

import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SearchIcon from "@mui/icons-material/Search";
import NumbersIcon from "@mui/icons-material/Numbers";
import NotesIcon from "@mui/icons-material/Notes";
import RefreshIcon from "@mui/icons-material/Refresh";



// ✅ Backend base URL
const BASE_URL = "https://filesregsiteration.sstli.com";
// ✅ PHP file endpoint (غيّره لو في فولدر)
const API_URL = `${BASE_URL}/exceptions.php`;

// ✅ لو هتستخدم عرض كل الفروع (list_all) لازم يكون نفس المفتاح اللي حاطه في PHP
// لو مش عايزه، سيبه فاضي وخلاص السويتش هيتقفل
const ADMIN_KEY = "CHANGE_ME_TO_SOMETHING_STRONG";

const STATUS = {
  GRADUATED: "حرمان",
  ZERO_BALANCE: "أرصدة صفرية",
};

const statusColor = (status) => {
  if (status === STATUS.GRADUATED) return "success";
  if (status === STATUS.ZERO_BALANCE) return "warning";
  return "default";
};

const normalizeNationalId = (val) => (val || "").replace(/\D/g, "").trim();

export default function ExceptionsLists() {
  // ✅ user + branchGuid من localStorage
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const branchGuid = user?.branchForWork || "";
  const isAdmin = [0, 1, 2, 3].includes(user?.userJop);

  // ✅ وضع عرض كل الفروع (Admin فقط)
  const [showAllBranches, setShowAllBranches] = useState(false);

  // Form
  const [nationalId, setNationalId] = useState("");
  const [status, setStatus] = useState(STATUS.GRADUATED);
  const [notes, setNotes] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("الكل");

  // Data
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // Pagination from API
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // UI
  const [toast, setToast] = useState({ open: false, type: "success", msg: "" });
  const showToast = (type, msg) => setToast({ open: true, type, msg });

  const validate = () => {
    const id = normalizeNationalId(nationalId);
    if (!id) return "رقم الهوية مطلوب";
    if (id.length !== 10) return "رقم الهوية لازم يكون 10 أرقام";
    if (!status) return "اختار الحالة";
    if (!branchGuid && !showAllBranches) return "BranchGuid مش موجود للمستخدم الحالي";
    return null;
  };

  // =========================
  // API CALLS
  // =========================
  const fetchList = async (opts = {}) => {
    const nextPage = opts.page ?? page;
    const nextSearch = opts.search ?? search;
    const nextStatus = opts.filterStatus ?? filterStatus;
    const nextAll = opts.showAllBranches ?? showAllBranches;

    if (!branchGuid && !nextAll) {
      showToast("error", "BranchGuid مش موجود للمستخدم الحالي");
      setRows([]);
      setTotalCount(0);
      setTotalPages(1);
      return;
    }

    const qs = new URLSearchParams();
    qs.set("action", nextAll ? "list_all" : "list");
    qs.set("page", String(nextPage));
    qs.set("pageSize", String(pageSize));

    if (!nextAll) qs.set("branchGuid", branchGuid);

    if (nextSearch?.trim()) qs.set("search", nextSearch.trim());
    if (nextStatus && nextStatus !== "الكل") qs.set("status", nextStatus);

    setLoading(true);

    const controller = new AbortController();
    const signal = controller.signal;

    try {
      const res = await fetch(`${API_URL}?${qs.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(nextAll && ADMIN_KEY ? { "X-ADMIN-KEY": ADMIN_KEY } : {}),
        },
        signal,
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "فشل تحميل البيانات");
      }

      setRows(json.data || []);
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

    return () => controller.abort();
  };

  const createItem = async () => {
    const err = validate();
    if (err) {
      showToast("error", err);
      return;
    }

    if (!branchGuid) {
      showToast("error", "BranchGuid مش موجود للمستخدم الحالي");
      return;
    }

    const payload = {
      branchGuid,
      nationalId: normalizeNationalId(nationalId),
      status,
      notes: notes.trim(),
    };

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?action=create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "فشل الإضافة");
      }

      showToast("success", "تمت الإضافة بنجاح");
      setNationalId("");
      setStatus(STATUS.GRADUATED);
      setNotes("");

      setShowAllBranches(false); // الإدخال على فرع المستخدم فقط
      setPage(1);
      await fetchList({ page: 1, showAllBranches: false });
    } catch (e) {
      showToast("error", e?.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id) => {
    if (!id) return;

    // ✅ أمان: ما تمسحش من وضع كل الفروع (عشان مش محدد فرع)
    if (showAllBranches) {
      showToast("error", "الحذف غير مسموح في وضع كل الفروع");
      return;
    }

    if (!branchGuid) {
      showToast("error", "BranchGuid مش موجود للمستخدم الحالي");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?action=delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, branchGuid }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "فشل الحذف");
      }

      showToast("info", "تم الحذف");
      await fetchList({ page, showAllBranches: false });
    } catch (e) {
      showToast("error", e?.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // Effects
  // =========================
  useEffect(() => {
    fetchList({ page: 1, showAllBranches: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // لما المستخدم يغير الفلتر/السيرش: نرجع page=1 ونحمل
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      fetchList({ page: 1 });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterStatus, showAllBranches]);

  // لما page تتغير: حمل الصفحة
  useEffect(() => {
    fetchList({ page });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // =========================
  // Stats (local from current page + totalCount from API)
  // =========================
  const stats = useMemo(() => {
    const pageGraduated = rows.filter((x) => x.status === STATUS.GRADUATED).length;
    const pageZero = rows.filter((x) => x.status === STATUS.ZERO_BALANCE).length;
    return { pageGraduated, pageZero };
  }, [rows]);

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
      {/* Sidebar Left */}
      

      {/* Content */}
      <Box
        sx={{
          flex: 1,
          width: "100%",
          p: {
            xs: 2,
            md: 3
          },
          ...navigationContentSx
        }}
      >
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
              قوائم الاستثناءات
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5, textAlign: "start" }}>
              البيانات حسب فرع المستخدم الحالي (BranchGuid). {branchGuid ? `(${branchGuid})` : ""}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
            {isAdmin && ADMIN_KEY && (
              <FormControlLabel
                sx={{ m: 0 }}
                control={
                  <Switch
                    checked={showAllBranches}
                    onChange={(e) => {
                      setShowAllBranches(e.target.checked);
                      setPage(1);
                    }}
                  />
                }
                label="عرض كل الفروع"
              />
            )}

            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => fetchList({ page })}
              disabled={loading}
              sx={{ borderRadius: 2, fontWeight: 800, whiteSpace: "nowrap" }}
            >
              تحديث
            </Button>
          </Box>
        </Box>

        <Grid container spacing={2}>
          {/* Form */}
          <Grid item xs={12} md={5}>
            <Card sx={{ borderRadius: 3, boxShadow: "0 8px 25px rgba(0,0,0,0.06)" }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, textAlign: "start" }}>
                  إضافة استثناء
                </Typography>

                <TextField
                  fullWidth
                  label="رقم الهوية"
                  value={nationalId}
                  onChange={(e) => setNationalId(normalizeNationalId(e.target.value))}
                  inputProps={{ maxLength: 10 , dir: "ltr" , style: { direction: "ltr", unicodeBidi: "isolate" } }}
                  placeholder="10 أرقام"
                  margin="normal"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <NumbersIcon />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  select
                  label="الحالة"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  margin="normal"
                >
                  <MenuItem value={STATUS.GRADUATED}>{STATUS.GRADUATED}</MenuItem>
                  <MenuItem value={STATUS.ZERO_BALANCE}>{STATUS.ZERO_BALANCE}</MenuItem>
                </TextField>

                <TextField
                  fullWidth
                  label="ملاحظات (اختياري)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  margin="normal"
                  multiline
                  minRows={2}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <NotesIcon />
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  fullWidth
                  variant="contained"
                  onClick={createItem}
                  startIcon={<AddCircleOutlineIcon />}
                  disabled={loading || showAllBranches} // ما تضيفش وانت في وضع كل الفروع
                  sx={{ mt: 2, borderRadius: 2, py: 1.2, fontWeight: 800 }}
                >
                  إضافة
                </Button>

                {showAllBranches && (
                  <Typography sx={{ mt: 1, fontSize: 12, opacity: 0.75 }}>
                    الإضافة متاحة في وضع “فرعي فقط” — اقفل “عرض كل الفروع”.
                  </Typography>
                )}

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Chip label={`الإجمالي: ${totalCount}`} />
                  <Chip color="success" label={`في الصفحة (حرمان): ${stats.pageGraduated}`} />
                  <Chip color="warning" label={`في الصفحة (أرصدة صفرية): ${stats.pageZero}`} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* List */}
          <Grid item xs={12} md={7}>
            <Card sx={{ borderRadius: 3, boxShadow: "0 8px 25px rgba(0,0,0,0.06)" }}>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: { xs: "stretch", md: "center" },
                    justifyContent: "space-between",
                    gap: 1.5,
                    flexDirection: { xs: "column", md: "row" },
                    mb: 2,
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 800, textAlign: "start" }}>
                    القائمة
                  </Typography>

                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <TextField
                      size="small"
                      placeholder="بحث برقم الهوية أو الملاحظات"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        ),
                      }}
                    />

                    <TextField
                      size="small"
                      select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      sx={{ minWidth: 160 }}
                    >
                      <MenuItem value="الكل">الكل</MenuItem>
                      <MenuItem value={STATUS.GRADUATED}>{STATUS.GRADUATED}</MenuItem>
                      <MenuItem value={STATUS.ZERO_BALANCE}>{STATUS.ZERO_BALANCE}</MenuItem>
                    </TextField>
                  </Box>
                </Box>

                <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: "hidden" }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {showAllBranches && <TableCell sx={{ fontWeight: 800 }}>Branch</TableCell>}
                        <TableCell sx={{ fontWeight: 800 }}>رقم الهوية</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>الحالة</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>ملاحظات</TableCell>
                        <TableCell sx={{ fontWeight: 800, width: 90 }} align="center">
                          إجراء
                        </TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={showAllBranches ? 5 : 4} sx={{ py: 5, textAlign: "center" }}>
                            <CircularProgress size={26} />
                            <Typography sx={{ mt: 1, opacity: 0.7 }}>جاري التحميل...</Typography>
                          </TableCell>
                        </TableRow>
                      ) : rows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={showAllBranches ? 5 : 4} sx={{ py: 4, textAlign: "center", opacity: 0.7 }}>
                            لا يوجد بيانات لعرضها
                          </TableCell>
                        </TableRow>
                      ) : (
                        rows.map((x) => (
                          <TableRow key={x.id} hover>
                            {showAllBranches && (
                              <TableCell sx={{ fontWeight: 600, opacity: 0.85 }}>
                                <bdi dir="ltr">{x.branch_guid || "—"}</bdi>
                              </TableCell>
                            )}

                            <TableCell sx={{ fontWeight: 700 }}>{x.national_id ?? x.nationalId}</TableCell>
                            <TableCell>
                              <Chip size="small" color={statusColor(x.status)} label={x.status} />
                            </TableCell>
                            <TableCell sx={{ opacity: x.notes ? 1 : 0.5 }}>{x.notes || "—"}</TableCell>

                            <TableCell align="center">
                              <Tooltip title={showAllBranches ? "الحذف مقفول في وضع كل الفروع" : "حذف"} arrow>
                                <span>
                                  <IconButton
                                    onClick={() => deleteItem(x.id)}
                                    color="error"
                                    disabled={loading || showAllBranches}
                                  >
                                    <DeleteOutlineIcon />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Pagination */}
                <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                  <Typography variant="body2" sx={{ opacity: 0.75 }}>
                    صفحة {page} من {totalPages} — إجمالي {totalCount}
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

        <Snackbar
          open={toast.open}
          autoHideDuration={2500}
          onClose={() => setToast((p) => ({ ...p, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            severity={toast.type}
            variant="filled"
            onClose={() => setToast((p) => ({ ...p, open: false }))}
          >
            {toast.msg}
          </Alert>
        </Snackbar>
      </Box>
    </Box></NavigationShell>
  );
}
