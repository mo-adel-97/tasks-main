import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
  Alert
} from "@mui/material";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import logo from "../images/logo.jpg";

const API_URL = "https://filesregsiteration.sstli.com/erp/EmployeeCV.php";
const CURRENT_YEAR = 2026;

const safeText = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
};

const escapeHtml = (value) => {
  return safeText(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

const normalizeLines = (value) => {
  return String(value || "")
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
};

const getGraduationYear = (dateValue) => {
  if (!dateValue) return null;

  const text = String(dateValue).trim();

  const isoMatch = text.match(/^(\d{4})-/);
  if (isoMatch) return Number(isoMatch[1]);

  const lastYearMatch = text.match(/(\d{4})$/);
  if (lastYearMatch) return Number(lastYearMatch[1]);

  const d = new Date(text);
  if (!Number.isNaN(d.getTime())) return d.getFullYear();

  return null;
};

const getExperienceYearsFromGraduation = (graduationDate) => {
  const year = getGraduationYear(graduationDate);
  if (!year) return null;
  return CURRENT_YEAR - year;
};

const hasMoreThan10YearsExperience = (cv) => {
  const years = getExperienceYearsFromGraduation(cv?.GraduationDate);
  return years !== null && years > 10;
};

const arrayToHtmlList = (items) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return `<div class="empty">لا يوجد بيانات</div>`;
  }

  return `
    <ul class="clean-list">
      ${items
        .map((item) => {
          const text = typeof item === "string" ? item : JSON.stringify(item);
          const lines = normalizeLines(text);
          const title = lines[0] || text;
          const details = lines.slice(1).join("<br/>");

          return `
            <li>
              <div class="li-title">${escapeHtml(title)}</div>
              ${
                details
                  ? `<div class="li-details">${details}</div>`
                  : ""
              }
            </li>
          `;
        })
        .join("")}
    </ul>
  `;
};

const textBlockToTimeline = (value) => {
  if (!value) return `<div class="empty">لا يوجد بيانات</div>`;

  const blocks = String(value)
    .split("--------------------")
    .map((x) => x.trim())
    .filter(Boolean);

  if (blocks.length === 0) return `<div class="empty">لا يوجد بيانات</div>`;

  return `
    <div class="timeline">
      ${blocks
        .map((block) => {
          const lines = normalizeLines(block);
          const title = lines[0] || "";
          const details = lines.slice(1).join("<br/>");

          return `
            <div class="timeline-item">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <div class="timeline-title">${escapeHtml(title)}</div>
                ${
                  details
                    ? `<div class="timeline-details">${details}</div>`
                    : ""
                }
              </div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
};

