import argparse
import json
import random
import threading
import time
import urllib.error
import urllib.request
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta

RESTAURANTS = ["Roma", "Firenze"]


def random_phone(prefix: str) -> str:
    return prefix + "".join(random.choices("0123456789", k=7))


def slot(days_ahead: int, hour: int, minute: int) -> str:
    when = datetime.now() + timedelta(days=days_ahead)
    when = when.replace(hour=hour, minute=minute, second=0, microsecond=0)
    return when.strftime("%Y-%m-%dT%H:%M")


def normal_payload(phone_prefix: str) -> dict:
    return {
        "name": "Load Test",
        "phone_number": random_phone(phone_prefix),
        "email": f"load{random.randint(1, 10**9)}@example.com",
        "reservation_date": slot(
            random.randint(1, 365),
            random.randint(9, 20),
            random.choice([0, 15, 30, 45]),
        ),
        "number_of_guests": random.randint(2, 6),
        "restaurant_name": random.choice(RESTAURANTS),
    }


def make_fill_payload_factory(phone_prefix: str):
    fixed_date = slot(random.randint(30, 300), 19, 0)

    def factory() -> dict:
        return {
            "name": "Load Test",
            "phone_number": random_phone(phone_prefix),
            "email": f"fill{random.randint(1, 10**9)}@example.com",
            "reservation_date": fixed_date,
            "number_of_guests": 2,
            "restaurant_name": "Roma",
        }

    return factory


def send(url: str, payload: dict, timeout: float):
    body = json.dumps(payload).encode()
    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        method="POST",
    )
    started = time.monotonic()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            code, text = resp.status, resp.read().decode(errors="replace")
    except urllib.error.HTTPError as e:
        code, text = e.code, e.read().decode(errors="replace")
    except Exception as e:
        code, text = 0, str(e)
    return code, text, time.monotonic() - started


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawTextHelpFormatter)
    parser.add_argument("--url", required=True, help="адрес фронтенда, например http://127.0.0.1:52926")
    parser.add_argument("--mode", choices=["normal", "fill"], default="normal")
    parser.add_argument("--rps", type=float, default=2.0, help="запросов в секунду (по умолчанию 2)")
    parser.add_argument("--duration", type=int, default=0, help="длительность, сек (0 - до Ctrl+C)")
    parser.add_argument("--concurrency", type=int, default=8)
    parser.add_argument("--timeout", type=float, default=10.0)
    parser.add_argument("--phone-prefix", default="+7916", help="префикс телефона (должен давать валидный номер)")
    args = parser.parse_args()

    endpoint = args.url.rstrip("/") + "/api/send-form/"
    make_payload = (
        make_fill_payload_factory(args.phone_prefix)
        if args.mode == "fill"
        else (lambda: normal_payload(args.phone_prefix))
    )

    code, text, _ = send(endpoint, make_payload(), args.timeout)
    print(f"пробный запрос: HTTP {code} {text[:200]}")
    if code == 422:
        raise SystemExit("422: данные не прошли валидацию, проверьте --phone-prefix")
    if code == 0:
        raise SystemExit("сервис недоступен, проверьте --url")

    stats = Counter()
    latency_sum = 0.0
    lock = threading.Lock()

    def worker():
        nonlocal latency_sum
        code, _, took = send(endpoint, make_payload(), args.timeout)
        with lock:
            stats[code] += 1
            latency_sum += took


    print(f"режим={args.mode} rps={args.rps} -> {endpoint}")
    interval = 1.0 / args.rps
    started = time.monotonic()
    last_report = started
    next_send = started

    try:
        with ThreadPoolExecutor(max_workers=args.concurrency) as pool:
            while args.duration == 0 or time.monotonic() - started < args.duration:
                pool.submit(worker)
                next_send += interval
                time.sleep(max(0.0, next_send - time.monotonic()))

                if time.monotonic() - last_report >= 5:
                    with lock:
                        total = sum(stats.values())
                        avg_ms = latency_sum / total * 1000 if total else 0
                        summary = ", ".join(f"{c}: {n}" for c, n in sorted(stats.items()))
                    print(f"[{int(time.monotonic() - started):>4} с] всего {total}; {summary}; средняя задержка {avg_ms:.0f} мс")
                    last_report = time.monotonic()
    except KeyboardInterrupt:
        print("\nостановлено")


if __name__ == "__main__":
    main()
