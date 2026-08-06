import { styled } from "@mui/system";
import { Button } from "@mui/material";

const ErrorButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(45deg, #f44336, #d32f2f)',
  color: 'white',
  fontWeight: 600,
  letterSpacing: '0.5px',
  padding: '14px 28px',
  borderRadius: '10px',
  fontSize: '16px',
  boxShadow: '0 4px 8px rgba(244, 67, 54, 0.2)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 16px rgba(244, 67, 54, 0.3)',
    background: 'linear-gradient(45deg, #e53935, #c62828)'
  }
}));

export default ErrorButton;