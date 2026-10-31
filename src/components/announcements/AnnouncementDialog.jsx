// نافذة التنبيه / الإعلان (api/announcements):
// - standard: تنبيه عادي بأيقونة نوعه وزر "تم الاطلاع".
// - blessing: إعلان مميز — ينزل من السماء ويرتد بخفة، وفوقه سحابة بتمطر، والخلفية كلها مطر (خير)،
//   والتوقيع بخط رقعة بتدرّج ذهبي وتحته خط بيترسم كأنه بالقلم.
// ملاحظتين مهمين:
// - كل الألوان متثبّتة بـ pin(): في الداكن adaptiveColor (config/themeColors.js) بيغمّق أي خلفية فاتحة،
//   فالذهبي والمطر والزر كانوا بيطلعوا بني وكحلي. light-dark(x, x) بيخليه يسيب القيمة كلها زي ما هي.
// - النصوص Box مش Typography: typographySystem.js بيثبّت مقاس كل .MuiTypography-root في البرنامج.
import React, { forwardRef, useEffect } from "react";
import { Backdrop, Box, Button, CircularProgress, Dialog, IconButton } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import CloudIcon from "@mui/icons-material/Cloud";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

const pin = (color) => `light-dark(${color}, ${color})`;

const FONT = "Cairo, Tahoma, sans-serif";
const SIGNATURE_FONT_URL = "https://fonts.googleapis.com/css2?family=Aref+Ruqaa:wght@700&display=swap";
const TYPES = {
  info: { color: "#3b82f6", Icon: InfoOutlinedIcon },
  success: { color: "#10b981", Icon: CheckCircleOutlineIcon },
  warning: { color: "#f59e0b", Icon: WarningAmberIcon },
  error: { color: "#ef4444", Icon: ErrorOutlineIcon }
};
const reducedMotion = "@media (prefers-reduced-motion: reduce)";

// ألوان الإعلان المميز لكل وضع (متثبّتة، ومتحسبة يدوي مش بالتحويل التلقائي)
const PALETTE = {
  dark: {
    paper: "linear-gradient(165deg, #133a30 0%, #0d2620 48%, #0c1a2c 100%)",
    border: "rgba(242, 210, 124, 0.35)",
    glow: "rgba(242, 210, 124, 0.16)",
    gold: "#f6d77f",
    goldDeep: "#d9a94a",
    goldLight: "#fff1c2",
    text: "#eef6f1",
    muted: "rgba(238, 246, 241, 0.7)",
    chipBg: "rgba(246, 215, 127, 0.10)",
    highlightBg: "#10302a",
    green: "#4ade80",
    sloganText: "#a7f3d0",
    sloganBg: "rgba(74, 222, 128, 0.12)",
    cloud: "#e6f1fa",
    shadow: "0 40px 110px rgba(0,0,0,.65), 0 0 0 1px rgba(255,255,255,.04) inset, 0 0 80px rgba(246,215,127,.10)"
  },
  light: {
    paper: "linear-gradient(165deg, #ffffff 0%, #f7fbf8 55%, #f2f7fc 100%)",
    border: "rgba(169, 118, 20, 0.28)",
    glow: "rgba(217, 165, 49, 0.14)",
    gold: "#c48a1c",
    goldDeep: "#8a5c0c",
    goldLight: "#e9b949",
    text: "#1b2a23",
    muted: "rgba(27, 42, 35, 0.66)",
    chipBg: "rgba(196, 138, 28, 0.08)",
    highlightBg: "#f4fbf7",
    green: "#059669",
    sloganText: "#057546",
    sloganBg: "rgba(5, 117, 70, 0.08)",
    cloud: "#ffffff",
    shadow: "0 40px 100px rgba(4,30,22,.40)"
  }
};

