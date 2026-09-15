import { adaptiveInlineStyle } from '../config/themeColors';
import * as uiLayout from './common/uiLayout';
import React, { useState, useEffect } from "react";
import { Box, Typography, Chip, Button } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket, TrendingUp, Analytics, TaskAlt, Close, Star,
  EmojiEvents, Whatshot, NewReleases
} from "@mui/icons-material";

/* ================= Theme ================= */
const COLOR_SCHEME = {
  primary: '#79ad97',
  primaryLight: '#9ac9b5',
  primaryDark: '#5a8f7a',
  secondary: '#ff6b6b',
  accent: '#4ecdc4',
  gold: '#FFD700',
  warning: '#f59e42',
  success: '#22c55e'
};

const RIBBON_WIDTH = 320;

/* ================= Bird geometry ================= */
const BIRD_SCALE = 0.9;        // نفس القياس في كل مكان
const FOOT_BOTTOM_Y = 56;      // أقل نقطة في الرجل داخل SVG
const HEAD_CX = 56;            // مركز الرأس
const HEAD_CY = 26;

/* ================= SVG Bird ================= */
const BirdSVG = ({
  side = "right",
  gaze = "center",      // اتجاه النظرة: center | up | down
  colorBody = "#3b82f6",
  colorWing = "#60a5fa",
  scale = BIRD_SCALE,
  blinking = false
}) => {
  const isRight = side === "right";

  // ميلان الرأس باتجاه وسط الصفحة (يمين تميل لليسار والعكس)
  const lookAngle = isRight ? -15 : 15;
  const upDown = gaze === "up" ? -6 : gaze === "down" ? 6 : 0;

  const headOrigin = "56px 26px"; // عند الرقبة

  return (
    <svg
      width={80 * scale}
      height={64 * scale}
      viewBox="0 0 80 64"
      style={{ display: "block" }}
    >
      <g transform={isRight ? "" : "translate(80,0) scale(-1,1)"}>
        {/* اهتزاز بسيط للجسم (تنفّس) */}
        <motion.g
          animate={{ y: [0, -1.2, 0] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
        >
          {/* الذيل */}
          <path d="M12 30 L2 22 L4 36 Z" fill={colorWing} opacity={0.9} />
          {/* الجسم */}
          <ellipse cx="38" cy="32" rx="26" ry="18" fill={colorBody} />
          {/* الجناح */}
          <path
            d="M28 30 C 24 36, 36 44, 46 36 C 38 30, 34 28, 28 30 Z"
            fill={colorWing}
            opacity={0.95}
          />
        </motion.g>

        {/* الرجلين (ثابتة) */}
        <path d="M36 48 l-4 8 M42 48 l-2 8"
              stroke="#eab308" strokeWidth="2.5" strokeLinecap="round" />

        {/* الرأس + المنقار + العين: نظرة انبهار */}
        <motion.g
          animate={{ rotate: lookAngle, y: upDown }}
          transition={{ type: "spring", stiffness: 400, damping: 18 }}
          style={{ transformOrigin: headOrigin }}
        >
          <circle cx={HEAD_CX} cy={HEAD_CY} r="12" fill={colorBody} />
          <path d="M68 26 L78 22 L68 30 Z" fill="#fbbf24" />
          <circle
            cx="60"
            cy="24"
            r={blinking ? 0.8 : 2.4}
            fill="#111827"
            style={{ transition: "r .12s ease" }}
          />
          {/* لمعة عين */}
          <circle cx="59.5" cy="23.4" r="0.8" fill="#fff" opacity={blinking ? 0 : 0.95} />
        </motion.g>
      </g>
    </svg>
  );
};

/* ================= طائر واقف على الحافة فقط ================= */
const PerchedBird = ({
  side = "right",
  colorBody,
  colorWing
}) => {
  const isRight = side === "right";
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 120);
    }, 2200 + Math.random() * 1800);
    return () => clearInterval(id);
  }, []);

  // رجول لازقة بالحافة بالملّي
  const wrapStyle = {
    position: "absolute",
    top: 0,
    [isRight ? "right" : "left"]: 22,
    transform: `translateY(-${FOOT_BOTTOM_Y * BIRD_SCALE - 1}px)`,
    pointerEvents: "none",
    zIndex: 3
  };

  return (
    <Box sx={wrapStyle}>
      <BirdSVG
        side={side}
        gaze="center"
        colorBody={colorBody}
        colorWing={colorWing}
        scale={BIRD_SCALE}
        blinking={blink}
      />

      {/* نجوم انبهار صغيرة حول الرأس */}
      <Box sx={{ position: "absolute", top: (HEAD_CY - 10) * BIRD_SCALE, [isRight ? "right" : "left"]: (80 - HEAD_CX + 10) * BIRD_SCALE }}>
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0, x: 0, y: 0 }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
              x: (isRight ? -1 : 1) * (6 + i * 4),
              y: -8 - i * 4
            }}
            transition={{ duration: 1.2 + i * 0.1, repeat: Infinity, repeatDelay: 1.2 }}
            style={adaptiveInlineStyle({
              position: "absolute",
              width: 6, height: 6, borderRadius: 2,
              background: COLOR_SCHEME.gold,
              boxShadow: "0 0 6px rgba(255,215,0,.8)"
            })}
          />
        ))}
      </Box>
    </Box>
  );
};

