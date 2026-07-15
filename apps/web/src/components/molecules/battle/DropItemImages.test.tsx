import { render, screen } from "@testing-library/react";
import { DropItemImage, SmallDropItemImage } from "./DropItemImages";

it("distinguishes quest drops and renders known icons", () => {
  const { container } = render(<DropItemImage icon="gem.png" isQuestDrop name="Quest Gem" />);
  expect(screen.getByTestId("battle_div_monster_drop_image_quest_gem")).toHaveClass("border-[#f59e0b]");
  expect(container.querySelector("img")).toBeInTheDocument();
});

it("renders a fallback for missing small drop icons", () => {
  render(<SmallDropItemImage icon={null} name={null} />);
  expect(screen.getByTestId("battle_span_monster_quest_drop_image_unknown_item")).toHaveTextContent("?");
});
