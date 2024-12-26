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

export function useGlassesQuery({
  color,
  shape,
  material,
}: {
  color: string | null;
  shape: string | null;
  material: string | null;
}) {
  return useQuery({
    queryKey: ["products", "glasses", color, shape, material],
    queryFn: async () => {
      const baseFilters = [
        {
          filters: [
            {
              field: "head_accessories_product_type",
              value: headAccessoriesProductTypeFilter([
                "Sun Glasses",
                "Glasses",
              ]).join(","),
              condition_type: "in",
            },
          ],
        },
      ];

      // Skip filter ini karena, lips_makeup_product_type tidak bisa di filter dengan color
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
          buildSearchParams([...baseFilters, ...filters]), // Hanya apply baseFilters karena filter color tidak bisa di apply
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
