export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS 헤더 설정
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "no-cache, no-store, must-revalidate"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname === "/api/cctv") {
      const API_KEY = "70ef9b6e0cb84142ab92089ce2a448ff";
      const result = [];

      // 1. ITS API (성남삼평교 1 & 2)
      try {
        const minX = 127.05, maxX = 127.20, minY = 37.35, maxY = 37.48;
        const itsUrl = `https://openapi.its.go.kr:9443/cctvInfo?apiKey=${API_KEY}&type=ex&cctvType=1&minX=${minX}&maxX=${maxX}&minY=${minY}&maxY=${maxY}&getType=json`;
        const itsRes = await fetch(itsUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
        if (itsRes.ok) {
          const itsData = await itsRes.json();
          const items = itsData?.response?.data || [];

          const c1 = items.find(i => i.cctvname === "[수도권제1순환선] 성남삼평교" || i.cctvname.endsWith("성남삼평교") || (i.cctvname.includes("삼평교") && !i.cctvname.includes("2")));
          if (c1) {
            result.push({
              name: "[수도권제1순환선] 성남삼평교",
              url: c1.cctvurl,
              dir: "판교 ↔ 구리/퇴계원 방면",
              isPriority: true
            });
          }

          const c2 = items.find(i => i.cctvname.includes("삼평교2"));
          if (c2) {
            result.push({
              name: "[수도권제1순환선] 성남삼평교2",
              url: c2.cctvurl,
              dir: "성남 ↔ 일산/판교 방면",
              isPriority: true
            });
          }
        }
      } catch (e) {}

      // 2. 네이버 지도 CCTV API 함수
      async function fetchNaverCctv(id) {
        try {
          const nRes = await fetch(`https://map.naver.com/p/api/cctv?cctvId=${id}`, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
              "Referer": "https://map.naver.com/"
            }
          });
          if (nRes.ok) {
            const nData = await nRes.json();
            const list = nData?.message?.result?.cctvList || [];
            const item = list.find(c => c.channel === id);
            return item ? item.hlsUrl : null;
          }
        } catch (e) {}
        return null;
      }

      // [3] 경수대로 (골사그네 ID: 6663)
      const gyeongsu = await fetchNaverCctv(6663);
      if (gyeongsu) {
        result.push({
          name: "[경수대로] 골사그네",
          url: gyeongsu,
          dir: "수원 ↔ 안양/의왕 경수대로",
          isPriority: false
        });
      }

      // [4] 과천봉담선 월암IC (ID: 1597)
      const wolam = await fetchNaverCctv(1597);
      if (wolam) {
        result.push({
          name: "[과천봉담선] 월암IC",
          url: wolam,
          dir: "봉담 ↔ 과천 도시고속화도로",
          isPriority: false
        });
      }

      return new Response(JSON.stringify({ cctvs: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" }
      });
    }

    return new Response("CCTV Proxy API is running", { headers: corsHeaders });
  }
};
