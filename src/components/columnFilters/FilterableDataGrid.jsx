import React, { useEffect } from "react";
import { Box } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import useColumnValueFilters from "./useColumnValueFilters";

// DataGrid مع فلتر القيم لكل عمود (نفس فلتر طلبات الالتحاق).
// بديل مباشر لـ <DataGrid>: نفس الخصائص + اختياريًا:
//   filterAccessors        نص الخلية لأعمدة تعرض قيمة مختلفة عن الحقل
//   filterExcludeFields    أعمدة بدون فلتر
//   onFilteredRowsChange   الصفوف بعد الفلترة (للعدّاد / التصدير)
export default function FilterableDataGrid({
  rows,
  columns,
  filterAccessors,
  filterExcludeFields,
  onFilteredRowsChange,
  ...gridProps
}) {
  const filters = useColumnValueFilters({
    rows,
    columns,
    accessors: filterAccessors,
    disableSorting: true, // بدون أسهم الترتيب: الفلتر الجديد فقط
    ...(filterExcludeFields ? { excludeFields: filterExcludeFields } : {})
  });

  useEffect(() => {
    if (onFilteredRowsChange) onFilteredRowsChange(filters.rows);
  }, [filters.rows, onFilteredRowsChange]);

  const grid = (
    <DataGrid
      {...gridProps}
      rows={filters.rows}
      columns={filters.columns}
      disableColumnFilter
      disableColumnMenu
    />
  );

  // شريط الفلاتر + الجريد داخل نفس المساحة (لو الحاوية بارتفاع ثابت).
  const autoHeight = Boolean(gridProps.autoHeight);
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        minWidth: 0,
        minHeight: 0,
        flex: 1,
        height: autoHeight ? "auto" : "100%"
      }}
    >
      {filters.chips && <Box sx={{ flexShrink: 0 }}>{filters.chips}</Box>}
      {filters.popover}
      <Box sx={{ flex: 1, minHeight: 0, width: "100%", display: "flex", flexDirection: "column" }}>
        {grid}
      </Box>
    </Box>
  );
}
