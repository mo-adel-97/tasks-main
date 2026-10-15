// شاشة "أصناف الأصول": الإدارة بتحدد الأصناف (اسم، موديل، وصف، صورة)،
// وبتفتح/تقفل كل عملية للفروع: إضافة الموجود، الشراء، نقل العهدة، التكهين.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  FormControl,
  FormControlLabel,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography
} from "@mui/material";
import CategoryIcon from "@mui/icons-material/Category";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import { CenterLoader, EmptyState, NoAccess, SectionCard, SoftChip, TasksPageShell, confirmAction, multilineSx, showError, toast } from "../tasks/TasksUi";
import { formatDate, formatDateTime, useTasksPalette } from "../tasks/tasksCommon";
import { GATES, apiGet, apiPost, apiPostForm, tabFromUrl } from "./assetsCommon";
import { AuthImage, DialogHeader, FilterSelect, IconAction, ImagePicker, filterFieldSx } from "./AssetsUi";

const TABS = ["items", "categories", "settings"];

// =========================================================
// صنف
// =========================================================

const ItemDialog = ({ open, item, categories, onClose, onSaved, onDelete }) => {
  const p = useTasksPalette();
  const [form, setForm] = useState({});
  const [image, setImage] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setImage(null);
    setRemoveImage(false);
    setForm({
      name: item?.name || "",
      model: item?.model || "",
      description: item?.description || "",
      unit: item?.unit || "قطعة",
      categoryId: item?.categoryId ?? "",
      isActive: item ? item.isActive : true
    });
  }, [open, item]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    if (!String(form.name || "").trim()) return showError(new Error("يُرجى إدخال اسم الصنف"));
    try {
      setSaving(true);
      const json = await apiPostForm("/catalog/items", {
        id: item?.id,
        categoryId: form.categoryId,
        name: form.name.trim(),
        model: form.model.trim(),
        description: form.description.trim(),
        unit: form.unit.trim() || "قطعة",
        isActive: form.isActive ? "true" : "false",
        removeImage: removeImage && !image ? "true" : "",
        image
      });
      toast(json?.message || "تم الحفظ");
      onSaved();
      onClose();
    } catch (e) {
      showError(e);
    } finally {
      setSaving(false);
    }
  };

  const existing = item?.hasImage && !removeImage ? <AuthImage kind="catalog" guid={item.guid} height={216} title={item.name} /> : null;

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="md" PaperProps={{ sx: { direction: "rtl" } }}>
      <DialogHeader icon={<CategoryIcon />} title={item ? "تعديل صنف" : "صنف أصول جديد"} onClose={onClose} disabled={saving} />
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} md={7}>
            <Stack spacing={1.75}>
              <TextField label="اسم الصنف *" value={form.name || ""} onChange={(e) => set("name", e.target.value)} inputProps={{ maxLength: 200 }} fullWidth autoFocus />
              <Stack direction="row" spacing={1.5}>
                <TextField label="الموديل" value={form.model || ""} onChange={(e) => set("model", e.target.value)} inputProps={{ maxLength: 100 }} fullWidth />
                <TextField label="الوحدة" value={form.unit || ""} onChange={(e) => set("unit", e.target.value)} inputProps={{ maxLength: 50 }} sx={{ width: 150 }} />
              </Stack>
              <FormControl fullWidth>
                <InputLabel>المجموعة</InputLabel>
                <Select label="المجموعة" value={form.categoryId ?? ""} onChange={(e) => set("categoryId", e.target.value)}>
                  <MenuItem value="">بدون مجموعة</MenuItem>
                  {categories.map((c) => (
                    <MenuItem key={c.id} value={c.id}>{c.name}{c.isActive ? "" : " (موقوفة)"}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="الوصف"
                placeholder="مثال: كرسي محاضرات مع مخدع خشبي — ضمان عام ضد عيوب التصنيع"
                value={form.description || ""}
                onChange={(e) => set("description", e.target.value)}
                multiline
                minRows={4}
                inputProps={{ maxLength: 1000 }}
                fullWidth
                sx={multilineSx(96, 220)}
              />
              <FormControlLabel
                control={<Switch checked={Boolean(form.isActive)} onChange={(e) => set("isActive", e.target.checked)} />}
                label={form.isActive ? "الصنف متاح للفروع" : "الصنف موقوف (لن يظهر للفروع عند الإضافة)"}
              />
            </Stack>
          </Grid>
          <Grid item xs={12} md={5}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 0.75 }}>صورة الصنف</Typography>
            <ImagePicker file={image} onChange={setImage} existing={existing} height={220} />
            {item?.hasImage && !removeImage && !image ? (
              <Button size="small" color="error" onClick={() => setRemoveImage(true)} sx={{ mt: 0.5 }}>حذف الصورة</Button>
            ) : null}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5, ...p.containedSx }}>
        {item && onDelete ? (
          <Button color="error" startIcon={<DeleteOutlineIcon />} disabled={saving} onClick={() => onDelete(item)} sx={{ ml: "auto" }}>
            حذف الصنف
          </Button>
        ) : null}
        <Button onClick={onClose} disabled={saving}>إلغاء</Button>
        <Button variant="contained" onClick={save} disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>حفظ</Button>
      </DialogActions>
    </Dialog>
  );
};

