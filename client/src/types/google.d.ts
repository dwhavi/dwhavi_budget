/* eslint-disable @typescript-eslint/no-explicit-any */

declare namespace gapi {
  let client: {
    init(config: { apiKey?: string; discoveryDocs?: string[] }): Promise<void>
    load(url: string): Promise<void>
    drive: {
      files: {
        list(params: any): Promise<gapi.client.Response<any>>
        get(params: any): Promise<gapi.client.Response<any>>
        create(params: any): Promise<gapi.client.Response<any>>
        update(params: any): Promise<gapi.client.Response<any>>
      }
    }
  }

  namespace client {
    interface Response<T> {
      result: T
      body: string
      status: number
    }
  }
}

declare namespace google {
  namespace accounts {
    namespace oauth2 {
      interface TokenResponse {
        access_token: string
        error?: string
      }
      interface TokenClient {
        callback: ((response: TokenResponse) => void) | string
        requestAccessToken(): void
      }
      function initTokenClient(config: {
        client_id: string
        scope: string
        callback: string
      }): TokenClient
    }
    namespace id {
      function disableAutoSelect(value: boolean): void
    }
  }
}

interface Window {
  google: typeof google
  gapi: typeof gapi
}
