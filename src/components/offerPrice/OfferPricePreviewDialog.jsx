import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import PrintIcon from "@mui/icons-material/Print";
import CloseIcon from "@mui/icons-material/Close";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import Swal from "sweetalert2";
import OfferPriceDocument, { PAGE_H, PAGE_W, useOfferLayout } from "./OfferPriceDocument";

const primaryColor = "#057546";
const primaryDark = "#034d31";
const PAGE_GAP = 20;

const waitForImages = async (root) => {
  // خط Cairo لازم يكون اتحمل قبل التصوير، وإلا الصفحات تطلع بخط احتياطي.
  try {
    await document.fonts?.load("700 14px Cairo");
    await document.fonts?.load("400 14px Cairo");
    await document.fonts?.ready;
  } catch {
    // نكمل بالخط المتاح
  }

  const images = Array.from(root?.querySelectorAll("img") || []);
  await Promise.all(
    images.map((img) =>
      img.complete && img.naturalWidth > 0
        ? Promise.resolve()
        : new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          })
    )
  );
};

// نفس ExportReportAsImagePdf في الديسكتوب: كل صفحة صورة عالية الجودة داخل PDF A4.
const buildPdf = async (pages) => {
  const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4", compress: true });
  const pdfW = pdf.internal.pageSize.getWidth();
  const pdfH = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < pages.length; i += 1) {
    const canvas = await html2canvas(pages[i], {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      width: PAGE_W,
      height: PAGE_H,
      windowWidth: PAGE_W,
      logging: false
    });
    if (i > 0) pdf.addPage("a4", "p");
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, pdfW, pdfH, undefined, "FAST");
  }

  return pdf;
};

const OfferPricePreviewDialog = ({ open, onClose, doc }) => {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));
  const viewportRef = useRef(null);
  const exportPagesRef = useRef([]);
  const [scale, setScale] = useState(1);
  const [busy, setBusy] = useState("");
  // التقسيم على الصفحات بالقياس الحقيقي — مرة واحدة للمعاينة ونسخة التصدير.
  const { pages, measurer } = useOfferLayout(open ? doc : null);

  // تصغير المعاينة على قد عرض الشاشة (نسخة التصدير نفسها بمقاسها الطبيعي).
  useEffect(() => {
    if (!open) return undefined;

    const update = () => {
      const width = viewportRef.current?.clientWidth || PAGE_W;
      setScale(Math.min(1, (width - 24) / PAGE_W));
    };

    const timer = setTimeout(update, 0);
    window.addEventListener("resize", update);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  const fileName = `عرض سعر رقم ${doc?.code || ""}.pdf`;

  const runPdf = async (mode) => {
    const pages = exportPagesRef.current.filter(Boolean);
    if (!pages.length) return;

    try {
      setBusy(mode);
      await waitForImages(pages[0]?.parentElement);
      const pdf = await buildPdf(pages);

      if (mode === "print") {
        const url = pdf.output("bloburl");
        const win = window.open(url, "_blank");
        if (!win) pdf.save(fileName);
      } else {
        pdf.save(fileName);
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: error?.message || "تعذر تجهيز ملف PDF",
        confirmButtonText: "حسناً"
      });
    } finally {
      setBusy("");
    }
  };

  if (!doc) return null;

  const pageCount = Math.max(1, pages.length);

  return (
    <Dialog open={open} onClose={() => !busy && onClose?.()} fullScreen={isPhone} fullWidth maxWidth="lg" PaperProps={{ sx: { direction: "rtl", height: isPhone ? "100dvh" : "94vh" } }}>
      <DialogTitle
        sx={{
          fontWeight: 900,
          color: "#fff",
          background: `linear-gradient(135deg, ${primaryColor}, ${primaryDark})`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <span>معاينة عرض السعر رقم {doc.code}</span>
        <Typography component="span" sx={{ fontWeight: 700, fontSize: "0.85rem", opacity: 0.85 }}>
          {doc.companyName}
        </Typography>
      </DialogTitle>

      <DialogContent ref={viewportRef} dividers sx={{ background: "#e9eef2", p: 1.5 }}>
        <Stack alignItems="center">
          <Box sx={{ width: PAGE_W * scale, height: (PAGE_H * pageCount + PAGE_GAP * (pageCount - 1)) * scale, flexShrink: 0 }}>
            <Box
              sx={{
                width: PAGE_W,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                direction: "ltr",
                display: "flex",
                flexDirection: "column",
                gap: `${PAGE_GAP}px`,
                "& .offer-price-page": { boxShadow: "0 6px 24px rgba(0,0,0,.18)" }
              }}
            >
              <OfferPriceDocument doc={doc} pages={pages} />
            </Box>
          </Box>
        </Stack>

        {/* نسخة التصدير بمقاسها الحقيقي خارج الشاشة */}
        <Box aria-hidden sx={{ position: "fixed", left: -20000, top: 0, direction: "ltr", pointerEvents: "none" }}>
          <OfferPriceDocument doc={doc} pages={pages} pageRefs={exportPagesRef} />
        </Box>
        {measurer}
      </DialogContent>

      <DialogActions sx={{ gap: 1, flexWrap: "wrap" }}>
        <Button onClick={onClose} disabled={Boolean(busy)} startIcon={<CloseIcon />} sx={{ fontWeight: 900, color: "#ae1e21" }}>
          إغلاق
        </Button>
        <Button
          variant="outlined"
          onClick={() => runPdf("print")}
          disabled={Boolean(busy)}
          startIcon={busy === "print" ? <CircularProgress size={16} /> : <PrintIcon />}
          sx={{ fontWeight: 900, borderColor: primaryColor, color: primaryColor }}
        >
          طباعة
        </Button>
        <Button
          variant="contained"
          onClick={() => runPdf("save")}
          disabled={Boolean(busy)}
          startIcon={busy === "save" ? <CircularProgress size={16} color="inherit" /> : <PictureAsPdfIcon />}
          sx={{ fontWeight: 900, backgroundColor: primaryColor, "&:hover": { backgroundColor: primaryDark } }}
        >
          حفظ PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OfferPricePreviewDialog;
