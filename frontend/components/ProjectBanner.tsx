const GITHUB_URL = "https://github.com/jjaw/Aptos-NFT-generator";

export function ProjectBanner() {
  return (
    <div className="relative z-30 border-b border-cyan-400/40 bg-black/40 backdrop-blur">
      <div className="max-w-screen-xl mx-auto px-4 py-3">
        <div className="flex flex-col gap-2 text-center sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-[0.35em] text-cyan-300 font-mono">
              Vibe Coded By
            </p>
            <p className="text-sm text-cyan-100 sm:text-left font-mono">
              Will (@jjaw) + Claude code + Aptos MCP
            </p>
          </div>
          <div className="flex justify-center">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-cyan-400/60 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:-translate-y-0.5 hover:bg-white/10 hover:border-cyan-200"
            >
              View the code on GitHub
              <span aria-hidden="true" className="text-base">↗</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectBanner;
