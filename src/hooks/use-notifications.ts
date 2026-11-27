import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

import { useApiResource } from '@/hooks/use-api-resource';
import { apiGet } from '@/lib/api';
import type { NotificationItem } from '@/types/api';

/** GET /notifications, disegarkan diam-diam tiap layar pemakai kembali fokus. */
export function useNotifications(key = 'notifications') {
  const resource = useApiResource(key, () => apiGet<NotificationItem[]>('/notifications'));
  const { refresh } = resource;
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      refresh();
    }, [refresh])
  );
  const unread = (resource.data ?? []).filter((n) => !n.read).length;
  return { ...resource, unread };
}
