CREATE TABLE IF NOT EXISTS carriers (
    id SERIAL PRIMARY KEY,
    name TEXT,
    modes TEXT[],
    avg_cost_per_km NUMERIC,
    reliability_score NUMERIC,
    regions TEXT[],
    active BOOLEAN
);

CREATE TYPE node_type_enum AS ENUM ('port', 'airport', 'railhead', 'warehouse', 'city');

CREATE TABLE IF NOT EXISTS route_nodes (
    id SERIAL PRIMARY KEY,
    name TEXT,
    node_type node_type_enum,
    lat NUMERIC,
    lng NUMERIC,
    state TEXT,
    tier INT
);

CREATE TABLE IF NOT EXISTS historical_routes (
    id SERIAL PRIMARY KEY,
    origin TEXT,
    destination TEXT,
    mode TEXT,
    distance_km NUMERIC,
    eta_minutes INT,
    cost_inr NUMERIC,
    disruptions_count INT,
    resilience_score NUMERIC,
    created_at TIMESTAMP DEFAULT NOW()
);
