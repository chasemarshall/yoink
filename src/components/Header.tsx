export default function Header() {
  return (
    <header className="border-b border-surface0/60 px-6 py-4 flex items-center justify-between backdrop-blur-sm bg-base/80 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <div className="status-dot w-2 h-2 rounded-full bg-green" />
        <span className="text-sm font-bold tracking-wider uppercase text-text">
          spotdl
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs text-overlay0 hidden sm:block">spotify downloader</span>
        <span className="text-xs text-surface2">v1.0</span>
      </div>
    </header>
  );
}
