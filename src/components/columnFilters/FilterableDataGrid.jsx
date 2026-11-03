import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import useColumnValueFilters from "./useColumnValueFilters";

// DataGrid مع فلتر القيم لكل عمود (نفس فلتر طلبات الالتحاق).
// بديل مباشر لـ <DataGrid>: نفس الخصائص + اختياريًا:
//   filterAccessors        نص الخلية لأعمدة تعرض قيمة مختلفة عن الحقل
//   filterExcludeFields    أعمدة بدون فلتر
//   onFilteredRowsChange   الصفوف بعد الفلترة (للعدّاد / التصدير)
//   persistKey             مفتاح sessionStorage: فلاتر الأعمدة والصفحة تفضل بعد التحديث أو الرجوع للشاشة
export default function FilterableDataGrid({
  rows,
  columns,
  filterAccessors,
  filterExcludeFields,
  onFilteredRowsChange,
  persistKey,
  ...gridProps
}) {
  const filters = useColumnValueFilters({
    rows,
    columns,
    accessors: filterAccessors,
    disableSorting: true, // بدون أسهم الترتيب: الفلتر الجديد فقط
    persistKey: persistKey ? `${persistKey}:columns` : undefined,
    ...(filterExcludeFields ? { excludeFields: filterExcludeFields } : {})
  });

  useEffect(() => {
    if (onFilteredRowsChange) onFilteredRowsChange(filters.rows);
  }, [filters.rows, onFilteredRowsChange]);

  // الصفحة وعدد الصفوف بيتحفظوا مع الفلاتر لو فيه persistKey
  const pageKey = persistKey ? `${persistKey}:page` : null;
  const [paginationModel, setPaginationModel] = useState(() => {
    const fallback = gridProps.initialState?.pagination?.paginationModel || { page: 0, pageSize: 25 };
    if (!pageKey) return fallback;
    try {
      const stored = JSON.parse(sessionStorage.getItem(pageKey) || "null");
      return stored && Number.isInteger(stored.page) && Number.isInteger(stored.pageSize) ? stored : fallback;
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    if (!pageKey) return;
    try {
      sessionStorage.setItem(pageKey, JSON.stringify(paginationModel));
    } catch {
      // من غير تخزين: الصفحة بتشتغل عادي
    }
  }, [pageKey, paginationModel]);

  const paginationProps = pageKey && !gridProps.paginationModel
    ? { paginationModel, onPaginationModelChange: setPaginationModel }
    : {};

  const grid = (
    <DataGrid
      {...gridProps}
      {...paginationProps}
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
