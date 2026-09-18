import * as uiLayout from './common/uiLayout';
import { navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from './NavigationShell';
import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import {
  GlobalStyles,
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Alert,
  Snackbar,
  Tooltip,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Chip,
  Stack,
  useTheme,
  useMediaQuery,
} from "@mui/material";

import {
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Handshake as HandshakeIcon,
} from "@mui/icons-material";

import { DataGrid } from "@mui/x-data-grid";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";


/** Brand */
const brand = {
  primary: "#80b49e",
  primaryDark: "#5f9a82",
  primaryLight: "#b7ddcf",
  bg: "#f6f8f7",
  paper: "#ffffff",
  text: "#1f2937",
  textMuted: "#6b7280",
  border: "#e5e7eb",
  danger: "#ef4444",
  info: "#2563eb",
};

const API_URL = "https://filesregsiteration.sstli.com/erp/p2p_marketing.php";
const USERS_URL = "https://api1.sstli.com/api/userinfo";

const safeJsonParse = (s, fallback = null) => {
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
};

// ✅ يقبل array أو json string أو string واحدة ويرجع Array نظيفة
const normalizeArray = (v) => {
  if (Array.isArray(v)) return v.filter(Boolean).map((x) => String(x).trim()).filter(Boolean);

  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return [];
    const parsed = safeJsonParse(s, null);
    if (Array.isArray(parsed)) return parsed.filter(Boolean).map((x) => String(x).trim()).filter(Boolean);
    return [s];
  }

  return [];
};

// ✅ backend -> UI record (يدعم الشكل الجديد contact_numbers + emails)
const toUiRecord = (row) => {
  const contactNumbers = normalizeArray(
    row.contact_numbers ??
      row.contactNumbers ??
      row.contact_number ??
      row.contactNumber
  );

  const emails = normalizeArray(row.emails ?? row.Emails ?? row.email ?? row.Email);

  return {
    id: row.id,
    userGuid: row.user_guid ?? row.userGuid ?? "",
    companyName: row.company_name ?? row.companyName ?? "",
    region: row.region ?? "",
    activity: row.activity ?? "",
    contactNumbers, // ✅ NEW
    emails, // ✅ NEW
    // backward compat (لو أي مكان لسه بيستخدمها)
    contactNumber: contactNumbers?.[0] || "",
    contactPerson: row.contact_person ?? row.contactPerson ?? "",
    serviceType: row.service_type ?? row.serviceType ?? "",
    status: row.status ?? "",
    notes: row.notes ?? "",
    createdAt: row.created_at ?? row.createdAt ?? null,
    updatedAt: row.updated_at ?? row.updatedAt ?? null,
  };
};

