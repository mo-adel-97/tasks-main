// الجهاز محظور من شاشة مراقبة الأمان: رسالة على الشاشة كلها بدل ما الصفحات تفضل تفشل.
import React, { useEffect, useState } from "react";
import { Box, Paper, Typography } from "@mui/material";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import { BLOCKED_EVENT } from "../security/apiAuth";

export default function BlockedOverlay() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    const onBlocked = (event) => setMessage(event.detail || "تم حظر هذا الجهاز من استخدام النظام. تواصل مع مدير النظام.");
    window.addEventListener(BLOCKED_EVENT, onBlocked);
    return () => window.removeEventListener(BLOCKED_EVENT, onBlocked);
  }, []);

  if (!message) return null;

  return (
    <Box
      role="alertdialog"
      dir="rtl"
      sx={{ position: "fixed", inset: 0, zIndex: 3000, bgcolor: "rgba(15,23,42,.88)", display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}
    >
      <Paper sx={{ p: 4, borderRadius: 4, maxWidth: 440, width: "100%", textAlign: "center" }}>
        <BlockRoundedIcon sx={{ fontSize: 64, color: "#dc2626", mb: 1 }} />
        <Typography sx={{ fontWeight: 900, fontSize: 22, mb: 1 }}>تم حظر الوصول</Typography>
        <Typography sx={{ color: "text.secondary", fontSize: 15, fontWeight: 600 }}>{message}</Typography>
      </Paper>
    </Box>
  );
}