// =========================================================
// مجموعة
// =========================================================

const CategoryDialog = ({ open, category, onClose, onSaved }) => {
  const p = useTasksPalette();
  const [name, setName] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(category?.name || "");
    setSortOrder(String(category?.sortOrder ?? 0));
    setIsActive(category ? category.isActive : true);
  }, [open, category]);

  const save = async () => {
    if (!name.trim()) return showError(new Error("يُرجى إدخال اسم المجموعة"));
    try {
      setSaving(true);
      await apiPost("/catalog/categories", { id: category?.id ?? null, name: name.trim(), sortOrder: Number(sortOrder) || 0, isActive });
      toast("تم حفظ المجموعة");
      onSaved();
      onClose();
    } catch (e) {
      showError(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="xs" PaperProps={{ sx: { direction: "rtl" } }}>
      <DialogHeader title={category ? "تعديل مجموعة" : "مجموعة جديدة"} subtitle="مثال: أثاث، أجهزة كمبيوتر، تكييفات" onClose={onClose} disabled={saving} />
      <DialogContent>
        <Stack spacing={1.75} sx={{ mt: 1 }}>
          <TextField label="اسم المجموعة *" value={name} onChange={(e) => setName(e.target.value)} inputProps={{ maxLength: 150 }} fullWidth autoFocus />
          <TextField label="الترتيب" type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} fullWidth />
          <FormControlLabel control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />} label={isActive ? "مفعّلة" : "موقوفة"} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5, ...p.containedSx }}>
        <Button onClick={onClose} disabled={saving}>إلغاء</Button>
        <Button variant="contained" onClick={save} disabled={saving}>حفظ</Button>
      </DialogActions>
    </Dialog>
  );
};

// =========================================================
// فتح وإغلاق العمليات
// =========================================================

const dateOnly = (value) => (value ? String(value).slice(0, 10) : "");
const isExpired = (gate) => gate?.allow && gate?.until && dateOnly(gate.until) < new Date().toISOString().slice(0, 10);

const GateChip = ({ gate, muted }) => {
  const open = gate?.allow && !isExpired(gate);
  const label = open
    ? `مفتوحة${gate.until ? ` حتى ${formatDate(gate.until)}` : ""}`
    : isExpired(gate)
      ? `انتهت في ${formatDate(gate.until)}`
      : "مغلقة";
  return (
    <Box sx={{ opacity: muted ? 0.55 : 1, display: "inline-flex" }}>
      <SoftChip icon={open ? <LockOpenOutlinedIcon /> : <LockOutlinedIcon />} color={open ? "#059669" : "#dc2626"} label={label} />
    </Box>
  );
};

