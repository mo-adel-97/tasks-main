import * as uiLayout from './common/uiLayout';
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from "@mui/material";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import EventBusyRoundedIcon from "@mui/icons-material/EventBusyRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import HistoryToggleOffRoundedIcon from "@mui/icons-material/HistoryToggleOffRounded";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  "https://api4.sstli.com";

const primary = "#057546";
const primaryDark = "#034d31";
const border = "rgba(5,117,70,.15)";

const unitTypeName = (type) => ({
  COMPANY: "الشركة",
  DEPARTMENT: "إدارة / قسم",
  BRANCH: "فرع",
  TEAM: "فريق",
  CUSTOM: "وحدة"
}[type] || type || "-");

const statusName = (status) => ({
  Present: "حاضر",
  Late: "متأخر",
  Absent: "غائب",
  Leave: "إجازة",
  Permission: "إذن",
  Incomplete: "ناقص بصمة"
}[status] || status || "لم يسجل");

const statusColor = (status) => ({
  Present: "success",
  Late: "warning",
  Absent: "error",
  Leave: "info",
  Permission: "secondary",
  Incomplete: "warning"
}[status] || "default");

const fmtTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(11, 16) || "-";
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
};

function Metric({ title, value, icon, tone = "default", onClick }) {
  const backgrounds = {
    default: "#fff",
    info: "#f3f8ff",
    warning: "#fffaf0",
    danger: "#fff5f5",
    success: "#f3fbf7"
  };
  return (
    <Paper
      variant="outlined"
      onClick={onClick}
      sx={{
        p: 1.2,
        borderRadius: 2.5,
        borderColor: border,
        bgcolor: backgrounds[tone] || "#fff",
        cursor: onClick ? "pointer" : "default"
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
        <Box>
          <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{title}</Typography>
          <Typography sx={{ fontWeight: 1000, fontSize: 22, color: primaryDark }}>{value ?? 0}</Typography>
        </Box>
        <Box sx={{ color: primary }}>{icon}</Box>
      </Stack>
    </Paper>
  );
}

function UnitCard({ row, onOpen }) {
  return (
    <Paper
      variant="outlined"
      onClick={() => onOpen(row)}
      sx={{ p: 1.2, borderRadius: 2.5, borderColor: border, cursor: "pointer", "&:hover": { borderColor: primary, boxShadow: "0 6px 20px rgba(5,117,70,.09)" } }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 1000, color: primaryDark }}>{row.unitName}</Typography>
          <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{unitTypeName(row.unitType)}</Typography>
        </Box>
        <Chip size="small" label={`${row.totalEmployees || 0} موظف`} />
      </Stack>
      <Stack direction="row" gap={0.5} flexWrap="wrap" sx={{ mt: 1 }}>
        <Chip size="small" color="success" variant="outlined" label={`حاضر ${row.presentToday || 0}`} />
        <Chip size="small" color="warning" variant="outlined" label={`متأخر ${row.lateToday || 0}`} />
        <Chip size="small" color="error" variant="outlined" label={`غائب ${row.absentToday || 0}`} />
        <Chip size="small" color="info" variant="outlined" label={`إجازة ${row.leaveToday || 0}`} />
        <Chip size="small" color="secondary" variant="outlined" label={`إذن ${row.permissionToday || 0}`} />
      </Stack>
      {(row.managers || []).length > 0 && (
        <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 1 }}>
          المسؤولون: {(row.managers || []).map((m) => m.managerName).join("، ")}
        </Typography>
      )}
    </Paper>
  );
}

