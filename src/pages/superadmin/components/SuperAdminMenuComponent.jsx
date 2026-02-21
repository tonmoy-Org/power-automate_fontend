import React from 'react';
import {
    Dashboard as DashboardIcon,
    People as PeopleIcon,
    AccountCircle as AccountIcon,
    Description as FormIcon,
    LockOutlined as PasswordFormatterIcon,
    PhoneIphone as PhoneIcon,
    VpnKey as VpnKeyIcon,
} from '@mui/icons-material';

export const SuperAdminMenuComponent = ({ onMenuItemClick }) => {
    const menuItems = [
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
        {
            sectionName: 'System & Configuration',
            items: [
                {
                    text: 'Password Formatters',
                    icon: <PasswordFormatterIcon />,
                    path: '/superadmin-dashboard/password-formatters'
                },
                {
                    text: 'Phone Numbers',
                    icon: <PhoneIcon />,
                    path: '/superadmin-dashboard/phone-numbers'
                },
                {
                    text: 'Valid Phone & Password',
                    icon: <VpnKeyIcon />,
                    path: '/superadmin-dashboard/valid-phone-password'
                },
            ]
        },
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

    return menuItems.map(section => ({
        ...section,
        items: section.items.map(item => ({
            ...item,
            onClick: () => onMenuItemClick(item.path)
        }))
    }));
};