import json


class StructuredInputParser:
    @staticmethod
    def detect_format(payload: str) -> str:
        payload = payload.strip()
        if not payload:
            return "text"

        if payload.startswith("{") or payload.startswith("["):
            try:
                data = json.loads(payload)
                if "resourceSpans" in data or "spans" in data:
                    return "otlp_trace"
                if "alerts" in data or "labels" in data:
                    return "prometheus_alert"
                if "level" in data or "message" in data or "timestamp" in data:
                    return "json_log"
            except Exception:
                pass

        return "text"

    @staticmethod
    def parse_json_log(payload: str) -> dict:
        try:
            data = json.loads(payload)
            context = {
                "error_codes": [],
                "service_names": [],
                "severity": data.get("level", data.get("severity", "info")),
                "timestamps": [],
            }

            if "message" in data:
                context["service_names"].append(data.get("service", "unknown"))
                if "error" in data.get("message", "").lower():
                    context["error_codes"].append(data.get("code", "unknown"))

            if "timestamp" in data:
                context["timestamps"].append(data["timestamp"])

            return context
        except Exception:
            return {
                "error_codes": [],
                "service_names": [],
                "severity": "info",
                "timestamps": [],
            }

    @staticmethod
    def parse_otlp_trace(payload: str) -> dict:
        try:
            data = json.loads(payload)
            context = {
                "error_codes": [],
                "service_names": [],
                "severity": "info",
                "timestamps": [],
            }

            spans = data.get("resourceSpans", [{}])[0].get("spans", [])
            for span in spans:
                if "attributes" in span:
                    for attr in span["attributes"]:
                        if attr.get("key") == "service.name":
                            context["service_names"].append(
                                attr.get("value", "unknown")
                            )

                status = span.get("status", {})
                if status.get("code") == 2:
                    context["severity"] = "error"
                    context["error_codes"].append(
                        status.get("message", "unknown_error")
                    )

                if "startTimeUnixNano" in span:
                    context["timestamps"].append(span["startTimeUnixNano"])

            return context
        except Exception:
            return {
                "error_codes": [],
                "service_names": [],
                "severity": "info",
                "timestamps": [],
            }

    @staticmethod
    def parse_prometheus_alert(payload: str) -> dict:
        try:
            data = json.loads(payload)
            context = {
                "error_codes": [],
                "service_names": [],
                "severity": "warning",
                "timestamps": [],
            }

            alerts = data.get("alerts", [])
            for alert in alerts:
                labels = alert.get("labels", {})
                context["service_names"].append(
                    labels.get("job", labels.get("service", "unknown"))
                )
                context["severity"] = labels.get("severity", "warning")
                if labels.get("severity") == "critical":
                    context["error_codes"].append(labels.get("alertname", "unknown"))

            if "startsAt" in alerts[0]:
                context["timestamps"].append(alerts[0]["startsAt"])

            return context
        except Exception:
            return {
                "error_codes": [],
                "service_names": [],
                "severity": "warning",
                "timestamps": [],
            }

    @staticmethod
    def parse(payload: str) -> tuple[dict, str | None, str | None]:
        format_type = StructuredInputParser.detect_format(payload)
        parse_warning = None

        if format_type == "json_log":
            context = StructuredInputParser.parse_json_log(payload)
        elif format_type == "otlp_trace":
            context = StructuredInputParser.parse_otlp_trace(payload)
        elif format_type == "prometheus_alert":
            context = StructuredInputParser.parse_prometheus_alert(payload)
        else:
            parse_warning = "Unrecognized payload format, treated as plain text"
            context = {
                "error_codes": [],
                "service_names": [],
                "severity": None,
                "timestamps": [],
            }

        causal_signal = None
        if context.get("severity") in ["error", "critical"]:
            error_codes = context.get("error_codes", [])
            services = context.get("service_names", [])
            if error_codes or services:
                causal_signal = f"Detected anomaly: {', '.join(error_codes or [])} in {', '.join(services or ['services'])}"

        return context, format_type, parse_warning, causal_signal
