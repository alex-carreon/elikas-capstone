import { Button } from "@/components/ui/button";
import colors from "@/constants/colors";

interface ButtonProps {
  text: string;
  variant: "primary" | "outline";
  onClick?: () => void;
  id: string;
  type?: "button" | "submit" | "reset";
  isDisabled?: boolean;
}

function ButtonComp({
  text,
  variant,
  onClick,
  id,
  type,
  isDisabled,
}: ButtonProps) {
  if (variant === "primary") {
    return (
      <Button
        onClick={onClick}
        className="size-lg w-full max-w-xs h-10 bg-gradient-to-r from-[#FFA011] to-[#F3C962]"
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
  }
}

export default ButtonComp;
