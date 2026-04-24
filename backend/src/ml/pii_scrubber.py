import re

from opentelemetry import trace


class PIIScrubber:
    """
    Regex-based PII scrubber. Patterns are applied in a specific order to avoid
    shorter patterns (phone) consuming longer ones (IP, credit card, SSN) first.
    Order: email → IP → credit card → SSN/national ID → DOB → phone → address
    """

    @classmethod
    def scrub(cls, text: str) -> tuple[str, dict]:
        tracer = trace.get_tracer("ml.pii_scrubber")

        with tracer.start_as_current_span("pii.scrub") as span:
            if not text:
                return text, {"redaction_summary": {}, "total_detected": 0}

            redaction_summary = {
                "email": 0,
                "ip_address": 0,
                "credit_card": 0,
                "aadhaar": 0,
                "pan": 0,
                "gstin": 0,
                "national_id": 0,
                "date_of_birth": 0,
                "phone": 0,
                "address": 0,
            }

            scrubbed = text

            # 1. Email (must come first to avoid partial matches)
            email_pattern = r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"
            matches = re.findall(email_pattern, scrubbed)
            redaction_summary["email"] = len(matches)
            scrubbed = re.sub(email_pattern, "[EMAIL]", scrubbed)

            # 2. IPv4 addresses (before phone — xxx.xxx.xxx.xxx would match phone patterns)
            ip_pattern = r"\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b"
            matches = re.findall(ip_pattern, scrubbed)
            redaction_summary["ip_address"] = len(matches)
            scrubbed = re.sub(ip_pattern, "[IP]", scrubbed)

            # 3. Credit card numbers (16 digits in groups of 4, before phone)
            cc_pattern = r"\b(?:\d{4}[-\s]){3}\d{4}\b"
            matches = re.findall(cc_pattern, scrubbed)
            redaction_summary["credit_card"] = len(matches)
            scrubbed = re.sub(cc_pattern, "[CREDIT_CARD]", scrubbed)

            # 4. Indian Aadhaar Number ([2-9]xxx xxxx xxxx or [2-9]xxxxxxxxxxx)
            # Support spaces, dashes, or no delimiters
            aadhaar_pattern = r"\b[2-9]\d{3}[ -]?\d{4}[ -]?\d{4}\b"
            matches = re.findall(aadhaar_pattern, scrubbed)
            redaction_summary["aadhaar"] = len(matches)
            scrubbed = re.sub(aadhaar_pattern, "[AADHAAR]", scrubbed)

            # 5. Indian PAN Card (5 letters, 4 digits, 1 letter)
            # Case-insensitive to catch user inputs like abcde1234f
            pan_pattern = r"\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b"
            matches = re.findall(pan_pattern, scrubbed, re.IGNORECASE)
            redaction_summary["pan"] = len(matches)
            scrubbed = re.sub(pan_pattern, "[PAN]", scrubbed, flags=re.IGNORECASE)

            # 6. Indian GSTIN (2 digits, 5 letters, 4 digits, 1 letter, 1 digit/letter, 'Z', 1 digit/letter)
            gstin_pattern = r"\b\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}\b"
            matches = re.findall(gstin_pattern, scrubbed, re.IGNORECASE)
            redaction_summary["gstin"] = len(matches)
            scrubbed = re.sub(gstin_pattern, "[GSTIN]", scrubbed, flags=re.IGNORECASE)

            # 6. Indian PIN Code (6 digits, usually preceded by state/city or near end)
            # We match it if it's 6 digits and not part of a larger number
            pin_pattern = r"\b\d{6}\b"
            # However, this might match many things. Let's limit it to address context or labels
            # For now, we'll keep it simple but separate from phone
            matches = re.findall(pin_pattern, scrubbed)
            redaction_summary["national_id"] += len(matches) # Grouping PIN with national_id for now or just general REDACTED
            scrubbed = re.sub(pin_pattern, "[PIN_CODE]", scrubbed)

            # 6. SSN / global national ID (xxx-xx-xxxx)
            ssn_pattern = r"\b\d{3}-\d{2}-\d{4}\b"
            matches = re.findall(ssn_pattern, scrubbed)
            redaction_summary["national_id"] = len(matches)
            scrubbed = re.sub(ssn_pattern, "[NATIONAL_ID]", scrubbed)

            # 5. Date of birth patterns
            dob_patterns = [
                r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b",
                r"\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b",
            ]
            for pattern in dob_patterns:
                matches = re.findall(pattern, scrubbed, re.IGNORECASE)
                redaction_summary["date_of_birth"] += len(matches)
                scrubbed = re.sub(pattern, "[DOB]", scrubbed, flags=re.IGNORECASE)

            # 8. Phone numbers (Global support including Indian +91 and US +1)
            phone_pattern = r"\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{4}\b"
            matches = re.findall(phone_pattern, scrubbed)
            redaction_summary["phone"] = len(matches)
            scrubbed = re.sub(phone_pattern, "[PHONE]", scrubbed)

            # 7. Street addresses
            address_pattern = (
                r"\b\d+\s+[A-Za-z]+\s+"
                r"(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct|Place|Pl)\b"
            )
            matches = re.findall(address_pattern, scrubbed, re.IGNORECASE)
            redaction_summary["address"] = len(matches)
            scrubbed = re.sub(
                address_pattern, "[ADDRESS]", scrubbed, flags=re.IGNORECASE
            )

            total_detected = sum(redaction_summary.values())

            # Record metrics
            from config.observability import record_pii_redaction

            for entity_type, count in redaction_summary.items():
                if count > 0:
                    record_pii_redaction(entity_type, count)

            span.set_attribute("pii.total_detected", total_detected)
            for entity_type, count in redaction_summary.items():
                span.set_attribute(f"pii.{entity_type}", count)

            return scrubbed, {
                "redaction_summary": redaction_summary,
                "total_detected": total_detected,
            }


class PIIScrubberPresidio:
    """Alias kept for compatibility — uses the same regex implementation."""

    scrub = PIIScrubber.scrub
