import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = ["/login", "/api/auth", "/favicon.ico", "/_next", "/assets"];

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Laisser passer les routes publiques (et fichiers statiques)
    if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p))) {
        return NextResponse.next();
    }

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    // Pas connecté → /login
    if (!token) {
        const url = req.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("from", pathname);
        return NextResponse.redirect(url);
    }

    // Connecté et sur /login → racine
    if (token && pathname === "/login") {
        const url = req.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next|assets|.*\\..*).*)"],
};
