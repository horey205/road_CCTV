import http.server
import socketserver
import urllib.request
import json
import os

PORT = 8000
API_KEY = "70ef9b6e0cb84142ab92089ce2a448ff"

def fetch_naver_cctv(channel_id):
    try:
        url = f"https://map.naver.com/p/api/cctv?cctvId={channel_id}"
        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "Referer": "https://map.naver.com/"
        })
        with urllib.request.urlopen(req, timeout=5) as res:
            data = json.loads(res.read().decode('utf-8'))
            items = data.get('message', {}).get('result', {}).get('cctvList', [])
            target = next((c for c in items if c.get('channel') == channel_id), None)
            if target and target.get('hlsUrl'):
                return target.get('hlsUrl')
    except Exception as e:
        print(f"Error fetching Naver CCTV {channel_id}: {e}")
    return None

def fetch_fresh_cctv_data():
    result = []
    
    # [1] 성남삼평교 (ID: 538)
    sp1_url = fetch_naver_cctv(538)
    if sp1_url:
        result.append({
            "name": "[수도권제1순환선] 성남삼평교",
            "url": sp1_url,
            "dir": "판교 ↔ 구리/퇴계원 방면",
            "isPriority": True
        })

    # [2] 판교분기점 (ID: 1)
    pangyo_url = fetch_naver_cctv(1)
    if pangyo_url:
        result.append({
            "name": "[수도권제1순환선] 판교분기점",
            "url": pangyo_url,
            "dir": "경부선 환승 분기점",
            "isPriority": True
        })

    # [3] 네이버 지도 실시간 API: 경수대로 (골사그네, ID: 6663)
    gyeongsu_url = fetch_naver_cctv(6663)
    if gyeongsu_url:
        result.append({
            "name": "[경수대로] 골사그네",
            "url": gyeongsu_url,
            "dir": "수원 ↔ 안양/의왕 경수대로",
            "isPriority": False
        })

    # [4] 네이버 지도 실시간 API: 과천봉담선 월암IC (ID: 1597)
    wolam_url = fetch_naver_cctv(1597)
    if wolam_url:
        result.append({
            "name": "[과천봉담선] 월암IC",
            "url": wolam_url,
            "dir": "봉담 ↔ 과천 도시고속화도로",
            "isPriority": False
        })

    return result

class CCTVHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def do_GET(self):
        if self.path.startswith('/api/cctv'):
            cctv_list = fetch_fresh_cctv_data()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps({"cctvs": cctv_list}, ensure_ascii=False).encode('utf-8'))
        else:
            super().do_GET()

if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), CCTVHandler) as httpd:
        print(f"==================================================")
        print(f"CCTV Server Running at: http://localhost:{PORT}")
        print(f"Mobile URL: http://192.168.0.6:{PORT}")
        print(f"==================================================")
        httpd.serve_forever()
