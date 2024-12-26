import { useQuery } from "@tanstack/react-query";
import { baseUrl, buildSearchParams } from "../utils/apiUtils";
import { defaultHeaders, Product } from "./shared";

const skintoneKeys = {
  products: ({
    skintone,
    toneType,
  }: {
    skintone: string;
    toneType: string;
  }) => ["products", "skintone", skintone, toneType],
};

export function useSkinToneProductQuery({
  skintone,
  tonetype,
}: {
  tonetype?: string;
  skintone?: string;
}) {
  return useQuery({
    queryKey: skintoneKeys.products({
      skintone: skintone || "",
      toneType: tonetype || "",
    }),

    queryFn: async () => {
      const filters = [
        {
          filters: [
            {
              field: "category_id",
              value: "451",
              condition_type: "eq",
            },
          ],
        },
      ];

      if (skintone) {
        filters.push({
          filters: [
            {
              field: "skin_tone",
              value: skintone,
              condition_type: "eq",
            },
          ],
        });
      }

      if (tonetype) {
        filters.push({
          filters: [
            {
              field: "tone_type",
              value: tonetype,
              condition_type: "finset",
            },
          ],
        });
      }

      const response = await fetch(
        baseUrl + "/rest/V1/products?" + buildSearchParams(filters),
        {
          headers: defaultHeaders,
        },
      );

      return response.json() as Promise<{
        items: Array<Product>;
      }>;
    },
  });
}
