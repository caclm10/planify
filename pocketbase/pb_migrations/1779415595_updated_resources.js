/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2337082678")

  // add field
  collection.fields.addAt(1, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_484305853",
    "help": "",
    "hidden": false,
    "id": "relation376250268",
    "maxSelect": 0,
    "minSelect": 0,
    "name": "project_id",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(2, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_2602490748",
    "help": "",
    "hidden": false,
    "id": "relation2377515398",
    "maxSelect": 0,
    "minSelect": 0,
    "name": "task_id",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(3, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "text1579384326",
    "max": 0,
    "min": 0,
    "name": "name",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(4, new Field({
    "help": "",
    "hidden": false,
    "id": "select2363381545",
    "maxSelect": 0,
    "name": "type",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "file",
      "link"
    ]
  }))

  // add field
  collection.fields.addAt(5, new Field({
    "help": "",
    "hidden": false,
    "id": "file3233219085",
    "maxSelect": 0,
    "maxSize": 0,
    "mimeTypes": null,
    "name": "file_attachment",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": null,
    "type": "file"
  }))

  // add field
  collection.fields.addAt(6, new Field({
    "exceptDomains": null,
    "help": "",
    "hidden": false,
    "id": "url3087911061",
    "name": "link_url",
    "onlyDomains": null,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "url"
  }))

  // add field
  collection.fields.addAt(7, new Field({
    "cascadeDelete": false,
    "collectionId": "_pb_users_auth_",
    "help": "",
    "hidden": false,
    "id": "relation3823579430",
    "maxSelect": 0,
    "minSelect": 0,
    "name": "uploaded_by",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2337082678")

  // remove field
  collection.fields.removeById("relation376250268")

  // remove field
  collection.fields.removeById("relation2377515398")

  // remove field
  collection.fields.removeById("text1579384326")

  // remove field
  collection.fields.removeById("select2363381545")

  // remove field
  collection.fields.removeById("file3233219085")

  // remove field
  collection.fields.removeById("url3087911061")

  // remove field
  collection.fields.removeById("relation3823579430")

  return app.save(collection)
})
