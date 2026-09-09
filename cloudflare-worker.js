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

      // 네이버 지도 CCTV API 함수
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

      // [1] 성남삼평교 (ID: 538)
      const sp = await fetchNaverCctv(538);
      if (sp) {
        result.push({
          name: "[수도권제1순환선] 성남삼평교",
          url: sp,
          dir: "판교 ↔ 구리/퇴계원 방면",
          isPriority: true
        });
      }

      // [2] 판교분기점 (ID: 1)
      const pangyo = await fetchNaverCctv(1);
      if (pangyo) {
        result.push({
          name: "[수도권제1순환선] 판교분기점",
          url: pangyo,
          dir: "경부선 환승 분기점",
          isPriority: true
        });
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
