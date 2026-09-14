import * as uiLayout from '../components/common/uiLayout';
import './rtl-forms-fix.css';
import { DESKTOP_BREAKPOINT, navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Switch,
  TextField,
  Typography,
  useMediaQuery
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import SearchIcon from "@mui/icons-material/Search";
import MiscellaneousServicesIcon from "@mui/icons-material/MiscellaneousServices";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import Swal from "sweetalert2";




const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  "http://localhost:5258";



const primary = "#057546";
const primaryDark = "#034d31";
const border = "#dce8e2";
const soft = "#f7fbf9";

const fallbackOptions = {
  serviceTypes: [
    { value: 0, label: "دراسة" },
    { value: 1, label: "رسوم دراسية" },
    { value: 2, label: "رسوم إدارية" }
  ],
  departments: [
    { value: 0, label: "التقنية الادارية" },
    { value: 1, label: "القانون" },
    { value: 2, label: "الحاسب" },
    { value: 3, label: "إدارة السلامة" },
    { value: 4, label: "بدون" }
  ],
  studyTypes: [
    { value: 0, label: "دبلوم" },
    { value: 1, label: "دورة تأهلية" },
    { value: 2, label: "دورة تطويرية" },
    { value: 3, label: "بدون" }
  ],
  countTexts: [
    { value: "شهر", label: "شهر" },
    { value: "سنة", label: "سنة" },
    { value: "بدون", label: "بدون" }
  ],
  taxTypes: [
    { value: 0, label: "ضريبة القيمة المضافة" },
    { value: 1, label: "الضريبة الصفرية" },
    { value: 2, label: "الضريبة المعافاه" }
  ],
  beneficiaries: [
    { value: 0, label: "مواطن" },
    { value: 1, label: "أجنبي" },
    { value: 2, label: "الجميع" },
    { value: 3, label: "بدون" }
  ],
  studyNature: [
    { value: 0, label: "حضوري" },
    { value: 1, label: "اونلاين" },
    { value: 2, label: "بدون" }
  ]
};

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const currentUser = readUser();

const getUserGuid = () =>
  String(
    currentUser?.guid ||
    currentUser?.Guid ||
    currentUser?.userGuid ||
    currentUser?.UserGuid ||
    ""
  ).trim();

const emptyModel = () => ({
  guid: "",
  code: "",
  name: "",
  countNum: 0,
  countText: "بدون",
  description: "",
  isUse: true,
  serviceType: -1,
  unit: "Pcs",
  taxType: -1,
  taxValue: 0,
  studyType: -1,
  department: -1,
  beneficiary: -1,

  // نفس ComboBox1 في الديسكتوب.
  // يظهر للمستخدم لكنه لا يُحفظ لأن الديسكتوب نفسه لا يحفظه
  // ولا يوجد له عمود أو parameter في الإجراءات الحالية.
  studyNature: -1
});

function ServiceLookupDialog({
  open,
  rows,
  loading,
  q,
  setQ,
  onClose,
  onPick
}) {
  return (
    <Dialog sx={uiLayout.dialogLayoutSx}
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      dir="rtl"
      PaperProps={{
        sx: {
          borderRadius: { xs: 1.4, sm: 2.4 },
          m: { xs: 0.65, sm: 2 },
          maxHeight: "92vh"
        }
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 900,
          fontSize: { xs: 14.5, sm: 20 },
          py: 1
        }}
      >
        قائمة الخدمات
      </DialogTitle>

      <DialogContent dividers sx={{ p: { xs: 0.6, sm: 1.2 } }}>
        <TextField InputLabelProps={{ shrink: true }}
          autoFocus
          fullWidth
          size="small"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="بحث باسم الخدمة..."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
          sx={uiLayout.withUiSx({
            mb: 0.7,
            "& input": {
              fontSize: { xs: 12, sm: 13 }
            }
          }, uiLayout.formFieldSx)}
        />

        {loading ? (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <CircularProgress size={26} />
          </Box>
        ) : (
          <Box sx={{ display: "grid", gap: 0.45 }}>
            {rows.map((row, index) => (
              <Paper
                key={`${row.guid || row.code}-${index}`}
                variant="outlined"
                onDoubleClick={() => onPick(row)}
                sx={{
                  px: { xs: 0.65, sm: 1 },
                  py: { xs: 0.5, sm: 0.7 },
                  cursor: "pointer",
                  borderColor: border,
                  "&:hover": {
                    bgcolor: "#eef8f3",
                    borderColor: primary
                  }
                }}
              >
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "42px minmax(0,1fr) 46px",
                      sm: "70px minmax(0,1fr) 90px 60px"
                    },
                    alignItems: "center",
                    gap: 0.5
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 900,
                      fontSize: { xs: 12, sm: 12.5 }
                    }}
                  >
                    {row.code || "-"}
                  </Typography>

                  <Typography
                    noWrap
                    sx={{
                      fontWeight: 800,
                      fontSize: { xs: 12, sm: 13 }
                    }}
                  >
                    {row.name || "-"}
                  </Typography>

                  <Typography
                    sx={{
                      display: { xs: "none", sm: "block" },
                      fontWeight: 700,
                      fontSize: 12
                    }}
                  >
                    {row.status || "-"}
                  </Typography>

                  <Button
                    size="small"
                    onClick={() => onPick(row)}
                    sx={uiLayout.withUiSx({
                      minWidth: 0,
                      fontSize: { xs: 12, sm: 12 }
                    }, uiLayout.buttonSx)}
                  >
                    اختيار
                  </Button>
                </Box>
              </Paper>
            ))}

            {!rows.length && (
              <Alert severity="info">
                لا توجد خدمات مطابقة.
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={uiLayout.dialogActionsSx}>
        <Button sx={uiLayout.buttonSx} onClick={onClose}>إغلاق</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function ServiceManagement() {
  const isDesktop = useMediaQuery(
    `(min-width:${DESKTOP_BREAKPOINT}px)`,
    { noSsr: true }
  );

  const userGuid = useMemo(() => getUserGuid(), []);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [permissionLoading, setPermissionLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  const [ops, setOps] = useState({
    canView: false,
    canAdd: false,
    canEdit: false,
    canFind: false
  });

  const [options, setOptions] = useState(fallbackOptions);
  const [model, setModel] = useState(emptyModel());
  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupQ, setLookupQ] = useState("");
  const [lookupRows, setLookupRows] = useState([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(model.guid);

  const setField = useCallback(
    (field, value) =>
      setModel((current) => ({
        ...current,
        [field]: value
      })),
    []
  );

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        if (!userGuid) return;

        const response = await fetch(
          `${API_BASE_URL}/api/user-permissions/${encodeURIComponent(userGuid)}`,
          { cache: "no-store" }
        );

        const result = await response.json().catch(() => null);

        const allowed =
          response.ok &&
          result?.data?.file?.canView === true &&
          result?.data?.file?.screens?.addService === true;

        if (alive) {
          setAuthorized(Boolean(allowed));
        }
      } catch {
        if (alive) setAuthorized(false);
      } finally {
        if (alive) setPermissionLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [userGuid]);

  const loadBootstrap = useCallback(async () => {
    if (!authorized || !userGuid) return;

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/service-management/bootstrap?userGuid=${encodeURIComponent(userGuid)}`,
        { cache: "no-store" }
      );

      const raw = await response.text();

      let result = null;
      try {
        result = raw ? JSON.parse(raw) : null;
      } catch {
        result = null;
      }

      if (!response.ok) {
        throw new Error(
          [
            result?.message,
            result?.error,
            result?.detail
          ]
            .filter(Boolean)
            .join(" — ") ||
          raw ||
          "تعذر تحميل شاشة الخدمات"
        );
      }

      const data = result?.data || {};

      setOps({
        canView: Boolean(data?.permissions?.canView),
        canAdd: Boolean(data?.permissions?.canAdd),
        canEdit: Boolean(data?.permissions?.canEdit),
        canFind: Boolean(data?.permissions?.canFind)
      });

      setOptions({
        serviceTypes: data?.serviceTypes || fallbackOptions.serviceTypes,
        departments: data?.departments || fallbackOptions.departments,
        studyTypes: data?.studyTypes || fallbackOptions.studyTypes,
        countTexts: data?.countTexts || fallbackOptions.countTexts,
        taxTypes: data?.taxTypes || fallbackOptions.taxTypes,
        beneficiaries: data?.beneficiaries || fallbackOptions.beneficiaries,
        studyNature: data?.studyNature || fallbackOptions.studyNature
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "تعذر التحميل",
        text: error?.message || "تعذر تحميل شاشة الخدمات"
      });
    } finally {
      setLoading(false);
    }
  }, [authorized, userGuid]);

  useEffect(() => {
    if (authorized) {
      loadBootstrap();
    }
  }, [authorized, loadBootstrap]);

  const newService = useCallback(() => {
    setModel(emptyModel());
    setLookupQ("");
    setLookupRows([]);
    setLookupOpen(false);
  }, []);

  const openLookup = useCallback(() => {
    if (!ops.canFind) {
      Swal.fire({
        icon: "error",
        title: "غير مسموح",
        text: "لا توجد لديك صلاحية البحث عن الخدمات."
      });
      return;
    }

    setLookupQ("");
    setLookupRows([]);
    setLookupOpen(true);
  }, [ops.canFind]);

  useEffect(() => {
    if (!lookupOpen || !ops.canFind)
      return;

    const timer = setTimeout(async () => {
      setLookupLoading(true);

      try {
        const params = new URLSearchParams({
          userGuid,
          q: lookupQ || ""
        });

        const response = await fetch(
          `${API_BASE_URL}/api/service-management/list?${params.toString()}`,
          { cache: "no-store" }
        );

        const result = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            result?.message ||
            "تعذر تحميل قائمة الخدمات"
          );
        }

        setLookupRows(
          Array.isArray(result?.data)
            ? result.data
            : []
        );
      } catch {
        setLookupRows([]);
      } finally {
        setLookupLoading(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [
    lookupOpen,
    lookupQ,
    ops.canFind,
    userGuid
  ]);

  const loadService = useCallback(
    async (row) => {
      setLookupOpen(false);
      setLoading(true);

      try {
        const params = new URLSearchParams({
          userGuid
        });

        const response = await fetch(
          `${API_BASE_URL}/api/service-management/${encodeURIComponent(row.code)}?${params.toString()}`,
          { cache: "no-store" }
        );

        const raw = await response.text();

        let result = null;
        try {
          result = raw ? JSON.parse(raw) : null;
        } catch {
          result = null;
        }

        if (!response.ok) {
          throw new Error(
            [
              result?.message,
              result?.error,
              result?.detail
            ]
              .filter(Boolean)
              .join(" — ") ||
            raw ||
            "تعذر تحميل بيانات الخدمة"
          );
        }

        const item = result?.data || {};

        setModel({
          guid: String(item.guid || ""),
          code: String(item.code || row.code || ""),
          name: String(item.name || ""),
          countNum: Number(item.countNum || 0),
          countText: String(item.countText || "بدون"),
          description: String(item.description || ""),
          isUse: Boolean(item.isUse),
          serviceType:
            Number.isFinite(Number(item.serviceType))
              ? Number(item.serviceType)
              : -1,
          unit: String(item.unit || "Pcs"),
          taxType:
            Number.isFinite(Number(item.taxType))
              ? Number(item.taxType)
              : -1,
          taxValue: Number(item.taxValue || 0),
          studyType:
            Number.isFinite(Number(item.studyType))
              ? Number(item.studyType)
              : -1,
          department:
            Number.isFinite(Number(item.department))
              ? Number(item.department)
              : -1,
          beneficiary:
            Number.isFinite(Number(item.beneficiary))
              ? Number(item.beneficiary)
              : -1,

          // لأنه غير محفوظ في الديسكتوب الحالي.
          studyNature: -1
        });
      } catch (error) {
        await Swal.fire({
          icon: "error",
          title: "تعذر التحميل",
          text:
            error?.message ||
            "تعذر تحميل بيانات الخدمة"
        });
      } finally {
        setLoading(false);
      }
    },
    [userGuid]
  );

  const validate = useCallback(() => {
    if (!model.name.trim())
      return "برجاء إدخال اسم الخدمة";

    if (Number(model.serviceType) < 0)
      return "برجاء تحديد نوع الخدمة";

    if (Number(model.department) < 0)
      return "برجاء تحديد القسم التدريبي";

    if (Number(model.studyType) < 0)
      return "برجاء تحديد نوع الدراسة";

    if (Number(model.taxType) < 0)
      return "برجاء تحديد نوع الضريبة";

    if (Number(model.beneficiary) < 0)
      return "برجاء تحديد المستفيدين";

    return "";
  }, [model]);

  const save = useCallback(async () => {
    const error = validate();

    if (error) {
      await Swal.fire({
        icon: "warning",
        title: "راجع البيانات",
        text: error
      });
      return;
    }

    if (!isEdit && !ops.canAdd) {
      await Swal.fire({
        icon: "error",
        title: "غير مسموح",
        text: "لا توجد لديك صلاحية إضافة خدمة."
      });
      return;
    }

    if (isEdit && !ops.canEdit) {
      await Swal.fire({
        icon: "error",
        title: "غير مسموح",
        text: "لا توجد لديك صلاحية تعديل الخدمة."
      });
      return;
    }

    let reason = "";

    if (isEdit) {
      const reasonResult = await Swal.fire({
        title: "سبب التعديل",
        input: "textarea",
        inputPlaceholder: "اكتب سبب تعديل الخدمة...",
        showCancelButton: true,
        confirmButtonText: "حفظ التعديل",
        cancelButtonText: "رجوع",
        inputValidator: (value) =>
          !String(value || "").trim()
            ? "سبب التعديل مطلوب"
            : undefined
      });

      if (!reasonResult.isConfirmed)
        return;

      reason = String(reasonResult.value || "").trim();
    }

    const payload = {
      actorUserGuid: userGuid,
      reason,
      service: {
        guid: String(model.guid || ""),
        code: String(model.code || ""),
        name: model.name.trim(),
        countNum: Number(model.countNum || 0),
        countText: String(model.countText || "بدون"),
        description: model.description.trim(),
        isUse: Boolean(model.isUse),
        serviceType: Number(model.serviceType),
        unit: String(model.unit || "Pcs"),
        taxType: Number(model.taxType),
        taxValue: Number(model.taxValue || 0),
        studyType: Number(model.studyType),
        department: Number(model.department),
        beneficiary: Number(model.beneficiary),

        // يرسل للواجهة فقط؛ الباك لا يدخله في SP لأن الديسكتوب نفسه لا يحفظه.
        studyNature: Number(model.studyNature)
      }
    };

    setSaving(true);

    try {
      const response = await fetch(
        isEdit
          ? `${API_BASE_URL}/api/service-management/${encodeURIComponent(model.guid)}`
          : `${API_BASE_URL}/api/service-management`,
        {
          method: isEdit ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        }
      );

      const raw = await response.text();

      let result = null;
      try {
        result = raw ? JSON.parse(raw) : null;
      } catch {
        result = null;
      }

      if (!response.ok) {
        throw new Error(
          [
            result?.message,
            result?.error,
            result?.detail
          ]
            .filter(Boolean)
            .join(" — ") ||
          raw ||
          "تعذر حفظ الخدمة"
        );
      }

      const saved = result?.data || {};

      setModel((current) => ({
        ...current,
        guid: String(saved.guid || current.guid || ""),
        code: String(saved.code || current.code || ""),
        name: String(saved.name ?? current.name),
        countNum: Number(saved.countNum ?? current.countNum),
        countText: String(saved.countText ?? current.countText),
        description: String(saved.description ?? current.description),
        isUse: Boolean(saved.isUse ?? current.isUse),
        serviceType:
          Number.isFinite(Number(saved.serviceType))
            ? Number(saved.serviceType)
            : current.serviceType,
        unit: String(saved.unit ?? current.unit),
        taxType:
          Number.isFinite(Number(saved.taxType))
            ? Number(saved.taxType)
            : current.taxType,
        taxValue: Number(saved.taxValue ?? current.taxValue),
        studyType:
          Number.isFinite(Number(saved.studyType))
            ? Number(saved.studyType)
            : current.studyType,
        department:
          Number.isFinite(Number(saved.department))
            ? Number(saved.department)
            : current.department,
        beneficiary:
          Number.isFinite(Number(saved.beneficiary))
            ? Number(saved.beneficiary)
            : current.beneficiary,

        // نحافظ على اختيار المستخدم في الجلسة الحالية.
        studyNature: current.studyNature
      }));

      await Swal.fire({
        icon: "success",
        title: isEdit
          ? "تم تعديل الخدمة"
          : "تم إضافة الخدمة",
        text:
          result?.message ||
          "تمت العملية بنجاح"
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "تعذر الحفظ",
        text:
          error?.message ||
          "تعذر حفظ الخدمة"
      });
    } finally {
      setSaving(false);
    }
  }, [
    isEdit,
    model,
    ops,
    userGuid,
    validate
  ]);

  if (permissionLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center"
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!authorized) {
    return (
      <Box sx={{ p: 1 }}>
        <Alert severity="error">
          لا توجد لديك صلاحية إضافة الخدمات ضمن قائمة ملف.
        </Alert>
      </Box>
    );
  }

  const fieldSx = {
    "& .MuiInputBase-root": {
      minHeight: { xs: 32, sm: 38 }
    },
    "& .MuiInputBase-input": {
      fontSize: { xs: 10.1, sm: 13 },
      py: { xs: 0.4, sm: 0.7 }
    },
    "& .MuiInputLabel-root": {
      fontSize: { xs: 8.9, sm: 12 }
    },
    "& .MuiSelect-select": {
      fontSize: { xs: 10.1, sm: 13 },
      py: { xs: 0.4, sm: 0.7 }
    }
  };

  const selectItems = (items) =>
    items.map((item) => (
      <MenuItem
        key={`${item.value}-${item.label}`}
        value={item.value}
        sx={{
          fontSize: { xs: 12, sm: 13 },
          minHeight: { xs: 30, sm: 36 }
        }}
      >
        {item.label}
      </MenuItem>
    ));

  const page = (
    <Box
      dir="rtl"
      sx={{
        minHeight: "100vh",
        bgcolor: soft,
        p: { xs: 0.3, sm: 0.8 },
        overflowX: "hidden"
      }}
    >
      <Paper
        elevation={0}
        sx={{
          border: `1px solid ${border}`,
          borderRadius: { xs: 1, sm: 2 },
          overflow: "hidden"
        }}
      >
        <Box
          sx={{
            bgcolor: primaryDark,
            color: "#fff",
            px: { xs: 0.6, sm: 1.4 },
            py: { xs: 0.5, sm: 0.9 },
            display: "flex",
            alignItems: "center",
            gap: 0.5
          }}
        >
          {!isDesktop && (
            <IconButton
              onClick={() => setMobileSidebarOpen(true)}
              sx={{ color: "#fff", p: 0.25 }}
            >
              <MenuRoundedIcon />
            </IconButton>
          )}

          <MiscellaneousServicesIcon />

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontWeight: 900,
                fontSize: { xs: 14, sm: 20 }
              }}
            >
              إضافة نوع خدمة
            </Typography>

            <Typography
              sx={{
                opacity: 0.9,
                fontSize: { xs: 12, sm: 12 }
              }}
            >
              ملف — دبلوم أو دورة أو رسوم وخدمات
            </Typography>
          </Box>

          <Chip
            label={
              isEdit
                ? `تعديل #${model.code}`
                : "خدمة جديدة"
            }
            size="small"
            sx={{
              bgcolor: "#fff",
              color: primaryDark,
              fontWeight: 900,
              fontSize: { xs: 12, sm: 12 }
            }}
          />
        </Box>

        <Box
          sx={{
            p: { xs: 0.5, sm: 0.9 },
            borderBottom: `1px solid ${border}`
          }}
        >
          <Box
            sx={uiLayout.withUiSx({
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(3,minmax(0,1fr))",
                sm: "repeat(3,max-content)"
              },
              gap: 0.4
            }, uiLayout.actionBarSx)}
          >
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={newService}
              disabled={!ops.canAdd && !isEdit}
              sx={uiLayout.withUiSx({
                bgcolor: "#1976d2",
                fontWeight: 900,
                minWidth: 0,
                fontSize: { xs: 12, sm: 12.5 }
              }, uiLayout.buttonSx)}
            >
              جديد
            </Button>

            <Button
              variant="outlined"
              startIcon={<SearchIcon />}
              onClick={openLookup}
              disabled={!ops.canFind}
              sx={uiLayout.withUiSx({
                fontWeight: 900,
                minWidth: 0,
                fontSize: { xs: 12, sm: 12.5 }
              }, uiLayout.buttonSx)}
            >
              بحث
            </Button>

            <Button
              variant="contained"
              color="success"
              startIcon={
                saving
                  ? <CircularProgress size={14} color="inherit" />
                  : <SaveIcon />
              }
              onClick={save}
              disabled={
                saving ||
                loading ||
                (isEdit
                  ? !ops.canEdit
                  : !ops.canAdd)
              }
              sx={uiLayout.withUiSx({
                fontWeight: 900,
                minWidth: 0,
                fontSize: { xs: 12, sm: 12.5 }
              }, uiLayout.buttonSx)}
            >
              {isEdit ? "حفظ التعديل" : "حفظ"}
            </Button>
          </Box>
        </Box>

        {loading && (
          <Box
            sx={{
              px: 1,
              py: 0.45,
              display: "flex",
              gap: 0.5,
              alignItems: "center"
            }}
          >
            <CircularProgress size={15} />
            <Typography sx={{ fontSize: 12 }}>
              جاري التحميل...
            </Typography>
          </Box>
        )}

        <Box sx={{ p: { xs: 0.5, sm: 1 } }}>
          <Box
            sx={uiLayout.withUiSx({
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2,minmax(0,1fr))",
                sm: "repeat(4,minmax(0,1fr))"
              },
              gap: { xs: 0.5, sm: 0.8 },
              "& .MuiTextField-root": fieldSx
            }, uiLayout.formGridSx)}
          >
            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
              label="كود"
              size="small"
              value={model.code}
              InputProps={{ readOnly: true }}
             inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
              select
              label="نوع الخدمة"
              size="small"
              value={model.serviceType}
              onChange={(e) =>
                setField("serviceType", Number(e.target.value))
              }
            >
              <MenuItem value={-1}>-- اختر --</MenuItem>
              {selectItems(options.serviceTypes)}
            </TextField>

            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
              label="وحدة الخدمة"
              size="small"
              value={model.unit}
              onChange={(e) =>
                setField("unit", e.target.value)
              }
            />

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                minHeight: 32,
                px: 0.15
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={model.isUse}
                    onChange={(e) =>
                      setField("isUse", e.target.checked)
                    }
                    size="small"
                  />
                }
                label={
                  <Typography
                    sx={{
                      fontWeight: 800,
                      fontSize: { xs: 12, sm: 12.5 }
                    }}
                  >
                    نشط
                  </Typography>
                }
              />
            </Box>

            <TextField InputLabelProps={{ shrink: true }}
              label="اسم الخدمة"
              size="small"
              value={model.name}
              onChange={(e) =>
                setField("name", e.target.value)
              }
              required
              sx={uiLayout.withUiSx({
                gridColumn: {
                  xs: "1 / -1",
                  sm: "span 2"
                }
              }, uiLayout.formFieldSx)}
            />

            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
              select
              label="القسم التدريبي"
              size="small"
              value={model.department}
              onChange={(e) =>
                setField("department", Number(e.target.value))
              }
            >
              <MenuItem value={-1}>-- اختر --</MenuItem>
              {selectItems(options.departments)}
            </TextField>

            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
              select
              label="نوع الدراسة"
              size="small"
              value={model.studyType}
              onChange={(e) =>
                setField("studyType", Number(e.target.value))
              }
            >
              <MenuItem value={-1}>-- اختر --</MenuItem>
              {selectItems(options.studyTypes)}
            </TextField>

            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
              type="number"
              label="مدة الدراسة"
              size="small"
              value={model.countNum}
              onChange={(e) =>
                setField("countNum", e.target.value)
              }
              inputProps={{
                min: 0
              , dir: "ltr" , style: { direction: "ltr", unicodeBidi: "isolate" } }}
            />

            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
              select
              label="وحدة مدة الدراسة"
              size="small"
              value={model.countText}
              onChange={(e) =>
                setField("countText", e.target.value)
              }
            >
              {options.countTexts.map((item) => (
                <MenuItem
                  key={item.value}
                  value={item.value}
                >
                  {item.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
              select
              label="نوع الضريبة"
              size="small"
              value={model.taxType}
              onChange={(e) =>
                setField("taxType", Number(e.target.value))
              }
            >
              <MenuItem value={-1}>-- اختر --</MenuItem>
              {selectItems(options.taxTypes)}
            </TextField>

            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
              type="number"
              label="نسبة الضريبة"
              size="small"
              value={model.taxValue}
              onChange={(e) =>
                setField("taxValue", e.target.value)
              }
              inputProps={{
                min: 0,
                step: 0.01
              , dir: "ltr" , style: { direction: "ltr", unicodeBidi: "isolate" } }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    %
                  </InputAdornment>
                )
              }}
            />

            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
              select
              label="المستفيدين"
              size="small"
              value={model.beneficiary}
              onChange={(e) =>
                setField("beneficiary", Number(e.target.value))
              }
            >
              <MenuItem value={-1}>-- اختر --</MenuItem>
              {selectItems(options.beneficiaries)}
            </TextField>

            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
              select
              label="طبيعة الدراسة"
              size="small"
              value={model.studyNature}
              onChange={(e) =>
                setField("studyNature", Number(e.target.value))
              }
              FormHelperTextProps={{
                sx: {
                  fontSize: { xs: 7.7, sm: 9.5 },
                  m: 0.2,
                  lineHeight: 1.2
                }
              }}
            >
              <MenuItem value={-1}>-- اختر --</MenuItem>
              {selectItems(options.studyNature)}
            </TextField>

            <TextField InputLabelProps={{ shrink: true }}
              label="وصف الخدمة"
              multiline
              minRows={5}
              value={model.description}
              onChange={(e) =>
                setField("description", e.target.value)
              }
              sx={uiLayout.withUiSx({
                gridColumn: "1 / -1"
              }, uiLayout.formFieldSx)}
            />
          </Box>
        </Box>
      </Paper>
    </Box>
  );

  return (
    <NavigationShell variant="standard" mobileOpen={mobileSidebarOpen} onMobileClose={() =>
              setMobileSidebarOpen(false)
            }><Box sx={{ minHeight: "100vh", bgcolor: soft }}>
      {isDesktop ? (
        <>
          
          <Box sx={{
            ...navigationContentSx
          }}>
            {page}
          </Box>
        </>
      ) : (
        <>
          
          {page}
        </>
      )}

      <ServiceLookupDialog
        open={lookupOpen}
        rows={lookupRows}
        loading={lookupLoading}
        q={lookupQ}
        setQ={setLookupQ}
        onClose={() => setLookupOpen(false)}
        onPick={loadService}
      />
    </Box></NavigationShell>
  );
}
