import React, { useState, useEffect } from "react";
import {
  Box, Container, CircularProgress, Alert, Typography, Button, GlobalStyles
} from "@mui/material";
import { motion } from "framer-motion";
import { Person } from "@mui/icons-material";

// Components
import EmployeeInfoCard from "../components/EmployeeInfoCard";
import DashboardTabs from "../components/DashboardTabs";
import OverviewTab from "../components/tabs/OverviewTab";
import TasksTab from "../components/tabs/TasksTab";
import AttendanceTab from "../components/tabs/AttendanceTab";
import MeetingRoomTab from "../components/tabs/MeetingRoomTab"; // الجديد
import VacationsTab from "../components/tabs/VacationsTab";
import SalaryTab from "../components/tabs/SalaryTab";
import ProfileTab from "../components/tabs/ProfileTab";
import HRVacationsTab from "../components/tabs/HRVacationsTab";
import VacationPermissionsTab from "../components/tabs/VacationPermissionsTab";
import EmployeeOfTheMonthTab from "../components/tabs/EmployeeOfTheMonthTab";
import PostsDialog from "../components/PostsDialog";
import FloatingParticles from "../components/FloatingParticles";

const COLOR_SCHEME = {
  primary: "#76ae97",
  primaryLight: "#94c4ac",
  primaryDark: "#5a8f7a",
  secondary: "#ff6b6b",
  accent: "#4ecdc4",
  background: "#f8fbfa",
  text: "#2c3e50",
  success: "#22c55e",
  warning: "#f59e42",
  error: "#ef4444",
  info: "#3b82f6",
  gold: "#FFD700",
};

const dashboardGlobalStyles = {
  "html, body, #root": {
    width: "100%",
    maxWidth: "100%",
    overflowX: "hidden",
  },
  "#profile-dashboard-root": {
    width: "100%",
    maxWidth: "100%",
  },
  "#profile-dashboard-root .profile-dashboard-container": {
    width: "100% !important",
    maxWidth: "none !important",
    margin: "0 !important",
  },
  "#profile-dashboard-root .profile-tab-content": {
    width: "100%",
    maxWidth: "100%",
  },
  "#profile-dashboard-root .profile-tab-content .MuiPaper-root, #profile-dashboard-root .profile-tab-content .MuiCard-root": {
    boxSizing: "border-box",
    transition: "transform .22s ease, box-shadow .22s ease, border-color .22s ease",
  },
  "@media (max-width: 900px)": {
    "#profile-dashboard-root .profile-dashboard-container": {
      paddingLeft: "8px !important",
      paddingRight: "8px !important",
    },
    "#profile-dashboard-root .MuiTypography-h4": {
      fontSize: "1.05rem !important",
    },
    "#profile-dashboard-root .MuiTypography-h5": {
      fontSize: "0.94rem !important",
    },
    "#profile-dashboard-root .MuiTypography-h6": {
      fontSize: "0.82rem !important",
    },
    "#profile-dashboard-root .MuiTypography-body1": {
      fontSize: "0.72rem !important",
    },
    "#profile-dashboard-root .MuiTypography-body2": {
      fontSize: "0.66rem !important",
    },
    "#profile-dashboard-root .MuiButton-root": {
      fontSize: "0.68rem !important",
      minHeight: "34px",
    },
    "#profile-dashboard-root .MuiInputBase-root, #profile-dashboard-root .MuiInputLabel-root": {
      fontSize: "0.72rem !important",
    },
    "#profile-dashboard-root .MuiChip-root": {
      fontSize: "0.62rem !important",
      height: "25px",
    },
  },
  "@media (max-width: 600px)": {
    "#profile-dashboard-root .profile-dashboard-container": {
      paddingLeft: "4px !important",
      paddingRight: "4px !important",
    },
    "#profile-dashboard-root .MuiTypography-h4": {
      fontSize: "0.95rem !important",
    },
    "#profile-dashboard-root .MuiTypography-h5": {
      fontSize: "0.86rem !important",
    },
    "#profile-dashboard-root .MuiTypography-h6": {
      fontSize: "0.76rem !important",
    },
    "#profile-dashboard-root .MuiTypography-body1": {
      fontSize: "0.66rem !important",
    },
    "#profile-dashboard-root .MuiTypography-body2": {
      fontSize: "0.61rem !important",
    },
    "#profile-dashboard-root .MuiButton-root": {
      fontSize: "0.62rem !important",
      minHeight: "32px",
    },
    "#profile-dashboard-root .MuiInputBase-root, #profile-dashboard-root .MuiInputLabel-root": {
      fontSize: "0.66rem !important",
    },
    "#profile-dashboard-root .MuiChip-root": {
      fontSize: "0.56rem !important",
      height: "23px",
    },
  },
};


