fs = require 'fs'
csvParse = require 'csv-parse'
async = require 'async'

console.log "Converting family..."
CSV_FILE = 'data/tree2.csv'

# Load CSV file
getPeople = (callback) ->
  fs.readFile CSV_FILE, 'utf-8', (err, data) ->
    console.log "Loaded csv data..."
    csvParse data, {delimiter: ','}, (err, result) ->
      people = convertArrayToObjectList(result)
      callback null, people

convertArrayToObjectList = (arr) ->
  header = arr[0]
  list = []
  for index in [1..arr.length-1]
    ob = {}
    for headerIndex in [0..header.length-1]
      ob[header[headerIndex]] = arr[index][headerIndex]
    list.push ob
  return list

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
    if err
      console.log "Something went wrong: #{err}"
    output =
      nodes: people
      links: []
    writeFile('data/converted.json', JSON.stringify(output))
)
console.log "Complete!"
