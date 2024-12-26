import { useQuery } from "@tanstack/react-query";
import { defaultHeaders, Product } from "../../../../api/shared";
import {
  baseUrl,
  buildSearchParams,
  createSimpleAndConfigurableFilters,
  fetchConfigurableProducts,
} from "../../../../utils/apiUtils";

export function useLenseQuery({
  color,
  pattern,
}: {
  color: string | null;
  pattern: string | null;
}) {
  return useQuery({
    queryKey: ["products", "lenses", color, pattern],
    queryFn: async () => {
      const { simpleFilters, configurableFilters } =
        createSimpleAndConfigurableFilters([
          {
            filters: [
              {
                field: "lense_makeup_product_type",
                value: "Lenses",
                condition_type: "eq",
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

      if (pattern) {
        simpleFilters.push({
          filters: [
            {
              field: "pattern",
              value: pattern,
              condition_type: "finset",
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

      if (pattern) {
        filters.push({
          filters: [
            {
              field: "pattern",
              value: pattern,
              condition_type: "finset",
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
