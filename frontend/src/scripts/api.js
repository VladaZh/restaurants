const API_CONFIG = {
  baseUrl: "http://localhost:8000", 
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json"
  },
  timeoutMs: 10000
};

const getResponseData = (res) => {
  if (res.ok) return res.json();
  return res.json().then(data => 
    Promise.reject({ 
      status: res.status, 
      detail: data.detail || res.statusText 
    })
  ).catch(() => 
    Promise.reject({ 
      status: res.status, 
      detail: res.statusText 
    })
  );
};

export const sendReservation = (reservationData) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeoutMs);

  return fetch(`${API_CONFIG.baseUrl}/send-form/`, {
    method: "POST",
    headers: API_CONFIG.headers,
    body: JSON.stringify(reservationData),
    signal: controller.signal
  })
    .then(getResponseData)
    .finally(() => clearTimeout(timeoutId));
};