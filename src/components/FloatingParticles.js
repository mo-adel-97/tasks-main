import { adaptiveInlineStyle } from '../config/themeColors';
import React from "react";
import { Box } from "@mui/material";
import { motion } from "framer-motion";

const COLOR_SCHEME = {
  primaryLight: '#94c4ac'
};

const FloatingParticles = () => {
  return (
    <Box sx={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 0,
      overflow: 'hidden'
    }}>
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            scale: 0 
          }}
          animate={{ 
            y: [null, -100, -200],
            x: [null, Math.random() * 100 - 50],
            scale: [0, 1, 0],
            opacity: [0, 0.6, 0]
          }}
          transition={{
            duration: Math.random() * 3 + 2,
            repeat: Infinity,
            delay: Math.random() * 2
          }}
          style={adaptiveInlineStyle({
            position: 'absolute',
            width: 6,
            height: 6,
            background: COLOR_SCHEME.primaryLight,
            borderRadius: '50%',
            filter: 'blur(1px)'
          })}
        />
      ))}
    </Box>
  );
};

export default FloatingParticles;