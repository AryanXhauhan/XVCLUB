'use client';

import { useState, useEffect } from 'react';

interface TypingAnimationProps {
    text: string;
    speed?: number;
    pauseDuration?: number;
    className?: string;
}

export default function TypingAnimation({ 
    text, 
    speed = 100, 
    pauseDuration = 3000,
    className = '' 
}: TypingAnimationProps) {
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (!isTyping) {
            // Pause before restarting
            const pauseTimer = setTimeout(() => {
                setDisplayedText('');
                setCurrentIndex(0);
                setIsTyping(true);
            }, pauseDuration);
            return () => clearTimeout(pauseTimer);
        }

        if (currentIndex < text.length) {
            const timer = setTimeout(() => {
                setDisplayedText(text.slice(0, currentIndex + 1));
                setCurrentIndex(currentIndex + 1);
            }, speed);
            return () => clearTimeout(timer);
        } else {
            // Finished typing, wait then restart
            const finishTimer = setTimeout(() => {
                setIsTyping(false);
            }, pauseDuration);
            return () => clearTimeout(finishTimer);
        }
    }, [currentIndex, text, speed, pauseDuration, isTyping]);

    return (
        <span className={className}>
            {displayedText}
            <span className="inline-block w-0.5 h-[1em] bg-xvc-black ml-1 animate-pulse align-middle" />
        </span>
    );
}

