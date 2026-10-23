// قوائم إدارة التعاقدات: التقارير، الشركات، الفرص (الموظف: بتاعته بس — المدير: الكل).
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery
} from "@mui/material";
import * as XLSX from "xlsx";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import AddBusinessRoundedIcon from "@mui/icons-material/AddBusinessRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { workbookFromRows } from "../../utils/excelExport";
import P2PCompanyDialog from "./P2PCompanyDialog";
import P2PReportView from "./P2PReportView";
import {
  GREEN,
  GREEN_DARK,
  REPORT_STATUS,
  STAGES,
  colorOf,
  labelOf,
  monthStart,
  money,
  p2pApi,
  toast,
  useUi
} from "./p2pShared";
import P2PToneChip from "./P2PToneChip";

function EmployeeFilter({ employees, value, onChange }) {
  return (
    <Autocomplete
      options={employees}
      value={employees.find((e) => e.guid === value) || null}
      onChange={(_, e) => onChange(e?.guid || "")}
      getOptionLabel={(o) => o.name}
      isOptionEqualToValue={(a, b) => a.guid === b.guid}
      renderInput={(params) => <TextField {...params} size="small" label="الموظف" placeholder="كل الموظفين" InputLabelProps={{ shrink: true }} />}
      sx={{ width: { xs: "100%", md: 320 }, flexShrink: 0 }}
      ListboxProps={{ style: { maxHeight: 360 } }}
    />
  );
}

export function useEmployees(isManager) {
  const [employees, setEmployees] = useState([]);
  useEffect(() => {
    if (!isManager) return;
    p2pApi("/employees").then(setEmployees).catch(() => setEmployees([]));
  }, [isManager]);
  return employees;
}

// ============================== التقارير ==============================

