const API_CONFIG = {
  baseUrl: "http://localhost:8000", 
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json"
  },
  timeoutMs: 10000
};

const log = (level, event, meta = {}) => console[level]({ ts: new Date().toISOString(), level, event, ...meta });

const getResponseData = (res) => {
  if (res.ok) return res.json();
  return res.json().then(data => {
    const err = { status: res.status, detail: data.detail || res.statusText };
    log("error", "api_error", err);
    return Promise.reject(err);
  }).catch(() => {
    const err = { status: res.status, detail: res.statusText };
    log("error", "parse_error", err);
    return Promise.reject(err);
  });
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
      log("error", "request_failed", { error: err });
      throw err;
    })
    .finally(() => clearTimeout(timeoutId));
};