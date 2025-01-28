require 'json'
require 'time'

# Helper to check if a date is valid
def valid_date?(year, month, day)
  Date.valid_date?(year, month, day)
rescue ArgumentError
  false
end

# Helper to parse ISO 8601 dates from string
def parse_iso8601(date_string)
  DateTime.parse(date_string).to_time.utc
rescue ArgumentError, TypeError
  nil
end

# Helper to handle incomplete dates
def complete_date(year, month, day)
  # Replace `0` or `00` with valid defaults
  month = 1 if month == 0 || month == 00
  day = 1 if day == 0 || day == 00
  [year, month, day]
end

# Helper to find oldest child's birthdate
def find_oldest_child_date(node_id, nodes, links)
  child_links = links.select { |link| link['source'] == node_id }
  child_nodes = child_links.map { |link| nodes.find { |node| node['id'] == link['target'] } }
  valid_dates = child_nodes.map { |node| parse_iso8601(node['birthDate']) }.compact
  valid_dates.min
end

# Helper to find spouse's birthdate
def find_spouse_date(node_id, nodes, links)
  spouse_links = links.select { |link| link['source'] == node_id || link['target'] == node_id }
                       .select { |link| link['type'] == 'spouse' }
  spouse_ids = spouse_links.map { |link| link['source'] == node_id ? link['target'] : link['source'] }
  spouse_nodes = spouse_ids.map { |id| nodes.find { |node| node['id'] == id } }
  spouse_nodes.map { |node| parse_iso8601(node['birthDate']) }.compact.first
end

# Read JSON data from STDIN
input = STDIN.read

begin
  # Parse the JSON data
  data = JSON.parse(input)
  failed_inferences = 0 # Initialize counter for failed inferences

  # Ensure the structure matches the expected format
  if data.is_a?(Hash) && data['nodes'].is_a?(Array) && data['links'].is_a?(Array)
    nodes = data['nodes']
    links = data['links']

    # Phase 1: Transform all valid birthDates
    nodes.each do |node|
      birth_date = node['birthDate']
      next if birth_date.nil?

      if birth_date.match(/^\d{4}:\d{1,2}:\d{1,2}$/)
        year, month, day = birth_date.split(':').map(&:to_i)
        year, month, day = complete_date(year, month, day)
        if valid_date?(year, month, day)
          node['birthDate'] = Time.new(year, month, day).utc.strftime('%Y-%m-%dT%H:%M:%S.%LZ')
        else
          STDERR.puts "Invalid birthDate for node #{node['id']}: #{birth_date}. Skipping transformation."
        end
      end
    end

    # Phase 2: Infer missing or invalid birthDates
    nodes.each do |node|
      birth_date = node['birthDate']

      # If birthDate is still missing or invalid after transformation, infer the date
      if birth_date.nil?
        inferred_date = find_oldest_child_date(node['id'], nodes, links) ||
                        find_spouse_date(node['id'], nodes, links)

        if inferred_date
          node['birthDate'] = inferred_date.strftime('%Y-%m-%dT00:00:00.000Z')
          node['approximated_birthDate'] = true
          STDERR.puts "Inferred birthdate for node #{node['id']} using advanced method: #{node['birthDate']}."
        else
          failed_inferences += 1
          STDERR.puts "Could not infer birthdate for node #{node['id']}. Leaving it unchanged."
        end
      end
    end
  end

  # Output the transformed JSON to STDOUT
  puts JSON.pretty_generate(data)

  # Print the count of failed inferences to STDERR
  STDERR.puts "Total failed birthdate inferences: #{failed_inferences}"
rescue JSON::ParserError => e
  STDERR.puts "Error parsing JSON: #{e.message}"
  exit 1
rescue => e
  STDERR.puts "Error processing data: #{e.message}"
  exit 1
end
