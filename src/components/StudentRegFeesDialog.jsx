import React, { useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import RefreshIcon from "@mui/icons-material/Refresh";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import SearchIcon from "@mui/icons-material/Search";

import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const primaryColor = "#80b49e";
const primaryDark = "#5f947e";
const primaryLight = "#d8eee5";
const textColor = "#1f2d3d";
const softBg = "#f6faf8";

const showWarning = (message) => {
  return Swal.fire({
    icon: "warning",
    title: "تنبيه",
    text: message,
    confirmButtonText: "حسناً",
    confirmButtonColor: "#f57c00"
  });
};

const showError = (message) => {
  return Swal.fire({
    icon: "error",
    title: "خطأ",
    text: message,
    confirmButtonText: "حسناً",
    confirmButtonColor: "#d33"
  });
};

const showSuccess = (message) => {
  return Swal.fire({
    icon: "success",
    title: "تم بنجاح",
    text: message,
    confirmButtonText: "حسناً",
    confirmButtonColor: primaryColor
  });
};

const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const getUserGuid = (user) => {
  return (
    user?.userGuid ||
    user?.guid ||
    user?.Guid ||
    user?.USER_GUID ||
    user?.USER_GUID____ ||
    ""
  );
};

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") return 0;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const cleaned = String(value)
    .replace(/[^\d.-]/g, "")
    .trim();

  const number = Number(cleaned);
  return Number.isFinite(number) ? number : 0;
};

const round2 = (value) => {
  return Math.round((toNumber(value) + Number.EPSILON) * 100) / 100;
};

