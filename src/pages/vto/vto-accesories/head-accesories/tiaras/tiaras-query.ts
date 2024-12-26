import { useQuery } from "@tanstack/react-query";
import { headAccessoriesProductTypeFilter } from "../../../../api/attributes/accessories";
import { defaultHeaders, Product } from "../../../../api/shared";
import {
  baseUrl,
  buildSearchParams,
  fetchConfigurableProducts,
} from "../../../../utils/apiUtils";

export function useTiarasQuery({
  color,
  occasion,
  material,
}: {
  color: string | null;
  occasion: string | null;
  material: string | null;
}) {
  return useQuery({
    queryKey: ["products", "tiaras", color, occasion, material],
    queryFn: async () => {
      const baseFilters = [
        {
          filters: [
            {
              field: "head_accessories_product_type",
              value: headAccessoriesProductTypeFilter(["Tiaras"]).join(","),
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

      if (occasion) {
        filters.push({
          filters: [
            {
              field: "occasion",
              value: occasion,
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
