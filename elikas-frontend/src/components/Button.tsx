import { Button } from "@/components/ui/button";
import colors from "@/constants/colors";

interface ButtonProps {
  text: string;
  variant: "primary" | "outline" | "important";
  onClick?: () => void;
  id: string;
  type?: "button" | "submit" | "reset";
  isDisabled?: boolean;
  size?: string;
}

function ButtonComp({
  text,
  variant,
  onClick,
  id,
  type,
  isDisabled,
  size,
}: ButtonProps) {
  if (variant === "primary") {
    return (
      <Button
        onClick={onClick}
        className={`size-${size} w-full max-w-xs h-10 bg-gradient-to-r from-[#FFA011] to-[#F3C962]`}
        id={id}
        type={type}
        disabled={isDisabled}
      >
        {text}
      </Button>
    );
  } else if (variant === "outline") {
    return (
      <Button
        onClick={onClick}
        className="size-lg w-full max-w-xs h-10 bg-transparent"
        style={{ borderColor: colors.heading }}
        id={id}
        disabled={isDisabled}
      >
        {text}
      </Button>
    );
  } else if (variant === "important") {
    return (
      <Button
        onClick={onClick}
        className="size-lg w-2xs max-w-xs h-10 bg-white p-6"
        style={{ background: colors.heading, color: "white" }}
        id={id}
        disabled={isDisabled}
      >
        {text}
      </Button>
    );
  }
}

export default ButtonComp;
