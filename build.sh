#!/bin/bash

DIR_SCRIPT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)";
rm -f "$DIR_SCRIPT"/*.zip;
zip -r "tasker-permissions-module.zip" "module.prop" "action.sh" "webui" "banner.png" "logo.png";
