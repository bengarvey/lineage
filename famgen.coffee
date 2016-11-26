fs = require 'fs'

GENERATIONS = 3
MAX_CHILDREN = 10
MIN_CHILDREN = 0
INITIAL_PEOPLE = 10
STARTING_YEAR = 1900
globalID = 0

console.log "Generating family..."

generatePeople = (total) ->
  people = []
  for index in [0..total]
    person = generatePerson()
    person.id = globalID += 1
    people.push(person)
  return people

generatePerson = () ->
  person =
    name: "Ben Garvey" + Math.random()
    gender: 'M'
    birthDate: '1900'
    deathDate: '1950'

generateMarriages = (singles) ->
  complete = []
  index = 0
  while singles.length > 1
    console.log "#{index} vs #{singles.length-1}"
    rand = getRandomInt(index + 1, singles.length - 1)

    complete.push(singles[index])
    complete.push(singles[rand])

    console.log index + 1, singles.length - 1, rand, singles.length, singles[rand]
    complete[complete.length-2].spouseId = singles[rand].id
    complete[complete.length-1].spouseId = singles[index].id

    singles.splice(rand, 1)
    singles.splice(index, 1)
  return complete

getRandomInt = (min, max) ->
  return Math.ceil((Math.random() * (max - min)) + min)

people = generatePeople(INITIAL_PEOPLE)
complete = generateMarriages(people)
console.log complete


console.log "Complete!"
