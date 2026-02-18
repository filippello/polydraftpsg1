# Fix: MWA 404 Redirect on PSG1 (Android Chrome)

## Problema

En PSG1 (Retroid, Android Chrome), al presionar "Connect Wallet" el navegador redirigía a una página 404 en `jup.ag` en lugar de abrir Jupiter Mobile para la conexión de wallet.

**URL que causaba el 404:**

```
https://jup.ag/solana-wallet-adapter/v1/associate/local?association=...&port=60252&v=v1
```

**Plataforma:** PSG1 (Retroid gaming handheld) corriendo Chrome Android, sin extensiones de wallet. App desplegada en `polydraftpsg1.vercel.app` usando `@jup-ag/wallet-adapter` con `UnifiedWalletProvider`.

---

## Causa Raíz

El problema es un **bug de caching en dos niveles** del protocolo MWA (Mobile Wallet Adapter):

1. **Primera conexión (funciona):** MWA usa el protocolo `solana-wallet://v1/associate/local?...`. Android lo intercepta como intent y abre Jupiter Mobile correctamente. Durante `authorize()`, Jupiter Mobile responde con `wallet_uri_base: "https://jup.ag"`.

2. **`wallet_uri_base` queda cacheado** en dos lugares:
   - **localStorage** bajo la key `SolanaMobileWalletAdapterDefaultAuthorizationCache`
   - **En memoria** en el objeto wallet

3. **Operaciones posteriores (rompe):** Cuando `signMessage()` o cualquier `transact()` subsiguiente ocurre, MWA lee el `wallet_uri_base` cacheado y construye la URL como:
   ```
   https://jup.ag/solana-wallet-adapter/v1/associate/local?association=...&port=...
   ```
   Chrome carga esta URL HTTPS como una página web normal en vez de dispararla como intent de Android. La página no existe en `jup.ag` y devuelve **404**.

**En el código fuente de MWA** (línea ~555): para URLs HTTPS llama `window.location.assign(associationUrl)`, que navega el browser. Para URLs `solana-wallet://`, Android las intercepta como intent y abre la wallet app.

---

## Intentos Previos (Fallidos)

### Intento 1: Android Intent Deeplink

**Enfoque:** Crear un `PSG1WalletButton` que abriera Jupiter Mobile directamente via Android intent:

```typescript
window.location.href = `intent://${window.location.host}${window.location.pathname}#Intent;scheme=https;package=ag.jup.jupiter.android;end`;
```

**Por qué falló:** Jupiter Mobile se abría pero el flujo de wallet no se completaba. La wallet app se abría sin permitir hacer nada.

---

### Intento 2: Jupiter Mobile Adapter con WalletConnect

**Enfoque:** Instalar `@jup-ag/jup-mobile-adapter` y usar `useWrappedReownAdapter` con Reown (WalletConnect):

```typescript
import { useWrappedReownAdapter } from '@jup-ag/jup-mobile-adapter';

const { jupiterAdapter } = useWrappedReownAdapter({
  appKitOptions: {
    metadata: { name: 'Polydraft', ... },
    projectId: '01b9a854692b1f29a6aa2bb46f8c0520',
  },
});
```

**Por qué falló:** `UnifiedWalletProvider` internamente llama `registerMwa()`, que detecta Android y toma control antes de que WalletConnect pueda actuar. El navegador se colgaba al presionar "Connect Wallet".

---

### Intento 2b: Forzar Modal (bypass MWA auto-detect)

**Enfoque:** Usar `useUnifiedWalletContext` para forzar el modal de wallet en PSG1:

```typescript
const { setShowModal } = useUnifiedWalletContext();
// onClick: setShowModal(true)
```

**Por qué falló:** Incluso con el modal forzado, MWA seguía interceptando internamente la conexión.

**Commit:** `fix: force wallet modal on PSG1, bypass MWA auto-detect`

---

### Intento 3: Limpiar `wallet_uri_base` de localStorage al cargar la página

**Enfoque:** `useEffect` que borra `wallet_uri_base` del cache de MWA en localStorage al iniciar:

```typescript
useEffect(() => {
  const cacheKey = 'SolanaMobileWalletAdapterDefaultAuthorizationCache';
  const cached = localStorage.getItem(cacheKey);
  if (!cached) return;
  const parsed = JSON.parse(cached);
  if (parsed?.wallet_uri_base) {
    delete parsed.wallet_uri_base;
    localStorage.setItem(cacheKey, JSON.stringify(parsed));
  }
}, []);
```

**Por qué falló:** `authorize()` funciona (primera firma OK), pero inmediatamente escribe `wallet_uri_base` de vuelta al cache. Cuando `signMessage()` dispara el siguiente `transact()`, lee el valor recién cacheado y navega a `https://jup.ag/...` -> 404.

**Commit:** `fix: revert wallet to original + fix MWA 404 on Android`

---

### Intento 4: Interceptar `Storage.prototype.setItem`

**Enfoque:** Parchear `Storage.prototype.setItem` para stripear `wallet_uri_base` de cada escritura a la cache key de MWA:

