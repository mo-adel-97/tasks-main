import React from "react";
import { Box, Tooltip } from "@mui/material";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";

// علامة VIP مميزة جنب اسم الطالب (شئون الطلاب + مكتب الاستقبال).
const VipBadge = ({ size = "small", sx }) => {
  const isSmall = size === "small";
  return (
    <Tooltip title="عميل VIP" arrow>
      <Box
        component="span"
        aria-label="عميل VIP"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.3,
          flexShrink: 0,
          px: isSmall ? 0.6 : 0.9,
          py: isSmall ? 0.1 : 0.25,
          borderRadius: 999,
          fontFamily: '"Cairo", sans-serif',
          fontWeight: 900,
          fontSize: isSmall ? "0.62rem" : "0.75rem",
          letterSpacing: 0.4,
          lineHeight: 1.6,
          color: "#5b3a00",
          background: "linear-gradient(135deg, #ffe08a 0%, #f5b70a 55%, #d99a00 100%)",
          border: "1px solid #c98a00",
          boxShadow: "0 1px 4px rgba(201,138,0,.35)",
          verticalAlign: "middle",
          ...sx
        }}
      >
        <WorkspacePremiumRoundedIcon sx={{ fontSize: isSmall ? 12 : 15 }} />
        VIP
      </Box>
    </Tooltip>
  );
};

// يضيف علامة VIP لعمود "اسم الطالب" في أي DataGrid (بيحافظ على renderCell الأصلي لو موجود).
export const withVipNameColumn = (columns, isVip, field = "studentName") =>
  (columns || []).map((column) => {
    if (column?.field !== field) return column;
    const originalRender = column.renderCell;
    return {
      ...column,
      renderCell: (params) => {
        const content = originalRender ? originalRender(params) : params.value;
        if (!isVip(params.row)) return content;
        return (
          <Box
            component="span"
            sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, maxWidth: "100%", minWidth: 0 }}
          >
            <Box component="span" sx={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {content}
            </Box>
            <VipBadge />
          </Box>
        );
      }
    };
  });

export default VipBadge;
