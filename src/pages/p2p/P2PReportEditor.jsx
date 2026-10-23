// التقرير اليومي للموظف: الزيارات + تقييمها + الفرص + المعوقات + خطة الغد + الإقرار والإرسال.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import AddBusinessRoundedIcon from "@mui/icons-material/AddBusinessRounded";
import P2PCompanyDialog from "./P2PCompanyDialog";
import P2PReportView from "./P2PReportView";
import {
  CONTACT_METHODS,
  EVALUATION_QUESTIONS,
  PURPOSES,
  REPORT_STATUS,
  RESULTS,
  STAGES,
  confirmBox,
  dayName,
  p2pApi,
  printReport,
  toast,
  useUi
} from "./p2pShared";
import P2PToneChip from "./P2PToneChip";

const newVisit = () => ({
  key: Math.random().toString(36).slice(2),
  companyGuid: "",
  personName: "",
  personTitle: "",
  contactMethod: "field",
  purpose: "",
  purposeDetails: "",
  resultStatus: "",
  resultDetails: "",
  ...Object.fromEntries(EVALUATION_QUESTIONS.map((q) => [q.key, false]))
});

const newOpportunity = () => ({
  key: Math.random().toString(36).slice(2),
  guid: null,
  companyGuid: "",
  trainingNeed: "",
  expectedTrainees: "",
  estimatedValue: "",
  nextAction: "",
  followUpDate: "",
  stage: "new",
  notes: ""
});

function Section({ number, title, subtitle, action, children }) {
  const ui = useUi();
  return (
    <Paper elevation={0} sx={{ ...ui.card, p: { xs: 1.5, md: 2.2 } }}>
      <Stack direction="row" alignItems="center" spacing={1.2} sx={{ mb: 1.5 }} flexWrap="wrap" useFlexGap>
        {number ? <Box sx={ui.badge}>{number}</Box> : null}
        <Box sx={{ flex: 1, minWidth: 180 }}>
          <Typography sx={ui.sectionTitle}>{title}</Typography>
          {subtitle ? <Typography variant="caption" color="text.secondary">{subtitle}</Typography> : null}
        </Box>
        {action}
      </Stack>
      {children}
    </Paper>
  );
}

