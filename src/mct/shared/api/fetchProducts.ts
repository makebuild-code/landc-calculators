import type { Answers } from '../types';
import { fetchData } from '../utils/fetchData';
import { generateProductsAPIInput } from '../utils/generateProductsAPIInput';
import { ENDPOINTS } from './endpoints';
import type { ProductsRequest, ProductsResponse } from './types/fetchProducts';

export const fetchProducts = async (input: ProductsRequest): Promise<ProductsResponse> => {
  return fetchData<ProductsResponse>(ENDPOINTS.products, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input }),
  });
};
