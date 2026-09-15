import { DESKTOP_BREAKPOINT } from '../config/sidebarLayout';
import * as uiLayout from './common/uiLayout';
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
  Typography,
  useMediaQuery,
  useTheme
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
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(`(min-width:600px) and (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`);
  const isCompact = isPhone || isTablet;

  const getResponsiveSwalOptions = () => {
    if (!isCompact) return {};

    return {
      width: isPhone ? "82vw" : "420px",
      padding: isPhone ? "0.65rem" : "0.85rem",
      customClass: {
        popup: "sstli-return-swal",
        icon: "sstli-return-swal-icon",
        title: "sstli-return-swal-title",
        htmlContainer: "sstli-return-swal-text",
        actions: "sstli-return-swal-actions",
        confirmButton: "sstli-return-swal-confirm",
        cancelButton: "sstli-return-swal-cancel"
      }
    };
  };

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
        ...getResponsiveSwalOptions(),
        icon: "warning",
        title: "تنبيه",
        text: "برجاء اختيار نوع المستند",
        confirmButtonColor: accentColor
      });
    }

    if (!context?.salesManGuid) {
      return Swal.fire({
        ...getResponsiveSwalOptions(),
        icon: "warning",
        title: "تنبيه",
        text: "لا يمكن قراءة مندوب البيع الخاص باستمارة التسجيل",
        confirmButtonColor: accentColor
      });
    }

    if (!notes.trim()) {
      return Swal.fire({
        ...getResponsiveSwalOptions(),
        icon: "warning",
        title: "تنبيه",
        text: "لا يمكن حفظ مرتجع التسجيل بدون ملاحظات",
        confirmButtonColor: accentColor
      });
    }

    if (!documentInfo?.branchGuid) {
      return Swal.fire({
        ...getResponsiveSwalOptions(),
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
        ...getResponsiveSwalOptions(),
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
    <>
      <style>
        {`
          @media screen {
            .sstli-return-swal {
              max-width: 420px !important;
              border-radius: 14px !important;
              font-family: Cairo, Arial, sans-serif !important;
            }
            .sstli-return-swal-icon {
              width: 3.4em !important;
              height: 3.4em !important;
              margin: 0.6em auto 0.25em !important;
            }
            .sstli-return-swal-icon .swal2-icon-content {
              font-size: 2.3em !important;
            }
            .sstli-return-swal-title {
              font-size: 0.95rem !important;
              line-height: 1.2 !important;
              padding-top: 0.2em !important;
            }
            .sstli-return-swal-text {
              font-size: 0.68rem !important;
              line-height: 1.4 !important;
              padding: 0 0.75em !important;
            }
            .sstli-return-swal-actions {
              margin-top: 0.65em !important;
            }
            .sstli-return-swal-confirm,
            .sstli-return-swal-cancel {
              min-width: 76px !important;
              min-height: 31px !important;
              padding: 0.38rem 0.75rem !important;
              margin: 0 !important;
              font-size: 0.66rem !important;
              border-radius: 8px !important;
              font-weight: 900 !important;
            }
          }

          @media (max-width: 599px) {
            .sstli-return-swal {
              width: 82vw !important;
              max-width: 300px !important;
              border-radius: 12px !important;
            }
            .sstli-return-swal-icon {
              width: 3em !important;
              height: 3em !important;
              margin: 0.5em auto 0.2em !important;
            }
            .sstli-return-swal-icon .swal2-icon-content {
              font-size: 2em !important;
            }
            .sstli-return-swal-title {
              font-size: 0.8rem !important;
            }
            .sstli-return-swal-text {
              font-size: 0.57rem !important;
              padding: 0 0.5em !important;
            }
            .sstli-return-swal-confirm,
            .sstli-return-swal-cancel {
              min-width: 64px !important;
              min-height: 28px !important;
              padding: 0.32rem 0.55rem !important;
              font-size: 0.56rem !important;
            }
          }
        `}
      </style>

      <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isPhone}
      dir="rtl"
      sx={uiLayout.withUiSx({
        "& .MuiDialog-container": {
          pt: isPhone ? "58px" : isTablet ? "64px" : 1.5,
          px: isPhone ? 0 : isTablet ? 0.5 : 1.5,
          pb: isPhone ? 0 : isTablet ? 0.5 : 1.5,
          alignItems: isPhone ? "stretch" : "center"
        }
      }, uiLayout.dialogLayoutSx)}
      PaperProps={{
        sx: {
          width: isPhone ? "100vw" : isTablet ? "94vw" : undefined,
          maxWidth: isPhone ? "100vw" : isTablet ? "980px" : undefined,
          height: isPhone
            ? "calc(100dvh - 58px)"
            : isTablet
              ? "calc(100dvh - 72px)"
              : "86vh",
          maxHeight: isPhone
            ? "calc(100dvh - 58px)"
            : isTablet
              ? "calc(100dvh - 72px)"
              : "86vh",
          minHeight: 0,
          m: 0,
          borderRadius: isPhone ? 0 : isTablet ? 2 : 3,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column"
        }
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          gap: isCompact ? 0.35 : 1,
          color: primaryColor,
          fontWeight: 950,
          py: isPhone ? 0.55 : isTablet ? 0.75 : 1.5,
          px: isPhone ? 0.65 : isTablet ? 0.9 : 2,
          fontSize: isPhone ? "0.75rem" : isTablet ? "0.8rem" : undefined,
          flexShrink: 0
        }}
      >
        <ReplayIcon sx={{ fontSize: isPhone ? 16 : isTablet ? 19 : undefined }} />
        مرتجع استمارة تسجيل
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          p: isPhone ? 0.3 : isTablet ? 0.55 : 3,
          overflowY: "auto",
          flex: 1,
          minHeight: 0,

          "& .MuiInputLabel-root": {
            fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
          },
          "& .MuiInputBase-input, & .MuiSelect-select": {
            fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
            py: isPhone ? 0.52 : isTablet ? 0.67 : undefined
          },
          "& .MuiOutlinedInput-root": {
            minHeight: isPhone ? 31 : isTablet ? 35 : undefined,
            borderRadius: isCompact ? 1.25 : undefined
          },
          "& .MuiFormHelperText-root": {
            fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
          }
        }}
      >
        {error ? (
          <Alert
            severity="error"
            sx={{
              mb: isCompact ? 0.35 : 2,
              py: isCompact ? 0.15 : undefined,
              fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
            }}
          >
            {error}
          </Alert>
        ) : null}

        {loading ? (
          <Box sx={{ py: isPhone ? 3 : isTablet ? 4 : 10, textAlign: "center" }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={isPhone ? 0.45 : isTablet ? 0.65 : 2}>
            <Paper
              variant="outlined"
              sx={{
                p: isPhone ? 0.4 : isTablet ? 0.6 : 2,
                borderRadius: isCompact ? 1.4 : undefined
              }}
            >
              <Typography
                sx={{
                  mb: isCompact ? 0.35 : 1.5,
                  color: primaryColor,
                  fontWeight: 950,
                  textAlign: "center",
                  fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
                }}
              >
                بيانات الطالب
              </Typography>

              <Grid container spacing={isPhone ? 0.35 : isTablet ? 0.55 : 1.5}>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                    fullWidth
                    label="اسم الطالب"
                    value={studentName || ""}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>

                <Grid item xs={12} sm={3} md={4}>
                  <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                    fullWidth
                    label="رقم الهوية"
                    value={nationalId || ""}
                    InputProps={{ readOnly: true }}
                   inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
                </Grid>

                <Grid item xs={12} sm={3} md={4}>
                  <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                    fullWidth
                    label="رقم الجوال"
                    value={studentTel || ""}
                    InputProps={{ readOnly: true }}
                   inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
                </Grid>
              </Grid>
            </Paper>

            <Grid container spacing={isPhone ? 0.35 : isTablet ? 0.55 : 2}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField sx={uiLayout.formFieldSx}
                  fullWidth
                  type="datetime-local"
                  label="التاريخ"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                 inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <FormControl sx={uiLayout.formFieldSx} fullWidth disabled={loadingDocs}>
                  <InputLabel>نوع المستند</InputLabel>
                  <Select
                    value={selectedDocGuid}
                    label="نوع المستند"
                    onChange={(e) => setSelectedDocGuid(e.target.value)}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          maxHeight: isPhone ? 180 : isTablet ? 220 : 320,
                          mt: 0.25,
                          borderRadius: isCompact ? 1.2 : 2,
                          "& .MuiMenuItem-root": {
                            minHeight: isPhone ? 29 : isTablet ? 33 : 40,
                            py: isPhone ? 0.35 : isTablet ? 0.5 : 0.75,
                            px: isPhone ? 0.65 : isTablet ? 0.85 : 1.5,
                            fontSize: isPhone ? "0.5rem" : isTablet ? "0.58rem" : "0.875rem",
                            lineHeight: 1.2
                          }
                        }
                      }
                    }}
                  >
                    {documents.map((item) => (
                      <MenuItem key={item.guid} value={item.guid}>
                        {item.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={12} md={4}>
                <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                  fullWidth
                  label="مندوب البيع"
                  value={context?.salesManName || ""}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
            </Grid>

            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
              fullWidth
              multiline
              minRows={isPhone ? 2 : isTablet ? 2 : 3}
              label="ملاحظات"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <TableContainer
              component={Paper}
              variant="outlined"
              sx={uiLayout.withUiSx({
                borderRadius: isCompact ? 1.3 : undefined,
                overflowX: "auto",
                "& .MuiTableCell-root": {
                  py: isPhone ? 0.45 : isTablet ? 0.6 : undefined,
                  px: isPhone ? 0.35 : isTablet ? 0.55 : undefined,
                  fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
                  whiteSpace: "nowrap"
                },
                "& .MuiTableHead-root .MuiTableCell-root": {
                  fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
                  lineHeight: 1.1
                }
              }, uiLayout.tableContainerSx)}
            >
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f7d38a" }}>
                    <TableCell align="right" sx={{ fontWeight: 950 }}>
                      الدبلوم - الدورة
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: 950,
                        display: isPhone ? "none" : "table-cell"
                      }}
                    >
                      الوحدة
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 950 }}>
                      الكمية
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 950 }}>
                      التكلفة
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: 950,
                        display: isPhone ? "none" : "table-cell"
                      }}
                    >
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
                      <TableCell
                        align="center"
                        sx={{ display: isPhone ? "none" : "table-cell" }}
                      >
                        {item.unit || item.unit_ || "-"}
                      </TableCell>
                      <TableCell align="center">
                        {Number(item.qty || 0)}
                      </TableCell>
                      <TableCell align="center">{money(item.cost)}</TableCell>
                      <TableCell
                        align="center"
                        sx={{ display: isPhone ? "none" : "table-cell" }}
                      >
                        {money(item.tax)}
                      </TableCell>
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

            <Grid container spacing={isPhone ? 0.35 : isTablet ? 0.55 : 2}>
              <Grid item xs={4} sm={4} md={4}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: isPhone ? 0.45 : isTablet ? 0.65 : 2,
                    minHeight: isPhone ? 54 : isTablet ? 60 : undefined,
                    borderRadius: isCompact ? 1.3 : undefined,
                    textAlign: "center"
                  }}
                >
                  <Typography sx={{ fontWeight: 900, fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined }}>الإجمالي</Typography>
                  <Typography sx={{ color: "#d71920", fontSize: isPhone ? 14 : isTablet ? 17 : 25, fontWeight: 950 }}>
                    {money(totals.total)}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={4} sm={4} md={4}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: isPhone ? 0.45 : isTablet ? 0.65 : 2,
                    minHeight: isPhone ? 54 : isTablet ? 60 : undefined,
                    borderRadius: isCompact ? 1.3 : undefined,
                    textAlign: "center"
                  }}
                >
                  <Typography sx={{ fontWeight: 900, fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined }}>الضريبة</Typography>
                  <Typography sx={{ color: "#d71920", fontSize: isPhone ? 14 : isTablet ? 17 : 25, fontWeight: 950 }}>
                    {money(totals.tax)}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={4} sm={4} md={4}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: isPhone ? 0.45 : isTablet ? 0.65 : 2,
                    minHeight: isPhone ? 54 : isTablet ? 60 : undefined,
                    borderRadius: isCompact ? 1.3 : undefined,
                    textAlign: "center"
                  }}
                >
                  <Typography sx={{ fontWeight: 900, fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined }}>الصافي</Typography>
                  <Typography sx={{ color: "#d71920", fontSize: isPhone ? 14 : isTablet ? 17 : 25, fontWeight: 950 }}>
                    {money(totals.subTotal)}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Stack>
        )}
      </DialogContent>

      <DialogActions
        sx={uiLayout.withUiSx({
          px: isPhone ? 0.35 : isTablet ? 0.55 : 3,
          py: isPhone ? 0.28 : isTablet ? 0.42 : 2,
          gap: isCompact ? 0.35 : 1,
          flexShrink: 0
        }, uiLayout.dialogActionsSx)}
      >
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
          sx={uiLayout.withUiSx({
            backgroundColor: primaryColor,
            minWidth: isPhone ? 92 : isTablet ? 110 : 140,
            minHeight: isPhone ? 30 : isTablet ? 34 : undefined,
            px: isPhone ? 0.8 : isTablet ? 1.1 : undefined,
            fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
          }, uiLayout.buttonSx)}
        >
          حفظ
        </Button>

        <Button
          onClick={onClose}
          disabled={saving}
          sx={uiLayout.withUiSx({
            color: accentColor,
            fontWeight: 900,
            minHeight: isPhone ? 30 : isTablet ? 34 : undefined,
            px: isPhone ? 0.8 : isTablet ? 1.1 : undefined,
            fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
          }, uiLayout.buttonSx)}
        >
          إغلاق
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
}