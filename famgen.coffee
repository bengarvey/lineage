fs = require 'fs'
Chance = require 'chance'
chance = new Chance

GENERATIONS = 3
MAX_CHILDREN = 10
MIN_CHILDREN = 0
INITIAL_PEOPLE = 2000
MIN_YEAR = 1900
MAX_YEAR = 2016
MAX_LINKS = 2000
globalID = 0

console.log "Generating family..."

generatePeople = (total) ->
  console.log total
  people = []
  for index in [0..total]
    person = generatePerson()
    person.id = globalID += 1
    people.push(person)
  console.log people.length
  return people

generatePerson = () ->
  gender = chance.gender()
  first = chance.first({gender: gender})
  last = chance.last()
  name = "#{first} #{last}"

  birthYear = chance.year({min: MIN_YEAR, max: MAX_YEAR});
  deathYear = +birthYear + chance.integer({min:1, max: 100});

  person =
    firstName: first
    lastName: last
    name: name
    gender: gender
    birthDate: chance.date({year: birthYear})
    deathDate: chance.date({year: deathYear})

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

generateLinks = (nodes, total) ->
  links = []
  for index in [0..total]
    source = chance.integer({min: 0, max: nodes.length-1})
    target = chance.integer({min: 0, max: nodes.length-1})
    relation = getRelation(nodes[target])
    color = getColor(relation)
    link =
      source: nodes[source].id
      target: nodes[target].id
      color: color
      relation: relation
    links.push(link)
  return links

getColor = (relation) ->
  switch relation
    when 'mother' then '#933'
    when 'father' then '#39F'
    when 'spouse' then '#666'
    else '#111'

getRelation = (node) ->
  if node.gender is 'Female' then 'mother'
  else if node.gender is 'Male' then 'father'

writeFile = (file, data) ->
  fs.writeFile(file, data, (err) ->
    if err
      return console.log err
    else
      console.log "Done."
  )

link =
  source: 1
  target: 0
  color: '#39F'
  relation: 'father'

people = generatePeople(INITIAL_PEOPLE)
links = generateLinks(people, MAX_LINKS)
console.log people, links
output =
  nodes: people
  links: links
writeFile('data/people.json', JSON.stringify(output))

console.log "Complete!"
