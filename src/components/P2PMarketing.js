import { navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from './NavigationShell';
import React, { useEffect, useMemo, useState } from "react";
import {
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
  Fab,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  useTheme,
  useMediaQuery,
  Chip,
  Stack,
} from "@mui/material";

import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  Category as CategoryIcon,
  Notes as NotesIcon,
  Handshake as HandshakeIcon,
  Email as EmailIcon,
  Close as CloseIcon,
} from "@mui/icons-material";

import { DataGrid } from "@mui/x-data-grid";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";

import Swal from "sweetalert2";

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

// ✅ API Endpoint
const API_URL = "https://filesregsiteration.sstli.com/erp/p2p_marketing.php";

const safeJsonParse = (s, fallback = null) => {
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
};

const getUserGuid = () => {
  const raw = localStorage.getItem("user");
  if (!raw) return "";
  const u = safeJsonParse(raw, {});
  return u?.guid || u?.Guid || u?.userGuid || "";
};

const normalizeArray = (v) => {
  if (Array.isArray(v)) return v.filter(Boolean).map(String);
  if (typeof v === "string" && v.trim()) return [v.trim()];
  return [];
};

const toUiRecord = (row) => {
  if (!row) return null;

  const contactNumbers =
    normalizeArray(row.contact_numbers) ||
    normalizeArray(row.contactNumbers) ||
    normalizeArray(row.contact_number) ||
    normalizeArray(row.contactNumber);

  const emails =
    normalizeArray(row.emails) || normalizeArray(row.Emails) || [];

  // لو backend بيرجع JSON string (حصل في MySQL أحيانًا)
  const tryParseJsonArray = (x) => {
    if (Array.isArray(x)) return x;
    if (typeof x === "string") {
      const parsed = safeJsonParse(x, null);
      if (Array.isArray(parsed)) return parsed;
    }
    return null;
  };

  const cn2 = tryParseJsonArray(row.contact_numbers) || tryParseJsonArray(row.contactNumbers);
  const em2 = tryParseJsonArray(row.emails) || tryParseJsonArray(row.Emails);

  return {
    id: row.id,
    userGuid: row.user_guid ?? row.userGuid ?? "",
    companyName: row.company_name ?? row.companyName ?? "",
    region: row.region ?? "",
    activity: row.activity ?? "",
    contactNumbers: (cn2 ?? contactNumbers) || [],
    emails: (em2 ?? emails) || [],
    contactPerson: row.contact_person ?? row.contactPerson ?? "",
    serviceType: row.service_type ?? row.serviceType ?? "",
    status: row.status ?? "",
    notes: row.notes ?? "",
    createdAt: row.created_at ?? row.createdAt ?? null,
    updatedAt: row.updated_at ?? row.updatedAt ?? null,
  };
};

const toApiPayload = (ui) => {
  return {
    id: ui.id,
    user_guid: ui.userGuid || "",
    company_name: ui.companyName || "",
    region: ui.region || "",
    activity: ui.activity || "",
    contact_numbers: Array.isArray(ui.contactNumbers) ? ui.contactNumbers : [],
    emails: Array.isArray(ui.emails) ? ui.emails : [],
    contact_person: ui.contactPerson || "",
    service_type: ui.serviceType || "",
    status: ui.status || "",
    notes: ui.notes || "",
  };
};

