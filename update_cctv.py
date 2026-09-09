import urllib.request
import json
import os
import sys

def fetch_naver_cctv(channel_id):
    try:
        url = f"https://map.naver.com/p/api/cctv?cctvId={channel_id}"
        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "Referer": "https://map.naver.com/"
        })
        with urllib.request.urlopen(req, timeout=10) as res:
            data = json.loads(res.read().decode('utf-8'))
            items = data.get('message', {}).get('result', {}).get('cctvList', [])
            target = next((c for c in items if c.get('channel') == channel_id), None)
            if target and target.get('hlsUrl'):
                return target.get('hlsUrl')
    except Exception as e:
        print(f"Error fetching Naver CCTV {channel_id}: {e}", file=sys.stderr)
    return None

def update_cctv_json():
    print("Fetching fresh CCTV streams...")
    targets = [
        {
            "id": 538,
            "name": "[수도권제1순환선] 성남삼평교",
            "dir": "판교 ↔ 구리/퇴계원 방면",
            "isPriority": True
        },
        {
            "id": 1,
            "name": "[수도권제1순환선] 판교분기점",
            "dir": "경부선 환승 분기점",
            "isPriority": True
        },
        {
            "id": 6663,
            "name": "[경수대로] 골사그네",
            "dir": "수원 ↔ 안양/의왕 경수대로",
            "isPriority": False
        },
        {
            "id": 1597,
            "name": "[과천봉담선] 월암IC",
            "dir": "봉담 ↔ 과천 도시고속화도로",
            "isPriority": False
        }
    ]

    result = []
    for item in targets:
        url = fetch_naver_cctv(item["id"])
        if url:
            result.append({
                "name": item["name"],
                "url": url,
                "dir": item["dir"],
                "isPriority": item["isPriority"]
            })
            print(f"OK: {item['name']}")
        else:
            print(f"FAILED: {item['name']}", file=sys.stderr)

    if not result:
        print("No CCTV data fetched. Aborting write to prevent data wipe.", file=sys.stderr)
        sys.exit(1)

    json_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cctv_data.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({"cctvs": result}, f, ensure_ascii=False, indent=2)

    print(f"Successfully updated {json_path} with {len(result)} streams.")

if __name__ == "__main__":
    update_cctv_json()
