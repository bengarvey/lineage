import Chance from 'chance';

const chance = new Chance();

// Constants
const TOTAL_NODES = 10; // This is the number we start with, but we'll end up with more when we add spouses/kids
const MAX_CHILDREN = 5; // Max children per family
const MIN_CHILDREN = 0; // Min children per family
const GENDER_NEUTRAL_NAMES = [
  'Alex', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Riley', 'Avery', 'Quinn', 'Cameron', 'Peyton',
  'Rowan', 'Sawyer', 'Charlie', 'Skyler', 'Dakota', 'Emerson', 'Finley', 'Harper', 'Phoenix', 'River',
  'Bailey', 'Ellis', 'Hayden', 'Jesse', 'Marlowe', 'Shawn', 'Tatum', 'Addison', 'Ash', 'Blake',
  'Emery', 'Kendall', 'Lennon', 'Remy', 'Aiden', 'Angel', 'Ari', 'Blaine', 'Brett', 'Chandler',
  'Corey', 'Dallas', 'Devin', 'Eden', 'Frankie', 'Gray', 'Hollis', 'Indigo', 'Jael', 'Jaden',
  'Kai', 'Kasey', 'Kyrie', 'Lake', 'Lane', 'Linden', 'Lyric', 'Marley', 'Micah', 'Monroe',
  'Noel', 'Oakley', 'Parker', 'Reese', 'Rene', 'Robin', 'Sam', 'Shiloh', 'Sterling', 'Teagan',
  'Tracy', 'Winter', 'Zion', 'Arden', 'August', 'Beau', 'Bellamy', 'Brooks', 'Carter', 'Clarke',
  'Drew', 'Elliot', 'Haven', 'Jules', 'Justice', 'Kit', 'Laurie', 'Leigh', 'Lex', 'London',
  'Max', 'Nico', 'Paris', 'Perry', 'Ray', 'Reagan', 'Sage', 'Shay', 'Toni', 'Vesper',
  'Wren', 'Zephyr', 'Briar', 'Blair', 'Dylan', 'Elliott', 'Harley', 'Jamie', 'Jules', 'Kieran',
  'Luca', 'Remington', 'Sasha', 'Toby', 'Amari', 'Ashby', 'Cypress', 'Dakari', 'Darian', 'Denver',
  'Ellison', 'Fifer', 'Hartley', 'Hollis', 'Ivory', 'Jagger', 'Karsyn', 'Landry', 'Mackenzie', 'Madden',
  'Merritt', 'Mika', 'Murphy', 'Nova', 'Onyx', 'Ozzy', 'Pax', 'Presley', 'Reed', 'Reeve',
  'Rory', 'Scout', 'Storm', 'Tanner', 'Tarian', 'Timber', 'Tyler', 'Valentine', 'Wynn', 'Zayne',
  'Alva', 'Baylor', 'Bowie', 'Brighton', 'Brinley', 'Campbell', 'Cleo', 'Darby', 'Dorsey', 'Ellery',
  'Farren', 'Glenn', 'Greer', 'Hadley', 'Hale', 'Jalen', 'Jensen', 'Jericho', 'Kenley', 'Keegan',
  'Kendrick', 'Kingsley', 'Lark', 'Leighton', 'Lennox', 'Marlow', 'Merrill', 'Orion', 'Palmer', 'Quincy',
  'Reilly', 'Ripley', 'Sailor', 'Shea', 'Sky', 'Tal', 'Thayer', 'Torin', 'True', 'West',
  'Zuri', 'Adair', 'Arlo', 'Ashton', 'Bell', 'Bliss', 'Bowie', 'Bright', 'Callahan', 'Carlin',
  'Clancy', 'Collins', 'Creed', 'Delaney', 'Dempsey', 'Dorian', 'Ellington', 'Fallon', 'Finch', 'Fox',
  'Graydon', 'Hadwin', 'Halston', 'Harlow', 'Haven', 'Joss', 'Keaton', 'Kodi', 'Larkin', 'Leith',
  'Lior', 'Locke', 'Lyle', 'Maris', 'Misha', 'Nev', 'Noa', 'Oak', 'Paxton', 'Quill',
  'Rain', 'Red', 'Reeve', 'Rhys', 'Roscoe', 'Scout', 'Sloan', 'Sorrel', 'Talon', 'Tristan',
  'Vale', 'Whitley', 'Zane', 'Zephyr', 'Adley', 'Ainsley', 'Anderson', 'Ashwin', 'Beckett', 'Bex',
  'Blaise', 'Brady', 'Cal', 'Chesney', 'Clove', 'Cyan', 'Dane', 'Dayton', 'Eero', 'Farrell',
  'Finn', 'Florian', 'Georgie', 'Grayson', 'Guthrie', 'Hale', 'Hart', 'Huxley', 'Ira', 'Isley',
  'Jacoby', 'Jess', 'Jory', 'Kahlo', 'Kirby', 'Kylo', 'Lander', 'Lumen', 'Madden', 'Mavis',
  'Navy', 'Nikita', 'North', 'Oaklee', 'Payson', 'Penn', 'Radley', 'Reese', 'Reid', 'Rogue',
  'Saxon', 'Soren', 'Taegan', 'Tenzin', 'Thea', 'Tory', 'True', 'Vale', 'Wiley', 'Yale',
  'Zane', 'Aeron', 'Aris', 'Arrow', 'Axton', 'Banks', 'Brennan', 'Brogan', 'Callan', 'Channing',
  'Clancy', 'Crosby', 'Dale', 'Dario', 'Edison', 'Evan', 'Faye', 'Flint', 'Ford', 'Frost',
  'Gemini', 'Haley', 'Harlem', 'Indy', 'Jett', 'Jones', 'Kody', 'Land', 'Leif', 'Linden',
  'Lochlan', 'Lux', 'Mace', 'McKinley', 'Meadow', 'Merrick', 'Nevada', 'Oakes', 'Otis', 'Palin',
  'Phoenix', 'Porter', 'Quaid', 'Quinn', 'Ren', 'Ridley', 'Roswell', 'Sparrow', 'Story', 'Sy',
  'Taran', 'Temple', 'Trace', 'Uriah', 'Vale', 'Van', 'Wendell', 'Wilder', 'Xan', 'Zeke',
  'Ziggy', 'Amory', 'Archer', 'Ashland', 'Aspen', 'Barrett', 'Berlin', 'Blaze', 'Bo', 'Brodie',
  'Cadence', 'Cairo', 'Calder', 'Chase', 'Cove', 'Cruz', 'Declan', 'Dune', 'Echo', 'Elian',
  'Elliot', 'Ezra', 'Farrah', 'Finnick', 'Floyd', 'Fraser', 'Garrett', 'Griffin', 'Harper', 'Islay',
  'Israel', 'Jaden', 'Jagger', 'Jem', 'Jericho', 'Juno', 'Kai', 'Kenai', 'Koa', 'Lace',
  'Lane', 'Lyle', 'Mac', 'Magnus', 'Milo', 'Moss', 'Nash', 'Nevin', 'Onyx', 'Oran',
  'Otto', 'Pace', 'Paxton', 'Rafe', 'Raleigh', 'Ranger', 'Ren', 'Rio', 'Roux', 'Ryker',
  'Sequoia', 'Shai', 'Shane', 'Sonny', 'Sorren', 'Stone', 'Taj', 'Tanis', 'Taran', 'Tesla',
  'Tobiah', 'Tobin', 'Torren', 'Trace', 'Trey', 'Tully', 'Wade', 'Wayne', 'Weston', 'Xander',
  'York', 'Zeppelin', 'Zion', 'Ziv',
];
const NON_BINARY_PERCENTAGE = 0.03; // 3%
const SAME_SEX_PERCENTAGE = 0.05; // 5%

