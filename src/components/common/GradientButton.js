import { styled } from "@mui/system";
import { Button } from "@mui/material";
import { designTokens } from '../../config/designTokens';

const GradientButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(45deg, #1976d2, #2196f3)',
  color: 'white',
  fontWeight: 600,
  letterSpacing: '0.5px',
  padding: '5px 12px',
  minHeight: designTokens.controlHeight,
  borderRadius: `${designTokens.radius}px`,
  fontSize: designTokens.typography.control,
  boxShadow: '0 4px 8px rgba(25, 118, 210, 0.2)',
  transition: 'box-shadow 0.2s ease',
  '&:hover': {
    boxShadow: '0 6px 12px rgba(25, 118, 210, 0.24)',
    background: 'linear-gradient(45deg, #1565c0, #1e88e5)'
  }
}));

export default GradientButton;