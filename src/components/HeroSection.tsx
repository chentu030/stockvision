import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ArrowRight, TrendingUp, Activity, BarChart2 } from 'lucide-react';
import './HeroSection.scss';

interface HeroSectionProps {
    onSearch: (query: string) => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onSearch }) => {
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query);
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const { clientX, clientY, currentTarget } = e;
        const { width, height } = currentTarget.getBoundingClientRect();
        const x = (clientX / width) - 0.5;
        const y = (clientY / height) - 0.5;

        // Calculate velocity
        const prevX = parseFloat(currentTarget.style.getPropertyValue('--mouse-x-px') || '0');
        const prevY = parseFloat(currentTarget.style.getPropertyValue('--mouse-y-px') || '0');
        const deltaX = Math.abs(clientX - prevX);
        const deltaY = Math.abs(clientY - prevY);
        const velocity = Math.min((deltaX + deltaY) / 10, 10); // Cap velocity

        currentTarget.style.setProperty('--mouse-x', x.toString());
        currentTarget.style.setProperty('--mouse-y', y.toString());
        currentTarget.style.setProperty('--mouse-x-px', `${clientX}px`);
        currentTarget.style.setProperty('--mouse-y-px', `${clientY}px`);
        currentTarget.style.setProperty('--mouse-velocity', velocity.toString());
    };

    return (
        <div className="hero-section" onMouseMove={handleMouseMove}>
            <div className="spotlight"></div>
            <div className="background-effects">
                <div className="stars"></div>
                <div className="shooting-stars">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                <div className="grid-overlay"></div>
                <div className="glow-orb orb-1"></div>
                <div className="glow-orb orb-2"></div>
            </div>

            <motion.div
                className="hero-content"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
                <motion.div
                    className="badge"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    <span className="dot"></span>
                    Live Market Data
                </motion.div>

                <h1 className="title">
                    <span className="block">Market</span>
                    <span className="block gradient-text">Vision</span>
                </h1>

                <p className="subtitle">
                    Advanced analytics and broker ratings for the Taiwan Stock Exchange.
                    <br />Uncover hidden opportunities with AI-powered insights.
                </p>

                <form className={`hero-search ${isFocused ? 'focused' : ''}`} onSubmit={handleSubmit}>
                    <Search className="search-icon" size={24} />
                    <input
                        type="text"
                        placeholder="Enter stock code (e.g. 2330)"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                    />
                    <button type="submit" className="search-btn" disabled={!query.trim()}>
                        <ArrowRight size={20} />
                    </button>
                </form>

                <div className="features">
                    <motion.div
                        className="feature-item"
                        whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.08)' }}
                    >
                        <TrendingUp size={20} className="icon" />
                        <span>Upside Analysis</span>
                    </motion.div>
                    <motion.div
                        className="feature-item"
                        whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.08)' }}
                    >
                        <Activity size={20} className="icon" />
                        <span>Broker Ratings</span>
                    </motion.div>
                    <motion.div
                        className="feature-item"
                        whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.08)' }}
                    >
                        <BarChart2 size={20} className="icon" />
                        <span>Historical Data</span>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
};

export default HeroSection;
