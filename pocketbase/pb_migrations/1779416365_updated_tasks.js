/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2602490748")

  // update collection data
  unmarshal({
    "createRule": "project_id.members.id ?= @request.auth.id",
    "deleteRule": "project_id.members.id ?= @request.auth.id",
    "listRule": "project_id.members.id ?= @request.auth.id",
    "updateRule": "project_id.members.id ?= @request.auth.id",
    "viewRule": "project_id.members.id ?= @request.auth.id"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2602490748")

  // update collection data
  unmarshal({
    "createRule": "project_id.members ?= @request.auth.id",
    "deleteRule": "project_id.members ?= @request.auth.id",
    "listRule": "project_id.members ?= @request.auth.id",
    "updateRule": "project_id.members ?= @request.auth.id",
    "viewRule": "project_id.members ?= @request.auth.id"
  }, collection)

  return app.save(collection)
})
