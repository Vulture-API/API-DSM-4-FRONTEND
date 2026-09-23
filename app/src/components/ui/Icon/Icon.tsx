import type { SVGProps } from "react";

const paths = {
  lock: "M5 10h14v11H5V10ZM8 10V6a4 4 0 0 1 8 0v4",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  eyeOff: "m3 3 18 18M10 5c7-1 12 7 12 7s-1 2-3 4M6 6c-3 2-4 6-4 6s4 7 10 7c2 0 4-1 5-2M9 9a4 4 0 0 0 6 6",

  edit: "m16 3 5 5M3 21l5-1L21 7a2 2 0 0 0-4-4L4 16l-1 5",
  trash: "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7",
  save: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12l4 4v12a2 2 0 0 1-2 2ZM7 3v6h10V3M7 21v-8h10v8",
  thermometer: "M9 14V5a3 3 0 0 1 6 0v9a5 5 0 1 1-6 0ZM12 8v9M12 17v2",
  drop: "M12 2S5 11 5 15a7 7 0 0 0 14 0c0-4-7-13-7-13ZM8 15a4 4 0 0 0 4 4",
  wind: "M3 8h12a3 3 0 1 0-3-3M2 12h17a3 3 0 1 1-3 3M3 16h5a3 3 0 1 1-3 3",
  direction: "m3 10 18-7-7 18-3-8-8-3Z",
  rain: "M7 16a5 5 0 1 1 1-10 6 6 0 0 1 11 3 4 4 0 0 1-1 7H7ZM8 19v2M12 19v2M16 19v2",
  gauge:
    "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 12l4-5M7 8h.01M6 13h.01M17 13h.01",
  close: "m6 6 12 12M6 18 18 6",
  info: "M12 11v6M12 7h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  alert:
    "M12 8v5M12 17h.01M10.3 3.8 1.8 18.5A2 2 0 0 0 3.5 21h17a2 2 0 0 0 1.7-2.5L13.7 3.8a2 2 0 0 0-3.4 0",
  leaf: "M20 3C12 3 4 5 4 12a7 7 0 0 0 14 0c0-3 1-6 2-9ZM3 21l12-12M7 14h5",
  chart: "M5 20v-7M12 20V4M19 20V9",
  pin: "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  document: "M14 3H5v18h14V8l-5-5ZM14 3v6h5M8 13h8M8 17h6M8 7h2",
  users:
    "M16 21v-3a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v3M22 21v-3a4 4 0 0 0-3-3.87M16 3a4 4 0 0 1 0 8M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4",
  search: "M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  plus: "M12 5v14M5 12h14",
  chevron: "m7 10 5 5 5-5",
  wifi: "M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01",
  refresh: "M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16M21 21v-5h-5",
  activity: "M22 12h-4l-3 9L9 3l-3 9H2",
  signal: "M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 20V4",
  battery: "M6 7h11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2ZM23 11v2",
};

export function Icon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: keyof typeof paths }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}
