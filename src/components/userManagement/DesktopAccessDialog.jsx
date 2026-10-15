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
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import DesktopAccessDisabledIcon from "@mui/icons-material/DesktopAccessDisabled";
import DesktopWindowsIcon from "@mui/icons-material/DesktopWindows";
import SearchIcon from "@mui/icons-material/Search";
import Swal from "sweetalert2";

/*
  منع الدخول على الديسكتوب — شاشة إضافة مستخدم.
  المستخدم الممنوع بيفضل شغال على الويب بنفس صلاحياته، والديسكتوب بس هو اللي بيرفض دخوله
  (الإجراء AddUserSession بيرفض أي مستخدم في جدول DesktopLoginBlock).
*/

const primary = "#057546";
const primaryDark = "#034d31";
const danger = "#ae1e21";

const norm = (value) => String(value ?? "").trim().toLowerCase();

const readJson = async (response, fallback) => {
  const json = await response.json().catch(() => null);
  if (!response.ok) throw new Error([json?.message, json?.error].filter(Boolean).join(" — ") || fallback);
  return json;
};

const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("ar-EG", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
};

const st = {
  check: { width: 17, height: 17, margin: 0, cursor: "pointer", accentColor: primary },
  th: { position: "sticky", top: 0, zIndex: 1, background: primary, color: "#fff", fontWeight: 900, fontSize: 12, padding: "7px 8px", whiteSpace: "nowrap", textAlign: "right" },
  td: { borderTop: "1px solid #e3ebe7", padding: "6px 8px", fontSize: 13, textAlign: "right", whiteSpace: "nowrap" },
  chip: { padding: "1px 8px", borderRadius: 10, fontSize: 11, fontWeight: 900, whiteSpace: "nowrap", border: "1px solid currentColor" }
};

const UserRow = React.memo(function UserRow({ user, checked, onToggle }) {
  return (
    <tr onClick={() => onToggle(user.guid)} style={{ cursor: "pointer", background: checked ? "rgba(5,117,70,.07)" : undefined }}>
      <td style={{ ...st.td, textAlign: "center" }}>
        <input type="checkbox" style={st.check} checked={checked} onChange={() => onToggle(user.guid)} onClick={(e) => e.stopPropagation()} />
      </td>
      <td style={{ ...st.td, fontWeight: checked ? 900 : 600, whiteSpace: "normal" }}>{user.name || user.userName}</td>
      <td style={st.td}>{user.code}</td>
      <td style={st.td}>
        <span style={{ ...st.chip, color: user.isActive ? primary : danger }}>{user.isActive ? "نشط" : "موقوف"}</span>
      </td>
      <td style={st.td}>
        {user.blocked ? (
          <span style={{ ...st.chip, color: danger }}>ممنوع</span>
        ) : (
          <span style={{ ...st.chip, color: primary }}>مسموح</span>
        )}
      </td>
      <td style={st.td}>{formatDate(user.lastDesktopLogin) || <span style={{ opacity: 0.55 }}>لم يدخل</span>}</td>
      <td style={{ ...st.td, textAlign: "center", fontWeight: user.desktopLogins30 ? 900 : 400 }}>{user.desktopLogins30 || "—"}</td>
    </tr>
  );
});

