'use client';
import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { marketsApi } from '../../../lib/api';
import { useAuthStore } from '../../../stores/auth.store';
import {
  Box, Grid, Card, CardContent, Typography, Button, Chip, Avatar,
  Alert, AlertTitle, Skeleton, alpha, Stack, Divider, LinearProgress,
  List, ListItem, ListItemAvatar, ListItemText, ListItemSecondaryAction,
  FormControl, InputLabel, Select, MenuItem, IconButton, Tooltip,
} from '@mui/material';
import StorefrontIcon from '@mui/icons-material/Storefront';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import BlockIcon from '@mui/icons-material/Block';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BadgeIcon from '@mui/icons-material/Badge';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { PageHeader } from '../../../components/ui/PageHeader';
import { useSnackbar } from 'notistack';

const DOC_TYPES = [
  { value: 'BUSINESS_LICENSE', label: 'Business License', desc: 'Official business registration certificate' },
  { value: 'TAX_CERTIFICATE', label: 'Tax Certificate', desc: 'Tax registration from authorities' },
  { value: 'ADDRESS_PROOF', label: 'Address Proof', desc: 'Document confirming business address' },
  { value: 'OWNER_ID', label: 'Owner ID', desc: 'National ID or passport of owner' },
  { value: 'OTHER', label: 'Other Document', desc: 'Any additional supporting document' },
] as const;

const REQUIRED_TYPES = ['BUSINESS_LICENSE', 'TAX_CERTIFICATE', 'ADDRESS_PROOF', 'OWNER_ID'];

const TYPE_LABELS: Record<string, string> = {
  BUSINESS_LICENSE: 'Business License',
  TAX_CERTIFICATE: 'Tax Certificate',
  ADDRESS_PROOF: 'Address Proof',
  OWNER_ID: 'Owner ID',
  OTHER: 'Other',
};

// ─── Upload Zone ───────────────────────────────────────────────

function UploadZone({ marketId, existingDocs }: { marketId: string; existingDocs: any[] }) {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const fileRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState<string>('BUSINESS_LICENSE');
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const uploadedTypes = new Set(existingDocs.map(d => d.type));

  const doUpload = async (file: File) => {
    if (!['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      enqueueSnackbar('Only PDF, JPG, PNG files are accepted', { variant: 'error' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      enqueueSnackbar('File must be under 10MB', { variant: 'error' });
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', docType);
      await marketsApi.uploadDocument(marketId, fd);
      qc.invalidateQueries({ queryKey: ['market-account', marketId] });
      enqueueSnackbar('Document uploaded successfully', { variant: 'success' });
    } catch (err: any) {
      enqueueSnackbar(err?.response?.data?.message || 'Upload failed', { variant: 'error' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" mb={0.5}>Upload Documents</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Required for account approval. Accepted formats: PDF, JPG, PNG (max 10MB).
        </Typography>

        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>Document Type</InputLabel>
          <Select label="Document Type" value={docType} onChange={e => setDocType(e.target.value)}>
            {DOC_TYPES.map(t => (
              <MenuItem key={t.value} value={t.value}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2">{t.label}</Typography>
                  {uploadedTypes.has(t.value) && <Chip label="Uploaded" size="small" color="success" sx={{ height: 18, fontSize: '0.65rem' }} />}
                </Box>
              </MenuItem>
            ))}
          </Select>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, px: 1 }}>
            {DOC_TYPES.find(t => t.value === docType)?.desc}
          </Typography>
        </FormControl>

        <Box
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) doUpload(f); }}
          onClick={() => !uploading && fileRef.current?.click()}
          sx={{
            border: `2px dashed ${dragOver ? '#1B4FD8' : '#CBD5E1'}`,
            borderRadius: 3, p: 4, textAlign: 'center',
            cursor: uploading ? 'default' : 'pointer',
            bgcolor: dragOver ? alpha('#1B4FD8', 0.04) : '#FAFAFA',
            transition: 'all 0.2s',
            '&:hover': !uploading ? { borderColor: '#1B4FD8', bgcolor: alpha('#1B4FD8', 0.03) } : {},
          }}
        >
          {uploading ? (
            <Box>
              <Typography variant="body2" color="text.secondary" mb={1}>Uploading…</Typography>
              <LinearProgress sx={{ borderRadius: 2 }} />
            </Box>
          ) : (
            <>
              <CloudUploadIcon sx={{ fontSize: 40, color: dragOver ? 'primary.main' : '#CBD5E1', mb: 1 }} />
              <Typography variant="body2" fontWeight={600} color={dragOver ? 'primary.main' : 'text.secondary'}>
                Drop file here or click to browse
              </Typography>
              <Typography variant="caption" color="text.disabled">PDF, JPG or PNG · max 10 MB</Typography>
            </>
          )}
        </Box>
        <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) doUpload(f); e.target.value = ''; }} />
      </CardContent>
    </Card>
  );
}

