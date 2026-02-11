import { useState } from 'react';
import { User, Phone, Briefcase, Activity, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const StaffManagement = ({ hospital, onUpdate }) => {
    const [doctors, setDoctors] = useState(hospital.doctors || []);
    const [supportStaff, setSupportStaff] = useState([
        { id: 's1', name: 'Rashmi Verma', role: 'Head Nurse', on_duty: true, phone: '+91 99887 76655' },
        { id: 's2', name: 'Vikram Seth', role: 'Lab Technician', on_duty: true, phone: '+91 99887 76644' },
        { id: 's3', name: 'Ankita Rai', role: 'Nurse (ER)', on_duty: false, phone: '+91 99887 76633' },
        { id: 's4', name: 'Sanjay Gupta', role: 'Radiology Tech', on_duty: true, phone: '+91 99887 76622' },
    ]);
    const [updating, setUpdating] = useState(null);

    const toggleDutyStatus = async (doctorId) => {
        setUpdating(doctorId);
        try {
            // Mock API call to update doctor status
            await new Promise(resolve => setTimeout(resolve, 500));

            setDoctors(prev => prev.map(doc =>
                doc.id === doctorId ? { ...doc, on_duty: !doc.on_duty } : doc
            ));

            toast.success('Doctor status updated');
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Update doctor error:', error);
            toast.error('Failed to update status');
        } finally {
            setUpdating(null);
        }
    };

    const toggleSupportStatus = async (staffId) => {
        setUpdating(staffId);
        try {
            await new Promise(resolve => setTimeout(resolve, 400));
            setSupportStaff(prev => prev.map(staff =>
                staff.id === staffId ? { ...staff, on_duty: !staff.on_duty } : staff
            ));
            toast.success('Support staff status updated');
        } catch (error) {
            toast.error('Failed to update status');
        } finally {
            setUpdating(null);
        }
    };

    return (
        <div className="space-y-10">
            {/* Doctors Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                            Medical Staff (Doctors)
                        </h2>
                        <p className="text-sm text-slate-500">Manage real-time availability of specialized doctors</p>
                    </div>
                    <div className="flex items-center space-x-2 text-xs font-medium bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-slate-600 dark:text-slate-400">
                            {doctors.filter(d => d.on_duty).length} Doctors / {supportStaff.filter(s => s.on_duty).length} Support Active
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {doctors.map((doctor) => (
                        <StaffCard
                            key={doctor.id}
                            person={doctor}
                            subtext={doctor.specialty}
                            isUpdating={updating === doctor.id}
                            onToggle={() => toggleDutyStatus(doctor.id)}
                        />
                    ))}
                </div>
            </div>

            {/* Support Staff Section */}
            <div className="pt-8 border-t border-slate-200 dark:border-slate-700 space-y-6">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                        Nursing & Support Staff
                    </h2>
                    <p className="text-sm text-slate-500">Coordinate and manage paramedical and support teams</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {supportStaff.map((staff) => (
                        <StaffCard
                            key={staff.id}
                            person={staff}
                            subtext={staff.role}
                            isUpdating={updating === staff.id}
                            onToggle={() => toggleSupportStatus(staff.id)}
                            iconColor="text-blue-500"
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

const StaffCard = ({ person, subtext, isUpdating, onToggle, iconColor = "text-slate-500" }) => (
    <div className={`card p-5 border-t-4 ${person.on_duty ? 'border-green-500' : 'border-slate-300'} transition-all hover:shadow-md`}>
        <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center">
                <User className={`w-6 h-6 ${iconColor}`} />
            </div>
            <button
                onClick={onToggle}
                disabled={isUpdating}
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${person.on_duty
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
            >
                {isUpdating ? '...' : (person.on_duty ? 'On Duty' : 'Off Duty')}
            </button>
        </div>

        <div className="space-y-3">
            <div>
                <h3 className="font-bold text-slate-900 dark:text-white">{person.name}</h3>
                <p className="text-xs text-primary font-medium flex items-center gap-1 mt-0.5">
                    <Briefcase className="w-3 h-3" />
                    {subtext}
                </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{person.phone}</span>
                </div>
                {person.on_duty ? (
                    <Activity className="w-4 h-4 text-green-500 animate-pulse" />
                ) : (
                    <Clock className="w-4 h-4 text-slate-300" />
                )}
            </div>
        </div>
    </div>
);

const Clock = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
);

export default StaffManagement;
