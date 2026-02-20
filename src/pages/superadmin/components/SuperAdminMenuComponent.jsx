import React from 'react';
import {
    Dashboard as DashboardIcon,
    People as PeopleIcon,
    AccountCircle as AccountIcon,
    Description as FormIcon,
    LockOutlined as PasswordFormatterIcon,
} from '@mui/icons-material';

export const SuperAdminMenuComponent = ({ onMenuItemClick }) => {
    const menuItems = [
        // Main Section
        {
            sectionName: 'Main',
            items: [
                {
                    text: 'Dashboard',
                    icon: <DashboardIcon />,
                    path: '/superadmin-dashboard'
                },
                {
                    text: 'Users',
                    icon: <PeopleIcon />,
                    path: '/superadmin-dashboard/users'
                },
            ]
        },

        // System & Configuration Section
        {
            sectionName: 'System & Configuration',
            items: [
                {
                    text: 'Forms',
                    icon: <FormIcon />,
                    path: '/superadmin-dashboard/forms'
                },
                {
                    text: 'Password Formatters',
                    icon: <PasswordFormatterIcon />,   // ← distinct icon
                    path: '/superadmin-dashboard/password-formatters'
                },
                {
                    text: 'Phone Credential ',
                    icon: <PasswordFormatterIcon />,   // ← distinct icon
                    path: '/superadmin-dashboard/phone-credential'
                },
            ]
        },

        // Profile Section
        {
            sectionName: 'Profile',
            items: [
                {
                    text: 'My Profile',
                    icon: <AccountIcon />,
                    path: '/superadmin-dashboard/profile'
                },
            ]
        },
    ];

    // Process menu items to add click handlers
    const processedMenuItems = menuItems.map(section => {
        const processedItems = section.items.map(item => ({
            ...item,
            onClick: () => onMenuItemClick(item.path)
        }));

        return {
            ...section,
            items: processedItems
        };
    });

    return processedMenuItems;
};