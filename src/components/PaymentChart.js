import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell } from 'recharts';
import { Box, Typography, Button } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import cat from '../images/MV5K-unscreen.gif';
import { useNavigate } from 'react-router-dom';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';

const TrainerCollectionRate = ({ rows }) => {
  const navigate = useNavigate();

  const totalStudents = rows.length;
  // Calculate number of students who paid (monthpay > 0)
  const paidStudents = rows.filter(row => Number(row.monthpay) > 0).length;
  // Calculate percentage (handle case when totalStudents is 0 to avoid division by zero)
  const percent = totalStudents > 0 ? Math.round((paidStudents / totalStudents) * 100) : 0;
  
  const currentTotal = rows.reduce((sum, row) => sum + (Number(row.commission) || 0), 0);

  const [animateMoney, setAnimateMoney] = useState(false);

  useEffect(() => {
    setAnimateMoney(true);
    const timer = setTimeout(() => setAnimateMoney(false), 1000);
    return () => clearTimeout(timer);
  }, [currentTotal]);

  const data = [
    { name: 'تحصيل', value: percent },
    { name: 'غير محصل', value: 100 - percent }
  ];

  const COLORS = ['#4caf50', '#eeeeee'];

  const getMotivationalMessage = (p) => {
    if (p < 10) return "يلا نبدأ، الطريق طويل!";
    if (p < 20) return "ممتاز، قربت تكمل 20%!";
    if (p < 30) return "🔥 لقد تخطيت 20%! استمر!";
    if (p < 50) return "نصف الطريق اقترب! 👏";
    if (p < 80) return "أداء رائع! 💪";
    if (p < 100) return "انت على وشك الإتمام! 🙌";
    return "مبروك! أنهيت التحصيل! 🏆";
  };

  return (
    <Box mt={4}>
      {/* Back Button with improved styling */}
      <Button 
        variant="contained"
        startIcon={<ArrowBackIosIcon />}
        onClick={() => navigate('/dashboard')}
        sx={{
          backgroundColor: '#3f51b5',
          color: 'white',
          borderRadius: '8px',
          padding: '8px 16px',
          marginBottom: '16px',
          '&:hover': {
            backgroundColor: '#303f9f',
          },
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          textTransform: 'none',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        رجوع
      </Button>

      <Typography style={{ textAlign: "right" }} variant="h6" gutterBottom>
        نسبة تحصيلك
      </Typography>

      <Box display="flex" justifyContent="space-between" flexWrap="wrap" gap={2}>
        {/* PieChart Section */}
        <Box textAlign="center">
          <PieChart width={180} height={180}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Pie>
            <text
              x="50%"
              y="50%"
              dominantBaseline="middle"
              textAnchor="middle"
              fill="#333"
              fontSize={20}
              fontWeight={600}
            >
              {percent}%
            </text>
          </PieChart>
          <Typography variant="body2" color="textSecondary">
            {paidStudents} / {totalStudents} طلاب
          </Typography>
        </Box>

        {/* Motivational Cat Section */}
        <Box textAlign="center" alignSelf="center">
          <Box
            sx={{
              width: 170,
            }}
          >
            <img
              src={cat}
              alt="cat gif"
              style={{
                width: '130px',
                height: 'auto',
              }}
            />
          </Box>
          <Typography fontSize={13} color="text.secondary" fontWeight="bold">
            {getMotivationalMessage(percent)}
          </Typography>
        </Box>

        {/* 💰 Commission Box */}
        <Box display="flex" justifyContent="end" alignItems="center">
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            backgroundColor: '#e8f5e9',
            border: '1px solid #c8e6c9',
            borderRadius: '16px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            minWidth: '280px',
          }}>
            <motion.div animate={animateMoney ? { scale: [1, 1.3, 1] } : {}} transition={{ duration: 0.6 }}>
              <motion.h3
                style={{ fontSize: "40px", marginRight: "10px", display: "inline-block" }}
                animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                💰
              </motion.h3>
            </motion.div>
            <Box>
              <Typography fontSize={14} color="textSecondary">عــــمــولـــتــي</Typography>
              <AnimatePresence>
                <motion.div
                  key={currentTotal}
                  initial={{ opacity: 0, y: -20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                >
                  <Typography fontSize={18} fontWeight="bold" color="#2e7d32">
                    {currentTotal.toLocaleString()} ﷼
                  </Typography>
                </motion.div>
              </AnimatePresence>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default TrainerCollectionRate;