export default function P2PReportEditor({ me, date, onDateChange, onSaved }) {
  const ui = useUi();
  const [report, setReport] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [declaration, setDeclaration] = useState(false);
  const [companyDialog, setCompanyDialog] = useState(null); // { target: "visit"|"opp", key }

  const [visits, setVisits] = useState([]);
  const [opps, setOpps] = useState([]);
  const [texts, setTexts] = useState({});

  const loadCompanies = useCallback(async () => {
    try {
      setCompanies(await p2pApi("/companies"));
    } catch (e) {
      toast("error", "حدث خطأ", e.message);
    }
  }, []);

  const load = useCallback(async () => {
    if (!date) return;
    setLoading(true);
    try {
      const { guid } = await p2pApi("/reports/open", { method: "POST", body: { date } });
      const r = await p2pApi(`/reports/${guid}`);
      setReport(r);
      setVisits((r.visits || []).map((v) => ({ ...v, key: v.guid })));
      setOpps(
        (r.opportunities || []).map((o) => ({
          ...o,
          key: o.guid,
          expectedTrainees: o.expectedTrainees ?? "",
          estimatedValue: o.estimatedValue ?? "",
          followUpDate: o.followUpDate || "",
          nextAction: o.nextAction || "",
          notes: o.notes || ""
        }))
      );
      setTexts({
        obstacles: r.obstacles || "",
        needsManagerSupport: r.needsManagerSupport || "",
        newOpportunities: r.newOpportunities || "",
        planCompanies: r.planCompanies || "",
        planFollowUps: r.planFollowUps || "",
        planMainGoal: r.planMainGoal || ""
      });
      setDeclaration(false);
      if ((r.status === "reviewed" || r.status === "returned") && !r.reviewSeen) {
        p2pApi(`/reports/${guid}/seen`, { method: "POST", body: {} }).catch(() => {});
      }
    } catch (e) {
      setReport(null);
      toast("error", "حدث خطأ", e.message);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  useEffect(() => {
    load();
  }, [load]);

  const activeCompanies = useMemo(() => companies.filter((c) => c.isActive), [companies]);
  const companyById = useMemo(() => new Map(companies.map((c) => [c.guid, c])), [companies]);

  const totals = useMemo(
    () => ({
      companiesVisited: new Set(visits.filter((v) => v.contactMethod === "field" && v.companyGuid).map((v) => v.companyGuid)).size,
      remoteVisits: visits.filter((v) => v.contactMethod !== "field").length
    }),
    [visits]
  );

  const setVisit = (key, patch) => setVisits((prev) => prev.map((v) => (v.key === key ? { ...v, ...patch } : v)));
  const setOpp = (key, patch) => setOpps((prev) => prev.map((o) => (o.key === key ? { ...o, ...patch } : o)));
  const setText = (key) => (e) => setTexts((prev) => ({ ...prev, [key]: e.target.value }));

  const payload = (submit) => ({
    ...texts,
    visits: visits.map(({ key, guid, companyName, ...v }) => v),
    opportunities: opps.map(({ key, companyName, ...o }) => ({
      ...o,
      expectedTrainees: o.expectedTrainees === "" ? null : Number(o.expectedTrainees),
      estimatedValue: o.estimatedValue === "" ? null : Number(o.estimatedValue),
      followUpDate: o.followUpDate || null
    })),
    submit,
    declarationAccepted: submit ? declaration : false
  });

  const validate = () => {
    for (let i = 0; i < visits.length; i += 1) {
      const v = visits[i];
      if (!v.companyGuid || !v.contactMethod || !v.purpose || !v.resultStatus)
        return `الزيارة رقم ${i + 1}: أكمل الشركة ووسيلة التواصل والغرض والنتيجة`;
    }
    for (let i = 0; i < opps.length; i += 1) {
      const o = opps[i];
      if (!o.companyGuid || !o.trainingNeed.trim()) return `الفرصة رقم ${i + 1}: اختر الشركة واكتب الاحتياج`;
    }
    return null;
  };

  const save = async (submit) => {
    const problem = validate();
    if (problem) return toast("warning", "بيانات ناقصة", problem);
    if (submit) {
      if (!declaration) return toast("warning", "الإقرار", "يجب الإقرار بصحة البيانات قبل الإرسال");
      if (!(await confirmBox("إرسال التقرير", "بعد الإرسال لن تتمكن من التعديل إلا إذا أعاده المدير. إرسال؟", "إرسال"))) return;
    }
    setSaving(true);
    try {
      const result = await p2pApi(`/reports/${report.guid}`, { method: "PUT", body: payload(submit) });
      await toast("success", "تم", result?.message);
      await load();
      onSaved?.();
    } catch (e) {
      toast("error", "حدث خطأ", e.message);
    } finally {
      setSaving(false);
    }
  };

  const companySelect = (value, onChange, label = "الشركة") => (
    <Autocomplete
      options={activeCompanies}
      value={companyById.get(value) || null}
      onChange={(_, c) => onChange(c?.guid || "")}
      getOptionLabel={(o) => o.name}
      isOptionEqualToValue={(a, b) => a.guid === b.guid}
      noOptionsText="لا توجد شركات — أضف شركة جديدة"
      renderInput={(params) => <TextField {...params} size="small" label={label} required />}
      fullWidth
    />
  );

  const header = (
    <Paper elevation={0} sx={{ ...ui.card, p: { xs: 1.5, md: 2.2 } }}>
      <Stack direction="row" alignItems="center" spacing={1.2} sx={{ mb: 1.5 }}>
        <Box sx={ui.badge}>1</Box>
        <Typography sx={ui.sectionTitle}>أولًا: بيانات الموظف</Typography>
      </Stack>
      <Grid container spacing={1.5} alignItems="center">
        <Grid item xs={12} md={3}>
          <TextField
            type="date"
            label="تاريخ التقرير"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            inputProps={{ max: me?.today }}
          />
        </Grid>
        {[
          ["اسم الموظف", me?.name],
          ["اليوم", dayName(date)],
          ["الشركات التي تمت زيارتها (ميدانيًا)", totals.companiesVisited],
          ["الزيارات الهاتفية أو الإلكترونية", totals.remoteVisits]
        ].map(([label, value]) => (
          <Grid item xs={6} md={2.25} key={label}>
            <Box sx={{ p: 1.1, borderRadius: 2, bgcolor: ui.soft }}>
              <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 700 }}>{label}</Typography>
              <Typography sx={{ fontWeight: 900, fontSize: 16 }} noWrap>{value}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );

  if (loading || !report) {
    return (
      <Stack spacing={1.5}>
        {header}
        <Box sx={{ py: 8, textAlign: "center" }}>{loading ? <CircularProgress /> : <Typography color="text.secondary">اختر التاريخ</Typography>}</Box>
      </Stack>
    );
  }

  // تقرير مرسل/مراجع: عرض فقط
  if (!report.canEdit) {
    return (
      <Stack spacing={1.5}>
        {header}
        <P2PReportView report={report} onChanged={load} />
      </Stack>
    );
  }

  const status = REPORT_STATUS[report.status] || REPORT_STATUS.draft;

  return (
    <Stack spacing={1.5}>
      {header}

      {report.status === "returned" ? (
        <Alert severity="error" sx={{ borderRadius: 2, fontWeight: 700 }}>
          أعاد المدير التقرير للاستكمال: {report.returnNotes}
        </Alert>
      ) : null}

      <Section number={2}
        title={`ثانيًا: تفاصيل زيارات الشركات (${visits.length})`}
        subtitle="كل زيارة ميدانية أو هاتفية أو إلكترونية مع تقييمها (ثالثًا)"
        action={
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="outlined" startIcon={<AddBusinessRoundedIcon />} onClick={() => setCompanyDialog({ target: null })} sx={{ fontWeight: 800 }}>
              شركة جديدة
            </Button>
            <Button size="small" variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setVisits((p) => [...p, newVisit()])} sx={ui.primaryBtn}>
              إضافة زيارة
            </Button>
          </Stack>
        }
      >
        {!visits.length ? (
          <Typography color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
            لا توجد زيارات بعد — اضغط "إضافة زيارة"
          </Typography>
        ) : null}
        <Stack spacing={1.5}>
          {visits.map((v, i) => (
            <Paper key={v.key} elevation={0} sx={{ p: 1.5, borderRadius: 2.5, bgcolor: ui.muted, border: `1px solid ${ui.dark ? "rgba(255,255,255,.08)" : "rgba(5,117,70,.12)"}`, borderInlineStart: `5px solid ${v.contactMethod === "field" ? "#057546" : "#1565c0"}`, ...ui.inputBg }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.2 }}>
                <P2PToneChip label={`زيارة ${i + 1}`} size="small" sx={{ fontWeight: 900 }} tone={v.contactMethod === "field" ? "success" : "primary"} />
                <Typography sx={{ fontWeight: 800 }} noWrap>{companyById.get(v.companyGuid)?.name || "—"}</Typography>
                <Box sx={{ flex: 1 }} />
                <Tooltip title="حذف الزيارة">
                  <IconButton size="small" color="error" onClick={() => setVisits((p) => p.filter((x) => x.key !== v.key))}>
                    <DeleteOutlineRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
              <Grid container spacing={1.2}>
                <Grid item xs={12} md={4}>
                  <Stack direction="row" spacing={0.5}>
                    {companySelect(v.companyGuid, (g) => {
                      const c = companyById.get(g);
                      setVisit(v.key, {
                        companyGuid: g,
                        personName: v.personName || c?.contactName || "",
                        personTitle: v.personTitle || c?.contactTitle || ""
                      });
                    })}
                    <Tooltip title="شركة جديدة لهذه الزيارة">
                      <IconButton onClick={() => setCompanyDialog({ target: "visit", key: v.key })}>
                        <AddBusinessRoundedIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField label="اسم الشخص الذي تمت مقابلته" value={v.personName || ""} onChange={(e) => setVisit(v.key, { personName: e.target.value })} size="small" fullWidth />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField label="المسمى الوظيفي" value={v.personTitle || ""} onChange={(e) => setVisit(v.key, { personTitle: e.target.value })} size="small" fullWidth />
                </Grid>
                <Grid item xs={12}>
                  <ToggleButtonGroup
                    size="small"
                    exclusive
                    color="success"
                    value={v.contactMethod}
                    onChange={(_, val) => val && setVisit(v.key, { contactMethod: val })}
                    sx={{ flexWrap: "wrap" }}
                  >
                    {CONTACT_METHODS.map((m) => (
                      <ToggleButton key={m.value} value={m.value} sx={{ fontWeight: 800, px: 1.5 }}>
                        {m.label}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField select label="الغرض من الزيارة" value={v.purpose} onChange={(e) => setVisit(v.key, { purpose: e.target.value })} size="small" fullWidth required>
                    {PURPOSES.map((p) => (
                      <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField label="تفاصيل الغرض" value={v.purposeDetails || ""} onChange={(e) => setVisit(v.key, { purposeDetails: e.target.value })} size="small" fullWidth />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField select label="نتيجة الزيارة" value={v.resultStatus} onChange={(e) => setVisit(v.key, { resultStatus: e.target.value })} size="small" fullWidth required>
                    {RESULTS.map((r) => (
                      <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField label="تفاصيل النتيجة" value={v.resultDetails || ""} onChange={(e) => setVisit(v.key, { resultDetails: e.target.value })} size="small" fullWidth />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ p: 1, borderRadius: 2, bgcolor: ui.soft }}>
                    <Typography sx={{ fontWeight: 800, fontSize: 13, mb: 0.5 }}>ثالثًا: تقييم نتيجة الزيارة</Typography>
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, columnGap: 2, rowGap: 0.2 }}>
                      {EVALUATION_QUESTIONS.map((q) => (
                        <FormControlLabel
                          key={q.key}
                          sx={{ m: 0, alignItems: "center", minWidth: 0 }}
                          control={<Checkbox size="small" checked={Boolean(v[q.key])} onChange={(e) => setVisit(v.key, { [q.key]: e.target.checked })} />}
                          label={<Typography sx={{ fontSize: 13.5, whiteSpace: "normal" }}>{q.label}</Typography>}
                        />
                      ))}
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          ))}
        </Stack>
      </Section>

      <Section number={4}
        title={`رابعًا: الفرص التعاقدية الناتجة عن الزيارات (${opps.length})`}
        subtitle="تبقى الفرص في قائمة فرصك لمتابعتها بعد إرسال التقرير"
        action={
          <Button size="small" variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setOpps((p) => [...p, newOpportunity()])} sx={ui.primaryBtn}>
            إضافة فرصة
          </Button>
        }
      >
        {!opps.length ? <Typography color="text.secondary" sx={{ py: 1.5, textAlign: "center" }}>لا توجد فرص</Typography> : null}
        <Stack spacing={1.2}>
          {opps.map((o, i) => (
            <Paper key={o.key} elevation={0} sx={{ p: 1.5, borderRadius: 2.5, bgcolor: ui.muted, border: `1px solid ${ui.dark ? "rgba(255,255,255,.08)" : "rgba(5,117,70,.12)"}`, borderInlineStart: "5px solid #e65100", ...ui.inputBg }}>
              <Grid container spacing={1.2} alignItems="center">
                <Grid item xs={12} md={3}>{companySelect(o.companyGuid, (g) => setOpp(o.key, { companyGuid: g }))}</Grid>
                <Grid item xs={12} md={4}>
                  <TextField label="الاحتياج التدريبي أو التعاقدي" value={o.trainingNeed} onChange={(e) => setOpp(o.key, { trainingNeed: e.target.value })} size="small" fullWidth required />
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField type="number" label="عدد المتدربين المتوقع" value={o.expectedTrainees} onChange={(e) => setOpp(o.key, { expectedTrainees: e.target.value })} size="small" fullWidth inputProps={{ min: 0 }} />
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField type="number" label="القيمة التقديرية (ريال)" value={o.estimatedValue} onChange={(e) => setOpp(o.key, { estimatedValue: e.target.value })} size="small" fullWidth inputProps={{ min: 0 }} />
                </Grid>
                <Grid item xs={12} md={1} sx={{ textAlign: "end" }}>
                  <IconButton color="error" onClick={() => setOpps((p) => p.filter((x) => x.key !== o.key))} aria-label={`حذف الفرصة ${i + 1}`}>
                    <DeleteOutlineRoundedIcon />
                  </IconButton>
                </Grid>
                <Grid item xs={12} md={5}>
                  <TextField label="الإجراء القادم" value={o.nextAction} onChange={(e) => setOpp(o.key, { nextAction: e.target.value })} size="small" fullWidth />
                </Grid>
                <Grid item xs={6} md={3}>
                  <TextField type="date" label="موعد المتابعة" value={o.followUpDate} onChange={(e) => setOpp(o.key, { followUpDate: e.target.value })} size="small" fullWidth InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={6} md={4}>
                  <TextField select label="حالة الفرصة" value={o.stage} onChange={(e) => setOpp(o.key, { stage: e.target.value })} size="small" fullWidth>
                    {STAGES.map((s) => (
                      <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
            </Paper>
          ))}
        </Stack>
      </Section>

      <Grid container spacing={1.5}>
        <Grid item xs={12} md={6}>
          <Section number={5} title="خامسًا: المعوقات والملاحظات">
            <Stack spacing={1.2}>
              <TextField label="أهم المعوقات التي واجهتك اليوم" value={texts.obstacles} onChange={setText("obstacles")} multiline minRows={2} fullWidth />
              <TextField label="الشركات التي تحتاج إلى تدخل أو دعم من مدير الإدارة" value={texts.needsManagerSupport} onChange={setText("needsManagerSupport")} multiline minRows={2} fullWidth />
              <TextField label="ملاحظات أو فرص جديدة" value={texts.newOpportunities} onChange={setText("newOpportunities")} multiline minRows={2} fullWidth />
            </Stack>
          </Section>
        </Grid>
        <Grid item xs={12} md={6}>
          <Section number={6} title="سادسًا: خطة اليوم التالي">
            <Stack spacing={1.2}>
              <TextField label="1. الشركات المستهدف زيارتها" value={texts.planCompanies} onChange={setText("planCompanies")} multiline minRows={2} fullWidth />
              <TextField label="2. الاتصالات والمتابعات المطلوب تنفيذها" value={texts.planFollowUps} onChange={setText("planFollowUps")} multiline minRows={2} fullWidth />
              <TextField label="3. أهم هدف مطلوب تحقيقه" value={texts.planMainGoal} onChange={setText("planMainGoal")} multiline minRows={1} fullWidth />
            </Stack>
          </Section>
        </Grid>
      </Grid>

      <Box sx={{ position: "sticky", bottom: 8, zIndex: 3 }}>
      <Section number={7} title="إقرار الموظف">
        <FormControlLabel
          control={<Checkbox checked={declaration} onChange={(e) => setDeclaration(e.target.checked)} />}
          label={
            <Typography sx={{ fontWeight: 700 }}>
              أقر بأن البيانات الواردة في التقرير تعكس الزيارات والمتابعات التي قمت بها خلال يوم العمل — {me?.name}
            </Typography>
          }
        />
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1 }} alignItems={{ sm: "center" }}>
          <P2PToneChip label={status.label} tone={status.color} sx={{ fontWeight: 900 }} />
          <Box sx={{ flex: 1 }} />
          <Button
            variant="outlined"
            startIcon={<PrintRoundedIcon />}
            onClick={() => printReport({ ...report, ...texts, visits: visits.map((v) => ({ ...v, companyName: companyById.get(v.companyGuid)?.name || "" })), opportunities: opps.map((o) => ({ ...o, companyName: companyById.get(o.companyGuid)?.name || "" })), employeeName: me?.name })}
            sx={{ fontWeight: 800 }}
          >
            طباعة
          </Button>
          <Button variant="outlined" startIcon={saving ? <CircularProgress size={16} /> : <SaveRoundedIcon />} disabled={saving} onClick={() => save(false)} sx={{ fontWeight: 800 }}>
            حفظ كمسودة
          </Button>
          <Button variant="contained" startIcon={<SendRoundedIcon />} disabled={saving || !declaration} onClick={() => save(true)} sx={ui.primaryBtn}>
            إرسال للمدير
          </Button>
        </Stack>
      </Section>
      </Box>

      <P2PCompanyDialog
        open={Boolean(companyDialog)}
        company={null}
        onClose={() => setCompanyDialog(null)}
        onSaved={async (c) => {
          const target = companyDialog;
          setCompanyDialog(null);
          await loadCompanies();
          if (target?.target === "visit" && c?.guid) setVisit(target.key, { companyGuid: c.guid, personName: c.contactName || "", personTitle: c.contactTitle || "" });
          toast("success", "تم", "تمت إضافة الشركة");
        }}
      />
    </Stack>
  );
}
