from fastapi import HTTPException, status


class MANSSUException(HTTPException):
    """Base exception for MANSSU API"""
    pass


class NotFoundException(MANSSUException):
    """Resource not found exception"""
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail
        )


class UnauthorizedException(MANSSUException):
    """Unauthorized access exception"""
    def __init__(self, detail: str = "Not authenticated"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail
        )


class ForbiddenException(MANSSUException):
    """Forbidden access exception"""
    def __init__(self, detail: str = "Not authorized"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail
        )


class BadRequestException(MANSSUException):
    """Bad request exception"""
    def __init__(self, detail: str = "Bad request"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail
        )


class ConflictException(MANSSUException):
    """Conflict exception (e.g., duplicate resource)"""
    def __init__(self, detail: str = "Resource conflict"):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail
        )

