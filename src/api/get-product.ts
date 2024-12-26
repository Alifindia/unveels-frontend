import { useQuery } from "@tanstack/react-query";
import { baseUrl, buildSearchParams } from "../utils/apiUtils";
import { defaultHeaders, Product } from "./shared";

const lipsKey = {
  product: ({ sku }: { sku: string }) => ["product", sku],
};

export function useSingleProductQuery({ sku }: { sku: string }) {
  return useQuery({
    queryKey: lipsKey.product({
      sku: sku,
    }),
    queryFn: async () => {
      const filters = [
        {
          filters: [
            {
              field: "type_id",
              value: "simple",
              condition_type: "eq",
            },
          ],
        },
        {
          filters: [
            {
              field: "sku",
              value: sku,
              condition_type: "eq",
            },
          ],
        },
      ];

      const response = await fetch(
        baseUrl + "/rest/V1/products?" + buildSearchParams(filters),
        {
          headers: defaultHeaders,
        },
      );

      const results = (await response.json()) as {
        items: Array<Product>;
      };

      if (results.items.length === 0) {
        throw new Error("No product found");
      }

      return results.items[0];
    },
  });
}

export function useMultipleProductsQuery({ skus }: { skus: string[] }) {
  return useQuery({
    queryKey: ["products", skus],
    queryFn: async () => {
      const filters = [
        {
          filters: [
            {
              field: "sku",
              value: skus.join(","),
              condition_type: "in",
            },
          ],
        },
      ];

      const response = await fetch(
        baseUrl + "/rest/V1/products?" + buildSearchParams(filters),
        {
          headers: defaultHeaders,
        },
      );

      const results = (await response.json()) as {
        items: Array<Product>;
      };

      if (results.items.length === 0) {
        throw new Error("No products found");
      }

      return results.items;
    },
  });
}

export function useProducts({
  product_type_key,
  type_ids,
}: {
  product_type_key: string;
  type_ids: string[];
}) {
  return useQuery({
    queryKey: ["products", product_type_key, type_ids],
    queryFn: async () => {
      const filters = [
        // {
        //   filters: [
        //     {
        //       field: "type_id",
        //       value: "simple",
        //       condition_type: "eq",
        //     },
        //   ],
        // },
        {
          filters: [
            {
              field: product_type_key,
              value: type_ids.join(","),
              condition_type: "in",
            },
          ],
        },
      ];

      const response = await fetch(
        baseUrl + "/rest/V1/products?" + buildSearchParams(filters),
        {
          headers: defaultHeaders,
        },
      );

      return response.json() as Promise<{
        items: Array<Product>;
      }>;
    },
  });
}
