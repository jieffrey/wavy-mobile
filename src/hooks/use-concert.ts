import { useApiResource } from '@/hooks/use-api-resource';
import { apiGet } from '@/lib/api';
import type { ConcertDetail } from '@/types/api';

/** GET /concerts/:id (detail + kategori tiket + sales_status). */
export function useConcert(id: string | undefined) {
  return useApiResource(id ? `concert-${id}` : null, () => apiGet<ConcertDetail>(`/concerts/${id}`));
}
