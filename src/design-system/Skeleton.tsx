interface SkeletonProps {
    className?: string;
}

export default function Skeleton({ className = "" }: SkeletonProps) {
    return (
        <div
            aria-hidden="true"
            className={[
                "rounded-md bg-surface-raised animate-pulse",
                className,
            ].join(" ")}
        />
    );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
    return (
        <div className="flex flex-col gap-2">
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    className={`h-3 ${i === lines - 1 ? "w-2/3" : "w-full"}`}
                />
            ))}
        </div>
    );
}
