import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, MapPin, Loader2, SlidersHorizontal, ArrowUpDown, Star, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import useSearchStore from '../stores/searchStore';
import useGeolocation from '../hooks/useGeolocation';
import { hospitalApi } from '../api/hospitalApi';
import { BED_TYPE_LABELS } from '../utils/constants';
import { formatDistance, getFreshnessState } from '../utils/formatters';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import BedChip from '../components/common/BedChip';

const SearchPage = () => {
    const navigate = useNavigate();
    const { results, filters, loading, sortBy, setResults, setFilters, setLoading, setSortBy } = useSearchStore();
    const { location, loading: geoLoading, getCurrentLocation } = useGeolocation();

    const [showFilters, setShowFilters] = useState(false);
    const [localFilters, setLocalFilters] = useState(filters);

    useEffect(() => {
        if (location) {
            setLocalFilters((prev) => ({
                ...prev,
                lat: location.lat,
                lng: location.lng,
            }));
        }
    }, [location]);

    const handleSearch = async () => {
        if (!localFilters.lat || !localFilters.lng) {
            toast.error('Please provide your location');
            return;
        }

        setLoading(true);
        setFilters(localFilters);

        try {
            console.log('[SEARCH] Searching with:', localFilters);

            const response = await hospitalApi.searchHospitals(
                localFilters.lat,
                localFilters.lng,
                localFilters.bed_type,
                localFilters.radius
            );

            console.log('[SEARCH] Response:', response);

            const hospitals = response?.hospitals || response || [];
            setResults(hospitals);

            if (!hospitals || hospitals.length === 0) {
                toast.error('No hospitals found. Try expanding your search radius.');
            } else {
                toast.success('Found ' + hospitals.length + ' hospitals');
            }
        } catch (error) {
            console.error('Search error:', error);
            toast.error('Failed to search hospitals');
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleUseMyLocation = () => {
        getCurrentLocation();
    };

    const getSortedResults = () => {
        if (!results || results.length === 0) return [];

        const sorted = [...results];
        switch (sortBy) {
            case 'distance':
                return sorted.sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));
            case 'availability':
                return sorted.sort((a, b) => {
                    const aAvail = a.beds?.find(bed => bed.bed_type === localFilters.bed_type)?.available || 0;
                    const bAvail = b.beds?.find(bed => bed.bed_type === localFilters.bed_type)?.available || 0;
                    return bAvail - aAvail;
                });
            case 'score':
            default:
                return sorted.sort((a, b) => (b.match_score || b.score || 0) - (a.match_score || a.score || 0));
        }
    };

    const sortedResults = getSortedResults();

    const formatLatLng = () => {
        if (localFilters.lat && localFilters.lng) {
            const lat = Number(localFilters.lat).toFixed(4);
            const lng = Number(localFilters.lng).toFixed(4);
            return lat + ', ' + lng;
        }
        return '';
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                        Find Hospital Beds
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Search for available beds near you
                    </p>
                </div>

                <div className="card p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Location
                            </label>
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={formatLatLng()}
                                    placeholder="Click Use My Location"
                                    className="input flex-1"
                                    readOnly
                                />
                                <button
                                    onClick={handleUseMyLocation}
                                    disabled={geoLoading}
                                    className="btn-secondary flex items-center space-x-2 whitespace-nowrap"
                                >
                                    {geoLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <MapPin className="w-4 h-4" />
                                    )}
                                    <span className="hidden sm:inline">Use My Location</span>
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Bed Type
                            </label>
                            <select
                                value={localFilters.bed_type}
                                onChange={(e) => setLocalFilters({ ...localFilters, bed_type: e.target.value })}
                                className="input"
                            >
                                {Object.entries(BED_TYPE_LABELS).map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Radius: {localFilters.radius}km
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="50"
                                value={localFilters.radius}
                                onChange={(e) => setLocalFilters({ ...localFilters, radius: parseInt(e.target.value) })}
                                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                        </div>
                    </div>

                    <div className="mt-4 flex justify-between items-center">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="btn-secondary flex items-center space-x-2"
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                            <span>Filters</span>
                        </button>

                        <button
                            onClick={handleSearch}
                            disabled={loading || !localFilters.lat || !localFilters.lng}
                            className="btn-primary flex items-center space-x-2"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Search className="w-5 h-5" />
                            )}
                            <span>{loading ? 'Searching...' : 'Search Hospitals'}</span>
                        </button>
                    </div>
                </div>

                {sortedResults.length > 0 && (
                    <div className="mb-4 flex justify-between items-center">
                        <p className="text-slate-600 dark:text-slate-400">
                            Found <span className="font-semibold text-slate-900 dark:text-white">{sortedResults.length}</span> hospitals
                        </p>

                        <div className="flex items-center space-x-2">
                            <ArrowUpDown className="w-4 h-4 text-slate-500" />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="input py-1 text-sm"
                            >
                                <option value="score">Best Match</option>
                                <option value="distance">Distance</option>
                                <option value="availability">Availability</option>
                            </select>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="space-y-4">
                        <LoadingSkeleton type="card" count={3} />
                    </div>
                ) : sortedResults.length > 0 ? (
                    <div className="space-y-4">
                        {sortedResults.map((hospital, index) => (
                            <HospitalCard
                                key={hospital.id || hospital.hospital_id || index}
                                hospital={hospital}
                                bedType={localFilters.bed_type}
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        type="search"
                        title="No hospitals found"
                        message="Click Use My Location and then Search Hospitals to find beds near you."
                    />
                )}
            </div>
        </div>
    );
};

const HospitalCard = ({ hospital, bedType }) => {
    const navigate = useNavigate();

    const hospitalId = hospital.id || hospital.hospital_id;
    const bedData = hospital.beds?.find(bed => bed.bed_type === bedType);
    const freshness = getFreshnessState(hospital.updated_at || hospital.last_updated);
    const matchScore = hospital.match_score || hospital.score || 0;

    const getFreshnessIcon = () => {
        if (freshness === 'verified') return '🟢';
        if (freshness === 'unverified') return '🟡';
        if (freshness === 'stale') return '🔴';
        return '⚪';
    };

    const getFreshnessLabel = () => {
        if (freshness === 'verified') return 'Verified';
        if (freshness === 'unverified') return 'Unverified';
        if (freshness === 'stale') return 'Stale';
        return 'Unknown';
    };

    const getScoreColor = () => {
        if (matchScore >= 70) return 'border-green-500 text-green-600';
        if (matchScore >= 50) return 'border-yellow-500 text-yellow-600';
        return 'border-red-500 text-red-600';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6 hover:shadow-lg transition-smooth"
        >
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">
                                {hospital.name}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                {hospital.address}
                            </p>

                            <div className="flex items-center gap-4 mb-3">
                                {hospital.rating && (
                                    <span className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                                        <Star className="w-4 h-4 text-yellow-500 mr-1 fill-yellow-500" />
                                        {hospital.rating}
                                    </span>
                                )}
                                {hospital.phone && (
                                    <span className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                                        <Phone className="w-4 h-4 mr-1" />
                                        {hospital.phone}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="ml-4 flex-shrink-0">
                            <div className={'w-16 h-16 rounded-full border-4 flex items-center justify-center bg-white dark:bg-slate-800 ' + getScoreColor()}>
                                <span className="text-lg font-bold">
                                    {matchScore}%
                                </span>
                            </div>
                            <p className="text-xs text-center text-slate-500 mt-1">Match</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                        {hospital.beds?.map((bed) => (
                            <BedChip
                                key={bed.bed_type}
                                bedType={bed.bed_type}
                                available={bed.available}
                                total={bed.total}
                            />
                        ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                        {hospital.distance_km !== undefined && (
                            <span className="flex items-center space-x-1">
                                <MapPin className="w-4 h-4" />
                                <span>{formatDistance(hospital.distance_km)}</span>
                            </span>
                        )}
                        <span className="flex items-center space-x-1">
                            <span>{getFreshnessIcon()}</span>
                            <span>{getFreshnessLabel()}</span>
                        </span>
                        {hospital.reliability_score && (
                            <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full">
                                Reliability: {hospital.reliability_score}%
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex flex-col space-y-2 md:w-40">
                    <button
                        onClick={() => navigate('/booking/' + hospitalId)}
                        disabled={!bedData || bedData.available === 0}
                        className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {bedData && bedData.available > 0 ? 'Book Bed' : 'No Beds'}
                    </button>
                    <Link
                        to={'/hospital/' + hospitalId}
                        className="btn-secondary text-sm text-center"
                    >
                        View Details
                    </Link>
                </div>
            </div>
        </motion.div>
    );
};

export default SearchPage;