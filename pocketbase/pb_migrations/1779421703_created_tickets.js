/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "id": "pbc_3991283842",
    "name": "tickets",
    "type": "base",
    "system": false,
    "listRule": "project_id.members ?= @request.auth.id",
    "viewRule": "project_id.members ?= @request.auth.id",
    "createRule": "project_id.members ?= @request.auth.id",
    "updateRule": "project_id.members ?= @request.auth.id",
    "deleteRule": "project_id.members ?= @request.auth.id",
    "indexes": [],
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "help": "",
        "hidden": false,
        "id": "text3208210256",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "autodate2990389176",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate3332085495",
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
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
      },
      {
        "autogeneratePattern": "",
        "help": "",
        "hidden": false,
        "id": "text_title",
        "max": 0,
        "min": 0,
        "name": "title",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "help": "",
        "hidden": false,
        "id": "text_description",
        "max": 0,
        "min": 0,
        "name": "description",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "help": "",
        "hidden": false,
        "id": "select_status",
        "maxSelect": 1,
        "name": "status",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "open",
          "in_progress",
          "resolved",
          "closed"
        ]
      },
      {
        "help": "",
        "hidden": false,
        "id": "select_priority",
        "maxSelect": 1,
        "name": "priority",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "low",
          "medium",
          "high",
          "critical"
        ]
      },
      {
        "help": "",
        "hidden": false,
        "id": "select_category",
        "maxSelect": 1,
        "name": "category",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "bug",
          "feature_request",
          "refactor",
          "support"
        ]
      },
      {
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
      },
      {
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "help": "",
        "hidden": false,
        "id": "relation_assignee_id",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "assignee_id",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_2602490748",
        "help": "",
        "hidden": false,
        "id": "relation_task_id",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "task_id",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      }
    ]
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3991283842");

  return app.delete(collection);
})
