const LoadingSkeleton = ({ type = 'card', count = 1, className = '' }) => {
    const renderSkeleton = () => {
        switch (type) {
            case 'card':
                return (
                    <div className={`card p-6 ${className}`}>
                        <div className="shimmer h-6 w-3/4 rounded mb-4"></div>
                        <div className="shimmer h-4 w-full rounded mb-2"></div>
                        <div className="shimmer h-4 w-5/6 rounded mb-4"></div>
                        <div className="flex space-x-2">
                            <div className="shimmer h-8 w-20 rounded"></div>
                            <div className="shimmer h-8 w-20 rounded"></div>
                        </div>
                    </div>
                );

            case 'list':
                return (
                    <div className={`flex items-center space-x-4 p-4 ${className}`}>
                        <div className="shimmer w-12 h-12 rounded-full flex-shrink-0"></div>
                        <div className="flex-1">
                            <div className="shimmer h-4 w-3/4 rounded mb-2"></div>
                            <div className="shimmer h-3 w-1/2 rounded"></div>
                        </div>
                    </div>
                );

            case 'table':
                return (
                    <div className={`${className}`}>
                        <div className="shimmer h-10 w-full rounded mb-2"></div>
                        <div className="shimmer h-8 w-full rounded mb-2"></div>
                        <div className="shimmer h-8 w-full rounded mb-2"></div>
                        <div className="shimmer h-8 w-full rounded"></div>
                    </div>
                );

            case 'text':
                return (
                    <div className={`space-y-2 ${className}`}>
                        <div className="shimmer h-4 w-full rounded"></div>
                        <div className="shimmer h-4 w-5/6 rounded"></div>
                        <div className="shimmer h-4 w-4/6 rounded"></div>
                    </div>
                );

            default:
                return (
                    <div className={`shimmer h-20 w-full rounded ${className}`}></div>
                );
        }
    };

    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <div key={index} className="animate-pulse">
                    {renderSkeleton()}
                </div>
            ))}
        </>
    );
};

export default LoadingSkeleton;
