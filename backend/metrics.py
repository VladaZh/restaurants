from prometheus_client import Counter, Histogram

reservations_created_total = Counter(
    "reservations_created_total",
    "Number of successfully created reservations",
    ["restaurant"],
)

reservations_rejected_total = Counter(
    "reservations_rejected_total",
    "Number of rejected reservation requests",
    ["reason"],
)

reservation_guests = Histogram(
    "reservation_guests",
    "Number of guests per reservation",
    buckets=[1, 2, 3, 4, 5, 6, 7, 8, 10, 15, 20],
)

table_search_total = Counter(
    "table_search_total",
    "Results of searching an available table",
    ["result"],
)

for reason in ("validation", "duplicate", "create_failed"):
    reservations_rejected_total.labels(reason=reason)

for result in ("found", "not_found"):
    table_search_total.labels(result=result)