const buildCvHtml = (cvList, logoUrl) => {
  return `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');
    @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css');

    * { box-sizing: border-box; }

    .pdf-root {
      width: 210mm;
      margin: 0;
      padding: 0;
      background: #ffffff;
      font-family: 'Cairo', Tahoma, Arial, sans-serif;
      color: #111827;
      direction: rtl;
      text-align: right;
    }

    /* كل CV صفحة A4 واحدة بالضبط، وده يمنع الصفحات الفاضية بين السير */
    .cv-page {
      width: 210mm;
      height: auto;
      min-height: 297mm;
      max-height: none;
      position: relative;
      overflow: visible;
      background: #ffffff;
      break-after: auto;
      page-break-after: auto;
      break-inside: auto;
      page-break-inside: auto;
    }

    .cv-page:last-child {
      break-after: auto;
      page-break-after: auto;
    }

    /* خلفية العمود الجانبي ثابتة بطول الصفحة بالكامل */
    .cv-page::before {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      width: 61mm;
      background: #f4f5f7;
      border-left: 1px solid #d6d9de;
      z-index: 0;
    }

    /* هذا الجزء يتم تصغيره تلقائياً فقط عند الحاجة حتى يظل CV في صفحة واحدة */
    .cv-content {
      position: relative;
      z-index: 1;
      width: 100%;
      transform-origin: top right;
    }

    .cv-frame {
      display: grid;
      grid-template-columns: 61mm 1fr;
      width: 100%;
      min-height: 297mm;
      direction: rtl;
      align-items: stretch;
    }

    .side {
      padding: 6mm 5.2mm 11mm;
      position: relative;
      background: transparent;
      overflow: visible;
    }

    .main {
      padding: 7mm 8mm 15mm;
      position: relative;
      background: #ffffff;
      min-height: 297mm;
      overflow: visible;
    }

    .logo-wrap {
      width: 19mm;
      height: 19mm;
      border-radius: 50%;
      background: #ffffff;
      margin: 0 auto 3mm;
      border: 2px solid #ffffff;
      box-shadow: 0 3px 10px rgba(0,0,0,0.10);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: visible;
    }

    .logo-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }

    .side-section { margin-bottom: 3.5mm; }
    .main-section { margin-bottom: 4.2mm; }

    .section-heading {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      flex-direction: row;
      gap: 6px;
      direction: rtl;
      color: #4b5563;
      font-weight: 900;
      border-bottom: 1px solid #a9b0bb;
      padding-bottom: 3px;
      margin-bottom: 7px;
      text-align: right;
    }

    .side .section-heading { font-size: 11.3px; }
    .main .section-heading { font-size: 14.2px; margin-bottom: 8px; }

    .heading-icon {
      width: 15px;
      height: 15px;
      min-width: 15px;
      border-radius: 50%;
      background: #087846;
      color: #ffffff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 7px;
      line-height: 1;
    }

    .side-row {
      display: flex;
      flex-direction: row;
      gap: 4px;
      align-items: flex-start;
      margin-bottom: 4.2px;
      font-size: 9.1px;
      line-height: 1.55;
      color: #111827;
      text-align: right;
      overflow-wrap: anywhere;
      direction: rtl;
    }

    .mini-icon {
      min-width: 12px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #ffffff;
      border: 1px solid #d1d5db;
      color: #087846;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 5.8px;
      margin-top: 1px;
    }

    .name {
      margin: 0;
      padding: 0;
      font-size: 22px;
      line-height: 1.5;
      font-weight: 900;
      color: #111827;
      text-align: right;
      overflow-wrap: anywhere;
    }

    .job-line {
      margin-top: 1px;
      color: #6b7280;
      font-size: 10.7px;
      line-height: 1.48;
      font-weight: 700;
      text-align: right;
    }

    .top-divider {
      height: 2px;
      background: linear-gradient(90deg, #a9b0bb 0%, #087846 100%);
      margin: 4mm 0 4mm;
      border-radius: 99px;
    }

    .summary {
      font-size: 10.2px;
      line-height: 1.72;
      color: #111827;
      text-align: right;
      white-space: pre-line;
      overflow-wrap: anywhere;
    }

    .timeline {
      border-right: 2px solid #a9b0bb;
      margin-right: 5px;
      padding-right: 10px;
    }

    .timeline-item {
      position: relative;
      margin-bottom: 6px;
      break-inside: auto;
      page-break-inside: auto;
    }

    .timeline-dot {
      position: absolute;
      right: -15px;
      top: 4px;
      width: 8px;
      height: 8px;
      background: #ffffff;
      border: 2px solid #087846;
      border-radius: 50%;
    }

    .timeline-title {
      font-size: 10.6px;
      font-weight: 900;
      color: #111827;
      margin-bottom: 1px;
      text-align: right;
      line-height: 1.5;
    }

    .timeline-details {
      font-size: 9.25px;
      color: #374151;
      line-height: 1.58;
      text-align: right;
      white-space: normal;
      overflow-wrap: anywhere;
    }

    .clean-list {
      margin: 0;
      padding: 0;
      line-height: 1.58;
      font-size: 9.6px;
      direction: rtl;
      text-align: right;
      list-style: none;
    }

    .clean-list li {
      position: relative;
      margin-bottom: 4px;
      text-align: right;
      direction: rtl;
      padding-right: 11px;
      padding-left: 0;
      break-inside: auto;
      page-break-inside: auto;
    }

    .clean-list li::before {
      content: '';
      position: absolute;
      right: 0;
      top: 6px;
      width: 3.5px;
      height: 3.5px;
      border-radius: 50%;
      background: #111827;
    }

    .side .clean-list { font-size: 8.9px; line-height: 1.52; }
    .side .clean-list li { margin-bottom: 3.3px; padding-right: 11px; }

    .li-title {
      font-weight: 900;
      color: #111827;
      font-size: 9.8px;
      text-align: right;
      direction: rtl;
      line-height: 1.4;
      overflow-wrap: anywhere;
    }

    .side .li-title { font-size: 9px; }

    .li-details {
      color: #4b5563;
      font-size: 8.75px;
      margin-top: 1px;
      line-height: 1.55;
      text-align: right;
      direction: rtl;
      white-space: normal;
      overflow-wrap: anywhere;
    }

    .side .li-details { font-size: 8.2px; }

    .empty {
      color: #9ca3af;
      font-size: 8.8px;
      text-align: right;
    }

    .footer {
      position: absolute;
      right: 7mm;
      left: 7mm;
      bottom: 5mm;
      padding-top: 2mm;
      border-top: 1px solid #d1d5db;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 8.5px;
      color: #4b5563;
      direction: rtl;
      background: #ffffff;
    }

    .watermark {
      position: absolute;
      left: 18mm;
      right: 18mm;
      bottom: 17mm;
      text-align: center;
      font-size: 26px;
      color: rgba(0,0,0,0.035);
      font-weight: 900;
      transform: rotate(-4deg);
      pointer-events: none;
    }
  </style>

  <div class="pdf-root">
    ${cvList
      .map((cv) => {
        const fullName = cv.FullName || "بدون اسم";
        const titleLine = [cv.Qualification, cv.Specialization]
          .filter(Boolean)
          .join(" | ");
        const experienceYears = getExperienceYearsFromGraduation(cv.GraduationDate);

        return `
          <div class="cv-page">
            <div class="cv-content">
              <div class="cv-frame">
                <aside class="side">
                  <div class="logo-wrap">
                    <img src="${logoUrl}" class="logo-img" alt="logo" />
                  </div>

                  <div class="side-section">
                    <div class="section-heading"><span class="heading-icon"><i class="fa-solid fa-address-card"></i></span><span>معلومات التواصل</span></div>
                    <div class="side-row"><span class="mini-icon"><i class="fa-solid fa-phone"></i></span><span>${escapeHtml(cv.Mobile)}</span></div>
                    <div class="side-row"><span class="mini-icon"><i class="fa-solid fa-envelope"></i></span><span>${escapeHtml(cv.Email)}</span></div>
                    <div class="side-row"><span class="mini-icon"><i class="fa-solid fa-location-dot"></i></span><span>مدينة الميلاد: ${escapeHtml(cv.BirthCity)}</span></div>
                    <div class="side-row"><span class="mini-icon"><i class="fa-solid fa-calendar-days"></i></span><span>تاريخ الميلاد: ${escapeHtml(cv.BirthDate)}</span></div>
                  </div>

                  <div class="side-section">
                    <div class="section-heading"><span class="heading-icon"><i class="fa-solid fa-graduation-cap"></i></span><span>التعليم</span></div>
                    <div class="side-row">
                      <span class="mini-icon"><i class="fa-solid fa-check"></i></span>
                      <span><b>${escapeHtml(cv.Qualification)}</b><br/>${escapeHtml(cv.Specialization)}<br/>${escapeHtml(cv.University)}<br/>تاريخ التخرج: ${escapeHtml(cv.GraduationDate)}<br/>سنوات الخبرة التقديرية: ${experienceYears === null ? "—" : `${experienceYears} سنة`}</span>
                    </div>
                  </div>

                  <div class="side-section">
                    <div class="section-heading"><span class="heading-icon"><i class="fa-solid fa-screwdriver-wrench"></i></span><span>المهارات التقنية</span></div>
                    ${arrayToHtmlList(cv.TechnicalSkillsJson)}
                  </div>

                  <div class="side-section">
                    <div class="section-heading"><span class="heading-icon"><i class="fa-solid fa-star"></i></span><span>المهارات الشخصية</span></div>
                    ${arrayToHtmlList(cv.SoftSkillsJson)}
                  </div>

                  <div class="side-section">
                    <div class="section-heading"><span class="heading-icon"><i class="fa-solid fa-globe"></i></span><span>اللغات</span></div>
                    ${arrayToHtmlList(cv.LanguagesJson)}
                  </div>
                </aside>

                <main class="main">
                  <h1 class="name">${escapeHtml(fullName)}</h1>
                  <div class="job-line">${escapeHtml(titleLine || "السيرة الذاتية للموظف")}</div>
                  <div class="top-divider"></div>

                  <section class="main-section">
                    <div class="section-heading"><span class="heading-icon"><i class="fa-solid fa-user"></i></span><span>نبذة عني</span></div>
                    <div class="summary">${escapeHtml(cv.ProfessionalSummary)}</div>
                  </section>

                  <section class="main-section">
                    <div class="section-heading"><span class="heading-icon"><i class="fa-solid fa-briefcase"></i></span><span>الخبرات المهنية</span></div>
                    ${textBlockToTimeline(cv.ProfessionalExperience)}
                  </section>

                  <section class="main-section">
                    <div class="section-heading"><span class="heading-icon"><i class="fa-solid fa-certificate"></i></span><span>الدورات التدريبية والشهادات</span></div>
                    ${arrayToHtmlList(cv.CoursesJson)}
                  </section>

                  <div class="watermark">المعهد السعودي</div>
                  <div class="footer"><span>المعهد السعودي المتخصص العالي للتدريب</span><span>${new Date().toLocaleDateString("ar-SA")}</span></div>
                </main>
              </div>
            </div>
          </div>
        `;
      })
      .join("")}
  </div>
  `;
};