const formatMoney = (value) => {
  return round2(value).toLocaleString("ar-SA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const MoneyCell = ({ value }) => (
  <Typography
    sx={{
      width: "100%",
      fontWeight: 900,
      fontSize: "0.9rem",
      textAlign: "center",
      direction: "ltr",
      color: textColor
    }}
  >
    {formatMoney(value)}
  </Typography>
);

const getTodayLocalInputValue = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(
    now.getHours()
  )}:${pad(now.getMinutes())}`;
};

const getStudentValue = (student, ...keys) => {
  for (const key of keys) {
    if (student?.[key] !== undefined && student?.[key] !== null && student?.[key] !== "") {
      return student[key];
    }
  }

  return "";
};

const InfoCard = ({ label, value }) => (
  <Paper
    elevation={0}
    sx={{
      p: 1.2,
      borderRadius: 2,
      border: "1px solid #e4eeea",
      backgroundColor: "#fff",
      height: "100%"
    }}
  >
    <Typography sx={{ fontSize: "0.75rem", fontWeight: 900, color: "#6f8a81", mb: 0.4 }}>
      {label}
    </Typography>
    <Typography
      sx={{
        fontSize: "0.9rem",
        fontWeight: 900,
        color: textColor,
        wordBreak: "break-word"
      }}
    >
      {value || "-"}
    </Typography>
  </Paper>
);

const TotalBox = ({ label, value, color = textColor }) => (
  <Paper
    elevation={0}
    sx={{
      p: 1.2,
      borderRadius: 2,
      border: "1px solid #e4eeea",
      backgroundColor: "#fff",
      minWidth: 150
    }}
  >
    <Typography sx={{ fontSize: "0.75rem", fontWeight: 900, color: "#6f8a81", mb: 0.4 }}>
      {label}
    </Typography>
    <Typography sx={{ fontSize: "1rem", fontWeight: 1000, color, direction: "ltr" }}>
      {formatMoney(value)}
    </Typography>
  </Paper>
);

const StudentRegFeesDialog = ({
  open,
  onClose,
  student,
  apiBaseUrl = "https://api4.sstli.com",
  onSaved
}) => {
  const [loadingContext, setLoadingContext] = useState(false);
  const [saving, setSaving] = useState(false);

  const [context, setContext] = useState(null);

  const [docSearch, setDocSearch] = useState("");
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docInfo, setDocInfo] = useState(null);

  const [feesSearch, setFeesSearch] = useState("");
  const [feesLoading, setFeesLoading] = useState(false);
  const [availableFees, setAvailableFees] = useState([]);
  const [selectedFees, setSelectedFees] = useState([]);

  const [salesmenLoading, setSalesmenLoading] = useState(false);
  const [salesmen, setSalesmen] = useState([]);
  const [selectedSalesman, setSelectedSalesman] = useState(null);

  const [regDate, setRegDate] = useState(getTodayLocalInputValue());
  const [notes, setNotes] = useState("");

  const user = useMemo(() => getCurrentUser(), []);
  const userGuid = useMemo(() => getUserGuid(user), [user]);

  const studentName = getStudentValue(student, "studentName", "StudentName", "name");
  const nationalId = getStudentValue(student, "nationalId", "NationalId");
  const studentTel = getStudentValue(student, "studentTel", "tel", "StudentTel", "Tel");
  const accountGuid = getStudentValue(student, "accountGuid", "AccountGuid", "studentGuid");

  const totals = useMemo(() => {
    return selectedFees.reduce(
      (acc, item) => {
        acc.total += toNumber(item.cost);
        acc.tax += toNumber(item.tax);
        acc.subTotal += toNumber(item.subTotal);
        return acc;
      },
      { total: 0, tax: 0, subTotal: 0 }
    );
  }, [selectedFees]);

  const resetState = () => {
    setContext(null);

    setDocSearch("");
    setDocuments([]);
    setSelectedDoc(null);
    setDocInfo(null);

    setFeesSearch("");
    setAvailableFees([]);
    setSelectedFees([]);

    setSalesmen([]);
    setSelectedSalesman(null);

    setRegDate(getTodayLocalInputValue());
    setNotes("");
    setSaving(false);
  };

  const fetchJson = async (url, options = {}) => {
    const response = await fetch(url, options);
    const result = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(result?.message || result?.error || "حدث خطأ أثناء تنفيذ الطلب");
    }

    return result;
  };

  const loadContext = async () => {
    try {
      setLoadingContext(true);

      const result = await fetchJson(`${apiBaseUrl}/api/student-reg-fees/context`);

      setContext(result?.data || null);
    } catch (error) {
      showError(error.message || "حدث خطأ أثناء تجهيز استمارة الرسوم");
      onClose?.();
    } finally {
      setLoadingContext(false);
    }
  };

  const loadDocuments = async (searchValue = "") => {
    if (!context?.regFessTypeGuid) return;

    if (!userGuid) {
      showWarning("لا يمكن قراءة المستخدم الحالي، برجاء تسجيل الدخول مرة أخرى");
      return;
    }

    try {
      setDocumentsLoading(true);

      const params = new URLSearchParams({
        userGuid,
        docTypeGuid: context.regFessTypeGuid,
        search: searchValue || ""
      });

      const result = await fetchJson(
        `${apiBaseUrl}/api/student-reg-fees/documents?${params.toString()}`
      );

      const data = Array.isArray(result?.data) ? result.data : [];

      setDocuments(
        data.map((item, index) => ({
          ...item,
          id: item.docGuid || item.code || index + 1
        }))
      );
    } catch (error) {
      showError(error.message || "حدث خطأ أثناء تحميل أنواع المستندات");
      setDocuments([]);
    } finally {
      setDocumentsLoading(false);
    }
  };

  const loadDocumentInfo = async (doc) => {
    if (!doc?.code || !context?.regFessTypeGuid) return;

    try {
      setDocInfo(null);
      setAvailableFees([]);
      setSelectedFees([]);
      setSalesmen([]);
      setSelectedSalesman(null);

      const params = new URLSearchParams({
        docCode: doc.code,
        docTypeGuid: context.regFessTypeGuid
      });

      const result = await fetchJson(
        `${apiBaseUrl}/api/student-reg-fees/document-info?${params.toString()}`
      );

      const info = result?.data || null;

      setDocInfo(info);

      if (info?.priceListGuid && doc?.fessType !== undefined && doc?.fessType !== null) {
        await loadFees(info.priceListGuid, doc.fessType, feesSearch);
      }

      await loadSalesmen();
    } catch (error) {
      showError(error.message || "حدث خطأ أثناء تحميل بيانات نوع المستند");
      setDocInfo(null);
    }
  };

  const loadFees = async (priceListGuid, fessType, searchValue = "") => {
    if (!priceListGuid) return;

    try {
      setFeesLoading(true);

      const params = new URLSearchParams({
        priceListGuid,
        type: String(fessType ?? 0),
        search: searchValue || ""
      });

      const result = await fetchJson(
        `${apiBaseUrl}/api/student-reg-fees/fees?${params.toString()}`
      );

      const data = Array.isArray(result?.data) ? result.data : [];

      setAvailableFees(
        data.map((item, index) => ({
          ...item,
          id: item.feeGuid || item.code || index + 1,
          total: round2(item.total),
          tax: round2(item.tax),
          subTotal: round2(item.subTotal)
        }))
      );
    } catch (error) {
      showError(error.message || "حدث خطأ أثناء تحميل الرسوم");
      setAvailableFees([]);
    } finally {
      setFeesLoading(false);
    }
  };

 const loadSalesmen = async (searchValue = "") => {
  try {
    setSalesmenLoading(true);

    const params = new URLSearchParams();

    if (searchValue) {
      params.append("search", searchValue);
    }

    const url = params.toString()
      ? `${apiBaseUrl}/api/student-reg-fees/salesmen?${params.toString()}`
      : `${apiBaseUrl}/api/student-reg-fees/salesmen`;

    const result = await fetchJson(url);

    const data = Array.isArray(result?.data) ? result.data : [];

    setSalesmen(
      data.map((item, index) => ({
        ...item,
        id: item.salesManGuid || item.code || index + 1
      }))
    );
  } catch (error) {
    showError(error.message || "حدث خطأ أثناء تحميل مندوبي البيع");
    setSalesmen([]);
  } finally {
    setSalesmenLoading(false);
  }
};

  const handleSelectDoc = async (doc) => {
    setSelectedDoc(doc);

    if (!doc) {
      setDocInfo(null);
      setAvailableFees([]);
      setSelectedFees([]);
      setSalesmen([]);
      setSelectedSalesman(null);
      return;
    }

    await loadDocumentInfo(doc);
  };

  const handleSearchFees = async () => {
    if (!selectedDoc?.docGuid) {
      showWarning("برجاء اختيار نوع المستند أولاً");
      return;
    }

    if (!docInfo?.priceListGuid) {
      showWarning("لا يوجد قائمة أسعار مرتبطة بنوع المستند");
      return;
    }

    await loadFees(docInfo.priceListGuid, selectedDoc.fessType, feesSearch);
  };

  const buildSelectedFee = (fee) => {
    const totalFromPrice = round2(fee?.total);

    if (docInfo?.chkVat) {
      const cost = round2(totalFromPrice / 1.15);
      const tax = round2(totalFromPrice - cost);

      return {
        id: fee.feeGuid,
        feeGuid: fee.feeGuid,
        code: fee.code,
        feeName: fee.feeName,
        cost,
        tax,
        subTotal: totalFromPrice
      };
    }

    return {
      id: fee.feeGuid,
      feeGuid: fee.feeGuid,
      code: fee.code,
      feeName: fee.feeName,
      cost: round2(fee.total),
      tax: round2(fee.tax),
      subTotal: round2(fee.subTotal)
    };
  };

  const handleAddFee = (fee) => {
    if (!fee?.feeGuid) return;

    const exists = selectedFees.some(
      (item) => String(item.feeGuid).toLowerCase() === String(fee.feeGuid).toLowerCase()
    );

    if (exists) {
      showWarning("تم إدراج الرسوم مسبقاً");
      return;
    }

    setSelectedFees((prev) => [...prev, buildSelectedFee(fee)]);
  };

  const handleRemoveFee = (feeGuid) => {
    setSelectedFees((prev) =>
      prev.filter((item) => String(item.feeGuid).toLowerCase() !== String(feeGuid).toLowerCase())
    );
  };

  const validateBeforeSave = () => {
    if (!accountGuid) {
      showWarning("لا يمكن قراءة حساب الطالب");
      return false;
    }

    if (!selectedDoc?.docGuid) {
      showWarning("برجاء اختيار نوع المستند");
      return false;
    }

    if (!selectedSalesman?.salesManGuid) {
      showWarning("برجاء اختيار مندوب البيع");
      return false;
    }

    if (selectedFees.length === 0 || totals.subTotal <= 0) {
      showWarning("لا يمكن حفظ الاستمارة بدون اختيار الرسوم");
      return false;
    }

    if (!docInfo?.branchGuid) {
      showWarning("لا يمكن قراءة فرع المستند");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateBeforeSave()) return;

    const confirm = await Swal.fire({
      icon: "question",
      title: "تأكيد الحفظ",
      text: "هل تريد حفظ استمارة الرسوم؟",
      showCancelButton: true,
      confirmButtonText: "نعم، حفظ",
      cancelButtonText: "إلغاء",
      confirmButtonColor: primaryColor,
      cancelButtonColor: "#9e9e9e"
    });

    if (!confirm.isConfirmed) return;

    try {
      setSaving(true);

      const payload = {
        userGuid,
        accountGuid,

        docGuid: selectedDoc.docGuid,
        docCode: selectedDoc.code,
        docName: selectedDoc.docName,

        branchGuid: docInfo.branchGuid,
        salesManGuid: selectedSalesman.salesManGuid,

        regFessDate: regDate ? new Date(regDate).toISOString() : new Date().toISOString(),

        total: round2(totals.total),
        tax: round2(totals.tax),
        subTotal: round2(totals.subTotal),

        chkVat: Boolean(docInfo?.chkVat),

        notes,
        studentName,

        vatAccountGuid: docInfo?.vatAccountGuid || "",
        madenGuid: docInfo?.madenGuid || "",
        daenGuid: docInfo?.daenGuid || "",
        costCenterGuid: docInfo?.costCenterGuid || "",

        chkMaden: Boolean(docInfo?.chkMaden),
        chkDaen: Boolean(docInfo?.chkDaen),

        details: selectedFees.map((item) => ({
          feeGuid: item.feeGuid,
          cost: round2(item.cost),
          tax: round2(item.tax),
          subTotal: round2(item.subTotal)
        }))
      };

      const result = await fetchJson(`${apiBaseUrl}/api/student-reg-fees/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      await showSuccess(result?.message || "تم حفظ استمارة الرسوم بنجاح");
      onSaved?.(result?.data);
    } catch (error) {
      showError(error.message || "حدث خطأ أثناء حفظ استمارة الرسوم");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!open) return;

    resetState();
    loadContext();
  }, [open]);

  useEffect(() => {
    if (!open || !context?.regFessTypeGuid) return;

    loadDocuments("");
  }, [open, context?.regFessTypeGuid]);

  const availableFeesColumns = [
    {
      field: "actions",
      headerName: "",
      width: 65,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Tooltip title="إضافة الرسم">
          <IconButton
            size="small"
            onClick={() => handleAddFee(params.row)}
            sx={{
              color: primaryDark,
              backgroundColor: primaryLight,
              "&:hover": { backgroundColor: "#c8e5d8" }
            }}
          >
            <AddCircleIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )
    },
    {
      field: "code",
      headerName: "كود",
      width: 90,
      align: "center",
      headerAlign: "center"
    },
    {
      field: "feeName",
      headerName: "البيان",
      flex: 1,
      minWidth: 220,
      align: "left",
      headerAlign: "center"
    },
    {
      field: "total",
      headerName: "الصافي",
      width: 120,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => <MoneyCell value={params.row?.total} />
    }
  ];

  const selectedFeesColumns = [
    {
      field: "actions",
      headerName: "",
      width: 65,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Tooltip title="حذف">
          <IconButton
            size="small"
            onClick={() => handleRemoveFee(params.row.feeGuid)}
            sx={{
              color: "#d32f2f",
              backgroundColor: "#ffebee",
              "&:hover": { backgroundColor: "#ffcdd2" }
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )
    },
    {
      field: "code",
      headerName: "كود",
      width: 90,
      align: "center",
      headerAlign: "center"
    },
    {
      field: "feeName",
      headerName: "البيان",
      flex: 1,
      minWidth: 220,
      align: "left",
      headerAlign: "center"
    },
    {
      field: "cost",
      headerName: "الصافي",
      width: 110,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => <MoneyCell value={params.row?.cost} />
    },
    {
      field: "tax",
      headerName: "الضريبة",
      width: 110,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => <MoneyCell value={params.row?.tax} />
    },
    {
      field: "subTotal",
      headerName: "الإجمالي",
      width: 110,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => <MoneyCell value={params.row?.subTotal} />
    }
  ];

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="xl"
      PaperProps={{
        sx: {
          borderRadius: 3,
          direction: "ltr",
          height: { xs: "96vh", md: "92vh" }
        }
      }}
    >
      <DialogTitle
        sx={{
          p: 2,
          borderBottom: "1px solid #e5efea",
          backgroundColor: softBg
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
          <Stack direction="row" alignItems="center" gap={1}>
            <ReceiptLongIcon sx={{ color: primaryDark }} />
            <Box>
              <Typography sx={{ fontWeight: 1000, color: textColor }}>
                استمارة رسوم
              </Typography>
              <Typography sx={{ fontSize: "0.8rem", fontWeight: 800, color: "#6f8a81" }}>
                اختيار نوع المستند ثم الرسوم ثم مندوب البيع
              </Typography>
            </Box>
          </Stack>

          <IconButton disabled={saving} onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 2, backgroundColor: "#fbfdfc" }}>
        {loadingContext ? (
          <Box sx={{ py: 8, textAlign: "center" }}>
            <CircularProgress sx={{ color: primaryDark }} />
            <Typography sx={{ mt: 2, fontWeight: 900, color: textColor }}>
              جاري تجهيز استمارة الرسوم...
            </Typography>
          </Box>
        ) : (
          <Stack gap={2}>
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                borderRadius: 3,
                border: "1px solid #e1eee8",
                backgroundColor: "#fff"
              }}
            >
              <Grid container spacing={1.5}>
                <Grid item xs={12} md={3}>
                  <InfoCard label="اسم الطالب" value={studentName} />
                </Grid>

                <Grid item xs={12} md={3}>
                  <InfoCard label="رقم الهوية" value={nationalId} />
                </Grid>

                <Grid item xs={12} md={3}>
                  <InfoCard label="رقم الجوال" value={studentTel} />
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    type="datetime-local"
                    label="التاريخ"
                    value={regDate}
                    onChange={(e) => setRegDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                    sx={{
                      "& .MuiInputBase-input": {
                        fontWeight: 900,
                        direction: "ltr"
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                borderRadius: 3,
                border: "1px solid #e1eee8",
                backgroundColor: "#fff"
              }}
            >
              <Grid container spacing={1.5} alignItems="center">
                <Grid item xs={12} md={5}>
                  <Autocomplete
                    options={documents}
                    value={selectedDoc}
                    loading={documentsLoading}
                    onChange={(_, value) => handleSelectDoc(value)}
                    getOptionLabel={(option) =>
                      option ? `${option.code || ""} - ${option.docName || ""}` : ""
                    }
                    isOptionEqualToValue={(option, value) =>
                      String(option?.docGuid || "") === String(value?.docGuid || "")
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="نوع المستند"
                        placeholder="اختر نوع المستند"
                        size="small"
                        onChange={(e) => setDocSearch(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") loadDocuments(docSearch);
                        }}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {documentsLoading ? <CircularProgress size={18} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          )
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={1.2}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<SearchIcon />}
                    onClick={() => loadDocuments(docSearch)}
                    disabled={documentsLoading}
                    sx={{
                      height: 40,
                      borderRadius: 2,
                      fontWeight: 900,
                      color: primaryDark,
                      borderColor: primaryLight,
                      direction: "ltr"
                    }}
                  >
                    بحث
                  </Button>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Autocomplete
                    options={salesmen}
                    value={selectedSalesman}
                    loading={salesmenLoading}
                    disabled={!selectedDoc?.docGuid}
                    onChange={(_, value) => setSelectedSalesman(value)}
                    getOptionLabel={(option) => option?.salesManName || ""}
                    isOptionEqualToValue={(option, value) =>
                      String(option?.salesManGuid || "") === String(value?.salesManGuid || "")
                    }
                    renderInput={(params) => (
  <TextField
    {...params}
    label="مندوب البيع"
    placeholder="اختر مندوب البيع"
    size="small"
    onChange={(e) => loadSalesmen(e.target.value)}
    InputProps={{
      ...params.InputProps,
      startAdornment: (
        <>
          <PersonSearchIcon
            sx={{ color: primaryDark, mr: 0.5, fontSize: "1.2rem" }}
          />
          {params.InputProps.startAdornment}
        </>
      ),
      endAdornment: (
        <>
          {salesmenLoading ? <CircularProgress size={18} /> : null}
          {params.InputProps.endAdornment}
        </>
      )
    }}
  />
)}
                  />
                </Grid>

                <Grid item xs={12} md={1.8}>
                  <Stack direction="row" gap={1} justifyContent="flex-start">
                    <Chip
                      label={docInfo?.chkVat ? "ضريبة مفعلة" : "بدون ضريبة"}
                      sx={{
                        fontWeight: 900,
                        color: docInfo?.chkVat ? "#0b6b3a" : "#795548",
                        backgroundColor: docInfo?.chkVat ? "#e3f5ec" : "#fff4e5"
                      }}
                    />
                  </Stack>
                </Grid>

                {docInfo && (
                  <>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="الفرع"
                        value={docInfo?.branchName || ""}
                        InputProps={{ readOnly: true }}
                        sx={{
                          "& .MuiInputBase-input": {
                            fontWeight: 900,
                            color: textColor,
                            textAlign: "left"
                          }
                        }}
                      />
                    </Grid>

                    {/* <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="قائمة الأسعار"
                        value={docInfo?.priceListGuid || ""}
                        InputProps={{ readOnly: true }}
                        sx={{
                          "& .MuiInputBase-input": {
                            fontWeight: 900,
                            color: textColor,
                            direction: "ltr"
                          }
                        }}
                      />
                    </Grid> */}
                  </>
                )}
              </Grid>
            </Paper>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    borderRadius: 3,
                    border: "1px solid #e1eee8",
                    backgroundColor: "#fff",
                    height: "100%"
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography sx={{ fontWeight: 1000, color: textColor }}>
                      الرسوم المتاحة
                    </Typography>

                    <Stack direction="row" gap={1}>
                      <TextField
                        size="small"
                        placeholder="بحث في الرسوم"
                        value={feesSearch}
                        onChange={(e) => setFeesSearch(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSearchFees();
                        }}
                        sx={{ width: 210 }}
                      />

                      <Button
                        variant="outlined"
                        onClick={handleSearchFees}
                        disabled={feesLoading || !selectedDoc?.docGuid}
                        sx={{
                          borderRadius: 2,
                          fontWeight: 900,
                          color: primaryDark,
                          borderColor: primaryLight
                        }}
                      >
                        بحث
                      </Button>
                    </Stack>
                  </Stack>

                  <Box sx={{ height: 355 }}>
                    <DataGrid
                      rows={availableFees}
                      columns={availableFeesColumns}
                      loading={feesLoading}
                      disableRowSelectionOnClick
                      hideFooterSelectedRowCount
                      pageSizeOptions={[5, 10, 25]}
                      initialState={{
                        pagination: {
                          paginationModel: { pageSize: 5, page: 0 }
                        }
                      }}
                      sx={{
                        border: "1px solid #e4eeea",
                        borderRadius: 2,
                        direction: "ltr",
                        "& .MuiDataGrid-columnHeaders": {
                          backgroundColor: softBg,
                          fontWeight: 900
                        },
                        "& .MuiDataGrid-columnHeaderTitle": {
                          fontWeight: 1000
                        },
                        "& .MuiDataGrid-cell": {
                          fontWeight: 800
                        }
                      }}
                    />
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    borderRadius: 3,
                    border: "1px solid #e1eee8",
                    backgroundColor: "#fff",
                    height: "100%"
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography sx={{ fontWeight: 1000, color: textColor }}>
                      الرسوم المختارة
                    </Typography>

                    <Button
                      variant="outlined"
                      startIcon={<RefreshIcon />}
                      onClick={() => setSelectedFees([])}
                      disabled={selectedFees.length === 0}
                      sx={{
                        borderRadius: 2,
                        fontWeight: 900,
                        color: "#d32f2f",
                        borderColor: "#ffcdd2",
                        direction: "ltr"
                      }}
                    >
                      تفريغ
                    </Button>
                  </Stack>

                  <Box sx={{ height: 355 }}>
                    <DataGrid
                      rows={selectedFees}
                      columns={selectedFeesColumns}
                      disableRowSelectionOnClick
                      hideFooterSelectedRowCount
                      pageSizeOptions={[5, 10, 25]}
                      initialState={{
                        pagination: {
                          paginationModel: { pageSize: 5, page: 0 }
                        }
                      }}
                      sx={{
                        border: "1px solid #e4eeea",
                        borderRadius: 2,
                        direction: "ltr",
                        "& .MuiDataGrid-columnHeaders": {
                          backgroundColor: softBg,
                          fontWeight: 900
                        },
                        "& .MuiDataGrid-columnHeaderTitle": {
                          fontWeight: 1000
                        },
                        "& .MuiDataGrid-cell": {
                          fontWeight: 800
                        }
                      }}
                    />
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                borderRadius: 3,
                border: "1px solid #e1eee8",
                backgroundColor: "#fff"
              }}
            >
              <Grid container spacing={1.5}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    label="ملاحظات"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    gap={1}
                    justifyContent="flex-end"
                    alignItems="stretch"
                    sx={{ height: "100%" }}
                  >
                    <TotalBox label="الصافي" value={totals.total} />
                    <TotalBox label="الضريبة" value={totals.tax} color="#d32f2f" />
                    <TotalBox label="الإجمالي" value={totals.subTotal} color={primaryDark} />
                  </Stack>
                </Grid>
              </Grid>
            </Paper>
          </Stack>
        )}
      </DialogContent>

      <Divider />

      <DialogActions
        sx={{
          p: 2,
          backgroundColor: "#fff",
          justifyContent: "space-between",
          direction: "ltr"
        }}
      >
        <Button
          onClick={onClose}
          disabled={saving}
          variant="outlined"
          sx={{
            borderRadius: 2,
            fontWeight: 900,
            color: "#d32f2f",
            borderColor: "#ffcdd2"
          }}
        >
          إغلاق
        </Button>

        <Button
          onClick={handleSave}
          disabled={saving || loadingContext}
          variant="contained"
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
          sx={{
            borderRadius: 2,
            fontWeight: 1000,
            px: 4,
            backgroundColor: primaryColor,
            direction: "ltr",
            "&:hover": {
              backgroundColor: primaryDark
            }
          }}
        >
          {saving ? "جاري الحفظ..." : "حفظ"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StudentRegFeesDialog;