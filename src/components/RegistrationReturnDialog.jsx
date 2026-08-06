import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
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
import ReplayIcon from "@mui/icons-material/Replay";
import SaveIcon from "@mui/icons-material/Save";
import Swal from "sweetalert2";

const primaryColor = "#057546";
const accentColor = "#ae1e21";

const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const readValue = (object, ...keys) => {
  for (const key of keys) {
    const value = object?.[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return "";
};

const getUserGuid = (user) =>
  user?.userGuid ||
  user?.guid ||
  user?.Guid ||
  user?.USER_GUID ||
  user?.USER_GUID____ ||
  "";

const money = (value) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

export default function RegistrationReturnDialog({
  open,
  student,
  apiBaseUrl,
  onClose,
  onSaved
}) {
  const currentUser = useMemo(() => getCurrentUser(), []);
  const userGuid = useMemo(() => getUserGuid(currentUser), [currentUser]);

  const studentName = readValue(student, "studentName", "StudentName");
  const nationalId = readValue(student, "nationalId", "NationalId");
  const studentTel = readValue(student, "studentTel", "StudentTel", "tel");
  const accountGuid = readValue(student, "accountGuid", "AccountGuid");
  const regDocGuid = readValue(student, "regDocGuid", "RegDocGuid");

  const [context, setContext] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [selectedDocGuid, setSelectedDocGuid] = useState("");
  const [documentInfo, setDocumentInfo] = useState(null);
  const [notes, setNotes] = useState("");
  const [returnDate, setReturnDate] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [loading, setLoading] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const details = Array.isArray(context?.details) ? context.details : [];
  const totals = context?.totals || { total: 0, tax: 0, subTotal: 0 };

  const loadContext = async () => {
    if (!regDocGuid || !userGuid) return;

    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({ regDocGuid, userGuid });

      const response = await fetch(
        `${apiBaseUrl}/api/registration-returns/context?${params.toString()}`,
        { cache: "no-store" }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            "تعذر تجهيز بيانات مرتجع الاستمارة"
        );
      }

      setContext(result?.data || null);
    } catch (e) {
      setError(e.message || "حدث خطأ أثناء تجهيز المرتجع");
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async (branchGuid) => {
    if (!branchGuid || !userGuid) return;

    try {
      setLoadingDocs(true);
      setError("");

      const params = new URLSearchParams({
        userGuid,
        branchGuid
      });

      const response = await fetch(
        `${apiBaseUrl}/api/registration-returns/documents?${params.toString()}`,
        { cache: "no-store" }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            "تعذر تحميل دفاتر مرتجع الاستمارة"
        );
      }

      setDocuments(Array.isArray(result?.data) ? result.data : []);
    } catch (e) {
      setDocuments([]);
      setError(e.message || "حدث خطأ أثناء تحميل الدفاتر");
    } finally {
      setLoadingDocs(false);
    }
  };

  const loadDocumentInfo = async (docGuid) => {
    if (!docGuid) {
      setDocumentInfo(null);
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${apiBaseUrl}/api/registration-returns/document-info?docGuid=${encodeURIComponent(
          docGuid
        )}`,
        { cache: "no-store" }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            "تعذر قراءة إعدادات دفتر المرتجع"
        );
      }

      setDocumentInfo(result?.data || null);
    } catch (e) {
      setDocumentInfo(null);
      setError(e.message || "حدث خطأ أثناء قراءة إعدادات الدفتر");
    }
  };

  useEffect(() => {
    if (!open) return;

    setContext(null);
    setDocuments([]);
    setSelectedDocGuid("");
    setDocumentInfo(null);
    setNotes("");
    setReturnDate(new Date().toISOString().slice(0, 16));
    setError("");

    loadContext();
  }, [open, regDocGuid, userGuid]);

  useEffect(() => {
    const branchGuid = context?.regDocBranchGuid;

    if (!branchGuid) return;

    loadDocuments(branchGuid);
  }, [context?.regDocBranchGuid]);

  useEffect(() => {
    loadDocumentInfo(selectedDocGuid);
  }, [selectedDocGuid]);

  const save = async () => {
    if (!selectedDocGuid) {
      return Swal.fire({
        icon: "warning",
        title: "تنبيه",
        text: "برجاء اختيار نوع المستند",
        confirmButtonColor: accentColor
      });
    }

    if (!context?.salesManGuid) {
      return Swal.fire({
        icon: "warning",
        title: "تنبيه",
        text: "لا يمكن قراءة مندوب البيع الخاص باستمارة التسجيل",
        confirmButtonColor: accentColor
      });
    }

    if (!notes.trim()) {
      return Swal.fire({
        icon: "warning",
        title: "تنبيه",
        text: "لا يمكن حفظ مرتجع التسجيل بدون ملاحظات",
        confirmButtonColor: accentColor
      });
    }

    if (!documentInfo?.branchGuid) {
      return Swal.fire({
        icon: "warning",
        title: "تنبيه",
        text: "إعدادات دفتر المرتجع غير مكتملة",
        confirmButtonColor: accentColor
      });
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `${apiBaseUrl}/api/registration-returns`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userGuid,
            regDocGuid,
            accountGuid,
            docGuid: selectedDocGuid,
            branchGuid: documentInfo.branchGuid,
            salesManGuid: context.salesManGuid,
            returnDate: new Date(returnDate).toISOString(),
            notes: notes.trim(),
            isUse: true,
            total: Number(totals.total || 0),
            tax: Number(totals.tax || 0),
            subTotal: Number(totals.subTotal || 0),
            chkMaden: Boolean(documentInfo.chkMaden),
            madenGuid: documentInfo.madenGuid || null,
            chkDaen: Boolean(documentInfo.chkDaen),
            daenGuid: documentInfo.daenGuid || null,
            costCenterGuid: documentInfo.costCenterGuid || null,
            details: details.map((item) => ({
              diplomGuid: item.diplomGuid,
              cost: Number(item.cost || 0),
              tax: Number(item.tax || 0),
              subTotal: Number(item.subTotal || 0),
              diplomType: Number(item.diplomType || 0),
              qty: Number(item.qty || 0),
              unit: item.unit || item.unit_ || ""
            }))
          })
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            "تعذر حفظ مرتجع الاستمارة"
        );
      }

      await Swal.fire({
        icon: "success",
        title: "تم الحفظ",
        text: result?.message || "تم حفظ مرتجع التسجيل بنجاح",
        confirmButtonColor: primaryColor
      });

      onSaved?.(result);
    } catch (e) {
      setError(e.message || "حدث خطأ أثناء حفظ مرتجع الاستمارة");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      maxWidth="lg"
      fullWidth
      dir="rtl"
      PaperProps={{ sx: { borderRadius: 3, minHeight: "78vh" } }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          color: primaryColor,
          fontWeight: 950
        }}
      >
        <ReplayIcon />
        مرتجع استمارة تسجيل
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

        {loading ? (
          <Box sx={{ py: 10, textAlign: "center" }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={2}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography
                sx={{
                  mb: 1.5,
                  color: primaryColor,
                  fontWeight: 950,
                  textAlign: "center"
                }}
              >
                بيانات الطالب
              </Typography>

              <Grid container spacing={1.5}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="اسم الطالب"
                    value={studentName || ""}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="رقم الهوية"
                    value={nationalId || ""}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="رقم الجوال"
                    value={studentTel || ""}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
              </Grid>
            </Paper>

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="التاريخ"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth disabled={loadingDocs}>
                  <InputLabel>نوع المستند</InputLabel>
                  <Select
                    value={selectedDocGuid}
                    label="نوع المستند"
                    onChange={(e) => setSelectedDocGuid(e.target.value)}
                  >
                    {documents.map((item) => (
                      <MenuItem key={item.guid} value={item.guid}>
                        {item.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="مندوب البيع"
                  value={context?.salesManName || ""}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              multiline
              minRows={3}
              label="ملاحظات"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f7d38a" }}>
                    <TableCell align="right" sx={{ fontWeight: 950 }}>
                      الدبلوم - الدورة
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 950 }}>
                      الوحدة
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 950 }}>
                      الكمية
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 950 }}>
                      التكلفة
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 950 }}>
                      الضريبة
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 950 }}>
                      الصافي
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {details.map((item, index) => (
                    <TableRow key={`${item.diplomGuid}-${index}`}>
                      <TableCell align="right" sx={{ fontWeight: 800 }}>
                        {item.name}
                      </TableCell>
                      <TableCell align="center">
                        {item.unit || item.unit_ || "-"}
                      </TableCell>
                      <TableCell align="center">
                        {Number(item.qty || 0)}
                      </TableCell>
                      <TableCell align="center">{money(item.cost)}</TableCell>
                      <TableCell align="center">{money(item.tax)}</TableCell>
                      <TableCell align="center">{money(item.subTotal)}</TableCell>
                    </TableRow>
                  ))}

                  {details.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        لا توجد تفاصيل في استمارة التسجيل
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </TableContainer>

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: "center" }}>
                  <Typography sx={{ fontWeight: 900 }}>الإجمالي</Typography>
                  <Typography sx={{ color: "#d71920", fontSize: 25, fontWeight: 950 }}>
                    {money(totals.total)}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: "center" }}>
                  <Typography sx={{ fontWeight: 900 }}>الضريبة</Typography>
                  <Typography sx={{ color: "#d71920", fontSize: 25, fontWeight: 950 }}>
                    {money(totals.tax)}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: "center" }}>
                  <Typography sx={{ fontWeight: 900 }}>الصافي</Typography>
                  <Typography sx={{ color: "#d71920", fontSize: 25, fontWeight: 950 }}>
                    {money(totals.subTotal)}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          variant="contained"
          onClick={save}
          disabled={saving || loading || !context}
          startIcon={
            saving ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <SaveIcon />
            )
          }
          sx={{ backgroundColor: primaryColor, minWidth: 140 }}
        >
          حفظ
        </Button>

        <Button
          onClick={onClose}
          disabled={saving}
          sx={{ color: accentColor, fontWeight: 900 }}
        >
          إغلاق
        </Button>
      </DialogActions>
    </Dialog>
  );
}