export function P2PReportsList({ me, onOpenOwnReport }) {
  const ui = useUi();
  const fullScreen = useMediaQuery(ui.theme.breakpoints.down("md"));
  const isManager = me?.role === "manager";
  const employees = useEmployees(isManager);
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(me?.today || "");
  const [status, setStatus] = useState(isManager ? "submitted" : "all");
  const [employee, setEmployee] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(null);
  const [openLoading, setOpenLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await p2pApi("/reports", { query: { from, to, status, employeeGuid: employee } }));
    } catch (e) {
      toast("error", "حدث خطأ", e.message);
    } finally {
      setLoading(false);
    }
  }, [from, to, status, employee]);

  useEffect(() => {
    load();
  }, [load]);

  const openReport = async (row) => {
    if (!isManager) {
      onOpenOwnReport?.(row.reportDate);
      return;
    }
    setOpenLoading(true);
    try {
      setOpen(await p2pApi(`/reports/${row.guid}`));
    } catch (e) {
      toast("error", "حدث خطأ", e.message);
    } finally {
      setOpenLoading(false);
    }
  };

  const exportExcel = () => {
    const data = [
      ["التاريخ", "الموظف", "الحالة", "الزيارات", "ميدانية", "هاتفية/إلكترونية", "شركات زارها", "الفرص", "قيمة الفرص", "متابعة إضافية", "تدخل الإدارة", "تاريخ الإرسال", "المراجِع"],
      ...rows.map((r) => [
        r.reportDate,
        r.employeeName,
        REPORT_STATUS[r.status]?.label || r.status,
        r.visitsCount,
        r.fieldVisits,
        r.remoteVisits,
        r.companiesVisited,
        r.opportunitiesCount,
        r.opportunitiesValue,
        r.needsFollowUp ? "نعم" : "",
        r.needsIntervention ? "نعم" : "",
        r.submittedAt || "",
        r.reviewedBy || ""
      ])
    ];
    XLSX.writeFile(workbookFromRows(data, "التقارير اليومية"), `التقارير اليومية ${from} إلى ${to}.xlsx`);
  };

  return (
    <Box>
      <Paper elevation={0} sx={{ ...ui.card, p: 1.5, mb: 1.5 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} flexWrap="wrap" useFlexGap>
          <TextField type="date" label="من" value={from} onChange={(e) => setFrom(e.target.value)} size="small" InputLabelProps={{ shrink: true }} />
          <TextField type="date" label="إلى" value={to} onChange={(e) => setTo(e.target.value)} size="small" InputLabelProps={{ shrink: true }} />
          <TextField select label="الحالة" value={status} onChange={(e) => setStatus(e.target.value)} size="small" sx={{ minWidth: 190 }}>
            <MenuItem value="all">الكل</MenuItem>
            {Object.entries(REPORT_STATUS)
              .filter(([k]) => !isManager || k !== "draft")
              .map(([k, s]) => (
                <MenuItem key={k} value={k}>{s.label}</MenuItem>
              ))}
          </TextField>
          {isManager ? <EmployeeFilter employees={employees} value={employee} onChange={setEmployee} /> : null}
          <Box sx={{ flex: 1 }} />
          <Chip label={`${rows.length} تقرير`} sx={{ fontWeight: 800 }} />
          <Button variant="outlined" startIcon={<FileDownloadRoundedIcon />} disabled={!rows.length} onClick={exportExcel} sx={{ fontWeight: 800 }}>
            Excel
          </Button>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ ...ui.card, overflow: "hidden" }}>
        <TableContainer sx={{ maxHeight: "calc(100vh - 380px)", minHeight: 260 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={ui.headRow}>
                <TableCell>التاريخ</TableCell>
                {isManager ? <TableCell>الموظف</TableCell> : null}
                <TableCell align="center">الحالة</TableCell>
                <TableCell align="center">الزيارات</TableCell>
                <TableCell align="center">ميدانية / عن بُعد</TableCell>
                <TableCell align="center">الفرص</TableCell>
                <TableCell align="center">قيمة الفرص</TableCell>
                <TableCell align="center">تنبيهات</TableCell>
                <TableCell align="center">عرض</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}><CircularProgress size={28} /></TableCell>
                </TableRow>
              ) : rows.length ? (
                rows.map((r) => (
                  <TableRow key={r.guid} sx={{ ...ui.bodyRow, cursor: "pointer" }} onClick={() => openReport(r)}>
                    <TableCell sx={{ fontWeight: 800, whiteSpace: "nowrap" }}>{r.reportDate}</TableCell>
                    {isManager ? <TableCell sx={{ fontWeight: 800 }}>{r.employeeName}</TableCell> : null}
                    <TableCell align="center">
                      <P2PToneChip size="small" label={REPORT_STATUS[r.status]?.label || r.status} tone={REPORT_STATUS[r.status]?.color || "default"} sx={{ fontWeight: 800 }} />
                    </TableCell>
                    <TableCell align="center">{r.visitsCount}</TableCell>
                    <TableCell align="center">{r.fieldVisits} / {r.remoteVisits}</TableCell>
                    <TableCell align="center">{r.opportunitiesCount}</TableCell>
                    <TableCell align="center">{money(r.opportunitiesValue)}</TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        {r.needsFollowUp ? <P2PToneChip size="small" tone="info" label="متابعة" /> : null}
                        {r.needsIntervention ? <P2PToneChip size="small" tone="warning" label="تدخل" /> : null}
                        {r.status === "returned" ? <P2PToneChip size="small" tone="error" label="معاد" /> : null}
                      </Stack>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" color="primary">
                        <VisibilityRoundedIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6, color: "text.secondary" }}>لا توجد تقارير في هذه الفترة</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={Boolean(open) || openLoading} onClose={() => setOpen(null)} fullScreen={fullScreen} maxWidth="xl" fullWidth dir="rtl" PaperProps={{ sx: ui.dialogPaper }}>
        <DialogTitle sx={{ color: "#fff", background: `linear-gradient(135deg,${GREEN},${GREEN_DARK})` }}>
          <Stack direction="row" alignItems="center">
            <Typography sx={{ fontWeight: 900, flex: 1 }}>
              التقرير اليومي{open ? ` — ${open.employeeName} — ${open.reportDate}` : ""}
            </Typography>
            <IconButton onClick={() => setOpen(null)} sx={{ color: "#fff" }} aria-label="إغلاق">
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          {openLoading || !open ? (
            <Box sx={{ py: 8, textAlign: "center" }}><CircularProgress /></Box>
          ) : (
            <P2PReportView
              report={open}
              onChanged={async () => {
                const fresh = await p2pApi(`/reports/${open.guid}`).catch(() => null);
                setOpen(fresh);
                load();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

// ============================== الشركات ==============================

export function P2PCompaniesList({ me }) {
  const ui = useUi();
  const isManager = me?.role === "manager";
  const employees = useEmployees(isManager);
  const [employee, setEmployee] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [dialog, setDialog] = useState({ open: false, company: null });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await p2pApi("/companies", { query: { employeeGuid: employee, includeInactive: String(showArchived) } }));
    } catch (e) {
      toast("error", "حدث خطأ", e.message);
    } finally {
      setLoading(false);
    }
  }, [employee, showArchived]);

  useEffect(() => {
    load();
  }, [load]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => [r.name, r.sector, r.city, r.contactName, r.phone, r.contactPhone, r.ownerName].some((v) => String(v || "").toLowerCase().includes(q)));
  }, [rows, search]);

  const exportExcel = () => {
    const data = [
      ["الشركة", "النشاط", "المدينة", "هاتف", "البريد", "المسؤول", "المسمى", "جوال المسؤول", "الزيارات", "آخر زيارة", "فرص مفتوحة", "تعاقدات", ...(isManager ? ["الموظف"] : [])],
      ...shown.map((r) => [
        r.name, r.sector, r.city, r.phone, r.email, r.contactName, r.contactTitle, r.contactPhone, r.visitsCount, r.lastVisitDate, r.openOpportunities, r.wonOpportunities,
        ...(isManager ? [r.ownerName] : [])
      ])
    ];
    XLSX.writeFile(workbookFromRows(data, "الشركات"), "شركات إدارة التعاقدات.xlsx");
  };

  return (
    <Box>
      <Paper elevation={0} sx={{ ...ui.card, p: 1.5, mb: 1.5 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} flexWrap="wrap" useFlexGap>
          {!isManager ? (
            <Button variant="contained" startIcon={<AddBusinessRoundedIcon />} onClick={() => setDialog({ open: true, company: null })} sx={ui.primaryBtn}>
              شركة جديدة
            </Button>
          ) : (
            <EmployeeFilter employees={employees} value={employee} onChange={setEmployee} />
          )}
          <TextField
            size="small"
            placeholder="بحث بالاسم أو المدينة أو المسؤول..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> }}
            sx={{ minWidth: 280 }}
          />
          <Chip
            label={showArchived ? "يعرض المؤرشفة" : "النشطة فقط"}
            clickable
            variant={showArchived ? "filled" : "outlined"}
            onClick={() => setShowArchived((v) => !v)}
            sx={{ fontWeight: 800 }}
          />
          <Box sx={{ flex: 1 }} />
          <Chip label={`${shown.length} شركة`} sx={{ fontWeight: 800 }} />
          <Button variant="outlined" startIcon={<FileDownloadRoundedIcon />} disabled={!shown.length} onClick={exportExcel} sx={{ fontWeight: 800 }}>
            Excel
          </Button>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ ...ui.card, overflow: "hidden" }}>
        <TableContainer sx={{ maxHeight: "calc(100vh - 380px)", minHeight: 260 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={ui.headRow}>
                <TableCell>الشركة</TableCell>
                <TableCell>النشاط / المدينة</TableCell>
                <TableCell>المسؤول</TableCell>
                <TableCell>التواصل</TableCell>
                <TableCell align="center">الزيارات</TableCell>
                <TableCell align="center">آخر زيارة</TableCell>
                <TableCell align="center">الفرص</TableCell>
                {isManager ? <TableCell>الموظف</TableCell> : <TableCell align="center">تعديل</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}><CircularProgress size={28} /></TableCell></TableRow>
              ) : shown.length ? (
                shown.map((c) => (
                  <TableRow key={c.guid} sx={{ ...ui.bodyRow, opacity: c.isActive ? 1 : 0.55 }}>
                    <TableCell sx={{ fontWeight: 900 }}>
                      {c.name}
                      {!c.isActive ? <Chip size="small" label="مؤرشفة" sx={{ ml: 1 }} /> : null}
                    </TableCell>
                    <TableCell>{[c.sector, c.city].filter(Boolean).join(" — ") || "—"}</TableCell>
                    <TableCell>
                      {c.contactName || "—"}
                      {c.contactTitle ? <Typography variant="caption" sx={{ display: "block" }} color="text.secondary">{c.contactTitle}</Typography> : null}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {[c.contactPhone, c.phone].filter(Boolean).join(" / ") || "—"}
                      {c.email ? <Typography variant="caption" sx={{ display: "block" }} color="text.secondary">{c.email}</Typography> : null}
                    </TableCell>
                    <TableCell align="center">{c.visitsCount}</TableCell>
                    <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>{c.lastVisitDate || "—"}</TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        {c.openOpportunities ? <P2PToneChip size="small" tone="warning" label={`${c.openOpportunities} مفتوحة`} /> : null}
                        {c.wonOpportunities ? <P2PToneChip size="small" tone="success" label={`${c.wonOpportunities} تعاقد`} /> : null}
                        {!c.openOpportunities && !c.wonOpportunities ? "—" : null}
                      </Stack>
                    </TableCell>
                    {isManager ? (
                      <TableCell>{c.ownerName}</TableCell>
                    ) : (
                      <TableCell align="center">
                        <Tooltip title="تعديل">
                          <IconButton size="small" onClick={() => setDialog({ open: true, company: c })}>
                            <EditRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    {isManager ? "لا توجد شركات" : "لا توجد شركات — أضف أول شركة"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <P2PCompanyDialog
        open={dialog.open}
        company={dialog.company}
        onClose={() => setDialog({ open: false, company: null })}
        onSaved={() => {
          setDialog({ open: false, company: null });
          toast("success", "تم", "تم حفظ الشركة");
          load();
        }}
      />
    </Box>
  );
}

// ============================== الفرص ==============================

function OpportunityDialog({ open, opportunity, onClose, onSaved }) {
  const ui = useUi();
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && opportunity)
      setForm({
        stage: opportunity.stage,
        nextAction: opportunity.nextAction || "",
        followUpDate: opportunity.followUpDate || "",
        expectedTrainees: opportunity.expectedTrainees ?? "",
        estimatedValue: opportunity.estimatedValue ?? "",
        notes: opportunity.notes || ""
      });
  }, [open, opportunity]);

  const save = async () => {
    setSaving(true);
    try {
      const result = await p2pApi(`/opportunities/${opportunity.guid}`, {
        method: "PUT",
        body: {
          ...form,
          followUpDate: form.followUpDate || null,
          expectedTrainees: form.expectedTrainees === "" ? null : Number(form.expectedTrainees),
          estimatedValue: form.estimatedValue === "" ? null : Number(form.estimatedValue)
        }
      });
      toast("success", "تم", result?.message);
      onSaved();
    } catch (e) {
      toast("error", "حدث خطأ", e.message);
    } finally {
      setSaving(false);
    }
  };

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth dir="rtl" PaperProps={{ sx: ui.dialogPaper }}>
      <DialogTitle sx={{ fontWeight: 900, color: "#fff", background: `linear-gradient(135deg,${GREEN},${GREEN_DARK})` }}>
        متابعة الفرصة — {opportunity?.companyName}
      </DialogTitle>
      <DialogContent sx={{ pt: "16px !important" }}>
        <Typography sx={{ mb: 1.5, fontWeight: 700 }}>{opportunity?.trainingNeed}</Typography>
        <Grid container spacing={1.5}>
          <Grid item xs={12}>
            <TextField select label="حالة الفرصة" value={form.stage || "new"} onChange={set("stage")} size="small" fullWidth>
              {STAGES.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12}><TextField label="الإجراء القادم" value={form.nextAction || ""} onChange={set("nextAction")} size="small" fullWidth /></Grid>
          <Grid item xs={12} md={6}><TextField type="date" label="موعد المتابعة" value={form.followUpDate || ""} onChange={set("followUpDate")} size="small" fullWidth InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={6} md={3}><TextField type="number" label="المتدربين" value={form.expectedTrainees} onChange={set("expectedTrainees")} size="small" fullWidth /></Grid>
          <Grid item xs={6} md={3}><TextField type="number" label="القيمة" value={form.estimatedValue} onChange={set("estimatedValue")} size="small" fullWidth /></Grid>
          <Grid item xs={12}><TextField label="ملاحظات" value={form.notes || ""} onChange={set("notes")} size="small" fullWidth multiline minRows={2} /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 1.5 }}>
        <Button onClick={onClose} disabled={saving} color="inherit">إلغاء</Button>
        <Button variant="contained" onClick={save} disabled={saving} sx={ui.primaryBtn}>حفظ</Button>
      </DialogActions>
    </Dialog>
  );
}

