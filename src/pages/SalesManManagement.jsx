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
  Paper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import SaveIcon from "@mui/icons-material/Save";
import SearchIcon from "@mui/icons-material/Search";

import Swal from "sweetalert2";




const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  "https://api4.sstli.com";




const primary = "#057546";
const primaryDark = "#034d31";
const border = "#dce8e2";
const soft = "#f7fbf9";

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const getUserGuid = () => {
  const currentUser = readUser();
  return String(
    currentUser?.guid ||
    currentUser?.Guid ||
    currentUser?.userGuid ||
    currentUser?.UserGuid ||
    ""
  ).trim();
};

const norm = (value) =>
  String(value ?? "").trim().toLowerCase();

const emptyModel = () => ({
  guid: "",
  code: "",
  fullName: "",
  useName: "",
  isUse: true
});

function SalesManLookupDialog({
  open,
  rows,
  loading,
  search,
  setSearch,
  onClose,
  onPick
}) {
  return (
    <Dialog sx={uiLayout.dialogLayoutSx}
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      dir="rtl"
      PaperProps={{
        sx: {
          borderRadius: { xs: 1.5, sm: 2.5 },
          m: { xs: 1, sm: 2 },
          maxHeight: { xs: "92vh", sm: "82vh" }
        }
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 900,
          fontSize: { xs: 17, sm: 21 },
          py: { xs: 1, sm: 1.4 }
        }}
      >
        قائمة مناديب البيع
      </DialogTitle>

      <DialogContent
        dividers
        sx={{ p: { xs: 0.8, sm: 1.5 } }}
      >
        <TextField InputLabelProps={{ shrink: true }}
          autoFocus
          fullWidth
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث باسم المندوب..."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
          sx={uiLayout.withUiSx({
            mb: 0.7,
            "& .MuiInputBase-root": {
              minHeight: { xs: 34, sm: 38 }
            },
            "& input": {
              fontSize: { xs: 12, sm: 13 }
            }
          }, uiLayout.formFieldSx)}
        />

        {loading ? (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <Box sx={{ display: "grid", gap: 0.45 }}>
            {rows.map((row, index) => (
              <Paper
                key={row.guid || row.code || index}
                variant="outlined"
                onDoubleClick={() => onPick(row)}
                sx={{
                  px: { xs: 0.65, sm: 1 },
                  py: { xs: 0.45, sm: 0.65 },
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
                      xs: "46px minmax(0,1fr) 52px",
                      sm: "65px minmax(0,1fr) 75px 58px"
                    },
                    gap: { xs: 0.4, sm: 0.7 },
                    alignItems: "center"
                  }}
                >
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: { xs: 12, sm: 12 } }}
                    >
                      الكود
                    </Typography>
                    <Typography
                      sx={{
                        fontWeight: 900,
                        fontSize: { xs: 12, sm: 13 }
                      }}
                    >
                      {row.code || "-"}
                    </Typography>
                  </Box>

                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: { xs: 12, sm: 12 } }}
                    >
                      اسم المندوب
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
                  </Box>

                  <Box sx={{ display: { xs: "none", sm: "block" } }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: 12 }}
                    >
                      الحالة
                    </Typography>
                    <Typography
                      sx={{
                        fontWeight: 800,
                        fontSize: 12.5
                      }}
                    >
                      {row.status || "-"}
                    </Typography>
                  </Box>

                  <Button
                    size="small"
                    onClick={() => onPick(row)}
                    sx={uiLayout.withUiSx({
                      minWidth: 0,
                      px: 0.35,
                      fontSize: { xs: 12, sm: 12 }
                    }, uiLayout.buttonSx)}
                  >
                    اختيار
                  </Button>
                </Box>
              </Paper>
            ))}

            {!rows.length && (
              <Alert
                severity="info"
                sx={{
                  py: 0.4,
                  fontSize: { xs: 12, sm: 12 }
                }}
              >
                لا توجد نتائج.
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={uiLayout.withUiSx({ py: 0.5 }, uiLayout.dialogActionsSx)}>
        <Button
          onClick={onClose}
          sx={uiLayout.withUiSx({ fontSize: { xs: 12, sm: 13 } }, uiLayout.buttonSx)}
        >
          إغلاق
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function SalesManManagement() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(
    `(min-width:${DESKTOP_BREAKPOINT}px)`,
    { noSsr: true }
  );

  const userGuid = useMemo(() => getUserGuid(), []);

  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  const [permissionLoading, setPermissionLoading] =
    useState(true);

  const [authorized, setAuthorized] = useState(false);
  const [permissionError, setPermissionError] = useState("");

  const [ops, setOps] = useState({
    canView: false,
    canAdd: false,
    canEdit: false,
    canFind: false
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [model, setModel] = useState(emptyModel());

  const [branches, setBranches] = useState([]);
  const [selectedBranches, setSelectedBranches] =
    useState([]);

  const [branchSearch, setBranchSearch] = useState("");

  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupSearch, setLookupSearch] = useState("");
  const [lookupRows, setLookupRows] = useState([]);
  const [lookupLoading, setLookupLoading] = useState(false);

  const isEdit = Boolean(model.guid);

  const setField = useCallback((field, value) => {
    setModel((current) => ({
      ...current,
      [field]: value
    }));
  }, []);

  // ============================================================
  // Sidebar / global view permission - Fail Closed
  // ============================================================
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

        if (!response.ok) {
          throw new Error(result?.message || "تعذر التحقق من الصلاحيات. يرجى إعادة تحميل الصفحة والمحاولة مرة أخرى.");
        }

        const allowed =
          response.ok &&
          result?.data?.file?.canView === true &&
          result?.data?.file?.screens?.addSalesMan === true;

        if (alive) {
          setAuthorized(Boolean(allowed));
        }
      } catch (error) {
        if (alive) {
          setAuthorized(false);
          setPermissionError(error?.message || "تعذر الاتصال بخدمة الصلاحيات. يرجى إعادة المحاولة.");
        }
      } finally {
        if (alive) setPermissionLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [userGuid]);

  // ============================================================
  // Bootstrap = LoadBranch + operation permissions
  // ============================================================
  const loadBootstrap = useCallback(async () => {
    if (!authorized || !userGuid) return;

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/salesman-management/bootstrap?userGuid=${encodeURIComponent(userGuid)}`,
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
          "تعذر تحميل شاشة مندوب البيع"
        );
      }

      setBranches(
        Array.isArray(result?.data?.branches)
          ? result.data.branches
          : []
      );

      setOps({
        canView: Boolean(result?.data?.permissions?.canView),
        canAdd: Boolean(result?.data?.permissions?.canAdd),
        canEdit: Boolean(result?.data?.permissions?.canEdit),
        canFind: Boolean(result?.data?.permissions?.canFind)
      });
    } catch (e) {
      await Swal.fire({
        icon: "error",
        title: "تعذر التحميل",
        text:
          e?.message ||
          "تعذر تحميل شاشة مندوب البيع"
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

  const newSalesMan = useCallback(() => {
    setModel(emptyModel());
    setSelectedBranches([]);
    setBranchSearch("");
  }, []);

  // ============================================================
  // Branch dual list
  // ============================================================
  const selectedGuidSet =
    useMemo(
      () =>
        new Set(
          selectedBranches.map((item) =>
            norm(item.guid)
          )
        ),
      [selectedBranches]
    );

  const availableBranches =
    useMemo(() => {
      const q = norm(branchSearch);

      return branches.filter((branch) => {
        if (selectedGuidSet.has(norm(branch.guid)))
          return false;

        if (!q) return true;

        return (
          norm(branch.name).includes(q) ||
          norm(branch.code).includes(q)
        );
      });
    }, [branches, selectedGuidSet, branchSearch]);

  const addBranch = useCallback((branch) => {
    setSelectedBranches((current) => {
      if (
        current.some(
          (item) =>
            norm(item.guid) === norm(branch.guid)
        )
      ) {
        Swal.fire({
          icon: "warning",
          title: "تم اختيار الفرع مسبقًا",
          timer: 1200,
          showConfirmButton: false
        });
        return current;
      }

      return [...current, branch];
    });
  }, []);

  const removeBranch = useCallback((guid) => {
    setSelectedBranches((current) =>
      current.filter(
        (item) =>
          norm(item.guid) !== norm(guid)
      )
    );
  }, []);

  // ============================================================
  // Find / SalesManList
  // ============================================================
  useEffect(() => {
    if (!lookupOpen || !ops.canFind) return;

    const timer = setTimeout(async () => {
      setLookupLoading(true);

      try {
        const params = new URLSearchParams({
          userGuid,
          q: lookupSearch || ""
        });

        const response = await fetch(
          `${API_BASE_URL}/api/salesman-management/salesmen?${params}`,
          { cache: "no-store" }
        );

        const result = await response
          .json()
          .catch(() => null);

        if (!response.ok) {
          throw new Error(
            result?.message ||
            "تعذر تحميل قائمة مناديب البيع"
          );
        }

        setLookupRows(
          Array.isArray(result?.data)
            ? result.data
            : []
        );
      } catch (e) {
        setLookupRows([]);
      } finally {
        setLookupLoading(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [
    lookupOpen,
    lookupSearch,
    ops.canFind,
    userGuid
  ]);

  const loadSalesMan = useCallback(
    async (code) => {
      setLookupOpen(false);
      setLoading(true);

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/salesman-management/salesmen/${encodeURIComponent(code)}?userGuid=${encodeURIComponent(userGuid)}`,
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
            "تعذر تحميل بيانات مندوب البيع"
          );
        }

        setModel({
          guid: String(result?.data?.salesMan?.guid || ""),
          code: String(result?.data?.salesMan?.code || code || ""),
          fullName: String(result?.data?.salesMan?.fullName || ""),
          useName: String(result?.data?.salesMan?.useName || ""),
          isUse: Boolean(result?.data?.salesMan?.isUse)
        });

        setSelectedBranches(
          Array.isArray(result?.data?.branches)
            ? result.data.branches
            : []
        );
      } catch (e) {
        await Swal.fire({
          icon: "error",
          title: "تعذر التحميل",
          text:
            e?.message ||
            "تعذر تحميل بيانات مندوب البيع"
        });
      } finally {
        setLoading(false);
      }
    },
    [userGuid]
  );

  // ============================================================
  // Validation + Save / Update
  // ============================================================
  const validate = useCallback(() => {
    if (!model.fullName.trim()) {
      return "برجاء إدخال اسم المندوب";
    }

    if (!model.useName.trim()) {
      return "برجاء إدخال الاسم المختصر للمندوب";
    }

    if (!selectedBranches.length) {
      return "برجاء اختيار الفروع المسموح للمندوب التسجيل فيها";
    }

    return "";
  }, [model, selectedBranches]);

  const save = useCallback(async () => {
    const validation = validate();

    if (validation) {
      await Swal.fire({
        icon: "warning",
        title: "راجع البيانات",
        text: validation
      });
      return;
    }

    if (!isEdit && !ops.canAdd) {
      await Swal.fire({
        icon: "error",
        title: "غير مسموح",
        text: "لا توجد لديك صلاحية إضافة مندوب بيع."
      });
      return;
    }

    if (isEdit && !ops.canEdit) {
      await Swal.fire({
        icon: "error",
        title: "غير مسموح",
        text: "لا توجد لديك صلاحية تعديل مندوب بيع."
      });
      return;
    }

    let reason = "";

    if (isEdit) {
      const reasonResult = await Swal.fire({
        title: "سبب التعديل",
        input: "textarea",
        inputPlaceholder:
          "اكتب سبب تعديل بيانات مندوب البيع...",
        showCancelButton: true,
        confirmButtonText: "حفظ التعديل",
        cancelButtonText: "رجوع",
        inputValidator: (value) =>
          !String(value || "").trim()
            ? "سبب التعديل مطلوب"
            : undefined
      });

      if (!reasonResult.isConfirmed) return;

      reason =
        String(reasonResult.value || "").trim();
    }

    const payload = {
      actorUserGuid: userGuid,
      reason,
      salesMan: {
        guid: String(model.guid || ""),
        code: String(model.code || ""),
        fullName: model.fullName.trim(),
        useName: model.useName.trim(),
        isUse: Boolean(model.isUse)
      },
      branches: selectedBranches.map(
        (item) => item.guid
      )
    };

    setSaving(true);

    try {
      const response = await fetch(
        isEdit
          ? `${API_BASE_URL}/api/salesman-management/${encodeURIComponent(model.guid)}`
          : `${API_BASE_URL}/api/salesman-management`,
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
          "تعذر حفظ مندوب البيع"
        );
      }

      const saved = result?.data || {};

      setModel((current) => ({
        ...current,
        guid: String(saved.guid || current.guid || ""),
        code: String(saved.code || current.code || "")
      }));

      await Swal.fire({
        icon: "success",
        title: isEdit
          ? "تم تعديل مندوب البيع"
          : "تم حفظ مندوب البيع",
        text:
          result?.message ||
          "تمت العملية بنجاح"
      });
    } catch (e) {
      await Swal.fire({
        icon: "error",
        title: "تعذر الحفظ",
        text:
          e?.message ||
          "تعذر حفظ بيانات مندوب البيع"
      });
    } finally {
      setSaving(false);
    }
  }, [
    validate,
    isEdit,
    ops,
    userGuid,
    model,
    selectedBranches
  ]);

  // ============================================================
  // States
  // ============================================================
  if (permissionLoading) {
    return (
      <Box
        sx={{
          height: "100vh",
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
          {permissionError || "لا توجد لديك صلاحية إضافة مندوب بيع ضمن قائمة ملف."}
        </Alert>
      </Box>
    );
  }

  const content = (
    <Box
      dir="rtl"
      sx={{
        minHeight: "100vh",
        width: "100%",
        maxWidth: "100%",
        overflowX: "hidden",
        bgcolor: soft,
        p: { xs: 0.45, sm: 0.8, md: 1 }
      }}
    >
      <Paper
        elevation={0}
        sx={{
          border: `1px solid ${border}`,
          borderRadius: { xs: 1.2, sm: 2 },
          overflow: "hidden",

          "& .MuiInputBase-root": {
            minHeight: { xs: 34, sm: 38 }
          },
          "& .MuiInputBase-input": {
            fontSize: { xs: 12, sm: 13.5 },
            py: { xs: 0.5, sm: 0.75 }
          },
          "& .MuiInputLabel-root": {
            fontSize: { xs: 12, sm: 12.5 }
          },
          "& .MuiButton-root": {
            minHeight: { xs: 31, sm: 36 },
            fontSize: { xs: 12, sm: 13.2 },
            lineHeight: 1.1
          },
          "& .MuiSvgIcon-root": {
            fontSize: { xs: 18, sm: 20 }
          }
        }}
      >
        <Box
          sx={uiLayout.withUiSx({
            bgcolor: primaryDark,
            color: "#fff",
            px: { xs: 0.8, sm: 1.5 },
            py: { xs: 0.65, sm: 0.9 },
            display: "flex",
            alignItems: "center",
            gap: 0.6
          }, uiLayout.mobileHeaderSx)}
        >
          {!isDesktop && (
            <IconButton
              onClick={() =>
                setMobileSidebarOpen(true)
              }
              sx={{ color: "#fff", p: 0.4 }}
            >
              <MenuRoundedIcon />
            </IconButton>
          )}

          <PersonAddAlt1Icon />

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontWeight: 900,
                fontSize: {
                  xs: 16,
                  sm: 19,
                  md: 21
                }
              }}
            >
              إضافة مندوب بيع
            </Typography>
          </Box>

          <Chip
            label={
              isEdit
                ? `تعديل #${model.code}`
                : "مندوب جديد"
            }
            size="small"
            sx={{
              height: { xs: 23, sm: 27 },
              bgcolor: "#fff",
              color: primaryDark,
              fontWeight: 900,
              fontSize: { xs: 12, sm: 12 }
            }}
          />
        </Box>

        <Box
          sx={{
            p: { xs: 0.55, sm: 0.8 },
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
              gap: { xs: 0.4, sm: 0.7 },
              justifyContent: { sm: "start" }
            }, uiLayout.actionBarSx)}
          >
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={newSalesMan}
              disabled={!ops.canAdd && !isEdit}
              sx={uiLayout.withUiSx({
                bgcolor: "#1976d2",
                fontWeight: 900,
                minWidth: 0,
                px: { xs: 0.5, sm: 1.5 }
              }, uiLayout.buttonSx)}
            >
              جديد
            </Button>

            <Button
              variant="outlined"
              startIcon={<SearchIcon />}
              disabled={!ops.canFind}
              onClick={() => {
                setLookupSearch("");
                setLookupOpen(true);
              }}
              sx={uiLayout.withUiSx({
                fontWeight: 900,
                minWidth: 0,
                px: { xs: 0.5, sm: 1.5 }
              }, uiLayout.buttonSx)}
            >
              بحث
            </Button>

            <Button
              variant="contained"
              color="success"
              startIcon={
                saving
                  ? <CircularProgress size={16} color="inherit" />
                  : <SaveIcon />
              }
              disabled={
                saving ||
                loading ||
                (isEdit
                  ? !ops.canEdit
                  : !ops.canAdd)
              }
              onClick={save}
              sx={uiLayout.withUiSx({
                fontWeight: 900,
                minWidth: 0,
                px: { xs: 0.5, sm: 1.5 }
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
              alignItems: "center",
              gap: 0.7
            }}
          >
            <CircularProgress size={17} />
            <Typography sx={{ fontSize: 12 }}>
              جاري التحميل...
            </Typography>
          </Box>
        )}

        <Box sx={{ p: { xs: 0.7, sm: 1.2 } }}>
          {/* بيانات أساسية - كل 2 فيلد جنب بعض على الموبايل */}
          <Box
            sx={uiLayout.withUiSx({
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2,minmax(0,1fr))",
                md: "repeat(4,minmax(0,1fr))"
              },
              gap: { xs: 0.45, sm: 0.7 }
            }, uiLayout.formSectionSx)}
          >
            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
              size="small"
              label="كود"
              value={model.code}
              disabled
             inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

            <FormControlLabel
              sx={uiLayout.withUiSx({
                m: 0,
                px: 0.5,
                border: `1px solid ${border}`,
                borderRadius: 1,
                minHeight: { xs: 34, sm: 38 },
                "& .MuiFormControlLabel-label": {
                  fontSize: { xs: 12, sm: 13 }
                }
              }, uiLayout.checkboxFieldSx)}
              control={
                <Checkbox
                  checked={model.isUse}
                  onChange={(e) =>
                    setField(
                      "isUse",
                      e.target.checked
                    )
                  }
                  sx={{ p: 0.45 }}
                />
              }
              label="نشط"
            />

            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
              size="small"
              label="اسم المندوب"
              value={model.fullName}
              onChange={(e) =>
                setField(
                  "fullName",
                  e.target.value
                )
              }
            />

            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
              size="small"
              label="اسم مختصر"
              value={model.useName}
              onChange={(e) =>
                setField(
                  "useName",
                  e.target.value
                )
              }
            />
          </Box>

          <Box
            sx={{
              mt: { xs: 0.7, sm: 1 },
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr"
              },
              gap: { xs: 0.65, sm: 1 }
            }}
          >
            {/* قائمة الفروع */}
            <Paper
              variant="outlined"
              sx={{
                p: { xs: 0.55, sm: 0.8 },
                borderColor: border
              }}
            >
              <Typography
                sx={{
                  fontWeight: 900,
                  fontSize: { xs: 12, sm: 14 },
                  mb: 0.45
                }}
              >
                قائمة الفروع
              </Typography>

              <TextField InputLabelProps={{ shrink: true }}
                fullWidth
                size="small"
                value={branchSearch}
                onChange={(e) =>
                  setBranchSearch(e.target.value)
                }
                placeholder="بحث في الفروع..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
                sx={uiLayout.withUiSx({ mb: 0.45 }, uiLayout.formFieldSx)}
              />

              <Box
                sx={{
                  maxHeight: {
                    xs: 185,
                    sm: 290,
                    md: 360
                  },
                  overflow: "auto",
                  display: "grid",
                  gap: 0.2
                }}
              >
                {availableBranches.map((branch) => (
                  <Button
                    key={branch.guid}
                    variant="text"
                    onClick={() => addBranch(branch)}
                    sx={uiLayout.withUiSx({
                      justifyContent: "space-between",
                      color: "text.primary",
                      minHeight: { xs: 28, sm: 33 },
                      px: { xs: 0.35, sm: 0.7 },
                      py: 0.1,
                      fontSize: { xs: 12, sm: 12.5 }
                    }, uiLayout.buttonSx)}
                  >
                    <span>{branch.name}</span>
                    <AddIcon fontSize="small" />
                  </Button>
                ))}

                {!availableBranches.length && (
                  <Alert
                    severity="info"
                    sx={{
                      py: 0.3,
                      fontSize: 12
                    }}
                  >
                    لا توجد فروع متاحة.
                  </Alert>
                )}
              </Box>
            </Paper>

            {/* الفروع المتاح التعامل معها */}
            <Paper
              variant="outlined"
              sx={{
                p: { xs: 0.55, sm: 0.8 },
                borderColor: border
              }}
            >
              <Typography
                sx={{
                  fontWeight: 900,
                  fontSize: { xs: 12, sm: 14 },
                  mb: 0.45
                }}
              >
                الفروع المتاح التعامل معها
              </Typography>

              <Box
                sx={{
                  maxHeight: {
                    xs: 220,
                    sm: 330,
                    md: 400
                  },
                  overflow: "auto",
                  display: "grid",
                  gap: 0.2
                }}
              >
                {selectedBranches.map((branch) => (
                  <Button
                    key={branch.guid}
                    color="error"
                    variant="text"
                    onClick={() =>
                      removeBranch(branch.guid)
                    }
                    sx={uiLayout.withUiSx({
                      justifyContent: "space-between",
                      minHeight: { xs: 28, sm: 33 },
                      px: { xs: 0.35, sm: 0.7 },
                      py: 0.1,
                      fontSize: { xs: 12, sm: 12.5 }
                    }, uiLayout.buttonSx)}
                  >
                    <span>{branch.name}</span>
                    <CloseIcon fontSize="small" />
                  </Button>
                ))}

                {!selectedBranches.length && (
                  <Alert
                    severity="info"
                    sx={{
                      py: 0.3,
                      fontSize: 12
                    }}
                  >
                    لم يتم اختيار فروع.
                  </Alert>
                )}
              </Box>
            </Paper>
          </Box>
        </Box>
      </Paper>

      <SalesManLookupDialog
        open={lookupOpen}
        rows={lookupRows}
        loading={lookupLoading}
        search={lookupSearch}
        setSearch={setLookupSearch}
        onClose={() => setLookupOpen(false)}
        onPick={(row) => loadSalesMan(row.code)}
      />
    </Box>
  );

  return (
    <NavigationShell variant="standard" mobileOpen={mobileSidebarOpen} onMobileClose={() =>
            setMobileSidebarOpen(false)
          }><Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: theme.palette.mode === 'dark' ? theme.palette.background.default : soft
      }}
    >
      

      

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          ...navigationContentSx
        }}
      >
        {content}
      </Box>
    </Box></NavigationShell>
  );
}