export default function EmployeeProfileDashboard() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState("كل السنة");
  const [activeTab, setActiveTab] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [unseenPostsCount, setUnseenPostsCount] = useState(0);
  const [postsDialogOpen, setPostsDialogOpen] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Dummy employee data
  const [employeeData, setEmployeeData] = useState({
    deductions: {
      lateHours: 5,
      lateDeduction: 100,
      absentDays: 2,
      absentDeduction: 200,
      otherDeductions: 150,
      totalDeductions: 450,
    },
    vacations: {
      remaining: 18,
      used: 7,
      lastRequests: [
        { from: "2024-01-15", to: "2024-01-20", status: "approved" },
        { from: "2024-02-10", to: "2024-02-12", status: "pending" },
      ],
    },
    attendance: {
      attendanceRate: 92,
      presentDays: 22,
      absentDays: 2,
      lateDays: 3,
      vacationDays: 3,
      lastCheckIn: new Date(),
    },
    salary: {
      baseSalary: "",
      overtime: 500,
      bonuses: 300,
      deductions: 450,
      netSalary: 8350,
    },
  });

  // Role helpers
  const isHRUser = () => user && (user.userJop === 6 || user.userJop === 11);
  const isHRManager = () => user && user.userJop === 6;
  const isSupervisor = () => user && user.userJop === 9;

  // counters
  const updatePendingRequestsCount = (count) => setPendingRequestsCount(count);
  const handleUnseenCountChange = (count) => setUnseenPostsCount(count);

  // ====== تحديث الفهارس بعد إضافة تبويب الاجتماعات ======
  // ترتيب التابات الثابت قبل أي شرط: 0 نظرة عامة، 1 مهام، 2 حضور، 3 اجتماعات، 4 إعلانات، 5 إجازات
  const BASE_TABS = 6; // تغيير من 5 إلى 6

  // flags ثابتة لكل رندر
  const hr = isHRUser();
  const sup = isSupervisor();

  // تحديث فهارس التابات الشرطية
  const SALARY_TAB_INDEX = BASE_TABS + (sup ? 1 : 0) + (hr ? 1 : 0);
  const PROFILE_TAB_INDEX = SALARY_TAB_INDEX + 1;

useEffect(() => {
  const userData = JSON.parse(localStorage.getItem("user") || "{}");

  if (userData && userData.guid) {
    setUser(userData);

    setLoading(false); // ✅ اقفل لودنج الصفحة هنا فوراً

    fetchTasks(userData.guid);   // ✅ تحميل المهام لوحده
    checkUnseenPosts();
  } else {
    setError("لم يتم العثور على بيانات المستخدم");
    setLoading(false);
  }
}, []);


