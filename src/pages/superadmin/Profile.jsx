import React from 'react';
import { ProfilePage } from '../../components/ProfilePage';
import { Box } from '@mui/material'; // Changed from lucide-react to @mui/material
import { Helmet } from 'react-helmet-async';

export const SuperAdminProfile = () => {
    return (
        <Box>
            <Helmet>
                <title>Super Admin Profile | Power Automate</title>
                <meta name="description" content="Super administrator profile management dashboard" />
            </Helmet>
            <ProfilePage roleLabel="Super Admin" />
        </Box>
    )
};