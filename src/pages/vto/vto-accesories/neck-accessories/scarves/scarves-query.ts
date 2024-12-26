import { useQuery } from "@tanstack/react-query";
import { neckAccessoriesProductTypeFilter } from "../../../../api/attributes/accessories";
import { defaultHeaders, Product } from "../../../../api/shared";
import {
  baseUrl,
  buildSearchParams,
  fetchConfigurableProducts,
} from "../../../../utils/apiUtils";

export function useScarvesQuery({
  color,
  fabric,
}: {
  color: string | null;
  fabric: string | null;
}) {
  return useQuery({
    queryKey: ["products", "scarves", color, fabric],
    queryFn: async () => {
      const baseFilters = [
        {
          filters: [
            {
              field: "neck_accessories_product_type",
              value: neckAccessoriesProductTypeFilter(["Scarves"]).join(","),
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

      if (fabric) {
        filters.push({
          filters: [
            {
              field: "fabric",
              value: fabric,
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
