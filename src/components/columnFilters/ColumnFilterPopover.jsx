import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  Popover,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import {
  buildOptions,
  isChecked,
  matchesSearch,
  onlyValues,
  setValues,
  toggleValue
} from "./columnFilterLogic";

const VISIBLE_LIMIT = 150;
const LIST_HEIGHT = 260;

// محتوى نافذة فلتر عمود واحد: كل القيم بـ checkboxes، بحث، تحديد أكثر من قيمة.
// له key بالعمود، فالبحث يبدأ فاضي مع كل عمود.
function ColumnFilterContent({ title, field, rows, filters, accessors, onChange, onClose }) {
  const [search, setSearch] = useState("");
  // الأعمدة زي الاسم ورقم الهوية فيها مئات القيم: القائمة تُرسم بعد أول frame.
  const [listReady, setListReady] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setListReady(true);
      // بدل autoFocus: التركيز بدون ما المتصفح يعمل scroll.
      searchRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const options = useMemo(
    () => buildOptions(rows, filters, field, accessors),
    [rows, filters, field, accessors]
  );

  const allValues = useMemo(() => options.map((option) => option.value), [options]);
  const selected = filters[field];

  const shown = useMemo(
    () => options.filter((option) => matchesSearch(option, search)),
    [options, search]
  );

  const shownValues = shown.map((option) => option.value);
  const selectedCount = selected
    ? allValues.filter((value) => selected.has(value)).length
    : allValues.length;

  return (
      <Box sx={{ p: 1.5 }}>
        <Typography sx={{ fontWeight: 900, mb: 1 }}>{title}</Typography>

        <TextField
          size="small"
          fullWidth
          inputRef={searchRef}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="ابحث أو اكتب قيمة…"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon fontSize="small" />
              </InputAdornment>
            )
          }}
        />

        <Stack direction="row" spacing={0.6} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => onChange(setValues(selected, allValues, shownValues, true))}
          >
            تحديد الكل ({shown.length})
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            onClick={() => onChange(setValues(selected, allValues, shownValues, false))}
          >
            إلغاء التحديد
          </Button>
          {search.trim() && (
            <Button
              size="small"
              variant="contained"
              disabled={!shown.length}
              onClick={() => onChange(onlyValues(allValues, shownValues))}
            >
              نتائج البحث فقط
            </Button>
          )}
        </Stack>

        <Box
          sx={{
            mt: 1,
            height: LIST_HEIGHT,
            overflowY: "auto",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1.5,
            px: 1
          }}
        >
          {listReady && shown.slice(0, VISIBLE_LIMIT).map((option) => (
            <FormControlLabel
              key={option.value || "__empty__"}
              sx={{ display: "flex", m: 0, width: "100%" }}
              control={
                <Checkbox
                  size="small"
                  disableRipple
                  sx={{ p: 0.5 }}
                  checked={isChecked(selected, option.value)}
                  onChange={() => onChange(toggleValue(selected, allValues, option.value))}
                />
              }
              label={
                <Box component="span" sx={{ fontSize: 13 }}>
                  {option.label}{" "}
                  <Box component="span" sx={{ opacity: 0.6, fontSize: 11 }}>
                    ({option.count})
                  </Box>
                </Box>
              }
            />
          ))}

          {listReady && shown.length > VISIBLE_LIMIT && (
            <Typography sx={{ fontSize: 12, opacity: 0.7, py: 1 }}>
              يوجد {shown.length - VISIBLE_LIMIT} قيمة أخرى، اكتب في البحث لتضييق القائمة.
            </Typography>
          )}

          {listReady && !shown.length && (
            <Typography sx={{ fontSize: 13, opacity: 0.7, py: 1.5, textAlign: "center" }}>
              لا توجد قيم مطابقة
            </Typography>
          )}
        </Box>

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
          sx={{ mt: 1 }}
        >
          <Typography sx={{ fontSize: 12, opacity: 0.8 }}>
            المحدد {selectedCount} من {options.length}
          </Typography>

          <Stack direction="row" spacing={0.6}>
            <Button
              size="small"
              color="error"
              disabled={!selected}
              onClick={() => onChange(undefined)}
            >
              مسح الفلتر
            </Button>
            <Button size="small" variant="contained" onClick={onClose}>
              تم
            </Button>
          </Stack>
        </Stack>
      </Box>
  );
}

// النافذة نفسها تفضل mounted طول الوقت ويتغير open فقط.
// لو اتعملت mount وهي مفتوحة، MUI بيرسمها لحظة في مكانها الافتراضي (أقصى اليمين في RTL)
// قبل ما يحسب مكانها تحت زر الفلتر، فتبان إنها "بتنط". وهي مقفولة الأول، MUI بيخفيها
// (opacity: 0) لحد ما المكان يتحسب.
export default function ColumnFilterPopover({
  open,
  anchorEl,
  title,
  field,
  rows,
  filters,
  accessors,
  onChange, // (selectedSet | undefined) => void
  onClose
}) {
  return (
    <Popover
      open={Boolean(open && anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      transformOrigin={{ vertical: "top", horizontal: "center" }}
      // قفل السكرول بيشيل شريط التمرير ويغيّر عرض الصفحة، فأعمدة الجريد تتحرك.
      disableScrollLock
      TransitionProps={{ timeout: { enter: 120, exit: 80 } }}
      PaperProps={{ sx: { width: 320, maxWidth: "92vw", direction: "rtl" } }}
    >
      {field ? (
        <ColumnFilterContent
          key={field}
          title={title}
          field={field}
          rows={rows}
          filters={filters}
          accessors={accessors}
          onChange={onChange}
          onClose={onClose}
        />
      ) : null}
    </Popover>
  );
}
