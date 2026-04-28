import asyncio
import os
import aiohttp

async def test_api():
    print("🚀 Testing TwinFlow Day 7 AI Data Intelligence Layer")
    
    # Using local host and port assuming the service is running via docker-compose or locally
    base_url = "http://localhost:8000"
    
    async with aiohttp.ClientSession() as session:
        # 1. Test /health
        print("\n--- 1. Testing /health ---")
        try:
            async with session.get(f"{base_url}/health") as resp:
                data = await resp.json()
                print(f"Status: {resp.status}")
                print(f"Response: {data}")
        except Exception as e:
            print(f"Failed to connect: {e}\nIs the AI service running?")
            return

        # 2. Test /score (which uses the XGBoost model)
        print("\n--- 2. Testing /score (XGBoost Prediction) ---")
        score_payload = {
            "route": ["Pune", "Mumbai"],
            "disruptions": ["Heavy rain"],
            "weather_severity": 0.8,
            "congestion_level": 0.5
        }
        async with session.post(f"{base_url}/score", json=score_payload) as resp:
            data = await resp.json()
            print(f"Status: {resp.status}")
            print(f"Response: {data}")
            
        # 3. Test /learn (Inserts to Postgres)
        print("\n--- 3. Testing /learn (Postgres Insert) ---")
        learn_payload = {
            "route": ["Delhi", "Nagpur", "Bangalore"],
            "final_outcome_score": 75.5,
            "disruptions": ["Slight delay at toll"],
            "total_distance_km": 2100.0,
            "total_eta_minutes": 2500.0,
            "cost_inr": 105000.0,
            "mode": "road"
        }
        async with session.post(f"{base_url}/learn", json=learn_payload) as resp:
            data = await resp.json()
            print(f"Status: {resp.status}")
            print(f"Response: {data}")

if __name__ == "__main__":
    asyncio.run(test_api())
