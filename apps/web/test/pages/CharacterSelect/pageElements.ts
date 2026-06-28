import { type Locator, type Page } from "@playwright/test";
import SharedElements from "../Shared/sharedElements";

export default class CharacterSelectPageElements extends SharedElements {
  constructor(page: Page) {
    super(page);
  }

  get logoutButton(): Locator {
    return this.page.getByTestId("characters_button_logout");
  }

  get characterSlot(): (i: number) => Locator {
    return (i: number = 1) => this.page.getByTestId(`characters_article_slot_${i}`);
  }

  get characterName(): (i: number) => Locator {
    return (i: number = 1) => this.page.getByTestId(`characters_h2_name_${i}`);
  }

  get selectCharacterSlot(): (i: number) => Locator {
    return (i: number = 1) => this.page.getByTestId(`characters_button_select_${i}`);
  }

  get emptyCharacterSlot(): (i: number) => Locator {
    return (i: number = 1) => this.page.getByTestId(`characters_article_empty_slot_${i}`);
  }

  get deleteCharacterButton(): (i: number) => Locator {
    return (i: number = 1) => this.page.getByTestId(`characters_button_delete_${i}`);
  }

  get createCharacterButton(): (i: number) => Locator {
    return (i: number = 1) => this.page.getByTestId(`characters_button_create_slot_${i}`);
  }

  get createCharacterHeader(): Locator {
    return this.page.getByTestId("character_create_header_page_title");
  }

  // Preview Elements
  get createCharacterNamePreview(): Locator {
    return this.page.getByTestId("character_create_h2_preview_name");
  }

  get createCharacterInfoPreview(): Locator {
    return this.page.getByTestId("character_create_p_preview_meta");
  }

  // Create Character Stat Boxes
  get strStatBox(): Locator {
    return this.page.getByTestId("character_create_span_starting_stat_str");
  }

  get staStatBox(): Locator {
    return this.page.getByTestId("character_create_span_starting_stat_sta");
  }

  get dexStatBox(): Locator {
    return this.page.getByTestId("character_create_span_starting_stat_dex");
  }

  get intStatBox(): Locator {
    return this.page.getByTestId("character_create_span_starting_stat_int");
  }

  // Create Character Form Elements
  get createCharacterForm(): Locator {
    return this.page.getByTestId("character_create_form");
  }

  get createCharacterNameInput(): Locator {
    return this.page.getByTestId("character_create_input_name");
  }

  get characterGenderSelectMale(): Locator {
    return this.page.getByTestId("character_create_radio_male");
  }

  get characterGenderSelectFemale(): Locator {
    return this.page.getByTestId("character_create_radio_female");
  }

  get createCharacterCancelButton(): Locator {
    return this.page.getByTestId("character_create_button_cancel");
  }

  get createCharacterSubmitButton(): Locator {
    return this.page.getByTestId("character_create_button_submit");
  }

  // Delete Character Dialog Elements
  get deleteCharacterHeader(): Locator {
    return this.page.getByTestId("characters_delete_h2_title");
  }

  get deleteCharacterNameInput(): Locator {
    return this.page.getByTestId("characters_delete_input_name");
  }

  get deleteCharacterConfirmButton(): Locator {
    return this.page.getByTestId("characters_delete_button_confirm");
  }

  get deleteCharacterCancelButton(): Locator {
    return this.page.getByTestId("characters_delete_button_cancel");
  }
}