const nodes = [];
const links = [];
let currentId = 0;

// Keep track of sibling groups to prevent sibling marriages
const siblingGroups = [];

// Helper Functions
const getRandomBirthDeathDates = () => {
  const birthYear = parseInt(chance.year({ min: 1900, max: 2000 }), 10);
  const minDeathYear = birthYear + 20;
  const maxDeathYear = Math.min(minDeathYear + 80, 2100);

  const deathYear = parseInt(chance.year({ min: minDeathYear, max: maxDeathYear }), 10);

  const birthMonth = chance.integer({ min: 0, max: 11 });
  const birthDay = chance.integer({ min: 1, max: 28 });
  const deathMonth = chance.integer({ min: 0, max: 11 });
  const deathDay = chance.integer({ min: 1, max: 28 });

  const birthDate = new Date(birthYear, birthMonth, birthDay);
  const deathDate = new Date(deathYear, deathMonth, deathDay);

  if (Number.isNaN(birthDate.getTime()) || Number.isNaN(deathDate.getTime())) {
    throw new Error('Invalid date generated');
  }

  return { birthDate, deathDate };
};

const createNode = (gender) => {
  const isNonBinary = Math.random() < NON_BINARY_PERCENTAGE;
  let name;

  if (isNonBinary || gender === 'non-binary') {
    name = chance.pickone(GENDER_NEUTRAL_NAMES);
  } else {
    name = chance.first({ gender: gender.toLowerCase() });
  }

  const { birthDate, deathDate } = getRandomBirthDeathDates();
  currentId += 1;
  const node = {
    id: currentId,
    name,
    gender: isNonBinary ? 'non-binary' : gender,
    lastName: chance.last(),
    birthDate: birthDate.toISOString(),
    deathDate: deathDate.toISOString(),
  };

  nodes.push(node);
  return node;
};

