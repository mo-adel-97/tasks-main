import { DESKTOP_BREAKPOINT } from '../config/sidebarLayout';
import * as uiLayout from './common/uiLayout';
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
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
import AttachFileIcon from "@mui/icons-material/AttachFile";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DiscountIcon from "@mui/icons-material/Discount";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import SaveIcon from "@mui/icons-material/Save";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Swal from "sweetalert2";

const primaryColor = "#057546";
const accentColor = "#ae1e21";
// Always-visible focus-green outline (never hover/focus-only) for every field
// and the dialog frame itself — matches the reference styling on the Home page.
const FOCUS_BORDER_SX = (theme) => (theme.palette.mode !== "dark" ? {} : {
  "& .MuiDialog-paper": { border: "1px solid #67C99D" },
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#67C99D" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#67C99D" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#67C99D" }
});

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

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return "";
};

const getResponsiveSwalOptions = () => {
  const width = typeof window !== "undefined" ? window.innerWidth : DESKTOP_BREAKPOINT;
  const isPhoneView = width < 600;


  return {
    width: isPhoneView ? "82vw" : "420px",
    padding: isPhoneView ? "0.65rem" : "0.85rem",
    customClass: {
      popup: "sstli-discount-swal",
      icon: "sstli-discount-swal-icon",
      title: "sstli-discount-swal-title",
      htmlContainer: "sstli-discount-swal-text",
      actions: "sstli-discount-swal-actions",
      confirmButton: "sstli-discount-swal-confirm",
      cancelButton: "sstli-discount-swal-cancel"
    }
  };
};

const showWarning = (message) =>
  Swal.fire({
    ...getResponsiveSwalOptions(),
    icon: "warning",
    title: "تنبيه",
    text: message,
    confirmButtonText: "حسناً",
    confirmButtonColor: accentColor
  });

const showError = (message) =>
  Swal.fire({
    ...getResponsiveSwalOptions(),
    icon: "error",
    title: "خطأ",
    text: message,
    confirmButtonText: "حسناً",
    confirmButtonColor: accentColor
  });

const showSuccess = (message) =>
  Swal.fire({
    ...getResponsiveSwalOptions(),
    icon: "success",
    title: "تم بنجاح",
    text: message,
    confirmButtonText: "حسناً",
    confirmButtonColor: primaryColor
  });

const StudentField = ({ label, value }) => (
  <TextField InputLabelProps={{ shrink: true }}
    fullWidth
    size="small"
    label={label}
    value={value || ""}
    InputProps={{ readOnly: true }}
    sx={uiLayout.withUiSx({
      [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
        "& .MuiInputLabel-root": { fontSize: "0.75rem" },
        "& .MuiInputBase-input": {
          fontSize: "0.75rem",
          py: 0.65
        },
        "& .MuiOutlinedInput-root": {
          minHeight: 35,
          borderRadius: 1.25
        }
      },
      "@media (max-width:599px)": {
        "& .MuiInputLabel-root": { fontSize: "0.75rem" },
        "& .MuiInputBase-input": {
          fontSize: "0.75rem",
          py: 0.5
        },
        "& .MuiOutlinedInput-root": {
          minHeight: 31
        }
      }
    }, uiLayout.formFieldSx)}
  />
);

