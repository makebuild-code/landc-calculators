import { ENDPOINTS } from 'src/mct/shared/constants';
import { fetchData } from '../../common/fetchData';
import type { ProductsRequest, ProductsResponse } from '$mct/types';

export const fetchProducts = async (input: ProductsRequest): Promise<ProductsResponse> => {
  return fetchData<ProductsResponse>(ENDPOINTS.products, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input }),
  });
};
