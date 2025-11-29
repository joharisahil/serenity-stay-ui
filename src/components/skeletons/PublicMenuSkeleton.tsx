import { Card, CardContent } from "@/components/ui/card";

export default function PublicMenuSkeleton() {
  return (
    <div className="min-h-screen p-4 animate-pulse">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header Skeleton */}
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-muted" />
          <div className="space-y-2">
            <div className="h-6 w-40 bg-muted rounded" />
            <div className="h-4 w-32 bg-muted rounded" />
          </div>
        </div>

        {/* Categories + Items Skeleton */}
        {[1, 2, 3].map((_, i) => (
          <div key={i} className="space-y-4">
            {/* Category Title */}
            <div className="h-6 w-48 bg-muted rounded" />

            {/* Items Grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              {[1, 2].map((x) => (
                <Card key={x} className="border-muted">
                  <CardContent className="p-5 space-y-4">

                    {/* Item Header */}
                    <div className="flex justify-between">
                      <div className="space-y-2">
                        <div className="h-4 w-32 bg-muted rounded" />
                        <div className="h-3 w-48 bg-muted/70 rounded" />
                      </div>

                      <div className="h-6 w-12 bg-muted rounded" />
                    </div>

                    {/* Price options */}
                    <div className="space-y-2">
                      {[1, 2].map((y) => (
                        <div className="flex items-center gap-2" key={y}>
                          <div className="h-4 w-4 bg-muted rounded" />
                          <div className="h-4 w-24 bg-muted rounded" />
                        </div>
                      ))}
                    </div>

                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
