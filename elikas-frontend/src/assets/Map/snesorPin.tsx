import { useId } from "react";

export function SensorIcon({ color }: { color: string }) {
  const id = useId();
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      zoomAndPan="magnify"
      viewBox="0 0 183 286.499991"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      version="1.0"
    >
      <defs>
        <clipPath id={id}>
          <path
            d="M 0.265625 0 L 182.449219 0 L 182.449219 285.253906 L 0.265625 285.253906 Z M 0.265625 0 "
            clipRule="nonzero"
          />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <path
          fill={color}
          d="M 0.265625 138.730469 C 0.265625 138.730469 59.726562 47.105469 97.324219 0 C 97.324219 0 167.359375 105.359375 182.449219 136.941406 C 182.449219 136.941406 91.664062 278.679688 89.777344 285.550781 C 89.777344 285.550781 39.328125 191.910156 0.265625 138.730469 "
          fillOpacity="1"
          fillRule="nonzero"
        />
      </g>
    </svg>
  );
}
