import React from 'react';
import {
    Card,
    CardHeader,
    CardContent,
    Typography,
    Chip,
    IconButton,
    Button,
    Box,
    Stack,
    Divider,
} from '@mui/material';
import {
    Play,
    Pause,
    Edit,
    Trash2,
    Calendar,
    Users,
    Mail,
} from 'lucide-react';
import { onBackgroundMessage } from 'firebase/messaging/sw';

interface ScheduleCardProps {
    schedule: {
        id: string;
        name: string;
        template: string;
        recipients: number;
        frequency: string;
        nextRun?: string;
        lastRun?: string;
        status: 'active' | 'paused' | 'completed';
        sent?: number;
        failed?: number;
    };
    onToggleStatus?: (id: string) => void;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
}

const ScheduleCard: React.FC<ScheduleCardProps> = ({
    schedule,
    onToggleStatus,
    onEdit,
    onDelete,
}) => {
    const getStatusColor = (status: string) => {
        const colors = {
            active: 'green',
            paused: 'gold',
            completed: 'blue',
        } as const;
        return colors[status as keyof typeof colors] || 'gray';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <Card sx={{ '&:hover': { boxShadow: 4 }, transition: 'box-shadow 0.3s' }} >
            <CardHeader
                title={
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Box
                            sx={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                backgroundColor: getStatusColor(schedule.status),
                            }}
                        />
                        <Typography variant="h6" fontSize={"0.6em"}>{schedule.name}</Typography>
                        <Chip label={schedule.frequency} size="small" variant="outlined" sx={{ textTransform: 'capitalize' }} />
                    </Stack>
                }
                action={
                    <Stack direction="row" spacing={1}>
                        {onToggleStatus && (
                            <Button
                                size="small"
                                variant="outlined"
                                sx={{ borderColor: "#ccc", textTransform: "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                                onClick={() => onToggleStatus(schedule.id)}
                                startIcon={schedule.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
                            >
                                {schedule.status === 'active' ? 'pause' : 'resume'}
                            </Button>
                        )}
                        {onEdit && (
                            <IconButton onClick={() => onEdit(schedule.id)}>
                                <Edit size={15} />
                            </IconButton>
                        )}
                        {onDelete && (
                            <IconButton onClick={() => onDelete(schedule.id)}>
                                <Trash2 size={15} />
                            </IconButton>
                        )}
                    </Stack>
                }
            />
            <CardContent>
                <Stack direction={{ xs: 'row', md: 'row' }} justifyContent={"space-between"}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Mail size={18} />
                        <Box>
                            <Typography variant="caption" color="text.secondary">Template (4)</Typography>
                        </Box>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Users size={18} />
                        <Box>
                            <Typography variant="caption" color="text.secondary">Recipients({schedule.recipients})</Typography>
                        </Box>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Calendar size={18} />
                        <Box>
                            <Typography variant="caption" color="text.secondary">
                                {schedule.nextRun ? 'Next Run:' : 'Last Run:'}
                            </Typography>
                            <Typography variant="caption" fontSize={"0.6em"}>
                                {formatDate(schedule.nextRun || schedule.lastRun || '')}
                            </Typography>
                        </Box>
                    </Stack>
                </Stack>

                {(schedule.sent !== undefined && schedule.failed !== undefined) && (
                    <>
                        <Divider sx={{ my: 2 }} />
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Stack direction="row" spacing={3}>
                                <Typography variant="body2" color="green">
                                    Sent: <strong>{schedule.sent}</strong>
                                </Typography>
                                <Typography variant="body2" color="error">
                                    Failed: <strong>{schedule.failed}</strong>
                                </Typography>
                            </Stack>
                            <Chip
                                label={schedule.status}
                                color={
                                    schedule.status === 'completed' ? 'default' : 'secondary'
                                }
                                size="small"
                            />
                        </Stack>
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default ScheduleCard;
