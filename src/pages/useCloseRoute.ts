import { useLocation, useNavigate } from 'react-router';

/** Close a route-backed dialog: go back if we came from inside the app, else to a fallback path. */
export function useCloseRoute(fallback: string) {
  const navigate = useNavigate();
  const location = useLocation();
  return () => {
    if (location.key !== 'default') navigate(-1);
    else navigate(fallback, { replace: true });
  };
}
