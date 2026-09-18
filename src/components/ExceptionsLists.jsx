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
  useTheme,
} from "@mui/material";

import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SearchIcon from "@mui/icons-material/Search";
import NumbersIcon from "@mui/icons-material/Numbers";
import NotesIcon from "@mui/icons-material/Notes";
import RefreshIcon from "@mui/icons-material/Refresh";

const BASE_URL = "https://filesregsiteration.sstli.com";
const API_URL = `${BASE_URL}/exceptions.php`;
const BRANCHES_URL = "https://api4.sstli.com/api/institute-directory/branches";

const ADMIN_KEY = "CHANGE_ME_TO_SOMETHING_STRONG";
const DARK_BORDER = "#67C99D";

const STATUS = {
  GRADUATED: "حرمان",
  ZERO_BALANCE: "أرصدة صفرية",
};

const normalizeNationalId = (val) => (val || "").replace(/\D/g, "").trim();

const firstNonEmpty = (...values) => {
  for (const value of values) {
    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
};

const getBranchGuidFromItem = (item) => firstNonEmpty(
  item?.guid,
  item?.Guid,
  item?.branchGuid,
  item?.BranchGuid,
  item?.branch_guid,
  item?.id,
  item?.Id
);

const getBranchNameFromItem = (item) => firstNonEmpty(
  item?.branchName,
  item?.BranchName,
  item?.branch_name,
  item?.name,
  item?.Name,
  item?.brEName,
  item?.BrEName,
  item?.arabicName,
  item?.ArabicName
);

export default function ExceptionsLists() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const surfaces = theme.palette.surfaces || {};

  const colors = {
    page: isDark ? (theme.palette.background?.default || "#0d1b15") : "#f8fbfa",
    card: isDark ? (surfaces.card || "#13251d") : "#ffffff",
    section: isDark ? (surfaces.section || "#172b22") : "#f8fbfa",
    nested: isDark ? (surfaces.nested || "#1b3328") : "#ffffff",
    hover: isDark ? (surfaces.hover || "#214333") : "#f0f7f4",
    selected: isDark ? (surfaces.selected || "#28513f") : "#e8f5ef",
    text: isDark ? (theme.palette.text?.primary || "#edf8f3") : "#2c3e50",
    muted: isDark ? (theme.palette.text?.secondary || "#bdd2c8") : "#5d6d7e",
    border: isDark ? DARK_BORDER : "#9ac9b5",
  };

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const branchGuid = firstNonEmpty(user?.branchForWork, user?.branchGuid, user?.BranchGuid);
  const localBranchName = firstNonEmpty(
    user?.branchName,
    user?.BranchName,
    user?.branchForWorkName,
    user?.branch_name,
    user?.brEName,
    user?.BrEName
  );

  const isAdmin = [0, 1, 2, 3].includes(user?.userJop);

  const [branchesMap, setBranchesMap] = useState({});
  const [showAllBranches, setShowAllBranches] = useState(false);

  const [nationalId, setNationalId] = useState("");
  const [status, setStatus] = useState(STATUS.GRADUATED);
  const [notes, setNotes] = useState("");

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("الكل");

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [toast, setToast] = useState({ open: false, type: "success", msg: "" });
  const showToast = (type, msg) => setToast({ open: true, type, msg });

  const currentBranchName = localBranchName || branchesMap[branchGuid] || "الفرع الحالي";

  const resolveBranchName = (row) => {
    const directName = getBranchNameFromItem(row);
    if (directName) return directName;

    const rowGuid = getBranchGuidFromItem(row);
    if (rowGuid && branchesMap[rowGuid]) return branchesMap[rowGuid];

    return "فرع غير معروف";
  };

  const controlSx = {
    "& .MuiOutlinedInput-root": {
      color: colors.text,
      backgroundColor: isDark ? "transparent" : "#fff",
      borderRadius: 2,
      "& .MuiOutlinedInput-notchedOutline": {
        borderColor: colors.border,
        borderWidth: "1px",
      },
      "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: isDark ? DARK_BORDER : "#80b49e",
      },
      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderColor: isDark ? DARK_BORDER : "#80b49e",
        borderWidth: "1px",
      },
    },
    "& .MuiInputLabel-root": {
      color: colors.muted,
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: isDark ? DARK_BORDER : "#6a9a87",
    },
    "& .MuiSvgIcon-root": {
      color: isDark ? DARK_BORDER : undefined,
    },
  };

  const selectMenuProps = {
    PaperProps: {
      sx: {
        backgroundImage: "none",
        backgroundColor: isDark ? colors.section : "#fff",
        border: `1px solid ${colors.border}`,
        color: colors.text,
        "& .MuiMenuItem-root": {
          fontFamily: "Cairo, sans-serif",
          color: colors.text,
          backgroundColor: "transparent",
          "&:hover": {
            backgroundColor: isDark ? "transparent" : colors.hover,
          },
          "&.Mui-selected": {
            backgroundColor: isDark ? "transparent" : colors.selected,
            color: isDark ? DARK_BORDER : undefined,
            fontWeight: 800,
          },
          "&.Mui-selected:hover": {
            backgroundColor: isDark ? "transparent" : colors.selected,
          },
        },
      },
    },
  };

  const validate = () => {
    const id = normalizeNationalId(nationalId);
    if (!id) return "رقم الهوية مطلوب";
    if (id.length !== 10) return "رقم الهوية لازم يكون 10 أرقام";
    if (!status) return "اختار الحالة";
    if (!branchGuid && !showAllBranches) return "الفرع غير موجود للمستخدم الحالي";
    return null;
  };

  const loadBranches = async () => {
    try {
      const response = await fetch(BRANCHES_URL, { cache: "no-store" });
      const json = await response.json().catch(() => null);

      if (!response.ok) return;

      const list = Array.isArray(json)
        ? json
        : Array.isArray(json?.data)
          ? json.data
          : Array.isArray(json?.items)
            ? json.items
            : [];

      const nextMap = {};
      list.forEach((item) => {
        const guid = getBranchGuidFromItem(item);
        const name = getBranchNameFromItem(item);
        if (guid && name) nextMap[guid] = name;
      });

      setBranchesMap(nextMap);
    } catch {
      // عرض الصفحة لا يعتمد على نجاح تحميل دليل الفروع.
    }
  };

  const fetchList = async (opts = {}) => {
    const nextPage = opts.page ?? page;
    const nextSearch = opts.search ?? search;
    const nextStatus = opts.filterStatus ?? filterStatus;
    const nextAll = opts.showAllBranches ?? showAllBranches;

    if (!branchGuid && !nextAll) {
      showToast("error", "الفرع غير موجود للمستخدم الحالي");
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
      if (e?.name !== "AbortError") {
        showToast("error", e?.message || "Server error");
        setRows([]);
        setTotalCount(0);
        setTotalPages(1);
      }
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
      showToast("error", "الفرع غير موجود للمستخدم الحالي");
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

      setShowAllBranches(false);
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

    if (showAllBranches) {
      showToast("error", "الحذف غير مسموح في وضع كل الفروع");
      return;
    }

    if (!branchGuid) {
      showToast("error", "الفرع غير موجود للمستخدم الحالي");
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

  useEffect(() => {
    loadBranches();
    fetchList({ page: 1, showAllBranches: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      fetchList({ page: 1 });
    }, 350);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterStatus, showAllBranches]);

  useEffect(() => {
    fetchList({ page });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const stats = useMemo(() => {
    const pageGraduated = rows.filter((x) => x.status === STATUS.GRADUATED).length;
    const pageZero = rows.filter((x) => x.status === STATUS.ZERO_BALANCE).length;
    return { pageGraduated, pageZero };
  }, [rows]);

  const pageShellSx = {
    direction: "rtl",
    fontFamily: 'Cairo, Arial, "Noto Kufi Arabic", "Noto Sans Arabic", sans-serif',
    minHeight: "100vh",
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    overflowX: "hidden",
    backgroundColor: colors.page,
    color: colors.text,
    display: "flex",

    "& .MuiCard-root, & .MuiPaper-root": {
      backgroundImage: "none",
      backgroundColor: colors.card,
      color: colors.text,
      border: `1px solid ${colors.border}`,
      boxShadow: isDark ? "0 10px 28px rgba(3,20,13,.22)" : undefined,
    },

    "& .MuiButton-root": isDark
      ? {
          backgroundColor: "transparent !important",
          backgroundImage: "none !important",
          color: `${DARK_BORDER} !important`,
          border: `1px solid ${DARK_BORDER} !important`,
          boxShadow: "none !important",
          "&:hover": {
            backgroundColor: "transparent !important",
            color: "#edf8f3 !important",
            borderColor: `${DARK_BORDER} !important`,
          },
          "&.Mui-disabled": {
            backgroundColor: "transparent !important",
            color: "rgba(103,201,157,.42) !important",
            borderColor: "rgba(103,201,157,.38) !important",
          },
        }
      : {},

    "& .MuiChip-root": isDark
      ? {
          backgroundColor: "transparent !important",
          backgroundImage: "none !important",
          color: `${DARK_BORDER} !important`,
          border: `1px solid ${DARK_BORDER} !important`,
          fontWeight: 800,
        }
      : {},

    "& .MuiAlert-root": isDark
      ? {
          backgroundColor: "transparent !important",
          backgroundImage: "none !important",
          color: `${colors.text} !important`,
          border: `1px solid ${DARK_BORDER} !important`,
          "& .MuiAlert-icon": { color: `${DARK_BORDER} !important` },
        }
      : {},

    "& .MuiSwitch-root": isDark
      ? {
          "& .MuiSwitch-track": {
            backgroundColor: "transparent !important",
            border: `1px solid ${DARK_BORDER}`,
            opacity: "1 !important",
          },
          "& .MuiSwitch-thumb": {
            backgroundColor: `${DARK_BORDER} !important`,
          },
          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
            backgroundColor: "transparent !important",
            borderColor: DARK_BORDER,
            opacity: "1 !important",
          },
          "& .MuiSwitch-switchBase.Mui-checked": {
            color: DARK_BORDER,
          },
        }
      : {},

    "& .MuiPaginationItem-root": isDark
      ? {
          color: colors.text,
          backgroundColor: "transparent !important",
          border: "1px solid rgba(103,201,157,.45)",
          "&.Mui-selected": {
            color: `${DARK_BORDER} !important`,
            backgroundColor: "transparent !important",
            borderColor: DARK_BORDER,
            fontWeight: 900,
          },
          "&:hover": {
            backgroundColor: "transparent !important",
            borderColor: DARK_BORDER,
          },
        }
      : {},
  };

  return (
    <NavigationShell variant="standard">
      <Box sx={pageShellSx}>
        <Box
          sx={{
            flex: 1,
            width: "100%",
            maxWidth: "100%",
            minWidth: 0,
            overflowX: "hidden",
            p: { xs: 1, sm: 1.5, md: 2.5 },
            boxSizing: "border-box",
            ...navigationContentSx,
          }}
        >
          <Box
            sx={{
              mb: 2,
              display: "flex",
              alignItems: { xs: "stretch", md: "center" },
              justifyContent: "space-between",
              gap: 2,
              flexDirection: { xs: "column", md: "row" },
              minWidth: 0,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h5" sx={{ fontWeight: 900, textAlign: "start", color: colors.text }}>
                قوائم الاستثناءات
              </Typography>
              <Typography variant="body2" sx={{ color: colors.muted, mt: 0.5, textAlign: "start" }}>
                {showAllBranches
                  ? "عرض بيانات جميع الفروع"
                  : `البيانات حسب الفرع: ${currentBranchName}`}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 1.2, alignItems: "center", flexWrap: "wrap" }}>
              {isAdmin && ADMIN_KEY && (
                <FormControlLabel
                  sx={{ m: 0, color: colors.text }}
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
                sx={uiLayout.withUiSx(
                  { borderRadius: 2, fontWeight: 800, whiteSpace: "nowrap" },
                  uiLayout.buttonSx
                )}
              >
                تحديث
              </Button>
            </Box>
          </Box>

          <Grid container spacing={2} sx={{ width: "100%", m: 0 }}>
            <Grid item xs={12} md={5} sx={{ minWidth: 0 }}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <Typography variant="h6" sx={{ fontWeight: 900, mb: 1.5, textAlign: "start", color: colors.text }}>
                    إضافة استثناء
                  </Typography>

                  <TextField
                    fullWidth
                    label="رقم الهوية"
                    value={nationalId}
                    onChange={(e) => setNationalId(normalizeNationalId(e.target.value))}
                    inputProps={{ maxLength: 10, dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }}
                    placeholder="10 أرقام"
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <NumbersIcon />
                        </InputAdornment>
                      ),
                    }}
                    sx={uiLayout.withUiSx(controlSx, uiLayout.formFieldSx)}
                  />

                  <TextField
                    fullWidth
                    select
                    label="الحالة"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                    SelectProps={{ MenuProps: selectMenuProps }}
                    sx={uiLayout.withUiSx(controlSx, uiLayout.formFieldSx)}
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
                    minRows={4}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <NotesIcon />
                        </InputAdornment>
                      ),
                    }}
                    sx={uiLayout.withUiSx(controlSx, uiLayout.formFieldSx)}
                  />

                  <Button
                    fullWidth
                    variant="contained"
                    onClick={createItem}
                    startIcon={<AddCircleOutlineIcon />}
                    disabled={loading || showAllBranches}
                    sx={uiLayout.withUiSx(
                      { mt: 2, borderRadius: 2, py: 1.1, fontWeight: 900 },
                      uiLayout.buttonSx
                    )}
                  >
                    إضافة
                  </Button>

                  {showAllBranches && (
                    <Typography sx={{ mt: 1, fontSize: 12, color: colors.muted }}>
                      الإضافة متاحة في وضع “فرعي فقط” — اقفل “عرض كل الفروع”.
                    </Typography>
                  )}

                  <Divider sx={{ my: 2, borderColor: colors.border, opacity: isDark ? 0.55 : 1 }} />

                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Chip variant="outlined" label={`الإجمالي: ${totalCount}`} />
                    <Chip variant="outlined" label={`في الصفحة (حرمان): ${stats.pageGraduated}`} />
                    <Chip variant="outlined" label={`في الصفحة (أرصدة صفرية): ${stats.pageZero}`} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={7} sx={{ minWidth: 0 }}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: { xs: "stretch", md: "center" },
                      justifyContent: "space-between",
                      gap: 1.5,
                      flexDirection: { xs: "column", md: "row" },
                      mb: 2,
                      minWidth: 0,
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 900, textAlign: "start", color: colors.text }}>
                      القائمة
                    </Typography>

                    <Box
                      sx={uiLayout.withUiSx(
                        {
                          display: "flex",
                          gap: 1,
                          flexWrap: "wrap",
                          minWidth: 0,
                          "& > *": { minWidth: 0 },
                        },
                        uiLayout.formGridSx
                      )}
                    >
                      <TextField
                        size="small"
                        placeholder="بحث برقم الهوية أو الملاحظات"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon />
                            </InputAdornment>
                          ),
                        }}
                        sx={uiLayout.withUiSx(
                          { ...controlSx, width: { xs: "100%", sm: 250 } },
                          uiLayout.formFieldSx
                        )}
                      />

                      <TextField
                        size="small"
                        select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        SelectProps={{ MenuProps: selectMenuProps }}
                        sx={uiLayout.withUiSx(
                          { ...controlSx, minWidth: { xs: "100%", sm: 160 } },
                          uiLayout.formFieldSx
                        )}
                      >
                        <MenuItem value="الكل">الكل</MenuItem>
                        <MenuItem value={STATUS.GRADUATED}>{STATUS.GRADUATED}</MenuItem>
                        <MenuItem value={STATUS.ZERO_BALANCE}>{STATUS.ZERO_BALANCE}</MenuItem>
                      </TextField>
                    </Box>
                  </Box>

                  <TableContainer
                    component={Paper}
                    sx={uiLayout.withUiSx(
                      {
                        borderRadius: 2,
                        width: "100%",
                        maxWidth: "100%",
                        minWidth: 0,
                        overflowX: "hidden",
                        border: `1px solid ${colors.border}`,
                        backgroundColor: colors.section,
                      },
                      uiLayout.tableContainerSx
                    )}
                  >
                    <Table size="small" sx={{ width: "100%", tableLayout: "fixed" }}>
                      <TableHead>
                        <TableRow
                          sx={{
                            backgroundColor: isDark ? "transparent" : "#f0f7f4",
                            "& th": {
                              color: colors.text,
                              borderBottom: `1px solid ${colors.border}`,
                              fontWeight: 900,
                            },
                          }}
                        >
                          {showAllBranches && <TableCell sx={{ width: "24%" }}>الفرع</TableCell>}
                          <TableCell sx={{ width: showAllBranches ? "18%" : "24%" }}>رقم الهوية</TableCell>
                          <TableCell sx={{ width: showAllBranches ? "16%" : "20%" }}>الحالة</TableCell>
                          <TableCell>ملاحظات</TableCell>
                          <TableCell sx={{ width: 76 }} align="center">
                            إجراء
                          </TableCell>
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={showAllBranches ? 5 : 4} sx={{ py: 5, textAlign: "center", borderColor: colors.border }}>
                              <CircularProgress size={26} sx={{ color: isDark ? DARK_BORDER : "#80b49e" }} />
                              <Typography sx={{ mt: 1, color: colors.muted }}>جاري التحميل...</Typography>
                            </TableCell>
                          </TableRow>
                        ) : rows.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={showAllBranches ? 5 : 4} sx={{ py: 4, textAlign: "center", color: colors.muted, borderColor: colors.border }}>
                              لا يوجد بيانات لعرضها
                            </TableCell>
                          </TableRow>
                        ) : (
                          rows.map((x) => (
                            <TableRow
                              key={x.id}
                              hover
                              sx={{
                                backgroundColor: "transparent",
                                "&:hover": {
                                  backgroundColor: isDark ? "transparent !important" : colors.hover,
                                },
                                "& td": {
                                  color: colors.text,
                                  borderBottom: `1px solid ${isDark ? "rgba(103,201,157,.26)" : "rgba(128,180,158,.15)"}`,
                                  minWidth: 0,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  overflowWrap: "anywhere",
                                },
                              }}
                            >
                              {showAllBranches && (
                                <TableCell sx={{ fontWeight: 800 }} title={resolveBranchName(x)}>
                                  {resolveBranchName(x)}
                                </TableCell>
                              )}

                              <TableCell sx={{ fontWeight: 800 }}>
                                {x.national_id ?? x.nationalId}
                              </TableCell>

                              <TableCell>
                                <Chip size="small" variant="outlined" label={x.status || "—"} />
                              </TableCell>

                              <TableCell sx={{ color: x.notes ? colors.text : colors.muted }}>
                                {x.notes || "—"}
                              </TableCell>

                              <TableCell align="center">
                                <Tooltip title={showAllBranches ? "الحذف مقفول في وضع كل الفروع" : "حذف"} arrow>
                                  <span>
                                    <IconButton
                                      onClick={() => deleteItem(x.id)}
                                      disabled={loading || showAllBranches}
                                      sx={{
                                        color: isDark ? DARK_BORDER : "#ae1e21",
                                        border: isDark ? `1px solid ${DARK_BORDER}` : "1px solid transparent",
                                        backgroundColor: "transparent",
                                        width: 34,
                                        height: 34,
                                        "&:hover": {
                                          backgroundColor: "transparent",
                                          borderColor: isDark ? DARK_BORDER : "#ae1e21",
                                        },
                                      }}
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

                  <Box
                    sx={{
                      mt: 2,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 2,
                      flexWrap: "wrap",
                    }}
                  >
                    <Typography variant="body2" sx={{ color: colors.muted }}>
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
              variant={isDark ? "outlined" : "filled"}
              onClose={() => setToast((p) => ({ ...p, open: false }))}
              sx={isDark ? { border: `1px solid ${DARK_BORDER}`, backgroundColor: "transparent", color: colors.text } : undefined}
            >
              {toast.msg}
            </Alert>
          </Snackbar>
        </Box>
      </Box>
    </NavigationShell>
  );
}
