import { styled } from "@mui/system";
import { Button } from "@mui/material";

const GradientButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(45deg, #1976d2, #2196f3)',
  color: 'white',
  fontWeight: 600,
  letterSpacing: '0.5px',
  padding: '14px 28px',
  borderRadius: '10px',
  fontSize: '16px',
  boxShadow: '0 4px 8px rgba(25, 118, 210, 0.2)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 16px rgba(25, 118, 210, 0.3)',
    background: 'linear-gradient(45deg, #1565c0, #1e88e5)'
  }
}));

export default GradientButton;