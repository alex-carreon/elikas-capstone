import { Skeleton } from "@/components/ui/skeleton";

function FormDesktopSkeleton() {
  return (
    <>
      <div className="w-full grid grid-cols-2 gap-8">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-20 bg-[#59260B]/30" />
          <Skeleton className="h-8 w-full bg-[#59260B]/30" />
        </div>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-24 bg-[#59260B]/30" />
          <Skeleton className="h-8 w-full bg-[#59260B]/30" />
        </div>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-24 bg-[#59260B]/30" />
          <Skeleton className="h-8 w-full bg-[#59260B]/30" />
        </div>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-24 bg-[#59260B]/30" />
          <Skeleton className="h-8 w-full bg-[#59260B]/30" />
        </div>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-24 bg-[#59260B]/30" />
          <Skeleton className="h-8 w-full bg-[#59260B]/30" />
        </div>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-24 bg-[#59260B]/30" />
          <Skeleton className="h-8 w-full bg-[#59260B]/30" />
        </div>
      </div>
    </>
  );
}

export default FormDesktopSkeleton;
