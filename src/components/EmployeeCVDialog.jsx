import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  Grid,
  TextField,
  Typography,
  Divider,
  Alert,
  CircularProgress,
  MenuItem,
  IconButton,
  Paper,
  Chip,
  Stack
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import Swal from "sweetalert2";

const API_URL = "https://filesregsiteration.sstli.com/erp/EmployeeCV.php";

const emptyItem = {
  title: "",
  details: "",
  level: ""
};

const languageLevels = ["ضعيف", "جيد", "جيد جدًا", "ممتاز"];

const inputSx = {
  direction: "rtl",
  textAlign: "start",
  "& .MuiInputBase-root": {
    direction: "rtl",
    textAlign: "start",
    borderRadius: "14px",
    backgroundColor: "#fff"
  },
  "& .MuiInputBase-input": {
    direction: "rtl",
    textAlign: "start"
  },
  "& .MuiInputBase-inputMultiline": {
    direction: "rtl",
    textAlign: "start"
  },
  "& textarea": {
    direction: "rtl",
    textAlign: "start"
  },
  "& .MuiFormHelperText-root": {
    direction: "rtl",
    textAlign: "start",
    marginInlineStart: 0
  }
};

const isEmpty = (value) => {
  return String(value || "").trim() === "";
};

const parseItems = (value, isLanguage = false) => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "object" && item !== null) {
          return {
            title: item.title || item.name || "",
            details: item.details || item.description || "",
            level: item.level || ""
          };
        }

        const text = String(item || "").trim();
        if (!text) return null;

        const parts = text.split("\n").map((x) => x.trim()).filter(Boolean);

        if (isLanguage) {
          const first = parts[0] || "";
          const maybeParts = first.split("-").map((x) => x.trim());

          return {
            title: maybeParts[0] || first,
            level: maybeParts[1] || "",
            details: parts.slice(1).join("\n")
          };
        }

        return {
          title: parts[0] || "",
          details: parts.slice(1).join("\n"),
          level: ""
        };
      })
      .filter((x) => x && (x.title || x.details || x.level));
  }

  return String(value)
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => ({
      title: x,
      details: "",
      level: ""
    }));
};

const serializeItemsToArray = (items, isLanguage = false) => {
  return (items || [])
    .map((item) => {
      const title = String(item.title || "").trim();
      const details = String(item.details || "").trim();
      const level = String(item.level || "").trim();

      if (!title && !details && !level) return "";

      if (isLanguage) {
        let text = title;

        if (level) {
          text = text ? `${text} - ${level}` : level;
        }

        if (details) {
          text = text ? `${text}\n${details}` : details;
        }

        return text;
      }

      if (title && details) return `${title}\n${details}`;
      return title || details;
    })
    .filter(Boolean);
};

const serializeItemsToText = (items) => {
  return serializeItemsToArray(items).join("\n\n--------------------\n\n");
};

