// لوحة مؤشرات إدارة التعاقدات (المدير: الكل / موظف معين — الموظف: مؤشراته بس).
import React, { useCallback, useEffect, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  alpha
} from "@mui/material";
import * as XLSX from "xlsx";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import DirectionsCarRoundedIcon from "@mui/icons-material/DirectionsCarRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import LightbulbRoundedIcon from "@mui/icons-material/LightbulbRounded";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import { workbookFromRows } from "../../utils/excelExport";
import { useEmployees } from "./P2PLists";
import {
  BLUE,
  CONTACT_METHODS,
  EVALUATION_QUESTIONS,
  GREEN,
  ORANGE,
  PURPOSES,
  RESULTS,
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

function Kpi({ label, value, hint, color = GREEN, icon }) {
  const ui = useUi();
  return (
    <Paper elevation={0} sx={{ ...ui.card, p: 1.6, height: "100%", display: "flex", gap: 1.3, alignItems: "center" }}>
      <Box sx={{ width: 46, height: 46, borderRadius: 2.5, display: "grid", placeItems: "center", color: "#fff", flexShrink: 0, background: `linear-gradient(135deg,${color},${alpha(color, 0.7)})` }}>
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 12.5, color: "text.secondary", fontWeight: 800 }} noWrap>{label}</Typography>
        <Typography sx={{ fontSize: 22, fontWeight: 900, lineHeight: 1.2 }} noWrap>{value}</Typography>
        {hint ? <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>{hint}</Typography> : null}
      </Box>
    </Paper>
  );
}

function Bars({ title, items, total, color }) {
  const ui = useUi();
  return (
    <Paper elevation={0} sx={{ ...ui.card, p: 1.8, height: "100%" }}>
      <Typography sx={{ ...ui.sectionTitle, mb: 1.2 }}>{title}</Typography>
      {!items.length ? <Typography color="text.secondary">لا توجد بيانات</Typography> : null}
      <Stack spacing={1}>
        {items.map((it) => {
          const pct = total ? Math.round((it.value * 100) / total) : 0;
          return (
            <Box key={it.label}>
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{it.label}</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 900 }}>
                  {it.value} <Typography component="span" variant="caption" color="text.secondary">({pct}%)</Typography>
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={pct}
                sx={{ height: 8, borderRadius: 4, bgcolor: alpha(color, 0.12), "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 4 } }}
              />
            </Box>
          );
        })}
      </Stack>
    </Paper>
  );
}

