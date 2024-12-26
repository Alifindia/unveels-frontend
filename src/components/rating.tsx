export const Rating: React.FC<{ rating: number }> = ({ rating }) => {
  const stars = Array.from({ length: 5 }, (_, index) => {
    return index < rating ? "★" : "☆";
  });

  return <div>{stars.join("")}</div>;
};
