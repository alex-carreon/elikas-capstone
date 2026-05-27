import { Link } from "react-router";
import { SidebarGroup, SidebarGroupLabel } from "./ui/sidebar";
import type { LucideIcon } from "lucide-react";
import colors from "@/constants/colors";

interface SidebarRowProps {
  label: string;
  description: string;
  link: string;
  icon: LucideIcon;
  id: string;
}

function SidebarRow({
  label,
  description,
  link,
  icon: Icon,
  id,
}: SidebarRowProps) {
  return (
    <Link to={link} id={id}>
      <SidebarGroup className="flex flex-row items-center gap-2">
        <Icon size={50} strokeWidth={2} color={colors.activeIcon} />
        <div className="flex flex-col w-full">
          <SidebarGroupLabel
            className="text-lg font-bold p-0 h-fit leading-6"
            style={{ color: colors.heading }}
          >
            {label}
          </SidebarGroupLabel>
          <p className="text-xs" style={{ color: colors.heading }}>
            {description}
          </p>
        </div>
      </SidebarGroup>
    </Link>
  );
}

export default SidebarRow;
