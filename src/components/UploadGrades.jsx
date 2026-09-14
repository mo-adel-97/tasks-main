import { navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from './NavigationShell';
import React, { useMemo, useState } from "react";


import {
  Box,
  Paper,
  Typography,
  Divider,
  Button,
  Alert,
  Stack,
  Chip,
  CircularProgress,
} from "@mui/material";

import UploadFileIcon from "@mui/icons-material/UploadFile";
import SchoolIcon from "@mui/icons-material/School";

// ✅ Excel reader
import * as XLSX from "xlsx";



// ✅ API Endpoint الحقيقي
const UPLOAD_URL = "https://filesregsiteration.sstli.com/erp/grades.php";

const UploadGrades = () => {
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  // صلاحية فتح الصفحة أصبحت من Form_Name + User_Premision عبر PrivateRoute.

  const [file, setFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // ✅ Structure validation state
  const [structureOk, setStructureOk] = useState(false);
  const [structureInfo, setStructureInfo] = useState(null); // { subjectsCount, headers }

  // ✅ Progress
  const [progress, setProgress] = useState({ total: 0, done: 0, failed: 0 });

  // =========================
  // Helpers (Structure Check)
  // =========================
  const normalizeHeader = (h) =>
    String(h ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " "); // unify spaces

  // ✅ يقبل: nationalid أو national id (مسافات/كيس مش فارق)
  const isNationalIdHeader = (h) => {
    const x = normalizeHeader(h);
    return x === "nationalid" || x === "national id";
  };

  const isValidNationalIdValue = (v) => {
    const s = String(v ?? "").trim();
    // يقبل أرقام فقط (10-20 رقم) - عدّل لو عندك شكل مختلف
    return /^\d{8,20}$/.test(s);
  };

  const parseGradeValue = (v) => {
    if (v === null || v === undefined || String(v).trim() === "") return null;
    const n = Number(v);
    if (Number.isNaN(n)) return null;
    return n;
  };

  const readExcelHeaders = async (excelFile) => {
    const buffer = await excelFile.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });

    const firstSheetName = workbook.SheetNames?.[0];
    if (!firstSheetName) throw new Error("الملف لا يحتوي على أي Sheets.");

    const sheet = workbook.Sheets[firstSheetName];

    // read rows as arrays
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    const headerRow = rows?.[0] || [];

    const headers = headerRow
      .map((c) => String(c ?? "").trim())
      .filter((v) => v !== "");

    if (headers.length === 0) throw new Error("أول صف (Header) فاضي.");

    return { headers, sheetName: firstSheetName };
  };

  const validateStructure = (headers) => {
    if (!headers || headers.length < 2) {
      throw new Error(
        "لازم يكون فيه nationalid / national id + عمود واحد على الأقل بعده."
      );
    }

    if (!isNationalIdHeader(headers[0])) {
      throw new Error("أول عمود لازم يكون اسمه nationalid أو national id.");
    }

    const rest = headers.slice(1);
    const emptyCols = rest.filter((h) => String(h ?? "").trim() === "");
    if (emptyCols.length > 0) {
      throw new Error("في أعمدة فاضية بعد nationalid — من فضلك سمّي كل الأعمدة.");
    }

    return {
      subjectsCount: rest.length,
      headers,
    };
  };

  const readExcelRows = async (excelFile) => {
    const buffer = await excelFile.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });

    const firstSheetName = workbook.SheetNames?.[0];
    if (!firstSheetName) throw new Error("الملف لا يحتوي على أي Sheets.");

    const sheet = workbook.Sheets[firstSheetName];

    // rows as arrays (header + data)
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    if (!rows || rows.length < 2) {
      throw new Error("لا يوجد بيانات (صفوف) بعد الهيدر.");
    }

    const headerRow = rows[0].map((c) => String(c ?? "").trim());
    const headers = headerRow.filter((v) => v !== "");

    // data rows
    const dataRows = rows.slice(1);

    return { headers, dataRows };
  };

  // =========================
  // Handlers
  // =========================
  const handleFileChange = async (e) => {
    const f = e.target.files?.[0] || null;

    setFile(f);
    setSuccessMsg("");
    setErrorMsg("");
    setStructureOk(false);
    setStructureInfo(null);
    setProgress({ total: 0, done: 0, failed: 0 });

    if (!f) return;

    // ✅ ext check
    const okExt = [".xls", ".xlsx"].some((ext) =>
      (f.name || "").toLowerCase().endsWith(ext)
    );
    if (!okExt) {
      setErrorMsg("الملف لازم يكون Excel بصيغة .xls أو .xlsx");
      return;
    }

    try {
      const { headers } = await readExcelHeaders(f);
      const info = validateStructure(headers);

      setStructureOk(true);
      setStructureInfo(info);
    } catch (err) {
      setStructureOk(false);
      setStructureInfo(null);
      setErrorMsg(err?.message || "فشل التحقق من هيكل الملف.");
    }
  };

  const postOneStudent = async ({ national_id, grades }) => {
    console.log("📡 POST:", UPLOAD_URL);
    console.log("📦 Payload:", { national_id, grades });

    let res;

    try {
      res = await fetch(UPLOAD_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          national_id,
          grades,
        }),
      });
    } catch (networkError) {
      console.error("Network/CORS Error:", networkError);
      throw new Error(
        "تعذر الاتصال بسيرفر رفع الدرجات. افحص CORS أو اتصال الـ API."
      );
    }

    const responseText = await res.text();

    console.log("HTTP Status:", res.status);
    console.log("Raw API Response:", responseText);

    let data = {};

    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      throw new Error(
        `السيرفر لم يرجع JSON صحيح. HTTP ${res.status}: ${responseText.substring(0, 300)}`
      );
    }

    if (!res.ok) {
      throw new Error(
        data?.message || `خطأ من السيرفر HTTP ${res.status}`
      );
    }

    if (data?.success === false) {
      throw new Error(
        data?.message || "السيرفر رفض رفع درجات الطالب."
      );
    }

    return data;
  };

  const handleUpload = async () => {
    console.log("🔥 handleUpload CLICKED");

    setSuccessMsg("");
    setErrorMsg("");

    if (!file) {
      setErrorMsg("من فضلك ارفع ملف الإكسل.");
      return;
    }

    if (!structureOk) {
      setErrorMsg("هيكل الملف غير صحيح. عدّل الملف قبل الرفع.");
      return;
    }

    try {
      console.log("1️⃣ بدء قراءة الملف:", file.name);

      setLoading(true);
      setProgress({ total: 0, done: 0, failed: 0 });

      const { headers, dataRows } = await readExcelRows(file);

      console.log("2️⃣ Headers:", headers);
      console.log("3️⃣ Rows:", dataRows);

      validateStructure(headers);

      const subjects = headers.slice(1);
      const rowsToSend = [];

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i] || [];
        const nationalIdRaw = row[0];

        // لو Excel رجّع الهوية كرقم بصيغة 1234567890.0
        const national_id = String(nationalIdRaw ?? "")
          .trim()
          .replace(/\.0$/, "");

        const isRowEmpty =
          national_id === "" &&
          row.slice(1).every((x) => String(x ?? "").trim() === "");

        if (isRowEmpty) continue;

        if (!isValidNationalIdValue(national_id)) {
          throw new Error(
            `صف رقم ${i + 2}: رقم الهوية غير صحيح أو فارغ (القيمة: "${national_id}")`
          );
        }

        const grades = {};

        for (let s = 0; s < subjects.length; s++) {
          const subjectName = subjects[s];
          const cell = row[s + 1];
          const grade = parseGradeValue(cell);

          if (grade !== null) {
            grades[subjectName] = grade;
          }
        }

        if (Object.keys(grades).length === 0) {
          throw new Error(
            `صف رقم ${i + 2}: لا توجد أي درجات صالحة للطالب ${national_id}`
          );
        }

        rowsToSend.push({
          national_id,
          grades,
        });
      }

      console.log("4️⃣ البيانات الجاهزة للإرسال:", rowsToSend);

      if (rowsToSend.length === 0) {
        throw new Error("لا يوجد صفوف صالحة للإرسال.");
      }

      setProgress({
        total: rowsToSend.length,
        done: 0,
        failed: 0,
      });

      let done = 0;
      let failed = 0;
      const failedStudents = [];

      for (let i = 0; i < rowsToSend.length; i++) {
        const student = rowsToSend[i];

        try {
          console.log(
            `⬆️ رفع الطالب ${i + 1}/${rowsToSend.length}`,
            student
          );

          const result = await postOneStudent(student);

          console.log("✅ API Result:", result);
          done += 1;
        } catch (e) {
          console.error(
            "❌ فشل الطالب:",
            student.national_id,
            e
          );

          failed += 1;

          failedStudents.push({
            national_id: student.national_id,
            error: e?.message || "Unknown error",
          });
        }

        setProgress({
          total: rowsToSend.length,
          done,
          failed,
        });
      }

      if (failed === 0) {
        setSuccessMsg(
          `✅ تم رفع الدرجات بنجاح لكل الطلاب (${done}).`
        );
      } else {
        console.error("Failed students:", failedStudents);

        setErrorMsg(
          `تم رفع ${done} طالب، وفشل ${failed} طالب. ` +
            `أول خطأ: ${failedStudents[0]?.national_id || ""} - ${
              failedStudents[0]?.error || ""
            }`
        );
      }
    } catch (err) {
      console.error("🔥 UPLOAD ERROR:", err);

      setErrorMsg(
        err?.message ||
          "حصل خطأ غير متوقع أثناء رفع الدرجات."
      );
    } finally {
      console.log("🏁 Upload finished");
      setLoading(false);
    }
  };

  return (
    <NavigationShell variant="standard" ><Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f8fbfa" }}>
      

      <Box
        sx={{
          flex: 1,
          p: {
            xs: 2,
            md: 4
          },
          direction: "rtl",
          ...navigationContentSx
        }}
      >
        <Paper
          sx={{
            p: { xs: 2.5, md: 4 },
            borderRadius: 3,
            boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
          >
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <SchoolIcon sx={{ color: "#80b49e" }} />
                <Typography
                  variant="h5"
                  sx={{
                    fontFamily: "Cairo",
                    fontWeight: 800,
                    color: "#2c3e50",
                  }}
                >
                  رفع الدرجات
                </Typography>
                <Chip
                  label="Excel"
                  size="small"
                  sx={{
                    ml: 1,
                    bgcolor: "#e8f5ef",
                    color: "#2c3e50",
                    fontFamily: "Cairo",
                    fontWeight: 700,
                  }}
                />
              </Stack>

              <Typography
                variant="body2"
                sx={{ mt: 1, fontFamily: "Cairo", color: "#607080" }}
              >
                اختر ملف الإكسل ثم تأكد من الهيكل قبل الرفع.
              </Typography>
            </Box>

            {progress.total > 0 && (
              <Chip
                label={`تم: ${progress.done} / ${progress.total} | فشل: ${progress.failed}`}
                sx={{ fontFamily: "Cairo", fontWeight: 700 }}
              />
            )}
          </Stack>

          <Divider sx={{ my: 3 }} />

          {/* Upload Area */}
          <Typography
            sx={{
              fontFamily: "Cairo",
              fontWeight: 800,
              mb: 1,
              color: "#2c3e50",
            }}
          >
            رفع ملف الإكسل
          </Typography>

          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 2,
              borderStyle: "dashed",
              bgcolor: "#fbfdfc",
            }}
          >
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <UploadFileIcon sx={{ color: "#80b49e" }} />
                <Typography sx={{ fontFamily: "Cairo", fontWeight: 700 }}>
                  ارفع ملف Excel (.xls / .xlsx)
                </Typography>
              </Stack>

              <Button
                component="label"
                variant="contained"
                disabled={loading}
                startIcon={<UploadFileIcon />}
                sx={{
                  fontFamily: "Cairo",
                  fontWeight: 800,
                  borderRadius: 2,
                  py: 1.2,
                  bgcolor: "#80b49e",
                  "&:hover": { bgcolor: "#6a9a87" },
                  width: { xs: "100%", md: "fit-content" },
                }}
              >
                اختيار ملف
                <input
                  hidden
                  type="file"
                  accept=".xls,.xlsx"
                  onChange={handleFileChange}
                />
              </Button>

              {file && (
                <Alert severity="success" sx={{ fontFamily: "Cairo" }}>
                  تم اختيار الملف: <b>{file.name}</b>
                </Alert>
              )}

              {file && structureOk && structureInfo && (
                <Alert severity="success" sx={{ fontFamily: "Cairo" }}>
                  ✅ الاستراكتشر صحيح — عدد الأعمدة بعد الهوية:{" "}
                  <b>{structureInfo.subjectsCount}</b>
                </Alert>
              )}

              <Divider />

              <Typography sx={{ fontFamily: "Cairo", fontWeight: 800 }}>
                هيكل الشيت المطلوب (Columns)
              </Typography>

              <Alert severity="warning" sx={{ fontFamily: "Cairo" }}>
                لابد أول صف يكون عناوين الأعمدة، والعمود الأول يكون:
                <b> nationalid </b> أو <b> national id </b>
                <Box
                  sx={{
                    mt: 1,
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: "#fff",
                    border: "1px solid #eee",
                    fontFamily:
                      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                    fontSize: 13,
                    overflowX: "auto",
                    direction: "ltr",
                  }}
                >
                  national id | إدارة المستشفيات | التوجيه المهني والتميز | ...
                </Box>
              </Alert>

              <Divider />

              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", md: "center" }}
                justifyContent="space-between"
              >
                <Box>
                  {successMsg && (
                    <Alert severity="success" sx={{ fontFamily: "Cairo" }}>
                      {successMsg}
                    </Alert>
                  )}

                  {errorMsg && (
                    <Alert severity="error" sx={{ fontFamily: "Cairo" }}>
                      ❌ {errorMsg}
                    </Alert>
                  )}
                </Box>

                <Button
                  onClick={handleUpload}
                  disabled={loading || !file || !structureOk}
                  variant="contained"
                  startIcon={
                    loading ? (
                      <CircularProgress size={18} />
                    ) : (
                      <UploadFileIcon />
                    )
                  }
                  sx={{
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    borderRadius: 2,
                    py: 1.2,
                    px: 3,
                    bgcolor: "#80b49e",
                    "&:hover": { bgcolor: "#6a9a87" },
                    whiteSpace: "nowrap",
                    minWidth: { xs: "100%", md: 220 },
                  }}
                >
                  {loading ? "جاري الرفع..." : "رفع الدرجات"}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Paper>
      </Box>
    </Box></NavigationShell>
  );
};

export default UploadGrades;
