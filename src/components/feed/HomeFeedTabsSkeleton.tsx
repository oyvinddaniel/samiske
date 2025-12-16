export function HomeFeedTabsSkeleton() {
  return (
    <div className="flex flex-col animate-pulse">
      {/* Tabs header skeleton */}
      <div className="flex flex-col items-center mb-6">
        <div className="flex gap-2 mb-3">
          <div className="h-10 w-24 bg-gray-200 rounded-md" />
          <div className="h-10 w-28 bg-gray-200 rounded-md" />
          <div className="h-10 w-48 bg-gray-200 rounded-md" />
        </div>
        <div className="h-4 w-80 bg-gray-200 rounded max-w-md" />
      </div>

      {/* Feed content skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg border p-4 space-y-3">
            {/* Post header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-3 w-24 bg-gray-200 rounded" />
              </div>
            </div>

            {/* Post content */}
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-200 rounded" />
              <div className="h-4 w-5/6 bg-gray-200 rounded" />
              <div className="h-4 w-4/6 bg-gray-200 rounded" />
            </div>

            {/* Post footer */}
            <div className="flex gap-4 pt-2">
              <div className="h-8 w-16 bg-gray-200 rounded" />
              <div className="h-8 w-16 bg-gray-200 rounded" />
              <div className="h-8 w-16 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
