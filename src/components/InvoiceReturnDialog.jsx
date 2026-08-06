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
import ChangeCircleIcon from "@mui/icons-material/ChangeCircle";
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

const getUserGuid = (user) =>
  user?.userGuid ||
  user?.guid ||
  user?.Guid ||
  user?.USER_GUID ||
  user?.USER_GUID____ ||
  "";

const readValue = (object, ...keys) => {
  for (const key of keys) {
    const value = object?.[key];

    if (value !== undefined && value !== null && value !== "")
      return value;
  }

  return "";
};

const money = (value) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const warning = (text) =>
  Swal.fire({
    icon: "warning",
    title: "تنبيه",
    text,
    confirmButtonText: "حسناً",
    confirmButtonColor: accentColor
  });

export default function InvoiceReturnDialog({
  open,
  student,
  apiBaseUrl,
  onClose,
  onSaved
}) {
  const userGuid = useMemo(
    () => getUserGuid(getCurrentUser()),
    []
  );

  const studentName = readValue(
    student,
    "studentName",
    "StudentName"
  );

  const nationalId = readValue(
    student,
    "nationalId",
    "NationalId"
  );

  const studentTel = readValue(
    student,
    "studentTel",
    "StudentTel",
    "tel"
  );

  const accountGuid = readValue(
    student,
    "accountGuid",
    "AccountGuid"
  );

  const [invoices, setInvoices] = useState([]);
  const [selectedBillGuid, setSelectedBillGuid] = useState("");
  const [context, setContext] = useState(null);

  const [documents, setDocuments] = useState([]);
  const [selectedDocGuid, setSelectedDocGuid] = useState("");
  const [documentInfo, setDocumentInfo] = useState(null);

  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState("");

  const [returnDate, setReturnDate] = useState(
    new Date().toISOString().slice(0, 16)
  );

  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [loadingContext, setLoadingContext] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedInvoice = invoices.find(
    (item) => item.billGuid === selectedBillGuid
  );

  const totals = useMemo(() => {
    const total = items.reduce(
      (sum, item) =>
        sum +
        Number(item.quantity || 0) *
          Number(item.cost || 0),
      0
    );

    const tax = items.reduce(
      (sum, item) => sum + Number(item.tax || 0),
      0
    );

    return {
      total: Number(total.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      subTotal: Number((total + tax).toFixed(2))
    };
  }, [items]);

  const loadInvoices = async () => {
    if (!accountGuid || !userGuid) return;

    try {
      setLoadingInvoices(true);
      setError("");

      const params = new URLSearchParams({
        accountGuid,
        userGuid
      });

      const response = await fetch(
        `${apiBaseUrl}/api/invoice-returns/invoices?${params.toString()}`,
        { cache: "no-store" }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            "تعذر تحميل فواتير الطالب"
        );
      }

      const data = Array.isArray(result?.data)
        ? result.data
        : [];

      setInvoices(data);

      if (data.length === 0) {
        setError(
          result?.message ||
            "لا تتوفر فواتير خاصة بالطالب لعمل مرتجع"
        );
      }
    } catch (e) {
      setInvoices([]);
      setError(
        e.message ||
          "حدث خطأ أثناء تحميل فواتير الطالب"
      );
    } finally {
      setLoadingInvoices(false);
    }
  };

  const loadContext = async () => {
    if (!selectedInvoice || !userGuid) return;

    if (selectedInvoice.isReturned) {
      setContext(null);
      setItems([]);

      return warning(
        "تم عمل استرجاع للفاتورة بالفعل، ويمكن عرض المرتجع من كشف الحساب"
      );
    }

    try {
      setLoadingContext(true);
      setError("");
      setContext(null);
      setItems([]);
      setSelectedDocGuid("");
      setDocuments([]);

      const params = new URLSearchParams({
        billGuid: selectedInvoice.billGuid,
        billCode: selectedInvoice.code,
        userGuid
      });

      const response = await fetch(
        `${apiBaseUrl}/api/invoice-returns/context?${params.toString()}`,
        { cache: "no-store" }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            "تعذر تجهيز مرتجع الفاتورة"
        );
      }

      const data = result?.data || null;

      setContext(data);
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (e) {
      setError(
        e.message ||
          "حدث خطأ أثناء تجهيز مرتجع الفاتورة"
      );
    } finally {
      setLoadingContext(false);
    }
  };

  const loadDocuments = async () => {
    if (!context?.originalBranchGuid || !userGuid) return;

    try {
      setLoadingDocuments(true);
      setError("");

      const params = new URLSearchParams({
        userGuid,
        branchGuid: context.originalBranchGuid
      });

      const response = await fetch(
        `${apiBaseUrl}/api/invoice-returns/documents?${params.toString()}`,
        { cache: "no-store" }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            "تعذر تحميل دفاتر مرتجع الفاتورة"
        );
      }

      setDocuments(
        Array.isArray(result?.data)
          ? result.data
          : []
      );
    } catch (e) {
      setDocuments([]);
      setError(
        e.message ||
          "حدث خطأ أثناء تحميل دفاتر مرتجع الفاتورة"
      );
    } finally {
      setLoadingDocuments(false);
    }
  };

  useEffect(() => {
    if (!open) return;

    setInvoices([]);
    setSelectedBillGuid("");
    setContext(null);
    setDocuments([]);
    setSelectedDocGuid("");
    setDocumentInfo(null);
    setItems([]);
    setNotes("");
    setReturnDate(new Date().toISOString().slice(0, 16));
    setError("");

    loadInvoices();
  }, [open, accountGuid, userGuid]);

  useEffect(() => {
    if (!selectedBillGuid) return;
    loadContext();
  }, [selectedBillGuid]);

  useEffect(() => {
    if (!context?.originalBranchGuid) return;
    loadDocuments();
  }, [context?.originalBranchGuid]);

  useEffect(() => {
    loadDocumentInfo(selectedDocGuid);
  }, [selectedDocGuid]);


  const loadDocumentInfo = async (docGuid) => {
    if (!docGuid) {
      setDocumentInfo(null);
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${apiBaseUrl}/api/invoice-returns/document-info?docGuid=${encodeURIComponent(
          docGuid
        )}`,
        { cache: "no-store" }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            "تعذر قراءة بيانات دفتر مرتجع الفاتورة"
        );
      }

      setDocumentInfo(result?.data || null);
    } catch (e) {
      setDocumentInfo(null);
      setError(
        e.message ||
          "حدث خطأ أثناء قراءة بيانات دفتر مرتجع الفاتورة"
      );
    }
  };

  const updateItem = (index, field, value) => {
    setItems((currentItems) =>
      currentItems.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        const nextItem = {
          ...item,
          [field]: Math.abs(Number(value || 0))
        };

        if (
          field === "quantity" ||
          field === "cost" ||
          field === "taxRate"
        ) {
          let quantity = Number(nextItem.quantity || 0);

          if (quantity <= 0) quantity = 1;

          const cost = Number(nextItem.cost || 0);
          const taxRate = Number(nextItem.taxRate || 0);

          const beforeTax = Number(
            (quantity * cost).toFixed(2)
          );

          const tax = Number(
            (
              beforeTax *
              (taxRate / 100)
            ).toFixed(2)
          );

          nextItem.quantity = quantity;
          nextItem.tax = tax;
          nextItem.subTotal = Number(
            (beforeTax + tax).toFixed(2)
          );
        }

        return nextItem;
      })
    );
  };

  const save = async () => {
    if (!selectedInvoice) {
      return warning("برجاء اختيار الفاتورة المراد عمل مرتجع لها");
    }

    if (!selectedDocGuid) {
      return warning("برجاء اختيار نوع المستند");
    }

    if (!context?.salesManGuid) {
      return warning("برجاء اختيار محصل الفاتورة");
    }

    if (!notes.trim()) {
      return warning("لا يمكن حفظ مرتجع المبيعات بدون ملاحظات");
    }

    if (items.length === 0) {
      return warning("لا توجد بنود بالفاتورة المختارة");
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `${apiBaseUrl}/api/invoice-returns`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            userGuid,
            accountGuid,
            billGuid: selectedInvoice.billGuid,
            billCode: selectedInvoice.code,
            docGuid: selectedDocGuid,
            salesManGuid: context.salesManGuid,
            returnDate: new Date(returnDate).toISOString(),
            notes: notes.trim(),
            isUse: true,
            items: items.map((item) => ({
              diplomGuid: item.diplomGuid,
              unit: item.unit || "",
              quantity: Number(item.quantity || 0),
              cost: Number(item.cost || 0),
              taxRate: Number(item.taxRate || 0),
              tax: Number(item.tax || 0),
              subTotal: Number(item.subTotal || 0),
              diplomType: Number(item.diplomType || 0)
            }))
          })
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            "تعذر حفظ مرتجع الفاتورة"
        );
      }

      await Swal.fire({
        icon: "success",
        title: "تم الحفظ",
        text:
          result?.message ||
          "تم حفظ مرتجع المبيعات بنجاح",
        confirmButtonColor: primaryColor
      });

      onSaved?.(result);
    } catch (e) {
      setError(
        e.message ||
          "حدث خطأ أثناء حفظ مرتجع الفاتورة"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      maxWidth="xl"
      fullWidth
      dir="rtl"
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: "86vh"
        }
      }}
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
        <ChangeCircleIcon />
        مرتجع فاتورة
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}

        <Stack spacing={2}>
          <Paper variant="outlined" sx={{ p: 2 }}>
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
              <FormControl
                fullWidth
                disabled={loadingInvoices}
              >
                <InputLabel>الفاتورة المراد استرجاعها</InputLabel>

                <Select
                  value={selectedBillGuid}
                  label="الفاتورة المراد استرجاعها"
                  onChange={(event) =>
                    setSelectedBillGuid(event.target.value)
                  }
                >
                  {invoices.map((invoice) => (
                    <MenuItem
                      key={invoice.billGuid}
                      value={invoice.billGuid}
                      disabled={invoice.isReturned}
                    >
                      رقم {invoice.code} — {invoice.date} —{" "}
                      {invoice.documentType}
                      {invoice.isReturned
                        ? " — تم استرجاعها"
                        : ""}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="datetime-local"
                label="التاريخ"
                value={returnDate}
                onChange={(event) =>
                  setReturnDate(event.target.value)
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl
                fullWidth
                disabled={
                  loadingDocuments ||
                  !context?.originalBranchGuid
                }
              >
                <InputLabel>نوع المستند</InputLabel>

                <Select
                  value={selectedDocGuid}
                  label="نوع المستند"
                  onChange={(event) =>
                    setSelectedDocGuid(event.target.value)
                  }
                >
                  {documents.map((document) => (
                    <MenuItem
                      key={document.guid}
                      value={document.guid}
                    >
                      {document.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {loadingInvoices || loadingContext ? (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <CircularProgress />
            </Box>
          ) : null}

          {context ? (
            <>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="الفرع"
                    value={
                      documentInfo?.branchName ||
                      ""
                    }
                    InputProps={{ readOnly: true }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="المحصل"
                    value={context.salesManName || ""}
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
                onChange={(event) =>
                  setNotes(event.target.value)
                }
              />

              <TableContainer
                component={Paper}
                variant="outlined"
              >
                <Table size="small">
                  <TableHead>
                    <TableRow
                      sx={{ backgroundColor: "#f7d38a" }}
                    >
                      <TableCell
                        align="right"
                        sx={{ fontWeight: 950 }}
                      >
                        البيان
                      </TableCell>

                      <TableCell
                        align="center"
                        sx={{ fontWeight: 950 }}
                      >
                        الوحدة
                      </TableCell>

                      <TableCell
                        align="center"
                        sx={{ fontWeight: 950 }}
                      >
                        الكمية
                      </TableCell>

                      <TableCell
                        align="center"
                        sx={{ fontWeight: 950 }}
                      >
                        التكلفة
                      </TableCell>

                      <TableCell
                        align="center"
                        sx={{ fontWeight: 950 }}
                      >
                        الضريبة %
                      </TableCell>

                      <TableCell
                        align="center"
                        sx={{ fontWeight: 950 }}
                      >
                        الضريبة
                      </TableCell>

                      <TableCell
                        align="center"
                        sx={{ fontWeight: 950 }}
                      >
                        الصافي
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow
                        key={`${item.diplomGuid}-${index}`}
                      >
                        <TableCell
                          align="right"
                          sx={{ fontWeight: 850 }}
                        >
                          {item.name}
                        </TableCell>

                        <TableCell align="center">
                          {item.unit}
                        </TableCell>

                        <TableCell align="center">
                          <TextField
                            size="small"
                            type="number"
                            value={item.quantity}
                            onChange={(event) =>
                              updateItem(
                                index,
                                "quantity",
                                event.target.value
                              )
                            }
                            inputProps={{
                              min: 1,
                              step: 1,
                              style: {
                                textAlign: "center"
                              }
                            }}
                            sx={{ width: 95 }}
                          />
                        </TableCell>

                        <TableCell align="center">
                          <TextField
                            size="small"
                            type="number"
                            value={item.cost}
                            onChange={(event) =>
                              updateItem(
                                index,
                                "cost",
                                event.target.value
                              )
                            }
                            inputProps={{
                              min: 0,
                              step: "0.01",
                              style: {
                                textAlign: "center"
                              }
                            }}
                            sx={{ width: 120 }}
                          />
                        </TableCell>

                        <TableCell align="center">
                          <TextField
                            size="small"
                            type="number"
                            value={item.taxRate}
                            onChange={(event) =>
                              updateItem(
                                index,
                                "taxRate",
                                event.target.value
                              )
                            }
                            inputProps={{
                              min: 0,
                              step: "0.01",
                              style: {
                                textAlign: "center"
                              }
                            }}
                            sx={{ width: 100 }}
                          />
                        </TableCell>

                        <TableCell align="center">
                          {money(item.tax)}
                        </TableCell>

                        <TableCell
                          align="center"
                          sx={{ fontWeight: 900 }}
                        >
                          {money(item.subTotal)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      textAlign: "center"
                    }}
                  >
                    <Typography sx={{ fontWeight: 900 }}>
                      الإجمالي
                    </Typography>

                    <Typography
                      sx={{
                        color: "#d71920",
                        fontSize: 25,
                        fontWeight: 950
                      }}
                    >
                      {money(totals.total)}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      textAlign: "center"
                    }}
                  >
                    <Typography sx={{ fontWeight: 900 }}>
                      الضريبة
                    </Typography>

                    <Typography
                      sx={{
                        color: "#d71920",
                        fontSize: 25,
                        fontWeight: 950
                      }}
                    >
                      {money(totals.tax)}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      textAlign: "center"
                    }}
                  >
                    <Typography sx={{ fontWeight: 900 }}>
                      الصافي
                    </Typography>

                    <Typography
                      sx={{
                        color: "#d71920",
                        fontSize: 25,
                        fontWeight: 950
                      }}
                    >
                      {money(totals.subTotal)}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </>
          ) : null}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          variant="contained"
          onClick={save}
          disabled={
            saving ||
            loadingContext ||
            !context
          }
          startIcon={
            saving ? (
              <CircularProgress
                size={18}
                color="inherit"
              />
            ) : (
              <SaveIcon />
            )
          }
          sx={{
            backgroundColor: primaryColor,
            minWidth: 140
          }}
        >
          حفظ
        </Button>

        <Button
          onClick={onClose}
          disabled={saving}
          sx={{
            color: accentColor,
            fontWeight: 900
          }}
        >
          إغلاق
        </Button>
      </DialogActions>
    </Dialog>
  );
}