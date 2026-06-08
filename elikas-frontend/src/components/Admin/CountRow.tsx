import colors from "@/constants/colors";
import { Spinner } from "@/components/ui/spinner";

interface CountRowProps {
  title: string;
  lastUpdated?: string;
  count: number | null;
  loading: boolean;
}

function CountRow({ title, lastUpdated, count, loading }: CountRowProps) {
  return (
    <div className="bg-white w-full rounded-lg h-content py-2 px-4 flex flex-row justify-between items-center shadow-md">
      <div className="flex flex-col">
        <p className="text-xs font-bold" style={{ color: colors.heading }}>
          {title}
        </p>
        <p className="text-[10px] italic" style={{ color: colors.heading }}>
          {lastUpdated}
        </p>
      </div>
      <div className="text-2xl text-[#FFA011] font-bold">
        {loading ? <Spinner /> : <p>{count}</p>}
      </div>
    </div>
  );
}

export default CountRow;
