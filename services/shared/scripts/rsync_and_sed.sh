#!bin/bash
#
# Step 1: Use rsync to copy from source to back
rsync -av ./src/ ../back/src/shared/

# Step 2: Use rsync again to copy from source to front
rsync -av ./src/ ../front/src/shared/

# Step 3: Apply sed to every file synced in front. Validator is not imported the same way in the browser.
# See https://github.com/validatorjs/validator.js
# Step 4: add "generated" comment if it does not already exist
comment="/** **** WARNING: GENERATED FROM SHARED DIRECTORY, DO NOT MOFIFY THIS FILE DIRECTLY! **** **/"
front_shared_files=(../front/src/shared/*)
for file in "$front_shared_files"; do
  if [ -f "$file" ]; then
    sed -i '/import validator from "validator";/d' "$file"
  fi
  # Check if the comment already exists in the file
  if ! grep -qF "$comment" "$file"; then
      # If the comment doesn't exist, add it using sed
      sed -i "1i $comment" "$file"
  fi
done

back_shared_files=(../back/src/shared/*)
for file in "$back_shared_files"; do
  # Check if the comment already exists in the file
  if ! grep -qF "$comment" "$file"; then
      # If the comment doesn't exist, add it using sed
      sed -i "1i $comment" "$file"
  fi
done

