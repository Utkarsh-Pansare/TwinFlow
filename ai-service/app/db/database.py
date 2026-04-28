import os
import asyncpg
import logging

logger = logging.getLogger(__name__)

class Database:
    def __init__(self):
        self.pool = None

    async def connect(self):
        logger.info("✅ Mock Connected to PostgreSQL pool")
        self.pool = "dummy_pool"

    async def disconnect(self):
        logger.info("Mock PostgreSQL pool closed")

    async def init_schema(self):
        logger.info("✅ Mock Database schema initialized successfully")

db = Database()
