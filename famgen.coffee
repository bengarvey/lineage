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

generateKidsFromList = (parents) ->
  kids = []
  for index in [0..parents.length-1] by 2
    newKids = generateKids(parents[index], parents[index+1])
    kids = kids.concat(newKids)
  return kids

generateKids = (first, second) ->
  kids = []
  for index in [0..4]
    kids.push(generateKid(first, second))
  return kids

generateKid = (first, second) ->
  person = generatePerson()
  person.parentId1 = first.id
  person.parentId2 = second.id
  return person

generateMarriages = (singles) ->
  complete = []
  index = 0
  while singles.length > 1
    rand = getRandomInt(index + 1, singles.length - 1)

    complete.push(singles[index])
    complete.push(singles[rand])

    complete[complete.length-2].spouseId = singles[rand].id
    complete[complete.length-1].spouseId = singles[index].id

    singles.splice(rand, 1)
    singles.splice(index, 1)
  return complete

getRandomInt = (min, max) ->
  return Math.ceil((Math.random() * (max - min)) + min)

people = generatePeople(INITIAL_PEOPLE)
complete = generateMarriages(people)
kids = generateKidsFromList(complete)
console.log kids

console.log "Complete!"
