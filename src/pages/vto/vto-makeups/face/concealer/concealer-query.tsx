import { useQuery } from "@tanstack/react-query";
import {
  faceMakeupProductTypesFilter,
  getEyeMakeupProductTypeIds,
  getLashMakeupProductTypeIds,
} from "../../../../api/attributes/makeups";
import { defaultHeaders, Product } from "../../../../api/shared";
import {
  baseUrl,
  buildSearchParams,
  createSimpleAndConfigurableFilters,
  fetchConfigurableProducts,
} from "../../../../utils/apiUtils";

export function useConcealerQuery({ skin_tone }: { skin_tone: string | null }) {
  return useQuery({
    queryKey: ["products", "concealers", skin_tone],
    queryFn: async () => {
      const { simpleFilters, configurableFilters } =
        createSimpleAndConfigurableFilters([
          {
            filters: [
              {
                field: "eye_makeup_product_type",
                value: getEyeMakeupProductTypeIds(["Concealers"]).join(","),
                condition_type: "in",
              },
            ],
          },
        ]);

      if (skin_tone) {
        simpleFilters.push({
          filters: [
            {
              field: "skin_tone",
              value: skin_tone,
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

      if (skin_tone) {
        filters.push({
          filters: [
            {
              field: "skin_tone",
              value: skin_tone,
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
