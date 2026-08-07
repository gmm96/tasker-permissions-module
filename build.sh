#!/bin/bash

DIR_SCRIPT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)";
rm -f "$DIR_SCRIPT"/*.zip;
zip -r "hidden-permissions.zip" "module.prop" "action.sh" "webui";