const createLink = (sourceId, targetId, relation, color) => {
  links.push({
    source: sourceId,
    target: targetId,
    relation,
    color,
  });
};

const getParentType = (gender) => {
  if (gender === 'Male') return 'father'; // Blue for father
  if (gender === 'Female') return 'mother'; // Pink for mother
  return 'parent'; // Purple for non-binary parent
};

const createFamilyTree = (parent1, parent2, generation = 1) => {
  const numChildren = chance.integer({ min: MIN_CHILDREN, max: MAX_CHILDREN });
  const siblingGroup = [];

  for (let i = 0; i < numChildren; i += 1) {
    const childGender = chance.gender();
    const child = createNode(childGender);

    // Inherit last name
    child.lastName = chance.pickone([parent1.lastName, parent2.lastName]);

    // Add child to sibling group
    siblingGroup.push(child.id);

    // Color parent-child links based on gender of the parent
    // eslint-disable-next-line no-nested-ternary
    const parent1Color = parent1.gender === 'Male' ? '#0000FF' : (parent1.gender === 'Female' ? '#FFC0CB' : '#800080');
    // eslint-disable-next-line no-nested-ternary
    const parent2Color = parent2.gender === 'Male' ? '#0000FF' : (parent2.gender === 'Female' ? '#FFC0CB' : '#800080');

    // Create parent-child links with appropriate colors
    createLink(parent1.id, child.id, getParentType(parent1.gender), parent1Color);
    createLink(parent2.id, child.id, getParentType(parent2.gender), parent2Color);

    // Recursively generate more families
    if (generation < 3) {
      let spouseGender = chance.gender();
      const isSameSexCouple = Math.random() < SAME_SEX_PERCENTAGE;

      // For same-sex couple, spouse gender matches the child gender
      if (isSameSexCouple) spouseGender = child.gender;

      const spouse = createNode(spouseGender);
      createLink(child.id, spouse.id, 'spouse', '#cc0');

      createFamilyTree(child, spouse, generation + 1);
    }
  }

  // Add sibling group to the siblingGroups list
  if (siblingGroup.length > 1) {
    siblingGroups.push(siblingGroup);
  }
};

// Ensure no siblings marry by checking against sibling groups
const isValidMarriage = (person1Id, person2Id) => {
  // eslint-disable-next-line no-restricted-syntax
  for (const group of siblingGroups) {
    if (group.includes(person1Id) && group.includes(person2Id)) {
      return false; // They are siblings
    }
  }
  return true; // Not siblings
};

const findUnlinkedDescendants = () => {
  const unlinked = [];
  const linked = new Set();

  // Traverse through all links and mark linked individuals as 'spouses'
  links.forEach((link) => {
    if (link.relation === 'spouse') {
      linked.add(link.source);
      linked.add(link.target);
    }
  });

  // Find nodes that are not linked as a spouse
  nodes.forEach((node) => {
    if (!linked.has(node.id)) {
      unlinked.push(node);
    }
  });

  return unlinked;
};

const linkUnlinkedDescendants = () => {
  const unlinked = findUnlinkedDescendants();

  chance.shuffle(unlinked);

  // Pair up unlinked descendants and create spouse relationships
  for (let i = 0; i < unlinked.length - 1; i += 2) {
    const descendant1 = unlinked[i];
    const descendant2 = unlinked[i + 1];

    if (isValidMarriage(descendant1.id, descendant2.id)) {
      // Create a spousal link between them
      createLink(descendant1.id, descendant2.id, 'spouse', '#cc0');

      // Generate children for the newly formed couple
      createFamilyTree(descendant1, descendant2);
    }
  }
};

// Create initial family
const createInitialFamilies = () => {
  const numFamilies = TOTAL_NODES / (MAX_CHILDREN + 2); // Estimate
  for (let i = 0; i < numFamilies; i += 1) {
    const parent1Gender = chance.gender();
    let parent2Gender = chance.gender();

    // Same-sex couple logic
    const isSameSexCouple = Math.random() < SAME_SEX_PERCENTAGE;
    if (isSameSexCouple) parent2Gender = parent1Gender;

    const parent1 = createNode(parent1Gender);
    const parent2 = createNode(parent2Gender);

    // Link parents as spouses
    createLink(parent1.id, parent2.id, 'spouse', '#cc0');

    // Create their family
    createFamilyTree(parent1, parent2);
  }
};

// Run the generator
createInitialFamilies();
linkUnlinkedDescendants();

const dataset = {
  nodes,
  links,
};

// Output the dataset (or write to a file)
console.log(JSON.stringify(dataset, null, 2));
