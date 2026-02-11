import { useState } from 'react';
import { Save, RefreshCw, AlertTriangle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { hospitalApi } from '../../api/hospitalApi';
import { BED_TYPE_LABELS } from '../../utils/constants';

const BedAvailabilityManager = ({ hospital, onUpdate }) => {
    const [beds, setBeds] = useState(hospital.beds || []);
    const [updating, setUpdating] = useState(false);
    const [crisisMode, setCrisisMode] = useState(hospital.is_crisis_mode || false);

    const handleCountChange = (bedType, field, value) => {
        const newValue = parseInt(value) || 0;
        setBeds(prev => prev.map(bed =>
            bed.bed_type === bedType ? { ...bed, [field]: newValue } : bed
        ));
    };

    const handleWaitTimeChange = (bedType, value) => {
        setBeds(prev => prev.map(bed =>
            bed.bed_type === bedType ? { ...bed, wait_time: value } : bed
        ));
    };

    const handleUpdate = async (bedType) => {
        const bed = beds.find(b => b.bed_type === bedType);
        if (!bed) return;

        setUpdating(true);
        try {
            await hospitalApi.updateBeds(hospital.hospital_id, bedType, bed.available, bed.total);
            // In a real app, we'd also update wait_time and crisis_mode via API
            toast.success(`${BED_TYPE_LABELS[bedType]} beds updated`);
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Update beds error:', error);
            toast.error('Failed to update beds');
        } finally {
            setUpdating(false);
        }
    };

    const toggleCrisisMode = () => {
        const newState = !crisisMode;
        setCrisisMode(newState);
        if (newState) {
            toast.error('CRISIS MODE ENABLED: SOS matches will be diverted');
        } else {
            toast.success('Crisis mode disabled');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                        Manage Bed Availability
                    </h2>
                    <p className="text-sm text-slate-500">Update real-time inventory and operational status</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleCrisisMode}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${crisisMode
                                ? 'bg-red-500 text-white shadow-lg shadow-red-200'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        <AlertTriangle className={`w-4 h-4 ${crisisMode ? 'animate-bounce' : ''}`} />
                        <span>{crisisMode ? 'CRISIS MODE: ACTIVE' : 'Normal Operations'}</span>
                    </button>
                    <button
                        onClick={() => setBeds(hospital.beds || [])}
                        className="p-2 text-slate-500 hover:text-primary transition-colors"
                        title="Reset changes"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {crisisMode && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div className="text-sm">
                        <p className="text-red-800 dark:text-red-400 font-bold">SOS matches are currently disabled for this hospital.</p>
                        <p className="text-red-600 dark:text-red-500">Only direct walk-ins and existing reservations will be processed.</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {beds.map((bed) => (
                    <div key={bed.bed_type} className="card p-5 border-l-4 border-primary/20 hover:border-primary/50 transition-all">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-slate-900 dark:text-white capitalize text-lg">
                                {BED_TYPE_LABELS[bed.bed_type] || bed.bed_type}
                            </h3>
                            <button
                                onClick={() => handleUpdate(bed.bed_type)}
                                disabled={updating}
                                className="flex items-center space-x-1 text-sm font-bold text-primary hover:text-primary-700 disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                <span>Save Changes</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                                    Available
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={bed.available}
                                    onChange={(e) => handleCountChange(bed.bed_type, 'available', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-primary focus:border-transparent transition-smooth"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                                    Total Capacity
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={bed.total}
                                    onChange={(e) => handleCountChange(bed.bed_type, 'total', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-primary focus:border-transparent transition-smooth"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                                    <Clock className="w-3 h-3" />
                                    Estimated Wait Time
                                </label>
                                <select
                                    value={bed.wait_time || 'immediate'}
                                    onChange={(e) => handleWaitTimeChange(bed.bed_type, e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-primary focus:border-transparent transition-smooth"
                                >
                                    <option value="immediate">Immediate Availability</option>
                                    <option value="30m">Under 30 minutes</option>
                                    <option value="1h">1-2 hours</option>
                                    <option value="4h">4+ hours</option>
                                    <option value="none">Not Available</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-col gap-1.5">
                            <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest">
                                <span>Occupancy</span>
                                <span>{Math.round(((bed.total - bed.available) / bed.total) * 100)}%</span>
                            </div>
                            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-700 ${(bed.available / bed.total) < 0.2 ? 'bg-red-500' :
                                            (bed.available / bed.total) < 0.5 ? 'bg-yellow-500' : 'bg-green-500'
                                        }`}
                                    style={{ width: `${Math.max(5, ((bed.total - bed.available) / bed.total) * 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BedAvailabilityManager;
