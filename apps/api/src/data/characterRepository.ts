import { characterCoreRepository } from "./characterCoreRepository.js";
import { characterConsumableOperations } from "./characterConsumableOperations.js";
import { characterEquipmentOperations } from "./characterEquipmentOperations.js";
import { characterInventoryOperations } from "./characterInventoryOperations.js";
import { characterQuestRepository } from "./characterQuestRepository.js";
import { characterTravelRepository } from "./characterTravelRepository.js";

export const characterRepository = {
  ...characterCoreRepository,
  ...characterConsumableOperations,
  ...characterEquipmentOperations,
  ...characterInventoryOperations,
  ...characterQuestRepository,
  ...characterTravelRepository
};
