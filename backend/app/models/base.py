import uuid
from datetime import datetime
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import as_declarative, declared_attr
# pyrefly: ignore [missing-import]
from sqlalchemy import Column, DateTime
# pyrefly: ignore [missing-import]
from sqlalchemy.dialects.postgresql import UUID

@as_declarative()
class Base:
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, default=datetime.utcnow)

    @declared_attr
    def __tablename__(cls) -> str:
        return cls.__name__.lower() + "s" # Naive pluralization, override in subclasses if needed