export function P2POpportunitiesList({ me }) {
  const ui = useUi();
  const isManager = me?.role === "manager";
  const employees = useEmployees(isManager);
  const [employee, setEmployee] = useState("");
  const [stage, setStage] = useState("open");
  const [dueOnly, setDueOnly] = useState(false);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [edit, setEdit] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await p2pApi("/opportunities", {
        query: { employeeGuid: employee, stage: stage === "open" ? "" : stage, dueOnly: String(dueOnly) }
      });
      setRows(stage === "open" ? data.filter((o) => o.stage !== "won" && o.stage !== "lost") : data);
    } catch (e) {
      toast("error", "حدث خطأ", e.message);
    } finally {
      setLoading(false);
    }
  }, [employee, stage, dueOnly]);

  useEffect(() => {
    load();
  }, [load]);

  const totalValue = rows.reduce((s, o) => s + Number(o.estimatedValue || 0), 0);
  const overdue = rows.filter((o) => o.overdue).length;

  const exportExcel = () => {
    const data = [
      ["الشركة", "الاحتياج", "المتدربين", "القيمة", "الحالة", "الإجراء القادم", "موعد المتابعة", "متأخرة", "تاريخ التقرير", ...(isManager ? ["الموظف"] : [])],
      ...rows.map((o) => [
        o.companyName, o.trainingNeed, o.expectedTrainees ?? "", o.estimatedValue ?? "", labelOf(STAGES, o.stage), o.nextAction || "", o.followUpDate || "",
        o.overdue ? "نعم" : "", o.reportDate || "", ...(isManager ? [o.employeeName] : [])
      ])
    ];
    XLSX.writeFile(workbookFromRows(data, "الفرص التعاقدية"), "الفرص التعاقدية.xlsx");
  };

  return (
    <Box>
      <Paper elevation={0} sx={{ ...ui.card, p: 1.5, mb: 1.5 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} flexWrap="wrap" useFlexGap>
          <TextField select label="الحالة" value={stage} onChange={(e) => setStage(e.target.value)} size="small" sx={{ minWidth: 190 }}>
            <MenuItem value="open">المفتوحة</MenuItem>
            <MenuItem value="all">الكل</MenuItem>
            {STAGES.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
          </TextField>
          <P2PToneChip label="المتابعات خلال 7 أيام والمتأخرة" clickable tone={dueOnly ? "warning" : "default"} onClick={() => setDueOnly((v) => !v)} sx={{ fontWeight: 800 }} />
          {isManager ? <EmployeeFilter employees={employees} value={employee} onChange={setEmployee} /> : null}
          <Box sx={{ flex: 1 }} />
          <Chip label={`${rows.length} فرصة — ${money(totalValue)} ريال`} sx={{ fontWeight: 800 }} />
          {overdue ? <P2PToneChip tone="error" label={`${overdue} متابعة متأخرة`} sx={{ fontWeight: 800 }} /> : null}
          <Button variant="outlined" startIcon={<FileDownloadRoundedIcon />} disabled={!rows.length} onClick={exportExcel} sx={{ fontWeight: 800 }}>
            Excel
          </Button>
        </Stack>
      </Paper>

      {!isManager ? (
        <Alert severity="info" sx={{ mb: 1.5, borderRadius: 2 }}>
          تُضاف الفرص من التقرير اليومي، وتُتابَع من هنا لاحقًا (الحالة والإجراء القادم وموعد المتابعة).
        </Alert>
      ) : null}

      <Paper elevation={0} sx={{ ...ui.card, overflow: "hidden" }}>
        <TableContainer sx={{ maxHeight: "calc(100vh - 420px)", minHeight: 240 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={ui.headRow}>
                <TableCell>الشركة</TableCell>
                <TableCell>الاحتياج التدريبي أو التعاقدي</TableCell>
                <TableCell align="center">المتدربين</TableCell>
                <TableCell align="center">القيمة التقديرية</TableCell>
                <TableCell align="center">الحالة</TableCell>
                <TableCell>الإجراء القادم</TableCell>
                <TableCell align="center">موعد المتابعة</TableCell>
                {isManager ? <TableCell>الموظف</TableCell> : <TableCell align="center">متابعة</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}><CircularProgress size={28} /></TableCell></TableRow>
              ) : rows.length ? (
                rows.map((o) => (
                  <TableRow key={o.guid} sx={ui.bodyRow}>
                    <TableCell sx={{ fontWeight: 900 }}>{o.companyName}</TableCell>
                    <TableCell sx={{ minWidth: 220 }}>{o.trainingNeed}</TableCell>
                    <TableCell align="center">{o.expectedTrainees ?? "—"}</TableCell>
                    <TableCell align="center">{o.estimatedValue != null ? money(o.estimatedValue) : "—"}</TableCell>
                    <TableCell align="center">
                      <P2PToneChip size="small" label={labelOf(STAGES, o.stage)} tone={colorOf(STAGES, o.stage)} sx={{ fontWeight: 800 }} />
                    </TableCell>
                    <TableCell>{o.nextAction || "—"}</TableCell>
                    <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                      {o.followUpDate ? (
                        <P2PToneChip size="small" label={o.followUpDate} tone={o.overdue ? "error" : "default"} />
                      ) : "—"}
                    </TableCell>
                    {isManager ? (
                      <TableCell>{o.employeeName}</TableCell>
                    ) : (
                      <TableCell align="center">
                        <IconButton size="small" disabled={!o.canEdit} onClick={() => setEdit(o)}>
                          <EditRoundedIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6, color: "text.secondary" }}>لا توجد فرص</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <OpportunityDialog open={Boolean(edit)} opportunity={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); load(); }} />
    </Box>
  );
}
