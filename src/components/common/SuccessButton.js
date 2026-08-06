import { styled } from "@mui/system";
import { Button } from "@mui/material";

const SuccessButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(45deg, #4caf50, #2e7d32)',
  color: 'white',
  fontWeight: 600,
  letterSpacing: '0.5px',
  padding: '14px 28px',
  borderRadius: '10px',
  fontSize: '16px',
  boxShadow: '0 4px 8px rgba(76, 175, 80, 0.2)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 16px rgba(76, 175, 80, 0.3)',
    background: 'linear-gradient(45deg, #388e3c, #1b5e20)'
  }
}));

export default SuccessButton;