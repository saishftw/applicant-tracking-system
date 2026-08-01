export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <path
        d="M12 2L2 7.77V16.23L12 22L22 16.23V7.77L12 2Z"
        stroke="#4f46e5"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 9.5C15 9.5 13.5 8 12 8C10 8 8.5 9.5 8.5 12C8.5 14.5 10 16 12 16C13.5 16 15 14.5 15 14.5"
        stroke="#0f172a"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
