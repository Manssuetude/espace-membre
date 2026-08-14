"""
In-memory caching service with TTL and invalidation support.
"""
from cachetools import TTLCache
from typing import Optional, Callable, Any
import functools
import logging

logger = logging.getLogger(__name__)


class CacheService:
    """
    In-memory cache service using TTLCache.
    Provides TTL-based expiration and manual invalidation.
    """
    
    def __init__(self, maxsize: int = 1000, ttl: int = 300):
        """
        Initialize cache service.
        
        Args:
            maxsize: Maximum number of items in cache (default: 1000)
            ttl: Time to live in seconds (default: 300 = 5 minutes)
        """
        self.cache = TTLCache(maxsize=maxsize, ttl=ttl)
        self.maxsize = maxsize
        self.ttl = ttl
        logger.info(f"📦 CacheService initialized (maxsize={maxsize}, ttl={ttl}s)")
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        try:
            value = self.cache.get(key)
            if value is not None:
                logger.debug(f"✅ Cache HIT: {key}")
            else:
                logger.debug(f"❌ Cache MISS: {key}")
            return value
        except Exception as e:
            logger.error(f"Error getting from cache: {e}")
            return None
    
    def set(self, key: str, value: Any) -> bool:
        """Set value in cache"""
        try:
            self.cache[key] = value
            logger.debug(f"💾 Cached: {key}")
            return True
        except Exception as e:
            logger.error(f"Error setting cache: {e}")
            return False
    
    def delete(self, key: str) -> bool:
        """Delete key from cache"""
        try:
            if key in self.cache:
                del self.cache[key]
                logger.debug(f"🗑️  Cache invalidated: {key}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error deleting from cache: {e}")
            return False
    
    def clear(self, pattern: Optional[str] = None) -> int:
        """
        Clear cache entries.
        
        Args:
            pattern: Optional pattern to match keys (if None, clears all)
        
        Returns:
            Number of keys cleared
        """
        if pattern is None:
            # Clear all
            count = len(self.cache)
            self.cache.clear()
            logger.info(f"🗑️  Cache cleared: {count} entries")
            return count
        
        # Clear matching keys
        keys_to_delete = [key for key in self.cache.keys() if pattern in str(key)]
        for key in keys_to_delete:
            del self.cache[key]
        logger.info(f"🗑️  Cache cleared (pattern='{pattern}'): {len(keys_to_delete)} entries")
        return len(keys_to_delete)
    
    def invalidate_pattern(self, pattern: str) -> int:
        """
        Invalidate all cache keys matching a pattern.
        
        Args:
            pattern: Pattern to match in cache keys
        
        Returns:
            Number of keys invalidated
        """
        return self.clear(pattern=pattern)
    
    def stats(self) -> dict:
        """Get cache statistics"""
        return {
            "size": len(self.cache),
            "maxsize": self.maxsize,
            "ttl": self.ttl,
            "currsize": self.cache.currsize
        }


# Global cache instance
# Dashboard cache: 5 minutes TTL
dashboard_cache = CacheService(maxsize=100, ttl=300)

# List endpoints cache: 2 minutes TTL
list_cache = CacheService(maxsize=500, ttl=120)


def cached(cache_instance: CacheService, key_prefix: str = ""):
    """
    Decorator to cache function results.
    
    Args:
        cache_instance: CacheService instance to use
        key_prefix: Prefix for cache keys
    
    Usage:
        @cached(list_cache, key_prefix="users_list")
        def get_users(...):
            ...
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key from function name, args, and kwargs
            cache_key_parts = [key_prefix, func.__name__]
            
            # Add args (skip 'self' or 'db' if present)
            for arg in args:
                if hasattr(arg, '__class__') and arg.__class__.__name__ in ['Session', 'UserService', 'SessionService']:
                    continue  # Skip ORM session and service instances
                cache_key_parts.append(str(arg))
            
            # Add kwargs (sorted for consistency)
            for key, value in sorted(kwargs.items()):
                if key in ['db', 'current_user', 'current_user_role']:
                    continue  # Skip these from cache key
                cache_key_parts.append(f"{key}:{value}")
            
            cache_key = "_".join(cache_key_parts)
            
            # Try to get from cache
            cached_value = cache_instance.get(cache_key)
            if cached_value is not None:
                return cached_value
            
            # Call function and cache result
            result = func(*args, **kwargs)
            cache_instance.set(cache_key, result)
            return result
        
        # Add cache invalidation method to function
        wrapper.invalidate = lambda pattern=None: cache_instance.invalidate_pattern(pattern or key_prefix)
        
        return wrapper
    return decorator

