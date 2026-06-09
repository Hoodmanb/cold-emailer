import React from 'react';
import {
    Box,
    Card,
    CardContent,
    CardHeader,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Stack,
} from '@mui/material';
import { Calendar, TrendingUp, TrendingDown } from 'lucide-react';

interface ScheduleHistoryProps {
    schedules: Array<{
        id: string;
        name: string;
        template: string;
        recipients: number;
        lastRun: string;
        status: string;
        sent: number;
        failed: number;
    }>;
}

import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";

interface ExecutionRecord {
    id: string;
    scheduleId: string;
    status: string;
    executedAt: string;
    recipientCount: number;
    error?: string;
}

const fetchHistory = async (): Promise<ExecutionRecord[]> => {
    const res = await apiClient.get('/api/scheduler/history');
    return res.data?.data ?? [];
};

const ScheduleHistory = () => {
    const { data: executions = [] } = useQuery<ExecutionRecord[]>({
        queryKey: ['scheduleHistory'],
        queryFn: fetchHistory,
    });

    const schedules = executions.map((e) => ({
        id: e.id,
        name: `Execution ${e.id}`,
        template: `Schedule ${e.scheduleId}`,
        recipients: e.recipientCount,
        frequency: 'once',
        lastRun: e.executedAt,
        status: e.status,
        sent: e.status === 'completed' ? e.recipientCount : 0,
        failed: e.status === 'failed' ? e.recipientCount : 0,
    }));

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getSuccessRate = (sent: number, failed: number) => {
        const total = sent + failed;
        return total > 0 ? Math.round((sent / total) * 100) : 0;
    };

    const totalSent = schedules.reduce((sum, schedule) => sum + schedule.sent, 0);
    const totalFailed = schedules.reduce((sum, schedule) => sum + schedule.failed, 0);
    const overallSuccessRate = getSuccessRate(totalSent, totalFailed);

    return (
        <Box display="flex" flexDirection="column" gap={4}>
            {/* Summary Cards with Stack */}
            <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                alignItems="stretch"
            >
                <Card sx={{ flex: 1 }}>
                    <CardHeader
                        title="Total Sent"
                        action={<TrendingUp size={18} color="#4caf50" />}
                        sx={{ pb: 0 }}
                    />
                    <CardContent>
                        <Typography variant="h5" fontWeight="bold" color="success.main">
                            {totalSent}
                        </Typography>
                    </CardContent>
                </Card>

                <Card sx={{ flex: 1 }}>
                    <CardHeader
                        title="Total Failed"
                        action={<TrendingDown size={18} color="#f44336" />}
                        sx={{ pb: 0 }}
                    />
                    <CardContent>
                        <Typography variant="h5" fontWeight="bold" color="error.main">
                            {totalFailed}
                        </Typography>
                    </CardContent>
                </Card>

                <Card sx={{ flex: 1 }}>
                    <CardHeader
                        title="Success Rate"
                        action={<Calendar size={18} color="#888" />}
                        sx={{ pb: 0 }}
                    />
                    <CardContent>
                        <Typography variant="h5" fontWeight="bold">
                            {overallSuccessRate}%
                        </Typography>
                    </CardContent>
                </Card>
            </Stack>

            {/* Table */}
            <Card>
                <CardHeader title="Schedule History" />
                <CardContent>
                    <Box sx={{ overflowX: 'auto' }}>
                        <TableContainer component={Paper} sx={{ borderRadius: 2, minWidth: 800 }}>
                            <Table width={"800px"}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ width: '30%' }}>Campaign</TableCell>
                                        <TableCell sx={{ width: '30%' }}>Last Run</TableCell>
                                        <TableCell sx={{ width: '10%' }}>Recipients</TableCell>
                                        <TableCell sx={{ width: '10%' }}>Sent</TableCell>
                                        <TableCell sx={{ width: '10%' }}>Failed</TableCell>
                                        <TableCell sx={{ width: '10%' }}>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {schedules.map((schedule) => {
                                        const successRate = getSuccessRate(schedule.sent, schedule.failed);
                                        return (
                                            <TableRow key={schedule.id}>
                                                <TableCell sx={{ fontWeight: 500 }}>{schedule.name}</TableCell>
                                                <TableCell>{formatDate(schedule.lastRun)}</TableCell>
                                                <TableCell>{schedule.recipients}</TableCell>
                                                <TableCell sx={{ color: 'success.main' }}>{schedule.sent}</TableCell>
                                                <TableCell sx={{ color: 'error.main' }}>{schedule.failed}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        size="small"
                                                        label={schedule.status}
                                                        variant="outlined"
                                                        sx={{ textTransform: 'capitalize' }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default ScheduleHistory;