const SectionTitle = ({ title, subtitle }) => {
  return (
    <Box sx={{ mb: 2, direction: "rtl", textAlign: "start" }}>
      <Typography
        sx={{
          fontSize: 18,
          fontWeight: 900,
          color: "#111827",
          textAlign: "start"
        }}
      >
        {title}
      </Typography>

      {subtitle && (
        <Typography
          sx={{
            mt: 0.5,
            fontSize: 13,
            color: "#6b7280",
            textAlign: "start",
            lineHeight: 1.8
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  );
};

const validateItems = (items, withLevel = false) => {
  if (!items || items.length === 0) {
    return false;
  }

  return items.every((item) => {
    const hasTitle = !isEmpty(item.title);
    const hasDetails = !isEmpty(item.details);

    if (withLevel) {
      const hasLevel = !isEmpty(item.level);
      return hasTitle && hasLevel && hasDetails;
    }

    return hasTitle && hasDetails;
  });
};

const DynamicItemsSection = ({
  title,
  subtitle,
  titleLabel,
  detailsLabel,
  addText,
  items,
  setItems,
  withLevel = false,
  submitted = false,
  requiredMessage = "هذا القسم مطلوب"
}) => {
  const [draft, setDraft] = useState(emptyItem);
  const [draftError, setDraftError] = useState("");

  const sectionInvalid = submitted && !validateItems(items, withLevel);

  const addItem = () => {
    const titleValue = draft.title.trim();
    const detailsValue = draft.details.trim();
    const levelValue = draft.level.trim();

    if (!titleValue) {
      setDraftError(`من فضلك اكتب ${titleLabel}`);
      return;
    }

    if (withLevel && !levelValue) {
      setDraftError("من فضلك اختر المستوى");
      return;
    }

    if (!detailsValue) {
      setDraftError(`من فضلك اكتب ${detailsLabel}`);
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        title: titleValue,
        details: detailsValue,
        level: levelValue
      }
    ]);

    setDraft(emptyItem);
    setDraftError("");
  };

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: value
            }
          : item
      )
    );
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: "18px",
        border: sectionInvalid ? "2px solid #d32f2f" : "1px solid #e5e7eb",
        background: "#fff",
        direction: "rtl",
        textAlign: "start"
      }}
    >
      <SectionTitle title={title} subtitle={subtitle} />

      {sectionInvalid && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "12px" }}>
          {requiredMessage}، ويجب إكمال كل الحقول داخل كل عنصر.
        </Alert>
      )}

      {draftError && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: "12px" }}>
          {draftError}
        </Alert>
      )}

      <Grid container spacing={1.5}>
        <Grid item xs={12} md={withLevel ? 4 : 5}>
          <TextField
            fullWidth
            required
            label={titleLabel}
            value={draft.title}
            onChange={(e) => {
              setDraftError("");
              setDraft((prev) => ({
                ...prev,
                title: e.target.value
              }));
            }}
            error={!!draftError && isEmpty(draft.title)}
            sx={inputSx}
          />
        </Grid>

        {withLevel && (
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              required
              label="المستوى"
              value={draft.level}
              onChange={(e) => {
                setDraftError("");
                setDraft((prev) => ({
                  ...prev,
                  level: e.target.value
                }));
              }}
              error={!!draftError && isEmpty(draft.level)}
              sx={inputSx}
            >
              {languageLevels.map((level) => (
                <MenuItem key={level} value={level}>
                  {level}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        )}

        <Grid item xs={12} md={withLevel ? 5 : 7}>
          <TextField
            fullWidth
            required
            multiline
            minRows={2}
            label={detailsLabel}
            value={draft.details}
            onChange={(e) => {
              setDraftError("");
              setDraft((prev) => ({
                ...prev,
                details: e.target.value
              }));
            }}
            error={!!draftError && isEmpty(draft.details)}
            sx={inputSx}
          />
        </Grid>

        <Grid item xs={12}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={addItem}
            sx={{
              borderRadius: "12px",
              fontWeight: 900,
              px: 2.5,
              textTransform: "none",
              borderColor: "#057445",
              color: "#057445",
              "&:hover": {
                borderColor: "#04633b",
                backgroundColor: "rgba(5, 116, 69, 0.06)"
              }
            }}
          >
            {addText}
          </Button>
        </Grid>
      </Grid>

      {items.length > 0 && (
        <Box sx={{ mt: 2.5 }}>
          <Stack spacing={1.5}>
            {items.map((item, index) => {
              const titleError = submitted && isEmpty(item.title);
              const detailsError = submitted && isEmpty(item.details);
              const levelError = submitted && withLevel && isEmpty(item.level);

              return (
                <Paper
                  key={index}
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: "14px",
                    border:
                      titleError || detailsError || levelError
                        ? "2px solid #d32f2f"
                        : "1px solid #e5e7eb",
                    backgroundColor: "#f9fafb",
                    direction: "rtl",
                    textAlign: "start"
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 1.5
                    }}
                  >
                    <Grid container spacing={1.5} sx={{ flex: 1 }}>
                      <Grid item xs={12} md={withLevel ? 4 : 5}>
                        <TextField
                          fullWidth
                          required
                          size="small"
                          label={titleLabel}
                          value={item.title}
                          onChange={(e) =>
                            updateItem(index, "title", e.target.value)
                          }
                          error={titleError}
                          helperText={titleError ? "مطلوب" : ""}
                          sx={inputSx}
                        />
                      </Grid>

                      {withLevel && (
                        <Grid item xs={12} md={3}>
                          <TextField
                            select
                            fullWidth
                            required
                            size="small"
                            label="المستوى"
                            value={item.level}
                            onChange={(e) =>
                              updateItem(index, "level", e.target.value)
                            }
                            error={levelError}
                            helperText={levelError ? "مطلوب" : ""}
                            sx={inputSx}
                          >
                            {languageLevels.map((level) => (
                              <MenuItem key={level} value={level}>
                                {level}
                              </MenuItem>
                            ))}
                          </TextField>
                        </Grid>
                      )}

                      <Grid item xs={12} md={withLevel ? 5 : 7}>
                        <TextField
                          fullWidth
                          required
                          size="small"
                          multiline
                          minRows={2}
                          label={detailsLabel}
                          value={item.details}
                          onChange={(e) =>
                            updateItem(index, "details", e.target.value)
                          }
                          error={detailsError}
                          helperText={detailsError ? "مطلوب" : ""}
                          sx={inputSx}
                        />
                      </Grid>
                    </Grid>

                    <IconButton
                      onClick={() => removeItem(index)}
                      sx={{
                        color: "#8f171a",
                        backgroundColor: "rgba(143, 23, 26, 0.08)",
                        mt: 0.5,
                        "&:hover": {
                          backgroundColor: "rgba(143, 23, 26, 0.14)"
                        }
                      }}
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  </Box>
                </Paper>
              );
            })}
          </Stack>
        </Box>
      )}
    </Paper>
  );
};

