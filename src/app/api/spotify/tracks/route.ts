import { NextRequest, NextResponse } from 'next/server';

export interface SpotifyTrackItem {
  id: string;
  title: string;
  artist: string;
  artworkUrl: string;
  source?: 'user' | 'playlist' | 'preset' | 'search';
}

const DEFAULT_ROMANTIC_PRESETS: SpotifyTrackItem[] = [
  {
    id: 'rec-1',
    title: 'Sonsuz Ol',
    artist: 'Yalın',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/d7/84/74/d78474b6-ce6d-431d-65bd-c8cdbbcbabd6/cover.jpg/600x600bb.jpg',
    source: 'preset',
  },
  {
    id: 'rec-2',
    title: 'Perfect',
    artist: 'Ed Sheeran',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/15/e6/e8/15e6e8a4-4190-6a8b-86c3-ab4a51b88288/190295851286.jpg/600x600bb.jpg',
    source: 'preset',
  },
  {
    id: 'rec-3',
    title: 'Beni Çok Sev',
    artist: 'Tarkan',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/35/8d/22/358d22cf-8b9c-1e7d-996d-85aad739a255/dj.nixigvoo.jpg/600x600bb.jpg',
    source: 'preset',
  },
  {
    id: 'rec-4',
    title: 'Sen Sevda Mısın',
    artist: 'Buray',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/09/5f/40/095f40e4-9696-d404-7bd1-d4e276cae52c/886445308464.jpg/600x600bb.jpg',
    source: 'preset',
  },
  {
    id: 'rec-5',
    title: 'Lover',
    artist: 'Taylor Swift',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/49/3d/ab/493dab54-f920-9043-6181-80993b8116c9/19UMGIM53909.rgb.jpg/600x600bb.jpg',
    source: 'preset',
  },
  {
    id: 'rec-6',
    title: 'Sen Ağlama',
    artist: 'Sezen Aksu',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/bf/16/c8/bf16c88f-22a3-f111-2eb9-e7da471dbe43/cover.jpg/600x600bb.jpg',
    source: 'preset',
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url') || '';
    const search = searchParams.get('search') || '';

    const tracks: SpotifyTrackItem[] = [];

    // 1. If search term provided (Live Turkey & Global query for instant HD track search)
    if (search.trim()) {
      try {
        const queryTerm = search.trim();
        // 1. Try Turkey storefront first
        let itunesRes = await fetch(
          `https://itunes.apple.com/search?term=${encodeURIComponent(
            queryTerm
          )}&country=TR&entity=song&limit=15`,
          { cache: 'no-store' }
        );
        let itunesData = itunesRes.ok ? await itunesRes.json() : null;

        // 2. Fallback to global storefront if empty
        if (!itunesData || !itunesData.results || itunesData.results.length === 0) {
          itunesRes = await fetch(
            `https://itunes.apple.com/search?term=${encodeURIComponent(
              queryTerm
            )}&entity=song&limit=15`,
            { cache: 'no-store' }
          );
          itunesData = itunesRes.ok ? await itunesRes.json() : null;
        }

        if (itunesData && itunesData.results) {
          const seen = new Set<string>();
          for (const item of itunesData.results) {
            const key = `${item.trackName?.toLowerCase().trim()}__${item.artistName?.toLowerCase().trim()}`;
            if (seen.has(key)) continue;
            seen.add(key);

            tracks.push({
              id: `itunes-${item.trackId}`,
              title: item.trackName,
              artist: item.artistName,
              artworkUrl: item.artworkUrl100
                ? item.artworkUrl100.replace('100x100bb', '600x600bb')
                : '',
              source: 'search',
            });
          }
        }
      } catch (err) {
        console.error('Spotify track search error:', err);
      }
      return NextResponse.json({ tracks });
    }

    // 2. If Spotify URL provided
    if (url.trim()) {
      let cleanUrl = url.trim();
      if (cleanUrl.includes('/embed/')) {
        cleanUrl = cleanUrl.replace('/embed/', '/');
      }
      const qIndex = cleanUrl.indexOf('?');
      if (qIndex !== -1) cleanUrl = cleanUrl.substring(0, qIndex);

      // Case A: Single Track URL
      if (cleanUrl.includes('/track/')) {
        try {
          const oembedRes = await fetch(
            `https://open.spotify.com/oembed?url=${encodeURIComponent(cleanUrl)}`,
            { cache: 'no-store' }
          );
          if (oembedRes.ok) {
            const data = await oembedRes.json();
            tracks.push({
              id: 'spotify-user-track',
              title: data.title || 'Bizim Şarkımız',
              artist: 'Sitemizdeki Spotify Parçası',
              artworkUrl: data.thumbnail_url || '',
              source: 'user',
            });
          }
        } catch (e) {
          console.error('Spotify track oembed error:', e);
        }
      }

      // Case B: Playlist URL
      const plMatch = cleanUrl.match(/playlist[\/:]([a-zA-Z0-9]+)/i);
      if (plMatch && plMatch[1]) {
        const plId = plMatch[1];
        try {
          const plRes = await fetch(
            `https://open.spotify.com/embed/playlist/${plId}`,
            {
              headers: { 'User-Agent': 'curl/7.68.0' },
              cache: 'no-store',
            }
          );
          if (plRes.ok) {
            const html = await plRes.text();
            const nextData = html.match(
              /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/
            );
            if (nextData) {
              const parsed = JSON.parse(nextData[1]);
              const entity = parsed.props?.pageProps?.state?.data?.entity;
              const playlistCover = entity?.coverArt?.sources?.[0]?.url || '';

              if (entity?.trackList && entity.trackList.length > 0) {
                entity.trackList.slice(0, 20).forEach((t: any, idx: number) => {
                  tracks.push({
                    id: t.uri || `pl-track-${idx}`,
                    title: t.title,
                    artist: t.subtitle || entity.name || 'Spotify',
                    artworkUrl:
                      playlistCover ||
                      DEFAULT_ROMANTIC_PRESETS[idx % DEFAULT_ROMANTIC_PRESETS.length].artworkUrl,
                    source: 'playlist',
                  });
                });
              }
            }
          }
        } catch (e) {
          console.error('Spotify playlist embed extract error:', e);
        }

        // If playlist embed extraction didn't find tracks, try oembed for playlist cover & title
        if (tracks.length === 0) {
          try {
            const oembedRes = await fetch(
              `https://open.spotify.com/oembed?url=${encodeURIComponent(cleanUrl)}`,
              { cache: 'no-store' }
            );
            if (oembedRes.ok) {
              const data = await oembedRes.json();
              tracks.push({
                id: 'spotify-user-playlist',
                title: data.title || 'Favori Çalma Listemiz',
                artist: 'Bizim Spotify Listemiz',
                artworkUrl: data.thumbnail_url || '',
                source: 'user',
              });
            }
          } catch (e) {
            console.error('Spotify playlist oembed error:', e);
          }
        }
      }

      // Case C: Album URL
      const albumMatch = cleanUrl.match(/album[\/:]([a-zA-Z0-9]+)/i);
      if (albumMatch && albumMatch[1]) {
        try {
          const oembedRes = await fetch(
            `https://open.spotify.com/oembed?url=${encodeURIComponent(cleanUrl)}`,
            { cache: 'no-store' }
          );
          if (oembedRes.ok) {
            const data = await oembedRes.json();
            tracks.push({
              id: 'spotify-user-album',
              title: data.title || 'Favori Albümümüz',
              artist: 'Bizim Spotify Albümümüz',
              artworkUrl: data.thumbnail_url || '',
              source: 'user',
            });
          }
        } catch (e) {
          console.error('Spotify album oembed error:', e);
        }
      }
    }

    // 3. Always ensure rich, beautiful tracks are available by appending default presets
    for (const preset of DEFAULT_ROMANTIC_PRESETS) {
      if (!tracks.some((t) => t.title.toLowerCase() === preset.title.toLowerCase())) {
        tracks.push(preset);
      }
    }

    return NextResponse.json({ tracks });
  } catch (error) {
    console.error('Error in /api/spotify/tracks:', error);
    return NextResponse.json(
      { tracks: DEFAULT_ROMANTIC_PRESETS },
      { status: 500 }
    );
  }
}
