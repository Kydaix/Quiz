import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import Image from "next/image";

interface ImageRef {
    url: string;
    width: number;
    height: number;
}

interface Artist {
    id: string;
    name: string;
    images?: ImageRef[];
}

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

    // Vue déconnectée — CTA minimaliste
    if (!session) {
        return (
            <div className="min-h-svh grid place-items-center bg-neutral-950 text-neutral-100">
                <main className="w-full max-w-md px-6">
                    <div className="text-center space-y-6">
                        <h1 className="text-3xl font-semibold tracking-tight">Connectez-vous avec Spotify</h1>
                        <p className="text-sm text-neutral-400">Affichez vos artistes, avec leur image et votre temps d'écoute estimé.</p>
                        <div className="pt-2">
                            <Link
                                href="/api/auth/signin"
                                className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium bg-emerald-500/90 hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 transition"
                            >
                                Se connecter
                            </Link>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    const accessToken = (session as any).accessToken as string;
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
                    <ul className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4" aria-label="Liste de vos artistes">
                        {artists.map((artist) => {
                            const img = artist.images?.[1]?.url || artist.images?.[0]?.url; // taille moyenne si dispo
                            return (
                                <li key={artist.id} className="group">
                                    <div className="h-full rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/50 p-3 transition hover:shadow-sm">
                                        <div className="aspect-square w-full overflow-hidden rounded-xl bg-neutral-200/60 dark:bg-neutral-800/60">
                                            {img ? (
                                                <Image src={img} alt={artist.name} className="h-full w-full object-cover" width={64} height={64} />
                                            ) : (
                                                <div className="h-full w-full grid place-items-center text-xs text-neutral-500">Sans image</div>
                                            )}
                                        </div>
                                        <div className="mt-3 space-y-1">
                                            <p className="text-sm font-medium truncate" title={artist.name}>{artist.name}</p>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </main>

            <footer className="mx-auto max-w-3xl px-4 pb-10">
                <p className="text-[11px] text-neutral-400">Images fournies par Spotify. Temps d&#39;écoute estimé à partir des 50 dernières écoutes (peut être incomplet).</p>
            </footer>
        </div>
    );
}
