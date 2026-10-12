import { View } from "react-native";
import { Skeleton, SkeletonRect, SkeletonCircle } from "./skeleton";
import { SkeletonText, SkeletonTitle, SkeletonSubtitle, SkeletonCaption } from "./skeleton-text";
import { SkeletonList } from "./skeleton-list";

export function SkeletonDashboard({
  animate = true,
}: { animate?: boolean } = {}): React.JSX.Element {
  return (
    <View className="flex-1 bg-canvas dark:bg-night">
      {/* Header gradient area */}
      <View className="h-40 bg-primary" />
      
      <View className="mx-5 -mt-8 pb-8">
        {/* Scan CTA Card */}
        <View className="rounded-xl border border-border bg-surface dark:border-stroke dark:bg-nightcard p-4 shadow-md">
          <View className="flex-row items-center gap-3">
            <Skeleton
              className="rounded-xl"
              style={{ width: 48, height: 48 }}
              animate={animate}
            />
            <View className="flex-1">
              <SkeletonTitle width="50%" animate={animate} className="mb-1" />
              <SkeletonSubtitle width="80%" animate={animate} />
            </View>
            <SkeletonRect width={100} height={40} radius={8} animate={animate} />
          </View>
        </View>

        {/* Stats Grid */}
        <View className="mt-4 grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <View key={i} className="rounded-xl border border-border bg-surface dark:border-stroke dark:bg-nightcard p-4">
              <SkeletonTitle width="60%" animate={animate} className="mb-2" />
              <SkeletonRect width="80%" height={28} radius={4} animate={animate} />
            </View>
          ))}
        </View>

        {/* Category Chart Area */}
        <View className="mt-4 rounded-xl border border-border bg-surface dark:border-stroke dark:bg-nightcard p-4">
          <View className="flex-row items-center justify-between mb-4">
            <SkeletonTitle width="40%" animate={animate} />
            <SkeletonRect width={80} height={24} radius={4} animate={animate} />
          </View>
          <View className="h-48 flex-row items-end justify-around gap-2 p-2">
            {Array.from({ length: 6 }).map((_, i) => {
              const barHeight = 20 + Math.random() * 60;
              return (
                <SkeletonRect
                  key={i}
                  width="12%"
                  height={barHeight}
                  radius={4}
                  animate={animate}
                  style={{ minHeight: 20 }}
                />
              );
            })}
          </View>
          <View className="mt-3 flex-row gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <View key={i} className="flex-row items-center gap-2">
                <SkeletonCircle size={8} animate={animate} />
                <SkeletonCaption width="50%" animate={animate} />
              </View>
            ))}
          </View>
        </View>

        {/* Recent Expenses */}
        <View className="mt-4">
          <View className="flex-row items-center justify-between mb-3 px-5">
            <SkeletonTitle width="35%" animate={animate} />
            <SkeletonRect width={80} height={24} radius={4} animate={animate} />
          </View>
          <SkeletonList count={5} variant="card" animate={animate} className="px-5" />
        </View>
      </View>
    </View>
  );
}