import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface PaginationCompProps {
  onClickPrev: () => void;
  onClick1: () => void;
  onClick2: () => void;
  onClick3: () => void;
  onClickNext: () => void;
  next: number;
}

function PaginationComp({
  onClickPrev,
  onClick1,
  onClick2,
  onClick3,
  onClickNext,
  next,
}: PaginationCompProps) {
  return (
    <Pagination className="mx-0 w-auto">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious onClick={onClickPrev} />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink
            onClick={onClick1}
            isActive={next === 1}
            className={next === 1 ? "bg-[#FFA01180] text-[#59260B]" : ""}
          >
            1
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink
            onClick={onClick2}
            isActive={next === 2}
            className={next === 2 ? "bg-[#FFA01180] text-[#59260B]" : ""}
          >
            2
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink
            onClick={onClick3}
            isActive={next === 3}
            className={next === 3 ? "bg-[#FFA01180] text-[#59260B]" : ""}
          >
            3
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis
            className={
              next > 3 ? "bg-[#FFA01180] text-[#59260B] rounded-lg" : ""
            }
          />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext onClick={onClickNext} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

export default PaginationComp;