export default function HrOrgOverviewPanel({ userGuid }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [unitStack, setUnitStack] = useState([]);
  const [unitData, setUnitData] = useState(null);
  const [unitLoading, setUnitLoading] = useState(false);
  const [permissionApprovals, setPermissionApprovals] = useState([]);
  const [decisionLoading, setDecisionLoading] = useState("");

  const load = useCallback(async () => {
    if (!userGuid) return;
    setLoading(true);
    setError("");
    try {
      const [res, approvalRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/hr/org-v2/dashboard/${encodeURIComponent(userGuid)}`, { cache: "no-store" }),
        fetch(`${API_BASE_URL}/api/hr/permissions/workflow/my-approvals?actorUserGuid=${encodeURIComponent(userGuid)}`, {
          cache: "no-store",
          headers: { "X-User-Guid": userGuid }
        }).catch(() => null)
      ]);
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || "تعذر تحميل النظرة الإدارية");
      setData(json);
      if (approvalRes?.ok) {
        const approvalJson = await approvalRes.json().catch(() => null);
        setPermissionApprovals(Array.isArray(approvalJson?.data) ? approvalJson.data : []);
      } else {
        setPermissionApprovals([]);
      }
    } catch (e) {
      setError(e?.message || "تعذر تحميل النظرة الإدارية");
    } finally {
      setLoading(false);
    }
  }, [userGuid]);

  useEffect(() => { load(); }, [load]);

  const openUnit = useCallback(async (row, push = true) => {
    if (!row?.orgUnitGuid) return;
    setDialogOpen(true);
    setUnitLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/hr/org-v2/unit/${encodeURIComponent(row.orgUnitGuid)}/overview?actorUserGuid=${encodeURIComponent(userGuid)}`, { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || "تعذر تحميل تفاصيل الوحدة");
      setUnitData(json?.data || null);
      if (push) setUnitStack((x) => [...x, row]);
    } catch (e) {
      setUnitData({ error: e?.message || "تعذر تحميل التفاصيل", children: [], team: [] });
    } finally { setUnitLoading(false); }
  }, [userGuid]);

  const decidePermission = useCallback(async (row, decision) => {
    if (!row?.permissionGuid || !userGuid) return;
    setDecisionLoading(row.permissionGuid);
    try {
      const currentUser = (() => {
        try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
      })();
      const actorName = currentUser?.fullName || currentUser?.FullName || currentUser?.userName || currentUser?.UserName || "مستخدم النظام";
      const res = await fetch(
        `${API_BASE_URL}/api/hr/permissions/workflow/${encodeURIComponent(row.permissionGuid)}/decision`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-User-Guid": userGuid },
          body: JSON.stringify({ actorUserGuid: userGuid, actorName, decision, notes: "" })
        }
      );
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || json?.error || "تعذر تنفيذ القرار");
      await load();
    } catch (e) {
      setError(e?.message || "تعذر تنفيذ قرار الإذن");
    } finally {
      setDecisionLoading("");
    }
  }, [userGuid, load]);

  const goBack = async () => {
    if (unitStack.length <= 1) {
      setDialogOpen(false);
      setUnitStack([]);
      setUnitData(null);
      return;
    }
    const nextStack = unitStack.slice(0, -1);
    setUnitStack(nextStack);
    await openUnit(nextStack[nextStack.length - 1], false);
  };

  const summary = data?.summary || {};
  const topUnits = Array.isArray(data?.topUnits) ? data.topUnits : [];
  const canManage = data?.enabled && data?.canManage;

  if (loading) return <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, mb: 1.4 }}><Stack alignItems="center"><CircularProgress size={26} /></Stack></Paper>;
  if (!data?.enabled) return null;
  if (!canManage) return null;

  return (
    <Box sx={{ mb: 1.4 }} dir="rtl">
      <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 3, borderColor: border, mb: 1 }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} gap={1}>
          <Box>
            <Stack direction="row" spacing={0.7} alignItems="center">
              <AccountTreeRoundedIcon sx={{ color: primary }} />
              <Typography sx={{ fontWeight: 1000, fontSize: 18, color: primaryDark }}>نظرتي الإدارية اليوم</Typography>
            </Stack>
            <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 0.4 }}>
              الرؤية ناتجة من الهيكل الإداري الموحد؛ اضغط على أي وحدة للنزول للتفاصيل.
            </Typography>
          </Box>
          <Button sx={uiLayout.buttonSx} size="small" variant="outlined" onClick={load}>تحديث النظرة</Button>
        </Stack>
      </Paper>

      {error && <Alert severity="warning" sx={{ mb: 1 }}>{error}</Alert>}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2,1fr)", md: "repeat(4,1fr)", xl: "repeat(8,1fr)" }, gap: 1, mb: 1 }}>
        <Metric title="إجمالي النطاق" value={summary.totalEmployees} icon={<GroupsRoundedIcon />} />
        <Metric title="حاضر اليوم" value={summary.presentToday} icon={<CheckCircleRoundedIcon />} tone="success" />
        <Metric title="متأخر" value={summary.lateToday} icon={<AccessTimeRoundedIcon />} tone={Number(summary.lateToday || 0) ? "warning" : "default"} />
        <Metric title="غائب" value={summary.absentToday} icon={<EventBusyRoundedIcon />} tone={Number(summary.absentToday || 0) ? "danger" : "default"} />
        <Metric title="إجازة" value={summary.leaveToday} icon={<EventAvailableRoundedIcon />} tone="info" />
        <Metric title="إذن" value={summary.permissionToday} icon={<FactCheckRoundedIcon />} />
        <Metric title="ناقص بصمة" value={summary.incompleteToday} icon={<HistoryToggleOffRoundedIcon />} tone={Number(summary.incompleteToday || 0) ? "warning" : "default"} />
        <Metric title="أذونات تنتظرني" value={permissionApprovals.length} icon={<FactCheckRoundedIcon />} tone={permissionApprovals.length ? "warning" : "default"} />
      </Box>

      {permissionApprovals.length > 0 && (
        <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 3, borderColor: border, mb: 1 }}>
          <Typography sx={{ fontWeight: 950, color: primaryDark, mb: 1 }}>أذونات تنتظر موافقتي</Typography>
          <Stack spacing={0.7}>
            {permissionApprovals.slice(0, 6).map((row) => (
              <Paper key={row.permissionGuid} variant="outlined" sx={{ p: 0.9, borderRadius: 2 }}>
                <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={1} alignItems={{ md: "center" }}>
                  <Box>
                    <Typography sx={{ fontWeight: 900 }}>{row.employeeName}</Typography>
                    <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                      {row.stepName || "موافقة"} • {row.permissionDate ? String(row.permissionDate).slice(0, 10) : "-"} • {row.reason || "بدون سبب"}
                    </Typography>
                  </Box>
                  <Stack sx={uiLayout.actionBarSx} direction="row" spacing={0.6}>
                    <Button sx={uiLayout.buttonSx}
                      size="small"
                      color="error"
                      variant="outlined"
                      disabled={decisionLoading === row.permissionGuid}
                      onClick={() => decidePermission(row, "REJECT")}
                    >رفض</Button>
                    <Button sx={uiLayout.buttonSx}
                      size="small"
                      color="success"
                      variant="contained"
                      disabled={decisionLoading === row.permissionGuid}
                      onClick={() => decidePermission(row, "APPROVE")}
                    >موافقة</Button>
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Paper>
      )}

      <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 3, borderColor: border }}>
        <Typography sx={{ fontWeight: 950, color: primaryDark, mb: 1 }}>الوحدات الموجودة تحت نطاقي</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2,1fr)", xl: "repeat(3,1fr)" }, gap: 1 }}>
          {topUnits.map((u) => <UnitCard key={u.orgUnitGuid} row={u} onOpen={openUnit} />)}
        </Box>
        {!topUnits.length && <Alert severity="info">النطاق الإداري موجود ولكن لا توجد وحدات تابعة أو أعضاء حتى الآن.</Alert>}
      </Paper>

      <Dialog sx={uiLayout.dialogLayoutSx} open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="lg" dir="rtl">
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={0.6} alignItems="center">
              {unitStack.length > 1 && <IconButton onClick={goBack}><ArrowBackRoundedIcon /></IconButton>}
              <Box>
                <Typography sx={{ fontWeight: 1000 }}>{unitData?.unit?.unitName || unitStack.at(-1)?.unitName || "تفاصيل الوحدة"}</Typography>
                <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                  {unitStack.map((x) => x.unitName).join(" ← ")}
                </Typography>
              </Box>
            </Stack>
            <IconButton onClick={() => setDialogOpen(false)}><CloseRoundedIcon /></IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {unitLoading ? <Stack alignItems="center" sx={{ py: 4 }}><CircularProgress /></Stack> : (
            <Stack spacing={1.2}>
              {unitData?.error && <Alert severity="error">{unitData.error}</Alert>}
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2,1fr)", md: "repeat(4,1fr)" }, gap: 0.8 }}>
                <Metric title="الموظفون" value={unitData?.unit?.totalEmployees} icon={<GroupsRoundedIcon />} />
                <Metric title="حاضر" value={unitData?.unit?.presentToday} icon={<CheckCircleRoundedIcon />} tone="success" />
                <Metric title="متأخر" value={unitData?.unit?.lateToday} icon={<AccessTimeRoundedIcon />} tone="warning" />
                <Metric title="غائب" value={unitData?.unit?.absentToday} icon={<EventBusyRoundedIcon />} tone="danger" />
              </Box>

              {(unitData?.children || []).length > 0 && (
                <Box>
                  <Typography sx={{ fontWeight: 950, mb: 0.8 }}>الوحدات التابعة</Typography>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2,1fr)", xl: "repeat(3,1fr)" }, gap: 0.8 }}>
                    {(unitData.children || []).map((u) => <UnitCard key={u.orgUnitGuid} row={u} onOpen={openUnit} />)}
                  </Box>
                </Box>
              )}

              <Box>
                <Typography sx={{ fontWeight: 950, mb: 0.8 }}>حالة الفريق اليوم</Typography>
                <TableContainer component={Paper} variant="outlined" sx={uiLayout.withUiSx({ maxHeight: 440 }, uiLayout.tableContainerSx)}>
                  <Table size="small" stickyHeader>
                    <TableHead><TableRow><TableCell>الموظف</TableCell><TableCell>المسمى</TableCell><TableCell>الحالة</TableCell><TableCell>الدخول</TableCell><TableCell>الخروج</TableCell></TableRow></TableHead>
                    <TableBody>
                      {(unitData?.team || []).map((row) => (
                        <TableRow key={row.employeeGuid} hover>
                          <TableCell><Typography sx={{ fontWeight: 900, fontSize: 12 }}>{row.employeeName}</Typography><Typography sx={{ fontSize: 12, color: "text.secondary" }}>{row.employeeCode}</Typography></TableCell>
                          <TableCell>{row.jobTitleName || "-"}</TableCell>
                          <TableCell><Chip size="small" color={statusColor(row.status)} label={statusName(row.status)} /></TableCell>
                          <TableCell>{fmtTime(row.checkInAt)}</TableCell>
                          <TableCell>{fmtTime(row.checkOutAt)}</TableCell>
                        </TableRow>
                      ))}
                      {!(unitData?.team || []).length && <TableRow><TableCell colSpan={5} align="center">لا يوجد أعضاء داخل هذه الوحدة.</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={uiLayout.dialogActionsSx}><Button sx={uiLayout.buttonSx} onClick={() => setDialogOpen(false)}>إغلاق</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
