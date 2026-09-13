export function SpiralBinding({ rings = 16 }: { rings?: number }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-3 left-0 z-20 flex w-11 flex-col justify-between py-2 sm:w-14"
    >
      {Array.from({ length: rings }, (_, index) => (
        <span key={index} className="relative mx-auto block h-4 w-9 sm:h-5 sm:w-11">
          <span className="absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-[var(--paper)] shadow-[inset_0_0_0_2px_#0d2b36]" />
          <span
            className="absolute inset-x-0 top-1/2 h-2.5 -translate-y-1/2 rounded-full"
            style={{
              background:
                "linear-gradient(90deg, #6d5a3a 0%, #d8c08a 18%, #8a9aa3 42%, #e8d9b0 58%, #8a9aa3 78%, #b08d57 100%)",
              boxShadow: "0 2px 2px rgb(13 43 54 / 0.45)",
            }}
          />
        </span>
      ))}
    </div>
  );
}
