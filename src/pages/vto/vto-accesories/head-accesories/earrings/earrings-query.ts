import { useQuery } from "@tanstack/react-query";
import {
  getNailPolishProductTypeIds,
  lipsMakeupProductTypesFilter,
} from "../../../../api/attributes/makeups";
import { defaultHeaders, Product } from "../../../../api/shared";
import {
  baseUrl,
  buildSearchParams,
  fetchConfigurableProducts,
} from "../../../../utils/apiUtils";
import { headAccessoriesProductTypeFilter } from "../../../../api/attributes/accessories";

export function useEarringsQuery({
  color,
  shape,
}: {
  color: string | null;
  shape: string | null;
}) {
  return useQuery({
    queryKey: ["products", "earrings", color, shape],
    queryFn: async () => {
      const baseFilters = [
        {
          filters: [
            {
              field: "head_accessories_product_type",
              value: headAccessoriesProductTypeFilter(["Earrings"]).join(","),
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

      if (shape) {
        filters.push({
          filters: [
            {
              field: "shape",
              value: shape,
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
