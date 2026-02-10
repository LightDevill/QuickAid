import { useState, useEffect, useRef } from 'react';

const useCountdown = (initialSeconds, onComplete = null) => {
    const [seconds, setSeconds] = useState(initialSeconds);
    const [isActive, setIsActive] = useState(false);
    const intervalRef = useRef(null);

    useEffect(() => {
        if (isActive && seconds > 0) {
            intervalRef.current = setInterval(() => {
                setSeconds((prev) => {
                    if (prev <= 1) {
                        setIsActive(false);
                        if (onComplete) {
                            onComplete();
                        }
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else if (seconds === 0 && isActive) {
            setIsActive(false);
            if (onComplete) {
                onComplete();
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isActive, seconds, onComplete]);

    const start = (newSeconds = null) => {
        if (newSeconds !== null) {
            setSeconds(newSeconds);
        }
        setIsActive(true);
    };

    const pause = () => {
        setIsActive(false);
    };

    const reset = (newSeconds = initialSeconds) => {
        setIsActive(false);
        setSeconds(newSeconds);
    };

    const resume = () => {
        if (seconds > 0) {
            setIsActive(true);
        }
    };

    return {
        seconds,
        isActive,
        start,
        pause,
        reset,
        resume,
    };
};

export default useCountdown;
