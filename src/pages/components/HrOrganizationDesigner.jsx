import * as uiLayout from '../../components/hrLayout';
import '../rtl-forms-fix.css';
import { hrChipSx } from "../../components/hrControlStyles";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SupervisorAccountRoundedIcon from "@mui/icons-material/SupervisorAccountRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Swal from "sweetalert2";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  "https://api4.sstli.com";

const primary = "#057546";
const primaryDark = "#034d31";
const border = "rgba(5,117,70,.16)";

const getActor = () => {
  try {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    return {
      actorUserGuid: u?.guid || u?.Guid || u?.userGuid || u?.UserGuid || null,
      actorName: u?.fullName || u?.FullName || u?.userName || u?.UserName || "مستخدم النظام"
    };
  } catch {
    return { actorUserGuid: null, actorName: "مستخدم النظام" };
  }
};

const unitTypeName = (type) => ({
  COMPANY: "الشركة / الجذر",
  DEPARTMENT: "إدارة / قسم",
  BRANCH: "فرع",
  TEAM: "فريق",
  CUSTOM: "وحدة مخصصة"
}[type] || type || "-");

const roleName = (role) => ({
  MANAGER: "مسؤول",
  EXECUTIVE_MANAGER: "مدير تنفيذي",
  GENERAL_SUPERVISOR: "مشرف عام",
  BRANCH_SUPERVISOR: "مشرف فرع",
  ADMIN_MANAGER: "مدير إداري",
  DEPARTMENT_MANAGER: "مدير إدارة / قسم",
  DEPUTY: "نائب / بديل",
  COMPANY_HEAD: "رئيس الشركة"
}[role] || role || "مسؤول");

const emptyUnit = () => ({
  orgUnitGuid: null,
  unitCode: "",
  unitName: "",
  unitType: "CUSTOM",
  parentOrgUnitGuid: "",
  sortOrder: 100,
  notes: ""
});

const emptyManager = () => ({
  orgUnitManagerGuid: null,
  orgUnitGuid: "",
  managerUserGuid: "",
  managerRole: "MANAGER",
  priority: 100,
  isPrimary: true,
  canViewTeam: true,
  canViewDescendants: true,
  canApproveLeaves: true,
  canApprovePermissions: true,
  canReviewAttendance: true,
  notes: ""
});

function TreeNode({ node, childrenMap, managersByUnit, onEdit, depth = 0 }) {
  const children = childrenMap.get(node.orgUnitGuid) || [];
  const managers = managersByUnit.get(node.orgUnitGuid) || [];
  return (
    <Box sx={{ marginInlineStart: depth ? 2.2 : 0, position: "relative" }}>
      {depth > 0 && (
        <Box sx={{ position: "absolute", insetInlineStart: -13, top: 0, bottom: 0, borderInlineStart: "1px dashed #b7cec2" }} />
      )}
      <Paper
        variant="outlined"
        sx={{
          p: 1.1,
          mb: 0.8,
          borderRadius: 2.5,
          borderColor: depth === 0 ? primary : border,
          background: depth === 0 ? "#f3fbf7" : "#fff"
        }}
      >
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1}>
          <Box>
            <Stack direction="row" spacing={0.7} alignItems="center" flexWrap="wrap">
              <Typography sx={{ fontWeight: 950, color: primaryDark }}>{node.unitName}</Typography>
              <Chip size="small" label={unitTypeName(node.unitType)} />
              <Chip size="small" variant="outlined" label={`${node.directMembers || 0} عضو مباشر`} />
            </Stack>
            <Stack direction="row" spacing={0.6} flexWrap="wrap" sx={{ mt: 0.7 }}>
              {managers.length ? managers.map((m) => (
                <Chip
                  key={m.orgUnitManagerGuid}
                  size="small"
                  color={m.isPrimary ? "success" : "default"}
                  label={`${m.managerName} • ${roleName(m.managerRole)}${m.isPrimary ? " • أساسي" : ""}`}
                />
              )) : <Typography sx={{ fontSize: 12, color: "text.secondary" }}>لا يوجد مسؤول محدد</Typography>}
            </Stack>
          </Box>
          <Button sx={uiLayout.buttonSx} size="small" startIcon={<EditRoundedIcon />} onClick={() => onEdit(node)}>
            تعديل الوحدة
          </Button>
        </Stack>
      </Paper>
      {children.map((child) => (
        <TreeNode
          key={child.orgUnitGuid}
          node={child}
          childrenMap={childrenMap}
          managersByUnit={managersByUnit}
          onEdit={onEdit}
          depth={depth + 1}
        />
      ))}
    </Box>
  );
}