// تعديل العمليات الأربعة لسطر واحد (كل الفروع أو فرع).
const GatesDialog = ({ open, title, value, inherited, onClose, onSave, onReset }) => {
  const p = useTasksPalette();
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const next = {};
    GATES.forEach((g) => {
      next[g.key] = { allow: Boolean(value?.[g.key]?.allow), until: dateOnly(value?.[g.key]?.until) };
    });
    setForm(next);
  }, [open, value]);

  const set = (key, patch) => setForm((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  const run = async (fn) => {
    try {
      setSaving(true);
      await fn();
      onClose();
    } catch (e) {
      showError(e);
    } finally {
      setSaving(false);
    }
  };

  const body = () =>
    Object.fromEntries(GATES.map((g) => [g.key, { allow: Boolean(form[g.key]?.allow), until: form[g.key]?.allow && form[g.key]?.until ? form[g.key].until : null }]));

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { direction: "rtl" } }}>
      <DialogHeader icon={<LockOpenOutlinedIcon />} title={`فتح العمليات وإغلاقها — ${title}`} subtitle="التاريخ اختياري: تُغلق العملية تلقائيًا بعده" onClose={onClose} disabled={saving} />
      <DialogContent dividers>
        {inherited ? (
          <Alert severity="info" sx={{ mb: 1.5, fontWeight: 600 }}>
            هذا الفرع يتبع حاليًا إعداد جميع الفروع، وبالحفظ يصبح له إعداد خاص.
          </Alert>
        ) : null}
        <Stack spacing={1.25}>
          {GATES.map((g) => (
            <Stack
              key={g.key}
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              alignItems={{ xs: "stretch", sm: "center" }}
              justifyContent="space-between"
              sx={{ p: 1.25, borderRadius: 2.5, border: `1px solid ${p.border}` }}
            >
              <FormControlLabel
                sx={{ m: 0 }}
                control={<Switch checked={Boolean(form[g.key]?.allow)} onChange={(e) => set(g.key, { allow: e.target.checked })} />}
                label={
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{g.label}</Typography>
                    <Typography sx={{ fontSize: 12, color: form[g.key]?.allow ? "#059669" : "#dc2626" }}>
                      {form[g.key]?.allow ? "مفتوحة" : "مغلقة"}
                    </Typography>
                  </Box>
                }
              />
              <TextField
                size="small"
                type="date"
                label="حتى تاريخ (اختياري)"
                value={form[g.key]?.until || ""}
                disabled={!form[g.key]?.allow}
                onChange={(e) => set(g.key, { until: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={filterFieldSx(190)}
              />
            </Stack>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5, gap: 1, flexWrap: "wrap", ...p.containedSx }}>
        {onReset ? (
          <Button color="warning" disabled={saving} onClick={() => run(onReset)} sx={{ ml: "auto" }}>
            العودة إلى الإعداد العام
          </Button>
        ) : null}
        <Button onClick={onClose} disabled={saving}>إلغاء</Button>
        <Button variant="contained" disabled={saving} onClick={() => run(() => onSave(body()))} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>
          حفظ
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// =========================================================
// الشاشة
// =========================================================

const AssetsCatalogPage = () => {
  const p = useTasksPalette();
  const [boot, setBoot] = useState(null);
  const [bootError, setBootError] = useState("");
  const [catalog, setCatalog] = useState(null);
  const [settings, setSettings] = useState(null);
  const [tab, setTab] = useState(() => tabFromUrl(TABS, "items"));
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [itemDialog, setItemDialog] = useState({ open: false, item: null });
  const [categoryDialog, setCategoryDialog] = useState({ open: false, category: null });
  // { title, branchGuid (null = كل الفروع), value, inherited }
  const [gatesFor, setGatesFor] = useState(null);

  useEffect(() => {
    apiGet("/bootstrap")
      .then(setBoot)
      .catch((e) => setBootError(e.status === 403 ? "ليس لديك صلاحية على أصناف الأصول" : e.message));
  }, []);

  const loadCatalog = useCallback(() => {
    apiGet("/catalog", { includeInactive: "true" }).then(setCatalog).catch(showError);
  }, []);

  const loadSettings = useCallback(() => {
    apiGet("/settings").then(setSettings).catch(showError);
  }, []);

  useEffect(() => {
    if (!boot?.access?.catalog) return;
    loadCatalog();
    loadSettings();
  }, [boot, loadCatalog, loadSettings]);

  const items = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (catalog?.items || []).filter(
      (i) =>
        (categoryFilter === "" || String(i.categoryId ?? "none") === String(categoryFilter)) &&
        (!q || [i.name, i.model, i.description, i.categoryName].join(" ").toLowerCase().includes(q))
    );
  }, [catalog, search, categoryFilter]);

  if (bootError) return <NoAccess message={bootError} />;
  if (!boot) return <CenterLoader />;
  if (!boot.access.catalog) return <NoAccess message="ليس لديك صلاحية على أصناف الأصول" />;

  const canEdit = boot.access.catalogEdit;
  const canDelete = boot.access.catalogDelete;

  const deleteItem = async (item) => {
    if (!(await confirmAction("حذف الصنف نهائيًا؟", `${item.name} — لا يمكن حذف صنف مستخدم في عهدة الفروع، ويمكن إيقافه بدلًا من ذلك`, true))) return;
    try {
      const json = await apiPost(`/catalog/items/${item.id}/delete`);
      toast(json?.message || "تم حذف الصنف");
      setItemDialog({ open: false, item: null });
      loadCatalog();
    } catch (e) {
      showError(e);
    }
  };

  const deleteCategory = async (category) => {
    if (!(await confirmAction("حذف المجموعة؟", category.name, true))) return;
    try {
      const json = await apiPost(`/catalog/categories/${category.id}/delete`);
      toast(json?.message || "تم حذف المجموعة");
      loadCatalog();
    } catch (e) {
      showError(e);
    }
  };
  const categories = catalog?.categories || [];
  const branchSetting = (guid) => (settings?.branches || []).find((b) => b.branchGuid === guid);

  // الأخطاء بتتعرض من ديالوج التعديل نفسه.
  const saveSetting = async (branchGuid, body) => {
    await apiPost("/settings", { branchGuid, ...body });
    toast("تم الحفظ");
    loadSettings();
  };

  const resetSetting = async (branchGuid) => {
    await apiPost("/settings", { branchGuid, reset: true });
    toast("أصبح الفرع يتبع إعداد جميع الفروع");
    loadSettings();
  };

  const globalSetting = settings?.global;
  const anyOpen = globalSetting && GATES.some((g) => globalSetting[g.key]?.allow && !isExpired(globalSetting[g.key]));

  return (
    <TasksPageShell
      icon={<CategoryIcon />}
      title="أصناف الأصول"
      subtitle="الأصناف التي تضيف الفروع منها أصولها، وفتح عمليات الفروع وإغلاقها"
      actions={
        canEdit ? (
          tab === "categories" ? (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCategoryDialog({ open: true, category: null })}>مجموعة جديدة</Button>
          ) : tab === "items" ? (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setItemDialog({ open: true, item: null })}>صنف جديد</Button>
          ) : null
        ) : null
      }
    >
      {globalSetting && !anyOpen ? (
        <Alert severity="warning" sx={{ mb: 2, fontWeight: 600 }}>
          كل العمليات مغلقة أمام الفروع حاليًا. افتح ما تريده من تبويب "فتح العمليات وإغلاقها" بعد الانتهاء من إعداد الأصناف.
          {(settings?.branches || []).length ? ` (يوجد ${settings.branches.length} فرع لها إعداد خاص)` : ""}
        </Alert>
      ) : null}

      <SectionCard sx={{ mb: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} alignItems={{ xs: "stretch", md: "center" }} justifyContent="space-between" spacing={1} sx={{ px: 1.5, py: 0.5 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ "& .MuiTab-root": { fontWeight: 700 } }}>
            <Tab value="items" label={`الأصناف (${catalog?.items?.length ?? 0})`} />
            <Tab value="categories" label={`المجموعات (${categories.length})`} />
            <Tab value="settings" label="فتح العمليات وإغلاقها" />
          </Tabs>
          {tab === "items" ? (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ pb: { xs: 1, md: 0 } }}>
              <FilterSelect
                label="المجموعة"
                value={categoryFilter}
                onChange={setCategoryFilter}
                allLabel="كل المجموعات"
                width={190}
                options={[...categories.map((c) => ({ value: c.id, label: c.name })), { value: "none", label: "بدون مجموعة" }]}
              />
              <TextField
                size="small"
                placeholder="بحث"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={filterFieldSx(220)}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
              />
            </Stack>
          ) : null}
        </Stack>
      </SectionCard>

      {!catalog ? <CenterLoader /> : null}

      {catalog && tab === "items" ? (
        items.length ? (
          <Grid container spacing={1.5}>
            {items.map((i) => (
              <Grid item xs={12} sm={6} lg={4} xl={3} key={i.id}>
                <SectionCard sx={{ overflow: "hidden", height: "100%", display: "flex", flexDirection: "column", opacity: i.isActive ? 1 : 0.6 }}>
                  <Box sx={{ p: 1.25, pb: 0 }}>
                    <AuthImage kind="catalog" guid={i.hasImage ? i.guid : null} height={170} title={i.name} />
                  </Box>
                  <Box sx={{ p: 1.5, flex: 1, display: "flex", flexDirection: "column" }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 700 }}>{i.name}</Typography>
                        <Typography sx={{ fontSize: 12.5, color: p.muted }}>
                          {[i.model && `موديل ${i.model}`, i.unit].filter(Boolean).join(" · ")}
                        </Typography>
                      </Box>
                      {canEdit ? (
                        <IconAction title="تعديل" onClick={() => setItemDialog({ open: true, item: i })}><EditOutlinedIcon fontSize="small" /></IconAction>
                      ) : null}
                    </Stack>
                    {i.description ? (
                      <Typography sx={{ fontSize: 12.5, color: p.muted, mt: 0.75, whiteSpace: "pre-wrap", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {i.description}
                      </Typography>
                    ) : null}
                    <Stack direction="row" spacing={0.75} sx={{ mt: "auto", pt: 1 }} flexWrap="wrap" useFlexGap>
                      {i.categoryName ? <SoftChip label={i.categoryName} color="#2563eb" /> : null}
                      {!i.isActive ? <SoftChip label="موقوف" color="#dc2626" /> : null}
                    </Stack>
                  </Box>
                </SectionCard>
              </Grid>
            ))}
          </Grid>
        ) : (
          <EmptyState text="لا توجد أصناف" hint={canEdit ? "ابدأ بإضافة المجموعات (أثاث، أجهزة...) ثم الأصناف مع صورها" : undefined} />
        )
      ) : null}

      {catalog && tab === "categories" ? (
        categories.length ? (
          <SectionCard>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>المجموعة</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">عدد الأصناف</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">الترتيب</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>الحالة</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categories.map((c) => (
                    <TableRow key={c.id} hover>
                      <TableCell sx={{ fontWeight: 700 }}>{c.name}</TableCell>
                      <TableCell align="center">{c.itemsCount}</TableCell>
                      <TableCell align="center">{c.sortOrder}</TableCell>
                      <TableCell>{c.isActive ? <SoftChip label="مفعّلة" color="#059669" /> : <SoftChip label="موقوفة" color="#dc2626" />}</TableCell>
                      <TableCell align="center">
                        {canEdit ? (
                          <IconAction title="تعديل" onClick={() => setCategoryDialog({ open: true, category: c })}><EditOutlinedIcon fontSize="small" /></IconAction>
                        ) : null}
                        {canDelete ? (
                          <IconAction title="حذف" color="error" onClick={() => deleteCategory(c)}><DeleteOutlineIcon fontSize="small" /></IconAction>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </SectionCard>
        ) : (
          <EmptyState text="لا توجد مجموعات" hint="المجموعات اختيارية وتساعد في تنظيم الأصناف والتقارير" />
        )
      ) : null}

      {tab === "settings" ? (
        settings ? (
          <SectionCard>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, minWidth: 170 }}>الفرع</TableCell>
                    {GATES.map((g) => (
                      <TableCell key={g.key} sx={{ fontWeight: 700, minWidth: 150 }}>{g.label}</TableCell>
                    ))}
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow sx={{ bgcolor: p.nested }}>
                    <TableCell>
                      <Typography sx={{ fontWeight: 800 }}>جميع الفروع</Typography>
                      <Typography sx={{ fontSize: 11.5, color: p.muted }}>
                        {globalSetting?.updatedBy ? `آخر تعديل: ${globalSetting.updatedBy} — ${formatDateTime(globalSetting.updatedAt)}` : "الإعداد الافتراضي لأي فرع ليس له إعداد خاص"}
                      </Typography>
                    </TableCell>
                    {GATES.map((g) => (
                      <TableCell key={g.key}><GateChip gate={globalSetting?.[g.key]} /></TableCell>
                    ))}
                    <TableCell align="center">
                      {canEdit ? (
                        <Button size="small" variant="contained" startIcon={<EditOutlinedIcon />} onClick={() => setGatesFor({ title: "جميع الفروع", branchGuid: null, value: globalSetting, inherited: false })}>
                          تعديل
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                  {boot.branches.map((b) => {
                    const own = branchSetting(b.guid);
                    const value = own || globalSetting;
                    return (
                      <TableRow key={b.guid} hover>
                        <TableCell>
                          <Typography sx={{ fontWeight: 700 }}>{b.name}</Typography>
                          <Typography sx={{ fontSize: 11.5, color: own ? "#2563eb" : p.muted }}>{own ? "إعداد خاص بالفرع" : "يتبع إعداد جميع الفروع"}</Typography>
                        </TableCell>
                        {GATES.map((g) => (
                          <TableCell key={g.key}><GateChip gate={value?.[g.key]} muted={!own} /></TableCell>
                        ))}
                        <TableCell align="center">
                          {canEdit ? (
                            <IconAction title="تعديل" onClick={() => setGatesFor({ title: b.name, branchGuid: b.guid, value, inherited: !own, hasOwn: Boolean(own) })}>
                              <EditOutlinedIcon fontSize="small" />
                            </IconAction>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </SectionCard>
        ) : (
          <CenterLoader />
        )
      ) : null}

      <GatesDialog
        open={Boolean(gatesFor)}
        title={gatesFor?.title || ""}
        value={gatesFor?.value}
        inherited={gatesFor?.inherited}
        onClose={() => setGatesFor(null)}
        onSave={(body) => saveSetting(gatesFor.branchGuid, body)}
        onReset={gatesFor?.hasOwn ? () => resetSetting(gatesFor.branchGuid) : null}
      />

      <ItemDialog
        open={itemDialog.open}
        item={itemDialog.item}
        categories={categories}
        onClose={() => setItemDialog({ open: false, item: null })}
        onSaved={loadCatalog}
        onDelete={canDelete ? deleteItem : null}
      />
      <CategoryDialog
        open={categoryDialog.open}
        category={categoryDialog.category}
        onClose={() => setCategoryDialog({ open: false, category: null })}
        onSaved={loadCatalog}
      />
    </TasksPageShell>
  );
};

export default AssetsCatalogPage;
