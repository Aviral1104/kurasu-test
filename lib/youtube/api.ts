import axios from "axios";

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
const API_KEY = process.env.YOUTUBE_API_KEY;

export interface PlaylistInfo {
  playlistId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  totalVideos: number;
}

export interface VideoInfo {
  ytVideoId: string;
  title: string;
  durationSeconds: number;
  position: number;
  thumbnailUrl: string;
}

/**
 * Extract a YouTube playlist ID from a URL or raw ID.
 * Supports: https://youtube.com/playlist?list=PL..., https://youtu.be/..., raw IDs
 */
export function extractPlaylistId(input: string): string | null {
  const trimmed = input.trim();

  // Already a raw playlist ID (no slashes, starts with PL, FL, UU, etc.)
  if (/^[A-Za-z0-9_-]{18,42}$/.test(trimmed) && !trimmed.includes(".")) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    return url.searchParams.get("list");
  } catch {
    return null;
  }
}

/**
 * Fetch playlist metadata (title, thumbnail, total video count).
 */
export async function fetchPlaylistInfo(
  playlistId: string
): Promise<PlaylistInfo> {
  const res = await axios.get(`${YOUTUBE_API_BASE}/playlists`, {
    params: {
      part: "snippet,contentDetails",
      id: playlistId,
      key: API_KEY,
    },
  });

  const item = res.data.items?.[0];
  if (!item) throw new Error("Playlist not found or is private.");

  return {
    playlistId,
    title: item.snippet.title,
    description: item.snippet.description,
    thumbnailUrl:
      item.snippet.thumbnails?.maxres?.url ||
      item.snippet.thumbnails?.high?.url ||
      item.snippet.thumbnails?.default?.url ||
      "",
    channelTitle: item.snippet.channelTitle,
    totalVideos: item.contentDetails.itemCount,
  };
}

/**
 * Fetch all videos in a playlist (handles pagination).
 */
export async function fetchPlaylistVideos(
  playlistId: string
): Promise<VideoInfo[]> {
  const videos: VideoInfo[] = [];
  let pageToken: string | undefined;

  do {
    const res = await axios.get(`${YOUTUBE_API_BASE}/playlistItems`, {
      params: {
        part: "snippet,contentDetails",
        playlistId,
        maxResults: 50,
        pageToken,
        key: API_KEY,
      },
    });

    const items = res.data.items || [];

    // Collect video IDs to batch-fetch durations
    const videoIds: string[] = items
      .map((item: any) => item.contentDetails.videoId)
      .filter(Boolean);

    const durationsMap = await fetchVideosDuration(videoIds);

    for (const item of items) {
      const videoId = item.contentDetails.videoId;
      if (!videoId) continue;

      videos.push({
        ytVideoId: videoId,
        title: item.snippet.title,
        position: item.snippet.position,
        thumbnailUrl:
          item.snippet.thumbnails?.high?.url ||
          item.snippet.thumbnails?.default?.url ||
          `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        durationSeconds: durationsMap[videoId] || 0,
      });
    }

    pageToken = res.data.nextPageToken;
  } while (pageToken);

  return videos.sort((a, b) => a.position - b.position);
}

/**
 * Batch-fetch video durations (ISO 8601 → seconds).
 */
async function fetchVideosDuration(
  videoIds: string[]
): Promise<Record<string, number>> {
  if (videoIds.length === 0) return {};

  const res = await axios.get(`${YOUTUBE_API_BASE}/videos`, {
    params: {
      part: "contentDetails",
      id: videoIds.join(","),
      key: API_KEY,
    },
  });

  const map: Record<string, number> = {};
  for (const item of res.data.items || []) {
    map[item.id] = parseDuration(item.contentDetails.duration);
  }
  return map;
}

/**
 * Parse ISO 8601 duration (PT1H2M3S) to total seconds.
 */
function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const h = parseInt(match[1] || "0");
  const m = parseInt(match[2] || "0");
  const s = parseInt(match[3] || "0");
  return h * 3600 + m * 60 + s;
}

/**
 * Format seconds to "1h 23m" or "45m" string.
 */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
