import { useEffect, useState } from 'react';

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof matchMedia === 'undefined' ? false : matchMedia(query).matches,
  );
  useEffect(() => {
    const mql = matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

/** Desktop layout at ≥1024px; below that the phone layout (sheets, tab bar). */
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');
