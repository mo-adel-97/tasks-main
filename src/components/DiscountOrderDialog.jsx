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
  Typography
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

const showWarning = (message) =>
  Swal.fire({
    icon: "warning",
    title: "تنبيه",
    text: message,
    confirmButtonText: "حسناً",
    confirmButtonColor: accentColor
  });

const showError = (message) =>
  Swal.fire({
    icon: "error",
    title: "خطأ",
    text: message,
    confirmButtonText: "حسناً",
    confirmButtonColor: accentColor
  });

const showSuccess = (message) =>
  Swal.fire({
    icon: "success",
    title: "تم بنجاح",
    text: message,
    confirmButtonText: "حسناً",
    confirmButtonColor: primaryColor
  });

const StudentField = ({ label, value }) => (
  <TextField
    fullWidth
    size="small"
    label={label}
    value={value || ""}
    InputProps={{ readOnly: true }}
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
      dir="rtl"
    >
      <DialogTitle sx={{ fontWeight: 950, color: primaryColor }}>
        إضافة الطلاب المسجلين عن طريق صاحب الخصم
      </DialogTitle>

      <DialogContent dividers>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          alignItems="center"
          sx={{ mb: 2 }}
        >
          <TextField
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
            }}
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
            sx={{
              minWidth: 120,
              height: 55,
              backgroundColor: primaryColor
            }}
          >
            إضافة
          </Button>

          <Button
            variant="contained"
            onClick={handleDelete}
            startIcon={<DeleteOutlineIcon />}
            sx={{
              minWidth: 120,
              height: 55,
              backgroundColor: accentColor
            }}
          >
            حذف
          </Button>
        </Stack>

        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell align="center">رقم الهوية</TableCell>
                <TableCell align="center">اسم الطالب</TableCell>
                <TableCell align="center">رقم الاستمارة</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center">
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
                      {student.nationalId}
                    </TableCell>

                    <TableCell align="center">
                      {student.studentName}
                    </TableCell>

                    <TableCell align="center">
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
            mt: 2,
            textAlign: "center",
            fontWeight: 950,
            color: accentColor,
            fontSize: "1.1rem"
          }}
        >
          عدد الطلاب: {students.length} | إجمالي الخصم:{" "}
          {total.toFixed(2)} ريال
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          variant="contained"
          onClick={handleConfirm}
          sx={{ backgroundColor: primaryColor, minWidth: 120 }}
        >
          اعتماد
        </Button>

        <Button
          variant="contained"
          onClick={onClose}
          sx={{ backgroundColor: "#888", minWidth: 120 }}
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
      dir="rtl"
      PaperProps={{
        sx: {
          width: "92vw",
          maxWidth: "1400px",
          minHeight: "76vh",
          borderRadius: 3
        }
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 950,
          color: primaryColor,
          textAlign: "center",
          fontSize: "1.5rem"
        }}
      >
        الطلاب المشمولين في الخصم الترويجي
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
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
              sx={{
                p: 2,
                mb: 2,
                textAlign: "center",
                backgroundColor: "#fffafa"
              }}
            >
              <Typography
                sx={{
                  fontWeight: 950,
                  color: accentColor,
                  fontSize: "1.1rem"
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
              sx={{ maxHeight: "48vh" }}
            >
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell align="center">رقم الهوية</TableCell>
                    <TableCell align="center">اسم الطالب</TableCell>
                    <TableCell align="center">رقم الاستمارة</TableCell>
                    <TableCell align="center">كشف الحساب</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {(details.students || []).map((student, index) => (
                    <TableRow
                      key={`${student.nationalId}-${index}`}
                      hover
                    >
                      <TableCell align="center">
                        {student.nationalId || "-"}
                      </TableCell>

                      <TableCell align="center">
                        {student.studentName || "-"}
                      </TableCell>

                      <TableCell align="center">
                        {student.regDocCode || "-"}
                      </TableCell>

                      <TableCell align="center">
                        <Button
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

            <TextField
              fullWidth
              multiline
              minRows={3}
              value={details.notes || ""}
              InputProps={{ readOnly: true }}
              sx={{ mt: 2 }}
            />
          </>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          variant="contained"
          onClick={onClose}
          sx={{ backgroundColor: "#888", minWidth: 120 }}
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
      <Dialog
        open={open}
        onClose={saving ? undefined : onClose}
        maxWidth="xl"
        fullWidth
        dir="rtl"
        PaperProps={{
          sx: {
            width: "94vw",
            maxWidth: "1500px",
            minHeight: "82vh",
            borderRadius: 3
          }
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 950,
            color: primaryColor,
            display: "flex",
            alignItems: "center",
            gap: 1
          }}
        >
          <DiscountIcon />
          نموذج طلب خصم
        </DialogTitle>

        <DialogContent dividers>
          {loadError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {loadError}
            </Alert>
          ) : null}

          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={1.5}>
              <Grid item xs={12} md={4}>
                <StudentField
                  label="اسم الطالب"
                  value={studentName}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <StudentField
                  label="رقم الهوية"
                  value={nationalId}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <StudentField
                  label="رقم الجوال"
                  value={studentTel}
                />
              </Grid>
            </Grid>
          </Paper>

          {loading ? (
            <Box sx={{ py: 5, textAlign: "center" }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>نوع الخصم</InputLabel>

                    <Select
                      value={selectedGuid}
                      label="نوع الخصم"
                      onChange={handleTypeChange}
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

                <Grid item xs={12} md={3}>
                  <TextField
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

                <Grid item xs={12} md={3}>
                  <Button
                    component="label"
                    fullWidth
                    variant="outlined"
                    startIcon={<AttachFileIcon />}
                    disabled={!selectedType}
                    sx={{
                      height: 56,
                      color: selectedType?.requiresAttachment
                        ? accentColor
                        : primaryColor,
                      borderColor: selectedType?.requiresAttachment
                        ? accentColor
                        : primaryColor
                    }}
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
                    <Button
                      color="inherit"
                      size="small"
                      onClick={() => setPromoOpen(true)}
                    >
                      تعديل الطلاب
                    </Button>
                  }
                  sx={{ mt: 2 }}
                >
                  عدد طلاب الخصم الترويجي: {promoStudents.length}،
                  إجمالي الخصم:{" "}
                  {(promoStudents.length * 250).toFixed(2)} ريال
                </Alert>
              ) : null}

              <TextField
                fullWidth
                multiline
                minRows={4}
                label="ملاحظة مقدم الطلب"
                value={requesterNote}
                onChange={(event) =>
                  setRequesterNote(
                    event.target.value.slice(0, 1000)
                  )
                }
                helperText={`${requesterNote.length}/1000`}
                sx={{ mt: 2 }}
              />

              <Divider sx={{ my: 2 }}>
                <Typography
                  sx={{
                    fontWeight: 950,
                    color: primaryColor
                  }}
                >
                  طلبات الخصم السابقة
                </Typography>
              </Divider>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell align="center">التاريخ</TableCell>
                      <TableCell align="center">
                        مقدم الطلب
                      </TableCell>
                      <TableCell align="center">
                        نوع الخصم
                      </TableCell>
                      <TableCell align="center">الحالة</TableCell>
                      <TableCell align="center">البيان</TableCell>
                      <TableCell align="center">طلاب الخصم</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {history.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
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

                          <TableCell align="center">
                            {item.requestedBy || "-"}
                          </TableCell>

                          <TableCell align="center">
                            {item.discountName || "-"}
                          </TableCell>

                          <TableCell align="center">
                            {item.statusName || "-"}
                          </TableCell>

                          <TableCell align="center">
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
                                sx={{
                                  backgroundColor: primaryColor,
                                  minWidth: 90
                                }}
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

        <DialogActions sx={{ px: 3, py: 2 }}>
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
            sx={{
              backgroundColor: primaryColor,
              minWidth: 140
            }}
          >
            حفظ الطلب
          </Button>

          <Button
            onClick={onClose}
            disabled={saving}
            sx={{
              color: "#333",
              minWidth: 90,
              fontWeight: 900
            }}
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