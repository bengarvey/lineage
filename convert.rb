# Converter
# Ben Garvey
# ben@bengarvey.com
# 2013-06-01
# http://www.bengarvey.com
# http://github.com/bengarvey/lineage

require 'csv'
require 'json'

# The Converter class takes a csv file and converts it to a json file
# that can be read by D3.js
class Converter

  def initialize

  end

  # Converts a csv file to a json file that can be read by D3.js
  def convert

    # Load the csv data into a json string
    all = getJsonFromCsv()

    count = 0
    family = JSON.parse(all)
    nodes = []
    links = []
    max = 4000

    

    # this it to map ids to array positions
    nodeMap = []

    family.each do |member|

      birthYear = getBirthYear(member, family).to_i
      if birthYear == 0
        birthYear = ""
      end

      node = {  "name" => member['Name'], 
                "gender" => member['Gender'], 
                "lastName" => member['Name'].to_s.split(", ")[0],
                "birthYear" => birthYear,
                "deathYear" => member['Deathdate'].to_s.split(":")[0] 
      }

      if node['birthYear'].nil?
        node['birthYear'] = ""
      end

      if node['deathYear'].nil?
        node['deathYear'] = ""
      end

      if member['ID'] != nil && member['ID'].to_i != 0 && /.*(available|unused|timeline).*/i !~ member['Name']
        puts node
        nodes.push(node)
        # Update the node map
        nodeMap[member['ID']] = nodes.length - 1
      end

    end

    links = getLinks(family, nodeMap, max)    

    tree = { "nodes" => nodes, "links" => links }
    file = File.open("data/familyData.json", "w")
    file.write(tree.to_json)
    file.close
 
  end

  def getLinks(family, nodeMap, max)
    links = []

    family.each do |member|

      if (links.length < max)
        if member['SpouseID'] != nil && member['SpouseID'].to_i != 0
          link = {"source" => nodeMap[ member['ID'].to_i ], "target" => nodeMap[ member['SpouseID'].to_i ], "color" => '#CC0', "relation" => 'spouse'}
          links.push(link)
        end

        if member['MotherID'] != nil && member['MotherID'].to_i != 0
          link2 = {"source" => nodeMap[ member['ID'].to_i ], "target" => nodeMap[ member['MotherID'].to_i ], "color" => "#F39", "relation" => 'mother'}
          links.push(link2)
        end

        if member['FatherID'] != nil && member['FatherID'].to_i != 0
          link3 = {"source" => nodeMap[ member['ID'].to_i ], "target" => nodeMap[ member['FatherID'].to_i ], "color" => "#39F", "relation" => 'father'}
          links.push(link3)
        end

      end

    end

  end

  def getJsonFromCsv() 
    all = ""
    
    # Convert CSV to JSON
    CSV.foreach("data/familyData.csv", :headers => true, encoding: "ISO8859-1") do |person|
      jsonPerson = ""
      person.each do |key, value|
        
        # Convert zeroes to null and ints to ints
        if value == "0"
          value = nil
        elsif value.to_i != 0
          value = value.to_i
        end
      
        jsonPerson += "#{key.to_json} : #{value.to_json}, "
      
      end
      
      jsonPerson = jsonPerson.chomp(", ")
      all += "{" + jsonPerson + "},\n"
      
    end

    all = "[" + all.chomp(",\n") + "]"
    return all
  end

  def getBirthYear(member, family)
    birthYear = member['Birthdate'].to_s.split(":")[0].to_i

    # If we have a birth year, return it
    if birthYear != 0
      return birthYear
    else 
      # If we don't have a birthyear, see if they have any kids and add 25 years to their age as an appropriate guess
      # Look through to see if this is anyone's father or mother
      firstKidBirthYear = 99999
      spouseBirthYear = 0
      puts "Can't find one for #{member['Name']}, #{member['ID']}..."
      family.each do |person|
        if (person['MotherID'] == member['ID'] or person['FatherID'] == member['ID'])
          puts "Checking #{person['Name']}, #{person['ID']}..."
          personBirthYear = getBirthYear(person, family)
          if firstKidBirthYear > personBirthYear and personBirthYear > 0
            puts "#{person['Name']} was born in #{personBirthYear}."
            firstKidBirthYear = personBirthYear
          end
        elsif (person['SpouseID'] == member['ID'])
          spouseBirthYear = person['Birthdate'].to_s.split(":")[0].to_i
        end
      end

      birthYearGuess = firstKidBirthYear == 99999 ? 0 : firstKidBirthYear - 25
      puts "New guess for #{member['Name']}, #{member['ID']} is #{birthYearGuess}."
      if birthYearGuess == "" or birthYearGuess == 0
        # If we don't have a guess yet, look at their parents
        family.each do |person|
          if person['ID'] == member['MotherId'] and person['Birthdate'].to_s.split(":")[0].to_i != 0
            birthYearGuess = person['Birthdate'].to_s.split(":")[0].to_i + 30
          elsif person['ID'] == member['FatherId'] and person['Birthdate'].to_s.split(":")[0].to_i != 0
            birthYearGuess = person['Birthdate'].to_s.split(":")[0].to_i + 30
          end
        end
      end

      # If we still have nothing, use the spouse's birth year (or our best guess of it)
      if birthYearGuess == 0 or birthYearGuess == "" and spouseBirthYear != 0
        birthYearGuess = spouseBirthYear
      end

      return birthYearGuess

    end

  end

end

converter = Converter.new
converter.convert
