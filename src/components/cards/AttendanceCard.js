import React from "react";
import { Card, Box, Typography } from "@mui/material";
import { EventAvailable, Lock } from "@mui/icons-material";

export default function AttendanceCard({ data }) {
  return (
    <Card
      sx={{
        minHeight: 102,
        height: "100%",
        p: 0.85,
        borderRadius: 2.5,
        background: "#fff",
        border: "1px solid rgba(5,117,70,.12)",
        boxShadow: "0 5px 16px rgba(5,117,70,.06)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.7, color: "#1f2d3d" }}>
        <EventAvailable sx={{ fontSize: 17, color: "#057546" }} />
        <Typography sx={{ fontSize: "0.68rem", fontWeight: 900 }}>
          سجل الحضور
        </Typography>
      </Box>

      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          color: "#6f8a81",
          gap: 0.4,
        }}
      >
        <Lock sx={{ fontSize: 21, color: "#057546", opacity: 0.72 }} />
        <Typography sx={{ fontSize: "0.7rem", fontWeight: 900, color: "#1f2d3d" }}>
          قريبًا
        </Typography>
        <Typography sx={{ fontSize: "0.56rem" }}>
          سيتم الإعلان عن هذه الخدمة لاحقًا
        </Typography>
      </Box>
    </Card>
  );
}
