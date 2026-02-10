import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const useGeolocation = () => {
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            const err = 'Geolocation is not supported by your browser';
            setError(err);
            toast.error(err);
            return;
        }

        setLoading(true);
        setError(null);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setLocation({ lat: latitude, lng: longitude });
                setLoading(false);
                toast.success('Location detected');
            },
            (err) => {
                let errorMessage = 'Unable to retrieve your location';

                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        errorMessage = 'Location permission denied. Using default location (Mumbai).';
                        break;
                    case err.POSITION_UNAVAILABLE:
                        errorMessage = 'Location unavailable. Using default location (Mumbai).';
                        break;
                    case err.TIMEOUT:
                        errorMessage = 'Location request timed out. Using default location (Mumbai).';
                        break;
                    default:
                        errorMessage = 'An unknown error occurred. Using default location (Mumbai).';
                }

                // Fallback to Mumbai coordinates so search always works
                const fallbackLocation = { lat: 19.0760, lng: 72.8777 };
                setLocation(fallbackLocation);
                setError(errorMessage);
                setLoading(false);
                toast(errorMessage, { icon: '📍' });
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    };

    const clearLocation = () => {
        setLocation(null);
        setError(null);
    };

    return {
        location,
        loading,
        error,
        getCurrentLocation,
        clearLocation,
    };
};

export default useGeolocation;
