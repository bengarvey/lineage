fs = require 'fs'
csvParse = require 'csv-parse'
async = require 'async'

FAMILY_CSV_FILE = 'data/tree2.csv'
FAMILY_JSON_FILE = 'data/temp.json'
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
      id: +node.id
      name: if node.name.match(",") then node.name.split(",")[1].substring(1,2) + ", " + node.name.split(",")[0] else node.name
      gender: node.gender
      lastName: if node.name.match(",") then node.name.split(",")[0] else node.name
      birthDate: node.birthDate
      deathDate: node.deathDate
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
    lookup[item.id] = item
  return lookup

getLinkSet = (item, lookup) ->
  spouse =
    source: +item.id
    target: if item.spouseId? then +item.spouseId else null
    color: SPOUSE_COLOR
    relation: 'spouse'
  mother =
    source: +item.id
    target: if item.motherId? then +item.motherId else null
    color: MOTHER_COLOR
    relation: 'mother'
  father =
    source: +item.id
    target: if item.fatherId? then +item.fatherId else null
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

