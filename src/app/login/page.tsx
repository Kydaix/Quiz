import Link from "next/link";

export default function LoginPage() {
    return (
        <div className="min-h-svh grid place-items-center bg-neutral-950 text-neutral-100">
            <main className="w-full max-w-md px-6">
                <div className="text-center space-y-6">
                    <h1 className="text-3xl font-semibold tracking-tight">Connectez-vous</h1>
                    <p className="text-sm text-neutral-400">
                        Accédez à vos artistes Spotify et vos stats.
                    </p>

                    <div className="pt-2">
                        <Link
                            href="/api/auth/signin?provider=spotify"
                            className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium bg-emerald-500/90 hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 transition"
                        >
                            Se connecter avec Spotify
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}