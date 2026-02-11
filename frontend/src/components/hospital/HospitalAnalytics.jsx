import { BarChart, TrendingUp, Users, Activity, Clock, CheckCircle, XCircle } from 'lucide-react';

const HospitalAnalytics = ({ hospital }) => {
    // Mock analytics data
    const occupancyData = [
        { day: 'Mon', value: 65, volume: 42 },
        { day: 'Tue', value: 72, volume: 48 },
        { day: 'Wed', value: 85, volume: 62 },
        { day: 'Thu', value: 78, volume: 55 },
        { day: 'Fri', value: 92, volume: 75 },
        { day: 'Sat', value: 88, volume: 70 },
        { day: 'Sun', value: 70, volume: 50 },
    ];

    const symptomData = [
        { label: 'Chest Pain', value: 45, color: 'bg-red-500' },
        { label: 'High Fever', value: 32, color: 'bg-orange-500' },
        { label: 'Breathing Issue', value: 28, color: 'bg-blue-500' },
        { label: 'Accident/Trauma', value: 22, color: 'bg-yellow-500' },
        { label: 'Others', value: 15, color: 'bg-slate-400' },
    ];

    const requestStats = [
        { label: 'Accepted', value: 124, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' },
        { label: 'Rejected', value: 18, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
        { label: 'Avg Respond Time', value: '4.2m', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' },
        { label: 'Success Rate', value: '87%', icon: Activity, color: 'text-purple-500', bg: 'bg-purple-50' },
    ];

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                        Hospital Performance Analytics
                    </h2>
                    <p className="text-sm text-slate-500">Key metrics and trends for your facility</p>
                </div>
                <div className="flex items-center gap-3">
                    <select className="text-xs font-bold text-slate-600 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 outline-none">
                        <option>Last 7 Days</option>
                        <option>Last 30 Days</option>
                        <option>Last Quarter</option>
                    </select>
                    <button className="p-2 text-slate-400 hover:text-primary transition-colors">
                        <BarChart className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {requestStats.map((stat, i) => (
                    <div key={i} className="card p-5 border-t-2 border-slate-100 dark:border-slate-800 hover:shadow-md transition-all">
                        <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-3`}>
                            <stat.icon className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{stat.label}</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Occupancy Trend & Volume */}
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-primary" />
                                Occupancy & Patient Volume
                            </h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Daily capacity utilization vs admissions</p>
                        </div>
                    </div>

                    <div className="flex items-end justify-between h-48 gap-3">
                        {occupancyData.map((data, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                <div className="w-full relative bg-slate-50 dark:bg-slate-900 rounded-t-xl overflow-hidden h-full flex items-end gap-1 px-1">
                                    {/* Occupancy Bar */}
                                    <div
                                        className="flex-1 bg-primary/20 group-hover:bg-primary/40 transition-all duration-1000 ease-out rounded-t-md relative"
                                        style={{ height: `${data.value}%` }}
                                    >
                                        <div className="absolute top-0 left-0 w-full h-0.5 bg-primary"></div>
                                    </div>
                                    {/* Volume Bar */}
                                    <div
                                        className="flex-1 bg-blue-500/10 group-hover:bg-blue-500/30 transition-all duration-1000 ease-out rounded-t-md relative"
                                        style={{ height: `${data.volume}%` }}
                                    >
                                        <div className="absolute top-0 left-0 w-full h-0.5 bg-blue-500"></div>
                                    </div>

                                    <div className="absolute inset-x-0 bottom-full mb-2 text-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <div className="bg-slate-900 text-white text-[9px] font-bold px-2 py-1 rounded shadow-xl whitespace-nowrap">
                                            Occ: {data.value}% • Vol: {data.volume}
                                        </div>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">{data.day}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 flex items-center gap-4 justify-center">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-primary/40"></div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Occupancy %</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500/30"></div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Admission Vol</span>
                        </div>
                    </div>
                </div>

                {/* Symptom Distribution */}
                <div className="card p-6">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-primary" />
                        Patient Symptom Distribution
                    </h3>
                    <div className="space-y-6">
                        {symptomData.map((symptom, i) => (
                            <div key={i} className="space-y-1.5">
                                <div className="flex justify-between items-end">
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{symptom.label}</span>
                                    <span className="text-[10px] font-black text-slate-500">{symptom.value} Cases</span>
                                </div>
                                <div className="h-3 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-1000 ${symptom.color}`}
                                        style={{ width: `${(symptom.value / 45) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bed Type Detailed Utilization */}
                <div className="card p-6 lg:col-span-2">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <BarChart className="w-5 h-5 text-primary" />
                        Inventory Utilization Deep Dive
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {hospital.beds?.map((bed, i) => {
                            const util = Math.round(((bed.total - bed.available) / bed.total) * 100);
                            return (
                                <div key={i} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <div className="flex justify-between items-start mb-4">
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{bed.bed_type}</p>
                                        <div className={`p-1.5 rounded-lg ${util > 80 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                            <Activity className="w-3.5 h-3.5" />
                                        </div>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-black text-slate-900 dark:text-white">{util}%</span>
                                        <span className="text-[10px] font-bold text-slate-400">capacity used</span>
                                    </div>
                                    <div className="mt-3 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${util > 80 ? 'bg-red-500' : 'bg-primary'}`}
                                            style={{ width: `${util}%` }}
                                        ></div>
                                    </div>
                                    <div className="mt-2 flex justify-between text-[9px] font-bold text-slate-500">
                                        <span>{bed.available} Available</span>
                                        <span>{bed.total} Total</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* AI Insights & Predictions */}
            <div className="bg-gradient-to-br from-primary/5 to-blue-500/5 dark:from-primary/10 dark:to-blue-500/10 rounded-3xl p-8 border border-primary/10 relative overflow-hidden group">
                <div className="absolute -right-12 -top-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors"></div>
                <div className="relative z-10">
                    <h3 className="text-primary font-bold text-lg mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Predictive Insights & Recommendations
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="mt-1.5 w-2 h-2 rounded-full bg-primary flex-shrink-0"></div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">High Demand Alert: Weekend Surge Expected</p>
                                    <p className="text-xs text-slate-600 dark:text-slate-400">Based on the last 3 weeks, a 15% increase in Oxygen bed requests is predicted for Friday evening.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="mt-1.5 w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">Efficiency Milestone: Respond Time Improved</p>
                                    <p className="text-xs text-slate-600 dark:text-slate-400">Response time to pending requests is 14% faster than last month. Great job by the triage team!</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="mt-1.5 w-2 h-2 rounded-full bg-yellow-500 flex-shrink-0"></div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">Inventory Optimization: General Ward Buffer</p>
                                    <p className="text-xs text-slate-600 dark:text-slate-400">General ward occupancy is stable at 65%. Consider re-allocating 2 staff members to the ICU during peak hours.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="mt-1.5 w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">Critical Resource: Ventilator Maintenance</p>
                                    <p className="text-xs text-slate-600 dark:text-slate-400">3 ICU ventilators are approaching their scheduled maintenance date (15th Feb). Plan accordingly.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HospitalAnalytics;
