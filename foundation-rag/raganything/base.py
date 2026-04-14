from enum import Enum
# pylint: disable  MC8yOmFIVnBZMlhvaklQb3RvVTZWMEZwWkE9PTo2M2ViNjU1NQ==


class DocStatus(str, Enum):
    """Document processing status"""

    READY = "ready"
    HANDLING = "handling"
    PENDING = "pending"
    PROCESSING = "processing"
    PROCESSED = "processed"
    FAILED = "failed"
# fmt: off  MS8yOmFIVnBZMlhvaklQb3RvVTZWMEZwWkE9PTo2M2ViNjU1NQ==
