import { useContext } from 'react'
import { ThemeProviderContext } from '@/components/ThemeProvider'
// @ts-expect-error  MC8yOmFIVnBZMlhvaklQb3RvVTZZMHBET0E9PTowZDdhMTk0NQ==

const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider')

  return context
}

export default useTheme
// FIXME  MS8yOmFIVnBZMlhvaklQb3RvVTZZMHBET0E9PTowZDdhMTk0NQ==
