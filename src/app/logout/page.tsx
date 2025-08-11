"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@radix-ui/themes";

export default function LogoutPage() {
    return (
        <div className="min-h-svh grid place-items-center bg-neutral-950 text-neutral-100">
            <main className="w-full max-w-md px-6 text-center space-y-6">
                <h1 className="text-2xl font-semibold">Se déconnecter</h1>
                <p className="text-sm text-neutral-400">
                    Voulez-vous vraiment vous déconnecter ?
                </p>
                <div className="flex items-center justify-center gap-3">
                    <Button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="rounded-xl px-4 py-2 text-sm font-medium bg-neutral-100 text-neutral-900 hover:bg-white"
                    >
                        Oui, me déconnecter
                    </Button>
                    <Button asChild className="rounded-xl px-4 py-2 text-sm font-medium border border-neutral-700 hover:bg-neutral-900">
                        <Link href="/">Annuler</Link>
                    </Button>
                </div>
            </main>
        </div>
    );
}
