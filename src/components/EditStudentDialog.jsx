import React, { useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import EditIcon from "@mui/icons-material/Edit";

import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const primaryColor = "#057546";
const accentColor = "#ae1e21";
const primaryLight = "#e6f3ee";

const emptyForm = {
  studentGuid: "",
  accountGuid: "",
  studentCode: "",
  acadmyId: "",
  accountCode: "",

  studentName: "",
  studentNameEn: "",
  studentTel: "",
  studentTel2: "",
  nationalId: "",
  birthDate: "",
  email: "",
  notes: "",

  studentType: 0,
  studentNational: 0,
  studyType: 0,
  customerType: 0,

  companyGuid: "",
  sectorName: "",
  sellerGuid: "",
  sellerName: "",
  actionReason: "",
  parentAccountName: "العملاء",
  isUse: true
};

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

const boolValue = (value, defaultValue = true) => {
  if (typeof value === "boolean") return value;
  if (value === 1 || value === "1" || value === "true" || value === "On") return true;
  if (value === 0 || value === "0" || value === "false" || value === "Off") return false;
  return defaultValue;
};

const numericValue = (value, defaultValue = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : defaultValue;
};

const normalizeDigits = (value) => {
  return String(value ?? "")
    .replace(/[٠-٩]/g, (digit) =>
      String("٠١٢٣٤٥٦٧٨٩".indexOf(digit))
    )
    .replace(/[۰-۹]/g, (digit) =>
      String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))
    )
    .trim();
};

const pad2 = (value) => {
  return String(value).padStart(2, "0");
};

const isValidGregorianDate = (year, month, day) => {
  const date = new Date(
    Date.UTC(year, month - 1, day)
  );

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const gregorianToIso = (year, month, day) => {
  if (!isValidGregorianDate(year, month, day)) {
    return "";
  }

  return `${year}-${pad2(month)}-${pad2(day)}`;
};

/*
 * تحويل التاريخ الهجري إلى ميلادي.
 * يستخدم التحويل الحسابي الإسلامي ويُرجع YYYY-MM-DD
 * المناسب لحقل input type="date".
 */
const hijriToGregorianIso = (
  hijriYear,
  hijriMonth,
  hijriDay
) => {
  const year = Number(hijriYear);
  const month = Number(hijriMonth);
  const day = Number(hijriDay);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    year < 1 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 30
  ) {
    return "";
  }

  const julianDay =
    day +
    Math.ceil(29.5 * (month - 1)) +
    (year - 1) * 354 +
    Math.floor((3 + 11 * year) / 30) +
    1948439 -
    1;

  let l = julianDay + 68569;
  const n = Math.floor((4 * l) / 146097);

  l =
    l -
    Math.floor((146097 * n + 3) / 4);

  const i = Math.floor(
    (4000 * (l + 1)) / 1461001
  );

  l =
    l -
    Math.floor((1461 * i) / 4) +
    31;

  const j = Math.floor(
    (80 * l) / 2447
  );

  const gregorianDay =
    l -
    Math.floor((2447 * j) / 80);

  l = Math.floor(j / 11);

  const gregorianMonth =
    j + 2 - 12 * l;

  const gregorianYear =
    100 * (n - 49) + i + l;

  return gregorianToIso(
    gregorianYear,
    gregorianMonth,
    gregorianDay
  );
};

/*
 * يجهز التاريخ القادم من الـ API للعرض والحفظ:
 * - ISO ميلادي: يظل كما هو.
 * - تاريخ ميلادي بشرطات أو /: يتحول إلى YYYY-MM-DD.
 * - تاريخ هجري مثل 04/03/1421: يتحول إلى الميلادي المقابل.
 */
