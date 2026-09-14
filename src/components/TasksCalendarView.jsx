import * as uiLayout from './common/uiLayout';
import React, { useState } from "react";
import { Box, Typography, Grid, Card, CardContent, Chip, Button, TextField } from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import arLocale from "date-fns/locale/ar-EG";

export default function TasksCalendarView({ tasks, userMap, subTaskNameMap, currentUser, showSubTasks = true }) {
  // أمان لو tasks جات undefined/null
  tasks = Array.isArray(tasks) ? tasks : [];

  const [selectedDate, setSelectedDate] = useState(new Date());

  // Helper to compare dates only (ignore time)
  const isSameDay = (d1, d2) => {
    return d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();
  };

  // Filter tasks for the selected date
  const filteredTasks = tasks.filter(t =>
    t.createdAt &&
    isSameDay(new Date(t.createdAt), selectedDate)
  );

  return (
    <Box sx={{ mb: 4, mt: 2 }}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={arLocale}>
        <Box sx={uiLayout.withUiSx({ display: "flex", alignItems: "center", gap: 2, mb: 2, flexWrap: 'wrap' }, uiLayout.filterBarSx)}>
          <Button sx={uiLayout.buttonSx}
            variant="contained"
            size="small"
            onClick={() => setSelectedDate(new Date())}
          >
            اليوم
          </Button>
          <Button sx={uiLayout.buttonSx}
            variant="outlined"
            size="small"
            onClick={() => {
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              setSelectedDate(yesterday);
            }}
          >
            أمس
          </Button>
          <DatePicker
            label="اختيار يوم"
            value={selectedDate}
            onChange={(newValue) => setSelectedDate(newValue)}
            renderInput={(params) => <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }} {...params} size="small" />}
            inputFormat="yyyy-MM-dd"
          />
          <Typography sx={{ marginInlineStart: "auto", fontWeight: 600, color: "#6366f1" }}>
            عدد المهام: {filteredTasks.length}
          </Typography>
        </Box>
      </LocalizationProvider>
      <Grid container spacing={3} justifyContent="center">
        {filteredTasks.length === 0 && (
          <Typography sx={{ color: "#bbb", textAlign: "center", width: "100%" }}>لا يوجد مهام في هذا اليوم.</Typography>
        )}
        {filteredTasks.map((t) => (
          <Grid item xs={12} sm={8} md={6} lg={5} key={t.guid} sx={{ mx: "auto" }}>
            <Card sx={{
              borderRadius: 5,
              boxShadow: '0 4px 18px #818cf840',
              background: '#fff',
              p: 0,
              my: 2,
              maxWidth: 550,
              margin: '0 auto',
              transition: 'box-shadow .2s',
              '&:hover': { boxShadow: '0 8px 24px #6366f144' }
            }}>
              <CardContent sx={{ px: 4, py: 3 }}>
                <Typography variant="h6" sx={{
                  fontWeight: 'bold',
                  color: "#1e293b",
                  mb: 1,
                  letterSpacing: .5
                }}>
                  {t.taskName}
                </Typography>
                <Typography sx={{ color: '#9ca3af', fontSize: 15, mb: .5 }}>
                  بتاريخ: <span style={{ fontWeight: 500 }}>{t.createdAt?.split("T")[0] || "--"}</span>
                </Typography>
                <Typography sx={{ color: '#64748b', fontWeight: 500, fontSize: 15, mb: 2 }}>
                  الحالة:
                  <span style={{
                    fontWeight: 700,
                    color: t.taskStatus === "معلقة" ? "#f59e42" :
                      t.taskStatus === "جاري التنفيذ" ? "#3b82f6" :
                        t.taskStatus === "مكتملة" ? "#10b981" : "#ef4444"
                  }}>
                    {" "}{t.taskStatus}
                  </span>
                </Typography>
                {showSubTasks && (
                  <Box sx={{
                    background: "#f5faff",
                    p: 2,
                    borderRadius: 3,
                    boxShadow: '0 1px 5px #e0e7ff10',
                    mb: 2
                  }}>
                    <Typography sx={{
                      color: "#334155", fontWeight: 700, fontSize: 16, mb: 1
                    }}>
                      المهام الفرعية:
                    </Typography>
                    {t.subTasks && t.subTasks.length > 0 ? (
                      t.subTasks.map((sub, idx) => (
                        <Box
                          key={sub.guid || idx}
                          sx={{
                            mb: 1.5,
                            border: '1.5px solid #e0e7ff',
                            borderRadius: 3,
                            p: 2,
                            background: '#fff',
                            boxShadow: '0 0 0 1px #e0e7ff18',
                            transition: 'box-shadow .15s',
                            '&:hover': { boxShadow: '0 3px 14px #6366f123' }
                          }}>
                          <Typography sx={{
                            color: '#6366f1',
                            fontWeight: 700,
                            fontSize: 17,
                            mb: .7
                          }}>
                            <bdi dir="ltr">{subTaskNameMap[sub.taskSmallGuid] || "بدون اسم"}</bdi>
                          </Typography>
                          <Typography sx={{ fontSize: 15, color: '#334155', my: .5 }}>
                            أرسلت إلى:
                            {sub.userReceiverGuids.split(',').map(guid =>
                              <Chip
                                key={guid}
                                label={userMap[guid] || guid}
                                size="small"
                                sx={{
                                  mx: .7, my: .3,
                                  bgcolor: "#f1f5f9",
                                  color: "#2d3a54",
                                  fontWeight: 600,
                                  fontSize: 15,
                                  px: 2
                                }}
                              />
                            )}
                          </Typography>
                        </Box>
                      ))
                    ) : (
                      <Typography sx={{ color: "#bbb", fontSize: 14, fontStyle: "italic" }}>
                        لا يوجد مهام فرعية
                      </Typography>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
