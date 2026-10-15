import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Swal from "sweetalert2";
import { newRowId, recalcPrintService, toNum } from "./offerPriceCalc";
import { HIDEABLE_COLUMNS, SHOW_OPTIONS, countPages } from "./OfferPriceDocument";

/*
  FrmOfferPriceEditBeforePreview في الديسكتوب:
  تعديل نصوص الصفحات + البنود + المتدربين قبل المعاينة. التعديل هنا للمستند بس ومش بيتحفظ في العرض.
  أي سطر يبدأ بـ ** أو [B] أو # بيطلع Bold في المستند.
*/

const primaryColor = "#057546";
const primaryDark = "#034d31";

const SERVICE_COLUMNS = [
  { key: "diplomName", label: "البيان", width: 220, text: true },
  { key: "offerUnit", label: "الوحدة", width: 80, text: true },
  { key: "offerQty", label: "الكمية", width: 70 },
  { key: "priceBeforeDiscount", label: "سعر الوحدة (شامل الضريبة)", width: 120 },
  { key: "offerSubtotal", label: "الإجمالي (شامل الضريبة)", width: 120 },
  { key: "discountValue", label: "خصم %", width: 70 },
  { key: "priceAfterDiscount", label: "بعد الخصم", width: 100 },
  { key: "paidAmount", label: "المدفوع", width: 90 },
  { key: "remainingAmount", label: "المتبقي", width: 90 }
];

const TRAINEE_COLUMNS = [
  { key: "traineeName", label: "اسم المتدرب", width: 170, text: true },
  { key: "traineeNationalId", label: "رقم الهوية", width: 110, text: true },
  { key: "traineeTel", label: "الجوال", width: 110, text: true },
  { key: "specialization", label: "التخصص", width: 170, text: true },
  { key: "studyStatus", label: "الحالة الدراسية", width: 110, text: true },
  { key: "priceBeforeDiscount", label: "قبل الخصم", width: 90 },
  { key: "discountValue", label: "خصم %", width: 70 },
  { key: "priceAfterDiscount", label: "بعد الخصم", width: 90 },
  { key: "paidAmount", label: "المدفوع", width: 90 },
  { key: "remainingAmount", label: "المتبقي", width: 90 }
];

const Field = ({ label, value, onChange, multiline = false, rows = 1 }) => (
  <Grid item xs={12}>
    <TextField
      label={label}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      fullWidth
      size="small"
      multiline={multiline}
      minRows={multiline ? rows : undefined}
      InputLabelProps={{ shrink: true }}
      inputProps={{ dir: "rtl" }}
    />
  </Grid>
);

const EditableRows = ({ columns, rows, onChange, onDelete }) => (
  <TableContainer sx={{ border: "1px solid #dfe7e3", borderRadius: 2, maxHeight: 360 }}>
    <Table size="small" stickyHeader>
      <TableHead>
        <TableRow>
          {columns.map((c) => (
            <TableCell key={c.key} sx={{ fontWeight: 900, minWidth: c.width, background: "#e2e8ef", textAlign: "center" }}>
              {c.label}
            </TableCell>
          ))}
          <TableCell sx={{ background: "#e2e8ef", width: 48 }} />
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={columns.length + 1} sx={{ textAlign: "center", fontWeight: 700, color: "text.secondary" }}>
              لا توجد بيانات
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={row.id}>
              {columns.map((c) => (
                <TableCell key={c.key} sx={{ p: 0.5 }}>
                  <TextField
                    value={row[c.key] ?? ""}
                    onChange={(e) => onChange(row.id, c.key, e.target.value)}
                    size="small"
                    fullWidth
                    inputProps={{ dir: c.text ? "rtl" : "ltr", style: { textAlign: "center", fontWeight: 700 } }}
                  />
                </TableCell>
              ))}
              <TableCell sx={{ p: 0.5, textAlign: "center" }}>
                <Tooltip title="حذف السطر">
                  <IconButton size="small" color="error" onClick={() => onDelete(row.id)}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </TableContainer>
);

