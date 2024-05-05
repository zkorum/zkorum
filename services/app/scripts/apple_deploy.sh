# the json file must contain the API key value described here:
# Using fastlane API Key hash option
# https://docs.fastlane.tools/app-store-connect-api/
# Enter the following info, the file must be present on the computer:
# Certificate (.cer) path:
# Enter path to your .cer
# Private key (.p12) path:
# Enter path to your .p12
# Provisioning profile (.mobileprovision or .provisionprofile) path
# or leave empty to skip this file:
# See:
# https://sarunw.com/posts/how-to-manually-add-existing-certificates-to-fastlane-match/
fastlane match import --readonly true --type appstore --api_key_path $HOME/fastlane/apple_key_id.json
# Will sync the git repo
fastlane match appstore --api_key_path $HOME/fastlane/apple_key_id.json
