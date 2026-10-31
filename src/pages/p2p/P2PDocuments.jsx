// مستندات موظف إدارة التعاقدات (شاشة إدخال الزيارات): خطاب شكر موثّق، عرض سعر، وشعار المعهد للتحميل.
import React, { useState } from "react";
import { Box, Button, ButtonBase, Grid, Paper, Stack, Typography, alpha } from "@mui/material";
import MarkEmailReadRoundedIcon from "@mui/icons-material/MarkEmailReadRounded";
import RequestQuoteRoundedIcon from "@mui/icons-material/RequestQuoteRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import P2PThankLetter from "./P2PThankLetter";
import OfferPricePage from "../OfferPricePage";
import { GREEN, GREEN_DARK, useUi } from "./p2pShared";

const PUBLIC = process.env.PUBLIC_URL || "";

const SECTIONS = [
  { key: "letter", icon: MarkEmailReadRoundedIcon, title: "خطاب شكر", text: "خطاب رسمي موثّق برقم مسلسل وختم المعهد ورمز تحقق" },
  { key: "offer", icon: RequestQuoteRoundedIcon, title: "عرض سعر", text: "عرض سعر للشركات بالبرامج والأسعار، وتحميله PDF" },
  { key: "logo", icon: ImageRoundedIcon, title: "شعار المعهد", text: "نسخ رسمية عالية الجودة من الشعار والترويسة" }
];

const LOGOS = [
  { file: "/brand/sstli-logo.png", name: "شعار-المعهد-السعودي-المتخصص.png", title: "الشعار بخلفية شفافة", format: "PNG", hint: "للعروض التقديمية والتصاميم والخلفيات الملونة", checker: true },
  { file: "/brand/sstli-logo.jpg", name: "شعار-المعهد-السعودي-المتخصص.jpg", title: "الشعار بخلفية بيضاء", format: "JPG", hint: "للمستندات والطباعة والمراسلات" },
  { file: "/offer-price/header.png", name: "ترويسة-المعهد.png", title: "ترويسة المعهد", format: "PNG", hint: "الترويسة الرسمية بالاسم العربي والإنجليزي لأعلى الصفحات", wide: true }
];

function SectionCards({ value, onChange }) {
  const ui = useUi();
  return (
    <Grid container spacing={1.5}>
      {SECTIONS.map((s) => {
        const active = value === s.key;
        const Icon = s.icon;
        return (
          <Grid item xs={12} md={4} key={s.key}>
            <ButtonBase
              onClick={() => onChange(s.key)}
              aria-pressed={active}
              sx={{
                width: "100%",
                textAlign: "right",
                justifyContent: "flex-start",
                borderRadius: 3,
                p: 1.8,
                gap: 1.5,
                border: `1.5px solid ${active ? GREEN : ui.dark ? "rgba(255,255,255,.1)" : alpha(GREEN, 0.14)}`,
                background: active
                  ? `linear-gradient(135deg, ${alpha(GREEN, ui.dark ? 0.32 : 0.1)}, ${alpha(GREEN, ui.dark ? 0.12 : 0.02)})`
                  : ui.dark ? "rgba(255,255,255,.02)" : "#fff",
                boxShadow: active ? `0 10px 26px ${alpha(GREEN, 0.18)}` : "none",
                transition: "all .18s ease",
                "&:hover": { borderColor: GREEN, transform: "translateY(-1px)" }
              }}
            >
              <Box
                sx={{
                  width: 48, height: 48, borderRadius: 2.5, flexShrink: 0, display: "grid", placeItems: "center", color: "#fff",
                  background: active ? `linear-gradient(135deg, ${GREEN}, ${GREEN_DARK})` : alpha(GREEN, ui.dark ? 0.35 : 0.55)
                }}
              >
                <Icon />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={0.6} alignItems="center">
                  <Typography sx={{ fontWeight: 900, fontSize: 16 }}>{s.title}</Typography>
                  {active ? <CheckCircleRoundedIcon sx={{ fontSize: 18, color: ui.greenText }} /> : null}
                </Stack>
                <Typography sx={{ fontSize: 12.5, color: "text.secondary", mt: 0.2 }}>{s.text}</Typography>
              </Box>
            </ButtonBase>
          </Grid>
        );
      })}
    </Grid>
  );
}

function LogoDownloads() {
  const ui = useUi();
  // خلفية فاتحة دايمًا (حتى في الوضع الغامق) عشان كتابة الشعار السوداء تبان
  const checker = "repeating-conic-gradient(#e9eeea 0% 25%, #ffffff 0% 50%) 50% / 20px 20px";
  return (
    <Paper elevation={0} sx={{ ...ui.card, p: { xs: 1.8, md: 2.4 } }}>
      <Typography sx={{ ...ui.sectionTitle, mb: 0.3 }}>شعار المعهد</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
        نسخ رسمية عالية الجودة من شعار المعهد للاستخدام في المراسلات والعروض مع الشركات.
      </Typography>
      <Grid container spacing={1.8}>
        {LOGOS.map((logo) => (
          <Grid item xs={12} sm={logo.wide ? 12 : 6} md={logo.wide ? 6 : 3} key={logo.file}>
            <Box sx={{ border: `1px solid ${ui.dark ? "rgba(255,255,255,.1)" : alpha(GREEN, 0.14)}`, borderRadius: 3, overflow: "hidden", height: "100%", display: "flex", flexDirection: "column" }}>
              <Box sx={{ position: "relative", height: 190, p: logo.wide ? 2.5 : 3, backgroundColor: "#ffffff", background: logo.checker ? checker : "#ffffff", boxSizing: "border-box" }}>
                {/* الصورة بتملى الإطار بنسبتها (contain) — maxHeight مابيشتغلش جوه grid */}
                <Box component="img" src={`${PUBLIC}${logo.file}`} alt={logo.title} sx={{ display: "block", width: "100%", height: "100%", objectFit: "contain", filter: "drop-shadow(0 4px 10px rgba(0,0,0,.08))" }} />
                <Box sx={{ position: "absolute", top: 10, left: 10, px: 1, py: 0.2, borderRadius: 1, fontSize: 11, fontWeight: 900, color: "#fff", bgcolor: alpha("#000", 0.55) }}>{logo.format}</Box>
              </Box>
              <Stack direction="row" alignItems="center" spacing={1.2} sx={{ p: 1.6, mt: "auto", borderTop: `1px solid ${ui.dark ? "rgba(255,255,255,.08)" : alpha(GREEN, 0.1)}` }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 900, fontSize: 14.5 }}>{logo.title}</Typography>
                  <Typography variant="caption" color="text.secondary">{logo.hint}</Typography>
                </Box>
                <Button component="a" href={`${PUBLIC}${logo.file}`} download={logo.name} variant="contained" startIcon={<DownloadRoundedIcon />} sx={{ ...ui.primaryBtn, borderRadius: 2 }}>
                  تحميل
                </Button>
              </Stack>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}

export default function P2PDocuments() {
  const [section, setSection] = useState("letter");
  return (
    <Stack spacing={1.8}>
      <SectionCards value={section} onChange={setSection} />
      {section === "letter" ? <P2PThankLetter /> : null}
      {section === "offer" ? <Box sx={{ mx: { xs: -1.5, md: -3 } }}><OfferPricePage /></Box> : null}
      {section === "logo" ? <LogoDownloads /> : null}
    </Stack>
  );
}