export default function P2PDashboard({ me }) {
  const ui = useUi();
  const isManager = me?.role === "manager";
  const employees = useEmployees(isManager);
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(me?.today || "");
  const [employee, setEmployee] = useState("");
  const [data, setData] = useState(null);
  const [due, setDue] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, opps] = await Promise.all([
        p2pApi("/dashboard", { query: { from, to, employeeGuid: employee } }),
        p2pApi("/opportunities", { query: { employeeGuid: employee, dueOnly: "true" } })
      ]);
      setData(d);
      setDue(opps.slice(0, 12));
    } catch (e) {
      toast("error", "حدث خطأ", e.message);
    } finally {
      setLoading(false);
    }
  }, [from, to, employee]);

  useEffect(() => {
    load();
  }, [load]);

  const t = data?.totals;
  const breakdown = (key, list) =>
    Object.entries(data?.breakdown?.[key] || {})
      .map(([value, count]) => ({ label: labelOf(list, value), value: count }))
      .sort((a, b) => b.value - a.value);

  const exportExcel = () => {
    const rows = [
      ["الموظف", "التقارير", "تمت مراجعتها", "الزيارات", "ميدانية", "هاتفية/إلكترونية", "الفرص", "قيمة الفرص", "تعاقدات", "آخر تقرير"],
      ...(data?.byEmployee || []).map((e) => [e.employeeName, e.reports, e.reviewed, e.visits, e.fieldVisits, e.remoteVisits, e.opportunities, e.opportunitiesValue, e.won, e.lastReportDate])
    ];
    XLSX.writeFile(workbookFromRows(rows, "أداء الموظفين"), `أداء إدارة التعاقدات ${from} إلى ${to}.xlsx`);
  };

  return (
    <Box>
      <Paper elevation={0} sx={{ ...ui.card, p: 1.5, mb: 1.5 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} flexWrap="wrap" useFlexGap>
          <TextField type="date" label="من" value={from} onChange={(e) => setFrom(e.target.value)} size="small" InputLabelProps={{ shrink: true }} />
          <TextField type="date" label="إلى" value={to} onChange={(e) => setTo(e.target.value)} size="small" InputLabelProps={{ shrink: true }} />
          {isManager ? (
            <Autocomplete
              options={employees}
              value={employees.find((e) => e.guid === employee) || null}
              onChange={(_, e) => setEmployee(e?.guid || "")}
              getOptionLabel={(o) => o.name}
              isOptionEqualToValue={(a, b) => a.guid === b.guid}
              renderInput={(params) => <TextField {...params} size="small" label="الموظف" placeholder="كل الموظفين" InputLabelProps={{ shrink: true }} />}
              sx={{ width: { xs: "100%", md: 320 }, flexShrink: 0 }}
              ListboxProps={{ style: { maxHeight: 360 } }}
            />
          ) : null}
          <Box sx={{ flex: 1 }} />
          {isManager ? (
            <Button variant="outlined" startIcon={<FileDownloadRoundedIcon />} disabled={!data?.byEmployee?.length} onClick={exportExcel} sx={{ fontWeight: 800 }}>
              Excel أداء الموظفين
            </Button>
          ) : null}
        </Stack>
      </Paper>

      {loading || !data ? (
        <Box sx={{ py: 8, textAlign: "center" }}><CircularProgress /></Box>
      ) : (
        <Stack spacing={1.5}>
          <Grid container spacing={1.5}>
            <Grid item xs={12} sm={6} md={4} lg={2}><Kpi icon={<AssignmentRoundedIcon />} label="التقارير" value={t.reports} hint={isManager ? `${t.pendingReview} بانتظار المراجعة` : `${t.reviewed} تمت مراجعتها`} color={t.pendingReview && isManager ? ORANGE : GREEN} /></Grid>
            <Grid item xs={12} sm={6} md={4} lg={2}><Kpi icon={<DirectionsCarRoundedIcon />} label="الزيارات" value={t.visits} hint={`${t.fieldVisits} ميدانية — ${t.remoteVisits} عن بُعد`} color={BLUE} /></Grid>
            <Grid item xs={12} sm={6} md={4} lg={2}><Kpi icon={<BusinessRoundedIcon />} label="شركات تمت زيارتها" value={t.companiesVisited} hint={`${t.newCompanies} شركة جديدة`} color={"#00897b"} /></Grid>
            <Grid item xs={12} sm={6} md={4} lg={2}><Kpi icon={<LightbulbRoundedIcon />} label="فرص جديدة" value={t.opportunities} color="#8e24aa" /></Grid>
            <Grid item xs={12} sm={6} md={4} lg={2}><Kpi icon={<PaidRoundedIcon />} label="قيمة الفرص المفتوحة" value={money(t.pipelineValue)} hint="ريال" color={ORANGE} /></Grid>
            <Grid item xs={12} sm={6} md={4} lg={2}><Kpi icon={<VerifiedRoundedIcon />} label="تعاقدات" value={t.wonCount} hint={`${money(t.wonValue)} ريال`} color="#2e7d32" /></Grid>
          </Grid>

          {t.overdueFollowUps ? (
            <Paper elevation={0} sx={{ ...ui.card, p: 1.5, borderInlineStart: "5px solid #d32f2f" }}>
              <Typography sx={{ fontWeight: 900, color: "error.main" }}>
                {t.overdueFollowUps} فرصة تجاوزت موعد المتابعة وما زالت مفتوحة
              </Typography>
            </Paper>
          ) : null}

          {isManager && data.byEmployee?.length ? (
            <Paper elevation={0} sx={{ ...ui.card, overflow: "hidden" }}>
              <Typography sx={{ ...ui.sectionTitle, p: 1.5, pb: 0.5 }}>أداء الموظفين</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={ui.headRow}>
                      <TableCell>الموظف</TableCell>
                      <TableCell align="center">التقارير</TableCell>
                      <TableCell align="center">الزيارات</TableCell>
                      <TableCell align="center">ميدانية / عن بُعد</TableCell>
                      <TableCell align="center">الفرص</TableCell>
                      <TableCell align="center">قيمة الفرص</TableCell>
                      <TableCell align="center">تعاقدات</TableCell>
                      <TableCell align="center">آخر تقرير</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.byEmployee.map((e) => (
                      <TableRow key={e.employeeGuid} sx={ui.bodyRow}>
                        <TableCell sx={{ fontWeight: 900 }}>{e.employeeName}</TableCell>
                        <TableCell align="center">{e.reports}</TableCell>
                        <TableCell align="center">{e.visits}</TableCell>
                        <TableCell align="center">{e.fieldVisits} / {e.remoteVisits}</TableCell>
                        <TableCell align="center">{e.opportunities}</TableCell>
                        <TableCell align="center">{money(e.opportunitiesValue)}</TableCell>
                        <TableCell align="center">{e.won}</TableCell>
                        <TableCell align="center">{e.lastReportDate}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          ) : null}

          <Grid container spacing={1.5}>
            <Grid item xs={12} md={4}><Bars title="وسيلة التواصل" items={breakdown("method", CONTACT_METHODS)} total={t.visits} color={BLUE} /></Grid>
            <Grid item xs={12} md={4}><Bars title="الغرض من الزيارة" items={breakdown("purpose", PURPOSES)} total={t.visits} color={GREEN} /></Grid>
            <Grid item xs={12} md={4}><Bars title="نتيجة الزيارة" items={breakdown("result", RESULTS)} total={t.visits} color={ORANGE} /></Grid>
          </Grid>

          <Grid container spacing={1.5}>
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ ...ui.card, p: 1.8, height: "100%" }}>
                <Typography sx={{ ...ui.sectionTitle, mb: 1.2 }}>تقييم الزيارات (نسبة "نعم")</Typography>
                <Stack spacing={1}>
                  {EVALUATION_QUESTIONS.map((q) => {
                    const pct = Number(data.evaluation?.[q.key] || 0);
                    return (
                      <Box key={q.key}>
                        <Stack direction="row" justifyContent="space-between" spacing={1}>
                          <Typography sx={{ fontSize: 12.5 }}>{q.label}</Typography>
                          <Typography sx={{ fontSize: 13, fontWeight: 900 }}>{pct}%</Typography>
                        </Stack>
                        <LinearProgress variant="determinate" value={pct} color="success" sx={{ height: 7, borderRadius: 4 }} />
                      </Box>
                    );
                  })}
                </Stack>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ ...ui.card, p: 1.8, height: "100%" }}>
                <Typography sx={{ ...ui.sectionTitle, mb: 1.2 }}>الفرص حسب المرحلة</Typography>
                <Stack spacing={1}>
                  {STAGES.map((s) => {
                    const row = data.stages?.find((x) => x.stage === s.value);
                    return (
                      <Stack key={s.value} direction="row" alignItems="center" spacing={1}>
                        <P2PToneChip size="small" label={s.label} tone={colorOf(STAGES, s.value)} sx={{ minWidth: 120, fontWeight: 800 }} />
                        <Typography sx={{ fontWeight: 900, minWidth: 40 }}>{row?.count || 0}</Typography>
                        <Typography color="text.secondary">{money(row?.value || 0)} ريال</Typography>
                      </Stack>
                    );
                  })}
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          <Paper elevation={0} sx={{ ...ui.card, overflow: "hidden" }}>
            <Typography sx={{ ...ui.sectionTitle, p: 1.5, pb: 0.5 }}>المتابعات القريبة والمتأخرة</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={ui.headRow}>
                    <TableCell>الشركة</TableCell>
                    <TableCell>الإجراء القادم</TableCell>
                    <TableCell align="center">الموعد</TableCell>
                    <TableCell align="center">القيمة</TableCell>
                    {isManager ? <TableCell>الموظف</TableCell> : null}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {due.map((o) => (
                    <TableRow key={o.guid} sx={ui.bodyRow}>
                      <TableCell sx={{ fontWeight: 800 }}>{o.companyName}</TableCell>
                      <TableCell>{o.nextAction || o.trainingNeed}</TableCell>
                      <TableCell align="center">
                        <P2PToneChip size="small" label={o.followUpDate} tone={o.overdue ? "error" : "warning"} />
                      </TableCell>
                      <TableCell align="center">{o.estimatedValue != null ? money(o.estimatedValue) : "—"}</TableCell>
                      {isManager ? <TableCell>{o.employeeName}</TableCell> : null}
                    </TableRow>
                  ))}
                  {!due.length ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3, color: "text.secondary" }}>لا توجد متابعات خلال 7 أيام</TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Stack>
      )}
    </Box>
  );
}