/* ================= Rope ================= */
const CenterRope = ({ side = "right", delay = 0, lengthVh = 55 }) => {
  const isRight = side === "right";
  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        [isRight ? "right" : "left"]: 60,
        width: RIBBON_WIDTH,
        zIndex: 10001,
        pointerEvents: "none"
      }}
    >
      <motion.div
        initial={{ scaleY: 0, opacity: 0.8 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={{ delay, duration: 1.1, type: "spring", stiffness: 160, damping: 18 }}
        style={adaptiveInlineStyle({
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 2,
          height: `${lengthVh}vh`,
          background: "linear-gradient(to bottom, rgba(255,255,255,.9), rgba(255,255,255,.55))",
          boxShadow: "0 0 6px rgba(255,255,255,.45)",
          transformOrigin: "top"
        })}
      />
    </Box>
  );
};

/* ================= Falling Cards (optional) ================= */
const CardEmitter = ({ side = "right", delay = 1.2 }) => {
  const isRight = side === "right";
  return (
    <Box sx={{
      position: "absolute",
      top: "50%",
      [isRight ? "right" : "left"]: 60,
      width: RIBBON_WIDTH,
      transform: "translateY(-50%)",
      zIndex: 10001,
      pointerEvents: "none"
    }}>
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ x: 0, y: -40, scale: 0.6, rotate: 0, opacity: 0 }}
          animate={{
            x: (isRight ? -1 : 1) * (80 + Math.random() * 90),
            y: 120 + Math.random() * 90,
            rotate: (isRight ? -1 : 1) * (120 + Math.random() * 80),
            opacity: [0, 1, 0]
          }}
          transition={{ delay: delay + i * 0.16, duration: 1.35, ease: "easeOut" }}
          style={adaptiveInlineStyle({
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            width: 48 + Math.random() * 18,
            height: 28 + Math.random() * 14,
            borderRadius: 6,
            background: "white",
            boxShadow: "0 8px 24px rgba(0,0,0,.25)"
          })}
        />
      ))}
    </Box>
  );
};

/* ================= Hanging Ribbon + Birds ================= */
const HangingRibbon = ({
  side = "right",
  title,
  subtitle,
  delay = 1.3,
  emitCards = false
}) => {
  const isRight = side === "right";

  return (
    <>
      <CenterRope side={side} delay={delay - 0.3} />
      {emitCards && <CardEmitter side={side} delay={delay + 0.4} />}

      <motion.div
        initial={{ y: "-70vh", rotate: isRight ? 4 : -4, opacity: 0 }}
        animate={{
          y: 0,
          rotate: [isRight ? 4 : -4, isRight ? -2 : 2, isRight ? 1 : -1, 0],
          opacity: 1
        }}
        transition={{
          delay,
          duration: 1.6,
          type: "spring",
          stiffness: 150,
          damping: 16
        }}
        style={{
          position: "absolute",
          top: "50%",
          [isRight ? "right" : "left"]: 60,
          width: RIBBON_WIDTH,
          transform: "translateY(-50%)",
          zIndex: 10002
        }}
      >
        {/* عقدة */}
        <Box sx={{
          position: "absolute",
          top: -10,
          left: "50%",
          transform: "translateX(-50%)",
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 2px 8px rgba(0,0,0,.25), inset 0 -3px 6px rgba(0,0,0,.15)",
          zIndex: 1
        }} />

        <motion.div
          animate={{ rotate: [0, isRight ? 1 : -1, 0, isRight ? -0.6 : 0.6, 0] }}
          transition={{ repeat: Infinity, duration: 5.2, ease: "easeInOut", delay: delay + 1.6 }}
          style={{ position: "relative" }}
        >
          <Box
            sx={{
              width: RIBBON_WIDTH,
              px: 2.5,
              py: 1.9,
              borderRadius: 14,
              background: `linear-gradient(135deg, ${COLOR_SCHEME.gold}, ${COLOR_SCHEME.warning})`,
              color: "#1f2937",
              boxShadow: "0 10px 30px rgba(0,0,0,0.25), inset 0 -6px 12px rgba(255,255,255,0.35)",
              position: "relative",
              overflow: "visible"
            }}
          >
            {/* العصفور الشيك بدون حبوب */}
            <PerchedBird
              side={side}
              colorBody={isRight ? "#3b82f6" : "#10b981"}
              colorWing={isRight ? "#60a5fa" : "#34d399"}
            />

            {/* ذيل البالون */}
            <Box
              sx={{
                position: "absolute",
                bottom: -18,
                [isRight ? "right" : "left"]: 22,
                width: 0,
                height: 0,
                borderLeft: isRight ? "12px solid transparent" : `12px solid ${COLOR_SCHEME.warning}`,
                borderRight: isRight ? `12px solid ${COLOR_SCHEME.warning}` : "12px solid transparent",
                borderTop: `18px solid ${COLOR_SCHEME.warning}`,
                filter: "drop-shadow(0 4px 4px rgba(0,0,0,0.2))"
              }}
            />

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              <NewReleases sx={{ fontSize: 26 }} />
              <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", lineHeight: 1.2 }}>
                {title}
              </Typography>
            </Box>

            {subtitle && (
              <Typography sx={{ fontSize: ".92rem", mt: 0.75, opacity: 0.9 }}>
                {subtitle}
              </Typography>
            )}

            <Box sx={{ mt: 1.1, display: "inline-flex", alignItems: "center", gap: 0.75 }}>
              <Chip
                size="small"
                icon={<Whatshot sx={{ color: "#fff !important" }} />}
                label="محدود لفترة"
                sx={{
                  height: 26,
                  color: "#fff",
                  background: "rgba(0,0,0,0.28)",
                  backdropFilter: "blur(6px)",
                  px: 0.75
                }}
              />
            </Box>
          </Box>
        </motion.div>
      </motion.div>
    </>
  );
};