const fetchTasks = async (userGuid) => {
  try {
    setLoadingTasks(true);       // ✅ لودنج المهام فقط
    setError(null);              // (اختياري) امسح أي خطأ عام لو حابب
    // setTasksError(null);      // (اختياري) لو عامل state لخطأ المهام

    const response = await fetch(
      "https://api3.sstli.com/api/PuplicTask/GetPuplicTasksByQuery"
    );
    if (!response.ok) throw new Error("فشل في جلب بيانات المهام");

    const tasksData = await response.json();
    const classifiedTasks = await classifyTasksForUser(tasksData, userGuid);

    setTasks(classifiedTasks);
  } catch (err) {
    setError(err.message || "حدث خطأ أثناء تحميل المهام"); // لو انت لسه بتستخدم error واحد
  } finally {
    setLoadingTasks(false);      // ✅ اقفل لودنج المهام
  }
};


  const checkUnseenPosts = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const userGuid = userData.guid;
      if (!userGuid) return;

      const response = await fetch(
        `https://filesregsiteration.sstli.com/erp/posts_api.php?action=check_unseen&user_guid=${userGuid}`
      );
      if (response.ok) {
        const result = await response.json();
        if (result.success) setUnseenPostsCount(result.unseen_count || 0);
      }
    } catch (err) {
      console.error("Error checking unseen posts:", err);
    }
  };

  const handleOpenPostsDialog = async () => {
    setPostsDialogOpen(true);
    try {
      const { guid } = JSON.parse(localStorage.getItem("user") || "{}");
      if (!guid) return;
      const res = await fetch(
        "https://filesregsiteration.sstli.com/erp/posts_api.php?action=mark_all_viewed",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_guid: guid }),
        }
      );
      const data = await res.json();
      if (data.success) setUnseenPostsCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (user) {
      checkUnseenPosts();
      const interval = setInterval(() => checkUnseenPosts(), 300000);
      return () => clearInterval(interval);
    }
  }, [user]);

  async function mapWithConcurrency(items, limit, mapper) {
  const results = [];
  let i = 0;

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await mapper(items[idx], idx);
    }
  });

  await Promise.all(workers);
  return results;
}


