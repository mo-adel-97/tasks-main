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
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  TextField,
  Typography,
  useMediaQuery
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import SaveIcon from "@mui/icons-material/Save";
import SearchIcon from "@mui/icons-material/Search";
import TuneIcon from "@mui/icons-material/Tune";
import Swal from "sweetalert2";




const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  "http://localhost:5258";




const primary = "#057546";
const primaryDark = "#034d31";
const soft = "#f7fbf9";
const border = "#dce8e2";

const PROGRAMS = [
  { value: 0, label: "دبلوم" },
  { value: 1, label: "دورة تأهيلية" },
  { value: 2, label: "دورة تطويرية" }
];

const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const currentUser = getUser();

const getUserGuid = () =>
  String(
    currentUser?.guid ||
      currentUser?.Guid ||
      currentUser?.userGuid ||
      currentUser?.UserGuid ||
      ""
  ).trim();

const n = (value) => {
  const x = Number(value);
  return Number.isFinite(x) ? Math.max(0, Math.trunc(x)) : 0;
};

function SelectDialog({
  open,
  title,
  rows,
  search,
  setSearch,
  loading,
  type,
  onClose,
  onPick
}) {
  const filtered = useMemo(() => {
    const q = String(search || "").trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((row) =>
      [row.code, row.name, row.status, row.registrationStatus]
        .some((v) => String(v || "").toLowerCase().includes(q))
    );
  }, [rows, search]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      dir="rtl"
      PaperProps={{
        sx: {
          borderRadius: { xs: 1.5, sm: 2.5 },
          m: { xs: 0.7, sm: 2 },
          maxHeight: { xs: "92vh", sm: "84vh" }
        }
      }}
    >
      <DialogTitle
        sx={{
          py: { xs: 0.75, sm: 1.2 },
          fontWeight: 900,
          fontSize: { xs: 15, sm: 20 }
        }}
      >
        {title}
      </DialogTitle>

      <DialogContent dividers sx={{ p: { xs: 0.65, sm: 1.1 } }}>
        <TextField
          autoFocus
          fullWidth
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث..."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
          sx={{
            mb: 0.65,
            "& .MuiInputBase-root": { minHeight: { xs: 34, sm: 38 } },
            "& input": { fontSize: { xs: 10.5, sm: 13 } }
          }}
        />

        {loading ? (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <CircularProgress size={26} />
          </Box>
        ) : (
          <Box sx={{ display: "grid", gap: 0.4 }}>
            {filtered.map((row, index) => (
              <Paper
                key={`${row.guid || row.code}-${index}`}
                variant="outlined"
                onDoubleClick={() => onPick(row)}
                sx={{
                  p: { xs: 0.55, sm: 0.85 },
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
                    gridTemplateColumns:
                      type === "branch"
                        ? { xs: "42px minmax(0,1fr) 48px", sm: "70px minmax(0,1fr) 70px" }
                        : { xs: "48px minmax(0,1fr) 48px", sm: "70px minmax(0,1fr) 90px 100px 70px" },
                    alignItems: "center",
                    gap: 0.45
                  }}
                >
                  <Typography sx={{ fontSize: { xs: 10, sm: 12.5 }, fontWeight: 900 }}>
                    {row.code || "-"}
                  </Typography>

                  <Typography
                    noWrap
                    title={row.name}
                    sx={{ fontSize: { xs: 10.5, sm: 13 }, fontWeight: 800 }}
                  >
                    {row.name || "-"}
                  </Typography>

                  {type !== "branch" && (
                    <>
                      <Typography
                        sx={{
                          display: { xs: "none", sm: "block" },
                          fontSize: 12
                        }}
                      >
                        {row.status || ""}
                      </Typography>

                      <Typography
                        sx={{
                          display: { xs: "none", sm: "block" },
                          fontSize: 12
                        }}
                      >
                        {row.registrationStatus || ""}
                      </Typography>
                    </>
                  )}

                  <Button
                    size="small"
                    onClick={() => onPick(row)}
                    sx={{ minWidth: 0, px: 0.2, fontSize: { xs: 9, sm: 11.5 } }}
                  >
                    اختيار
                  </Button>
                </Box>
              </Paper>
            ))}

            {!filtered.length && (
              <Alert severity="info" sx={{ fontSize: { xs: 10, sm: 12 } }}>
                لا توجد بيانات مطابقة.
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ py: 0.35 }}>
        <Button onClick={onClose} sx={{ fontSize: { xs: 10, sm: 13 } }}>
          إغلاق
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function BatchCountManagement() {
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

  const [branches, setBranches] = useState([]);

  const [branch, setBranch] = useState(null);
  const [programType, setProgramType] = useState("");
  const [batch, setBatch] = useState(null);

  const [mainCount, setMainCount] = useState(0);
  const [specialties, setSpecialties] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [branchDialogOpen, setBranchDialogOpen] = useState(false);
  const [branchSearch, setBranchSearch] = useState("");

  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [batchSearch, setBatchSearch] = useState("");
  const [batchRows, setBatchRows] = useState([]);
  const [batchLoading, setBatchLoading] = useState(false);

  const allocatedCount = useMemo(
    () => specialties.reduce((sum, item) => sum + n(item.count), 0),
    [specialties]
  );

  const remainingCount = Math.max(0, n(mainCount) - allocatedCount);

  const resetBelowBranch = useCallback(() => {
    setProgramType("");
    setBatch(null);
    setMainCount(0);
    setSpecialties([]);
    setBatchRows([]);
    setBatchSearch("");
  }, []);

  const resetBelowType = useCallback(() => {
    setBatch(null);
    setMainCount(0);
    setSpecialties([]);
    setBatchRows([]);
    setBatchSearch("");
  }, []);

  const resetAll = useCallback(() => {
    setBranch(null);
    resetBelowBranch();
  }, [resetBelowBranch]);

  // صلاحية الشاشة نفسها: شئون الطلاب -> ظبط أعداد الدفعات
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
          result?.data?.studentAffairs?.canView === true &&
          result?.data?.studentAffairs?.screens?.batchCount === true;

        if (alive) setAuthorized(Boolean(allowed));
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
        `${API_BASE_URL}/api/batch-count-management/bootstrap?userGuid=${encodeURIComponent(userGuid)}`,
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
          [result?.message, result?.error, result?.detail]
            .filter(Boolean)
            .join(" — ") ||
            raw ||
            "تعذر تحميل الشاشة"
        );
      }

      setOps({
        canView: Boolean(result?.data?.permissions?.canView),
        canAdd: Boolean(result?.data?.permissions?.canAdd),
        canEdit: Boolean(result?.data?.permissions?.canEdit),
        canFind: Boolean(result?.data?.permissions?.canFind)
      });

      setBranches(
        Array.isArray(result?.data?.branches)
          ? result.data.branches
          : []
      );
    } catch (e) {
      await Swal.fire({
        icon: "error",
        title: "تعذر التحميل",
        text: e?.message || "تعذر تحميل شاشة ظبط أعداد الدفعات"
      });
    } finally {
      setLoading(false);
    }
  }, [authorized, userGuid]);

  useEffect(() => {
    if (authorized) loadBootstrap();
  }, [authorized, loadBootstrap]);

  const loadBatches = useCallback(async () => {
    if (programType === "" || !userGuid) return;

    setBatchLoading(true);

    try {
      const params = new URLSearchParams({
        userGuid,
        programType: String(programType),
        q: batchSearch || ""
      });

      const response = await fetch(
        `${API_BASE_URL}/api/batch-count-management/batches?${params}`,
        { cache: "no-store" }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          [result?.message, result?.error, result?.detail]
            .filter(Boolean)
            .join(" — ") ||
          "تعذر تحميل قائمة الدفعات"
        );
      }

      setBatchRows(Array.isArray(result?.data) ? result.data : []);
    } catch (e) {
      setBatchRows([]);
      await Swal.fire({
        icon: "error",
        title: "تعذر البحث",
        text: e?.message || "تعذر تحميل قائمة الدفعات"
      });
    } finally {
      setBatchLoading(false);
    }
  }, [programType, userGuid, batchSearch]);

  useEffect(() => {
    if (!batchDialogOpen) return;

    const timer = setTimeout(() => {
      loadBatches();
    }, 220);

    return () => clearTimeout(timer);
  }, [batchDialogOpen, batchSearch, programType, loadBatches]);

  const loadDetails = useCallback(
    async (selectedBatch) => {
      if (!branch || programType === "" || !selectedBatch) return;

      setBatchDialogOpen(false);
      setBatch(selectedBatch);
      setLoading(true);

      try {
        const params = new URLSearchParams({
          userGuid,
          branchGuid: branch.guid,
          batchGuid: selectedBatch.guid,
          programType: String(programType)
        });

        const response = await fetch(
          `${API_BASE_URL}/api/batch-count-management/details?${params}`,
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
            [result?.message, result?.error, result?.detail]
              .filter(Boolean)
              .join(" — ") ||
              raw ||
              "تعذر تحميل بيانات الدفعة"
          );
        }

        setMainCount(n(result?.data?.mainCount));

        setSpecialties(
          Array.isArray(result?.data?.specialties)
            ? result.data.specialties.map((item) => ({
                guid: String(item.guid || ""),
                name: String(item.name || ""),
                count: n(item.count)
              }))
            : []
        );
      } catch (e) {
        setMainCount(0);
        setSpecialties([]);

        await Swal.fire({
          icon: "error",
          title: "تعذر التحميل",
          text: e?.message || "تعذر تحميل أعداد الدفعة"
        });
      } finally {
        setLoading(false);
      }
    },
    [branch, programType, userGuid]
  );

  const setSpecialtyCount = useCallback(
    (guid, value) => {
      const nextValue = n(value);

      setSpecialties((current) => {
        const oldItem = current.find((x) => x.guid === guid);
        const oldValue = n(oldItem?.count);
        const currentTotal = current.reduce(
          (sum, x) => sum + n(x.count),
          0
        );
        const projected = currentTotal - oldValue + nextValue;

        if (projected > n(mainCount)) {
          const allowedForThis =
            Math.max(0, n(mainCount) - (currentTotal - oldValue));

          return current.map((x) =>
            x.guid === guid
              ? { ...x, count: allowedForThis }
              : x
          );
        }

        return current.map((x) =>
          x.guid === guid
            ? { ...x, count: nextValue }
            : x
        );
      });
    },
    [mainCount]
  );

  const save = useCallback(async () => {
    if (!branch) {
      await Swal.fire("تنبيه", "برجاء اختيار الفرع أولًا", "warning");
      return;
    }

    if (programType === "") {
      await Swal.fire("تنبيه", "برجاء اختيار نوع البرنامج أولًا", "warning");
      return;
    }

    if (!batch) {
      await Swal.fire("تنبيه", "برجاء اختيار الدفعة أولًا", "warning");
      return;
    }

    if (!ops.canEdit) {
      await Swal.fire(
        "غير مسموح",
        "لا توجد لديك صلاحية تعديل أعداد الدفعات",
        "error"
      );
      return;
    }

    if (allocatedCount > n(mainCount)) {
      await Swal.fire(
        "راجع الأعداد",
        "إجمالي أعداد التخصصات أكبر من المقاعد المتاحة",
        "warning"
      );
      return;
    }

    const reasonResult = await Swal.fire({
      title: "سبب التعديل",
      input: "textarea",
      inputPlaceholder: "اكتب سبب تعديل أعداد الدفعة...",
      showCancelButton: true,
      confirmButtonText: "حفظ",
      cancelButtonText: "رجوع",
      inputValidator: (value) =>
        !String(value || "").trim()
          ? "سبب التعديل مطلوب"
          : undefined
    });

    if (!reasonResult.isConfirmed) return;

    const payload = {
      actorUserGuid: userGuid,
      branchGuid: branch.guid,
      batchGuid: batch.guid,
      batchCode: String(batch.code || ""),
      programType: Number(programType),
      reason: String(reasonResult.value || "").trim(),
      specialties: specialties.map((item) => ({
        diplomGuid: item.guid,
        count: n(item.count)
      }))
    };

    setSaving(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/batch-count-management`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
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
          [result?.message, result?.error, result?.detail]
            .filter(Boolean)
            .join(" — ") ||
            raw ||
            "تعذر الحفظ"
        );
      }

      await Swal.fire({
        icon: "success",
        title: "تم الحفظ",
        text: result?.message || "تم تعديل أعداد الدفعة بنجاح"
      });

      await loadDetails(batch);
    } catch (e) {
      await Swal.fire({
        icon: "error",
        title: "تعذر الحفظ",
        text:
          e?.message ||
          "تعذر حفظ أعداد الدفعة وتم التراجع عن العملية بالكامل"
      });
    } finally {
      setSaving(false);
    }
  }, [
    branch,
    programType,
    batch,
    ops.canEdit,
    allocatedCount,
    mainCount,
    userGuid,
    specialties,
    loadDetails
  ]);

  if (permissionLoading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!authorized) {
    return (
      <Box sx={{ p: 1 }}>
        <Alert severity="error">
          لا توجد لديك صلاحية ظبط أعداد الدفعات ضمن قائمة شئون الطلاب.
        </Alert>
      </Box>
    );
  }

  const page = (
    <Box
      dir="rtl"
      sx={{
        width: "100%",
        maxWidth: "100vw",
        minHeight: "100vh",
        overflowX: "hidden",
        bgcolor: soft,
        p: { xs: 0.35, sm: 0.7, md: 1 }
      }}
    >
      <Paper
        elevation={0}
        sx={{
          border: `1px solid ${border}`,
          borderRadius: { xs: 1.2, sm: 2 },
          overflow: "hidden",
          "& .MuiInputBase-root": {
            minHeight: { xs: 33, sm: 38 }
          },
          "& .MuiInputBase-input": {
            fontSize: { xs: 10.4, sm: 13 },
            py: { xs: 0.4, sm: 0.7 }
          },
          "& .MuiInputLabel-root": {
            fontSize: { xs: 9.5, sm: 12 }
          },
          "& .MuiButton-root": {
            minHeight: { xs: 30, sm: 36 },
            fontSize: { xs: 9.8, sm: 12.8 }
          }
        }}
      >
        <Box
          sx={{
            bgcolor: primaryDark,
            color: "#fff",
            px: { xs: 0.7, sm: 1.3 },
            py: { xs: 0.55, sm: 0.8 },
            display: "flex",
            alignItems: "center",
            gap: 0.55
          }}
        >
          {!isDesktop && (
            <IconButton
              onClick={() => setMobileSidebarOpen(true)}
              sx={{ color: "#fff", p: 0.35 }}
            >
              <MenuRoundedIcon />
            </IconButton>
          )}

          <TuneIcon />

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontWeight: 900,
                fontSize: { xs: 15, sm: 19, md: 21 }
              }}
            >
              ظبط أعداد الدفعات
            </Typography>
          </Box>

          <Chip
            size="small"
            label={batch ? `دفعة #${batch.code}` : "إعداد جديد"}
            sx={{
              height: { xs: 21, sm: 27 },
              bgcolor: "#fff",
              color: primaryDark,
              fontWeight: 900,
              fontSize: { xs: 8.5, sm: 11 }
            }}
          />
        </Box>

        <Box
          sx={{
            p: { xs: 0.55, sm: 0.8 },
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2,minmax(0,1fr))",
              md: "repeat(4,minmax(0,1fr))"
            },
            gap: { xs: 0.4, sm: 0.7 },
            borderBottom: `1px solid ${border}`
          }}
        >
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={resetAll}
            sx={{ bgcolor: "#1976d2", fontWeight: 900 }}
          >
            جديد
          </Button>

          <Button
            variant="contained"
            color="success"
            startIcon={
              saving
                ? <CircularProgress size={14} color="inherit" />
                : <SaveIcon />
            }
            disabled={saving || loading || !ops.canEdit}
            onClick={save}
            sx={{ fontWeight: 900 }}
          >
            حفظ
          </Button>

          <Button
            variant="outlined"
            startIcon={<SearchIcon />}
            onClick={() => {
              setBranchSearch("");
              setBranchDialogOpen(true);
            }}
            sx={{
              gridColumn: { xs: "1 / -1", md: "auto" },
              fontWeight: 900
            }}
          >
            اختيار الفرع
          </Button>

          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              justifyContent: "center",
              color: "text.secondary",
              fontSize: 12
            }}
          >
            {loading ? "جاري التحميل..." : ""}
          </Box>
        </Box>

        <Box sx={{ p: { xs: 0.55, sm: 0.9 } }}>
          {/* كل 2 فيلد جنب بعض على الموبايل */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2,minmax(0,1fr))",
                md: "repeat(3,minmax(0,1fr))"
              },
              gap: { xs: 0.4, sm: 0.7 }
            }}
          >
            <TextField
              size="small"
              label="الفرع"
              value={branch?.name || ""}
              onClick={() => {
                setBranchSearch("");
                setBranchDialogOpen(true);
              }}
              InputProps={{ readOnly: true }}
            />

            <TextField
              select
              size="small"
              label="نوع البرنامج"
              value={programType}
              onChange={(e) => {
                setProgramType(e.target.value);
                resetBelowType();
              }}
            >
              {PROGRAMS.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              size="small"
              label="الدفعة"
              value={batch?.name || ""}
              onClick={() => {
                if (!branch) {
                  Swal.fire("تنبيه", "اختر الفرع أولًا", "warning");
                  return;
                }

                if (programType === "") {
                  Swal.fire("تنبيه", "اختر نوع البرنامج أولًا", "warning");
                  return;
                }

                setBatchSearch("");
                setBatchDialogOpen(true);
              }}
              InputProps={{ readOnly: true }}
              sx={{ gridColumn: { xs: "1 / -1", md: "auto" } }}
            />
          </Box>

          <Box
            sx={{
              mt: { xs: 0.55, sm: 0.8 },
              display: "grid",
              gridTemplateColumns: "repeat(2,minmax(0,1fr))",
              gap: { xs: 0.4, sm: 0.7 }
            }}
          >
            <Paper variant="outlined" sx={{ p: 0.6, textAlign: "center" }}>
              <Typography
                color="text.secondary"
                sx={{ fontSize: { xs: 8.5, sm: 10.5 } }}
              >
                المقاعد المتاحة
              </Typography>
              <Typography
                sx={{
                  fontWeight: 900,
                  color: "#d32f2f",
                  fontSize: { xs: 14, sm: 18 }
                }}
              >
                {mainCount}
              </Typography>
            </Paper>

            <Paper variant="outlined" sx={{ p: 0.6, textAlign: "center" }}>
              <Typography
                color="text.secondary"
                sx={{ fontSize: { xs: 8.5, sm: 10.5 } }}
              >
                المقاعد المتبقية
              </Typography>
              <Typography
                sx={{
                  fontWeight: 900,
                  color: remainingCount === 0 ? "#d32f2f" : primary,
                  fontSize: { xs: 14, sm: 18 }
                }}
              >
                {remainingCount}
              </Typography>
            </Paper>
          </Box>

          <Typography
            sx={{
              mt: { xs: 0.7, sm: 1 },
              mb: 0.45,
              textAlign: "center",
              fontWeight: 900,
              color: "#d32f2f",
              fontSize: { xs: 10.5, sm: 15 }
            }}
          >
            عدد الطلاب المتاح تسجيلهم في كل تخصص
          </Typography>

          <Paper
            variant="outlined"
            sx={{
              borderColor: border,
              overflow: "hidden"
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "minmax(0,1fr) 88px",
                bgcolor: "#e9f3ef",
                px: { xs: 0.45, sm: 0.75 },
                py: { xs: 0.42, sm: 0.6 },
                fontWeight: 900,
                fontSize: { xs: 9.5, sm: 12.5 }
              }}
            >
              <Box>التخصص</Box>
              <Box sx={{ textAlign: "center" }}>عدد الطلاب</Box>
            </Box>

            <Box
              sx={{
                maxHeight: { xs: "54vh", sm: 520 },
                overflow: "auto"
              }}
            >
              {specialties.map((item) => (
                <Box
                  key={item.guid}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0,1fr) 88px",
                    gap: 0.4,
                    alignItems: "center",
                    px: { xs: 0.45, sm: 0.75 },
                    py: { xs: 0.3, sm: 0.45 },
                    borderTop: "1px solid #edf2ef"
                  }}
                >
                  <Typography
                    title={item.name}
                    sx={{
                      fontSize: { xs: 10, sm: 12.8 },
                      fontWeight: 750,
                      lineHeight: 1.35
                    }}
                  >
                    {item.name}
                  </Typography>

                  <TextField
                    type="number"
                    size="small"
                    value={item.count}
                    onChange={(e) =>
                      setSpecialtyCount(item.guid, e.target.value)
                    }
                    inputProps={{
                      min: 0,
                      style: { textAlign: "center" , direction: "ltr", unicodeBidi: "isolate" }
                    , dir: "ltr" }}
                    sx={{
                      "& .MuiInputBase-root": {
                        minHeight: { xs: 29, sm: 33 }
                      },
                      "& input": {
                        px: 0.25,
                        py: 0.2,
                        fontSize: { xs: 10, sm: 12 }
                      }
                    }}
                  />
                </Box>
              ))}

              {!loading && batch && specialties.length === 0 && (
                <Alert severity="info" sx={{ m: 0.6, fontSize: { xs: 10, sm: 12 } }}>
                  لا توجد تخصصات متاحة لهذا النوع.
                </Alert>
              )}
            </Box>
          </Paper>
        </Box>
      </Paper>

      <SelectDialog
        open={branchDialogOpen}
        title="قائمة الفروع"
        rows={branches}
        search={branchSearch}
        setSearch={setBranchSearch}
        loading={false}
        type="branch"
        onClose={() => setBranchDialogOpen(false)}
        onPick={(row) => {
          setBranch(row);
          setBranchDialogOpen(false);
          resetBelowBranch();
        }}
      />

      <SelectDialog
        open={batchDialogOpen}
        title={
          Number(programType) === 0
            ? "قائمة دفعات الدبلومات"
            : Number(programType) === 1
              ? "قائمة دفعات الدورات التأهيلية"
              : "قائمة دفعات الدورات التطويرية"
        }
        rows={batchRows}
        search={batchSearch}
        setSearch={setBatchSearch}
        loading={batchLoading}
        type="batch"
        onClose={() => setBatchDialogOpen(false)}
        onPick={loadDetails}
      />
    </Box>
  );

  return (
    <NavigationShell variant="standard" mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)}><Box sx={{ display: "flex", minHeight: "100vh", bgcolor: soft }}>
      

      

      <Box sx={{
        flex: 1,
        minWidth: 0,
        ...navigationContentSx
      }}>{page}</Box>
    </Box></NavigationShell>
  );
}
