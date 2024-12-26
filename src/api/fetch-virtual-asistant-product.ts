import { defaultHeaders, Product } from "./shared";
import { generateMagentoQueries } from "../utils/virtualAssistantUtils";
import { ProductRequest } from "../types/productRequest";

export async function fetchVirtualAssistantProduct(
  products: ProductRequest[],
  categories: Category[],
): Promise<Product[]> {
  const queries = generateMagentoQueries(products, categories);
  console.log(queries);

  const results = await Promise.all(
    queries.map(async (query) => {
      const response = await fetch(`/rest/V1/products?${query}`, {
        headers: defaultHeaders,
      });
      const data = await response.json();
      return data.items as Product[];
    }),
  );

  return results.flat();
}
