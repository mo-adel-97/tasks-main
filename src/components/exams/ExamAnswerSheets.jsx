// طباعة / تحميل "نماذج إجابات المتدربين" PDF بشكل نموذج الاختبار الورقي (للأرشفة).
// كل متدرب يبدأ في صفحة جديدة؛ الصفحات بتتقسم بالقياس (سؤال مايتقطعش بين صفحتين).
// ملاحظات التصدير (html2canvas): Cairo بوزنين بس (400 و700)، ومن غير justify / letterSpacing على النص العربي.
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  LinearProgress,
  TextField
} from '@mui/material';
import { Print, PictureAsPdf } from '@mui/icons-material';
import { buildAnswerSheet, fmtNum, formatDuration, guessHeaderMeta, OPTION_LETTERS } from './examAnswerSheet';

export const SHEET_W = 794; // A4 @96dpi
export const SHEET_H = 1123;
const FRAME = 22; // إطار الصفحة زي النموذج
const PAD_X = 24;
const PAD_TOP = 20;
const FOOTER_H = 34;
const BODY_H = SHEET_H - FRAME * 2 - PAD_TOP - FOOTER_H - 8;
const RUN_H = 40; // شريط اسم المتدرب أعلى الصفحات التالية
const CONTENT_W = SHEET_W - FRAME * 2 - PAD_X * 2;

const FONT = "'Cairo', 'Noto Kufi Arabic', Tahoma, Arial, sans-serif";
const SYMBOL_FONT = "'Segoe UI Symbol', 'Arial Unicode MS', Arial, sans-serif";
const LOGO = `${process.env.PUBLIC_URL || ''}/brand/sstli-logo.png`;

const C = {
  ink: '#111a15',
  muted: '#55615a',
  line: '#2b2b2b',
  soft: '#d0d7d3',
  band: '#deeaf6', // لون شريط السؤال في النموذج
  green: '#0b7a47',
  greenBg: '#e6f4ec',
  red: '#c62828',
  redBg: '#fdecec',
  amber: '#a35f00'
};

const STORE_KEY = 'exam-sheet-meta:';
const readMeta = (examId) => {
  try {
    return JSON.parse(window.localStorage.getItem(STORE_KEY + examId) || 'null');
  } catch {
    return null;
  }
};
const writeMeta = (examId, meta) => {
  try {
    window.localStorage.setItem(STORE_KEY + examId, JSON.stringify(meta));
  } catch {
    /* التخزين مش متاح */
  }
};

const waitForAssets = async (root) => {
  if (document.fonts?.ready) await document.fonts.ready;
  await Promise.all(
    [...(root?.querySelectorAll('img') || [])].map((img) =>
      img.complete ? Promise.resolve() : new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; })
    )
  );
};

// خطوط جوجل مابتتحمّلش غير لما نص يستخدمها؛ لازم تكون جاهزة قبل القياس وإلا الصفحات تتقسم غلط.
let fontsPromise = null;
const loadSheetFonts = () => {
  if (!fontsPromise) {
    fontsPromise = document.fonts?.load
      ? Promise.all([document.fonts.load("400 14px 'Cairo'", 'ابجد'), document.fonts.load("700 14px 'Cairo'", 'ابجد')]).catch(() => null)
      : Promise.resolve();
  }
  return fontsPromise;
};

const safeName = (value) => String(value || '').replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim();

/* ───────────── أجزاء الصفحة ───────────── */

const HeaderLine = ({ label, children, ltr }) => (
  <div style={{ fontSize: 13.5, lineHeight: 1.75, display: 'flex', gap: 6 }}>
    <span style={{ fontWeight: 700 }}>{label}:</span>
    <span style={{ direction: ltr ? 'ltr' : 'rtl', unicodeBidi: 'isolate' }}>{children}</span>
  </div>
);

