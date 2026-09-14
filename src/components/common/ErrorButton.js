import { styled } from "@mui/system";
import { Button } from "@mui/material";
import { designTokens } from '../../config/designTokens';

const ErrorButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(45deg, #f44336, #d32f2f)',
  color: 'white',
  fontWeight: 600,
  letterSpacing: '0.5px',
  padding: '5px 12px',
  minHeight: designTokens.controlHeight,
  borderRadius: `${designTokens.radius}px`,
  fontSize: designTokens.typography.control,
  boxShadow: '0 4px 8px rgba(244, 67, 54, 0.2)',
  transition: 'box-shadow 0.2s ease',
  '&:hover': {
    boxShadow: '0 6px 12px rgba(244, 67, 54, 0.24)',
    background: 'linear-gradient(45deg, #e53935, #c62828)'
  }
}));

export default ErrorButton;