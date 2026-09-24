export interface HttpClient {
  request(url: URL, options?: RequestInit): Promise<Response>;
}

export class FetchHttpClient implements HttpClient {
  request(url: URL, options?: RequestInit): Promise<Response> {
    return fetch(url, options);
  }
}