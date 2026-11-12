# PERMANENT SCHEMA — see app/models/user_award.py
from pydantic import BaseModel, Field
from typing import Optional


class UserAwardWinResponse(BaseModel):
    id: str
    awardName: str = Field(..., alias="award_name")
    awardIcon: Optional[str] = Field(None, alias="award_icon")
    year: int
    isCoWinner: bool = Field(False, alias="is_co_winner")
    awardedAt: str = Field(..., alias="awarded_at")

    class Config:
        from_attributes = True
        populate_by_name = True