export default function HrOrganizationDesigner() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lookups, setLookups] = useState({ units: [], employees: [] });
  const [tree, setTree] = useState({ units: [], managers: [], members: [] });
  const [unitOpen, setUnitOpen] = useState(false);
  const [unitForm, setUnitForm] = useState(emptyUnit());
  const [managerForm, setManagerForm] = useState(emptyManager());
  const [memberUnitGuid, setMemberUnitGuid] = useState("");
  const [memberEmployeeGuid, setMemberEmployeeGuid] = useState("");
  const [memberPrimary, setMemberPrimary] = useState(true);
  const [previewEmployeeGuid, setPreviewEmployeeGuid] = useState("");
  const [preview, setPreview] = useState(null);

  const actor = useMemo(() => getActor(), []);
  const actorHeaders = useMemo(() => ({
    "Content-Type": "application/json",
    ...(actor.actorUserGuid ? { "X-User-Guid": actor.actorUserGuid } : {})
  }), [actor.actorUserGuid]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [lookupRes, treeRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/hr/org-v2/lookups`, { cache: "no-store" }),
        fetch(`${API_BASE_URL}/api/hr/org-v2/tree`, { cache: "no-store" })
      ]);
      const lookupJson = await lookupRes.json().catch(() => null);
      const treeJson = await treeRes.json().catch(() => null);
      if (!lookupRes.ok) throw new Error(lookupJson?.message || "تعذر تحميل بيانات الهيكل");
      if (!treeRes.ok) throw new Error(treeJson?.message || "تعذر تحميل شجرة الهيكل");
      setLookups({
        units: Array.isArray(lookupJson?.data?.units) ? lookupJson.data.units : [],
        employees: Array.isArray(lookupJson?.data?.employees) ? lookupJson.data.employees : []
      });
      setTree({
        units: Array.isArray(treeJson?.data?.units) ? treeJson.data.units : [],
        managers: Array.isArray(treeJson?.data?.managers) ? treeJson.data.managers : [],
        members: Array.isArray(treeJson?.data?.members) ? treeJson.data.members : []
      });
    } catch (e) {
      setError(e?.message || "تعذر تحميل الهيكل الإداري");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const childrenMap = useMemo(() => {
    const map = new Map();
    tree.units.forEach((u) => {
      const key = u.parentOrgUnitGuid || "ROOT";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(u);
    });
    return map;
  }, [tree.units]);

  const managersByUnit = useMemo(() => {
    const map = new Map();
    tree.managers.forEach((m) => {
      if (!map.has(m.orgUnitGuid)) map.set(m.orgUnitGuid, []);
      map.get(m.orgUnitGuid).push(m);
    });
    return map;
  }, [tree.managers]);

  const roots = useMemo(() => childrenMap.get("ROOT") || [], [childrenMap]);

  const saveUnit = async () => {
    if (!unitForm.unitName.trim()) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/hr/org-v2/unit`, {
        method: "POST",
        headers: actorHeaders,
        body: JSON.stringify({ ...unitForm, parentOrgUnitGuid: unitForm.parentOrgUnitGuid || null, actorUserGuid: actor.actorUserGuid })
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || json?.error || "تعذر حفظ الوحدة");
      setUnitOpen(false);
      setUnitForm(emptyUnit());
      await loadAll();
    } catch (e) {
      await Swal.fire({ icon: "error", title: "تعذر الحفظ", text: e?.message || "حدث خطأ" });
    } finally { setLoading(false); }
  };

  const saveManager = async () => {
    if (!managerForm.orgUnitGuid || !managerForm.managerUserGuid) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/hr/org-v2/manager`, {
        method: "POST", headers: actorHeaders,
        body: JSON.stringify({ ...managerForm, actorUserGuid: actor.actorUserGuid })
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || json?.error || "تعذر حفظ المسؤول");
      setManagerForm(emptyManager());
      await loadAll();
    } catch (e) { await Swal.fire({ icon: "error", title: "تعذر الحفظ", text: e?.message || "حدث خطأ" }); }
    finally { setLoading(false); }
  };

  const removeManager = async (guid) => {
    const ok = await Swal.fire({ icon: "warning", title: "إيقاف هذا التعيين؟", showCancelButton: true, confirmButtonText: "نعم", cancelButtonText: "رجوع" });
    if (!ok.isConfirmed) return;
    await fetch(`${API_BASE_URL}/api/hr/org-v2/manager/${guid}`, { method: "DELETE", headers: actorHeaders });
    await loadAll();
  };

  const saveMember = async () => {
    if (!memberUnitGuid || !memberEmployeeGuid) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/hr/org-v2/member`, {
        method: "POST", headers: actorHeaders,
        body: JSON.stringify({ orgUnitGuid: memberUnitGuid, employeeGuid: memberEmployeeGuid, isPrimary: memberPrimary, actorUserGuid: actor.actorUserGuid })
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || json?.error || "تعذر ربط الموظف");
      setMemberEmployeeGuid("");
      await loadAll();
    } catch (e) { await Swal.fire({ icon: "error", title: "تعذر الربط", text: e?.message || "حدث خطأ" }); }
    finally { setLoading(false); }
  };

  const removeMember = async (guid) => {
    await fetch(`${API_BASE_URL}/api/hr/org-v2/member/${guid}`, { method: "DELETE", headers: actorHeaders });
    await loadAll();
  };

  const testEmployee = async () => {
    if (!previewEmployeeGuid) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/hr/org-v2/manager-chain/${previewEmployeeGuid}`, { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || "تعذر اختبار الهيكل");
      setPreview(json);
    } catch (e) { setError(e?.message || "تعذر الاختبار"); }
    finally { setLoading(false); }
  };

  return (
    <Box dir="rtl">
      <Alert severity="success" sx={{ mb: 1 }}>
        هذا هو المصدر الموحد: أي مسؤول أو عضو أو ترتيب تعدله هنا ينعكس على رؤية الرئيسية، المدير المباشر، الإجازات والأذونات.
      </Alert>

      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1} sx={{ mb: 1 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
          <Tab label="الهيكل التنظيمي" />
          <Tab label="المسؤولون والصلاحيات" />
          <Tab label="أعضاء الوحدات" />
          <Tab label="اختبار الهيكل" />
        </Tabs>
        <Stack direction="row" spacing={0.7}>
          <IconButton onClick={loadAll} disabled={loading}><RefreshRoundedIcon /></IconButton>
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => { setUnitForm(emptyUnit()); setUnitOpen(true); }} sx={uiLayout.withUiSx({ bgcolor: primary }, uiLayout.buttonSx)}>
            وحدة جديدة
          </Button>
        </Stack>
      </Stack>

      {loading && <Stack alignItems="center" sx={{ py: 2 }}><CircularProgress size={28} /></Stack>}
      {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}

      {tab === 0 && !loading && (
        <Box>
          <Typography sx={{ fontSize: 12, color: "text.secondary", mb: 1 }}>
            الشجرة التالية هي ما سيظهر فعليًا في النظرة الإدارية. حرّك أي وحدة بتغيير الأب، وأضف فرقًا أو وحدات مخصصة بدون التقيد بمسمى ثابت.
          </Typography>
          {roots.map((root) => (
            <TreeNode key={root.orgUnitGuid} node={root} childrenMap={childrenMap} managersByUnit={managersByUnit}
              onEdit={(node) => { setUnitForm({ ...node, parentOrgUnitGuid: node.parentOrgUnitGuid || "", notes: "" }); setUnitOpen(true); }} />
          ))}
          {!roots.length && <Alert severity="warning">لا توجد وحدة جذر. شغّل SQL أو أنشئ وحدة من نوع شركة.</Alert>}
        </Box>
      )}

      {tab === 1 && !loading && (
        <Stack spacing={1}>
          <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 2.5 }}>
            <Box sx={uiLayout.withUiSx({ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.2fr 1.4fr 1fr auto" }, gap: 1 }, uiLayout.filterBarSx)}>
              <FormControl sx={uiLayout.formFieldSx} size="small">
                <InputLabel>الوحدة</InputLabel>
                <Select label="الوحدة" value={managerForm.orgUnitGuid} onChange={(e) => setManagerForm((x) => ({ ...x, orgUnitGuid: e.target.value }))}>
                  {lookups.units.map((u) => <MenuItem key={u.orgUnitGuid} value={u.orgUnitGuid}>{u.unitName}</MenuItem>)}
                </Select>
              </FormControl>
              <Autocomplete size="small" options={lookups.employees} getOptionLabel={(o) => `${o.employeeName}${o.jobTitleName ? ` - ${o.jobTitleName}` : ""}`}
                value={lookups.employees.find((e) => e.employeeGuid === managerForm.managerUserGuid) || null}
                onChange={(_, v) => setManagerForm((x) => ({ ...x, managerUserGuid: v?.employeeGuid || "" }))}
                renderInput={(params) => <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }} {...params} label="المسؤول" />} />
              <FormControl sx={uiLayout.formFieldSx} size="small">
                <InputLabel>الصفة</InputLabel>
                <Select label="الصفة" value={managerForm.managerRole} onChange={(e) => setManagerForm((x) => ({ ...x, managerRole: e.target.value }))}>
                  <MenuItem value="EXECUTIVE_MANAGER">مدير تنفيذي</MenuItem>
                  <MenuItem value="GENERAL_SUPERVISOR">مشرف عام</MenuItem>
                  <MenuItem value="BRANCH_SUPERVISOR">مشرف فرع</MenuItem>
                  <MenuItem value="ADMIN_MANAGER">مدير إداري</MenuItem>
                  <MenuItem value="DEPARTMENT_MANAGER">مدير إدارة / قسم</MenuItem>
                  <MenuItem value="DEPUTY">نائب / بديل</MenuItem>
                  <MenuItem value="MANAGER">مسؤول</MenuItem>
                </Select>
              </FormControl>
              <Button sx={uiLayout.buttonSx} variant="contained" onClick={saveManager} startIcon={<SupervisorAccountRoundedIcon />}>حفظ المسؤول</Button>
            </Box>
            <Stack direction="row" flexWrap="wrap" gap={0.6} sx={{ mt: 1 }}>
              {[
                ["isPrimary", "مسؤول أساسي"], ["canViewTeam", "يرى الفريق"], ["canViewDescendants", "يرى الوحدات التابعة"],
                ["canApproveLeaves", "يعتمد الإجازات"], ["canApprovePermissions", "يعتمد الأذونات"], ["canReviewAttendance", "يراجع الحضور"]
              ].map(([key, label]) => (
                <FormControlLabel key={key} control={<Checkbox checked={Boolean(managerForm[key])} onChange={(e) => setManagerForm((x) => ({ ...x, [key]: e.target.checked }))} />} label={label} />
              ))}
            </Stack>
          </Paper>

          {tree.units.map((u) => {
            const managers = managersByUnit.get(u.orgUnitGuid) || [];
            if (!managers.length) return null;
            return (
              <Paper key={u.orgUnitGuid} variant="outlined" sx={{ p: 1, borderRadius: 2 }}>
                <Typography sx={{ fontWeight: 950, mb: 0.7 }}>{u.unitName}</Typography>
                <Stack spacing={0.6}>
                  {managers.map((m) => (
                    <Stack key={m.orgUnitManagerGuid} direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={0.7}>
                      <Box>
                        <Typography sx={{ fontWeight: 900 }}>{m.managerName} — {roleName(m.managerRole)}</Typography>
                        <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                          {m.canViewTeam ? "رؤية الفريق" : "بدون رؤية"} • {m.canApproveLeaves ? "إجازات" : ""} {m.canApprovePermissions ? "• أذونات" : ""} {m.canReviewAttendance ? "• حضور" : ""}
                        </Typography>
                      </Box>
                      <IconButton color="error" onClick={() => removeManager(m.orgUnitManagerGuid)}><DeleteOutlineRoundedIcon /></IconButton>
                    </Stack>
                  ))}
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}

      {tab === 2 && !loading && (
        <Stack spacing={1}>
          <Alert severity="info">العضوية هي التي تحدد مكان الموظف الحقيقي في الهيكل. يمكن نقله لأي وحدة بغض النظر عن الفرع أو القسم القديم.</Alert>
          <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 2.5 }}>
            <Box sx={uiLayout.withUiSx({ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1.5fr auto auto" }, gap: 1, alignItems: "center" }, uiLayout.filterBarSx)}>
              <FormControl sx={uiLayout.formFieldSx} size="small">
                <InputLabel>الوحدة</InputLabel>
                <Select label="الوحدة" value={memberUnitGuid} onChange={(e) => setMemberUnitGuid(e.target.value)}>
                  {lookups.units.map((u) => <MenuItem key={u.orgUnitGuid} value={u.orgUnitGuid}>{u.unitName}</MenuItem>)}
                </Select>
              </FormControl>
              <Autocomplete size="small" options={lookups.employees} getOptionLabel={(o) => `${o.employeeName}${o.jobTitleName ? ` - ${o.jobTitleName}` : ""}`}
                value={lookups.employees.find((e) => e.employeeGuid === memberEmployeeGuid) || null}
                onChange={(_, v) => setMemberEmployeeGuid(v?.employeeGuid || "")}
                renderInput={(params) => <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }} {...params} label="الموظف" />} />
              <FormControlLabel sx={uiLayout.checkboxFieldSx} control={<Checkbox checked={memberPrimary} onChange={(e) => setMemberPrimary(e.target.checked)} />} label="الوحدة الأساسية" />
              <Button sx={uiLayout.buttonSx} variant="contained" onClick={saveMember} startIcon={<GroupsRoundedIcon />}>ربط الموظف</Button>
            </Box>
          </Paper>
          {tree.units.map((u) => {
            const members = tree.members.filter((m) => m.orgUnitGuid === u.orgUnitGuid);
            if (!members.length) return null;
            return <Paper key={u.orgUnitGuid} variant="outlined" sx={{ p: 1, borderRadius: 2 }}>
              <Typography sx={{ fontWeight: 950, mb: 0.7 }}>{u.unitName} <Chip size="small" label={members.length} /></Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.6}>
                {members.map((m) => <Chip sx={hrChipSx()} key={m.orgUnitMemberGuid} label={`${m.employeeName}${m.isPrimary ? " • أساسي" : ""}`} color={m.isPrimary ? "success" : "default"} onDelete={() => removeMember(m.orgUnitMemberGuid)} />)}
              </Stack>
            </Paper>;
          })}
        </Stack>
      )}

      {tab === 3 && !loading && (
        <Stack sx={uiLayout.filterBarSx} spacing={1}>
          <Alert severity="info">اختَر موظفًا لتشاهد السلسلة الفعلية التي سيستخدمها النظام في الرؤية والموافقات.</Alert>
          <Autocomplete options={lookups.employees} getOptionLabel={(o) => `${o.employeeName}${o.jobTitleName ? ` - ${o.jobTitleName}` : ""}`}
            value={lookups.employees.find((e) => e.employeeGuid === previewEmployeeGuid) || null}
            onChange={(_, v) => { setPreviewEmployeeGuid(v?.employeeGuid || ""); setPreview(null); }}
            renderInput={(params) => <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }} {...params} label="الموظف" />} />
          <Button sx={uiLayout.buttonSx} variant="contained" onClick={testEmployee} disabled={!previewEmployeeGuid} startIcon={<AccountTreeRoundedIcon />}>عرض السلسلة الإدارية</Button>
          {preview && <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 2.5 }}>
            <Typography sx={{ fontWeight: 950, mb: 1 }}>السلسلة الإدارية الفعلية</Typography>
            {(preview.chain || []).map((level) => (
              <Box key={level.orgUnitGuid} sx={{ paddingInlineStart: Math.min(4, level.depth || 0) * 2, mb: 1 }}>
                <Typography sx={{ fontWeight: 900 }}>{level.unitName} <Chip size="small" label={unitTypeName(level.unitType)} /></Typography>
                <Stack direction="row" gap={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                  {(level.managers || []).map((m) => <Chip key={m.managerUserGuid} label={`${m.managerName} • ${roleName(m.managerRole)}`} color={m.isPrimary ? "success" : "default"} />)}
                  {!(level.managers || []).length && <Typography sx={{ fontSize: 12, color: "text.secondary" }}>لا يوجد مسؤول في هذا المستوى</Typography>}
                </Stack>
              </Box>
            ))}
          </Paper>}
        </Stack>
      )}

      <Dialog sx={uiLayout.dialogLayoutSx} open={unitOpen} onClose={() => setUnitOpen(false)} fullWidth maxWidth="sm" dir="rtl">
        <DialogTitle sx={{ fontWeight: 950 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <span>{unitForm.orgUnitGuid ? "تعديل الوحدة التنظيمية" : "وحدة تنظيمية جديدة"}</span>
            <IconButton onClick={() => setUnitOpen(false)}><CloseRoundedIcon /></IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1} sx={uiLayout.withUiSx({ pt: 0.5 }, uiLayout.formGridSx)}>
            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }} label="اسم الوحدة" value={unitForm.unitName} onChange={(e) => setUnitForm((x) => ({ ...x, unitName: e.target.value }))} />
            <FormControl sx={uiLayout.formFieldSx}>
              <InputLabel>نوع الوحدة</InputLabel>
              <Select label="نوع الوحدة" value={unitForm.unitType} onChange={(e) => setUnitForm((x) => ({ ...x, unitType: e.target.value }))}>
                <MenuItem value="COMPANY">شركة / جذر</MenuItem><MenuItem value="DEPARTMENT">إدارة / قسم</MenuItem><MenuItem value="BRANCH">فرع</MenuItem><MenuItem value="TEAM">فريق</MenuItem><MenuItem value="CUSTOM">وحدة مخصصة</MenuItem>
              </Select>
            </FormControl>
            <FormControl sx={uiLayout.formFieldSx}>
              <InputLabel>تحت أي وحدة؟</InputLabel>
              <Select label="تحت أي وحدة؟" value={unitForm.parentOrgUnitGuid || ""} onChange={(e) => setUnitForm((x) => ({ ...x, parentOrgUnitGuid: e.target.value }))}>
                <MenuItem value="">بدون أب / جذر</MenuItem>
                {lookups.units.filter((u) => u.orgUnitGuid !== unitForm.orgUnitGuid).map((u) => <MenuItem key={u.orgUnitGuid} value={u.orgUnitGuid}>{u.unitName}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }} type="number" label="الترتيب" value={unitForm.sortOrder} onChange={(e) => setUnitForm((x) => ({ ...x, sortOrder: Number(e.target.value || 100) }))}  inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }} multiline minRows={2} label="ملاحظات" value={unitForm.notes || ""} onChange={(e) => setUnitForm((x) => ({ ...x, notes: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions sx={uiLayout.dialogActionsSx}><Button sx={uiLayout.buttonSx} onClick={() => setUnitOpen(false)}>إلغاء</Button><Button sx={uiLayout.buttonSx} variant="contained" onClick={saveUnit}>حفظ</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