const PromoStudentsDialog = ({
  open,
  apiBaseUrl,
  ownerAccountGuid,
  initialStudents,
  onClose,
  onConfirm
}) => {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(`(min-width:600px) and (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`);
  const isCompact = isPhone || isTablet;

  const [nationalId, setNationalId] = useState("");
  const [students, setStudents] = useState([]);
  const [checking, setChecking] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  useEffect(() => {
    if (!open) return;

    setNationalId("");
    setStudents(Array.isArray(initialStudents) ? initialStudents : []);
    setSelectedIndex(-1);
  }, [open, initialStudents]);

  const total = students.length * 250;

  const handleAdd = async () => {
    const cleanNationalId = nationalId.replace(/\D/g, "");

    if (!ownerAccountGuid) {
      showWarning("رقم حساب صاحب الخصم غير موجود");
      return;
    }

    if (
      cleanNationalId.length !== 10 ||
      (!cleanNationalId.startsWith("1") &&
        !cleanNationalId.startsWith("2"))
    ) {
      showWarning("رقم الهوية لازم يكون 10 أرقام ويبدأ بـ 1 أو 2");
      return;
    }

    if (students.some((item) => item.nationalId === cleanNationalId)) {
      showWarning("رقم الهوية مضاف بالفعل في القائمة الحالية");
      return;
    }

    try {
      setChecking(true);

      const response = await fetch(
        `${apiBaseUrl}/api/discount-orders/promo/check-student`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            ownerAccountGuid,
            nationalId: cleanNationalId
          })
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            "فشل التحقق من بيانات الطالب"
        );
      }

      const student = result?.data;

      if (!student?.nationalId) {
        throw new Error("لم يتم العثور على بيانات الطالب");
      }

      setStudents((previous) => [...previous, student]);
      setNationalId("");
      setSelectedIndex(-1);
    } catch (error) {
      showWarning(error.message || "تعذر إضافة الطالب");
    } finally {
      setChecking(false);
    }
  };

  const handleDelete = () => {
    if (selectedIndex < 0 || selectedIndex >= students.length) {
      showWarning("حدد الطالب المراد حذفه أولاً");
      return;
    }

    setStudents((previous) =>
      previous.filter((_, index) => index !== selectedIndex)
    );

    setSelectedIndex(-1);
  };

  const handleConfirm = () => {
    if (students.length === 0) {
      showWarning("لابد أن تضيف طالب واحد على الأقل للخصم الترويجي");
      return;
    }

    onConfirm(students);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
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
      }, uiLayout.dialogLayoutSx, FOCUS_BORDER_SX)}
      PaperProps={{
        sx: {
          width: isPhone ? "100vw" : isTablet ? "94vw" : undefined,
          maxWidth: isPhone ? "100vw" : isTablet ? "860px" : undefined,
          height: isPhone ? "calc(100dvh - 58px)" : isTablet ? "78dvh" : undefined,
          maxHeight: isPhone ? "calc(100dvh - 58px)" : isTablet ? "78dvh" : undefined,
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
          fontWeight: 950,
          color: primaryColor,
          py: isPhone ? 0.5 : isTablet ? 0.7 : 1.5,
          px: isPhone ? 0.65 : isTablet ? 0.9 : 2,
          fontSize: isPhone ? "0.75rem" : isTablet ? "0.78rem" : undefined,
          flexShrink: 0
        }}
      >
        إضافة الطلاب المسجلين عن طريق صاحب الخصم
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          p: isPhone ? 0.3 : isTablet ? 0.55 : 2,
          overflowY: "auto",
          flex: 1,
          minHeight: 0
        }}
      >
        <Stack
          direction="row"
          spacing={isCompact ? 0.3 : 1.5}
          alignItems="center"
          sx={uiLayout.withUiSx({ mb: isCompact ? 0.4 : 2 }, uiLayout.filterBarSx)}
        >
          <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
            label="رقم الهوية"
            value={nationalId}
            onChange={(event) =>
              setNationalId(
                event.target.value.replace(/\D/g, "").slice(0, 10)
              )
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleAdd();
              }
            }}
            fullWidth
            inputProps={{
              maxLength: 10,
              inputMode: "numeric"
            , dir: "ltr" , style: { direction: "ltr", unicodeBidi: "isolate" } }}
          />

          <Button
            variant="contained"
            onClick={handleAdd}
            disabled={checking}
            startIcon={
              checking ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <PersonAddAlt1Icon />
              )
            }
            sx={uiLayout.withUiSx({
              minWidth: isPhone ? 54 : isTablet ? 66 : 120,
              height: isPhone ? 31 : isTablet ? 35 : 55,
              px: isPhone ? 0.45 : isTablet ? 0.65 : undefined,
              fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
              backgroundColor: primaryColor
            }, uiLayout.buttonSx)}
          >
            إضافة
          </Button>

          <Button
            variant="contained"
            onClick={handleDelete}
            startIcon={<DeleteOutlineIcon />}
            sx={uiLayout.withUiSx({
              minWidth: isPhone ? 54 : isTablet ? 66 : 120,
              height: isPhone ? 31 : isTablet ? 35 : 55,
              px: isPhone ? 0.45 : isTablet ? 0.65 : undefined,
              fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
              backgroundColor: accentColor
            }, uiLayout.buttonSx)}
          >
            حذف
          </Button>
        </Stack>

        <TableContainer
          component={Paper}
          variant="outlined"
          sx={uiLayout.withUiSx({
            borderRadius: isCompact ? 1.3 : undefined,
            overflowX: "auto",
            "& .MuiTableCell-root": {
              py: isPhone ? 0.4 : isTablet ? 0.55 : undefined,
              px: isPhone ? 0.3 : isTablet ? 0.5 : undefined,
              fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
              whiteSpace: "nowrap"
            }
          }, uiLayout.tableContainerSx)}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell align="center">رقم الهوية</TableCell>
                <TableCell align="center">اسم الطالب</TableCell>
                <TableCell align="center" sx={{ display: isPhone ? "none" : "table-cell" }}>رقم الاستمارة</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isPhone ? 2 : 3} align="center">
                    لا توجد طلاب مضافة
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student, index) => (
                  <TableRow
                    key={`${student.nationalId}-${index}`}
                    hover
                    selected={selectedIndex === index}
                    onClick={() => setSelectedIndex(index)}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell align="center">
                      <bdi dir="ltr">{student.nationalId}</bdi>
                    </TableCell>

                    <TableCell align="center">
                      {student.studentName}
                    </TableCell>

                    <TableCell align="center" sx={{ display: isPhone ? "none" : "table-cell" }}>
                      {student.regDocCode}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Typography
          sx={{
            mt: isCompact ? 0.45 : 2,
            textAlign: "center",
            fontWeight: 950,
            color: accentColor,
            fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : "1.1rem"
          }}
        >
          عدد الطلاب: {students.length} | إجمالي الخصم:{" "}
          {total.toFixed(2)} ريال
        </Typography>
      </DialogContent>

      <DialogActions sx={uiLayout.withUiSx({ px: isPhone ? 0.35 : isTablet ? 0.55 : 3, py: isPhone ? 0.28 : isTablet ? 0.42 : 2, gap: isCompact ? 0.35 : 1, flexShrink: 0 }, uiLayout.dialogActionsSx)}>
        <Button
          variant="contained"
          onClick={handleConfirm}
          sx={uiLayout.withUiSx({
            backgroundColor: primaryColor,
            minWidth: isPhone ? 78 : isTablet ? 92 : 120,
            minHeight: isPhone ? 30 : isTablet ? 34 : undefined,
            fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
          }, uiLayout.buttonSx)}
        >
          اعتماد
        </Button>

        <Button
          variant="contained"
          onClick={onClose}
          sx={uiLayout.withUiSx({
            backgroundColor: "#888",
            minWidth: isPhone ? 72 : isTablet ? 86 : 120,
            minHeight: isPhone ? 30 : isTablet ? 34 : undefined,
            fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
          }, uiLayout.buttonSx)}
        >
          إلغاء
        </Button>
      </DialogActions>
    </Dialog>
  );
};


