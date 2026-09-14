import * as uiLayout from './common/uiLayout';
import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  Box,
  Typography,
  Avatar,
  IconButton,
  Card,
  Button,
} from "@mui/material";
import { Close, EmojiEvents, VolumeUp } from "@mui/icons-material";
import { motion } from "framer-motion";
import Confetti from "react-confetti";
import dangerSound from "../images/danger.mp3";

const EmployeeOfTheMonthDialog = () => {
  const [open, setOpen] = useState(false);
  const [employee, setEmployee] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [showAudioPrompt, setShowAudioPrompt] = useState(false);
  const [userBranch, setUserBranch] = useState(null);
  const audioRef = useRef(null);

  const API_BASE_URL = "https://filesregsiteration.sstli.com/erp/best-employee.php";
  const IMAGE_API_URL = "https://filesregsiteration.sstli.com/erp/image_api.php";
  const USER_INFO_URL = "https://api1.sstli.com/api/userinfo";

  useEffect(() => {
    fetchUserInfoAndWinner();
    enableAudio();
  }, []);

  // ✅ جلب معلومات المستخدم الحالي وموظف الشهر
  const fetchUserInfoAndWinner = async () => {
    try {
      // جلب المستخدم الحالي من localStorage
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      
      if (!currentUser.guid) {
        console.error("No user GUID found in localStorage");
        return;
      }

      // جلب جميع المستخدمين من API
      const usersResponse = await fetch(USER_INFO_URL);
      const allUsersData = await usersResponse.json();

      // البحث عن المستخدم الحالي في البيانات
      const currentUserData = allUsersData.find(user => user.guid === currentUser.guid);
      
      if (currentUserData && currentUserData.branchForWork) {
        setUserBranch(currentUserData.branchForWork);
        
        // جلب موظف الشهر لفرع المستخدم الحالي
        await fetchWinnerForBranch(currentUserData.branchForWork, allUsersData);
      } else {
        console.error("Current user branch not found");
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  };

  // ✅ جلب موظف الشهر للفرع المحدد
  const fetchWinnerForBranch = async (branchGuid, allUsersData) => {
    try {
      // جلب جميع موظفي الشهر
      const response = await fetch(`${API_BASE_URL}?action=get_employees_of_month`);
      const allWinners = await response.json();
      
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      // تصفية الفائزين للشهر الحالي
      const currentMonthWinners = allWinners.filter(
        winner => 
          winner.selected_month === currentMonth && 
          winner.selected_year === currentYear
      );

      if (currentMonthWinners.length === 0) {
        console.log("No winners found for current month");
        return;
      }

      // الحصول على GUIDs للمستخدمين في نفس الفرع
      const branchUserGuids = allUsersData
        .filter(user => user.branchForWork === branchGuid)
        .map(user => user.guid);

      // البحث عن فائز من بين مستخدمي الفرع
      const branchWinner = currentMonthWinners.find(winner =>
        branchUserGuids.includes(winner.employee_guid)
      );

      if (branchWinner) {
        // العثور على بيانات المستخدم الكاملة للفائز
        const winnerUserData = allUsersData.find(user => user.guid === branchWinner.employee_guid);
        
        if (winnerUserData) {
          // دمج بيانات الفائز مع بيانات المستخدم
          const enrichedEmployee = {
            ...branchWinner,
            employee_name: winnerUserData.fullName || branchWinner.employee_name,
            branch_name: winnerUserData.branchForWork
          };
          
          setEmployee(enrichedEmployee);
          setOpen(true);
        } else {
          setEmployee(branchWinner);
          setOpen(true);
        }
      } else {
        console.log("No winner found for current user's branch");
      }
    } catch (error) {
      console.error("Error fetching winner:", error);
    }
  };

  const enableAudio = async () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContext();
      
      const source = audioContext.createBufferSource();
      source.buffer = audioContext.createBuffer(1, 1, 22050);
      source.connect(audioContext.destination);
      source.start();
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      setAudioEnabled(true);
    } catch (error) {
      console.log("Audio context failed:", error);
      setShowAudioPrompt(true);
    }
  };

  const handleEnableAudio = () => {
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        setAudioEnabled(true);
        setShowAudioPrompt(false);
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }).catch(error => {
        console.log("Manual audio play failed:", error);
      });
    }
  };

  useEffect(() => {
    if (open && audioRef.current && audioEnabled) {
      setTimeout(() => {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch((error) => {
          console.log("Failed to play audio automatically:", error);
          setShowAudioPrompt(true);
        });
      }, 500);
    }
  }, [open, audioEnabled]);

  if (!employee) return null;

  return (
    <>
      <Dialog sx={uiLayout.dialogLayoutSx}
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            background: "transparent",
            boxShadow: "none",
            overflow: "visible",
          },
        }}
      >
        <Confetti width={typeof window !== 'undefined' ? window.innerWidth : 0} height={typeof window !== 'undefined' ? window.innerHeight : 0} />

        <motion.div
          initial={{ y: -800, opacity: 0, scale: 0.7 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 60,
            damping: 15,
            duration: 2.5,
          }}
          style={{ width: '100%' }}
        >
          <Card
            sx={{
              width: { xs: 'calc(100vw - 24px)', sm: '88vw' },
              maxWidth: '900px',
              textAlign: 'center',
              p: { xs: 2.25, sm: 4, md: 6 },
              pt: { xs: 6.5, sm: 7, md: 8 },
              borderRadius: 7,
              background: "linear-gradient(135deg, #FFD700, #FFA500, #FF6B00)",
              position: "relative",
              color: "white",
              mx: "auto",
              boxShadow: "0 20px 80px rgba(0,0,0,0.7)",
              border: "5px solid rgba(255,255,255,0.8)",
              overflow: "hidden",
            }}
          >
            <IconButton
              onClick={() => setOpen(false)}
              sx={{
                position: "absolute",
                top: 15,
                right: 15,
                color: "white",
                backgroundColor: "rgba(0,0,0,0.3)",
                "&:hover": { backgroundColor: "rgba(0,0,0,0.5)" },
              }}
            >
              <Close />
            </IconButton>

            {!audioEnabled && (
              <IconButton
                onClick={handleEnableAudio}
                sx={{
                  position: "absolute",
                  top: 15,
                  left: 15,
                  color: "white",
                  backgroundColor: "rgba(0,0,0,0.3)",
                  "&:hover": { backgroundColor: "rgba(0,0,0,0.5)" },
                }}
              >
                <VolumeUp />
              </IconButton>
            )}

            <Typography
              variant="h3"
              sx={{
                color: "#fff",
                fontWeight: "bold",
                letterSpacing: { xs: '0', sm: '1px', md: '2px' },
                fontSize: { xs: '1.65rem', sm: '2.35rem', md: '3rem' },
                textShadow:
                  "0 0 30px rgba(0,0,0,0.5), 0 0 15px rgba(255,255,255,0.9)",
                mb: 4,
              }}
            >
              🏆 موظف(ة) الشهر 🏆
            </Typography>

            <motion.div
              animate={{ y: [0, -15, 0], rotate: [0, 6, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <EmojiEvents
                sx={{
                  fontSize: { xs: 72, sm: 96, md: 120 },
                  color: "#FFF",
                  textShadow: "0 0 35px rgba(255,255,255,0.9)",
                  mb: 2,
                }}
              />
            </motion.div>

            <Avatar
              src={`${IMAGE_API_URL}?action=get&userGuid=${employee.employee_guid}`}
              sx={{
                width: { xs: 120, sm: 160, md: 200 },
                height: { xs: 120, sm: 160, md: 200 },
                mx: "auto",
                my: 3,
                border: "7px solid #fff",
                boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
              }}
            />

            <Typography
              variant="h4"
              sx={{
                fontWeight: "bold",
                mb: 1,
                textShadow: "0 0 20px rgba(0,0,0,0.4)",
              }}
            >
              {employee.employee_name}
            </Typography>

            <Typography
              variant="h6"
              sx={{
                mb: 3,
                opacity: 0.95,
                maxWidth: "80%",
                mx: "auto",
                lineHeight: 1.7,
              }}
            >
              {employee.reason || "لجهوده المميزة وتفانيه في العمل 👏"}
            </Typography>

            <Typography
              variant="body1"
              sx={{
                opacity: 0.9,
                fontSize: "1.2rem",
                textShadow: "0 0 10px rgba(0,0,0,0.3)",
              }}
            >
              التقييم النهائي:{" "}
              <Box component="span" sx={{ fontWeight: "bold" }}>
                {employee.final_grade}
              </Box>{" "}
              | النتيجة:{" "}
              <Box component="span" sx={{ fontWeight: "bold" }}>
                {employee.total_score}%
              </Box>
            </Typography>
          </Card>
        </motion.div>
      </Dialog>
    </>
  );
};

export default EmployeeOfTheMonthDialog;