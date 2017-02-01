fs = require 'fs'
csvParse = require 'csv-parse'
async = require 'async'

console.log "Converting family..."
CSV_FILE = 'data/tree2.csv'

getPeople = (callback) ->
  fs.readFile CSV_FILE, 'utf-8', (err, data) ->
    console.log "Loaded csv data..."
    csvParse data, {delimiter: ','}, (err, result) ->
      people = convertArrayToObjectList(result)
      people = addLastNames(people)
      callback null, people

getNodeById = (nodes, id) ->
  for node in nodes when node.id is id
    return node
  return -1

parseLinks = (nodes) ->
  links = []
  for node in nodes
    console.log node
    if node.spouseId? and node.spouseId isnt ''
      links.push(getLink('spouse', node, getNodeById(nodes, +node.spouseId)))

    if node.motherId? and node.motherId isnt ''
      links.push(getLink('mother', node, getNodeById(nodes, +node.motherId)))

    if node.fatherId? and node.fatherId isnt ''
      links.push(getLink('father', node, getNodeById(nodes, +node.fatherId)))
    console.log links[links.length-1]
  return links

getLink = (type, source, target) ->
  link =
    source: source.id
    target: target.id
    type: type
    color: getLinkColor(type)

getLinkColor = (type) ->
  switch type
    when 'spouse' then '#666'
    when 'mother' then '#933'
    when 'father' then '#39F'
    else '#111'

addLastNames = (nodes) ->
  for node in nodes
    names = node.name.split(" ")
    node.lastName = names[0].replace(/,/g,'')
  return nodes

convertArrayToObjectList = (arr) ->
  header = arr[0]
  list = []
  for index in [1..arr.length-1]
    ob = {}
    for headerIndex in [0..header.length-1]
      ob[header[headerIndex]] = convertType(header[headerIndex], arr[index][headerIndex])
    list.push ob
  return list

convertType = (name, value) ->
  if name is 'id' then +value
  else if name is 'birthDate'
    dates = value.split(":")
    unless dates[1]?
      dates[1] = 1
    unless dates[2]?
      dates[2] = 0
    return new Date(dates[0], dates[1]-1, dates[2])
  else if name is 'deadthDate' then new Date("#{value} 00")
  else value

writeFile = (file, data) ->
  fs.writeFile(file, data, (err) ->
    if err
      return console.log err
    else
      console.log "Done."
  )

async.series([
  getPeople
  ],
  (err, result) ->
    people = result[0]
    links = parseLinks(people)
    if err
      console.log "Something went wrong: #{err}"
    output =
      nodes: people
      links: links
    writeFile('data/converted.json', JSON.stringify(output))
)
console.log "Complete!"
