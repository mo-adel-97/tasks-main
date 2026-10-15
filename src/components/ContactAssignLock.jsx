// قفل إضافة/حذف مسؤول الاتصال في متابعة السداد ومتابعة الخريجين.
// الحالة العامة لكل الفروع + استثناء لكل فرع. الصلاحية: "قفل تعديل متابعة السداد/الخريجين" (عرض).
import { useCallback, useEffect, useMemo, useState } from "react";
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
  Divider,
  Stack,
  Switch,
  TextField,
  Typography
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import Swal from "sweetalert2";

const SCREEN_TITLE = {
  "payment-follow": "متابعة السداد",
  "graduates-follow": "متابعة الخريجين"
};

const fmt = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

export function useContactAssignLock({ apiBase, screen, userGuid, branchGuid }) {
  const [state, setState] = useState({ canManage: false, locked: false, allLocked: false, branches: [] });

  const reload = useCallback(async () => {
    if (!userGuid) return;
    try {
      const params = new URLSearchParams({ userGuid, screen });
      if (branchGuid) params.set("branchGuid", branchGuid);
      const response = await fetch(`${apiBase}/api/contact-assign-lock/status?${params}`, { cache: "no-store" });
      const json = await response.json().catch(() => null);
      if (response.ok && json) {
        setState({
          canManage: Boolean(json.canManage),
          locked: Boolean(json.locked),
          allLocked: Boolean(json.allLocked),
          allUpdatedBy: json.allUpdatedBy,
          allUpdatedAt: json.allUpdatedAt,
          branches: Array.isArray(json.branches) ? json.branches : []
        });
      }
    } catch {
      // لو فشل التحميل الأزرار تفضل زي ما هي، والباك إند هو اللي بيمنع.
    }
  }, [apiBase, screen, userGuid, branchGuid]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { ...state, reload };
}

export function ContactAssignLockBanner({ locked, screen }) {
  if (!locked) return null;
  return (
    <Alert
      severity="warning"
      icon={<LockIcon />}
      sx={{ fontFamily: "Cairo", fontWeight: 800, mb: 1, alignItems: "center" }}
    >
      إضافة وحذف مسؤول الاتصال مقفلة لهذا الفرع في {SCREEN_TITLE[screen]}. العرض والتصدير متاحان.
    </Alert>
  );
}

export function ContactAssignLockButton({ lock, onClick, sx }) {
  if (!lock.canManage) return null;
  return (
    <Button
      size="small"
      variant="outlined"
      color={lock.locked ? "warning" : "inherit"}
      startIcon={lock.locked ? <LockIcon /> : <LockOpenIcon />}
      onClick={onClick}
      sx={{ fontFamily: "Cairo", fontWeight: 900, ...sx }}
    >
      قفل التعديل
    </Button>
  );
}

export function ContactAssignLockDialog({ open, onClose, apiBase, screen, userGuid, lock }) {
  const [busyKey, setBusyKey] = useState("");
  const [search, setSearch] = useState("");

  const branches = useMemo(() => {
    const term = search.trim();
    return term ? lock.branches.filter((b) => (b.branchName || "").includes(term)) : lock.branches;
  }, [lock.branches, search]);

  const lockedCount = lock.branches.filter((b) => b.locked).length;

  const setLock = async ({ branchGuid, branchName, locked }) => {
    const scope = branchGuid ? `فرع ${branchName}` : "كل الفروع";
    const confirm = await Swal.fire({
      icon: locked ? "warning" : "question",
      title: locked ? `قفل ${scope}` : `فتح ${scope}`,
      html: branchGuid
        ? (locked ? "لن يتمكن أحد من إضافة أو حذف مسؤول الاتصال في هذا الفرع." : "سيتمكن أصحاب الصلاحية من إضافة وحذف مسؤول الاتصال في هذا الفرع.")
        : (locked ? "سيُقفل التعديل في جميع الفروع، وتُلغى الاستثناءات الحالية." : "سيُفتح التعديل في جميع الفروع، وتُلغى الاستثناءات الحالية."),
      input: "text",
      inputPlaceholder: "سبب القفل أو الفتح (اختياري)",
      showCancelButton: true,
      confirmButtonText: locked ? "قفل" : "فتح",
      cancelButtonText: "رجوع",
      confirmButtonColor: locked ? "#ae1e21" : "#057546",
      target: document.body,
      customClass: { container: "contact-lock-swal" }
    });
    if (!confirm.isConfirmed) return;

    setBusyKey(branchGuid || "all");
    try {
      const response = await fetch(`${apiBase}/api/contact-assign-lock/set`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userGuid, screen, branchGuid: branchGuid || null, locked, note: confirm.value || null })
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) throw new Error(json?.message || "تعذّر تغيير حالة القفل");
      await lock.reload();
      Swal.fire({ icon: "success", title: json?.message || "تم", timer: 1600, showConfirmButton: false, target: document.body });
    } catch (e) {
      Swal.fire({ icon: "error", title: "خطأ", text: e.message, confirmButtonText: "حسنًا", target: document.body });
    } finally {
      setBusyKey("");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" dir="rtl" disableEnforceFocus>
      <style>{`.contact-lock-swal{z-index:2000 !important}`}</style>
      <DialogTitle sx={{ fontFamily: "Cairo", fontWeight: 900 }}>
        قفل إضافة وحذف مسؤول الاتصال · {SCREEN_TITLE[screen]}
      </DialogTitle>
      <DialogContent dividers>
        <Typography sx={{ fontFamily: "Cairo", fontSize: 13, color: "text.secondary", mb: 1.5 }}>
          القفل يمنع التوزيع الشهري والتوزيع المخصص وتعيين مسؤول الاتصال وحذفه. العرض والتصدير والطلبات الأخرى تبقى متاحة.
        </Typography>

        <Box sx={{ p: 1.5, borderRadius: 2, border: "1px solid", borderColor: "divider", mb: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
            <Box>
              <Typography sx={{ fontFamily: "Cairo", fontWeight: 900 }}>كل الفروع</Typography>
              <Typography sx={{ fontFamily: "Cairo", fontSize: 12, color: "text.secondary" }}>
                {lock.allLocked ? "مقفل" : "مفتوح"}
                {lock.allUpdatedBy ? ` · ${lock.allUpdatedBy} · ${fmt(lock.allUpdatedAt)}` : ""}
              </Typography>
            </Box>
            <Stack direction="row" gap={1}>
              <Button
                size="small" variant="contained" color="error" startIcon={<LockIcon />}
                disabled={Boolean(busyKey)}
                onClick={() => setLock({ branchGuid: null, locked: true })}
                sx={{ fontFamily: "Cairo", fontWeight: 900 }}
              >
                قفل الكل
              </Button>
              <Button
                size="small" variant="outlined" color="success" startIcon={<LockOpenIcon />}
                disabled={Boolean(busyKey)}
                onClick={() => setLock({ branchGuid: null, locked: false })}
                sx={{ fontFamily: "Cairo", fontWeight: 900 }}
              >
                فتح الكل
              </Button>
            </Stack>
          </Stack>
        </Box>

        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }} gap={1}>
          <Typography sx={{ fontFamily: "Cairo", fontWeight: 900 }}>
            الفروع ({lockedCount} مقفل من {lock.branches.length})
          </Typography>
          <TextField
            size="small" placeholder="بحث عن فرع" value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: 200 }}
          />
        </Stack>
        <Divider />

        <Box sx={{ maxHeight: 380, overflowY: "auto" }}>
          {branches.map((b) => (
            <Stack
              key={b.branchGuid}
              direction="row" alignItems="center" justifyContent="space-between"
              sx={{ py: 0.75, borderBottom: "1px solid", borderColor: "divider" }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontFamily: "Cairo", fontWeight: 800, fontSize: 14 }}>{b.branchName}</Typography>
                {b.isException && (
                  <Typography sx={{ fontFamily: "Cairo", fontSize: 11, color: "text.secondary" }}>
                    مخالف للحالة العامة{b.updatedBy ? ` · ${b.updatedBy} · ${fmt(b.updatedAt)}` : ""}
                  </Typography>
                )}
              </Box>
              <Stack direction="row" alignItems="center" gap={0.5}>
                <Chip
                  size="small"
                  icon={b.locked ? <LockIcon /> : <LockOpenIcon />}
                  label={b.locked ? "مقفل" : "مفتوح"}
                  color={b.locked ? "error" : "success"}
                  variant="outlined"
                  sx={{ fontFamily: "Cairo", fontWeight: 800 }}
                />
                {busyKey === b.branchGuid ? (
                  <CircularProgress size={22} sx={{ mx: 1.5 }} />
                ) : (
                  <Switch
                    checked={b.locked}
                    color="error"
                    disabled={Boolean(busyKey)}
                    onChange={(e) => setLock({ branchGuid: b.branchGuid, branchName: b.branchName, locked: e.target.checked })}
                    inputProps={{ "aria-label": `قفل ${b.branchName}` }}
                  />
                )}
              </Stack>
            </Stack>
          ))}
          {!branches.length && (
            <Typography sx={{ fontFamily: "Cairo", color: "text.secondary", py: 2, textAlign: "center" }}>
              لا توجد فروع مطابقة
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ fontFamily: "Cairo", fontWeight: 900 }}>إغلاق</Button>
      </DialogActions>
    </Dialog>
  );
}
