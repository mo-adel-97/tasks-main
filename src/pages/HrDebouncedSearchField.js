import React, { useEffect, useRef, useState } from "react";
import { InputAdornment, TextField } from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";

// Search box that keeps what the user types in its OWN state.
// The parent (a very large page) is notified only after the user pauses,
// so typing never re-renders the whole page on every key.
export default function HrDebouncedSearchField({
  value = "",
  onChange,
  delay = 350,
  placeholder = "بحث...",
  ...rest
}) {
  const [text, setText] = useState(value);
  const sentRef = useRef(value);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // The parent may clear/replace the value from outside (e.g. reset filters).
  useEffect(() => {
    if (value !== sentRef.current) {
      sentRef.current = value;
      setText(value);
    }
  }, [value]);

  useEffect(() => {
    if (text === sentRef.current) return undefined;

    const timer = window.setTimeout(() => {
      sentRef.current = text;
      onChangeRef.current?.(text);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [text, delay]);

  return (
    <TextField
      size="small"
      InputLabelProps={{ shrink: true }}
      {...rest}
      value={text}
      placeholder={placeholder}
      onChange={(event) => setText(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter" && text !== sentRef.current) {
          sentRef.current = text;
          onChangeRef.current?.(text);
        }
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchRoundedIcon />
          </InputAdornment>
        )
      }}
    />
  );
}