function SheetHeader({ meta, attempt, sheet }) {
  const cell = { border: `1px solid ${C.line}`, padding: '8px 12px', verticalAlign: 'top' };
  return (
    <div style={{ paddingBottom: 6 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <tbody>
          <tr>
            <td style={{ ...cell, width: '42%' }}>
              <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.8 }}>المعهد السعودي المتخصص العالي للتدريب</div>
              <HeaderLine label="الدبلوم">{meta.diploma}</HeaderLine>
              <HeaderLine label="المستوى">{meta.level}</HeaderLine>
              <HeaderLine label="مقرر">{meta.course}</HeaderLine>
              <HeaderLine label="درجة الاختبار">({fmtNum(sheet.total)})</HeaderLine>
              <HeaderLine label="مدة الاختبار">{meta.duration}</HeaderLine>
            </td>
            <td style={{ ...cell, width: '16%', textAlign: 'center', verticalAlign: 'middle' }}>
              <img alt="" src={LOGO} crossOrigin="anonymous" style={{ width: 96, height: 104, objectFit: 'contain', display: 'block', margin: '0 auto' }} />
            </td>
            <td style={{ ...cell, width: '42%', paddingTop: 14 }}>
              <HeaderLine label="اسم المتدرب/ة">{attempt.student_name || ''}</HeaderLine>
              <HeaderLine label="رقم الهوية" ltr>{String(attempt.national_id ?? '')}</HeaderLine>
              <HeaderLine label="درجة المتدرب/ة">( {fmtNum(sheet.earned)} / {fmtNum(sheet.total)} )</HeaderLine>
            </td>
          </tr>
        </tbody>
      </table>
      {/* الخط المزدوج تحت الرأس زي النموذج */}
      <div style={{ width: '86%', margin: '12px auto 0', borderTop: `2.5px solid ${C.ink}`, height: 4, borderBottom: `2.5px solid ${C.ink}` }} />
      {meta.showCorrect ? (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 22, marginTop: 10, fontSize: 11.5, color: C.muted }}>
          <span><Mark kind="ok" /> إجابة المتدرب الصحيحة</span>
          <span><Mark kind="bad" /> إجابة المتدرب الخاطئة</span>
          <span><Mark kind="key" /> الإجابة الصحيحة</span>
        </div>
      ) : null}
    </div>
  );
}

function Mark({ kind }) {
  const map = {
    ok: { ch: '✓', color: '#fff', bg: C.green, border: C.green },
    bad: { ch: '✗', color: '#fff', bg: C.red, border: C.red },
    key: { ch: '✓', color: C.green, bg: '#fff', border: C.green },
    chosen: { ch: '●', color: C.ink, bg: '#fff', border: C.ink },
    none: { ch: '', color: C.ink, bg: '#fff', border: '#9aa5a0' }
  }[kind];
  return (
    <span
      style={{
        display: 'inline-block', width: 15, height: 15, lineHeight: '15px', borderRadius: 3, textAlign: 'center',
        fontSize: 11, fontFamily: SYMBOL_FONT, fontWeight: 700, verticalAlign: 'middle',
        color: map.color, background: map.bg, border: `1.3px solid ${map.border}`
      }}
    >
      {map.ch}
    </span>
  );
}

function SectionBand({ section, showScores }) {
  return (
    <div style={{ background: C.band, padding: '6px 10px 7px', marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.6, borderBottom: `1.5px solid ${C.ink}`, paddingBottom: 1 }}>{section.heading}</div>
      <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', borderBottom: `1.5px solid ${C.ink}`, paddingBottom: 1 }}>
        {showScores ? `الدرجة ( ${fmtNum(section.earned)} / ${fmtNum(section.total)} )` : `الدرجة (${fmtNum(section.total)})`}
      </div>
    </div>
  );
}

const optionKind = (option, showCorrect) => {
  if (!showCorrect) return option.isSelected ? 'chosen' : 'none';
  if (option.isSelected) return option.isCorrect ? 'ok' : 'bad';
  return option.isCorrect ? 'key' : 'none';
};

function OptionChip({ option, letter, showCorrect, block }) {
  const kind = optionKind(option, showCorrect);
  const tone = {
    ok: { bg: C.greenBg, border: C.green },
    bad: { bg: C.redBg, border: C.red },
    key: { bg: '#fff', border: C.green },
    chosen: { bg: '#f1f3f2', border: C.ink },
    none: { bg: '#fff', border: C.soft }
  }[kind];
  return (
    <div
      style={{
        display: block ? 'block' : 'inline-block', padding: '3px 9px', borderRadius: 5,
        border: `1px ${kind === 'key' ? 'dashed' : 'solid'} ${tone.border}`, background: tone.bg,
        fontSize: 13.5, lineHeight: 1.7, fontWeight: option.isSelected ? 700 : 400, boxSizing: 'border-box'
      }}
    >
      <Mark kind={kind} />
      {letter ? <span style={{ fontWeight: 700, marginRight: 7 }}>{letter})</span> : null}
      <span style={{ marginRight: 7 }}>{option.text || (option.attachment ? option.attachment.name || 'مرفق' : '')}</span>
    </div>
  );
}

