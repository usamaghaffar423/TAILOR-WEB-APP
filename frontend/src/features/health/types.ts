export type CheckStatus = 'pending' | 'ok' | 'slow' | 'error';

export type HealthModule = 'core' | 'tailoring' | 'retail';

export interface HealthCheck {
  id: string;
  label: string;
  endpoint: string;
  method: 'GET';
  requiresAuth: boolean;
  module: HealthModule;
}

export interface CheckResult {
  id: string;
  status: CheckStatus;
  httpStatus: number | null;
  responseTimeMs: number | null;
  error: string | null;
  checkedAt: string;
}

export interface PingResponse {
  status: string;
  db_status: string;
  db_latency: number | null;
  php_version: string;
  laravel: string;
  timestamp: string;
}
