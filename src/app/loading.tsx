export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-accent-primary/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-transparent border-t-accent-primary rounded-full animate-spin" />
        </div>
        <p className="text-white/50 text-sm">Loading diagnostic...</p>
      </div>
    </div>
  );
}
