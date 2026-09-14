import React from "react";
import { Card, Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

const DEFAULT = "#057546";

export default function StatsCard({
  icon,
  title,
  value,
  subtitle,
  color = DEFAULT,
  gradient = "#034d31",
}) {
  return (
    <Card
      sx={{
        p: 0.8,
        minHeight: 92,
        height: "100%",
        borderRadius: 2.5,
        color: "#fff",
        background: `linear-gradient(135deg, ${color}, ${gradient})`,
        border: `1px solid ${alpha(color, 0.18)}`,
        boxShadow: `0 6px 16px ${alpha(color, 0.16)}`,
        display: "flex",
        alignItems: "center",
        gap: 0.8,
        position: "relative",
        overflow: "hidden",
        transition: "transform .18s ease, box-shadow .18s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: `0 8px 20px ${alpha(color, 0.2)}`,
        },
        "&::after": {
          content: '""',
          position: "absolute",
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: "rgba(255,255,255,.08)",
          top: -28,
          right: -20,
        },
      }}
    >
      <Box
        sx={{
          width: 33,
          height: 33,
          flex: "0 0 33px",
          borderRadius: 2,
          background: "rgba(255,255,255,.16)",
          display: "grid",
          placeItems: "center",
          "& svg": { fontSize: 19 },
        }}
      >
        {icon}
      </Box>

      <Box sx={{ minWidth: 0, position: "relative", zIndex: 1 }}>
        <Typography sx={{ fontSize: "0.75rem", fontWeight: 850, opacity: 0.92 }}>
          {title}
        </Typography>
        <Typography sx={{ fontSize: "1.12rem", lineHeight: 1.2, fontWeight: 1000, my: 0.25 }}>
          {value}
        </Typography>
        <Typography sx={{ fontSize: "0.75rem", opacity: 0.82 }}>
          {subtitle}
        </Typography>
      </Box>
    </Card>
  );
}