const EmployeeCVDialog = ({ user, initialData, onSubmitted }) => {
  const [form, setForm] = useState({
    fullName: "",
    mobile: "",
    email: "",
    birthDate: "",
    birthCity: "",
    graduationDate: "",
    qualification: "",
    specialization: "",
    university: "",
    professionalSummary: ""
  });

  const [experienceItems, setExperienceItems] = useState([]);
  const [courseItems, setCourseItems] = useState([]);
  const [technicalSkillItems, setTechnicalSkillItems] = useState([]);
  const [softSkillItems, setSoftSkillItems] = useState([]);
  const [languageItems, setLanguageItems] = useState([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!user) return;

    setForm((prev) => ({
      ...prev,
      fullName: user.userName || user.name || prev.fullName || "",
      mobile: user.mobile || user.phone || prev.mobile || "",
      email: user.email || prev.email || ""
    }));
  }, [user]);

  useEffect(() => {
    if (!initialData) return;

    setForm({
      fullName: initialData.FullName || "",
      mobile: initialData.Mobile || "",
      email: initialData.Email || "",
      birthDate: initialData.BirthDate || "",
      birthCity: initialData.BirthCity || "",
      graduationDate: initialData.GraduationDate || "",
      qualification: initialData.Qualification || "",
      specialization: initialData.Specialization || "",
      university: initialData.University || "",
      professionalSummary: initialData.ProfessionalSummary || ""
    });

    setExperienceItems(parseItems(initialData.ProfessionalExperience));
    setCourseItems(parseItems(initialData.CoursesJson));
    setTechnicalSkillItems(parseItems(initialData.TechnicalSkillsJson));
    setSoftSkillItems(parseItems(initialData.SoftSkillsJson));
    setLanguageItems(parseItems(initialData.LanguagesJson, true));
  }, [initialData]);

  const setValue = (name, value) => {
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const fieldError = (name) => {
    return submitted && isEmpty(form[name]);
  };

  const validate = () => {
    if (isEmpty(form.fullName)) return "الاسم بالكامل مطلوب";
    if (isEmpty(form.mobile)) return "رقم الجوال مطلوب";
    if (isEmpty(form.email)) return "البريد الإلكتروني مطلوب";
    if (isEmpty(form.birthDate)) return "تاريخ الميلاد مطلوب";
    if (isEmpty(form.birthCity)) return "مدينة الميلاد مطلوبة";
    if (isEmpty(form.graduationDate)) return "تاريخ التخرج مطلوب";
    if (isEmpty(form.qualification)) return "المؤهل الدراسي مطلوب";
    if (isEmpty(form.specialization)) return "التخصص مطلوب";
    if (isEmpty(form.university)) return "الجامعة / الجهة التعليمية مطلوبة";
    if (isEmpty(form.professionalSummary)) return "النبذة المهنية مطلوبة";

    if (!validateItems(experienceItems)) {
      return "الخبرات المهنية مطلوبة، ويجب إضافة خبرة واحدة على الأقل مع العنوان والتفاصيل";
    }

    if (!validateItems(courseItems)) {
      return "الدورات التدريبية مطلوبة، ويجب إضافة دورة واحدة على الأقل مع الاسم والتفاصيل";
    }

    if (!validateItems(technicalSkillItems)) {
      return "مهارات العمل / المهارات التقنية مطلوبة، ويجب إضافة مهارة واحدة على الأقل مع الاسم والتفاصيل";
    }

    if (!validateItems(softSkillItems)) {
      return "المهارات الشخصية مطلوبة، ويجب إضافة مهارة واحدة على الأقل مع الاسم والتفاصيل";
    }

    if (!validateItems(languageItems, true)) {
      return "اللغات مطلوبة، ويجب إضافة لغة واحدة على الأقل مع اللغة والمستوى والتفاصيل";
    }

    return "";
  };

  const handleSave = async () => {
    setSubmitted(true);
    setError("");

    const msg = validate();

    if (msg) {
      setError(msg);
      return;
    }

    const userGuid = user?.guid;

    if (!userGuid) {
      setError("لم يتم العثور على User Guid");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        action: "save",
        userGuid,
        fullName: form.fullName,
        mobile: form.mobile,
        email: form.email,
        birthDate: form.birthDate,
        birthCity: form.birthCity,
        graduationDate: form.graduationDate,
        qualification: form.qualification,
        specialization: form.specialization,
        university: form.university,
        professionalSummary: form.professionalSummary,

        professionalExperience: serializeItemsToText(experienceItems),
        courses: serializeItemsToArray(courseItems),
        technicalSkills: serializeItemsToArray(technicalSkillItems),
        softSkills: serializeItemsToArray(softSkillItems),
        languages: serializeItemsToArray(languageItems, true)
      };

      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message || "حدث خطأ أثناء حفظ البيانات");
        return;
      }

      await Swal.fire({
        icon: "success",
        title: "تم الحفظ",
        text: "تم حفظ بيانات السيرة الذاتية بنجاح",
        confirmButtonText: "تمام"
      });

      if (onSubmitted) onSubmitted();
    } catch (err) {
      console.error(err);
      setError("تعذر الاتصال بالسيرفر");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open
      fullWidth
      maxWidth="lg"
      disableEscapeKeyDown
      PaperProps={{
        sx: {
          width: "97%",
          maxWidth: "1220px",
          height: "92vh",
          borderRadius: "24px",
          direction: "rtl",
          textAlign: "start",
          fontFamily: '"Cairo", sans-serif',
          overflow: "hidden"
        }
      }}
    >
      <DialogContent
        sx={{
          p: 0,
          direction: "rtl",
          textAlign: "start",
          backgroundColor: "#f3f4f6",
          overflow: "hidden"
        }}
      >
        <Box
          sx={{
            background:
              "linear-gradient(135deg, #057445 0%, #04633b 55%, #8f171a 100%)",
            color: "#fff",
            p: 3,
            direction: "rtl",
            textAlign: "start"
          }}
        >
          <Chip
            label="كل الحقول مطلوبة"
            sx={{
              mb: 1.5,
              color: "#fff",
              borderColor: "rgba(255,255,255,0.5)",
              backgroundColor: "rgba(255,255,255,0.12)",
              fontWeight: 900,
              direction: "rtl",
              textAlign: "start"
            }}
          />

          <Typography
            sx={{
              fontSize: { xs: 24, md: 31 },
              fontWeight: 900,
              textAlign: "start",
              lineHeight: 1.25
            }}
          >
            بيانات السيرة الذاتية للموظف
          </Typography>

          <Typography
            sx={{
              mt: 1,
              opacity: 0.95,
              textAlign: "start",
              fontSize: 15,
              maxWidth: 900,
              lineHeight: 1.8
            }}
          >
            من فضلك أكمل جميع بيانات السيرة الذاتية لفتح النظام. لن يتم الحفظ إلا بعد استكمال كل الحقول.
          </Typography>
        </Box>

        <Box
          sx={{
            p: { xs: 2, md: 3 },
            height: "calc(92vh - 142px)",
            overflowY: "auto",
            overflowX: "hidden",
            direction: "rtl",
            textAlign: "start"
          }}
        >
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 2,
                direction: "rtl",
                textAlign: "start",
                borderRadius: "14px"
              }}
            >
              {error}
            </Alert>
          )}

          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: "18px",
              border: "1px solid #e5e7eb",
              background: "#fff",
              mb: 2.5,
              direction: "rtl",
              textAlign: "start"
            }}
          >
            <SectionTitle
              title="البيانات الشخصية"
              subtitle="جميع الحقول التالية مطلوبة."
            />

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  required
                  label="الاسم بالكامل"
                  value={form.fullName}
                  onChange={(e) => setValue("fullName", e.target.value)}
                  error={fieldError("fullName")}
                  helperText={fieldError("fullName") ? "مطلوب" : ""}
                  sx={inputSx}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  required
                  label="رقم الجوال"
                  inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }}
                  value={form.mobile}
                  onChange={(e) => setValue("mobile", e.target.value)}
                  error={fieldError("mobile")}
                  helperText={fieldError("mobile") ? "مطلوب" : ""}
                  sx={inputSx}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  required
                  label="البريد الإلكتروني"
                  inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }}
                  value={form.email}
                  onChange={(e) => setValue("email", e.target.value)}
                  error={fieldError("email")}
                  helperText={fieldError("email") ? "مطلوب" : ""}
                  sx={inputSx}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  required
                  type="date"
                  label="تاريخ الميلاد"
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }}
                  value={form.birthDate}
                  onChange={(e) => setValue("birthDate", e.target.value)}
                  error={fieldError("birthDate")}
                  helperText={fieldError("birthDate") ? "مطلوب" : ""}
                  sx={inputSx}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  required
                  label="مدينة الميلاد"
                  placeholder="مثال: الدمام"
                  value={form.birthCity}
                  onChange={(e) => setValue("birthCity", e.target.value)}
                  error={fieldError("birthCity")}
                  helperText={fieldError("birthCity") ? "مطلوب" : ""}
                  sx={inputSx}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  required
                  type="date"
                  label="تاريخ التخرج"
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }}
                  value={form.graduationDate}
                  onChange={(e) => setValue("graduationDate", e.target.value)}
                  error={fieldError("graduationDate")}
                  helperText={fieldError("graduationDate") ? "مطلوب" : ""}
                  sx={inputSx}
                />
              </Grid>
            </Grid>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: "18px",
              border: "1px solid #e5e7eb",
              background: "#fff",
              mb: 2.5,
              direction: "rtl",
              textAlign: "start"
            }}
          >
            <SectionTitle
              title="المؤهل الدراسي"
              subtitle="جميع الحقول التالية مطلوبة."
            />

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  required
                  label="المؤهل الدراسي"
                  value={form.qualification}
                  onChange={(e) => setValue("qualification", e.target.value)}
                  error={fieldError("qualification")}
                  helperText={fieldError("qualification") ? "مطلوب" : ""}
                  sx={inputSx}
                >
                  <MenuItem value="ثانوي">ثانوي</MenuItem>
                  <MenuItem value="دبلوم">دبلوم</MenuItem>
                  <MenuItem value="بكالوريوس">بكالوريوس</MenuItem>
                  <MenuItem value="ماجستير">ماجستير</MenuItem>
                  <MenuItem value="دكتوراه">دكتوراه</MenuItem>
                  <MenuItem value="أخرى">أخرى</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  required
                  label="التخصص"
                  placeholder="مثال: إدارة أعمال"
                  value={form.specialization}
                  onChange={(e) => setValue("specialization", e.target.value)}
                  error={fieldError("specialization")}
                  helperText={fieldError("specialization") ? "مطلوب" : ""}
                  sx={inputSx}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  required
                  label="الجامعة / الجهة التعليمية"
                  placeholder="مثال: جامعة الملك فيصل"
                  value={form.university}
                  onChange={(e) => setValue("university", e.target.value)}
                  error={fieldError("university")}
                  helperText={fieldError("university") ? "مطلوب" : ""}
                  sx={inputSx}
                />
              </Grid>
            </Grid>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: "18px",
              border: "1px solid #e5e7eb",
              background: "#fff",
              mb: 2.5,
              direction: "rtl",
              textAlign: "start"
            }}
          >
            <SectionTitle
              title="النبذة المهنية"
              subtitle="هذا الحقل مطلوب."
            />

            <TextField
              fullWidth
              required
              multiline
              minRows={4}
              label="النبذة المهنية"
              placeholder="مثال: لدي خبرة في خدمة العملاء، تسجيل الطلاب، إعداد التقارير اليومية، ومتابعة العمليات الإدارية..."
              value={form.professionalSummary}
              onChange={(e) => setValue("professionalSummary", e.target.value)}
              error={fieldError("professionalSummary")}
              helperText={fieldError("professionalSummary") ? "مطلوب" : ""}
              sx={inputSx}
            />
          </Paper>

          <Box sx={{ mb: 2.5 }}>
            <DynamicItemsSection
              title="الخبرات المهنية"
              subtitle="مطلوب إضافة خبرة واحدة على الأقل، وكل خبرة يجب أن تحتوي على مسمى وتفاصيل."
              titleLabel="مسمى الخبرة"
              detailsLabel="تفاصيل الخبرة"
              addText="إضافة خبرة"
              items={experienceItems}
              setItems={setExperienceItems}
              submitted={submitted}
              requiredMessage="الخبرات المهنية مطلوبة"
            />
          </Box>

          <Box sx={{ mb: 2.5 }}>
            <DynamicItemsSection
              title="الدورات التدريبية"
              subtitle="مطلوب إضافة دورة واحدة على الأقل، وكل دورة يجب أن تحتوي على اسم وتفاصيل."
              titleLabel="اسم الدورة"
              detailsLabel="تفاصيل الدورة"
              addText="إضافة دورة"
              items={courseItems}
              setItems={setCourseItems}
              submitted={submitted}
              requiredMessage="الدورات التدريبية مطلوبة"
            />
          </Box>

          <Grid container spacing={2.5}>
            <Grid item xs={12} md={6}>
              <DynamicItemsSection
                title="مهارات العمل / المهارات التقنية"
                subtitle="مطلوب إضافة مهارة واحدة على الأقل، وكل مهارة يجب أن تحتوي على اسم وتفاصيل."
                titleLabel="اسم المهارة"
                detailsLabel="تفاصيل المهارة"
                addText="إضافة مهارة"
                items={technicalSkillItems}
                setItems={setTechnicalSkillItems}
                submitted={submitted}
                requiredMessage="مهارات العمل / المهارات التقنية مطلوبة"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <DynamicItemsSection
                title="المهارات الشخصية"
                subtitle="مطلوب إضافة مهارة شخصية واحدة على الأقل، وكل مهارة يجب أن تحتوي على اسم وتفاصيل."
                titleLabel="اسم المهارة"
                detailsLabel="تفاصيل المهارة"
                addText="إضافة مهارة شخصية"
                items={softSkillItems}
                setItems={setSoftSkillItems}
                submitted={submitted}
                requiredMessage="المهارات الشخصية مطلوبة"
              />
            </Grid>

            <Grid item xs={12}>
              <DynamicItemsSection
                title="اللغات"
                subtitle="مطلوب إضافة لغة واحدة على الأقل، وكل لغة يجب أن تحتوي على اللغة والمستوى والتفاصيل."
                titleLabel="اللغة"
                detailsLabel="تفاصيل إضافية"
                addText="إضافة لغة"
                items={languageItems}
                setItems={setLanguageItems}
                withLevel
                submitted={submitted}
                requiredMessage="اللغات مطلوبة"
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Box
            sx={{
              position: "sticky",
              bottom: 0,
              zIndex: 2,
              background:
                "linear-gradient(180deg, rgba(243,244,246,0.75) 0%, #f3f4f6 35%)",
              pt: 2,
              pb: 1,
              display: "flex",
              justifyContent: "flex-end",
              gap: 1,
              direction: "rtl"
            }}
          >
            <Button
              variant="contained"
              disabled={saving}
              onClick={handleSave}
              sx={{
                minWidth: 220,
                height: 48,
                borderRadius: "14px",
                backgroundColor: "#057445",
                fontWeight: 900,
                textTransform: "none",
                fontSize: 15,
                "&:hover": {
                  backgroundColor: "#04633b"
                }
              }}
            >
              {saving ? (
                <>
                  <CircularProgress size={20} sx={{ color: "#fff", marginInlineEnd: 1 }} />
                  جاري الحفظ...
                </>
              ) : (
                "حفظ وفتح النظام"
              )}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeCVDialog;