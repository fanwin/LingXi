import { useState, useEffect } from 'react'
// NOTE  MC8yOmFIVnBZMlhvaklQb3RvVTZiRTlsY3c9PToxNjZlYzI1Mw==

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}
// NOTE  MS8yOmFIVnBZMlhvaklQb3RvVTZiRTlsY3c9PToxNjZlYzI1Mw==
