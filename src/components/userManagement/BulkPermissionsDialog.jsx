import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import GroupsIcon from "@mui/icons-material/Groups";
import AddTaskIcon from "@mui/icons-material/AddTask";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import SearchIcon from "@mui/icons-material/Search";
import Swal from "sweetalert2";

/*
  تعديل صلاحيات جماعي — شاشة إضافة مستخدم.
  - "إضافة": بيفعّل الخانات المختارة للمستخدمين المختارين، وباقي صلاحياتهم زي ما هي.
  - "حذف":   بيقفل الخانات المختارة بس من المستخدمين المختارين.
  التنفيذ بيتحفظ في الداتا بيز مباشرة (POST /api/user-management/bulk-permissions).
*/

const primary = "#057546";
const primaryDark = "#034d31";
const danger = "#ae1e21";

const FLAGS = [
  { key: "add", label: "جديد" },
  { key: "edit", label: "تعديل" },
  { key: "del", label: "حذف" },
  { key: "print", label: "طباعة" },
  { key: "find", label: "بحث" },
  { key: "view", label: "عرض" }
];

const norm = (value) => String(value ?? "").trim().toLowerCase();
const EMPTY = Object.freeze({});

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

// عناصر خفيفة (HTML عادي) لأن القوائم فيها مئات الصفوف.
const st = {
  check: { width: 17, height: 17, margin: 0, cursor: "pointer", accentColor: primary },
  th: { position: "sticky", top: 0, zIndex: 1, background: primary, color: "#fff", fontWeight: 900, fontSize: 12, padding: "6px 4px", whiteSpace: "nowrap" },
  td: { borderTop: "1px solid #e3ebe7", padding: "4px", textAlign: "center" },
  name: { textAlign: "right", padding: "4px 10px", fontSize: 13 },
  chip: { marginInlineStart: 6, padding: "0 6px", border: "1px solid color-mix(in srgb, currentColor 35%, transparent)", borderRadius: 9, fontSize: 10, fontWeight: 900, whiteSpace: "nowrap" },
  userRow: { display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderTop: "1px solid #e3ebe7", cursor: "pointer", fontSize: 13 },
  menuLabel: { display: "inline-flex", alignItems: "center", gap: 6, minWidth: 150, padding: "4px 6px", cursor: "pointer", fontSize: 13 }
};

const FormRow = React.memo(function FormRow({ form, flags, onToggleFlag, onToggleRow }) {
  const all = FLAGS.every((x) => flags[x.key]);
  const some = FLAGS.some((x) => flags[x.key]);
  return (
    <tr>
      <td style={{ ...st.td, ...st.name, fontWeight: some ? 900 : 500 }}>
        {form.name}
        <span style={st.chip}>{form.platform === "web" ? "ويب" : "ديسكتوب"}</span>
      </td>
      <td style={st.td}>
        <input
          type="checkbox"
          aria-label={`كل صلاحيات ${form.name}`}
          style={st.check}
          checked={all}
          ref={(el) => {
            if (el) el.indeterminate = some && !all;
          }}
          onChange={() => onToggleRow(form.guid)}
        />
      </td>
      {FLAGS.map((x) => (
        <td key={x.key} style={st.td}>
          <input
            type="checkbox"
            aria-label={`${x.label} - ${form.name}`}
            style={st.check}
            checked={Boolean(flags[x.key])}
            onChange={() => onToggleFlag(form.guid, x.key)}
          />
        </td>
      ))}
    </tr>
  );
});

const UserRow = React.memo(function UserRow({ user, checked, disabled, onToggle }) {
  return (
    <label style={{ ...st.userRow, opacity: disabled ? 0.55 : 1, background: checked ? "rgba(5,117,70,.07)" : undefined }}>
      <input type="checkbox" style={st.check} checked={checked} disabled={disabled} onChange={() => onToggle(user.guid)} />
      <span style={{ flex: 1, minWidth: 0, fontWeight: checked ? 900 : 600 }}>{user.name || user.userName}</span>
      <span style={st.chip}>{user.code}</span>
      <span style={{ ...st.chip, color: user.isActive ? primary : danger }}>{user.isActive ? "نشط" : "موقوف"}</span>
    </label>
  );
});

