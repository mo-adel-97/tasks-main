// عرض التقرير اليومي (للقراءة) + لوحة مراجعة المدير.
import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@mui/material";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import UndoRoundedIcon from "@mui/icons-material/UndoRounded";
import {
  CONTACT_METHODS,
  EVALUATION_QUESTIONS,
  PURPOSES,
  REPORT_STATUS,
  RESULTS,
  STAGES,
  colorOf,
  confirmBox,
  dayName,
  labelOf,
  money,
  p2pApi,
  printReport,
  toast,
  useUi
} from "./p2pShared";
import P2PToneChip from "./P2PToneChip";

function Section({ number, title, children }) {
  const ui = useUi();
  return (
    <Paper elevation={0} sx={{ ...ui.card, p: { xs: 1.5, md: 2.2 }, height: "100%" }}>
      <Stack direction="row" alignItems="center" spacing={1.2} sx={{ mb: 1.5 }}>
        {number ? <Box sx={ui.badge}>{number}</Box> : null}
        <Typography sx={ui.sectionTitle}>{title}</Typography>
      </Stack>
      {children}
    </Paper>
  );
}

function TextBlock({ label, value }) {
  return (
    <Box sx={{ mb: 1.2 }}>
      <Typography sx={{ fontWeight: 800, fontSize: 13.5, mb: 0.3 }}>{label}</Typography>
      <Typography sx={{ whiteSpace: "pre-wrap", color: value ? "text.primary" : "text.disabled" }}>{value || "—"}</Typography>
    </Box>
  );
}

