import { useBrandsQuery } from "../../api/brands";

export function BrandName({ brandId }: { brandId: string }) {
  const { data } = useBrandsQuery();

  if (!data) {
    return null;
  }

  const brand = data.options.find((brand) => brand.value === brandId);

  if (!brand) {
    return null;
  }

  return <>{brand.label}</>;
}