export default function EmployeeCVAdminPage() {
  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "list"
        })
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message || "حدث خطأ أثناء تحميل السير الذاتية");
        setItems([]);
        return;
      }

      setItems(data.data || []);
    } catch (err) {
      console.error(err);
      setError("تعذر الاتصال بالسيرفر");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return items;

    return items.filter((item) => {
      const years = getExperienceYearsFromGraduation(item.GraduationDate);

      const text = [
        item.FullName,
        item.Mobile,
        item.Email,
        item.Qualification,
        item.Specialization,
        item.University,
        item.BirthCity,
        years !== null ? `${years} سنة` : ""
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(q);
    });
  }, [items, search]);

  const experiencedItems = useMemo(() => {
    return items.filter((x) => hasMoreThan10YearsExperience(x));
  }, [items]);

  const filteredExperiencedItems = useMemo(() => {
    return filteredItems.filter((x) => hasMoreThan10YearsExperience(x));
  }, [filteredItems]);

  const selectedItems = useMemo(() => {
    return items.filter((x) => selectedIds.includes(x.Id));
  }, [items, selectedIds]);

  const toggleOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAllFiltered = () => {
    setSelectedIds(filteredItems.map((x) => x.Id));
  };

  const selectMoreThan10YearsFiltered = () => {
    setSelectedIds(filteredExperiencedItems.map((x) => x.Id));
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const exportToPdf = async (cvList, filePrefix = "Employee-CVs") => {
    if (!cvList || cvList.length === 0) {
      setError("لا توجد سير ذاتية للتصدير");
      return;
    }

    setExporting(true);
    setError("");

    const wrappers = [];

    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true
      });

      let hasAnyPage = false;
      const pageWidthMm = 210;
      const pageHeightMm = 297;

      for (let cvIndex = 0; cvIndex < cvList.length; cvIndex += 1) {
        const cv = cvList[cvIndex];
        const wrapper = document.createElement("div");
        wrappers.push(wrapper);

        wrapper.innerHTML = buildCvHtml([cv], logo);
        wrapper.style.position = "fixed";
        wrapper.style.left = "-10000px";
        wrapper.style.top = "0";
        wrapper.style.width = "210mm";
        wrapper.style.background = "#ffffff";
        wrapper.style.zIndex = "-1";
        wrapper.style.opacity = "1";
        wrapper.style.pointerEvents = "none";

        document.body.appendChild(wrapper);

        if (document.fonts?.ready) {
          await document.fonts.ready;
        }

        const images = Array.from(wrapper.querySelectorAll("img"));
        await Promise.all(
          images.map(
            (img) =>
              new Promise((resolve) => {
                if (img.complete) {
                  resolve();
                  return;
                }
                img.onload = resolve;
                img.onerror = resolve;
              })
          )
        );

        await new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve))
        );

        const cvPage = wrapper.querySelector(".cv-page");
        if (!cvPage) {
          throw new Error("CV page was not created");
        }

        const canvas = await html2canvas(cvPage, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          logging: false,
          scrollX: 0,
          scrollY: 0,
          windowWidth: cvPage.scrollWidth,
          windowHeight: cvPage.scrollHeight
        });

        const pageHeightPx = Math.floor(
          canvas.width * (pageHeightMm / pageWidthMm)
        );

        let offsetY = 0;
        while (offsetY < canvas.height) {
          const sliceHeight = Math.min(pageHeightPx, canvas.height - offsetY);
          const pageCanvas = document.createElement("canvas");
          pageCanvas.width = canvas.width;
          pageCanvas.height = pageHeightPx;

          const ctx = pageCanvas.getContext("2d");
          if (!ctx) throw new Error("Canvas context is unavailable");

          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          ctx.drawImage(
            canvas,
            0,
            offsetY,
            canvas.width,
            sliceHeight,
            0,
            0,
            canvas.width,
            sliceHeight
          );

          if (hasAnyPage) {
            pdf.addPage("a4", "portrait");
          }

          const imageData = pageCanvas.toDataURL("image/jpeg", 0.96);
          pdf.addImage(
            imageData,
            "JPEG",
            0,
            0,
            pageWidthMm,
            pageHeightMm,
            undefined,
            "FAST"
          );

          hasAnyPage = true;
          offsetY += sliceHeight;
        }

        if (document.body.contains(wrapper)) {
          document.body.removeChild(wrapper);
        }
      }

      const fileName =
        cvList.length === 1
          ? `CV-${cvList[0].FullName || cvList[0].Id}.pdf`
          : `${filePrefix}-${cvList.length}.pdf`;

      pdf.save(fileName);
    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء تصدير PDF");
    } finally {
      wrappers.forEach((wrapper) => {
        if (wrapper && document.body.contains(wrapper)) {
          document.body.removeChild(wrapper);
        }
      });

      setExporting(false);
    }
  };

  const exportSelectedToPdf = async () => {
    if (selectedItems.length === 0) {
      setError("اختر سيرة ذاتية واحدة على الأقل للتصدير");
      return;
    }

    await exportToPdf(selectedItems, "Employee-CVs-Selected");
  };

  const exportMoreThan10YearsToPdf = async () => {
    if (experiencedItems.length === 0) {
      setError("لا يوجد موظفون خبرتهم أكثر من 10 سنوات بناءً على تاريخ التخرج");
      return;
    }

    await exportToPdf(experiencedItems, "Employee-CVs-More-Than-10-Years");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#f3f4f6",
        p: 3,
        direction: "rtl",
        textAlign: "right",
        fontFamily: '"Cairo", sans-serif'
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: "22px",
          border: "1px solid #e5e7eb",
          mb: 3,
          background:
            "linear-gradient(135deg, #057445 0%, #04633b 60%, #8f171a 100%)",
          color: "#fff"
        }}
      >
        <Typography
          sx={{
            fontSize: 30,
            fontWeight: 900,
            textAlign: "right"
          }}
        >
          السير الذاتية
        </Typography>

        <Typography
          sx={{
            mt: 1,
            opacity: 0.95,
            textAlign: "right"
          }}
        >
          عرض جميع السير الذاتية التي تم إرسالها، مع إمكانية تحديد موظف واحد أو أكثر وتصديرهم PDF بشكل رسمي.
        </Typography>

        <Stack
          direction="row"
          spacing={1}
          sx={{
            mt: 2,
            flexWrap: "wrap",
            justifyContent: "flex-start",
            gap: 1
          }}
        >
          <Chip
            label={`الإجمالي: ${items.length}`}
            sx={{ color: "#fff", border: "1px solid rgba(255,255,255,0.45)" }}
            variant="outlined"
          />

          <Chip
            label={`المحدد: ${selectedIds.length}`}
            sx={{ color: "#fff", border: "1px solid rgba(255,255,255,0.45)" }}
            variant="outlined"
          />

          <Chip
            label={`خبرة أكثر من 10 سنوات: ${experiencedItems.length}`}
            sx={{ color: "#fff", border: "1px solid rgba(255,255,255,0.45)" }}
            variant="outlined"
          />
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "14px" }}>
          {error}
        </Alert>
      )}

      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: "18px",
          border: "1px solid #e5e7eb",
          mb: 2
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="بحث بالاسم / الجوال / البريد / المؤهل / المدينة"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{
                direction: "rtl",
                textAlign: "right",
                "& .MuiInputBase-input": {
                  direction: "rtl",
                  textAlign: "right"
                },
                "& .MuiInputLabel-root": {
                  right: 24,
                  left: "auto",
                  transformOrigin: "right"
                }
              }}
            />
          </Grid>

          <Grid item xs={12} md={8}>
            <Stack
              direction="row"
              spacing={1}
              sx={{
                justifyContent: { xs: "flex-start", md: "flex-end" },
                flexWrap: "wrap",
                gap: 1
              }}
            >
              <Button
                variant="outlined"
                onClick={selectAllFiltered}
                disabled={filteredItems.length === 0}
                sx={{
                  borderRadius: "12px",
                  fontWeight: 900,
                  textTransform: "none"
                }}
              >
                تحديد الكل
              </Button>

              <Button
                variant="outlined"
                onClick={selectMoreThan10YearsFiltered}
                disabled={filteredExperiencedItems.length === 0}
                sx={{
                  borderRadius: "12px",
                  fontWeight: 900,
                  textTransform: "none",
                  borderColor: "#057445",
                  color: "#057445"
                }}
              >
                تحديد خبرة أكثر من 10 سنوات
              </Button>

              <Button
                variant="outlined"
                color="error"
                onClick={clearSelection}
                disabled={selectedIds.length === 0}
                sx={{
                  borderRadius: "12px",
                  fontWeight: 900,
                  textTransform: "none"
                }}
              >
                إلغاء التحديد
              </Button>

              <Button
                variant="contained"
                onClick={exportSelectedToPdf}
                disabled={selectedIds.length === 0 || exporting}
                sx={{
                  borderRadius: "12px",
                  fontWeight: 900,
                  textTransform: "none",
                  backgroundColor: "#057445",
                  minWidth: 170,
                  "&:hover": {
                    backgroundColor: "#04633b"
                  }
                }}
              >
                {exporting ? (
                  <>
                    <CircularProgress size={18} sx={{ color: "#fff", ml: 1 }} />
                    جاري التصدير...
                  </>
                ) : (
                  "تصدير المحدد PDF"
                )}
              </Button>

              <Button
                variant="contained"
                onClick={exportMoreThan10YearsToPdf}
                disabled={experiencedItems.length === 0 || exporting}
                sx={{
                  borderRadius: "12px",
                  fontWeight: 900,
                  textTransform: "none",
                  backgroundColor: "#8f171a",
                  minWidth: 230,
                  "&:hover": {
                    backgroundColor: "#741114"
                  }
                }}
              >
                تصدير خبرة أكثر من 10 سنوات
              </Button>

              <Button
                variant="text"
                onClick={loadData}
                disabled={loading}
                sx={{
                  borderRadius: "12px",
                  fontWeight: 900,
                  textTransform: "none"
                }}
              >
                تحديث
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box
          sx={{
            minHeight: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <CircularProgress />
        </Box>
      ) : filteredItems.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: "18px",
            border: "1px solid #e5e7eb",
            textAlign: "center"
          }}
        >
          <Typography sx={{ fontWeight: 900, color: "#6b7280" }}>
            لا توجد سير ذاتية مطابقة
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {filteredItems.map((cv) => {
            const selected = selectedIds.includes(cv.Id);
            const years = getExperienceYearsFromGraduation(cv.GraduationDate);
            const moreThan10 = hasMoreThan10YearsExperience(cv);

            return (
              <Grid item xs={12} md={6} lg={4} key={cv.Id}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: "18px",
                    border: selected
                      ? "2px solid #057445"
                      : "1px solid #e5e7eb",
                    backgroundColor: selected ? "#f0fdf4" : "#fff",
                    transition: "0.2s",
                    height: "100%",
                    direction: "rtl",
                    textAlign: "right"
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1.5
                    }}
                  >
                    <Checkbox
                      checked={selected}
                      onChange={() => toggleOne(cv.Id)}
                      sx={{
                        p: 0.5,
                        color: "#057445",
                        "&.Mui-checked": {
                          color: "#057445"
                        }
                      }}
                    />

                    <Box sx={{ flex: 1 }}>
                      <Typography
                        sx={{
                          fontWeight: 900,
                          fontSize: 18,
                          color: "#111827",
                          textAlign: "right"
                        }}
                      >
                        {safeText(cv.FullName)}
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.5,
                          color: "#6b7280",
                          fontSize: 13,
                          textAlign: "right"
                        }}
                      >
                        {safeText(cv.Qualification)}{" "}
                        {cv.Specialization ? `- ${cv.Specialization}` : ""}
                      </Typography>

                      <Divider sx={{ my: 1.5 }} />

                      <Stack spacing={0.8}>
                        <Typography sx={{ fontSize: 13, textAlign: "right" }}>
                          <b>الجوال:</b> {safeText(cv.Mobile)}
                        </Typography>

                        <Typography sx={{ fontSize: 13, textAlign: "right" }}>
                          <b>البريد:</b> {safeText(cv.Email)}
                        </Typography>

                        <Typography sx={{ fontSize: 13, textAlign: "right" }}>
                          <b>مدينة الميلاد:</b> {safeText(cv.BirthCity)}
                        </Typography>

                        <Typography sx={{ fontSize: 13, textAlign: "right" }}>
                          <b>تاريخ التخرج:</b> {safeText(cv.GraduationDate)}
                        </Typography>

                        <Typography sx={{ fontSize: 13, textAlign: "right" }}>
                          <b>سنوات الخبرة التقديرية:</b>{" "}
                          {years === null ? "—" : `${years} سنة`}
                        </Typography>

                        <Typography sx={{ fontSize: 13, textAlign: "right" }}>
                          <b>آخر تحديث:</b> {safeText(cv.UpdatedAt)}
                        </Typography>
                      </Stack>

                      <Box sx={{ mt: 1.5, display: "flex", gap: 1, flexWrap: "wrap" }}>
                        <Chip
                          size="small"
                          label="تم الإرسال"
                          sx={{
                            backgroundColor: "#dcfce7",
                            color: "#166534",
                            fontWeight: 900
                          }}
                        />

                        {moreThan10 && (
                          <Chip
                            size="small"
                            label="خبرة أكثر من 10 سنوات"
                            sx={{
                              backgroundColor: "#fee2e2",
                              color: "#991b1b",
                              fontWeight: 900
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}