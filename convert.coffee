fs = require 'fs'
csvParse = require 'csv-parse'
async = require 'async'

FAMILY_CSV_FILE = 'data/familyData.csv'
FAMILY_JSON_FILE = 'data/familyData.json'
SPOUSE_COLOR = '#CC0'
MOTHER_COLOR = '#F39'
FATHER_COLOR = '#39F'

go = (family) ->
  console.log family
  links = buildLinks(family)
  list = nodeFilter(family)
  console.log list
  data =
    nodes: list
    links: links
  writeFile(FAMILY_JSON_FILE, JSON.stringify(data))

nodeFilter = (nodes) ->
  list = []
  for node in nodes
    item =
      name: node.Name
      gender: node.Gender
      lastName: if node.Name.match(",") then node.Name.split(",")[0] else node.Name
      birthYear: node.Birthdate
      deathYear: node.Deathdate
    console.log item
    list.push(item)
  return list

writeFile = (file, data) ->
  fs.writeFile(file, data, (err) ->
    if err
      return console.log err
    else
      console.log "Done."
  )

buildLinks = (list) ->
  links = []
  for item in list
    links = links.concat(getLinkSet(item))
  return links

getLinkSet = (item) ->
  spouse =
    source: +item.ID
    target: +item.SpouseID
    color: SPOUSE_COLOR
    relation: 'spouse'
  mother =
    source: +item.ID
    target: +item.MotherID
    color: MOTHER_COLOR
    relation: 'mother'
  father =
    source: +item.ID
    target: +item.FatherID
    color: FATHER_COLOR
    relation: 'father'

  return [spouse, mother, father]

loadData = (callback) ->
  fs.readFile FAMILY_CSV_FILE, 'utf-8', (err, data) ->
    console.log "Loaded family data..."
    csvParse data, {delimiter: ','}, (err, result) ->
      family = convertArrayToObjectList(result)
      callback null, family

# Assumes a header row for attribute names
convertArrayToObjectList = (arr) ->
  header = arr[0]
  list = []
  for index in [1..arr.length-1]
    ob = {}
    for headerIndex in [0..header.length-1]
      ob[header[headerIndex]] = arr[index][headerIndex]
    list.push ob
  return list

async.series([
  loadData
  ],
  (err, result) ->
    family = result[0]
    if err
      console.log "Something went wrong: #{err}"
    go(family)
)

