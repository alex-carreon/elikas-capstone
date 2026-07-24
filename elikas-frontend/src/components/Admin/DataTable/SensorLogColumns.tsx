import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export type sensorLog = {
  waterLevel: number;
  statusLevel: string;
  sensorTimestamp: string;
  logTime: string;
};

const convertDateTime = (utcString: string) => {
  const zoned = toZonedTime(new Date(utcString), "Asia/Manila");
  return format(zoned, "MMM d, yyyy h:mm a");
};

export const SensorLogColumns: ColumnDef<sensorLog>[] = [
  { accessorKey: "waterLevel", header: "Water Level" },
  { accessorKey: "statusLevel", header: "Status" },
  {
    accessorKey: "sensorTimestamp",
    header: "Timestamp",
    cell: (row) => convertDateTime(row.row.original.sensorTimestamp),
  },
  {
    accessorKey: "logTime",
    header: "Log Time",
    cell: (row) => convertDateTime(row.row.original.logTime),
  },
];
