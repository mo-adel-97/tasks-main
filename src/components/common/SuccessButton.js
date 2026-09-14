import { styled } from "@mui/system";
import { Button } from "@mui/material";
import { designTokens } from '../../config/designTokens';

const SuccessButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(45deg, #4caf50, #2e7d32)',
  color: 'white',
  fontWeight: 600,
  letterSpacing: '0.5px',
  padding: '5px 12px',
  minHeight: designTokens.controlHeight,
  borderRadius: `${designTokens.radius}px`,
  fontSize: designTokens.typography.control,
  boxShadow: '0 4px 8px rgba(76, 175, 80, 0.2)',
  transition: 'box-shadow 0.2s ease',
  '&:hover': {
    boxShadow: '0 6px 12px rgba(76, 175, 80, 0.24)',
    background: 'linear-gradient(45deg, #388e3c, #1b5e20)'
  }
}));

export default SuccessButton;