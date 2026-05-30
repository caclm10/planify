/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3991283842")

  // update collection data
  unmarshal({
    "createRule": "project_id.members.id ?= @request.auth.id",
    "deleteRule": "project_id.members.id ?= @request.auth.id",
    "listRule": "project_id.members.id ?= @request.auth.id",
    "updateRule": "project_id.members.id ?= @request.auth.id",
    "viewRule": "project_id.members.id ?= @request.auth.id"
  }, collection)

  // update field
  collection.fields.addAt(3, new Field({
    "cascadeDelete": true,
    "collectionId": "pbc_484305853",
    "help": "",
    "hidden": false,
    "id": "relation_project_id",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "project_id",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  // update field
  collection.fields.addAt(9, new Field({
    "cascadeDelete": false,
    "collectionId": "_pb_users_auth_",
    "help": "",
    "hidden": false,
    "id": "relation_reporter_id",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "reporter_id",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3991283842")

  // update collection data
  unmarshal({
    "createRule": "project_id.members ?= @request.auth.id",
    "deleteRule": "project_id.members ?= @request.auth.id",
    "listRule": "project_id.members ?= @request.auth.id",
    "updateRule": "project_id.members ?= @request.auth.id",
    "viewRule": "project_id.members ?= @request.auth.id"
  }, collection)

  // update field
  collection.fields.addAt(3, new Field({
    "cascadeDelete": true,
    "collectionId": "pbc_484305853",
    "help": "",
    "hidden": false,
    "id": "relation_project_id",
    "maxSelect": 1,
    "minSelect": 1,
    "name": "project_id",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  // update field
  collection.fields.addAt(9, new Field({
    "cascadeDelete": false,
    "collectionId": "_pb_users_auth_",
    "help": "",
    "hidden": false,
    "id": "relation_reporter_id",
    "maxSelect": 1,
    "minSelect": 1,
    "name": "reporter_id",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
})