const PromoDetailsDialog = ({
  open,
  apiBaseUrl,
  discountOrderGuid,
  onClose
}) => {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(`(min-width:600px) and (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`);
  const isCompact = isPhone || isTablet;

  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !discountOrderGuid) return;

    const loadDetails = async () => {
      try {
        setLoading(true);
        setError("");
        setDetails(null);

        const response = await fetch(
          `${apiBaseUrl}/api/discount-orders/promo/${encodeURIComponent(
            discountOrderGuid
          )}`
        );

        const result = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            result?.error ||
              result?.message ||
              "فشل تحميل تفاصيل الخصم الترويجي"
          );
        }

        setDetails(result?.data || null);
      } catch (err) {
        setError(err.message || "تعذر تحميل التفاصيل");
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [open, discountOrderGuid, apiBaseUrl]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      fullScreen={isPhone}
      dir="rtl"
      sx={uiLayout.withUiSx({
        "& .MuiDialog-container": {
          pt: isPhone ? "58px" : isTablet ? "64px" : 1.5,
          px: isPhone ? 0 : isTablet ? 0.5 : 1.5,
          pb: isPhone ? 0 : isTablet ? 0.5 : 1.5
        }
      }, uiLayout.dialogLayoutSx, FOCUS_BORDER_SX)}
      PaperProps={{
        sx: {
          width: isPhone ? "100vw" : isTablet ? "96vw" : "92vw",
          maxWidth: isPhone ? "100vw" : isTablet ? "1100px" : "1400px",
          height: isPhone ? "calc(100dvh - 58px)" : isTablet ? "80dvh" : undefined,
          maxHeight: isPhone ? "calc(100dvh - 58px)" : isTablet ? "80dvh" : undefined,
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
          fontWeight: 950,
          color: primaryColor,
          textAlign: "center",
          fontSize: isPhone ? "0.75rem" : isTablet ? "0.8rem" : "1.5rem",
          py: isPhone ? 0.5 : isTablet ? 0.7 : 1.5,
          flexShrink: 0
        }}
      >
        الطلاب المشمولين في الخصم الترويجي
      </DialogTitle>

      <DialogContent dividers sx={{ p: isPhone ? 0.3 : isTablet ? 0.55 : 3, overflowY: "auto", flex: 1, minHeight: 0 }}>
        {loading ? (
          <Box sx={{ py: 8, textAlign: "center" }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : details ? (
          <>
            <Paper
              variant="outlined"
              sx={(theme) => ({
                p: isPhone ? 0.4 : isTablet ? 0.6 : 2,
                mb: isCompact ? 0.4 : 2,
                textAlign: "center",
                backgroundColor: theme.palette.mode === "dark" ? "rgba(229,90,90,.1)" : "#fffafa"
              })}
            >
              <Typography
                sx={{
                  fontWeight: 950,
                  color: accentColor,
                  fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : "1.1rem",
                  lineHeight: 1.25
                }}
              >
                صاحب الخصم: {details.ownerStudentName || "-"} | الهوية:{" "}
                {details.ownerNationalId || "-"} | عدد الطلاب:{" "}
                {details.studentCount ?? details.students?.length ?? 0} |
                إجمالي الخصم:{" "}
                {Number(details.totalAmount || 0).toFixed(2)} ريال
              </Typography>
            </Paper>

            <TableContainer
              component={Paper}
              variant="outlined"
              sx={uiLayout.withUiSx({
                maxHeight: isPhone ? "52dvh" : isTablet ? "50dvh" : "48vh",
                borderRadius: isCompact ? 1.3 : undefined,
                "& .MuiTableCell-root": {
                  py: isPhone ? 0.4 : isTablet ? 0.55 : undefined,
                  px: isPhone ? 0.28 : isTablet ? 0.45 : undefined,
                  fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
                  whiteSpace: "nowrap"
                }
              }, uiLayout.tableContainerSx)}
            >
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell align="center">رقم الهوية</TableCell>
                    <TableCell align="center">اسم الطالب</TableCell>
                    <TableCell align="center" sx={{ display: isPhone ? "none" : "table-cell" }}>رقم الاستمارة</TableCell>
                    <TableCell align="center" sx={{ display: isPhone ? "none" : "table-cell" }}>كشف الحساب</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {(details.students || []).map((student, index) => (
                    <TableRow
                      key={`${student.nationalId}-${index}`}
                      hover
                    >
                      <TableCell align="center">
                        <bdi dir="ltr">{student.nationalId || "-"}</bdi>
                      </TableCell>

                      <TableCell align="center">
                        {student.studentName || "-"}
                      </TableCell>

                      <TableCell align="center" sx={{ display: isPhone ? "none" : "table-cell" }}>
                        {student.regDocCode || "-"}
                      </TableCell>

                      <TableCell align="center" sx={{ display: isPhone ? "none" : "table-cell" }}>
                        <Button sx={uiLayout.buttonSx}
                          variant="outlined"
                          size="small"
                          disabled
                          title="يتم ربط كشف الحساب من شاشة الاستقبال"
                        >
                          عرض
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TextField InputLabelProps={{ shrink: true }}
              fullWidth
              multiline
              minRows={isPhone ? 2 : isTablet ? 2 : 3}
              value={details.notes || ""}
              InputProps={{ readOnly: true }}
              sx={uiLayout.withUiSx({ mt: 2 }, uiLayout.formFieldSx)}
            />
          </>
        ) : null}
      </DialogContent>

      <DialogActions sx={uiLayout.withUiSx({ px: isPhone ? 0.35 : isTablet ? 0.55 : 3, py: isPhone ? 0.28 : isTablet ? 0.42 : 2, flexShrink: 0 }, uiLayout.dialogActionsSx)}>
        <Button
          variant="contained"
          onClick={onClose}
          sx={uiLayout.withUiSx({
            backgroundColor: "#888",
            minWidth: isPhone ? 72 : isTablet ? 86 : 120,
            minHeight: isPhone ? 30 : isTablet ? 34 : undefined,
            fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
          }, uiLayout.buttonSx)}
        >
          إغلاق
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const DiscountOrderDialog = ({
  open,
  student,
  apiBaseUrl,
  onClose,
  onSaved
}) => {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(`(min-width:600px) and (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`);
  const isCompact = isPhone || isTablet;

  const currentUser = useMemo(() => getCurrentUser(), []);
  const userGuid = getUserGuid(currentUser);

  const accountGuid = readValue(
    student,
    "accountGuid",
    "AccountGuid"
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
    "tel",
    "StudentTel"
  );

  const [types, setTypes] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedGuid, setSelectedGuid] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [requesterNote, setRequesterNote] = useState("");
  const [promoStudents, setPromoStudents] = useState([]);
  const [promoOpen, setPromoOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [promoDetailsOpen, setPromoDetailsOpen] = useState(false);
  const [promoDetailsGuid, setPromoDetailsGuid] = useState("");

  const selectedType = useMemo(
    () => types.find((item) => item.guid === selectedGuid) || null,
    [types, selectedGuid]
  );

  const discountAmount = selectedType?.isPromo
    ? promoStudents.length * 250
    : Number(selectedType?.amount || 0);

  const loadData = async () => {
    if (!accountGuid) {
      setLoadError("رقم حساب الطالب غير موجود");
      return;
    }

    try {
      setLoading(true);
      setLoadError("");

      const [typesResponse, historyResponse] = await Promise.all([
        fetch(
          `${apiBaseUrl}/api/discount-orders/types?accountGuid=${encodeURIComponent(
            accountGuid
          )}`
        ),
        fetch(
          `${apiBaseUrl}/api/discount-orders/history?accountGuid=${encodeURIComponent(
            accountGuid
          )}`
        )
      ]);

      const typesResult = await typesResponse.json().catch(() => null);
      const historyResult = await historyResponse.json().catch(() => null);

      if (!typesResponse.ok) {
        throw new Error(
          typesResult?.error ||
            typesResult?.message ||
            "فشل تحميل أنواع الخصم"
        );
      }

      if (!historyResponse.ok) {
        throw new Error(
          historyResult?.error ||
            historyResult?.message ||
            "فشل تحميل طلبات الخصم السابقة"
        );
      }

      setTypes(Array.isArray(typesResult?.data) ? typesResult.data : []);
      setHistory(
        Array.isArray(historyResult?.data) ? historyResult.data : []
      );
    } catch (error) {
      setTypes([]);
      setHistory([]);
      setLoadError(error.message || "حدث خطأ أثناء تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;

    setSelectedGuid("");
    setAttachment(null);
    setRequesterNote("");
    setPromoStudents([]);
    setPromoOpen(false);
    loadData();
  }, [open, accountGuid]);

  // Lazy-mount guard: this dialog is mounted eagerly (but closed) as soon
  // as the parent page loads, so skip building its JSX until it has
  // actually been opened once. Once opened, later closes still render
  // normally so the MUI exit transition keeps working.
  const hasOpenedRef = useRef(open);
  if (open) hasOpenedRef.current = true;
  if (!hasOpenedRef.current) return null;

  const handleTypeChange = (event) => {
    const guid = event.target.value;
    const type = types.find((item) => item.guid === guid);

    setSelectedGuid(guid);
    setAttachment(null);
    setPromoStudents([]);

    if (type?.isPromo) {
      setPromoOpen(true);
    }
  };

  const handleSave = async () => {
    if (!selectedType) {
      showWarning("برجاء اختيار الخصم أولاً");
      return;
    }

    if (!userGuid) {
      showWarning("بيانات المستخدم غير موجودة");
      return;
    }

    if (selectedType.requiresAttachment && !attachment) {
      showWarning("هذا الخصم يتطلب ملف مرفق");
      return;
    }

    if (selectedType.isPromo && promoStudents.length === 0) {
      showWarning(
        "خصم ترويجي يتطلب إدخال الطلاب المسجلين عن طريق صاحب الخصم"
      );
      setPromoOpen(true);
      return;
    }

    if (requesterNote.length > 1000) {
      showWarning("ملاحظة مقدم الطلب يجب ألا تتجاوز 1000 حرف");
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();

      formData.append("accountGuid", accountGuid);
      formData.append("nationalId", nationalId);
      formData.append("discountGuid", selectedType.guid);
      formData.append("userGuid", userGuid);
      formData.append("requesterNote", requesterNote.trim());
      formData.append("isUse", "true");

      formData.append(
        "promoNationalIdsJson",
        JSON.stringify(
          promoStudents.map((item) => item.nationalId)
        )
      );

      if (attachment) {
        formData.append("attachment", attachment);
      }

      const response = await fetch(
        `${apiBaseUrl}/api/discount-orders`,
        {
          method: "POST",
          body: formData
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            "فشل حفظ طلب الخصم"
        );
      }

      await showSuccess(
        result?.message || "تم حفظ طلب الخصم بنجاح"
      );

      await loadData();

      setSelectedGuid("");
      setAttachment(null);
      setRequesterNote("");
      setPromoStudents([]);

      onSaved?.(result?.data);
    } catch (error) {
      showError(error.message || "حدث خطأ أثناء حفظ طلب الخصم");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <style>
        {`
          @media screen {
            .sstli-discount-swal {
              max-width: 420px !important;
              border-radius: 14px !important;
              font-family: Cairo, Arial, sans-serif !important;
            }
            .sstli-discount-swal-icon {
              width: 3.4em !important;
              height: 3.4em !important;
              margin: 0.6em auto 0.25em !important;
            }
            .sstli-discount-swal-icon .swal2-icon-content {
              font-size: 2.3em !important;
            }
            .sstli-discount-swal-title {
              font-size: 0.95rem !important;
              line-height: 1.2 !important;
              padding-top: 0.2em !important;
            }
            .sstli-discount-swal-text {
              font-size: 0.68rem !important;
              line-height: 1.4 !important;
              padding: 0 0.75em !important;
            }
            .sstli-discount-swal-actions {
              margin-top: 0.65em !important;
            }
            .sstli-discount-swal-confirm,
            .sstli-discount-swal-cancel {
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
            .sstli-discount-swal {
              width: 82vw !important;
              max-width: 300px !important;
              border-radius: 12px !important;
            }
            .sstli-discount-swal-icon {
              width: 3em !important;
              height: 3em !important;
              margin: 0.5em auto 0.2em !important;
            }
            .sstli-discount-swal-icon .swal2-icon-content {
              font-size: 2em !important;
            }
            .sstli-discount-swal-title {
              font-size: 0.8rem !important;
            }
            .sstli-discount-swal-text {
              font-size: 0.57rem !important;
              padding: 0 0.5em !important;
            }
            .sstli-discount-swal-confirm,
            .sstli-discount-swal-cancel {
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
        maxWidth="xl"
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
        }, uiLayout.dialogLayoutSx, FOCUS_BORDER_SX)}
        PaperProps={{
          sx: {
            width: isPhone ? "100vw" : isTablet ? "96vw" : "94vw",
            maxWidth: isPhone ? "100vw" : isTablet ? "1180px" : "1500px",
            height: isPhone ? "calc(100dvh - 58px)" : isTablet ? "calc(100dvh - 72px)" : "88vh",
            maxHeight: isPhone ? "calc(100dvh - 58px)" : isTablet ? "calc(100dvh - 72px)" : "88vh",
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
            fontWeight: 950,
            color: primaryColor,
            display: "flex",
            alignItems: "center",
            gap: isCompact ? 0.35 : 1,
            py: isPhone ? 0.5 : isTablet ? 0.7 : 1.5,
            px: isPhone ? 0.65 : isTablet ? 0.9 : 2,
            fontSize: isPhone ? "0.75rem" : isTablet ? "0.8rem" : undefined,
            flexShrink: 0
          }}
        >
          <DiscountIcon sx={{ fontSize: isPhone ? 16 : isTablet ? 19 : undefined }} />
          نموذج طلب خصم
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            p: isPhone ? 0.3 : isTablet ? 0.55 : 2,
            overflowY: "auto",
            flex: 1,
            minHeight: 0,
            "& .MuiInputLabel-root": {
              fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
            },
            "& .MuiInputBase-input, & .MuiSelect-select": {
              fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
              py: isPhone ? 0.5 : isTablet ? 0.65 : undefined
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
          {loadError ? (
            <Alert severity="error" sx={{ mb: isCompact ? 0.35 : 2, py: isCompact ? 0.15 : undefined, fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined }}>
              {loadError}
            </Alert>
          ) : null}

          <Paper variant="outlined" sx={(theme) => ({ p: isPhone ? 0.4 : isTablet ? 0.6 : 2, mb: isCompact ? 0.45 : 2, borderRadius: isCompact ? 1.4 : undefined, borderColor: theme.palette.mode === "dark" ? "#67C99D" : undefined })}>
            <Grid container spacing={isPhone ? 0.35 : isTablet ? 0.55 : 1.5}>
              <Grid item xs={12} sm={6} md={4}>
                <StudentField
                  label="اسم الطالب"
                  value={studentName}
                />
              </Grid>

              <Grid item xs={6} sm={3} md={4}>
                <StudentField
                  label="رقم الهوية"
                  value={nationalId}
                />
              </Grid>

              <Grid item xs={6} sm={3} md={4}>
                <StudentField
                  label="رقم الجوال"
                  value={studentTel}
                />
              </Grid>
            </Grid>
          </Paper>

          {loading ? (
            <Box sx={{ py: isPhone ? 2.5 : isTablet ? 3.5 : 5, textAlign: "center" }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Grid container spacing={isPhone ? 0.35 : isTablet ? 0.55 : 2}>
                <Grid item xs={12} sm={6} md={6}>
                  <FormControl sx={uiLayout.formFieldSx} fullWidth>
                    <InputLabel>نوع الخصم</InputLabel>

                    <Select
                      value={selectedGuid}
                      label="نوع الخصم"
                      onChange={handleTypeChange}
                      MenuProps={{
                        anchorOrigin: {
                          vertical: "bottom",
                          horizontal: "right"
                        },
                        transformOrigin: {
                          vertical: "top",
                          horizontal: "right"
                        },
                        MenuListProps: {
                          dense: true,
                          sx: {
                            p: isCompact ? 0.25 : 0.75
                          }
                        },
                        PaperProps: {
                          sx: {
                            width: isPhone
                              ? "min(300px, calc(100vw - 20px))"
                              : isTablet
                                ? "min(420px, calc(100vw - 32px))"
                                : undefined,
                            maxHeight: isPhone ? 180 : isTablet ? 220 : 320,
                            mt: 0.35,
                            borderRadius: isCompact ? 1.25 : 2,
                            boxShadow: "0 10px 26px rgba(31,45,61,0.16)",
                            "& .MuiMenuItem-root": {
  minHeight: isPhone ? 30 : isTablet ? 34 : 40,

  py: isPhone ? 0.35 : isTablet ? 0.48 : 0.75,

  pr: isPhone ? 0.7 : isTablet ? 0.9 : 1.5,

  // الزقة اللي إنت عايزها
  pl: isPhone ? 2.2 : isTablet ? 2.8 : 2,

  borderRadius: isCompact ? 0.9 : 0,
  mb: isCompact ? 0.12 : 0,

  fontSize: isPhone
    ? "0.48rem"
    : isTablet
      ? "0.56rem"
      : "0.875rem",

  fontWeight: 850,
  lineHeight: 1.15,
  whiteSpace: "normal",
}
                          }
                        }
                      }}
                    >
                      {types.map((type) => (
                        <MenuItem
                          key={type.guid}
                          value={type.guid}
                        >
                          {type.name}
                          {type.requiresAttachment
                            ? " — يتطلب مرفق"
                            : ""}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {types.length === 0 && !loadError ? (
                    <Alert severity="warning" sx={{ mt: 1 }}>
                      لا توجد أنواع خصم متاحة لقطاع هذا الطالب
                    </Alert>
                  ) : null}
                </Grid>

                <Grid item xs={12} sm={3} md={3}>
                  <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                    fullWidth
                    label={
                      selectedType?.isPromo
                        ? "إجمالي الخصم الترويجي"
                        : "قيمة الخصم"
                    }
                    value={discountAmount.toFixed(2)}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>

                <Grid item xs={6} sm={3} md={3}>
                  <Button
                    component="label"
                    fullWidth
                    variant="outlined"
                    startIcon={<AttachFileIcon />}
                    disabled={!selectedType}
                    sx={uiLayout.withUiSx({
                      height: isPhone ? 31 : isTablet ? 35 : 56,
                      fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
                      px: isPhone ? 0.45 : isTablet ? 0.65 : undefined,
                      color: selectedType?.requiresAttachment
                        ? accentColor
                        : primaryColor,
                      borderColor: selectedType?.requiresAttachment
                        ? accentColor
                        : primaryColor
                    }, uiLayout.buttonSx)}
                  >
                    {attachment
                      ? attachment.name
                      : selectedType?.requiresAttachment
                      ? "إرفاق مستند إجباري"
                      : "إرفاق مستند اختياري"}

                    <input
                      hidden
                      type="file"
                      onChange={(event) =>
                        setAttachment(
                          event.target.files?.[0] || null
                        )
                      }
                    />
                  </Button>
                </Grid>
              </Grid>

              {selectedType?.isPromo ? (
                <Alert
                  severity="info"
                  action={
                    <Button sx={uiLayout.buttonSx}
                      color="inherit"
                      size="small"
                      onClick={() => setPromoOpen(true)}
                    >
                      تعديل الطلاب
                    </Button>
                  }
                  sx={{
                    mt: isCompact ? 0.4 : 2,
                    py: isCompact ? 0.15 : undefined,
                    fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
                    "& .MuiAlert-action": {
                      pt: isCompact ? 0 : undefined,
                      alignItems: "center"
                    },
                    "& .MuiButton-root": {
                      minWidth: isPhone ? 58 : isTablet ? 68 : undefined,
                      fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
                    }
                  }}
                >
                  عدد طلاب الخصم الترويجي: {promoStudents.length}،
                  إجمالي الخصم:{" "}
                  {(promoStudents.length * 250).toFixed(2)} ريال
                </Alert>
              ) : null}

              <TextField InputLabelProps={{ shrink: true }}
                fullWidth
                multiline
                minRows={isPhone ? 2 : isTablet ? 2 : 4}
                label="ملاحظة مقدم الطلب"
                value={requesterNote}
                onChange={(event) =>
                  setRequesterNote(
                    event.target.value.slice(0, 1000)
                  )
                }
                helperText={`${requesterNote.length}/1000`}
                sx={uiLayout.withUiSx({ mt: isCompact ? 0.45 : 2 }, uiLayout.formFieldSx)}
              />

              <Divider sx={{ my: isCompact ? 0.5 : 2 }}>
                <Typography
                  sx={{
                    fontWeight: 950,
                    color: primaryColor,
                    fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
                  }}
                >
                  طلبات الخصم السابقة
                </Typography>
              </Divider>

              <TableContainer
                component={Paper}
                variant="outlined"
                sx={uiLayout.withUiSx({
                  borderRadius: isCompact ? 1.3 : undefined,
                  overflowX: "auto",
                  maxHeight: isPhone ? "40dvh" : isTablet ? "42dvh" : undefined,
                  "& .MuiTableCell-root": {
                    py: isPhone ? 0.4 : isTablet ? 0.55 : undefined,
                    px: isPhone ? 0.28 : isTablet ? 0.45 : undefined,
                    fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
                    whiteSpace: "nowrap"
                  }
                }, uiLayout.tableContainerSx)}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell align="center">التاريخ</TableCell>
                      <TableCell align="center" sx={{ display: isPhone ? "none" : "table-cell" }}>
                        مقدم الطلب
                      </TableCell>
                      <TableCell align="center">
                        نوع الخصم
                      </TableCell>
                      <TableCell align="center">الحالة</TableCell>
                      <TableCell align="center" sx={{ display: isCompact ? "none" : "table-cell" }}>البيان</TableCell>
                      <TableCell align="center">طلاب الخصم</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {history.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isPhone ? 4 : isTablet ? 5 : 6} align="center">
                          لا توجد طلبات خصم سابقة
                        </TableCell>
                      </TableRow>
                    ) : (
                      history.map((item, index) => (
                        <TableRow
                          key={item.guid || index}
                          hover
                        >
                          <TableCell align="center">
                            {item.orderDate || "-"}
                          </TableCell>

                          <TableCell align="center" sx={{ display: isPhone ? "none" : "table-cell" }}>
                            {item.requestedBy || "-"}
                          </TableCell>

                          <TableCell align="center">
                            {item.discountName || "-"}
                          </TableCell>

                          <TableCell align="center">
                            {item.statusName || "-"}
                          </TableCell>

                          <TableCell align="center" sx={{ display: isCompact ? "none" : "table-cell" }}>
                            {item.notes || "-"}
                          </TableCell>

                          <TableCell align="center">
                            {item.hasPromoStudents ? (
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={<VisibilityIcon />}
                                onClick={() => {
                                  setPromoDetailsGuid(item.guid);
                                  setPromoDetailsOpen(true);
                                }}
                                sx={uiLayout.withUiSx({
                                  backgroundColor: primaryColor,
                                  minWidth: isPhone ? 46 : isTablet ? 56 : 90,
                                  px: isPhone ? 0.35 : isTablet ? 0.5 : undefined,
                                  fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
                                }, uiLayout.buttonSx)}
                              >
                                عرض
                              </Button>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </DialogContent>

        <DialogActions sx={uiLayout.withUiSx({ px: isPhone ? 0.35 : isTablet ? 0.55 : 3, py: isPhone ? 0.28 : isTablet ? 0.42 : 2, gap: isCompact ? 0.35 : 1, flexShrink: 0 }, uiLayout.dialogActionsSx)}>
          <Button
            onClick={handleSave}
            disabled={
              saving ||
              loading ||
              !selectedType ||
              Boolean(loadError)
            }
            variant="contained"
            startIcon={
              saving ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <SaveIcon />
              )
            }
            sx={uiLayout.withUiSx({
              backgroundColor: primaryColor,
              minWidth: isPhone ? 90 : isTablet ? 110 : 140,
              minHeight: isPhone ? 30 : isTablet ? 34 : undefined,
              px: isPhone ? 0.8 : isTablet ? 1.1 : undefined,
              fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
            }, uiLayout.buttonSx)}
          >
            حفظ الطلب
          </Button>

          <Button
            onClick={onClose}
            disabled={saving}
            sx={uiLayout.withUiSx({
              color: "#333",
              minWidth: isPhone ? 64 : isTablet ? 74 : 90,
              minHeight: isPhone ? 30 : isTablet ? 34 : undefined,
              px: isPhone ? 0.7 : isTablet ? 1 : undefined,
              fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
              fontWeight: 900
            }, uiLayout.buttonSx)}
          >
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>

      <PromoDetailsDialog
        open={promoDetailsOpen}
        apiBaseUrl={apiBaseUrl}
        discountOrderGuid={promoDetailsGuid}
        onClose={() => {
          setPromoDetailsOpen(false);
          setPromoDetailsGuid("");
        }}
      />

      <PromoStudentsDialog
        open={promoOpen}
        apiBaseUrl={apiBaseUrl}
        ownerAccountGuid={accountGuid}
        initialStudents={promoStudents}
        onClose={() => {
          setPromoOpen(false);

          if (promoStudents.length === 0) {
            setSelectedGuid("");
          }
        }}
        onConfirm={(students) => {
          setPromoStudents(students);
          setPromoOpen(false);
        }}
      />
    </>
  );
};

export default DiscountOrderDialog;