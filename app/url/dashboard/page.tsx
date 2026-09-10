"use client";

import { FormEvent, useState } from "react";
import { Check, Copy, Loader2, Search, Trash2 } from "lucide-react";

type UrlRecord = {
  _id: string;
  originalUrl: string;
  shortUrl: string;
  clicks: number;
  lastClickedAt?: string;
  createdAt: string;
};

type DashboardData = {
  totalLinks: number;
  totalClicks: number;
  urls: UrlRecord[];
};

function formatDate(value?: string) {
  if (!value) return "Nunca";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function DashboardPage() {
  const [token, setToken] = useState("");
  const [data, setData] = useState<DashboardData | null>(null);
  const [query, setQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState("");
  const [deleting, setDeleting] = useState("");
  const [pendingDelete, setPendingDelete] = useState<UrlRecord | null>(null);

  async function loadDashboard(event?: FormEvent) {
    event?.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const authResponse = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const authData = await authResponse.json();

      if (!authResponse.ok) {
        throw new Error(authData.message || "Não foi possível autenticar.");
      }

      const response = await fetch("/api/url", { cache: "no-store" });
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || "Não foi possível carregar os links.");
      }

      setData(responseData);
    } catch (error) {
      setData(null);
      setErrorMessage(error instanceof Error ? error.message : "Erro de conexão com o servidor.");
    } finally {
      setIsLoading(false);
    }
  }

  async function copyShortUrl(shortUrl: string) {
    await navigator.clipboard.writeText(`${window.location.origin}/${shortUrl}`);
    setCopied(shortUrl);
    window.setTimeout(() => setCopied(""), 1600);
  }

  async function deleteShortUrl(url: UrlRecord) {
    setDeleting(url.shortUrl);
    setErrorMessage("");

    try {
      const response = await fetch("/api/url", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shortUrl: url.shortUrl }),
      });
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || "Não foi possível excluir o link.");
      }

      setData((currentData) => currentData ? {
        totalLinks: currentData.totalLinks - 1,
        totalClicks: currentData.totalClicks - url.clicks,
        urls: currentData.urls.filter((item) => item.shortUrl !== url.shortUrl),
      } : currentData);
      setPendingDelete(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Erro de conexão com o servidor.");
    } finally {
      setDeleting("");
    }
  }

  const filteredUrls = data?.urls.filter((url) =>
    `${url.originalUrl} ${url.shortUrl}`.toLowerCase().includes(query.toLowerCase()),
  ) ?? [];

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#030303] p-6 text-[#fafafa]">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-semibold tracking-tighter">Dashboard</h1>
            <p className="text-sm text-zinc-400">Acesse seus links encurtados.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#09090b] p-6 shadow-2xl">
            <form onSubmit={loadDashboard} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="admin-token" className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Token administrativo
                </label>
                <input
                  id="admin-token"
                  type="password"
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  placeholder="Informe o ADMIN_TOKEN"
                  required
                  autoFocus
                  className="w-full rounded-md border border-[#27272a] bg-[#09090b] px-3 py-2 text-sm outline-none transition-all placeholder:text-zinc-600 focus:ring-1 focus:ring-zinc-400"
                />
              </div>
              <button type="submit" disabled={isLoading} className="w-full rounded-md bg-[#fafafa] py-2 text-sm font-medium text-[#09090b] transition-colors hover:bg-[#e4e4e7] disabled:opacity-50">
                {isLoading ? <span className="flex justify-center"><Loader2 size={16} className="animate-spin" /></span> : "Acessar dashboard"}
              </button>
            </form>
            {errorMessage && <div className="mt-6 rounded-md border border-red-900/50 bg-red-950/20 p-3 text-xs text-red-400">{errorMessage}</div>}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b0c0b] px-4 py-8 text-[#f4f5f0] sm:px-8">
      <div className="w-full max-w-6xl space-y-6 sm:space-y-8">
        <section className="grid grid-cols-2 divide-x divide-white/[0.08] rounded-xl border border-white/[0.08] bg-white/[0.025] py-5 sm:max-w-xl sm:py-6">
          <div className="px-5 sm:px-8">
            <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Links criados</p>
            <p className="mt-2 text-3xl font-light tracking-[-0.06em] text-[#d8f56a] sm:text-4xl">{data.totalLinks}</p>
          </div>
          <div className="px-5 sm:px-8">
            <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Acessos totais</p>
            <p className="mt-2 text-3xl font-light tracking-[-0.06em] sm:text-4xl">{data.totalClicks}</p>
          </div>
        </section>

        {errorMessage && <p className="border-l-2 border-red-400 pl-3 text-sm text-red-300">{errorMessage}</p>}

        <section className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#101210]">
          <div className="flex items-center justify-between gap-4 border-b border-white/[0.08] px-4 py-3 sm:px-5">
            <div>
              <p className="text-sm font-medium">Links</p>
              <p className="mt-0.5 text-xs text-zinc-500">Gerencie seus redirecionamentos</p>
            </div>
            <label className="flex w-36 items-center gap-2 rounded-md border border-white/10 bg-black/20 px-2.5 py-2 text-zinc-500 transition-colors focus-within:border-[#d8f56a]/50 sm:w-56">
              <Search size={14} aria-hidden="true" />
              <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar" className="min-w-0 w-full bg-transparent text-xs text-white outline-none placeholder:text-zinc-600" />
            </label>
          </div>

          <div className="w-full overflow-hidden">
            <table className="w-full table-fixed text-left text-xs sm:text-sm">
              <colgroup>
                <col className="w-[34%]" />
                <col className="w-[14%]" />
                <col className="w-[10%]" />
                <col className="w-[17%]" />
                <col className="w-[19%]" />
                <col className="w-[6%]" />
              </colgroup>
              <thead className="border-b border-white/[0.08] text-[9px] uppercase tracking-[0.14em] text-zinc-500 sm:text-[10px]">
                <tr>
                  <th className="px-2 py-3 font-normal sm:px-5">Original</th>
                  <th className="px-2 py-3 font-normal sm:px-5">Curto</th>
                  <th className="px-2 py-3 font-normal sm:px-5">Cliques</th>
                  <th className="px-2 py-3 font-normal sm:px-5">Criado</th>
                  <th className="px-2 py-3 font-normal sm:px-5">Último acesso</th>
                  <th className="px-2 py-3 font-normal sm:px-5"><span className="sr-only">Excluir</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {filteredUrls.map((url) => (
                  <tr key={url._id} className="group transition-colors hover:bg-white/[0.025]">
                    <td className="truncate px-2 py-4 text-zinc-300 sm:px-5" title={url.originalUrl}>{url.originalUrl}</td>
                    <td className="truncate px-2 py-4 font-mono text-[#d8f56a] sm:px-5">/{url.shortUrl}</td>
                    <td className="truncate px-2 py-4 text-zinc-300 sm:px-5">{url.clicks}</td>
                    <td className="truncate whitespace-nowrap px-2 py-4 text-zinc-500 sm:px-5">{formatDate(url.createdAt)}</td>
                    <td className="truncate whitespace-nowrap px-2 py-4 text-zinc-500 sm:px-5">{formatDate(url.lastClickedAt)}</td>
                    <td className="px-2 py-4 sm:px-5">
                      <div className="flex justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                        <button type="button" onClick={() => copyShortUrl(url.shortUrl)} title="Copiar link" aria-label="Copiar link" className="text-zinc-500 hover:text-[#d8f56a]">
                          {copied === url.shortUrl ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                        <button type="button" onClick={() => setPendingDelete(url)} disabled={deleting === url.shortUrl} title="Excluir link" aria-label="Excluir link" className="text-zinc-500 hover:text-red-400 disabled:opacity-40">
                          {deleting === url.shortUrl ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUrls.length === 0 && <p className="py-12 text-center text-sm text-zinc-500">Nenhum link encontrado.</p>}
          </div>
        </section>
      </div>

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" className="w-full max-w-sm rounded-xl border border-white/10 bg-[#151715] p-5 shadow-2xl">
            <div className="space-y-2">
              <p className="text-sm font-medium text-white">Excluir este link?</p>
              <p className="truncate font-mono text-xs text-zinc-500">/{pendingDelete.shortUrl}</p>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setPendingDelete(null)} className="rounded-md px-3 py-2 text-xs text-zinc-400 transition-colors hover:bg-white/5 hover:text-white">
                Cancelar
              </button>
              <button type="button" onClick={() => deleteShortUrl(pendingDelete)} disabled={deleting === pendingDelete.shortUrl} className="rounded-md bg-red-400 px-3 py-2 text-xs font-medium text-[#151715] transition-colors hover:bg-red-300 disabled:opacity-50">
                {deleting === pendingDelete.shortUrl ? "Excluindo" : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
