import React from "react";
import { Card, Box, Typography } from "@mui/material";
import { Paid, Lock } from "@mui/icons-material";

export default function SalaryCard({ data }) {
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
        <Paid sx={{ fontSize: 17, color: "#057546" }} />
        <Typography sx={{ fontSize: "0.75rem", fontWeight: 900 }}>
          الراتب الشهري
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
        <Typography sx={{ fontSize: "0.75rem", fontWeight: 900, color: "#1f2d3d" }}>
          قريبًا
        </Typography>
        <Typography sx={{ fontSize: "0.75rem" }}>
          سيتم الإعلان عن هذه الخدمة لاحقًا
        </Typography>
      </Box>
    </Card>
  );
}