const P2PMarketingAdmin = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const surfaces = theme.palette.surfaces || {};
  const darkCard = surfaces.card || "#13251d";
  const darkSection = surfaces.section || "#172b22";
  const darkNested = surfaces.nested || "#1b3328";
  const darkHover = surfaces.hover || "#214333";

  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // layout
  const layoutDir = "ltr";
  const arabicDir = "rtl";

  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const [usersMap, setUsersMap] = useState(new Map()); // guid -> fullName
  const [usersLoading, setUsersLoading] = useState(true);

  const [openView, setOpenView] = useState(false);
  const [viewRecord, setViewRecord] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((p) => ({ ...p, open: false }));
  };

  const apiFetch = async (url, options = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    let body = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }

    if (!res.ok || !body?.ok) {
      const msg = body?.message || `HTTP ${res.status}`;
      throw new Error(msg);
    }

    return body;
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await fetch(USERS_URL, {
        headers: {
          "ngrok-skip-browser-warning": "true",
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();
      const arr = Array.isArray(data) ? data : [];

      const map = new Map();
      for (const u of arr) {
        const guid = String(u?.guid || "").toLowerCase();
        const fullName = String(u?.fullName || u?.userName || "").trim();
        if (guid) map.set(guid, fullName || guid);
      }
      setUsersMap(map);
    } catch (e) {
      console.error(e);
      showSnackbar("خطأ في تحميل بيانات المستخدمين", "error");
      setUsersMap(new Map());
    } finally {
      setUsersLoading(false);
    }
  };

  const loadRequests = async () => {
    setLoading(true);
    try {
      const body = await apiFetch(`${API_URL}?action=list`);
      const arr = Array.isArray(body.data) ? body.data : [];
      const mapped = arr.map(toUiRecord);
      setRecords(mapped);
      setFilteredRecords(mapped);
    } catch (e) {
      console.error(e);
      showSnackbar("خطأ في تحميل الطلبات", "error");
      setRecords([]);
      setFilteredRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await Promise.all([loadUsers(), loadRequests()]);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ search includes contactNumbers + emails
  useEffect(() => {
    const t = searchTerm.trim().toLowerCase();
    if (!t) {
      setFilteredRecords(records);
      return;
    }

    const filtered = records.filter((r) => {
      const uploaderName = usersMap.get(String(r.userGuid || "").toLowerCase()) || "";

      const hay = [
        r.companyName,
        r.region,
        r.activity,
        ...(r.contactNumbers || []),
        ...(r.emails || []),
        r.contactPerson,
        r.serviceType,
        r.status,
        r.notes,
        uploaderName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(t);
    });

    setFilteredRecords(filtered);
  }, [searchTerm, records, usersMap]);

  const handleView = (record) => {
    setViewRecord(record);
    setOpenView(true);
  };

  const handleCloseView = () => {
    setOpenView(false);
    setViewRecord(null);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "تأكيد الحذف",
      text: "هل أنت متأكد من حذف هذا السجل؟",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "نعم، احذف",
      cancelButtonText: "إلغاء",
      reverseButtons: true,
      confirmButtonColor: brand.danger,
    });

    if (!result.isConfirmed) return;

    try {
      await apiFetch(`${API_URL}?action=delete&id=${encodeURIComponent(id)}`, {
        method: "POST",
        body: JSON.stringify({ id }),
      });

      await Swal.fire({
        title: "تم الحذف",
        text: "تم حذف السجل بنجاح",
        icon: "success",
        timer: 1400,
        showConfirmButton: false,
      });

      await loadRequests();
    } catch (e) {
      console.error(e);
      await Swal.fire({
        title: "خطأ",
        text: `خطأ في الحذف: ${e.message || ""}`,
        icon: "error",
        confirmButtonText: "تمام",
      });
    }
  };

  const handleExport = () => {
    try {
      const withNames = filteredRecords.map((r) => ({
        ...r,
        uploaderFullName: usersMap.get(String(r.userGuid || "").toLowerCase()) || null,
      }));

      const dataStr = JSON.stringify(withNames, null, 2);
      const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
      const exportName = `p2p_admin_${format(new Date(), "yyyy-MM-dd")}.json`;

      const link = document.createElement("a");
      link.setAttribute("href", dataUri);
      link.setAttribute("download", exportName);
      link.click();

      showSnackbar("تم تصدير البيانات بنجاح", "success");
    } catch (e) {
      console.error(e);
      showSnackbar("خطأ في التصدير", "error");
    }
  };

  const stats = useMemo(() => {
    const total = records.length;
    const contracted = records.filter((r) => r.status?.trim() === "تم التعاقد").length;
    const inProgress = records.filter((r) => r.status?.trim() === "قيد المتابعة").length;
    const fresh = records.filter((r) => r.status?.trim() === "جديد").length;
    return { total, contracted, inProgress, fresh };
  }, [records]);

  const columns = useMemo(
    () => [
      {
        field: "companyName",
        headerName: "اسم الشركة",
        flex: 1.25,
        minWidth: 200,
      },
      {
        field: "uploader",
        headerName: "مقدم الطلب",
        flex: 1.05,
        minWidth: 180,
        valueGetter: (params) => {
          const guid = String(params?.row?.userGuid || "").toLowerCase();
          return usersMap.get(guid) || "غير معروف";
        },
        renderCell: (params) => (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <PersonIcon sx={{ fontSize: 18, color: brand.textMuted }} />
            <Typography sx={{ fontWeight: 800 }}>{params.value || "غير معروف"}</Typography>
          </Box>
        ),
      },
      {
        field: "region",
        headerName: "المنطقة",
        flex: 0.95,
        minWidth: 140,
      },
      {
        field: "contactNumbers",
        headerName: "أرقام التواصل",
        flex: 1.1,
        minWidth: 220,
        valueGetter: (params) => params?.row?.contactNumbers || [],
        renderCell: (params) => {
          const arr = Array.isArray(params.value) ? params.value : [];
          if (!arr.length) return <Typography sx={{ fontWeight: 700 }}>-</Typography>;
          const first = arr[0];
          const rest = arr.length - 1;
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Typography dir="ltr" sx={{ fontWeight: 900 }}>
                {first}
              </Typography>
              {rest > 0 && <Chip size="small" label={`+${rest}`} />}
            </Box>
          );
        },
      },
      {
        field: "emails",
        headerName: "الإيميلات",
        flex: 1.1,
        minWidth: 240,
        valueGetter: (params) => params?.row?.emails || [],
        renderCell: (params) => {
          const arr = Array.isArray(params.value) ? params.value : [];
          if (!arr.length) return <Typography sx={{ fontWeight: 700 }}>-</Typography>;
          const first = arr[0];
          const rest = arr.length - 1;
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Typography sx={{ fontWeight: 900 }} noWrap>
                {first}
              </Typography>
              {rest > 0 && <Chip size="small" label={`+${rest}`} />}
            </Box>
          );
        },
      },
      {
        field: "actions",
        headerName: "الإجراءات",
        sortable: false,
        filterable: false,
        width: 140,
        renderCell: (params) => (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip title="عرض التفاصيل">
              <IconButton size="small" onClick={() => handleView(params.row)}>
                <VisibilityIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="حذف">
              <IconButton
                size="small"
                onClick={() => handleDelete(params.row.id)}
                sx={{ color: brand.danger }}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [usersMap, records]
  );

  return (
    <NavigationShell variant="standard" ><Box
      className="p2p-dark-root"
      sx={{
        display: "flex",
        minHeight: "100vh",
        width: "100%",
        maxWidth: "100%",
        overflowX: "hidden",
        direction: layoutDir,
        backgroundColor: isDark ? theme.palette.background.default : brand.bg
      }}
    >

      <GlobalStyles
        styles={{
          ...(isDark
            ? {
                ".p2p-dark-root": {
                  backgroundColor: `${theme.palette.background.default} !important`,
                  color: `${theme.palette.text.primary} !important`
                },
                ".p2p-dark-root .MuiButton-root, .MuiDialog-paper .MuiButton-root, .MuiPopover-paper .MuiButton-root": {
                  background: "transparent !important",
                  backgroundColor: "transparent !important",
                  backgroundImage: "none !important",
                  color: "#9BE0C1 !important",
                  border: "1px solid #67C99D !important",
                  boxShadow: "none !important"
                },
                ".p2p-dark-root .MuiButton-root:hover, .MuiDialog-paper .MuiButton-root:hover, .MuiPopover-paper .MuiButton-root:hover": {
                  background: "transparent !important",
                  color: "#C9F2DF !important",
                  borderColor: "#67C99D !important"
                },
                ".p2p-dark-root .MuiIconButton-root, .MuiDialog-paper .MuiIconButton-root": {
                  background: "transparent !important",
                  color: "#9BE0C1 !important",
                  border: "1px solid #67C99D !important",
                  boxShadow: "none !important"
                },
                ".p2p-dark-root .MuiChip-root, .MuiDialog-paper .MuiChip-root": {
                  background: "transparent !important",
                  color: "#9BE0C1 !important",
                  border: "1px solid #67C99D !important",
                  boxShadow: "none !important"
                },
                ".p2p-dark-root .MuiOutlinedInput-root, .MuiDialog-paper .MuiOutlinedInput-root, .MuiPopover-paper .MuiOutlinedInput-root": {
                  background: "transparent !important",
                  color: `${theme.palette.text.primary} !important`
                },
                ".p2p-dark-root .MuiOutlinedInput-notchedOutline, .MuiDialog-paper .MuiOutlinedInput-notchedOutline, .MuiPopover-paper .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#67C99D !important",
                  borderWidth: "1px !important"
                },
                ".p2p-dark-root .MuiInputLabel-root, .MuiDialog-paper .MuiInputLabel-root, .MuiPopover-paper .MuiInputLabel-root": {
                  color: `${theme.palette.text.secondary} !important`
                },
                ".p2p-dark-root .MuiInputLabel-root.Mui-focused, .MuiDialog-paper .MuiInputLabel-root.Mui-focused": {
                  color: "#9BE0C1 !important"
                },
                ".p2p-dark-root .MuiInputAdornment-root, .p2p-dark-root .MuiSelect-icon, .MuiDialog-paper .MuiSelect-icon": {
                  color: "#9BE0C1 !important"
                },
                ".p2p-dark-root .MuiCheckbox-root, .MuiDialog-paper .MuiCheckbox-root": {
                  color: "#67C99D !important"
                },
                ".p2p-dark-root .MuiAlert-root, .MuiDialog-paper .MuiAlert-root": {
                  background: "transparent !important",
                  color: `${theme.palette.text.primary} !important`,
                  border: "1px solid #67C99D !important"
                },
                ".p2p-dark-root .MuiDivider-root, .MuiDialog-paper .MuiDivider-root": {
                  borderColor: "#67C99D !important"
                },
                ".p2p-dark-root .MuiCircularProgress-root, .MuiDialog-paper .MuiCircularProgress-root": {
                  color: "#67C99D !important"
                },
                ".p2p-dark-root .MuiDataGrid-root, .MuiDialog-paper .MuiDataGrid-root": {
                  backgroundColor: `${darkCard} !important`,
                  backgroundImage: "none !important",
                  color: `${theme.palette.text.primary} !important`,
                  borderColor: "#67C99D !important"
                },
                ".p2p-dark-root .MuiDataGrid-columnHeaders, .p2p-dark-root .MuiDataGrid-columnHeader": {
                  backgroundColor: `${darkNested} !important`,
                  backgroundImage: "none !important",
                  color: `${theme.palette.text.primary} !important`
                },
                ".p2p-dark-root .MuiDataGrid-cell": {
                  color: `${theme.palette.text.primary} !important`,
                  borderColor: "rgba(103,201,157,.24) !important"
                },
                ".p2p-dark-root .MuiDataGrid-row": {
                  backgroundColor: `${darkCard} !important`
                },
                ".p2p-dark-root .MuiDataGrid-row:hover": {
                  backgroundColor: `${darkHover} !important`
                },
                ".p2p-dark-root .MuiDataGrid-footerContainer, .p2p-dark-root .MuiDataGrid-toolbarContainer": {
                  backgroundColor: `${darkSection} !important`,
                  color: `${theme.palette.text.primary} !important`,
                  borderColor: "#67C99D !important"
                },
                ".p2p-dark-root .MuiTableContainer-root": {
                  backgroundColor: `${darkCard} !important`,
                  borderColor: "#67C99D !important"
                },
                ".p2p-dark-root .MuiTableHead-root .MuiTableCell-root": {
                  backgroundColor: `${darkNested} !important`,
                  color: `${theme.palette.text.primary} !important`,
                  borderColor: "#67C99D !important"
                },
                ".p2p-dark-root .MuiTableBody-root .MuiTableCell-root": {
                  backgroundColor: `${darkCard} !important`,
                  color: `${theme.palette.text.primary} !important`,
                  borderColor: "rgba(103,201,157,.24) !important"
                },
                ".MuiDialog-paper": {
                  backgroundColor: `${darkCard} !important`,
                  backgroundImage: "none !important",
                  color: `${theme.palette.text.primary} !important`,
                  border: "1px solid #67C99D !important"
                },
                ".MuiDialogTitle-root": {
                  backgroundColor: `${darkSection} !important`,
                  backgroundImage: "none !important",
                  color: `${theme.palette.text.primary} !important`,
                  borderBottom: "1px solid #67C99D !important"
                },
                ".MuiDialogContent-root": {
                  backgroundColor: `${darkCard} !important`,
                  color: `${theme.palette.text.primary} !important`
                },
                ".MuiDialogActions-root": {
                  backgroundColor: `${darkSection} !important`,
                  borderTop: "1px solid #67C99D !important"
                },
                ".MuiDialog-paper .MuiPaper-root, .MuiDialog-paper .MuiCard-root": {
                  backgroundColor: `${darkSection} !important`,
                  color: `${theme.palette.text.primary} !important`,
                  borderColor: "#67C99D !important"
                },
                ".MuiMenu-paper, .MuiPopover-paper, .MuiAutocomplete-paper, .MuiDataGrid-panel": {
                  backgroundColor: `${darkSection} !important`,
                  color: `${theme.palette.text.primary} !important`,
                  border: "1px solid #67C99D !important"
                },
                ".MuiMenuItem-root, .MuiAutocomplete-option": {
                  background: "transparent !important",
                  color: `${theme.palette.text.primary} !important`
                },
                ".MuiMenuItem-root:hover, .MuiAutocomplete-option:hover": {
                  backgroundColor: `${darkHover} !important`
                },
                ".swal2-popup": {
                  backgroundColor: `${darkCard} !important`,
                  color: `${theme.palette.text.primary} !important`,
                  border: "1px solid #67C99D !important"
                },
                ".swal2-title, .swal2-html-container, .swal2-input-label": {
                  color: `${theme.palette.text.primary} !important`
                },
                ".swal2-confirm, .swal2-deny, .swal2-cancel": {
                  background: "transparent !important",
                  color: "#9BE0C1 !important",
                  border: "1px solid #67C99D !important",
                  boxShadow: "none !important"
                },
                ".swal2-input, .swal2-textarea, .swal2-select": {
                  background: "transparent !important",
                  color: `${theme.palette.text.primary} !important`,
                  border: "1px solid #67C99D !important"
                }
              }
            : {})
        }}
      />

      

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: {
            xs: 2,
            md: 3
          },
          ...navigationContentSx
        }}
      >
        <Container maxWidth="xl" sx={{ mt: 2 }}>
          {/* Header */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 2,
              background: isDark
                ? darkSection
                : `linear-gradient(135deg, ${brand.primary} 0%, ${brand.primaryDark} 100%)`,
              backgroundImage: isDark ? "none" : undefined,
              color: isDark ? theme.palette.text.primary : "white",
              border: isDark
                ? "1px solid #67C99D"
                : `1px solid ${brand.border}`,
              boxShadow: "none",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <HandshakeIcon sx={{ fontSize: 40 }} />
                <Box dir={arabicDir}>
                  <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5, textAlign: "start" }}>
                    P2P - إدارة الطلبات
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.95, textAlign: "start" }}>
                    عرض جميع طلبات التسويق الخارجي + اسم مقدم الطلب
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: "flex", gap: 1.25, flexWrap: "wrap" }}>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleExport}
                  sx={uiLayout.withUiSx({
                    color: isDark ? "#9BE0C1" : "white",
                    borderColor: isDark ? "#67C99D" : "rgba(255,255,255,0.7)",
                    backgroundColor: "transparent",
                    "&:hover": {
                      borderColor: isDark ? "#67C99D" : "white",
                      backgroundColor: "transparent"
                    },
                    gap: 1,
                  }, uiLayout.buttonSx)}
                >
                  تصدير
                </Button>

                <Tooltip title="تحديث">
                  <IconButton
                    onClick={async () => {
                      await Promise.all([loadUsers(), loadRequests()]);
                      showSnackbar("تم التحديث", "success");
                    }}
                    sx={{
                      color: isDark ? "#9BE0C1" : "white",
                      border: isDark ? "1px solid #67C99D" : undefined,
                      backgroundColor: "transparent"
                    }}
                  >
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Paper>

          {/* Stats */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              { title: "إجمالي الطلبات", value: stats.total },
              { title: "تم التعاقد", value: stats.contracted },
              { title: "قيد المتابعة", value: stats.inProgress },
              { title: "جديد", value: stats.fresh },
            ].map((x) => (
              <Grid key={x.title} item xs={12} sm={6} md={3}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 2,
                    border: isDark
                      ? "1px solid #67C99D"
                      : `1px solid ${brand.border}`,
                    backgroundColor: isDark ? darkCard : brand.paper,
                    backgroundImage: "none",
                    boxShadow: "none",
                  }}
                >
                  <CardContent dir={arabicDir}>
                    <Typography
                      variant="h6"
                      sx={{
                        color: isDark ? theme.palette.text.secondary : brand.textMuted,
                        textAlign: "start"
                      }}
                    >
                      {x.title}
                    </Typography>
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 900,
                        color: isDark ? "#9BE0C1" : brand.text,
                        textAlign: "start",
                        mt: 1
                      }}
                    >
                      {x.value}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Search */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 3,
              borderRadius: 2,
              border: isDark
                ? "1px solid #67C99D"
                : `1px solid ${brand.border}`,
              backgroundColor: isDark ? darkSection : brand.paper,
              backgroundImage: "none",
              boxShadow: "none",
            }}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={10}>
                <TextField InputLabelProps={{ shrink: true }}
                  fullWidth
                  placeholder="بحث في الطلبات (شركة / منطقة / حالة / أرقام / إيميلات / مقدم الطلب ...)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  inputProps={{ dir: arabicDir }}
                  sx={uiLayout.withUiSx({ "& .MuiInputBase-root": { borderRadius: 2 } }, uiLayout.formFieldSx)}
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, pl: 1 }}>
                        <SearchIcon sx={{ color: isDark ? "#9BE0C1" : brand.textMuted }} />
                      </Box>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={2}>
                <Button
                  fullWidth
                  variant={isDark ? "outlined" : "contained"}
                  onClick={() => setSearchTerm("")}
                  sx={uiLayout.withUiSx({
                    height: 56,
                    backgroundColor: isDark ? "transparent" : brand.primary,
                    color: isDark ? "#9BE0C1" : "#fff",
                    borderColor: isDark ? "#67C99D" : brand.primary,
                    fontWeight: 800,
                    "&:hover": {
                      backgroundColor: isDark ? "transparent" : brand.primaryDark
                    },
                  }, uiLayout.buttonSx)}
                >
                  إعادة الضبط
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Grid */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              border: isDark
                ? "1px solid #67C99D"
                : `1px solid ${brand.border}`,
              backgroundColor: isDark ? darkCard : brand.paper,
              overflow: "hidden",
              boxShadow: "none",
            }}
          >
            {loading || usersLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                <CircularProgress />
              </Box>
            ) : filteredRecords.length === 0 ? (
              <Box dir={arabicDir} sx={{ p: 4, textAlign: "start" }}>
                <Typography
                  variant="h6"
                  sx={{ color: isDark ? theme.palette.text.secondary : brand.textMuted }}
                >
                  {searchTerm ? "لا توجد نتائج مطابقة للبحث" : "لا توجد طلبات"}
                </Typography>
              </Box>
            ) : (
              <Box sx={uiLayout.withUiSx({ height: 560, width: "100%" }, uiLayout.tableContainerSx)}>
                <DataGrid
                  rows={filteredRecords}
                  columns={columns}
                  getRowId={(row) => row.id}
                  disableRowSelectionOnClick
                  pageSizeOptions={[10, 25, 50]}
                  initialState={{
                    pagination: { paginationModel: { pageSize: 10, page: 0 } },
                  }}
                  sx={uiLayout.withUiSx({
                    border: "none",
                    "& .MuiDataGrid-columnHeaders": {
                      backgroundColor: isDark ? darkNested : brand.primary,
                      backgroundImage: "none",
                      color: isDark ? theme.palette.text.primary : "white",
                      fontWeight: 900,
                      borderBottom: isDark ? "1px solid #67C99D" : undefined
                    },
                    "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 900 },
                    "& .MuiDataGrid-cell": {
                      borderColor: isDark ? "rgba(103,201,157,.24)" : brand.border,
                      color: isDark ? theme.palette.text.primary : brand.text,
                    },
                    "& .MuiDataGrid-row": {
                      backgroundColor: isDark ? darkCard : undefined
                    },
                    "& .MuiDataGrid-row:hover": {
                      backgroundColor: isDark ? darkHover : "rgba(128,180,158,0.10)",
                    },
                    "& .MuiDataGrid-footerContainer": {
                      backgroundColor: isDark ? darkSection : undefined,
                      color: isDark ? theme.palette.text.primary : undefined,
                      borderTop: isDark
                        ? "1px solid #67C99D"
                        : `1px solid ${brand.border}`,
                    },
                    "& .MuiDataGrid-cellContent": {
                      direction: "rtl",
                      textAlign: "start",
                      width: "100%",
                    },
                  }, uiLayout.dataGridSx)}
                />
              </Box>
            )}

            {filteredRecords.length > 0 && (
              <Box dir={arabicDir} sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography
                  variant="body2"
                  sx={{ color: isDark ? theme.palette.text.secondary : brand.textMuted }}
                >
                  عرض {filteredRecords.length} من أصل {records.length} طلب
                </Typography>
              </Box>
            )}
          </Paper>
        </Container>

        {/* View Dialog */}
        <Dialog sx={uiLayout.dialogLayoutSx} open={openView} onClose={handleCloseView} maxWidth="sm" fullWidth dir={arabicDir}>
          <DialogTitle
            sx={{
              backgroundColor: isDark ? darkSection : brand.primary,
              color: isDark ? theme.palette.text.primary : "white",
              borderBottom: isDark ? "1px solid #67C99D" : undefined
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <BusinessIcon />
              <Typography sx={{ fontWeight: 900 }}>تفاصيل الطلب</Typography>
            </Box>
          </DialogTitle>

          <DialogContent sx={{ pt: 3 }}>
            {!viewRecord ? (
              <Typography>لا يوجد بيانات</Typography>
            ) : (
              <Box>
                <Typography sx={{ fontWeight: 900, mb: 1, textAlign: "start" }}>
                  {viewRecord.companyName || "-"}
                </Typography>

                <Typography sx={{ color: brand.textMuted, mb: 2, textAlign: "start" }}>
                  مقدم الطلب:{" "}
                  <b>{usersMap.get(String(viewRecord.userGuid || "").toLowerCase()) || "غير معروف"}</b>
                </Typography>

                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Paper variant="outlined" sx={{
                      p: 2,
                      borderRadius: 2,
                      borderColor: isDark ? "#67C99D" : brand.border,
                      backgroundColor: isDark ? darkSection : undefined
                    }}>
                      <Typography sx={{ color: isDark ? theme.palette.text.secondary : brand.textMuted, mb: 0.5 }}>المنطقة</Typography>
                      <Typography sx={{ fontWeight: 800 }}>{viewRecord.region || "-"}</Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Paper variant="outlined" sx={{
                      p: 2,
                      borderRadius: 2,
                      borderColor: isDark ? "#67C99D" : brand.border,
                      backgroundColor: isDark ? darkSection : undefined
                    }}>
                      <Typography sx={{ color: isDark ? theme.palette.text.secondary : brand.textMuted, mb: 0.5 }}>النشاط</Typography>
                      <Typography sx={{ fontWeight: 800 }}>{viewRecord.activity || "-"}</Typography>
                    </Paper>
                  </Grid>

                  {/* ✅ أرقام التواصل (متعددة) */}
                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{
                      p: 2,
                      borderRadius: 2,
                      borderColor: isDark ? "#67C99D" : brand.border,
                      backgroundColor: isDark ? darkSection : undefined
                    }}>
                      <Typography sx={{ color: isDark ? theme.palette.text.secondary : brand.textMuted, mb: 1 }}>أرقام التواصل</Typography>
                      {Array.isArray(viewRecord.contactNumbers) && viewRecord.contactNumbers.length > 0 ? (
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          {viewRecord.contactNumbers.map((n, i) => (
                            <Chip key={`${n}-${i}`} label={n} sx={{ fontWeight: 800 }} />
                          ))}
                        </Stack>
                      ) : (
                        <Typography sx={{ fontWeight: 800 }}>-</Typography>
                      )}
                    </Paper>
                  </Grid>

                  {/* ✅ إيميلات (متعددة) */}
                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{
                      p: 2,
                      borderRadius: 2,
                      borderColor: isDark ? "#67C99D" : brand.border,
                      backgroundColor: isDark ? darkSection : undefined
                    }}>
                      <Typography sx={{ color: isDark ? theme.palette.text.secondary : brand.textMuted, mb: 1 }}>الإيميلات</Typography>
                      {Array.isArray(viewRecord.emails) && viewRecord.emails.length > 0 ? (
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          {viewRecord.emails.map((em, i) => (
                            <Chip key={`${em}-${i}`} label={em} sx={{ fontWeight: 800 }} />
                          ))}
                        </Stack>
                      ) : (
                        <Typography sx={{ fontWeight: 800 }}>-</Typography>
                      )}
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Paper variant="outlined" sx={{
                      p: 2,
                      borderRadius: 2,
                      borderColor: isDark ? "#67C99D" : brand.border,
                      backgroundColor: isDark ? darkSection : undefined
                    }}>
                      <Typography sx={{ color: isDark ? theme.palette.text.secondary : brand.textMuted, mb: 0.5 }}>مسئول التواصل</Typography>
                      <Typography sx={{ fontWeight: 800 }}>{viewRecord.contactPerson || "-"}</Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Paper variant="outlined" sx={{
                      p: 2,
                      borderRadius: 2,
                      borderColor: isDark ? "#67C99D" : brand.border,
                      backgroundColor: isDark ? darkSection : undefined
                    }}>
                      <Typography sx={{ color: isDark ? theme.palette.text.secondary : brand.textMuted, mb: 0.5 }}>نوع الخدمة</Typography>
                      <Typography sx={{ fontWeight: 800 }}>{viewRecord.serviceType || "-"}</Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Paper variant="outlined" sx={{
                      p: 2,
                      borderRadius: 2,
                      borderColor: isDark ? "#67C99D" : brand.border,
                      backgroundColor: isDark ? darkSection : undefined
                    }}>
                      <Typography sx={{ color: isDark ? theme.palette.text.secondary : brand.textMuted, mb: 0.5 }}>الحالة</Typography>
                      <Typography sx={{ fontWeight: 900, color: isDark ? "#9BE0C1" : brand.primaryDark }}>
                        {viewRecord.status || "-"}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{
                      p: 2,
                      borderRadius: 2,
                      borderColor: isDark ? "#67C99D" : brand.border,
                      backgroundColor: isDark ? darkSection : undefined
                    }}>
                      <Typography sx={{ color: isDark ? theme.palette.text.secondary : brand.textMuted, mb: 0.5 }}>ملاحظات</Typography>
                      <Typography sx={{ fontWeight: 700 }}>{viewRecord.notes || "لا توجد"}</Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{
                      p: 2,
                      borderRadius: 2,
                      borderColor: isDark ? "#67C99D" : brand.border,
                      backgroundColor: isDark ? darkSection : undefined
                    }}>
                      <Typography sx={{ color: isDark ? theme.palette.text.secondary : brand.textMuted, mb: 0.5 }}>تاريخ الإضافة</Typography>
                      <Typography sx={{ fontWeight: 800 }}>
                        {viewRecord.createdAt ? format(new Date(viewRecord.createdAt), "yyyy/MM/dd", { locale: arSA }) : "-"}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={uiLayout.withUiSx({ p: 2 }, uiLayout.dialogActionsSx)}>
            <Button sx={uiLayout.buttonSx} onClick={handleCloseView}>إغلاق</Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box></NavigationShell>
  );
};

export default P2PMarketingAdmin;
