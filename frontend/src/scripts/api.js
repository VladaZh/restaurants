const API_CONFIG = {
  baseUrl: "/api",
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json"
  },
  timeoutMs: 10000
};

const log = (level, event, meta = {}) => console[level]({ ts: new Date().toISOString(), level, event, ...meta });

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
    log("warn", "api_parse_error_fallback", { status: res.status });
  }

  const err = { status: res.status, detail: errorDetail };
  log("error", "api_http_error", err);
  return Promise.reject(err);
};

export const sendReservation = (reservationData) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    log("warn", "request_timeout", { url: `${API_CONFIG.baseUrl}/send-form/` });
    controller.abort();
  }, API_CONFIG.timeoutMs);

  return fetch(`${API_CONFIG.baseUrl}/send-form/`, {
    method: "POST",
    headers: API_CONFIG.headers,
    body: JSON.stringify(reservationData),
    signal: controller.signal
  })
    .then(getResponseData)
    .catch(err => {
      if (err.name === 'AbortError') {
        log("error", "request_aborted", { reason: "timeout" });
      } else {
        log("error", "request_failed", { error: err });
      }
      throw err;
    })
    .finally(() => clearTimeout(timeoutId));
};