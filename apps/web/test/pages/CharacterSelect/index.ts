import { type Page } from "@playwright/test";
import CharacterSelectPageElements from "./pageElements";
import CharacterSelectPageActions from "./pageActions";

export default class CharacterSelectPage {
  readonly page: Page;
  readonly elements: CharacterSelectPageElements;
  readonly actions: CharacterSelectPageActions;

  constructor(page: Page) {
    this.page = page;
    this.elements = new CharacterSelectPageElements(page);
    this.actions = new CharacterSelectPageActions(page);
  }
}
