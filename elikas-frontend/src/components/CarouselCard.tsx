import { CardContent } from "./ui/card";
import colors from "@/constants/colors";
import { Card } from "./ui/card";

interface CardProps {
  img: string;
  alt: string;
  header: string;
  text: string;
}

function CarouselCard({ img, alt, header, text }: CardProps) {
  return (
    <Card style={{ border: "none", boxShadow: "none" }}>
      <CardContent className="flex aspect-square items-center justify-center p-6 flex-col">
        <img src={img} alt={alt} className="w-40 h-40" />
        <br />
        <h3
          className={"font-BeVietnamPro text-2xl text-center font-bold p-2"}
          style={{ color: colors.heading }}
        >
          {header}
        </h3>
        <p
          className={"font-BeVietnamPro text-sm text-center p-2"}
          style={{ color: colors.heading }}
        >
          {text}
        </p>
      </CardContent>
    </Card>
  );
}

export default CarouselCard;
