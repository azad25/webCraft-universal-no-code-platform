"""
AI domain schemas
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

from src.common.base_schema import BaseSchema


class AIProvider(str, Enum):
    OPENAI = "openai"
    GEMINI = "gemini"
    CLAUDE = "claude"
    CUSTOM = "custom"


class ContentType(str, Enum):
    TEXT = "text"
    CODE = "code"
    IMAGE = "image"
    MARKETING = "marketing"
    SEO = "seo"
    DESIGN = "design"


class GenerateContentRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=10000)
    content_type: ContentType = ContentType.TEXT
    provider: AIProvider = AIProvider.OPENAI
    context: Dict[str, Any] = Field(default_factory=dict)
    app_id: Optional[str] = None


class GenerateImageRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=4000)
    style: str = "realistic"
    size: str = "1024x1024"
    app_id: Optional[str] = None


class DesignSuggestionsRequest(BaseModel):
    page_content: Dict[str, Any]


class SEOOptimizeRequest(BaseModel):
    content: str = Field(..., min_length=1)
    keywords: List[str] = Field(default_factory=list)
    app_id: Optional[str] = None


class AIResponse(BaseModel):
    success: bool
    data: Dict[str, Any] = Field(default_factory=dict)
    error: Optional[str] = None


class AIUsageStatsResponse(BaseModel):
    total_requests: int = 0
    total_tokens: int = 0
    total_cost_cents: int = 0
    by_provider: Dict[str, Dict[str, int]] = Field(default_factory=dict)
    by_content_type: Dict[str, Dict[str, int]] = Field(default_factory=dict)


class AIRequestBase(BaseModel):
    provider: AIProvider
    content_type: ContentType
    prompt: str
    context: Dict[str, Any] = Field(default_factory=dict)


class AIRequestCreate(AIRequestBase):
    app_id: Optional[str] = None
    user_id: str


class AIRequestResponse(BaseSchema, AIRequestBase):
    app_id: Optional[str] = None
    user_id: str
    response_data: Dict[str, Any] = Field(default_factory=dict)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    tokens_used: int = 0
    cost_cents: int = 0
    processing_time_ms: int = 0
    success: bool = True
    error_message: Optional[str] = None


class AITemplateBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category: str
    content_type: ContentType
    prompt_template: str
    variables: List[str] = Field(default_factory=list)
    example_output: Optional[str] = None


class AITemplateCreate(AITemplateBase):
    pass


class AITemplateResponse(BaseSchema, AITemplateBase):
    is_active: bool = True
    usage_count: int = 0


class ContentGenerationRequest(BaseModel):
    prompt: str = Field(..., min_length=10, max_length=2000)
    content_type: ContentType = ContentType.TEXT
    provider: AIProvider = AIProvider.OPENAI
    context: Optional[Dict[str, Any]] = None
    target_audience: Optional[str] = None
    tone: Optional[str] = Field("professional", description="Tone: professional, casual, friendly, formal")
    length: Optional[str] = Field("medium", description="Length: short, medium, long")


class ContentGenerationResponse(BaseModel):
    success: bool
    content: Optional[Dict[str, Any]] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    error: Optional[str] = None


class AppContentRequest(BaseModel):
    content_requests: List[Dict[str, Any]] = Field(..., description="List of content generation requests")
    provider: AIProvider = AIProvider.OPENAI


class PageContentRequest(BaseModel):
    sections: List[str] = Field(..., description="Page sections to generate: hero, about, features, etc.")
    provider: AIProvider = AIProvider.OPENAI


class SEOContentRequest(BaseModel):
    target_keywords: List[str] = Field(..., min_items=1, max_items=10)
    provider: AIProvider = AIProvider.OPENAI


class CodeComponentRequest(BaseModel):
    component_type: str = Field(..., description="Type of component to generate")
    requirements: Dict[str, Any] = Field(..., description="Component requirements and specifications")
    framework: str = Field("react", description="Framework: react, vue, angular")


class AIRequestBase(BaseModel):
    provider: AIProvider
    content_type: ContentType
    prompt: str
    context: Dict[str, Any] = Field(default_factory=dict)
    response_data: Dict[str, Any] = Field(default_factory=dict)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    tokens_used: int = 0
    cost_cents: int = 0
    processing_time_ms: int = 0
    success: bool = True
    error_message: Optional[str] = None


class AIRequestCreate(AIRequestBase):
    app_id: Optional[str] = None
    user_id: str


class AIRequestResponse(BaseSchema, AIRequestBase):
    app_id: Optional[str] = None
    user_id: str


class AITemplateBase(BaseModel):
    name: str = Field(..., max_length=255)
    description: Optional[str] = None
    category: str = Field(..., max_length=100)
    content_type: ContentType
    prompt_template: str
    variables: List[str] = Field(default_factory=list)
    example_output: Optional[str] = None
    is_active: bool = True


class AITemplateCreate(AITemplateBase):
    pass


class AITemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    prompt_template: Optional[str] = None
    variables: Optional[List[str]] = None
    example_output: Optional[str] = None
    is_active: Optional[bool] = None


class AITemplateResponse(BaseSchema, AITemplateBase):
    usage_count: int


class AIUsageStatsBase(BaseModel):
    date: datetime
    provider: AIProvider
    content_type: ContentType
    requests_count: int = 0
    tokens_used: int = 0
    cost_cents: int = 0


class AIUsageStatsCreate(AIUsageStatsBase):
    user_id: str


class AIUsageStatsResponse(BaseSchema, AIUsageStatsBase):
    user_id: str


class AIUsageStatsQuery(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    provider: Optional[AIProvider] = None
    content_type: Optional[ContentType] = None
    group_by: str = Field("day", description="Group by: day, week, month")


class ImageGenerationRequest(BaseModel):
    prompt: str = Field(..., min_length=10, max_length=1000)
    style: Optional[str] = Field("realistic", description="Style: realistic, artistic, cartoon, etc.")
    size: str = Field("1024x1024", description="Image size: 256x256, 512x512, 1024x1024")
    provider: AIProvider = AIProvider.OPENAI


class DesignSuggestionRequest(BaseModel):
    app_type: str = Field(..., description="Type of app: business, portfolio, ecommerce, etc.")
    industry: Optional[str] = None
    color_preferences: Optional[List[str]] = None
    style_preferences: Optional[List[str]] = None


class SEOOptimizationRequest(BaseModel):
    content: str = Field(..., min_length=100)
    target_keywords: List[str] = Field(..., min_items=1, max_items=10)
    content_type: str = Field("webpage", description="Type: webpage, blog, product, etc.")


class CodeGenerationRequest(BaseModel):
    description: str = Field(..., min_length=20)
    language: str = Field("javascript", description="Programming language")
    framework: Optional[str] = None
    requirements: Optional[List[str]] = None