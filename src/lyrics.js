const USER_AGENT = 'LyricsSyncDiscordBot/1.0';

/**
 * Tìm lyrics có timestamp từ LRCLIB.
 * Không lưu token, cookie, credential hay dữ liệu nhập của người dùng.
 */
export async function searchSyncedLyrics(title, artist = '') {
  const params = new URLSearchParams({ track_name: title });
  if (artist.trim()) params.set('artist_name', artist.trim());

  const url = `https://lrclib.net/api/get?${params.toString()}`;
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(10000)
  });

  if (!response.ok) {
    throw new Error(`LRCLIB trả về HTTP ${response.status}`);
  }

  const data = await response.json();
  if (!data?.syncedLyrics) {
    throw new Error('Không tìm thấy lyrics có timestamp cho bài hát này.');
  }

  return parseLrc(data.syncedLyrics);
}

function parseLrc(lrc) {
  const lines = [];
  const regex = /\[(\d{1,3}):(\d{2}(?:\.\d{1,3})?)\]\s*(.*)$/;

  for (const raw of lrc.split(/\r?\n/)) {
    const match = raw.match(regex);
    if (!match) continue;

    const minutes = Number(match[1]);
    const seconds = Number(match[2]);
    const text = match[3].trim();
    if (!text) continue;

    lines.push({ time: minutes * 60 + seconds, text });
  }

  return lines.sort((a, b) => a.time - b.time);
}