function QuestionBlock({ question, number, showCorrect }) {
  const tf = question.type === 'true_false';
  const shortOptions = question.options.every((o) => String(o.text).length <= 38);
  const full = question.earned >= question.points && question.points > 0;
  return (
    <div style={{ padding: '9px 2px 9px', borderBottom: `1px dashed ${C.soft}` }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, minWidth: 22 }}>{number}.</div>
        <div style={{ flex: 1, fontSize: 14.5, lineHeight: 1.8, textAlign: 'right' }}>{question.text}</div>
        {showCorrect ? (
          <div
            style={{
              fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', padding: '1px 8px', borderRadius: 4, marginTop: 3,
              direction: 'ltr', color: full ? C.green : question.earned > 0 ? C.amber : C.red,
              border: `1px solid ${full ? C.green : question.earned > 0 ? C.amber : C.red}`
            }}
          >
            {fmtNum(question.earned)} / {fmtNum(question.points)}
          </div>
        ) : null}
      </div>
      {question.attachment?.isImage ? (
        <img alt="" src={question.attachment.url} crossOrigin="anonymous" style={{ display: 'block', height: 150, maxWidth: '70%', objectFit: 'contain', margin: '6px 32px 0 0' }} />
      ) : null}
      <div style={{ marginTop: 6, paddingRight: 32, fontSize: 0 }}>
        {question.options.map((option, i) => (
          <div
            key={i}
            style={
              tf
                ? { display: 'inline-block', marginLeft: 14 }
                : shortOptions
                  ? { display: 'inline-block', verticalAlign: 'top', width: 'calc(50% - 4px)', marginLeft: i % 2 === 0 ? 8 : 0, marginBottom: 6 }
                  : { marginBottom: 5 }
            }
          >
            <OptionChip option={option} letter={tf ? null : OPTION_LETTERS[i] || String(i + 1)} showCorrect={showCorrect} block={!tf} />
          </div>
        ))}
      </div>
      {!question.answered ? (
        <div style={{ marginTop: 5, paddingRight: 32, fontSize: 12, fontWeight: 700, color: C.amber }}>لم يُجب المتدرب عن هذا السؤال</div>
      ) : null}
    </div>
  );
}

const EndBlock = () => (
  <div style={{ textAlign: 'center', fontSize: 16, fontWeight: 700, padding: '26px 0 6px' }}>انتهت الأسئلة بالتوفيق والنجاح</div>
);

