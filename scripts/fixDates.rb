require 'json'
require 'time'

# Helper method to check if a date is valid
def valid_date?(year, month, day)
  Date.valid_date?(year, month, day)
rescue ArgumentError
  false
end

# Helper method to assign a random valid day if the day is 0
def assign_random_day(year, month)
  days_in_month = Date.new(year, month, -1).day
  rand(1..days_in_month)
end

# Read JSON data from STDIN
input = STDIN.read

begin
  # Parse the JSON data
  data = JSON.parse(input)

  # Ensure the structure matches the expected format
  if data.is_a?(Hash) && data['nodes'].is_a?(Array) && data['links'].is_a?(Array)
    # Transform birthDate format in nodes
    data['nodes'].each do |node|
      birth_date = node['birthDate']

      # Skip transformation if birthDate is nil or not in the correct format
      next if birth_date.nil? || !birth_date.match(/^\d{4}:\d{2}:\d{2}$/)

      # Split date
      year, month, day = birth_date.split(':').map(&:to_i)

      if day == 0 && valid_date?(year, month, 1)
        # Assign a random day if the day is 0
        day = assign_random_day(year, month)
        STDERR.puts "Invalid day for node #{node['id']}: #{birth_date}. Assigned random day #{day}."
      end

      if valid_date?(year, month, day)
        node['birthDate'] = Time.new(year, month, day).utc.strftime('%Y-%m-%dT%H:%M:%S.%LZ')
      else
        STDERR.puts "Invalid date for node #{node['id']}: #{birth_date}. Skipping transformation."
      end
    end
  end

  # Output the transformed JSON to STDOUT
  puts JSON.pretty_generate(data)
rescue JSON::ParserError => e
  STDERR.puts "Error parsing JSON: #{e.message}"
  exit 1
rescue => e
  STDERR.puts "Error processing data: #{e.message}"
  exit 1
end
