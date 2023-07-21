#!/bin/bash

# See https://unix.stackexchange.com/questions/492365/opening-new-gnome-terminal-v3-28-with-multiple-tabs-and-different-commands/637537#637537

BASE_DIR=$HOME/zkorum/zkorum

cat << EOF > /tmp/bootstrap_tabs.sh
gnome-terminal --tab -t "OpenAPI" --working-directory="$BASE_DIR" -- \
	zsh -is eval "make dev-generate"
gnome-terminal --tab -t "Shared" --working-directory="$BASE_DIR" -- \
	zsh -is eval "make dev-sync"
gnome-terminal --tab -t "Back" --working-directory="$BASE_DIR" -- \
	zsh -is eval "make dev-back"
gnome-terminal --tab -t "Front" --working-directory="$BASE_DIR" -- \
	zsh -is eval "make dev-front"
gnome-terminal --tab -t "Git" --working-directory="$BASE_DIR"
EOF

gnome-terminal --window --maximize -- bash /tmp/bootstrap_tabs.sh
