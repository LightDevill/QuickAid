import { FileQuestion, Search, Inbox } from 'lucide-react';

const EmptyState = ({
    type = 'default',
    title,
    message,
    action = null,
    icon: CustomIcon = null
}) => {
    const getIcon = () => {
        if (CustomIcon) return CustomIcon;

        switch (type) {
            case 'search':
                return Search;
            case 'inbox':
                return Inbox;
            default:
                return FileQuestion;
        }
    };

    const Icon = getIcon();

    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <Icon className="w-10 h-10 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                {title || 'No data found'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md">
                {message || 'There is no data to display at the moment.'}
            </p>
            {action && <div>{action}</div>}
        </div>
    );
};

export default EmptyState;
