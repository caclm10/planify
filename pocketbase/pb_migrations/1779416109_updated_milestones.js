/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3863458068")

  // update collection data
  unmarshal({
    "createRule": "project_id.members ?= @request.auth.id",
    "deleteRule": "project_id.members ?= @request.auth.id",
    "listRule": "project_id.members ?= @request.auth.id",
    "updateRule": "project_id.members ?= @request.auth.id",
    "viewRule": "project_id.members ?= @request.auth.id"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3863458068")

  // update collection data
  unmarshal({
    "createRule": null,
    "deleteRule": null,
    "listRule": null,
    "updateRule": null,
    "viewRule": null
  }, collection)

  return app.save(collection)
})
