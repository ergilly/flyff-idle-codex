import { Router } from "express";
import { characterConsumablesRouter } from "./characterConsumables.routes.js";
import { characterCoreRouter } from "./characterCore.routes.js";
import { characterEquipmentRouter } from "./characterEquipment.routes.js";
import { characterInventoryRouter } from "./characterInventory.routes.js";
import { characterProgressionRouter } from "./characterProgression.routes.js";
import { characterQuestsRouter } from "./characterQuests.routes.js";
import { characterShopsRouter } from "./characterShops.routes.js";

export const characterRouter = Router();

characterRouter.use(characterCoreRouter);
characterRouter.use(characterProgressionRouter);
characterRouter.use(characterQuestsRouter);
characterRouter.use(characterShopsRouter);
characterRouter.use(characterEquipmentRouter);
characterRouter.use(characterConsumablesRouter);
characterRouter.use(characterInventoryRouter);