const classifyTasksForUser = async (tasksData, userGuid) => {
  // 1) صنّف المهام من غير ما تجيب updates
  const preClassified = tasksData.map((task) => {
    let taskType = null;
    let assignedByObj = null;

    try { assignedByObj = JSON.parse(task.assignedBy); } catch {}
    if (assignedByObj?.guid === userGuid) taskType = "sent";

    if (!taskType) {
      try {
        let assignedTo = task.assignedTo;
        if (typeof assignedTo === "string" && assignedTo.startsWith("[")) assignedTo = JSON.parse(assignedTo);

        const isRecipient = Array.isArray(assignedTo) && assignedTo.some((r) =>
          (typeof r === "object" && r?.guid ? r.guid === userGuid : r === userGuid)
        );

        if (isRecipient) taskType = "received";
      } catch {}
    }

    return taskType ? { ...task, taskType } : null;
  }).filter(Boolean);

  // 2) هات updates بالتوازي (مثلاً 10 في نفس الوقت)
  const enriched = await mapWithConcurrency(preClassified, 10, async (task) => {
    const updates = await fetchTaskUpdates(task.id);

    let finalStatus = 0;
    if (updates?.length) {
      if (task.taskType === "sent") {
        const last = updates.reduce((a, b) => new Date(b.updatedAt) > new Date(a.updatedAt) ? b : a);
        finalStatus = last.status ?? 0;
      } else {
        const userUpdates = updates.filter(u => u.updatedBy === userGuid);
        if (userUpdates.length) {
          const last = userUpdates.reduce((a, b) => new Date(b.updatedAt) > new Date(a.updatedAt) ? b : a);
          finalStatus = last.status ?? 0;
        }
      }
    }

    return { ...task, updates, finalStatus };
  });

  return enriched;
};


  const fetchTaskUpdates = async (taskId) => {
    try {
      const response = await fetch(
        `https://api3.sstli.com/api/PuplicTask/GetTaskUpdates/${taskId}`
      );
      if (response.ok) return await response.json();
      return [];
    } catch (err) {
      console.error(`فشل في جلب تحديثات المهمة ${taskId}:`, err);
      return [];
    }
  };

  const filterTasksByTypeAndDate = (type, year, month) => {
    const MONTHS = [
      "يناير",
      "فبراير",
      "مارس",
      "أبريل",
      "مايو",
      "يونيو",
      "يوليو",
      "أغسطس",
      "سبتمبر",
      "أكتوبر",
      "نوفمبر",
      "ديسمبر",
    ];
    return tasks.filter((task) => {
      if (task.taskType !== type) return false;
      const taskDate = new Date(task.createdAt);
      const taskYear = taskDate.getFullYear();
      if (year && taskYear !== year) return false;
      if (month && month !== "كل السنة") {
        const taskMonth = taskDate.getMonth();
        const selectedMonthIndex = MONTHS.indexOf(month);
        if (taskMonth !== selectedMonthIndex) return false;
      }
      return true;
    });
  };

  const calculateStats = (tasksList) => {
    const total = tasksList.length;
    const completed = tasksList.filter((t) => t.finalStatus === 2).length;
    const inProgress = tasksList.filter((t) => t.finalStatus === 1).length;
    const pending = tasksList.filter((t) => t.finalStatus === 0).length;
    return {
      total,
      completed,
      inProgress,
      pending,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        flexDirection="column"
        sx={{
          background: `linear-gradient(135deg, ${COLOR_SCHEME.background} 0%, #ffffff 100%)`,
        }}
      >
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.5 }}>
          <Box sx={{ position: "relative", display: "inline-flex" }}>
            <CircularProgress size={80} thickness={4} sx={{ color: COLOR_SCHEME.primary, mb: 2 }} />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: "absolute",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Person sx={{ fontSize: 30, color: COLOR_SCHEME.primary }} />
            </Box>
          </Box>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Typography variant="h6" color="textSecondary" sx={{ mt: 2 }}>
            جاري تحميل البيانات...
          </Typography>
        </motion.div>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" variant="filled" sx={{ borderRadius: 3 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <>
      <GlobalStyles styles={dashboardGlobalStyles} />
      <FloatingParticles />

      {/* Posts dialog */}
      <PostsDialog
        open={postsDialogOpen}
        onClose={() => setPostsDialogOpen(false)}
        onUnseenCountChange={handleUnseenCountChange}
      />

      <Box
        id="profile-dashboard-root"
        sx={{
          width: "100%",
          maxWidth: "100%",
          minHeight: "100vh",
          background: `linear-gradient(135deg, ${COLOR_SCHEME.background} 0%, #ffffff 100%)`,
          position: "relative",
          zIndex: 1,
          overflowX: "hidden",
        }}
      >
        <Container
          className="profile-dashboard-container"
          maxWidth={false}
          disableGutters
          sx={{
            py: { xs: 0.65, sm: 1, md: 1.6, xl: 2.5 },
            px: { xs: 0.45, sm: 0.75, md: 1.4, xl: 3 },
            width: "100%",
            maxWidth: "none",
            boxSizing: "border-box",
          }}
        >
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <EmployeeInfoCard user={user} isHRUser={hr} isHRManager={isHRManager()} />
          </motion.div>

          {/* Tabs */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <DashboardTabs
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              isHRUser={hr}
              isSupervisor={sup}
              pendingRequestsCount={pendingRequestsCount}
              unseenPostsCount={unseenPostsCount}
            />
          </motion.div>

          {/* Tab content */}
          <Box
            className="profile-tab-content"
            sx={{
              mt: { xs: 0.7, sm: 1, md: 1.5 },
              width: "100%",
              maxWidth: "100%",
            }}
          >
           {activeTab === 0 && (
  <OverviewTab
    user={user}
    tasks={tasks}
    selectedYear={selectedYear}
    selectedMonth={selectedMonth}
    setSelectedYear={setSelectedYear}        // ✅
    setSelectedMonth={setSelectedMonth}      // ✅
    employeeData={employeeData}
    filterTasksByTypeAndDate={filterTasksByTypeAndDate}
    calculateStats={calculateStats}
  />
)}


            {activeTab === 1 && (
            <TasksTab
  tasks={tasks}
  selectedYear={selectedYear}
  selectedMonth={selectedMonth}
  setSelectedYear={setSelectedYear}
  setSelectedMonth={setSelectedMonth}
  filterTasksByTypeAndDate={filterTasksByTypeAndDate}
  calculateStats={calculateStats}
  isHRUser={hr}
  loadingTasks={loadingTasks}   // ✅
/>

            )}

            {activeTab === 2 && <AttendanceTab employeeData={employeeData} isHRUser={hr} />}

            {/* 3: غرفة الاجتماعات - التبويب الجديد */}
            {activeTab === 3 && <MeetingRoomTab />}

            {/* 4: الإعلانات */}
            {activeTab === 4 && (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
                  <Box
                    sx={{
                      background: "white",
                      borderRadius: 3,
                      p: { xs: 1.2, sm: 1.8, md: 3 },
                      boxShadow: "0 8px 32px rgba(128, 180, 158, 0.1)",
                      border: "2px dashed #80b49e",
                      maxWidth: 400,
                      mx: "auto",
                    }}
                  >
                    <Typography
                      variant="h5"
                      gutterBottom
                      sx={{ color: "#80b49e", fontWeight: "bold", mb: { xs: 1, md: 2 }, fontSize: { xs: "0.88rem", sm: "1rem", md: "1.2rem" } }}
                    >
                      الإعلانات والمنشورات
                    </Typography>
                    <Typography variant="body1" color="textSecondary" sx={{ mb: { xs: 1.2, md: 2 }, fontSize: { xs: "0.64rem", sm: "0.72rem", md: "0.82rem" } }}>
                      شارك أفكارك، اطلع على آخر المستجدات، وتفاعل مع زملائك
                    </Typography>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="contained"
                        size="large"
                        onClick={handleOpenPostsDialog}
                        sx={{
                          bgcolor: "#80b49e",
                          "&:hover": {
                            bgcolor: "#5a8f7a",
                            transform: "translateY(-2px)",
                            boxShadow: "0 8px 20px rgba(128, 180, 158, 0.3)",
                          },
                          px: { xs: 1.4, sm: 2, md: 3 },
                          py: { xs: 0.7, sm: 0.9, md: 1.1 },
                          fontSize: { xs: "0.64rem", sm: "0.74rem", md: "0.9rem" },
                          borderRadius: 2,
                          transition: "all 0.3s ease",
                        }}
                      >
                        فتح الإعلانات والمنشورات
                      </Button>
                    </motion.div>
                  </Box>
                </motion.div>
              </Box>
            )}

            {/* 5: الإجازات أو HR إدارة الطلبات */}
            {activeTab === 5 && (hr ? <HRVacationsTab onPendingRequestsUpdate={updatePendingRequestsCount} /> : <VacationsTab employeeData={employeeData} />)}

            {/* 6: موظف الشهر (شرطي) */}
            {activeTab === 6 && sup && <EmployeeOfTheMonthTab />}

            {/* 7: صلاحيات الموظفين (شرطي) */}
            {activeTab === 7 && hr && <VacationPermissionsTab />}

            {/* الرواتب: حسب SALARY_TAB_INDEX */}
            {activeTab === SALARY_TAB_INDEX && (
              <SalaryTab employeeData={employeeData} isHRUser={hr} />
            )}

            {/* البيانات: بعد الرواتب مباشرة */}
            {activeTab === PROFILE_TAB_INDEX && (
              <ProfileTab user={user} isHRUser={hr} />
            )}
          </Box>
        </Container>
      </Box>
    </>
  );
}