# 🌊 TwinFlow: Smart Supply Chain Optimization System

TwinFlow is a production-grade Digital Twin platform for multi-modal logistics, powered by Gemini AI and OR-Tools.

## 🚀 Core Capabilities

*   **Digital Twin Architecture**: Real-time state modeling for Orders, Shipments, Suppliers, and Finance.
*   **AI Agent Orchestration**: 
    *   **Disruption Agent**: Proactive delay detection.
    *   **Routing Agent**: OR-Tools based same-mode optimization.
    *   **Gemini NLP**: Natural language intent parsing to structured logistics plans.
*   **Real-time Monitoring**: Socket.io driven live tracking and alert feeds.
*   **Resilience Scoring**: Dynamic health metrics (0-100) for supply chain integrity.

## 🏗️ Architecture

- **frontend/**: React + Vite + Tailwind CSS + Framer Motion + Zustand.
- **api/**: Node.js + Express + Socket.io + BullMQ (Central Intelligence Store).
- **ai-service/**: Python + FastAPI + LangGraph + Gemini API + OR-Tools.

## 🛠️ Setup

### Prerequisites
- Node.js v18+
- Python 3.9+
- Gemini API Key (set in `ai-service/.env`)

### Fast Start
```bash
chmod +x run.sh
./run.sh
```

## 🧠 Gemini Integration
Use the dashboard search bar to plan shipments using natural language:
> "Ship 500 crates of electronics from Mumbai to Singapore via Sea with high priority"

---
Built for the future of logistics.
