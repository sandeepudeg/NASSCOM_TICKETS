import re

def repl(path, search, repl_str, count=0):
    with open(path, 'r', encoding='utf-8') as f:
        c = f.read()
    c = re.sub(search, repl_str, c, count=count, flags=re.MULTILINE) if hasattr(search, 'pattern') else re.sub(search, repl_str, c, count, flags=re.MULTILINE)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(c)

# 1. observability.py
obs_path = "backend/config/observability.py"
with open(obs_path, 'r', encoding='utf-8') as f:
    c = f.read()
if "TracerProvider" not in c.split("\n")[14]: # roughly where my imports are
    c = c.replace("from opentelemetry.sdk.trace.export import SpanExporter", "from opentelemetry.sdk.trace.export import SpanExporter\n    from opentelemetry.sdk.trace import TracerProvider")
with open(obs_path, 'w', encoding='utf-8') as f:
    f.write(c)

# 2. pattern_detection.py
repl("backend/src/ml/pattern_detection.py", r"^\s*except:\s*$", lambda m: m.group(0).replace("except:", "except Exception:"))

# 3. structured_input_parser.py
repl("backend/src/ml/structured_input_parser.py", r"^\s*except:\s*$", lambda m: m.group(0).replace("except:", "except Exception:"))

# 4. test_dashboard_flow.py
repl("backend/tests/e2e/test_dashboard_flow.py", r"^\s*except:\s*$", lambda m: m.group(0).replace("except:", "except Exception:"))

# 5. backfill_kaggle_intelligence.py
repl("scripts/ml/backfill_kaggle_intelligence.py", r"^\s*except:\s*$", lambda m: m.group(0).replace("except:", "except Exception:"))

