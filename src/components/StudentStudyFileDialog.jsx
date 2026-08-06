import React, { useEffect, useMemo, useState } from "react";
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
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FolderSharedIcon from "@mui/icons-material/FolderShared";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import RefreshIcon from "@mui/icons-material/Refresh";
import SchoolIcon from "@mui/icons-material/School";
import GroupsIcon from "@mui/icons-material/Groups";
import EventIcon from "@mui/icons-material/Event";
import NotesIcon from "@mui/icons-material/Notes";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const primaryColor = "#057546";
const primaryDark = "#034d31";
const primaryLight = "#e6f3ee";
const accentColor = "#ae1e21";
const whiteColor = "#fefefe";
const softBg = "#fefefe";
const textColor = "#1f2d3d";
const dangerColor = accentColor;
const warningColor = accentColor;
const noGuid = "00000000-0000-0000-0000-000000000000";

const safeText = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
};

const pick = (obj, ...names) => {
  for (const name of names) {
    const value = obj?.[name];
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  return "";
};

const showWarning = (message) =>
  Swal.fire({
    icon: "warning",
    title: "تنبيه",
    text: message,
    confirmButtonText: "حسناً",
    confirmButtonColor: warningColor
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

const FieldBox = ({ label, value, icon, strong = false, color = textColor }) => (
  <Paper
    elevation={0}
    sx={{
      p: 1.4,
      borderRadius: 3,
      border: `1px solid ${primaryLight}`,
      background: strong
        ? `linear-gradient(135deg, #fff6f6 0%, ${whiteColor} 100%)`
        : `linear-gradient(135deg, #f4fbf7 0%, ${whiteColor} 100%)`,
      height: "100%",
      position: "relative",
      overflow: "hidden"
    }}
  >
    <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mb: 0.7 }}>
      {icon}
      <Typography sx={{ color: primaryColor, fontWeight: 950, fontSize: "0.78rem" }}>
        {label}
      </Typography>
    </Stack>
    <Tooltip title={safeText(value)} arrow>
      <Typography
        sx={{
          color,
          fontWeight: strong ? 1000 : 950,
          fontSize: strong ? "1rem" : "0.92rem",
          lineHeight: 1.7,
          textAlign: "left",
          direction: "ltr",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis"
        }}
      >
        {safeText(value)}
      </Typography>
    </Tooltip>
  </Paper>
);

const statusChipSx = (value) => {
  const text = String(value || "");

  if (text.includes("مستمر") || text.includes("نشط")) {
    return { color: primaryColor, backgroundColor: "#e6f3ee" };
  }

  if (text.includes("موقوف") || text.includes("منتهي") || text.includes("منتهى")) {
    return { color: dangerColor, backgroundColor: "#fff4f4" };
  }

  return { color: warningColor, backgroundColor: "#fff4f4" };
};

const StudentStudyFileDialog = ({ open, onClose, student, apiBaseUrl }) => {
  const [loading, setLoading] = useState(false);
  const [savingClass, setSavingClass] = useState(false);
  const [studyInfo, setStudyInfo] = useState(null);
  const [manualClassGuid, setManualClassGuid] = useState("");

  const studentGuid = useMemo(
    () => pick(student, "accountGuid", "AccountGuid", "studentGuid", "StudentGuid"),
    [student]
  );
  const diplomGuid = useMemo(() => pick(student, "diplomGuid", "DiplomGuid"), [student]);
  const branchGuid = useMemo(
    () => pick(student, "branchGuid", "BranchGuid", "studyBranchGuid", "StudyBranchGuid"),
    [student]
  );
  const nationalId = useMemo(() => pick(student, "nationalId", "NationalId"), [student]);

  const canLoad = Boolean(studentGuid && diplomGuid && branchGuid);

  const loadStudyInfo = async () => {
    if (!open || !student) return;

    if (!canLoad) {
      setStudyInfo(null);
      showWarning("لا يمكن قراءة بيانات الملف التدريبي: ناقص حساب الطالب أو الدبلوم أو الفرع.");
      return;
    }

    try {
      setLoading(true);
      setStudyInfo(null);

      const params = new URLSearchParams({
        studentGuid,
        diplomGuid,
        branchGuid
      });

      const response = await fetch(`${apiBaseUrl}/api/student-study-file/info?${params.toString()}`);
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message || result?.error || "تعذر تحميل الملف التدريبي");
      }

      setStudyInfo(result?.data || null);
      setManualClassGuid(result?.data?.classGuid || "");
    } catch (error) {
      showError(error.message || "حدث خطأ أثناء تحميل الملف التدريبي");
      setStudyInfo(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) loadStudyInfo();
    else {
      setStudyInfo(null);
      setManualClassGuid("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, studentGuid, diplomGuid, branchGuid]);

  const openAttachments = async () => {
    const id = String(nationalId || "").trim();

    if (!id) {
      showWarning("برجاء اختيار الطالب أولاً.");
      return;
    }

    if (!/^\d+$/.test(id)) {
      showWarning("رقم الهوية غير صحيح.");
      return;
    }

    try {
      const params = new URLSearchParams({ nationalId: id });
      const response = await fetch(`${apiBaseUrl}/api/student-study-file/attachments-url?${params.toString()}`);
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message || result?.error || "تعذر تجهيز رابط المرفقات");
      }

      const url = result?.url;
      if (!url) {
        showWarning("لم يتم تجهيز رابط المرفقات.");
        return;
      }

      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      showError(error.message || "حدث خطأ أثناء عرض المرفقات");
    }
  };

  const updateClass = async () => {
    const regType = String(studyInfo?.regType ?? "");

    if (regType !== "0") {
      showWarning("الملف التدريبي للطالب غير مسموح له ربط بشعبة.");
      return;
    }

    const classGuid = String(manualClassGuid || "").trim();

    if (!studyInfo?.guid || studyInfo.guid === noGuid) {
      showWarning("لا يمكن قراءة Guid الملف التدريبي.");
      return;
    }

    if (!classGuid || classGuid === noGuid) {
      showWarning("برجاء إدخال ClassGuid للشعبة المراد ربطها.");
      return;
    }

    const confirm = await Swal.fire({
      icon: "question",
      title: "ربط المتدرب بشعبة",
      text: "هل تريد ربط الطالب بالشعبة المحددة؟",
      showCancelButton: true,
      confirmButtonText: "نعم، ربط",
      cancelButtonText: "تراجع",
      confirmButtonColor: primaryColor,
      cancelButtonColor: "#777",
      reverseButtons: true
    });

    if (!confirm.isConfirmed) return;

    try {
      setSavingClass(true);

      const response = await fetch(`${apiBaseUrl}/api/student-study-file/class`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guid: studyInfo.guid,
          classGuid,
          isReg: true
        })
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message || result?.error || "تعذر ربط الطالب بالشعبة");
      }

      await showSuccess(result?.message || "تم ربط الطالب بالشعبة بنجاح");
      await loadStudyInfo();
    } catch (error) {
      showError(error.message || "حدث خطأ أثناء ربط الطالب بالشعبة");
    } finally {
      setSavingClass(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => !loading && !savingClass && onClose?.()}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 4,
          direction: "ltr",
          textAlign: "left",
          overflow: "hidden",
          border: `1px solid ${primaryLight}`,
          boxShadow: "0 18px 50px rgba(5,117,70,0.16)"
        }
      }}
    >
      <DialogTitle
        sx={{
          p: 0,
          borderBottom: `1px solid ${primaryDark}`,
          background: `linear-gradient(135deg, ${primaryColor}, ${primaryDark})`
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1.4 }}>
          <Stack direction="row" spacing={1.2} alignItems="center">
            <IconButton
              onClick={onClose}
              disabled={loading || savingClass}
              sx={{ color: accentColor, backgroundColor: whiteColor, "&:hover": { backgroundColor: "#fff4f4" } }}
            >
              <CloseIcon />
            </IconButton>
            <Box>
              <Typography sx={{ fontWeight: 1000, color: whiteColor, fontSize: "1.15rem" }}>
                الملف التدريبي
              </Typography>
              <Typography sx={{ fontWeight: 800, color: "#e6f3ee", fontSize: "0.82rem" }}>
                بيانات الدراسة + عرض مرفقات الطالب
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              icon={<SchoolIcon />}
              label={safeText(studyInfo?.stautName || pick(student, "statusName", "stautName"))}
              sx={{ fontWeight: 950, borderRadius: 2, ...statusChipSx(studyInfo?.stautName) }}
            />
            <Button
              size="small"
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadStudyInfo}
              disabled={loading || savingClass}
              sx={{
                borderRadius: 2,
                fontWeight: 950,
                direction: "ltr",
                color: whiteColor,
                borderColor: "#e6f3ee",
                "&:hover": { borderColor: whiteColor, backgroundColor: "rgba(255,255,255,0.10)" }
              }}
            >
              تحديث
            </Button>
          </Stack>
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={{ background: `linear-gradient(180deg, ${softBg} 0%, #f4fbf7 100%)`, p: 2 }}>
        {loading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 7 }}>
            <CircularProgress />
            <Typography sx={{ mt: 2, fontWeight: 950 }}>جاري تحميل الملف التدريبي...</Typography>
          </Stack>
        ) : !student ? (
          <Alert severity="warning" sx={{ borderRadius: 2, fontWeight: 900 }}>
            لا يوجد طالب محدد.
          </Alert>
        ) : (
          <Stack spacing={1.5}>
            <Paper elevation={0} sx={{ p: 1.5, borderRadius: 3, border: `1px solid ${primaryLight}`, backgroundColor: whiteColor }}>
              <Typography
                sx={{
                  fontWeight: 1000,
                  color: textColor,
                  mb: 1.2,
                  px: 1.5,
                  py: 0.8,
                  borderRadius: 2,
                  textAlign: "left",
                  background: `linear-gradient(135deg, ${primaryColor}, ${primaryDark})`,
                  color: whiteColor
                }}
              >
                بيانات الطالب
              </Typography>

              <Grid container spacing={1.2}>
                <Grid item xs={12} md={5}>
                  <FieldBox label="اسم الطالب" value={pick(student, "studentName", "StudentName")} strong color="#0d47a1" />
                </Grid>
                <Grid item xs={12} md={3.5}>
                  <FieldBox label="رقم الهوية" value={nationalId} strong />
                </Grid>
                <Grid item xs={12} md={3.5}>
                  <FieldBox label="رقم الجوال" value={pick(student, "studentTel", "StudentTel", "tel", "Tel")} strong />
                </Grid>
              </Grid>
            </Paper>

            <Paper elevation={0} sx={{ p: 1.5, borderRadius: 3, border: `1px solid ${primaryLight}`, backgroundColor: whiteColor }}>
              <Typography
                sx={{
                  fontWeight: 1000,
                  color: textColor,
                  mb: 1.2,
                  px: 1.5,
                  py: 0.8,
                  borderRadius: 2,
                  textAlign: "left",
                  background: `linear-gradient(135deg, ${primaryColor}, ${primaryDark})`,
                  color: whiteColor
                }}
              >
                بيانات الدراسة
              </Typography>

              {studyInfo ? (
                <Grid container spacing={1.2}>
                  <Grid item xs={12} md={6}>
                    <FieldBox label="فرع الدراسة" value={pick(student, "branchName", "studyBranchName", "BranchName")} strong />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FieldBox label="الدبلوم / الدورة" value={pick(student, "diplomName", "DiplomName")} strong />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FieldBox label="الدفعة" value={studyInfo.batchName} icon={<EventIcon fontSize="small" />} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FieldBox label="المستوى" value={studyInfo.levelName} icon={<SchoolIcon fontSize="small" />} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FieldBox label="حالة التسجيل" value={studyInfo.stautName} strong color={statusChipSx(studyInfo.stautName).color} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FieldBox label="تاريخ البداية" value={studyInfo.start} icon={<EventIcon fontSize="small" />} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FieldBox label="تاريخ النهاية" value={studyInfo.end} icon={<EventIcon fontSize="small" />} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FieldBox label="الشعبة" value={studyInfo.className || "غير مربوط"} icon={<GroupsIcon fontSize="small" />} />
                  </Grid>
                  <Grid item xs={12}>
                    <FieldBox label="ملاحظات" value={studyInfo.notes} icon={<NotesIcon fontSize="small" />} />
                  </Grid>
                </Grid>
              ) : (
                <Alert severity="info" sx={{ borderRadius: 2, fontWeight: 900 }}>
                  لم يتم العثور على بيانات ملف تدريبي لهذا الطالب بنفس الفرع والدبلوم.
                </Alert>
              )}
            </Paper>

            {/* {studyInfo && (
              <Paper elevation={0} sx={{ p: 1.5, borderRadius: 3, border: `1px solid ${primaryLight}`, backgroundColor: whiteColor }}>
                <Typography sx={{ fontWeight: 1000, color: primaryDark, mb: 1 }}>
                  ربط المتدرب بشعبة
                </Typography>

                <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems="stretch">
                  <TextField
                    fullWidth
                    size="small"
                    label="ClassGuid"
                    value={manualClassGuid}
                    onChange={(e) => setManualClassGuid(e.target.value)}
                    disabled={savingClass || String(studyInfo.regType) !== "0"}
                    helperText={
                      String(studyInfo.regType) === "0"
                        ? "اكتب Guid الشعبة المراد ربطها، أو اربط لاحقاً بقائمة الشعب عند تجهيزها."
                        : "هذا الملف التدريبي غير مسموح له ربط بشعبة."
                    }
                    inputProps={{ style: { direction: "ltr", textAlign: "left", fontWeight: 900 } }}
                  />
                  <Button
                    variant="contained"
                    startIcon={savingClass ? <CircularProgress size={17} color="inherit" /> : <GroupsIcon />}
                    onClick={updateClass}
                    disabled={savingClass || String(studyInfo.regType) !== "0"}
                    sx={{
                      minWidth: 170,
                      borderRadius: 2,
                      fontWeight: 950,
                      direction: "ltr",
                      background: `linear-gradient(135deg, ${primaryColor}, ${primaryDark})`,
                      boxShadow: "none"
                    }}
                  >
                    ربط الشعبة
                  </Button>
                </Stack>
              </Paper>
            )} */}
          </Stack>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: 2,
          py: 1.4,
          borderTop: `1px solid ${primaryLight}`,
          backgroundColor: whiteColor,
          justifyContent: "space-between"
        }}
      >
        <Button
          onClick={openAttachments}
          startIcon={<AttachFileIcon />}
          disabled={!student || loading || savingClass}
          sx={{ fontWeight: 950, color: primaryColor, direction: "ltr" }}
        >
          عرض المرفقات
        </Button>

        <Button
          onClick={onClose}
          disabled={loading || savingClass}
          startIcon={<CloseIcon />}
          sx={{ fontWeight: 950, color: dangerColor, direction: "ltr" }}
        >
          خروج
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StudentStudyFileDialog;
