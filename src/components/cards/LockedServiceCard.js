import React from "react";
import { Box, Card, Typography } from "@mui/material";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import { alpha } from "@mui/material/styles";

export default function LockedServiceCard({
  icon,
  title,
  previewValue = "—",
}) {
  return (
    <Card
      sx={{
        minHeight: { xs: 128, sm: 138, md: 146 },
        height: "100%",
        borderRadius: { xs: 2.2, md: 2.8 },
        border: "1px solid rgba(5,117,70,.12)",
        background:
          "linear-gradient(145deg, rgba(255,255,255,.99), rgba(245,250,247,.99))",
        boxShadow: "0 7px 20px rgba(5,117,70,.075)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          p: { xs: 1.3, sm: 1.5 },
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          filter: "blur(4px)",
          opacity: 0.46,
          transform: "scale(1.02)",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 1.8,
              display: "grid",
              placeItems: "center",
              color: "#057546",
              background: alpha("#057546", 0.1),
              "& svg": { fontSize: 21 },
            }}
          >
            {icon}
          </Box>

          <Typography
            sx={{
              fontSize: "0.78rem",
              fontWeight: 900,
              color: "#1f2d3d",
            }}
          >
            {title}
          </Typography>
        </Box>

        <Typography
          sx={{
            fontSize: "1.5rem",
            fontWeight: 1000,
            color: "#057546",
          }}
        >
          {previewValue}
        </Typography>
      </Box>

      <Box
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 0.4,
          px: 1.2,
          background: "rgba(255,255,255,.56)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
        }}
      >
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            color: "#057546",
            background: alpha("#057546", 0.11),
          }}
        >
          <LockRoundedIcon sx={{ fontSize: 19 }} />
        </Box>

        <Typography
          sx={{
            fontSize: { xs: "0.75rem", sm: "0.76rem" },
            fontWeight: 1000,
            color: "#1f2d3d",
          }}
        >
          قريبًا
        </Typography>

        <Typography
          sx={{
            maxWidth: 230,
            textAlign: "center",
            fontSize: { xs: "0.75rem", sm: "0.75rem" },
            fontWeight: 700,
            lineHeight: 1.55,
            color: "#6b7c73",
          }}
        >
          سيتم الإعلان عن هذه الخدمة لاحقًا
        </Typography>
      </Box>
    </Card>
  );
}
