import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Grid,
  CircularProgress,
  Divider,
  useTheme,
  Paper,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button
} from '@mui/material';
import {
  Book as BookIcon,
  People as PeopleIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  Fingerprint as FingerprintIcon,
  Phone as PhoneIcon
} from '@mui/icons-material';

// Helper function to normalize course names for comparison
const normalizeCourseName = (name) => {
  if (!name) return '';
  return name
    .replace(/[^\w\u0600-\u06FF]/g, '') // Remove non-alphanumeric and non-Arabic characters
    .replace(/\s+/g, '') // Remove all whitespace
    .toLowerCase();
};

// Fuzzy matching function for course names
const isSimilarCourse = (name1, name2) => {
  const normalized1 = normalizeCourseName(name1);
  const normalized2 = normalizeCourseName(name2);
  
  // If one is contained within the other (60% match)
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    return true;
  }
  
  // Calculate similarity score (simple implementation)
  const longer = normalized1.length > normalized2.length ? normalized1 : normalized2;
  const shorter = normalized1.length > normalized2.length ? normalized2 : normalized1;
  
  const longerLength = longer.length;
  if (longerLength === 0) return false;
  
  // If the shorter string is at least 60% of the longer string and is contained within it
  return (shorter.length / longerLength >= 0.6) && longer.includes(shorter);
};

