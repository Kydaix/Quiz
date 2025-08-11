"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
    const sp = useSearchParams();
    // si tu viens d'une route protégée, middleware a pu mettre ?from=/...
    const callbackUrl = sp.get("from") ?? "/";

    return (
        <div className="min-h-svh grid place-items-center bg-neutral-950 text-neutral-100">
            <main className="w-full max-w-md px-6 text-center space-y-6">
                <h1 className="text-3xl font-semibold tracking-tight">Connectez-vous</h1>
                <p className="text-sm text-neutral-400">
                    Accédez à vos artistes Spotify et vos stats.
                </p>

                {/* Bouton Spotify */}
                <button onClick={() => signIn("spotify", { callbackUrl })} className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium bg-emerald-500/90 hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 transition">
                    Se connecter avec Spotify
                </button>

                {/* Gestion des erreurs NextAuth (optionnel) */}
                {sp.get("error") && (
                    <p className="text-xs text-red-400">
                        Erreur: {sp.get("error")}
                    </p>
                )}
            </main>
        </div>
    );
}
