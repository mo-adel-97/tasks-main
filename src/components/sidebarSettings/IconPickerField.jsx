import React, { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import AppsIcon from "@mui/icons-material/Apps";
import SearchIcon from "@mui/icons-material/Search";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { SIDEBAR_ICON_COMPONENTS, SIDEBAR_ICON_LIST } from "../../config/sidebarIcons";
import { searchIcons } from "../../config/sidebarIconSearch";

/*
  اختيار أيقونة التابة / القائمة: كل اسم ظاهر جنبه شكل الأيقونة،
  وزرار "عرض كل الأيقونات" بيفتح شبكة فيها كل المكتبة مع بحث.
  القيمة المحفوظة هي المفتاح (زي ما كانت IconKey قبل كده).
*/

const norm = (value) => String(value ?? "").trim().toLowerCase();

const IconPreview = ({ iconKey, size = 22, color = "#057546" }) => {
  const Icon = SIDEBAR_ICON_COMPONENTS[norm(iconKey)];
  return Icon ? <Icon sx={{ fontSize: size, color }} /> : <HelpOutlineIcon sx={{ fontSize: size, color: "#9aa9a2" }} />;
};

const ENTRY_BY_KEY = Object.fromEntries(SIDEBAR_ICON_LIST.map((entry) => [entry[0], entry]));

const IconGridDialog = ({ open, value, onClose, onPick }) => {
  const [search, setSearch] = useState("");
  const deferred = useDeferredValue(search);
  // بحث بالعربي أو الإنجليزي — الأقرب الأول.
  const list = useMemo(() => searchIcons(deferred).map((key) => ENTRY_BY_KEY[key]).filter(Boolean), [deferred]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ sx: { direction: "rtl", height: "85vh" } }}>
      <DialogTitle sx={{ fontWeight: 900, display: "flex", alignItems: "center", gap: 1 }}>
        <AppsIcon sx={{ color: "#057546" }} /> اختيار أيقونة
        <Typography component="span" sx={{ fontSize: 12, color: "text.secondary", fontWeight: 700 }}>({SIDEBAR_ICON_LIST.length} أيقونة)</Typography>
      </DialogTitle>
      <DialogContent dividers>
        <TextField
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="اكتب بالعربي أو الإنجليزي... مثلاً: موظفين، فلوس، تقارير، person"
          size="small"
          fullWidth
          sx={{ mb: 1.5 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
        />
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(112px, 1fr))", gap: 1 }}>
          {list.map(([key, name, Icon]) => {
            const selected = norm(value) === key;
            return (
              <Tooltip key={key} title={`${name} — ${key}`}>
                <Box
                  component="button"
                  type="button"
                  onClick={() => onPick(key)}
                  sx={{
                    all: "unset",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 0.5,
                    p: 1,
                    borderRadius: 2,
                    border: "1.5px solid",
                    borderColor: selected ? "#057546" : "divider",
                    background: selected ? "rgba(5,117,70,.10)" : "transparent",
                    "&:hover": { borderColor: "#057546", background: "rgba(5,117,70,.06)" },
                    "&:focus-visible": { outline: "2px solid #057546" }
                  }}
                >
                  <Icon sx={{ fontSize: 30, color: "#057546" }} />
                  <Typography sx={{ fontSize: 11, fontWeight: 700, direction: "ltr", textAlign: "center", wordBreak: "break-word", lineHeight: 1.3 }}>
                    {name}
                  </Typography>
                </Box>
              </Tooltip>
            );
          })}
        </Box>
        {!list.length ? (
          <Typography sx={{ textAlign: "center", py: 4, color: "text.secondary", fontWeight: 700 }}>لا توجد أيقونات بالاسم ده</Typography>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ fontWeight: 900 }}>إغلاق</Button>
      </DialogActions>
    </Dialog>
  );
};

const IconPickerField = ({ value, onChange, label = "الأيقونة", textFieldSx }) => {
  const [gridOpen, setGridOpen] = useState(false);
  // نص البحث منفصل عن القيمة: الاختيار بيتحفظ لما تختار من القائمة أو تخرج من الخانة.
  const [input, setInput] = useState(value || "");
  const [typing, setTyping] = useState(false);
  const options = useMemo(() => SIDEBAR_ICON_LIST.map(([key]) => key), []);
  const names = useMemo(() => Object.fromEntries(SIDEBAR_ICON_LIST.map(([key, name]) => [key, name])), []);

  useEffect(() => {
    if (!typing) setInput(value || "");
  }, [value, typing]);

  return (
    <Stack direction="row" spacing={0.8} alignItems="flex-start">
      <Autocomplete
        freeSolo
        size="small"
        sx={{ flex: 1, minWidth: 0 }}
        options={options}
        value={value || ""}
        inputValue={input}
        filterOptions={() => searchIcons(typing ? input : "").slice(0, 150)}
        getOptionLabel={(key) => key || ""}
        onChange={(_, next) => {
          setTyping(false);
          onChange(next || "");
        }}
        onInputChange={(_, next, reason) => {
          if (reason === "input") {
            setTyping(true);
            setInput(next || "");
          }
        }}
        onBlur={() => {
          if (!typing) return;
          setTyping(false);
          const typed = norm(input);
          if (SIDEBAR_ICON_COMPONENTS[typed]) onChange(typed);
          else setInput(value || "");
        }}
        renderOption={(props, key) => (
          <li {...props} key={key} style={{ ...props.style, display: "flex", alignItems: "center", gap: 10, direction: "ltr" }}>
            <IconPreview iconKey={key} />
            <span style={{ fontWeight: 700 }}>{names[key]}</span>
            <span style={{ marginInlineStart: "auto", fontSize: 11, opacity: 0.6 }}>{key}</span>
          </li>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            sx={textFieldSx}
            InputLabelProps={{ shrink: true }}
            placeholder="اكتب بالعربي أو الإنجليزي"
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <IconPreview iconKey={value} />
                </InputAdornment>
              )
            }}
          />
        )}
      />
      <Tooltip title="عرض كل الأيقونات">
        <Button variant="outlined" onClick={() => setGridOpen(true)} sx={{ minWidth: 0, px: 1.2, height: 40, borderColor: "#057546", color: "#057546" }}>
          <AppsIcon />
        </Button>
      </Tooltip>

      <IconGridDialog
        open={gridOpen}
        value={value}
        onClose={() => setGridOpen(false)}
        onPick={(key) => {
          onChange(key);
          setGridOpen(false);
        }}
      />
    </Stack>
  );
};

export default IconPickerField;
