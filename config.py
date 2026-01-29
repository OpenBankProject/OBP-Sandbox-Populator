"""
Configuration for OBP Sandbox Populator
"""
import os
from dotenv import load_dotenv

load_dotenv()

# OBP API Configuration
OBP_BASE_URL = os.getenv("OBP_BASE_URL", "http://localhost:8080")
OBP_API_VERSION = os.getenv("OBP_API_VERSION", "v6.0.0")

# Authentication
OBP_DIRECT_LOGIN_TOKEN = os.getenv("OBP_DIRECT_LOGIN_TOKEN")
OBP_USERNAME = os.getenv("OBP_USERNAME")
OBP_PASSWORD = os.getenv("OBP_PASSWORD")
OBP_CONSUMER_KEY = os.getenv("OBP_CONSUMER_KEY")

# Sandbox data configuration
NUM_BANKS = 2
NUM_ACCOUNTS_PER_BANK = 5
COUNTRY = "Botswana"
CURRENCY = "BWP"  # Botswana Pula
