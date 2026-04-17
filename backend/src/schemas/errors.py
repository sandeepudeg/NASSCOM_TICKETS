from typing import Any

from pydantic import BaseModel, Field


class ProblemDetail(BaseModel):
    type: str
    title: str
    status: int
    detail: str | None = None
    instance: str | None = None
    extensions: dict[str, Any] = Field(default_factory=dict)


def create_error(
    status: int,
    title: str,
    detail: str | None = None,
    error_type: str = "about:blank",
    instance: str | None = None,
    **kwargs,
) -> ProblemDetail:
    return ProblemDetail(
        type=error_type,
        title=title,
        status=status,
        detail=detail,
        instance=instance,
        extensions=kwargs,
    )


class HTTPError(Exception):
    def __init__(self, problem: ProblemDetail):
        self.problem = problem
        super().__init__(problem.detail)

    @staticmethod
    def not_found(
        detail: str = "Resource not found", resource_id: str | None = None
    ) -> "HTTPError":
        return HTTPError(
            create_error(
                404, "Not Found", detail, "urn:tickets:error:not-found", resource_id
            )
        )

    @staticmethod
    def bad_request(detail: str = "Bad request", **kwargs) -> "HTTPError":
        return HTTPError(
            create_error(
                400, "Bad Request", detail, "urn:tickets:error:bad-request", **kwargs
            )
        )

    @staticmethod
    def conflict(detail: str = "Conflict", **kwargs) -> "HTTPError":
        return HTTPError(
            create_error(
                409, "Conflict", detail, "urn:tickets:error:conflict", **kwargs
            )
        )

    @staticmethod
    def validation_error(detail: str = "Validation error", **kwargs) -> "HTTPError":
        return HTTPError(
            create_error(
                422,
                "Validation Error",
                detail,
                "urn:tickets:error:validation",
                **kwargs,
            )
        )

    @staticmethod
    def too_many_requests(
        detail: str = "Rate limit exceeded", retry_after: int | None = None
    ) -> "HTTPError":
        return HTTPError(
            create_error(
                429,
                "Too Many Requests",
                detail,
                "urn:tickets:error:rate-limit",
                retry_after=retry_after,
            )
        )

    @staticmethod
    def internal_error(detail: str = "Internal server error") -> "HTTPError":
        return HTTPError(
            create_error(
                500, "Internal Server Error", detail, "urn:tickets:error:internal"
            )
        )
