'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { Artist } from '@/types/spotify';

interface Props {
    artists: Artist[];
    token: string;
}

export default function ArtistGrid({ artists, token }: Props) {
    const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

    async function playArtist(artistId: string) {
        try {
            const res = await fetch(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=FR`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) return;
            const data: { tracks: { preview_url: string | null }[] } = await res.json();
            const track = data.tracks?.[0];
            const preview = track?.preview_url;
            if (preview) {
                audio?.pause();
                const newAudio = new Audio(preview);
                newAudio.play();
                setAudio(newAudio);
            }
        } catch (err) {
            console.error('Erreur lors de la lecture de la piste', err);
        }
    }

    return (
        <ul className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4" aria-label="Liste de vos artistes">
            {artists.map((artist) => {
                const img = artist.images?.[1]?.url || artist.images?.[0]?.url;
                return (
                    <li key={artist.id} className="group">
                        <button
                            type="button"
                            onClick={() => playArtist(artist.id)}
                            className="h-full w-full text-left rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/50 p-3 transition hover:shadow-sm"
                        >
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
                        </button>
                    </li>
                );
            })}
        </ul>
    );
}
