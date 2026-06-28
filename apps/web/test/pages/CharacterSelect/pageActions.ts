import { type Page } from "@playwright/test";
import SharedActions from "../Shared/sharedActions";
import CharacterSelectPageElements from "./pageElements";

export default class CharacterSelectPageActions extends SharedActions {
  readonly pageElements: CharacterSelectPageElements;

  constructor(page: Page) {
    super(page);
    this.pageElements = new CharacterSelectPageElements(page);
  }

  createCharacter = async (name: string, gender: string) => {
    await this.pageElements.createCharacterNameInput.fill(name);
    if (gender === "male") {
      await this.pageElements.characterGenderSelectMale.click();
    } else {
      await this.pageElements.characterGenderSelectFemale.click();
    }
    await this.pageElements.createCharacterSubmitButton.click();
  };
}
