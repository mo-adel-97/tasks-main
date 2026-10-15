import React, { useCallback, useMemo, useState } from "react";
import { Box, Button, Chip, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import ColumnFilterPopover from "./ColumnFilterPopover";
import { applyColumnFilters, EMPTY_LABEL } from "./columnFilterLogic";

// عنوان العمود مع زر الفلتر. الضغط على الزر لا يغيّر الترتيب.
function ColumnFilterHeader({ title, active, count, onOpen }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 0.25,
        width: "100%",
        minWidth: 0
      }}
    >
      <Typography
        className="MuiDataGrid-columnHeaderTitle"
        component="span"
        sx={{ fontSize: "inherit", fontWeight: "inherit", overflow: "hidden", textOverflow: "ellipsis" }}
      >
        {title}
      </Typography>

      <Tooltip title={active ? `مفلتر (${count} قيمة) — اضغط للتعديل` : "تصفية بقيم العمود"}>
        <IconButton
          size="small"
          aria-label={`فلتر ${title}`}
          onClick={(event) => {
            event.stopPropagation();
            onOpen(event.currentTarget);
          }}
          onMouseDown={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          sx={{ p: 0.25, color: active ? "primary.main" : "inherit", opacity: active ? 1 : 0.65 }}
        >
          {active ? <FilterAltIcon fontSize="inherit" /> : <FilterAltOutlinedIcon fontSize="inherit" />}
        </IconButton>
      </Tooltip>
    </Box>
  );
}

const DEFAULT_EXCLUDE = ["actions", "vip"];

// النص الظاهر في الخلية من valueGetter / valueFormatter الخاصين بالعمود (لو موجودين)،
// حتى لا تحتاج كل صفحة لكتابة accessors بنفسها.
const buildColumnAccessor = (column) => {
  const { field, valueGetter, valueFormatter } = column;
  if (!valueGetter && !valueFormatter) return null;

  return (row) => {
    let value = row?.[field];
    try {
      if (valueGetter) value = valueGetter({ row, value, field, id: row?.id, colDef: column });
      if (valueFormatter) {
        const formatted = valueFormatter({ value, field, id: row?.id, colDef: column });
        if (formatted !== undefined && formatted !== null && typeof formatted !== "object") {
          value = formatted;
        }
      }
    } catch (error) {
      value = row?.[field];
    }
    return value;
  };
};

// فلتر قيم لكل عمود على طريقة Excel لجدول DataGrid (يعمل على بيانات محلية).
//
//   const filters = useColumnValueFilters({ rows, columns, accessors });
//   <DataGrid rows={filters.rows} columns={filters.columns} disableColumnFilter />
//   {filters.chips}   // شريط الفلاتر المفعّلة (اختياري)
//   {filters.popover} // نافذة الفلتر (لازم تُعرض مرة واحدة)
export default function useColumnValueFilters({
  rows: sourceRows,
  columns: sourceColumns,
  accessors: customAccessors,
  excludeFields = DEFAULT_EXCLUDE,
  disableSorting = false
}) {
  const rows = useMemo(() => (Array.isArray(sourceRows) ? sourceRows : []), [sourceRows]);
  const columns = useMemo(
    () => (Array.isArray(sourceColumns) ? sourceColumns : []),
    [sourceColumns]
  );
  const [filters, setFilters] = useState({});
  // { field, title, anchorEl, open } — بيفضل موجود بعد القفل عشان أنيميشن القفل.
  const [panel, setPanel] = useState(null);
  const openPanel = useCallback(
    (field, title, anchorEl) => setPanel({ field, title, anchorEl, open: true }),
    []
  );

  // accessors الممررة لها الأولوية، والباقي من تعريف الأعمدة نفسها.
  const accessors = useMemo(() => {
    const map = {};
    columns.forEach((column) => {
      const accessor = buildColumnAccessor(column);
      if (accessor) map[column.field] = accessor;
    });
    return { ...map, ...(customAccessors || {}) };
  }, [columns, customAccessors]);

  const filteredRows = useMemo(
    () => applyColumnFilters(rows, filters, accessors),
    [rows, filters, accessors]
  );

  const setFieldFilter = useCallback((field, selected) => {
    setFilters((current) => {
      const next = { ...current };
      if (selected) next[field] = selected;
      else delete next[field];
      return next;
    });
  }, []);

  const clearAll = useCallback(() => setFilters({}), []);
  const closePanel = useCallback(
    () => setPanel((current) => (current ? { ...current, open: false } : current)),
    []
  );

  const titles = useMemo(() => {
    const map = {};
    columns.forEach((column) => {
      if (column.headerName) map[column.field] = column.headerName;
    });
    return map;
  }, [columns]);

  const columnsWithFilters = useMemo(
    () =>
      columns.map((baseColumn) => {
        // بدون الترتيب: تختفي أسهم الترتيب (فوق/تحت) من عنوان العمود.
        const column = disableSorting ? { ...baseColumn, sortable: false } : baseColumn;

        if (
          excludeFields.includes(column.field) ||
          column.type === "actions" ||
          column.filterable === false ||
          !column.headerName
        ) {
          return column;
        }

        const active = Boolean(filters[column.field]);

        return {
          ...column,
          renderHeader: () => (
            <ColumnFilterHeader
              title={column.headerName}
              active={active}
              count={filters[column.field]?.size || 0}
              onOpen={(anchorEl) => openPanel(column.field, column.headerName, anchorEl)}
            />
          )
        };
      }),
    [columns, filters, excludeFields, disableSorting, openPanel]
  );

  const activeFields = Object.keys(filters);

  // النافذة دايمًا موجودة (مقفولة أو مفتوحة) عشان MUI يحسب مكانها قبل ما تظهر.
  const popover = (
    <ColumnFilterPopover
      open={Boolean(panel?.open)}
      anchorEl={panel?.anchorEl || null}
      title={panel?.title}
      field={panel?.field}
      rows={rows}
      filters={filters}
      accessors={accessors}
      onChange={(selected) => panel && setFieldFilter(panel.field, selected)}
      onClose={closePanel}
    />
  );

  const chips = activeFields.length ? (
    <Stack
      direction="row"
      spacing={0.6}
      useFlexGap
      flexWrap="wrap"
      alignItems="center"
      sx={{ px: 1, py: 0.8 }}
    >
      <Typography sx={{ fontSize: 12, fontWeight: 900 }}>
        الفلاتر: {filteredRows.length} من {rows.length}
      </Typography>

      {activeFields.map((field) => {
        const selected = [...filters[field]];
        const label =
          selected.length === 1
            ? selected[0] === ""
              ? EMPTY_LABEL
              : selected[0]
            : `${selected.length} قيم`;

        return (
          <Chip
            key={field}
            size="small"
            color="primary"
            variant="outlined"
            label={`${titles[field] || field}: ${label}`}
            onClick={(event) => openPanel(field, titles[field] || field, event.currentTarget)}
            onDelete={() => setFieldFilter(field, undefined)}
          />
        );
      })}

      <Button size="small" color="error" onClick={clearAll}>
        مسح كل الفلاتر
      </Button>
    </Stack>
  ) : null;

  return {
    rows: filteredRows,
    columns: columnsWithFilters,
    popover,
    chips,
    clearAll,
    activeCount: activeFields.length
  };
}