/* ================= Fireworks & Confetti (كما هي) ================= */
const FireworksDisplay = () => (
  <Box sx={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9998 }}>
    {[...Array(15)].map((_, i) => (
      <motion.div
        key={i}
        initial={{ x: typeof window !== "undefined" ? Math.random() * window.innerWidth : 0, y: typeof window !== "undefined" ? window.innerHeight : 0, scale: 0 }}
        animate={{ y: typeof window !== "undefined" ? Math.random() * window.innerHeight * 0.6 : 0, scale: [0, 1, 0], opacity: [0, 1, 0] }}
        transition={{ duration: Math.random() * 1.5 + 1, repeat: Infinity, delay: Math.random() * 2, ease: "easeOut" }}
        style={adaptiveInlineStyle({ position: 'absolute', width: 8, height: 8, background: [COLOR_SCHEME.gold, COLOR_SCHEME.primary, COLOR_SCHEME.accent, COLOR_SCHEME.secondary][i % 4], borderRadius: '50%', filter: 'blur(1px)' })}
      >
        {[...Array(8)].map((_, j) => (
          <motion.div
            key={j}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1, 0], opacity: [0, 1, 0], x: Math.cos((j * 45 * Math.PI) / 180) * 50, y: Math.sin((j * 45 * Math.PI) / 180) * 50 }}
            transition={{ duration: 1, repeat: Infinity, delay: Math.random() * 0.5, ease: "easeOut" }}
            style={adaptiveInlineStyle({ position: 'absolute', width: 4, height: 4, background: [COLOR_SCHEME.gold, COLOR_SCHEME.primary, COLOR_SCHEME.accent, COLOR_SCHEME.secondary][(i + j) % 4], borderRadius: '50%' })}
          />
        ))}
      </motion.div>
    ))}
  </Box>
);

const Confetti = () => {
  const confettiColors = [COLOR_SCHEME.primary, COLOR_SCHEME.accent, COLOR_SCHEME.secondary, COLOR_SCHEME.gold, COLOR_SCHEME.success];
  return (
    <Box sx={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9997 }}>
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ x: typeof window !== "undefined" ? Math.random() * window.innerWidth : 0, y: -50, rotate: 0, scale: 0 }}
          animate={{
            y: typeof window !== "undefined" ? window.innerHeight + 100 : 1000,
            rotate: 360,
            scale: [0, 1, 0.5, 0],
            x: typeof window !== "undefined" ? Math.random() * 200 - 100 + (Math.random() * window.innerWidth) : 0
          }}
          transition={{ duration: Math.random() * 3 + 2, delay: Math.random() * 1, ease: "easeInOut" }}
          style={adaptiveInlineStyle({ position: 'absolute', width: 12, height: 12, background: confettiColors[Math.floor(Math.random() * confettiColors.length)], borderRadius: Math.random() > 0.5 ? '50%' : '0%', opacity: 0.8 })}
        />
      ))}
    </Box>
  );
};

