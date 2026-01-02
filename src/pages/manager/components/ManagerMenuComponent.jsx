import React from 'react';
import {
    Dashboard as DashboardIcon,
    People as PeopleIcon,
    Assignment as AssignmentIcon,
    AccountCircle as AccountIcon,
    Notifications as NotificationsIcon,
    HealthAndSafety as HealthIcon,
    Security as SecurityIcon,
    Schedule as ScheduleIcon,
    TrendingUp as PerformanceIcon,
    History as HistoryIcon,
    Description as FormIcon,
    MenuBook as CourseIcon,
    Task as TaskIcon,
    Visibility as ReviewIcon,
    CheckCircle as ApprovalIcon,
    Assessment as AssessmentIcon,
    PersonAdd as AssignIcon,
    DirectionsCar as VehicleIcon,
    Build as ToolsIcon,
    Map as LogisticsIcon,
    LocalShipping as DispatchIcon,
    RequestQuote as QuoteIcon,
    Inventory as InventoryIcon,
    Search as LookupIcon,
    ListAlt as ChecklistIcon,
    Engineering as RepairIcon,
    Star as ScorecardIcon,
    Book as LibraryIcon,
    Contacts as LeadsIcon,
    LocationOn as LocateIcon
} from '@mui/icons-material';

export const ManagerMenuComponent = ({ onMenuItemClick }) => {
    const menuItems = [

        // Dashboard & Overview
        {
            sectionName: 'Dashboard & Overview',
            items: [
                { text: 'Dashboard', icon: <DashboardIcon />, path: '/manager-dashboard' },
                { text: 'Overview', icon: <AssessmentIcon />, path: '/manager-dashboard/overview' },
                { text: 'Notifications', icon: <NotificationsIcon />, path: '/manager-dashboard/notifications' },
            ]
        },

        // Dispatch & Logistics
        {
            sectionName: 'Dispatch & Logistics',
            items: [
                { text: 'Dispatch', icon: <DispatchIcon />, path: '/manager-dashboard/dispatch' },
                { text: 'Logistics Map', icon: <LogisticsIcon />, path: '/manager-dashboard/logistics' },
                { text: 'Locates', icon: <LocateIcon />, path: '/manager-dashboard/locates' },
            ]
        },

        // Vehicles & Inventory
        {
            sectionName: 'Vehicles & Inventory',
            items: [
                { text: 'Vehicles & Tools', icon: <VehicleIcon />, path: '/manager-dashboard/vehicles' },
                { text: 'Inventory', icon: <InventoryIcon />, path: '/manager-dashboard/inventory' },
            ]
        },

        // Quotes & Leads
        {
            sectionName: 'Quotes & Leads',
            items: [
                { text: 'Quotes', icon: <QuoteIcon />, path: '/manager-dashboard/quotes' },
                { text: 'Leads', icon: <LeadsIcon />, path: '/manager-dashboard/leads' },
            ]
        },

        // Technician Management
        {
            sectionName: 'Technician Management',
            items: [
                { text: 'Technicians', icon: <PeopleIcon />, path: '/manager-dashboard/techs' },
                { text: 'Scheduling', icon: <ScheduleIcon />, path: '/manager-dashboard/techs/schedule' },
                { text: 'Performance', icon: <PerformanceIcon />, path: '/manager-dashboard/techs/performance' },
                { text: 'Tech History', icon: <HistoryIcon />, path: '/manager-dashboard/techs/history' },
            ]
        },

        // Installations & Repairs
        {
            sectionName: 'Installations & Repairs',
            items: [
                { text: 'Installation Checklists', icon: <ChecklistIcon />, path: '/manager-dashboard/installations' },
                { text: 'Tank Repairs', icon: <RepairIcon />, path: '/manager-dashboard/tank-repairs' },
            ]
        },

        // Reports & Compliance
        {
            sectionName: 'Reports & Compliance',
            items: [
                { text: 'Health Department Reports (RME)', icon: <HealthIcon />, path: '/manager-dashboard/health-department-reports' },
                { text: 'Risk Management', icon: <SecurityIcon />, path: '/manager-dashboard/risk-management' },
                { text: 'Team Scorecard', icon: <ScorecardIcon />, path: '/manager-dashboard/team-scorecard' },
                { text: 'My Scorecard', icon: <ScorecardIcon />, path: '/manager-dashboard/my-scorecard' },
            ]
        },

        // Forms & Compliance
        {
            sectionName: 'Forms & Compliance',
            items: [
                { text: 'Forms', icon: <FormIcon />, path: '/manager-dashboard/forms' },
                { text: 'Review Forms', icon: <ReviewIcon />, path: '/manager-dashboard/forms/review' },
                { text: 'Form Approval', icon: <ApprovalIcon />, path: '/manager-dashboard/forms/approval' },
            ]
        },

        // Courses & Training
        {
            sectionName: 'Courses & Training',
            items: [
                { text: 'Courses', icon: <CourseIcon />, path: '/manager-dashboard/courses' },
                { text: 'Assign Courses', icon: <AssignIcon />, path: '/manager-dashboard/courses/assign' },
                { text: 'Progress Tracking', icon: <TaskIcon />, path: '/manager-dashboard/courses/progress' },
            ]
        },

        // Tasks & Library
        {
            sectionName: 'Tasks & Resources',
            items: [
                { text: 'Tasks', icon: <AssignmentIcon />, path: '/manager-dashboard/tasks' },
                { text: 'Library', icon: <LibraryIcon />, path: '/manager-dashboard/library' },
                { text: 'Lookup', icon: <LookupIcon />, path: '/manager-dashboard/lookup' },
            ]
        },

        // Profile
        {
            sectionName: 'Profile',
            items: [
                { text: 'My Profile', icon: <AccountIcon />, path: '/manager-dashboard/profile' },
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
