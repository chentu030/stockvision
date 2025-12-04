import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './LoadingScreen.scss';

const LoadingScreen: React.FC<{ onComplete?: () => void; isLoading?: boolean }> = ({ onComplete, isLoading = false }) => {
    const [progress, setProgress] = useState(0);
    const [textIndex, setTextIndex] = useState(0);

    const loadingTexts = [
        "Initializing System...",
        "Connecting to Market Data...",
        "Analyzing Broker Reports...",
        "Calibrating Models...",
        "System Ready."
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setProgress(prev => {
                if (isLoading && prev >= 90) return 90;
                if (!isLoading && prev >= 90) return 100;
                const increment = Math.random() * 15;
                return Math.min(prev + increment, 100);
            });
        }, 200);

        return () => clearInterval(timer);
    }, [isLoading]);

    useEffect(() => {
        if (progress >= 100) {
            const timer = setTimeout(() => {
                if (onComplete) onComplete();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [progress, onComplete]);

    useEffect(() => {
        if (progress < 30) setTextIndex(0);
        else if (progress < 50) setTextIndex(1);
        else if (progress < 70) setTextIndex(2);
        else if (progress < 90) setTextIndex(3);
        else setTextIndex(4);
    }, [progress]);

    return (
        <div className="loading-screen">
            <div className="loading-content">
                <motion.div
                    className="logo-container"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="logo-text">Market<span>Vision</span></h1>
                </motion.div>

                <div className="progress-container">
                    <div className="progress-line">
                        <motion.div
                            className="progress-fill"
                            style={{ width: `${progress}%` }}
                            transition={{ type: "spring", stiffness: 100 }}
                        />
                    </div>
                    <div className="progress-info">
                        <span className="percentage">{Math.round(progress)}%</span>
                    </div>
                </div>

                <div className="status-text-container">
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={textIndex}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.2 }}
                            className="status-text"
                        >
                            {loadingTexts[textIndex]}
                        </motion.p>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;
