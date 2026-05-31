import { Skeleton } from "@/components/ui/skeleton";

function FormSkeleton() {
  return (
    <>
      <div className="flex w-full max-w-xs flex-col gap-7">
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
        <Skeleton className="h-8 w-24 bg-[#59260B]/30" />
      </div>
    </>
  );
}

export default FormSkeleton;
