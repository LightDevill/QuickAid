import { BED_TYPE_LABELS } from '../../utils/constants';

const BedChip = ({ bedType, available, total, showLabel = true }) => {
    const getColorClass = () => {
        if (available === 0) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';

        const percentage = (available / total) * 100;
        if (percentage > 50) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
        if (percentage > 20) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    };

    const label = BED_TYPE_LABELS[bedType] || bedType;

    return (
        <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getColorClass()}`}>
            {showLabel && <span>{label}:</span>}
            <span className="font-bold">{available}</span>
            {total !== undefined && <span className="text-xs opacity-75">/ {total}</span>}
        </div>
    );
};

export default BedChip;
