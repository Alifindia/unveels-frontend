import { useEffect, useState } from "react";
import { useCartContext } from "../context/cart-context";

const SuccessPopup = ({ product }: { product: any }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [animationClass, setAnimationClass] = useState(""); // Class untuk animasi
  const { setDataItem } = useCartContext();
  const handleClose = () => {
    setAnimationClass("animate-fade-top"); // Tambahkan animasi keluar
    setTimeout(() => {
      setIsVisible(false);
      setDataItem(null);
    }, 400); // Pastikan waktu sinkron dengan durasi animasi
  };

  useEffect(() => {
    if (product) {
      setAnimationClass("animate-fade-down"); // Tambahkan animasi masuk
      setIsVisible(true);

      const timer = setTimeout(() => {
        handleClose();
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [product]);

  return (
    isVisible && (
      <div className={`fixed top-2 left-0 right-0 z-10 flex items-center justify-center ${animationClass}`}>
        <div className="relative flex gap-2 items-center max-w-[280px] lg:max-w-sm p-4 text-white rounded-lg shadow bg-green-600">
          <svg
            className="w-16 h-16"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
          </svg>
          <div className="ms-3 text-xs lg:text-sm font-normal">
            You added {product.name} to your shopping cart.
          </div>
        </div>
      </div>
    )
  );
};

export default SuccessPopup;
