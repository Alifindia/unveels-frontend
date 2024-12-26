import { useQuery } from "@tanstack/react-query";
import {
  getLipsMakeupProductTypeIds,
  lips_makeup_product_types,
  lipsMakeupProductTypesFilter,
} from "../../../../api/attributes/makeups";
import { defaultHeaders, Product } from "../../../../api/shared";
import {
  baseUrl,
  buildSearchParams,
  createSimpleAndConfigurableFilters,
  fetchConfigurableProducts,
} from "../../../../utils/apiUtils";

export function useLipPlumperQuery({
  hexacode,
  texture,
}: {
  hexacode: string | null;
  texture: string | null;
}) {
  return useQuery({
    queryKey: ["products", "lip-plumper", hexacode, texture],
    queryFn: async () => {
      const { simpleFilters, configurableFilters } =
        createSimpleAndConfigurableFilters([
          {
            filters: [
              {
                field: "lips_makeup_product_type",
                value: lipsMakeupProductTypesFilter([
                  "Lip Plumpers",
                  "Lip Glosses",
                ]),
                condition_type: "in",
              },
            ],
          },
        ]);

      if (hexacode) {
        simpleFilters.push({
          filters: [
            {
              field: "hexacode",
              value: hexacode,
              condition_type: "im",
            },
          ],
        });
      }

      if (texture) {
        simpleFilters.push({
          filters: [
            {
              field: "texture",
              value: texture,
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

      if (hexacode) {
        filters.push({
          filters: [
            {
              field: "hexacode",
              value: hexacode,
              condition_type: "im",
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

      return fetchConfigurableProducts(
        {
          items: combinedResults,
        },
        filters,
      );
    },
  });
}
