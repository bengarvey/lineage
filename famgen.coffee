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
    person.ID = globalID += 1
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
  for person, index in singles
    rand = getRandomInt(index + 1, singles.length - 1)
    console.log rand
    complete.push(singles[index])
    complete.push(singles[rand])
    singles = singles.slice(rand-1, rand)
    singles = singles.slice(index-1, index)
  console.log singles

getRandomInt = (min, max) ->
  return Math.ceil((Math.random() * (max - min)) + min)

people = generatePeople(INITIAL_PEOPLE)
generateMarriages(people)

console.log "Complete!"
