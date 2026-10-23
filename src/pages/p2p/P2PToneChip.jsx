// شارة حالة بألوان ثابتة واضحة في الوضع الفاتح والداكن (بدل ألوان الثيم اللي بتبهت في الداكن).
import React from "react";
import { Chip, alpha, useTheme } from "@mui/material";

const TONES = {
  default: { base: "#78909c", light: "#37474f", dark: "#cfd8dc" },
  info: { base: "#1e88e5", light: "#0d47a1", dark: "#90caf9" },
  warning: { base: "#f59e0b", light: "#8a4b00", dark: "#fcd34d" },
  success: { base: "#16a34a", light: "#14532d", dark: "#86efac" },
  error: { base: "#e53935", light: "#a51b1b", dark: "#fca5a5" },
  primary: { base: "#057546", light: "#034d31", dark: "#8fe0b8" }
};

export default function P2PToneChip({ tone = "default", sx, ...props }) {
  const theme = useTheme();
  const dark = theme.palette.mode === "dark";
  const t = TONES[tone] || TONES.default;
  return (
    <Chip
      {...props}
      sx={{
        fontWeight: 800,
        color: dark ? t.dark : t.light,
        bgcolor: alpha(t.base, dark ? 0.2 : 0.12),
        border: `1px solid ${alpha(t.base, dark ? 0.55 : 0.4)}`,
        "& .MuiChip-icon": { color: "inherit" },
        ...sx
      }}
    />
  );
}
