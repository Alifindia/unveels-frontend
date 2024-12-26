import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Category, defaultHeaders } from "./shared";
import { baseUrl, buildSearchParams } from "../utils/apiUtils";

const categoriesKey = {
  all: ["categories"],
};

async function fetchCategories() {
  const response = await fetch(
    baseUrl +
      "/rest/V1/categories/list?" +
      buildSearchParams([
        {
          filters: [
            { field: "parent_id", value: "310,335,448", condition_type: "in" },
          ],
        },
      ]),
    {
      headers: defaultHeaders,
    },
  );
  if (!response.ok) {
    throw new Error("Failed to fetch categories");
  }
  return response.json() as Promise<{
    items: Array<Category>;
    search_criteria: {
      filter_groups: Array<any>;
    };
    total_count: number;
  }>;
}

export function useCategoriesQuery() {
  return useQuery({
    queryKey: categoriesKey.all,
    queryFn: fetchCategories,
  });
}

export function useCategoriesQuerySuspense() {
  return useSuspenseQuery({
    queryKey: categoriesKey.all,
    queryFn: fetchCategories,
  });
}

export function getCategoryName(categories: Category[], id: number) {
  for (const category of categories) {
    if (category.id === id) {
      return category.name;
    }
  }
  return "";
}
