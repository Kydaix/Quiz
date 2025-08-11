import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";

interface Artist {
  id: string;
  name: string;
}

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return (
      <div className="font-sans bg-red-200 min-h-svh p-4">
        <main className="container mx-auto text-center text-white space-y-4">
          <h1 className="text-5xl font-bold">Connectez-vous avec Spotify</h1>
          <Link href="/api/auth/signin" className="underline text-xl">
            Se connecter
          </Link>
        </main>
      </div>
    );
  }

  const res = await fetch(
    "https://api.spotify.com/v1/me/top/artists?limit=10",
    {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    },
  );

  let artists: Artist[] = [];
    if (res.ok) {
      const data: { items: Artist[] } = await res.json();
      artists = data.items;
    }

  return (
    <div className="font-sans bg-red-200 min-h-svh p-4">
      <main className="container mx-auto text-center text-white space-y-4">
        <h1 className="text-5xl font-bold">Vos artistes préférés</h1>
        <ul>
          {artists.map((artist) => (
            <li key={artist.id}>{artist.name}</li>
          ))}
        </ul>
        <Link href="/api/auth/signout" className="underline text-xl">
          Se déconnecter
        </Link>
      </main>
    </div>
  );
}
