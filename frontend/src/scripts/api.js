const API_CONFIG = {
  baseUrl: "/api",
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json"
  },
  timeoutMs: 10000
};

const log = (level, event, meta = {}) => {
  const entry = {
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(),
    message: event,
    service: {
      name: "restaurant-frontend"
    },
    ...meta
  };

  console.log(JSON.stringify(entry));
};

const getResponseData = async (res) => {
  if (res.ok) {
    return res.json();
  }

  let errorDetail = res.statusText;
  try {
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await res.json();
      errorDetail = data.detail || res.statusText;
    }
  } catch (parseError) {
    log("warn", "api_parse_error_fallback", {
      status_code: res.status
    });
  }

  const err = {
    status: res.status,
    detail: errorDetail
  };

  log("error", "api_http_error", {
    status_code: err.status,
    detail: err.detail
  });

  return Promise.reject(err);
};

export const sendReservation = (reservationData) => {
  const url = `${API_CONFIG.baseUrl}/send-form/`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    log("warn", "request_timeout", { url });
    controller.abort();
  }, API_CONFIG.timeoutMs);

  return fetch(url, {
    method: "POST",
    headers: API_CONFIG.headers,
    body: JSON.stringify(reservationData),
    signal: controller.signal
  })
    .then(getResponseData)
    .catch(err => {
      if (err.name === "AbortError") {
        log("error", "request_aborted", {
          url,
          reason: "timeout"
        });
      } else if (err.status !== undefined) {
        // HTTP-ошибка уже залогирована в getResponseData
      } else {
        log("error", "request_failed", {
          url,
          error: err instanceof Error ? err.message : String(err)
        });
      }
      throw err;
    })
    .finally(() => clearTimeout(timeoutId));
};