import { useQuery } from "@tanstack/react-query";
import {
  handAccessoriesProductTypeFilter,
  neckAccessoriesProductTypeFilter,
} from "../../../../api/attributes/accessories";
import { defaultHeaders, Product } from "../../../../api/shared";
import {
  baseUrl,
  buildSearchParams,
  fetchConfigurableProducts,
} from "../../../../utils/apiUtils";

export function useHandwearQuery(
  type: "Rings" | "Bracelets" | "Bangles",
  {
    color,
    material,
  }: {
    color: string | null;
    material: string | null;
  },
) {
  return useQuery({
    queryKey: ["products", type, color, material],
    queryFn: async () => {
      const baseFilters = [
        {
          filters: [
            {
              field: "hand_accessories_product_type",
              value: handAccessoriesProductTypeFilter([type]).join(","),
              condition_type: "in",
            },
          ],
        },
      ];

      const filters = [];

      if (color) {
        filters.push({
          filters: [
            {
              field: "color",
              value: color,
              condition_type: "eq",
            },
          ],
        });
      }

      if (material) {
        filters.push({
          filters: [
            {
              field: "material",
              value: material,
              condition_type: "eq",
            },
          ],
        });
      }

      const response = await fetch(
        baseUrl +
          "/rest/V1/products?" +
          buildSearchParams([...baseFilters, ...filters]),
        {
          headers: defaultHeaders,
        },
      );

      const results = (await response.json()) as {
        items: Array<Product>;
      };

      return await fetchConfigurableProducts(results, filters);
    },
  });
}
