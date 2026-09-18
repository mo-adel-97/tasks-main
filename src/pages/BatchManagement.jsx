import * as uiLayout from '../components/common/uiLayout';
import './rtl-forms-fix.css';
import { DESKTOP_BREAKPOINT, navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
  GlobalStyles,
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  useMediaQuery
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import SaveIcon from "@mui/icons-material/Save";
import SearchIcon from "@mui/icons-material/Search";
import SchoolIcon from "@mui/icons-material/School";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import GroupsIcon from "@mui/icons-material/Groups";

import Swal from "sweetalert2";




const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  "https://api4.sstli.com";





const DARK_BORDER = "#67C99D";
const DARK_TEXT = "#9BE0C1";
const primary = "#057546";
const primaryDark = "#034d31";
const soft = "#f7fbf9";
const border = "#dce8e2";

const TYPE_META = {
  diploma: {
    label: "دفعات الدبلومات",
    shortLabel: "دبلومات",
    icon: <SchoolIcon />,
    title: "دفعة دراسية جديدة"
  },
  course: {
    label: "دفعات الدورات التأهيلية",
    shortLabel: "تأهيلية",
    icon: <MenuBookIcon />,
    title: "دفعة دورة تأهيلية جديدة"
  },
  development: {
    label: "دفعات الدورات التطويرية",
    shortLabel: "تطويرية",
    icon: <AutoStoriesIcon />,
    title: "دفعة دورة تطويرية جديدة"
  }
};

const emptyBatch = () => ({
  guid: "",
  code: "",
  name: "",
  notes: "",
  isUse: true,
  isRegOn: true
});

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const currentUser = readUser();

const getUserGuid = () =>
  String(
    currentUser?.guid ||
    currentUser?.Guid ||
    currentUser?.userGuid ||
    currentUser?.UserGuid ||
    ""
  ).trim();

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

function BatchLookupDialog({
  open,
  type,
  search,
  setSearch,
  rows,
  loading,
  onClose,
  onPick
}) {
  return (
    <Dialog sx={uiLayout.dialogLayoutSx}
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      dir="rtl"
      PaperProps={{
        sx: {
          borderRadius: { xs: 1.4, sm: 2.2 },
          m: { xs: 0.7, sm: 2 },
          maxHeight: { xs: "94vh", sm: "84vh" }
        }
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 900,
          py: { xs: 0.8, sm: 1.25 },
          fontSize: { xs: 15.5, sm: 20 }
        }}
      >
        {TYPE_META[type]?.label || "قائمة الدفعات"}
      </DialogTitle>

      <DialogContent
        dividers
        sx={{ p: { xs: 0.65, sm: 1.2 } }}
      >
        <TextField InputLabelProps={{ shrink: true }}
          autoFocus
          fullWidth
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث بالكود أو اسم الدفعة..."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
          sx={uiLayout.withUiSx({
            mb: 0.7,
            "& .MuiInputBase-root": {
              minHeight: { xs: 34, sm: 38 }
            },
            "& input": {
              fontSize: { xs: 12, sm: 13 }
            }
          }, uiLayout.formFieldSx)}
        />

        {loading ? (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <CircularProgress size={26} />
          </Box>
        ) : (
          <Box sx={{ display: "grid", gap: 0.4 }}>
            {rows.map((row, index) => (
              <Paper
                key={`${row.guid || row.code}-${index}`}
                variant="outlined"
                onDoubleClick={() => onPick(row)}
                sx={{
                  px: { xs: 0.55, sm: 0.9 },
                  py: { xs: 0.4, sm: 0.6 },
                  cursor: "pointer",
                  borderColor: border,
                  "&:hover": {
                    bgcolor: "#eef8f3",
                    borderColor: primary
                  }
                }}
              >
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "46px minmax(0,1fr) 52px",
                      sm: "65px minmax(0,1fr) 75px 92px 58px"
                    },
                    alignItems: "center",
                    gap: { xs: 0.35, sm: 0.65 }
                  }}
                >
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: { xs: 12, sm: 12 } }}
                    >
                      الكود
                    </Typography>
                    <Typography
                      sx={{
                        fontWeight: 900,
                        fontSize: { xs: 12, sm: 13 }
                      }}
                    >
                      {row.code || "-"}
                    </Typography>
                  </Box>

                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: { xs: 12, sm: 12 } }}
                    >
                      اسم الدفعة
                    </Typography>
                    <Typography
                      noWrap
                      sx={{
                        fontWeight: 800,
                        fontSize: { xs: 12, sm: 13 }
                      }}
                    >
                      {row.name || "-"}
                    </Typography>
                  </Box>

                  <Box sx={{ display: { xs: "none", sm: "block" } }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: 12 }}
                    >
                      الحالة
                    </Typography>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 800 }}>
                      {row.status || "-"}
                    </Typography>
                  </Box>

                  <Box sx={{ display: { xs: "none", sm: "block" } }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: 12 }}
                    >
                      التسجيل
                    </Typography>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 800 }}>
                      {row.registrationStatus || "-"}
                    </Typography>
                  </Box>

                  <Button
                    size="small"
                    onClick={() => onPick(row)}
                    sx={uiLayout.withUiSx({
                      minWidth: 0,
                      px: 0.25,
                      fontSize: { xs: 12, sm: 12 }
                    }, uiLayout.buttonSx)}
                  >
                    اختيار
                  </Button>
                </Box>
              </Paper>
            ))}

            {!rows.length && (
              <Alert
                severity="info"
                sx={{
                  py: 0.25,
                  fontSize: { xs: 12, sm: 12 }
                }}
              >
                لا توجد دفعات مطابقة للبحث.
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={uiLayout.withUiSx({ py: 0.45 }, uiLayout.dialogActionsSx)}>
        <Button onClick={onClose} sx={uiLayout.withUiSx({ fontSize: { xs: 12, sm: 13 } }, uiLayout.buttonSx)}>
          إغلاق
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function BatchManagement() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const surfaces = theme.palette.surfaces || {};
  const darkCard = surfaces.card || "#13251d";
  const darkSection = surfaces.section || "#172b22";
  const darkNested = surfaces.nested || "#1b3328";
  const darkHover = surfaces.hover || "#214333";
  const isDesktop = useMediaQuery(
    `(min-width:${DESKTOP_BREAKPOINT}px)`,
    { noSsr: true }
  );

  const userGuid = useMemo(() => getUserGuid(), []);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [permissionLoading, setPermissionLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  const [ops, setOps] = useState({
    canView: false,
    canAdd: false,
    canEdit: false,
    canFind: false
  });

  const [type, setType] = useState("diploma");
  const [model, setModel] = useState(emptyBatch());
  const [branches, setBranches] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupSearch, setLookupSearch] = useState("");
  const [lookupRows, setLookupRows] = useState([]);
  const [lookupLoading, setLookupLoading] = useState(false);

  const isEdit = Boolean(model.guid);

  const setField = useCallback((field, value) => {
    setModel((current) => ({
      ...current,
      [field]: value
    }));
  }, []);

  const setBranchValue = useCallback((guid, field, value) => {
    const number = Math.max(0, Math.trunc(toNumber(value)));

    setBranches((current) =>
      current.map((row) =>
        row.guid === guid
          ? { ...row, [field]: number }
          : row
      )
    );
  }, []);

  const totalStudents = useMemo(
    () =>
      branches.reduce(
        (sum, item) => sum + toNumber(item.studentCount),
        0
      ),
    [branches]
  );

  const totalApprovals = useMemo(
    () =>
      branches.reduce(
        (sum, item) => sum + toNumber(item.aprovCount),
        0
      ),
    [branches]
  );

  // ============================================================
  // شئون الطلاب / أضافة دفعة دراسية من UserPermissionsController - Fail Closed
  // ============================================================
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        if (!userGuid) return;

        const response = await fetch(
          `${API_BASE_URL}/api/user-permissions/${encodeURIComponent(userGuid)}`,
          { cache: "no-store" }
        );

        const result = await response.json().catch(() => null);

        const allowed =
          response.ok &&
          result?.data?.studentAffairs?.canView === true &&
          result?.data?.studentAffairs?.screens?.addBatch === true;

        if (alive) setAuthorized(Boolean(allowed));
      } catch {
        if (alive) setAuthorized(false);
      } finally {
        if (alive) setPermissionLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [userGuid]);

  // ============================================================
  // Bootstrap: صلاحيات العمليات + فروع التسجيل
  // ============================================================
  const loadBootstrap = useCallback(async () => {
    if (!authorized || !userGuid) return;

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/batch-management/bootstrap?userGuid=${encodeURIComponent(userGuid)}`,
        { cache: "no-store" }
      );

      const raw = await response.text();
      let result = null;

      try {
        result = raw ? JSON.parse(raw) : null;
      } catch {
        result = null;
      }

      if (!response.ok) {
        throw new Error(
          [
            result?.message,
            result?.error,
            result?.detail
          ]
            .filter(Boolean)
            .join(" — ") ||
          raw ||
          "تعذر تحميل شاشة الدفعات"
        );
      }

      setOps({
        canView: Boolean(result?.data?.permissions?.canView),
        canAdd: Boolean(result?.data?.permissions?.canAdd),
        canEdit: Boolean(result?.data?.permissions?.canEdit),
        canFind: Boolean(result?.data?.permissions?.canFind)
      });

      const branchRows = Array.isArray(result?.data?.branches)
        ? result.data.branches
        : [];

      setBranches(
        branchRows.map((item) => ({
          ...item,
          studentCount: 0,
          aprovCount: 0
        }))
      );
    } catch (e) {
      await Swal.fire({
        icon: "error",
        title: "تعذر التحميل",
        text: e?.message || "تعذر تحميل شاشة الدفعات"
      });
    } finally {
      setLoading(false);
    }
  }, [authorized, userGuid]);

  useEffect(() => {
    if (authorized) loadBootstrap();
  }, [authorized, loadBootstrap]);

  const resetForType = useCallback(
    async (nextType = type) => {
      setType(nextType);
      setModel(emptyBatch());
      setLookupRows([]);
      setLookupSearch("");
      setLookupOpen(false);

      setBranches((current) =>
        current.map((row) => ({
          ...row,
          studentCount: 0,
          aprovCount: 0
        }))
      );
    },
    [type]
  );

  const handleTypeChange = useCallback(
    (_, value) => {
      if (!value || value === type) return;
      resetForType(value);
    },
    [type, resetForType]
  );

  // ============================================================
  // Search list: كل نوع له مصدره المختلف
  // ============================================================
  useEffect(() => {
    if (!lookupOpen || !ops.canFind) return;

    const timer = setTimeout(async () => {
      setLookupLoading(true);

      try {
        const params = new URLSearchParams({
          userGuid,
          type,
          q: lookupSearch || ""
        });

        const response = await fetch(
          `${API_BASE_URL}/api/batch-management/batches?${params}`,
          { cache: "no-store" }
        );

        const result = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            result?.message || "تعذر تحميل قائمة الدفعات"
          );
        }

        setLookupRows(
          Array.isArray(result?.data) ? result.data : []
        );
      } catch {
        setLookupRows([]);
      } finally {
        setLookupLoading(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [
    lookupOpen,
    lookupSearch,
    type,
    ops.canFind,
    userGuid
  ]);

  // ============================================================
  // تحميل دفعة مختارة + أعداد الفروع من مصدر النوع نفسه
  // ============================================================
  const loadBatch = useCallback(
    async (row) => {
      setLookupOpen(false);
      setLoading(true);

      try {
        const params = new URLSearchParams({
          userGuid,
          type
        });

        const response = await fetch(
          `${API_BASE_URL}/api/batch-management/batches/${encodeURIComponent(row.code)}?${params}`,
          { cache: "no-store" }
        );

        const raw = await response.text();
        let result = null;

        try {
          result = raw ? JSON.parse(raw) : null;
        } catch {
          result = null;
        }

        if (!response.ok) {
          throw new Error(
            [
              result?.message,
              result?.error,
              result?.detail
            ]
              .filter(Boolean)
              .join(" — ") ||
            raw ||
            "تعذر تحميل بيانات الدفعة"
          );
        }

        const batch = result?.data?.batch || {};

        setModel({
          guid: String(batch.guid || ""),
          code: String(batch.code || row.code || ""),
          name: String(batch.name || ""),
          notes: String(batch.notes || ""),
          isUse: Boolean(batch.isUse),
          isRegOn: Boolean(batch.isRegOn)
        });

        const loadedBranches = Array.isArray(result?.data?.branches)
          ? result.data.branches
          : [];

        setBranches(
          loadedBranches.map((item) => ({
            ...item,
            studentCount: toNumber(item.studentCount),
            aprovCount: toNumber(item.aprovCount)
          }))
        );
      } catch (e) {
        await Swal.fire({
          icon: "error",
          title: "تعذر التحميل",
          text: e?.message || "تعذر تحميل بيانات الدفعة"
        });
      } finally {
        setLoading(false);
      }
    },
    [type, userGuid]
  );

  const validate = useCallback(() => {
    if (!model.name.trim()) {
      return "برجاء إدخال اسم الدفعة";
    }

    if (type === "development") {
      for (const row of branches) {
        const studentCount = toNumber(row.studentCount);
        const aprovCount = toNumber(row.aprovCount);

        if (studentCount < 0 || aprovCount < 0) {
          return "لا يمكن إدخال أعداد سالبة";
        }

        if (aprovCount > studentCount && studentCount > 0) {
          return `عدد الموافقات في ${row.name} لا يمكن أن يكون أكبر من عدد الطلاب`;
        }
      }
    }

    return "";
  }, [model.name, type, branches]);

  // ============================================================
  // Save / Update inside one server transaction
  // ============================================================
  const save = useCallback(async () => {
    const validation = validate();

    if (validation) {
      await Swal.fire({
        icon: "warning",
        title: "راجع البيانات",
        text: validation
      });
      return;
    }

    if (!isEdit && !ops.canAdd) {
      await Swal.fire({
        icon: "error",
        title: "غير مسموح",
        text: "لا توجد لديك صلاحية إضافة دفعة."
      });
      return;
    }

    if (isEdit && !ops.canEdit) {
      await Swal.fire({
        icon: "error",
        title: "غير مسموح",
        text: "لا توجد لديك صلاحية تعديل دفعة."
      });
      return;
    }

    let reason = "";

    if (isEdit) {
      const result = await Swal.fire({
        title: "سبب التعديل",
        input: "textarea",
        inputPlaceholder: "اكتب سبب تعديل الدفعة...",
        showCancelButton: true,
        confirmButtonText: "حفظ التعديل",
        cancelButtonText: "رجوع",
        inputValidator: (value) =>
          !String(value || "").trim()
            ? "سبب التعديل مطلوب"
            : undefined
      });

      if (!result.isConfirmed) return;
      reason = String(result.value || "").trim();
    }

    const payload = {
      actorUserGuid: userGuid,
      type,
      reason,
      batch: {
        guid: String(model.guid || ""),
        code: String(model.code || ""),
        name: model.name.trim(),
        notes: model.notes.trim(),
        isUse: Boolean(model.isUse),
        isRegOn: Boolean(model.isRegOn)
      },
      branches: branches.map((row) => ({
        branchGuid: row.guid,
        studentCount: Math.max(0, Math.trunc(toNumber(row.studentCount))),
        aprovCount: Math.max(0, Math.trunc(toNumber(row.aprovCount)))
      }))
    };

    setSaving(true);

    try {
      const response = await fetch(
        isEdit
          ? `${API_BASE_URL}/api/batch-management/${encodeURIComponent(model.guid)}`
          : `${API_BASE_URL}/api/batch-management`,
        {
          method: isEdit ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        }
      );

      const raw = await response.text();
      let result = null;

      try {
        result = raw ? JSON.parse(raw) : null;
      } catch {
        result = null;
      }

      if (!response.ok) {
        throw new Error(
          [
            result?.message,
            result?.error,
            result?.detail
          ]
            .filter(Boolean)
            .join(" — ") ||
          raw ||
          "تعذر حفظ الدفعة"
        );
      }

      setModel((current) => ({
        ...current,
        guid: String(result?.data?.guid || current.guid || ""),
        code: String(result?.data?.code || current.code || "")
      }));

      await Swal.fire({
        icon: "success",
        title: isEdit ? "تم تعديل الدفعة" : "تم إضافة الدفعة",
        text: result?.message || "تمت العملية بنجاح"
      });
    } catch (e) {
      await Swal.fire({
        icon: "error",
        title: "تعذر الحفظ",
        text: e?.message || "تعذر حفظ الدفعة"
      });
    } finally {
      setSaving(false);
    }
  }, [
    validate,
    isEdit,
    ops,
    userGuid,
    type,
    model,
    branches
  ]);

  if (permissionLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center"
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!authorized) {
    return (
      <Box sx={{ p: 1 }}>
        <Alert severity="error">
          لا توجد لديك صلاحية إضافة دفعة دراسية ضمن قائمة شئون الطلاب.
        </Alert>
      </Box>
    );
  }

  const pageContent = (
    <Box
      dir="rtl"
      sx={{
        minHeight: "100vh",
        width: "100%",
        maxWidth: "100%",
        overflowX: "hidden",
        bgcolor: soft,
        p: { xs: 0.4, sm: 0.75, md: 1 }
      }}
    >
      <Paper
        elevation={0}
        sx={{
          border: `1px solid ${isDark ? DARK_BORDER : border}`,
          borderRadius: { xs: 1.1, sm: 2 },
          overflow: "hidden",

          "& .MuiInputBase-root": {
            minHeight: { xs: 33, sm: 38 }
          },
          "& .MuiInputBase-input": {
            fontSize: { xs: 12, sm: 13.2 },
            py: { xs: 0.45, sm: 0.7 }
          },
          "& .MuiInputLabel-root": {
            fontSize: { xs: 12, sm: 12 }
          },
          "& .MuiButton-root": {
            minHeight: { xs: 30, sm: 36 },
            fontSize: { xs: 12, sm: 13 },
            lineHeight: 1.1
          },
          "& .MuiSvgIcon-root": {
            fontSize: { xs: 17, sm: 20 }
          }
        }}
      >
        <Box
          sx={uiLayout.withUiSx({
            bgcolor: isDark ? theme.palette.text.primary : primaryDark,
            color: "#fff",
            px: { xs: 0.7, sm: 1.4 },
            py: { xs: 0.6, sm: 0.85 },
            display: "flex",
            alignItems: "center",
            gap: 0.55
          }, uiLayout.mobileHeaderSx)}
        >
          {!isDesktop && (
            <IconButton
              onClick={() => setMobileSidebarOpen(true)}
              sx={{ color: "#fff", p: 0.35 }}
            >
              <MenuRoundedIcon />
            </IconButton>
          )}

          <GroupsIcon />

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontWeight: 900,
                fontSize: { xs: 15, sm: 19, md: 21 }
              }}
            >
              إضافة دفعة جديدة
            </Typography>
          </Box>

          <Chip
            label={isEdit ? `تعديل #${model.code}` : "دفعة جديدة"}
            size="small"
            sx={{
              height: { xs: 22, sm: 27 },
              bgcolor: isDark ? darkCard : "#fff",
              color: isDark ? theme.palette.text.primary : primaryDark,
              fontWeight: 900,
              fontSize: { xs: 12, sm: 12 }
            }}
          />
        </Box>

        {/* BatchHome: الثلاث اختيارات */}
        <Tabs
          value={type}
          onChange={handleTypeChange}
          variant="fullWidth"
          sx={{
            minHeight: { xs: 38, sm: 48 },
            borderBottom: `1px solid ${isDark ? DARK_BORDER : border}`,
            "& .MuiTab-root": {
              minHeight: { xs: 38, sm: 48 },
              px: { xs: 0.25, sm: 1 },
              py: { xs: 0.3, sm: 0.65 },
              fontWeight: 900,
              fontSize: { xs: 12, sm: 12.8 }
            }
          }}
        >
          {Object.entries(TYPE_META).map(([key, meta]) => (
            <Tab
              key={key}
              value={key}
              label={isDesktop ? meta.label : meta.shortLabel}
              icon={meta.icon}
              iconPosition="start"
            />
          ))}
        </Tabs>

        <Box
          sx={{
            p: { xs: 0.5, sm: 0.75 },
            borderBottom: `1px solid ${isDark ? DARK_BORDER : border}`
          }}
        >
          <Box
            sx={uiLayout.withUiSx({
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(3,minmax(0,1fr))",
                sm: "repeat(3,max-content)"
              },
              gap: { xs: 0.35, sm: 0.65 },
              justifyContent: { sm: "start" }
            }, uiLayout.actionBarSx)}
          >
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => resetForType(type)}
              disabled={!ops.canAdd && !isEdit}
              sx={uiLayout.withUiSx({
                bgcolor: "#1976d2",
                fontWeight: 900,
                minWidth: 0,
                px: { xs: 0.35, sm: 1.4 }
              }, uiLayout.buttonSx)}
            >
              جديد
            </Button>

            <Button
              variant="outlined"
              startIcon={<SearchIcon />}
              disabled={!ops.canFind}
              onClick={() => {
                setLookupSearch("");
                setLookupOpen(true);
              }}
              sx={uiLayout.withUiSx({
                fontWeight: 900,
                minWidth: 0,
                px: { xs: 0.35, sm: 1.4 }
              }, uiLayout.buttonSx)}
            >
              بحث
            </Button>

            <Button
              variant="contained"
              color="success"
              startIcon={
                saving
                  ? <CircularProgress size={15} color="inherit" />
                  : <SaveIcon />
              }
              disabled={
                saving ||
                loading ||
                (isEdit ? !ops.canEdit : !ops.canAdd)
              }
              onClick={save}
              sx={uiLayout.withUiSx({
                fontWeight: 900,
                minWidth: 0,
                px: { xs: 0.35, sm: 1.4 }
              }, uiLayout.buttonSx)}
            >
              {isEdit ? "حفظ التعديل" : "حفظ"}
            </Button>
          </Box>
        </Box>

        {loading && (
          <Box
            sx={{
              px: 0.8,
              py: 0.45,
              display: "flex",
              alignItems: "center",
              gap: 0.6
            }}
          >
            <CircularProgress size={16} />
            <Typography sx={{ fontSize: 12 }}>
              جاري التحميل...
            </Typography>
          </Box>
        )}

        <Box sx={{ p: { xs: 0.65, sm: 1 } }}>
          {/* كل 2 فيلد جنب بعض على الموبايل */}
          <Box
            sx={uiLayout.withUiSx({
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2,minmax(0,1fr))",
                md: "repeat(4,minmax(0,1fr))"
              },
              gap: { xs: 0.4, sm: 0.7 }
            }, uiLayout.formSectionSx)}
          >
            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
              size="small"
              label="كود"
              value={model.code}
              disabled
             inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
              size="small"
              label="اسم الدفعة"
              value={model.name}
              onChange={(e) => setField("name", e.target.value)}
            />

            <FormControlLabel
              sx={uiLayout.withUiSx({
                m: 0,
                px: 0.45,
                border: `1px solid ${isDark ? DARK_BORDER : border}`,
                borderRadius: 1,
                minHeight: { xs: 33, sm: 38 },
                "& .MuiFormControlLabel-label": {
                  fontSize: { xs: 12, sm: 12.5 }
                }
              }, uiLayout.checkboxFieldSx)}
              control={
                <Checkbox
                  checked={model.isUse}
                  onChange={(e) => setField("isUse", e.target.checked)}
                  sx={{ p: 0.4 }}
                />
              }
              label="نشط"
            />

            <FormControlLabel
              sx={uiLayout.withUiSx({
                m: 0,
                px: 0.45,
                border: `1px solid ${isDark ? DARK_BORDER : border}`,
                borderRadius: 1,
                minHeight: { xs: 33, sm: 38 },
                "& .MuiFormControlLabel-label": {
                  fontSize: { xs: 12, sm: 12.5 }
                }
              }, uiLayout.checkboxFieldSx)}
              control={
                <Checkbox
                  checked={model.isRegOn}
                  onChange={(e) => setField("isRegOn", e.target.checked)}
                  sx={{ p: 0.4 }}
                />
              }
              label="حالة التسجيل"
            />
          </Box>

          <TextField InputLabelProps={{ shrink: true }}
            fullWidth
            multiline
            minRows={1}
            maxRows={2}
            size="small"
            label="ملاحظات"
            value={model.notes}
            onChange={(e) => setField("notes", e.target.value)}
            sx={uiLayout.withUiSx({ mt: { xs: 0.45, sm: 0.7 } }, uiLayout.formFieldSx)}
          />

          <Box
            sx={{
              mt: { xs: 0.6, sm: 0.9 },
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2,minmax(0,1fr))",
                sm: "repeat(3,minmax(0,1fr))"
              },
              gap: { xs: 0.4, sm: 0.7 }
            }}
          >
            <Paper variant="outlined" sx={{ p: 0.55, textAlign: "center" }}>
              <Typography
                color="text.secondary"
                sx={{ fontSize: { xs: 12, sm: 12 } }}
              >
                عدد الفروع
              </Typography>
              <Typography sx={{ fontWeight: 900, fontSize: { xs: 13, sm: 16 } }}>
                {branches.length}
              </Typography>
            </Paper>

            <Paper variant="outlined" sx={{ p: 0.55, textAlign: "center" }}>
              <Typography
                color="text.secondary"
                sx={{ fontSize: { xs: 12, sm: 12 } }}
              >
                إجمالي عدد المقاعد
              </Typography>
              <Typography sx={{ fontWeight: 900, fontSize: { xs: 13, sm: 16 } }}>
                {totalStudents}
              </Typography>
            </Paper>

            <Paper
              variant="outlined"
              sx={{
                p: 0.55,
                textAlign: "center",
                gridColumn: { xs: "1 / -1", sm: "auto" }
              }}
            >
              <Typography
                color="text.secondary"
                sx={{ fontSize: { xs: 12, sm: 12 } }}
              >
                إجمالي عدد الموافقات
              </Typography>
              <Typography sx={{ fontWeight: 900, fontSize: { xs: 13, sm: 16 } }}>
                {totalApprovals}
              </Typography>
            </Paper>
          </Box>

          {/* نفس MainBranchGrid */}
          <Paper
            variant="outlined"
            sx={{
              mt: { xs: 0.6, sm: 0.9 },
              borderColor: isDark ? DARK_BORDER : border,
              overflow: "hidden"
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "minmax(120px,1fr) 84px 84px",
                bgcolor: "#e9f3ef",
                px: { xs: 0.4, sm: 0.7 },
                py: { xs: 0.4, sm: 0.6 },
                fontWeight: 900,
                fontSize: { xs: 12, sm: 12.2 },
                gap: 0.4
              }}
            >
              <Box>اسم الفرع</Box>
              <Box sx={{ textAlign: "center" }}>عدد المقاعد</Box>
              <Box sx={{ textAlign: "center" }}>عدد الموافقات</Box>
            </Box>

            <Box
              sx={{
                maxHeight: { xs: 360, sm: 520 },
                overflow: "auto"
              }}
            >
              {branches.map((branch) => (
                <Box
                  key={branch.guid}
                  sx={uiLayout.withUiSx({
                    display: "grid",
                    gridTemplateColumns: "minmax(120px,1fr) 84px 84px",
                    alignItems: "center",
                    gap: 0.4,
                    px: { xs: 0.4, sm: 0.7 },
                    py: { xs: 0.3, sm: 0.45 },
                    borderTop: "1px solid #edf2ef"
                  }, uiLayout.formSectionSx)}
                >
                  <Typography
                    noWrap
                    title={branch.name}
                    sx={{
                      fontWeight: 750,
                      fontSize: { xs: 12, sm: 12.5 }
                    }}
                  >
                    {branch.name}
                  </Typography>

                  <TextField InputLabelProps={{ shrink: true }}
                    type="number"
                    size="small"
                    value={branch.studentCount}
                    onChange={(e) =>
                      setBranchValue(
                        branch.guid,
                        "studentCount",
                        e.target.value
                      )
                    }
                    inputProps={{
                      min: 0,
                      style: { textAlign: "center" , direction: "ltr", unicodeBidi: "isolate" }
                    , dir: "ltr" }}
                    sx={uiLayout.withUiSx({
                      "& .MuiInputBase-root": {
                        minHeight: { xs: 29, sm: 33 }
                      },
                      "& input": {
                        px: 0.25,
                        py: 0.2,
                        fontSize: { xs: 12, sm: 12 }
                      }
                    }, uiLayout.formFieldSx)}
                  />

                  <TextField InputLabelProps={{ shrink: true }}
                    type="number"
                    size="small"
                    value={branch.aprovCount}
                    onChange={(e) =>
                      setBranchValue(
                        branch.guid,
                        "aprovCount",
                        e.target.value
                      )
                    }
                    inputProps={{
                      min: 0,
                      style: { textAlign: "center" , direction: "ltr", unicodeBidi: "isolate" }
                    , dir: "ltr" }}
                    sx={uiLayout.withUiSx({
                      "& .MuiInputBase-root": {
                        minHeight: { xs: 29, sm: 33 }
                      },
                      "& input": {
                        px: 0.25,
                        py: 0.2,
                        fontSize: { xs: 12, sm: 12 }
                      }
                    }, uiLayout.formFieldSx)}
                  />
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>
      </Paper>

      <BatchLookupDialog
        open={lookupOpen}
        type={type}
        search={lookupSearch}
        setSearch={setLookupSearch}
        rows={lookupRows}
        loading={lookupLoading}
        onClose={() => setLookupOpen(false)}
        onPick={loadBatch}
      />
    </Box>
  );

  return (
    <NavigationShell variant="standard" mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)}><Box className="sstli-dark-root" sx={{ display: "flex", minHeight: "100vh", bgcolor: theme.palette.mode === 'dark' ? theme.palette.background.default : soft }}>

      <GlobalStyles
        styles={{
          ...(isDark
            ? {
                ".sstli-dark-root": {
                  color: `${theme.palette.text.primary} !important`
                },

                ".sstli-dark-root .MuiPaper-root:not(.print-preview):not(.document-preview):not(.a4-page), .sstli-dark-root .MuiCard-root": {
                  backgroundColor: `${darkCard} !important`,
                  backgroundImage: "none !important",
                  color: `${theme.palette.text.primary} !important`,
                  borderColor: `${DARK_BORDER} !important`,
                  boxShadow: "none !important"
                },

                ".sstli-dark-root .MuiButton-root, .MuiDialog-paper .MuiButton-root, .MuiPopover-paper .MuiButton-root": {
                  backgroundColor: "transparent !important",
                  backgroundImage: "none !important",
                  color: `${DARK_TEXT} !important`,
                  border: `1px solid ${DARK_BORDER} !important`,
                  boxShadow: "none !important"
                },
                ".sstli-dark-root .MuiButton-root:hover, .MuiDialog-paper .MuiButton-root:hover, .MuiPopover-paper .MuiButton-root:hover": {
                  backgroundColor: "transparent !important",
                  backgroundImage: "none !important",
                  color: "#C9F2DF !important",
                  borderColor: `${DARK_BORDER} !important`,
                  boxShadow: "0 0 0 1px rgba(103,201,157,.16) !important"
                },
                ".sstli-dark-root .MuiButton-root.Mui-disabled, .MuiDialog-paper .MuiButton-root.Mui-disabled": {
                  backgroundColor: "transparent !important",
                  color: "rgba(155,224,193,.42) !important",
                  borderColor: "rgba(103,201,157,.34) !important",
                  boxShadow: "none !important"
                },

                ".sstli-dark-root .MuiIconButton-root, .MuiDialog-paper .MuiIconButton-root": {
                  backgroundColor: "transparent !important",
                  backgroundImage: "none !important",
                  color: `${DARK_TEXT} !important`,
                  border: `1px solid ${DARK_BORDER} !important`,
                  boxShadow: "none !important"
                },
                ".sstli-dark-root .MuiIconButton-root:hover, .MuiDialog-paper .MuiIconButton-root:hover": {
                  backgroundColor: "transparent !important",
                  color: "#C9F2DF !important"
                },

                ".sstli-dark-root .MuiChip-root, .MuiDialog-paper .MuiChip-root": {
                  backgroundColor: "transparent !important",
                  backgroundImage: "none !important",
                  color: `${DARK_TEXT} !important`,
                  border: `1px solid ${DARK_BORDER} !important`,
                  boxShadow: "none !important"
                },

                ".sstli-dark-root .MuiBadge-badge": {
                  backgroundColor: "transparent !important",
                  color: `${DARK_TEXT} !important`,
                  border: `1px solid ${DARK_BORDER} !important`
                },

                ".sstli-dark-root .MuiTabs-root, .MuiDialog-paper .MuiTabs-root": {
                  backgroundColor: `${darkSection} !important`,
                  backgroundImage: "none !important",
                  border: `1px solid ${DARK_BORDER} !important`,
                  borderRadius: "10px !important",
                  minHeight: "38px !important"
                },
                ".sstli-dark-root .MuiTab-root, .MuiDialog-paper .MuiTab-root": {
                  backgroundColor: "transparent !important",
                  backgroundImage: "none !important",
                  color: `${theme.palette.text.secondary} !important`,
                  border: "0 !important",
                  minHeight: "36px !important"
                },
                ".sstli-dark-root .MuiTab-root.Mui-selected, .MuiDialog-paper .MuiTab-root.Mui-selected": {
                  backgroundColor: "transparent !important",
                  color: `${DARK_TEXT} !important`
                },
                ".sstli-dark-root .MuiTabs-indicator, .MuiDialog-paper .MuiTabs-indicator": {
                  backgroundColor: `${DARK_BORDER} !important`,
                  height: "2px !important"
                },

                ".sstli-dark-root .MuiOutlinedInput-root, .MuiDialog-paper .MuiOutlinedInput-root, .MuiPopover-paper .MuiOutlinedInput-root": {
                  backgroundColor: "transparent !important",
                  backgroundImage: "none !important",
                  color: `${theme.palette.text.primary} !important`
                },
                ".sstli-dark-root .MuiOutlinedInput-notchedOutline, .MuiDialog-paper .MuiOutlinedInput-notchedOutline, .MuiPopover-paper .MuiOutlinedInput-notchedOutline": {
                  borderColor: `${DARK_BORDER} !important`
                },
                ".sstli-dark-root .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline, .sstli-dark-root .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline, .MuiDialog-paper .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline, .MuiDialog-paper .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: `${DARK_BORDER} !important`,
                  borderWidth: "1px !important"
                },
                ".sstli-dark-root .MuiInputLabel-root, .MuiDialog-paper .MuiInputLabel-root, .MuiPopover-paper .MuiInputLabel-root": {
                  color: `${theme.palette.text.secondary} !important`
                },
                ".sstli-dark-root .MuiInputLabel-root.Mui-focused, .MuiDialog-paper .MuiInputLabel-root.Mui-focused": {
                  color: `${DARK_TEXT} !important`
                },
                ".sstli-dark-root .MuiInputLabel-root.Mui-disabled, .MuiDialog-paper .MuiInputLabel-root.Mui-disabled": {
                  color: "rgba(155,224,193,.45) !important"
                },
                ".sstli-dark-root .MuiInputAdornment-root, .sstli-dark-root .MuiInputAdornment-root .MuiSvgIcon-root, .sstli-dark-root .MuiSelect-icon, .MuiDialog-paper .MuiSelect-icon": {
                  color: `${DARK_TEXT} !important`
                },
                ".sstli-dark-root .MuiFormHelperText-root, .MuiDialog-paper .MuiFormHelperText-root": {
                  color: `${theme.palette.text.secondary} !important`
                },

                ".sstli-dark-root .MuiCheckbox-root, .MuiDialog-paper .MuiCheckbox-root": {
                  color: `${DARK_BORDER} !important`
                },
                ".sstli-dark-root .MuiCheckbox-root.Mui-checked, .MuiDialog-paper .MuiCheckbox-root.Mui-checked": {
                  color: `${DARK_BORDER} !important`
                },

                ".sstli-dark-root .MuiSwitch-track": {
                  backgroundColor: "transparent !important",
                  border: `1px solid ${DARK_BORDER} !important`,
                  opacity: "1 !important"
                },
                ".sstli-dark-root .MuiSwitch-thumb": {
                  backgroundColor: `${DARK_TEXT} !important`,
                  boxShadow: "none !important"
                },

                ".sstli-dark-root .MuiAlert-root, .MuiDialog-paper .MuiAlert-root": {
                  backgroundColor: "transparent !important",
                  backgroundImage: "none !important",
                  color: `${theme.palette.text.primary} !important`,
                  border: `1px solid ${DARK_BORDER} !important`,
                  boxShadow: "none !important"
                },
                ".sstli-dark-root .MuiAlert-icon, .MuiDialog-paper .MuiAlert-icon": {
                  color: `${DARK_TEXT} !important`
                },

                ".sstli-dark-root .MuiDivider-root, .MuiDialog-paper .MuiDivider-root": {
                  borderColor: `${DARK_BORDER} !important`
                },

                ".sstli-dark-root .MuiCircularProgress-root, .MuiDialog-paper .MuiCircularProgress-root": {
                  color: `${DARK_BORDER} !important`
                },

                ".sstli-dark-root .MuiAppBar-root": {
                  backgroundColor: `${darkSection} !important`,
                  backgroundImage: "none !important",
                  color: `${theme.palette.text.primary} !important`,
                  borderBottom: `1px solid ${DARK_BORDER} !important`,
                  boxShadow: "none !important"
                },

                ".sstli-dark-root .MuiTableContainer-root": {
                  backgroundColor: `${darkCard} !important`,
                  backgroundImage: "none !important",
                  borderColor: `${DARK_BORDER} !important`
                },
                ".sstli-dark-root .MuiTableHead-root .MuiTableCell-root, .MuiDialog-paper .MuiTableHead-root .MuiTableCell-root": {
                  backgroundColor: `${darkNested} !important`,
                  backgroundImage: "none !important",
                  color: `${theme.palette.text.primary} !important`,
                  borderColor: `${DARK_BORDER} !important`
                },
                ".sstli-dark-root .MuiTableBody-root .MuiTableCell-root, .MuiDialog-paper .MuiTableBody-root .MuiTableCell-root": {
                  backgroundColor: `${darkCard} !important`,
                  color: `${theme.palette.text.primary} !important`,
                  borderColor: "rgba(103,201,157,.24) !important"
                },
                ".sstli-dark-root .MuiTableRow-root:hover .MuiTableCell-root, .MuiDialog-paper .MuiTableRow-root:hover .MuiTableCell-root": {
                  backgroundColor: `${darkHover} !important`
                },

                ".sstli-dark-root .MuiPaginationItem-root": {
                  backgroundColor: "transparent !important",
                  color: `${DARK_TEXT} !important`,
                  border: `1px solid ${DARK_BORDER} !important`
                },
                ".sstli-dark-root .MuiPaginationItem-root.Mui-selected": {
                  backgroundColor: "transparent !important",
                  color: "#C9F2DF !important",
                  boxShadow: `inset 0 0 0 1px ${DARK_BORDER} !important`
                },

                ".MuiDialog-paper": {
                  backgroundColor: `${darkCard} !important`,
                  backgroundImage: "none !important",
                  color: `${theme.palette.text.primary} !important`,
                  border: `1px solid ${DARK_BORDER} !important`,
                  boxShadow: "0 18px 50px rgba(2,18,12,.34) !important"
                },
                ".MuiDialogTitle-root": {
                  backgroundColor: `${darkSection} !important`,
                  backgroundImage: "none !important",
                  color: `${theme.palette.text.primary} !important`,
                  borderBottom: `1px solid ${DARK_BORDER} !important`
                },
                ".MuiDialogContent-root": {
                  backgroundColor: `${darkCard} !important`,
                  color: `${theme.palette.text.primary} !important`
                },
                ".MuiDialogActions-root": {
                  backgroundColor: `${darkSection} !important`,
                  color: `${theme.palette.text.primary} !important`,
                  borderTop: `1px solid ${DARK_BORDER} !important`
                },
                ".MuiDialog-paper .MuiPaper-root, .MuiDialog-paper .MuiCard-root": {
                  backgroundColor: `${darkSection} !important`,
                  backgroundImage: "none !important",
                  color: `${theme.palette.text.primary} !important`,
                  borderColor: `${DARK_BORDER} !important`
                },
                ".MuiDialog-paper .MuiPaper-root:hover, .MuiDialog-paper .MuiCard-root:hover": {
                  backgroundColor: `${darkHover} !important`
                },

                ".MuiMenu-paper, .MuiPopover-paper, .MuiAutocomplete-paper": {
                  backgroundColor: `${darkSection} !important`,
                  backgroundImage: "none !important",
                  color: `${theme.palette.text.primary} !important`,
                  border: `1px solid ${DARK_BORDER} !important`,
                  boxShadow: "0 14px 34px rgba(3,20,13,.28) !important"
                },
                ".MuiMenuItem-root, .MuiAutocomplete-option": {
                  backgroundColor: "transparent !important",
                  color: `${theme.palette.text.primary} !important`
                },
                ".MuiMenuItem-root:hover, .MuiAutocomplete-option:hover": {
                  backgroundColor: `${darkHover} !important`
                },
                ".MuiMenuItem-root.Mui-selected, .MuiAutocomplete-option[aria-selected='true']": {
                  backgroundColor: "transparent !important",
                  color: `${DARK_TEXT} !important`,
                  borderInlineStart: `2px solid ${DARK_BORDER} !important`
                },

                ".swal2-popup": {
                  backgroundColor: `${darkCard} !important`,
                  backgroundImage: "none !important",
                  color: `${theme.palette.text.primary} !important`,
                  border: `1px solid ${DARK_BORDER} !important`,
                  boxShadow: "0 18px 50px rgba(2,18,12,.34) !important"
                },
                ".swal2-title, .swal2-html-container, .swal2-input-label": {
                  color: `${theme.palette.text.primary} !important`
                },
                ".swal2-confirm, .swal2-deny, .swal2-cancel": {
                  backgroundColor: "transparent !important",
                  backgroundImage: "none !important",
                  color: `${DARK_TEXT} !important`,
                  border: `1px solid ${DARK_BORDER} !important`,
                  boxShadow: "none !important"
                },
                ".swal2-confirm:hover, .swal2-deny:hover, .swal2-cancel:hover": {
                  backgroundColor: "transparent !important",
                  color: "#C9F2DF !important"
                },
                ".swal2-input, .swal2-textarea, .swal2-select": {
                  backgroundColor: "transparent !important",
                  color: `${theme.palette.text.primary} !important`,
                  border: `1px solid ${DARK_BORDER} !important`,
                  boxShadow: "none !important"
                },
                ".swal2-validation-message": {
                  backgroundColor: `${darkSection} !important`,
                  color: `${theme.palette.text.primary} !important`
                },

                ".sstli-dark-root input[type='date'], .MuiDialog-paper input[type='date'], .sstli-dark-root input[type='datetime-local'], .MuiDialog-paper input[type='datetime-local'], .sstli-dark-root input[type='time'], .MuiDialog-paper input[type='time']": {
                  colorScheme: "dark"
                },

                ".sstli-dark-root .print-preview, .sstli-dark-root .document-preview, .sstli-dark-root .a4-page": {
                  backgroundColor: "#fff !important",
                  backgroundImage: "none !important",
                  color: "#111 !important",
                  borderColor: "#ddd !important"
                }
              }
            : {})
        }}
      />

      

      

      <Box sx={{
        flex: 1,
        minWidth: 0,
        ...navigationContentSx
      }}>
        {pageContent}
      </Box>
    </Box></NavigationShell>
  );
}
