"""Pydantic schemas for request/response validation."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


# User schemas
class UserBase(BaseModel):
    """Base user schema."""

    email: str = Field(..., description="User email address")
    name: Optional[str] = Field(None, description="User full name")
    username: Optional[str] = Field(None, description="Username")


class UserCreate(UserBase):
    """Schema for creating a user."""

    password: Optional[str] = Field(None, description="User password")


class UserResponse(UserBase):
    """Schema for user response."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime


# Mortgage schemas
class MortgageBase(BaseModel):
    """Base mortgage schema."""

    principal: float = Field(..., gt=0, description="Original loan principal")
    current_balance: float = Field(..., gt=0, description="Current outstanding balance")
    interest_rate: float = Field(..., gt=0, description="Annual interest rate (as percentage)")
    monthly_payment: float = Field(..., gt=0, description="Monthly payment amount")
    start_date: datetime = Field(..., description="Loan start date")
    term_months: int = Field(..., gt=0, description="Loan term in months")
    monthly_income: Optional[float] = Field(None, gt=0, description="Monthly household income")
    monthly_expenses: Optional[float] = Field(None, gt=0, description="Monthly expenses")


class MortgageCreate(MortgageBase):
    """Schema for creating a mortgage."""

    user_id: str = Field(..., description="User ID who owns the mortgage")


class MortgageUpdate(BaseModel):
    """Schema for updating a mortgage."""

    current_balance: Optional[float] = Field(None, gt=0)
    monthly_payment: Optional[float] = Field(None, gt=0)
    interest_rate: Optional[float] = Field(None, gt=0)


class MortgageResponse(MortgageBase):
    """Schema for mortgage response."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime


# HELOC schemas
class HELOCBase(BaseModel):
    """Base HELOC schema."""

    credit_limit: float = Field(..., gt=0, description="Credit line limit")
    current_balance: float = Field(..., ge=0, description="Current balance")
    interest_rate: float = Field(..., gt=0, description="Annual interest rate")
    minimum_payment: float = Field(..., gt=0, description="Minimum monthly payment")


class HELOCCreate(HELOCBase):
    """Schema for creating a HELOC."""

    mortgage_id: str = Field(..., description="Associated mortgage ID")


class HELOCResponse(HELOCBase):
    """Schema for HELOC response."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    mortgage_id: str
    created_at: datetime
    updated_at: datetime


# Payment schemas
class PaymentBase(BaseModel):
    """Base payment schema."""

    amount: float = Field(..., gt=0, description="Payment amount")
    payment_date: datetime = Field(..., description="Payment date")
    payment_type: str = Field(..., description="Payment type (regular, chunk, extra)")
    principal_paid: float = Field(..., ge=0, description="Amount applied to principal")
    interest_paid: float = Field(..., ge=0, description="Amount applied to interest")
    remaining_balance: float = Field(..., ge=0, description="Balance after payment")


class PaymentCreate(PaymentBase):
    """Schema for creating a payment."""

    mortgage_id: str = Field(..., description="Associated mortgage ID")


class PaymentResponse(PaymentBase):
    """Schema for payment response."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    mortgage_id: str
    status: str
    created_at: datetime


# Payment strategy schemas
class PaymentStrategyBase(BaseModel):
    """Base payment strategy schema."""

    strategy_type: str = Field(..., description="Strategy type (standard, velocity, custom)")
    chunk_amount: float = Field(..., gt=0, description="Chunk payment amount")
    frequency: str = Field(..., description="Payment frequency (monthly, quarterly, annual)")
    projected_months_to_payoff: int = Field(..., gt=0, description="Projected months to payoff")
    total_interest_saved: float = Field(..., ge=0, description="Total interest saved")


class PaymentStrategyCreate(PaymentStrategyBase):
    """Schema for creating a payment strategy."""

    mortgage_id: str = Field(..., description="Associated mortgage ID")


class PaymentStrategyResponse(PaymentStrategyBase):
    """Schema for payment strategy response."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    mortgage_id: str
    created_at: datetime


# Amortization schedule entry
class AmortizationEntry(BaseModel):
    """Single amortization schedule entry."""

    month: int
    payment: float
    principal: float
    interest: float
    balance: float


class AmortizationSchedule(BaseModel):
    """Complete amortization schedule."""

    schedule: list[AmortizationEntry]
    total_payments: float
    total_interest: float
    months_to_payoff: int
