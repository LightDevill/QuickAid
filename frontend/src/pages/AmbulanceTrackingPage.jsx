import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Ambulance, Clock, Navigation } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import toast from 'react-hot-toast';
import useAuth from '../hooks/useAuth';
import useGeolocation from '../hooks/useGeolocation';

// Define custom icons
const createCustomIcon = (emoji, bgColor) => new L.DivIcon({
    className: 'custom-leaflet-icon',
    html: `<div style="background-color: ${bgColor}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">${emoji}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
});

const userIcon = createCustomIcon('👤', '#3b82f6'); // Blue
const ambulanceIcon = createCustomIcon('🚑', '#ef4444'); // Red
const hospitalIcon = createCustomIcon('🏥', '#10b981'); // Green

// Helper component to center map on location changes
function MapCenter({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, 15, { animate: true });
        }
    }, [center, map]);
    return null;
}

const AmbulanceTrackingPage = () => {
    const { user } = useAuth();
    const { location, getCurrentLocation } = useGeolocation();
    
    const [eta, setEta] = useState(5);
    const [phase, setPhase] = useState('to_user'); // 'to_user' -> 'to_hospital' -> 'arrived'
    const [ambPos, setAmbPos] = useState(null);
    const [hospPos, setHospPos] = useState(null);
    
    // Get initial location on mount
    useEffect(() => {
        if (!location) {
            getCurrentLocation();
        }
    }, []);

    // Setup initial mock positions when location is detected
    useEffect(() => {
        if (location && !ambPos) {
            // Mock hospital 1.5km away (rough)
            setHospPos({ lat: location.lat - 0.012, lng: location.lng - 0.012 });
            // Mock ambulance 1km away
            setAmbPos({ lat: location.lat + 0.008, lng: location.lng + 0.008 });
        }
    }, [location]);

    // Animate ambulance movement
    useEffect(() => {
        if (!location || !ambPos || !hospPos || phase === 'arrived') return;

        const interval = setInterval(() => {
            setAmbPos(prev => {
                const target = phase === 'to_user' ? location : hospPos;
                const dLat = target.lat - prev.lat;
                const dLng = target.lng - prev.lng;
                
                const distance = Math.sqrt(dLat * dLat + dLng * dLng);

                // Reached target
                if (distance < 0.0003) {
                    if (phase === 'to_user') {
                        setPhase('to_hospital');
                        toast.success("Ambulance arrived! Transporting to nearest hospital.");
                    } else {
                        setPhase('arrived');
                        toast.success("Arrived safely at the hospital.");
                        clearInterval(interval);
                    }
                    return target;
                }

                // Move slightly towards target
                const speed = 0.00015; // Speed per tick
                const ratio = Math.min(speed / distance, 1);

                return {
                    lat: prev.lat + dLat * ratio,
                    lng: prev.lng + dLng * ratio
                };
            });
        }, 300);

        return () => clearInterval(interval);
    }, [ambPos, hospPos, location, phase]);

    // ETA Mock Calculation
    useEffect(() => {
        const timer = setInterval(() => {
            setEta(prev => (prev > 1 ? prev - 1 : 1));
        }, 60000); // Reduce ETA every minute
        return () => clearInterval(timer);
    }, []);

    const center = location ? [location.lat, location.lng] : [19.0760, 72.8777]; // Default Mumbai

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-8 pb-20">
            <div className="max-w-3xl mx-auto px-4 sm:px-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="card overflow-hidden border-2 border-red-500 shadow-xl"
                >
                    <div className="bg-red-500 text-white p-6 text-center">
                        <Ambulance className="w-16 h-16 mx-auto mb-4 animate-bounce" />
                        <h1 className="text-2xl font-bold mb-2">
                            {phase === 'to_user' && 'Ambulance Dispatched'}
                            {phase === 'to_hospital' && 'En Route to Hospital'}
                            {phase === 'arrived' && 'Arrived at Hospital'}
                        </h1>
                        <p className="text-red-100">
                            {phase === 'to_user' && 'Help is on the way to your location'}
                            {phase === 'to_hospital' && 'Patient picked up, transporting to the nearest hospital'}
                            {phase === 'arrived' && 'Patient successfully transferred to emergency room'}
                        </p>
                    </div>

                    <div className="p-6 md:p-8 space-y-8">
                        {/* ETA Section */}
                        {phase !== 'arrived' && (
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-4 shadow-inner">
                                    <span className="text-3xl font-bold">{eta}</span>
                                    <span className="text-sm ml-1 font-medium">min</span>
                                </div>
                                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                                    Estimated Time of Arrival
                                </h2>
                            </div>
                        )}

                        {/* Details */}
                        <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-6 space-y-4">
                            <div className="flex items-start space-x-4">
                                <div className="p-2 bg-white dark:bg-slate-700 rounded-lg text-primary shrink-0">
                                    <Ambulance className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Vehicle</p>
                                    <p className="font-medium text-slate-900 dark:text-white">LifeLine Advanced ALS (MH-01-AB-1234)</p>
                                </div>
                            </div>
                            
                            <div className="flex items-start space-x-4">
                                <div className="p-2 bg-white dark:bg-slate-700 rounded-lg text-primary shrink-0">
                                    <Phone className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Driver Contact</p>
                                    <div className="flex items-center justify-between">
                                        <p className="font-medium text-slate-900 dark:text-white">Rajesh Kumar</p>
                                        <button className="btn-secondary py-1 px-3 text-sm">Call Now</button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start space-x-4">
                                <div className="p-2 bg-white dark:bg-slate-700 rounded-lg text-primary shrink-0">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Destination</p>
                                    <p className="font-medium text-slate-900 dark:text-white">City General Hospital, Emergency Ward</p>
                                </div>
                            </div>
                        </div>

                        {/* Tracking Map with React Leaflet */}
                        <div className="relative h-80 bg-slate-200 dark:bg-slate-700 rounded-xl overflow-hidden shadow-md border border-slate-300 dark:border-slate-600 z-0 tracking-map-container">
                            <MapContainer 
                                center={center} 
                                zoom={14} 
                                style={{ height: '100%', width: '100%', zIndex: 0 }}
                            >
                                <TileLayer
                                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                    attribution="&copy; OpenStreetMap &copy; CARTO"
                                />
                                <MapCenter center={ambPos || center} />
                                
                                {location && (
                                    <Marker position={[location.lat, location.lng]} icon={userIcon}>
                                        <Popup>Your Location</Popup>
                                    </Marker>
                                )}
                                
                                {hospPos && (
                                    <Marker position={[hospPos.lat, hospPos.lng]} icon={hospitalIcon}>
                                        <Popup>City General Hospital</Popup>
                                    </Marker>
                                )}

                                {ambPos && (
                                    <Marker position={[ambPos.lat, ambPos.lng]} icon={ambulanceIcon}>
                                        <Popup>Ambulance En Route</Popup>
                                    </Marker>
                                )}
                            </MapContainer>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default AmbulanceTrackingPage;
