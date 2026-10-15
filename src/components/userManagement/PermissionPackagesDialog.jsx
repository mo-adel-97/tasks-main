import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import {
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
  FormControlLabel,
  IconButton,
  InputAdornment,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import Swal from "sweetalert2";

/*
  باكدجات الصلاحيات + نسخ صلاحيات مستخدم — شاشة إضافة مستخدم.
  mode:
    "apply"  => اختيار باكدج وتطبيقه على المستخدم المفتوح (دمج / استبدال)
    "copy"   => اختيار مستخدم ونسخ صلاحياته على المستخدم المفتوح
    "manage" => إضافة / تعديل / حذف الباكدجات
  التطبيق والنسخ بيعدلوا الشاشة بس، والحفظ الفعلي من زر "حفظ" العادي.
*/

const primary = "#057546";
const primaryDark = "#034d31";

const FLAGS = [
  { key: "add", label: "جديد" },
  { key: "edit", label: "تعديل" },
  { key: "del", label: "حذف/إلغاء" },
  { key: "print", label: "طباعة" },
  { key: "find", label: "بحث" },
  { key: "view", label: "عرض" }
];

const norm = (value) => String(value ?? "").trim().toLowerCase();

const readJson = async (response, fallback) => {
  const json = await response.json().catch(() => null);
  if (!response.ok) throw new Error([json?.message, json?.error].filter(Boolean).join(" — ") || fallback);
  return json;
};

const titleSx = {
  fontWeight: 900,
  color: "#fff",
  background: `linear-gradient(135deg, ${primary}, ${primaryDark})`,
  display: "flex",
  alignItems: "center",
  gap: 1
};

// ===================== اختيار طريقة التطبيق =====================
const ApplyModePicker = ({ value, onChange }) => (
  <Paper variant="outlined" sx={{ p: 1.2, mt: 1.5, borderRadius: 2 }}>
    <Typography sx={{ fontWeight: 800, mb: 0.5 }}>طريقة التطبيق</Typography>
    <RadioGroup row value={value} onChange={(e) => onChange(e.target.value)}>
      <FormControlLabel value="merge" control={<Radio size="small" />} label="دمج مع صلاحيات المستخدم الحالية" />
      <FormControlLabel value="replace" control={<Radio size="small" />} label="استبدال صلاحيات المستخدم بالكامل" />
    </RadioGroup>
  </Paper>
);

// ===================== أجزاء المحرر (Memo) =====================
// الجدول فيه مئات الشاشات × 7 خانات، فلازم ما يترسمش مع كل حرف في الاسم/الوصف،
// وتعليم خانة يرسم الصف بتاعها بس.

const EMPTY_FLAGS = Object.freeze({});
const thSx = { fontWeight: 900, position: "sticky", top: 0, background: primary, color: "#fff", zIndex: 1, whiteSpace: "nowrap" };

const FormRow = React.memo(({ form, flags, onToggleFlag, onToggleRow }) => {
  const all = FLAGS.every((x) => flags[x.key]);
  const some = FLAGS.some((x) => flags[x.key]);
  return (
    <tr>
      <Box component="td" sx={{ textAlign: "right !important", px: "12px !important" }}>
        <Stack direction="row" spacing={0.8} alignItems="center">
          <Typography sx={{ fontWeight: some ? 900 : 600, fontSize: "0.85rem" }}>{form.name}</Typography>
          <Chip size="small" label={form.platform === "web" ? "ويب" : "ديسكتوب"} sx={{ height: 18, fontSize: "0.65rem" }} />
        </Stack>
      </Box>
      <td>
        <Checkbox size="small" disableRipple checked={all} indeterminate={some && !all} onChange={() => onToggleRow(form.guid)} />
      </td>
      {FLAGS.map((x) => (
        <td key={x.key}>
          <Checkbox size="small" disableRipple checked={Boolean(flags[x.key])} onChange={() => onToggleFlag(form.guid, x.key)} />
        </td>
      ))}
    </tr>
  );
});

const FormsTable = React.memo(({ forms, perms, onToggleFlag, onToggleRow }) => (
  <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", "& th, & td": { borderTop: "1px solid #e3ebe7", p: 0.5, textAlign: "center" } }}>
    <thead>
      <tr>
        <Box component="th" sx={{ ...thSx, textAlign: "right !important", px: "12px !important" }}>الشاشة</Box>
        <Box component="th" sx={thSx}>الكل</Box>
        {FLAGS.map((f) => (
          <Box component="th" key={f.key} sx={thSx}>{f.label}</Box>
        ))}
      </tr>
    </thead>
    <tbody>
      {forms.map((f) => (
        <FormRow key={f.guid} form={f} flags={perms[norm(f.guid)] || EMPTY_FLAGS} onToggleFlag={onToggleFlag} onToggleRow={onToggleRow} />
      ))}
    </tbody>
  </Box>
));

const MenusBlock = React.memo(({ menus, menuSet, onToggle }) => (
  <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 2 }}>
    <Typography sx={{ fontWeight: 900, mb: 0.5 }}>القوائم الرئيسية</Typography>
    <Stack direction="row" flexWrap="wrap" useFlexGap>
      {menus.map((m) => (
        <FormControlLabel
          key={m.guid}
          control={<Checkbox size="small" disableRipple checked={menuSet.has(norm(m.guid))} onChange={() => onToggle(m.guid)} />}
          label={m.name}
          sx={{ minWidth: 150 }}
        />
      ))}
    </Stack>
  </Paper>
));

