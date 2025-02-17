require 'json'

# Load the JSON data from files
nodes_file = 'data/cp_nodes.json'
links_file = 'data/cp_links.json'

nodes_data = JSON.parse(File.read(nodes_file))
links_data = JSON.parse(File.read(links_file))

# Combine the data into a new structure
combined_data = {
  "nodes" => nodes_data,
  "links" => links_data
}

puts(combined_data.to_json)

# Write the combined data to cp_data.json
#File.open('cp_data.json', 'w') do |f|
#  f.write(JSON.pretty_generate(combined_data))
#end

#puts "Data has been successfully combined into cp_data.json!"