function RunningStrip({ attempt, meta }) {
  return (
    <div style={{ height: RUN_H, boxSizing: 'border-box', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1.5px solid ${C.ink}`, fontSize: 12.5 }}>
      <span><b>المتدرب/ة:</b> {attempt.student_name || ''} — <span style={{ direction: 'ltr', unicodeBidi: 'isolate' }}>{String(attempt.national_id ?? '')}</span></span>
      <span style={{ color: C.muted }}>{meta.course}</span>
    </div>
  );
}

function Page({ children, index, count }) {
  return (
    <div
      data-sheet-page=""
      dir="rtl"
      style={{ position: 'relative', width: SHEET_W, height: SHEET_H, background: '#fff', overflow: 'hidden', fontFamily: FONT, color: C.ink, flexShrink: 0, boxSizing: 'border-box' }}
    >
      <div style={{ position: 'absolute', inset: FRAME, border: `1.2px solid ${C.line}` }} />
      <div style={{ position: 'absolute', top: FRAME + PAD_TOP, left: FRAME + PAD_X, right: FRAME + PAD_X, height: BODY_H }}>{children}</div>
      <div
        style={{
          position: 'absolute', left: FRAME + PAD_X, right: FRAME + PAD_X, bottom: FRAME + 8, height: FOOTER_H - 8,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: C.muted, borderTop: `1px solid ${C.soft}`
        }}
      >
        <span>المعهد السعودي المتخصص العالي للتدريب — نموذج إجابة المتدرب</span>
        <span>صفحة {index + 1} من {count}</span>
      </div>
    </div>
  );
}

/* ───────────── نموذج متدرب واحد (بيتقاس ويتقسم صفحات) ───────────── */

function StudentSheet({ examDetail, attempt, meta, onReady }) {
  const sheet = useMemo(() => buildAnswerSheet(examDetail, attempt), [examDetail, attempt]);
  const blocks = useMemo(() => {
    const list = [{ key: 'header', node: <SheetHeader meta={meta} attempt={attempt} sheet={sheet} /> }];
    sheet.sections.forEach((section) => {
      list.push({ key: `band-${section.key}`, keepWithNext: true, node: <SectionBand section={section} showScores={meta.showCorrect} /> });
      section.questions.forEach((question, i) => {
        list.push({ key: `q-${section.key}-${question.id}`, node: <QuestionBlock question={question} number={i + 1} showCorrect={meta.showCorrect} /> });
      });
    });
    list.push({ key: 'end', node: <EndBlock /> });
    return list;
  }, [sheet, meta, attempt]);

  const measureRef = useRef(null);
  const [pages, setPages] = useState(null);
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    let alive = true;
    loadSheetFonts().then(() => alive && setFontsReady(true));
    return () => { alive = false; };
  }, []);

  useLayoutEffect(() => {
    if (!fontsReady) return;
    const nodes = [...(measureRef.current?.children || [])];
    const heights = nodes.map((n) => n.offsetHeight);
    const result = [[]];
    let used = 0;
    let cap = BODY_H;
    blocks.forEach((block, i) => {
      const h = heights[i] || 0;
      const need = h + (block.keepWithNext && i + 1 < blocks.length ? heights[i + 1] || 0 : 0);
      if (used + need > cap && result[result.length - 1].length) {
        result.push([]);
        used = 0;
        cap = BODY_H - RUN_H;
      }
      result[result.length - 1].push(i);
      used += h;
    });
    setPages(result);
  }, [blocks, fontsReady]);

  useEffect(() => {
    if (pages) onReady?.();
  }, [pages]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!pages) {
    return (
      <div ref={measureRef} dir="rtl" style={{ width: CONTENT_W, fontFamily: FONT, color: C.ink }}>
        {blocks.map((b) => <div key={b.key}>{b.node}</div>)}
      </div>
    );
  }

  return pages.map((indexes, p) => (
    <Page key={p} index={p} count={pages.length}>
      {p > 0 ? <RunningStrip attempt={attempt} meta={meta} /> : null}
      {indexes.map((i) => <div key={blocks[i].key}>{blocks[i].node}</div>)}
    </Page>
  ));
}

/* ───────────── الحوار: بيانات الرأس + طباعة / تحميل ───────────── */

// attempts: المتدربين المطلوب طباعة نماذجهم (واحد أو الكل) — loadExam: بيرجع تفاصيل الاختبار (الأسئلة بخياراتها).
export default function ExamAnswerSheetsDialog({ open, onClose, exam, attempts, loadExam }) {
  const [examDetail, setExamDetail] = useState(null);
  const [meta, setMeta] = useState(null);
  const [job, setJob] = useState(null); // { mode }
  const [ready, setReady] = useState(0);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const exportRef = useRef(null);
  const examId = exam?.id;
  const list = useMemo(() => attempts || [], [attempts]);

  useEffect(() => {
    if (!open || !examId) return undefined;
    let alive = true;
    setExamDetail(null);
    setError('');
    setJob(null);
    Promise.resolve(loadExam(examId))
      .then((detail) => {
        if (!alive) return;
        setExamDetail(detail || {});
        const guess = guessHeaderMeta(detail?.title || exam?.title);
        const saved = readMeta(examId) || {};
        setMeta({
          diploma: saved.diploma ?? guess.diploma,
          level: saved.level ?? guess.level,
          course: saved.course ?? String(detail?.title || exam?.title || '').trim(),
          duration: saved.duration ?? formatDuration(detail?.duration_minutes),
          showCorrect: saved.showCorrect ?? true
        });
      })
      .catch((e) => alive && setError(e?.message || 'تعذر تحميل بيانات الاختبار'));
    return () => { alive = false; };
  }, [open, examId]); // eslint-disable-line react-hooks/exhaustive-deps

  const busy = Boolean(job);
  const set = (field) => (e) => setMeta((m) => ({ ...m, [field]: field === 'showCorrect' ? e.target.checked : e.target.value }));

  const start = (mode) => {
    writeMeta(examId, meta);
    setReady(0);
    setProgress('جارٍ تجهيز الصفحات…');
    setJob({ mode });
  };

  // لما كل النماذج تتقاس وتتقسم صفحات: نصوّر كل صفحة ونجمعهم في PDF واحد.
  useEffect(() => {
    if (!job || ready < list.length) return;
    let cancelled = false;
    (async () => {
      try {
        const root = exportRef.current;
        await waitForAssets(root);
        const pageNodes = [...root.querySelectorAll('[data-sheet-page]')];
        const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4', compress: true });
        const w = pdf.internal.pageSize.getWidth();
        const h = pdf.internal.pageSize.getHeight();
        for (let i = 0; i < pageNodes.length; i += 1) {
          if (cancelled) return;
          setProgress(`جارٍ إنشاء الصفحة ${i + 1} من ${pageNodes.length}…`);
          // eslint-disable-next-line no-await-in-loop
          const canvas = await html2canvas(pageNodes[i], { scale: 2, useCORS: true, backgroundColor: '#ffffff', width: SHEET_W, height: SHEET_H, windowWidth: SHEET_W, logging: false });
          if (i > 0) pdf.addPage();
          pdf.addImage(canvas.toDataURL('image/jpeg', 0.85), 'JPEG', 0, 0, w, h, undefined, 'FAST');
        }
        const title = safeName(meta.course || exam?.title || 'اختبار');
        const name = list.length === 1
          ? `نموذج إجابة - ${safeName(list[0].student_name)} - ${safeName(list[0].national_id)} - ${title}.pdf`
          : `نماذج إجابات المتدربين - ${title}.pdf`;
        if (job.mode === 'print') {
          const win = window.open(pdf.output('bloburl'), '_blank');
          if (!win) pdf.save(name);
        } else {
          pdf.save(name);
        }
      } catch (e) {
        setError(e?.message || 'تعذر إنشاء الملف');
      } finally {
        if (!cancelled) {
          setJob(null);
          setProgress('');
        }
      }
    })();
    return () => { cancelled = true; };
  }, [job, ready, list.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const label = { fontSize: 13, fontWeight: 700, mb: 0.5 };
  const green = '#057546';

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="sm" fullWidth dir="rtl">
      <DialogTitle sx={{ fontWeight: 'bold' }}>
        {list.length === 1 ? `نموذج إجابة: ${list[0].student_name || ''}` : `نماذج إجابات المتدربين (${list.length})`}
      </DialogTitle>
      <DialogContent dividers>
        {error ? <Box sx={{ color: '#c62828', fontWeight: 700, mb: 1.5 }}>{error}</Box> : null}
        {!meta ? (
          error ? null : <Box sx={{ py: 5, textAlign: 'center' }}><CircularProgress sx={{ color: green }} /></Box>
        ) : (
          <Box sx={{ display: 'grid', gap: 1.6 }}>
            <Box sx={{ fontSize: 13, color: 'text.secondary' }}>
              بيانات رأس النموذج كما ستظهر في الصفحة الأولى لكل متدرب. تُحفظ لهذا الاختبار تلقائيًا.
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.6 }}>
              <Box><Box sx={label}>الدبلوم</Box><TextField fullWidth size="small" value={meta.diploma} onChange={set('diploma')} disabled={busy} /></Box>
              <Box><Box sx={label}>المستوى</Box><TextField fullWidth size="small" value={meta.level} onChange={set('level')} disabled={busy} /></Box>
              <Box><Box sx={label}>المقرر</Box><TextField fullWidth size="small" value={meta.course} onChange={set('course')} disabled={busy} /></Box>
              <Box><Box sx={label}>مدة الاختبار</Box><TextField fullWidth size="small" value={meta.duration} onChange={set('duration')} disabled={busy} /></Box>
            </Box>
            <FormControlLabel
              control={<Checkbox checked={meta.showCorrect} onChange={set('showCorrect')} disabled={busy} sx={{ '&.Mui-checked': { color: green } }} />}
              label="إظهار الإجابات الصحيحة ودرجة كل سؤال"
            />
            {busy ? (
              <Box>
                <LinearProgress sx={{ mb: 0.8, '& .MuiLinearProgress-bar': { backgroundColor: green } }} />
                <Box sx={{ fontSize: 13, fontWeight: 700 }}>{progress}</Box>
              </Box>
            ) : null}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between', px: 2 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<Print />}
            disabled={!meta || busy || !list.length}
            onClick={() => start('print')}
            sx={{ bgcolor: green, color: '#fff', fontWeight: 'bold', '&:hover': { bgcolor: '#034d31' } }}
          >
            طباعة
          </Button>
          <Button
            variant="outlined"
            startIcon={<PictureAsPdf />}
            disabled={!meta || busy || !list.length}
            onClick={() => start('download')}
            sx={{ color: green, borderColor: green, fontWeight: 'bold' }}
          >
            تحميل PDF
          </Button>
        </Box>
        <Button onClick={onClose} disabled={busy} sx={{ color: 'text.primary' }}>إغلاق</Button>
      </DialogActions>

      {/* نسخة مخفية بالحجم الطبيعي للتصوير */}
      {job && examDetail ? (
        <Box sx={{ position: 'fixed', left: -20000, top: 0, direction: 'ltr', pointerEvents: 'none' }} aria-hidden>
          <div ref={exportRef} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {list.map((attempt) => (
              <StudentSheet key={attempt.id} examDetail={examDetail} attempt={attempt} meta={meta} onReady={() => setReady((n) => n + 1)} />
            ))}
          </div>
        </Box>
      ) : null}
    </Dialog>
  );
}

export { StudentSheet };
