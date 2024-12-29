import { Icons } from "./icons";

export function Footer() {
  return (
    <footer className="flex justify-center pb-2 text-white">
      <div className="mr-1 text-[0.625rem]">Powered by</div>
      <Icons.logoType className="h-4" />
    </footer>
  );
}