/* ================= Main ================= */
const NewVersionCelebration = ({ onClose }) => {
  const [show, setShow] = useState(true);
  const [showFireworks, setShowFireworks] = useState(true);

  const handleClose = () => {
    setShow(false);
    setTimeout(onClose, 500);
  };

  useEffect(() => {
    const timer = setTimeout(() => setShowFireworks(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={adaptiveInlineStyle({
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: `linear-gradient(135deg, ${COLOR_SCHEME.primary} 0%, ${COLOR_SCHEME.primaryDark} 30%, ${COLOR_SCHEME.accent} 100%)`,
            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', overflow: 'hidden', direction: "rtl"
          })}
        >
          {showFireworks && <FireworksDisplay />}
          <Confetti />

          {/* اليمين */}
          <HangingRibbon
            side="right"
            delay={1.3}
            title="ترقية اليوم = إنجاز الغد"
            subtitle="جهدك واضح للجميع—كل تطوير صغير يحسب ويُذكر."
            emitCards
          />

          {/* الشمال */}
          <HangingRibbon
            side="left"
            delay={1.6}
            title="تحدّي الـ 7 أيام للتميّز"
            subtitle="استمرارية الفريق تصنع الفارق… عمل الجميع منظور ومُقدّر."
          />

          {/* الوسط (العنوان وزر) */}
          <motion.div
            initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            style={{ textAlign: 'center', position: 'relative', zIndex: 10000 }}
          >
            <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.5, type: "spring", stiffness: 200 }} style={{ marginBottom: 20 }}>
              <EmojiEvents sx={{ fontSize: 100, color: COLOR_SCHEME.gold }} />
            </motion.div>

            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8, type: "spring" }} style={{ marginBottom: 8 }}>
              <Typography variant="h1" sx={{
                fontWeight: 'bold', mb: 2,
                background: 'linear-gradient(45deg, #FFD700, #FFFFFF, #FFD700)',
                backgroundClip: 'text', WebkitBackgroundClip: 'text',
                color: 'transparent', textShadow: '0 0 30px rgba(255,215,0,0.5)'
              }}>
                🎉 الإصدار الجديد!
              </Typography>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
              <Typography variant="h3" sx={{ mb: 3, opacity: 0.9, textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                لوحة الأداء المحسنة
              </Typography>
            </motion.div>

            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.5, type: "spring" }} style={{ marginBottom: 30 }}>
              <Chip
                icon={<Rocket sx={{ color: COLOR_SCHEME.gold }} />}
                label="الإصدار 2.0"
                sx={{
                  background: 'rgba(255,255,255,0.2)', color: 'white',
                  fontSize: '1.5rem', padding: '15px 30px',
                  border: `2px solid ${COLOR_SCHEME.gold}`, backdropFilter: 'blur(10px)'
                }}
              />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.8 }} style={{ marginBottom: 40 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap' }}>
                <Chip icon={<TrendingUp />} label="إحصائيات محسنة" sx={{ background: 'rgba(255,255,255,0.2)', color: 'white' }} />
                <Chip icon={<Analytics />} label="رسومات متطورة" sx={{ background: 'rgba(255,255,255,0.2)', color: 'white' }} />
                <Chip icon={<TaskAlt />} label="تتبع المهام" sx={{ background: 'rgba(255,255,255,0.2)', color: 'white' }} />
              </Box>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2 }}>
              <Button
                variant="contained" size="large" onClick={handleClose} startIcon={<Whatshot />}
                sx={uiLayout.withUiSx({
                  background: `linear-gradient(45deg, ${COLOR_SCHEME.gold}, ${COLOR_SCHEME.warning})`,
                  color: 'white', fontSize: '1.2rem', padding: '12px 40px', borderRadius: 3,
                  boxShadow: '0 10px 30px rgba(255,215,0,0.4)',
                  '&:hover': {
                    background: `linear-gradient(45deg, ${COLOR_SCHEME.warning}, ${COLOR_SCHEME.gold})`,
                    boxShadow: '0 15px 40px rgba(255,215,0,0.6)', transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.3s ease'
                }, uiLayout.buttonSx)}
              >
                ابدأ الاستخدام
              </Button>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5 }} style={{ marginTop: 20 }}>
              <Button
                onClick={handleClose} startIcon={<Close />}
                sx={uiLayout.withUiSx({ color: 'rgba(255,255,255,0.8)', '&:hover': { color: 'white', background: 'rgba(255,255,255,0.1)' } }, uiLayout.buttonSx)}
              >
                تخطي
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NewVersionCelebration;
