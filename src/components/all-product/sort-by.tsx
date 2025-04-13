import { useTranslation } from "react-i18next";
import { useFilterContext } from "../../context/filter-context";
import { useEffect, useState } from "react";
import { SortField } from "../../utils/apiUtils";

interface SortByComponentProps {
  closeSortBy: () => void;
  useSortContext?: any; // You would define the actual context type here
}

const SortByComponent: React.FC<SortByComponentProps> = ({ closeSortBy }) => {
  const { t } = useTranslation();
  const { sort, setSort, setSortBy, sortBy } = useFilterContext();

  // Function to determine selectedSort based on context values
  const getSelectedSortFromContext = (): string => {
    if (sortBy === "created_at") {
      return sort ? "newest_first" : "oldest_first";
    } else if (sortBy === "name") {
      return sort ? "name_a_z" : "name_z_a";
    } else if (sortBy === "price") {
      return sort ? "price_low_high" : "price_high_low";
    }
    return "newest_first"; // Default
  };

  // Local state to temporarily store sort selection
  const [selectedSort, setSelectedSort] = useState<string>(getSelectedSortFromContext());
  // Local state to store temporary sort and sortBy values
  const [tempSort, setTempSort] = useState<boolean>(sort);
  const [tempSortBy, setTempSortBy] = useState<string>(sortBy);

  // Initialize from context when component mounts
  useEffect(() => {
    setSelectedSort(getSelectedSortFromContext());
    setTempSort(sort);
    setTempSortBy(sortBy);
  }, [sort, sortBy]);

  const handleSortChange = (sortValue: string): void => {
    setSelectedSort(sortValue);
    console.log("Selected sort value:", sortValue);

    // Update local state only, not context yet
    if (sortValue === "oldest_first") {
      setTempSort(false);
      setTempSortBy("created_at");
    }
    if (sortValue === "newest_first") {
      setTempSort(true);
      setTempSortBy("created_at");
    }
    if (sortValue === "name_a_z") {
      setTempSort(true);
      setTempSortBy("name");
    }
    if (sortValue === "name_z_a") {
      setTempSort(false);
      setTempSortBy("name");
    }
    if (sortValue === "price_low_high") {
      setTempSort(true);
      setTempSortBy("price");
    }
    if (sortValue === "price_high_low") {
      setTempSort(false);
      setTempSortBy("price");
    }
  };

  const handleApply = (): void => {
    // Apply the temporary values to the actual context
    setSort(tempSort);
    setSortBy(tempSortBy as SortField);
    console.log("Applying sort:", selectedSort);
    closeSortBy();
  };

  // Sort options with translation keys
  const sortOptions = [
    { id: "newest_first", translationKey: "sort.newest_first" },
    { id: "oldest_first", translationKey: "sort.oldest_first" },
    { id: "name_a_z", translationKey: "sort.name_a_z" },
    { id: "name_z_a", translationKey: "sort.name_z_a" },
    { id: "price_low_high", translationKey: "sort.price_low_high" },
    { id: "price_high_low", translationKey: "sort.price_high_low" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-lg bg-[#191919] p-4">
      <div
        className="mb-4 flex cursor-pointer justify-center"
        onClick={closeSortBy}
      >
        <div className="h-1 w-12 rounded-full bg-white"></div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-bold">
            {t("sort.title")}
          </label>

          <div className="space-y-3">
            {sortOptions.map((option) => (
              <div key={option.id} className="flex items-center">
                <input
                  type="radio"
                  id={option.id}
                  name="sortOption"
                  className="h-4 w-4 accent-yellow-500"
                  checked={selectedSort === option.id}
                  onChange={() => handleSortChange(option.id)}
                />
                <label htmlFor={option.id} className="ml-2 text-white">
                  {t(option.translationKey)}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleApply}
            className="relative w-full rounded-lg bg-transparent py-2 text-white"
            style={{
              position: "relative",
              backgroundColor: "transparent",
              borderRadius: "8px",
            }}
          >
            <span
              className="absolute inset-0 rounded-lg"
              style={{
                borderWidth: "1px",
                borderStyle: "solid",
                borderImage:
                  "linear-gradient(90deg, #CA9C43 0%, #916E2B 27.4%, #6A4F1B 59.4%, #473209 100%) 1",
                borderRadius: "8px",
              }}
            ></span>
            <span className="relative z-10">{t("common.apply")}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SortByComponent;