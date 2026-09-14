import * as uiLayout from './common/uiLayout';
import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import PrintIcon from "@mui/icons-material/Print";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";

const logoImage = new URL(
  `${process.env.PUBLIC_URL || ""}/logo.jpg`,
  window.location.origin
).href;

const primaryColor = "#057546";
const accentColor = "#ae1e21";

const REFUND_POLICY_URL =
  "https://sstli.com/%d8%b3%d9%8a%d8%a7%d8%b3%d9%8a%d8%a9-%d8%a7%d9%84%d8%a5%d8%b3%d8%aa%d8%b1%d8%af%d8%a7%d8%af-%d8%a7%d9%84%d9%85%d8%a7%d9%84%d9%8a/";

const REFUND_POLICY_QR =
  `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    REFUND_POLICY_URL
  )}`;

const REGISTER_VERIFICATION_PAGE_URL =
  "https://filesregsiteration.sstli.com/erp/auth.php";

const COMPANY_NAME = "شركة معهد السعودي المتخصص العالي للتدريب";
const COMPANY_TAX_NO = "312191561600003";
const COMPANY_PHONE = "920012673";
const COMPANY_CR_NO = "2050163983";

const formatMoney = (value) => {
  const number = Number(value || 0);

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(number);
};

const InfoField = ({ label, value }) => (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: "125px 1fr",
      gap: 1,
      py: 0.65,
      "@media (max-width:1599px)": {
        gridTemplateColumns: "82px 1fr",
        gap: 0.45,
        py: 0.35
      },
      "@media (max-width:599px)": {
        gridTemplateColumns: "68px 1fr",
        gap: 0.3,
        py: 0.25
      },
      borderBottom: "1px solid #eeeeee"
    }}
  >
    <Typography
      sx={{
        fontWeight: 950,
        whiteSpace: "nowrap",
        lineHeight: 1.5,
        "@media (max-width:1599px)": { fontSize: "0.75rem" },
        "@media (max-width:599px)": { fontSize: "0.75rem" }
      }}
    >
      {label}
    </Typography>

    <Typography
      sx={{
        fontWeight: 800,
        "@media (max-width:1599px)": { fontSize: "0.75rem" },
        "@media (max-width:599px)": { fontSize: "0.75rem" }
      }}
    >
      {value || "-"}
    </Typography>
  </Box>
);

