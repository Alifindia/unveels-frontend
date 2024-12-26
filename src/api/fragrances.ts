import { useQuery } from "@tanstack/react-query";
import { baseUrl, buildSearchParams } from "../utils/apiUtils";
import { defaultHeaders, Product } from "./shared";
import { personalities } from "./attributes/personality";
import { face_shapes } from "./attributes/face_shape";

const fragrancesKey = {
  products: ({
    personality,
    faceShape,
  }: {
    personality?: string;
    faceShape?: string;
  }) => ["products", "fragrances", { personality, faceShape }],
};

export function useFragrancesProductQuery({
  personality,
  faceShape,
}: {
  personality?: string;
  faceShape?: string;
}) {
  const personalityId =
    personalities.find(
      (p) => p.label.toLowerCase() === personality?.toLowerCase(),
    )?.value ?? "";

  const faceShapeId =
    face_shapes.find((p) => p.label.toLowerCase() === faceShape?.toLowerCase())
      ?.value ?? "";

  return useQuery({
    queryKey: fragrancesKey.products({
      personality: personality,
      faceShape: faceShape,
    }),
    queryFn: async () => {
      const filters = [
        {
          filters: [
            {
              field: "category_id",
              value: "878",
              condition_type: "eq",
            },
          ],
        },
      ];

      if (personalityId) {
        filters.push({
          filters: [
            {
              field: "personality",
              value: personalityId,
              condition_type: "eq",
            },
          ],
        });
      }

      if (faceShapeId) {
        filters.push({
          filters: [
            {
              field: "face_shape",
              value: faceShapeId,
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
