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
  borderRadius: `${designTokens.radius}px`,
  boxShadow: '0 6px 18px rgba(0, 0, 0, 0.07)',
  background: 'linear-gradient(145deg, #ffffff, #f8f9fa)',
  border: '1px solid rgba(0, 0, 0, 0.05)',
  transition: 'box-shadow 0.2s ease',
  '&:hover': {
    boxShadow: '0 8px 22px rgba(0, 0, 0, 0.10)'
  }
}));

export default ProfessionalCard;
