import { loadGeneratedItemIndex } from "./generatedContent.js";

describe("generated content", () => {
  it("loads the generated item index from the consolidated content directory", () => {
    const items = loadGeneratedItemIndex();

    expect(items["3907"]).toEqual(
      expect.objectContaining({
        id: "3907",
        name: "Bless Poster"
      })
    );
  });
});