const normalizeBirthDateToGregorian = (value) => {
  const rawValue = normalizeDigits(value);

  if (!rawValue) {
    return "";
  }

  const isoMatch = rawValue.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})/
  );

  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);

    if (year >= 1700) {
      return gregorianToIso(year, month, day);
    }

    return hijriToGregorianIso(
      year,
      month,
      day
    );
  }

  const separatedMatch = rawValue.match(
    /^(\d{1,4})[\/.\-](\d{1,2})[\/.\-](\d{1,4})$/
  );

  if (!separatedMatch) {
    return "";
  }

  const first = Number(separatedMatch[1]);
  const second = Number(separatedMatch[2]);
  const third = Number(separatedMatch[3]);

  /*
   * لو أول جزء 4 أرقام فهو سنة أولاً.
   * غير ذلك نعتبر الشكل يوم/شهر/سنة.
   */
  const year =
    separatedMatch[1].length === 4
      ? first
      : third;

  const month = second;

  const day =
    separatedMatch[1].length === 4
      ? third
      : first;

  if (year < 1700) {
    return hijriToGregorianIso(
      year,
      month,
      day
    );
  }

  return gregorianToIso(
    year,
    month,
    day
  );
};

const StudentField = ({ label, children }) => (
  <Box>
    <Typography
      sx={{
        mb: 0.7,
        color: primaryColor,
        fontSize: "0.8rem",
        fontWeight: 950
      }}
    >
      {label}
    </Typography>
    {children}
  </Box>
);

