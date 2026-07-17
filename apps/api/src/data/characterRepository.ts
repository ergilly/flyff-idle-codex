import { characterCoreRepository } from "./characterCoreRepository.js";
import { characterInventoryOperations } from "./characterInventoryOperations.js";
import { characterTravelRepository } from "./characterTravelRepository.js";

export const characterRepository = {
  ...characterCoreRepository,
  ...characterInventoryOperations,
  ...characterTravelRepository
};
