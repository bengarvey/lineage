const fs = require('fs');
const Chance = require('chance');
const chance = new Chance();

const GENERATIONS = 10;
const MAX_CHILDREN = 20;
const MIN_CHILDREN = 0;
const INITIAL_PEOPLE = 4000;
const MIN_YEAR = 1800;
const MAX_YEAR = 2014;
const MAX_LINKS = 3000;
let globalID = 0;

console.log("Generating family...");

const generatePeople = (total) => {
  console.log(total);
  const people = [];
  for (let index = 0; index <= total; index++) {
    const person = generatePerson();
    person.id = globalID += 1;
    people.push(person);
  }
  console.log(people.length);
  return people;
};

const generatePerson = () => {
  const gender = chance.gender();
  const first = chance.first({ gender: gender });
  const last = chance.last();
  const name = `${first} ${last}`;

  const birthYear = chance.year({ min: MIN_YEAR, max: MAX_YEAR });
  const deathYear = +birthYear + chance.integer({ min: 1, max: 100 });

  return {
    firstName: first,
    lastName: last,
    name: name,
    gender: gender,
    birthDate: chance.date({ year: birthYear }),
    deathDate: chance.date({ year: deathYear })
  };
};

const generateKidsFromList = (parents) => {
  let kids = [];
  for (let index = 0; index < parents.length - 1; index += 2) {
    const newKids = generateKids(parents[index], parents[index + 1]);
    kids = kids.concat(newKids);
  }
  return kids;
};

const generateKids = (first, second) => {
  let kids = [];
  for (let index = 0; index <= 4; index++) {
    kids.push(generateKid(first, second));
  }
  return kids;
};

const generateKid = (first, second) => {
  const person = generatePerson();
  person.parentId1 = first.id;
  person.parentId2 = second.id;
  return person;
};

const generateMarriages = (singles) => {
  const complete = [];
  let index = 0;
  while (singles.length > 1) {
    const rand = getRandomInt(index + 1, singles.length - 1);

    complete.push(singles[index]);
    complete.push(singles[rand]);

    complete[complete.length - 2].spouseId = singles[rand].id;
    complete[complete.length - 1].spouseId = singles[index].id;

    singles.splice(rand, 1);
    singles.splice(index, 1);
  }
  return complete;
};

const getRandomInt = (min, max) => {
  return Math.ceil(Math.random() * (max - min) + min);
};

const generateLinks = (nodes, total) => {
  const links = [];
  for (let index = 0; index <= total; index++) {
    const source = chance.integer({ min: 0, max: nodes.length - 1 });
    const target = chance.integer({ min: 0, max: nodes.length - 1 });
    const relation = getRelation(nodes[target]);
    const color = getColor(relation);
    const link = {
      source: nodes[source].id,
      target: nodes[target].id,
      color: color,
      relation: relation
    };
    links.push(link);
  }
  return links;
};

const getColor = (relation) => {
  switch (relation) {
    case 'mother':
      return '#933';
    case 'father':
      return '#39F';
    case 'spouse':
      return '#666';
    default:
      return '#111';
  }
};

const getRelation = (node) => {
  if (node.gender === 'Female') return 'mother';
  else if (node.gender === 'Male') return 'father';
};

const writeFile = (file, data) => {
  fs.writeFile(file, data, (err) => {
    if (err) {
      return console.log(err);
    } else {
      console.log("Done.");
    }
  });
};

const link = {
  source: 1,
  target: 0,
  color: '#39F',
  relation: 'father'
};

const people = generatePeople(INITIAL_PEOPLE);
const links = generateLinks(people, MAX_LINKS);
console.log(people, links);
const output = {
  nodes: people,
  links: links
};
writeFile('data/people.json', JSON.stringify(output));

console.log("Complete!");