// خط التوقيع بيتحمّل مرة واحدة أول ما يظهر إعلان مميز
const useSignatureFont = (enabled) => {
  useEffect(() => {
    if (!enabled || document.querySelector(`link[href="${SIGNATURE_FONT_URL}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = SIGNATURE_FONT_URL;
    document.head.appendChild(link);
  }, [enabled]);
};

// ---------- خلفية المطر ----------
const DROPS = Array.from({ length: 120 }, (_, i) => ({
  left: ((i * 37) % 100) + ((i * 13) % 7) / 10,
  delay: ((i * 7) % 26) / 10,
  duration: 0.7 + ((i * 11) % 9) / 10,
  length: 16 + ((i * 5) % 22),
  width: i % 5 === 0 ? 2 : 1.5,
  opacity: 0.35 + ((i * 3) % 6) / 10
}));

const RainBackdrop = forwardRef(function RainBackdrop({ children, ...rest }, ref) {
  return (
    <Backdrop
      ref={ref}
      {...rest}
      sx={{
        overflow: "hidden",
        background: pin(
          "radial-gradient(900px 520px at 50% 6%, rgba(246,215,127,.16), transparent 62%), radial-gradient(1200px 700px at 50% 100%, rgba(52,211,153,.14), transparent 60%), linear-gradient(180deg, rgba(3,12,22,.94) 0%, rgba(4,22,19,.92) 100%)"
        )
      }}
    >
      <Box aria-hidden sx={{ position: "absolute", inset: 0, pointerEvents: "none", [reducedMotion]: { display: "none" } }}>
        {DROPS.map((d, i) => (
          <Box
            key={i}
            sx={{
              position: "absolute", top: -50, left: `${d.left}%`, width: `${d.width}px`, height: d.length, borderRadius: 2,
              background: pin(`linear-gradient(180deg, rgba(190,230,255,0) 0%, rgba(190,230,255,${Math.min(0.95, d.opacity)}) 100%)`),
              animation: `annRain ${d.duration}s linear ${d.delay}s infinite`,
              "@keyframes annRain": { "0%": { transform: "translate3d(0,-10vh,0) rotate(8deg)" }, "100%": { transform: "translate3d(-34px,112vh,0) rotate(8deg)" } }
            }}
          />
        ))}
      </Box>
      {children}
    </Backdrop>
  );
});

// ---------- الإعلان المميز ----------
const BlessingContent = ({ alert, onAcknowledge, acknowledging, onClose, preview, c }) => {
  const extra = alert.extra || {};

  return (
    <Box sx={{ position: "relative", fontFamily: FONT }}>
      {/* السحابة والمطر النازل منها */}
      <Box aria-hidden sx={{ position: "absolute", top: -104, left: 0, right: 0, height: 112, pointerEvents: "none", display: "flex", justifyContent: "center" }}>
        <Box sx={{ position: "relative", width: 260, height: 112 }}>
          <CloudIcon
            sx={{
              position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", fontSize: 124, color: pin(c.cloud),
              filter: "drop-shadow(0 12px 26px rgba(0,0,0,.35))",
              animation: "annFloat 4s ease-in-out infinite",
              "@keyframes annFloat": { "0%,100%": { marginTop: 0 }, "50%": { marginTop: "-6px" } },
              [reducedMotion]: { animation: "none" }
            }}
          />
          {Array.from({ length: 12 }, (_, i) => (
            <Box
              key={i}
              sx={{
                position: "absolute", top: 80, left: `${25 + i * 4.4}%`, width: 2, height: 14, borderRadius: 2,
                background: pin("linear-gradient(180deg, rgba(125,211,252,0), rgba(125,211,252,1))"),
                animation: `annCloudRain .8s linear ${(i % 4) * 0.18}s infinite`,
                "@keyframes annCloudRain": { "0%": { transform: "translateY(0)", opacity: 0 }, "25%": { opacity: 1 }, "100%": { transform: "translateY(32px)", opacity: 0 } },
                [reducedMotion]: { animation: "none", opacity: 0.7 }
              }}
            />
          ))}
        </Box>
      </Box>

      {/* شريط ذهبي فوق الكارت + توهج خلف العنوان */}
      <Box sx={{ position: "absolute", top: 0, left: 28, right: 28, height: 3, borderRadius: 3, background: pin(`linear-gradient(90deg, transparent, ${c.gold}, transparent)`) }} />
      <Box aria-hidden sx={{ position: "absolute", top: 40, left: "50%", transform: "translateX(-50%)", width: 420, maxWidth: "90%", height: 160, pointerEvents: "none", background: pin(`radial-gradient(closest-side, ${c.glow}, transparent)`) }} />

      <IconButton onClick={onClose} aria-label="إغلاق" sx={{ position: "absolute", left: 12, top: 12, color: pin(c.muted), zIndex: 1 }}>
        <CloseIcon />
      </IconButton>

      <Box sx={{ position: "relative", px: { xs: 3, sm: 6 }, pt: { xs: 5, sm: 6 }, pb: 4, textAlign: "center" }}>
        {extra.kicker ? (
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, px: 1.75, py: 0.6, borderRadius: 5, fontSize: 12.5, fontWeight: 700, color: pin(c.muted), border: `1px solid ${pin(c.border)}`, bgcolor: pin(c.chipBg) }}>
            <AutoAwesomeIcon sx={{ fontSize: 15, color: pin(c.gold) }} />
            {extra.kicker}
          </Box>
        ) : null}

        <Box
          role="heading"
          aria-level={2}
          sx={{
            mt: 2.25, fontSize: { xs: 28, sm: 36 }, fontWeight: 900, lineHeight: 1.45,
            background: pin(`linear-gradient(180deg, ${c.goldLight} 0%, ${c.gold} 45%, ${c.goldDeep} 100%)`),
            WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: pin(c.gold),
            filter: `drop-shadow(0 2px 14px ${c.glow})`
          }}
        >
          {alert.title}
        </Box>

        {/* زخرفة */}
        <Box aria-hidden sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1.25, my: 2.25 }}>
          <Box sx={{ width: 70, height: "1px", background: pin(`linear-gradient(90deg, transparent, ${c.gold})`) }} />
          <Box sx={{ width: 9, height: 9, transform: "rotate(45deg)", bgcolor: pin(c.gold), borderRadius: "2px", boxShadow: `0 0 12px ${c.glow}` }} />
          <Box sx={{ width: 70, height: "1px", background: pin(`linear-gradient(90deg, ${c.gold}, transparent)`) }} />
        </Box>

        <Box sx={{ fontSize: { xs: 15.5, sm: 17 }, lineHeight: 2.2, color: pin(c.text), textAlign: "justify", textAlignLast: "center", whiteSpace: "pre-line" }}>
          {alert.message}
        </Box>

        {extra.highlight ? (
          <Box sx={{ mt: 3, p: "1.5px", borderRadius: 3, background: pin(`linear-gradient(135deg, ${c.green}, ${c.gold})`) }}>
            <Box sx={{ borderRadius: "11px", px: 2.5, py: 1.6, bgcolor: pin(c.highlightBg), color: pin(c.text), fontWeight: 800, fontSize: 16, lineHeight: 1.9 }}>
              <Box component="span" sx={{ color: pin(c.green), fontWeight: 900, ml: 0.75 }}>＋</Box>
              {extra.highlight}
            </Box>
          </Box>
        ) : null}

        {extra.slogan ? (
          <Box dir="ltr" sx={{ mt: 3, display: "inline-block", px: 2.75, py: 1, borderRadius: 5, fontWeight: 800, fontSize: 15.5, letterSpacing: 0.6, color: pin(c.sloganText), bgcolor: pin(c.sloganBg) }}>
            {extra.slogan}
          </Box>
        ) : null}

        {/* التوقيع: خط رقعة بتدرّج ذهبي لامع وتحته خط بيترسم بالقلم */}
        {extra.signatureName ? (
          <Box sx={{ mt: 3.5 }}>
            {extra.signatureLabel ? <Box sx={{ fontSize: 15, color: pin(c.muted), fontWeight: 700 }}>{extra.signatureLabel}</Box> : null}
            <Box
              sx={{
                display: "inline-block", fontFamily: "'Aref Ruqaa', Cairo, serif", fontSize: { xs: 40, sm: 48 }, lineHeight: 1.3, mt: 0.25, px: 1,
                background: pin(`linear-gradient(90deg, ${c.goldDeep} 0%, ${c.gold} 30%, ${c.goldLight} 50%, ${c.gold} 70%, ${c.goldDeep} 100%)`),
                backgroundSize: "220% 100%", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: pin(c.gold),
                filter: `drop-shadow(0 3px 12px ${c.glow})`,
                animation: "annShine 3.2s ease-in-out 1.4s infinite",
                "@keyframes annShine": { "0%,100%": { backgroundPosition: "0% 0" }, "50%": { backgroundPosition: "100% 0" } },
                [reducedMotion]: { animation: "none" }
              }}
            >
              {extra.signatureName}
            </Box>
            <Box component="svg" viewBox="0 0 240 22" aria-hidden sx={{ display: "block", width: 210, height: 20, mx: "auto", mt: -0.75, overflow: "visible" }}>
              <defs>
                <linearGradient id="annSignatureLine" x1="0" x2="1">
                  <stop offset="0" stopColor={c.gold} stopOpacity="0" />
                  <stop offset=".18" stopColor={c.gold} />
                  <stop offset=".5" stopColor={c.goldLight} />
                  <stop offset=".82" stopColor={c.gold} />
                  <stop offset="1" stopColor={c.gold} stopOpacity="0" />
                </linearGradient>
              </defs>
              <Box
                component="path"
                d="M6 13 C 52 3, 96 19, 140 9 S 212 6, 234 12"
                fill="none" stroke="url(#annSignatureLine)" strokeWidth="3" strokeLinecap="round"
                sx={{
                  strokeDasharray: 260, strokeDashoffset: 260,
                  animation: "annDraw 1.3s ease-out 1.2s forwards",
                  "@keyframes annDraw": { to: { strokeDashoffset: 0 } },
                  [reducedMotion]: { animation: "none", strokeDashoffset: 0 }
                }}
              />
            </Box>
          </Box>
        ) : null}

        {!preview ? (
          <Button
            onClick={onAcknowledge}
            disabled={acknowledging}
            size="large"
            sx={{
              mt: 3.5, px: 7, py: 1.4, borderRadius: 6, fontFamily: FONT, fontWeight: 900, fontSize: 16.5,
              color: pin("#1a1405"),
              background: pin("linear-gradient(135deg, #fbe7a6 0%, #f2c75c 45%, #d9a531 100%)"),
              boxShadow: `0 12px 30px ${c.glow}, 0 0 0 1px rgba(255,255,255,.25) inset`,
              transition: "transform .15s, box-shadow .15s, filter .15s",
              "&:hover": { transform: "translateY(-1px)", filter: "brightness(1.05)", background: pin("linear-gradient(135deg, #fdeebf 0%, #f5cf6d 45%, #e0ae3d 100%)") },
              "&.Mui-disabled": { color: pin("rgba(26,20,5,.55)") }
            }}
          >
            {acknowledging ? <CircularProgress size={20} sx={{ color: pin("#1a1405") }} /> : extra.buttonText || "تم الاطلاع"}
          </Button>
        ) : null}
      </Box>
    </Box>
  );
};

// ---------- التنبيه العادي ----------
const StandardContent = ({ alert, onAcknowledge, acknowledging, onClose, preview, dark }) => {
  const t = TYPES[alert.alertType] || TYPES.info;
  const text = dark ? "#eef6f1" : "#1b2a23";
  return (
    <Box sx={{ position: "relative", fontFamily: FONT, textAlign: "center", px: { xs: 3, sm: 5 }, pt: 4.5, pb: 3.5 }}>
      <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, bgcolor: pin(t.color) }} />
      <IconButton onClick={onClose} aria-label="إغلاق" sx={{ position: "absolute", left: 10, top: 12, color: pin(dark ? "rgba(238,246,241,.7)" : "rgba(27,42,35,.6)") }}><CloseIcon /></IconButton>
      <Box sx={{ width: 68, height: 68, borderRadius: "50%", mx: "auto", display: "grid", placeItems: "center", bgcolor: pin(alpha(t.color, dark ? 0.2 : 0.1)) }}>
        <t.Icon sx={{ fontSize: 36, color: pin(t.color) }} />
      </Box>
      <Box role="heading" aria-level={2} sx={{ mt: 2, fontSize: 23, fontWeight: 800, color: pin(text), lineHeight: 1.5 }}>{alert.title}</Box>
      <Box sx={{ mt: 1.5, fontSize: 16, lineHeight: 2, color: pin(dark ? "rgba(238,246,241,.86)" : "rgba(27,42,35,.86)"), whiteSpace: "pre-line" }}>{alert.message}</Box>
      {!preview ? (
        <Button
          onClick={onAcknowledge}
          disabled={acknowledging}
          size="large"
          sx={{ mt: 3, px: 5, borderRadius: 5, fontFamily: FONT, fontWeight: 800, color: pin("#ffffff"), bgcolor: pin(t.color), "&:hover": { bgcolor: pin(t.color), filter: "brightness(1.08)" } }}
        >
          {acknowledging ? <CircularProgress size={20} sx={{ color: pin("#ffffff") }} /> : "تم الاطلاع"}
        </Button>
      ) : null}
    </Box>
  );
};

/**
 * alert: { title, message, alertType, displayStyle, extra }
 * onAcknowledge: زر الاطلاع (بيسجّل إنه شافه). onClose: الإغلاق من غير تسجيل (يرجع يظهر بعدين).
 * preview: معاينة من شاشة الإدارة أو زر "رسالة الإدارة" (من غير زر اطلاع).
 */
export default function AnnouncementDialog({ alert, open, onAcknowledge, onClose, acknowledging = false, preview = false }) {
  const theme = useTheme();
  const dark = theme.palette.mode === "dark";
  const blessing = alert?.displayStyle === "blessing";
  useSignatureFont(open && blessing);
  if (!alert) return null;
  const c = dark ? PALETTE.dark : PALETTE.light;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      dir="rtl"
      maxWidth="sm"
      fullWidth
      BackdropComponent={blessing ? RainBackdrop : undefined}
      PaperProps={{
        sx: blessing
          ? {
              overflow: "visible", borderRadius: 5, mt: 12, position: "relative",
              background: pin(c.paper), backgroundImage: pin(c.paper),
              border: `1px solid ${pin(c.border)}`,
              boxShadow: c.shadow,
              animation: "annSkyDrop 1.15s cubic-bezier(.17,1.18,.38,1) both",
              "@keyframes annSkyDrop": {
                "0%": { transform: "translateY(-120vh) scale(.95)", opacity: 0 },
                "55%": { opacity: 1 },
                "100%": { transform: "translateY(0) scale(1)", opacity: 1 }
              },
              [reducedMotion]: { animation: "none" }
            }
          : {
              borderRadius: 4, overflow: "hidden", backgroundImage: "none",
              bgcolor: pin(dark ? "#13251d" : "#ffffff"), border: `1px solid ${pin(dark ? "rgba(103,201,157,.35)" : "rgba(5,117,70,.15)")}`
            }
      }}
    >
      {blessing ? (
        <BlessingContent alert={alert} onAcknowledge={onAcknowledge} acknowledging={acknowledging} onClose={onClose} preview={preview} c={c} />
      ) : (
        <StandardContent alert={alert} onAcknowledge={onAcknowledge} acknowledging={acknowledging} onClose={onClose} preview={preview} dark={dark} />
      )}
    </Dialog>
  );
}