// ─── Account Page ──────────────────────────────────────────────

export default function MarketAccountPage() {
  const { user } = useAuthStore();
  const marketId = user?.marketId;

  const { data: market, isLoading } = useQuery({
    queryKey: ['market-account', marketId],
    queryFn: () => marketsApi.get(marketId!).then(r => r.data.data),
    enabled: !!marketId,
  });

  if (isLoading) return (
    <Box sx={{ p: 3 }}>
      <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 3, mb: 2 }} />
      <Grid container spacing={3}>
        <Grid item xs={12} md={5}><Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} /></Grid>
        <Grid item xs={12} md={7}><Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} /></Grid>
      </Grid>
    </Box>
  );

  if (!market) return null;

  const uploadedTypes = new Set((market.documents || []).map((d: any) => d.type));
  const uploadedRequired = REQUIRED_TYPES.filter(t => uploadedTypes.has(t)).length;
  const progress = Math.round((uploadedRequired / REQUIRED_TYPES.length) * 100);

  const STATUS_MAP: Record<string, { label: string; color: 'warning' | 'success' | 'error'; icon: any; msg: string }> = {
    PENDING: {
      label: 'Pending Review',
      color: 'warning',
      icon: <HourglassEmptyIcon />,
      msg: `Your account is under review. Upload all required documents to speed up approval. (${uploadedRequired}/${REQUIRED_TYPES.length} uploaded)`,
    },
    APPROVED: {
      label: 'Approved',
      color: 'success',
      icon: <CheckCircleIcon />,
      msg: market.approvedBy ? `Approved by ${market.approvedBy.username}` : 'Your account is active and approved.',
    },
    SUSPENDED: {
      label: 'Suspended',
      color: 'error',
      icon: <BlockIcon />,
      msg: market.notes ? `Reason: ${market.notes}` : 'Your account has been suspended. Contact support.',
    },
  };

  const statusInfo = STATUS_MAP[market.status] || STATUS_MAP['PENDING'];

  const infoRows = [
    { icon: <StorefrontIcon fontSize="small" />, label: 'Market Name', value: market.name },
    { icon: <LocationOnIcon fontSize="small" />, label: 'Address', value: market.address },
    { icon: <PhoneIcon fontSize="small" />, label: 'Phone', value: market.phone },
    { icon: <EmailIcon fontSize="small" />, label: 'Email', value: market.email || '—' },
    { icon: <BadgeIcon fontSize="small" />, label: 'Tax ID', value: market.taxId || '—' },
  ];

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <PageHeader
        title="My Account"
        subtitle="Market profile, status, and documents"
        breadcrumbs={[{ label: 'Dashboard', href: '/market/dashboard' }, { label: 'Account' }]}
      />

      <Alert severity={statusInfo.color} icon={statusInfo.icon}
        sx={{ mb: 3, borderRadius: 3, '& .MuiAlert-icon': { alignItems: 'center' } }}>
        <AlertTitle sx={{ fontWeight: 700 }}>{statusInfo.label}</AlertTitle>
        {statusInfo.msg}
        {market.status === 'PENDING' && (
          <Box sx={{ mt: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" fontWeight={600}>Document progress</Typography>
              <Typography variant="caption">{uploadedRequired}/{REQUIRED_TYPES.length} required</Typography>
            </Box>
            <LinearProgress variant="determinate" value={progress} color="warning" sx={{ borderRadius: 2, height: 6 }} />
          </Box>
        )}
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Stack spacing={3}>
            {/* Profile card */}
            <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Avatar sx={{ width: 56, height: 56, bgcolor: alpha('#1B4FD8', 0.1), color: 'primary.main', fontWeight: 800, fontSize: '1.4rem', borderRadius: 3 }}>
                    {market.name[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>{market.name}</Typography>
                    <Chip label={statusInfo.label} color={statusInfo.color} size="small" sx={{ mt: 0.25 }} />
                  </Box>
                </Box>
                <Stack spacing={0}>
                  {infoRows.map((row, i) => (
                    <Box key={row.label}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 1.25 }}>
                        <Box sx={{ color: 'text.disabled', mt: 0.1, flexShrink: 0 }}>{row.icon}</Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">{row.label}</Typography>
                          <Typography variant="body2" fontWeight={500}>{row.value}</Typography>
                        </Box>
                      </Box>
                      {i < infoRows.length - 1 && <Divider />}
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            {/* Doc checklist */}
            <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3 }}>
              <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Documents</Typography>
                <Chip label={`${uploadedRequired} / ${REQUIRED_TYPES.length} required`}
                  color={uploadedRequired === REQUIRED_TYPES.length ? 'success' : 'warning'} size="small" />
              </Box>
              <List dense disablePadding>
                {REQUIRED_TYPES.map((type, i) => {
                  const uploaded = uploadedTypes.has(type);
                  const doc = market.documents?.find((d: any) => d.type === type);
                  return (
                    <Box key={type}>
                      <ListItem sx={{ px: 3, py: 1.25 }}>
                        <ListItemAvatar sx={{ minWidth: 40 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: uploaded ? alpha('#059669', 0.1) : '#F1F5F9', borderRadius: 1.5 }}>
                            {uploaded
                              ? <CheckCircleIcon sx={{ fontSize: 16, color: '#059669' }} />
                              : <InsertDriveFileIcon sx={{ fontSize: 16, color: '#94A3B8' }} />}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={<Typography variant="body2" fontWeight={600}>{TYPE_LABELS[type]}</Typography>}
                          secondary={doc
                            ? <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 160, display: 'block' }}>{doc.originalName}</Typography>
                            : <Typography variant="caption" color="text.disabled">Not uploaded</Typography>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Chip label={uploaded ? 'Done' : 'Missing'} color={uploaded ? 'success' : 'default'}
                            size="small" variant={uploaded ? 'filled' : 'outlined'} />
                        </ListItemSecondaryAction>
                      </ListItem>
                      {i < REQUIRED_TYPES.length - 1 && <Divider component="li" sx={{ ml: 8 }} />}
                    </Box>
                  );
                })}
              </List>
              {market.documents?.filter((d: any) => !REQUIRED_TYPES.includes(d.type)).map((doc: any) => (
                <Box key={doc.id}>
                  <Divider />
                  <ListItem sx={{ px: 3, py: 1.25 }}>
                    <ListItemAvatar sx={{ minWidth: 40 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: alpha('#1B4FD8', 0.08), borderRadius: 1.5 }}>
                        <InsertDriveFileIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={<Typography variant="body2" fontWeight={600}>{TYPE_LABELS[doc.type] || doc.type}</Typography>}
                      secondary={<Typography variant="caption" color="text.secondary" noWrap>{doc.originalName}</Typography>}
                    />
                    <ListItemSecondaryAction>
                      <Chip label="Extra" size="small" color="info" variant="outlined" />
                    </ListItemSecondaryAction>
                  </ListItem>
                </Box>
              ))}
            </Card>
          </Stack>
        </Grid>

        <Grid item xs={12} md={7}>
          <UploadZone marketId={market.id} existingDocs={market.documents || []} />
        </Grid>
      </Grid>
    </Box>
  );
}
