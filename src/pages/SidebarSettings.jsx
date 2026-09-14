import PageContainer from '../components/common/PageContainer';
import * as uiLayout from '../components/common/uiLayout';
import './rtl-forms-fix.css';
import { SIDEBAR_ICON_OPTIONS as ICON_OPTIONS } from '../config/sidebarNavigation';
import { DESKTOP_BREAKPOINT, navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Autocomplete, Box, Button, Checkbox, Chip, CircularProgress, Divider, FormControl, FormControlLabel, IconButton, InputAdornment, InputLabel, MenuItem, Paper, Select, Stack, Tab, Tabs, TextField, Tooltip, Typography, useMediaQuery, useTheme } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import SearchIcon from "@mui/icons-material/Search";
import SecurityIcon from "@mui/icons-material/Security";
import TuneIcon from "@mui/icons-material/Tune";
import ViewListIcon from "@mui/icons-material/ViewList";
import Swal from "sweetalert2";




const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  "http://localhost:5258";



const primary = "#057546";
const border = "#dce8e2";
const soft = "#f5faf7";



const norm = (value) => String(value ?? "").trim().toLowerCase();

const authHeaders = (extra = {}) => {
  const token = String(localStorage.getItem("token") || "").trim();
  return {
    Accept: "application/json",
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

const emptyScreen = (defaultMenuGuid = "") => ({
  formGuid: "",
  itemGuid: "",
  itemKey: "",
  route: "/dashboard/",
  name: "",
  title: "",
  code: "",
  formCode: "",
  menuGuid: defaultMenuGuid,
  groupKey: "",
  description: "",
  iconKey: "dashboard",
  sortOrder: 100,
  isActive: true,
  isNew: false,
  badgeText: "",
  customBadge: "",
  desktopOnly: false,
  bypassGroupPermission: false,
  placement: "grouped"
});

const emptyGroup = () => ({
  groupGuid: "",
  groupKey: "",
  name: "",
  title: "",
  code: "",
  permissionMenuCode: "",
  iconKey: "list",
  sortOrder: 100,
  isActive: true,
  showWhenEmpty: false
});

export default function SidebarSettings() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(`(min-width:${DESKTOP_BREAKPOINT}px)`, { noSsr: true });
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [section, setSection] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState({ groups: [], screens: [], nextCode: "" });
  const [screen, setScreen] = useState(emptyScreen());
  const [group, setGroup] = useState(emptyGroup());
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");

  const refreshSidebar = useCallback(() => {
    window.dispatchEvent(new CustomEvent("sstli:sidebar-refresh"));
  }, []);

  const loadBootstrap = useCallback(async (preserveSelection = true) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/sidebar-admin/bootstrap`, {
        cache: "no-store",
        headers: authHeaders()
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error([result?.message, result?.error].filter(Boolean).join(" — ") || "تعذر تحميل إعدادات الشاشات");
      }

      const payload = result?.data || {};
      const groups = Array.isArray(payload.groups) ? payload.groups : [];
      const screens = Array.isArray(payload.screens)
        ? payload.screens
        : (Array.isArray(payload.items) ? payload.items : []);

      setData({ groups, screens, nextCode: String(payload.nextCode ?? "") });

      if (preserveSelection && screen.formGuid) {
        const refreshed = screens.find((x) => norm(x.formGuid) === norm(screen.formGuid));
        if (refreshed) setScreen({ ...emptyScreen(), ...refreshed, name: refreshed.name || refreshed.title || "" });
      }
      if (preserveSelection && group.groupGuid) {
        const refreshedGroup = groups.find((x) => norm(x.groupGuid) === norm(group.groupGuid));
        if (refreshedGroup) setGroup({ ...emptyGroup(), ...refreshedGroup, name: refreshedGroup.name || refreshedGroup.title || "" });
      }
    } catch (e) {
      setError(e?.message || "تعذر تحميل إعدادات الشاشات والقوائم");
    } finally {
      setLoading(false);
    }
  }, [screen.formGuid, group.groupGuid]);

  useEffect(() => {
    loadBootstrap(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredScreens = useMemo(() => {
    const q = norm(search);
    return [...data.screens]
      .filter((x) => groupFilter === "all" || norm(x.menuGuid) === norm(groupFilter))
      .filter((x) => !q || [x.name, x.title, x.itemKey, x.route, x.code, x.formCode]
        .some((value) => norm(value).includes(q)))
      .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
  }, [data.screens, search, groupFilter]);

  const selectedMenu = useMemo(
    () => data.groups.find((g) => norm(g.groupGuid) === norm(screen.menuGuid)) || null,
    [data.groups, screen.menuGuid]
  );

  const selectScreen = (row) => {
    setScreen({ ...emptyScreen(), ...row, name: row.name || row.title || "" });
    setSection(0);
  };

  const setScreenField = (field, value) => setScreen((current) => ({ ...current, [field]: value }));

  const newScreen = () => {
    const defaultGroup = data.groups.find((g) => norm(g.code) === "maintools") || data.groups[0];
    setScreen({
      ...emptyScreen(defaultGroup?.groupGuid || ""),
      code: data.nextCode || "",
      formCode: data.nextCode || ""
    });
    setSection(0);
  };

  const saveScreen = async () => {
    if (!screen.itemKey.trim() || !screen.name.trim() || !screen.route.trim()) {
      await Swal.fire("بيانات ناقصة", "ItemKey واسم الشاشة والـRoute مطلوبة.", "warning");
      return;
    }
    if (screen.placement === "grouped" && !screen.menuGuid) {
      await Swal.fire("بيانات ناقصة", "اختر القائمة الرئيسية التي ستظهر الشاشة بداخلها.", "warning");
      return;
    }

    setSaving(true);
    try {
      const isEdit = Boolean(screen.formGuid);
      const payload = {
        itemKey: screen.itemKey.trim(),
        route: screen.route.trim(),
        name: screen.name.trim(),
        code: String(screen.code || screen.formCode || "").trim(),
        menuGuid: screen.placement === "standalone" ? null : screen.menuGuid,
        description: screen.description || "",
        iconKey: screen.iconKey || "dashboard",
        sortOrder: Number(screen.sortOrder || 0),
        isActive: screen.isActive !== false,
        isNew: screen.isNew === true,
        badgeText: screen.badgeText || "",
        customBadge: screen.customBadge || "",
        desktopOnly: screen.desktopOnly === true,
        bypassGroupPermission: screen.bypassGroupPermission === true,
        placement: screen.placement || "grouped"
      };

      const response = await fetch(
        isEdit
          ? `${API_BASE_URL}/api/sidebar-admin/screens/${screen.formGuid}`
          : `${API_BASE_URL}/api/sidebar-admin/screens`,
        {
          method: isEdit ? "PUT" : "POST",
          headers: authHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify(payload)
        }
      );
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error([result?.message, result?.error].filter(Boolean).join(" — ") || "تعذر حفظ الشاشة");

      if (!isEdit && result?.formGuid) {
        setScreen((current) => ({ ...current, formGuid: result.formGuid, itemGuid: result.formGuid }));
      }
      refreshSidebar();
      await loadBootstrap(true);
      await Swal.fire({
        icon: "success",
        title: "تم الحفظ",
        text: "تم حفظ الاسم والتابة في Form_Name؛ سيظهر نفس الاسم فورًا في شاشة إضافة المستخدم.",
        timer: 1800,
        showConfirmButton: false
      });
    } catch (e) {
      await Swal.fire("تعذر الحفظ", e?.message || "حدث خطأ أثناء الحفظ", "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteScreen = async () => {
    if (!screen.formGuid) return;
    const confirm = await Swal.fire({
      icon: "warning",
      title: "إيقاف الشاشة؟",
      html: "ستختفي الشاشة من <b>السايدبار</b> ومن قائمة الشاشات النشطة في <b>إضافة مستخدم</b>. لن نحذف سجل الصلاحيات التاريخي.",
      showCancelButton: true,
      confirmButtonText: "إيقاف وحذف من الواجهتين",
      cancelButtonText: "إلغاء",
      confirmButtonColor: "#d32f2f"
    });
    if (!confirm.isConfirmed) return;

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/sidebar-admin/screens/${screen.formGuid}`, {
        method: "DELETE",
        headers: authHeaders()
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message || "تعذر حذف الشاشة");
      setScreen(emptyScreen());
      refreshSidebar();
      await loadBootstrap(false);
      await Swal.fire({ icon: "success", title: "تم إيقاف الشاشة", timer: 1200, showConfirmButton: false });
    } catch (e) {
      await Swal.fire("تعذر الحذف", e?.message || "حدث خطأ", "error");
    } finally {
      setSaving(false);
    }
  };

  const selectGroup = (row) => setGroup({ ...emptyGroup(), ...row, name: row.name || row.title || "" });
  const setGroupField = (field, value) => setGroup((current) => ({ ...current, [field]: value }));

  const saveGroup = async () => {
    if (!group.groupKey.trim() || !group.name.trim()) {
      await Swal.fire("بيانات ناقصة", "GroupKey واسم القائمة مطلوبان.", "warning");
      return;
    }
    setSaving(true);
    try {
      const isEdit = Boolean(group.groupGuid);
      const payload = {
        groupKey: group.groupKey.trim(),
        code: String(group.code || group.permissionMenuCode || "").trim(),
        name: group.name.trim(),
        iconKey: group.iconKey || "list",
        sortOrder: Number(group.sortOrder || 0),
        isActive: group.isActive !== false,
        showWhenEmpty: group.showWhenEmpty === true
      };
      const response = await fetch(
        isEdit
          ? `${API_BASE_URL}/api/sidebar-admin/groups/${group.groupGuid}`
          : `${API_BASE_URL}/api/sidebar-admin/groups`,
        {
          method: isEdit ? "PUT" : "POST",
          headers: authHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify(payload)
        }
      );
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error([result?.message, result?.error].filter(Boolean).join(" — ") || "تعذر حفظ القائمة");
      if (!isEdit && result?.groupGuid) setGroup((current) => ({ ...current, groupGuid: result.groupGuid }));
      refreshSidebar();
      await loadBootstrap(true);
      await Swal.fire({
        icon: "success",
        title: "تم حفظ القائمة",
        text: "اسم القائمة محفوظ في WebSidebarGroup وسيظهر بنفس الاسم في السايدبار وشاشة إضافة المستخدم.",
        timer: 1800,
        showConfirmButton: false
      });
    } catch (e) {
      await Swal.fire("تعذر الحفظ", e?.message || "حدث خطأ", "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteGroup = async () => {
    if (!group.groupGuid) return;
    const confirm = await Swal.fire({
      icon: "warning",
      title: "إيقاف القائمة؟",
      text: "ستختفي القائمة من السايدبار ومن قائمة صلاحيات المستخدمين، وتختفي تاباتها من الويب.",
      showCancelButton: true,
      confirmButtonText: "إيقاف",
      cancelButtonText: "إلغاء",
      confirmButtonColor: "#d32f2f"
    });
    if (!confirm.isConfirmed) return;

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/sidebar-admin/groups/${group.groupGuid}`, {
        method: "DELETE",
        headers: authHeaders()
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message || "تعذر إيقاف القائمة");
      setGroup(emptyGroup());
      refreshSidebar();
      await loadBootstrap(false);
    } catch (e) {
      await Swal.fire("تعذر الإيقاف", e?.message || "حدث خطأ", "error");
    } finally {
      setSaving(false);
    }
  };

  const screensList = (
    <Paper variant="outlined" sx={{ p: 1, borderRadius: 3, borderColor: border, display: "flex", flexDirection: "column", alignSelf: "start", gap: 1, minWidth: 0 }}>
      <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
        fullWidth
        size="small"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="بحث باسم الشاشة أو Route أو Code..."
        InputProps={{
          endAdornment: <InputAdornment position="end"><SearchIcon /></InputAdornment>
        }}
      />
      <FormControl fullWidth size="small" sx={uiLayout.withUiSx({ mt: 1 }, uiLayout.formFieldSx)}>
        <InputLabel>فلترة حسب القائمة</InputLabel>
        <Select value={groupFilter} label="فلترة حسب القائمة" onChange={(e) => setGroupFilter(e.target.value)}>
          <MenuItem value="all">كل الشاشات</MenuItem>
          {data.groups.map((g) => <MenuItem key={g.groupGuid} value={g.groupGuid}>{g.name || g.title}</MenuItem>)}
        </Select>
      </FormControl>
      <Button fullWidth sx={uiLayout.withUiSx({ mt: 1 }, uiLayout.buttonSx)} variant="outlined" startIcon={<AddIcon />} onClick={newScreen}>شاشة / تابة جديدة</Button>
      <Stack spacing={0.8} sx={{ maxHeight: "65dvh", overflow: "auto", minWidth: 0, "& > .MuiButton-root": { flexShrink: 0 }, "& .MuiTypography-root": { overflowWrap: "anywhere" } }}>
        {filteredScreens.map((row) => (
          <Button
            key={row.formGuid}
            onClick={() => selectScreen(row)}
            variant={norm(screen.formGuid) === norm(row.formGuid) ? "contained" : "outlined"}
            sx={uiLayout.withUiSx({ justifyContent: "flex-start", textAlign: "start", py: 1, px: 1.2, borderRadius: 2 }, uiLayout.buttonSx)}
          >
            <Box sx={{ width: "100%" }}>
              <Typography sx={{ fontWeight: 900, fontSize: 14 }}>{row.name || row.title}</Typography>
              <Typography sx={{ fontSize: 12, opacity: 0.75, direction: "ltr", textAlign: "left" }}>{row.route}</Typography>
              <Typography sx={{ fontSize: 12, opacity: 0.75 }}>Code: {row.code || row.formCode}</Typography>
            </Box>
          </Button>
        ))}
        {!loading && filteredScreens.length === 0 && <Alert severity="info">لا توجد شاشات مطابقة.</Alert>}
      </Stack>
    </Paper>
  );

  const screenEditor = (
    <Box sx={{ display: "grid", gap: 1.4 }}>
      <Paper variant="outlined" sx={{ p: { xs: 1.2, md: 2 }, borderRadius: 3, borderColor: border }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={1}>
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: 20 }}>بيانات الشاشة والتابة</Typography>
            <Typography color="text.secondary" sx={{ fontSize: 12 }}>
              الاسم هنا هو Form_Name.Name نفسه؛ لا يوجد اسم Web منفصل بعد الآن.
            </Typography>
          </Box>
          <Stack sx={uiLayout.actionBarSx} direction="row" spacing={1}>
            <Button sx={uiLayout.buttonSx} variant="outlined" startIcon={<AddIcon />} onClick={newScreen}>جديدة</Button>
            {screen.formGuid && <Button sx={uiLayout.buttonSx} color="error" variant="outlined" startIcon={<DeleteOutlineIcon />} onClick={deleteScreen}>حذف</Button>}
            <Button sx={uiLayout.buttonSx} variant="contained" startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />} onClick={saveScreen} disabled={saving}>حفظ</Button>
          </Stack>
        </Stack>

        <Divider sx={{ my: 1.5 }} />
        <Alert severity="success" sx={{ mb: 1.5 }}>
          <b>المصدر واحد:</b> تغيير اسم الشاشة هنا يحدث Form_Name مباشرة؛ شاشة «إضافة مستخدم» والسايدبار سيقرآن نفس الاسم.
        </Alert>

        <Box sx={uiLayout.withUiSx({ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2,minmax(0,1fr))" }, gap: 1.2 }, uiLayout.formGridSx)}>
          <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }} size="small" label="اسم الشاشة" value={screen.name} onChange={(e) => setScreenField("name", e.target.value)} />
          <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }} size="small" label="Code الصلاحية / Form_Name" value={screen.code || screen.formCode || data.nextCode} disabled={Boolean(screen.formGuid)} onChange={(e) => setScreenField("code", e.target.value)} helperText={screen.formGuid ? "كود Form_Name ثابت بعد الإنشاء" : "يتم توليده تلقائيًا إذا تركته فارغًا"} />
          <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }} size="small" label="ItemKey" value={screen.itemKey} disabled={Boolean(screen.formGuid)} onChange={(e) => setScreenField("itemKey", e.target.value)} helperText="مفتاح تقني ثابت مثل payment-follow" />
          <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }} size="small" label="Route" value={screen.route} onChange={(e) => setScreenField("route", e.target.value)} />
          <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }} size="small" label="وصف اختياري" value={screen.description || ""} onChange={(e) => setScreenField("description", e.target.value)} />

          <FormControl sx={uiLayout.formFieldSx} size="small">
            <InputLabel>طريقة الظهور</InputLabel>
            <Select value={screen.placement || "grouped"} label="طريقة الظهور" onChange={(e) => setScreenField("placement", e.target.value)}>
              <MenuItem value="grouped">داخل قائمة</MenuItem>
              <MenuItem value="standalone">تابة مستقلة</MenuItem>
            </Select>
          </FormControl>

          <Autocomplete
            disabled={screen.placement === "standalone"}
            size="small"
            options={data.groups}
            value={selectedMenu}
            getOptionLabel={(x) => `${x.name || x.title} (${x.code})`}
            isOptionEqualToValue={(a, b) => norm(a.groupGuid) === norm(b.groupGuid)}
            onChange={(_, value) => setScreenField("menuGuid", value?.groupGuid || "")}
            renderInput={(params) => <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }} {...params} label="القائمة الرئيسية" placeholder="اختر من القوائم المعرفة في WebSidebarGroup" />}
          />

          <Autocomplete
            freeSolo
            size="small"
            options={ICON_OPTIONS}
            value={screen.iconKey || ""}
            onChange={(_, value) => setScreenField("iconKey", value || "")}
            onInputChange={(_, value) => setScreenField("iconKey", value || "")}
            renderInput={(params) => <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }} {...params} label="IconKey" />}
          />
          <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }} size="small" type="number" label="الترتيب" value={screen.sortOrder} onChange={(e) => setScreenField("sortOrder", Number(e.target.value))} />
          <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }} size="small" label="Badge" value={screen.badgeText || ""} onChange={(e) => setScreenField("badgeText", e.target.value)} />
          <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }} size="small" label="Custom Badge" value={screen.customBadge || ""} onChange={(e) => setScreenField("customBadge", e.target.value)} />
        </Box>

        <Box sx={{ mt: 1.2, display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          <FormControlLabel control={<Checkbox checked={screen.isActive !== false} onChange={(e) => setScreenField("isActive", e.target.checked)} />} label="فعالة" />
          <FormControlLabel control={<Checkbox checked={screen.isNew === true} onChange={(e) => setScreenField("isNew", e.target.checked)} />} label="جديد" />
          <FormControlLabel control={<Checkbox checked={screen.desktopOnly === true} onChange={(e) => setScreenField("desktopOnly", e.target.checked)} />} label="ديسكتوب فقط" />
          <FormControlLabel control={<Checkbox checked={screen.bypassGroupPermission === true} onChange={(e) => setScreenField("bypassGroupPermission", e.target.checked)} />} label="تجاوز صلاحية القائمة الأم" />
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 1.2, md: 2 }, borderRadius: 3, borderColor: border }}>
        <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 0.8 }}>الصلاحيات</Typography>
        <Alert severity="info">
          لا يتم تحديد مستخدمين أو UserJop أو GUID من هذه الشاشة. بعد الحفظ، افتح <b>إضافة مستخدم ← القوائم والصلاحيات</b> وأعطِ الشاشة للمستخدمين المطلوبين. كل الشروط القديمة تم تحويلها في SQL إلى User_Premision للمستخدمين المطابقين وقت النقل.
        </Alert>
        {screen.formGuid && (
          <Stack direction="row" spacing={1} sx={{ mt: 1.2, flexWrap: "wrap" }}>
            <Chip color="success" label={`FormGuid: ${screen.formGuid}`} />
            <Chip label={`Code: ${screen.code || screen.formCode}`} />
            {selectedMenu && <Chip label={`القائمة: ${selectedMenu.name || selectedMenu.title}`} />}
          </Stack>
        )}
      </Paper>
    </Box>
  );

  const groupsEditor = (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "340px 1fr" }, gap: 1.3 }}>
      <Paper variant="outlined" sx={{ p: 1, borderRadius: 3, borderColor: border }}>
        <Button sx={uiLayout.buttonSx} fullWidth variant="outlined" startIcon={<AddIcon />} onClick={() => setGroup(emptyGroup())}>قائمة جديدة</Button>
        <Stack spacing={0.8} sx={{ mt: 1 }}>
          {data.groups.map((row) => (
            <Button key={row.groupGuid} variant={norm(group.groupGuid) === norm(row.groupGuid) ? "contained" : "outlined"} onClick={() => selectGroup(row)} sx={uiLayout.withUiSx({ justifyContent: "flex-start" }, uiLayout.buttonSx)}>
              <Box sx={{ width: "100%", textAlign: "start" }}>
                <Typography sx={{ fontWeight: 900 }}>{row.name || row.title}</Typography>
                <Typography sx={{ fontSize: 12, opacity: 0.7 }}>{row.code} · {row.groupKey}</Typography>
              </Box>
            </Button>
          ))}
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 1.2, md: 2 }, borderRadius: 3, borderColor: border }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={1}>
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: 20 }}>بيانات القائمة الرئيسية</Typography>
            <Typography color="text.secondary" sx={{ fontSize: 12 }}>الاسم هنا هو اسم القائمة في WebSidebarGroup؛ ويظهر بنفس الاسم في السايدبار وشاشة إضافة المستخدم.</Typography>
          </Box>
          <Stack sx={uiLayout.actionBarSx} direction="row" spacing={1}>
            {group.groupGuid && <Button sx={uiLayout.buttonSx} color="error" variant="outlined" startIcon={<DeleteOutlineIcon />} onClick={deleteGroup}>إيقاف</Button>}
            <Button sx={uiLayout.buttonSx} variant="contained" startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />} onClick={saveGroup} disabled={saving}>حفظ</Button>
          </Stack>
        </Stack>
        <Divider sx={{ my: 1.5 }} />
        <Box sx={uiLayout.withUiSx({ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2,minmax(0,1fr))" }, gap: 1.2 }, uiLayout.formGridSx)}>
          <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }} size="small" label="اسم القائمة" value={group.name || ""} onChange={(e) => setGroupField("name", e.target.value)} />
          <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }} size="small" label="كود صلاحية القائمة القديمة (اختياري)" value={group.code || group.permissionMenuCode || ""} onChange={(e) => setGroupField("code", e.target.value)} helperText="مثال: sales / report / maintools. اتركه فارغًا للقوائم الويب فقط." />
          <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }} size="small" label="GroupKey" value={group.groupKey || ""} disabled={Boolean(group.groupGuid)} onChange={(e) => setGroupField("groupKey", e.target.value)} />
          <Autocomplete freeSolo size="small" options={ICON_OPTIONS} value={group.iconKey || ""} onChange={(_, value) => setGroupField("iconKey", value || "")} onInputChange={(_, value) => setGroupField("iconKey", value || "")} renderInput={(params) => <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }} {...params} label="IconKey" />} />
          <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }} size="small" type="number" label="الترتيب" value={group.sortOrder} onChange={(e) => setGroupField("sortOrder", Number(e.target.value))} />
        </Box>
        <Box sx={{ mt: 1.2, display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          <FormControlLabel control={<Checkbox checked={group.isActive !== false} onChange={(e) => setGroupField("isActive", e.target.checked)} />} label="فعالة" />
          <FormControlLabel control={<Checkbox checked={group.showWhenEmpty === true} onChange={(e) => setGroupField("showWhenEmpty", e.target.checked)} />} label="إظهار لو فارغة" />
        </Box>
      </Paper>
    </Box>
  );

  const main = (
    <PageContainer
      dir="rtl"
      sx={uiLayout.withUiSx({
        minHeight: "100vh",
        width: "100%",
        boxSizing: "border-box",
        bgcolor: soft,
        p: { xs: 1, md: 2 }
      }, {})}
    >
      <Paper sx={{ bgcolor: primary, color: "white", p: { xs: 1.4, md: 2 }, borderRadius: 3, mb: 1.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1}>
            <TuneIcon />
            <Box>
              <Typography sx={{ fontWeight: 900, fontSize: { xs: 20, md: 25 } }}>إعدادات الشاشات والتابات</Typography>
              <Typography sx={{ opacity: 0.85, fontSize: 12 }}>Form_Name للشاشات · WebSidebarGroup للقوائم · UserManagement للصلاحيات</Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={0.5}>
            {!isDesktop && <IconButton color="inherit" onClick={() => setMobileSidebarOpen(true)}><MenuRoundedIcon /></IconButton>}
            <Tooltip title="تحديث"><IconButton color="inherit" onClick={() => loadBootstrap(true)}><RefreshIcon /></IconButton></Tooltip>
          </Stack>
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 1.2 }}>{error}</Alert>}
      <Paper variant="outlined" sx={{ borderRadius: 3, borderColor: border, mb: 1.5 }}>
        <Tabs value={section} onChange={(_, value) => setSection(value)}>
          <Tab icon={<ViewListIcon />} iconPosition="start" label="الشاشات والتابات" />
          <Tab icon={<SecurityIcon />} iconPosition="start" label="القوائم الرئيسية" />
        </Tabs>
      </Paper>

      {loading && !data.screens.length && (
        <Paper sx={{ p: 5, textAlign: "center", borderRadius: 3 }}><CircularProgress /><Typography sx={{ mt: 1 }}>جاري التحميل...</Typography></Paper>
      )}

      {section === 0 && (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(15rem, 0.8fr) minmax(0, 2fr)" }, gap: 1.3 }}>
          {screensList}
          {screenEditor}
        </Box>
      )}
      {section === 1 && groupsEditor}
    </PageContainer>
  );

  return (
    <NavigationShell variant="standard" mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)}><Box
      dir="rtl"
      sx={{
        minHeight: "100vh",
        width: "100%",
        direction: "rtl",
        bgcolor: soft
      }}
    >
      

      

      <Box
        sx={{
          minWidth: 0,
          direction: "rtl",
          boxSizing: "border-box",
          ...navigationContentSx
        }}
      >
        {main}
      </Box>
    </Box></NavigationShell>
  );
}
