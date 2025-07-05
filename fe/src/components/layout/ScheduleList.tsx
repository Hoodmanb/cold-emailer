'use client';

import React, { useState } from 'react';
import {
    Box,
    Typography,
    Stack,
} from '@mui/material';
import { PlusIcon } from 'lucide-react';
import ScheduleCard from './ScheduleCard';
import CustomButton from '../ui/Button';
import CreateSchedule from './CreateSchedule';
import { useGlobalModal } from '../ui/Modal';

const SchedulesList: React.FC = () => {
    const { showModal } = useGlobalModal()
    const [refresh, setRefresh] = useState(false)

    const [upcomingSchedules, setUpcomingSchedules] = useState([
        {
            id: '1',
            name: 'Tech Companies Outreach',
            template: 'Job Application Template',
            recipients: 45,
            frequency: 'weekly',
            nextRun: '2024-01-15T10:00:00Z',
            status: 'active' as const,
        },
        {
            id: '2',
            name: 'Follow-up Campaign',
            template: 'Follow-up Template',
            recipients: 23,
            frequency: 'monthly',
            nextRun: '2024-01-20T14:30:00Z',
            status: 'paused' as const,
        },
        {
            id: '3',
            name: 'Startup Outreach',
            template: 'Startup Template',
            recipients: 67,
            frequency: 'weekly',
            nextRun: '2024-01-18T09:15:00Z',
            status: 'active' as const,
        },
    ]);


    const handleToggleStatus = (id: string) => {
        setUpcomingSchedules((prev) =>
            prev.map((schedule) =>
                schedule.id === id
                    ? {
                        ...schedule,
                        status: schedule.status === 'active' ? 'paused' : 'active',
                    }
                    : schedule
            )
        );
    };

    const handleEdit = (id: string) => {
        console.log('Edit schedule:', id);
    };

    const handleDelete = (id: string) => {
        setUpcomingSchedules((prev) => prev.filter((schedule) => schedule.id !== id));
    };

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>

                <Typography color="text.secondary">
                    Manage your automated email campaigns
                </Typography>
                <Box>
                    <CustomButton
                        text="Create Schedule"
                        icon={PlusIcon}
                        iconColor="grey"
                        onClick={() =>
                            showModal(<CreateSchedule type={"add"} setRefresh={setRefresh} />)
                        }
                    />
                </Box>
            </Stack>


            <Box sx={{ overflowX: 'auto' }}>
                <Box
                    display="flex"
                    flexDirection="column"
                    minWidth="600px"
                    gap={2}
                >
                    {upcomingSchedules.map((schedule) => (
                        <ScheduleCard
                            key={schedule.id}
                            schedule={schedule}
                            onToggleStatus={handleToggleStatus}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ))}
                </Box>
            </Box>

        </Box>
    );
};

export default SchedulesList;
