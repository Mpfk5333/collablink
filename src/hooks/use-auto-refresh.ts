import { useEffect, useRef, useCallback } from 'react'

/**
 * Hook qui appelle automatiquement `fetchFn` à l'intervalle donné (défaut : 5s).
 * S'arrête proprement au démontage du composant.
 * Ne bloque pas le rendu et ne montre aucun indicateur visible.
 */
export function useAutoRefresh(
  fetchFn: () => void | Promise<void>,
  intervalMs: number = 5000,
  enabled: boolean = true
) {
  const fetchRef = useRef(fetchFn)

  // Garde la référence à jour sans recréer l'interval
  useEffect(() => {
    fetchRef.current = fetchFn
  }, [fetchFn])

  useEffect(() => {
    if (!enabled) return
    const id = setInterval(() => {
      fetchRef.current()
    }, intervalMs)
    return () => clearInterval(id)
  }, [intervalMs, enabled])
}