const DesktopAccessDialog = ({ open, onClose, apiBaseUrl, userGuid }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("recent");
  const [reason, setReason] = useState("");
  const [running, setRunning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const json = await readJson(
        await fetch(`${apiBaseUrl}/api/user-management/desktop-access?userGuid=${encodeURIComponent(userGuid)}`, { cache: "no-store" }),
        "تعذر تحميل المستخدمين"
      );
      setUsers(Array.isArray(json?.data) ? json.data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, userGuid]);

  useEffect(() => {
    if (!open) return;
    setSelected(new Set());
    setSearch("");
    setFilter("recent");
    setReason("");
    load();
  }, [open, load]);

  const counts = useMemo(
    () => ({
      recent: users.filter((u) => u.desktopLogins30 > 0 && !u.blocked).length,
      blocked: users.filter((u) => u.blocked).length,
      active: users.filter((u) => u.isActive).length
    }),
    [users]
  );

  const deferredSearch = useDeferredValue(search);
  const visibleUsers = useMemo(() => {
    const q = norm(deferredSearch);
    return users.filter((u) => {
      if (filter === "recent" && !(u.desktopLogins30 > 0 && !u.blocked)) return false;
      if (filter === "blocked" && !u.blocked) return false;
      if (filter === "active" && !u.isActive) return false;
      return !q || norm(u.name).includes(q) || norm(u.userName).includes(q) || norm(u.code) === q;
    });
  }, [users, deferredSearch, filter]);

  const toggle = useCallback(
    (guid) =>
      setSelected((prev) => {
        const next = new Set(prev);
        const k = norm(guid);
        if (next.has(k)) next.delete(k);
        else next.add(k);
        return next;
      }),
    []
  );

  const allVisibleChecked = visibleUsers.length > 0 && visibleUsers.every((u) => selected.has(norm(u.guid)));
  const toggleAllVisible = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      visibleUsers.forEach((u) => (allVisibleChecked ? next.delete(norm(u.guid)) : next.add(norm(u.guid))));
      return next;
    });

  const selectedUsers = useMemo(() => users.filter((u) => selected.has(norm(u.guid))), [users, selected]);

  const run = async (block) => {
    const names = selectedUsers.slice(0, 8).map((u) => `• ${u.name || u.userName}`).join("<br>");
    const more = selectedUsers.length > 8 ? `<br>و ${selectedUsers.length - 8} مستخدم آخر` : "";

    const ok = await Swal.fire({
      icon: block ? "warning" : "question",
      title: block ? "منع الدخول على الديسكتوب" : "السماح بالدخول على الديسكتوب",
      html: `
        <div style="direction:rtl;text-align:right;line-height:1.9">
          ${block
            ? `<b>${selectedUsers.length}</b> مستخدم مش هيقدروا يدخلوا على برنامج الديسكتوب.<br>صلاحياتهم على <b>الويب</b> هتفضل زي ما هي.<br><small>اللي فاتح البرنامج دلوقتي هيتقفل عليه من أول تسجيل دخول جاي.</small>`
            : `<b>${selectedUsers.length}</b> مستخدم هيرجعوا يقدروا يدخلوا على الديسكتوب.`}
          <hr style="margin:6px 0">${names}${more}
        </div>`,
      showCancelButton: true,
      confirmButtonText: block ? "منع" : "سماح",
      cancelButtonText: "رجوع",
      confirmButtonColor: block ? danger : primary
    });
    if (!ok.isConfirmed) return;

    try {
      setRunning(true);
      const json = await readJson(
        await fetch(`${apiBaseUrl}/api/user-management/desktop-access`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            actorUserGuid: userGuid,
            block,
            userGuids: selectedUsers.map((u) => u.guid),
            reason: reason.trim()
          })
        }),
        "تعذر التنفيذ"
      );
      setSelected(new Set());
      await load();
      Swal.fire({ icon: "success", title: json?.message || "تم بنجاح", timer: 1800, showConfirmButton: false });
    } catch (e) {
      Swal.fire({ icon: "error", title: "تعذر التنفيذ", text: e.message });
    } finally {
      setRunning(false);
    }
  };

  const solidSx = (color, hover) => ({
    fontWeight: 900,
    color: "#fff !important",
    backgroundColor: `${color} !important`,
    "&:hover": { backgroundColor: `${hover} !important` },
    "&.Mui-disabled": { opacity: 0.45 }
  });

  return (
    <Dialog
      open={open}
      onClose={() => !running && onClose()}
      fullScreen={isMobile}
      fullWidth
      maxWidth="lg"
      disableEnforceFocus
      PaperProps={{ sx: { direction: "rtl", height: isMobile ? "100dvh" : "90vh" } }}
    >
      <DialogTitle sx={{ fontWeight: 900, color: "#fff", background: `linear-gradient(135deg, ${primary}, ${primaryDark})`, display: "flex", alignItems: "center", gap: 1 }}>
        <DesktopAccessDisabledIcon />
        الدخول على برنامج الديسكتوب
      </DialogTitle>

      <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
        <Alert severity="info" sx={{ fontWeight: 700 }}>
          المستخدم الممنوع <b>مش هيقدر يدخل على الديسكتوب</b>، لكن <b>صلاحياته على الويب زي ما هي</b> ومش هتتلمس.
        </Alert>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
          <TextField
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو الكود..."
            size="small"
            fullWidth
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          />
          <ToggleButtonGroup exclusive size="small" value={filter} onChange={(_, v) => v && setFilter(v)} sx={{ flexShrink: 0, "& .MuiToggleButton-root": { fontWeight: 800, whiteSpace: "nowrap" } }}>
            <ToggleButton value="recent">بيستخدموا الديسكتوب ({counts.recent})</ToggleButton>
            <ToggleButton value="blocked">ممنوعين ({counts.blocked})</ToggleButton>
            <ToggleButton value="active">النشطين ({counts.active})</ToggleButton>
            <ToggleButton value="all">الكل ({users.length})</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        {filter === "recent" ? (
          <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 700 }}>
            "بيستخدموا الديسكتوب" = دخلوا على البرنامج مرة أو أكتر في آخر 30 يوم ولسه مش ممنوعين.
          </Typography>
        ) : null}

        <Box sx={{ flex: 1, minHeight: 260, overflow: "auto", border: "1px solid #dce8e2", borderRadius: 2 }}>
          {loading ? (
            <Stack alignItems="center" sx={{ py: 5 }}><CircularProgress sx={{ color: primary }} /></Stack>
          ) : error ? (
            <Alert severity="error" sx={{ m: 1, fontWeight: 700 }}>{error}</Alert>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ ...st.th, textAlign: "center", width: 40 }}>
                    <input type="checkbox" aria-label="تحديد الكل" style={{ ...st.check, width: 15, height: 15 }} checked={allVisibleChecked} onChange={toggleAllVisible} />
                  </th>
                  <th style={st.th}>المستخدم</th>
                  <th style={st.th}>الكود</th>
                  <th style={st.th}>الحالة</th>
                  <th style={st.th}>الديسكتوب</th>
                  <th style={st.th}>آخر دخول ديسكتوب</th>
                  <th style={{ ...st.th, textAlign: "center" }}>مرات الدخول (30 يوم)</th>
                </tr>
              </thead>
              <tbody>
                {visibleUsers.map((u) => (
                  <UserRow key={u.guid} user={u} checked={selected.has(norm(u.guid))} onToggle={toggle} />
                ))}
              </tbody>
            </table>
          )}
          {!loading && !error && !visibleUsers.length ? (
            <Typography sx={{ textAlign: "center", py: 3, color: "text.secondary", fontWeight: 700 }}>لا توجد نتائج</Typography>
          ) : null}
        </Box>

        <TextField
          label="السبب (اختياري — بيتسجل في سجل الحركات)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          size="small"
          fullWidth
          InputLabelProps={{ shrink: true }}
        />
      </DialogContent>

      <DialogActions sx={{ gap: 1, flexWrap: "wrap" }}>
        <Chip label={`${selected.size} مختار`} sx={{ fontWeight: 900, ml: "auto" }} />
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose} disabled={running} sx={{ fontWeight: 900, color: danger }}>إغلاق</Button>
        <Button
          variant="contained"
          disabled={running || !selected.size}
          onClick={() => run(false)}
          startIcon={<DesktopWindowsIcon />}
          sx={solidSx(primary, primaryDark)}
        >
          السماح بالديسكتوب
        </Button>
        <Button
          variant="contained"
          disabled={running || !selected.size}
          onClick={() => run(true)}
          startIcon={running ? <CircularProgress size={16} color="inherit" /> : <DesktopAccessDisabledIcon />}
          sx={solidSx(danger, "#8a1517")}
        >
          منع الديسكتوب
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DesktopAccessDialog;
