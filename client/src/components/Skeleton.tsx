interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className = '' }: SkeletonCardProps) {
  return (
    <div className={`rounded-xl bg-gray-900 border border-gray-800 ${className}`}>
      <div className="h-4 bg-gray-800 rounded-t-xl"></div>
      <div className="p-4 space-y-3">
        <div className="h-6 bg-gray-800 rounded w-3/4"></div>
        <div className="h-4 bg-gray-800 rounded w-full"></div>
        <div className="h-4 bg-gray-800 rounded w-5/6"></div>
      </div>
    </div>
  );
}

interface SkeletonTextProps {
  width?: string;
  height?: string;
  className?: string;
}

export function SkeletonText({ width = 'w-full', height = 'h-4', className = '' }: SkeletonTextProps) {
  return (
    <div className={`${width} ${height} bg-gray-800 rounded ${className}`}></div>
  );
}

interface SkeletonListProps {
  items?: number;
  className?: string;
}

export function SkeletonList({ items = 3, className = '' }: SkeletonListProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gray-900 border border-gray-800">
          <div className="w-10 h-10 bg-gray-800 rounded"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-800 rounded w-4/5"></div>
            <div className="h-3 bg-gray-800 rounded w-3/4"></div>
          </div>
        </div>
      ))}
    </div>
  );
}