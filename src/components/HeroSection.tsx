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

    return (
        <div className="hero-section">
            <div className="background-pattern"></div>

            <motion.div
                className="hero-content"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
                <motion.div
                    className="badge"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    <span className="dot"></span>
                    Live Market Data
                </motion.div>

                <h1 className="title">
                    <span className="block">Market</span>
                    <span className="block highlight">Vision</span>
                </h1>

                <p className="subtitle">
                    Advanced analytics and broker ratings for the Taiwan Stock Exchange.
                    <br />Uncover hidden opportunities with AI-powered insights.
                </p>

                <form className={`hero-search ${isFocused ? 'focused' : ''}`} onSubmit={handleSubmit}>
                    <Search className="search-icon" size={20} />
                    <input
                        type="text"
                        placeholder="Enter stock code (e.g. 2330)"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                    />
                    <button type="submit" className="search-btn" disabled={!query.trim()}>
                        <ArrowRight size={18} />
                    </button>
                </form>

                <div className="features">
                    <motion.div
                        className="feature-item"
                        whileHover={{ y: -5 }}
                    >
                        <TrendingUp size={18} className="icon" />
                        <span>Upside Analysis</span>
                    </motion.div>
                    <motion.div
                        className="feature-item"
                        whileHover={{ y: -5 }}
                    >
                        <Activity size={18} className="icon" />
                        <span>Broker Ratings</span>
                    </motion.div>
                    <motion.div
                        className="feature-item"
                        whileHover={{ y: -5 }}
                    >
                        <BarChart2 size={18} className="icon" />
                        <span>Historical Data</span>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
};

export default HeroSection;
