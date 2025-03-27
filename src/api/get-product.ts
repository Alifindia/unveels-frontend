import { useQuery } from "@tanstack/react-query";
import {
  baseUrl,
  buildSearchParams,
  buildSearchParamsWithOrder,
  fetchAllProducts,
  fetchAllProductsWithSort,
  getProductTypeAndTexture,
} from "../utils/apiUtils";
import { defaultHeaders, Product } from "./shared";
import { result } from "lodash";

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

      const productList = await getProductTypeAndTexture(results);

      return productList;
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
        {
          filters: [
            {
              field: product_type_key,
              value: type_ids.join(","),
              condition_type: "in",
            },
          ],
        },
        {
          filters: [
            {
              field: "type_id",
              value: "configurable,simple",
              condition_type: "in",
            },
          ],
        },
      ];

      const [productsList] = await Promise.all([
        fetch(baseUrl + "/rest/V1/products?" + buildSearchParams(filters), {
          headers: defaultHeaders,
        }),
      ]);

      const products = (await productsList.json()) as {
        items: Array<Product>;
      };

      const combinedResults = [...products.items];

      return fetchAllProducts({
        items: combinedResults,
      });
    },
  });
}

export function useProductsVTOAll({
  product_type_key,
  type_ids,
  order,
  selectedFormation,
  selectedBrand,
  selectedCountry,
  selectedSizeOne,
  selectedSizeTwo,
  minPrice,
  maxPrice,
}: {
  product_type_key: string;
  type_ids: string[];
  order: boolean;
  selectedFormation: string;
  selectedBrand: string;
  selectedCountry: string;
  selectedSizeOne: string;
  selectedSizeTwo: string;
  minPrice: number;
  maxPrice: number;
}) {
  return useQuery({
    queryKey: ["products", product_type_key, type_ids],
    queryFn: async () => {
      const filters = [
        {
          filters: [
            {
              field: product_type_key,
              value: type_ids.join(","),
              condition_type: "in",
            },
          ],
        },
        {
          filters: [
            {
              field: "type_id",
              value: "configurable,simple",
              condition_type: "in",
            },
          ],
        },
      ];

      console.log(selectedFormation);
      console.log(selectedBrand);
      console.log(selectedCountry);
      console.log(selectedSizeOne);
      console.log(selectedSizeTwo);
      console.log(minPrice);
      console.log(maxPrice);

      if (selectedFormation !== "" && selectedFormation !== null) {
        filters.push({
          filters: [
            {
              field: "formation",
              value: selectedFormation,
              condition_type: "eq",
            },
          ],
        });
      }

      if (selectedBrand !== "") {
        filters.push({
          filters: [
            {
              field: "brand",
              value: selectedBrand,
              condition_type: "eq",
            },
          ],
        });
      }

      if (selectedCountry !== "") {
        filters.push({
          filters: [
            {
              field: "made_in",
              value: selectedCountry,
              condition_type: "finset",
            },
          ],
        });
      }

      if (selectedSizeOne !== "") {
        filters.push({
          filters: [
            {
              field: "size",
              value: selectedSizeOne,
              condition_type: "eq",
            },
          ],
        });
      }

      if (selectedSizeTwo !== "") {
        filters.push({
          filters: [
            {
              field: "size",
              value: selectedSizeTwo,
              condition_type: "eq",
            },
          ],
        });
      }

      // Fetch products with the appropriate filters and sorting

      const [productsList] = await Promise.all([
        fetch(baseUrl + "/rest/V1/products?" + buildSearchParams(filters), {
          headers: defaultHeaders,
        }),
      ]);

      const products = (await productsList.json()) as {
        items: Array<Product>;
      };

      const combinedResults = [...products.items];
      // Apply sorting based on 'order' (ternary condition)
      const sortOrder = order ? "asc" : "desc";

      return fetchAllProductsWithSort(
        {
          items: combinedResults,
        },
        [],
        "name",
        sortOrder,
        maxPrice,
        minPrice,
      );
    },
  });
}
