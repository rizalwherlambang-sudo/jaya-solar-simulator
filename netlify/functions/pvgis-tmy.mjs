
export default async (request) => {
  const cors = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "public, max-age=3600",
  };

  try {
    const url = new URL(request.url);
    const lat = Number(url.searchParams.get("lat"));
    const lon = Number(url.searchParams.get("lon"));

    if (
      !Number.isFinite(lat) || Math.abs(lat) > 90 ||
      !Number.isFinite(lon) || Math.abs(lon) > 180
    ) {
      return new Response(
        JSON.stringify({ error: "Latitude/longitude tidak valid." }),
        { status: 400, headers: cors }
      );
    }

    const api = new URL("https://re.jrc.ec.europa.eu/api/v5_3/tmy");
    api.search = new URLSearchParams({
      lat: String(lat),
      lon: String(lon),
      usehorizon: "1",
      outputformat: "json",
    }).toString();

    const upstream = await fetch(api, {
      headers: { accept: "application/json" }
    });

    if (!upstream.ok) {
      const detail = await upstream.text();
      return new Response(JSON.stringify({
        error: `PVGIS mengembalikan HTTP ${upstream.status}.`,
        detail: detail.slice(0, 500)
      }), { status: 502, headers: cors });
    }

    const raw = await upstream.json();
    const source = raw?.outputs?.tmy_hourly;

    if (!Array.isArray(source) || source.length < 8000) {
      return new Response(JSON.stringify({
        error: "Format data TMY PVGIS tidak dikenali atau data tidak lengkap."
      }), { status: 502, headers: cors });
    }

    const hourly = source.map((item) => {
      const stamp = String(item["time(UTC)"] || item.time || "");
      const match = stamp.match(/^(\d{4})(\d{2})(\d{2}):(\d{2})(\d{2})$/);
      if (!match) return null;

      const [, yy, mm, dd, hh] = match;
      const utc = new Date(Date.UTC(
        Number(yy), Number(mm) - 1, Number(dd), Number(hh)
      ));

      // Convert UTC to Indonesia WIB (UTC+7)
      const local = new Date(utc.getTime() + 7 * 60 * 60 * 1000);
      const ghi = Number(item["G(h)"] ?? 0);

      return {
        time: `${local.getUTCFullYear()}-${String(local.getUTCMonth()+1).padStart(2,"0")}-${String(local.getUTCDate()).padStart(2,"0")} ${String(local.getUTCHours()).padStart(2,"0")}:00`,
        year: local.getUTCFullYear(),
        month: local.getUTCMonth() + 1,
        day: local.getUTCDate(),
        hour: local.getUTCHours(),
        ghi: Number.isFinite(ghi) ? ghi : 0,
        dni: Number(item["Gb(n)"] || 0),
        dhi: Number(item["Gd(h)"] || 0),
        temp: Number(item.T2m || 0),
        wind: Number(item.WS10m || 0)
      };
    }).filter(Boolean);

    return new Response(JSON.stringify({
      latitude: raw?.inputs?.location?.latitude ?? lat,
      longitude: raw?.inputs?.location?.longitude ?? lon,
      source: "PVGIS 5.3 TMY",
      count: hourly.length,
      hourly
    }), { status: 200, headers: cors });

  } catch (error) {
    return new Response(JSON.stringify({
      error: "Tidak dapat menghubungi PVGIS.",
      detail: String(error?.message || error)
    }), { status: 500, headers: cors });
  }
};
