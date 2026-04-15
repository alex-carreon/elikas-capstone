import { Button } from "@/components/ui/button";
import colors from "@/constants/colors";

interface ButtonProps {
  text: string;
  variant: "primary" | "outline";
  onClick?: () => void;
  id: string;
  type?: "button" | "submit" | "reset";
}

function ButtonComp({ text, variant, onClick, id, type }: ButtonProps) {
  if (variant === "primary") {
    return (
      <Button
        onClick={onClick}
        className="size-lg w-full max-w-xs h-10 bg-gradient-to-r from-[#FFA011] to-[#F3C962]"
        id={id}
        type={type}
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
      >
        {text}
      </Button>
    );
  }
}

export default ButtonComp;
