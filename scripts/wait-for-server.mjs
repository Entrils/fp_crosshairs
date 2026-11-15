const port = process.env.PORT || '4173'
const origin = process.env.DEV_API_ORIGIN || `http://127.0.0.1:${port}`
const healthUrl = new URL('/healthz', origin)
const timeoutMs = 30_000
const startedAt = Date.now()

console.log(`[dev] Waiting for API: ${healthUrl}`)

while (Date.now() - startedAt < timeoutMs) {
  try {
    const response = await fetch(healthUrl, { signal: AbortSignal.timeout(1_500) })
    if (response.ok) {
      console.log('[dev] API is ready, starting Vite')
      process.exit(0)
    }
  } catch {
    // The server is still connecting to its development services.
  }
  await new Promise((resolve) => setTimeout(resolve, 250))
}

throw new Error(`API did not become healthy within ${timeoutMs / 1000} seconds: ${healthUrl}`)