const P2PMarketing = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const layoutDir = "ltr";
  const arabicDir = "rtl";

  const [formData, setFormData] = useState({
    companyName: "",
    region: "",
    activity: "",
    contactNumbers: [""], // ✅ متعدد
    emails: [""], // ✅ متعدد
    contactPerson: "",
    serviceType: "",
    status: "",
    notes: "",
  });

  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);

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

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, records]);

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

  const loadData = async () => {
    setLoading(true);
    try {
      const body = await apiFetch(`${API_URL}?action=list`);
      const arr = Array.isArray(body.data) ? body.data : [];
      const mapped = arr.map(toUiRecord).filter(Boolean);

      const myGuid = String(getUserGuid() || "").toLowerCase();
      const onlyMine = mapped.filter(
        (r) => String(r.userGuid || "").toLowerCase() === myGuid
      );

      setRecords(onlyMine);
      setFilteredRecords(onlyMine);
    } catch (e) {
      console.error(e);
      showSnackbar("خطأ في تحميل البيانات من السيرفر", "error");
      setRecords([]);
      setFilteredRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    let filtered = [...records];
    const t = searchTerm.trim().toLowerCase();

    if (t) {
      filtered = filtered.filter((r) => {
        const hay = [
          r.companyName,
          r.region,
          r.activity,
          r.contactPerson,
          r.serviceType,
          r.status,
          r.notes,
          ...(r.contactNumbers || []),
          ...(r.emails || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(t);
      });
    }

    setFilteredRecords(filtered);
  };

  const resetForm = () => {
    setFormData({
      companyName: "",
      region: "",
      activity: "",
      contactNumbers: [""],
      emails: [""],
      contactPerson: "",
      serviceType: "",
      status: "",
      notes: "",
    });
    setEditMode(false);
    setCurrentId(null);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    resetForm();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  // ===== multiple numbers/emails handlers =====
  const setContactNumberAt = (idx, val) => {
    setFormData((p) => {
      const next = [...p.contactNumbers];
      next[idx] = val;
      return { ...p, contactNumbers: next };
    });
  };

  const addContactNumber = () => {
    setFormData((p) => ({ ...p, contactNumbers: [...p.contactNumbers, ""] }));
  };

  const removeContactNumber = (idx) => {
    setFormData((p) => {
      const next = p.contactNumbers.filter((_, i) => i !== idx);
      return { ...p, contactNumbers: next.length ? next : [""] };
    });
  };

  const setEmailAt = (idx, val) => {
    setFormData((p) => {
      const next = [...p.emails];
      next[idx] = val;
      return { ...p, emails: next };
    });
  };

  const addEmail = () => {
    setFormData((p) => ({ ...p, emails: [...p.emails, ""] }));
  };

  const removeEmail = (idx) => {
    setFormData((p) => {
      const next = p.emails.filter((_, i) => i !== idx);
      return { ...p, emails: next.length ? next : [""] };
    });
  };

  const handleSubmit = async () => {
    const numbers = (formData.contactNumbers || []).map((x) => String(x || "").trim()).filter(Boolean);
    const emails = (formData.emails || []).map((x) => String(x || "").trim()).filter(Boolean);

    if (!formData.companyName.trim() || !formData.contactPerson.trim() || numbers.length === 0) {
      showSnackbar(
        "يرجى ملء الحقول المطلوبة (اسم الشركة، مسئول التواصل، رقم تواصل واحد على الأقل)",
        "error"
      );
      return;
    }

    const userGuid = getUserGuid();
    if (!userGuid) {
      showSnackbar("مش قادر أجيب User GUID من localStorage.user", "error");
      return;
    }

    setSaving(true);
    try {
      const id = editMode
        ? currentId
        : window.crypto?.randomUUID?.() ?? Date.now().toString();

      const uiRecord = {
        id,
        userGuid,
        ...formData,
        contactNumbers: numbers,
        emails: emails,
      };

      const payload = toApiPayload(uiRecord);

      if (editMode) {
        await apiFetch(`${API_URL}?action=update&id=${encodeURIComponent(id)}`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        showSnackbar("تم تعديل السجل بنجاح", "success");
      } else {
        await apiFetch(`${API_URL}?action=create`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        showSnackbar("تم إضافة السجل بنجاح", "success");
      }

      setOpenDialog(false);
      resetForm();
      await loadData();
    } catch (e) {
      console.error(e);
      showSnackbar(`حدث خطأ أثناء الحفظ: ${e.message || ""}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (record) => {
    setFormData({
      companyName: record.companyName || "",
      region: record.region || "",
      activity: record.activity || "",
      contactNumbers: (record.contactNumbers?.length ? record.contactNumbers : [""]).map(String),
      emails: (record.emails?.length ? record.emails : [""]).map(String),
      contactPerson: record.contactPerson || "",
      serviceType: record.serviceType || "",
      status: record.status || "",
      notes: record.notes || "",
    });
    setEditMode(true);
    setCurrentId(record.id);
    setOpenDialog(true);
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

      await loadData();
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

  const handleView = (record) => {
    setViewRecord(record);
    setOpenView(true);
  };

  const handleCloseView = () => {
    setOpenView(false);
    setViewRecord(null);
  };

  const handleExport = () => {
    try {
      const dataStr = JSON.stringify(filteredRecords, null, 2);
      const dataUri =
        "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
      const exportName = `p2p_data_${format(new Date(), "yyyy-MM-dd")}.json`;

      const link = document.createElement("a");
      link.setAttribute("href", dataUri);
      link.setAttribute("download", exportName);
      link.click();

      showSnackbar("تم تصدير البيانات بنجاح", "success");
    } catch (e) {
      console.error(e);
      showSnackbar("خطأ في تصدير البيانات", "error");
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
      { field: "companyName", headerName: "اسم الشركة", flex: 1.4, minWidth: 200 },
      { field: "region", headerName: "المنطقة", flex: 1, minWidth: 150 },
      {
        field: "contactNumbers",
        headerName: "أرقام التواصل",
        flex: 1.2,
        minWidth: 220,
        renderCell: (params) => {
          const arr = Array.isArray(params.value) ? params.value : [];
          const first = arr[0] || "-";
          const extra = Math.max(0, arr.length - 1);
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
              <Typography dir="ltr" sx={{ fontWeight: 800 }}>
                {first}
              </Typography>
              {extra > 0 && <Chip size="small" label={`+${extra}`} />}
            </Box>
          );
        },
      },
      {
        field: "emails",
        headerName: "الإيميلات",
        flex: 1.2,
        minWidth: 220,
        renderCell: (params) => {
          const arr = Array.isArray(params.value) ? params.value : [];
          const first = arr[0] || "-";
          const extra = Math.max(0, arr.length - 1);
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
              <Typography sx={{ fontWeight: 700 }} noWrap>
                {first}
              </Typography>
              {extra > 0 && <Chip size="small" label={`+${extra}`} />}
            </Box>
          );
        },
      },
      {
        field: "status",
        headerName: "الحالة",
        flex: 1,
        minWidth: 150,
        renderCell: (params) => (
          <Typography sx={{ fontWeight: 900, color: brand.primaryDark }}>
            {params.value || "-"}
          </Typography>
        ),
      },
      {
        field: "actions",
        headerName: "الإجراءات",
        sortable: false,
        filterable: false,
        width: 160,
        renderCell: (params) => (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip title="عرض التفاصيل">
              <IconButton size="small" onClick={() => handleView(params.row)}>
                <VisibilityIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="تعديل">
              <IconButton size="small" onClick={() => handleEdit(params.row)}>
                <EditIcon />
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
    [records]
  );

  return (
    <NavigationShell variant="standard" ><Box sx={{ display: "flex", minHeight: "100vh", direction: layoutDir, backgroundColor: brand.bg }}>
      

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
              borderRadius: 3,
              background: `linear-gradient(135deg, ${brand.primary} 0%, ${brand.primaryDark} 100%)`,
              color: "white",
              border: `1px solid ${brand.border}`,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <HandshakeIcon sx={{ fontSize: 40 }} />
                <Box dir={arabicDir}>
                  <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5, textAlign: "start" }}>
                    P2P - التسويق الخارجي
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.95, textAlign: "start" }}>
                    نظام إدارة بيانات التسويق الخارجي
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: "flex", gap: 1.25, flexWrap: "wrap" }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenDialog(true)}
                  sx={{
                    backgroundColor: "#ffffff",
                    color: brand.primaryDark,
                    fontWeight: 800,
                    "&:hover": { backgroundColor: brand.primaryLight },
                    gap: 1,
                  }}
                >
                  إضافة جديد
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleExport}
                  sx={{
                    color: "white",
                    borderColor: "rgba(255,255,255,0.7)",
                    "&:hover": { borderColor: "white" },
                    gap: 1,
                  }}
                >
                  تصدير
                </Button>

                <Tooltip title="تحديث البيانات">
                  <IconButton onClick={loadData} sx={{ color: "white" }}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Paper>

          {/* Stats */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              { title: "إجمالي السجلات", value: stats.total },
              { title: "تم التعاقد", value: stats.contracted },
              { title: "قيد المتابعة", value: stats.inProgress },
              { title: "جديد", value: stats.fresh },
            ].map((x) => (
              <Grid key={x.title} item xs={12} sm={6} md={3}>
                <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${brand.border}`, backgroundColor: brand.paper }}>
                  <CardContent dir={arabicDir}>
                    <Typography variant="h6" sx={{ color: brand.textMuted, textAlign: "start" }}>
                      {x.title}
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 900, color: brand.text, textAlign: "start", mt: 1 }}>
                      {x.value}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Search */}
          <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3, border: `1px solid ${brand.border}`, backgroundColor: brand.paper }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={10}>
                <TextField
                  fullWidth
                  placeholder="بحث في السجلات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  inputProps={{ dir: arabicDir }}
                  sx={{ "& .MuiInputBase-root": { borderRadius: 2 } }}
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, pl: 1 }}>
                        <SearchIcon sx={{ color: brand.textMuted }} />
                      </Box>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={2}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => setSearchTerm("")}
                  sx={{
                    height: 56,
                    backgroundColor: brand.primary,
                    fontWeight: 800,
                    "&:hover": { backgroundColor: brand.primaryDark },
                    gap: 1,
                  }}
                >
                  إعادة الضبط
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* DataGrid */}
          <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${brand.border}`, backgroundColor: brand.paper, overflow: "hidden" }}>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                <CircularProgress />
              </Box>
            ) : filteredRecords.length === 0 ? (
              <Box dir={arabicDir} sx={{ p: 4, textAlign: "start" }}>
                <Typography variant="h6" sx={{ color: brand.textMuted }}>
                  {searchTerm ? "لا توجد نتائج مطابقة للبحث" : "لا توجد سجلات، قم بإضافة سجل جديد"}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ height: 520, width: "100%" }}>
                <DataGrid
                  rows={filteredRecords}
                  columns={columns}
                  getRowId={(row) => row.id}
                  disableRowSelectionOnClick
                  pageSizeOptions={[10, 25, 50]}
                  initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
                  sx={{
                    border: "none",
                    "& .MuiDataGrid-columnHeaders": { backgroundColor: brand.primary, color: "white", fontWeight: 900 },
                    "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 900 },
                    "& .MuiDataGrid-cell": { borderColor: brand.border, color: brand.text },
                    "& .MuiDataGrid-row:hover": { backgroundColor: "rgba(128,180,158,0.10)" },
                    "& .MuiDataGrid-footerContainer": { borderTop: `1px solid ${brand.border}` },
                    "& .MuiDataGrid-cellContent": { direction: "rtl", textAlign: "start", width: "100%" },
                  }}
                />
              </Box>
            )}

            {filteredRecords.length > 0 && (
              <Box dir={arabicDir} sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" sx={{ color: brand.textMuted }}>
                  عرض {filteredRecords.length} من أصل {records.length} سجل
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Mobile FAB */}
          {isMobile && (
            <Fab
              onClick={() => setOpenDialog(true)}
              sx={{
                position: "fixed",
                bottom: 16,
                right: 16,
                backgroundColor: brand.primary,
                color: "white",
                "&:hover": { backgroundColor: brand.primaryDark },
              }}
            >
              <AddIcon />
            </Fab>
          )}
        </Container>

        {/* Add/Edit Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth dir={arabicDir}>
          <DialogTitle sx={{ backgroundColor: brand.primary, color: "white" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <HandshakeIcon />
              <Typography sx={{ fontWeight: 900 }}>{editMode ? "تعديل سجل" : "إضافة سجل جديد"}</Typography>
            </Box>
          </DialogTitle>

          <DialogContent>
            <Grid sx={{ pt: "20px" }} container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="اسم الشركة"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  inputProps={{ dir: arabicDir }}
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, pl: 1 }}>
                        <BusinessIcon sx={{ color: brand.textMuted }} />
                      </Box>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="المنطقة"
                  name="region"
                  value={formData.region}
                  onChange={handleInputChange}
                  inputProps={{ dir: arabicDir }}
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, pl: 1 }}>
                        <LocationIcon sx={{ color: brand.textMuted }} />
                      </Box>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="النشاط"
                  name="activity"
                  value={formData.activity}
                  onChange={handleInputChange}
                  inputProps={{ dir: arabicDir }}
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, pl: 1 }}>
                        <CategoryIcon sx={{ color: brand.textMuted }} />
                      </Box>
                    ),
                  }}
                />
              </Grid>

              {/* ✅ Multiple Contact Numbers */}
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: brand.border }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography sx={{ fontWeight: 900 }}>أرقام التواصل (متعدد)</Typography>
                    <Button size="small" onClick={addContactNumber} startIcon={<AddIcon />}>
                      إضافة رقم
                    </Button>
                  </Box>

                  <Stack spacing={1}>
                    {formData.contactNumbers.map((val, idx) => (
                      <Box key={idx} sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                        <TextField
                          fullWidth
                          required={idx === 0}
                          label={idx === 0 ? "رقم التواصل (أساسي)" : `رقم تواصل ${idx + 1}`}
                          value={val}
                          onChange={(e) => setContactNumberAt(idx, e.target.value)}
                          type="tel"
                          inputProps={{ dir: "ltr" }}
                          InputProps={{
                            startAdornment: (
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1, pl: 1 }}>
                                <PhoneIcon sx={{ color: brand.textMuted }} />
                              </Box>
                            ),
                          }}
                        />
                        <Tooltip title="حذف">
                          <span>
                            <IconButton
                              onClick={() => removeContactNumber(idx)}
                              disabled={formData.contactNumbers.length === 1}
                              sx={{ color: brand.danger }}
                            >
                              <CloseIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              </Grid>

              {/* ✅ Multiple Emails */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: brand.border }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography sx={{ fontWeight: 900 }}>الإيميلات (متعدد)</Typography>
                    <Button size="small" onClick={addEmail} startIcon={<AddIcon />}>
                      إضافة إيميل
                    </Button>
                  </Box>

                  <Stack spacing={1}>
                    {formData.emails.map((val, idx) => (
                      <Box key={idx} sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                        <TextField
                          fullWidth
                          label={idx === 0 ? "إيميل (اختياري)" : `إيميل ${idx + 1}`}
                          value={val}
                          onChange={(e) => setEmailAt(idx, e.target.value)}
                          type="email"
                          inputProps={{ dir: "ltr" }}
                          InputProps={{
                            startAdornment: (
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1, pl: 1 }}>
                                <EmailIcon sx={{ color: brand.textMuted }} />
                              </Box>
                            ),
                          }}
                        />
                        <Tooltip title="حذف">
                          <span>
                            <IconButton
                              onClick={() => removeEmail(idx)}
                              disabled={formData.emails.length === 1}
                              sx={{ color: brand.danger }}
                            >
                              <CloseIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="اسم مسئول التواصل"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleInputChange}
                  inputProps={{ dir: arabicDir }}
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, pl: 1 }}>
                        <PersonIcon sx={{ color: brand.textMuted }} />
                      </Box>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="نوع الخدمة"
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={handleInputChange}
                  inputProps={{ dir: arabicDir }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="الحالة"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  inputProps={{ dir: arabicDir }}
                  helperText="مثال: جديد / قيد المتابعة / تم التعاقد"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="ملاحظات"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  multiline
                  rows={3}
                  inputProps={{ dir: arabicDir }}
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, pl: 1 }}>
                        <NotesIcon sx={{ color: brand.textMuted }} />
                      </Box>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleCloseDialog} color="inherit" sx={{ gap: 1 }}>
              إلغاء
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={saving}
              sx={{
                backgroundColor: brand.primary,
                "&:hover": { backgroundColor: brand.primaryDark },
                fontWeight: 900,
                gap: 1,
              }}
            >
              {saving ? <CircularProgress size={22} color="inherit" /> : editMode ? "تحديث" : "حفظ"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Details Dialog */}
        <Dialog open={openView} onClose={handleCloseView} maxWidth="sm" fullWidth dir={arabicDir}>
          <DialogTitle sx={{ backgroundColor: brand.primary, color: "white" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <VisibilityIcon />
              <Typography sx={{ fontWeight: 900 }}>تفاصيل السجل</Typography>
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
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: brand.border }}>
                      <Typography sx={{ color: brand.textMuted, mb: 1 }}>
                        أرقام التواصل
                      </Typography>
                      <Stack spacing={1}>
                        {(viewRecord.contactNumbers || []).length ? (
                          viewRecord.contactNumbers.map((n, i) => (
                            <Typography key={i} dir="ltr" sx={{ fontWeight: 900 }}>
                              {n}
                            </Typography>
                          ))
                        ) : (
                          <Typography sx={{ fontWeight: 700 }}>-</Typography>
                        )}
                      </Stack>
                    </Paper>
                  </Grid>

                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: brand.border }}>
                      <Typography sx={{ color: brand.textMuted, mb: 1 }}>
                        الإيميلات
                      </Typography>
                      <Stack spacing={1}>
                        {(viewRecord.emails || []).length ? (
                          viewRecord.emails.map((em, i) => (
                            <Typography key={i} dir="ltr" sx={{ fontWeight: 800 }}>
                              {em}
                            </Typography>
                          ))
                        ) : (
                          <Typography sx={{ fontWeight: 700 }}>لا يوجد</Typography>
                        )}
                      </Stack>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: brand.border }}>
                      <Typography sx={{ color: brand.textMuted, mb: 0.5 }}>المنطقة</Typography>
                      <Typography sx={{ fontWeight: 800 }}>{viewRecord.region || "-"}</Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: brand.border }}>
                      <Typography sx={{ color: brand.textMuted, mb: 0.5 }}>النشاط</Typography>
                      <Typography sx={{ fontWeight: 800 }}>{viewRecord.activity || "-"}</Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: brand.border }}>
                      <Typography sx={{ color: brand.textMuted, mb: 0.5 }}>مسئول التواصل</Typography>
                      <Typography sx={{ fontWeight: 800 }}>{viewRecord.contactPerson || "-"}</Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: brand.border }}>
                      <Typography sx={{ color: brand.textMuted, mb: 0.5 }}>نوع الخدمة</Typography>
                      <Typography sx={{ fontWeight: 800 }}>{viewRecord.serviceType || "-"}</Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: brand.border }}>
                      <Typography sx={{ color: brand.textMuted, mb: 0.5 }}>الحالة</Typography>
                      <Typography sx={{ fontWeight: 900, color: brand.primaryDark }}>
                        {viewRecord.status || "-"}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: brand.border }}>
                      <Typography sx={{ color: brand.textMuted, mb: 0.5 }}>ملاحظات</Typography>
                      <Typography sx={{ fontWeight: 700 }}>{viewRecord.notes || "لا توجد"}</Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: brand.border }}>
                      <Typography sx={{ color: brand.textMuted, mb: 0.5 }}>تاريخ الإضافة</Typography>
                      <Typography sx={{ fontWeight: 800 }}>
                        {viewRecord.createdAt
                          ? format(new Date(viewRecord.createdAt), "yyyy/MM/dd", { locale: arSA })
                          : "-"}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleCloseView} sx={{ gap: 1 }}>
              إغلاق
            </Button>
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

export default P2PMarketing;
