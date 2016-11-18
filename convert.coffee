fs = require 'fs'
csvParse = require 'csv-parse'
async = require 'async'

FAMILY_CSV_FILE = 'data/familyData.csv'
FAMILY_JSON_FILE = 'data/familyData.json'
SPOUSE_COLOR = '#CC0'
MOTHER_COLOR = '#F39'
FATHER_COLOR = '#39F'

go = (family) ->
  links = buildLinks(family)
  list = nodeFilter(family)
  data =
    nodes: list
    links: links
  writeFile(FAMILY_JSON_FILE, JSON.stringify(data))

nodeFilter = (nodes) ->
  list = []
  for node in nodes
    item =
      ID: +node.ID
      name: node.Name
      gender: node.Gender
      lastName: if node.Name.match(",") then node.Name.split(",")[0] else node.Name
      birthYear: +node.Birthdate
      deathYear: +node.Deathdate
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

buildLookupTable = (list) ->
  lookup = {}
  for item in list
    lookup[item.ID] = item
  return lookup

getLinkSet = (item, lookup) ->
  spouse =
    source: +item.ID
    target: if item.SpouseID? then item.SpouseId else null
    color: SPOUSE_COLOR
    relation: 'spouse'
  mother =
    source: +item.ID
    target: if item.MotherID? then item.MotherID else null
    color: MOTHER_COLOR
    relation: 'mother'
  father =
    source: +item.ID
    target: if item.FatherID? then item.FatherID else null
    color: FATHER_COLOR
    relation: 'father'

  links = validateLinkSet([spouse, mother, father])

  return links

validateLinkSet = (set) ->
  validatedSet = (item for item in set when validatedLink(item))
  return validatedSet

validatedLink = (link) ->
  link.source? and link.target? and link.relation?

loadData = (callback) ->
  fs.readFile FAMILY_CSV_FILE, 'utf-8', (err, data) ->
    console.log "Loaded family data..."
    csvParse data, {delimiter: ','}, (err, result) ->
      family = convertArrayToObjectList(result)
      callback null, family

cleanseCsv = (data) ->
  if data is '' then null else data

# Assumes a header row for attribute names
convertArrayToObjectList = (arr) ->
  header = arr[0]
  list = []
  for index in [1..arr.length-1]
    ob = {}
    for headerIndex in [0..header.length-1]
      ob[header[headerIndex]] = cleanseCsv(arr[index][headerIndex])
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

