import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Avatar,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  FormControlLabel,
  Checkbox,
  Button,
  CircularProgress,
  Fade
} from '@mui/material';
import { Assignment, Person, Badge, Close, Check, Warning } from '@mui/icons-material';

const AttendanceDialog = ({
  open,
  onClose,
  studentData,
  attendanceData,
  handleAttendanceChange,
  handleAttendanceSubmit,
  levels,
  diplomas,
  submitting,
  courses
}) => {
  const [studyInfo, setStudyInfo] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [noBranchData, setNoBranchData] = useState(false);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  // Color palette based on #80b49e
  const colorPalette = {
    primary: '#80b49e',
    primaryLight: '#a8c9bb',
    primaryDark: '#5a8f7a',
    primaryLighter: '#e1efe9',
    textDark: '#2d4a3e',
    textLight: '#5a7a6a',
    error: '#f44336',
    warning: '#ff9800',
    background: '#f8fbf9'
  };

  useEffect(() => {
    if (open && studentData?.accountGuid) {
      fetchStudentStudyInfo();
    } else {
      // Reset states when dialog closes
      setStudyInfo([]);
      setNoBranchData(false);
      setError(null);
      setAvailableSubjects([]);
    }
  }, [open, studentData]);

  // Fetch subjects when diploma changes
  useEffect(() => {
    if (attendanceData.diploma && open) {
      fetchSubjectsForDiploma(attendanceData.diploma);
    }
  }, [attendanceData.diploma, open]);

  const fetchStudentStudyInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      setNoBranchData(false);
      
      // Get branch ID from local storage
      const user = JSON.parse(localStorage.getItem('user'));
      const branchId = user?.branchForWork;
      
      if (!branchId) {
        throw new Error('Branch ID not found in local storage');
      }
      
      const response = await fetch(
        `https://api1.sstli.com/api/StudentStudyInfo/${studentData.accountGuid}/${branchId}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch student study info');
      }
      
      const data = await response.json();
      
      if (data.length === 0) {
        setNoBranchData(true);
      } else {
        setStudyInfo(data);
        // Auto-fill the first study info if available
        handleAttendanceChange({
          target: {
            name: 'diploma',
            value: data[0].diplomName
          }
        });
        
        handleAttendanceChange({
          target: {
            name: 'level',
            value: data[0].levelName
          }
        });
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching study info:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjectsForDiploma = async (diplomaName) => {
    try {
      setLoadingSubjects(true);
      
      const response = await fetch('https://filesregsiteration.sstli.com/get_teaching_data.php');
      
      if (!response.ok) {
        throw new Error('Failed to fetch teaching data');
      }
      
      const data = await response.json();
      
      // Find subjects for the selected diploma
      const subjects = [];
      data.forEach(trainer => {
        trainer.diplomas.forEach(diploma => {
          if (diploma.diploma_name === diplomaName) {
            diploma.subjects.forEach(subject => {
              if (!subjects.includes(subject.subject_name)) {
                subjects.push(subject.subject_name);
              }
            });
          }
        });
      });
      
      setAvailableSubjects(subjects);
      
      // Clear the course field when diploma changes
      handleAttendanceChange({
        target: {
          name: 'course',
          value: ''
        }
      });
      
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setAvailableSubjects([]);
    } finally {
      setLoadingSubjects(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          padding: { xs: "16px", md: "24px" },
          fontFamily: '"Cairo", sans-serif',
          background: "#ffffff",
          boxShadow: "0 20px 40px rgba(128, 180, 158, 0.15)",
          border: `1px solid ${colorPalette.primaryLighter}`,
          overflow: "hidden"
        }
      }}
    >
      {/* Header Section */}
      <Box sx={{ 
        textAlign: "center", 
        mb: 3,
        position: "relative",
        padding: "20px 0"
      }}>
        {/* Background Decoration */}
        <Box sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background: `linear-gradient(90deg, ${colorPalette.primary}, ${colorPalette.primaryLight})`,
          borderRadius: "2px"
        }} />
        
        <Avatar
          sx={{
            width: 80,
            height: 80,
            margin: "0 auto 20px",
            bgcolor: noBranchData ? colorPalette.warning : colorPalette.primary,
            boxShadow: noBranchData ? 
              `0 8px 20px rgba(255, 152, 0, 0.3)` : 
              `0 8px 20px ${colorPalette.primary}40`,
            transition: "all 0.3s ease",
            "&:hover": {
              transform: "scale(1.05)",
              boxShadow: noBranchData ? 
                `0 12px 25px rgba(255, 152, 0, 0.4)` : 
                `0 12px 25px ${colorPalette.primary}60`
            }
          }}
        >
          {noBranchData ? 
            <Warning sx={{ fontSize: 36 }} /> : 
            <Assignment sx={{ fontSize: 36 }} />
          }
        </Avatar>
        
        <DialogTitle
          sx={{
            fontWeight: 800,
            fontSize: { xs: "1.5rem", md: "1.8rem" },
            color: colorPalette.textDark,
            padding: 0,
            marginBottom: 1
          }}
        >
          {noBranchData ? "تنبيه" : "تسجيل حضور الطالب"}
        </DialogTitle>
        
        <Typography variant="body1" sx={{ 
          mt: 1, 
          color: colorPalette.textLight,
          fontSize: "1.1rem"
        }}>
          {noBranchData ? "لا يمكن تسجيل حضور هذا الطالب" : "يرجى تعبئة البيانات التالية لتسجيل حضور الطالب"}
        </Typography>
      </Box>

      <DialogContent sx={{ 
        padding: { xs: "8px 0", md: "16px 0" },
        maxHeight: "70vh",
        overflowY: "auto"
      }}>
        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            py: 6,
            flexDirection: 'column',
            gap: 2
          }}>
            <CircularProgress 
              sx={{ color: colorPalette.primary }} 
              size={40}
            />
            <Typography sx={{ color: colorPalette.textLight }}>
              جاري تحميل البيانات...
            </Typography>
          </Box>
        ) : error ? (
          <Fade in>
            <Box sx={{ 
              backgroundColor: '#ffeeee',
              padding: '20px',
              borderRadius: '12px',
              textAlign: 'center',
              color: colorPalette.error,
              mb: 2,
              border: `1px solid ${colorPalette.error}20`
            }}>
              <Warning sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                خطأ في تحميل البيانات
              </Typography>
              <Typography>{error}</Typography>
            </Box>
          </Fade>
        ) : noBranchData ? (
          <Fade in>
            <Box sx={{
              textAlign: 'center',
              padding: '30px 20px',
              backgroundColor: '#fff9e6',
              borderRadius: '12px',
              border: `1px solid ${colorPalette.warning}30`,
              marginBottom: '20px'
            }}>
              <Warning sx={{ 
                fontSize: 56, 
                color: colorPalette.warning,
                mb: 2
              }} />
              <Typography variant="h6" sx={{ 
                fontWeight: 700,
                color: colorPalette.warning,
                mb: 1
              }}>
                هذا الطالب لا يوجد معك في نفس الفرع
              </Typography>
              <Typography variant="body1" sx={{ 
                color: colorPalette.textLight,
                lineHeight: 1.6
              }}>
                لا يمكن تسجيل حضور طالب غير مسجل في فرعك
              </Typography>
            </Box>
          </Fade>
        ) : (
          <Fade in>
            <Grid container spacing={3}>
              {/* Student Info Section */}
              <Grid item xs={12}>
                <Paper sx={{
                  padding: "20px",
                  borderRadius: "12px",
                  backgroundColor: colorPalette.background,
                  border: `1px solid ${colorPalette.primaryLighter}`,
                  marginBottom: "8px",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    boxShadow: `0 4px 12px ${colorPalette.primary}20`
                  }
                }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle1" sx={{ 
                        fontWeight: 700,
                        color: colorPalette.primaryDark,
                        mb: 1,
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: "1.1rem"
                      }}>
                        <Person sx={{ 
                          marginLeft: 1, 
                          fontSize: '1.3rem',
                          color: colorPalette.primary 
                        }} />
                        الطالب: {studentData?.studentName}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle1" sx={{ 
                        fontWeight: 700,
                        color: colorPalette.primaryDark,
                        mb: 1,
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: "1.1rem"
                      }}>
                        <Badge sx={{ 
                          marginLeft: 1, 
                          fontSize: '1.3rem',
                          color: colorPalette.primary 
                        }} />
                        رقم الهوية: <bdi dir="ltr">{studentData?.nationalId}</bdi>
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Study Program Selection */}
              {studyInfo.length > 0 && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ 
                      fontFamily: '"Cairo", sans-serif',
                      fontSize: "1rem",
                      color: colorPalette.textLight,
                      fontWeight: 600
                    }}>
                      البرنامج الدراسي
                    </InputLabel>
                    <Select
                      name="studyProgram"
                      value={attendanceData.studyProgram || 0}
                      onChange={(e) => {
                        const selectedInfo = studyInfo[e.target.value];
                        handleAttendanceChange({
                          target: {
                            name: 'diploma',
                            value: selectedInfo.diplomName
                          }
                        });
                        handleAttendanceChange({
                          target: {
                            name: 'level',
                            value: selectedInfo.levelName
                          }
                        });
                      }}
                      label="البرنامج الدراسي"
                      required
                      sx={{
                        fontFamily: '"Cairo", sans-serif',
                        borderRadius: "10px",
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: colorPalette.primaryLighter
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: colorPalette.primary
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: colorPalette.primary,
                          borderWidth: "2px"
                        }
                      }}
                    >
                      {studyInfo.map((info, index) => (
                        <MenuItem 
                          key={index} 
                          value={index}
                          sx={{ 
                            fontFamily: '"Cairo", sans-serif',
                            "&:hover": {
                              backgroundColor: colorPalette.primaryLighter
                            },
                            "&.Mui-selected": {
                              backgroundColor: colorPalette.primaryLighter,
                              "&:hover": {
                                backgroundColor: colorPalette.primaryLight
                              }
                            }
                          }}
                        >
                          {info.diplomName} - {info.levelName} - {info.batchName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              {/* Attendance Details Section */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ 
                    fontFamily: '"Cairo", sans-serif',
                    fontSize: "1rem",
                    color: colorPalette.textLight,
                    fontWeight: 600
                  }}>
                    المستوى
                  </InputLabel>
                  <Select
                    name="level"
                    value={attendanceData.level}
                    onChange={handleAttendanceChange}
                    label="المستوى"
                    required
                    sx={{
                      fontFamily: '"Cairo", sans-serif',
                      borderRadius: "10px",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: colorPalette.primaryLighter
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: colorPalette.primary
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: colorPalette.primary,
                        borderWidth: "2px"
                      }
                    }}
                  >
                    {studyInfo.length > 0 ? (
                      [...new Set(studyInfo.map(info => info.levelName))].map((level) => (
                        <MenuItem 
                          key={level} 
                          value={level}
                          sx={{ 
                            fontFamily: '"Cairo", sans-serif',
                            "&:hover": {
                              backgroundColor: colorPalette.primaryLighter
                            }
                          }}
                        >
                          {level}
                        </MenuItem>
                      ))
                    ) : (
                      levels.map((level) => (
                        <MenuItem 
                          key={level} 
                          value={level}
                          sx={{ 
                            fontFamily: '"Cairo", sans-serif',
                            "&:hover": {
                              backgroundColor: colorPalette.primaryLighter
                            }
                          }}
                        >
                          {level}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ 
                    fontFamily: '"Cairo", sans-serif',
                    fontSize: "1rem",
                    color: colorPalette.textLight,
                    fontWeight: 600
                  }}>
                    الدبلوم
                  </InputLabel>
                  <Select
                    name="diploma"
                    value={attendanceData.diploma}
                    onChange={handleAttendanceChange}
                    label="الدبلوم"
                    required
                    sx={{
                      fontFamily: '"Cairo", sans-serif',
                      borderRadius: "10px",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: colorPalette.primaryLighter
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: colorPalette.primary
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: colorPalette.primary,
                        borderWidth: "2px"
                      }
                    }}
                  >
                    {studyInfo.length > 0 ? (
                      [...new Set(studyInfo.map(info => info.diplomName))].map((diploma) => (
                        <MenuItem 
                          key={diploma} 
                          value={diploma}
                          sx={{ 
                            fontFamily: '"Cairo", sans-serif',
                            "&:hover": {
                              backgroundColor: colorPalette.primaryLighter
                            }
                          }}
                        >
                          {diploma}
                        </MenuItem>
                      ))
                    ) : (
                      diplomas.map((diploma) => (
                        <MenuItem 
                          key={diploma} 
                          value={diploma}
                          sx={{ 
                            fontFamily: '"Cairo", sans-serif',
                            "&:hover": {
                              backgroundColor: colorPalette.primaryLighter
                            }
                          }}
                        >
                          {diploma}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="المقرر"
                  name="course"
                  value={attendanceData.course}
                  onChange={handleAttendanceChange}
                  required
                  sx={{
                    fontFamily: '"Cairo", sans-serif',
                    borderRadius: "10px",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: colorPalette.primaryLighter
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: colorPalette.primary
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: colorPalette.primary,
                      borderWidth: "2px"
                    }
                  }}
                  InputLabelProps={{
                    style: { 
                      fontFamily: '"Cairo", sans-serif',
                      color: colorPalette.textLight,
                      fontWeight: 600
                    }
                  }}
                  inputProps={{
                    style: { fontFamily: '"Cairo", sans-serif' }
                  }}
                />
              </Grid>
              
              {/* Attendance Time Section */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="ساعة الحضور"
                  type="time"
                  fullWidth
                  value={new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                  InputLabelProps={{
                    shrink: true,
                    style: { 
                      fontFamily: '"Cairo", sans-serif',
                      color: colorPalette.textLight,
                      fontWeight: 600
                    }
                  }}
                  inputProps={{
                    step: 300,
                    style: { fontFamily: '"Cairo", sans-serif' , direction: "ltr", unicodeBidi: "isolate" }
                  , dir: "ltr" }}
                  sx={{
                    fontFamily: '"Cairo", sans-serif',
                    borderRadius: "10px",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: colorPalette.primaryLighter
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: colorPalette.primary
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: colorPalette.primary,
                      borderWidth: "2px"
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="تاريخ الحضور"
                  type="date"
                  fullWidth
                  value={new Date().toISOString().substr(0, 10)}
                  InputLabelProps={{
                    shrink: true,
                    style: { 
                      fontFamily: '"Cairo", sans-serif',
                      color: colorPalette.textLight,
                      fontWeight: 600
                    }
                  }}
                  sx={{
                    fontFamily: '"Cairo", sans-serif',
                    borderRadius: "10px",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: colorPalette.primaryLighter
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: colorPalette.primary
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: colorPalette.primary,
                      borderWidth: "2px"
                    }
                  }}
                 inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
              </Grid>
              
              {/* Confirmation Section */}
              <Grid item xs={12}>
                <Paper
                  elevation={0}
                  sx={{
                    padding: "20px",
                    borderRadius: "12px",
                    backgroundColor: colorPalette.background,
                    border: `1px solid ${colorPalette.primaryLighter}`,
                    transition: "all 0.3s ease",
                    "&:hover": {
                      boxShadow: `0 4px 12px ${colorPalette.primary}15`
                    }
                  }}
                >
                  <Grid container alignItems="center">
                    <Grid item xs={12} md={8}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            name="confirmed"
                            checked={attendanceData.confirmed}
                            onChange={handleAttendanceChange}
                            sx={{
                              color: colorPalette.primaryLight,
                              "&.Mui-checked": {
                                color: colorPalette.primary
                              },
                              "&:hover": {
                                backgroundColor: `${colorPalette.primary}15`
                              }
                            }}
                          />
                        }
                        label={
                          <Typography 
                            sx={{ 
                              fontFamily: '"Cairo", sans-serif',
                              fontWeight: 700,
                              color: colorPalette.textDark,
                              fontSize: "1.05rem"
                            }}
                          >
                            أؤكد أن الطالب حضر المحاضرة اليوم
                          </Typography>
                        }
                      />
                    </Grid>
                    <Grid item xs={12} md={4} sx={{ textAlign: 'start' }}>
                      <Typography variant="body2" sx={{ 
                        fontFamily: '"Cairo", sans-serif',
                        color: colorPalette.textLight,
                        fontStyle: 'italic',
                        fontWeight: 500
                      }}>
                        {new Date().toLocaleString('ar-EG', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          </Fade>
        )}
      </DialogContent>

      <DialogActions sx={{ 
        padding: "24px 0 0 0", 
        justifyContent: "center",
        gap: 2,
        borderTop: `1px solid ${colorPalette.primaryLighter}`,
        marginTop: 2
      }}>
        <Button
          onClick={onClose}
          variant="outlined"
          startIcon={<Close />}
          sx={{
            borderRadius: "10px",
            padding: "12px 32px",
            fontWeight: 700,
            fontFamily: '"Cairo", sans-serif',
            fontSize: "1rem",
            border: `2px solid ${noBranchData ? colorPalette.primary : colorPalette.textLight}`,
            color: noBranchData ? colorPalette.primary : colorPalette.textLight,
            minWidth: "120px",
            "& .MuiButton-startIcon": {
              marginInlineEnd: "8px",
              marginInlineStart: "0px"
            },
            "&:hover": {
              border: `2px solid ${noBranchData ? colorPalette.primaryDark : colorPalette.textDark}`,
              backgroundColor: noBranchData ? `${colorPalette.primary}08` : `${colorPalette.textDark}08`,
              transform: "translateY(-1px)",
              boxShadow: `0 4px 12px ${noBranchData ? colorPalette.primary + '20' : colorPalette.textDark + '20'}`
            },
            transition: "all 0.3s ease"
          }}
        >
          {noBranchData ? "حسناً" : "إلغاء"}
        </Button>
        
        {!noBranchData && (
          submitting ? (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              padding: "12px 32px"
            }}>
              <CircularProgress
                size={24}
                sx={{ color: colorPalette.primary }}
              />
              <Typography sx={{ 
                color: colorPalette.textLight,
                fontFamily: '"Cairo", sans-serif',
                fontWeight: 600
              }}>
                جاري التسجيل...
              </Typography>
            </Box>
          ) : (
            <Button
              onClick={handleAttendanceSubmit}
              variant="contained"
              startIcon={<Check />}
              disabled={!attendanceData.confirmed}
              sx={{
                borderRadius: "10px",
                padding: "12px 32px",
                fontWeight: 700,
                fontFamily: '"Cairo", sans-serif',
                fontSize: "1rem",
                background: `linear-gradient(135deg, ${colorPalette.primary}, ${colorPalette.primaryDark})`,
                boxShadow: `0 4px 15px ${colorPalette.primary}40`,
                minWidth: "150px",
                "& .MuiButton-startIcon": {
                  marginInlineEnd: "8px",
                  marginInlineStart: "0px"
                },
                "&:hover": {
                  background: `linear-gradient(135deg, ${colorPalette.primaryDark}, ${colorPalette.textDark})`,
                  boxShadow: `0 6px 20px ${colorPalette.primary}60`,
                  transform: "translateY(-2px)"
                },
                "&.Mui-disabled": {
                  background: "#e0e0e0",
                  color: "#9e9e9e",
                  transform: "none",
                  boxShadow: "none"
                },
                transition: "all 0.3s ease"
              }}
            >
              تأكيد الحضور
            </Button>
          )
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AttendanceDialog;