#!bin/bash

# Provide the directory path as an argument to the script
directory="$1"

# Check if the directory exists
if [ ! -d "$directory" ]; then
    echo "Directory does not exist."
    exit 1
fi

# Use find to search for files with ".sql" extension in the given directory
# Then, use a for loop to go through each filename and extract only the filenames without extensions
find "$directory" -type f -name "*.sql" -print0 | while IFS= read -r -d '' filename; do
    basename=$(basename "$filename" .sql)

    # Check if the basename matches the desired format (4 digits followed by an underscore)
    if [[ $basename =~ ^[0-9]{4}_ ]]; then
        # Extract the first 4 digits and the rest of the basename
        first_four_digits=${basename:0:4}
        rest_of_basename=${basename:5}

        # Rename the file using the desired format (V<4_digits>__<some_name>.sql)
        new_basename="V${first_four_digits}__${rest_of_basename}"
        new_filename="$directory/$new_basename.sql"
        mv "$filename" "$new_filename"

        echo "Renamed $filename to $new_basename.sql"

        # Update the JSON file if it exists
        json_file="$directory/meta/_journal.json"
        if [ -f "$json_file" ]; then
            jq --arg old_tag "$basename" --arg new_tag "$new_basename" \
               '(.entries[] | select(.tag == $old_tag).tag) |= $new_tag' "$json_file" > "$json_file.tmp"
            mv "$json_file.tmp" "$json_file"
            echo "Renamed $basename to $new_basename in $directory/meta/_journal.json"
        else
            echo "Warning: _journal.json file not found in $directory."
        fi
    else
        echo "Invalid format: $filename"
    fi
done
