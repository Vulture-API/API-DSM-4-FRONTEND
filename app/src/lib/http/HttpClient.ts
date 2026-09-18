/** Porta HTTP para a futura integração; não define URLs, payloads ou DTOs. */
export interface HttpClient {
  request(url: URL, options?: RequestInit): Promise<Response>;
}

export class FetchHttpClient implements HttpClient {
  request(url: URL, options?: RequestInit): Promise<Response> {
    return fetch(url, options);
  }
}
