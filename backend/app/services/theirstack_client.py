import asyncio
import logging
from typing import Any, Dict, Optional

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from app.core.config import settings

logger = logging.getLogger(__name__)


class TheirStackClientError(Exception):
    """Base exception for TheirStack client errors."""


class TheirStackAuthenticationError(TheirStackClientError):
    """Raised when authentication with TheirStack fails."""


class TheirStackRetryableError(TheirStackClientError):
    """Raised for retryable TheirStack API errors."""


class TheirStackClient:
    """Async client for interacting with the TheirStack Jobs API."""

    def __init__(
        self,
        base_url: str = settings.their_stack_base_url,
        api_key: str = settings.their_stack_api_key,
        timeout: int = settings.their_stack_timeout,
        max_retries: int = settings.their_stack_max_retries,
    ) -> None:
        self._base_url = base_url.rstrip("/")
        self._api_key = api_key
        self._timeout = timeout
        self._max_retries = max_retries
        self._client: Optional[httpx.AsyncClient] = None
        self._lock = asyncio.Lock()

    async def _get_client(self) -> httpx.AsyncClient:
        async with self._lock:
            if self._client is None:
                headers = {
                    "Authorization": f"Bearer {self._api_key}",
                    "Accept": "application/json",
                }
                self._client = httpx.AsyncClient(
                    base_url=self._base_url,
                    timeout=self._timeout,
                    headers=headers,
                )
            return self._client

    async def close(self) -> None:
        async with self._lock:
            if self._client is not None:
                await self._client.aclose()
                self._client = None

    def _validate_payload(self, payload: Dict[str, Any]) -> None:
        if not payload:
            raise ValueError("Payload must not be empty")

        has_date_filter = any(
            key in payload and payload.get(key) is not None
            for key in ("posted_at_max_age_days", "posted_at_gte", "posted_at_lte")
        )
        if not has_date_filter:
            raise ValueError(
                "Payload must include one of posted_at_max_age_days or posted_at_gte/lte"
            )

    @retry(
        reraise=True,
        stop=stop_after_attempt(settings.their_stack_max_retries),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        retry=retry_if_exception_type(TheirStackRetryableError),
    )
    async def _post_with_retry(self, endpoint: str, json: Dict[str, Any]) -> httpx.Response:
        client = await self._get_client()
        try:
            response = await client.post(endpoint, json=json)
        except httpx.RequestError as exc:  # Network related errors
            logger.warning("TheirStack request error: %s", exc)
            raise TheirStackRetryableError(str(exc)) from exc

        if response.status_code in {401, 403}:
            logger.warning("TheirStack authentication issue (status %s)", response.status_code)
            raise TheirStackAuthenticationError(response.text)

        if response.status_code in {429} or 500 <= response.status_code < 600:
            logger.warning(
                "TheirStack API returned retryable status %s: %s",
                response.status_code,
                response.text,
            )
            raise TheirStackRetryableError(response.text)

        if 400 <= response.status_code < 500:
            logger.error(
                "TheirStack API returned client error %s: %s",
                response.status_code,
                response.text,
            )
            raise TheirStackClientError(
                f"Client error {response.status_code}: {response.text}"
            )

        return response

    async def search_jobs(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Search for jobs using TheirStack's job search endpoint."""
        self._validate_payload(payload)

        # Ensure pagination defaults
        if "page" not in payload and "offset" not in payload:
            payload.setdefault("page", 1)
        payload.setdefault("limit", settings.max_jobs_per_search)

        try:
            response = await self._post_with_retry("/v1/jobs/search", json=payload)
        except TheirStackAuthenticationError as exc:
            raise TheirStackAuthenticationError(
                "Failed to authenticate with TheirStack API"
            ) from exc
        except TheirStackRetryableError:
            logger.error(
                "TheirStack API request failed after %s retries", self._max_retries
            )
            raise

        try:
            data = response.json()
        except ValueError as exc:
            logger.error("Invalid JSON response from TheirStack: %s", exc)
            raise TheirStackClientError("Invalid JSON response from TheirStack") from exc

        return data


# Global client instance
their_stack_client = TheirStackClient()
