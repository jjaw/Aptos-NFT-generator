const GITHUB_URL = "https://github.com/jjaw/Aptos-NFT-generator";

const SHOUTOUTS = [
  {
    icon: "⚡",
    label: "Aptos MCP server",
    detail: "powering the mint + wallet pipeline",
    href: "https://github.com/aptos-labs/aptos-npm-mcp",
  },
  {
    icon: "🤖",
    label: "Claude",
    detail: "for rapid prototyping and code pairing",
  },
  {
    icon: "✨",
    label: "Tippi Fifestarr (@tippi-fifestarr)",
    detail: "for keeping the energy high",
    href: "https://github.com/tippi-fifestarr",
  },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 border-t border-cyan-400/30 bg-black/30 backdrop-blur">
      <div className="max-w-screen-xl mx-auto px-4 py-10">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-3 space-y-4">
            <p className="text-[10px] uppercase tracking-[0.35em] text-cyan-300 font-mono">
              Behind The Scenes
            </p>
            <h2 className="text-2xl font-bold text-slate-100 font-mono">
              Retro NFTs with a lightweight stack
            </h2>
            <p className="text-sm leading-relaxed text-cyan-100/90 font-mono">
              Will (@jjaw) vibe coded this Aptos testnet lab to explore generative art, wallet UX, and neon nostalgia. Claude keeps the ideas flowing while the Aptos MCP server handles the chain choreography.
            </p>
          </div>

          <div className="md:col-span-2 space-y-4">
            <p className="text-[10px] uppercase tracking-[0.35em] text-cyan-300 font-mono">
              Shoutouts
            </p>
            <ul className="space-y-2 text-sm text-cyan-100 font-mono">
              {SHOUTOUTS.map(({ icon, label, detail, href }) => (
                <li key={label}>
                  {icon}{" "}
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-200 underline decoration-cyan-400/60 decoration-dotted hover:text-white"
                    >
                      {label}
                    </a>
                  ) : (
                    label
                  )}{" "}
                  {detail}
                </li>
              ))}
            </ul>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-cyan-400/60 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:-translate-y-0.5 hover:bg-white/10 hover:border-cyan-200"
            >
              Star the project on GitHub
              <span aria-hidden="true" className="text-base">★</span>
            </a>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-2 text-xs text-gray-400 font-mono sm:flex-row sm:justify-between">
          <span>© {year} Will (@jjaw). Made for fun and open for remixing.</span>
          <span className="text-gray-500">Built with ❤️ on Aptos testnet.</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