export default function P2PReportView({ report, onChanged }) {
  const ui = useUi();
  const [needsFollowUp, setNeedsFollowUp] = useState(false);
  const [needsIntervention, setNeedsIntervention] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNeedsFollowUp(Boolean(report?.needsFollowUp));
    setNeedsIntervention(Boolean(report?.needsIntervention));
    setNotes(report?.managerNotes || "");
  }, [report]);

  if (!report) return null;
  const visits = report.visits || [];
  const opps = report.opportunities || [];
  const status = REPORT_STATUS[report.status] || REPORT_STATUS.draft;

  const review = async () => {
    setSaving(true);
    try {
      const result = await p2pApi(`/reports/${report.guid}/review`, { method: "POST", body: { needsFollowUp, needsIntervention, notes } });
      await toast("success", "تم", result?.message);
      onChanged?.();
    } catch (e) {
      toast("error", "حدث خطأ", e.message);
    } finally {
      setSaving(false);
    }
  };

  const giveBack = async () => {
    if (!notes.trim()) return toast("warning", "مطلوب", "اكتب في ملاحظات المدير سبب إعادة التقرير للموظف");
    if (!(await confirmBox("إعادة التقرير", "سيعود التقرير للموظف لاستكماله ثم إعادة إرساله. متابعة؟", "إعادة"))) return;
    setSaving(true);
    try {
      const result = await p2pApi(`/reports/${report.guid}/return`, { method: "POST", body: { notes } });
      await toast("success", "تم", result?.message);
      onChanged?.();
    } catch (e) {
      toast("error", "حدث خطأ", e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
        <P2PToneChip label={status.label} tone={status.color} sx={{ fontWeight: 900 }} />
        {report.submittedAt ? <Chip variant="outlined" label={`أُرسل: ${report.submittedAt}`} /> : null}
        {report.reviewedAt && report.status === "reviewed" ? <Chip variant="outlined" label={`روجع: ${report.reviewedAt} — ${report.reviewedByName || ""}`} /> : null}
        <Box sx={{ flex: 1 }} />
        <Button variant="outlined" startIcon={<PrintRoundedIcon />} onClick={() => printReport(report)} sx={{ fontWeight: 800 }}>
          طباعة
        </Button>
      </Stack>

      <Section number={1} title="أولًا: بيانات الموظف">
        <Grid container spacing={1.5}>
          {[
            ["اسم الموظف", report.employeeName],
            ["التاريخ", report.reportDate],
            ["اليوم", dayName(report.reportDate)],
            ["الشركات التي تمت زيارتها (ميدانيًا)", report.totals?.companiesVisited ?? 0],
            ["الزيارات الهاتفية أو الإلكترونية", report.totals?.remoteVisits ?? 0]
          ].map(([label, value]) => (
            <Grid item xs={6} md={2.4} key={label}>
              <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: ui.soft, height: "100%" }}>
                <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 700 }}>{label}</Typography>
                <Typography sx={{ fontWeight: 900, fontSize: 16 }}>{value}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Section>

      <Section number={2} title={`ثانيًا: تفاصيل زيارات الشركات (${visits.length})`}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={ui.headRow}>
                <TableCell>م</TableCell>
                <TableCell>اسم الشركة</TableCell>
                <TableCell>الشخص الذي تمت مقابلته</TableCell>
                <TableCell>المسمى الوظيفي</TableCell>
                <TableCell>وسيلة التواصل</TableCell>
                <TableCell>الغرض من الزيارة</TableCell>
                <TableCell>نتيجة الزيارة</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visits.map((v, i) => (
                <TableRow key={v.guid} sx={ui.bodyRow}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>{v.companyName}</TableCell>
                  <TableCell>{v.personName || "—"}</TableCell>
                  <TableCell>{v.personTitle || "—"}</TableCell>
                  <TableCell>{labelOf(CONTACT_METHODS, v.contactMethod)}</TableCell>
                  <TableCell>
                    {labelOf(PURPOSES, v.purpose)}
                    {v.purposeDetails ? <Typography variant="caption" sx={{ display: "block" }} color="text.secondary">{v.purposeDetails}</Typography> : null}
                  </TableCell>
                  <TableCell>
                    <P2PToneChip size="small" label={labelOf(RESULTS, v.resultStatus)} tone={colorOf(RESULTS, v.resultStatus)} sx={{ fontWeight: 800 }} />
                    {v.resultDetails ? <Typography variant="caption" sx={{ display: "block", mt: 0.4 }} color="text.secondary">{v.resultDetails}</Typography> : null}
                  </TableCell>
                </TableRow>
              ))}
              {!visits.length ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ color: "text.secondary", py: 3 }}>لا توجد زيارات</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
      </Section>

      {visits.length ? (
        <Section number={3} title="ثالثًا: تقييم نتيجة كل زيارة">
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={ui.headRow}>
                  <TableCell>السؤال</TableCell>
                  {visits.map((v, i) => (
                    <TableCell key={v.guid} align="center">{i + 1}. {v.companyName}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {EVALUATION_QUESTIONS.map((q) => (
                  <TableRow key={q.key} sx={ui.bodyRow}>
                    <TableCell sx={{ minWidth: 260 }}>{q.label}</TableCell>
                    {visits.map((v) => (
                      <TableCell key={v.guid} align="center">
                        <P2PToneChip size="small" label={v[q.key] ? "نعم" : "لا"} tone={v[q.key] ? "success" : "default"} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Section>
      ) : null}

      <Section number={4} title={`رابعًا: الفرص التعاقدية الناتجة عن الزيارات (${opps.length})`}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={ui.headRow}>
                <TableCell>اسم الشركة</TableCell>
                <TableCell>الاحتياج التدريبي أو التعاقدي</TableCell>
                <TableCell align="center">عدد المتدربين المتوقع</TableCell>
                <TableCell align="center">القيمة التقديرية</TableCell>
                <TableCell>الإجراء القادم</TableCell>
                <TableCell align="center">موعد المتابعة</TableCell>
                <TableCell align="center">الحالة</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {opps.map((o) => (
                <TableRow key={o.guid} sx={ui.bodyRow}>
                  <TableCell sx={{ fontWeight: 800 }}>{o.companyName}</TableCell>
                  <TableCell>{o.trainingNeed}</TableCell>
                  <TableCell align="center">{o.expectedTrainees ?? "—"}</TableCell>
                  <TableCell align="center">{o.estimatedValue != null ? money(o.estimatedValue) : "—"}</TableCell>
                  <TableCell>{o.nextAction || "—"}</TableCell>
                  <TableCell align="center">{o.followUpDate || "—"}</TableCell>
                  <TableCell align="center">
                    <P2PToneChip size="small" label={labelOf(STAGES, o.stage)} tone={colorOf(STAGES, o.stage)} />
                  </TableCell>
                </TableRow>
              ))}
              {!opps.length ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ color: "text.secondary", py: 3 }}>لا توجد فرص</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
      </Section>

      <Grid container spacing={1.5}>
        <Grid item xs={12} md={6}>
          <Section number={5} title="خامسًا: المعوقات والملاحظات">
            <TextBlock label="أهم المعوقات التي واجهت الموظف اليوم" value={report.obstacles} />
            <TextBlock label="الشركات التي تحتاج إلى تدخل أو دعم من مدير الإدارة" value={report.needsManagerSupport} />
            <TextBlock label="ملاحظات أو فرص جديدة" value={report.newOpportunities} />
          </Section>
        </Grid>
        <Grid item xs={12} md={6}>
          <Section number={6} title="سادسًا: خطة اليوم التالي">
            <TextBlock label="1. الشركات المستهدف زيارتها" value={report.planCompanies} />
            <TextBlock label="2. الاتصالات والمتابعات المطلوب تنفيذها" value={report.planFollowUps} />
            <TextBlock label="3. أهم هدف مطلوب تحقيقه" value={report.planMainGoal} />
          </Section>
        </Grid>
      </Grid>

      <Section number={7} title="إقرار الموظف">
        {report.submittedAt ? (
          <Alert severity="success" sx={{ borderRadius: 2 }}>
            أقر بأن البيانات الواردة في التقرير تعكس الزيارات والمتابعات التي قمت بها خلال يوم العمل.
            <Typography sx={{ fontWeight: 800, mt: 0.5 }}>
              {report.declarationName} — {report.submittedAt}
            </Typography>
          </Alert>
        ) : (
          <Typography color="text.secondary">لم يُرسل التقرير بعد.</Typography>
        )}
      </Section>

      <Section number={8} title="مراجعة مدير إدارة التعاقدات">
        {report.canReview ? (
          <Stack spacing={1}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
              <FormControlLabel control={<Checkbox checked disabled />} label="تم الاطلاع على التقرير (عند الحفظ)" />
              <FormControlLabel control={<Checkbox checked={needsFollowUp} onChange={(e) => setNeedsFollowUp(e.target.checked)} />} label="مطلوب متابعة إضافية" />
              <FormControlLabel control={<Checkbox checked={needsIntervention} onChange={(e) => setNeedsIntervention(e.target.checked)} />} label="مطلوب تدخل من الإدارة" />
            </Stack>
            <TextField label="ملاحظات المدير" value={notes} onChange={(e) => setNotes(e.target.value)} multiline minRows={2} fullWidth />
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <FactCheckRoundedIcon />}
                disabled={saving}
                onClick={review}
                sx={ui.primaryBtn}
              >
                حفظ المراجعة
              </Button>
              <Button variant="outlined" color="error" startIcon={<UndoRoundedIcon />} disabled={saving} onClick={giveBack} sx={{ fontWeight: 800 }}>
                إعادة للموظف للاستكمال
              </Button>
            </Stack>
          </Stack>
        ) : report.status === "reviewed" || report.status === "returned" ? (
          <Stack spacing={0.8}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <P2PToneChip label={report.status === "reviewed" ? "تم الاطلاع على التقرير" : "أُعيد للاستكمال"} tone={report.status === "reviewed" ? "success" : "error"} />
              {report.needsFollowUp ? <P2PToneChip label="مطلوب متابعة إضافية" tone="info" /> : null}
              {report.needsIntervention ? <P2PToneChip label="مطلوب تدخل من الإدارة" tone="warning" /> : null}
            </Stack>
            <TextBlock label="ملاحظات المدير" value={report.status === "returned" ? report.returnNotes : report.managerNotes} />
            <Typography variant="caption" color="text.secondary">
              {report.reviewedByName} — {report.reviewedAt}
            </Typography>
          </Stack>
        ) : (
          <Typography color="text.secondary">لم تتم المراجعة بعد.</Typography>
        )}
      </Section>
    </Stack>
  );
}
