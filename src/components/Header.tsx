export default function Header() {
  return (
    <header className="border-b border-surface0 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-green" />
        <span className="text-sm font-bold tracking-wider uppercase text-text">
          spotdl
        </span>
      </div>
      <span className="text-xs text-overlay0">v1.0</span>
    </header>
  );
}
