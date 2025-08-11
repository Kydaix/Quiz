import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import ArtistGrid from "@/components/ArtistGrid";
import type { Artist } from "@/types/spotify";

// --- API helpers ---
async function getTopArtists(accessToken: string): Promise<Artist[]> {
    const res = await fetch("https://api.spotify.com/v1/me/top/artists?limit=12", {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
    });
    if (!res.ok) return [];
    const data: { items: Artist[] } = await res.json();
    return data.items ?? [];
}

export default async function Home() {
    const session = await getServerSession(authOptions);
    const accessToken = session?.accessToken;
    if (!accessToken) {
        redirect("/login");
    }

    const [artists] = await Promise.all([
        getTopArtists(accessToken),
    ]);

    return (
        <div className="min-h-svh bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
            {/* Barre supérieure */}
            <header className="sticky top-0 z-10 border-b border-neutral-200/70 dark:border-neutral-800/70 bg-white/70 dark:bg-neutral-950/70 backdrop-blur supports-[backdrop-filter]:bg-white/50 supports-[backdrop-filter]:dark:bg-neutral-950/50">
                <div className="mx-auto max-w-3xl px-4 h-14 flex items-center justify-between">
                    <h1 className="text-base font-medium tracking-tight">Vos artistes préférés</h1>
                    <Link
                        href="/api/auth/signout"
                        className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 underline-offset-4 hover:underline"
                    >
                        Se déconnecter
                    </Link>
                </div>
            </header>

            {/* Contenu principal */}
            <main className="mx-auto max-w-3xl px-4 py-10">
                {artists.length === 0 ? (
                    <div className="grid place-items-center py-24 text-center">
                        <div className="space-y-2">
                            <p className="text-sm text-neutral-500">Aucun artiste trouvé pour le moment.</p>
                            <p className="text-xs text-neutral-400">Écoutez quelques titres sur Spotify puis revenez ici.</p>
                        </div>
                    </div>
                ) : (
                    <ArtistGrid artists={artists} token={accessToken} />
                )}
            </main>

            <footer className="mx-auto max-w-3xl px-4 pb-10">
                <p className="text-[11px] text-neutral-400">Images fournies par Spotify. Temps d&#39;écoute estimé à partir des 50 dernières écoutes (peut être incomplet).</p>
            </footer>
        </div>
    );
}