const CourseAttendanceStats = ({ attendanceData, studentsData, fromDate, toDate }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [courseStats, setCourseStats] = useState({});
  const [courseAliases, setCourseAliases] = useState({});
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [studentDetails, setStudentDetails] = useState(null);
  const [studentLoading, setStudentLoading] = useState(false);
  const [openStudentDialog, setOpenStudentDialog] = useState(false);

  useEffect(() => {
    if (attendanceData.length > 0) {
      calculateCourseStats();
    }
  }, [attendanceData, fromDate, toDate]);

  // Function to find similar courses and create aliases
  const findCourseAliases = (courses) => {
    const aliases = {};
    const processed = new Set();
    
    courses.forEach(course => {
      if (processed.has(course)) return;
      
      // Find all similar courses
      const similarCourses = courses.filter(c => 
        c !== course && isSimilarCourse(c, course)
      );
      
      if (similarCourses.length > 0) {
        // Choose the longest name as the canonical name
        const allNames = [course, ...similarCourses];
        const canonicalName = allNames.reduce((longest, current) => 
          current.length > longest.length ? current : longest
        );
        
        // Create aliases for all similar courses
        allNames.forEach(name => {
          aliases[name] = canonicalName;
        });
        
        // Mark all as processed
        allNames.forEach(name => processed.add(name));
      }
    });
    
    return aliases;
  };

  const calculateCourseStats = () => {
    setLoading(true);
    
    const stats = {};
    const studentNationalIds = studentsData.map(student => student.nationalId);
    
    // Filter attendance data by date range and valid students
    const filteredAttendance = attendanceData.filter(att => {
      if (!studentNationalIds.includes(att.national_id)) return false;
      
      if (!fromDate && !toDate) return true;
      
      // Parse the attendance date (assuming format "YYYY-MM-DD")
      const attDateParts = att.attendance_date.split('-');
      const attDate = new Date(
        parseInt(attDateParts[0]),
        parseInt(attDateParts[1]) - 1, // months are 0-indexed
        parseInt(attDateParts[2])
      );
      
      // Create comparison dates (set to start/end of day)
      const from = fromDate ? new Date(fromDate) : new Date(0);
      from.setHours(0, 0, 0, 0);
      
      const to = toDate ? new Date(toDate) : new Date();
      to.setHours(23, 59, 59, 999);
      
      // Compare dates (ignore time components)
      return attDate >= from && attDate <= to;
    });

    // First pass: find all unique course names and create aliases
    const allCourses = [...new Set(filteredAttendance.map(att => att.course))];
    const aliases = findCourseAliases(allCourses);
    setCourseAliases(aliases);

    // Second pass: aggregate stats using canonical names
    filteredAttendance.forEach(att => {
      const canonicalCourse = aliases[att.course] || att.course;
      const key = `${att.diploma_id}|${canonicalCourse}`;
      
      if (!stats[key]) {
        stats[key] = {
          diploma: att.diploma_id,
          course: canonicalCourse,
          originalNames: new Set([att.course]),
          students: new Set(),
          studentRecords: [],
          count: 0
        };
      } else {
        stats[key].originalNames.add(att.course);
      }
      
      stats[key].students.add(att.national_id);
      stats[key].studentRecords.push(att);
      stats[key].count++;
    });

    setCourseStats(stats);
    setLoading(false);
  };

  const handleCourseClick = (courseKey) => {
    const course = courseStats[courseKey];
    const studentRecords = course.studentRecords;
    
    // Match student records with student data
    const attendedStudents = studentsData.filter(student => 
      course.students.has(student.nationalId)
    ).map(student => {
      const records = studentRecords.filter(record => 
        record.national_id === student.nationalId
      );
      return {
        ...student,
        attendanceRecords: records
      };
    });
    
    setSelectedCourse(course);
    setSelectedStudents(attendedStudents);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCourse(null);
    setSelectedStudents([]);
  };

  const handleStudentClick = async (nationalId) => {
    setStudentLoading(true);
    setOpenStudentDialog(true);
    
    try {
      const response = await fetch(`https://api1.sstli.com/api/student/${nationalId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setStudentDetails(data);
    } catch (err) {
      console.error('Error fetching student details:', err);
    } finally {
      setStudentLoading(false);
    }
  };

  const handleCloseStudentDialog = () => {
    setOpenStudentDialog(false);
    setStudentDetails(null);
  };

  return (
    <>
      <Paper elevation={0} sx={{
        p: 1,
        mb: 4,
        borderRadius: 3,
        bgcolor: 'background.paper',
        boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)'
      }}>
        <Typography variant="h4" sx={{ 
          fontWeight: 700,
          color: theme.palette.primary.dark,
          mb: 2,
          fontFamily: '"Cairo", sans-serif'
        }}>
          إحصائية الحضور حسب المقررات
        </Typography>
        <Typography variant="body1" sx={{ 
          color: 'text.secondary',
          fontFamily: '"Cairo", sans-serif',
          mb: 3
        }}>
          نظرة عامة على أعداد الطلاب في كل مقرر 
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2}>
            {Object.entries(courseStats).map(([courseKey, course]) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={courseKey}>
                <Card 
                  onClick={() => handleCourseClick(courseKey)}
                  sx={{ 
                    borderRadius: 3,
                    minWidth: "300px",
                    boxShadow: '0 8px 16px 0 rgba(0,0,0,0.05)',
                    transition: 'all 0.3s ease',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 12px 24px 0 rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  <CardContent sx={{ 
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    p: 3,
                    position: 'relative'
                  }}>
                    {/* Info icon showing original names */}
                    {course.originalNames.size > 1 && (
                      <Tooltip 
                        title={
                          <div>
                            <Typography variant="subtitle2">الأسماء المضمنة:</Typography>
                            <ul style={{ paddingLeft: '20px', margin: '5px 0' }}>
                              {Array.from(course.originalNames).map((name, i) => (
                                <li key={i}>{name}</li>
                              ))}
                            </ul>
                          </div>
                        }
                        arrow
                      >
                        <InfoIcon 
                          sx={{ 
                            position: 'absolute',
                            top: 10,
                            left: 10,
                            color: theme.palette.text.secondary,
                            cursor: 'pointer'
                          }} 
                        />
                      </Tooltip>
                    )}
                    
                    <Avatar sx={{ 
                      bgcolor: theme.palette.secondary.main,
                      width: 72,
                      height: 72,
                      mb: 3
                    }}>
                      <BookIcon />
                    </Avatar>
                    
                    <Typography variant="h6" sx={{ 
                      fontWeight: 600,
                      mb: 1,
                      fontFamily: '"Cairo", sans-serif'
                    }}>
                      {course.course}
                    </Typography>
                    
                    <Chip 
                      label={course.diploma}
                      color="primary"
                      size="small"
                      sx={{ mb: 2, fontFamily: '"Cairo", sans-serif' }}
                    />
                    
                    <Divider sx={{ 
                      width: '40%',
                      height: 2,
                      bgcolor: theme.palette.primary.main,
                      my: 1
                    }} />
                    
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mt: 2
                    }}>
                      <PeopleIcon sx={{ 
                        color: theme.palette.secondary.main,
                        mr: 1
                      }} />
                      <Typography variant="h5" sx={{ 
                        fontWeight: 700,
                        fontFamily: '"Cairo", sans-serif'
                      }}>
                        {course.students.size}
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" sx={{ 
                      mt: 1,
                      color: 'text.secondary',
                      fontFamily: '"Cairo", sans-serif'
                    }}>
                      ({course.count} حضور)
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Course Attendance Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: '"Cairo", sans-serif'
        }}>
          <Typography variant="h6" sx={{ fontFamily: '"Cairo", sans-serif' }}>
            الطلاب الحاضرين في مقرر {selectedCourse?.course}
          </Typography>
          <IconButton onClick={handleCloseDialog}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <List>
            {selectedStudents.map((student) => (
              <ListItem 
                key={student.nationalId}
                button
                onClick={() => handleStudentClick(student.nationalId)}
                sx={{
                  transition: 'all 0.2s',
                  textAlign: 'right',
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                    transform: 'translateX(-4px)'
                  }
                }}
              >
                <ListItemText
                  primary={student.studentName}
                  secondary={
                    <>
                      <div>الهوية الوطنية: {student.nationalId || 'غير معروف'}</div>
                      <div>عدد مرات الحضور: {student.attendanceRecords.length}</div>
                      <div>آخر حضور: {student.attendanceRecords[0]?.attendance_date}</div>
                    </>
                  }
                  primaryTypographyProps={{ fontFamily: '"Cairo", sans-serif', fontWeight: 500 }}
                  secondaryTypographyProps={{ fontFamily: '"Cairo", sans-serif' }}
                />
                <Chip 
                  label="عرض التفاصيل"
                  color="primary"
                  size="small"
                  sx={{ fontFamily: '"Cairo", sans-serif', cursor: "pointer" }}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCloseDialog} 
            color="primary"
            sx={{ fontFamily: '"Cairo", sans-serif' }}
          >
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>

      {/* Student Details Dialog */}
      <Dialog
        open={openStudentDialog}
        onClose={handleCloseStudentDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: '"Cairo", sans-serif'
        }}>
          <Typography variant="h6" sx={{ fontFamily: '"Cairo", sans-serif' }}>
            تفاصيل الطالب
          </Typography>
          <IconButton onClick={handleCloseStudentDialog}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {studentLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : studentDetails ? (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <PersonIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                <Typography variant="h6" sx={{ fontFamily: '"Cairo", sans-serif' }}>
                  {studentDetails.studentName}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" sx={{ 
                  fontWeight: 600,
                  fontFamily: '"Cairo", sans-serif',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <FingerprintIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                  الهوية الوطنية:
                </Typography>
                <Typography sx={{ fontFamily: '"Cairo", sans-serif', ml: 4 }}>
                  {studentDetails.nationalId || 'غير متوفر'}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" sx={{ 
                  fontWeight: 600,
                  fontFamily: '"Cairo", sans-serif',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <PhoneIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                  رقم الجوال:
                </Typography>
                <Typography sx={{ fontFamily: '"Cairo", sans-serif', ml: 4 }}>
                  {studentDetails.studentTel || 'غير متوفر'}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" sx={{ 
                  fontWeight: 600,
                  fontFamily: '"Cairo", sans-serif'
                }}>
                  البرنامج الدراسي:
                </Typography>
                <Typography sx={{ fontFamily: '"Cairo", sans-serif', ml: 4 }}>
                  {studentDetails.diplomName || 'غير متوفر'}
                </Typography>
              </Box>
            </>
          ) : (
            <Typography sx={{ fontFamily: '"Cairo", sans-serif', p: 2 }}>
              لا توجد بيانات متاحة لهذا الطالب
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCloseStudentDialog} 
            color="primary"
            sx={{ fontFamily: '"Cairo", sans-serif' }}
          >
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CourseAttendanceStats;