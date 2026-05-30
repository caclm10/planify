/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1082494883")

  // update collection data
  unmarshal({
    "createRule": "ticket_id.project_id.members.id ?= @request.auth.id",
    "deleteRule": "ticket_id.project_id.members.id ?= @request.auth.id",
    "listRule": "ticket_id.project_id.members.id ?= @request.auth.id",
    "updateRule": "ticket_id.project_id.members.id ?= @request.auth.id",
    "viewRule": "ticket_id.project_id.members.id ?= @request.auth.id"
  }, collection)

  // update field
  collection.fields.addAt(3, new Field({
    "cascadeDelete": true,
    "collectionId": "pbc_3991283842",
    "help": "",
    "hidden": false,
    "id": "relation_ticket_id",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "ticket_id",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  // update field
  collection.fields.addAt(4, new Field({
    "cascadeDelete": false,
    "collectionId": "_pb_users_auth_",
    "help": "",
    "hidden": false,
    "id": "relation_user_id",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "user_id",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1082494883")

  // update collection data
  unmarshal({
    "createRule": "ticket_id.project_id.members ?= @request.auth.id",
    "deleteRule": "ticket_id.project_id.members ?= @request.auth.id",
    "listRule": "ticket_id.project_id.members ?= @request.auth.id",
    "updateRule": "ticket_id.project_id.members ?= @request.auth.id",
    "viewRule": "ticket_id.project_id.members ?= @request.auth.id"
  }, collection)

  // update field
  collection.fields.addAt(3, new Field({
    "cascadeDelete": true,
    "collectionId": "pbc_3991283842",
    "help": "",
    "hidden": false,
    "id": "relation_ticket_id",
    "maxSelect": 1,
    "minSelect": 1,
    "name": "ticket_id",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  // update field
  collection.fields.addAt(4, new Field({
    "cascadeDelete": false,
    "collectionId": "_pb_users_auth_",
    "help": "",
    "hidden": false,
    "id": "relation_user_id",
    "maxSelect": 1,
    "minSelect": 1,
    "name": "user_id",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
})