const RegisterDocumentDialog = ({
  open,
  onClose,
  docGuid,
  documentNo,
  apiBaseUrl
}) => {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery("(min-width:600px) and (max-width:1599px)");
  const previewScale = isPhone ? 0.40 : isTablet ? 0.72 : 1;

  const [documentData, setDocumentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const printRef = useRef(null);

  const verificationDocumentGuid =
    documentData?.guid ||
    documentData?.docGuid ||
    documentData?.regDocGuid ||
    docGuid ||
    "";

  const verificationDocumentNo =
    documentData?.documentNo ||
    documentData?.code ||
    documentNo ||
    "";

  const verificationPageUrl =
    `${REGISTER_VERIFICATION_PAGE_URL}?guid=${encodeURIComponent(
      verificationDocumentGuid
    )}&code=${encodeURIComponent(
      verificationDocumentNo
    )}`;

  const verificationQrUrl =
    `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
      verificationPageUrl
    )}`;

  useEffect(() => {
    if (!open || !docGuid) return undefined;

    const controller = new AbortController();

    const loadDocument = async () => {
      try {
        setLoading(true);
        setError("");
        setDocumentData(null);

        const params = new URLSearchParams({ docGuid });

        const response = await fetch(
          `${apiBaseUrl}/api/reception-office/student-statement/register-document?${params.toString()}`,
          { signal: controller.signal }
        );

        const result = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            result?.message ||
              result?.error ||
              "تعذر تحميل استمارة التسجيل"
          );
        }

        setDocumentData(result?.data || null);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(
            err.message ||
              "حدث خطأ أثناء تحميل استمارة التسجيل"
          );
        }
      } finally {
        setLoading(false);
      }
    };

    loadDocument();

    return () => controller.abort();
  }, [open, docGuid, apiBaseUrl]);

  const openPrintWindow = () => {
    if (!printRef.current || !documentData) return;

    const printWindow = window.open(
      "",
      "_blank",
      "width=1000,height=900"
    );

    if (!printWindow) {
      setError("المتصفح منع نافذة الطباعة، برجاء السماح بالنوافذ المنبثقة");
      return;
    }

    /*
      في نسخة الـ production الخاصة بـ MUI / Emotion يتم وضع التنسيقات
      داخل CSSStyleSheet وليس كنص داخل style tag، لذلك نسخ outerHTML
      الخاص بالـ styles يعمل في localhost وقد يفشل بعد build.

      الحل: ننسخ عنصر الاستمارة ثم نثبت الـ computed styles على كل عنصر
      كـ inline styles، وبذلك تكون نافذة الطباعة مستقلة تمامًا عن ملفات CSS.
    */
    const sourceRoot = printRef.current;
    const clonedRoot = sourceRoot.cloneNode(true);

    const sourceElements = [sourceRoot, ...sourceRoot.querySelectorAll("*")];
    const clonedElements = [clonedRoot, ...clonedRoot.querySelectorAll("*")];

    sourceElements.forEach((sourceElement, index) => {
      const clonedElement = clonedElements[index];
      if (!clonedElement) return;

      const computedStyle = window.getComputedStyle(sourceElement);
      let inlineCss = "";

      for (let i = 0; i < computedStyle.length; i += 1) {
        const propertyName = computedStyle[i];
        const propertyValue = computedStyle.getPropertyValue(propertyName);
        const propertyPriority = computedStyle.getPropertyPriority(propertyName);

        inlineCss += `${propertyName}:${propertyValue}${
          propertyPriority ? " !important" : ""
        };`;
      }

      clonedElement.setAttribute("style", inlineCss);
    });

    // تثبيت مقاس صفحة الطباعة بعد نسخ الـ computed styles.
    clonedRoot.classList.add("print-page");
    clonedRoot.style.setProperty("position", "relative", "important");
    clonedRoot.style.setProperty("display", "block", "important");
    clonedRoot.style.setProperty("width", "210mm", "important");
    clonedRoot.style.setProperty("height", "297mm", "important");
    clonedRoot.style.setProperty("min-height", "297mm", "important");
    clonedRoot.style.setProperty("max-height", "297mm", "important");
    clonedRoot.style.setProperty("margin", "0", "important");
    clonedRoot.style.setProperty("padding", "7mm", "important");
    clonedRoot.style.setProperty("overflow", "hidden", "important");
    clonedRoot.style.setProperty("border", "0", "important");
    clonedRoot.style.setProperty("border-radius", "0", "important");
    clonedRoot.style.setProperty("box-shadow", "none", "important");
    clonedRoot.style.setProperty("background", "#ffffff", "important");
    clonedRoot.style.setProperty("box-sizing", "border-box", "important");

    const printableHtml = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <title>استمارة تسجيل ${
            documentData.documentNo || documentNo || ""
          }</title>

          <style>
            @page {
              size: A4 portrait;
              margin: 0;
            }

            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            html,
            body {
              width: 210mm !important;
              min-width: 210mm !important;
              height: 297mm !important;
              min-height: 297mm !important;
              max-height: 297mm !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              direction: rtl !important;
              overflow: hidden !important;
              font-family: Cairo, Arial, Tahoma, sans-serif !important;
            }

            body {
              display: block !important;
            }

            .print-page {
              page-break-before: avoid !important;
              page-break-after: avoid !important;
              page-break-inside: avoid !important;
              break-before: avoid-page !important;
              break-after: avoid-page !important;
              break-inside: avoid-page !important;
            }

            @media print {
              html,
              body,
              .print-page {
                width: 210mm !important;
                height: 297mm !important;
                min-height: 297mm !important;
                max-height: 297mm !important;
                overflow: hidden !important;
              }
            }
          </style>
        </head>

        <body>
          ${clonedRoot.outerHTML}

          <script>
            (function () {
              function waitForImages() {
                var images = Array.prototype.slice.call(document.images || []);

                return Promise.all(
                  images.map(function (image) {
                    if (image.complete) return Promise.resolve();

                    return new Promise(function (resolve) {
                      image.onload = resolve;
                      image.onerror = resolve;
                    });
                  })
                );
              }

              window.addEventListener("load", function () {
                var fontsReady = document.fonts && document.fonts.ready
                  ? document.fonts.ready
                  : Promise.resolve();

                Promise.all([fontsReady, waitForImages()]).then(function () {
                  window.focus();
                  window.setTimeout(function () {
                    window.print();
                  }, 350);
                });
              });
            })();
          <\/script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(printableHtml);
    printWindow.document.close();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      dir="rtl"
      sx={uiLayout.withUiSx({
        // لازم استمارة التسجيل تظهر فوق كشف الحساب المفتوح تحتها.
        zIndex: 1800
      }, uiLayout.dialogLayoutSx)}
    >
      <DialogTitle
        className="no-print"
        sx={{
          backgroundColor: primaryColor,
          color: "#fff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          py: isPhone ? 0.5 : isTablet ? 0.7 : 1.3,
          px: isPhone ? 0.65 : isTablet ? 0.9 : 2
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ReceiptLongIcon />

          <Box>
            <Typography sx={{ fontWeight: 950, fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined }}>
              عرض استمارة التسجيل
            </Typography>

            <Typography sx={{ fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : "0.78rem", opacity: 0.9 }}>
              رقم المستند:{" "}
              {documentData?.documentNo || documentNo || "-"}
            </Typography>
          </Box>
        </Box>

        <IconButton onClick={onClose} sx={{ color: "#fff" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          backgroundColor: "#eeeeee",
          p: isPhone ? 0.25 : isTablet ? 0.5 : 2,
          overflow: "auto"
        }}
      >
        {loading ? (
          <Box
            sx={{
              height: "75vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box
            sx={{
              height: "70vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: accentColor,
              fontWeight: 950
            }}
          >
            {error}
          </Box>
        ) : documentData ? (
          <Box
            sx={{
              width: isPhone ? `${210 * previewScale}mm` : isTablet ? `${210 * previewScale}mm` : "210mm",
              height: isPhone ? `${297 * previewScale}mm` : isTablet ? `${297 * previewScale}mm` : "297mm",
              mx: "auto",
              position: "relative",
              flexShrink: 0
            }}
          >
          <Paper
            ref={printRef}
            className="print-page"
            elevation={3}
            sx={{
              position: "relative",
              width: "210mm",
              height: "297mm",
              minHeight: "297mm",
              maxHeight: "297mm",
              mx: "auto",
              p: "10mm",
              overflow: "hidden",
              backgroundColor: "#fff",
              color: "#111",
              transform: previewScale === 1 ? "none" : `scale(${previewScale})`,
              transformOrigin: "top left"
            }}
          >
            {/* Header */}
            <Box
              className="company-header"
              sx={{
                display: "grid",
                gridTemplateColumns: "430px 1fr 150px",
                gap: 2.5,
                alignItems: "center",
                borderBottom: "3px solid #111",
                pb: 1.8,
                mb: 2.2,
                direction: "rtl"
              }}
            >
              {/* بيانات الشركة ناحية اليمين */}
              <Box
                className="company-info"
                sx={{
                  textAlign: "start",
                  direction: "rtl",
                  alignSelf: "stretch",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  minWidth: 0
                }}
              >
                <Typography
                  className="title"
                  sx={{
                    fontWeight: 950,
                    fontSize: 17,
                    lineHeight: 1.4,
                    mb: 0.6,
                    whiteSpace: "nowrap"
                  }}
                >
                  {COMPANY_NAME}
                </Typography>

                <Typography
                  className="branch"
                  sx={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: "#333",
                    mb: 1.2,
                    whiteSpace: "nowrap"
                  }}
                >
                  {documentData.branchName || "---------------------------"}
                </Typography>

                <Typography
                  className="line"
                  sx={{
                    fontSize: 14,
                    mb: 0.7,
                    whiteSpace: "nowrap"
                  }}
                >
                  الرقم الضريبي - {COMPANY_TAX_NO}
                </Typography>

                <Typography
                  className="line"
                  sx={{
                    fontSize: 14,
                    mb: 0.7,
                    whiteSpace: "nowrap"
                  }}
                >
                  الهاتف - {COMPANY_PHONE}
                </Typography>

                <Typography
                  className="line"
                  sx={{
                    fontSize: 14,
                    whiteSpace: "nowrap"
                  }}
                >
                  السجل التجاري - {COMPANY_CR_NO}
                </Typography>
              </Box>

              {/* مساحة وسطية */}
              <Box />

              {/* اللوجو ناحية الشمال */}
              <Box
                className="company-logo-box"
                sx={{
                  width: 140,
                  height: 120,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid #d6d6d6",
                  borderRadius: 2,
                  backgroundColor: "#fff",
                  boxShadow: "0 3px 10px rgba(0,0,0,0.05)",
                  p: 1.2
                }}
              >
                <Box
                  component="img"
                  src={logoImage}
                  alt="SSTLI Logo"
                  sx={{
                    width: 105,
                    height: 95,
                    objectFit: "contain",
                    display: "block"
                  }}
                />
              </Box>
            </Box>

            <Typography
              sx={{
                fontSize: 23,
                fontWeight: 950,
                textAlign: "center",
                mb: 2
              }}
            >
              استمارة تسجيل
            </Typography>

            <Box
              className="document-info-grid"
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 2,
                mb: 2
              }}
            >

                              <Box
                sx={{
                  border: "1px solid #333",
                  borderRadius: 2,
                  p: 1.5
                }}
              >
                <InfoField
                  label="اسم العميل"
                  value={documentData.studentName}
                />
                <InfoField
                  label="رقم الهوية"
                  value={documentData.nationalId}
                />
                <InfoField
                  label="رقم الجوال"
                  value={documentData.studentTel}
                />
                <InfoField
                  label="نوع الدراسة"
                  value={documentData.studyTypeText}
                />
              </Box>
              <Box
                sx={{
                  border: "1px solid #333",
                  borderRadius: 2,
                  p: 1.5
                }}
              >
                <InfoField
                  label="رقم الاستمارة"
                  value={documentData.documentNo}
                />
                <InfoField
                  label="تاريخ الاستمارة"
                  value={documentData.documentDate}
                />
                <InfoField
                  label="وقت الاستمارة"
                  value={documentData.documentTime}
                />
                <InfoField
                  label="البائع"
                  value={documentData.sellerName}
                />
              </Box>
            </Box>

            <TableContainer sx={uiLayout.tableContainerSx} className="items-table">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell align="center">البيان</TableCell>
                    <TableCell align="center">الوحدة</TableCell>
                    <TableCell align="center">السعر</TableCell>
                    <TableCell align="center">الكمية</TableCell>
                    <TableCell align="center">القيمة</TableCell>
                    <TableCell align="center">الضريبة</TableCell>
                    <TableCell align="center">مبلغ الضريبة</TableCell>
                    <TableCell align="center">الصافي</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {(documentData.items || []).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell align="center">
                        {item.itemName || "-"}
                      </TableCell>
                      <TableCell align="center">
                        {item.unit || "PCS"}
                      </TableCell>
                      <TableCell align="center">
                        {formatMoney(item.cost)}
                      </TableCell>
                      <TableCell align="center">
                        {item.quantity || 1}
                      </TableCell>
                      <TableCell align="center">
                        {formatMoney(item.lineTotal)}
                      </TableCell>
                      <TableCell align="center">
                        {formatMoney(item.taxRate)}
                      </TableCell>
                      <TableCell align="center">
                        {formatMoney(item.lineTax)}
                      </TableCell>
                      <TableCell align="center">
                        {formatMoney(item.lineSubTotal)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* الإجماليات وQR سياسة الاسترداد */}
            <Box
              className="totals-refund-row"
              sx={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) 320px",
                gap: 3,
                alignItems: "start",
                mt: 2
              }}
            >
              <Box
                className="totals-box"
                sx={{
                  width: "100%",
                  border: "1px solid #333",
                  borderRadius: 2,
                  p: 2,
                  m: 0,
                  "& > .MuiBox-root": {
                    gridTemplateColumns: "190px minmax(0, 1fr)"
                  },
                  "& p": {
                    whiteSpace: "nowrap"
                  }
                }}
              >
                <InfoField
                  label="الإجمالي قبل الضريبة"
                  value={formatMoney(documentData.total)}
                />

                <InfoField
                  label="ضريبة القيمة المضافة"
                  value={formatMoney(documentData.tax)}
                />

                <InfoField
                  label="الإجمالي بعد الضريبة"
                  value={formatMoney(documentData.subTotal)}
                />
              </Box>

              <Box
                className="refund-qr"
                sx={{
                  width: 150,
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-start",
          "& .MuiButton-root": {
            minHeight: isPhone ? 30 : isTablet ? 33 : undefined,
            px: isPhone ? 0.8 : isTablet ? 1.1 : undefined,
            fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
          }
                }}
              >
                <Box
                  component="img"
                  src={REFUND_POLICY_QR}
                  alt="سياسة الاسترداد"
                  sx={{
                    width: 125,
                    height: 125,
                    objectFit: "contain",
                    display: "block"
                  }}
                />

                <Typography
                  className="refund-caption"
                  sx={{
                    mt: 0.8,
                    fontSize: 12,
                    lineHeight: 1.5,
                    fontWeight: 900,
                    textAlign: "center"
                  }}
                >
                  يرجى متابعة سياسة الاسترداد
                </Typography>
              </Box>
            </Box>


            {documentData.notes && (
              <Box sx={{ mt: 3 }}>
                <Typography sx={{ fontWeight: 950 }}>
                  ملاحظات
                </Typography>

                <Typography
                  sx={{
                    border: "1px solid #ddd",
                    minHeight: 65,
                    p: 1.5,
                    mt: 0.5,
                    whiteSpace: "pre-wrap"
                  }}
                >
                  {documentData.notes}
                </Typography>
              </Box>
            )}
            <Box
              className="verification-row"
              sx={{
                position: "absolute",
                right: "10mm",
                bottom: "27mm",
                width: 150,
                display: "flex",
                justifyContent: "flex-end",
                direction: "rtl",
                m: 0
              }}
            >
              <Box
                className="verification-qr"
                sx={{
                  width: 150,
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-end"
                }}
              >
                <Box
                  component="img"
                  src={verificationQrUrl}
                  alt="موثوقية الاستمارة"
                  sx={{
                    width: 125,
                    height: 125,
                    objectFit: "contain",
                    display: "block"
                  }}
                />

                <Typography
                  className="verification-caption"
                  sx={{
                    mt: 0.8,
                    fontSize: 12,
                    lineHeight: 1.5,
                    fontWeight: 900,
                    textAlign: "center"
                  }}
                >
                  موثوقية الاستمارة
                </Typography>
              </Box>
            </Box>

            <Typography
              className="refund-warning"
              sx={{
                position: "absolute",
                right: 0,
                left: 0,
                bottom: "12mm",
                m: 0,
                textAlign: "center",
                fontWeight: 900,
                fontSize: 14,
                whiteSpace: "nowrap"
              }}
            >
              المبالغ المدفوعة رسوم دراسية غير مستردة
            </Typography>
          </Paper>
          </Box>
        ) : null}
      </DialogContent>

      <DialogActions
        className="no-print"
        sx={uiLayout.withUiSx({
          px: isPhone ? 0.45 : isTablet ? 0.7 : 2,
          py: isPhone ? 0.35 : isTablet ? 0.55 : 1.5,
          gap: isPhone ? 0.35 : isTablet ? 0.55 : 1,
          justifyContent: "flex-start"
        }, uiLayout.dialogActionsSx)}
      >
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          disabled={!documentData || loading}
          onClick={openPrintWindow}
          sx={uiLayout.withUiSx({
            backgroundColor: primaryColor,
            fontWeight: 950,
            direction: "rtl"
          }, uiLayout.buttonSx)}
        >
          طباعة
        </Button>

        <Button
          variant="contained"
          startIcon={<PictureAsPdfIcon />}
          disabled={!documentData || loading}
          onClick={openPrintWindow}
          sx={uiLayout.withUiSx({
            backgroundColor: accentColor,
            fontWeight: 950,
            direction: "rtl",
            "&:hover": {
              backgroundColor: "#8f171a"
            }
          }, uiLayout.buttonSx)}
        >
          تصدير PDF
        </Button>

        <Button
          variant="outlined"
          color="error"
          onClick={onClose}
          sx={uiLayout.withUiSx({ fontWeight: 950 }, uiLayout.buttonSx)}
        >
          إغلاق
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RegisterDocumentDialog;