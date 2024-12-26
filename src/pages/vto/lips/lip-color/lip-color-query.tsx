import { useQuery } from "@tanstack/react-query";
import { lipsMakeupProductTypesFilter } from "../../../../api/attributes/makeups";
import { defaultHeaders, Product } from "../../../../api/shared";
import {
  baseUrl,
  buildSearchParams,
  fetchAllProducts,
} from "../../../../utils/apiUtils";

export function useLipColorQuery({
  color,
  sub_color,
  texture,
}: {
  color: string | null;
  sub_color: string | null;
  texture: string | null;
}) {
  return useQuery({
    queryKey: ["products", "lipcolor", color, sub_color, texture],
    queryFn: async () => {
      const filters = [
        {
          filters: [
            {
              field: "lips_makeup_product_type",
              value: "5726,5727,5728,5731",
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

      const colorFilter = [];

      if (color) {
        colorFilter.push({
          filters: [
            {
              field: "color",
              value: color,
              condition_type: "eq",
            },
          ],
        });
      }

      if (texture) {
        filters.push({
          filters: [
            {
              field: "texture",
              value: texture,
              condition_type: "eq",
            },
          ],
        });
      }

      const [productsList] = await Promise.all([
        fetch(baseUrl + "/rest/V1/products?" + buildSearchParams(filters), {
          headers: defaultHeaders,
        }),
      ]);

      const products = (await productsList.json()) as {
        items: Array<Product>;
      };

      const combinedResults = [...products.items];

      return fetchAllProducts(
        {
          items: combinedResults,
        },
        colorFilter,
      );
    },
  });
}
