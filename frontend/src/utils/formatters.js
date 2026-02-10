// Format date to readable string
export const formatDate = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

// Format time to readable string
export const formatTime = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
    });
};

// Format date and time
export const formatDateTime = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

// Format distance in km
export const formatDistance = (distanceKm) => {
    if (distanceKm === null || distanceKm === undefined) return '';

    if (distanceKm < 1) {
        return `${Math.round(distanceKm * 1000)}m`;
    }
    return `${distanceKm.toFixed(1)}km`;
};

// Format phone number
export const formatPhone = (phone) => {
    if (!phone) return '';

    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, '');

    // Format as +91 XXXXX XXXXX
    if (cleaned.length === 10) {
        return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
        return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
    }

    return phone;
};

// Format percentage
export const formatPercentage = (value) => {
    if (value === null || value === undefined) return '0%';
    return `${Math.round(value)}%`;
};

// Get freshness state based on timestamp
export const getFreshnessState = (updatedAt) => {
    if (!updatedAt) return 'stale';

    const now = new Date();
    const updated = new Date(updatedAt);
    const diffMins = (now - updated) / 60000;

    if (diffMins < 5) return 'verified';
    if (diffMins < 10) return 'unverified';
    return 'stale';
};

// Calculate bed utilization percentage
export const calculateUtilization = (available, total) => {
    if (!total || total === 0) return 0;
    return ((total - available) / total) * 100;
};

// Get color class based on percentage
export const getPercentageColor = (percentage) => {
    if (percentage >= 80) return 'text-red-500';
    if (percentage >= 50) return 'text-yellow-500';
    return 'text-green-500';
};