const OfferPriceEditBeforePreviewDialog = ({ open, onClose, onPreview, initialDoc }) => {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));
  const [tab, setTab] = useState(0);
  const [doc, setDoc] = useState(initialDoc);

  useEffect(() => {
    if (open) {
      setDoc(initialDoc);
      setTab(0);
    }
  }, [open, initialDoc]);

  if (!doc) return null;

  const setText = (key) => (value) => setDoc((prev) => ({ ...prev, texts: { ...prev.texts, [key]: value } }));

  const updateRow = (listKey) => (id, field, value) =>
    setDoc((prev) => ({
      ...prev,
      [listKey]: prev[listKey].map((r) => (r.id === id ? { ...r, [field]: value } : r))
    }));

  const deleteRow = (listKey) => async (id) => {
    const confirm = await Swal.fire({
      icon: "question",
      title: "حذف السطر المحدد؟",
      showCancelButton: true,
      confirmButtonText: "حذف",
      cancelButtonText: "تراجع",
      confirmButtonColor: "#ae1e21"
    });
    if (!confirm.isConfirmed) return;
    setDoc((prev) => ({ ...prev, [listKey]: prev[listKey].filter((r) => r.id !== id) }));
  };

  const addService = () =>
    setDoc((prev) => ({
      ...prev,
      services: [
        ...prev.services,
        {
          id: newRowId(),
          sortOrder: prev.services.length,
          diplomName: "بند جديد",
          offerUnit: "Pcs",
          offerQty: 1,
          offerCost: 0,
          offerSubtotal: 0,
          priceBeforeDiscount: 0,
          discountValue: 0,
          priceAfterDiscount: 0,
          paidAmount: 0,
          remainingAmount: 0
        }
      ]
    }));

  const addTrainee = () =>
    setDoc((prev) => ({
      ...prev,
      trainees: [
        ...prev.trainees,
        {
          id: newRowId(),
          traineeName: "متدرب جديد",
          traineeNationalId: "",
          traineeTel: "",
          specialization: prev.services[0]?.diplomName || "",
          studyStatus: "",
          priceBeforeDiscount: 0,
          discountValue: 0,
          priceAfterDiscount: 0,
          paidAmount: 0,
          remainingAmount: 0
        }
      ]
    }));

  // CmdOk_Click: RecalculateRows ثم المعاينة.
  const handlePreview = () => {
    const services = doc.services
      .filter((r) => String(r.diplomName || "").trim())
      .map((r) => recalcPrintService(r));
    const trainees = doc.trainees
      .filter((r) => String(r.traineeName || "").trim())
      .map((r) => ({
        ...r,
        priceBeforeDiscount: toNum(r.priceBeforeDiscount),
        discountValue: toNum(r.discountValue),
        priceAfterDiscount: toNum(r.priceAfterDiscount),
        paidAmount: toNum(r.paidAmount),
        remainingAmount: toNum(r.remainingAmount)
      }));

    const next = { ...doc, services, trainees };
    if (!countPages(next)) {
      Swal.fire({ icon: "warning", title: "تنبيه", text: "كل أجزاء المستند مخفية، اظهر جزء واحد على الأقل", confirmButtonText: "حسناً" });
      return;
    }
    onPreview?.(next);
  };

  const isShown = (key) => doc.show?.[key] !== false;
  const toggleShow = (key) => setDoc((prev) => ({ ...prev, show: { ...prev.show, [key]: !isShown(key) } }));
  const isColumnHidden = (table, key) => (doc.hiddenColumns?.[table] || []).includes(key);
  const toggleColumn = (table, key) =>
    setDoc((prev) => {
      const list = prev.hiddenColumns?.[table] || [];
      const next = list.includes(key) ? list.filter((k) => k !== key) : [...list, key];
      return { ...prev, hiddenColumns: { ...prev.hiddenColumns, [table]: next } };
    });

  const t = doc.texts;

  return (
    <Dialog open={open} onClose={onClose} fullScreen={isPhone} fullWidth maxWidth="xl" PaperProps={{ sx: { direction: "rtl", height: isPhone ? "100dvh" : "92vh" } }}>
      <DialogTitle sx={{ fontWeight: 900, color: "#fff", background: `linear-gradient(135deg, ${primaryColor}, ${primaryDark})` }}>
        تعديل عرض السعر قبل المعاينة
      </DialogTitle>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ borderBottom: "1px solid #e0e0e0", "& .MuiTab-root": { fontWeight: 900 } }}>
        <Tab label="الصفحة الأولى - النصوص" />
        <Tab label="الصفحة الثانية - البنود" />
        <Tab label="الصفحة الثالثة - التفاصيل والمتدربين" />
        <Tab label="إظهار / إخفاء" />
      </Tabs>

      <DialogContent dividers>
        <Typography sx={{ fontSize: "0.8rem", color: "text.secondary", mb: 1.5, fontWeight: 700 }}>
          لجعل أي سطر عريض (Bold) في المستند اكتبه بين ** ** أو ابدأه بـ #
        </Typography>

        {tab === 0 ? (
          <Grid container spacing={1.5}>
            <Field label="السادة" value={t.page1Recipient} onChange={setText("page1Recipient")} />
            <Field label="السلام" value={t.page1Greeting} onChange={setText("page1Greeting")} />
            <Field label="تحية وبعد" value={t.page1AfterGreeting} onChange={setText("page1AfterGreeting")} />
            <Field label="متن الخطاب" value={t.page1Body} onChange={setText("page1Body")} multiline rows={12} />
            <Field label="الجملة البولد" value={t.page1BoldClosing} onChange={setText("page1BoldClosing")} />
            <Field label="التحية" value={t.page1Thanks} onChange={setText("page1Thanks")} />
          </Grid>
        ) : null}

        {tab === 1 ? (
          <Stack spacing={1.5}>
            <Grid container spacing={1.5}>
              <Field label="عنوان الصفحة الثانية" value={t.page2Title} onChange={setText("page2Title")} />
            </Grid>
            <Stack direction="row" justifyContent="flex-end">
              <Button startIcon={<AddIcon />} onClick={addService} sx={{ fontWeight: 900, color: primaryColor }}>
                إضافة بند
              </Button>
            </Stack>
            <EditableRows columns={SERVICE_COLUMNS} rows={doc.services} onChange={updateRow("services")} onDelete={deleteRow("services")} />
            <Grid container spacing={1.5}>
              <Field label="عنوان قبل الإيضاح" value={t.page2BeforeInfoTitle} onChange={setText("page2BeforeInfoTitle")} />
              <Field label="نص قبل الإيضاح" value={t.page2BeforeInfoText} onChange={setText("page2BeforeInfoText")} multiline rows={3} />
              <Field label="كلمة الإيضاح" value={t.page2InfoLabel} onChange={setText("page2InfoLabel")} />
              <Field label="عنوان بعد الإيضاح" value={t.page2AfterInfoTitle} onChange={setText("page2AfterInfoTitle")} />
              <Field label="نص بعد الإيضاح" value={t.page2AfterInfoText} onChange={setText("page2AfterInfoText")} multiline rows={3} />
              <Grid item xs={12} md={6}>
                <TextField label="البنود العامة" value={t.commonTerms || ""} onChange={(e) => setText("commonTerms")(e.target.value)} fullWidth multiline minRows={6} size="small" InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="بنود إضافية للصفحة الثانية" value={t.page2ExtraTerms || ""} onChange={(e) => setText("page2ExtraTerms")(e.target.value)} fullWidth multiline minRows={6} size="small" InputLabelProps={{ shrink: true }} />
              </Grid>
            </Grid>
          </Stack>
        ) : null}

        {tab === 2 ? (
          <Stack spacing={1.5}>
            <Grid container spacing={1.5}>
              <Field label="عنوان كشف المتدربين" value={t.page3TraineesTitle} onChange={setText("page3TraineesTitle")} />
              <Field label="عنوان تفاصيل العرض" value={t.page3DetailsTitle} onChange={setText("page3DetailsTitle")} />
            </Grid>
            <Stack direction="row" justifyContent="flex-end">
              <Button startIcon={<AddIcon />} onClick={addTrainee} sx={{ fontWeight: 900, color: primaryColor }}>
                إضافة متدرب
              </Button>
            </Stack>
            <EditableRows columns={TRAINEE_COLUMNS} rows={doc.trainees} onChange={updateRow("trainees")} onDelete={deleteRow("trainees")} />
            <Box>
              <TextField label="بنود إضافية للصفحة الثالثة" value={t.page3ExtraTerms || ""} onChange={(e) => setText("page3ExtraTerms")(e.target.value)} fullWidth multiline minRows={3} size="small" InputLabelProps={{ shrink: true }} />
            </Box>
          </Stack>
        ) : null}

        {tab === 3 ? (
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography sx={{ fontWeight: 900, color: primaryColor, mb: 0.5 }}>أجزاء المستند</Typography>
              {SHOW_OPTIONS.map((o) => (
                <FormControlLabel
                  key={o.key}
                  sx={{ display: "flex", m: 0 }}
                  control={<Checkbox size="small" checked={isShown(o.key)} onChange={() => toggleShow(o.key)} sx={{ color: primaryColor }} />}
                  label={<Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>{o.label}</Typography>}
                />
              ))}
            </Grid>
            {Object.entries(HIDEABLE_COLUMNS).map(([table, group]) => (
              <Grid item xs={12} sm={6} md={table === "trainees" ? 4 : 2} key={table}>
                <Typography sx={{ fontWeight: 900, color: primaryColor, mb: 0.5 }}>{group.title}</Typography>
                {group.columns.map((c) => (
                  <FormControlLabel
                    key={c.key}
                    sx={{ display: "flex", m: 0 }}
                    control={
                      <Checkbox size="small" checked={!isColumnHidden(table, c.key)} onChange={() => toggleColumn(table, c.key)} sx={{ color: primaryColor }} />
                    }
                    label={<Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>{c.label}</Typography>}
                  />
                ))}
              </Grid>
            ))}
            <Grid item xs={12}>
              <Typography sx={{ fontSize: "0.8rem", color: "text.secondary", fontWeight: 700 }}>
                الإخفاء للطباعة دي بس ومش بيتحفظ في العرض. عمود البيان / اسم المتدرب ثابت.
              </Typography>
            </Grid>
          </Grid>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ gap: 1 }}>
        <Button onClick={onClose} sx={{ fontWeight: 900, color: "#ae1e21" }}>
          إلغاء
        </Button>
        <Button
          variant="contained"
          startIcon={<VisibilityIcon />}
          onClick={handlePreview}
          sx={{ fontWeight: 900, backgroundColor: primaryColor, "&:hover": { backgroundColor: primaryDark } }}
        >
          معاينة بعد التعديل
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OfferPriceEditBeforePreviewDialog;
