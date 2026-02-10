import { AlertCircle } from 'lucide-react';
import useUIStore from '../../stores/uiStore';

const SOSFloatingButton = () => {
    const { openSosModal } = useUIStore();

    return (
        <button
            onClick={openSosModal}
            className="fixed bottom-6 right-6 z-40 w-16 h-16 bg-accent hover:bg-accent-600 text-white rounded-full shadow-lg flex items-center justify-center transition-smooth pulse-ring focus:outline-none focus:ring-4 focus:ring-accent-300"
            aria-label="Emergency SOS"
        >
            <AlertCircle className="w-8 h-8" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full animate-ping"></span>
        </button>
    );
};

export default SOSFloatingButton;
