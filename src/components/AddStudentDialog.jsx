import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import Swal from "sweetalert2";

import dayjs from "dayjs";
import "dayjs/locale/en-gb";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

const API_BASE_URL = "http://localhost:5258";

const primaryColor = "#057546";
const primaryDark = "#034d31";
const primaryLight = "#e6f3ee";
const accentColor = "#ae1e21";
const whiteColor = "#fefefe";
const softBg = "#fefefe";
const textColor = "#1f2d3d";

const emptyForm = {
  acadmyId: "",
  parentGuid: "",
  parentCode: "",
  openAccountGuid: "",

  studentName: "",
  studentNameEn: "",
  birthDate: "",

  studentTel: "",
  studentTel2: "",
  nationalId: "",
  email: "",

  studentType: 0,
  studentNational: 0,
  studyType: 0,
  customerType: 0,

  companyGuid: "",
  companyName: "",

  sellerGuid: "",
  sellerName: "",

  isUse: true,
  noData: false,

  maden: 0,
  daen: 0,

  notes: ""
};

const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const showError = (message) => {
  return Swal.fire({
    icon: "error",
    title: "خطأ",
    text: message,
    confirmButtonText: "حسناً",
    confirmButtonColor: accentColor
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

const showWarning = (message) => {
  return Swal.fire({
    icon: "warning",
    title: "تنبيه",
    text: message,
    confirmButtonText: "حسناً",
    confirmButtonColor: accentColor
  });
};

const FieldLabel = ({ children }) => (
  <Typography
    sx={{
      fontWeight: 900,
      color: primaryColor,
      fontSize: "0.85rem",
      mb: 0.5,
      textAlign: "left"
    }}
  >
    {children}
  </Typography>
);

const inputSx = {
  backgroundColor: whiteColor,
  borderRadius: 2,
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    fontWeight: 900,
    "& fieldset": {
      borderColor: primaryLight
    },
    "&:hover fieldset": {
      borderColor: primaryColor
    },
    "&.Mui-focused fieldset": {
      borderColor: primaryColor,
      borderWidth: 2
    },
    "&.Mui-disabled fieldset": {
      borderColor: primaryLight
    }
  },
  "& .MuiInputBase-input": {
    fontWeight: 900
  },
  "& .MuiInputBase-input.Mui-disabled": {
    WebkitTextFillColor: textColor
  }
};

const selectSx = {
  ...inputSx,
  fontWeight: 900,
  textAlign: "left",
  "& .MuiSelect-select": {
    fontWeight: 900
  }
};

const isValidGregorianDate = (value) => {
  if (!value) return false;

  const date = dayjs(value, "YYYY-MM-DD", true);

  if (!date.isValid()) return false;

  const currentYear = dayjs().year();
  const year = date.year();

  if (year < 1900 || year > currentYear) return false;

  return true;
};

const AddStudentDialog = ({
  open,
  onClose,
  onCreated,
  initialData = null,
  permissionMode = "addStudent"
}) => {
  const [form, setForm] = useState(emptyForm);
  const [context, setContext] = useState(null);

  const [sectors, setSectors] = useState([]);
  const [sellers, setSellers] = useState([]);

  const [loadingContext, setLoadingContext] = useState(false);
  const [saving, setSaving] = useState(false);

  const birthDatePickerValue = useMemo(() => {
    if (!form.birthDate) return null;

    const date = dayjs(form.birthDate, "YYYY-MM-DD", true);

    return date.isValid() ? date : null;
  }, [form.birthDate]);

  const setValue = (name, value) => {
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const getSellerGuidFromLocalStorage = () => {
    const user = getCurrentUser();

    return (
      user?.sellerGuid ||
      user?.SellerGuid ||
      user?.sellerManGuid ||
      user?.sellermanGuid ||
      user?.SELLERMAN_GUID____ ||
      ""
    );
  };

  const getUserGuidFromLocalStorage = () => {
    const user = getCurrentUser();

    return (
      user?.guid ||
      user?.userGuid ||
      user?.UserGuid ||
      user?.USER_GUID____ ||
      ""
    );
  };

  const loadContext = async () => {
    try {
      setLoadingContext(true);

      const currentSellerGuid = getSellerGuidFromLocalStorage();

      const contextRes = await fetch(
        `${API_BASE_URL}/api/students/create-context?sellerGuid=${encodeURIComponent(
          currentSellerGuid
        )}`
      );

      const contextJson = await contextRes.json().catch(() => null);

      if (!contextRes.ok) {
        throw new Error(
          contextJson?.error ||
            contextJson?.message ||
            `فشل create-context - Status ${contextRes.status}`
        );
      }

      let sectorsJson = { data: [] };
      let sellersJson = { data: [] };

      try {
        const sectorsRes = await fetch(`${API_BASE_URL}/api/students/sectors`);
        sectorsJson = await sectorsRes.json().catch(() => ({ data: [] }));

        if (!sectorsRes.ok) {
          throw new Error(
            sectorsJson?.error || sectorsJson?.message || "فشل تحميل القطاعات"
          );
        }
      } catch (error) {
        console.error("Sectors loading error:", error);
        sectorsJson = { data: [] };
      }

      try {
        const sellersRes = await fetch(`${API_BASE_URL}/api/students/sellers`);
        sellersJson = await sellersRes.json().catch(() => ({ data: [] }));

        if (!sellersRes.ok) {
          throw new Error(
            sellersJson?.error || sellersJson?.message || "فشل تحميل مناديب البيع"
          );
        }
      } catch (error) {
        console.error("Sellers loading error:", error);
        sellersJson = { data: [] };
      }

      const apiSectors = Array.isArray(sectorsJson?.data) ? sectorsJson.data : [];
      const apiSellers = Array.isArray(sellersJson?.data) ? sellersJson.data : [];

      const finalSellers =
        contextJson?.sellerGuid && contextJson?.sellerName
          ? [
              {
                guid: contextJson.sellerGuid,
                name: contextJson.sellerName
              },
              ...apiSellers.filter((x) => x.guid !== contextJson.sellerGuid)
            ]
          : apiSellers;

      setContext(contextJson);
      setSectors(apiSectors);
      setSellers(finalSellers);

      setForm({
        ...emptyForm,

        parentGuid: contextJson?.parentGuid || "",
        parentCode: contextJson?.parentCode || "",
        openAccountGuid: contextJson?.openAccountGuid || "",

        sellerGuid: contextJson?.sellerGuid || "",
        sellerName: contextJson?.sellerName || "",

        studentName: initialData?.studentName || "",
        studentTel: initialData?.studentTel || initialData?.tel || "",
        nationalId: initialData?.nationalId || "",
        notes: initialData?.notes || "",
        maden: Number(initialData?.maden || 0),
        daen: Number(initialData?.daen || 0),
        noData: Boolean(initialData?.fromArchive),
        isUse: true
      });
    } catch (error) {
      console.error("AddStudentDialog loadContext error:", error);

      showError(error.message || "حدث خطأ أثناء تجهيز شاشة الطالب");

      setContext(null);
      setSectors([]);
      setSellers([]);

      setForm({
        ...emptyForm,
        birthDate: ""
      });
    } finally {
      setLoadingContext(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadContext();
    }
  }, [open, initialData]);

  const validate = () => {
    if (!form.studentName.trim()) return "برجاء إدخال اسم الطالب";

    if (!form.studentNameEn.trim()) return "برجاء إدخال الاسم باللغة الإنجليزية";

    if (!/^[A-Za-z0-9 ]+$/.test(form.studentNameEn.trim())) {
      return "الاسم باللغة الإنجليزية يجب أن يحتوي على حروف إنجليزية وأرقام ومسافات فقط";
    }

    if (!form.studentTel.trim()) return "برجاء إدخال رقم الجوال";

    if (!/^0\d{9}$/.test(form.studentTel.trim())) {
      return "رقم الجوال يجب أن يبدأ بـ 0 ويتكون من 10 أرقام";
    }

    if (form.studentTel2.trim()) {
      if (!/^0\d{9}$/.test(form.studentTel2.trim())) {
        return "رقم الجوال الآخر يجب أن يبدأ بـ 0 ويتكون من 10 أرقام";
      }

      if (form.studentTel.trim() === form.studentTel2.trim()) {
        return "رقمي الجوال متشابهين";
      }
    }

    if (!form.nationalId.trim()) return "برجاء إدخال رقم الهوية";
    if (!form.email.trim()) return "برجاء إدخال الإيميل الخاص بالطالب";

    if (!form.birthDate) return "برجاء اختيار تاريخ الميلاد الميلادي";

    if (!isValidGregorianDate(form.birthDate)) {
      return "تاريخ الميلاد يجب أن يكون ميلادي وبالصيغة الصحيحة YYYY-MM-DD";
    }

    if (!form.companyGuid) return "برجاء تحديد القطاع";
    if (!form.sellerGuid) return "برجاء تحديد مندوب البيع";

    if (
      !form.parentGuid ||
      form.parentGuid === "00000000-0000-0000-0000-000000000000"
    ) {
      return "لم يتم قراءة حساب الأب للعملاء من الإعدادات";
    }

    if (Number(form.customerType) === 0) {
      const id = form.nationalId.trim();

      if (!/^\d{10}$/.test(id)) {
        return "رقم الهوية للعميل الفرد يجب أن يكون 10 أرقام";
      }

      if (Number(form.studentNational) === 0 && !id.startsWith("1")) {
        return "رقم هوية المواطن يجب أن يبدأ بالرقم 1";
      }

      if (
        Number(form.studentNational) === 1 &&
        (id.startsWith("0") || id.startsWith("1"))
      ) {
        return "رقم هوية الأجنبي يجب ألا يبدأ بـ 0 أو 1";
      }
    }

    return "";
  };

  const checkNormalAddPermission = async () => {
    const userGuid = getUserGuidFromLocalStorage();

    if (!userGuid) {
      throw new Error(
        "تعذر قراءة بيانات المستخدم، برجاء تسجيل الدخول مرة أخرى"
      );
    }

    const params = new URLSearchParams({
      userGuid,
      formName: "addstudent",
      action: "save"
    });

    const response = await fetch(
      `${API_BASE_URL}/api/reception-office/permissions/check?${params.toString()}`,
      { cache: "no-store" }
    );

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        result?.message ||
        result?.error ||
        "تعذر فحص صلاحية إضافة الطالب"
      );
    }

    return {
      allowed: Boolean(result?.allowed),
      message:
        result?.message ||
        "لا تملك صلاحية إضافة طالب جديد"
    };
  };

  const checkAcceptOldStudentPermission = async () => {
    const userGuid = getUserGuidFromLocalStorage();

    if (!userGuid) {
      throw new Error(
        "تعذر قراءة بيانات المستخدم، برجاء تسجيل الدخول مرة أخرى"
      );
    }

    const params = new URLSearchParams({ userGuid });

    const response = await fetch(
      `${API_BASE_URL}/api/reception-office/permissions/accept-old-student?${params.toString()}`,
      { cache: "no-store" }
    );

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        result?.message ||
        result?.error ||
        "تعذر فحص صلاحية قبول الطالب من الأرشيف"
      );
    }

    return {
      allowed: Boolean(result?.allowed),
      message:
        result?.message ||
        "لا تملك صلاحية قبول طالب من الأرشيف برجاء التواصل مع الإدارة"
    };
  };

  const handleSave = async () => {
    const validationMessage = validate();

    if (validationMessage) {
      showWarning(validationMessage);
      return;
    }

    try {
      setSaving(true);

      // إعادة فحص الصلاحية وقت الحفظ.
      const permission =
        permissionMode === "acceptOldStudent" || initialData?.fromArchive
          ? await checkAcceptOldStudentPermission()
          : await checkNormalAddPermission();

      if (!permission.allowed) {
        await showWarning(permission.message);
        return;
      }

      const payload = {
        userGuid: getUserGuidFromLocalStorage(),

        operationType:
          permissionMode === "acceptOldStudent" || initialData?.fromArchive
            ? "acceptOldStudent"
            : "addStudent",
        fromArchive: Boolean(initialData?.fromArchive),
        oldCustomerNo: initialData?.oldCustomerNo || "",
        oldBranchCode: Number(initialData?.branchCode || 0),

        acadmyId: form.acadmyId,

        parentGuid: form.parentGuid,
        parentCode: form.parentCode,
        openAccountGuid: form.openAccountGuid,

        studentName: form.studentName.trim(),
        studentNameEn: form.studentNameEn.trim(),
        birthDate: form.birthDate,

        studentTel: form.studentTel.trim(),
        studentTel2: form.studentTel2.trim(),
        nationalId: form.nationalId.trim(),
        email: form.email.trim(),

        studentType: Number(form.studentType),
        studentNational: Number(form.studentNational),
        studyType: Number(form.studyType),
        customerType: Number(form.customerType),

        companyGuid: form.companyGuid,
        sellerGuid: form.sellerGuid,

        maden: Number(form.maden || 0),
        daen: Number(form.daen || 0),

        isUse: Boolean(form.isUse),
        noData: Boolean(form.noData),

        notes: form.notes || ""
      };

      const response = await fetch(`${API_BASE_URL}/api/students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || result?.message || "تعذر حفظ الطالب");
      }

      await showSuccess(result?.message || "تم حفظ بيانات الطالب بنجاح");

      onCreated?.(result?.data || result);
      onClose?.();
    } catch (error) {
      showError(error.message || "حدث خطأ أثناء حفظ الطالب");
    } finally {
      setSaving(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
      <Dialog
        open={open}
        onClose={() => !saving && onClose?.()}
        fullWidth
        maxWidth="lg"
        PaperProps={{
          sx: {
            borderRadius: 4,
            direction: "ltr",
            overflow: "hidden",
            border: `1px solid ${primaryLight}`,
            boxShadow: "0 18px 50px rgba(5,117,70,0.18)"
          }
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 950,
            color: whiteColor,
            borderBottom: `1px solid ${primaryDark}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: `linear-gradient(135deg, ${primaryColor}, ${primaryDark})`,
            py: 1.7,
            px: 2.5,
            letterSpacing: "0.2px"
          }}
        >
          {initialData?.fromArchive
            ? "قبول طالب من الأرشيف"
            : "بطاقة تسجيل طالب"}
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            background: `linear-gradient(180deg, ${softBg} 0%, #f4fbf7 100%)`
          }}
        >
          {loadingContext ? (
            <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
              <CircularProgress sx={{ color: primaryColor }} />
              <Typography sx={{ mt: 2, fontWeight: 900 }}>
                جاري تجهيز شاشة إضافة الطالب...
              </Typography>
            </Stack>
          ) : (
            <Box>
              {initialData?.fromArchive ? (
                <Paper
                  elevation={0}
                  sx={{
                    mb: 2,
                    p: 1.6,
                    borderRadius: 3,
                    border: "1px solid #ffcc80",
                    backgroundColor: "#fff8e1"
                  }}
                >
                  <Typography sx={{ fontWeight: 950, color: "#e65100" }}>
                    يتم نقل الطالب من الأرشيف القديم إلى النظام الجديد
                  </Typography>
                  <Typography sx={{ mt: 0.5, fontWeight: 800, color: textColor }}>
                    رقم العميل القديم: {initialData?.oldCustomerNo || "-"} — كود الفرع القديم: {initialData?.branchCode || "-"}
                  </Typography>
                  <Typography sx={{ mt: 0.4, fontWeight: 800, color: textColor }}>
                    الرصيد الافتتاحي: مدين {Number(initialData?.maden || 0).toLocaleString("en-US")} / دائن {Number(initialData?.daen || 0).toLocaleString("en-US")}
                  </Typography>
                </Paper>
              ) : null}

              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  border: `1px solid ${primaryLight}`,
                  backgroundColor: whiteColor,
                  boxShadow: "0 10px 30px rgba(5,117,70,0.08)"
                }}
              >
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <FieldLabel>كود</FieldLabel>
                    <TextField
                      fullWidth
                      size="small"
                      value={form.acadmyId}
                      placeholder="يتولد تلقائي"
                      disabled
                      sx={{
                        ...inputSx,
                        "& .MuiInputBase-input.Mui-disabled": {
                          WebkitTextFillColor: "#777",
                          fontWeight: 900,
                          cursor: "not-allowed"
                        }
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FieldLabel>اسم الطالب</FieldLabel>
                    <TextField
                      fullWidth
                      size="small"
                      value={form.studentName}
                      onChange={(e) => setValue("studentName", e.target.value)}
                      sx={inputSx}
                    />
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <FieldLabel>رقم الجوال</FieldLabel>
                    <TextField
                      fullWidth
                      size="small"
                      value={form.studentTel}
                      inputProps={{ maxLength: 10 }}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setValue("studentTel", value);
                      }}
                      sx={inputSx}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FieldLabel>الاسم بالإنجليزية</FieldLabel>
                    <TextField
                      fullWidth
                      size="small"
                      value={form.studentNameEn}
                      inputProps={{ dir: "ltr" }}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^A-Za-z0-9 ]/g, "");
                        setValue("studentNameEn", value);
                      }}
                      sx={inputSx}
                    />
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <FieldLabel>رقم جوال آخر</FieldLabel>
                    <TextField
                      fullWidth
                      size="small"
                      value={form.studentTel2}
                      inputProps={{ maxLength: 10 }}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setValue("studentTel2", value);
                      }}
                      sx={inputSx}
                    />
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <FieldLabel>رقم الهوية</FieldLabel>
                    <TextField
                      fullWidth
                      size="small"
                      value={form.nationalId}
                      inputProps={{ maxLength: 10 }}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setValue("nationalId", value);
                      }}
                      sx={inputSx}
                    />
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <FieldLabel>الجنسية</FieldLabel>
                    <FormControl fullWidth size="small">
                      <Select
                        value={form.studentNational}
                        sx={selectSx}
                        onChange={(e) => {
                          setValue("studentNational", e.target.value);
                          setValue("nationalId", "");
                        }}
                      >
                        <MenuItem value={0}>مواطن</MenuItem>
                        <MenuItem value={1}>أجنبي</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <FieldLabel>نوع العميل</FieldLabel>
                    <FormControl fullWidth size="small">
                      <Select
                        value={form.customerType}
                        sx={selectSx}
                        onChange={(e) => {
                          setValue("customerType", e.target.value);
                          setValue("nationalId", "");
                        }}
                      >
                        <MenuItem value={0}>فرد</MenuItem>
                        <MenuItem value={1}>شركة</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <FieldLabel>النوع</FieldLabel>
                    <FormControl fullWidth size="small">
                      <Select
                        value={form.studentType}
                        sx={selectSx}
                        onChange={(e) => setValue("studentType", e.target.value)}
                      >
                        <MenuItem value={0}>ذكر</MenuItem>
                        <MenuItem value={1}>أنثى</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <FieldLabel>تاريخ الميلاد ميلادي</FieldLabel>
                    <DatePicker
                      value={birthDatePickerValue}
                      format="YYYY-MM-DD"
                      views={["year", "month", "day"]}
                      minDate={dayjs("1900-01-01")}
                      maxDate={dayjs()}
                      onChange={(newValue) => {
                        if (!newValue || !dayjs(newValue).isValid()) {
                          setValue("birthDate", "");
                          return;
                        }

                        setValue("birthDate", dayjs(newValue).format("YYYY-MM-DD"));
                      }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: "small",
                          placeholder: "YYYY-MM-DD",
                          sx: {
                            ...inputSx,
                            "& input": {
                              direction: "ltr",
                              textAlign: "left",
                              fontWeight: 900
                            }
                          },
                          inputProps: {
                            dir: "ltr"
                          }
                        },
                        openPickerButton: {
                          sx: {
                            color: primaryColor
                          }
                        },
                        popper: {
                          sx: {
                            direction: "ltr",
                            zIndex: 99999
                          }
                        }
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FieldLabel>الإيميل</FieldLabel>
                    <TextField
                      fullWidth
                      size="small"
                      value={form.email}
                      inputProps={{ dir: "ltr" }}
                      onChange={(e) => setValue("email", e.target.value)}
                      sx={inputSx}
                    />
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <FieldLabel>نوع الدراسة</FieldLabel>
                    <FormControl fullWidth size="small">
                      <Select
                        value={form.studyType}
                        sx={selectSx}
                        onChange={(e) => setValue("studyType", e.target.value)}
                      >
                        <MenuItem value={0}>حضوري</MenuItem>
                        <MenuItem value={1}>عن بعد</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <FieldLabel>القطاع</FieldLabel>
                    <FormControl fullWidth size="small" error={!form.companyGuid}>
                      <Select
                        value={form.companyGuid}
                        displayEmpty
                        onChange={(e) => {
                          const selectedGuid = e.target.value;
                          const selectedSector = sectors.find(
                            (x) => x.guid === selectedGuid
                          );

                          setForm((prev) => ({
                            ...prev,
                            companyGuid: selectedGuid,
                            companyName: selectedSector?.name || ""
                          }));
                        }}
                        sx={selectSx}
                      >
                        <MenuItem value="">اختر القطاع</MenuItem>

                        {sectors.map((item) => (
                          <MenuItem key={item.guid} value={item.guid}>
                            {item.name}
                          </MenuItem>
                        ))}
                      </Select>

                      {!form.companyGuid && (
                        <Typography
                          sx={{
                            color: accentColor,
                            fontSize: "0.75rem",
                            mt: 0.5,
                            textAlign: "left"
                          }}
                        >
                          لم يتم اختيار القطاع بعد
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <FieldLabel>مندوب البيع</FieldLabel>
                    <FormControl fullWidth size="small" error={!form.sellerGuid}>
                      <Select
                        value={form.sellerGuid}
                        displayEmpty
                        onChange={(e) => {
                          const selectedGuid = e.target.value;
                          const selectedSeller = sellers.find(
                            (x) => x.guid === selectedGuid
                          );

                          setForm((prev) => ({
                            ...prev,
                            sellerGuid: selectedGuid,
                            sellerName: selectedSeller?.name || ""
                          }));
                        }}
                        sx={selectSx}
                      >
                        <MenuItem value="">اختر مندوب البيع</MenuItem>

                        {sellers.map((item) => (
                          <MenuItem key={item.guid} value={item.guid}>
                            {item.name}
                          </MenuItem>
                        ))}
                      </Select>

                      {!form.sellerGuid && (
                        <Typography
                          sx={{
                            color: accentColor,
                            fontSize: "0.75rem",
                            mt: 0.5,
                            textAlign: "left"
                          }}
                        >
                          لم يتم تحديد مندوب البيع
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <FieldLabel>الحساب الرئيسي</FieldLabel>
                    <TextField
                      fullWidth
                      size="small"
                      value={context?.parentName || "العملاء"}
                      disabled
                      sx={{
                        ...inputSx,
                        "& .MuiInputBase-input": {
                          color: accentColor,
                          fontWeight: 900,
                          WebkitTextFillColor: accentColor
                        }
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FieldLabel>ملاحظات</FieldLabel>
                    <TextField
                      fullWidth
                      multiline
                      minRows={4}
                      value={form.notes}
                      onChange={(e) => setValue("notes", e.target.value)}
                      sx={inputSx}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            p: 2,
            gap: 1,
            backgroundColor: whiteColor,
            borderTop: `1px solid ${primaryLight}`
          }}
        >
          <Button
            variant="outlined"
            startIcon={<CloseIcon />}
            onClick={onClose}
            disabled={saving}
            sx={{
              borderRadius: 2,
              fontWeight: 900,
              color: accentColor,
              borderColor: "#ffcdd2"
            }}
          >
            خروج
          </Button>

          <Button
            variant="contained"
            startIcon={
              saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />
            }
            onClick={handleSave}
            disabled={saving || loadingContext}
            sx={{
              borderRadius: 2,
              fontWeight: 900,
              background: `linear-gradient(135deg, ${primaryColor}, ${primaryDark})`,
              boxShadow: "0 8px 20px rgba(5,117,70,0.24)",
              "&:hover": {
                background: `linear-gradient(135deg, ${primaryDark}, ${primaryColor})`,
                boxShadow: "0 10px 24px rgba(5,117,70,0.30)"
              },
              "& .MuiButton-startIcon": {
                ml: 0.5,
                mr: 0
              }
            }}
          >
            حفظ
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default AddStudentDialog;