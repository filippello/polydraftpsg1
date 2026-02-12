import { isPSG1 } from '@/lib/platform';
import { useWalletAuthStore } from '@/stores/walletAuth';

export function getAuthHeaders(): Record<string, string> {
  if (!isPSG1()) return {};

  const jwt = useWalletAuthStore.getState().jwt;
  if (!jwt) return {};

  return { Authorization: `Bearer ${jwt}` };
}

export function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers as Record<string, string> | undefined),
  };

  return fetch(url, { ...options, headers });
}
