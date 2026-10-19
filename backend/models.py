from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class CustomerInput(BaseModel):
    # Customer profile
    Gender: str = Field(default="Female", description="Customer gender: Female or Male")
    Senior_Citizen: str = Field(default="No", alias="Senior Citizen", description="Senior Citizen: Yes or No")
    Partner: str = Field(default="No", description="Partner: Yes or No")
    Dependents: str = Field(default="No", description="Dependents: Yes or No")
    
    # Account information
    Tenure_Months: int = Field(default=12, alias="Tenure Months", ge=0, le=120, description="Tenure in months")
    Contract: str = Field(default="Month-to-month", description="Contract: Month-to-month, One year, Two year")
    Paperless_Billing: str = Field(default="Yes", alias="Paperless Billing", description="Paperless Billing: Yes or No")
    
    # Service subscriptions
    Phone_Service: str = Field(default="Yes", alias="Phone Service", description="Phone Service: Yes or No")
    Multiple_Lines: str = Field(default="No", alias="Multiple Lines", description="Multiple Lines: Yes, No, No phone service")
    Internet_Service: str = Field(default="Fiber optic", alias="Internet Service", description="Internet Service: DSL, Fiber optic, No")
    Online_Security: str = Field(default="No", alias="Online Security", description="Online Security: Yes, No, No internet service")
    Online_Backup: str = Field(default="No", alias="Online Backup", description="Online Backup: Yes, No, No internet service")
    Device_Protection: str = Field(default="No", alias="Device Protection", description="Device Protection: Yes, No, No internet service")
    Tech_Support: str = Field(default="No", alias="Tech Support", description="Tech Support: Yes, No, No internet service")
    Streaming_TV: str = Field(default="No", alias="Streaming TV", description="Streaming TV: Yes, No, No internet service")
    Streaming_Movies: str = Field(default="No", alias="Streaming Movies", description="Streaming Movies: Yes, No, No internet service")
    
    # Billing and payment
    Payment_Method: str = Field(default="Electronic check", alias="Payment Method", description="Payment Method: Electronic check, Mailed check, Bank transfer (automatic), Credit card (automatic)")
    Monthly_Charges: float = Field(default=70.0, alias="Monthly Charges", ge=0.0, description="Monthly charges in USD")
    Total_Charges: Optional[float] = Field(default=None, alias="Total Charges", description="Total charges in USD (auto-computed as Monthly * Tenure if omitted)")

    class Config:
        populate_by_name = True

class ModelTrainConfig(BaseModel):
    criterion: str = Field(default="gini", description="Split criterion: gini or entropy")
    max_depth: Optional[int] = Field(default=5, ge=1, le=20, description="Max tree depth")
    min_samples_leaf: int = Field(default=20, ge=1, le=500, description="Minimum samples per leaf")
    ccp_alpha: float = Field(default=0.0, ge=0.0, le=0.1, description="Complexity pruning alpha parameter")

class DecisionPathStep(BaseModel):
    node_id: int
    feature: Optional[str] = None
    feature_name_clean: Optional[str] = None
    rule_condition: str
    user_value: Any = None
    satisfied: bool
    samples: int
    impurity: float
    churn_probability: float
    is_leaf: bool

class PredictionResponse(BaseModel):
    prediction: str # "Likely to churn" / "Not likely to churn"
    churn_label: int # 1 or 0
    churn_probability: float # 0.0 - 1.0
    risk_level: str # "Low", "Moderate", "High"
    risk_color: str # "green", "yellow", "red"
    decision_path: List[DecisionPathStep]
    key_drivers: List[str]
    model_criterion: str
    model_max_depth: Optional[int]
    timestamp: str

class BatchPredictionResponse(BaseModel):
    total_records: int
    churn_count: int
    retained_count: int
    predicted_churn_rate: float
    predictions: List[Dict[str, Any]]
