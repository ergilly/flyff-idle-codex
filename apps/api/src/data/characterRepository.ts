import { characterCoreRepository } from "./characterCoreRepository.js";
import { characterInventoryOperations } from "./characterInventoryOperations.js";

export const characterRepository = {
  ...characterCoreRepository,
  ...characterInventoryOperations
};
