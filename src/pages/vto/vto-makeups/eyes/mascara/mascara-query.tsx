import { useQuery } from "@tanstack/react-query";
import { getLashMakeupProductTypeIds } from "../../../../api/attributes/makeups";
import { defaultHeaders, Product } from "../../../../api/shared";
import {
  baseUrl,
  buildSearchParams,
  createSimpleAndConfigurableFilters,
  fetchConfigurableProducts,
} from "../../../../utils/apiUtils";

export function useMascaraQuery({
  color,
  sub_color,
}: {
  color: string | null;
  sub_color: string | null;
}) {
  return useQuery({
    queryKey: ["products", "mascara", color, sub_color],
    queryFn: async () => {
      const { simpleFilters, configurableFilters } =
        createSimpleAndConfigurableFilters([
          {
            filters: [
              {
                field: "lash_makeup_product_type",
                value: getLashMakeupProductTypeIds(["Mascaras"]).join(","),
                condition_type: "in",
              },
            ],
          },
        ]);

      if (color) {
        simpleFilters.push({
          filters: [
            {
              field: "color",
              value: color,
              condition_type: "eq",
            },
          ],
        });
      }

      if (sub_color) {
        simpleFilters.push({
          filters: [
            {
              field: "sub_color",
              value: sub_color,
              condition_type: "eq",
            },
          ],
        });
      }

      const [simpleResponse, configurableResponse] = await Promise.all([
        fetch(
          baseUrl + "/rest/V1/products?" + buildSearchParams(simpleFilters),
          {
            headers: defaultHeaders,
          },
        ),
        fetch(
          baseUrl +
            "/rest/V1/products?" +
            buildSearchParams(configurableFilters),
          {
            headers: defaultHeaders,
          },
        ),
      ]);

      const simpleResults = (await simpleResponse.json()) as {
        items: Array<Product>;
      };

      const configurableResults = (await configurableResponse.json()) as {
        items: Array<Product>;
      };

      const combinedResults = [
        ...simpleResults.items,
        ...configurableResults.items,
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

      if (sub_color) {
        filters.push({
          filters: [
            {
              field: "sub_color",
              value: sub_color,
              condition_type: "eq",
            },
          ],
        });
      }

      return fetchConfigurableProducts(
        {
          items: combinedResults,
        },
        filters,
      );
    },
  });
}