const EditStudentDialog = ({
  open,
  onClose,
  student,
  apiBaseUrl,
  onSaved
}) => {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [sectors, setSectors] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [lookupsLoading, setLookupsLoading] = useState(false);

  const canLoad = useMemo(() => {
    return Boolean(
      student?.studentCode ||
      student?.code ||
      student?.studentGuid ||
      student?.accountGuid ||
      student?.nationalId
    );
  }, [student]);

  const setField = (name, value) => {
    setForm((current) => ({
      ...current,
      [name]: value
    }));
  };

  useEffect(() => {
    if (!open || !canLoad) return undefined;

    const controller = new AbortController();

    const loadDetails = async () => {
      try {
        setLoading(true);
        setError("");
        setForm(emptyForm);

        const params = new URLSearchParams({
          code: student?.studentCode || student?.code || "",
          studentGuid: student?.studentGuid || "",
          accountGuid: student?.accountGuid || "",
          nationalId: student?.nationalId || ""
        });

        const response = await fetch(
          `${apiBaseUrl}/api/reception-office/students/details?${params.toString()}`,
          {
            signal: controller.signal
          }
        );

        const result = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            result?.message ||
            result?.error ||
            "تعذر تحميل بيانات الطالب"
          );
        }

        const data = result?.data || result || {};

        setForm({
          studentGuid: data.studentGuid || "",
          accountGuid: data.accountGuid || "",
          studentCode: data.studentCode || data.code || "",
          acadmyId: data.acadmyId || "",
          accountCode: data.accountCode || "",

          studentName: data.studentName || "",
          studentNameEn: data.studentNameEn || "",
          studentTel: data.studentTel || "",
          studentTel2: data.studentTel2 || "",
          nationalId: data.nationalId || "",
          /*
           * مهما كان التاريخ القادم من قاعدة البيانات
           * هجريًا أو ميلاديًا، يتم عرضه هنا بالميلادي.
           */
          birthDate: normalizeBirthDateToGregorian(
            data.birthDate
          ),
          email: data.email || "",
          notes: data.notes || "",

          studentType: numericValue(data.studentTypeValue, 0),
          studentNational: numericValue(data.studentNationalValue, 0),
          studyType: numericValue(data.studyTypeValue, 0),
          customerType: numericValue(data.customerTypeValue, 0),

          companyGuid: data.sectorGuid || "",
          sectorName: data.sectorName || data.companyName || "",
          sellerGuid: data.sellerGuid || "",
          sellerName: data.sellerName || "",
          actionReason: "",
          parentAccountName: data.parentAccountName || "العملاء",
          isUse: boolValue(data.isUse, true)
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "حدث خطأ أثناء تحميل بيانات الطالب");
        }
      } finally {
        setLoading(false);
      }
    };

    loadDetails();

    return () => controller.abort();
  }, [open, canLoad, student, apiBaseUrl]);

  useEffect(() => {
    if (!open) return undefined;

    const controller = new AbortController();

    const loadLookups = async () => {
      try {
        setLookupsLoading(true);

        const [sectorsResponse, sellersResponse] = await Promise.all([
          fetch(
            `${apiBaseUrl}/api/reception-office/lookups/sectors`,
            { signal: controller.signal }
          ),
          fetch(
            `${apiBaseUrl}/api/reception-office/lookups/sellers`,
            { signal: controller.signal }
          )
        ]);

        const sectorsResult = await sectorsResponse
          .json()
          .catch(() => null);

        const sellersResult = await sellersResponse
          .json()
          .catch(() => null);

        if (!sectorsResponse.ok) {
          throw new Error(
            sectorsResult?.message ||
            sectorsResult?.error ||
            "تعذر تحميل القطاعات"
          );
        }

        if (!sellersResponse.ok) {
          throw new Error(
            sellersResult?.message ||
            sellersResult?.error ||
            "تعذر تحميل مندوبي البيع"
          );
        }

        setSectors(
          Array.isArray(sectorsResult?.data)
            ? sectorsResult.data
            : []
        );

        setSellers(
          Array.isArray(sellersResult?.data)
            ? sellersResult.data
            : []
        );
      } catch (err) {
        if (err.name !== "AbortError") {
          await Swal.fire({
            icon: "error",
            title: "خطأ",
            text:
              err.message ||
              "حدث خطأ أثناء تحميل القوائم",
            confirmButtonText: "حسناً",
            confirmButtonColor: accentColor
          });
        }
      } finally {
        setLookupsLoading(false);
      }
    };

    loadLookups();

    return () => controller.abort();
  }, [open, apiBaseUrl]);

  const validate = () => {
    if (!form.studentName.trim()) return "برجاء إدخال اسم الطالب";

    if (!form.studentNameEn.trim()) {
      return "برجاء إدخال اسم الطالب باللغة الإنجليزية";
    }

    if (!/^[A-Za-z0-9 ]+$/.test(form.studentNameEn.trim())) {
      return "الاسم الإنجليزي يجب أن يحتوي على حروف إنجليزية وأرقام ومسافات فقط";
    }

    if (!form.studentTel.trim()) return "برجاء إدخال رقم الجوال";
    if (!form.nationalId.trim()) return "برجاء إدخال رقم الهوية";
    if (!form.email.trim()) return "برجاء إدخال البريد الإلكتروني";
    if (!form.companyGuid) return "برجاء تحديد القطاع التابع له الطالب";
    if (!form.sellerGuid) return "برجاء تحديد مندوب البيع";
    if (!form.actionReason.trim()) return "برجاء إدخال سبب التعديل";

    return "";
  };

  const handleSave = async () => {
    const validationMessage = validate();

    if (validationMessage) {
      await Swal.fire({
        icon: "warning",
        title: "تنبيه",
        text: validationMessage,
        confirmButtonText: "حسناً",
        confirmButtonColor: accentColor
      });
      return;
    }

    const userGuid = getUserGuid(getCurrentUser());

    if (!userGuid) {
      await Swal.fire({
        icon: "error",
        title: "خطأ",
        text: "تعذر قراءة المستخدم الحالي، برجاء تسجيل الدخول مرة أخرى",
        confirmButtonText: "حسناً",
        confirmButtonColor: accentColor
      });
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `${apiBaseUrl}/api/reception-office/students/update`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            studentGuid: form.studentGuid,
            accountGuid: form.accountGuid,
            userGuid,

            studentName: form.studentName.trim(),
            studentNameEn: form.studentNameEn.trim(),
            studentTel: form.studentTel.trim(),
            studentTel2: form.studentTel2.trim() || null,
            nationalId: form.nationalId.trim(),
            /*
             * لا نرسل أي تاريخ هجري للـ API.
             * القيمة المرسلة دائمًا ميلادية بصيغة YYYY-MM-DD.
             */
            birthDate:
              normalizeBirthDateToGregorian(
                form.birthDate
              ) || null,
            email: form.email.trim(),
            notes: form.notes.trim() || null,

            studentType: Number(form.studentType),
            studentNational: Number(form.studentNational),
            studyType: Number(form.studyType),
            customerType: Number(form.customerType),

            companyGuid: form.companyGuid,
            sellerGuid: form.sellerGuid || null,
            actionReason: form.actionReason.trim(),
            isUse: Boolean(form.isUse)
          })
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message ||
          result?.error ||
          "تعذر تعديل بيانات الطالب"
        );
      }

      await Swal.fire({
        icon: "success",
        title: "تم بنجاح",
        text: result?.message || "تم تعديل بيانات الطالب بنجاح",
        confirmButtonText: "حسناً",
        confirmButtonColor: primaryColor
      });

      onSaved?.();
      onClose?.();
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: "خطأ",
        text: err.message || "حدث خطأ أثناء تعديل بيانات الطالب",
        confirmButtonText: "حسناً",
        confirmButtonColor: accentColor
      });
    } finally {
      setSaving(false);
    }
  };

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 2.2,
      backgroundColor: "#fff",
      "& fieldset": {
        borderColor: primaryLight
      },
      "&:hover fieldset": {
        borderColor: primaryColor
      },
      "&.Mui-focused fieldset": {
        borderColor: primaryColor
      }
    },
    "& input": {
      textAlign: "left",
      fontWeight: 850
    }
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="lg"
      dir="rtl"
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden"
        }
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${primaryLight}`,
          backgroundColor: "#fff"
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <EditIcon sx={{ color: primaryColor }} />
          <Typography sx={{ fontWeight: 1000, fontSize: "1.15rem" }}>
            تعديل بيانات الطالب
          </Typography>
        </Box>

        <IconButton onClick={onClose} disabled={saving}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2.5, backgroundColor: "#fbfdfc" }}>
        {loading ? (
          <Box
            sx={{
              minHeight: 430,
              display: "flex",
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            <CircularProgress sx={{ color: primaryColor }} />
          </Box>
        ) : error ? (
          <Box
            sx={{
              minHeight: 300,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: accentColor,
              fontWeight: 950
            }}
          >
            {error}
          </Box>
        ) : (
          <Grid container spacing={1.6} sx={{ mt: 0.2 }}>
            <Grid item xs={12} md={3}>
              <StudentField label="كود الطالب">
                <TextField
                  fullWidth
                  size="small"
                  value={form.studentCode}
                  disabled
                  sx={fieldSx}
                />
              </StudentField>
            </Grid>

            <Grid item xs={12} md={3}>
              <StudentField label="الرقم الأكاديمي">
                <TextField
                  fullWidth
                  size="small"
                  value={form.acadmyId}
                  disabled
                  sx={fieldSx}
                />
              </StudentField>
            </Grid>

            <Grid item xs={12} md={3}>
              <StudentField label="رقم الحساب">
                <TextField
                  fullWidth
                  size="small"
                  value={form.accountCode}
                  disabled
                  sx={fieldSx}
                />
              </StudentField>
            </Grid>

            <Grid item xs={12} md={3}>
              <StudentField label="حالة الطالب">
                <Box
                  sx={{
                    height: 40,
                    px: 1.5,
                    display: "flex",
                    alignItems: "center",
                    border: `1px solid ${primaryLight}`,
                    borderRadius: 2.2,
                    backgroundColor: "#fff"
                  }}
                >
                  <FormControlLabel
                    control={
                      <Switch
                        checked={form.isUse}
                        onChange={(event) =>
                          setField("isUse", event.target.checked)
                        }
                        color="success"
                      />
                    }
                    label={form.isUse ? "نشط" : "موقوف"}
                    sx={{
                      m: 0,
                      "& .MuiFormControlLabel-label": {
                        fontWeight: 900
                      }
                    }}
                  />
                </Box>
              </StudentField>
            </Grid>

            <Grid item xs={12} md={6}>
              <StudentField label="اسم الطالب">
                <TextField
                  fullWidth
                  size="small"
                  value={form.studentName}
                  onChange={(event) =>
                    setField("studentName", event.target.value)
                  }
                  sx={fieldSx}
                />
              </StudentField>
            </Grid>

            <Grid item xs={12} md={6}>
              <StudentField label="الاسم باللغة الإنجليزية">
                <TextField
                  fullWidth
                  size="small"
                  value={form.studentNameEn}
                  onChange={(event) =>
                    setField(
                      "studentNameEn",
                      event.target.value.replace(/[^A-Za-z0-9 ]/g, "")
                    )
                  }
                  inputProps={{
                    dir: "ltr",
                    style: { textAlign: "left" }
                  }}
                  sx={fieldSx}
                />
              </StudentField>
            </Grid>

            <Grid item xs={12} md={3}>
              <StudentField label="رقم الجوال">
                <TextField
                  fullWidth
                  size="small"
                  value={form.studentTel}
                  onChange={(event) =>
                    setField(
                      "studentTel",
                      event.target.value.replace(/\D/g, "")
                    )
                  }
                  inputProps={{ maxLength: 20 }}
                  sx={fieldSx}
                />
              </StudentField>
            </Grid>

            <Grid item xs={12} md={3}>
              <StudentField label="رقم جوال آخر">
                <TextField
                  fullWidth
                  size="small"
                  value={form.studentTel2}
                  onChange={(event) =>
                    setField(
                      "studentTel2",
                      event.target.value.replace(/\D/g, "")
                    )
                  }
                  inputProps={{ maxLength: 20 }}
                  sx={fieldSx}
                />
              </StudentField>
            </Grid>

            <Grid item xs={12} md={3}>
              <StudentField label="رقم الهوية">
                <TextField
                  fullWidth
                  size="small"
                  value={form.nationalId}
                  onChange={(event) =>
                    setField(
                      "nationalId",
                      event.target.value.replace(/\D/g, "")
                    )
                  }
                  inputProps={{ maxLength: 20 }}
                  sx={fieldSx}
                />
              </StudentField>
            </Grid>

            <Grid item xs={12} md={3}>
              <StudentField label="تاريخ الميلاد">
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  value={form.birthDate}
                  onChange={(event) =>
                    setField(
                      "birthDate",
                      normalizeBirthDateToGregorian(
                        event.target.value
                      )
                    )
                  }
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    min: "1900-01-01",
                    max: new Date()
                      .toISOString()
                      .slice(0, 10)
                  }}
                  helperText="التاريخ يُعرض ويُحفظ بالميلادي"
                  FormHelperTextProps={{
                    sx: {
                      mr: 0,
                      color: primaryColor,
                      fontWeight: 800
                    }
                  }}
                  sx={fieldSx}
                />
              </StudentField>
            </Grid>

            <Grid item xs={12} md={6}>
              <StudentField label="البريد الإلكتروني">
                <TextField
                  fullWidth
                  size="small"
                  value={form.email}
                  onChange={(event) =>
                    setField("email", event.target.value)
                  }
                  inputProps={{
                    dir: "ltr",
                    style: { textAlign: "left" }
                  }}
                  sx={fieldSx}
                />
              </StudentField>
            </Grid>

            <Grid item xs={12} md={3}>
              <StudentField label="النوع">
                <FormControl fullWidth size="small">
                  <InputLabel>النوع</InputLabel>
                  <Select
                    value={form.studentType}
                    label="النوع"
                    onChange={(event) =>
                      setField("studentType", event.target.value)
                    }
                    sx={{ borderRadius: 2.2, backgroundColor: "#fff" }}
                  >
                    <MenuItem value={0}>ذكر</MenuItem>
                    <MenuItem value={1}>أنثى</MenuItem>
                  </Select>
                </FormControl>
              </StudentField>
            </Grid>

            <Grid item xs={12} md={3}>
              <StudentField label="الجنسية">
                <FormControl fullWidth size="small">
                  <InputLabel>الجنسية</InputLabel>
                  <Select
                    value={form.studentNational}
                    label="الجنسية"
                    onChange={(event) =>
                      setField("studentNational", event.target.value)
                    }
                    sx={{ borderRadius: 2.2, backgroundColor: "#fff" }}
                  >
                    <MenuItem value={0}>مواطن</MenuItem>
                    <MenuItem value={1}>أجنبي</MenuItem>
                  </Select>
                </FormControl>
              </StudentField>
            </Grid>

            <Grid item xs={12} md={4}>
              <StudentField label="نوع الدراسة">
                <FormControl fullWidth size="small">
                  <InputLabel>نوع الدراسة</InputLabel>
                  <Select
                    value={form.studyType}
                    label="نوع الدراسة"
                    onChange={(event) =>
                      setField("studyType", event.target.value)
                    }
                    sx={{ borderRadius: 2.2, backgroundColor: "#fff" }}
                  >
                    <MenuItem value={0}>حضوري</MenuItem>
                    <MenuItem value={1}>عن بعد</MenuItem>
                  </Select>
                </FormControl>
              </StudentField>
            </Grid>

            <Grid item xs={12} md={4}>
              <StudentField label="نوع العميل">
                <FormControl fullWidth size="small">
                  <InputLabel>نوع العميل</InputLabel>
                  <Select
                    value={form.customerType}
                    label="نوع العميل"
                    onChange={(event) =>
                      setField("customerType", event.target.value)
                    }
                    sx={{ borderRadius: 2.2, backgroundColor: "#fff" }}
                  >
                    <MenuItem value={0}>فرد</MenuItem>
                    <MenuItem value={1}>شركة</MenuItem>
                  </Select>
                </FormControl>
              </StudentField>
            </Grid>

            <Grid item xs={12} md={4}>
              <StudentField label="الحساب الرئيسي">
                <TextField
                  fullWidth
                  size="small"
                  value={form.parentAccountName}
                  disabled
                  sx={fieldSx}
                />
              </StudentField>
            </Grid>

            <Grid item xs={12} md={6}>
              <StudentField label="القطاع">
                <Autocomplete
                  options={sectors}
                  loading={lookupsLoading}
                  value={
                    sectors.find(
                      (item) => item.guid === form.companyGuid
                    ) ||
                    (form.companyGuid
                      ? {
                          guid: form.companyGuid,
                          name: form.sectorName
                        }
                      : null)
                  }
                  getOptionLabel={(option) => option?.name || ""}
                  isOptionEqualToValue={(option, value) =>
                    option?.guid === value?.guid
                  }
                  onChange={(_, value) => {
                    setField("companyGuid", value?.guid || "");
                    setField("sectorName", value?.name || "");
                  }}
                  noOptionsText="لا توجد قطاعات"
                  loadingText="جارٍ تحميل القطاعات..."
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      size="small"
                      placeholder="اختر القطاع"
                      sx={fieldSx}
                    />
                  )}
                />
              </StudentField>
            </Grid>

            <Grid item xs={12} md={6}>
              <StudentField label="مندوب البيع">
                <Autocomplete
                  options={sellers}
                  loading={lookupsLoading}
                  value={
                    sellers.find(
                      (item) => item.guid === form.sellerGuid
                    ) ||
                    (form.sellerGuid
                      ? {
                          guid: form.sellerGuid,
                          name: form.sellerName
                        }
                      : null)
                  }
                  getOptionLabel={(option) => option?.name || ""}
                  isOptionEqualToValue={(option, value) =>
                    option?.guid === value?.guid
                  }
                  onChange={(_, value) => {
                    setField("sellerGuid", value?.guid || "");
                    setField("sellerName", value?.name || "");
                  }}
                  noOptionsText="لا يوجد مندوبو بيع"
                  loadingText="جارٍ تحميل مندوبي البيع..."
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      size="small"
                      placeholder="اختر مندوب البيع"
                      sx={fieldSx}
                    />
                  )}
                />
              </StudentField>
            </Grid>

            <Grid item xs={12}>
              <StudentField label="سبب التعديل">
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  value={form.actionReason}
                  onChange={(event) =>
                    setField("actionReason", event.target.value)
                  }
                  placeholder="اكتب سبب تعديل بيانات الطالب"
                  sx={fieldSx}
                />
              </StudentField>
            </Grid>

            <Grid item xs={12}>
              <StudentField label="ملاحظات">
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  value={form.notes}
                  onChange={(event) =>
                    setField("notes", event.target.value)
                  }
                  sx={fieldSx}
                />
              </StudentField>
            </Grid>
          </Grid>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: 2.5,
          py: 1.5,
          borderTop: `1px solid ${primaryLight}`,
          justifyContent: "flex-start"
        }}
      >
        <Button
          variant="contained"
          startIcon={
            saving ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <SaveIcon />
            )
          }
          disabled={loading || saving || Boolean(error)}
          onClick={handleSave}
          sx={{
            minWidth: 125,
            fontWeight: 950,
            backgroundColor: primaryColor,
            direction: "ltr",
            "&:hover": {
              backgroundColor: "#034d31"
            }
          }}
        >
          حفظ التعديل
        </Button>

        <Button
          variant="outlined"
          color="error"
          disabled={saving}
          onClick={onClose}
          sx={{ minWidth: 100, fontWeight: 950 }}
        >
          إغلاق
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditStudentDialog;