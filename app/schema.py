from typing import List, Optional
from pydantic import BaseModel, Field


class LineItem(BaseModel):
    """Bill ki ek item wali line."""
    description: str = Field(description="Item ka naam ya description")
    quantity: Optional[float] = Field(default=None, description="Kitni quantity")
    unit_price: Optional[float] = Field(default=None, description="Ek item ka rate")
    amount: Optional[float] = Field(default=None, description="Is line ka total amount")


class Invoice(BaseModel):
    """Poore invoice/receipt ka data."""
    vendor_name: Optional[str] = Field(default=None, description="Seller ya dukaan ka naam")
    invoice_number: Optional[str] = Field(default=None, description="Invoice ya bill number")
    date: Optional[str] = Field(default=None, description="Bill ki date, YYYY-MM-DD format mein")
    line_items: List[LineItem] = Field(default_factory=list, description="Saare items ki list")
    subtotal: Optional[float] = Field(default=None, description="Tax se pehle ka total")
    discount: Optional[float] = Field(default=None, description="Total discount amount as a positive number, null if no discount")
    tax_rate: Optional[float] = Field(default=None, description="Tax rate in percent, e.g. 5 for 5%, null if not shown")
    tax: Optional[float] = Field(default=None, description="Total tax amount")
    total: Optional[float] = Field(default=None, description="Final payable amount")
    currency: Optional[str] = Field(default=None, description="Currency, jaise INR, USD")
    has_signature: Optional[bool] = Field(default=None, description="Kya document par signature ya stamp hai")