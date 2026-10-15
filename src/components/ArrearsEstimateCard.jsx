import React from 'react';
import { Box, Card, CardContent, Chip, CircularProgress, Tooltip, Typography } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const money = (value) =>
  `${Math.round(Number(value) || 0).toLocaleString('ar-EG')} ر.س`;

const count = (value) => Math.round(Number(value) || 0).toLocaleString('ar-EG');

const dateText = (date) =>
  date
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    : '-';

const STATE_META = {
  overdue: { label: 'متأخر عن السداد', color: 'error' },
  'course-ended': { label: 'انتهت مدة الدبلوم وعليه رصيد', color: 'error' },
  'on-track': { label: 'ملتزم بالسداد', color: 'success' },
  'paid-off': { label: 'مسدد بالكامل', color: 'success' },
  'not-started': { label: 'لم يحن موعد أول قسط', color: 'info' }
};

const FORMULA =
  'المتأخر = (سعر الدبلوم بعد الخصم ÷ مدة الدبلوم بالأشهر) × عدد الأشهر الكاملة منذ بداية الدفعة − المسدد فعليًا، ولا يزيد على الرصيد المتبقي.';

// Estimated arrears for the "Main" tab of the student actions dialog.
// `estimate` comes from estimateArrears(statements).
export default function ArrearsEstimateCard({ estimate, loading, cardSx, tileSx }) {
  const title = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
      <Typography variant="h6" sx={{ color: '#057546', fontWeight: 'bold' }}>
        المتأخرات التقديرية
      </Typography>
      <Chip size="small" variant="outlined" label="تقريبية" />
      <Tooltip title={FORMULA} arrow>
        <InfoOutlinedIcon fontSize="small" sx={{ opacity: 0.7, cursor: 'help' }} />
      </Tooltip>
    </Box>
  );

  if (loading) {
    return (
      <Card sx={cardSx}>
        <CardContent sx={{ p: 3 }}>
          {title}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={18} />
            <Typography variant="body2">جاري حساب المتأخرات من كشف الحساب…</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!estimate?.available) {
    return (
      <Card sx={cardSx}>
        <CardContent sx={{ p: 3 }}>
          {title}
          <Typography variant="body2" color="text.secondary">
            {estimate?.reason === 'not-diploma'
              ? 'المتأخرات التقديرية متاحة لطلاب الدبلومات فقط (مدة سنتان). الدورات لها مدة مختلفة.'
              : 'لا يتوفر كشف حساب لهذا الطالب لحساب المتأخرات.'}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const meta = STATE_META[estimate.state] || STATE_META['on-track'];
  const hasOverdue = estimate.overdue > 0;

  const rows = [
    ['سعر الدبلوم بعد الخصم', money(estimate.netPrice)],
    ['قسط الشهر (سعر الدبلوم ÷ ' + count(estimate.months) + ')', money(estimate.monthlyInstallment)],
    [
      estimate.startSource === 'batch' ? 'بداية الدفعة' : 'أول رسوم (لا يتوفر تاريخ الدفعة)',
      `${dateText(estimate.startDate)} — مضى ${count(estimate.monthsElapsed)} شهر`
    ],
    [
      'مدة الدبلوم',
      estimate.courseEnded
        ? `${count(estimate.months)} شهر — انتهت`
        : `${count(estimate.months)} شهر — متبقي ${count(estimate.monthsRemaining)}`
    ],
    [
      `المستحق سداده حتى اليوم (${count(estimate.dueInstallments)} قسط)`,
      money(estimate.expectedPaid)
    ],
    ['المسدد فعليًا', money(estimate.payments)],
    ['الرصيد المتبقي كله', money(estimate.balance)]
  ];

  return (
    <Card sx={cardSx}>
      <CardContent sx={{ p: 3 }}>
        {title}

        <Box
          sx={(theme) => ({
            ...(tileSx ? tileSx(theme) : {}),
            borderRadius: 2,
            p: 2,
            textAlign: 'center',
            mb: 1.5,
            borderColor: hasOverdue ? theme.palette.error.main : undefined
          })}
        >
          <Chip label={meta.label} color={meta.color} sx={{ fontWeight: 800, mb: 1 }} />
          <Typography
            variant="h4"
            fontWeight="bold"
            sx={(theme) => ({
              color: hasOverdue ? theme.palette.error.main : theme.palette.success.main
            })}
          >
            {hasOverdue ? `≈ ${money(estimate.overdue)}` : money(0)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {hasOverdue
              ? `متأخر تقريبًا عن ${estimate.overdueInstallments.toLocaleString('ar-EG', {
                  maximumFractionDigits: 1
                })} قسط شهري`
              : estimate.state === 'paid-off'
                ? 'لا يوجد رصيد متبقي'
                : 'لا توجد متأخرات حتى اليوم'}
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, columnGap: 3, rowGap: 0.75 }}>
          {rows.map(([label, value]) => (
            <Box
              key={label}
              sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, borderBottom: '1px dashed', borderColor: 'divider', pb: 0.5 }}
            >
              <Typography variant="body2" color="text.secondary">
                {label}
              </Typography>
              <Typography variant="body2" fontWeight="bold" sx={{ whiteSpace: 'nowrap' }}>
                {value}
              </Typography>
            </Box>
          ))}
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
          ⚠️ تقدير تقريبي بحسب سعر الدبلوم ومدته سنتان تُحسب من بداية دفعة الطالب، للاسترشاد فقط وليس مطالبة رسمية. قد يكون للطالب اتفاق سداد مختلف.
        </Typography>
      </CardContent>
    </Card>
  );
}
