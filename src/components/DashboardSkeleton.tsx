export function DashboardSkeleton() {
    return (
        <div className="skeleton-dashboard">
            <div className="skeleton skeleton-hero" />
            <div className="skeleton skeleton-section" />
            <div className="skeleton skeleton-section" />
            <div className="skeleton skeleton-section" style={{ height: 120 }} />
        </div>
    );
}
