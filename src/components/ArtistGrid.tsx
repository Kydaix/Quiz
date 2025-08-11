'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import type { Artist } from '@/types/spotify';

declare global {
    interface Window {
        onSpotifyWebPlaybackSDKReady?: () => void;
        Spotify?: any;
    }
}

interface Props {
    artists: Artist[];
    token: string; // doit être un access_token Spotify valide pour un compte Premium
}

type TopTracksResponse = {
    tracks: Array<{
        id: string;
        name: string;
        uri: string;
        external_urls?: { spotify?: string };
    }>;
};

export default function ArtistGrid({ artists, token }: Props) {
    const playerRef = useRef<any | null>(null);
    const [sdkReady, setSdkReady] = useState(false);
    const [deviceId, setDeviceId] = useState<string | null>(null);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [nowPlaying, setNowPlaying] = useState<{ artistId: string; trackId: string; title: string } | null>(null);
    const [lastLink, setLastLink] = useState<string | null>(null);

    // 1) Charger le SDK une seule fois
    useEffect(() => {
        if (window.Spotify) {
            setSdkReady(true);
            return;
        }
        const scriptId = 'spotify-web-playback-sdk';
        if (document.getElementById(scriptId)) return;

        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://sdk.scdn.co/spotify-player.js';
        script.async = true;
        document.body.appendChild(script);

        window.onSpotifyWebPlaybackSDKReady = () => {
            setSdkReady(true);
        };

        return () => {
            script.remove();
        };
    }, []);

    // 2) Initialiser le player quand SDK prêt + token dispo
    useEffect(() => {
        if (!sdkReady || !token || playerRef.current) return;

        const player = new window.Spotify.Player({
            name: 'Mon lecteur Web',
            getOAuthToken: (cb: (t: string) => void) => cb(token),
            volume: 0.7,
        });

        player.addListener('ready', ({ device_id }: { device_id: string }) => {
            console.log('Spotify Web Playback SDK prêt. Device ID:', device_id);
            setDeviceId(device_id);
            // Optionnel: transférer la lecture sur ce device immédiatement
            transferPlayback(device_id).catch(console.error);
        });

        player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
            console.warn('Device non prêt:', device_id);
        });

        player.addListener('initialization_error', ({ message }: { message: string }) => console.error('init_error', message));
        player.addListener('authentication_error', ({ message }: { message: string }) => console.error('auth_error', message));
        player.addListener('account_error', ({ message }: { message: string }) => {
            // Occurs si l’utilisateur n’est pas Premium
            console.error('account_error (Premium requis):', message);
        });

        player.connect().then((ok: boolean) => {
            if (!ok) console.error('Impossible de connecter le lecteur Spotify');
        });

        playerRef.current = player;

        return () => {
            try {
                player.disconnect();
            } catch {}
            playerRef.current = null;
        };
    }, [sdkReady, token]);

    // Helper: transférer la lecture vers notre device
    async function transferPlayback(id: string) {
        await fetch('https://api.spotify.com/v1/me/player', {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ device_ids: [id], play: false }),
        });
    }

    // Helper: play / pause / resume / stop via Web API
    async function playUris(uris: string[], id: string) {
        // Important: ajouter device_id pour forcer la lecture sur notre device
        const url = new URL('https://api.spotify.com/v1/me/player/play');
        url.searchParams.set('device_id', id);

        const res = await fetch(url.toString(), {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ uris }),
        });

        if (!res.ok) {
            const t = await res.text().catch(() => '');
            throw new Error(`Erreur play(): ${res.status} ${res.statusText} ${t}`);
        }
    }

    async function pause() {
        if (!deviceId) return;
        const url = new URL('https://api.spotify.com/v1/me/player/pause');
        url.searchParams.set('device_id', deviceId);
        await fetch(url.toString(), { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
    }

    async function resume() {
        if (!deviceId) return;
        const url = new URL('https://api.spotify.com/v1/me/player/play');
        url.searchParams.set('device_id', deviceId);
        await fetch(url.toString(), { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
    }

    async function stop() {
        // Pas d’endpoint “stop” natif : on met en pause
        await pause();
        setNowPlaying(null);
    }

    // 3) Quand on clique un artiste → fetch top tracks → play via Web API (pas preview_url)
    async function playArtist(artistId: string) {
        try {
            if (!deviceId) {
                console.warn('Device non prêt. Attendez l’initialisation du SDK.');
                return;
            }
            setLoadingId(artistId);

            const res = await fetch(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=FR`, {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store',
            });

            if (!res.ok) {
                const txt = await res.text().catch(() => '');
                console.error('Erreur API Spotify top-tracks:', txt || res.statusText);
                setLoadingId(null);
                return;
            }

            const data: TopTracksResponse = await res.json();
            const first = data.tracks?.[0];
            if (!first) {
                setNowPlaying(null);
                setLastLink(null);
                setLoadingId(null);
                return;
            }

            // Conserver un lien Spotify utile
            setLastLink(first.external_urls?.spotify ?? null);

            // Lancer la lecture COMPLETE sur notre device, avec l’URI Spotify
            await playUris([first.uri], deviceId);

            setNowPlaying({ artistId, trackId: first.id, title: first.name });
            setLoadingId(null);
        } catch (err) {
            console.error('Erreur lecture complète:', err);
            setLoadingId(null);
        }
    }

    async function togglePause() {
        try {
            // On tente un /me/player (state) pour savoir si on est en pause
            const stateRes = await fetch('https://api.spotify.com/v1/me/player', {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store',
            });
            const state = stateRes.ok ? await stateRes.json() : null;
            const isPaused = Boolean(state?.is_playing === false);
            if (isPaused) await resume();
            else await pause();
        } catch (e) {
            // Si on ne peut pas lire l’état, on tente toggle “best effort”
            await resume().catch(async () => { await pause(); });
        }
    }

    return (
        <>
            {/* Barre de contrôle */}
            <div className="mb-4">
                {nowPlaying ? (
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                        <span className="rounded-full w-2 h-2 bg-emerald-500 animate-pulse" />
                        <span className="truncate">Lecture : {nowPlaying.title}</span>
                        <button
                            type="button"
                            onClick={togglePause}
                            className="px-2 py-1 rounded-md border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        >
                            Pause/Reprendre
                        </button>
                        <button
                            type="button"
                            onClick={stop}
                            className="px-2 py-1 rounded-md border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        >
                            Stop
                        </button>
                        {lastLink && (
                            <a
                                href={lastLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-600 hover:underline ml-2"
                            >
                                Ouvrir dans Spotify
                            </a>
                        )}
                        {!deviceId && <span className="text-xs text-neutral-500">Initialisation du lecteur…</span>}
                    </div>
                ) : (
                    lastLink && (
                        <div className="text-xs text-neutral-500">
                            Sélectionnez un artiste pour lancer la lecture —{' '}
                            <a href={lastLink} target="_blank" rel="noreferrer" className="underline">
                                ouvrir dans Spotify
                            </a>
                        </div>
                    )
                )}
            </div>

            {/* Grille d’artistes */}
            <ul className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4" aria-label="Liste de vos artistes">
                {artists.map((artist) => {
                    const img = artist.images?.[1]?.url || artist.images?.[0]?.url;
                    const isLoading = loadingId === artist.id;
                    const isActive = nowPlaying?.artistId === artist.id;

                    return (
                        <li key={artist.id} className="group">
                            <button
                                type="button"
                                onClick={() => playArtist(artist.id)}
                                className="h-full w-full text-left rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/50 p-3 transition hover:shadow-sm"
                                disabled={!deviceId}
                                title={!deviceId ? 'Lecteur en cours d’initialisation…' : undefined}
                            >
                                <div className="aspect-square w-full overflow-hidden rounded-xl bg-neutral-200/60 dark:bg-neutral-800/60 relative">
                                    {img ? (
                                        <Image src={img} alt={artist.name} className="h-full w-full object-cover" width={64} height={64} />
                                    ) : (
                                        <div className="h-full w-full grid place-items-center text-xs text-neutral-500">Sans image</div>
                                    )}
                                    {isLoading && (
                                        <div className="absolute inset-0 grid place-items-center bg-black/30 text-white text-xs">Chargement…</div>
                                    )}
                                    {isActive && !isLoading && (
                                        <div className="absolute bottom-2 right-2 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/90 text-white">En lecture</div>
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
        </>
    );
}
