import { APIClient } from '../client/APIClient';
import { API_CONFIG } from '$mct/config';
import type { ProductsRequest, ProductsResponse } from '$mct/types';

export class ProductsAPI {
  constructor(private client: APIClient) {}

  async search(request: ProductsRequest): Promise<ProductsResponse> {
    console.log('🔄 [ProductsAPI] Request: ', request);
    return this.client.request<ProductsResponse>(API_CONFIG.endpoints.products, {
      method: 'POST',
      body: JSON.stringify({ input: request }),
    });
  }
}
