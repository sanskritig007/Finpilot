import time
from app.services.auth_service import redis_client

RATE_LIMIT_MAX_REQUESTS = 20
RATE_LIMIT_WINDOW_SECONDS = 3600  # 1 hour

def is_rate_limited(user_id: str) -> bool:
    """Sliding window rate limiter using Redis ZSET. Returns True if rate-limited, False otherwise."""
    key = f"ratelimit:{user_id}"
    now = time.time()
    cutoff = now - RATE_LIMIT_WINDOW_SECONDS
    
    try:
        # 1. Remove entries older than 1 hour
        redis_client.zremrangebyscore(key, 0, cutoff)
        
        # 2. Count requests in the current window
        request_count = redis_client.zcard(key)
        
        if request_count >= RATE_LIMIT_MAX_REQUESTS:
            return True
            
        # 3. Add current request
        redis_client.zadd(key, {str(now): now})
        
        # 4. Set expiration key so it doesn't linger forever
        redis_client.expire(key, RATE_LIMIT_WINDOW_SECONDS)
        
        return False
    except Exception as e:
        # In case Redis goes down, we fallback to ALLOWING requests so the user experience doesn't break.
        print(f"Rate Limiter Redis Error: {e}")
        return False
