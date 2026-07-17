import { Router } from "express";
import { findDataRecord, isDataSetName, listDataSets, queryDataSet } from "./gameData.service.js";

export const gameDataRouter = Router();

gameDataRouter.use((_request, response, next) => {
  response.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
  next();
});

gameDataRouter.get("/", (_request, response) => {
  response.json({ dataSets: listDataSets() });
});

gameDataRouter.get("/:dataSet", (request, response) => {
  const { dataSet } = request.params;

  if (!isDataSetName(dataSet)) {
    response.status(404).json({ error: "Data set not found" });
    return;
  }

  response.json(queryDataSet(dataSet, request.query));
});

gameDataRouter.get("/:dataSet/:id", (request, response) => {
  const { dataSet, id } = request.params;

  if (!isDataSetName(dataSet)) {
    response.status(404).json({ error: "Data set not found" });
    return;
  }

  const item = findDataRecord(dataSet, id);

  if (!item) {
    response.status(404).json({ error: "Data record not found" });
    return;
  }

  response.json({ dataSet, item });
});