const BulkPermissionsDialog = ({ open, onClose, apiBaseUrl, userGuid, menus, forms, onDone }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [mode, setMode] = useState("grant");
  const [perms, setPerms] = useState({}); // formGuid(norm) => flags
  const [menuSet, setMenuSet] = useState(new Set());
  const [formSearch, setFormSearch] = useState("");
  const [onlySelectedForms, setOnlySelectedForms] = useState(false);

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [userSet, setUserSet] = useState(new Set());
  const [allUsers, setAllUsers] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");

  const [reason, setReason] = useState("");
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMode("grant");
    setPerms({});
    setMenuSet(new Set());
    setFormSearch("");
    setOnlySelectedForms(false);
    setUserSet(new Set());
    setAllUsers(false);
    setUserSearch("");
    setStatusFilter("active");
    setReason("");

    setUsersLoading(true);
    setUsersError("");
    fetch(`${apiBaseUrl}/api/user-management/bulk-permissions/users?userGuid=${encodeURIComponent(userGuid)}`, { cache: "no-store" })
      .then((r) => readJson(r, "تعذر تحميل المستخدمين"))
      .then((json) => setUsers(Array.isArray(json?.data) ? json.data : []))
      .catch((e) => setUsersError(e.message))
      .finally(() => setUsersLoading(false));
  }, [open, apiBaseUrl, userGuid]);

  // ===== الشاشات =====
  const deferredFormSearch = useDeferredValue(formSearch);
  const selectedForms = useMemo(
    () => forms.filter((f) => FLAGS.some((x) => perms[norm(f.guid)]?.[x.key])),
    [forms, perms]
  );

  const visibleForms = useMemo(() => {
    const q = norm(deferredFormSearch);
    return forms.filter((f) => {
      if (onlySelectedForms && !FLAGS.some((x) => perms[norm(f.guid)]?.[x.key])) return false;
      return !q || norm(f.name).includes(q) || norm(f.code).includes(q);
    });
    // perms مقصود مش في الـ deps علشان الصف ما يختفيش وإنت بتشيل منه علامة في "المختارة فقط".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forms, deferredFormSearch, onlySelectedForms]);

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

  // تعليم عمود كامل للشاشات الظاهرة (مثلاً "عرض" لكل نتائج البحث).
  const toggleColumn = (key) => {
    const allOn = visibleForms.length > 0 && visibleForms.every((f) => perms[norm(f.guid)]?.[key]);
    setPerms((prev) => {
      const next = { ...prev };
      visibleForms.forEach((f) => {
        const k = norm(f.guid);
        next[k] = { ...(next[k] || {}), [key]: !allOn };
      });
      return next;
    });
  };

  const toggleMenu = (guid) =>
    setMenuSet((prev) => {
      const next = new Set(prev);
      const k = norm(guid);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  // ===== المستخدمين =====
  const deferredUserSearch = useDeferredValue(userSearch);
  const visibleUsers = useMemo(() => {
    const q = norm(deferredUserSearch);
    return users.filter((u) => {
      if (statusFilter === "active" && !u.isActive) return false;
      if (statusFilter === "inactive" && u.isActive) return false;
      return !q || norm(u.name).includes(q) || norm(u.userName).includes(q) || norm(u.code) === q;
    });
  }, [users, deferredUserSearch, statusFilter]);

  const toggleUser = useCallback(
    (guid) =>
      setUserSet((prev) => {
        const next = new Set(prev);
        const k = norm(guid);
        if (next.has(k)) next.delete(k);
        else next.add(k);
        return next;
      }),
    []
  );

  const selectVisibleUsers = (on) =>
    setUserSet((prev) => {
      const next = new Set(prev);
      visibleUsers.forEach((u) => (on ? next.add(norm(u.guid)) : next.delete(norm(u.guid))));
      return next;
    });

  const targetCount = allUsers ? users.length : userSet.size;
  const flagsCount = selectedForms.reduce((sum, f) => sum + FLAGS.filter((x) => perms[norm(f.guid)]?.[x.key]).length, 0);
  const canRun = !running && targetCount > 0 && (selectedForms.length > 0 || menuSet.size > 0);
  const isGrant = mode === "grant";
  const accent = isGrant ? primary : danger;

  const run = async () => {
    const selectedMenus = menus.filter((m) => menuSet.has(norm(m.guid)));
    // كل شاشة ومعاها الخانات المختارة بالاسم، علشان التأكيد يبقى واضح.
    const flagNames = (f) => {
      const on = FLAGS.filter((x) => perms[norm(f.guid)]?.[x.key]);
      return on.length === FLAGS.length ? "كل الصلاحيات" : on.map((x) => x.label).join("، ");
    };
    const formNames = selectedForms
      .slice(0, 6)
      .map((f) => `• <b>${f.name}</b>: <span style="color:${accent}">${flagNames(f)}</span>`)
      .join("<br>");
    const more = selectedForms.length > 6 ? `<br>و ${selectedForms.length - 6} شاشة أخرى` : "";
    const menuNames = selectedMenus.map((m) => `• قائمة <b>${m.name}</b>`).join("<br>");

    const ok = await Swal.fire({
      icon: isGrant ? "question" : "warning",
      title: isGrant ? "تأكيد إضافة الصلاحيات" : "تأكيد حذف الصلاحيات",
      html: `
        <div style="direction:rtl;text-align:right;line-height:1.9">
          <b>${isGrant ? "إضافة" : "حذف"}</b> ${isGrant ? "لـ" : "من"} <b>${allUsers ? `كل المستخدمين (${users.length})` : `${targetCount} مستخدم`}</b>:
          ${formNames ? `<hr style="margin:6px 0">${formNames}${more}` : ""}
          ${menuNames ? `<hr style="margin:6px 0">${menuNames}` : ""}
        </div>`,
      showCancelButton: true,
      confirmButtonText: isGrant ? "إضافة" : "حذف",
      cancelButtonText: "رجوع",
      confirmButtonColor: accent
    });
    if (!ok.isConfirmed) return;

    try {
      setRunning(true);
      const json = await readJson(
        await fetch(`${apiBaseUrl}/api/user-management/bulk-permissions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            actorUserGuid: userGuid,
            mode,
            allUsers,
            userGuids: allUsers ? [] : users.filter((u) => userSet.has(norm(u.guid))).map((u) => u.guid),
            permissions: selectedForms.map((f) => ({
              guid: f.guid,
              ...FLAGS.reduce((acc, x) => ({ ...acc, [x.key]: Boolean(perms[norm(f.guid)]?.[x.key]) }), {})
            })),
            menus: selectedMenus.map((m) => m.guid),
            reason: reason.trim()
          })
        }),
        "تعذر تعديل الصلاحيات"
      );

      onDone?.({ allUsers, userGuids: allUsers ? null : [...userSet] });
      await Swal.fire({
        icon: "success",
        title: json?.message || "تم بنجاح",
        confirmButtonText: "حسناً",
        confirmButtonColor: primary
      });
    } catch (e) {
      Swal.fire({ icon: "error", title: "تعذر التنفيذ", text: e.message });
    } finally {
      setRunning(false);
    }
  };

  const formsAllColumn = (key) => visibleForms.length > 0 && visibleForms.every((f) => perms[norm(f.guid)]?.[key]);

  return (
    <Dialog
      open={open}
      onClose={() => !running && onClose()}
      fullScreen={isMobile}
      fullWidth
      maxWidth="xl"
      disableEnforceFocus
      PaperProps={{ sx: { direction: "rtl", height: isMobile ? "100dvh" : "92vh" } }}
    >
      <DialogTitle sx={titleSx}>
        <GroupsIcon />
        تعديل صلاحيات لمجموعة مستخدمين
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={1.5}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
            <ToggleButtonGroup
              exclusive
              value={mode}
              onChange={(_, value) => value && setMode(value)}
              size="small"
              sx={{ "& .MuiToggleButton-root": { fontWeight: 900, px: 2 } }}
            >
              <ToggleButton value="grant" sx={{ "&.Mui-selected": { color: "#fff", backgroundColor: primary, "&:hover": { backgroundColor: primaryDark } } }}>
                <AddTaskIcon fontSize="small" sx={{ ml: 0.7 }} />
                إضافة صلاحيات
              </ToggleButton>
              <ToggleButton value="revoke" sx={{ "&.Mui-selected": { color: "#fff", backgroundColor: danger, "&:hover": { backgroundColor: "#8a1517" } } }}>
                <RemoveCircleOutlineIcon fontSize="small" sx={{ ml: 0.7 }} />
                حذف صلاحيات
              </ToggleButton>
            </ToggleButtonGroup>
            <Alert severity={isGrant ? "success" : "warning"} sx={{ flex: 1, py: 0, fontWeight: 700 }}>
              {isGrant
                ? "الخانات اللي هتعلّم عليها هتتفعّل للمستخدمين المختارين، وباقي صلاحياتهم زي ما هي."
                : "الخانات اللي هتعلّم عليها هتتشال من المستخدمين المختارين بس، وباقي صلاحياتهم زي ما هي."}
            </Alert>
          </Stack>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0,1.6fr) minmax(0,1fr)" }, gap: 1.5 }}>
            {/* ===== الصلاحيات ===== */}
            <Stack spacing={1.5} sx={{ minWidth: 0 }}>
              <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 2 }}>
                <Typography sx={{ fontWeight: 900, mb: 0.5 }}>
                  القوائم الرئيسية <Typography component="span" sx={{ fontSize: 12, color: "text.secondary" }}>(الشاشة ما بتظهرش إلا لو قائمتها مفعّلة)</Typography>
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap" }}>
                  {menus.map((m) => (
                    <label key={m.guid} style={st.menuLabel}>
                      <input type="checkbox" style={st.check} checked={menuSet.has(norm(m.guid))} onChange={() => toggleMenu(m.guid)} />
                      {m.name}
                    </label>
                  ))}
                </Box>
              </Paper>

              <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ p: 1.2 }} alignItems={{ sm: "center" }}>
                  <Typography sx={{ fontWeight: 900, flexShrink: 0 }}>الشاشات</Typography>
                  <TextField
                    value={formSearch}
                    onChange={(e) => setFormSearch(e.target.value)}
                    placeholder="ابحث في الشاشات..."
                    size="small"
                    fullWidth
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                  />
                  <label style={{ ...st.menuLabel, minWidth: 0, flexShrink: 0 }}>
                    <input type="checkbox" style={st.check} checked={onlySelectedForms} onChange={(e) => setOnlySelectedForms(e.target.checked)} />
                    المختارة فقط
                  </label>
                </Stack>
                <Box sx={{ maxHeight: isMobile ? 420 : "calc(92vh - 420px)", minHeight: 240, overflow: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={{ ...st.th, textAlign: "right", padding: "6px 10px" }}>الشاشة</th>
                        <th style={st.th}>الكل</th>
                        {FLAGS.map((f) => (
                          <th key={f.key} style={st.th}>
                            <label style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 2, cursor: "pointer" }} title={`تعليم "${f.label}" لكل الشاشات الظاهرة`}>
                              {f.label}
                              <input type="checkbox" style={{ ...st.check, width: 14, height: 14 }} checked={formsAllColumn(f.key)} onChange={() => toggleColumn(f.key)} />
                            </label>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {visibleForms.map((f) => (
                        <FormRow key={f.guid} form={f} flags={perms[norm(f.guid)] || EMPTY} onToggleFlag={toggleFlag} onToggleRow={toggleRow} />
                      ))}
                    </tbody>
                  </table>
                  {!visibleForms.length ? (
                    <Typography sx={{ textAlign: "center", py: 3, color: "text.secondary", fontWeight: 700 }}>لا توجد نتائج</Typography>
                  ) : null}
                </Box>
              </Paper>
            </Stack>

            {/* ===== المستخدمين ===== */}
            <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden", display: "flex", flexDirection: "column", minWidth: 0 }}>
              <Stack spacing={1} sx={{ p: 1.2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography sx={{ fontWeight: 900 }}>المستخدمين</Typography>
                  <Chip size="small" label={`${targetCount} مختار`} sx={{ fontWeight: 900, color: "#fff", backgroundColor: accent }} />
                </Stack>

                <label style={{ ...st.menuLabel, minWidth: 0, fontWeight: 900, color: allUsers ? accent : undefined }}>
                  <input type="checkbox" style={{ ...st.check, accentColor: accent }} checked={allUsers} onChange={(e) => setAllUsers(e.target.checked)} />
                  تطبيق على كل المستخدمين ({users.length}) — النشطين والموقوفين
                </label>

                <TextField
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="ابحث بالاسم أو الكود..."
                  size="small"
                  fullWidth
                  disabled={allUsers}
                  InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                />

                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap alignItems="center">
                  <ToggleButtonGroup exclusive size="small" value={statusFilter} onChange={(_, v) => v && setStatusFilter(v)} disabled={allUsers}>
                    <ToggleButton value="active" sx={{ fontWeight: 800, py: 0.3 }}>النشطين</ToggleButton>
                    <ToggleButton value="inactive" sx={{ fontWeight: 800, py: 0.3 }}>الموقوفين</ToggleButton>
                    <ToggleButton value="all" sx={{ fontWeight: 800, py: 0.3 }}>الكل</ToggleButton>
                  </ToggleButtonGroup>
                  <Button size="small" disabled={allUsers || !visibleUsers.length} onClick={() => selectVisibleUsers(true)} sx={{ fontWeight: 800, color: primary }}>
                    تحديد الظاهرين ({visibleUsers.length})
                  </Button>
                  <Button size="small" disabled={allUsers || !userSet.size} onClick={() => setUserSet(new Set())} sx={{ fontWeight: 800, color: danger }}>
                    إلغاء التحديد
                  </Button>
                </Stack>
              </Stack>

              <Box sx={{ flex: 1, minHeight: 240, maxHeight: isMobile ? 420 : "none", overflow: "auto" }}>
                {usersLoading ? (
                  <Stack alignItems="center" sx={{ py: 4 }}><CircularProgress sx={{ color: primary }} /></Stack>
                ) : usersError ? (
                  <Alert severity="error" sx={{ m: 1, fontWeight: 700 }}>{usersError}</Alert>
                ) : (
                  <>
                    {visibleUsers.map((u) => (
                      <UserRow key={u.guid} user={u} checked={allUsers || userSet.has(norm(u.guid))} disabled={allUsers} onToggle={toggleUser} />
                    ))}
                    {!visibleUsers.length ? (
                      <Typography sx={{ textAlign: "center", py: 3, color: "text.secondary", fontWeight: 700 }}>لا توجد نتائج</Typography>
                    ) : null}
                  </>
                )}
              </Box>
            </Paper>
          </Box>

          <TextField
            label="سبب التعديل (اختياري — بيتسجل في سجل الحركات)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ gap: 1, flexWrap: "wrap" }}>
        <Typography sx={{ flex: 1, fontWeight: 800, fontSize: 13, color: "text.secondary", px: 1 }}>
          {selectedForms.length} شاشة ({flagsCount} صلاحية) · {menuSet.size} قائمة · {targetCount} مستخدم
        </Typography>
        <Button onClick={onClose} disabled={running} sx={{ fontWeight: 900, color: danger }}>إغلاق</Button>
        <Button
          variant="contained"
          onClick={run}
          disabled={!canRun}
          startIcon={running ? <CircularProgress size={16} color="inherit" /> : isGrant ? <AddTaskIcon /> : <RemoveCircleOutlineIcon />}
          sx={{
            fontWeight: 900,
            color: "#fff !important",
            backgroundColor: `${accent} !important`,
            "&:hover": { backgroundColor: `${isGrant ? primaryDark : "#8a1517"} !important` },
            "&.Mui-disabled": { opacity: 0.45 }
          }}
        >
          {isGrant ? "إضافة للمستخدمين المختارين" : "حذف من المستخدمين المختارين"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkPermissionsDialog;
