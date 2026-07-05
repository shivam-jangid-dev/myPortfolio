"""
Rate limiter configuration using slowapi.

Limits slow/expensive endpoints to 3 requests per minute per user (by IP).
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

# Key function: identify each user by their IP address
limiter = Limiter(key_func=get_remote_address)
