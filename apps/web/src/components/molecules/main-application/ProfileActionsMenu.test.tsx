import { fireEvent, render, screen } from "@testing-library/react";
import { ProfileActionsMenu } from "./ProfileActionsMenu";

describe("ProfileActionsMenu", () => {
  it("invokes character and logout actions when open", () => {
    const onChangeCharacter = jest.fn();
    const onLogout = jest.fn();
    render(
      <ProfileActionsMenu
        characterName="Saint Morning"
        isOpen
        onChangeCharacter={onChangeCharacter}
        onLogout={onLogout}
        onToggle={jest.fn()}
        variant="mobile"
      />
    );

    fireEvent.click(screen.getByRole("menuitem", { name: "Change character" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Log out" }));
    expect(onChangeCharacter).toHaveBeenCalled();
    expect(onLogout).toHaveBeenCalled();
  });
});
