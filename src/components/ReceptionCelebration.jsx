import React, { useEffect, useMemo, useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import CelebrationIcon from "@mui/icons-material/Celebration";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import StarIcon from "@mui/icons-material/Star";
import confetti from "canvas-confetti";

const primaryColor = "#057546";
const primaryDark = "#034d31";
const primaryLight = "#e6f3ee";
const accentColor = "#ae1e21";
const whiteColor = "#fefefe";
const goldColor = "#f4c542";

const confettiColors = [primaryColor, primaryDark, accentColor, whiteColor, goldColor];

const randomInRange = (min, max) => Math.random() * (max - min) + min;

const fireStrongCelebration = () => {
  const defaults = {
    colors: confettiColors,
    ticks: 260,
    gravity: 0.85,
    decay: 0.9,
    scalar: 0.95,
    zIndex: 9999,
    disableForReducedMotion: true
  };

  // بداية قوية من الجانبين
  confetti({
    ...defaults,
    particleCount: 130,
    angle: 62,
    spread: 75,
    startVelocity: 58,
    origin: { x: 0, y: 0.62 }
  });

  confetti({
    ...defaults,
    particleCount: 130,
    angle: 118,
    spread: 75,
    startVelocity: 58,
    origin: { x: 1, y: 0.62 }
  });

  // انفجار علوي في المنتصف
  setTimeout(() => {
    confetti({
      ...defaults,
      particleCount: 170,
      spread: 125,
      startVelocity: 46,
      origin: { x: 0.5, y: 0.16 }
    });
  }, 260);

  // أمطار خفيفة متتابعة
  const end = Date.now() + 2600;
  const interval = setInterval(() => {
    if (Date.now() > end) {
      clearInterval(interval);
      return;
    }

    confetti({
      ...defaults,
      particleCount: 34,
      startVelocity: 30,
      spread: 80,
      scalar: randomInRange(0.65, 1.1),
      origin: {
        x: randomInRange(0.12, 0.88),
        y: randomInRange(0.05, 0.25)
      }
    });
  }, 240);
};

const sparkleItems = [
  { top: "9%", left: "9%", size: 18, delay: 0 },
  { top: "15%", left: "82%", size: 22, delay: 0.15 },
  { top: "31%", left: "18%", size: 14, delay: 0.3 },
  { top: "34%", left: "74%", size: 16, delay: 0.45 },
  { top: "68%", left: "12%", size: 18, delay: 0.6 },
  { top: "72%", left: "86%", size: 20, delay: 0.75 },
  { top: "48%", left: "50%", size: 13, delay: 0.9 }
];

const ReceptionCelebration = ({
  title = "مكتب الاستقبال",
  subtitle = "أهلاً بك في لوحة الاستقبال",
  duration = 5200
}) => {
  const [visible, setVisible] = useState(false);

  const welcomeText = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "صباح الخير";
    if (hour < 18) return "مساء الخير";
    return "أهلاً بك";
  }, []);

  useEffect(() => {
    setVisible(true);
    fireStrongCelebration();

    const timer = setTimeout(() => {
      setVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  return (
    <AnimatePresence>
      {visible && (
        <Box
          component={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: 1900,
            pointerEvents: "none",
            overflow: "hidden",
            background:
              "radial-gradient(circle at 50% 8%, rgba(244,197,66,0.14) 0%, transparent 24%), radial-gradient(circle at 18% 26%, rgba(174,30,33,0.10) 0%, transparent 25%), radial-gradient(circle at 82% 20%, rgba(5,117,70,0.14) 0%, transparent 26%)"
          }}
        >
          {sparkleItems.map((item, index) => (
            <Box
              key={index}
              component={motion.div}
              initial={{ opacity: 0, scale: 0.2, rotate: 0 }}
              animate={{
                opacity: [0, 1, 0.55, 1, 0],
                scale: [0.2, 1.25, 0.85, 1.1, 0.4],
                rotate: [0, 35, -18, 24, 0],
                y: [0, -16, 10, -10, 0]
              }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                delay: item.delay,
                ease: "easeInOut"
              }}
              sx={{
                position: "absolute",
                top: item.top,
                left: item.left,
                width: item.size,
                height: item.size,
                color: index % 2 === 0 ? goldColor : accentColor,
                filter: `drop-shadow(0 0 12px ${index % 2 === 0 ? goldColor : accentColor})`
              }}
            >
              <StarIcon sx={{ fontSize: item.size }} />
            </Box>
          ))}

          <Box
            component={motion.div}
            initial={{ opacity: 0, y: -34, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -26, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 145, damping: 16 }}
            sx={{
              position: "absolute",
              top: { xs: 18, md: 26 },
              left: "50%",
              transform: "translateX(-50%)",
              width: { xs: "calc(100% - 28px)", sm: 620, md: 720 },
              borderRadius: 999,
              px: { xs: 2, sm: 2.6 },
              py: { xs: 1.3, sm: 1.55 },
              direction: "rtl",
              background:
                "linear-gradient(135deg, rgba(254,254,254,0.92) 0%, rgba(230,243,238,0.88) 50%, rgba(254,254,254,0.92) 100%)",
              border: `1px solid rgba(5,117,70,0.22)`,
              boxShadow: "0 22px 55px rgba(5,117,70,0.18)",
              backdropFilter: "blur(12px)",
              overflow: "hidden",
              "&:before": {
                content: '""',
                position: "absolute",
                inset: 0,
                background: `linear-gradient(90deg, transparent, rgba(174,30,33,0.12), transparent)`,
                transform: "translateX(-100%)",
                animation: "celebrationShine 1.9s ease-in-out infinite"
              },
              "@keyframes celebrationShine": {
                "0%": { transform: "translateX(-110%)" },
                "55%": { transform: "translateX(110%)" },
                "100%": { transform: "translateX(110%)" }
              }
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="center"
              spacing={1.35}
              sx={{ position: "relative", zIndex: 2 }}
            >
              <Box
                component={motion.div}
                animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.12, 1] }}
                transition={{ duration: 1.35, repeat: Infinity, ease: "easeInOut" }}
                sx={{
                  width: 48,
                  height: 48,
                  flex: "0 0 auto",
                  borderRadius: "18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: whiteColor,
                  background: `linear-gradient(135deg, ${accentColor}, ${primaryDark})`,
                  boxShadow: "0 12px 26px rgba(174,30,33,0.28)",
                  border: `2px solid ${whiteColor}`
                }}
              >
                <CelebrationIcon sx={{ fontSize: 28 }} />
              </Box>

              <Box sx={{ minWidth: 0, textAlign: "center" }}>
                <Typography
                  sx={{
                    fontSize: { xs: "1rem", sm: "1.2rem", md: "1.32rem" },
                    fontWeight: 1000,
                    color: primaryDark,
                    lineHeight: 1.25,
                    whiteSpace: { xs: "normal", sm: "nowrap" }
                  }}
                >
                  {welcomeText} — {title}
                </Typography>
                <Typography
                  sx={{
                    mt: 0.25,
                    fontSize: { xs: "0.74rem", sm: "0.82rem" },
                    fontWeight: 900,
                    color: "#547068",
                    whiteSpace: { xs: "normal", sm: "nowrap" },
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}
                >
                  {subtitle}
                </Typography>
              </Box>

              <Box
                component={motion.div}
                animate={{ y: [0, -5, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                sx={{
                  width: 38,
                  height: 38,
                  flex: "0 0 auto",
                  borderRadius: "50%",
                  display: { xs: "none", sm: "flex" },
                  alignItems: "center",
                  justifyContent: "center",
                  color: goldColor,
                  background: "rgba(244,197,66,0.14)",
                  border: "1px solid rgba(244,197,66,0.35)"
                }}
              >
                <AutoAwesomeIcon sx={{ fontSize: 23 }} />
              </Box>
            </Stack>

            <Box
              component={motion.div}
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: duration / 1000, ease: "linear" }}
              sx={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: 4,
                background: `linear-gradient(90deg, ${accentColor}, ${goldColor}, ${primaryColor})`
              }}
            />
          </Box>

          <Box
            component={motion.div}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0, 0.55, 0], scale: [0.8, 1.65, 2.1] }}
            transition={{ duration: 2.8, ease: "easeOut" }}
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 280,
              height: 280,
              mt: -140,
              ml: -140,
              borderRadius: "50%",
              border: `2px solid rgba(5,117,70,0.18)`,
              boxShadow: `0 0 75px rgba(5,117,70,0.20)`
            }}
          />
        </Box>
      )}
    </AnimatePresence>
  );
};

export default ReceptionCelebration;