```typescript
const originalSetItem = Storage.prototype.setItem;
Storage.prototype.setItem = function (key: string, value: string) {
  if (key === cacheKey) {
    const parsed = JSON.parse(value);
    if (parsed?.wallet_uri_base) {
      delete parsed.wallet_uri_base;
      value = JSON.stringify(parsed);
    }
  }
  originalSetItem.call(this, key, value);
};
```

**Por qué falló:** `signMessage()` lee `wallet_uri_base` desde **memoria** en el objeto wallet, no desde localStorage. Aunque localStorage estaba limpio, el valor en memoria persistía desde la respuesta de `authorize()` y se usaba directamente para construir la URL HTTPS.

**Commit:** `fix: intercept MWA cache writes to prevent wallet_uri_base 404`

---

### Intento 5: Parchear `Location.prototype.assign`

**Enfoque:** Interceptar `Location.prototype.assign` para reescribir URLs HTTPS de MWA a protocolo `solana-wallet://`:

```typescript
const originalAssign = Location.prototype.assign;
Location.prototype.assign = function (url: string | URL) {
  const urlStr = typeof url === 'string' ? url : url.toString();
  if (urlStr.includes('/v1/associate/local')) {
    const parsed = new URL(urlStr);
    if (parsed.protocol === 'https:') {
      const rewritten = new URL('solana-wallet:/v1/associate/local');
      rewritten.search = parsed.search;
      return originalAssign.call(this, rewritten.toString());
    }
  }
  return originalAssign.call(this, url);
};
```

**Por qué falló:** Chrome Android no permite parchear `Location.prototype.assign`. El método nativo es read-only/non-configurable, el patch se ignora silenciosamente.

**Commit:** `fix: intercept Location.assign to rewrite MWA association URLs`

---

## Solucion Final: Navigation API

La solución usa la **Navigation API** (`window.navigation`, disponible desde Chrome 102+) para interceptar la navegación antes de que ocurra, con `Location.prototype.assign` como fallback.

**Por qué funciona:** La Navigation API es el mecanismo oficial del browser para interceptar navegaciones programáticas (incluyendo `window.location.assign()`). Cuando MWA llama `window.location.assign("https://jup.ag/solana-wallet-adapter/v1/associate/local?...")`, el evento `navigate` se dispara **antes** de que el browser navegue. El handler llama `event.preventDefault()` para cancelar la navegación HTTPS y luego setea `window.location.href` a la URL reescrita `solana-wallet:/v1/associate/local?...`, que Android intercepta como intent y abre Jupiter Mobile.

**Commit:** `fix: use Navigation API to intercept MWA 404 redirect`

### Archivo Modificado

`src/providers/WalletProvider.tsx`

### Código

```typescript
useEffect(() => {
  if (typeof window === 'undefined') return;
  if (!/android/i.test(navigator.userAgent)) return;

  function rewriteMwaUrl(urlStr: string): string | null {
    if (!urlStr.includes('/v1/associate/local')) return null;
    try {
      const parsed = new URL(urlStr);
      if (parsed.protocol === 'https:') {
        const rewritten = new URL('solana-wallet:/v1/associate/local');
        rewritten.search = parsed.search;
        return rewritten.toString();
      }
    } catch {
      // not a valid URL
    }
    return null;
  }

  // Strategy 1: Navigation API (Chrome 102+) - intercepts programmatic navigations
  let navController: AbortController | undefined;
  if ('navigation' in window) {
    navController = new AbortController();
    (window as any).navigation.addEventListener('navigate', (event: any) => {
      const rewritten = rewriteMwaUrl(event.destination.url);
      if (rewritten) {
        event.preventDefault();
        window.location.href = rewritten;
      }
    }, { signal: navController.signal });
  }

  // Strategy 2: Patch Location.prototype.assign as fallback
  const originalAssign = Location.prototype.assign;
  try {
    Location.prototype.assign = function (url: string | URL) {
      const urlStr = typeof url === 'string' ? url : url.toString();
      const rewritten = rewriteMwaUrl(urlStr);
      if (rewritten) {
        window.location.href = rewritten;
        return;
      }
      return originalAssign.call(this, url);
    };
  } catch {
    // Some browsers may not allow patching Location.prototype
  }

  return () => {
    navController?.abort();
    try { Location.prototype.assign = originalAssign; } catch { /* noop */ }
  };
}, []);
```

---

## Resumen de Intentos

| # | Enfoque | Resultado |
|---|---------|-----------|
| 1 | Android intent deeplink | Jupiter Mobile abre pero wallet flow roto |
| 2 | `@jup-ag/jup-mobile-adapter` + WalletConnect | MWA intercepta antes que WalletConnect; browser colgado |
| 2b | Forzar modal con `setShowModal(true)` | MWA sigue interceptando internamente |
| 3 | Limpiar `wallet_uri_base` de localStorage | `authorize()` lo re-cachea inmediatamente |
| 4 | Interceptar `Storage.prototype.setItem` | `signMessage()` lee de memoria, no de localStorage |
| 5 | Parchear `Location.prototype.assign` | Chrome Android no permite parchear Location.prototype |
| **6** | **Navigation API + Location.assign fallback** | **Funciona** |
