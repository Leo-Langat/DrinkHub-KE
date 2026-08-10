import http from 'k6/http';
import { check, sleep } from 'k6';

// K6 Load Test Configuration: Peak Happy Hour 500+ Virtual Users
export const options = {
  stages: [
    { duration: '30s', target: 100 }, // Ramp-up to 100 table sessions
    { duration: '1m', target: 500 },  // Sustained peak load 500 concurrent sessions
    { duration: '30s', target: 0 },   // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<300'], // 95% of requests must complete under 300ms
    http_req_failed: ['rate<0.01'],   // Error rate below 1%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000/api/v1';

export default function () {
  // 1. Fetch Venue Menu
  const menuRes = http.get(`${BASE_URL}/menu/categories`, {
    headers: { 'X-Tenant-ID': 'a0000000-0000-0000-0000-000000000001' },
  });
  check(menuRes, {
    'Menu loaded successfully': (r) => r.status === 200,
  });

  sleep(1);

  // 2. Process M-Pesa STK Push
  const mpesaPayload = JSON.stringify({
    clubUuid: 'a0000000-0000-0000-0000-000000000001',
    orderUuid: 'b0000000-0000-0000-0000-000000000001',
    phoneNumber: '0712345678',
    amount: 1450,
    accountReference: 'TABLE-02',
  });

  const mpesaRes = http.post(`${BASE_URL}/payments/mpesa/stkpush`, mpesaPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(mpesaRes, {
    'M-Pesa STK Push dispatched under 300ms': (r) => r.status === 200,
  });

  sleep(2);
}
