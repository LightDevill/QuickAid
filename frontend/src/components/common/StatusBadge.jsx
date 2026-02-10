import { STATUS_COLORS, STATUS_LABELS } from '../../utils/constants';

const StatusBadge = ({ status, size = 'md' }) => {
    const sizeClasses = {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-2.5 py-1',
        lg: 'text-base px-3 py-1.5',
    };

    const colorClass = STATUS_COLORS[status] || 'bg-gray-500';
    const label = STATUS_LABELS[status] || status;

    return (
        <span
            className={`inline-flex items-center rounded-full font-medium text-white ${colorClass} ${sizeClasses[size]}`}
        >
            {label}
        </span>
    );
};

export default StatusBadge;
