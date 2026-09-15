import * as uiLayout from '../components/common/uiLayout';
import './rtl-forms-fix.css';
import { DESKTOP_BREAKPOINT, navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
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
  TextField,
  Typography,
  useMediaQuery
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import SearchIcon from "@mui/icons-material/Search";
import PercentIcon from "@mui/icons-material/Percent";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import Swal from "sweetalert2";




const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  "https://api4.sstli.com";



const primary = "#057546";
const primaryDark = "#034d31";
const border = "#dce8e2";
const soft = "#f7fbf9";

const TARGET_OPTIONS = [
  { value: 0, label: "مدني" },
  { value: 1, label: "عسكري" },
  { value: 2, label: "غير محدد" }
];

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
  value: 0,
  requiresAttachment: false,
  notes: "",
  isUse: true,
  forWhat: -1
});

function DiscountTypeLookupDialog({
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
          m: { xs: 0.7, sm: 2 },
          maxHeight: "92vh"
        }
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 900,
          fontSize: { xs: 15, sm: 20 },
          py: 1
        }}
      >
        قائمة أنواع الخصم
      </DialogTitle>

      <DialogContent
        dividers
        sx={{ p: { xs: 0.7, sm: 1.2 } }}
      >
        <TextField InputLabelProps={{ shrink: true }}
          autoFocus
          fullWidth
          size="small"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="بحث باسم الخصم..."
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
          <Box
            sx={{
              py: 4,
              textAlign: "center"
            }}
          >
            <CircularProgress size={26} />
          </Box>
        ) : (
          <Box
            sx={{
              display: "grid",
              gap: 0.45
            }}
          >
            {rows.map((row, index) => (
              <Paper
                key={`${row.guid || row.code}-${index}`}
                variant="outlined"
                onDoubleClick={() => onPick(row)}
                sx={{
                  px: { xs: 0.7, sm: 1 },
                  py: { xs: 0.55, sm: 0.7 },
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
                      sm: "70px minmax(0,1fr) 90px 90px 60px"
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
                      fontWeight: 800,
                      fontSize: 12
                    }}
                  >
                    {Number(row.value || 0).toLocaleString("en-US")}
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
                لا توجد أنواع خصم مطابقة.
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={uiLayout.dialogActionsSx}>
        <Button sx={uiLayout.buttonSx} onClick={onClose}>
          إغلاق
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function DiscountTypeManagement() {
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

        const result = await response
          .json()
          .catch(() => null);

        const allowed =
          response.ok &&
          result?.data?.file?.canView === true &&
          result?.data?.file?.screens?.addDiscountType === true;

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
        `${API_BASE_URL}/api/discount-type-management/bootstrap?userGuid=${encodeURIComponent(userGuid)}`,
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
          "تعذر تحميل شاشة أنواع الخصم"
        );
      }

      setOps({
        canView: Boolean(result?.data?.permissions?.canView),
        canAdd: Boolean(result?.data?.permissions?.canAdd),
        canEdit: Boolean(result?.data?.permissions?.canEdit),
        canFind: Boolean(result?.data?.permissions?.canFind)
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "تعذر التحميل",
        text:
          error?.message ||
          "تعذر تحميل شاشة أنواع الخصم"
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

  const newDiscountType = useCallback(() => {
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
        text: "لا توجد لديك صلاحية البحث عن نوع خصم."
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
          `${API_BASE_URL}/api/discount-type-management/list?${params.toString()}`,
          { cache: "no-store" }
        );

        const result = await response
          .json()
          .catch(() => null);

        if (!response.ok) {
          throw new Error(
            result?.message ||
            "تعذر تحميل قائمة أنواع الخصم"
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

  const loadDiscountType = useCallback(
    async (row) => {
      setLookupOpen(false);
      setLoading(true);

      try {
        const params = new URLSearchParams({
          userGuid
        });

        const response = await fetch(
          `${API_BASE_URL}/api/discount-type-management/${encodeURIComponent(row.code)}?${params.toString()}`,
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
            "تعذر تحميل بيانات نوع الخصم"
          );
        }

        const item = result?.data || {};

        setModel({
          guid: String(item.guid || ""),
          code: String(item.code || row.code || ""),
          name: String(item.name || ""),
          value: Number(item.value || 0),
          requiresAttachment: Boolean(item.requiresAttachment),
          notes: String(item.notes || ""),
          isUse: Boolean(item.isUse),
          forWhat:
            Number.isFinite(Number(item.forWhat))
              ? Number(item.forWhat)
              : -1
        });
      } catch (error) {
        await Swal.fire({
          icon: "error",
          title: "تعذر التحميل",
          text:
            error?.message ||
            "تعذر تحميل بيانات نوع الخصم"
        });
      } finally {
        setLoading(false);
      }
    },
    [userGuid]
  );

  const validate = useCallback(() => {
    if (!model.name.trim())
      return "برجاء إدخال اسم الخصم";

    if (
      model.value === "" ||
      model.value === null ||
      Number.isNaN(Number(model.value))
    )
      return "برجاء تحديد نسبة/قيمة الخصم أولاً";

    if (Number(model.value) < 0)
      return "نسبة/قيمة الخصم لا يمكن أن تكون أقل من صفر";

    if (
      Number(model.forWhat) < 0 ||
      Number(model.forWhat) > 2
    )
      return "برجاء تحديد المستهدف";

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
        text: "لا توجد لديك صلاحية إضافة نوع خصم."
      });
      return;
    }

    if (isEdit && !ops.canEdit) {
      await Swal.fire({
        icon: "error",
        title: "غير مسموح",
        text: "لا توجد لديك صلاحية تعديل نوع الخصم."
      });
      return;
    }

    let reason = "";

    if (isEdit) {
      const reasonResult = await Swal.fire({
        title: "سبب التعديل",
        input: "textarea",
        inputPlaceholder: "اكتب سبب تعديل نوع الخصم...",
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

      reason =
        String(reasonResult.value || "").trim();
    }

    const payload = {
      actorUserGuid: userGuid,
      reason,
      discountType: {
        guid: String(model.guid || ""),
        code: String(model.code || ""),
        name: model.name.trim(),
        value: Number(model.value || 0),
        requiresAttachment:
          Boolean(model.requiresAttachment),
        notes: model.notes.trim(),
        isUse: Boolean(model.isUse),
        forWhat: Number(model.forWhat)
      }
    };

    setSaving(true);

    try {
      const response = await fetch(
        isEdit
          ? `${API_BASE_URL}/api/discount-type-management/${encodeURIComponent(model.guid)}`
          : `${API_BASE_URL}/api/discount-type-management`,
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
          "تعذر حفظ نوع الخصم"
        );
      }

      const saved = result?.data || {};

      setModel((current) => ({
        ...current,
        guid: String(saved.guid || current.guid || ""),
        code: String(saved.code || current.code || ""),
        name: String(saved.name ?? current.name),
        value: Number(saved.value ?? current.value),
        requiresAttachment: Boolean(
          saved.requiresAttachment ??
          current.requiresAttachment
        ),
        notes: String(saved.notes ?? current.notes),
        isUse: Boolean(saved.isUse ?? current.isUse),
        forWhat:
          Number.isFinite(Number(saved.forWhat))
            ? Number(saved.forWhat)
            : current.forWhat
      }));

      await Swal.fire({
        icon: "success",
        title: isEdit
          ? "تم تعديل نوع الخصم"
          : "تم إضافة نوع الخصم",
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
          "تعذر حفظ نوع الخصم"
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
          لا توجد لديك صلاحية إضافة نوع خصم ضمن قائمة ملف.
        </Alert>
      </Box>
    );
  }

  const fieldSx = {
    "& .MuiInputBase-root": {
      minHeight: { xs: 33, sm: 38 }
    },
    "& .MuiInputBase-input": {
      fontSize: { xs: 10.5, sm: 13 },
      py: { xs: 0.45, sm: 0.7 }
    },
    "& .MuiInputLabel-root": {
      fontSize: { xs: 9.2, sm: 12 }
    }
  };

  const page = (
    <Box
      dir="rtl"
      sx={{
        minHeight: "100vh",
        bgcolor: soft,
        p: { xs: 0.35, sm: 0.8 },
        overflowX: "hidden"
      }}
    >
      <Paper
        elevation={0}
        sx={{
          border: `1px solid ${border}`,
          borderRadius: { xs: 1.1, sm: 2 },
          overflow: "hidden"
        }}
      >
        <Box
          sx={uiLayout.withUiSx({
            bgcolor: primaryDark,
            color: "#fff",
            px: { xs: 0.65, sm: 1.4 },
            py: { xs: 0.55, sm: 0.9 },
            display: "flex",
            alignItems: "center",
            gap: 0.55
          }, uiLayout.mobileHeaderSx)}
        >
          {!isDesktop && (
            <IconButton
              onClick={() =>
                setMobileSidebarOpen(true)
              }
              sx={{ color: "#fff", p: 0.3 }}
            >
              <MenuRoundedIcon />
            </IconButton>
          )}

          <PercentIcon />

          <Box
            sx={{
              flex: 1,
              minWidth: 0
            }}
          >
            <Typography
              sx={{
                fontWeight: 900,
                fontSize: { xs: 14.5, sm: 20 }
              }}
            >
              إضافة نوع خصم
            </Typography>

          </Box>

          <Chip
            label={
              isEdit
                ? `تعديل #${model.code}`
                : "نوع خصم جديد"
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
            p: { xs: 0.55, sm: 0.9 },
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
              gap: 0.45
            }, uiLayout.actionBarSx)}
          >
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={newDiscountType}
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
              py: 0.5,
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

        <Box sx={{ p: { xs: 0.55, sm: 1 } }}>
          <Box
            sx={uiLayout.withUiSx({
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2,minmax(0,1fr))",
                sm: "repeat(4,minmax(0,1fr))"
              },
              gap: { xs: 0.55, sm: 0.8 },
              "& .MuiTextField-root": fieldSx
            }, uiLayout.formSectionSx)}
          >
            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
              label="كود"
              size="small"
              value={model.code}
              InputProps={{ readOnly: true }}
             inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

            <TextField InputLabelProps={{ shrink: true }}
              label="اسم الخصم"
              size="small"
              value={model.name}
              onChange={(e) =>
                setField("name", e.target.value)
              }
              required
              sx={uiLayout.withUiSx({
                gridColumn: {
                  xs: "span 1",
                  sm: "span 2"
                }
              }, uiLayout.formFieldSx)}
            />

            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
              label="نسبة الخصم"
              type="number"
              size="small"
              value={model.value}
              onChange={(e) =>
                setField("value", e.target.value)
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
              label="المستهدف"
              size="small"
              value={model.forWhat}
              onChange={(e) =>
                setField(
                  "forWhat",
                  Number(e.target.value)
                )
              }
            >
              <MenuItem value={-1}>
                -- اختر --
              </MenuItem>

              {TARGET_OPTIONS.map((item) => (
                <MenuItem
                  key={item.value}
                  value={item.value}
                >
                  {item.label}
                </MenuItem>
              ))}
            </TextField>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                minHeight: 34,
                px: 0.2
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={model.isUse}
                    onChange={(e) =>
                      setField(
                        "isUse",
                        e.target.checked
                      )
                    }
                    size="small"
                  />
                }
                label={
                  <Typography
                    sx={{
                      fontSize: { xs: 12, sm: 12.5 },
                      fontWeight: 800
                    }}
                  >
                    نشط
                  </Typography>
                }
              />
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                minHeight: 34,
                px: 0.2,
                gridColumn: {
                  xs: "span 1",
                  sm: "span 2"
                }
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={model.requiresAttachment}
                    onChange={(e) =>
                      setField(
                        "requiresAttachment",
                        e.target.checked
                      )
                    }
                    size="small"
                  />
                }
                label={
                  <Typography
                    sx={{
                      fontSize: { xs: 12, sm: 12.5 },
                      fontWeight: 800
                    }}
                  >
                    يجب إدخال مرفقات
                  </Typography>
                }
              />
            </Box>

            <TextField InputLabelProps={{ shrink: true }}
              label="ملاحظات"
              multiline
              minRows={4}
              value={model.notes}
              onChange={(e) =>
                setField("notes", e.target.value)
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
            }><Box
      sx={{
        minHeight: "100vh",
        bgcolor: soft
      }}
    >
      {isDesktop ? (
        <>
          
          <Box
            sx={{
              ...navigationContentSx
            }}
          >
            {page}
          </Box>
        </>
      ) : (
        <>
          
          {page}
        </>
      )}

      <DiscountTypeLookupDialog
        open={lookupOpen}
        rows={lookupRows}
        loading={lookupLoading}
        q={lookupQ}
        setQ={setLookupQ}
        onClose={() => setLookupOpen(false)}
        onPick={loadDiscountType}
      />
    </Box></NavigationShell>
  );
}
