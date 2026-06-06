import { Box, Typography, Button } from '@mui/material';

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <Box sx={{ py: 8, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
      <Box sx={{
        width: 72, height: 72, borderRadius: 4,
        bgcolor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1,
      }}>
        <Icon sx={{ fontSize: 34, color: '#94A3B8' }} />
      </Box>
      <Typography variant="h6" fontWeight={600} color="text.primary">{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 340 }}>{description}</Typography>
      {action && (
        <Button variant="contained" onClick={action.onClick} sx={{ mt: 2 }}>{action.label}</Button>
      )}
    </Box>
  );
}
