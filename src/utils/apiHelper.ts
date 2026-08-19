/**
 * Safe fetch and JSON parse helper to completely prevent "Unexpected token" errors
 */
export async function safeFetchJson<T = any>(
  url: string, 
  options?: RequestInit, 
  fallback?: T
): Promise<{ ok: boolean; data: T; error?: string }> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        ...(options?.headers || {})
      }
    });

    const contentType = res.headers.get('content-type') || '';
    const text = await res.text();

    if (!text || text.trim() === '') {
      return { ok: res.ok, data: (fallback ?? null) as T };
    }

    // Try parsing as JSON
    try {
      const data = JSON.parse(text);
      if (!res.ok) {
        return { 
          ok: false, 
          data: (fallback ?? data) as T, 
          error: data?.error || `Error ${res.status}: ${res.statusText}` 
        };
      }
      return { ok: true, data };
    } catch {
      // Returned text was not JSON (e.g. HTML 404/500 page or plain text)
      const isHtml = text.trim().startsWith('<') || contentType.includes('text/html');
      const cleanError = isHtml 
        ? `Error del servidor (${res.status}). Por favor intenta de nuevo.` 
        : text.slice(0, 120);
      return { 
        ok: false, 
        data: (fallback ?? null) as T, 
        error: cleanError 
      };
    }
  } catch (err: any) {
    return { 
      ok: false, 
      data: (fallback ?? null) as T, 
      error: err.message || 'Error de conexión de red.' 
    };
  }
}
