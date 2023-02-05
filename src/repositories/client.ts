import { ssrExchange, createClient, dedupExchange, cacheExchange, fetchExchange } from '@urql/core'
import type { TypedDocumentNode } from '@urql/core'
import type { DocumentNode } from 'graphql'
import { pipe, subscribe } from 'wonka'
import variables from '$lib/variables'

const isServerSide = typeof window === 'undefined'

const ssr = ssrExchange({
  isClient: !isServerSide,
  initialState: !isServerSide ? (window as any).__URQL_DATA__ : undefined,
})

export const client = (preview: boolean) =>
  createClient({
    url: `https://graphql.contentful.com/content/v1/spaces/${variables.space}/environments/${variables.environments}`,
    fetch,
    exchanges: [dedupExchange, cacheExchange, ssr, fetchExchange],
    requestPolicy: preview ? 'network-only' : 'cache-first',
    fetchOptions: () => {
      return {
        headers: {
          Authorization: `Bearer ${preview ? variables.previewApiKey : variables.apiKey}`,
        },
      }
    },
  })

export const request = (
  query: DocumentNode | TypedDocumentNode<any, object> | string,
  variables = {},
  { preview = false } = {},
) => {
  return new Promise((r) => {
    pipe(
      client(preview).query(query, variables),
      subscribe((result) => {
        r(result.data)
      }),
    )
  })
}
