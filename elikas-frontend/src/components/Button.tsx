import { Button } from "@/components/ui/button";
import colors from "@/constants/colors";

interface ButtonProps {
  text: string;
  variant: "primary" | "outline" | "important";
  onClick?: () => void;
  id: string;
  type?: "button" | "submit" | "reset";
  isDisabled?: boolean;
  widthSize?: string;
  heightSize?: string;
}

function ButtonComp({
  text,
  variant,
  onClick,
  id,
  type,
  isDisabled,
  widthSize,
  heightSize,
}: ButtonProps) {
  if (variant === "primary") {
    return (
      <Button
        onClick={onClick}
        className={`w-${widthSize} max-w-xs h-${heightSize} grow bg-gradient-to-r from-[#FFA011] to-[#F3C962]`}
        style={{
          width: widthSize,
          height: heightSize,
        }}
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
        className={`size-lg w-${widthSize} max-w-xs h-${heightSize} bg-transparent`}
        style={{
          borderColor: colors.heading,
          width: widthSize,
          height: heightSize,
        }}
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
        className={`size-lg max-w-xs bg-white grow`}
        style={{
          background: colors.heading,
          color: "white",
          width: widthSize,
          height: heightSize,
        }}
        id={id}
        disabled={isDisabled}
      >
        {text}
      </Button>
    );
  }
}

export default ButtonComp;
