import type { ProviderId, RawCheck } from '../types'

export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

export interface ProviderMeta {
  id: ProviderId
  name: string
  shortName: string
  docsUrl: string
  keyHint: string
  testEndpoint: string
  notes: string
}

export interface TestContext {
  apiKey: string
  signal: AbortSignal
  fetchFn: FetchLike
}

export interface ProviderAdapter extends ProviderMeta {
  test(ctx: TestContext): Promise<RawCheck>
}
