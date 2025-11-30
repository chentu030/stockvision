import React, { useState } from 'react';
import { LayoutDashboard, TrendingUp, List, Newspaper, Settings, LogOut, FileText, Calculator, ChevronLeft, ChevronRight } from 'lucide-react';
import './Sidebar.scss';

interface SidebarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    onLogout?: () => void;
    onLogoClick?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, onLogout, onLogoClick }) => {
    const [isCollapsed, setIsCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth <= 768;
        }
        return false;
    });

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'market', label: 'Market Overview', icon: TrendingUp },
        { id: 'statistics', label: 'Statistics', icon: Calculator },
        { id: 'articles', label: 'Articles', icon: FileText },
        { id: 'watchlist', label: 'Watchlist', icon: List },
        { id: 'news', label: 'News', icon: Newspaper },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <button
                className="collapse-toggle"
                onClick={() => setIsCollapsed(!isCollapsed)}
                title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
                {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>

            <div className="sidebar-logo" onClick={onLogoClick}>
                <div className={`logo-container ${isCollapsed ? 'collapsed' : ''}`}>
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="logo-icon">
                        <rect width="32" height="32" rx="8" fill="url(#logo-gradient)" fillOpacity="0.1" />
                        <path d="M8 22L14 14L19 19L25 11" stroke="url(#logo-gradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M21 11H25V15" stroke="url(#logo-gradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        <defs>
                            <linearGradient id="logo-gradient" x1="0" y1="32" x2="32" y2="0" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#3b82f6" />
                                <stop offset="1" stopColor="#8b5cf6" />
                            </linearGradient>
                        </defs>
                    </svg>
                    {!isCollapsed && (
                        <h2 className="logo-text">Market<span>Vision</span></h2>
                    )}
                </div>
            </div>

            <nav className="sidebar-nav">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                            onClick={() => onTabChange(item.id)}
                            title={isCollapsed ? item.label : ''}
                        >
                            <Icon size={20} />
                            {!isCollapsed && <span className="label">{item.label}</span>}
                            {activeTab === item.id && <div className="active-indicator" />}
                        </button>
                    );
                })}
            </nav>

            <div className="sidebar-footer">
                <button className="nav-item logout" onClick={onLogout} title={isCollapsed ? "Logout" : ''}>
                    <LogOut size={20} />
                    {!isCollapsed && <span className="label">Logout</span>}
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
