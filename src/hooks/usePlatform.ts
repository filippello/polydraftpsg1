import { PLATFORM, isPSG1 } from '@/lib/platform';

export function usePlatform() {
  return { platform: PLATFORM, isPSG1: isPSG1() };
}
