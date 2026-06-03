import { useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';

export function useRefreshOnFocus(refetch: () => void) {
  const firstFocus = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      refetch();
    }, [refetch])
  );
}
