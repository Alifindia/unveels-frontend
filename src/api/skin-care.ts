import { useQuery } from "@tanstack/react-query";
import { baseUrl, buildSearchParams } from "../utils/apiUtils";
import { skin_concerns } from "./attributes/skin_concern";
import { defaultHeaders, Product } from "./shared";

const skincareKey = {
  products: ({ skin_concern }: { skin_concern?: string }) => [
    "products",
    "skincare",
    { skin_concern },
  ],
};

export function useSkincareProductQuery({
  skinConcern,
}: {
  skinConcern?: string;
}) {
  return useQuery({
    queryKey: skincareKey.products({
      skin_concern: skinConcern,
    }),
    queryFn: async () => {
      const skinConcernId =
        skin_concerns.find(
          (p) => p.label.toLowerCase() === skinConcern?.toLowerCase(),
        )?.value ?? "";

      if (!skinConcernId) {
        throw new Error("Invalid skin concern");
      }
      const filters = [
        {
          filters: [
            {
              field: "category_id",
              value: "470",
              condition_type: "eq",
            },
          ],
        },
      ];

      if (skinConcernId) {
        filters.push({
          filters: [
            {
              field: "skin_concern",
              value: skinConcernId,
              condition_type: "eq",
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
