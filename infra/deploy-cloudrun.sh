#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# TwinFlow GCP Cloud Run Deployment Script
# ═══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:?Set GCP_PROJECT_ID}"
REGION="${GCP_REGION:-asia-south1}"

echo "🚀 Deploying TwinFlow to GCP Cloud Run..."
echo "   Project: ${PROJECT_ID}"
echo "   Region:  ${REGION}"
echo ""

# ── 1. Build and Deploy AI Service ────────────────────────────────────────────
echo "🤖 Building AI Service..."
cd ai-service
gcloud builds submit --tag "gcr.io/${PROJECT_ID}/twinflow-ai-service" --project "${PROJECT_ID}"
gcloud run deploy twinflow-ai-service \
  --image "gcr.io/${PROJECT_ID}/twinflow-ai-service" \
  --platform managed \
  --region "${REGION}" \
  --allow-unauthenticated \
  --set-env-vars "GEMINI_API_KEY=${GEMINI_API_KEY},MAPS_API_KEY=${MAPS_API_KEY}" \
  --memory 1Gi \
  --cpu 1 \
  --project "${PROJECT_ID}"

AI_URL=$(gcloud run services describe twinflow-ai-service --region "${REGION}" --project "${PROJECT_ID}" --format "value(status.url)")
echo "   AI Service URL: ${AI_URL}"
cd ..

# ── 2. Build and Deploy Node API ──────────────────────────────────────────────
echo "🧠 Building Node API..."
cd api
gcloud builds submit --tag "gcr.io/${PROJECT_ID}/twinflow-api" --project "${PROJECT_ID}"
gcloud run deploy twinflow-api \
  --image "gcr.io/${PROJECT_ID}/twinflow-api" \
  --platform managed \
  --region "${REGION}" \
  --allow-unauthenticated \
  --set-env-vars "AI_SERVICE_URL=${AI_URL}" \
  --memory 512Mi \
  --cpu 1 \
  --project "${PROJECT_ID}"

API_URL=$(gcloud run services describe twinflow-api --region "${REGION}" --project "${PROJECT_ID}" --format "value(status.url)")
echo "   API URL: ${API_URL}"
cd ..

# ── 3. Build and Deploy Frontend ──────────────────────────────────────────────
echo "🎨 Building Frontend..."
cd frontend
gcloud builds submit \
  --tag "gcr.io/${PROJECT_ID}/twinflow-frontend" \
  --project "${PROJECT_ID}"
gcloud run deploy twinflow-frontend \
  --image "gcr.io/${PROJECT_ID}/twinflow-frontend" \
  --platform managed \
  --region "${REGION}" \
  --allow-unauthenticated \
  --memory 256Mi \
  --cpu 1 \
  --project "${PROJECT_ID}"

FRONTEND_URL=$(gcloud run services describe twinflow-frontend --region "${REGION}" --project "${PROJECT_ID}" --format "value(status.url)")
echo "   Frontend URL: ${FRONTEND_URL}"
cd ..

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════"
echo "✅ TwinFlow Deployment Complete"
echo "═══════════════════════════════════════════════════"
echo "Frontend:   ${FRONTEND_URL}"
echo "API:        ${API_URL}"
echo "AI Service: ${AI_URL}"
echo "═══════════════════════════════════════════════════"
