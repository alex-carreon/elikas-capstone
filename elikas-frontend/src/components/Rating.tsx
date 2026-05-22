import React, { useState } from "react";
import { Rating } from "@smastrom/react-rating";
import "@smastrom/react-rating/style.css";

export function MyComponent() {
  const [rating, setRating] = useState(0);

  // Catch Rating value
  const handleRating = (rate: number) => {
    setRating(rate);
    console.log(rate);
    // other logic
  };
  return (
    <div className="flex flex-row">
      <Rating
        style={{ maxWidth: 180 }}
        value={rating}
        onChange={setRating}
        isRequired
      />
    </div>
  );
}