// ===================== محرر الباكدج =====================
const PackageEditor = ({ open, onClose, onSaved, packageGuid, apiBaseUrl, userGuid, menus, forms, currentState }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [menuSet, setMenuSet] = useState(new Set());
  const [perms, setPerms] = useState({}); // formGuid(norm) => flags
  const [search, setSearch] = useState("");
  const [onlySelected, setOnlySelected] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSearch("");
    setOnlySelected(Boolean(packageGuid));

    if (!packageGuid) {
      setName("");
      setDescription("");
      setMenuSet(new Set());
      setPerms({});
      return;
    }

    setLoading(true);
    fetch(`${apiBaseUrl}/api/user-management/packages/${packageGuid}?userGuid=${encodeURIComponent(userGuid)}`, { cache: "no-store" })
      .then((r) => readJson(r, "تعذر تحميل الباكدج"))
      .then((json) => {
        const d = json?.data || {};
        setName(d.name || "");
        setDescription(d.description || "");
        setMenuSet(new Set((d.menus || []).filter((m) => m.view).map((m) => norm(m.guid))));
        const map = {};
        (d.permissions || []).forEach((p) => {
          map[norm(p.guid)] = FLAGS.reduce((acc, f) => ({ ...acc, [f.key]: Boolean(p[f.key]) }), {});
        });
        setPerms(map);
      })
      .catch((e) => Swal.fire({ icon: "error", title: "خطأ", text: e.message }))
      .finally(() => setLoading(false));
  }, [open, packageGuid, apiBaseUrl, userGuid]);

  const selectedCount = useMemo(
    () => Object.values(perms).filter((f) => FLAGS.some((x) => f[x.key])).length,
    [perms]
  );

  // البحث بيتأخر لحظة عن الكتابة علشان الإدخال يفضل سريع.
  const deferredSearch = useDeferredValue(search);

  // "المختارة فقط" بتتحسب وقت تفعيلها / بعد تحميل الباكدج، علشان الصف ما يختفيش وإنت بتشيل علامة منه.
  const [pinnedSelection, setPinnedSelection] = useState(null);
  const pinFrom = (map) => new Set(Object.entries(map).filter(([, f]) => FLAGS.some((x) => f[x.key])).map(([k]) => k));

  useEffect(() => {
    if (!loading) setPinnedSelection(onlySelected ? pinFrom(perms) : null);
    // perms مقصود مش في الـ deps: التحديد بيتثبت وقت التفعيل/التحميل بس.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlySelected, loading]);

  const visibleForms = useMemo(() => {
    const q = norm(deferredSearch);
    return forms.filter((f) => {
      if (pinnedSelection && !pinnedSelection.has(norm(f.guid))) return false;
      return !q || norm(f.name).includes(q) || norm(f.code).includes(q);
    });
  }, [forms, deferredSearch, pinnedSelection]);

  const toggleFlag = useCallback(
    (guid, key) =>
      setPerms((prev) => {
        const k = norm(guid);
        const current = prev[k] || {};
        return { ...prev, [k]: { ...current, [key]: !current[key] } };
      }),
    []
  );

  const toggleRow = useCallback(
    (guid) =>
      setPerms((prev) => {
        const k = norm(guid);
        const all = FLAGS.every((x) => prev[k]?.[x.key]);
        return { ...prev, [k]: FLAGS.reduce((acc, f) => ({ ...acc, [f.key]: !all }), {}) };
      }),
    []
  );

  const toggleMenu = useCallback(
    (guid) =>
      setMenuSet((prev) => {
        const next = new Set(prev);
        const k = norm(guid);
        if (next.has(k)) next.delete(k);
        else next.add(k);
        return next;
      }),
    []
  );

  // يملأ المحرر من صلاحيات المستخدم المفتوح في الشاشة.
  const importFromCurrent = () => {
    setMenuSet(new Set((currentState?.menus || []).filter((m) => m.view).map((m) => norm(m.guid))));
    const map = {};
    (currentState?.permissions || []).forEach((p) => {
      map[norm(p.guid)] = FLAGS.reduce((acc, f) => ({ ...acc, [f.key]: Boolean(p[f.key]) }), {});
    });
    setPerms(map);
    setOnlySelected(true);
    setPinnedSelection(pinFrom(map));
  };

  const save = async () => {
    if (!name.trim()) {
      Swal.fire({ icon: "warning", title: "تنبيه", text: "برجاء إدخال اسم الباكدج" });
      return;
    }

    try {
      setSaving(true);
      const json = await readJson(
        await fetch(`${apiBaseUrl}/api/user-management/packages${packageGuid ? `/${packageGuid}` : ""}`, {
          method: packageGuid ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            actorUserGuid: userGuid,
            name: name.trim(),
            description: description.trim(),
            menus: menus.filter((m) => menuSet.has(norm(m.guid))).map((m) => ({ guid: m.guid, view: true })),
            permissions: forms
              .filter((f) => FLAGS.some((x) => perms[norm(f.guid)]?.[x.key]))
              .map((f) => ({ guid: f.guid, ...FLAGS.reduce((acc, x) => ({ ...acc, [x.key]: Boolean(perms[norm(f.guid)]?.[x.key]) }), {}) }))
          })
        }),
        "تعذر حفظ الباكدج"
      );
      await Swal.fire({ icon: "success", title: json?.message || "تم الحفظ", timer: 1400, showConfirmButton: false });
      onSaved?.();
    } catch (e) {
      Swal.fire({ icon: "error", title: "تعذر الحفظ", text: e.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} fullScreen={isMobile} fullWidth maxWidth="lg" disableEnforceFocus PaperProps={{ sx: { direction: "rtl", height: isMobile ? "100dvh" : "90vh" } }}>
      <DialogTitle sx={titleSx}>
        <Inventory2Icon />
        {packageGuid ? "تعديل باكدج صلاحيات" : "باكدج صلاحيات جديد"}
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Stack alignItems="center" sx={{ py: 6 }}><CircularProgress sx={{ color: primary }} /></Stack>
        ) : (
          <Stack spacing={1.5}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
              <TextField label="اسم الباكدج *" value={name} onChange={(e) => setName(e.target.value)} size="small" fullWidth placeholder="مثلاً: باكدج مدرب" InputLabelProps={{ shrink: true }} />
              <TextField label="الوصف" value={description} onChange={(e) => setDescription(e.target.value)} size="small" fullWidth InputLabelProps={{ shrink: true }} />
            </Stack>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
              <Button size="small" variant="outlined" startIcon={<ContentCopyIcon />} onClick={importFromCurrent} sx={{ fontWeight: 800 }}>
                نسخ صلاحيات المستخدم المفتوح في الشاشة
              </Button>
              <Chip label={`${selectedCount} شاشة`} color="success" variant="outlined" sx={{ fontWeight: 800 }} />
              <Chip label={`${menuSet.size} قائمة`} color="success" variant="outlined" sx={{ fontWeight: 800 }} />
            </Stack>

            <MenusBlock menus={menus} menuSet={menuSet} onToggle={toggleMenu} />

            <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ p: 1.2 }} alignItems={{ sm: "center" }}>
                <Typography sx={{ fontWeight: 900, flexShrink: 0 }}>الشاشات والصلاحيات</Typography>
                <TextField
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث في الشاشات..."
                  size="small"
                  fullWidth
                  InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                />
                <FormControlLabel control={<Checkbox size="small" checked={onlySelected} onChange={(e) => setOnlySelected(e.target.checked)} />} label="المختارة فقط" sx={{ flexShrink: 0 }} />
              </Stack>
              <Box sx={{ maxHeight: isMobile ? "none" : 380, overflow: "auto" }}>
                <FormsTable forms={visibleForms} perms={perms} onToggleFlag={toggleFlag} onToggleRow={toggleRow} />
                {!visibleForms.length ? (
                  <Typography sx={{ textAlign: "center", py: 3, color: "text.secondary", fontWeight: 700 }}>
                    {onlySelected ? "لا توجد شاشات مختارة — شيل علامة \"المختارة فقط\" لاختيار شاشات" : "لا توجد نتائج"}
                  </Typography>
                ) : null}
              </Box>
            </Paper>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ gap: 1 }}>
        <Button onClick={onClose} disabled={saving} sx={{ fontWeight: 900, color: "#ae1e21" }}>إلغاء</Button>
        <Button variant="contained" onClick={save} disabled={saving || loading} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null} sx={{ fontWeight: 900, backgroundColor: primary, "&:hover": { backgroundColor: primaryDark } }}>
          حفظ الباكدج
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ===================== الشاشة الرئيسية =====================
const PermissionPackagesDialog = ({ mode, onClose, apiBaseUrl, userGuid, menus, forms, currentState, currentUserName, onApply }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const open = Boolean(mode);

  const [packages, setPackages] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [applyMode, setApplyMode] = useState("merge");
  const [applying, setApplying] = useState(false);
  const [editor, setEditor] = useState({ open: false, guid: null });

  const loadPackages = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const json = await readJson(
        await fetch(`${apiBaseUrl}/api/user-management/packages?userGuid=${encodeURIComponent(userGuid)}`, { cache: "no-store" }),
        "تعذر تحميل الباكدجات"
      );
      setPackages(Array.isArray(json?.data) ? json.data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, userGuid]);

  useEffect(() => {
    if (!open) return;
    setSearch("");
    setSelected(null);
    setApplyMode("merge");
    setError("");
    if (mode !== "copy") loadPackages();
  }, [open, mode, loadPackages]);

  // البحث عن المستخدمين (نسخ الصلاحيات).
  useEffect(() => {
    if (mode !== "copy") return undefined;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ userGuid, q: search || "" });
        const json = await readJson(await fetch(`${apiBaseUrl}/api/user-management/users?${params}`, { cache: "no-store" }), "تعذر تحميل المستخدمين");
        if (!cancelled) setUsers(Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : []);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [mode, search, apiBaseUrl, userGuid]);

  const filteredPackages = useMemo(() => {
    const q = norm(search);
    return q ? packages.filter((p) => norm(p.name).includes(q) || norm(p.description).includes(q)) : packages;
  }, [packages, search]);

  const confirmApply = async () => {
    if (!selected) return;

    if (applyMode === "replace") {
      const ok = await Swal.fire({
        icon: "warning",
        title: "استبدال الصلاحيات",
        text: `هيتم مسح صلاحيات ${currentUserName || "المستخدم"} الحالية في الشاشة واستبدالها. الحفظ الفعلي بيتم لما تدوس حفظ.`,
        showCancelButton: true,
        confirmButtonText: "استبدال",
        cancelButtonText: "رجوع",
        confirmButtonColor: "#ae1e21"
      });
      if (!ok.isConfirmed) return;
    }

    try {
      setApplying(true);
      let set;
      let label;

      if (mode === "copy") {
        const json = await readJson(
          await fetch(`${apiBaseUrl}/api/user-management/users/${encodeURIComponent(selected.code)}?userGuid=${encodeURIComponent(userGuid)}`, { cache: "no-store" }),
          "تعذر تحميل صلاحيات المستخدم"
        );
        set = { menus: json?.data?.menus || [], permissions: json?.data?.permissions || [] };
        label = `صلاحيات ${selected.name}`;
      } else {
        const json = await readJson(
          await fetch(`${apiBaseUrl}/api/user-management/packages/${selected.guid}?userGuid=${encodeURIComponent(userGuid)}`, { cache: "no-store" }),
          "تعذر تحميل الباكدج"
        );
        set = { menus: json?.data?.menus || [], permissions: json?.data?.permissions || [] };
        label = `باكدج ${selected.name}`;
      }

      onApply?.(set, applyMode);
      onClose();
      Swal.fire({
        icon: "success",
        title: `تم تطبيق ${label}`,
        text: "راجع الصلاحيات ثم اضغط حفظ لتثبيتها على المستخدم.",
        confirmButtonText: "حسناً",
        confirmButtonColor: primary
      });
    } catch (e) {
      Swal.fire({ icon: "error", title: "خطأ", text: e.message });
    } finally {
      setApplying(false);
    }
  };

  const deletePackage = async (pkg) => {
    const ok = await Swal.fire({
      icon: "warning",
      title: `حذف ${pkg.name}؟`,
      text: "الباكدج هيتمسح نهائيًا. صلاحيات المستخدمين اللي اتطبق عليهم مش هتتأثر.",
      showCancelButton: true,
      confirmButtonText: "حذف",
      cancelButtonText: "رجوع",
      confirmButtonColor: "#ae1e21"
    });
    if (!ok.isConfirmed) return;

    try {
      await readJson(
        await fetch(`${apiBaseUrl}/api/user-management/packages/${pkg.guid}?userGuid=${encodeURIComponent(userGuid)}`, { method: "DELETE" }),
        "تعذر حذف الباكدج"
      );
      loadPackages();
    } catch (e) {
      Swal.fire({ icon: "error", title: "خطأ", text: e.message });
    }
  };

  const title = mode === "copy" ? "نسخ صلاحيات من مستخدم" : mode === "apply" ? "تطبيق باكدج صلاحيات" : "باكدجات الصلاحيات";
  const canPick = mode === "apply" || mode === "copy";

  return (
    <>
      <Dialog open={open} onClose={() => !applying && onClose()} fullScreen={isMobile} fullWidth maxWidth="md" disableEnforceFocus PaperProps={{ sx: { direction: "rtl" } }}>
        <DialogTitle sx={titleSx}>
          {mode === "copy" ? <ContentCopyIcon /> : <Inventory2Icon />}
          {title}
        </DialogTitle>
        <DialogContent dividers>
          {canPick && currentUserName ? (
            <Alert severity="info" sx={{ mb: 1.5, fontWeight: 700 }}>
              الصلاحيات هتتطبق على: <b>{currentUserName}</b> — والحفظ الفعلي بعد ما تضغط "حفظ".
            </Alert>
          ) : null}

          <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
            <TextField
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={mode === "copy" ? "ابحث باسم المستخدم أو الكود..." : "ابحث باسم الباكدج..."}
              size="small"
              fullWidth
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
            />
            {mode !== "copy" ? (
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditor({ open: true, guid: null })} sx={{ fontWeight: 900, flexShrink: 0, backgroundColor: primary, "&:hover": { backgroundColor: primaryDark } }}>
                باكدج جديد
              </Button>
            ) : null}
          </Stack>

          {error ? <Alert severity="error" sx={{ mb: 1, fontWeight: 700 }}>{error}</Alert> : null}

          {loading ? (
            <Stack alignItems="center" sx={{ py: 4 }}><CircularProgress sx={{ color: primary }} /></Stack>
          ) : mode === "copy" ? (
            <Stack spacing={0.8} sx={{ maxHeight: 380, overflowY: "auto" }}>
              {users.map((u) => {
                const active = selected?.code === u.code;
                return (
                  <Paper
                    key={u.code}
                    variant="outlined"
                    onClick={() => setSelected(u)}
                    sx={{ p: 1.1, cursor: "pointer", borderRadius: 2, borderColor: active ? primary : undefined, borderWidth: active ? 2 : 1, background: active ? "rgba(5,117,70,.06)" : undefined }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography sx={{ fontWeight: 800 }}>{u.name}</Typography>
                      <Stack direction="row" spacing={1}>
                        <Chip size="small" label={`كود ${u.code}`} />
                        {u.status ? <Chip size="small" label={u.status} variant="outlined" /> : null}
                      </Stack>
                    </Stack>
                  </Paper>
                );
              })}
              {!users.length ? <Typography sx={{ textAlign: "center", py: 3, color: "text.secondary", fontWeight: 700 }}>لا توجد نتائج</Typography> : null}
            </Stack>
          ) : (
            <Stack spacing={0.8} sx={{ maxHeight: 420, overflowY: "auto" }}>
              {filteredPackages.map((p) => {
                const active = selected?.guid === p.guid;
                return (
                  <Paper
                    key={p.guid}
                    variant="outlined"
                    onClick={() => canPick && setSelected(p)}
                    sx={{
                      p: 1.2,
                      borderRadius: 2,
                      cursor: canPick ? "pointer" : "default",
                      borderColor: active ? primary : undefined,
                      borderWidth: active ? 2 : 1,
                      background: active ? "rgba(5,117,70,.06)" : undefined
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 900 }}>{p.name}</Typography>
                        {p.description ? <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>{p.description}</Typography> : null}
                        <Stack direction="row" spacing={0.8} sx={{ mt: 0.5 }}>
                          <Chip size="small" label={`${p.formsCount} شاشة`} color="success" variant="outlined" />
                          <Chip size="small" label={`${p.menusCount} قائمة`} color="success" variant="outlined" />
                        </Stack>
                      </Box>
                      <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                        <Tooltip title="تعديل">
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); setEditor({ open: true, guid: p.guid }); }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="حذف">
                          <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); deletePackage(p); }}>
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                  </Paper>
                );
              })}
              {!filteredPackages.length && !error ? (
                <Typography sx={{ textAlign: "center", py: 3, color: "text.secondary", fontWeight: 700 }}>
                  لا توجد باكدجات — اضغط "باكدج جديد" لإنشاء أول باكدج
                </Typography>
              ) : null}
            </Stack>
          )}

          {canPick && selected ? <ApplyModePicker value={applyMode} onChange={setApplyMode} /> : null}
        </DialogContent>
        <DialogActions sx={{ gap: 1 }}>
          <Button onClick={onClose} disabled={applying} sx={{ fontWeight: 900, color: "#ae1e21" }}>إغلاق</Button>
          {canPick ? (
            <Button
              variant="contained"
              disabled={!selected || applying}
              onClick={confirmApply}
              startIcon={applying ? <CircularProgress size={16} color="inherit" /> : null}
              sx={{ fontWeight: 900, backgroundColor: primary, "&:hover": { backgroundColor: primaryDark } }}
            >
              {mode === "copy" ? "نسخ الصلاحيات" : "تطبيق الباكدج"}
            </Button>
          ) : null}
        </DialogActions>
      </Dialog>

      <PackageEditor
        open={editor.open}
        packageGuid={editor.guid}
        onClose={() => setEditor({ open: false, guid: null })}
        onSaved={() => {
          setEditor({ open: false, guid: null });
          loadPackages();
        }}
        apiBaseUrl={apiBaseUrl}
        userGuid={userGuid}
        menus={menus}
        forms={forms}
        currentState={currentState}
      />
    </>
  );
};

export default PermissionPackagesDialog;
