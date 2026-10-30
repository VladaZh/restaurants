import os
import time
import urllib.error
import urllib.request

from prometheus_client import Counter, Gauge, start_http_server

TARGETS = {
    "frontend": os.getenv("FRONTEND_URL", "http://frontend/"),
    "backend": os.getenv("BACKEND_URL", "http://backend:8000/health"),
    "api": os.getenv("API_URL", "http://frontend/api/health"),
}

TIMEOUT = float(os.getenv("PROBE_TIMEOUT", "2"))
INTERVAL = float(os.getenv("PROBE_INTERVAL", "5"))

probe_success = Gauge("probe_success", "1, если последняя проба успешна", ["target"])
probe_duration = Gauge(
    "probe_duration_seconds", "Длительность последней пробы", ["target"]
)
probe_status = Gauge(
    "probe_http_status_code", "HTTP-код последней пробы (0 - нет ответа)", ["target"]
)
probe_runs = Counter(
    "probe_runs_total", "Число проб по результатам", ["target", "result"]
)


def probe(name, url):
    started = time.monotonic()
    code = 0
    try:
        with urllib.request.urlopen(url, timeout=TIMEOUT) as resp:
            code = resp.status
    except urllib.error.HTTPError as e:
        code = e.code
    except Exception:
        code = 0
    duration = time.monotonic() - started
    ok = 200 <= code < 300

    probe_success.labels(target=name).set(1 if ok else 0)
    probe_duration.labels(target=name).set(duration)
    probe_status.labels(target=name).set(code)
    probe_runs.labels(target=name, result="success" if ok else "fail").inc()
    return ok


if __name__ == "__main__":
    for target in TARGETS:
        probe_runs.labels(target=target, result="success")
        probe_runs.labels(target=target, result="fail")
    start_http_server(8001)
    while True:
        for target, url in TARGETS.items():
            probe(target, url)
        time.sleep(INTERVAL)
