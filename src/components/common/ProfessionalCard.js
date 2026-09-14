import { styled } from "@mui/system";
import { Card } from "@mui/material";
import { designTokens } from '../../config/designTokens';

const ProfessionalCard = styled(Card)(() => ({
  width: '100%',
  maxWidth: '950px',
  margin: '0 auto',
  padding: designTokens.cardPadding,
  minWidth: 0,
  boxSizing: 'border-box',
  borderRadius: '16px',
  boxShadow: '0 12px 35px rgba(0, 0, 0, 0.1)',
  background: 'linear-gradient(145deg, #ffffff, #f8f9fa)',
  border: '1px solid rgba(0, 0, 0, 0.05)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 15px 40px rgba(0, 0, 0, 0.15)'
  }
}));

export default ProfessionalCard;
