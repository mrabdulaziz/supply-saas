'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  IconButton, Badge, Popover, Box, Typography, List, ListItem,
  ListItemAvatar, ListItemText, Avatar, Divider, Button, Chip, Tooltip
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import CancelIcon from '@mui/icons-material/Cancel';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { useNotificationStore } from '../../stores/notification.store';
import { useSocket } from '../../hooks/useSocket';
import { formatDistanceToNow } from 'date-fns';

const EVENT_CONFIG: Record<string, { icon: React.ElementType; color: string; bgcolor: string }> = {
  ORDER_SUBMITTED:  { icon: AssignmentTurnedInIcon, color: '#1B4FD8', bgcolor: '#EFF6FF' },
  ORDER_CONFIRMED:  { icon: CheckCircleOutlineIcon, color: '#D97706', bgcolor: '#FFFBEB' },
  ORDER_REJECTED:   { icon: CancelIcon,             color: '#DC2626', bgcolor: '#FEF2F2' },
  ORDER_IN_TRANSIT: { icon: LocalShippingIcon,      color: '#7C3AED', bgcolor: '#F5F3FF' },
  ORDER_DELIVERED:  { icon: CheckCircleOutlineIcon, color: '#059669', bgcolor: '#ECFDF5' },
};

export function NotificationBell() {
  useSocket();
  const { notifications, unreadCount, markRead, markAllRead } = useNotificationStore();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const router = useRouter();
  const count = unreadCount();

  const handleOpen = (e: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleClick = (n: any) => {
    markRead(n.id);
    handleClose();
    if (n.entityId) {
      const isSupplierEvent = ['ORDER_SUBMITTED'].includes(n.type);
      router.push(isSupplierEvent ? `/supplier/orders/${n.entityId}` : `/market/orders/${n.entityId}`);
    }
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton onClick={handleOpen} sx={{ color: 'text.secondary' }}>
          <Badge badgeContent={count} color="error" max={9}>
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: { width: 360, maxHeight: 480, borderRadius: 2, boxShadow: 4, mt: 0.5 },
        }}
      >
        {/* Header */}
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontSize: '0.9375rem' }}>Notifications</Typography>
            {count > 0 && <Chip label={count} size="small" color="error" sx={{ height: 18, fontSize: '0.6875rem' }} />}
          </Box>
          {count > 0 && (
            <Button size="small" startIcon={<DoneAllIcon fontSize="small" />} onClick={markAllRead} sx={{ fontSize: '0.75rem' }}>
              Mark all read
            </Button>
          )}
        </Box>

        {/* List */}
        {notifications.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <NotificationsIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">No notifications yet</Typography>
          </Box>
        ) : (
          <List disablePadding sx={{ maxHeight: 360, overflowY: 'auto' }}>
            {notifications.map((n, idx) => {
              const config = EVENT_CONFIG[n.type] || { icon: NotificationsIcon, color: '#64748B', bgcolor: '#F8FAFC' };
              const Icon = config.icon;
              return (
                <Box key={n.id}>
                  <ListItem
                    onClick={() => handleClick(n)}
                    sx={{
                      cursor: 'pointer', alignItems: 'flex-start', py: 1.5,
                      bgcolor: !n.isRead ? 'rgba(27,79,216,0.04)' : 'transparent',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <ListItemAvatar sx={{ mt: 0.25, minWidth: 44 }}>
                      <Avatar sx={{ width: 36, height: 36, bgcolor: config.bgcolor }}>
                        <Icon sx={{ fontSize: 18, color: config.color }} />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: !n.isRead ? 600 : 400, lineHeight: 1.4 }}>
                            {n.title}
                          </Typography>
                          {!n.isRead && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', mt: 0.5, flexShrink: 0 }} />}
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="caption" component="span" sx={{ display: 'block', color: 'text.secondary', lineHeight: 1.5 }}>
                            {n.body}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                  {idx < notifications.length - 1 && <Divider sx={{ mx: 2 }} />}
                </Box>
              );
            })}
          </List>
        )}
      </Popover>
    </>
  );
}
