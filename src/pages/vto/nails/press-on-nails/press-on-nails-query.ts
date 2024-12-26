import { useQuery } from "@tanstack/react-query";
import {
  getNailPolishProductTypeIds,
  getNailsProductTypeIds,
  lipsMakeupProductTypesFilter,
} from "../../../../api/attributes/makeups";
import { defaultHeaders, Product } from "../../../../api/shared";
import {
  baseUrl,
  buildSearchParams,
  createSimpleAndConfigurableFilters,
  fetchConfigurableProducts,
} from "../../../../utils/apiUtils";

export function usePressOnNailsQuery({
  color,
  shape,
}: {
  color: string | null;
  shape: string | null;
}) {
  return useQuery({
    queryKey: ["products", "pressonnails", color, shape],
    queryFn: async () => {
      const { simpleFilters, configurableFilters } =
        createSimpleAndConfigurableFilters([
          {
            filters: [
              {
                field: "nails_product_type",
                value: getNailsProductTypeIds(["Press on Nails"]).join(","),
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

      if (shape) {
        simpleFilters.push({
          filters: [
            {
              field: "shape",
              value: shape,
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

      return fetchConfigurableProducts(
        {
          items: combinedResults,
        },
        filters,
      );
    },
  });
}
